"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    CreditCard,
    Truck,
    MapPin,
    ShoppingCart,
    Shield,
    ArrowLeft,
    Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
    CheckoutFormData,
    Address,
    PaymentMethod,
    OrderCalculation,
    OrderStatus,
    PaymentStatus
} from "@/types";

export default function CheckoutPage() {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const [placing, setPlacing] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState<CheckoutFormData>({
        shippingAddress: {
            firstName: "",
            lastName: "",
            address: "",
            city: "",
            state: "",
            zipCode: "",
            country: "US",
        },
        billingAddress: {
            firstName: "",
            lastName: "",
            address: "",
            city: "",
            state: "",
            zipCode: "",
            country: "US",
        },
        paymentMethod: {
            type: "card",
            cardNumber: "",
            expiryDate: "",
            cvv: "",
            cardholderName: "",
        },
        useSameAddress: true,
    });

    // Calculate order totals
    const calculateOrder = (): OrderCalculation => {
        const subtotal = getTotalPrice();
        const tax = subtotal * 0.08; // 8% tax
        const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
        const total = subtotal + tax + shipping;

        return { subtotal, tax, shipping, total };
    };

    const orderCalculation = calculateOrder();

    const updateShippingAddress = (field: keyof Address, value: string) => {
        setFormData(prev => ({
            ...prev,
            shippingAddress: {
                ...prev.shippingAddress,
                [field]: value,
            },
        }));
    };

    const updatePaymentMethod = (field: keyof PaymentMethod, value: string) => {
        setFormData(prev => ({
            ...prev,
            paymentMethod: {
                ...prev.paymentMethod,
                [field]: value,
            },
        }));
    };

    const placeOrder = async () => {
        if (placing) return;
        setPlacing(true);

        try {
            // Validate form data
            if (!formData.shippingAddress.firstName || !formData.shippingAddress.lastName) {
                throw new Error("Please fill in all required shipping information");
            }

            if (!formData.paymentMethod.cardNumber || !formData.paymentMethod.expiryDate) {
                throw new Error("Please fill in all payment information");
            }

            // Simulate network delay
            await new Promise(r => setTimeout(r, 1500));

            // Demo success ratio
            const success = Math.random() > 0.15; // 85% success rate

            if (!success) {
                throw new Error("Payment authorization failed. Please try another payment method.");
            }

            // Generate order
            const orderId = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");

            // Create order object matching your database schema
            const order = {
                id: `order_${Date.now()}`,
                userId: "demo_user", // In real app, get from auth
                orderNumber: orderId,
                status: OrderStatus.PENDING,
                subtotal: orderCalculation.subtotal,
                tax: orderCalculation.tax,
                shipping: orderCalculation.shipping,
                total: orderCalculation.total,
                shippingAddress: formData.shippingAddress,
                billingAddress: formData.useSameAddress ? formData.shippingAddress : formData.billingAddress,
                paymentMethod: formData.paymentMethod.type,
                paymentStatus: PaymentStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date(),
                items: items.map(item => ({
                    id: `order_item_${Date.now()}_${item.product.id}`,
                    orderId: `order_${Date.now()}`,
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price,
                    createdAt: new Date(),
                    product: item.product,
                })),
            };

            // Clear cart on success
            clearCart();

            toast.success(`Order #${orderId} placed successfully!`, {
                description: "We've sent you a confirmation email with tracking details.",
                duration: 5000,
            });

            // In a real app, you would redirect to order confirmation page
            console.log("Order created:", order);

        } catch (err: unknown) {
            toast.error("Unable to place order", {
                description: (err as Error)?.message || "An unexpected error occurred. Please try again.",
            });
        } finally {
            setPlacing(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-10">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-6 w-6" />
                            Your cart is empty
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Add some products to your cart before proceeding to checkout.
                        </p>
                        <Button asChild>
                            <Link href="/products">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Continue Shopping
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-center space-x-8">
                    <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            1
                        </div>
                        <span className="font-medium">Shipping</span>
                    </div>
                    <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                    <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            2
                        </div>
                        <span className="font-medium">Payment</span>
                    </div>
                    <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                    <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            3
                        </div>
                        <span className="font-medium">Review</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Step 1: Shipping Information */}
                    {currentStep === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Shipping Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input
                                            id="firstName"
                                            placeholder="John"
                                            value={formData.shippingAddress.firstName}
                                            onChange={(e) => updateShippingAddress('firstName', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Doe"
                                            value={formData.shippingAddress.lastName}
                                            onChange={(e) => updateShippingAddress('lastName', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="address">Address *</Label>
                                        <Input
                                            id="address"
                                            placeholder="123 Main Street"
                                            value={formData.shippingAddress.address}
                                            onChange={(e) => updateShippingAddress('address', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="city">City *</Label>
                                        <Input
                                            id="city"
                                            placeholder="San Francisco"
                                            value={formData.shippingAddress.city}
                                            onChange={(e) => updateShippingAddress('city', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="state">State</Label>
                                        <Select
                                            value={formData.shippingAddress.state}
                                            onValueChange={(value) => updateShippingAddress('state', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CA">California</SelectItem>
                                                <SelectItem value="NY">New York</SelectItem>
                                                <SelectItem value="TX">Texas</SelectItem>
                                                <SelectItem value="FL">Florida</SelectItem>
                                                <SelectItem value="WA">Washington</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="zipCode">ZIP Code *</Label>
                                        <Input
                                            id="zipCode"
                                            placeholder="94105"
                                            value={formData.shippingAddress.zipCode}
                                            onChange={(e) => updateShippingAddress('zipCode', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="country">Country *</Label>
                                        <Select
                                            value={formData.shippingAddress.country}
                                            onValueChange={(value) => updateShippingAddress('country', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="US">United States</SelectItem>
                                                <SelectItem value="CA">Canada</SelectItem>
                                                <SelectItem value="GB">United Kingdom</SelectItem>
                                                <SelectItem value="AU">Australia</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="useSameAddress"
                                        checked={formData.useSameAddress}
                                        onCheckedChange={(checked: boolean) =>
                                            setFormData(prev => ({ ...prev, useSameAddress: !!checked }))
                                        }
                                    />
                                    <Label htmlFor="useSameAddress">Use same address for billing</Label>
                                </div>

                                <Button
                                    onClick={() => setCurrentStep(2)}
                                    className="w-full"
                                    disabled={!formData.shippingAddress.firstName || !formData.shippingAddress.lastName || !formData.shippingAddress.address}
                                >
                                    Continue to Payment
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Payment Information */}
                    {currentStep === 2 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <Label>Payment Method</Label>
                                    <RadioGroup
                                        value={formData.paymentMethod.type}
                                        onValueChange={(value: string) => updatePaymentMethod('type', value)}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="card" id="card" />
                                            <Label htmlFor="card">Credit/Debit Card</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="paypal" id="paypal" />
                                            <Label htmlFor="paypal">PayPal</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {formData.paymentMethod.type === 'card' && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="cardholderName">Cardholder Name *</Label>
                                            <Input
                                                id="cardholderName"
                                                placeholder="John Doe"
                                                value={formData.paymentMethod.cardholderName}
                                                onChange={(e) => updatePaymentMethod('cardholderName', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="cardNumber">Card Number *</Label>
                                            <Input
                                                id="cardNumber"
                                                placeholder="4242 4242 4242 4242"
                                                value={formData.paymentMethod.cardNumber}
                                                onChange={(e) => updatePaymentMethod('cardNumber', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="expiryDate">Expiry Date *</Label>
                                                <Input
                                                    id="expiryDate"
                                                    placeholder="MM/YY"
                                                    value={formData.paymentMethod.expiryDate}
                                                    onChange={(e) => updatePaymentMethod('expiryDate', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="cvv">CVV *</Label>
                                                <Input
                                                    id="cvv"
                                                    placeholder="123"
                                                    value={formData.paymentMethod.cvv}
                                                    onChange={(e) => updatePaymentMethod('cvv', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(1)}
                                        className="flex-1"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentStep(3)}
                                        className="flex-1"
                                        disabled={
                                            formData.paymentMethod.type === 'card' &&
                                            (!formData.paymentMethod.cardNumber || !formData.paymentMethod.expiryDate || !formData.paymentMethod.cardholderName)
                                        }
                                    >
                                        Review Order
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Review Order */}
                    {currentStep === 3 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Review Your Order
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Shipping Address Review */}
                                <div>
                                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                                    <div className="bg-muted p-3 rounded-md">
                                        <p>{formData.shippingAddress.firstName} {formData.shippingAddress.lastName}</p>
                                        <p>{formData.shippingAddress.address}</p>
                                        <p>{formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}</p>
                                        <p>{formData.shippingAddress.country}</p>
                                    </div>
                                </div>

                                {/* Payment Method Review */}
                                <div>
                                    <h3 className="font-semibold mb-2">Payment Method</h3>
                                    <div className="bg-muted p-3 rounded-md">
                                        <p className="capitalize">{formData.paymentMethod.type.replace('_', ' ')}</p>
                                        {formData.paymentMethod.type === 'card' && (
                                            <p>**** **** **** {formData.paymentMethod.cardNumber?.slice(-4)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(2)}
                                        className="flex-1"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={placeOrder}
                                        disabled={placing}
                                        className="flex-1"
                                    >
                                        {placing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Place Order'
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Order Summary */}
                <div>
                    <Card className="sticky top-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Items */}
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {items.map(item => (
                                    <div key={item.product.id} className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                                            {item.product.images[0] && (
                                                <Image
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-sm font-medium">
                                            ${(item.product.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            {/* Order Totals */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>${orderCalculation.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Tax</span>
                                    <span>${orderCalculation.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Shipping</span>
                                    <span>
                                        {orderCalculation.shipping === 0 ? (
                                            <Badge variant="secondary">Free</Badge>
                                        ) : (
                                            `$${orderCalculation.shipping.toFixed(2)}`
                                        )}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>${orderCalculation.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {orderCalculation.subtotal > 100 && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                                    <Truck className="h-4 w-4" />
                                    <span>You qualify for free shipping!</span>
                                </div>
                            )}

                            <Button variant="secondary" asChild className="w-full">
                                <Link href="/products">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Continue Shopping
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}