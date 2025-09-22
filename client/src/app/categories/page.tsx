"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { categories } from "@/data/mock-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CategoriesPage() {
    return (
        <MainLayout>
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-8">Categories</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {categories.map((cat) => (
                            <Link key={cat} href={`/products?category=${encodeURIComponent(cat)}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardHeader>
                                        <CardTitle>{cat}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">Explore top products in {cat}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
