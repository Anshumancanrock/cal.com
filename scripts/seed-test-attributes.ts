import { PrismaClient } from "@prisma/client";
import { AttributeType } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestAttributes() {
  console.log("🔍 Creating test attributes...");

  // Let's see what teams exist first
  const allTeams = await prisma.team.findMany({
    select: { 
      id: true, 
      name: true, 
      isOrganization: true,
      parentId: true 
    }
  });
  console.log("🔍 All teams in database:", allTeams);

  // Use the first team we find (fallback approach)
  const targetTeam = allTeams.find(t => t.name === "team1event1") || allTeams[0];
  
  if (!targetTeam) {
    console.log("❌ No teams found in database!");
    return;
  }

  console.log(`🔍 Using team: ${targetTeam.name} (ID: ${targetTeam.id})`);

  // Create exactly 2 simple attributes for testing
  const attributes = [
    {
      name: "Department",
      slug: "department", 
      type: AttributeType.SINGLE_SELECT,
      options: [
        { value: "Engineering", slug: "engineering" },
        { value: "Sales", slug: "sales" },
      ]
    },
    {
      name: "Level",
      slug: "level",
      type: AttributeType.SINGLE_SELECT,
      options: [
        { value: "Junior", slug: "junior" },
        { value: "Senior", slug: "senior" },
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