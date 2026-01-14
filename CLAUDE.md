# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a Next.js 16 portfolio template using the App Router with React 19 and Tailwind CSS 4.

### Project Structure

- `src/app/` - App Router pages and API routes
- `src/app/components/` - Page-specific components organized by section:
  - `home/` - Homepage sections (hero, about-me, featured-work, experience, education, project-overview)
  - `layout/` - Header and Footer components
  - `divider/` - Section divider component
- `src/components/ui/` - Reusable UI components (Button, Badge) using shadcn/ui patterns with CVA
- `src/lib/utils.ts` - Utility functions including `cn()` for class merging

### Data Layer

Portfolio data is served via API routes:
- `/api/page-data` - Experience, education, and project overview data
- `/api/featured-work` - Featured work entries

### Key Patterns

- Uses `@/*` path alias mapping to `./src/*`
- UI components use `class-variance-authority` for variants with `cn()` helper for Tailwind class merging
- Lucide React for icons
