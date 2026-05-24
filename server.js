const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { initDB, getDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = initDB();

// ============================================================
//  Helpers
// ============================================================
function generateOrgId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let r = '';
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}
function generateToken() { return crypto.randomBytes(32).toString('hex'); }
function generateCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  const l = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return `AST-${n}-${l[Math.floor(Math.random()*l.length)]}${l[Math.floor(Math.random()*l.length)]}`;
}

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: '请先登入' });
  const inst = db.prepare('SELECT id, org_id, name, phone, brand_color FROM institutions WHERE auth_token = ?').get(h.slice(7));
  if (!inst) return res.status(401).json({ error: '登入已过期，请重新登入' });
  req.institution = inst;
  next();
}

// ============================================================
//  Report Templates (rich version, matching admin.html)
// ============================================================
const reports = {
  talent: {
    badge: '🌟', name: '审美天赋型', color: '#34c759',
    dimColor: ['#1a8a3f', '#2d9f4e', '#3db45e', '#4ec96e', '#5fde7e', '#6ff08e'],
    childType: '偏视觉型——注重画面整体感和秩序，同时也具备情感表达能力，两种认知模式协调发展',
    overview: `<p>亲爱的家长，恭喜您的孩子在本次审美敏感度测评中展现出<strong>卓越的审美天赋</strong>！</p><p>在全部六个维度的评估中，孩子的表现均处于同龄人中的领先水平。这不仅仅意味着孩子"喜欢画画"或"觉得好看"——测试结果清晰地表明，孩子对<strong>色彩、构图、细节、节奏</strong>有着与生俱来的敏感度和判断力，这是一种深层的审美认知能力，远超出简单的视觉偏好。</p><p>拥有这种天赋的孩子，在未来AI主导的时代将具备<strong>不可替代的竞争优势</strong>——因为审美力、创造力和情感感知力，正是机器无法复制的核心人类能力。</p>`,
    dimensions: [
      { name: '色彩感知力', icon: '🎨', score: 5, detail: `<p>孩子在色彩感知维度展现了<strong>极其出色的表现</strong>。测试显示，孩子对色彩的微妙差异非常敏感，能够区分和偏好协调、有层次感的色彩组合，而非简单追求高饱和度或杂乱无章的混搭。</p><p>这种能力意味着孩子天生具备"色彩眼"——ta能感知到普通人忽略的色彩情绪和氛围变化，比如暖色调带来的温暖感、冷色调带来的宁静感。色彩心理学研究表明，这种敏感度是艺术创作和设计思维的<strong>核心基础</strong>。</p>` },
      { name: '构图与秩序感', icon: '📐', score: 5, detail: `<p>在构图和秩序感知维度，孩子表现出<strong>天生的平衡感</strong>。ta能够直觉地判断视觉元素的排列是否合理——哪些安排让人感到舒适和谐，哪些显得杂乱无章。</p><p>这种能力非常可贵。构图感不仅仅是"会画画"那么简单，它反映了大脑对<strong>空间关系和视觉重量的精准计算能力</strong>。研究显示，具备良好构图感的孩子在逻辑思维、数学能力和空间想象力方面也往往表现优异。</p>` },
      { name: '想象力与创造力', icon: '✨', score: 5, detail: `<p>在想象力维度，孩子展现出<strong>开放而活跃的创造性思维</strong>。ta倾向于自由、有想象力的表达方式，而非机械地模仿标准模板。</p><p>这是AI时代最珍贵的品质之一。当机器能够完美复制一切"标准答案"时，真正的价值在于<strong>创造前所未有的东西</strong>。孩子天生具备这种创造冲动，这是未来创新能力的<strong>原始火种</strong>。</p>` },
      { name: '审美表达力', icon: '💬', score: 5, detail: `<p>在审美表达与主见维度，孩子的表现<strong>令人印象深刻</strong>。ta不仅有自己的审美偏好，还愿意并且能够表达出来。</p><p>很多孩子在日常中会"随便"或"无所谓"，但这其实可能是因为审美感知尚未觉醒。而您的孩子已经形成了<strong>清晰的审美判断标准</strong>，这是审美能力发展的重要里程碑。</p>` },
      { name: '细节敏锐度', icon: '🔍', score: 5, detail: `<p>在细节感知维度，孩子展现了<strong>超出年龄的敏锐度</strong>。ta能够注意到精致与粗糙的差别，对"用心"和"随意"有清晰的判断。</p><p>"细节决定成败"不仅仅是一句口号。对细节的敏感度直接关联到<strong>专注力、观察力和品质追求</strong>。具备这种能力的孩子，在未来的学习和工作中，会自然而然地追求卓越，不满足于"差不多"。</p>` },
      { name: '再现与表现认知', icon: '🖼️', score: 5, detail: `<p>根据帕森斯（Parsons, 1987）的审美判断发展理论，儿童对艺术作品的理解从"画了什么"（题材）逐步发展到"怎么画的"（形式与表现）。</p><p>您的孩子已经超越了"画得像就是好"的初级阶段，开始能够感知作品的<strong>风格特点、情感表达和形式美感</strong>。根据加德纳（Gardner）哈佛零点项目的研究，这一能力通常在9-13岁才开始形成，而您的孩子在这方面表现出<strong>超越同龄人的成熟度</strong>。</p>` }
    ],
    advice: `<p><strong>核心原则：以滋养代替教导，以体验代替说教</strong></p><ul class="advice-list"><li><strong>大量高品质输入</strong> — 带孩子参观美术馆、欣赏优秀设计、接触自然美学。</li><li><strong>保护创作自由</strong> — 不要用"画得像不像"来评价孩子的作品。</li><li><strong>鼓励审美表达</strong> — 当孩子分享审美感受时，认真倾听并展开对话。</li><li><strong>提供多元媒介</strong> — 黏土、拼贴、自然材料、数字绘画等多种创作媒介。</li></ul><p style="margin-top:12px;"><strong>专业建议：</strong>建议每周至少安排2-3次有引导的艺术体验活动。</p>`,
    plan: `<div class="plan-item"><span class="plan-day">家庭日活动</span>带孩子去美术馆/博物馆，每次只深入欣赏一件作品</div><div class="plan-item"><span class="plan-day">创意工作坊</span>每周一次"主题创作"，自由发挥</div><div class="plan-item"><span class="plan-day">审美日记</span>记录每天发现的"最美的东西"</div><div class="plan-item"><span class="plan-day">设计师视角</span>日常购物时让孩子参与选择，培养审美判断力</div>`
  },
  potential: {
    badge: '🌱', name: '审美潜力型', color: '#ff9500',
    dimColor: ['#cc7a00', '#db8c00', '#eb9e00', '#fab000', '#ffc233', '#ffd666'],
    childType: '偏中间型——兼具视觉观察力和情感感受力，有很好的培养弹性',
    overview: `<p>亲爱的家长，感谢您带孩子参与本次审美敏感度测评！孩子的测试结果显示，ta处于<strong>审美潜力型</strong>阶段——这是最令人期待的状态！</p><p>"潜力型"意味着孩子已经具备了<strong>良好的审美基础</strong>，对美有一定的感知力和兴趣，正处在审美启蒙的<strong>最佳窗口期</strong>。此时，正确的引导和系统的培养，将让孩子的审美能力实现爆发式的提升。</p>`,
    dimensions: [
      { name: '色彩感知力', icon: '🎨', score: 3, detail: `<p>在色彩感知维度，孩子处于<strong>基础发展阶段</strong>。ta能够对色彩产生反应和偏好，但对色彩的微妙层次和情感表达的感知还不够细腻。</p><p>6-12岁正是色彩感知发展的黄金期，通过有针对性的训练，孩子的色彩感知力可以在短时间内得到明显提升。</p>` },
      { name: '构图与秩序感', icon: '📐', score: 3, detail: `<p>在构图与秩序感知维度，孩子已经建立了<strong>初步的平衡意识</strong>。ta能够分辨简单的"好看"与"不好看"，但对构图原理和视觉节奏的理解尚处于直觉层面。</p><p><strong>提升方向：</strong>通过拼图、积木搭建、照片排列等游戏化的方式提升。</p>` },
      { name: '想象力与创造力', icon: '✨', score: 3, detail: `<p>在想象力维度，孩子处于<strong>待激发的状态</strong>。ta愿意接触和尝试，但在自由创作和标准化模板之间，尚倾向于安全的、有参照的方式。</p><p><strong>提升方向：</strong>创造"没有标准答案"的创作环境，开放式提问能有效激活创造性思维。</p>` },
      { name: '审美表达力', icon: '💬', score: 3, detail: `<p>在审美表达与主见维度，孩子展现出<strong>一定程度的审美意识</strong>，但还不够稳定和清晰。ta可能会有自己的想法，但容易被外界影响或不愿意表达。</p><p><strong>提升方向：</strong>在日常选择中给予孩子更多的决策权，并且尊重ta的选择。</p>` },
      { name: '细节敏锐度', icon: '🔍', score: 3, detail: `<p>在细节感知维度，孩子处于<strong>逐步发展的阶段</strong>。ta对明显的精致与粗糙有基本的辨别能力，但对更细微的差异和质感变化还不够敏感。</p><p><strong>提升方向：</strong>玩"找不同"游戏、观察树叶的脉络、对比不同布料的触感。</p>` },
      { name: '再现与表现认知', icon: '🖼️', score: 3, detail: `<p>孩子目前仍以"像不像"作为主要的审美判断标准，这完全符合7-10岁儿童的典型认知特征（加德纳称之为"写实高峰阶段"）。同时，孩子已开始展现出对画面<strong>情感和氛围</strong>的初步感知。</p><p><strong>提升方向：</strong>引导孩子关注"画面给你什么感觉"而非仅仅"画的是什么"。</p>` }
    ],
    advice: `<p><strong>核心原则：系统引导 + 趣味体验 + 持续鼓励</strong></p><ul class="advice-list"><li><strong>建立审美常规</strong> — 每天固定10-15分钟的"审美时间"。</li><li><strong>从兴趣切入</strong> — 从孩子感兴趣的主题切入进行审美引导。</li><li><strong>提供选择框架</strong> — 给孩子有限的选择，并引导ta说出理由。</li><li><strong>正面反馈循环</strong> — 给予具体的正面回应，而不是简单的"真棒"。</li></ul><p style="margin-top:12px;"><strong>专业建议：</strong>建议进行为期3-6个月的系统审美启蒙课程。这个阶段的孩子可塑性最强。</p>`,
    plan: `<div class="plan-item"><span class="plan-day">每日一赏</span>每天选一件物品，和孩子一起观察并说出它的3个"美的地方"</div><div class="plan-item"><span class="plan-day">色彩探险</span>每周设定一个"主题色日"</div><div class="plan-item"><span class="plan-day">创意故事</span>看完绘本后，让孩子用自己的方式"重画"其中一个场景</div><div class="plan-item"><span class="plan-day">小小策展人</span>每月一次"家庭展览"</div>`
  },
  beginner: {
    badge: '🌿', name: '审美待启蒙', color: '#af52de',
    dimColor: ['#8833c4', '#9a44d6', '#ac55e8', '#be66f0', '#d077f8', '#e288ff'],
    childType: '偏触觉型——更关注主观感受和情感体验，对客观写实的关注度尚在发展中，激发潜力后可形成独特的表达风格',
    overview: `<p>亲爱的家长，欢迎来到审美启蒙的世界！孩子的测试结果显示目前处于<strong>审美待启蒙</strong>阶段——这绝不是一个需要担心的结果，恰恰相反，这是一个<strong>充满希望的起点</strong>！</p><p>6-12岁正是审美启蒙的黄金时期，孩子的审美观尚未固化，像一张白纸，现在开始培养，可以描绘出最美的画卷。</p>`,
    dimensions: [
      { name: '色彩感知力', icon: '🎨', score: 2, detail: `<p>在色彩感知维度，孩子目前处于<strong>初步接触阶段</strong>。ta对色彩还没有形成清晰的偏好和敏感度。</p><p><strong>启蒙方向：</strong>从大自然入手，春天的嫩绿、秋天的金黄、天空的渐变色，都是最好的色彩教材。</p>` },
      { name: '构图与秩序感', icon: '📐', score: 2, detail: `<p>在构图与秩序感知维度，孩子尚处于<strong>萌芽状态</strong>。ta对画面是否"舒服"还没有明确的判断标准。</p><p><strong>启蒙方向：</strong>从整理和分类开始培养秩序感——玩"把玩具按大小排好"等游戏。</p>` },
      { name: '想象力与创造力', icon: '✨', score: 2, detail: `<p>在想象力维度，孩子的创造性思维目前处于<strong>沉睡状态</strong>。ta对标准化、有明确模板的方式更为熟悉。</p><p><strong>启蒙方向：</strong>创造一个"没有对错"的创作环境，用开放式游戏激发想象力。</p>` },
      { name: '审美表达力', icon: '💬', score: 2, detail: `<p>在审美表达与主见维度，孩子目前还没有建立起<strong>稳定的审美判断习惯</strong>。</p><p><strong>启蒙方向：</strong>从做"二选一"的简单选择开始，每次选择都是一次审美判断的练习。</p>` },
      { name: '细节敏锐度', icon: '🔍', score: 2, detail: `<p>在细节感知维度，孩子目前对视觉细节的关注度<strong>尚待开发</strong>。</p><p><strong>启蒙方向：</strong>用游戏的方式培养观察力——"寻宝游戏""放大镜观察"。</p>` },
      { name: '再现与表现认知', icon: '🖼️', score: 2, detail: `<p>根据帕森斯（Parsons）的审美发展理论，孩子正处于以个人主观偏好为主的审美判断初始阶段。</p><p><strong>启蒙方向：</strong>提供丰富的审美体验，不做评判性要求，用开放式提问引导观察。</p>` }
    ],
    advice: `<p><strong>核心原则：不焦虑 · 慢慢来 · 玩中学</strong></p><ul class="advice-list"><li><strong>从零压力体验开始</strong> — 让孩子在轻松愉快的氛围中接触美。</li><li><strong>唤醒五感</strong> — 多感官的审美体验能加速审美认知的建立。</li><li><strong>榜样示范</strong> — 孩子是父母的镜子，在生活中展现对美的热爱。</li><li><strong>小步子原则</strong> — 每次设定小小的可达成目标。</li></ul><p style="margin-top:12px;"><strong>专业建议：</strong>建议先从轻松的审美体验活动开始，培养孩子的审美兴趣和感知习惯。</p>`,
    plan: `<div class="plan-item"><span class="plan-day">自然观察</span>每周一次"自然寻宝"——找不同颜色、不同形状的叶子</div><div class="plan-item"><span class="plan-day">五感体验</span>蒙眼触摸不同材质的物品，建立质感认知</div><div class="plan-item"><span class="plan-day">色彩游戏</span>用水彩/彩泥玩"颜色混合"</div><div class="plan-item"><span class="plan-day">小小选择</span>每天给孩子1-2个审美选择的机会，尊重ta的决定</div>`
  }
};

