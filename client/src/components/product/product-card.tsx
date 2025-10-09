'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { CartButtonText } from '@/components/cart/cart-button-text';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // 👈 new

  const { addItem, openCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAddToCart = () => {
    addItem(product);
    openCart();
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  // 👇 Don't render favorite UI until after mount
  const favoriteActive = isMounted ? isFavorite(product?.id) : false;

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}>
      <div className="relative">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 && !imageError ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Action Buttons Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute right-2 top-2 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              className={`h-8 w-8 rounded-full p-0 ${favoriteActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white/90 hover:bg-white text-gray-600'
                }`}
              onClick={handleToggleFavorite}
              title={favoriteActive ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`h-4 w-4 ${favoriteActive ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute left-2 top-2">
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
        </div>

      </div>

      <CardContent className="p-4">
        {product.brand && (
          <p className="mb-1 text-xs text-muted-foreground">{product.brand}</p>
        )}

        <Link href={`/products/${product.id}`}>
          <h3 className="mb-2 line-clamp-2 text-sm font-medium transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
          {product.description}
        </p>

        <div className="mb-3 flex flex-wrap gap-1">
          {product.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {product.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{product.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="mb-3">
          <span className="text-lg font-bold">${product.price}</span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            <CartButtonText productId={product.id} />
          </Button>
          <Link href={`/products/${product.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}