# Cài đồng bộ Google Sheets + Apps Script

Sheet của bạn:
https://docs.google.com/spreadsheets/d/1MnQIk1dKy-NLMkXlWkitkj5imo9PZfneo8dav8zAyec/edit

## Bước 1: Tạo Apps Script

1. Mở Google Sheet ở link trên.
2. Chọn **Tiện ích mở rộng / 확장 프로그램** → **Apps Script**.
3. Xóa code cũ trong `Code.gs`.
4. Copy toàn bộ nội dung file `Code.gs` trong gói này và dán vào Apps Script.
5. Bấm **Save / 저장**.

## Bước 2: Chạy thử setupSheet

1. Ở thanh trên chọn function `setupSheet`.
2. Bấm **Run / 실행**.
3. Cho phép quyền truy cập Google Sheet nếu Google hỏi.
4. Quay lại Google Sheet, bạn sẽ thấy sheet mới tên `HangulDeckSync`.

## Bước 3: Deploy Web App

1. Trong Apps Script, bấm **Deploy / 배포** → **New deployment / 새 배포**.
2. Chọn loại **Web app / 웹 앱**.
3. Cấu hình:
   - Execute as / 실행 사용자: **Me / 나**
   - Who has access / 액세스 권한: **Anyone / 모든 사용자** hoặc **Anyone with the link / 링크가 있는 모든 사용자**
4. Bấm **Deploy / 배포**.
5. Copy **Web app URL** có dạng:
   `https://script.google.com/macros/s/AKfycb.../exec`

## Bước 4: Dán Web App URL vào app

1. Mở file `google-sheets-config.js`.
2. Thay dòng:
   `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE`
   bằng Web App URL vừa copy.
3. Upload 4 file này lên GitHub repo:
   - `index.html`
   - `app.js`
   - `styles.css`
   - `google-sheets-config.js`
4. Xóa file `firebase-config.js` khỏi GitHub nếu không dùng nữa.

## Bước 5: Dùng chung trên máy tính và điện thoại

Mở cùng link:

`https://nthieu98qn-bot.github.io/KOREAN/?sync=main`

Trong app vào **Excel / Xuất file** → **Kết nối đồng bộ**.

Máy tính thêm từ → app tự đẩy lên Google Sheets.
Điện thoại mở cùng link → app sẽ tải dữ liệu từ Google Sheets và tự kiểm tra cập nhật theo chu kỳ.
