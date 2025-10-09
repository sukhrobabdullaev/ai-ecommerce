'use client';

import { ProductCard } from './product-card';
import { Product } from '@/types';

interface ProductGridProps {
    products: Product[];
    isProductsPage?: boolean;
    columns?: 1 | 2 | 3 | 4 | 5;
}

export function ProductGrid({
    products,
    columns = 4,
    isProductsPage
}: ProductGridProps) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    };

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold">No products found</h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search or filter criteria
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`grid ${isProductsPage ? gridCols[3] : gridCols[columns]} gap-6`}>
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                />
            ))}
        </div>
    );
}
