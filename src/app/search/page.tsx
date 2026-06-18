import { SearchClient } from "@/components/search/search-client";

export const metadata = {
	title: "サイト内検索",
};

export default function SearchPage() {
	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<h1 className="text-3xl font-bold tracking-tight">サイト内検索</h1>
			<p className="mt-2 text-foreground/70">
				レッスン・コンペ解説・用語集を横断して全文検索します。
			</p>
			<SearchClient />
		</main>
	);
}
