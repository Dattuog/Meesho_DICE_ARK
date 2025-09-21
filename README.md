# Meesho Rebound - Working Prototype
## Smart Returns & Flash Sales Platform for Meesho

### 🚀 Next-Gen Return Experience

This is a working prototype of Meesho Rebound, demonstrating the core functionality of our smart return system with CareConnect (donation), Flash Sales, and traditional return pathways.

## 📁 Repository Structure

```
meesho-rebound-prototype/
├── frontend/          # React Web App (Meesho-style UI)
├── backend/           # Node.js API Services
├── database/          # Database schemas and seed data
└── docs/              # API documentation and setup guides  
```

## 🎯 Core Features Implemented

### ✅ Decision Engine
- Value-based return routing (₹500 threshold)
- Instant credit calculation
- NGO matching algorithm

### ✅ CareConnect Service
- NGO management system
- Donation workflow
- Impact tracking

### ✅ Re-commerce Service
- Quality grading system
- Inventory management
- Renewed product listing

### ✅ Frontend Interface
- Return flow UI (Meesho design)
- Donation interface
- Renewed products catalog
- Admin dashboard

## 🛠️ Technology Stack

### Frontend
- **Framework:** React.js + TypeScript
- **Styling:** Tailwind CSS (Meesho color scheme)
- **State Management:** Redux Toolkit
- **UI Components:** Custom Meesho-style components

### Backend
- **Runtime:** Node.js + Express
- **Language:** TypeScript
- **Database:** PostgreSQL + Redis
- **API Documentation:** Swagger/OpenAPI

### Database
- **Primary DB:** PostgreSQL (transactions, users, orders)
- **Cache:** Redis (sessions, real-time data)
- **Mock Data:** Comprehensive seed data for demo

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Git

### Setup Commands
```bash
# Clone and setup
cd project-phoenix-prototype

# Backend setup
cd backend
npm install
npm run setup-db
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm start

# Database setup (new terminal)
cd ../database
npm run seed-data
```

### Access Points
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Admin Dashboard:** http://localhost:3000/admin

## 🎮 Demo Scenarios

### Scenario 1: Low-Value Return (CareConnect)
1. Login as customer (demo@meesho.com)
2. Navigate to "My Orders"
3. Select item under ₹500
4. Choose "Return" → System offers donation
5. Accept donation → Instant credit received

### Scenario 2: High-Value Return (Renewed)
1. Select item over ₹500
2. Choose "Return" → Traditional return flow
3. Item routed to processing center
4. Quality grading and re-listing process

### Scenario 3: Admin Dashboard
1. Login as admin (admin@meesho.com)
2. View return analytics
3. Manage NGO partnerships
4. Monitor renewed inventory

## 📊 Key Metrics Dashboard
- Return cost savings
- Donation impact metrics
- Renewed product performance
- Customer satisfaction scores

## 🎨 Design System
Following Meesho's design principles:
- **Colors:** Orange (#FF6B35), Green (#4CAF50), Blue (#2196F3)
- **Typography:** Inter font family
- **Components:** Material Design inspired
- **Mobile-first:** Responsive design

## 📱 Mobile Demo
Responsive design optimized for mobile devices to match Meesho's mobile-first approach.

---

**Built for Meesho DICE Challenge 2025**  
**Team:** Meesho Rebound  
**Timeline:** 12 hours  
**Status:** Demo Ready