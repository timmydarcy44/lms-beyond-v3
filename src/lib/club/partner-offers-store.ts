import { useEffect, useState } from "react";

export type PartnerOffer = {
  id: string;
  name: string;
  totalHt: number;
  createdAt: string;
};

const partnerOffersByKey: Record<string, PartnerOffer[]> = {};
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const addPartnerOffer = (partnerKey: string, partnerName: string, offer: PartnerOffer) => {
  const keys = new Set([partnerKey, partnerName]);
  keys.forEach((key) => {
    partnerOffersByKey[key] = [offer, ...(partnerOffersByKey[key] ?? [])];
  });
  emitChange();
};

export const getPartnerOffers = (partnerKey?: string | null) => {
  if (!partnerKey) return [];
  return partnerOffersByKey[partnerKey] ?? [];
};

export const usePartnerOffers = (partnerKey?: string | null) => {
  const [offers, setOffers] = useState<PartnerOffer[]>(() => getPartnerOffers(partnerKey));

  useEffect(() => {
    setOffers(getPartnerOffers(partnerKey));
    const unsubscribe = subscribe(() => {
      setOffers(getPartnerOffers(partnerKey));
    });
    return unsubscribe;
  }, [partnerKey]);

  return offers;
};
