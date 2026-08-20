import type { AnchorHTMLAttributes } from "react";

type InternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

export default function InternalLink({ children, href, ...props }: InternalLinkProps) {
  return <a href={href} {...props}>{children}</a>;
}
