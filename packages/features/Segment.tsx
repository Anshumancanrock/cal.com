"use client";

import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { Query, Builder, Utils as QbUtils } from "react-awesome-query-builder";
import type { ImmutableTree, BuilderProps } from "react-awesome-query-builder";
import type { JsonTree } from "react-awesome-query-builder";

import {
  withRaqbSettingsAndWidgets,
  ConfigFor,
} from "@calcom/app-store/routing-forms/components/react-awesome-query-builder/config/uiConfig";
import { getQueryBuilderConfigForAttributes } from "@calcom/app-store/routing-forms/lib/getQueryBuilderConfig";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { isEqual } from "@calcom/lib/isEqual";
import { buildStateFromQueryValue } from "@calcom/lib/raqb/raqbUtils";
import type { AttributesQueryValue } from "@calcom/lib/raqb/types";
import { trpc, type RouterOutputs } from "@calcom/trpc";
import cn from "@calcom/ui/classNames";

export type Attributes = RouterOutputs["viewer"]["appRoutingForms"]["getAttributesForTeam"];
export function useAttributes(teamId: number) {
  const { data: attributes, isPending } = trpc.viewer.appRoutingForms.getAttributesForTeam.useQuery({
    teamId,
  });
  
  // Temporary debugging
  console.log('🔍 [DEBUG] useAttributes - teamId:', teamId);
  console.log('🔍 [DEBUG] useAttributes - attributes:', attributes);
  console.log('🔍 [DEBUG] useAttributes - attributes length:', attributes?.length);
  
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
  // Internal state for RAQB - separate from parent state updates
  const [internalQueryValue, setInternalQueryValue] = useState(initialQueryValue);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>();
  
  // Memoize config objects to prevent recreation
  const attributesQueryBuilderConfig = useMemo(() => {
    return getQueryBuilderConfigForAttributes({ attributes });
  }, [attributes]);

  const attributesQueryBuilderConfigWithRaqbSettingsAndWidgets = useMemo(() => {
    return withRaqbSettingsAndWidgets({
      config: attributesQueryBuilderConfig,
      configFor: ConfigFor.Attributes,
    });
  }, [attributesQueryBuilderConfig]);

  // Use internal state for Query component to prevent re-renders during typing
  const queryBuilderData = useMemo(() => {
    return buildStateFromQueryValue({
      queryValue: internalQueryValue as JsonTree,
      config: attributesQueryBuilderConfigWithRaqbSettingsAndWidgets,
    });
  }, [internalQueryValue, attributesQueryBuilderConfigWithRaqbSettingsAndWidgets]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // CRITICAL: Stable renderBuilder to prevent Query component recreation
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

  // CRITICAL FIX: Debounced onChange to prevent focus loss during typing
  function onChange(immutableTree: ImmutableTree) {
    const jsonTree = QbUtils.getTree(immutableTree) as AttributesQueryValue;

    // Update internal state immediately (keeps Query component stable)
    if (!isEqual(jsonTree, internalQueryValue)) {
      setInternalQueryValue(jsonTree);
      setIsTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Debounce parent state update to prevent re-renders during typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onQueryValueChange({
          queryValue: jsonTree,
        });
      }, 300); // 300ms debounce
    }
  }

  return (
    // cal-query-builder class has special styling through global CSS, allowing us to customize RAQB
    <div>
      <div className={cn("cal-query-builder", className)}>
        <Query
          {...attributesQueryBuilderConfigWithRaqbSettingsAndWidgets}
          value={queryBuilderData.state.tree}
          onChange={onChange}
          renderBuilder={renderBuilder}
        />
      </div>
      <div className="mt-4 text-sm">
        <MatchingTeamMembers teamId={teamId} queryValue={internalQueryValue} />
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
    console.error("Error fetching attributes");
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
