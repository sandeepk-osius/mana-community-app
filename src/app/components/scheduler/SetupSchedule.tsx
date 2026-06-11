import { useState, useEffect } from 'react';
import { Calendar, MapPin, Settings, Trophy, AlertTriangle, ChevronDown, ChevronUp, Pencil, Plus, X, Trash2, GripVertical } from 'lucide-react';
import { tournamentService } from '../../../services/tournamentService';
import { venueService } from '../../../services/venueService';
import { sportsService } from '../../../services/sportsService';
import type { TournamentTypeInfo, EventInfo, ConfigInfo } from '../../../services/tournamentService';
import type { Venue, EventRegistration } from '../../../types/api';
import { PlayoffBracketView } from './PlayoffBracketView';
import { ScheduleSaveFooter } from './ScheduleSaveFooter';
import {
  applyPlayoffOverrides,
  collectPlayoffPlaceholderOptions,
  getGroupStageEnd,
  addMinutesToTime,
  parseBreakMinutes,
} from './playoffSchedule';
import type { PlayoffScheduleInput, PlayoffMatchDraft } from './playoffSchedule';

const TIME_OPTIONS = [
  '06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM','09:00 PM','10:00 PM'
];
const BREAK_OPTIONS = ['5 mins','10 mins','15 mins','20 mins','30 mins','45 mins','60 mins'];
const SEEDING_OPTIONS = [
  { value: 'RANDOM', label: 'Random' },
  { value: 'TRADITIONAL', label: 'Traditional' },
  { value: 'SEQUENTIAL', label: 'Sequential' },
];
const VENUE_ASSIGN_OPTIONS = ['Random','Snake','Sequential','Parallel'];

interface SetupScheduleProps {
  initialEventId?: string;
}

