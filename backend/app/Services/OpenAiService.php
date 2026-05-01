<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiService
{
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.openai.key');
    }

    /**
     * 診療明細画像を解析して構造化データを返す
     *
     * @param string $base64Image 画像のBase64エンコードデータ
     * @return array|null 解析結果
     */
    public function analyzeMedicalReceipt(string $base64Image): ?array
    {
        $prompt = <<<EOT
この画像は動物病院の診療明細（レシート）です。
以下の情報を抽出し、指定されたJSONフォーマットで返してください。
日本語で回答してください。

抽出項目:
1. 病院名 (clinic_name)
2. 診療日 (receipt_date: YYYY-MM-DD形式)
3. 合計金額 (total_amount: 数値)
4. ペットの名前 (pet_name: 「ちゃん」や「くん」などの敬称が含まれる場合は除外して名前のみを抽出してください)
5. 明細項目 (items: {name: 項目名, price: 単価, quantity: 数量, total: 金額} の配列)

JSONフォーマット例:
{
  "clinic_name": "わんにゃん動物病院",
  "receipt_date": "2026-05-01",
  "total_amount": 5500,
  "pet_name": "レオ",
  "items": [
    {"name": "再診料", "price": 1000, "quantity": 1, "total": 1000},
    {"name": "混合ワクチン", "price": 4500, "quantity": 1, "total": 4500}
  ],
  "raw_text": "解析された全テキスト"
}
EOT;

        try {
            $response = Http::withToken($this->apiKey)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o',
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => [
                                [
                                    'type' => 'text',
                                    'text' => $prompt,
                                ],
                                [
                                    'type' => 'image_url',
                                    'image_url' => [
                                        'url' => "data:image/jpeg;base64,{$base64Image}",
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'max_tokens' => 1000,
                ]);

            if ($response->successful()) {
                $result = $response->json();
                return json_decode($result['choices'][0]['message']['content'], true);
            }

            Log::error('OpenAI API Error: ' . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error('OpenAI Service Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 健康診断結果画像を解析して構造化データを返す
     *
     * @param string $base64Image 画像のBase64エンコードデータ
     * @return array|null 解析結果
     */
    public function analyzeHealthCheckup(string $base64Image): ?array
    {
        $prompt = <<<EOT
この画像はペットの健康診断結果表です。
以下の情報を抽出し、指定されたJSONフォーマットで返してください。
日本語で回答してください。

抽出項目:
1. 病院名 (clinic_name)
2. 検査日 (checkup_date: YYYY-MM-DD形式)
3. ペットの名前 (pet_name: 「ちゃん」や「くん」などの敬称が含まれる場合は除外して名前のみを抽出してください)
4. 検査項目と結果 (results: {item_name: 項目名, value: 数値/結果, unit: 単位, reference_range: 基準値, evaluation: 判定(A, B, C等), is_out_of_range: 基準範囲外か(boolean)} の配列)
   ※項目名や数値の横に「▲」や「▼」といった黒三角がある場合は、基準範囲外（is_out_of_range: true）と判断してください。

JSONフォーマット例:
{
  "clinic_name": "わんにゃん動物病院",
  "checkup_date": "2026-05-01",
  "pet_name": "レオ",
  "results": [
    {"item_name": "体重", "value": "4.5", "unit": "kg", "reference_range": "4.0-5.0", "evaluation": "正常", "is_out_of_range": false},
    {"item_name": "GPT (ALT)", "value": "120", "unit": "U/L", "reference_range": "10-100", "evaluation": "高い", "is_out_of_range": true}
  ],
  "raw_text": "解析された全テキスト"
}
EOT;

        try {
            $response = Http::withToken($this->apiKey)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o',
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => [
                                [
                                    'type' => 'text',
                                    'text' => $prompt,
                                ],
                                [
                                    'type' => 'image_url',
                                    'image_url' => [
                                        'url' => "data:image/jpeg;base64,{$base64Image}",
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'max_tokens' => 2000,
                ]);

            if ($response->successful()) {
                $result = $response->json();
                return json_decode($result['choices'][0]['message']['content'], true);
            }

            Log::error('OpenAI API Error (HealthCheckup): ' . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error('OpenAI Service Exception (HealthCheckup): ' . $e->getMessage());
            return null;
        }
    }
}
