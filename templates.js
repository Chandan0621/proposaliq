// templates.js — ProposalIQ Visual Editor (80 Templates)

const TEMPLATE_CATEGORIES = [
  { id:'webdev',    icon:'🌐', name:'Web Development',      color:'#3b82f6', bg:'linear-gradient(135deg,#1e3a8a,#3b82f6)' },
  { id:'seo',       icon:'📈', name:'SEO / Marketing',       color:'#f59e0b', bg:'linear-gradient(135deg,#78350f,#f59e0b)' },
  { id:'writing',   icon:'✍️', name:'Content Writing',       color:'#8b5cf6', bg:'linear-gradient(135deg,#4c1d95,#8b5cf6)' },
  { id:'design',    icon:'🎨', name:'UI/UX Design',          color:'#ec4899', bg:'linear-gradient(135deg,#831843,#ec4899)' },
  { id:'mobile',    icon:'📱', name:'Mobile App',            color:'#10b981', bg:'linear-gradient(135deg,#064e3b,#10b981)' },
  { id:'video',     icon:'🎬', name:'Video Editing',         color:'#ef4444', bg:'linear-gradient(135deg,#7f1d1d,#ef4444)' },
  { id:'data',      icon:'📊', name:'Data Analysis',         color:'#06b6d4', bg:'linear-gradient(135deg,#164e63,#06b6d4)' },
  { id:'ecommerce', icon:'🛒', name:'eCommerce / Shopify',   color:'#84cc16', bg:'linear-gradient(135deg,#365314,#84cc16)' },
];

let currentCategoryId = null;
let currentVariantIdx  = null;
let currentColor       = '#7c3aed';
let currentBg          = 'linear-gradient(135deg,#7c3aed,#3b82f6)';

// ---- RENDER CATEGORY GALLERY ----
function renderTemplateGallery() {
  const el = document.getElementById('templateGallery');
  if (!el) return;
  el.innerHTML = TEMPLATE_CATEGORIES.map(c => `
    <div class="tpl-card" onclick="showVariants('${c.id}')" style="--tpl-color:${c.color}">
      <div class="tpl-card-icon">${c.icon}</div>
      <div class="tpl-card-name">${c.name}</div>
      <div class="tpl-card-tags"><span class="tpl-tag">10 Templates</span></div>
      <div class="tpl-card-action">Choose Style →</div>
    </div>`).join('');
}

// ---- SHOW VARIANT PICKER ----
function showVariants(catId) {
  const cat     = TEMPLATE_CATEGORIES.find(c => c.id === catId);
  const variants = (typeof TEMPLATE_DATA !== 'undefined' && TEMPLATE_DATA[catId]) ? TEMPLATE_DATA[catId] : [];
  if (!cat || !variants.length) { showToast('Template data loading...','info'); return; }

  currentCategoryId = catId;
  currentColor      = cat.color;
  currentBg         = cat.bg;

  const el = document.getElementById('templateGallery');
  const section = document.getElementById('templateGallerySection');

  const isPro   = false; // Locked for everyone
  const lockBadge = isPro ? '' : '<span style="position:absolute;top:10px;right:10px;font-size:14px;" title="Pro Feature">🔒</span>';

  // Back button + variant grid
  el.innerHTML = `
    <div style="grid-column:1/-1;display:flex;align-items:center;gap:12px;margin-bottom:4px;flex-wrap:wrap;">
      <button onclick="renderTemplateGallery()" style="background:none;border:1.5px solid #e8e0f8;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;color:#7c3aed;">← Back</button>
      <span style="font-size:14px;font-weight:700;color:#1e1b4b;">${cat.icon} ${cat.name} — Choose a Template Style</span>
      ${!isPro ? '<span style="font-size:12px;background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:20px;font-weight:600;">🔒 Upgrade to Pro to unlock all templates</span>' : ''}
    </div>
    ${variants.map((v,i) => `
      <div class="tpl-card" onclick="openTemplateEditor('${catId}',${i})" style="--tpl-color:${cat.color};position:relative;">
        ${lockBadge}
        <div style="font-size:11px;font-weight:700;background:${cat.color}18;color:${cat.color};padding:3px 8px;border-radius:20px;display:inline-block;margin-bottom:8px;">${v.tag}</div>
        <div class="tpl-card-name">${v.name}</div>
        <div style="font-size:12px;color:#6b7280;margin:6px 0 10px;line-height:1.5;">"${v.intro.substring(0,70)}..."</div>
        <div class="tpl-card-action">${isPro ? 'Use This Template →' : '🔒 Pro Only — Upgrade →'}</div>
      </div>`).join('')}`;
}

