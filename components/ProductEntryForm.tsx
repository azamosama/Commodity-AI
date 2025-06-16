import React, { useState } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { Product, ProductCategory, CategoryType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export function ProductEntryForm() {
  const { dispatch } = useCostManagement();
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    quantity: 0,
    unit: '',
    packageSize: 0,
    packageUnit: '',
    cost: 0,
    category: 'Food',
    categoryType: 'Fresh Food',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: uuidv4(),
      ...formData,
    } as Product;
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    setFormData({
      name: '',
      quantity: 0,
      unit: '',
      packageSize: 0,
      packageUnit: '',
      cost: 0,
      category: 'Food',
      categoryType: 'Fresh Food',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'packageSize' || name === 'cost' 
        ? parseFloat(value) 
        : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      
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
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Product
        </button>
      </div>
    </form>
  );
} 