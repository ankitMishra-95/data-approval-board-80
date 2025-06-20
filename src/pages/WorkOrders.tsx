import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Cookies from 'js-cookie';

// Interface matching the exact API response structure
interface WorkOrder {
  WorkOrderId: string;
  Description: string;
  WorkerGroupId: string;
  WorkOrderLifecycleStateId: string;
  WorkOrderTypeId: string;
  ExpectedStart: string;
  ExpectedEnd: string;
  CostType: string;
  ServiceLevel: number;
  Active: boolean;
  ScheduledStart: string;
  ScheduledEnd: string;
  ActualStart: string;
  ActualEnd: string;
  WorkOrderMaintenanceAssetCriticalityValue: number;
  dataAreaId: string;
  approval_status: string;
  is_summary_generated: boolean;
}

interface WorkOrderResponse {
  data: WorkOrder[];
  count: number;
  meta: {
    skip: number;
    limit: number;
  };
}

const AUTH_COOKIE_NAME = 'auth_token';
const ITEMS_PER_PAGE = 100;

const WorkOrders = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchWorkOrders(currentPage);
  }, [currentPage]);

  const fetchWorkOrders = async (page: number) => {
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (!token) {
        throw new Error('No authentication token found');
      }

      const skip = page * ITEMS_PER_PAGE;
      const response = await fetch(`https://dpc-api-g9hkfhaggbesd0fj.southeastasia-01.azurewebsites.net/api/work_orders?skip=${skip}&limit=${ITEMS_PER_PAGE}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch work orders');
      }

      const data: WorkOrderResponse = await response.json();
      setWorkOrders(data.data);
      setTotalCount(data.count);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error("Failed to load work orders");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <div className="text-sm text-gray-600">
          Total Work Orders: {totalCount}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lifecycle State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Start
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected End
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workOrders.map((workOrder) => (
                <tr key={workOrder.WorkOrderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {workOrder.WorkOrderId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                    {workOrder.Description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workOrder.WorkerGroupId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${workOrder.WorkOrderLifecycleStateId.toLowerCase() === 'finished' ? 'bg-green-100 text-green-800' :
                        workOrder.WorkOrderLifecycleStateId.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'}`}>
                      {workOrder.WorkOrderLifecycleStateId}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workOrder.WorkOrderTypeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(workOrder.ExpectedStart).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(workOrder.ExpectedEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workOrder.CostType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workOrder.ServiceLevel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full
                      ${workOrder.approval_status.toUpperCase().includes('PENDING') ? 'bg-yellow-100 text-yellow-800' :
                        workOrder.approval_status.toUpperCase().includes('APPROVED') ? 'bg-green-100 text-green-800' :
                        workOrder.approval_status.toUpperCase().includes('REJECTED') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {workOrder.approval_status}
                    </span>
                  </td>
                </tr>
              ))}
              {workOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    No work orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <button
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
          disabled={currentPage >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default WorkOrders; 