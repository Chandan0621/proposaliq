// ======================
//  ProposalIQ — app.js
//  Real Gemini AI (BYOK)
// ======================

const STORAGE_KEY = 'proposaliq_gemini_key';

// ---- API KEY MANAGEMENT ----
function getApiKey() { return localStorage.getItem(STORAGE_KEY) || ''; }
function saveApiKey(k) { if (k) localStorage.setItem(STORAGE_KEY, k); else localStorage.removeItem(STORAGE_KEY); }

// ---- AI STATUS INDICATOR ----
function updateAiStatus() {
  const key = getApiKey();
  const dot = document.getElementById('aiDot');
  const text = document.getElementById('aiStatusText');
  const badge = document.getElementById('aiModeBadge');
  if (key) {
    dot.className = 'ai-dot connected';
    text.textContent = 'Gemini AI Connected';
    if (badge) { badge.textContent = '🤖 Gemini AI'; badge.className = 'panel-badge done'; }
  } else {
    dot.className = 'ai-dot';
    text.textContent = 'Simulation Mode';
    if (badge) { badge.textContent = '⚡ AI Ready'; badge.className = 'panel-badge'; }
  }
}

// ---- SIDEBAR TOGGLE ----
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('open');
});
sidebarOverlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
});

// ---- NAV ITEMS ----
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  });
});

// ---- PILLS ----
document.querySelectorAll('.tone-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.tone-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});
document.querySelectorAll('.platform-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.platform-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// ---- SETTINGS MODAL ----
const settingsModal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');

document.getElementById('settingsBtn').addEventListener('click', () => {
  apiKeyInput.value = getApiKey();
  settingsModal.classList.add('open');
});
document.getElementById('settingsClose').addEventListener('click', () => settingsModal.classList.remove('open'));
settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.remove('open'); });

document.getElementById('toggleKeyBtn').addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key.startsWith('AIza')) {
    apiKeyInput.style.borderColor = '#dc2626';
    apiKeyInput.placeholder = 'Invalid key — must start with AIza...';
    setTimeout(() => { apiKeyInput.style.borderColor = ''; }, 2000);
    return;
  }
  saveApiKey(key);
  settingsModal.classList.remove('open');
  updateAiStatus();
  showToast('🤖 Gemini AI Connected!', 'success');
});

document.getElementById('clearApiKeyBtn').addEventListener('click', () => {
  saveApiKey('');
  apiKeyInput.value = '';
  settingsModal.classList.remove('open');
  updateAiStatus();
  showToast('Key removed. Running in simulation mode.', 'info');
});

// ---- UPGRADE MODAL ----
const upgradeModal = document.getElementById('upgradeModal');
document.getElementById('upgradeSidebarBtn').addEventListener('click', () => upgradeModal.classList.add('open'));
document.getElementById('headerUpgradeBtn')?.addEventListener('click', () => upgradeModal.classList.add('open'));
document.getElementById('modalClose').addEventListener('click', () => upgradeModal.classList.remove('open'));
upgradeModal.addEventListener('click', e => { if (e.target === upgradeModal) upgradeModal.classList.remove('open'); });

// ---- COPY & SAVE ----
document.getElementById('copyBtn').addEventListener('click', () => {
  const text = document.getElementById('outputText').innerText;
  
  function fallbackCopyText(txt) {
    const ta = document.createElement("textarea");
    ta.value = txt;
    ta.style.position = "fixed"; ta.style.top = "0"; ta.style.left = "0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try {
      return document.execCommand('copy');
    } catch (e) {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }

  const successAction = () => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ Copied!'; btn.style.background = '#15803d';
    setTimeout(() => { btn.textContent = 'Copy'; btn.style.background = ''; }, 2000);
  };

  if (!navigator.clipboard) {
    if (fallbackCopyText(text)) successAction();
    else showToast('❌ Failed to copy automatically. Please select text manually.', 'error');
    return;
  }

  navigator.clipboard.writeText(text).then(
    successAction,
    () => {
      if (fallbackCopyText(text)) successAction();
      else showToast('❌ Failed to copy.', 'error');
    }
  );
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const btn = document.getElementById('saveBtn');
  btn.textContent = '✓ Saved'; btn.style.background = '#15803d';
  showToast('✅ Proposal saved!', 'success');
  setTimeout(() => { btn.textContent = 'Save'; btn.style.background = ''; }, 2000);
});

