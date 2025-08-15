import { useState } from "react";
import { Navigation } from "@/components/RiceReport/Navigation";
import { Dashboard } from "@/components/RiceReport/Dashboard";
import { SalesLog } from "@/components/RiceReport/SalesLog";
import { Inventory } from "@/components/RiceReport/Inventory";
import { RecipeBOM } from "@/components/RiceReport/RecipeBOM";

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'sales':
        return <SalesLog />;
      case 'inventory':
        return <Inventory />;
      case 'recipes':
        return <RecipeBOM />;
      case 'waste':
        return <div className="p-8 text-center text-muted-foreground">Waste Log module coming soon...</div>;
      case 'forecast':
        return <div className="p-8 text-center text-muted-foreground">Forecast module coming soon...</div>;
      case 'reports':
        return <div className="p-8 text-center text-muted-foreground">Reports module coming soon...</div>;
      case 'settings':
        return <div className="p-8 text-center text-muted-foreground">Settings module coming soon...</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-6 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;