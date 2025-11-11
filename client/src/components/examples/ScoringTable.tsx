import ScoringTable from "../ScoringTable";

export default function ScoringTableExample() {
  const mockCriteria = [
    {
      id: "1",
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Chấp hành chủ trương, đường lối của Đảng, chính sách pháp luật của Nhà nước",
      maxScore: 1.0,
      selfScore: 0.9,
      clusterScore: 0.85,
      approvedScore: 0.85,
      comment: "Tốt"
    },
    {
      id: "2",
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Thực hiện Nghị quyết, Chỉ thị của cấp ủy, chính quyền địa phương",
      maxScore: 1.0,
    },
    {
      id: "3",
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Đảm bảo an ninh chính trị nội bộ",
      maxScore: 2.0,
      selfScore: 1.8,
    },
    {
      id: "4",
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Phòng, chống tội phạm và vi phạm pháp luật",
      maxScore: 3.0,
      selfScore: 2.5,
      clusterScore: 2.3,
    },
    {
      id: "5",
      groupName: "III. CÔNG TÁC XÂY DỰNG LỰC LƯỢNG",
      name: "Xây dựng lực lượng trong sạch, vững mạnh",
      maxScore: 2.0,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">User View (Chỉ chấm Tự chấm)</h3>
        <ScoringTable 
          role="user" 
          criteria={mockCriteria}
          onScoreChange={(id, field, value) => console.log("User score change:", id, field, value)}
        />
      </div>
    </div>
  );
}
