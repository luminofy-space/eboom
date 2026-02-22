"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import Link from "next/link";
import { useState } from "react";
import { NewIncomeModal } from "./component/NewIncomeModal";
import AddIncomeButton from "./component/AddIncomeButton";

interface IncomeResource {
  id: number;
  name: string;
  isRecurring: boolean;
  description?: string;
}

export default function IncomesListPage() {
  const { canvas } = useCanvas();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQueryApi<{ incomeResources: IncomeResource[] }>(
    canvas ? API_ROUTES.CANVASES_INCOME_RESOURCES_LIST(canvas) : "",
    {
      queryKey: ["income-resources", canvas],
      hasToken: true,
      enabled: !!canvas,
    }
  );

  const incomeResources = data?.incomeResources ?? [];

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
      {incomeResources.length === 0 ? (
        <AddIncomeButton onClick={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-3">
          {incomeResources.map((resource) => (
            <Link key={resource.id} href={`/income/${resource.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{resource.name}</CardTitle>
                  <CardDescription>
                    {resource.isRecurring ? "Recurring" : "One-time"}
                    {resource.description && ` · ${resource.description}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <NewIncomeModal open={open} setOpen={setOpen} />
    </>
  );
}
