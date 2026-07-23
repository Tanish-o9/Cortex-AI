import pool from "../../../shared/db/postgres.js";

/**
 * Aggregates enterprise metrics for cost and utilization dashboard.
 */
export async function getEnterpriseAnalytics(req, res) {
  try {
    // Compile active users (MAU/DAU), invoices data, and model usage costs
    const invoicesResult = await pool.query(
      "SELECT SUM(amount) as total_revenue, COUNT(*) as invoices_count FROM invoices WHERE status = 'paid'"
    );
    const invoiceStats = invoicesResult.rows[0];

    const revenue = parseFloat(invoiceStats.total_revenue || 0) / 100; // convert from paise/cents if needed

    // Generate mock enterprise utilization metrics
    const analytics = {
      dau: [
        { date: "Jul 17", count: 120 },
        { date: "Jul 18", count: 145 },
        { date: "Jul 19", count: 160 },
        { date: "Jul 20", count: 135 },
        { date: "Jul 21", count: 190 },
        { date: "Jul 22", count: 210 },
        { date: "Jul 23", count: 235 }
      ],
      runningAgents: 45,
      activeWorkflows: 18,
      workflowSuccessRate: 94.2,
      workflowFailureRate: 5.8,
      avgExecutionTimeMs: 1420,
      totalRevenue: revenue,
      llmUsage: [
        { model: "Llama-3.3-70b", tokens: 1250000, cost: 0.625 },
        { model: "DeepSeek-Chat", tokens: 4800000, cost: 0.96 },
        { model: "Gemini-2.5-Flash", tokens: 950000, cost: 1.14 }
      ],
      costTrends: [
        { date: "Jul 17", cost: 0.25 },
        { date: "Jul 18", cost: 0.42 },
        { date: "Jul 19", cost: 0.38 },
        { date: "Jul 20", cost: 0.55 },
        { date: "Jul 21", cost: 0.81 },
        { date: "Jul 22", cost: 0.72 },
        { date: "Jul 23", cost: 0.96 }
      ]
    };

    res.status(200).json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Exports analytics data in CSV format.
 */
export async function exportAnalyticsCSV(req, res) {
  try {
    const csvContent = `Metric,Value,Unit
Daily Active Users (DAU),235,Users
Running Agents,45,Instances
Active Workflows,18,Runs
Workflow Success Rate,94.2,%
Average Execution Time,1420,ms
Total Tokens Consumed,7000000,Tokens
Total LLM Accrued Cost,2.725,USD
`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=cortex_analytics_report.csv");
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
