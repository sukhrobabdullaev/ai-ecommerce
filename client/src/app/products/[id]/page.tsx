import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { serverAPI } from "@/lib/server-api";
import { ProductActions } from "@/components/product/product-actions";

interface ProductDetailsPageProps {
    params: { id: string };
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
    let product;

    try {
        product = await serverAPI.getProduct(params.id);
    } catch (error) {
        console.error('Error fetching product:', error);
        return notFound();
    }

    if (!product) {
        return notFound();
    }
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Link href="/" className="flex items-center hover:text-primary">
                        <Home className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                    <span className="hidden sm:inline">/</span>
                    <Link href="/products" className="hover:text-primary">Products</Link>
                    <span>/</span>
                    <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
                </nav>
                <Link href="/products">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Products
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ProductActions product={product} />
            </div>
        </div>
    );
}


