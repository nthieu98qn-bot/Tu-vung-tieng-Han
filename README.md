# Hangul Deck - Quizlet-style Korean Flashcard App

Ứng dụng học tiếng Hàn kiểu Quizlet, bản đơn giản chỉ giữ 2 phần chính:

- Tiếng Hàn
- Nghĩa tiếng Việt

## Tính năng

- Tạo nhiều bộ từ vựng.
- Thêm từ thủ công.
- Gợi ý nghĩa bằng AI khi nhập từ tiếng Hàn.
- Import Excel/CSV với 2 cột: `Korean`, `Vietnamese`.
- Flashcard tự chạy.
- Đọc tiếng Hàn và tiếng Việt bằng giọng trình duyệt.
- Tìm kiếm, sửa, xóa từ vựng.
- Xuất JSON/CSV.
- Chạy được trên GitHub Pages nếu dùng bản web tĩnh.
- Chạy được đầy đủ AI nếu deploy bằng Render hoặc server Node.js.

## Chạy local

```bash
npm install
npm start
```

Mở:

```text
http://localhost:3000
```

## Bật AI

Tạo file `.env` từ `.env.example`, sau đó điền:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
PORT=3000
```

## Đưa lên GitHub Pages

Copy 3 file trong thư mục `public`:

```text
index.html
styles.css
app.js
```

ra ngoài cùng repo, ngang hàng với `README.md`.

Hoặc dùng sẵn 3 file mình đã copy ở ngoài cùng project này.

Lưu ý: GitHub Pages chỉ chạy bản web tĩnh. Nút AI sẽ không hoạt động nếu chưa có backend Node.js/Render.
