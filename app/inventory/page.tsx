"use client"
import { CostManagementProvider } from '@/contexts/CostManagementContext';
import { ProductEntryForm } from '@/components/ProductEntryForm';
import { InventoryTracker } from '@/components/InventoryTracker';
import { ExpenseTracker } from '@/components/ExpenseTracker';

export default function InventoryPage() {
  return (
    <CostManagementProvider>
      <div className="min-h-screen bg-gray-100">
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="grid grid-cols-1 gap-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Product Management</h2>
                <ProductEntryForm />
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-4">Inventory & Sales Tracking</h2>
                <InventoryTracker />
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-4">Expense Tracking</h2>
                <ExpenseTracker />
              </section>
            </div>
          </div>
        </main>
      </div>
    </CostManagementProvider>
  );
} 