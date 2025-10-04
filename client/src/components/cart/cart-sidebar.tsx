'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useCartStore } from '@/store/cart-store';

export function CartSidebar() {
    const {
        isOpen,
        closeCart,
        items,
        updateQuantity,
        removeItem,
        getTotalItems,
        getTotalPrice
    } = useCartStore();

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(productId);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={closeCart}
            />

            {/* Sidebar */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b p-4">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">
                                Cart ({totalItems})
                            </h2>
                        </div>
                        <Button variant="ghost" size="sm" onClick={closeCart}>
                            ×
                        </Button>
                    </div>

                    {/* Cart Items */}
                    <ScrollArea className="flex-1 p-4">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Your cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.product.id} className="flex gap-3">
                                        {/* Product Image */}
                                        <div className="relative w-16 h-16 flex-shrink-0">
                                            {item.product.images && item.product.images.length > 0 ? (
                                                <Image
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
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
                                            <Link
                                                href={`/products/${item.product.id}`}
                                                onClick={closeCart}
                                                className="block"
                                            >
                                                <h3 className="font-medium text-sm hover:text-primary transition-colors line-clamp-2">
                                                    {item.product.name}
                                                </h3>
                                            </Link>

                                            <p className="text-xs text-muted-foreground mt-1">
                                                ${item.product.price}
                                            </p>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>

                                                    <span className="w-6 text-center text-xs">
                                                        {item.quantity}
                                                    </span>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(item.product.id)}
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="border-t p-4 space-y-4">
                            <div className="flex justify-between text-lg font-semibold">
                                <span>Total</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>

                            <div className="space-y-2">
                                <Link href="/cart" onClick={closeCart}>
                                    <Button variant="outline" className="w-full">
                                        View Cart
                                    </Button>
                                </Link>

                                <Link href="/checkout" onClick={closeCart}>
                                    <Button className="w-full">
                                        Checkout
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
