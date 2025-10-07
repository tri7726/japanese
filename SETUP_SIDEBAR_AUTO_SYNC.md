# Hướng dẫn Setup Sidebar + Auto-Sync (Chi tiết từng bước)

## 🎯 Mục tiêu
Tạo một sidebar trong Google Sheets để khi bạn **chọn ô mới**, văn bản sẽ **tự động phát thành giọng nói** mà không cần click bất kỳ nút nào.

---

## 📋 Yêu cầu trước khi bắt đầu

1. ✅ Ứng dụng Text-to-Speech đã được deploy (có URL)
2. ✅ Có tài khoản Google
3. ✅ Có file Google Sheets để test

---

## 🚀 Bước 1: Lấy URL ứng dụng

### Nếu chưa deploy:

**Deploy lên Netlify (Miễn phí):**
```bash
# Trong thư mục project
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Sau khi deploy, bạn sẽ có URL dạng:
```
https://your-app-name.netlify.app
```

**Lưu URL này lại**, bạn sẽ cần dùng ở bước sau.

---

## 🚀 Bước 2: Tạo Google Sheets mới

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo spreadsheet mới
3. Tạo cấu trúc như sau:

| A (Văn bản) | B (Ngôn ngữ) |
|-------------|--------------|
| こんにちは世界 | ja |
| Hello World | en |
| Xin chào | vi |
| 你好世界 | zh-CN |
| ありがとう | ja |
| Thank you | en |

**Giải thích:**
- **Cột A**: Văn bản bạn muốn nghe
- **Cột B**: Mã ngôn ngữ (ja=Japanese, en=English, vi=Vietnamese, zh-CN=Chinese)

---

## 🚀 Bước 3: Mở Apps Script Editor

1. Trong Google Sheets, vào menu **Extensions**
2. Click **Apps Script**
3. Một tab mới sẽ mở ra với code editor

---

## 🚀 Bước 4: Xóa code mẫu và dán code mới

1. Xóa toàn bộ code mẫu trong editor
2. Copy code sau và dán vào:

```javascript
// ==========================================
// 🎯 CONFIG - QUAN TRỌNG: THAY URL CỦA BẠN
// ==========================================
const APP_URL = 'https://your-app-name.netlify.app';
// ⚠️ KHÔNG thêm dấu / ở cuối URL
// ⚠️ Ví dụ đúng: https://abc.netlify.app
// ⚠️ Ví dụ SAI: https://abc.netlify.app/

// ==========================================
// 📱 AUTO-RUN KHI MỞ GOOGLE SHEETS
// ==========================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔊 TTS')
    .addItem('📱 Mở Sidebar', 'showSidebar')
    .addSeparator()
    .addItem('✅ Bật Auto-Sync', 'enableAutoSync')
    .addItem('❌ Tắt Auto-Sync', 'disableAutoSync')
    .addSeparator()
    .addItem('ℹ️ Hướng dẫn', 'showHelp')
    .addToUi();
}

