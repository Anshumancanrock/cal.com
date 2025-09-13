"use client";

import { useCallback, useState } from "react";
import { Utils as QbUtils } from "react-awesome-query-builder";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { AttributesQueryValue } from "@calcom/lib/raqb/types";
import { trpc, type RouterOutputs } from "@calcom/trpc";
import cn from "@calcom/ui/classNames";

export type Attributes = RouterOutputs["viewer"]["appRoutingForms"]["getAttributesForTeam"];
export function useAttributes(teamId: number) {
  const { data: attributes, isPending } = trpc.viewer.appRoutingForms.getAttributesForTeam.useQuery({
    teamId,
  });
  return {
    attributes,
    isPending,
  };
}

// Simple custom filter for attributes - no RAQB complexity
function AttributeFilter({
  attributes,
  value,
  onChange,
}: {
  attributes: Attributes;
  value: { attributeId: string; operator: string; filterValue: string } | null;
  onChange: (filter: { attributeId: string; operator: string; filterValue: string } | null) => void;
}) {
  const { t } = useLocale();
  const [localFilter, setLocalFilter] = useState(value || { attributeId: "", operator: "equals", filterValue: "" });

  const handleChange = useCallback((updates: Partial<typeof localFilter>) => {
    const newFilter = { ...localFilter, ...updates };
    setLocalFilter(newFilter);
    
    // Only call onChange if we have a complete filter
    if (newFilter.attributeId && newFilter.filterValue) {
      onChange(newFilter);
    } else if (!newFilter.attributeId && !newFilter.filterValue) {
      onChange(null);
    }
  }, [localFilter, onChange]);

  return (
    <div className="space-y-3 rounded-md border border-subtle bg-default p-4">
      <div className="grid grid-cols-3 gap-3">
        {/* Attribute Selection */}
        <select
          value={localFilter.attributeId}
          onChange={(e) => handleChange({ attributeId: e.target.value })}
          className="rounded-md border border-default bg-default px-3 py-2 text-sm focus:border-emphasis focus:outline-none focus:ring-2 focus:ring-brand-default"
        >
          <option value="">{t("select_attribute")}</option>
          {attributes.map((attr) => (
            <option key={attr.id} value={attr.id}>
              {attr.name}
            </option>
          ))}
        </select>

        {/* Operator Selection */}
        <select
          value={localFilter.operator}
          onChange={(e) => handleChange({ operator: e.target.value })}
          className="rounded-md border border-default bg-default px-3 py-2 text-sm focus:border-emphasis focus:outline-none focus:ring-2 focus:ring-brand-default"
        >
          <option value="equals">{t("equals")}</option>
          <option value="contains">{t("contains")}</option>
          <option value="not_equals">{t("not_equals")}</option>
        </select>

        {/* Value Input */}
        <input
          type="text"
          value={localFilter.filterValue}
          onChange={(e) => handleChange({ filterValue: e.target.value })}
          placeholder={t("enter_value")}
          className="rounded-md border border-default bg-default px-3 py-2 text-sm focus:border-emphasis focus:outline-none focus:ring-2 focus:ring-brand-default"
        />
      </div>
      
      {localFilter.attributeId && localFilter.filterValue && (
        <div className="text-xs text-muted">
          Filter: {attributes.find(a => a.id === localFilter.attributeId)?.name} {localFilter.operator} "{localFilter.filterValue}"
        </div>
      )}
    </div>
  );
}

