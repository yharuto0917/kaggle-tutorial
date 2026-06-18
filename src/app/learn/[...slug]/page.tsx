import { getBreadcrumbItems } from "fumadocs-core/breadcrumb";
import { findNeighbour } from "fumadocs-core/page-tree";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PrevNext } from "@/components/layout/prev-next";
import { Toc } from "@/components/layout/toc";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { LessonProvider } from "@/components/progress/lesson-context";
import { LessonProgressButton } from "@/components/progress/lesson-progress-button";
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
				<article
					data-pagefind-body
					className="prose prose-neutral min-w-0 max-w-none flex-1 dark:prose-invert"
				>
					<h1>{page.data.title}</h1>
					{page.data.description ? (
						<p className="lead text-foreground/70">{page.data.description}</p>
					) : null}
					<LessonProvider lessonId={page.url}>
						<MDXContent components={mdxComponents} />
					</LessonProvider>
					<LessonProgressButton lessonId={page.url} />
				</article>
				<Toc items={page.data.toc} />
			</div>
			<PrevNext previous={previous} next={next} />
		</div>
	);
}
