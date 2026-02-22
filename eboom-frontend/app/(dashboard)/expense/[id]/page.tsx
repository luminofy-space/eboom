"use client";

import { useParams } from "next/navigation";
import ExpenseDetailPage from "@/src/views/expenses/ExpenseDetailPage";

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  return <ExpenseDetailPage id={Number(id)} />;
}
