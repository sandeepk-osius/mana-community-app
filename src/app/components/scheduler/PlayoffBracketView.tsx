import { Pencil } from 'lucide-react';
import type { PlayoffMatchDraft } from './playoffSchedule';
import './PlayoffBracketView.css';

const DEFAULT_AVATAR =
  'https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media';

type Props = {
  matches: PlayoffMatchDraft[];
  onEditMatch?: (match: PlayoffMatchDraft) => void;
};

function formatBracketDate(dateStr: string, time: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return `${dateStr} | ${time}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = Number(parts[2]);
  const month = months[Number(parts[1]) - 1] || parts[1];
  return `${day} ${month} | ${time}`;
}

function isAdvancingWinnerPlaceholder(name: string): boolean {
  return /\(winner\)/i.test(name) || /winner\s+of\s+semi/i.test(name) || /winner\s+of\s+final/i.test(name);
}

function ParticipantRow({ name }: { name: string }) {
  const showImage = isAdvancingWinnerPlaceholder(name);

  return (
    <div className="flex flex-row gap-1 p-2 items-center relative">
      <div className="flex flex-row shrink-0">
        {showImage ? (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#2a3a5c] bg-slate-800">
            <img src={DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-[#2a3a5c] flex items-center justify-center text-[10px] font-bold text-slate-400">
            WI
          </div>
        )}
      </div>
      <p className="text-xs text-slate-200 font-semibold capitalize line-clamp-1">{name}</p>
    </div>
  );
}

type MatchCardProps = {
  match: PlayoffMatchDraft;
  top: number;
  showConnector?: boolean;
  connectorHeight?: number;
  showMergerRight?: boolean;
  showMergerLeft?: boolean;
  onEdit?: () => void;
};

function MatchCard({
  match,
  top,
  showConnector = false,
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
      <div className="relative flex flex-row items-center justify-between py-1 pr-6">
        <h6 className="text-slate-100 text-sm font-semibold mr-1">{match.name}</h6>
        <p className="font-medium text-slate-400 text-xs whitespace-nowrap">
          {formatBracketDate(match.date, match.time)}
        </p>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="absolute top-1 -right-1 z-10 w-7 h-7 rounded-full bg-[#1a2540] border border-[#2a3a5c] text-slate-300 hover:text-[#c8ff00] hover:border-[#c8ff00]/50 flex items-center justify-center shadow-md transition-colors"
            aria-label={`Edit ${match.name}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-stretch">
        <div className="relative border border-[#2a3a5c] bg-[#0f1729] min-h-[100px] w-full">
          <ParticipantRow name={match.home.name} />
          <div className="border-b border-[#2a3a5c] my-px" />
          <ParticipantRow name={match.away.name} />
        </div>
      </div>

      <div className="flex flex-row gap-3 justify-between items-center mt-1">
        <span className="font-normal text-slate-400 text-xs line-clamp-1">{match.venue}</span>
        <span className="font-medium text-slate-400 text-xs line-clamp-1">{match.court}</span>
      </div>

      {showConnector && (
        <div className="connector" style={{ height: connectorHeight }} aria-hidden />
      )}
      {showMergerRight && <div className="merger-right" style={{ width: 24 }} aria-hidden />}
      {showMergerLeft && <div className="merger-left" style={{ width: 24 }} aria-hidden />}
    </div>
  );
}

function ResultsColumn({ finalMatchId }: { finalMatchId?: string }) {
  return (
    <section className="px-2 relative shrink-0" id="round-results" style={{ width: 278, height: 480 }}>
      <div className="flex flex-row gap-2 items-center justify-center bg-[#0f1729] p-2 rounded-md">
        <h5 className="font-semibold text-slate-200">Results</h5>
      </div>
      <div className="mt-8 relative top-[45%] -translate-y-[45%]">
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
  const quarters = matches.filter(m => m.round === 'QUARTER_FINAL');
  const semis = matches.filter(m => m.round === 'SEMI_FINAL');
  const finals = matches.filter(m => m.round === 'FINAL');
  const thirdPlace = matches.filter(m => m.round === 'THIRD_PLACE');
  const finalMatch = finals[0];

  if (matches.length === 0) return null;

  const semiTops = [70, 250];

  return (
    <div className="playoff-bracket flex flex-col">
      <div className="relative">
        <div className="bracket py-6 relative flex flex-row overflow-y-hidden rounded-xl bg-[#141c2e]/30 border border-[#2a3a5c]">
          {quarters.length > 0 && (
            <section className="px-2 relative shrink-0" style={{ minWidth: 278, height: 480 }}>
              <div className="flex flex-row gap-2 items-center bg-[#0f1729] p-2 rounded-md justify-center">
                <h5 className="text-sm font-semibold text-slate-200">Quarter-Finals</h5>
              </div>
              {quarters.map((m, idx) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  top={idx % 2 === 0 ? 40 + idx * 90 : 40 + idx * 90}
                  showConnector={idx % 2 === 0}
                  connectorHeight={160}
                  showMergerRight
                  onEdit={onEditMatch ? () => onEditMatch(m) : undefined}
                />
              ))}
            </section>
          )}

          {semis.length > 0 && (
            <section className="px-2 relative shrink-0" style={{ minWidth: 278, height: 480 }}>
              <div className="flex flex-row gap-2 items-center bg-[#0f1729] p-2 rounded-md justify-center">
                <h5 className="text-sm font-semibold text-slate-200">Semi-Finals</h5>
              </div>
              {semis.map((m, idx) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  top={semiTops[idx] ?? 70 + idx * 180}
                  showConnector={idx === 0}
                  connectorHeight={180}
                  showMergerRight
                  onEdit={onEditMatch ? () => onEditMatch(m) : undefined}
                />
              ))}
            </section>
          )}

          {finalMatch && (
            <section className="px-2 relative shrink-0" style={{ minWidth: 278, height: 480 }}>
              <div className="flex flex-row gap-2 items-center bg-[#0f1729] p-2 rounded-md justify-center">
                <h5 className="text-sm font-semibold text-slate-200">Finals</h5>
              </div>
              <MatchCard
                match={finalMatch}
                top={160}
                showMergerLeft
                onEdit={onEditMatch ? () => onEditMatch(finalMatch) : undefined}
              />
            </section>
          )}

          {finalMatch && <ResultsColumn finalMatchId={finalMatch.id} />}

          {thirdPlace.length > 0 && (
            <section className="px-2 relative shrink-0" style={{ minWidth: 278, height: 480 }}>
              <div className="flex flex-row gap-2 items-center bg-[#0f1729] p-2 rounded-md justify-center">
                <h5 className="text-sm font-semibold text-slate-200">Third Place</h5>
              </div>
              {thirdPlace.map((m, idx) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  top={160 + idx * 200}
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