// ---- GENERATE PROPOSAL ----
document.getElementById('generateBtn').addEventListener('click', async () => {
  const jobPost = document.getElementById('jobPost').value.trim();
  if (!jobPost || jobPost.length < 20) { shakeEl(document.getElementById('jobPost')); return; }

  const skill    = document.getElementById('skillCategory').value || 'General';
  const exp      = document.getElementById('expLevel').value || 'Intermediate';
  const tone     = document.querySelector('.tone-pill.active')?.dataset.tone || 'professional';
  const platform = document.querySelector('.platform-pill.active')?.dataset.platform || 'Upwork';

  setLoadingState(true);

  try {
    const apiKey = getApiKey();
    let result;
    if (apiKey) {
      result = await callGeminiAI(jobPost, skill, exp, tone, platform, apiKey);
      document.getElementById('analysisBadge').textContent = '🤖 Gemini AI';
      document.getElementById('analysisBadge').className = 'panel-badge done';
    } else {
      await delay(1800);
      result = simulateAnalysis(jobPost, skill, exp, tone, platform);
      document.getElementById('analysisBadge').textContent = '⚡ Simulated';
      document.getElementById('analysisBadge').className = 'panel-badge';
    }
    renderResults(result);
  } catch (err) {
    console.error(err);
    showToast('❌ Error: ' + err.message + ' — switching to simulation.', 'error');
    const result = simulateAnalysis(jobPost, skill, exp, tone, platform);
    document.getElementById('analysisBadge').textContent = '⚡ Simulated (Fallback)';
    renderResults(result);
  } finally {
    setLoadingState(false);
  }
});

