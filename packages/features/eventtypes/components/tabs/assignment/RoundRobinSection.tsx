import { useFormContext, Controller } from "react-hook-form";
import { memo } from "react";
import type { FormValues } from "@calcom/features/eventtypes/lib/types";
import { Label } from "@calcom/ui/components/form";
import { RadioAreaGroup as RadioArea } from "@calcom/ui/components/radio";
import { SettingsToggle } from "@calcom/ui/components/form";
import { Tooltip } from "@calcom/ui/components/tooltip";
import { RRTimestampBasis } from "@calcom/prisma/enums";

interface RoundRobinSectionProps {
  t: (key: string) => string;
  eventType: any;
  handleMaxLeadThresholdChange: (val: string, onChange: (value: number | null) => void) => void;
}

/**
 * CRITICAL ISOLATION: This component is completely isolated from parent re-renders.
 * It only re-renders when:
 * 1. Its props change (eventType, handlers - which are memoized)
 * 2. The form fields it directly controls change (maxLeadThreshold, includeNoShowInRRCalculation)
 * 
 * It does NOT re-render when hostGroups or any nested fields change,
 * which is exactly what we need to prevent focus loss in the attributes filter.
 */
const RoundRobinSection = memo(({ t, eventType, handleMaxLeadThresholdChange }: RoundRobinSectionProps) => {
  const { getValues } = useFormContext<FormValues>();
  
  console.log("[RoundRobinSection] RENDER - This should NOT log when typing in attributes filter");

  return (
    <div className="border-subtle mt-4 flex flex-col rounded-md">
      <div className="border-subtle rounded-t-md border p-6 pb-5">
        <Label className="mb-1 text-sm font-semibold">{t("rr_distribution_method")}</Label>
        <p className="text-subtle max-w-full break-words text-sm leading-tight">
          {t("rr_distribution_method_description")}
        </p>
      </div>
      <div className="border-subtle rounded-b-md border border-t-0 p-6">
        <Controller
          name="maxLeadThreshold"
          render={({ field: { value, onChange } }) => (
            <RadioArea.Group
              onValueChange={(val) => handleMaxLeadThresholdChange(val, onChange)}
              className="mt-1 flex flex-col gap-4">
              <RadioArea.Item
                value="maximizeAvailability"
                checked={value === null}
                className="w-full text-sm"
                classNames={{ container: "w-full" }}>
                <strong className="mb-1 block">
                  {t("rr_distribution_method_availability_title")}
                </strong>
                <p>{t("rr_distribution_method_availability_description")}</p>
              </RadioArea.Item>
              {(eventType.team?.rrTimestampBasis &&
                eventType.team?.rrTimestampBasis !== RRTimestampBasis.CREATED_AT) ||
              getValues("hostGroups")?.length > 1 ? (
                <Tooltip
                  content={
                    !!(
                      eventType.team?.rrTimestampBasis &&
                      eventType.team?.rrTimestampBasis !== RRTimestampBasis.CREATED_AT
                    )
                      ? t("rr_load_balancing_disabled")
                      : t("rr_load_balancing_disabled_with_groups")
                  }>
                  <div className="w-full">
                    <RadioArea.Item
                      value="loadBalancing"
                      checked={value !== null}
                      className="text-sm"
                      disabled={true}
                      classNames={{ container: "w-full" }}>
                      <strong className="mb-1">{t("rr_distribution_method_balanced_title")}</strong>
                      <p>{t("rr_distribution_method_balanced_description")}</p>
                    </RadioArea.Item>
                  </div>
                </Tooltip>
              ) : (
                <div className="w-full">
                  <RadioArea.Item
                    value="loadBalancing"
                    checked={value !== null}
                    className="text-sm"
                    classNames={{ container: "w-full" }}>
                    <strong className="mb-1">{t("rr_distribution_method_balanced_title")}</strong>
                    <p>{t("rr_distribution_method_balanced_description")}</p>
                  </RadioArea.Item>
                </div>
              )}
            </RadioArea.Group>
          )}
        />
        <div className="mt-4">
          <Controller
            name="includeNoShowInRRCalculation"
            render={({ field: { value, onChange } }) => (
              <SettingsToggle
                title={t("include_no_show_in_rr_calculation")}
                labelClassName="mt-1.5"
                checked={value}
                onCheckedChange={(val) => onChange(val)}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
});

RoundRobinSection.displayName = "RoundRobinSection";

export default RoundRobinSection;
