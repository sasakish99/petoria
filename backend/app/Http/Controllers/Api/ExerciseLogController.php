<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pet;
use App\Models\ExerciseLog;

class ExerciseLogController extends Controller
{
    public function index(Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $logs = $pet->exerciseLogs()->orderBy('logged_at', 'desc')->get();

        return response()->json($logs);
    }

    public function store(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'duration_minutes' => 'required|integer|min:0',
            'memo' => 'nullable|string',
            'logged_at' => 'required|date',
        ]);

        $log = $pet->exerciseLogs()->create($validated);

        return response()->json($log, 201);
    }

    public function update(Request $request, Pet $pet, ExerciseLog $exerciseLog)
    {
        if ($pet->user_id !== auth()->id() || $exerciseLog->pet_id !== $pet->id) {
            abort(403);
        }

        $validated = $request->validate([
            'duration_minutes' => 'required|integer|min:0',
            'memo' => 'nullable|string',
            'logged_at' => 'required|date',
        ]);

        $exerciseLog->update($validated);

        return response()->json($exerciseLog);
    }

    public function destroy(Pet $pet, ExerciseLog $exerciseLog)
    {
        if ($pet->user_id !== auth()->id() || $exerciseLog->pet_id !== $pet->id) {
            abort(403);
        }

        $exerciseLog->delete();

        return response()->json(null, 204);
    }

    public function bulkDestroy(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:exercise_logs,id',
        ]);

        $pet->exerciseLogs()->whereIn('id', $request->ids)->delete();

        return response()->json(null, 204);
    }
}
