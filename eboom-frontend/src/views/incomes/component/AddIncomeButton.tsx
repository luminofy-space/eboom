"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IllustratedState } from "@/src/components/IllustratedState";

interface AddIncomeButtonProps {
  onClick: () => void;
  canEdit?: boolean;
}

const AddIncomeButton = ({ onClick, canEdit = true }: AddIncomeButtonProps) => {
  const { t } = useTranslation("incomes");
  const { t: tc } = useTranslation("common");

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <IllustratedState
        illustration="empty"
        layout="card"
        title={t("list.empty.title")}
        description={t("list.empty.description")}
        action={
          canEdit ? (
            <Button className="w-[80%] min-h-[40px]" onClick={onClick}>
              <Plus className="mr-2 h-4 w-4" />
              {tc("actions.add")}
            </Button>
          ) : undefined
        }
      />
    </div>
  );
};

export default AddIncomeButton;
