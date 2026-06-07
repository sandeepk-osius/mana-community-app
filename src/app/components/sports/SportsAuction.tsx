import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { auctionService } from "../../../services/auctionService";
import { sportsService } from "../../../services/sportsService";
import { userService } from "../../../services/userService";
import { useAuth } from "../../../contexts/AuthContext";
import {
  VIEW_SPORTS_MENU, CREATE_EDIT_SPORTS_MENU,
  VIEW_AUCTION_CONFIG, CREATE_EDIT_AUCTION_CONFIG,
  VIEW_LIVE_AUCTION, CREATE_EDIT_LIVE_AUCTION,
  VIEW_TEAMS_DASHBOARD, CREATE_EDIT_TEAMS_DASHBOARD,
  VIEW_PLAYER_POOL, CREATE_EDIT_PLAYER_POOL,
  VIEW_EVENT_REGISTRATIONS, CREATE_EDIT_EVENT_REGISTRATIONS,
  VIEW_AUCTION_RESULTS, CREATE_EDIT_AUCTION_RESULTS,
  CREATE_EDIT_SPORTS_MAIN,
} from "../../../constants/permissions";
import type { AuctionPlayer, AuctionTeam, PlayerWithBidResponse, AuctionStatsResponse, EventRegistration } from "../../../types/api";
import "./SportsAuction.css";

// ─── Fallback Data ─────────────────────────────────────────────
const FALLBACK_COLORS = ["#f97316", "#16a085", "#2e86de", "#e67e22", "#e03e3e", "#27ae60", "#d4a017", "#8a9ab0"];
const FALLBACK_EMOJIS = ["🔥", "👑", "🦅", "⚔️", "🛡️", "🔥", "👑", "⚡"];

const mapTeamData = (summary: any, idx: number): AuctionTeam => {
  const budgetVal = summary.totalBudget ?? summary.budget ?? 0;
  const spentVal = summary.spent ?? 0;
  const nameVal = summary.teamName || summary.name || `Team ${idx + 1}`;
  return {
    ...summary,
    id: summary.id,
    name: nameVal,
    teamName: nameVal,
    ownerName: summary.ownerName || summary.ownerUser?.fullName || summary.ownerUser?.name || 'Not Assigned',
    color: summary.colorHex || summary.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    colorHex: summary.colorHex || summary.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    emoji: summary.emoji || FALLBACK_EMOJIS[idx % FALLBACK_EMOJIS.length],
    budget: budgetVal,
    totalBudget: budgetVal,
    remainingBudget: summary.remainingBudget ?? (budgetVal - spentVal),
    spent: spentVal,
    players: summary.players || [],
  };
};

