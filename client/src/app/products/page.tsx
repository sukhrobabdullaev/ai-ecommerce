'use client';

import { ProductGrid } from '@/components/product/product-grid';
import { ProductFilters } from '@/components/product/product-filters';
import { mockProducts } from '@/data/mock-products';
import { useSearchStore } from '@/store/search-store';
import { filterProducts } from '@/lib/product-filters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// import { FilteringDemo } from '@/components/research/filtering-demo';

export default function ProductsPage() {
    const { filters, setQuery } = useSearchStore();
    const [searchInput, setSearchInput] = useState(filters.query);
    const [isProductsPage, setIsProductsPage] = useState(true);

    // Filter products based on current filters
    const filteredProducts = useMemo(() => {
        return filterProducts(mockProducts, filters);
    }, [filters]);

    const handleSearch = () => {
        setQuery(searchInput);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">All Products</h1>
                        <p className="text-muted-foreground">
                            Discover our collection with AI-powered search and smart filters
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">AI-Optimized Filtering</span>
                    </div>
                </div>

                {/* Search Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products by name, category, brand, or tags..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="pl-10"
                                />
                            </div>
                            <Button onClick={handleSearch}>
                                Search
                            </Button>
                        </div>
                        {filters.query && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Searching for: <span className="font-semibold">{filters.query}</span>
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-4">
                        <ProductFilters />
                    </div>
                </aside>


                {/* Products Grid */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Results Info */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold">{filteredProducts.length}</span> of{' '}
                            <span className="font-semibold">{mockProducts.length}</span> products
                        </p>
                        {filteredProducts.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Sorted by: <span className="font-medium">{filters.sortBy}</span>
                            </p>
                        )}
                    </div>

                    {/* Products */}
                    <ProductGrid products={filteredProducts} isProductsPage={isProductsPage} />
                </div>
            </div>
        </div>
    );
}