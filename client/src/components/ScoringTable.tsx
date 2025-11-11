import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface Criteria {
  id: string;
  groupName: string;
  name: string;
  maxScore: number;
  selfScore?: number;
  clusterScore?: number;
  approvedScore?: number;
  comment?: string;
}

interface ScoringTableProps {
  role: "admin" | "cluster_leader" | "user";
  criteria: Criteria[];
  onScoreChange?: (criteriaId: string, field: string, value: any) => void;
}

export default function ScoringTable({ role, criteria, onScoreChange }: ScoringTableProps) {
  const [scores, setScores] = useState<Record<string, Criteria>>(
    criteria.reduce((acc, c) => ({ ...acc, [c.id]: c }), {})
  );

  const handleScoreChange = (criteriaId: string, field: string, value: any) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], [field]: value }
    }));
    onScoreChange?.(criteriaId, field, value);
    console.log(`Score changed for ${criteriaId}, ${field}:`, value);
  };

  const canEditSelfScore = role === "user";
  const canEditClusterScore = role === "cluster_leader" || role === "admin";
  const canEditApprovedScore = role === "admin";

  let currentGroup = "";

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-12">STT</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[150px]">Nhóm tiêu chí</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[250px]">Tiêu chí cụ thể</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-24">Điểm tối đa</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-24">Tự chấm</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-24">Cụm chấm</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-24">Điểm duyệt</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[200px]">Nhận xét</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((item, index) => {
              const showGroupHeader = item.groupName !== currentGroup;
              if (showGroupHeader) currentGroup = item.groupName;

              return (
                <>
                  {showGroupHeader && (
                    <tr className="bg-accent/50" key={`group-${item.groupName}`}>
                      <td colSpan={8} className="px-4 py-2 font-semibold text-sm">
                        {item.groupName}
                      </td>
                    </tr>
                  )}
                  <tr key={item.id} className="border-b hover-elevate" data-testid={`row-criteria-${item.id}`}>
                    <td className="px-4 py-3 text-sm text-center">{index + 1}</td>
                    <td className="px-4 py-3 text-sm"></td>
                    <td className="px-4 py-3 text-sm pl-8">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium" data-testid={`text-maxscore-${item.id}`}>
                      {item.maxScore}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        max={item.maxScore}
                        step="0.1"
                        value={scores[item.id]?.selfScore ?? ""}
                        onChange={(e) => handleScoreChange(item.id, "selfScore", parseFloat(e.target.value) || 0)}
                        disabled={!canEditSelfScore}
                        className="w-20 text-center border-0 focus-visible:ring-1"
                        data-testid={`input-selfscore-${item.id}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        max={item.maxScore}
                        step="0.1"
                        value={scores[item.id]?.clusterScore ?? ""}
                        onChange={(e) => handleScoreChange(item.id, "clusterScore", parseFloat(e.target.value) || 0)}
                        disabled={!canEditClusterScore}
                        className="w-20 text-center border-0 focus-visible:ring-1"
                        data-testid={`input-clusterscore-${item.id}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        max={item.maxScore}
                        step="0.1"
                        value={scores[item.id]?.approvedScore ?? ""}
                        onChange={(e) => handleScoreChange(item.id, "approvedScore", parseFloat(e.target.value) || 0)}
                        disabled={!canEditApprovedScore}
                        className="w-20 text-center border-0 focus-visible:ring-1"
                        data-testid={`input-approvedscore-${item.id}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Textarea
                        value={scores[item.id]?.comment ?? ""}
                        onChange={(e) => handleScoreChange(item.id, "comment", e.target.value)}
                        disabled={!canEditClusterScore}
                        placeholder="Nhập nhận xét..."
                        className="min-w-[200px] resize-none border-0 focus-visible:ring-1 min-h-[2.5rem]"
                        rows={1}
                        data-testid={`input-comment-${item.id}`}
                      />
                    </td>
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
