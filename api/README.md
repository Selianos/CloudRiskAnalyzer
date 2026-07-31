# CloudRiskAnalyzer Public API

This directory contains the Express.js Public API backend that serves the frontend application. It handles user authentication, cloud connections, and scan jobs.

## Overview

The API is built using Node.js and Express, with Prisma as the ORM to interact with the PostgreSQL database. Authentication is proxied to the GoTrue service.

## Endpoints

All public API endpoints are prefixed with `/api`.

### Authentication Endpoints

These endpoints interact directly with the GoTrue service to manage user accounts.

- `POST /api/auth/register`: Create a new user account.
  - Body: `{ "email": "user@example.com", "password": "Password123", "fullname": "John Doe" }`
- `POST /api/auth/login`: Authenticate a user and return a session token.
  - Body: `{ "email": "user@example.com", "password": "Password123" }`
- `POST /api/auth/logout`: End the user's session (requires `Authorization: Bearer <token>` header).

