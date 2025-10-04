"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User,
    ShoppingBag,
    Heart,
    Settings,
    Package,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    Edit,
    Save,
    X,
    Mail,
    Calendar,
    MapPin,
    CreditCard,
    LogOut
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { OrderStatus, PaymentStatus } from "@/types";

export default function ProfilePage() {
    const { user, session, logout, updateProfile, isLoading } = useAuthStore();
    const { orders, getTotalOrders, getTotalSpent, getRecentOrders } = useOrderStore();
    const { getFavoriteCount } = useFavoritesStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: user?.name || "",
        email: user?.email || "",
    });

    // Redirect if not authenticated
    if (!user || !session) {
        return (
            <div className="container mx-auto px-4 py-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Please log in</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            You need to be logged in to view your profile.
                        </p>
                        <Button asChild>
                            <Link href="/auth">Go to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleSaveProfile = async () => {
        try {
            await updateProfile(editData);
            setIsEditing(false);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const handleCancelEdit = () => {
        setEditData({
            name: user?.name || "",
            email: user?.email || "",
        });
        setIsEditing(false);
    };

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.DELIVERED:
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case OrderStatus.SHIPPED:
                return <Truck className="h-4 w-4 text-blue-500" />;
            case OrderStatus.PROCESSING:
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case OrderStatus.CANCELLED:
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Package className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.DELIVERED:
                return "bg-green-100 text-green-800";
            case OrderStatus.SHIPPED:
                return "bg-blue-100 text-blue-800";
            case OrderStatus.PROCESSING:
                return "bg-yellow-100 text-yellow-800";
            case OrderStatus.CANCELLED:
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const totalOrders = getTotalOrders();
    const totalSpent = getTotalSpent();
    const favoriteCount = getFavoriteCount();
    const recentOrders = getRecentOrders(3);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="mb-8">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        {user.avatarUrl ? (
                            <Image
                                src={user.avatarUrl}
                                alt={user.name || "User"}
                                width={80}
                                height={80}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                                <User className="h-10 w-10 text-primary-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{user.name || "User"}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant={user.emailVerifiedAt ? "default" : "secondary"}>
                                {user.emailVerifiedAt ? "Verified" : "Unverified"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                Member since {formatDate(user.createdAt)}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                        <Button variant="outline" onClick={logout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ShoppingBag className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                <p className="text-2xl font-bold">{totalOrders}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CreditCard className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Spent</p>
                                <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Heart className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Wishlist Items</p>
                                <p className="text-2xl font-bold">{favoriteCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Account Age</p>
                                <p className="text-2xl font-bold">
                                    {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="orders" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="addresses">Addresses</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5" />
                                Recent Orders
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {orders.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Start shopping to see your orders here.
                                    </p>
                                    <Button asChild>
                                        <Link href="/products">Start Shopping</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(order.status)}
                                                    <div>
                                                        <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(order.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                                                    <Badge className={getStatusColor(order.status)}>
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Items ({order.items.length})</h4>
                                                    <div className="space-y-2">
                                                        {order.items.map((item) => (
                                                            <div key={item.id} className="flex items-center gap-3">
                                                                <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
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
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Shipping Address</h4>
                                                    <div className="text-sm text-muted-foreground">
                                                        <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                                                        <p>{order.shippingAddress.address}</p>
                                                        <p>
                                                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end mt-4">
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {orders.length > 3 && (
                                        <div className="text-center">
                                            <Button variant="outline">
                                                View All Orders ({totalOrders})
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={editData.name}
                                            onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleSaveProfile} disabled={isLoading}>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </Button>
                                        <Button variant="outline" onClick={handleCancelEdit}>
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Full Name</Label>
                                        <p className="text-sm py-2">{user.name || "Not provided"}</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Email</Label>
                                        <p className="text-sm py-2 flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Member Since</Label>
                                        <p className="text-sm py-2 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(user.createdAt)}
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Last Updated</Label>
                                        <p className="text-sm py-2 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(user.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Addresses Tab */}
                <TabsContent value="addresses" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Saved Addresses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No saved addresses</h3>
                                <p className="text-muted-foreground mb-4">
                                    Save addresses for faster checkout.
                                </p>
                                <Button>Add Address</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Account Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Email Notifications</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Choose what notifications you want to receive.
                                </p>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" defaultChecked className="rounded" />
                                        <span className="text-sm">Order updates</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" defaultChecked className="rounded" />
                                        <span className="text-sm">Shipping notifications</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" className="rounded" />
                                        <span className="text-sm">Marketing emails</span>
                                    </label>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-semibold mb-2">Account Actions</h3>
                                <div className="space-y-2">
                                    <Button variant="outline" className="w-full justify-start">
                                        Change Password
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                        Download Account Data
                                    </Button>
                                    <Button variant="destructive" className="w-full justify-start">
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
