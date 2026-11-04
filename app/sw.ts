/// <reference lib="webworker" />
import { NetworkOnly, Serwist, StaleWhileRevalidate, CacheFirst, ExpirationPlugin } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

/**
 * Privacy rule: cache ONLY static assets, fonts, icons and the offline page.
 * Never cache Supabase/API responses or authenticated HTML.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      // Supabase + any API: always network, never stored
      matcher: ({ url }) =>
        url.hostname.endsWith("supabase.co") ||
        url.hostname.endsWith("supabase.in") ||
        url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url }) =>
        request.destination === "font" ||
        url.pathname.startsWith("/_next/static/media/"),
      handler: new CacheFirst({
        cacheName: "fonts",
        plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 })],
      }),
    },
    {
      matcher: ({ url, request }) =>
        url.origin === self.location.origin &&
        (url.pathname.startsWith("/_next/static/") ||
          url.pathname.startsWith("/icons/") ||
          request.destination === "image"),
      handler: new StaleWhileRevalidate({
        cacheName: "static-assets",
        plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
    {
      // Pages (authenticated HTML) go to network only; offline fallback below
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkOnly(),
    },
  ],
});

serwist.setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const res = await serwist.matchPrecache("/offline");
    if (res) return res;
  }
  return Response.error();
});

serwist.addEventListeners();
