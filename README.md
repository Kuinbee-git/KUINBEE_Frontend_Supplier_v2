Kuinbee — Supplier Panel
=========================

Overview
--------
The Kuinbee Supplier Panel is the supplier-facing frontend for the Kuinbee marketplace. It provides suppliers with comprehensive tools for onboarding, KYC verification, dataset/product proposal submission, profile management, and seamless interaction with the marketplace API. The platform enables data suppliers to register, verify their identity, manage their product catalog, and track proposal statuses through an intuitive dashboard interface.

Tech Stack
----------
- **Next.js 16.1.1** - React framework with App Router and Turbopack
- **TypeScript** - Type safety and enhanced developer experience
- **Tailwind CSS 4** - Utility-first styling framework
- **Radix UI + shadcn/ui** - Accessible component library
- **TanStack Query** - Server state management and data fetching
- **Zustand** - Lightweight client state management
- **React Hook Form + Zod** - Form handling and validation

Repository Layout
-----------------
```
frontend/supplier/
├── src/app/                    # Next.js App Router pages
│   ├── auth/                  # Authentication flows (login, register, password reset)
│   ├── onboarding/            # Backend-driven onboarding flow
│   │   ├── select-type/       # Supplier type selection (INDIVIDUAL/COMPANY)
│   │   ├── verify-email/      # Email OTP verification
│   │   ├── verify-pan/        # PAN verification (India KYC)
│   │   └── complete-profile/  # Profile completion
│   └── dashboard/             # Main supplier dashboard
│       ├── datasets/          # Dataset proposals management
│       ├── profile/           # Profile management
│       ├── account/           # Account & security settings
│       └── support/           # Help & support center
├── src/components/            # React components
│   ├── ui/                   # shadcn/ui base components
│   ├── auth/                 # Authentication components
│   ├── onboarding/           # Onboarding UI (ProgressStepper)
│   ├── datasets/             # Dataset management components
│   ├── profile/              # Profile & account components
│   ├── layout/               # Layout components (DashboardShell)
│   └── shared/               # Shared/reusable components
├── src/lib/                  # Utilities and helpers
│   ├── api/                  # API services & fetch utilities
│   │   ├── auth.ts           # Authentication API
│   │   ├── supplier.ts       # Supplier onboarding API
│   │   └── dataset-proposals.ts # Dataset proposal API
│   ├── validators/           # Zod validation schemas
│   └── utils/                # Helper functions
├── src/hooks/                # Custom React hooks
│   ├── useAuthTokens.ts      # Auth token management
│   ├── useSupplierTokens.ts  # Theme & design tokens
│   ├── useOnboardingStatus.ts # Backend onboarding status
│   ├── useOnboardingRouter.ts # Onboarding navigation
│   └── useDashboardNav.ts    # Dashboard navigation
├── src/store/                # Zustand stores
│   ├── auth.store.ts         # Authentication state
│   ├── supplier.store.ts     # Supplier profile state
│   ├── dashboard.store.ts    # Dashboard UI state
│   └── theme.store.ts        # Theme state
├── src/types/                # TypeScript type definitions
│   ├── api-response.types.ts # API response structures
│   ├── onboarding.types.ts   # Onboarding flow types
│   ├── dataset-proposal.types.ts # Dataset proposal types
│   └── auth.types.ts         # Authentication types
├── src/constants/            # Application constants
│   └── api.constants.ts      # API endpoints
├── src/config/               # Configuration files
│   └── site.config.ts        # Site metadata
└── public/                   # Static assets
```

Running Locally
---------------

### Development Mode

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (see Environment section below)

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Additional Scripts

```bash
npm run lint              # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm run type-check       # TypeScript type checking
```

Environment Configuration
------------------------
Create an `.env.local` file in the project root with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.kuinbee.com

# S3 Upload Configuration (if using direct uploads)
NEXT_PUBLIC_S3_UPLOAD_BUCKET=kuinbee-datasets

