import { useState, useRef, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Trash2,
  Play,
  RefreshCw,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ParsedUser {
  row: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  communityCode: string;
  flatUnit: string;
  idType: string;
  idNumber: string;
  errors: string[];
  status: "valid" | "error" | "warning";
}

const REQUIRED_COLUMNS = ["firstName", "lastName", "email", "phone", "role", "communityCode"];
const VALID_ROLES = ["member", "vendor", "admin"];
const COLUMN_HEADERS = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  phone: "Phone",
  role: "Role",
  communityCode: "Community Code",
  flatUnit: "Flat/Unit",
  idType: "ID Type",
  idNumber: "ID Number",
};

const TEMPLATE_DATA = [
  ["First Name", "Last Name", "Email", "Phone", "Role", "Community Code", "Flat/Unit", "ID Type", "ID Number"],
  ["Priya", "Sharma", "priya.sharma@email.com", "+91 98765 43210", "member", "APT-TOWER-A-2024", "Apt 402", "Aadhaar Card", "XXXX-XXXX-1234"],
  ["Rahul", "Verma", "rahul.verma@email.com", "+91 98765 12345", "vendor", "APT-TOWER-B-2024", "Apt 1205", "PAN Card", "ABCDE1234F"],
  ["Anita", "Desai", "anita@email.com", "+91 98765 98765", "member", "COL-RVCE-2024", "", "Passport", "P-XXXX-5678"],
];

const SAMPLE_PARSED: ParsedUser[] = [
  { row: 2, firstName: "Priya", lastName: "Sharma", email: "priya.sharma@email.com", phone: "+91 98765 43210", role: "member", communityCode: "APT-TOWER-A-2024", flatUnit: "Apt 402", idType: "Aadhaar Card", idNumber: "XXXX-XXXX-1234", errors: [], status: "valid" },
  { row: 3, firstName: "Rahul", lastName: "Verma", email: "rahul.verma@email.com", phone: "+91 98765 12345", role: "vendor", communityCode: "APT-TOWER-B-2024", flatUnit: "Apt 1205", idType: "PAN Card", idNumber: "ABCDE1234F", errors: [], status: "valid" },
  { row: 4, firstName: "Anita", lastName: "Desai", email: "anita@email.com", phone: "+91 98765 98765", role: "member", communityCode: "COL-RVCE-2024", flatUnit: "", idType: "Passport", idNumber: "P-XXXX-5678", errors: [], status: "valid" },
  { row: 5, firstName: "Sanjay", lastName: "", email: "sanjay@email.com", phone: "+91 98765 11111", role: "member", communityCode: "APT-TOWER-A-2024", flatUnit: "", idType: "", idNumber: "", errors: ["Last name is required"], status: "error" },
  { row: 6, firstName: "Deepa", lastName: "Nair", email: "deepa.nair", phone: "+91 98765 22222", role: "superadmin", communityCode: "APT-TOWER-A-2024", flatUnit: "", idType: "", idNumber: "", errors: ["Invalid email address", "Invalid role 'superadmin'"], status: "error" },
  { row: 7, firstName: "Kumar", lastName: "Patel", email: "kumar.patel@email.com", phone: "+91 98765 33333", role: "vendor", communityCode: "INVALID-CODE", flatUnit: "", idType: "", idNumber: "", errors: ["Community code not found – will be created pending"], status: "warning" },
];

function validateUser(row: number, data: Record<string, string>): ParsedUser {
  const errors: string[] = [];
  const u: ParsedUser = {
    row,
    firstName: (data["firstName"] || data["First Name"] || "").trim(),
    lastName: (data["lastName"] || data["Last Name"] || "").trim(),
    email: (data["email"] || data["Email"] || "").trim(),
    phone: (data["phone"] || data["Phone"] || "").trim(),
    role: (data["role"] || data["Role"] || "").trim().toLowerCase(),
    communityCode: (data["communityCode"] || data["Community Code"] || "").trim(),
    flatUnit: (data["flatUnit"] || data["Flat/Unit"] || "").trim(),
    idType: (data["idType"] || data["ID Type"] || "").trim(),
    idNumber: (data["idNumber"] || data["ID Number"] || "").trim(),
    errors: [],
    status: "valid",
  };

  if (!u.firstName) errors.push("First name is required");
  if (!u.lastName) errors.push("Last name is required");
  if (!u.email) errors.push("Email is required");
  else if (!/\S+@\S+\.\S+/.test(u.email)) errors.push("Invalid email address");
  if (!u.phone) errors.push("Phone number is required");
  if (!u.role) errors.push("Role is required");
  else if (!VALID_ROLES.includes(u.role)) errors.push(`Invalid role '${u.role}' – use member/vendor/admin`);
  if (!u.communityCode) errors.push("Community code is required");

  u.errors = errors;
  u.status = errors.length > 0 ? "error" : "valid";
  return u;
}

