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
  
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.updateExpense(id, data);
      if (!expense) {
        return res.status(404).json({ message: "Gasto no encontrado" });
      }
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos" });
    }
  });
  
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id);
      if (!success) {
        return res.status(404).json({ message: "Gasto no encontrado" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar el gasto" });
    }
  });
  
  // Endpoint para actualizar la fecha de un gasto
  app.put("/api/expenses/:id/date", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { timestamp } = req.body;
      
      if (!timestamp) {
        return res.status(400).json({ message: "Fecha no proporcionada" });
      }
      
      const expense = await storage.updateExpenseDate(id, new Date(timestamp));
      if (!expense) {
        return res.status(404).json({ message: "Gasto no encontrado" });
      }
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar la fecha del gasto" });
    }
  });

  return createServer(app);
}
