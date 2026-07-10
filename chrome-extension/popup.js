// popup.js — ProposalIQ Chrome Extension Logic

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const KEY_STORE = 'piq_ext_apikey';
const PLATFORM_STORE = 'piq_ext_platform';
const TONE_STORE = 'piq_ext_tone';
let detectedJobText = '';

// ---- INIT ----
document.addEventListener('DOMContentLoaded', async () => {
  loadSettings();
  checkAiStatus();
  checkAutoDetect();

  document.getElementById('settingsToggle').addEventListener('click', toggleSettings);
  document.getElementById('saveKeyBtn').addEventListener('click', saveApiKey);
  document.getElementById('popupGenerateBtn').addEventListener('click', generate);
  document.getElementById('popupCopyBtn').addEventListener('click', copyProposal);
  document.getElementById('popupOpenBtn').addEventListener('click', openDashboard);
  document.getElementById('autoFillBtn')?.addEventListener('click', autoFill);

  // Save platform/tone on change
  document.getElementById('platformSelect')?.addEventListener('change', () => {
    chrome.storage.local.set({ [PLATFORM_STORE]: document.getElementById('platformSelect').value });
  });
  document.getElementById('toneSelect')?.addEventListener('change', () => {
    chrome.storage.local.set({ [TONE_STORE]: document.getElementById('toneSelect').value });
  });
});

// ---- LOAD SETTINGS ----
function loadSettings() {
  chrome.storage.local.get([KEY_STORE, PLATFORM_STORE, TONE_STORE], (result) => {
    if (result[KEY_STORE]) {
      const field = document.getElementById('apiKeyField');
      if (field) field.value = result[KEY_STORE];
    }
    const platform = document.getElementById('platformSelect');
    if (platform && result[PLATFORM_STORE]) platform.value = result[PLATFORM_STORE];
    const tone = document.getElementById('toneSelect');
    if (tone && result[TONE_STORE]) tone.value = result[TONE_STORE];
  });
}

// ---- SETTINGS TOGGLE ----
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  const main  = document.getElementById('mainPanel');
  if (panel.style.display === 'none') {
    panel.style.display = 'block'; main.style.display = 'none';
  } else {
    panel.style.display = 'none'; main.style.display = 'block';
  }
}

// ---- SAVE API KEY ----
function saveApiKey() {
  const key = document.getElementById('apiKeyField').value.trim();
  if (!key) { alert('Please enter your Gemini API key.'); return; }
  chrome.storage.local.set({ [KEY_STORE]: key }, () => {
    checkAiStatus();
    showQuickToast('✅ API Key saved!');
    // Switch back to main panel
    document.getElementById('settingsPanel').style.display = 'none';
    document.getElementById('mainPanel').style.display = 'block';
  });
}

// ---- CHECK AI STATUS ----
function checkAiStatus() {
  chrome.storage.local.get([KEY_STORE], (result) => {
    const dot = document.getElementById('pAiDot');
    if (result[KEY_STORE]) dot.classList.add('connected');
    else dot.classList.remove('connected');
  });
}

// ---- CHECK AUTO-DETECT ----
function checkAutoDetect() {
  chrome.runtime.sendMessage({ type: 'GET_JOB_TEXT' }, (response) => {
    if (response?.jobText) {
      detectedJobText = response.jobText;
      const bar = document.getElementById('autoDetectBar');
      if (bar) bar.style.display = 'flex';
    }
  });
}

// ---- AUTO FILL ----
function autoFill() {
  if (!detectedJobText) return;
  const ta = document.getElementById('popupJobPost');
  if (ta) { ta.value = detectedJobText; ta.focus(); }
  document.getElementById('autoDetectBar').style.display = 'none';
  showQuickToast('📋 Job post auto-filled!');
}

// ---- GENERATE ----
async function generate() {
  const jobPost = document.getElementById('popupJobPost').value.trim();
  if (!jobPost) { showQuickToast('Please paste a job post first.'); return; }

  const btn     = document.getElementById('popupGenerateBtn');
  const btnText = document.getElementById('popupBtnText');
  btn.disabled  = true;
  btnText.textContent = '⏳ Analyzing...';

  chrome.storage.local.get([KEY_STORE, PLATFORM_STORE, TONE_STORE], async (res) => {
    const apiKey   = res[KEY_STORE] || '';
    const platform = res[PLATFORM_STORE] || 'Upwork';
    const tone     = res[TONE_STORE] || 'professional';

    try {
      let result;
      if (apiKey) result = await callGemini(apiKey, jobPost, platform, tone);
      else        result = simulate(jobPost, platform);

      // Display proposal
      const outputEl = document.getElementById('popupOutputText');
      const outputBox= document.getElementById('popupOutput');
      if (outputEl) typeText(outputEl, result.proposal);
      if (outputBox) outputBox.style.display = 'block';

      // Display scores
      showScores(result);

      // Display strategy
      const stratBox = document.getElementById('strategyBox');
      const stratTxt = document.getElementById('strategyText');
      if (stratTxt) stratTxt.textContent = result.strategy || '';
      if (stratBox) stratBox.style.display = 'block';

    } catch (e) {
      showQuickToast('❌ Error: ' + e.message);
    } finally {
      btn.disabled = false;
      btnText.textContent = '⚡ Generate Proposal';
    }
  });
}

