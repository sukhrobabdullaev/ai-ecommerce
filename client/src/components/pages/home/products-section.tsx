import { ProductGrid } from '@/components/product/product-grid';
import { Product } from '@/types';

interface ProductsSectionProps {
    products: Product[];
    columns?: 1 | 2 | 3 | 4 | 5;
}

export function ProductsSection({ products, columns = 4 }: ProductsSectionProps) {
    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                    <div>
                        <h2 className="text-2xl font-bold">All Products</h2>
                        <p className="text-muted-foreground">{products.length} products found</p>
                    </div>
                </div>
                <ProductGrid products={products} columns={columns} />
            </div>
        </section>
    );
}


