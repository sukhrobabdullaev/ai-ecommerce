'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/store/chat-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

// Speech Recognition types
declare global {
    interface Window {
        webkitSpeechRecognition: {
            new(): {
                continuous: boolean
                interimResults: boolean
                lang: string
                onresult: (event: {
                    results: {
                        [key: number]: {
                            [key: number]: { transcript: string }
                        }
                    }
                }) => void
                onerror: () => void
                onend: () => void
                start: () => void
                stop: () => void
            }
        }
    }
}

export function ResearchChatInterface() {
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const {
        currentSession,
        selectedSystem,
        isRecording,
        createSession,
        addMessage,
        switchSystem,
        setRecording,
        logInteraction,
    } = useChatStore()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [currentSession?.messages])

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        setIsLoading(true)

        // Create session if none exists
        if (!currentSession) {
            createSession(selectedSystem)
        }

        // Add user message
        addMessage({
            role: 'USER',
            content: userMessage,
            messageType: 'TEXT',
        })

        // Log interaction for research
        await logInteraction('TEXT_INPUT', {
            query: userMessage,
            systemUsed: selectedSystem,
        })

        try {
            const startTime = performance.now()

            // Call appropriate AI system
            const endpoint = selectedSystem === 'LLM_PROMPTING'
                ? '/api/ai/llm-chat'
                : '/api/ai/ml-recommendations'

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId: currentSession?.id,
                    context: currentSession?.messages || [],
                }),
            })

            const data = await response.json()
            const endTime = performance.now()
            const responseTime = endTime - startTime

            // Add AI response
            addMessage({
                role: 'ASSISTANT',
                content: data.response,
                messageType: 'TEXT',
                systemUsed: selectedSystem,
                modelUsed: data.modelUsed,
                responseTime,
                relatedProducts: data.relatedProducts,
            })

        } catch (error) {
            console.error('Failed to send message:', error)
            addMessage({
                role: 'ASSISTANT',
                content: 'Sorry, I encountered an error. Please try again.',
                messageType: 'TEXT',
                systemUsed: selectedSystem,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleVoiceInput = async () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser')
            return
        }

        const recognition = new window.webkitSpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        if (isRecording) {
            setRecording(false)
            recognition.stop()
            return
        }

        setRecording(true)

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript
            setInput(transcript)
            setRecording(false)

            // Log voice interaction
            await logInteraction('VOICE_INPUT', {
                transcript,
                systemUsed: selectedSystem,
            })
        }

        recognition.onerror = () => {
            setRecording(false)
        }

        recognition.onend = () => {
            setRecording(false)
        }

        recognition.start()
    }

    const handleSystemSwitch = (system: 'LLM_PROMPTING' | 'DOMAIN_ML') => {
        switchSystem(system)
        logInteraction('SYSTEM_SWITCH', {
            from: selectedSystem,
            to: system,
        })
    }

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            {/* Header with system selection */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">AI Research Chat</h2>
                    <Badge variant="secondary" className="text-xs">
                        Research Mode
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={selectedSystem === 'LLM_PROMPTING' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSystemSwitch('LLM_PROMPTING')}
                    >
                        LLM Prompting
                    </Button>
                    <Button
                        variant={selectedSystem === 'DOMAIN_ML' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSystemSwitch('DOMAIN_ML')}
                    >
                        Domain ML
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!currentSession?.messages.length && (
                    <Card className="p-6 text-center">
                        <CardContent>
                            <h3 className="text-lg font-medium mb-2">
                                Welcome to the AI Research Platform
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Test and compare different AI systems for e-commerce.
                                Try queries like:
                            </p>
                            <div className="space-y-1 text-sm">
                                <div>• &ldquo;Find running shoes under $100&rdquo;</div>
                                <div>• &ldquo;Recommend a laptop for college&rdquo;</div>
                                <div>• &ldquo;Show me wireless headphones&rdquo;</div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {currentSession?.messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex",
                            message.role === 'USER' ? "justify-end" : "justify-start"
                        )}
                    >
                        <Card
                            className={cn(
                                "max-w-[80%]",
                                message.role === 'USER'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                            )}
                        >
                            <CardContent className="p-3">
                                <div className="text-sm">{message.content}</div>

                                {/* AI system info */}
                                {message.role === 'ASSISTANT' && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        <Badge variant="outline" className="text-xs">
                                            {message.systemUsed === 'LLM_PROMPTING' ? 'LLM' : 'ML'}
                                        </Badge>
                                        {message.responseTime && (
                                            <span>{Math.round(message.responseTime)}ms</span>
                                        )}
                                        {message.modelUsed && (
                                            <span>• {message.modelUsed}</span>
                                        )}
                                    </div>
                                )}

                                {/* Related products */}
                                {message.relatedProducts && message.relatedProducts.length > 0 && (
                                    <div className="mt-2">
                                        <div className="text-xs text-muted-foreground mb-1">
                                            Related Products:
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {message.relatedProducts.slice(0, 3).map((productId) => (
                                                <Badge key={productId} variant="secondary" className="text-xs">
                                                    Product {productId.slice(-4)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <Card className="bg-muted">
                            <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                                    <span className="text-sm">
                                        {selectedSystem === 'LLM_PROMPTING' ? 'LLM' : 'ML'} thinking...
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about products or get recommendations..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleVoiceInput}
                        variant={isRecording ? "destructive" : "outline"}
                        size="icon"
                        className="shrink-0"
                    >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}