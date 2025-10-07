'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIChatbot } from './ai-chatbot';

export function ChatButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Add animation when the component mounts
    useEffect(() => {
        // Add the animation class to the stylesheet if it doesn't exist
        if (!document.querySelector('#chat-button-animation')) {
            const style = document.createElement('style');
            style.id = 'chat-button-animation';
            style.innerHTML = `
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }

        // Stop animation after 3 bounces
        const timeout = setTimeout(() => {
            const button = document.querySelector('.chat-button');
            if (button && !hasInteracted) {
                button.classList.remove('animate-bounce-slow');
            }
        }, 9000);

        return () => clearTimeout(timeout);
    }, [hasInteracted]);

    return (
        <>
            <Button
                onClick={() => {
                    setIsOpen(true);
                    setHasInteracted(true);
                }}
                className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 z-50 animate-bounce-slow chat-button"
                size="icon"
                aria-label="Chat with AI Assistant"
            >
                <MessageCircle className="h-8 w-8 text-white" />
                <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-7 w-7 p-0 flex items-center justify-center text-xs font-bold bg-white text-indigo-600 animate-pulse"
                >
                    AI
                </Badge>
            </Button>

            <AIChatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}