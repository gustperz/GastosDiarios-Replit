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

  return createServer(app);
}
import express from "express";
import { Server } from "http";
import { v4 as uuidv4 } from "uuid";

// Sample data for posts
const posts = [
  {
    id: uuidv4(),
    title: "Welcome to the App",
    content: "This is a sample post to get you started.",
    timestamp: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "Building with React and Express",
    content: "Learn how to build full-stack applications with React and Express.",
    timestamp: new Date().toISOString(),
  },
];

export async function registerRoutes(app: express.Express): Promise<Server> {
  const httpServer = new Server(app);

  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Get all posts
  apiRouter.get("/posts", (_req, res) => {
    res.json(posts);
  });

  // Get post by id
  apiRouter.get("/posts/:id", (req, res) => {
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  });

  // Create a new post
  apiRouter.post("/posts", (req, res) => {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }
    
    const newPost = {
      id: uuidv4(),
      title,
      content,
      timestamp: new Date().toISOString(),
    };
    
    posts.push(newPost);
    res.status(201).json(newPost);
  });

  return httpServer;
}
