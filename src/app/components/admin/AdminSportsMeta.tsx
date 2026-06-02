import { useState, useEffect } from "react";
import { Loader2, Edit2, Trash2, ArrowLeft, Plus, X, Search, CheckCircle, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { sportsService } from "../../../services/sportsService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportMeta, MatchFormat } from "../../../types/api";
import { cn } from "../ui/utils";

const PREDEFINED_EMOJIS = ["🏏", "⚽", "🏸", "🏀", "🏐", "🎱", "🎳", "🎯", "♟️", "🚴", "🏃", "🏊", "🏓", "🎾", "🤾", "🪢", "🏆", "🎮", "🏹", "🥊"];

export interface AdminSportsMetaProps {
  isTab?: boolean;
}

export function AdminSportsMeta({ isTab = false }: AdminSportsMetaProps) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [sports, setSports] = useState<SportMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏆");
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<MatchFormat[]>(["SINGLES"]);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      if (!isTab) {
        toast.error("Administrative privileges required");
        navigate("/");
      }
      return;
    }
    fetchSports();
  }, [isAdmin, isTab]);

  const fetchSports = async () => {
    try {
      setLoading(true);
      const data = await sportsService.getSportsMeta();
      // Wait, getSportsMeta fetches active true, let's just use it or whatever the endpoint returns
      setSports(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sports metadata list");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sport: SportMeta) => {
    setEditingId(sport.id);
    setName(sport.name);
    setIcon(sport.icon || "🏆");
    setIconUrl(sport.iconUrl || null);
    setSelectedFormats(sport.formats || ["SINGLES"]);
    setActive(sport.active !== false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this sport meta?")) return;
    try {
      await sportsService.deleteSport(id);
      toast.success("Sport deactivated successfully");
      fetchSports();
    } catch (err) {
      toast.error("Failed to delete/deactivate sport");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setIcon("🏆");
    setIconUrl(null);
    setSelectedFormats(["SINGLES"]);
    setActive(true);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Sport name is required");
      return;
    }

    setSubmitting(true);
    if (selectedFormats.length === 0) {
      toast.error("Please select at least one format");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: name.trim(),
      icon: icon || "🏆",
      iconUrl: iconUrl || undefined,
      formats: selectedFormats,
      active
    };

    try {
      if (editingId) {
        await sportsService.updateSport(editingId, payload);
        toast.success("Sport updated successfully!");
      } else {
        await sportsService.createSport(payload);
        toast.success("Sport created successfully!");
      }
      resetForm();
      fetchSports();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save sport metadata");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error("Icon file size must be less than 500KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconUrl(reader.result as string);
        toast.success("Custom icon uploaded successfully");
      };
      reader.onerror = () => {
        toast.error("Failed to read icon file");
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredSports = sports.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.formats && s.formats.some(f => f.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {!isTab && (
            <button
              onClick={() => navigate("/admin")}
              className="p-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 font-['Bebas_Neue'] tracking-wide">
              SPORTS META MANAGEMENT
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Manage global sport categories and baseline rules in the system</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Sport Meta</>}
        </button>
      </div>

      {/* Inline Creation / Edition Form */}
      {showForm && (
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl p-6 shadow-2xl relative">
          <h3 className="text-sm font-bold text-[#f97316] uppercase tracking-widest border-b border-[#2a3a5c]/60 pb-2.5 mb-4">
            {editingId ? "Edit Sport Metadata" : "Create New Sport Meta"}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sport Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sport Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Pickleball, Box Cricket"
                  className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none"
                />
              </div>

              {/* Format selection and Status side-by-side */}
              <div className="space-y-2 md:col-span-2 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Default Formats * <span className="text-[10px] text-slate-500 lowercase font-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {(["SINGLES", "DOUBLES", "MIXED_DOUBLES", "TEAM"] as MatchFormat[]).map(fmt => {
                      const isSel = selectedFormats.includes(fmt);
                      const label = fmt === "SINGLES" ? "Singles" 
                                  : fmt === "DOUBLES" ? "Doubles" 
                                  : fmt === "MIXED_DOUBLES" ? "Mixed Doubles" 
                                  : "Team Sport";
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => {
                            setSelectedFormats(prev => {
                              if (prev.includes(fmt)) {
                                // Ensure at least one is selected
                                if (prev.length === 1) {
                                  toast.warning("Please select at least one format");
                                  return prev;
                                }
                                return prev.filter(f => f !== fmt);
                              } else {
                                return [...prev, fmt];
                              }
                            });
                          }}
                          className={cn(
                            "px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                            isSel
                              ? "bg-[#f97316]/10 border-[#f97316] text-[#f97316] shadow-sm shadow-[#f97316]/5"
                              : "bg-[#0c1220] border-[#2a3a5c] text-slate-400 hover:border-slate-500 hover:text-slate-300"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="space-y-1.5 flex flex-col justify-center pb-1 flex-shrink-0">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={e => setActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${active ? "bg-emerald-500" : "bg-[#1a2540]"} relative`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${active ? "translate-x-5" : ""}`} />
                      </div>
                    </label>
                    <span className="text-sm text-slate-300 font-medium">{active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Icon selection */}
            <div className="space-y-3 border-t border-[#2a3a5c]/60 pt-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sport Icon *</label>
                {iconUrl ? (
                  <div className="w-9 h-9 rounded-xl border border-[#2a3a5c] bg-[#0c1220] flex items-center justify-center overflow-hidden shadow-inner">
                    <img src={iconUrl} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                  </div>
                ) : (
                  <span className="text-xl px-2.5 py-0.5 bg-[#0c1220] rounded-xl border border-[#2a3a5c] shadow-inner">{icon}</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                {/* Standard Emojis */}
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Standard Emojis</span>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setIcon(emoji);
                          setIconUrl(null);
                        }}
                        className={`text-2xl p-2 rounded-xl border transition-all hover:scale-110 cursor-pointer ${
                          !iconUrl && icon === emoji 
                            ? "bg-orange-500/10 border-orange-500 text-orange-500" 
                            : "bg-[#0c1220] border-[#2a3a5c] hover:border-slate-500 text-slate-300"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                    {/* Custom Text Emoji input */}
                    <div className="flex items-center gap-2 bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-3 min-h-[46px]">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Text</span>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="🏆"
                        value={!iconUrl ? icon : ""}
                        onChange={e => {
                          setIcon(e.target.value || "🏆");
                          setIconUrl(null);
                        }}
                        className="w-8 bg-transparent text-center text-sm font-semibold border-none outline-none text-[#f1f5f9]"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom File Upload */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Custom Image Upload</span>
                  <div className="relative group min-h-[96px] bg-[#0c1220] border border-dashed border-[#2a3a5c] hover:border-[#f97316]/50 rounded-2xl flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Plus className="w-5 h-5 text-slate-500 group-hover:text-[#f97316] mb-1.5 transition-colors" />
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 block transition-colors">
                      {iconUrl ? "Change Custom Image" : "Upload Custom Icon"}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 block">PNG/JPG <span className="font-mono">&lt; 500KB</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-[#2a3a5c]/60 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-[#2a3a5c] bg-transparent cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg transition-all disabled:opacity-50 text-sm"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Update Metadata" : "Save Sport Meta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Listing Section */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
            System Sports <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">{filteredSports.length}</span>
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sports meta..."
              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl pl-10 pr-4 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none placeholder-slate-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-xs text-slate-400">Fetching sports meta configuration...</p>
          </div>
        ) : filteredSports.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No sports metadata configurations found.</p>
            <p className="text-xs text-slate-500 mt-1">Configure your first baseline sport by clicking "New Sport Meta" above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredSports.map(s => {
              const isEditable = s.communityId != null || user?.role === "SUPER_ADMIN";
              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${s.active ? "bg-[#0c1220] border-[#2a3a5c] hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5" : "bg-[#0c1220]/40 border-[#2a3a5c]/40 opacity-60"}`}
                >
                  <div className="flex items-center gap-4">
                    {s.iconUrl ? (
                      <div className="w-14 h-14 bg-slate-800/40 rounded-2xl border border-slate-700/60 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={s.iconUrl} alt={s.name} className="w-12 h-12 rounded-xl object-cover" />
                      </div>
                    ) : (
                      <span className="text-3xl leading-none px-3 py-2 bg-slate-800/40 rounded-2xl border border-slate-700/60 shadow-sm flex-shrink-0">
                        {s.icon || "🏆"}
                      </span>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{s.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
                          {s.formats?.join(", ") || "SINGLES"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide flex items-center gap-1 ${s.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {s.active ? "Active" : "Inactive"}
                        </span>
                        {s.communityId ? (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wide" title={`ID: ${s.communityId}`}>
                            {s.community?.name || `Community #${s.communityId}`}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
                            System Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isEditable ? (
                      <>
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-2 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/20 text-slate-400 hover:text-orange-400 rounded-xl transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-2 hover:bg-slate-800 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="px-2 py-1 bg-slate-800/40 border border-slate-700/40 text-slate-500 rounded-xl cursor-not-allowed flex items-center gap-1" title="System default sport (read-only)">
                        <span className="text-[8px] font-bold uppercase tracking-wider">Locked</span>
                      </div>
                    )}
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
