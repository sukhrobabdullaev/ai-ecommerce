"use client";
import { useCartStore } from "@/store/cart-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function CheckoutPage() {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const total = getTotalPrice();
    const [placing, setPlacing] = useState(false);

    const placeOrder = async () => {
        if (placing) return;
        setPlacing(true);
        try {
            // Simulate network delay
            await new Promise(r => setTimeout(r, 800));
            // Demo success ratio
            const ok = Math.random() > 0.2;
            if (!ok) {
                throw new Error("Payment authorization failed. Please try another card.");
            }
            const orderId = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
            clearCart();
            toast.success(`Order #${orderId} placed successfully!`, { description: "We emailed your receipt." });
        } catch (err: any) {
            toast.error("Unable to place order", { description: err?.message || "Unexpected error." });
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Shipping & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" placeholder="Alex" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" placeholder="Shopper" />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" placeholder="123 Market St" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" placeholder="San Francisco" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="zip">ZIP / Postal</Label>
                                    <Input id="zip" placeholder="94107" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="card">Card Number</Label>
                                    <Input id="card" placeholder="4242 4242 4242 4242" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="exp">Expiry</Label>
                                    <Input id="exp" placeholder="12/28" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <Input id="cvc" placeholder="123" />
                                </div>
                            </div>
                            <Button size="lg" className="mt-2" onClick={placeOrder} disabled={placing}>
                                {placing ? "Placing..." : "Place Order"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Order Summary */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {items.length === 0 ? (
                                    <p className="text-muted-foreground">Your cart is empty.</p>
                                ) : (
                                    items.map(item => (
                                        <div key={item.product.id} className="flex items-center justify-between text-sm">
                                            <span className="line-clamp-1">{item.product.name} × {item.quantity}</span>
                                            <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between font-semibold">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <Button variant="secondary" asChild className="w-full">
                                <Link href="/">Continue Shopping</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


