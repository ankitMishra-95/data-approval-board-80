
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "./Pagination";
import { WorkOrderPopup } from "./WorkOrderPopup";
import { generateMockData, type DataItem } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function DataTable() {
  const [data, setData] = useState<DataItem[]>([]);
  const [filteredData, setFilteredData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<DataItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [workOrderTypes, setWorkOrderTypes] = useState<string[]>([]);
  const [selectedWorkOrderType, setSelectedWorkOrderType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const itemsPerPage = 10;

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
    
    fetchData(currentPage);

    // Listen for filter change events from FilterBar
    const handleFilterChange = (event: CustomEvent) => {
      const { type, value } = event.detail;
      
      if (type === 'workOrderType') {
        setSelectedWorkOrderType(value);
        // Reset to first page when filter changes
        setCurrentPage(1);
      } else if (type === 'search') {
        setSearchQuery(value);
        // Reset to first page when search changes
        setCurrentPage(1);
      } else if (type === 'reset') {
        setSelectedWorkOrderType('');
        setSearchQuery('');
        // Reset to first page when filters are cleared
        setCurrentPage(1);
      }
    };

    // Provide workOrderTypes to FilterBar when requested
    const handleGetWorkOrderTypes = (event: CustomEvent) => {
      if (event.detail && event.detail.callback) {
        event.detail.callback(workOrderTypes);
      }
    };
    
    window.addEventListener('filterChange', handleFilterChange as EventListener);
    window.addEventListener('getWorkOrderTypes', handleGetWorkOrderTypes as EventListener);
    
    return () => {
      window.removeEventListener('filterChange', handleFilterChange as EventListener);
      window.removeEventListener('getWorkOrderTypes', handleGetWorkOrderTypes as EventListener);
    };
  }, [currentPage, workOrderTypes]);

  useEffect(() => {
    if (data.length > 0) {
      // Extract unique work order types
      const types = Array.from(new Set(data.map(item => item.workOrderType)));
      setWorkOrderTypes(types);
      
      // Apply filters to data
      applyFilters();
    }
  }, [data, selectedWorkOrderType, searchQuery]);

  const fetchData = async (page: number) => {
    setLoading(true);
    
    // Simulate API call with delay
    setTimeout(() => {
      const { data, total } = generateMockData(page, itemsPerPage);
      setData(data);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
      applyFilters(); // Apply filters immediately after data load
      setLoading(false);
    }, 800);
  };

  const applyFilters = () => {
    let filteredResults = [...data];
    
    // Apply work order type filter if selected
    if (selectedWorkOrderType) {
      filteredResults = filteredResults.filter(item => 
        item.workOrderType === selectedWorkOrderType
      );
    }
    
    // Apply search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredResults = filteredResults.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(query)
        )
      );
    }
    
    setFilteredData(filteredResults);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleApprove = (id: number) => {
    toast.success(`Work Order #${id} approved successfully`);
    const updatedData = data.map(item => 
      item.id === id ? { ...item, status: 'Approved' } : item
    );
    setData(updatedData);
    setIsPopupOpen(false);
  };

  const handleDisapprove = (id: number) => {
    toast.error(`Work Order #${id} rejected`);
    const updatedData = data.map(item => 
      item.id === id ? { ...item, status: 'Rejected' } : item
    );
    setData(updatedData);
    setIsPopupOpen(false);
  };

  const openWorkOrderPopup = (workOrder: DataItem) => {
    setSelectedWorkOrder(workOrder);
    setIsPopupOpen(true);
  };

  const closeWorkOrderPopup = () => {
    setIsPopupOpen(false);
  };

  const getCriticalityBadge = (criticality: string) => {
    const colors = {
      Critical: "bg-red-50 text-red-700 border-red-200",
      High: "bg-orange-50 text-orange-700 border-orange-200",
      Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      Low: "bg-blue-50 text-blue-700 border-blue-200",
      Minimal: "bg-green-50 text-green-700 border-green-200"
    };
    return (
      <Badge variant="outline" className={colors[criticality as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200"}>
        {criticality}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'Approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Determine which data to display (filtered or all)
  const displayData = (selectedWorkOrderType || searchQuery.trim()) ? filteredData : data;

  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Work Order</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Work Order Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer Account</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Lines</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service Level</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Criticality</th>
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
                <tr key={item.id} className="hover:bg-gray-50">
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => openWorkOrderPopup(item)}
                  >
                    {item.workOrderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.workOrderType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.customerAccount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.lines}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.serviceLevel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getCriticalityBadge(item.criticality)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.startDateTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(item.status)}
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
      
      <div className="py-3 px-6 bg-white border-t border-gray-200">
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
