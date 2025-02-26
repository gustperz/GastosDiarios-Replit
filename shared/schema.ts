import { pgTable, text, serial, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});

export const insertExpenseSchema = createInsertSchema(expenses)
  .omit({ id: true, timestamp: true })
  .extend({
    amount: z.string().refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "El monto debe ser un número positivo"
    ),
  });

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
