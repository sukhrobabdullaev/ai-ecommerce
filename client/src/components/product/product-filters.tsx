'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useSearchStore } from '@/store/search-store';
import { useCategoryStore } from '@/store/category-store';
import { useProductStore } from '@/store/product-store';
import { Filter, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SearchFilters } from '@/types';

export function ProductFilters() {
    const { filters, updateFilters, clearFilters } = useSearchStore();
    const { categories, isLoading: categoriesLoading, fetchCategories } = useCategoryStore();
    const { products, fetchProducts } = useProductStore();
    const [expandedSections, setExpandedSections] = useState({
        price: true,
        category: true,
        brand: true,
        tags: false,
        stock: true,
    });

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories({ active_only: true });
    }, [fetchCategories]);

    // Extract brands from products
    const brands = Array.from(
        new Set(products.map((p) => p.brand).filter(Boolean))
    ) as string[];

    // Extract tags from products
    const allTags = Array.from(new Set(products.flatMap((p) => p.tags || [])));

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handlePriceChange = (value: number[]) => {
        updateFilters({ priceRange: [value[0], value[1]] });
    };

    const handleCategoryChange = (categoryId: string) => {
        updateFilters({ category_id: categoryId === 'all' ? undefined : categoryId });
    };

    const handleBrandChange = (brand: string) => {
        updateFilters({ brand: brand === 'All' ? undefined : brand });
    };

    const handleTagToggle = (tag: string) => {
        const currentTags = filters.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        updateFilters({ tags: newTags.length > 0 ? newTags : undefined });
    };

    const handleInStockChange = (checked: boolean) => {
        updateFilters({ inStock: checked ? true : undefined });
    };

    const handleSortChange = (sortBy: string) => {
        updateFilters({ sortBy: sortBy as SearchFilters['sortBy'] });
    };

    const hasActiveFilters =
        filters.category ||
        filters.brand ||
        filters.inStock ||
        (filters.tags && filters.tags.length > 0) ||
        filters.priceRange[0] > 0 ||
        filters.priceRange[1] < 10000;

    const activeFilterCount = [
        filters.category,
        filters.brand,
        filters.inStock,
        filters.tags?.length,
        filters.priceRange[0] > 0 || filters.priceRange[1] < 10000,
    ].filter(Boolean).length;

    return (
        <Card className="w-full">
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        <CardTitle>Filters</CardTitle>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 px-2 text-xs"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
                <CardDescription>
                    Refine your search with AI-optimized filters
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Sort By */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Sort By</Label>
                    <Select value={filters.sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="relevance">🎯 Relevance</SelectItem>
                            <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                            <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                            <SelectItem value="rating">⭐ Highest Rated</SelectItem>
                            <SelectItem value="newest">🆕 Newest First</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                {/* Price Range */}
                <div className="space-y-3">
                    <button
                        onClick={() => toggleSection('price')}
                        className="flex items-center justify-between w-full text-sm font-medium"
                    >
                        <span>Price Range</span>
                        {expandedSections.price ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>
                    {expandedSections.price && (
                        <div className="space-y-3 pt-2">
                            <Slider
                                value={filters.priceRange}
                                onValueChange={handlePriceChange}
                                max={10000}
                                min={0}
                                step={10}
                                className="w-full"
                            />
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Min:</span>
                                    <span className="font-semibold">${filters.priceRange[0]}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Max:</span>
                                    <span className="font-semibold">${filters.priceRange[1]}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Category */}
                <div className="space-y-2">
                    <button
                        onClick={() => toggleSection('category')}
                        className="flex items-center justify-between w-full text-sm font-medium"
                    >
                        <span>Category</span>
                        {expandedSections.category ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>
                    {expandedSections.category && (
                        <div className="space-y-2">
                            {categoriesLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="ml-2 text-sm text-muted-foreground">Loading categories...</span>
                                </div>
                            ) : (
                                <Select
                                    value={filters.category_id || 'all'}
                                    onValueChange={handleCategoryChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Brand */}
                <div className="space-y-2">
                    <button
                        onClick={() => toggleSection('brand')}
                        className="flex items-center justify-between w-full text-sm font-medium"
                    >
                        <span>Brand</span>
                        {expandedSections.brand ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>
                    {expandedSections.brand && (
                        <Select
                            value={filters.brand || 'All'}
                            onValueChange={handleBrandChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Brands" />
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
                    )}
                </div>

                <Separator />

                {/* Tags */}
                <div className="space-y-3">
                    <button
                        onClick={() => toggleSection('tags')}
                        className="flex items-center justify-between w-full text-sm font-medium"
                    >
                        <span>Tags</span>
                        {expandedSections.tags ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>
                    {expandedSections.tags && (
                        <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-2">
                                {allTags.map((tag) => {
                                    const isChecked = filters.tags?.includes(tag) || false;
                                    return (
                                        <div
                                            key={tag}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={`tag-${tag}`}
                                                checked={isChecked}
                                                onCheckedChange={() => handleTagToggle(tag)}
                                            />
                                            <label
                                                htmlFor={`tag-${tag}`}
                                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                <Badge
                                                    variant={isChecked ? 'default' : 'outline'}
                                                    className="text-xs"
                                                >
                                                    {tag}
                                                </Badge>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <Separator />

                {/* Stock Filter */}
                <div className="space-y-2">
                    <button
                        onClick={() => toggleSection('stock')}
                        className="flex items-center justify-between w-full text-sm font-medium"
                    >
                        <span>Availability</span>
                        {expandedSections.stock ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>
                    {expandedSections.stock && (
                        <div className="flex items-center justify-between pt-2">
                            <Label htmlFor="in-stock" className="text-sm font-normal">
                                In Stock Only
                            </Label>
                            <Switch
                                id="in-stock"
                                checked={filters.inStock || false}
                                onCheckedChange={handleInStockChange}
                            />
                        </div>
                    )}
                </div>

                {/* Active Filters Display */}
                {(filters.tags && filters.tags.length > 0) && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Active Tags</Label>
                            <div className="flex flex-wrap gap-2">
                                {filters.tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => handleTagToggle(tag)}
                                    >
                                        {tag}
                                        <X className="h-3 w-3 ml-1" />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
