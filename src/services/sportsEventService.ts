import { apiClient } from "./apiClient";
import type {
  SportsEvent,
  SportsEventRequest,
  RegistrationRequest,
  EventRegistration,
  SportsTournamentRequest,
  TournamentRegistration,
} from "../types/api";

export const sportsEventService = {
  mapEvent(e: SportsEvent): SportsEvent {
    if (e) {
      e.status = e.registrationStatus || e.tournament?.registrationStatus;
    }
    return e;
  },

  /** GET /api/sports/tournaments/open?communityId= — tournaments available for registration */
  async getOpenTournaments(communityId: number): Promise<SportsEvent[]> {
    return apiClient.get<SportsEvent[]>(`/sports/tournaments/open?communityId=${communityId}`)
      .then(res => res.map(x => this.mapEvent(x)));
  },
  async getOpenEvents(communityId: number): Promise<SportsEvent[]> {
    return this.getOpenTournaments(communityId);
  },

  /** GET /api/sports/tournaments/open-all — all REGISTRATION_OPEN tournaments (any community) */
  async getAllOpenTournaments(): Promise<SportsEvent[]> {
    return apiClient.get<SportsEvent[]>("/sports/tournaments/open-all")
      .then(res => res.map(x => this.mapEvent(x)));
  },
  async getAllOpenEvents(): Promise<SportsEvent[]> {
    return this.getAllOpenTournaments();
  },

  /** GET /api/sports/tournaments/mine — tournaments created by the authenticated user */
  async getMyTournaments(): Promise<SportsEvent[]> {
    return apiClient.get<SportsEvent[]>("/sports/tournaments/mine")
      .then(res => res.map(x => this.mapEvent(x)));
  },
  async getMyEvents(): Promise<SportsEvent[]> {
    return this.getMyTournaments();
  },

  /** GET /api/sports/events/all — list of all events (from sports_event table via SportsController) */
  async getAllEvents(): Promise<SportsEvent[]> {
    return apiClient.get<SportsEvent[]>("/sports/events/all")
      .then(res => res.map(x => this.mapEvent(x)));
  },

  /** GET /api/sports/events/community?communityId= — all events for a specific community (via SportsController) */
  async getCommunityEvents(communityId: number): Promise<SportsEvent[]> {
    return apiClient.get<SportsEvent[]>(`/sports/events/community?communityId=${communityId}`)
      .then(res => res.map(x => this.mapEvent(x)));
  },

  /** GET /api/sports/tournaments/{id} — get sports tournament details */
  async getTournamentById(id: number): Promise<SportsEvent> {
    return apiClient.get<SportsEvent>(`/sports/tournaments/${id}`)
      .then(x => this.mapEvent(x));
  },
  async getEventById(id: number): Promise<SportsEvent> {
    return this.getTournamentById(id);
  },

  /** GET /api/sports/tournament-list-map — lightweight list of tournament ID and Name */
  async getTournamentMap(communityId?: number): Promise<Array<{ id: number, name: string }>> {
    const url = communityId ? `/sports/tournament-list-map?communityId=${communityId}` : "/sports/tournament-list-map";
    return apiClient.get<Array<{ id: number, name: string }>>(url);
  },
  async getEventMap(communityId?: number): Promise<Array<{ id: number, name: string }>> {
    return this.getTournamentMap(communityId);
  },

  /** GET /api/sports/tournaments/{eventId}/confirmed-count — count of confirmed players */
  async getConfirmedCount(eventId: number): Promise<number> {
    return apiClient.get<number>(`/sports/tournaments/${eventId}/confirmed-count`);
  },

  /** PUT /api/sports/tournaments/{eventId}/committee — update committee member IDs */
  async updateCommittee(eventId: number, committeeIds: number[]): Promise<any> {
    return apiClient.put(`/sports/tournaments/${eventId}/committee`, committeeIds);
  },

  /** POST /api/tournaments — create a new sports tournament (saves Tournament record) */
  async createTournament(data: SportsTournamentRequest): Promise<SportsEvent> {
    return apiClient.post<SportsEvent>("/tournaments", data)
      .then(x => this.mapEvent(x));
  },
  async createEvent(data: SportsEventRequest): Promise<SportsEvent> {
    return this.createTournament(data);
  },

  /** POST /api/sports/events — create a sports event only (no Tournament record) */
  async createSportsEvent(data: SportsEventRequest): Promise<SportsEvent> {
    return apiClient.post<SportsEvent>("/sports/events", data)
      .then(x => this.mapEvent(x));
  },

  /** PUT /api/sports/tournaments/{id} — update tournament details (updates Tournament record) */
  async updateTournament(id: number, data: SportsTournamentRequest): Promise<SportsEvent> {
    return apiClient.put<SportsEvent>(`/sports/tournaments/${id}`, data)
      .then(x => this.mapEvent(x));
  },
  async updateEvent(id: number, data: SportsEventRequest): Promise<SportsEvent> {
    return this.updateTournament(id, data);
  },

  /** PUT /api/sports/events/{id} — update sports event only (no Tournament record update) */
  async updateSportsEvent(id: number, data: SportsEventRequest): Promise<SportsEvent> {
    return apiClient.put<SportsEvent>(`/sports/events/${id}`, data)
      .then(x => this.mapEvent(x));
  },

  /** DELETE /api/sports/tournaments/{id} — delete a tournament */
  async deleteTournament(id: number): Promise<void> {
    return apiClient.delete<void>(`/sports/tournaments/${id}`);
  },
  async deleteEvent(id: number): Promise<void> {
    return this.deleteTournament(id);
  },

  /** PUT /api/tournaments/{id}/status — update tournament status */
  async updateTournamentStatus(id: number, status: string): Promise<any> {
    return apiClient.put<any>(`/tournaments/${id}/status?status=${status}`);
  },
  async updateEventStatus(id: number, status: string): Promise<SportsEvent> {
    return apiClient.put<SportsEvent>(`/sports/events/${id}/status?status=${status}`)
      .then(x => this.mapEvent(x));
  },

  /** GET /api/sports/tournaments/closed — all REGISTRATION_CLOSED tournaments */
  async getClosedTournaments(): Promise<SportsEvent[]> {
    return apiClient.get<SportsEvent[]>("/sports/tournaments/closed")
      .then(res => res.map(x => this.mapEvent(x)));
  },
  async getClosedEvents(): Promise<SportsEvent[]> {
    return this.getClosedTournaments();
  },

  /** POST /api/sports/register — register authenticated user for a tournament */
  async registerForTournament(data: RegistrationRequest): Promise<TournamentRegistration> {
    return apiClient.post<TournamentRegistration>("/sports/register", data);
  },
  async registerForEvent(data: RegistrationRequest): Promise<EventRegistration> {
    return this.registerForTournament(data);
  },

  /** DELETE /api/sports/register/{registrationId} — withdraw from a tournament */
  async withdraw(registrationId: number): Promise<void> {
    return apiClient.delete<void>(`/sports/register/${registrationId}`);
  },

  /** GET /api/sports/tournaments/{eventId}/registrations — list all registrations for a tournament */
  async getTournamentRegistrations(eventId: number): Promise<TournamentRegistration[]> {
    return apiClient.get<TournamentRegistration[]>(`/sports/tournaments/${eventId}/registrations`);
  },
  async getEventRegistrations(eventId: number): Promise<EventRegistration[]> {
    return this.getTournamentRegistrations(eventId);
  },

  /** GET /api/sports/registrations/mine — list all registrations for the current user */
  async getMyRegistrations(): Promise<EventRegistration[]> {
    return apiClient.get<EventRegistration[]>("/sports/registrations/mine");
  },

  /** PUT /api/sports/registrations/{id}/confirm — confirm a registration */
  async confirmRegistration(registrationId: number): Promise<EventRegistration> {
    return apiClient.put<EventRegistration>(`/sports/registrations/${registrationId}/confirm`);
  },

  /** PUT /api/sports/registrations/{id}/nominate — nominate as captain */
  async nominateCaptain(registrationId: number, nominate: boolean, teamName?: string): Promise<EventRegistration> {
    let url = `/sports/registrations/${registrationId}/nominate?nominate=${nominate}`;
    if (teamName) url += `&teamName=${encodeURIComponent(teamName)}`;
    return apiClient.put<EventRegistration>(url);
  },

  /** PUT /api/sports/registrations/{id}/confirm-captain — confirm captaincy */
  async confirmCaptain(registrationId: number, confirm: boolean): Promise<EventRegistration> {
    return apiClient.put<EventRegistration>(`/sports/registrations/${registrationId}/confirm-captain?confirm=${confirm}`);
  },
};
