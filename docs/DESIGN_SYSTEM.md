# Quicklyway Design System — One Rule

Single consistent rule for all UI: **same radius scale**, **same typography**, **same colors**. Use these everywhere so the app looks professional and unified.

---

## 1. Border Radius (Rounded)

| Token    | Value    | Use for |
|----------|----------|--------|
| `--radius` | `0.75rem` (12px) | Default for inputs, textareas, cards, dropdowns, modals, table wrapper, tabs, tooltip, toggle, skeleton, menubar |
| `rounded-lg` | `0.75rem` | All non-pill surfaces (input, textarea, card, tabs list, table container, tooltip, menubar content) |
| `rounded-full` | 9999px | Pills only: **buttons**, **badges** (pill style), **switch** |

- **Do not** mix `rounded-md`, `rounded-xl`, `rounded-2xl` for these components — use **rounded-lg** or **rounded-full** only.
- Buttons and pill badges: **rounded-full**. Everything else in this list: **rounded-lg**.

---

## 2. Typography

| Element | Class | Size | Weight |
|---------|--------|------|--------|
| **H1** | `text-3xl font-semibold tracking-tight` | 30px | 600 |
| **H2** | `text-2xl font-semibold tracking-tight` | 24px | 600 |
| **H3** | `text-xl font-medium` | 20px | 500 |
| **H4** | `text-lg font-medium` | 18px | 500 |
| **H5** | `text-base font-medium` | 16px | 500 |
| **H6** | `text-sm font-medium` | 14px | 500 |
| **Body** | `text-base` | 16px | 400 |
| **Small** | `text-sm` | 14px | 400 |
| **Caption** | `text-xs text-muted-foreground` | 12px | 400 |

- Use these for **all** headings and body text across landing, dashboard, and admin.
- Utility classes: `.heading-1` … `.heading-6`, `.body`, `.small`, `.caption` (see globals.css).

---

## 3. Colors

- Use existing CSS variables only: `primary`, `primary-foreground`, `secondary`, `muted`, `muted-foreground`, `accent`, `destructive`, `border`, `input`, `ring`, `background`, `foreground`, `card`, `popover`.
- Do not introduce new ad-hoc hex/rgb for UI; use semantic names.

---

## 4. Components (Same Rule)

| Component | Radius | Typography / Notes |
|-----------|--------|---------------------|
| **Badge** | `rounded-full` (pill) or `rounded-lg` | `text-xs font-medium` default |
| **Label** | — | `text-sm font-medium` |
| **Input** | `rounded-lg` | `text-sm` (or `text-base` on mobile if desired) |
| **Textarea** | `rounded-lg` | `text-sm` |
| **Button** | `rounded-full` | `text-sm font-medium` |
| **Table** | Wrapper `rounded-lg overflow-hidden`; cells unchanged | Headings: `text-sm font-medium text-muted-foreground` |
| **TableHead** | — | `text-sm font-medium text-muted-foreground` |
| **Tabs** | TabsList + TabsTrigger: `rounded-lg` | `text-sm font-medium` |
| **Switch** | `rounded-full` (already) | — |
| **Tooltip** | `rounded-lg` | `text-xs` |
| **Toggle** | `rounded-lg` | `text-sm font-medium` |
| **Skeleton** | `rounded-lg` | — |
| **Menubar** | Root + content + items: `rounded-lg` | `text-sm font-medium` |

---

## 5. Landing & Pages

- **Landing page**: One main H1 (sr-only or visible), sections use H2, cards use H3/H4. All follow the table above.
- **Dashboard / Admin**: Page title = H2; section titles = H3; cards/sidebar = H4 or body.
- **Consistency**: Every page uses the same heading scale and same radius (rounded-lg for containers, rounded-full for buttons/badge pills).

---

## 6. Summary Rule

1. **Radius**: Either **rounded-lg** (0.75rem) or **rounded-full** (pills). No random rounded-md/rounded-xl for these components.
2. **Headings**: H1–H6 use the sizes and weights above; use utility classes when possible.
3. **Colors**: Only design tokens (primary, muted, etc.).
4. **Font**: Poppins (existing --font-poppins) everywhere.

Apply this from **landing page** first, then **one by one** to the rest of the app.
