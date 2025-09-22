'use client';

import { useState, useEffect } from 'react';

interface SearchCarouselProps {
    suggestions: string[];
    isVisible: boolean;
    onSuggestionClick: (suggestion: string) => void;
}

export function SearchCarousel({ suggestions, isVisible, onSuggestionClick }: SearchCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (isVisible && suggestions.length > 0) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % suggestions.length);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [isVisible, suggestions.length]);

    if (!isVisible || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="absolute left-12 top-1/2 transform -translate-y-1/2 text-white/60 text-lg pointer-events-none overflow-hidden h-6 w-full">
            <div
                className="transition-transform duration-1000 ease-in-out"
                style={{
                    transform: `translateY(-${currentIndex * 24}px)`,
                }}
            >
                {suggestions.map((suggestion, index) => (
                    <div
                        key={index}
                        className="h-6 flex items-center whitespace-nowrap cursor-pointer hover:text-white/80 transition-colors"
                        onClick={() => onSuggestionClick(suggestion)}
                    >
                        {suggestion}
                    </div>
                ))}
            </div>
        </div>
    );
}
