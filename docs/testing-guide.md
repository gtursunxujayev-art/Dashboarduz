# Testing Guide

Comprehensive guide for testing the Dashboarduz application.

## Testing Stack

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Cypress
- **Type Checking**: TypeScript
- **Linting**: ESLint

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm --filter web test

# Run in watch mode
pnpm --filter web test:watch

# Run with coverage
pnpm --filter web test:coverage
```

### E2E Tests

```bash
# Open Cypress UI
pnpm --filter web cypress:open

# Run headless
pnpm --filter web cypress:run

# Run E2E tests
pnpm --filter web e2e
```

## Test Structure

```
apps/web/
├── __tests__/              # Unit tests
│   ├── components/        # Component tests
│   └── pages/             # Page tests
├── cypress/               # E2E tests
│   ├── e2e/               # E2E test specs
│   ├── fixtures/          # Test data
│   └── support/           # Custom commands
├── jest.config.js         # Jest configuration
└── jest.setup.js          # Jest setup
```

## Writing Tests

### Component Tests

Example component test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '@/components/my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### E2E Tests

Example E2E test:

```typescript
describe('Dashboard', () => {
  it('should navigate to leads page', () => {
    cy.visit('/dashboard');
    cy.contains('Leads').click();
    cy.url().should('include', '/dashboard/leads');
  });
});
```

## Test Utilities

### Custom Commands

Cypress custom commands in `cypress/support/commands.ts`:

- `cy.login(email, password)` - Login with email/password
- `cy.loginWithPhone(phone, otp)` - Login with phone OTP
- `cy.logout()` - Logout user
- `cy.navigateToDashboard()` - Navigate to dashboard
- `cy.createMockIntegration(type)` - Create mock integration

### Mock Utilities

Jest mocks in `jest.setup.js`:

- Next.js router mocks
- tRPC client mocks
- Auth context mocks

## Testing Best Practices

### 1. Test Structure

- **Arrange**: Set up test data and conditions
- **Act**: Perform the action being tested
- **Assert**: Verify the expected outcome

### 2. Test Naming

Use descriptive test names:
```typescript
it('should display error message when login fails', () => {
  // test code
});
```

### 3. Test Isolation

- Each test should be independent
- Clean up after tests
- Use `beforeEach` and `afterEach` for setup/teardown

### 4. Mock External Dependencies

- Mock API calls
- Mock authentication
- Mock router navigation

### 5. Test User Interactions

- Test what users see and do
- Use semantic queries (`getByRole`, `getByLabelText`)
- Avoid testing implementation details

## Coverage Goals

- **Statements**: 70%+
- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Pushes to main/develop
- Manual workflow dispatch

### Test Reports

- Coverage reports uploaded to Codecov
- Test results in GitHub Actions
- Cypress screenshots/videos on failure

## Common Issues

### Tests Failing Locally

**Issue**: Tests pass in CI but fail locally
**Solution**:
- Clear Jest cache: `pnpm test --clearCache`
- Reinstall dependencies: `pnpm install`
- Check Node.js version matches CI

### Cypress Timeouts

**Issue**: Cypress tests timing out
**Solution**:
- Increase timeout in `cypress.config.ts`
- Check server is running
- Verify base URL is correct

### Mock Not Working

**Issue**: Mocks not applying correctly
**Solution**:
- Check mock is in `jest.setup.js`
- Verify mock path matches import
- Clear Jest cache

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io)