import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccess } from "./lib/permissions";

/**
 * Define your application's routes and the permissions required.
 * `allow: true` means any authenticated user can access.
 */
const routePermissions = [
  // --- AUTH / STATIC (allowed immediately)
  { match: /^\/api\/auth(\/.*)?$/i, allow: true },
  { match: /^\/access-denied(\/.*)?$/i, allow: true },
  // --- API endpoints
  { match: /^\/api\/users(\/.*)?$/i, action: "users.manage" },
  { match: /^\/api\/products(\/.*)?$/i, action: "products.manage" },
  { match: /^\/api\/category(\/.*)?$/i, action: "categories.manage" },
  { match: /^\/api\/customers?(\/.*)?$/i, action: "customers.manage" },
  { match: /^\/api\/deliveries(\/.*)?$/i, action: "deliveries.manage" },
  { match: /^\/api\/drivers(\/.*)?$/i, action: "drivers.manage" },
  { match: /^\/api\/invoices?(\/.*)?$/i, action: "invoices.manage" },
  { match: /^\/api\/reports(\/.*)?$/i, action: "reports.view" },
  { match: /^\/api\/sale(s?)(\/.*)?$/i, action: "sales.create" },
  { match: /^\/api\/sales\/refund(\/.*)?$/i, action: "sales.refund" },
  { match: /^\/api\/sales\/report(\/.*)?$/i, action: "sales.report" },
  { match: /^\/api\/suppliers(\/.*)?$/i, action: "suppliers.manage" },

  // --- Page routes (frontend)
  { match: /^\/customer-screen(\/.*)?$/i, action: "customers.view" },
  { match: /^\/customers(\/.*)?$/i, action: "customers.view" },
  { match: /^\/delivery(\/.*)?$/i, action: "deliveries.view" },
  { match: /^\/inventory(\/.*)?$/i, action: "inventory.view" },
  { match: /^\/products(\/.*)?$/i, action: "products.view" },
  { match: /^\/reports(\/.*)?$/i, action: "reports.view" },
  { match: /^\/sales(\/.*)?$/i, action: "sales.view" },
  { match: /^\/settings(\/.*)?$/i, action: "settings.manage" },
];

const signInPage = "/auth/signin";
const accessDeniedPage = "/access-denied";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Find the rule for the current pathname
  const rule = routePermissions.find((r) => r.match.test(pathname));

  // --- 1. First, handle public or explicitly allowed routes
  if (rule?.allow) {
    return NextResponse.next();
  }

  // --- 2. Then, check for authentication
  if (!token) {
    // Allow access to the signin page itself to prevent redirect loop
    if (pathname === signInPage) {
      return NextResponse.next();
    }

    // For API routes, return JSON error
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For page routes, redirect to sign-in
    const url = new URL(signInPage, req.url);
    url.searchParams.set("callbackUrl", req.url); // Preserve the intended destination
    return NextResponse.redirect(url);
  }

  // --- 3. Finally, check for permissions (now that we know the user is authenticated)
  if (rule?.action) {
    const userRole = token.role;
    if (!canAccess(userRole, rule.action)) {
      // For API routes, return JSON error
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // For page routes, rewrite to the access-denied page
      const url = new URL(accessDeniedPage, req.url);
      return NextResponse.rewrite(url, { status: 403 });
    }
  }

  // --- Default: Allow access for any authenticated user if no specific rule denies it
  return NextResponse.next();
}

export const config = {
  // Protect everything except internal Next.js paths and static assets
  matcher: [
    "/((?!_next/static|_next/image|_next|favicon.ico|robots.txt|sitemap.xml|public).*)",
  ],
};
