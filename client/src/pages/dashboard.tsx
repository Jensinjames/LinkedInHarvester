import NavigationHeader from "@/components/navigation-header";
import StatusOverview from "@/components/status-overview";
import FileUploadSection from "@/components/file-upload-section";
import ProcessingProgress from "@/components/processing-progress";
import SidebarControls from "@/components/sidebar-controls";
import RecentJobsTable from "@/components/recent-jobs-table";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-bg-light">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatusOverview />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <FileUploadSection />
            <ProcessingProgress />
          </div>
          <div>
            <SidebarControls />
          </div>
        </div>
        
        <RecentJobsTable />
      </main>
    </div>
  );
}
