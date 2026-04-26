"use client";

import { useEffect, useState } from "react";
import { store, useStoreSubscribe } from "./store";
import type { Capture } from "@/types";

export function useCaptures(): { captures: Capture[]; hydrated: boolean } {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    store.seedDemo();
    setCaptures(store.list());
    setHydrated(true);
    const unsub = useStoreSubscribe(() => setCaptures(store.list()));
    return unsub;
  }, []);

  return { captures, hydrated };
}