// ============================================================
//  Auth Routes
// ============================================================
app.post('/api/auth/register', (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: '请填写所有字段' });
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });

  const exists = db.prepare('SELECT id FROM institutions WHERE phone = ?').get(phone);
  if (exists) return res.status(409).json({ error: '该手机号已注册' });

  const org_id = generateOrgId();
  while (db.prepare('SELECT id FROM institutions WHERE org_id = ?').get(org_id)) {
    org_id = generateOrgId();
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const auth_token = generateToken();

  db.prepare('INSERT INTO institutions (org_id, name, phone, password_hash, auth_token) VALUES (?,?,?,?,?)')
    .run(org_id, name, phone, password_hash, auth_token);

  res.json({ org_id, name, auth_token });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: '请填写手机号和密码' });

  const inst = db.prepare('SELECT * FROM institutions WHERE phone = ?').get(phone);
  if (!inst) return res.status(401).json({ error: '手机号未注册' });
  if (!bcrypt.compareSync(password, inst.password_hash)) return res.status(401).json({ error: '密码错误' });

  const auth_token = generateToken();
  db.prepare('UPDATE institutions SET auth_token = ? WHERE id = ?').run(auth_token, inst.id);

  res.json({ org_id: inst.org_id, name: inst.name, brand_color: inst.brand_color, auth_token });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(req.institution);
});

