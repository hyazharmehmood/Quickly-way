# Category & Skill Management System

## Overview
A comprehensive admin-only module for managing Categories and Skills in the freelancer marketplace platform (Fiverr-style).

## Database Schema

### Category Model
```prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  skills      Skill[]
}
```

### Skill Model
```prisma
model Skill {
  id          String   @id @default(uuid())
  categoryId  String
  name        String
  slug        String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([categoryId, name]) // Skill name unique within category
  @@unique([categoryId, slug]) // Slug unique within category
}
```

## API Endpoints

### Admin APIs (Protected - Admin Only)

#### Categories
- `GET /api/admin/categories` - Get all categories
  - Query params: `isActive` (true/false), `includeSkills` (true/false)
- `POST /api/admin/categories` - Create category
  - Body: `{ name: string }`
- `GET /api/admin/categories/[id]` - Get single category
- `PATCH /api/admin/categories/[id]` - Update category
  - Body: `{ name?: string, isActive?: boolean }`
- `DELETE /api/admin/categories/[id]` - Soft delete (disable) category

#### Skills
- `GET /api/admin/skills` - Get all skills
  - Query params: `categoryId`, `isActive` (true/false)
- `POST /api/admin/skills` - Create skill
  - Body: `{ name: string, categoryId: string }`
- `GET /api/admin/skills/[id]` - Get single skill
- `PATCH /api/admin/skills/[id]` - Update skill
  - Body: `{ name?: string, categoryId?: string, isActive?: boolean }`
- `DELETE /api/admin/skills/[id]` - Soft delete (disable) skill

### Public APIs (For Freelancers)

- `GET /api/categories` - Get all active categories
  - Query params: `includeSkills` (true/false)
- `GET /api/categories/[id]/skills` - Get active skills for a category

## Example API Responses

### Create Category
```json
POST /api/admin/categories
{
  "name": "Web Development"
}

Response (201):
{
  "success": true,
  "category": {
    "id": "uuid",
    "name": "Web Development",
    "slug": "web-development",
    "isActive": true,
    "createdAt": "2024-01-22T...",
    "updatedAt": "2024-01-22T...",
    "_count": {
      "skills": 0
    }
  }
}
```

### Get Categories with Skills
```json
GET /api/categories?includeSkills=true

Response (200):
{
  "success": true,
  "categories": [
    {
      "id": "uuid",
      "name": "Web Development",
      "slug": "web-development",
      "isActive": true,
      "skills": [
        {
          "id": "uuid",
          "name": "React",
          "slug": "react",
          "isActive": true
        }
      ],
      "_count": {
        "skills": 5
      }
    }
  ]
}
```

### Create Skill
```json
POST /api/admin/skills
{
  "name": "React",
  "categoryId": "category-uuid"
}

Response (201):
{
  "success": true,
  "skill": {
    "id": "uuid",
    "name": "React",
    "slug": "react",
    "categoryId": "category-uuid",
    "isActive": true,
    "category": {
      "id": "category-uuid",
      "name": "Web Development",
      "slug": "web-development"
    }
  }
}
```

## Frontend Flow for Freelancers

### Example: Creating a Service/Gig

```javascript
// 1. Fetch active categories
const categoriesResponse = await api.get('/api/categories');
const categories = categoriesResponse.data.categories;

// 2. User selects a category
const selectedCategoryId = 'category-uuid';

// 3. Fetch skills for selected category
const skillsResponse = await api.get(`/api/categories/${selectedCategoryId}/skills`);
const skills = skillsResponse.data.skills;

// 4. User selects skills (multi-select)
const selectedSkills = ['skill-uuid-1', 'skill-uuid-2'];

// 5. Create service with category and skills
await api.post('/api/services', {
  title: 'React Developer',
  category: selectedCategoryId,
  skills: selectedSkills,
  // ... other fields
});
```

## Admin UI Features

### Categories Page (`/admin/categories`)
- ✅ View all categories with search
- ✅ Filter by active/inactive status
- ✅ Create new category
- ✅ Edit category name
- ✅ Toggle active/inactive status
- ✅ Soft delete (disable) category
- ✅ View skills count per category

### Skills Page (`/admin/skills`)
- ✅ View all skills with search
- ✅ Filter by category
- ✅ Filter by active/inactive status
- ✅ Create new skill (with category selection)
- ✅ Edit skill name and category
- ✅ Toggle active/inactive status
- ✅ Soft delete (disable) skill

## Validation Rules

1. **Category Name**: Must be unique across all categories
2. **Skill Name**: Must be unique within the same category
3. **Slug Generation**: Automatically generated from name, made unique if needed
4. **Soft Delete**: Uses `isActive` flag instead of hard delete
5. **Admin Only**: All admin endpoints require ADMIN role authentication

## Security

- All admin APIs protected with `verifyAdminAuth` middleware
- Checks for valid JWT token
- Verifies user role is ADMIN
- Returns 401/403 for unauthorized access

## Best Practices (Fiverr-style)

1. **Scalability**:
   - Indexed fields: `slug`, `isActive`, `categoryId`, `name`
   - Efficient queries with proper includes
   - Pagination ready (can be added if needed)

2. **Data Integrity**:
   - Unique constraints at database level
   - Cascade delete for skills when category is deleted
   - Soft delete preserves historical data

3. **User Experience**:
   - Only active categories/skills visible to freelancers
   - Real-time search and filtering
   - Clear status indicators (Active/Inactive badges)

4. **Maintainability**:
   - Reusable slug generation utility
   - Centralized admin authentication
   - Consistent API response format
   - Comprehensive error handling

## Next Steps

1. Run database migration:
   ```bash
   npx prisma migrate dev --name add_categories_and_skills
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Test the APIs using the admin panel or API client

4. Integrate category/skill selection in freelancer service creation flow

## Notes

- Categories and Skills use soft delete (isActive flag) to preserve data
- Slugs are auto-generated and made unique automatically
- All admin operations require ADMIN role
- Public endpoints only return active categories/skills
- Skills are scoped to categories (cannot exist without a category)

