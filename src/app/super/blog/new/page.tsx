import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { BlogEditor } from "./blog-editor";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewBlogPostPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return <BlogEditor />;
}

