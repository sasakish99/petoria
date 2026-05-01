<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pet;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class PetController extends Controller
{
    /*
    public function __construct()
    {
        $this->authorizeResource(Pet::class, 'pet');
    }
    */

    public function index(Request $request)
    {
        return $request->user()->pets;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'gender' => 'nullable|string|in:male,female,other',
            'breed_id' => 'nullable', // 一旦バリデーションを緩める
            'birthday' => 'nullable',
            'target_weight' => 'nullable',
            'theme_color' => 'nullable|string|max:20',
            'image' => 'nullable|image|max:10240', // 10MBまで
        ]);

        \Log::info('Store request data:', $request->all());
        \Log::info('Files:', $request->allFiles());

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('pets', 'public');
            \Log::info('Stored image path: ' . $imagePath);
        }

        $petData = [
            'name' => $validated['name'],
            'species' => $validated['species'],
            'gender' => $validated['gender'] ?? null,
            'breed_id' => $request->input('breed_id') ?: null,
            'birthday' => $request->input('birthday') ?: null,
            'target_weight' => $request->input('target_weight') ?: null,
            'theme_color' => $validated['theme_color'] ?? 'indigo',
        ];

        if ($imagePath) {
            $petData['image_path'] = $imagePath;
        }

        $pet = $request->user()->pets()->create($petData);

        return response()->json($pet, 201);
    }

    public function show(Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }
        return $pet->load(['weightLogs', 'healthLogs', 'medicalEvents', 'aiDiagnoses', 'medicalReceipts', 'healthCheckupResults']);
    }

    public function update(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'gender' => 'nullable|string|in:male,female,other',
            'breed_id' => 'nullable',
            'birthday' => 'nullable',
            'target_weight' => 'nullable',
            'theme_color' => 'nullable|string|max:20',
            'image' => 'nullable|image|max:10240',
        ]);

        \Log::info('Update request data:', $request->all());

        if ($request->hasFile('image')) {
            // 旧画像の削除
            if ($pet->image_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($pet->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('pets', 'public');
            \Log::info('Updated image path: ' . $validated['image_path']);
        }

        // バリデーション済みデータ以外も考慮して手動で詰め直し
        $updateData = array_merge($validated, [
            'gender' => $request->input('gender') ?: null,
            'breed_id' => $request->input('breed_id') ?: null,
            'birthday' => $request->input('birthday') ?: null,
            'target_weight' => $request->input('target_weight') ?: null,
        ]);

        $pet->update($updateData);

        return response()->json($pet);
    }

    public function destroy(Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }
        $pet->delete();

        return response()->noContent();
    }

    public function aiDiagnose(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        \Log::info('AI Diagnose request data:', $request->all());
        \Log::info('Pet details:', ['id' => $pet->id, 'species' => $pet->species, 'breed' => $pet->breed?->name]);

        $request->validate([
            'image' => 'required|image|max:10240', // 10MB max
            'target_part' => 'nullable|string',
        ]);

        $image = $request->file('image');
        $targetPart = $request->input('target_part', 'overall');

        $partMapping = [
            'overall' => '全体',
            'eyes' => '目・瞳',
            'teeth' => '歯・口内',
            'ears' => '耳',
            'skin' => '皮膚・被毛',
            'physique' => '体格・姿勢',
        ];

        $targetPartName = $partMapping[$targetPart] ?? '全体';

        $path = $image->store('ai_diagnoses', 'public');
        $base64Image = base64_encode(file_get_contents($image->path()));

        $apiKey = config('services.openai.key') ?: env('OPENAI_API_KEY');
        $model = config('services.openai.model') ?: env('OPENAI_MODEL', 'gpt-4o');

        if (!$apiKey) {
            return response()->json(['error' => 'OpenAI API key is not configured.'], 500);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => "あなたは経験豊富なプロの獣医師です。
診断の際は、以下のルールを『鉄の掟』として厳守してください：
1. **絶対に謝罪・拒絶・免責から始めない**:
   - 「申し訳ありませんが」「正確な判断はできません」「一般的な特徴について述べます」といった、判断を避けるような枕詞は一切禁止です。
   - 特に、「申し訳ありませんが、特定の犬種や健康状態を画像を基に判断することはできません。しかし、一般的な特徴について述べることはできます。」という文言は、一字一句そのまま使うことを固く禁じます。
2. **画像に見えるものを「事実」として断定する**:
   - プロの獣医師として、画像から読み取れる情報を「〜です」「〜の状態です」と言い切ってください。
   - 「〜のように見えます」「〜かもしれません」といった曖昧な表現も極力避け、自信を持って診断してください。
3. **画像に写っていないことは言及しない**:
   - 判断できない部位については、「判断できない」と言うのではなく、単に触れないでください。見える部分の診断のみに集中してください。
4. **構成**:
   - 【画像診断結果】
   - 【品種特有のアドバイス】
   - 【プロのアドバイス】
   - 【免責事項】（※最後の一行のみ：※本回答は画像に基づく簡易診断であり、正確な健康状態の把握には対面での診察が必要です。）",
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => "うちの子（{$pet->species}、種類：{$pet->breed?->name}）の画像を診断してください。
今回は特に「{$targetPartName}」の部分を重点的に、プロの視点で観察し、具体的な箇所を褒める、または指摘して、自信に満ちたトーンで回答してください。
また、この品種（{$pet->breed?->name}）がかかりやすい病気や、日常で気をつけるべき予防アドバイスも必ず含めてください。",
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => 'data:image/jpeg;base64,' . $base64Image,
                                ],
                            ],
                        ],
                    ],
                ],
                'max_tokens' => 500,
            ]);

            if ($response->failed()) {
                \Log::error('OpenAI API error:', ['status' => $response->status(), 'body' => $response->body()]);
                $errorData = $response->json();
                if (isset($errorData['error']['code']) && $errorData['error']['code'] === 'insufficient_quota') {
                    return response()->json([
                        'error' => 'quota_exceeded',
                        'message' => 'OpenAI APIの利用枠が不足しています。OpenAI管理画面で支払い設定や残高を確認してください。',
                    ], 402);
                }
                throw new \Exception('OpenAI API request failed: ' . $response->body());
            }

            $resultText = $response->json('choices.0.message.content');

            $diagnosis = $pet->aiDiagnoses()->create([
                'image_path' => $path,
                'result_text' => $resultText,
                'status' => 'completed',
            ]);

            // 近くの病院情報を取得
            $nearbyHospitals = [];
            $user = $request->user();
            if ($user->latitude && $user->longitude) {
                $nearbyHospitals = $this->getNearbyHospitals($user->latitude, $user->longitude);
            }

            return response()->json([
                'diagnosis' => $diagnosis,
                'nearby_hospitals' => $nearbyHospitals
            ]);
        } catch (\Exception $e) {
            $diagnosis = $pet->aiDiagnoses()->create([
                'image_path' => $path,
                'result_text' => '解析に失敗しました。時間をおいて再度お試しください。',
                'status' => 'failed',
            ]);

            return response()->json([
                'error' => 'AI解析に失敗しました。',
                'message' => $e->getMessage(),
                'diagnosis' => $diagnosis
            ], 500);
        }
    }

    private function getNearbyHospitals($lat, $lon)
    {
        try {
            $apiKey = config('services.google.maps_api_key');
            if (!$apiKey) return [];

            $placesResponse = Http::get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', [
                'location' => "{$lat},{$lon}",
                'radius' => 10000,
                'type' => 'veterinary_care',
                'key' => $apiKey,
                'language' => 'ja'
            ]);

            if (!$placesResponse->successful()) return [];

            $results = $placesResponse->json()['results'] ?? [];
            $hospitals = [];

            // 件数を10件に絞る
            $limitedResults = array_slice($results, 0, 10);

            foreach ($limitedResults as $item) {
                $itemLat = $item['geometry']['location']['lat'];
                $itemLng = $item['geometry']['location']['lng'];
                $placeId = $item['place_id'] ?? null;
                $openingHours = null;
                $phoneNumber = null;

                if ($placeId) {
                    $detailResponse = Http::get('https://maps.googleapis.com/maps/api/place/details/json', [
                        'place_id' => $placeId,
                        'fields' => 'opening_hours,formatted_phone_number',
                        'key' => $apiKey,
                        'language' => 'ja'
                    ]);
                    if ($detailResponse->successful()) {
                        $result = $detailResponse->json()['result'] ?? [];
                        $openingHours = $result['opening_hours']['weekday_text'] ?? null;
                        $phoneNumber = $result['formatted_phone_number'] ?? null;
                    }
                }

                $hospitals[] = [
                    'name' => $item['name'],
                    'display_name' => $item['vicinity'] ?? $item['name'],
                    'lat' => $itemLat,
                    'lon' => $itemLng,
                    'open_now' => $this->isOpenNow($item['opening_hours']['open_now'] ?? null, $openingHours),
                    'opening_hours' => $openingHours,
                    'phone_number' => $phoneNumber,
                    'rating' => $item['rating'] ?? null,
                    'user_ratings_total' => $item['user_ratings_total'] ?? null,
                    'distance' => $this->calculateDistance($lat, $lon, $itemLat, $itemLng)
                ];
            }

            usort($hospitals, function ($a, $b) {
                return $a['distance'] <=> $b['distance'];
            });

            return $hospitals;
        } catch (\Exception $e) {
            \Log::error('Hospital Search Error (PetController): ' . $e->getMessage());
            return [];
        }
    }

    private function isOpenNow($googleOpenNow, $weekdayText)
    {
        if ($googleOpenNow === true) return true;
        if (!$weekdayText || !is_array($weekdayText)) return $googleOpenNow;

        $now = now();
        $days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
        $todayName = $days[$now->dayOfWeek];

        foreach ($weekdayText as $line) {
            if (str_starts_with($line, $todayName)) {
                if (str_contains($line, '定休日') || str_contains($line, '休み')) return false;
                $timePart = str_replace($todayName . ': ', '', $line);
                $periods = explode(', ', $timePart);
                foreach ($periods as $period) {
                    if (preg_match('/(\d{1,2})[時:](\d{2})分?～(\d{1,2})[時:](\d{2})分?/u', $period, $matches)) {
                        $startTime = $now->copy()->setTime((int)$matches[1], (int)$matches[2]);
                        $endTime = $now->copy()->setTime((int)$matches[3], (int)$matches[4]);
                        if ($now->between($startTime, $endTime)) return true;
                    }
                }
                break;
            }
        }
        return $googleOpenNow;
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $theta = $lon1 - $lon2;
        $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
        $dist = acos($dist);
        $dist = rad2deg($dist);
        $miles = $dist * 60 * 1.1515;
        return round($miles * 1.609344, 2);
    }

    public function destroyAiDiagnoses(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:ai_diagnoses,id',
        ]);

        $ids = $request->input('ids');

        $diagnoses = $pet->aiDiagnoses()->whereIn('id', $ids)->get();

        foreach ($diagnoses as $diagnosis) {
            if ($diagnosis->image_path) {
                Storage::disk('public')->delete($diagnosis->image_path);
            }
            $diagnosis->delete();
        }

        return response()->noContent();
    }
}
