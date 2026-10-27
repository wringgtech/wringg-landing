"use client";

import { useEffect } from "react";
import { getAppStoreUrl } from "../../lib/app-links.mjs";

export function StoreRedirect() {
  useEffect(() => {
    const destination = getAppStoreUrl(navigator.userAgent, navigator.maxTouchPoints);
    if (destination) window.location.replace(destination);
  }, []);
  return null;
}
