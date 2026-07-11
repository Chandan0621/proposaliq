// ======================
//  ProposalIQ — app.js
//  Real Gemini AI (BYOK)
// ======================

const STORAGE_KEY = 'proposaliq_gemini_key';
const BACKWARD_STORAGE_KEY = 'winscope_gemini_key';

// ---- API KEY MANAGEMENT ----
function getApiKey() { return localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKWARD_STORAGE_KEY) || ''; }
function saveApiKey(k) { if (k) { localStorage.setItem(STORAGE_KEY, k); } else { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(BACKWARD_STORAGE_KEY); } }

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
    text.textContent = 'Demo Mode (no API key needed)';
    if (badge) { badge.textContent = '⚡ Demo Mode'; badge.className = 'panel-badge demo'; }
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
    
    const tabId = item.getAttribute('data-tab');
    if (tabId) {
      switchFeatureTab(tabId);
    }
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
  showToast('Key removed. Running in Demo Mode.', 'info');
});
// ---- DEMO BANNER ACTIONS ----
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'bannerStartTrialBtn') {
    e.preventDefault();
    openUpgradeModal();
  }
  if (e.target && e.target.id === 'bannerConnectKeyBtn') {
    e.preventDefault();
    apiKeyInput.value = getApiKey();
    settingsModal.classList.add('open');
  }
});

// ---- COMING SOON NAV HANDLER ----
document.querySelectorAll('.nav-item-soon').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('🔒 This feature is coming soon! Stay tuned.', 'info');
  });
});

// ---- UPGRADE MODAL ----
const upgradeModal = document.getElementById('upgradeModal');

function openUpgradeModal() {
  const trialBtn = document.getElementById('modalStartTrialBtn');
  const buyBtn = document.getElementById('modalBuyProBtn');
  if (upgradeModal && trialBtn && buyBtn) {
    const user = (typeof currentUserData !== 'undefined' && currentUserData) ? currentUserData : { plan: 'free' };
    if (user.plan === 'trial') {
      trialBtn.style.display = 'none';
      buyBtn.style.display = 'block';
    } else if (user.plan === 'pro') {
      trialBtn.style.display = 'none';
      buyBtn.style.display = 'none';
      showToast('🎉 You already have Pro Access!', 'success');
      return;
    } else {
      trialBtn.style.display = 'block';
      buyBtn.style.display = 'none';
    }
    upgradeModal.classList.add('open');
  }
}

document.getElementById('upgradeSidebarBtn').addEventListener('click', openUpgradeModal);
document.getElementById('headerUpgradeBtn')?.addEventListener('click', openUpgradeModal);
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

// ---- HELPER FOR BACKEND ACCESS CONTROL ----
function shouldCallBackend() {
  const user = window.currentUser ? window.currentUser() : null;
  if (!user) return false;
  if (user.plan === 'pro' || user.plan === 'trial') return true;
  if (user.isGuest) {
    const limitCount = parseInt(localStorage.getItem('proposaliq_guest_generations') || '0', 10);
    return limitCount < 2;
  }
  return false;
}

function enforceGuestLimit() {
  const user = window.currentUser ? window.currentUser() : null;
  if (user && user.isGuest) {
    const limitCount = parseInt(localStorage.getItem('proposaliq_guest_generations') || '0', 10);
    if (limitCount >= 2) {
      showToast('⚠️ Free demo limit reached. Please sign up to write unlimited proposals!', 'warning');
      if (typeof showAuthOverlay === 'function') {
        showAuthOverlay();
      }
      return true; // Blocked
    }
  }
  return false; // Not blocked
}

function incrementGuestLimit() {
  const user = window.currentUser ? window.currentUser() : null;
  if (user && user.isGuest) {
    let limitCount = parseInt(localStorage.getItem('proposaliq_guest_generations') || '0', 10);
    limitCount++;
    localStorage.setItem('proposaliq_guest_generations', limitCount.toString());
  }
}

// ---- LOGGING HELPER ----
function logApiCall(status, details, isRateLimit = false) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    status: status,
    details: details,
    isRateLimit: isRateLimit
  };

  // Save in local history (limit to last 50 logs)
  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('proposaliq_api_logs') || '[]');
  } catch (_) {}
  logs.unshift(logEntry);
  if (logs.length > 50) logs = logs.slice(0, 50);
  localStorage.setItem('proposaliq_api_logs', JSON.stringify(logs));

  // Console output
  const prefix = isRateLimit ? '⚠️ [ProposalIQ Rate Limit]' : (status === 'success' ? '✅ [ProposalIQ Log]' : (status === 'failure' ? '🔴 [ProposalIQ Error]' : '📊 [ProposalIQ Log]'));
  console.log(`${prefix} ${status.toUpperCase()}: ${details}`);
}

