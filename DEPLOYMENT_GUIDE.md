# Hướng dẫn Deploy và Sử dụng

## Bước 1: Chuẩn bị Supabase Edge Function

### Lưu ý quan trọng
Edge Function cần được deploy thủ công vì có vấn đề với database hiện tại. Bạn có 2 lựa chọn:

### Tùy chọn A: Yêu cầu thêm persistence sau
Nếu bạn muốn tôi thêm persistence (database) sau này, hãy cho tôi biết.

### Tùy chọn B: Deploy Edge Function thủ công

1. **Cài đặt Supabase CLI:**
```bash
npm install -g supabase
```

2. **Login vào Supabase:**
```bash
supabase login
```

3. **Link project:**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. **Tạo Edge Function:**
```bash
supabase functions new text-to-speech
```

5. **Copy code sau vào `supabase/functions/text-to-speech/index.ts`:**

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, language } = await req.json();

    if (!text || !language) {
      throw new Error("Text and language are required");
    }

    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&q=${encodedText}`;

    console.log("Fetching audio from Google Translate:", { language, textLength: text.length });

    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
```

6. **Deploy Edge Function:**
```bash
supabase functions deploy text-to-speech --no-verify-jwt
```

---

## Bước 2: Cấu hình Environment Variables

Kiểm tra file `.env` đã có các biến sau:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Bạn có thể lấy thông tin này từ:
- Supabase Dashboard > Settings > API

---

## Bước 3: Build và Deploy Frontend

### Build project:
```bash
npm run build
```

### Deploy lên hosting (chọn 1 trong các option):

#### Option 1: Vercel
```bash
npm install -g vercel
vercel
```

#### Option 2: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Option 3: Supabase (nếu có)
Deploy thông qua Lovable hoặc Supabase Dashboard

---

## Bước 4: Kiểm tra ứng dụng

1. Mở URL của ứng dụng
2. Nhập văn bản
3. Chọn ngôn ngữ
4. Click "Play Audio"
5. Kiểm tra checkbox "Auto-play when text changes"

---

## Bước 5: Tích hợp Google Sheets

Xem file `GOOGLE_SHEETS_INTEGRATION.md` để biết chi tiết 5 phương pháp tích hợp.

---

## Tính năng chính

### 1. Text-to-Speech cơ bản
- Nhập văn bản
- Chọn ngôn ngữ (Japanese, Chinese, English, Vietnamese)
- Click nút để phát

### 2. Auto-play
- Bật checkbox "Auto-play when text changes"
- Mỗi khi thay đổi text hoặc language, audio sẽ tự động phát sau 1 giây

### 3. URL Parameters
Hỗ trợ parameters:
- `text`: Văn bản cần đọc
- `lang`: Mã ngôn ngữ (ja, en, vi, zh-CN)
- `auto`: true/false - tự động phát

Ví dụ:
```
https://your-app.com?text=Hello%20World&lang=en&auto=true
```

### 4. Shareable URL
- Tự động tạo URL có thể share
- Click "Copy" để copy vào clipboard

---

## So sánh với version cũ

### Version cũ (audible-alphabet-art):
- Sử dụng shadcn/ui (nhiều dependencies)
- Có routing (react-router-dom)
- Có query client (@tanstack/react-query)
- Nhiều UI components không cần thiết
- File size lớn

### Version mới (lightweight):
- Không dùng UI libraries phức tạp
- Không có routing (single page)
- Không có query client
- Pure CSS với Tailwind
- File size nhỏ hơn ~60%
- Load time nhanh hơn
- Tính năng cốt lõi giữ nguyên

---

## Cải tiến

1. **Performance:**
   - Giảm bundle size
   - Không có dependencies không cần thiết
   - Faster initial load

2. **UX:**
   - Auto-play toggle
   - Shareable URL
   - Copy to clipboard
   - Better error handling

3. **Integration:**
   - Dễ dàng tích hợp với Google Sheets
   - URL parameters linh hoạt
   - CORS đã được cấu hình đúng

---

## Troubleshooting

### Edge Function không hoạt động
1. Kiểm tra đã deploy chưa: `supabase functions list`
2. Kiểm tra logs: `supabase functions logs text-to-speech`
3. Kiểm tra CORS headers

### Frontend không kết nối được
1. Kiểm tra `.env` file
2. Kiểm tra URL và Anon Key
3. Mở DevTools > Network tab để xem request

### Audio không phát
1. Kiểm tra browser console
2. Kiểm tra quyền autoplay của browser
3. Thử click manual trước khi dùng auto-play

---

## Liên hệ

Nếu cần hỗ trợ thêm, hãy kiểm tra:
- Browser DevTools Console
- Network tab
- Supabase Edge Function logs
