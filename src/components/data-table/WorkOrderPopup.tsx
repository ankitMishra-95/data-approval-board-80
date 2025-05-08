
import { X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DataItem } from "@/lib/mock-data";

interface WorkOrderPopupProps {
  workOrder: DataItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function WorkOrderPopup({ 
  workOrder, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject 
}: WorkOrderPopupProps) {
  if (!workOrder) return null;
  
  const getPriorityBadge = (priority: string) => {
    const colors = {
      High: "bg-red-50 text-red-700 border-red-200",
      Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      Low: "bg-blue-50 text-blue-700 border-blue-200"
    };
    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
        {priority}
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Work Order {workOrder.workOrderNumber}</span>
            {getStatusBadge(workOrder.status)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1">{workOrder.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Department</h4>
                <p className="mt-1">{workOrder.department}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                <p className="mt-1">{getPriorityBadge(workOrder.priority)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Requested By</h4>
                <p className="mt-1">{workOrder.requestedBy}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                <p className="mt-1">{workOrder.assignedTo}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
              <p className="mt-1">{workOrder.dueDate}</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <DialogFooter className="sm:justify-between">
          <div className="text-sm text-gray-500">
            Status: {workOrder.status}
          </div>
          <div className="flex gap-2">
            {workOrder.status !== 'Rejected' && (
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
                onClick={() => onReject(workOrder.id)}
                disabled={workOrder.status === 'Rejected'}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
            {workOrder.status !== 'Approved' && (
              <Button 
                variant="outline" 
                className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200"
                onClick={() => onApprove(workOrder.id)}
                disabled={workOrder.status === 'Approved'}
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
