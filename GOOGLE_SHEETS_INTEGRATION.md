# Hướng dẫn tích hợp Google Sheets với Text-to-Speech

## Tổng quan
Ứng dụng Text-to-Speech này có thể được tích hợp với Google Sheets để tự động phát âm thanh từ dữ liệu trong bảng tính của bạn.

---

## Phương pháp 1: Sử dụng URL Parameters (Đơn giản nhất)

### Bước 1: Lấy URL của ứng dụng
Sau khi deploy ứng dụng, bạn sẽ có URL dạng:
```
https://your-app-url.com
```

### Bước 2: Tạo công thức trong Google Sheets

Trong Google Sheets, bạn có thể tạo công thức để tạo link tự động:

```
=HYPERLINK("https://your-app-url.com?text=" & ENCODEURL(A2) & "&lang=ja&auto=true", "Phát âm")
```

**Giải thích:**
- `A2`: Ô chứa văn bản cần đọc
- `lang=ja`: Ngôn ngữ (ja=Japanese, en=English, vi=Vietnamese, zh-CN=Chinese)
- `auto=true`: Tự động phát khi mở link

### Bước 3: Sử dụng
- Click vào link trong Google Sheets
- Ứng dụng sẽ mở trong tab mới và tự động phát âm

---

## Phương pháp 2: Sử dụng Google Apps Script (Nâng cao)

### Bước 1: Mở Script Editor
1. Trong Google Sheets, vào **Extensions** > **Apps Script**
2. Xóa code mẫu và thêm code sau:

```javascript
// Cấu hình
const TTS_API_URL = 'https://YOUR_SUPABASE_URL/functions/v1/text-to-speech';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

/**
 * Phát văn bản thành giọng nói
 * @param {string} text - Văn bản cần đọc
 * @param {string} language - Mã ngôn ngữ (ja, en, vi, zh-CN)
 */
function textToSpeech(text, language = 'ja') {
  if (!text) {
    SpreadsheetApp.getUi().alert('Vui lòng chọn ô có văn bản');
    return;
  }

  const payload = {
    text: text,
    language: language
  };

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(TTS_API_URL, options);

    if (response.getResponseCode() === 200) {
      SpreadsheetApp.getUi().alert('Audio đã được tạo thành công!');

      // Lưu audio vào Google Drive (tuỳ chọn)
      const audioBlob = response.getBlob();
      const fileName = 'tts_' + new Date().getTime() + '.mp3';
      const file = DriveApp.createFile(audioBlob.setName(fileName));

      Logger.log('File đã lưu: ' + file.getUrl());
      SpreadsheetApp.getUi().alert('File audio: ' + file.getUrl());
    } else {
      SpreadsheetApp.getUi().alert('Lỗi: ' + response.getContentText());
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('Lỗi: ' + error.toString());
  }
}

/**
 * Phát văn bản từ ô được chọn
 */
function playSelectedCell() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const cell = sheet.getActiveCell();
  const text = cell.getValue();

  if (!text) {
    SpreadsheetApp.getUi().alert('Ô được chọn không có văn bản');
    return;
  }

  // Lấy ngôn ngữ từ ô bên cạnh (tuỳ chọn) hoặc dùng mặc định
  const langCell = sheet.getRange(cell.getRow(), cell.getColumn() + 1);
  const language = langCell.getValue() || 'ja';

  textToSpeech(text, language);
}

/**
 * Tạo menu custom
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔊 Text-to-Speech')
    .addItem('Phát âm ô được chọn', 'playSelectedCell')
    .addSeparator()
    .addItem('Phát bằng Tiếng Nhật', 'playJapanese')
    .addItem('Phát bằng Tiếng Anh', 'playEnglish')
    .addItem('Phát bằng Tiếng Việt', 'playVietnamese')
    .addItem('Phát bằng Tiếng Trung', 'playChinese')
    .addToUi();
}

// Các hàm phụ cho từng ngôn ngữ
function playJapanese() {
  const cell = SpreadsheetApp.getActiveSheet().getActiveCell();
  textToSpeech(cell.getValue(), 'ja');
}

function playEnglish() {
  const cell = SpreadsheetApp.getActiveSheet().getActiveCell();
  textToSpeech(cell.getValue(), 'en');
}

function playVietnamese() {
  const cell = SpreadsheetApp.getActiveSheet().getActiveCell();
  textToSpeech(cell.getValue(), 'vi');
}

function playChinese() {
  const cell = SpreadsheetApp.getActiveSheet().getActiveCell();
  textToSpeech(cell.getValue(), 'zh-CN');
}
```

### Bước 2: Cấu hình
1. Thay `YOUR_SUPABASE_URL` bằng URL Supabase của bạn (từ file `.env`)
2. Thay `YOUR_SUPABASE_ANON_KEY` bằng Anon Key của bạn (từ file `.env`)
3. Save script (Ctrl+S hoặc Cmd+S)

### Bước 3: Chạy lần đầu
1. Click vào hàm `onOpen` trong dropdown
2. Click nút **Run** (▶)
3. Cho phép quyền truy cập khi được yêu cầu

### Bước 4: Sử dụng
1. Đóng và mở lại Google Sheets
2. Bạn sẽ thấy menu mới **🔊 Text-to-Speech**
3. Chọn ô có văn bản
4. Vào menu **🔊 Text-to-Speech** > chọn ngôn ngữ
5. Audio sẽ được tạo và lưu vào Google Drive

