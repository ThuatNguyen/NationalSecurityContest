import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FilterPanelProps {
  role: "admin" | "cluster_leader" | "user";
  onFilterChange?: (filters: any) => void;
}

export default function FilterPanel({ role, onFilterChange }: FilterPanelProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-card border rounded-md">
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="filter-year" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
          Năm thi đua
        </Label>
        <Select defaultValue="2025" onValueChange={(value) => onFilterChange?.({ year: value })}>
          <SelectTrigger id="filter-year" data-testid="select-year">
            <SelectValue placeholder="Chọn năm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {role === "admin" && (
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter-cluster" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
            Cụm thi đua
          </Label>
          <Select defaultValue="all" onValueChange={(value) => onFilterChange?.({ cluster: value })}>
            <SelectTrigger id="filter-cluster" data-testid="select-cluster">
              <SelectValue placeholder="Chọn cụm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả cụm</SelectItem>
              <SelectItem value="1">Cụm 1: Công an xã, phường</SelectItem>
              <SelectItem value="2">Cụm 2: An ninh nhân dân</SelectItem>
              <SelectItem value="3">Cụm 3: Cảnh sát điều tra</SelectItem>
              <SelectItem value="4">Cụm 4: Quản lý hành chính</SelectItem>
              <SelectItem value="5">Cụm 5: Xây dựng lực lượng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(role === "admin" || role === "cluster_leader") && (
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter-unit" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
            Đơn vị
          </Label>
          <Select defaultValue="all" onValueChange={(value) => onFilterChange?.({ unit: value })}>
            <SelectTrigger id="filter-unit" data-testid="select-unit">
              <SelectValue placeholder="Chọn đơn vị" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đơn vị</SelectItem>
              <SelectItem value="1">Công an phường Đống Đa</SelectItem>
              <SelectItem value="2">Công an phường Ba Đình</SelectItem>
              <SelectItem value="3">Công an phường Hoàn Kiếm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="filter-status" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
          Trạng thái
        </Label>
        <Select defaultValue="all" onValueChange={(value) => onFilterChange?.({ status: value })}>
          <SelectTrigger id="filter-status" data-testid="select-status">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="self_scored">Đã tự chấm</SelectItem>
            <SelectItem value="cluster_scored">Đã chấm cụm</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="pending">Chưa hoàn thành</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
