'use client';

import { useMemo, useState } from 'react';
import { mockProducts } from '@/data/mock-products';
import { Product } from '@/types';
import { useSearchStore } from '@/store/search-store';
import { Hero } from './home/hero';
import { AIRecommendations } from './home/ai-recommendations';
import { FiltersPanel } from './home/filters-panel';
import { ProductsSection } from './home/products-section';
import { Features } from './home/features';

export function HomePage() {
    const { filters } = useSearchStore();
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
    const [viewMode] = useState<'grid' | 'list'>('grid');

    // Mock AI recommendations
    const aiRecommendedProducts = mockProducts
        .filter(product => product.aiRecommendation)
        .slice(0, 4);

    const handleSearch = (query: string) => {
        console.log('Searching for:', query);
        // Search logic will be implemented here
    };

    const handleSearchResults = (results: Product[]) => {
        setFilteredProducts(results);
    };

    const handleFilterChange = (results: Product[]) => {
        setFilteredProducts(results);
    };

    const computedProducts = useMemo(() => {
        let results = [...mockProducts];

        // Query filter
        if (filters.query && filters.query.trim()) {
            const q = filters.query.toLowerCase();
            results = results.filter(p =>
                (
                    p.name + ' ' + p.description + ' ' + p.brand + ' ' + p.category + ' ' + (p.tags || []).join(' ')
                ).toLowerCase().includes(q)
            );
        }

        // Category
        if (filters.category) {
            results = results.filter(p => p.category === filters.category);
        }

        // Brand
        if (filters.brand) {
            results = results.filter(p => p.brand === filters.brand);
        }

        // Rating
        if (filters.rating) {
            results = results.filter(p => p.rating >= filters.rating!);
        }

        // In Stock
        if (filters.inStock) {
            results = results.filter(p => p.inStock);
        }

        // Price range
        results = results.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);

        // Sort
        switch (filters.sortBy) {
            case 'price-low':
                results.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                results.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                results.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                // No createdAt in mock; use id desc as proxy
                results.sort((a, b) => Number(b.id) - Number(a.id));
                break;
            default:
                // relevance: keep current order
                break;
        }

        return results;
    }, [filters]);

    return (
        <div className="min-h-screen bg-background">
            <Hero onSearch={handleSearch} onResults={handleSearchResults} />
            <AIRecommendations products={aiRecommendedProducts} />
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <FiltersPanel />
                        <div className="flex-1">
                            <ProductsSection products={computedProducts} columns={viewMode === 'grid' ? 4 : 1} />
                        </div>
                    </div>
                </div>
            </section>
            <Features />
        </div>
    );
}
