import { ResearchChatInterface } from '@/components/research/research-chat-interface';

export default function ChatPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">AI Shopping Assistant</h1>
                <p className="text-muted-foreground">
                    Compare different AI systems for product recommendations and shopping assistance
                </p>
            </div>

            <ResearchChatInterface />
        </div>
    );
}