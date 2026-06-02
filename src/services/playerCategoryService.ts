import { apiClient } from "./apiClient";
import type { PlayerCategory } from "../types/api";

export const playerCategoryService = {
  /** GET /api/sports/categories — all player categories */
  async getCategories(): Promise<PlayerCategory[]> {
    return apiClient.get<PlayerCategory[]>("/sports/categories");
  },

  async createCategory(category: Omit<PlayerCategory, "id">): Promise<PlayerCategory> {
    return apiClient.post<PlayerCategory>("/sports/categories", category);
  },

  async updateCategory(id: number, category: Omit<PlayerCategory, "id">): Promise<PlayerCategory> {
    return apiClient.put<PlayerCategory>(`/sports/categories/${id}`, category);
  },

  async deleteCategory(id: number): Promise<void> {
    return apiClient.delete(`/sports/categories/${id}`);
  },
};
