import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Toc } from "@/components/layout/toc";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { competitionsSource } from "@/lib/source";

export function generateStaticParams() {
	return competitionsSource.generateParams();
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const page = competitionsSource.getPage(slug);
	if (!page) return {};
	return {
		title: page.data.title,
		description: page.data.description,
	};
}

export default async function CompetitionPage({ params }: { params: Promise<{ slug: string[] }> }) {
	const { slug } = await params;
	const page = competitionsSource.getPage(slug);
	if (!page) notFound();

	const breadcrumbs = [{ name: "コンペ", url: "/competitions" }, { name: page.data.title }];
	const MDXContent = page.data.body;

	return (
		<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
			<Breadcrumbs items={breadcrumbs} />
			<div className="flex gap-10">
				<article
					data-pagefind-body
					className="prose prose-neutral min-w-0 max-w-none flex-1 dark:prose-invert"
				>
					<h1>{page.data.title}</h1>
					{page.data.description ? (
						<p className="lead text-foreground/70">{page.data.description}</p>
					) : null}
					<MDXContent components={mdxComponents} />
				</article>
				<Toc items={page.data.toc} />
			</div>
		</div>
	);
}
