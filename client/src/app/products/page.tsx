import { serverAPI } from '@/lib/server-api';
import { ProductsPageClient } from '@/components/product/products-page-client';
import { Sparkles } from 'lucide-react';

interface ProductsPageProps {
    searchParams: {
        page?: string;
        page_size?: string;
        category_id?: string;
        search?: string;
        min_price?: string;
        max_price?: string;
        brand?: string;
        in_stock_only?: string;
    };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    // Parse search params
    const page = parseInt(searchParams.page || '1');
    const pageSize = parseInt(searchParams.page_size || '20');
    const filters = {
        page,
        page_size: pageSize,
        category_id: searchParams.category_id,
        search: searchParams.search,
        min_price: searchParams.min_price ? parseFloat(searchParams.min_price) : undefined,
        max_price: searchParams.max_price ? parseFloat(searchParams.max_price) : undefined,
        brand: searchParams.brand,
        in_stock_only: searchParams.in_stock_only === 'true',
    };

    let productsData;
    let categoriesData;

    try {
        // Fetch products and categories in parallel
        const [productsResponse, categoriesResponse] = await Promise.all([
            searchParams.search
                ? serverAPI.searchProducts(searchParams.search, { page, page_size: pageSize })
                : serverAPI.getProducts(filters),
            serverAPI.getCategories({ page_size: 100 })
        ]);

        productsData = productsResponse;
        categoriesData = categoriesResponse;
    } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to empty data
        productsData = { products: [], total: 0, page: 1, page_size: 20, total_pages: 0 };
        categoriesData = { categories: [], total: 0, page: 1, page_size: 100, total_pages: 0 };
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">All Products</h1>
                        <p className="text-muted-foreground">
                            Discover our collection with AI-powered search and smart filters
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">AI-Optimized Filtering</span>
                    </div>
                </div>

                {/* Client-side interactive components */}
                <ProductsPageClient
                    initialProducts={productsData.products}
                    initialPagination={productsData}
                    initialFilters={filters}
                />
            </div>
        </div>
    );
}