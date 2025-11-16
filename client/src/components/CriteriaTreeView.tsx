import React, { useState } from "react";
import { ChevronRight, ChevronDown, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CriteriaWithChildren } from "@shared/schema";

interface CriteriaTreeNodeProps {
  criteria: CriteriaWithChildren;
  level: number;
  onEdit?: (criteria: CriteriaWithChildren) => void;
  onDelete?: (criteria: CriteriaWithChildren) => void;
  onAddChild?: (parentCriteria: CriteriaWithChildren) => void;
  onScore?: (criteria: CriteriaWithChildren) => void;
  isEditable?: boolean;
  scores?: { [criteriaId: string]: number };
}

/**
 * Component hiển thị một node trong cây tiêu chí
 */
export function CriteriaTreeNode({
  criteria,
  level,
  onEdit,
  onDelete,
  onAddChild,
  onScore,
  isEditable = true,
  scores = {}
}: CriteriaTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = criteria.children && criteria.children.length > 0;
  const isLeaf = !hasChildren;
  const score = scores[criteria.id];
  
  const getCriteriaTypeLabel = (type: number) => {
    switch (type) {
      case 1: return "Định lượng";
      case 2: return "Định tính";
      case 3: return "Chấm thẳng";
      case 4: return "Cộng/Trừ";
      default: return "Khác";
    }
  };
  
  const getCriteriaTypeBadgeColor = (type: number) => {
    switch (type) {
      case 1: return "bg-blue-500";
      case 2: return "bg-green-500";
      case 3: return "bg-purple-500";
      case 4: return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };
  
  const getFormulaTypeLabel = (formulaType?: number) => {
    if (!formulaType) return "";
    switch (formulaType) {
      case 1: return "Không đạt";
      case 2: return "Đạt đủ";
      case 3: return "Dẫn đầu";
      case 4: return "Vượt chưa dẫn";
      default: return "";
    }
  };
  
  return (
    <div className="criteria-tree-node">
      <div 
        className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
          isLeaf && onScore ? "cursor-pointer hover:bg-blue-100 hover:border-blue-400" : "hover:bg-muted/50"
        } ${
          level === 1 ? "bg-blue-50 border-blue-200" : 
          level === 2 ? "bg-green-50 border-green-200" :
          level === 3 ? "bg-yellow-50 border-yellow-200" :
          "bg-gray-50 border-gray-200"
        }`}
        style={{ marginLeft: `${(level - 1) * 24}px` }}
        onClick={() => isLeaf && onScore && onScore(criteria)}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white rounded transition-colors"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>
        
        {/* Criteria info */}
        <div className="flex-1 flex items-center gap-3">
          {/* Code & Name */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {criteria.code && (
                <span className="font-bold text-sm">{criteria.code}</span>
              )}
              <span className="font-medium">{criteria.name}</span>
            </div>
            {criteria.description && (
              <p className="text-sm text-muted-foreground mt-1">{criteria.description}</p>
            )}
          </div>
          
          {/* Type badge - only show for leaf nodes (type > 0) */}
          {criteria.criteriaType > 0 && (
            <Badge className={`${getCriteriaTypeBadgeColor(criteria.criteriaType)} text-white`}>
              {getCriteriaTypeLabel(criteria.criteriaType)}
            </Badge>
          )}
          
          {/* Formula type (for quantitative) */}
          {criteria.criteriaType === 1 && criteria.formulaType && (
            <Badge variant="outline" className="text-xs">
              {getFormulaTypeLabel(criteria.formulaType)}
            </Badge>
          )}
          
          {/* Max score & actual score */}
          <div className="text-right min-w-[120px]">
            {score !== undefined && (
              <div className="text-lg font-bold text-green-600 mb-1">
                {score.toFixed(2)} đ
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Tối đa: {Number(criteria.maxScore).toFixed(2)} đ
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        {isEditable && (
          <div className="flex items-center gap-1">
            {onAddChild && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onAddChild(criteria)}
                title="Thêm tiêu chí con"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(criteria)}
                title="Sửa"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(criteria)}
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {criteria.children!.map((child) => (
            <CriteriaTreeNode
              key={child.id}
              criteria={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onScore={onScore}
              isEditable={isEditable}
              scores={scores}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CriteriaTreeViewProps {
  tree: CriteriaWithChildren[];
  onEdit?: (criteria: CriteriaWithChildren) => void;
  onDelete?: (criteria: CriteriaWithChildren) => void;
  onAddChild?: (parentCriteria: CriteriaWithChildren) => void;
  onScore?: (criteria: CriteriaWithChildren) => void;
  isEditable?: boolean;
  scores?: { [criteriaId: string]: number };
  emptyMessage?: string;
}

/**
 * Component hiển thị toàn bộ cây tiêu chí
 */
export function CriteriaTreeView({
  tree,
  onEdit,
  onDelete,
  onAddChild,
  onScore,
  isEditable = true,
  scores = {},
  emptyMessage = "Chưa có tiêu chí nào"
}: CriteriaTreeViewProps) {
  if (tree.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className="criteria-tree-view space-y-3">
      {tree.map((criteria) => (
        <CriteriaTreeNode
          key={criteria.id}
          criteria={criteria}
          level={1}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onScore={onScore}
          isEditable={isEditable}
          scores={scores}
        />
      ))}
    </div>
  );
}

/**
 * Component hiển thị tổng hợp điểm từ cây tiêu chí
 */
export function CriteriaScoreSummary({
  tree,
  scores
}: {
  tree: CriteriaWithChildren[];
  scores: { [criteriaId: string]: number };
}) {
  const calculateTreeTotal = (nodes: CriteriaWithChildren[]): number => {
    let total = 0;
    
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        // Node cha: tổng điểm các con
        total += calculateTreeTotal(node.children);
      } else {
        // Node lá: lấy điểm từ scores
        total += scores[node.id] || 0;
      }
    }
    
    return total;
  };
  
  const total = calculateTreeTotal(tree);
  
  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-blue-900">Tổng điểm:</span>
        <span className="text-2xl font-bold text-blue-600">
          {total.toFixed(2)} điểm
        </span>
      </div>
    </div>
  );
}
