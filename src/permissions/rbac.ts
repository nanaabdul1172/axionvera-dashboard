/**
 * @module permissions/rbac
 *
 * Core RBAC utilities for permission evaluation and role management.
 *
 * This module provides pure functions for checking permissions and roles
 * without any React or context dependencies, making them reusable across
 * middleware, API routes, and components.
 */

import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  UserWithRole,
  PermissionCheckResult,
  RouteAccess,
} from "@/types/rbac";

/**
 * Role hierarchy levels for comparison.
 * Higher numbers indicate more privileges.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.USER]: 1,
  [UserRole.POWER_USER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

/**
 * Check if a role has sufficient privileges compared to a minimum required role.
 *
 * @param userRole - The user's current role
 * @param minRole - The minimum required role
 * @returns True if userRole meets or exceeds minRole
 *
 * @example
 * hasMinimumRole(UserRole.ADMIN, UserRole.USER) // true
 * hasMinimumRole(UserRole.USER, UserRole.ADMIN) // false
 */
export function hasMinimumRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Get all permissions for a given role.
 *
 * @param role - The user role
 * @returns Array of permissions granted to this role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user has a specific permission.
 *
 * @param user - User with role information
 * @param permission - Permission to check
 * @returns True if user has the permission
 */
export function hasPermission(user: UserWithRole | null, permission: Permission): boolean {
  if (!user) return false;

  // Check custom permissions first
  if (user.customPermissions?.includes(permission)) {
    return true;
  }

  // Check role-based permissions
  const rolePermissions = getRolePermissions(user.role);
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has ALL of the specified permissions.
 *
 * @param user - User with role information
 * @param permissions - Array of permissions to check
 * @returns True if user has all permissions
 */
export function hasAllPermissions(
  user: UserWithRole | null,
  permissions: Permission[]
): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has ANY of the specified permissions.
 *
 * @param user - User with role information
 * @param permissions - Array of permissions to check
 * @returns True if user has at least one permission
 */
export function hasAnyPermission(
  user: UserWithRole | null,
  permissions: Permission[]
): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Comprehensive permission check with detailed results.
 *
 * @param user - User with role information
 * @param requiredPermissions - Permissions required for access
 * @param minRole - Minimum role required (optional)
 * @returns Detailed permission check result
 */
export function checkPermissions(
  user: UserWithRole | null,
  requiredPermissions: Permission[],
  minRole?: UserRole
): PermissionCheckResult {
  // No user provided
  if (!user) {
    return {
      granted: false,
      reason: "User not authenticated",
    };
  }

  // Check minimum role if specified
  if (minRole && !hasMinimumRole(user.role, minRole)) {
    return {
      granted: false,
      reason: `Requires minimum role: ${minRole}`,
    };
  }

  // Check all required permissions
  if (requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter(
      (permission) => !hasPermission(user, permission)
    );

    if (missingPermissions.length > 0) {
      return {
        granted: false,
        reason: "Insufficient permissions",
        missingPermissions,
      };
    }
  }

  return { granted: true };
}

/**
 * Check if a user can access a specific route.
 *
 * @param user - User with role information (null for guests)
 * @param routeConfig - Route access configuration
 * @returns Permission check result
 */
export function canAccessRoute(
  user: UserWithRole | null,
  routeConfig: RouteAccess
): PermissionCheckResult {
  // Allow guest access if explicitly configured
  if (routeConfig.allowGuest && !user) {
    return { granted: true };
  }

  // Check if user exists for non-guest routes
  if (!user) {
    return {
      granted: false,
      reason: "Authentication required",
    };
  }

  // Check minimum role
  if (!hasMinimumRole(user.role, routeConfig.minRole)) {
    return {
      granted: false,
      reason: `Requires minimum role: ${routeConfig.minRole}`,
    };
  }

  // Check additional permissions if specified
  if (routeConfig.permissions && routeConfig.permissions.length > 0) {
    return checkPermissions(user, routeConfig.permissions);
  }

  return { granted: true };
}

/**
 * Get a list of missing permissions for a user.
 *
 * @param user - User with role information
 * @param requiredPermissions - Permissions to check
 * @returns Array of missing permissions
 */
export function getMissingPermissions(
  user: UserWithRole | null,
  requiredPermissions: Permission[]
): Permission[] {
  if (!user) return requiredPermissions;

  return requiredPermissions.filter(
    (permission) => !hasPermission(user, permission)
  );
}

/**
 * Check if a user is an administrator (ADMIN or SUPER_ADMIN).
 *
 * @param user - User with role information
 * @returns True if user is an admin
 */
export function isAdmin(user: UserWithRole | null): boolean {
  if (!user) return false;
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
}

/**
 * Check if a user is a super administrator.
 *
 * @param user - User with role information
 * @returns True if user is a super admin
 */
export function isSuperAdmin(user: UserWithRole | null): boolean {
  if (!user) return false;
  return user.role === UserRole.SUPER_ADMIN;
}

/**
 * Get user role from wallet address.
 * In a production system, this would query a backend API or smart contract.
 * For now, it returns a default role based on connection status.
 *
 * @param address - Wallet address
 * @returns User with role information
 */
export function getUserRole(address: string | null): UserWithRole | null {
  if (!address) return null;

  // TODO: Replace with actual role lookup from backend/contract
  // For now, return a default USER role for all connected wallets
  return {
    address,
    role: UserRole.USER,
  };
}

/**
 * Assign a custom role to a user (administrative function).
 * In production, this would make an API call to update the user's role.
 *
 * @param address - Wallet address
 * @param role - Role to assign
 * @returns Updated user with role
 */
export async function assignRole(
  address: string,
  role: UserRole
): Promise<UserWithRole> {
  // TODO: Implement actual role assignment via API/contract
  // For now, return the user with the new role
  return {
    address,
    role,
  };
}

/**
 * Grant custom permissions to a user.
 * In production, this would make an API call to update user permissions.
 *
 * @param address - Wallet address
 * @param permissions - Permissions to grant
 * @returns Updated user with custom permissions
 */
export async function grantPermissions(
  address: string,
  permissions: Permission[]
): Promise<UserWithRole> {
  // TODO: Implement actual permission granting via API/contract
  const user = getUserRole(address);
  if (!user) {
    throw new Error("User not found");
  }

  return {
    ...user,
    customPermissions: [...(user.customPermissions || []), ...permissions],
  };
}
