import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { insertExpenseSchema, type Expense } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send } from "lucide-react";

const formatCurrency = (amount: string | number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(parseFloat(amount.toString()));
};

export default function Home() {
  const { toast } = useToast();
  const [inputFocused, setInputFocused] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const { mutate: addExpense, isPending: isAddingExpense } = useMutation({
    mutationFn: async (data: { amount: string; description: string }) => {
      await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      form.reset();
      setEditingExpenseId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el gasto",
      });
    },
  });

  const { mutate: updateExpense, isPending: isUpdatingExpense } = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { amount: string; description: string } }) => {
      await apiRequest("PUT", `/api/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      form.reset();
      setEditingExpenseId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el gasto",
      });
    },
  });
  
  // Mutation for updating expense date
  const { mutate: updateExpenseDate, isPending: isUpdatingExpenseDate } = useMutation({
    mutationFn: async ({ id, date }: { id: number; date: Date }) => {
      await apiRequest("PUT", `/api/expenses/${id}/date`, { timestamp: date.toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowDateModal(false);
      setSelectedExpenseId(null);
      setSelectedDate(null);
      toast({
        title: "Fecha actualizada",
        description: "La fecha del gasto ha sido actualizada correctamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la fecha del gasto",
      });
    },
  });

  const { mutate: deleteExpense, isPending: isDeletingExpense } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Gasto eliminado",
        description: "El gasto ha sido eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el gasto",
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
      <div className="flex-1 overflow-y-auto pb-24 flex flex-col justify-end">
        <div className="max-w-2xl mx-auto p-4 w-full">
          <div className="space-y-6">
            {Object.entries(expensesByDate)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([date, { expenses: dayExpenses, total }]) => (
                <div key={date} className="space-y-2">
                  <div className="text-center">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {format(new Date(date), "EEEE d 'de' MMMM", {
                        locale: es,
                      })}
                    </span>
                  </div>

                  {/* Reversed order for expenses within each day */}
                  <div className="flex flex-col space-y-2">
                    {[...dayExpenses]
                      .sort((a, b) => {
                        // Convert timestamps to Date objects if they're not already
                        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
                        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map((expense) => (
                        <div
                          key={expense.id}
                          className="flex justify-end relative group"
                        >
                          <div className="bg-primary text-white rounded-lg p-3 max-w-[80%] relative group">
                            <div className="font-semibold text-right">
                              {formatCurrency(expense.amount)}
                            </div>
                            <div className="text-sm opacity-90 text-right">
                              {expense.description}
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="relative inline-block">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 w-5 p-0 rounded-full bg-white/80 hover:bg-white text-primary shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Toggle dropdown menu visibility
                                    const menu = e.currentTarget.nextElementSibling;
                                    if (menu) {
                                      const isHidden = menu.classList.contains('hidden');
                                      // Close all other menus first
                                      document.querySelectorAll('.expense-dropdown-menu').forEach(el => {
                                        el.classList.add('hidden');
                                      });
                                      
                                      if (isHidden) {
                                        menu.classList.remove('hidden');
                                        // Store a reference to the button
                                        const buttonRef = e.currentTarget;
                                        
                                        // Add click outside listener
                                        const closeMenu = (evt: MouseEvent) => {
                                          if (!menu.contains(evt.target as Node) && 
                                              !buttonRef.contains(evt.target as Node)) {
                                            menu.classList.add('hidden');
                                            document.removeEventListener('click', closeMenu);
                                          }
                                        };
                                        
                                        // Use setTimeout to avoid immediate trigger
                                        setTimeout(() => {
                                          document.addEventListener('click', closeMenu);
                                        }, 0);
                                      }
                                    }
                                  }}
                                >
                                  <span className="sr-only">Abrir menú</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                  </svg>
                                </Button>
                                <div
                                  className="absolute left-0 mt-2 w-40 bg-white shadow-lg rounded-md z-10 hidden expense-dropdown-menu"
                                >
                                  <div className="py-1">
                                    <button
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Edit expense - fill form with current values
                                        form.setValue("amount", expense.amount.toString());
                                        form.setValue("description", expense.description);
                                        // Set a temporary state to know we're editing
                                        setEditingExpenseId(expense.id);
                                        // Close the menu
                                        (e.target as HTMLElement).closest('.expense-dropdown-menu')?.classList.add('hidden');
                                      }}
                                    >
                                      Editar
                                    </button>
                                    <button
                                      className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteExpense(expense.id);
                                        // Close the menu
                                        (e.target as HTMLElement).closest('.expense-dropdown-menu')?.classList.add('hidden');
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                    <button
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Open date picker modal
                                        setSelectedExpenseId(expense.id);
                                        setShowDateModal(true);
                                        // Close the menu
                                        (e.target as HTMLElement).closest('.expense-dropdown-menu')?.classList.add('hidden');
                                      }}
                                    >
                                      Cambiar fecha
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="text-center">
                    <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                      Total del día: {formatCurrency(total)}
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
              onSubmit={form.handleSubmit((data) => {
                if (editingExpenseId) {
                  updateExpense({ id: editingExpenseId, data });
                } else {
                  addExpense(data);
                }
              })}
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

              <div className="flex gap-2">
                {editingExpenseId && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingExpenseId(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isAddingExpense || isUpdatingExpense || isDeletingExpense}
                >
                  {editingExpenseId ? 'Guardar' : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      
      {/* Date picker modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Seleccionar fecha</h3>
              <button 
                onClick={() => {
                  setShowDateModal(false);
                  setSelectedExpenseId(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <input 
                type="date" 
                className="w-full p-2 border rounded-md"
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value));
                  }
                }}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDateModal(false);
                  setSelectedExpenseId(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedExpenseId && selectedDate) {
                    updateExpenseDate({ id: selectedExpenseId, date: selectedDate });
                  }
                }}
                disabled={isUpdatingExpenseDate || !selectedDate}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}