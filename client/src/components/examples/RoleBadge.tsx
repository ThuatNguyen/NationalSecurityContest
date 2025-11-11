import RoleBadge from "../RoleBadge";

export default function RoleBadgeExample() {
  return (
    <div className="flex flex-wrap gap-3 p-6">
      <RoleBadge role="admin" />
      <RoleBadge role="cluster_leader" />
      <RoleBadge role="user" />
    </div>
  );
}
