<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pet;

class PetController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->pets;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'birthday' => 'nullable|date',
            'target_weight' => 'nullable|numeric|min:0',
        ]);

        $pet = $request->user()->pets()->create($validated);

        return response()->json($pet, 201);
    }

    public function show(Pet $pet)
    {
        $this->authorize('view', $pet);
        return $pet->load(['weightLogs', 'healthLogs', 'medicalEvents', 'aiDiagnoses']);
    }

    public function update(Request $request, Pet $pet)
    {
        $this->authorize('update', $pet);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'birthday' => 'nullable|date',
            'target_weight' => 'nullable|numeric|min:0',
        ]);

        $pet->update($validated);

        return response()->json($pet);
    }

    public function destroy(Pet $pet)
    {
        $this->authorize('delete', $pet);
        $pet->delete();

        return response()->noContent();
    }
}
