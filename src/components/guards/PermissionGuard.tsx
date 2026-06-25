/**
 * @module components/guards/PermissionGuard
 *
 * Component guard for permission-based rendering.
 * Conditionally renders children based on user permissions.
 */

import React, { ReactNode } from "react";
import { useRBAC } from "@/contexts/RBACContext";
import { Permission, UserRole } from "@/types/rbac";

interface PermissionGuardProps {
  /** Content to render if user has permission */
  children: ReactNode;
  /** Required permission(s) */
  permission?: Permission;
  /** Multiple permissions (all required) */
  permissions?: Permission[];
  /** Check any of the permissions (at least one required) */
  anyPermission?: Permission[];
  /** Minimum role required */
  minRole?: UserRole;
  /** Content to render if user lacks permission */
  fallback?: ReactNode;
  /** Whether to hide completely (true) or show fallback (false) */
  hideOnDenied?: boolean;
}

/**
 * Guard component that conditionally renders content based on permissions.
 *
 * @example
 * // Single permission check
 * <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
 *   <AnalyticsPanel />
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions (all required)
 * <PermissionGuard permissions={[Permission.CREATE_PROPOSALS, Permission.VOTE_PROPOSALS]}>
 *   <ProposalForm />
 * </PermissionGuard>
 *
 * @example
 * // Any permission (at least one)
 * <PermissionGuard anyPermission={[Permission.ADMIN_PANEL, Permission.MANAGE_USERS]}>
 *   <AdminTools />
 * </PermissionGuard>
 *
 * @example
 * // With fallback
 * <PermissionGuard
 *   permission={Permission.VIEW_MONITORING}
 *   fallback={<div>Access Denied</div>}
 * >
 *   <MonitoringPanel />
 * </PermissionGuard>
 *
 * @example
 * // Role-based check
 * <PermissionGuard minRole={UserRole.ADMIN}>
 *   <AdminPanel />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  anyPermission,
  minRole,
  fallback = null,
  hideOnDenied = true,
}: PermissionGuardProps) {
  const rbac = useRBAC();

  // Check minimum role if specified
  if (minRole && !rbac.hasMinimumRole(minRole)) {
    return hideOnDenied ? null : <>{fallback}</>;
  }

  // Check single permission
  if (permission && !rbac.hasPermission(permission)) {
    return hideOnDenied ? null : <>{fallback}</>;
  }

  // Check multiple permissions (all required)
  if (permissions && permissions.length > 0 && !rbac.hasAllPermissions(permissions)) {
    return hideOnDenied ? null : <>{fallback}</>;
  }

  // Check any permission (at least one required)
  if (anyPermission && anyPermission.length > 0 && !rbac.hasAnyPermission(anyPermission)) {
    return hideOnDenied ? null : <>{fallback}</>;
  }

  // All checks passed, render children
  return <>{children}</>;
}
