import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "./Pagination";
import { WorkOrderPopup } from "./WorkOrderPopup";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, Eye, CheckCircle, XCircle, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
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

interface FilterableColumn {
  field: string;
  label: string;
  type: string;
}

interface FilterValue {
  value: string;
  label: string;
  count: number;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

const AUTH_COOKIE_NAME = 'auth_token';

export function DataTable() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const itemsPerPage = 50;

  // Backend-driven filtering and sorting state
  const [filterableColumns, setFilterableColumns] = useState<FilterableColumn[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue[]>>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState<string | null>(null);

  // Track if the user has triggered sorting
  const [userSorted, setUserSorted] = useState(false);

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('activeFilters');
    if (savedFilters) setActiveFilters(JSON.parse(savedFilters));
    const savedSearch = localStorage.getItem('searchQuery');
    if (savedSearch) {
      setSearchQuery(savedSearch);
      setDebouncedSearchQuery(savedSearch);
    }
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage && !isNaN(Number(savedPage))) setCurrentPage(Number(savedPage));
    // Do NOT restore sortConfig on first load
    setIsInitialLoad(false);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch filterable columns on component mount
  useEffect(() => {
    fetchFilterableColumns();
  }, []);

  // Fetch filter values when filterable columns change
  useEffect(() => {
    if (Array.isArray(filterableColumns) && 
        filterableColumns.length > 0 && 
        filterableColumns.some(column => column.field && typeof column.field === 'string')) {
      fetchFilterValues();
    }
  }, [filterableColumns]);

