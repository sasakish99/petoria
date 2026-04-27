'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function HealthLogHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    useEffect(() => {
        router.replace(`/pets/${id}/history`);
    }, [id, router]);

    return null;
}
