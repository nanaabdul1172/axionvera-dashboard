/**
 * @module components/guards
 *
 * Public API for guard components.
 * Re-exports all guards and HOCs for route and permission protection.
 */

export { PermissionGuard } from "./PermissionGuard";
export {
  RouteGuard,
  withRouteGuard,
  AccessDenied,
} from "./RouteGuard";
