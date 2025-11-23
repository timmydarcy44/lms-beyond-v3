import { JessicaContentinLayout } from "@/app/jessica-contentin/layout";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <JessicaContentinLayout>{children}</JessicaContentinLayout>;
}

