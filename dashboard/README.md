# VibCode Dashboard

A business dashboard for monitoring VibCode app users, their nutrition data, and health metrics.

## Features

- 📊 **Overview Stats** - Total users, profiles, food entries, nutrient scores
- 👥 **Users Table** - View all users with email, age, height, weight, goals, and latest nutrient scores
- 📈 **Nutrient Score History** - Track user's nutrient score trends over 30 days
- 🎯 **User Goals** - See fitness and nutrition goals for each user
- 💪 **Body Metrics** - Display height, weight, sex, and activity level
- 🍽️ **Food Tracking** - Monitor food entries per user

## Setup

### Install Dependencies

```bash
cd dashboard
npm install
```

### Start Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

**Important:** Make sure the backend is running on `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## Environment

The dashboard connects to the backend API at:
- Development: `http://localhost:3000/api`
- Production: Configure in `vite.config.ts`

## API Endpoints Used

- `GET /api/dashboard/users` - Get all users with aggregated data
- `GET /api/dashboard/users/:userId` - Get detailed user information
- `GET /api/dashboard/stats` - Get business overview statistics
- `GET /api/nutrient-score/history/:userId` - Get user's nutrient score history

## Technologies

- React 18
- TypeScript
- Vite
- TailwindCSS
- Axios
- Recharts (for charts)

## Project Structure

```
src/
├── components/
│   ├── Stats.tsx           # Overview statistics cards
│   ├── UsersTable.tsx      # Main users table
│   └── UserDetailModal.tsx # Detailed user view with charts
├── App.tsx                 # Main app component
├── api.ts                  # API client
├── index.css              # Tailwind styles
└── main.tsx               # Entry point
```
