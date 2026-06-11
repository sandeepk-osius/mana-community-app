import { Pencil } from 'lucide-react';
import type { PlayoffMatchDraft, PlayoffParticipantRef } from './playoffSchedule';
import './PlayoffBracketView.css';

const DEFAULT_AVATAR =
  'https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media';

type Props = {
  matches: PlayoffMatchDraft[];
  onEditMatch?: (match: PlayoffMatchDraft) => void;
};

function formatBracketDateOnly(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = Number(parts[2]);
  const month = months[Number(parts[1]) - 1] || parts[1];
  return `${day} ${month}`;
}

function findParentMatchId(participantId: string, prevRoundMatches: PlayoffMatchDraft[]): string | undefined {
  if (participantId.endsWith('-winner')) {
    return participantId.replace('-winner', '');
  }
  if (participantId.endsWith('-loser')) {
    return participantId.replace('-loser', '');
  }
  const parentMatch = prevRoundMatches.find(
    pm => pm.home.id === participantId || pm.away.id === participantId
  );
  return parentMatch?.id;
}

function isPlaceholder(id: string, name: string): boolean {
  return (
    id.includes('-') ||
    id.startsWith('G') ||
    id === 'bye' ||
    name === 'BYE' ||
    /\b(winner|loser)\b/i.test(name) ||
    /group\s+\d+/i.test(name)
  );
}

