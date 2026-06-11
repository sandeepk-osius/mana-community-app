import React, { useState, useEffect } from "react";
import { Loader2, Plus, Calendar, Trophy, MapPin, X } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";

import { tournamentService } from "../../../services/tournamentService";
import type { TournamentTypeInfo, EventInfo, ConfigInfo } from "../../../services/tournamentService";

export function TournamentScheduler() {
  const { token } = useAuth() as any;
  const [types, setTypes] = useState<TournamentTypeInfo[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Form State
  const [fName, setFName] = useState("");
  const [fEvent, setFEvent] = useState("");
  const [fType, setFType] = useState("");
  const [fTeams, setFTeams] = useState("8");
  const [fStartDate, setFStartDate] = useState("");
  const [fEndDate, setFEndDate] = useState("");
  const [fGroups, setFGroups] = useState("2");
  const [fAdvancing, setFAdvancing] = useState("2");
  const [fSwissRounds, setFSwissRounds] = useState("3");
  const [fDuration, setFDuration] = useState("90");
  const [fBreak, setFBreak] = useState("30");
  const [fVenue, setFVenue] = useState("");
  const [fPtsWin, setFPtsWin] = useState("2");
  const [fPtsDraw, setFPtsDraw] = useState("1");
  const [fPtsLoss, setFPtsLoss] = useState("0");
  const [fThirdPlace, setFThirdPlace] = useState(true);
  const [fSeeding, setFSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [token]);

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resTypes, resEvents, resConfigs] = await Promise.all([
        tournamentService.getTournamentTypes(),
        tournamentService.getEventsForDropdown(),
        tournamentService.getConfigs(),
      ]);
      setTypes(resTypes);
      setEvents(resEvents);
      setConfigs(resConfigs);
    } catch (e) {
      console.error(e);
      setTypes([
        { id: "KNOCKOUT", name: "Knockout", description: "Single elimination", teamRange: "2-64", formatNote: "ceil(log2 N) rounds" },
        { id: "GROUP_KNOCKOUT", name: "Group + Knockout", description: "Groups then knockout", teamRange: "4-32", formatNote: "Group + KO" },
        { id: "ROUND_ROBIN", name: "Round Robin", description: "Everyone vs everyone", teamRange: "3-20", formatNote: "N*(N-1)/2" },
        { id: "DOUBLE_ELIMINATION", name: "Double Elimination", description: "Two losses to exit", teamRange: "4-32", formatNote: "~2x KO" },
        { id: "SWISS", name: "Swiss System", description: "Score-paired rounds", teamRange: "4-128", formatNote: "ceil(log2 N) rounds" },
        { id: "SUPER_LEAGUE", name: "Super League", description: "IPL-style playoffs", teamRange: "6-10", formatNote: "League + 4" },
      ]);
    }
    setLoading(false);
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setEditingId(null);
    setFName("");
    setFEvent("");
    setFType("");
    setFTeams("8");
    setFStartDate("");
    setFEndDate("");
    setFGroups("2");
    setFAdvancing("2");
    setFSwissRounds("3");
    setFDuration("90");
    setFBreak("30");
    setFVenue("");
    setFPtsWin("2");
    setFPtsDraw("1");
    setFPtsLoss("0");
    setFThirdPlace(true);
    setFSeeding(false);
  };

  const openModal = (config?: ConfigInfo) => {
    if (config) {
      setEditingId(config.id);
      setFName(config.tournamentName || "");
      setFEvent(config.eventId ? config.eventId.toString() : "");
      setFType(config.tournamentType || "");
      setFTeams(config.totalTeams ? config.totalTeams.toString() : "8");
      setFStartDate(config.startDate || "");
      setFEndDate(config.endDate || "");
      setFGroups(config.numberOfGroups ? config.numberOfGroups.toString() : "2");
      setFAdvancing(config.teamsAdvancingPerGroup ? config.teamsAdvancingPerGroup.toString() : "2");
      setFSwissRounds(config.swissRounds ? config.swissRounds.toString() : "3");
      setFDuration(config.matchDurationMinutes ? config.matchDurationMinutes.toString() : "90");
      setFBreak(config.breakBetweenMatchesMinutes ? config.breakBetweenMatchesMinutes.toString() : "30");
      setFVenue(config.venueName || "");
      setFPtsWin(config.pointsForWin !== undefined ? config.pointsForWin.toString() : "2");
      setFPtsDraw(config.pointsForDraw !== undefined ? config.pointsForDraw.toString() : "1");
      setFPtsLoss(config.pointsForLoss !== undefined ? config.pointsForLoss.toString() : "0");
      setFThirdPlace(config.thirdPlaceMatch !== false);
      setFSeeding(config.hasSeeding === true);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!fName.trim()) { showToast("Tournament name is required", "error"); return; }
    if (!fType) { showToast("Select a tournament type", "error"); return; }

    const eventId = fEvent || null;
    let sportId = 1, communityId = 1;
    if (eventId) {
      const ev = events.find((e) => e.id.toString() === eventId);
      if (ev) { sportId = ev.sportId; communityId = ev.communityId; }
    }

    const body = {
      tournamentName: fName.trim(),
      sportId,
      communityId,
      eventId: eventId ? Number(eventId) : null,
      tournamentType: fType,
      totalTeams: Number(fTeams) || 8,
      teamIds: [],
      numberOfGroups: fType === "GROUP_KNOCKOUT" ? Number(fGroups) : null,
      teamsAdvancingPerGroup: fType === "GROUP_KNOCKOUT" ? Number(fAdvancing) : null,
      swissRounds: fType === "SWISS" ? Number(fSwissRounds) : null,
      thirdPlaceMatch: fThirdPlace,
      hasSeeding: fSeeding,
      startDate: fStartDate || null,
      endDate: fEndDate || null,
      matchDurationMinutes: Number(fDuration) || 90,
      breakBetweenMatchesMinutes: Number(fBreak) || 30,
      venueName: fVenue || null,
      pointsForWin: Number(fPtsWin),
      pointsForDraw: Number(fPtsDraw),
      pointsForLoss: Number(fPtsLoss),
    };

    setSaving(true);
    try {
      if (editingId) {
        await tournamentService.updateConfig(editingId, body);
      } else {
        await tournamentService.createConfig(body);
      }
      showToast(editingId ? "Configuration updated!" : "Configuration saved!");
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      showToast("Save failed: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const formatType = (t: string) => {
    const map: any = { KNOCKOUT: "Knockout", GROUP_KNOCKOUT: "Group+KO", ROUND_ROBIN: "Round Robin", DOUBLE_ELIMINATION: "Double Elim", SWISS: "Swiss", SUPER_LEAGUE: "Super League" };
    return map[t] || t;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-8 right-8 p-4 rounded-lg shadow-lg z-50 font-medium ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-['Bebas_Neue'] tracking-wide">TOURNAMENT SCHEDULER</h1>
          <p className="text-sm text-slate-400">CommUnity Sports Command Center</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-[#F5A623] hover:bg-[#e09212] text-black font-semibold py-2 px-4 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Schedule Config
        </button>
      </div>

      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-[#F5A623] animate-spin" /></div>
        ) : configs.length === 0 ? (
          <div className="text-center p-16">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No tournament configurations yet.</p>
            <p className="text-sm text-slate-500 mt-1">Click "New Schedule Config" to create your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f1729] border-b border-[#2a3a5c]">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tournament</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Event</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Teams</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3a5c]/50">
                {configs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-sm font-semibold text-[#F5A623]">{c.tournamentName}</td>
                    <td className="p-4 text-sm text-slate-300">{formatType(c.tournamentType)}</td>
                    <td className="p-4 text-sm text-slate-400">{c.eventName || "—"}</td>
                    <td className="p-4 text-sm text-slate-300">{c.totalTeams || "—"}</td>
                    <td className="p-4 text-sm text-slate-400">{c.startDate || "—"}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                        ${c.status === "DRAFT" ? "bg-slate-700/50 text-slate-400" :
                          c.status === "ACTIVE" ? "bg-green-500/10 text-green-400" :
                          c.status === "LIVE" ? "bg-[#F5A623]/10 text-[#F5A623]" :
                          "bg-blue-500/10 text-blue-400"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => openModal(c)} className="text-sm font-medium text-[#F5A623] hover:text-[#e09212]">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center pt-10 sm:pt-20 px-4 bg-black/70 backdrop-blur-sm overflow-y-auto pb-10">
          <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl w-full max-w-3xl flex flex-col shadow-2xl relative h-max">
            <div className="flex items-center justify-between p-6 border-b border-[#2a3a5c]">
              <h2 className="text-xl font-bold text-[#F5A623] font-['Bebas_Neue'] tracking-wider">
                {editingId ? "Edit Tournament Configuration" : "New Tournament Configuration"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tournament Name *</label>
                  <select value={fEvent} onChange={(e) => {
                    const selectedId = e.target.value;
                    setFEvent(selectedId);
                    const matchedEvent = events.find(ev => ev.id.toString() === selectedId);
                    if (matchedEvent) {
                      setFName(matchedEvent.name);
                      if (matchedEvent.totalTeams !== undefined && matchedEvent.totalTeams > 0) {
                        setFTeams(matchedEvent.totalTeams.toString());
                      }
                      if (matchedEvent.eventDateStart) {
                        setFStartDate(matchedEvent.eventDateStart);
                      }
                      if (matchedEvent.eventDateEnd) {
                        setFEndDate(matchedEvent.eventDateEnd);
                      }
                      if (matchedEvent.venueName) {
                        setFVenue(matchedEvent.venueName);
                      }
                    } else {
                      setFName("");
                    }
                  }} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]">
                    <option value="">— Select Tournament Name —</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.sportName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sport Event</label>
                  <select value={fEvent} onChange={(e) => setFEvent(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]">
                    <option value="">— Select Event —</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.sportName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tournament Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {types.map((t) => (
                    <button key={t.id} type="button" onClick={() => setFType(t.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${fType === t.id ? "bg-[#F5A623]/10 border-[#F5A623] shadow-[0_0_15px_rgba(200,255,0,0.15)]" : "bg-[#0f1729] border-[#2a3a5c] hover:border-slate-500"}`}>
                      <div className={`font-bold font-['Bebas_Neue'] tracking-wide text-lg ${fType === t.id ? "text-[#F5A623]" : "text-slate-200"}`}>{t.name}</div>
                      <div className="text-xs text-slate-400 mt-1 leading-snug">{t.description}</div>
                      <div className="text-[10px] mt-2 bg-[#00e5ff]/10 text-[#00e5ff] inline-block px-2 py-0.5 rounded">{t.teamRange} teams</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Teams *</label>
                  <input type="number" min="2" max="128" value={fTeams} onChange={(e) => setFTeams(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date *</label>
                  <input type="date" value={fStartDate} onChange={(e) => setFStartDate(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623] [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                  <input type="date" value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623] [color-scheme:dark]" />
                </div>
              </div>

              {fType === "GROUP_KNOCKOUT" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-[#2a3a5c] rounded-lg bg-[#0f1729]/50">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Number of Groups</label>
                    <input type="number" min="2" max="8" value={fGroups} onChange={(e) => setFGroups(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Advancing per Group</label>
                    <input type="number" min="1" max="8" value={fAdvancing} onChange={(e) => setFAdvancing(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                  </div>
                </div>
              )}

              {fType === "SWISS" && (
                <div className="p-4 border border-[#2a3a5c] rounded-lg bg-[#0f1729]/50">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Swiss Rounds</label>
                  <input type="number" min="1" max="20" value={fSwissRounds} onChange={(e) => setFSwissRounds(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Duration (min)</label>
                  <input type="number" value={fDuration} onChange={(e) => setFDuration(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Break (min)</label>
                  <input type="number" value={fBreak} onChange={(e) => setFBreak(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Venue</label>
                  <input value={fVenue} onChange={(e) => setFVenue(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pts Win</label>
                  <input type="number" value={fPtsWin} onChange={(e) => setFPtsWin(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pts Draw</label>
                  <input type="number" value={fPtsDraw} onChange={(e) => setFPtsDraw(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pts Loss</label>
                  <input type="number" value={fPtsLoss} onChange={(e) => setFPtsLoss(e.target.value)} className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-[#F5A623]" />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input type="checkbox" checked={fThirdPlace} onChange={(e) => setFThirdPlace(e.target.checked)} className="w-4 h-4 accent-[#F5A623]" />
                  3rd Place Match
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input type="checkbox" checked={fSeeding} onChange={(e) => setFSeeding(e.target.checked)} className="w-4 h-4 accent-[#F5A623]" />
                  Seeded Draw
                </label>
              </div>

            </div>

            <div className="p-6 border-t border-[#2a3a5c] flex justify-end gap-3 bg-[#0f1729]/50 rounded-b-xl">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button disabled={saving} onClick={handleSave} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#F5A623] hover:bg-[#e09212] text-black font-semibold transition-colors disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Update Configuration" : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
