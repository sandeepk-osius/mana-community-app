import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
import { sportsService } from "../../../services/sportsService";
import { useAuth } from "../../../contexts/AuthContext";
import {
  CREATE_EDIT_EVENT_REGISTRATIONS,
  CREATE_EDIT_SPORTS_MAIN,
} from "../../../constants/permissions";
import type { SportsEvent, PlayerCategory } from "../../../types/api";

// ─── Sport config ─────────────────────────────────────────────────────────────

interface StatField {
  name: "matches" | "runs" | "wickets" | "strikeRate" | "avgScore";
  label: string;
  step?: number;
}

interface CategoryOption {
  value: string;
  label: string;
  roles: string[];
}

interface SportConfig {
  categories: CategoryOption[];
  stats: StatField[];
}

function detectSport(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("cricket")) return "cricket";
  if (n.includes("football") || n.includes("soccer")) return "football";
  if (n.includes("volleyball")) return "volleyball";
  if (n.includes("basketball")) return "basketball";
  if (n.includes("badminton")) return "badminton";
  if (n.includes("kabaddi")) return "kabaddi";
  if (n.includes("hockey")) return "hockey";
  if (n.includes("throwball")) return "throwball";
  if (n.includes("rugby")) return "rugby";
  return "generic";
}

const SPORT_CONFIGS: Record<string, SportConfig> = {
  cricket: {
    categories: [
      {
        value: "BATSMEN", label: "Batsmen",
        roles: ["Right Hand Batsman", "Left Hand Batsman"],
      },
      {
        value: "BOWLERS", label: "Bowlers",
        roles: [
          "Right Arm Fast", "Right Arm Medium", "Right Arm Off Spin", "Right Arm Leg Spin",
          "Left Arm Fast", "Left Arm Medium", "Left Arm Spin (Orthodox)", "Left Arm Spin (Chinaman)",
        ],
      },
      {
        value: "ALL_ROUNDERS", label: "All-Rounders",
        roles: ["Batting All-Rounder", "Bowling All-Rounder", "Right Hand Batsman", "Left Hand Batsman"],
      },
      {
        value: "WICKET_KEEPERS", label: "Wicket-Keepers",
        roles: ["Wicketkeeper Batsman"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Runs" },
      { name: "wickets", label: "Wickets" },
      { name: "strikeRate", label: "Strike Rate", step: 0.01 },
      { name: "avgScore", label: "Batting Average", step: 0.01 },
    ],
  },
  football: {
    categories: [
      { value: "GOALKEEPER", label: "Goalkeeper", roles: ["Goalkeeper"] },
      {
        value: "DEFENDER", label: "Defender",
        roles: ["Center Back", "Right Back", "Left Back", "Sweeper"],
      },
      {
        value: "MIDFIELDER", label: "Midfielder",
        roles: ["Central Midfielder", "Defensive Midfielder", "Attacking Midfielder", "Right Winger", "Left Winger"],
      },
      {
        value: "FORWARD", label: "Forward",
        roles: ["Striker", "Center Forward", "Left Forward", "Right Forward"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Goals" },
      { name: "wickets", label: "Assists" },
      { name: "strikeRate", label: "Pass Accuracy (%)", step: 0.01 },
      { name: "avgScore", label: "Goals Per Game", step: 0.01 },
    ],
  },
  volleyball: {
    categories: [
      { value: "OUTSIDE_HITTER", label: "Outside Hitter", roles: ["Left Side", "Right Side"] },
      { value: "MIDDLE_BLOCKER", label: "Middle Blocker", roles: ["Middle Blocker"] },
      { value: "SETTER", label: "Setter", roles: ["Setter"] },
      { value: "LIBERO", label: "Libero", roles: ["Libero"] },
      { value: "OPPOSITE_HITTER", label: "Opposite Hitter", roles: ["Opposite Hitter"] },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Points / Kills" },
      { name: "wickets", label: "Blocks" },
      { name: "strikeRate", label: "Aces" },
      { name: "avgScore", label: "Digs", step: 0.01 },
    ],
  },
  basketball: {
    categories: [
      { value: "POINT_GUARD", label: "Point Guard", roles: ["Point Guard"] },
      { value: "SHOOTING_GUARD", label: "Shooting Guard", roles: ["Shooting Guard"] },
      { value: "SMALL_FORWARD", label: "Small Forward", roles: ["Small Forward"] },
      { value: "POWER_FORWARD", label: "Power Forward", roles: ["Power Forward"] },
      { value: "CENTER", label: "Center", roles: ["Center"] },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Points" },
      { name: "wickets", label: "Rebounds" },
      { name: "strikeRate", label: "Assists" },
      { name: "avgScore", label: "Points Per Game", step: 0.01 },
    ],
  },
  badminton: {
    categories: [
      { value: "SINGLES", label: "Singles", roles: ["Men's Singles", "Women's Singles"] },
      { value: "DOUBLES", label: "Doubles", roles: ["Men's Doubles", "Women's Doubles"] },
      { value: "MIXED_DOUBLES", label: "Mixed Doubles", roles: ["Mixed Doubles"] },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Wins" },
      { name: "wickets", label: "Titles" },
      { name: "strikeRate", label: "Win Rate (%)", step: 0.01 },
      { name: "avgScore", label: "Avg Smash Speed (km/h)", step: 0.01 },
    ],
  },
  kabaddi: {
    categories: [
      {
        value: "RAIDER", label: "Raider",
        roles: ["Strong Raider", "Touch Specialist", "Running Hand Touch"],
      },
      {
        value: "DEFENDER", label: "Defender",
        roles: ["Left Corner", "Right Corner", "Cover"],
      },
      {
        value: "ALL_ROUNDER", label: "All-Rounder",
        roles: ["Raiding All-Rounder", "Defending All-Rounder"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Raid Points" },
      { name: "wickets", label: "Tackle Points" },
      { name: "strikeRate", label: "Super Raids" },
      { name: "avgScore", label: "Super Tackles" },
    ],
  },
  hockey: {
    categories: [
      { value: "GOALKEEPER", label: "Goalkeeper", roles: ["Goalkeeper"] },
      {
        value: "DEFENDER", label: "Defender",
        roles: ["Full Back", "Half Back", "Sweeper"],
      },
      {
        value: "MIDFIELDER", label: "Midfielder",
        roles: ["Center Half", "Right Half", "Left Half"],
      },
      {
        value: "FORWARD", label: "Forward",
        roles: ["Center Forward", "Right Wing", "Left Wing", "Inside Right", "Inside Left"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Goals" },
      { name: "wickets", label: "Assists" },
      { name: "strikeRate", label: "Penalty Corners" },
      { name: "avgScore", label: "Goals Per Game", step: 0.01 },
    ],
  },
  throwball: {
    categories: [
      { value: "THROWER", label: "Thrower", roles: ["Lead Thrower", "Support Thrower"] },
      { value: "CATCHER", label: "Catcher", roles: ["Lead Catcher", "Support Catcher"] },
      { value: "UNIVERSAL", label: "Universal (Both)", roles: ["Universal Player"] },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Points" },
      { name: "wickets", label: "Successful Catches" },
      { name: "strikeRate", label: "Throw Accuracy (%)", step: 0.01 },
      { name: "avgScore", label: "Points Per Match", step: 0.01 },
    ],
  },
  rugby: {
    categories: [
      {
        value: "FORWARD", label: "Forward",
        roles: ["Prop", "Hooker", "Lock", "Flanker", "Number 8"],
      },
      {
        value: "BACK", label: "Back",
        roles: ["Scrum-Half", "Fly-Half", "Center", "Wing", "Full-Back"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Tries" },
      { name: "wickets", label: "Tackles" },
      { name: "strikeRate", label: "Conversions" },
      { name: "avgScore", label: "Points Per Match", step: 0.01 },
    ],
  },
  generic: {
    categories: [
      { value: "PLAYER", label: "Player", roles: ["Standard Player", "Captain", "Vice Captain"] },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Points" },
      { name: "wickets", label: "Assists" },
      { name: "strikeRate", label: "Performance Rate (%)", step: 0.01 },
      { name: "avgScore", label: "Average Score", step: 0.01 },
    ],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SportsRegister() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const isAnyAdmin = hasAnyPermission(CREATE_EDIT_EVENT_REGISTRATIONS, CREATE_EDIT_SPORTS_MAIN);

  const [event, setEvent] = useState<SportsEvent | null>(null);
  const [categories, setCategories] = useState<PlayerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    flatNumber: "",
  });

  // Derived sport config
  const sportKey = detectSport(event?.sport?.name || "");
  const sportConfig = SPORT_CONFIGS[sportKey];
  const selectedCatConfig = sportConfig.categories.find(c => c.value === formData.categoryId);

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, ev] = await Promise.all([
          sportsService.getCategories(),
          sportsService.getEventById(Number(eventId)),
        ]);
        setCategories(cats);
        setEvent(ev);
      } catch {
        toast.error("Failed to load registration details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  // Clear role when category changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, role: "" }));
  }, [formData.categoryId]);

  useEffect(() => {
    if (user?.dateOfBirth) {
      const birthYear = new Date(user.dateOfBirth).getFullYear();
      setFormData(prev => ({ ...prev, age: new Date().getFullYear() - birthYear }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
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
      const selectedCat = categories.find(c => {
        const normalized = c.name.toUpperCase().replace(/\s/g, "_");
        return normalized === formData.categoryId || normalized.includes(formData.categoryId);
      });
      const finalCategoryId = selectedCat?.id ?? (categories[0]?.id ?? 1);

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
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#1a2540] rounded-full text-[#94a3b8] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#f1f5f9]">Complete Registration</h1>
          <p className="text-sm text-[#94a3b8]">
            {event ? `${event.name}${event.sport?.name ? ` · ${event.sport.name}` : ""}` : "Provide player details for the event"}
          </p>
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
        {/* Player Identity */}
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Info className="w-24 h-24" />
          </div>

          <div className="text-sm font-medium text-[#f97316] uppercase tracking-wider mb-6">Player Identity</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
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
                {sportConfig.categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Player Name */}
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

            {/* Relationship (family) */}
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

            {/* Flat Number (admin) */}
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

            {/* Primary Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Primary Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={!formData.categoryId}
                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{formData.categoryId ? "Select Role" : "Select category first"}</option>
                {selectedCatConfig?.roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Age */}
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

        {/* Career Statistics */}
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl p-6 shadow-xl">
          <div className="text-sm font-medium text-[#f97316] uppercase tracking-wider mb-6">Career Statistics</div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {sportConfig.stats.map(stat => (
              <div key={stat.name} className="space-y-1.5">
                <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">{stat.label}</label>
                <input
                  name={stat.name}
                  type="number"
                  step={stat.step ?? 1}
                  value={formData[stat.name]}
                  onChange={handleInputChange}
                  className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#f97316] transition-colors"
                />
              </div>
            ))}
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
