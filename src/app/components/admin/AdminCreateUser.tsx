import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  UserPlus,
  ArrowLeft,
  Mail,
  Phone,
  User,
  MapPin,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  Calendar,
  CreditCard,
  Info,
  ChevronDown,
  Hash,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type UserRole = "member" | "vendor" | "admin";

const communities = [
  { code: "APT-TOWER-A-2024", name: "Prestige Lakeside – Tower A", type: "Apartment" },
  { code: "APT-TOWER-B-2024", name: "Prestige Lakeside – Tower B", type: "Apartment" },
  { code: "COL-RVCE-2024", name: "RVCE Alumni Community", type: "College" },
  { code: "SCH-DPS-2024", name: "DPS Bangalore Parents Community", type: "School" },
  { code: "LOC-KORAMANGALA-2024", name: "Koramangala Residents", type: "Local" },
];

const idTypes = ["Aadhaar Card", "PAN Card", "Passport", "Voter ID", "Driver's License"];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  role: UserRole;
  communityCode: string;
  flatUnit: string;
  address: string;
  idType: string;
  idNumber: string;
  password: string;
  sendInvite: boolean;
  bypassKyc: boolean;
  isActive: boolean;
  notes: string;
}

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  role: "member",
  communityCode: "",
  flatUnit: "",
  address: "",
  idType: "",
  idNumber: "",
  password: "",
  sendInvite: true,
  bypassKyc: false,
  isActive: true,
  notes: "",
};

const roleConfig = {
  member: {
    label: "Verified Member",
    desc: "Standard community member with access to all features",
    color: "border-green-300 bg-green-50",
    activeColor: "border-green-500 bg-green-50 ring-2 ring-green-300",
    icon: User,
    iconColor: "text-green-600",
  },
  vendor: {
    label: "Vendor",
    desc: "Can list services/products in the marketplace",
    color: "border-blue-300 bg-blue-50",
    activeColor: "border-blue-500 bg-blue-50 ring-2 ring-blue-300",
    icon: Building2,
    iconColor: "text-blue-600",
  },
  admin: {
    label: "Admin",
    desc: "Full administrative access to manage community",
    color: "border-purple-300 bg-purple-50",
    activeColor: "border-purple-500 bg-purple-50 ring-2 ring-purple-300",
    icon: ShieldCheck,
    iconColor: "text-purple-600",
  },
};

