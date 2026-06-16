'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, MapPin, User, Loader2, Search, Trash2 } from 'lucide-react';

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
    latitude: null as number | null,
    longitude: null as number | null,
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
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'お使いのブラウザは位置情報に対応していません。' });
      return;
    }

    setSearchingZip(true); // 読み込み状態として再利用
    setMessage({ type: '', text: '' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLon = position.coords.longitude;
        setFormData({
          ...formData,
          latitude: newLat,
          longitude: newLon,
        });
        setMessage({ type: 'success', text: '位置情報を取得しました。保存ボタンを押して確定してください。' });
        setSearchingZip(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = '位置情報の取得に失敗しました。';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = '位置情報の利用が許可されていません。設定から許可してください。';
        }
        setMessage({ type: 'error', text: errorMsg });
        setSearchingZip(false);
      }
    );
  };

  const handleClearLocation = () => {
    setFormData({
      ...formData,
      latitude: null,
      longitude: null,
    });
    setMessage({ type: 'success', text: '位置情報をクリアしました。保存ボタンを押して確定してください。' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put('/api/user', {
        name: formData.name,
        latitude: formData.latitude,
        longitude: formData.longitude,
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

        <div 
          className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100/50 bg-white/50">
            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">
              飼い主情報の設定
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              位置情報を設定すると、お住まいの地域の天気や近くの動物病院をご案内できるようになります。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {message.text && (
              <div 
                className={`p-4 rounded-2xl text-sm font-medium overflow-hidden ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}
              >
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 focus:ring focus:ring-slate-200/50 transition-all text-slate-900"
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
                  位置情報
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-slate-500">
                      {formData.latitude && formData.longitude ? (
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-900 font-bold">
                              現在設定されている位置情報: 緯度 {Number(formData.latitude).toFixed(4)}, 経度 {Number(formData.longitude).toFixed(4)}
                            </span>
                            <button
                              type="button"
                              onClick={handleClearLocation}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="位置情報を削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-rose-500 font-bold">位置情報が設定されていません</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={searchingZip}
                    className="w-full px-6 py-4 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center disabled:opacity-50 shadow-sm border border-slate-200"
                  >
                    {searchingZip ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Search className="w-5 h-5 mr-2" />
                    )}
                    GPSで現在地を取得する
                  </button>
                  <p className="text-[11px] text-slate-400 mt-4 leading-relaxed text-center">
                    ※ブラウザの位置情報利用の許可が必要です。<br />
                    ※取得した位置情報は、天気情報や近くの病院検索にのみ使用されます。
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 active:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all duration-200 shadow-lg shadow-slate-200 disabled:opacity-50"
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
