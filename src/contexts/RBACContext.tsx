/**
 * @module contexts/RBACContext
 *
 * React context for Role-Based Access Control (RBAC).
 * Provides user role and permission checking throughout the component tree.
 *
 * This context integrates with WalletContext to derive user roles from
 * connected wallet addresses and provides convenient hooks for permission
 * checks in components.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

import { useWalletContext } from "@/contexts/WalletContext";
import {
  UserRole,
  Permission,
  UserWithRole,
  PermissionCheckResult,
} from "@/types/rbac";
import {
  getUserRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  checkPermissions,
  hasMinimumRole,
  isAdmin,
  isSuperAdmin,
} from "@/permissions/rbac";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface RBACContextType {
  /** Current user with role information (null if not connected) */
  user: UserWithRole | null;
  /** Current user role */
  role: UserRole;
  /** Whether user is authenticated (has a connected wallet) */
  isAuthenticated: boolean;
  /** Whether user is an administrator */
  isAdmin: boolean;
  /** Whether user is a super administrator */
  isSuperAdmin: boolean;

  // ── Permission checks ───────────────────────────────────────────────────
  /** Check if user has a specific permission */
  hasPermission: (permission: Permission) => boolean;
  /** Check if user has all specified permissions */
  hasAllPermissions: (permissions: Permission[]) => boolean;
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: Permission[]) => boolean;
  /** Check if user meets minimum role requirement */
  hasMinimumRole: (minRole: UserRole) => boolean;
  /** Comprehensive permission check with detailed results */
  checkPermissions: (
    requiredPermissions: Permission[],
    minRole?: UserRole
  ) => PermissionCheckResult;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function RBACProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useWalletContext();

  // Get user with role information
  const user = useMemo<UserWithRole | null>(() => {
    if (!address || !isConnected) return null;
    return getUserRole(address);
  }, [address, isConnected]);

  // Current role (GUEST if not authenticated)
  const role = useMemo<UserRole>(
    () => user?.role ?? UserRole.GUEST,
    [user]
  );

  // Admin checks
  const isUserAdmin = useMemo(() => isAdmin(user), [user]);
  const isUserSuperAdmin = useMemo(() => isSuperAdmin(user), [user]);

  // ── Permission check callbacks ─────────────────────────────────────────
  const hasPermissionCallback = useCallback(
    (permission: Permission) => hasPermission(user, permission),
    [user]
  );

  const hasAllPermissionsCallback = useCallback(
    (permissions: Permission[]) => hasAllPermissions(user, permissions),
    [user]
  );

  const hasAnyPermissionCallback = useCallback(
    (permissions: Permission[]) => hasAnyPermission(user, permissions),
    [user]
  );

  const hasMinimumRoleCallback = useCallback(
    (minRole: UserRole) => hasMinimumRole(role, minRole),
    [role]
  );

  const checkPermissionsCallback = useCallback(
    (requiredPermissions: Permission[], minRole?: UserRole) =>
      checkPermissions(user, requiredPermissions, minRole),
    [user]
  );

  // ── Context value ───────────────────────────────────────────────────────
  const value = useMemo<RBACContextType>(
    () => ({
      user,
      role,
      isAuthenticated: isConnected,
      isAdmin: isUserAdmin,
      isSuperAdmin: isUserSuperAdmin,
      hasPermission: hasPermissionCallback,
      hasAllPermissions: hasAllPermissionsCallback,
      hasAnyPermission: hasAnyPermissionCallback,
      hasMinimumRole: hasMinimumRoleCallback,
      checkPermissions: checkPermissionsCallback,
    }),
    [
      user,
      role,
      isConnected,
      isUserAdmin,
      isUserSuperAdmin,
      hasPermissionCallback,
      hasAllPermissionsCallback,
      hasAnyPermissionCallback,
      hasMinimumRoleCallback,
      checkPermissionsCallback,
    ]
  );

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to access RBAC context.
 * Provides user role and permission checking functionality.
 *
 * @throws Error if used outside RBACProvider
 *
 * @example
 * const { hasPermission, role, isAdmin } = useRBAC();
 * if (hasPermission(Permission.VIEW_ANALYTICS)) {
 *   // Render analytics
 * }
 */
export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
}

/**
 * Hook to check a specific permission.
 * Returns a boolean indicating if the current user has the permission.
 *
 * @param permission - Permission to check
 * @returns True if user has the permission
 *
 * @example
 * const canViewAnalytics = usePermission(Permission.VIEW_ANALYTICS);
 */
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useRBAC();
  return hasPermission(permission);
}

/**
 * Hook to check multiple permissions (all required).
 *
 * @param permissions - Array of permissions to check
 * @returns True if user has all permissions
 *
 * @example
 * const canManageVault = usePermissions([
 *   Permission.DEPOSIT_VAULT,
 *   Permission.WITHDRAW_VAULT,
 * ]);
 */
export function usePermissions(permissions: Permission[]): boolean {
  const { hasAllPermissions } = useRBAC();
  return hasAllPermissions(permissions);
}

/**
 * Hook to check if user meets minimum role requirement.
 *
 * @param minRole - Minimum role required
 * @returns True if user meets the role requirement
 *
 * @example
 * const isAtLeastPowerUser = useRole(UserRole.POWER_USER);
 */
export function useRole(minRole: UserRole): boolean {
  const { hasMinimumRole } = useRBAC();
  return hasMinimumRole(minRole);
}
