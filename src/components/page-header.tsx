import Link from "next/link";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  backHref = "/dashboard",
  backLabel = "Dashboard",
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {backHref && (
          <Button asChild variant="outline" size="sm">
            <Link href={backHref}>← {backLabel}</Link>
          </Button>
        )}
        {actions}
      </div>
    </header>
  );
}
