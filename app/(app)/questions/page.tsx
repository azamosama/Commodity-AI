"use client";
import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';

// Enhanced process documentation with more detailed explanations
const processDocumentation = `RESTAURANT DATA ANALYSIS GUIDE:

BREAKEVEN CALCULATIONS:
- Per Year: Sum all annualized expenses including fixed costs and variable costs
- Per Month: Sum all monthly expenses (annual expenses ÷ 12)
- Per Week: Annual expenses ÷ 52 weeks
- Per Day: Annual expenses ÷ 365 days

COST ANALYSIS:
- Fixed costs (rent, utilities, insurance) are spread evenly across all periods
- Variable costs (COGS/food costs) are calculated based on actual sales and ingredient usage
- COGS is averaged over periods with actual sales activity
- Cost per serving uses historical ingredient prices as of the sale date

INVENTORY MANAGEMENT:
- Inventory increases when you restock products
- Inventory decreases as recipes are sold
- Changing 'Quantity' in Product Management resets the stock
- Restocking updates inventory but doesn't affect cost/analytics fields

PROFITABILITY METRICS:
- Revenue = sum of all sales for the selected period
- Profit = revenue minus total breakeven for the selected period
- Profit margin = (profit ÷ revenue) × 100

DATA POPULATION ASSISTANCE:
- I can help you add products, recipes, sales records, and expenses
- I can suggest optimal pricing based on your cost structure
- I can identify inventory items that need restocking
- I can analyze your most/least profitable menu items

COMMON QUESTIONS I CAN ANSWER:
- "What's my breakeven point?"
- "Which menu items are most profitable?"
- "What inventory should I restock?"
- "How can I improve my profit margins?"
- "What's my cost per serving for [recipe name]?"
- "Show me my sales trends"
- "What expenses are highest?"
- "Help me add a new recipe"`;

