# Petoria (ペトリア)

大切なうちの子の健康と成長を家族みんなで見守る、うちの子健康管理アプリケーションです。

「Petoria」という名前には、「Pet（ペット）」＋「historia（歴史・記録）」という意味が込められています。大切な家族であるうちの子の一生を記録し、共に歩む歴史を大切にしたいという想いから生まれました。

## 機能概要
- **ユーザー認証**: Laravel Breeze (API) による会員登録、ログイン機能。
- **ダッシュボード**: うちの子ごとの体重推移グラフ、散歩時間統計（合計・平均）、ワクチン接種リマインダーを表示。
- **うちの子管理**: 複数のうちの子のプロフィールを登録・管理。
- **健康記録**: 体重の記録管理（グラフ化対応）。
- **医療イベント管理**: ワクチンや予防薬の予定管理。
- **AI健康診断 (実装予定)**: 気になる箇所の写真を撮影し、AI（OpenAI GPT-4o）によるアドバイスを受信。

## 技術スタック
- **フロントエンド**: Next.js 15 (TypeScript), Tailwind CSS, Recharts, SWR
- **バックエンド**: Laravel 11 (PHP 8.4)
- **データベース**: MySQL 8.0
- **AI**: OpenAI API (GPT-4o)
- **インフラ**: Docker / Docker Compose

## 開発環境の構築

### 前提条件
- Docker / Docker Compose

### 手順
1. リポジトリをクローン
2. コンテナのビルドと起動
   ```bash
   docker compose up -d --build
   ```
3. バックエンドの初期設定
   ```bash
   docker compose exec backend composer install
   docker compose exec backend php artisan key:generate
   docker compose exec backend php artisan migrate
   ```
4. フロントエンドの初期設定
   ```bash
   docker compose exec frontend npm install
   ```

### アクセス
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend (API)**: [http://localhost:8000](http://localhost:8000)

## 認証について (GitHubへのPush)
GitHubでは2021年8月より、パスワードによる認証が廃止されました。
`git push` 等でパスワードを求められた際は、GitHubの **Personal Access Token (PAT)** を作成し、パスワードの代わりに入力してください。

### トークンの作成手順
1. GitHubの [Settings] > [Developer settings] > [Personal access tokens] > [Tokens (classic)] を開く。
2. [Generate new token] をクリック。
3. `repo` スコープにチェックを入れてトークンを生成し、必ず控えておく。

## 設計書
詳細な設計については [design_document.md](./design_document.md) を参照してください。
