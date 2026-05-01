<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HealthCheckupResult;
use App\Models\Pet;
use App\Services\OpenAiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HealthCheckupResultController extends Controller
{
    protected OpenAiService $openAiService;

    public function __construct(OpenAiService $openAiService)
    {
        $this->openAiService = $openAiService;
    }

    /**
     * 健康診断結果をアップロードしてAI解析する
     */
    public function uploadAndAnalyze(Request $request, Pet $pet)
    {
        $request->validate([
            'image' => 'required|image|max:10240', // 10MBまで
        ]);

        $image = $request->file('image');
        $path = $image->store("pets/{$pet->id}/health-checkups", 'public');

        // AI解析用にBase64エンコード
        $base64Image = base64_encode(file_get_contents($image->getRealPath()));

        $analysisResult = $this->openAiService->analyzeHealthCheckup($base64Image);

        if (!$analysisResult) {
            return response()->json(['message' => 'AI解析に失敗しました。'], 500);
        }

        $petName = $analysisResult['pet_name'] ?? null;
        if ($petName) {
            $petName = preg_replace('/(ちゃん|くん)$/u', '', $petName);
        }

        $result = HealthCheckupResult::create([
            'pet_id' => $pet->id,
            'image_path' => $path,
            'clinic_name' => $analysisResult['clinic_name'] ?? null,
            'pet_name' => $petName,
            'checkup_date' => $analysisResult['checkup_date'] ?? null,
            'results' => $analysisResult['results'] ?? [],
            'raw_text' => $analysisResult['raw_text'] ?? null,
            'status' => 'completed',
        ]);

        return response()->json($result);
    }

    /**
     * 健康診断結果一覧取得
     */
    public function index(Pet $pet)
    {
        $results = $pet->healthCheckupResults()->orderBy('checkup_date', 'desc')->get();
        return response()->json($results);
    }

    /**
     * 健康診断結果詳細取得
     */
    public function show(Pet $pet, HealthCheckupResult $healthCheckupResult)
    {
        return response()->json($healthCheckupResult);
    }

    /**
     * 健康診断結果の更新
     */
    public function update(Request $request, Pet $pet, HealthCheckupResult $healthCheckupResult)
    {
        $validated = $request->validate([
            'clinic_name' => 'nullable|string|max:255',
            'checkup_date' => 'nullable|date',
            'results' => 'nullable|array',
        ]);

        $healthCheckupResult->update($validated);

        return response()->json($healthCheckupResult);
    }

    /**
     * 健康診断結果の削除
     */
    public function destroy(Pet $pet, HealthCheckupResult $healthCheckupResult)
    {
        if ($healthCheckupResult->image_path) {
            Storage::disk('public')->delete($healthCheckupResult->image_path);
        }
        $healthCheckupResult->delete();

        return response()->json(['message' => '削除しました。']);
    }

    public function bulkDestroy(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:health_checkup_results,id',
        ]);

        $results = $pet->healthCheckupResults()->whereIn('id', $request->ids)->get();

        foreach ($results as $result) {
            if ($result->image_path) {
                Storage::disk('public')->delete($result->image_path);
            }
            $result->delete();
        }

        return response()->json(['message' => '削除しました。']);
    }
}
