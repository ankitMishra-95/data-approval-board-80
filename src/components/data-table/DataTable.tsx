import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "./Pagination";
import { WorkOrderPopup } from "./WorkOrderPopup";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import Cookies from 'js-cookie';
import { format } from "date-fns";
import { API_BASE_URL } from "@/lib/constants";

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

export function DataTable() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [filteredData, setFilteredData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [workOrderTypes, setWorkOrderTypes] = useState<string[]>([]);
  const [selectedWorkOrderType, setSelectedWorkOrderType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const itemsPerPage = 50;

  useEffect(() => {
    // Load saved filter from localStorage
    const savedFilter = localStorage.getItem('workOrderTypeFilter');
    if (savedFilter) {
      setSelectedWorkOrderType(savedFilter);
    }
    
    // Load saved search query from localStorage
    const savedSearch = localStorage.getItem('searchQuery');
    if (savedSearch) {
      setSearchQuery(savedSearch);
    }

    // Load saved page from localStorage
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage && !isNaN(Number(savedPage))) {
      setCurrentPage(Number(savedPage));
    } else {
      setCurrentPage(1);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('currentPage', String(currentPage));
    fetchData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (data.length > 0) {
      // Extract unique work order types
      const types = Array.from(new Set(data.map(item => item.WorkOrderTypeId)));
      setWorkOrderTypes(types);
      
      // Filter and search only the current page's data
      let filteredResults = [...data];
      if (selectedWorkOrderType) {
        filteredResults = filteredResults.filter(item => item.WorkOrderTypeId === selectedWorkOrderType);
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredResults = filteredResults.filter(item => {
          const formattedDate = format(new Date(item.ExpectedStart), 'MMM d, yyyy').toLowerCase();
          return Object.entries(item).some(([key, value]) => {
            if (key === 'ExpectedStart') {
              return formattedDate.includes(query);
            }
            return value && value.toString().toLowerCase().includes(query);
          });
        });
      }
      setFilteredData(filteredResults);
      // If no results and a work order type filter is selected, clear the filter
      if (filteredResults.length === 0 && selectedWorkOrderType) {
        setSelectedWorkOrderType('');
        localStorage.removeItem('workOrderTypeFilter');
      }
    }
  }, [data, selectedWorkOrderType, searchQuery]);

  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (!token) {
        throw new Error('No authentication token found');
      }

      const skip = (page - 1) * itemsPerPage;
      const response = await fetch(`${API_BASE_URL}/work_orders?skip=${skip}&limit=${itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch work orders');
      }

      const responseData: WorkOrderResponse = await response.json();
      setData(responseData.data);
      setTotalItems(responseData.count);
      setTotalPages(Math.ceil(responseData.count / itemsPerPage));
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error("Failed to load work orders");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem('currentPage', String(page));
  };

  const handleApprove = (workOrderId: string) => {
    toast.success(`Work Order #${workOrderId} approved successfully`);
    const updatedData = data.map(item => 
      item.WorkOrderId === workOrderId ? { ...item, approval_status: 'Approved' } : item
    );
    setData(updatedData);
    setFilteredData(updatedData);
    setIsPopupOpen(false);
  };

  const handleDisapprove = (workOrderId: string) => {
    toast.error(`Work Order #${workOrderId} rejected`);
    const updatedData = data.map(item => 
      item.WorkOrderId === workOrderId ? { ...item, approval_status: 'Rejected' } : item
    );
    setData(updatedData);
    setFilteredData(updatedData);
    setIsPopupOpen(false);
  };

  const openWorkOrderPopup = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setIsPopupOpen(true);
  };

  const closeWorkOrderPopup = () => {
    setIsPopupOpen(false);
  };

  const handleWorkOrderTypeChange = (value: string) => {
    setSelectedWorkOrderType(value);
    localStorage.setItem('workOrderTypeFilter', value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    localStorage.setItem('searchQuery', value);
  };

  const clearFilters = () => {
    setSelectedWorkOrderType('');
    setSearchQuery('');
    localStorage.removeItem('workOrderTypeFilter');
    localStorage.removeItem('searchQuery');
  };

  const getCriticalityBadge = (criticality: string) => {
    const normalized = criticality.toUpperCase().trim();
    
    // Check for variations of critical
    if (normalized.includes('CRITICAL') || normalized === '1') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Critical</Badge>;
    }
    
    // Check for variations of high
    if (normalized.includes('HIGH') || normalized === '2') {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
    }
    
    // Check for variations of medium
    if (normalized.includes('MEDIUM') || normalized === '3') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
    }
    
    // Check for variations of low
    if (normalized.includes('LOW') || normalized === '4') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Low</Badge>;
    }
    
    // Check for variations of minimal
    if (normalized.includes('MINIMAL') || normalized === '5') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Minimal</Badge>;
    }
    
    // Default case
    return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{criticality}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const normalized = status.toUpperCase().trim();
    
    // Check for variations of each status
    if (normalized.includes('PENDING')) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
    if (normalized.includes('APPROVED')) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
    }
    if (normalized.includes('REJECTED')) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
    }
    if (normalized.includes('CANCELLED')) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
    }
    if (normalized.includes('FINISHED')) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Finished</Badge>;
    }
    
    // Default case
    return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Determine which data to display (filtered or all)
  const displayData = (selectedWorkOrderType || searchQuery.trim()) ? filteredData : data;

  return (
    <div className="w-full">
      <div className="mb-4 mt-4 flex flex-wrap gap-2 justify-end px-4">
        <div className="flex items-center relative">
          <Search className="absolute left-2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search all columns..." 
            className="pl-8 w-64"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select 
            value={selectedWorkOrderType} 
            onValueChange={handleWorkOrderTypeChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Work Order Type" />
            </SelectTrigger>
            <SelectContent>
              {workOrderTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(selectedWorkOrderType || searchQuery) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
      <div className="relative overflow-hidden">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Work Order</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Work Order Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer Account</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cost Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Start Date/Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-100 rounded w-24"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : displayData.length > 0 ? (
                  displayData.map((item) => (
                    <tr key={item.WorkOrderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => openWorkOrderPopup(item)}>
                        {item.WorkOrderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.WorkOrderTypeId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.WorkerGroupId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.Description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.CostType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.ServiceLevel}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(item.ExpectedStart)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(item.approval_status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                      No work orders found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="py-3 px-4 bg-white border-t border-gray-200">
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>

      <WorkOrderPopup
        workOrder={selectedWorkOrder}
        isOpen={isPopupOpen}
        onClose={closeWorkOrderPopup}
        onApprove={handleApprove}
        onReject={handleDisapprove}
      />
    </div>
  );
}
