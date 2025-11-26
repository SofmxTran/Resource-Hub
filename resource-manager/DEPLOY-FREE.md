# Hướng dẫn Deploy lên Render FREE Plan (Không có Persistent Disk)

Render free plan không có persistent disk, nên database và uploads sẽ bị mất khi service restart. Hướng dẫn này cung cấp các giải pháp để giữ nguyên database và tài khoản admin.

## ⚠️ Lưu ý quan trọng

- **Render Free Plan**: Không có persistent disk, database sẽ bị mất khi service restart/redeploy
- **Giải pháp**: Sử dụng Render PostgreSQL (free tier) hoặc backup/restore database mỗi lần deploy

## ⭐ Giải pháp được khuyến nghị: Backup/Restore tự động

**Xem phần "Giải pháp 2" bên dưới** để biết hướng dẫn chi tiết. Đây là cách đơn giản nhất và đã được cấu hình sẵn trong project.

---

## Giải pháp 1: Sử dụng Render PostgreSQL (KHUYẾN NGHỊ)

Render cung cấp PostgreSQL free tier, đây là giải pháp tốt nhất cho production.

### Bước 1: Tạo PostgreSQL Database trên Render

1. Trong Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Cấu hình:
   - **Name**: `webhub-db`
   - **Database**: `webhub`
   - **User**: `webhub_user` (hoặc để mặc định)
   - **Region**: Chọn cùng region với Web Service
   - **Plan**: **Free** (512MB storage)
3. Click **"Create Database"**
4. Lưu lại **Internal Database URL** (sẽ dùng sau)

### Bước 2: Migrate từ SQLite sang PostgreSQL

**LƯU Ý**: Code hiện tại dùng SQLite. Để dùng PostgreSQL, bạn cần:
- Cài thêm package `pg` hoặc `pg-promise`
- Cập nhật `db/database.js` để hỗ trợ cả SQLite và PostgreSQL
- Hoặc tạo một adapter layer

**Hoặc đơn giản hơn**: Giữ SQLite và dùng giải pháp 2 (backup/restore).

---

## Giải pháp 2: Backup/Restore Database mỗi lần Deploy (Đơn giản nhất) ⭐ KHUYẾN NGHỊ

Với giải pháp này, bạn sẽ backup database trước khi deploy và script sẽ tự động restore khi deploy.

### Bước 1: Backup Database trước khi Deploy

```bash
cd resource-manager
npm run backup-db
```

File backup sẽ được lưu trong `backups/resource-manager-[timestamp].db`

### Bước 2: Commit Backup vào Git (Tạm thời)

**⚠️ CẢNH BÁO**: Chỉ làm điều này nếu database nhỏ và không chứa thông tin nhạy cảm.

1. Copy file backup vào thư mục `backups/` trong repo
2. Commit vào git:
   ```bash
   git add backups/resource-manager-*.db
   git commit -m "Add database backup for deployment"
   git push origin main
   ```

3. **Sau khi deploy xong, xóa backup khỏi git** để không commit database lớn:
   ```bash
   git rm backups/resource-manager-*.db
   git commit -m "Remove database backup from git"
   ```

### Bước 3: Tạo Web Service trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect repository GitHub của bạn
4. Cấu hình:
   - **Name**: `webhub`
   - **Region**: Chọn region gần bạn nhất
   - **Branch**: `main`
   - **Root Directory**: `resource-manager` (nếu repo root là parent folder)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Bước 4: Cấu hình Environment Variables

Trong Render Dashboard, vào **Environment** tab và thêm:

| Key | Value | Mô tả |
|-----|-------|-------|
| `NODE_ENV` | `production` | Môi trường production |
| `PORT` | `10000` | Port (Render tự động set) |
| `SESSION_SECRET` | `[random-string-32-ký-tự]` | Secret cho session |
| `DATABASE_PATH` | `./db/resource-manager.db` | Đường dẫn database (relative path) |

**Tạo SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Bước 5: Script Auto-Restore đã sẵn sàng ✅

Script `scripts/init-db.js` đã được tạo sẵn và sẽ tự động:
- Tìm file backup mới nhất trong thư mục `backups/`
- Restore database khi deploy (nếu database chưa tồn tại)
- Chạy tự động khi `npm install` và `npm start`

**Không cần làm gì thêm**, script đã được cấu hình trong `package.json`.

### Bước 6: Deploy và Kiểm tra

**Lưu ý**: Script sẽ tự động restore database từ backup file trong repo khi deploy.

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Đợi build và deploy hoàn tất
3. Kiểm tra logs để đảm bảo database đã được restore
4. Truy cập URL và đăng nhập với tài khoản admin

---

## Giải pháp 3: Sử dụng External Storage cho Database

### Option A: SQLite trên GitHub Releases

1. Backup database
2. Upload lên GitHub Releases như một asset
3. Script download database từ GitHub Releases khi deploy

