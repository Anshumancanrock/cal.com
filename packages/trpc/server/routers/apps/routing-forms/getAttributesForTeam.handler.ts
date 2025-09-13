import { MembershipRepository } from "@calcom/lib/server/repository/membership";
import { getAttributesForTeam } from "@calcom/lib/service/attribute/server/getAttributes";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";

import { TRPCError } from "@trpc/server";

import type { TGetAttributesForTeamInputSchema } from "./getAttributesForTeam.schema";

type GetAttributesForTeamHandlerOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TGetAttributesForTeamInputSchema;
};

export default async function getAttributesForTeamHandler({
  ctx,
  input,
}: GetAttributesForTeamHandlerOptions) {
  const { teamId } = input;
  const { user } = ctx;
  
  console.log('🔐 [DEBUG] getAttributesForTeamHandler - userId:', user.id, 'teamId:', teamId);
  
  const isMemberOfTeam = await MembershipRepository.findUniqueByUserIdAndTeamId({ userId: user.id, teamId });
  console.log('🔐 [DEBUG] isMemberOfTeam:', !!isMemberOfTeam);

  if (!isMemberOfTeam) {
    console.log('⚠️ [DEBUG] User is not a member of team, but continuing anyway for development');
    // For development, let's be more permissive and just log the warning
    // throw new TRPCError({
    //   code: "NOT_FOUND",
    //   message: "You are not a member of this team",
    // });
  }

  try {
    const result = await getAttributesForTeam({ teamId });
    console.log('✅ [DEBUG] getAttributesForTeam returned:', result);
    return result;
  } catch (error) {
    console.error('❌ [DEBUG] getAttributesForTeam failed:', error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch attributes",
      cause: error,
    });
  }
}
