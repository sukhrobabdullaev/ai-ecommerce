'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductGrid } from '@/components/product/product-grid';
import { AISearch } from '@/components/search/ai-search';
import { SearchFilters } from '@/components/search/search-filters';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Grid, List, Sparkles, TrendingUp, Star, Zap } from 'lucide-react';
import { mockProducts } from '@/data/mock-products';
import { Product } from '@/types';

export function HomePage() {
    const [products, setProducts] = useState<Product[]>(mockProducts);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    // Mock AI recommendations
    const aiRecommendedProducts = mockProducts
        .filter(product => product.aiRecommendation)
        .slice(0, 4);

    const featuredProducts = mockProducts.slice(0, 8);
    const trendingProducts = mockProducts
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);

    const handleSearch = (query: string) => {
        console.log('Searching for:', query);
        // Search logic will be implemented here
    };

    const handleSearchResults = (results: Product[]) => {
        setFilteredProducts(results);
    };

    const handleFilterChange = () => {
        // Filter logic will be implemented here
        setFilteredProducts(products);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="gradient-bg text-white py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Header Content */}
                        <div className="text-center space-y-6 mb-12">
                            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                                Shop with AI Intelligence
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                                Discover products through natural conversation, voice search, and personalized AI recommendations
                            </p>
                        </div>

                        {/* AI Search Section */}
                        <div className="flex justify-center mb-16">
                            <AISearch onSearch={handleSearch} onResults={handleSearchResults} />
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            <div className="text-center space-y-2">
                                <div className="text-4xl font-bold">10K+</div>
                                <div className="text-white/80 text-lg">Products</div>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="text-4xl font-bold">98%</div>
                                <div className="text-white/80 text-lg">AI Accuracy</div>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="text-4xl font-bold">24/7</div>
                                <div className="text-white/80 text-lg">AI Assistant</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Recommendations Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex items-center space-x-2 mb-8">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                        <h2 className="text-3xl font-bold">AI Recommendations</h2>
                        <Badge variant="secondary" className="ai-gradient text-white border-0">
                            Powered by AI
                        </Badge>
                    </div>
                    <ProductGrid
                        products={aiRecommendedProducts}
                        showAIRecommendations={true}
                        columns={4}
                    />
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filters Sidebar */}
                        <div className="lg:w-64 space-y-6">
                            <div className="lg:hidden">
                                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <Filter className="h-4 w-4 mr-2" />
                                            Filters
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-80">
                                        <SearchFilters />
                                    </SheetContent>
                                </Sheet>
                            </div>

                            <div className="hidden lg:block">
                                <SearchFilters />
                            </div>
                        </div>

                        {/* Products Section */}
                        <div className="flex-1">
                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                                <div>
                                    <h2 className="text-2xl font-bold">All Products</h2>
                                    <p className="text-muted-foreground">
                                        {filteredProducts.length} products found
                                    </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Products Grid */}
                            <ProductGrid
                                products={filteredProducts}
                                columns={viewMode === 'grid' ? 4 : 1}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Why Choose AI Ecommerce?</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Experience the future of online shopping with our advanced AI-powered features
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="text-center p-6">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="font-semibold mb-2">AI Search</h3>
                            <p className="text-sm text-muted-foreground">
                                Search naturally with voice or text. AI understands context and intent.
                            </p>
                        </Card>

                        <Card className="text-center p-6">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Smart Recommendations</h3>
                            <p className="text-sm text-muted-foreground">
                                Get personalized product suggestions based on your preferences.
                            </p>
                        </Card>

                        <Card className="text-center p-6">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <Zap className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Voice Shopping</h3>
                            <p className="text-sm text-muted-foreground">
                                Shop hands-free with voice commands and natural conversation.
                            </p>
                        </Card>

                        <Card className="text-center p-6">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <Star className="h-6 w-6 text-orange-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Personalized Experience</h3>
                            <p className="text-sm text-muted-foreground">
                                Every interaction is tailored to your unique shopping style.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
