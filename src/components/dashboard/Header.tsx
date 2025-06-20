import { useState } from "react";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import ChangePasswordDialog from "@/components/auth/ChangePasswordDialog";

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ toggleSidebar, sidebarOpen }: HeaderProps) {
  const { logout, user } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  const getInitials = (fullName?: string, username?: string) => {
    if (fullName) {
      const names = fullName.split(' ');
      return names.map((n) => n[0]).join('').toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  return (
    <>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {getInitials(user?.full_name, user?.username)}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user?.full_name || user?.username || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.full_name || user?.username || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      <ChangePasswordDialog 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </>
  );
}
