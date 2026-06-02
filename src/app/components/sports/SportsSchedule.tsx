import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { sportsService } from "../../../services/sportsService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportsEvent } from "../../../types/api";

import { TournamentScheduler } from "../scheduler/TournamentScheduler";
import { SetupSchedule } from "../scheduler/SetupSchedule";
import { ManualScheduler } from "../scheduler/ManualScheduler";

const TABS = ["My Matches", "All Events", "Brackets", "Config", "Setup", "Manual"] as const;
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

function BracketView() {
  return (
    <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
      <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-4">Cricket Tournament Bracket</div>
      <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
        {/* QF */}
        <div className="flex-1 min-w-[120px]">
          <div className="text-[10px] text-[#94a3b8] text-center mb-2 tracking-widest uppercase">Quarter Finals</div>
          {[["Sector 12", "45", true], ["Sector 9", "32", false], ["Block A", "51", true], ["Block F", "38", false]].map(([name, score, won]) => (
            <div key={String(name)} className={`px-3 py-2 rounded-lg text-xs mb-2 flex justify-between ${won ? "border border-[#2a3a5c] bg-[#1a2540]" : "border border-[#1e293b] bg-[#0c1220]"}`}>
              <span className={won ? "text-[#f1f5f9]" : "text-[#475569]"}>{name}</span>
              <span className={won ? "text-[#10b981]" : "text-[#475569]"}>{score}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center text-[#475569] text-xl">›</div>
        {/* SF */}
        <div className="flex-1 min-w-[120px]">
          <div className="text-[10px] text-[#94a3b8] text-center mb-2 tracking-widest uppercase">Semi Finals</div>
          <div className="px-3 py-2 rounded-lg text-xs mb-2 border border-[#10b981] bg-green-500/10 text-[#10b981]">Sector 12 ● LIVE</div>
          <div className="mt-10 px-3 py-2 rounded-lg text-xs border border-[#2a3a5c] bg-[#1a2540] text-[#f1f5f9]">Block A</div>
        </div>
        <div className="flex items-center text-[#475569] text-xl">›</div>
        {/* Final */}
        <div className="flex-1 min-w-[120px]">
          <div className="text-[10px] text-[#94a3b8] text-center mb-2 tracking-widest uppercase">Final</div>
          <div className="px-3 py-4 rounded-xl border-2 border-dashed border-[#f97316] bg-orange-500/10 text-center">
            <div className="text-lg mb-1">🏆</div>
            <div className="text-xs font-medium text-[#f97316]">Final</div>
            <div className="text-[10px] text-[#94a3b8] mt-1">Apr 28</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SportsSchedule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("My Matches");
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
            status: e.registrationStatus,
            statusColor: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316",
            badges: [
              { label: e.registrationStatus, color: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316" },
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
      <div>
        <h1 className="text-2xl font-semibold text-[#f1f5f9]">Match Schedule</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Upcoming and completed matches</p>
      </div>

      {/* Tab bar */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-1.5 flex gap-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer border-none transition-all ${activeTab === tab
                ? "bg-[#1a2540] text-[#f97316] border border-[#2a3a5c]"
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
      {activeTab === "Brackets" && <BracketView />}

      {/* Config */}
      {activeTab === "Config" && <TournamentScheduler />}

      {/* Setup Schedule */}
      {activeTab === "Setup" && <SetupSchedule />}

      {/* Manual Scheduler */}
      {activeTab === "Manual" && <ManualScheduler />}
    </div>
  );
}
