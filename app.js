let entries = JSON.parse(localStorage.getItem("bjjEntries")) || [];
let belt = localStorage.getItem("belt") || "white";

let activeTag = null;
let editIndex = null;
let currentTags = [];

/* BELT COLORS */
const beltColors = {
  white: "#e5e7eb",
  blue: "#3b82f6",
  purple: "#a855f7",
  brown: "#a16207",
  black: "#facc15"
};

/* VIEW */
function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(view + "View")?.classList.remove("hidden");
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

/* TAGS */
function renderChips() {
  const container = document.getElementById("tagChips");
  if (!container) return;

  container.innerHTML = currentTags.map(tag => `
    <div class="chip">
      ${tag}
      <span onclick="removeTag('${tag}')">×</span>
    </div>
  `).join("");
}

function removeTag(tag) {
  currentTags = currentTags.filter(t => t !== tag);
  renderChips();
}

/* ADD / EDIT */
function addEntry() {
  const note = document.getElementById("noteInput").value.trim();
  if (!note) return;

  const tags = [...currentTags];

  let newEntry = {
  date: new Date().toISOString(),
  note,
  tags,
  belt: belt // 👈 store current belt at time of entry
};

  if (editIndex !== null) {
    // 🔥 KEEP ORIGINAL DATE
    newEntry.date = entries[editIndex].date;

    entries[editIndex] = newEntry;
    editIndex = null;
  } else {
    entries.unshift(newEntry);
  }

  localStorage.setItem("bjjEntries", JSON.stringify(entries));

  document.getElementById("noteInput").value = "";
  currentTags = [];
  renderChips();

  render();
}

/* EDIT */
function editEntry(index) {
  const entry = entries[index];

  document.getElementById("noteInput").value = entry.note;

  currentTags = entry.tags || [];
  renderChips();

  editIndex = index;
  showView("home");
}

/* DELETE */
function deleteEntry(index) {
  entries.splice(index, 1);
  localStorage.setItem("bjjEntries", JSON.stringify(entries));
  render();
}

/* FILTER */
function filterByTag(tag) {
  activeTag = tag;
  showView("home");
  render();
}

function clearFilter() {
  activeTag = null;
  render();
}

/* RENDER */
function render() {
  const container = document.getElementById("entries");
  container.innerHTML = "";

  const filtered = activeTag
    ? entries.filter(e => (e.tags || []).includes(activeTag))
    : entries;

  if (activeTag) {
    container.innerHTML += `
      <div class="card">
        Showing: <strong>${activeTag}</strong>
        <button onclick="clearFilter()">Clear</button>
      </div>
    `;
  }

  filtered.forEach((e, index) => {
    const div = document.createElement("div");
    div.className = "entry";

    div.innerHTML = `
      <div class="swipeItem" data-index="${index}">
        <div class="entryContent">

          <div class="date">${new Date(e.date).toLocaleDateString()}</div>
          <div>${e.note}</div>
          <div class="beltTag">
  <span class="beltDot" style="background:${getBeltColor(e.belt)}"></span>
</div>

          ${
            e.tags?.length
              ? `<div class="tags">
                  ${e.tags.map(tag =>
                    `<span class="tag" onclick="event.stopPropagation(); filterByTag('${tag}')">
                      ${tag}
                    </span>`
                  ).join("")}
                </div>`
              : ""
          }

          <div class="entryFooter">
            <div class="entryActions">
               <button class="editBtn" onclick="event.stopPropagation(); editEntry(${index})">Edit</button>
               <button class="deleteBtn" onclick="event.stopPropagation(); deleteEntry(${index})">
    Delete
  </button>
            </div>
          </div>

        </div>
      </div>
    `;

    container.appendChild(div);
  });

  updateStats();
  renderProgress();
  renderInsights();
  renderTagAnalytics();
  enableSwipe();
}

/* STATS */
function updateStats() {
  const year = new Date().getFullYear();

  const thisYear = entries.filter(e =>
    new Date(e.date).getFullYear() === year
  );

  document.getElementById("totalSessions").textContent = thisYear.length;

  let streak = 0;
  let d = new Date();

  const dates = entries.map(e => new Date(e.date).toDateString());

  while (dates.includes(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  document.getElementById("streak").textContent = streak;

  document.getElementById("lastTrain").textContent =
    entries[0] ? new Date(entries[0].date).toLocaleDateString() : "-";
}

/* PROGRESS */
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
  if (!container) return;

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

/* INSIGHTS */
function renderInsights() {
  const container = document.getElementById("insights");
  if (!container) return;

  container.innerHTML = `
    <p><strong>${entries.length}</strong> total sessions</p>
  `;
}

/* TAG ANALYTICS */
function renderTagAnalytics() {
  const container = document.getElementById("insights");

  const tagCount = {};

  entries.forEach(e => {
    (e.tags || []).forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  const sorted = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  let html = `<h4>Top Tags</h4>`;

  sorted.forEach(([tag, count]) => {
    html += `
      <div class="tagRow" onclick="filterByTag('${tag}')">
        <span>${tag}</span>
        <span>${count}</span>
      </div>
    `;
  });

  container.innerHTML += html;
}

function getBeltColor(belt) {
  const colors = {
    white: "#e5e7eb",
    blue: "#3b82f6",
    purple: "#a855f7",
    brown: "#a16207",
    black: "#000000"
  };
  return colors[belt] || "#e5e7eb";
}

/* SWIPE */
function enableSwipe() {
  const items = document.querySelectorAll(".swipeItem");

  items.forEach(item => {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const content = item.querySelector(".entryContent");

    item.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });

    item.addEventListener("touchmove", (e) => {
      if (!isDragging) return;

      currentX = e.touches[0].clientX;
      let diff = currentX - startX;

      if (diff < 0) {
        content.style.transform = `translateX(${diff}px)`;
      }
    });

    item.addEventListener("touchend", () => {
      isDragging = false;
      let diff = currentX - startX;

      if (diff < -100) {
        const index = item.dataset.index;
        deleteEntry(parseInt(index, 10));
      } else {
        content.style.transform = "translateX(0)";
      }
    });
  });
}

document.getElementById("tagInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();

    const value = this.value.trim().toLowerCase();
    if (!value) return;

    if (!currentTags.includes(value)) {
      currentTags.push(value);
    }

    this.value = "";
    renderChips();
  }
});

/* INIT */
setTimeout(() => {
  document.getElementById("splash")?.remove();
}, 1600);

applyBelt();
render();
showView("home");