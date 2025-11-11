import { AppSidebar } from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="h-[600px] border rounded-md overflow-hidden">
        <SidebarProvider>
          <AppSidebar role="admin" userName="Nguyễn Văn A" unitName="Công an Hà Nội" />
        </SidebarProvider>
      </div>
    </div>
  );
}
