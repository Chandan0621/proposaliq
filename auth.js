// ============================================
//  auth.js — ProposalIQ Complete Auth System
//  Email/Password + Google Sign-In + 7-Day Trial
//  With Firebase Cloud Integration & Local Fallback
// ============================================

const PIQ_USERS   = 'piq_users_v1';
const PIQ_SESSION = 'piq_session_v1';
let currentUserData = null;
let googleReady = false;

// ---- SAFE GOOGLE CLIENT ID ----
const G_CLIENT_ID = (typeof GOOGLE_CLIENT_ID !== 'undefined') ? GOOGLE_CLIENT_ID : '';

// ---- FIREBASE CONFIG CHECK & INIT ----
const useFirebase = (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.IS_CONFIGURED === true);
if (useFirebase) {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    console.log("🔥 Firebase Auth & Database Initialized successfully!");
  } catch (err) {
    console.error("❌ Firebase Initialization Failed:", err);
  }
} else {
  console.log("ℹ️ Firebase not configured. Running in Local Storage Demo Mode.");
}

// =====================
//  PASSWORD HASHING (Used for LocalStorage fallback)
// =====================
async function hashPassword(password) {
  try {
    const data = new TextEncoder().encode(password + 'ProposalIQ_2024_SecureSalt!');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  } catch { return btoa(password + 'fallback'); }
}

// =====================
//  STORAGE HELPERS
// =====================
function getUsers()   { try { return JSON.parse(localStorage.getItem(PIQ_USERS)||'{}'); } catch { return {}; } }
function saveUsers(u) { try { localStorage.setItem(PIQ_USERS, JSON.stringify(u)); } catch {} }
function getSession() { try { return JSON.parse(localStorage.getItem(PIQ_SESSION)||'null'); } catch { return null; } }
function saveSession(u){ try { localStorage.setItem(PIQ_SESSION, JSON.stringify(u)); } catch {} }
function clearSession(){ try { localStorage.removeItem(PIQ_SESSION); } catch {} }

// =====================
//  TRIAL SYSTEM
// =====================
function startFreeTrial() {
  const session = getSession();
  if (!session || !session.email) {
    showAuthOverlay();
    closeAllModals();
    toast('Please sign in first to start your free trial.', 'info');
    return;
  }
  if (session.plan === 'pro') { toast('You already have Pro!', 'info'); closeAllModals(); return; }
  if (session.plan === 'trial') {
    const daysLeft = getTrialDaysLeft(session);
    toast(`⏳ Trial active! ${daysLeft} day(s) remaining.`, 'info');
    closeAllModals(); return;
  }

  // Start trial
  const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const trialStart = new Date().toISOString();
  const updatedUser = { ...session, plan: 'trial', trialEnd, trialStart };

  if (useFirebase && firebase.auth().currentUser) {
    const uid = firebase.auth().currentUser.uid;
    firebase.database().ref('users/' + uid).update({
      plan: 'trial',
      trialEnd,
      trialStart
    }).then(() => {
      closeAllModals();
      toast('🎉 7-Day Pro Trial Started! Enjoy all Pro features free!', 'success');
    }).catch(e => {
      toast('❌ Error: ' + e.message, 'error');
    });
  } else {
    saveSession(updatedUser);
    currentUserData = updatedUser;
    // Update users db too
    const users = getUsers();
    if (users[session.email]) { users[session.email] = { ...users[session.email], ...updatedUser }; saveUsers(users); }
    updatePlanBadge(updatedUser);
    closeAllModals();
    toast('🎉 7-Day Pro Trial Started! Enjoy all Pro features free!', 'success');
  }
}

