import { Undo2, FileText, CircleCheckBig, LayoutGrid } from 'lucide-react';

const SCHEDULER_IMAGE_URL =
  'https://firebasestorage.googleapis.com/v0/b/playingadev.appspot.com/o/default%2FScheduler.png?alt=media';

type Props = {
  canSave: boolean;
  saving?: boolean;
  onClear: () => void;
  onSaveDraft: () => void;
  onSavePublish: () => void;
  onDragDropScheduler: () => void;
};

export function ScheduleSaveFooter({
  canSave,
  saving = false,
  onClear,
  onSaveDraft,
  onSavePublish,
  onDragDropScheduler,
}: Props) {
  return (
    <div className="py-4 mt-4 border-t border-[#2a3a5c]/60">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 md:gap-4 items-center justify-center -mx-3 flex-wrap">
          <button
            type="button"
            onClick={onClear}
            disabled={saving}
            className="flex gap-1 text-sm font-semibold items-center text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={!canSave || saving}
            className="flex gap-1 text-sm font-semibold items-center px-4 py-2 rounded-lg border border-[#2a3a5c] text-slate-300 hover:border-[#c8ff00]/40 hover:text-[#c8ff00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#2a3a5c] disabled:hover:text-slate-300"
          >
            <FileText className="w-4 h-4" />
            <span>Save As Draft</span>
          </button>

          <button
            type="button"
            onClick={onSavePublish}
            disabled={!canSave || saving}
            className="flex gap-1 text-sm font-semibold items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
          >
            <CircleCheckBig className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>

        <div className="hidden md:block bg-[#0f1729] border border-[#2a3a5c] rounded-xl overflow-hidden p-2">
          <div className="flex gap-5 items-center justify-center py-2">
            <div className="border border-[#c8ff00]/50 rounded-xl overflow-hidden shrink-0">
              <img
                src={SCHEDULER_IMAGE_URL}
                alt="Scheduler"
                className="w-[4.5rem] h-12 lg:w-36 lg:h-24 object-cover"
              />
            </div>
            <p className="text-xs text-slate-400 capitalize max-w-xs">
              Use our visual editor to update Schedule timings &amp; venues
            </p>
            <button
              type="button"
              onClick={onDragDropScheduler}
              className="flex gap-1 text-sm font-semibold items-center px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black transition-colors shrink-0"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Drag &amp; Drop Scheduler</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
