import { Plus, Loader2, Users, Edit2, Trash2 } from "lucide-react";
import type { PlayerCategory, CommunityResponse } from "../../../../types/api";

interface PlayerCategorySectionProps {
  user: any;
  communities: CommunityResponse[];
  playerCategories: PlayerCategory[];
  showCategoryForm: boolean;
  setShowCategoryForm: (val: boolean) => void;
  editingCategoryId: number | null;
  categoryName: string;
  setCategoryName: (val: string) => void;
  categoryType: string;
  setCategoryType: (val: string) => void;
  categoryGender: string;
  setCategoryGender: (val: string) => void;
  categoryMinAge: string;
  setCategoryMinAge: (val: string) => void;
  categoryMaxAge: string;
  setCategoryMaxAge: (val: string) => void;
  categoryCommId: number | "";
  setCategoryCommId: (val: number | "") => void;
  categoryDescription: string;
  setCategoryDescription: (val: string) => void;
  categorySubmitting: boolean;
  resetCategoryForm: () => void;
  handleCategorySave: () => void;
  handleCategoryEdit: (c: PlayerCategory) => void;
  handleCategoryDelete: (id: number) => void;
  setActiveTab: (tab: any) => void;
}

export function PlayerCategorySection({
  user,
  communities,
  playerCategories,
  showCategoryForm,
  setShowCategoryForm,
  editingCategoryId,
  categoryName,
  setCategoryName,
  categoryType,
  setCategoryType,
  categoryGender,
  setCategoryGender,
  categoryMinAge,
  setCategoryMinAge,
  categoryMaxAge,
  setCategoryMaxAge,
  categoryCommId,
  setCategoryCommId,
  categoryDescription,
  setCategoryDescription,
  categorySubmitting,
  resetCategoryForm,
  handleCategorySave,
  handleCategoryEdit,
  handleCategoryDelete,
  setActiveTab,
}: PlayerCategorySectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#f1f5f9]">Player Categories</h1>
          <p className="text-sm text-[#94a3b8] mt-1">Manage player categories for events and tournaments</p>
        </div>
        <div className="flex items-center gap-3">
          {["SUPER_ADMIN", "ADMIN", "SPORTS_ADMIN"].includes(user?.role || "") && (
            <button
              onClick={() => { resetCategoryForm(); setShowCategoryForm(!showCategoryForm); }}
              className="px-4 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" /> {showCategoryForm ? "Cancel" : "New Category"}
            </button>
          )}
          <button
            onClick={() => setActiveTab("dashboard")}
            className="px-4 py-2 text-sm text-[#94a3b8] border border-[#2a3a5c] rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors bg-transparent cursor-pointer"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Category Create/Edit Form */}
      {showCategoryForm && (
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4 space-y-4">
          <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest">
            {editingCategoryId ? "Edit Category" : "Create New Category"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Category Name *</label>
              <input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="e.g. Men's Open" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Category Type *</label>
              <select value={categoryType} onChange={e => setCategoryType(e.target.value)} className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none">
                <option value="">Select...</option>
                <option value="MENS">MENS</option>
                <option value="WOMENS">WOMENS</option>
                <option value="BOYS">BOYS</option>
                <option value="GIRLS">GIRLS</option>
                <option value="KIDS">KIDS</option>
                <option value="SENIORS">SENIORS</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Gender *</label>
              <select value={categoryGender} onChange={e => setCategoryGender(e.target.value)} className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none">
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="ALL">All</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Min Age *</label>
              <input type="number" value={categoryMinAge} onChange={e => setCategoryMinAge(e.target.value)} placeholder="e.g. 18" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Max Age *</label>
              <input type="number" value={categoryMaxAge} onChange={e => setCategoryMaxAge(e.target.value)} placeholder="e.g. 45" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
            {user?.role === "SUPER_ADMIN" && (
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1.5">Community</label>
                <select value={categoryCommId} onChange={e => setCategoryCommId(e.target.value ? Number(e.target.value) : "")} className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none">
                  <option value="">All Communities</option>
                  {communities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-3">
              <label className="text-xs text-[#94a3b8] block mb-1.5">Description</label>
              <input value={categoryDescription} onChange={e => setCategoryDescription(e.target.value)} placeholder="Brief description of this category" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            {editingCategoryId && (
              <button onClick={resetCategoryForm} className="flex-1 py-3 bg-transparent border border-[#2a3a5c] text-[#94a3b8] text-sm font-medium rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] cursor-pointer transition-colors">Cancel</button>
            )}
            <button onClick={handleCategorySave} disabled={categorySubmitting} className="flex-[2] py-3 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-70 text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2">
              {categorySubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingCategoryId ? "Update Category" : "Create Category ↗")}
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4">
        <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>All Categories</span>
          <span className="bg-[#f97316]/20 text-[#f97316] px-2 py-0.5 rounded text-[10px]">{playerCategories.length}</span>
        </div>
        <div className="space-y-2">
          {playerCategories.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-[#0c1220] rounded-xl border border-[#1e293b]">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[#f1f5f9] truncate flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#f97316] flex-shrink-0" /> {c.name}
                </div>
                <div className="text-[10px] text-[#64748b] mt-0.5 ml-[22px] flex items-center gap-2">
                  {c.description && <span>{c.description}</span>}
                  {c.description && (c.minAge != null || c.gender) && <span>·</span>}
                  {c.minAge != null && c.maxAge != null && <span>Age: {c.minAge}–{c.maxAge}</span>}
                  {c.gender && <span>· {c.gender}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {c.categoryType && (
                  <span className="text-[10px] px-2 py-1 rounded bg-[#3b82f6]/20 text-[#3b82f6]">{c.categoryType}</span>
                )}
                {c.type && (
                  <span className={`text-[10px] px-2 py-1 rounded ${c.type === "DEFAULT" ? "bg-[#10b981]/20 text-[#10b981]" : "bg-[#f97316]/20 text-[#f97316]"}`}>{c.type}</span>
                )}
                {/* SUPER_ADMIN: full access to all categories */}
                {/* ADMIN/SPORTS_ADMIN: can only edit/delete USER type (their community's), not DEFAULT */}
                {(user?.role === "SUPER_ADMIN" || (["ADMIN", "SPORTS_ADMIN"].includes(user?.role || "") && c.type !== "DEFAULT")) && (
                  <>
                    <button onClick={() => handleCategoryEdit(c)} className="text-[10px] px-2 py-1.5 border border-[#2a3a5c] text-[#94a3b8] rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors flex items-center gap-1 cursor-pointer bg-transparent">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleCategoryDelete(c.id)} className="text-[10px] px-2 py-1.5 border border-[#2a3a5c] text-[#ef4444]/60 rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] transition-colors flex items-center gap-1 cursor-pointer bg-transparent">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {playerCategories.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-[#2a3a5c] mx-auto mb-2" />
              <div className="text-sm text-[#475569] italic">No player categories yet. Create your first category above.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
