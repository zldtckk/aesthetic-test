const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// ============================================================
//  Report Templates (shared with admin page)
// ============================================================
const reports = {
  talent: {
    badge: '🌟',
    name: '审美天赋型',
    tagline: 'Top 30% · 天生敏感 · 审美出众',
    color: '#34c759',
    keywords: ['天生敏感', '色彩感强', '构图感好', '想象力丰富', '节奏感好'],
    strengths: [
      '对美有天然感知力，能主动发现和欣赏生活中的美',
      '色彩搭配直觉出色，用色大胆且和谐',
      '构图意识强，画面组织有balance感',
      '审美品味突出，有自己明确的喜好和判断',
      '对色彩情绪和视觉节奏有敏锐感知'
    ],
    aiValue: '创造力 + 审美力是 AI 无法替代的核心能力。孩子的天生审美敏感度，是未来最稀缺的竞争力。',
    advice: '重点发展艺术感知与创意表达，多接触高品质的艺术作品、设计、自然美学。避免被模板化教学限制，鼓励自由创作和审美表达。'
  },
  potential: {
    badge: '🌱',
    name: '审美潜力型',
    tagline: 'Top 80% · 基础良好 · 可塑性强',
    color: '#ff9500',
    keywords: ['基础好', '可塑性强', '愿意感受', '潜力大', '可挖掘'],
    strengths: [
      '有一定的审美意识，愿意接触和感受美',
      '对色彩、构图有基本的感知能力',
      '经过系统引导后，审美能力提升空间极大',
      '处于审美启蒙的关键窗口期',
      '有培养潜质，引导后进步明显'
    ],
    aiValue: '审美是未来核心竞争力，现在开始培养性价比最高。孩子的审美潜力一旦被激活，将成为伴随一生的优势。',
    advice: '系统进行审美启蒙 + 美术基础训练，从色彩认知、构图原理、艺术欣赏入手。坚持半年左右，审美气质会有明显提升。'
  },
  beginner: {
    badge: '🌿',
    name: '审美待启蒙',
    tagline: 'Top 100% · 黄金启蒙期 · 潜力无限',
    color: '#af52de',
    keywords: ['兴趣待激发', '感知待培养', '年龄小', '无限可能', '黄金期'],
    strengths: [
      '年龄尚小，审美观尚未固化，可塑性极强',
      '正处于审美启蒙的黄金时期',
      '没有固定思维模式，吸收能力强',
      '一旦建立审美认知，进步会非常迅速',
      '现在开始培养，能打下扎实的审美基础'
    ],
    aiValue: '知识可以被 AI 替代，但审美越早培养，未来差距越大。现在就是开始审美启蒙的最佳时机。',
    advice: '从色彩感知、构图欣赏、艺术体验开始，用游戏化的方式建立审美认知。多带孩子观察自然、欣赏艺术作品、接触美好事物，快速建立审美基础。'
  }
};

// ============================================================
//  Read / Write helpers
// ============================================================
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Read error:', e.message);
  }
  return {};
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================================
//  API Routes
// ============================================================

// Submit test results
app.post('/api/submit', (req, res) => {
  const { code, tier, total, answers, scores, timestamp } = req.body;

  if (!code || !tier) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const data = readData();
  data[code] = {
    tier,
    total,
    answers,
    scores,
    timestamp: timestamp || new Date().toISOString(),
    report: reports[tier]
  };

  writeData(data);
  res.json({ success: true, code, tier });
});

// Get report by code
app.get('/api/report/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const data = readData();
  const record = data[code];

  if (!record) {
    return res.status(404).json({ error: '领取码未找到，请确认输入正确' });
  }

  res.json({
    code,
    ...record
  });
});

// List all reports (for admin)
app.get('/api/reports', (req, res) => {
  const data = readData();
  const list = Object.entries(data).map(([code, r]) => ({
    code,
    tier: r.tier,
    total: r.total,
    timestamp: r.timestamp
  }));
  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(list);
});

// ============================================================
//  Start
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 审美测试服务已启动`);
  console.log(`📱 前端页面: http://localhost:${PORT}`);
  console.log(`🔧 管理后台: http://localhost:${PORT}/admin.html`);
  console.log(`📡 局域网访问: http://<本机IP>:${PORT}`);
});
