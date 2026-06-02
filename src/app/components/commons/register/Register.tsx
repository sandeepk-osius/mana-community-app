import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { ShieldCheck, Info, Loader2, AlertTriangle } from "lucide-react";
import { sportsService } from "../../../../services/sportsService";
import { useAuth } from "../../../../contexts/AuthContext";
import type { SportMeta } from "../../../../types/api";

type FormValues = {
  name: string;
  sportId: string;
  eventDateStart: string;
  eventDateEnd: string;
  venue: string;
  maxParticipants: string;
  format: string;
  tournamentType: string;
  terms: boolean;
};

export function Register() {
  const { user } = useAuth();
  const [sportsMeta, setSportsMeta] = useState<SportMeta[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { format: "TEAM", tournamentType: "KNOCKOUT" },
  });

  useEffect(() => {
    sportsService
      .getSportsMeta()
      .then(setSportsMeta)
      .catch((err) => setMetaError(err instanceof Error ? err.message : "Failed to load sports"))
      .finally(() => setLoadingMeta(false));
  }, []);

  const onSubmit = async (data: FormValues) => {
    if (!user?.communityId) {
      toast.error("Community not found. Please log in again.");
      return;
    }
    try {
      await sportsService.createEvent({
        name: data.name,
        sportId: Number(data.sportId),
        communityId: user.communityId,
        eventDateStart: data.eventDateStart,
        eventDateEnd: data.eventDateEnd,
        venueId: undefined, // Register.tsx needs update to select venueId
        maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : undefined,
        format: data.format || undefined,
        tournamentType: data.tournamentType || undefined,
      } as any);
      toast.success(`Event "${data.name}" created successfully!`, {
        description: "Participants can now register for the event.",
      });
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Toaster position="top-center" richColors />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Create Sports Event</h1>
        <p className="text-slate-500 mt-2">Schedule a new sports event for your community.</p>
      </div>

      {metaError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{metaError}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex items-start gap-4">
          <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 mt-1">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-900">Event Registration Info</h3>
            <p className="text-sm text-emerald-700 mt-1">
              After creating the event, community members can register via the Sports schedule page.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Event Details</h3>

            <div>
              <label htmlFor="event-name" className="block text-sm font-medium text-slate-700 mb-1">Event Name *</label>
              <input
                id="event-name"
                type="text"
                {...register("name", { required: "Event name is required" })}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Summer Basketball Championship 2026"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-sport" className="block text-sm font-medium text-slate-700 mb-1">Sport *</label>
                {loadingMeta ? (
                  <div className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading sports...
                  </div>
                ) : (
                  <select
                    id="event-sport"
                    {...register("sportId", { required: "Sport is required" })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select a sport</option>
                    {sportsMeta.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
                {errors.sportId && <p className="text-red-500 text-xs mt-1">{errors.sportId.message}</p>}
              </div>

              <div>
                <label htmlFor="event-venue" className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
                <input
                  id="event-venue"
                  type="text"
                  {...register("venue")}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Main Gym – Court 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-start" className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                <input
                  id="event-start"
                  type="date"
                  {...register("eventDateStart", { required: "Start date is required" })}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {errors.eventDateStart && <p className="text-red-500 text-xs mt-1">{errors.eventDateStart.message}</p>}
              </div>
              <div>
                <label htmlFor="event-end" className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                <input
                  id="event-end"
                  type="date"
                  {...register("eventDateEnd", { required: "End date is required" })}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {errors.eventDateEnd && <p className="text-red-500 text-xs mt-1">{errors.eventDateEnd.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="event-max" className="block text-sm font-medium text-slate-700 mb-1">Max Participants</label>
                <input
                  id="event-max"
                  type="number"
                  min={2}
                  {...register("maxParticipants")}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="16"
                />
              </div>
              <div>
                <label htmlFor="event-format" className="block text-sm font-medium text-slate-700 mb-1">Match Format</label>
                <select id="event-format" {...register("format")} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="TEAM">Team</option>
                  <option value="SINGLES">Singles</option>
                  <option value="DOUBLES">Doubles</option>
                  <option value="MIXED_DOUBLES">Mixed Doubles</option>
                </select>
              </div>
              <div>
                <label htmlFor="event-tournament" className="block text-sm font-medium text-slate-700 mb-1">Tournament Type</label>
                <select id="event-tournament" {...register("tournamentType")} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="KNOCKOUT">Knockout</option>
                  <option value="ROUND_ROBIN">Round Robin</option>
                  <option value="LEAGUE">League</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                {...register("terms", { required: "You must agree to the terms" })}
                className="mt-1 w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-600 leading-tight">
                I confirm that all event details are accurate and comply with community guidelines. *
              </span>
            </label>
            {errors.terms && <p className="text-red-500 text-xs mt-1 ml-7">{errors.terms.message}</p>}
          </div>

          <div className="pt-6">
            <button
              type="submit"
              id="register-event-btn"
              disabled={isSubmitting || loadingMeta}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 font-medium text-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Event...</>
              ) : (
                <><ShieldCheck className="w-5 h-5 mr-2" /> Create Event</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
