import { type Expense, type InsertExpense } from "@shared/schema";

export interface IStorage {
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpenses(): Promise<Expense[]>;
}

export class MemStorage implements IStorage {
  private expenses: Map<number, Expense>;
  private currentId: number;

  constructor() {
    this.expenses = new Map();
    this.currentId = 1;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentId++;
    const expense: Expense = {
      id,
      amount: insertExpense.amount as any, // numeric type handling
      description: insertExpense.description,
      timestamp: new Date()
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
