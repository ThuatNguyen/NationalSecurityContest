import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

interface ManagementTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  addButtonText?: string;
}

export default function ManagementTable<T extends { id: string | number }>({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  searchPlaceholder = "Tìm kiếm...",
  addButtonText = "Thêm mới",
}: ManagementTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-3 flex-1 max-w-md">
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="flex-1"
            data-testid="input-search"
          />
          {onAdd && (
            <Button onClick={onAdd} data-testid="button-add">
              <Plus className="w-4 h-4 mr-2" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="border-b">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${col.width || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-24">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item, rowIdx) => (
                <tr key={item.id} className="border-b hover-elevate" data-testid={`row-item-${item.id}`}>
                  {columns.map((col, colIdx) => {
                    const keyString = String(col.key);
                    const value = keyString.includes('.') 
                      ? keyString.split('.').reduce((obj: any, key: string) => obj?.[key], item)
                      : (item as any)[col.key];
                    
                    return (
                      <td key={colIdx} className="px-4 py-3 text-sm">
                        {col.render ? col.render(value, item) : value}
                      </td>
                    );
                  })}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item)}
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Hiển thị {data.length} kết quả</p>
      </div>
    </div>
  );
}
