import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { sportsService } from "../../../services/sportsService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportsEvent } from "../../../types/api";

import { TournamentScheduler } from "../scheduler/TournamentScheduler";
import { SetupSchedule } from "../scheduler/SetupSchedule";
import { ManualScheduler } from "../scheduler/ManualScheduler";

const TABS = ["My Matches", "All Events", "Brackets", "Config", "Setup Schedule", "Manual"] as const;
type Tab = typeof TABS[number];

// ─── Timeline item ────────────────────────────────────────────────────────────

interface ScheduleEntry {
  date: string;
  name: string;
  venue: string;
  status: string;
  statusColor: string;
  badges: { label: string; color: string }[];
}



function TimelineItem({ item, isLast }: { item: ScheduleEntry; isLast: boolean }) {
  return (
    <div className="relative flex gap-4 pb-5">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: item.statusColor, boxShadow: `0 0 6px ${item.statusColor}` }} />
        {!isLast && <div className="w-px flex-1 bg-[#2a3a5c] mt-1" />}
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="text-xs text-[#94a3b8] mb-1">{item.date}</div>
        <div className="text-sm font-medium text-[#f1f5f9] mb-1">{item.name}</div>
        <div className="text-xs text-[#94a3b8] mb-2">{item.venue}</div>
        <div className="flex flex-wrap gap-2">
          {item.badges.map(b => (
            <span key={b.label} className="text-[10px] px-2 py-0.5 rounded" style={{ background: `${b.color}22`, color: b.color }}>{b.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bracket view ─────────────────────────────────────────────────────────────

type BracketPlayer = { id?: number; initials: string; fullName: string; flatNumber?: string; isTBD?: boolean };
type BracketMatch = {
  id: string; label: string; date: string; time: string;
  p1: BracketPlayer | null; p2: BracketPlayer | null;
  venue: { initials: string; name: string };
  isBye?: boolean;
};
type BracketRound = { name: string; matches: BracketMatch[] };

function getPlayerInitials(fullName: string): string {
  return fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function MatchCard({ match }: { match: BracketMatch }) {
  const players = [match.p1, match.p2].filter(Boolean) as BracketPlayer[];
  const isByeMatch = match.isBye || players.length === 1;

  return (
    <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl overflow-hidden">
      <div className="px-3 py-2.5 bg-[#1a2540] border-b border-[#2a3a5c]">
        <div className="text-xs font-semibold text-[#f1f5f9]">{match.label}</div>
        <div className="text-[10px] text-[#94a3b8] mt-0.5">{match.date} | {match.time}</div>
        {isByeMatch && <div className="text-[9px] text-[#10b981] font-semibold mt-1">BYE</div>}
      </div>
      <div className="px-3 py-3 space-y-2.5">
        {players.map((p, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              {p.isTBD ? (
                <div className="w-7 h-7 rounded-full border border-dashed border-[#475569] shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#2a3a5c] flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-[#94a3b8]">{p.initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-xs truncate ${p.isTBD ? "text-[#475569] italic" : "text-[#f1f5f9]"}`}>
                  {p.fullName}
                </div>
                {p.flatNumber && !p.isTBD && (
                  <div className="text-[9px] text-[#64748b]">{p.flatNumber}</div>
                )}
              </div>
            </div>
            {i === 0 && !isByeMatch && players.length > 1 && (
              <div className="border-b border-[#2a3a5c] my-2" />
            )}
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-[#2a3a5c] flex items-center gap-1.5">
        <div className="w-5 h-5 rounded bg-[#1a2540] flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-[#64748b]">{match.venue.initials}</span>
        </div>
        <span className="text-[10px] text-[#64748b] truncate">{match.venue.name}</span>
      </div>
    </div>
  );
}

function BracketView({ eventId }: { eventId?: string }) {
  const [rounds, setRounds] = useState<BracketRound[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchAndGenerateBracket = async () => {
      setLoading(true);
      try {
        const registrations = await sportsService.getEventRegistrations(Number(eventId));
        const confirmed = registrations.filter(r => r.status === 'CONFIRMED');

        if (confirmed.length === 0) {
          setRounds([]);
          return;
        }

        const players = confirmed
          .filter(r => r.user)
          .map(r => ({
            id: r.user!.id,
            initials: getPlayerInitials(r.user!.fullName),
            fullName: r.user!.fullName,
            flatNumber: r.flatNumber || undefined,
          }));

        const generatedRounds = generateKnockoutBracket(players);
        setRounds(generatedRounds);
      } catch (err) {
        console.error('Failed to load bracket:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGenerateBracket();
  }, [eventId]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#f97316] animate-spin" /></div>;
  }

  if (rounds.length === 0) {
    return (
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-6 text-center">
        <p className="text-sm text-[#94a3b8]">No confirmed players yet. Bracket will be generated once players are confirmed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rounds.map(round => (
        <div key={round.name}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-bold text-[#f97316] uppercase tracking-wider">{round.name}</span>
            <div className="flex-1 h-px bg-[#2a3a5c]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {round.matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-bold text-[#f97316] uppercase tracking-wider">Results</span>
          <div className="flex-1 h-px bg-[#2a3a5c]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Winner", icon: "🏆", name: "Winner Of Final" },
            { label: "Runner-up", icon: "🥈", name: "Loser Of Final" },
          ].map(r => (
            <div key={r.label} className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{r.icon}</span>
              <div>
                <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">{r.label}</div>
                <div className="text-sm text-[#475569] italic mt-0.5">{r.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function generateKnockoutBracket(players: BracketPlayer[]): BracketRound[] {
  const rounds: BracketRound[] = [];
  let currentRound = players;
  let roundNum = 1;

  while (currentRound.length > 1) {
    const roundName = roundNum === 1 ? 'Round 1'
      : roundNum === 2 ? 'Round 2'
      : roundNum === 3 ? 'Semi-Finals'
      : 'Finals';

    const matches: BracketMatch[] = [];
    let matchNum = 1;

    for (let i = 0; i < currentRound.length; i += 2) {
      const p1 = currentRound[i];
      const p2 = currentRound[i + 1] || null;
      const isByeMatch = !p2;

      matches.push({
        id: `M${roundNum}-${matchNum}`,
        label: roundName === 'Finals' ? 'Final'
          : roundName === 'Semi-Finals' ? `Semi-Final ${matchNum}`
          : `Match ${matchNum}`,
        date: '—',
        time: '—',
        p1,
        p2: p2 || { initials: '', fullName: '', isTBD: true },
        venue: { initials: 'TBD', name: 'TBD' },
        isBye: isByeMatch,
      });
      matchNum++;
    }

    rounds.push({ name: roundName, matches });

    currentRound = Array.from({ length: Math.ceil(currentRound.length / 2) }, (_, i) => ({
      initials: 'W',
      fullName: `Match ${i + 1} (Winner)`,
      isTBD: true,
    }));

    roundNum++;
  }

  return rounds;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SportsSchedule() {
  const { eventId } = useParams<{ eventId?: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(eventId ? "Setup Schedule" : "My Matches");
  const [allEvents, setAllEvents] = useState<SportsEvent[]>([]);
  const [myMatches, setMyMatches] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);

    if (activeTab === "My Matches") {
      sportsService.getMyEvents()
        .then(events => {
          setMyMatches(events.map(e => ({
            date: e.eventDateStart,
            name: `${e.sport?.name ?? "Event"} — ${e.name}`,
            venue: e.venue?.name ?? "TBD",
            status: e.registrationStatus ?? "",
            statusColor: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316",
            badges: [
              { label: e.registrationStatus ?? "", color: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316" },
              { label: e.categories?.[0]?.name ?? "General", color: "#3b82f6" }
            ]
          })));
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else if (activeTab === "All Events" && user?.communityId) {
      sportsService.getOpenEvents(user.communityId)
        .then(setAllEvents)
        .catch(() => { })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeTab, user?.communityId, user?.userId]);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-1.5 flex gap-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer border-none transition-all ${activeTab === tab
                ? tab === "Setup Schedule"
                  ? "bg-[#102a71] text-[#FFFDFC] border border-[#2a3a5c]"
                  : "bg-[#1a2540] text-[#f97316] border border-[#2a3a5c]"
                : "bg-transparent text-[#94a3b8] hover:text-[#f1f5f9]"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* My Matches */}
      {activeTab === "My Matches" && (
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
          <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-4">My Match Timeline</div>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-[#f97316] animate-spin" /></div>
          ) : myMatches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#475569]">No matches found in your schedule.</p>
            </div>
          ) : (
            myMatches.map((item, i) => (
              <TimelineItem key={i} item={item} isLast={i === myMatches.length - 1} />
            ))
          )}
        </div>
      )}

      {/* All Events */}
      {activeTab === "All Events" && (
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
          <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-3">Community Events</div>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-[#f97316] animate-spin" /></div>
          ) : allEvents.length === 0 ? (
            <p className="text-sm text-[#475569] text-center py-6">No open events in your community right now.</p>
          ) : (
            allEvents.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 p-3 bg-[#1a2540] rounded-lg mb-2 border border-[#2a3a5c]">
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#f1f5f9]">{ev.name}</div>
                  <div className="text-xs text-[#94a3b8] mt-0.5">{ev.venue?.name ?? "—"} · {ev.sport?.name ?? "Sport"}</div>
                  <div className="text-xs text-[#64748b] mt-1">{ev.eventDateStart}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-[#f97316]">{ev.registrationStatus}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Brackets */}
      {activeTab === "Brackets" && <BracketView eventId={eventId} />}

      {/* Config */}
      {activeTab === "Config" && <TournamentScheduler />}

      {/* Setup Schedule */}
      {activeTab === "Setup Schedule" && <SetupSchedule initialEventId={eventId} />}

      {/* Manual Scheduler */}
      {activeTab === "Manual" && <ManualScheduler />}
    </div>
  );
}
