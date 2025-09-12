#!/usr/bin/env node

/**
 * GitPod-specific attribute seeding script
 * Checks GitPod environment and sets up test attributes
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 GitPod Attribute Setup Starting...");
  
  // Check GitPod environment
  if (!process.env.GITPOD_WORKSPACE_ID) {
    console.log("⚠️  Warning: Not running in GitPod environment");
  } else {
    console.log(`✅ GitPod Workspace: ${process.env.GITPOD_WORKSPACE_ID}`);
  }

  try {
    // Check database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Get all teams (GitPod might have default teams)
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, slug: true }
    });

    console.log(`📊 Found ${teams.length} teams in database`);
    teams.forEach(team => {
      console.log(`   - Team: ${team.name} (${team.slug}) [ID: ${team.id}]`);
    });

    if (teams.length === 0) {
      console.log("❌ No teams found. Please create a team first in Cal.com");
      return;
    }

    // Check existing attributes
    const existingAttributes = await prisma.attribute.findMany({
      include: { options: true }
    });

    console.log(`📋 Found ${existingAttributes.length} existing attributes`);

    // Create test attributes for each team
    for (const team of teams) {
      console.log(`\n🔧 Setting up attributes for team: ${team.name}`);
      
      // Create Department attribute
      const departmentAttr = await prisma.attribute.upsert({
        where: {
          name_teamId: {
            name: "Department",
            teamId: team.id
          }
        },
        update: {},
        create: {
          name: "Department",
          type: "SINGLE_SELECT",
          teamId: team.id,
          options: {
            create: [
              { value: "Engineering", slug: "engineering" },
              { value: "Sales", slug: "sales" },
              { value: "Marketing", slug: "marketing" },
              { value: "Support", slug: "support" },
              { value: "HR", slug: "hr" }
            ]
          }
        },
        include: { options: true }
      });

      // Create Level attribute
      const levelAttr = await prisma.attribute.upsert({
        where: {
          name_teamId: {
            name: "Level",
            teamId: team.id
          }
        },
        update: {},
        create: {
          name: "Level",
          type: "SINGLE_SELECT", 
          teamId: team.id,
          options: {
            create: [
              { value: "Junior", slug: "junior" },
              { value: "Mid", slug: "mid" },
              { value: "Senior", slug: "senior" },
              { value: "Lead", slug: "lead" },
              { value: "Principal", slug: "principal" }
            ]
          }
        },
        include: { options: true }
      });

      console.log(`   ✅ Created/Updated Department attribute with ${departmentAttr.options.length} options`);
      console.log(`   ✅ Created/Updated Level attribute with ${levelAttr.options.length} options`);
    }

    // Final verification
    const finalAttributes = await prisma.attribute.findMany({
      include: { options: true, team: { select: { name: true } } }
    });

    console.log("\n📈 Final Attribute Summary:");
    finalAttributes.forEach(attr => {
      console.log(`   - ${attr.name} (${attr.team.name}): ${attr.options.length} options`);
    });

    console.log("\n🎉 GitPod attribute setup complete!");
    console.log("\n🔄 Next steps:");
    console.log("   1. Restart your dev server: yarn dev");
    console.log("   2. Go to Round Robin assignment settings");
    console.log("   3. Test 'Filter by attributes' dropdown");
    console.log("   4. Verify cursor focus stays while typing");

  } catch (error) {
    console.error("❌ Error setting up attributes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);