// ==========================================
// 🎨 HIỂN THỊ SIDEBAR
// ==========================================
function showSidebar() {
  const html = HtmlService.createHtmlOutput(getSidebarHTML())
    .setTitle('🔊 Text-to-Speech')
    .setWidth(380);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ==========================================
// ⚡ BẬT AUTO-SYNC
// ==========================================
function enableAutoSync() {
  // Xóa trigger cũ nếu có
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onSelectionChange') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Tạo trigger mới
  ScriptApp.newTrigger('onSelectionChange')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onSelectionChange()
    .create();

  SpreadsheetApp.getUi().alert(
    '✅ Auto-Sync đã BẬT!\\n\\n' +
    '📝 Cách dùng:\\n' +
    '1. Mở Sidebar (menu 🔊 TTS > Mở Sidebar)\\n' +
    '2. Chọn ô bất kỳ trong Sheet\\n' +
    '3. Âm thanh tự động phát!\\n\\n' +
    '💡 Cột A: Văn bản\\n' +
    '💡 Cột B: Mã ngôn ngữ (ja/en/vi/zh-CN)'
  );
}

// ==========================================
// 🛑 TẮT AUTO-SYNC
// ==========================================
function disableAutoSync() {
  const triggers = ScriptApp.getProjectTriggers();
  let deleted = 0;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onSelectionChange') {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });

  if (deleted > 0) {
    SpreadsheetApp.getUi().alert('❌ Auto-Sync đã TẮT');
  } else {
    SpreadsheetApp.getUi().alert('ℹ️ Auto-Sync chưa được bật');
  }
}

// ==========================================
// 📖 HƯỚNG DẪN
// ==========================================
function showHelp() {
  SpreadsheetApp.getUi().alert(
    '📚 HƯỚNG DẪN SỬ DỤNG\\n\\n' +
    '1️⃣ Mở Sidebar: Menu 🔊 TTS > Mở Sidebar\\n' +
    '2️⃣ Bật Auto-Sync: Menu 🔊 TTS > Bật Auto-Sync\\n' +
    '3️⃣ Chọn ô có văn bản\\n' +
    '4️⃣ Âm thanh tự động phát!\\n\\n' +
    '📝 CẤU TRÚC SHEET:\\n' +
    '• Cột A: Văn bản cần đọc\\n' +
    '• Cột B: Mã ngôn ngữ (ja/en/vi/zh-CN)\\n\\n' +
    '💡 MÃ NGÔN NGỮ:\\n' +
    '• ja = Japanese (Tiếng Nhật)\\n' +
    '• en = English (Tiếng Anh)\\n' +
    '• vi = Vietnamese (Tiếng Việt)\\n' +
    '• zh-CN = Chinese (Tiếng Trung)'
  );
}

// ==========================================
// 🎯 AUTO-RUN KHI CHỌN Ô MỚI
// ==========================================
function onSelectionChange(e) {
  try {
    const range = e.range;
    if (!range) return;

    const text = range.getValue();
    if (!text || typeof text !== 'string' || !text.trim()) return;

    // Lấy ngôn ngữ từ cột bên cạnh
    const sheet = range.getSheet();
    const langCell = sheet.getRange(range.getRow(), range.getColumn() + 1);
    let language = langCell.getValue();

    // Nếu không có ngôn ngữ, dùng mặc định
    if (!language || typeof language !== 'string') {
      language = 'ja';
    }

    // Lưu vào Properties để Sidebar đọc
    const props = PropertiesService.getUserProperties();
    props.setProperty('LATEST_CELL_DATA', JSON.stringify({
      text: text,
      language: language,
      autoPlay: true,
      timestamp: new Date().getTime()
    }));

  } catch (error) {
    console.error('Error in onSelectionChange:', error);
  }
}

// ==========================================
// 📊 LẤY DỮ LIỆU Ô HIỆN TẠI
// ==========================================
function getSelectedCellData() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();

    if (!range) {
      return { text: '', language: 'ja' };
    }

    const text = range.getValue();
    const langCell = sheet.getRange(range.getRow(), range.getColumn() + 1);
    let language = langCell.getValue();

    if (!language || typeof language !== 'string') {
      language = 'ja';
    }

    return {
      text: String(text || ''),
      language: String(language)
    };
  } catch (error) {
    console.error('Error getting cell data:', error);
    return { text: '', language: 'ja' };
  }
}

// ==========================================
// 📡 LẤY DỮ LIỆU MỚI NHẤT (POLLING)
// ==========================================
function getLatestCellData() {
  const props = PropertiesService.getUserProperties();
  const data = props.getProperty('LATEST_CELL_DATA');

  if (data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing cell data:', error);
      return null;
    }
  }

  return null;
}

