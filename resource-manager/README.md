# Resource Manager

A simple coursework-ready web app for organizing study files and helpful links. Built with **Node.js, Express, EJS, Bootstrap, and SQLite**.

## Features

- User registration/login with hashed passwords and session auth
- Domain (category) CRUD with safety checks before delete
- Resource management for files (uploads) and links
- Search + filters by domain, type, purpose, and favorites
- Dashboard with quick stats, recent items, and favorite list
- Sample seed data for instant demo

## Getting Started

```bash
npm install
cp .env.example .env   # edit if needed
npm run seed           # creates sample user/data + uploads/SampleNotes.txt
npm run dev            # or npm start
```

Then open http://localhost:3000.

### Sample Credentials

- Email: `student@example.com`
- Password: `password123`

## Configuration

- `DATABASE_PATH` (default `./db/resource-manager.db`)
- `SESSION_SECRET` (used by express-session)

Uploads live in `uploads/` and are served statically at `/uploads`.

Happy studying! 🎓

