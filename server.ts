import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Loan Prediction API
  app.post("/api/predict", (req, res) => {
    try {
      const { income, expenses, savings, existingLoans, assets, age } = req.body;

      // Parse values as numbers
      const nIncome = parseFloat(income) || 0;
      const nExpenses = parseFloat(expenses) || 0;
      const nSavings = parseFloat(savings) || 0;
      const nExistingLoans = parseFloat(existingLoans) || 0;
      const nAge = parseInt(age) || 0;

      const disposableIncome = nIncome - nExpenses;
      const stabilityScore = nIncome > 0 ? (disposableIncome + nSavings) / nIncome : 0;

      let status = "Rejected";
      let riskLevel = "High";
      let creditScore = 300 + Math.floor(stabilityScore * 400);
      let suggestedAmount = 0;

      // Eligibility Logic
      const reasons: string[] = [];
      
      if (nAge < 18) {
        reasons.push("Applicant must be at least 18 years old to apply for a loan.");
      }
      if (nIncome <= 25000) {
        reasons.push("Monthly income is below the minimum requirement of ₹25,000.");
      }
      if (stabilityScore <= 0.4) {
        reasons.push("Financial stability ratio is low. Your expenses and existing debts are high relative to your income and savings.");
      }
      if (nExistingLoans >= (nIncome * 0.5)) {
        reasons.push("Existing loan burden is too high compared to your monthly income.");
      }

      if (reasons.length === 0) {
        status = "Approved";
        riskLevel = stabilityScore > 0.7 ? "Low" : "Moderate";
        creditScore += 150;
        suggestedAmount = Math.floor(nIncome * 12 * 0.3); // 30% of annual income
      }

      // Cap credit score between 300 and 850
      creditScore = Math.max(300, Math.min(850, creditScore));

      res.json({
        status,
        riskLevel,
        creditScore,
        suggestedAmount: suggestedAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
        reasons,
        details: {
          disposableIncome,
          stabilityScore: stabilityScore.toFixed(2)
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
