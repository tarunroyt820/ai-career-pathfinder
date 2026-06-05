# 🚀 AI Career Pathfinder

An AI-powered career development ecosystem that helps users discover career paths, analyze resumes, identify skill gaps, exchange skills, and build personalized learning roadmaps using modern Large Language Models (LLMs).

---

## 📖 Overview

AI Career Pathfinder is a full-stack web application designed to bridge the gap between education, skills, and career opportunities.

The platform leverages AI providers such as Groq, Hugging Face, NVIDIA, and OpenRouter to provide intelligent career recommendations, resume analysis, personalized learning roadmaps, and skill-gap detection.

The project also includes mentorship features, learning requests, notifications, skill exchange, and career progress tracking.

---

## ✨ Features

### 🤖 AI Career Guidance
- Personalized career recommendations
- Career roadmap generation
- Skill-gap analysis
- Learning path suggestions

### 📄 Resume Intelligence
- PDF Resume Analysis
- DOCX Resume Analysis
- Resume improvement recommendations
- Career-fit assessment

### 🎯 Skill Development
- Personalized learning recommendations
- Skill exchange system
- Learning request management

### 👥 Community Features
- User profiles
- Messaging system
- Mentor sessions
- Notifications

### 📊 Analytics
- Career progress tracking
- Learning statistics
- User activity insights

### 🔐 Security
- JWT Authentication
- Password Hashing (bcrypt)
- Rate Limiting
- Helmet Security
- XSS Protection

---

## 🏗 System Architecture

```text
Frontend (React + TypeScript)
            │
            ▼
Backend (Node.js + Express)
            │
 ┌──────────┼──────────┐
 ▼          ▼          ▼

MongoDB    Redis     AI Layer
 Atlas    BullMQ

            │
            ▼

 ┌─────────────────────┐
 │ AI Provider Layer   │
 ├─────────────────────┤
 │ Groq                │
 │ Hugging Face        │
 │ NVIDIA              │
 │ OpenRouter          │
 └─────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Hook Form
- Framer Motion
- Radix UI

### Backend
- Node.js
- Express.js
- JWT Authentication

### Database
- MongoDB Atlas
- Mongoose

### AI Providers
- Groq
- Hugging Face
- NVIDIA
- OpenRouter

### Queue Processing
- Redis
- BullMQ

### Security
- Helmet
- Rate Limiting
- bcrypt
- HPP
- XSS Protection

### Testing
- Vitest
- Playwright
- React Testing Library

---

## 📂 Project Structure

```text
ai-career-pathfinder
│
├── src/
├── public/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── jobs/
│   ├── queues/
│   └── scripts/
│
├── docs/
└── README.md
```

---

## ⚙️ Prerequisites

Before running the project, ensure you have:

- Node.js (v18 or later)
- npm
- MongoDB Atlas Account
- Git

Optional:
- Redis
- Groq API Key
- Hugging Face API Key
- OpenRouter API Key
- NVIDIA API Key

---

## 🔑 Environment Variables

Create a file named:

```bash
backend/.env
```

Copy values from:

```bash
backend/.env.example
```

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

JWT_REFRESH_SECRET=your_refresh_secret

AI_PROVIDER=groq

GROQ_API_KEY=your_api_key
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/ai-career-pathfinder.git
```

### Install Frontend Dependencies

```bash
npm install
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

---

## ▶ Running the Application

### Run Frontend + Backend

```bash
npm run dev:all
```

### Run Frontend Only

```bash
npm run dev
```

### Run Backend Only

```bash
cd backend
npm run dev
```

---

## 🧪 Testing

Run Unit Tests:

```bash
npm run test:unit
```

Run End-to-End Tests:

```bash
npm run test:e2e
```

Run All Tests:

```bash
npm run test
```

---

## 📋 Available Scripts

### Root Scripts

```bash
npm run dev
npm run dev:all
npm run build
npm run preview
npm run lint
npm run test
```

### Backend Scripts

```bash
npm run diagnostics
npm run admin:create
npm run admin:promote
npm run seed:course-categories
npm run seed:courses
```

---

## 🔄 Background Jobs

The platform automatically performs:

- Request Expiry Processing
- Career Milestone Reminders
- Learning Reminders
- Quality Score Updates
- AI Queue Processing

---

## 🎯 Future Improvements

- AI Mock Interviews
- Real-time Chat
- LinkedIn Profile Analysis
- Advanced Recommendation Engine
- Mobile Application

---

## 👨‍💻 Author

Tarun Roy

Bachelor of Computer Applications (BCA)

---
## 📜 License

This project is licensed under the MIT License.
