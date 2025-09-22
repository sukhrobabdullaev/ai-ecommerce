'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSearchStore } from '@/store/search-store';
import { mockProducts } from '@/data/mock-products';
import { Product } from '@/types';

interface AISearchProps {
    onSearch: (query: string) => void;
    onResults: (products: Product[]) => void;
}

export function AISearch({ onSearch, onResults }: AISearchProps) {
    const { filters, setQuery, voiceState } = useSearchStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiInsights, setAiInsights] = useState<string[]>([]);

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

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        type="text"
                        placeholder="Ask AI anything... (e.g., 'Show me wireless headphones under $200')"
                        value={filters.query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10 pr-20 h-12 text-lg"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!voiceState.transcript}
                        >
                            {voiceState.isListening ? (
                                <MicOff className="h-4 w-4 text-red-500" />
                            ) : (
                                <Mic className="h-4 w-4" />
                            )}
                        </Button>
                        <Button type="submit" size="sm" className="h-8 px-4">
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-1" />
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
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Try these AI searches:</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        'running shoes for flat feet under $150',
                        'comfortable office chair for long work sessions',
                        'camera lens for portrait photography',
                        'wireless headphones with noise cancellation',
                        'gaming keyboard with RGB lighting'
                    ].map((example, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setQuery(example);
                                onSearch(example);
                                processAISearch(example);
                            }}
                            className="text-xs"
                        >
                            {example}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
