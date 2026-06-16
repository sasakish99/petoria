<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pet;
use App\Models\MedicalEvent;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class VaccinationCertificateController extends Controller
{
    public function analyze(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'image' => 'required|image|max:10240',
        ]);

        $image = $request->file('image');

        // 保存（一時的なものとしても、後の登録で使うため certificates に保存）
        $path = $image->store('certificates', 'public');
        $base64Image = base64_encode(file_get_contents($image->path()));

        // OpenAIで解析
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
                        'content' => "あなたは動物病院のワクチン接種証明書を解析するエキスパートです。
画像から正確に情報を抽出し、JSONフォーマットで回答してください。

### 解析ステップ:
1. **書類種別特定**: 狂犬病予防注射済証なのか、混合ワクチン接種証明書なのかを判断します。
2. **日付抽出**: 接種日を特定します。次回の接種予定日や有効期限と混同しないよう注意してください。
3. **ペット特定**: 接種を受けたペットの名前を特定し、敬称を除外します。
4. **病院特定**: 発行元の動物病院名を特定します。

### 抽出の際の注意点:
- **接種日**: 「接種日」「施行日」「注射日」などを探してください。
- **ワクチンの種類**:
  - 狂犬病の場合は 'rabies'
  - 混合ワクチン（3種, 5種, 8種など）の場合は 'mixed'
- **病院名**: 印影（赤いスタンプ）の中や、最下部の住所付近に記載されています。
- **ペットの名前**: 「犬名」「猫名」「患者名」などを探し、敬称（ちゃん、くん、様、殿）を除外してください。
- **OCR補正**: 数字の「0」と「O」、「1」と「I」などの誤読に注意してください。

### JSONフォーマット:
{
  \"vaccination_date\": \"YYYY-MM-DD\",
  \"vaccine_type\": \"mixed\" または \"rabies\",
  \"clinic_name\": \"...\",
  \"pet_name\": \"...\"
}",
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => "この証明書画像から情報を抽出してください。",
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
                'response_format' => ['type' => 'json_object'],
            ]);

            if ($response->failed()) {
                throw new \Exception('AI解析に失敗しました。');
            }

            $aiResult = json_decode($response->json('choices.0.message.content'), true);
            $eventDate = $aiResult['vaccination_date'] ?? null;
            $vaccineType = $aiResult['vaccine_type'] ?? 'mixed';
            $clinicName = $aiResult['clinic_name'] ?? null;
            $petName = $aiResult['pet_name'] ?? null;

            if ($petName) {
                $petName = preg_replace('/(ちゃん|くん|様|殿)$/u', '', $petName);
            }

            return response()->json([
                'message' => '解析が完了しました。内容を確認してください。',
                'analysis' => [
                    'vaccine_type' => $vaccineType,
                    'event_date' => $eventDate,
                    'clinic_name' => $clinicName,
                    'pet_name' => $petName,
                    'certificate_path' => $path,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => '解析中にエラーが発生しました。',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'vaccine_type' => 'required|in:mixed,rabies',
            'event_date' => 'required|date',
            'clinic_name' => 'nullable|string|max:255',
            'certificate_path' => 'required|string',
        ]);

        $vaccineName = $validated['vaccine_type'] === 'mixed' ? '混合ワクチン' : '狂犬病ワクチン';
        $eventDate = $validated['event_date'];

        $medicalEvent = $pet->medicalEvents()->create([
            'title' => $vaccineName,
            'vaccine_type' => $validated['vaccine_type'],
            'clinic_name' => $validated['clinic_name'],
            'event_date' => $eventDate,
            'next_event_date' => Carbon::parse($eventDate)->addYear()->toDateString(),
            'is_completed' => true,
            'certificate_path' => $validated['certificate_path'],
            'notes' => 'AI解析により登録された記録です。',
        ]);

        return response()->json([
            'message' => 'ワクチンの記録を保存しました。',
            'medical_event' => $medicalEvent,
        ]);
    }
}