function SegmentWithAttributes({
  attributes,
  teamId,
  queryValue: initialQueryValue,
  onQueryValueChange,
  className,
}: {
  attributes: Attributes;
  teamId: number;
  queryValue: AttributesQueryValue | null;
  onQueryValueChange: ({ queryValue }: { queryValue: AttributesQueryValue }) => void;
  className?: string;
}) {
  // Convert RAQB queryValue to simple filter format
  const [simpleFilter, setSimpleFilter] = useState<{ attributeId: string; operator: string; filterValue: string } | null>(() => {
    // Extract simple filter from RAQB queryValue if it exists
    if (initialQueryValue?.children1) {
      const firstRule = Object.values(initialQueryValue.children1)[0];
      if (firstRule?.type === "rule" && firstRule.properties) {
        return {
          attributeId: firstRule.properties.field || "",
          operator: firstRule.properties.operator || "equals", 
          filterValue: firstRule.properties.value?.[0] || ""
        };
      }
    }
    return null;
  });

  const handleFilterChange = useCallback((filter: { attributeId: string; operator: string; filterValue: string } | null) => {
    setSimpleFilter(filter);
    
    // Convert simple filter back to RAQB format for compatibility
    let raqbQuery: AttributesQueryValue;
    
    if (filter && filter.attributeId && filter.filterValue) {
      raqbQuery = {
        id: QbUtils.uuid(),
        type: "group",
        children1: {
          [QbUtils.uuid()]: {
            type: "rule",
            properties: {
              field: filter.attributeId,
              operator: filter.operator,
              value: [filter.filterValue],
              valueSrc: ["value"],
              valueType: ["text"]
            }
          }
        }
      };
    } else {
      // Empty query
      raqbQuery = {
        id: QbUtils.uuid(), 
        type: "group",
        children1: {}
      };
    }
    
    onQueryValueChange({ queryValue: raqbQuery });
  }, [onQueryValueChange]);

  return (
    <div className={className}>
      <AttributeFilter
        attributes={attributes}
        value={simpleFilter}
        onChange={handleFilterChange}
      />
      <div className="mt-4 text-sm">
        <MatchingTeamMembers teamId={teamId} queryValue={simpleFilter ? {
          id: QbUtils.uuid(),
          type: "group", 
          children1: {
            [QbUtils.uuid()]: {
              type: "rule",
              properties: {
                field: simpleFilter.attributeId,
                operator: simpleFilter.operator,
                value: [simpleFilter.filterValue],
                valueSrc: ["value"],
                valueType: ["text"]
              }
            }
          }
        } : null} />
      </div>
    </div>
  );
}

function MatchingTeamMembers({
  teamId,
  queryValue,
}: {
  teamId: number;
  queryValue: AttributesQueryValue | null;
}) {
  const { t } = useLocale();

  // Check if queryValue has valid children properties value
  const hasValidValue = queryValue?.children1
    ? Object.values(queryValue.children1).some(
        (child) => child.properties?.value?.[0] !== undefined && child.properties?.value?.[0] !== null
      )
    : false;

  const { data: matchingTeamMembersWithResult, isPending } =
    trpc.viewer.attributes.findTeamMembersMatchingAttributeLogic.useQuery(
      {
        teamId,
        attributesQueryValue: queryValue,
        _enablePerf: true,
      },
      {
        enabled: hasValidValue,
      }
    );

  if (isPending) {
    return (
      <div
        className="border-subtle bg-muted mt-4 space-y-3 rounded-md border p-4"
        data-testid="segment_loading_state">
        <div className="text-emphasis flex items-center text-sm font-medium">
          <div className="bg-subtle h-4 w-32 animate-pulse rounded" />
        </div>
        <ul className="divide-subtle divide-y">
          {[...Array(3)].map((_, index) => (
            <li key={index} className="flex items-center py-2">
              <div className="flex flex-1 items-center space-x-2 text-sm">
                <div className="bg-subtle h-4 w-24 animate-pulse rounded" />
                <div className="bg-subtle h-4 w-32 animate-pulse rounded" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!matchingTeamMembersWithResult) return <span>{t("something_went_wrong")}</span>;
  const { result: matchingTeamMembers } = matchingTeamMembersWithResult;
  if (!matchingTeamMembers || !queryValue) {
    return (
      <div className="border-subtle bg-muted mt-4 space-y-3 rounded-md border p-4">
        <div className="text-subtle flex items-center text-sm font-medium">
          <span>{t("no_filter_set")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-subtle bg-muted mt-4 space-y-3 rounded-md border p-4">
      <div className="text-emphasis flex items-center text-sm font-medium">
        <span>{t("x_matching_members", { x: matchingTeamMembers.length })}</span>
      </div>
      <ul className="divide-subtle divide-y">
        {matchingTeamMembers.map((member) => (
          <li key={member.id} className="flex items-center py-2">
            <div className="flex flex-1 items-center space-x-2 text-sm">
              <span className="font-medium">{member.name}</span>
              <span className="text-subtle">({member.email})</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Segment({
  teamId,
  queryValue,
  onQueryValueChange,
  className,
}: {
  teamId: number;
  queryValue: AttributesQueryValue | null;
  onQueryValueChange: ({ queryValue }: { queryValue: AttributesQueryValue }) => void;
  className?: string;
}) {
  const { attributes, isPending } = useAttributes(teamId);
  const { t } = useLocale();
  if (isPending) return <span>Loading...</span>;
  if (!attributes) {
    console.log("Error fetching attributes");
    return <span>{t("something_went_wrong")}</span>;
  }

  return (
    <SegmentWithAttributes
      teamId={teamId}
      attributes={attributes}
      queryValue={queryValue}
      onQueryValueChange={onQueryValueChange}
      className={className}
    />
  );
}
