// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  inviteCode: string;
  password: string;
  dateOfBirth: string; // yyyy-MM-dd
  gender: string; // MALE | FEMALE | OTHER
  aadharNumber?: string;
  flatNo?: string;
  block?: string;
}

export interface AuthResponse {
  userId: string;
  message: string;
  token: string;
  fullName?: string;
  email?: string;
  role?: string;
  communityId?: number;
  dateOfBirth?: string;
}

export type GovtIdType = "AADHAAR" | "VOTER_ID" | "DRIVING_LICENCE";

export interface KycRequest {
  govtIdType: GovtIdType;
  govtIdNumber: string;
  docType: string;
  s3Key: string;
  s3KeyBack?: string;
  addressOnDocument?: string;
  dobOnDocument?: string;
  nameOnDocument?: string;
  consentGiven: boolean;
}

// ─── Sports ──────────────────────────────────────────────────────────────────

export interface SportMeta {
  id: number;
  name: string;
  iconUrl?: string;
  icon?: string;
  communityId?: number;
  community?: CommunityResponse;
  active: boolean;
  minAge?: number;
  maxAge?: number;
  minPlayers?: number;
  maxPlayers?: number;
  gender?: string;
  playersBorn?: string;
  formats?: MatchFormat[];
  tournamentType?: string;
}

export interface PlayerCategory {
  id: number;
  name: string;
  categoryType: string;       // MENS, WOMENS, BOYS, GIRLS, KIDS, SENIORS
  description?: string;
  minAge: number;
  maxAge: number;
  gender: string;          // MALE, FEMALE, ALL
  type?: string;           // DEFAULT, USER, VENDOR
  communityId?: number;
}

export interface CommunityResponse {
  id: number;
  name: string;
  code?: string;
  type: string;
  inviteCode?: string;
  city?: string;
  state?: string;
  area?: string;
  subtype?: string;
}

export interface Community extends CommunityResponse { }

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  kycStatus: string;
  community?: Community;
}

export type EventStatus =
  | "DRAFT"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED";

export type MatchFormat = "SINGLES" | "DOUBLES" | "MIXED_DOUBLES" | "TEAM";
export type TournamentType = "KNOCKOUT" | "ROUND_ROBIN" | "LEAGUE" | "KNOCKOUT_SINGLE" | "KNOCKOUT_DOUBLE" | "GROUP_PLAYOFF" | "CUSTOM";

export interface Court {
  id?: string;
  name: string;
  color: string;
}

export interface Venue {
  id: number;
  name: string;
  address?: string;
  city?: string;
  area?: string;
  mapLink?: string;
  capacity?: number;
  venueType?: string;
  venueCategory?: string;
  openingTime?: string;
  closingTime?: string;
  courts?: Court[];
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  pinCode?: string;
  communityId?: number;
  communityName?: string;
}

export interface Sponsor {
  id?: number;
  category: string;
  name: string;
  url?: string;
}

export interface SportsEvent {
  id: number;
  name: string;
  sport?: SportMeta;
  community?: Community;
  eventDateStart: string; // LocalDate → string
  eventDateEnd: string;
  venue?: Venue;
  maxParticipants?: number;
  registrationStatus?: EventStatus;
  tournament?: any;
  format?: MatchFormat;
  tournamentType?: TournamentType;
  categories?: PlayerCategory[];
  sponsors?: Sponsor[];
  createdBy?: AppUser;
  createdAt?: string;
  updatedAt?: string;
  auctionStatus?: string;
  contactNumber?: string;
  contactEmail?: string;
  otherContacts?: { title: string; name: string; detail: string; }[];
  bannerImage?: string;
  tournamentLevel?: "Standard" | "Professional" | "Premium";
  description?: string;
  allowAdminChat?: boolean;
  startTime?: string;
  dueTime?: string;
  minPlayers?: number;
  maxPlayers?: number;
  gender?: string;
  playersBorn?: string;
  disputeCommitteeIds?: string;
  status?: string;
}

export interface SportsEventRequest {
  name: string;
  sportId: number;
  communityId: number;
  eventDateStart: string;
  eventDateEnd: string;
  venueId?: number;
  maxParticipants?: number;
  format?: string;
  tournamentType?: string;
  categoryIds?: number[];
  contactNumber?: string;
  contactEmail?: string;
  otherContacts?: { title: string; name: string; detail: string; }[];
  bannerImage?: string;
  tournamentLevel?: "Standard" | "Professional" | "Premium";
  description?: string;
  allowAdminChat?: boolean;
  startTime?: string;
  dueTime?: string;
  minPlayers?: number;
  maxPlayers?: number;
  gender?: string;
  playersBorn?: string;
  sponsors?: Sponsor[];
  minAge?: number;
  maxAge?: number;
  notifications?: NotificationScheduleRequest[];
  eventId?: number;
  sportsEventIds?: number[];
}

export interface NotificationScheduleRequest {
  id?: string;
  label?: string;
  offset: number;
  enabled: boolean;
  title: string;
  body: string;
  recipients?: string[];
  overrideChannels?: string[];
  priority?: string;
  isCustom?: boolean;
}

export interface RegistrationRequest {
  eventId: number;
  categoryId: number;
  matchType: string;
  role?: string;
  age?: number;
  matches?: number;
  runs?: number;
  wickets?: number;
  strikeRate?: number;
  avgScore?: number;
  partnerUserId?: number;
  playerName?: string;
  relation?: string;
  flatNumber?: string;
}

