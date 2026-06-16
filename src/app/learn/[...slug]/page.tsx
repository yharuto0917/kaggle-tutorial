import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { source } from "@/lib/source";

export function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) return {};
	return {
		title: page.data.title,
		description: page.data.description,
	};
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string[] }> }) {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) notFound();

	const MDXContent = page.data.body;

	return (
		<main className="mx-auto max-w-3xl px-6 py-12">
			<article className="prose prose-neutral max-w-none dark:prose-invert">
				<h1>{page.data.title}</h1>
				{page.data.description ? (
					<p className="lead text-foreground/70">{page.data.description}</p>
				) : null}
				<MDXContent />
			</article>
		</main>
	);
}