function QuestionsContent() {
  const { state, dispatch } = useCostManagement();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string>('default');

  // Get restaurant ID from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const restaurant = urlParams.get('restaurant');
      setRestaurantId(restaurant || 'default');
    }
  }, []);

  // Get restaurant-specific chat history key
  const getChatHistoryKey = () => {
    return `questionsChatHistory_${restaurantId}`;
  };

  // Enhanced breakeven calculation
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

  // Calculate actual COGS from sales/recipes
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const salesWithDates = state.sales.map(sale => ({ ...sale, date: new Date(sale.date) }));
  const cogsByDay: Record<string, number> = {};
  salesWithDates.forEach(sale => {
    const recipe = state.recipes.find(r => r.name === sale.recipeName);
    if (!recipe) return;
    const saleDate = sale.date;
    const costPerServing = recipe.ingredients.reduce((sum, ingredient) => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return sum;
      const productCost = getProductCostOnDate(product, saleDate);
      const totalUnits = (product.quantity || 0) * (product.packageSize || 1);
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

  // Enhanced data summaries with more detailed information
  const inventorySummary = state.products.map(p => {
    const lowStock = p.quantity < (p.packageSize || 1) * 0.2; // Flag if less than 20% of package size
    const stockStatus = lowStock ? ' (LOW STOCK)' : '';
    return `${p.name}: ${p.quantity} ${p.unit}${p.packageSize ? ` per package of ${p.packageSize}` : ''} (cost: $${p.cost})${stockStatus}`;
  }).join('\n');

  const recipesSummary = state.recipes.map(r => {
    const ingredients = r.ingredients.map(i => {
      const product = state.products.find(p => p.id === i.productId);
      return product ? `${i.quantity} ${product.unit} ${product.name}` : '';
    }).join(', ');
    const totalCost = r.ingredients.reduce((sum, ingredient) => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return sum;
      const totalUnits = (product.quantity || 0) * (product.packageSize || 1);
      const unitCost = totalUnits > 0 ? product.cost / totalUnits : 0;
      return sum + unitCost * ingredient.quantity;
    }, 0);
    return `${r.name}: ${ingredients} (cost: $${totalCost.toFixed(2)})`;
  }).join('\n');

  const salesSummary = state.sales.map(s => {
    const recipe = state.recipes.find(r => r.name === s.recipeName);
    const totalRevenue = s.quantity * s.salePrice;
    return `${s.date}: ${s.quantity} units of ${recipe ? recipe.name : 'Unknown'} at $${s.salePrice} each (revenue: $${totalRevenue})`;
  }).join('\n');

  const expensesSummary = state.expenses.map(e => {
    return `${e.category}: $${e.amount}${e.recurring ? ` (${e.frequency})` : ''} - ${e.name}`;
  }).join('\n');

  // Enhanced analytics summary
  const totalRevenue = state.sales.reduce((sum, sale) => sum + (sale.quantity * sale.salePrice), 0);
  const totalExpenses = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { day: number }).day * 365, 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const analyticsSummary = `Breakeven per day: $${breakevenPerDay.toFixed(2)}
Total Revenue: $${totalRevenue.toFixed(2)}
Total Expenses (annualized): $${totalExpenses.toFixed(2)}
Profit: $${profit.toFixed(2)}
Profit Margin: ${profitMargin.toFixed(1)}%
Days with sales: ${dayKeys.length}`;

  // Compose comprehensive data summary
  const dataSummary = `RESTAURANT DATA SUMMARY:

INVENTORY (${state.products.length} items):
${inventorySummary}

RECIPES (${state.recipes.length} items):
${recipesSummary}

SALES RECORDS (${state.sales.length} entries):
${salesSummary}

EXPENSES (${state.expenses.length} entries):
${expensesSummary}

ANALYTICS:
${analyticsSummary}

PROCESS DOCUMENTATION:
${processDocumentation}

AVAILABLE ACTIONS:
- I can help you add new products, recipes, sales, or expenses
- I can suggest optimal pricing based on your cost structure
- I can identify inventory items that need restocking
- I can analyze your most/least profitable menu items
- I can help you understand your breakeven point and profitability`;

  // Load chat history from localStorage when restaurantId changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = getChatHistoryKey();
      const saved = localStorage.getItem(key);
      console.log(`Loading chat history for ${restaurantId}, key: ${key}`);
      if (saved) {
        try {
          const parsedMessages = JSON.parse(saved);
          setMessages(parsedMessages);
          console.log(`Loaded ${parsedMessages.length} messages for ${restaurantId}`);
        } catch (error) {
          console.error('Error parsing saved chat history:', error);
          setMessages([]);
        }
      } else {
        console.log(`No saved chat history found for ${restaurantId}`);
        setMessages([]);
      }
    }
  }, [restaurantId]); // Add restaurantId as dependency

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = getChatHistoryKey();
      if (messages.length > 0) {
        localStorage.setItem(key, JSON.stringify(messages));
        console.log(`Saved chat history for ${restaurantId}:`, messages.length, 'messages');
      } else {
        // Clear localStorage when messages are empty
        localStorage.removeItem(key);
        console.log(`Cleared chat history for ${restaurantId}`);
      }
    }
  }, [messages, restaurantId]); // Add restaurantId as dependency

  const clearChat = () => {
    if (messages.length > 0 && window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      setMessages([]);
      // localStorage will be cleared by the useEffect when messages becomes empty
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = { role: 'user' as const, content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/ollama-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages, 
          breakevenPerDay, 
          dataSummary,
          state
        }),
      });
      
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: Could not get a response. Please check your Ollama server connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Flavor GPT</h2>
          <p className="text-gray-600 mt-1">
            Your AI assistant for restaurant data analysis. Ask me about your inventory, recipes, sales, expenses, 
            profitability, or request help adding new data to your system.
          </p>
        </div>
        {messages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {messages.length} message{messages.length !== 1 ? 's' : ''} • Chat history saved
            </span>
            <button
              onClick={clearChat}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Clear chat history"
            >
              🗑️ Clear Chat
            </button>
          </div>
        )}
      </div>
      
      <div className="border rounded-lg p-4 min-h-[400px] bg-gray-50 mb-4 overflow-y-auto max-h-[500px]">
        {messages.length === 0 && (
          <div className="text-gray-400">
            <p className="mb-2">💡 <strong>Try asking me:</strong></p>
            <ul className="text-sm space-y-1">
              <li>• "What's my breakeven point?"</li>
              <li>• "Which menu items are most profitable?"</li>
              <li>• "What inventory should I restock?"</li>
              <li>• "Help me add a new recipe for pasta"</li>
              <li>• "Show me my sales trends"</li>
              <li>• "What's my cost per serving for [recipe name]?"</li>
            </ul>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}> 
            <span className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-gray-400 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
            Thinking...
          </div>
        )}
      </div>
      
      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          className="flex-1 border rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your data, request help adding items, or get insights..."
          disabled={loading}
        />
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base whitespace-nowrap transition-colors" 
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function QuestionsPage() {
  return <QuestionsContent />;
} 