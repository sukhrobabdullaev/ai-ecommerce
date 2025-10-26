'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, Zap, Users, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductGrid } from '@/components/product/product-grid';
import { useProductStore } from '@/store/product-store';
import { useChatStore } from '@/store/chat-store';
import { Alert, AlertDescription } from '@/components/ui/alert';


export function HomePage() {
  const { products, isLoading, error, fetchProducts } = useProductStore();
  const { createSession } = useChatStore();

  // Fetch featured products on component mount
  useEffect(() => {
    fetchProducts({ page: 1, page_size: 8 });
  }, [fetchProducts]);

  const featuredProducts = products.slice(0, 8);


  const handleStartAIChat = () => {
    createSession('LLM_PROMPTING');
  };

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: 'AI-Powered Shopping',
      description: 'Experience two different AI systems: Advanced LLM prompting vs. Domain-specific ML algorithms.',
      action: 'Start Chat',
      onClick: handleStartAIChat,
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: 'Smart Recommendations',
      description: 'Get personalized product suggestions based on your preferences and shopping history.',
      action: 'Explore Products',
      href: '/products',
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      title: 'Research Participation',
      description: 'Help improve AI systems by participating in our research comparing different approaches.',
      action: 'Join Research',
      href: '/research',
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      title: 'Real-time Analytics',
      description: 'View performance metrics and comparisons between different AI systems in real-time.',
      action: 'View Dashboard',
      href: '/research',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl space-y-6">
            <Badge variant="outline" className="mb-4">
              🧬 Advanced AI Research Platform
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              The Future of{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI Commerce
              </span>
            </h1>

            <p className="text-xl text-muted-foreground">
              Experience and compare cutting-edge AI systems: LLM prompting vs. domain-specific ML.
              Your interactions help us understand which approach works better for e-commerce.
            </p>


            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={handleStartAIChat} className="group">
                Start AI Shopping Experience
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/research">View Research Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;re not just an e-commerce platform – we&apos;re a research lab exploring the future of AI-powered shopping.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="group transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                {feature.onClick ? (
                  <Button
                    variant="ghost"
                    className="group-hover:bg-primary group-hover:text-primary-foreground"
                    onClick={feature.onClick}
                  >
                    {feature.action}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="group-hover:bg-primary group-hover:text-primary-foreground"
                    asChild
                  >
                    <Link href={feature.href!}>{feature.action}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
            <p className="text-muted-foreground">
              Try our AI systems with these popular products
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/products">
              View All Products <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading featured products...</span>
          </div>
        ) : (
          <ProductGrid products={featuredProducts} />
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience the Future?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of users helping us understand which AI approach works best for e-commerce.
            Your participation makes a difference in AI research.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleStartAIChat}
              className="group"
            >
              Start Your AI Journey
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/research" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Learn About Our Research
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}