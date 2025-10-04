"use client";
import { useFavoritesStore } from "@/store/favorites-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";

export default function WishlistPage() {
    const { items, clearFavorites } = useFavoritesStore();

    // Extract products from wishlist items
    const products = items.map(item => item.product);

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-10">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-6 w-6 text-red-500" />
                            Your wishlist is empty
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Browse products and add your favorites to save them for later.
                        </p>
                        <Button asChild>
                            <Link href="/">Go shopping</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <Heart className="h-8 w-8 text-red-500" />
                        Your Wishlist
                    </h1>
                    <p className="text-muted-foreground">
                        {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
                    </p>
                </div>
                <Button variant="secondary" onClick={clearFavorites}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear all
                </Button>
            </div>
            <ProductGrid products={products} />
        </div>
    );
}