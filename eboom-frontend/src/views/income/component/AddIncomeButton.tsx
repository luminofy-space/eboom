"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { NewIncomeModal } from "./NewIncomeModal";

const AddIncomeButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="w-[375px] mx-auto content-center">
        <Card className="h-[177px] flex flex-col items-center justify-center gap-3">
          <div className="text-center text-2xl font-semibold">Add Income</div>
          <div className="text-center text-sm">Enter your income details.</div>
          <Button
            className="w-[80%] mx-auto min-h-[40px]"
            onClick={() => setOpen(true)}
          >
            + Add
          </Button>
        </Card>
        <NewIncomeModal open={open} setOpen={setOpen} />
      </div>
    </>
  );
};

export default AddIncomeButton;
