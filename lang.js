// ============================================
//  lang.js — Winscope Hindi/English Toggle
// ============================================

const LANG_KEY = 'piq_lang';

const T = {
  en: {
    heroHeading:   'Write Proposals That',
    heroHighlight: 'Get Replies',
    heroSub:       'AI-powered proposal intelligence for freelancers worldwide.',
    heroBadge:     '✦ AI-Powered · Trusted by 12,000+ Freelancers',
    statLabel1: 'Reply Rate Boost', statLabel2: 'Active Freelancers',
    statLabel3: 'Proposals Generated', statLabel4: 'User Rating',
    panelTitle:    '✨ Generate Proposal',
    label_job:     'Paste Job Post', label_skill: 'Skill Category',
    label_exp:     'Experience Level', label_tone: 'Preferred Tone',
    label_plat:    'Platform',
    btnGenerate:   '⚡ Generate Proposal',
    btnGenerating: '⏳ Analyzing...',
    analyticTitle: '📊 AI Analysis',
    insightTitle:  '🔎 Deep Job Insights',
    painTitle:     'Client Pain Points', wantsTitle: 'What Client Really Wants',
    avoidTitle:    'What to Avoid',     tipsTitle:  'AI Proposal Tips',
    cardReply:     'Reply Chance', cardClient: 'Client Personality',
    cardUrgency:   'Urgency Level', cardBudget: 'Budget Seriousness',
    cardGhost:     'Ghosting Risk', cardScam:   'Scam Risk',
    cardTrust:     'Trust Level',   cardPrice:  'Pricing Confidence',
    cardStrategy:  'Recommended Strategy',
    navDash:   'Dashboard', navAnalyze: 'Job Analyzer', navGenerate: 'Proposal Generator',
    navOpt:    'Proposal Optimizer', navFollow: 'Follow-up Generator',
    navScam:   'Scam Detector', navPrice: 'Price Advisor',
    navSaved:  'Saved Proposals', navHistory: 'History',
    upgradeTxt: 'Upgrade to Pro', upgradeDesc: 'Unlock unlimited AI proposals',
    upgradeBtn: 'Upgrade Now',
    searchPlaceholder: 'Search proposals, jobs...',
    connectAI: '⚙️ Connect AI',
    outputLabel: '📝 Your AI Proposal',
    copyBtn: 'Copy', saveBtn: 'Save',
    jobPlaceholder: 'Paste the full job description here... Winscope will analyze tone, requirements, budget signals, and client personality automatically.',
    strategyDefault: 'Generate a proposal to see the recommended winning strategy.',
    loginTitle: 'Sign In', signupTitle: 'Create Account',
    skipDemo: 'Skip — try demo without account',
    trialBtn: '🚀 Start 7-Day Free Trial',
    trialNote: 'No credit card required · Cancel anytime',
  },
  hi: {
    heroHeading:   'Proposals likhein jo',
    heroHighlight: 'Reply Dilayein',
    heroSub:       'Duniya bhar ke freelancers ke liye AI-powered proposal intelligence.',
    heroBadge:     '✦ AI-Powered · 12,000+ Freelancers ka Bharosa',
    statLabel1: 'Reply Rate Boost', statLabel2: 'Active Freelancers',
    statLabel3: 'Proposals Generate Hue', statLabel4: 'User Rating',
    panelTitle:    '✨ Proposal Banayein',
    label_job:     'Job Post Paste Karein', label_skill: 'Skill Category',
    label_exp:     'Experience Level', label_tone: 'Tone Chunein',
    label_plat:    'Platform',
    btnGenerate:   '⚡ Proposal Generate Karein',
    btnGenerating: '⏳ Analyze ho raha hai...',
    analyticTitle: '📊 AI Analysis',
    insightTitle:  '🔎 Job ki Gehri Jaankari',
    painTitle:     'Client ki Pareshaniyan', wantsTitle: 'Client Aslaan Kya Chahta Hai',
    avoidTitle:    'Kya Na Karein',         tipsTitle:  'AI ke Nuskhe',
    cardReply:     'Reply Chance', cardClient: 'Client ki Personality',
    cardUrgency:   'Urgency Level', cardBudget: 'Budget Kitna Serious',
    cardGhost:     'Ghosting Ka Risk', cardScam: 'Scam Ka Khatra',
    cardTrust:     'Bharosa Level',    cardPrice: 'Pricing Confidence',
    cardStrategy:  'Recommended Strategy',
    navDash:   'Dashboard', navAnalyze: 'Job Analyzer', navGenerate: 'Proposal Generator',
    navOpt:    'Proposal Optimizer', navFollow: 'Follow-up Generator',
    navScam:   'Scam Detector', navPrice: 'Price Advisor',
    navSaved:  'Save Kiye Proposals', navHistory: 'Itihas',
    upgradeTxt: 'Pro mein Upgrade Karein', upgradeDesc: 'Unlimited AI proposals unlock karein',
    upgradeBtn: 'Abhi Upgrade Karein',
    searchPlaceholder: 'Proposals, jobs dhundhen...',
    connectAI: '⚙️ AI Connect Karein',
    outputLabel: '📝 Aapka AI Proposal',
    copyBtn: 'Copy Karein', saveBtn: 'Save Karein',
    jobPlaceholder: 'Poora job description yahan paste karein... Winscope aapki tone, requirements, budget signals aur client ki personality automatically analyze karega.',
    strategyDefault: 'Proposal generate karein — winning strategy yahan dikhegi.',
    loginTitle: 'Sign In Karein', signupTitle: 'Account Banayein',
    skipDemo: 'Skip — bina account ke demo try karein',
    trialBtn: '🚀 7-Din Free Trial Shuru Karein',
    trialNote: 'Credit card ki zaroorat nahi · Kabhi bhi band karein',
  }
};

