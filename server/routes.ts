import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertExpenseSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.get("/api/expenses", async (_req, res) => {
    const expenses = await storage.getExpenses();
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(data);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos" });
    }
  });

  return createServer(app);
}
