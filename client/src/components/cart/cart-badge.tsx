'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cart-store';

interface CartBadgeProps {
    className?: string;
}

export function CartBadge({ className }: CartBadgeProps) {
    const [mounted, setMounted] = useState(false);
    const { getTotalItems } = useCartStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const cartItemCount = getTotalItems();

    if (cartItemCount === 0) {
        return null;
    }

    return (
        <Badge className={className}>
            {cartItemCount}
        </Badge>
    );
}
