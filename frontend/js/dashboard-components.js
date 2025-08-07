// Reusable dashboard component helpers

/** Copy given text to clipboard */
function copyText(text) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text).catch(err => console.error('Copy failed', err));
}

/** Setup copy button for device info */
function setupDeviceCopy() {
  const btn = document.getElementById('copyDevice');
  const idEl = document.getElementById('deviceId');
  if (btn && idEl) {
    btn.addEventListener('click', () => copyText(idEl.textContent));
  }
}

/** Add entry to activity timeline */
function addActivity(message) {
  const list = document.getElementById('activityList');
  if (!list) return;
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString();
  li.textContent = `${message} (${time})`;
  list.prepend(li);
}

// Expose helpers
window.dashboardComponents = {
  setupDeviceCopy,
  addActivity
};

