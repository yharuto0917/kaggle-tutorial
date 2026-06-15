import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// 親ディレクトリの lockfile を誤検出しないよう、ワークスペースルートを明示する。
	turbopack: {
		root: process.cwd(),
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
