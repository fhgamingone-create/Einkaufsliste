const STORAGE_KEY = "einkaufsliste.app.gang.1-10.v2";

const gangs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let selectedGang = 1;
let sortMode = "gang";
let items = loadItems();

const itemForm = document.querySelector("#itemForm");
const itemName = document.querySelector("#itemName");
const gangPicker = document.querySelector("#gangPicker");
const selectedGangLabel = document.querySelector("#selectedGangLabel");
const sortButtons = document.querySelectorAll(".sort-button");
const shoppingList = document.querySelector("#shoppingList");
const itemTemplate = document.querySelector("#itemTemplate");

const openCount = document.querySelector("#openCount");
const totalCount = document.querySelector("#totalCount");
const doneCount = document.querySelector("#doneCount");

const exportButton = document.querySelector("#exportButton");
const importFile = document.querySelector("#importFile");
const clearDoneButton = document.querySelector("#clearDoneButton");

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeItem(item) {
  return {
    id: item.id || createId(),
    name: String(item.name || "").trim(),
    gang: Number(item.gang || item.aisle || 1),
    done: Boolean(item.done)
  };
}

function loadItems() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [
      { id: createId(), name: "Bananen", gang: 1, done: false },
      { id: createId(), name: "Brot", gang: 2, done: false },
      { id: createId(), name: "Milch", gang: 3, done: false },
      { id: createId(), name: "Nudeln", gang: 6, done: false }
    ];
  }

  try {
    const parsed = JSON.parse(saved);
    return parsed.map(normalizeItem).filter((item) => item.name);
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function renderGangPicker() {
  gangPicker.innerHTML = "";

  gangs.forEach((gang) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "gang-option";
    button.textContent = gang;
    button.setAttribute("aria-label", `Gang ${gang}`);

    if (gang === selectedGang) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      selectedGang = gang;
      selectedGangLabel.textContent = `Gang ${gang}`;
      renderGangPicker();
    });

    gangPicker.appendChild(button);
  });
}

function addItem(name, gang) {
  items.push({
    id: createId(),
    name,
    gang,
    done: false
  });

  saveItems();
  renderList();
}

