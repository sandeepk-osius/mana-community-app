import { useState, useRef } from "react";
import {
  UserCircle,
  ShieldCheck,
  Edit3,
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Building2,
  Star,
  Trophy,
  Package,
  Briefcase,
  Users,
  Bell,
  Lock,
  Key,
  Monitor,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Globe,
  Link2,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Smartphone,
  Shield,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = "overview" | "activity" | "settings" | "security";

const mockUser = {
  id: "USR-0042",
  fullName: "Alex Johnson",
  email: "alex.johnson@email.com",
  phone: "+91 98765 43210",
  dob: "1992-05-15",
  gender: "Male",
  address: "Tower A, Apt 402, Prestige Lakeside Habitat, Bangalore - 560103",
  bio: "Software Engineer at TechCorp | Cricket enthusiast | Community organizer. Love connecting with neighbours and making our society a better place.",
  role: "admin" as "admin" | "member" | "vendor",
  communityType: "Apartment",
  communityName: "Prestige Lakeside Habitat",
  communityCode: "APT-TOWER-A-2024",
  joinedAt: "2025-11-20",
  kycStatus: "verified" as "verified" | "pending" | "rejected",
  avatar: "https://images.unsplash.com/photo-1707396172424-f3293f788364?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwcm9maWxlJTIwYXZhdGFyJTIwcGVyc29ufGVufDF8fHx8MTc3NzA1ODgxOXww&ixlib=rb-4.1.0&q=80&w=1080",
  cover: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&q=80",
  skills: ["Cricket", "Event Management", "Community Building", "Badminton", "Cooking"],
  stats: {
    posts: 47,
    connections: 128,
    eventsAttended: 14,
    itemsSold: 8,
    jobsPosted: 3,
    sportsPlayed: 22,
  },
};

const activityFeed = [
  { id: 1, type: "post", text: "Posted in Community Feed: 'Reminder: Society AGM this Sunday at 5PM'", time: "2 hours ago", icon: Users, color: "indigo" },
  { id: 2, type: "marketplace", text: "Listed '4-seater dining table' on Marketplace for ₹8,500", time: "1 day ago", icon: Package, color: "emerald" },
  { id: 3, type: "event", text: "Registered for 'Annual Sports Day 2026'", time: "2 days ago", icon: Trophy, color: "yellow" },
  { id: 4, type: "job", text: "Referred a candidate for 'Senior React Developer' at TechCorp", time: "3 days ago", icon: Briefcase, color: "purple" },
  { id: 5, type: "sports", text: "Scored 42 runs in Cricket Tournament – Tower A vs Tower B", time: "5 days ago", icon: Trophy, color: "orange" },
  { id: 6, type: "post", text: "Posted in Community Feed: 'Lost & Found: Black umbrella near pool area'", time: "1 week ago", icon: Users, color: "indigo" },
];

const sessions = [
  { id: 1, device: "Chrome on MacOS", location: "Bangalore, IN", lastActive: "Active now", isCurrent: true },
  { id: 2, device: "Mobile App - iOS", location: "Bangalore, IN", lastActive: "2 hours ago", isCurrent: false },
  { id: 3, device: "Firefox on Windows", location: "Hyderabad, IN", lastActive: "3 days ago", isCurrent: false },
];

export function ProfileDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: mockUser.fullName,
    email: mockUser.email,
    phone: mockUser.phone,
    dob: mockUser.dob,
    gender: mockUser.gender,
    address: mockUser.address,
    bio: mockUser.bio,
  });

  const [notifications, setNotifications] = useState({
    communityPosts: true,
    marketplaceUpdates: true,
    jobAlerts: false,
    eventReminders: true,
    sportsUpdates: true,
    adminAlerts: true,
    emailDigest: false,
    pushNotifications: true,
  });

  const roleConfig = {
    admin: { label: "Admin", color: "bg-purple-100 text-purple-700 border border-purple-200", icon: ShieldCheck },
    member: { label: "Verified Member", color: "bg-green-100 text-green-700 border border-green-200", icon: ShieldCheck },
    vendor: { label: "Vendor", color: "bg-blue-100 text-blue-700 border border-blue-200", icon: ShieldCheck },
  };

  const role = roleConfig[mockUser.role];

  const handleSaveProfile = () => {
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password changed successfully!");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Settings" },
    { id: "security", label: "Security" },
  ];

  return (
    <div className="space-y-0 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      <Toaster position="top-center" richColors />

      {/* Cover Photo */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 overflow-hidden">
        <img
          src={mockUser.cover}
          alt="Cover"
          className="w-full h-full object-cover opacity-40"
        />
        <button className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
          <Camera className="w-3.5 h-3.5" />
          Edit Cover
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20 pb-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-slate-200">
                <img src={mockUser.avatar} alt={mockUser.fullName} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg shadow-md transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
            </div>

            {/* Name & Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{mockUser.fullName}</h1>
                    {mockUser.kycStatus === "verified" && (
                      <span title="KYC Verified">
                        <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold", role.color)}>
                      <role.icon className="w-3 h-3" />
                      {role.label}
                    </span>
                    <span className="text-slate-400 text-sm">#{mockUser.id}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-slate-500 text-sm">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{mockUser.communityName}</span>
                    <span className="text-slate-300">·</span>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Bangalore, IN</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 border-t border-slate-100 -mx-4 sm:-mx-6 lg:-mx-8">
            {[
              { label: "Posts", value: mockUser.stats.posts, icon: Users },
              { label: "Connections", value: mockUser.stats.connections, icon: Link2 },
              { label: "Events", value: mockUser.stats.eventsAttended, icon: Calendar },
              { label: "Listings", value: mockUser.stats.itemsSold, icon: Package },
              { label: "Jobs Posted", value: mockUser.stats.jobsPosted, icon: Briefcase },
              { label: "Sports Played", value: mockUser.stats.sportsPlayed, icon: Trophy },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center py-3 px-2 hover:bg-slate-50 transition-colors cursor-pointer border-r border-slate-100 last:border-r-0">
                <span className="text-xl font-bold text-slate-900">{stat.value}</span>
                <span className="text-xs text-slate-500 mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-0 -mb-px mt-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* About */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-900 mb-3">About</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">{mockUser.bio}</p>
                  <div className="mt-4 space-y-2.5 text-sm">
                    {[
                      { icon: Mail, label: mockUser.email },
                      { icon: Phone, label: mockUser.phone },
                      { icon: MapPin, label: mockUser.address },
                      { icon: Calendar, label: `Joined ${new Date(mockUser.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-slate-600">
                        <item.icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills & Interests */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-900 mb-3">Skills & Interests</h2>
                  <div className="flex flex-wrap gap-2">
                    {mockUser.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-100">
                        {skill}
                      </span>
                    ))}
                    <button className="px-3 py-1 bg-slate-50 text-slate-500 text-sm rounded-full border border-dashed border-slate-300 hover:bg-slate-100 transition-colors">
                      + Add
                    </button>
                  </div>
                </div>

                {/* Recent Activity Preview */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">Recent Activity</h2>
                    <button onClick={() => setActiveTab("activity")} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {activityFeed.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          item.color === "indigo" ? "bg-indigo-100" :
                          item.color === "emerald" ? "bg-emerald-100" :
                          item.color === "yellow" ? "bg-yellow-100" :
                          item.color === "purple" ? "bg-purple-100" : "bg-orange-100"
                        )}>
                          <item.icon className={cn(
                            "w-4 h-4",
                            item.color === "indigo" ? "text-indigo-600" :
                            item.color === "emerald" ? "text-emerald-600" :
                            item.color === "yellow" ? "text-yellow-600" :
                            item.color === "purple" ? "text-purple-600" : "text-orange-600"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 leading-snug">{item.text}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* KYC Status Card */}
                <div className={cn(
                  "rounded-xl border p-5",
                  mockUser.kycStatus === "verified" ? "bg-green-50 border-green-200" :
                  mockUser.kycStatus === "pending" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {mockUser.kycStatus === "verified" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                     mockUser.kycStatus === "pending" ? <Clock className="w-5 h-5 text-yellow-600" /> :
                     <XCircle className="w-5 h-5 text-red-600" />}
                    <span className={cn(
                      "font-semibold text-sm",
                      mockUser.kycStatus === "verified" ? "text-green-800" :
                      mockUser.kycStatus === "pending" ? "text-yellow-800" : "text-red-800"
                    )}>
                      KYC {mockUser.kycStatus === "verified" ? "Verified" : mockUser.kycStatus === "pending" ? "Under Review" : "Rejected"}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs",
                    mockUser.kycStatus === "verified" ? "text-green-700" :
                    mockUser.kycStatus === "pending" ? "text-yellow-700" : "text-red-700"
                  )}>
                    {mockUser.kycStatus === "verified"
                      ? "Your identity has been verified. You have full access to all community features."
                      : mockUser.kycStatus === "pending"
                      ? "Your documents are being reviewed. You'll be notified once verified."
                      : "Your KYC was rejected. Please resubmit with valid documents."}
                  </p>
                  {mockUser.kycStatus !== "verified" && (
                    <button className="mt-3 w-full py-2 px-3 bg-white border border-current text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                      {mockUser.kycStatus === "pending" ? "Check Status" : "Resubmit Documents"}
                    </button>
                  )}
                </div>

                {/* Community Info */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h2 className="font-semibold text-slate-900 mb-3 text-sm">Community Membership</h2>
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{mockUser.communityName}</p>
                      <p className="text-xs text-slate-500">{mockUser.communityCode}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="font-semibold text-slate-900">{mockUser.communityType}</p>
                      <p className="text-slate-500">Type</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="font-semibold text-slate-900">{role.label}</p>
                      <p className="text-slate-500">Role</p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h2 className="font-semibold text-slate-900 mb-3 text-sm">Quick Links</h2>
                  <div className="space-y-1">
                    {[
                      { icon: Package, label: "My Marketplace Listings", count: 5 },
                      { icon: Briefcase, label: "My Job Postings", count: 3 },
                      { icon: Trophy, label: "My Sports Records", count: 12 },
                      { icon: Calendar, label: "My Events", count: 8 },
                    ].map((link) => (
                      <button key={link.label} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <link.icon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{link.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{link.count}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === "activity" && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="px-6 py-4">
                  <h2 className="font-semibold text-slate-900">Activity History</h2>
                  <p className="text-sm text-slate-500 mt-0.5">All your interactions across the community platform</p>
                </div>
                <div className="p-6">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200"></div>
                    <div className="space-y-6">
                      {activityFeed.map((item) => (
                        <div key={item.id} className="relative flex items-start gap-4 pl-12">
                          <div className={cn(
                            "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-white",
                            item.color === "indigo" ? "bg-indigo-100" :
                            item.color === "emerald" ? "bg-emerald-100" :
                            item.color === "yellow" ? "bg-yellow-100" :
                            item.color === "purple" ? "bg-purple-100" : "bg-orange-100"
                          )}>
                            <item.icon className={cn(
                              "w-4 h-4",
                              item.color === "indigo" ? "text-indigo-600" :
                              item.color === "emerald" ? "text-emerald-600" :
                              item.color === "yellow" ? "text-yellow-600" :
                              item.color === "purple" ? "text-purple-600" : "text-orange-600"
                            )} />
                          </div>
                          <div className="flex-1 bg-slate-50 rounded-xl p-4">
                            <p className="text-sm text-slate-800 leading-snug">{item.text}</p>
                            <p className="text-xs text-slate-400 mt-1.5">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Info */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="font-semibold text-slate-900">Personal Information</h2>
                      <p className="text-sm text-slate-500 mt-0.5">Update your personal details</p>
                    </div>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <X className="w-4 h-4" /> Cancel
                        </button>
                        <button onClick={handleSaveProfile} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors">
                          <Save className="w-4 h-4" /> Save
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", key: "fullName", type: "text" },
                      { label: "Email Address", key: "email", type: "email" },
                      { label: "Phone Number", key: "phone", type: "tel" },
                      { label: "Date of Birth", key: "dob", type: "date" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">{field.label}</label>
                        {isEditing ? (
                          <input
                            type={field.type}
                            value={formData[field.key as keyof typeof formData]}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                          />
                        ) : (
                          <p className="text-sm text-slate-900 py-2 px-3 bg-slate-50 rounded-lg">
                            {field.key === "dob" ? new Date(formData.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : formData[field.key as keyof typeof formData]}
                          </p>
                        )}
                      </div>
                    ))}

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Gender</label>
                      {isEditing ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {["Male", "Female", "Non-binary", "Prefer not to say"].map(g => <option key={g}>{g}</option>)}
                        </select>
                      ) : (
                        <p className="text-sm text-slate-900 py-2 px-3 bg-slate-50 rounded-lg">{formData.gender}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Address</label>
                      {isEditing ? (
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                      ) : (
                        <p className="text-sm text-slate-900 py-2 px-3 bg-slate-50 rounded-lg">{formData.address}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Bio</label>
                      {isEditing ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                          maxLength={250}
                        />
                      ) : (
                        <p className="text-sm text-slate-900 py-2 px-3 bg-slate-50 rounded-lg leading-relaxed">{formData.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <h2 className="font-semibold text-slate-900">Notifications</h2>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(notifications).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        communityPosts: "Community Posts",
                        marketplaceUpdates: "Marketplace",
                        jobAlerts: "Job Alerts",
                        eventReminders: "Event Reminders",
                        sportsUpdates: "Sports Updates",
                        adminAlerts: "Admin Alerts",
                        emailDigest: "Weekly Email Digest",
                        pushNotifications: "Push Notifications",
                      };
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{labels[key]}</span>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                            className={cn(
                              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                              value ? "bg-indigo-600" : "bg-slate-200"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow",
                              value ? "translate-x-4.5" : "translate-x-1"
                            )} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => toast.success("Notification preferences saved!")}
                    className="mt-4 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Change Password */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Key className="w-5 h-5 text-slate-600" />
                  <div>
                    <h2 className="font-semibold text-slate-900">Change Password</h2>
                    <p className="text-xs text-slate-500">Use a strong, unique password</p>
                  </div>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {[
                    { label: "Current Password", show: showPassword, toggle: () => setShowPassword(!showPassword) },
                    { label: "New Password", show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword) },
                  ].map((field, idx) => (
                    <div key={idx}>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">{field.label}</label>
                      <div className="relative">
                        <input
                          type={field.show ? "text" : "password"}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button type="button" onClick={field.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                    {["At least 8 characters", "One uppercase letter", "One number", "One special character"].map(r => (
                      <div key={r} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        {r}
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Update Password
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                {/* 2FA */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="w-5 h-5 text-slate-600" />
                    <div>
                      <h2 className="font-semibold text-slate-900">Two-Factor Authentication</h2>
                      <p className="text-xs text-slate-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">2FA is not enabled</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info("2FA setup coming soon!")}
                    className="w-full py-2.5 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Enable 2FA
                  </button>
                </div>

                {/* Active Sessions */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-5 h-5 text-slate-600" />
                    <div>
                      <h2 className="font-semibold text-slate-900">Active Sessions</h2>
                      <p className="text-xs text-slate-500">Manage your logged-in devices</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        session.isCurrent ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200"
                      )}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-900">{session.device}</p>
                            {session.isCurrent && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">Current</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{session.location} · {session.lastActive}</p>
                        </div>
                        {!session.isCurrent && (
                          <button
                            onClick={() => toast.success("Session revoked")}
                            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => toast.success("All other sessions revoked")}
                    className="mt-3 w-full py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Revoke All Other Sessions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
