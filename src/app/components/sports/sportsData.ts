// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeType = "orange" | "green" | "blue" | "purple";
export type EventStatus = "LIVE" | "UPCOMING" | "COMPLETED" | "SCHEDULED";

export interface StatItem {
  id: number;
  value: number;
  label: string;
  badge: string;
  badgeType: BadgeType;
  color: string;
}

export interface UpcomingEvent {
  id: number;
  name: string;
  subtitle: string;
  venue: string;
  category: string;
  status: EventStatus;
  statusText: string;
  statusSub: string;
  dotColor: string;
  dotPulse?: boolean;
  timeColor: string;
  wonColor?: string;
}

export interface OpenRegistration {
  id: number;
  name: string;
  date: string;
  category: string;
  spots: string;
  progress: number;
  progressColor: string;
  dotColor: string;
  action: "Register" | "View" | "Withdraw" | "Confirmed" | string;
  status: "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | string;
  registrationId?: number;
  auctionStatus?: string;
  isTeamSport?: boolean;
}

export interface Notification {
  id: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  text: string;
  bold: string;
  textAfter: string;
  time: string;
}

export interface NextMatch {
  title: string;
  subtitle: string;
  initialHours: number;
  initialMinutes: number;
  initialSeconds: number;
}

// ─── Static mock / seed data ─────────────────────────────────────────────────

export const SPORTS_DATA = {
  user: { name: "Rahul K.", initials: "RK", verified: true },

  stats: [
    { id: 1, value: 3,  label: "Active Registrations", badge: "2 upcoming",   badgeType: "orange" as BadgeType, color: "#f97316" },
    { id: 2, value: 1,  label: "Live Events",           badge: "● Live now",   badgeType: "green"  as BadgeType, color: "#10b981" },
    { id: 3, value: 12, label: "Community Players",      badge: "+3 this week", badgeType: "blue"   as BadgeType, color: "#3b82f6" },
    { id: 4, value: 8,  label: "Wins This Season",       badge: "Top 10%",     badgeType: "purple" as BadgeType, color: "#8b5cf6" },
  ] as StatItem[],

  upcomingEvents: [
    { id: 1, name: "Box Cricket",        subtitle: "Sector 12 vs 14", venue: "Sector 12 Ground",     category: "Mens Category",   status: "LIVE"      as EventStatus, statusText: "LIVE",          statusSub: "Overs 8/10",  dotColor: "#10b981", dotPulse: true,  timeColor: "#10b981" },
    { id: 2, name: "Badminton Doubles",  subtitle: "Round 2",         venue: "Community Hall Court", category: "Mixed Doubles",   status: "UPCOMING"  as EventStatus, statusText: "Tomorrow 7AM",  statusSub: "Notified ✓",  dotColor: "#f97316",                  timeColor: "#f97316" },
    { id: 3, name: "Football 5s",        subtitle: "Group Stage",      venue: "Block D Ground",       category: "Mens Category",   status: "UPCOMING"  as EventStatus, statusText: "Sat 6PM",       statusSub: "2 days left", dotColor: "#f97316",                  timeColor: "#f97316" },
    { id: 4, name: "Table Tennis Singles", subtitle: "",               venue: "Indoor Club",          category: "Senior Category", status: "COMPLETED" as EventStatus, statusText: "Completed",     statusSub: "Won ✓",       dotColor: "#475569",                  timeColor: "#64748b", wonColor: "#10b981" },
  ] as UpcomingEvent[],

  openRegistrations: [
    { id: 1, name: "Volleyball Tournament", date: "Apr 26", category: "Girls & Womens",                    spots: "8 spots left",  progress: 70, progressColor: "#3b82f6", dotColor: "#3b82f6", action: "Register" as const },
    { id: 2, name: "Kids Badminton",        date: "Apr 27", category: "Under 14",                           spots: "15 spots left", progress: 40, progressColor: "#8b5cf6", dotColor: "#8b5cf6", action: "Register" as const },
    { id: 3, name: "Cricket Player Auction",date: "Apr 25", category: "IPL-style · 4 teams · 40 players",  spots: "",              progress: 90, progressColor: "#f97316", dotColor: "#f97316", action: "View"     as const },
  ] as OpenRegistration[],

  notifications: [
    { id: 1, icon: "🏏", iconBg: "rgba(16,185,129,0.15)",  iconColor: "#10b981", text: "Your cricket match starts in",        bold: "45 minutes", textAfter: ". Ground: Sector 12 · Pitch B",    time: "Just now"  },
    { id: 2, icon: "🔨", iconBg: "rgba(249,115,22,0.15)",  iconColor: "#f97316", text: "Auction for Cricket season starts in", bold: "2 days",      textAfter: ". Your base price: ₹200",          time: "2h ago"    },
    { id: 3, icon: "🏸", iconBg: "rgba(59,130,246,0.15)",  iconColor: "#3b82f6", text: "Badminton partner",                   bold: "Priya S.",    textAfter: " accepted doubles pairing",        time: "Yesterday" },
    { id: 4, icon: "🏆", iconBg: "rgba(139,92,246,0.15)", iconColor: "#8b5cf6", text: "Tournament bracket released for",      bold: "Football 5s", textAfter: ". You're in Group B",              time: "2 days ago"},
  ] as Notification[],

  nextMatch: {
    title: "Badminton Doubles · Round 2",
    subtitle: "Court 2 · Community Hall · vs Team Falcons",
    initialHours: 17,
    initialMinutes: 49,
    initialSeconds: 56,
  } as NextMatch,
};
