# Category Hierarchy API Documentation

## Overview

This API allows admins to create a complete category hierarchy (Category → Subcategories → Skills) in a single transaction-safe request.

## Endpoint

**POST** `/api/admin/category-full-create`

**Authentication:** Required (Admin only)

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

## Request Body

```json
{
  "name": "Programming & Tech",
  "slug": "programming-tech",           // Optional - auto-generated if not provided
  "isActive": true,                     // Optional - defaults to true
  "subcategories": [
    {
      "name": "Website Development",
      "slug": "website-development",   // Optional - auto-generated if not provided
      "isActive": true,                 // Optional - defaults to true
      "skills": [
        {
          "name": "React",
          "slug": "react",              // Optional - auto-generated if not provided
          "isActive": true              // Optional - defaults to true
        },
        {
          "name": "WordPress",
          "slug": "wordpress"
        },
        {
          "name": "Vue.js",
          "slug": "vue-js"
        }
      ]
    },
    {
      "name": "Mobile App Development",
      "slug": "mobile-app-dev",
      "skills": [
        {
          "name": "Flutter",
          "slug": "flutter"
        },
        {
          "name": "React Native",
          "slug": "react-native"
        }
      ]
    },
    {
      "name": "Backend Development",
      "slug": "backend-dev",
      "skills": [
        {
          "name": "Node.js",
          "slug": "nodejs"
        },
        {
          "name": "Python",
          "slug": "python"
        }
      ]
    }
  ]
}
```

## Success Response (201 Created)

```json
{
  "success": true,
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Programming & Tech",
    "slug": "programming-tech",
    "isActive": true,
    "subcategories": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Website Development",
        "slug": "website-development",
        "isActive": true,
        "skills": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "name": "React",
            "slug": "react",
            "isActive": true
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "name": "WordPress",
            "slug": "wordpress",
            "isActive": true
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440004",
            "name": "Vue.js",
            "slug": "vue-js",
            "isActive": true
          }
        ]
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "name": "Mobile App Development",
        "slug": "mobile-app-dev",
        "isActive": true,
        "skills": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440006",
            "name": "Flutter",
            "slug": "flutter",
            "isActive": true
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440007",
            "name": "React Native",
            "slug": "react-native",
            "isActive": true
          }
        ]
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440008",
        "name": "Backend Development",
        "slug": "backend-dev",
        "isActive": true,
        "skills": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440009",
            "name": "Node.js",
            "slug": "nodejs",
            "isActive": true
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "name": "Python",
            "slug": "python",
            "isActive": true
          }
        ]
      }
    ]
  }
}
```

## Error Responses

### 400 Bad Request - Missing Required Fields

```json
{
  "success": false,
  "error": "Category name is required"
}
```

### 400 Bad Request - Invalid Structure

```json
{
  "success": false,
  "error": "Subcategory at index 0 is missing required field: name"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden - Not Admin

```json
{
  "error": "Forbidden: Admin access required"
}
```

### 409 Conflict - Already Exists

```json
{
  "success": false,
  "error": "Category \"Programming & Tech\" or slug \"programming-tech\" already exists"
}
```

```json
{
  "success": false,
  "error": "Subcategory \"Website Development\" already exists under \"Programming & Tech\""
}
```

```json
{
  "success": false,
  "error": "Skill \"React\" already exists in subcategory \"Website Development\""
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to create category hierarchy"
}
```

## Features

### ✅ Transaction Safety
- All operations (Category, Subcategories, Skills) are wrapped in a Prisma transaction
- If any part fails, the entire operation is rolled back
- No partial data is created

### ✅ Auto-Generated Slugs
- If `slug` is not provided, it's automatically generated from the `name`
- Slugs are made unique by appending numbers if needed (e.g., `react`, `react-1`, `react-2`)

### ✅ Uniqueness Validation
- **Category name**: Unique within the same parent (or root if no parent)
- **Category slug**: Globally unique
- **Skill name**: Unique within the same category/subcategory
- **Skill slug**: Unique within the same category/subcategory

### ✅ Default Values
- `isActive` defaults to `true` if not provided
- All timestamps (`createdAt`, `updatedAt`) are automatically set

## Example Usage

### cURL

```bash
curl -X POST http://localhost:3000/api/admin/category-full-create \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Design & Creative",
    "slug": "design-creative",
    "subcategories": [
      {
        "name": "Graphic Design",
        "skills": [
          {"name": "Logo Design", "slug": "logo-design"},
          {"name": "Brand Identity", "slug": "brand-identity"}
        ]
      },
      {
        "name": "Web Design",
        "skills": [
          {"name": "UI/UX Design", "slug": "ui-ux-design"},
          {"name": "Figma", "slug": "figma"}
        ]
      }
    ]
  }'
```

### JavaScript/TypeScript

```javascript
const response = await fetch('/api/admin/category-full-create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Design & Creative',
    slug: 'design-creative',
    subcategories: [
      {
        name: 'Graphic Design',
        skills: [
          { name: 'Logo Design', slug: 'logo-design' },
          { name: 'Brand Identity', slug: 'brand-identity' },
        ],
      },
      {
        name: 'Web Design',
        skills: [
          { name: 'UI/UX Design', slug: 'ui-ux-design' },
          { name: 'Figma', slug: 'figma' },
        ],
      },
    ],
  }),
});

const data = await response.json();
if (data.success) {
  console.log('Created category:', data.category);
} else {
  console.error('Error:', data.error);
}
```

## Database Schema

### Category Model (Hierarchical)

```prisma
model Category {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique
  isActive    Boolean    @default(true)
  parentId    String?    // null for main categories, set for subcategories
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[] @relation("CategoryTree")
  skills      Skill[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@unique([parentId, name]) // Name unique within same parent
  @@index([slug])
  @@index([isActive])
  @@index([parentId])
}
```

### Skill Model

```prisma
model Skill {
  id          String   @id @default(uuid())
  categoryId  String   // Links to subcategory
  name        String
  slug        String
  isActive    Boolean  @default(true)
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([categoryId, name]) // Name unique within category
  @@unique([categoryId, slug]) // Slug unique within category
  @@index([categoryId])
  @@index([slug])
  @@index([isActive])
}
```

## Helper Functions

### Get Category Hierarchy

```javascript
import { getCategoryHierarchy } from '@/lib/services/categoryService';

const hierarchy = await getCategoryHierarchy(categoryId, onlyActive = true);
```

### Get Root Categories

```javascript
import { getRootCategories } from '@/lib/services/categoryService';

const rootCategories = await getRootCategories(onlyActive = true);
```

## Notes

1. **Slug Generation**: Slugs are automatically generated from names if not provided, using the `generateSlug` utility
2. **Uniqueness**: The system ensures uniqueness at every level before creation
3. **Cascade Delete**: If a category is deleted, all its subcategories and skills are automatically deleted
4. **Transaction**: The entire hierarchy creation is atomic - either everything succeeds or nothing is created
5. **Validation**: All required fields are validated before database operations

## Migration Required

After updating the schema, run:

```bash
npx prisma generate
npx prisma db push
# or
npx prisma migrate dev --name add_category_hierarchy
```

