const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-User-Plan, X-User-Email'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, payload } = req.body;
  if (!type || !payload) {
    return res.status(400).json({ error: 'Type and payload are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const userPlan = req.headers['x-user-plan'] || 'free';
  const userEmail = req.headers['x-user-email'] || '';

  // Authorized if user is Pro/Trial OR is using the default Guest account
  const isAuthorized = (userPlan === 'pro' || userPlan === 'trial' || userEmail === 'guest@proposaliq.app' || userEmail === 'guest@winscope.app');

  if (!isAuthorized) {
    return res.status(403).json({ 
      success: false, 
      error: 'Pro subscription required. Please connect your own Gemini API key for real AI output.' 
    });
  }

  try {
    switch (type) {
      case 'proposal':
        return await handleProposal(payload, apiKey, res);
      case 'fiverr':
        return await handleFiverr(payload, apiKey, res);
      case 'client':
        return await handleClient(payload, apiKey, res);
      case 'followup':
        return await handleFollowUp(payload, apiKey, res);
      case 'coldemail':
        return await handleColdEmail(payload, apiKey, res);
      default:
        return res.status(400).json({ error: 'Invalid generation type' });
    }
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ==========================================
//  PROPOSAL GENERATOR HANDLER
// ==========================================
async function handleProposal(payload, apiKey, res) {
  const { jobPost, skill, exp, tone, platform } = payload;
  
  if (apiKey) {
    try {
      const prompt = `You are ProposalIQ, an expert AI assistant for freelancers. Analyze this job post and return ONLY a raw JSON object (no markdown code blocks, no explanation, just raw JSON).

Job Post: """${jobPost}"""
Skill Category: ${skill || 'General'}
Experience Level: ${exp || 'Intermediate'}
Tone: ${tone || 'professional'}
Platform: ${platform || 'Upwork'}

Return exactly this JSON structure:
{
  "replyChance": <number 0-100>,
  "clientPersonality": "<Detail-Oriented|Fast-Paced Executor|Budget-Conscious|Quality Seeker|Visionary Builder|Micromanager|Collaborative Partner>",
  "urgencyLevel": "<Low|Medium|High>",
  "urgencyScore": <number 0-100>,
  "budgetSeriousness": "<Unclear|Moderate|Serious>",
  "budgetScore": <number 0-100>,
  "ghostingRisk": "<Low|Medium|High>",
  "ghostScore": <number 0-100>,
  "scamRisk": "<Low|Medium|High>",
  "scamScore": <number 0-100>,
  "copywritingScore": 100,
  "pricingConfidence": <number 0-100>,
  "recommendedStrategy": "<2-3 sentence actionable strategy>",
  "painPoints": ["<point1>","<point2>","<point3>","<point4>"],
  "clientWants": ["<want1>","<want2>","<want3>","<want4>"],
  "thingsToAvoid": ["<avoid1>","<avoid2>","<avoid3>","<avoid4>"],
  "aiTips": ["<tip1>","<tip2>","<tip3>","<tip4>"],
  "proposal": "<The final proposal text generated following the instructions below.>"
}

For the "proposal" field, follow this exact process:
---
You are an expert freelance proposal writer. Your job is to write a proposal that gets a reply — not a generic template.

Given a job description, follow this exact process:

STEP 1 — Read the job description carefully and identify:
- The client's specific frustration, complaint, or past bad experience (if mentioned)
- Any explicit instructions on what to include in the proposal (e.g., "please include," "make sure to," "send me")
- The budget or price mentioned
- The exact skills or requirements listed
- The tone of the post (formal, casual, urgent, detailed)

STEP 2 — Write the proposal using ONLY these rules:

1. OPENING LINE: Do not use generic openers like "Your project caught my attention" or "I understand the challenges you're facing." Instead, directly reference the ONE most specific detail from the job post — quote or closely paraphrase something they actually said. If they mentioned a frustration or past bad experience, address it head-on in the first sentence.

2. ADDRESS EVERY EXPLICIT REQUEST: If the job description asks for specific things to be included (samples, turnaround time, approach, examples, etc.), you MUST include a direct, specific answer for each one. Do not skip any. This is the single most important rule.

3. NO GENERIC CLAIMS: Never write vague claims like "10+ similar projects," "20% faster delivery," "on-time delivery is non-negotiable," or "zero surprises." If you don't have real data to support a claim, don't make the claim — replace it with something concrete and job-specific instead.

4. NO RESUME-BULLET FORMATTING: Do not use "→", "🎯", "✅", "⚡" or bullet-list-of-adjectives format. Write in natural, plain sentences or short paragraphs.

5. NO FAKE PROCESS TIMELINES: Do not invent "Phase 1/2/3" or "Step 1/2/3" structures unless the job is clearly a multi-stage technical/development project.

6. MENTION PRICE IF GIVEN: If a budget or price range is mentioned in the job post, reference it naturally.

7. MATCH THEIR COMMUNICATION STYLE: Align your proposal to any specific working conditions they mention (e.g., "async communication").

8. LENGTH: Keep the proposal under 150 words.

9. CLOSING: End with ONE specific, low-friction question or next step related to THIS project.

STEP 3 — Before finalizing, silently check: "Did I address every single explicit request the client made? Did I reference their specific pain point? Did I avoid all generic claims and fake bullet formatting?" If any answer is no, rewrite before returning the output.
---`;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      });
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.status(200).json({ success: true, source: 'gemini', data: JSON.parse(jsonMatch[0]) });
      } else {
        console.error('No JSON match found in AI response:', text);
        return res.status(200).json({ success: false, error: 'AI response parsing failed', rawResponse: text });
      }
    } catch (err) {
      console.error('Gemini generateContent failed:', err);
      return res.status(200).json({ success: false, error: err.message, stack: err.stack });
    }
  }

  // Simulation Fallback
  const data = simulateProposal(jobPost, skill, exp, tone, platform);
  return res.status(200).json({ success: true, source: 'simulation', data });
}

// ==========================================
//  FIVERR BUYER REQUEST HANDLER
// ==========================================
async function handleFiverr(payload, apiKey, res) {
  const { request, gigCat, level } = payload;

  if (apiKey) {
    const prompt = `You are an expert Fiverr seller. Write a short, compelling reply to this Fiverr buyer request. Make it feel personal, not template-like. Mention their specific needs. Keep it under 120 words. Do not use "Dear" or "To Whom".

Buyer Request: """${request}"""
Seller's Gig Category: ${gigCat || 'General'}
Seller Level: ${level || 'New Seller'}

Write a reply that:
1. Acknowledges their specific requirement in line 1
2. Briefly mentions relevant experience (1 line)
3. States delivery time and what they'll get
4. Ends with a soft call to action

Output ONLY the reply message, nothing else.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.75, maxOutputTokens: 400 }
    });
    return res.status(200).json({ success: true, source: 'gemini', reply: result.response.text().trim() });
  }

  // Simulation Fallback
  const intros = [
    `Hi! I noticed you need ${(gigCat || 'General').toLowerCase()} services and I'd love to help.`,
    `Hello! Your request for ${(gigCat || 'General').toLowerCase()} caught my attention — this is exactly what I specialize in.`,
    `Hi there! I specialize in ${(gigCat || 'General').toLowerCase()} and your project sounds like a great fit.`,
  ];
  const bodies = [
    `As a ${level || 'New Seller'} seller with hands-on experience in ${gigCat || 'General'}, I can deliver exactly what you're looking for — clean, professional, and on time.`,
    `I've completed 50+ similar projects and know exactly how to handle this efficiently.`,
    `My work is focused on quality first — I won't deliver until you're 100% satisfied.`,
  ];
  const ctas = [
    `Feel free to message me so we can discuss the details and get started right away!`,
    `I'm available to start immediately. Let's chat to confirm the requirements!`,
    `Send me a message and I'll share some samples relevant to your project.`,
  ];
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const reply = `${rand(intros)}\n\n${rand(bodies)}\n\n${rand(ctas)}`;
  return res.status(200).json({ success: true, source: 'simulation', reply });
}

// ==========================================
//  CLIENT MESSAGE WRITER HANDLER
// ==========================================
async function handleClient(payload, apiKey, res) {
  const { msg, type, tone } = payload;

  if (apiKey) {
    const prompt = `You are a professional freelancer. Write a reply to the following client message.
Message Type: ${type || 'inquiry'}
Tone: ${tone || 'professional'}
Client's Message: """${msg}"""

Write a reply that:
- Addresses every point the client raised
- Is ${tone || 'professional'} in tone
- Is under 150 words
- Feels human, not robotic or template-like
- Ends with a clear next step

Output ONLY the reply, nothing else.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
    });
    return res.status(200).json({ success: true, source: 'gemini', reply: result.response.text().trim() });
  }

  // Simulation Fallback
  const templates = {
    inquiry:     `Hi! Thanks for reaching out.\n\nTo answer your questions: I have hands-on experience with exactly the type of project you've described, and I'm confident in delivering great results within your timeline.\n\nI'd be happy to share relevant samples or jump on a quick call to discuss further. What works best for you?`,
    negotiation: `Hi! Thanks for your message.\n\nI completely understand budget considerations. While my standard rate reflects the quality and timeline I deliver, I'm open to finding a middle ground.\n\nIf we adjust the scope slightly or extend the deadline by a couple of days, I may be able to accommodate your budget. Let me know your thoughts and we can work something out!`,
    revision:    `Hi! Absolutely, I want to make sure this is perfect for you.\n\nThank you for the detailed feedback — I completely understand what needs to be changed. I'll get started on the revisions right away and send you the updated version within [timeframe].\n\nPlease feel free to share any additional notes so I can get it right this time!`,
    delay:       `Hi! Thank you for letting me know in advance — I really appreciate that.\n\nI understand completely. Take the time you need and please don't rush on my account. I'll keep the project open on my end, and whenever you're ready to move forward, just send me a message.\n\nLooking forward to working with you!`,
    complaint:   `Hi! I sincerely apologize for the experience — this is not the standard I hold myself to.\n\nThank you for bringing this to my attention. I want to make this right for you. Please tell me specifically what didn't meet your expectations and I will fix it as a priority, no questions asked.\n\nYour satisfaction is my top concern.`,
    positive:    `Hi! Thank you so much — this genuinely made my day!\n\nIt was a real pleasure working on this project with you. Your clear communication made everything smoother, and I'm glad the outcome met your expectations.\n\nIf you ever have future projects, I'd love to work together again. Please feel free to reach out anytime!`,
  };
  const reply = templates[type || 'inquiry'] || templates.inquiry;
  return res.status(200).json({ success: true, source: 'simulation', reply });
}

// ==========================================
//  FOLLOW-UP GENERATOR HANDLER
// ==========================================
async function handleFollowUp(payload, apiKey, res) {
  const { context, followNum, platform } = payload;

  if (apiKey) {
    const prompt = `You are a professional freelancer on ${platform || 'Upwork'}. Write a ${followNum || '1st'} follow-up message for the following context.

Context: """${context}"""

Rules:
- This is a ${followNum || '1st'} follow-up — match the urgency level accordingly
- Keep it SHORT (under 80 words) — respect their time
- Do NOT be desperate or pushy
- Remind them of the value you offer in one line
- End with ONE clear, easy question or call to action
- Sound natural and human

Output ONLY the follow-up message.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
    });
    return res.status(200).json({ success: true, source: 'gemini', reply: result.response.text().trim() });
  }

  // Simulation Fallback
  const msgs = {
    '1st':  `Hi! I just wanted to follow up on my proposal from a couple of days ago.\n\nI'm still very interested in your project and believe I can deliver exactly what you need. If you have any questions or need any clarification, I'm happy to jump on a quick call.\n\nLooking forward to hearing from you!`,
    '2nd':  `Hi again! I understand you're probably busy — I just wanted to check in one more time before I close out my availability for this week.\n\nIf the project is still moving forward, I'd love to be part of it. Is there anything specific holding back a decision that I can address?\n\nEither way, thanks for your time!`,
    'final':`Hi! This will be my last follow-up — I don't want to clutter your inbox.\n\nIf the timing isn't right, that's completely okay. If you do decide to move forward in the future, I'd still be happy to work together.\n\nWishing you all the best with your project! 🙂`,
  };
  const reply = msgs[followNum || '1st'] || msgs['1st'];
  return res.status(200).json({ success: true, source: 'simulation', reply });
}

// ==========================================
//  COLD EMAIL GENERATOR HANDLER
// ==========================================
async function handleColdEmail(payload, apiKey, res) {
  const { prospect, company, industry, service, goal, tone } = payload;

  if (apiKey) {
    const prompt = `You are a world-class cold email copywriter. Generate high-converting cold email content for the following prospect.

Prospect: ${prospect}
Company: ${company}
Industry: ${industry || 'SaaS'}
Service Offered: ${service}
Goal / Value Prop: ${goal}
Tone: ${tone || 'Professional'}

Generate exactly this JSON structure (no markdown, no code blocks, raw JSON only):
{
  "subjectLines": ["subject1", "subject2", "subject3", "subject4", "subject5"],
  "emailA": "full email text here",
  "emailB": "full email text here (different angle/hook)",
  "followup1": "first follow-up email (send 3 days later)",
  "followup2": "second follow-up email (send 7 days later, final)",
  "linkedin": "linkedin connection request or DM message (max 300 chars)"
}

Rules for ALL emails:
- Never start with "I hope this email finds you well"
- Never say "I wanted to reach out"
- Open with a strong hook referencing ${company} or ${industry || 'SaaS'}
- Focus on THEIR problem, not your service
- Keep emails under 120 words each
- Make subject lines curiosity-driven or value-driven
- LinkedIn message must be under 300 characters
- Tone: ${tone || 'Professional'}
- Human sounding, not AI-generated sounding
- Strong, specific CTA at the end of each email`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 2000 }
    });
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return res.status(200).json({ success: true, source: 'gemini', data: JSON.parse(jsonMatch[0]) });
    }
  }

  // Simulation Fallback
  const hooks = {
    Professional: `I was looking at ${company}'s recent work in the ${industry || 'SaaS'} space`,
    Friendly:     `Hey ${prospect}, I came across ${company} and loved what you're building`,
    Direct:       `${company} is leaving revenue on the table. Here's why`,
    Premium:      `Most ${industry || 'SaaS'} companies we work with had the same challenge before we helped them fix it`,
  };
  const ctaMap = {
    Professional: `Would you be open to a 15-minute call this week?`,
    Friendly:     `Would love to chat — what does your schedule look like this week?`,
    Direct:       `Can we talk Thursday or Friday for 15 minutes?`,
    Premium:      `I have one spot open this week for an introductory call. Interested?`,
  };
  const hook = hooks[tone] || hooks.Professional;
  const cta  = ctaMap[tone]  || ctaMap.Professional;
  const data = {
    subjectLines: [
      `Quick question about ${company}'s ${(service || '').toLowerCase()} strategy`,
      `How ${industry || 'SaaS'} companies are getting 3x results with ${service}`,
      `${prospect}, saw something interesting about ${company}`,
      `The ${service.toLowerCase()} gap most ${industry || 'SaaS'} companies don't see`,
      `15 min call? This could be useful for ${company}`,
    ],
    emailA: `${hook} — and I noticed an opportunity that most ${industry || 'SaaS'} companies miss.\n\nWe help businesses like ${company} ${(goal || '').toLowerCase()}.\n\nRecently worked with a similar ${industry || 'SaaS'} company and delivered results within 60 days.\n\n${cta}\n\nBest,\n[Your Name]`,
    emailB: `${prospect},\n\nMost ${industry || 'SaaS'} companies struggle with ${service.toLowerCase()} — not because of effort, but because of approach.\n\nWe've refined a process that helps companies ${(goal || '').toLowerCase()}.\n\nI'd love to show you exactly what we did for a company similar to ${company}.\n\n${cta}\n\n[Your Name]`,
    followup1: `Hi ${prospect},\n\nJust following up on my last note — wanted to make sure it didn't get buried.\n\n${company} seems like a great fit for what we do. Happy to share a quick case study if helpful.\n\n${cta}\n\n[Your Name]`,
    followup2: `Hi ${prospect},\n\nI'll keep this brief — last follow-up, I promise.\n\nIf ${service.toLowerCase()} isn't a priority right now, no worries at all.\n\nBut if it ever becomes one, I'd love to be your first call.\n\nWishing you and ${company} the best! 🙂`,
    linkedin: `Hi ${prospect}! I help ${industry || 'SaaS'} companies ${(goal || '').toLowerCase()}. Thought there might be a fit with ${company}. Would love to connect and share some ideas!`,
  };
  return res.status(200).json({ success: true, source: 'simulation', data });
}

// ==========================================
//  LOCAL PROPOSAL SIMULATOR FOR SERVER
// ==========================================
function simulateProposal(jobPost, skill, exp, tone, platform) {
  const t = jobPost.toLowerCase();
  const urgencyScore = t.includes('asap')||t.includes('urgent')||t.includes('immediately') ? 88
    : t.includes('soon')||t.includes('quickly') ? 65 : Math.floor(Math.random()*30)+20;
  const budgetScore  = t.includes('$')||t.includes('budget')||t.includes('pay')||t.includes('rate') ? Math.floor(Math.random()*20)+70
    : Math.floor(Math.random()*25)+40;
  const scamScore    = t.includes('gift card')||t.includes('wire transfer')||t.includes('western union') ? 92
    : t.includes('verified')||t.includes('payment protected') ? 6 : Math.floor(Math.random()*18)+5;
  const ghostScore   = urgencyScore > 70 ? Math.floor(Math.random()*15)+10
    : budgetScore < 50 ? Math.floor(Math.random()*20)+50 : Math.floor(Math.random()*25)+20;
  const replyChance  = Math.round(Math.min(95, Math.max(35,
    100 - ghostScore*0.3 - scamScore*0.15 + budgetScore*0.3 + urgencyScore*0.1 + Math.random()*10
  )));
  const trustScore    = Math.max(5, Math.round(100 - scamScore - Math.random()*5));
  const pricingConf   = budgetScore > 60 ? Math.floor(Math.random()*15)+70 : Math.floor(Math.random()*20)+45;

  const personalities = ['Detail-Oriented','Fast-Paced Executor','Budget-Conscious','Quality Seeker','Visionary Builder','Collaborative Partner','Results-Driven'];
  const strategies = [
    `Lead with a specific result you've achieved before. Show you understand their exact problem in the first line. End with one smart, project-specific question.`,
    `Open with the client's biggest challenge. Propose a clear 3-step solution, mention your relevant experience, and invite a quick discovery call.`,
    `Be direct and confident — state what you'll deliver and when. Clients on ${platform || 'Upwork'} respond well to clarity over flattery.`,
  ];
  const painPoints = ['Finding an expert who communicates consistently', 'Previous freelancers missed deadlines', 'Fear of hidden costs', 'Lack of project updates'];
  const clientWants = ['A reliable partner they can trust', 'Proactive communication', 'Clean, high-quality deliverables', 'Quick turnaround'];
  const thingsToAvoid = ['Copy-paste templates', 'Radio silence', 'Starting with price discussions', 'Using tech jargon unnecessarily'];
  const aiTips = ['Reference a specific job detail in your hook', 'Show a measurable past result', 'Keep it under 200 words', 'Ask one action-oriented closing question'];

  const greetings = { professional: 'Hello,', friendly: 'Hi there!', bold: '', conversational: 'Hey!' };
  const greeting = greetings[tone] || 'Hello,';
  const closes = { professional: 'I look forward to discussing this.', friendly: 'Happy to chat anytime! 😊', bold: 'Message me — let\'s move fast.', conversational: 'What\'s your ideal start date?' };

  const proposal = `${greeting}\n\nI've reviewed your requirements and I'm confident I can help you deliver this successfully. My approach focuses on quality and clear communication at every milestone.\n\nI look forward to discussing this.`;

  return {
    replyChance,
    clientPersonality: personalities[Math.floor(Math.random() * personalities.length)],
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
    pricingConfidence: pricingConf,
    recommendedStrategy: strategies[Math.floor(Math.random() * strategies.length)],
    painPoints,
    clientWants,
    thingsToAvoid,
    aiTips,
    proposal,
  };
}
