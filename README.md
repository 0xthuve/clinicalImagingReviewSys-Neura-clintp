# BREA-CAN - Breast Cancer Analysis System

A Next.js application for breast cancer image analysis with explainable AI, featuring radiologist and consultant review capabilities.

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Deployment (Docker)
```bash
docker-compose up -d
```

## 📋 Features

- **Medical Image Analysis**: Upload and analyze breast cancer images
- **Expert Review System**: Radiologist and consultant review workflow  
- **Admin Dashboard**: Patient management and review tracking
- **Explainable AI**: Multiple visualization techniques (GradCAM, SHAP, etc.)
- **Docker Deployment**: Containerized for easy deployment

## 🔧 Tech Stack

- **Frontend**: Next.js 15.3.3, React, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Database**: MongoDB 6.0
- **Deployment**: Docker, GitHub Actions, AWS EC2

## 🏗️ Project Structure

```
app/
├── api/              # API routes
├── admin/           # Admin dashboard
├── components/      # React components
├── can-ml/         # ML model endpoints
└── lib/            # Database connection
```

## 🐳 Deployment

The application automatically deploys via GitHub Actions when pushing to the main branch.

**Expert User Credentials** (auto-seeded):
- Consultants: Dr. Anjali Kumaran, Dr. Ramesh Perera, Dr. Malathi Sivarajah
- Radiologists: Dr. Nilani Fernando, Dr. K. Tharshan, Dr. Mohamed Niyas  
- Admin: SenzuraAdmin

## 🔍 Health Check

Monitor deployment health:
```bash
curl http://your-server:3000/api/health
```

## 📱 Access Points

- **Main App**: `http://your-server:3000`
- **Admin Dashboard**: `http://your-server:3000/admin`
- **Login**: `http://your-server:3000/login`
