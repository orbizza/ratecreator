export { AuthProvider } from "./clerk-provider";
export {
  getCurrentUserRoles,
  hasRole,
  isAdmin,
  canAccessWeb,
  canAccessContent,
  getRolesFromClerkPayload,
  updateUserRoles,
  type UserRole,
  type UserRoleMetadata,
} from "./roles";
