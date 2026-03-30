"use client";

import { useEffect, useMemo, useState } from "react";
import { ProviderDiscoveryCard } from "@/components/ProviderDiscoveryCard";
import type { DiscoveryCardStatic } from "@/lib/discovery-cards";
import { sortDiscoveryCardsByReputation } from "@/lib/discovery-cards";
import {
  MARKETPLACE_REVIEWS_STORAGE_KEY,
  MARKETPLACE_REVIEWS_UPDATED_EVENT,
} from "@/lib/marketplace-reviews";

type Props = {
  cards: DiscoveryCardStatic[];
};

export function BrowseProvidersGrid({ cards }: Props) {
  const [version, setVersion] = useState(0);

  const orderedCards = useMemo(() => {
    void version;
    return sortDiscoveryCardsByReputation(cards);
  }, [cards, version]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MARKETPLACE_REVIEWS_STORAGE_KEY) setVersion((v) => v + 1);
    };
    const onCustom = () => setVersion((v) => v + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, onCustom);
    };
  }, []);

  return (
    <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
      {orderedCards.map((card) => (
        <li key={`${card.providerSlug}::${card.serviceName}`}>
          <ProviderDiscoveryCard
            card={card}
            refreshVersion={version}
            variant="grid"
            showListedBadge
          />
        </li>
      ))}
    </ul>
  );
}
