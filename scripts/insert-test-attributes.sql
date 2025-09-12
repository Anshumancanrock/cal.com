-- Insert test attributes directly into the database
-- First, let's see what teams exist
SELECT id, name, "isOrganization", "parentId" FROM "Team" ORDER BY id;

-- Insert 2 test attributes for team ID 1 (adjust the teamId based on your team)
-- Replace teamId = 1 with the actual team ID you want to use

-- Attribute 1: Department
INSERT INTO "Attribute" (id, "teamId", type, name, slug, enabled, "usersCanEditRelation", "createdAt", "updatedAt", "isWeightsEnabled", "isLocked")
VALUES 
  ('attr-dept-001', 1, 'SINGLE_SELECT', 'Department', 'department', true, false, NOW(), NOW(), false, false);

-- Attribute 1 Options
INSERT INTO "AttributeOption" (id, "attributeId", value, slug, "isGroup", contains)
VALUES 
  ('opt-eng-001', 'attr-dept-001', 'Engineering', 'engineering', false, '{}'),
  ('opt-sales-001', 'attr-dept-001', 'Sales', 'sales', false, '{}'),
  ('opt-mkt-001', 'attr-dept-001', 'Marketing', 'marketing', false, '{}');

-- Attribute 2: Level  
INSERT INTO "Attribute" (id, "teamId", type, name, slug, enabled, "usersCanEditRelation", "createdAt", "updatedAt", "isWeightsEnabled", "isLocked")
VALUES 
  ('attr-level-001', 1, 'SINGLE_SELECT', 'Level', 'level', true, false, NOW(), NOW(), false, false);

-- Attribute 2 Options
INSERT INTO "AttributeOption" (id, "attributeId", value, slug, "isGroup", contains)
VALUES 
  ('opt-jr-001', 'attr-level-001', 'Junior', 'junior', false, '{}'),
  ('opt-sr-001', 'attr-level-001', 'Senior', 'senior', false, '{}'),
  ('opt-lead-001', 'attr-level-001', 'Lead', 'lead', false, '{}');

-- Verify the data was inserted
SELECT 
  a.id as attribute_id,
  a.name as attribute_name,
  a."teamId",
  ao.id as option_id,
  ao.value as option_value
FROM "Attribute" a
LEFT JOIN "AttributeOption" ao ON a.id = ao."attributeId"
ORDER BY a.name, ao.value;