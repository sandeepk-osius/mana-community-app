import { NavLink, Outlet } from "react-router";
import { LayoutDashboard, Medal, CalendarDays, Gavel, ShieldCog } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";

const sportsNav = [
  { to: "/sports", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/sports/register", label: "My Sports", icon: Medal },
  { to: "/sports/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/sports/auction", label: "Auction", icon: Gavel },
  { to: "/sports/admin", label: "Admin", icon: ShieldCog },
];

export function SportsLayout() {
  const { isAdmin } = useAuth();

  const visibleNav = isAdmin ? sportsNav : sportsNav.filter(n => n.to !== "/sports/admin");

  return (
    <div className="space-y-4">
      {/* Sports sub-nav pill bar */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto">
        {visibleNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive
                ? "bg-[#f97316] text-white shadow-sm"
                : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1a2540]"
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}


      </div>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
