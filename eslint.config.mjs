import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";

/**
 * Next.js 16 では `next lint` が廃止され、ESLint CLI を直接利用する。
 * eslint-config-next の `core-web-vitals` エクスポートはフラット設定配列で、
 * TypeScript パーサ/プラグインの登録のみを行い、typescript-eslint の
 * recommended ルール自体は含まない（旧 `extends("next/typescript")` 相当の
 * ルールは別 export `eslint-config-next/typescript` にある）。旧構成の
 * `extends("next/core-web-vitals", "next/typescript")` と等価にするため、
 * 両方を spread する。FlatCompat を介すと ESLint 9 で循環参照エラーになる
 * ため直接 spread する。
 */
const eslintConfig = [
	{
		ignores: [
			".next/**",
			".open-next/**",
			".wrangler/**",
			".source/**",
			"out/**",
			"build/**",
			"coverage/**",
			"next-env.d.ts",
			"cloudflare-env.d.ts",
		],
	},
	...next,
	...ts,
	{
		// 型定義ファイルの `/// <reference types="..." />` は d.ts の正規表現なので許可する。
		files: ["**/*.d.ts"],
		rules: { "@typescript-eslint/triple-slash-reference": "off" },
	},
];

export default eslintConfig;
