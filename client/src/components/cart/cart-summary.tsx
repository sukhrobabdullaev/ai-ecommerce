'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, CreditCard } from 'lucide-react';

export function CartSummary() {
    const { getTotalItems, getTotalPrice } = useCartStore();

    const totalItems = getTotalItems();
    const subtotal = getTotalPrice();
    const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    return (
        <Card className="sticky top-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Items Count */}
                <div className="flex justify-between text-sm">
                    <span>Items ({totalItems})</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>
                        {shipping === 0 ? (
                            <span className="text-green-600 font-medium">FREE</span>
                        ) : (
                            `$${shipping.toFixed(2)}`
                        )}
                    </span>
                </div>

                {/* Tax */}
                <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>

                {/* Free Shipping Notice */}
                {shipping > 0 && (
                    <div className="text-xs text-muted-foreground text-center">
                        Add ${(100 - subtotal).toFixed(2)} more for free shipping
                    </div>
                )}

                {/* Checkout Button */}
                <Link href="/checkout" className="block">
                    <Button className="w-full" size="lg">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Checkout
                    </Button>
                </Link>

                {/* Continue Shopping */}
                <Link href="/products">
                    <Button variant="outline" className="w-full">
                        Continue Shopping
                    </Button>
                </Link>

                {/* Security Notice */}
                <div className="text-xs text-muted-foreground text-center">
                    <p>🔒 Secure checkout with SSL encryption</p>
                </div>
            </CardContent>
        </Card>
    );
}
