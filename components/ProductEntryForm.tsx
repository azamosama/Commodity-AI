import React, { useState } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { Product, ProductCategory, CategoryType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export function ProductEntryForm() {
  const { dispatch, state } = useCostManagement();
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

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { ...formData, id: editingProduct.id } as Product });
    } else {
      const newProduct: Product = {
        id: uuidv4(),
        ...formData,
      } as Product;
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    }
    handleCancel();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'quantity' ||
        name === 'packageSize' ||
        name === 'cost' ||
        name === 'unitsPerPackage'
          ? parseFloat(value)
          : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
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
          <label className="block text-sm font-medium text-gray-700">Category</label>
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
          <label className="block text-sm font-medium text-gray-700">Category Type</label>
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
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Unit</label>
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
          <label className="block text-sm font-medium text-gray-700">Package Size</label>
          <input
            type="number"
            name="packageSize"
            value={formData.packageSize}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Package Unit</label>
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
          <label className="block text-sm font-medium text-gray-700">Cost</label>
          <input
            type="number"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Units per Package (optional)</label>
          <input
            type="number"
            name="unitsPerPackage"
            value={formData.unitsPerPackage || ''}
            onChange={handleChange}
            min="0"
            step="1"
            placeholder="e.g., 20 (strawberries per pack or per lb)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center space-x-4">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {editingProduct ? 'Update Product' : 'Add Product'}
        </button>
        {editingProduct && (
          <button
            type="button"
            onClick={handleCancel}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Product List Table */}
      {state.products.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Current Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                  <tr key={product.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.categoryType}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.unit}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.packageSize} {product.packageUnit}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.unitsPerPackage || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${product.cost}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      <button type="button" onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </form>
  );
} 