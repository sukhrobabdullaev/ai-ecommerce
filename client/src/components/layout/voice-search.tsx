'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchStore } from '@/store/search-store';

export function VoiceSearch() {
    const [isSupported, setIsSupported] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const { voiceState, startListening, stopListening, setTranscript, setProcessing } = useSearchStore();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
                setIsSupported(true);
                const recognitionInstance = new SpeechRecognition();

                recognitionInstance.continuous = false;
                recognitionInstance.interimResults = true;
                recognitionInstance.lang = 'en-US';

                recognitionInstance.onstart = () => {
                    startListening();
                };

                recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
                    const transcript = Array.from(event.results)
                        .map(result => result[0])
                        .map(result => result.transcript)
                        .join('');

                    setTranscript(transcript);
                };

                recognitionInstance.onend = () => {
                    stopListening();
                };

                recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
                    console.error('Speech recognition error:', event.error);
                    stopListening();
                };

                setRecognition(recognitionInstance);
            }
        }
    }, [startListening, stopListening, setTranscript]);

    const handleVoiceSearch = () => {
        if (!recognition) return;

        if (voiceState.isListening) {
            recognition.stop();
        } else {
            setProcessing(true);
            recognition.start();
        }
    };

    if (!isSupported) {
        return null;
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleVoiceSearch}
            disabled={voiceState.isProcessing}
            className={`h-6 w-6 ${voiceState.isListening ? 'voice-pulse text-red-500' : 'text-muted-foreground'
                }`}
        >
            {voiceState.isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : voiceState.isListening ? (
                <MicOff className="h-4 w-4" />
            ) : (
                <Mic className="h-4 w-4" />
            )}
        </Button>
    );
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        SpeechRecognition: {
            new(): SpeechRecognition;
        };
        webkitSpeechRecognition: {
            new(): SpeechRecognition;
        };
    }
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    start(): void;
    stop(): void;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}
