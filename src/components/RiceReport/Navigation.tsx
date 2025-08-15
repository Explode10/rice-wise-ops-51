import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Package, 
  Utensils, 
  TrendingUp, 
  AlertTriangle, 
  FileSpreadsheet,
  Settings,
  DollarSign
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'sales', label: 'Sales Log', icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'recipes', label: 'Recipe BOM', icon: Utensils },
  { id: 'waste', label: 'Waste Log', icon: AlertTriangle },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">RICE REPORT</span>
          </div>
          
          <Badge variant="outline" className="text-xs">
            Analytics Platform
          </Badge>
        </div>
        
        <nav className="flex items-center gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};