/* Studio de Conception de Produits — application sans dépendance.
   Les données sont persistées dans localStorage. */
(function () {
  "use strict";

  const STORAGE_KEY = "studio-conception-produits/v1";

  const STAGES = [
    { id: "idea", label: "Idée", color: "var(--col-idea)" },
    { id: "design", label: "Conception", color: "var(--col-design)" },
    { id: "prototype", label: "Prototype", color: "var(--col-prototype)" },
    { id: "validated", label: "Validé", color: "var(--col-validated)" },
    { id: "launched", label: "Lancé", color: "var(--col-launched)" },
  ];
  const PRIORITY_ORDER = { Haute: 0, Moyenne: 1, Basse: 2 };

  /** @type {Array} */
  let products = [];
  let editingId = null;

  // ---- Persistance -------------------------------------------------------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      products = raw ? JSON.parse(raw) : seed();
    } catch (e) {
      console.warn("Lecture du stockage impossible, réinitialisation.", e);
      products = seed();
    }
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn("Écriture dans le stockage impossible.", e);
    }
  }

  function seed() {
    const now = Date.now();
    return [
      {
        id: uid(), name: "Lampe modulaire Aura", category: "Mobilier",
        status: "design", priority: "Haute", cost: 89,
        description: "Lampe d'appoint à modules aimantés que l'utilisateur réagence à volonté.",
        materials: ["Aluminium", "Verre dépoli"], image: "", notes: "Tester l'aimantation à 3 modules.",
        createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 2,
      },
      {
        id: uid(), name: "Gourde isotherme Loop", category: "Accessoire",
        status: "prototype", priority: "Moyenne", cost: 24.5,
        description: "Gourde 24h froid / 12h chaud avec anse intégrée en silicone.",
        materials: ["Inox 304", "Silicone"], image: "", notes: "Réduire le poids de 40g.",
        createdAt: now - 86400000 * 12, updatedAt: now - 86400000,
      },
      {
        id: uid(), name: "Clavier pliable Fold", category: "Électronique",
        status: "idea", priority: "Basse", cost: 0,
        description: "Clavier mécanique qui se plie en deux pour le nomadisme.",
        materials: ["ABS", "Acier"], image: "", notes: "",
        createdAt: now - 86400000 * 2, updatedAt: now - 86400000 * 2,
      },
    ];
  }

  function uid() {
    return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // ---- Éléments DOM ------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const board = $("#board");
  const statsEl = $("#stats");
  const searchEl = $("#search");
  const filterCat = $("#filter-category");
  const filterPrio = $("#filter-priority");
  const sortEl = $("#sort");
  const modal = $("#modal");
  const form = $("#form");

  // ---- Rendu -------------------------------------------------------------
  function getVisible() {
    const q = searchEl.value.trim().toLowerCase();
    const cat = filterCat.value;
    const prio = filterPrio.value;

    let list = products.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (prio && p.priority !== prio) return false;
      if (q) {
        const hay = [p.name, p.category, p.description, p.notes, (p.materials || []).join(" ")]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sort = sortEl.value;
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "fr");
      if (sort === "created") return b.createdAt - a.createdAt;
      if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return b.updatedAt - a.updatedAt; // updated
    });
    return list;
  }

  function render() {
    renderStats();
    renderCategories();
    renderBoard();
  }

  function renderStats() {
    const total = products.length;
    const launched = products.filter((p) => p.status === "launched").length;
    const inProgress = products.filter((p) => ["design", "prototype"].includes(p.status)).length;
    const avgCost = total
      ? products.reduce((s, p) => s + (Number(p.cost) || 0), 0) / total
      : 0;

    const cards = [
      { value: total, label: "Concepts au total" },
      { value: inProgress, label: "En cours de conception" },
      { value: launched, label: "Produits lancés" },
      { value: avgCost.toFixed(0) + " €", label: "Coût cible moyen" },
    ];
    statsEl.innerHTML = cards
      .map((c) => `<div class="stat-card"><div class="stat-value">${c.value}</div><div class="stat-label">${c.label}</div></div>`)
      .join("");
  }

  function renderCategories() {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
    const current = filterCat.value;
    filterCat.innerHTML = '<option value="">Toutes les catégories</option>' +
      cats.map((c) => `<option value="${escAttr(c)}">${escHtml(c)}</option>`).join("");
    if (cats.includes(current)) filterCat.value = current;

    $("#category-list").innerHTML = cats.map((c) => `<option value="${escAttr(c)}">`).join("");
  }

  function renderBoard() {
    const visible = getVisible();
    board.innerHTML = "";
    for (const stage of STAGES) {
      const items = visible.filter((p) => p.status === stage.id);
      const col = document.createElement("div");
      col.className = "column";
      col.dataset.status = stage.id;
      col.innerHTML = `
        <div class="column-head">
          <span class="dot" style="background:${stage.color}"></span>
          <span>${stage.label}</span>
          <span class="count">${items.length}</span>
        </div>
        <div class="column-body"></div>`;
      const body = col.querySelector(".column-body");
      if (items.length === 0) {
        body.innerHTML = '<div class="empty-col">Aucun concept</div>';
      } else {
        items.forEach((p) => body.appendChild(cardEl(p)));
      }
      attachDnd(col, body, stage.id);
      board.appendChild(col);
    }
  }

  function cardEl(p) {
    const el = document.createElement("article");
    el.className = "card";
    el.draggable = true;
    el.dataset.id = p.id;

    const materials = (p.materials || []).slice(0, 2).map((m) => `<span class="tag">${escHtml(m)}</span>`).join("");
    const thumb = p.image
      ? `<img class="card-thumb" src="${escAttr(p.image)}" alt="" onerror="this.style.display='none'">`
      : "";
    const cost = Number(p.cost) > 0 ? `<span class="card-cost">${Number(p.cost).toFixed(0)} €</span>` : "";

    el.innerHTML = `
      ${thumb}
      <h3 class="card-title">${escHtml(p.name)}</h3>
      ${p.description ? `<p class="card-desc">${escHtml(p.description)}</p>` : ""}
      <div class="card-meta">
        ${p.category ? `<span class="tag cat">${escHtml(p.category)}</span>` : ""}
        <span class="tag prio-${p.priority}">${p.priority}</span>
        ${materials}
        ${cost}
      </div>`;

    el.addEventListener("click", () => openModal(p.id));
    el.addEventListener("dragstart", (e) => {
      el.classList.add("dragging");
      e.dataTransfer.setData("text/plain", p.id);
      e.dataTransfer.effectAllowed = "move";
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
    return el;
  }

  // ---- Glisser-déposer ---------------------------------------------------
  function attachDnd(col, body, statusId) {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      col.classList.add("drag-over");
    });
    col.addEventListener("dragleave", (e) => {
      if (!col.contains(e.relatedTarget)) col.classList.remove("drag-over");
    });
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const id = e.dataTransfer.getData("text/plain");
      const p = products.find((x) => x.id === id);
      if (p && p.status !== statusId) {
        p.status = statusId;
        p.updatedAt = Date.now();
        save();
        render();
        toast(`« ${p.name} » déplacé vers ${STAGES.find((s) => s.id === statusId).label}`);
      }
    });
  }

  // ---- Modale ------------------------------------------------------------
  function openModal(id) {
    editingId = id || null;
    const p = id ? products.find((x) => x.id === id) : null;
    $("#modal-title").textContent = p ? "Modifier le concept" : "Nouveau concept";
    $("#btn-delete").classList.toggle("hidden", !p);

    $("#f-id").value = p ? p.id : "";
    $("#f-name").value = p ? p.name : "";
    $("#f-category").value = p ? p.category || "" : "";
    $("#f-status").value = p ? p.status : "idea";
    $("#f-priority").value = p ? p.priority : "Moyenne";
    $("#f-cost").value = p && p.cost ? p.cost : "";
    $("#f-description").value = p ? p.description || "" : "";
    $("#f-materials").value = p ? (p.materials || []).join(", ") : "";
    $("#f-image").value = p ? p.image || "" : "";
    $("#f-notes").value = p ? p.notes || "" : "";

    modal.classList.remove("hidden");
    setTimeout(() => $("#f-name").focus(), 30);
  }

  function closeModal() {
    modal.classList.add("hidden");
    editingId = null;
    form.reset();
  }

  function submitForm(e) {
    e.preventDefault();
    const name = $("#f-name").value.trim();
    if (!name) return;

    const materials = $("#f-materials").value
      .split(",").map((m) => m.trim()).filter(Boolean);
    const data = {
      name,
      category: $("#f-category").value.trim(),
      status: $("#f-status").value,
      priority: $("#f-priority").value,
      cost: parseFloat($("#f-cost").value) || 0,
      description: $("#f-description").value.trim(),
      materials,
      image: $("#f-image").value.trim(),
      notes: $("#f-notes").value.trim(),
    };

    if (editingId) {
      const p = products.find((x) => x.id === editingId);
      Object.assign(p, data, { updatedAt: Date.now() });
      toast("Concept mis à jour");
    } else {
      products.push({ id: uid(), ...data, createdAt: Date.now(), updatedAt: Date.now() });
      toast("Concept créé");
    }
    save();
    render();
    closeModal();
  }

  function deleteCurrent() {
    if (!editingId) return;
    const p = products.find((x) => x.id === editingId);
    if (!p) return;
    if (!confirm(`Supprimer définitivement « ${p.name} » ?`)) return;
    products = products.filter((x) => x.id !== editingId);
    save();
    render();
    closeModal();
    toast("Concept supprimé");
  }

  // ---- Import / Export ---------------------------------------------------
  function exportJson() {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conceptions-produits-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("Format attendu : tableau de concepts.");
        // Normalisation minimale + identifiants/horodatages garantis.
        products = data.map((p) => ({
          id: p.id || uid(),
          name: String(p.name || "Sans nom"),
          category: p.category || "",
          status: STAGES.some((s) => s.id === p.status) ? p.status : "idea",
          priority: PRIORITY_ORDER[p.priority] !== undefined ? p.priority : "Moyenne",
          cost: Number(p.cost) || 0,
          description: p.description || "",
          materials: Array.isArray(p.materials) ? p.materials : [],
          image: p.image || "",
          notes: p.notes || "",
          createdAt: p.createdAt || Date.now(),
          updatedAt: p.updatedAt || Date.now(),
        }));
        save();
        render();
        toast(`${products.length} concept(s) importé(s)`);
      } catch (err) {
        alert("Import impossible : " + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ---- Utilitaires -------------------------------------------------------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escAttr(s) { return escHtml(s); }

  // ---- Câblage des événements -------------------------------------------
  function bind() {
    $("#btn-new").addEventListener("click", () => openModal(null));
    $("#modal-close").addEventListener("click", closeModal);
    $("#btn-cancel").addEventListener("click", closeModal);
    $("#btn-delete").addEventListener("click", deleteCurrent);
    form.addEventListener("submit", submitForm);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
    });

    searchEl.addEventListener("input", renderBoard);
    filterCat.addEventListener("change", renderBoard);
    filterPrio.addEventListener("change", renderBoard);
    sortEl.addEventListener("change", renderBoard);

    $("#btn-export").addEventListener("click", exportJson);
    $("#btn-import").addEventListener("click", () => $("#file-input").click());
    $("#file-input").addEventListener("change", (e) => {
      if (e.target.files[0]) importJson(e.target.files[0]);
      e.target.value = "";
    });
  }

  // ---- Démarrage ---------------------------------------------------------
  load();
  bind();
  render();
})();
