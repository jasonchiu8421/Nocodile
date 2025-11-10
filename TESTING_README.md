# Testing Setup with MSW

This project uses comprehensive testing powered by Vitest, React Testing Library, and MSW (Mock Service Worker) for API mocking.

## 🧪 Testing Framework Stack

- **Vitest** - Fast test runner
- **React Testing Library** - Component testing utilities
- **MSW (Mock Service Worker)** - API mocking
- **Jest DOM** - Custom DOM matchers
- **jsdom** - DOM environment for testing

## 📁 Test Structure

```
src/
├── tests/
│   ├── setup.ts              # Global test setup
│   ├── api/
│   │   ├── auth.test.ts      # Authentication API tests
│   │   ├── projects.test.ts  # Project management tests
│   │   ├── annotation.test.ts # Annotation workflow tests
│   │   ├── training.test.ts  # Model training tests
│   │   └── health.test.ts    # Health check tests
│   ├── components/
│   │   └── Button.test.tsx   # Component tests
│   └── integration/
│       └── App.test.tsx      # Integration tests
├── mocks/
│   ├── handlers.ts           # MSW API handlers
│   ├── server.ts             # MSW server setup
│   └── browser.ts            # MSW browser setup
```

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Watch mode (re-run on changes)
npm run test:watch

# Interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Categories

#### 1. **API Tests** (`src/tests/api/`)
Tests all API endpoints using MSW handlers:

- ✅ Health checks
- ✅ User authentication (login/register)
- ✅ Project management
- ✅ Video upload/retrieval
- ✅ Class management
- ✅ Annotation workflow
- ✅ Model training & performance

#### 2. **Component Tests** (`src/tests/components/`)
Unit tests for individual React components:

- ✅ Button component variations
- ✅ Event handling
- ✅ Props passing
- ✅ CSS class application

#### 3. **Integration Tests** (`src/tests/integration/`)
Full application flow testing:

- ✅ App component rendering
- ✅ Navigation flow
- ✅ Component interactions
- ✅ Layout structure

## 🎯 MSW Mock API Endpoints

All your API endpoints are mocked in `src/mocks/handlers.ts`:

### Authentication
- `POST /login` - User login
- `POST /register` - User registration

### Projects
- `POST /get_projects_info` - Get user projects
- `POST /get_project_details` - Get project details
- `POST /upload` - Upload videos
- `POST /get_uploaded_videos` - Get uploaded videos

### Annotation
- `POST /get_classes` - Get annotation classes
- `POST /add_class` - Add new class
- `POST /get_next_frame_to_annotate` - Get next frame
- `POST /annotate` - Save annotations

### Training
- `POST /train` - Start model training
- `POST /get_training_progress` - Check training progress
- `POST /get_model_performance` - Get model metrics

### Health
- `GET /health` - Health check endpoint

## 🔧 Configuration

### MSW Setup
The MSW server is automatically configured in `src/tests/setup.ts`:

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Vitest Configuration
Configured in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

## 📝 Writing New Tests

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { YourComponent } from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### API Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('Your API', () => {
  it('should return expected data', async () => {
    const response = await fetch('http://localhost:8888/your-endpoint');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

## 🐛 Common Issues & Solutions

### 1. MSW Not Intercepting Requests
- Ensure `server.listen()` is called in setup
- Check request URLs match mock handlers
- Verify MSW server is running before tests

### 2. TypeScript Errors
- Install missing types: `@types/react`, `@types/react-dom`
- Ensure jest-dom matchers are imported in setup
- Check component prop types match test expectations

### 3. React Router Issues
- Use `MemoryRouter` for components with routing
- Mock `useNavigate` hook if needed
- Test navigation behavior separately

### 4. Async Test Timeouts
- Use `await act()` for state updates
- Implement proper cleanup in `afterEach`
- Use fake timers for time-based tests

## 📊 Coverage Reports

Generate coverage reports with:

```bash
npm run test:coverage
```

Reports are generated in:
- `coverage/` folder (HTML format)
- Console output (text format)
- `coverage.json` (JSON format for CI/CD)

## 🎯 Best Practices

1. **Test user behavior, not implementation**
2. **Use meaningful test names**
3. **Mock external dependencies**
4. **Test happy path and edge cases**
5. **Keep tests focused and small**
6. **Use proper async/await patterns**
7. **Clean up after each test**

## 🔄 CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Tests
  run: npm run test:run

- name: Generate Coverage
  run: npm run test:coverage
```

## 🚀 Next Steps

1. Add tests for remaining components
2. Implement E2E tests with Playwright/Cypress
3. Add visual regression testing
4. Set up performance testing
5. Configure test reporting in CI/CD

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)