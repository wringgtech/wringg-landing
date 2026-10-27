export const appStoreLinks = {
  android: "https://play.google.com/store/apps/details?id=in.wringg.app",
  // Set the verified customer App Store URL here when available.
  ios: "",
};

export function getAppStoreUrl(userAgent = "", maxTouchPoints = 0, links = appStoreLinks) {
  if (/android/i.test(userAgent)) return links.android || null;
  if (/iPad|iPhone|iPod/i.test(userAgent) ||
      (/Macintosh|MacIntel/i.test(userAgent) && maxTouchPoints > 1)) {
    return links.ios || null;
  }
  return null;
}
