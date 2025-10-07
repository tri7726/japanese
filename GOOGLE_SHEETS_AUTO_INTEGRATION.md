# Hướng dẫn tích hợp tự động với Google Sheets

## Giải pháp hoàn chỉnh: Tự động phát âm khi chuyển ô

Hướng dẫn này sẽ giúp bạn tạo một hệ thống tự động phát văn bản thành giọng nói khi bạn chuyển ô trong Google Sheets.

---

## Phương pháp 1: Sidebar với Auto-sync (KHUYÊN DÙNG)

### Bước 1: Tạo Google Apps Script

1. Mở Google Sheets của bạn
2. Vào **Extensions** > **Apps Script**
3. Xóa code mẫu và dán code sau:

```javascript
// === CONFIG ===
const APP_URL = 'YOUR_APP_URL_HERE'; // Ví dụ: https://your-app.netlify.app

// === MAIN FUNCTIONS ===

/**
 * Tự động chạy khi mở Google Sheets
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔊 Text-to-Speech')
    .addItem('Mở TTS Sidebar', 'showSidebar')
    .addItem('Bật Auto-Sync', 'enableAutoSync')
    .addItem('Tắt Auto-Sync', 'disableAutoSync')
    .addToUi();
}

/**
 * Hiển thị sidebar với iframe
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutput(getSidebarHTML())
    .setTitle('Text to Speech')
    .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Bật chế độ tự động đồng bộ
 */
function enableAutoSync() {
  const triggers = ScriptApp.getProjectTriggers();

  // Xóa trigger cũ nếu có
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

  SpreadsheetApp.getUi().alert('✅ Auto-Sync đã được bật!\n\nMỗi khi bạn chọn ô mới, văn bản sẽ tự động được gửi đến TTS app.');
}

/**
 * Tắt chế độ tự động đồng bộ
 */
function disableAutoSync() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onSelectionChange') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  SpreadsheetApp.getUi().alert('❌ Auto-Sync đã được tắt.');
}

/**
 * Tự động chạy khi thay đổi ô được chọn
 */
function onSelectionChange(e) {
  try {
    const range = e.range;
    if (!range) return;

    const text = range.getValue();
    if (!text || typeof text !== 'string') return;

    // Lấy ngôn ngữ từ cột bên cạnh (nếu có)
    const sheet = range.getSheet();
    const langCell = sheet.getRange(range.getRow(), range.getColumn() + 1);
    const language = langCell.getValue() || 'ja';

    // Gửi dữ liệu đến sidebar
    broadcastToSidebar({
      text: text,
      language: language,
      autoPlay: true
    });
  } catch (error) {
    console.error('Error in onSelectionChange:', error);
  }
}

/**
 * Lấy văn bản từ ô được chọn
 */
function getSelectedCellData() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();

    if (!range) {
      return { text: '', language: 'ja' };
    }

    const text = range.getValue();
    const langCell = sheet.getRange(range.getRow(), range.getColumn() + 1);
    const language = langCell.getValue() || 'ja';

    return {
      text: String(text || ''),
      language: String(language)
    };
  } catch (error) {
    console.error('Error getting cell data:', error);
    return { text: '', language: 'ja' };
  }
}

/**
 * HTML cho sidebar
 */
function getSidebarHTML() {
  return `
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      padding: 12px;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      text-align: center;
    }

    .header h2 {
      font-size: 18px;
      margin-bottom: 4px;
    }

    .header p {
      font-size: 12px;
      opacity: 0.9;
    }

    .status {
      padding: 12px;
      background: white;
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 4px solid #4CAF50;
    }

    .status.error {
      border-left-color: #f44336;
    }

    .status-text {
      font-size: 13px;
      color: #333;
    }

    #iframe-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    iframe {
      width: 100%;
      height: 600px;
      border: none;
      display: block;
    }

    .loading {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .info {
      margin-top: 12px;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 8px;
      font-size: 12px;
      color: #1976d2;
    }

    .info strong {
      display: block;
      margin-bottom: 8px;
    }

    .info ul {
      margin-left: 20px;
    }

    .info li {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>🔊 Text to Speech</h2>
    <p>Auto-sync với Google Sheets</p>
  </div>

  <div id="status" class="status">
    <div class="status-text">⏳ Đang kết nối...</div>
  </div>

  <div id="iframe-container">
    <div class="loading">
      <div class="spinner"></div>
      <p>Đang tải ứng dụng...</p>
    </div>
  </div>

  <div class="info">
    <strong>💡 Cách sử dụng:</strong>
    <ul>
      <li>Vào menu <strong>🔊 Text-to-Speech > Bật Auto-Sync</strong></li>
      <li>Chọn ô trong Sheet → Tự động phát</li>
      <li>Cột A: Văn bản</li>
      <li>Cột B: Ngôn ngữ (ja/en/vi/zh-CN)</li>
    </ul>
  </div>

  <script>
    const APP_URL = '${APP_URL}';
    let iframe = null;
    let isReady = false;

    // Tạo iframe
    function createIframe() {
      const container = document.getElementById('iframe-container');
      iframe = document.createElement('iframe');
      iframe.src = APP_URL + '?auto=true';
      iframe.allow = 'autoplay';
      container.innerHTML = '';
      container.appendChild(iframe);
    }

    // Cập nhật status
    function updateStatus(message, isError = false) {
      const status = document.getElementById('status');
      const statusText = status.querySelector('.status-text');
      statusText.textContent = message;

      if (isError) {
        status.classList.add('error');
      } else {
        status.classList.remove('error');
      }
    }

    // Lắng nghe message từ iframe
    window.addEventListener('message', (event) => {
      if (event.data.type === 'TTS_READY') {
        isReady = true;
        updateStatus('✅ Đã kết nối! Chọn ô để tự động phát âm.');

        // Gửi dữ liệu ô hiện tại
        loadCurrentCell();
      }
    });

    // Gửi dữ liệu đến iframe
    function sendToIframe(data) {
      if (iframe && isReady) {
        iframe.contentWindow.postMessage({
          type: 'TTS_UPDATE',
          ...data
        }, '*');
      }
    }

    // Lấy dữ liệu ô hiện tại
    function loadCurrentCell() {
      google.script.run
        .withSuccessHandler((data) => {
          if (data && data.text) {
            sendToIframe({
              text: data.text,
              language: data.language || 'ja',
              autoPlay: false
            });
          }
        })
        .withFailureHandler((error) => {
          console.error('Error loading cell:', error);
          updateStatus('❌ Lỗi khi tải dữ liệu ô', true);
        })
        .getSelectedCellData();
    }

    // Nhận broadcast từ Apps Script
    function receiveUpdate(data) {
      sendToIframe(data);
      updateStatus('🔊 Đang phát: ' + (data.text.substring(0, 30) + '...'));
    }

    // Khởi tạo
    createIframe();

    // Tự động load lại dữ liệu mỗi 2 giây (fallback)
    setInterval(() => {
      if (isReady) {
        loadCurrentCell();
      }
    }, 2000);
  </script>
</body>
</html>
  `;
}

/**
 * Broadcast dữ liệu đến sidebar (được gọi từ trigger)
 */
function broadcastToSidebar(data) {
  // Apps Script không thể trực tiếp gửi message đến sidebar
  // Sidebar sẽ tự động poll mỗi 2 giây
  // Hoặc bạn có thể lưu vào Properties Service để sidebar đọc

  const props = PropertiesService.getUserProperties();
  props.setProperty('LATEST_CELL_DATA', JSON.stringify({
    ...data,
    timestamp: new Date().getTime()
  }));
}

/**
 * Lấy dữ liệu mới nhất (được gọi từ sidebar)
 */
function getLatestCellData() {
  const props = PropertiesService.getUserProperties();
  const data = props.getProperty('LATEST_CELL_DATA');

  if (data) {
    return JSON.parse(data);
  }

  return null;
}
```

### Bước 2: Cấu hình

1. Thay `YOUR_APP_URL_HERE` bằng URL app của bạn
   - Ví dụ: `https://your-app.netlify.app`
   - KHÔNG thêm dấu `/` ở cuối

2. Save script (Ctrl+S)

3. Chạy hàm `onOpen` lần đầu để tạo menu

### Bước 3: Cấp quyền

1. Click **Run** button
2. Cho phép quyền truy cập khi được yêu cầu
3. Chọn tài khoản Google của bạn
4. Click **Advanced** > **Go to [Project Name] (unsafe)**
5. Click **Allow**

### Bước 4: Sử dụng

1. Đóng và mở lại Google Sheets
2. Vào menu **🔊 Text-to-Speech** > **Mở TTS Sidebar**
3. Sidebar sẽ xuất hiện bên phải
4. Vào menu **🔊 Text-to-Speech** > **Bật Auto-Sync**
5. Bây giờ mỗi khi bạn click vào ô khác, văn bản sẽ tự động được gửi đến app và phát!

### Cấu trúc Sheet khuyên dùng:

| A (Text) | B (Language) |
|----------|--------------|
| こんにちは | ja |
| Hello world | en |
| Xin chào | vi |
| 你好 | zh-CN |

- **Cột A**: Văn bản cần đọc
- **Cột B**: Mã ngôn ngữ (ja, en, vi, zh-CN)

---

## Phương pháp 2: Polling với setInterval (Đơn giản hơn)

Nếu bạn không muốn dùng trigger, có thể dùng phương pháp polling đơn giản:

### Cập nhật hàm getSidebarHTML():

Thêm polling script vào phần `<script>`:

```javascript
// Thêm vào cuối phần script trong getSidebarHTML()

let lastCellData = null;

setInterval(() => {
  google.script.run
    .withSuccessHandler((data) => {
      if (!data || !data.text) return;

      // Kiểm tra nếu dữ liệu thay đổi
      const dataStr = JSON.stringify(data);
      if (dataStr !== lastCellData) {
        lastCellData = dataStr;
        sendToIframe({
          text: data.text,
          language: data.language || 'ja',
          autoPlay: true  // Tự động phát khi có dữ liệu mới
        });
        updateStatus('🔊 Phát: ' + data.text.substring(0, 30) + '...');
      }
    })
    .getSelectedCellData();
}, 1000); // Check mỗi 1 giây
```

Với phương pháp này:
- Không cần trigger
- Tự động check ô được chọn mỗi 1 giây
- Tự động phát nếu phát hiện thay đổi

---

## Phương pháp 3: Nút bấm nhanh

Thêm vào Apps Script:

```javascript
/**
 * Phát âm ô được chọn ngay lập tức
 */
function playSelected() {
  const data = getSelectedCellData();

  if (!data.text) {
    SpreadsheetApp.getUi().alert('Vui lòng chọn ô có văn bản');
    return;
  }

  // Gửi đến API trực tiếp
  const TTS_API_URL = 'https://YOUR_SUPABASE_URL/functions/v1/text-to-speech';
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

  const payload = {
    text: data.text,
    language: data.language
  };

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    payload: JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(TTS_API_URL, options);

    if (response.getResponseCode() === 200) {
      SpreadsheetApp.getUi().alert('✅ Đã phát: ' + data.text);
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Lỗi: ' + error);
  }
}

// Thêm vào menu trong onOpen()
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔊 Text-to-Speech')
    .addItem('▶️ Phát ô được chọn', 'playSelected')
    .addItem('Mở TTS Sidebar', 'showSidebar')
    .addItem('Bật Auto-Sync', 'enableAutoSync')
    .addItem('Tắt Auto-Sync', 'disableAutoSync')
    .addToUi();
}
```

---

## Phương pháp 4: Custom Function trong Sheet

Tạo formula function:

```javascript
/**
 * Phát văn bản thành giọng nói
 * @param {string} text - Văn bản cần đọc
 * @param {string} language - Mã ngôn ngữ
 * @return {string} Status
 * @customfunction
 */
function TTS(text, language) {
  if (!text) return 'No text';

  try {
    // Gọi API
    const TTS_API_URL = 'https://YOUR_SUPABASE_URL/functions/v1/text-to-speech';
    const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

    const payload = { text, language: language || 'ja' };

    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      },
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(TTS_API_URL, options);

    return response.getResponseCode() === 200 ? '✅ Played' : '❌ Error';
  } catch (error) {
    return '❌ ' + error.message;
  }
}
```

Sử dụng trong cell:
```
=TTS(A1, B1)
```

---

## Tips & Tricks

### 1. Keyboard Shortcut
Thêm shortcut để phát nhanh:
- Tools > Macros > Record macro
- Chọn ô > Chạy playSelected
- Gán phím tắt (Ctrl+Alt+Shift+1)

### 2. Highlight ô đang phát
```javascript
function highlightPlayingCell() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();

  // Đổi màu nền tạm thời
  const originalColor = range.getBackground();
  range.setBackground('#FFEB3B'); // Màu vàng

  // Đổi lại sau 2 giây
  Utilities.sleep(2000);
  range.setBackground(originalColor);
}
```

### 3. History log
```javascript
function logPlayHistory(text, language) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TTS History');
  if (!sheet) return;

  sheet.appendRow([
    new Date(),
    text,
    language,
    Session.getActiveUser().getEmail()
  ]);
}
```

---

## Troubleshooting

### Sidebar không load
- Kiểm tra APP_URL đúng chưa
- Kiểm tra app đã deploy chưa
- Mở DevTools trong sidebar: Right-click > Inspect

### Auto-sync không hoạt động
- Kiểm tra trigger đã được tạo: Edit > Current project's triggers
- Xóa và tạo lại trigger
- Kiểm tra quyền truy cập

### Không phát âm thanh
- Kiểm tra Edge Function đã deploy
- Kiểm tra browser cho phép autoplay
- Mở console để xem lỗi

---

## Lưu ý quan trọng

1. **Autoplay Policy**: Một số browser chặn autoplay. User cần tương tác với page trước.

2. **Performance**: Polling mỗi 1-2 giây là hợp lý. Đừng quá nhanh.

3. **Quota**: Google Apps Script có giới hạn số lượng request/ngày.

4. **CORS**: App đã cấu hình CORS để cho phép iframe.

---

## Tóm tắt

Bạn có 4 phương pháp chính:

1. **Sidebar + Auto-Sync** ⭐ KHUYÊN DÙNG - Tự động hoàn toàn
2. **Polling** - Đơn giản, không cần trigger
3. **Nút bấm** - Manual control
4. **Custom Function** - Dùng trong formula

Chọn phương pháp phù hợp với nhu cầu của bạn!
