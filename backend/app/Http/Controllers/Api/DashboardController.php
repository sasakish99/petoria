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
            ->with(['breed', 'healthLogs' => function($query) {
                $query->orderBy('logged_at', 'desc')->take(30);
            }, 'medicalEvents' => function($query) {
                $query->where('is_completed', false)
                      ->where('event_date', '>=', now())
                      ->orderBy('event_date', 'asc');
            }, 'aiDiagnoses' => function($query) {
                $query->where('status', 'completed')->orderBy('created_at', 'desc')->take(1);
            }])
            ->get();

        $pets->each(function ($pet) {
            $announcements = [];
            $today = now();

            // 狂犬病ワクチンのリマインダー (犬のみ)
            if ($pet->species === 'dog' && $pet->birthday) {
                $birthday = \Carbon\Carbon::parse($pet->birthday);
                $ageInDays = $birthday->diffInDays($today);

                if ($ageInDays >= 91) {
                    $currentYear = $today->year;
                    $rabiesStart = \Carbon\Carbon::create($currentYear, 4, 1);
                    $rabiesEnd = \Carbon\Carbon::create($currentYear, 6, 30);

                    // 4/1-6/30の期間、またはその2週間前からリマインド
                    $reminderStart = $rabiesStart->copy()->subDays(14);

                    if ($today->between($reminderStart, $rabiesEnd)) {
                        $alreadyScheduled = $pet->medicalEvents->contains(function ($event) use ($currentYear) {
                            $eventDate = \Carbon\Carbon::parse($event->event_date);
                            return str_contains($event->title, '狂犬病') && $eventDate->year === $currentYear;
                        });

                        if (!$alreadyScheduled) {
                            $announcements[] = [
                                'id' => 'rabies-' . $currentYear,
                                'title' => '狂犬病予防接種の時期です',
                                'event_date' => $rabiesStart->toDateString(),
                                'type' => 'reminder'
                            ];
                        }
                    }
                }
            }

            // 混合ワクチンのリマインダー
            if ($pet->birthday) {
                $birthday = \Carbon\Carbon::parse($pet->birthday);

                // 初回スケジュール
                $vaccineSchedules = [
                    ['months' => 2, 'title' => '混合ワクチン（1回目）'],
                    ['months' => 3, 'title' => '混合ワクチン（2回目）'],
                    ['months' => 4, 'title' => '混合ワクチン（3回目）'],
                ];

                foreach ($vaccineSchedules as $schedule) {
                    $targetDate = $birthday->copy()->addMonths($schedule['months']);
                    // すでに「前回接種日」がこの予定日以降であればスキップ
                    if ($pet->last_vaccination_date && \Carbon\Carbon::parse($pet->last_vaccination_date)->greaterThanOrEqualTo($targetDate->copy()->subDays(7))) {
                        continue;
                    }

                    $reminderStart = $targetDate->copy()->subDays(14);
                    if ($today->between($reminderStart, $targetDate->copy()->addDays(30))) {
                        $alreadyScheduled = $pet->medicalEvents->contains(function ($event) use ($schedule) {
                            return str_contains($event->title, $schedule['title']);
                        });

                        if (!$alreadyScheduled) {
                            $announcements[] = [
                                'id' => 'vaccine-' . $schedule['months'],
                                'title' => $schedule['title'] . 'の時期です',
                                'event_date' => $targetDate->toDateString(),
                                'type' => 'reminder'
                            ];
                        }
                    }
                }

                // 追加接種（1年ごと）
                // 前回接種日がある場合はそれを基準に、なければ生後12ヶ月を基準にする
                $lastVax = $pet->last_vaccination_date ? \Carbon\Carbon::parse($pet->last_vaccination_date) : $birthday->copy()->addMonths(12);
                $nextVax = $lastVax->copy()->addYear();

                $reminderStart = $nextVax->copy()->subDays(14);
                if ($today->between($reminderStart, $nextVax->copy()->addDays(30))) {
                    $alreadyScheduled = $pet->medicalEvents->contains(function ($event) use ($nextVax) {
                        $eventDate = \Carbon\Carbon::parse($event->event_date);
                        return str_contains($event->title, '混合ワクチン') && $eventDate->year === $nextVax->year;
                    });

                    if (!$alreadyScheduled) {
                        $announcements[] = [
                            'id' => 'vaccine-periodic',
                            'title' => '混合ワクチン（追加接種）の時期です',
                            'event_date' => $nextVax->toDateString(),
                            'type' => 'reminder'
                        ];
                    }
                }
            }

            $pet->generated_announcements = $announcements;
        });

        return response()->json([
            'pets' => $pets
        ]);
    }
}
