import { notFound, redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { CheckoutClient } from "@/components/catalogue/checkout-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CheckoutPage() {
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Récupérer le panier depuis la base de données
  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) {
    console.error("[checkout] Error fetching cart:", error);
    redirect("/dashboard/catalogue");
  }

  if (!cartItems || cartItems.length === 0) {
    redirect("/dashboard/catalogue");
  }

  return <CheckoutClient initialCartItems={cartItems} />;
}



