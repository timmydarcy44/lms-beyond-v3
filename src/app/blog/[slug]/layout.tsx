import { JessicaContentinLayout } from "@/app/jessica-contentin/layout";

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <JessicaContentinLayout>{children}</JessicaContentinLayout>;
}

