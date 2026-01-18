# Kuinbee Marketplace - Supplier Frontend

> Supplier portal for the Kuinbee Data Marketplace

---

## 🚀 Quick Start

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

---

## 📚 Documentation

- **[SETUP_SUMMARY.md](./SETUP_SUMMARY.md)** - Complete setup details, tech stack, and methodology
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick patterns, templates, and code snippets

---

## 🛠 Tech Stack

- **Next.js 16.1.1** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI + shadcn/ui** - Component library
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form + Zod** - Form handling & validation

---

## 📜 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm run type-check       # TypeScript type checking
```

---

## 📁 Project Structure

```
src/
├── app/                # Next.js App Router pages
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── features/      # Feature-specific components
│   └── shared/        # Reusable components
├── lib/               # Utilities and helpers
│   ├── api/          # API services
│   ├── hooks/        # Custom hooks
│   ├── utils/        # Utility functions
│   └── constants/    # Constants
├── store/             # Zustand stores
├── types/             # TypeScript types
└── config/            # App configuration
```

---

## 🎯 Development Methodology

This project follows the same development methodology as the Admin frontend:

1. **Component Extraction** - Single responsibility, reusable components
2. **Type Safety** - TypeScript throughout
3. **API Integration** - Service layer + React Query hooks
4. **Code Quality** - ESLint + Prettier + Type checking
5. **Consistent Patterns** - Standardized component and file structures

See [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) for detailed methodology.

---

## 🔗 Related Projects

- **Admin Frontend** - `/frontend/admin` - Reference implementation
- **User Frontend** - `/frontend/user` - User-facing portal
- **Backend** - `/backend` - API services

---

## 📝 Next Steps

1. ✅ Project initialized with dependencies
2. 🔄 Set up global styles and theme provider
3. 🔄 Configure React Query provider
4. 🔄 Create basic layout structure
5. 🔄 Implement authentication flow
6. 🔄 Build feature components

---

**Status**: ✅ Setup Complete - Ready for Development
**Last Updated**: January 6, 2026
