
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/data-table/DataTable";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Data Approval Dashboard</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <DataTable />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
