'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, Mic, MicOff, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSearchStore } from '@/store/search-store';
import { mockProducts } from '@/data/mock-products';
import { Product } from '@/types';
import { SearchCarousel } from './search-carousel';

interface AISearchProps {
    onSearch: (query: string) => void;
    onResults: (products: Product[]) => void;
}

export function AISearch({ onSearch, onResults }: AISearchProps) {
    const { filters, setQuery, voiceState } = useSearchStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiInsights, setAiInsights] = useState<string[]>([]);
    const [showCarousel, setShowCarousel] = useState(false);

    // Carousel suggestions
    const carouselSuggestions = [
        "Show me wireless headphones under $200",
        "Find a comfortable office chair for long work sessions",
        "I need a camera lens for portrait photography",
        "What are the best gaming keyboards with RGB lighting?",
        "Show me running shoes for flat feet under $150",
        "Find eco-friendly clothing brands",
        "I want a smartwatch with heart rate monitoring",
        "Show me ergonomic furniture for home office"
    ];

    // Mock AI search processing
    const processAISearch = async (query: string) => {
        setIsProcessing(true);

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock AI search logic
        const results = mockProducts.filter(product => {
            const searchTerms = query.toLowerCase().split(' ');
            return searchTerms.some(term =>
                product.name.toLowerCase().includes(term) ||
                product.description.toLowerCase().includes(term) ||
                product.tags.some(tag => tag.toLowerCase().includes(term)) ||
                product.category.toLowerCase().includes(term) ||
                product.brand.toLowerCase().includes(term)
            );
        });

        // Generate AI insights
        const insights = [
            `Found ${results.length} products matching your search`,
            results.length > 0 ? `Top match: ${results[0].name}` : 'No exact matches found',
            'Try being more specific for better results',
            'Consider checking related categories'
        ];

        setAiInsights(insights);
        onResults(results);
        setIsProcessing(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (filters.query.trim()) {
            onSearch(filters.query);
            processAISearch(filters.query);
        }
    };

    const handleVoiceSearch = () => {
        if (voiceState.transcript) {
            setQuery(voiceState.transcript);
            onSearch(voiceState.transcript);
            processAISearch(voiceState.transcript);
        }
    };

    // Process voice search when transcript changes
    useEffect(() => {
        if (voiceState.transcript && !voiceState.isListening) {
            handleVoiceSearch();
        }
    }, [voiceState.transcript, voiceState.isListening]);

    // Auto-start carousel when component mounts
    useEffect(() => {
        setShowCarousel(true);
    }, []);

    // Show carousel when input is focused and empty
    const handleInputFocus = () => {
        setShowCarousel(true);
    };

    const handleInputBlur = () => {
        setTimeout(() => setShowCarousel(false), 200);
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Search Input with Carousel */}
            <form onSubmit={handleSearch} className="relative">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />

                    {/* Carousel Placeholder */}
                    <SearchCarousel
                        suggestions={carouselSuggestions}
                        isVisible={showCarousel && !filters.query}
                        onSuggestionClick={(suggestion) => {
                            setQuery(suggestion);
                            onSearch(suggestion);
                            processAISearch(suggestion);
                        }}
                    />

                    <Input
                        type="text"
                        placeholder={!showCarousel ? "Ask AI anything..." : ""}
                        value={filters.query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="pl-12 pr-32 h-16 text-lg border-2 border-white/20 bg-white/10  text-white focus:border-white/40 focus:bg-white/20 transition-all duration-300 rounded-2xl"
                    />

                    {/* Action Buttons */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                            onClick={() => {
                                if (voiceState.isListening) {
                                    // Stop listening logic here
                                } else {
                                    // Start listening logic here
                                }
                            }}
                        >
                            {voiceState.isListening ? (
                                <MicOff className="h-5 w-5 text-red-400" />
                            ) : (
                                <Mic className="h-5 w-5" />
                            )}
                        </Button>

                        <Button
                            type="submit"
                            size="sm"
                            className="h-10 px-6 bg-white text-gray-900 hover:bg-white/90 font-semibold rounded-full shadow-lg"
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    AI Search
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Voice Search Status */}
            {voiceState.isListening && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium">Listening...</span>
                        </div>
                        {voiceState.transcript && (
                            <p className="text-sm text-muted-foreground mt-1">
                                "{voiceState.transcript}"
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* AI Processing Status */}
            {isProcessing && (
                <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                            <span className="text-sm font-medium">AI is analyzing your request...</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Understanding natural language and finding the best matches
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* AI Insights */}
            {aiInsights.length > 0 && !isProcessing && (
                <Card className="border-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">AI Insights</span>
                        </div>
                        <div className="space-y-1">
                            {aiInsights.map((insight, index) => (
                                <div key={index} className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                                    <p className="text-sm text-muted-foreground">{insight}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search Examples */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-white/80 text-center">Try these AI searches:</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {carouselSuggestions.slice(0, 4).map((example, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setQuery(example);
                                onSearch(example);
                                processAISearch(example);
                            }}
                            className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 rounded-full px-4 py-2"
                        >
                            {example}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
