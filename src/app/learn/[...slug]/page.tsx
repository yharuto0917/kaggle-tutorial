import { getBreadcrumbItems } from "fumadocs-core/breadcrumb";
import { findNeighbour } from "fumadocs-core/page-tree";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PrevNext } from "@/components/layout/prev-next";
import { Toc } from "@/components/layout/toc";
import { mdxComponents } from "@/components/mdx/mdx-components";
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

	const tree = source.pageTree;
	const breadcrumbs = [
		{ name: "学習", url: "/learn" },
		...getBreadcrumbItems(page.url, tree, { includePage: true }),
	];
	const { previous, next } = findNeighbour(tree, page.url);
	const MDXContent = page.data.body;

	return (
		<div>
			<Breadcrumbs items={breadcrumbs} />
			<div className="flex gap-10">
				<article className="prose prose-neutral min-w-0 max-w-none flex-1 dark:prose-invert">
					<h1>{page.data.title}</h1>
					{page.data.description ? (
						<p className="lead text-foreground/70">{page.data.description}</p>
					) : null}
					<MDXContent components={mdxComponents} />
				</article>
				<Toc items={page.data.toc} />
			</div>
			<PrevNext previous={previous} next={next} />
		</div>
	);
}