export function SetupSchedule({ initialEventId }: SetupScheduleProps = {}) {
  // Data
  const [types, setTypes] = useState<TournamentTypeInfo[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // Schedule Config
  const [format, setFormat] = useState('');
  const [participants, setParticipants] = useState('8');
  const [numberOfGroups, setNumberOfGroups] = useState('2');
  const [thirdPlace, setThirdPlace] = useState(false);
  const [seedingOrder, setSeedingOrder] = useState('TRADITIONAL');
  const [playoffThirdPlace, setPlayoffThirdPlace] = useState(false);
  const [playoffSeedingOrder, setPlayoffSeedingOrder] = useState('TRADITIONAL');

  const isGroupKnockout = format === 'GROUP_PLAYOFF';
  const isKnockoutOnly = format === 'KNOCKOUT_SINGLE' || format === 'KNOCKOUT_DOUBLE';

  // Scoring Config
  const [ptsWin, setPtsWin] = useState('2');
  const [ptsDraw, setPtsDraw] = useState('1');
  const [ptsLoss, setPtsLoss] = useState('0');

  // Standings Configuration Master State
  const [standingsConfig, setStandingsConfig] = useState({
    allowVariablePoints: false,
    convincingWin: '3',
    convincingLoss: '0',
    normalWin: '2',
    normalLoss: '0',
    marginalWin: '2',
    marginalLoss: '1',
    customPoints: false,
    tiePoints: '1',
    noResultPoints: '1',
    displaySettings: {
      totalMatches: true,
      matchPoints: true,
      played: true,
      toBePlayed: false,
      wins: true,
      losses: true,
      tiedDrawn: false,
      noResult: false,
      setsWon: false,
      setsLost: false,
      cumulativeSetPointsScored: false,
      cumulativeSetSubPointsScored: false,
      cumulativeSetPointsConceded: false,
      cumulativeSetSubPointsConceded: false,
      recentForm: false,
      setPointsDiff: false,
    },
    additionalParams: [] as { id: string; name: string; shortName: string }[],
  });

  // Modal temporary form states
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [modalAllowVariablePoints, setModalAllowVariablePoints] = useState(false);
  const [modalConvincingWin, setModalConvincingWin] = useState('3');
  const [modalConvincingLoss, setModalConvincingLoss] = useState('0');
  const [modalNormalWin, setModalNormalWin] = useState('2');
  const [modalNormalLoss, setModalNormalLoss] = useState('0');
  const [modalMarginalWin, setModalMarginalWin] = useState('2');
  const [modalMarginalLoss, setModalMarginalLoss] = useState('1');
  const [modalCustomPoints, setModalCustomPoints] = useState(false);
  const [modalTiePoints, setModalTiePoints] = useState('1');
  const [modalNoResultPoints, setModalNoResultPoints] = useState('1');
  const [modalDisplaySettings, setModalDisplaySettings] = useState<Record<string, boolean>>({});
  const [modalAdditionalParams, setModalAdditionalParams] = useState<{ id: string; name: string; shortName: string }[]>([]);
  const [newParamName, setNewParamName] = useState('');
  const [newParamShortName, setNewParamShortName] = useState('');

  // Additional Parameters Handlers
  const addAdditionalParam = () => {
    if (!newParamName.trim() || !newParamShortName.trim()) return;
    const newParam = {
      id: Math.random().toString(36).substr(2, 9),
      name: newParamName.trim(),
      shortName: newParamShortName.trim()
    };
    setModalAdditionalParams([...modalAdditionalParams, newParam]);
    setNewParamName('');
    setNewParamShortName('');
  };

  const updateAdditionalParam = (id: string, field: 'name' | 'shortName', value: string) => {
    setModalAdditionalParams(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deleteAdditionalParam = (id: string) => {
    setModalAdditionalParams(prev => prev.filter(p => p.id !== id));
  };

  const openStandingsModal = () => {
    setModalAllowVariablePoints(standingsConfig.allowVariablePoints);
    setModalConvincingWin(standingsConfig.convincingWin);
    setModalConvincingLoss(standingsConfig.convincingLoss);
    setModalNormalWin(ptsWin);
    setModalNormalLoss(ptsLoss);
    setModalMarginalWin(standingsConfig.marginalWin);
    setModalMarginalLoss(standingsConfig.marginalLoss);
    setModalCustomPoints(standingsConfig.customPoints);
    setModalTiePoints(ptsDraw);
    setModalNoResultPoints(standingsConfig.noResultPoints);
    setModalDisplaySettings({ ...standingsConfig.displaySettings });
    setModalAdditionalParams([...standingsConfig.additionalParams]);
    setNewParamName('');
    setNewParamShortName('');
    setShowStandingsModal(true);
  };

  const handleSaveStandings = () => {
    setStandingsConfig({
      allowVariablePoints: modalAllowVariablePoints,
      convincingWin: modalConvincingWin,
      convincingLoss: modalConvincingLoss,
      normalWin: modalNormalWin,
      normalLoss: modalNormalLoss,
      marginalWin: modalMarginalWin,
      marginalLoss: modalMarginalLoss,
      customPoints: modalCustomPoints,
      tiePoints: modalTiePoints,
      noResultPoints: modalNoResultPoints,
      displaySettings: modalDisplaySettings as any,
      additionalParams: modalAdditionalParams,
    });
    setPtsWin(modalNormalWin);
    setPtsLoss(modalNormalLoss);
    setPtsDraw(modalTiePoints);
    setShowStandingsModal(false);
  };

  const toggleDisplaySetting = (key: string) => {
    setModalDisplaySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const displayParams = [
    { key: 'totalMatches', label: 'Total Matches' },
    { key: 'matchPoints', label: 'Match Points' },
    { key: 'played', label: 'Played' },
    { key: 'toBePlayed', label: 'To be played' },
    { key: 'wins', label: 'Wins' },
    { key: 'losses', label: 'Losses' },
    { key: 'tiedDrawn', label: 'Tied/Drawn' },
    { key: 'noResult', label: 'No Result' },
    { key: 'setsWon', label: 'Sets Won' },
    { key: 'setsLost', label: 'Sets Lost' },
    { key: 'cumulativeSetPointsScored', label: 'Cumulative Set Points (Scored)' },
    { key: 'cumulativeSetSubPointsScored', label: 'Cumulative Set Sub Points (Scored)' },
    { key: 'cumulativeSetPointsConceded', label: 'Cumulative Set Points (Conceded)' },
    { key: 'cumulativeSetSubPointsConceded', label: 'Cumulative Set Sub Points (Conceded)' },
    { key: 'recentForm', label: 'Recent Form' },
    { key: 'setPointsDiff', label: 'Set Points Diff' },
  ];

  // Participants Scoring Master State
  const [participantsScoring, setParticipantsScoring] = useState({
    enabled: false,
    adminApproval: false,
    canPublish: false,
    opponentApproval: false,
  });

  // Modal temporary form states for participants scoring
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [modalAdminApproval, setModalAdminApproval] = useState(false);
  const [modalCanPublish, setModalCanPublish] = useState(false);
  const [modalOpponentApproval, setModalOpponentApproval] = useState(false);

  const openParticipantsModal = () => {
    setModalAdminApproval(participantsScoring.adminApproval);
    setModalCanPublish(participantsScoring.canPublish);
    setModalOpponentApproval(participantsScoring.opponentApproval);
    setShowParticipantsModal(true);
  };

  const handleSaveParticipants = () => {
    setParticipantsScoring({
      enabled: true,
      adminApproval: modalAdminApproval,
      canPublish: modalCanPublish,
      opponentApproval: modalOpponentApproval,
    });
    setShowParticipantsModal(false);
    setToast('Participants scoring workflow enabled successfully!');
    setTimeout(() => setToast(null), 3000);
  };

  // Date & Time Config
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('08:00 PM');
  const [matchDuration, setMatchDuration] = useState('30');
  const [breakTime, setBreakTime] = useState('10 mins');
  const [limitMatchesPerDay, setLimitMatchesPerDay] = useState(false);
  const [maxMatchesPerDay, setMaxMatchesPerDay] = useState('2');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Venue Config
  const [selectedVenues, setSelectedVenues] = useState<number[]>([]);
  const [venueAssignType, setVenueAssignType] = useState('Random');
  const [expandedVenue, setExpandedVenue] = useState<number | null>(null);

  // Event selection
  const [selectedEvent, setSelectedEvent] = useState('');

  // UI
  const [generating, setGenerating] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Generated Schedule View
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [playoffsGenerated, setPlayoffsGenerated] = useState(false);
  // Playoff ("rounds to final") bracket draft generated by the backend
  // (POST /api/tournament/playoff/generate). Replaces in-browser generation.
  const [playoffDraft, setPlayoffDraft] = useState<PlayoffMatchDraft[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(null);
  const [generatedGroups, setGeneratedGroups] = useState<Array<{
    name: string;
    participants: Array<{ id: string; name: string; flatNumber?: string }>;
    rounds: string;
    proceeders: string;
    limitMatches: boolean;
    maxMatches: string;
  }>>([]);
  const [allParticipantOptions, setAllParticipantOptions] = useState<Array<{ id: string; name: string; flatNumber?: string }>>([]);
  const [confirmedRegistrations, setConfirmedRegistrations] = useState<EventRegistration[]>([]);
  const [allPlayersConfirmed, setAllPlayersConfirmed] = useState(true);

  // Match Editing State
  const [matchOverrides, setMatchOverrides] = useState<Record<string, any>>({});
  const [editingGroupIdx, setEditingGroupIdx] = useState<number>(0);
  const [editingMatchKey, setEditingMatchKey] = useState<string | null>(null);
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [editMatchForm, setEditMatchForm] = useState({
    name: '',
    homeId: '',
    awayId: '',
    date: '',
    time: '',
    duration: 30,
    venue: '',
    court: '',
    moveSubsMatches: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Pre-select event when arriving from "Schedule Matches" button
  useEffect(() => {
    if (!initialEventId || events.length === 0) return;
    const match = events.find(e => e.id.toString() === initialEventId);
    if (match) handleEventChange(initialEventId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, initialEventId]);

  const loadData = async () => {
    try {
      const [t, e, c] = await Promise.all([
        tournamentService.getTournamentTypes(),
        tournamentService.getEventsForDropdown(),
        tournamentService.getConfigs(),
      ]);
      setTypes(t);
      setEvents(e);
      setConfigs(c);
    } catch { /* fallback handled by existing types */ }
    try {
      const v = await venueService.getVenues();
      setVenues(v);
    } catch { /* no venues */ }
  };

  const handleEventChange = async (id: string) => {
    setSelectedEvent(id);
    const ev = events.find(e => e.id.toString() === id);
    if (ev) {
      if (ev.eventDateStart) setStartDate(ev.eventDateStart);
      if (ev.eventDateEnd) setEndDate(ev.eventDateEnd);
    }

    if (!id) return;

    // Fetch sports_event row, confirmed count, and registration list in parallel
    const [fullEventResult, confirmedResult, registrationsResult] = await Promise.allSettled([
      sportsService.getEventById(Number(id)),
      sportsService.getConfirmedCount(Number(id)),
      sportsService.getEventRegistrations(Number(id)),
    ]);

    // Format — sports_event.tournament_type is authoritative
    if (fullEventResult.status === 'fulfilled') {
      const fe = fullEventResult.value;
      const resolved = (fe.tournamentType as string | undefined)
        ?? configs.find(c => c.eventId === Number(id))?.tournamentType
        ?? '';
      if (resolved) setFormat(resolved);
    } else {
      const fallback = configs.find(c => c.eventId === Number(id))?.tournamentType ?? '';
      if (fallback) setFormat(fallback);
    }

    // Number of Participants — COUNT of CONFIRMED rows in sports_event_registration
    if (confirmedResult.status === 'fulfilled') {
      setParticipants(String(confirmedResult.value));
    } else if (ev && ev.totalTeams > 0) {
      setParticipants(ev.totalTeams.toString());
    }

    // Store confirmed registrations for populating participant slots with real player data
    if (registrationsResult.status === 'fulfilled') {
      const confirmed = registrationsResult.value.filter(
        (r: EventRegistration) => r.status === 'CONFIRMED' || r.status === 'REGISTERED'
      );
      setConfirmedRegistrations(confirmed);
    } else {
      setConfirmedRegistrations([]);
    }
  };

  const resetGeneratedSchedule = () => {
    setScheduleGenerated(false);
    setPlayoffsGenerated(false);
    setGeneratedGroups([]);
    setMatchOverrides({});
    setShowSetup(false);
  };

  const handleFormatChange = (value: string) => {
    setFormat(value);
    resetGeneratedSchedule();
  };

  const toggleVenue = (id: number) => {
    setSelectedVenues(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const validateScheduleConfig = () => {
    if (!format) { setToast('Please select a format'); return false; }
    if (!participants || Number(participants) < 2) { setToast('Enter valid participants'); return false; }
    return true;
  };

  const buildScheduleConfigBody = () => {
    const ev = events.find(e => e.id.toString() === selectedEvent);
    return {
      tournamentName: ev?.name || 'Tournament',
      sportId: ev?.sportId || 1,
      communityId: ev?.communityId || 1,
      eventId: selectedEvent ? Number(selectedEvent) : null,
      tournamentType: format,
      totalTeams: Number(participants),
      numberOfGroups: isGroupKnockout ? Number(numberOfGroups) || 2 : null,
      teamsAdvancingPerGroup: isGroupKnockout ? Math.min(2, Math.max(1, Math.floor(Number(participants) / (Number(numberOfGroups) || 2)))) : null,
      teamIds: [],
      thirdPlaceMatch: isGroupKnockout ? playoffThirdPlace : thirdPlace,
      hasSeeding: isGroupKnockout ? playoffSeedingOrder === 'TRADITIONAL' : seedingOrder === 'TRADITIONAL',
      startDate: startDate || null,
      endDate: endDate || null,
      matchDurationMinutes: Number(matchDuration) || 30,
      breakBetweenMatchesMinutes: parseInt(breakTime) || 10,
      venueName: selectedVenues.length > 0 ? venues.find(v => v.id === selectedVenues[0])?.name || '' : '',
      pointsForWin: Number(ptsWin),
      pointsForDraw: Number(ptsDraw),
      pointsForLoss: Number(ptsLoss),
      standingsConfig: {
        allowVariablePoints: standingsConfig.allowVariablePoints,
        convincingWinPoints: Number(standingsConfig.convincingWin),
        convincingLossPoints: Number(standingsConfig.convincingLoss),
        marginalWinPoints: Number(standingsConfig.marginalWin),
        marginalLossPoints: Number(standingsConfig.marginalLoss),
        letUserGiveCustomPoints: standingsConfig.customPoints,
        noResultPoints: Number(standingsConfig.noResultPoints),
        displaySettings: standingsConfig.displaySettings,
        additionalParameters: standingsConfig.additionalParams.map(p => ({
          name: p.name,
          shortName: p.shortName,
        })),
      },
      participantsScoring: {
        enabled: participantsScoring.enabled,
        adminApproval: participantsScoring.adminApproval,
        canPublish: participantsScoring.canPublish,
        opponentApproval: participantsScoring.opponentApproval,
      },
    };
  };

  const buildParticipantList = (count: number): Array<{ id: string; name: string; flatNumber?: string }> => {
    const allParts: Array<{ id: string; name: string; flatNumber?: string }> = [];
    for (let i = 0; i < count; i++) {
      if (i < confirmedRegistrations.length) {
        const reg = confirmedRegistrations[i];
        allParts.push({
          id: `P${i + 1}`,
          name: reg.playerName || reg.user?.fullName || `Participant ${i + 1}`,
          flatNumber: reg.flatNumber || reg.user?.community?.name || undefined,
        });
      } else {
        allParts.push({ id: `P${i + 1}`, name: `Participant ${i + 1}` });
      }
    }
    return allParts;
  };

  const buildGroupsState = () => {
    const numGroups = Number(numberOfGroups) || 2;
    const numParticipants = Number(participants) || 8;
    const allParts = buildParticipantList(numParticipants);
    setAllParticipantOptions(allParts);

    const defaultProceeders = isGroupKnockout
      ? String(Math.min(2, Math.max(1, Math.floor(numParticipants / numGroups))))
      : '1';

    const groups: typeof generatedGroups = [];
    for (let g = 0; g < numGroups; g++) {
      groups.push({
        name: `Group ${String.fromCharCode(65 + g)}`,
        participants: [],
        rounds: '1',
        proceeders: defaultProceeders,
        limitMatches: false,
        maxMatches: '2',
      });
    }
    allParts.forEach((p, idx) => {
      const groupIdx = idx % numGroups;
      groups[groupIdx].participants.push(p);
    });
    setGeneratedGroups(groups);
  };

  /** Step 1 (Group + Knockout): assign groups and generate group-stage matches only. */
  const handleScheduleGroups = async () => {
    if (!validateScheduleConfig()) return;
    setGenerating(true);
    try {
      const configData = buildScheduleConfigBody();
      const configResult = await tournamentService.createConfig(configData);
      console.log('[Schedule Groups] Config created:', configResult);

      buildGroupsState();

      // Save group stage matches to database with SCHEDULED status
      const allMatches = collectAllMatches();
      if (allMatches.length > 0 && configResult?.id) {
        const matchesWithConfigId = allMatches.map(m => ({ ...m, configId: configResult.id, status: 'SCHEDULED' }));
        console.log('[Schedule Groups] Saving matches to DB:', { configId: configResult.id, matchCount: matchesWithConfigId.length });
        await tournamentService.saveMatchesBulk(configResult.id, matchesWithConfigId);
        console.log('[Schedule Groups] Matches saved successfully');
        setCurrentConfigId(configResult.id);
      }

      setPlayoffsGenerated(false);
      setScheduleGenerated(true);
      setShowSetup(false);
      setToast('✓ Group schedule generated and saved to database! Configure proceeders, then click Generate Schedule for playoffs.');
    } catch (err: any) {
      console.error('[Schedule Groups] Error:', err);
      setToast('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  /** Step 2 (Group + Knockout): generate knockout / playoff matches after groups are scheduled. */
  const handleGeneratePlayoffs = async () => {
    if (!scheduleGenerated) {
      setToast('Schedule groups first');
      return;
    }
    if (
      generatedGroups.length === 0 ||
      generatedGroups.some(g => g.participants.length < 2)
    ) {
      setToast('Configure groups with at least 2 participants before generating playoffs');
      return;
    }

    const numGroups = generatedGroups.length || Number(numberOfGroups) || 2;
    if (numGroups === 2 && generatedGroups.some(g => Number(g.proceeders) < 2)) {
      setGeneratedGroups(prev =>
        prev.map(g => ({ ...g, proceeders: '2' }))
      );
      setToast('Proceeders set to 2 per group for semi-finals + final bracket');
    }

    setGenerating(true);
    try {
      // Generate the playoff ("rounds to final") bracket on the backend.
      const draft = await fetchPlayoffDraft();

      // Save playoff matches to database with SCHEDULED status
      if (currentConfigId) {
        const allMatches = collectAllMatches(draft);
        if (allMatches.length > 0) {
          const matchesWithConfigId = allMatches.map(m => ({ ...m, configId: currentConfigId, status: 'SCHEDULED' }));
          console.log('[Generate Playoffs] Saving playoff matches to DB:', { configId: currentConfigId, matchCount: matchesWithConfigId.length });
          await tournamentService.saveMatchesBulk(currentConfigId, matchesWithConfigId);
          console.log('[Generate Playoffs] Playoff matches saved successfully');
        }
      }

      setPlayoffsGenerated(true);
      setToast('✓ Knockout bracket generated and saved to database!');
    } catch (err: any) {
      console.error('[Generate Playoffs] Error:', err);
      setToast('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  /** Single-step generate for Knockout-only and other non-group formats. */
  const handleGenerate = async () => {
    if (!validateScheduleConfig()) return;
    setGenerating(true);
    try {
      const configData = buildScheduleConfigBody();
      const configResult = await tournamentService.createConfig(configData);
      console.log('[Generate] Config created:', configResult);

      const numParticipants = Number(participants) || 8;
      const allParts = buildParticipantList(numParticipants);
      setAllParticipantOptions(allParts);

      // For knockout-only, generate the bracket on the backend and cache it.
      // (Saved with real participants via the Save Draft / Publish action, once
      // allParticipantOptions state has settled — matching prior behavior.)
      if (isKnockoutOnly) {
        await fetchPlayoffDraft();
      }

      // Save matches to database with SCHEDULED status
      const allMatches = collectAllMatches();
      if (allMatches.length > 0 && configResult?.id) {
        const matchesWithConfigId = allMatches.map(m => ({ ...m, configId: configResult.id, status: 'SCHEDULED' }));
        console.log('[Generate] Saving matches to DB:', { configId: configResult.id, matchCount: matchesWithConfigId.length });
        await tournamentService.saveMatchesBulk(configResult.id, matchesWithConfigId);
        console.log('[Generate] Matches saved successfully');
        setCurrentConfigId(configResult.id);
      }

      if (isKnockoutOnly) {
        setGeneratedGroups([]);
        setPlayoffsGenerated(true);
        setToast('✓ Knockout schedule generated and saved to database!');
      } else {
        setPlayoffsGenerated(false);
        setToast('✓ Schedule generated and saved to database!');
      }

      setScheduleGenerated(true);
      setShowSetup(false);
    } catch (err: any) {
      console.error('[Generate] Error:', err);
      setToast('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Group config handlers
  const updateGroupConfig = (groupIdx: number, field: string, value: any) => {
    setGeneratedGroups(prev => prev.map((g, i) => i === groupIdx ? { ...g, [field]: value } : g));
  };

  const updateParticipantInGroup = (groupIdx: number, partIdx: number, newId: string) => {
    const selected = allParticipantOptions.find(p => p.id === newId);
    if (!selected) return;
    setGeneratedGroups(prev => prev.map((g, i) => {
      if (i !== groupIdx) return g;
      const updated = [...g.participants];
      updated[partIdx] = { ...selected };
      return { ...g, participants: updated };
    }));
  };

  const applyToAllGroups = (sourceIdx: number) => {
    const source = generatedGroups[sourceIdx];
    setGeneratedGroups(prev => prev.map(g => ({
      ...g,
      rounds: source.rounds,
      proceeders: source.proceeders,
      limitMatches: source.limitMatches,
      maxMatches: source.maxMatches,
    })));
    setToast('Applied settings to all groups!');
    setTimeout(() => setToast(null), 2500);
  };

  // Helper to generate matches for a group
  const getGroupMatches = (group: typeof generatedGroups[0], groupIdx: number) => {
    const list = group.participants;
    if (list.length < 2) return [];

    const matches: Array<{ home: { id: string; name: string }; away: { id: string; name: string } }> = [];
    const n = list.length;
    const isOdd = n % 2 !== 0;
    const numPlayers = isOdd ? n + 1 : n;
    
    const players = [...list];
    if (isOdd) {
      players.push({ id: 'dummy', name: 'BYE' });
    }

    const rounds = numPlayers - 1;
    const matchesPerRound = numPlayers / 2;

    for (let r = 0; r < rounds; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const homeIdx = (r + m) % (numPlayers - 1);
        let awayIdx = (r + numPlayers - 1 - m) % (numPlayers - 1);
        if (m === 0) {
          awayIdx = numPlayers - 1;
        }

        const home = players[homeIdx];
        const away = players[awayIdx];

        if (home.id !== 'dummy' && away.id !== 'dummy') {
          if (r % 2 === 0) {
            matches.push({ home, away });
          } else {
            matches.push({ home: away, away: home });
          }
        }
      }
    }

    const finalMatches: typeof matches = [];
    const numRounds = Number(group.rounds) || 1;
    for (let r = 1; r <= numRounds; r++) {
      const legMatches = matches.map(m => r % 2 === 0 ? { home: m.away, away: m.home } : m);
      finalMatches.push(...legMatches);
    }
    return finalMatches;
  };

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dateStr);
  };

  const getActiveGroupMatches = (group: typeof generatedGroups[0], groupIdx: number) => {
    const baseMatches = getGroupMatches(group, groupIdx);
    
    return baseMatches.map((m, mIdx) => {
      const key = `${groupIdx}-${mIdx}`;
      const override = matchOverrides[key];
      
      const baseDate = startDate ? new Date(startDate) : new Date('2025-12-06');
      const defaultDate = new Date(baseDate);
      defaultDate.setDate(baseDate.getDate() + groupIdx + mIdx * 2);
      const defaultDateStr = defaultDate.toISOString().split('T')[0];
      
      const defaultVenue = selectedVenues.length > 0 
        ? (venues.find(v => v.id === selectedVenues[0])?.name || 'LE') 
        : 'LE';

      return {
        name: override?.name || `G${groupIdx + 1} Match ${mIdx + 1}`,
        home: override?.home || m.home,
        away: override?.away || m.away,
        date: override?.date || defaultDateStr,
        time: override?.time || startTime,
        duration: override?.duration || Number(matchDuration) || 30,
        venue: override?.venue || defaultVenue,
        court: override?.court || 'Court 1',
        moveSubsMatches: override?.moveSubsMatches || false,
      };
    });
  };

  const handleOpenEditMatch = (groupIdx: number, matchIdx: number, match: any) => {
    setEditingGroupIdx(groupIdx);
    setEditingMatchKey(`${groupIdx}-${matchIdx}`);
    setEditMatchForm({
      name: match.name,
      homeId: match.home.id,
      awayId: match.away.id,
      date: match.date,
      time: match.time,
      duration: match.duration,
      venue: match.venue,
      court: match.court,
      moveSubsMatches: match.moveSubsMatches || false,
    });
    setShowEditMatchModal(true);
  };

  const handleSaveMatchEdit = () => {
    if (!editingMatchKey) return;
    
    const allowedParts = getEditParticipantOptions();
    const newHome = allowedParts.find(p => p.id === editMatchForm.homeId);
    const newAway = allowedParts.find(p => p.id === editMatchForm.awayId);

    if (!newHome || !newAway) {
      setToast('Please select valid participants');
      return;
    }
    if (newHome.id === newAway.id) {
      setToast('A participant cannot play against themselves');
      return;
    }

    setMatchOverrides(prev => ({
      ...prev,
      [editingMatchKey]: {
        name: editMatchForm.name,
        home: newHome,
        away: newAway,
        date: editMatchForm.date,
        time: editMatchForm.time,
        duration: editMatchForm.duration,
        venue: editMatchForm.venue,
        court: editMatchForm.court,
        moveSubsMatches: editMatchForm.moveSubsMatches,
      }
    }));

    setShowEditMatchModal(false);
    setToast('Match updated successfully!');
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${day} ${month} ${year}`;
  };

  const getDayOfWeek = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const getSportIcon = (sName: string) => {
    const name = sName.toLowerCase().replace(/\s+/g, '');
    if (name.includes('tabletennis') || name.includes('pingpong')) {
      return 'assets/icons/sports/color/S_TabletennisColour.svg';
    }
    return 'assets/icons/sports/color/S_TabletennisColour.svg';
  };

  /**
   * Builds the input the backend needs to generate the playoff bracket.
   * Mirrors the shape the in-browser generator used; the actual bracket is
   * now produced server-side via tournamentService.generatePlayoffBracket().
   */
  const buildPlayoffInput = (): PlayoffScheduleInput => {
    const numGroups = isKnockoutOnly
      ? 1
      : generatedGroups.length || Number(numberOfGroups) || 2;
    const proceedersPerGroup = isKnockoutOnly
      ? Number(participants) || 8
      : Math.max(1, ...generatedGroups.map(g => Number(g.proceeders) || 1));

    const defaultVenue = selectedVenues.length > 0
      ? (venues.find(v => v.id === selectedVenues[0])?.name || 'LE')
      : 'LE';

    const fallbackDate = startDate || new Date().toISOString().split('T')[0];

    const allGroupSlots = generatedGroups.flatMap((group, gIdx) =>
      getActiveGroupMatches(group, gIdx).map(m => ({
        date: m.date,
        time: m.time,
        duration: m.duration,
      }))
    );

    const groupEnd = getGroupStageEnd(allGroupSlots, fallbackDate, startTime);
    const breakMins = parseBreakMinutes(breakTime);

    return {
      numGroups,
      proceedersPerGroup,
      seedingOrder: (isGroupKnockout ? playoffSeedingOrder : seedingOrder) as 'TRADITIONAL' | 'SEQUENTIAL' | 'RANDOM',
      thirdPlaceMatch: isGroupKnockout ? playoffThirdPlace : thirdPlace,
      startDate: groupEnd.date,
      startTime: addMinutesToTime(groupEnd.time, breakMins),
      matchDurationMinutes: Number(matchDuration) || 30,
      breakMinutes: breakMins,
      venue: defaultVenue,
      court: 'Court 1',
    };
  };

  /**
   * Fetches the playoff bracket from the backend and caches it in state so the
   * synchronous render/save paths (getPlayoffMatches) can read it.
   */
  const fetchPlayoffDraft = async (): Promise<PlayoffMatchDraft[]> => {
    const draft = await tournamentService.generatePlayoffBracket(buildPlayoffInput());
    setPlayoffDraft(draft);
    return draft;
  };

  /**
   * Applies UI-state post-processing (knockout-only slot→player mapping and
   * manual overrides) on top of the backend-generated bracket draft.
   * Pass `draftOverride` to use a freshly-fetched draft before React state updates.
   */
  const getPlayoffMatches = (draftOverride?: PlayoffMatchDraft[]) => {
    let matches = draftOverride ?? playoffDraft;
    if (isKnockoutOnly && allParticipantOptions.length > 0) {
      matches = matches.map(m => {
        const updated = { ...m };
        const getRankFromSlotId = (id: string) => {
          const match = id.match(/^G\d+-W(\d+)$/);
          return match ? Number(match[1]) : null;
        };

        const homeRank = getRankFromSlotId(m.home.id);
        if (homeRank !== null && homeRank <= allParticipantOptions.length) {
          const player = allParticipantOptions[homeRank - 1];
          updated.home = {
            id: player.id,
            name: player.name,
            flatNumber: player.flatNumber,
          };
        }

        const awayRank = getRankFromSlotId(m.away.id);
        if (awayRank !== null && awayRank <= allParticipantOptions.length) {
          const player = allParticipantOptions[awayRank - 1];
          updated.away = {
            id: player.id,
            name: player.name,
            flatNumber: player.flatNumber,
          };
        }

        return updated;
      });
    }

    return applyPlayoffOverrides(matches, matchOverrides);
  };

  const getEditParticipantOptions = () => {
    if (editingGroupIdx !== -1) {
      return generatedGroups[editingGroupIdx]?.participants || [];
    }

    const placeholders = collectPlayoffPlaceholderOptions(getPlayoffMatches());
    const combined = [...placeholders];
    allParticipantOptions.forEach(opt => {
      if (!combined.some(c => c.id === opt.id)) {
        combined.push(opt);
      }
    });

    return combined;
  };

  const handleClearSchedule = async () => {
    if (!confirm('Clear this schedule? This will reset all generated matches.')) {
      return;
    }

    try {
      // Delete matches from database if config exists
      if (currentConfigId) {
        await tournamentService.deleteMatchesByConfigId(currentConfigId);
        console.log('[Clear Schedule] Deleted matches from DB:', { configId: currentConfigId });
      }

      // Clear UI state
      setScheduleGenerated(false);
      setPlayoffsGenerated(false);
      setGeneratedGroups([]);
      setAllParticipantOptions([]);
      setMatchOverrides({});
      setShowSetup(false);
      setCurrentConfigId(null);

      setToast('✓ Schedule cleared and deleted from database');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error('[Clear Schedule] Error:', err);
      setToast('✗ Clear failed: ' + (err?.message || 'Unknown error'));
      setTimeout(() => setToast(null), 4000);
    }
  };

  const collectAllMatches = (playoffOverride?: PlayoffMatchDraft[]) => {
    const allMatches: any[] = [];
    const eventId = selectedEvent ? Number(selectedEvent) : null;

    if (!eventId) return allMatches;

    // Collect group stage matches
    if (isGroupKnockout) {
      generatedGroups.forEach((group, gIdx) => {
        const matches = getActiveGroupMatches(group, gIdx);
        matches.forEach((match, mIdx) => {
          allMatches.push({
            eventId,
            configId: null, // Will be populated after config is created
            groupName: group.name,
            stage: 'GROUP',
            matchNumber: mIdx + 1,
            homeName: match.home.name,
            homeId: match.home.id,
            awayName: match.away.name,
            awayId: match.away.id,
            matchDate: match.date,
            matchTime: match.time,
            duration: match.duration,
            venue: match.venue,
            court: match.court,
            status: 'SCHEDULED',
          });
        });
      });
    }

    // Collect playoff matches if generated
    if (playoffsGenerated || playoffOverride) {
      const playoffMatches = getPlayoffMatches(playoffOverride);
      playoffMatches.forEach((match: any, idx: number) => {
        allMatches.push({
          eventId,
          configId: null,
          groupName: isGroupKnockout ? 'Playoffs' : match.name,
          stage: isGroupKnockout ? 'PLAYOFF' : 'KNOCKOUT',
          matchNumber: idx + 1,
          homeName: match.home?.name || 'TBD',
          homeId: match.home?.id || null,
          awayName: match.away?.name || 'TBD',
          awayId: match.away?.id || null,
          matchDate: match.date,
          matchTime: match.time,
          duration: match.duration,
          venue: match.venue,
          court: match.court || 'Court 1',
          status: 'SCHEDULED',
        });
      });
    }

    return allMatches;
  };

  const handleSaveDraft = async () => {
    if (!validateScheduleConfig()) {
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setSavingSchedule(true);
    try {
      let configId = currentConfigId;

      // If no config exists yet, create one
      if (!configId) {
        const configData = {
          ...buildScheduleConfigBody(),
          status: 'DRAFT',
        };
        console.log('[Save Draft] Creating new config:', { eventId: configData.eventId, format: configData.tournamentType, status: configData.status });
        const configResult = await tournamentService.createConfig(configData);
        console.log('[Save Draft] Config created:', configResult);
        configId = configResult?.id;

        // Save all matches
        const allMatches = collectAllMatches();
        if (allMatches.length > 0 && configId) {
          const matchesWithConfigId = allMatches.map(m => ({ ...m, configId, status: 'DRAFT' }));
          console.log('[Save Draft] Saving matches:', { configId, matchCount: matchesWithConfigId.length });
          await tournamentService.saveMatchesBulk(configId, matchesWithConfigId);
          console.log('[Save Draft] Matches saved successfully');
          setCurrentConfigId(configId);
        }
      } else {
        // Config exists, just update status to DRAFT
        console.log('[Save Draft] Updating existing config status to DRAFT:', { configId });
        await tournamentService.updateMatchesStatus(configId, 'DRAFT');
        console.log('[Save Draft] Matches status updated to DRAFT');
      }

      // Fetch saved matches from database to verify
      try {
        if (configId) {
          const savedMatches = await tournamentService.getMatchesByConfigId(configId);
          console.log('[Save Draft] Fetched saved matches from database:', { configId, count: savedMatches.length });
        }
      } catch (fetchErr) {
        console.warn('[Save Draft] Failed to fetch saved matches (non-critical):', fetchErr);
      }

      setToast('✓ Draft saved! Matches updated to DRAFT status in database.');
    } catch (err: any) {
      console.error('[Save Draft] Error:', err);
      const message = err?.message || 'Unknown error';
      setToast('✗ Draft save failed: ' + message);
    } finally {
      setSavingSchedule(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleSavePublish = async () => {
    if (!validateScheduleConfig()) {
      setTimeout(() => setToast(null), 4000);
      return;
    }

    if (!confirm('Publish this schedule? Participants will be notified.')) {
      return;
    }

    setSavingSchedule(true);
    try {
      let configId = currentConfigId;

      // If no config exists yet, create one
      if (!configId) {
        const configData = {
          ...buildScheduleConfigBody(),
          status: 'PUBLISHED',
        };
        console.log('[Save Publish] Creating new config:', { eventId: configData.eventId, format: configData.tournamentType, status: configData.status });
        const result = await tournamentService.createConfig(configData);
        console.log('[Save Publish] Config created:', result);
        configId = result?.id;

        // Save all matches
        const allMatches = collectAllMatches();
        if (allMatches.length > 0 && configId) {
          const matchesWithConfigId = allMatches.map(m => ({ ...m, configId, status: 'PUBLISHED' }));
          console.log('[Save Publish] Saving matches:', { configId, matchCount: matchesWithConfigId.length });
          await tournamentService.saveMatchesBulk(configId, matchesWithConfigId);
          console.log('[Save Publish] Matches saved successfully');
          setCurrentConfigId(configId);
        }
      } else {
        // Config exists, just update status to PUBLISHED
        console.log('[Save Publish] Updating existing config status to PUBLISHED:', { configId });
        await tournamentService.updateMatchesStatus(configId, 'PUBLISHED');
        console.log('[Save Publish] Matches status updated to PUBLISHED');
      }

      // Fetch saved matches from database to verify
      try {
        if (configId) {
          const savedMatches = await tournamentService.getMatchesByConfigId(configId);
          console.log('[Save Publish] Fetched saved matches from database:', { configId, count: savedMatches.length });
        }
      } catch (fetchErr) {
        console.warn('[Save Publish] Failed to fetch saved matches (non-critical):', fetchErr);
      }

      setToast('✓ Schedule published! Matches updated to PUBLISHED status. Participants will be notified.');
    } catch (err: any) {
      console.error('[Save Publish] Error:', err);
      const message = err?.message || 'Unknown error';
      setToast('✗ Publish failed: ' + message);
    } finally {
      setSavingSchedule(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDragDropScheduler = () => {
    setToast('Drag & Drop Scheduler — open visual editor to adjust timings and venues');
    setTimeout(() => setToast(null), 3000);
  };

  const showScheduleSaveFooter =
    scheduleGenerated && (isGroupKnockout ? playoffsGenerated : isKnockoutOnly ? playoffsGenerated : true);

  const showKnockoutBracket =
    playoffsGenerated && (isGroupKnockout || isKnockoutOnly);

  const handleOpenEditPlayoffMatch = (match: any) => {
    setEditingGroupIdx(-1);
    setEditingMatchKey(match.id);
    setEditMatchForm({
      name: match.name,
      homeId: match.home.id,
      awayId: match.away.id,
      date: match.date,
      time: match.time,
      duration: match.duration,
      venue: match.venue,
      court: match.court,
      moveSubsMatches: match.moveSubsMatches || false,
    });
    setShowEditMatchModal(true);
  };

  // Reusable styles
  const inputCls = 'w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623] transition-colors [color-scheme:dark]';
  const labelCls = 'block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5';
  const cardCls = 'bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-4 md:p-5';

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl font-medium text-sm bg-[#F5A623] text-black">{toast}</div>
      )}

      {/* Header with title and warning */}
      <div className="bg-[#102a71] border border-[#2a3a5c] rounded-xl p-4 md:p-6 shadow-md">
        <h2 className="text-xl md:text-2xl font-bold text-center tracking-wider mb-4 uppercase">
          <span className="text-[#FFFDFC]">Setup </span>
          <span className="text-[#F5A623]">Schedule</span>
        </h2>

        {/* Warning if players not confirmed */}
        {!allPlayersConfirmed && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg px-4 py-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm">This is a sample schedule and will not be saved. Please finalize participants to save your tournament schedule.</span>
          </div>
        )}
      </div>

      {/* Configuration Form — Hidden when schedule is generated */}
      {!scheduleGenerated && (
      <>
        {/* Event Selection */}
        <div className={cardCls}>
          <label className={labelCls}>Select Sports Event</label>
          <select value={selectedEvent} onChange={e => handleEventChange(e.target.value)} className={inputCls}>
            <option value="">— Select Event —</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.name} ({e.sportName})</option>)}
          </select>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ═══ LEFT: Schedule Configuration ═══ */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-5">
            <Settings className="w-5 h-5 text-[#F5A623]" />
            <h3 className="text-base font-bold text-slate-200">Schedule Configuration</h3>
          </div>

          <div className="space-y-4">
            {/* Format */}
            <div>
              <label className={labelCls}>
                Format <span className="text-red-400">*</span>
                {selectedEvent && <span className="ml-2 normal-case tracking-normal font-normal text-[#F5A623]/60">· from sports_event</span>}
              </label>
              <select
                value={format}
                onChange={e => handleFormatChange(e.target.value)}
                disabled={!!selectedEvent}
                className={`${inputCls} ${selectedEvent ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Schedule Type</option>
                <option value="KNOCKOUT_SINGLE">Knockout (Single Elimination)</option>
                <option value="KNOCKOUT_DOUBLE">Double Elimination</option>
                <option value="ROUND_ROBIN">Round Robin</option>
                <option value="LEAGUE">League</option>
                <option value="GROUP_PLAYOFF">Group Stage + Playoffs</option>
                <option value="CUSTOM">Custom Bracket</option>
              </select>
              {isGroupKnockout && (
                <p className="text-[11px] text-[#F5A623]/80 mt-1.5">
                  Group + Knockout: use Schedule Groups, then Generate Schedule for the knockout bracket.
                </p>
              )}
              {isKnockoutOnly && (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Knockout only: click Generate Schedule to build the elimination bracket (no group stage).
                </p>
              )}
            </div>

            {/* Participants */}
            <div>
              <label className={labelCls}>
                Number of Participants <span className="text-red-400">*</span>
                {selectedEvent && <span className="ml-2 normal-case tracking-normal font-normal text-[#F5A623]/60">· from sports_event_registration</span>}
              </label>
              <input
                type="number"
                min="2"
                max="128"
                value={participants}
                readOnly={!!selectedEvent}
                onChange={e => !selectedEvent && setParticipants(e.target.value)}
                className={`${inputCls} ${selectedEvent ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="Number of Participants"
              />
            </div>

            {/* Number of Groups — only for Group + Knockout */}
            {isGroupKnockout && (
              <div>
                <label className={labelCls}>Number of Groups <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={numberOfGroups}
                  onChange={e => setNumberOfGroups(e.target.value)}
                  className={inputCls}
                  placeholder="Number of Groups"
                />
              </div>
            )}

            {/* Third Place Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Create third place match?</label>
              <button
                onClick={() => setThirdPlace(!thirdPlace)}
                className={`relative w-11 h-6 rounded-full transition-colors ${thirdPlace ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${thirdPlace ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Seeding Order */}
            <div className="text-center">
              <label className={labelCls}>Choose Your Schedule Sequence <span className="text-red-400">*</span></label>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {SEEDING_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${seedingOrder === opt.value ? 'border-[#F5A623]' : 'border-[#2a3a5c]'}`}>
                      {seedingOrder === opt.value && <div className="w-2 h-2 rounded-full bg-[#F5A623]" />}
                    </div>
                    <input type="radio" name="seeding" value={opt.value} checked={seedingOrder === opt.value} onChange={() => setSeedingOrder(opt.value)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Scoring Configuration ═══ */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-[#F5A623]" />
            <h3 className="text-base font-bold text-slate-200">Scoring Configuration</h3>
          </div>

          <div className="space-y-4">
            {/* Standings Table */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Standings/Points Table</label>
              <button
                type="button"
                onClick={openStandingsModal}
                className="text-xs border border-[#F5A623]/40 text-[#F5A623] px-3 py-1.5 rounded-lg hover:bg-[#F5A623]/10 transition-colors font-semibold flex items-center gap-1"
              >
                <Settings className="w-3 h-3" /> Configure Standings
              </button>
            </div>

            {/* Participant Scoring */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Participants Scoring</label>
              <button
                type="button"
                onClick={openParticipantsModal}
                className={`text-xs border px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1 ${
                  participantsScoring.enabled
                    ? 'border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623]/10'
                    : 'border-[#2a3a5c] text-slate-400 hover:border-[#F5A623]/40 hover:text-[#F5A623]'
                }`}
              >
                <Settings className="w-3 h-3" /> {participantsScoring.enabled ? 'Configure' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column: Date & Time + Venue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ═══ LEFT: Date & Time Configuration ═══ */}
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F5A623]" />
              <h3 className="text-base font-bold text-slate-200">Date & Time Configuration</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Date Picker</span>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`relative w-9 h-5 rounded-full transition-colors ${showDatePicker ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showDatePicker ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Start / End Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Schedule Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Schedule End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Start / End Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Matches Start Time <span className="text-red-400">*</span></label>
                <select value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Matches End Time <span className="text-red-400">*</span></label>
                <select value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Duration / Break */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Match Duration (min) <span className="text-red-400">*</span></label>
                <input type="number" min="1" value={matchDuration} onChange={e => setMatchDuration(e.target.value)} className={inputCls} placeholder="30" />
              </div>
              <div>
                <label className={labelCls}>Break Between Matches <span className="text-red-400">*</span></label>
                <select value={breakTime} onChange={e => setBreakTime(e.target.value)} className={inputCls}>
                  {BREAK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Limit Matches Per Day */}
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={limitMatchesPerDay} onChange={e => setLimitMatchesPerDay(e.target.checked)} className="w-4 h-4 accent-[#F5A623] rounded" id="limitPerDay" />
              <label htmlFor="limitPerDay" className="text-sm text-slate-300 cursor-pointer">Limit Participant Matches Per Day</label>
              {limitMatchesPerDay && (
                <input type="number" min="1" max="10" value={maxMatchesPerDay} onChange={e => setMaxMatchesPerDay(e.target.value)} className="w-16 bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623]" />
              )}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Venue Configuration ═══ */}
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#F5A623]" />
              <h3 className="text-base font-bold text-slate-200">Venue Configuration</h3>
            </div>
            <button className="text-xs border border-[#F5A623]/40 text-[#F5A623] px-3 py-1.5 rounded-lg hover:bg-[#F5A623]/10 transition-colors font-semibold flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add/Edit Venue
            </button>
          </div>

          {/* Venue List */}
          <div className="space-y-2 mb-4 max-h-[260px] overflow-y-auto pr-1">
            {venues.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-[#2a3a5c] rounded-lg">No venues found. Add a venue to get started.</div>
            ) : venues.map(v => (
              <div key={v.id} className="border border-[#2a3a5c] rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-3 bg-[#0f1729]/50 cursor-pointer" onClick={() => toggleVenue(v.id)}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${selectedVenues.includes(v.id) ? 'border-[#F5A623] bg-[#F5A623]' : 'border-[#2a3a5c]'}`}>
                    {selectedVenues.includes(v.id) && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-sm font-semibold text-slate-200 flex-1">{v.name}</span>
                  <button onClick={e => { e.stopPropagation(); setExpandedVenue(expandedVenue === v.id ? null : v.id); }} className="text-slate-500 hover:text-slate-300">
                    {expandedVenue === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {expandedVenue === v.id && (
                  <div className="px-4 py-3 bg-[#0f1729]/30 border-t border-[#2a3a5c] text-xs space-y-1.5">
                    {v.city && <div className="flex gap-2"><span className="text-slate-500 w-16">City</span><span className="text-slate-300">: {v.city}</span></div>}
                    {v.area && <div className="flex gap-2"><span className="text-slate-500 w-16">Area</span><span className="text-slate-300">: {v.area}</span></div>}
                    {v.address && <div className="flex gap-2"><span className="text-slate-500 w-16">Address</span><span className="text-slate-300">: {v.address}</span></div>}
                    {v.capacity && <div className="flex gap-2"><span className="text-slate-500 w-16">Capacity</span><span className="text-slate-300">: {v.capacity}</span></div>}
                    {v.mapLink && <a href={v.mapLink} target="_blank" rel="noreferrer" className="text-[#00e5ff] hover:underline inline-flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> View on Map</a>}
                    <div className="pt-1">
                      <button className="text-[11px] border border-[#2a3a5c] text-slate-400 px-2 py-1 rounded hover:border-[#F5A623] hover:text-[#F5A623] transition-colors flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Edit Venue Timing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Venue/Court Assign Type */}
          <div className="text-center">
            <label className={labelCls}>Venue/Court Assign Type <span className="text-red-400">*</span></label>
            <div className="flex justify-center gap-1 mt-2">
              {VENUE_ASSIGN_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setVenueAssignType(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${venueAssignType === opt ? 'bg-[#F5A623] text-black shadow-md' : 'bg-[#0f1729] border border-[#2a3a5c] text-slate-400 hover:border-slate-500'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Generate — Group+Knockout: Schedule Groups first; Knockout-only / others: Generate Schedule */}
      {!scheduleGenerated && format && (
        <div className="text-center pt-2 pb-4">
          <button
            onClick={isGroupKnockout ? handleScheduleGroups : handleGenerate}
            disabled={generating || (isGroupKnockout && Number(numberOfGroups) < 2)}
            className="px-5 py-2 bg-[#F5A623] hover:bg-[#e09212] text-black font-bold rounded-lg transition-all text-xs tracking-wider disabled:opacity-50 shadow-md shadow-[#F5A623]/10 cursor-pointer"
          >
            {generating
              ? (isGroupKnockout ? 'Scheduling Groups...' : 'Generating...')
              : (isGroupKnockout ? 'Schedule Groups' : 'Generate Schedule')}
          </button>
          {isGroupKnockout && Number(numberOfGroups) < 2 && (
            <p className="text-xs text-amber-400 mt-2">Group + Knockout requires at least 2 groups.</p>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
           GENERATED SCHEDULE VIEW
         ═══════════════════════════════════════════════════════════════ */}
      {scheduleGenerated && (
        <div className="space-y-5">

          {/* Hide Setup Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setScheduleGenerated(false);
              }}
              className="px-4 py-1.5 border border-[#F5A623]/40 text-[#F5A623] text-xs font-semibold rounded-full hover:bg-[#F5A623]/10 transition-colors inline-flex items-center gap-1"
            >
              Show Setup
            </button>
          </div>

          {/* Sample Schedule Container — Show only when event and format are selected */}
          {selectedEvent && format && !playoffsGenerated && (
          <div className="border border-dashed border-[#F5A623]/40 rounded-xl bg-[#0f1729]/30 px-3 py-4 pb-4 relative">

            {/* Group Cards Container — Group + Knockout only */}
            {isGroupKnockout && (
            <div className="flex flex-col mt-4 gap-4">
              <div className="flex flex-wrap gap-4 justify-center">
                {generatedGroups.map((group, gIdx) => (
                  <div key={group.name} className="bg-[#142347] border border-[#2a437e]/60 rounded-xl overflow-hidden w-[18rem] shadow-lg flex flex-col">
                    <div className="bg-[#F5A623] text-slate-950 text-center py-2 text-xs font-black tracking-wider uppercase">
                      {group.name}
                    </div>
                    <div className="p-3">
                      <table className="table-auto text-center border-collapse w-full">
                        <tbody>
                          {/* Participant List */}
                          <tr>
                            <td>
                              <div className="flex flex-col gap-2.5 mb-3">
                                {group.participants.map((p, pIdx) => (
                                  <div key={p.id + pIdx} className="flex items-center w-full gap-2">
                                    <GripVertical className="w-4 h-4 text-slate-500 shrink-0 cursor-move" />
                                    <select
                                      value={p.id}
                                      onChange={e => updateParticipantInGroup(gIdx, pIdx, e.target.value)}
                                      className="flex-1 bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623] transition-colors"
                                    >
                                      {allParticipantOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}{opt.flatNumber ? ` (${opt.flatNumber})` : ''}</option>
                                      ))}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>

                          {/* Group Configuration */}
                          <tr>
                            <td className="text-left">
                              <div className="flex flex-col gap-3 border border-[#2a437e]/40 rounded-lg p-3 bg-[#0f1729]/30">
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-slate-400">Number of Rounds</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={group.rounds}
                                    onChange={e => updateGroupConfig(gIdx, 'rounds', e.target.value)}
                                    placeholder="Number of Rounds"
                                    className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623] transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-slate-400">Number of Proceeders</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={group.proceeders}
                                    onChange={e => updateGroupConfig(gIdx, 'proceeders', e.target.value)}
                                    className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623] transition-colors"
                                  />
                                  {isGroupKnockout && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setToast(`Select Proceeders modal opened for ${group.name}!`);
                                        setTimeout(() => setToast(null), 3000);
                                      }}
                                      className="mt-2 w-full py-1.5 border border-[#F5A623]/40 text-[#F5A623] text-xs font-semibold rounded-lg hover:bg-[#F5A623]/10 transition-colors cursor-pointer text-center"
                                    >
                                      Select Proceeders
                                    </button>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1 mt-4">
                                  <div className="flex gap-2 items-center justify-between">
                                    <label className="text-xs font-medium text-slate-400">Limit Per Participant Matches?</label>
                                    <button
                                      type="button"
                                      onClick={() => updateGroupConfig(gIdx, 'limitMatches', !group.limitMatches)}
                                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${group.limitMatches ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
                                    >
                                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${group.limitMatches ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                    </button>
                                  </div>
                                  {group.limitMatches && (
                                    <input
                                      type="number"
                                      min="1"
                                      value={group.maxMatches}
                                      onChange={e => updateGroupConfig(gIdx, 'maxMatches', e.target.value)}
                                      className="w-full mt-1 bg-[#0f1729] border border-[#2a3a5c] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623] transition-colors"
                                      placeholder="Max matches per participant"
                                    />
                                  )}
                                </div>
                                {gIdx === 0 && generatedGroups.length > 1 && (
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#2a3a5c]">
                                    <label className="text-xs font-medium text-slate-400">Apply Changes To All Groups</label>
                                    <button
                                      type="button"
                                      onClick={() => applyToAllGroups(0)}
                                      className="px-3 py-1 border border-[#F5A623]/40 text-[#F5A623] text-xs font-semibold rounded-lg hover:bg-[#F5A623]/10 transition-colors"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Playoffs Configuration - Third Place & Seeding Sequence */}
              <div className="flex flex-col gap-4 mt-4 items-center">
                  {/* Create Third Place Match Toggle */}
                  <div className="flex gap-4 items-center">
                    <label htmlFor="createPlayoffThirdPlace" className="text-sm text-slate-300">Create third place match ?</label>
                    <button
                      type="button"
                      id="createPlayoffThirdPlace"
                      onClick={() => setPlayoffThirdPlace(!playoffThirdPlace)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${playoffThirdPlace ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${playoffThirdPlace ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {/* Choose Playoffs Schedule Sequence */}
                  <div className="flex flex-col gap-4 items-center justify-center">
                    <label className="text-sm text-slate-300">
                      <span>Choose Playoffs Schedule Sequence</span>
                      <span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <div className="flex flex-wrap gap-4 justify-center items-center">
                      {SEEDING_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${playoffSeedingOrder === opt.value ? 'border-[#F5A623]' : 'border-[#2a3a5c]'}`}>
                            {playoffSeedingOrder === opt.value && <div className="w-2 h-2 rounded-full bg-[#F5A623]" />}
                          </div>
                          <input type="radio" name="playoffSeeding" value={opt.value} checked={playoffSeedingOrder === opt.value} onChange={() => setPlayoffSeedingOrder(opt.value)} className="sr-only" />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

              {/* Step 2: Generate playoff schedule (Group + Knockout only) */}
              {!playoffsGenerated && (
                <div className="flex flex-col mt-4 items-center gap-2">
                  <p className="text-xs text-slate-400 text-center max-w-md">
                    Group matches are scheduled. Set proceeders per group, then generate the knockout bracket.
                  </p>
                  <button
                    onClick={handleGeneratePlayoffs}
                    disabled={generating}
                    className="px-5 py-2 bg-[#F5A623] hover:bg-[#e09212] text-black font-bold rounded-lg transition-all text-xs tracking-wider disabled:opacity-50 shadow-md shadow-[#F5A623]/10 cursor-pointer"
                  >
                    {generating ? 'Generating...' : 'Generate Schedule'}
                  </button>
                </div>
              )}
            </div>
            )}

          </div>
          )}

          {/* Group stage match fixtures — Group + Knockout only */}
          {isGroupKnockout && (
          <div className="flex flex-col gap-6 mt-6">
            {generatedGroups.map((group, gIdx) => {
              const matches = getActiveGroupMatches(group, gIdx);
              if (matches.length === 0) return null;

              // Resolve event information
              const ev = events.find(e => e.id.toString() === selectedEvent);
              const sportName = ev?.sportName || 'Table Tennis';

              // Using component-level getSportIcon

              return (
                <div key={'fixtures-' + group.name} className="flex flex-col gap-3">
                  <div className="flex justify-between gap-3">
                    <div className="flex text-left">
                      <h3 className="text-lg font-bold text-slate-200">{group.name}</h3>
                    </div>
                    <div className="flex gap-2 justify-end"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matches.map((match, mIdx) => {
                      const matchDate = parseLocalDate(match.date);

                      return (
                        <div key={mIdx} className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl overflow-hidden relative pt-1 shadow-md hover:border-[#F5A623]/40 transition-colors">
                          {/* Top Status Bar (green line) */}
                          <div className="w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-500" />

                          {/* Top Tag Overlapping */}
                          <div className="flex justify-center -mt-3.5 mb-2 relative z-10">
                            <div className="flex items-center gap-1.5 px-3 py-0.5 bg-gradient-to-r from-emerald-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity">
                              <img height="14" width="14" className="rounded-none shrink-0" alt={sportName} title={sportName} src={getSportIcon(sportName)} />
                              <span className="px-1">G{gIdx + 1} Match {mIdx + 1}</span>
                            </div>
                          </div>

                          {/* Date & Time Header */}
                          <div className="flex flex-col gap-1 px-3.5 py-2 text-xs text-slate-400 border-b border-[#2a3a5c]/40 bg-[#0f1729]/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <i className="pi pi-calendar text-[#F5A623] text-sm"></i>
                                <span className="font-bold text-slate-200">{formatDate(matchDate)}</span>
                                <div className="w-px h-3 bg-[#2a3a5c] mx-1" />
                                <span>{getDayOfWeek(matchDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <i className="pi pi-clock text-[#F5A623]"></i>
                                <span className="font-bold text-slate-200">{match.time}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400/80">
                              <i className="pi pi-map-marker text-[#F5A623]"></i>
                              <span>{match.venue}</span>
                              <span className="text-[#F5A623] font-semibold"> - {match.court}</span>
                            </div>
                          </div>

                          {/* Players VS Content */}
                          <div className="p-3.5 flex flex-col justify-between h-[calc(100%-6.5rem)]">
                            <div className="flex items-center justify-between bg-[#0f1729]/40 rounded-lg p-2.5 border border-[#2a3a5c]/40">
                              {/* Home Team */}
                              <div className="flex items-center gap-2.5 w-[42%]">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-[#2a3a5c] overflow-hidden flex items-center justify-center shrink-0">
                                  <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col truncate">
                                  <span className="text-xs font-bold text-slate-200 truncate" title={match.home.name}>{match.home.name}</span>
                                  {match.home.flatNumber && <span className="text-[10px] text-slate-400 truncate">{match.home.flatNumber}</span>}
                                </div>
                              </div>

                              {/* VS Badge */}
                              <div className="flex justify-center w-[16%]">
                                <span className="text-[10px] bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded font-bold border border-[#F5A623]/20">VS</span>
                              </div>

                              {/* Away Team */}
                              <div className="flex items-center justify-end gap-2.5 w-[42%]">
                                <div className="flex flex-col items-end truncate">
                                  <span className="text-xs font-bold text-slate-200 truncate text-right" title={match.away.name}>{match.away.name}</span>
                                  {match.away.flatNumber && <span className="text-[10px] text-slate-400 truncate text-right">{match.away.flatNumber}</span>}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-[#2a3a5c] overflow-hidden flex items-center justify-center shrink-0">
                                  <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                              </div>
                            </div>

                            {/* Card Actions */}
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2a3a5c]/30">
                              <div className="text-[11px] text-slate-400">
                                Status: <span className="text-emerald-400 font-semibold">Scheduled</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMatch(gIdx, mIdx, match)}
                                  className="px-2.5 py-1 border border-[#F5A623]/40 text-[#F5A623] text-xs font-semibold rounded-lg hover:bg-[#F5A623]/10 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setToast('This is a sample schedule. Finalize participants to schedule matches.')}
                                  className="px-2.5 py-1 border border-[#2a3a5c] text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Settings className="w-3 h-3" /> Actions
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Knockout bracket — after Generate Schedule (group+KO step 2) or Knockout-only */}
          {showKnockoutBracket && (
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex gap-2 justify-between items-center">
                <div className="flex text-left items-center">
                  <p className="text-lg font-semibold text-slate-200">
                    {isKnockoutOnly ? 'Knockout Bracket' : 'Playoffs'}
                  </p>
                </div>
                <div className="flex gap-4 justify-end items-center"></div>
              </div>
              {isGroupKnockout && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <i className="pi pi-info-circle text-amber-500"></i>
                  <span>
                    Knockout bracket requires 2 proceeders per group (2 groups → Semi-Final 1, Semi-Final 2, then Final).
                    Use Select Proceeders on each group after group matches, or set Number of Proceeders to 2 before Generate Schedule.
                  </span>
                </p>
              )}

              {(() => {
                const playoffMatches = getPlayoffMatches();
                if (playoffMatches.length === 0) return null;
                return (
                  <PlayoffBracketView
                    matches={playoffMatches}
                    onEditMatch={handleOpenEditPlayoffMatch}
                  />
                );
              })()}
            </div>
          )}

          {showScheduleSaveFooter && (
            <ScheduleSaveFooter
              canSave={true}
              saving={savingSchedule}
              onClear={handleClearSchedule}
              onSaveDraft={handleSaveDraft}
              onSavePublish={handleSavePublish}
              onDragDropScheduler={handleDragDropScheduler}
            />
          )}
        </div>
      )}

      {showEditMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl w-full max-w-[40rem] flex flex-col shadow-2xl relative my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a3a5c] shrink-0">
              <h4 className="text-2xl font-bold text-slate-200">
                <span className="pr-1.5 text-slate-400 font-normal">Edit</span>| {editMatchForm.name || 'Match'}
              </h4>
              <button
                type="button"
                onClick={() => setShowEditMatchModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a3a5c]">
              <div className="flex flex-col gap-4">
                
                {/* Avatars VS Section */}
                <div className="flex flex-row justify-between items-center py-2">
                  <div className="flex justify-center w-[45%]">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-[#2a3a5c] overflow-hidden flex items-center justify-center shadow-lg">
                      <img
                        src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media"
                        alt="Participant 1 Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center text-center w-[10%]">
                    <div className="text-center font-bold text-xl text-[#F5A623] tracking-wider drop-shadow-md">VS</div>
                  </div>
                  <div className="flex justify-center w-[45%]">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-[#2a3a5c] overflow-hidden flex items-center justify-center shadow-lg">
                      <img
                        src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media"
                        alt="Participant 2 Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Participant Dropdowns */}
                <div className="flex flex-col md:flex-row gap-4 items-center w-full">
                  <div className="w-full">
                    <label className={labelCls}>Participant 1 <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.homeId}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, homeId: e.target.value }))}
                      className={inputCls}
                    >
                      {getEditParticipantOptions().map(p => (
                        <option key={p.id} value={p.id}>{p.name}{(p as any).flatNumber ? ` (${(p as any).flatNumber})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className={labelCls}>Participant 2 <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.awayId}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, awayId: e.target.value }))}
                      className={inputCls}
                    >
                      {getEditParticipantOptions().map(p => (
                        <option key={p.id} value={p.id}>{p.name}{(p as any).flatNumber ? ` (${(p as any).flatNumber})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Match Name & Date */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Match Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="Match name"
                      value={editMatchForm.name}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, name: e.target.value }))}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Date <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      value={editMatchForm.date}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, date: e.target.value }))}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                {/* Duration & Time */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Match Duration (In Minutes) <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Match duration"
                      value={editMatchForm.duration}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Time <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.time}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, time: e.target.value }))}
                      className={inputCls}
                      required
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Venue & Court */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Venue <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.venue}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, venue: e.target.value }))}
                      className={inputCls}
                      required
                    >
                      <option value="LE">LE</option>
                      {venues.map(v => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Court <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.court}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, court: e.target.value }))}
                      className={inputCls}
                      required
                    >
                      <option value="Court 1">Court 1</option>
                      <option value="Court 2">Court 2</option>
                      <option value="Court 3">Court 3</option>
                      <option value="Court 4">Court 4</option>
                    </select>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-2.5 py-1">
                  <input
                    type="checkbox"
                    id="moveSubsMatchesEdit"
                    checked={editMatchForm.moveSubsMatches}
                    onChange={e => setEditMatchForm(prev => ({ ...prev, moveSubsMatches: e.target.checked }))}
                    className="w-4 h-4 accent-[#F5A623] rounded cursor-pointer shrink-0"
                  />
                  <label htmlFor="moveSubsMatchesEdit" className="text-xs font-medium text-slate-300 cursor-pointer select-none">
                    Delay/Advance subsequent matches on this court for the day.
                  </label>
                </div>

                {/* Court Timings Info Box */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Court Timings</label>
                  <div className="border border-[#2a3a5c] rounded-xl bg-[#0f1729]/30">
                    <div className="flex flex-col gap-3 p-3.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Open Time</span>
                          <span className="text-slate-500">:</span>
                          <span className="font-bold text-slate-200">05:00 AM</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Close Time</span>
                          <span className="text-slate-500">:</span>
                          <span className="font-bold text-slate-200">08:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#2a3a5c] shrink-0 bg-[#0f1729]/50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowEditMatchModal(false)}
                className="px-4 py-2 border border-[#2a3a5c] hover:border-slate-500 rounded-lg text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMatchEdit}
                className="px-5 py-2 bg-[#F5A623] hover:bg-[#e09212] text-black font-bold rounded-lg text-sm transition-colors shadow-lg shadow-[#F5A623]/10"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showStandingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl w-full max-w-[50rem] flex flex-col shadow-2xl relative my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a3a5c] shrink-0">
              <h3 className="text-xl font-bold text-slate-200">Standings Configuration</h3>
              <button
                type="button"
                onClick={() => setShowStandingsModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a3a5c]">

              {/* Pts Win / Draw / Loss */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Pts Win <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={modalNormalWin}
                    onChange={e => setModalNormalWin(e.target.value)}
                    className={inputCls}
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className={labelCls}>Pts Draw <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={modalTiePoints}
                    onChange={e => setModalTiePoints(e.target.value)}
                    className={inputCls}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className={labelCls}>Pts Loss <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={modalNormalLoss}
                    onChange={e => setModalNormalLoss(e.target.value)}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 1. Points System */}
              <div className="space-y-4">
                <h6 className="text-base font-bold text-[#F5A623] border-b border-[#2a3a5c]/50 pb-2">Points System</h6>
                
                {/* Allow variable point system toggle */}
                <div className="flex items-center justify-between bg-[#0f1729]/50 border border-[#2a3a5c] rounded-lg p-4">
                  <div className="space-y-1 pr-4">
                    <label className="text-sm font-semibold text-slate-200">Allow variable point system?</label>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F5A623]"></span>
                      Enable match scorer to assign variable points for different win types; if disabled, only normal victory points can be assigned.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAllowVariablePoints(!modalAllowVariablePoints)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalAllowVariablePoints ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalAllowVariablePoints ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Win Types Table */}
                <div className="overflow-x-auto border border-[#2a3a5c] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f1729] border-b border-[#2a3a5c] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Winning Type</th>
                        <th className="px-4 py-3 w-36">Win</th>
                        <th className="px-4 py-3 w-36">Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a3a5c] text-sm bg-[#141c2e]">
                      {/* Convincing Victory */}
                      <tr className="hover:bg-[#0f1729]/20 transition-colors">
                        <td className="px-4 py-3 text-slate-300 font-medium">Convincing Victory</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!modalAllowVariablePoints}
                            value={modalConvincingWin}
                            onChange={e => setModalConvincingWin(e.target.value)}
                            className="w-28 bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623] disabled:opacity-40 disabled:cursor-not-allowed"
                            placeholder="Points"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!modalAllowVariablePoints}
                            value={modalConvincingLoss}
                            onChange={e => setModalConvincingLoss(e.target.value)}
                            className="w-28 bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623] disabled:opacity-40 disabled:cursor-not-allowed"
                            placeholder="Points"
                          />
                        </td>
                      </tr>
                      {/* Normal Victory */}
                      <tr className="hover:bg-[#0f1729]/20 transition-colors">
                        <td className="px-4 py-3 text-slate-300 font-medium">Normal Victory</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={modalNormalWin}
                            onChange={e => setModalNormalWin(e.target.value)}
                            className="w-28 bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623]"
                            placeholder="Points"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={modalNormalLoss}
                            onChange={e => setModalNormalLoss(e.target.value)}
                            className="w-28 bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623]"
                            placeholder="Points"
                          />
                        </td>
                      </tr>
                      {/* Marginal Victory */}
                      <tr className="hover:bg-[#0f1729]/20 transition-colors">
                        <td className="px-4 py-3 text-slate-300 font-medium">Marginal Victory</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!modalAllowVariablePoints}
                            value={modalMarginalWin}
                            onChange={e => setModalMarginalWin(e.target.value)}
                            className="w-28 bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623] disabled:opacity-40 disabled:cursor-not-allowed"
                            placeholder="Points"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!modalAllowVariablePoints}
                            value={modalMarginalLoss}
                            onChange={e => setModalMarginalLoss(e.target.value)}
                            className="w-28 bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623] disabled:opacity-40 disabled:cursor-not-allowed"
                            placeholder="Points"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Draw and Custom Points list */}
                <div className="overflow-x-auto border border-[#2a3a5c] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-[#2a3a5c] text-sm bg-[#141c2e]">
                      <tr className="hover:bg-[#0f1729]/20 transition-colors">
                        <td className="px-4 py-3.5 text-slate-300 font-medium">Let user give custom points</td>
                        <td className="px-4 py-3.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setModalCustomPoints(!modalCustomPoints)}
                            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalCustomPoints ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalCustomPoints ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#0f1729]/20 transition-colors">
                        <td className="px-4 py-3 text-slate-300 font-medium">
                          Tie/Drawn Points <span className="text-red-400">*</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            required
                            value={modalTiePoints}
                            onChange={e => setModalTiePoints(e.target.value)}
                            className="w-36 bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623]"
                            placeholder="Tie Points"
                          />
                        </td>
                      </tr>
                      <tr className="hover:bg-[#0f1729]/20 transition-colors">
                        <td className="px-4 py-3 text-slate-300 font-medium">
                          No-Result Points <span className="text-red-400">*</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            required
                            value={modalNoResultPoints}
                            onChange={e => setModalNoResultPoints(e.target.value)}
                            className="w-36 bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623]"
                            placeholder="No-Result Points"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Standings Display Settings */}
              <div className="space-y-3">
                <h6 className="text-base font-bold text-[#F5A623] border-b border-[#2a3a5c]/50 pb-2">Standings Display Settings</h6>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F5A623]"></span>
                  Enabling will display the parameters in the standings table.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#2a3a5c] border border-[#2a3a5c] rounded-lg overflow-hidden">
                  {displayParams.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3.5 bg-[#141c2e] hover:bg-[#1e293b]/20 transition-colors">
                      <span className="text-sm font-medium text-slate-300">{label}</span>
                      <button
                        type="button"
                        onClick={() => toggleDisplaySetting(key)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalDisplaySettings[key] ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalDisplaySettings[key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Additional Parameters */}
              <div className="space-y-3">
                <h6 className="text-base font-bold text-[#F5A623] border-b border-[#2a3a5c]/50 pb-2">Additional Parameters</h6>
                
                <div className="overflow-x-auto border border-[#2a3a5c] rounded-lg bg-[#141c2e]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f1729] border-b border-[#2a3a5c] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Point Name</th>
                        <th className="px-4 py-3">Point Short Name</th>
                        <th className="px-4 py-3 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a3a5c] text-sm">
                      {modalAdditionalParams.map((param) => (
                        <tr key={param.id} className="hover:bg-[#0f1729]/20 transition-colors">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.name}
                              onChange={e => updateAdditionalParam(param.id, 'name', e.target.value)}
                              className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623]"
                              placeholder="Points"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.shortName}
                              onChange={e => updateAdditionalParam(param.id, 'shortName', e.target.value)}
                              className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623]"
                              placeholder="Point Short name"
                              required
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => deleteAdditionalParam(param.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Entry row */}
                      <tr className="bg-[#0f1729]/30">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={newParamName}
                            onChange={e => setNewParamName(e.target.value)}
                            className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623]"
                            placeholder="Points"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={newParamShortName}
                            onChange={e => setNewParamShortName(e.target.value)}
                            className="w-full bg-[#0f1729] border border-[#2a3a5c] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-[#F5A623]"
                            placeholder="Point Short name"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={addAdditionalParam}
                            className="p-1.5 text-[#F5A623] hover:text-[#e09212] hover:bg-[#F5A623]/10 rounded transition-colors"
                            title="Add Parameter"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#2a3a5c] shrink-0 bg-[#0f1729]/50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowStandingsModal(false)}
                className="px-4 py-2 border border-[#2a3a5c] hover:border-slate-500 rounded-lg text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStandings}
                className="px-5 py-2 bg-[#F5A623] hover:bg-[#e09212] text-black font-bold rounded-lg text-sm transition-colors shadow-lg shadow-[#F5A623]/10"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showParticipantsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl w-full max-w-[50rem] flex flex-col shadow-2xl relative my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a3a5c] shrink-0">
              <h3 className="text-xl font-bold text-slate-200">Participants Scoring Workflow</h3>
              <button
                type="button"
                onClick={() => setShowParticipantsModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a3a5c]">
              
              {/* Alert box */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-dashed border-blue-500/40 text-blue-400 p-4 rounded-xl">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
                <span className="text-sm font-semibold text-slate-200">
                  You Are Giving Access To Participants To Score Their Matches For This Event/Division/Class.
                </span>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                
                {/* 1. Score And Send For Admin Approval */}
                <div className="flex items-center justify-between gap-4 p-4 bg-[#0f1729]/50 border border-[#2a3a5c] rounded-lg">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-sm text-slate-200">Score And Send For Admin Approval</h5>
                    <p className="text-xs text-slate-400">
                      Once the scores are entered and saved, it will be sent to the tournament administrator for approval. Only upon approval will the points and standings be updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAdminApproval(!modalAdminApproval)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalAdminApproval ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalAdminApproval ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* 2. Score And Publish */}
                <div className="flex items-center justify-between gap-4 p-4 bg-[#0f1729]/50 border border-[#2a3a5c] rounded-lg">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-sm text-slate-200">Score And Publish</h5>
                    <p className="text-xs text-slate-400">
                      The participant who scores the match can enter and self-approve the match scores. Once approved, points are awarded and standings are updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalCanPublish(!modalCanPublish)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalCanPublish ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalCanPublish ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* 3. Score And Send For Admin/Opponent Approval */}
                <div className="flex items-center justify-between gap-4 p-4 bg-[#0f1729]/50 border border-[#2a3a5c] rounded-lg">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-sm text-slate-200">Score And Send For Admin/Opponent Approval</h5>
                    <p className="text-xs text-slate-400">
                      Both participants have to agree to the score. The scorer enters the score, and it is sent for the opponent's approval. Only upon approval will the points and standings be updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpponentApproval(!modalOpponentApproval)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalOpponentApproval ? 'bg-[#F5A623]' : 'bg-[#2a3a5c]'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalOpponentApproval ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Note / bottom information */}
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300">Note: </span>
                  This will overwrite match level participants scoring. Also, only participants who have registered for this tournament can score their matches. Participants who have been added by the administrator, need to claim their profile before being able to use playerScoring.
                </p>

                <div className="space-y-1 pt-1">
                  <h5 className="text-[#00e5ff] font-bold text-sm hover:underline cursor-pointer">
                    Participants Added by the tournament admins need to claim to score matches
                  </h5>
                  <h5 className="text-[#00e5ff] font-bold text-sm hover:underline cursor-pointer">
                    You can set match level scoring type
                  </h5>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-[#2a3a5c] shrink-0 bg-[#0f1729]/50 rounded-b-xl">
              <div className="flex justify-start"></div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowParticipantsModal(false)}
                  className="px-4 py-2 border border-[#2a3a5c] hover:border-slate-500 rounded-lg text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveParticipants}
                  className="px-5 py-2 bg-[#F5A623] hover:bg-[#e09212] text-black font-bold rounded-lg text-sm transition-colors shadow-lg shadow-[#F5A623]/10 flex items-center gap-1.5"
                >
                  <span>Pay & Enable</span>
                  <span className="opacity-50 text-xs">|</span>
                  <span>₹850</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
