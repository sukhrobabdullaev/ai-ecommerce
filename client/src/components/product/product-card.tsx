'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { Product } from '@/types';

interface ProductCardProps {
    product: Product;
    showAIRecommendation?: boolean;
}

export function ProductCard({ product, showAIRecommendation = false }: ProductCardProps) {
    const [imageIndex, setImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const { addItem } = useCartStore();
    const { isFavorite, toggleFavorite } = useFavoritesStore();

    const isFav = isFavorite(product.id);
    const discountPercentage = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(product);
    };

    return (
        <Card
            className="group card-hover relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/products/${product.id}`}>
                <CardContent className="p-0">
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden">
                        <Image
                            src={product.images[imageIndex] || product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Discount Badge */}
                        {discountPercentage > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute top-2 left-2"
                            >
                                -{discountPercentage}%
                            </Badge>
                        )}

                        {/* AI Recommendation Badge */}
                        {showAIRecommendation && product.aiRecommendation && (
                            <Badge
                                variant="secondary"
                                className="absolute top-2 right-2 ai-gradient text-white border-0"
                            >
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI Pick
                            </Badge>
                        )}

                        {/* Stock Badge */}
                        {!product.inStock && (
                            <Badge
                                variant="outline"
                                className="absolute top-2 right-2 bg-background/80"
                            >
                                Out of Stock
                            </Badge>
                        )}

                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-background/80 hover:bg-background"
                                            onClick={handleToggleFavorite}
                                        >
                                            <Heart
                                                className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
                                            />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isFav ? 'Remove from favorites' : 'Add to favorites'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-background/80 hover:bg-background"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Quick view</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Image Navigation */}
                        {product.images.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                {product.images.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors ${index === imageIndex ? 'bg-white' : 'bg-white/50'
                                            }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setImageIndex(index);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-2">
                        {/* Brand */}
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            {product.brand}
                        </p>

                        {/* Product Name */}
                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center space-x-1">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-3 w-3 ${i < Math.floor(product.rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                ({product.reviewCount})
                            </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center space-x-2">
                            <span className="font-semibold text-lg">
                                ${product.price.toFixed(2)}
                            </span>
                            {product.originalPrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                    ${product.originalPrice.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* AI Recommendation */}
                        {showAIRecommendation && product.aiRecommendation && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-2 rounded-md">
                                <div className="flex items-start space-x-2">
                                    <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                            AI Recommendation
                                        </p>
                                        <p className="text-xs text-purple-600 dark:text-purple-400">
                                            {product.aiRecommendation.reason}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Add to Cart Button */}
                        <Button
                            className="w-full"
                            onClick={handleAddToCart}
                            disabled={!product.inStock}
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}
