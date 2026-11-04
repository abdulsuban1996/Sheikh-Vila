import withSerwistInit from "@serwist/next";
import { randomUUID } from "node:crypto";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Only the public offline page is precached (never authenticated HTML).
  additionalPrecacheEntries: [{ url: "/offline", revision: randomUUID() }],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
};

export default withSerwist(nextConfig);
