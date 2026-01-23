import prisma from '@/lib/prisma';
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug';

/**
 * Check if a category slug exists (globally unique)
 * @param {string} slug - The slug to check
 * @param {Object} prismaClient - Prisma client (prisma or transaction client)
 * @param {string|null} excludeId - Optional category ID to exclude from check
 * @returns {Promise<boolean>} - True if slug exists
 */
async function categorySlugExists(slug, prismaClient = prisma, excludeId = null) {
  const where = { slug };
  if (excludeId) {
    where.id = { not: excludeId };
  }
  const exists = await prismaClient.category.findFirst({ where });
  return !!exists;
}

/**
 * Check if a category name exists within the same parent
 * @param {string} name - The category name
 * @param {string|null} parentId - The parent category ID (null for root)
 * @param {Object} prismaClient - Prisma client (prisma or transaction client)
 * @param {string|null} excludeId - Optional category ID to exclude from check
 * @returns {Promise<boolean>} - True if name exists
 */
export async function categoryNameExistsInParent(name, parentId, prismaClient = prisma, excludeId = null) {
  const where = {
    name,
    parentId: parentId || null,
  };
  if (excludeId) {
    where.id = { not: excludeId };
  }
  const exists = await prismaClient.category.findFirst({ where });
  return !!exists;
}

/**
 * Check if a skill name/slug exists within a category
 * @param {string} categoryId - The category ID
 * @param {string} name - The skill name
 * @param {Object} prismaClient - Prisma client (prisma or transaction client)
 * @param {string|null} excludeId - Optional skill ID to exclude from check
 * @returns {Promise<boolean>} - True if skill exists
 */
export async function skillExistsInCategory(categoryId, name, prismaClient = prisma, excludeId = null) {
  const where = {
    categoryId,
    name,
  };
  if (excludeId) {
    where.id = { not: excludeId };
  }
  const exists = await prismaClient.skill.findFirst({ where });
  return !!exists;
}

/**
 * Generate unique slug for category
 * @param {string} baseSlug - Base slug to make unique
 * @param {Object} prismaClient - Prisma client (prisma or transaction client)
 * @returns {Promise<string>} - Unique slug
 */
