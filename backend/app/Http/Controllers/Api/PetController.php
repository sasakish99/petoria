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
            'breed_id' => 'nullable|exists:breeds,id',
            'birthday' => 'nullable|date',
            'target_weight' => 'nullable|numeric|min:0',
            'theme_color' => 'nullable|string|max:20',
        ]);

        $pet = $request->user()->pets()->create($validated);

        return response()->json($pet, 201);
    }

    public function show(Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }
        return $pet->load(['weightLogs', 'healthLogs', 'medicalEvents', 'aiDiagnoses']);
    }

    public function update(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'breed_id' => 'nullable|exists:breeds,id',
            'birthday' => 'nullable|date',
            'target_weight' => 'nullable|numeric|min:0',
            'theme_color' => 'nullable|string|max:20',
        ]);

        $pet->update($validated);

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

        $request->validate([
            'image' => 'required|image|max:10240', // 10MB max
        ]);

        $image = $request->file('image');
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
                                'text' => "このペット（{$pet->species}、種類：{$pet->breed?->name}）の画像を診断してください。
画像から見える目の輝き、毛並み、皮膚、体格、姿勢などをプロの視点で観察し、具体的な箇所を褒める、または指摘して、自信に満ちたトーンで回答してください。
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

            return response()->json($diagnosis);
        } catch (\Exception $e) {
            $diagnosis = $pet->aiDiagnoses()->create([
                'image_path' => $path,
                'result_text' => '解析に失敗しました。時間をおいて再度お試しください。',
                'status' => 'failed',
            ]);

            return response()->json([
                'error' => 'AI analysis failed.',
                'message' => $e->getMessage(),
                'diagnosis' => $diagnosis
            ], 500);
        }
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
