"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { mockProducts } from "@/data/mock-products";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Star, Heart, ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { useRatingsStore } from "@/store/ratings-store";

export default function ProductDetailsPage() {
    const params = useParams<{ id: string }>();
    const product = useMemo(() => mockProducts.find(p => p.id === params.id), [params.id]);
    const [imageIndex, setImageIndex] = useState(0);
    const { addItem, getItemQuantity } = useCartStore();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const { getRating, setRating } = useRatingsStore();

    if (!product) return notFound();

    const inCartQty = getItemQuantity(product.id);
    const isFav = isFavorite(product.id);
    const discountPercentage = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const userRating = getRating(product.id);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gallery */}
                <div>
                    <Card className="overflow-hidden">
                        <div className="relative aspect-square">
                            <Image
                                src={product.images[imageIndex] || product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                            {discountPercentage > 0 && (
                                <Badge variant="destructive" className="absolute top-2 left-2">-{discountPercentage}%</Badge>
                            )}
                            {!product.inStock && (
                                <Badge variant="outline" className="absolute top-2 right-2 bg-background/80">Out of Stock</Badge>
                            )}
                            {product.aiRecommendation && (
                                <Badge variant="secondary" className="absolute bottom-2 left-2 ai-gradient text-white border-0">
                                    <Sparkles className="h-3 w-3 mr-1" /> AI Pick
                                </Badge>
                            )}
                        </div>
                        {product.images.length > 1 && (
                            <CardContent>
                                <div className="mt-4 grid grid-cols-5 gap-2">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setImageIndex(idx)}
                                            className={`relative aspect-square overflow-hidden rounded border ${idx === imageIndex ? 'ring-2 ring-primary' : 'border-border'}`}
                                        >
                                            <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
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
                                        <Star className={`h-5 w-5 ${i < (userRating || Math.floor(product.rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm text-muted-foreground">{product.rating.toFixed(1)} · {product.reviewCount} reviews</span>
                            {userRating > 0 && (
                                <span className="text-xs text-primary">Your rating: {userRating}★</span>
                            )}
                        </div>

                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-semibold">${product.price.toFixed(2)}</span>
                            {product.originalPrice && (
                                <span className="text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
                            )}
                        </div>

                        <p className="text-muted-foreground">{product.description}</p>

                        <div className="flex gap-2 flex-wrap">
                            {product.tags.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button size="lg" onClick={() => addItem(product)} disabled={!product.inStock}>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                {product.inStock ? (inCartQty > 0 ? `Added (${inCartQty})` : 'Add to Cart') : 'Out of Stock'}
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
                            <h2 className="font-semibold mb-3">Features</h2>
                            <ul className="space-y-2 text-sm">
                                {product.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{feature}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Specifications */}
                        <div>
                            <h2 className="font-semibold mb-3">Specifications</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                {Object.entries(product.specifications).map(([key, value]) => (
                                    <div key={key}>
                                        <dt className="text-muted-foreground">{key}</dt>
                                        <dd className="font-medium">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


