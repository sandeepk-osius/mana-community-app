import { useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Download,
  AlertTriangle,
  UserPlus,
  FileSpreadsheet,
  Building2,
  Trophy,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";

type VerificationStatus = "pending" | "approved" | "rejected";

type UserApplication = {
  id: string;
  fullName: string;
  email: string;
  communityType: string;
  communityCode: string;
  userType: "member" | "vendor";
  idType: string;
  idNumber: string;
  phoneNumber: string;
  address: string;
  submittedAt: string;
  status: VerificationStatus;
  documents: {
    idFront: string;
    idBack: string;
    selfie: string;
  };
};

const mockApplications: UserApplication[] = [
  {
    id: "1",
    fullName: "Priya Sharma",
    email: "priya.sharma@email.com",
    communityType: "apartment",
    communityCode: "APT-TOWER-A-2024",
    userType: "member",
    idType: "Aadhar Card",
    idNumber: "XXXX-XXXX-1234",
    phoneNumber: "+91 98765 43210",
    address: "Tower A, Apt 402, Bangalore",
    submittedAt: "2026-04-22T10:30:00",
    status: "pending",
    documents: {
      idFront: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      idBack: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      selfie: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    },
  },
  {
    id: "2",
    fullName: "Rahul Verma",
    email: "rahul.verma@email.com",
    communityType: "apartment",
    communityCode: "APT-TOWER-B-2024",
    userType: "vendor",
    idType: "Driver's License",
    idNumber: "DL-XX-2024-XXXX",
    phoneNumber: "+91 98765 12345",
    address: "Tower B, Apt 1205, Bangalore",
    submittedAt: "2026-04-21T14:20:00",
    status: "pending",
    documents: {
      idFront: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      idBack: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      selfie: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    },
  },
  {
    id: "3",
    fullName: "Anita Desai",
    email: "anita.desai@email.com",
    communityType: "apartment",
    communityCode: "APT-TOWER-A-2024",
    userType: "member",
    idType: "Passport",
    idNumber: "P-XXXX-5678",
    phoneNumber: "+91 98765 98765",
    address: "Tower A, Apt 801, Bangalore",
    submittedAt: "2026-04-20T09:15:00",
    status: "approved",
    documents: {
      idFront: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      idBack: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      selfie: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    },
  },
];

export function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-medium">Access Denied. Administrative privileges required.</p>
      </div>
    );
  }

  const canManageCommunities = user?.role === "SUPER_ADMIN" || (user?.permissions || []).includes("Manage Communities");

  const [applications, setApplications] = useState<UserApplication[]>(mockApplications);
  const [selectedApp, setSelectedApp] = useState<UserApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | "all">("all");

  const filteredApplications = applications.filter(
    (app) => filterStatus === "all" || app.status === filterStatus
  );

  const stats = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    total: applications.length,
  };

  const handleApprove = (id: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "approved" as VerificationStatus } : app))
    );
    toast.success("Application approved successfully");
    setSelectedApp(null);
  };

  const handleReject = (id: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "rejected" as VerificationStatus } : app))
    );
    toast.error("Application rejected");
    setSelectedApp(null);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Admin Dashboard - KYC Verification
          </h2>
          <p className="text-slate-500 text-sm mt-1">Review and approve user applications</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate("/admin/create-user")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
          <button
            onClick={() => navigate("/admin/bulk-upload")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Upload
          </button>
          {canManageCommunities && (
            <button
              onClick={() => navigate("/admin/create-community")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              Create Community
            </button>
          )}
          <button
            onClick={() => navigate("/admin/roles")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            Roles & Permissions
          </button>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Applications</span>
            <div className="p-2 bg-slate-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-700">Pending Review</span>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Approved</span>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-700">{stats.approved}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Rejected</span>
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-700">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Community
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                        {app.fullName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{app.fullName}</div>
                        <div className="text-xs text-slate-500">{app.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{app.communityCode}</div>
                    <div className="text-xs text-slate-500 capitalize">{app.communityType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full capitalize">
                      {app.userType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {app.status === "pending" && (
                      <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                        Pending
                      </span>
                    )}
                    {app.status === "approved" && (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                        Approved
                      </span>
                    )}
                    {app.status === "rejected" && (
                      <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900">Application Review</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant Info */}
              <div className="bg-slate-50 rounded-xl p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Applicant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Full Name:</span>
                    <p className="font-medium text-slate-900">{selectedApp.fullName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <p className="font-medium text-slate-900">{selectedApp.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone:</span>
                    <p className="font-medium text-slate-900">{selectedApp.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Address:</span>
                    <p className="font-medium text-slate-900">{selectedApp.address}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Community:</span>
                    <p className="font-medium text-slate-900">{selectedApp.communityCode}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Account Type:</span>
                    <p className="font-medium text-slate-900 capitalize">{selectedApp.userType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ID Type:</span>
                    <p className="font-medium text-slate-900">{selectedApp.idType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ID Number:</span>
                    <p className="font-medium text-slate-900">{selectedApp.idNumber}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Verification Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <img
                      src={selectedApp.documents.idFront}
                      alt="ID Front"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-slate-50 text-center text-sm font-medium text-slate-700">
                      ID Front Side
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <img
                      src={selectedApp.documents.idBack}
                      alt="ID Back"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-slate-50 text-center text-sm font-medium text-slate-700">
                      ID Back Side
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <img
                      src={selectedApp.documents.selfie}
                      alt="Selfie"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-slate-50 text-center text-sm font-medium text-slate-700">
                      Selfie Verification
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              {selectedApp.status === "pending" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Verification Checklist:</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Verify ID documents are clear and valid</li>
                      <li>Confirm selfie matches ID photo</li>
                      <li>Check community code is valid for this user</li>
                      <li>Ensure all information is accurate</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedApp.status === "pending" && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <UserX className="w-5 h-5" />
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <UserCheck className="w-5 h-5" />
                    Approve Application
                  </button>
                </div>
              )}

              {selectedApp.status !== "pending" && (
                <div className="text-center py-4">
                  <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                    selectedApp.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {selectedApp.status === "approved" ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Application Approved
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Application Rejected
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}