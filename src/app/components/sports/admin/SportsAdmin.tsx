import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, CalendarIcon, MapPin, Plus, LayoutDashboard, Edit2, Trash2, EyeOff, Eye, Users, Clock, X, Search, Trophy, ChevronDown, Check } from "lucide-react";
import { TIME_OPTIONS } from "../../../../constants/timeOptions";
import { Link } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { sportsService } from "../../../../services/sportsService";
import { venueService } from "../../../../services/venueService";
import { communityService } from "../../../../services/communityService";
import { auctionService } from "../../../../services/auctionService";
import { userService } from "../../../../services/userService";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  CREATE_EDIT_SPORTS_MAIN,
  CREATE_EDIT_PLAYER_POOL,
  CREATE_EDIT_EVENT_REGISTRATIONS,
  DELETE_SPORTS_MAIN,
} from "../../../../constants/permissions";
import { AdminSportsMeta } from "../../admin/AdminSportsMeta";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { Button } from "../../ui/button";
import { cn } from "../../ui/utils";
import type { Venue, SportMeta, PlayerCategory, CommunityResponse, TournamentRegistration, AuctionTeam, Court, EventRegistration, MatchFormat, SportsEventRequest, SportFormEvent, SportFormEntry } from "../../../../types/api";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { SportEventConfigModal } from "./SportEventConfigModal";
import { VenueDetailsModal } from "./VenueDetailsModal";
import { TournamentSection } from "./TournamentSection";
import { SportsEventSection } from "./SportsEventSection";
import { VenueCreationSection } from "./VenueCreationSection";
import { PlayerCategorySection } from "./PlayerCategorySection";
import { SportsMetaSection } from "./SportsMetaSection";
import { RegistrationOpenModal } from "./RegistrationOpenModal";
import type { RegistrationNotifConfig } from "./RegistrationOpenModal";
import { notificationService } from "../../../../services/notificationService";

