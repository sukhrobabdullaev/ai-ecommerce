"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Mic, ShoppingCart, Heart, MessageSquare, Shield, Globe, Rocket } from "lucide-react";

export default function AboutPage() {
    return (
        <MainLayout>
            <section className="py-12">
                <div className="container mx-auto px-4 space-y-10">
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-bold">About AI Ecommerce</h1>
                        <p className="text-muted-foreground max-w-3xl">
                            Our mission is to make shopping feel like a conversation. This AI‑native e‑commerce
                            experience blends natural language search, a voice/chat assistant, and personalized
                            recommendations to help customers find the right products—fast.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardContent className="p-6 space-y-2">
                                <Sparkles className="h-6 w-6 text-primary" />
                                <h3 className="font-semibold">AI Search</h3>
                                <p className="text-sm text-muted-foreground">Natural language search with smart insights.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 space-y-2">
                                <Mic className="h-6 w-6 text-primary" />
                                <h3 className="font-semibold">Voice</h3>
                                <p className="text-sm text-muted-foreground">Hands-free product discovery and commands.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 space-y-2">
                                <ShoppingCart className="h-6 w-6 text-primary" />
                                <h3 className="font-semibold">Cart</h3>
                                <p className="text-sm text-muted-foreground">Persistent cart powered by Zustand.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 space-y-2">
                                <Heart className="h-6 w-6 text-primary" />
                                <h3 className="font-semibold">Wishlist</h3>
                                <p className="text-sm text-muted-foreground">Save favorites for later with one tap.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardContent className="p-6 space-y-2">
                                <MessageSquare className="h-6 w-6 text-primary" />
                                <h3 className="font-semibold">Conversational UX</h3>
                                <p className="text-sm text-muted-foreground">Messaging‑style interactions and voice capture for an accessible shopping experience.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 space-y-2">
                                <Shield className="h-6 w-6 text-primary" />
                                <h3 className="font-semibold">Privacy‑First</h3>
                                <p className="text-sm text-muted-foreground">Clear opt‑ins for voice/analytics and easy paths to secure auth and payments.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 space-y-2">
                                <Globe className="h-6 w-6 text-primary" />
                                <h3 className="font-semibold">Scalable by Design</h3>
                                <p className="text-sm text-muted-foreground">Next.js App Router with SSR/ISR and a component architecture that scales.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Tech stack: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Lucide Icons. This demo focuses on clean architecture, accessibility, and delightful UX.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Rocket className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">What’s next</h3>
                            </div>
                            <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                                <li>Plug into real vector search and LLM‑powered recommendations.</li>
                                <li>Add authentication, orders, and checkout with payments.</li>
                                <li>Multi‑modal: image‑based search and richer voice intents.</li>
                                <li>Internationalization, accessibility audits, performance budgets.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </MainLayout>
    );
}