export interface EventRegistration {
  id: number;
  event?: SportsEvent;
  user?: AppUser;
  category?: PlayerCategory;
  status: "PENDING" | "REGISTERED" | "CONFIRMED" | "WITHDRAWN";
  playerName?: string;
  relation?: string;
  flatNumber?: string;
  age?: number;
  role?: string;
  captainNomination?: boolean;
  captainConfirmation?: boolean;
  proposedTeamName?: string;
  registeredAt?: string;
}

export interface SportsTournament {
  id: number;
  name: string;
  event?: SportsEvent;
  format?: string;
  tournamentType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SportsTournamentRequest = SportsEventRequest;
export type TournamentRegistration = EventRegistration;
export type SportsEventRegistration = EventRegistration;

// ─── Auction ─────────────────────────────────────────────────────────────────

export type PlayerStatus = "UNSOLD" | "SOLD" | "RETAINED" | "QUEUE" | "active" | "next" | "queue" | "SELLING" | "PASSED" | "QUEUED";

export interface AuctionPlayer {
  id: number;
  name: string; // mapped from playerName
  initials?: string;
  role?: string; // mapped from playerRole
  category?: string;
  age?: number;
  basePrice?: number;
  statsJson?: string;
  matches?: number;
  runs?: number;
  avgScore?: number;
  wickets?: number;
  strikeRate?: number;
  economy?: number;
  status: PlayerStatus;
  assignedTeam?: AuctionTeam;
  soldPrice?: number;
  queueOrder?: number;
}

export interface AuctionTeam {
  id: number;
  teamName: string;
  name?: string;
  ownerName?: string;
  ownerUser?: AppUser;
  captainUser?: AppUser;
  colorHex?: string;
  color?: string;
  emoji?: string;
  totalBudget: number;
  budget: number;
  remainingBudget: number;
  spent: number;
  captainNomination: boolean;
  captainConfirmation: boolean;
  eventId: number;
  configId?: number;
  players?: Array<{ name: string; soldPrice: number; category?: string }>;
}

export interface BidRequest {
  configId: number;
  playerId: number;
  teamId: number;
  bidAmount: number;
  isRtm?: boolean;
}

export interface AuctionBid {
  id: number;
  amount: number; // mapped from bidAmount
  player?: AuctionPlayer;
  team?: AuctionTeam;
  createdAt?: string; // mapped from bidAt
}

export interface AuctionTeamSummary {
  teamId: number;
  teamName: string;
  playerCount: number;
  totalSpent: number;
  remainingBudget: number;
}

export interface PlayerWithBidResponse {
  playerId: number;
  playerName: string;
  category: string;
  playerRole: string;
  age: number;
  basePrice: number;
  statsJson: string;
  currentBid: number;
  nextBid: number;
  nextIncrement: number;
  currentBidTeamName: string;
  queueOrder: number;
  status: string;
}

export interface AuctionStatsResponse {
  totalPlayers: number;
  soldPlayers: number;
  queuedPlayers: number;
  totalTeams: number;
  totalBudget: number;
  totalSpent: number;
}

export interface SoldPlayerRequest {
  playerId: number;
  teamId: number;
}

export interface AuctionPlayerRequest {
  playerName: string;
  category: string;
  playerRole?: string;
  age?: number;
  basePrice: number;
  matches?: number;
  runs?: number;
  wickets?: number;
  strikeRate?: number;
  economy?: number;
  avgScore?: number;
}

export interface AuctionTeamRequest {
  configId: number;
  teamName: string;
  ownerName: string;
  ownerUserId?: number;
  colorHex?: string;
  totalBudget: number;
}

export interface AuctionConfigRequest {
  sportId: number;
  eventId?: number;
  seasonName: string;
  auctionFormat: string;
  totalTeams: number;
  totalPlayers: number;
  budgetPerTeam: number;
  basePrice: number;
  bidIncrementDefault: number;
  bidIncrementThreshold: number;
  bidIncrementAbove: number;
  bidTimerSeconds: number;
  rtmEnabled?: boolean;
  unsoldRule?: string;
  categories?: string[];
  committeeMembers?: string[];
}

export interface AuctionConfigResponse {
  id: number;
  sportId?: number;
  communityId?: number;
  eventId?: number;
  eventName?: string;
  sportName: string;
  seasonName: string;
  auctionFormat: string;
  totalTeams: number;
  totalPlayers: number;
  budgetPerTeam: number;
  basePrice: number;
  bidIncrementDefault: number;
  bidIncrementThreshold: number;
  bidIncrementAbove: number;
  bidTimerSeconds: number;
  rtmEnabled: boolean;
  unsoldRule: string;
  status: string;
  categories: string[];
  committeeMembers: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  kycStatus: string;
  profilePicUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  flatNo?: string;
  block?: string;
  communityId?: number;
  isActive?: boolean;
  permissions?: string[];
}

export type RolePermissionsMap = Record<string, string[]>;

export interface RoleResponse {
  id: number;
  name: string;
  permissions?: Array<{
    id: number;
    role: string;
    permissionKey: string;
  }>;
}

export interface SportFormEvent {
  id: string;
  eventName: string;
  startDate: string;
  endDate: string;
  gender: string;
  playersBorn: string;
  format: string;
  formats: string[];
  minPlayers: string;
  maxPlayers: string;
  minAge: string;
  maxAge: string;
  tournamentType: string;
  venueId?: string | number;
}

export interface SportFormEntry {
  id: string;
  name: string;
  icon: string;
  iconUrl?: string;
  sportId: number;
  editingSportId: number | null;
  events: SportFormEvent[];
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface RegistrationOpenNotificationRequest {
  sendEmail: boolean;
  sendPush: boolean;
  sendSms: boolean;
  message?: string;
}
