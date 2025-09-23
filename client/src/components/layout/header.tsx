'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';

export function Header() {
    const { getTotalItems, openCart } = useCartStore();
    const { getFavoriteCount } = useFavoritesStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const totalItems = mounted ? getTotalItems() : 0;
    const favoriteCount = mounted ? getFavoriteCount() : 0;

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

                    {/* Action Buttons */
                    }
                    <div className="flex items-center space-x-2">
                        {/* Favorites */}
                        <Button variant="ghost" size="icon" className="relative" asChild>
                            <Link href="/wishlist">
                                <Heart className="h-5 w-5" />
                                {mounted && favoriteCount > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                    >
                                        {favoriteCount}
                                    </Badge>
                                )}
                            </Link>
                        </Button>

                        {/* Cart */}
                        <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
                            <ShoppingCart className="h-5 w-5" />
                            {mounted && totalItems > 0 && (
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
