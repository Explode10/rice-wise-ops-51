import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Package, Utensils } from "lucide-react";

interface ActionItem {
  id: string;
  type: 'reorder' | 'margin' | 'waste' | 'stock';
  priority: 'high' | 'medium' | 'low';
  message: string;
  dueBy?: string;
  suggestedAction: string;
  relatedItem?: string;
}

const mockActions: ActionItem[] = [
  {
    id: '1',
    type: 'reorder',
    priority: 'high',
    message: 'Order ka na ng 5 packs of Jasmine Rice from Metro Supplier — due today.',
    dueBy: 'today',
    suggestedAction: 'Place order immediately',
    relatedItem: 'Jasmine Rice'
  },
  {
    id: '2',
    type: 'margin',
    priority: 'medium',
    message: 'Food cost lumagpas sa target for Seafood Variant. Double-check portioning or price.',
    suggestedAction: 'Review recipe and pricing',
    relatedItem: 'Seafood Variant'
  },
  {
    id: '3',
    type: 'waste',
    priority: 'medium',
    message: 'Mataas ang Prep waste for Green Onions. Review prep cuts/SOP.',
    suggestedAction: 'Train staff on proper cutting technique',
    relatedItem: 'Green Onions'
  },
  {
    id: '4',
    type: 'stock',
    priority: 'low',
    message: 'Soy Sauce running low - 3 days supply left.',
    dueBy: 'in 2 days',
    suggestedAction: 'Schedule reorder',
    relatedItem: 'Soy Sauce'
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'destructive';
    case 'medium': return 'warning';
    case 'low': return 'secondary';
    default: return 'secondary';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'reorder': return <Package className="h-4 w-4" />;
    case 'margin': return <AlertTriangle className="h-4 w-4" />;
    case 'waste': return <Utensils className="h-4 w-4" />;
    case 'stock': return <Clock className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

export const ActionQueue = () => {
  return (
    <div className="space-y-3">
      {mockActions.map((action) => (
        <div 
          key={action.id} 
          className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3 flex-1">
            <div className="flex items-center gap-2">
              {getTypeIcon(action.type)}
              <Badge variant={getPriorityColor(action.priority) as any}>
                {action.priority.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">{action.message}</p>
              <p className="text-xs text-muted-foreground">{action.suggestedAction}</p>
              {action.dueBy && (
                <p className="text-xs text-warning mt-1">Due: {action.dueBy}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              View Details
            </Button>
            <Button size="sm" variant="default">
              Take Action
            </Button>
          </div>
        </div>
      ))}
      
      {mockActions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>All caught up! No urgent actions needed.</p>
        </div>
      )}
    </div>
  );
};