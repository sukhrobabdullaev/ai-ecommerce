import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, Zap, Star } from 'lucide-react';

export function Features() {
    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Why Choose AI Ecommerce?</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Experience the future of online shopping with our advanced AI-powered features
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="text-center p-6">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-2">AI Search</h3>
                        <p className="text-sm text-muted-foreground">Search naturally with voice or text. AI understands context and intent.</p>
                    </Card>
                    <Card className="text-center p-6">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Smart Recommendations</h3>
                        <p className="text-sm text-muted-foreground">Get personalized product suggestions based on your preferences.</p>
                    </Card>
                    <Card className="text-center p-6">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Zap className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Voice Shopping</h3>
                        <p className="text-sm text-muted-foreground">Shop hands-free with voice commands and natural conversation.</p>
                    </Card>
                    <Card className="text-center p-6">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Star className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Personalized Experience</h3>
                        <p className="text-sm text-muted-foreground">Every interaction is tailored to your unique shopping style.</p>
                    </Card>
                </div>
            </div>
        </section>
    );
}


