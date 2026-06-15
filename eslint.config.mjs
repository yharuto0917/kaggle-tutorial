import next from "eslint-config-next/core-web-vitals";

/**
 * Next.js 16 では `next lint` が廃止され、ESLint CLI を直接利用する。
 * eslint-config-next の `core-web-vitals` エクスポートはフラット設定配列で、
 * 内部で index（next 推奨ルール + typescript）を取り込んだ上で
 * Core Web Vitals ルールを error に引き上げる。これは旧構成の
 * `extends("next/core-web-vitals", "next/typescript")` と等価。
 * FlatCompat を介すと ESLint 9 で循環参照エラーになるため直接 spread する。
 */
const eslintConfig = [
	{
		ignores: [
			".next/**",
			".open-next/**",
			".wrangler/**",
			"out/**",
			"build/**",
			"coverage/**",
			"next-env.d.ts",
			"cloudflare-env.d.ts",
		],
	},
	...next,
];

export default eslintConfig;
