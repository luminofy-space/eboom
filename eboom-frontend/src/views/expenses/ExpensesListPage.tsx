"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { Plus } from "lucide-react";
import Link from "next/link";

interface Expense {
  id: number;
  name: string;
  description?: string;
  expenseType?: string;
}

export default function ExpensesListPage() {
  const { canvas } = useCanvas();

  const { data, isLoading } = useQueryApi<{ expenses: Expense[] }>(
    canvas ? API_ROUTES.CANVASES_EXPENSES_LIST(canvas) : "",
    {
      queryKey: ["expenses", canvas],
      hasToken: true,
      enabled: !!canvas,
    }
  );

  const expenses = data?.expenses ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      {expenses.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-[375px] flex flex-col items-center justify-center gap-3 py-8">
            <div className="text-center text-2xl font-semibold">Add Expense</div>
            <div className="text-center text-sm text-muted-foreground">
              Track your spending and manage your budgets.
            </div>
            <Button className="w-[80%] min-h-[40px]">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-3">
          {expenses.map((expense) => (
            <Link key={expense.id} href={`/expense/${expense.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{expense.name}</CardTitle>
                  <CardDescription>
                    {expense.expenseType || "Expense"}
                    {expense.description && ` · ${expense.description}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
