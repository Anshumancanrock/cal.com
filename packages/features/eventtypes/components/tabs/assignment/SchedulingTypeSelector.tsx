import { memo } from "react";
import type { TFunction } from "i18next";
import { Controller, useFormContext } from "react-hook-form";

import type { FormValues } from "@calcom/features/eventtypes/lib/types";
import { SchedulingType } from "@calcom/prisma/enums";
import classNames from "@calcom/ui/classNames";
import { Select } from "@calcom/ui/components/form";

import type { EventTeamAssignmentTabCustomClassNames } from "./EventTeamAssignmentTab";

/**
 * Scheduling Type Selector - Isolated component to prevent Controller subscription from affecting parent
 * 
 * CRITICAL: This component is isolated because Controller subscribes to form changes in react-hook-form v7+
 * By isolating it in its own memo'd component, when it re-renders due to form changes,
 * it won't cause the parent EventTeamAssignmentTab to re-render
 */
const SchedulingTypeSelector = memo(
  ({
    t,
    schedulingTypeOptions,
    handleSchedulingTypeChange,
    customClassNames,
  }: {
    t: TFunction;
    schedulingTypeOptions: { value: SchedulingType; label: string }[];
    handleSchedulingTypeChange: (
      newSchedulingType: SchedulingType | undefined,
      onChange: (value: SchedulingType | undefined) => void
    ) => void;
    customClassNames?: EventTeamAssignmentTabCustomClassNames;
  }) => {
    console.log("[SchedulingTypeSelector] RENDER - Controller component is re-rendering");
    
    const { control } = useFormContext<FormValues>();
    
    return (
      <Controller<FormValues>
        name="schedulingType"
        control={control}
        render={({ field: { value: schedulingTypeValue, onChange } }) => (
          <Select
            options={schedulingTypeOptions}
            value={schedulingTypeOptions.find((opt) => opt.value === schedulingTypeValue)}
            className={classNames("w-full", customClassNames?.assignmentType?.schedulingTypeSelect?.select)}
            innerClassNames={customClassNames?.assignmentType?.schedulingTypeSelect?.innerClassNames}
            onChange={(val) => handleSchedulingTypeChange(val?.value, onChange)}
          />
        )}
      />
    );
  },
  // Custom comparison: only re-render if schedulingTypeOptions array length changes
  // We can't do deep comparison because handleSchedulingTypeChange is a callback
  // But since schedulingTypeOptions is now memoized in parent, reference should be stable
  (prevProps, nextProps) => {
    const optionsUnchanged = prevProps.schedulingTypeOptions.length === nextProps.schedulingTypeOptions.length;
    const classNamesUnchanged = prevProps.customClassNames === nextProps.customClassNames;
    
    console.log("[SchedulingTypeSelector memo comparison]", {
      optionsUnchanged,
      classNamesUnchanged,
      shouldSkipRender: optionsUnchanged && classNamesUnchanged
    });
    
    return optionsUnchanged && classNamesUnchanged;
  }
);

SchedulingTypeSelector.displayName = "SchedulingTypeSelector";

export default SchedulingTypeSelector;
