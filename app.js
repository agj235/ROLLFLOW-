let entries = JSON.parse(localStorage.getItem("bjjEntries")) || [];
let belt = localStorage.getItem("belt") || "white";

/* BELT COLORS */
const beltColors = {
  white: "#e5e7eb",
  blue: "#3b82f6",
  purple: "#a855f7",
  brown: "#a16207",
  black: "#facc15"
};

/* VIEW SWITCH */
function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));

  if (view === "home") document.getElementById("homeView").classList.remove("hidden");
  if (view === "settings") document.getElementById("settingsView").classList.remove("hidden");
  if (view === "progress") document.getElementById("progressView").classList.remove("hidden");
}

/* BELT */
function setBelt(value) {
  belt = value;
  localStorage.setItem("belt", belt);
  applyBelt();
}

function applyBelt() {
  document.documentElement.style.setProperty("--accent", beltColors[belt]);
  document.getElementById("beltLabel").textContent =
    belt.charAt(0).toUpperCase() + belt.slice(1);
}

/* ENTRIES */
function addEntry() {
  const note = document.getElementById("noteInput").value.trim();
  if (!note) return;

  entries.unshift({
    date: new Date().toISOString(),
    note
  });

  localStorage.setItem("bjjEntries", JSON.stringify(entries));
  document.getElementById("noteInput").value = "";
  render();
}

function render() {
  const container = document.getElementById("entries");
  container.innerHTML = "";

  entries.forEach((e, index) => {
    const div = document.createElement("div");
    div.className = "entry";

    div.innerHTML = `
      <div class="date">${new Date(e.date).toLocaleDateString()}</div>
      <div>${e.note}</div>
      <button class="deleteBtn" onclick="deleteEntry(${index})">Delete</button>
    `;

    container.appendChild(div);
  });

  updateStats();
  renderProgress();
  renderInsights();
}
function deleteEntry(index) {
  entries.splice(index, 1);
  localStorage.setItem("bjjEntries", JSON.stringify(entries));
  render();
}

/* STATS */
function updateStats() {
  const year = new Date().getFullYear();

  const thisYear = entries.filter(e =>
    new Date(e.date).getFullYear() === year
  );

  document.getElementById("totalSessions").textContent =
    thisYear.length;

  let streak = 0;
  let d = new Date();

  const dates = entries.map(e =>
    new Date(e.date).toDateString()
  );

  while (dates.includes(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  document.getElementById("streak").textContent = streak;

  document.getElementById("lastTrain").textContent =
    entries[0] ? new Date(entries[0].date).toLocaleDateString() : "-";
}
// Monthly chart logic
function renderProgress() {
  const now = new Date();
  const months = Array(12).fill(0);

  entries.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === now.getFullYear()) {
      months[d.getMonth()]++;
    }
  });

  const container = document.getElementById("monthBars");
  container.innerHTML = "";

  const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  months.forEach((count, i) => {
    const bar = document.createElement("div");
    bar.className = "bar";

    const height = Math.max(count * 10, 5);

    bar.innerHTML = `
      <div class="barFill" style="height:${height}px"></div>
      <div class="barLabel">${labels[i]}</div>
    `;

    container.appendChild(bar);
  });
}

function renderInsights() {
  const container = document.getElementById("insights");

  const total = entries.length;

  let message = "";

  if (total < 5) {
    message = "Get on the mats more consistently to build momentum.";
  } else if (total < 20) {
    message = "Good consistency. Focus on repeating core positions.";
  } else {
    message = "Strong training volume. Start refining specific weaknesses.";
  }

  container.innerHTML = `
    <p>${message}</p>
    <p><strong>${total}</strong> total logged sessions</p>
  `;
}

self.addEventListener("install", () => {
  console.log("Service Worker installed");
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

setTimeout(() => {
  const splash = document.getElementById("splash");
  if (splash) splash.remove();
}, 1600);

/* INIT */
applyBelt();
render();
showView("home");