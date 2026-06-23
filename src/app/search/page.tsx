import { OramaSearch } from "@/components/search/orama-search";
import { SearchClient } from "@/components/search/search-client";
import { buildSearchDocs } from "@/lib/search-docs";

export const metadata = {
	title: "サイト内検索",
};

export default function SearchPage() {
	const docs = buildSearchDocs();
	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<h1 className="text-3xl font-bold tracking-tight">サイト内検索</h1>
			<p className="mt-2 text-foreground/70">レッスン・コンペ解説・用語集を横断して検索します。</p>

			<section className="mt-6">
				<h2 className="mb-2 text-sm font-semibold">クイック検索（タイポ許容）</h2>
				<OramaSearch documents={docs} />
			</section>

			<section className="mt-10">
				<h2 className="mb-2 text-sm font-semibold">本文の全文検索</h2>
				<SearchClient />
			</section>
		</main>
	);
}
