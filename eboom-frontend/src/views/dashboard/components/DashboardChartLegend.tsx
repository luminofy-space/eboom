"use client";

import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { getCurrencyColorMap } from "../utils/assignCurrencyChartColors";
import { useTranslation } from "react-i18next";

interface DashboardChartLegendProps {
  currencyCodes: string[];
}

export function DashboardChartLegend({
  currencyCodes,
}: DashboardChartLegendProps) {
  const { t } = useTranslation("dashboard");
  const colorMap = getCurrencyColorMap(currencyCodes);

  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 pt-4">
      {currencyCodes.map((code) => {
        const color = colorMap[code];

        return (
          <Stack key={code} gap={2}>
            <Typography variant="label">{code}</Typography>
            <Stack direction="row" gap={3} className="flex-wrap">
              <LegendSwatch
                color={color}
                dashed={false}
                label={t("chart.legend.received")}
              />
              <LegendSwatch
                color={color}
                dashed
                label={t("chart.legend.paid")}
              />
            </Stack>
          </Stack>
        );
      })}
    </div>
  );
}

function LegendSwatch({
  color,
  dashed,
  label,
}: {
  color: string;
  dashed: boolean;
  label: string;
}) {
  return (
    <Stack direction="row" align="center" gap={2} className="text-xs">
      <span
        className="inline-block h-0.5 w-4 shrink-0 rounded-full"
        style={{
          backgroundColor: dashed ? "transparent" : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
          height: dashed ? 0 : undefined,
        }}
      />
      <Typography variant="muted-sm">{label}</Typography>
    </Stack>
  );
}
