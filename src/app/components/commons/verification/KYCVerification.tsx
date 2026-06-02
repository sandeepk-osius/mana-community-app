import { useState } from "react";
import { useForm } from "react-hook-form";
import { ShieldCheck, Upload, FileText, CheckCircle, AlertCircle, Camera, User, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { authService } from "../../../../services/authService";
import { getToken } from "../../../../services/apiClient";
import type { GovtIdType } from "../../../../types/api";

type KYCFormValues = {
  govtIdType: GovtIdType;
  idNumber: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
};

export function KYCVerification() {
  const [step, setStep] = useState<"form" | "upload" | "submitting" | "pending">("form");
  const [uploadedFront, setUploadedFront] = useState(false);
  const [uploadedBack, setUploadedBack] = useState(false);
  const [uploadedSelfie, setUploadedSelfie] = useState(false);
  const [kycFormData, setKycFormData] = useState<KYCFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<KYCFormValues>({
    defaultValues: { govtIdType: "DRIVING_LICENCE" },
  });

  const onSubmitForm = (data: KYCFormValues) => {
    setKycFormData(data);
    setStep("upload");
  };

  const handleFileUpload = (type: "front" | "back" | "selfie") => {
    if (type === "front") setUploadedFront(true);
    if (type === "back") setUploadedBack(true);
    if (type === "selfie") setUploadedSelfie(true);
    toast.success(`${type === "selfie" ? "Selfie" : "ID " + type} uploaded successfully`);
  };

  const submitForReview = async () => {
    if (!uploadedFront || !uploadedBack || !uploadedSelfie) {
      toast.error("Please upload all required documents");
      return;
    }
    if (!kycFormData) return;
    if (!getToken()) {
      toast.error("Session expired. Please log in again.");
      window.location.href = "/login";
      return;
    }

    setIsSubmitting(true);
    setStep("submitting");
    try {
      const userId = JSON.parse(localStorage.getItem("mana_user") ?? "{}").userId ?? "unknown";
      const idSlug = kycFormData.govtIdType.toLowerCase();
      await authService.verifyKyc({
        govtIdType: kycFormData.govtIdType,
        govtIdNumber: kycFormData.idNumber,
        docType: `${kycFormData.govtIdType}_FRONT`,
        s3Key: `kyc/2024/user-${userId}/${idSlug}-front.jpg`,
        s3KeyBack: `kyc/2024/user-${userId}/${idSlug}-back.jpg`,
        addressOnDocument: `${kycFormData.address}, ${kycFormData.city}, ${kycFormData.state} - ${kycFormData.zipCode}`,
        dobOnDocument: kycFormData.dateOfBirth,
        consentGiven: true,
      });
      toast.success("KYC submitted successfully!");
      setStep("pending");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed. Please try again.");
      setStep("upload");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-600 p-3 rounded-2xl mb-4">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Identity Verification</h1>
          <p className="text-slate-600">Verify your identity to join the trusted community</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === "form" ? "bg-indigo-600 text-white" : "bg-green-100 text-green-700"}`}>
              {step !== "form" ? <CheckCircle className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">1</span>}
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === "upload" ? "bg-indigo-600 text-white" : step === "submitting" || step === "pending" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
              {(step === "submitting" || step === "pending") ? <CheckCircle className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">2</span>}
              <span className="text-sm font-medium">Documents</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-slate-200 text-slate-600"}`}>
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-sm font-medium">Approval</span>
            </div>
          </div>
        </div>

        {/* Form Step */}
        {step === "form" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Personal Information</h2>
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
              <div>
                <label htmlFor="govtIdType" className="block text-sm font-medium text-slate-700 mb-2">Government ID Type</label>
                <select id="govtIdType" {...register("govtIdType")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="DRIVING_LICENCE">Driver's License</option>
                  <option value="AADHAAR">Aadhar Card (India)</option>
                  <option value="VOTER_ID">Voter ID</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="idNumber" className="block text-sm font-medium text-slate-700 mb-2">ID Number</label>
                  <input id="idNumber" type="text" {...register("idNumber", { required: "ID number is required", minLength: { value: 8, message: "Must be at least 8 characters" } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter ID number" />
                  {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber.message}</p>}
                </div>
                <div>
                  <label htmlFor="kyc-dob" className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                  <input id="kyc-dob" type="date" {...register("dateOfBirth", { required: "Date of birth is required" })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="kyc-phone" className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input id="kyc-phone" type="tel" {...register("phoneNumber", { required: "Phone number is required" })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 98765 43210" />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
              </div>

              <div>
                <label htmlFor="kyc-address" className="block text-sm font-medium text-slate-700 mb-2">Street Address</label>
                <input id="kyc-address" type="text" {...register("address", { required: "Address is required" })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="123 Main Street" />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="kyc-city" className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input id="kyc-city" type="text" {...register("city", { required: "City is required" })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="City" />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label htmlFor="kyc-state" className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <input id="kyc-state" type="text" {...register("state", { required: "State is required" })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="State" />
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                </div>
                <div>
                  <label htmlFor="kyc-zip" className="block text-sm font-medium text-slate-700 mb-2">PIN Code</label>
                  <input id="kyc-zip" type="text" {...register("zipCode", { required: "PIN code is required" })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="560001" />
                  {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                  Continue to Document Upload
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Upload Step */}
        {step === "upload" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Upload Documents</h2>
            <p className="text-slate-600 mb-8">Please upload clear photos of your government ID and a selfie</p>
            <div className="space-y-5">
              {([
                { key: "front" as const, uploaded: uploadedFront, label: "ID Front Side", desc: "Clear photo of the front of your ID", icon: FileText },
                { key: "back" as const, uploaded: uploadedBack, label: "ID Back Side", desc: "Clear photo of the back of your ID", icon: FileText },
                { key: "selfie" as const, uploaded: uploadedSelfie, label: "Selfie Verification", desc: "Selfie holding your ID next to your face", icon: Camera },
              ]).map(({ key, uploaded, label, desc, icon: Icon }) => (
                <div key={key} className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-indigo-400 transition-colors">
                  <div className="flex flex-col items-center">
                    <div className={`p-4 rounded-full mb-3 ${uploaded ? "bg-green-100" : "bg-slate-100"}`}>
                      {uploaded ? <CheckCircle className="w-8 h-8 text-green-600" /> : <Icon className="w-8 h-8 text-slate-400" />}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{label}</h3>
                    <p className="text-sm text-slate-500 mb-4">{desc}</p>
                    <label className="px-6 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg cursor-pointer transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={() => handleFileUpload(key)} />
                      <Upload className="w-4 h-4 inline mr-2" />
                      {uploaded ? "Re-upload" : `Upload ${label}`}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setStep("form")} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">Back</button>
              <button id="kyc-submit-btn" onClick={submitForReview} disabled={isSubmitting} className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : "Submit for Review"}
              </button>
            </div>
          </div>
        )}

        {/* Processing */}
        {step === "submitting" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="inline-flex items-center justify-center bg-blue-100 p-4 rounded-full mb-6">
              <div className="animate-spin"><AlertCircle className="w-12 h-12 text-blue-600" /></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Processing Your Submission</h2>
            <p className="text-slate-600">Please wait while we validate your documents...</p>
          </div>
        )}

        {/* Pending */}
        {step === "pending" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="inline-flex items-center justify-center bg-yellow-100 p-4 rounded-full mb-6">
              <User className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Pending Admin Approval</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">Your documents have been submitted. A community admin will review within 24–48 hours.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800 font-medium">You'll receive an email notification once your account is approved</p>
            </div>
            <div className="mt-8">
              <button onClick={() => window.location.href = "/login"} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">Return to Login</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
