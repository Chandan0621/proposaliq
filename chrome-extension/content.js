// content.js — ProposalIQ Job Detector
// Auto-detects job post text on Upwork, Fiverr, Freelancer

(function() {
  function extractJobText() {
    const selectors = [
      // Upwork
      '[data-test="description"]',
      '.job-description',
      '.up-card-section .description',
      '[class*="Description"]',
      '[data-cy="job-description"]',
      // Fiverr
      '.description-content',
      '[class*="description"]',
      // Freelancer
      '#project-description',
      '.ProjectDescription-description',
      '.NDA-description',
      // Generic
      'article', '.content', 'main'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.length > 50) {
        return el.innerText.trim().substring(0, 3000);
      }
    }
    return '';
  }

  // Store detected job text
  const jobText = extractJobText();
  if (jobText) {
    chrome.runtime.sendMessage({ type: 'STORE_JOB_TEXT', jobText });
  }

  // Listen for requests from popup
  chrome.runtime.onMessage.addListener((msg, sender, reply) => {
    if (msg.type === 'GET_JOB_TEXT_DIRECT') {
      reply({ jobText: extractJobText() });
    }
    return true;
  });
})();
