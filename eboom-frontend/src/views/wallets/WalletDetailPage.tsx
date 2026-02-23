"use client";

import { ChartAreaInteractive } from "@/src/components/details/chart-area-interactive";
import { DataTable } from "@/src/components/details/data-table";
import { SectionCards } from "@/src/components/details/section-cards";
import data from "@/src/_mocks/data.json";

interface Props {
  id: number;
}

export default function WalletDetailPage({ id }: Props) {
  return (
    <>
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <SectionCards />
      <DataTable data={data} />
    </>
  );
}
