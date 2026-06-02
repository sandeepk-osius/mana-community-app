import { useState, useEffect } from "react";
import { CheckCircle, Loader2, Trophy, Users, Calendar, MapPin, Settings, ShieldCheck, Trash2, Building2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { sportsService } from "../../../services/sportsService";
import { auctionService } from "../../../services/auctionService";
import { communityService } from "../../../services/communityService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportMeta, PlayerCategory, EventRegistration, AuctionTeam, CommunityResponse } from "../../../types/api";

const ALL_SPORTS = [
  { id: "cricket",     icon: "🏏", name: "Cricket" },
  { id: "badminton",   icon: "🏸", name: "Badminton" },
  { id: "football",    icon: "⚽", name: "Football" },
  { id: "tennis",      icon: "🎾", name: "Tennis" },
  { id: "volleyball",  icon: "🏐", name: "Volleyball" },
  { id: "tabletennis", icon: "🏓", name: "Table Tennis" },
  { id: "basketball",  icon: "🏀", name: "Basketball" },
  { id: "chess",       icon: "♟️", name: "Chess" },
];

const MATCH_TYPES: Record<string, string[]> = {
  cricket:     ["Singles / XI", "Doubles"],
  badminton:   ["Singles", "Doubles", "Mixed Doubles"],
  football:    ["Team (5-a-side)", "Team (11-a-side)"],
  tennis:      ["Singles", "Doubles", "Mixed Doubles"],
  volleyball:  ["Team", "Beach (2v2)"],
  tabletennis: ["Singles", "Doubles"],
  basketball:  ["3v3", "5v5"],
  chess:       ["Singles", "Blitz"],
};

const TABS = [
  { id: "tournaments", label: "My Tournaments", icon: Trophy },
  { id: "community",   label: "My Community",   icon: Building2 },
  { id: "teams",       label: "My Teams",       icon: Users },
  { id: "matches",     label: "My Matches",     icon: Calendar },
  { id: "settings",    label: "Sports Settings",icon: Settings },
] as const;

type TabId = typeof TABS[number]["id"];

function getCategory(age: number, gender: string): string {
  if (age < 12) return "Kids (Under 12)";
  if (age < 18) return gender === "Female" ? "Girls (12-18)" : "Boys (12-18)";
  if (age > 55) return "Senior Citizens (55+)";
  return gender === "Female" ? "Womens (18-55)" : "Mens (18-55)";
}

export function SportsRegistration() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("tournaments");

  // Registration form states
  const [apiSports, setApiSports] = useState<SportMeta[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({ cricket: true, badminton: true });
  const [matchTypes, setMatchTypes] = useState<Record<string, string>>({});
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState("Male");
  const [submitting, setSubmitting] = useState(false);

  // Dashboard states
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [teams, setTeams] = useState<AuctionTeam[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const fetchTabData = async () => {
    if (!user?.userId) return;
    setLoadingData(true);
    try {
      const [regs, myTeams, events, comms, sports] = await Promise.all([
        sportsService.getMyRegistrations().catch(() => []),
        auctionService.getCaptainRegistration().catch(() => []),
        sportsService.getMyEvents().catch(() => []),
        communityService.getCommunities().catch(() => []),
        sportsService.getSportsMeta().catch(() => [])
      ]);
      setRegistrations(regs || []);
      setTeams(myTeams || []);
      setMyMatches(events || []);
      setCommunities(comms || []);
      setApiSports(sports || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoadingData(false);
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [user?.userId]);

  const toggleSport = (id: string) =>
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const setMatchType = (sportId: string, type: string) =>
    setMatchTypes(prev => ({ ...prev, [sportId]: type }));

  const selectedSports = ALL_SPORTS.filter(s => selected[s.id]);
  const autoCategory = getCategory(parseInt(age) || 18, gender);

  const handleWithdraw = async (regId: number) => {
    if (!confirm("Are you sure you want to withdraw from this event?")) return;
    try {
      await sportsService.withdraw(regId);
      toast.success("Withdrawn successfully!");
      fetchTabData();
    } catch (err) {
      toast.error("Failed to withdraw from event");
    }
  };

  const handleSubmit = async () => {
    if (selectedSports.length === 0) { toast.error("Select at least one sport"); return; }
    if (!user?.communityId) { toast.error("Community not found. Please log in again."); return; }

    setSubmitting(true);
    try {
      for (const sport of selectedSports) {
        const backendSport = apiSports.find(s => s.name.toLowerCase() === sport.name.toLowerCase());
        if (!backendSport) continue;
        await sportsService.createEvent({
          name: `${sport.name} — ${autoCategory}`,
          sportId: backendSport.id,
          communityId: user.communityId,
          eventDateStart: new Date().toISOString().split("T")[0],
          eventDateEnd: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          format: matchTypes[sport.id] ?? undefined,
        });
      }
      toast.success(`Registered for ${selectedSports.length} sport(s)!`);
      fetchTabData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const myCommunity = communities.find(c => c.id === user?.communityId);

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Primary Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#f1f5f9]">My Sports Hub</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Manage your active tournaments, matches, teams, and registrations</p>
      </div>

      {/* Sub navigation bar */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] p-1.5 rounded-xl flex gap-1 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                activeTab === tab.id
                  ? "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20"
                  : "bg-transparent text-[#94a3b8] hover:text-[#f1f5f9] border-transparent hover:bg-[#1a2540]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content wrapper */}
      <div className="flex-1 min-w-0">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
            <p className="text-xs text-[#94a3b8]">Fetching your sports configurations...</p>
          </div>
        ) : (
          <>
            {/* ════════════ MY TOURNAMENTS TAB ════════════ */}
            {activeTab === "tournaments" && (
              <div className="space-y-4 text-left">
                {registrations.length === 0 ? (
                  <div className="text-center py-16 bg-[#141c2e] border border-[#2a3a5c] rounded-xl">
                    <Trophy className="w-12 h-12 text-[#2a3a5c] mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">You haven't registered for any tournaments yet.</p>
                    <p className="text-xs text-slate-500 mt-1 mb-6">Explore the baseline categories and register in the "Sports Settings" tab.</p>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="px-4 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer border-none"
                    >
                      Register Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {registrations.map(reg => {
                      const statusColors: Record<string, string> = {
                        PENDING: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
                        REGISTERED: "bg-orange-500/10 text-[#f97316] border border-orange-500/20",
                        CONFIRMED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                        WITHDRAWN: "bg-red-500/10 text-red-400 border border-red-500/20",
                      };

                      return (
                        <div key={reg.id} className="p-5 bg-[#141c2e] border border-[#2a3a5c] rounded-xl flex flex-col justify-between gap-4 relative hover:border-[#f97316]/30 transition-all duration-300">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">{reg.event?.sport?.name || "Sport Event"}</div>
                              <h4 className="text-sm font-bold text-[#f1f5f9] truncate mt-1 leading-snug">{reg.event?.name}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {reg.category?.name && (
                                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
                                    {reg.category.name}
                                  </span>
                                )}
                                {reg.age && (
                                  <span className="text-[10px] bg-[#1a2540] text-slate-400 px-2 py-0.5 rounded font-medium">
                                    Age: {reg.age}
                                  </span>
                                )}
                                {reg.flatNumber && (
                                  <span className="text-[10px] bg-[#1a2540] text-slate-400 px-2 py-0.5 rounded font-medium">
                                    Flat: {reg.flatNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wide flex-shrink-0 ${statusColors[reg.status] || "bg-[#1a2540] text-slate-400"}`}>
                              {reg.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-[#2a3a5c]/60 pt-3.5 mt-1">
                            <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#f97316]" />
                              <span>Registered on {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}</span>
                            </div>
                            {["PENDING", "REGISTERED"].includes(reg.status) && (
                              <button
                                onClick={() => handleWithdraw(reg.id)}
                                className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer bg-transparent"
                                title="Withdraw"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════════════ MY COMMUNITY TAB ════════════ */}
            {activeTab === "community" && (
              <div className="space-y-4">
                {!myCommunity ? (
                  <div className="text-center py-12 bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-6">
                    <Building2 className="w-12 h-12 text-[#2a3a5c] mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No community settings found.</p>
                    <p className="text-xs text-slate-500 mt-1">Make sure you have selected or joined a community in your profile dashboard.</p>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto bg-[#141c2e] border border-[#2a3a5c] rounded-2xl p-6 shadow-xl relative hover:border-[#f97316]/20 transition-all duration-300">
                    <div className="flex items-center gap-4 border-b border-[#2a3a5c] pb-4 mb-5">
                      <div className="p-3.5 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-[#f97316]">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-bold text-[#f1f5f9] uppercase tracking-wider">{myCommunity.name}</h3>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest mt-1 inline-block">
                          {myCommunity.type} COMMUNITY
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-left">
                      <div className="space-y-1">
                        <span className="text-slate-400 uppercase tracking-wider block font-medium">Community Code</span>
                        <p className="text-sm font-bold text-[#f97316]">{myCommunity.code || "—"}</p>
                      </div>
                      {myCommunity.inviteCode && (
                        <div className="space-y-1">
                          <span className="text-slate-400 uppercase tracking-wider block font-medium">Invite Registration Code</span>
                          <p className="text-sm font-bold text-emerald-400 select-all">{myCommunity.inviteCode}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-slate-400 uppercase tracking-wider block font-medium">Sub-Type / Classification</span>
                        <p className="text-sm font-bold text-[#f1f5f9] capitalize">{myCommunity.subtype || "Standard Community"}</p>
                      </div>
                      <div className="space-y-1 font-medium text-slate-300">
                        <span className="text-slate-400 uppercase tracking-wider block">Location Details</span>
                        <p className="text-sm font-bold text-[#f1f5f9]">
                          {myCommunity.area ? `${myCommunity.area}, ` : ""}{myCommunity.city || "Bangalore"}{myCommunity.state ? `, ${myCommunity.state}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════ MY TEAMS TAB ════════════ */}
            {activeTab === "teams" && (
              <div className="space-y-4 text-left">
                {teams.length === 0 ? (
                  <div className="text-center py-16 bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-6">
                    <Users className="w-12 h-12 text-[#2a3a5c] mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No auction/tournament teams found.</p>
                    <p className="text-xs text-slate-500 mt-1">Teams will appear here once you are assigned to an auction team or nominated as a captain.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map(team => {
                      const total = team.totalBudget || 1000;
                      const spent = team.spent || 0;
                      const remaining = team.remainingBudget || (total - spent);
                      const percent = Math.min(100, Math.round((spent / total) * 100));

                      return (
                        <div key={team.id} className="p-5 bg-[#141c2e] border border-[#2a3a5c] rounded-xl flex flex-col gap-4 hover:border-[#f97316]/30 transition-all duration-300">
                          <div className="flex items-center justify-between gap-3 border-b border-[#2a3a5c]/60 pb-3">
                            <div>
                              <h4 className="text-sm font-bold text-[#f1f5f9] flex items-center gap-1.5">
                                {team.emoji || "🛡️"} {team.teamName}
                              </h4>
                              <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">Owner: {team.ownerName || "—"}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${team.captainConfirmation ? "bg-emerald-500/15 text-emerald-400" : "bg-[#f97316]/15 text-[#f97316]"}`}>
                              {team.captainConfirmation ? "CONFIRMED CAPTAIN" : "NOMINATED"}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-[#94a3b8] font-medium">
                              <span>Budget Spent: ₹{spent.toLocaleString()}</span>
                              <span>Total: ₹{total.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-[#0c1220] rounded-full h-2 border border-[#2a3a5c]">
                              <div className="bg-gradient-to-r from-[#f97316] to-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="text-[10px] text-emerald-400 font-semibold text-right">Remaining: ₹{remaining.toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════════════ MY MATCHES TAB ════════════ */}
            {activeTab === "matches" && (
              <div className="space-y-4">
                {myMatches.length === 0 ? (
                  <div className="text-center py-16 bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-6">
                    <Calendar className="w-12 h-12 text-[#2a3a5c] mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No upcoming scheduled matches found.</p>
                    <p className="text-xs text-slate-500 mt-1">Once brackets are seeded and matches are scheduled, they will appear in your timeline.</p>
                  </div>
                ) : (
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-5 max-w-3xl mx-auto">
                    <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest mb-5 border-b border-[#2a3a5c]/60 pb-2 text-left">My Match Timeline</div>
                    <div className="space-y-1">
                      {myMatches.map((m, i) => {
                        const statusColors: Record<string, string> = {
                          LIVE: "#10b981",
                          REGISTRATION_OPEN: "#10b981",
                          REGISTRATION_CLOSED: "#f97316",
                          COMPLETED: "#3b82f6",
                        };
                        const color = statusColors[m.registrationStatus] || "#475569";

                        return (
                          <div key={m.id} className="relative flex gap-4 pb-6">
                            <div className="flex flex-col items-center">
                              <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 border border-slate-900" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                              {i < myMatches.length - 1 && <div className="w-px flex-1 bg-[#2a3a5c] mt-1.5" />}
                            </div>
                            <div className="flex-1 min-w-0 pb-1 text-left">
                              <div className="text-xs text-[#94a3b8] font-semibold">{m.eventDateStart ? new Date(m.eventDateStart).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Date TBD"}</div>
                              <h4 className="text-sm font-bold text-[#f1f5f9] mt-1">{m.sport?.name} — {m.name}</h4>
                              <div className="text-xs text-[#94a3b8] mt-1 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#f97316]" /> {m.venue?.name || "Venue TBD"}{m.venue?.city ? `, ${m.venue.city}` : ""}
                              </div>
                              <div className="flex gap-2 mt-2.5">
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/20">{m.format || "SINGLES"}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/20">{m.registrationStatus}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════ SPORTS SETTINGS (REGISTRATION) TAB ════════════ */}
            {activeTab === "settings" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-left">
                <div className="space-y-4">
                  {/* Sport selection */}
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
                    <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-3">Select Sports</div>
                    {loadingMeta ? (
                      <div className="flex items-center gap-2 text-[#94a3b8] text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {ALL_SPORTS.map(s => (
                          <button
                            key={s.id}
                            onClick={() => toggleSport(s.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                              selected[s.id]
                                ? "border-[#f97316] bg-orange-500/10 text-[#f97316]"
                                : "border-[#2a3a5c] bg-[#1a2540] text-[#94a3b8] hover:border-[#475569]"
                            }`}
                          >
                            {s.icon} {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Player profile */}
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
                    <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-3">Player Profile</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#94a3b8] block mb-1.5">Full Name</label>
                        <input defaultValue={user?.fullName ?? "Community Player"} className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-[#94a3b8] block mb-1.5">Age</label>
                        <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-[#94a3b8] block mb-1.5">Gender</label>
                        <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9]">
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[#94a3b8] block mb-1.5">Govt ID</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#0c1220] border border-[#10b981] rounded-lg">
                          <CheckCircle className="w-4 h-4 text-[#10b981]" />
                          <span className="text-xs text-[#10b981]">Aadhaar Linked</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto category */}
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
                    <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-3">Auto-assigned Category</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1.5 rounded-lg border border-[#3b82f6] bg-blue-500/10 text-[#3b82f6] text-xs font-medium">{autoCategory}</span>
                      <span className="px-3 py-1.5 rounded-lg border border-[#3b82f6] bg-blue-500/10 text-[#3b82f6] text-xs font-medium">Open</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5 leading-relaxed">
                      ℹ️ Category assigned by age and gender — Senior Citizens 55+, Kids Under 12, Boys/Girls 12–18, Mens/Womens 18–55.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Match type per sport */}
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
                    <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-3">Match Type per Sport</div>
                    {selectedSports.length === 0 ? (
                      <p className="text-sm text-[#475569] text-center py-4">Select sports from the left panel</p>
                    ) : (
                      selectedSports.map(sport => (
                        <div key={sport.id} className="bg-[#1a2540] border border-[#2a3a5c] rounded-xl p-4 mb-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-[#f1f5f9]">{sport.icon} {sport.name}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-[#10b981]">Age OK</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(MATCH_TYPES[sport.id] ?? ["Singles"]).map(type => (
                              <button
                                key={type}
                                onClick={() => setMatchType(sport.id, type)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                                  matchTypes[sport.id] === type || (!matchTypes[sport.id] && type === (MATCH_TYPES[sport.id]?.[0]))
                                    ? "border-[#8b5cf6] bg-purple-500/10 text-[#8b5cf6]"
                                    : "border-[#2a3a5c] bg-[#0c1220] text-[#94a3b8] hover:border-[#475569]"
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Age check */}
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
                    <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-3">Age Restriction Check</div>
                    <div className="bg-[#0c1220] rounded-lg overflow-hidden">
                      <div className="flex justify-between px-3 py-2 border-b border-[#2a3a5c] text-xs text-[#94a3b8]">
                        <span>Sport</span><span>Age Range</span><span>Status</span>
                      </div>
                      {[["🏏 Cricket", "10-60"], ["🏸 Badminton", "All ages"], ["⚽ Football", "10-50"]].map(([s, r]) => (
                        <div key={s} className="flex justify-between px-3 py-2 border-b border-[#2a3a5c] last:border-0 text-xs">
                          <span className="text-[#f1f5f9]">{s}</span>
                          <span className="text-[#94a3b8]">{r}</span>
                          <span className="text-[#10b981]">✓ Eligible</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full mt-4 py-3 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-70 text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : "Submit Registration ↗"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
