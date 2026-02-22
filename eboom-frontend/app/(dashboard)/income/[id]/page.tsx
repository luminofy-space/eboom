"use client";

import { useParams } from "next/navigation";
import IncomeDetailPage from "@/src/views/incomes/IncomeDetailPage";

export default function IncomeDetail() {
  const { id } = useParams<{ id: string }>();
  return <IncomeDetailPage id={Number(id)} />;
}
