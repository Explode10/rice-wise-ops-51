import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Plus, RefreshCw, Download, Upload, FileText, ChefHat, Edit, Save, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { exportForGoogleSheets, handleFileImport } from "@/utils/exportImport";

interface InventoryItem {
  id: string;
  ingredient: string;
  onHandG: number;
  parG: number;
  leadTimeDays: number;
  supplier: string;
  packSizeG: number;
  packsOnHand: number;
  costPerPack: number;
  lastUpdated: string;
  status: 'ok' | 'low' | 'critical';
  daysOfStock: number;
}

// Start with empty inventory data

const getStatusColor = (status: string) => {
  switch (status) {
    case 'critical': return 'destructive';
    case 'low': return 'warning';
    case 'ok': return 'success';
    default: return 'secondary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'critical': return 'CRITICAL';
    case 'low': return 'LOW';
    case 'ok': return 'OK';
    default: return 'UNKNOWN';
  }
};

export const Inventory = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});
  const { toast } = useToast();

  // Load inventory from localStorage on mount
  useEffect(() => {
    const savedInventory = localStorage.getItem('inventoryData');
    if (savedInventory) {
      try {
        const parsedInventory = JSON.parse(savedInventory);
        setInventoryData(parsedInventory);
      } catch (error) {
        console.error('Error loading inventory from localStorage:', error);
      }
    }
  }, []);

  // Save inventory to localStorage whenever inventoryData changes
  useEffect(() => {
    localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
  }, [inventoryData]);

  const [formData, setFormData] = useState({
    ingredient: '',
    onHandG: '',
    parG: '',
    leadTimeDays: '',
    supplier: '',
    packSizeG: '',
    costPerPack: ''
  });

  const criticalItems = inventoryData.filter(item => item.status === 'critical').length;
  const lowItems = inventoryData.filter(item => item.status === 'low').length;
  const totalValue = inventoryData.reduce((sum, item) => sum + (item.packsOnHand * item.costPerPack), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      ingredient: formData.ingredient,
      onHandG: parseFloat(formData.onHandG),
      parG: parseFloat(formData.parG),
      leadTimeDays: parseInt(formData.leadTimeDays),
      supplier: formData.supplier,
      packSizeG: parseFloat(formData.packSizeG),
      packsOnHand: parseFloat(formData.onHandG) / parseFloat(formData.packSizeG),
      costPerPack: parseFloat(formData.costPerPack),
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'ok',
      daysOfStock: 10.0 // Mock calculation
    };

    setInventoryData([...inventoryData, newItem]);
    setIsAddingItem(false);
    setFormData({
      ingredient: '',
      onHandG: '',
      parG: '',
      leadTimeDays: '',
      supplier: '',
      packSizeG: '',
      costPerPack: ''
    });

    toast({
      title: "Inventory item added",
      description: `Added ${newItem.ingredient} to inventory`,
    });
  };

  const handleUpdateStock = (id: string, newStock: number) => {
    setInventoryData(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            onHandG: newStock,
            packsOnHand: newStock / item.packSizeG,
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        : item
    ));
    
    toast({
      title: "Stock updated",
      description: "Inventory levels have been updated",
    });
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        id: "1",
        ingredient: "Jasmine Rice",
        onHandG: 5000,
        parG: 10000,
        leadTimeDays: 7,
        supplier: "ABC Rice Supplier",
        packSizeG: 25000,
        costPerPack: 850,
        status: "ok",
        daysOfStock: 15.5
      },
      {
        id: "2",
        ingredient: "Vegetable Oil",
        onHandG: 2000,
        parG: 5000,
        leadTimeDays: 3,
        supplier: "XYZ Food Supply",
        packSizeG: 1000,
        costPerPack: 120,
        status: "low",
        daysOfStock: 8.2
      },
      {
        id: "3",
        ingredient: "Soy Sauce",
        onHandG: 500,
        parG: 2000,
        leadTimeDays: 5,
        supplier: "Premium Condiments",
        packSizeG: 500,
        costPerPack: 75,
        status: "critical",
        daysOfStock: 3.1
      }
    ];

    exportForGoogleSheets(templateData, 'Inventory_Template');
    
    toast({
      title: "Template downloaded",
      description: "Inventory template CSV has been downloaded. Use this format for importing.",
    });
  };

  const startEditItem = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setEditFormData({ ...item });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditFormData({});
  };

  const saveEdit = () => {
    if (!editingItemId || !editFormData) return;

    setInventoryData(prev => prev.map(item => 
      item.id === editingItemId 
        ? {
            ...item,
            ...editFormData,
            packsOnHand: (editFormData.onHandG || item.onHandG) / (editFormData.packSizeG || item.packSizeG),
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        : item
    ));

    setEditingItemId(null);
    setEditFormData({});
    
    toast({
      title: "Item updated",
      description: "Inventory item has been updated successfully",
    });
  };

  const deleteItem = (id: string) => {
    const item = inventoryData.find(item => item.id === id);
    setInventoryData(prev => prev.filter(item => item.id !== id));
    
    toast({
      title: "Item deleted",
      description: `Removed ${item?.ingredient} from inventory`,
    });
  };

  const clearAllItems = () => {
    if (inventoryData.length === 0) {
      toast({
        title: "No items to clear",
        description: "There are no inventory items to remove",
      });
      return;
    }

    const itemCount = inventoryData.length;
    setInventoryData([]);
    
    toast({
      title: "All items cleared",
      description: `Removed ${itemCount} inventory items`,
    });
  };

  const importFromRecipeBOM = () => {
    // Get recipe products from localStorage
    const savedProducts = localStorage.getItem('riceProducts');
    if (!savedProducts) {
      toast({
        title: "No Recipe BOM data found",
        description: "Please create some rice products first in the Recipe BOM section.",
        variant: "destructive",
      });
      return;
    }

    try {
      const products = JSON.parse(savedProducts);
      const allIngredients = new Map();
      
      // Collect all unique ingredients from all products
      products.forEach((product: any) => {
        product.ingredients?.forEach((ingredient: any) => {
          if (!allIngredients.has(ingredient.name)) {
            allIngredients.set(ingredient.name, {
              name: ingredient.name,
              costPerG: ingredient.costPerG,
              averageCostPerG: ingredient.costPerG,
              count: 1
            });
          } else {
            const existing = allIngredients.get(ingredient.name);
            existing.averageCostPerG = ((existing.averageCostPerG * existing.count) + ingredient.costPerG) / (existing.count + 1);
            existing.count++;
          }
        });
      });

      // Check for existing ingredients to avoid duplicates
      const existingIngredientNames = new Set(inventoryData.map(item => item.ingredient.toLowerCase()));
      let newItemsAdded = 0;
      
      // Add new ingredients to inventory
      const newInventoryItems: InventoryItem[] = [];
      allIngredients.forEach((ingredientData, ingredientName) => {
        if (!existingIngredientNames.has(ingredientName.toLowerCase())) {
          const newItem: InventoryItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ingredient: ingredientName,
            onHandG: 0,
            parG: 1000, // Default PAR level
            leadTimeDays: 7, // Default lead time
            supplier: 'TBD',
            packSizeG: 1000, // Default pack size
            packsOnHand: 0,
            costPerPack: ingredientData.averageCostPerG * 1000, // Cost per 1kg pack
            lastUpdated: new Date().toISOString().split('T')[0],
            status: 'critical',
            daysOfStock: 0
          };
          newInventoryItems.push(newItem);
          newItemsAdded++;
        }
      });

      // Update inventory data
      setInventoryData(prev => [...prev, ...newInventoryItems]);
      
      toast({
        title: "Ingredients imported from Recipe BOM",
        description: `Added ${newItemsAdded} new ingredients to inventory. Existing ingredients were not modified.`,
      });

    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import ingredients from Recipe BOM.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryData.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalItems}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowItems}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₱{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Management */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inventory Management</CardTitle>
            <div className="flex gap-2">
              {inventoryData.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAllItems}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportForGoogleSheets(inventoryData, 'Inventory')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <FileUpload
                onFileSelect={(file) => handleFileImport(
                  file,
                  (data) => {
                    const importedInventory = data.map((item, index) => ({
                      ...item,
                      id: item.id || Date.now().toString() + index,
                      packsOnHand: item.onHandG / item.packSizeG,
                      status: item.status || 'ok',
                      daysOfStock: item.daysOfStock || 10.0
                    }));
                    setInventoryData(importedInventory);
                    // Save to localStorage immediately after import
                    localStorage.setItem('inventoryData', JSON.stringify(importedInventory));
                    toast({
                      title: "Import successful",
                      description: `Imported ${data.length} inventory items`,
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
              <Button
                variant="outline"
                size="sm"
                onClick={importFromRecipeBOM}
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Import from Recipe BOM
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsAddingItem(!isAddingItem)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingItem && (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="ingredient">Ingredient</Label>
                <Input
                  id="ingredient"
                  value={formData.ingredient}
                  onChange={(e) => setFormData({ ...formData, ingredient: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="onHandG">On Hand (g)</Label>
                <Input
                  id="onHandG"
                  type="number"
                  value={formData.onHandG}
                  onChange={(e) => setFormData({ ...formData, onHandG: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="parG">Par Level (g)</Label>
                <Input
                  id="parG"
                  type="number"
                  value={formData.parG}
                  onChange={(e) => setFormData({ ...formData, parG: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
                <Input
                  id="leadTimeDays"
                  type="number"
                  value={formData.leadTimeDays}
                  onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="packSizeG">Pack Size (g)</Label>
                <Input
                  id="packSizeG"
                  type="number"
                  value={formData.packSizeG}
                  onChange={(e) => setFormData({ ...formData, packSizeG: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="costPerPack">Cost per Pack (₱)</Label>
                <Input
                  id="costPerPack"
                  type="number"
                  step="0.01"
                  value={formData.costPerPack}
                  onChange={(e) => setFormData({ ...formData, costPerPack: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">Add Item</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingItem(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Inventory Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>On Hand</TableHead>
                  <TableHead>Par Level</TableHead>
                  <TableHead>Days Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Pack Size</TableHead>
                  <TableHead>Cost/Pack</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {editingItemId === item.id ? (
                        <Input
                          value={editFormData.ingredient || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, ingredient: e.target.value }))}
                          className="w-full"
                        />
                      ) : (
                        item.ingredient
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <Input
                          type="number"
                          value={editFormData.onHandG || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, onHandG: parseFloat(e.target.value) || 0 }))}
                          className="w-20"
                        />
                      ) : (
                        `${item.onHandG.toLocaleString()}g`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <Input
                          type="number"
                          value={editFormData.parG || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, parG: parseFloat(e.target.value) || 0 }))}
                          className="w-20"
                        />
                      ) : (
                        `${item.parG.toLocaleString()}g`
                      )}
                    </TableCell>
                    <TableCell>{item.daysOfStock.toFixed(1)} days</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(item.status) as any}>
                        {getStatusText(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <Input
                          value={editFormData.supplier || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, supplier: e.target.value }))}
                          className="w-full"
                        />
                      ) : (
                        item.supplier
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <Input
                          type="number"
                          value={editFormData.packSizeG || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, packSizeG: parseFloat(e.target.value) || 0 }))}
                          className="w-20"
                        />
                      ) : (
                        `${item.packSizeG}g`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editFormData.costPerPack || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, costPerPack: parseFloat(e.target.value) || 0 }))}
                          className="w-20"
                        />
                      ) : (
                        `₱${item.costPerPack}`
                      )}
                    </TableCell>
                    <TableCell>₱{(item.packsOnHand * item.costPerPack).toFixed(2)}</TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => startEditItem(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};