# CampusConnect

大学生向けのコミュニティアプリです。  
同じ学部・趣味・授業のつながりを見つけ、投稿・友達申請・メッセージで交流できます。

## アプリ概要

CampusConnect は以下を目的にしたアプリです。

- 学内の仲間探し（趣味・履修授業ベース）
- 近況投稿とリアクション（いいね・返信）
- 友達申請と承認
- 友達同士の1対1メッセージ

技術構成:

- Expo Router + React Native + TypeScript
- TanStack Query
- Supabase（Auth + PostgreSQL + RLS）

## 主な機能

- メールアドレス/パスワードによる登録・ログイン
  - `@kwansei.ac.jp` ドメインチェック
- プロフィール編集
  - 表示名、学部、学年、趣味、履修授業、自己紹介、アバター
- 投稿機能
  - 投稿作成、タグ、いいね、返信
- ユーザー検索・発見
  - 共通の趣味/授業によるマッチ表示
- 友達機能
  - 申請、承認/拒否、解除
- メッセージ機能
  - 友達同士の1対1チャット、未読管理

## セットアップ

## 1. 依存関係をインストール

```bash
npm install --legacy-peer-deps
```

※ このリポジトリは依存関係の peer 警告が出る場合があるため、まずは上記でインストールしてください。

## 2. 環境変数を設定

プロジェクトルートに `.env` を作成:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
```

注意:

- `EXPO_PUBLIC_SUPABASE_ANON_KEY` には **公開用キー**（anon/publishable）を設定
- `service_role` / `secret` キーは絶対に使わない

## 3. Supabase にスキーマを適用

Supabase ダッシュボードの SQL Editor で次を実行:

- `supabase/schema.sql`

この SQL により、投稿・プロフィール・友達・メッセージ関連テーブルと RLS が作成されます。

## 4. 起動

```bash
npx expo start --tunnel
```

補足:

- Windows では `--ios` は利用できません（iOS Simulator は macOS が必要）
- iPhone 実機は Expo Go で QR を読み取って動作確認できます

## ディレクトリ構成（主要）

```text
app/                  画面（Expo Router）
components/           UIコンポーネント
contexts/             Auth / Posts / Friends / Messages の状態管理
hooks/                ユーザー関連フック
lib/supabase.ts       Supabase クライアント
supabase/schema.sql   DBスキーマ・RLS定義
types/                型定義
```

## 開発時のよくあるエラー

### `Forbidden use of secret API key in browser`

公開クライアントに secret key を設定しています。  
`.env` のキーを anon/publishable に差し替えてください。

### `For security purposes, you can only request this after XX seconds.`

認証メール送信のレート制限です。  
指定秒数待って再試行してください。

### 投稿時に失敗する

- ログイン状態を確認
- `supabase/schema.sql` が適用済みか確認
- RLS / Auth 設定（Email Provider）を確認

## ライセンス

学習用のプロジェクト想定です。必要に応じて別途ライセンスを設定してください。
