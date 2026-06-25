# RBAC Implementation - Commit Guide

This guide provides the exact commands to commit the RBAC implementation in 3 separate logical commits as requested.

## Prerequisites

Before committing, ensure:
1. All files have been created/modified as indicated
2. No TypeScript errors exist (run `npm run typecheck`)
3. You've reviewed the changes

## Commit 1: Core RBAC Types and Utilities

This commit adds the foundational types and pure functions for permission checking.

```bash
git add src/types/rbac.ts
git add src/permissions/rbac.ts
git add src/permissions/routes.ts
git add src/permissions/index.ts
git commit -m "feat: Add RBAC core types and utilities

- Define user roles (GUEST, USER, POWER_USER, ADMIN, SUPER_ADMIN)
- Define 23 granular permissions across features
- Create role-permission mappings with inheritance
- Implement pure permission checking functions
- Add route access configuration
- Enable role hierarchy with comparison utilities

The implementation uses pure functions without React dependencies,
making the permission logic reusable across middleware, API routes,
and components."
```

## Commit 2: React Integration and Guard Components

This commit adds React context, hooks, and component guards for UI protection.

```bash
git add src/contexts/RBACContext.tsx
git add src/components/guards/PermissionGuard.tsx
git add src/components/guards/RouteGuard.tsx
git add src/components/guards/index.ts
git add src/components/RoleAwareNav.tsx
git add src/middleware.ts
git commit -m "feat: Add RBAC React integration and guards

- Create RBACProvider with wallet integration
- Add useRBAC, usePermission, usePermissions, useRole hooks
- Implement PermissionGuard for component-level protection
- Implement RouteGuard and withRouteGuard HOC for page protection
- Add RoleAwareNav component for dynamic navigation
- Update middleware to use RBAC route configuration
- Enable automatic menu filtering based on user permissions

Guards support fallback content, loading states, and flexible
permission checking (single, multiple, any, role-based)."
```

## Commit 3: Documentation and Integration

This commit adds comprehensive documentation and integrates RBAC into the application.

```bash
git add src/pages/_app.tsx
git add src/contexts/WalletContext.tsx
git add src/components/Navbar.tsx
git add docs/RBAC.md
git add RBAC_IMPLEMENTATION.md
git add COMMIT_GUIDE.md
git commit -m "docs: Add RBAC documentation and fix integration issues

- Add RBACProvider to application component tree
- Fix missing imports in WalletContext
- Fix undefined activeWalletMeta in Navbar
- Add comprehensive RBAC documentation (docs/RBAC.md)
- Add implementation summary (RBAC_IMPLEMENTATION.md)
- Document usage examples and migration path
- Include security considerations for production
- Add troubleshooting guide and testing recommendations

The RBAC system is now fully integrated and documented.
Current implementation defaults users to USER role and is
designed for easy backend integration in the future."
```

## Verification

After all commits, verify everything is working:

```bash
# Check that all changes are committed
git status

# Verify TypeScript compilation
npm run typecheck

# Run linting
npm run lint

# Review the commit history
git log --oneline -3
```

## Push to Remote

```bash
# Push to your feature branch
git push origin feat/rbac-implementation

# Or create a new branch if needed
git checkout -b feat/rbac-implementation
git push -u origin feat/rbac-implementation
```

## Creating the Pull Request

When creating the PR, use this template:

### Title
```
feat: Implement Role-Based Access Control (RBAC) System
```

### Description
```markdown
## 🎯 Overview
Implements a comprehensive RBAC system for the AxionVera dashboard with role hierarchy, granular permissions, and component/route guards.

## 📋 Changes
- ✅ 5 user roles with clear hierarchy (GUEST → USER → POWER_USER → ADMIN → SUPER_ADMIN)
- ✅ 23 granular permissions for features and operations
- ✅ React context and hooks for permission checking
- ✅ Component guards (PermissionGuard) and route guards (RouteGuard)
- ✅ Role-aware navigation with automatic filtering
- ✅ Middleware integration for auth checks
- ✅ Comprehensive documentation

## 🔒 Security
- Client-side enforcement for UI/UX (development)
- Designed for backend integration (production)
- See `docs/RBAC.md` for security considerations

## 📚 Documentation
- [Complete RBAC Documentation](./docs/RBAC.md)
- [Implementation Summary](./RBAC_IMPLEMENTATION.md)

## ✅ Testing
- [x] Type checking passes
- [x] No breaking changes
- [x] Existing functionality preserved
- [ ] Unit tests (to be added)
- [ ] Integration tests (to be added)

## 🔄 Migration
No breaking changes. Existing pages work without modification. 
Optional: Wrap pages with guards for protection.

## 👀 Review Focus
1. Type safety and permission logic
2. Component API usability
3. Documentation clarity
4. Security considerations

Closes #XXX (if applicable)
```

## Files Changed

Total files: 16

### Created (13 files):
1. `src/types/rbac.ts`
2. `src/permissions/rbac.ts`
3. `src/permissions/routes.ts`
4. `src/permissions/index.ts`
5. `src/contexts/RBACContext.tsx`
6. `src/components/guards/PermissionGuard.tsx`
7. `src/components/guards/RouteGuard.tsx`
8. `src/components/guards/index.ts`
9. `src/components/RoleAwareNav.tsx`
10. `docs/RBAC.md`
11. `RBAC_IMPLEMENTATION.md`
12. `COMMIT_GUIDE.md` (this file)

### Modified (3 files):
1. `src/middleware.ts`
2. `src/pages/_app.tsx`
3. `src/contexts/WalletContext.tsx`
4. `src/components/Navbar.tsx`

## Lines of Code

Approximate additions:
- Types: ~200 lines
- Utilities: ~350 lines
- React Components: ~500 lines
- Documentation: ~800 lines
- **Total: ~1,850 lines**

## Next Steps After Merge

1. **Phase 2**: Update existing pages to use guards
2. **Phase 3**: Backend integration for role storage
3. **Phase 4**: Admin UI for role management
4. **Phase 5**: Unit and integration tests

---

**Questions?** See `RBAC_IMPLEMENTATION.md` for detailed Q&A section.
