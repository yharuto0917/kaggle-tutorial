import next from "eslint-config-next";

/**
 * Next.js 16 では `next lint` が廃止され、ESLint CLI を直接利用する。
 * eslint-config-next はフラット設定配列 (core-web-vitals + typescript) を
 * そのままエクスポートするため、FlatCompat を介さず spread する。
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
