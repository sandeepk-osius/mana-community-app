import { apiClient } from "./apiClient";
import type { UserResponse, RolePermissionsMap, RoleResponse } from "../types/api";

export const userService = {
  /** GET /api/users/search?communityId={id}&query={q} */
  async searchUsers(communityId: number, query: string): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>(`/users/search?communityId=${communityId}&query=${query}`);
  },

  /** GET /api/users/community/{id} */
  async getCommunityUsers(communityId: number): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>(`/users/community/${communityId}`);
  },

  /** GET /api/users */
  async getAllUsers(): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>("/users");
  },

  /** PUT /api/users/{id}/status */
  async toggleUserStatus(userId: number): Promise<void> {
    return apiClient.put<void>(`/users/${userId}/status`, {});
  },

  /** PUT /api/users/{id}/role */
  async updateUserRole(userId: number, role: string): Promise<void> {
    return apiClient.put<void>(`/users/${userId}/role`, { role });
  },

  /** GET /api/roles/permissions */
  async getRolePermissions(): Promise<RolePermissionsMap> {
    return apiClient.get<RolePermissionsMap>("/roles/permissions");
  },

  /** PUT /api/roles/{role}/permissions */
  async updateRolePermissions(role: string, permissions: string[], userId?: number): Promise<void> {
    const url = userId ? `/roles/${role}/permissions?userId=${userId}` : `/roles/${role}/permissions`;
    return apiClient.put<void>(url, permissions);
  },

  /** GET /api/roles */
  async getRoles(): Promise<RoleResponse[]> {
    return apiClient.get<RoleResponse[]>("/roles");
  },

  /** POST /api/roles */
  async createRole(name: string): Promise<RoleResponse> {
    return apiClient.post<RoleResponse>("/roles", { name });
  },

  /** GET /api/users/me */
  async getMe(): Promise<UserResponse> {
    return apiClient.get<UserResponse>("/users/me");
  }
};