function getSortedItems() {
  const copy = [...items];

  if (sortMode === "alphabetical") {
    return copy.sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  return copy.sort((a, b) => {
    if (a.gang !== b.gang) {
      return a.gang - b.gang;
    }

    return a.name.localeCompare(b.name, "de");
  });
}

function renderStats() {
  const total = items.length;
  const done = items.filter((item) => item.done).length;
  const open = total - done;

  openCount.textContent = open;
  totalCount.textContent = total;
  doneCount.textContent = done;
}

function renderList() {
  shoppingList.innerHTML = "";
  renderStats();

  if (items.length === 0) {
    shoppingList.innerHTML = `
      <div class="empty-state">
        <strong>Noch keine Artikel</strong>
        <span>Füge oben deinen ersten Einkauf hinzu.</span>
      </div>
    `;
    return;
  }

  if (sortMode === "alphabetical") {
    renderAlphabetical();
  } else {
    renderByGang();
  }
}

function renderByGang() {
  const sorted = getSortedItems();

  gangs.forEach((gang) => {
    const gangItems = sorted.filter((item) => item.gang === gang);

    if (gangItems.length === 0) {
      return;
    }

    const section = createGangSection(`Gang ${gang}`, gang, gangItems.length);

    gangItems.forEach((item) => {
      section.appendChild(createItemElement(item, false));
    });

    shoppingList.appendChild(section);
  });
}

function renderAlphabetical() {
  const section = createGangSection("Alphabetisch", "A–Z", items.length);

  getSortedItems().forEach((item) => {
    section.appendChild(createItemElement(item, true));
  });

  shoppingList.appendChild(section);
}

function createGangSection(title, badge, count) {
  const section = document.createElement("section");
  section.className = "gang-section";

  const header = document.createElement("div");
  header.className = "gang-title";

  header.innerHTML = `
    <span><span class="gang-badge">${badge}</span>${title}</span>
    <span class="gang-count">${count}</span>
  `;

  section.appendChild(header);
  return section;
}

function createItemElement(item, showGang) {
  const clone = itemTemplate.content.cloneNode(true);
  const element = clone.querySelector(".item");
  const checkButton = clone.querySelector(".check-button");
  const name = clone.querySelector(".item-name");
  const meta = clone.querySelector(".item-meta");
  const editButton = clone.querySelector(".edit-button");
  const deleteButton = clone.querySelector(".delete-button");

  element.classList.toggle("done", item.done);
  name.textContent = item.name;
  meta.textContent = showGang ? `Gang ${item.gang}` : item.done ? "erledigt" : "offen";

  checkButton.addEventListener("click", () => {
    item.done = !item.done;
    saveItems();
    renderList();
  });

  editButton.addEventListener("click", () => {
    editItem(item.id);
  });

  deleteButton.addEventListener("click", () => {
    deleteItem(item.id);
  });

  return clone;
}

function editItem(id) {
  const item = items.find((entry) => entry.id === id);

  if (!item) {
    return;
  }

  const newName = prompt("Artikel bearbeiten:", item.name);

  if (newName === null) {
    return;
  }

  const trimmedName = newName.trim();

  if (!trimmedName) {
    alert("Der Artikelname darf nicht leer sein.");
    return;
  }

  const newGangText = prompt("Gang bearbeiten: Zahl von 1 bis 10", item.gang);
  const newGang = Number(newGangText);

  if (!Number.isInteger(newGang) || newGang < 1 || newGang > 10) {
    alert("Bitte einen Gang von 1 bis 10 eingeben.");
    return;
  }

  item.name = trimmedName;
  item.gang = newGang;

  saveItems();
  renderList();
}

function deleteItem(id) {
  const item = items.find((entry) => entry.id === id);

  if (!item) {
    return;
  }

  if (!confirm(`"${item.name}" löschen?`)) {
    return;
  }

  items = items.filter((entry) => entry.id !== id);
  saveItems();
  renderList();
}

function exportItems() {
  const data = {
    app: "Einkaufsliste App",
    version: 2,
    exportedAt: new Date().toISOString(),
    items
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "einkaufsliste-export.json";
  link.click();

  URL.revokeObjectURL(url);
}

function importItems(file) {
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(reader.result);
      const importedItems = Array.isArray(imported) ? imported : imported.items;

      if (!Array.isArray(importedItems)) {
        throw new Error("Keine Artikelliste gefunden.");
      }

      const normalized = importedItems
        .map(normalizeItem)
        .filter((item) => item.name && item.gang >= 1 && item.gang <= 10);

      if (!confirm("Importieren ersetzt deine aktuelle Liste. Fortfahren?")) {
        importFile.value = "";
        return;
      }

      items = normalized;
      saveItems();
      renderList();
      importFile.value = "";
    } catch {
      alert("Die Datei konnte nicht importiert werden.");
      importFile.value = "";
    }
  });

  reader.readAsText(file);
}

itemForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = itemName.value.trim();

  if (!name) {
    return;
  }

  addItem(name, selectedGang);
  itemName.value = "";
  itemName.focus();
});

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    sortButtons.forEach((entry) => entry.classList.remove("active"));
    button.classList.add("active");
    sortMode = button.dataset.sort;
    renderList();
  });
});

clearDoneButton.addEventListener("click", () => {
  const doneItems = items.filter((item) => item.done);

  if (doneItems.length === 0) {
    alert("Es gibt keine erledigten Artikel.");
    return;
  }

  if (!confirm(`${doneItems.length} erledigte Artikel löschen?`)) {
    return;
  }

  items = items.filter((item) => !item.done);
  saveItems();
  renderList();
});

exportButton.addEventListener("click", exportItems);

importFile.addEventListener("change", () => {
  const file = importFile.files[0];

  if (file) {
    importItems(file);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

renderGangPicker();
renderList();
