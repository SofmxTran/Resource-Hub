# Resource Manager – Public Resource Hub

A multi-user hub where students upload files, add links, write study guides, and share them with the community. Public resources go through an approval workflow, can be commented on or rated, and earn trust votes from other learners. Stack: **Node.js**, **Express**, **EJS**, **Bootstrap**, and **SQLite** via `better-sqlite3`.

## 🎨 Neon Dark Theme UI

The application features a modern **dark neon theme** with purple and cyan accents, designed for a smooth and visually appealing user experience:

- **Color Scheme**: Dark background (#050816) with neon purple (#a855f7) and cyan (#22d3ee) accents
- **Animated Background**: Smooth floating gradient shapes with CSS animations
- **Glassmorphism Effects**: Cards with semi-transparent backgrounds and backdrop blur
- **Smooth Transitions**: Hover effects, animations, and interactive elements throughout
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices
- **Animation Libraries**: 
  - **AOS (Animate On Scroll)**: Scroll-triggered animations for content sections
  - **Animate.css**: Entrance animations for hero sections
  - **Font Awesome**: Icon library for consistent iconography

### Frontend Technologies

- **CSS Variables**: Theme colors and styles managed via CSS custom properties
- **Google Fonts**: Poppins and Inter fonts for modern typography
- **Bootstrap 5.3**: Grid system and responsive utilities (minimal usage)
- **Custom CSS**: Main theme styles in `public/css/main.css`
- **Client-side JS**: Smooth scrolling, scroll-to-top button, form enhancements in `public/js/main.js`

### Key UI Features

- **Hero Section**: Eye-catching landing page with gradient text and call-to-action buttons
- **Resource Cards**: Glassmorphism cards with hover effects and AOS animations
- **Navigation**: Sticky navbar with neon glow effects and smooth underline animations
- **Forms**: Glass-like panels with neon borders and enhanced visual feedback
- **Admin Dashboard**: Color-coded cards with icons for quick stats overview
- **Comments Section**: Styled comment cards with alternating visual hierarchy

**Note**: The backend logic, routes, controllers, and database schema remain unchanged. Only the frontend (EJS templates, CSS, and client-side JavaScript) has been enhanced.

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

Uploaded assets live in `/uploads`:
- Resource files and images: `/uploads/`
- User avatars: `/uploads/avatars/`

Keep these folders writable when deploying. If you change `DATABASE_PATH`, ensure the parent directory exists.

**Note**: Avatar files in `/uploads/avatars/` should be added to `.gitignore` if you're using git (they are user-generated content).

### Seeded users & demo content

`npm run seed` will:

- Ensure the SQLite DB and uploads folder exist.
- Create **student@example.com / password123** (regular user) with display name "Demo User" and bio.
- Create **admin@example.com / Admin123** (site admin) with display name "Admin" and bio.
- Insert sample domains plus two approved public resources with guide text.

## Admin capabilities

- Visit `/admin` (link appears in the navbar for admins) to see total users, resources, and the pending queue.
- Approve or reject public submissions via `/admin/resources` or the dashboard quick actions.
- Approved + public resources immediately surface on the home feed and public profile pages.

## User Profiles & Leaderboard

### Enhanced User Profiles

Users can now customize their public profiles with:

- **Display Name**: A public nickname that appears instead of username (optional).
- **Avatar**: Upload a profile picture (JPG, PNG, or WebP, max 2MB). Stored in `/uploads/avatars/`.
- **Bio**: A short description about yourself (max 500 characters).
- **Website**: Link to your personal website, portfolio, or GitHub profile.

**Profile Settings**: Visit `/settings/profile` (requires login) to edit your profile information and upload an avatar.

### Profile Pages

- **My Profile** (`/profile`): View your own profile with detailed stats including:
  - Total resources, public/private breakdown
  - Trust score sum
  - Comments received and given
  - List of all your resources

- **Public Profile** (`/u/:username`): View any user's public profile showing:
  - Avatar and display name
  - Bio and website link
  - Public resources only
  - Community stats

### Leaderboard

Visit `/leaderboard` to see the top contributors ranked by:

- **Ranking Score** = (Public Resources × 3) + (Total Resources × 1) + (Trust Score × 2)

The leaderboard displays:
- User rank (top 3 get special highlighting with crown/medal icons)
- Avatar and display name
- Total resources, public resources, trust score, and comment count
- Links to each user's public profile

Top 20 users are shown by default, sorted by their ranking score.

## Feature tour

1. **Normal user flow**
   1. Register or log in.
   2. Customize your profile at `/settings/profile` (add avatar, display name, bio).
   3. Create a resource (optional file + thumbnail + guide text).
   4. If marked public, it becomes `PENDING` until an admin approves it; private items stay `APPROVED`.
   5. Share the `/resources/:id` link, collect comments/ratings, and encourage "Trust" votes.
2. **Commenting & ratings**
   - Any logged-in user can leave feedback (with optional 1–5 rating).
   - Comment authors or admins may delete feedback.
   - Comments now show user avatars and display names for a more social experience.
3. **Trust votes**
   - Each user can upvote a resource once (owners cannot vote for themselves).
   - The aggregated trust score appears on resource cards, profile tables, and the detail page.
4. **User profiles**
   - Edit your profile at `/settings/profile` to add avatar, display name, bio, and website.
   - View your stats and all resources on `/profile`.
   - Check the leaderboard at `/leaderboard` to see top contributors.

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

### Quick Deploy

1. Push the repo to GitHub.
2. In Render, create a new **Web Service** connected to that repo.
3. Configure:
   - Build command: `npm install`
   - Start command: `npm start`
4. Environment variables:
   - `SESSION_SECRET` – long random string (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   - `DATABASE_PATH` – e.g. `/opt/render/project/src/data/resource-manager.db` (use persistent disk).
   - `NODE_ENV` – `production`.
5. Add Persistent Disk in Render Settings:
   - Name: `data`
   - Mount Path: `/opt/render/project/src/data`
   - Size: 1GB or more
6. Deploy. Render sets `PORT`, which the app already honors (`process.env.PORT || 3000`).

### Deploy với Database hiện tại

**QUAN TRỌNG**: Nếu bạn muốn giữ nguyên database và tài khoản admin hiện tại:

1. **Backup database trước khi deploy:**
   ```bash
   npm run backup-db
   ```

2. **Upload database backup lên Render persistent disk** sau khi deploy lần đầu (xem `DEPLOY.md` để biết chi tiết).

3. **Tạo thư mục uploads trên persistent disk:**
   ```bash
   mkdir -p /opt/render/project/src/data/uploads/avatars
   ```

Xem file **`DEPLOY.md`** để có hướng dẫn chi tiết về cách deploy và giữ nguyên database.

Railway/Heroku or any Node-friendly platform follow the same pattern: install dependencies and run `npm start` with the same env vars.

---

Happy sharing! Let me know if you’d like deployment templates or Dockerfiles added. 
