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
あなたは動物病院の診療明細書（レシート、請求書）を解析するエキスパートです。
画像から正確に情報を抽出し、JSONフォーマットで回答してください。

### 解析ステップ:
1. **テキスト抽出**: 画像内の全テキストを慎重に読み取ります。
2. **構造把握**: 表のヘッダー（項目名、単価、数量、金額など）の位置関係を特定します。
3. **データ抽出**: 各行から項目を抽出します。
4. **検証**: 合計金額が各項目の合計と一致するか、単価×数量が金額と一致するかを確認します。

### 抽出の際の注意点:
- **病院名**: レシート最上部の大きな文字や、住所と一緒に記載されている「〇〇動物病院」という名称を探してください。
- **診療日**: 「発行日」「診察日」「202X年XX月XX日」といった形式の日付を探してください。
- **合計金額**: 「合計」「税込合計」「請求額」などの最終的な支払額を数値で抽出してください。
- **ペットの名前**: 「患者名」「オーナー名」の横、または「[ペット名]ちゃん」のように記載されています。「ちゃん」「くん」「様」「殿」などの敬称は除外してください。
- **明細項目**:
  - 項目名(name): 「再診料」「混合ワクチン」「皮下注射」など。
  - 単価(price): 1つあたりの価格。
  - 数量(quantity): 個数。
  - 金額(total): その行の合計額。
  - **重要**: 金額(total)が0になっている場合は、単価(price)と数量(quantity)から計算(price * quantity)して補完してください。
- **OCR補正**: 数字の「0」と「O」、「1」と「I」、「5」と「S」などの誤読に注意し、金額として不自然でないか文脈から判断してください。

### 抽出項目:
1. clinic_name: 病院名
2. receipt_date: 診療日 (YYYY-MM-DD)
3. total_amount: 合計金額 (整数)
4. pet_name: ペットの名前 (敬称除外)
5. items: 明細項目の配列 ({name, price, quantity, total})。priceとtotalは整数で抽出してください。

### JSONフォーマット:
{
  "clinic_name": "...",
  "receipt_date": "YYYY-MM-DD",
  "total_amount": 0,
  "pet_name": "...",
  "items": [
    {"name": "...", "price": 0, "quantity": 0, "total": 0}
  ],
  "raw_text": "..."
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
あなたはペットの健康診断結果表を解析するエキスパートです。
画像から数値を正確に抽出し、JSONフォーマットで回答してください。

### 解析ステップ:
1. **全体把握**: 検査項目、結果数値、基準値、単位、判定がどの列にあるかを把握します。
2. **項目抽出**: 各行の検査項目とそれに対応する数値を読み取ります。
3. **異常値判定**: 数値が基準値外であるか、または「▲」「▼」「H」「L」「*」などの記号が付いているかを確認します。
4. **ペット特定**: 受診したペットの名前を特定します。

### 抽出の際の注意点:
- **病院名**: ヘッダー、フッター、または「〇〇動物病院」と書かれた印影から探してください。
- **検査日**: 「実施日」「検査日」「報告日」を探してください。
- **ペットの名前**: 「氏名」「患者名」などを探し、敬称（ちゃん、くん、様、殿）を除外して抽出してください。
- **検査結果**:
  - item_name: 「WBC」「GOT」「血糖値」などの項目名。
  - value: 数値。単位は含めず数値のみを抽出してください（例: "5.4"）。
  - unit: 「mg/dL」「10^2/μL」などの単位。
  - reference_range: 「3.5 - 7.0」などの基準範囲。
  - evaluation: 「A」「B」「異常なし」などの判定。
  - is_out_of_range: 数値が基準値外である、または異常を示すマークが付いている場合に `true` としてください。
- **重要**: 数値(value)の読み取りを最優先してください。桁数や小数点の位置に注意してください。

### 抽出項目:
1. clinic_name: 病院名
2. checkup_date: 検査日 (YYYY-MM-DD)
3. pet_name: ペットの名前 (敬称除外)
4. results: 検査結果の配列 ({item_name, value, unit, reference_range, evaluation, is_out_of_range})

### JSONフォーマット:
{
  "clinic_name": "...",
  "checkup_date": "YYYY-MM-DD",
  "pet_name": "...",
  "results": [
    {"item_name": "...", "value": "...", "unit": "...", "reference_range": "...", "evaluation": "...", "is_out_of_range": false}
  ],
  "raw_text": "..."
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
