import { apiClient } from "./apiClient";
import type { Venue } from "../types/api";

export const venueService = {
  async getVenues(communityId?: number | null): Promise<Venue[]> {
    const url = communityId ? `/venues?communityId=${communityId}` : "/venues";
    return apiClient.get<Venue[]>(url);
  },

  async getVenueById(id: number): Promise<Venue> {
    return apiClient.get<Venue>(`/venues/${id}`);
  },

  async createVenue(communityId: number | null | undefined, venue: Omit<Venue, "id">): Promise<Venue> {
    const path = (venue.venueType === "OUTSIDE" || !communityId) 
      ? "/venues" 
      : `/venues?communityId=${communityId}`;
    return apiClient.post<Venue>(path, venue);
  },

  async updateVenue(id: number, venue: Omit<Venue, "id">): Promise<Venue> {
    return apiClient.put<Venue>(`/venues/${id}`, venue);
  },

  async deleteVenue(id: number): Promise<void> {
    return apiClient.delete(`/venues/${id}`);
  },
};
