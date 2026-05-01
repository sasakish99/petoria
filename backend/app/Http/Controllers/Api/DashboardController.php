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

        // リクエストに緯度経度が含まれている場合は優先し、なければユーザー情報のものを使用する
        $lat = $request->query('lat', $user->latitude);
        $lon = $request->query('lon', $user->longitude);

        // 天気情報の取得
        $weather = $this->getWeather($lat, $lon, $user->id);

        // 近くの動物病院の取得
        $hospitals = $this->getNearbyHospitals($lat, $lon);

        $pets = $user->pets()
            ->with(['breed', 'healthLogs' => function($query) {
                $query->orderBy('logged_at', 'desc')->take(30);
            }, 'exerciseLogs' => function($query) {
                $query->orderBy('logged_at', 'desc')->take(30);
            }, 'medicalEvents' => function($query) {
                $query->where(function($q) {
                    $q->where('is_completed', false)
                      ->where('event_date', '>=', now());
                })->orWhereNotNull('vaccine_type')
                  ->orderBy('event_date', 'asc');
            }, 'aiDiagnoses' => function($query) {
                $query->where('status', 'completed')->orderBy('created_at', 'desc');
            }, 'medicalReceipts' => function($query) {
                $query->orderBy('receipt_date', 'desc');
            }, 'healthCheckupResults' => function($query) {
                $query->orderBy('checkup_date', 'desc');
            }])
            ->get();

        $pets->each(function ($pet) {
            $pet->generated_announcements = [];
        });

        return response()->json([
            'pets' => $pets,
            'weather' => $weather,
            'hospitals' => $hospitals
        ]);
    }

    private function getWeather($lat, $lon, $userId)
    {
        if (!$lat || !$lon) {
            return null;
        }

        $date = now()->format('Y-m-d');
        return Cache::remember('weather_v2_' . $userId . '_' . $date . '_' . md5($lat . $lon), 3600, function () use ($lat, $lon) {
            try {
                // 1. 逆ジオコーディング (OpenStreetMap Nominatim API) で地名を取得
                $geoResponse = Http::withHeaders([
                    'User-Agent' => 'PetoriaApp/1.0'
                ])->get('https://nominatim.openstreetmap.org/reverse', [
                    'lat' => $lat,
                    'lon' => $lon,
                    'format' => 'json',
                    'accept-language' => 'ja'
                ]);

                $locationName = '現在地';
                if ($geoResponse->successful()) {
                    $location = $geoResponse->json();
                    // 市区町村名などを取得
                    $address = $location['address'] ?? [];
                    $locationName = $address['city'] ?? $address['town'] ?? $address['village'] ?? $address['suburb'] ?? '現在地';
                }

                // 2. 天気予報の取得 (Open-Meteo Weather Forecast API)
                // 4日分 (今日〜明々後日) + 今日の1時間ごとの予報
                $weatherResponse = Http::get('https://api.open-meteo.com/v1/forecast', [
                    'latitude' => $lat,
                    'longitude' => $lon,
                    'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                    'hourly' => 'weather_code,temperature_2m,precipitation_probability',
                    'timezone' => 'Asia/Tokyo',
                    'forecast_days' => 4,
                ]);

                if (!$weatherResponse->successful()) {
                    return null;
                }

                $weatherData = $weatherResponse->json();
                $daily = $weatherData['daily'];
                $hourly = $weatherData['hourly'];
                $forecast = [];

                for ($i = 0; $i < 4; $i++) {
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

    private function getNearbyHospitals($lat, $lon)
    {
        if (!$lat || !$lon) {
            return null;
        }

        $cacheKey = 'hospitals_' . md5($lat . $lon);

        try {
            $apiKey = config('services.google.maps_api_key');

            if (!$apiKey) {
                \Log::warning('Google Maps API Key is not set.');
                return null;
            }

            // 近くの動物病院を検索 (Google Places API - Nearby Search)
            // 営業状態が含まれるため、キャッシュ時間を短くする (例: 10分)
            return Cache::remember($cacheKey, 600, function () use ($lat, $lon, $apiKey) {
                $placesResponse = Http::get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', [
                    'location' => "{$lat},{$lon}",
                    'radius' => 10000,
                    'type' => 'veterinary_care',
                    'key' => $apiKey,
                    'language' => 'ja'
                ]);

                if (!$placesResponse->successful()) {
                    return null;
                }

                $hospitals = [];
                $results = $placesResponse->json()['results'] ?? [];


                foreach ($results as $item) {
                    $itemLat = $item['geometry']['location']['lat'];
                    $itemLng = $item['geometry']['location']['lng'];
                    $placeId = $item['place_id'] ?? null;
                    $openingHours = null;
                    $phoneNumber = null;

                    // 詳細情報を取得して営業時間を取得
                    if ($placeId) {
                        $detailResponse = Http::get('https://maps.googleapis.com/maps/api/place/details/json', [
                            'place_id' => $placeId,
                            'fields' => 'opening_hours,formatted_phone_number',
                            'key' => $apiKey,
                            'language' => 'ja'
                        ]);
                        if ($detailResponse->successful()) {
                            $result = $detailResponse->json()['result'] ?? [];
                            $openingHours = $result['opening_hours']['weekday_text'] ?? null;
                            $phoneNumber = $result['formatted_phone_number'] ?? null;
                        }
                    }

                    $hospitals[] = [
                        'name' => $item['name'],
                        'display_name' => $item['vicinity'] ?? $item['name'],
                        'lat' => $itemLat,
                        'lon' => $itemLng,
                        'open_now' => $this->isOpenNow($item['opening_hours']['open_now'] ?? null, $openingHours),
                        'opening_hours' => $openingHours,
                        'phone_number' => $phoneNumber,
                        'rating' => $item['rating'] ?? null,
                        'user_ratings_total' => $item['user_ratings_total'] ?? null,
                        // 距離の簡易計算 (km)
                        'distance' => $this->calculateDistance($lat, $lon, $itemLat, $itemLng)
                    ];
                }

                // 距離順にソート
                usort($hospitals, function ($a, $b) {
                    return $a['distance'] <=> $b['distance'];
                });

                return $hospitals;
            });
        } catch (\Exception $e) {
            \Log::error('Hospital Search API Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Google APIのopen_nowとweekday_textを元に、現在営業中かを判定する
     */
    private function isOpenNow($googleOpenNow, $weekdayText)
    {
        // Googleの判定がある場合は基本的にはそれを採用するが、
        // ユーザーから「営業時間外」と誤判定される報告があるため、念のためweekday_textでもチェックする
        if ($googleOpenNow === true) {
            return true;
        }

        if (!$weekdayText || !is_array($weekdayText)) {
            return $googleOpenNow;
        }

        // 現在の日本時間での曜日と時刻を取得
        $now = now(); // config/app.php で Asia/Tokyo に設定済み
        $days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
        $todayName = $days[$now->dayOfWeek];

        foreach ($weekdayText as $line) {
            if (str_starts_with($line, $todayName)) {
                // "月曜日: 9時00分～12時00分, 15時00分～19時00分" のような形式を想定
                if (str_contains($line, '定休日') || str_contains($line, '休み')) {
                    return false;
                }

                // 時間部分を抽出
                $timePart = str_replace($todayName . ': ', '', $line);
                $periods = explode(', ', $timePart);

                foreach ($periods as $period) {
                    // "9時00分～19時00分" または "09:00～19:00"
                    if (preg_match('/(\d{1,2})[時:](\d{2})分?～(\d{1,2})[時:](\d{2})分?/u', $period, $matches)) {
                        $startHour = (int)$matches[1];
                        $startMin = (int)$matches[2];
                        $endHour = (int)$matches[3];
                        $endMin = (int)$matches[4];

                        $startTime = $now->copy()->setTime($startHour, $startMin);
                        $endTime = $now->copy()->setTime($endHour, $endMin);

                        if ($now->between($startTime, $endTime)) {
                            return true;
                        }
                    }
                }
                break;
            }
        }

        return $googleOpenNow;
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $theta = $lon1 - $lon2;
        $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
        $dist = acos($dist);
        $dist = rad2deg($dist);
        $miles = $dist * 60 * 1.1515;
        return round($miles * 1.609344, 2);
    }
}
