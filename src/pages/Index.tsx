
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/data-table/DataTable";
import { FilterBar } from "@/components/data-table/FilterBar";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-blue-900">Work Orders Dashboard</h1>
          <FilterBar />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-blue-100">
          <DataTable />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
