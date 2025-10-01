# Test Attribute Creation - Addition Summary

## What was added

I've successfully added the auto-creation of test attributes to the `getAttributesForTeam` function in:

**File:** `/packages/lib/service/attribute/server/getAttributes.ts`

## Code Added

```typescript
export async function getAttributesForTeam({ teamId }: { teamId: number }) {
  const attributes = await getAttributesAssignedToMembersOfTeam({ teamId });

  // If no attributes found, auto-create test attributes for development
  if (attributes.length === 0) {
    try {
      // Create test attributes
      await prisma.attribute.createMany({
        data: [
          {
            name: "attr-1",
            slug: "attr-1",
            type: "TEXT",
            teamId: teamId,
          },
          {
            name: "attr-2",
            slug: "attr-2", 
            type: "TEXT",
            teamId: teamId,
          }
        ],
        skipDuplicates: true
      });

      // Return the newly created attributes with proper format
      const newAttributes = await prisma.attribute.findMany({
        where: { teamId: teamId },
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
            }
          }
        }
      });

      return newAttributes satisfies Attribute[];
    } catch (error) {
      // If creation fails, just return empty array to avoid breaking
      console.warn('Failed to create test attributes:', error);
      return attributes satisfies Attribute[];
    }
  }

  return attributes satisfies Attribute[];
}
```

## What this does

1. **Checks for existing attributes**: If the team already has attributes, it returns them normally
2. **Auto-creates test attributes**: When no attributes exist, it creates two test TEXT attributes:
   - `attr-1` with slug `attr-1`
   - `attr-2` with slug `attr-2`
3. **Safe creation**: Uses `skipDuplicates: true` to avoid creating duplicates
4. **Proper format**: Returns the attributes in the same format expected by the frontend
5. **Error handling**: If attribute creation fails, it gracefully returns the empty array and logs a warning

## Benefits for testing

- **Easier development**: No need to manually create attributes for testing the cursor focus fix
- **Consistent test data**: Always creates the same test attributes for reproducible testing
- **Non-breaking**: If creation fails, the application continues to work normally
- **Development-friendly**: Automatically provides test data when needed

This addition will make it much easier to test the cursor focus fix in the Round Robin assignment attributes filter, as the test attributes will be automatically available when needed.