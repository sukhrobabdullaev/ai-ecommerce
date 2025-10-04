'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cart-store';

interface CartButtonTextProps {
    productId: string;
    baseText?: string;
}

export function CartButtonText({ productId, baseText = 'Add to Cart' }: CartButtonTextProps) {
    const [mounted, setMounted] = useState(false);
    const { getItemQuantity } = useCartStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{baseText}</>;
    }

    const cartQuantity = getItemQuantity(productId);

    if (cartQuantity > 0) {
        return <>{baseText} ({cartQuantity})</>;
    }

    return <>{baseText}</>;
}
