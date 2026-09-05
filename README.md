# AI-Powered Legal Tech Platform

An intelligent legal practice management platform with AI-powered contract review, legal research, and billing automation.

## Features

### Case Management
- Matter tracking with status, type, and practice area organization
- Client relationship management with contact details and matter history
- Task management with dependencies, priorities, and deadlines
- Calendar integration with deadline tracking and reminders

### Document Management
- Secure document upload with version control
- Document categorization and tagging
- Full-text search across document content
- Document preview and download

### AI-Powered Features
- **Contract Review**: Automated contract analysis with risk assessment
- **Legal Research**: AI-assisted legal research with citation extraction
- **Citation Analysis**: Case citation validation and network mapping
- **Smart Summarization**: Contract and case summary generation

### Billing & Invoicing
- Time entry tracking with hourly rate management
- Invoice generation from billable time entries
- Payment processing and tracking
- Trust account management

### Security & Compliance
- Role-based access control (RBAC)
- Audit logging for all actions
- Data encryption at rest and in transit
- GDPR and SOC 2 compliance features

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **AI**: OpenAI GPT-4 integration
- **Auth**: NextAuth.js with multiple providers
- **State**: Zustand
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ai-legal-tech.git
cd ai-legal-tech

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

### Docker Setup

```bash
# Start all services
docker compose up -d

# Run migrations
docker compose exec app npx prisma migrate deploy

# View logs
docker compose logs -f app
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run typecheck    # Run TypeScript check
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── (auth)/         # Authentication pages
│   ├── (dashboard)/    # Main dashboard pages
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── ui/            # UI primitives
│   ├── matters/       # Matter components
│   ├── clients/       # Client components
│   ├── documents/     # Document components
│   ├── billing/       # Billing components
│   ├── ai/            # AI feature components
│   └── layout/        # Layout components
├── lib/               # Utility libraries
│   ├── services/      # Business logic services
│   ├── ai/           # AI integration
│   ├── validators/    # Zod schemas
│   └── utils/        # Utility functions
├── hooks/             # Custom React hooks
├── store/             # Zustand stores
├── types/             # TypeScript types
└── styles/            # Global styles
```

### Testing

```bash
# Run unit tests
npm run test -- --testPathPattern="services|lib"

# Run component tests
npm run test -- --testPathPattern="components"

# Run integration tests
npm run test -- --testPathPattern="integration"

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- matter-service.test.ts
```

### Database Management

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:migrate     # Create migration
npm run db:seed        # Seed database
npm run db:studio      # Open Prisma Studio
npm run db:reset       # Reset database
```

## API Documentation

### Authentication

All API routes require authentication via NextAuth.js session.

```bash
# Login
POST /api/auth/signin

# Logout
POST /api/auth/signout

# Get session
GET /api/auth/session
```

### Matters

```bash
GET    /api/matters           # List matters
POST   /api/matters           # Create matter
GET    /api/matters/:id       # Get matter
PUT    /api/matters/:id       # Update matter
DELETE /api/matters/:id       # Delete matter
```

### Clients

```bash
GET    /api/clients           # List clients
POST   /api/clients           # Create client
GET    /api/clients/:id       # Get client
PUT    /api/clients/:id       # Update client
DELETE /api/clients/:id       # Delete client
```

### Documents

```bash
GET    /api/documents         # List documents
POST   /api/documents         # Upload document
GET    /api/documents/:id     # Get document
DELETE /api/documents/:id     # Delete document
```

### Billing

```bash
GET    /api/billing/invoices     # List invoices
POST   /api/billing/invoices     # Create invoice
GET    /api/billing/time-entries  # List time entries
POST   /api/billing/time-entries  # Create time entry
GET    /api/billing/payments      # List payments
POST   /api/billing/payments      # Record payment
```

### AI Features

```bash
POST   /api/ai/contract-review   # Analyze contract
POST   /api/ai/legal-research    # Research legal topic
POST   /api/ai/citations         # Extract citations
```

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Docker Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Environment Variables

See `.env.example` for required environment variables.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
