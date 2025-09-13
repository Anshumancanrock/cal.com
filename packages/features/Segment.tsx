"use client";

import { useCallback, useMemo, useState } from "react";
import { Builder, Query, Utils as QbUtils } from "react-awesome-query-builder";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { AttributesQueryValue } from "@calcom/lib/raqb/types";
import { withRaqbSettingsAndWidgets } from "@calcom/lib/raqb/utils";
import { trpc, type RouterOutputs } from "@calcom/trpc";

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
  const { t } = useLocale();

  // Stable UUIDs - THE KEY FIX to prevent re-renders!
  const stableGroupId = useMemo(() => QbUtils.uuid(), []);
  const stableRuleId = useMemo(() => QbUtils.uuid(), []);

  // RAQB configuration with attributes
  const config = useMemo(() => {
    return withRaqbSettingsAndWidgets(
      attributes.reduce((acc, attribute) => {
        acc[attribute.id] = {
          label: attribute.name,
          type: "text",
          valueSources: ["value"],
        };
        return acc;
      }, {} as Record<string, any>)
    );
  }, [attributes]);

  // Initialize immutable tree from query value or create empty
  const [tree, setTree] = useState(() => {
    if (initialQueryValue) {
      return QbUtils.checkTree(QbUtils.loadTree(initialQueryValue), config);
    }
    // Create empty tree with stable UUID
    return QbUtils.checkTree(QbUtils.loadTree({
      id: stableGroupId,
      type: "group",
      children1: {}
    }), config);
  });

  const handleTreeChange = useCallback((newTree: any) => {
    setTree(newTree);
    const queryValue = QbUtils.getTree(newTree);
    
    // Ensure stable UUIDs in the output
    if (queryValue && typeof queryValue === 'object') {
      queryValue.id = stableGroupId;
      // If there are children, ensure they use stable UUIDs too
      if (queryValue.children1 && Object.keys(queryValue.children1).length > 0) {
        const firstChild = Object.values(queryValue.children1)[0];
        if (firstChild && typeof firstChild === 'object') {
          const newChildren1: any = {};
          newChildren1[stableRuleId] = firstChild;
          queryValue.children1 = newChildren1;
        }
      }
    }
    
    onQueryValueChange({ queryValue });
  }, [onQueryValueChange, stableGroupId, stableRuleId]);

  const renderBuilder = () => (
    <Query {...config} value={tree} onChange={handleTreeChange} renderBuilder={Builder} />
  );

  if (!attributes.length) {
    return (
      <div className="text-subtle rounded-md border border-subtle bg-muted p-4 text-center text-sm">
        {t("no_attributes_found")}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {renderBuilder()}
        <MatchingTeamMembers teamId={teamId} queryValue={QbUtils.getTree(tree)} />
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
