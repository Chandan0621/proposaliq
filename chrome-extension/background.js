// background.js — Service Worker
let storedJobText = '';

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'STORE_JOB_TEXT') {
    storedJobText = msg.jobText || '';
  }
  if (msg.type === 'GET_JOB_TEXT') {
    reply({ jobText: storedJobText });
  }
  return true;
});