// ---- OPEN EDITOR ----
function openTemplateEditor(catId, variantIdx) {
  const cat     = TEMPLATE_CATEGORIES.find(c => c.id === catId);
  const variant = TEMPLATE_DATA?.[catId]?.[variantIdx];
  if (!cat || !variant) return;

  // ---- PRO GATE ----
  const isPro = false; // Locked for everyone

  if (!isPro) {
    // Show locked overlay instead of editor
    showTemplateLockedPrompt(cat, variant);
    return;
  }

  currentCategoryId = catId;
  currentVariantIdx = variantIdx;
  currentColor      = cat.color;
  currentBg         = cat.bg;

  document.getElementById('tplEditorName').textContent = `${cat.icon} ${cat.name} — ${variant.name}`;
  document.getElementById('tplDocCanvas').innerHTML    = buildDocHTML(cat, variant);
  document.getElementById('templateEditorModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ---- LOCKED PROMPT FOR FREE USERS ----
function showTemplateLockedPrompt(cat, variant) {
  const existing = document.getElementById('tplLockedOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'tplLockedOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:36px 32px;max-width:440px;width:92%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.25);font-family:Inter,sans-serif;">
      <div style="font-size:52px;margin-bottom:12px;">🔒</div>
      <h2 style="font-size:20px;font-weight:800;color:#1e1b4b;margin:0 0 8px;">Templates Locked</h2>
      <p style="color:#6b7280;font-size:13.5px;line-height:1.7;margin:0 0 20px;">
        The <b style="color:${cat.color};">${cat.icon} ${cat.name} — ${variant.name}</b> template is locked. <br><br>
        Proposal templates are premium features and are currently disabled.
      </p>
      <div style="display:flex;gap:10px;flex-direction:column;">
        <button onclick="document.getElementById('tplLockedOverlay').remove();"
          style="width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:0.3px;">
          OK, Got it
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function closeTemplateEditor() {
  document.getElementById('templateEditorModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ---- BUILD VISUAL DOCUMENT ----
function buildDocHTML(cat, v) {
  const c  = cat.color;
  const bg = cat.bg;

  const deliverableDefaults = {
    webdev:    ['Fully responsive website (Mobile + Desktop)','SEO-optimized code, PageSpeed 90+','Cross-browser compatibility (Chrome, Firefox, Safari)','Source code + full documentation handover','Free revisions until 100% satisfied'],
    seo:       ['Complete SEO audit + action roadmap','Keyword research targeting high-intent terms','On-page optimization (titles, meta, headings)','Monthly quality backlinks from relevant sites','Transparent monthly ranking report'],
    writing:   ['Thoroughly researched, 100% original article','SEO-optimized with natural keyword integration','Plagiarism checked (Copyscape verified)','Engaging headlines & scannable structure','Up to 2 revision rounds included'],
    design:    ['High-fidelity Figma designs for all screens','Clickable interactive prototype','Complete design system with components','Mobile + Desktop responsive layouts','Developer-ready annotated files'],
    mobile:    ['Full iOS & Android cross-platform app','Clean, scalable architecture','API integration & backend setup','App Store / Play Store deployment','7-day post-launch support included'],
    video:     ['Professional editing with smooth transitions','Cinematic color grading & correction','Custom animated titles & lower thirds','Royalty-free licensed background music','Subtitles/captions for accessibility'],
    data:      ['Data cleaning & validation','Exploratory analysis & pattern discovery','Interactive dashboard (Power BI/Tableau)','Executive summary with clear recommendations','All source files handed over'],
    ecommerce: ['Complete Shopify/WooCommerce store setup','Premium conversion-optimized theme','SEO product listings & descriptions','Payment & shipping configuration','Mobile-optimized, fast-loading store'],
  };

  const timelineDefaults = {
    webdev:    [['Day 1–2','Requirements & wireframe approval'],['Day 3–7','Full development + daily updates'],['Day 8','Testing, QA & final launch']],
    seo:       [['Month 1','Audit + technical fixes + keyword mapping'],['Month 2','On-page optimization + content strategy'],['Month 3+','Link building + growth monitoring']],
    writing:   [['Day 1','Research + outline approval'],['Day 2–3','First draft delivered'],['Day 4','Revisions + final delivery']],
    design:    [['Day 1–2','Wireframes + low-fidelity review'],['Day 3–6','Full visual design + iterations'],['Day 7','Final prototype + file handover']],
    mobile:    [['Week 1','Architecture, navigation & core screens'],['Week 2','Feature development & API integration'],['Week 3','QA, testing & App Store submission']],
    video:     [['Day 1','Receive footage + style reference'],['Day 2–3','First cut delivered for review'],['Day 4','Final export in your format']],
    data:      [['Day 1','Data review & cleaning'],['Day 2–3','Analysis & visualization build'],['Day 4','Report + dashboard delivery']],
    ecommerce: [['Day 1–2','Theme setup, branding & homepage'],['Day 3–4','Products, collections & checkout'],['Day 5–6','Testing, speed optimization & launch']],
  };

  const whyDefaults = {
    webdev:    ['5+ years of Web Development experience','Clean, documented, maintainable code','On-time delivery — always','Free revisions until you love it'],
    seo:       ['White-hat SEO — zero penalty risk','Transparent, honest monthly reporting','Proven results across multiple industries','Focus on ROI, not just vanity metrics'],
    writing:   ['Native-level English, zero grammar errors','Deep research — no shallow filler content','Consistent brand voice maintained','Never misses a deadline'],
    design:    ['User-centered design approach always','50+ apps and websites shipped','Pixel-perfect Figma output','Developer handoff with zero guesswork'],
    mobile:    ['10+ apps live on App Store & Play Store','React Native / Flutter expert','Clean code with no vendor lock-in','End-to-end delivery — design to launch'],
    video:     ['200+ videos edited with millions of views','Fast delivery without quality compromise','Brand-consistent editing across all videos','3 free revision rounds per video'],
    data:      ['Python, SQL, Excel & Power BI expert','Clear business language — no tech jargon','NDA signed on request','50+ data projects across 10+ industries'],
    ecommerce: ['30+ stores built with avg 3.5% conversion','Focus on sales — not just aesthetics','7-day post-launch support included','Full training on managing your store'],
  };

  const deliverables = deliverableDefaults[cat.id] || [];
  const timeline     = timelineDefaults[cat.id]     || [];
  const why          = whyDefaults[cat.id]           || [];

  return `
<div class="doc-header" style="background:${bg};">
  <div class="doc-header-icon">${cat.icon}</div>
  <div style="flex:1;">
    <div class="doc-header-label">PROPOSAL DOCUMENT · ${v.tag}</div>
    <h1 class="doc-title" contenteditable="true">${cat.name} Proposal</h1>
    <div class="doc-meta">
      <span>Prepared for: <b contenteditable="true">[Client Name]</b></span>
      <span>By: <b contenteditable="true">[Your Name]</b></span>
      <span>Date: <b>${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</b></span>
    </div>
  </div>
</div>
<div class="doc-body">

  <div class="doc-section">
    <div class="doc-section-label" style="color:${c};">📌 OPENING STATEMENT</div>
    <p class="doc-text" contenteditable="true">${v.intro}</p>
  </div>

  <div class="doc-section">
    <div class="doc-section-label" style="color:${c};">✅ WHAT YOU'LL GET</div>
    <ul class="doc-list" id="deliverablesList">
      ${deliverables.map(d=>`<li contenteditable="true" style="border-left:3px solid ${c};">${d}</li>`).join('')}
    </ul>
    <button class="doc-add-btn" onclick="addListItem('deliverablesList','${c}')" style="color:${c};border-color:${c};">+ Add Item</button>
  </div>

  <div class="doc-section">
    <div class="doc-section-label" style="color:${c};">📅 TIMELINE</div>
    <div class="doc-timeline">
      ${timeline.map(row=>`
      <div class="doc-timeline-row">
        <div class="doc-timeline-dot" style="background:${c};"></div>
        <div class="doc-timeline-phase" contenteditable="true" style="color:${c};">${row[0]}</div>
        <div class="doc-timeline-task" contenteditable="true">${row[1]}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="doc-section">
    <div class="doc-section-label" style="color:${c};">💰 INVESTMENT</div>
    <div class="doc-price-box" style="border-color:${c};background:${c}18;">
      <div class="doc-price-amount" style="color:${c};" contenteditable="true">${v.price}</div>
      <div class="doc-price-note" contenteditable="true">All-inclusive. No hidden fees. Satisfaction guaranteed.</div>
    </div>
  </div>

  <div class="doc-section">
    <div class="doc-section-label" style="color:${c};">🏆 WHY CHOOSE ME</div>
    <div class="doc-why-grid">
      ${why.map(w=>`<div class="doc-why-card" contenteditable="true"><span class="doc-why-icon" style="color:${c};">✓</span>${w}</div>`).join('')}
    </div>
  </div>

  <div class="doc-section doc-cta-section" style="background:${bg};">
    <div class="doc-cta-text" contenteditable="true">${v.hook}</div>
    <div class="doc-cta-sub" contenteditable="true">📩 Reply to this proposal and let's get started today.</div>
  </div>

</div>`;
}

function addListItem(listId, color) {
  const ul = document.getElementById(listId);
  if (!ul) return;
  const li = document.createElement('li');
  li.contentEditable = 'true';
  li.style.borderLeft = `3px solid ${color}`;
  li.textContent = 'Click to edit this point...';
  ul.appendChild(li);
  li.focus();
}

function copyTemplateText() {
  const text = document.getElementById('tplDocCanvas')?.innerText || '';

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
    const btn = document.getElementById('tplCopyBtn');
    if (btn) {
      btn.textContent = '✓ Copied!';
      btn.style.background = '#15803d';
      setTimeout(() => { btn.textContent = '📋 Copy Text'; btn.style.background = ''; }, 2500);
    }
    if (typeof showToast === 'function') showToast('📋 Proposal copied to clipboard!', 'success');
  };

  if (!navigator.clipboard) {
    if (fallbackCopyText(text)) successAction();
    else if (typeof showToast === 'function') showToast('❌ Failed to copy automatically. Please select text manually.', 'error');
    return;
  }

  navigator.clipboard.writeText(text).then(
    successAction,
    () => {
      if (fallbackCopyText(text)) successAction();
      else if (typeof showToast === 'function') showToast('❌ Failed to copy.', 'error');
    }
  );
}

function downloadTemplate() {
  const text = document.getElementById('tplDocCanvas')?.innerText || '';
  const cat  = TEMPLATE_CATEGORIES.find(c => c.id === currentCategoryId);
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(cat?.name||'Proposal').replace(/\s+/g,'_')}_Winscope.txt`;
  a.click();
  if (typeof showToast === 'function') showToast('📥 Downloaded!', 'success');
}

function useWithAI() {
  const text = document.getElementById('tplDocCanvas')?.innerText || '';
  closeTemplateEditor();
  const el = document.getElementById('jobPost');
  if (el) { el.value = text.substring(0, 2000); el.scrollIntoView({ behavior:'smooth', block:'center' }); }
  if (typeof showToast === 'function') showToast('✅ Template loaded! Click Generate to enhance with AI.', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTemplateGallery();
  document.getElementById('templateEditorModal')?.addEventListener('click', e => {
    if (e.target.id === 'templateEditorModal') closeTemplateEditor();
  });
});

window.openTemplateEditor  = openTemplateEditor;
window.closeTemplateEditor = closeTemplateEditor;
window.showVariants        = showVariants;
window.renderTemplateGallery = renderTemplateGallery;
window.copyTemplateText    = copyTemplateText;
window.downloadTemplate    = downloadTemplate;
window.useWithAI           = useWithAI;
window.addListItem         = addListItem;