export function SportsAuction() {
  const { user, hasPermission, hasAnyPermission } = useAuth();

  // Granular permission flags — each maps to a specific sidebar section / tab
  const canViewSportsMenu    = hasAnyPermission(VIEW_SPORTS_MENU,          CREATE_EDIT_SPORTS_MENU);
  const canViewAuctionConfig = hasAnyPermission(VIEW_AUCTION_CONFIG,       CREATE_EDIT_AUCTION_CONFIG);
  const canEditAuctionConfig = hasPermission(CREATE_EDIT_AUCTION_CONFIG);
  const canViewLiveAuction   = hasAnyPermission(VIEW_LIVE_AUCTION,         CREATE_EDIT_LIVE_AUCTION);
  const canEditLiveAuction   = hasPermission(CREATE_EDIT_LIVE_AUCTION);
  const canViewTeams         = hasAnyPermission(VIEW_TEAMS_DASHBOARD,       CREATE_EDIT_TEAMS_DASHBOARD);
  const canEditTeams         = hasPermission(CREATE_EDIT_TEAMS_DASHBOARD);
  const canViewPlayerPool    = hasAnyPermission(VIEW_PLAYER_POOL,           CREATE_EDIT_PLAYER_POOL);
  const canEditPlayerPool    = hasPermission(CREATE_EDIT_PLAYER_POOL);
  const canViewRegistrations = hasAnyPermission(VIEW_EVENT_REGISTRATIONS,  CREATE_EDIT_EVENT_REGISTRATIONS);
  const canViewResults       = hasAnyPermission(VIEW_AUCTION_RESULTS,       CREATE_EDIT_AUCTION_RESULTS);
  const isAdmin              = hasPermission(CREATE_EDIT_SPORTS_MAIN);

  // Kept for backward compat with any code that still references isAuctionAdmin
  const isAuctionAdmin = canEditAuctionConfig || canEditLiveAuction;
  const { eventId } = useParams();

  // Navigation State
  type TabType = 'overview' | 'config' | 'live' | 'teams' | 'players' | 'registrations' | 'results' | 'badminton' | 'football' | 'volleyball' | string;
  const [activeTab, setActiveTab] = useState<TabType>(eventId ? "live" : "overview");

  // Config State
  const [sport, setSport] = useState("cricket");
  const [committee, setCommittee] = useState<Array<{ id: number, name: string }>>([]);
  const [newMember, setNewMember] = useState("");
  const [categories, setCategories] = useState(["Batsmen", "Bowlers", "All-rounders"]);
  const [basePrice, setBasePrice] = useState(1000);
  const [bidIncrementDefault, setBidIncrementDefault] = useState(1000);
  const [bidIncrementThreshold, setBidIncrementThreshold] = useState(10000);
  const [bidIncrementAbove, setBidIncrementAbove] = useState(5000);
  const [totalTeamsConfig, setTotalTeamsConfig] = useState(8);
  const [totalPlayersConfig, setTotalPlayersConfig] = useState(43);
  const [budgetPerTeamConfig, setBudgetPerTeamConfig] = useState(100000);
  const [unsoldRule, setUnsoldRule] = useState("ROTATION_AUCTION");
  const [auctionStatus, setAuctionStatus] = useState("DRAFT");

  // Event Selection State
  const [availableConfigs, setAvailableConfigs] = useState<any[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(eventId ? Number(eventId) : null);

  // Live Auction State
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [teams, setTeams] = useState<AuctionTeam[]>([]);
  const [, setLoading] = useState(true);

  // Live Auction — dynamic state
  const [livePlayer, setLivePlayer] = useState<PlayerWithBidResponse | null>(null);
  const [liveBidHistory, setLiveBidHistory] = useState<Array<{ team: string; amount: number; time: string }>>([]);
  const [biddingTeamId, setBiddingTeamId] = useState<number | null>(null);
  const [configExistsForCommunity, setConfigExistsForCommunity] = useState<boolean | null>(null);
  const [auctionStats, setAuctionStats] = useState<AuctionStatsResponse | null>(null);
  const [registrationCount, setRegistrationCount] = useState<number>(0);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [eventMap, setEventMap] = useState<Array<{ id: number, name: string }>>([]);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [newTeamBudget, setNewTeamBudget] = useState(100000);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Fetch available configs on mount — scoped to user's community
  useEffect(() => {
    // Check if any auction config exists for this community (no sportId filter)
    auctionService.checkConfigExists().then(result => {
      setConfigExistsForCommunity(result.configExists);
    }).catch(() => setConfigExistsForCommunity(false));

    // Fetch all community configs
    auctionService.getAllCommunityConfigs().then(configs => {
      setAvailableConfigs(configs);
      if (configs.length > 0 && !selectedConfigId) {
        const completed = configs.filter(c => c.status === 'COMPLETED');
        if (completed.length > 0) {
          setSelectedConfigId(completed[0].id);
        } else {
          setSelectedConfigId(configs[0].id);
        }
      }
    }).catch(err => console.error("Failed to fetch configs", err));
  }, []);

  // Fetch from backend when selectedConfigId changes
  useEffect(() => {
    if (!selectedConfigId) return;
    const configIdToFetch = selectedConfigId;

    Promise.all([
      auctionService.getConfig(configIdToFetch).catch(() => null),
      auctionService.getPlayers(configIdToFetch).catch(() => []),
      auctionService.getTeamsSummary(configIdToFetch).catch(() => []),
      auctionService.getAuctionStats(configIdToFetch).catch(() => null),
      auctionService.getRegistrationCount(configIdToFetch).catch(() => 0),
    ]).then(([config, p, t, stats, regCount]) => {
      if (config) {
        setAuctionStatus(config.status);
        setSport(config.sportName.toLowerCase());
        setSelectedEventId(config.eventId || null);
        setBasePrice(config.basePrice);
        setBidIncrementDefault(config.bidIncrementDefault);
        setBidIncrementThreshold(config.bidIncrementThreshold);
        setBidIncrementAbove(config.bidIncrementAbove);
        setTotalTeamsConfig(config.totalTeams);
        setTotalPlayersConfig(config.totalPlayers);
        setBudgetPerTeamConfig(config.budgetPerTeam);
        setUnsoldRule(config.unsoldRule);
        if (config.categories?.length) setCategories(config.categories);
        if (config.committeeMembers?.length) {
          setCommittee((config.committeeMembers as string[]).map((name, idx) => ({ id: idx + 1, name })));
        }

        if (config.status === "LIVE" || config.status === "ACTIVE") {
          auctionService.getCurrentPlayer(configIdToFetch)
            .then(player => {
              setLivePlayer(player);
              setLiveBidHistory([{ team: "Current Bid", amount: player.currentBid, time: new Date().toLocaleTimeString() }]);
            })
            .catch(() => setLivePlayer(null));
        }
      }

      if (regCount !== undefined) setRegistrationCount(regCount);
      if (stats) setAuctionStats(stats);
      if (p && p.length) setPlayers(p);
      if (t && t.length) {
        const mappedTeams = t.map((summary, idx) => {
          const teamObj = mapTeamData(summary, idx);
          const teamPlayers = (p || []).filter(player => player.assignedTeam?.id === summary.id || (player as any).assignedTeamId === summary.id || (player.assignedTeam as any) === summary.id).map(pl => ({
            name: pl.name || (pl as any).playerName || 'Player',
            soldPrice: pl.soldPrice || pl.basePrice || 0,
            category: pl.category || pl.role || 'Player'
          }));
          return {
            ...teamObj,
            players: teamPlayers.length > 0 ? teamPlayers : teamObj.players
          };
        });
        setTeams(mappedTeams);
      }
    }).catch((err) => {
      console.error("Failed to load auction data:", err);
    }).finally(() => setLoading(false));
  }, [selectedConfigId]);

  // Fetch community events for the overview and map for dropdowns
  useEffect(() => {
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const communityId = user?.communityId || undefined;

    if (isSuperAdmin) {
      sportsService.getAllEvents().then(events => setCommunityEvents(events)).catch(err => console.error("Failed to fetch all events", err));
      sportsService.getEventMap().then(map => setEventMap(map)).catch(err => console.error("Failed to fetch event map", err));
    } else if (communityId) {
      sportsService.getCommunityEvents(communityId).then(events => setCommunityEvents(events)).catch(err => console.error("Failed to fetch community events", err));
      sportsService.getEventMap(communityId).then(map => setEventMap(map)).catch(err => console.error("Failed to fetch event map", err));
    }
  }, [user?.communityId, user?.role]);

  // Fetch confirmed player count and committee when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      sportsService.getConfirmedCount(selectedEventId)
        .then(count => setRegistrationCount(count))
        .catch(err => console.error("Failed to fetch registration count", err));

      Promise.all([
        sportsService.getEventRegistrations(selectedEventId),
        sportsService.getEventById(selectedEventId)
      ]).then(([regs, event]) => {
        const confirmed = regs.filter(r => r.status === 'CONFIRMED').map(r => ({
          id: r.user?.id || r.id,
          name: r.playerName || r.user?.fullName || 'Unknown',
          role: r.role || r.category?.name || 'Player'
        }));
        setEventRegistrations(confirmed);

        // Hydrate committee
        if (event.disputeCommitteeIds) {
          const ids = event.disputeCommitteeIds.split(',').map(Number);
          const members = confirmed.filter(r => ids.includes(Number(r.id)));
          setCommittee(members);
        } else {
          setCommittee([]);
        }

        // Fetch all community users for this event's community
        if (event.community?.id) {
          userService.getCommunityUsers(event.community.id)
            .then(users => setCommunityUsers(users.map(u => ({ id: u.id, name: u.fullName || 'Unnamed User' }))))
            .catch(() => setCommunityUsers([]));
        }
      }).catch(err => console.error("Failed to fetch event data", err));
    } else {
      setRegistrationCount(0);
      setEventRegistrations([]);
      setCommunityUsers([]);
      setCommittee([]);
    }
  }, [selectedEventId]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const nav = (tab: string) => setActiveTab(tab);
  const configId = selectedConfigId || user?.communityId || 1;


  const toggleCat = (cat: string) => {
    if (categories.includes(cat)) setCategories(categories.filter(c => c !== cat));
    else setCategories([...categories, cat]);
  };

  const handleSaveConfig = async () => {
    const payload = {
      sportId: sport === 'cricket' ? 1 : sport === 'badminton' ? 2 : 3,
      eventId: selectedEventId || undefined,
      seasonName: 'Season 2026',
      auctionFormat: 'OPEN_AUCTION',
      totalTeams: totalTeamsConfig,
      totalPlayers: totalPlayersConfig,
      budgetPerTeam: budgetPerTeamConfig,
      basePrice,
      bidIncrementDefault,
      bidIncrementThreshold,
      bidIncrementAbove,
      bidTimerSeconds: 30,
      rtmEnabled: true,
      unsoldRule,
      categories,
      committeeMembers: committee.map(c => c.name),
    };

    try {
      if (selectedConfigId) {
        await auctionService.updateConfig(selectedConfigId, payload);
      } else {
        const created = await auctionService.createConfig(payload);
        setSelectedConfigId(created.id);
      }

      // Save committee to sports event table
      if (selectedEventId) {
        await sportsService.updateCommittee(selectedEventId, committee.map(c => Number(c.id)));
      }

      toast.success('Auction configuration saved!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save config');
    }
  };

  const handleCreateTeam = async () => {
    if (!selectedConfigId) {
      toast.error("Please select an auction configuration first.");
      return;
    }
    if (!newTeamName.trim() || !selectedOwnerId) {
      toast.error("Please provide team name and select a captain.");
      return;
    }

    const owner = communityUsers.find(u => u.id === selectedOwnerId);
    
    setIsCreatingTeam(true);
    try {
      await auctionService.createTeam({
        configId: selectedConfigId,
        teamName: newTeamName,
        ownerName: owner?.name || "Unknown",
        ownerUserId: selectedOwnerId,
        totalBudget: newTeamBudget,
        colorHex: '#D4A017' // Default gold
      });
      toast.success("Team created successfully!");
      setShowAddTeam(false);
      setNewTeamName("");
      setSelectedOwnerId(null);
      // Refresh teams list
      const updatedTeams = await auctionService.getTeamsSummary(selectedConfigId);
      setTeams(updatedTeams.map((summary, idx) => mapTeamData(summary, idx)));
    } catch (err: any) {
      toast.error(err?.message || "Failed to create team");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedConfigId) return;

    if (newStatus === 'LIVE' || newStatus === 'ACTIVE') {
      if (teams.length < 2) {
        toast.error("Cannot start auction: At least 2 teams must be configured.");
        return;
      }
      if (players.length === 0) {
        toast.error("Cannot start auction: Player pool is empty.");
        return;
      }
    }

    try {
      await auctionService.updateStatus(selectedConfigId, newStatus);
      setAuctionStatus(newStatus);
      if (newStatus === 'LIVE') {
        fetchNextPlayer();
      }
      toast.success(`Auction is now ${newStatus}`);
    } catch (err: any) {
      let msg = err?.message || `Failed to change status to ${newStatus}`;
      if (msg.startsWith("{")) {
        try { msg = JSON.parse(msg).message || msg; } catch { }
      }
      toast.error(msg);
    }
  };

  // ── Live Auction Handlers ──────────────────────────────────────────
  const fetchNextPlayer = useCallback(async () => {
    try {
      const player = await auctionService.getRandomPlayer(configId);
      setLivePlayer(player);
      setLiveBidHistory([
        { team: "Base Price", amount: player.basePrice, time: new Date().toLocaleTimeString() }
      ]);
      setBiddingTeamId(null);
      toast.success(`🏏 ${player.playerName} is up for auction!`);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("No more players") || msg.includes("empty")) {
        toast.info("🏁 All players have been auctioned!");
        setLivePlayer(null);
      } else {
        toast.error("Failed to pick next player");
      }
    }
  }, [configId]);

  const handleTeamBid = async (team: AuctionTeam) => {
    if (!livePlayer) return;
    const bidAmount = livePlayer.nextBid;
    const remaining = team.budget - team.spent;
    if (remaining < bidAmount) {
      toast.error(`${team.name} doesn't have enough budget (₹${remaining.toLocaleString('en-IN')} < ₹${bidAmount.toLocaleString('en-IN')})`);
      return;
    }
    try {
      await auctionService.placeBid({
        configId,
        playerId: livePlayer.playerId,
        teamId: team.id,
        bidAmount
      });
      setBiddingTeamId(team.id);
      setLiveBidHistory(prev => [
        { team: team.teamName, amount: bidAmount, time: new Date().toLocaleTimeString() },
        ...prev
      ]);
      // Refresh live player data from backend to get the updated nextBid
      const updated = await auctionService.getCurrentPlayer(configId);
      setLivePlayer(updated);
      toast.success(`${team.name} bids ₹${bidAmount.toLocaleString('en-IN')}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Bid failed');
    }
  };

  const handleSoldPlayer = async () => {
    if (!livePlayer || !biddingTeamId) {
      toast.error("No bid has been placed yet!");
      return;
    }
    const soldTeam = teams.find(t => t.id === biddingTeamId);
    try {
      await auctionService.soldPlayer(livePlayer.playerId, biddingTeamId);
      toast.success(`🎉 ${livePlayer.playerName} SOLD to ${soldTeam?.name} for ₹${livePlayer.currentBid.toLocaleString('en-IN')}!`);
      // Update team budget and squad locally
      setTeams(prev => prev.map(t =>
        t.id === biddingTeamId
          ? {
              ...t,
              spent: t.spent + livePlayer.currentBid,
              remainingBudget: t.budget - (t.spent + livePlayer.currentBid),
              players: [...(t.players || []), { name: livePlayer.playerName, soldPrice: livePlayer.currentBid, category: livePlayer.category || livePlayer.playerRole || 'Player' }]
            }
          : t
      ));
      // Refresh players list and live stats
      auctionService.getPlayers(configId).then(p => { if (p.length) setPlayers(p); }).catch(() => { });
      auctionService.getAuctionStats(configId).then(stats => setAuctionStats(stats)).catch(() => { });
      // Load next player
      await fetchNextPlayer();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark player as sold');
    }
  };

  const handlePassPlayer = async () => {
    if (!livePlayer) return;
    try {
      await auctionService.passPlayer(livePlayer.playerId);
      toast.info(`${livePlayer.playerName} passed — back to queue`);
      // Refresh live stats
      auctionService.getAuctionStats(configId).then(stats => setAuctionStats(stats)).catch(() => { });
      await fetchNextPlayer();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to pass player');
    }
  };

  // Creation States
  const [newPlayer, setNewPlayer] = useState({
    name: "", category: "BATSMEN", role: "Right-Hand Bat", age: 25,
    basePrice: 1000, matches: 0, runs: 0, wickets: 0, strikeRate: 0, economy: 0
  });

  const handleCreatePlayer = async () => {
    if (!newPlayer.name) { toast.error("Player name is required"); return; }
    try {
      const created = await auctionService.createPlayer(selectedConfigId || 1, {
        playerName: newPlayer.name, category: newPlayer.category, playerRole: newPlayer.role,
        age: newPlayer.age, basePrice: newPlayer.basePrice, matches: newPlayer.matches,
        runs: newPlayer.runs, wickets: newPlayer.wickets, strikeRate: newPlayer.strikeRate, economy: newPlayer.economy
      });
      toast.success('Player added to pool!');
      const newPObj: AuctionPlayer = {
        id: created.id, name: created.name || newPlayer.name,
        initials: (newPlayer.name.match(/\b\w/g) || []).join('').substring(0, 2).toUpperCase(),
        role: newPlayer.role, age: newPlayer.age, basePrice: newPlayer.basePrice, status: "QUEUED"
      };
      setPlayers([...players, newPObj]);
      setNewPlayer({ ...newPlayer, name: "", matches: 0, runs: 0, wickets: 0 });
    } catch (err) {
      toast.error('Failed to create player');
    }
  };

  // ─── Render Helpers ───────────────────────────────────────────────────
  const NavItem = ({ id, label, isLive }: { id: string, label: string, isLive?: boolean }) => (
    <button
      className={`nav-item ${activeTab === id ? 'active' : ''} ${isLive ? 'live-dot' : ''}`}
      onClick={() => nav(id)}
    >
      <div className="nav-dot"></div>{label}
    </button>
  );
  const queuedPlayersList = players.filter(p => p.status === 'QUEUED' || p.status === 'queue');
  const frontendQueuedCount = queuedPlayersList.filter(p => p.role?.toLowerCase() !== 'captain' && p.category?.toLowerCase() !== 'captain').length;
  const queuedCount = auctionStats?.queuedPlayers ?? frontendQueuedCount;

  return (
    <div className="auction-hub-wrapper">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-title">CommUnity</div>
          <div className="brand-sub">Sports Auction Hub</div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Main</div>
          <NavItem id="overview" label="Overview" />
        </div>
        {canViewSportsMenu && (
          <div className="nav-section">
            <div className="nav-label">Sports Menu</div>
            <NavItem id="cricket" label="Cricket" />
            <NavItem id="badminton" label="Badminton" />
            <NavItem id="football" label="Football" />
            <NavItem id="volleyball" label="Volleyball" />
          </div>
        )}
        <div className="nav-section">
          <div className="nav-label">Auction</div>
          {canViewAuctionConfig   && <NavItem id="config"        label="Auction Config" />}
          {canViewLiveAuction     && <NavItem id="live"          label="Live Auction" isLive />}
          {canViewTeams           && <NavItem id="teams"         label="Teams" />}
          {canViewPlayerPool      && <NavItem id="players"       label="Player Pool" />}
          {canViewRegistrations   && <NavItem id="registrations" label="Registrations" />}
          {canViewResults         && <NavItem id="results"       label="Auction Results" />}
        </div>
      </aside>

      <main className="main-content">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Sports Hub</div><div className="page-sub">Select a sport to configure its auction rules</div></div>
            </div>
            <div className="grid3" style={{ marginBottom: 16 }}>
              {communityEvents.length > 0 ? communityEvents.map(ev => {
                // Find if an auction config exists for this event
                const auctionConfig = availableConfigs.find(c => c.eventId === ev.id);
                const isLive = auctionConfig?.status === 'LIVE';
                const emoji = ev.sport?.name.toLowerCase().includes('cricket') ? '🏏' :
                  ev.sport?.name.toLowerCase().includes('badminton') ? '🏸' :
                    ev.sport?.name.toLowerCase().includes('football') ? '⚽' : '🏆';

                return (
                  <div
                    key={ev.id}
                    className={`card ${auctionConfig ? 'card-gold' : ''}`}
                    style={{ cursor: (auctionConfig || canEditAuctionConfig) ? 'pointer' : 'default', opacity: auctionConfig ? 1 : 0.8 }}
                    onClick={() => {
                      if (auctionConfig) {
                        setSelectedConfigId(auctionConfig.id);
                        nav('live');
                      } else if (canEditAuctionConfig) {
                        setSport(ev.sport?.name.toLowerCase() || 'cricket');
                        setSelectedEventId(ev.id);
                        nav('config');
                      }
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
                    <div className="page-title" style={{ fontSize: 18 }}>{ev.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      {ev.sport?.name} · {ev.status}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      {auctionConfig ? (
                        <span className={`tag ${isLive ? 'tag-live' : 'tag-green'}`}>
                          {isLive ? '● Live Now' : 'Auction Active'}
                        </span>
                      ) : (
                        <span className="tag tag-blue">Setup Pending</span>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No sports events found for your community.
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONFIG */}
        {activeTab === 'config' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Auction Configuration</div><div className="page-sub">Cricket · Season 2025 · Dynamically configurable rules</div></div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginRight: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Select Event:</span>
                  <select
                    className="fselect"
                    value={selectedEventId || ''}
                    onChange={e => {
                      const eid = e.target.value ? Number(e.target.value) : null;
                      setSelectedEventId(eid);
                      // If an auction exists for this event, select it
                      if (eid) {
                        const firstConfig = availableConfigs.find(c => c.eventId === eid);
                        if (firstConfig) setSelectedConfigId(firstConfig.id);
                        else setSelectedConfigId(null);
                      }
                    }}
                    style={{ width: 'auto', minWidth: 200, padding: '6px 12px' }}
                  >
                    <option value="">Select Sports Event...</option>
                    {eventMap.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                </div>
                {canEditAuctionConfig && <button className="btn btn-gold" onClick={handleSaveConfig}>Save & Apply ↗</button>}
              </div>
            </div>

            <div className="grid2">
              <div>
                <div className="card card-gold" style={{ marginBottom: 16 }}>
                  <div className="sec-title">Sport Selection</div>
                  <div className="form-row">
                    <div className="fgrp">
                      <div className="flabel">Sport</div>
                      <select className="fselect" value={sport} onChange={e => setSport(e.target.value)}>
                        <option value="cricket">Cricket</option>
                        <option value="badminton">Badminton</option>
                        <option value="football">Football</option>
                      </select>
                    </div>
                    <div className="fgrp">
                      <div className="flabel">Mapped Event</div>
                      <select
                        className="fselect"
                        value={selectedEventId || ""}
                        onChange={e => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Select Event...</option>
                        {eventMap.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="fgrp">
                      <div className="flabel">Auction Format</div>
                      <select className="fselect">
                        <option>Open Auction</option>
                        <option>Silent Auction</option>
                        <option>Draft Format</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="card card-gold" style={{ marginBottom: 16 }}>
                  <div className="sec-title">Auction Rules</div>
                  <div className="rule-box">
                    <div className="rule-title">Teams & Players</div>
                    <div className="form-row">
                      <div className="fgrp"><div className="flabel">Participating Teams</div><input className="finput" type="number" value={totalTeamsConfig} onChange={e => setTotalTeamsConfig(Number(e.target.value))} /></div>
                      <div className="fgrp"><div className="flabel">Players in Pool</div><input className="finput" type="number" value={totalPlayersConfig} onChange={e => setTotalPlayersConfig(Number(e.target.value))} /></div>
                    </div>
                    <div className="fgrp"><div className="flabel">Team Budget (₹)</div><input className="finput" type="number" value={budgetPerTeamConfig} onChange={e => setBudgetPerTeamConfig(Number(e.target.value))} /></div>
                  </div>
                  <div className="rule-box">
                    <div className="rule-title">Bidding Rules</div>
                    <div className="form-row">
                      <div className="fgrp"><div className="flabel">Base Price (₹)</div><input className="finput" type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} /></div>
                      <div className="fgrp"><div className="flabel">Default Increment (₹)</div><input className="finput" type="number" value={bidIncrementDefault} onChange={e => setBidIncrementDefault(Number(e.target.value))} /></div>
                    </div>
                    <div className="form-row">
                      <div className="fgrp">
                        <div className="flabel">Threshold Amount (₹)</div>
                        <input className="finput" type="number" value={bidIncrementThreshold} onChange={e => setBidIncrementThreshold(Number(e.target.value))} title="Bid amount at which the increment changes" />
                      </div>
                      <div className="fgrp">
                        <div className="flabel">Increment Above Threshold (₹)</div>
                        <input className="finput" type="number" value={bidIncrementAbove} onChange={e => setBidIncrementAbove(Number(e.target.value))} title="The new increment amount once the threshold is reached" />
                      </div>
                    </div>
                  </div>
                  <div className="rule-box">
                    <div className="rule-title">Player Categories</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['Batsmen', 'Bowlers', 'All-rounders', 'Wicket-Keepers'].map(cat => (
                        <button
                          key={cat}
                          className={`btn btn-outline btn-sm ${categories.includes(cat) ? 'active-chip' : ''}`}
                          onClick={canEditAuctionConfig ? () => toggleCat(cat) : undefined}
                          disabled={!canEditAuctionConfig}
                          style={categories.includes(cat) ? { color: 'var(--gold)', borderColor: 'rgba(212,160,23,0.5)', background: 'rgba(212,160,23,0.08)' } : {}}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="card card-gold" style={{ marginBottom: 16 }}>
                  <div className="sec-title">Dispute Committee</div>

                  <div className="form-group" style={{ position: 'relative' }}>
                    <div className="fselect-multi" style={{
                      display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px',
                      background: '#1a1d21', border: '1px solid #333', borderRadius: 8,
                      minHeight: 44, alignItems: 'center', cursor: 'text'
                    }} onClick={() => document.getElementById('committee-search')?.focus()}>

                      {committee.map((c, i) => (
                        <div key={i} className="committee-chip" style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)',
                          padding: '4px 10px', borderRadius: 6, fontSize: 12, color: 'var(--gold)'
                        }}>
                          <span className="committee-avatar" style={{ width: 18, height: 18, fontSize: 10 }}>{(c.name?.[0] || '?').toUpperCase()}</span>
                          {c.name || 'Unknown'}
                          <span style={{ cursor: 'pointer', fontSize: 16, lineHeight: 1, marginLeft: 4 }} onClick={(e) => { e.stopPropagation(); setCommittee(committee.filter(item => item.id !== c.id)); }}>×</span>
                        </div>
                      ))}

                      <input
                        id="committee-search"
                        className="finput-inline"
                        placeholder={committee.length === 0 ? "Search & select confirmed players..." : ""}
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#fff', fontSize: 13, minWidth: 120, padding: '4px 0' }}
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        disabled={!selectedEventId}
                      />
                    </div>

                    {userSearchQuery.length >= 0 && document.activeElement === document.getElementById('committee-search') && (
                      <div className="search-results-dropdown" style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: '#1a1d21', border: '1px solid #444',
                        borderRadius: 8, zIndex: 100, maxHeight: 250, overflowY: 'auto',
                        marginTop: 6, boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
                      }}>
                        {communityUsers
                          .filter(u =>
                            u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) &&
                            !committee.find(c => c.id === u.id)
                          )
                          .map(u => (
                            <div
                              key={u.id}
                              className="search-item"
                              style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #2a2d32', transition: 'background 0.2s' }}
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur
                                setCommittee([...committee, { id: u.id, name: u.name }]);
                                toast.success(`${u.name} added`);
                                setUserSearchQuery("");
                              }}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Community Member</div>
                            </div>
                          ))}
                        {communityUsers.filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) && !committee.find(c => c.id === u.id)).length === 0 && (
                          <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
                            {selectedEventId ? "No matching community users found" : "Please select an event above to see players"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card card-gold">
                  <div className="sec-title">Unsold Player Rule</div>
                  <select className="fselect" style={{ width: '100%', marginBottom: 10 }} value={unsoldRule} onChange={e => setUnsoldRule(e.target.value)}>
                    <option value="ROTATION_AUCTION">All players will be sold — rotation auction</option>
                    <option value="RESERVE_POOL">Unsold players enter reserve pool</option>
                  </select>
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, padding: 8, background: 'rgba(212,160,23,0.05)', borderRadius: 6, border: '1px solid rgba(212,160,23,0.15)' }}>
                    Current Rule: Teams must wait for their turn in the auction rotation. All players will be sold out.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIVE AUCTION */}
        {activeTab === 'live' && (
          <div className="page active">
            <div className="page-hdr">
              <div>
                <div className="page-title">Live Auction</div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Select Event:</span>
                  <select className="fselect" value={selectedEventId || ''} onChange={e => { const eid = e.target.value ? Number(e.target.value) : null; setSelectedEventId(eid); if (eid) { const firstConfig = availableConfigs.find(c => c.eventId === eid); if (firstConfig) setSelectedConfigId(firstConfig.id); else setSelectedConfigId(null); } }} style={{ width: 'auto', minWidth: 150, padding: '4px 8px', fontSize: 12 }}>
                    <option value="">All Events</option>
                    {eventMap.map(ev => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Auction:</span>
                  <select className="fselect" value={selectedConfigId || ''} onChange={e => setSelectedConfigId(Number(e.target.value))} style={{ width: 'auto', minWidth: 150, padding: '4px 8px', fontSize: 12, marginRight: 8 }}>
                    {availableConfigs.filter(c => !selectedEventId || c.eventId === selectedEventId).map(c => (<option key={c.id} value={c.id}>{c.seasonName} ({c.status})</option>))}
                    {availableConfigs.filter(c => !selectedEventId || c.eventId === selectedEventId).length === 0 && (<option value="">No Auction Found</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {auctionStatus === 'LIVE' && <span className="tag tag-live">● Auction Live</span>}
                {(auctionStatus === 'PAUSED' || auctionStatus === 'ACTIVE') && <span className="tag tag-blue">⏸ Paused</span>}
                {auctionStatus === 'COMPLETED' && <span className="tag tag-green">🏆 Completed</span>}
                {canEditLiveAuction && auctionStatus !== 'LIVE' && auctionStatus !== 'COMPLETED' && (<button className="btn btn-gold btn-sm" onClick={() => handleStatusChange('LIVE')}>▶ Start</button>)}
                {canEditLiveAuction && auctionStatus === 'LIVE' && (<button className="btn btn-outline btn-sm" onClick={() => handleStatusChange('ACTIVE')}>⏸ Pause</button>)}
                {canEditLiveAuction && (auctionStatus === 'LIVE' || auctionStatus === 'ACTIVE') && (<button className="btn btn-outline btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => { if (window.confirm("Are you sure you want to stop the auction? This cannot be undone.")) { handleStatusChange('COMPLETED'); } }}>⏹ Stop</button>)}
                {canEditAuctionConfig && (<button className="btn btn-outline btn-sm" onClick={() => nav('config')}>Edit Rules</button>)}
              </div>
            </div>

            {/* Stats Row */}
            {(() => {
              const totalPlayers = registrationCount || auctionStats?.totalPlayers || players.length;
              const soldCount = auctionStats?.soldPlayers ?? players.filter(p => p.status === 'SOLD').length;
              const totalSpent = auctionStats?.totalSpent ?? teams.reduce((s, t) => s + t.spent, 0);
              const totalTeams = auctionStats?.totalTeams ?? teams.length;
              const totalBudget = auctionStats?.totalBudget ?? teams.reduce((s, t) => s + t.budget, 0);
              return (
                <div className="stat-grid">
                  <div className="stat-card"><div className="stat-val">{totalPlayers}</div><div className="stat-label">Confirmed Players</div><div className="stat-sub"><span style={{ color: 'var(--green)' }}>{soldCount} sold</span></div></div>
                  <div className="stat-card"><div className="stat-val" style={{ color: 'var(--green)' }}>{soldCount}</div><div className="stat-label">Players Sold</div><div className="stat-sub"><span style={{ color: 'var(--muted)' }}>₹{totalSpent.toLocaleString('en-IN')} spent</span></div></div>
                  <div className="stat-card"><div className="stat-val" style={{ color: 'var(--amber)' }}>{totalTeams}</div><div className="stat-label">Teams</div><div className="stat-sub"><span style={{ color: 'var(--muted)' }}>₹{totalBudget.toLocaleString('en-IN')} budget</span></div></div>
                  {queuedCount > 0 && (
                    <div className="stat-card"><div className="stat-val" style={{ color: 'var(--blue)' }}>{queuedCount}</div><div className="stat-label">In Queue</div><div className="stat-sub"><span style={{ color: 'var(--gold)' }}>Waiting</span></div></div>
                  )}
                </div>
              );
            })()}

            {/* Main Content */}
            {(!selectedConfigId || configExistsForCommunity === false) ? (
              <div className="auction-stage" style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
                <div className="player-name-big" style={{ marginBottom: 8 }}>No Auction Configured</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.7 }}>No auction configuration has been created for your community's open registration events yet. Create one to define teams, player pools, and bidding rules.</div>
                {canEditAuctionConfig && (<button className="btn btn-gold" style={{ padding: '14px 40px', fontSize: 16 }} onClick={() => nav('config')}>⚙️ Create Auction Config</button>)}
              </div>
            ) : (auctionStatus === 'DRAFT' || auctionStatus === 'ACTIVE') && !livePlayer ? (
              <div className="auction-stage" style={{ textAlign: 'center', padding: '60px 24px' }}>
                {(() => {
                  const hasTeams = teams.length >= 2;
                  const playerCount = registrationCount || eventRegistrations.length || players.length;
                  const hasPlayers = playerCount > 0;
                  const isReady = hasTeams && hasPlayers;
                  return isReady ? (
                    <>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>🏏</div>
                      <div className="player-name-big" style={{ marginBottom: 8 }}>Ready to Start?</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>{canEditLiveAuction ? "Everything looks good! Click below to begin the auction. Teams can bid by clicking their card." : "The auction has not started yet. Please wait for an administrator to begin."}</div>
                      {canEditLiveAuction ? (<button className="btn btn-gold" style={{ padding: '14px 40px', fontSize: 16 }} onClick={() => handleStatusChange('LIVE')}>🚀 Start Auction</button>) : (<div className="tag tag-gold" style={{ padding: '8px 16px' }}>Waiting for Admin</div>)}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
                      <div className="player-name-big" style={{ marginBottom: 8 }}>Setup Incomplete</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, maxWidth: 420, margin: '0 auto 16px' }}>Complete the following before starting the auction:</div>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><span style={{ color: hasTeams ? 'var(--green)' : 'var(--red)', fontSize: 16 }}>{hasTeams ? '✅' : '❌'}</span><span style={{ color: hasTeams ? 'var(--green)' : '#f1f5f9' }}>Teams — {teams.length} configured {!hasTeams && '(minimum 2 required)'}</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><span style={{ color: hasPlayers ? 'var(--green)' : 'var(--red)', fontSize: 16 }}>{hasPlayers ? '✅' : '❌'}</span><span style={{ color: hasPlayers ? 'var(--green)' : '#f1f5f9' }}>Player Pool — {playerCount} players {!hasPlayers && '(at least 1 required)'}</span></div>
                      </div>
                      {(canEditAuctionConfig || canEditTeams || canEditPlayerPool) && (
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                          {canEditAuctionConfig && (<button className="btn btn-gold" style={{ padding: '14px 32px', fontSize: 15 }} onClick={() => nav('config')}>⚙️ Configure Auction</button>)}
                          {canEditTeams && !hasTeams && (<button className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 15 }} onClick={() => nav('teams')}>+ Add Teams</button>)}
                          {canEditPlayerPool && hasTeams && !hasPlayers && (<button className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 15 }} onClick={() => nav('players')}>+ Add Players</button>)}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : auctionStatus === 'COMPLETED' ? (
              <div className="auction-stage" style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                <div className="player-name-big" style={{ marginBottom: 8 }}>Auction Complete!</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>The auction has been stopped or all players have been auctioned. Check the Results tab for final rosters.</div>
                <button className="btn btn-outline" onClick={() => nav('results')}>View Results ↗</button>
              </div>
            ) : auctionStatus === 'LIVE' && !livePlayer ? (
              <div className="auction-stage" style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏁</div>
                <div className="player-name-big" style={{ marginBottom: 8 }}>Auction Queue Empty</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>All players from the queue have been auctioned. Click below to close the auction.</div>
                {canEditLiveAuction && (<button className="btn btn-gold" style={{ padding: '14px 40px', fontSize: 16, background: 'var(--green)', borderColor: 'var(--green)', color: 'white' }} onClick={() => handleStatusChange('COMPLETED')}>Close Auction</button>)}
              </div>
            ) : livePlayer ? (
              <div className="grid2">
                <div>
                  <div className="auction-stage">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span className="tag tag-gold">{livePlayer.category || 'Player'}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>Base ₹{livePlayer.basePrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="player-spotlight">
                      <div className="player-ring">{(livePlayer.playerName.match(/\b\w/g) || []).join('').substring(0, 2).toUpperCase()}</div>
                      <div className="player-name-big">{livePlayer.playerName}</div>
                      <div className="player-role">{livePlayer.playerRole || livePlayer.category}</div>
                      {(() => {
                        let stats: any = {};
                        try { stats = livePlayer.statsJson ? JSON.parse(livePlayer.statsJson) : {}; } catch { }
                        return (
                          <div className="stats-row">
                            <div className="pstat"><div className="pstat-val">{stats.matches || livePlayer.age || '-'}</div><div className="pstat-lbl">{stats.matches ? 'Matches' : 'Age'}</div></div>
                            <div className="pstat"><div className="pstat-val">{stats.runs || '-'}</div><div className="pstat-lbl">Runs</div></div>
                            <div className="pstat"><div className="pstat-val">{stats.wickets || '-'}</div><div className="pstat-lbl">Wickets</div></div>
                            <div className="pstat"><div className="pstat-val">{stats.strikeRate || '-'}</div><div className="pstat-lbl">SR</div></div>
                          </div>
                        );
                      })()}
                      <div className="bid-box">
                        <div className="bid-lbl">Current Bid</div>
                        <div className="bid-amount">₹{livePlayer.currentBid.toLocaleString('en-IN')}</div>
                        <div className="bid-team">{livePlayer.currentBidTeamName || 'No bids yet — click a team to bid'}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>Next bid: ₹{livePlayer.nextBid.toLocaleString('en-IN')} (increment: ₹{livePlayer.nextIncrement.toLocaleString('en-IN')})</div>
                      {isAuctionAdmin ? (
                        <div className="bid-actions">
                          <button className="bid-sold" onClick={handleSoldPlayer} disabled={!biddingTeamId}>SOLD!</button>
                          <button className="bid-pass" onClick={handlePassPlayer}>PASS</button>
                          {queuedCount > 0 ? (
                            <button className="btn btn-outline btn-sm" onClick={fetchNextPlayer} style={{ flex: 0.8 }}>NEXT ↻</button>
                          ) : (
                            <button className="btn btn-gold btn-sm" onClick={() => handleStatusChange('COMPLETED')} style={{ flex: 0.8, background: 'var(--green)', borderColor: 'var(--green)', color: 'white' }}>Close Auction</button>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginTop: 20 }}><span className="tag tag-blue" style={{ padding: '8px 20px', letterSpacing: 1 }}>VIEW ONLY MODE</span></div>
                      )}
                    </div>
                  </div>
                  <div className="card" style={{ marginTop: 14 }}>
                    <div className="sec-title">Bid History — {livePlayer.playerName}</div>
                    <div className="bid-history">
                      {liveBidHistory.map((b, i) => (
                        <div className="bid-entry" key={i}>
                          <span style={{ color: 'var(--muted)' }}>{b.team} <span style={{ fontSize: 10 }}>{b.time}</span></span>
                          <span style={{ color: i === 0 ? 'var(--gold)' : 'var(--text)' }}>₹{b.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 12 }}><div className="sec-title" style={{ margin: 0 }}>🏆 Click a team to place their bid</div></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {teams.map(team => {
                      const remaining = team.budget - team.spent;
                      const canBid = remaining >= livePlayer.nextBid;
                      const isBidding = team.id === biddingTeamId;
                      const pct = Math.round((remaining / team.budget) * 100) || 0;
                      return (
                        <div key={team.id} className={`team-bid-card ${isBidding ? 'highest' : ''} ${(!canBid || !isAuctionAdmin) ? 'disabled' : ''}`} onClick={() => isAuctionAdmin && canBid && handleTeamBid(team)} style={{ cursor: (isAuctionAdmin && canBid) ? 'pointer' : 'not-allowed' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div className="team-name" style={{ color: isBidding ? 'var(--green)' : 'var(--text)' }}>{team.emoji} {team.name}</div>
                            {isBidding && <span className="tag tag-green" style={{ fontSize: 8 }}>Highest</span>}
                          </div>
                          <div className="team-budget" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                            Remaining: <span style={{ color: 'var(--text)', fontWeight: 600 }}>₹{remaining.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="prog-bar" style={{ margin: '6px 0' }}><div className="prog-fill" style={{ width: `${pct}%`, background: isBidding ? 'var(--green)' : team.color || 'var(--amber)' }}></div></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                            <div className="team-players">Spent: ₹{team.spent.toLocaleString('en-IN')}</div>
                            {canBid ? (<span className="tag tag-gold" style={{ fontSize: 9 }}>BID ₹{livePlayer.nextBid.toLocaleString('en-IN')}</span>) : (<span className="tag tag-red" style={{ fontSize: 9 }}>No Budget</span>)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TEAMS */}
        {activeTab === 'teams' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Teams Dashboard</div><div className="page-sub">{teams.length} teams configured for current auction</div></div>
              <div style={{ display: 'flex', gap: 12 }}>
                {canEditTeams && (
                  <button className="btn btn-gold" onClick={() => setShowAddTeam(!showAddTeam)}>
                    {showAddTeam ? '✕ Cancel' : '+ Create Team'}
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => toast.success('Team CSV export ready')}>Export ↗</button>
              </div>
            </div>

            {showAddTeam && (
              <div className="card card-gold" style={{ marginBottom: 24, padding: 24 }}>
                <div className="sec-title">Create New Team</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
                  <div className="fgrp">
                    <div className="flabel">Team Name</div>
                    <input className="finput" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Royal Challengers" />
                  </div>
                  <div className="fgrp">
                    <div className="flabel">Captain / Owner</div>
                    <select className="fselect" value={selectedOwnerId || ''} onChange={e => setSelectedOwnerId(Number(e.target.value))}>
                      <option value="">Select Captain...</option>
                      {communityUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fgrp">
                    <div className="flabel">Auction Budget (₹)</div>
                    <input className="finput" type="number" value={newTeamBudget} onChange={e => setNewTeamBudget(Number(e.target.value))} />
                  </div>
                  <button className="btn btn-gold" onClick={handleCreateTeam} disabled={isCreatingTeam} style={{ height: 42 }}>
                    {isCreatingTeam ? 'Creating...' : 'Confirm Team'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid4" style={{ marginBottom: 20 }}>
              <div className="stat-card"><div className="stat-val">{teams.length}</div><div className="stat-label">Total Teams</div></div>
              <div className="stat-card"><div className="stat-val" style={{ color: 'var(--gold)' }}>₹{(teams.reduce((acc, t) => acc + (t.budget || 0), 0) / 100000).toFixed(1)}L</div><div className="stat-label">Total Budget</div></div>
              <div className="stat-card"><div className="stat-val" style={{ color: 'var(--green)' }}>{teams.reduce((acc, t) => acc + (t.players?.length || 0), 0)}</div><div className="stat-label">Players Assigned</div></div>
              <div className="stat-card"><div className="stat-val" style={{ color: 'var(--amber)' }}>₹{(teams.reduce((acc, t) => acc + (t.spent || 0), 0) / 100000).toFixed(1)}L</div><div className="stat-label">Total Spent</div></div>
            </div>

            <div className="grid2">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                {teams.length > 0 ? teams.map((team, idx) => {
                  const budget = team.budget || 0;
                  const spent = team.spent || 0;
                  const rem = budget - spent;
                  const pct = budget > 0 ? Math.round((rem / budget) * 100) : 0;
                  return (
                    <div key={team.id} className="card" style={{ marginBottom: 0, borderLeft: `4px solid ${team.color || 'var(--gold)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                           <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--text)' }}>{team.name}</div>
                           <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Captain: {team.ownerName || 'Not Assigned'}</div>
                        </div>
                        <div className="tag tag-gold" style={{ height: 'fit-content' }}>Team #{idx + 1}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
                        <div><div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22 }}>₹{(rem || 0).toLocaleString('en-IN')}</div><div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>Remaining</div></div>
                        <div><div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--amber)' }}>₹{(spent || 0).toLocaleString('en-IN')}</div><div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>Spent</div></div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}><div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--green)' }}>{team.players?.length || 0}</div><div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>Squad</div></div>
                      </div>
                      <div className="prog-bar" style={{ marginBottom: 12 }}><div className="prog-fill" style={{ width: `${pct}%`, background: team.color || 'var(--gold)' }}></div></div>
                      
                      {team.players && team.players.length > 0 ? (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Purchased Squad ({team.players.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {team.players.map((pl, pIdx) => (
                              <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 12 }}>
                                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{pl.name}</span>
                                {pl.category && <span style={{ fontSize: 10, color: 'var(--muted)', background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: 4 }}>{pl.category}</span>}
                                <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 11 }}>₹{(pl.soldPrice || 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>
                          No players purchased yet
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed #333' }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🛡️</div>
                    <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>No Teams Found</div>
                    <div style={{ fontSize: 13, marginTop: 8 }}>Start by creating your first team for the auction.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Player Pool</div><div className="page-sub">{eventRegistrations.length} Confirmed Participants from Registration</div></div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                 <span style={{ fontSize: 13, color: 'var(--muted)' }}>Pool for Event ID: {selectedEventId || 'None'}</span>
              </div>
            </div>

            <div className="grid2">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                {eventRegistrations.length > 0 ? eventRegistrations.map(p => (
                  <div key={p.id} className="player-row" style={{ background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.1)' }}>
                    <div className="player-avatar av-bat" style={{ background: 'var(--gold)', color: '#000' }}>{p.name[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>Role: {p.role}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="tag tag-green">Confirmed</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                    <div>No confirmed players found for this event.</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>Players appear here after their registration is confirmed.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* REGISTRATIONS */}
        {activeTab === 'registrations' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Event Registrations</div><div className="page-sub">View confirmed participants from registration database</div></div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Select Event:</span>
                <select
                  className="fselect"
                  value={selectedEventId || ""}
                  onChange={e => {
                    const eid = e.target.value ? Number(e.target.value) : null;
                    setSelectedEventId(eid);
                    if (eid) {
                      setLoadingRegistrations(true);
                      sportsService.getEventRegistrations(eid)
                        .then(regs => setEventRegistrations(regs))
                        .catch(() => setEventRegistrations([]))
                        .finally(() => setLoadingRegistrations(false));
                    } else {
                      setEventRegistrations([]);
                    }
                  }}
                  style={{ width: 'auto', minWidth: 250, padding: '6px 12px' }}
                >
                  <option value="">Select Sports Event...</option>
                  {eventMap.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="card card-gold">
              {loadingRegistrations ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading registrations...</div>
              ) : eventRegistrations.length > 0 ? (
                <div className="table-container">
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase' }}>Player</th>
                        <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase' }}>Role/Category</th>
                        <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventRegistrations.map(reg => (
                        <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600 }}>{reg.playerName || reg.user?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Age: {reg.age || 'N/A'} · {reg.flatNumber || 'External'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13 }}>
                            {reg.role || 'All-rounder'}
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{reg.category?.name || 'General'}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className={`tag ${reg.status === 'CONFIRMED' ? 'tag-green' : 'tag-blue'}`}>
                              {reg.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
                  {selectedEventId ? 'No registrations found for this event.' : 'Please select a sports event to view registrations.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {activeTab === 'results' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Auction Results</div><div className="page-sub">Final Team Rosters & Budgets</div></div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Sports Event:</span>
                  <select
                    className="fselect"
                    value={selectedEventId || ''}
                    onChange={e => {
                      const eid = e.target.value ? Number(e.target.value) : null;
                      setSelectedEventId(eid);
                      // Auto-select the first auction config for this event if it exists
                      if (eid) {
                        const firstConfig = availableConfigs.find(c => c.eventId === eid);
                        if (firstConfig) setSelectedConfigId(firstConfig.id);
                      }
                    }}
                    style={{ width: 'auto', minWidth: 200, padding: '6px 12px' }}
                  >
                    <option value="">All Events</option>
                    {eventMap.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Auction:</span>
                  <select
                    className="fselect"
                    value={selectedConfigId || ''}
                    onChange={e => setSelectedConfigId(Number(e.target.value))}
                    style={{ width: 'auto', minWidth: 200, padding: '6px 12px' }}
                  >
                    {availableConfigs
                      .filter(c => !selectedEventId || c.eventId === selectedEventId)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.seasonName} {c.status === 'COMPLETED' ? '(Completed)' : ''}
                        </option>
                      ))}
                    {availableConfigs.filter(c => !selectedEventId || c.eventId === selectedEventId).length === 0 && (
                      <option value="">No Auctions Found</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
            {auctionStatus !== 'COMPLETED' ? (
              <div className="auction-stage animate-fade-in" style={{ textAlign: 'center', padding: '80px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)', marginTop: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>⏳</div>
                <div className="player-name-big" style={{ marginBottom: 12, fontSize: 28, letterSpacing: '0.5px' }}>Auction In Progress</div>
                <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.7 }}>
                  This auction configuration is currently in <strong style={{ color: 'var(--gold)' }}>{auctionStatus}</strong> status. Roster results will be finalized and rendered once the administrator completes the live bidding.
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button className="btn btn-gold" onClick={() => nav('live')} style={{ padding: '10px 24px' }}>📺 View Live Auction</button>
                  <button className="btn btn-outline" onClick={() => nav('teams')} style={{ padding: '10px 24px' }}>🛡️ Teams Dashboard</button>
                </div>
              </div>
            ) : (
              <>
                <div className="card card-gold">
                  <div className="sec-title">Dispute Committee</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Any dispute to be referred to: <strong style={{ color: 'var(--gold)' }}>{committee.join(", ")}</strong>. Decision is final.</div>
                </div>
                <div className="grid2" style={{ marginTop: 16 }}>
                  {teams.map(team => {
                    const teamPlayers = players.filter(p => p.status === 'SOLD' && (p.assignedTeam?.id === team.id || (p as any).assignedTeam?.teamId === team.id || (p as any).assignedTeam === team.id));
                    const budget = team.budget || 0;
                    const spent = team.spent || 0;
                    const remaining = budget - spent;

                    return (
                      <div key={team.id} className="card card-gold" style={{ marginBottom: 16, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <div>
                            <div className="sec-title" style={{ margin: 0, fontSize: 20 }}>{team.emoji} {team.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Spent: ₹{spent.toLocaleString('en-IN')}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>₹{remaining.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Remaining</div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 8 }}>
                          <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 8, paddingLeft: 4, fontWeight: 600 }}>
                            Players ({teamPlayers.length})
                          </div>
                          {teamPlayers.length > 0 ? teamPlayers.map(p => {
                            const playerName = (p as any).playerName || p.name;
                            const playerRole = (p as any).playerRole || p.role;
                            const initials = p.initials || playerName?.match(/\b\w/g)?.join('')?.substring(0, 2)?.toUpperCase() || 'P';

                            return (
                              <div key={p.id} className="player-row sold" style={{ padding: '8px 12px', margin: '4px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                                <div className="player-avatar av-bat" style={{ width: 32, height: 32, fontSize: 12 }}>
                                  {initials}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600 }}>{playerName}</div>
                                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{playerRole}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>₹{(p.soldPrice || 0).toLocaleString('en-IN')}</div>
                                </div>
                              </div>
                            );
                          }) : (
                            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>No players assigned yet.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* CRICKET (Setup Menu) */}
        {activeTab === 'cricket' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Cricket Setup</div><div className="page-sub">Manage Players & Teams</div></div>
              {canEditAuctionConfig && <button className="btn btn-outline" onClick={() => nav('config')}>Auction Rules ↗</button>}
            </div>

            <div className="grid2">
              {canEditTeams && (
                <div className="card card-gold">
                  <div className="sec-title">Add / Edit Team</div>
                  <div className="fgrp" style={{ marginBottom: 10 }}>
                    <div className="flabel">Team Name</div>
                    <input className="finput" placeholder="e.g. Team Warriors"
                      value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                  </div>
                  <div className="fgrp" style={{ marginBottom: 10 }}>
                    <div className="flabel">Captain / Owner</div>
                    <select className="fselect" value={selectedOwnerId || ''} onChange={e => setSelectedOwnerId(Number(e.target.value))}>
                      <option value="">Select Captain...</option>
                      {communityUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fgrp" style={{ marginBottom: 10 }}>
                    <div className="flabel">Starting Budget (₹)</div>
                    <input className="finput" type="number"
                      value={newTeamBudget} onChange={e => setNewTeamBudget(Number(e.target.value))} />
                  </div>
                  <button className="btn btn-gold" style={{ width: '100%' }} onClick={handleCreateTeam} disabled={isCreatingTeam}>
                    {isCreatingTeam ? 'Saving...' : 'Save Team ↗'}
                  </button>
                </div>
              )}

              {canEditPlayerPool && (
                <div className="card card-gold">
                  <div className="sec-title">Add New Player</div>
                  <div className="form-row">
                    <div className="fgrp" style={{ marginBottom: 10, flex: 2 }}>
                      <div className="flabel">Player Name</div>
                      <input className="finput" placeholder="e.g. Virat K."
                        value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} />
                    </div>
                    <div className="fgrp" style={{ marginBottom: 10, flex: 1 }}>
                      <div className="flabel">Age</div>
                      <input className="finput" type="number"
                        value={newPlayer.age} onChange={e => setNewPlayer({ ...newPlayer, age: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="fgrp" style={{ marginBottom: 10 }}>
                      <div className="flabel">Category</div>
                      <select className="fselect" value={newPlayer.category} onChange={e => setNewPlayer({ ...newPlayer, category: e.target.value })}>
                        <option value="BATSMEN">Batsmen</option>
                        <option value="BOWLERS">Bowlers</option>
                        <option value="ALL_ROUNDERS">All Rounders</option>
                        <option value="WICKET_KEEPERS">Wicket Keepers</option>
                      </select>
                    </div>
                    <div className="fgrp" style={{ marginBottom: 10 }}>
                      <div className="flabel">Role</div>
                      <input className="finput" placeholder="e.g. Right-Hand Bat"
                        value={newPlayer.role} onChange={e => setNewPlayer({ ...newPlayer, role: e.target.value })} />
                    </div>
                  </div>

                  <div className="fgrp" style={{ marginBottom: 14 }}>
                    <div className="flabel">Base Price (₹)</div>
                    <input className="finput" type="number"
                      value={newPlayer.basePrice} onChange={e => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })} />
                  </div>

                  <div className="sec-title" style={{ fontSize: 14 }}>Player Statistics</div>
                  <div className="form-row">
                    <div className="fgrp" style={{ marginBottom: 10 }}><div className="flabel">Matches</div><input className="finput" type="number" value={newPlayer.matches} onChange={e => setNewPlayer({ ...newPlayer, matches: Number(e.target.value) })} /></div>
                    <div className="fgrp" style={{ marginBottom: 10 }}><div className="flabel">Runs</div><input className="finput" type="number" value={newPlayer.runs} onChange={e => setNewPlayer({ ...newPlayer, runs: Number(e.target.value) })} /></div>
                    <div className="fgrp" style={{ marginBottom: 10 }}><div className="flabel">Wickets</div><input className="finput" type="number" value={newPlayer.wickets} onChange={e => setNewPlayer({ ...newPlayer, wickets: Number(e.target.value) })} /></div>
                  </div>

                  <button className="btn btn-gold" style={{ width: '100%', marginTop: 10 }} onClick={handleCreatePlayer}>Add Player ↗</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OTHER SPORTS (Placeholders) */}
        {['badminton', 'football', 'volleyball'].includes(activeTab) && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title" style={{ textTransform: 'capitalize' }}>{activeTab}</div><div className="page-sub">Configure auction rules</div></div>
              {canEditAuctionConfig && <button className="btn btn-outline" onClick={() => nav('config')}>Setup Auction ↗</button>}
            </div>
            <div className="card"><div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>No auction configured for {activeTab} yet.</div></div>
          </div>
        )}

      </main>
    </div>
  );
}