# Optional: Additional configuration
NEXT_PUBLIC_APP_ENV=production
```

Consult the backend documentation for complete API authentication requirements and endpoint specifications.

Key Features
------------

### Authentication & Registration
Secure user authentication with JWT-based sessions. New suppliers can register accounts, and existing suppliers can log in with automatic session management and token refresh.

- **Routes:** `/auth/register`, `/auth/login`
- **Components:** AuthForm, LoginForm
- **Store:** useAuthStore (JWT tokens, user state)
- **API:** auth.service.ts
- **Error Handling:** Comprehensive validation including duplicate email detection

### Supplier Onboarding
Backend-driven multi-step KYC process ensuring compliance and verification before marketplace access.

- **Routes:** `/onboarding/select-type` → `/onboarding/verify-email` → `/onboarding/verify-pan` → `/onboarding/complete-profile`
- **Process Flow:**
  1. Select supplier type (Individual/Company)
  2. Email verification via OTP
  3. PAN verification (India KYC compliance)
  4. Complete business profile
- **Components:** ProgressStepper, step-specific verification forms
- **Hooks:** useOnboardingStatus, useOnboardingRouter
- **API:** Onboarding endpoints with state persistence

### Dashboard & Analytics
Comprehensive dashboard providing suppliers with real-time overview of their marketplace activity, proposal statuses, and key metrics.

- **Route:** `/dashboard`
- **Components:** DashboardShell, stats widgets
- **Store:** useSidebarStore, useDashboardStore
- **Features:** Quick stats, navigation shortcuts, activity feed

### Profile Management
Complete profile management allowing suppliers to update business information, contact details, and legal documentation.

- **Route:** `/dashboard/profile`
- **Components:** SupplierProfile, ProfileForm
- **API:** suppliers.service.ts
- **Validation:** React Hook Form + Zod schemas with real-time validation

### KYC & Verification
Ongoing KYC management for document updates, re-verification, and compliance maintenance.

- **Route:** `/dashboard/kyc`
- **Components:** KYC verification forms and document upload
- **API:** KYC verification endpoints
- **Features:** Document status tracking, expiry notifications

### Dataset Proposal Management
End-to-end workflow for submitting, tracking, and managing dataset proposals for marketplace listing.

- **Route:** `/dashboard/proposals`
- **Components:** ProposalForm, ProposalList, DatasetUpload
- **API:** dataset-proposals.service.ts
- **Features:**
  - Create new proposals with metadata
  - Direct S3 file uploads via presigned URLs
  - Proposal status tracking (draft, submitted, approved, rejected, under-review)
  - Bulk operations and filters
  - Download approved datasets

### Account Settings
User preferences and account security management including theme customization and notification settings.

- **Route:** `/dashboard/settings`
- **Store:** useThemeStore
- **Features:** Dark/light mode toggle, notification preferences, security settings

State Management
----------------

The application uses Zustand for efficient client-side state management with selective persistence:

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `useAuthStore` | User authentication & session management | Persisted (localStorage) |
| `useSupplierStore` | Supplier profile & KYC status | Persisted (localStorage) |
| `useDashboardStore` | UI state (sidebar, active view) | Transient (session only) |
| `useThemeStore` | Theme preference (dark/light mode) | Persisted (localStorage) |

All stores follow a consistent pattern with typed actions and selectors for optimal performance and type safety.

API Integration
---------------

The application uses a service layer pattern for all backend communication, providing consistent error handling and type safety across all API interactions.

### Authentication Service (`lib/api/auth.ts`)
- User login and registration
- Session management
- Token refresh
- Password reset flows

### Supplier Onboarding Service (`lib/api/supplier.ts`)
- Onboarding status retrieval
- Supplier type selection (INDIVIDUAL/COMPANY)
- Email OTP generation and verification
- PAN verification with attempt tracking
- Profile management (get/update)
- Onboarding completion

### Dataset Proposals Service (`lib/api/dataset-proposals.ts`)
- Proposal creation and management
- Supplier proposal listing
- Detailed proposal retrieval
- Metadata updates
- Proposal submission workflow
- S3 file upload coordination

### API Design Principles
- Cookie-based authentication for security
- Comprehensive error handling with status codes
- JSON request/response format
- Type-safe interfaces for all endpoints
- Automatic network error recovery
- Consistent error message extraction

Error Handling
--------------

The application implements comprehensive error handling across all API interactions to provide clear, actionable feedback to users:

- **Validation Errors** - Field-level error messages with inline display
- **Conflict Errors** (409) - User-friendly messages for duplicate data (e.g., "This email is already registered")
- **Authentication Errors** - Automatic token refresh and re-authentication flows
- **Network Errors** - Retry mechanisms with user-friendly fallback messages
- **API Errors** - Structured error extraction from JSON responses with logging

All error responses follow a consistent format, making debugging and user feedback predictable and maintainable.

Development Methodology
-----------------------

The project follows enterprise-grade development practices:

1. **Component Architecture** - Single responsibility principle with highly reusable components
2. **Type Safety** - Full TypeScript coverage with strict mode enabled
3. **API Integration** - Service layer abstraction with React Query for caching and optimistic updates
4. **Code Quality** - ESLint, Prettier, and TypeScript compiler checks in CI/CD pipeline
5. **Consistent Patterns** - Standardized file structure, naming conventions, and component patterns
6. **Responsive Design** - Mobile-first approach with Tailwind CSS utilities

Related Projects
----------------

- **Admin Frontend** (`/frontend/admin`) - Administrative dashboard for marketplace management
- **User Frontend** (`/frontend/user`) - Consumer-facing marketplace portal
- **Backend API** (`/backend`) - Core API services and business logic

Contributing
------------

We welcome contributions to improve the Kuinbee Supplier Panel:

1. Fork the repository and create a feature branch
2. Make your changes following the existing code style and patterns
3. Ensure all TypeScript checks pass: `npm run type-check`
4. Run linting: `npm run lint`
5. Build successfully: `npm run build`
6. Submit a pull request with a clear description of changes

Please maintain the existing code quality standards and add appropriate documentation for new features.

License
-------

See the repository [LICENSE](../../LICENSE) file for licensing details.

---

**Kuinbee Marketplace** - Empowering data suppliers with seamless onboarding and management tools.
