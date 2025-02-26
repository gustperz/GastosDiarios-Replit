import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { insertExpenseSchema, type Expense } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [inputFocused, setInputFocused] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      amount: "",
      description: "",
    },
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { mutate: addExpense, isPending } = useMutation({
    mutationFn: async (data: { amount: string; description: string }) => {
      await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      form.reset();
      toast({
        title: "Gasto agregado",
        description: "El gasto se ha registrado correctamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el gasto",
      });
    },
  });

  // Group expenses by date
  const expensesByDate = expenses.reduce((acc, expense) => {
    const date = format(new Date(expense.timestamp), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = {
        expenses: [],
        total: 0,
      };
    }
    acc[date].expenses.push(expense);
    acc[date].total += parseFloat(expense.amount.toString());
    return acc;
  }, {} as Record<string, { expenses: Expense[]; total: number }>);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat messages area with bottom padding for input */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto p-4">
          <div className="space-y-6">
            {Object.entries(expensesByDate)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([date, { expenses, total }]) => (
                <div key={date} className="space-y-2">
                  <div className="text-center">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {format(new Date(date), "EEEE d 'de' MMMM", {
                        locale: es,
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col-reverse space-y-reverse space-y-2">
                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex justify-end"
                      >
                        <div className="bg-primary text-white rounded-lg p-3 max-w-[80%]">
                          <div className="font-semibold">
                            ${parseFloat(expense.amount.toString()).toFixed(2)}
                          </div>
                          <div className="text-sm opacity-90">
                            {expense.description}
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            {format(new Date(expense.timestamp), "HH:mm")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                      Total del día: ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Fixed input form at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-2xl mx-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => addExpense(data))}
              className="flex gap-2"
            >
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Monto"
                          step="0.01"
                          className={`transition-all ${
                            inputFocused ? "w-full" : "w-24"
                          }`}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex-[2]">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Descripción del gasto"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}