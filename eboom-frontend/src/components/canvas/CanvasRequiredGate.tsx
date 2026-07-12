"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Stack } from "@/components/ui/stack";
import { IllustratedState } from "@/src/components/IllustratedState";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch } from "@/src/redux/store";
import { openCanvasCreateModal } from "@/src/redux/canvasSlice";

const CANVAS_OPTIONAL_PATHS = ["/wish-list"];

interface CanvasRequiredGateProps {
  children: React.ReactNode;
}

export function CanvasRequiredGate({ children }: CanvasRequiredGateProps) {
  const pathname = usePathname();
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  const { canvas, isQueryLoading } = useCanvas();

  const isOptional = CANVAS_OPTIONAL_PATHS.some(
    (path) => pathname === path || pathname.endsWith(path)
  );

  if (isOptional) {
    return <>{children}</>;
  }

  if (isQueryLoading) {
    return (
      <Stack className="flex-1" align="center" justify="center">
        <Spinner />
      </Stack>
    );
  }

  if (canvas === null) {
    return (
      <IllustratedState
        illustration="noCanvas"
        title={t("canvasGate.title")}
        description={t("canvasGate.description")}
        size="md"
        action={
          <Button onClick={() => dispatch(openCanvasCreateModal())}>
            {t("canvasGate.action")}
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
