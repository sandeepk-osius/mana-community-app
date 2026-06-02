import { apiClient } from "./apiClient";

export interface TournamentTypeInfo {
  id: string;
  name: string;
  description: string;
  teamRange: string;
  formatNote: string;
}

export interface EventInfo {
  id: number;
  name: string;
  sportId: number;
  sportName: string;
  communityId: number;
  communityName: string;
  eventDateStart: string;
  eventDateEnd: string;
  status: string;
  totalTeams: number;
  venueName: string;
}

export interface ConfigInfo {
  id: number;
  tournamentName: string;
  tournamentType: string;
  eventName: string;
  eventId: number;
  totalTeams: number;
  startDate: string;
  endDate: string;
  status: string;
  numberOfGroups?: number;
  teamsAdvancingPerGroup?: number;
  swissRounds?: number;
  matchDurationMinutes?: number;
  breakBetweenMatchesMinutes?: number;
  venueName?: string;
  pointsForWin?: number;
  pointsForDraw?: number;
  pointsForLoss?: number;
  thirdPlaceMatch?: boolean;
  hasSeeding?: boolean;
}

export const tournamentService = {
  /** GET /api/tournament/types */
  async getTournamentTypes(): Promise<TournamentTypeInfo[]> {
    return apiClient.get<TournamentTypeInfo[]>("/tournament/types");
  },

  /** GET /api/tournament/events */
  async getEventsForDropdown(): Promise<EventInfo[]> {
    return apiClient.get<EventInfo[]>("/tournament/events");
  },

  /** GET /api/tournament/configs */
  async getConfigs(): Promise<ConfigInfo[]> {
    return apiClient.get<ConfigInfo[]>("/tournament/configs");
  },

  /** POST /api/tournament/config */
  async createConfig(data: any): Promise<ConfigInfo> {
    return apiClient.post<ConfigInfo>("/tournament/config", data);
  },

  /** PUT /api/tournament/config/{id} */
  async updateConfig(id: number, data: any): Promise<ConfigInfo> {
    return apiClient.put<ConfigInfo>(`/tournament/config/${id}`, data);
  },

  /** POST /api/tournament/{configId}/manual/groups/assign */
  async assignTeamsToGroups(configId: number, assignments: { teamId: string, groupId: string }[]): Promise<string> {
    return apiClient.post<string>(`/tournament/${configId}/manual/groups/assign`, assignments);
  },

  /** POST /api/tournament/{configId}/manual/matches */
  async scheduleManualMatch(configId: number, matchData: { homeTeamId: string, awayTeamId: string, matchType: string, stage: string, startTime: string }): Promise<string> {
    return apiClient.post<string>(`/tournament/${configId}/manual/matches`, matchData);
  }
};
