# Claude Safety Rules

## 削除系コマンドの禁止（重要）

以下のルールはこのワークスペース内のすべての会話で絶対に守られる：

- Claude はファイルまたはディレクトリを削除するコマンドを一切生成してはならない。
  例：rm, rm -rf, rm *, rmdir, unlink, cache --delete,
      lftp mirror --delete, rsync --delete, git clean -df, find -delete 等。

- 削除が必要な場合でも、Claude は削除コマンドを提案せず、
  「手動で削除してください」といった説明に留めること。

- 削除の推奨・削除操作の自動判断も禁止。

- ssh / lftp / デプロイ系スクリプトを生成する場合でも、
  削除コマンドの生成は禁止。

これらはすべての会話・コード生成に適用される。

## シークレット管理（重要）

- `config/master.key` など機密ファイルを `git add` するコードを生成してはならない
- デプロイスクリプト・セットアップ手順でも同様
- シークレットは必ず環境変数（RAILS_MASTER_KEY 等）で渡すこと
- `.gitignore` への追加を確認する手順を必ずコードに含めること
- 初回コミット前に `git status` でステージング確認を促すこと

---

## プロジェクト概要

**週次サムネイル生成テンプレート（デモ版）**。週次で配信・投稿されるコンテンツのサムネイルは、回ごとに作り直されることで配色・文字サイズ・要素位置が少しずつ揺らぎ、シリーズとしての一貫性が失われる。本リポジトリは、**配色と配置を版面マスタとして固定し、週番号と話題の2つだけを差し替えて画像を得る**仕組みを、入力から書き出しまで体験できる展示物として実装する。

中核は、可変要素（話題の文字数は回ごとに変動する）が入っても版面が動かないことを保証する組版規則である。**スロット枠を不変とし、可変長要素の伸縮方向をアンカーで1方向に限定したうえで、枠内に収まる組版を決定的に導出する**（同一入力からは、いつ・何度実行しても同一の組版結果が得られること＝決定性が提供価値の中核）。

テンプレート自体の作成・編集機能、画像素材（写真・イラスト）の取り込み、配信プラットフォームへの投稿は対象外。生成画像はサーバに保存せず、**入力と組版結果のメタデータのみを保持し、そこから同一の画像を再現できる**ことをもって記録に代える。

仕様の正は [`requirements.md`](requirements.md)（用語定義・テンプレート仕様・入力仕様・組版仕様・検版判定仕様・一括生成・履歴/改訂/書き出し・データ設計・ER図・DFD・シーケンス図・クラス図・状態遷移図・ユースケース図を含む）。実装前に必ず参照すること。本ファイルには要約と横断的な注意点のみを記す。

**現状（2026-09-16時点）：Issue #1（ワンショット実装）完了・PR #2マージ済み・タグ`v01.01.00`。テンプレート選択・単票生成・検版・一括生成・履歴の5画面、決定的組版エンジン、検版判定V1〜V7、D1セッション分離、日次リセット、デモ共通UI・GA4を実装済み。**本番デプロイ完了・本番ユーザーテスト完了**（2026-09-16、詳細は本ファイル「本番デプロイ」節）。既知の未修正バグは無し。

**注意（デモ版共通UI必須要素）：`requirements.md` が対象外としていても、`20_開発/.claude/agents/demo-common-ui.md` が定める全デモ共通の必須4要素（アンバーバナー・「← デモ一覧へ」戻るリンク・「ご相談はこちら」固定ボタン・`/legal`ページ）とGA4タグ（`G-C04W1XKS16`）は必須。過去3件（`auth-link-triage-ledger-demo`・`design-to-section-html-demo`・`contract-flow-template-demo`）で本番デプロイ後の事後対応になった同型の抜けがある。**最初の実装Issueに含めること。**

## アーキテクチャ（requirements.md 2.3 / 5 / 22 が正）

デモ版の簡略構成として **Cloudflare 一本化**を採用する（入力の検証・組版結果の保存・履歴表示という CRUD と表示が主体で、描画はブラウザの Canvas API で完結し、サーバー側に画像加工・AI・解析の処理を一切持たないため。Railway は使用しない）。

