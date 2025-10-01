import { useFormContext, Controller } from "react-hook-form";
import { memo } from "react";
import type { FormValues } from "@calcom/features/eventtypes/lib/types";
import { Label } from "@calcom/ui/components/form";
import { RadioAreaGroup as RadioArea } from "@calcom/ui/components/radio";
import { SettingsToggle } from "@calcom/ui/components/form";
import { Tooltip } from "@calcom/ui/components/tooltip";
import { RRTimestampBasis } from "@calcom/prisma/enums";
import type { UseFormGetValues } from "react-hook-form";

interface RoundRobinSectionProps {
  t: (key: string) => string;
  rrTimestampBasis: RRTimestampBasis | null | undefined;
  handleMaxLeadThresholdChange: (val: string, onChange: (value: number | null) => void) => void;
  getValues: UseFormGetValues<FormValues>;
}

/**
 * CRITICAL ISOLATION: This component is completely isolated from parent re-renders.
 * CRITICAL: Does NOT call useFormContext() to avoid React Context subscription!
 * Receives getValues as prop instead to prevent form change subscriptions.
 * It only re-renders when:
 * 1. Its props change (rrTimestampBasis, handlers - which are memoized)
 * 2. The form fields it directly controls change (via Controller subscriptions)
 * 
 * It does NOT re-render when hostGroups or any nested fields change,
 * which is exactly what we need to prevent focus loss in the attributes filter.
 */
const RoundRobinSection = memo(({ t, rrTimestampBasis, handleMaxLeadThresholdChange, getValues }: RoundRobinSectionProps) => {
  const { control } = useFormContext<FormValues>();
  
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
              {(rrTimestampBasis &&
                rrTimestampBasis !== RRTimestampBasis.CREATED_AT) ||
              getValues("hostGroups")?.length > 1 ? (
                <Tooltip
                  content={
                    !!(
                      rrTimestampBasis &&
                      rrTimestampBasis !== RRTimestampBasis.CREATED_AT
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
},
// Custom comparison: only re-render if rrTimestampBasis value actually changes
// This prevents re-renders when parent passes new eventType object with same value
(prevProps, nextProps) => {
  const same = prevProps.rrTimestampBasis === nextProps.rrTimestampBasis;
  
  if (!same) {
    console.log("[RoundRobinSection memo] rrTimestampBasis changed:", {
      prev: prevProps.rrTimestampBasis,
      next: nextProps.rrTimestampBasis
    });
  }
  
  return same;
});

RoundRobinSection.displayName = "RoundRobinSection";

export default RoundRobinSection;
