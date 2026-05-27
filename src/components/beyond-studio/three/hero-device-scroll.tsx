"use client";

import { createContext, useContext } from "react";

/** 0–1 scroll progress for hero device (scroll + pointer). */
export const HeroDeviceScrollContext = createContext(0);

export function useHeroDeviceScroll() {
  return useContext(HeroDeviceScrollContext);
}
