'use client';

import { AISearch } from '@/components/search/ai-search';

interface HeroProps {
    onSearch: (query: string) => void;
    onResults: (results: any[]) => void;
}

export function Hero({ onSearch, onResults }: HeroProps) {
    return (
        <section className="gradient-bg text-white py-24">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center space-y-6 mb-12">
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight">Shop with AI Intelligence</h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                            Discover products through natural conversation, voice search, and personalized AI recommendations
                        </p>
                    </div>
                    <div className="flex justify-center mb-16">
                        <AISearch onSearch={onSearch} onResults={onResults} />
                    </div>
                </div>
            </div>
        </section>
    );
}