| 層 | 技術 | デプロイ先 | 役割 |
|---|---|---|---|
| フロントエンド | Vite + TypeScript（フレームワークレスSPA） | Cloudflare Workers Assets | 入力・プレビュー・検版・一括生成・履歴の各画面、Canvas 描画と PNG 書き出し |
| アプリケーション | Cloudflare Workers（Hono） | Cloudflare | 入力検証・組版導出・判定・履歴管理・セッション管理・`/api/*` |
| DB | D1（SQLite） | Cloudflare | セッション・生成結果・行・指摘・一括ジョブ・書き出し記録 |
| 定期実行 | Cron Triggers | Cloudflare | 日次リセット（JST 03:00・全テーブル削除。同梱マスタ・フォント・字幅テーブルは対象外） |
| 同梱資産 | 本文フォント（IPAフォントサブセット）・字幅テーブル | Workers Assets（静的配信） | 組版と描画の決定性を担保する。外部フォント配信サービスは参照しない |

- **フロントエンドは Vite + TypeScript（フレームワークレスSPA）、配信は「Cloudflare Pages」ではなく単一Workerからの「Workers Assets」で確定した**（Issue #1で決定）。`wrangler.toml` の `[env.production.assets]`（`directory = "./dist/frontend"`、`run_worker_first = ["/api/*"]`）で、フロントエンド静的ビルドと `/api/*` のHono APIを同一Workerから配信する。姉妹デモ `contract-flow-template-demo` と同方式（使用中のCloudflare APIトークンにPages編集権限が無いため）。
- テンプレート（版面・パレット・スロット・禁則規則・正規化規則・字幅テーブル）はアプリケーションに同梱する固定データとし、DBには保存しない（requirements.md 6.1 / 13.1）。生成画像も保存しない。
- 認証・認可は設計に組み込まない（requirements.md 21章）。**Cookieベースのセッションキーがオーナーキー**であり、全テーブルが `session_id` を保持し、参照条件に必ず含める（セッションをまたいだレコードの参照・操作を防止すること）。
- Bot対策はハニーポット方式（単票生成・一括生成の各フォームに不可視の入力欄・値が入っていれば拒否）。reCAPTCHAは用いない。

### 組版ロジック（requirements.md 6〜9章が正・実装が多岐にわたるため要約）

1. **幅の算出**：文字の送り幅は同梱の字幅テーブルからのみ取得する。描画環境の計測APIに依存しないこと（環境が変わっても同一入力から同一結果が得られる決定性の根拠）。
2. **行分割**：明示改行で段落へ分け、枠幅を超える直前を分割候補とし、禁則（行頭42字・行末16字・分離禁止5規則）に抵触すれば前方へ戻す。戻せる位置が無ければ不適合。
3. **自動縮小**：最大サイズから最小サイズまで刻み幅で降順に候補を並べ、行数・各行幅・総高の全てを満たす最初の候補を採用する。刻みの外のサイズを採用しない。
4. **配置**：スロット枠は不変の矩形。話題スロットは左上アンカー（下方向にのみ伸長）、週番号スロットは右上アンカー（左方向にのみ伸長）。版面の中央揃えによる上下伸長は用いない。
5. **検版・判定（V1〜V7）**：枠内収容・サイズ下限・セーフマージン・占有禁止領域・縮小時可読性・コントラスト・グレースケール可読性の7項目を検査し、**適合／注意付き適合／不適合**の3値で判定する（requirements.md 9.2）。判定は入力・組版結果・テンプレートのマスタ値のみから導き、人手による上書きを設けない。

いずれも requirements.md 20章「非機能要件」の**決定性**（乱数・現在時刻・実行回数に依存しない）・**環境非依存**（字幅テーブルのみに依存）・**版面不変**の3原則に従うこと。

## AIモデル分担（デモ版共通・`rictaworks/context` の `ClaudeCode.md` が正）

| フェーズ | 担当モデル |
|---|---|
| Issue分割 | Sonnet |
| 実装 | Haiku |
| reviewer, pr-checker | Sonnet |
| Security Review | Opus |
| コンテンツライティング | GPT |
| ファクトチェック | Gemini |

上記はルート `H:\マイドライブ\RictaWorks\CLAUDE.md` の「開発 AI 役割分担（受託案件共通）」節（AIか人間かの大分類・モデル名は参考値と明記）とは別内容であり、こちらはデモ版に固有の具体的モデル割当てである。実際には本リポジトリの実装・レビューは Claude Code（モデルは都度変わる）で一括して行っており、上記は目安として記載する。

