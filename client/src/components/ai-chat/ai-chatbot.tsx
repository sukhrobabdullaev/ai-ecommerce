'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, X, Bot, User, Sparkles, ShoppingCart, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { useSearchStore } from '@/store/search-store';
import { mockProducts } from '@/data/mock-products';
import { Product } from '@/types';

interface ChatMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    action?: {
        type: 'search' | 'add_to_cart' | 'add_to_wishlist' | 'remove_from_cart' | 'remove_from_wishlist';
        data?: any;
    };
}

interface AIChatbotProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIChatbot({ isOpen, onClose }: AIChatbotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            type: 'ai',
            content: "👋 Hi! I'm your AI shopping assistant. I can help you find products, manage your cart & wishlist, and answer questions. Try saying 'find headphones' or 'show me laptops'!",
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const { addItem, removeItem, items: cartItems } = useCartStore();
    const { addToFavorites, removeFromFavorites, items: wishlistItems } = useFavoritesStore();
    const { setQuery } = useSearchStore();

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(transcript);
                handleSendMessage(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const handleSendMessage = async (message?: string) => {
        const userMessage = message || inputMessage.trim();
        if (!userMessage) return;

        // Add user message
        const newUserMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: userMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        setIsProcessing(true);

        // Process AI response
        const aiResponse = await processAIRequest(userMessage);

        const newAIMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: aiResponse.content,
            timestamp: new Date(),
            action: aiResponse.action
        };

        setMessages(prev => [...prev, newAIMessage]);
        setIsProcessing(false);
    };

    const processAIRequest = async (message: string): Promise<{ content: string; action?: any }> => {
        const lowerMessage = message.toLowerCase().trim();

        // Lightweight NLP helpers
        const tokenize = (text: string): string[] =>
            text
                .toLowerCase()
                .split(/[^a-z0-9]+/)
                .filter(Boolean);

        const synonymsMap: Record<string, string[]> = {
            laptop: ['laptop', 'notebook', 'ultrabook', 'computer', 'macbook'],
            phone: ['phone', 'smartphone', 'iphone', 'android'],
            shoes: ['shoes', 'sneakers', 'trainer', 'running', 'footwear'],
            headphone: ['headphone', 'headphones', 'earbud', 'earbuds', 'earphone', 'earphones', 'audio'],
            camera: ['camera', 'dslr', 'mirrorless', 'lens', 'photography'],
            chair: ['chair', 'office', 'ergonomic', 'seat'],
            watch: ['watch', 'smartwatch', 'wearable']
        };

        const expandTermsWithSynonyms = (terms: string[]): string[] => {
            const expanded = new Set<string>();
            for (const t of terms) {
                expanded.add(t);
                for (const [key, list] of Object.entries(synonymsMap)) {
                    if (t.includes(key) || list.includes(t)) {
                        list.forEach((w) => expanded.add(w));
                    }
                }
            }
            return Array.from(expanded);
        };

        const scoreProduct = (product: Product, terms: string[]): number => {
            let score = 0;
            const fields = [
                product.name,
                product.description,
                product.brand,
                product.category,
                ...(product.tags || [])
            ]
                .join(' ')
                .toLowerCase();
            for (const term of terms) {
                if (!term) continue;
                if (fields.includes(term)) score += 3;
                // simple prefix boost
                if (fields.includes(` ${term}`) || fields.startsWith(term)) score += 1;
            }
            return score;
        };

        // Handle very short messages or single words
        if (message.length <= 3) {
            return {
                content: "I need a bit more information to help you. Could you tell me what you're looking for? For example: 'search for headphones' or 'show me laptops'"
            };
        }

        // Direct product search for short queries
        if (message.length <= 20 && !lowerMessage.includes('search') && !lowerMessage.includes('find') && !lowerMessage.includes('show')) {
            const baseTerms = tokenize(message);
            const terms = expandTermsWithSynonyms(baseTerms);
            const scored = mockProducts
                .map((p) => ({ p, s: scoreProduct(p, terms) }))
                .filter(({ s }) => s > 0)
                .sort((a, b) => b.s - a.s)
                .map(({ p }) => p);

            if (scored.length > 0) {
                setQuery(message);
                return {
                    content: `I found ${scored.length} products related to "${message}". Top matches: ${scored
                        .slice(0, 3)
                        .map((p) => p.name)
                        .join(', ')}`,
                    action: { type: 'search', data: { query: message, results: scored } }
                };
            }
            return {
                content: `I couldn't find any exact matches for "${message}". Try a related term like "headphones", "laptop", or "shoes" and I'll search again.`
            };
        }

        // Search functionality
        if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('show me') || lowerMessage.includes('looking for')) {
            const searchQuery = extractSearchQuery(message);
            setQuery(searchQuery);
            const baseTerms = tokenize(searchQuery);
            const terms = expandTermsWithSynonyms(baseTerms);
            const scored = mockProducts
                .map((p) => ({ p, s: scoreProduct(p, terms) }))
                .filter(({ s }) => s > 0)
                .sort((a, b) => b.s - a.s)
                .map(({ p }) => p);

            return {
                content: `I found ${scored.length} products for "${searchQuery}". Top matches: ${scored
                    .slice(0, 3)
                    .map((p) => p.name)
                    .join(', ')}`,
                action: { type: 'search', data: { query: searchQuery, results: scored } }
            };
        }

        // Add to cart functionality
        if (lowerMessage.includes('add to cart') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
            const productName = extractProductName(message);
            const product = mockProducts.find(p =>
                p.name.toLowerCase().includes(productName.toLowerCase())
            );

            if (product) {
                addItem(product, 1);
                return {
                    content: `I've added "${product.name}" to your cart! You now have ${cartItems.length + 1} items in your cart.`,
                    action: { type: 'add_to_cart', data: product }
                };
            } else {
                return {
                    content: `I couldn't find a product matching "${productName}". Could you be more specific?`
                };
            }
        }

        // Add to wishlist functionality
        if (lowerMessage.includes('add to wishlist') || lowerMessage.includes('save') || lowerMessage.includes('favorite')) {
            const productName = extractProductName(message);
            const product = mockProducts.find(p =>
                p.name.toLowerCase().includes(productName.toLowerCase())
            );

            if (product) {
                addToFavorites(product);
                return {
                    content: `I've added "${product.name}" to your wishlist! You now have ${wishlistItems.length + 1} items in your wishlist.`,
                    action: { type: 'add_to_wishlist', data: product }
                };
            } else {
                return {
                    content: `I couldn't find a product matching "${productName}". Could you be more specific?`
                };
            }
        }

        // Remove from cart
        if (lowerMessage.includes('remove from cart') || lowerMessage.includes('delete from cart')) {
            const productName = extractProductName(message);
            const cartItem = cartItems.find(item =>
                item.product.name.toLowerCase().includes(productName.toLowerCase())
            );

            if (cartItem) {
                removeItem(cartItem.product.id);
                return {
                    content: `I've removed "${cartItem.product.name}" from your cart.`,
                    action: { type: 'remove_from_cart', data: cartItem.product }
                };
            } else {
                return {
                    content: `I couldn't find "${productName}" in your cart.`
                };
            }
        }

        // Cart status
        if (lowerMessage.includes('cart') || lowerMessage.includes('shopping cart')) {
            if (cartItems.length === 0) {
                return {
                    content: "Your cart is empty. Would you like me to help you find some products?"
                };
            } else {
                const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
                return {
                    content: `You have ${totalItems} items in your cart worth $${totalPrice.toFixed(2)}. Items: ${cartItems.map(item => item.product.name).join(', ')}`
                };
            }
        }

        // Wishlist status
        if (lowerMessage.includes('wishlist') || lowerMessage.includes('favorites')) {
            if (wishlistItems.length === 0) {
                return {
                    content: "Your wishlist is empty. Would you like me to help you find some products to save for later?"
                };
            } else {
                return {
                    content: `You have ${wishlistItems.length} items in your wishlist: ${wishlistItems.map(item => item.name).join(', ')}`
                };
            }
        }

        // Default response with more variety
        const defaultResponses = [
            "I can help you search for products, manage your cart and wishlist, or answer questions about our products. What would you like to do?",
            "I'm here to help you shop! Try saying things like 'find headphones', 'add to cart', or 'show my wishlist'.",
            "What can I help you find today? I can search products, add items to your cart, or manage your wishlist.",
            "I'm your shopping assistant! Tell me what you're looking for or what you'd like to do.",
            "Ready to help you shop! You can ask me to find products, add items to cart, or check your wishlist."
        ];

        const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];

        return {
            content: randomResponse
        };
    };

    const extractSearchQuery = (message: string): string => {
        const searchKeywords = ['search for', 'find', 'show me', 'looking for'];
        for (const keyword of searchKeywords) {
            const index = message.toLowerCase().indexOf(keyword);
            if (index !== -1) {
                return message.substring(index + keyword.length).trim();
            }
        }
        return message;
    };

    const extractProductName = (message: string): string => {
        // Simple extraction - in a real app, you'd use more sophisticated NLP
        const words = message.split(' ');
        const productWords = words.filter(word =>
            !['add', 'to', 'cart', 'wishlist', 'buy', 'purchase', 'save', 'favorite', 'remove', 'delete', 'from'].includes(word.toLowerCase())
        );
        return productWords.join(' ');
    };

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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
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
                                const isUser = message.type === 'user';
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
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
