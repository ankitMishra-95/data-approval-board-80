import { X, Check, ChevronDown, Bot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AIChatDialog } from "../ai-chat/AIChatDialog";
import { format } from "date-fns";
import Cookies from 'js-cookie';
import { API_BASE_URL } from "@/lib/constants";

interface WorkOrderSummary {
  operating_experience_summary: string;
  standard_operating_procedures_summary: string;
  human_performance_tools_summary: string;
}

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

interface WorkOrderPopupProps {
  workOrder: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

interface AIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderType: string;
  serviceLevel: number;
}

// Store checkbox states globally
const workOrderCheckStates: Record<string, {
  technical: boolean;
  service: boolean;
  customer: boolean;
}> = {};

const AUTH_COOKIE_NAME = 'auth_token';

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
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<WorkOrderSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  // Reset or initialize checkbox states when workOrder changes
  useEffect(() => {
    if (workOrder) {
      // Load saved state if exists, otherwise initialize with false values
      const savedState = workOrderCheckStates[workOrder.WorkOrderId] || {
        technical: false,
        service: false,
        customer: false
      };
      setCheckedSections(savedState);
    }
  }, [workOrder]);
  
  useEffect(() => {
    if (workOrder && isOpen) {
      fetchWorkOrderSummary(workOrder.WorkOrderId);
    }
  }, [workOrder, isOpen]);

  const fetchWorkOrderSummary = async (workOrderId: string) => {
    setIsLoadingSummary(true);
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/summaries/${workOrderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setSummaryData({
            standard_operating_procedures_summary: "We're working on the summary—check back soon!",
            operating_experience_summary: "We're working on the summary—check back soon!",
            human_performance_tools_summary: "We're working on the summary—check back soon!"
          });
          return;
        }
        throw new Error('Failed to fetch work order summary');
      }

      const data = await response.json();
      if (data.detail) {
        setSummaryData({
          standard_operating_procedures_summary: "We're working on the summary—check back soon!",
          operating_experience_summary: "We're working on the summary—check back soon!",
          human_performance_tools_summary: "We're working on the summary—check back soon!"
        });
        return;
      }
      
      setSummaryData(data);
    } catch (error) {
      console.error('Error fetching work order summary:', error);
      setSummaryData({
        standard_operating_procedures_summary: "We're working on the summary—check back soon!",
        operating_experience_summary: "We're working on the summary—check back soon!",
        human_performance_tools_summary: "We're working on the summary—check back soon!"
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const allSectionsChecked = 
    checkedSections.technical && 
    checkedSections.service && 
    checkedSections.customer;

  const handleCheckSection = (section: 'technical' | 'service' | 'customer', checked: boolean) => {
    if (!workOrder) return;
    
    const newState = {
      ...checkedSections,
      [section]: checked
    };
    
    // Update state in component
    setCheckedSections(newState);
    
    // Save state in global object
    workOrderCheckStates[workOrder.WorkOrderId] = newState;
  };

  const handleConfirmAction = () => {
    if (!workOrder || !actionType) return;
    
    if (actionType === 'approve') {
      onApprove(workOrder.WorkOrderId);
    } else {
      onReject(workOrder.WorkOrderId);
    }
    
    setConfirmDialogOpen(false);
    setActionType(null);
  };

  const initiateAction = (type: 'approve' | 'reject') => {
    setActionType(type);
    setConfirmDialogOpen(true);
  };
  
  const handleOpenAiChat = () => {
    setAiChatOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  if (!workOrder) return null;
  
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[85vw] max-w-7xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Work Order Details</span>
              {getStatusBadge(workOrder.approval_status)}
            </DialogTitle>
            <DialogDescription>
              Details for work order {workOrder.WorkOrderId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid grid-cols-3 gap-4">
              {/* First row */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Work Order Type</h4>
                <p className="mt-1">{workOrder.WorkOrderTypeId}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Customer Account</h4>
                <p className="mt-1">{workOrder.WorkerGroupId}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1">{workOrder.Description}</p>
              </div>
              
              {/* Second row */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Lines</h4>
                <p className="mt-1">{workOrder.CostType}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Service Level</h4>
                <p className="mt-1">{workOrder.ServiceLevel}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Start Date/Time</h4>
                <p className="mt-1">{formatDate(workOrder.ExpectedStart)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Requested By</h4>
                <p className="mt-1">{workOrder.WorkerGroupId}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
                <p className="mt-1">{formatDate(workOrder.ExpectedEnd)}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="py-4">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-blue-200 text-blue-900 flex items-center justify-between">
              Required Reviews
              <Button 
                variant="ai"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleOpenAiChat}
              >
                <Bot className="h-4 w-4" />
                Ask AI Assistant
              </Button>
            </h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="technical-details" className="bg-white">
                <AccordionTrigger className="text-base font-medium">
                  Standard Operating Procedures Summary
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    {isLoadingSummary ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    ) : summaryData ? (
                      <p>{summaryData.standard_operating_procedures_summary}</p>
                    ) : (
                      <p>This work order requires special equipment and trained personnel to handle the {workOrder.WorkOrderTypeId.toLowerCase()} process. The technical complexity is rated as {workOrder.WorkOrderLifecycleStateId}, requiring appropriate safety measures and expertise.</p>
                    )}
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox 
                        id={`technical-checkbox-${workOrder.WorkOrderId}`} 
                        checked={checkedSections.technical}
                        onCheckedChange={(checked) => handleCheckSection('technical', checked === true)}
                      />
                      <label 
                        htmlFor={`technical-checkbox-${workOrder.WorkOrderId}`} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I have reviewed the standard operating procedures
                      </label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="service-requirements" className="bg-gray-50">
                <AccordionTrigger className="text-base font-medium">
                  Operating Experiences Summary
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    {isLoadingSummary ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    ) : summaryData ? (
                      <p>{summaryData.operating_experience_summary}</p>
                    ) : (
                      <p>This {workOrder.ServiceLevel} level service requires attention within {workOrder.WorkOrderLifecycleStateId === 'Critical' ? '24 hours' : workOrder.WorkOrderLifecycleStateId === 'High' ? '48 hours' : '72 hours'} of the reported issue.</p>
                    )}
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox 
                        id={`service-checkbox-${workOrder.WorkOrderId}`} 
                        checked={checkedSections.service}
                        onCheckedChange={(checked) => handleCheckSection('service', checked === true)}
                      />
                      <label 
                        htmlFor={`service-checkbox-${workOrder.WorkOrderId}`} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I have reviewed the operating experiences
                      </label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="customer-history" className="bg-white">
                <AccordionTrigger className="text-base font-medium">
                  Human Performance Tools
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    {isLoadingSummary ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    ) : summaryData ? (
                      <p>{summaryData.human_performance_tools_summary}</p>
                    ) : (
                      <p>Customer {workOrder.WorkerGroupId} has been with our service for {Math.floor(Math.random() * 8) + 1} years. They typically require {workOrder.WorkOrderTypeId} services on a quarterly basis.</p>
                    )}
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox 
                        id={`customer-checkbox-${workOrder.WorkOrderId}`} 
                        checked={checkedSections.customer}
                        onCheckedChange={(checked) => handleCheckSection('customer', checked === true)}
                      />
                      <label 
                        htmlFor={`customer-checkbox-${workOrder.WorkOrderId}`} 
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
              Status: {getStatusBadge(workOrder.approval_status)}
            </div>
            <div className="flex gap-2">
              {workOrder.approval_status !== 'Rejected' && (
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
                  onClick={() => initiateAction('reject')}
                  disabled={workOrder.approval_status === 'Rejected' || !allSectionsChecked}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
              {workOrder.approval_status !== 'Approved' && (
                <Button 
                  variant="outline" 
                  className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200"
                  onClick={() => initiateAction('approve')}
                  disabled={workOrder.approval_status === 'Approved' || !allSectionsChecked}
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
              Are you sure you want to {actionType === 'approve' ? 'approve' : 'reject'} work order #{workOrder.WorkOrderId}?
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
      
      {workOrder && (
        <AIChatDialog 
          isOpen={aiChatOpen} 
          onClose={() => setAiChatOpen(false)}
          workOrderType={workOrder.WorkOrderTypeId}
          serviceLevel={workOrder.ServiceLevel}
        />
      )}
    </>
  );
}
