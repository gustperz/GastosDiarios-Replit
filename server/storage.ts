import { type Expense, type InsertExpense } from "@shared/schema";

export interface IStorage {
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpenses(): Promise<Expense[]>;
  updateExpense(id: number, expense: InsertExpense): Promise<Expense | null>;
  deleteExpense(id: number): Promise<boolean>;
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
      .map(expense => {
        // Asegurar que timestamp sea siempre un objeto Date
        if (!(expense.timestamp instanceof Date)) {
          expense.timestamp = new Date(expense.timestamp);
        }
        return expense;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async updateExpense(id: number, updateData: InsertExpense): Promise<Expense | null> {
    if (!this.expenses.has(id)) {
      return null;
    }
    
    const existingExpense = this.expenses.get(id)!;
    const updatedExpense: Expense = {
      ...existingExpense,
      amount: updateData.amount as any,
      description: updateData.description,
      // Keep the original timestamp
    };
    
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    if (!this.expenses.has(id)) {
      return false;
    }
    
    return this.expenses.delete(id);
  }
  
  async updateExpenseDate(id: number, newDate: Date): Promise<Expense | null> {
    if (!this.expenses.has(id)) {
      return null;
    }
    
    const existingExpense = this.expenses.get(id)!;
    const updatedExpense: Expense = {
      ...existingExpense,
      timestamp: newDate
    };
    
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }
}

export const storage = new MemStorage();
