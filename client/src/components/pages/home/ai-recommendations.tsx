import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductGrid } from '@/components/product/product-grid';
import { Product } from '@/types';

interface AIRecommendationsProps {
    products: Product[];
}

export function AIRecommendations({ products }: AIRecommendationsProps) {
    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="flex items-center space-x-2 mb-8">
                    <Sparkles className="h-6 w-6 text-purple-500" />
                    <h2 className="text-3xl font-bold">AI Recommendations</h2>
                    <Badge variant="secondary" className="ai-gradient text-white border-0">Powered by AI</Badge>
                </div>
                <ProductGrid products={products} showAIRecommendations columns={4} />
            </div>
        </section>
    );
}


