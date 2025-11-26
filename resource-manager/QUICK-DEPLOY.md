# Hướng dẫn Deploy Nhanh lên Render FREE Plan

Hướng dẫn tóm tắt để deploy WebHub lên Render free plan và giữ nguyên database.

## 📋 Checklist trước khi deploy

- [ ] Database đã được backup
- [ ] Code đã được commit và push lên GitHub
- [ ] Đã tạo tài khoản Render

---

## 🚀 Các bước deploy

### 1. Backup Database

```bash
cd resource-manager
npm run backup-db
```

File backup sẽ được lưu trong `backups/resource-manager-[timestamp].db`

### 2. Commit Backup vào Git

```bash
git add backups/resource-manager-*.db
git commit -m "Add database backup for deployment"
git push origin main
```

⚠️ **Lưu ý**: Chỉ commit nếu database nhỏ (< 10MB). Nếu lớn hơn, cân nhắc dùng cách khác.

### 3. Tạo Web Service trên Render

1. Đăng nhập [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository
4. Cấu hình:
   - **Name**: `webhub` (hoặc tên bạn muốn)
   - **Region**: Chọn region gần bạn
   - **Branch**: `main`
   - **Root Directory**: `resource-manager` (nếu repo root là parent folder)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 4. Cấu hình Environment Variables

Trong Render Dashboard → **Environment** tab, thêm:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | `[tạo random string - xem bên dưới]` |
| `DATABASE_PATH` | `./db/resource-manager.db` |

**Tạo SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Đợi build và deploy hoàn tất
3. Kiểm tra **Logs** tab:
   - Tìm dòng: `✅ Database restored successfully!`
   - Đảm bảo không có lỗi

### 6. Kiểm tra

1. Truy cập URL được cung cấp bởi Render
2. Đăng nhập với tài khoản admin hiện tại
3. Kiểm tra database và dữ liệu đã được restore

---

## 🔄 Mỗi lần cần deploy lại (Redeploy)

### Tình huống 1: Bạn đang chạy local và muốn deploy

1. **Backup database từ local:**
   ```bash
   cd resource-manager
   npm run backup-db
   ```
   File backup sẽ được lưu trong `backups/resource-manager-[timestamp].db`

2. **Commit backup mới:**
   ```bash
   git add backups/resource-manager-*.db
   git commit -m "Update database backup"
   git push origin main
   ```

3. **Render sẽ tự động deploy** (nếu bật auto-deploy) hoặc manual deploy

4. **Script sẽ tự động restore database** từ backup file mới nhất

---

### Tình huống 2: Bạn muốn backup database từ Render hiện tại trước khi redeploy

⚠️ **QUAN TRỌNG**: Trên Render free plan, database sẽ bị mất khi redeploy. Bạn cần backup từ deployment hiện tại.

#### Cách 1: Sử dụng Render Shell (Khuyến nghị)

1. Vào Render Dashboard → Service của bạn → **Shell** tab
2. Chạy các lệnh:
   ```bash
   cd /opt/render/project/src
   npm run backup-db
   ```
3. File backup sẽ được tạo trong `/opt/render/project/src/backups/`
4. **Download file backup:**
   - Cách 1: Dùng Render Shell để copy nội dung (nếu file nhỏ)
   - Cách 2: Tạo endpoint tạm thời để download (xem bên dưới)

#### Cách 2: Tạo endpoint tạm thời để download (Chỉ dùng khi cần)

1. **Thêm route vào `server.js` (tạm thời):**
   ```javascript
   // ⚠️ CHỈ DÙNG TẠM THỜI - XÓA SAU KHI XONG
   app.get('/admin/download-db', ensureAuthenticated, (req, res) => {
     if (!req.session.user || !req.session.user.isAdmin) {
       return res.status(403).send('Forbidden');
     }
     const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'db', 'resource-manager.db');
     if (!fs.existsSync(dbPath)) {
       return res.status(404).send('Database not found');
     }
     res.download(dbPath, 'resource-manager.db', (err) => {
       if (err) {
         console.error('Error downloading database:', err);
         res.status(500).send('Error downloading database');
       }
     });
   });
   ```

2. **Deploy code này lên Render**

3. **Download database:**
   - Đăng nhập với tài khoản admin
   - Truy cập: `https://your-app.onrender.com/admin/download-db`
   - File sẽ được download về máy

4. **⚠️ QUAN TRỌNG: Xóa route này ngay sau khi download xong!**

5. **Đổi tên file và đặt vào thư mục backups:**
   ```bash
   mv ~/Downloads/resource-manager.db backups/resource-manager-[timestamp].db
   ```

6. **Commit backup mới:**
   ```bash
   git add backups/resource-manager-*.db
   git commit -m "Update database backup from Render"
   git push origin main
   ```

7. **Redeploy** - database sẽ được restore từ backup mới

---

### Tình huống 3: Database đã có trong repo (từ lần deploy trước)

Nếu bạn đã commit backup vào repo từ lần deploy trước, bạn chỉ cần:

1. **Kiểm tra file backup có trong repo:**
   ```bash
   ls backups/*.db
   ```

2. **Nếu có, chỉ cần redeploy** - script sẽ tự động restore

3. **Nếu không có hoặc muốn cập nhật**, làm theo Tình huống 1 hoặc 2

---

## ⚠️ Lưu ý quan trọng

1. **Database sẽ bị mất khi service restart** trên free plan
2. **Luôn backup trước khi deploy**
3. **Kiểm tra logs** để đảm bảo database đã được restore
4. **Uploads sẽ bị mất** - cân nhắc dùng external storage (Cloudinary, S3, etc.)

---

## 🆘 Troubleshooting

### Database không được restore

- Kiểm tra file backup có trong repo không
- Kiểm tra logs trong Render Dashboard
- Đảm bảo `DATABASE_PATH` đúng

### Session không persist

- Kiểm tra `SESSION_SECRET` đã được set
- Không thay đổi `SESSION_SECRET` giữa các lần deploy

### Uploads không hoạt động

- Uploads sẽ bị mất trên free plan
- Nên dùng external storage (Cloudinary, S3, etc.)

---

## 📚 Tài liệu chi tiết

Xem file **`DEPLOY-FREE.md`** để biết thêm chi tiết và các giải pháp khác.