function getTrialDaysLeft(session) {
  if (!session?.trialEnd) return 0;
  const diff = new Date(session.trialEnd) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function checkAndUpdateTrial() {
  const session = getSession();
  if (!session) return;
  if (session.plan === 'trial' && session.trialEnd) {
    const daysLeft = getTrialDaysLeft(session);
    if (daysLeft <= 0) {
      // Trial expired
      if (useFirebase && firebase.auth().currentUser) {
        const uid = firebase.auth().currentUser.uid;
        firebase.database().ref('users/' + uid).update({
          plan: 'free',
          trialEnd: null,
          trialStart: null
        });
      } else {
        const updated = { ...session, plan: 'free' };
        delete updated.trialEnd; delete updated.trialStart;
        saveSession(updated); currentUserData = updated;
        updatePlanBadge(updated);
        toast('⏰ Your 7-day trial has ended. Upgrade to Pro to continue!', 'info');
      }
    } else {
      updatePlanBadge(session);
    }
  }
}

function updatePlanBadge(user) {
  const planEl   = document.getElementById('headerUserPlan');
  const trialEl  = document.getElementById('trialBadge');
  if (!user) return;
  if (user.plan === 'trial') {
    const days = getTrialDaysLeft(user);
    if (planEl) planEl.textContent = `Pro Trial · ${days}d left`;
    if (planEl) planEl.style.color = '#7c3aed';
    if (trialEl) { trialEl.style.display = 'flex'; trialEl.textContent = `🔥 Trial: ${days} days left`; }
  } else if (user.plan === 'pro') {
    if (planEl) planEl.textContent = '✦ Pro Member';
    if (planEl) planEl.style.color = '#7c3aed';
    if (trialEl) trialEl.style.display = 'none';
  } else {
    if (planEl) { planEl.textContent = 'Free Plan'; planEl.style.color = ''; }
    if (trialEl) trialEl.style.display = 'none';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

// =====================
//  GOOGLE SIGN-IN
// =====================
function initGoogleSignIn() {
  try {
    if (useFirebase) return; // Firebase manages Google Auth independently
    if (!G_CLIENT_ID) { googleReady = false; return; }
    google.accounts.id.initialize({
      client_id: G_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    googleReady = true;
  } catch (e) { googleReady = false; }
}

async function handleGoogleCredential(response) {
  try {
    const payload = parseJwt(response.credential);
    if (!payload.email) throw new Error('No email in token');
    const user = { name: payload.name, email: payload.email, picture: payload.picture, provider: 'google', plan: 'free' };
    const users = getUsers();
    users[payload.email] = { ...users[payload.email], ...user, createdAt: users[payload.email]?.createdAt || new Date().toISOString() };
    saveUsers(users);
    saveSession(user); currentUserData = user;
    onUserLoggedIn(user);
    toast(`✅ Welcome, ${user.name}!`, 'success');
  } catch (e) { toast('❌ Google Sign-In failed. Use email login.', 'error'); }
}

function parseJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(atob(b64 + '==='.slice((b64.length+3)%4)));
  } catch { return {}; }
}

async function handleGoogleLogin() {
  if (useFirebase) {
    const provider = new firebase.auth.GoogleAuthProvider();
    const btn = document.getElementById('googleLoginBtn') || document.getElementById('googleSignupBtn');
    setAuthLoading(btn, true, 'Connecting Google...');
    firebase.auth().signInWithPopup(provider)
      .then(async (result) => {
        const firebaseUser = result.user;
        const dbRef = firebase.database().ref('users/' + firebaseUser.uid);
        const snapshot = await dbRef.once('value');
        let dbData = snapshot.val() || {};
        if (!snapshot.exists()) {
          dbData = {
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            email: firebaseUser.email,
            plan: 'free',
            createdAt: new Date().toISOString()
          };
          await dbRef.set(dbData);
        }
        const sessionUser = {
          name: dbData.name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          plan: dbData.plan || 'free',
          trialEnd: dbData.trialEnd,
          trialStart: dbData.trialStart
        };
        saveSession(sessionUser);
        currentUserData = sessionUser;
        setAuthLoading(btn, false, 'Continue with Google');
        toast(`✅ Welcome, ${sessionUser.name}!`, 'success');
        onUserLoggedIn(sessionUser);
      })
      .catch((error) => {
        setAuthLoading(btn, false, 'Continue with Google');
        console.error("Firebase Google Auth Error:", error);
        toast('❌ Google Sign-In failed: ' + error.message, 'error');
      });
    return;
  }

  if (!G_CLIENT_ID) { showGoogleSetupPrompt(); return; }
  if (typeof google === 'undefined' || !googleReady) {
    toast('⏳ Loading Google... please wait and try again.', 'info'); return;
  }
  try {
    google.accounts.id.prompt(n => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) triggerGoogleOAuthPopup();
    });
  } catch { triggerGoogleOAuthPopup(); }
}

function triggerGoogleOAuthPopup() {
  if (!G_CLIENT_ID || !googleReady) { showGoogleSetupPrompt(); return; }
  try {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: G_CLIENT_ID, scope: 'email profile',
      callback: async (t) => {
        if (t.error) { toast('❌ Google Sign-In cancelled.', 'error'); return; }
        try {
          const res  = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${t.access_token}` } });
          const info = await res.json();
          const user = { name: info.name, email: info.email, picture: info.picture, provider: 'google', plan: 'free' };
          const users = getUsers();
          users[info.email] = { ...users[info.email], ...user, createdAt: users[info.email]?.createdAt || new Date().toISOString() };
          saveUsers(users); saveSession(user); currentUserData = user;
          onUserLoggedIn(user); toast(`✅ Welcome, ${user.name}!`, 'success');
        } catch { toast('❌ Could not get Google profile.', 'error'); }
      }
    });
    client.requestAccessToken();
  } catch { showGoogleSetupPrompt(); }
}

function showGoogleSetupPrompt() {
  const existing = document.getElementById('googleSetupOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'googleSetupOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
  overlay.innerHTML = `<div style="background:#fff;border-radius:20px;padding:32px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.2);font-family:Inter,sans-serif;">
    <div style="font-size:40px;margin-bottom:12px;">🔑</div>
    <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">Google Sign-In Setup</h2>
    <p style="color:#6b7280;font-size:13px;margin-bottom:18px;">Google ka ek free Client ID chahiye (2 min).</p>
    <div style="text-align:left;background:#f7f6fb;border-radius:12px;padding:14px;margin-bottom:18px;font-size:12.5px;color:#374151;line-height:2.2;">
      <b>1.</b> <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:#7c3aed;font-weight:600;">console.cloud.google.com/apis/credentials</a><br>
      <b>2.</b> Create Credentials → OAuth 2.0 Client ID<br>
      <b>3.</b> Type: <b>Web application</b><br>
      <b>4.</b> Authorized origin: <code style="background:#e8e0f8;padding:1px 5px;border-radius:4px;">https://proposaliq-ai.surge.sh</code><br>
      <b>5.</b> Client ID copy karo → <code>google-config.js</code> mein paste karo
    </div>
    <button onclick="document.getElementById('googleSetupOverlay').remove()" style="width:100%;padding:12px;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">OK Got it!</button>
    <p style="margin-top:10px;font-size:11.5px;color:#9ca3af;">Abhi ke liye Email login use karo ✅</p>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// =====================
//  AUTH STATE
// =====================
function initAuth() {
  try {
    // Automatically log in as Guest with Pro plan on init
    skipToDemo();
  } catch (e) { console.error('Auth init error:', e); skipToDemo(); }
}

function onUserLoggedIn(user) {
  hideAuthOverlay();
  updateHeaderUser(user);
  updatePlanBadge(user);
  if (typeof updateAiStatus === 'function') updateAiStatus();
}
function onUserLoggedOut() { skipToDemo(); resetHeaderUser(); }
function showAuthOverlay() {
  const el = document.getElementById('authOverlay');
  if (el) { el.style.display = 'none'; document.body.style.overflow = ''; }
}
function hideAuthOverlay() {
  const el = document.getElementById('authOverlay');
  if (el) { el.style.display = 'none'; document.body.style.overflow = ''; }
}

// =====================
//  HEADER
// =====================
function updateHeaderUser(user) {
  const initial = (user.name||user.email||'U').charAt(0).toUpperCase();
  const nameEl   = document.getElementById('headerUserName');
  const planEl   = document.getElementById('headerUserPlan');
  const avatarEl = document.getElementById('headerAvatar');
  const emailEl  = document.getElementById('dropdownEmail');
  if (nameEl)   nameEl.textContent = user.name === 'Guest' ? 'Freelancer' : user.name;
  if (planEl)   planEl.textContent = 'Pro Access';
  if (avatarEl) avatarEl.src = user.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${initial}&backgroundColor=7c3aed&textColor=ffffff`;
  if (emailEl)  emailEl.textContent = user.isGuest ? 'Free Platform' : user.email;
}
function resetHeaderUser() {
  const n = document.getElementById('headerUserName'); if(n) n.textContent = 'Sign In';
  const p = document.getElementById('headerUserPlan'); if(p) p.textContent = '';
  const t = document.getElementById('trialBadge'); if(t) t.style.display = 'none';
}

// =====================
//  DOM READY
// =====================
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  document.getElementById('tabLogin')?.addEventListener('click',  () => switchTab('login'));
  document.getElementById('tabSignup')?.addEventListener('click', () => switchTab('signup'));
  document.getElementById('loginForm')?.addEventListener('submit',  handleLogin);
  document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
  document.getElementById('forgotPasswordBtn')?.addEventListener('click', handleForgotPassword);
  document.getElementById('logoutBtn')?.addEventListener('click',         handleLogout);
  document.getElementById('googleLoginBtn')?.addEventListener('click',    handleGoogleLogin);
  document.getElementById('googleSignupBtn')?.addEventListener('click',   handleGoogleLogin);
  document.getElementById('authDemoSkip')?.addEventListener('click',      skipToDemo);
  // Trial & Buy buttons
  document.querySelectorAll('.start-trial-btn').forEach(btn => btn.addEventListener('click', startFreeTrial));
  document.querySelectorAll('.buy-pro-btn').forEach(btn => btn.addEventListener('click', handleBuyPro));
});

// =====================
//  STRIPE PURCHASE
// =====================
function handleBuyPro() {
  const session = getSession();
  if (!session || !session.email) {
    showAuthOverlay();
    closeAllModals();
    toast('Please sign in first to upgrade to Pro.', 'info');
    return;
  }
  
  if (typeof STRIPE_CONFIG !== 'undefined' && STRIPE_CONFIG.IS_CONFIGURED && STRIPE_CONFIG.monthly_link) {
    const stripeUrl = new URL(STRIPE_CONFIG.monthly_link);
    stripeUrl.searchParams.set('prefilled_email', session.email);
    window.open(stripeUrl.toString(), '_blank');
  } else {
    toast('💳 Stripe setup required! Link not configured yet.', 'info');
    const existing = document.getElementById('stripeSetupOverlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'stripeSetupOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
    overlay.innerHTML = `<div style="background:#fff;border-radius:20px;padding:32px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.2);font-family:Inter,sans-serif;">
      <div style="font-size:40px;margin-bottom:12px;">💸</div>
      <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">Stripe Not Connected</h2>
      <p style="color:#6b7280;font-size:13px;margin-bottom:18px;">To collect real payments, you need to add your Stripe Payment Link.</p>
      <div style="text-align:left;background:#f7f6fb;border-radius:12px;padding:14px;margin-bottom:18px;font-size:12.5px;color:#374151;line-height:2.2;">
        <b>1.</b> Go to <a href="https://dashboard.stripe.com/payment-links" target="_blank" style="color:#7c3aed;font-weight:600;">Stripe Dashboard</a><br>
        <b>2.</b> Create a new Product (ProposalIQ Pro - $19/mo)<br>
        <b>3.</b> Generate a "Payment Link"<br>
        <b>4.</b> Open <code>stripe-config.js</code> in code<br>
        <b>5.</b> Set <code>IS_CONFIGURED = true</code> and paste the link.
      </div>
      <button onclick="document.getElementById('stripeSetupOverlay').remove()" style="width:100%;padding:12px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">Got it!</button>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }
}

// =====================
//  DEMO SKIP
// =====================
function skipToDemo() {
  const guest = { name: 'Guest', email: 'guest@proposaliq.app', isGuest: true, plan: 'pro' };
  currentUserData = guest; onUserLoggedIn(guest);
}

// =====================
//  TAB SWITCH
// =====================
function switchTab(tab) {
  const lf=document.getElementById('loginForm'), sf=document.getElementById('signupForm');
  const tl=document.getElementById('tabLogin'),  ts=document.getElementById('tabSignup');
  if (tab==='login') { if(lf)lf.style.display='block';if(sf)sf.style.display='none';tl?.classList.add('active');ts?.classList.remove('active'); }
  else               { if(lf)lf.style.display='none';if(sf)sf.style.display='block';tl?.classList.remove('active');ts?.classList.add('active'); }
  clearAuthErrors();
}

// =====================
//  SIGNUP
// =====================
async function handleSignup(e) {
  e.preventDefault(); clearAuthErrors();
  const name=document.getElementById('signupName')?.value.trim();
  const email=document.getElementById('signupEmail')?.value.trim().toLowerCase();
  const pass=document.getElementById('signupPassword')?.value;
  const confirm=document.getElementById('signupConfirm')?.value;
  const terms=document.getElementById('agreeTerms');
  const btn=document.getElementById('signupBtn');
  if (!name)               return showAuthError('signupError','Please enter your full name.');
  if (!isValidEmail(email))return showAuthError('signupError','Please enter a valid email address.');
  if (pass.length<6)       return showAuthError('signupError','Password must be at least 6 characters.');
  if (pass!==confirm)      return showAuthError('signupError','Passwords do not match.');
  if (terms&&!terms.checked)return showAuthError('signupError','Please agree to Terms & Privacy Policy.');
  
  setAuthLoading(btn,true,'Creating account...');
  
  if (useFirebase) {
    firebase.auth().createUserWithEmailAndPassword(email, pass)
      .then(async (userCredential) => {
        const firebaseUser = userCredential.user;
        await firebaseUser.updateProfile({ displayName: name });
        // Write info to Realtime Database
        await firebase.database().ref('users/' + firebaseUser.uid).set({
          name: name,
          email: email,
          plan: 'free',
          createdAt: new Date().toISOString()
        });
        setAuthLoading(btn,false,'Create Free Account →');
        toast(`🎉 Welcome to ProposalIQ, ${name}!`, 'success');
      })
      .catch((error) => {
        showAuthError('signupError', error.message);
        setAuthLoading(btn,false,'Create Free Account →');
      });
  } else {
    const users=getUsers();
    if (users[email]) { showAuthError('signupError','Email already registered. Please sign in.'); return setAuthLoading(btn,false,'Create Free Account →'); }
    const hashed=await hashPassword(pass);
    users[email]={name,email,password:hashed,createdAt:new Date().toISOString(),plan:'free'};
    saveUsers(users);
    const sessionUser={name,email,plan:'free'};
    saveSession(sessionUser); currentUserData=sessionUser;
    setAuthLoading(btn,false,'Create Free Account →');
    toast(`🎉 Welcome to ProposalIQ, ${name}!`,'success');
    onUserLoggedIn(sessionUser);
  }
}

// =====================
//  LOGIN
// =====================
async function handleLogin(e) {
  e.preventDefault(); clearAuthErrors();
  const email=document.getElementById('loginEmail')?.value.trim().toLowerCase();
  const pass=document.getElementById('loginPassword')?.value;
  const btn=document.getElementById('loginBtn');
  if (!isValidEmail(email))return showAuthError('loginError','Please enter a valid email address.');
  if (!pass)               return showAuthError('loginError','Please enter your password.');
  
  setAuthLoading(btn,true,'Signing in...');
  
  if (useFirebase) {
    firebase.auth().signInWithEmailAndPassword(email, pass)
      .then(() => {
        setAuthLoading(btn,false,'Sign In →');
        // UI updates automatically via onAuthStateChanged
      })
      .catch((error) => {
        showAuthError('loginError', error.message);
        setAuthLoading(btn,false,'Sign In →');
        const pf=document.getElementById('loginPassword');
        if(pf){pf.style.borderColor='#dc2626';pf.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:300});setTimeout(()=>pf.style.borderColor='',1500);}
      });
  } else {
    const users=getUsers(); const user=users[email];
    if (!user) { showAuthError('loginError','No account found. Please sign up first.'); return setAuthLoading(btn,false,'Sign In →'); }
    if (user.provider==='google') { showAuthError('loginError','This account uses Google Sign-In.'); return setAuthLoading(btn,false,'Sign In →'); }
    const hashed=await hashPassword(pass);
    if (user.password!==hashed) {
      showAuthError('loginError','Incorrect password. Please try again.');
      const pf=document.getElementById('loginPassword');
      if(pf){pf.style.borderColor='#dc2626';pf.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:300});setTimeout(()=>pf.style.borderColor='',1500);}
      return setAuthLoading(btn,false,'Sign In →');
    }
    const sessionUser={name:user.name,email:user.email,plan:user.plan||'free',trialEnd:user.trialEnd,trialStart:user.trialStart};
    saveSession(sessionUser); currentUserData=sessionUser;
    setAuthLoading(btn,false,'Sign In →');
    toast(`✅ Welcome back, ${user.name||email.split('@')[0]}!`,'success');
    onUserLoggedIn(sessionUser);
  }
}

