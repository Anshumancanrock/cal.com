/**
 * Auto-setup attributes script for GitPod
 * Runs automatically when GitPod workspace starts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function autoSetupAttributes() {
  try {
    console.log("🔧 Auto-setting up test attributes for GitPod...");
    
    // Wait for database to be ready
    let retries = 5;
    while (retries > 0) {
      try {
        await prisma.$connect();
        break;
      } catch (error) {
        console.log(`⏳ Waiting for database... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
      }
    }

    if (retries === 0) {
      console.log("❌ Database not ready, skipping auto-setup");
      return;
    }

    // Check if attributes already exist
    const existingAttributes = await prisma.attribute.count();
    if (existingAttributes > 0) {
      console.log("✅ Attributes already exist, skipping setup");
      return;
    }

    // Get or create a default team
    let team = await prisma.team.findFirst();
    
    if (!team) {
      // Create a default team for testing
      team = await prisma.team.create({
        data: {
          name: "Default Team",
          slug: "default-team",
        }
      });
      console.log("✅ Created default team");
    }

    // Create test attributes
    const attributes = [
      {
        name: "Department",
        options: ["Engineering", "Sales", "Marketing", "Support", "HR"]
      },
      {
        name: "Level", 
        options: ["Junior", "Mid", "Senior", "Lead", "Principal"]
      },
      {
        name: "Location",
        options: ["Remote", "New York", "San Francisco", "London", "Berlin"]
      }
    ];

    for (const attr of attributes) {
      await prisma.attribute.create({
        data: {
          name: attr.name,
          type: "SINGLE_SELECT",
          teamId: team.id,
          options: {
            create: attr.options.map(option => ({
              value: option,
              slug: option.toLowerCase().replace(/\s+/g, '-')
            }))
          }
        }
      });
      console.log(`✅ Created ${attr.name} attribute with ${attr.options.length} options`);
    }

    console.log("🎉 Auto-setup complete! Attributes ready for testing.");
    
  } catch (error) {
    console.log("⚠️  Auto-setup failed (this is okay):", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  autoSetupAttributes();
}

export default autoSetupAttributes;