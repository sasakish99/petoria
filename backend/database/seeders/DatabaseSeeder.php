<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Breed;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            BreedSeeder::class,
        ]);

        // テストユーザーの作成
        $user = User::create([
            'name' => 'テスト飼い主',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'latitude' => 35.681236, // 東京駅付近
            'longitude' => 139.767125,
        ]);

        // テストペットの作成
        $shiba = Breed::where('name', '柴犬')->first();
        $user->pets()->create([
            'name' => 'コロ',
            'species' => 'dog',
            'gender' => 'male',
            'breed_id' => $shiba->id,
            'birthday' => '2022-04-01',
            'target_weight' => 10.5,
            'theme_color' => 'amber',
        ]);

        $scottish = Breed::where('name', 'スコティッシュ・フォールド')->first();
        $user->pets()->create([
            'name' => 'ルナ',
            'species' => 'cat',
            'gender' => 'female',
            'breed_id' => $scottish->id,
            'birthday' => '2023-01-15',
            'target_weight' => 4.2,
            'theme_color' => 'indigo',
        ]);
    }
}
