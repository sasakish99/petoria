'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';
import { useRouter, useParams } from 'next/navigation';
import MedicalReceiptUploadModal from '@/components/MedicalReceiptUploadModal';

const MedicalReceiptUpload = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth({ middleware: 'auth' });
    const petId = params.id;
    
    const [pet, setPet] = useState<any>(null);

    useEffect(() => {
        if (petId) {
            axios.get(`/api/pets/${petId}`)
                .then(res => setPet(res.data))
                .catch(err => console.error(err));
        }
    }, [petId]);

    if (!user || !pet) {
        return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">読み込み中...</div>;
    }

    return (
        <MedicalReceiptUploadModal 
            isOpen={true} 
            onClose={() => router.back()} 
            pet={pet} 
            onSuccess={() => router.push(`/pets/${petId}/medical-receipts/history`)}
        />
    );
};

export default MedicalReceiptUpload;
