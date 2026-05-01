<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalReceipt;
use App\Models\Pet;
use App\Services\OpenAiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MedicalReceiptController extends Controller
{
    protected OpenAiService $openAiService;

    public function __construct(OpenAiService $openAiService)
    {
        $this->openAiService = $openAiService;
    }

    /**
     * 診療明細をアップロードしてAI解析する
     */
    public function uploadAndAnalyze(Request $request, Pet $pet)
    {
        $request->validate([
            'image' => 'required|image|max:10240', // 10MBまで
        ]);

        $image = $request->file('image');
        $path = $image->store("pets/{$pet->id}/receipts", 'public');

        // AI解析用にBase64エンコード
        $base64Image = base64_encode(file_get_contents($image->getRealPath()));

        $analysisResult = $this->openAiService->analyzeMedicalReceipt($base64Image);

        if (!$analysisResult) {
            return response()->json(['message' => 'AI解析に失敗しました。'], 500);
        }

        $petName = $analysisResult['pet_name'] ?? null;
        if ($petName) {
            $petName = preg_replace('/(ちゃん|くん)$/u', '', $petName);
        }

        $receipt = MedicalReceipt::create([
            'pet_id' => $pet->id,
            'image_path' => $path,
            'clinic_name' => $analysisResult['clinic_name'] ?? null,
            'receipt_date' => $analysisResult['receipt_date'] ?? null,
            'total_amount' => $analysisResult['total_amount'] ?? null,
            'items' => $analysisResult['items'] ?? [],
            'raw_text' => $analysisResult['raw_text'] ?? null,
            'pet_name' => $petName,
            'status' => 'completed',
        ]);

        return response()->json($receipt);
    }

    /**
     * 診療明細一覧取得
     */
    public function index(Pet $pet)
    {
        $receipts = $pet->medicalReceipts()->orderBy('receipt_date', 'desc')->get();
        return response()->json($receipts);
    }

    /**
     * 診療明細詳細取得
     */
    public function show(Pet $pet, MedicalReceipt $medicalReceipt)
    {
        return response()->json($medicalReceipt);
    }

    /**
     * 診療明細の更新
     */
    public function update(Request $request, Pet $pet, MedicalReceipt $medicalReceipt)
    {
        $validated = $request->validate([
            'clinic_name' => 'nullable|string|max:255',
            'receipt_date' => 'nullable|date',
            'total_amount' => 'nullable|numeric',
            'items' => 'nullable|array',
        ]);

        $medicalReceipt->update($validated);

        return response()->json($medicalReceipt);
    }

    /**
     * 診療明細の削除
     */
    public function destroy(Pet $pet, MedicalReceipt $medicalReceipt)
    {
        if ($medicalReceipt->image_path) {
            Storage::disk('public')->delete($medicalReceipt->image_path);
        }
        $medicalReceipt->delete();

        return response()->json(['message' => '削除しました。']);
    }

    public function bulkDestroy(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:medical_receipts,id',
        ]);

        $receipts = $pet->medicalReceipts()->whereIn('id', $request->ids)->get();

        foreach ($receipts as $receipt) {
            if ($receipt->image_path) {
                Storage::disk('public')->delete($receipt->image_path);
            }
            $receipt->delete();
        }

        return response()->json(['message' => '削除しました。']);
    }
}
