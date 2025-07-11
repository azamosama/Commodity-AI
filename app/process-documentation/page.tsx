import React from 'react';

export default function ProcessDocumentation() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Process Documentation</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Breakeven Calculation</h2>
        <p>
          <strong>Breakeven</strong> is the minimum revenue needed to cover all fixed and variable expenses.
        </p>
        <ul className="list-disc ml-6 mt-2">
          <li><strong>Per Year:</strong> Sum all annualized expenses (e.g., $50/month × 12 = $600/year).</li>
          <li><strong>Per Month:</strong> Sum all monthly expenses.</li>
          <li><strong>Per Week:</strong> Annual expenses divided by 52 (weeks).</li>
          <li><strong>Per Day:</strong> Annual expenses divided by 365 (days).</li>
          <li>Fixed costs (e.g., utilities) are spread evenly over all periods.<br />
            <span className="text-gray-600 text-sm">
              Example: $50/month utilities → $50 × 12 = $600/year.<br />
              Per week: $600 ÷ 52 = $11.54/week.<br />
              Per day: $600 ÷ 365 = $1.64/day.<br />
              (Spread evenly, regardless of sales)
            </span>
          </li>
          <li>Variable costs (COGS) are based on actual sales and ingredient usage, averaged over periods with sales.<br />
            <span className="text-gray-600 text-sm">
              Example: If you sell 10 menu items in a week and each uses $2 of ingredients, COGS for that week = $20. If you sell nothing, COGS = $0 for that week.<br />
              <strong>Important:</strong> When calculating per year, month, week, and day COGS, the app only counts the periods (days, weeks, months, years) in which there were sales. It is <u>not</u> a simple average over all periods, nor a rolling 7-day average. The average is based only on periods with sales.
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Recipe Cost Calculation</h2>
        <p>
          The cost per serving is calculated using the historical price of each ingredient as of the sale date.<br />
          <strong>Formula:</strong> Ingredient quantity × cost per unit (on sale date).<br />
          The suggested price is typically a markup (e.g., 3x) of the cost per serving.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Revenue & Profit Calculation</h2>
        <p>
          <strong>Revenue:</strong> Sum of all sales for the selected period.<br />
          <strong>Profit:</strong> Revenue minus total breakeven for the selected period.<br />
          Use the “Profit Period” selector to view profit by day, week, month, or year.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Inventory & Stock Tracking</h2>
        <ul className="list-disc ml-6">
          <li>Stock increases when you restock (via the Restock form).</li>
          <li>Stock decreases as recipes are sold and ingredients are used.</li>
          <li>Changing “Quantity” in Product Management resets the stock to the new value (for new case/pack sizes).</li>
          <li>Restocking does not affect cost/analytics fields, only inventory.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Product Management Field Guide</h2>
        <ul className="list-disc ml-6">
          <li><strong>Product Name:</strong> The name of the ingredient/product.</li>
          <li><strong>Category/Type:</strong> Used for grouping and analytics.</li>
          <li><strong>Quantity:</strong> The number of units in a case/pack (used for cost calculations, not inventory).</li>
          <li><strong>Package Size/Unit:</strong> The size and unit of each package (e.g., 1 lb, 1 case).</li>
          <li><strong>Cost:</strong> The price paid for the package (used for cost per unit calculations).</li>
          <li><strong>Packs per Case / Units per Pack:</strong> Optional, for more detailed packaging.</li>
          <li><strong>Effective Date for Price Change:</strong> When a new cost/quantity takes effect for analytics and cost history.<br />
            <span className="text-gray-600 text-sm">
              Why change the date? If you receive a new shipment at a different price or case size, you can set the date when that new price/quantity should start affecting your cost calculations. This ensures that all sales and recipe costs before that date use the old price, and all sales after use the new price. <br />
              <strong>Example:</strong> If you update the price on July 2 but the new shipment actually arrived on July 1, set the effective date to July 1 so analytics reflect the true cost for each sale.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
} 