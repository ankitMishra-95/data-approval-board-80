
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ toggleSidebar, sidebarOpen }: HeaderProps) {
  const { logout } = useAuth();
  
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-10">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar} 
        className="mr-4"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-medium">Work Orders Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="text-gray-600 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
            <span className="text-sm font-medium">AD</span>
          </div>
        </div>
      </div>
    </header>
  );
}
