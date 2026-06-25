/**
 * @module types/rbac
 *
 * Type definitions for Role-Based Access Control (RBAC) system.
 *
 * Role Hierarchy:
 * - GUEST: Unauthenticated users (view-only access)
 * - USER: Standard authenticated users (basic operations)
 * - POWER_USER: Advanced users (analytics, advanced features)
 * - ADMIN: Administrators (governance, monitoring, all features)
 * - SUPER_ADMIN: Super administrators (full platform control)
 */

/**
 * User roles in ascending order of privileges.
 */
export enum UserRole {
  GUEST = "guest",
  USER = "user",
  POWER_USER = "power_user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

/**
 * Granular permissions for specific actions and features.
 */
export enum Permission {
  // ── Wallet & Balance ────────────────────────────────────────────────────
  VIEW_BALANCE = "view_balance",
  MANAGE_WALLET = "manage_wallet",
  
  // ── Vault Operations ────────────────────────────────────────────────────
  VIEW_VAULT = "view_vault",
  DEPOSIT_VAULT = "deposit_vault",
  WITHDRAW_VAULT = "withdraw_vault",
  STAKE_VAULT = "stake_vault",
  
  // ── Analytics ───────────────────────────────────────────────────────────
  VIEW_ANALYTICS = "view_analytics",
  VIEW_ADVANCED_ANALYTICS = "view_advanced_analytics",
  EXPORT_ANALYTICS = "export_analytics",
  
  // ── Governance ──────────────────────────────────────────────────────────
  VIEW_PROPOSALS = "view_proposals",
  VOTE_PROPOSALS = "vote_proposals",
  CREATE_PROPOSALS = "create_proposals",
  MANAGE_PROPOSALS = "manage_proposals",
  
  // ── Monitoring & System ─────────────────────────────────────────────────
  VIEW_MONITORING = "view_monitoring",
  MANAGE_MONITORING = "manage_monitoring",
  VIEW_SYSTEM_LOGS = "view_system_logs",
  
  // ── User Management ─────────────────────────────────────────────────────
  VIEW_PROFILE = "view_profile",
  EDIT_PROFILE = "edit_profile",
  MANAGE_SECURITY = "manage_security",
  MANAGE_USERS = "manage_users",
  
  // ── Administrative ──────────────────────────────────────────────────────
  ACCESS_ADMIN_PANEL = "access_admin_panel",
  MANAGE_ROLES = "manage_roles",
  SYSTEM_CONFIGURATION = "system_configuration",
}

/**
 * Mapping of roles to their associated permissions.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    Permission.VIEW_VAULT,
    Permission.VIEW_PROPOSALS,
  ],
  
  [UserRole.USER]: [
    // Inherit GUEST permissions
    Permission.VIEW_VAULT,
    Permission.VIEW_PROPOSALS,
    // Additional USER permissions
    Permission.VIEW_BALANCE,
    Permission.MANAGE_WALLET,
    Permission.DEPOSIT_VAULT,
    Permission.WITHDRAW_VAULT,
    Permission.STAKE_VAULT,
    Permission.VOTE_PROPOSALS,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.MANAGE_SECURITY,
  ],
  
  [UserRole.POWER_USER]: [
    // Inherit USER permissions
    Permission.VIEW_VAULT,
    Permission.VIEW_PROPOSALS,
    Permission.VIEW_BALANCE,
    Permission.MANAGE_WALLET,
    Permission.DEPOSIT_VAULT,
    Permission.WITHDRAW_VAULT,
    Permission.STAKE_VAULT,
    Permission.VOTE_PROPOSALS,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.MANAGE_SECURITY,
    // Additional POWER_USER permissions
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ADVANCED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.CREATE_PROPOSALS,
  ],
  
  [UserRole.ADMIN]: [
    // Inherit POWER_USER permissions
    Permission.VIEW_VAULT,
    Permission.VIEW_PROPOSALS,
    Permission.VIEW_BALANCE,
    Permission.MANAGE_WALLET,
    Permission.DEPOSIT_VAULT,
    Permission.WITHDRAW_VAULT,
    Permission.STAKE_VAULT,
    Permission.VOTE_PROPOSALS,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.MANAGE_SECURITY,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ADVANCED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.CREATE_PROPOSALS,
    // Additional ADMIN permissions
    Permission.MANAGE_PROPOSALS,
    Permission.VIEW_MONITORING,
    Permission.MANAGE_MONITORING,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.ACCESS_ADMIN_PANEL,
    Permission.MANAGE_USERS,
  ],
  
  [UserRole.SUPER_ADMIN]: [
    // SUPER_ADMIN has all permissions
    ...Object.values(Permission),
  ],
};

/**
 * Route access configuration.
 */
export interface RouteAccess {
  /** Path pattern (e.g., "/dashboard", "/governance/*") */
  path: string;
  /** Minimum role required to access this route */
  minRole: UserRole;
  /** Specific permissions required (optional, in addition to role) */
  permissions?: Permission[];
  /** Whether to allow guests (overrides minRole) */
  allowGuest?: boolean;
}

/**
 * User with role information.
 */
export interface UserWithRole {
  /** Wallet address (user identifier) */
  address: string;
  /** Assigned role */
  role: UserRole;
  /** Custom permissions (optional override/additions) */
  customPermissions?: Permission[];
}

/**
 * Permission check result.
 */
export interface PermissionCheckResult {
  /** Whether access is granted */
  granted: boolean;
  /** Reason for denial (if not granted) */
  reason?: string;
  /** Missing permissions (if applicable) */
  missingPermissions?: Permission[];
}