// ---- RETRY WRAPPER ----
async function callAIWithRetry(jobPost, skill, exp, tone, platform, apiKey, isPro, retries = 2, delayMs = 2500) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      logApiCall('attempt', `Proposal generation attempt ${attempt}/${retries + 1} (${isPro ? 'Pro Backend' : 'Local API Key'})`);
      let result;
      if (isPro) {
        const responseData = await callBackendAI('proposal', { jobPost, skill, exp, tone, platform });
        if (responseData && responseData.success) {
          result = responseData.data;
        } else {
          throw new Error(responseData?.error || 'Failed to generate proposal.');
        }
      } else {
        result = await callGeminiAI(jobPost, skill, exp, tone, platform, apiKey);
      }
      logApiCall('success', 'Proposal generated successfully.');
      return result;
    } catch (err) {
      const errMessage = err.message || '';
      const isRateLimit = errMessage.toLowerCase().includes('429') || errMessage.toLowerCase().includes('quota') || errMessage.toLowerCase().includes('limit') || errMessage.toLowerCase().includes('exhausted');

      logApiCall('failure', `Attempt ${attempt} failed: ${errMessage}`, isRateLimit);

      if (attempt <= retries) {
        const backoff = delayMs * attempt; // Exponential backoff
        console.warn(`[ProposalIQ] Transient error detected. Retrying in ${backoff / 1000}s...`);
        await delay(backoff);
      } else {
        throw err; // Re-throw the error on the final attempt
      }
    }
  }
}

// ---- GENERATE PROPOSAL ----
document.getElementById('generateBtn').addEventListener('click', async () => {
  if (enforceGuestLimit()) return;
  const jobPost = document.getElementById('jobPost').value.trim();
  if (!jobPost || jobPost.length < 20) { shakeEl(document.getElementById('jobPost')); return; }

  const skill    = document.getElementById('skillCategory').value || 'General';
  const exp      = document.getElementById('expLevel').value || 'Intermediate';
  const tone     = document.querySelector('.tone-pill.active')?.dataset.tone || 'professional';
  const platform = document.querySelector('.platform-pill.active')?.dataset.platform || 'Upwork';

  setLoadingState(true);

  // Clear previous error styles
  const badge = document.getElementById('analysisBadge');
  if (badge) {
    badge.className = 'panel-badge';
  }

  // Clear previous warnings or error screens
  const demoBanner = document.getElementById('demoWarningBanner');
  if (demoBanner) demoBanner.classList.remove('visible');

  try {
    const isPro = shouldCallBackend();
    const apiKey = getApiKey();
    let result;

    if (isPro || apiKey) {
      // Call with retry - do not silently fall back to Demo Mode
      result = await callAIWithRetry(jobPost, skill, exp, tone, platform, apiKey, isPro);
      
      document.getElementById('analysisBadge').textContent = '🤖 Gemini AI';
      document.getElementById('analysisBadge').className = 'panel-badge done';
      if (demoBanner) demoBanner.classList.remove('visible');
    } else {
      // Free/Guest users without connected key get Demo Mode (Simulation fallback)
      logApiCall('demo', 'No API key or Pro account. Triggering intentional Demo Mode.');
      await delay(1200);
      result = simulateAnalysis(jobPost, skill, exp, tone, platform);
      document.getElementById('analysisBadge').textContent = '⚡ Demo Mode';
      document.getElementById('analysisBadge').className = 'panel-badge demo';
      if (demoBanner) demoBanner.classList.add('visible');
      showToast('ℹ️ Running in Demo Mode. Connect AI or Upgrade to Pro for real AI proposals.', 'info');
    }
    renderResults(result);
    incrementGuestLimit();
  } catch (err) {
    console.error('🔴 [ProposalIQ] PROPOSAL GENERATION FAILED:', err);

    // Show a detailed visible error banner with the exact error
    const errCode = err.message.match(/\[(\d{3})\]/)?.[1] || 'ERR';
    let errHint = '';
    if (errCode === '401') errHint = ' (Invalid API Key — key is wrong or expired)';
    else if (errCode === '403') errHint = ' (Permission Denied — key may not have Gemini API access)';
    else if (errCode === '429') errHint = ' (Rate Limit / Quota Exceeded — too many requests)';
    else if (errCode === '400') errHint = ' (Bad Request — check API key format)';
    else if (errCode === '500') errHint = ' (Gemini Server Error — try again in a moment)';

    const errMsg = `❌ API Error [${errCode}]${errHint}: ${err.message}`;
    showToast(errMsg, 'error');

    // Show error inline above output panel too
    if (badge) {
      badge.textContent = `⚠️ Error ${errCode}`;
      badge.className = 'panel-badge error';
    }

    // Render a nice error container with a retry button instead of fallback
    const outputEl = document.getElementById('proposalOutput');
    const outputText = document.getElementById('outputText');
    outputEl.style.display = 'block';

    outputText.innerHTML = `
      <div class="error-container" style="padding: 24px; text-align: center; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; margin: 16px 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        <div style="font-size: 24px; margin-bottom: 12px;">⚠️</div>
        <div style="font-size: 18px; font-weight: bold; color: #ef4444; margin-bottom: 8px;">AI Generation Failed</div>
        <div style="font-size: 14px; color: #e5e7eb; margin-bottom: 16px; max-width: 450px; margin-left: auto; margin-right: auto;">
          It looks like the request failed. This is often caused by temporary rate limits or connection issues. Please wait a moment and try again.
        </div>
        <div style="font-size: 12px; color: #9ca3af; font-family: monospace; background: rgba(0, 0, 0, 0.2); padding: 8px 12px; border-radius: 6px; margin-bottom: 20px; max-width: 500px; margin-left: auto; margin-right: auto; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">
          Details: [${errCode}] ${err.message}
        </div>
        <button id="retryGenerateBtn" class="btn-generate" style="margin: 0 auto; width: auto; min-width: 180px; padding: 10px 20px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🔄 Retry Generation</span>
        </button>
      </div>
    `;

    // Hook up retry button action
    document.getElementById('retryGenerateBtn').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('generateBtn').click();
    });
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

10. NO AI SIGNATURE OR BUZZWORDS: Banish words like "excited", "thrilled", "delighted", "passion", "ensure", "robust", "leverage", "look no further", "streamline", "cutting-edge", or "business opportunity". Do not use transition words like "Additionally", "Moreover", "Furthermore", or "In summary" to start paragraphs.

11. NATURAL CONVERSATIONAL TONE: Write in the first-person active voice of an individual professional freelancer. Use a relaxed, confident, plainspoken tone. Vary sentence structures and lengths to make it feel human and written by hand, not perfectly generated.

STEP 3 — Before finalizing, silently check: "Did I address every single explicit request the client made? Did I reference their specific pain point? Did I avoid all generic claims and fake bullet formatting?" If any answer is no, rewrite before returning the output.
---`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    })
  });

  // ---- FULL ERROR LOGGING ----
  if (!resp.ok) {
    let errBody = '';
    try { errBody = await resp.text(); } catch (_) {}
    let errMsg = '';
    try { const errJson = JSON.parse(errBody); errMsg = errJson?.error?.message || errBody; } catch (_) { errMsg = errBody; }
    const detail = `Gemini API Error — HTTP ${resp.status}\nMessage: ${errMsg || '(no message)'}`;
    console.error('🔴 [ProposalIQ] ' + detail);
    console.error('🔴 [ProposalIQ] Raw error body:', errBody);
    throw new Error(`[${resp.status}] ${errMsg || resp.statusText || 'Unknown error'}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    console.error('🔴 [ProposalIQ] Gemini returned empty response. Full response:', JSON.stringify(data));
    throw new Error('Empty AI response — check console for full Gemini response');
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('🔴 [ProposalIQ] Could not parse JSON from Gemini response. Raw text:', text);
    throw new Error('Could not parse AI response — check console for raw text');
  }

  return JSON.parse(jsonMatch[0]);
}