export async function generateUniqueCategorySlug(baseSlug, prismaClient = prisma) {
  // Limit the number of attempts to avoid infinite loops and transaction timeouts
  let slug = baseSlug;
  let counter = 1;
  let attempts = 0;
  const maxAttempts = 100; // Safety limit

  while (attempts < maxAttempts) {
    try {
      const exists = await categorySlugExists(slug, prismaClient);
      
      if (!exists) {
        return slug;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
      attempts++;
    } catch (error) {
      // If transaction error, throw it
      if (error.code === 'P2028') {
        throw error;
      }
      // For other errors, try next slug
      slug = `${baseSlug}-${counter}`;
      counter++;
      attempts++;
    }
  }

  // Fallback: return the last generated slug
  return slug;
}

/**
 * Generate unique slug for skill within category
 * @param {string} categoryId - Category ID
 * @param {string} baseSlug - Base slug to make unique
 * @param {Object} prismaClient - Prisma client (prisma or transaction client)
 * @returns {Promise<string>} - Unique slug
 */
export async function generateUniqueSkillSlug(categoryId, baseSlug, prismaClient = prisma) {
  // Limit the number of attempts to avoid infinite loops
  let slug = baseSlug;
  let counter = 1;
  let attempts = 0;
  const maxAttempts = 100; // Safety limit

  while (attempts < maxAttempts) {
    try {
      const exists = await prismaClient.skill.findFirst({
        where: { categoryId, slug },
      });
      
      if (!exists) {
        return slug;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
      attempts++;
    } catch (error) {
      // If transaction error, throw it
      if (error.code === 'P2028') {
        throw error;
      }
      // For other errors, try next slug
      slug = `${baseSlug}-${counter}`;
      counter++;
      attempts++;
    }
  }

  // Fallback: return the last generated slug
  return slug;
}

/**
 * Create a full category hierarchy in a single transaction
 * Creates: Main Category → Subcategories → Skills
 * 
 * @param {Object} data - The category hierarchy data
 * @param {string} data.name - Main category name
 * @param {string} [data.slug] - Main category slug (auto-generated if not provided)
 * @param {boolean} [data.isActive=true] - Main category active status
 * @param {Array} data.subcategories - Array of subcategory objects
 * @param {string} data.subcategories[].name - Subcategory name
 * @param {string} [data.subcategories[].slug] - Subcategory slug (auto-generated if not provided)
 * @param {boolean} [data.subcategories[].isActive=true] - Subcategory active status
 * @param {Array} data.subcategories[].skills - Array of skill objects
 * @param {string} data.subcategories[].skills[].name - Skill name
 * @param {string} [data.subcategories[].skills[].slug] - Skill slug (auto-generated if not provided)
 * @param {boolean} [data.subcategories[].skills[].isActive=true] - Skill active status
 * 
 * @returns {Promise<Object>} - Created hierarchy with IDs
 * 
 * @example
 * const result = await createCategoryHierarchy({
 *   name: "Programming & Tech",
 *   slug: "programming-tech",
 *   subcategories: [
 *     {
 *       name: "Website Development",
 *       skills: [
 *         { name: "React", slug: "react" },
 *         { name: "WordPress", slug: "wordpress" }
 *       ]
 *     }
 *   ]
 * });
 */
export async function createCategoryHierarchy(data) {
  const { name, slug, isActive = true, subcategories = [] } = data;

  // Validation
  if (!name || !name.trim()) {
    throw new Error('Category name is required');
  }

  // Use transaction to ensure atomicity with increased timeout
  return await prisma.$transaction(async (tx) => {
    // 1. Check if main category already exists
    const mainCategorySlug = slug || generateSlug(name);
    const existingMainCategory = await tx.category.findFirst({
      where: {
        OR: [
          { name: name.trim() },
          { slug: mainCategorySlug },
        ],
        parentId: null, // Only check root categories
      },
    });

    if (existingMainCategory) {
      throw new Error(
        `Category "${name}" or slug "${mainCategorySlug}" already exists`
      );
    }

    // 2. Generate unique slug for main category
    const uniqueMainSlug = await generateUniqueCategorySlug(mainCategorySlug, tx);

    // 3. Create main category
    const mainCategory = await tx.category.create({
      data: {
        name: name.trim(),
        slug: uniqueMainSlug,
        isActive,
        parentId: null, // Root category
      },
    });

    const result = {
      category: {
        id: mainCategory.id,
        name: mainCategory.name,
        slug: mainCategory.slug,
        isActive: mainCategory.isActive,
        subcategories: [],
      },
    };

    // 4. Process subcategories
    for (const subcatData of subcategories) {
      const {
        name: subcatName,
        slug: subcatSlug,
        isActive: subcatIsActive = true,
        skills = [],
      } = subcatData;

      if (!subcatName || !subcatName.trim()) {
        throw new Error('Subcategory name is required');
      }

      // Check if subcategory already exists under this parent
      const existingSubcategory = await categoryNameExistsInParent(
        subcatName.trim(),
        mainCategory.id,
        tx
      );

      if (existingSubcategory) {
        throw new Error(
          `Subcategory "${subcatName}" already exists under "${name}"`
        );
      }

      // Generate unique slug for subcategory
      const subcatSlugBase = subcatSlug || generateSlug(subcatName);
      const uniqueSubcatSlug = await generateUniqueCategorySlug(subcatSlugBase, tx);

      // Create subcategory
      const subcategory = await tx.category.create({
        data: {
          name: subcatName.trim(),
          slug: uniqueSubcatSlug,
          isActive: subcatIsActive,
          parentId: mainCategory.id,
        },
      });

      const subcategoryResult = {
        id: subcategory.id,
        name: subcategory.name,
        slug: subcategory.slug,
        isActive: subcategory.isActive,
        skills: [],
      };

      // 5. Process skills for this subcategory
      for (const skillData of skills) {
        const {
          name: skillName,
          slug: skillSlug,
          isActive: skillIsActive = true,
        } = skillData;

        if (!skillName || !skillName.trim()) {
          throw new Error('Skill name is required');
        }

        // Check if skill already exists in this subcategory
        const existingSkill = await skillExistsInCategory(
          subcategory.id,
          skillName.trim(),
          tx
        );

        if (existingSkill) {
          throw new Error(
            `Skill "${skillName}" already exists in subcategory "${subcatName}"`
          );
        }

        // Generate unique slug for skill
        const skillSlugBase = skillSlug || generateSlug(skillName);
        const uniqueSkillSlug = await generateUniqueSkillSlug(
          subcategory.id,
          skillSlugBase,
          tx
        );

        // Create skill
        const skill = await tx.skill.create({
          data: {
            name: skillName.trim(),
            slug: uniqueSkillSlug,
            isActive: skillIsActive,
            categoryId: subcategory.id,
          },
        });

        subcategoryResult.skills.push({
          id: skill.id,
          name: skill.name,
          slug: skill.slug,
          isActive: skill.isActive,
        });
      }

      result.category.subcategories.push(subcategoryResult);
    }

    return result;
  }, {
    maxWait: 10000, // Maximum time to wait for a transaction slot (10 seconds)
    timeout: 30000, // Maximum time the transaction can run (30 seconds)
  });
}

/**
 * Get category with full hierarchy (category → subcategories → skills)
 * @param {string} categoryId - The main category ID
 * @param {boolean} [onlyActive=true] - Only return active items
 * @returns {Promise<Object|null>} - Category with hierarchy or null
 */
export async function getCategoryHierarchy(categoryId, onlyActive = true) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      children: {
        where: onlyActive ? { isActive: true } : undefined,
        include: {
          skills: {
            where: onlyActive ? { isActive: true } : undefined,
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
      skills: {
        where: onlyActive ? { isActive: true } : undefined,
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!category) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    isActive: category.isActive,
    parentId: category.parentId,
    subcategories: category.children.map((subcat) => ({
      id: subcat.id,
      name: subcat.name,
      slug: subcat.slug,
      isActive: subcat.isActive,
      skills: subcat.skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        isActive: skill.isActive,
      })),
    })),
    // Skills directly on main category (if any)
    skills: category.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      isActive: skill.isActive,
    })),
  };
}

/**
 * Get all root categories (main categories without parent)
 * @param {boolean} [onlyActive=true] - Only return active categories
 * @returns {Promise<Array>} - Array of root categories
 */
export async function getRootCategories(onlyActive = true) {
  return await prisma.category.findMany({
    where: {
      parentId: null,
      ...(onlyActive ? { isActive: true } : {}),
    },
    include: {
      _count: {
        select: {
          children: true,
          skills: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

