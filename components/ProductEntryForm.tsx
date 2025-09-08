import React, { useState, useEffect } from 'react';
import { useCostManagement, useEditing } from '@/contexts/CostManagementContext';
import { Product, ProductCategory, CategoryType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Trash } from 'lucide-react';
import { calculateTotalUnits } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ProductEntryForm() {
  const { dispatch, state, forceRefresh } = useCostManagement();
  const { isEditing, setIsEditing } = useEditing();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    quantity: 0,
    unit: '',
    packageSize: 0,
    packageUnit: '',
    cost: 0,
    category: 'Food',
    categoryType: 'Fresh Food',
    unitsPerPackage: 0,
  });
  const [packsPerCase, setPacksPerCase] = useState<number | ''>('');
  const [unitsPerPack, setUnitsPerPack] = useState<number | ''>('');
  const [hasMounted, setHasMounted] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockCost, setRestockCost] = useState('');
  const [restockDate, setRestockDate] = useState(new Date().toISOString().slice(0, 10));
  const [expandedRestock, setExpandedRestock] = useState<string | null>(null);

  useEffect(() => { setHasMounted(true); }, []);

  // When editing a product, initialize formData with blank for optional fields if 0 or undefined
  useEffect(() => {
    if (editingProduct) {
      // Get the latest price from priceHistory if available
      let latestCost = editingProduct.cost;
      if (Array.isArray(editingProduct.priceHistory) && editingProduct.priceHistory.length > 0) {
        // Sort by date ascending and get the last entry
        const sorted = [...editingProduct.priceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        latestCost = sorted[sorted.length - 1].price;
      }
      setFormData({
        ...editingProduct,
        cost: latestCost,
        packsPerCase: !editingProduct.packsPerCase || editingProduct.packsPerCase === 0 ? undefined : editingProduct.packsPerCase,
        unitsPerPack: !editingProduct.unitsPerPack || editingProduct.unitsPerPack === 0 ? undefined : editingProduct.unitsPerPack,
        unitsPerPackage: !editingProduct.unitsPerPackage || editingProduct.unitsPerPackage === 0 ? undefined : editingProduct.unitsPerPackage,
      });
      setEffectiveDate(new Date().toISOString().slice(0, 10));
    }
  }, [editingProduct]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setPacksPerCase(product.packsPerCase !== undefined ? product.packsPerCase : '');
    setUnitsPerPack(product.unitsPerPack !== undefined ? product.unitsPerPack : '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      quantity: 0,
      unit: '',
      packageSize: 0,
      packageUnit: '',
      cost: 0,
      category: 'Food',
      categoryType: 'Fresh Food',
      unitsPerPackage: 0,
    });
    setPacksPerCase('');
    setUnitsPerPack('');
    setIsEditing(false);
  };

  const calculatedUnitsPerPackage = packsPerCase && unitsPerPack ? Number(packsPerCase) * Number(unitsPerPack) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const packsPerCaseToUse = packsPerCase !== '' ? Number(packsPerCase) : 0;
    const unitsPerPackToUse = unitsPerPack !== '' ? Number(unitsPerPack) : 0;
    const unitsPerPackageToUse = packsPerCaseToUse && unitsPerPackToUse ? packsPerCaseToUse * unitsPerPackToUse : (typeof formData.unitsPerPackage === 'number' ? formData.unitsPerPackage : 0);
    const costToUse = typeof formData.cost === 'number' ? formData.cost : 0;
    if (editingProduct) {
      let priceHistory = editingProduct.priceHistory ? [...editingProduct.priceHistory] : [];
      const now = effectiveDate ? new Date(effectiveDate).toISOString() : new Date().toISOString();
      // Only add a new entry if the cost has actually changed from the most recent entry
      let lastPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : editingProduct.cost;
      if (costToUse !== lastPrice) {
        priceHistory.push({ date: now, price: costToUse, packageSize: formData.packageSize, quantity: formData.quantity });
      }
      // Allow quantity to be updated for cost/analytics
      const updatedProduct = {
        ...editingProduct,
        ...formData,
        id: editingProduct.id,
        priceHistory,
        cost: costToUse,
      } as Product;
      if (formData.packsPerCase && Number(formData.packsPerCase) >= 1) updatedProduct.packsPerCase = Number(formData.packsPerCase);
      else delete updatedProduct.packsPerCase;
      if (formData.unitsPerPack && Number(formData.unitsPerPack) >= 1) updatedProduct.unitsPerPack = Number(formData.unitsPerPack);
      else delete updatedProduct.unitsPerPack;
      if (formData.unitsPerPackage && Number(formData.unitsPerPackage) >= 1) updatedProduct.unitsPerPackage = Number(formData.unitsPerPackage);
      else delete updatedProduct.unitsPerPackage;
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
      // Do not auto-sync inventory here
    } else {
      const now = new Date().toISOString();
      const newProduct: Product = {
        id: uuidv4(),
        ...formData,
        initialQuantity: formData.quantity,
        priceHistory: [{ date: now, price: costToUse, packageSize: formData.packageSize, quantity: formData.quantity }],
        cost: costToUse,
      } as Product;
      if (formData.packsPerCase && Number(formData.packsPerCase) >= 1) newProduct.packsPerCase = Number(formData.packsPerCase);
      if (formData.unitsPerPack && Number(formData.unitsPerPack) >= 1) newProduct.unitsPerPack = Number(formData.unitsPerPack);
      if (formData.unitsPerPackage && Number(formData.unitsPerPackage) >= 1) newProduct.unitsPerPackage = Number(formData.unitsPerPackage);
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    }
    handleCancel();
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'packsPerCase' || name === 'unitsPerPack' || name === 'unitsPerPackage') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? undefined : Number(value),
      }));
    } else if (name === 'quantity' || name === 'packageSize' || name === 'cost' || name === 'unitsPerPackage') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? undefined : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setIsEditing(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>The name of the product (e.g., Strawberries, Chocolate, Cups).</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>The main category (e.g., Food, Non-Food).</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="Food">Food</option>
              <option value="Non-Food">Non-Food</option>
            </select>
          </div>

          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Category Type</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>The type of product (e.g., Fresh Food, Baking Ingredients).</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <select
              name="categoryType"
              value={formData.categoryType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="Fresh Food">Fresh Food</option>
              <option value="Produce">Produce</option>
              <option value="Dry Goods">Dry Goods</option>
              <option value="Dairy">Dairy</option>
              <option value="Meat">Meat</option>
              <option value="Beverages">Beverages</option>
              <option value="Supplies">Supplies</option>
              <option value="Equipment">Equipment</option>
              <option value="Confectionery">Confectionery</option>
              <option value="Baking Ingredients">Baking Ingredients</option>
              <option value="Sweets & Snacks">Sweets & Snacks</option>
              <option value="Frozen Foods">Frozen Foods</option>
              <option value="Sauces & Condiments">Sauces & Condiments</option>
              <option value="Oils & Fats">Oils & Fats</option>
              <option value="Seafood">Seafood</option>
              <option value="Spices & Seasonings">Spices & Seasonings</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>This is the package size or units per purchase (e.g., 32 lbs per case). Used for cost calculations and analytics. To update inventory, use the Restock button below.</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="number"
              name="quantity"
              value={formData.quantity !== undefined && formData.quantity !== null ? formData.quantity : ''}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <div className="text-xs text-gray-500 mt-1">This value is used for cost per unit calculations in recipes and analytics. It does not affect inventory. Use the Restock button to update inventory.</div>
          </div>

          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>The base unit you purchase this product in (e.g., lb, kg, each).</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              placeholder="e.g., kg, g, oz"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Package Size</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>The amount of the base unit in one package/case (e.g., 32 lbs in a case).</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="number"
              name="packageSize"
              value={formData.packageSize !== undefined && formData.packageSize !== null ? formData.packageSize : ''}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Package Unit</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>The packaging type (e.g., case, box, pack).</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="text"
              name="packageUnit"
              value={formData.packageUnit}
              onChange={handleChange}
              required
              placeholder="e.g., case, box, pack"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Cost</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>The total price you pay for one package/case.</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="number"
              name="cost"
              value={formData.cost !== undefined && formData.cost !== null ? formData.cost : ''}
              onChange={handleChange}
              min={0}
              step={0.01}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Packs per Case (optional)</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>How many packs are in a single case you purchase (optional, used for auto-calculation).</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="number"
              name="packsPerCase"
              value={formData.packsPerCase === undefined ? '' : formData.packsPerCase}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="e.g., 12"
              min="1"
            />
          </div>

          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">Units per Pack (optional)</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-gray-400">ℹ️</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>How many individual items are in each pack (optional, used for auto-calculation).</span>
                </TooltipContent>
              </Tooltip>
            </div>
            <input
              type="number"
              name="unitsPerPack"
              value={formData.unitsPerPack === undefined ? '' : formData.unitsPerPack}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="e.g., 32"
              min="1"
            />
          </div>

          {packsPerCase && unitsPerPack && (
            <div className="text-sm text-gray-600 mt-2">
              <strong>Total Units per Package:</strong> {calculatedUnitsPerPackage}
            </div>
          )}
        </div>

        {editingProduct && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Effective Date for Price Change</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
            {editingProduct && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Product List Table */}
        {hasMounted && state.products.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h3 className="text-base sm:text-lg font-medium mb-2">Current Products</h3>
            <div className="overflow-x-auto">
              <table key={`products-table-${state.products.length}-${state.products.map(p => p.id).join('-')}`} className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Package Size</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Units/Package</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.products.map((product) => (
                    <React.Fragment key={product.id}>
                      <tr>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.categoryType}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.unit}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.packageSize} {product.packageUnit}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.unitsPerPackage || '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${product.cost}</td>
                        <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 p-1 sm:p-0"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
                                  console.log('Deleting product:', product.name, 'ID:', product.id);
                                  console.log('Current products in state:', state.products.map(p => ({ id: p.id, name: p.name })));
                                  dispatch({ type: 'DELETE_PRODUCT', payload: product.id });
                                  console.log('Delete dispatch sent for product:', product.name);
                                }
                              }}
                              title="Delete Product"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm">Edit</button>
                            <button type="button" onClick={() => setRestockProduct(product)} className="text-green-600 hover:text-green-900 text-xs sm:text-sm">Restock</button>
                            <button type="button" onClick={() => setExpandedRestock(expandedRestock === product.id ? null : product.id)} className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">{expandedRestock === product.id ? 'Hide' : 'Show'} Restocks</button>
                          </div>
                        </td>
                      </tr>
                      {expandedRestock === product.id && (
                        <tr>
                          <td colSpan={7} className="bg-gray-50 p-4">
                            <h4 className="font-semibold mb-2">Restock History</h4>
                            {product.restockHistory && product.restockHistory.length > 0 ? (
                              <table className="min-w-full text-xs mb-2">
                                <thead>
                                  <tr>
                                    <th className="px-2 py-1 text-left">Date</th>
                                    <th className="px-2 py-1 text-left">Quantity</th>
                                    <th className="px-2 py-1 text-left">Cost per {product.unit}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {product.restockHistory.map((restock, idx) => (
                                    <tr key={idx}>
                                      <td className="px-2 py-1">{restock.date}</td>
                                      <td className="px-2 py-1">{restock.quantity}</td>
                                      <td className="px-2 py-1">${restock.cost}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="text-gray-500">No restocks yet.</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </form>
      {restockProduct && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Restock Product: {restockProduct.name}</h3>
            <form onSubmit={e => {
              e.preventDefault();
              if (!restockQuantity) return;
              const quantityToAdd = Number(restockQuantity);
              const date = restockDate;
              // Calculate cost per unit from product (for analytics, not for inventory)
              const costPerUnit = restockProduct.cost / (restockProduct.quantity || 1);
              const totalCost = costPerUnit * quantityToAdd;
              // Only update restockHistory and inventory, not product cost/quantity fields
              const updatedProduct = {
                ...restockProduct,
                restockHistory: [
                  ...(restockProduct.restockHistory || []),
                  { date, quantity: quantityToAdd, cost: costPerUnit, totalCost }
                ]
              };
              dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
              setRestockProduct(null);
              setRestockQuantity('');
              setRestockDate(new Date().toISOString().slice(0, 10));
            }}>
              <div className="mb-4">
                <label className="block font-medium mb-1">Quantity Added</label>
                <input type="number" className="input w-full" min="1" value={restockQuantity} onChange={e => setRestockQuantity(e.target.value)} required />
                <div className="text-xs text-gray-500 mt-1">This is the amount to add to inventory. It does not affect cost calculations or analytics.</div>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Date of Restock</label>
                <input type="date" className="input w-full" value={restockDate} onChange={e => setRestockDate(e.target.value)} required />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <button type="button" className="btn-secondary py-2 px-4" onClick={() => setRestockProduct(null)}>Cancel</button>
                <button type="submit" className="btn-primary py-2 px-4">Add Restock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 