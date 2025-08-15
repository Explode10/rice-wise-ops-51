import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp, Download, Upload, Trash2, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { exportForGoogleSheets, handleFileImport } from "@/utils/exportImport";

interface SalesEntry {
  id: string;
  date: string;
  location: string;
  variant: string;
  bowlsSold: number;
  unitPrice: number;
  promoFlag: boolean;
  notes: string;
  revenue: number;
}

// Start with empty sales data

const locations = ['SM Mall', 'Ayala Center', 'Robinson Mall', 'Greenhills'];

export const SalesLog = () => {
  const [salesData, setSalesData] = useState<SalesEntry[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SalesEntry>>({});
  const { toast } = useToast();

  // Load sales data from localStorage on mount
  useEffect(() => {
    const savedSalesData = localStorage.getItem('salesData');
    if (savedSalesData) {
      try {
        const parsedSalesData = JSON.parse(savedSalesData);
        setSalesData(parsedSalesData);
      } catch (error) {
        console.error('Error loading sales data from localStorage:', error);
      }
    }
  }, []);

  // Save sales data to localStorage whenever salesData changes
  useEffect(() => {
    localStorage.setItem('salesData', JSON.stringify(salesData));
  }, [salesData]);

  // Load variants from Recipe BOM on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('riceProducts');
    if (savedProducts) {
      try {
        const products = JSON.parse(savedProducts);
        const productNames = products.map((product: any) => product.name);
        setVariants(productNames);
      } catch (error) {
        console.error('Error loading products for variants:', error);
        // Fallback to default variants if error
        setVariants(['Classic Fried Rice', 'Spicy Fried Rice', 'Vegetarian Delight', 'Seafood Special', 'Premium Beef']);
      }
    } else {
      // Default variants if no products saved
      setVariants(['Classic Fried Rice', 'Spicy Fried Rice', 'Vegetarian Delight', 'Seafood Special', 'Premium Beef']);
    }
  }, []);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    variant: '',
    bowlsSold: '',
    unitPrice: '',
    promoFlag: false,
    notes: ''
  });

  const deductIngredientsFromInventory = (variant: string, bowlsSold: number) => {
    try {
      // Get recipe products to find the ingredients for this variant
      const savedProducts = localStorage.getItem('riceProducts');
      if (!savedProducts) return;

      const products = JSON.parse(savedProducts);
      const product = products.find((p: any) => p.name === variant);
      if (!product || !product.ingredients) return;

      // Get current inventory
      const savedInventory = localStorage.getItem('inventoryData');
      if (!savedInventory) return;

      const inventory = JSON.parse(savedInventory);
      let updatedInventory = [...inventory];
      let deductedIngredients: string[] = [];

      // Deduct each ingredient based on recipe requirements
      product.ingredients.forEach((ingredient: any) => {
        const requiredAmountG = ingredient.qtyPerBowlG * bowlsSold;
        const inventoryItemIndex = updatedInventory.findIndex(
          (item: any) => item.ingredient.toLowerCase() === ingredient.name.toLowerCase()
        );

        if (inventoryItemIndex >= 0) {
          const currentStock = updatedInventory[inventoryItemIndex].onHandG;
          const newStock = Math.max(0, currentStock - requiredAmountG);
          
          updatedInventory[inventoryItemIndex] = {
            ...updatedInventory[inventoryItemIndex],
            onHandG: newStock,
            packsOnHand: newStock / updatedInventory[inventoryItemIndex].packSizeG,
            lastUpdated: new Date().toISOString().split('T')[0],
            status: newStock <= 0 ? 'critical' : newStock < updatedInventory[inventoryItemIndex].parG * 0.3 ? 'low' : 'ok'
          };

          deductedIngredients.push(`${ingredient.name}: -${requiredAmountG}g`);
        }
      });

      // Save updated inventory
      localStorage.setItem('inventoryData', JSON.stringify(updatedInventory));

      if (deductedIngredients.length > 0) {
        toast({
          title: "Inventory updated",
          description: `Deducted ingredients: ${deductedIngredients.join(', ')}`,
        });
      }
    } catch (error) {
      console.error('Error deducting ingredients from inventory:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEntry: SalesEntry = {
      id: Date.now().toString(),
      date: formData.date,
      location: formData.location,
      variant: formData.variant,
      bowlsSold: parseInt(formData.bowlsSold),
      unitPrice: parseFloat(formData.unitPrice),
      promoFlag: formData.promoFlag,
      notes: formData.notes,
      revenue: parseInt(formData.bowlsSold) * parseFloat(formData.unitPrice)
    };

    // Deduct ingredients from inventory
    deductIngredientsFromInventory(newEntry.variant, newEntry.bowlsSold);

    setSalesData([newEntry, ...salesData]);
    setIsAddingEntry(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      location: '',
      variant: '',
      bowlsSold: '',
      unitPrice: '',
      promoFlag: false,
      notes: ''
    });

    toast({
      title: "Sales entry added",
      description: `Added ${newEntry.bowlsSold} bowls of ${newEntry.variant} for ₱${newEntry.revenue.toLocaleString()}`,
    });
  };

  const startEditEntry = (entry: SalesEntry) => {
    setEditingEntryId(entry.id);
    setEditFormData({ ...entry });
  };

  const cancelEdit = () => {
    setEditingEntryId(null);
    setEditFormData({});
  };

  const saveEdit = () => {
    if (!editingEntryId || !editFormData) return;

    const updatedEntry = {
      ...editFormData,
      revenue: (editFormData.bowlsSold || 0) * (editFormData.unitPrice || 0)
    };

    setSalesData(prev => prev.map(entry => 
      entry.id === editingEntryId 
        ? { ...entry, ...updatedEntry }
        : entry
    ));

    setEditingEntryId(null);
    setEditFormData({});
    
    toast({
      title: "Sales entry updated",
      description: "Entry has been updated successfully",
    });
  };

  const deleteEntry = (id: string) => {
    const entry = salesData.find(entry => entry.id === id);
    setSalesData(prev => prev.filter(entry => entry.id !== id));
    
    toast({
      title: "Sales entry deleted",
      description: `Removed ${entry?.variant} entry`,
    });
  };

  const handleClearAll = () => {
    if (salesData.length === 0) {
      toast({
        title: "No data to clear",
        description: "There are no sales entries to remove",
      });
      return;
    }

    setSalesData([]);
    toast({
      title: "All sales entries cleared",
      description: `Removed ${salesData.length} sales entries`,
    });
  };

  const totalRevenue = salesData.reduce((sum, entry) => sum + entry.revenue, 0);
  const totalBowls = salesData.reduce((sum, entry) => sum + entry.bowlsSold, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₱{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bowls Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalBowls}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              ₱{totalBowls > 0 ? Math.round(totalRevenue / totalBowls) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Entry Form */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sales Entries</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => exportForGoogleSheets(salesData, 'Sales_Log')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <FileUpload
                onFileSelect={(file) => handleFileImport(
                  file,
                  (data) => {
                    const importedSalesData = data.map((item, index) => ({
                      ...item,
                      id: item.id || Date.now().toString() + index,
                      revenue: item.bowlsSold * item.unitPrice
                    }));
                    setSalesData(importedSalesData);
                    // Save to localStorage immediately after import
                    localStorage.setItem('salesData', JSON.stringify(importedSalesData));
                    toast({
                      title: "Import successful",
                      description: `Imported ${data.length} sales entries`,
                    });
                  },
                  (error) => toast({
                    title: "Import failed",
                    description: error,
                    variant: "destructive",
                  })
                )}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </FileUpload>
              {salesData.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleClearAll}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              )}
              <Button onClick={() => setIsAddingEntry(!isAddingEntry)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingEntry && (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="variant">Variant</Label>
                <Select value={formData.variant} onValueChange={(value) => setFormData({ ...formData, variant: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((variant) => (
                      <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bowlsSold">Bowls Sold</Label>
                <Input
                  id="bowlsSold"
                  type="number"
                  value={formData.bowlsSold}
                  onChange={(e) => setFormData({ ...formData, bowlsSold: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unitPrice">Unit Price (₱)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">Add Entry</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingEntry(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Sales Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Bowls Sold</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Promo</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((entry) => (
                <TableRow key={entry.id}>
                  {editingEntryId === entry.id ? (
                    <>
                      <TableCell>
                        <Input
                          type="date"
                          value={editFormData.date || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editFormData.location || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editFormData.variant || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, variant: e.target.value })}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editFormData.bowlsSold || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, bowlsSold: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={editFormData.unitPrice || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₱{((editFormData.bowlsSold || 0) * (editFormData.unitPrice || 0)).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={editFormData.promoFlag || false}
                          onChange={(e) => setEditFormData({ ...editFormData, promoFlag: e.target.checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editFormData.notes || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.location}</TableCell>
                      <TableCell>{entry.variant}</TableCell>
                      <TableCell>{entry.bowlsSold}</TableCell>
                      <TableCell>₱{entry.unitPrice}</TableCell>
                      <TableCell className="font-semibold">₱{entry.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        {entry.promoFlag && <Badge variant="secondary">Promo</Badge>}
                      </TableCell>
                      <TableCell>{entry.notes}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => startEditEntry(entry)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteEntry(entry.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};