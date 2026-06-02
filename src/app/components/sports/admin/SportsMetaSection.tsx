import { AdminSportsMeta } from "../../admin/AdminSportsMeta";

interface SportsMetaSectionProps {
  isAdmin: boolean;
}

export function SportsMetaSection({ isAdmin }: SportsMetaSectionProps) {
  if (!isAdmin) return null;
  return <AdminSportsMeta isTab={true} />;
}
