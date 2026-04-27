<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pet;
use App\Models\MedicalEvent;

class MedicalEventController extends Controller
{
    public function store(Request $request, Pet $pet)
    {
        $this->authorize('update', $pet);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'event_date' => 'required|date',
            'is_completed' => 'boolean',
        ]);

        $medicalEvent = $pet->medicalEvents()->create($validated);

        return response()->json($medicalEvent, 201);
    }
}
