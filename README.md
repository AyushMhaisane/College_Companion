# College Companion 🎓

A comprehensive student management and collaboration platform built with modern technologies. College Companion helps students manage their attendance, grades, schedule, and collaborate with peers through real-time chat and study groups.

## 🌟 Features

- **Attendance Management** - Track and manage class attendance with AI-powered insights
- **User Profiles** - Personalized student profiles with academic information
- **Semester Planning** - Organize and track courses per semester
- **Study Arena** - Real-time chat and collaboration with study groups
- **Survival Plan** - Plan study sessions and manage academic workload
- **Profile Module** - Comprehensive student profile management
- **Room System** - Create and manage virtual study rooms
- **Firebase Authentication** - Secure user authentication and authorization
- **Multi-Backend Support** - Main backend, question generator backend, and additional server

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool with HMR
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Recharts** - Data visualization
- **Socket.io Client** - Real-time communication
- **Firebase** - Authentication and backend services

### Backend
- **Node.js & Express** - Main API server
- **Firebase Admin SDK** - Authentication and database
- **Socket.io** - Real-time communication
- Multiple backend services for specialized functions

## 📦 Project Structure

```
College_Companion/
├── src/                           # Frontend source code
│   ├── components/               # Reusable React components
│   ├── pages/                    # Page components
│   ├── contexts/                 # React context for state management
│   ├── services/                 # API and service calls
│   ├── firebase/                 # Firebase configuration
│   ├── hooks/                    # Custom React hooks
│   ├── layout/                   # Layout components
│   └── styles/                   # CSS and styling
├── backend/                       # Main backend API
├── backend-question-generator/   # Question generator service
├── server/                        # Additional server
└── public/                        # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd College_Companion
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Configure Firebase**
   - Set up your Firebase project
   - Add credentials to `.env` file
   - See `FIREBASE_SETUP_COMPLETE.md` for detailed instructions

### Running the Project

**Start all services:**
```bash
./start-all.ps1  # Windows PowerShell
```

**Or start individually:**

Frontend:
```bash
npm run dev
```

Backend:
```bash
cd backend && npm start
```

Question Generator:
```bash
cd backend-question-generator && npm start
```

## 📚 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Complete setup instructions
- [Firebase Setup](./FIREBASE_SETUP_COMPLETE.md) - Firebase configuration
- [Auth API Documentation](./AUTH_API_DOCUMENTATION.md) - Authentication API
- [Attendance Advisor API](./ATTENDANCE_ADVISOR_API_GUIDE.md) - Attendance features
- [Deployment Guide](./VERCEL_DEPLOYMENT_COMPLETE.md) - Production deployment
- [Quick Start](./QUICK_START.md) - Quick reference guide

## 🔧 Development

### Available Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

**Backend:**
```bash
npm start        # Start server
npm run dev      # Start with nodemon
npm test         # Run tests
```

## 🤝 Contributors

- **Yugendra N** (@Yugenjr) - Lead Developer
- Your Friend Name (@friend-username)

We welcome contributions! Feel free to submit pull requests and issues.

## 📝 Development Configuration

### React + TypeScript + Vite Setup

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Expanding the ESLint Configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 📄 License

This project is open source and available under the MIT License.

## 🙋 Support

For questions or support, please open an issue in the repository or contact the maintainers.
