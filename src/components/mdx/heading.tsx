import type { ComponentPropsWithoutRef } from "react";

/**
 * fumadocs が付与する見出し id に対し、ホバーで現れるアンカーリンク（#）を添える。
 */
export function createHeading(Tag: "h2" | "h3" | "h4") {
	return function Heading({ id, children, className, ...props }: ComponentPropsWithoutRef<"h2">) {
		return (
			<Tag id={id} className={`group/anchor scroll-mt-24 ${className ?? ""}`} {...props}>
				{children}
				{id ? (
					<a
						href={`#${id}`}
						aria-label="この見出しへのリンク"
						className="ml-2 text-foreground/30 no-underline opacity-0 transition group-hover/anchor:opacity-100"
					>
						#
					</a>
				) : null}
			</Tag>
		);
	};
}
