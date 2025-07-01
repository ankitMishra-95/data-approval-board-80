import { X, Check, ChevronDown, Bot, ThumbsUp, ThumbsDown } from "lucide-react";
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

interface WorkOrderSummary {
  operating_experience_summary: string;
  hpt_rules_summary: string;
  safety_rules_summary: string;
  similar_wo_summary: string;
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

interface ApprovalResponse {
  message: string;
  work_order_id: string;
  status: string;
}

interface FeedbackState {
  isOpen: boolean;
  type: 'positive' | 'negative' | null;
  summaryType: 'safety' | 'operating' | 'hpt' | 'similar_wo' | null;
}

interface FeedbackData {
  feedback: 'positive' | 'negative' | null;
  comment: string | null;
}

interface WorkOrderFeedback {
  user_id: string;
  work_order_id: string;
  sop_feedback: FeedbackData;
  oe_feedback: FeedbackData;
  hpt_feedback: FeedbackData;
  similar_wo_feedback: FeedbackData;
  created_at: string;
  updated_at: string;
}

// Store checkbox states globally
const workOrderCheckStates: Record<string, {
  technical: boolean;
  service: boolean;
  customer: boolean;
}> = {};

const AUTH_COOKIE_NAME = 'auth_token';

interface FeedbackButtonsProps {
  summaryType: 'safety' | 'operating' | 'hpt';
  checkboxId: string;
  isChecked: boolean;
  onCheckChange: (checked: boolean) => void;
  checkboxLabel: string;
}

interface FeedbackButtonsOnlyProps {
  summaryType: 'similar_wo';
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
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<WorkOrderSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    isOpen: false,
    type: null,
    summaryType: null
  });
  const [feedbackText, setFeedbackText] = useState('');
  const [existingFeedback, setExistingFeedback] = useState<WorkOrderFeedback | null>(null);
  const { user } = useAuth();
  
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
  
  // Reset checkbox states when work order changes or dialog opens
  useEffect(() => {
    if (workOrder && isOpen) {
      // Reset the checkbox states
      setCheckedSections({
        technical: false,
        service: false,
        customer: false
      });
      
      // Clear the global state for this work order
      if (workOrderCheckStates[workOrder.WorkOrderId]) {
        delete workOrderCheckStates[workOrder.WorkOrderId];
      }
      
      fetchWorkOrderSummary(workOrder.WorkOrderId);
      fetchExistingFeedback(workOrder.WorkOrderId);
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
            safety_rules_summary: "We're working on the summary—check back soon!",
            operating_experience_summary: "We're working on the summary—check back soon!",
            hpt_rules_summary: "We're working on the summary—check back soon!",
            similar_wo_summary: "We're working on the summary—check back soon!"
          });
          return;
        }
        throw new Error('Failed to fetch work order summary');
      }

      const data = await response.json();
      if (data.detail) {
        setSummaryData({
          safety_rules_summary: "We're working on the summary—check back soon!",
          operating_experience_summary: "We're working on the summary—check back soon!",
          hpt_rules_summary: "We're working on the summary—check back soon!",
          similar_wo_summary: "We're working on the summary—check back soon!"
        });
        return;
      }

      setSummaryData(data);
    } catch (error) {
      console.error('Error fetching work order summary:', error);
      setSummaryData({
        safety_rules_summary: "We're working on the summary—check back soon!",
        operating_experience_summary: "We're working on the summary—check back soon!",
        hpt_rules_summary: "We're working on the summary—check back soon!",
        similar_wo_summary: "We're working on the summary—check back soon!"
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchExistingFeedback = async (workOrderId: string) => {
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/feedback/${workOrderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExistingFeedback(data);
      } else if (response.status === 404) {
        setExistingFeedback(null);
      }
    } catch (error) {
      console.error('Error fetching existing feedback:', error);
      setExistingFeedback(null);
    }
  };

  const handleCheckSection = (section: 'technical' | 'service' | 'customer', checked: boolean) => {
    const newCheckedSections = { ...checkedSections, [section]: checked };
    setCheckedSections(newCheckedSections);
    
    // Save to global state
    if (workOrder) {
      workOrderCheckStates[workOrder.WorkOrderId] = newCheckedSections;
    }
  };

  const allSectionsChecked = checkedSections.technical && checkedSections.service && checkedSections.customer;

  const handleConfirmAction = async () => {
    if (!workOrder || !actionType) return;
    
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/approval/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workorder_id: workOrder.WorkOrderId,
          approval_status: actionType === 'approve' ? 'APPROVED' : 'REJECTED'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} work order`);
      }

      const data: ApprovalResponse = await response.json();
      
      // Reset checkbox states after successful action
      setCheckedSections({
        technical: false,
        service: false,
        customer: false
      });
      
      // Clear the global state for this work order
      if (workOrderCheckStates[workOrder.WorkOrderId]) {
        delete workOrderCheckStates[workOrder.WorkOrderId];
      }
    
    if (actionType === 'approve') {
        toast.success(`Work Order #${workOrder.WorkOrderId} approved successfully`);
        onApprove(workOrder.WorkOrderId);
    } else {
        toast.error(`Work Order #${workOrder.WorkOrderId} rejected`);
        onReject(workOrder.WorkOrderId);
      }
    } catch (error) {
      console.error(`Error ${actionType}ing work order:`, error);
      toast.error(`Failed to ${actionType} work order. Please try again.`);
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
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const handleFeedback = (type: 'positive' | 'negative', summaryType: 'safety' | 'operating' | 'hpt' | 'similar_wo') => {
    setFeedbackState({
      isOpen: true,
      type,
      summaryType
    });
    let previousComment = '';
    if (existingFeedback) {
      if (summaryType === 'safety' && existingFeedback.sop_feedback?.comment) {
        previousComment = existingFeedback.sop_feedback.comment;
      } else if (summaryType === 'operating' && existingFeedback.oe_feedback?.comment) {
        previousComment = existingFeedback.oe_feedback.comment;
      } else if (summaryType === 'hpt' && existingFeedback.hpt_feedback?.comment) {
        previousComment = existingFeedback.hpt_feedback.comment;
      } else if (summaryType === 'similar_wo' && existingFeedback.similar_wo_feedback?.comment) {
        previousComment = existingFeedback.similar_wo_feedback.comment;
      }
    }
    setFeedbackText(previousComment);
  };

  const submitFeedback = async () => {
    if (!workOrder || !feedbackState.type || !feedbackState.summaryType) return;

    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (!token) {
        throw new Error('No authentication token found');
      }

      const feedbackData = {
        feedback: feedbackState.type,
        comment: feedbackText.trim() || null
      };

      const payload = {
        work_order_id: workOrder.WorkOrderId,
        user_id: user?.id || 'unknown',
        ...(feedbackState.summaryType === 'safety' && { sop_feedback: feedbackData }),
        ...(feedbackState.summaryType === 'operating' && { oe_feedback: feedbackData }),
        ...(feedbackState.summaryType === 'hpt' && { hpt_feedback: feedbackData }),
        ...(feedbackState.summaryType === 'similar_wo' && { similar_wo_feedback: feedbackData })
      };

      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.success('Feedback submitted successfully!');
      setFeedbackState({ isOpen: false, type: null, summaryType: null });
      setFeedbackText('');
      
      // Refresh existing feedback
      fetchExistingFeedback(workOrder.WorkOrderId);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  const getSubmitButtonText = () => {
    if (!feedbackState.summaryType || !existingFeedback) return 'Submit';
    let hasExisting = false;
    if (feedbackState.summaryType === 'safety' && existingFeedback.sop_feedback?.feedback) {
      hasExisting = true;
    } else if (feedbackState.summaryType === 'operating' && existingFeedback.oe_feedback?.feedback) {
      hasExisting = true;
    } else if (feedbackState.summaryType === 'hpt' && existingFeedback.hpt_feedback?.feedback) {
      hasExisting = true;
    } else if (feedbackState.summaryType === 'similar_wo' && existingFeedback.similar_wo_feedback?.feedback) {
      hasExisting = true;
    }
    return hasExisting ? 'Update' : 'Submit';
  };

  const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ 
    summaryType,
    checkboxId,
    isChecked,
    onCheckChange,
    checkboxLabel
  }) => {
    const feedbackKey = {
      safety: 'sop_feedback',
      operating: 'oe_feedback',
      hpt: 'hpt_feedback'
    }[summaryType] as keyof WorkOrderFeedback;

    const existingFeedbackForType = existingFeedback?.[feedbackKey] as FeedbackData;
    const hasFeedback = existingFeedback !== null && existingFeedbackForType?.feedback !== null;

    return (
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={checkboxId}
            checked={isChecked}
            onCheckedChange={onCheckChange}
          />
          <label 
            htmlFor={checkboxId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {checkboxLabel}
          </label>
        </div>
        <div className="flex items-center gap-4">
          {hasFeedback && (
            <span className="text-sm text-gray-500">
              Previous feedback: {existingFeedbackForType?.feedback}
            </span>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('positive', summaryType)}
              className={`text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 
                ${hasFeedback && existingFeedbackForType?.feedback === 'positive' ? 'bg-green-50' : ''}`}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('negative', summaryType)}
              className={`text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200
                ${hasFeedback && existingFeedbackForType?.feedback === 'negative' ? 'bg-red-50' : ''}`}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const FeedbackButtonsOnly: React.FC<FeedbackButtonsOnlyProps> = ({ 
    summaryType
  }) => {
    const feedbackKey = 'similar_wo_feedback' as keyof WorkOrderFeedback;
    const existingFeedbackForType = existingFeedback?.[feedbackKey] as FeedbackData;
    const hasFeedback = existingFeedback !== null && existingFeedbackForType?.feedback !== null;

    return (
      <div className="mt-4 flex items-center justify-end">
        <div className="flex items-center gap-4">
          {hasFeedback && (
            <span className="text-sm text-gray-500">
              Previous feedback: {existingFeedbackForType?.feedback}
            </span>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('positive', summaryType)}
              className={`text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 
                ${hasFeedback && existingFeedbackForType?.feedback === 'positive' ? 'bg-green-50' : ''}`}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('negative', summaryType)}
              className={`text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200
                ${hasFeedback && existingFeedbackForType?.feedback === 'negative' ? 'bg-red-50' : ''}`}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Add a cleanup function when dialog closes
  const handleDialogClose = () => {
    if (workOrder) {
      // Reset checkbox states
      setCheckedSections({
        technical: false,
        service: false,
        customer: false
      });
      
      // Clear the global state for this work order
      if (workOrderCheckStates[workOrder.WorkOrderId]) {
        delete workOrderCheckStates[workOrder.WorkOrderId];
      }
    }
    onClose();
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
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
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
                <h4 className="text-sm font-medium text-gray-500">Responsible Group</h4>
                <p className="mt-1">{workOrder.WorkerGroupId}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1">{workOrder.Description}</p>
              </div>
              
              {/* Second row */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Cost Type</h4>
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
              {/* <Button 
                variant="ai"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleOpenAiChat}
              >
                <Bot className="h-4 w-4" />
                Ask AI Assistant
              </Button> */}
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
                      <>
                        <div className="react-markdown prose prose-sm max-w-none prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4 prose-strong:font-bold prose-strong:text-gray-900">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeRaw]}
                          >
                            {summaryData.safety_rules_summary}
                          </ReactMarkdown>
                        </div>
                        <FeedbackButtons 
                          summaryType="safety"
                          checkboxId={`technical-checkbox-${workOrder.WorkOrderId}`}
                          isChecked={checkedSections.technical}
                          onCheckChange={(checked) => handleCheckSection('technical', checked)}
                          checkboxLabel="I have read the standard operating procedures"
                        />
                      </>
                    ) : (
                      <p>This work order requires special equipment and trained personnel to handle the {workOrder.WorkOrderTypeId.toLowerCase()} process. The technical complexity is rated as {workOrder.WorkOrderLifecycleStateId}, requiring appropriate safety measures and expertise.</p>
                    )}
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
                      <>
                        <div className="react-markdown prose prose-sm max-w-none prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4 prose-strong:font-bold prose-strong:text-gray-900">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                          >
                            {summaryData.operating_experience_summary}
                          </ReactMarkdown>
                        </div>
                        <FeedbackButtons 
                          summaryType="operating"
                          checkboxId={`service-checkbox-${workOrder.WorkOrderId}`}
                          isChecked={checkedSections.service}
                          onCheckChange={(checked) => handleCheckSection('service', checked)}
                          checkboxLabel="I have read the operating experiences"
                        />
                      </>
                    ) : (
                      <p>This {workOrder.ServiceLevel} level service requires attention within {workOrder.WorkOrderLifecycleStateId === 'Critical' ? '24 hours' : workOrder.WorkOrderLifecycleStateId === 'High' ? '48 hours' : '72 hours'} of the reported issue.</p>
                    )}
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
                      <>
                        <div className="react-markdown prose prose-sm max-w-none prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4 prose-strong:font-bold prose-strong:text-gray-900">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                          >
                            {summaryData.hpt_rules_summary}
                          </ReactMarkdown>
                        </div>
                        <FeedbackButtons 
                          summaryType="hpt"
                          checkboxId={`customer-checkbox-${workOrder.WorkOrderId}`}
                          isChecked={checkedSections.customer}
                          onCheckChange={(checked) => handleCheckSection('customer', checked)}
                          checkboxLabel="I have read the human performance tools"
                        />
                      </>
                    ) : (
                      <p>Customer {workOrder.WorkerGroupId} has been with our service for {Math.floor(Math.random() * 8) + 1} years. They typically require {workOrder.WorkOrderTypeId} services on a quarterly basis.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="similar-workorders" className="bg-gray-50">
                <AccordionTrigger className="text-base font-medium">
                  OE from Similar Workorders (Experimental)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    {isLoadingSummary ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    ) : summaryData ? (
                      <>
                        <div className="react-markdown prose prose-sm max-w-none prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4 prose-strong:font-bold prose-strong:text-gray-900">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                          >
                            {summaryData.similar_wo_summary}
                          </ReactMarkdown>
                        </div>
                        <FeedbackButtonsOnly summaryType="similar_wo" />
                      </>
                    ) : (
                      <p>No similar work order data available at this time.</p>
                    )}
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
              {!workOrder.approval_status.toUpperCase().includes('REJECTED') && (
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
                  onClick={() => initiateAction('reject')}
                  disabled={!allSectionsChecked}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
              {!workOrder.approval_status.toUpperCase().includes('APPROVED') && (
                <Button 
                  variant="outline" 
                  className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200"
                  onClick={() => initiateAction('approve')}
                  disabled={!allSectionsChecked}
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

      <Dialog open={feedbackState.isOpen} onOpenChange={(open) => !open && setFeedbackState({ isOpen: false, type: null, summaryType: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Provide Feedback</DialogTitle>
            <DialogDescription className="text-gray-600">
              Share your thoughts about this summary to help us improve.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-blue-900">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="What could be improved? Please provide detailed feedback..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[100px] border-blue-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFeedbackState({ isOpen: false, type: null, summaryType: null })}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={submitFeedback}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