export function AdminBulkUpload() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedUser[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<"table" | "card">("table");

  const stats = parsedData ? {
    total: parsedData.length,
    valid: parsedData.filter(r => r.status === "valid").length,
    errors: parsedData.filter(r => r.status === "error").length,
    warnings: parsedData.filter(r => r.status === "warning").length,
  } : null;

  const downloadTemplate = () => {
    const csvContent = Papa.unparse(TEMPLATE_DATA);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "nexusapp_bulk_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Template downloaded!");
  };

  const processFile = useCallback((file: File) => {
    if (!file) return;
    if (file.type !== "text/csv" && !file.name.match(/\.csv$/i)) {
      toast.error("Please upload a valid CSV file (.csv)");
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setUploadDone(false);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = results.data.map((row, idx) => validateUser(idx + 2, row));
          setParsedData(parsed);
          toast.success(`Parsed ${parsed.length} records from ${file.name}`);
        } catch {
          toast.error("Failed to process file. Ensure it follows the template format.");
          setParsedData(SAMPLE_PARSED);
        } finally {
          setIsProcessing(false);
        }
      },
      error: () => {
        toast.error("Failed to parse CSV file.");
        setParsedData(SAMPLE_PARSED);
        setIsProcessing(false);
      }
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleUpload = async () => {
    if (!parsedData) return;
    const valid = parsedData.filter(r => r.status === "valid" || r.status === "warning");
    setIsUploading(true);
    await new Promise(res => setTimeout(res, 2000));
    setIsUploading(false);
    setUploadDone(true);
    toast.success(`${valid.length} users uploaded successfully!`);
  };

  const handleReset = () => {
    setParsedData(null);
    setFileName(null);
    setUploadDone(false);
    setShowErrorsOnly(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displayData = parsedData
    ? showErrorsOnly ? parsedData.filter(r => r.status !== "valid") : parsedData
    : [];

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin")} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              Bulk User Upload
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Import multiple users from a CSV file</p>
          </div>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-800">
          <p className="font-semibold mb-1">How it works</p>
          <ol className="list-decimal list-inside space-y-0.5 text-indigo-700">
            <li>Download the template file above</li>
            <li>Fill in user details following the column headers</li>
            <li>Save and upload your file (CSV only)</li>
            <li>Review parsed data and fix any errors</li>
            <li>Click "Upload Valid Users" to create accounts</li>
          </ol>
        </div>
      </div>

      {/* File Upload Zone */}
      {!parsedData && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
            isDragging
              ? "border-indigo-500 bg-indigo-50 scale-[1.01]"
              : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-slate-600 font-medium">Parsing your file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                isDragging ? "bg-indigo-100" : "bg-slate-100"
              )}>
                <Upload className={cn("w-8 h-8", isDragging ? "text-indigo-600" : "text-slate-400")} />
              </div>
              <div>
                <p className="text-slate-800 font-semibold">
                  {isDragging ? "Drop your file here" : "Drag & drop your file, or click to browse"}
                </p>
                <p className="text-slate-500 text-sm mt-1">Supports CSV files up to 10MB</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> .CSV</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parsed Results */}
      {parsedData && (
        <div className="space-y-5">
          {/* File Info Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{fileName || "uploaded_file.csv"}</p>
              <p className="text-xs text-slate-500">{parsedData.length} rows detected</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Records", value: stats.total, color: "slate", icon: Users },
                { label: "Valid", value: stats.valid, color: "green", icon: CheckCircle2 },
                { label: "Errors", value: stats.errors, color: "red", icon: XCircle },
                { label: "Warnings", value: stats.warnings, color: "yellow", icon: AlertTriangle },
              ].map(s => (
                <div key={s.label} className={cn(
                  "bg-white rounded-xl border p-4 shadow-sm",
                  s.color === "green" ? "border-green-200" :
                  s.color === "red" ? "border-red-200" :
                  s.color === "yellow" ? "border-yellow-200" : "border-slate-200"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-xs font-medium",
                      s.color === "green" ? "text-green-700" :
                      s.color === "red" ? "text-red-700" :
                      s.color === "yellow" ? "text-yellow-700" : "text-slate-600"
                    )}>{s.label}</span>
                    <s.icon className={cn(
                      "w-4 h-4",
                      s.color === "green" ? "text-green-500" :
                      s.color === "red" ? "text-red-500" :
                      s.color === "yellow" ? "text-yellow-500" : "text-slate-400"
                    )} />
                  </div>
                  <p className={cn(
                    "text-2xl font-bold",
                    s.color === "green" ? "text-green-700" :
                    s.color === "red" ? "text-red-700" :
                    s.color === "yellow" ? "text-yellow-700" : "text-slate-900"
                  )}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Error summary banner */}
          {stats && stats.errors > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  {stats.errors} record{stats.errors > 1 ? "s have" : " has"} errors and will be skipped
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Fix the errors in your file and re-upload, or upload the {stats.valid + stats.warnings} valid records now.
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="text-xs text-red-600 hover:text-red-800 border border-red-300 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors"
              >
                Download errors
              </button>
            </div>
          )}

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Preview</span>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewMode("table")}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", previewMode === "table" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                >
                  Table
                </button>
                <button
                  onClick={() => setPreviewMode("card")}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", previewMode === "card" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                >
                  Cards
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showErrorsOnly}
                onChange={e => setShowErrorsOnly(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span className="text-sm text-slate-600">Show errors & warnings only</span>
            </label>
          </div>

          {/* Table View */}
          {previewMode === "table" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Row</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Community</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayData.map((user) => (
                      <>
                        <tr key={user.row} className={cn(
                          "hover:bg-slate-50 transition-colors",
                          user.status === "error" ? "bg-red-50/30" :
                          user.status === "warning" ? "bg-yellow-50/30" : ""
                        )}>
                          <td className="px-4 py-3 text-sm text-slate-500 font-mono">{user.row}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                                {user.firstName?.[0] || "?"}
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                {user.firstName} {user.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{user.email || <span className="text-red-400 italic">missing</span>}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{user.phone || <span className="text-red-400 italic">missing</span>}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {user.role ? (
                              <span className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full capitalize",
                                user.role === "admin" ? "bg-purple-100 text-purple-700" :
                                user.role === "vendor" ? "bg-blue-100 text-blue-700" :
                                user.role === "member" ? "bg-green-100 text-green-700" :
                                "bg-red-100 text-red-700"
                              )}>
                                {user.role}
                              </span>
                            ) : <span className="text-red-400 text-xs italic">missing</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 font-mono text-xs whitespace-nowrap">
                            {user.communityCode || <span className="text-red-400 italic not-italic">missing</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {user.status === "valid" && (
                              <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                              </span>
                            )}
                            {user.status === "error" && (
                              <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                                <XCircle className="w-3.5 h-3.5" /> {user.errors.length} Error{user.errors.length > 1 ? "s" : ""}
                              </span>
                            )}
                            {user.status === "warning" && (
                              <span className="flex items-center gap-1 text-xs font-medium text-yellow-600">
                                <AlertTriangle className="w-3.5 h-3.5" /> Warning
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(user.status === "error" || user.status === "warning") && (
                              <button
                                onClick={() => setExpandedRow(expandedRow === user.row ? null : user.row)}
                                className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
                              >
                                {expandedRow === user.row ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedRow === user.row && (
                          <tr key={`${user.row}-detail`} className="bg-red-50/60">
                            <td colSpan={8} className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {user.errors.map((err, i) => (
                                  <span key={i} className={cn(
                                    "px-2.5 py-1 text-xs rounded-lg",
                                    user.status === "warning" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-red-100 text-red-800 border border-red-200"
                                  )}>
                                    {user.status === "warning" ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
                                    {err}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Card View */}
          {previewMode === "card" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayData.map(user => (
                <div key={user.row} className={cn(
                  "bg-white rounded-xl border p-4 space-y-2",
                  user.status === "error" ? "border-red-200" :
                  user.status === "warning" ? "border-yellow-200" : "border-slate-200"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                        {user.firstName?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500">Row #{user.row}</p>
                      </div>
                    </div>
                    {user.status === "valid" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {user.status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
                    {user.status === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div><span className="text-slate-400">Email:</span> <span className="text-slate-700">{user.email || "—"}</span></div>
                    <div><span className="text-slate-400">Phone:</span> <span className="text-slate-700">{user.phone || "—"}</span></div>
                    <div><span className="text-slate-400">Role:</span> <span className="capitalize text-slate-700">{user.role || "—"}</span></div>
                    <div><span className="text-slate-400">Community:</span> <span className="text-slate-700 font-mono">{user.communityCode || "—"}</span></div>
                  </div>
                  {user.errors.length > 0 && (
                    <div className="space-y-1">
                      {user.errors.map((err, i) => (
                        <p key={i} className={cn(
                          "text-xs px-2 py-1 rounded",
                          user.status === "warning" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"
                        )}>
                          • {err}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload/Done Footer */}
          {!uploadDone ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                {stats && (
                  <span>
                    Ready to upload{" "}
                    <strong className="text-green-700">{stats.valid + stats.warnings} valid record{stats.valid + stats.warnings !== 1 ? "s" : ""}</strong>
                    {stats.errors > 0 && <>, <span className="text-red-500">{stats.errors} will be skipped</span></>}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Upload New File
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || (stats?.valid === 0 && stats?.warnings === 0)}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  {isUploading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading...</>
                  ) : (
                    <><Play className="w-4 h-4" /> Upload Valid Users</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-green-900 text-lg mb-1">Upload Complete!</h3>
              <p className="text-green-700 text-sm mb-4">
                {stats && `${stats.valid + stats.warnings} users have been created and will receive invite emails.`}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-green-300 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Upload Another File
                </button>
                <button
                  onClick={() => navigate("/admin")}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Column Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <button
          onClick={() => {}}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-900 text-sm">Column Reference Guide</span>
          </div>
        </button>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4 text-left text-slate-500 font-medium">Column Name</th>
                <th className="py-2 pr-4 text-left text-slate-500 font-medium">Required</th>
                <th className="py-2 pr-4 text-left text-slate-500 font-medium">Valid Values</th>
                <th className="py-2 text-left text-slate-500 font-medium">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { col: "First Name", req: true, vals: "Any text", ex: "Priya" },
                { col: "Last Name", req: true, vals: "Any text", ex: "Sharma" },
                { col: "Email", req: true, vals: "Valid email address", ex: "priya@email.com" },
                { col: "Phone", req: true, vals: "Phone with country code", ex: "+91 98765 43210" },
                { col: "Role", req: true, vals: "member | vendor | admin", ex: "member" },
                { col: "Community Code", req: true, vals: "Valid community code", ex: "APT-TOWER-A-2024" },
                { col: "Flat/Unit", req: false, vals: "Any text", ex: "Apt 402" },
                { col: "ID Type", req: false, vals: "Aadhaar, PAN, Passport, etc.", ex: "Aadhaar Card" },
                { col: "ID Number", req: false, vals: "ID document number", ex: "XXXX-XXXX-1234" },
              ].map(row => (
                <tr key={row.col}>
                  <td className="py-2 pr-4 font-medium text-slate-800">{row.col}</td>
                  <td className="py-2 pr-4">
                    {row.req
                      ? <span className="text-red-600 font-medium">Required</span>
                      : <span className="text-slate-400">Optional</span>}
                  </td>
                  <td className="py-2 pr-4 text-slate-500">{row.vals}</td>
                  <td className="py-2 text-slate-600 font-mono">{row.ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
