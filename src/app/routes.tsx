import { createBrowserRouter } from "react-router";
import { Layout } from "./components/commons/layout/Layout";
import { Feed } from "./components/community/Feed";
import { Marketplace } from "./components/marketplace/Marketplace";
import { Jobs } from "./components/jobs/Jobs";
import { Events } from "./components/events/Events";
import { Login } from "./components/commons/login/Login";
import { Signup } from "./components/Signup";
import { KYCVerification } from "./components/commons/verification/KYCVerification";
import { AdminDashboard } from "./components/admin/AdminDashboard";

import { AdminCreateUser } from "./components/admin/AdminCreateUser";
import { AdminBulkUpload } from "./components/admin/AdminBulkUpload";
import { AdminVenues } from "./components/admin/AdminVenues";
import { AdminCommunity } from "./components/admin/AdminCommunity";
import { AdminRoleManagement } from "./components/admin/AdminRoleManagement";
import { ProfileDashboard } from "./components/profile/ProfileDashboard";
import { RootErrorElement } from "./components/commons/error/RootErrorElement";
import { PermissionGuard } from "./components/commons/guards/PermissionGuard";

// Sports pages
import { SportsLayout }       from "./components/sports/SportsLayout";
import { SportsDashboard }    from "./components/sports/SportsDashboard";
import { SportsRegistration } from "./components/sports/SportsRegistration";
import { SportsSchedule }     from "./components/sports/SportsSchedule";
import { SportsAuction }      from "./components/sports/SportsAuction";
import { SportsAdmin }        from "./components/sports/admin/SportsAdmin";
import { SportsRegister }     from "./components/sports/SportsRegister";

// Permission constants
import {
  VIEW_FEED, VIEW_SPORTS, REGISTER_SPORTS, BIDDING_INTERFACE,
  MANAGE_TOURNAMENTS, VIEW_ADMIN, BULK_UPLOAD, MANAGE_COMMUNITIES,
  MANAGE_ROLES, VIEW_MARKETPLACE, VIEW_JOBS, VIEW_EVENTS,
} from "../constants/permissions";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/kyc-verification",
    Component: KYCVerification,
  },
  {
    path: "/",
    Component: Layout,
    errorElement: <RootErrorElement />,
    children: [
      { 
        index: true, 
        element: <PermissionGuard permission={VIEW_FEED}><Feed /></PermissionGuard> 
      },
      {
        path: "sports",
        Component: SportsLayout,
        children: [
          { 
            index: true, 
            element: <PermissionGuard permission={VIEW_SPORTS}><SportsDashboard /></PermissionGuard> 
          },
          { 
            path: "register", 
            element: <PermissionGuard permission={REGISTER_SPORTS}><SportsRegistration /></PermissionGuard> 
          },
          { 
            path: "register/:eventId", 
            element: <PermissionGuard permission={REGISTER_SPORTS}><SportsRegister /></PermissionGuard> 
          },
          { 
            path: "schedule", 
            element: <PermissionGuard permission={VIEW_SPORTS}><SportsSchedule /></PermissionGuard> 
          },
          { 
            path: "auction", 
            element: <PermissionGuard permission={BIDDING_INTERFACE}><SportsAuction /></PermissionGuard> 
          },
          { 
            path: "auction/:eventId", 
            element: <PermissionGuard permission={BIDDING_INTERFACE}><SportsAuction /></PermissionGuard> 
          },
          { 
            path: "admin", 
            element: <PermissionGuard permission={MANAGE_TOURNAMENTS}><SportsAdmin /></PermissionGuard> 
          },
        ],
      },
      {
        path: "admin",
        children: [
          { 
            index: true, 
            element: <PermissionGuard permission={VIEW_ADMIN}><AdminDashboard /></PermissionGuard> 
          },
          { 
            path: "create-user", 
            element: <PermissionGuard permission={VIEW_ADMIN}><AdminCreateUser /></PermissionGuard> 
          },
          { 
            path: "bulk-upload", 
            element: <PermissionGuard permission={BULK_UPLOAD}><AdminBulkUpload /></PermissionGuard> 
          },
          { 
            path: "venues", 
            element: <PermissionGuard permission={VIEW_ADMIN}><AdminVenues /></PermissionGuard> 
          },
          { 
            path: "create-community", 
            element: <PermissionGuard permission={MANAGE_COMMUNITIES}><AdminCommunity /></PermissionGuard> 
          },
          { 
            path: "roles", 
            element: <PermissionGuard permission={MANAGE_ROLES}><AdminRoleManagement /></PermissionGuard> 
          },
        ]
      },
      { 
        path: "marketplace", 
        element: <PermissionGuard permission={VIEW_MARKETPLACE}><Marketplace /></PermissionGuard> 
      },
      { 
        path: "jobs", 
        element: <PermissionGuard permission={VIEW_JOBS}><Jobs /></PermissionGuard> 
      },
      { 
        path: "events", 
        element: <PermissionGuard permission={VIEW_EVENTS}><Events /></PermissionGuard> 
      },
      { 
        path: "profile", 
        Component: ProfileDashboard 
      },
    ],
  },
]);

