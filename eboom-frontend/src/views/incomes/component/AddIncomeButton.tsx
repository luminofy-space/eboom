"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Plus } from "lucide-react";

const AddIncomeButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <>
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-[375px] flex flex-col items-center justify-center gap-3 py-8">
          <Typography variant="title" className="text-center">Add Income</Typography>
          <Typography variant="muted-sm" className="text-center">
            Track your income sources and earnings.
          </Typography>
          <Button
            className="w-[80%] min-h-[40px]"
            onClick={onClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </Card>
      </div>
    </>
  );
};

export default AddIncomeButton;