// ---- CALL BACKEND SERVERLESS API ----
async function callBackendAI(type, payload) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const user = window.currentUser ? window.currentUser() : null;

    if (user) {
      headers['X-User-Email'] = user.email || '';
      headers['X-User-Plan'] = user.plan || 'free';
    }

    if (window.useFirebase && firebase.auth().currentUser) {
      try {
        const token = await firebase.auth().currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.warn('Failed to get auth token:', err);
      }
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ type, payload })
    });

    // ---- FULL BACKEND ERROR LOGGING ----
    const rawBody = await response.text();
    let parsedBody;
    try { parsedBody = JSON.parse(rawBody); } catch (_) { parsedBody = null; }

    if (!response.ok) {
      const detail = `Backend /api/generate Error — HTTP ${response.status}\nBody: ${rawBody}`;
      console.error('🔴 [ProposalIQ] ' + detail);
      throw new Error(`Backend error [${response.status}]: ${parsedBody?.error || rawBody || response.statusText}`);
    }

    if (parsedBody && parsedBody.success) {
      if (!parsedBody.data?.proposal && parsedBody.error) {
        console.error('🔴 [ProposalIQ] Backend returned success=false. Error:', parsedBody.error, '| Stack:', parsedBody.stack || '');
      }
      return parsedBody;
    } else {
      console.error('🔴 [ProposalIQ] Backend returned success=false. Full body:', rawBody);
      throw new Error(parsedBody?.error || 'Backend returned no data');
    }
  } catch (e) {
    console.error('🔴 [ProposalIQ] callBackendAI exception:', e.message);
    throw e;
  }
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

  // Clean up experience level and skill category to avoid literal placeholder leaks
  let cleanExp = 'experienced';
  if (exp.toLowerCase().includes('beginner')) cleanExp = 'entry-level';
  else if (exp.toLowerCase().includes('intermediate')) cleanExp = 'intermediate';
  else if (exp.toLowerCase().includes('expert')) cleanExp = 'expert';
  else if (exp.toLowerCase().includes('senior')) cleanExp = 'senior-level';

  let cleanExpWhy = 'Strong';
  if (exp.toLowerCase().includes('beginner')) cleanExpWhy = 'Fresh, hands-on';
  else if (exp.toLowerCase().includes('intermediate')) cleanExpWhy = 'Solid';
  else if (exp.toLowerCase().includes('expert')) cleanExpWhy = 'Expert-level';
  else if (exp.toLowerCase().includes('senior')) cleanExpWhy = 'Extensive';

  const skillCategoryClean = skill && skill !== 'General' ? skill : 'freelance services';

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
      `This project aligns perfectly with my background in ${skillCategoryClean}. Let me explain how I'd approach it.`,
      `Your job description is well-structured and it's clear you know exactly what you want — which makes my job easier.`,
      `Having worked on similar ${skillCategoryClean} projects on ${platform}, I understand the challenges you're facing and how to solve them efficiently.`,
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
      opening: `Here's my ${cleanExp} take on your project:`,
      bullets: [
        `→ Start with a thorough discovery session to fully understand your goals`,
        `→ Build iteratively with your feedback at every step`,
        `→ Deliver clean, documented, and scalable output`,
      ],
      why: [
        `✓ ${cleanExpWhy} hands-on experience in ${skillCategoryClean}`,
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
        `⚡ Proven track record with ${skillCategoryClean} projects`,
        `⚡ I communicate proactively — no chasing required`,
        `⚡ Quality output with zero compromise on deadlines`,
      ]
    },
    {
      opening: `Why I'm the right fit for this:`,
      bullets: [
        `• I've completed 10+ similar ${skillCategoryClean} projects in the past 12 months`,
        `• My average delivery time is 20% faster than the deadline`,
        `• You'll get daily progress updates, not radio silence`,
      ],
      why: [
        `→ Technical expertise: ${skillCategoryClean}`,
        `→ Experience level: ${cleanExp}`,
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
        `🎯 Specialized in ${skillCategoryClean} — not a generalist`,
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
  const skillRef = skillCategoryClean;
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

// ============================================================
//  FEATURE TAB SWITCHER
// ============================================================
function switchFeatureTab(tabId) {
  ['proposalGen','fiverrRequest','clientMsg','followUp','coldEmail'].forEach(id => {
    const el = document.getElementById('tab-' + id);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('tab-' + tabId);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.feature-tab').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.feature-tab[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const analytics = document.querySelector('.analytics-panel');
  if (analytics) analytics.style.display = tabId === 'proposalGen' ? '' : 'none';

  // Update sidebar active link
  const activeNav = document.querySelector('.nav-item.active');
  if (!activeNav || activeNav.getAttribute('data-tab') !== tabId) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (targetNav) targetNav.classList.add('active');
  }

  // Load history when switching to cold email tab
  if (tabId === 'coldEmail') loadColdEmailHistory();
}

// ============================================================
//  COPY OUTPUT HELPER (for new tabs)
// ============================================================
function copyOutput(elId, btn) {
  const text = document.getElementById(elId)?.innerText || '';
  if (!text) return;
  function fallback(t) { const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta); }
  try {
    if (navigator.clipboard) { navigator.clipboard.writeText(text).catch(() => fallback(text)); }
    else { fallback(text); }
    if (btn) { btn.textContent='✓ Copied!'; btn.style.background='#15803d'; setTimeout(()=>{btn.textContent='Copy';btn.style.background='';},2000); }
  } catch(e) { fallback(text); }
}

// ============================================================
//  TAB 2: FIVERR BUYER REQUEST GENERATOR
// ============================================================
async function generateFiverrReply() {
  if (enforceGuestLimit()) return;
  const request = document.getElementById('fiverrRequest')?.value.trim();
  if (!request || request.length < 15) { shakeEl(document.getElementById('fiverrRequest')); showToast('❌ Please paste a buyer request first.','error'); return; }

  const gigCat = document.getElementById('fiverrGigCat')?.value || 'General';
  const level  = document.getElementById('fiverrLevel')?.value  || 'New Seller';
  const btn    = document.getElementById('fiverrGenerateBtn');
  const outputDiv  = document.getElementById('fiverrOutput');
  const outputText = document.getElementById('fiverrOutputText');

  btn.disabled = true; btn.querySelector('.btn-content').textContent = '⏳ Generating...';

  const apiKey = getApiKey();
  let reply = '';

  try {
    const isPro = shouldCallBackend();
    if (isPro) {
      const responseData = await callBackendAI('fiverr', { request, gigCat, level });
      if (responseData && responseData.success) {
        reply = responseData.reply;
      } else {
        throw new Error(responseData?.error || 'Backend call failed');
      }
    } else if (apiKey) {
      const prompt = `You are an expert Fiverr seller. Write a short, compelling reply to this Fiverr buyer request. Make it feel personal, not template-like. Mention their specific needs. Keep it under 120 words. Do not use "Dear" or "To Whom".

Buyer Request: """${request}"""
Seller's Gig Category: ${gigCat}
Seller Level: ${level}

Write a reply that:
1. Acknowledges their specific requirement in line 1
2. Briefly mentions relevant experience (1 line)
3. States delivery time and what they'll get
4. Ends with a soft call to action

Output ONLY the reply message, nothing else.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.75, maxOutputTokens:400} }) });
      const data = await resp.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } else {
      showToast('ℹ️ Running in Demo Mode. Connect AI or Upgrade to Pro for real AI responses.', 'info');
    }

    if (!reply) {
      await delay(1200);
      const intros = [
        `Hi! I noticed you need ${gigCat.toLowerCase()} services and I'd love to help.`,
        `Hello! Your request for ${gigCat.toLowerCase()} caught my attention — this is exactly what I specialize in.`,
        `Hi there! I specialize in ${gigCat.toLowerCase()} and your project sounds like a great fit.`,
      ];
      const bodies = [
        `As a ${level} seller with hands-on experience in ${gigCat}, I can deliver exactly what you're looking for — clean, professional, and on time.`,
        `I've completed 50+ similar projects and know exactly how to handle this efficiently.`,
        `My work is focused on quality first — I won't deliver until you're 100% satisfied.`,
      ];
      const ctas = [
        `Feel free to message me so we can discuss the details and get started right away!`,
        `I'm available to start immediately. Let's chat to confirm the requirements!`,
        `Send me a message and I'll share some samples relevant to your project.`,
      ];
      const rand = arr => arr[Math.floor(Math.random()*arr.length)];
      reply = `${rand(intros)}\n\n${rand(bodies)}\n\n${rand(ctas)}`;
    }

    outputText.textContent = reply;
    outputDiv.style.display = 'block';
    outputDiv.scrollIntoView({ behavior:'smooth', block:'nearest' });
    showToast('✅ Fiverr reply ready!', 'success');
    incrementGuestLimit();
  } catch(e) {
    showToast('❌ Error: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.querySelector('.btn-content').textContent = '🛒 Generate Buyer Reply';
  }
}

// ============================================================
//  TAB 3: CLIENT MESSAGE WRITER
// ============================================================
async function generateClientReply() {
  if (enforceGuestLimit()) return;
  const msg  = document.getElementById('clientMsg')?.value.trim();
  if (!msg || msg.length < 10) { shakeEl(document.getElementById('clientMsg')); showToast('❌ Please paste the client message first.','error'); return; }

  const type  = document.getElementById('clientMsgType')?.value  || 'inquiry';
  const tone  = document.getElementById('clientMsgTone')?.value  || 'professional';
  const outputDiv  = document.getElementById('clientMsgOutput');
  const outputText = document.getElementById('clientMsgOutputText');

  outputText.textContent = '⏳ Writing your reply...';
  outputDiv.style.display = 'block';

  const apiKey = getApiKey();
  let reply = '';

  try {
    const isPro = shouldCallBackend();
    if (isPro) {
      const responseData = await callBackendAI('client', { msg, type, tone });
      if (responseData && responseData.success) {
        reply = responseData.reply;
      } else {
        throw new Error(responseData?.error || 'Backend call failed');
      }
    } else if (apiKey) {
      const prompt = `You are a professional freelancer. Write a reply to the following client message.
Message Type: ${type}
Tone: ${tone}
Client's Message: """${msg}"""

Write a reply that:
- Addresses every point the client raised
- Is ${tone} in tone
- Is under 150 words
- Feels human, not robotic or template-like
- Ends with a clear next step

Output ONLY the reply, nothing else.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7, maxOutputTokens:500} }) });
      const data = await resp.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } else {
      showToast('ℹ️ Running in Demo Mode. Connect AI or Upgrade to Pro for real AI responses.', 'info');
    }

    if (!reply) {
      await delay(1000);
      const templates = {
        inquiry:     `Hi! Thanks for reaching out.\n\nTo answer your questions: I have hands-on experience with exactly the type of project you've described, and I'm confident in delivering great results within your timeline.\n\nI'd be happy to share relevant samples or jump on a quick call to discuss further. What works best for you?`,
        negotiation: `Hi! Thanks for your message.\n\nI completely understand budget considerations. While my standard rate reflects the quality and timeline I deliver, I'm open to finding a middle ground.\n\nIf we adjust the scope slightly or extend the deadline by a couple of days, I may be able to accommodate your budget. Let me know your thoughts and we can work something out!`,
        revision:    `Hi! Absolutely, I want to make sure this is perfect for you.\n\nThank you for the detailed feedback — I completely understand what needs to be changed. I'll get started on the revisions right away and send you the updated version within [timeframe].\n\nPlease feel free to share any additional notes so I can get it right this time!`,
        delay:       `Hi! Thank you for letting me know in advance — I really appreciate that.\n\nI understand completely. Take the time you need and please don't rush on my account. I'll keep the project open on my end, and whenever you're ready to move forward, just send me a message.\n\nLooking forward to working with you!`,
        complaint:   `Hi! I sincerely apologize for the experience — this is not the standard I hold myself to.\n\nThank you for bringing this to my attention. I want to make this right for you. Please tell me specifically what didn't meet your expectations and I will fix it as a priority, no questions asked.\n\nYour satisfaction is my top concern.`,
        positive:    `Hi! Thank you so much — this genuinely made my day!\n\nIt was a real pleasure working on this project with you. Your clear communication made everything smoother, and I'm glad the outcome met your expectations.\n\nIf you ever have future projects, I'd love to work together again. Please feel free to reach out anytime!`,
      };
      reply = templates[type] || templates.inquiry;
    }

    outputText.textContent = reply;
    outputDiv.scrollIntoView({ behavior:'smooth', block:'nearest' });
    showToast('✅ Client reply ready!', 'success');
    incrementGuestLimit();
  } catch(e) {
    showToast('❌ Error: ' + e.message, 'error');
  }
}

// ============================================================
//  TAB 4: FOLLOW-UP GENERATOR
// ============================================================
async function generateFollowUp() {
  if (enforceGuestLimit()) return;
  const context  = document.getElementById('followUpContext')?.value.trim();
  if (!context || context.length < 10) { shakeEl(document.getElementById('followUpContext')); showToast('❌ Please describe your original proposal first.','error'); return; }

  const followNum  = document.getElementById('followUpNumber')?.value  || '1st';
  const platform   = document.getElementById('followUpPlatform')?.value || 'Upwork';
  const outputDiv  = document.getElementById('followUpOutput');
  const outputText = document.getElementById('followUpOutputText');

  outputText.textContent = '⏳ Crafting follow-up...';
  outputDiv.style.display = 'block';

  const apiKey = getApiKey();
  let reply = '';

  try {
    const isPro = shouldCallBackend();
    if (isPro) {
      const responseData = await callBackendAI('followup', { context, followNum, platform });
      if (responseData && responseData.success) {
        reply = responseData.reply;
      } else {
        throw new Error(responseData?.error || 'Backend call failed');
      }
    } else if (apiKey) {
      const prompt = `You are a professional freelancer on ${platform}. Write a ${followNum} follow-up message for the following context.

Context: """${context}"""

Rules:
- This is a ${followNum} follow-up — match the urgency level accordingly
- Keep it SHORT (under 80 words) — respect their time
- Do NOT be desperate or pushy
- Remind them of the value you offer in one line
- End with ONE clear, easy question or call to action
- Sound natural and human

Output ONLY the follow-up message.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7, maxOutputTokens:300} }) });
      const data = await resp.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } else {
      showToast('ℹ️ Running in Demo Mode. Connect AI or Upgrade to Pro for real AI responses.', 'info');
    }

    if (!reply) {
      await delay(900);
      const msgs = {
        '1st':  `Hi! I just wanted to follow up on my proposal from a couple of days ago.\n\nI'm still very interested in your project and believe I can deliver exactly what you need. If you have any questions or need any clarification, I'm happy to jump on a quick call.\n\nLooking forward to hearing from you!`,
        '2nd':  `Hi again! I understand you're probably busy — I just wanted to check in one more time before I close out my availability for this week.\n\nIf the project is still moving forward, I'd love to be part of it. Is there anything specific holding back a decision that I can address?\n\nEither way, thanks for your time!`,
        'final':`Hi! This will be my last follow-up — I don't want to clutter your inbox.\n\nIf the timing isn't right, that's completely okay. If you do decide to move forward in the future, I'd still be happy to work together.\n\nWishing you all the best with your project! 🙂`,
      };
      reply = msgs[followNum] || msgs['1st'];
    }

    outputText.textContent = reply;
    outputDiv.scrollIntoView({ behavior:'smooth', block:'nearest' });
    showToast('✅ Follow-up message ready!', 'success');
    incrementGuestLimit();
  } catch(e) {
    showToast('❌ Error: ' + e.message, 'error');
  }
}

// ============================================================
//  COLD EMAIL GENERATOR — HELPERS
// ============================================================
function setCETone(btn) {
  document.querySelectorAll('#ceTonePills .tone-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
}

function updateCharCounter(textareaId, counterId, max) {
  const len = document.getElementById(textareaId)?.value.length || 0;
  const el  = document.getElementById(counterId);
  if (el) {
    el.textContent = `${len} / ${max}`;
    el.style.color = len >= max * 0.9 ? '#ef4444' : '';
  }
}

function copyCESection(elId, btn) {
  const el = document.getElementById(elId);
  if (!el) return;
  const text = el.innerText || el.textContent || '';
  function fallback(t) { const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}finally{document.body.removeChild(ta);} }
  const success = () => { if(btn){btn.textContent='✓ Copied!';btn.style.background='#15803d';setTimeout(()=>{btn.textContent='Copy';btn.style.background='';},2000);} };
  if (navigator.clipboard) { navigator.clipboard.writeText(text).then(success).catch(()=>{fallback(text);success();}); }
  else { fallback(text); success(); }
}

function copyAllColdEmails() {
  const ids = ['ceSubjectLines','ceEmailA','ceEmailB','ceFollowup1','ceFollowup2','ceLinkedIn'];
  const labels = ['=== 5 SUBJECT LINES ===','=== COLD EMAIL VERSION A ===','=== COLD EMAIL VERSION B ===','=== FOLLOW-UP EMAIL #1 ===','=== FOLLOW-UP EMAIL #2 ===','=== LINKEDIN OUTREACH ==='];
  let full = '';
  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && el.innerText.trim()) {
      full += `${labels[i]}\n\n${el.innerText.trim()}\n\n`;
    }
  });
  if (!full) { showToast('❌ Generate emails first!', 'error'); return; }
  function fallback(t) { const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}finally{document.body.removeChild(ta);} }
  if (navigator.clipboard) { navigator.clipboard.writeText(full.trim()).then(()=>showToast('✅ All emails copied!','success')).catch(()=>{fallback(full);showToast('✅ Copied!','success');}); }
  else { fallback(full); showToast('✅ All emails copied!','success'); }
}

function exportColdEmailsTXT() {
  const prospect = document.getElementById('ceProspectName')?.value.trim() || 'Prospect';
  const company  = document.getElementById('ceCompanyName')?.value.trim() || 'Company';
  const ids = ['ceSubjectLines','ceEmailA','ceEmailB','ceFollowup1','ceFollowup2','ceLinkedIn'];
  const labels = ['5 SUBJECT LINES','COLD EMAIL VERSION A','COLD EMAIL VERSION B','FOLLOW-UP EMAIL #1','FOLLOW-UP EMAIL #2','LINKEDIN OUTREACH MESSAGE'];
  let content = `PROPOSALIQ — COLD EMAIL GENERATOR\nGenerated for: ${prospect} @ ${company}\nDate: ${new Date().toLocaleDateString()}\n${'='.repeat(50)}\n\n`;
  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && el.innerText.trim()) {
      content += `${labels[i]}\n${'-'.repeat(40)}\n${el.innerText.trim()}\n\n`;
    }
  });
  if (!content.includes('---')) { showToast('❌ Generate emails first!', 'error'); return; }
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `cold-email-${prospect.replace(/\s+/g,'-').toLowerCase()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ TXT file downloaded!', 'success');
}

const CE_HISTORY_KEY = 'proposaliq_ce_history';
const BACKWARD_CE_HISTORY_KEY = 'winscope_ce_history';

function getColdEmailHistoryRaw() {
  return localStorage.getItem(CE_HISTORY_KEY) || localStorage.getItem(BACKWARD_CE_HISTORY_KEY) || '[]';
}

function saveColdEmailHistory() {
  const prospect = document.getElementById('ceProspectName')?.value.trim();
  const company  = document.getElementById('ceCompanyName')?.value.trim();
  if (!prospect || !company) { showToast('❌ No emails to save yet.', 'error'); return; }

  const ids = ['ceSubjectLines','ceEmailA','ceEmailB','ceFollowup1','ceFollowup2','ceLinkedIn'];
  const data = {};
  ids.forEach(id => { const el = document.getElementById(id); if(el) data[id] = el.innerText.trim(); });

  const existing = JSON.parse(getColdEmailHistoryRaw());
  existing.unshift({ prospect, company, data, time: Date.now() });
  if (existing.length > 5) existing.pop();
  localStorage.setItem(CE_HISTORY_KEY, JSON.stringify(existing));
  localStorage.removeItem(BACKWARD_CE_HISTORY_KEY);
  loadColdEmailHistory();
  showToast('✅ Saved to history!', 'success');
}

function loadColdEmailHistory() {
  const history = JSON.parse(getColdEmailHistoryRaw());
  const section = document.getElementById('ceHistorySection');
  const list    = document.getElementById('ceHistoryList');
  if (!section || !list) return;
  if (!history.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = history.map((item, i) => {
    const ago = timeAgo(item.time);
    return `<div class="ce-history-item" onclick="restoreCEHistory(${i})">
      <div class="ce-history-meta">
        <span class="ce-history-name">${item.prospect} — ${item.company}</span>
        <span class="ce-history-time">${ago}</span>
      </div>
      <span class="ce-history-restore">↩ Restore</span>
    </div>`;
  }).join('');
}

function restoreCEHistory(idx) {
  const history = JSON.parse(getColdEmailHistoryRaw());
  const item = history[idx];
  if (!item) return;
  document.getElementById('ceProspectName').value = item.prospect;
  document.getElementById('ceCompanyName').value  = item.company;
  Object.keys(item.data).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = item.data[id];
  });
  renderCESubjectLines(item.data['ceSubjectLines'] || '');
  document.getElementById('ceOutputSection').style.display = 'block';
  showToast('✅ History restored!', 'success');
  document.getElementById('ceOutputSection').scrollIntoView({ behavior:'smooth', block:'start' });
}

function clearColdEmailHistory() {
  localStorage.removeItem(CE_HISTORY_KEY);
  localStorage.removeItem(BACKWARD_CE_HISTORY_KEY);
  loadColdEmailHistory();
  showToast('🗑️ History cleared.', 'info');
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins} minute${mins>1?'s':''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs>1?'s':''} ago`;
  return `${Math.floor(hrs/24)} day(s) ago`;
}

function renderCESubjectLines(text) {
  const el = document.getElementById('ceSubjectLines');
  if (!el) return;
  const lines = text.split('\n').filter(l => l.trim()).slice(0, 5);
  if (!lines.length) { el.textContent = text; return; }
  el.innerHTML = lines.map((line, i) => {
    const clean = line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-•*]\s*/, '').trim();
    return `<div class="ce-subject-line">
      <span class="ce-subject-num">${i+1}</span>
      <span class="ce-subject-text">${clean}</span>
    </div>`;
  }).join('');
}

// ============================================================
//  TAB 5: COLD EMAIL GENERATOR — MAIN FUNCTION
// ============================================================
async function generateColdEmail() {
  if (enforceGuestLimit()) return;
  const prospect = document.getElementById('ceProspectName')?.value.trim();
  const company  = document.getElementById('ceCompanyName')?.value.trim();
  const service  = document.getElementById('ceService')?.value.trim();
  const goal     = document.getElementById('ceGoal')?.value.trim();

  if (!prospect) { shakeEl(document.getElementById('ceProspectName')); showToast('❌ Enter prospect name.','error'); return; }
  if (!company)  { shakeEl(document.getElementById('ceCompanyName'));  showToast('❌ Enter company name.','error'); return; }
  if (!service)  { shakeEl(document.getElementById('ceService'));      showToast('❌ Enter your service.','error'); return; }
  if (!goal)     { shakeEl(document.getElementById('ceGoal'));         showToast('❌ Enter your goal/value prop.','error'); return; }

  const industry = document.getElementById('ceIndustry')?.value || 'SaaS';
  const tone     = document.querySelector('#ceTonePills .tone-pill.active')?.dataset.tone || 'Professional';

  const btn = document.getElementById('ceGenerateBtn');
  btn.disabled = true;
  btn.querySelector('.btn-content').textContent = '⏳ Generating...';

  // Show skeleton loading
  const outputSection = document.getElementById('ceOutputSection');
  outputSection.style.display = 'block';
  const cardIds = ['ceSubjectLines','ceEmailA','ceEmailB','ceFollowup1','ceFollowup2','ceLinkedIn'];
  cardIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="ce-loading-pulse"></div><div class="ce-loading-pulse" style="width:80%"></div><div class="ce-loading-pulse" style="width:60%"></div>`;
  });
  outputSection.scrollIntoView({ behavior:'smooth', block:'start' });

  const apiKey = getApiKey();
  let results = null;

  try {
    const isPro = shouldCallBackend();
    if (isPro) {
      const responseData = await callBackendAI('coldemail', { prospect, company, industry, service, goal, tone });
      if (responseData && responseData.success) {
        results = responseData.data;
      } else {
        throw new Error(responseData?.error || 'Backend call failed');
      }
    } else if (apiKey) {
      const prompt = `You are a world-class cold email copywriter. Generate high-converting cold email content for the following prospect.

Prospect: ${prospect}
Company: ${company}
Industry: ${industry}
Service Offered: ${service}
Goal / Value Prop: ${goal}
Tone: ${tone}

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
- Open with a strong hook referencing ${company} or ${industry}
- Focus on THEIR problem, not your service
- Keep emails under 120 words each
- Make subject lines curiosity-driven or value-driven
- LinkedIn message must be under 300 characters
- Tone: ${tone}
- Human sounding, not AI-generated sounding
- Strong, specific CTA at the end of each email`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2000 }
        })
      });
      const data = await resp.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      }
    } else {
      showToast('ℹ️ Running in Demo Mode. Connect AI or Upgrade to Pro for real AI responses.', 'info');
    }

    // Smart simulation fallback
    if (!results) {
      await delay(1800);
      const hooks = {
        Professional: `I was looking at ${company}'s recent work in the ${industry} space`,
        Friendly:     `Hey ${prospect}, I came across ${company} and loved what you're building`,
        Direct:       `${company} is leaving revenue on the table. Here's why`,
        Premium:      `Most ${industry} companies we work with had the same challenge before we helped them fix it`,
      };
      const ctaMap = {
        Professional: `Would you be open to a 15-minute call this week?`,
        Friendly:     `Would love to chat — what does your schedule look like this week?`,
        Direct:       `Can we talk Thursday or Friday for 15 minutes?`,
        Premium:      `I have one spot open this week for an introductory call. Interested?`,
      };
      const hook = hooks[tone] || hooks.Professional;
      const cta  = ctaMap[tone]  || ctaMap.Professional;
      results = {
        subjectLines: [
          `Quick question about ${company}'s ${service.toLowerCase()} strategy`,
          `How ${industry} companies are getting 3x results with ${service}`,
          `${prospect}, saw something interesting about ${company}`,
          `The ${service.toLowerCase()} gap most ${industry} companies don't see`,
          `15 min call? This could be useful for ${company}`,
        ],
        emailA: `${hook} — and I noticed an opportunity that most ${industry} companies miss.\n\nWe help businesses like ${company} ${goal.toLowerCase()}.\n\nRecently worked with a similar ${industry} company and delivered results within 60 days.\n\n${cta}\n\nBest,\n[Your Name]`,
        emailB: `${prospect},\n\nMost ${industry} companies struggle with ${service.toLowerCase()} — not because of effort, but because of approach.\n\nWe've refined a process that helps companies ${goal.toLowerCase()}.\n\nI'd love to show you exactly what we did for a company similar to ${company}.\n\n${cta}\n\n[Your Name]`,
        followup1: `Hi ${prospect},\n\nJust following up on my last note — wanted to make sure it didn't get buried.\n\n${company} seems like a great fit for what we do. Happy to share a quick case study if helpful.\n\n${cta}\n\n[Your Name]`,
        followup2: `Hi ${prospect},\n\nI'll keep this brief — last follow-up, I promise.\n\nIf ${service.toLowerCase()} isn't a priority right now, no worries at all.\n\nBut if it ever becomes one, I'd love to be your first call.\n\nWishing you and ${company} the best! 🙂`,
        linkedin: `Hi ${prospect}! I help ${industry} companies ${goal.toLowerCase()}. Thought there might be a fit with ${company}. Would love to connect and share some ideas!`,
      };
    }

    // Render results
    renderCESubjectLines(results.subjectLines?.join('\n') || '');
    document.getElementById('ceEmailA').textContent    = results.emailA    || '';
    document.getElementById('ceEmailB').textContent    = results.emailB    || '';
    document.getElementById('ceFollowup1').textContent = results.followup1 || '';
    document.getElementById('ceFollowup2').textContent = results.followup2 || '';
    document.getElementById('ceLinkedIn').textContent  = results.linkedin  || '';

    showToast('✅ Cold emails generated!', 'success');
    loadColdEmailHistory();
    incrementGuestLimit();
  } catch(err) {
    cardIds.forEach(id => { const el = document.getElementById(id); if(el) el.textContent = ''; });
    showToast('❌ Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-content').textContent = '✉️ Generate Cold Emails';
  }
}

