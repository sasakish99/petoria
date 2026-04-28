<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pet;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // 天気情報の取得
        $weather = $this->getWeather($user);

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
            'pets' => $pets,
            'weather' => $weather
        ]);
    }

    private function getWeather($user)
    {
        $address = $user->address;
        if (!$address) {
            return null;
        }

        return Cache::remember('weather_' . $user->id . '_' . md5($address), 3600, function () use ($address) {
            try {
                // 1. ジオコーディング (OpenStreetMap Nominatim API)
                // Nominatimは詳細な住所だとヒットしないことがあるため、都道府県+市区町村で検索する
                $searchAddress = $address;
                if (preg_match('/^(.{2,3}[都道府県])([^市区町村]+[市区町村])/u', $address, $matches)) {
                    $searchAddress = $matches[1] . $matches[2];
                }

                $geoResponse = Http::withHeaders([
                    'User-Agent' => 'PetoriaApp/1.0'
                ])->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $searchAddress,
                    'format' => 'json',
                    'limit' => 1,
                    'accept-language' => 'ja'
                ]);

                if (!$geoResponse->successful() || empty($geoResponse->json())) {
                    return null;
                }

                $location = $geoResponse->json()[0];
                $lat = $location['lat'];
                $lon = $location['lon'];
                $locationName = $location['name'];

                // 2. 天気予報の取得 (Open-Meteo Weather Forecast API)
                // 3日分 (今日、明日、明後日) + 今日の1時間ごとの予報
                $weatherResponse = Http::get('https://api.open-meteo.com/v1/forecast', [
                    'latitude' => $lat,
                    'longitude' => $lon,
                    'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                    'hourly' => 'weather_code,temperature_2m,precipitation_probability',
                    'timezone' => 'Asia/Tokyo',
                    'forecast_days' => 3,
                ]);

                if (!$weatherResponse->successful()) {
                    return null;
                }

                $weatherData = $weatherResponse->json();
                $daily = $weatherData['daily'];
                $hourly = $weatherData['hourly'];
                $forecast = [];

                for ($i = 0; $i < 3; $i++) {
                    $dayForecast = [
                        'date' => $daily['time'][$i],
                        'weather_code' => $daily['weather_code'][$i],
                        'temp_max' => $daily['temperature_2m_max'][$i],
                        'temp_min' => $daily['temperature_2m_min'][$i],
                        'precipitation_probability' => $daily['precipitation_probability_max'][$i],
                    ];

                    // 今日の分にだけ時間ごとの予報を追加
                    if ($i === 0) {
                        $hourlyData = [];
                        // 0時から23時までの24時間分
                        for ($j = 0; $j < 24; $j++) {
                            $hourlyData[] = [
                                'time' => $hourly['time'][$j],
                                'weather_code' => $hourly['weather_code'][$j],
                                'temp' => $hourly['temperature_2m'][$j],
                                'precipitation_probability' => $hourly['precipitation_probability'][$j],
                            ];
                        }
                        $dayForecast['hourly'] = $hourlyData;
                    }

                    $forecast[] = $dayForecast;
                }

                return [
                    'location' => $locationName,
                    'forecast' => $forecast,
                ];
            } catch (\Exception $e) {
                \Log::error('Weather API Error: ' . $e->getMessage());
                return null;
            }
        });
    }
}
