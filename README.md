# 🏠 SmartTrọ - AI-Powered Boarding House Management

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red?logo=nestjs)](https://nestjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com/)
[![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-white?logo=socket.io)](https://socket.io/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange?logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![VNPAY](https://img.shields.io/badge/Payment-VNPAY-005BAA)](https://vnpay.vn/)

A professional, full-stack **Smart Boarding House Management System** built with **NestJS 11** and **Next.js 15**. This project provides a robust RESTful API and a real-time dashboard for managing rooms, tenants, automated invoices, and AI-powered resident assistance.

---

## 🖼️ Screenshots

<div align="center">
  <p align="center"><b>Dashboard Quản trị & Theo dõi Doanh thu</b></p>
  <img src="file:///C:/Users/Admin/.gemini/antigravity/brain/d05cdd00-96a6-41c3-8d7f-09a744038eee/media__1775131606348.png" width="90%" alt="Dashboard Overview">
  <br/><br/>
  <p align="center"><b>Hệ thống Chat Real-time & Chăm sóc khách hàng</b></p>
  <img src="file:///C:/Users/Admin/.gemini/antigravity/brain/d05cdd00-96a6-41c3-8d7f-09a744038eee/media__1775132626940.png" width="90%" alt="Real-time Chat System">
  <br/><br/>
  <p align="center"><b>Thanh toán trực tuyến VNPAY Sandbox</b></p>
  <img src="file:///C:/Users/Admin/.gemini/antigravity/brain/d05cdd00-96a6-41c3-8d7f-09a744038eee/media__1775133229546.png" width="90%" alt="VNPAY Integration Success">
</div>

---

## ✨ Features

- **📊 Management Dashboard:** Real-time statistics, revenue tracking, and room occupancy status with **Recharts**.
- **💬 Real-time Communication:** Direct Admin-to-Tenant messaging and instant notifications via **Socket.io**.
- **💳 Automated Payments:** Online rent payment integration with **VNPAY Sandbox** (SIT context support).
- **🤖 AI Resident Copilot:** Intelligent assistance for tenants' queries using **Google Gemini AI**.
- **🛠️ Asset & Maintenance:** Comprehensive asset tracking with **Bulk creation** and image-based maintenance reporting.
- **📄 Contract & Invoices:** Digital contract records and automated monthly invoice generation with email alerts.

---

## 🏗️ Architecture

```mermaid
graph TD
    User((Tenant)) -->|React/Next.js| Frontend[Frontend - App Router]
    Admin((Manager)) -->|React/Next.js| Frontend
    Frontend <-->|Socket.io| Backend[Backend - NestJS 11]
    Frontend <-->|REST API| Backend
    Backend <-->|TypeORM| DB[(MySQL 8.0)]
    Backend -->|SDK| Gemini[Gemini AI]
    Backend -->|API| VNPAY[VNPAY Gateway]
    Backend -->|SMTP| Email[Nodemailer]
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+) & MySQL 8.0
- Google Gemini API Key & VNPAY Merchant Credentials

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/qlnt.git

# Setup Backend
cd backend && npm install
npm run start:dev

# Setup Frontend
cd ../frontend && npm install
npm run dev
```

---

## 👤 Author
Developed with ❤️ by **LE NGUYEN THANH DAT**

---
*SmartTrọ - Simplifying your boarding house management.*