// Firebase config cho Hangul Deck
// 1) Vào https://console.firebase.google.com/
// 2) Tạo project -> Add app -> Web
// 3) Copy firebaseConfig rồi dán vào đây.
//
// Lưu ý: thông tin config này có thể đặt ở frontend; KHÔNG đặt OpenAI API key ở đây.

window.HANGUL_FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY_HERE",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_APP_ID"
};

// Các máy mở cùng link và cùng mã này sẽ dùng chung dữ liệu.
// Bạn có thể đổi thành: hieu-main, topik, v.v.
window.HANGUL_SYNC_ID = "main";
