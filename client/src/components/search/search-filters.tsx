'use client';

import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSearchStore } from '@/store/search-store';
import { categories, brands } from '@/data/mock-products';
import { X } from 'lucide-react';

export function SearchFilters() {
    const { filters, updateFilters, clearFilters } = useSearchStore();

    const handlePriceChange = (value: number[]) => {
        updateFilters({ priceRange: [value[0], value[1]] });
    };

    const handleCategoryChange = (category: string) => {
        updateFilters({ category: category === 'All' ? undefined : category });
    };

    const handleBrandChange = (brand: string) => {
        updateFilters({ brand: brand === 'All' ? undefined : brand });
    };

    const handleRatingChange = (rating: string) => {
        updateFilters({ rating: rating === 'All' ? undefined : parseInt(rating) });
    };

    const handleInStockChange = (inStock: boolean) => {
        updateFilters({ inStock: inStock ? true : undefined });
    };

    const handleSortChange = (sortBy: string) => {
        updateFilters({ sortBy: sortBy as any });
    };

    const hasActiveFilters =
        filters.category ||
        filters.brand ||
        filters.rating ||
        filters.inStock ||
        filters.priceRange[0] > 0 ||
        filters.priceRange[1] < 10000;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                    </Button>
                )}
            </div>

            {/* Sort By */}
            <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Price Range */}
            <div className="space-y-3">
                <Label>Price Range</Label>
                <div className="px-2">
                    <Slider
                        value={filters.priceRange}
                        onValueChange={handlePriceChange}
                        max={10000}
                        min={0}
                        step={50}
                        className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>${filters.priceRange[0]}</span>
                        <span>${filters.priceRange[1]}</span>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Category */}
            <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.category || 'All'} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Brand */}
            <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={filters.brand || 'All'} onValueChange={handleBrandChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Brands</SelectItem>
                        {brands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                                {brand}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Rating */}
            <div className="space-y-2">
                <Label>Minimum Rating</Label>
                <Select value={filters.rating?.toString() || 'All'} onValueChange={handleRatingChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Ratings</SelectItem>
                        <SelectItem value="4">4+ Stars</SelectItem>
                        <SelectItem value="3">3+ Stars</SelectItem>
                        <SelectItem value="2">2+ Stars</SelectItem>
                        <SelectItem value="1">1+ Stars</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* In Stock Only */}
            <div className="flex items-center space-x-2">
                <Switch
                    id="in-stock"
                    checked={filters.inStock || false}
                    onCheckedChange={handleInStockChange}
                />
                <Label htmlFor="in-stock">In Stock Only</Label>
            </div>
        </div>
    );
}
