# TransitOps Design System & Visual Language (Odoo Theme)

## 1. Design Philosophy
TransitOps follows a modern, enterprise SaaS visual language heavily inspired by Odoo's Enterprise UI. 
The application must feel data-dense yet breathable, strictly professional, and highly accessible.
- **Function over Flash:** No excessive gradients, heavy shadows, or decorative elements.
- **Card-Based Architecture:** Content, forms, and tables live inside clean, white cards on a light gray background.
- **Clear Information Hierarchy:** Use typography scale and status colors to guide the user's eye to KPIs and actions.
- **Consistency:** Use Shadcn/UI for foundational components, styled explicitly with the tokens provided below.

## 2. Color System
The color palette uses exact hex codes from the Odoo brand guidelines to ensure an authentic enterprise look.

### Brand Colors
- **Primary (Plum/Purple):** `#714B67` - Use for active states, primary buttons, focus rings, and main sidebar branding.
- **Primary Hover:** `#5A3C52` - Slightly darker shade for button hovers.
- **Secondary (Teal):** `#017E84` - Use for secondary accents, informative icons, or secondary buttons.
- **Accent (Blue):** `#1A73E8` - Use for active links, text buttons, or active navigation items.

### Neutral Colors (Tailwind Equivalents)
- **Background (App Canvas):** `#F9FAFB` (`bg-gray-50`) - Main application background.
- **Surface (Cards/Modals):** `#FFFFFF` (`bg-white`) - All content containers.
- **Border:** `#E5E7EB` (`border-gray-200`) - Dividers, table borders, and input outlines.
- **Text Primary:** `#202124` (`text-gray-900`) - Headings and primary body text.
- **Text Secondary:** `#6B7280` (`text-gray-500`) - Subtitles, helper text, and table headers.

### Semantic Status Colors (Pills & Badges)
- **Success (Green):** `#21B799` (Available, Completed, Active)
  - Badge style: `bg-[#21B799]/10 text-[#21B799] border-[#21B799]/20`
- **Warning (Yellow):** `#E4A900` (In Shop, Pending, Draft)
  - Badge style: `bg-[#E4A900]/10 text-[#E4A900] border-[#E4A900]/20`
- **Danger (Red):** `#E46E78` (Retired, Suspended, Cancelled, Expired)
  - Badge style: `bg-[#E46E78]/10 text-[#E46E78] border-[#E46E78]/20`
- **Info (Blue):** `#5B899E` (On Trip, Dispatched)
  - Badge style: `bg-[#5B899E]/10 text-[#5B899E] border-[#5B899E]/20`

## 3. Typography System
- **Font Family:** `Inter`, `Roboto`, or `system-ui`. (Apply `font-sans` in Tailwind).
- **Page Titles:** 24px (`text-2xl`), font-semibold, text `#202124`.
- **Card Titles:** 18px (`text-lg`), font-medium, text `#202124`.
- **Table Headers:** 12px (`text-xs`), uppercase, font-semibold, tracking-wider, text `#6B7280`.
- **Body Text (Tables/Forms):** 14px (`text-sm`), text `#202124`.
- **Helper Text:** 12px (`text-xs`), text `#6B7280`.

## 4. Spacing & Grid System
Strictly adhere to a baseline 8px grid (Tailwind's default spacing).
- **App Layout:** Sidebar width `256px` (`w-64`), Topbar height `64px` (`h-16`).
- **Page Padding:** `24px` (`p-6`) for the main content area.
- **Card Padding:** `20px` (`p-5`) or `24px` (`p-6`) for internal card content.
- **Gap:** `16px` (`gap-4`) or `24px` (`gap-6`) between grid items (e.g., KPI cards).

## 5. Component Styling Guidelines (Shadcn Overrides)

### Buttons
- **Primary:** Background `#714B67`, Text `#FFFFFF`, rounded corners `rounded-md`, transition hover to `#5A3C52`, no border.
- **Secondary / Outline:** Background `#FFFFFF`, Border `#E5E7EB`, Text `#202124`, hover background `#F9FAFB`.
- **Ghost/Icon:** Text `#6B7280`, hover background `#F3F4F6` (`gray-100`), hover text `#202124`.

### Cards (Containers)
- Background `#FFFFFF`, Border `1px solid #E5E7EB`, `rounded-lg`, Box Shadow `shadow-sm` (0 1px 2px 0 rgba(0, 0, 0, 0.05)).
- Never use heavy drop shadows.

### Tables (List Views)
- **Header:** Sticky header, light gray background `bg-gray-50`, bottom border `border-gray-200`.
- **Rows:** White background, subtle hover effect `hover:bg-gray-50`, bottom border `border-gray-100`.
- **Alignment:** Left-align text, right-align numbers/currency, center-align status badges.

### Forms (Inputs & Selects)
- **Input Fields:** `rounded-md`, border `#E5E7EB` (`border-gray-300`), text `text-sm`, `bg-white`.
- **Focus State:** Outline/Ring must be `#714B67` (`ring-[#714B67] border-[#714B67]`). No default blue outlines.
- **Labels:** `text-sm`, `font-medium`, `text-gray-700`, margin-bottom `mb-1.5`.
- **Error State:** Border `#E46E78`, helper text `#E46E78`.

### Badges / Status Pills
- Highly rounded `rounded-full`, padding `px-2.5 py-0.5`, text size `text-xs`, font weight `font-medium`. 
- Follow the Semantic Status Colors defined in Section 2.

## 6. Application Layout Patterns

### Persistent Shell
- **Left Sidebar:** Background `#FFFFFF` (or optionally dark `#714B67` for high contrast). Active menu items must have a subtle background highlight (`bg-gray-100` or `bg-white/10`) and primary color text/icon.
- **Top Navbar:** Background `#FFFFFF`, Border-bottom `#E5E7EB`. Contains global search, user profile, and role badge.
- **Main Content Area:** Background `#F9FAFB`.

### Page Anatomy
1. **Page Header:** - Left side: Page Title (e.g., "Trip Dispatch").
   - Right side: Global page actions (e.g., "Create Trip" primary button).
2. **KPI Strip (Optional):** A row of 3-4 summary cards at the top of the page.
3. **Filter/Search Bar:** A utility bar above tables for quick searching and status dropdowns.
4. **Data Container:** The main table, form, or dashboard charts.

## 7. Motion & Animation
- **Transitions:** Keep them snappy and functional. Use Tailwind's `transition-all duration-200 ease-in-out` for button hovers, dropdown reveals, and table row hovers.
- **Loading States:** Use skeleton loaders (`animate-pulse`) styled in `bg-gray-200` rather than intrusive spinner overlays.
- **Empty States:** Center-aligned content with a muted Lucide icon, a brief gray text explanation, and a primary call-to-action button to create the first record.