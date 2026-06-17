import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  RITUEL_SOMMEIL_PRODUCT,
  type RituelSommeilProductData,
} from "@/lib/jessica-contentin/rituel-sommeil-product";

const JESSICA_CONTENTIN_UUID = "17364229-fe78-4986-ac69-41b880e34631";

export async function loadRituelSommeilProduct(): Promise<RituelSommeilProductData> {
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return {
      catalogItemId: null,
      contentId: null,
      price: RITUEL_SOMMEIL_PRODUCT.defaultPrice,
      stripeCheckoutUrl: null,
      isFree: false,
    };
  }

  const { data: items } = await supabase
    .from("catalog_items")
    .select("id, content_id, price, is_free, stripe_checkout_url, title")
    .eq("created_by", JESSICA_CONTENTIN_UUID)
    .eq("is_active", true)
    .or("title.ilike.%rituel du sommeil%,title.ilike.%rituel%sommeil%");

  const item =
    items?.find((row) => /rituel/i.test(row.title ?? "") && /sommeil/i.test(row.title ?? "")) ??
    items?.[0] ??
    null;

  if (!item) {
    return {
      catalogItemId: null,
      contentId: null,
      price: RITUEL_SOMMEIL_PRODUCT.defaultPrice,
      stripeCheckoutUrl: null,
      isFree: false,
    };
  }

  return {
    catalogItemId: item.id,
    contentId: item.content_id ?? item.id,
    price: item.price ?? RITUEL_SOMMEIL_PRODUCT.defaultPrice,
    stripeCheckoutUrl: item.stripe_checkout_url ?? null,
    isFree: item.is_free ?? false,
  };
}
