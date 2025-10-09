'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, MicOff, X, Bot, User, ShoppingCart, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';

// Types based on database models from PROJECT_MODELS.md
type ChatType = 'TEXT' | 'AUDIO' | 'MIXED';
type ContentType = 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'MIXED';
type MessageRole = 'user' | 'assistant' | 'system';

type ChatAction = {
    type: 'search' | 'add_to_cart' | 'add_to_wishlist' | 'remove_from_cart' | 'remove_from_wishlist';
    data?: unknown;
};

interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    contentType: ContentType;
    timestamp: Date;
    inputAudioUrl?: string;
    outputAudioUrl?: string;
    transcription?: string;
    action?: ChatAction;
    systemUsed?: string;
    modelUsed?: string;
    voiceModelUsed?: string;
    responseTime?: number;
    feedbackRating?: number;
}

interface AIChatbotProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIChatbotUpdated({ isOpen, onClose }: AIChatbotProps) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [chatType, setChatType] = useState<ChatType>('TEXT');

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: "👋 Hi! I'm your AI shopping assistant. I can help you find products, manage your cart & wishlist, and answer questions. Try saying 'find headphones' or 'show me laptops'!",
            contentType: 'TEXT',
            timestamp: new Date(),
            systemUsed: 'GENERAL_LLM'
        }
    ]);

    const [inputMessage, setInputMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSendMessageRef = useRef<any>(null);

    const { items: cartItems } = useCartStore();
    const { items: wishlistItems } = useFavoritesStore();

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

    // LLM API function
    const sendToLLM = useCallback(async (message: string) => {
        try {
            const res = await fetch('/api/ai/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    sessionId,
                    chatType,
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });
            if (!res.ok) throw new Error('LLM request failed');
            const data = await res.json();
            return {
                ...data,
                modelUsed: data.modelUsed || 'gpt-4o',
                systemUsed: data.systemUsed || 'GENERAL_LLM'
            };
        } catch (e) {
            console.warn('LLM call failed, falling back to local processor.', e);
            return null;
        }
    }, [sessionId, chatType, messages]);

    // Simple local processing function
    const processLocalRequest = useCallback(async (message: string) => {
        // Using a simplified version here - would contain all the product search logic
        const lowerMessage = message.toLowerCase().trim();

        if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
            return {
                content: `I found some products related to your search for "${message}".`,
                action: { type: 'search', data: { query: message } }
            };
        }

        if (lowerMessage.includes('cart')) {
            return {
                content: `You have ${cartItems.length} items in your cart.`
            };
        }

        if (lowerMessage.includes('wishlist') || lowerMessage.includes('favorite')) {
            return {
                content: `You have ${wishlistItems.length} items in your wishlist.`
            };
        }

        // Default response
        return {
            content: "I'm your AI shopping assistant. How can I help you today?"
        };
    }, [cartItems.length, wishlistItems.length]);

    // Send message function
    const handleSendMessage = useCallback(async (message?: string) => {
        const userMessage = message || inputMessage.trim();
        if (!userMessage) return;

        const startTime = Date.now();
        const messageType = isListening ? 'AUDIO' : 'TEXT';

        if (!sessionId) {
            // Create a new session if one doesn't exist
            const sessionType = messageType === 'AUDIO' ? 'AUDIO' : 'TEXT';
            setChatType(sessionType as ChatType);
            setSessionId(Date.now().toString());
        }

        // Add user message
        const newUserMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            contentType: messageType as ContentType,
            timestamp: new Date(),
            transcription: isListening ? userMessage : undefined
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        setIsProcessing(true);

        // Try sending to remote LLM endpoint first. If it fails, fallback to local lightweight processor.
        let aiResponse = await sendToLLM(userMessage);
        if (!aiResponse) {
            aiResponse = await processLocalRequest(userMessage);
        }

        const responseTime = Date.now() - startTime;

        const newAIMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: aiResponse.content,
            contentType: 'TEXT',
            timestamp: new Date(),
            action: aiResponse.action,
            systemUsed: aiResponse.systemUsed || 'GENERAL_LLM',
            modelUsed: aiResponse.modelUsed || 'local-fallback',
            responseTime
        };

        setMessages(prev => [...prev, newAIMessage]);
        setIsProcessing(false);
    }, [inputMessage, isListening, processLocalRequest, sendToLLM, sessionId, setInputMessage, setIsProcessing, setMessages]);

    // Keep a ref to the latest handler so the speech recognition effect can call it
    useEffect(() => {
        handleSendMessageRef.current = handleSendMessage;
    }, [handleSendMessage]);

    // Initialize speech recognition
    useEffect(() => {
        // Initialize speech recognition with interim results for real-time understanding
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: unknown) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const e = event as any;
                let interim = '';
                let finalTranscript = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const result = e.results[i];
                    const t = result[0].transcript;
                    if (result.isFinal) {
                        finalTranscript += t;
                    } else {
                        interim += t;
                    }
                }

                // show interim text to the user while they speak
                if (interim) {
                    setInputMessage(interim);
                }
                // when final result arrives, send it
                if (finalTranscript) {
                    setInputMessage(finalTranscript);
                    // use ref to call latest handler without adding it to deps
                    handleSendMessageRef.current(finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event: unknown) => {
                console.error('Speech recognition error:', event);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current) {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-6 bottom-24 z-50 w-[90vw] max-w-md animate-in fade-in duration-200">
            <Card className="w-full h-[600px] flex flex-col shadow-2xl overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky -top-6 bg-white z-10 pt-3">
                    <CardTitle className="flex items-center space-x-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <span>AI Assistant</span>
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1 px-4 py-2">
                        <div className="space-y-4">
                            {messages.map((message) => {
                                const isUser = message.role === 'user';
                                return (
                                    <div key={message.id} className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        {!isUser && (
                                            <Avatar className="h-8 w-8 mr-2">
                                                <AvatarFallback>
                                                    <Bot className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${isUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                            <div className="mt-1 flex items-center space-x-2">
                                                {message.action && (
                                                    <>
                                                        {message.action.type === 'add_to_cart' && (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                <ShoppingCart className="h-3 w-3 mr-1" />
                                                                Added to Cart
                                                            </Badge>
                                                        )}
                                                        {message.action.type === 'add_to_wishlist' && (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                <Heart className="h-3 w-3 mr-1" />
                                                                Added to Wishlist
                                                            </Badge>
                                                        )}
                                                        {message.action.type === 'search' && (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                <Search className="h-3 w-3 mr-1" />
                                                                Search Results
                                                            </Badge>
                                                        )}
                                                    </>
                                                )}
                                                {message.role === 'assistant' && !isUser && (
                                                    <div className="flex items-center space-x-1">
                                                        {message.feedbackRating ? (
                                                            <span className="text-[10px] text-green-500">
                                                                {message.feedbackRating > 3 ? '👍' : '👎'}
                                                            </span>
                                                        ) : (
                                                            <div className="flex space-x-1">
                                                                <button
                                                                    className="text-[10px] hover:text-green-500 transition-colors"
                                                                    onClick={() => {
                                                                        setMessages(prev => prev.map(m =>
                                                                            m.id === message.id ? { ...m, feedbackRating: 5 } : m
                                                                        ));
                                                                    }}
                                                                >
                                                                    👍
                                                                </button>
                                                                <button
                                                                    className="text-[10px] hover:text-red-500 transition-colors"
                                                                    onClick={() => {
                                                                        setMessages(prev => prev.map(m =>
                                                                            m.id === message.id ? { ...m, feedbackRating: 1 } : m
                                                                        ));
                                                                    }}
                                                                >
                                                                    👎
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {message.responseTime && message.role === 'assistant' ? ` · ${Math.round(message.responseTime / 100) / 10}s` : ''}
                                                </span>
                                            </div>
                                        </div>
                                        {isUser && (
                                            <Avatar className="h-8 w-8 ml-2">
                                                <AvatarFallback>
                                                    <User className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                );
                            })}
                            {isProcessing && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg p-3">
                                        <div className="flex items-center space-x-2">
                                            <Bot className="h-4 w-4" />
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div ref={messagesEndRef} />
                    </ScrollArea>

                    <div className="p-4 border-t">
                        <div className="flex space-x-2">
                            <Input
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1"
                                disabled={isProcessing}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={isListening ? stopListening : startListening}
                                className={isListening ? 'bg-red-100 text-red-600' : ''}
                            >
                                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>
                            <Button
                                onClick={() => handleSendMessage()}
                                disabled={!inputMessage.trim() || isProcessing}
                                size="icon"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}