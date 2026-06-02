/**
 * Permission Constants — Single source of truth for the frontend.
 * Must stay in sync with Java: PermissionConstants.java
 *
 * @see com.manacommunity.api.constants.PermissionConstants
 */

// ──── COMMUNITY FEED ────
export const VIEW_FEED       = "View Feed";
export const CREATE_POST     = "Create Post";
export const DELETE_POST     = "Delete Post";
export const COMMENT_ON_POST = "Comment on Post";

// ──── SPORTS ────
export const VIEW_SPORTS        = "View Sports";
export const REGISTER_SPORTS    = "Register Sports";
export const MANAGE_TOURNAMENTS = "Manage Tournaments";
export const BIDDING_INTERFACE  = "Bidding Interface";

// ──── MARKETPLACE ────
export const VIEW_MARKETPLACE = "View Marketplace";
export const CREATE_LISTING   = "Create Listing";
export const DELETE_LISTING   = "Delete Listing";

// ──── JOBS & REFERRALS ────
export const VIEW_JOBS  = "View Jobs";
export const CREATE_JOB = "Create Job";
export const APPLY_JOB  = "Apply Job";

// ──── EVENTS ────
export const VIEW_EVENTS    = "View Events";
export const CREATE_EVENT   = "Create Event";
export const REGISTER_EVENT = "Register Event";

// ──── ADMIN DASHBOARD ────
export const VIEW_ADMIN         = "View Admin";
export const VERIFY_KYC         = "Verify KYC";
export const BULK_UPLOAD        = "Bulk Upload";
export const MANAGE_COMMUNITIES = "Manage Communities";
export const MANAGE_ROLES       = "Manage Roles";

/**
 * Permission categories grouped for the Role Management UI.
 * Used by AdminRoleManagement component.
 */
export const PERMISSION_CATEGORIES = [
  {
    id: "feed",
    title: "COMMUNITY FEED Permission",
    permissions: [VIEW_FEED, CREATE_POST, DELETE_POST, COMMENT_ON_POST],
  },
  {
    id: "sports",
    title: "SPORTS Permission",
    permissions: [VIEW_SPORTS, REGISTER_SPORTS, MANAGE_TOURNAMENTS, BIDDING_INTERFACE],
  },
  {
    id: "marketplace",
    title: "MARKETPLACE Permission",
    permissions: [VIEW_MARKETPLACE, CREATE_LISTING, DELETE_LISTING],
  },
  {
    id: "jobs",
    title: "JOBS & REFERRALS Permission",
    permissions: [VIEW_JOBS, CREATE_JOB, APPLY_JOB],
  },
  {
    id: "events",
    title: "EVENTS Permission",
    permissions: [VIEW_EVENTS, CREATE_EVENT, REGISTER_EVENT],
  },
  {
    id: "admin",
    title: "ADMIN DASHBOARD Permission",
    permissions: [VIEW_ADMIN, VERIFY_KYC, BULK_UPLOAD, MANAGE_COMMUNITIES, MANAGE_ROLES],
  },
] as const;
