'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Star, Heart, ShoppingCart, Check, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { useRatingsStore } from "@/store/ratings-store";
import { Product } from "@/types";

interface ProductActionsProps {
    product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
    const [imageIndex, setImageIndex] = useState(0);
    const { addItem, getItemQuantity } = useCartStore();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const { getRating, setRating } = useRatingsStore();

    const inCartQty = getItemQuantity(product.id);
    const isFav = isFavorite(product.id);
    const userRating = getRating(product.id);

    return (
        <>
            {/* Gallery */}
            <div>
                <Card className="overflow-hidden">
                    <div className="relative aspect-square">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[imageIndex]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                <ShoppingCart className="h-24 w-24 text-gray-400" />
                            </div>
                        )}
                        {product.stock === 0 && (
                            <Badge variant="outline" className="absolute top-2 right-2 bg-background/80">Out of Stock</Badge>
                        )}
                        {product.tags?.includes('premium') && (
                            <Badge variant="secondary" className="absolute bottom-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                <Sparkles className="h-3 w-3 mr-1" /> Premium
                            </Badge>
                        )}
                    </div>
                    {product.images && product.images.length > 1 && (
                        <CardContent>
                            <div className="mt-4 grid grid-cols-5 gap-2">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setImageIndex(idx)}
                                        className={`relative aspect-square overflow-hidden rounded border ${idx === imageIndex ? 'ring-2 ring-primary' : 'border-border'}`}
                                    >
                                        <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Info */}
            <div>
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.brand}</p>
                    <h1 className="text-2xl font-semibold leading-tight">{product.name}</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <button
                                    key={i}
                                    aria-label={`Rate ${i + 1} stars`}
                                    onClick={() => setRating(product.id, i + 1)}
                                    className="p-0.5"
                                >
                                    <Star className={`h-5 w-5 ${i < (userRating || 4) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground">4.2 · 128 reviews</span>
                        {userRating > 0 && (
                            <span className="text-xs text-primary">Your rating: {userRating}★</span>
                        )}
                    </div>

                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-semibold">${product.price}</span>
                        {product.stock && product.stock > 0 && (
                            <span className="text-sm text-green-600 font-medium">
                                {product.stock} in stock
                            </span>
                        )}
                    </div>

                    <p className="text-muted-foreground">{product.description}</p>

                    <div className="flex gap-2 flex-wrap">
                        {product.tags?.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button size="lg" onClick={() => addItem(product)} disabled={product.stock === 0}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {product.stock && product.stock > 0 ? (inCartQty > 0 ? `Added (${inCartQty})` : 'Add to Cart') : 'Out of Stock'}
                        </Button>
                        <Button size="lg" variant={isFav ? "secondary" : "outline"} onClick={() => toggleFavorite(product)}>
                            <Heart className={`h-4 w-4 mr-2 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                            {isFav ? 'Saved' : 'Save'}
                        </Button>
                    </div>
                </div>

                <Separator className="my-6" />

                <div className="grid sm:grid-cols-2 gap-6">
                    {/* Features */}
                    <div>
                        <h2 className="font-semibold mb-3">Key Features</h2>
                        <ul className="space-y-2 text-sm">
                            {product.tags?.slice(0, 5).map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />
                                    {feature.charAt(0).toUpperCase() + feature.slice(1)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Specifications */}
                    <div>
                        <h2 className="font-semibold mb-3">Product Details</h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-muted-foreground">Category</dt>
                                <dd className="font-medium">{product.category?.name || 'N/A'}</dd>
                            </div>
                            {product.brand && (
                                <div>
                                    <dt className="text-muted-foreground">Brand</dt>
                                    <dd className="font-medium">{product.brand}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-muted-foreground">Stock</dt>
                                <dd className="font-medium">{product.stock || 0} available</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Price</dt>
                                <dd className="font-medium">${product.price}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </>
    );
}
