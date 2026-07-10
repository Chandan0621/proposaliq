const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ---- GEMINI AI ENDPOINT ----
app.post('/api/analyze', async (req, res) => {
  const { jobPost, skill, exp, tone, platform } = req.body;

  if (!jobPost || jobPost.trim().length < 10) {
    return res.status(400).json({ error: 'Job post is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If API key is present, use real Gemini AI
  if (apiKey) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
You are ProposalIQ, an expert AI assistant for freelancers. Analyze the following job post and return ONLY a valid JSON object (no markdown, no explanation, just raw JSON).

Job Post: """${jobPost}"""
Freelancer Skill: ${skill || 'General'}
Experience Level: ${exp || 'Intermediate'}
Preferred Tone: ${tone || 'professional'}
Platform: ${platform || 'Upwork'}

Return this exact JSON structure:
{
  "replyChance": <number 0-100>,
  "clientPersonality": "<one of: Detail-Oriented, Fast-Paced Executor, Budget-Conscious, Quality Seeker, Visionary Builder, Micromanager, Collaborative Partner>",
  "urgencyLevel": "<Low | Medium | High>",
  "urgencyScore": <number 0-100>,
  "budgetSeriousness": "<Unclear | Moderate | Serious>",
  "budgetScore": <number 0-100>,
  "ghostingRisk": "<Low | Medium | High>",
  "ghostScore": <number 0-100>,
  "scamRisk": "<Low | Medium | High>",
  "scamScore": <number 0-100>,
  "trustLevel": "<Low | Moderate | High>",
  "trustScore": <number 0-100>,
  "recommendedStrategy": "<2-3 sentence actionable strategy for winning this job>",
  "pricingConfidence": <number 0-100>,
  "painPoints": ["<pain 1>", "<pain 2>", "<pain 3>", "<pain 4>"],
  "clientWants": ["<want 1>", "<want 2>", "<want 3>", "<want 4>"],
  "thingsToAvoid": ["<avoid 1>", "<avoid 2>", "<avoid 3>", "<avoid 4>"],
  "aiTips": ["<tip 1>", "<tip 2>", "<tip 3>", "<tip 4>"],
  "proposal": "<The final highly tailored, conversion-optimized proposal generated following the strict workflow below.>"
}

CRITICAL STRUCTURAL WORKFLOW FOR THE "proposal" FIELD:

STEP 1 — Extract before generating:
Identify and store the following details from the job post:
- Specific client complaints, frustrations, or bad experiences (e.g. "writers who write generic fluff content that does not add real value").
- Explicit requests or mandatory inclusions (e.g., "please include writing samples, turnaround time, research approach").
- Budget or price range mentioned (e.g. "$250").
- Specific skill requirements and tone of the post.

STEP 2 — Generate using extracted data:
- OPENING: Start directly by addressing the client's specific pain point or frustration in the first 1-2 sentences. Do NOT use generic openings like "Your project caught my attention" or "I am a qualified professional". Address the exact issue immediately.
- MANDATORY INCLUSIONS: Explicitly answer/provide every single item requested in the job description in the exact order they were requested.
- PRICING: Reference realistic pricing aligned with their budget (or request clarification on scope if the budget range is too wide).
- NO RESUME FORMATTING: Do NOT use resume-style bullet points (e.g., "→ Technical expertise: X") or structured templates. Write in natural, fluid paragraphs or short-line conversational form.
- NO UNVERIFIABLE CLAIMS: Do NOT invent fake personal statistics like "10+ similar projects completed" or "20% faster turnaround than others". Only make claims that address the specific job scope.
- COMMUNICATION MATCHING: Align communication updates to the client's preference (e.g. do not promise "daily updates" if the client mentions "async across time zones").
- NO EMOJIS: Use zero emojis by default.

STEP 3 — Self-Validation Check:
Before outputting, execute this mental check: "Does this generated proposal explicitly address the key pain points and every single list item requested in the job description?" If anything is missing or generic, rewrite the proposal text to be fully specific before returning the final JSON.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Extract JSON safely
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid AI response format');

      const data = JSON.parse(jsonMatch[0]);
      return res.json({ success: true, data, source: 'gemini' });

    } catch (err) {
      console.error('Gemini error:', err.message);
      // Fall through to simulation
    }
  }

  // ---- FALLBACK: Simulated AI (no API key needed) ----
  const data = simulateAnalysis(jobPost, skill, exp, tone, platform);
  return res.json({ success: true, data, source: 'simulation' });
});

// ---- SIMULATION ENGINE (Fallback) ----
function simulateAnalysis(jobPost, skill, exp, tone, platform) {
  const text = jobPost.toLowerCase();

  const urgencyScore = text.includes('asap') || text.includes('urgent') || text.includes('immediately') ? 85
    : text.includes('soon') || text.includes('quickly') ? 65 : 30;

  const budgetScore = text.includes('$') || text.includes('budget') || text.includes('pay') ? 80 : 45;

  const scamScore = text.includes('upfront') || text.includes('wire') || text.includes('gift card') ? 88
    : text.includes('western union') || text.includes('crypto payment') ? 92
    : text.includes('verified') || text.includes('payment protected') ? 8 : 18;

  const ghostScore = urgencyScore > 70 ? 18 : budgetScore < 50 ? 62 : 32;
  const replyChance = Math.min(95, Math.max(38, 100 - ghostScore * 0.3 - scamScore * 0.15 + budgetScore * 0.3 + urgencyScore * 0.1));
  const trustScore = Math.max(5, 100 - scamScore);
  const pricingConf = budgetScore > 60 ? 76 : 50;

  const personalities = ['Detail-Oriented', 'Fast-Paced Executor', 'Budget-Conscious', 'Quality Seeker', 'Visionary Builder'];
  const clientPersonality = personalities[Math.floor(Math.random() * personalities.length)];

  const strategies = [
    'Lead with a quick win offer. Show you understand their core problem in the first sentence. Keep the proposal under 200 words and end with one smart, specific question.',
    'Highlight your portfolio upfront. This client values credibility — name past clients or measurable results immediately.',
    'Use a confident, structured proposal: understanding → approach → timeline → price. Be direct and avoid filler words.',
    'Mirror the client\'s urgency. Mention fast turnaround, propose a quick discovery call, and keep the proposal punchy and action-focused.',
    'Focus on ROI per dollar. This client is budget-conscious — demonstrate value, and consider offering milestone-based pricing.',
  ];

  const skillName = skill || 'your field';
  const expLabel = exp || 'experienced';
  const greetings = { professional: 'Hello,', friendly: 'Hi there!', bold: 'Let\'s get straight to what matters —', conversational: 'Hey! Just read your post and here\'s my take:' };
  const greeting = greetings[tone] || 'Hello,';
  const closes = { professional: 'I look forward to discussing this.', friendly: 'Happy to chat anytime! 😊', bold: 'Message me — let\'s move fast.', conversational: 'What\'s your ideal start date?' };

  const proposal = `${greeting}

I've reviewed your job post carefully and I understand exactly what you need. ${expLabel.includes('Expert') || expLabel.includes('Senior') ? 'With 5+ years of hands-on experience in' : 'As a dedicated professional in'} ${skillName}, I've delivered similar projects successfully on ${platform || 'Upwork'}.

Here's my approach:
→ Day 1: Full requirements discovery & project plan
→ Day 2-3: First working milestone delivered for your review
→ Ongoing: Daily updates until completion — no radio silence

Why choose me?
✓ Deep expertise in ${skillName}
✓ On-time delivery — always
✓ Clean, scalable, well-documented work
✓ Full revisions until you're 100% satisfied

${closes[tone] || closes.professional} What's the one thing that's most critical to get right in this project?`;

  return {
    replyChance: Math.round(replyChance),
    clientPersonality,
    urgencyLevel: urgencyScore > 70 ? 'High' : urgencyScore > 40 ? 'Medium' : 'Low',
    urgencyScore,
    budgetSeriousness: budgetScore > 70 ? 'Serious' : budgetScore > 40 ? 'Moderate' : 'Unclear',
    budgetScore,
    ghostingRisk: ghostScore > 60 ? 'High' : ghostScore > 35 ? 'Medium' : 'Low',
    ghostScore,
    scamRisk: scamScore > 70 ? 'High' : scamScore > 40 ? 'Medium' : 'Low',
    scamScore,
    trustLevel: trustScore > 80 ? 'High' : trustScore > 50 ? 'Moderate' : 'Low',
    trustScore,
    recommendedStrategy: strategies[Math.floor(Math.random() * strategies.length)],
    pricingConfidence: pricingConf,
    painPoints: [
      'Struggling to find reliable, communicative freelancers',
      'Previous hires missed deadlines or delivered poor quality',
      'Budget constraints with high quality expectations',
      'Lack of clear updates during project execution',
    ],
    clientWants: [
      'Fast turnaround without compromising quality',
      'Proactive daily communication',
      'Clean, scalable final deliverable',
      'Someone who truly understands their vision',
    ],
    thingsToAvoid: [
      'Generic copy-paste proposals — they can tell instantly',
      'Promising unrealistic timelines just to win the bid',
      'Asking too many vague questions before starting',
      'Mentioning your hourly rate in the first paragraph',
    ],
    aiTips: [
      'Open with their exact pain point — not "I am a developer"',
      'Show 1 relevant portfolio link within first 3 sentences',
      'End with exactly one specific, smart question',
      'Use keywords from their job post naturally in your text',
    ],
    proposal,
  };
}

// ---- VERCEL BACKEND API FOR LOCAL TESTING ----
const generateApi = require('./api/generate.js');
app.post('/api/generate', generateApi);

// ---- HEALTH CHECK ----
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ---- START ----
app.listen(PORT, () => {
  console.log(`✅ ProposalIQ server running on port ${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY not set — running in simulation mode');
  } else {
    console.log('🤖 Gemini AI connected and ready!');
  }
});
