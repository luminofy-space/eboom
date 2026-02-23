"use client";

import { ChartAreaInteractive } from "@/src/components/details/chart-area-interactive";
import { DataTable } from "@/src/components/details/data-table";
import { SectionCards } from "@/src/components/details/section-cards";
import { useRouter } from "next/navigation";
import data from "@/src/_mocks/data.json"
const DashboardPage = () => {
  return <>
    <div className="px-4 lg:px-6">
      <ChartAreaInteractive />
    </div>
    <SectionCards />
    <DataTable data={data} /> 
  </>;
};

export default DashboardPage;