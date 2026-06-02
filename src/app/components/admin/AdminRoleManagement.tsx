import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  Users,
  Search,
  UserPlus,
  ArrowLeft,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Check,
  Building,
  Mail,
  Phone,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  X,
  Key,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { userService } from "../../../services/userService";
import { useAuth } from "../../../contexts/AuthContext";
import { communityService } from "../../../services/communityService";
import { PERMISSION_CATEGORIES, MANAGE_COMMUNITIES as PERM_MANAGE_COMMUNITIES } from "../../../constants/permissions";
import type { CommunityResponse } from "../../../types/api";

// --- TYPES ---
interface UserItem {
  id: number;
  name: string;
  email: string;
  contact: string;
  role: string;
  status: "Active" | "Inactive";
  date: string;
  permissions?: string[];
}

interface PermissionCategory {
  id: string;
  title: string;
  permissions: string[];
}

// --- CONFIG ---
const permissionCategories = PERMISSION_CATEGORIES;

export function AdminRoleManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManageCommunities = user?.role === "SUPER_ADMIN" || (user?.permissions || []).includes(PERM_MANAGE_COMMUNITIES);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // STATE MANAGEMENT
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [selectedCommId, setSelectedCommId] = useState<number | "">("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [currentView, setCurrentView] = useState<'list' | 'editRole'>('list');
  const [editingRole, setEditingRole] = useState<string>('Cashier');
  const [editingRoleName, setEditingRoleName] = useState<string>('Cashier');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // Custom Roles & Tab States
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const loadPermissions = async () => {
    try {
      const dbPerms = await userService.getRolePermissions();
      const mappedPerms: Record<string, Record<string, boolean>> = {};
      
      Object.entries(dbPerms).forEach(([role, perms]) => {
        const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        mappedPerms[normalizedRole] = {};
        perms.forEach((p) => {
          mappedPerms[normalizedRole][p] = true;
        });
      });
      
      setRolePermissions(mappedPerms);
    } catch (err) {
      toast.error("Failed to load role permissions from database");
    }
  };

  const loadRoles = async () => {
    try {
      const data = await userService.getRoles();
      setRoles(data);
    } catch (err) {
      toast.error("Failed to load security roles from database");
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      communityService.getCommunities().then(setCommunities).catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadUsers(selectedCommId);
  }, [selectedCommId]);

  useEffect(() => {
    loadPermissions();
    loadRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    setIsCreatingRole(true);
    try {
      const created = await userService.createRole(newRoleName);
      setRoles((prev) => [...prev, created]);
      
      const normalizedRole = created.name.charAt(0).toUpperCase() + created.name.slice(1).toLowerCase();
      // Initialize empty permissions map for this role
      setRolePermissions((prev) => ({
        ...prev,
        [normalizedRole]: {}
      }));
      
      toast.success(`Role "${created.name}" created successfully!`);
      setNewRoleName("");
      setIsCreateRoleOpen(false);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to create role";
      toast.error(errorMsg);
    } finally {
      setIsCreatingRole(false);
    }
  };

  const loadUsers = async (commId?: number | "") => {
    setLoading(true);
    try {
      const activeCommId = commId !== undefined ? commId : selectedCommId;
      const data = (isSuperAdmin && activeCommId) 
        ? await userService.getCommunityUsers(Number(activeCommId))
        : await userService.getAllUsers();
      const mapped = data.map((u) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        contact: u.phone,
        role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1).toLowerCase()) : "Member",
        status: u.isActive ? ("Active" as const) : ("Inactive" as const),
        date: u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "Unknown",
        permissions: u.permissions,
      }));
      setUsers(mapped);
    } catch (err) {
      toast.error("Failed to load users from database");
    } finally {
      setLoading(false);
    }
  };

  // SEARCH AND FILTER
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.contact.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    inactive: users.filter((u) => u.status === 'Inactive').length,
    rolesCount: Array.from(new Set(users.map((u) => u.role))).length,
  };

  // HANDLERS
  const handleToggleUserStatus = async (userId: number) => {
    try {
      await userService.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
            toast.success(`Status of ${u.name} set to ${newStatus}`);
            return { ...u, status: newStatus };
          }
          return u;
        })
      );
    } catch (err) {
      toast.error("Failed to update status in database");
    }
  };

  const handleEditRole = (roleName: string, userId?: number) => {
    setEditingRole(roleName);
    setEditingRoleName(roleName);
    setEditingUserId(userId || null);
    
    // Check if we are editing a specific user and that user has custom permissions
    const targetUser = userId ? users.find((u) => u.id === userId) : null;
    
    if (targetUser && targetUser.permissions && targetUser.permissions.length > 0) {
      const userPermsObj: Record<string, boolean> = {};
      targetUser.permissions.forEach((p) => {
        userPermsObj[p] = true;
      });
      setRolePermissions((prev) => ({
        ...prev,
        [roleName]: userPermsObj,
      }));
    } else {
      // Initialize permissions for this role in state if not exists
      if (!rolePermissions[roleName]) {
        setRolePermissions((prev) => ({
          ...prev,
          [roleName]: {}
        }));
      }
    }
    setCurrentView('editRole');
  };

  const handleTogglePermission = (role: string, permission: string) => {
    setRolePermissions((prev) => {
      const rolePerms = prev[role] ? { ...prev[role] } : {};
      rolePerms[permission] = !rolePerms[permission];
      return {
        ...prev,
        [role]: rolePerms
      };
    });
  };

  const handleSelectAllCategory = (role: string, categoryId: string, selectAll: boolean) => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return;

    setRolePermissions((prev) => {
      const rolePerms = prev[role] ? { ...prev[role] } : {};
      category.permissions.forEach((perm) => {
        rolePerms[perm] = selectAll;
      });
      return {
        ...prev,
        [role]: rolePerms
      };
    });
  };

  const handleUpdateRole = async () => {
    if (!editingRoleName.trim()) {
      toast.error("Role Name cannot be empty");
      return;
    }

    try {
      const rolePermsObj = rolePermissions[editingRole] || {};
      const checkedPerms = Object.keys(rolePermsObj).filter((k) => !!rolePermsObj[k]);

      // Save permissions to database with normalized uppercase role name and optional userId
      await userService.updateRolePermissions(editingRoleName.toUpperCase(), checkedPerms, editingUserId || undefined);

      setRolePermissions((prev) => {
        const copy = { ...prev };
        if (editingRoleName !== editingRole) {
          copy[editingRoleName] = rolePermsObj;
          delete copy[editingRole];
        } else {
          copy[editingRoleName] = rolePermsObj;
        }
        return copy;
      });

      if (editingRoleName !== editingRole) {
        setUsers((prev) =>
          prev.map((u) => (u.role === editingRole ? { ...u, role: editingRoleName } : u))
        );
      }

      toast.success(`Updated role and permissions for ${editingRoleName}`);
      setCurrentView('list');
    } catch (err) {
      toast.error("Failed to update role permissions in database");
    }
  };

  const isCategoryAllSelected = (role: string, categoryId: string): boolean => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return false;
    const rolePerms = rolePermissions[role] || {};
    return category.permissions.every((perm) => !!rolePerms[perm]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <Toaster position="top-center" richColors />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentView === 'editRole') {
                setCurrentView('list');
              } else {
                navigate("/admin");
              }
            }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-indigo-600 animate-pulse" />
              {currentView === 'list'
                ? "Community Users & Roles"
                : `Edit Role: ${editingRole}`}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {currentView === 'list'
                ? "Manage users, toggle access status, and configure role-based permissions"
                : "Assign granular action permissions to this security role"}
            </p>
          </div>
        </div>

        {currentView === 'list' && (
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <select
                value={selectedCommId}
                onChange={(e) => setSelectedCommId(e.target.value ? Number(e.target.value) : "")}
                className="px-4 py-2 bg-[#0c1220] border border-[#2a3a5c] rounded-lg text-[#f1f5f9] text-sm font-medium focus:border-[#f97316] outline-none active:scale-95 cursor-pointer shadow-sm"
              >
                <option value="" className="bg-[#0c1220]">All Communities</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0c1220]">
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              Create Role
            </button>
            <button
              onClick={() => navigate("/admin/create-user")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Create User
            </button>
            {canManageCommunities && (
              <button
                onClick={() => navigate("/admin/create-community")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Building className="w-4 h-4" />
                Create Community
              </button>
            )}
          </div>
        )}
      </div>

      {currentView === 'list' ? (
        <>
          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", val: stats.total, color: "border-slate-200 bg-white text-slate-900", icon: Users, iconColor: "text-slate-600" },
              { label: "Active Status", val: stats.active, color: "border-green-200 bg-white text-green-700", icon: UserCheck, iconColor: "text-green-600" },
              { label: "Inactive Status", val: stats.inactive, color: "border-red-200 bg-white text-red-700", icon: UserX, iconColor: "text-red-600" },
              { label: "Security Roles", val: stats.rolesCount, color: "border-indigo-200 bg-white text-indigo-700", icon: Shield, iconColor: "text-indigo-600" },
            ].map((stat, idx) => (
              <div key={idx} className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md flex items-center justify-between ${stat.color}`}>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">{stat.label}</span>
                  <span className="text-2xl font-bold mt-1 block">{stat.val}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            ))}
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex border-b border-slate-200 gap-4 mt-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 text-sm font-bold border-b-2 px-1 transition-colors ${
                activeTab === 'users'
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Users Directory
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-3 text-sm font-bold border-b-2 px-1 transition-colors flex items-center gap-1.5 ${
                activeTab === 'roles'
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Shield className="w-4 h-4" />
              Security Roles Directory
            </button>
          </div>

          {activeTab === 'users' ? (
            <>
              {/* SEARCH & FILTER BAR */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search user, email, contact, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
                  {(['all', 'Active', 'Inactive'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                        statusFilter === filter
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {filter === 'all' ? 'All Users' : `${filter} Status`}
                    </button>
                  ))}
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">User & Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Assigned Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-450 font-medium">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            Loading users from app_user database...
                          </td>
                        </tr>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* User & Name */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-inner">
                                  {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 block">{user.name}</span>
                                  <span className="text-[11px] text-slate-400">Joined {user.date}</span>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {user.email}
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {user.contact}
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                <Shield className="w-3 h-3 text-indigo-500" />
                                {user.role}
                              </span>
                            </td>

                            {/* Status Toggle */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleUserStatus(user.id)}
                                title="Click to toggle status"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer select-none transition-all active:scale-95 ${
                                  user.status === 'Active'
                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                {user.status}
                              </button>
                            </td>

                            {/* Action buttons */}
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedUser(user)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200"
                                  title="View User Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditRole(user.role, user.id)}
                                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors border border-indigo-100"
                                  title="Configure Permissions"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                            <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
                            No community users found matching filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mock Pagination */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Showing {filteredUsers.length} of {users.length} users</span>
                  <div className="flex items-center gap-1">
                    <button disabled className="px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-400 cursor-not-allowed">Previous</button>
                    <button className="px-2.5 py-1.5 bg-indigo-600 border border-indigo-600 text-white rounded font-medium">1</button>
                    <button className="px-2.5 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50">2</button>
                    <button className="px-2.5 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50">Next</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* SECURITY ROLES DIRECTORY GRID */
            <div className="space-y-6">
              {/* Stats Block for Roles */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Security Profile & Template Directory</h4>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">
                      Configure base permission templates or define new operational roles to govern community access.
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  Total Active System Roles: <span className="font-extrabold text-indigo-700">{roles.length}</span>
                </div>
              </div>

              {/* Roles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roles.map((role) => {
                  const assignedUsersCount = users.filter(u => u.role.toUpperCase() === role.name.toUpperCase()).length;
                  return (
                    <div
                      key={role.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between group relative animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      {/* Top Accent Gradient Bar */}
                      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
                      
                      <div className="p-5 flex-grow">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="p-2.5 bg-indigo-50 text-indigo-750 rounded-xl border border-indigo-100 group-hover:scale-110 transition-transform">
                            <Shield className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                            ID: {role.id}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-base uppercase tracking-wide group-hover:text-indigo-600 transition-colors">
                          {role.name.replace("_", " ")}
                        </h4>
                        
                        <p className="text-slate-450 text-[11px] mt-1 font-semibold leading-relaxed">
                          Operational System Role Profile
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-450 block font-bold uppercase tracking-wider text-[10px]">Assigned Users:</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                            <Users className="w-3 h-3 text-emerald-600" />
                            {assignedUsersCount} Users
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditRole(role.name.charAt(0).toUpperCase() + role.name.slice(1).toLowerCase())}
                          className="w-full py-2 bg-white hover:bg-indigo-55 text-indigo-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Configure Template
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Create Custom Role Card */}
                <button
                  onClick={() => setIsCreateRoleOpen(true)}
                  className="bg-slate-50/50 hover:bg-slate-50 border-2 border-dashed border-slate-250 hover:border-indigo-400 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer group min-h-[220px]"
                >
                  <div className="p-3 bg-white text-slate-450 group-hover:text-indigo-600 border border-slate-200 group-hover:border-indigo-150 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">Create Custom Role</h5>
                    <p className="text-slate-450 text-xs mt-1 max-w-[180px] font-semibold leading-relaxed">Add a new security role class to the database</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* EDIT ROLE PERMISSIONS VIEW */
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
          {/* Subheader */}
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 shadow-sm">
                <Key className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-850 text-lg">Role Security Identification</h3>
                <p className="text-slate-400 text-xs mt-0.5">Customize the role descriptor name and granular actions mapping</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Role Name:</label>
              <input
                type="text"
                value={editingRoleName}
                onChange={(e) => setEditingRoleName(e.target.value)}
                placeholder="e.g. Cashier"
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-52 font-medium"
              />
            </div>
          </div>
          
          {/* User Details display if we are editing a user's permissions */}
          {editingUserId && (
            (() => {
              const userBeingEdited = users.find(u => u.id === editingUserId);
              if (!userBeingEdited) return null;
              return (
                <div className="mx-6 mt-6 px-5 py-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center font-bold text-indigo-700 text-sm">
                      {userBeingEdited.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                        Editing User-Specific Permissions: <span className="text-indigo-600 font-extrabold">{userBeingEdited.name}</span>
                      </h4>
                      <p className="text-indigo-800/80 text-xs mt-0.5 font-medium">
                        Email: {userBeingEdited.email} • Assigned Role: <span className="font-bold uppercase text-indigo-700">{userBeingEdited.role}</span>
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm self-start sm:self-center">
                    User-Specific Access Policy
                  </div>
                </div>
              );
            })()
          )}

          {/* Permissions Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
            {permissionCategories.map((category) => {
              const allChecked = isCategoryAllSelected(editingRole, category.id);
              const rolePerms = rolePermissions[editingRole] || {};

              return (
                <div key={category.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Category Header */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-750 flex items-center gap-2">
                      <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                      {category.title}
                    </h4>
                    <label className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => handleSelectAllCategory(editingRole, category.id, e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      Select All
                    </label>
                  </div>

                  {/* Permissions Checklist */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {category.permissions.map((perm) => (
                      <label
                        key={perm}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          !!rolePerms[perm]
                            ? "bg-indigo-50/40 border-indigo-100 text-indigo-950 font-medium"
                            : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!rolePerms[perm]}
                          onChange={() => handleTogglePermission(editingRole, perm)}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span>{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-white">
            <button
              onClick={() => setCurrentView('list')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRole}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              Update Role
            </button>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-250" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-5">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {selectedUser.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-bold">{selectedUser.name}</h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 text-[11px] font-semibold tracking-wider uppercase text-white mt-1">
                    <Shield className="w-3 h-3" />
                    {selectedUser.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-450 block font-medium">Email Address</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold break-all">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {selectedUser.email}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-450 block font-medium">Phone / Contact</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {selectedUser.contact}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-450 block font-medium">User Status</span>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedUser.status === 'Active'
                        ? "bg-green-150 text-green-700"
                        : "bg-red-150 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {selectedUser.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-450 block font-medium">Date Registered</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedUser.date}
                  </div>
                </div>

                <div className="space-y-1 col-span-2 border-t border-slate-100 pt-3">
                  <span className="text-slate-450 block font-medium">Change Security Role Assignment</span>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={selectedUser.role}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        try {
                          await userService.updateUserRole(selectedUser.id, newRole);
                          toast.success(`Role of ${selectedUser.name} updated to ${newRole}`);
                          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
                          setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
                        } catch (err) {
                          toast.error("Failed to update user role on database");
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      {["Admin", "Cashier", "Staff", "Member", "Vendor"].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Permissions Tags */}
              <div className="border-t border-slate-100 pt-4">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Active Permissions Assigned ({Object.keys(rolePermissions[selectedUser.role] || {}).filter(k => !!rolePermissions[selectedUser.role][k]).length})
                </h5>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
                  {Object.keys(rolePermissions[selectedUser.role] || {}).some(k => !!rolePermissions[selectedUser.role][k]) ? (
                    Object.keys(rolePermissions[selectedUser.role] || {})
                      .filter((key) => !!rolePermissions[selectedUser.role][key])
                      .map((perm) => (
                        <span key={perm} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 shadow-sm">
                          <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                          {perm}
                        </span>
                      ))
                  ) : (
                    <span className="text-xs text-slate-400 p-2 italic w-full text-center">No explicit permissions checked for this role.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CREATE CUSTOM ROLE MODAL */}
      {isCreateRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCreateRoleOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateRole}>
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-indigo-650 text-white px-6 py-5 flex items-center gap-3 relative">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="absolute top-4 right-4 p-1.5 text-indigo-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold">Create Custom Security Role</h4>
                  <p className="text-emerald-100 text-xs mt-0.5 font-medium">Add a new access policy to govern the community</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Role Identity Name</label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Coach, Auditor, Treasurer"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-semibold"
                  />
                  <span className="text-[10px] text-slate-450 block pt-0.5 leading-relaxed font-semibold">
                    Role names are normalized to uppercase (e.g. COACH) and saved as security identities in the active database.
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  {isCreatingRole ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Role
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