function ParticipantRow({ participant }: { participant: PlayoffParticipantRef }) {
  const { id, name, flatNumber } = participant;
  const isPlace = isPlaceholder(id, name);
  const isBye = id === 'bye' || name === 'BYE';

  return (
    <div className={`flex flex-row gap-2 py-1 pl-3 pr-1.5 items-center relative min-h-[32px] bg-[#142347] border border-[#2a437e]/40 rounded-lg overflow-hidden ${isBye ? 'opacity-50' : ''}`}>
      {/* Left green accent bar, mimicking the image team box style */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600" />
      
      <div className="flex flex-row shrink-0">
        {isBye ? (
          <div className="w-5 h-5 rounded-full bg-slate-850 border border-dashed border-slate-650 flex items-center justify-center text-[7px] font-bold text-slate-500">
            BYE
          </div>
        ) : isPlace ? (
          <div className="w-5 h-5 rounded-full bg-slate-800 border border-[#2a3a5c] flex items-center justify-center text-[7px] font-bold text-slate-400" title={name}>
            WI
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full overflow-hidden border border-[#2a3a5c] bg-slate-800 shrink-0">
            <img src={DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0 text-left leading-tight">
        <p className={`text-[10.5px] font-bold capitalize truncate ${isBye ? 'text-slate-400 italic' : 'text-slate-200'}`} title={name}>
          {name}
        </p>
        {!isPlace && flatNumber && (
          <span className="text-[8px] text-slate-400 truncate mt-0.5">{flatNumber}</span>
        )}
      </div>
    </div>
  );
}

type MatchCardProps = {
  match: PlayoffMatchDraft;
  top: number;
  showConnector?: boolean;
  connectorTop?: number;
  connectorHeight?: number;
  showMergerRight?: boolean;
  showMergerLeft?: boolean;
  onEdit?: () => void;
};

function MatchCard({
  match,
  top,
  showConnector = false,
  connectorTop = 0,
  connectorHeight = 180,
  showMergerRight = false,
  showMergerLeft = false,
  onEdit,
}: MatchCardProps) {
  return (
    <div
      className="matchup absolute transition-all duration-700 ease-in-out"
      id={`WB-match-${match.id}`}
      style={{ top }}
    >
      <div className="relative flex flex-row items-center justify-between py-1 pr-6 min-h-[26px]">
        <div className="font-bold text-[10px] uppercase tracking-wider whitespace-nowrap flex items-center gap-1 text-[#FFFDFC]">
          <span>{formatBracketDateOnly(match.date)}</span>
          <span className="opacity-40">|</span>
          <span>{match.time}</span>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="absolute top-0.5 -right-1 z-10 w-6 h-6 rounded-full bg-[#1a2540] border border-[#2a3a5c] text-slate-300 hover:text-[#F5A623] hover:border-[#F5A623]/50 flex items-center justify-center shadow-md transition-colors cursor-pointer"
            aria-label="Edit Match"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="relative flex items-stretch">
        <div className="flex flex-col gap-1 w-full">
          <ParticipantRow participant={match.home} />
          <ParticipantRow participant={match.away} />
        </div>
        {showConnector && (
          <div 
            className="connector" 
            style={{ 
              height: connectorHeight, 
              transform: `translateY(${connectorTop}px)` 
            }} 
            aria-hidden 
          />
        )}
        {showMergerRight && <div className="merger-right" style={{ width: 20 }} aria-hidden />}
        {showMergerLeft && <div className="merger-left" style={{ width: 20 }} aria-hidden />}
      </div>

      <div className="flex flex-row gap-3 justify-between items-center mt-1">
        <span className="font-bold text-[#fffdf0] text-[11px] line-clamp-1">{match.venue}</span>
        <span className="font-bold text-[#fffdf0] text-[11px] line-clamp-1">{match.court}</span>
      </div>
    </div>
  );
}

function getRoundHeader(roundName: string): string {
  if (roundName === 'FINAL') return 'Finals';
  if (roundName === 'SEMI_FINAL') return 'Semi-Finals';
  if (roundName === 'QUARTER_FINAL') return 'Quarter-Finals';
  return roundName;
}

function ResultsColumn({ finalMatchId, top }: { finalMatchId?: string; top: number }) {
  return (
    <section className="px-2 relative shrink-0" id="round-results" style={{ width: 278, height: '100%' }}>
      <div className="flex flex-row gap-2 items-center justify-center bg-[#102a71] p-1.5 rounded-md">
        <h5 className="text-xs font-bold text-slate-200">Results</h5>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: top + 40 }}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 items-center">
            <div className="flex flex-col gap-1 opacity-60 items-center">
              <p className="text-sm font-semibold text-slate-300">Winner</p>
              <TrophyIcon className="w-14 h-14 text-slate-500" />
            </div>
            <div className="flex flex-row gap-1 items-center opacity-60" id={finalMatchId}>
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#2a3a5c]">
                <img src={DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-bold text-slate-200">Winner Of Final</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <div className="flex flex-col gap-1 opacity-60 items-center">
              <p className="text-sm font-semibold text-slate-300">Runner-up</p>
              <TrophyIcon className="w-14 h-14 text-slate-500" />
            </div>
            <div className="flex flex-row gap-1 items-center opacity-60">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#2a3a5c]">
                <img src={DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-bold text-slate-200">Loser Of Final</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PlayoffBracketView({ matches, onEditMatch }: Props) {
  if (matches.length === 0) return null;

  const bracketMatches = matches.filter(m => m.round !== 'THIRD_PLACE');
  const thirdPlace = matches.filter(m => m.round === 'THIRD_PLACE');
  const roundIndices = Array.from(new Set(bracketMatches.map(m => m.roundIndex))).sort((a, b) => a - b);

  // Group matches by round index
  const roundsMatches: Record<number, PlayoffMatchDraft[]> = {};
  roundIndices.forEach(rIndex => {
    roundsMatches[rIndex] = bracketMatches.filter(m => m.roundIndex === rIndex);
  });

  // Calculate match positions (tops)
  const matchTops: Record<string, number> = {};
  const baseSpacing = 160;

  const firstRoundIdx = roundIndices[0];
  const firstRoundMatches = roundsMatches[firstRoundIdx] || [];
  const M0 = firstRoundMatches.length;

  // 1. Initialize first round tops
  firstRoundMatches.forEach((m, idx) => {
    matchTops[m.id] = 40 + idx * baseSpacing;
  });

  // 2. Iteratively calculate tops for subsequent rounds
  for (let i = 1; i < roundIndices.length; i++) {
    const rIndex = roundIndices[i];
    const prevRoundIndex = roundIndices[i - 1];
    const prevMatches = roundsMatches[prevRoundIndex] || [];
    const rMatches = roundsMatches[rIndex] || [];
    
    rMatches.forEach((m, idx) => {
      const homeParentId = findParentMatchId(m.home.id, prevMatches);
      const awayParentId = findParentMatchId(m.away.id, prevMatches);

      const homeTop = homeParentId ? matchTops[homeParentId] : undefined;
      const awayTop = awayParentId ? matchTops[awayParentId] : undefined;

      if (homeTop !== undefined && awayTop !== undefined) {
        matchTops[m.id] = (homeTop + awayTop) / 2;
      } else if (homeTop !== undefined) {
        matchTops[m.id] = homeTop + (baseSpacing * Math.pow(2, i - 1)) / 2;
      } else if (awayTop !== undefined) {
        matchTops[m.id] = awayTop + (baseSpacing * Math.pow(2, i - 1)) / 2;
      } else {
        matchTops[m.id] = 40 + idx * baseSpacing * Math.pow(2, i);
      }
    });
  }

  // Calculate bracket container height dynamically
  const bracketHeight = Math.max(505, 40 + M0 * baseSpacing + 60);

  // Find final match
  const lastRoundIdx = roundIndices[roundIndices.length - 1];
  const finalMatch = (roundsMatches[lastRoundIdx] || [])[0];
  const finalMatchTop = finalMatch ? (matchTops[finalMatch.id] ?? 160) : 160;

  return (
    <div className="playoff-bracket flex flex-col">
      <div className="relative">
        <div 
          className="bracket py-6 relative flex flex-row rounded-xl bg-[#141c2e]/30 border border-[#2a3a5c]"
          style={{ height: bracketHeight }}
        >
          {roundIndices.map((rIndex, colIdx) => {
            const rMatches = roundsMatches[rIndex] || [];
            if (rMatches.length === 0) return null;
            const roundName = rMatches[0].round;
            const header = getRoundHeader(roundName);
            const isLastRound = colIdx === roundIndices.length - 1;

            return (
              <section 
                key={rIndex} 
                className="px-2 relative shrink-0" 
                style={{ minWidth: 278, height: '100%' }}
              >
                <div className="flex flex-row gap-2 items-center bg-[#102a71] p-1.5 rounded-md justify-center">
                  <h5 className="text-xs font-bold text-slate-200">{header}</h5>
                </div>
                {rMatches.map((m, idx) => {
                  const top = matchTops[m.id] ?? (40 + idx * baseSpacing);
                  
                  let showConnector = false;
                  let connectorHeight = 0;
                  let connectorTop = 0;

                  if (colIdx > 0) {
                    const prevRoundIdx = roundIndices[colIdx - 1];
                    const prevMatches = roundsMatches[prevRoundIdx] || [];
                    const homeParentId = findParentMatchId(m.home.id, prevMatches);
                    const awayParentId = findParentMatchId(m.away.id, prevMatches);

                    const homeTop = homeParentId ? matchTops[homeParentId] : undefined;
                    const awayTop = awayParentId ? matchTops[awayParentId] : undefined;

                    if (homeTop !== undefined && awayTop !== undefined) {
                      showConnector = true;
                      connectorHeight = Math.abs(awayTop - homeTop);
                      connectorTop = Math.min(homeTop, awayTop) - top;
                    } else if (homeTop !== undefined) {
                      showConnector = true;
                      connectorHeight = Math.abs(homeTop - top);
                      connectorTop = Math.min(homeTop, top) - top;
                    } else if (awayTop !== undefined) {
                      showConnector = true;
                      connectorHeight = Math.abs(awayTop - top);
                      connectorTop = Math.min(awayTop, top) - top;
                    }
                  }

                  return (
                    <MatchCard
                      key={m.id}
                      match={m}
                      top={top}
                      showConnector={showConnector}
                      connectorTop={connectorTop}
                      connectorHeight={connectorHeight}
                      showMergerRight={!isLastRound}
                      showMergerLeft={colIdx > 0}
                      onEdit={onEditMatch ? () => onEditMatch(m) : undefined}
                    />
                  );
                })}
              </section>
            );
          })}

          {finalMatch && (
            <ResultsColumn finalMatchId={finalMatch.id} top={finalMatchTop} />
          )}

          {thirdPlace.length > 0 && (
            <section className="px-2 relative shrink-0" style={{ minWidth: 278, height: '100%' }}>
              <div className="flex flex-row gap-2 items-center bg-[#102a71] p-1.5 rounded-md justify-center">
                <h5 className="text-xs font-bold text-slate-200">Third Place</h5>
              </div>
              {thirdPlace.map((m, idx) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  top={finalMatchTop + 180 + idx * baseSpacing}
                  onEdit={onEditMatch ? () => onEditMatch(m) : undefined}
                />
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
      <path
        d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM5 4H3v2a4 4 0 004 4M19 4h2v2a4 4 0 01-4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