// ==========================================
// 🎨 HTML CHO SIDEBAR
// ==========================================
function getSidebarHTML() {
  return \`
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 0;
      overflow-x: hidden;
    }

    .header {
      background: rgba(255, 255, 255, 0.95);
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header h2 {
      font-size: 20px;
      color: #333;
      margin-bottom: 4px;
    }

    .header p {
      font-size: 13px;
      color: #666;
    }

    .status {
      margin: 12px;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-left: 4px solid #4CAF50;
      font-size: 13px;
      color: #333;
    }

    .status.error {
      border-left-color: #f44336;
      background: #ffebee;
    }

    .status.loading {
      border-left-color: #2196F3;
    }

    #iframe-container {
      margin: 12px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    iframe {
      width: 100%;
      height: 500px;
      border: none;
      display: block;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .info {
      margin: 12px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      font-size: 12px;
      color: #333;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .info strong {
      display: block;
      margin-bottom: 10px;
      font-size: 14px;
      color: #667eea;
    }

    .info ul {
      margin-left: 20px;
    }

    .info li {
      margin: 6px 0;
      line-height: 1.5;
    }

    .emoji {
      font-style: normal;
      margin-right: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>🔊 Text to Speech</h2>
    <p>Auto-sync với Google Sheets</p>
  </div>

  <div id="status" class="status loading">
    ⏳ Đang kết nối với ứng dụng...
  </div>

  <div id="iframe-container">
    <div class="loading">
      <div class="spinner"></div>
      <p>Đang tải Text-to-Speech...</p>
    </div>
  </div>

  <div class="info">
    <strong>💡 Cách sử dụng</strong>
    <ul>
      <li><span class="emoji">1️⃣</span> Vào menu <strong>🔊 TTS > Bật Auto-Sync</strong></li>
      <li><span class="emoji">2️⃣</span> Chọn bất kỳ ô nào trong Sheet</li>
      <li><span class="emoji">3️⃣</span> Văn bản sẽ tự động phát!</li>
    </ul>
    <br>
    <strong>📝 Cấu trúc Sheet</strong>
    <ul>
      <li><span class="emoji">📄</span> Cột A: Văn bản cần đọc</li>
      <li><span class="emoji">🌍</span> Cột B: Mã ngôn ngữ</li>
    </ul>
  </div>

  <script>
    const APP_URL = '${APP_URL}';
    let iframe = null;
    let isReady = false;
    let lastDataStr = '';

    // Tạo iframe
    function createIframe() {
      const container = document.getElementById('iframe-container');
      iframe = document.createElement('iframe');
      iframe.src = APP_URL + '?auto=true&embedded=true';
      iframe.allow = 'autoplay';
      container.innerHTML = '';
      container.appendChild(iframe);
      console.log('Iframe created:', iframe.src);
    }

    // Cập nhật status
    function updateStatus(message, type = 'success') {
      const status = document.getElementById('status');
      status.textContent = message;
      status.className = 'status ' + type;
    }

    // Lắng nghe message từ iframe
    window.addEventListener('message', (event) => {
      console.log('Received message:', event.data);

      if (event.data.type === 'TTS_READY') {
        isReady = true;
        updateStatus('✅ Đã kết nối! Chọn ô để tự động phát âm.', 'success');
        console.log('TTS App is ready!');

        // Load dữ liệu ô hiện tại
        loadCurrentCell();
      }
    });

    // Gửi dữ liệu đến iframe
    function sendToIframe(data) {
      if (iframe && isReady) {
        console.log('Sending to iframe:', data);
        iframe.contentWindow.postMessage({
          type: 'TTS_UPDATE',
          ...data
        }, '*');
      }
    }

    // Load dữ liệu ô hiện tại
    function loadCurrentCell() {
      google.script.run
        .withSuccessHandler((data) => {
          if (data && data.text) {
            console.log('Loaded cell data:', data);
            sendToIframe({
              text: data.text,
              language: data.language || 'ja',
              autoPlay: false
            });
          }
        })
        .withFailureHandler((error) => {
          console.error('Error loading cell:', error);
          updateStatus('❌ Lỗi khi tải dữ liệu', 'error');
        })
        .getSelectedCellData();
    }

    // Poll dữ liệu mới từ trigger
    function pollLatestData() {
      google.script.run
        .withSuccessHandler((data) => {
          if (!data) return;

          const dataStr = JSON.stringify(data);
          if (dataStr !== lastDataStr) {
            lastDataStr = dataStr;
            console.log('New data detected:', data);

            sendToIframe({
              text: data.text,
              language: data.language || 'ja',
              autoPlay: data.autoPlay || false
            });

            const preview = data.text.length > 30
              ? data.text.substring(0, 30) + '...'
              : data.text;
            updateStatus('🔊 Đang phát: ' + preview, 'success');
          }
        })
        .withFailureHandler((error) => {
          console.error('Error polling data:', error);
        })
        .getLatestCellData();
    }

    // Khởi tạo
    console.log('Initializing sidebar...');
    createIframe();

    // Poll dữ liệu mỗi 500ms
    setInterval(pollLatestData, 500);
  </script>
</body>
</html>
  \`;
}
```

3. Click **💾 Save** (hoặc Ctrl+S / Cmd+S)
4. Đặt tên project: "Text to Speech Auto-Sync"

---

## 🚀 Bước 5: Cấu hình URL

**QUAN TRỌNG:** Tìm dòng này ở đầu code:

```javascript
const APP_URL = 'https://your-app-name.netlify.app';
```

Thay `https://your-app-name.netlify.app` bằng **URL thật của ứng dụng** bạn đã deploy ở Bước 1.

**Ví dụ:**
```javascript
const APP_URL = 'https://my-tts-app.netlify.app';
```

⚠️ **KHÔNG thêm dấu `/` ở cuối!**

Sau khi thay, click **💾 Save** lại.

---

## 🚀 Bước 6: Chạy lần đầu và cấp quyền

1. Chọn hàm `onOpen` trong dropdown (ở thanh toolbar)
2. Click nút **▶️ Run**
3. Một popup xuất hiện: **"Authorization required"**
4. Click **Review permissions**
5. Chọn tài khoản Google của bạn
6. Sẽ có cảnh báo: **"Google hasn't verified this app"**
7. Click **Advanced**
8. Click **Go to Text to Speech Auto-Sync (unsafe)**
9. Click **Allow**

✅ Hoàn tất! Apps Script đã được cấp quyền.

---

## 🚀 Bước 7: Quay lại Google Sheets

1. Đóng tab Apps Script
2. Quay lại tab Google Sheets
3. **Refresh** trang (F5 hoặc Cmd+R)
4. Bạn sẽ thấy menu mới: **🔊 TTS**

---

## 🚀 Bước 8: Mở Sidebar

1. Click menu **🔊 TTS**
2. Click **📱 Mở Sidebar**
3. Sidebar sẽ xuất hiện bên phải màn hình
4. Đợi vài giây để ứng dụng load

✅ Khi thấy: **"✅ Đã kết nối!"** nghĩa là thành công!

---

## 🚀 Bước 9: Bật Auto-Sync

1. Click menu **🔊 TTS**
2. Click **✅ Bật Auto-Sync**
3. Một popup xuất hiện xác nhận
4. Click **OK**

✅ Auto-Sync đã được bật!

---

## 🎉 Bước 10: Thử nghiệm!

Bây giờ hãy test:

1. **Click vào ô A2** (ô có text "こんにちは世界")
2. Đợi 1 giây
3. 🔊 **Âm thanh sẽ tự động phát!**

Tiếp tục:
- Click ô A3 → Phát "Hello World" bằng tiếng Anh
- Click ô A4 → Phát "Xin chào" bằng tiếng Việt
- Click ô A5 → Phát "你好世界" bằng tiếng Trung

**Không cần click nút nào!** Chỉ cần chọn ô, âm thanh tự động phát!

---

## 🎯 Cách thêm văn bản mới

Để thêm văn bản mới:

1. Nhập văn bản vào cột A (ví dụ A7)
2. Nhập mã ngôn ngữ vào cột B (B7)
3. Click vào ô A7
4. Âm thanh tự động phát!

**Ví dụ:**
| A | B |
|---|---|
| ありがとうございます | ja |
| How are you? | en |
| Cảm ơn bạn | vi |

---

## ❓ Troubleshooting

### Sidebar không hiện ứng dụng
**Giải pháp:**
1. Kiểm tra `APP_URL` đã đúng chưa
2. Mở URL trực tiếp trong browser để test
3. Right-click trong sidebar > **Inspect** để xem lỗi

### Auto-Sync không hoạt động
**Giải pháp:**
1. Vào menu **🔊 TTS > Tắt Auto-Sync**
2. Sau đó **🔊 TTS > Bật Auto-Sync** lại
3. Kiểm tra triggers: Apps Script > Triggers (icon đồng hồ ⏰)

### Không phát âm thanh
**Giải pháp:**
1. Kiểm tra Edge Function đã deploy chưa
2. Click nút "Play Audio" thủ công một lần
3. Browser cần allow autoplay
4. Mở Console trong sidebar để xem lỗi

### Status hiện "❌ Lỗi khi tải dữ liệu"
**Giải pháp:**
1. Refresh Google Sheets
2. Đóng và mở lại Sidebar
3. Chạy lại `onOpen` function trong Apps Script

---

## 💡 Tips & Tricks

### 1. Keyboard Shortcut
Gán phím tắt cho "Mở Sidebar":
1. Tools > Macros > Manage macros
2. Gán phím tắt (ví dụ: Ctrl+Alt+Shift+1)

### 2. Tắt Auto-Sync khi không dùng
Để tránh spam, hãy tắt Auto-Sync khi không cần:
- Menu **🔊 TTS > Tắt Auto-Sync**

### 3. Dùng nhiều Sheet
Auto-Sync hoạt động trên tất cả các sheet trong cùng file!

### 4. Copy formula
Bạn có thể copy cột A-B và paste sang sheet khác.

---

## 🎊 Hoàn thành!

Bây giờ bạn đã có:
- ✅ Sidebar với ứng dụng Text-to-Speech
- ✅ Auto-Sync tự động khi chọn ô
- ✅ Không cần click nút, chỉ cần chọn ô
- ✅ Hỗ trợ 4 ngôn ngữ: Japanese, English, Vietnamese, Chinese

**Enjoy! 🎉**