// =====================
//  FORGOT PASSWORD
// =====================
function handleForgotPassword() {
  const email=document.getElementById('loginEmail')?.value.trim();
  if (!email||!isValidEmail(email))return showAuthError('loginError','Please enter your email first.');
  
  if (useFirebase) {
    firebase.auth().sendPasswordResetEmail(email)
      .then(() => {
        showAuthError('loginError','Password reset link sent to your email!');
        toast('✉️ Reset link sent! Check your inbox.', 'success');
      })
      .catch((error) => {
        showAuthError('loginError', error.message);
      });
  } else {
    const users=getUsers();
    if (!users[email.toLowerCase()])return showAuthError('loginError','No account found with this email.');
    showAuthError('loginError','Reset link sent! (Feature coming soon — please create a new account for now)');
  }
}

// =====================
//  LOGOUT
// =====================
function handleLogout() {
  if (useFirebase) {
    firebase.auth().signOut()
      .then(() => {
        clearSession(); currentUserData=null;
        onUserLoggedOut();
        toast('👋 Signed out successfully.','info');
      })
      .catch((error) => {
        toast('❌ Sign out failed: ' + error.message, 'error');
      });
  } else {
    try { if(typeof google!=='undefined'&&googleReady)google.accounts.id.disableAutoSelect(); } catch {}
    clearSession(); currentUserData=null;
    onUserLoggedOut();
    toast('👋 Signed out successfully.','info');
  }
}

// =====================
//  HELPERS
// =====================
function isValidEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e||'');}
function showAuthError(id,msg){const el=document.getElementById(id);if(el){el.textContent=msg;el.style.display='block';}}
function clearAuthErrors(){['loginError','signupError'].forEach(id=>{const el=document.getElementById(id);if(el){el.textContent='';el.style.display='none';}});}
function setAuthLoading(btn,loading,text){
  if(!btn)return;btn.disabled=loading;
  const span=btn.querySelector('span:last-child');
  if(span)span.textContent=text;else btn.textContent=text;
}
function toast(msg,type='info'){if(typeof showToast==='function')showToast(msg,type);}

// =====================
//  EXPOSE GLOBALLY
// =====================
window.handleLogout   = handleLogout;
window.switchTab      = switchTab;
window.startFreeTrial = startFreeTrial;
window.currentUser    = () => currentUserData;
