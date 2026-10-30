import type { CareDomain } from "@/lib/care/domains";
import type { CareSessionFormat } from "@/lib/care/available-slots";

export type CareBookingStatus = "confirmed" | "cancelled_client" | "cancelled_expert" | "completed";
export type CareBookingForWhom = "self" | "child" | "relative";
export type CarePaymentMethod = "on_site" | "card" | "wallet";

export type CareProfile = {
  expert_id: string;
  slug: string;
  published: boolean;
  is_care: boolean;
  display_name: string;
  title: string;
  tagline: string;
  headline: string;
  bio: string;
  approach: string;
  avatar_url: string | null;
  domains: CareDomain[];
  publics: string[];
  city: string | null;
  address: string | null;
  offers_cabinet: boolean;
  offers_visio: boolean;
  languages: string[];
  payment_methods: string[];
  cancellation_hours: number;
  member_since: string | null;
  is_test?: boolean;
};

export type CareService = {
  id: string;
  expert_id: string;
  position: number;
  name: string;
  domain: CareDomain;
  description: string;
  duration_min: number;
  formats: CareSessionFormat[];
  price_cents: number;
  active: boolean;
};

export type CareDirectoryRow = {
  expert_id: string;
  slug: string;
  display_name: string;
  title: string;
  tagline: string;
  headline: string;
  avatar_url: string | null;
  domains: CareDomain[];
  city: string | null;
  offers_cabinet: boolean;
  offers_visio: boolean;
  publics: string[];
  badge_count: number;
  min_price_cents: number | null;
  member_since: string | null;
  price_main?: string;
  price_hint?: string;
  place_main?: string;
  place_hint?: string;
  service_names?: string[];
  next_slots?: string[];
};
