import { AuthUser, AuthUserPermissions, UserRole } from '../types';

export const SUPER_ADMIN_EMAIL = 'victorlaraujo@gmail.com';

/**
 * Checks if the given email matches the privileged Super-Admin email address.
 * Case-insensitive comparison with trimming.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Dynamically resolves the UserRole based on email verification.
 * If the email is victorlaraujo@gmail.com, it is irrevocably assigned 'super-admin'.
 */
export function resolveUserRole(email?: string | null, fallbackRole: UserRole = 'nutritionist'): UserRole {
  if (isSuperAdminEmail(email)) {
    return 'super-admin';
  }
  return fallbackRole;
}

/**
 * Resolves full permissions set based on email and role verification.
 * 'super-admin' (victorlaraujo@gmail.com) receives full database and destructive privileges.
 */
export function getUserPermissions(email?: string | null, role?: UserRole): AuthUserPermissions {
  const isSuper = isSuperAdminEmail(email) || role === 'super-admin';
  const isAdmin = isSuper || role === 'admin';

  return {
    canDeleteAllDatabase: isSuper,
    canDeleteAllNutritionists: isSuper,
    canDeleteAllPatients: isSuper,
    canManageClinic: isAdmin,
    canAccessBilling: isAdmin || isSuper,
  };
}

/**
 * Validates whether the user has permission to delete the entire database.
 * Strictly restricted to victorlaraujo@gmail.com / 'super-admin'.
 */
export function canDeleteAllDatabase(email?: string | null, role?: UserRole): boolean {
  return isSuperAdminEmail(email) || role === 'super-admin';
}

/**
 * Validates whether the user has permission to delete all nutritionists.
 */
export function canDeleteAllNutritionists(email?: string | null, role?: UserRole): boolean {
  return isSuperAdminEmail(email) || role === 'super-admin';
}

/**
 * Validates whether the user has permission to delete all patients.
 */
export function canDeleteAllPatients(email?: string | null, role?: UserRole): boolean {
  return isSuperAdminEmail(email) || role === 'super-admin';
}

/**
 * Builds an AuthUser object with verified role and permissions.
 */
export function buildAuthUser(
  email: string,
  displayName?: string,
  photoURL?: string,
  requestedRole?: UserRole
): AuthUser {
  const isSuper = isSuperAdminEmail(email);
  const role: UserRole = isSuper ? 'super-admin' : (requestedRole || 'nutritionist');

  return {
    uid: isSuper ? 'usr-super-admin-victor' : `usr-${Date.now()}`,
    email,
    displayName: displayName || (isSuper ? 'Victor L. Araújo (Super-Admin)' : email.split('@')[0]),
    photoURL: photoURL || (isSuper
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      : undefined),
    role,
    isSuperAdmin: isSuper,
    permissions: getUserPermissions(email, role),
  };
}