// ============================================================
//  Institution (public)
// ============================================================
app.get('/api/institution/:orgId', (req, res) => {
  const inst = db.prepare('SELECT org_id, name, brand_color FROM institutions WHERE org_id = ?').get(req.params.orgId);
  if (!inst) return res.status(404).json({ error: '机构未找到' });
  res.json(inst);
});

// ============================================================
//  Reports
// ============================================================
app.post('/api/submit', (req, res) => {
  const { org_id, tier, total, answers, scores, timestamp } = req.body;
  if (!tier || total === undefined) return res.status(400).json({ error: '缺少必要字段' });

  let code = req.body.code || generateCode();
  while (db.prepare('SELECT id FROM reports WHERE code = ?').get(code)) {
    code = generateCode();
  }

  db.prepare('INSERT INTO reports (code, org_id, tier, total, answers, scores, timestamp) VALUES (?,?,?,?,?,?,?)')
    .run(code, org_id || '', tier, total,
      JSON.stringify(answers || []), JSON.stringify(scores || []),
      timestamp || new Date().toISOString());

  res.json({ success: true, code, tier });
});

app.get('/api/report/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const record = db.prepare('SELECT * FROM reports WHERE code = ?').get(code);
  if (!record) return res.status(404).json({ error: '领取码未找到，请确认输入正确' });

  res.json({
    code: record.code,
    tier: record.tier,
    total: record.total,
    answers: JSON.parse(record.answers || '[]'),
    scores: JSON.parse(record.scores || '[]'),
    timestamp: record.timestamp,
    report: { ...reports[record.tier] }
  });
});

app.get('/api/reports', requireAuth, (req, res) => {
  const { org_id } = req.institution;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as c FROM reports WHERE org_id = ?').get(org_id).c;
  const rows = db.prepare('SELECT code, tier, total, timestamp FROM reports WHERE org_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(org_id, limit, offset);

  res.json({ total, page, limit, reports: rows, templates: reports });
});

// ============================================================
//  Start
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('🎨 审美测试 SaaS 服务已启动');
  console.log(`📱 测试页面: http://localhost:${PORT}`);
  console.log(`🏪 机构登入: http://localhost:${PORT}/login.html`);
  console.log(`📝 机构注册: http://localhost:${PORT}/register.html`);
  console.log(`🔧 机构后台: http://localhost:${PORT}/dashboard.html`);
  console.log(`📋 管理后台: http://localhost:${PORT}/admin.html`);
  console.log(`🔑 机构测试链接: http://localhost:${PORT}/?org=你的机构码`);
});
