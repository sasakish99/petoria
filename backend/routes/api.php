<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\HealthLogController;
use App\Http\Controllers\Api\ExerciseLogController;
use App\Http\Controllers\Api\WeightLogController;
use App\Http\Controllers\Api\MedicalEventController;
use App\Http\Controllers\Api\MedicalReceiptController;
use App\Http\Controllers\Api\HealthCheckupResultController;
use App\Http\Controllers\Api\VaccinationCertificateController;
use App\Http\Controllers\Api\BreedController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::put('/user', function (Request $request) {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $user = $request->user();

        if (array_key_exists('name', $validated) && $validated['name'] !== null) {
            $user->name = $validated['name'];
        }

        if (array_key_exists('latitude', $validated)) {
            $user->latitude = $validated['latitude'];
        }

        if (array_key_exists('longitude', $validated)) {
            $user->longitude = $validated['longitude'];
        }

        $user->save();

        return response()->json($user);
    });

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/breeds', BreedController::class);
    Route::apiResource('pets', PetController::class);
    Route::post('pets/{pet}/ai-diagnose', [PetController::class, 'aiDiagnose']);
    Route::delete('pets/{pet}/ai-diagnoses', [PetController::class, 'destroyAiDiagnoses']);
    Route::delete('pets/{pet}/health-logs/bulk', [HealthLogController::class, 'bulkDestroy']);
    Route::get('pets/{pet}/health-logs', [HealthLogController::class, 'index']);
    Route::post('pets/{pet}/health-logs', [HealthLogController::class, 'store']);
    Route::put('pets/{pet}/health-logs/{healthLog}', [HealthLogController::class, 'update']);
    Route::delete('pets/{pet}/health-logs/{healthLog}', [HealthLogController::class, 'destroy']);
    Route::delete('pets/{pet}/exercise-logs/bulk', [ExerciseLogController::class, 'bulkDestroy']);
    Route::get('pets/{pet}/exercise-logs', [ExerciseLogController::class, 'index']);
    Route::post('pets/{pet}/exercise-logs', [ExerciseLogController::class, 'store']);
    Route::put('pets/{pet}/exercise-logs/{exerciseLog}', [ExerciseLogController::class, 'update']);
    Route::delete('pets/{pet}/exercise-logs/{exerciseLog}', [ExerciseLogController::class, 'destroy']);
    Route::post('pets/{pet}/weight-logs', [WeightLogController::class, 'store']);
    Route::post('pets/{pet}/medical-events', [MedicalEventController::class, 'store']);
    Route::delete('pets/{pet}/medical-events/bulk', [MedicalEventController::class, 'bulkDestroy']);
    Route::delete('pets/{pet}/medical-events/{medicalEvent}', [MedicalEventController::class, 'destroy']);
    Route::post('pets/{pet}/vaccination-certificates/analyze', [VaccinationCertificateController::class, 'analyze']);
    Route::post('pets/{pet}/vaccination-certificates', [VaccinationCertificateController::class, 'store']);

    Route::delete('pets/{pet}/medical-receipts/bulk', [MedicalReceiptController::class, 'bulkDestroy']);
    Route::get('pets/{pet}/medical-receipts', [MedicalReceiptController::class, 'index']);
    Route::post('pets/{pet}/medical-receipts/upload', [MedicalReceiptController::class, 'uploadAndAnalyze']);
    Route::get('pets/{pet}/medical-receipts/{medicalReceipt}', [MedicalReceiptController::class, 'show']);
    Route::put('pets/{pet}/medical-receipts/{medicalReceipt}', [MedicalReceiptController::class, 'update']);
    Route::delete('pets/{pet}/medical-receipts/{medicalReceipt}', [MedicalReceiptController::class, 'destroy']);

    Route::delete('pets/{pet}/health-checkup-results/bulk', [HealthCheckupResultController::class, 'bulkDestroy']);
    Route::get('pets/{pet}/health-checkup-results', [HealthCheckupResultController::class, 'index']);
    Route::post('pets/{pet}/health-checkup-results/upload', [HealthCheckupResultController::class, 'uploadAndAnalyze']);
    Route::get('pets/{pet}/health-checkup-results/{healthCheckupResult}', [HealthCheckupResultController::class, 'show']);
    Route::put('pets/{pet}/health-checkup-results/{healthCheckupResult}', [HealthCheckupResultController::class, 'update']);
    Route::delete('pets/{pet}/health-checkup-results/{healthCheckupResult}', [HealthCheckupResultController::class, 'destroy']);
});

require __DIR__.'/auth.php';
