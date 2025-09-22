'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSearchStore } from '@/store/search-store';
import { mockProducts } from '@/data/mock-products';

export function SearchSuggestions() {
    const { searchHistory, filters } = useSearchStore();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [trending, setTrending] = useState<string[]>([]);

    useEffect(() => {
        // Mock trending searches
        setTrending([
            'wireless headphones',
            'gaming keyboard',
            'office chair',
            'smart watch',
            'camera lens'
        ]);

        // Generate suggestions based on query
        if (filters.query.trim()) {
            const query = filters.query.toLowerCase();
            const productSuggestions = mockProducts
                .map(product => product.name)
                .filter(name => name.toLowerCase().includes(query))
                .slice(0, 5);

            setSuggestions(productSuggestions);
        }
    }, [filters.query]);

    const handleSuggestionClick = (suggestion: string) => {
        // TODO: Implement search with suggestion
        console.log('Searching for:', suggestion);
    };

    return (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 space-y-4">
                {/* Recent Searches */}
                {searchHistory.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground mb-2">
                            <Clock className="h-4 w-4" />
                            <span>Recent Searches</span>
                        </div>
                        <div className="space-y-1">
                            {searchHistory.slice(0, 5).map((query, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(query)}
                                    className="flex items-center space-x-2 w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                                >
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{query}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground mb-2">
                            <Search className="h-4 w-4" />
                            <span>Suggestions</span>
                        </div>
                        <div className="space-y-1">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="flex items-center space-x-2 w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                                >
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{suggestion}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trending Searches */}
                <div>
                    <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Trending</span>
                    </div>
                    <div className="space-y-1">
                        {trending.map((trend, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(trend)}
                                className="flex items-center space-x-2 w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                            >
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{trend}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI Search Examples */}
                <div>
                    <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground mb-2">
                        <span className="ai-gradient bg-clip-text text-transparent">🤖</span>
                        <span>AI Search Examples</span>
                    </div>
                    <div className="space-y-1">
                        {[
                            'Show me running shoes for flat feet under $150',
                            'Find a comfortable office chair for long work sessions',
                            'I need a camera lens for portrait photography',
                            'What are the best wireless headphones for music?'
                        ].map((example, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(example)}
                                className="flex items-center space-x-2 w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                            >
                                <span className="text-sm text-muted-foreground italic">"{example}"</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