let currentLang = localStorage.getItem(LANG_KEY) || 'en';

function t(key) { return T[currentLang]?.[key] || T.en[key] || key; }

function applyLanguage() {
  const lang = currentLang;

  // Hero
  setTxt('heroHeadingLine', t('heroHeading'));
  setTxt('heroHighlightSpan', t('heroHighlight'));
  setTxt('heroSubText', t('heroSub'));
  setTxt('heroBadgeEl', t('heroBadge'));

  // Stats labels
  setTxt('statLabel1', t('statLabel1')); setTxt('statLabel2', t('statLabel2'));
  setTxt('statLabel3', t('statLabel3')); setTxt('statLabel4', t('statLabel4'));

  // Form panel
  setTxt('panelTitleEl', t('panelTitle'));
  setTxt('labelJob', t('label_job')); setTxt('labelSkill', t('label_skill'));
  setTxt('labelExp', t('label_exp')); setTxt('labelTone', t('label_tone'));
  setTxt('labelPlat', t('label_plat'));

  // Button
  const genBtn = document.getElementById('generateBtn');
  if (genBtn && !genBtn.disabled) genBtn.querySelector('.btn-content').textContent = t('btnGenerate');

  // Placeholder
  const jp = document.getElementById('jobPost');
  if (jp) jp.placeholder = t('jobPlaceholder');
  const sp = document.querySelector('.search-input');
  if (sp) sp.placeholder = t('searchPlaceholder');

  // Analytics panel
  setTxt('analyticsTitleEl', t('analyticTitle'));
  setTxt('cardLabelReply',    t('cardReply'));
  setTxt('cardLabelClient',   t('cardClient'));
  setTxt('cardLabelUrgency',  t('cardUrgency'));
  setTxt('cardLabelBudget',   t('cardBudget'));
  setTxt('cardLabelGhost',    t('cardGhost'));
  setTxt('cardLabelScam',     t('cardScam'));
  setTxt('cardLabelTrust',    t('cardTrust'));
  setTxt('cardLabelPrice',    t('cardPrice'));
  setTxt('cardLabelStrategy', t('cardStrategy'));
  const stratEl = document.getElementById('val-strategy');
  if (stratEl && stratEl.textContent.length < 50) stratEl.textContent = t('strategyDefault');

  // Insights
  setTxt('insightsTitleEl', t('insightTitle'));
  setTxt('painHeader',  '😣 ' + t('painTitle'));
  setTxt('wantsHeader', '🎯 ' + t('wantsTitle'));
  setTxt('avoidHeader', '🚫 ' + t('avoidTitle'));
  setTxt('tipsHeader',  '💡 ' + t('tipsTitle'));

  // Output
  setTxt('outputLabelEl', t('outputLabel'));
  const copyBtn = document.getElementById('copyBtn'); if(copyBtn) copyBtn.textContent = t('copyBtn');
  const saveBtn = document.getElementById('saveBtn'); if(saveBtn) saveBtn.textContent = t('saveBtn');

  // Sidebar
  setTxt('navDash',    t('navDash'));    setTxt('navAnalyze',  t('navAnalyze'));
  setTxt('navGenerate',t('navGenerate'));setTxt('navOpt',      t('navOpt'));
  setTxt('navFollow',  t('navFollow')); setTxt('navScam',     t('navScam'));
  setTxt('navPrice',   t('navPrice'));  setTxt('navSaved',    t('navSaved'));
  setTxt('navHistory', t('navHistory'));
  setTxt('upgradeTitle', t('upgradeTxt')); setTxt('upgradeDescEl', t('upgradeDesc'));
  setTxt('upgradeSidebarBtn', t('upgradeBtn'));

  // Header
  setTxt('connectAIBtn', t('connectAI'));

  // Auth
  setTxt('authDemoSkip', t('skipDemo'));
  setTxt('tabLogin',  t('loginTitle'));
  setTxt('tabSignup', t('signupTitle'));

  // Upgrade modal trial
  const trialBtn = document.querySelector('.start-trial-btn .btn-content');
  if (trialBtn) trialBtn.textContent = t('trialBtn');
  const trialNote = document.getElementById('trialNoteEl');
  if (trialNote) trialNote.textContent = t('trialNote');

  // Lang toggle button label
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) {
    langBtn.textContent = lang === 'en' ? '🌐 Switch to हिंदी' : '🌐 Switch to English';
  }

  // Update html lang
  document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'hi' : 'en';
  localStorage.setItem(LANG_KEY, currentLang);
  applyLanguage();
  const msg = currentLang === 'hi' ? 'Switched to Hindi (हिंदी)!' : 'Switched to English!';
  if (typeof showToast === 'function') showToast(msg, 'success');
}

function setTxt(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage();
  document.getElementById('langToggleBtn')?.addEventListener('click', toggleLanguage);
});

window.currentLang = () => currentLang;
window.t = t;
