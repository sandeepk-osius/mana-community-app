import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { MapPin, Filter, ChevronRight, ShieldAlert, Volleyball, Goal, Loader2, AlertTriangle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FaDribbble } from "react-icons/fa";
import { sportsService } from "../../../services/sportsService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportsEvent, SportMeta } from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_SPORT_ICONS: Record<string, React.ElementType> = {
  Basketball: FaDribbble,
  Soccer: Goal,
  Volleyball: Volleyball,
};

const SPORT_COLORS: Record<string, string> = {
  Basketball: "bg-orange-100 text-orange-700 border-orange-200",
  Soccer: "bg-green-100 text-green-700 border-green-200",
  Volleyball: "bg-blue-100 text-blue-700 border-blue-200",
};

function DefaultSportIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export function Scheduler() {
  const { user } = useAuth();
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [sportsMeta, setSportsMeta] = useState<SportMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [meta, eventsData] = await Promise.all([
          sportsService.getSportsMeta(),
          user?.communityId
            ? sportsService.getOpenEvents(user.communityId)
            : sportsService.getMyEvents(),
        ]);
        setSportsMeta(meta);
        setEvents(eventsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sports data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.communityId]);

  const sportFilters = useMemo(() => {
    const names = sportsMeta.map((s) => s.name);
    return ["All", ...names];
  }, [sportsMeta]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "All") return events;
    return events.filter((e) => e.sport?.name === activeFilter);
  }, [events, activeFilter]);

  const getSportIcon = (sportName?: string): React.ElementType => {
    if (!sportName) return DefaultSportIcon;
    return DEFAULT_SPORT_ICONS[sportName] ?? DefaultSportIcon;
  };

  const getSportColor = (sportName?: string): string => {
    if (!sportName) return "bg-slate-100 text-slate-700 border-slate-200";
    return SPORT_COLORS[sportName] ?? "bg-indigo-100 text-indigo-700 border-indigo-200";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE": return { label: "LIVE", cls: "bg-red-100 text-red-700 animate-pulse" };
      case "REGISTRATION_OPEN": return { label: "OPEN", cls: "bg-green-100 text-green-700" };
      case "COMPLETED": return { label: "FINAL", cls: "bg-slate-200 text-slate-600" };
      case "CANCELLED": return { label: "CANCELLED", cls: "bg-red-50 text-red-600" };
      default: return { label: status, cls: "bg-slate-100 text-slate-600" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sports Events</h1>
          <p className="text-slate-500 mt-1">View upcoming events and register your team.</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Filter className="h-4 w-4 text-slate-400 mr-1 hidden sm:block" />
          {loading
            ? null
            : sportFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeFilter === filter
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {filter}
              </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
              <p className="text-slate-500">Loading events...</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Failed to load events</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-sm text-red-700 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 p-3 rounded-full mb-4">
                <ShieldAlert className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No events found</h3>
              <p className="text-slate-500 max-w-sm mt-1">
                {activeFilter === "All"
                  ? "No open events in your community right now. Check back later!"
                  : `No ${activeFilter} events available. Try a different filter.`}
              </p>
            </div>
          )}

          {!loading && !error && filteredEvents.map((event) => {
            const Icon = getSportIcon(event.sport?.name);
            const badge = getStatusBadge(event.status || "DRAFT");
            const parsedDate = event.eventDateStart ? parseISO(event.eventDateStart) : null;

            return (
              <div
                key={event.id}
                className={cn(
                  "bg-white border rounded-xl overflow-hidden transition-shadow hover:shadow-md",
                  event.status === "LIVE" ? "border-red-200 shadow-sm" : "border-slate-200"
                )}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className={cn(
                    "p-4 sm:w-48 flex sm:flex-col justify-between sm:justify-center items-center sm:border-r border-b sm:border-b-0",
                    event.status === "LIVE" ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
                  )}>
                    <div className="text-center">
                      {parsedDate ? (
                        <>
                          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            {format(parsedDate, "MMM d")}
                          </div>
                          <div className="text-xl font-bold text-slate-900 mt-1">
                            {format(parsedDate, "yyyy")}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-400">TBD</div>
                      )}
                    </div>
                    <div className={cn("mt-2 px-2.5 py-1 rounded-full text-xs font-bold", badge.cls)}>
                      {badge.label}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", getSportColor(event.sport?.name))}>
                        <Icon className="w-3 h-3 mr-1" />
                        {event.sport?.name ?? "Sport"}
                      </span>
                      {event.venue && (
                        <div className="flex items-center text-sm text-slate-500">
                          <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                          {event.venue.name}
                        </div>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 mb-1">{event.name}</h4>
                    {event.maxParticipants && (
                      <p className="text-sm text-slate-500 mb-2">
                        Max participants: {event.maxParticipants}
                      </p>
                    )}

                    <div className="ml-6 pl-6 border-l border-slate-100 hidden sm:flex items-center justify-end mt-2">
                      <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-emerald-500" />
              Season Highlights
            </h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Total Events</span>
                <span className="font-semibold text-slate-900">{events.length}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Active Sports</span>
                <span className="font-semibold text-slate-900">{sportsMeta.length}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Open for Registration</span>
                <span className="font-semibold text-slate-900">
                  {events.filter((e) => e.status === "REGISTRATION_OPEN").length}
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
            <h3 className="font-bold text-emerald-900 mb-2">Want to join the league?</h3>
            <p className="text-emerald-700 text-sm mb-4">Registration for the current season is open for all sports.</p>
            <a href="/sports/register" className="inline-block w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
              Register a Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Trophy(props: { className?: string }) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 6 6 8 6 8s6-2 6-8V2Z" />
    </svg>
  );
}
