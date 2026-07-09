import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function safeJsonParse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true, aiEnabled: Boolean(process.env.OPENAI_API_KEY), model: MODEL });
});

app.post('/api/suggest-meaning', async (req, res) => {
  const word = String(req.body?.word || '').trim();

  if (!word) {
    return res.status(400).json({ error: 'Bạn chưa nhập từ tiếng Hàn.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'Chưa cấu hình OPENAI_API_KEY. Hãy tạo file .env từ .env.example rồi chạy lại server.'
    });
  }

  const prompt = `Bạn là trợ lý học tiếng Hàn cho người Việt. Hãy cho nghĩa tiếng Việt của từ/cụm từ tiếng Hàn sau.

Từ/cụm từ: ${word}

Chỉ trả về JSON hợp lệ, không markdown, đúng dạng:
{
  "korean": "từ/cụm từ tiếng Hàn chuẩn",
  "vietnamese": "nghĩa tiếng Việt ngắn gọn, tự nhiên; nếu có nhiều nghĩa phổ biến thì ngăn cách bằng dấu chấm phẩy"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'AI request thất bại.',
        detail: errorText.slice(0, 500)
      });
    }

    const data = await response.json();
    const outputText = data.output_text || data.output?.flatMap(item => item.content || [])
      .map(content => content.text || '')
      .join('\n') || '';

    const parsed = safeJsonParse(outputText);
    if (!parsed) {
      return res.status(502).json({ error: 'AI trả về dữ liệu không đọc được.', raw: outputText });
    }

    res.json({
      korean: String(parsed.korean || word).trim(),
      vietnamese: String(parsed.vietnamese || '').trim()
    });
  } catch (error) {
    res.status(500).json({ error: 'Không gọi được AI server.', detail: error.message });
  }
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Korean Quizlet AI app: http://localhost:${PORT}`);
});
