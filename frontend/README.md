# frontend

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

[開発用メモ](./private/MEMO.md)

## 依存関係

- [marked](https://npmjs.com/package/marked)
  マークダウン記法 --> HTML 変換用

## 依存関係(開発用)

- [vite](https://npmjs.com/package/vite)
  ページビルド用
- [vite-plugin-multi-html](https://npmjs.com/package/vite-plugin-multi-html)
  ページビルド用プラグイン(静的な複数ページのビルドに対応)
- [prettier](https://npmjs.com/package/prettier)
  コードフォーマッター

## Setup

- Node.js LTSをインストール | [公式サイト](https://nodejs.org/ja/download)
- リポジトリをクローン

```bash
cd frontend
npm install # 依存関係のインストール
npm run build # ページをビルド
npm run dev # 開発用サーバー (PORT: 5173)
```
