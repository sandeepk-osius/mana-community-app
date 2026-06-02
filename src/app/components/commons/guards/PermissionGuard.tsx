import { Navigate } from "react-router";
import { useAuth } from "../../../../contexts/AuthContext";
import { ShieldAlert } from "lucide-react";

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
}

export function PermissionGuard({ children, permission }: PermissionGuardProps) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // SUPER_ADMIN role bypasses all permission constraints
  if (user.role === "SUPER_ADMIN") {
    return <>{children}</>;
  }
  
  const userPerms = user.permissions || [];
  const hasPermission = userPerms.includes(permission);
  
  if (!hasPermission) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
        <div className="p-4 bg-red-50 text-red-600 rounded-full border border-red-100 mb-5 animate-bounce">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-xs mt-1 max-w-sm mb-6 leading-relaxed font-semibold">
          Your active security role profile does not grant you permissions to access this view. 
          Please contact your community administrator if you believe this is an error.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
}
