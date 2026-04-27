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
            ->with(['healthLogs' => function($query) {
                $query->orderBy('logged_at', 'desc')->take(30);
            }, 'medicalEvents' => function($query) {
                $query->where('is_completed', false)
                      ->where('event_date', '>=', now())
                      ->orderBy('event_date', 'asc');
            }, 'aiDiagnoses' => function($query) {
                $query->where('status', 'completed')->orderBy('created_at', 'desc')->take(1);
            }])
            ->get();

        // 互換性のためにhealthLogsからweightのあるものを取り出して整形するなどの処理もフロントエンドで行うか、ここで整形する
        // 今回はhealthLogsに体重が含まれるようになったので、フロントエンドでhealthLogsを使ってグラフを描画するように変更する方針とする。
        // ただし、過去のweightLogsテーブルのデータも統合したい場合は複雑になるが、
        // ユーザーの依頼は「記録（今回追加した健康記録）で登録できるようにして」なので、healthLogsを優先する。

        return response()->json([
            'pets' => $pets
        ]);
    }
}
