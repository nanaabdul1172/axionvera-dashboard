/**
 * @module permissions
 *
 * Public API for the permissions and RBAC system.
 * Re-exports all permission utilities and types.
 */

// Core RBAC utilities
export {
  hasMinimumRole,
  getRolePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  checkPermissions,
  canAccessRoute,
  getMissingPermissions,
  isAdmin,
  isSuperAdmin,
  getUserRole,
  assignRole,
  grantPermissions,
} from "./rbac";

// Route configuration
export {
  ROUTE_ACCESS_CONFIG,
  getRouteAccess,
  isPublicRoute,
  requiresAuth,
  getMinimumRole,
} from "./routes";

// Types
export type {
  UserRole,
  RouteAccess,
  UserWithRole,
  PermissionCheckResult,
} from "@/types/rbac";

export { UserRole as Role, Permission } from "@/types/rbac";
