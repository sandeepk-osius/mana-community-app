import { useState } from "react";
import { Loader2, Mail, Bell, MessageSquare, X, CheckCircle2 } from "lucide-react";

export interface RegistrationNotifConfig {
  sendEmail: boolean;
  sendPush: boolean;
  sendSms: boolean;
  message: string;
}

interface RegistrationOpenModalProps {
  tournament: { id: number; name: string };
  onConfirm: (config: RegistrationNotifConfig) => Promise<void>;
  onClose: () => void;
}

export function RegistrationOpenModal({ tournament, onConfirm, onClose }: RegistrationOpenModalProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [message, setMessage] = useState(
    `Registration for ${tournament.name} is now open! Sign up now to secure your spot.`
  );
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm({ sendEmail, sendPush, sendSms, message });
    } catch {
      // parent handles error toast; keep modal open for retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!submitting ? onClose : undefined}
      />
      <div className="relative bg-[#141c2e] border border-[#2a3a5c] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#f1f5f9]">Open for Registration</h2>
            <p className="text-sm text-[#64748b] mt-0.5">{tournament.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-[#475569] hover:text-[#f1f5f9] transition-colors ml-4 flex-shrink-0 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status info banner */}
        <div className="flex items-start gap-2.5 bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg p-3 mb-5">
          <CheckCircle2 className="w-4 h-4 text-[#10b981] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#10b981]">
            Status will change to <strong>REGISTRATION OPEN</strong> and notifications will be sent
            to all community users on the selected channels below.
          </p>
        </div>

        {/* Notification message */}
        <div className="mb-4">
          <label className="text-xs text-[#94a3b8] uppercase tracking-widest font-medium block mb-1.5">
            Notification Message
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            disabled={submitting}
            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:border-[#f97316] outline-none resize-none transition-colors disabled:opacity-50"
          />
        </div>

        {/* Channel toggles */}
        <div className="mb-6">
          <div className="text-xs text-[#94a3b8] uppercase tracking-widest font-medium mb-2.5">
            Notification Channels
          </div>
          <div className="space-y-2">
            <ChannelRow
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              sublabel="Send email to all community users"
              checked={sendEmail}
              onChange={setSendEmail}
              activeColor="blue"
              disabled={submitting}
            />
            <ChannelRow
              icon={<Bell className="w-4 h-4" />}
              label="Push Notification"
              sublabel="In-app and mobile push alerts"
              checked={sendPush}
              onChange={setSendPush}
              activeColor="orange"
              disabled={submitting}
            />
            <ChannelRow
              icon={<MessageSquare className="w-4 h-4" />}
              label="SMS / WhatsApp"
              sublabel="Text message to registered phone numbers"
              checked={sendSms}
              onChange={setSendSms}
              activeColor="green"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 border border-[#2a3a5c] text-[#94a3b8] text-sm font-medium rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Open for Registration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Channel toggle row ───────────────────────────────────────────────────────

interface ChannelRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeColor: "blue" | "orange" | "green";
  disabled?: boolean;
}

const colorClasses = {
  blue:   { border: "border-[#3b82f6]/30", bg: "bg-[#3b82f6]/5",  text: "text-[#3b82f6]",  toggle: "bg-[#3b82f6]"  },
  orange: { border: "border-[#f97316]/30", bg: "bg-[#f97316]/5",  text: "text-[#f97316]",  toggle: "bg-[#f97316]"  },
  green:  { border: "border-[#10b981]/30", bg: "bg-[#10b981]/5",  text: "text-[#10b981]",  toggle: "bg-[#10b981]"  },
};

function ChannelRow({ icon, label, sublabel, checked, onChange, activeColor, disabled }: ChannelRowProps) {
  const c = colorClasses[activeColor];
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? `${c.border} ${c.bg}` : "border-[#1e293b] bg-[#0c1220]"}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`${checked ? c.text : "text-[#475569]"} flex-shrink-0 transition-colors`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-medium transition-colors ${checked ? "text-[#f1f5f9]" : "text-[#475569]"}`}>
            {label}
          </div>
          <div className="text-[10px] text-[#475569] truncate">{sublabel}</div>
        </div>
      </div>
      {/* Toggle pill */}
      <div className={`relative w-11 h-6 rounded-full flex-shrink-0 ml-3 transition-colors ${checked ? c.toggle : "bg-[#1e293b]"}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}
