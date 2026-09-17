import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface VideoBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function VideoBreadcrumb({ items }: VideoBreadcrumbProps) {
  return (
    <div className="mb-8 flex items-center gap-2 text-sm text-muted">
      <Link href="/" className="transition-colors hover:text-brand">
        Home
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-muted" />
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-brand">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
