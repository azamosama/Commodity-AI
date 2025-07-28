"use client";
import React, { useState, useEffect } from 'react';
import { useCostManagement, CostManagementProvider } from '@/contexts/CostManagementContext';

const CHAT_HISTORY_KEY = 'questionsChatHistory';

// Static process documentation summary
const processDocumentation = `Breakeven is the minimum revenue needed to cover all fixed and variable expenses. Per Year: Sum all annualized expenses. Per Month: Sum all monthly expenses. Per Week: Annual expenses divided by 52. Per Day: Annual expenses divided by 365. Fixed costs (e.g., utilities) are spread evenly over all periods. Variable costs (COGS) are based on actual sales and ingredient usage, averaged over periods with sales. The cost per serving is calculated using the historical price of each ingredient as of the sale date. Revenue is the sum of all sales for the selected period. Profit is revenue minus total breakeven for the selected period. Inventory increases when you restock and decreases as recipes are sold. Changing 'Quantity' in Product Management resets the stock. Restocking does not affect cost/analytics fields, only inventory.`;

function QuestionsContent() {
  const { state } = useCostManagement();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate breakeven per day (same logic as ProfitabilityDashboard)
  const getPeriodAmount = (amount: number, frequency?: string) => {
    switch (frequency) {
      case 'daily':
        return { year: amount * 365, month: amount * 30, week: amount * 7, day: amount };
      case 'weekly':
        return { year: amount * 52, month: (amount * 52) / 12, week: amount, day: amount / 7 };
      case 'monthly':
        return { year: amount * 12, month: amount, week: (amount * 12) / 52, day: (amount * 12) / 365 };
      default:
        return { year: amount, month: amount / 12, week: amount / 52, day: amount / 365 };
    }
  };
  const categories = Array.from(new Set(state.expenses.map(e => e.category)));
  const expenseBreakdown: Record<string, { year: number; month: number; week: number; day: number }> = {};
  categories.forEach(category => {
    const catExpenses = state.expenses.filter(e => e.category === category);
    let year = 0, month = 0, week = 0, day = 0;
    catExpenses.forEach(e => {
      const freq = e.recurring ? e.frequency : undefined;
      const period = getPeriodAmount(e.amount, freq);
      year += period.year;
      month += period.month;
      week += period.week;
      day += period.day;
    });
    expenseBreakdown[category] = { year, month, week, day };
  });
  // Calculate actual COGS (food cost) from sales/recipes
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const salesWithDates = state.sales.map(sale => ({ ...sale, date: new Date(sale.date) }));
  const cogsByDay: Record<string, number> = {};
  salesWithDates.forEach(sale => {
    const recipe = state.recipes.find(r => r.id === sale.recipeId);
    if (!recipe) return;
    const saleDate = sale.date;
    const costPerServing = recipe.ingredients.reduce((sum, ingredient) => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return sum;
      const productCost = getProductCostOnDate(product, saleDate);
      const totalUnits = product.quantity * (product.packageSize || 1);
      const unitCost = totalUnits > 0 ? productCost / totalUnits : 0;
      return sum + unitCost * ingredient.quantity;
    }, 0);
    const totalIngredientCost = costPerServing * sale.quantity;
    const dayKey = sale.date.toISOString().split('T')[0];
    cogsByDay[dayKey] = (cogsByDay[dayKey] || 0) + totalIngredientCost;
  });
  const dayKeys = Object.keys(cogsByDay);
  let cogsDay = 0;
  if (dayKeys.length > 0) {
    const totalCogs = Object.values(cogsByDay).reduce((a, b) => a + b, 0);
    cogsDay = totalCogs / dayKeys.length;
  }
  expenseBreakdown['Food (COGS)'] = { year: 0, month: 0, week: 0, day: cogsDay };
  const totalDay = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { day: number }).day, 0);
  const breakevenPerDay = totalDay;
  function getProductCostOnDate(product: any, date: Date) {
    if (!product.priceHistory || product.priceHistory.length === 0) return product.cost;
    const sorted = [...product.priceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cost = product.cost;
    for (let i = 0; i < sorted.length; i++) {
      if (new Date(sorted[i].date) <= date) {
        cost = sorted[i].price;
      } else {
        break;
      }
    }
    return cost;
  }

  // Summarize inventory
  const inventorySummary = state.products.map(p => {
    return `${p.name}: ${p.quantity} ${p.unit}${p.packageSize ? ` per package of ${p.packageSize}` : ''} (cost: $${p.cost})`;
  }).join('\n');

  // Summarize recipes
  const recipesSummary = state.recipes.map(r => {
    const ingredients = r.ingredients.map(i => {
      const product = state.products.find(p => p.id === i.productId);
      return product ? `${i.quantity} ${product.unit} ${product.name}` : '';
    }).join(', ');
    return `${r.name}: ${ingredients}`;
  }).join('\n');

  // Summarize sales
  const salesSummary = state.sales.map(s => {
    const recipe = state.recipes.find(r => r.id === s.recipeId);
    return `${s.date}: ${s.quantity} units of ${recipe ? recipe.name : 'Unknown'} at $${s.price} each`;
  }).join('\n');

  // Summarize expenses
  const expensesSummary = state.expenses.map(e => {
    return `${e.category}: $${e.amount}${e.recurring ? ` (${e.frequency})` : ''}`;
  }).join('\n');

  // Analytics summary
  const analyticsSummary = `Breakeven per day: $${breakevenPerDay.toFixed(2)}`;

  // Compose data summary
  const dataSummary = `Business Data Summary:\n\nInventory:\n${inventorySummary}\n\nRecipes:\n${recipesSummary}\n\nSales Records:\n${salesSummary}\n\nExpenses:\n${expensesSummary}\n\nAnalytics:\n${analyticsSummary}\n\nProcess Documentation:\n${processDocumentation}`;

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ollama-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], breakevenPerDay, dataSummary }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: Could not get a response.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-4">Flavor GPT</h2>
      <div className="border rounded-lg p-4 min-h-[3rem] bg-gray-50 mb-4">
        {messages.length === 0 && <div className="text-gray-400">Ask anything about your data, calculations, or how the app works!</div>}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}> 
            <span className={msg.role === 'user' ? 'bg-blue-100 px-2 py-1 rounded' : 'bg-green-100 px-2 py-1 rounded'}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <div className="text-gray-400">Thinking...</div>}
      </div>
      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          className="flex-1 border rounded p-3 text-base"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={loading}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-3 rounded text-base whitespace-nowrap" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <CostManagementProvider>
      <QuestionsContent />
    </CostManagementProvider>
  );
} 