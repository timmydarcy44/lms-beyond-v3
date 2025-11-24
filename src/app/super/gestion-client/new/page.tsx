import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CreateUserForm } from "./create-user-form";

export default async function CreateUserPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 
          className="text-4xl font-bold mb-8"
          style={{ color: "#2F2A25" }}
        >
          Créer un nouveau compte
        </h1>
        <CreateUserForm />
      </div>
    </div>
  );
}

