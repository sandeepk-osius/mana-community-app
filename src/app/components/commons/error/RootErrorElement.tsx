import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router";
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react";

export function RootErrorElement() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Oops! Something went wrong";
  let message = "An unexpected error occurred. Please try again later.";
  let code = "Error";

  if (isRouteErrorResponse(error)) {
    code = error.status.toString();
    if (error.status === 404) {
      title = "Page Not Found";
      message = "The page you are looking for doesn't exist or has been moved.";
    } else if (error.status === 401) {
      title = "Unauthorized";
      message = "You don't have permission to view this page.";
    } else if (error.status === 503) {
      title = "Service Unavailable";
      message = "The server is currently unable to handle the request.";
    }
  }

  return (
    <div className="min-h-screen bg-[#0c1220] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-indigo-500/20 rounded-full" />
          <div className="relative bg-[#141c2e] border border-[#2a3a5c] p-8 rounded-3xl shadow-2xl">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
              <AlertTriangle className="w-10 h-10 text-indigo-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">{code}</h1>
              <h2 className="text-xl font-bold text-slate-200">{title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {message}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-8">
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 bg-[#1a2540] hover:bg-[#2a3a5c] text-slate-300 font-medium rounded-xl border border-[#2a3a5c] transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3 bg-[#1a2540] hover:bg-[#2a3a5c] text-slate-300 font-medium rounded-xl border border-[#2a3a5c] transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-xs">
          If the problem persists, please contact support with error code: <span className="font-mono text-slate-400">{code}</span>
        </p>
      </div>
    </div>
  );
}
