import { ProductGrid } from '@/components/product/product-grid';
import { mockProducts } from '@/data/mock-products';

export default function ProductsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">All Products</h1>
                <p className="text-muted-foreground">
                    Discover our collection of products - perfect for testing AI recommendations
                </p>
            </div>
            <ProductGrid products={mockProducts} />
        </div>
    );
}