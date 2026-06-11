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
            className="flex gap-1 text-xs font-bold items-center bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={!canSave || saving}
            className="flex gap-1 text-xs font-bold items-center px-3 py-1.5 rounded-lg bg-[#1a2540] border border-[#2e3f6e] text-slate-200 hover:border-[#F5A623] hover:text-[#F5A623] hover:bg-[#223154] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#2a3a5c] disabled:hover:text-slate-300 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Save As Draft</span>
          </button>

          <button
            type="button"
            onClick={onSavePublish}
            disabled={!canSave || saving}
            className="flex gap-1 text-xs font-bold items-center px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:hover:text-white cursor-pointer"
          >
            <CircleCheckBig className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>

        <div className="hidden md:block bg-[#0f1729] border border-[#2a3a5c] rounded-xl overflow-hidden p-2">
          <div className="flex gap-5 items-center justify-center py-2">
            <div className="border border-[#F5A623]/50 rounded-xl overflow-hidden shrink-0">
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
              className="flex gap-1 text-xs font-bold items-center px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shrink-0 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Drag &amp; Drop Scheduler</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
