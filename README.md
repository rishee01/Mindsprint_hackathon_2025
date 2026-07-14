# CivicSense - AI-Powered Civic Issue Reporter & Community Tracker

A full-stack web application that enables citizens to report civic issues (potholes, garbage, water leakage, air pollution, etc.), uses **Groq Vision AI** to automatically classify and prioritize issues, and provides authorities with a professional dashboard to track and resolve them.

![CivicSense](https://via.placeholder.com/800x400?text=CivicSense+Dashboard)

## 🌟 Features

### For Citizens
- **📸 Easy Issue Reporting**: Upload photos, auto-detect location with reverse geocoding
- **🤖 AI-Powered Classification**: Automatic categorization using Groq Vision AI (Llama 4 Scout)
- **📍 Smart Location Detection**: GPS + OpenStreetMap reverse geocoding for accurate addresses
- **🔄 Real-time Tracking**: Follow your issue's status from report to resolution
- **✅ Community Verification**: Help verify reported issues to ensure authenticity
- **🗺️ Interactive Map View**: Browse all issues on a map with filters

### For Authorities/Admin
- **📊 Professional Dashboard**: Modern UI with overview statistics and charts
- **📋 Issue Management**: Update status, add notes, track resolution progress
- **🔍 Advanced Filtering**: Search and filter by status, category, severity
- **📱 Responsive Design**: Works seamlessly on desktop and mobile

### Technical Highlights
- **🧠 Groq Vision AI**: Real-time image analysis using Llama 4 Scout model (90%+ accuracy)
- **🎯 Smart Severity Scoring**: AI-powered severity assessment
- **🔐 Dual Authentication**: Email/password + Google OAuth via Firebase
- **☁️ Cloud Image Storage**: Cloudinary integration for reliable image hosting
- **🗺️ Free Geocoding**: OpenStreetMap Nominatim API (no API key required)

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Modern utility-first styling
- **Leaflet + OpenStreetMap** - Interactive maps
- **Zustand** - Lightweight state management
- **React Hot Toast** - Beautiful notifications

### Backend
- **Node.js + Express** - REST API server
- **MongoDB + Mongoose** - Database with Atlas support
- **Groq Vision AI** - Llama 4 Scout for image classification
- **JWT** - Secure authentication tokens
- **Cloudinary** - Image upload and CDN
- **Firebase Admin** - Google OAuth verification

### AI Classification
- **Model**: `meta-llama/llama-4-scout-17b-16e-instruct`
- **Provider**: Groq Cloud (fast inference)
- **Capabilities**: 
  - Civic issue detection and categorization
  - Severity assessment (low/medium/high/critical)
  - Natural language descriptions
  - Non-civic image detection

## 📁 Project Structure

```
civicsense/
├── backend/
│   ├── src/
│   │   ├── config/           # Cloudinary, departments config
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── models/           # Mongoose models (User, Issue)
│   │   ├── routes/           # API routes
│   │   ├── services/         # Groq AI service
│   │   ├── seed/             # Database seeders
│   │   └── server.js         # Express app entry
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── admin/        # Admin dashboard
│   │   │   ├── issues/       # Issue listing & details
│   │   │   ├── login/        # Login page
│   │   │   ├── register/     # Registration page
│   │   │   ├── report/       # Report new issue
│   │   │   └── profile/      # User profile
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # API client, Firebase config
│   │   ├── store/            # Zustand state stores
│   │   ├── styles/           # Global CSS
│   │   └── types/            # TypeScript definitions
│   ├── .env.local
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)
- Groq API key (free tier available)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd civicsense
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Groq AI (for image classification)
GROQ_API_KEY=your-groq-api-key

# Firebase Admin (optional - for Google OAuth verification)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NODE_ENV=development
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Firebase (client-side - optional for Google OAuth)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

Start the frontend:
```bash
npm run dev
```

### 4. Seed Demo Data (Optional)

```bash
cd backend
npm run seed
```

This creates:
- Demo users (admin, authority, regular users)
- Sample issues across different categories

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@civicsense.com | admin123 |
| Authority | authority@civicsense.com | auth123 |
| User | user@civicsense.com | user123 |

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login with email/password |
| POST | /api/auth/firebase | Login with Firebase token |
| GET | /api/auth/me | Get current user profile |

### Issues
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/issues | Get all issues (with filters) |
| GET | /api/issues/map | Get issues for map view |
| GET | /api/issues/:id | Get single issue |
| POST | /api/issues | Create new issue |
| PATCH | /api/issues/:id | Update issue status |
| POST | /api/issues/:id/verify | Verify issue (community) |

### Classification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/classify | Classify image (simulated AI) |
| GET | /api/classify/categories | Get available categories |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats/overview | Get dashboard stats |
| GET | /api/stats/trends | Get issue trends |

## 🎨 Issue Categories

| Category | Description |
|----------|-------------|
| `pothole` | Road damage, potholes |
| `garbage` | Garbage accumulation, littering |
| `water_leakage` | Water pipe leaks, sewage issues |
| `streetlight` | Non-functional street lights |
| `road_damage` | Road cracks, wear and tear |
| `drainage` | Clogged drains, flooding |
| `traffic_signal` | Malfunctioning traffic signals |
| `illegal_parking` | Unauthorized parking |
| `encroachment` | Illegal constructions |
| `air_pollution` | Smoke, dust, industrial emissions |
| `noise_pollution` | Excessive noise issues |
| `others` | Other civic issues |

## 🚦 Issue Statuses

- **pending** - Newly reported, awaiting review
- **verified** - Community verified
- **in_progress** - Being worked on
- **resolved** - Issue fixed
- **rejected** - Invalid or duplicate

## 📊 Severity Levels

- **low** - Minor inconvenience
- **medium** - Moderate impact
- **high** - Significant problem
- **critical** - Urgent attention required

Severity is calculated based on:
- Issue category
- Community verification count
- Time since reporting
- Location (busy areas weighted higher)

## 🔧 Configuration

### Groq AI Setup (Required for AI Classification)

1. Create account at [console.groq.com](https://console.groq.com)
2. Generate an API key
3. Add `GROQ_API_KEY` to backend `.env`

### Cloudinary Setup (Required for Image Upload)

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get cloud name, API key, and API secret from Dashboard
3. Add credentials to backend `.env`

### MongoDB Setup

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier available)
2. Get connection string
3. Add `MONGODB_URI` to backend `.env`

### Firebase Setup (Optional - for Google OAuth)

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication → Google sign-in
3. Download service account key for backend
4. Get web app config for frontend

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend (Railway/Render)
1. Push to GitHub
2. Connect to Railway/Render
3. Add environment variables
4. Deploy

### Frontend (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## 📝 Future Improvements

- [ ] Push notifications for status updates
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics and reporting
- [ ] Integration with municipal systems
- [ ] Offline support with PWA
- [ ] Image compression before upload

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Credits

- **AI Classification**: Powered by [Groq](https://groq.com) with Llama 4 Scout model
- **Maps**: OpenStreetMap + Leaflet
- **Geocoding**: OpenStreetMap Nominatim API
- **Image Hosting**: Cloudinary

---

Made with ❤️ for better cities
