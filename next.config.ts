import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
	// 親ディレクトリの lockfile を誤検出しないよう、ワークスペースルートを明示する。
	turbopack: {
		root: process.cwd(),
	},
};

// fumadocs-mdx を Next.js に統合し、content/ の MDX をビルド時に `.source` へコンパイルする。
const withMDX = createMDX();

export default withMDX(nextConfig);

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
