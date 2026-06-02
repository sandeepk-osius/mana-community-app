import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Home,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { communityService } from "../../services/communityService";
import type { CommunityResponse } from "../../types/api";

type SignupFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  communityType: string;
  communityCode: string;
  userType: string;
  dateOfBirth: string;
  gender: string;
  block: string;
  flatNo: string;
  terms: boolean;
};

export function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      communityType: "apartment",
      userType: "member",
      gender: "MALE",
    },
  });

  const password = watch("password");
  const communityType = watch("communityType");
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const data = await communityService.getCommunities(communityType);
        setCommunities(data);
      } catch (err) {
        console.error("Failed to fetch communities", err);
      }
    };
    fetchCommunities();
  }, [communityType]);

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        inviteCode: data.communityCode,
        password: data.password,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        block: data.block,
        flatNo: data.flatNo,
      });
      toast.success("Account created! Welcome to the community.");
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    }
  };

  const communityTypes = [
    { value: "apartment", label: "Apartment Complex", icon: Building2 },
    { value: "college", label: "College/University", icon: GraduationCap },
    { value: "local", label: "Local Community", icon: Home },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-600 p-3 rounded-2xl mb-4">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join Mana Community</h1>
          <p className="text-slate-600">Create your account and connect with your community</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Community Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Your Community Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {communityTypes.map((type) => (
                  <label
                    key={type.value}
                    className="relative flex flex-col items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 transition-all"
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...register("communityType")}
                      className="sr-only"
                    />
                    <type.icon className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs font-medium text-slate-700 text-center">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  {...register("fullName", { required: "Full name is required" })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
                  })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register("phone", { required: "Phone number is required" })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-2">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth", { required: "Date of birth is required" })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Community
                </label>
                <select
                  onChange={(e) => setValue("communityCode", e.target.value, { shouldValidate: true })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all mb-4"
                >
                  <option value="">Select your community...</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.inviteCode}>
                      {c.name} {c.city ? `(${c.city})` : ""}
                    </option>
                  ))}
                </select>

                <label htmlFor="communityCode" className="block text-sm font-medium text-slate-700 mb-2">
                  Community Invite Code
                </label>
                <input
                  id="communityCode"
                  type="text"
                  {...register("communityCode", { required: "Community code is required" })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g., APT-TOWER-A-2024"
                />
                {errors.communityCode && (
                  <p className="text-red-500 text-xs mt-1">{errors.communityCode.message}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Select from above or enter manually
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select
                  {...register("gender")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            
            {communityType === "apartment" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-1">
                <div>
                  <label htmlFor="block" className="block text-sm font-medium text-slate-700 mb-2">
                    Block / Wing
                  </label>
                  <input
                    id="block"
                    type="text"
                    {...register("block", { required: communityType === "apartment" ? "Block is required" : false })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g., A, B, Phase 1"
                  />
                  {errors.block && (
                    <p className="text-red-500 text-xs mt-1">{errors.block.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="flatNo" className="block text-sm font-medium text-slate-700 mb-2">
                    Flat Number
                  </label>
                  <input
                    id="flatNo"
                    type="text"
                    {...register("flatNo", { required: communityType === "apartment" ? "Flat number is required" : false })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g., 101, 202-B"
                  />
                  {errors.flatNo && (
                    <p className="text-red-500 text-xs mt-1">{errors.flatNo.message}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative flex items-center p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 transition-all">
                  <input
                    type="radio"
                    value="member"
                    {...register("userType")}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="ml-3 text-sm font-medium text-slate-700">Community Member</span>
                </label>
                <label className="relative flex items-center p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 transition-all">
                  <input
                    type="radio"
                    value="vendor"
                    {...register("userType")}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="ml-3 text-sm font-medium text-slate-700">Vendor/Service Provider</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pr-11"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) => value === password || "Passwords do not match",
                    })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pr-11"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  {...register("terms", { required: "You must agree to the terms" })}
                  className="mt-1 w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600 leading-tight">
                  I agree to the Terms of Service and Privacy Policy, and consent to identity
                  verification for community safety
                </span>
              </label>
              {errors.terms && (
                <p className="text-red-500 text-xs mt-1 ml-7">{errors.terms.message}</p>
              )}
            </div>

            <button
              type="submit"
              id="signup-submit-btn"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Continue to Verification
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
