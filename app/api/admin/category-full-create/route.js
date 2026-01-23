import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { createCategoryHierarchy } from '@/lib/services/categoryService';

/**
 * POST /api/admin/category-full-create
 * 
 * Create a full category hierarchy in a single request:
 * - Main Category
 * - Subcategories (multiple)
 * - Skills (multiple per subcategory)
 * 
 * Request Body:
 * {
 *   "name": "Programming & Tech",
 *   "slug": "programming-tech", // Optional, auto-generated if not provided
 *   "isActive": true, // Optional, defaults to true
 *   "subcategories": [
 *     {
 *       "name": "Website Development",
 *       "slug": "website-development", // Optional
 *       "isActive": true, // Optional
 *       "skills": [
 *         {
 *           "name": "React",
 *           "slug": "react", // Optional
 *           "isActive": true // Optional
 *         },
 *         {
 *           "name": "WordPress",
 *           "slug": "wordpress"
 *         }
 *       ]
 *     },
 *     {
 *       "name": "Mobile App Development",
 *       "slug": "mobile-app-dev",
 *       "skills": [
 *         {
 *           "name": "Flutter",
 *           "slug": "flutter"
 *         }
 *       ]
 *     }
 *   ]
 * }
 * 
 * Response (201):
 * {
 *   "success": true,
 *   "category": {
 *     "id": "uuid",
 *     "name": "Programming & Tech",
 *     "slug": "programming-tech",
 *     "isActive": true,
 *     "subcategories": [
 *       {
 *         "id": "uuid",
 *         "name": "Website Development",
 *         "slug": "website-development",
 *         "isActive": true,
 *         "skills": [
 *           {
 *             "id": "uuid",
 *             "name": "React",
 *             "slug": "react",
 *             "isActive": true
 *           },
 *           {
 *             "id": "uuid",
 *             "name": "WordPress",
 *             "slug": "wordpress",
 *             "isActive": true
 *           }
 *         ]
 *       },
 *       {
 *         "id": "uuid",
 *         "name": "Mobile App Development",
 *         "slug": "mobile-app-dev",
 *         "isActive": true,
 *         "skills": [
 *           {
 *             "id": "uuid",
 *             "name": "Flutter",
 *             "slug": "flutter",
 *             "isActive": true
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 */
export async function POST(request) {
  try {
    // 1. Verify admin authentication
    const { user, error } = await verifyAdminAuth(request);
    if (error) {
      return error;
    }

    // 2. Parse request body
    const body = await request.json();
    const { name, slug, isActive, subcategories } = body;

    // 3. Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category name is required',
        },
        { status: 400 }
      );
    }

    // 4. Validate subcategories structure
    if (subcategories && !Array.isArray(subcategories)) {
      return NextResponse.json(
        {
          success: false,
          error: 'subcategories must be an array',
        },
        { status: 400 }
      );
    }

    // Validate each subcategory
    if (subcategories) {
      for (let i = 0; i < subcategories.length; i++) {
        const subcat = subcategories[i];
        if (!subcat.name || !subcat.name.trim()) {
          return NextResponse.json(
            {
              success: false,
              error: `Subcategory at index ${i} is missing required field: name`,
            },
            { status: 400 }
          );
        }

        // Validate skills if provided
        if (subcat.skills && !Array.isArray(subcat.skills)) {
          return NextResponse.json(
            {
              success: false,
              error: `Subcategory "${subcat.name}" skills must be an array`,
            },
            { status: 400 }
          );
        }

        // Validate each skill
        if (subcat.skills) {
          for (let j = 0; j < subcat.skills.length; j++) {
            const skill = subcat.skills[j];
            if (!skill.name || !skill.name.trim()) {
              return NextResponse.json(
                {
                  success: false,
                  error: `Skill at index ${j} in subcategory "${subcat.name}" is missing required field: name`,
                },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    // 5. Create category hierarchy (transaction-safe)
    const result = await createCategoryHierarchy({
      name: name.trim(),
      slug: slug?.trim() || undefined,
      isActive: isActive !== undefined ? isActive : true,
      subcategories: subcategories || [],
    });

    // 6. Return success response
    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category hierarchy:', error);

    // Handle known errors
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 409 } // Conflict
      );
    }

    if (error.message.includes('required')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create category hierarchy',
      },
      { status: 500 }
    );
  }
}

