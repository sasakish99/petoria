<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Breed;

class BreedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $breeds = [
            // 犬種 (Dogs)
            ['name' => 'トイ・プードル', 'species' => 'dog'],
            ['name' => 'チワワ', 'species' => 'dog'],
            ['name' => '柴犬', 'species' => 'dog'],
            ['name' => 'ミニチュア・ダックスフンド', 'species' => 'dog'],
            ['name' => 'ポメラニアン', 'species' => 'dog'],
            ['name' => 'ミニチュア・シュナウザー', 'species' => 'dog'],
            ['name' => 'フレンチ・ブルドッグ', 'species' => 'dog'],
            ['name' => 'ヨークシャー・テリア', 'species' => 'dog'],
            ['name' => 'シー・ズー', 'species' => 'dog'],
            ['name' => 'ゴールデン・レトリバー', 'species' => 'dog'],
            ['name' => 'ラブラドール・レトリバー', 'species' => 'dog'],
            ['name' => 'パグ', 'species' => 'dog'],
            ['name' => 'ウェルシュ・コーギー・ペンブローク', 'species' => 'dog'],
            ['name' => 'キャバリア・キング・チャールズ・スパニエル', 'species' => 'dog'],
            ['name' => 'ジャック・ラッセル・テリア', 'species' => 'dog'],
            ['name' => 'マルチーズ', 'species' => 'dog'],
            ['name' => 'イタリアン・グレーハウンド', 'species' => 'dog'],
            ['name' => 'ボーダー・コリー', 'species' => 'dog'],
            ['name' => 'ビーグル', 'species' => 'dog'],
            ['name' => '秋田犬', 'species' => 'dog'],
            ['name' => 'シェルティー', 'species' => 'dog'],
            ['name' => 'ボストンテリア', 'species' => 'dog'],
            ['name' => 'ミックス（犬）', 'species' => 'dog'],
            ['name' => 'その他（犬）', 'species' => 'dog'],

            // 猫種 (Cats)
            ['name' => 'スコティッシュ・フォールド', 'species' => 'cat'],
            ['name' => 'マンチカン', 'species' => 'cat'],
            ['name' => 'アメリカン・ショートヘア', 'species' => 'cat'],
            ['name' => 'ノルウェージャン・フォレスト・キャット', 'species' => 'cat'],
            ['name' => 'ブリティッシュ・ショートヘア', 'species' => 'cat'],
            ['name' => 'ラグドール', 'species' => 'cat'],
            ['name' => 'ロシアンブルー', 'species' => 'cat'],
            ['name' => 'メインクーン', 'species' => 'cat'],
            ['name' => 'ペルシャ', 'species' => 'cat'],
            ['name' => 'ベンガル', 'species' => 'cat'],
            ['name' => 'ソマリ', 'species' => 'cat'],
            ['name' => 'アビシニアン', 'species' => 'cat'],
            ['name' => 'シンガプーラ', 'species' => 'cat'],
            ['name' => 'シャム', 'species' => 'cat'],
            ['name' => 'エキゾチック・ショートヘア', 'species' => 'cat'],
            ['name' => 'サイベリアン', 'species' => 'cat'],
            ['name' => 'ラパーマ', 'species' => 'cat'],
            ['name' => '日本猫', 'species' => 'cat'],
            ['name' => '混血種（猫）', 'species' => 'cat'],
            ['name' => 'その他（猫）', 'species' => 'cat'],
        ];

        foreach ($breeds as $breed) {
            Breed::firstOrCreate($breed);
        }
    }
}