## 開発フロー

- **実装方式：1 issue のワンショットで実装する**（requirements.md 20章）。複数 Issue に分割しない。
- ブランチワークフロー：`src/**` の変更は main に直接コミット・プッシュせず、必ずブランチを切って `gh pr create` で PR を作成する。`src/**` 以外（このファイル・`DOCS/`・`SPEC/` 等）は main への直接 push を許可する。
- **AIセッティング（CLAUDE.md本文・`.claude/`配下の設定・エージェント定義等）はPRを作らず、必ずmainブランチで直接コミット・pushすること。** PR化しない。
- **デモ版のため公開スピードを優先し、正式な code-review・audit・security-gate・report を省略してよい**。フローは `issue → setting & coding → security review → add, commit, push → reviewer & pr-checker → merge → user test` のみとする（merge で本番デプロイされる構成が前提）。
- コミット前に必ずセキュリティレビューを行うこと。マージ前に必ず reviewer と pr-checker を実行すること（`.claude/agents/` に定義。後述）。
- TDD 厳守：plan → red test → coding → green test。フロントの確認は curl / wget --mirror / playwright で行う。
- 時刻は JST、エンコードは UTF-8。日本語版のみ開発する。
- 文字列リテラルは設定ファイルに分離し、ハードコードを検出するテストを書くこと。
- ネイティブの `alert()` / `confirm()` / `prompt()` は使用禁止。フォールバック禁止（例外処理を明示的に書く）。
- デフォルトアイコンは FontAwesome。絵文字は使用しない。
- 環境変数は `.env`（`.env.example` がテンプレート）を参照する。
- バージョン番号は `メジャー2桁.マイナー2桁.デバッグ2桁`（初期値 `01.01.00`）。タグは最初から `git tag -a`（注釈付き）。
- 話題は表示・描画のみに用い、文字列として解釈・実行しないこと。書き出しファイル名に利用者の入力文字列を含めないこと（requirements.md 21章・11.3）。

## ディレクトリ構成（管理用）

以下を `mkdir` で作成すること。運用ルールに従って更新する（`.gitignore` により `SPEC/` 以外は公開/非公開に関わらずコミットされないローカル専用ディレクトリ）。

| ディレクトリ | 用途 |
|---|---|
| `TASKS/` | タスク管理（ローカルのみ） |
| `DEBUG/` | バグ報告（ローカルのみ） |
| `CLIENT/` | クライアント要望等（ローカルのみ） |
| `WORK/` | 作業報告（ローカルのみ） |
| `ENV/` | `DEVELOPMENT.md`（開発環境）・`PRODUCTION.md`（本番環境）（ローカルのみ） |
| `SPEC/` | 仕様書。リバースエンジニアリング図（ER図・DFD・シーケンス図・クラス図・状態遷移図・ユースケース図）はまず `requirements.md` に集約済みだが、実装後に差分が生じた図はここに追記・更新する（コミット対象） |
| `DELETE/` | ゴミ箱（ローカルのみ・削除コマンドを使わずここへ移動する） |

## コマンド

`src/` 配下は `src/worker/**`（Cloudflare Workers・Hono・組版エンジン・D1）、`src/frontend/**`（Vite・入力/プレビュー/検版/一括生成/履歴画面・Canvas描画）、`src/shared/**`（worker/frontend共有ロジック）の3系統。

| コマンド | 用途 |
|---|---|
| `npm run dev:worker` | wranglerローカル開発サーバー起動（API、`http://localhost:8787`） |
| `npm run dev:frontend` | Viteフロントエンド開発サーバー起動（`http://localhost:5173`） |
| `npm run build` | フロントエンド・Worker双方をビルド |
| `npm test` | vitestユニットテスト実行 |
| `npm run test:e2e` | Playwright E2Eテスト実行（`test/pr***/`。対象は開発サーバー） |
| `npm run typecheck` | worker・frontend双方の型チェック |
| `npm run db:migrate:local` | D1ローカルマイグレーション適用 |
| `npm run deploy` | `wrangler deploy --env production`（本番デプロイ） |

## 本番デプロイ（2026-09-16実施・デスクトップから実施済み）

