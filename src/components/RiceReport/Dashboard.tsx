import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, Package, TrendingUp, Utensils, Zap, Download } from "lucide-react";
import { ActionQueue } from "./ActionQueue";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { exportCompleteRiceReport } from "@/utils/exportImport";

// Real-time data - will be populated from actual sales and operations
const getKPIData = () => ({
  todayBowls: 0,
  todayRevenue: 0,
  foodCostPercent: 0,
  wasteToday: 0,
  avgBowlsPerDay: 0,
  alertsCount: 0,
  atRiskIngredients: 0
});

const getSalesData = () => [];
const getWasteData = () => [];

export const Dashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            RICE REPORT Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time analytics for your fried rice operations</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => exportCompleteRiceReport({
              Sales_Log: getSalesData(),
              Waste_Data: getWasteData(),
              KPI_Data: [getKPIData()]
            })}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export All Data
          </Button>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bowls</CardTitle>
            <Utensils className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{getKPIData().todayBowls}</div>
            <p className="text-xs text-success">+18% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₱{getKPIData().todayRevenue.toLocaleString()}</div>
            <p className="text-xs text-success">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Cost %</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{getKPIData().foodCostPercent}%</div>
            <p className="text-xs text-muted-foreground">Target: 32%</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{getKPIData().alertsCount}</div>
            <p className="text-xs text-destructive">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              7-Day Sales Trend by Variant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getSalesData()}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="classic" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="spicy" stroke="hsl(var(--warning))" strokeWidth={2} />
                  <Line type="monotone" dataKey="vegetarian" stroke="hsl(var(--success))" strokeWidth={2} />
                  <Line type="monotone" dataKey="seafood" stroke="hsl(var(--accent))" strokeWidth={2} />
                  <Line type="monotone" dataKey="premium" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Waste Analysis */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-warning" />
              Waste by Stage (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getWasteData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getWasteData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex justify-center gap-4 mt-4">
              {getWasteData().map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm">{entry.stage}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Queue */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Action Queue - Priority Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActionQueue />
        </CardContent>
      </Card>
    </div>
  );
};