// ---- GEMINI API CALL ----
async function callGemini(apiKey, jobPost, platform, tone) {
  const prompt = `You are ProposalIQ, an expert freelance proposal writer.

Analyze this job post and respond in JSON:
Job Post: "${jobPost.substring(0, 2000)}"
Platform: ${platform}
Tone: ${tone}

Return ONLY valid JSON:
{
  "proposal": "A tailored, conversion-optimized, professional proposal in ${tone} tone for ${platform}. It must strictly adhere to the guidelines below.",
  "reply_chance": 78,
  "scam_risk": 12,
  "ghosting_risk": 25,
  "budget_seriousness": 80,
  "strategy": "One clear winning strategy sentence"
}

CRITICAL PROPOSAL GUIDELINES:
1. Open by directly referencing the client's specific pain points, complaints, or concerns mentioned in the job description in the first 1-2 sentences. Avoid generic "this is a business opportunity" style phrases.
2. Address any requested inclusions (e.g. "please include samples", "make sure to mention timeline") specifically.
3. No phased timelines (e.g. Phase 1/Phase 2) for non-technical/non-dev jobs.
4. No emojis by default. Use them only if the job post itself is casual/informal.
5. Reference realistic pricing aligned with their mentioned budget range, if any.
6. Maximize personalization if the post warns against template/generic proposals.
7. Under 250 words. End with a single, action-oriented closing question.`;

  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  if (!res.ok) throw new Error('API error: ' + res.status);
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const json = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
  return JSON.parse(json);
}

// ---- SIMULATION ----
function simulate(jobPost, platform) {
  const words = jobPost.split(' ');
  return {
    proposal: `Dear Client,\n\nI've carefully read your project requirements and I'm excited to apply. With ${Math.floor(Math.random()*5)+2}+ years of experience in this domain, I have delivered similar projects successfully.\n\nHere's how I'll approach your project:\n• Understand your exact requirements in detail\n• Deliver high-quality work within your timeline\n• Provide regular updates and communication\n• Revisions until you're 100% satisfied\n\nI'd love to discuss your project further. When would be a good time for a quick call?\n\nLooking forward to working with you!\n\nBest regards`,
    reply_chance: Math.floor(Math.random()*30)+60,
    scam_risk: Math.floor(Math.random()*20)+5,
    ghosting_risk: Math.floor(Math.random()*25)+10,
    budget_seriousness: Math.floor(Math.random()*30)+60,
    strategy: 'Lead with your most relevant experience and ask a specific question to start a conversation.'
  };
}

// ---- SHOW SCORES ----
function showScores(data) {
  const strip = document.getElementById('scoreStrip');
  if (!strip) return;
  strip.style.display = 'flex';
  document.getElementById('chipReply').textContent  = `💬 ${data.reply_chance}% Reply`;
  document.getElementById('chipScam').textContent   = `🛡️ ${data.scam_risk}% Scam`;
  document.getElementById('chipGhost').textContent  = `👻 ${data.ghosting_risk}% Ghost`;
  document.getElementById('chipBudget').textContent = `💵 ${data.budget_seriousness}% Budget`;

  // Color code scam
  const scamChip = document.getElementById('chipScam');
  if (data.scam_risk > 50) scamChip.classList.add('warn'); else scamChip.classList.remove('warn');
}

// ---- TYPE TEXT ANIMATION ----
function typeText(el, text) {
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i] || '';
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 10);
}

// ---- COPY ----
function copyProposal() {
  const text = document.getElementById('popupOutputText').textContent;
  navigator.clipboard.writeText(text).then(() => showQuickToast('✅ Copied!'));
}

// ---- OPEN DASHBOARD ----
function openDashboard() {
  chrome.tabs.create({ url: 'https://proposaliqai.com' });
}

// ---- QUICK TOAST ----
function showQuickToast(msg) {
  const existing = document.getElementById('quickToast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'quickToast';
  toast.style.cssText = 'position:fixed;bottom:48px;left:50%;transform:translateX(-50%);background:#1a1523;color:#fff;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:500;z-index:9999;white-space:nowrap;font-family:Inter,sans-serif;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
