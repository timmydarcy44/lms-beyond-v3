"use client";

import { CatalogTopNav } from "./catalog-top-nav";
import { CartButton } from "./cart-button";
import { CartDrawer } from "./cart-drawer";
import { useState } from "react";

export function CatalogTopNavClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <>
      <CatalogTopNav
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onCategorySelect={(category) => setSelectedCategory(category)}
        selectedCategory={selectedCategory}
        cartButton={<CartButton />}
      />
      <CartDrawer />
    </>
  );
}

