'use client';

import { useState } from 'react';
import { useSearchStore } from '@/store/search-store';
import { useProductStore } from '@/store/product-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductGrid } from '@/components/product/product-grid';
import { ProductFilters } from '@/components/product/product-filters';

interface ProductsPageClientProps {
    initialProducts: any[];
    initialPagination: any;
    initialFilters?: any;
}

export function ProductsPageClient({
    initialProducts,
    initialPagination,
    initialFilters
}: ProductsPageClientProps) {
    const { filters, setQuery } = useSearchStore();
    const {
        products,
        isLoading,
        error,
        pagination,
        fetchProducts,
        searchProducts,
        setFilters
    } = useProductStore();

    const [searchInput, setSearchInput] = useState(filters.query || '');
    const [isProductsPage] = useState(true);

    // Initialize with server data
    useState(() => {
        if (initialProducts) {
            // Set initial data in store
            // This would need to be implemented in the store
        }
    });

    const handleSearch = () => {
        setQuery(searchInput);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <>
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
                    {/* Error State */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Loading products...</span>
                        </div>
                    ) : (
                        <>
                            {/* Results Info */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-semibold">{products.length}</span> of{' '}
                                    <span className="font-semibold">{pagination.total}</span> products
                                </p>
                                {products.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </p>
                                )}
                            </div>

                            {/* Products */}
                            <ProductGrid products={products} isProductsPage={isProductsPage} />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
