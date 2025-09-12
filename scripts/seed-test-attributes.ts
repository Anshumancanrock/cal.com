import { PrismaClient } from "@prisma/client";
import { AttributeType } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestAttributes() {
  console.log("🔍 Creating test attributes...");

  // Find the team named "team1event1"
  const targetTeam = await prisma.team.findFirst({
    where: {
      name: "team1event1"
    },
    select: {
      id: true,
      name: true,
      isOrganization: true,
      parentId: true,
    }
  });

  if (!targetTeam) {
    console.log("❌ Team 'team1event1' not found!");
    // Let's see what teams exist
    const allTeams = await prisma.team.findMany({
      select: { id: true, name: true, isOrganization: true }
    });
    console.log("Available teams:", allTeams);
    return;
  }

  console.log(`🔍 Using team: ${targetTeam.name} (ID: ${targetTeam.id})`);

  // Create exactly 2 attributes: attr-1 and attr-2
  const attributes = [
    {
      name: "attr-1",
      slug: "attr-1",
      type: AttributeType.SINGLE_SELECT,
      options: [
        { value: "Option 1", slug: "option-1" },
        { value: "Option 2", slug: "option-2" },
        { value: "Option 3", slug: "option-3" },
      ]
    },
    {
      name: "attr-2",
      slug: "attr-2",
      type: AttributeType.SINGLE_SELECT,
      options: [
        { value: "Value A", slug: "value-a" },
        { value: "Value B", slug: "value-b" },
        { value: "Value C", slug: "value-c" },
      ]
    }
  ];

  for (const attr of attributes) {
    try {
      // Check if attribute already exists
      const existing = await prisma.attribute.findFirst({
        where: {
          teamId: targetTeam.id,
          slug: attr.slug
        }
      });

      if (existing) {
        console.log(`⚠️  Attribute "${attr.name}" already exists, skipping...`);
        continue;
      }

      // Create the attribute with options
      const createdAttribute = await prisma.attribute.create({
        data: {
          teamId: targetTeam.id,
          name: attr.name,
          slug: attr.slug,
          type: attr.type,
          options: {
            create: attr.options.map(option => ({
              value: option.value,
              slug: option.slug,
            }))
          }
        },
        include: {
          options: true
        }
      });

      console.log(`✅ Created attribute: ${createdAttribute.name} with ${createdAttribute.options.length} options`);
    } catch (error) {
      console.error(`❌ Error creating attribute ${attr.name}:`, error);
    }
  }

  console.log("🎉 Test attributes creation completed!");
}

async function main() {
  try {
    await createTestAttributes();
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();