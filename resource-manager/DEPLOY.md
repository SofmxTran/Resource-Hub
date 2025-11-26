# Hướng dẫn Deploy lên Render

Hướng dẫn này giúp bạn deploy WebHub lên Render và giữ nguyên database cùng tài khoản admin hiện tại.

## Bước 1: Backup Database hiện tại

Trước khi deploy, hãy backup database của bạn:

```bash
cd resource-manager
npm run backup-db
```

File backup sẽ được lưu trong thư mục `backups/` với tên như `resource-manager-2025-01-15T10-30-00.db`

## Bước 2: Chuẩn bị Repository

1. **Đảm bảo code đã được commit lên GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Kiểm tra `.gitignore` đã ignore database:**
   - `*.db` - Database files
   - `uploads/` - Uploaded files
   - `.env` - Environment variables

## Bước 3: Tạo Web Service trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect repository GitHub của bạn
4. Cấu hình:
   - **Name**: `webhub` (hoặc tên bạn muốn)
   - **Region**: Chọn region gần bạn nhất
   - **Branch**: `main` (hoặc branch bạn muốn deploy)
   - **Root Directory**: `resource-manager` (nếu repo root là parent folder)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

## Bước 4: Cấu hình Environment Variables

Trong Render Dashboard, vào **Environment** tab và thêm:

| Key | Value | Mô tả |
|-----|-------|-------|
| `NODE_ENV` | `production` | Môi trường production |
| `PORT` | `10000` | Port (Render tự động set, nhưng có thể set cụ thể) |
| `SESSION_SECRET` | `[random-string-ít-nhất-32-ký-tự]` | Secret cho session (QUAN TRỌNG - tạo random string) |
| `DATABASE_PATH` | `/opt/render/project/src/data/resource-manager.db` | Đường dẫn database (dùng persistent disk) |
| `UPLOADS_PATH` | `/opt/render/project/src/data/uploads` | Đường dẫn thư mục uploads (dùng persistent disk) |

**Tạo SESSION_SECRET:**
```bash
# Trên terminal, chạy:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Bước 5: Cấu hình Persistent Disk (QUAN TRỌNG)

Render cung cấp persistent disk để lưu database và uploads:

1. Trong Render Dashboard, vào **Settings** → **Disks**
2. Click **"Add Disk"**
3. Cấu hình:
   - **Name**: `data`
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: 1GB (hoặc lớn hơn nếu cần)

4. **Cập nhật Environment Variables:**
   ```
   DATABASE_PATH=/opt/render/project/src/data/resource-manager.db
   UPLOADS_PATH=/opt/render/project/src/data/uploads
   ```

5. **Thư mục uploads sẽ được tạo tự động** khi app khởi động, nhưng bạn có thể tạo thủ công:
   ```bash
   mkdir -p /opt/render/project/src/data/uploads/avatars
   ```

## Bước 6: Upload Database lên Render

Sau khi service đã được deploy lần đầu:

### Cách 1: Sử dụng Render Shell (Khuyến nghị)

1. Trong Render Dashboard, vào service → **Shell** tab
2. Chạy các lệnh sau:

```bash
# Tạo thư mục data nếu chưa có
mkdir -p /opt/render/project/src/data

# Tạo thư mục uploads
mkdir -p /opt/render/project/src/data/uploads/avatars

# Upload database file (bạn cần upload file backup qua SFTP hoặc dùng wget/curl)
# Hoặc copy từ local nếu có quyền truy cập
```

### Cách 2: Sử dụng Render API hoặc SFTP

1. Download database backup từ local
2. Upload lên Render disk qua SFTP hoặc Render CLI

### Cách 3: Sử dụng script restore sau khi deploy

1. Commit script restore vào repo
2. SSH vào Render shell
3. Chạy:
```bash
cd /opt/render/project/src
npm run restore-db backups/resource-manager-[timestamp].db
```

## Bước 7: Deploy và Kiểm tra

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Đợi build và deploy hoàn tất
3. Kiểm tra logs để đảm bảo không có lỗi
4. Truy cập URL được cung cấp bởi Render
5. Đăng nhập với tài khoản admin hiện tại để kiểm tra

## Bước 8: Upload Files (nếu cần)

Nếu bạn muốn giữ nguyên các file uploads:

1. Backup thư mục `uploads/` từ local
2. Upload lên Render disk:
   ```bash
   # Trên Render Shell
   # Upload files vào /opt/render/project/src/data/uploads/
   ```

## Lưu ý quan trọng

1. **Database Path**: Đảm bảo `DATABASE_PATH` trỏ đến persistent disk, không phải thư mục tạm
2. **Uploads Directory**: Cũng phải nằm trên persistent disk
3. **Session Secret**: Phải giống nhau giữa các lần deploy để session không bị mất
4. **Auto-Deploy**: Render sẽ tự động deploy khi bạn push code lên GitHub (nếu bật)

## Troubleshooting

### Database không được tìm thấy
- Kiểm tra `DATABASE_PATH` environment variable
- Đảm bảo database file đã được upload đúng vị trí
- Kiểm tra permissions của file database

### Uploads không hoạt động
- Kiểm tra thư mục uploads đã được tạo trên persistent disk
- Kiểm tra permissions: `chmod 755 /opt/render/project/src/data/uploads`

### Session không persist
- Kiểm tra `SESSION_SECRET` đã được set
- Đảm bảo không thay đổi `SESSION_SECRET` giữa các lần deploy

## Backup định kỳ

Sau khi deploy, nên backup database định kỳ:

```bash
# Trên Render Shell
cd /opt/render/project/src
npm run backup-db
# File backup sẽ được lưu trong thư mục backups/
```

## Restore từ backup

Nếu cần restore database:

```bash
# Trên Render Shell
cd /opt/render/project/src
npm run restore-db backups/resource-manager-[timestamp].db
# Sau đó restart service
```

