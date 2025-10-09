'use client';

import { useCartStore } from '@/store/cart-store';
import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
    const { items, clearCart } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <ShoppingCart className="h-24 w-24 text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
                    <p className="text-muted-foreground mb-6">
                        Looks like you haven&apos;t added any items to your cart yet.
                    </p>
                    <Link href="/products">
                        <Button>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Shopping Cart</h1>
                <Button variant="outline" onClick={clearCart}>
                    Clear Cart
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="space-y-4">
                        {items.map((item) => (
                            <CartItem key={item.product.id} item={item} />
                        ))}
                    </div>
                </div>

                {/* Cart Summary */}
                <div className="lg:col-span-1">
                    <CartSummary />
                </div>
            </div>
        </div>
    );
}
