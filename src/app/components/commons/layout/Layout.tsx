import { Outlet, NavLink, useNavigate } from "react-router";
import { Users, Store, Briefcase, Trophy, CalendarDays, Menu, X, UserCircle, Bell, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../../../../contexts/AuthContext";
import { userService } from "../../../../services/userService";
import {
  VIEW_FEED, VIEW_SPORTS, VIEW_MARKETPLACE,
  VIEW_JOBS, VIEW_EVENTS, VIEW_ADMIN,
} from "../../../../constants/permissions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const { user, isAdmin, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState<string[]>(user?.permissions || []);
  const [loadingPermissions, setLoadingPermissions] = useState(!user?.permissions);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (user?.permissions) {
      setPermissions(user.permissions);
      setLoadingPermissions(false);
      return;
    }

    let active = true;
    const fetchUserPermissions = async () => {
      try {
        const me = await userService.getMe();
        if (active) {
          setPermissions(me.permissions || []);
          updateUser({ permissions: me.permissions });
        }
      } catch (err) {
        console.error("Failed to load user permissions for sidebar:", err);
      } finally {
        if (active) {
          setLoadingPermissions(false);
        }
      }
    };
    fetchUserPermissions();
    return () => {
      active = false;
    };
  }, [user, updateUser]);

  const navLinks = [
    { to: "/", icon: Users, label: "Community Feed" },
    { to: "/sports", icon: Trophy, label: "Sports" },
    { to: "/marketplace", icon: Store, label: "Marketplace" },
    { to: "/jobs", icon: Briefcase, label: "Jobs & Referrals" },
    { to: "/events", icon: CalendarDays, label: "Events" },
  ];

  const adminLinks = isAdmin ? [{ to: "/admin", icon: ShieldCheck, label: "Admin Dashboard" }] : [];

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const filteredNavLinks = navLinks.filter((link) => {
    if (isSuperAdmin) return true;
    if (loadingPermissions) return true; // default while loading
    if (link.label === "Community Feed") return permissions.includes(VIEW_FEED);
    if (link.label === "Sports") return permissions.includes(VIEW_SPORTS);
    if (link.label === "Marketplace") return permissions.includes(VIEW_MARKETPLACE);
    if (link.label === "Jobs & Referrals") return permissions.includes(VIEW_JOBS);
    if (link.label === "Events") return permissions.includes(VIEW_EVENTS);
    return true;
  });

  const filteredAdminLinks = adminLinks.filter((link) => {
    if (isSuperAdmin) return true;
    if (loadingPermissions) return isAdmin; // default while loading
    return permissions.includes(VIEW_ADMIN);
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.fullName ?? "Community Member";
  const roleLabel = user?.role === "SUPER_ADMIN" ? "Super Admin" 
                 : user?.role === "COMMUNITY_ADMIN" ? "Community Admin"
                 : isAdmin ? "Admin" 
                 : user?.role === "VENDOR" ? "Vendor" 
                 : "Verified Member";

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out lg:static lg:flex-shrink-0 overflow-hidden",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-0 lg:translate-x-0 lg:border-none lg:w-0"
      )}>
        <div className="w-64 flex flex-col h-full">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="bg-indigo-600 p-1.5 rounded-lg mr-3">
            <Users className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">Mana Community</span>
          <button className="ml-auto lg:hidden text-slate-500 hover:text-slate-700" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
              {user?.fullName ? (
                <span className="text-indigo-700 font-bold text-sm">
                  {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <UserCircle className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{displayName}</p>
              <div className="flex items-center text-xs text-indigo-600 font-medium">
                <ShieldCheck className="h-3 w-3 mr-1" />
                {roleLabel}
                {loadingPermissions && (
                  <span className="ml-1.5 flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              <link.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {link.label}
            </NavLink>
          ))}

          {filteredAdminLinks.length > 0 && (
            <>
              <div className="my-4 px-3"><div className="h-px bg-slate-200"></div></div>
              {filteredAdminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "text-purple-600 hover:bg-purple-50 hover:text-purple-700 border border-transparent"
                    )
                  }
                >
                  <link.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {link.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-1">
          <NavLink
            to="/profile"
            className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <UserCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            My Profile
          </NavLink>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 transition-all">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="p-2 -ml-2 mr-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md">
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-bold text-lg text-slate-900 lg:hidden">Mana Community</span>
          </div>

          <div className="hidden lg:block flex-1" />

          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
