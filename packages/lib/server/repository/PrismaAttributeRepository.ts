import type { PrismaClient } from "@calcom/prisma";

export class PrismaAttributeRepository {
  constructor(private prismaClient: PrismaClient) {}

  async findManyByNamesAndOrgIdIncludeOptions({
    attributeNames,
    orgId,
  }: {
    attributeNames: string[];
    orgId: number;
  }) {
    return this.prismaClient.attribute.findMany({
      where: {
        name: { in: attributeNames, mode: "insensitive" },
        teamId: orgId,
      },
      include: {
        options: {
          select: {
            id: true,
            value: true,
            slug: true,
          },
        },
      },
    });
  }

  async findManyByOrgId({ orgId }: { orgId: number }) {
    // It should be a faster query because of lesser number of attributes record and index on teamId
    let result = await this.prismaClient.attribute.findMany({
      where: {
        teamId: orgId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        slug: true,
        options: {
          select: {
            id: true,
            value: true,
            slug: true,
          },
        },
      },
    });

    // GitPod-friendly: Auto-create test attributes if none exist
    if (result.length === 0) {
      console.log('🔧 [GitPod] No attributes found for orgId:', orgId, '- auto-creating test attributes');
      
      try {
        // Create atr-1 attribute (TEXT type for focus testing)
        await this.prismaClient.attribute.create({
          data: {
            name: "atr-1",
            slug: "atr-1",
            type: "TEXT",
            teamId: orgId,
            // No options for TEXT type attributes
          }
        });

        // Create atr-2 attribute (TEXT type for focus testing)
        await this.prismaClient.attribute.create({
          data: {
            name: "atr-2",
            slug: "atr-2",
            type: "TEXT",
            teamId: orgId,
            // No options for TEXT type attributes
          }
        });

        // Fetch again after creation
        result = await this.prismaClient.attribute.findMany({
          where: {
            teamId: orgId,
          },
          select: {
            id: true,
            name: true,
            type: true,
            slug: true,
            options: {
              select: {
                id: true,
                value: true,
                slug: true,
              },
            },
          },
        });
        console.log('✅ [GitPod] Auto-created', result.length, 'text attributes (atr-1, atr-2)');
      } catch (error) {
        console.log("⚠️ [GitPod] Auto-creation failed (this is okay):", error);
      }
    }

    return result;
  }



  async findAllByOrgIdWithOptions({ orgId }: { orgId: number }) {
    return await this.prismaClient.attribute.findMany({
      where: {
        teamId: orgId,
      },
      include: {
        options: true,
      },
    });
  }

  async findUniqueWithWeights({
    teamId,
    attributeId,
    isWeightsEnabled = true,
  }: {
    teamId: number;
    attributeId: string;
    isWeightsEnabled?: boolean;
  }) {
    return await this.prismaClient.attribute.findUnique({
      where: {
        id: attributeId,
        teamId,
        isWeightsEnabled,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        options: {
          select: {
            id: true,
            value: true,
            slug: true,
            assignedUsers: {
              select: {
                member: {
                  select: {
                    userId: true,
                  },
                },
                weight: true,
              },
            },
          },
        },
      },
    });
  }
}
