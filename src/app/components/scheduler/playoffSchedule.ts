// Playoff ("rounds to final") bracket TYPES and UI-side helpers.
//
// NOTE: The bracket GENERATION algorithm (buildPlayoffBracket and friends) now
// lives in the backend — PlayoffScheduleGenerator.java, exposed via
// POST /api/tournament/playoff/generate (tournamentService.generatePlayoffBracket).
// This file keeps only the shared types and the UI-state helpers that build the
// generate request and post-process the returned draft (overrides, placeholders).

export type PlayoffSeedingOrder = 'TRADITIONAL' | 'SEQUENTIAL' | 'RANDOM';

export type PlayoffParticipantRef = {
  id: string;
  name: string;
  flatNumber?: string;
};

export type PlayoffRoundType = 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL' | 'THIRD_PLACE';

export type PlayoffMatchDraft = {
  id: string;
  name: string;
  round: PlayoffRoundType;
  roundIndex: number;
  home: PlayoffParticipantRef;
  away: PlayoffParticipantRef;
  date: string;
  time: string;
  duration: number;
  venue: string;
  court: string;
  moveSubsMatches: boolean;
};

export type PlayoffScheduleInput = {
  numGroups: number;
  proceedersPerGroup: number;
  seedingOrder: PlayoffSeedingOrder;
  thirdPlaceMatch: boolean;
  startDate: string;
  startTime: string;
  matchDurationMinutes: number;
  breakMinutes: number;
  venue: string;
  court: string;
};

export function parseBreakMinutes(breakTime: string): number {
  const match = breakTime.match(/(\d+)/);
  return match ? Number(match[1]) : 10;
}

export function parseTime12h(time: string): { hours: number; minutes: number } {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { hours: 8, minutes: 0 };
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const meridiem = m[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

export function formatTime12h(hours: number, minutes: number): string {
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  let h = hours % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const { hours, minutes } = parseTime12h(time);
  const total = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(total / 60) % 24;
  const newMinutes = total % 60;
  return formatTime12h(newHours, newMinutes);
}

export type GroupMatchSlot = { date: string; time: string; duration: number };

/** Latest group-stage slot end (date + time + duration). Feeds the playoff start. */
export function getGroupStageEnd(
  groupMatches: GroupMatchSlot[],
  fallbackDate: string,
  fallbackTime: string
): { date: string; time: string } {
  if (groupMatches.length === 0) {
    return { date: fallbackDate, time: fallbackTime };
  }

  let best: GroupMatchSlot = groupMatches[0];
  let bestKey = -1;

  for (const m of groupMatches) {
    const { hours, minutes } = parseTime12h(m.time);
    const endMinutes = hours * 60 + minutes + (m.duration || 30);
    const key = new Date(m.date).getTime() * 10000 + endMinutes;
    if (key > bestKey) {
      bestKey = key;
      best = m;
    }
  }

  return {
    date: best.date,
    time: addMinutesToTime(best.time, best.duration || 30),
  };
}

export function applyPlayoffOverrides(
  matches: PlayoffMatchDraft[],
  overrides: Record<string, Partial<PlayoffMatchDraft>>
): PlayoffMatchDraft[] {
  return matches.map(m => {
    const o = overrides[m.id];
    if (!o) return m;
    return {
      ...m,
      ...o,
      home: o.home || m.home,
      away: o.away || m.away,
    };
  });
}

export function collectPlayoffPlaceholderOptions(matches: PlayoffMatchDraft[]): PlayoffParticipantRef[] {
  const seen = new Set<string>();
  const list: PlayoffParticipantRef[] = [];
  const add = (p: PlayoffParticipantRef) => {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      list.push(p);
    }
  };
  for (const m of matches) {
    add(m.home);
    add(m.away);
  }
  return list;
}