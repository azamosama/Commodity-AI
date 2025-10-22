"use client"
import { ProductEntryForm } from '@/components/ProductEntryForm';
import { InventoryTracker } from '@/components/InventoryTracker';
import { ExpenseTracker } from '@/components/ExpenseTracker';

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-3 sm:py-4 md:py-6 px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Product Management</h2>
            <ProductEntryForm />
          </section>
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Inventory & Sales Tracking</h2>
            <InventoryTracker />
          </section>
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Expense Tracking</h2>
            <ExpenseTracker />
          </section>
        </div>
      </div>
    </div>
  );
} 