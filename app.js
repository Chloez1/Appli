/* Studio de Conception de Produits — application sans build.
   Données persistées dans localStorage. Visionneuse 3D via Three.js (CDN, à la demande). */
(function () {
  "use strict";

  const STORAGE_KEY = "studio-conception-produits/v1";
  const CATS_KEY = "studio-conception-produits/categories/v1";

  const STAGES = [
    { id: "idea", label: "Idée", color: "var(--col-idea)" },
    { id: "design", label: "Conception", color: "var(--col-design)" },
    { id: "prototype", label: "Prototype", color: "var(--col-prototype)" },
    { id: "validated", label: "Validé", color: "var(--col-validated)" },
    { id: "launched", label: "Lancé", color: "var(--col-launched)" },
  ];
  const PRIORITY_ORDER = { Haute: 0, Moyenne: 1, Basse: 2 };
  const DEFAULT_CATEGORIES = [
    "Mobilier", "Électronique", "Accessoire", "Électroménager",
    "Mode & Textile", "Jouet & Loisir", "Emballage", "Autre",
  ];

  /** @type {Array} */
  let products = [];
  /** @type {string[]} */
  let categories = [];
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
    products = products.map(normalize);
    loadCategories();
    save();
    saveCategories();
  }

  function loadCategories() {
    let stored = null;
    try {
      const raw = localStorage.getItem(CATS_KEY);
      stored = raw ? JSON.parse(raw) : null;
    } catch (_) { /* ignore */ }
    const used = products.map((p) => p.category).filter(Boolean);
    const base = Array.isArray(stored) ? stored : DEFAULT_CATEGORIES;
    categories = uniqueSorted([...base, ...used]);
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }
    catch (e) { console.warn("Écriture dans le stockage impossible.", e); }
  }
  function saveCategories() {
    try { localStorage.setItem(CATS_KEY, JSON.stringify(categories)); }
    catch (e) { console.warn("Écriture des catégories impossible.", e); }
  }

  function normalize(p) {
    return {
      id: p.id || uid(),
      name: String(p.name || "Sans nom"),
      category: p.category || "",
      status: STAGES.some((s) => s.id === p.status) ? p.status : "idea",
      priority: PRIORITY_ORDER[p.priority] !== undefined ? p.priority : "Moyenne",
      cost: Number(p.cost) || 0,
      description: p.description || "",
      materials: Array.isArray(p.materials) ? p.materials : [],
      image: p.image || "",
      model3d: p.model3d || "",
      validatedAt: p.validatedAt || "",
      launchedAt: p.launchedAt || "",
      notes: p.notes || "",
      createdAt: p.createdAt || Date.now(),
      updatedAt: p.updatedAt || Date.now(),
    };
  }

  function seed() {
    const now = Date.now();
    const d = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString().slice(0, 10);
    return [
      {
        id: uid(), name: "Lampe modulaire Aura", category: "Mobilier",
        status: "design", priority: "Haute", cost: 89,
        description: "Lampe d'appoint à modules aimantés que l'utilisateur réagence à volonté.",
        materials: ["Aluminium", "Verre dépoli"], image: "", model3d: "", notes: "Tester l'aimantation à 3 modules.",
        createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 2,
      },
      {
        id: uid(), name: "Gourde isotherme Loop", category: "Accessoire",
        status: "validated", priority: "Moyenne", cost: 24.5,
        description: "Gourde 24h froid / 12h chaud avec anse intégrée en silicone.",
        materials: ["Inox 304", "Silicone"], image: "", model3d: "", validatedAt: d(6),
        notes: "Validée pour passage en prototype final.",
        createdAt: now - 86400000 * 12, updatedAt: now - 86400000,
      },
      {
        id: uid(), name: "Clavier pliable Fold", category: "Électronique",
        status: "launched", priority: "Basse", cost: 119,
        description: "Clavier mécanique qui se plie en deux pour le nomadisme.",
        materials: ["ABS", "Acier"], image: "", model3d: "", validatedAt: d(20), launchedAt: d(3),
        notes: "Lancé en édition limitée.",
        createdAt: now - 86400000 * 30, updatedAt: now - 86400000 * 3,
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
  const catModal = $("#cat-modal");
  const viewerEl = $("#viewer");

  // ---- Helpers -----------------------------------------------------------
  function uniqueSorted(arr) {
    return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  }
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function formatDate(s) {
    if (!s) return "";
    const dt = new Date(s);
    return isNaN(dt) ? s : dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  }

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
      return b.updatedAt - a.updatedAt;
    });
    return list;
  }

  function render() {
    renderStats();
    renderFilterCategories();
    renderBoard();
  }

  function renderStats() {
    const total = products.length;
    const launched = products.filter((p) => p.status === "launched").length;
    const validated = products.filter((p) => p.status === "validated").length;
    const inProgress = products.filter((p) => ["design", "prototype"].includes(p.status)).length;

    const cards = [
      { value: total, label: "Concepts au total" },
      { value: inProgress, label: "En cours de conception" },
      { value: validated, label: "Validés" },
      { value: launched, label: "Produits lancés" },
    ];
    statsEl.innerHTML = cards
      .map((c) => `<div class="stat-card"><div class="stat-value">${c.value}</div><div class="stat-label">${c.label}</div></div>`)
      .join("");
  }

  function renderFilterCategories() {
    const current = filterCat.value;
    filterCat.innerHTML = '<option value="">Toutes les catégories</option>' +
      categories.map((c) => `<option value="${escAttr(c)}">${escHtml(c)}</option>`).join("");
    if (categories.includes(current)) filterCat.value = current;
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
      attachDnd(col, stage.id);
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

    const milestones = [];
    if (p.validatedAt) milestones.push(`<span class="milestone validated">✅ Validé ${formatDate(p.validatedAt)}</span>`);
    if (p.launchedAt) milestones.push(`<span class="milestone launched">🚀 Lancé ${formatDate(p.launchedAt)}</span>`);
    const milestonesHtml = milestones.length ? `<div class="card-milestones">${milestones.join("")}</div>` : "";

    const badge3d = p.model3d
      ? `<button class="badge-3d" data-3d title="Voir le modèle 3D">🧊 3D</button>` : "";

    el.innerHTML = `
      ${thumb}
      <h3 class="card-title">${escHtml(p.name)}</h3>
      ${p.description ? `<p class="card-desc">${escHtml(p.description)}</p>` : ""}
      ${milestonesHtml}
      <div class="card-meta">
        ${p.category ? `<span class="tag cat">${escHtml(p.category)}</span>` : ""}
        <span class="tag prio-${p.priority}">${p.priority}</span>
        ${materials}
        ${badge3d}
        ${cost}
      </div>`;

    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-3d]")) {
        e.stopPropagation();
        openViewer(p.model3d, `${p.name} — modèle 3D`);
        return;
      }
      openModal(p.id);
    });
    el.addEventListener("dragstart", (e) => {
      el.classList.add("dragging");
      e.dataTransfer.setData("text/plain", p.id);
      e.dataTransfer.effectAllowed = "move";
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
    return el;
  }

  // ---- Glisser-déposer ---------------------------------------------------
  function attachDnd(col, statusId) {
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("drag-over"); });
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
        applyMilestoneDates(p);
        p.updatedAt = Date.now();
        save();
        render();
        toast(`« ${p.name} » déplacé vers ${STAGES.find((s) => s.id === statusId).label}`);
      }
    });
  }

  /** Renseigne automatiquement la date de validation/lancement selon l'étape. */
  function applyMilestoneDates(p) {
    if (p.status === "validated" && !p.validatedAt) p.validatedAt = todayStr();
    if (p.status === "launched") {
      if (!p.launchedAt) p.launchedAt = todayStr();
      if (!p.validatedAt) p.validatedAt = todayStr();
    }
  }

  // ---- Modale concept ----------------------------------------------------
  function populateCategorySelect(selectedValue) {
    const sel = $("#f-category");
    const opts = [...categories];
    if (selectedValue && !opts.includes(selectedValue)) opts.unshift(selectedValue);
    sel.innerHTML =
      '<option value="">(Sans catégorie)</option>' +
      opts.map((c) => `<option value="${escAttr(c)}">${escHtml(c)}</option>`).join("") +
      '<option value="__new__">➕ Nouvelle catégorie…</option>';
    sel.value = selectedValue || "";
  }

  function openModal(id) {
    editingId = id || null;
    const p = id ? products.find((x) => x.id === id) : null;
    $("#modal-title").textContent = p ? "Modifier le concept" : "Nouveau concept";
    $("#btn-delete").classList.toggle("hidden", !p);

    $("#f-id").value = p ? p.id : "";
    $("#f-name").value = p ? p.name : "";
    populateCategorySelect(p ? p.category || "" : "");
    $("#f-status").value = p ? p.status : "idea";
    $("#f-priority").value = p ? p.priority : "Moyenne";
    $("#f-cost").value = p && p.cost ? p.cost : "";
    $("#f-validatedAt").value = p ? p.validatedAt || "" : "";
    $("#f-launchedAt").value = p ? p.launchedAt || "" : "";
    $("#f-description").value = p ? p.description || "" : "";
    $("#f-materials").value = p ? (p.materials || []).join(", ") : "";
    $("#f-image").value = p ? p.image || "" : "";
    $("#f-model").value = p ? p.model3d || "" : "";
    $("#f-notes").value = p ? p.notes || "" : "";

    modal.classList.remove("hidden");
    setTimeout(() => $("#f-name").focus(), 30);
  }

  function closeModal() {
    modal.classList.add("hidden");
    editingId = null;
    form.reset();
  }

  function onCategoryChange(e) {
    if (e.target.value !== "__new__") return;
    const name = (prompt("Nom de la nouvelle catégorie :") || "").trim();
    if (name) {
      if (!categories.includes(name)) { categories = uniqueSorted([...categories, name]); saveCategories(); renderFilterCategories(); }
      populateCategorySelect(name);
    } else {
      populateCategorySelect("");
    }
  }

  function submitForm(e) {
    e.preventDefault();
    const name = $("#f-name").value.trim();
    if (!name) return;

    const materials = $("#f-materials").value.split(",").map((m) => m.trim()).filter(Boolean);
    const data = {
      name,
      category: $("#f-category").value === "__new__" ? "" : $("#f-category").value,
      status: $("#f-status").value,
      priority: $("#f-priority").value,
      cost: parseFloat($("#f-cost").value) || 0,
      validatedAt: $("#f-validatedAt").value || "",
      launchedAt: $("#f-launchedAt").value || "",
      description: $("#f-description").value.trim(),
      materials,
      image: $("#f-image").value.trim(),
      model3d: $("#f-model").value.trim(),
      notes: $("#f-notes").value.trim(),
    };
    applyMilestoneDates(data);

    if (editingId) {
      const p = products.find((x) => x.id === editingId);
      Object.assign(p, data, { updatedAt: Date.now() });
      toast("Concept mis à jour");
    } else {
      products.push(normalize({ ...data, createdAt: Date.now(), updatedAt: Date.now() }));
      toast("Concept créé");
    }
    // Mémorise une éventuelle catégorie saisie.
    if (data.category && !categories.includes(data.category)) {
      categories = uniqueSorted([...categories, data.category]);
      saveCategories();
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

  // ---- Gestionnaire de catégories ---------------------------------------
  function openCatModal() { renderCatList(); catModal.classList.remove("hidden"); }
  function closeCatModal() { catModal.classList.add("hidden"); }

  function renderCatList() {
    const list = $("#cat-list");
    list.innerHTML = categories.map((c) => {
      const usage = products.filter((p) => p.category === c).length;
      const usageLabel = usage ? `${usage} produit${usage > 1 ? "s" : ""}` : "inutilisée";
      return `<li>
        <span class="cat-name">${escHtml(c)}</span>
        <span class="cat-usage">${usageLabel}</span>
        <button class="cat-del" data-cat="${escAttr(c)}" ${usage ? "disabled" : ""}
          title="${usage ? "Catégorie utilisée — réassignez les produits avant de supprimer" : "Supprimer"}">🗑</button>
      </li>`;
    }).join("") || '<li class="cat-usage">Aucune catégorie.</li>';

    list.querySelectorAll(".cat-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = btn.dataset.cat;
        categories = categories.filter((x) => x !== c);
        saveCategories();
        renderCatList();
        renderFilterCategories();
        toast(`Catégorie « ${c} » supprimée`);
      });
    });
  }

  function addCategory(e) {
    e.preventDefault();
    const input = $("#cat-input");
    const name = input.value.trim();
    if (!name) return;
    if (categories.includes(name)) { toast("Cette catégorie existe déjà"); return; }
    categories = uniqueSorted([...categories, name]);
    saveCategories();
    input.value = "";
    renderCatList();
    renderFilterCategories();
    toast(`Catégorie « ${name} » ajoutée`);
  }

  // ---- Visionneuse 3D ----------------------------------------------------
  const V = { inited: false, running: false };
  let libsPromise = null;

  function loadLibs() {
    if (!libsPromise) {
      libsPromise = (async () => {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const { STLLoader } = await import("three/addons/loaders/STLLoader.js");
        const { OBJLoader } = await import("three/addons/loaders/OBJLoader.js");
        return { THREE, OrbitControls, GLTFLoader, STLLoader, OBJLoader };
      })();
    }
    return libsPromise;
  }

  function viewerStatus(msg) {
    const el = $("#viewer-status");
    el.textContent = msg || "";
    el.style.display = msg ? "grid" : "none";
  }

  async function initViewer() {
    const { THREE, OrbitControls } = await loadLibs();
    const wrap = $("#viewer-canvas");
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100000);
    camera.position.set(2.4, 1.8, 3);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.15));
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(6, 10, 7);
    scene.add(dir);

    const grid = new THREE.GridHelper(10, 20, 0x4060a0, 0x223044);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);

    Object.assign(V, { inited: true, THREE, renderer, scene, camera, controls, grid, wrap, current: null });

    window.addEventListener("resize", resizeViewer);
  }

  function resizeViewer() {
    if (!V.inited) return;
    const w = V.wrap.clientWidth, h = V.wrap.clientHeight;
    if (!w || !h) return;
    V.camera.aspect = w / h;
    V.camera.updateProjectionMatrix();
    V.renderer.setSize(w, h, false);
  }

  function startLoop() {
    if (V.running) return;
    V.running = true;
    const tick = () => {
      if (!V.running) return;
      V.animId = requestAnimationFrame(tick);
      V.controls.update();
      V.renderer.render(V.scene, V.camera);
    };
    tick();
  }
  function stopLoop() { V.running = false; cancelAnimationFrame(V.animId); }

  function disposeObject(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m && m.dispose && m.dispose());
      }
    });
  }

  function setObject(obj) {
    const { THREE } = V;
    if (V.current) { V.scene.remove(V.current); disposeObject(V.current); }
    V.current = obj;
    V.scene.add(obj);

    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    V.grid.scale.setScalar(maxDim / 5);
    frameCurrent(maxDim);
  }

  function frameCurrent(maxDim) {
    const dim = maxDim || 2;
    const dist = dim * 2.2;
    V.camera.near = dim / 100;
    V.camera.far = dim * 100;
    V.camera.position.set(dist * 0.7, dist * 0.55, dist);
    V.camera.updateProjectionMatrix();
    V.controls.target.set(0, 0, 0);
    V.controls.update();
  }

  async function loadModel(url, nameHint) {
    await initOnce();
    viewerStatus("Chargement du modèle…");
    const { THREE, GLTFLoader, STLLoader, OBJLoader } = await loadLibs();
    const ext = String(nameHint || url).split("?")[0].split(".").pop().toLowerCase();
    try {
      if (ext === "glb" || ext === "gltf") {
        const g = await new GLTFLoader().loadAsync(url);
        setObject(g.scene);
      } else if (ext === "stl") {
        const geo = await new STLLoader().loadAsync(url);
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({ color: 0x9ab0ff, metalness: 0.1, roughness: 0.65 });
        setObject(new THREE.Mesh(geo, mat));
      } else if (ext === "obj") {
        const o = await new OBJLoader().loadAsync(url);
        o.traverse((c) => {
          if (c.isMesh && (!c.material || !c.material.color)) {
            c.material = new THREE.MeshStandardMaterial({ color: 0x9ab0ff, metalness: 0.1, roughness: 0.7 });
          }
        });
        setObject(o);
      } else {
        throw new Error("Format non supporté : ." + ext);
      }
      viewerStatus("");
    } catch (err) {
      console.error(err);
      viewerStatus("Impossible de charger le modèle.\n" + (err && err.message ? err.message : err));
    }
  }

  let initFailed = false;
  async function initOnce() {
    if (V.inited) { resizeViewer(); return; }
    try {
      await initViewer();
      resizeViewer();
      startLoop();
    } catch (err) {
      initFailed = true;
      console.error(err);
      throw err;
    }
  }

  async function openViewer(url, title) {
    $("#viewer-title").textContent = title || "Visionneuse 3D";
    viewerEl.classList.remove("hidden");
    showReliefControls(false);
    viewerStatus("Initialisation de la 3D…");
    try {
      await initOnce();
      startLoop();
      if (url) await loadModel(url, url);
      else viewerStatus('Aucun modèle. Cliquez sur « Charger un fichier » pour en importer un.');
    } catch (_) {
      viewerStatus("La bibliothèque 3D n'a pas pu être chargée.\nVérifiez votre connexion internet puis réessayez.");
    }
  }

  function closeViewer() { viewerEl.classList.add("hidden"); stopLoop(); }

  function showReliefControls(show) {
    $("#relief-controls").classList.toggle("hidden", !show);
  }

  function onViewerFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    showReliefControls(false);
    const objUrl = URL.createObjectURL(file);
    loadModel(objUrl, file.name).finally(() => setTimeout(() => URL.revokeObjectURL(objUrl), 4000));
    $("#viewer-title").textContent = file.name;
    e.target.value = "";
  }

  // ---- Conversion image plate -> relief 3D -------------------------------
  function loadImageEl(src, useCrossOrigin) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      if (useCrossOrigin) im.crossOrigin = "anonymous";
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("Image introuvable ou inaccessible."));
      im.src = src;
    });
  }

  /** Construit un maillage en relief : la luminosité de l'image devient la hauteur. */
  function buildReliefMesh(img) {
    const { THREE } = V;
    const depth = parseFloat($("#relief-depth").value) || 0.45;
    const resolution = parseInt($("#relief-res").value, 10) || 200;
    const invert = $("#relief-invert").checked;
    const useColor = $("#relief-color").checked;

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = resolution / Math.max(iw, ih);
    const gw = Math.max(2, Math.round(iw * scale));
    const gh = Math.max(2, Math.round(ih * scale));

    const cv = document.createElement("canvas");
    cv.width = gw; cv.height = gh;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, gw, gh);
    let data;
    try {
      data = ctx.getImageData(0, 0, gw, gh).data;
    } catch (_) {
      throw new Error("Image protégée par le serveur d'origine (CORS).\nTéléchargez-la puis utilisez « Image → relief » pour l'importer en local.");
    }

    const segX = gw - 1, segY = gh - 1;
    const aspect = iw / ih;
    const planeW = aspect >= 1 ? 2 : 2 * aspect;
    const planeH = aspect >= 1 ? 2 / aspect : 2;

    const geo = new THREE.PlaneGeometry(planeW, planeH, segX, segY);
    const pos = geo.attributes.position;
    const colors = useColor ? new Float32Array(pos.count * 3) : null;

    for (let iy = 0; iy <= segY; iy++) {
      for (let ix = 0; ix <= segX; ix++) {
        const vi = iy * (segX + 1) + ix;
        const p = (iy * gw + ix) * 4;
        const r = data[p], g = data[p + 1], b = data[p + 2];
        let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (invert) lum = 1 - lum;
        pos.setZ(vi, lum * depth);
        if (colors) { colors[vi * 3] = r / 255; colors[vi * 3 + 1] = g / 255; colors[vi * 3 + 2] = b / 255; }
      }
    }
    if (colors) geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: useColor ? 0xffffff : 0x9fb2da,
      vertexColors: !!useColor,
      side: THREE.DoubleSide,
      metalness: 0.05, roughness: 0.85,
    });
    return new THREE.Mesh(geo, mat);
  }

  function regenRelief() {
    if (!V.reliefImg) return;
    try {
      viewerStatus("Génération du relief…");
      setObject(buildReliefMesh(V.reliefImg));
      viewerStatus("");
    } catch (err) {
      console.error(err);
      viewerStatus(err && err.message ? err.message : "Génération impossible.");
    }
  }

  async function openRelief(src, title, useCrossOrigin) {
    $("#viewer-title").textContent = title || "Relief 3D";
    viewerEl.classList.remove("hidden");
    viewerStatus("Initialisation de la 3D…");
    try {
      await initOnce();
      startLoop();
      showReliefControls(true);
      const img = await loadImageEl(src, useCrossOrigin);
      V.reliefImg = img;
      regenRelief();
    } catch (err) {
      showReliefControls(false);
      viewerStatus(
        (err && err.message) ? err.message
        : "La bibliothèque 3D n'a pas pu être chargée.\nVérifiez votre connexion internet."
      );
    }
  }

  function onReliefImageFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const objUrl = URL.createObjectURL(file);
    openRelief(objUrl, file.name + " — relief 3D", false)
      .finally(() => setTimeout(() => URL.revokeObjectURL(objUrl), 4000));
    e.target.value = "";
  }

  // ---- Import / Export ---------------------------------------------------
  function exportJson() {
    const payload = { categories, products };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conceptions-produits-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        // Compatible avec l'ancien format (tableau) et le nouveau ({categories, products}).
        const items = Array.isArray(data) ? data : data.products;
        if (!Array.isArray(items)) throw new Error("Format attendu : liste de concepts.");
        products = items.map(normalize);
        const importedCats = Array.isArray(data.categories) ? data.categories : [];
        categories = uniqueSorted([...categories, ...importedCats, ...products.map((p) => p.category)]);
        save();
        saveCategories();
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
    $("#f-category").addEventListener("change", onCategoryChange);
    $("#btn-view3d").addEventListener("click", () => {
      const url = $("#f-model").value.trim();
      openViewer(url, ($("#f-name").value.trim() || "Concept") + " — modèle 3D");
    });
    $("#btn-relief").addEventListener("click", () => {
      const img = $("#f-image").value.trim();
      const name = $("#f-name").value.trim() || "Concept";
      if (!img) { toast("Renseignez d'abord une image / esquisse, ou utilisez « Image → relief » dans la visionneuse"); return; }
      openRelief(img, name + " — relief 3D", true);
    });
    form.addEventListener("submit", submitForm);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    $("#btn-categories").addEventListener("click", openCatModal);
    $("#cat-close").addEventListener("click", closeCatModal);
    $("#cat-form").addEventListener("submit", addCategory);
    catModal.addEventListener("click", (e) => { if (e.target === catModal) closeCatModal(); });

    $("#viewer-close").addEventListener("click", closeViewer);
    $("#viewer-reset").addEventListener("click", () => { if (V.current) frameCurrent(); });
    $("#viewer-file").addEventListener("change", onViewerFile);
    $("#viewer-image-file").addEventListener("change", onReliefImageFile);
    $("#relief-depth").addEventListener("input", regenRelief);
    $("#relief-res").addEventListener("change", regenRelief);
    $("#relief-invert").addEventListener("change", regenRelief);
    $("#relief-color").addEventListener("change", regenRelief);
    viewerEl.addEventListener("click", (e) => { if (e.target === viewerEl) closeViewer(); });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!viewerEl.classList.contains("hidden")) closeViewer();
      else if (!catModal.classList.contains("hidden")) closeCatModal();
      else if (!modal.classList.contains("hidden")) closeModal();
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
