"use client";
import { useFavoritesStore } from "@/store/favorites-store";
import { useCartStore } from "@/store/cart-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function WishlistPage() {
    const { items, removeFromFavorites, clearFavorites } = useFavoritesStore();
    const { addItem } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Your wishlist is empty</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Browse products and add your favorites to save them for later.</p>
                        <Button asChild>
                            <Link href="/">Go shopping</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold">Your Wishlist ({items.length})</h1>
                <Button variant="secondary" onClick={clearFavorites}>Clear all</Button>
            </div>
            <Separator className="mb-6" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(product => (
                    <Card key={product.id}>
                        <CardHeader>
                            <CardTitle className="text-base">{product.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-muted-foreground">${product.price.toFixed(2)}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => addItem(product)}>Add to cart</Button>
                                    <Button size="sm" variant="destructive" onClick={() => removeFromFavorites(product.id)}>Remove</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}


