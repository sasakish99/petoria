<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\WeightLogController;
use App\Http\Controllers\Api\MedicalEventController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('pets', PetController::class);
    Route::post('pets/{pet}/weight-logs', [WeightLogController::class, 'store']);
    Route::post('pets/{pet}/medical-events', [MedicalEventController::class, 'store']);
});

require __DIR__.'/auth.php';
