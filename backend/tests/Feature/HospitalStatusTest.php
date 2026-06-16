<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class HospitalStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_hospital_open_now_status_caching()
    {
        // ユーザー作成
        $user = User::factory()->create([
            'address' => '千葉県木更津市瓜倉718',
        ]);

        // 2回目のリクエスト: 本来は営業時間外だが、10分以内ならキャッシュにより営業中と表示される
        // APIのレスポンスを「営業時間外」に変えてみるが、キャッシュがあれば呼ばれないはず
        Http::fake([
            'maps.googleapis.com/maps/api/place/nearbysearch/*' => Http::sequence()
                ->push([
                    'results' => [
                        [
                            'name' => 'テスト動物病院',
                            'place_id' => 'test_place_id',
                            'geometry' => ['location' => ['lat' => 35.439, 'lng' => 139.933]],
                            'opening_hours' => ['open_now' => true], // 最初は営業中
                            'vicinity' => '木更津市'
                        ]
                    ]
                ], 200)
                ->push([
                    'results' => [
                        [
                            'name' => 'テスト動物病院',
                            'place_id' => 'test_place_id',
                            'geometry' => ['location' => ['lat' => 35.439, 'lng' => 139.933]],
                            'opening_hours' => ['open_now' => false], // 次は営業時間外
                            'vicinity' => '木更津市'
                        ]
                    ]
                ], 200),
            'maps.googleapis.com/maps/api/geocode/*' => Http::response([
                'results' => [['geometry' => ['location' => ['lat' => 35.438, 'lng' => 139.932]]]]
            ], 200),
            'maps.googleapis.com/maps/api/place/details/*' => Http::response([
                'result' => ['opening_hours' => ['weekday_text' => ['月曜: 9:00–18:00']]]
            ], 200),
        ]);

        $this->actingAs($user);
        $response1 = $this->getJson('/api/dashboard');

        $response1->assertStatus(200);
        $hospitals1 = $response1->json('hospitals');
        $this->assertTrue($hospitals1[0]['open_now'], '1回目のリクエストでは営業中であるべき');

        $response2 = $this->getJson('/api/dashboard');
        $hospitals2 = $response2->json('hospitals');
        $this->assertTrue($hospitals2[0]['open_now'], 'キャッシュ期間内(10分)なので営業中のままであるべき');

        // 時間を進める (11分後)
        $this->travel(11)->minutes();

        $response3 = $this->getJson('/api/dashboard');
        $hospitals3 = $response3->json('hospitals');
        $this->assertFalse($hospitals3[0]['open_now'], 'キャッシュが切れたので最新の営業状態（営業時間外）が表示されるべき');
    }

    public function test_is_open_now_logic_with_weekday_text()
    {
        $user = User::factory()->create([
            'address' => '東京都港区芝公園4-2-8',
        ]);

        $weekdayText = [
            "月曜日: 9時00分～12時00分, 15時00分～19時00分",
            "火曜日: 定休日",
            "水曜日: 9時00分～19時00分",
            "木曜日: 9時00分～19時00分",
            "金曜日: 9時00分～19時00分",
            "土曜日: 9時00分～19時00分",
            "日曜日: 9時00分～19時00分"
        ];

        // 1. 月曜日の10:00 (営業中)
        $this->travelTo(now()->next('Monday')->setTime(10, 0));
        $controller = new \App\Http\Controllers\Api\DashboardController();
        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('isOpenNow');
        $method->setAccessible(true);

        $this->assertTrue($method->invokeArgs($controller, [false, $weekdayText]), '月曜10:00は営業中と判定されるべき');

        // 2. 月曜日の13:00 (休憩中)
        $this->travelTo(now()->next('Monday')->setTime(13, 0));
        $this->assertFalse($method->invokeArgs($controller, [false, $weekdayText]), '月曜13:00は営業時間外と判定されるべき');

        // 3. 火曜日 (定休日)
        $this->travelTo(now()->next('Tuesday')->setTime(10, 0));
        $this->assertFalse($method->invokeArgs($controller, [false, $weekdayText]), '火曜日は定休日と判定されるべき');

        // 4. Google APIがtrueを返している場合は常にtrue
        $this->assertTrue($method->invokeArgs($controller, [true, $weekdayText]), 'Google APIがtrueなら常にtrue');
    }

    public function test_hospital_rating_and_user_ratings_total_and_phone_number_are_included()
    {
        $user = User::factory()->create([
            'address' => '千葉県木更津市瓜倉718',
        ]);

        Http::fake([
            'maps.googleapis.com/maps/api/place/nearbysearch/*' => Http::response([
                'results' => [
                    [
                        'name' => 'テスト動物病院',
                        'place_id' => 'test_place_id',
                        'geometry' => ['location' => ['lat' => 35.439, 'lng' => 139.933]],
                        'opening_hours' => ['open_now' => true],
                        'vicinity' => '木更津市',
                        'rating' => 4.5,
                        'user_ratings_total' => 123
                    ]
                ]
            ], 200),
            'maps.googleapis.com/maps/api/geocode/*' => Http::response([
                'results' => [['geometry' => ['location' => ['lat' => 35.438, 'lng' => 139.932]]]]
            ], 200),
            'maps.googleapis.com/maps/api/place/details/*' => Http::response([
                'result' => [
                    'opening_hours' => ['weekday_text' => ['月曜: 9:00–18:00']],
                    'formatted_phone_number' => '03-1234-5678'
                ]
            ], 200),
        ]);

        $this->actingAs($user);
        $response = $this->getJson('/api/dashboard');

        $response->assertStatus(200);
        $hospital = $response->json('hospitals.0');

        $this->assertEquals(4.5, $hospital['rating']);
        $this->assertEquals(123, $hospital['user_ratings_total']);
        $this->assertEquals('03-1234-5678', $hospital['phone_number']);
    }

    public function test_hospitals_without_opening_hours_are_excluded()
    {
        $user = User::factory()->create([
            'address' => '千葉県木更津市瓜倉718',
        ]);

        Http::fake([
            'maps.googleapis.com/maps/api/place/nearbysearch/*' => Http::response([
                'results' => [
                    [
                        'name' => '営業データあり病院',
                        'place_id' => 'has_opening_hours',
                        'geometry' => ['location' => ['lat' => 35.439, 'lng' => 139.933]],
                        'vicinity' => '木更津市',
                    ],
                    [
                        'name' => '営業データなし病院',
                        'place_id' => 'no_opening_hours',
                        'geometry' => ['location' => ['lat' => 35.440, 'lng' => 139.934]],
                        'vicinity' => '木更津市',
                    ]
                ]
            ], 200),
            'maps.googleapis.com/maps/api/geocode/*' => Http::response([
                'results' => [['geometry' => ['location' => ['lat' => 35.438, 'lng' => 139.932]]]]
            ], 200),
            'maps.googleapis.com/maps/api/place/details/*' => function ($request) {
                if (str_contains($request->url(), 'place_id=has_opening_hours')) {
                    return Http::response([
                        'result' => ['opening_hours' => ['weekday_text' => ['月曜: 9:00–18:00']]]
                    ], 200);
                }
                return Http::response([
                    'result' => [] // 営業データなし
                ], 200);
            },
        ]);

        $this->actingAs($user);
        $response = $this->getJson('/api/dashboard');

        $response->assertStatus(200);
        $hospitals = $response->json('hospitals');

        $this->assertCount(1, $hospitals, '営業データがない病院は除外されるべき');
        $this->assertEquals('営業データあり病院', $hospitals[0]['name']);
    }
}
