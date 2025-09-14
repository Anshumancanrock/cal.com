"use client";

import { useCallback, useMemo, useState, useEffect, memo, useRef } from "react";
import { Query, Builder, Utils as QbUtils } from "react-awesome-query-builder";
import type { ImmutableTree, BuilderProps } from "react-awesome-query-builder";
import type { JsonTree } from "react-awesome-query-builder";

import {
  withRaqbSettingsAndWidgets,
  ConfigFor,
} from "@calcom/app-store/routing-forms/components/react-awesome-query-builder/config/uiConfig";
import { getQueryBuilderConfigForAttributes } from "@calcom/app-store/routing-forms/lib/getQueryBuilderConfig";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { buildStateFromQueryValue } from "@calcom/lib/raqb/raqbUtils";
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
  // Stable configs - memoized once
  const attributesConfig = useMemo(
    () => getQueryBuilderConfigForAttributes({ attributes }),
    [attributes]
  );
  
  const configWithSettings = useMemo(
    () =>
      withRaqbSettingsAndWidgets({
        config: attributesConfig,
        configFor: ConfigFor.Attributes,
      }),
    [attributesConfig]
  );

  // State management exactly like working routing forms
  const [treeState, setTreeState] = useState<{ tree: ImmutableTree; config: typeof configWithSettings }>(() => {
    const state = buildStateFromQueryValue({
      queryValue: (initialQueryValue as JsonTree) ?? null,
      config: configWithSettings,
    });
    return { tree: state.state.tree, config: configWithSettings };
  });

  // Stable ref to prevent infinite loops
  const lastQueryValueRef = useRef<string>();

  // Sync with parent changes - preventing loops with ref comparison
  useEffect(() => {
    const queryValueString = JSON.stringify(initialQueryValue);
    if (lastQueryValueRef.current !== queryValueString) {
      const state = buildStateFromQueryValue({
        queryValue: (initialQueryValue as JsonTree) ?? null,
        config: configWithSettings,
      });
      setTreeState({ tree: state.state.tree, config: configWithSettings });
      lastQueryValueRef.current = queryValueString;
    }
  }, [initialQueryValue, configWithSettings]);

  // Stable renderBuilder - never changes
  const renderBuilder = useCallback(
    (props: BuilderProps) => (
      <div className="query-builder-container" data-testid="query-builder-container">
        <div className="query-builder qb-lite">
          <Builder {...props} />
        </div>
      </div>
    ),
    []
  );

  // Stable onChange handler - exactly like routing forms
  const handleChange = useCallback((immutableTree: ImmutableTree, config: any) => {
    // Update internal state immediately (critical for focus preservation)
    setTreeState({ tree: immutableTree, config });
    
    // Extract and send to parent
    const jsonTree = QbUtils.getTree(immutableTree) as AttributesQueryValue;
    lastQueryValueRef.current = JSON.stringify(jsonTree);
    onQueryValueChange({ queryValue: jsonTree });
  }, [onQueryValueChange]);

  return (
    <div>
      <div className={cn("cal-query-builder", className)}>
        <Query
          {...configWithSettings}
          value={treeState.tree}
          onChange={handleChange}
          renderBuilder={renderBuilder}
        />
      </div>
      <div className="mt-4 text-sm">
        <MatchingTeamMembers teamId={teamId} queryValue={initialQueryValue} />
      </div>
    </div>
  );
}

const MatchingTeamMembers = memo(function MatchingTeamMembers({
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

  if (!hasValidValue) {
    return (
      <div className="border-subtle bg-muted mt-4 space-y-3 rounded-md border p-4">
        <div className="text-subtle flex items-center text-sm font-medium">
          <span>{t("no_filter_set")}</span>
        </div>
      </div>
    );
  }

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

  return (
    <div className="border-subtle bg-muted mt-4 space-y-3 rounded-md border p-4">
      <div className="text-emphasis flex items-center text-sm font-medium">
        <span>{t("x_matching_members", { x: matchingTeamMembers?.length ?? 0 })}</span>
      </div>
      <ul className="divide-subtle divide-y">
        {matchingTeamMembers?.map((member) => (
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
});

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
