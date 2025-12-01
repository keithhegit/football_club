<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Football Club Manager - FM2023 MVP

A Football Manager 2023-inspired web application MVP demo. This project simulates a professional football club management experience.

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **AI Integration**: Google Gemini AI
- **Hosting**: Cloudflare Pages
- **Database** (Future): Cloudflare D1
- **Storage** (Future): Cloudflare R2

## 📦 Local Development

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 🌐 Deploy to Cloudflare Pages

### Step 1: Connect Repository

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click **Create Application** → **Pages** → **Connect to Git**
4. Select your `football_club` repository
5. Click **Begin Setup**

### Step 2: Configure Build Settings

Use the following build configuration:

- **Production branch**: `main`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave blank)

### Step 3: Environment Variables

Add the following environment variables in the Cloudflare Pages dashboard:

| Variable Name | Description |
|--------------|-------------|
| `VITE_GEMINI_API_KEY` | Your Google Gemini API key |
| `NODE_VERSION` | `18` (or higher) |

### Step 4: Deploy

Click **Save and Deploy**. Your site will be live in a few minutes!

## 🔧 Future Enhancements with Cloudflare

### D1 Database Setup

To add database functionality:

1. Create a D1 database:
```bash
npx wrangler d1 create football-club-db
```

2. Update `wrangler.toml` with your database ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "football-club-db"
database_id = "your-database-id-here"
```

3. Bind the database in Cloudflare Pages settings

### R2 Storage Setup

To add file storage (e.g., player photos, club logos):

1. Create an R2 bucket:
```bash
npx wrangler r2 bucket create football-club-assets
```

2. Update `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "football-club-assets"
```

3. Bind the bucket in Cloudflare Pages settings

### Cloudflare Workers

For API endpoints and server-side logic, you can use Cloudflare Workers:

1. Create a `functions` directory in your project root
2. Add worker functions as needed (e.g., `functions/api/players.ts`)
3. Deploy automatically with Cloudflare Pages

## 📝 Project Structure

```
FM2023/
├── components/       # React components
├── views/           # Page views
├── services/        # API services
├── utils/           # Utility functions
├── types.ts         # TypeScript type definitions
├── App.tsx          # Main application component
├── index.html       # HTML entry point
└── wrangler.toml    # Cloudflare configuration
```

## 🎮 Features

- AI-powered football management simulation
- Interactive club management interface
- Player and team statistics
- Strategic decision making

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

This is a private MVP demo. For questions or suggestions, please contact the repository owner.
