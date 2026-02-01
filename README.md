# NutriPlan Backend

<div align="center">

Backend API for the NutriPlan system. Provides authentication, user/profile management, meal planning, foods, collections, pantry, analytics, and an AI chat gateway.

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3-85EA2D?style=for-the-badge&logo=swagger&logoColor=1A1A1A)

</div>

## Table of Contents

- [NutriPlan Backend](#nutriplan-backend)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [System Architecture](#system-architecture)
  - [API Overview](#api-overview)
    - [Base URL](#base-url)
    - [Swagger](#swagger)
    - [Major Route Groups](#major-route-groups)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Install](#install)
    - [Configure environment variables](#configure-environment-variables)
    - [Run in development](#run-in-development)
    - [Build and run production](#build-and-run-production)
    - [Seed data (optional)](#seed-data-optional)
  - [Environment Configuration](#environment-configuration)
  - [Scripts](#scripts)
  - [Project Structure](#project-structure)

---

## Introduction

This service is the core HTTP API for NutriPlan. It is responsible for:

- User authentication (JWT access/refresh tokens)
- User profile and health settings (nutrition targets, stats, exclusions)
- Meal planning workflows (including admin and auto-generate)
- Foods, categories, collections, pantry management
- Analytics endpoints (food/article views, admin dashboard)
- AI assistant gateway under the API (authenticated)

---

## System Architecture

- Runtime: Node.js + Express
- Language: TypeScript (ESM)
- Database: MongoDB via Mongoose
- API Documentation: Swagger (OpenAPI 3) generated from route annotations
- Auth: Bearer JWT for protected endpoints + refresh token flow

---

## API Overview

### Base URL

- Local default: `http://localhost:3000/api`

### Swagger

- Local Swagger UI: `http://localhost:3000/api-docs`

### Major Route Groups

All routes are mounted under `/api`.

- Auth: `/api/auth` (login, register, logout, refresh-token)
- Users: `/api/user` (me, avatar, nutrition targets, stats, admin)
- Meal plans: `/api/planner` (CRUD, swap, groceries, auto-generate, admin)
- Foods: `/api/foods` (list, search, CRUD)
- Categories: `/api/categories` (list, admin CRUD)
- Collections: `/api/collections` (curated, favorites, exclusions, admin)
- Articles: `/api/articles` (public + admin)
- Pantry: `/api/pantry` (CRUD + consume + suggestions)
- Analytics: `/api/analytics` (views + admin dashboard)
- AI: `/api/ai/chat` (authenticated)

---

## Getting Started

### Prerequisites

- Node.js 22.x
- MongoDB (local instance or Atlas)

### Install

```bash
npm ci
```

### Configure environment variables

Create a `.env` file in the project root and set required variables (see the table below).

### Run in development

```bash
npm run dev
```

### Build and run production

```bash
npm run build
npm run start
```

### Seed data (optional)

```bash
npm run seed:categories
npm run seed:articles
npm run seed:curated
```

---

## Environment Configuration

The app loads environment variables in [src/configs/secrets.ts](src/configs/secrets.ts).

| Variable Key | Required | Example | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `3000` | Server port. Defaults to `3000`. |
| `MONGO_URI` | Yes | `mongodb://localhost:27017/nutriplan` | MongoDB connection string. |
| `JWT_SECRET` | Recommended | `your_jwt_secret` | JWT signing secret (legacy/compat). |
| `ACCESS_TOKEN_SECRET` | Yes | `your_access_secret` | Secret for access tokens. |
| `REFRESH_TOKEN_SECRET` | Yes | `your_refresh_secret` | Secret for refresh tokens. |
| `SALT_ROUNDS` | Optional | `10` | bcrypt salt rounds. Defaults to `10`. |
| `ALLOWED_ORIGINS` | Recommended | `http://localhost:5173,https://your-fe.app` | CORS allowlist (comma-separated). |
| `GITHUB_TOKEN` | Optional | `ghp_...` | Token for GitHub Models/Azure inference if used by AI. |
| `GITHUB_AI_ENDPOINT` | Optional | `https://models.github.ai/inference` | AI inference endpoint. |
| `GITHUB_AI_MODEL` | Optional | `openai/gpt-4.1` | AI model identifier. |

---

## Scripts

Common commands (see `package.json` for the full list):

- `npm run dev`: Run with hot reload (tsx + nodemon)
- `npm run build`: Compile TypeScript to `dist/`
- `npm run start`: Start compiled server from `dist/`
- `npm run format`: Prettier format
- `npm run seed:articles`: Seed article data
- `npm run seed:categories`: Seed categories
- `npm run seed:curated`: Seed curated collections
- `npm run seed:all`: Seed common datasets

---

## Project Structure

```text
src/
├── app.ts                  # Express app entry
├── configs/                # DB, env/secrets, swagger
├── constants/              # Routes, status codes, messages
├── controllers/            # Request handlers
├── middlewares/            # Auth, validation, pagination, etc.
├── models/                 # Mongoose models
├── repositories/           # Data access layer
├── routes/                 # Express routers (Swagger-annotated)
├── schemas/                # Zod schemas / DTOs
├── scripts/                # Seed scripts
├── services/               # External integrations / domain services
├── types/                  # Shared TypeScript types
├── utils/                  # Helpers
└── validations/            # Request validation rules
```