'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, MapPin, User, Loader2, Search } from 'lucide-react';

import axios from '@/lib/axios';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchingZip, setSearchingZip] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    zipcode: '',
    address: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/api/user');
      const data = response.data;
      setFormData({
        name: data.name || '',
        email: data.email || '',
        zipcode: data.zipcode || '',
        address: data.address || '',
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleZipSearch = async () => {
    if (!formData.zipcode || formData.zipcode.length < 7) {
      setMessage({ type: 'error', text: '正しい郵便番号を入力してください（ハイフンなし7桁）。' });
      return;
    }

    setSearchingZip(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${formData.zipcode}`);
      const data = await response.json();

      if (data.results && data.results[0]) {
        const result = data.results[0];
        const fullAddress = `${result.address1}${result.address2}${result.address3}`;
        setFormData({ ...formData, address: fullAddress });
      } else {
        setMessage({ type: 'error', text: '住所が見つかりませんでした。' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '郵便番号検索に失敗しました。' });
    } finally {
      setSearchingZip(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put('/api/user', {
        name: formData.name,
        zipcode: formData.zipcode,
        address: formData.address,
      });
      setMessage({ type: 'success', text: 'プロフィールを更新しました。' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: '更新に失敗しました。' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-slate-500 font-semibold hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          ダッシュボードに戻る
        </Link>

        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
          <div className="p-8 border-b border-slate-100/50 bg-white/50">
            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">
              飼い主情報の設定
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              住所を登録すると、AI診断時に近くの動物病院をご案内できるようになります。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {message.text && (
              <div className={`p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                  <User className="w-4 h-4 mr-2 text-slate-400" />
                  お名前
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 focus:ring focus:ring-slate-200 focus:ring-opacity-50 transition-all text-slate-900"
                  placeholder="飼い主さんのお名前"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                  <span className="w-4 h-4 mr-2 text-slate-400 flex items-center justify-center font-normal">@</span>
                  メールアドレス
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed font-medium"
                />
                <p className="text-[12px] text-slate-400 mt-2 ml-1">
                  メールアドレスは変更できません。
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                  郵便番号（自動入力）
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={formData.zipcode}
                    onChange={(e) => setFormData({ ...formData, zipcode: e.target.value.replace(/[^0-9]/g, '') })}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 focus:ring focus:ring-slate-200 focus:ring-opacity-50 transition-all text-slate-900"
                    placeholder="7桁の数字（ハイフンなし）"
                    maxLength={7}
                  />
                  <button
                    type="button"
                    onClick={handleZipSearch}
                    disabled={searchingZip || formData.zipcode.length < 7}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center disabled:opacity-50 shadow-sm border border-slate-200/50"
                  >
                    {searchingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                    検索
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                  住所
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 focus:ring focus:ring-slate-200 focus:ring-opacity-50 transition-all text-slate-900"
                  placeholder="例: 東京都渋谷区代々木"
                />
                <p className="text-[12px] text-slate-400 mt-2 ml-1 leading-relaxed">
                  市区町村以降の番地や建物名がある場合は、手動で追記してください。
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center px-6 py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 active:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all duration-200 shadow-lg shadow-slate-200 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    設定を保存する
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