- D1データベース `weekly_thumbnail_demo`（uuid `9f40e44a-3033-4d8e-966c-26e659763344`）をCloudflare MCP経由で作成、`src/worker/db/migrations/0001_init.sql`を`d1_database_query`で直接適用（`wrangler d1 migrations apply`ではない）。`wrangler.toml`の`database_id`（default/production両方）を実IDへ差し替え済み。
- デプロイ用トークンは、既存の「rictaworks-jp workers-builds ONLY」等の他リポジトリ専用トークンを流用せず、**本リポジトリ専用の新規トークン**（Cloudflareダッシュボード表示名 `weekly-thumbnail-template-demo ONLY (do not reuse for other repos)`。権限：アカウント Workers:管理・D1:編集、ゾーン Workers ルート:編集・SSL および証明書:編集）を発行し、`.deploy.<COMPUTERNAME>.enc`に`CLOUDFLARE_API_TOKEN_WEEKLY_THUMBNAIL`として保存した（ルートCLAUDE.md「Cloudflare APIトークンの運用ルール」節に準拠）。
- デプロイはWSL側から`npx wrangler deploy --env production`（`CLOUDFLARE_API_TOKEN`・`CLOUDFLARE_ACCOUNT_ID=9c5183bedab008ccef3581056752fa6f`をPowerShellの`$env:WSLENV`経由でWSLへ転送。`/p`修飾子は付けない——パス変換用のためトークン等の文字列には使わない）。
- 本番URL：`https://weekly-thumbnail-template-demo.rictaworks.jp/`。日次リセットCronも同時に有効化済み（`schedule: 0 18 * * *` = JST 03:00）。
- 本番ユーザーテスト（Claude Desktopのブラウザツール）：テンプレート選択→単票生成（週番号・話題入力→プレビュー同期→適合判定→確定）→履歴での保存確認→履歴からの再現描画→PNG再書き出し（ダウンロードしたファイルを実際に開いて版面・ファイル名`T01_012_r1.png`を確認）→不適合ケース（61/60文字超過）の判定・理由提示→`/legal`ページ→モバイル幅(375px)表示、いずれも実機で確認済み。

## 参照ドキュメント

| ファイル | 用途 |
|---|---|
| `requirements.md` | 仕様の正（用語定義・テンプレート仕様・入力仕様・組版仕様・検版判定仕様・一括生成・履歴/改訂/書き出し・データ設計・ER図・DFD・シーケンス図・クラス図・状態遷移図・ユースケース図） |
| `DOCS/CRAP.md` | デザイン4原則（Contrast / Repetition / Alignment / Proximity） |
| `DOCS/DP.md` | 開発原則（YAGNI/KISS/DRY/SOLID等） |
| `DOCS/TM.md` | テストメソッド・フレームワーク概要 |
| `.claude/CC.md` | コンプライアンス10項目 |
| `.claude/OWASP10.md` | OWASP Top 10（セキュリティレビュー基準） |
| `.claude/QC10.md` | 品質管理10項目 |
| `.claude/TEST-HARNESS-SAFETY.md` | テストハーネスの安全性チェックリスト |
| `.claude/Manager.md` | プロジェクト管理指針 |
| `.claude/auto-optimizer.md` | CLAUDE.md 自動最適化エージェント用プロンプト |
| `.claude/init-prompt.md` | 本 CLAUDE.md 生成時に `rictaworks/context` の `ClaudeCode.md` から抽出した適用済みルール一覧（コミット対象外・参照用） |

## Sub Agent（`.claude/agents/` に定義済み）

- **pr-checker**：レビューはしない。PR のタイトルと本文を日本語にする。非エンジニア（ブラウザしか使わない利用者）向けのユーザーテスト手順を PR 本文に丁寧に書く。
- **tester**：全 PR を対象に、PR に書かれたユーザーテスト手順の実行スクリプトを作成する（`DOCS/TM.md` に記載のテストを含む）。テストは `test/pr***/` に作成し、対象は開発サーバーとする。
- **reviewer**：issue の受け入れ要件を満たすこと、および `.claude/CC.md`・`.claude/OWASP10.md`・`.claude/QC10.md`・`DOCS/CRAP.md`・`DOCS/DP.md`・`DOCS/TM.md` を満たすことを検証する。