---

## Phương pháp 3: Tạo nút bấm trong Sheet (Đơn giản, trực quan)

### Bước 1: Thêm Apps Script (như Phương pháp 2)

### Bước 2: Tạo nút
1. Trong Google Sheets, vào **Insert** > **Drawing**
2. Tạo hình chữ nhật hoặc hình tuỳ thích
3. Thêm text "🔊 Phát âm"
4. Click **Save and Close**

### Bước 3: Gán script cho nút
1. Click vào drawing vừa tạo
2. Click **⋮** (3 chấm) > **Assign script**
3. Nhập tên hàm: `playSelectedCell`
4. Click **OK**

### Bước 4: Sử dụng
1. Chọn ô có văn bản
2. Click nút "🔊 Phát âm"
3. Audio sẽ được tạo

---

## Phương pháp 4: Tự động phát khi thay đổi cell (Auto-trigger)

Thêm code sau vào Apps Script:

```javascript
/**
 * Tự động phát khi thay đổi ô trong cột cụ thể
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;

  // Chỉ chạy khi edit cột A (cột 1)
  if (range.getColumn() === 1 && range.getValue()) {
    const text = range.getValue();
    const language = sheet.getRange(range.getRow(), 2).getValue() || 'ja';

    // Chạy sau 500ms để tránh spam
    Utilities.sleep(500);
    textToSpeech(text, language);
  }
}
```

**Lưu ý:**
- Cột 1 (A): Văn bản cần đọc
- Cột 2 (B): Mã ngôn ngữ (ja, en, vi, zh-CN)
- Khi bạn nhập văn bản vào cột A, nó sẽ tự động phát

---

## Phương pháp 5: Tích hợp với Taskspace

### Cách 1: Embed iframe
Nếu bạn muốn nhúng ứng dụng vào Taskspace:

```html
<iframe
  src="https://your-app-url.com?text=Hello&lang=en&auto=false"
  width="100%"
  height="600px"
  frameborder="0">
</iframe>
```

### Cách 2: Tạo Extension/Add-on
Để tạo add-on cho Taskspace, bạn cần:

1. **Tạo Google Workspace Add-on:**
   - Sử dụng Apps Script để tạo sidebar
   - Tích hợp UI của Text-to-Speech vào sidebar

```javascript
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Text to Speech')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('TTS')
    .addItem('Mở Text-to-Speech', 'showSidebar')
    .addToUi();
}
```

2. **Tạo file sidebar.html:**

```html
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body { font-family: Arial; padding: 10px; }
      textarea { width: 100%; height: 100px; margin: 10px 0; }
      button { width: 100%; padding: 10px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; }
      button:hover { background: #357ae8; }
      select { width: 100%; padding: 8px; margin: 10px 0; }
    </style>
  </head>
  <body>
    <h3>Text to Speech</h3>

    <label>Language:</label>
    <select id="language">
      <option value="ja">Japanese</option>
      <option value="en">English</option>
      <option value="vi">Vietnamese</option>
      <option value="zh-CN">Chinese</option>
    </select>

    <label>Text:</label>
    <textarea id="text" placeholder="Enter text..."></textarea>

    <button onclick="playAudio()">Play Audio</button>

    <script>
      function playAudio() {
        const text = document.getElementById('text').value;
        const language = document.getElementById('language').value;

        if (!text.trim()) {
          alert('Please enter text');
          return;
        }

        // Call Apps Script function
        google.script.run
          .withSuccessHandler(() => alert('Audio played!'))
          .withFailureHandler((error) => alert('Error: ' + error))
          .textToSpeech(text, language);
      }

      // Auto-fill from selected cell
      google.script.run
        .withSuccessHandler((text) => {
          if (text) document.getElementById('text').value = text;
        })
        .getSelectedCellValue();
    </script>
  </body>
</html>
```

---

## Mã ngôn ngữ (Language Codes)

| Ngôn ngữ | Mã |
|----------|-----|
| Japanese | ja |
| Chinese (Simplified) | zh-CN |
| English | en |
| Vietnamese | vi |

---

## Lưu ý quan trọng

1. **Giới hạn Google Apps Script:**
   - Mỗi script chỉ chạy tối đa 6 phút
   - Giới hạn số lượng request/ngày

2. **CORS:**
   - Edge Function đã cấu hình CORS để cho phép request từ Google Sheets

3. **Bảo mật:**
   - KHÔNG chia sẻ Supabase Anon Key công khai
   - Chỉ chia sẻ với người cần thiết

4. **Performance:**
   - Tránh gọi API quá nhiều lần trong thời gian ngắn
   - Sử dụng cache nếu cần

---

## Troubleshooting

### Lỗi CORS
- Đảm bảo Edge Function đã được deploy đúng
- Kiểm tra CORS headers trong Edge Function

### Lỗi Authorization
- Kiểm tra lại Supabase Anon Key
- Đảm bảo format header đúng: `Bearer YOUR_KEY`

### Không phát được âm thanh
- Kiểm tra console log trong Apps Script
- Xem response từ API
- Đảm bảo văn bản không rỗng

---

## Liên hệ & Hỗ trợ

Nếu bạn cần hỗ trợ thêm, hãy kiểm tra:
- Console logs trong Apps Script (View > Logs)
- Network tab trong DevTools
- Supabase Edge Function logs