const DEFAULT_TRIGGERS = {
  "7d":  { id: "7d",  label: "7 Days Before",       offset: -7 * 24 * 60, color: "border-blue-500",   bgColor: "rgba(59,130,246,0.15)",   textColor: "text-blue-400",   emoji: "📅", tagClass: "bg-blue-500/15 text-blue-400 border border-blue-500/20", category: "Registration", priority: "Critical" },
  "1d":  { id: "1d",  label: "1 Day Before",         offset: -1 * 24 * 60, color: "border-amber-500",  bgColor: "rgba(245,158,11,0.15)",   textColor: "text-amber-400",  emoji: "🌅", tagClass: "bg-amber-500/15 text-amber-400 border border-amber-500/20", category: "Reminder",   priority: "Critical" },
  "2h":  { id: "2h",  label: "2 Hours Before",       offset: -120,         color: "border-emerald-500",bgColor: "rgba(16,185,129,0.15)",  textColor: "text-emerald-400", emoji: "⚡", tagClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", category: "Urgent",   priority: "High" },
  "30m": { id: "30m", label: "30 Minutes Before",    offset: -30,          color: "border-rose-500",   bgColor: "rgba(244,63,94,0.15)",   textColor: "text-rose-400",   emoji: "🔴", tagClass: "bg-rose-500/15 text-rose-400 border border-rose-500/20", category: "Critical",   priority: "Critical" },
  "now": { id: "now", label: "At Tournament Start",  offset: 0,            color: "border-yellow-400", bgColor: "rgba(245,158,11,0.2)",    textColor: "text-yellow-400",  emoji: "🏁", tagClass: "bg-amber-500/15 text-amber-500 border border-amber-500/20", category: "Live",       priority: "Normal" }
} as const;

const CHANNEL_META = [
  { id: "push",     emoji: "📲", label: "Push" },
  { id: "email",    emoji: "✉️", label: "Email" },
  { id: "sms",      emoji: "💬", label: "SMS" },
  { id: "whatsapp", emoji: "🟢", label: "WhatsApp" },
  { id: "inapp",    emoji: "🔔", label: "In-App" }
] as const;

const CUSTOM_OFFSET_OPTIONS = [
  { offset: -15, label: "15 minutes before" },
  { offset: -45, label: "45 minutes before" },
  { offset: -180, label: "3 hours before" },
  { offset: -360, label: "6 hours before" },
  { offset: -2880, label: "2 days before" },
  { offset: -4320, label: "3 days before" },
  { offset: 30, label: "After match ends" }
] as const;

const RECIPIENT_OPTIONS = [
  "Registered Players",
  "Team Owners",
  "All Members",
  "Admins Only",
  "Spectators",
  "Referees"
] as const;

type TabId = "dashboard" | "create-tournament" | "sports-event" | "create-venue" | "player-category" | "sports-meta";

interface SportEventState {
  id: string;
  name: string;
  gender: string;
  playersBorn: string;
  format?: string;
  minPlayers?: number;
  maxPlayers?: number;
  tournamentType?: string;
  minAge?: number;
  maxAge?: number;
  eventId?: number;
}


interface SelectedSportWithEvents {
  sportId: number;
  sportName: string;
  sportIcon?: string;
  sportIconUrl?: string;
  events: SportEventState[];
}

const isTeamSport = (sportName: string): boolean => {
  const name = sportName.toLowerCase();
  return (
    name.includes("cricket") ||
    name.includes("football") ||
    name.includes("volleyball") ||
    name.includes("basketball") ||
    name.includes("kabaddi") ||
    name.includes("hockey") ||
    name.includes("soccer") ||
    name.includes("throwball") ||
    name.includes("rugby")
  );
};

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

const getDefaultMinPlayers = (sportName: string): number => {
  const name = sportName.toLowerCase();
  if (name.includes("cricket")) return 11;
  if (name.includes("football")) return 11;
  if (name.includes("basketball")) return 5;
  if (name.includes("volleyball")) return 6;
  if (name.includes("kabaddi")) return 7;
  return 5;
};

export function SportsAdmin() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const isAdmin = hasAnyPermission(CREATE_EDIT_SPORTS_MAIN, CREATE_EDIT_PLAYER_POOL, CREATE_EDIT_EVENT_REGISTRATIONS, DELETE_SPORTS_MAIN);
  const [sportsMeta, setSportsMeta] = useState<SportMeta[]>([]);
  const [playerCategories, setPlayerCategories] = useState<PlayerCategory[]>([]);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);

  // Category Template Search States
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, string>>({});
  const [openDropdownEventId, setOpenDropdownEventId] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [selectedSportsWithEvents, setSelectedSportsWithEvents] = useState<SelectedSportWithEvents[]>([]);
  const [selectedCats, setSelectedCats] = useState<number[]>([]);
  const [selectedCommId, setSelectedCommId] = useState<number | "">("");

  const [eventName, setEventName] = useState("");
  const [maxPax, setMaxPax] = useState("64");

  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | "">("");
  const [selectedVenueDetails, setSelectedVenueDetails] = useState<Venue | null>(null);
  const [loadingVenueDetails, setLoadingVenueDetails] = useState(false);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<any[]>([]);
  const [activatingTournament, setActivatingTournament] = useState<{ id: number; name: string } | null>(null);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [regStartDate, setRegStartDate] = useState<Date>();
  const [regEndDate, setRegEndDate] = useState<Date>();

  // --- New Event Fields states ---
  const [eventContactNumber, setEventContactNumber] = useState("");
  const [eventContactEmail, setEventContactEmail] = useState("");
  const [otherContacts, setOtherContacts] = useState<{ title: string; name: string; detail: string; }[]>([]);
  const [sponsors, setSponsors] = useState<{ category: string; name: string; url: string; }[]>([]);
  const [bannerImage, setBannerImage] = useState("");
  const [tournamentLevel, setTournamentLevel] = useState<"Standard" | "Professional" | "Premium">("Standard");
  const [description, setDescription] = useState("");
  const [allowAdminChat, setAllowAdminChat] = useState(false);
  const [startTime, setStartTime] = useState("09:00 AM");
  const [dueTime, setDueTime] = useState("06:00 PM");

  const [globalChannels, setGlobalChannels] = useState<string[]>(["push", "email"]);
  const [previewTrigger, setPreviewTrigger] = useState<string>("2h");
  const [expandedTrigger, setExpandedTrigger] = useState<string | null>(null);
  const [customTriggers, setCustomTriggers] = useState<any[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSportConfigModal, setShowSportConfigModal] = useState(false);
  const [configuringSportId, setConfiguringSportId] = useState<number | null>(null);
  const [showVenueDetailsModal, setShowVenueDetailsModal] = useState(false);

  const [triggerStates, setTriggerStates] = useState<Record<string, {
    enabled: boolean;
    title: string;
    body: string;
    recipients: string[];
    overrideChannels: string[];
  }>>({
    "7d": {
      enabled: true,
      title: "🏏 Tournament Registration Open!",
      body: "Registration is now open for {{tournament_name}}! 🏆 Starting {{start_date}} at {{venue}}. Register before spots fill up. Tap to register now.",
      recipients: ["All Members", "Community Feed"],
      overrideChannels: ["push", "email", "whatsapp"]
    },
    "1d": {
      enabled: true,
      title: "🏆 Tournament Tomorrow!",
      body: "{{tournament_name}} begins TOMORROW at {{start_time}}! 📍 {{venue}}. Your match schedule is ready. Check your fixtures and prepare. See you on the ground! 🏅",
      recipients: ["Registered Players", "Team Owners", "Admins Only"],
      overrideChannels: []
    },
    "2h": {
      enabled: true,
      title: "⚡ 2 Hours to Kick-Off!",
      body: "⚡ {{tournament_name}} starts in 2 hours! Report at {{venue}} by {{report_time}}. Bring your kit & ID. Your first match is ready! Let's go! 🏏",
      recipients: ["Registered Players", "Team Owners", "Referees"],
      overrideChannels: []
    },
    "30m": {
      enabled: true,
      title: "🔴 30 Mins to Start — Head to Ground!",
      body: "🔴 FINAL CALL — {{tournament_name}} begins in 30 minutes! Head to {{venue}} NOW. Gate A open. Toss in 15 mins. Don't be late — matches won't be delayed! ⏱️",
      recipients: ["Registered Players", "Referees"],
      overrideChannels: ["push", "sms", "whatsapp", "inapp"]
    },
    "now": {
      enabled: true,
      title: "🏁 Tournament is LIVE Now!",
      body: "🏁 {{tournament_name}} has officially started! Follow live scores, results, and standings right here in the app. Play hard! 🏆",
      recipients: ["All Members", "Spectators", "Community Feed"],
      overrideChannels: []
    }
  });

  const getTournamentStartDateTime = useCallback(() => {
    if (!startDate) return null;
    const baseDate = new Date(startDate);
    
    let hours = 9;
    let minutes = 0;
    
    if (startTime) {
      const match = startTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const ampm = match[3];
        if (ampm) {
          if (ampm.toUpperCase() === "PM" && hours < 12) {
            hours += 12;
          } else if (ampm.toUpperCase() === "AM" && hours === 12) {
            hours = 0;
          }
        }
      }
    }
    
    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  }, [startDate, startTime]);

  const formatINRDate = useCallback((dateTimeStr: Date | string | null | undefined, offsetMinutes: number) => {
    if (!dateTimeStr) return "—";
    const baseDate = new Date(dateTimeStr);
    const calculatedDate = new Date(baseDate.getTime() + offsetMinutes * 60000);
    
    return calculatedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + calculatedDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }, []);

  const toggleGlobalChannel = (channelId: string) => {
    setGlobalChannels(prev => 
      prev.includes(channelId) ? prev.filter(c => c !== channelId) : [...prev, channelId]
    );
  };

  const toggleTriggerRow = (id: string, isCustom?: boolean) => {
    if (isCustom) {
      setCustomTriggers(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
    } else {
      setTriggerStates(prev => ({
        ...prev,
        [id]: { ...prev[id], enabled: !prev[id].enabled }
      }));
    }
  };

  const handleTriggerFieldChange = (id: string, isCustom: boolean, field: string, value: any) => {
    if (isCustom) {
      setCustomTriggers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    } else {
      setTriggerStates(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: value }
      }));
    }
  };

  const toggleRecipient = (id: string, isCustom: boolean, recipient: string) => {
    if (isCustom) {
      setCustomTriggers(prev => prev.map(t => {
        if (t.id === id) {
          const current = t.recipients;
          const updated = current.includes(recipient) 
            ? current.filter((r: string) => r !== recipient) 
            : [...current, recipient];
          return { ...t, recipients: updated };
        }
        return t;
      }));
    } else {
      setTriggerStates(prev => {
        const current = prev[id].recipients;
        const updated = current.includes(recipient) 
          ? current.filter((r: string) => r !== recipient) 
          : [...current, recipient];
        return { ...prev, [id]: { ...prev[id], recipients: updated } };
      });
    }
  };

  const toggleTriggerChannel = (id: string, channelId: string, isCustom: boolean) => {
    if (isCustom) {
      setCustomTriggers(prev => prev.map(t => {
        if (t.id === id) {
          const current = t.overrideChannels || [];
          const updated = current.includes(channelId)
            ? current.filter((c: string) => c !== channelId)
            : [...current, channelId];
          return { ...t, overrideChannels: updated };
        }
        return t;
      }));
    } else {
      setTriggerStates(prev => {
        const current = prev[id].overrideChannels || [];
        const updated = current.includes(channelId)
          ? current.filter((c: string) => c !== channelId)
          : [...current, channelId];
        return { ...prev, [id]: { ...prev[id], overrideChannels: updated } };
      });
    }
  };

  const addCustomTrigger = () => {
    const newId = `custom_${Date.now()}`;
    const newTrigger = {
      id: newId,
      label: `Custom Trigger ${customTriggers.length + 1}`,
      offset: -15, // Default 15 minutes before
      enabled: true,
      title: "✨ Match Alert Update!",
      body: "Attention: Update regarding {{tournament_name}}! Please check your schedule and details.",
      recipients: ["Registered Players"],
      overrideChannels: ["push"],
      priority: "Normal",
      category: "Custom"
    };
    setCustomTriggers(prev => [...prev, newTrigger]);
    setExpandedTrigger(newId);
    toast.success(`Custom trigger "${newTrigger.label}" added`);
  };

  const removeCustomTrigger = (id: string) => {
    setCustomTriggers(prev => prev.filter(t => t.id !== id));
    if (previewTrigger === id) {
      setPreviewTrigger("2h");
    }
    if (expandedTrigger === id) {
      setExpandedTrigger(null);
    }
    toast.success("Custom trigger removed");
  };

  const getCompiledPreviewBody = useCallback(() => {
    let rawBody = "";
    const defaultTrigger = triggerStates[previewTrigger];
    if (defaultTrigger) {
      rawBody = defaultTrigger.body;
    } else {
      const customTrigger = customTriggers.find(t => t.id === previewTrigger);
      if (customTrigger) rawBody = customTrigger.body;
    }

    const baseDate = getTournamentStartDateTime();
    const displayEventName = eventName.trim() || "Cricket League Season 2026";
    const displayVenue = selectedVenueDetails?.name || "Sector 12 Ground, Block C";
    
    const displayStartDate = regStartDate 
      ? format(regStartDate, "dd MMM yyyy") 
      : "25 Nov 2026";
      
    const displayStartTime = startTime || "09:00 AM";
    
    let displayReportTime = "8:30 AM";
    if (baseDate) {
      const reportDate = new Date(baseDate.getTime() - 30 * 60000);
      displayReportTime = reportDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    
    return rawBody
      .replace(/{{tournament_name}}/g, displayEventName)
      .replace(/{{venue}}/g, displayVenue.split(",")[0])
      .replace(/{{start_date}}/g, displayStartDate)
      .replace(/{{start_time}}/g, displayStartTime)
      .replace(/{{report_time}}/g, displayReportTime);
  }, [triggerStates, customTriggers, previewTrigger, getTournamentStartDateTime, eventName, selectedVenueDetails, startTime, regStartDate]);

  // Compile full array for loop render
  const allTriggersToRender = [
    ...Object.values(DEFAULT_TRIGGERS).map(dt => ({
      ...dt,
      isCustom: false,
      enabled: triggerStates[dt.id].enabled,
      title: triggerStates[dt.id].title,
      body: triggerStates[dt.id].body,
      recipients: triggerStates[dt.id].recipients,
      overrideChannels: triggerStates[dt.id].overrideChannels
    })),
    ...customTriggers.map(ct => ({
      ...ct,
      isCustom: true,
      tagClass: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
      bgColor: "rgba(139,92,246,0.15)",
      textColor: "text-violet-400",
      emoji: "✨"
    }))
  ];

  // Dynamic calculations
  const totalEnabledCount = Object.values(triggerStates).filter(t => t.enabled).length + customTriggers.filter(t => t.enabled).length;

  const totalOutputSends = Object.values(triggerStates).reduce((acc, curr) => acc + (curr.enabled ? (curr.overrideChannels.length || globalChannels.length) : 0), 0) +
    customTriggers.reduce((acc, curr) => acc + (curr.enabled ? (curr.overrideChannels.length || globalChannels.length) : 0), 0);

  const currentActiveChannels = (() => {
    const defaultTrigger = triggerStates[previewTrigger];
    if (defaultTrigger) {
      return defaultTrigger.overrideChannels.length > 0 ? defaultTrigger.overrideChannels : globalChannels;
    } else {
      const customTrigger = customTriggers.find(t => t.id === previewTrigger);
      if (customTrigger) {
        return customTrigger.overrideChannels.length > 0 ? customTrigger.overrideChannels : globalChannels;
      }
    }
    return globalChannels;
  })();

  const getPreviewRecipientsCount = () => {
    let chosenRecipients: string[] = [];
    const defaultTrigger = triggerStates[previewTrigger];
    if (defaultTrigger) {
      chosenRecipients = defaultTrigger.recipients;
    } else {
      const customTrigger = customTriggers.find(t => t.id === previewTrigger);
      if (customTrigger) chosenRecipients = customTrigger.recipients;
    }

    let count = 0;
    if (chosenRecipients.includes("All Members")) count += 180;
    if (chosenRecipients.includes("Registered Players")) count += 43;
    if (chosenRecipients.includes("Team Owners")) count += 8;
    if (chosenRecipients.includes("Referees")) count += 4;
    if (chosenRecipients.includes("Spectators")) count += 60;
    if (chosenRecipients.includes("Community Feed")) count += 10;

    return count === 0 ? 0 : Math.min(230, count);
  };

  const previewCount = getPreviewRecipientsCount();
  const previewPercentage = Math.round((previewCount / 230) * 100) || 10;

  const addOtherContact = () => {
    setOtherContacts(prev => [...prev, { title: "", name: "", detail: "" }]);
  };
  const removeOtherContact = (index: number) => {
    setOtherContacts(prev => prev.filter((_, i) => i !== index));
  };
  const updateOtherContact = (index: number, field: "title" | "name" | "detail", value: string) => {
    setOtherContacts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSponsor = () => {
    setSponsors(prev => [...prev, { category: "", name: "", url: "" }]);
  };
  const removeSponsor = (index: number) => {
    setSponsors(prev => prev.filter((_, i) => i !== index));
  };
  const updateSponsor = (index: number, field: "category" | "name" | "url", value: string) => {
    setSponsors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImage(reader.result as string);
        toast.success("Banner image loaded successfully");
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  // Track which tabs have already done their initial data load so we don't
  // re-fetch on every revisit. Mutations explicitly refresh their own data.
  const hydratedTabs = useRef(new Set<TabId>());

  // ─── Sports Event form state ───
  const [showSportForm, setShowSportForm] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [sportPickerSearch, setSportPickerSearch] = useState("");
  const [sportForms, setSportForms] = useState<SportFormEntry[]>([]);
  const [sportSubmitting, setSportSubmitting] = useState(false);
  const [customSportName, setCustomSportName] = useState("");
  const [customSportFormat, setCustomSportFormat] = useState<MatchFormat>("SINGLES");
  const [customSportIcon, setCustomSportIcon] = useState("🏆");

  useEffect(() => {
    setCustomSportName(sportPickerSearch);
  }, [sportPickerSearch]);

  // ─── Venue form state ───
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<number | null>(null);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueArea, setVenueArea] = useState("");
  const [venueMapLink, setVenueMapLink] = useState("");
  const [venueCapacity, setVenueCapacity] = useState("");
  const [venueOpeningTime, setVenueOpeningTime] = useState("08:00 AM");
  const [venueClosingTime, setVenueClosingTime] = useState("08:00 PM");
  const [venueType, setVenueType] = useState("");
  const [venueCommId, setVenueCommId] = useState<number | "">("")
  const [venueCommunities, setVenueCommunities] = useState<CommunityResponse[]>([]);
  const [venueSubmitting, setVenueSubmitting] = useState(false);
  const [hiddenVenues, setHiddenVenues] = useState<Set<number>>(new Set());

  // ─── Courts & Contact Info states ───
  const [courts, setCourts] = useState<Court[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [venuePinCode, setVenuePinCode] = useState("");

  const addCourt = () => {
    setCourts(prev => [...prev, { name: "", color: "#3b82f6" }]);
  };

  const removeCourt = (index: number) => {
    setCourts(prev => prev.filter((_, i) => i !== index));
  };

  const updateCourt = (index: number, field: "name" | "color", value: string) => {
    setCourts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  // ─── Player Category form state ───
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryMinAge, setCategoryMinAge] = useState("");
  const [categoryMaxAge, setCategoryMaxAge] = useState("");
  const [categoryGender, setCategoryGender] = useState("");
  const [categoryCommId, setCategoryCommId] = useState<number | "">("")
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // ─── Registration viewing state ───
  const [viewingEventId, setViewingEventId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"players" | "captains">("players");
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [nominatedCaptains, setNominatedCaptains] = useState<AuctionTeam[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // ─── Manual Add Participant Modal State ───
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [selectedEventIdForAdd, setSelectedEventIdForAdd] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<number>(1);
  const [selectedEventIdForImport, setSelectedEventIdForImport] = useState<number | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [addPlayerForms, setAddPlayerForms] = useState<Array<{
    id: string;
    playerName: string;
    playerEmail: string;
    categoryId: string;
    avatarUrl: string;
    matchType: string;
    age: number;
    flatNumber: string;
    relation: string;
    role: string;
    matches: number;
    runs: number;
    wickets: number;
    strikeRate: number;
    avgScore: number;
  }>>([
    {
      id: Math.random().toString(),
      playerName: "",
      playerEmail: "",
      categoryId: "",
      avatarUrl: "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
      matchType: "SINGLES",
      age: 25,
      flatNumber: "",
      relation: "OTHER",
      role: "",
      matches: 0,
      runs: 0,
      wickets: 0,
      strikeRate: 0,
      avgScore: 0,
    }
  ]);

  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  // ─── Venue CRUD ─────────────────────────────────────────────────────
  const refreshVenues = useCallback(() => {
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const activeCommId = isSuperAdmin ? (selectedCommId ? Number(selectedCommId) : undefined) : user?.communityId;
    
    if (!activeCommId) {
      setVenues([]);
      setSelectedVenueId("");
      return;
    }

    const selectedComm = communities.find(c => c.id === activeCommId);
    const isGeneral = selectedComm
      ? (selectedComm.type === "GENERAL" || selectedComm.name.toLowerCase() === "general")
      : ((user as any)?.community?.type === "GENERAL" || (user as any)?.community?.name?.toLowerCase() === "general");

    const fetchId = isGeneral ? user?.communityId : activeCommId;
    if (fetchId !== undefined) {
      venueService.getVenues(fetchId).then(setVenues).catch(() => { });
    }
  }, [selectedCommId, user?.communityId, user?.role, communities, (user as any)?.community]);

  // Load Community Users for "Your Friends" left side panel
  useEffect(() => {
    if (showAddPlayerModal) {
      const commId = user?.communityId || selectedCommId;
      if (commId) {
        setLoadingUsers(true);
        userService.getCommunityUsers(Number(commId))
          .then(res => {
            setCommunityUsers(res || []);
          })
          .catch(err => {
            console.error("Failed to load community users", err);
          })
          .finally(() => {
            setLoadingUsers(false);
          });
      }
    }
  }, [showAddPlayerModal, user?.communityId, selectedCommId]);

  // Friend Selection Handler
  const handleSelectFriend = (friend: any) => {
    setAddPlayerForms(prev => {
      // Check if player is already added
      if (prev.some(p => p.playerEmail === friend.email || p.playerName === friend.fullName)) {
        toast.warning("Player is already in the list");
        return prev;
      }
      const newCard = {
        id: Math.random().toString(),
        playerName: friend.fullName,
        playerEmail: friend.email || "",
        categoryId: playerCategories[0]?.id ? String(playerCategories[0].id) : "",
        avatarUrl: friend.avatarUrl || "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
        matchType: "SINGLES",
        age: friend.dateOfBirth ? new Date().getFullYear() - new Date(friend.dateOfBirth).getFullYear() : 25,
        flatNumber: friend.flatNo || "",
        relation: "SELF",
        role: "",
        matches: 0,
        runs: 0,
        wickets: 0,
        strikeRate: 0,
        avgScore: 0,
      };
      // If the first card is empty and pristine, replace it
      if (prev.length === 1 && !prev[0].playerName.trim() && !prev[0].playerEmail.trim()) {
        return [newCard];
      }
      return [...prev, newCard];
    });
    toast.success(`Selected ${friend.fullName}`);
  };

  // Add blank card handler
  const handleAddNewPlayerCard = () => {
    setAddPlayerForms(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        playerName: "",
        playerEmail: "",
        categoryId: playerCategories[0]?.id ? String(playerCategories[0].id) : "",
        avatarUrl: "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
        matchType: "SINGLES",
        age: 25,
        flatNumber: "",
        relation: "OTHER",
        role: "",
        matches: 0,
        runs: 0,
        wickets: 0,
        strikeRate: 0,
        avgScore: 0,
      }
    ]);
  };

  // Delete card handler
  const handleDeletePlayerCard = (cardId: string) => {
    setAddPlayerForms(prev => {
      const updated = prev.filter(c => c.id !== cardId);
      if (updated.length === 0) {
        return [{
          id: Math.random().toString(),
          playerName: "",
          playerEmail: "",
          categoryId: playerCategories[0]?.id ? String(playerCategories[0].id) : "",
          avatarUrl: "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
          matchType: "SINGLES",
          age: 25,
          flatNumber: "",
          relation: "OTHER",
          role: "",
          matches: 0,
          runs: 0,
          wickets: 0,
          strikeRate: 0,
          avgScore: 0,
        }];
      }
      return updated;
    });
  };

  // DOB Formatter
  const formatDob = (dobString?: string) => {
    if (!dobString) return "";
    try {
      return format(new Date(dobString), "MMM d, yyyy");
    } catch {
      return dobString;
    }
  };

  // Filter Friends
  const filteredFriends = communityUsers.filter(u =>
    u.fullName.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(friendSearchQuery.toLowerCase()))
  );

  // ─── Manual Add Player Submit Handler ───
  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventIdForAdd) return;

    // Validation
    for (let idx = 0; idx < addPlayerForms.length; idx++) {
      const form = addPlayerForms[idx];
      if (!form.playerName.trim()) {
        toast.error(`Player Name is required for card #${idx + 1}`);
        return;
      }
      if (!form.playerEmail.trim()) {
        toast.error(`Player Email is required for card #${idx + 1}`);
        return;
      }
      if (!form.categoryId) {
        toast.error(`Player Category is required for card #${idx + 1}`);
        return;
      }
    }

    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const form of addPlayerForms) {
        try {
          await sportsService.registerForEvent({
            eventId: selectedEventIdForAdd,
            categoryId: Number(form.categoryId),
            matchType: form.matchType,
            role: form.role,
            age: Number(form.age),
            matches: Number(form.matches),
            runs: Number(form.runs),
            wickets: Number(form.wickets),
            strikeRate: Number(form.strikeRate),
            avgScore: Number(form.avgScore),
            playerName: form.playerName,
            relation: form.relation,
            flatNumber: form.flatNumber,
          });
          successCount++;
        } catch (err: any) {
          console.error(`Failed to register player ${form.playerName}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully registered ${successCount} participant(s)!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to register ${failCount} participant(s)`);
      }

      setShowAddPlayerModal(false);

      // Reset dynamic forms
      setAddPlayerForms([
        {
          id: Math.random().toString(),
          playerName: "",
          playerEmail: "",
          categoryId: playerCategories[0]?.id ? String(playerCategories[0].id) : "",
          avatarUrl: "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
          matchType: "SINGLES",
          age: 25,
          flatNumber: "",
          relation: "OTHER",
          role: "",
          matches: 0,
          runs: 0,
          wickets: 0,
          strikeRate: 0,
          avgScore: 0,
        }
      ]);

      // Refresh registrations list
      if (viewingEventId) {
        const regs = await sportsService.getEventRegistrations(viewingEventId);
        setRegistrations(regs);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to add participants");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── CSV Download Sample Template ───
  const handleDownloadSample = () => {
    const csvContent = "Player Name,Category,Age,Flat Number,Relation,Primary Role,Matches,Runs,Wickets,Strike Rate,Avg Score\n" +
      "Rahul Sharma,Men's Open,28,B-402,OTHER,Right Hand Batsman,15,350,4,135.5,28.5\n" +
      "Priya Patel,Women's Open,24,C-101,SPOUSE,Right Arm Fast,10,80,12,110.0,15.2";
      
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_participants.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── CSV File Selection Handler ───
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setParsingError(null);
    // Parse CSV
    import("papaparse").then((Papa) => {
      Papa.default.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }
          setParsedRows(results.data);
        },
        error: (err) => {
          setParsingError("Failed to parse CSV file: " + err.message);
        }
      });
    });
    setImportStep(2);
  };

  // ─── CSV Import Submit Handler ───
  const handleImportSubmit = async () => {
    if (!selectedEventIdForImport || parsedRows.length === 0) {
      toast.error("No data to import");
      return;
    }
    
    setImporting(true);
    setImportProgress(0);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      
      // Helper function to extract cell value with multiple alias support
      const getVal = (aliases: string[]) => {
        for (const alias of aliases) {
          const key = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_-]/g, '') === alias.toLowerCase().replace(/[\s_-]/g, ''));
          if (key && row[key] !== undefined) return String(row[key]).trim();
        }
        return "";
      };
      
      const name = getVal(["name", "playerName", "fullName", "player"]);
      if (!name) {
        failCount++;
        continue;
      }
      
      const categoryName = getVal(["category", "playerCategory", "class", "division"]);
      
      // Find category ID based on category name matching
      let categoryId = playerCategories[0]?.id || 1;
      if (categoryName) {
        const matchedCat = playerCategories.find(c => 
          c.name.toLowerCase().replace(/[\s_-]/g, '') === categoryName.toLowerCase().replace(/[\s_-]/g, '')
        );
        if (matchedCat) categoryId = matchedCat.id;
      }
      
      const ageVal = getVal(["age", "playerAge"]);
      const age = ageVal ? parseInt(ageVal) || 25 : 25;
      
      const flat = getVal(["flat", "flatNumber", "flatNo", "flatNum"]);
      const relation = getVal(["relation", "relationship"]) || "OTHER";
      const role = getVal(["role", "primaryRole", "playerRole"]);
      const matches = parseInt(getVal(["matches", "matchCount", "played"])) || 0;
      const runs = parseInt(getVal(["runs", "points", "totalRuns", "totalPoints"])) || 0;
      const wickets = parseInt(getVal(["wickets", "assists", "totalWickets", "totalAssists"])) || 0;
      const strikeRate = parseFloat(getVal(["strikeRate", "strike_rate"])) || 0.0;
      const avgScore = parseFloat(getVal(["avgScore", "avg_score", "averageScore"])) || 0.0;
      
      try {
        await sportsService.registerForEvent({
          eventId: selectedEventIdForImport,
          categoryId,
          matchType: "SINGLES",
          role,
          age,
          matches,
          runs,
          wickets,
          strikeRate,
          avgScore,
          playerName: name,
          relation,
          flatNumber: flat,
        });
        successCount++;
      } catch (err) {
        console.error(`Import failed for row ${i + 1} (${name}):`, err);
        failCount++;
      }
      
      setImportProgress(Math.round(((i + 1) / parsedRows.length) * 100));
    }
    
    toast.success(`Import complete! Successfully added ${successCount} players. ${failCount > 0 ? `Failed to add ${failCount} players.` : ""}`);
    
    // Close modal & reset progress
    setShowImportModal(false);
    setCsvFile(null);
    setParsedRows([]);
    setImportProgress(null);
    setImporting(false);
    
    // Refresh players list
    if (viewingEventId) {
      const regs = await sportsService.getTournamentRegistrations(viewingEventId);
      setRegistrations(regs);
    }
  };

  const refreshTournaments = useCallback(() => {
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const targetId = isSuperAdmin ? null : user?.communityId;
    if (isSuperAdmin) {
      sportsService.getAllTournaments().then(setActiveTournaments).catch(() => { });
    } else if (targetId) {
      sportsService.getCommunityTournaments(targetId).then(setActiveTournaments).catch(() => { });
    }
  }, [user?.role, user?.communityId]);

  const refreshEvents = useCallback(() => {
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const targetId = isSuperAdmin ? null : user?.communityId;
    if (isSuperAdmin) {
      sportsService.getAllEvents().then(setActiveEvents).catch(() => { });
    } else if (targetId) {
      sportsService.getCommunityEvents(targetId).then(setActiveEvents).catch(() => { });
    }
  }, [user?.role, user?.communityId]);

  const refreshCategories = useCallback(() => {
    sportsService.getCategories().then(setPlayerCategories).catch(() => { });
  }, []);

  // Load data the first time each tab becomes active; skip on revisits.
  // Mutations (save / delete / activate) refresh their own data directly.
  useEffect(() => {
    if (hydratedTabs.current.has(activeTab)) return;
    hydratedTabs.current.add(activeTab);

    if (activeTab === "dashboard") {
      refreshTournaments();
    } else if (activeTab === "create-tournament") {
      // Tournament list is not needed in the form — only meta / categories / communities
      sportsService.getSportsMeta().then(setSportsMeta).catch(() => {});
      sportsService.getCategories().then(setPlayerCategories).catch(() => {});
      communityService.getCommunities().then(setCommunities).catch(() => {});
    } else if (activeTab === "sports-event") {
      refreshEvents();
      sportsService.getSportsMeta().then(setSportsMeta).catch(() => {});
      sportsService.getCategories().then(setPlayerCategories).catch(() => {});
    } else if (activeTab === "create-venue") {
      communityService.getCommunities().then(setCommunities).catch(() => {});
    } else if (activeTab === "player-category") {
      refreshCategories();
    }
    // sports-meta: SportsMetaSection loads its own data internally
  }, [activeTab, refreshTournaments, refreshEvents, refreshCategories]);

  // Fetch venues on first visit to any tab that needs them; re-fetch when the
  // refreshVenues callback identity changes (community or role changed).
  const venueTabsNeedFetch = activeTab === "create-venue" || activeTab === "create-tournament" || activeTab === "sports-event";
  const lastVenuesFetchRef = useRef<typeof refreshVenues | null>(null);
  useEffect(() => {
    if (!venueTabsNeedFetch) return;
    // Re-fetch only if: first time on a venue-using tab, OR community/role changed
    if (lastVenuesFetchRef.current !== refreshVenues) {
      lastVenuesFetchRef.current = refreshVenues;
      refreshVenues();
    }
  }, [refreshVenues, venueTabsNeedFetch]);

  // Reactively fetch details of the selected venue (only when relevant tabs are active)
  useEffect(() => {
    if (activeTab === "create-venue" || activeTab === "create-tournament") {
      if (!selectedVenueId) {
        setSelectedVenueDetails(null);
        return;
      }
      
      setLoadingVenueDetails(true);
      venueService.getVenueById(Number(selectedVenueId))
        .then(res => {
          setSelectedVenueDetails(res);
        })
        .catch(err => {
          console.error("Failed to load venue details:", err);
          // Fallback to local venues state if API fails
          const localVenue = venues.find(v => v.id === Number(selectedVenueId));
          if (localVenue) {
            setSelectedVenueDetails(localVenue);
          } else {
            setSelectedVenueDetails(null);
          }
        })
        .finally(() => {
          setLoadingVenueDetails(false);
        });
    }
  }, [selectedVenueId, venues, activeTab]);

  // Fetch communities filtered by venue type for venue form (only when relevant tabs are active and venueType is selected)
  useEffect(() => {
    if (activeTab === "create-venue" || activeTab === "create-tournament") {
      if (venueType && venueType !== "OUTSIDE") {
        communityService.getCommunities(venueType).then(setVenueCommunities).catch(() => setVenueCommunities([]));
      } else {
        setVenueCommunities([]);
        setVenueCommId("");
      }
    }
  }, [venueType, activeTab]);

  const toggleSport = (id: number) => {
    setSelectedSports(prev => {
      const exists = prev.includes(id);
      const nextSports = exists ? prev.filter(x => x !== id) : [...prev, id];
      
      setSelectedSportsWithEvents(current => {
        if (exists) {
          return current.filter(x => x.sportId !== id);
        } else {
          const s = sportsMeta.find(meta => meta.id === id);
          if (!s) return current;
          const isTeam = isTeamSport(s.name);
          const defaultEvent: SportEventState = {
            id: Math.random().toString(),
            name: "",
            gender: "ALL",
            playersBorn: "1900-01-01",
            format: isTeam ? "TEAM" : "SINGLES",
            minPlayers: isTeam ? getDefaultMinPlayers(s.name) : undefined,
            maxPlayers: isTeam ? getDefaultMinPlayers(s.name) + 4 : undefined,
            tournamentType: s.tournamentType || "",
          };
          return [...current, {
            sportId: id,
            sportName: s.name,
            sportIcon: s.icon,
            sportIconUrl: s.iconUrl || undefined,
            events: [defaultEvent]
          }];
        }
      });
      
      return nextSports;
    });
  };

  const toggleSportsEvent = (e: any) => {
    setSelectedEventIds(prev => {
      const exists = prev.includes(e.id);
      const nextIds = exists ? prev.filter(id => id !== e.id) : [...prev, e.id];

      const sportId = e.sport?.id || 0;
      if (!sportId) return nextIds;

      setSelectedSportsWithEvents(current => {
        if (exists) {
          const updated = current.map(item => {
            if (item.sportId === sportId) {
              return {
                ...item,
                events: item.events.filter(evt => evt.id !== e.id.toString())
              };
            }
            return item;
          }).filter(item => item.events.length > 0);
          
          setSelectedSports(updated.map(x => x.sportId));
          return updated;
        } else {
          const isTeam = isTeamSport(e.sport?.name || "");
          const newEvent: SportEventState = {
            id: e.id.toString(),
            name: e.name || "",
            gender: e.gender || "ALL",
            playersBorn: e.playersBorn || "1900-01-01",
            format: e.format || (isTeam ? "TEAM" : "SINGLES"),
            minPlayers: e.minPlayers || (isTeam ? getDefaultMinPlayers(e.sport?.name || "") : undefined),
            maxPlayers: e.maxPlayers || (isTeam ? getDefaultMinPlayers(e.sport?.name || "") + 4 : undefined),
            tournamentType: e.tournamentType || "",
            eventId: e.id,
          };

          const sportItem = current.find(x => x.sportId === sportId);
          let nextCurrent;
          if (sportItem) {
            nextCurrent = current.map(item => {
              if (item.sportId === sportId) {
                return {
                  ...item,
                  events: [...item.events, newEvent]
                };
              }
              return item;
            });
          } else {
            nextCurrent = [...current, {
              sportId: sportId,
              sportName: e.sport?.name || "Sport",
              sportIcon: e.sport?.icon || "🏆",
              sportIconUrl: e.sport?.iconUrl || undefined,
              events: [newEvent]
            }];
          }

          setSelectedSports(nextCurrent.map(x => x.sportId));
          return nextCurrent;
        }
      });

      return nextIds;
    });
  };

  const addEventToSport = (sportId: number) => {
    const meta = sportsMeta.find(m => m.id === sportId);
    setSelectedSportsWithEvents(prev => prev.map(s => {
      if (s.sportId !== sportId) return s;
      const isTeam = isTeamSport(s.sportName);
      const newEvent: SportEventState = {
        id: Math.random().toString(),
        name: "",
        gender: "ALL",
        playersBorn: "1900-01-01",
        format: isTeam ? "TEAM" : "SINGLES",
        minPlayers: isTeam ? getDefaultMinPlayers(s.sportName) : undefined,
        maxPlayers: isTeam ? getDefaultMinPlayers(s.sportName) + 4 : undefined,
        tournamentType: meta?.tournamentType || "",
      };
      return {
        ...s,
        events: [...s.events, newEvent]
      };
    }));
  };

  const removeEvent = (sportId: number, eventId: string) => {
    setSelectedSportsWithEvents(prev => prev.map(s => {
      if (s.sportId !== sportId) return s;
      if (s.events.length <= 1) {
        toast.warning("A selected sport must have at least one event configuration.");
        return s;
      }
      return {
        ...s,
        events: s.events.filter(e => e.id !== eventId)
      };
    }));
  };

  const updateEventField = (sportId: number, eventId: string, field: keyof SportEventState, value: any) => {
    setSelectedSportsWithEvents(prev => prev.map(s => {
      if (s.sportId !== sportId) return s;
      return {
        ...s,
        events: s.events.map(e => {
          if (e.id !== eventId) return e;
          return { ...e, [field]: value };
        })
      };
    }));
  };

  const removeSportCard = (sportId: number) => {
    setSelectedSports(prev => prev.filter(x => x !== sportId));
    setSelectedSportsWithEvents(prev => prev.filter(x => x.sportId !== sportId));
  };

  const toggleCat = (id: number) =>
    setSelectedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!eventName.trim() && !editingEventId) { toast.error("Tournament name is required"); return; }
    if (selectedSports.length === 0) { toast.error("Select at least one sport"); return; }
    if (!startDate || !endDate) { toast.error("Dates are required"); return; }
    
    // Validate events
    for (const s of selectedSportsWithEvents) {
      for (const e of s.events) {
        if (!e.name.trim()) {
          toast.error(`Event name is required for sport: ${s.sportName}`);
          return;
        }
        if (isTeamSport(s.sportName)) {
          if (!e.minPlayers || e.minPlayers <= 0) {
            toast.error(`Valid Min Players is required for event "${e.name}" in sport ${s.sportName}`);
            return;
          }
          if (!e.maxPlayers || e.maxPlayers <= 0) {
            toast.error(`Valid Max Players is required for event "${e.name}" in sport ${s.sportName}`);
            return;
          }
          if (e.maxPlayers < e.minPlayers) {
            toast.error(`Max Players cannot be less than Min Players for event "${e.name}" in sport ${s.sportName}`);
            return;
          }
        } else {
          if (!e.format) {
            toast.error(`Participant Type is required for event "${e.name}" in sport ${s.sportName}`);
            return;
          }
        }
        if (!e.tournamentType) {
          toast.error(`Tournament Format is required for event "${e.name}" in sport ${s.sportName}`);
          return;
        }
      }
    }
    
    // Contact Information validations
    if (!eventContactNumber.trim()) { toast.error("Tournament Contact Number is required"); return; }
    if (!eventContactEmail.trim()) { toast.error("Tournament Contact Email is required"); return; }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(eventContactEmail)) {
      toast.error("Please enter a valid Tournament Contact Email");
      return;
    }

    // Validate sponsors
    for (let i = 0; i < sponsors.length; i++) {
      const s = sponsors[i];
      if (!s.category.trim()) {
        toast.error(`Sponsor Category is required for sponsor #${i + 1}`);
        return;
      }
      if (!s.name.trim()) {
        toast.error(`Sponsor Name is required for sponsor #${i + 1}`);
        return;
      }
    }

    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const finalCommId = isSuperAdmin ? selectedCommId : user?.communityId;

    if (!finalCommId) { toast.error("Please select a community"); return; }

    const baseDate = getTournamentStartDateTime();
    const displayVenue = selectedVenueDetails?.name || "Sector 12 Ground, Block C";
    
    const displayStartDate = regStartDate 
      ? format(regStartDate, "dd MMM yyyy") 
      : "25 Nov 2026";
      
    const displayStartTime = startTime || "09:00 AM";
    
    let displayReportTime = "8:30 AM";
    if (baseDate) {
      const reportDate = new Date(baseDate.getTime() - 30 * 60000);
      displayReportTime = reportDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }

    const compileText = (text: string, currentEventName: string) => {
      if (!text) return "";
      const displayEventName = currentEventName.trim() || eventName.trim() || "Cricket League Season 2026";
      return text
        .replace(/{{tournament_name}}/g, displayEventName)
        .replace(/{{venue}}/g, displayVenue.split(",")[0])
        .replace(/{{start_date}}/g, displayStartDate)
        .replace(/{{start_time}}/g, displayStartTime)
        .replace(/{{report_time}}/g, displayReportTime);
    };

    const getNotificationPayloads = (currentEventName: string) => {
      return allTriggersToRender.map(t => ({
        id: t.id,
        label: t.label,
        offset: t.offset,
        enabled: t.enabled,
        title: compileText(t.title, currentEventName),
        body: compileText(t.body, currentEventName),
        recipients: t.recipients,
        overrideChannels: t.overrideChannels && t.overrideChannels.length > 0 ? t.overrideChannels : globalChannels,
        priority: t.priority || "NORMAL",
        isCustom: t.isCustom
      }));
    };

    setSubmitting(true);
    try {
      if (editingEventId) {
        const singleSport = selectedSportsWithEvents[0];
        const singleEvent = singleSport?.events[0];
        if (!singleEvent) {
          toast.error("No event configuration found to save");
          setSubmitting(false);
          return;
        }
        const isTeam = isTeamSport(singleSport.sportName);
        const targetEventIds = selectedSportsWithEvents.flatMap(s => s.events.map(e => e.eventId).filter(id => id != null).map(Number));
        const payload = {
          name: singleEvent.name,
          communityId: Number(finalCommId),
          venueId: selectedVenueId ? Number(selectedVenueId) : undefined,
          eventDateStart: format(startDate, "yyyy-MM-dd"),
          eventDateEnd: format(endDate, "yyyy-MM-dd"),
          registrationDateStart: regStartDate ? format(regStartDate, "yyyy-MM-dd") : undefined,
          registrationDateEnd: regEndDate ? format(regEndDate, "yyyy-MM-dd") : undefined,
          startTime: startTime,
          dueTime: dueTime,
          maxParticipants: parseInt(maxPax) || undefined,
          contactNumber: eventContactNumber,
          contactEmail: eventContactEmail,
          otherContacts: JSON.stringify(otherContacts.filter(c => c.title.trim() || c.name.trim() || c.detail.trim())),
          sponsors: sponsors.filter(s => s.category.trim() && s.name.trim()),
          bannerImage: bannerImage,
          tournamentLevel: tournamentLevel,
          description: description,
          allowAdminChat: allowAdminChat,
          notifications: getNotificationPayloads(singleEvent.name),
          sportsEventIds: targetEventIds,
        };
        await sportsService.updateTournament(editingEventId, payload as any);
        toast.success("Tournament updated successfully!");
      } else {
        const targetEventIds = selectedSportsWithEvents.flatMap(s => s.events.map(e => e.eventId).filter(id => id != null).map(Number));
        const payload = {
          name: eventName,
          communityId: Number(finalCommId),
          venueId: selectedVenueId ? Number(selectedVenueId) : undefined,
          eventDateStart: format(startDate, "yyyy-MM-dd"),
          eventDateEnd: format(endDate, "yyyy-MM-dd"),
          registrationDateStart: regStartDate ? format(regStartDate, "yyyy-MM-dd") : undefined,
          registrationDateEnd: regEndDate ? format(regEndDate, "yyyy-MM-dd") : undefined,
          startTime: startTime,
          dueTime: dueTime,
          maxParticipants: parseInt(maxPax) || undefined,
          contactNumber: eventContactNumber,
          contactEmail: eventContactEmail,
          otherContacts: JSON.stringify(otherContacts.filter(c => c.title.trim() || c.name.trim() || c.detail.trim())),
          sponsors: sponsors.filter(sp => sp.category.trim() && sp.name.trim()),
          bannerImage: bannerImage,
          tournamentLevel: tournamentLevel,
          description: description,
          allowAdminChat: allowAdminChat,
          notifications: getNotificationPayloads(eventName),
          sportsEventIds: targetEventIds,
        };
        await sportsService.createTournament(payload as any);
        toast.success("Tournament created successfully!");
      }

      resetForm();
      // Invalidate dashboard so the next visit re-fetches fresh tournament list
      hydratedTabs.current.delete("dashboard");
      setActiveTab("dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save tournament(s)");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEventName("");
    setSelectedVenueId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setRegStartDate(undefined);
    setRegEndDate(undefined);
    setSelectedSports([]);
    setSelectedSportsWithEvents([]);
    setSelectedCats([]);
    setSelectedCommId("");
    setEventContactNumber("");
    setEventContactEmail("");
    setOtherContacts([]);
    setSponsors([]);
    setBannerImage("");
    setTournamentLevel("Standard");
    setDescription("");
    setAllowAdminChat(false);
    setStartTime("09:00 AM");
    setDueTime("06:00 PM");
    setEditingEventId(null);
    setSelectedEventIds([]);

    // Reset notification schedule
    setGlobalChannels(["push", "email"]);
    setPreviewTrigger("2h");
    setExpandedTrigger(null);
    setCustomTriggers([]);
    setTriggerStates({
      "7d": {
        enabled: true,
        title: "🏏 Tournament Registration Open!",
        body: "Registration is now open for {{tournament_name}}! 🏆 Starting {{start_date}} at {{venue}}. Register before spots fill up. Tap to register now.",
        recipients: ["All Members", "Community Feed"],
        overrideChannels: ["push", "email", "whatsapp"]
      },
      "1d": {
        enabled: true,
        title: "🏆 Tournament Tomorrow!",
        body: "{{tournament_name}} begins TOMORROW at {{start_time}}! 📍 {{venue}}. Your match schedule is ready. Check your fixtures and prepare. See you on the ground! 🏅",
        recipients: ["Registered Players", "Team Owners", "Admins Only"],
        overrideChannels: []
      },
      "2h": {
        enabled: true,
        title: "⚡ 2 Hours to Kick-Off!",
        body: "⚡ {{tournament_name}} starts in 2 hours! Report at {{venue}} by {{report_time}}. Bring your kit & ID. Your first match is ready! Let's go! 🏏",
        recipients: ["Registered Players", "Team Owners", "Referees"],
        overrideChannels: []
      },
      "30m": {
        enabled: true,
        title: "🔴 30 Mins to Start — Head to Ground!",
        body: "🔴 FINAL CALL — {{tournament_name}} begins in 30 minutes! Head to {{venue}} NOW. Gate A open. Toss in 15 mins. Don't be late — matches won't be delayed! ⏱️",
        recipients: ["Registered Players", "Referees"],
        overrideChannels: ["push", "sms", "whatsapp", "inapp"]
      },
      "now": {
        enabled: true,
        title: "🏁 Tournament is LIVE Now!",
        body: "🏁 {{tournament_name}} has officially started! Follow live scores, results, and standings right here in the app. Play hard! 🏆",
        recipients: ["All Members", "Spectators", "Community Feed"],
        overrideChannels: []
      }
    });
  };

  const handleEdit = (tournamentOrEvent: any) => {
    // If it's a tournament object from the tournament table, extract the nested event and merge
    const ev = tournamentOrEvent.event
      ? {
          ...tournamentOrEvent.event,
          id: tournamentOrEvent.event.id,
          name: tournamentOrEvent.name || tournamentOrEvent.event.name,
          tournamentId: tournamentOrEvent.id
        }
      : tournamentOrEvent;

    setEventName(ev.name);
    setSelectedVenueId(ev.venue?.id ?? "");
    setStartDate(new Date(ev.eventDateStart));
    setEndDate(new Date(ev.eventDateEnd));
    setRegStartDate(ev.registrationDateStart ? new Date(ev.registrationDateStart) : undefined);
    setRegEndDate(ev.registrationDateEnd ? new Date(ev.registrationDateEnd) : undefined);
    setSelectedSports([ev.sport?.id]);
    
    const isTeam = isTeamSport(ev.sport?.name || "");
    const existingEvent: SportEventState = {
      id: ev.id ? String(ev.id) : Math.random().toString(),
      name: ev.name || "",
      gender: ev.gender || "ALL",
      playersBorn: ev.playersBorn || "1900-01-01",
      format: ev.format || (isTeam ? "TEAM" : "SINGLES"),
      minPlayers: ev.minPlayers,
      maxPlayers: ev.maxPlayers,
      tournamentType: ev.tournamentType || "",
      eventId: ev.id,
    };
    setSelectedSportsWithEvents([{
      sportId: ev.sport?.id,
      sportName: ev.sport?.name || "",
      sportIcon: ev.sport?.icon || "",
      sportIconUrl: ev.sport?.iconUrl || undefined,
      events: [existingEvent]
    }]);

    setSelectedCats(ev.categories?.map((c: any) => c.id) ?? []);
    setSelectedCommId(ev.community?.id ?? "");
    setEventContactNumber(ev.contactNumber || "");
    setEventContactEmail(ev.contactEmail || "");
    let parsedContacts = [];
    if (ev.otherContacts) {
      if (typeof ev.otherContacts === "string") {
        try {
          parsedContacts = JSON.parse(ev.otherContacts);
        } catch {
          parsedContacts = [];
        }
      } else if (Array.isArray(ev.otherContacts)) {
        parsedContacts = ev.otherContacts;
      }
    }
    setOtherContacts(parsedContacts);
    setSponsors(ev.sponsors || []);
    setBannerImage(ev.bannerImage || "");
    setTournamentLevel(ev.tournamentLevel || "Standard");
    setDescription(ev.description || "");
    setAllowAdminChat(ev.allowAdminChat || false);
    setStartTime(ev.startTime || "09:00 AM");
    setDueTime(ev.dueTime || "06:00 PM");

    // Load notification schedules if present
    if (ev.premiumNotifications && ev.premiumNotifications.length > 0) {
      const custom: any[] = [];
      const updatedDefaults = { ...triggerStates };

      ev.premiumNotifications.forEach((item: any) => {
        const recipientsList = item.recipients ? item.recipients.split(",") : [];
        const channelsList = item.channels ? item.channels.split(",") : [];
        
        const triggerId = item.triggerKey || String(item.id);
        const isDefaultKey = ["7d", "1d", "2h", "30m", "now"].includes(triggerId);

        if (isDefaultKey && !item.isCustom) {
          updatedDefaults[triggerId] = {
            enabled: item.enabled,
            title: item.title,
            body: item.body,
            recipients: recipientsList,
            overrideChannels: channelsList
          };
        } else {
          custom.push({
            id: triggerId,
            label: item.label || "Custom Trigger",
            offset: item.offsetMinutes || 0,
            enabled: item.enabled,
            title: item.title,
            body: item.body,
            recipients: recipientsList,
            overrideChannels: channelsList,
            priority: item.priority || "NORMAL",
            isCustom: true
          });
        }
      });

      setTriggerStates(updatedDefaults);
      setCustomTriggers(custom);
    }

    setEditingEventId(ev.id);
    setSelectedEventIds(ev.id ? [ev.id] : []);
    setActiveTab("create-tournament");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleActivate = (id: number) => {
    const tournament = activeTournaments.find(t => t.id === id);
    const name = tournament?.name || "Tournament";
    setActivatingTournament({ id, name });
  };

  const handleConfirmActivate = async (config: RegistrationNotifConfig) => {
    if (!activatingTournament) return;
    // Status update is the critical step — throw on failure so modal stays open
    await sportsService.updateTournamentStatus(activatingTournament.id, "REGISTRATION_OPEN");
    setActivatingTournament(null);
    refreshTournaments();
    refreshEvents();
    // Notification dispatch is secondary — warn but don't block
    try {
      await notificationService.sendRegistrationOpenNotification(activatingTournament.id, {
        sendEmail: config.sendEmail,
        sendPush: config.sendPush,
        sendSms: config.sendSms,
        message: config.message,
      });
      toast.success("Tournament opened for registration! Notifications sent to community.");
    } catch {
      toast.warning("Tournament opened for registration. Notifications could not be sent.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tournament?")) return;
    try {
      await sportsService.deleteTournament(id);
      toast.success("Tournament deleted");
      refreshTournaments();
    } catch (err) {
      toast.error("Failed to delete tournament");
    }
  };

  // ─── Registration handlers ────────────────────────────────────────────
  const handleViewPlayers = async (eventId: number) => {
    if (viewingEventId === eventId && viewMode === "players") {
      setViewingEventId(null);
      setRegistrations([]);
      return;
    }
    setViewingEventId(eventId);
    setViewMode("players");
    setNominatedCaptains([]);
    setLoadingRegs(true);
    try {
      const regs = await sportsService.getTournamentRegistrations(eventId);
      setRegistrations(regs);
    } catch {
      toast.error("Failed to load players");
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleViewCaptains = async (eventId: number) => {
    if (viewingEventId === eventId && viewMode === "captains") {
      setViewingEventId(null);
      setNominatedCaptains([]);
      return;
    }
    setViewingEventId(eventId);
    setViewMode("captains");
    setRegistrations([]);
    setLoadingRegs(true);
    try {
      const caps = await auctionService.getNominatedCaptains(eventId);
      setNominatedCaptains(caps);
    } catch {
      toast.error("Failed to load captains");
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleConfirmRegistration = async (regId: number) => {
    try {
      await sportsService.confirmRegistration(regId);
      toast.success("Player confirmed!");
      if (viewingEventId && viewMode === "players") {
        const regs = await sportsService.getTournamentRegistrations(viewingEventId);
        setRegistrations(regs);
      }
    } catch {
      toast.error("Failed to confirm registration");
    }
  };

  const handleConfirmCaptain = async (id: number, confirm: boolean) => {
    try {
      await auctionService.confirmCaptainByTeamId(id, confirm);
      toast.success(confirm ? "Captain confirmed!" : "Captain nomination rejected!");
      if (viewingEventId && viewMode === "captains") {
        const caps = await auctionService.getNominatedCaptains(viewingEventId);
        setNominatedCaptains(caps);
      }
    } catch {
      toast.error("Failed to update captain status");
    }
  };

  // ─── Venue CRUD ─────────────────────────────────────────────────────

  const resetVenueForm = () => {
    setVenueName(""); setVenueAddress(""); setVenueCity(""); setVenueArea("");
    setVenueMapLink(""); setVenueCapacity("");
    setVenueOpeningTime("08:00 AM"); setVenueClosingTime("08:00 PM");
    setVenueType(""); setVenueCommId("");
    setCourts([]);
    setContactName("");
    setContactNumber("");
    setContactEmail("");
    setVenuePinCode("");
    setEditingVenueId(null); setShowVenueForm(false);
  };

  const handleVenueEdit = (v: Venue) => {
    setVenueName(v.name); setVenueAddress(v.address || ""); setVenueCity(v.city || "");
    setVenueArea(v.area || ""); setVenueMapLink(v.mapLink || "");
    setVenueCapacity(v.capacity ? String(v.capacity) : "");
    setVenueOpeningTime(v.openingTime || "08:00 AM");
    setVenueClosingTime(v.closingTime || "08:00 PM");
    setVenueType(v.venueType || "");
    setCourts(v.courts || []);
    setContactName(v.contactName || "");
    setContactNumber(v.contactNumber || "");
    setContactEmail(v.contactEmail || "");
    setVenuePinCode(v.pinCode || "");
    setEditingVenueId(v.id); setShowVenueForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleVenueDelete = async (id: number) => {
    if (!confirm("Delete this venue? This may affect existing events.")) return;
    try {
      await venueService.deleteVenue(id);
      toast.success("Venue deleted"); refreshVenues();
    } catch { toast.error("Failed to delete venue"); }
  };

  const handleVenueHide = (id: number) => {
    setHiddenVenues(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleVenueSave = async () => {
    if (!venueName.trim()) { toast.error("Venue name is required"); return; }
    if (!venueOpeningTime) { toast.error("Opening time is required"); return; }
    if (!venueClosingTime) { toast.error("Closing time is required"); return; }
    if (!venueType) { toast.error("Venue type is required"); return; }
    if (venueType !== "OUTSIDE" && !venueCommId && user?.role === "SUPER_ADMIN") {
      toast.error("Community is required"); return;
    }

    // Contact Information validation
    if (!contactName.trim()) { toast.error("Contact Name is required"); return; }
    if (!contactNumber.trim()) { toast.error("Contact Number is required"); return; }
    if (!contactEmail.trim()) { toast.error("Contact Email is required"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      toast.error("Please enter a valid Contact Email");
      return;
    }

    setVenueSubmitting(true);
    try {
      const commId = venueCommId ? Number(venueCommId) : (user?.role === "SUPER_ADMIN" ? null : user?.communityId);
      const selectedCommunity = venueCommunities.find(c => c.id === commId);
      const category = selectedCommunity ? selectedCommunity.type : "APARTMENT";

      const payload = {
        name: venueName, address: venueAddress, city: venueCity, area: venueArea,
        mapLink: venueMapLink, capacity: venueCapacity ? parseInt(venueCapacity) : undefined,
        openingTime: venueOpeningTime,
        closingTime: venueClosingTime,
        venueType, venueCategory: category,
        courts,
        contactName,
        contactNumber,
        contactEmail,
        pinCode: venuePinCode,
      };

      if (editingVenueId) {
        await venueService.updateVenue(editingVenueId, payload);
        toast.success("Venue updated!");
      } else {
        await venueService.createVenue(commId, payload);
        toast.success("Venue created!");
      }
      resetVenueForm(); refreshVenues();
    } catch (err) {
      console.error("Save venue error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save venue");
    } finally { setVenueSubmitting(false); }
  };

  // ─── Player Category CRUD ───────────────────────────────────────────

  const resetCategoryForm = () => {
    setCategoryName(""); setCategoryType(""); setCategoryDescription("");
    setCategoryMinAge(""); setCategoryMaxAge(""); setCategoryGender("");
    setCategoryCommId(""); setEditingCategoryId(null); setShowCategoryForm(false);
  };

  const handleCategoryEdit = (c: PlayerCategory) => {
    setCategoryName(c.name); setCategoryType(c.categoryType || "");
    setCategoryDescription(c.description || "");
    setCategoryMinAge(c.minAge != null ? String(c.minAge) : "");
    setCategoryMaxAge(c.maxAge != null ? String(c.maxAge) : "");
    setCategoryGender(c.gender || ""); setCategoryCommId(c.communityId || "");
    setEditingCategoryId(c.id); setShowCategoryForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryDelete = async (id: number) => {
    if (!confirm("Delete this player category? This may affect existing players.")) return;
    try {
      await sportsService.deleteCategory(id);
      toast.success("Category deleted"); refreshCategories();
    } catch { toast.error("Failed to delete category"); }
  };

  const handleCategorySave = async () => {
    if (!categoryName.trim()) { toast.error("Category name is required"); return; }
    if (!categoryType) { toast.error("Category Type is required"); return; }
    if (!categoryGender) { toast.error("Gender is required"); return; }
    if (!categoryMinAge || !categoryMaxAge) { toast.error("Age range is required"); return; }
    setCategorySubmitting(true);
    try {
      const commId = categoryCommId ? Number(categoryCommId) : (user?.role === "SUPER_ADMIN" ? undefined : user?.communityId);
      const payload = {
        name: categoryName, categoryType: categoryType, description: categoryDescription,
        minAge: parseInt(categoryMinAge), maxAge: parseInt(categoryMaxAge),
        gender: categoryGender, communityId: commId,
      };
      if (editingCategoryId) {
        await sportsService.updateCategory(editingCategoryId, payload);
        toast.success("Category updated!");
      } else {
        await sportsService.createCategory(payload);
        toast.success("Category created!");
      }
      resetCategoryForm(); refreshCategories();
    } catch (err) {
      console.error("Save category error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save category");
    } finally { setCategorySubmitting(false); }
  };

  // ─── Sports Event CRUD ───────────────────────────────────────────
  const createDefaultEvent = (sportName: string): SportFormEvent => {
    const isTeam = isTeamSport(sportName);
    return {
      id: Math.random().toString(36).substring(2),
      eventName: "",
      startDate: "",
      endDate: "",
      gender: "ALL",
      playersBorn: "1900-01-01",
      format: isTeam ? "TEAM" : "",
      formats: isTeam ? ["TEAM"] : [],
      minPlayers: isTeam ? String(getDefaultMinPlayers(sportName)) : "",
      maxPlayers: isTeam ? String(getDefaultMinPlayers(sportName) + 4) : "",
      minAge: "10",
      maxAge: "70",
      tournamentType: "",
      venueId: "",
    };
  };

  const resetSportForm = () => {
    setSportForms([]);
    setShowSportForm(false);
    setShowSportPicker(false);
    setSportPickerSearch("");
  };

  const handleSportPickerSelect = async (sport: { name: string; icon: string }) => {
    let dbSport = sportsMeta.find(s => s.name.toLowerCase() === sport.name.toLowerCase());
    if (!dbSport) {
      try {
        dbSport = await sportsService.createSport({
          name: sport.name,
          icon: sport.icon || "🏆",
          formats: ["SINGLES"],
          active: true
        } as any);
        toast.success(`Global Sport Meta "${sport.name}" registered!`);
        const updatedMeta = await sportsService.getSportsMeta();
        setSportsMeta(updatedMeta);
      } catch (err: any) {
        toast.error(`Failed to register "${sport.name}" in global Sports Meta: ${err.message}`);
        return;
      }
    }
    const existsInForms = sportForms.some(f => f.sportId === dbSport.id);
    if (existsInForms) {
      toast.warning(`"${sport.name}" is already queued in the form below.`);
      return;
    }

    const newEntry: SportFormEntry = {
      id: Math.random().toString(36).substring(2),
      name: dbSport.name,
      icon: dbSport.icon || "🏆",
      iconUrl: dbSport.iconUrl || undefined,
      sportId: dbSport.id,
      editingSportId: null,
      events: [createDefaultEvent(dbSport.name)],
    };
    setSportForms(prev => [...prev, newEntry]);
    setShowSportPicker(false);
    setSportPickerSearch("");
    setShowSportForm(true);
  };

  const handleCreateCustomSport = async () => {
    const trimmedName = customSportName.trim();
    if (!trimmedName) {
      toast.error("Sport name is required");
      return;
    }
    
    setSportSubmitting(true);
    try {
      let dbSport = sportsMeta.find(s => s.name.toLowerCase() === trimmedName.toLowerCase());
      if (!dbSport) {
        dbSport = await sportsService.createSport({
          name: trimmedName,
          icon: customSportIcon || "🏆",
          formats: [customSportFormat],
          active: true
        } as any);
        toast.success(`Global Sport Meta "${trimmedName}" created!`);
        sportsService.getSportsMeta().then(setSportsMeta).catch(() => {});
      }

      const existsInForms = sportForms.some(f => f.sportId === dbSport.id);
      if (existsInForms) {
        toast.warning(`"${trimmedName}" is already queued in the form below.`);
        return;
      }

      const newEntry: SportFormEntry = {
        id: Math.random().toString(36).substring(2),
        name: dbSport.name,
        icon: dbSport.icon || "🏆",
        iconUrl: dbSport.iconUrl || undefined,
        sportId: dbSport.id,
        editingSportId: null,
        events: [createDefaultEvent(dbSport.name)],
      };
      setSportForms(prev => [...prev, newEntry]);
      setShowSportPicker(false);
      setSportPickerSearch("");
      setCustomSportName("");
      setCustomSportFormat("SINGLES");
      setCustomSportIcon("🏆");
      setShowSportForm(true);
      toast.success(`Event queued for "${trimmedName}".`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create custom sport metadata.");
    } finally {
      setSportSubmitting(false);
    }
  };

  const removeSportForm = (formId: string) => {
    setSportForms(prev => {
      const updated = prev.filter(f => f.id !== formId);
      if (updated.length === 0) {
        setShowSportForm(false);
      }
      return updated;
    });
  };

  const updateSportForm = (formId: string, field: keyof SportFormEntry, value: any) => {
    setSportForms(prev => prev.map(f => f.id === formId ? { ...f, [field]: value } : f));
  };

  const addEventToSportForm = (formId: string) => {
    setSportForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      return { ...f, events: [...f.events, createDefaultEvent(f.name)] };
    }));
  };

  const removeEventFromSportForm = (formId: string, eventId: string) => {
    setSportForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      if (f.events.length <= 1) {
        toast.warning("A sport must have at least one event configuration.");
        return f;
      }
      return { ...f, events: f.events.filter(ev => ev.id !== eventId) };
    }));
  };

  const updateSportFormEvent = (formId: string, eventId: string, field: any, value: any) => {
    setSportForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      return {
        ...f,
        events: f.events.map(ev => {
          if (ev.id === eventId) {
            if (field === "format" && value === "TEAM") {
              return { ...ev, [field]: value, formats: ["TEAM"] };
            }
            return { ...ev, [field]: value };
          }
          return ev;
        }),
      };
    }));
  };

  const applyCategoryToSportFormEvent = (formId: string, eventId: string, category: PlayerCategory) => {
    setSportForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      return {
        ...f,
        events: f.events.map(ev => ev.id === eventId ? {
          ...ev,
          gender: category.gender || "ALL",
          minAge: category.minAge != null ? String(category.minAge) : "10",
          maxAge: category.maxAge != null ? String(category.maxAge) : "70",
        } : ev),
      };
    }));
  };

  const handleSportEdit = (e: any) => {
    const resolvedFormats = Array.isArray(e.format)
      ? e.format
      : (typeof e.format === "string" ? e.format.split(",") : ["SINGLES"]);
    const isTeam = resolvedFormats.includes("TEAM");
    
    const evId = Math.random().toString(36).substring(2);
    const firstCatId = e.categories && e.categories.length > 0 
      ? String(e.categories[0].id) 
      : (e.categoryIds && e.categoryIds.length > 0 ? String(e.categoryIds[0]) : "");

    if (firstCatId) {
      setSelectedTemplates(prev => ({ ...prev, [evId]: firstCatId }));
    }

    const editEntry: SportFormEntry = {
      id: Math.random().toString(36).substring(2),
      name: e.sport?.name || e.name,
      icon: e.sport?.icon || e.icon || "🏆",
      iconUrl: e.sport?.iconUrl || e.iconUrl || undefined,
      sportId: e.sport?.id || 1,
      editingSportId: e.id,
      events: [{
        id: evId,
        eventName: e.name.includes(" — ") ? e.name.split(" — ")[1] : e.name,
        startDate: e.eventDateStart || "",
        endDate: e.eventDateEnd || "",
        gender: e.gender || "ALL",
        playersBorn: e.playersBorn || "1900-01-01",
        format: Array.isArray(e.format) ? e.format.join(",") : (e.format || ""),
        formats: resolvedFormats,
        minPlayers: e.minPlayers != null ? String(e.minPlayers) : "",
        maxPlayers: e.maxPlayers != null ? String(e.maxPlayers) : "",
        minAge: e.minAge != null ? String(e.minAge) : "10",
        maxAge: e.maxAge != null ? String(e.maxAge) : "70",
        tournamentType: e.tournamentType || "",
        venueId: e.venue?.id ?? "",
      }],
    };
    setSportForms([editEntry]);
    setShowSportForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSportDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete/cancel this scheduled event?")) return;
    try {
      await sportsService.deleteTournament(id);
      toast.success("Event deleted successfully");
      refreshEvents();
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const handleSportSave = async () => {
    // Validate all forms
    for (const form of sportForms) {
      for (const ev of form.events) {
        if (!ev.eventName.trim()) { toast.error("Event Name is required"); return; }
        if (!ev.startDate || !ev.endDate) { toast.error("Start Date and End Date are required"); return; }
        if (!ev.tournamentType) { toast.error("Tournament Format is required"); return; }
        if (isTeamSport(form.name)) {
          if (!ev.minPlayers || parseInt(ev.minPlayers) <= 0) { toast.error("Min Players is required"); return; }
          if (!ev.maxPlayers || parseInt(ev.maxPlayers) <= 0) { toast.error("Max Players is required"); return; }
          if (parseInt(ev.maxPlayers) < parseInt(ev.minPlayers)) { toast.error("Max Players must be >= Min Players"); return; }
        } else {
          if (!ev.formats || ev.formats.length === 0) { toast.error("Participant Type is required"); return; }
        }
      }
    }

    setSportSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const form of sportForms) {
      const isTeam = isTeamSport(form.name);

      for (let eIdx = 0; eIdx < form.events.length; eIdx++) {
        const ev = form.events[eIdx];
        const payload: SportsEventRequest = {
          name: `${form.name} — ${ev.eventName}`,
          sportId: form.sportId,
          communityId: Number(activeCommId) || 1,
          eventDateStart: ev.startDate,
          eventDateEnd: ev.endDate,
          venueId: ev.venueId ? Number(ev.venueId) : undefined,
          minAge: parseInt(ev.minAge) || 10,
          maxAge: parseInt(ev.maxAge) || 70,
          minPlayers: isTeam ? parseInt(ev.minPlayers) : undefined,
          maxPlayers: isTeam ? parseInt(ev.maxPlayers) : undefined,
          gender: ev.gender || "ALL",
          playersBorn: ev.playersBorn || "1900-01-01",
          format: isTeam ? "TEAM" : (ev.formats && ev.formats.length > 0 ? ev.formats.join(",") : "SINGLES"),
          tournamentType: ev.tournamentType || "KNOCKOUT",
          categoryIds: selectedTemplates[ev.id] ? [Number(selectedTemplates[ev.id])] : undefined,
        };

        try {
          if (form.editingSportId && eIdx === 0) {
            await sportsService.updateSportsEvent(form.editingSportId, payload);
            toast.success(`Event "${payload.name}" updated successfully!`);
          } else {
            await sportsService.createSportsEvent(payload);
            toast.success(`Event "${payload.name}" created successfully!`);
          }
          successCount++;
        } catch (err) {
          console.error(`Save event error:`, err);
          toast.error(err instanceof Error ? err.message : `Failed to save ${payload.name}`);
          failCount++;
        }
      }
    }

    if (successCount > 0) {
      refreshEvents();
    }
    if (failCount === 0) {
      resetSportForm();
    }
    setSportSubmitting(false);
  };

  // ─── Derived data ──────────────────────────────────────────────────
  const draftEvents = activeTournaments.filter(e => (e.event?.registrationStatus || e.registrationStatus) === "DRAFT");
  const liveEvents = activeTournaments.filter(e => {
    const status = e.event?.registrationStatus || e.registrationStatus;
    return status !== "DRAFT" && status !== "COMPLETED";
  });
  const completedEvents = activeTournaments.filter(e => (e.event?.registrationStatus || e.registrationStatus) === "COMPLETED");

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const activeCommId = isSuperAdmin ? (selectedCommId ? Number(selectedCommId) : undefined) : user?.communityId;
  const selectedComm = communities.find(c => c.id === activeCommId);
  const isGeneralCommunity = selectedComm
    ? (selectedComm.type === "GENERAL" || selectedComm.name.toLowerCase() === "general")
    : ((user as any)?.community?.type === "GENERAL" || (user as any)?.community?.name?.toLowerCase() === "general");

  // ─── Sidebar menu items ───────────────────────────────────────────
  const menuItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "sports-event", label: "Sports Event", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "create-venue", label: "Venue Creation", icon: <MapPin className="w-4 h-4" /> },
    { id: "player-category", label: "Player Category", icon: <Users className="w-4 h-4" /> },
  ];

  if (isAdmin) {
    menuItems.push({ id: "sports-meta", label: "Sports Meta", icon: <Trophy className="w-4 h-4" /> });
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Horizontal Menu ── */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-4">
        <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest px-2 hidden md:block border-r border-[#2a3a5c] pr-4">
          Sports Admin
        </div>
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === item.id
                ? "bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20"
                : "text-[#94a3b8] hover:bg-[#1a2540] hover:text-[#f1f5f9] border border-transparent"
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0">

        {/* ════════════ DASHBOARD TAB ════════════ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-[#f1f5f9]">Sports Admin Dashboard</h1>
                <p className="text-sm text-[#94a3b8] mt-1">Manage tournaments and venues for your community</p>
              </div>
              <button
                onClick={() => setActiveTab("create-tournament")}
                className="px-4 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Tournament
              </button>
            </div>

            {/* Draft Tournaments */}
            <TournamentSection
              title="Draft Tournaments"
              badge={draftEvents.length}
              badgeColor="bg-[#475569]/20 text-[#94a3b8]"
              emptyText="No draft tournaments"
              events={draftEvents}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onActivate={handleActivate}
              showActivate
            />

            {/* Active Tournaments */}
            <TournamentSection
              title="Open for Registration"
              badge={liveEvents.length}
              badgeColor="bg-[#10b981]/20 text-[#10b981]"
              emptyText="No active tournaments"
              events={liveEvents}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewPlayers={handleViewPlayers}
              onViewCaptains={handleViewCaptains}
              viewingEventId={viewingEventId}
              viewMode={viewMode}
              registrations={registrations}
              nominatedCaptains={nominatedCaptains}
              loadingRegs={loadingRegs}
              onConfirmRegistration={handleConfirmRegistration}
              onConfirmCaptain={handleConfirmCaptain}
              onAddParticipant={(eventId) => {
                setSelectedEventIdForAdd(eventId);
                setShowAddPlayerModal(true);
              }}
              onImportParticipants={(eventId) => {
                setSelectedEventIdForImport(eventId);
                setShowImportModal(true);
                setImportStep(1);
              }}
            />

            {/* Completed Tournaments */}
            <TournamentSection
              title="Completed Tournaments"
              badge={completedEvents.length}
              badgeColor="bg-[#3b82f6]/20 text-[#3b82f6]"
              emptyText="No completed tournaments"
              events={completedEvents}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}

        {/* ════════════ CREATE TOURNAMENT TAB ════════════ */}
        {activeTab === "create-tournament" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-[#f1f5f9]">
                  {editingEventId ? "Edit Tournament" : "CREATE TOURNAMENT"}
                </h1>
                <p className="text-sm text-[#94a3b8] mt-1">Configure tournament details and notification schedules</p>
              </div>
              <button
                onClick={() => { resetForm(); setActiveTab("dashboard"); }}
                className="px-4 py-2 text-sm text-[#94a3b8] border border-[#2a3a5c] rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-6 space-y-6">
                <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest border-b border-[#2a3a5c] pb-2">Tournament Details</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-1.5">Tournament Name</label>
                    <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. Box Cricket Tournament Season 2" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                  </div>

                  {user?.role === "SUPER_ADMIN" ? (
                    <div>
                      <label className="text-xs text-[#94a3b8] block mb-1.5">Target Community</label>
                      <select
                        value={selectedCommId}
                        onChange={e => setSelectedCommId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                      >
                        <option value="">Select Community...</option>
                        {communities.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-[#94a3b8] block mb-1.5">Max Participants</label>
                      <input type="number" value={maxPax} onChange={e => setMaxPax(e.target.value)} placeholder="64" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="text-xs text-[#94a3b8] block mb-1.5">About This Tournament (Say something about this tournament)</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Say something about this tournament (rules, schedule, special terms, prizes...)"
                      rows={3}
                      className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col gap-3 border border-dashed border-[#f97316]/30 bg-[#f97316]/5 rounded-xl p-4 md:p-5">
                    <h4 className="text-[#f97316] font-bold text-sm uppercase tracking-wider">Sports Event Settings</h4>
                    <div className="flex flex-col gap-2 mt-1 max-h-52 overflow-y-auto p-1.5 border border-[#2a3a5c] rounded-lg bg-[#0c1220] pr-2">
                      {activeEvents.map(e => {
                        const isSelected = selectedEventIds.includes(e.id);
                        return (
                          <div
                            key={e.id}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                              isSelected
                                ? "border-[#f97316]/50 bg-[#f97316]/10 text-[#f97316] shadow-sm shadow-[#f97316]/5"
                                : "border-[#2a3a5c] bg-[#0c1220] text-[#94a3b8] hover:border-[#475569]/50"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleSportsEvent(e)}
                              className="flex-1 text-left bg-transparent border-none outline-none cursor-pointer flex items-center justify-between gap-2 overflow-hidden hover:text-[#f1f5f9] transition-colors"
                            >
                              <span className="truncate">{e.name}</span>
                              <span className="text-[10px] opacity-75 font-normal flex-shrink-0">({e.sport?.name || "Sport"})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!isSelected) {
                                  toggleSportsEvent(e);
                                }
                                setConfiguringSportId(e.sport?.id || 0);
                                setShowSportConfigModal(true);
                              }}
                              className="p-1.5 hover:bg-[#f97316]/20 text-[#64748b] hover:text-[#f97316] rounded-lg transition-all cursor-pointer bg-transparent border border-transparent hover:border-[#f97316]/30"
                              title="Edit Configuration"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      {activeEvents.length === 0 && (
                        <div className="text-xs text-[#94a3b8] italic p-2 text-center w-full">No active events found.</div>
                      )}
                    </div>
                  </div>
                </div>



                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8]">Tournament Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full bg-[#0c1220] border-[#2a3a5c] hover:bg-[#1a2540] hover:text-[#f1f5f9] text-[#f1f5f9] justify-start text-left font-normal px-3 py-5", !startDate && "text-[#94a3b8]")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8]">Tournament End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full bg-[#0c1220] border-[#2a3a5c] hover:bg-[#1a2540] hover:text-[#f1f5f9] text-[#f1f5f9] justify-start text-left font-normal px-3 py-5", !endDate && "text-[#94a3b8]")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8]">Reg Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full bg-[#0c1220] border-[#2a3a5c] hover:bg-[#1a2540] hover:text-[#f1f5f9] text-[#f1f5f9] justify-start text-left font-normal px-3 py-5", !regStartDate && "text-[#94a3b8]")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {regStartDate ? format(regStartDate, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar mode="single" selected={regStartDate} onSelect={setRegStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8]">Reg End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full bg-[#0c1220] border-[#2a3a5c] hover:bg-[#1a2540] hover:text-[#f1f5f9] text-[#f1f5f9] justify-start text-left font-normal px-3 py-5", !regEndDate && "text-[#94a3b8]")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {regEndDate ? format(regEndDate, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar mode="single" selected={regEndDate} onSelect={setRegEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8]">Start Time</label>
                    <select
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8]">Due Time</label>
                    <select
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                      className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {user?.role === "SUPER_ADMIN" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-[#94a3b8] block mb-1.5">Max Participants</label>
                      <input type="number" value={maxPax} onChange={e => setMaxPax(e.target.value)} placeholder="64" className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest border-b border-[#2a3a5c] pb-2 mb-3">Tournament Level & Branding</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-[#94a3b8] block mb-2">Tournament Type</label>
                      <div className="flex gap-3">
                        {(["Standard", "Professional", "Premium"] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setTournamentLevel(type)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-all ${
                              tournamentLevel === type
                                ? "border-[#f97316] bg-orange-500/10 text-[#f97316]"
                                : "border-[#2a3a5c] bg-[#0c1220] text-[#94a3b8] hover:border-[#475569]"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                     <div>
                      <label className="text-xs text-[#94a3b8] block mb-1.5">Banner Image</label>
                      {bannerImage ? (
                        <div className="relative h-[42px] w-full rounded-lg overflow-hidden border border-[#2a3a5c] group flex items-center justify-between px-3 bg-[#0c1220]">
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={bannerImage} alt="Banner Preview" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                            <span className="text-xs text-[#f1f5f9] truncate">Banner Uploaded</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBannerImage("")}
                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-500/20 hover:border-red-600 text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-between border border-dashed border-[#2a3a5c] hover:border-[#f97316] rounded-lg px-3 py-1.5 bg-[#0c1220] transition-colors cursor-pointer group h-[42px]">
                          <span className="text-xs text-[#94a3b8] group-hover:text-[#f1f5f9] transition-colors">Upload banner image (Max 2MB)</span>
                          <div className="px-2.5 py-1 bg-[#1a2540] border border-[#2a3a5c] rounded text-[10px] text-[#f97316] font-medium group-hover:border-[#f97316] transition-colors flex items-center gap-1">
                            Browse
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest border-b border-[#2a3a5c] pb-2 mb-3">Tournament Contact Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label className="text-xs text-[#94a3b8] block mb-1.5">Contact Number *</label>
                      <input
                        value={eventContactNumber}
                        onChange={e => setEventContactNumber(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#94a3b8] block mb-1.5">Contact Email *</label>
                      <input
                        type="email"
                        value={eventContactEmail}
                        onChange={e => setEventContactEmail(e.target.value)}
                        placeholder="e.g. contact@tournament.com"
                        className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#f97316] outline-none"
                      />
                    </div>
                  </div>

                  {/* Other Contacts / Information (multiple entries) */}
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#94a3b8]">Other Information (Multiple entries)</span>
                      <button
                        type="button"
                        onClick={addOtherContact}
                        className="text-xs text-[#f97316] hover:text-[#ea580c] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Contact
                      </button>
                    </div>

                    {otherContacts.length === 0 ? (
                      <div className="text-center py-4 bg-[#0c1220]/50 border border-dashed border-[#2a3a5c] rounded-lg text-xs text-[#64748b]">
                        No extra contact information added yet. Click "+ Add Contact" if you'd like to list volunteers, referees, or co-organizers.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {otherContacts.map((contact, index) => (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#0c1220] border border-[#2a3a5c] rounded-lg relative group">
                            <div>
                              <label className="text-[10px] text-[#64748b] block mb-1">Title (Contact Title)</label>
                              <input
                                value={contact.title}
                                onChange={e => updateOtherContact(index, "title", e.target.value)}
                                placeholder="e.g. Organizer"
                                className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-[#64748b] block mb-1">Name (Full Name)</label>
                              <input
                                value={contact.name}
                                onChange={e => updateOtherContact(index, "name", e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="text-[10px] text-[#64748b] block mb-1">Detail (Number/Email)</label>
                                <input
                                  value={contact.detail}
                                  onChange={e => updateOtherContact(index, "detail", e.target.value)}
                                  placeholder="e.g. john@mail.com"
                                  className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeOtherContact(index)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20 cursor-pointer mb-0.5"
                                title="Remove Contact"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tournament Sponsors Section */}
                <div className="pt-2">
                  <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest border-b border-[#2a3a5c] pb-2 mb-3">Tournament Sponsors</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#94a3b8]">Sponsors List (Multiple entries)</span>
                      <button
                        type="button"
                        onClick={addSponsor}
                        className="text-xs text-[#f97316] hover:text-[#ea580c] transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Sponsor
                      </button>
                    </div>

                    {sponsors.length === 0 ? (
                      <div className="text-center py-4 bg-[#0c1220]/50 border border-dashed border-[#2a3a5c] rounded-lg text-xs text-[#64748b]">
                        No tournament sponsors added yet. Click "+ Add Sponsor" to highlight title or category sponsors.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sponsors.map((sponsor, index) => (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#0c1220] border border-[#2a3a5c] rounded-lg relative group">
                            <div>
                              <label className="text-[10px] text-[#64748b] block mb-1">Sponsor Category *</label>
                              <input
                                value={sponsor.category}
                                onChange={e => updateSponsor(index, "category", e.target.value)}
                                placeholder="e.g. Title Sponsor"
                                className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {["Title Sponsor", "Gold Sponsor", "Silver Sponsor", "Associate Sponsor"].map(suggestion => (
                                  <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => updateSponsor(index, "category", suggestion)}
                                    className={cn(
                                      "px-1.5 py-0.5 rounded text-[9px] border transition-all cursor-pointer font-medium",
                                      sponsor.category === suggestion
                                        ? "bg-[#f97316]/20 border-[#f97316] text-[#f97316]"
                                        : "bg-[#162238] border-[#2a3a5c] text-[#94a3b8] hover:border-[#f97316]/50 hover:text-[#f1f5f9]"
                                    )}
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-[#64748b] block mb-1">Sponsor Name *</label>
                              <input
                                value={sponsor.name}
                                onChange={e => updateSponsor(index, "name", e.target.value)}
                                placeholder="e.g. Google DeepMind"
                                className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="text-[10px] text-[#64748b] block mb-1">Sponsor URL (Optional)</label>
                                <input
                                  type="url"
                                  value={sponsor.url || ""}
                                  onChange={e => updateSponsor(index, "url", e.target.value)}
                                  placeholder="e.g. https://deepmind.google"
                                  className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSponsor(index)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20 cursor-pointer mb-0.5 h-[34px] flex items-center justify-center"
                                title="Remove Sponsor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest border-b border-[#2a3a5c] pb-2 mb-3">Chat Configuration</div>
                  <div className="flex items-center justify-between px-4 py-3 bg-[#0c1220] rounded-lg border border-[#2a3a5c] opacity-65 cursor-not-allowed">
                    <div>
                      <span className="text-xs font-medium text-[#f1f5f9] block">Chat With Administrator</span>
                      <span className="text-[10px] text-[#64748b] block mt-0.5">Allow applicants to chat with Administrator? (Presently disabled)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-not-allowed">
                      <input type="checkbox" disabled checked={allowAdminChat} className="sr-only peer" />
                      <div className="w-9 h-5 rounded-full bg-[#1a2540] relative">
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white/30 rounded-full" />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest border-b border-[#2a3a5c] pb-2 mb-4">Notification Settings</div>
                  
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left shadow-lg">
                    <div>
                      <h3 className="text-sm font-bold text-[#f1f5f9] flex items-center gap-2">
                        📡 Automated Notification Scheduler
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316] rounded-full">
                          {totalEnabledCount} Active Triggers
                        </span>
                      </h3>
                      <p className="text-xs text-[#94a3b8] mt-1.5 leading-relaxed max-w-xl">
                        Configure multi-channel automated triggers (Email, Push, WhatsApp, SMS) relative to tournament kick-off. Customize delivery channels, custom templates, and analyze audience reach metrics.
                      </p>
                      <div className="flex gap-4 mt-3 flex-wrap text-[10px] font-mono text-[#64748b]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Active Channels: {globalChannels.join(", ").toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          <span>Custom Triggers: {customTriggers.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                          <span>Total Dispatches: {totalOutputSends} sends</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNotificationModal(true)}
                      className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-orange-500/10 border-none cursor-pointer flex items-center justify-center gap-2 flex-shrink-0"
                    >
                      <span>⚙️ Configure Scheduler</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#2a3a5c]">
                  {editingEventId && (
                    <button onClick={() => { resetForm(); setActiveTab("dashboard"); }} className="flex-1 py-3 bg-transparent border border-[#2a3a5c] text-[#94a3b8] text-sm font-medium rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] cursor-pointer transition-colors">
                      Cancel
                    </button>
                  )}
                  <button onClick={handleSave} disabled={submitting} className="flex-[2] py-3 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-70 text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingEventId ? "Update Tournament" : "Save Tournament ↗")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ SPORTS EVENT MANAGEMENT TAB ════════════ */}
        {activeTab === "sports-event" && (
          <SportsEventSection
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showSportForm={showSportForm}
            setShowSportForm={setShowSportForm}
            showSportPicker={showSportPicker}
            setShowSportPicker={setShowSportPicker}
            sportPickerSearch={sportPickerSearch}
            setSportPickerSearch={setSportPickerSearch}
            sportSubmitting={sportSubmitting}
            sportForms={sportForms}
            sportsMeta={sportsMeta}
            playerCategories={playerCategories}
            venues={venues}
            activeEvents={activeEvents}
            handleSportPickerSelect={handleSportPickerSelect}
            handleCreateCustomSport={handleCreateCustomSport}
            removeSportForm={removeSportForm}
            addEventToSportForm={addEventToSportForm}
            removeEventFromSportForm={removeEventFromSportForm}
            updateSportFormEvent={updateSportFormEvent}
            handleSportSave={handleSportSave}
            handleSportEdit={handleSportEdit}
            handleSportDelete={handleSportDelete}
            resetSportForm={resetSportForm}
            selectedTemplates={selectedTemplates}
            setSelectedTemplates={setSelectedTemplates}
            openDropdownEventId={openDropdownEventId}
            setOpenDropdownEventId={setOpenDropdownEventId}
            searchQueries={searchQueries}
            setSearchQueries={setSearchQueries}
            activeCommId={activeCommId}
            isSuperAdmin={isSuperAdmin}
            isAdmin={isAdmin}
          />
        )}

        {/* ════════════ VENUE MANAGEMENT TAB ════════════ */}
        {activeTab === "create-venue" && (
          <VenueCreationSection
            user={user}
            communities={communities}
            venueCommunities={venueCommunities}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showVenueForm={showVenueForm}
            setShowVenueForm={setShowVenueForm}
            editingVenueId={editingVenueId}
            venueName={venueName}
            setVenueName={setVenueName}
            venueType={venueType}
            setVenueType={setVenueType}
            venueCommId={venueCommId}
            setVenueCommId={setVenueCommId}
            venueAddress={venueAddress}
            setVenueAddress={setVenueAddress}
            venueCity={venueCity}
            setVenueCity={setVenueCity}
            venueArea={venueArea}
            setVenueArea={setVenueArea}
            venueCapacity={venueCapacity}
            setVenueCapacity={setVenueCapacity}
            venuePinCode={venuePinCode}
            setVenuePinCode={setVenuePinCode}
            venueMapLink={venueMapLink}
            setVenueMapLink={setVenueMapLink}
            venueOpeningTime={venueOpeningTime}
            setVenueOpeningTime={setVenueOpeningTime}
            venueClosingTime={venueClosingTime}
            setVenueClosingTime={setVenueClosingTime}
            contactName={contactName}
            setContactName={setContactName}
            contactNumber={contactNumber}
            setContactNumber={setContactNumber}
            contactEmail={contactEmail}
            setContactEmail={setContactEmail}
            courts={courts}
            addCourt={addCourt}
            removeCourt={removeCourt}
            updateCourt={updateCourt}
            venueSubmitting={venueSubmitting}
            resetVenueForm={resetVenueForm}
            handleVenueSave={handleVenueSave}
            venues={venues}
            hiddenVenues={hiddenVenues}
            handleVenueEdit={handleVenueEdit}
            handleVenueHide={handleVenueHide}
            handleVenueDelete={handleVenueDelete}
          />
        )}

        {/* ════════════ PLAYER CATEGORY TAB ════════════ */}
        {activeTab === "player-category" && (
          <PlayerCategorySection
            user={user}
            communities={communities}
            playerCategories={playerCategories}
            showCategoryForm={showCategoryForm}
            setShowCategoryForm={setShowCategoryForm}
            editingCategoryId={editingCategoryId}
            categoryName={categoryName}
            setCategoryName={setCategoryName}
            categoryType={categoryType}
            setCategoryType={setCategoryType}
            categoryGender={categoryGender}
            setCategoryGender={setCategoryGender}
            categoryMinAge={categoryMinAge}
            setCategoryMinAge={setCategoryMinAge}
            categoryMaxAge={categoryMaxAge}
            setCategoryMaxAge={setCategoryMaxAge}
            categoryCommId={categoryCommId}
            setCategoryCommId={setCategoryCommId}
            categoryDescription={categoryDescription}
            setCategoryDescription={setCategoryDescription}
            categorySubmitting={categorySubmitting}
            resetCategoryForm={resetCategoryForm}
            handleCategorySave={handleCategorySave}
            handleCategoryEdit={handleCategoryEdit}
            handleCategoryDelete={handleCategoryDelete}
            setActiveTab={setActiveTab}
          />
        )}

        {/* ════════════ SPORTS META TAB ════════════ */}
        {activeTab === "sports-meta" && isAdmin && (
          <SportsMetaSection isAdmin={isAdmin} />
        )}

      </div>

      {/* ── Notification Setup Popup Modal ── */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl text-left"
            style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.08)" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3a5c] flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2">
                  📡 Notification Setup
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Configure multi-channel automated triggers relative to tournament kick-off
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="p-2 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-white transition-colors border-none bg-transparent cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable content) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-[#f8fafc]">
                {/* LEFT COLUMN: CONTROLS & TRIGGERS PANEL */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* LIVE TEMPLATE CONTEXT */}
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#f1f5f9] mb-4 flex items-center gap-2">🏆 Live Preview Context Variables</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="flex flex-col gap-1.5 p-3 bg-[#0c1220]/60 rounded-lg border border-[#2a3a5c]/50 text-left">
                        <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Tournament Name Placeholder</span>
                        <span className="text-[#f1f5f9] font-medium truncate">{eventName.trim() || "Cricket League Season 2026"}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 p-3 bg-[#0c1220]/60 rounded-lg border border-[#2a3a5c]/50 text-left">
                        <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Start Time Placeholder</span>
                        <span className="text-[#f1f5f9] font-medium truncate">
                          {regStartDate ? format(regStartDate, "dd MMM yyyy") : "25 Nov 2026"} · {startTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DEFAULT DELIVERY CHANNELS */}
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#f1f5f9] mb-2 text-left">📡 Default Global Delivery Channels</h2>
                    <p className="text-[10px] text-[#64748b] mb-4 font-medium text-left">Fires cross-platform unless customized per specific trigger below</p>
                    <div className="flex gap-2 flex-wrap">
                      {CHANNEL_META.map(ch => {
                        const isActive = globalChannels.includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => toggleGlobalChannel(ch.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                              isActive 
                                ? "border-[#f97316] text-[#f97316] bg-[#f97316]/10" 
                                : "border-[#2a3a5c] bg-[#0c1220] text-[#94a3b8] hover:border-[#475569] hover:text-[#f1f5f9]"
                            }`}
                          >
                            <span>{ch.emoji}</span>
                            <span>{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* INTERACTIVE RULESET ACCORDION */}
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#2a3a5c] flex justify-between items-center bg-[#0c1220]/40">
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#f1f5f9] text-left">⚡ Execution Rules & Custom Templates</h2>
                        <p className="text-[10px] text-[#64748b] font-medium text-left mt-0.5">Toggle rules, customize messages, and add custom schedules</p>
                      </div>
                      <button
                        type="button"
                        onClick={addCustomTrigger}
                        className="px-3 py-1.5 bg-[#f97316]/10 hover:bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        + Add Custom Rule
                      </button>
                    </div>

                    <div className="divide-y divide-[#2a3a5c]/50">
                      {allTriggersToRender.map(triggerMeta => {
                        const isExpanded = expandedTrigger === triggerMeta.id;
                        const isCustom = triggerMeta.isCustom;

                        return (
                          <div key={triggerMeta.id} className="transition-colors hover:bg-[#0c1220]/10">
                            {/* Accordion Trigger Header */}
                            <div className="px-5 py-3.5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <label className="relative inline-flex inline-flex items-center cursor-pointer flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={triggerMeta.enabled}
                                    onChange={() => toggleTriggerRow(triggerMeta.id, isCustom)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-8 h-4 rounded-full bg-[#1a2540] peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 relative transition-colors duration-200">
                                    <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-4" />
                                  </div>
                                </label>

                                <div className="min-w-0 flex-1 text-left">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-[#f1f5f9] truncate">
                                      {triggerMeta.emoji} {triggerMeta.label}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${triggerMeta.tagClass}`}>
                                      {isCustom ? "Custom Schedule" : "System Template"}
                                    </span>
                                    {triggerMeta.priority === 'Critical' && (
                                      <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 rounded">High Priority</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewTrigger(triggerMeta.id)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border ${
                                    previewTrigger === triggerMeta.id
                                      ? "bg-[#f97316] border-[#f97316] text-white"
                                      : "bg-[#0c1220] border-[#2a3a5c] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#475569]"
                                  }`}
                                >
                                  Preview Device
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedTrigger(isExpanded ? null : triggerMeta.id)}
                                  className="p-1 hover:bg-[#1a2540] rounded text-[#64748b] hover:text-white transition-colors cursor-pointer bg-transparent border-none text-[8px]"
                                >
                                  {isExpanded ? "▲" : "▼"}
                                </button>
                              </div>
                            </div>

                            {/* Accordion Content Block */}
                            {isExpanded && (
                              <div className="px-5 pb-5 pt-1 bg-[#0c1220]/30 space-y-4 animate-in slide-in-from-top-2 duration-200 border-t border-[#2a3a5c]/20 text-left">
                                {/* Custom schedule settings */}
                                {isCustom && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Schedule Label name</label>
                                      <input
                                        type="text"
                                        value={triggerMeta.label}
                                        onChange={e => handleTriggerFieldChange(triggerMeta.id, true, 'label', e.target.value)}
                                        className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs font-semibold text-[#f1f5f9] placeholder-slate-600 outline-none focus:border-[#f97316]"
                                        placeholder="e.g., Post-Match Wrapup"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Trigger Kick-Off Offset</label>
                                      <select
                                        value={triggerMeta.offset}
                                        onChange={e => handleTriggerFieldChange(triggerMeta.id, true, 'offset', parseInt(e.target.value))}
                                        className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs font-semibold text-[#f97316] outline-none cursor-pointer focus:border-[#f97316]"
                                      >
                                        {CUSTOM_OFFSET_OPTIONS.map(opt => (
                                          <option key={opt.offset} value={opt.offset}>{opt.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                )}

                                {/* Channel Overrides & Target Recipients matrices */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Target Recipients Group</label>
                                    <div className="flex flex-wrap gap-1">
                                      {RECIPIENT_OPTIONS.map(role => {
                                        const isSelected = triggerMeta.recipients.includes(role);
                                        return (
                                          <button
                                            key={role}
                                            type="button"
                                            onClick={() => toggleRecipient(triggerMeta.id, isCustom, role)}
                                            className={`text-[9px] font-bold px-2.5 py-1 rounded transition border cursor-pointer ${
                                              isSelected
                                                ? "bg-[#f97316]/15 border-[#f97316]/30 text-[#f97316]"
                                                : "bg-[#0c1220] border-[#2a3a5c]/60 text-[#475569] hover:text-[#94a3b8]"
                                            }`}
                                          >
                                            {role}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Override Target Delivery Channels</label>
                                    <div className="flex flex-wrap gap-1">
                                      {CHANNEL_META.map(ch => {
                                        const isSelected = triggerMeta.overrideChannels.includes(ch.id);
                                        return (
                                          <button
                                            key={ch.id}
                                            type="button"
                                            onClick={() => toggleTriggerChannel(triggerMeta.id, ch.id, isCustom)}
                                            className={`text-[9px] font-bold px-2.5 py-1 rounded transition border cursor-pointer ${
                                              isSelected
                                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                                : "bg-[#0c1220] border-[#2a3a5c]/60 text-[#475569] hover:text-[#94a3b8]"
                                            }`}
                                          >
                                            <span>{ch.emoji}</span> {ch.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <span className="text-[8px] text-[#64748b] font-medium block mt-1">If blank, defaults to Global selection settings</span>
                                  </div>
                                </div>

                                {/* Custom Priority level settings */}
                                <div>
                                  <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Custom Rules Priority</label>
                                  <div className="flex gap-2">
                                    {['Normal', 'High', 'Critical'].map(level => {
                                      const isSelected = triggerMeta.priority === level;
                                      return (
                                        <button
                                          key={level}
                                          type="button"
                                          onClick={() => {
                                            if (isCustom) handleTriggerFieldChange(triggerMeta.id, true, 'priority', level);
                                            else {
                                              setTriggerStates(prev => ({
                                                ...prev,
                                                [triggerMeta.id]: { ...prev[triggerMeta.id], priority: level }
                                              }));
                                            }
                                          }}
                                          className={`flex-1 py-1.5 rounded text-[10px] font-bold transition border cursor-pointer ${
                                            isSelected 
                                              ? "bg-slate-700 border-slate-600 text-white font-black"
                                              : "bg-[#0c1220] border-[#2a3a5c]/60 text-[#64748b] hover:text-[#94a3b8]"
                                          }`}
                                        >
                                          {level}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Title payload builder */}
                                <div>
                                  <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Title Payload Header</label>
                                  <input
                                    type="text"
                                    value={triggerMeta.title}
                                    onChange={e => {
                                      if (isCustom) handleTriggerFieldChange(triggerMeta.id, true, 'title', e.target.value);
                                      else {
                                        setTriggerStates(prev => ({
                                          ...prev,
                                          [triggerMeta.id]: { ...prev[triggerMeta.id], title: e.target.value }
                                        }));
                                      }
                                    }}
                                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs font-semibold text-[#f1f5f9] placeholder-slate-600 outline-none focus:border-[#f97316]"
                                    placeholder="Rule Title"
                                  />
                                </div>

                                {/* Markdown body content area */}
                                <div>
                                  <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Markdown Text Body Content Template</label>
                                  <textarea
                                    value={triggerMeta.body}
                                    onChange={e => {
                                      if (isCustom) handleTriggerFieldChange(triggerMeta.id, true, 'body', e.target.value);
                                      else {
                                        setTriggerStates(prev => ({
                                          ...prev,
                                          [triggerMeta.id]: { ...prev[triggerMeta.id], body: e.target.value }
                                        }));
                                      }
                                    }}
                                    rows={3}
                                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs font-semibold text-[#f1f5f9] placeholder-slate-600 outline-none focus:border-[#f97316] resize-y font-sans leading-relaxed"
                                    placeholder="Template Content Details"
                                  />
                                </div>

                                {/* Custom rule deletion button */}
                                {isCustom && (
                                  <div className="flex justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => removeCustomTrigger(triggerMeta.id)}
                                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                    >
                                      Delete Trigger Rule
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: REALTIME HIGH-FIDELITY DEVICE PREVIEWS & AUDIENCE STATS */}
                <div className="space-y-6">
                  
                  {/* DEVICE WRAPPER & HEADING CONTROLLER */}
                  <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-5 space-y-5 shadow-xl">
                    <div className="flex justify-between items-center border-b border-[#2a3a5c]/50 pb-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#f1f5f9] flex items-center gap-2">👁️ Mock Device Preview</h2>
                      <select
                        className="bg-[#0c1220] border border-[#2a3a5c] rounded-lg p-1.5 text-[10px] font-bold text-[#f97316] outline-none cursor-pointer"
                        value={previewTrigger}
                        onChange={e => setPreviewTrigger(e.target.value)}
                      >
                        <option value="7d">7 Days Prior</option>
                        <option value="1d">1 Day Prior</option>
                        <option value="2h">2 Hours Prior</option>
                        <option value="30m">30 Mins Prior</option>
                        <option value="now">On Start</option>
                        {customTriggers.map(ct => (
                          <option key={ct.id} value={ct.id}>{ct.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* HIGH FIDELITY DEVICE OVERLAY MOCKUP */}
                    <div className="bg-black rounded-3xl p-4 border-4 border-zinc-800 shadow-2xl">
                      <div className="flex justify-between text-[9px] text-[#475569] font-bold tracking-tight mb-3 px-2">
                        <span>9:41 AM</span>
                        <span className="text-emerald-500 font-mono">● CommuniSync Core</span>
                      </div>
                      <div className="bg-[#1c1c1e] rounded-xl p-3 flex gap-3 items-start border border-[#2a3a5c]/40">
                        <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-[#f97316] rounded-lg flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                          {previewTrigger.startsWith('custom_') ? '✨' : DEFAULT_TRIGGERS[previewTrigger as keyof typeof DEFAULT_TRIGGERS]?.emoji}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-[9px] text-[#475569] font-bold uppercase tracking-wider block">COMMUNISYNC SPORTS</span>
                          <h4 className="text-xs font-bold text-white mt-0.5 leading-snug truncate">
                            {previewTrigger.startsWith('custom_') 
                              ? (customTriggers.find(t => t.id === previewTrigger)?.title || 'Custom Title') 
                              : triggerStates[previewTrigger]?.title}
                          </h4>
                          <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed break-words">
                            {getCompiledPreviewBody()}
                          </p>
                          <span className="text-[9px] text-zinc-600 block mt-2 font-medium">Just now</span>
                        </div>
                      </div>
                    </div>

                    {/* ACTIVE ROUTING DELIVERY TIMELINE VERTICAL STREAM */}
                    <div>
                      <h3 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3 text-left">Live Processing Timeline Queue</h3>
                      <div className="space-y-3.5 pl-1 border-l border-[#2a3a5c] ml-1.5 text-left">
                        {[...allTriggersToRender].sort((a,b) => a.offset - b.offset).map(t => {
                          const isActive = t.enabled;
                          return (
                            <div key={t.id} className="flex gap-3 items-start relative">
                              <span className={`w-2.5 h-2.5 rounded-full absolute -left-[19.5px] top-1 border border-[#0c1220] z-10 ${
                                isActive 
                                  ? (t.isCustom ? 'bg-violet-500 shadow-[0_0_8px_#8b5cf6]' : 'bg-[#f97316] shadow-[0_0_8px_#f97316]') 
                                  : 'bg-[#475569]'
                              }`} />
                              <div className="flex-1 min-w-0 leading-none">
                                <span className={`text-xs font-bold block ${isActive ? 'text-[#f1f5f9]' : 'text-[#475569]'}`}>{t.label}</span>
                                <span className="text-[9px] text-[#64748b] font-mono mt-1 block">
                                  {formatINRDate(getTournamentStartDateTime(), t.offset).split('·')[0]}
                                </span>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141c2e] text-[#475569]'}`}>
                                {isActive ? 'Active' : 'Muted'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CHANNELS ACTIVE ON PREVIEW CARD MATRICES */}
                    <div className="pt-3 border-t border-[#2a3a5c]/50 text-left">
                      <h3 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Active Channels For Selection</h3>
                      <div className="flex gap-1.5 flex-wrap">
                        {currentActiveChannels.map((chId: string) => {
                          const data = CHANNEL_META.find(c => c.id === chId);
                          return (
                            <span key={chId} className="bg-[#f97316]/10 text-[#f97316] text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#f97316]/20 shadow-inner flex items-center gap-1">
                              <span>{data?.emoji}</span> {data?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* ESTIMATED RECIPIENTS SECTION */}
                    <div className="pt-3 border-t border-[#2a3a5c]/50 flex justify-between items-center text-left">
                      <div>
                        <h3 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Estimated Audience</h3>
                        <div className="text-2xl font-bold text-[#f97316] mt-1">{previewCount}</div>
                        <span className="text-[9px] text-[#64748b] font-semibold">Across Selected Recipient Matrix Groups</span>
                      </div>
                      <div className="w-12 h-12 rounded-full border-4 border-[#2a3a5c]/50 flex items-center justify-center relative bg-[#0c1220]">
                        <span className="text-xs font-bold text-teal-400">{previewPercentage}%</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a3a5c] bg-[#0c1220]/40 flex-shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  // Reset trigger settings
                  setGlobalChannels(["push", "email"]);
                  setPreviewTrigger("2h");
                  setExpandedTrigger(null);
                  setCustomTriggers([]);
                  setTriggerStates({
                    "7d": {
                      enabled: true,
                      title: "🏏 Tournament Registration Open!",
                      body: "Registration is now open for {{tournament_name}}! 🏆 Starting {{start_date}} at {{venue}}. Register before spots fill up. Tap to register now.",
                      recipients: ["All Members", "Community Feed"],
                      overrideChannels: ["push", "email", "whatsapp"]
                    },
                    "1d": {
                      enabled: true,
                      title: "🏆 Tournament Tomorrow!",
                      body: "{{tournament_name}} begins TOMORROW at {{start_time}}! 📍 {{venue}}. Your match schedule is ready. Check your fixtures and prepare. See you on the ground! 🏅",
                      recipients: ["Registered Players", "Team Owners", "Admins Only"],
                      overrideChannels: []
                    },
                    "2h": {
                      enabled: true,
                      title: "⚡ 2 Hours to Kick-Off!",
                      body: "⚡ {{tournament_name}} starts in 2 hours! Report at {{venue}} by {{report_time}}. Bring your kit & ID. Your first match is ready! Let's go! 🏏",
                      recipients: ["Registered Players", "Team Owners", "Referees"],
                      overrideChannels: []
                    },
                    "30m": {
                      enabled: true,
                      title: "🔴 30 Mins to Start — Head to Ground!",
                      body: "🔴 FINAL CALL — {{tournament_name}} begins in 30 minutes! Head to {{venue}} NOW. Gate A open. Toss in 15 mins. Don't be late — matches won't be delayed! ⏱️",
                      recipients: ["Registered Players", "Referees"],
                      overrideChannels: ["push", "sms", "whatsapp", "inapp"]
                    },
                    "now": {
                      enabled: true,
                      title: "🏁 Tournament is LIVE Now!",
                      body: "🏁 {{tournament_name}} has officially started! Follow live scores, results, and standings right here in the app. Play hard! 🏆",
                      recipients: ["All Members", "Spectators", "Community Feed"],
                      overrideChannels: []
                    }
                  });
                  toast.success("Notification configurations reset to system defaults!");
                }}
                className="px-4 py-2 bg-transparent hover:bg-red-500/10 border border-red-500/30 hover:border-red-500 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>↺</span> Reset
              </button>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2 bg-transparent border border-[#2a3a5c] hover:border-[#475569] text-[#94a3b8] hover:text-[#f1f5f9] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationModal(false);
                    toast.success("Notification configurations applied successfully!");
                  }}
                  className="px-5 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none flex items-center gap-1.5"
                >
                  <span>💾</span> Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Add Player Modal ── */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#2a3a5c] pb-3">
              <h3 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#f97316]" /> Add Participant
              </h3>
              <button
                onClick={() => setShowAddPlayerModal(false)}
                className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer bg-transparent border-none outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPlayerSubmit} className="space-y-6">
              <div className="p-4 flex flex-col lg:flex-row gap-4 bg-[#0c1220] border border-[#2a3a5c] shadow rounded-lg text-slate-800 dark:text-[#f1f5f9]">
                
                {/* Left Side Column ("Your Friends") */}
                <div className="flex flex-col w-full lg:w-1/3">
                  <div className="p-4 border border-[#2a3a5c] bg-[#141c2e] shadow rounded-lg flex flex-col space-y-3">
                    <div className="flex flex-row gap-2 items-center">
                      <div className="flex flex-col text-left gap-1">
                        <p className="font-semibold text-sm text-[#f1f5f9]">Your Friends</p>
                      </div>
                    </div>
                    <p className="text-[#94a3b8] text-xs text-left">Select to add players to this tournament event</p>

                    {/* Search input for friends */}
                    <div className="mt-1">
                      <input
                        type="text"
                        placeholder="Search friends..."
                        value={friendSearchQuery}
                        onChange={(e) => setFriendSearchQuery(e.target.value)}
                        className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                      />
                    </div>

                    {/* Scrollable friends roster list */}
                    <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-[#f97316]" />
                        </div>
                      ) : filteredFriends.length === 0 ? (
                        <p className="text-xs text-[#64748b] italic text-center py-6">No friends found</p>
                      ) : (
                        filteredFriends.map(friend => (
                          <div key={friend.id} className="flex w-full items-center gap-3 p-2 border rounded-lg border-[#2a3a5c] bg-[#0c1220]/50 hover:bg-[#1a2540] transition-colors">
                            <div className="h-12 min-w-12 rounded-full overflow-hidden border border-[#2a3a5c] flex-shrink-0">
                              <img
                                src={friend.avatarUrl || "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media"}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            </div>
                            <div className="flex flex-col gap-1 w-full text-left min-w-0">
                              <p className="font-medium text-xs text-[#f1f5f9] truncate">{friend.fullName}</p>
                              <p className="text-[10px] text-[#94a3b8] truncate">
                                {friend.gender || "Gender unspecified"}
                                {friend.dateOfBirth && ` | ${formatDob(friend.dateOfBirth)}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectFriend(friend)}
                              className="text-xs font-semibold text-[#f97316] hover:text-[#ea580c] transition-colors cursor-pointer bg-transparent border-none px-2 py-1 flex-shrink-0"
                            >
                              Select
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add New Player button in left side pane */}
                    <div className="text-center mt-3 pt-2 border-t border-[#2a3a5c]/50">
                      <button
                        type="button"
                        onClick={handleAddNewPlayerCard}
                        className="w-full flex items-center justify-center font-semibold gap-1 py-2 text-xs border border-[#2a3a5c] hover:border-[#f97316] hover:text-[#f97316] text-[#94a3b8] rounded-lg transition-colors cursor-pointer bg-transparent"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <p>Add New Player</p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side Column ("Participant Details") */}
                <div className="flex-1 flex flex-col gap-3 rounded-lg w-full lg:w-2/3">
                  <h3 className="font-semibold text-sm text-[#f1f5f9] text-left">Participant Details</h3>
                  
                  {/* Dynamic checklist array mapping */}
                  <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
                    {addPlayerForms.map((form, idx) => (
                      <div
                        key={form.id}
                        className="p-4 rounded-lg flex flex-col gap-4 border border-dashed relative bg-[#141c2e]/60 transition-all text-left"
                        style={{ borderColor: "rgb(0, 186, 93)" }}
                      >
                        {/* Card index and Delete handler */}
                        <div className="flex justify-between items-center">
                          <span className="w-5 h-5 rounded-full bg-[#10b981]/20 text-[#10b981] text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePlayerCard(form.id)}
                            className="flex gap-1 items-center text-xs font-semibold text-[#ef4444] hover:text-red-400 bg-transparent border-none cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 items-center">
                          {/* Profile Picture Slot */}
                          <div className="flex flex-col items-center w-40 flex-shrink-0">
                            <label className="mb-2 text-center text-xs text-[#94a3b8]">Profile Picture</label>
                            <div className="relative overflow-hidden rounded-full w-16 h-16 border-4 border-[#2a3a5c]">
                              <img
                                src={form.avatarUrl || "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media"}
                                className="w-full h-full object-cover"
                                alt="Profile"
                              />
                              <div className="absolute bottom-0 text-center w-full bg-black/50 py-0.5">
                                <label className="cursor-pointer text-[10px] font-bold text-white hover:text-[#f97316] flex items-center justify-center">
                                  <Plus className="w-3 h-3 mx-auto" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const url = URL.createObjectURL(file);
                                        setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, avatarUrl: url } : p));
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Inputs Fields Grid */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {/* Player Name */}
                            <div className="flex flex-col w-full gap-1 text-left">
                              <label className="text-xs text-[#94a3b8]">
                                Player Name <span className="text-[#ef4444] font-semibold">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={form.playerName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, playerName: val } : p));
                                }}
                                placeholder="Player Name"
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>

                            {/* Player Email */}
                            <div className="flex flex-col w-full gap-1 text-left">
                              <label className="text-xs text-[#94a3b8]">
                                Player Email <span className="text-[#ef4444] font-semibold">*</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={form.playerEmail}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, playerEmail: val } : p));
                                }}
                                placeholder="Player Email"
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>

                            {/* Player Category */}
                            <div className="flex flex-col w-full gap-1 text-left">
                              <label className="text-xs text-[#94a3b8]">
                                Category <span className="text-[#ef4444] font-semibold">*</span>
                              </label>
                              <select
                                required
                                value={form.categoryId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, categoryId: val } : p));
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                              >
                                <option value="">Select Category...</option>
                                {playerCategories.map(c => (
                                  <option key={c.id} value={c.id}>{c.name} ({c.categoryType})</option>
                                ))}
                              </select>
                            </div>

                            {/* Match Type */}
                            <div className="flex flex-col w-full gap-1 text-left">
                              <label className="text-xs text-[#94a3b8]">Match Type</label>
                              <select
                                value={form.matchType}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, matchType: val } : p));
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                              >
                                <option value="SINGLES">Singles</option>
                                <option value="DOUBLES">Doubles</option>
                                <option value="MIXED">Mixed</option>
                              </select>
                            </div>

                            {/* Age */}
                            <div className="flex flex-col w-full gap-1 text-left">
                              <label className="text-xs text-[#94a3b8]">Age</label>
                              <input
                                type="number"
                                value={form.age}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 25;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, age: val } : p));
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>

                            {/* Flat Number */}
                            <div className="flex flex-col w-full gap-1 text-left">
                              <label className="text-xs text-[#94a3b8]">Flat Number</label>
                              <input
                                type="text"
                                value={form.flatNumber}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, flatNumber: val } : p));
                                }}
                                placeholder="e.g. A-102"
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>

                            {/* Relation */}
                            <div className="flex flex-col w-full gap-1 text-left">
                              <label className="text-xs text-[#94a3b8]">Relation</label>
                              <select
                                value={form.relation}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, relation: val } : p));
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                              >
                                <option value="SELF">Self</option>
                                <option value="SPOUSE">Spouse</option>
                                <option value="CHILD">Child</option>
                                <option value="PARENT">Parent</option>
                                <option value="SIBLING">Sibling</option>
                                <option value="OTHER">Other</option>
                              </select>
                            </div>

                            {/* Primary Role */}
                            <div className="flex flex-col w-full gap-1 text-left">
                              <label className="text-xs text-[#94a3b8]">Primary Role</label>
                              <input
                                type="text"
                                value={form.role}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, role: val } : p));
                                }}
                                placeholder="e.g. Batsman, Keeper"
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Optional Statistics */}
                        <div className="border-t border-[#2a3a5c]/40 pt-3">
                          <label className="text-[10px] font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2 block">Player Statistics (Optional)</label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <div>
                              <label className="text-[9px] text-[#94a3b8] block mb-1">Matches</label>
                              <input
                                type="number"
                                value={form.matches}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, matches: val } : p));
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-[#94a3b8] block mb-1">Runs/Points</label>
                              <input
                                type="number"
                                value={form.runs}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, runs: val } : p));
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-[#94a3b8] block mb-1">Wickets/Assists</label>
                              <input
                                type="number"
                                value={form.wickets}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, wickets: val } : p));
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-[#94a3b8] block mb-1">Strike Rate</label>
                              <input
                                type="number"
                                step="0.1"
                                value={form.strikeRate}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, strikeRate: val } : p));
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-[#94a3b8] block mb-1">Avg Score</label>
                              <input
                                type="number"
                                step="0.1"
                                value={form.avgScore}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, avgScore: val } : p));
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Player card button at the bottom of Right Pane */}
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={handleAddNewPlayerCard}
                      className="w-full flex items-center justify-center font-semibold gap-1 py-3 text-sm border border-dashed border-[#10b981] hover:border-[#10b981]/80 text-[#10b981] bg-[#10b981]/5 hover:bg-[#10b981]/10 rounded-lg transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Player</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#2a3a5c]">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="flex-1 py-2.5 bg-transparent border border-[#2a3a5c] text-[#94a3b8] text-sm font-medium rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-2.5 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-70 text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Adding...</> : "Add Participants ↗"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CSV Import Participants Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#2a3a5c] pb-3">
              <h3 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#10b981]" /> Import Participants
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!importing) {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setParsedRows([]);
                  }
                }}
                className="p-1.5 hover:bg-[#1e293b] rounded text-[#64748b] hover:text-[#cbd5e1] transition-colors border-none bg-transparent cursor-pointer"
                disabled={importing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#0c1220] border border-[#2a3a5c] rounded-lg p-3">
                <div className="text-xs text-[#94a3b8]">
                  Download the official formatting template:
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-2.5 py-1.5 bg-[#f97316]/10 hover:bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Download Template
                </button>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#2a3a5c] hover:border-[#10b981] rounded-xl p-6 bg-[#0c1220]/50 transition-colors relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <ClipboardList className="w-8 h-8 text-[#94a3b8] mb-2" />
                <span className="text-xs font-medium text-[#f1f5f9]">
                  {csvFile ? csvFile.name : "Choose CSV File or Drag & Drop"}
                </span>
                <span className="text-[10px] text-[#64748b] mt-1">
                  Supports .csv extension up to 5MB
                </span>
              </div>

              {parsingError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">
                  {parsingError}
                </div>
              )}

              {parsedRows.length > 0 && !parsingError && (
                <div className="text-xs text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg p-3 flex items-center justify-between">
                  <span>Roster verified successfully:</span>
                  <span className="font-bold">{parsedRows.length} player(s) found</span>
                </div>
              )}

              {importing && importProgress !== null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                    <span>Registering players sequentially...</span>
                    <span className="font-bold text-[#f97316]">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-[#0c1220] rounded-full h-2 border border-[#2a3a5c]">
                    <div
                      className="bg-gradient-to-r from-[#f97316] to-[#10b981] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setParsedRows([]);
                  }}
                  className="flex-1 py-2.5 bg-transparent border border-[#2a3a5c] text-[#94a3b8] text-sm font-medium rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={importing || parsedRows.length === 0}
                  className="flex-[2] py-2.5 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 disabled:hover:bg-[#10b981] text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importing...</> : "Start Import ↗"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sport Event Configuration Popup Modal ── */}
      <SportEventConfigModal
        isOpen={showSportConfigModal}
        onClose={() => {
          setShowSportConfigModal(false);
          setConfiguringSportId(null);
        }}
        configuringSportId={configuringSportId}
        selectedSportsWithEvents={selectedSportsWithEvents}
        addEventToSport={addEventToSport}
        removeEvent={removeEvent}
        updateEventField={updateEventField}
        playerCategories={playerCategories}
      />

      {/* ── Selected Venue Details Popup Modal ── */}
      <VenueDetailsModal
        isOpen={showVenueDetailsModal}
        onClose={() => setShowVenueDetailsModal(false)}
        selectedVenueDetails={selectedVenueDetails}
        loadingVenueDetails={loadingVenueDetails}
        onEditVenue={selectedVenueDetails ? () => {
          setVenueCommId(selectedVenueDetails.communityId || "");
          setVenueType(selectedVenueDetails.venueType || "");
          setActiveTab("create-venue");
          setShowVenueForm(true);
          setEditingVenueId(selectedVenueDetails.id);
        } : undefined}
      />

      {/* ── Open for Registration Notification Modal ── */}
      {activatingTournament && (
        <RegistrationOpenModal
          tournament={activatingTournament}
          onConfirm={handleConfirmActivate}
          onClose={() => setActivatingTournament(null)}
        />
      )}
    </div>
  );
}

