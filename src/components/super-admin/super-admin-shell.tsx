import { ReactNode } from "react";
import Link from "next/link";

type Breadcrumb = {
  label: string;
  href?: string;
};

type SuperAdminShellProps = {
  title: string;
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
};

export function SuperAdminShell({
  title,
  breadcrumbs = [],
  children,
}: SuperAdminShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}

