import { apiClient } from "./apiClient";
import type {
  AuctionPlayer,
  AuctionTeam,
  AuctionBid,
  BidRequest,
  PlayerWithBidResponse,
  SoldPlayerRequest,
} from "../types/api";

export const auctionService = {
  /** GET /api/auction/live/{configId}/current-player */
  async getCurrentPlayer(configId: number): Promise<PlayerWithBidResponse> {
    return apiClient.get<PlayerWithBidResponse>(`/auction/live/${configId}/current-player`);
  },

  /** GET /api/auction/live/{configId}/players — all players in an auction */
  async getPlayers(configId: number): Promise<AuctionPlayer[]> {
    return apiClient.get<AuctionPlayer[]>(`/auction/live/${configId}/players`);
  },

  /** GET /api/auction/teams/{configId} — team summaries with budgets */
  async getTeamsSummary(configId: number): Promise<AuctionTeam[]> {
    return apiClient.get<AuctionTeam[]>(`/auction/teams/${configId}`);
  },

  /** POST /api/auction/live/bid — place a bid on the current player */
  async placeBid(data: BidRequest): Promise<AuctionBid> {
    return apiClient.post<AuctionBid>("/auction/live/bid", data);
  },

  /** POST /api/auction/live/sold — mark a player as sold to a team */
  async soldPlayer(playerId: number, teamId: number): Promise<AuctionPlayer> {
    const data: SoldPlayerRequest = { playerId, teamId };
    return apiClient.post<AuctionPlayer>("/auction/live/sold", data);
  },

  /** POST /api/auction/config/{configId}/players/upload — upload CSV/Excel of players */
  async uploadPlayers(configId: number, file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    return apiClient.postForm<string>(`/auction/config/${configId}/players/upload`, form);
  },

  /** POST /api/auction/config/{configId}/players — create a single player */
  async createPlayer(configId: number, data: import("../types/api").AuctionPlayerRequest): Promise<AuctionPlayer> {
    return apiClient.post<AuctionPlayer>(`/auction/config/${configId}/players`, data);
  },

  /** POST /api/auction/teams — create a new team */
  async createTeam(data: import("../types/api").AuctionTeamRequest): Promise<AuctionTeam> {
    return apiClient.post<AuctionTeam>("/auction/teams", data);
  },

  /** GET /api/auction/live/{configId}/random-player — pick random QUEUED player */
  async getRandomPlayer(configId: number): Promise<PlayerWithBidResponse> {
    return apiClient.get<PlayerWithBidResponse>(`/auction/live/${configId}/random-player`);
  },

  /** POST /api/auction/live/{playerId}/pass — pass current player */
  async passPlayer(playerId: number): Promise<AuctionPlayer> {
    return apiClient.post<AuctionPlayer>(`/auction/live/${playerId}/pass`);
  },

  /** PUT /api/auction/config/{configId} — update an auction config */
  async updateConfig(configId: number, data: import("../types/api").AuctionConfigRequest): Promise<any> {
    return apiClient.put(`/auction/config/${configId}`, data);
  },

  /** POST /api/auction/config — create a new auction config */
  async createConfig(data: import("../types/api").AuctionConfigRequest): Promise<any> {
    return apiClient.post("/auction/config", data);
  },

  /** GET /api/auction/config/all — get all auction configs for user's community across all sports */
  async getAllCommunityConfigs(): Promise<import("../types/api").AuctionConfigResponse[]> {
    return apiClient.get<import("../types/api").AuctionConfigResponse[]>("/auction/config/all");
  },

  /** GET /api/auction/config?sportId={sportId} — get all auction configs for a sport */
  async getConfigs(sportId: number): Promise<import("../types/api").AuctionConfigResponse[]> {
    return apiClient.get<import("../types/api").AuctionConfigResponse[]>(`/auction/config?sportId=${sportId}`);
  },

  /** GET /api/auction/config/{configId} — get an auction config */
  async getConfig(configId: number): Promise<import("../types/api").AuctionConfigResponse> {
    return apiClient.get<import("../types/api").AuctionConfigResponse>(`/auction/config/${configId}`);
  },

  /** PUT /api/auction/config/{configId}/status — update status */
  async updateStatus(configId: number, status: string): Promise<any> {
    return apiClient.put(`/auction/config/${configId}/status?status=${status}`);
  },

  /** GET /api/auction/config/check?sportId={sportId} — check if config exists for user's community */
  async checkConfigExists(sportId: number): Promise<{ configExists: boolean; configCount: number; communityId: number }> {
    return apiClient.get(`/auction/config/check?sportId=${sportId}`);
  },

  /** GET /api/auction/config/{configId}/stats — get auction stats */
  async getAuctionStats(configId: number): Promise<import("../types/api").AuctionStatsResponse> {
    return apiClient.get<import("../types/api").AuctionStatsResponse>(`/auction/config/${configId}/stats`);
  },

  /** GET /api/auction/config/{configId}/registration-count — get confirmed registration count */
  async getRegistrationCount(configId: number): Promise<number> {
    return apiClient.get<number>(`/auction/config/${configId}/registration-count`);
  },

  /** GET /api/auction/teams/nominated/{eventId} — get nominated captains */
  async getNominatedCaptains(eventId: number): Promise<AuctionTeam[]> {
    return apiClient.get<AuctionTeam[]>(`/auction/teams/nominated/${eventId}`);
  },

  /** PUT /api/auction/teams/{teamId}/confirm-captain — confirm captain by team ID */
  async confirmCaptainByTeamId(teamId: number, confirm: boolean): Promise<AuctionTeam> {
    return apiClient.put<AuctionTeam>(`/auction/teams/${teamId}/confirm-captain?confirm=${confirm}`);
  },

  /** POST /api/auction/teams/nominate — nominate captain */
  async nominateCaptain(eventId: number, nominate: boolean, teamName?: string): Promise<AuctionTeam> {
    let url = `/auction/teams/nominate?eventId=${eventId}&nominate=${nominate}`;
    if (teamName) url += `&teamName=${encodeURIComponent(teamName)}`;
    return apiClient.post<AuctionTeam>(url, {});
  },

  /** GET /api/auction/teams/captain/mine — get my captain nominations */
  async getCaptainRegistration(): Promise<AuctionTeam[]> {
    return apiClient.get<AuctionTeam[]>("/auction/teams/captain/mine");
  },


};