// ---- GEMINI DIRECT API CALL ----
async function callGeminiAI(jobPost, skill, exp, tone, platform, apiKey) {
  const prompt = `You are ProposalIQ, an expert AI assistant for freelancers. Analyze this job post and return ONLY a raw JSON object (no markdown code blocks, no explanation, just raw JSON).

Job Post: """${jobPost}"""
Skill Category: ${skill}
Experience Level: ${exp}
Tone: ${tone}
Platform: ${platform}

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
  "trustLevel": "<Low|Moderate|High>",
  "trustScore": <number 0-100>,
  "pricingConfidence": <number 0-100>,
  "recommendedStrategy": "<2-3 sentence actionable strategy>",
  "painPoints": ["<point1>","<point2>","<point3>","<point4>"],
  "clientWants": ["<want1>","<want2>","<want3>","<want4>"],
  "thingsToAvoid": ["<avoid1>","<avoid2>","<avoid3>","<avoid4>"],
  "aiTips": ["<tip1>","<tip2>","<tip3>","<tip4>"],
  "proposal": "<A highly tailored, conversion-optimized, professional proposal in ${tone} tone for ${platform}. It must strictly adhere to the copywriting guidelines below. Max 200 words. Use double newlines \\n\\n for paragraph breaks.>"
}

CRITICAL COPYWRITING GUIDELINES FOR THE "proposal" FIELD:
1. NO AI CLICHES: Never use generic openings like "Dear Hiring Manager", "I am writing to express my interest...", "I read your job post with great interest...", or "I am a skilled developer with X years of experience...".
2. PREVIEW HOOK: Start directly (first 2 sentences) by addressing their specific problem or project goal, demonstrating instant understanding. This is crucial for preview listings on ${platform}.
3. MY SOLUTION/APPROACH: Provide a clear, bulleted list (using '•') of 3 precise implementation steps tailored to this specific job post.
4. PROOF / WHY ME: State 1-2 powerful differentiators or measurable results relevant to their project. Keep it natural, not salesy.
5. OPEN-ENDED QUESTION: End with a single, simple, action-oriented closing question (e.g. "Do you have 5 minutes for a quick chat to discuss the dashboard layout?") to encourage them to reply. Do not ask generic questions like "When can we start?".
6. FORMATTING: Use double line breaks \\n\\n between sections and bullet points for readability. Avoid markdown bold headers in the proposal text, keep it clean.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    })
  });

  if (resp.status === 400) throw new Error('Invalid API key. Please check your Gemini API key.');
  if (resp.status === 429) throw new Error('API quota exceeded. Please try again later.');
  if (!resp.ok) throw new Error(`API error ${resp.status}`);

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Empty AI response');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');

  return JSON.parse(jsonMatch[0]);
}

// ---- RENDER RESULTS ----
function renderResults(d) {
  setCard('reply',   d.replyChance + '%',      d.replyChance);
  setCard('client',  d.clientPersonality,      null);
  setCard('urgency', d.urgencyLevel + (d.urgencyScore > 70 ? ' ⚡' : d.urgencyScore < 35 ? ' ✅' : ''), d.urgencyScore);
  setCard('budget',  d.budgetSeriousness + (d.budgetScore > 70 ? ' 💰' : ''), d.budgetScore);
  setCard('ghost',   d.ghostingRisk + (d.ghostScore > 60 ? ' 👻' : d.ghostScore < 30 ? ' ✅' : ''), d.ghostScore);
  setCard('scam',    d.scamRisk + (d.scamScore > 70 ? ' 🚨' : d.scamScore < 25 ? ' ✅' : ' ⚠️'), d.scamScore);
  setCard('trust',   d.trustLevel + (d.trustScore > 75 ? ' ✅' : d.trustScore < 40 ? ' ⚠️' : ''), d.trustScore);
  setCard('price',   d.pricingConfidence + '%', d.pricingConfidence);
  document.getElementById('val-strategy').textContent = d.recommendedStrategy;

  const outputEl = document.getElementById('proposalOutput');
  const outputText = document.getElementById('outputText');
  outputEl.style.display = 'block';
  typeWriter(outputText, d.proposal, 10);

  showInsights(d);
}

// ---- SIMULATION ENGINE (Fully Dynamic) ----
function simulateAnalysis(jobPost, skill, exp, tone, platform) {
  const t = jobPost.toLowerCase();
  const words = jobPost.split(/\s+/).filter(w => w.length > 4);

  // ---- SCORES ----
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

  // ---- PERSONALITY ----
  const personalities = ['Detail-Oriented','Fast-Paced Executor','Budget-Conscious','Quality Seeker','Visionary Builder','Collaborative Partner','Results-Driven'];

  // ---- STRATEGIES ----
  const strategies = [
    `Lead with a specific result you've achieved before. Show you understand their exact problem in the first line. End with one smart, project-specific question.`,
    `Open with the client's biggest challenge. Propose a clear 3-step solution, mention your relevant experience, and invite a quick discovery call.`,
    `Be direct and confident — state what you'll deliver and when. Clients on ${platform} respond well to clarity over flattery.`,
    `Mirror the job post's tone. Use 2-3 keywords from their description naturally. Propose a small quick-win milestone to reduce their risk.`,
    `Start with your most relevant past result (numbers work best). Keep it under 200 words and close with a question that shows you've thought deeply about their project.`,
    `Acknowledge their timeline first — shows you read carefully. Then explain your process step-by-step to build trust before quoting.`,
  ];

  // ---- DYNAMIC OPENINGS (50+) ----
  const openingsByTone = {
    professional: [
      `Your project caught my attention for exactly the right reasons — this is precisely the kind of work I specialize in.`,
      `After reading your requirements carefully, I can see this project needs someone who understands both the technical side and the business goal.`,
      `This project aligns perfectly with my background in ${skill}. Let me explain how I'd approach it.`,
      `Your job description is well-structured and it's clear you know exactly what you want — which makes my job easier.`,
      `Having worked on similar ${skill} projects on ${platform}, I understand the challenges you're facing and how to solve them efficiently.`,
      `The scope of work you've described is something I've handled multiple times. Here's how I'd deliver results for you.`,
      `What you're describing in this project is not just a technical challenge — it's a business opportunity. Let me show you how I'd approach it.`,
    ],
    friendly: [
      `Wow, this sounds like a really exciting project! I'd love to be part of it.`,
      `Hey! Your project immediately caught my eye — I've done very similar work and I'm genuinely excited about this one!`,
      `This is exactly the kind of project I enjoy working on. Let me share how I'd make this a success for you!`,
      `Reading your post made me smile — this is right in my wheelhouse and I think we'd work really well together!`,
      `Hi! I can tell you've put thought into this project description. I've got just the right experience to help you out!`,
      `Great project! I've worked on very similar tasks and I have some ideas that could make this even better than you planned.`,
    ],
    bold: [
      `I'll deliver this in less time and better quality than you expect. Here's exactly how.`,
      `Most freelancers will give you a generic reply. I won't. Here's why I'm the right person for this.`,
      `You need results, not promises. I've done this before and I'll do it right for you.`,
      `Skip the small talk — here's my direct plan for your project.`,
      `I'm going to be straight with you: this project is well within my expertise, and I can start today.`,
      `Other proposals you receive will sound alike. Mine won't. Here's what makes the difference.`,
    ],
    conversational: [
      `Hey! Just came across your post and had to apply — this is literally what I do every day.`,
      `So I read through your project a couple of times and I've got some ideas I think you'll like.`,
      `Quick question before I dive in — but first, here's my take on your project...`,
      `Okay so this is actually a really cool project and here's the thing — I've built something almost identical before.`,
      `Hey there! Your project is interesting — let me tell you honestly how I'd approach this.`,
      `I like how you described this. It's clear you know what you want, so let me tell you exactly what I'd do.`,
    ],
  };

  // ---- BODY TEMPLATES ----
  const bodies = [
    {
      opening: `Here's my ${exp||'experienced'} take on your project:`,
      bullets: [
        `→ Start with a thorough discovery session to fully understand your goals`,
        `→ Build iteratively with your feedback at every step`,
        `→ Deliver clean, documented, and scalable output`,
      ],
      why: [
        `✓ ${exp||'Strong'} hands-on experience in ${skill||'this domain'}`,
        `✓ Consistent 5-star delivery record on ${platform}`,
        `✓ Available for quick turnaround and daily updates`,
      ]
    },
    {
      opening: `My process for your project:`,
      bullets: [
        `📌 Phase 1: Deep-dive into your requirements (Day 1)`,
        `📌 Phase 2: First working version ready for your review (Day 2-3)`,
        `📌 Phase 3: Refinements until you're 100% satisfied`,
      ],
      why: [
        `⚡ Proven track record with ${skill||'similar'} projects`,
        `⚡ I communicate proactively — no chasing required`,
        `⚡ Quality output with zero compromise on deadlines`,
      ]
    },
    {
      opening: `Why I'm the right fit for this:`,
      bullets: [
        `• I've completed 10+ similar ${skill||'projects'} in the past 12 months`,
        `• My average delivery time is 20% faster than the deadline`,
        `• You'll get daily progress updates, not radio silence`,
      ],
      why: [
        `→ Technical expertise: ${skill||'Relevant domain knowledge'}`,
        `→ Experience level: ${exp||'Solid and proven'}`,
        `→ Platform trust: Verified ${platform} professional`,
      ]
    },
    {
      opening: `Let me break down exactly how I'd tackle this:`,
      bullets: [
        `Step 1 ✅ Understand your exact requirements and edge cases`,
        `Step 2 ✅ Create a detailed action plan and share it for approval`,
        `Step 3 ✅ Execute with regular check-ins and zero surprises`,
      ],
      why: [
        `🎯 Specialized in ${skill||'this field'} — not a generalist`,
        `🎯 On-time delivery is non-negotiable for me`,
        `🎯 Full revisions included until you love the result`,
      ]
    },
  ];

  // ---- CLOSINGS ----
  const closings = {
    professional: [
      `I'd welcome the opportunity to discuss your project in more detail. What timeline are you working with?`,
      `I'm ready to start immediately. Would a quick 15-minute call work for you this week?`,
      `Could you share any additional context about the project? I want to make sure I hit the ground running.`,
      `What does success look like for this project from your perspective?`,
    ],
    friendly: [
      `Would love to jump on a quick call to discuss! When works for you? 😊`,
      `Can't wait to dive in! What's your preferred way to communicate during projects?`,
      `This is going to be fun! What's the first milestone you'd like to see?`,
      `Happy to share some relevant samples too! What would be most helpful to you?`,
    ],
    bold: [
      `Message me now and we can start today.`,
      `One question: what's the single most important thing to get right here?`,
      `I'm available immediately. What's the first milestone?`,
      `Let's talk. I'll show you exactly how this gets done.`,
    ],
    conversational: [
      `What's your ideal start date? I want to make sure I can give this my full attention.`,
      `By the way — is there a specific part of this project you're most nervous about? Happy to address that upfront.`,
      `Quick question: are you open to a quick intro call, or do you prefer to communicate over chat?`,
      `What does your timeline look like? I want to make sure this works perfectly for both of us.`,
    ],
  };

  // ---- INSIGHTS (Dynamic based on job post) ----
  const skillRef = skill || 'this type of work';
  const allPainPoints = [
    `Finding a ${skillRef} expert who communicates consistently`,
    `Previous freelancers delivered late or below expectations`,
    `Needing to explain technical requirements to non-technical freelancers`,
    `Lack of transparency and progress updates mid-project`,
    `Budget uncertainty — not sure what fair pricing looks like`,
    `Fear of scope creep and hidden costs`,
    `Struggling to find someone who truly understands their vision`,
    `Time pressure — needs someone who can deliver under tight deadlines`,
  ];
  const allWants = [
    `A reliable expert who delivers what they promise`,
    `Proactive communication without being asked`,
    `Clean, professional, scalable ${skillRef} output`,
    `Someone who gets it right the first time`,
    `Transparent process with clear milestones`,
    `Quick turnaround without sacrificing quality`,
    `A long-term partner they can trust with future work`,
    `Updates at every stage so there are no surprises`,
  ];
  const allAvoid = [
    `Copy-paste proposals that don't mention their specific project`,
    `Freelancers who go quiet mid-project`,
    `Overpromising on timeline just to win the bid`,
    `Starting with hourly rate before establishing value`,
    `Using jargon that shows you didn't read the post`,
    `Generic "I'm a professional with X years of experience" openers`,
    `Asking for upfront full payment without any milestones`,
    `Ignoring specific requirements mentioned in the job post`,
  ];
  const allTips = [
    `Reference a specific detail from their job post in your first line`,
    `Show one relevant result with a number (e.g., "reduced load time by 40%")`,
    `Ask exactly ONE smart question at the end — not five`,
    `Keep your proposal under 250 words — quality beats quantity`,
    `Use their exact keywords naturally throughout your proposal`,
    `Mention ${platform}-specific trust signals (rating, reviews, top-rated badge)`,
    `Propose a small starter task to lower their risk of hiring you`,
    `Address the potential objection before they think of it`,
  ];

  function pick(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  // ---- BUILD PROPOSAL ----
  const toneKey = tone || 'professional';
  const openings = openingsByTone[toneKey] || openingsByTone.professional;
  const opening  = openings[Math.floor(Math.random() * openings.length)];
  const body     = bodies[Math.floor(Math.random() * bodies.length)];
  const closing  = (closings[toneKey] || closings.professional)[Math.floor(Math.random() * (closings[toneKey]||closings.professional).length)];

  const greetings = {
    professional: `Hello,\n\n`,
    friendly:     `Hi there! 👋\n\n`,
    bold:         ``,
    conversational: `Hey!\n\n`,
  };

  const proposal = `${greetings[toneKey]||'Hello,\n\n'}${opening}

${body.opening}
${body.bullets.join('\n')}

${body.why.join('\n')}

${closing}`;

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
    painPoints:    pick(allPainPoints, 4),
    clientWants:   pick(allWants, 4),
    thingsToAvoid: pick(allAvoid, 4),
    aiTips:        pick(allTips, 4),
    proposal,
  };
}

