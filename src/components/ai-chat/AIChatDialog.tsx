
import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Bot, User, SendHorizontal } from "lucide-react";

type ChatTopic = "procedures" | "experiences" | "performance" | null;
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

interface AIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderType: string;
  serviceLevel: string;
}

export function AIChatDialog({ isOpen, onClose, workOrderType, serviceLevel }: AIChatDialogProps) {
  const [topic, setTopic] = useState<ChatTopic>(null);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChattingStarted, setIsChattingStarted] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleTopicSelect = (selectedTopic: ChatTopic) => {
    setTopic(selectedTopic);
  };

  const handleStartChat = () => {
    setIsChattingStarted(true);
    
    let initialMessage = "";
    
    switch(topic) {
      case "procedures":
        initialMessage = `Welcome! I'm here to help you with Standard Operating Procedures for ${workOrderType} work orders. What would you like to know?`;
        break;
      case "experiences":
        initialMessage = `Welcome! I'm here to help you with Operating Experiences for ${serviceLevel} service level work orders. What would you like to know?`;
        break;
      case "performance":
        initialMessage = `Welcome! I'm here to help you with Human Performance Tools related to this work order. What would you like to know?`;
        break;
    }
    
    setMessages([{ role: "assistant", content: initialMessage }]);
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = { role: "user" as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setInputValue("");
    
    // Simulate AI response
    setTimeout(() => {
      const responseMessage = { 
        role: "assistant" as const, 
        content: generateResponse(inputValue, topic || "procedures") 
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 800);
  };
  
  // Simple response generation based on topic and user input
  const generateResponse = (userInput: string, selectedTopic: ChatTopic): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes("safety") || input.includes("precaution")) {
      switch(selectedTopic) {
        case "procedures":
          return `For ${workOrderType} work orders, safety protocols include wearing appropriate PPE, following lockout/tagout procedures, and ensuring proper ventilation in confined spaces.`;
        case "experiences":
          return `Based on previous ${serviceLevel} service level experiences, we recommend double-checking all safety equipment before starting work and ensuring a safety supervisor is present during critical operations.`;
        case "performance":
          return "Human performance tools related to safety include pre-job briefings, three-way communication for critical steps, and the STAR method (Stop, Think, Act, Review) when encountering unexpected conditions.";
      }
    } else if (input.includes("time") || input.includes("schedule") || input.includes("duration")) {
      switch(selectedTopic) {
        case "procedures":
          return `Standard procedures for ${workOrderType} typically require 4-8 hours to complete, depending on complexity and system accessibility.`;
        case "experiences":
          return `For ${serviceLevel} service level, work orders are typically scheduled with a 24-48 hour completion window, with priority given to safety-critical systems.`;
        case "performance":
          return "To optimize time management, we recommend using time-boxing techniques, establishing clear milestones, and using the 'take a minute' tool before rushing critical decisions.";
      }
    } else if (input.includes("tools") || input.includes("equipment")) {
      switch(selectedTopic) {
        case "procedures":
          return `${workOrderType} work orders require calibrated measurement tools, inspection equipment, and specialized tooling that must be requested 24 hours in advance.`;
        case "experiences":
          return `For ${serviceLevel} service level work, we maintain dedicated toolkits in the service center. Contact logistics at ext. 4532 to reserve the required equipment.`;
        case "performance":
          return "Tool management is critical for human performance. We recommend using tool control logs, pre-staged tool layouts, and verification processes to ensure all tools are accounted for.";
      }
    } else {
      return `I don't have specific information about that for ${selectedTopic === "procedures" ? "Standard Operating Procedures" : selectedTopic === "experiences" ? "Operating Experiences" : "Human Performance Tools"}. Could you please ask something about safety protocols, scheduling, or required tools?`;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Assistant</DialogTitle>
        </DialogHeader>
        
        {!isChattingStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
            <h3 className="text-lg font-medium">What would you like to chat about?</h3>
            <RadioGroup value={topic || ""} onValueChange={(value) => handleTopicSelect(value as ChatTopic)} className="w-full max-w-md space-y-4">
              <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="procedures" id="procedures" />
                <Label htmlFor="procedures" className="flex-1 cursor-pointer">Standard Operating Procedures Summary</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="experiences" id="experiences" />
                <Label htmlFor="experiences" className="flex-1 cursor-pointer">Operating Experiences Summary</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="performance" id="performance" />
                <Label htmlFor="performance" className="flex-1 cursor-pointer">Human Performance Tools</Label>
              </div>
            </RadioGroup>
            <Button 
              onClick={handleStartChat} 
              disabled={!topic} 
              className="mt-4"
            >
              Start Chat
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4 border rounded-md" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.role === "assistant" ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="text-xs font-medium">
                          {message.role === "assistant" ? "AI Assistant" : "You"}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
