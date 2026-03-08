import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function FormateurCommunautePage() {
  const session = await getSession();
  if (session?.role === "demo") {
    return (
      <div className="min-h-screen bg-[#f5f5f7] px-6 py-10 text-gray-900">
        <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Mode Démo</h1>
          <p className="mt-2 text-sm text-gray-500">
            Accédez à la messagerie depuis le lien ci-dessous.
          </p>
          <Link
            href="/dashboard/student/community"
            className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Ouvrir la messagerie
          </Link>
        </div>
      </div>
    );
  }
  redirect("/dashboard/student/community");
}
