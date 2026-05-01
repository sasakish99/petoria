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
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'event_date' => 'required|date',
            'is_completed' => 'boolean',
        ]);

        $medicalEvent = $pet->medicalEvents()->create($validated);

        return response()->json($medicalEvent, 201);
    }

    public function destroy(Pet $pet, MedicalEvent $medicalEvent)
    {
        if ($pet->user_id !== auth()->id() || $medicalEvent->pet_id !== $pet->id) {
            abort(403);
        }

        $medicalEvent->delete();

        return response()->json(null, 204);
    }

    public function bulkDestroy(Request $request, Pet $pet)
    {
        if ($pet->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:medical_events,id',
        ]);

        $pet->medicalEvents()->whereIn('id', $request->ids)->delete();

        return response()->json(null, 204);
    }
}