### Option B: SQLite trên Cloud Storage (S3, Google Drive, etc.)

1. Upload database backup lên cloud storage
2. Script download database khi deploy

---

## Giải pháp 4: Sử dụng External Storage cho Uploads

Vì uploads cũng sẽ bị mất, bạn có thể:

### Option A: Cloudinary (Free tier)

1. Đăng ký tài khoản [Cloudinary](https://cloudinary.com) (free tier)
2. Cài package: `npm install cloudinary multer-storage-cloudinary`
3. Cập nhật code để upload lên Cloudinary thay vì local storage

### Option B: GitHub Releases hoặc Cloud Storage

Tương tự như database, upload files lên external storage.

---

## Workflow đề xuất cho Render Free Plan (Cách 1)

   ### Lần đầu deploy:

1. **Backup database từ local:**
   ```bash
   npm run backup-db
   ```
   File backup sẽ được lưu trong `backups/resource-manager-[timestamp].db`

2. **Commit backup vào git:**
   ```bash
   git add backups/resource-manager-*.db
   git commit -m "Add database backup for deployment"
   git push origin main
   ```
   ⚠️ **Lưu ý**: Chỉ commit backup nếu database nhỏ (< 10MB). Nếu database lớn, cân nhắc dùng cách khác.

3. **Deploy trên Render:**
   - Render sẽ tự động chạy `npm install` (sẽ chạy `postinstall` → `init-db.js`)
   - Sau đó chạy `npm start` (sẽ chạy `init-db.js` → `server.js`)
   - Script sẽ tự động restore database từ backup file trong repo

4. **Kiểm tra logs trên Render:**
   - Vào **Logs** tab trong Render Dashboard
   - Tìm dòng: `✅ Database restored successfully!`
   - Đảm bảo không có lỗi

---

### Mỗi lần cần redeploy (cập nhật code):

#### Tình huống A: Bạn đang làm việc local và có database local

1. **Backup database từ local:**
   ```bash
   npm run backup-db
   ```

2. **Commit backup mới:**
   ```bash
   git add backups/resource-manager-*.db
   git commit -m "Update database backup"
   git push origin main
   ```

3. **Redeploy** - database sẽ được restore từ backup mới

#### Tình huống B: Bạn muốn giữ nguyên database trên Render (không có thay đổi local)

1. **Backup database từ Render hiện tại:**
   
   **Cách 1: Dùng Render Shell (Khuyến nghị)**
   - Vào Render Dashboard → Service → **Shell**
   - Chạy:
     ```bash
     cd /opt/render/project/src
     npm run backup-db
     ```
   - File backup sẽ được tạo trong `/opt/render/project/src/backups/`
   - **Vấn đề**: Bạn không thể download trực tiếp từ Shell
   - **Giải pháp**: Dùng cách 2 (tạo endpoint tạm thời)

   **Cách 2: Tạo endpoint download tạm thời**
   - Thêm route vào `server.js` (xem chi tiết trong `QUICK-DEPLOY.md`)
   - Deploy code này
   - Download database qua browser: `https://your-app.onrender.com/admin/download-db`
   - **⚠️ QUAN TRỌNG: Xóa route này ngay sau khi download!**
   - Đổi tên file và đặt vào `backups/`
   - Commit và push

2. **Redeploy** - database sẽ được restore từ backup

#### Tình huống C: Database đã có trong repo (từ lần deploy trước)

- **Chỉ cần redeploy** - script sẽ tự động restore từ backup file có sẵn trong repo
- Không cần backup lại nếu không có thay đổi database

---

### ⚠️ Lưu ý quan trọng:

1. **Database trên Render sẽ bị mất khi redeploy** - luôn backup trước
2. **Nếu xóa backup khỏi git**, lần deploy sau sẽ không có database
3. **Chỉ commit backup nếu database nhỏ** (< 10MB)
4. **Luôn kiểm tra logs** để đảm bảo database đã được restore

### Hoặc sử dụng GitHub Actions để tự động:

Tạo workflow tự động backup và restore database mỗi lần deploy.

---

## Lưu ý quan trọng

1. **Database sẽ bị mất khi service restart** trên free plan
2. **Luôn backup database trước khi deploy**
3. **Không commit database lớn vào git** (chỉ tạm thời cho deploy)
4. **Xem xét upgrade lên paid plan** nếu cần persistent storage
5. **Hoặc migrate sang PostgreSQL** để có persistent database free

---

## Troubleshooting

### Database không được restore
- Kiểm tra file backup có trong repo không
- Kiểm tra script `init-db.js` có chạy không
- Xem logs trong Render Dashboard

### Uploads không hoạt động
- Uploads sẽ bị mất trên free plan
- Nên dùng external storage (Cloudinary, S3, etc.)

### Session không persist
- Đảm bảo `SESSION_SECRET` đã được set
- Không thay đổi `SESSION_SECRET` giữa các lần deploy

