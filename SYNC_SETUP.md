# Cách bật đồng bộ nhiều thiết bị

## 1. Tạo Firebase project
Vào Firebase Console -> Create project.

## 2. Tạo Web App
Project overview -> biểu tượng Web `</>` -> Register app.
Copy đoạn `firebaseConfig`.

## 3. Tạo Firestore Database
Build -> Firestore Database -> Create database -> Start in test mode hoặc Production rồi dán rules trong file `FIRESTORE_RULES.txt`.

## 4. Sửa file `firebase-config.js`
Dán config thật vào file này. Không dán OpenAI API key vào đây.

## 5. Upload lên GitHub
Thay các file trong repo:
- index.html
- app.js
- firebase-config.js

Nếu muốn, upload thêm:
- FIRESTORE_RULES.txt

## 6. Dùng trên điện thoại
Mở link GitHub Pages. Các máy cùng mở link và cùng `HANGUL_SYNC_ID = "main"` sẽ thấy cùng dữ liệu.

Bạn cũng có thể mở bằng link dạng:
`https://ten-user.github.io/KOREAN/?sync=main`
