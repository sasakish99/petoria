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

### pets (ペット)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | bigint | プライマリキー |
| user_id | foreignId | users.id への外部参照 |
| name | string | ペットの名前 |
| species | string | 種類（犬、猫など） |
| birthday | date | 生年月日 (nullable) |
| target_weight | decimal | 目標体重 (nullable) |
| timestamps | - | 作成・更新日時 |

### weight_logs (体重記録)
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
| event_date | date | 予定日 |
| is_completed | boolean | 完了フラグ |
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

## 3. API 設計

### 認証 (Laravel Breeze API)
- `POST /api/register`: ユーザー登録
- `POST /api/login`: ログイン
- `POST /api/logout`: ログアウト

### ダッシュボード
- `GET /api/dashboard`: ログイン中のユーザーに紐づく全てのペット情報、直近の体重記録（30件）、未完了の医療イベントを取得

### ペット管理
- `GET /api/pets`: ペット一覧取得
- `POST /api/pets`: ペット登録
- `GET /api/pets/{pet}`: ペット詳細取得
- `PUT /api/pets/{pet}`: ペット情報更新
- `DELETE /api/pets/{pet}`: ペット削除

### 記録管理
- `POST /api/pets/{pet}/weight-logs`: 体重記録の保存
- `POST /api/pets/{pet}/medical-events`: 医療イベントの保存

## 4. 画面設計

### ログイン / 会員登録
- ユーザー認証を行うための画面。
- ロゴを上部に配置し、Tailwind CSS によるクリーンなデザイン。

### ダッシュボード
- ログイン後のメイン画面。
- **ペット切り替え**: 複数飼育に対応し、スクロールで各ペットの状態を表示。
- **体重推移グラフ**: Recharts を使用した折れ線グラフ。
- **お知らせ**: 期限が近い、または過ぎている医療予定を表示。
- **クイックアクション**: 記録追加、AI診断（予定）への導線。

## 5. 今後の拡張予定
- **AI画像解析の実装**: OpenAI API 連携による健康アドバイス機能。
- **写真投稿機能**: ペットの日常の写真保存。
- **ネイティブアプリ展開**: iOS / Android 向け API 活用。
