@echo off
echo Creating RBAC Implementation Commits...
echo.

echo ========================================
echo Commit 1: Core RBAC Types and Utilities
echo ========================================
git add src/types/rbac.ts
git add src/permissions/rbac.ts
git add src/permissions/routes.ts
git add src/permissions/index.ts
git commit -m "feat: Add RBAC core types and utilities" -m "" -m "- Define user roles (GUEST, USER, POWER_USER, ADMIN, SUPER_ADMIN)" -m "- Define 23 granular permissions across features" -m "- Create role-permission mappings with inheritance" -m "- Implement pure permission checking functions" -m "- Add route access configuration" -m "- Enable role hierarchy with comparison utilities" -m "" -m "The implementation uses pure functions without React dependencies," -m "making the permission logic reusable across middleware, API routes," -m "and components."
echo.

echo ========================================
echo Commit 2: React Integration and Guards
echo ========================================
git add src/contexts/RBACContext.tsx
git add src/components/guards/PermissionGuard.tsx
git add src/components/guards/RouteGuard.tsx
git add src/components/guards/index.ts
git add src/components/RoleAwareNav.tsx
git add src/middleware.ts
git commit -m "feat: Add RBAC React integration and guards" -m "" -m "- Create RBACProvider with wallet integration" -m "- Add useRBAC, usePermission, usePermissions, useRole hooks" -m "- Implement PermissionGuard for component-level protection" -m "- Implement RouteGuard and withRouteGuard HOC for page protection" -m "- Add RoleAwareNav component for dynamic navigation" -m "- Update middleware to use RBAC route configuration" -m "- Enable automatic menu filtering based on user permissions" -m "" -m "Guards support fallback content, loading states, and flexible" -m "permission checking (single, multiple, any, role-based)."
echo.

echo ========================================
echo Commit 3: Documentation and Integration
echo ========================================
git add src/pages/_app.tsx
git add src/contexts/WalletContext.tsx
git add src/components/Navbar.tsx
git add docs/RBAC.md
git add RBAC_IMPLEMENTATION.md
git add COMMIT_GUIDE.md
git add commit-rbac.bat
git commit -m "docs: Add RBAC documentation and fix integration issues" -m "" -m "- Add RBACProvider to application component tree" -m "- Fix missing imports in WalletContext" -m "- Fix undefined activeWalletMeta in Navbar" -m "- Add comprehensive RBAC documentation (docs/RBAC.md)" -m "- Add implementation summary (RBAC_IMPLEMENTATION.md)" -m "- Document usage examples and migration path" -m "- Include security considerations for production" -m "- Add troubleshooting guide and testing recommendations" -m "" -m "The RBAC system is now fully integrated and documented." -m "Current implementation defaults users to USER role and is" -m "designed for easy backend integration in the future."
echo.

echo ========================================
echo All commits created successfully!
echo ========================================
echo.
echo Review the commits with: git log --oneline -3
echo Push with: git push origin HEAD
echo.
pause
