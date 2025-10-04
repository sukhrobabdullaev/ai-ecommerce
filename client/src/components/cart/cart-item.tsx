'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cart-store';
import { CartItem as CartItemType } from '@/types';

interface CartItemProps {
    item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeItem } = useCartStore();
    const { product, quantity } = item;

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(product.id);
        } else {
            updateQuantity(product.id, newQuantity);
        }
    };

    const handleRemove = () => {
        removeItem(product.id);
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                            <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover rounded-md"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <Link href={`/products/${product.id}`}>
                                    <h3 className="font-medium text-sm hover:text-primary transition-colors line-clamp-2">
                                        {product.name}
                                    </h3>
                                </Link>

                                {product.brand && (
                                    <p className="text-xs text-muted-foreground mt-1">{product.brand}</p>
                                )}

                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                        {product.category}
                                    </Badge>
                                    <span className="text-sm font-medium">${product.price}</span>
                                </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemove}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={quantity <= 1}
                                    className="h-8 w-8 p-0"
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>

                                <span className="w-8 text-center text-sm font-medium">
                                    {quantity}
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    className="h-8 w-8 p-0"
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Total Price */}
                            <div className="text-right">
                                <p className="text-sm font-medium">
                                    ${(product.price * quantity).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
