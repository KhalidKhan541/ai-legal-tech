# Contributing to AI Legal Tech Platform

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Guidelines](#commit-guidelines)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please be respectful and considerate in all interactions.

## Getting Started

### Prerequisites

- Node.js 20 or later
- PostgreSQL 16 or later
- Redis 7 or later
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/ai-legal-tech.git
   cd ai-legal-tech
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment file:
   ```bash
   cp .env.example .env
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Adding tests
- `chore/description` - Maintenance tasks

### Development Process

1. Create a new branch from `main` or `develop`
2. Make your changes
3. Write or update tests
4. Run linting and type checks:
   ```bash
   npm run lint
   npm run typecheck
   ```
5. Run tests:
   ```bash
   npm run test
   ```
6. Commit your changes
7. Push to your fork
8. Create a Pull Request

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` type - use proper type annotations
- Use interfaces for object shapes
- Export types for public APIs

```typescript
// Good
interface Matter {
  id: string;
  title: string;
  status: MatterStatus;
  createdAt: Date;
}

// Bad
const matter: any = { ... };
```

### React Components

- Use functional components with hooks
- Use TypeScript for props
- Keep components small and focused
- Extract custom hooks for shared logic

```typescript
// Good
interface MatterCardProps {
  matter: Matter;
  onClick: (id: string) => void;
}

export function MatterCard({ matter, onClick }: MatterCardProps) {
  return (
    <div onClick={() => onClick(matter.id)}>
      {matter.title}
    </div>
  );
}
```

### Naming Conventions

- **Files**: `kebab-case.tsx` for components, `kebab-case.ts` for utilities
- **Components**: `PascalCase` for component names
- **Functions**: `camelCase` for functions and variables
- **Constants**: `UPPER_SNAKE_CASE` for constants
- **Types/Interfaces**: `PascalCase`

### Imports

- Use path aliases (`@/components`, `@/lib`)
- Group imports: external, internal, types
- Use type-only imports when possible

```typescript
// Good
import { Button } from '@/components/ui/button';
import { useMatter } from '@/hooks/use-matter';
import type { Matter } from '@/types/matter';
```

### CSS/Styling

- Use Tailwind CSS for styling
- Use `class-variance-authority` for component variants
- Use `tailwind-merge` for class merging
- Follow the existing design system

## Testing Requirements

### Test Types

1. **Unit Tests**: Test individual functions and services
2. **Component Tests**: Test React components in isolation
3. **Integration Tests**: Test API routes and workflows

### Writing Tests

- Follow the existing test patterns
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies
- Aim for 80%+ code coverage

```typescript
describe('MatterService', () => {
  describe('create', () => {
    it('should create a matter with valid data', async () => {
      // Arrange
      const matterData = { title: 'Test Matter' };
      
      // Act
      const result = await service.create(matterData);
      
      // Assert
      expect(result.title).toBe('Test Matter');
    });

    it('should throw error for invalid data', async () => {
      // Arrange
      const invalidData = {};
      
      // Act & Assert
      await expect(service.create(invalidData)).rejects.toThrow();
    });
  });
});
```

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test -- --testPathPattern="specific"  # Specific tests
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project standards
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] TypeScript compiles without errors
- [ ] Documentation updated (if needed)
- [ ] No console.log statements left
- [ ] No hardcoded secrets or credentials

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Component tests added/updated
- [ ] Integration tests added/updated

## Checklist
- [ ] Self-reviewed code
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. PR requires at least 1 approval
2. All CI checks must pass
3. Address review feedback
4. Squash and merge

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

### Examples

```bash
git commit -m "feat(matters): add matter status filtering"
git commit -m "fix(billing): resolve invoice calculation error"
git commit -m "docs(readme): update API documentation"
git commit -m "test(services): add matter service unit tests"
```

## Issue Guidelines

### Bug Reports

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots (if applicable)

### Feature Requests

- Problem description
- Proposed solution
- Alternatives considered
- Additional context

## Getting Help

- Check existing documentation
- Search existing issues
- Ask in discussions
- Contact maintainers

Thank you for contributing!
