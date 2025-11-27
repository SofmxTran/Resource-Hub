# Fix MongoDB Database Issue on Render

## Vấn đề: Ứng dụng tự tạo database "test" thay vì sử dụng database của bạn

Khi deploy lên Render, nếu bạn thấy ứng dụng kết nối vào database "test" thay vì database bạn chỉ định, đây là cách sửa:

## Nguyên nhân

MongoDB connection string (`MONGODB_URI`) không có tên database trong URI, nên MongoDB/Mongoose tự động sử dụng database mặc định là "test".

## Cách sửa

### Bước 1: Kiểm tra MONGODB_URI hiện tại trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Chọn service của bạn
3. Vào tab **Environment**
4. Tìm biến `MONGODB_URI`

### Bước 2: Kiểm tra format của MONGODB_URI

**❌ SAI** - Thiếu tên database:
```
mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
                                 ^
                                 Thiếu tên database ở đây
```

**✅ ĐÚNG** - Có tên database:
```
mongodb+srv://user:pass@cluster.mongodb.net/webhub?retryWrites=true&w=majority
                                                      ^^^^^^
                                                      Tên database ở đây
```

### Bước 3: Sửa MONGODB_URI trên Render

1. Trong tab **Environment** của service trên Render
2. Click **Edit** hoặc **Add Environment Variable** cho `MONGODB_URI`
3. Đảm bảo connection string có tên database:
   - **Format MongoDB Atlas:**
     ```
     mongodb+srv://username:password@cluster.mongodb.net/webhub?retryWrites=true&w=majority
     ```
     - Thay `webhub` bằng tên database bạn muốn sử dụng
   
   - **Format MongoDB Local:**
     ```
     mongodb://host:port/webhub
     ```
     - Thay `webhub` bằng tên database bạn muốn sử dụng

4. **Lưu** thay đổi

### Bước 4: Redeploy

1. Sau khi lưu `MONGODB_URI`, Render sẽ tự động redeploy
2. Hoặc bạn có thể click **Manual Deploy** → **Deploy latest commit**

### Bước 5: Kiểm tra logs

Sau khi deploy, kiểm tra logs để xác nhận:

1. Vào tab **Logs** của service trên Render
2. Tìm dòng log:
   ```
   📊 Attempting to connect to MongoDB...
   Database name from URI: "webhub"
   ✅ MongoDB connected successfully to database: "webhub"
   ```

3. Nếu thấy:
   ```
   ⚠️  WARNING: Connected to "test" database!
   ```
   → Có nghĩa là `MONGODB_URI` vẫn chưa có tên database, cần kiểm tra lại.

## Ví dụ MONGODB_URI đúng

### MongoDB Atlas (Cloud)
```
mongodb+srv://sofmxtran_db_user:Fyu5sdt3@sofmxtran.qgfregb.mongodb.net/webhub?retryWrites=true&w=majority&appName=SofmxTran
```

### MongoDB Local
```
mongodb://127.0.0.1:27017/webhub
```

## Lưu ý quan trọng

1. **Tên database phải nằm trong path của URI**, không phải trong query parameters
2. **Không có khoảng trắng** trong connection string
3. **Password có thể chứa ký tự đặc biệt** - cần URL encode nếu cần
4. Sau khi sửa `MONGODB_URI`, **phải redeploy** service mới có hiệu lực

## Troubleshooting

### Vẫn kết nối vào "test" database?

1. Kiểm tra lại `MONGODB_URI` trong Environment variables
2. Đảm bảo tên database nằm **sau dấu `/` và trước dấu `?`** (nếu có query params)
3. Xem logs chi tiết để biết database name được parse như thế nào
4. Thử hard refresh browser và xem logs mới nhất

### Lỗi connection?

1. Kiểm tra IP whitelist trong MongoDB Atlas (nếu dùng Atlas)
2. Kiểm tra username/password đúng chưa
3. Kiểm tra network connectivity từ Render đến MongoDB

## Liên hệ

Nếu vẫn gặp vấn đề, kiểm tra:
- Logs trên Render dashboard
- MongoDB Atlas logs (nếu dùng Atlas)
- Environment variables đã được set đúng chưa

