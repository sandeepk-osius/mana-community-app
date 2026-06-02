import { apiClient } from "./apiClient";
import { sportsMetaService } from "./sportsMetaService";
import { playerCategoryService } from "./playerCategoryService";
import { sportsEventService } from "./sportsEventService";
import type {
  SportMeta,
  PlayerCategory,
  SportsEvent,
  SportsEventRequest,
  RegistrationRequest,
  EventRegistration,
  SportsTournamentRequest,
  TournamentRegistration,
  SportsTournament,
} from "../types/api";

export const sportsService = {
  // Sports Meta Service
  getSportsMeta: sportsMetaService.getSportsMeta,
  createSport: sportsMetaService.createSport,
  updateSport: sportsMetaService.updateSport,
  deleteSport: sportsMetaService.deleteSport,

  // Player Category Service
  getCategories: playerCategoryService.getCategories,
  createCategory: playerCategoryService.createCategory,
  updateCategory: playerCategoryService.updateCategory,
  deleteCategory: playerCategoryService.deleteCategory,

  // Sports Event / Tournaments Service
  mapEvent: sportsEventService.mapEvent,
  getOpenTournaments: sportsEventService.getOpenTournaments,
  getOpenEvents: sportsEventService.getOpenEvents,
  getAllOpenTournaments: sportsEventService.getAllOpenTournaments,
  getAllOpenEvents: sportsEventService.getAllOpenEvents,
  getMyTournaments: sportsEventService.getMyTournaments,
  getMyEvents: sportsEventService.getMyEvents,

  /** GET /api/tournaments/all — list of all tournaments (from tournament table via TournamentController) */
  async getAllTournaments(): Promise<SportsTournament[]> {
    return apiClient.get<SportsTournament[]>("/tournaments/all");
  },
  /** GET /api/sports/events/all — list of all events (from sports_event table via SportsController) */
  async getAllEvents(): Promise<SportsEvent[]> {
    return apiClient.get<SportsEvent[]>("/sports/events/all")
      .then(res => res.map(x => sportsEventService.mapEvent(x)));
  },

  /** GET /api/tournaments/community?communityId= — all tournaments for a community (via TournamentController) */
  async getCommunityTournaments(communityId: number): Promise<SportsTournament[]> {
    return apiClient.get<SportsTournament[]>(`/tournaments/community?communityId=${communityId}`);
  },
  /** GET /api/sports/events/community?communityId= — all events for a specific community (via SportsController) */
  async getCommunityEvents(communityId: number): Promise<SportsEvent[]> {
    return apiClient.get<SportsEvent[]>(`/sports/events/community?communityId=${communityId}`)
      .then(res => res.map(x => sportsEventService.mapEvent(x)));
  },

  getTournamentById: sportsEventService.getTournamentById,
  getEventById: sportsEventService.getEventById,
  getTournamentMap: sportsEventService.getTournamentMap,
  getEventMap: sportsEventService.getEventMap,
  getConfirmedCount: sportsEventService.getConfirmedCount,
  updateCommittee: sportsEventService.updateCommittee,
  createTournament: sportsEventService.createTournament,
  createEvent: sportsEventService.createEvent,
  createSportsEvent: sportsEventService.createSportsEvent,
  updateTournament: sportsEventService.updateTournament,
  updateEvent: sportsEventService.updateEvent,
  updateSportsEvent: sportsEventService.updateSportsEvent,
  deleteTournament: sportsEventService.deleteTournament,
  deleteEvent: sportsEventService.deleteEvent,
  updateTournamentStatus: sportsEventService.updateTournamentStatus,
  updateEventStatus: sportsEventService.updateEventStatus,
  getClosedTournaments: sportsEventService.getClosedTournaments,
  getClosedEvents: sportsEventService.getClosedEvents,
  registerForTournament: sportsEventService.registerForTournament,
  registerForEvent: sportsEventService.registerForEvent,
  withdraw: sportsEventService.withdraw,
  getTournamentRegistrations: sportsEventService.getTournamentRegistrations,
  getEventRegistrations: sportsEventService.getEventRegistrations,
  getMyRegistrations: sportsEventService.getMyRegistrations,
  confirmRegistration: sportsEventService.confirmRegistration,
  nominateCaptain: sportsEventService.nominateCaptain,
  confirmCaptain: sportsEventService.confirmCaptain,
};
