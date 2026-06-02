import React from "react";
import { Plus, X, Search, Loader2, Trash2, CalendarIcon, Users, Edit2, ClipboardList, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { format } from "date-fns";
import { cn } from "../../ui/utils";
import type { SportMeta, PlayerCategory, Venue, SportsEvent, SportFormEntry, SportFormEvent } from "../../../../types/api";

const PREDEFINED_SPORTS: { name: string; icon: string }[] = [
  { name: "Badminton", icon: "🏸" },
  { name: "Basketball", icon: "🏀" },
  { name: "Beach Volleyball", icon: "🏐" },
  { name: "Billiards", icon: "🎱" },
  { name: "Bowling", icon: "🎳" },
  { name: "Carrom", icon: "🎯" },
  { name: "Chess", icon: "♟️" },
  { name: "Cricket (Tennis Ball)", icon: "🏏" },
  { name: "Cycling", icon: "🚴" },
  { name: "Dart", icon: "🎯" },
  { name: "Foosball", icon: "⚽" },
  { name: "Grass Volleyball", icon: "🏐" },
  { name: "Kabaddi", icon: "🤼" },
  { name: "Pickleball", icon: "🏓" },
  { name: "Pool", icon: "🎱" },
  { name: "Running (100M)", icon: "🏃" },
  { name: "Running (1500M)", icon: "🏃" },
  { name: "Running (200M)", icon: "🏃" },
  { name: "Running (400M)", icon: "🏃" },
  { name: "Running (800M)", icon: "🏃" },
  { name: "Running (Others)", icon: "🏃" },
  { name: "Snooker", icon: "🎱" },
  { name: "Soccer", icon: "⚽" },
  { name: "Squash", icon: "🎾" },
  { name: "Swimming Race", icon: "🏊" },
  { name: "Table Tennis", icon: "🏓" },
  { name: "Tennis", icon: "🎾" },
  { name: "Throwball", icon: "🤾" },
  { name: "Tug of War", icon: "🪢" },
  { name: "Volleyball", icon: "🏐" },
];

const isTeamSport = (sportName: string): boolean => {
  const name = sportName.toLowerCase();
  return (
    name.includes("cricket") ||
    name.includes("football") ||
    name.includes("soccer") ||
    name.includes("basketball") ||
    name.includes("volleyball") ||
    name.includes("kabaddi") ||
    name.includes("tug of war") ||
    name.includes("throwball") ||
    name.includes("hockey") ||
    name.includes("baseball") ||
    name.includes("rugby")
  );
};

interface SportsEventSectionProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  showSportForm: boolean;
  setShowSportForm: (val: boolean) => void;
  showSportPicker: boolean;
  setShowSportPicker: (val: boolean) => void;
  sportPickerSearch: string;
  setSportPickerSearch: (val: string) => void;
  sportSubmitting: boolean;
  sportForms: SportFormEntry[];
  sportsMeta: SportMeta[];
  playerCategories: PlayerCategory[];
  venues: Venue[];
  activeEvents: any[];
  handleSportPickerSelect: (sport: { name: string; icon: string }) => void;
  handleCreateCustomSport: () => void;
  removeSportForm: (id: string) => void;
  addEventToSportForm: (id: string) => void;
  removeEventFromSportForm: (formId: string, eventId: string) => void;
  updateSportFormEvent: (formId: string, eventId: string, field: string, value: any) => void;
  handleSportSave: () => void;
  handleSportEdit: (ev: any) => void;
  handleSportDelete: (id: number) => void;
  resetSportForm: () => void;
  selectedTemplates: Record<string, string>;
  setSelectedTemplates: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  openDropdownEventId: string | null;
  setOpenDropdownEventId: React.Dispatch<React.SetStateAction<string | null>>;
  searchQueries: Record<string, string>;
  setSearchQueries: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeCommId: number | undefined;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

export function SportsEventSection({
  user,
  activeTab,
  setActiveTab,
  showSportForm,
  setShowSportForm,
  showSportPicker,
  setShowSportPicker,
  sportPickerSearch,
  setSportPickerSearch,
  sportSubmitting,
  sportForms,
  sportsMeta,
  playerCategories,
  venues,
  activeEvents,
  handleSportPickerSelect,
  handleCreateCustomSport,
  removeSportForm,
  addEventToSportForm,
  removeEventFromSportForm,
  updateSportFormEvent,
  handleSportSave,
  handleSportEdit,
  handleSportDelete,
  resetSportForm,
  selectedTemplates,
  setSelectedTemplates,
  openDropdownEventId,
  setOpenDropdownEventId,
  searchQueries,
  setSearchQueries,
  activeCommId,
  isSuperAdmin,
  isAdmin,
}: SportsEventSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#f1f5f9]">Sports Management</h1>
          <p className="text-sm text-[#94a3b8] mt-1">Configure and manage active sports metadata in the system</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showSportForm) {
              resetSportForm();
            } else {
              resetSportForm();
              setShowSportPicker(true);
            }
          }}
          className="px-4 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" /> {showSportForm ? "Close Form" : "Add Event"}
        </button>
      </div>

      {/* ─── Sport Picker Modal ─── */}
      {showSportPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div
            className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl"
            style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3a5c]">
              <div>
                <h2 className="text-lg font-bold text-[#f1f5f9]">Select a Sport</h2>
                <p className="text-xs text-[#64748b] mt-0.5">Choose from the list below to configure its defaults</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowSportPicker(false); setSportPickerSearch(""); }}
                className="p-2 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-[#2a3a5c]/60">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input
                  type="text"
                  value={sportPickerSearch}
                  onChange={e => setSportPickerSearch(e.target.value)}
                  placeholder="Search sports..."
                  className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg pl-10 pr-4 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {PREDEFINED_SPORTS.filter(sp => sp.name.toLowerCase().includes(sportPickerSearch.toLowerCase())).map(sp => {
                  const alreadyAdded = sportsMeta.some(meta => meta.name.toLowerCase() === sp.name.toLowerCase());
                  const alreadyQueued = sportForms.some(form => form.name.toLowerCase() === sp.name.toLowerCase());
                  const isUnavailable = alreadyAdded || alreadyQueued;

                  return (
                    <button
                      key={sp.name}
                      type="button"
                      onClick={() => !isUnavailable && handleSportPickerSelect(sp)}
                      disabled={isUnavailable}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer",
                        isUnavailable
                          ? "bg-[#0c1220]/50 border-[#1e293b] opacity-40 cursor-not-allowed"
                          : "bg-[#0c1220] border-[#2a3a5c] hover:border-[#f97316] hover:bg-[#1a2540] hover:shadow-lg hover:shadow-orange-500/5 hover:scale-[1.03]"
                      )}
                    >
                       {sp.icon && (sp.icon.startsWith("data:image/") || sp.icon.startsWith("http")) ? (
                         <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-slate-800/40 border border-slate-700/60 shadow-inner">
                           <img src={sp.icon} alt={sp.name} className="w-9 h-9 object-cover rounded" />
                         </div>
                       ) : (
                         <span className="text-3xl leading-none">{sp.icon}</span>
                       )}
                      <span className="text-xs font-medium text-[#cbd5e1] leading-tight">{sp.name}</span>
                      {alreadyAdded && (
                        <span className="text-[9px] text-[#f97316] font-semibold uppercase tracking-wide">Registered</span>
                      )}
                      {alreadyQueued && (
                        <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wide">Queued</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {PREDEFINED_SPORTS.filter(sp => sp.name.toLowerCase().includes(sportPickerSearch.toLowerCase())).length === 0 && (
                <div className="text-center py-10">
                  <p className="text-[#64748b] text-sm mb-4">No predefined sports match your search.</p>
                  <button
                    type="button"
                    onClick={handleCreateCustomSport}
                    disabled={sportSubmitting}
                    className="px-4 py-2.5 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-70 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2 mx-auto shadow-md"
                  >
                    {sportSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Custom Sport: "{sportPickerSearch}"
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#2a3a5c]/60 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowSportPicker(false); setSportPickerSearch(""); }}
                className="px-4 py-2 text-sm text-[#94a3b8] border border-[#2a3a5c] rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors bg-transparent cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSportForm && sportForms.length > 0 && (
        <div className="space-y-4">
          {/* Header bar with count and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-[#f97316] uppercase tracking-wider">
                {sportForms.some(f => f.editingSportId) ? "Edit Sport Event" : `Configure Sports Event (${sportForms.length})`}
              </h3>
            </div>
            {!sportForms.some(f => f.editingSportId) && (
              <button
                type="button"
                onClick={() => setShowSportPicker(true)}
                className="px-4 py-2 text-sm text-[#f97316] border border-[#f97316]/30 rounded-lg hover:bg-[#f97316]/10 transition-colors bg-transparent cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Event
              </button>
            )}
          </div>

          {/* Sport Form Cards */}
          <div className="space-y-5">
            {sportForms.map((form, idx) => (
              <div
                key={form.id}
                className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-5 shadow-xl relative hover:border-[#2a3a5c]/80 transition-colors"
              >
                {/* Sport Header with icon, name, index badge and remove button */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-3 bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 flex-1">
                     {form.iconUrl ? (
                       <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-slate-800/40 border border-slate-700/60 shadow-sm">
                         <img src={form.iconUrl} alt={form.name} className="w-7 h-7 object-cover rounded" />
                       </div>
                     ) : (
                       <span className="text-2xl leading-none">{form.icon || "🏆"}</span>
                     )}
                    <div className="flex-1 min-w-0">
                      <label className="text-[9px] text-[#64748b] block font-medium uppercase tracking-wider">Sport {idx + 1}</label>
                      <h4 className="text-sm font-bold text-[#f1f5f9] truncate">{form.name}</h4>
                    </div>
                  </div>
                  {!form.editingSportId && sportForms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSportForm(form.id)}
                      className="p-2 hover:bg-red-500/10 text-[#94a3b8] hover:text-red-400 rounded-lg transition-colors border border-[#2a3a5c] hover:border-red-500/30 bg-transparent cursor-pointer"
                      title="Remove this sport"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Event Configurations */}
                <div className="space-y-3">
                  {form.events.map((ev, eIdx) => (
                    <div
                      key={ev.id}
                      className="bg-[#0c1220]/70 border border-[#1e293b] rounded-xl p-4 space-y-3 relative"
                    >
                      {/* Event header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#f97316]/80 uppercase tracking-wider">Event {eIdx + 1}</span>
                        {form.events.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEventFromSportForm(form.id, ev.id)}
                            className="p-1 hover:bg-red-500/10 text-[#64748b] hover:text-red-400 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title="Remove event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Event Name */}
                      <div>
                        <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Name *</label>
                        <input
                          type="text"
                          value={ev.eventName}
                          onChange={e => updateSportFormEvent(form.id, ev.id, "eventName", e.target.value)}
                          placeholder="Event Name"
                          className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none"
                        />
                      </div>

                      {/* Start Date & End Date */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#94a3b8] font-medium">Start Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full bg-[#0c1220] border-[#2a3a5c] hover:bg-[#1a2540] hover:text-[#f1f5f9] text-[#f1f5f9] justify-start text-left font-normal px-3 py-2 h-auto text-sm", !ev.startDate && "text-[#94a3b8]")}>
                                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                {ev.startDate ? format(new Date(ev.startDate), "PPP") : <span>Pick date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar
                                mode="single"
                                selected={ev.startDate ? new Date(ev.startDate) : undefined}
                                onSelect={(date) => updateSportFormEvent(form.id, ev.id, "startDate", date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#94a3b8] font-medium">End Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full bg-[#0c1220] border-[#2a3a5c] hover:bg-[#1a2540] hover:text-[#f1f5f9] text-[#f1f5f9] justify-start text-left font-normal px-3 py-2 h-auto text-sm", !ev.endDate && "text-[#94a3b8]")}>
                                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                {ev.endDate ? format(new Date(ev.endDate), "PPP") : <span>Pick date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar
                                mode="single"
                                selected={ev.endDate ? new Date(ev.endDate) : undefined}
                                onSelect={(date) => updateSportFormEvent(form.id, ev.id, "endDate", date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Venue Selection */}
                      <div>
                        <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Venue</label>
                        <div className="relative">
                          <select
                            value={ev.venueId || ""}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "venueId", e.target.value)}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none font-normal"
                          >
                            <option value="">No Venue / Online / Outside</option>
                            {venues.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94a3b8]">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Config Row 1: Gender & Players Born */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Gender *</label>
                          <div className="relative">
                            <select
                              value={ev.gender}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "gender", e.target.value)}
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                            >
                              <option value="ALL">All Genders</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="MIXED">Mixed</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94a3b8]">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Players Born After *</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full bg-[#0c1220] border-[#2a3a5c] hover:bg-[#1a2540] hover:text-[#f1f5f9] text-[#f1f5f9] justify-start text-left font-normal px-3 py-2 h-auto text-sm", !ev.playersBorn && "text-[#94a3b8]")}>
                                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                {ev.playersBorn ? format(new Date(ev.playersBorn), "PPP") : <span>Pick date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar
                                mode="single"
                                selected={ev.playersBorn ? new Date(ev.playersBorn) : undefined}
                                onSelect={(date) => updateSportFormEvent(form.id, ev.id, "playersBorn", date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Config Row 2: Format & Player Category Template */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Format *</label>
                          <div className="relative">
                            <select
                              value={ev.tournamentType}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "tournamentType", e.target.value)}
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                            >
                              <option value="KNOCKOUT_SINGLE">Knockout (Single Elimination)</option>
                              <option value="KNOCKOUT_DOUBLE">Double Elimination</option>
                              <option value="ROUND_ROBIN">Round Robin</option>
                              <option value="LEAGUE">League</option>
                              <option value="GROUP_PLAYOFF">Group Stage + Playoffs</option>
                              <option value="CUSTOM">Custom Bracket</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94a3b8]">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Player Category Template</label>
                          <Popover
                            open={openDropdownEventId === ev.id}
                            onOpenChange={(open) => setOpenDropdownEventId(open ? ev.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openDropdownEventId === ev.id}
                                className="w-full bg-[#0c1220] border-[#2a3a5c] hover:bg-[#1a2540] hover:text-[#f1f5f9] text-[#f1f5f9] justify-between text-left font-normal px-3 py-2 h-auto text-sm truncate"
                              >
                                {selectedTemplates[ev.id]
                                  ? playerCategories.find((cat) => String(cat.id) === selectedTemplates[ev.id])?.name
                                  : "Select Template..."}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 bg-[#141c2e] border border-[#2a3a5c] text-[#f1f5f9]" align="start">
                              <div className="flex items-center border-b border-[#2a3a5c] px-3 py-2">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-[#94a3b8]" />
                                <input
                                  placeholder="Search template..."
                                  value={searchQueries[ev.id] || ""}
                                  onChange={(e) => setSearchQueries(prev => ({ ...prev, [ev.id]: e.target.value }))}
                                  className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-[#64748b] border-none text-[#f1f5f9]"
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto p-1 space-y-0.5">
                                <div
                                  onClick={() => {
                                    setSelectedTemplates(prev => {
                                      const copy = { ...prev };
                                      delete copy[ev.id];
                                      return copy;
                                    });
                                    updateSportFormEvent(form.id, ev.id, "categoryIds", undefined);
                                    setSearchQueries(prev => ({ ...prev, [ev.id]: "" }));
                                    setOpenDropdownEventId(null);
                                  }}
                                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#f97316]/10 hover:text-[#f97316] text-[#94a3b8] transition-colors"
                                >
                                  <span>Clear Selection</span>
                                  {!selectedTemplates[ev.id] && <Check className="w-3.5 h-3.5 text-[#f97316]" />}
                                </div>
                                {playerCategories
                                  .filter((cat) => {
                                    const q = (searchQueries[ev.id] || "").toLowerCase();
                                    return (
                                      cat.name.toLowerCase().includes(q) ||
                                      (cat.gender || "").toLowerCase().includes(q) ||
                                      String(cat.minAge).includes(q) ||
                                      String(cat.maxAge).includes(q)
                                    );
                                  })
                                  .map((cat) => {
                                    const isSelected = selectedTemplates[ev.id] === String(cat.id);
                                    return (
                                      <div
                                        key={cat.id}
                                        onClick={() => {
                                          setSelectedTemplates(prev => ({ ...prev, [ev.id]: String(cat.id) }));
                                          updateSportFormEvent(form.id, ev.id, "categoryIds", [cat.id]);
                                          // Autofill age rules if available
                                          if (cat.minAge != null) {
                                            updateSportFormEvent(form.id, ev.id, "minAge", String(cat.minAge));
                                          }
                                          if (cat.maxAge != null) {
                                            updateSportFormEvent(form.id, ev.id, "maxAge", String(cat.maxAge));
                                          }
                                          if (cat.gender) {
                                            updateSportFormEvent(form.id, ev.id, "gender", cat.gender);
                                          }
                                          setSearchQueries(prev => ({ ...prev, [ev.id]: "" }));
                                          setOpenDropdownEventId(null);
                                        }}
                                        className={cn(
                                          "flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                                          isSelected
                                            ? "bg-[#f97316]/20 text-[#f97316]"
                                            : "hover:bg-[#1a2540] hover:text-[#cbd5e1] text-[#94a3b8]"
                                        )}
                                      >
                                        <div className="flex flex-col gap-0.5">
                                          <span>{cat.name}</span>
                                          <span className="text-[10px] opacity-75 font-normal">
                                            {cat.gender || "All Genders"} • {cat.minAge ?? 0}–{cat.maxAge ?? 99} yrs
                                          </span>
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-[#f97316]" />}
                                      </div>
                                    );
                                  })}
                                {playerCategories.filter((cat) => {
                                  const q = (searchQueries[ev.id] || "").toLowerCase();
                                  return (
                                    cat.name.toLowerCase().includes(q) ||
                                    (cat.gender || "").toLowerCase().includes(q) ||
                                    String(cat.minAge).includes(q) ||
                                    String(cat.maxAge).includes(q)
                                  );
                                }).length === 0 && (
                                  <div className="text-center py-4 text-xs text-[#64748b] italic">No matching templates.</div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Config Row 3: Age Rules */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Min Age *</label>
                          <input
                            type="number"
                            value={ev.minAge}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "minAge", e.target.value)}
                            placeholder="e.g. 10"
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Max Age *</label>
                          <input
                            type="number"
                            value={ev.maxAge}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "maxAge", e.target.value)}
                            placeholder="e.g. 70"
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none"
                          />
                        </div>
                      </div>

                      {/* Participant Type (Singles, Doubles pills) or Min/Max Players (Teams) */}
                      {!isTeamSport(form.name) ? (
                        <div>
                          <label className="text-xs text-[#94a3b8] block mb-1.5 font-medium">Participant Type *</label>
                          <div className="flex gap-2 flex-wrap">
                            {["SINGLES", "DOUBLES", "MIXED_DOUBLES"].map(formatType => {
                              const list = ev.formats || [];
                              const isSelected = list.includes(formatType);
                              return (
                                <button
                                  key={formatType}
                                  type="button"
                                  onClick={() => {
                                    let next = [...list];
                                    if (isSelected) {
                                      next = next.filter(x => x !== formatType);
                                    } else {
                                      next.push(formatType);
                                    }
                                    updateSportFormEvent(form.id, ev.id, "formats", next);
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 border text-xs font-semibold rounded-full cursor-pointer transition-all",
                                    isSelected
                                      ? "bg-[#f97316]/15 border-[#f97316] text-[#f97316] shadow-sm shadow-[#f97316]/5"
                                      : "border-[#2a3a5c] bg-[#0c1220] text-[#94a3b8] hover:border-[#475569]/50"
                                  )}
                                >
                                  {formatType.replace(/_/g, ' ')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Min Players/Team *</label>
                            <input
                              type="number"
                              value={ev.minPlayers}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "minPlayers", e.target.value)}
                              placeholder="e.g. 5"
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#94a3b8] block mb-1 font-medium">Max Players/Team *</label>
                            <input
                              type="number"
                              value={ev.maxPlayers}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "maxPlayers", e.target.value)}
                              placeholder="e.g. 11"
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add sub-event configuration trigger button */}
                {!form.editingSportId && (
                  <button
                    type="button"
                    onClick={() => addEventToSportForm(form.id)}
                    className="w-full py-2.5 mt-3 border border-dashed border-[#f97316]/30 hover:border-[#f97316]/60 bg-[#f97316]/5 hover:bg-[#f97316]/10 text-[#f97316] text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Event Configuration
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Submission and Save Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetSportForm}
              className="flex-1 py-3 bg-transparent border border-[#2a3a5c] text-[#94a3b8] text-sm font-medium rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSportSave}
              disabled={sportSubmitting}
              className="flex-[2] py-3 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-70 text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              {sportSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (sportForms.some(f => f.editingSportId) ? "Update Event" : "Save Event ↗")}
            </button>
          </div>
        </div>
      )}

      {/* List of active scheduled sports events */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-6">
        <h3 className="text-sm font-bold text-[#f1f5f9] uppercase tracking-wider mb-4 border-b border-[#2a3a5c]/60 pb-2">Scheduled Community Events</h3>
        {activeEvents.length === 0 ? (
          <div className="text-center py-10 text-[#94a3b8]">No community events scheduled yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activeEvents.map(e => {
              const iconUrl = e.sport?.iconUrl || e.iconUrl;
              const icon = e.sport?.icon || e.icon || "🏆";
              const startStr = e.eventDateStart ? format(new Date(e.eventDateStart), "MMM d") : "";
              const endStr = e.eventDateEnd ? format(new Date(e.eventDateEnd), "MMM d, yyyy") : "";
              
              return (
                <div key={e.id} className="p-4 rounded-xl transition-all duration-300 flex flex-col justify-between bg-[#0c1220] border border-[#2a3a5c] hover:border-[#f97316]/50">
                  <div className="flex gap-3">
                    {iconUrl ? (
                      <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-slate-800/40 border border-[#2a3a5c] shadow-sm">
                        <img src={iconUrl} alt={e.name} className="w-7 h-7 object-cover rounded" />
                      </div>
                    ) : (
                      <span className="text-2xl leading-none">{icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#f1f5f9] truncate leading-snug">{e.name}</h4>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                          {e.format || "SINGLES"}
                        </span>
                        <span className="text-[9px] bg-orange-500/10 text-[#f97316] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                          {e.tournamentType ? e.tournamentType.replace(/_/g, ' ') : "KNOCKOUT"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 mt-3">
                        <div className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#f97316]" />
                          <span>{startStr} - {endStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
                          <Users className="w-3.5 h-3.5 text-[#f97316]" />
                          <span>{e.gender || "ALL"} • {e.minAge || 10}-{e.maxAge || 70} Yrs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#2a3a5c]/40">
                    <button
                      type="button"
                      onClick={() => handleSportEdit(e)}
                      className="p-1.5 hover:bg-[#1a2540] text-[#94a3b8] hover:text-[#f97316] rounded-md transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1 text-xs"
                      title="Edit Event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSportDelete(e.id)}
                      className="p-1.5 hover:bg-[#1a2540] text-[#94a3b8] hover:text-[#ef4444] rounded-md transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1 text-xs"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
