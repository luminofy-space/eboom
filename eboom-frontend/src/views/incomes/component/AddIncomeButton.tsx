"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

const AddIncomeButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation("incomes");
  const { t: tc } = useTranslation("common");

  return (
    <>
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-[375px] flex flex-col items-center justify-center gap-3 py-8">
          <Typography variant="title" className="text-center">{t("list.empty.title")}</Typography>
          <Typography variant="muted-sm" className="text-center">
            {t("list.empty.description")}
          </Typography>
          <Button
            className="w-[80%] min-h-[40px]"
            onClick={onClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            {tc("actions.add")}
          </Button>
        </Card>
      </div>
    </>
  );
};

export default AddIncomeButton;
