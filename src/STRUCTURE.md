# Frontend Folder Structure

This frontend follows a feature-based architecture for better organization and maintainability.

## 📁 Structure Overview

```
src/
├── features/          # Feature modules (pages organized by feature)
│   ├── auth/         # Authentication (Login, Register)
│   ├── dashboard/    # Dashboard page
│   ├── accounts/     # Accounts management
│   ├── transactions/ # Transactions page
│   ├── budget/       # Budget page
│   ├── recurring/    # Recurring payments
│   ├── stats/        # Statistics page
│   └── settings/     # Settings page
│
├── shared/           # Shared/reusable code
│   ├── components/   # Reusable UI components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── BottomBar.tsx
│   │   ├── ChatArea.tsx
│   │   ├── Toast.tsx
│   │   └── ...
│   ├── hooks/        # Custom React hooks (future)
│   └── utils/        # Utility functions (future)
│
├── theme/            # Theme system
│   ├── ThemeContext.tsx  # Theme context provider
│   ├── theme.ts          # Theme utilities
│   └── index.ts          # Theme exports
│
└── api/              # API configuration
    └── axios.js      # Axios instance
```

## 🎯 Import Patterns

### Importing Pages (Features)
```tsx
import Dashboard from './features/dashboard'
import { Login } from './features/auth'
import AccountsPage from './features/accounts'
```

### Importing Shared Components
```tsx
import { Sidebar, Header, Toast } from './shared/components'
```

### Importing Theme
```tsx
import { useTheme, ThemeProvider } from './theme'
```

## 📝 Guidelines

### When to add to `features/`
- Full page components
- Feature-specific logic and state
- Each feature gets its own folder

### When to add to `shared/components/`
- Components used across multiple features
- Generic UI components (buttons, modals, etc.)
- Layout components (Sidebar, Header)

### When to add to `theme/`
- Theme-related context and providers
- Theme utilities and helpers
- Color schemes and styling constants

### When to add to `shared/hooks/`
- Custom React hooks used across features
- Example: useDebounce, useLocalStorage, useFetch

### When to add to `shared/utils/`
- Pure utility functions
- Helpers for formatting, validation, etc.
- Business logic utilities

## 🔄 Benefits of This Structure

1. **Scalability**: Easy to add new features without cluttering
2. **Maintainability**: Clear separation of concerns
3. **Reusability**: Shared components in one place
4. **Team Collaboration**: Developers can work on different features independently
5. **Code Discovery**: Easy to find where code lives

## 📦 Index Files

Each folder has an `index.ts` that exports the main components, making imports cleaner:

```tsx
// Instead of:
import Dashboard from './features/dashboard/Dashboard'

// You can do:
import Dashboard from './features/dashboard'
```
