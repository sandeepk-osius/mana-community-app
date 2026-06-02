import { apiClient } from "./apiClient";
import type { SportMeta } from "../types/api";

export const sportsMetaService = {
  /** GET /api/sports/meta — list of all active sports */
  async getSportsMeta(): Promise<SportMeta[]> {
    return apiClient.get<SportMeta[]>("/sports/meta");
  },

  async createSport(sport: Omit<SportMeta, "id">): Promise<SportMeta> {
    return apiClient.post<SportMeta>("/sports/meta", sport);
  },

  async updateSport(id: number, sport: Omit<SportMeta, "id">): Promise<SportMeta> {
    return apiClient.put<SportMeta>(`/sports/meta/${id}`, sport);
  },

  async deleteSport(id: number): Promise<void> {
    return apiClient.delete(`/sports/meta/${id}`);
  },
};
