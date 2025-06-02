
import { Home, FileText, BarChart3, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
  const menuItems = [
    { name: "Dashboard", icon: Home, active: true },
    // { name: "Reports", icon: FileText, active: false },
    // { name: "Analytics", icon: BarChart3, active: false },
    // { name: "Settings", icon: Settings, active: false },
  ];

  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-20 transition-all duration-300",
        open ? "w-64" : "w-20"
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <div className={cn("flex items-center", open ? "justify-between w-full" : "justify-center")}>
          {open && <span className="font-bold text-xl">ApprovalDB</span>}
          {!open && <span className="font-bold text-xl">A</span>}
        </div>
      </div>
      <nav className="py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <a 
                href="#"
                className={cn(
                  "flex items-center py-2 px-4 transition-colors hover:bg-gray-100 rounded-md mx-2",
                  item.active ? "bg-blue-50 text-blue-600" : "text-gray-700",
                  !open && "justify-center px-0"
                )}
              >
                <item.icon className="h-5 w-5" />
                {open && <span className="ml-3">{item.name}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
