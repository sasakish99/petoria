'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ChevronLeft, Camera, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const ImageCropModal = dynamic(() => import('@/components/ImageCropModal'), {
    ssr: false,
});

const PetCreate = () => {
    const router = useRouter();
    const { user } = useAuth({ middleware: 'auth' });
    
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('dog');
    const [gender, setGender] = useState('');
    const [breedId, setBreedId] = useState('');
    const [birthday, setBirthday] = useState('');
    const [lastVaccinationDate, setLastVaccinationDate] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [themeColor, setThemeColor] = useState('indigo');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const themeColors = [
        { name: 'indigo', bg: 'bg-indigo-600' },
        { name: 'rose', bg: 'bg-rose-500' },
        { name: 'amber', bg: 'bg-amber-500' },
        { name: 'emerald', bg: 'bg-emerald-500' },
        { name: 'blue', bg: 'bg-blue-500' },
    ];

    const { data: breeds } = useSWR('/api/breeds', () =>
        axios.get('/api/breeds').then(res => res.data)
    );

    const filteredBreeds = breeds?.filter((b: any) => b.species === species) || [];

    useEffect(() => {
        setBreedId('');
    }, [species]);

    if (!user) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setTempImage(URL.createObjectURL(file));
            setShowCropModal(true);
        }
    };

    const onCropComplete = (croppedBlob: Blob) => {
        const file = new File([croppedBlob], 'pet_avatar.jpg', { type: 'image/jpeg' });
        setImage(file);
        setPreview(URL.createObjectURL(croppedBlob));
    };

    const removeImage = () => {
        setImage(null);
        setPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const formData = new FormData();
        formData.append('name', name);
        formData.append('species', species);
        if (gender) formData.append('gender', gender);
        if (breedId) formData.append('breed_id', breedId);
        if (birthday) formData.append('birthday', birthday);
        if (lastVaccinationDate) formData.append('last_vaccination_date', lastVaccinationDate);
        if (targetWeight) formData.append('target_weight', targetWeight);
        formData.append('theme_color', themeColor);
        if (image) formData.append('image', image);

        try {
            await axios.post('/api/pets', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Submit error:', error);
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            {showCropModal && tempImage && (
                <ImageCropModal
                    image={tempImage}
                    onCropComplete={onCropComplete}
                    onClose={() => setShowCropModal(false)}
                />
            )}
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-8 border-b border-gray-50 flex items-center">
                    <button onClick={() => router.back()} className="p-2 mr-4 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">うちの子を登録する</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex flex-col items-center mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-4 w-full">顔写真</label>
                        <div className="relative group">
                            <div className={`w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 transition-all ${!preview && 'hover:border-indigo-400 hover:bg-indigo-50'}`}>
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                title="写真をアップロード"
                            />
                            {preview && (
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-gray-400">クリックして写真をアップロード</p>
                        {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">お名前</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            required
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">種類</label>
                        <select
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                        >
                            <option value="dog">犬</option>
                            <option value="cat">猫</option>
                            <option value="other">その他</option>
                        </select>
                        {errors.species && <p className="mt-1 text-sm text-red-600">{errors.species[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">性別 (任意)</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'male', label: 'オス' },
                                { id: 'female', label: 'メス' },
                                { id: 'other', label: '不明' },
                            ].map((g) => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => setGender(g.id)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                                        gender === g.id
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                                    }`}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>
                        {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender[0]}</p>}
                    </div>

                    {(species === 'dog' || species === 'cat') && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {species === 'dog' ? '犬種' : '猫種'}
                            </label>
                            <select
                                value={breedId}
                                onChange={(e) => setBreedId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                            >
                                <option value="">選択してください</option>
                                {filteredBreeds.map((breed: any) => (
                                    <option key={breed.id} value={breed.id}>
                                        {breed.name}
                                    </option>
                                ))}
                            </select>
                            {errors.breed_id && <p className="mt-1 text-sm text-red-600">{errors.breed_id[0]}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">誕生日 (任意)</label>
                        <input
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        {errors.birthday && <p className="mt-1 text-sm text-red-600">{errors.birthday[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">前回の混合ワクチン接種日 (任意)</label>
                        <input
                            type="date"
                            value={lastVaccinationDate}
                            onChange={(e) => setLastVaccinationDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        {errors.last_vaccination_date && <p className="mt-1 text-sm text-red-600">{errors.last_vaccination_date[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">目標体重 (kg, 任意)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        {errors.target_weight && <p className="mt-1 text-sm text-red-600">{errors.target_weight[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">テーマカラー</label>
                        <div className="flex space-x-3">
                            {themeColors.map((color) => (
                                <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => setThemeColor(color.name)}
                                    className={`h-10 w-10 rounded-full ${color.bg} transition-all ${
                                        themeColor === color.name 
                                            ? 'ring-4 ring-gray-200 scale-110 shadow-sm' 
                                            : 'opacity-40 hover:opacity-100'
                                    }`}
                                />
                            ))}
                        </div>
                        {errors.theme_color && <p className="mt-1 text-sm text-red-600">{errors.theme_color[0]}</p>}
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 rounded-2xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                        >
                            {loading ? '登録中...' : '登録する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PetCreate;
