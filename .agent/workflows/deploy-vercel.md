---
description: How to configure environment variables in Vercel for the Quicklyway project.
---

1. **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log into your account.
2. **Select Your Project**: Click on the project you want to configure (e.g., your backend or frontend project).
3. **Navigate to Settings**: Click on the **"Settings"** tab in the top navigation bar of your project dashboard.
4. **Go to Environment Variables**: Click on **"Environment Variables"** in the left sidebar.
5. **Add Individual Variables**:
   - In the **"Key"** field, type the variable name (e.g., `MONGODB_URI`).
   - In the **"Value"** field, paste the corresponding value from your `.env` file.
   - Click **"Add"**.
6. **Deploy Changes**: 
   - After adding the variables, you must redeploy your project for the changes to take effect. 
   - You can do this by going to the **"Deployments"** tab, clicking the three dots on the latest deployment, and selecting **"Redeploy"**.

### Variables Needed for Backend:
- `MONGODB_URI`: Your production MongoDB connection string.
- `JWT_SECRET`: A secure random string for JWT signing.
- `FRONTEND_URL`: The URL of your deployed frontend (e.g., `https://frontend-xxx.vercel.app`).

### Variables Needed for Frontend:
- `NEXT_PUBLIC_API_URL`: The URL of your deployed backend followed by `/api` (e.g., `https://backend-xxx.vercel.app/api`).
- `NEXT_PUBLIC_APP_URL`: The URL of your deployed frontend.

> [!TIP]
> You can also drag and drop your `.env` file directly into the Environment Variables page on Vercel to add multiple variables at once!
