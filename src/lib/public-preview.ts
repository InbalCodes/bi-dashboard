export function isPublicPreviewEnabled(): boolean {
  return process.env.PUBLIC_PREVIEW === "true";
}

export function canAccessWithoutLogin(pathname: string): boolean {
  if (!isPublicPreviewEnabled()) {
    return false;
  }

  const publicPaths = [
    "/",
    "/login",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/cron",
  ];

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }

  const managerOnlyPaths = [
    "/settings",
    "/api/sync",
    "/api/alerts",
  ];

  if (managerOnlyPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }

  return true;
}
