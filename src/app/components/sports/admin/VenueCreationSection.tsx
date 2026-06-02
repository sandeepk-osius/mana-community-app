import { Plus, Clock, Users, Trash2, MapPin, Edit2, EyeOff, Eye, Loader2 } from "lucide-react";
import { TIME_OPTIONS } from "../../../../constants/timeOptions";
import type { Venue, CommunityResponse, Court } from "../../../../types/api";

interface VenueCreationSectionProps {
  user: any;
  communities: CommunityResponse[];
  venueCommunities: CommunityResponse[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  showVenueForm: boolean;
  setShowVenueForm: (val: boolean) => void;
  editingVenueId: number | null;
  venueName: string;
  setVenueName: (val: string) => void;
  venueType: string;
  setVenueType: (val: string) => void;
  venueCommId: number | "";
  setVenueCommId: (val: number | "") => void;
  venueAddress: string;
  setVenueAddress: (val: string) => void;
  venueCity: string;
  setVenueCity: (val: string) => void;
  venueArea: string;
  setVenueArea: (val: string) => void;
  venueCapacity: string;
  setVenueCapacity: (val: string) => void;
  venuePinCode: string;
  setVenuePinCode: (val: string) => void;
  venueMapLink: string;
  setVenueMapLink: (val: string) => void;
  venueOpeningTime: string;
  setVenueOpeningTime: (val: string) => void;
  venueClosingTime: string;
  setVenueClosingTime: (val: string) => void;
  contactName: string;
  setContactName: (val: string) => void;
  contactNumber: string;
  setContactNumber: (val: string) => void;
  contactEmail: string;
  setContactEmail: (val: string) => void;
  courts: Court[];
  addCourt: () => void;
  removeCourt: (index: number) => void;
  updateCourt: (index: number, field: any, value: string) => void;
  venueSubmitting: boolean;
  resetVenueForm: () => void;
  handleVenueSave: () => void;
  venues: Venue[];
  hiddenVenues: Set<number>;
  handleVenueEdit: (v: Venue) => void;
  handleVenueHide: (id: number) => void;
  handleVenueDelete: (id: number) => void;
}

export function VenueCreationSection({
  user,
  communities,
  venueCommunities,
  activeTab,
  setActiveTab,
  showVenueForm,
  setShowVenueForm,
  editingVenueId,
  venueName,
  setVenueName,
  venueType,
  setVenueType,
  venueCommId,
  setVenueCommId,
  venueAddress,
  setVenueAddress,
  venueCity,
  setVenueCity,
  venueArea,
  setVenueArea,
  venueCapacity,
  setVenueCapacity,
  venuePinCode,
  setVenuePinCode,
  venueMapLink,
  setVenueMapLink,
  venueOpeningTime,
  setVenueOpeningTime,
  venueClosingTime,
  setVenueClosingTime,
  contactName,
  setContactName,
  contactNumber,
  setContactNumber,
  contactEmail,
  setContactEmail,
  courts,
  addCourt,
  removeCourt,
  updateCourt,
  venueSubmitting,
  resetVenueForm,
  handleVenueSave,
  venues,
  hiddenVenues,
  handleVenueEdit,
  handleVenueHide,
  handleVenueDelete,
}: VenueCreationSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#f1f5f9]">Venue Management</h1>
          <p className="text-sm text-[#94a3b8] mt-1">Create, edit, and manage your community venues</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { resetVenueForm(); setShowVenueForm(!showVenueForm); }}
            className="px-4 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> {showVenueForm ? "Cancel" : "New Venue"}
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className="px-4 py-2 text-sm text-[#94a3b8] border border-[#2a3a5c] rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors bg-transparent cursor-pointer"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Venue Create/Edit Form */}
      {showVenueForm && (
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4 space-y-4">
          <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest">
            {editingVenueId ? "Edit Venue" : "Create New Venue"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Venue Name *</label>
              <input value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Community Sports Ground" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Venue Type</label>
              <select value={venueType} onChange={e => { setVenueType(e.target.value); setVenueCommId(""); }} className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none">
                <option value="">Select</option>
                <option value="COMMUNITY">Community</option>
                <option value="APARTMENT">Apartment</option>
                <option value="OUTSIDE">Outside</option>
              </select>
            </div>
            {venueType !== "OUTSIDE" && user?.role === "SUPER_ADMIN" && (
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1.5">Community</label>
                <select value={venueCommId} onChange={e => setVenueCommId(e.target.value ? Number(e.target.value) : "")} className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none">
                  <option value="">Select Community...</option>
                  {venueCommunities.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Address</label>
              <input value={venueAddress} onChange={e => setVenueAddress(e.target.value)} placeholder="Street address" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">City</label>
              <input value={venueCity} onChange={e => setVenueCity(e.target.value)} placeholder="City" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Area</label>
              <input value={venueArea} onChange={e => setVenueArea(e.target.value)} placeholder="Area / Locality" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Capacity</label>
              <input type="number" value={venueCapacity} onChange={e => setVenueCapacity(e.target.value)} placeholder="e.g. 200" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Pin / Zip code</label>
              <input value={venuePinCode} onChange={e => setVenuePinCode(e.target.value)} placeholder="Pin or Zip code" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[#94a3b8] block mb-1.5">Map Link</label>
              <input value={venueMapLink} onChange={e => setVenueMapLink(e.target.value)} placeholder="https://maps.google.com/..." className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            <div className="md:col-span-2 border border-[#2a3a5c] rounded-xl p-4 space-y-3 bg-[#0c1220]/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f97316]" />
                <span className="text-sm font-medium text-[#f1f5f9]">Timings</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1.5">
                    Opening Time <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={venueOpeningTime}
                    onChange={e => setVenueOpeningTime(e.target.value)}
                    required
                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1.5">
                    Closing Time <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={venueClosingTime}
                    onChange={e => setVenueClosingTime(e.target.value)}
                    required
                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="md:col-span-2 border-t border-[#2a3a5c] pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-[#f97316]" />
                <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">Contact Information</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1.5">Contact Name *</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1.5">Contact Number *</label>
                  <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="e.g. +91 9876543210" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1.5">Contact Email *</label>
                  <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="e.g. john@example.com" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                </div>
              </div>
            </div>

            {/* Courts Section */}
            <div className="md:col-span-2 border-t border-[#2a3a5c] pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#f97316]" />
                  <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">Courts</span>
                  {courts.length > 0 && (
                    <span className="bg-[#f97316]/20 text-[#f97316] px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {courts.length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addCourt}
                  className="px-2.5 py-1 bg-[#f97316]/10 hover:bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/20 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Court
                </button>
              </div>

              {courts.length === 0 ? (
                <p className="text-xs text-[#475569] italic">No courts added yet. Click 'Add Court' to define courts for this venue.</p>
              ) : (
                <div className="space-y-2">
                  {courts.map((court, index) => (
                    <div key={index} className="flex items-center gap-3 bg-[#0c1220]/50 p-2.5 rounded-xl border border-[#1e293b] transition-all hover:border-[#f97316]/30">
                      <span className="text-xs font-semibold text-[#475569] w-5 text-center">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={court.name}
                          onChange={e => updateCourt(index, "name", e.target.value)}
                          placeholder="Court Name (e.g. Court 1, Badminton Court A)"
                          className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2.5 py-1">
                        <span className="text-[10px] text-[#94a3b8]">Color</span>
                        <input
                          type="color"
                          value={court.color}
                          onChange={e => updateCourt(index, "color", e.target.value)}
                          className="w-6 h-6 border-0 bg-transparent rounded cursor-pointer outline-none p-0 flex-shrink-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCourt(index)}
                        className="p-2 border border-[#2a3a5c] text-[#ef4444]/60 rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all cursor-pointer bg-transparent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            {editingVenueId && (
              <button onClick={resetVenueForm} className="flex-1 py-3 bg-transparent border border-[#2a3a5c] text-[#94a3b8] text-sm font-medium rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] cursor-pointer transition-colors">Cancel</button>
            )}
            <button onClick={handleVenueSave} disabled={venueSubmitting} className="flex-[2] py-3 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-70 text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2">
              {venueSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingVenueId ? "Update Venue" : "Create Venue ↗")}
            </button>
          </div>
        </div>
      )}

      {/* Venue List */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
        <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>All Venues</span>
          <span className="bg-[#f97316]/20 text-[#f97316] px-2 py-0.5 rounded text-[10px]">{venues.length}</span>
        </div>
        <div className="space-y-2">
          {venues.filter(v => !hiddenVenues.has(v.id)).map(v => (
            <div key={v.id} className="flex flex-col gap-2 p-3 bg-[#0c1220] rounded-xl border border-[#1e293b]">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[#f1f5f9] truncate flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#f97316] flex-shrink-0" /> {v.name}
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5 ml-5.5">
                    {[v.area, v.city, v.pinCode].filter(Boolean).join(", ") || "No location details"}
                    {v.capacity ? ` · Capacity: ${v.capacity}` : ""}
                    {(v.openingTime || v.closingTime) && (
                      <> · {v.openingTime || '—'} – {v.closingTime || '—'}</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {v.venueType && (
                    <span className={`text-[10px] px-2 py-1 rounded ${v.venueType === "OUTSIDE" ? "bg-blue-500/20 text-[#3b82f6]" : "bg-green-500/20 text-[#10b981]"}`}>{v.venueType}</span>
                  )}
                  <button onClick={() => handleVenueEdit(v)} className="text-[10px] px-2 py-1.5 border border-[#2a3a5c] text-[#94a3b8] rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors flex items-center gap-1 cursor-pointer bg-transparent">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleVenueHide(v.id)} className="text-[10px] px-2 py-1.5 border border-[#2a3a5c] text-[#94a3b8] rounded-lg hover:border-[#eab308] hover:text-[#eab308] transition-colors flex items-center gap-1 cursor-pointer bg-transparent">
                    <EyeOff className="w-3 h-3" /> Hide
                  </button>
                  <button onClick={() => handleVenueDelete(v.id)} className="text-[10px] px-2 py-1.5 border border-[#2a3a5c] text-[#ef4444]/60 rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] transition-colors flex items-center gap-1 cursor-pointer bg-transparent">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>

              {/* Courts list & Contact info display inside card */}
              {((v.courts && v.courts.length > 0) || v.contactName) && (
                <div className="mt-1 ml-5.5 flex flex-wrap items-center gap-3 border-t border-[#1e293b]/60 pt-2">
                  {v.contactName && (
                    <span className="text-[10px] text-[#94a3b8] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#64748b]" /> Contact: <strong className="text-[#f1f5f9]">{v.contactName}</strong> ({v.contactNumber}) {v.contactEmail && <span className="text-[#64748b]">· {v.contactEmail}</span>}
                    </span>
                  )}
                  {v.courts && v.courts.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                      <span className="text-[9px] text-[#64748b] uppercase tracking-wider font-bold">Courts:</span>
                      {v.courts.map((court, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold text-white flex items-center gap-1 shadow-sm"
                          style={{ backgroundColor: court.color || "#475569" }}
                        >
                          {court.name || `Court ${i + 1}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {hiddenVenues.size > 0 && (
            <div className="border-t border-[#2a3a5c] pt-3 mt-3">
              <div className="text-[10px] text-[#475569] uppercase tracking-widest mb-2">Hidden Venues ({hiddenVenues.size})</div>
              {venues.filter(v => hiddenVenues.has(v.id)).map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-[#0c1220]/50 rounded-xl border border-[#1e293b] opacity-60 mb-2">
                  <div className="text-sm text-[#94a3b8] truncate flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {v.name}
                  </div>
                  <button onClick={() => handleVenueHide(v.id)} className="text-[10px] px-2 py-1.5 border border-[#2a3a5c] text-[#94a3b8] rounded-lg hover:border-[#10b981] hover:text-[#10b981] transition-colors flex items-center gap-1 cursor-pointer bg-transparent">
                    <Eye className="w-3 h-3" /> Show
                  </button>
                </div>
              ))}
            </div>
          )}
          {venues.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="w-8 h-8 text-[#2a3a5c] mx-auto mb-2" />
              <div className="text-sm text-[#475569] italic">No venues yet. Create your first venue above.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
