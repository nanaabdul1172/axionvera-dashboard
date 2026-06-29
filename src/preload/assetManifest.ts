export type AssetPriority = "critical" | "high" | "medium" | "low";
export type AssetKind = "script" | "style" | "image" | "font" | "fetch" | "route";

export interface PreloadAsset {
  href: string;
  as: AssetKind;
  priority: AssetPriority;
  crossOrigin?: "anonymous" | "use-credentials";
  type?: string;
}

export interface RoutePreloadProfile {
  route: string;
  assets: PreloadAsset[];
  nextRoutes: string[];
}

const COMMON_CRITICAL_ASSETS: PreloadAsset[] = [
  { href: "/favicon.ico", as: "image", priority: "low" },
];

export const ROUTE_PRELOAD_PROFILES: RoutePreloadProfile[] = [
  {
    route: "/",
    assets: COMMON_CRITICAL_ASSETS,
    nextRoutes: ["/dashboard", "/analytics", "/governance"],
  },
  {
    route: "/dashboard",
    assets: [
      ...COMMON_CRITICAL_ASSETS,
      { href: "/analytics", as: "route", priority: "high" },
      { href: "/governance", as: "route", priority: "medium" },
    ],
    nextRoutes: ["/analytics", "/governance", "/profile"],
  },
  {
    route: "/analytics",
    assets: [
      { href: "/dashboard", as: "route", priority: "high" },
      { href: "/monitoring", as: "route", priority: "medium" },
    ],
    nextRoutes: ["/dashboard", "/monitoring"],
  },
  {
    route: "/governance",
    assets: [
      { href: "/dashboard", as: "route", priority: "high" },
      { href: "/profile", as: "route", priority: "medium" },
    ],
    nextRoutes: ["/dashboard", "/profile"],
  },
  {
    route: "/monitoring",
    assets: [
      { href: "/dashboard", as: "route", priority: "high" },
      { href: "/analytics", as: "route", priority: "medium" },
    ],
    nextRoutes: ["/dashboard", "/analytics"],
  },
  {
    route: "/profile",
    assets: [{ href: "/dashboard", as: "route", priority: "high" }],
    nextRoutes: ["/dashboard"],
  },
];