  const fetchFilterableColumns = async () => {
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (!token) return;

      console.log('Fetching filterable columns from:', `${API_BASE_URL}/work_orders/columns/filterable`);

      const response = await fetch(`${API_BASE_URL}/work_orders/columns/filterable`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Filterable columns response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Filterable columns response data:', data);
        
        // Check if the response is an array or has a data property
        const columns = Array.isArray(data) ? data : (data.data || data.columns || []);
        console.log('Processed columns:', columns);
        
        if (Array.isArray(columns)) {
          console.log('Setting filterable columns:', columns);
          setFilterableColumns(columns);
        } else {
          console.error('Invalid filterable columns response:', data);
          setFilterableColumns([]);
        }
      } else {
        console.error('Failed to fetch filterable columns:', response.status);
        setFilterableColumns([]);
      }
    } catch (error) {
      console.error('Error fetching filterable columns:', error);
      setFilterableColumns([]);
    }
  };

  const fetchFilterValues = async () => {
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (!token) return;

      const filterValuesData: Record<string, FilterValue[]> = {};

      for (const column of filterableColumns) {
        // Skip if column.field is undefined or invalid
        if (!column.field || typeof column.field !== 'string') {
          console.warn('Skipping column with invalid field:', column);
          continue;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/work_orders/filter_values/${column.field}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            // Check if the response is an array or has a data property
            const values = Array.isArray(data) ? data : (data.data || data.values || []);
            if (Array.isArray(values)) {
              filterValuesData[column.field] = values;
            } else {
              console.error(`Invalid filter values response for ${column.field}:`, data);
              filterValuesData[column.field] = [];
            }
          } else {
            console.error(`Failed to fetch filter values for ${column.field}:`, response.status);
            filterValuesData[column.field] = [];
          }
        } catch (error) {
          console.error(`Error fetching filter values for ${column.field}:`, error);
          filterValuesData[column.field] = [];
        }
      }

      setFilterValues(filterValuesData);
    } catch (error) {
      console.error('Error fetching filter values:', error);
      setFilterValues({});
    }
  };

  // Fetch data for the current page only, with search/filter/sort as params
  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (!token) throw new Error('No authentication token found');
      
      const skip = (page - 1) * itemsPerPage;
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: itemsPerPage.toString(),
      });

      // Add search query
      if (debouncedSearchQuery.trim()) {
        params.append('search', debouncedSearchQuery.trim());
      }

      // Add filters
      Object.entries(activeFilters).forEach(([field, value]) => {
        if (value) {
          params.append(`filter_${field}`, value);
        }
      });

      // Add sorting only if userSorted is true
      if (userSorted && sortConfig && sortConfig.field && sortConfig.direction) {
        params.append('sort_by', sortConfig.field);
        params.append('sort_direction', sortConfig.direction);
      }

      const url = `${API_BASE_URL}/work_orders?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch work orders');
      
      const responseData: WorkOrderResponse = await response.json();
      setData(responseData.data);
      setTotalItems(responseData.count);
      const newTotalPages = Math.ceil(responseData.count / itemsPerPage);
      setTotalPages(newTotalPages);
      
      if (page > newTotalPages && newTotalPages > 0) {
        setCurrentPage(1);
        localStorage.setItem('currentPage', '1');
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error('Failed to load work orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when page, search, filters, or sort changes
  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem('currentPage', String(currentPage));
      localStorage.setItem('searchQuery', searchQuery);
      localStorage.setItem('activeFilters', JSON.stringify(activeFilters));
      if (sortConfig) {
        localStorage.setItem('sortConfig', JSON.stringify(sortConfig));
      }
      fetchData(currentPage);
    }
  }, [currentPage, debouncedSearchQuery, activeFilters, sortConfig, isInitialLoad]);

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem('currentPage', String(page));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    localStorage.setItem('searchQuery', value);
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value && value !== '__all__') {
      newFilters[field] = value;
    } else {
      delete newFilters[field];
    }
    setActiveFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: string) => {
    let newSortConfig: SortConfig;
    
    if (sortConfig?.field === field) {
      // Toggle direction if same field
      newSortConfig = {
        field,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      };
    } else {
      // New field, default to ascending
      newSortConfig = { field, direction: 'asc' };
    }
    setSortConfig(newSortConfig);
    setUserSorted(true);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSortConfig(null);
    localStorage.removeItem('activeFilters');
    localStorage.removeItem('searchQuery');
    localStorage.removeItem('sortConfig');
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortConfig?.field !== field) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const getColumnLabel = (field: string) => {
    const column = filterableColumns.find(col => col.field === field);
    return column?.label || field;
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery.trim() !== '';

  const handleApprove = (workOrderId: string) => {
    toast.success(`Work Order #${workOrderId} approved successfully`);
    const updatedData = data.map(item => 
      item.WorkOrderId === workOrderId ? { ...item, approval_status: 'Approved' } : item
    );
    setData(updatedData);
    setIsPopupOpen(false);
  };

  const handleDisapprove = (workOrderId: string) => {
    toast.error(`Work Order #${workOrderId} rejected`);
    const updatedData = data.map(item => 
      item.WorkOrderId === workOrderId ? { ...item, approval_status: 'Rejected' } : item
    );
    setData(updatedData);
    setIsPopupOpen(false);
  };

  const openWorkOrderPopup = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setIsPopupOpen(true);
  };

  const closeWorkOrderPopup = () => {
    setIsPopupOpen(false);
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
          
          {/* Dynamic Filter Dropdowns */}
          {Array.isArray(filterableColumns) && filterableColumns
            .filter(column => column.field && typeof column.field === 'string')
            .map((column) => (
            <div key={column.field} className="relative">
              <Select 
                value={activeFilters[column.field] || '__all__'} 
                onValueChange={(value) => handleFilterChange(column.field, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={`Filter by ${column.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All {column.label}</SelectItem>
                  {Array.isArray(filterValues[column.field]) && filterValues[column.field].map((filterValue) => (
                    <SelectItem key={filterValue.value} value={filterValue.value}>
                      {filterValue.label} ({filterValue.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs"
            >
              Clear All
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
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('WorkOrderId')}
                  >
                    <div className="flex items-center gap-1">
                      Work Order
                      {getSortIcon('WorkOrderId')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('WorkOrderTypeId')}
                  >
                    <div className="flex items-center gap-1">
                      Work Order Type
                      {getSortIcon('WorkOrderTypeId')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('WorkerGroupId')}
                  >
                    <div className="flex items-center gap-1">
                      Responsible Group
                      {getSortIcon('WorkerGroupId')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('Description')}
                  >
                    <div className="flex items-center gap-1">
                      Description
                      {getSortIcon('Description')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('CostType')}
                  >
                    <div className="flex items-center gap-1">
                      Cost Type
                      {getSortIcon('CostType')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ServiceLevel')}
                  >
                    <div className="flex items-center gap-1">
                      Service Level
                      {getSortIcon('ServiceLevel')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ExpectedStart')}
                  >
                    <div className="flex items-center gap-1">
                      Start Date/Time
                      {getSortIcon('ExpectedStart')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('approval_status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('approval_status')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-100 rounded w-24"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.length > 0 ? (
                  data.map((item) => (
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
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
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
