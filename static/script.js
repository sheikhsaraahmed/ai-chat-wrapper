// script.js
// Handles all frontend logic - sending messages, displaying responses, updating logs

// ── On page load ──────────────────────────────────────────────────────────────
window.onload = () => {
  fetchLogs(); // Load any existing attack logs on startup
};

// ── Send message ──────────────────────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (!message) return;

  // Show user message in chat
  appendMessage("user", message);
  input.value = "";

  // Show typing indicator
  const typingId = showTyping();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    removeTyping(typingId);

    if (data.blocked) {
      // Threat detected - show blocked message
      appendThreatMessage(data);
      addLogEntry(data.log_entry);
      updateStats(data.log_entry.highest_severity);
    } else if (data.error) {
      appendMessage("bot", "⚠ System error: " + data.error);
    } else {
      // Clean message - show AI reply
      appendMessage("bot", data.message);
    }

  } catch (err) {
    removeTyping(typingId);
    appendMessage("bot", "⚠ Connection error. Check if server is running.");
  }
}

// ── Append normal message ─────────────────────────────────────────────────────
function appendMessage(sender, text) {
  const messages = document.getElementById("messages");

  const div = document.createElement("div");
  div.classList.add("message");

  if (sender === "user") {
    div.classList.add("user-message");
    div.innerHTML = `
      <span class="msg-label">YOU</span>
      <p>${escapeHtml(text)}</p>
    `;
  } else {
    div.classList.add("bot-message");
    div.innerHTML = `
      <span class="msg-label">CIPHER_BOT</span>
      <p>${escapeHtml(text)}</p>
    `;
  }

  messages.appendChild(div);
  scrollToBottom();
}

// ── Append threat blocked message ─────────────────────────────────────────────
function appendThreatMessage(data) {
  const messages = document.getElementById("messages");

  // Build threat tags html
  const tags = data.threats.map(t =>
    `<span class="threat-tag ${t.severity}">${t.type}</span>`
  ).join("");

  const div = document.createElement("div");
  div.classList.add("message", "bot-message", "threat-message");
  div.innerHTML = `
    <span class="msg-label">SECURITY_SCANNER</span>
    <p>${escapeHtml(data.message)}</p>
    <div class="threat-tags">${tags}</div>
  `;

  messages.appendChild(div);
  scrollToBottom();
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function showTyping() {
  const messages = document.getElementById("messages");
  const id = "typing-" + Date.now();

  const div = document.createElement("div");
  div.classList.add("message", "bot-message");
  div.id = id;
  div.innerHTML = `
    <span class="msg-label">CIPHER_BOT</span>
    <p style="color: var(--text-dim)">scanning + processing...</p>
  `;

  messages.appendChild(div);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── Fetch existing logs from backend ─────────────────────────────────────────
async function fetchLogs() {
  try {
    const response = await fetch("/logs");
    const logs = await response.json();

    if (logs.length === 0) return;

    // Clear empty state
    document.getElementById("logEntries").innerHTML = "";

    let highCount = 0;
    let medCount = 0;

    logs.forEach(entry => {
      addLogEntry(entry, false); // false = don't update stats individually
      if (entry.highest_severity === "HIGH") highCount++;
      if (entry.highest_severity === "MEDIUM") medCount++;
    });

    // Update stats all at once
    document.getElementById("totalCount").textContent = logs.length;
    document.getElementById("highCount").textContent = highCount;
    document.getElementById("medCount").textContent = medCount;

  } catch (err) {
    console.log("Could not fetch logs:", err);
  }
}

// ── Add a single log entry to the panel ──────────────────────────────────────
function addLogEntry(entry, updateStatsFlag = true) {
  const logEntries = document.getElementById("logEntries");

  // Remove empty state text if present
  const empty = logEntries.querySelector(".empty-log");
  if (empty) empty.remove();

  const div = document.createElement("div");
  div.classList.add("log-entry", entry.highest_severity);

  const threatTypes = entry.threats.map(t => t.type).join(", ");

  div.innerHTML = `
    <span class="log-time">${entry.timestamp}</span>
    <span class="log-msg">${escapeHtml(entry.message)}</span>
    <span class="log-type ${entry.highest_severity}">${threatTypes} — ${entry.highest_severity}</span>
  `;

  // Insert at top
  logEntries.insertBefore(div, logEntries.firstChild);

  if (updateStatsFlag) updateStats(entry.highest_severity);
}

// ── Update threat counters ────────────────────────────────────────────────────
function updateStats(severity) {
  const total = document.getElementById("totalCount");
  total.textContent = parseInt(total.textContent) + 1;

  if (severity === "HIGH") {
    const high = document.getElementById("highCount");
    high.textContent = parseInt(high.textContent) + 1;
  } else if (severity === "MEDIUM") {
    const med = document.getElementById("medCount");
    med.textContent = parseInt(med.textContent) + 1;
  }
}

// ── Clear logs ────────────────────────────────────────────────────────────────
async function clearLogs() {
  await fetch("/logs/clear", { method: "POST" });

  document.getElementById("logEntries").innerHTML =
    `<div class="empty-log">No threats detected yet...</div>`;

  document.getElementById("totalCount").textContent = "0";
  document.getElementById("highCount").textContent = "0";
  document.getElementById("medCount").textContent = "0";
}

// ── Enter key to send ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function scrollToBottom() {
  const messages = document.getElementById("messages");
  messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}