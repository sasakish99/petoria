'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Receipt, Calendar, Building2, JapaneseYen, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const MedicalReceiptHistory = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth({ middleware: 'auth' });
    const petId = params.id;
    
    const [pet, setPet] = useState<any>(null);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (petId) {
            Promise.all([
                axios.get(`/api/pets/${petId}`),
                axios.get(`/api/pets/${petId}/medical-receipts`)
            ]).then(([petRes, receiptsRes]) => {
                setPet(petRes.data);
                setReceipts(receiptsRes.data);
            }).catch(err => console.error(err))
            .finally(() => setLoading(false));
        }
    }, [petId]);

    const handleDelete = async (receiptId: number) => {
        if (!confirm('この明細を削除してもよろしいですか？')) return;
        
        try {
            await axios.delete(`/api/pets/${petId}/medical-receipts/${receiptId}`);
            setReceipts(receipts.filter(r => r.id !== receiptId));
        } catch (err) {
            alert('削除に失敗しました。');
        }
    };

    if (!user || !pet || loading) {
        return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">読み込み中...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
                    <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600">
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-black bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">診療明細履歴</h1>
                    <Link 
                        href={`/pets/${petId}/medical-receipts`}
                        className="ml-auto bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                    >
                        新規追加
                    </Link>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 py-8">
                {receipts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xl shadow-slate-200/50">
                        <div className="h-20 w-20 rounded-2xl bg-slate-50 text-slate-200 flex items-center justify-center mx-auto mb-6">
                            <Receipt className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2">履歴がありません</h2>
                        <p className="text-slate-400 font-bold mb-8">診療明細をアップロードしてAIで解析しましょう</p>
                        <Link 
                            href={`/pets/${petId}/medical-receipts`}
                            className="inline-flex items-center px-8 py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-700 transition-all shadow-xl shadow-slate-200"
                        >
                            明細をアップロードする
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {receipts.map((receipt) => (
                            <div key={receipt.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                                <div className="p-6 flex items-start space-x-6">
                                    <div className="h-24 w-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                                        <img 
                                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${receipt.image_path}`} 
                                            alt="Receipt" 
                                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-black text-slate-800 text-lg truncate mb-1">
                                                    {receipt.clinic_name || '名称未設定'}
                                                </h3>
                                                <div className="flex flex-wrap gap-y-1 gap-x-4">
                                                    <div className="flex items-center text-sm font-bold text-slate-500">
                                                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                                        {receipt.receipt_date}
                                                    </div>
                                                    <div className="flex items-center text-sm font-black text-indigo-600">
                                                        <JapaneseYen className="h-3.5 w-3.5 mr-1" />
                                                        {Math.floor(Number(receipt.total_amount) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button 
                                                    onClick={() => handleDelete(receipt.id)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {receipt.items && receipt.items.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {receipt.items.slice(0, 3).map((item: any, idx: number) => (
                                                    <span key={idx} className="text-[10px] font-black bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-tight">
                                                        {item.name}
                                                    </span>
                                                ))}
                                                {receipt.items.length > 3 && (
                                                    <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-100">
                                                        +{receipt.items.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MedicalReceiptHistory;
