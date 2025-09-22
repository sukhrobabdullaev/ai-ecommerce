'use client';

import { useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIChatbot } from './ai-chatbot';

export function ChatButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 z-40 chat-button-enter"
                size="icon"
            >
                <MessageCircle className="h-6 w-6 text-white" />
                <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs animate-pulse"
                >
                    AI
                </Badge>
            </Button>

            <AIChatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
