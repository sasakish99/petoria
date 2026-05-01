# Petoria システム設計書

## 1. システムアーキテクチャ

本システムは、バックエンドを API サーバーとして独立させ、フロントエンド（Web）および将来的なネイティブアプリから利用することを前提とした構成になっています。

- **Web フロントエンド**: Next.js (Client Side Rendering)
- **API バックエンド**: Laravel 11
- **認証**: Laravel Sanctum (Cookieベースの認証)
- **データベース**: MySQL 8.0
- **ストレージ**: ローカル（開発時） / AWS S3 等（将来）
- **外部サービス**: OpenAI API (GPT-4o)

## 2. データベース設計

### users (ユーザー)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | bigint | プライマリキー |
| name | string | ユーザー名 |
| email | string | メールアドレス |
| password | string | ハッシュ化されたパスワード |
| timestamps | - | 作成・更新日時 |

### pets (うちの子)
| カラム名 | 型 | 説明                           |
| :--- | :--- |:-----------------------------|
| id | bigint | プライマリキー                      |
| user_id | foreignId | users.id への外部参照              |
| name | string | うちの子の名前                          |
| species | string | 種類（犬、猫など）                    |
| breed_id | foreignId | breeds.id への外部参照 (nullable)  |
| birthday | date | 生年月日 (nullable)              |
| target_weight | decimal | 目標体重 (nullable)              |
| image_path | string | うちの子画像パス (nullable)          |
| theme_color | string | テーマカラー (nullable)            |
| last_vaccination_date | date | 最終ワクチン接種日 (nullable)         |
| timestamps | - | 作成・更新日時                      |

### breeds (品種)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | bigint | プライマリキー |
| name | string | 品種名 |
| species | string | 種類（dog, cat） |
| timestamps | - | 作成・更新日時 |

### health_logs (健康記録)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | bigint | プライマリキー |
| pet_id | foreignId | pets.id への外部参照 |
| weight | decimal | 体重 (kg) (nullable) |
| meal_amount | integer | 食事量 (nullable) |
| stool_status | string | 便の状態 (nullable) |
| urine_status | string | 尿の状態 (nullable) |
| exercise_duration | integer | 散歩・運動時間 (分) (nullable) |
| memo | text | メモ (nullable) |
| logged_at | date | 記録日 |
| timestamps | - | 作成・更新日時 |

### weight_logs (体重記録 - 旧形式/移行中)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | bigint | プライマリキー |
| pet_id | foreignId | pets.id への外部参照 |
| weight | decimal | 体重 (kg) |
| logged_at | timestamp | 記録日時 |
| timestamps | - | 作成・更新日時 |

### medical_events (医療イベント)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | bigint | プライマリキー |
| pet_id | foreignId | pets.id への外部参照 |
| title | string | イベント名（ワクチン、予防薬等） |
| vaccine_type | string | ワクチンの種類 (nullable) |
| clinic_name | string | 病院名 (nullable) |
| event_date | date | 予定日・接種日 |
| next_event_date | date | 次回予定日 (nullable) |
| is_completed | boolean | 完了フラグ |
| certificate_path | string | 証明書画像パス (nullable) |
| notes | text | メモ (nullable) |
| timestamps | - | 作成・更新日時 |

### ai_diagnoses (AI診断履歴)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | bigint | プライマリキー |
| pet_id | foreignId | pets.id への外部参照 |
| image_path | string | 画像パス |
| result_text | text | 診断結果テキスト (nullable) |
| status | string | 状態 (pending, completed, failed) |
| timestamps | - | 作成・更新日時 |

### medical_receipts (診療明細)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | bigint | プライマリキー |
| pet_id | foreignId | pets.id への外部参照 |
| image_path | string | 画像パス |
| clinic_name | string | 病院名 (nullable) |
| pet_name | string | ペット名（AI解析結果） (nullable) |
| receipt_date | date | 診療日 (nullable) |
| total_amount | decimal | 合計金額 (nullable) |
| items | json | 明細項目 (nullable) |
| raw_text | text | 解析生テキスト (nullable) |
| status | string | 状態 (pending, completed, failed) |
| timestamps | - | 作成・更新日時 |

### health_checkup_results (健康診断結果)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | bigint | プライマリキー |
| pet_id | foreignId | pets.id への外部参照 |
| image_path | string | 画像パス |
| clinic_name | string | 病院名 (nullable) |
| pet_name | string | ペット名（AI解析結果） (nullable) |
| checkup_date | date | 検査日 (nullable) |
| results | json | 検査項目と数値 (nullable) |
| raw_text | text | 解析生テキスト (nullable) |
| status | string | 状態 (pending, completed, failed) |
| timestamps | - | 作成・更新日時 |

## 3. API 設計

API の詳細な仕様はプロジェクトルートの `openapi.yaml` で管理しています。
Swagger UI 等を利用して閲覧することが可能です。

### 主要なエンドポイント
- `GET /api/dashboard`: ダッシュボード情報取得
- `POST /api/pets/{pet}/ai-diagnose`: AI画像解析
- `POST /api/pets/{pet}/medical-receipts/upload`: 診療明細AI解析
- `POST /api/pets/{pet}/health-checkup-results/upload`: 健康診断結果AI解析
- `POST /api/pets/{pet}/vaccination-certificates/analyze`: ワクチン証明書AI解析

## 4. 画面設計

### ログイン / 会員登録
- ユーザー認証を行うための画面。
- ロゴを上部に配置し、Tailwind CSS によるクリーンなデザイン。

### ダッシュボード
- ログイン後のメイン画面。
- **うちの子切り替え**: 複数飼育に対応し、スクロールでうちの子の状態を表示。
- **体重推移グラフ**: Recharts を使用した折れ線グラフ。
- **散歩時間グラフ**: Recharts を使用した棒グラフ。1週間の合計時間（分/週）と1日の平均時間（分/日）を表示。
- **お知らせ**: 期限が近い、または過ぎている医療予定を表示。
- **クイックアクション**: 記録追加、AI診断への導線。
- **最新の履歴**: 最新の診療明細や健康診断の結果を表示し、直接取り込みモーダルを起動可能。

### 履歴画面
- 各種記録をカテゴリ別に一覧表示・詳細確認・削除が可能。
- **タブ構成**: 「AI健康診断」「健康記録」「ワクチン」「診療明細」「健康診断」の5カテゴリ。
- **一括削除**: 選択モード（整理する）により、複数の記録をまとめて削除可能。
- **詳細表示**: 解析された項目の詳細や、アップロードした画像の確認が可能。

## 5. 今後の拡張予定
- **写真投稿機能**: うちの子の日常の写真保存。
- **カレンダー表示**: 各種記録や予定をカレンダー形式で可視化。
- **通知機能**: ワクチン接種予定などのプッシュ通知・メール通知。
- **ネイティブアプリ展開**: iOS / Android 向け API 活用。
