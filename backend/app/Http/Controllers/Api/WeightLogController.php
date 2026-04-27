<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pet;
use App\Models\WeightLog;

class WeightLogController extends Controller
{
    public function store(Request $request, Pet $pet)
    {
        $this->authorize('update', $pet);

        $validated = $request->validate([
            'weight' => 'required|numeric|min:0',
            'logged_at' => 'required|date',
        ]);

        $weightLog = $pet->weightLogs()->create($validated);

        return response()->json($weightLog, 201);
    }
}
