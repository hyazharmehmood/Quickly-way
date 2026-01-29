-- CreateTable: Category table
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Skill table
CREATE TABLE IF NOT EXISTS "Skill" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ServiceSkill table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS "ServiceSkill" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Category unique constraints and indexes
DO $$ 
BEGIN
    -- Unique constraint on slug
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Category_slug_key'
    ) THEN
        ALTER TABLE "Category" ADD CONSTRAINT "Category_slug_key" UNIQUE ("slug");
    END IF;
    
    -- Composite unique constraint on parentId and name
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Category_parentId_name_key'
    ) THEN
        ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_name_key" UNIQUE ("parentId", "name");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Category_slug_idx" ON "Category"("slug");
CREATE INDEX IF NOT EXISTS "Category_isActive_idx" ON "Category"("isActive");
CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX IF NOT EXISTS "Category_name_idx" ON "Category"("name");

-- CreateIndex: Skill unique constraints and indexes
DO $$ 
BEGIN
    -- Composite unique constraint on categoryId and name
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Skill_categoryId_name_key'
    ) THEN
        ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_name_key" UNIQUE ("categoryId", "name");
    END IF;
    
    -- Composite unique constraint on categoryId and slug
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Skill_categoryId_slug_key'
    ) THEN
        ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_slug_key" UNIQUE ("categoryId", "slug");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Skill_categoryId_idx" ON "Skill"("categoryId");
CREATE INDEX IF NOT EXISTS "Skill_slug_idx" ON "Skill"("slug");
CREATE INDEX IF NOT EXISTS "Skill_isActive_idx" ON "Skill"("isActive");

-- CreateIndex: ServiceSkill unique constraint and indexes
DO $$ 
BEGIN
    -- Composite unique constraint on serviceId and skillId
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ServiceSkill_serviceId_skillId_key'
    ) THEN
        ALTER TABLE "ServiceSkill" ADD CONSTRAINT "ServiceSkill_serviceId_skillId_key" UNIQUE ("serviceId", "skillId");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ServiceSkill_serviceId_idx" ON "ServiceSkill"("serviceId");
CREATE INDEX IF NOT EXISTS "ServiceSkill_skillId_idx" ON "ServiceSkill"("skillId");

-- AddForeignKey: Category self-reference (parent-child relationship)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Category_parentId_fkey'
    ) THEN
        ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" 
        FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Skill to Category
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Skill_categoryId_fkey'
    ) THEN
        ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_fkey" 
        FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: ServiceSkill to Service
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ServiceSkill_serviceId_fkey'
    ) THEN
        ALTER TABLE "ServiceSkill" ADD CONSTRAINT "ServiceSkill_serviceId_fkey" 
        FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: ServiceSkill to Skill
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ServiceSkill_skillId_fkey'
    ) THEN
        ALTER TABLE "ServiceSkill" ADD CONSTRAINT "ServiceSkill_skillId_fkey" 
        FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

