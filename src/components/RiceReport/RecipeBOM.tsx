import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Calculator, DollarSign, Download, Upload, Edit2, Save, X, FileText, Package, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { exportForGoogleSheets, handleFileImport } from "@/utils/exportImport";

interface Ingredient {
  id: string;
  name: string;
  qtyPerBowlG: number;
  yieldFactor: number;
  costPerG: number;
  totalCost: number;
}

interface RiceProduct {
  id: string;
  name: string;
  ingredients: Ingredient[];
  totalCost: number;
  targetProfitPercent: number;
  vatPercent: number;
  sellingPriceBeforeVAT: number;
  sellingPriceAfterVAT: number;
  profitAmount: number;
  margin: number;
  foodCostPercent: number;
  isManualPrice: boolean;
  manualPrice?: number;
}

export const RecipeBOM = () => {
  const [products, setProducts] = useState<RiceProduct[]>([]);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<RiceProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<RiceProduct | null>(null);
  const { toast } = useToast();

  // Load products from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('riceProducts');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Error loading products from localStorage:', error);
      }
    }
  }, []);

  // Save products to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('riceProducts', JSON.stringify(products));
  }, [products]);

  const [productForm, setProductForm] = useState({
    name: '',
    targetProfitPercent: '30',
    vatPercent: '12',
    isManualPrice: false,
    manualPrice: ''
  });

  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    qtyPerBowlG: '',
    yieldFactor: '1',
    costPerG: ''
  });

  const [currentIngredients, setCurrentIngredients] = useState<Ingredient[]>([]);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  const addIngredient = () => {
    if (!ingredientForm.name || !ingredientForm.qtyPerBowlG || !ingredientForm.costPerG) {
      toast({
        title: "Missing fields",
        description: "Please fill in all ingredient fields",
        variant: "destructive",
      });
      return;
    }

    const qtyPerBowlG = parseFloat(ingredientForm.qtyPerBowlG);
    const yieldFactor = parseFloat(ingredientForm.yieldFactor);
    const costPerG = parseFloat(ingredientForm.costPerG);
    const effectiveQty = qtyPerBowlG / yieldFactor;
    const totalCost = effectiveQty * costPerG;

    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: ingredientForm.name,
      qtyPerBowlG,
      yieldFactor,
      costPerG,
      totalCost
    };

    setCurrentIngredients([...currentIngredients, newIngredient]);
    setIngredientForm({
      name: '',
      qtyPerBowlG: '',
      yieldFactor: '1',
      costPerG: ''
    });
  };

  const removeIngredient = (id: string) => {
    setCurrentIngredients(currentIngredients.filter(ing => ing.id !== id));
  };

  const startEditQuantity = (id: string, currentQty: number) => {
    setEditingIngredientId(id);
    setEditQuantity(currentQty.toString());
  };

  const saveQuantityEdit = (id: string) => {
    const newQty = parseFloat(editQuantity);
    if (isNaN(newQty) || newQty <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity greater than 0",
        variant: "destructive",
      });
      return;
    }

    setCurrentIngredients(ingredients => 
      ingredients.map(ing => {
        if (ing.id === id) {
          const effectiveQty = newQty / ing.yieldFactor;
          const totalCost = effectiveQty * ing.costPerG;
          return { ...ing, qtyPerBowlG: newQty, totalCost };
        }
        return ing;
      })
    );
    
    setEditingIngredientId(null);
    setEditQuantity('');
    
    toast({
      title: "Quantity updated",
      description: "Ingredient quantity has been updated and pricing recalculated",
    });
  };

  const cancelQuantityEdit = () => {
    setEditingIngredientId(null);
    setEditQuantity('');
  };

  const calculateProductPricing = (ingredients: Ingredient[], targetProfitPercent: number, vatPercent: number, isManualPrice: boolean = false, manualPrice?: number) => {
    const totalCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
    
    let sellingPriceBeforeVAT: number;
    let sellingPriceAfterVAT: number;
    let profitAmount: number;
    let margin: number;
    let foodCostPercent: number;

    if (isManualPrice && manualPrice && manualPrice > 0) {
      sellingPriceAfterVAT = manualPrice;
      sellingPriceBeforeVAT = sellingPriceAfterVAT / (1 + vatPercent / 100);
      profitAmount = sellingPriceBeforeVAT - totalCost;
      margin = sellingPriceAfterVAT > 0 ? (profitAmount / sellingPriceAfterVAT) * 100 : 0;
      foodCostPercent = sellingPriceAfterVAT > 0 ? (totalCost / sellingPriceAfterVAT) * 100 : 0;
    } else {
      const profitMultiplier = 1 + (targetProfitPercent / 100);
      sellingPriceBeforeVAT = totalCost * profitMultiplier;
      const vatAmount = sellingPriceBeforeVAT * (vatPercent / 100);
      sellingPriceAfterVAT = sellingPriceBeforeVAT + vatAmount;
      profitAmount = sellingPriceBeforeVAT - totalCost;
      margin = totalCost > 0 ? (profitAmount / sellingPriceAfterVAT) * 100 : 0;
      foodCostPercent = sellingPriceAfterVAT > 0 ? (totalCost / sellingPriceAfterVAT) * 100 : 0;
    }

    return {
      totalCost,
      sellingPriceBeforeVAT,
      sellingPriceAfterVAT,
      profitAmount,
      margin,
      foodCostPercent
    };
  };

  const startEditProduct = (product: RiceProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      targetProfitPercent: product.targetProfitPercent.toString(),
      vatPercent: product.vatPercent.toString(),
      isManualPrice: product.isManualPrice,
      manualPrice: product.manualPrice?.toString() || ''
    });
    setCurrentIngredients([...product.ingredients]);
    setIsCreatingProduct(true);
  };

  const updateProduct = () => {
    if (!editingProduct || !productForm.name || currentIngredients.length === 0) {
      toast({
        title: "Cannot update product",
        description: "Please enter a product name and add at least one ingredient",
        variant: "destructive",
      });
      return;
    }

    const targetProfitPercent = parseFloat(productForm.targetProfitPercent);
    const vatPercent = parseFloat(productForm.vatPercent);
    const manualPrice = productForm.manualPrice ? parseFloat(productForm.manualPrice) : undefined;
    
    const pricing = calculateProductPricing(currentIngredients, targetProfitPercent, vatPercent, productForm.isManualPrice, manualPrice);

    const updatedProduct: RiceProduct = {
      ...editingProduct,
      name: productForm.name,
      ingredients: [...currentIngredients],
      targetProfitPercent,
      vatPercent,
      isManualPrice: productForm.isManualPrice,
      manualPrice: manualPrice,
      ...pricing
    };

    setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
    setProductForm({ name: '', targetProfitPercent: '30', vatPercent: '12', isManualPrice: false, manualPrice: '' });
    setCurrentIngredients([]);
    setEditingProduct(null);
    setIsCreatingProduct(false);

    toast({
      title: "Product updated",
      description: `${updatedProduct.name} has been updated`,
    });
  };

  const createProduct = () => {
    if (!productForm.name || currentIngredients.length === 0) {
      toast({
        title: "Cannot create product",
        description: "Please enter a product name and add at least one ingredient",
        variant: "destructive",
      });
      return;
    }

    const targetProfitPercent = parseFloat(productForm.targetProfitPercent);
    const vatPercent = parseFloat(productForm.vatPercent);
    const manualPrice = productForm.manualPrice ? parseFloat(productForm.manualPrice) : undefined;
    
    const pricing = calculateProductPricing(currentIngredients, targetProfitPercent, vatPercent, productForm.isManualPrice, manualPrice);

    const newProduct: RiceProduct = {
      id: Date.now().toString(),
      name: productForm.name,
      ingredients: [...currentIngredients],
      targetProfitPercent,
      vatPercent,
      isManualPrice: productForm.isManualPrice,
      manualPrice: manualPrice,
      ...pricing
    };

    setProducts([...products, newProduct]);
    setProductForm({ name: '', targetProfitPercent: '30', vatPercent: '12', isManualPrice: false, manualPrice: '' });
    setCurrentIngredients([]);
    setIsCreatingProduct(false);

    toast({
      title: "Product created",
      description: `${newProduct.name} added with ${newProduct.ingredients.length} ingredients`,
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setIsCreatingProduct(false);
    setCurrentIngredients([]);
    setProductForm({ name: '', targetProfitPercent: '30', vatPercent: '12', isManualPrice: false, manualPrice: '' });
  };

  const syncIngredientsToInventory = () => {
    // Get all unique ingredients from all products
    const allIngredients = new Map();
    
    products.forEach(product => {
      product.ingredients.forEach(ingredient => {
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

    // Get existing inventory
    const existingInventory = JSON.parse(localStorage.getItem('inventoryData') || '[]');
    const existingIngredientNames = new Set(existingInventory.map((item: any) => item.ingredient.toLowerCase()));
    
    let newItemsAdded = 0;
    
    // Add new ingredients to inventory
    allIngredients.forEach((ingredientData, ingredientName) => {
      if (!existingIngredientNames.has(ingredientName.toLowerCase())) {
        const newInventoryItem = {
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
          status: 'critical' as const,
          daysOfStock: 0
        };
        
        existingInventory.push(newInventoryItem);
        newItemsAdded++;
      }
    });

    // Save updated inventory
    localStorage.setItem('inventoryData', JSON.stringify(existingInventory));
    
    toast({
      title: "Ingredients synced to inventory",
      description: `Added ${newItemsAdded} new ingredients to inventory. Existing ingredients were not modified.`,
    });
  };

  const handleClearAllProducts = () => {
    if (products.length === 0) {
      toast({
        title: "No products to clear",
        description: "There are no products to remove",
      });
      return;
    }

    const productCount = products.length;
    setProducts([]);
    setEditingProduct(null);
    setIsCreatingProduct(false);
    setCurrentIngredients([]);
    
    toast({
      title: "All products cleared",
      description: `Removed ${productCount} products`,
    });
  };

  const handleClearAllIngredients = () => {
    if (currentIngredients.length === 0) {
      toast({
        title: "No ingredients to clear",
        description: "There are no ingredients to remove",
      });
      return;
    }

    const ingredientCount = currentIngredients.length;
    setCurrentIngredients([]);
    
    toast({
      title: "All ingredients cleared",
      description: `Removed ${ingredientCount} ingredients`,
    });
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        id: "1",
        name: "Classic Fried Rice",
        targetProfitPercent: 30,
        vatPercent: 12,
        isManualPrice: false,
        manualPrice: "",
        "ingredient_1_name": "Jasmine Rice",
        "ingredient_1_qtyPerBowlG": 150,
        "ingredient_1_yieldFactor": 2.5,
        "ingredient_1_costPerG": 0.08,
        "ingredient_2_name": "Eggs",
        "ingredient_2_qtyPerBowlG": 50,
        "ingredient_2_yieldFactor": 1,
        "ingredient_2_costPerG": 0.12,
        "ingredient_3_name": "Vegetable Oil",
        "ingredient_3_qtyPerBowlG": 15,
        "ingredient_3_yieldFactor": 1,
        "ingredient_3_costPerG": 0.05,
        "ingredient_4_name": "Soy Sauce",
        "ingredient_4_qtyPerBowlG": 10,
        "ingredient_4_yieldFactor": 1,
        "ingredient_4_costPerG": 0.03,
        "ingredient_5_name": "Garlic",
        "ingredient_5_qtyPerBowlG": 5,
        "ingredient_5_yieldFactor": 1,
        "ingredient_5_costPerG": 0.15
      },
      {
        id: "2", 
        name: "Seafood Fried Rice",
        targetProfitPercent: 35,
        vatPercent: 12,
        isManualPrice: true,
        manualPrice: 180,
        "ingredient_1_name": "Jasmine Rice",
        "ingredient_1_qtyPerBowlG": 150,
        "ingredient_1_yieldFactor": 2.5,
        "ingredient_1_costPerG": 0.08,
        "ingredient_2_name": "Shrimp",
        "ingredient_2_qtyPerBowlG": 80,
        "ingredient_2_yieldFactor": 1,
        "ingredient_2_costPerG": 0.45,
        "ingredient_3_name": "Squid",
        "ingredient_3_qtyPerBowlG": 60,
        "ingredient_3_yieldFactor": 1,
        "ingredient_3_costPerG": 0.35
      }
    ];

    exportForGoogleSheets(templateData, 'Recipe_BOM_Template');
    
    toast({
      title: "Template downloaded",
      description: "Rice product template CSV has been downloaded. Use this format for importing.",
    });
  };

  const currentPricing = calculateProductPricing(
    currentIngredients, 
    parseFloat(productForm.targetProfitPercent), 
    parseFloat(productForm.vatPercent),
    productForm.isManualPrice,
    productForm.manualPrice ? parseFloat(productForm.manualPrice) : undefined
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Recipe BOM Manager
          </h1>
          <p className="text-muted-foreground">Create rice products and calculate pricing with ingredients</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={() => exportForGoogleSheets(products, 'Recipe_BOM')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <FileUpload
            onFileSelect={(file) => handleFileImport(
              file,
              (data) => {
                const importedProducts = data.map((item, index) => ({
                  ...item,
                  id: item.id || Date.now().toString() + index,
                  ingredients: item.ingredients || []
                }));
                setProducts(importedProducts);
                // Save to localStorage immediately after import
                localStorage.setItem('riceProducts', JSON.stringify(importedProducts));
                toast({
                  title: "Import successful",
                  description: `Imported ${data.length} products`,
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
          {products.length > 0 && (
            <Button
              variant="outline"
              onClick={syncIngredientsToInventory}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4 mr-2" />
              Sync to Inventory
            </Button>
          )}
          {products.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleClearAllProducts}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Products
            </Button>
          )}
          <Button onClick={() => setIsCreatingProduct(!isCreatingProduct)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
        </div>
      </div>

      {/* Product Creation Form */}
      {isCreatingProduct && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{editingProduct ? 'Edit Rice Product' : 'Create New Rice Product'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g., Classic Fried Rice"
                />
              </div>
              <div>
                <Label htmlFor="targetProfit">Target Profit (%)</Label>
                <Input
                  id="targetProfit"
                  type="number"
                  value={productForm.targetProfitPercent}
                  onChange={(e) => setProductForm({ ...productForm, targetProfitPercent: e.target.value })}
                  disabled={productForm.isManualPrice}
                />
              </div>
              <div>
                <Label htmlFor="vat">VAT (%)</Label>
                <Input
                  id="vat"
                  type="number"
                  value={productForm.vatPercent}
                  onChange={(e) => setProductForm({ ...productForm, vatPercent: e.target.value })}
                />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="manualPrice"
                    checked={productForm.isManualPrice}
                    onChange={(e) => setProductForm({ ...productForm, isManualPrice: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="manualPrice">Manual Price Override</Label>
                </div>
                {productForm.isManualPrice && (
                  <Input
                    type="number"
                    step="0.01"
                    value={productForm.manualPrice}
                    onChange={(e) => setProductForm({ ...productForm, manualPrice: e.target.value })}
                    placeholder="Manual selling price"
                  />
                )}
              </div>
            </div>

            {/* Add Ingredient Form */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Add Ingredients</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <Label htmlFor="ingredientName">Ingredient Name</Label>
                  <Input
                    id="ingredientName"
                    value={ingredientForm.name}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                    placeholder="e.g., Jasmine Rice"
                  />
                </div>
                <div>
                  <Label htmlFor="qty">Qty per Bowl (g)</Label>
                  <Input
                    id="qty"
                    type="number"
                    step="0.1"
                    value={ingredientForm.qtyPerBowlG}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, qtyPerBowlG: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="yield">Yield Factor</Label>
                  <Input
                    id="yield"
                    type="number"
                    step="0.1"
                    value={ingredientForm.yieldFactor}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, yieldFactor: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost per g (₱)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.001"
                    value={ingredientForm.costPerG}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, costPerG: e.target.value })}
                  />
                </div>
                <Button onClick={addIngredient} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* Current Ingredients */}
            {currentIngredients.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Ingredients</h3>
                  {currentIngredients.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClearAllIngredients}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All Ingredients
                    </Button>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Qty/Bowl (g)</TableHead>
                      <TableHead>Yield Factor</TableHead>
                      <TableHead>Cost/g</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {currentIngredients.map((ingredient) => (
                       <TableRow key={ingredient.id}>
                         <TableCell>{ingredient.name}</TableCell>
                         <TableCell>
                          {editingIngredientId === ingredient.id ? (
                             <div className="flex items-center gap-2">
                               <Input
                                 type="number"
                                 step="0.1"
                                 value={editQuantity}
                                 onChange={(e) => setEditQuantity(e.target.value)}
                                 className="w-20"
                                 autoFocus
                               />
                               <span className="text-sm">g</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               <span>{ingredient.qtyPerBowlG}g</span>
                               <Button 
                                 size="sm" 
                                 variant="ghost" 
                                 onClick={() => startEditQuantity(ingredient.id, ingredient.qtyPerBowlG)}
                                 className="h-6 w-6 p-0"
                               >
                                 <Edit2 className="h-3 w-3" />
                               </Button>
                             </div>
                           )}
                         </TableCell>
                         <TableCell>{ingredient.yieldFactor}</TableCell>
                         <TableCell>₱{ingredient.costPerG.toFixed(3)}</TableCell>
                         <TableCell className="font-semibold">₱{ingredient.totalCost.toFixed(3)}</TableCell>
                         <TableCell>
                           {editingIngredientId === ingredient.id ? (
                             <div className="flex gap-1">
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 onClick={() => saveQuantityEdit(ingredient.id)}
                               >
                                 <Save className="h-4 w-4" />
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 onClick={cancelQuantityEdit}
                               >
                                 <X className="h-4 w-4" />
                               </Button>
                             </div>
                           ) : (
                             <Button size="sm" variant="outline" onClick={() => removeIngredient(ingredient.id)}>
                               <Minus className="h-4 w-4" />
                             </Button>
                           )}
                         </TableCell>
                       </TableRow>
                     ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pricing Calculator */}
            {currentIngredients.length > 0 && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Pricing Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Cost</Label>
                      <div className="text-xl font-bold">₱{currentPricing.totalCost.toFixed(2)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Price (Before VAT)</Label>
                      <div className="text-xl font-bold text-primary">₱{currentPricing.sellingPriceBeforeVAT.toFixed(2)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Price (After VAT)</Label>
                      <div className="text-xl font-bold text-success">₱{currentPricing.sellingPriceAfterVAT.toFixed(2)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Profit Margin</Label>
                      <div className="text-xl font-bold text-accent">{currentPricing.margin.toFixed(1)}%</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Food Cost %</Label>
                      <div className="text-xl font-bold text-warning">{currentPricing.foodCostPercent.toFixed(1)}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={editingProduct ? updateProduct : createProduct} 
                disabled={currentIngredients.length === 0}
                className="flex items-center gap-2"
              >
                {editingProduct ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
              <Button variant="outline" onClick={cancelEdit} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <div className="grid gap-6">
        {products.map((product) => (
          <Card key={product.id} className="shadow-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  {product.name}
                  <Badge variant="outline">{product.ingredients.length} ingredients</Badge>
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Selling Price</div>
                    <div className="text-xl font-bold text-success">₱{product.sellingPriceAfterVAT.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditProduct(product)}
                      className="flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setProducts(products.filter(p => p.id !== product.id));
                        toast({
                          title: "Product deleted",
                          description: `${product.name} has been removed`,
                        });
                      }}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}
                    >
                      {selectedProduct?.id === product.id ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {selectedProduct?.id === product.id && (
              <CardContent className="space-y-4">
                {/* Pricing Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                    <div className="text-lg font-bold">₱{product.totalCost.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">{product.isManualPrice ? 'Manual Price' : 'Target Profit'}</div>
                    <div className="text-lg font-bold text-primary">
                      {product.isManualPrice ? `₱${product.manualPrice?.toFixed(2)}` : `${product.targetProfitPercent}%`}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Before VAT</div>
                    <div className="text-lg font-bold">₱{product.sellingPriceBeforeVAT.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">VAT ({product.vatPercent}%)</div>
                    <div className="text-lg font-bold">₱{(product.sellingPriceAfterVAT - product.sellingPriceBeforeVAT).toFixed(2)}</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Actual Margin</div>
                    <div className="text-lg font-bold text-accent">{product.margin.toFixed(1)}%</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Food Cost %</div>
                    <div className="text-lg font-bold text-warning">{product.foodCostPercent.toFixed(1)}%</div>
                  </div>
                </div>

                {/* Ingredients Breakdown */}
                <div>
                  <h4 className="font-semibold mb-2">Ingredients Breakdown</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Qty/Bowl</TableHead>
                        <TableHead>Yield Factor</TableHead>
                        <TableHead>Cost/g</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.ingredients.map((ingredient) => (
                        <TableRow key={ingredient.id}>
                          <TableCell>{ingredient.name}</TableCell>
                          <TableCell>{ingredient.qtyPerBowlG}g</TableCell>
                          <TableCell>{ingredient.yieldFactor}</TableCell>
                          <TableCell>₱{ingredient.costPerG.toFixed(3)}</TableCell>
                          <TableCell>₱{ingredient.totalCost.toFixed(3)}</TableCell>
                          <TableCell>{((ingredient.totalCost / product.totalCost) * 100).toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {products.length === 0 && !isCreatingProduct && (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No products created yet</h3>
              <p className="text-muted-foreground mb-4">Start by creating your first rice product with ingredients and pricing</p>
              <Button onClick={() => setIsCreatingProduct(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Product
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};