
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "./Pagination";
import { WorkOrderPopup } from "./WorkOrderPopup";
import { generateMockData, type DataItem } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function DataTable() {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<DataItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const fetchData = async (page: number) => {
    setLoading(true);
    
    // Simulate API call with delay
    setTimeout(() => {
      const { data, total } = generateMockData(page, itemsPerPage);
      setData(data);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
      setLoading(false);
    }, 800);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleApprove = (id: number) => {
    toast.success(`Work Order #${id} approved successfully`);
    setData(data.map(item => 
      item.id === id ? { ...item, status: 'Approved' } : item
    ));
    setIsPopupOpen(false);
  };

  const handleDisapprove = (id: number) => {
    toast.error(`Work Order #${id} rejected`);
    setData(data.map(item => 
      item.id === id ? { ...item, status: 'Rejected' } : item
    ));
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
            ) : (
              data.map((item) => (
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
