
import { X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
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
  const [checkedSections, setCheckedSections] = useState({
    technical: false,
    service: false,
    customer: false
  });
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  
  const allSectionsChecked = 
    checkedSections.technical && 
    checkedSections.service && 
    checkedSections.customer;

  const handleCheckSection = (section: 'technical' | 'service' | 'customer', checked: boolean) => {
    setCheckedSections(prev => ({
      ...prev,
      [section]: checked
    }));
  };

  const handleConfirmAction = () => {
    if (!workOrder || !actionType) return;
    
    if (actionType === 'approve') {
      onApprove(workOrder.id);
    } else {
      onReject(workOrder.id);
    }
    
    setConfirmDialogOpen(false);
    setActionType(null);
  };

  const initiateAction = (type: 'approve' | 'reject') => {
    setActionType(type);
    setConfirmDialogOpen(true);
  };

  if (!workOrder) return null;
  
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[85vw] max-w-7xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Work Order Details</span>
              {getStatusBadge(workOrder.status)}
            </DialogTitle>
            <DialogDescription>
              Details for work order {workOrder.workOrderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid grid-cols-3 gap-4">
              {/* First row */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Work Order Type</h4>
                <p className="mt-1">{workOrder.workOrderType}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Customer Account</h4>
                <p className="mt-1">{workOrder.customerAccount}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1">{workOrder.description}</p>
              </div>
              
              {/* Second row */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Lines</h4>
                <p className="mt-1">{workOrder.lines}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Service Level</h4>
                <p className="mt-1">{workOrder.serviceLevel}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Criticality</h4>
                <p className="mt-1">{getCriticalityBadge(workOrder.criticality)}</p>
              </div>
              
              {/* Third row */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Start Date/Time</h4>
                <p className="mt-1">{workOrder.startDateTime}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Requested By</h4>
                <p className="mt-1">{workOrder.requestedBy}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Assigned To / Due Date</h4>
                <p className="mt-1">{workOrder.assignedTo} / {workOrder.dueDate}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="py-4">
            <h3 className="text-lg font-semibold mb-2">Required Reviews</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="technical-details">
                <AccordionTrigger className="text-base font-medium">
                  Standard Operating Procedures Summary
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p>This work order requires special equipment and trained personnel to handle the {workOrder.workOrderType.toLowerCase()} process. The technical complexity is rated as {workOrder.criticality}, requiring appropriate safety measures and expertise.</p>
                    <p>Previous service history indicates recurring issues with this particular customer account that should be taken into consideration during the service delivery.</p>
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox 
                        id="technical-checkbox" 
                        checked={checkedSections.technical}
                        onCheckedChange={(checked) => handleCheckSection('technical', checked === true)}
                      />
                      <label 
                        htmlFor="technical-checkbox" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I have reviewed the standard operating procedures
                      </label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="service-requirements">
                <AccordionTrigger className="text-base font-medium">
                  Operating Experiences Summary
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p>This {workOrder.serviceLevel} level service requires attention within {workOrder.criticality === 'Critical' ? '24 hours' : workOrder.criticality === 'High' ? '48 hours' : '72 hours'} of the reported issue.</p>
                    <p>Customer has requested specific handling procedures and has a {workOrder.serviceLevel} SLA that guarantees response times and quality assurance measures.</p>
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox 
                        id="service-checkbox" 
                        checked={checkedSections.service}
                        onCheckedChange={(checked) => handleCheckSection('service', checked === true)}
                      />
                      <label 
                        htmlFor="service-checkbox" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I have reviewed the operating experiences
                      </label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="customer-history">
                <AccordionTrigger className="text-base font-medium">
                  Human Performance Tools
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p>Customer {workOrder.customerAccount} has been with our service for {Math.floor(Math.random() * 8) + 1} years. They typically require {workOrder.workOrderType} services on a quarterly basis.</p>
                    <p>Previous interactions indicate a preference for detailed explanations of work performed and advance notification of any potential delays.</p>
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox 
                        id="customer-checkbox" 
                        checked={checkedSections.customer}
                        onCheckedChange={(checked) => handleCheckSection('customer', checked === true)}
                      />
                      <label 
                        htmlFor="customer-checkbox" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I have reviewed the human performance tools
                      </label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <div className="text-sm">
              {getStatusBadge(workOrder.status)}
            </div>
            <div className="flex gap-2">
              {workOrder.status !== 'Rejected' && (
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
                  onClick={() => initiateAction('reject')}
                  disabled={workOrder.status === 'Rejected' || !allSectionsChecked}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
              {workOrder.status !== 'Approved' && (
                <Button 
                  variant="outline" 
                  className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200"
                  onClick={() => initiateAction('approve')}
                  disabled={workOrder.status === 'Approved' || !allSectionsChecked}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType === 'approve' ? 'approve' : 'reject'} work order #{workOrder.workOrderNumber}?
              {actionType === 'reject' && (
                <span className="block mt-2 font-medium text-red-600">
                  This action will mark the work order as rejected.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={actionType === 'approve' 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
