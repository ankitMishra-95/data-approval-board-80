
import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function FilterBar() {
  const [workOrderTypes, setWorkOrderTypes] = useState<string[]>([]);
  const [selectedWorkOrderType, setSelectedWorkOrderType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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
    
    // Load work order types from DataTable or another source
    // This is a temporary solution until we refactor state management
    const customEvent = new CustomEvent('getWorkOrderTypes', {
      detail: {
        callback: (types: string[]) => setWorkOrderTypes(types)
      }
    });
    window.dispatchEvent(customEvent);
  }, []);

  const handleWorkOrderTypeChange = (value: string) => {
    setSelectedWorkOrderType(value);
    localStorage.setItem('workOrderTypeFilter', value);
    
    // Notify DataTable about the filter change
    const customEvent = new CustomEvent('filterChange', {
      detail: { type: 'workOrderType', value }
    });
    window.dispatchEvent(customEvent);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    localStorage.setItem('searchQuery', value);
    
    // Notify DataTable about the search change
    const customEvent = new CustomEvent('filterChange', {
      detail: { type: 'search', value }
    });
    window.dispatchEvent(customEvent);
  };

  const clearFilters = () => {
    setSelectedWorkOrderType('');
    setSearchQuery('');
    localStorage.removeItem('workOrderTypeFilter');
    localStorage.removeItem('searchQuery');
    
    // Notify DataTable about the filter reset
    const customEvent = new CustomEvent('filterChange', {
      detail: { type: 'reset' }
    });
    window.dispatchEvent(customEvent);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
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
  );
}
