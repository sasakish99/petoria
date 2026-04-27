<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pet;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $pets = $user->pets()
            ->with(['weightLogs' => function($query) {
                $query->orderBy('logged_at', 'desc')->take(30);
            }, 'medicalEvents' => function($query) {
                $query->where('is_completed', false)
                      ->where('event_date', '>=', now())
                      ->orderBy('event_date', 'asc');
            }])
            ->get();

        return response()->json([
            'pets' => $pets
        ]);
    }
}
