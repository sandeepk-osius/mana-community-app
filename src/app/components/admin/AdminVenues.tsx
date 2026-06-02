import { useState, useEffect } from "react";
import { Loader2, Edit2, Trash2, MapPin, Building2, Users, ArrowLeft, Plus, ExternalLink, Clock } from "lucide-react";
import { TIME_OPTIONS } from "../../../constants/timeOptions";
import { Link } from "react-router";
import { toast } from "sonner";
import { venueService } from "../../../services/venueService";
import { communityService } from "../../../services/communityService";
import { useAuth } from "../../../contexts/AuthContext";
import type { Venue, CommunityResponse } from "../../../types/api";

export function AdminVenues() {
  const { user, isAdmin } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00 AM");
  const [closingTime, setClosingTime] = useState("08:00 PM");
  const [venueType, setVenueType] = useState("COMMUNITY");
  const [venueCategory, setVenueCategory] = useState("APARTMENT");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const isSuperAdmin = user.role === "SUPER_ADMIN";
      const targetCommunityId = isSuperAdmin ? null : (user.communityId ?? null);
      fetchVenues(targetCommunityId);
    } else {
      setLoading(false);
    }

    // Fetch all communities for the category dropdown
    communityService.getCommunities().then(setCommunities).catch(() => { });
  }, [user]);

  // Refetch communities when venueType changes to filter categories
  useEffect(() => {
    if (venueType && venueType !== "OUTSIDE") {
      communityService.getCommunities(venueType)
        .then(setCommunities)
        .catch(() => setCommunities([]));
    } else {
      // For Outside venues, maybe show all or a specific set
      communityService.getCommunities()
        .then(setCommunities)
        .catch(() => setCommunities([]));
    }
  }, [venueType]);

  const fetchVenues = async (communityId?: number | null) => {
    try {
      setLoading(true);
      const data = await venueService.getVenues(communityId);
      setVenues(data);
    } catch (err) {
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setAddress("");
    setCity("");
    setArea("");
    setMapLink("");
    setCapacity("");
    setPinCode("");
    setOpeningTime("08:00 AM");
    setClosingTime("08:00 PM");
    setVenueType("COMMUNITY");
    setVenueCategory("APARTMENT");
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (v: Venue) => {
    setName(v.name);
    setAddress(v.address || "");
    setCity(v.city || "");
    setArea(v.area || "");
    setMapLink(v.mapLink || "");
    setCapacity(v.capacity ? v.capacity.toString() : "");
    setPinCode(v.pinCode || "");
    setOpeningTime(v.openingTime || "08:00 AM");
    setClosingTime(v.closingTime || "08:00 PM");
    setVenueType(v.venueType || "COMMUNITY");
    setVenueCategory(v.venueCategory || "APARTMENT");
    setEditingId(v.id);
    setIsEditing(true);
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this venue? This might affect existing events.")) return;
    try {
      await venueService.deleteVenue(id);
      toast.success("Venue deleted successfully");
      const isSuperAdmin = user?.role === "SUPER_ADMIN";
      const targetCommunityId = isSuperAdmin ? null : (user?.communityId ?? null);
      fetchVenues(targetCommunityId);
    } catch (err) {
      toast.error("Failed to delete venue");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Venue name is required");
      return;
    }
    if (!openingTime) {
      toast.error("Opening time is required");
      return;
    }
    if (!closingTime) {
      toast.error("Closing time is required");
      return;
    }
    if (!user?.userId) {
      toast.error("User ID is missing.");
      return;
    }

    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isAdmin) {
      toast.error("You do not have permission to save venues.");
      return;
    }

    // Determine target community: use user's ID, or resolve from selected community name if super admin
    let targetCommunityId = user?.communityId;
    
    if (!targetCommunityId && isSuperAdmin && venueType !== "OUTSIDE") {
      const matchedCommunity = communities.find(c => c.name === venueCategory);
      if (matchedCommunity) {
        targetCommunityId = matchedCommunity.id;
      }
    }

    if (targetCommunityId == null && venueType !== "OUTSIDE") {
      toast.error("Community ID is required for community venues.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name,
        address,
        city,
        area,
        mapLink,
        capacity: (capacity && !isNaN(parseInt(capacity))) ? parseInt(capacity) : undefined,
        openingTime,
        closingTime,
        venueType,
        venueCategory,
        pinCode
      };

      console.log("Submitting venue payload:", payload);

      if (isEditing && editingId) {
        await venueService.updateVenue(editingId, payload);
        toast.success("Venue updated successfully!");
      } else {
        await venueService.createVenue(targetCommunityId, payload);
        toast.success("New venue created!");
      }
      resetForm();
      const isSuperAdminUser = user?.role === "SUPER_ADMIN";
      const fetchCommunityId = isSuperAdminUser ? null : (user?.communityId ?? null);
      fetchVenues(fetchCommunityId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save venue details";
      toast.error(msg);
      console.error("Venue save error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1220] text-[#f1f5f9] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link to="/sports/admin" className="text-xs text-[#94a3b8] hover:text-[#f97316] flex items-center gap-1 mb-2 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Admin
            </Link>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">
              Venue Management
            </h1>
            <p className="text-[#94a3b8] text-sm">Configure locations for your sports community events.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-[#141c2e] border border-[#2a3a5c] rounded-xl">
              <span className="text-xs text-[#94a3b8] block leading-none mb-1">Total Venues</span>
              <span className="text-lg font-bold text-[#f97316]">{venues.length}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-4">
            <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl p-6 sticky top-8 shadow-xl shadow-black/20">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-lg text-[#f97316]">
                  {isEditing ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <h2 className="text-lg font-semibold">{isEditing ? "Edit Venue" : "Add New Venue"}</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">Venue Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors"
                      placeholder="e.g. Community Main Ground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors"
                      placeholder="e.g. Near Community Hall, Sector 12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">City</label>
                    <input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors"
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">Area</label>
                    <input
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors"
                      placeholder="e.g. Bandra"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">Capacity</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                      <input
                        type="number"
                        value={capacity}
                        onChange={e => setCapacity(e.target.value)}
                        className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors"
                        placeholder="500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">Pin / Zip code</label>
                    <input
                      value={pinCode}
                      onChange={e => setPinCode(e.target.value)}
                      className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors"
                      placeholder="Pin or Zip code"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">Google Maps Link</label>
                  <input
                    value={mapLink}
                    onChange={e => setMapLink(e.target.value)}
                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors"
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div className="border border-[#2a3a5c] rounded-xl p-4 space-y-4 bg-[#0c1220]/40">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#f97316]" />
                    <span className="text-sm font-semibold text-[#f1f5f9]">Timings</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">
                        Opening Time <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={openingTime}
                        onChange={e => setOpeningTime(e.target.value)}
                        required
                        className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors appearance-none"
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">
                        Closing Time <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={closingTime}
                        onChange={e => setClosingTime(e.target.value)}
                        required
                        className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors appearance-none"
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">Venue Type</label>
                  <select
                    value={venueType}
                    onChange={e => {
                      setVenueType(e.target.value);
                    }}
                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors appearance-none"
                  >
                    <option value="">Select</option>
                    <option value="APARTMENT">Apartment / Society</option>
                    <option value="COLLEGE">College / University</option>
                    <option value="SCHOOL">School</option>
                    <option value="OFFICE">Office / Corporate</option>
                    <option value="CLUB">Sports Club / Gym</option>
                    <option value="OUTSIDE">Outside Venue</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1.5 ml-1">Venue Category / Community *</label>
                  <select
                    value={venueCategory}
                    onChange={e => setVenueCategory(e.target.value)}
                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 text-sm focus:border-[#f97316] outline-none transition-colors appearance-none"
                  >
                    <option value="">Select Community...</option>
                    {communities.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {venueType === "OUTSIDE" && (
                      <>
                        <option value="SPORTS_VENUE">Professional Sports Venue</option>
                        <option value="PUBLIC_PARK">Public Park / Ground</option>
                        <option value="PRIVATE_GROUND">Private Sports Ground</option>
                        <option value="OTHER">Other</option>
                      </>
                    )}
                  </select>
                  <p className="text-[10px] text-[#475569] mt-1 ml-1">Showing {venueType === 'OUTSIDE' ? 'all' : venueType.toLowerCase()} communities</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={submitting}
                    className="flex-1 bg-[#f97316] hover:bg-[#ea580c] active:scale-95 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? "Update Details" : "Save Venue")}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-3 bg-[#1a2540] hover:bg-[#2a3a5c] text-[#94a3b8] rounded-xl text-sm font-medium transition-colors border border-[#2a3a5c]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* List Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
              <div className="p-6 border-b border-[#2a3a5c] bg-[#1a2540]/50 flex justify-between items-center">
                <h2 className="font-semibold text-lg">Existing Venues</h2>
                <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active</span>
                </div>
              </div>

              {loading ? (
                <div className="p-20 text-center text-[#94a3b8] flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#f97316]" />
                  <p className="animate-pulse">Fetching venues...</p>
                </div>
              ) : venues.length === 0 ? (
                <div className="p-20 text-center text-[#475569] flex flex-col items-center">
                  <Building2 className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-1">No Venues Registered</p>
                  <p className="text-sm max-w-xs">Register your first sports venue using the form on the left to start organizing events.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2a3a5c]">
                  {venues.map(v => (
                    <div key={v.id} className="p-6 hover:bg-[#1a2540]/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#f1f5f9] group-hover:text-[#f97316] transition-colors">{v.name}</h3>
                          {v.capacity && (
                            <span className="text-[10px] bg-[#0c1220] border border-[#2a3a5c] text-[#94a3b8] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Users className="w-2 h-2" /> {v.capacity}
                            </span>
                          )}
                          {v.venueType && (
                            <span className={`text-[10px] border px-2 py-0.5 rounded-full flex items-center gap-1 ${v.venueType === 'OUTSIDE'
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              }`}>
                              {v.venueType === 'OUTSIDE' ? 'Outside' : v.venueType.charAt(0) + v.venueType.slice(1).toLowerCase()}
                            </span>
                          )}
                          {v.venueCategory && (
                            <span className="text-[10px] bg-[#1a2540] border border-[#2a3a5c] text-[#94a3b8] px-2 py-0.5 rounded-full">
                              {v.venueCategory.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          {(v.address || v.area || v.city || v.pinCode) && (
                            <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                              <MapPin className="w-3 h-3" />
                              <span>
                                {v.address}{v.area ? `, ${v.area}` : ''}{v.city ? `, ${v.city}` : ''}{v.pinCode ? ` - ${v.pinCode}` : ''}
                              </span>
                            </div>
                          )}
                          {(v.openingTime || v.closingTime) && (
                            <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                              <Clock className="w-3 h-3" />
                              <span>
                                {v.openingTime || '—'} – {v.closingTime || '—'}
                              </span>
                            </div>
                          )}
                          {v.mapLink && (
                            <a
                              href={v.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#3b82f6] hover:underline flex items-center gap-1 w-fit"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> View on Google Maps
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(v)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2540] hover:bg-[#2a3a5c] text-xs font-medium text-[#f1f5f9] rounded-lg border border-[#2a3a5c] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-500 rounded-lg border border-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 flex items-start gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl text-[#f97316]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-[#f97316] mb-1 text-sm">Organizing many events?</h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Venues are shared across all sports in your community. Once a venue is created here, it will appear in the dropdown when creating any new Sports Event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

