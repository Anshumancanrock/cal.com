import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function insertTestAttributes() {
  try {
    // Find the first available team
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, isOrganization: true },
      take: 5
    });
    
    console.log("Available teams:", teams);
    
    const targetTeam = teams[0]; // Use first team
    if (!targetTeam) {
      console.log("❌ No teams found!");
      return;
    }
    
    console.log(`Using team: ${targetTeam.name} (ID: ${targetTeam.id})`);
    
    // Check if attributes already exist
    const existing = await prisma.attribute.findMany({
      where: { teamId: targetTeam.id }
    });
    
    if (existing.length > 0) {
      console.log("✅ Attributes already exist:", existing.map(a => a.name));
      return;
    }
    
    // Create Department attribute
    const deptAttr = await prisma.attribute.create({
      data: {
        teamId: targetTeam.id,
        type: "SINGLE_SELECT",
        name: "Department",
        slug: "department",
        enabled: true,
        usersCanEditRelation: false,
        isWeightsEnabled: false,
        isLocked: false,
        options: {
          create: [
            { value: "Engineering", slug: "engineering", isGroup: false, contains: [] },
            { value: "Sales", slug: "sales", isGroup: false, contains: [] },
            { value: "Marketing", slug: "marketing", isGroup: false, contains: [] },
          ]
        }
      },
      include: { options: true }
    });
    
    // Create Level attribute  
    const levelAttr = await prisma.attribute.create({
      data: {
        teamId: targetTeam.id,
        type: "SINGLE_SELECT", 
        name: "Level",
        slug: "level",
        enabled: true,
        usersCanEditRelation: false,
        isWeightsEnabled: false,
        isLocked: false,
        options: {
          create: [
            { value: "Junior", slug: "junior", isGroup: false, contains: [] },
            { value: "Senior", slug: "senior", isGroup: false, contains: [] },
            { value: "Lead", slug: "lead", isGroup: false, contains: [] },
          ]
        }
      },
      include: { options: true }
    });
    
    console.log("✅ Created attributes:");
    console.log("- Department:", deptAttr.options.map(o => o.value));
    console.log("- Level:", levelAttr.options.map(o => o.value));
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

insertTestAttributes();