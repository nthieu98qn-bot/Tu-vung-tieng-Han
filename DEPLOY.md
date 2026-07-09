# Hướng dẫn đưa app lên GitHub và chạy trên điện thoại

App này là Node.js + Express, có backend `/api/suggest-meaning` để gọi AI. Vì vậy không nên deploy bằng GitHub Pages nếu muốn dùng AI, vì GitHub Pages chỉ phù hợp web tĩnh và không có backend để giấu API key.

Cách dễ nhất: đẩy code lên GitHub, sau đó deploy trên Render.

## 1. Chuẩn bị trên máy

Cài Git và Node.js 18 trở lên.

Giải nén project, mở Terminal/CMD trong thư mục `korean-quizlet-ai`, chạy thử:

```bash
npm install
npm start
```

Mở:

```text
http://localhost:3000
```

## 2. Tạo repo trên GitHub

Vào GitHub → New repository.

Tên gợi ý:

```text
korean-quizlet-ai
```

Không upload `.env` lên GitHub.

## 3. Đẩy code lên GitHub

Trong thư mục project chạy:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TEN_GITHUB_CUA_BAN/korean-quizlet-ai.git
git push -u origin main
```

Thay `TEN_GITHUB_CUA_BAN` bằng username GitHub của bạn.

## 4. Deploy trên Render

Vào Render → New → Web Service → Connect GitHub repo.

Cấu hình:

```text
Build Command: npm install
Start Command: npm start
```

Environment Variables:

```text
OPENAI_API_KEY = API key của bạn
OPENAI_MODEL = gpt-4.1-mini
NODE_VERSION = 20
```

Sau khi deploy xong, Render sẽ cho một link dạng:

```text
https://korean-quizlet-ai.onrender.com
```

Mở link này trên điện thoại là dùng được.

## 5. Lưu ý khi dùng trên điện thoại

- Dữ liệu hiện đang lưu trong LocalStorage của từng trình duyệt. Nếu bạn thêm từ trên laptop, điện thoại sẽ chưa tự đồng bộ.
- Muốn chuyển dữ liệu: dùng nút Export CSV/JSON rồi import lại trên điện thoại.
- Giọng đọc tiếng Hàn/Việt phụ thuộc vào trình duyệt và điện thoại. Chrome/Edge thường ổn hơn.
- Nếu muốn đồng bộ tài khoản giữa nhiều thiết bị, cần nâng cấp app thêm database như Supabase hoặc Firebase.
