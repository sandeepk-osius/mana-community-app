import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
import { sportsService } from "../../../services/sportsService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportsEvent, PlayerCategory } from "../../../types/api";

export function SportsRegister() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSportsAdmin } = useAuth();
  const isAnyAdmin = isAdmin || isSportsAdmin;

  const [categories, setCategories] = useState<PlayerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    categoryId: "",
    matchType: "SINGLES",
    role: "",
    age: user?.dateOfBirth ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() : 25,
    matches: 0,
    runs: 0,
    wickets: 0,
    strikeRate: 0,
    avgScore: 0,
    regType: "self" as "self" | "family" | "other",
    playerName: user?.fullName || "",
    relation: "",
    flatNumber: ""
  });

  useEffect(() => {
    const loadDetails = async () => {
      try {
        // Fetch categories and maybe event info if we had an endpoint for it
        // For now we'll use the ones from the dashboard or a generic fetch
        const cats = await sportsService.getCategories();
        setCategories(cats);
        
        // Mock fetching event name if needed, or just use the ID
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load registration details");
        setLoading(false);
      }
    };
    loadDetails();
  }, []);

  // Update age when user profile loads
  useEffect(() => {
    if (user?.dateOfBirth) {
      const birthYear = new Date(user.dateOfBirth).getFullYear();
      const currentYear = new Date().getFullYear();
      setFormData(prev => ({ ...prev, age: currentYear - birthYear }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    setSubmitting(true);
    try {
      // Map string category value to backend ID
      const selectedCat = categories.find(c => {
        const normalizedName = c.name.toUpperCase().replace(/\s/g, '_');
        return normalizedName === formData.categoryId || normalizedName.includes(formData.categoryId);
      });
      
      const finalCategoryId = selectedCat ? selectedCat.id : (categories.length > 0 ? categories[0].id : 1);

      await sportsService.registerForEvent({
        eventId: Number(eventId),
        categoryId: finalCategoryId,
        matchType: formData.matchType,
        role: formData.role,
        age: formData.age,
        matches: formData.matches,
        runs: formData.runs,
        wickets: formData.wickets,
        strikeRate: formData.strikeRate,
        avgScore: formData.avgScore,
        playerName: formData.playerName,
        relation: formData.relation,
        flatNumber: formData.flatNumber,
      });
      
      toast.success("Registration successful! Good luck.");
      navigate("/sports");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#1a2540] rounded-full text-[#94a3b8] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#f1f5f9]">Complete Registration</h1>
          <p className="text-sm text-[#94a3b8]">Provide player details for the event</p>
        </div>
      </div>

      {/* Registration Type Tabs */}
      <div className="flex p-1 bg-[#1a2540] border border-[#2a3a5c] rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, regType: "self", playerName: user?.fullName || "" }))}
          className={`flex-1 py-2.5 text-xs font-medium rounded-xl transition-all ${formData.regType === "self" ? "bg-[#f97316] text-white shadow-lg" : "text-[#94a3b8] hover:text-[#f1f5f9]"}`}
        >
          Register for Self
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, regType: "family", playerName: "" }))}
          className={`flex-1 py-2.5 text-xs font-medium rounded-xl transition-all ${formData.regType === "family" ? "bg-[#f97316] text-white shadow-lg" : "text-[#94a3b8] hover:text-[#f1f5f9]"}`}
        >
          Family Member
        </button>
        {isAnyAdmin && (
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, regType: "other", playerName: "" }))}
            className={`flex-1 py-2.5 text-xs font-medium rounded-xl transition-all ${formData.regType === "other" ? "bg-[#f97316] text-white shadow-lg" : "text-[#94a3b8] hover:text-[#f1f5f9]"}`}
          >
            Community Person
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Info className="w-24 h-24" />
          </div>
          
          <div className="text-sm font-medium text-[#f97316] uppercase tracking-wider mb-6">Player Identity</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Category</label>
              <select 
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors"
              >
                <option value="">Select Category</option>
                <option value="BATSMEN">Batsmen</option>
                <option value="BOWLERS">Bowlers</option>
                <option value="ALL_ROUNDERS">All Rounders</option>
                <option value="WICKET_KEEPERS">Wicket Keepers</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Player Name</label>
              <input 
                name="playerName"
                type="text"
                value={formData.playerName}
                onChange={handleInputChange}
                readOnly={formData.regType === "self"}
                placeholder={formData.regType === "self" ? "" : "Enter full name"}
                className={`w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm transition-all focus:outline-none ${formData.regType === "self" ? "text-[#94a3b8] cursor-not-allowed" : "text-[#f1f5f9] border-[#3b82f6]/30 focus:border-[#3b82f6]"}`}
              />
            </div>

            {formData.regType === "family" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Relationship</label>
                <select 
                  name="relation"
                  value={formData.relation}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0c1220] border border-[#3b82f6]/30 rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6] transition-colors"
                >
                  <option value="">Select Relation</option>
                  <option value="SPOUSE">Spouse</option>
                  <option value="CHILD">Child</option>
                  <option value="PARENT">Parent</option>
                  <option value="SIBLING">Sibling</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            )}

            {formData.regType === "other" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Flat Number</label>
                <input 
                  name="flatNumber"
                  type="text"
                  value={formData.flatNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. A-101"
                  required
                  className="w-full bg-[#0c1220] border border-[#3b82f6]/30 rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6] transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Primary Role</label>
              <select 
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={!formData.categoryId}
                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{formData.categoryId ? "Select Role" : "First select category"}</option>
                
                {(formData.categoryId === "BATSMEN" || formData.categoryId === "ALL_ROUNDERS") && (
                  <optgroup label="Batting">
                    <option value="Right Hand Batsman">Right Hand Batsman</option>
                    <option value="Left Hand Batsman">Left Hand Batsman</option>
                  </optgroup>
                )}
                
                {(formData.categoryId === "BOWLERS" || formData.categoryId === "ALL_ROUNDERS") && (
                  <optgroup label="Bowling">
                    <option value="Right Arm Fast">Right Arm Fast</option>
                    <option value="Right Arm Medium">Right Arm Medium</option>
                    <option value="Right Arm Off Spin">Right Arm Off Spin</option>
                    <option value="Right Arm Leg Spin">Right Arm Leg Spin</option>
                    <option value="Left Arm Fast">Left Arm Fast</option>
                    <option value="Left Arm Medium">Left Arm Medium</option>
                    <option value="Left Arm Spin (Orthodox)">Left Arm Spin (Orthodox)</option>
                    <option value="Left Arm Spin (Chinaman)">Left Arm Spin (Chinaman)</option>
                  </optgroup>
                )}
                
                {(formData.categoryId === "WICKET_KEEPERS" || formData.categoryId === "ALL_ROUNDERS") && (
                  <optgroup label="Specialist">
                    <option value="Wicketkeeper Batsman">Wicketkeeper Batsman</option>
                  </optgroup>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Age</label>
              <input 
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Career Stats */}
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl p-6 shadow-xl">
          <div className="text-sm font-medium text-[#f97316] uppercase tracking-wider mb-6">Career Statistics</div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Matches</label>
              <input 
                name="matches"
                type="number"
                value={formData.matches}
                onChange={handleInputChange}
                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Total Runs / Points</label>
              <input 
                name="runs"
                type="number"
                value={formData.runs}
                onChange={handleInputChange}
                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Wickets / Assists</label>
              <input 
                name="wickets"
                type="number"
                value={formData.wickets}
                onChange={handleInputChange}
                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Strike Rate</label>
              <input 
                name="strikeRate"
                type="number"
                step="0.01"
                value={formData.strikeRate}
                onChange={handleInputChange}
                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Avg Score</label>
              <input 
                name="avgScore"
                type="number"
                step="0.01"
                value={formData.avgScore}
                onChange={handleInputChange}
                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 bg-transparent border border-[#2a3a5c] rounded-2xl text-[#94a3b8] font-medium hover:bg-[#1a2540] transition-all"
          >
            Go Back
          </button>
          <button 
            type="submit"
            disabled={submitting}
            className="flex-[2] py-4 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold rounded-2xl shadow-lg shadow-[#f97316]/20 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</> : "Submit Registration ↗"}
          </button>
        </div>
      </form>
    </div>
  );
}
