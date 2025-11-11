import FilterPanel from "../FilterPanel";

export default function FilterPanelExample() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Admin Filter</h3>
        <FilterPanel role="admin" onFilterChange={(filters) => console.log("Filters changed:", filters)} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Cluster Leader Filter</h3>
        <FilterPanel role="cluster_leader" onFilterChange={(filters) => console.log("Filters changed:", filters)} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">User Filter</h3>
        <FilterPanel role="user" onFilterChange={(filters) => console.log("Filters changed:", filters)} />
      </div>
    </div>
  );
}
