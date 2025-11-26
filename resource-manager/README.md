# Resource Manager – Public Resource Hub

A multi-user hub where students upload files, add links, write study guides, and share them with the community. Public resources go through an approval workflow, can be commented on or rated, and earn trust votes from other learners. Stack: **Node.js**, **Express**, **EJS**, **Bootstrap**, and **SQLite** via `better-sqlite3`.

## Highlights

- Session-based auth with unique usernames, `/profile`, and public `/u/:username` pages.
- Admin layer with pending-resource queue, approve/reject actions, and dashboard stats.
- Resources support file uploads, optional thumbnail image, purpose tags, rich guide text, and visibility status (`PENDING / APPROVED / REJECTED`).
- Public feed, search, and filtering only show `APPROVED` resources; each card links to a full detail page.
- Comment + rating system (1–5 stars) plus a “trust” upvote that each user can award once.
- Private resources stay visible to their owners immediately; public ones require admin approval before appearing on the home page.

## Local Development

```bash
cd resource-manager
npm install
cp .env.example .env      # or copy manually on Windows
# edit .env with your values
npm run seed              # optional: inserts sample users/data
npm run dev               # auto-restart with nodemon (or npm start)
```

Then open <http://localhost:3000>.

### Environment variables

| Key | Description |
| --- | --- |
| `SESSION_SECRET` | Required. Random string for express-session. |
| `DATABASE_PATH` | Optional. Defaults to `./db/resource-manager.db`. |
| `PORT` | Optional. Defaults to `3000`. |

Uploaded assets live in `/uploads`; keep the folder writable when deploying. If you change `DATABASE_PATH`, ensure the parent directory exists.

### Seeded users & demo content

`npm run seed` will:

- Ensure the SQLite DB and uploads folder exist.
- Create **student@example.com / password123** (regular user).
- Create **admin@example.com / Admin123** (site admin).
- Insert sample domains plus two approved public resources with guide text.

## Admin capabilities

- Visit `/admin` (link appears in the navbar for admins) to see total users, resources, and the pending queue.
- Approve or reject public submissions via `/admin/resources` or the dashboard quick actions.
- Approved + public resources immediately surface on the home feed and public profile pages.

## Feature tour

1. **Normal user flow**
   1. Register or log in.
   2. Create a resource (optional file + thumbnail + guide text).
   3. If marked public, it becomes `PENDING` until an admin approves it; private items stay `APPROVED`.
   4. Share the `/resources/:id` link, collect comments/ratings, and encourage “Trust” votes.
2. **Commenting & ratings**
   - Any logged-in user can leave feedback (with optional 1–5 rating).
   - Comment authors or admins may delete feedback.
3. **Trust votes**
   - Each user can upvote a resource once (owners cannot vote for themselves).
   - The aggregated trust score appears on resource cards, profile tables, and the detail page.

## Git & GitHub quick start

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## Deploying (Render example)

1. Push the repo to GitHub.
2. In Render, create a new **Web Service** connected to that repo.
3. Configure:
   - Build command: `npm install`
   - Start command: `npm start`
4. Environment variables:
   - `SESSION_SECRET` – long random string.
   - `DATABASE_PATH` – e.g. `./data/resource-manager.db`.
   - `NODE_ENV` – `production`.
5. Deploy. Render sets `PORT`, which the app already honors (`process.env.PORT || 3000`).

Railway/Heroku or any Node-friendly platform follow the same pattern: install dependencies and run `npm start` with the same env vars.

---

Happy sharing! Let me know if you’d like deployment templates or Dockerfiles added. 
