'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Heart, Menu, Mic, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { useSearchStore } from '@/store/search-store';
import { VoiceSearch } from './voice-search';
import { SearchSuggestions } from './search-suggestions';

export function Header() {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const { getTotalItems, openCart } = useCartStore();
    const { getFavoriteCount } = useFavoritesStore();
    const { filters, setQuery, addToHistory } = useSearchStore();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (filters.query.trim()) {
            addToHistory(filters.query);
            // TODO: Implement search logic
        }
    };

    const totalItems = getTotalItems();
    const favoriteCount = getFavoriteCount();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="ai-gradient h-8 w-8 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">AI</span>
                        </div>
                        <span className="font-bold text-xl">Ecommerce</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                            Home
                        </Link>
                        <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
                            Products
                        </Link>
                        <Link href="/categories" className="text-sm font-medium hover:text-primary transition-colors">
                            Categories
                        </Link>
                        <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
                            About
                        </Link>
                    </nav>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-lg mx-4 relative">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Search for products... (e.g., 'running shoes under $150')"
                                value={filters.query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                className="pl-10 pr-20 h-10 search-glow"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                                <VoiceSearch />
                                <Button type="submit" size="sm" className="h-6 px-2">
                                    Search
                                </Button>
                            </div>
                        </form>

                        {/* Search Suggestions */}
                        {isSearchFocused && <SearchSuggestions />}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                        {/* Favorites */}
                        <Button variant="ghost" size="icon" className="relative">
                            <Heart className="h-5 w-5" />
                            {favoriteCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                >
                                    {favoriteCount}
                                </Badge>
                            )}
                        </Button>

                        {/* Cart */}
                        <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
                            <ShoppingCart className="h-5 w-5" />
                            {totalItems > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                >
                                    {totalItems}
                                </Badge>
                            )}
                        </Button>

                        {/* User Account */}
                        <Button variant="ghost" size="icon">
                            <User className="h-5 w-5" />
                        </Button>

                        {/* Mobile Menu */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                <div className="flex flex-col space-y-4 mt-6">
                                    <Link href="/" className="text-lg font-medium hover:text-primary transition-colors">
                                        Home
                                    </Link>
                                    <Link href="/products" className="text-lg font-medium hover:text-primary transition-colors">
                                        Products
                                    </Link>
                                    <Link href="/categories" className="text-lg font-medium hover:text-primary transition-colors">
                                        Categories
                                    </Link>
                                    <Link href="/about" className="text-lg font-medium hover:text-primary transition-colors">
                                        About
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