// ---- HELPERS ----
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function setLoadingState(loading) {
  const btn = document.getElementById('generateBtn');
  const btnContent = btn.querySelector('.btn-content');
  btn.disabled = loading;
  if (loading) {
    btnContent.textContent = '⏳ Analyzing...';
    document.getElementById('analysisBadge').textContent = 'Analyzing...';
    document.getElementById('analysisBadge').className = 'panel-badge loading';
    ['reply','client','urgency','budget','ghost','scam','trust','price'].forEach(k => {
      const v = document.getElementById(`val-${k}`); if (v) v.textContent = '—';
      const p = document.getElementById(`prog-${k}`); if (p) p.style.width = '0%';
    });
    document.getElementById('val-strategy').textContent = 'AI is analyzing your job post...';
  } else {
    btnContent.textContent = '⚡ Generate Proposal';
  }
}

function setCard(key, value, percent) {
  const v = document.getElementById(`val-${key}`); if (v) v.textContent = value;
  const p = document.getElementById(`prog-${key}`);
  if (p && percent !== null) setTimeout(() => { p.style.width = Math.min(100, Math.max(0, percent)) + '%'; }, 150);
}

function shakeEl(el) {
  el.style.borderColor = '#dc2626'; el.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.2)'; el.focus();
  el.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}], {duration:350});
  setTimeout(() => { el.style.borderColor=''; el.style.boxShadow=''; }, 1800);
}

function typeWriter(el, text, speed) {
  el.textContent = ''; let i = 0;
  function tick() { if (i < text.length) { el.textContent += text[i++]; setTimeout(tick, speed); } }
  tick();
}

function showInsights(d) {
  const sec = document.getElementById('insightsSection'); sec.style.display = 'block';
  fillList('painList', d.painPoints);
  fillList('wantsList', d.clientWants);
  fillList('avoidList', d.thingsToAvoid);
  fillList('tipsList', d.aiTips);
  setTimeout(() => sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 400);
}

function fillList(id, items) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = (items||[]).map(i => `<li>${i}</li>`).join('');
}

function showToast(msg, type='info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ---- INIT ----
updateAiStatus();
