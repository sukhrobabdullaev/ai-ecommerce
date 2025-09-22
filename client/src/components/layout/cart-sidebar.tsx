'use client';

import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cart-store';
import Image from 'next/image';

export function CartSidebar() {
    const {
        items,
        isOpen,
        closeCart,
        updateQuantity,
        removeItem,
        clearCart,
        getTotalPrice,
        getTotalItems,
    } = useCartStore();

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    return (
        <Sheet open={isOpen} onOpenChange={closeCart}>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                        <ShoppingBag className="h-5 w-5" />
                        <span>Shopping Cart</span>
                        {totalItems > 0 && (
                            <Badge variant="secondary">{totalItems} items</Badge>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full">
                    {items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Your cart is empty</h3>
                                <p className="text-muted-foreground">
                                    Add some products to get started!
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto space-y-4 py-4">
                                {items.map((item) => (
                                    <div key={item.product.id} className="flex space-x-4">
                                        <div className="relative h-20 w-20 flex-shrink-0">
                                            <Image
                                                src={item.product.image}
                                                alt={item.product.name}
                                                fill
                                                className="rounded-md object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium line-clamp-2">
                                                {item.product.name}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                ${item.product.price.toFixed(2)}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <div className="flex items-center space-x-1">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="text-sm w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                                    onClick={() => removeItem(item.product.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            {/* Cart Summary */}
                            <div className="space-y-4 py-4">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total</span>
                                    <span>${totalPrice.toFixed(2)}</span>
                                </div>

                                <div className="space-y-2">
                                    <Button className="w-full" size="lg" asChild>
                                        <a href="/checkout">Proceed to Checkout</a>
                                    </Button>
                                    <Button variant="outline" className="w-full" onClick={clearCart}>
                                        Clear Cart
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
