<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ab2d6a4f-302e-4d70-a389-7288a345bfda

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

# 20ステージ拡張対応リファクタリング完了

全20ステージを容易に追加・拡張できるように、ゲームエンジン基盤の大幅なアーキテクチャ変更を完了しました。

## 実装した変更

### 1. ゲームエンジン層の独立化
これまで `GameStage.tsx` という1つの巨大なコンポーネントにステージロジックと描画ロジックが混在していましたが、以下のように「ゲームエンジン層」として切り離しました。
- **[NEW] `src/engine/GameContext.tsx`**: インベントリ、プレイヤーのステータス、タイマー、効果音（`triggerSound`）などを管理するProviderとHookです。
- **[NEW] `src/engine/GameLayout.tsx`**: ステージで共通する画面レイアウト（ヘッダー、アイテムフッター、ダイアログ表示、失敗画面の描画）を担当します。
- **[NEW] `src/engine/components/FloorItem.tsx`**: 汎用的に再利用できる床落ちアイテムコンポーネントを作成しました。

### 2. ステージコンポーネントの独立
設定ファイル形式の静的定義を廃止し、各ステージを「レイアウトエンジンを活用した独立したReact Component」としました。
- **[MODIFY] `src/stages/stage1.tsx`**: 従来のオブジェクト形式からReact Component形式へ完全に移行しました。
  - ステージ独自の `waiterState` や、特定のアイテム判定などをすべてファイル内にカプセル化しました。
  - カスタムのドロップエリアや、配置場所などもこのコンポーネントの中で JSX として自然に管理できます。
- **[MODIFY] `src/stages/stage2.tsx`〜`stage20.tsx`**: 今後の開発のために、すべてのファイルにReact Component形式のプレースホルダー（ひな形）を配置しました。現状は自動クリアボタンが配置されています。

### 3. 全体ルーティングの改修
- **[MODIFY] `src/stages/index.ts`**: 新しい `metadata` および `Component` 毎のエクスポート方式へマッピングを更新しました。
- **[MODIFY] `src/App.tsx` & `src/components/StageSelect.tsx`**: ステージ選択時、動的に `<currentStage.Component>` がレンダリングされるように対応しました。
- **[DELETE] `src/components/GameStage.tsx`**: 不要になった巨大コンポーネントを完全に削除しました。

## 今後のステージ拡張について
新しいステージを作成する場合は、`src/stages/stageX.tsx` を編集し以下を行うだけです。
1. `metadata`のカスタマイズ（タイトル、背景画像など）。
2. `<GameLayout>`の中に、そのステージ限定の独自UIやギミック、アニメーションを入れる。
3. `useGameEngine()`を使って、共通の`setDialog`や`addToInventory`を呼び出す。