export function AdminCreateUser() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-slate-500 font-medium">Access Denied. Administrative privileges required.</p>
        <button onClick={() => navigate("/")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Go to Feed</button>
      </div>
    );
  }
  const [form, setForm] = useState<FormState>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const update = (field: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep = (s: number) => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (s === 1) {
      if (!form.firstName.trim()) newErrors.firstName = "First name is required";
      if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!form.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email address";
      if (!form.phone.trim()) newErrors.phone = "Phone number is required";
      if (!form.gender) newErrors.gender = "Please select a gender";
    }
    if (s === 2) {
      if (!form.communityCode) newErrors.communityCode = "Please select a community";
    }
    if (s === 3) {
      if (!form.sendInvite && !form.password) newErrors.password = "Set a password or enable invite";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    await new Promise(res => setTimeout(res, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success(`User ${form.firstName} ${form.lastName} created successfully!`);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Toaster position="top-center" richColors />
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">User Created Successfully!</h2>
        <p className="text-slate-500 mb-2">
          <strong>{form.firstName} {form.lastName}</strong> has been added as a{" "}
          <strong className="capitalize">{form.role}</strong>.
        </p>
        {form.sendInvite && (
          <p className="text-sm text-indigo-600 mb-8">
            <Mail className="w-4 h-4 inline mr-1" />
            Invite email sent to <strong>{form.email}</strong>
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => { setForm(initialForm); setIsSuccess(false); setStep(1); }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Create Another User
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const InputField = ({
    label, field, type = "text", placeholder, icon: Icon, required = false
  }: {
    label: string; field: keyof FormState; type?: string; placeholder?: string; icon?: React.ElementType; required?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <input
          type={type}
          value={form[field] as string}
          onChange={e => update(field, e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow",
            Icon ? "pl-9 pr-3" : "px-3",
            errors[field] ? "border-red-400 bg-red-50" : "border-slate-300"
          )}
        />
      </div>
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin")}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-indigo-600" />
            Create New User
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Add a verified user directly to the community</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center">
          {[
            { num: 1, label: "Personal Info" },
            { num: 2, label: "Community & ID" },
            { num: 3, label: "Account Setup" },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  step > s.num ? "bg-green-500 text-white" :
                  step === s.num ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={cn(
                  "text-xs mt-1 font-medium hidden sm:block",
                  step === s.num ? "text-indigo-600" : step > s.num ? "text-green-600" : "text-slate-400"
                )}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2",
                  step > s.num ? "bg-green-400" : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">

        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-slate-900">Personal Information</h2>
              <p className="text-sm text-slate-500 mt-0.5">Basic identity details of the new user</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="First Name" field="firstName" placeholder="e.g. Priya" icon={User} required />
              <InputField label="Last Name" field="lastName" placeholder="e.g. Sharma" required />
              <InputField label="Email Address" field="email" type="email" placeholder="priya@email.com" icon={Mail} required />
              <InputField label="Phone Number" field="phone" type="tel" placeholder="+91 98765 43210" icon={Phone} required />
              <InputField label="Date of Birth" field="dob" type="date" icon={Calendar} />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Gender <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={form.gender}
                    onChange={e => update("gender", e.target.value)}
                    className={cn(
                      "w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white",
                      errors.gender ? "border-red-400" : "border-slate-300"
                    )}
                  >
                    <option value="">Select gender</option>
                    {["Male", "Female", "Non-binary", "Prefer not to say"].map(g => <option key={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">User Role <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.member][]).map(([roleKey, config]) => (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => update("role", roleKey)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      form.role === roleKey ? config.activeColor : `${config.color} hover:brightness-95`
                    )}
                  >
                    <config.icon className={cn("w-5 h-5 mb-2", config.iconColor)} />
                    <p className="text-sm font-semibold text-slate-900">{config.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{config.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Community & ID */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-slate-900">Community & Identity Verification</h2>
              <p className="text-sm text-slate-500 mt-0.5">Assign community and optional ID details</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Community <span className="text-red-500">*</span></label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.communityCode}
                  onChange={e => update("communityCode", e.target.value)}
                  className={cn(
                    "w-full pl-9 pr-8 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white",
                    errors.communityCode ? "border-red-400" : "border-slate-300"
                  )}
                >
                  <option value="">Select a community</option>
                  {communities.map(c => (
                    <option key={c.code} value={c.code}>{c.name} ({c.type})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.communityCode && <p className="text-xs text-red-500 mt-1">{errors.communityCode}</p>}
              {form.communityCode && (
                <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Code: {form.communityCode}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Flat / Unit No." field="flatUnit" placeholder="e.g. Tower A, Apt 402" />
              <div className="sm:col-span-2">
                <InputField label="Full Address" field="address" placeholder="Street, City, State, PIN" icon={MapPin} />
              </div>
            </div>

            {/* ID Section */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-500" />
                <p className="text-sm font-medium text-slate-700">Government ID (Optional for admin creation)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">ID Type</label>
                  <div className="relative">
                    <select
                      value={form.idType}
                      onChange={e => update("idType", e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                    >
                      <option value="">Select ID type</option>
                      {idTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <InputField label="ID Number" field="idNumber" placeholder="e.g. XXXX-XXXX-1234" icon={CreditCard} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Internal Notes</label>
              <textarea
                value={form.notes}
                onChange={e => update("notes", e.target.value)}
                placeholder="Any additional notes about this user (visible only to admins)..."
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Account Setup */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-slate-900">Account Setup</h2>
              <p className="text-sm text-slate-500 mt-0.5">Configure access and account options</p>
            </div>

            {/* Options Toggles */}
            <div className="space-y-3">
              {[
                {
                  key: "sendInvite" as keyof FormState,
                  icon: Send,
                  title: "Send Invite Email",
                  desc: "User will receive a welcome email with login instructions",
                  color: "indigo",
                },
                {
                  key: "bypassKyc" as keyof FormState,
                  icon: ShieldCheck,
                  title: "Bypass KYC Verification",
                  desc: "Mark user as verified without KYC document review",
                  color: "yellow",
                },
                {
                  key: "isActive" as keyof FormState,
                  icon: CheckCircle2,
                  title: "Active Account",
                  desc: "User can immediately access the platform",
                  color: "green",
                },
              ].map(item => {
                const isOn = form[item.key] as boolean;
                return (
                  <div key={item.key} className={cn(
                    "flex items-start justify-between p-4 rounded-xl border transition-colors",
                    isOn ? `bg-${item.color}-50 border-${item.color}-200` : "bg-slate-50 border-slate-200"
                  )}>
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                        isOn ? `bg-${item.color}-100` : "bg-slate-200"
                      )}>
                        <item.icon className={cn("w-4 h-4", isOn ? `text-${item.color}-600` : "text-slate-400")} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => update(item.key, !isOn)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
                        isOn ? "bg-indigo-600" : "bg-slate-300"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow",
                        isOn ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Password (if not sending invite) */}
            {!form.sendInvite && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Temporary Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={e => update("password", e.target.value)}
                    placeholder="Enter temporary password"
                    className={cn(
                      "w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                      errors.password ? "border-red-400" : "border-slate-300"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
            )}

            {/* Summary */}
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
              <p className="text-sm font-semibold text-indigo-900 mb-3">Review Summary</p>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                {[
                  { l: "Name", v: `${form.firstName} ${form.lastName}` },
                  { l: "Email", v: form.email },
                  { l: "Phone", v: form.phone },
                  { l: "Role", v: roleConfig[form.role].label },
                  { l: "Community", v: communities.find(c => c.code === form.communityCode)?.name || "—" },
                  { l: "KYC Status", v: form.bypassKyc ? "Bypassed (Verified)" : "Requires Verification" },
                ].map(item => (
                  <div key={item.l}>
                    <span className="text-indigo-500">{item.l}:</span>
                    <p className="font-medium text-indigo-900 truncate">{item.v || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/admin")}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? "Previous" : "Cancel"}
          </button>

          {step < 3 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              Continue
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-70 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating...</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Create User</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
