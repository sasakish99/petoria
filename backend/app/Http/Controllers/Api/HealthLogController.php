<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pet;
use App\Models\HealthLog;

class HealthLogController extends Controller
{
    public function index(Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $logs = $pet->healthLogs()->orderBy('logged_at', 'desc')->get();

        return response()->json($logs);
    }

    public function store(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'meal_amount' => 'nullable|integer|min:0',
            'stool_status' => 'nullable|string|max:255',
            'urine_status' => 'nullable|string|max:255',
            'exercise_duration' => 'nullable|integer|min:0',
            'weight' => 'nullable|numeric|min:0',
            'memo' => 'nullable|string',
            'logged_at' => 'required|date_format:Y-m-d',
        ]);

        $log = $pet->healthLogs()->create($validated);

        return response()->json($log, 201);
    }

    public function update(Request $request, Pet $pet, HealthLog $healthLog)
    {
        if ($pet->user_id !== auth()->id() || $healthLog->pet_id !== $pet->id) {
            abort(403);
        }

        $validated = $request->validate([
            'meal_amount' => 'nullable|integer|min:0',
            'stool_status' => 'nullable|string|max:255',
            'urine_status' => 'nullable|string|max:255',
            'exercise_duration' => 'nullable|integer|min:0',
            'weight' => 'nullable|numeric|min:0',
            'memo' => 'nullable|string',
            'logged_at' => 'required|date_format:Y-m-d',
        ]);

        $healthLog->update($validated);

        return response()->json($healthLog);
    }

    public function destroy(Pet $pet, HealthLog $healthLog)
    {
        if ($pet->user_id !== auth()->id() || $healthLog->pet_id !== $pet->id) {
            abort(403);
        }

        $healthLog->delete();

        return response()->json(null, 204);
    }
}
