'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockProducts } from '@/data/mock-products';
import {
    filterProducts,
    calculateRelevanceScore,
    rankProducts,
    getFilterSuggestions,
} from '@/lib/product-filters';
import { SearchFilters } from '@/types';
import { Sparkles, Brain, Zap, TrendingUp } from 'lucide-react';

/**
 * Demo component showing AI filtering capabilities
 * This can be used for testing and showcasing the filtering system
 */
export function FilteringDemo() {
    const [activeDemo, setActiveDemo] = useState<'basic' | 'ai' | 'hybrid'>('basic');

    // Example queries for testing
    const exampleQueries = [
        { query: 'wireless headphones', label: 'Basic Search' },
        { query: 'gaming keyboard under $200', label: 'Natural Language' },
        { query: 'ergonomic office setup', label: 'Context-Aware' },
    ];

    // Demo 1: Basic Filtering
    const basicFilter: SearchFilters = {
        query: 'wireless',
        category: 'Electronics',
        priceRange: [0, 300],
        sortBy: 'relevance',
    };
    const basicResults = filterProducts(mockProducts, basicFilter);

    // Demo 2: AI-Powered Ranking
    const aiResults = rankProducts(mockProducts, 'gaming keyboard', {
        preferredBrands: ['GameGear', 'StreamPro'],
        preferredCategories: ['Gaming', 'Electronics'],
        priceRange: [50, 200],
    });

    // Demo 3: Relevance Scoring
    const scoredProducts = mockProducts.map((product) => ({
        product,
        score: calculateRelevanceScore(product, 'wireless bluetooth'),
    })).sort((a, b) => b.score - a.score).slice(0, 5);

    // Demo 4: Filter Suggestions
    const suggestions = getFilterSuggestions(mockProducts);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <CardTitle>AI-Optimized Filtering Demo</CardTitle>
                    </div>
                    <CardDescription>
                        Interactive examples showing different filtering and ranking approaches
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">
                                <Zap className="h-4 w-4 mr-2" />
                                Basic
                            </TabsTrigger>
                            <TabsTrigger value="ai">
                                <Brain className="h-4 w-4 mr-2" />
                                AI Ranking
                            </TabsTrigger>
                            <TabsTrigger value="scoring">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Scoring
                            </TabsTrigger>
                            <TabsTrigger value="suggestions">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Suggestions
                            </TabsTrigger>
                        </TabsList>

                        {/* Basic Filtering */}
                        <TabsContent value="basic" className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold">Traditional Filtering</h3>
                                <p className="text-sm text-muted-foreground">
                                    Standard keyword search with category, brand, and price filters
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge>Query: {basicFilter.query}</Badge>
                                    <Badge variant="outline">Category: {basicFilter.category}</Badge>
                                    <Badge variant="outline">
                                        Price: ${basicFilter.priceRange[0]} - ${basicFilter.priceRange[1]}
                                    </Badge>
                                </div>
                            </div>
                            <Card className="bg-muted/50">
                                <CardContent className="pt-4">
                                    <p className="text-sm font-medium mb-2">
                                        Results: {basicResults.length} products
                                    </p>
                                    <div className="space-y-2">
                                        {basicResults.slice(0, 3).map((product) => (
                                            <div
                                                key={product.id}
                                                className="flex justify-between items-center text-sm p-2 bg-background rounded"
                                            >
                                                <span className="font-medium">{product.name}</span>
                                                <Badge variant="secondary">${product.price}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* AI Ranking */}
                        <TabsContent value="ai" className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold">AI-Powered Ranking</h3>
                                <p className="text-sm text-muted-foreground">
                                    Intelligent ranking based on query, user preferences, and context
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge>Query: gaming keyboard</Badge>
                                    <Badge variant="outline">Preferred: GameGear, StreamPro</Badge>
                                    <Badge variant="outline">Price: $50 - $200</Badge>
                                </div>
                            </div>
                            <Card className="bg-muted/50">
                                <CardContent className="pt-4">
                                    <p className="text-sm font-medium mb-2">
                                        Top {aiResults.length} ranked products
                                    </p>
                                    <div className="space-y-2">
                                        {aiResults.slice(0, 3).map((product, idx) => (
                                            <div
                                                key={product.id}
                                                className="flex justify-between items-center text-sm p-2 bg-background rounded"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="default" className="w-6 h-6 p-0 flex items-center justify-center">
                                                        {idx + 1}
                                                    </Badge>
                                                    <span className="font-medium">{product.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant="secondary">${product.price}</Badge>
                                                    {product.brand && (
                                                        <Badge variant="outline">{product.brand}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Relevance Scoring */}
                        <TabsContent value="scoring" className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold">Relevance Scoring System</h3>
                                <p className="text-sm text-muted-foreground">
                                    Transparent scoring showing how products match the query
                                </p>
                                <Badge>Query: wireless bluetooth</Badge>
                            </div>
                            <Card className="bg-muted/50">
                                <CardContent className="pt-4">
                                    <div className="space-y-2">
                                        {scoredProducts.map((item) => (
                                            <div
                                                key={item.product.id}
                                                className="flex justify-between items-center text-sm p-3 bg-background rounded"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.product.name}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.product.tags.slice(0, 3).map((tag) => (
                                                            <Badge key={tag} variant="outline" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">${item.product.price}</Badge>
                                                    <Badge
                                                        variant={item.score > 30 ? 'default' : 'outline'}
                                                        className="min-w-[60px]"
                                                    >
                                                        Score: {item.score}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-3 bg-background rounded text-xs space-y-1">
                                        <p className="font-medium">Scoring Breakdown:</p>
                                        <p>• Exact name match: +50 points</p>
                                        <p>• Partial name match: +30 points</p>
                                        <p>• Category match: +20 points</p>
                                        <p>• Brand match: +15 points</p>
                                        <p>• Tag matches: +10 points each</p>
                                        <p>• Description match: +5 points</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Filter Suggestions */}
                        <TabsContent value="suggestions" className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold">Dynamic Filter Suggestions</h3>
                                <p className="text-sm text-muted-foreground">
                                    AI can use these suggestions to help users refine their search
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-muted/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Categories</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.categories.map((category) => (
                                                <Badge key={category} variant="outline">
                                                    {category}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-muted/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Brands</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.brands.slice(0, 8).map((brand) => (
                                                <Badge key={brand} variant="outline">
                                                    {brand}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-muted/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Popular Tags</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.tags.slice(0, 12).map((tag) => (
                                                <Badge key={tag} variant="secondary">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-muted/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Price Range</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Min Price:</span>
                                                <span className="font-semibold">
                                                    ${suggestions.priceRange[0].toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Max Price:</span>
                                                <span className="font-semibold">
                                                    ${suggestions.priceRange[1].toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Example Queries */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Try These Example Queries</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {exampleQueries.map((example) => (
                            <Button key={example.query} variant="outline" size="sm">
                                {example.label}: "{example.query}"
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
