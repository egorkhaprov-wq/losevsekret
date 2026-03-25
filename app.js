  const CONFIG = {
    n8n: {
      losevfft:       "https://n8n.other-digital.ru/webhook/losevfft",
      profile_upsert: "https://n8n.other-digital.ru/webhook/profile_upsert",
      profile_get:    "https://n8n.other-digital.ru/webhook/profile_get",
      daily_get:      "https://n8n.other-digital.ru/webhook/daily_get",
      month_get:      "https://n8n.other-digital.ru/webhook/month_get",
      settings_upsert:"https://n8n.other-digital.ru/webhook/settings_upsert",
      meal_edit:      "https://n8n.other-digital.ru/webhook/meal_edit",
      weight_log:     "https://n8n.other-digital.ru/webhook/weight_log",
      weight_get:     "https://n8n.other-digital.ru/webhook/weight_get",
      habits_log:     "https://n8n.other-digital.ru/webhook/habits_log",
      habits_get:     "https://n8n.other-digital.ru/webhook/habits_get",
      habit_defs_save:"https://n8n.other-digital.ru/webhook/habit_defs_save",
      habit_defs_get: "https://n8n.other-digital.ru/webhook/habit_defs_get",
      habit_def_delete:"https://n8n.other-digital.ru/webhook/habit_def_delete",
      habit_reminder_set: "https://n8n.other-digital.ru/webhook/habit_reminder_set",
      water_log:      "https://n8n.other-digital.ru/webhook/water_log",
      water_get:      "https://n8n.other-digital.ru/webhook/water_get",
      chat_send:      "https://n8n.other-digital.ru/webhook/nutritionist_send",
      chat_history:   "https://n8n.other-digital.ru/webhook/nutritionist_history",
      subscription_activate: "https://n8n.other-digital.ru/webhook/subscription_activate",
      workouts_get:   "https://n8n.other-digital.ru/webhook/workouts_get",
      week_get:       "https://n8n.other-digital.ru/webhook/week_get",
      trainer_register:      "https://n8n.other-digital.ru/webhook/trainer_register",
      trainer_clients_get:   "https://n8n.other-digital.ru/webhook/trainer_clients_get",
      trainer_client_diary:  "https://n8n.other-digital.ru/webhook/trainer_client_diary",
      trainer_client_weight: "https://n8n.other-digital.ru/webhook/trainer_client_weight",
      trainer_client_habits: "https://n8n.other-digital.ru/webhook/trainer_client_habits",
      trainer_comment_add:   "https://n8n.other-digital.ru/webhook/trainer_comment_add",
      trainers_list:         "https://n8n.other-digital.ru/webhook/trainers_list",
      trainer_client_add:    "https://n8n.other-digital.ru/webhook/trainer_client_add",
      token:          "82c1d601fcc0371bb17cbc69942fccc0",
    }
  };

  const tg = window.Telegram?.WebApp;
  if (tg) {
    try{ tg.ready(); }catch{}
    try{ tg.expand(); }catch{}
    try{ tg.setHeaderColor?.("#070812"); }catch{}
    try{ tg.setBackgroundColor?.("#070812"); }catch{}
  }

  const QS = new URLSearchParams(location.search);
  const el = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function vib(ms=12){
    try{ tg?.HapticFeedback?.impactOccurred?.("light"); }catch{}
    try{ navigator?.vibrate?.(ms); }catch{}
  }
  function vibSelect(){
    try{ tg?.HapticFeedback?.selectionChanged?.(); }catch{}
    try{ navigator?.vibrate?.(8); }catch{}
  }
  function vibOk(){
    try{ tg?.HapticFeedback?.notificationOccurred?.("success"); }catch{}
    try{ navigator?.vibrate?.([10,20,10]); }catch{}
  }
  function vibBad(){
    try{ tg?.HapticFeedback?.notificationOccurred?.("error"); }catch{}
    try{ navigator?.vibrate?.([20,30,20]); }catch{}
  }

  function decodeSafe(s){ try { return decodeURIComponent(String(s)); } catch { return String(s); } }
  function normalizeId(raw, allowMinus){
    const s0 = decodeSafe(raw || "").trim();
    if (!s0) return "";
    if (s0.includes("#{") || s0.includes("}#") || s0.includes("{") || s0.includes("}")) return "";
    const sign = (allowMinus && s0.startsWith("-")) ? "-" : "";
    const digits = s0.replace(/\D/g, "");
    if (digits.length >= 5) return sign + digits;
    return "";
  }
  function getIds(){
    const rawExt  = QS.get("external_user_id") || "";
    const rawChat = QS.get("chat_id") || "";
    const tgId = tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : "";
    const ext  = normalizeId(rawExt, false) || normalizeId(tgId, false);
    const chat = normalizeId(rawChat, true) || normalizeId(tgId, true) || ext;
    return { ext, chat, rawExt, rawChat, tgId };
  }

  const IDS = getIds();
  const external_user_id = IDS.ext;
  const chat_id = IDS.chat;
  window._ext_user_id = external_user_id;

  // ══ UTM метки — считываем из URL и сохраняем ══
  const UTM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ref'];
  const UTM = {};
  UTM_KEYS.forEach(k => {
    const val = QS.get(k) || '';
    if(val && !val.includes('#{')) UTM[k] = val;
  });
  // Сохраняем в localStorage только если пришли новые метки
  if(Object.keys(UTM).length){
    try{ localStorage.setItem('lf_utm', JSON.stringify({...UTM, ts: Date.now()})); }catch(e){}
  }
  // Восстанавливаем сохранённые если в URL пусто
  function getUtm(){
    try{
      const saved = JSON.parse(localStorage.getItem('lf_utm')||'{}');
      return Object.keys(UTM).length ? UTM : saved;
    }catch{ return UTM; }
  }

  // Оборачиваем postForm чтобы UTM автоматически шли в каждый запрос

  el("uidPill").textContent = external_user_id || "—";
  el("idPill").title = external_user_id || "";

  if (!external_user_id) {
    el("idWarn").classList.remove("hide");
    el("idWarn").textContent =
      "ID не найден. Проверь запуск по ссылке с параметром external_user_id. " +
      "Сейчас WebApp видит: external_user_id=" + (IDS.rawExt || "∅") + ", tgId=" + (IDS.tgId || "∅");
  } else if (IDS.rawExt && (IDS.rawExt.includes("#{") || IDS.rawExt.includes("{"))) {
    el("idWarn").classList.remove("hide");
    el("idWarn").textContent =
      "В ссылке пришёл плейсхолдер вместо ID (external_user_id=" + IDS.rawExt + "). " +
      "Я взял ID из Telegram (" + IDS.tgId + ").";
  }

  function showLoading(on, title, sub){
    el("loading").classList.toggle("show", !!on);
    el("loadingText").textContent = title || "Загрузка…";
    el("loadingSub").textContent = sub || "";
  }

  function showLock(on){ el("lockFull").classList.toggle("show", !!on); }
  function showSheet(on){ el("sheetAdd").classList.toggle("show", !!on); }

  async function postForm(url, data, timeoutMs=12000){
    // Автоматически добавляем UTM метки в каждый запрос
    const utm = getUtm();
    const body = new URLSearchParams({...data, ...utm});
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), timeoutMs);
    try{
      const res = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "x-webhook-token": CONFIG.n8n.token
        },
        body,
        signal: ctrl.signal
      });
      const json = await res.json().catch(()=> ({}));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (json && (json.status === "forbidden" || (json.ok === false && json.status === "forbidden"))) {
        throw new Error("forbidden");
      }
      return json;
    } catch(e){
      if (String(e?.name) === "AbortError") throw new Error("timeout");
      throw e;
    } finally {
      clearTimeout(t);
    }
  }

  function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
  function fmtInt(x){ const n = Number(x); return Number.isFinite(n) ? String(Math.round(n)) : "0"; }
  function pct(consumed, target){
    const c = Number(consumed||0), t = Number(target||0);
    if (!t || t <= 0) return 0;
    return clamp((c/t)*100, 0, 999);
  }
  function setBar(id, p){
    const v = clamp(p,0,100).toFixed(1) + "%";
    el(id).style.width = v;
  }

  const mealTypeRu = (t) => ({
    breakfast: "Завтрак",
    lunch: "Обед",
    dinner: "Ужин",
    snack: "Перекус"
  }[String(t||"").toLowerCase()] || String(t||"—"));

  const goalRu = (g) => ({
    lose: "Снизить",
    maintain: "Поддерживать",
    gain: "Набрать"
  }[String(g||"").toLowerCase()] || String(g||"—"));

  const goalIcon = (g) => ({
    lose: "🔥",
    maintain: "🏋️",
    gain: "🚀"
  }[String(g||"").toLowerCase()] || "🏋️");

  function formatInTZ(date, tz){
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return fmt.format(date);
  }

  function fmtDateLabel(dateStr, tz){
    const today = formatInTZ(new Date(), tz);
    if (dateStr === today) return "Сегодня";
    const d = new Date(dateStr + "T00:00:00");
    try{
      return new Intl.DateTimeFormat("ru-RU", { timeZone: tz, day:"2-digit", month:"long" }).format(d);
    }catch{
      return dateStr;
    }
  }

  function fmtTimeHHMM(iso, tz){
    if (!iso) return "—";
    try{
      const d = new Date(iso);
      return new Intl.DateTimeFormat("ru-RU", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(d);
    }catch{
      return "—";
    }
  }

  const tabs = ["analytics", "diary", "profile", "habits", "workouts", "recipes", "nutri", "settings", "trainer", "findTrainer"];
  const tabEls = {
    analytics: el("tabAnalytics"),
    diary: el("tabDiary"),
    workouts: el("tabWorkouts"),
    profile: el("tabProfile"),
    habits: el("tabHabits"),
    recipes: el("tabRecipes"),
    nutri: el("tabNutri"),
    settings: el("tabSettings"),
    trainer: el("tabTrainer"),
    findTrainer: el("tabFindTrainer"),
  };
  const btnEls = {
    analytics: el("tabBtnAnalytics"),
    diary: el("tabBtnDiary"),
    workouts: el("tabBtnWorkouts"),
    profile: el("tabBtnProfile"),
    habits: el("tabBtnHabits"),
    recipes: el("tabBtnRecipes"),
    nutri: el("tabBtnNutri"),
    settings: el("tabBtnSettings"),
    trainer: el("tabBtnTrainer"),
    findTrainer: el("tabBtnFindTrainer"),
  };

  let state = {
    profile: null,
    tz: "Europe/Moscow",
    dateA: "",
    dateD: "",
    lastDailyData: null,
    subscription_level: 0,
    subscription_until: "",
    role: "user"
  };


  // Устанавливаем отступы для paywall overlay
  function updatePaywallInsets(){
    const topEl = document.querySelector('.topline');
    const tabEl = document.querySelector('.tabs');
    const container = document.querySelector('.container');
    if(topEl && tabEl){
      const topRect = topEl.getBoundingClientRect();
      const tabRect = tabEl.getBoundingClientRect();
      const topOffset = topRect.bottom + 0;
      const bottomOffset = window.innerHeight - tabRect.top;
      document.documentElement.style.setProperty('--paywall-top', topOffset + 'px');
      document.documentElement.style.setProperty('--paywall-bottom', bottomOffset + 'px');
    }
  }
  updatePaywallInsets();
  window.addEventListener('resize', updatePaywallInsets);

  function setActiveTab(name){
    const outsideTabs = ["nutri", "settings", "trainer", "findTrainer"];
    for (const t of tabs){
      tabEls[t].classList.toggle("hide", t !== name);
      btnEls[t].classList.toggle("active", t === name);
    }
    // FIX: main находится вне tabNutri/tabSettings — скрываем его, чтобы не занимал место
    el("mainScroll").classList.toggle("hide", outsideTabs.includes(name));
    vibSelect();
    el("mainScroll").scrollTo({ top: 0, behavior: "instant" });
    // Уведомляем модули о смене вкладки
    document.dispatchEvent(new CustomEvent("tabChanged", { detail: name }));
    // Проверяем paywall
    checkPaywall(name);
  }

  // Вкладки требующие подписки level >= 1
  const PAID_TABS   = ["workouts", "recipes"];                  // level >= 1
  const PREMIUM_TABS = ["nutri", "findTrainer"];               // level >= 2

  const PAYWALL_DESCS = {
    nutri:    "Чат с нутрициологом доступен на тарифе <b>Карманный тренер 🏋️</b>.",
    workouts: "Раздел тренировок доступен на тарифе <b>Клуб ⭐</b>.",
    recipes:  "Библиотека рецептов доступна на тарифе <b>Клуб ⭐</b>.",
    findTrainer: "Биржа тренеров доступна на тарифе <b>Карманный тренер 🏋️</b>."
  };

  function showPaywall(tabId, show){
    const gpw = document.getElementById("gpw");
    if(show){
      document.getElementById("gpwDesc").innerHTML = PAYWALL_DESCS[tabId] || "";
      gpw.style.display = "flex";
    } else {
      gpw.style.display = "none";
    }
  }

  function lockIfNeeded(tab){
    if (!state.profile){
      if (tab !== "profile" && tab !== "settings"){
        showLock(true);
        return false;
      }
    }
    if(PAID_TABS.includes(tab) && state.subscription_level < 1){
      showPaywall(tab, true);
      return false;
    }
    if(PREMIUM_TABS.includes(tab) && state.subscription_level < 2){
      showPaywall(tab, true);
      return false;
    }
    [...PAID_TABS, ...PREMIUM_TABS].forEach(t => showPaywall(t, false));
    return true;
  }

  function checkPaywall(tab){
    const allTabs = [...PAID_TABS, ...PREMIUM_TABS];
    if(PAID_TABS.includes(tab) && state.subscription_level < 1){
      showPaywall(tab, true);
    } else if(PREMIUM_TABS.includes(tab) && state.subscription_level < 2){
      showPaywall(tab, true);
    } else {
      allTabs.forEach(t => showPaywall(t, false));
    }
  }

  function enableTabs(){
    if(window.updateRow2Cols) window.updateRow2Cols();
    const hasProfile = !!state.profile;
    for (const t of tabs){
      if (t === "profile" || t === "settings") continue;
      btnEls[t].classList.toggle("disabled", !hasProfile);
    }
  }

  for (const t of tabs){
    btnEls[t].addEventListener("click", () => {
      if (!lockIfNeeded(t)) return;
      setActiveTab(t);
    });
  }

  el("btnGoProfile").addEventListener("click", () => {
    showLock(false);
    setActiveTab("profile");
  });

  el("btnOpenSheet").addEventListener("click", () => { vib(); showSheet(true); });
  el("btnCloseSheet").addEventListener("click", () => { vib(); showSheet(false); });

  function shiftDate(dateStr, days){
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0,10);
  }

  // Навигация по датам убрана — аналитика и дневник всегда показывают сегодня

  async function loadProfile(){
    if (!external_user_id) return null;
    const res = await postForm(CONFIG.n8n.profile_get, { external_user_id });
    if (res?.ok && res.found){
      state.subscription_level = parseInt(res.profile?.subscription_level || res.subscription_level || '0', 10);
      state.subscription_until = String(res.profile?.subscription_until || res.subscription_until || '');
      state.role = String(res.profile?.role || 'user');
      return res.profile;
    }
    return null;
  }

  function setProfileUI(p){
    const has = !!p;
    el("profileFormBlock").classList.toggle("hide", has);
    el("profileReadyBlock").classList.toggle("hide", !has);
    if (!has) return;

    el("pWeight").textContent = fmtInt(p.weight_kg) + " кг";
    el("pHeight").textContent = fmtInt(p.height_cm) + " см";
    el("pAge").textContent = fmtInt(p.age);
    el("pGoal").textContent = goalRu(p.goal);
    el("pGoalIcon").textContent = goalIcon(p.goal);

    el("tCal").textContent  = fmtInt(p.target_calories);
    el("tProt").textContent = fmtInt(p.target_protein_g);
    el("tFat").textContent  = fmtInt(p.target_fat_g);
    el("tCarb").textContent = fmtInt(p.target_carbs_g);

    el("profileHint").textContent = "Профиль заполнен. Разделы разблокированы.";
  }

  function fillProfileForm(p){
    if (!p) return;
    el("sex").value = String(p.sex || "");
    el("age").value = p.age ? String(p.age) : "";
    el("height_cm").value = p.height_cm ? String(p.height_cm) : "";
    el("weight_kg").value = p.weight_kg ? String(p.weight_kg) : "";
    if (el("target_weight")) el("target_weight").value = p.target_weight ? String(p.target_weight) : "";
    el("activity_level").value = p.activity_level ? String(p.activity_level) : "";
    el("goal").value = String(p.goal || "");
  }

  function needProfileCalc(){
    const sex = el("sex").value;
    const age = el("age").value;
    const height_cm = el("height_cm").value;
    const weight_kg = el("weight_kg").value;
    const activity_level = el("activity_level").value;
    const goal = el("goal").value;
    return (sex=="" || age=="" || height_cm=="" || weight_kg=="" || activity_level=="" || goal=="") ? "1" : "0";
  }

  function showProfileFormHint(msg){
    el("profileFormHint").classList.remove("hide");
    el("profileFormHint").textContent = msg;
  }
  function hideProfileFormHint(){
    el("profileFormHint").classList.add("hide");
    el("profileFormHint").textContent = "";
  }

  el("btnSaveProfile").addEventListener("click", async () => {
    vib();
    hideProfileFormHint();

    if (!external_user_id) {
      showProfileFormHint("Нет external_user_id — запуск по ссылке неверный.");
      vibBad();
      return;
    }

    if (needProfileCalc() === "1"){
      showProfileFormHint("Заполни все поля профиля.");
      vibBad();
      return;
    }

    const data = {
      external_user_id,
      chat_id,
      timezone: state.tz,
      sex: el("sex").value,
      age: el("age").value,
      height_cm: el("height_cm").value,
      weight_kg: el("weight_kg").value,
      target_weight: el("target_weight") ? el("target_weight").value : "",
      activity_level: el("activity_level").value,
      goal: el("goal").value
    };

    showLoading(true, "Сохраняю профиль…");
    try{
      await postForm(CONFIG.n8n.profile_upsert, data);
      vibOk();
      await sleep(250);
      state.profile = await loadProfile();
      setProfileUI(state.profile);
      fillProfileForm(state.profile);
      enableTabs();
      setActiveTab("analytics");
      await refreshAll();
    }catch(e){
      vibBad();
      showProfileFormHint("Ошибка сохранения профиля: " + String(e.message || e));
    }finally{
      showLoading(false);
    }
  });

  el("btnEditProfile").addEventListener("click", () => {
    vib();
    el("profileFormBlock").classList.remove("hide");
    el("profileReadyBlock").classList.add("hide");
    fillProfileForm(state.profile);
  });

  async function loadDaily(dateStr){
    if (!external_user_id) return null;
    const res = await postForm(CONFIG.n8n.daily_get, { external_user_id, local_date: dateStr });
    if (res?.ok) {
      const d = res.daily || {};
      d._meals = Array.isArray(res.meals) ? res.meals : [];
      return d;
    }
    return null;
  }

  function setDiaryUI(d){
    if (!d) return;
    state.lastDailyData = d;   // сохраняем снапшот — поллинг будет сравнивать с ним

    const tK = Number(d.target_calories || 0);
    const cK = Number(d.consumed_calories || 0);
    const rem = Math.max(0, Math.round(tK - cK));

    el("dTargetKcal").textContent = fmtInt(tK);
    el("dRemainKcal").textContent = fmtInt(rem);

    el("dProtC").textContent = fmtInt(d.consumed_protein_g);
    el("dProtC2").textContent = fmtInt(d.consumed_protein_g);
    el("dProtT").textContent = fmtInt(d.target_protein_g);
    setBar("dBarP", pct(d.consumed_protein_g, d.target_protein_g));

    el("dFatC").textContent = fmtInt(d.consumed_fat_g);
    el("dFatC2").textContent = fmtInt(d.consumed_fat_g);
    el("dFatT").textContent = fmtInt(d.target_fat_g);
    setBar("dBarF", pct(d.consumed_fat_g, d.target_fat_g));

    el("dCarbC").textContent = fmtInt(d.consumed_carbs_g);
    el("dCarbC2").textContent = fmtInt(d.consumed_carbs_g);
    el("dCarbT").textContent = fmtInt(d.target_carbs_g);
    setBar("dBarC", pct(d.consumed_carbs_g, d.target_carbs_g));

    renderMeals(d._meals || []);
  }

  // ── RENDER MEALS ACCORDION ─────────────────────────────────────────────────
  function renderMeals(meals){
    const wrap = el("mealsAccordion");
    const emptyMsg = el("mealsEmpty");
    // clear previous meal cards (keep emptyMsg)
    wrap.querySelectorAll(".mealAcc").forEach(n => n.remove());

    if (!meals || meals.length === 0){
      emptyMsg.style.display = "";
      return;
    }
    emptyMsg.style.display = "none";

    meals.forEach((meal, mIdx) => {
      const items = Array.isArray(meal.items) ? meal.items : [];
      const timeStr = meal.created_at_iso ? fmtTimeHHMM(meal.created_at_iso, state.tz) : "—";
      const kcalStr = fmtInt(meal.calories) + " ккал";
      const pfcStr  = `Б${fmtInt(meal.protein_g)} / Ж${fmtInt(meal.fat_g)} / У${fmtInt(meal.carbs_g)}`;

      const acc = document.createElement("div");
      acc.className = "mealAcc";
      acc.dataset.mealKey = meal.key || "";

      // ── header ──────────────────────────────────────────────────────────────
      const top = document.createElement("div");
      top.className = "mealAccTop";
      top.innerHTML = `
        <div style="min-width:0;">
          <div class="mTitle">${mealTypeRu(meal.meal_type)}</div>
          <div class="mSub">${kcalStr} &nbsp;•&nbsp; ${pfcStr} &nbsp;•&nbsp; ${timeStr}</div>
        </div>
        <div class="mealAccArrow">▾</div>`;
      top.addEventListener("click", () => {
        vibSelect();
        acc.classList.toggle("open");
      });
      acc.appendChild(top);

      // ── body ────────────────────────────────────────────────────────────────
      const body = document.createElement("div");
      body.className = "mealAccBody";

      // ---- items list ----
      const itemsWrap = document.createElement("div");
      itemsWrap.className = "mealItemsList";

      const rebuildItems = () => {
        itemsWrap.innerHTML = "";
        const currentItems = acc._items || [];
        currentItems.forEach((item, iIdx) => {
          const row = document.createElement("div");
          row.className = "mealItemRow";
          row.innerHTML = `
            <span class="mealItemName" title="${item.name}">${item.name}</span>
            <input class="mealItemGrams" type="number" value="${item.grams}" min="1" max="9999" inputmode="numeric" />
            <span class="mealItemUnit">г</span>
            <button class="mealItemRemove" title="Удалить">✕</button>`;
          row.querySelector(".mealItemGrams").addEventListener("change", e => {
            acc._items[iIdx].grams = Math.max(1, parseInt(e.target.value) || 1);
          });
          row.querySelector(".mealItemRemove").addEventListener("click", () => {
            vibSelect();
            acc._items.splice(iIdx, 1);
            rebuildItems();
          });
          itemsWrap.appendChild(row);
        });
      };

      acc._items = items.map(i => ({ name: String(i.name || ""), grams: Number(i.grams || 0) }));
      rebuildItems();
      body.appendChild(itemsWrap);

      // ---- add ingredient row ----
      const addRow = document.createElement("div");
      addRow.className = "mealAddItemRow";
      addRow.innerHTML = `
        <input class="mealAddNameInput" placeholder="Ингредиент" />
        <input class="mealAddGramsInput" type="number" placeholder="г" min="1" inputmode="numeric" />
        <button class="mealAddBtn" title="Добавить">+</button>`;
      addRow.querySelector(".mealAddBtn").addEventListener("click", () => {
        vibSelect();
        const nameInp = addRow.querySelector(".mealAddNameInput");
        const gramsInp = addRow.querySelector(".mealAddGramsInput");
        const name  = nameInp.value.trim();
        const grams = parseInt(gramsInp.value) || 0;
        if (!name || grams < 1){
          nameInp.style.borderColor = "rgba(255,90,106,.5)";
          setTimeout(() => nameInp.style.borderColor = "", 1200);
          return;
        }
        acc._items.push({ name, grams });
        rebuildItems();
        nameInp.value = "";
        gramsInp.value = "";
      });
      body.appendChild(addRow);

      // ---- recalc button ----
      const recalcBtn = document.createElement("button");
      recalcBtn.className = "mealRecalcBtn";
      recalcBtn.textContent = "🔄 Пересчитать";

      const hint = document.createElement("div");
      hint.className = "mealRecalcHint";

      recalcBtn.addEventListener("click", async () => {
        vib();
        const items = acc._items;
        if (!items || items.length === 0){
          hint.className = "mealRecalcHint show bad";
          hint.textContent = "Нет ингредиентов для пересчёта.";
          return;
        }
        recalcBtn.disabled = true;
        recalcBtn.textContent = "⏳ Считаю…";
        hint.className = "mealRecalcHint";
        try{
          const result = await submitMealEdit(meal.key, items);
          vibOk();
          hint.className = "mealRecalcHint show ok";
          hint.textContent = `✅ Обновлено: ${fmtInt(result.calories)} ккал • Б${fmtInt(result.protein_g)} / Ж${fmtInt(result.fat_g)} / У${fmtInt(result.carbs_g)}`;
          // refresh diary
          await sleep(400);
          await refreshDiary();
        }catch(e){
          vibBad();
          hint.className = "mealRecalcHint show bad";
          hint.textContent = "Ошибка: " + String(e.message || e);
        }finally{
          recalcBtn.disabled = false;
          recalcBtn.textContent = "🔄 Пересчитать";
        }
      });

      body.appendChild(recalcBtn);
      body.appendChild(hint);
      acc.appendChild(body);
      wrap.appendChild(acc);
    });
  }

  // ── SUBMIT MEAL EDIT ───────────────────────────────────────────────────────
  async function submitMealEdit(mealKey, items){
    if (!external_user_id) throw new Error("Нет external_user_id");
    const payload = {
      external_user_id,
      meal_key: mealKey,
      items_json: JSON.stringify(items)
    };
    const res = await postForm(CONFIG.n8n.meal_edit, payload, 20000);
    if (!res?.ok) throw new Error(res?.error || "Ошибка сервера");
    return res.meal || {};
  }

  async function refreshDiary(){
    if (!state.profile) return;
    showLoading(true, "Загружаю дневник…");
    try{
      const d = await loadDaily(state.dateD);
      setDiaryUI(d);
    }catch(e){
      el("diaryHint").classList.remove("hide");
      el("diaryHint").textContent = "Ошибка дневника: " + String(e.message || e);
    }finally{
      showLoading(false);
    }
  }

  function setAnalyticsUI(d){
    if (!d) return;
    el("aKcal").textContent = fmtInt(d.consumed_calories);
    el("aProt").textContent = fmtInt(d.consumed_protein_g);
    el("aFat").textContent = fmtInt(d.consumed_fat_g);
    el("aCarb").textContent = fmtInt(d.consumed_carbs_g);

    el("pKcalC").textContent = fmtInt(d.consumed_calories);
    el("pKcalT").textContent = fmtInt(d.target_calories);
    el("pKcalPct").textContent = fmtInt(pct(d.consumed_calories, d.target_calories));
    setBar("barKcal", pct(d.consumed_calories, d.target_calories));

    el("pProtC").textContent = fmtInt(d.consumed_protein_g);
    el("pProtT").textContent = fmtInt(d.target_protein_g);
    el("pProtPct").textContent = fmtInt(pct(d.consumed_protein_g, d.target_protein_g));
    setBar("barProt", pct(d.consumed_protein_g, d.target_protein_g));

    el("pFatC").textContent = fmtInt(d.consumed_fat_g);
    el("pFatT").textContent = fmtInt(d.target_fat_g);
    el("pFatPct").textContent = fmtInt(pct(d.consumed_fat_g, d.target_fat_g));
    setBar("barFat", pct(d.consumed_fat_g, d.target_fat_g));

    el("pCarbC").textContent = fmtInt(d.consumed_carbs_g);
    el("pCarbT").textContent = fmtInt(d.target_carbs_g);
    el("pCarbPct").textContent = fmtInt(pct(d.consumed_carbs_g, d.target_carbs_g));
    setBar("barCarb", pct(d.consumed_carbs_g, d.target_carbs_g));
  }

  async function refreshAnalytics(){
    if (!state.profile) return;
    showLoading(true, "Загружаю аналитику…");
    try{
      const d = await loadDaily(state.dateA);
      setAnalyticsUI(d);
    }catch(e){
      el("analyticsHint").classList.remove("hide");
      el("analyticsHint").textContent = "Ошибка аналитики: " + String(e.message || e);
    }finally{
      showLoading(false);
    }
  }

  async function loadMonth(monthStr){
    if (!external_user_id) return null;
    const payload = { external_user_id };
    if (monthStr) payload.month = monthStr;
    const res = await postForm(CONFIG.n8n.month_get, payload);
    if (res?.ok) return res;
    return null;
  }

  function setMonthUI(res){
    const s = res?.stats || {};
    el("mStreak").textContent = fmtInt(s.streak_days);
    el("mDays").textContent = fmtInt(s.days_with_entries);
    el("mPct").textContent = fmtInt(s.pct_of_plan);
    el("mPct2").textContent = fmtInt(s.pct_of_plan);
    el("mAvgKcal").textContent = fmtInt(s.avg_calories);
    el("mAvgP").textContent = fmtInt(s.avg_protein_g);
    el("mAvgF").textContent = fmtInt(s.avg_fat_g);
    el("mAvgC").textContent = fmtInt(s.avg_carbs_g);
  }

  function showLogHint(msg, ok){
    el("logHint").classList.remove("hide");
    el("logHint").classList.toggle("ok", !!ok);
    el("logHint").classList.toggle("bad", !ok);
    el("logHint").textContent = msg;
  }

  // PHOTO: подготовка фото (сжатие/resize) и отправка в n8n без ломания текущего текстового сценария
  let mealPhotoState = {
    data_url: "",
    base64: "",
    mime: "",
    name: "",
    orig_size: 0,
    w: 0,
    h: 0
  };

  function fmtBytes(n){
    const x = Number(n||0);
    if (!Number.isFinite(x) || x <= 0) return "0 B";
    const u = ["B","KB","MB","GB"];
    let i = 0;
    let v = x;
    while (v >= 1024 && i < u.length-1){ v /= 1024; i++; }
    return (i === 0 ? String(Math.round(v)) : String(Math.round(v*10)/10)) + " " + u[i];
  }

  function resetMealPhoto(){
    mealPhotoState = { data_url:"", base64:"", mime:"", name:"", orig_size:0, w:0, h:0 };
    const inp = el("mealPhoto");
    if (inp) inp.value = "";
    const img = el("mealPhotoPreview");
    if (img){
      img.src = "";
      img.classList.add("hide");
    }
    const meta = el("mealPhotoMeta");
    if (meta) meta.textContent = "Фото не выбрано";
  }

  function readAsDataURL(file){
    return new Promise((resolve, reject)=>{
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(r.error || new Error("file_read_error"));
      r.readAsDataURL(file);
    });
  }

  async function compressImageToDataURL(file, maxSide=1280, quality=0.82){
    const src = await readAsDataURL(file);
    const img = new Image();
    img.src = src;

    // img.decode() не везде стабилен в WebView → фолбэк на onload
    try{
      if (img.decode) await img.decode();
      else await new Promise((res, rej)=>{ img.onload=res; img.onerror=rej; });
    }catch{
      await new Promise((res, rej)=>{ img.onload=res; img.onerror=rej; });
    }

    const w0 = img.naturalWidth || img.width || 0;
    const h0 = img.naturalHeight || img.height || 0;
    if (!w0 || !h0) throw new Error("bad_image");

    const scale = Math.min(1, maxSide / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(img, 0, 0, w, h);

    const outMime = "image/jpeg";
    const dataUrl = canvas.toDataURL(outMime, quality);
    const base64 = String(dataUrl.split(",")[1] || "");

    return { dataUrl, base64, mime: outMime, w, h };
  }

  // UI events (если этих элементов нет — ничего не происходит)
  try{
    el("btnClearPhoto")?.addEventListener("click", ()=>{ vib(); resetMealPhoto(); });
    el("mealPhoto")?.addEventListener("change", async ()=>{
      vibSelect();
      const f = el("mealPhoto")?.files?.[0];
      if (!f){ resetMealPhoto(); return; }

      showLoading(true, "Готовлю фото…", "Сжимаю изображение для быстрой отправки");
      try{
        const out = await compressImageToDataURL(f, 1280, 0.82);

        // safety: ограничим размер data-url (чтобы не упереться в лимиты прокси/вебхука)
        if (out.dataUrl.length > 1400000){
          resetMealPhoto();
          showLogHint("Фото слишком большое. Попробуй сделать снимок ближе или выбери другое фото.", false);
          vibBad();
          return;
        }

        mealPhotoState.data_url = out.dataUrl;
        mealPhotoState.base64 = out.base64;
        mealPhotoState.mime = out.mime;
        mealPhotoState.name = (f.name && String(f.name).trim()) ? String(f.name) : "photo.jpg";
        mealPhotoState.orig_size = Number(f.size || 0);
        mealPhotoState.w = out.w;
        mealPhotoState.h = out.h;

        const img = el("mealPhotoPreview");
        if (img){
          img.src = out.dataUrl;
          img.classList.remove("hide");
        }

        const meta = el("mealPhotoMeta");
        if (meta){
          meta.textContent = "Фото: " + fmtBytes(mealPhotoState.orig_size) + " • " + mealPhotoState.w + "×" + mealPhotoState.h;
        }
      }catch(e){
        resetMealPhoto();
        showLogHint("Не получилось прочитать фото: " + String(e.message || e), false);
        vibBad();
      }finally{
        showLoading(false);
      }
    });
  }catch{}

  // ── POLLING: ждём пока n8n запишет данные после добавления еды ─────────────
  // losevfft отвечает {"status":"accepted"} сразу, GPT + запись в sheets идут
  // в фоне ещё ~5-15 сек. Поэтому после submit поллим daily_get пока
  // meals_count не вырастет или last_meal_at не изменится.
  async function pollUntilNewMeal(prevCount, prevLastAt, maxMs){
    const deadline = Date.now() + maxMs;
    let attempt = 0;
    while (Date.now() < deadline){
      await sleep(attempt === 0 ? 3000 : 2500);  // первый запрос через 3 сек
      attempt++;
      try{
        const d = await loadDaily(state.dateD);
        if (!d) continue;
        const newCount  = Number(d.meals_count || 0);
        const newLastAt = String(d.last_meal_at || "");
        const changed   = newCount > prevCount ||
                          (newLastAt && newLastAt !== prevLastAt);
        if (changed){
          setDiaryUI(d);
          // обновляем аналитику и месяц в фоне (не блокируем UI)
          refreshAnalytics().catch(()=>{});
          (async()=>{
            try{
              const monthStr = state.dateA ? String(state.dateA).slice(0,7) : "";
              const res = await loadMonth(monthStr);
              if (res) setMonthUI(res);
            }catch{}
          })();
          return true;  // успех
        }
      }catch{}
    }
    // timeout — делаем обычный обновление
    await refreshAll().catch(()=>{});
    return false;
  }

  el("btnLogMeal").addEventListener("click", async () => {
    vib();
    const type = el("mealType").value;
    const caption = String(el("mealText").value || "").trim();
    if (!caption && !mealPhotoState.data_url){
      showLogHint("Пришли фото еды или напиши текстом, что ты ел(а).", false);
      vibBad(); return;
    }
    if (!external_user_id){
      showLogHint("Нет external_user_id.", false);
      vibBad();
      return;
    }

    // Запоминаем текущее состояние чтобы понять когда появятся новые данные
    const prevCount  = Number(state.lastDailyData?.meals_count || 0);
    const prevLastAt = String(state.lastDailyData?.last_meal_at || "");

    showLoading(true, "Записываю приём…", mealPhotoState.data_url ? "Анализирую фото еды…" : "Анализирую описание еды…");
    try{
      await postForm(CONFIG.n8n.losevfft, {
        external_user_id,
        chat_id,
        message_id: String(Date.now()),
        meal_type: type,
        caption,
        photo_url: "",
        has_photo: mealPhotoState.data_url ? "1" : "0",
        photo_data_url: mealPhotoState.data_url || "",
        photo_base64: mealPhotoState.base64 || "",
        photo_mime: mealPhotoState.mime || "",
        photo_name: mealPhotoState.name || "",
        photo_w: mealPhotoState.w ? String(mealPhotoState.w) : "",
        photo_h: mealPhotoState.h ? String(mealPhotoState.h) : ""
      }, mealPhotoState.data_url ? 25000 : 12000);

      // n8n ответил "accepted" — теперь ждём пока он закончит обработку
      showSheet(false);
      el("mealText").value = "";
      resetMealPhoto();

      showLoading(true, "Считаю калории…", "ИИ анализирует еду, подождите…");
      const ok = await pollUntilNewMeal(prevCount, prevLastAt, 45000);

      vibOk();
      if (!ok){
        // поллинг истёк — тихо показываем что записали
        const h = el("diaryHint");
        h.classList.remove("hide");
        h.classList.add("ok");
        h.textContent = "Приём записан. Обновите страницу вручную если данные не обновились.";
        setTimeout(() => h.classList.add("hide"), 5000);
      }
    }catch(e){
      vibBad();
      showLogHint("Ошибка записи: " + String(e.message || e), false);
    }finally{
      showLoading(false);
    }
  });

  function switchSet(on, elSw){
    elSw.classList.toggle("on", !!on);
  }


  document.querySelectorAll(".acc").forEach(acc => {
    acc.querySelector(".accTop").addEventListener("click", () => {
      vibSelect();
      acc.classList.toggle("open");
    });
  });

  async function refreshAll(){
    if (!state.profile) return;
    await Promise.all([
      refreshAnalytics(),
      refreshDiary(),
      refreshWeight().catch(()=>{}),
      refreshWater().catch(()=>{}),
      (async ()=>{
        try{
          const monthStr = state.dateA ? String(state.dateA).slice(0,7) : "";
          const res = await loadMonth(monthStr);
          if (res) setMonthUI(res);
        }catch{}
      })()
    ]);
  }

  // ======== HABITS ========
  // Top-level — same location as btnSaveProfile, btnEditProfile, btnLogMeal
  // BEFORE all IIFEs so no IIFE crash can block these handlers
  const _HABITS_STORE = 'habits_defs_v2';
  const _HABITS_LOGS  = 'habits_logs_cache_v2';
  const _HABITS_DAYS  = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  let _habitsAddRem   = {enabled:false, time:'08:00', days:[1,2,3,4,5,6,7], before:10};
  let _habitsStatus   = {};

  function _hLoadDefs(){
    try{
      const v2 = JSON.parse(localStorage.getItem(_HABITS_STORE)||'null');
      if(v2) return v2;
      const v1 = JSON.parse(localStorage.getItem('habits_defs_v1')||'null');
      if(v1 && v1.length){ localStorage.setItem(_HABITS_STORE, JSON.stringify(v1)); return v1; }
      return [];
    }catch(e){ return []; }
  }
  function _hSaveDefs(arr){ localStorage.setItem(_HABITS_STORE, JSON.stringify(arr)); }

  function _hLoadLogsCache(){
    try{ return JSON.parse(localStorage.getItem(_HABITS_LOGS)||'{}'); }catch(e){ return {}; }
  }
  function _hSaveLogCache(date, hid, val){
    const c = _hLoadLogsCache();
    if(!c[date]) c[date] = {};
    c[date][hid] = val;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7);
    for(const d of Object.keys(c)){ if(new Date(d+'T00:00:00') < cutoff) delete c[d]; }
    localStorage.setItem(_HABITS_LOGS, JSON.stringify(c));
  }
  function _hRemoveLogCache(date, hid){
    const c = _hLoadLogsCache();
    if(c[date]) delete c[date][hid];
    localStorage.setItem(_HABITS_LOGS, JSON.stringify(c));
  }

  function _hToday(){
    return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date());
  }
  function _hPrevDay(ds){
    const d = new Date(ds+'T12:00:00'); d.setDate(d.getDate()-1);
    return d.toISOString().slice(0,10);
  }
  function _hFmtDate(ds){
    const d = new Date(ds+'T12:00:00');
    return d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
  }
  function _hEsc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  function _hCalcStreak(dates){
    if(!dates.length) return 0;
    const sorted = [...dates].sort((a,b)=>b.localeCompare(a));
    const today = _hToday();
    let streak = 0, cur = today;
    for(const d of sorted){ if(d===cur){ streak++; cur=_hPrevDay(cur); } else break; }
    if(streak===0){
      cur = _hPrevDay(today);
      for(const d of sorted){ if(d===cur){ streak++; cur=_hPrevDay(cur); } else break; }
    }
    return streak;
  }

  function _hBuildStatus(logs, today){
    const m = {};
    for(const l of logs){
      if(!m[l.habit_id]) m[l.habit_id] = {doneToday:false, value:'', dates:[]};
      const e = m[l.habit_id];
      if(l.date===today && String(l.value)!=='0'){ e.doneToday=true; e.value=l.value; }
      if(!e.dates.includes(l.date) && String(l.value)!=='0') e.dates.push(l.date);
    }
    return m;
  }

  async function _hLoadLogs(){
    const today = _hToday();
    let serverLogs = [];
    if(external_user_id){
      try{
        const r = await postForm(CONFIG.n8n.habits_get, {external_user_id});
        serverLogs = (r && r.ok) ? (r.logs||[]) : [];
      }catch(e){ serverLogs = []; }
    }
    const cache = _hLoadLogsCache();
    const todayCache = cache[today] || {};
    const serverIds = new Set(serverLogs.filter(l=>l.date===today).map(l=>l.habit_id));
    for(const [hid, val] of Object.entries(todayCache)){
      if(!serverIds.has(hid)) serverLogs.push({habit_id:hid, date:today, value:val});
    }
    return serverLogs;
  }

  async function _hSendLog(hid, date, val){
    if(String(val)==='0' || val===''){
      _hRemoveLogCache(date, hid);
    } else {
      _hSaveLogCache(date, hid, String(val));
    }
    try{
      await postForm(CONFIG.n8n.habits_log, {external_user_id, habit_id:hid, date, value:String(val)});
    }catch(e){}
  }

  function _hRender(defs, status, today){
    _habitsStatus = status;
    const list  = document.getElementById('habitsList');
    const empty = document.getElementById('habitsEmpty');
    const lbl   = document.getElementById('habitsDateLbl');
    if(lbl) lbl.textContent = _hFmtDate(today);
    if(!defs.length){ list.innerHTML=''; empty.style.display='block'; return; }
    empty.style.display='none';
    list.innerHTML='';

    for(const def of defs){
      const st = status[def.id] || {doneToday:false, value:'', dates:[]};
      const streak = _hCalcStreak(st.dates);
      const div = document.createElement('div');
      div.className = 'habitItem';
      const bellActive = (def.reminder && def.reminder.enabled) ? ' bellActive' : '';
      div.innerHTML = `
        <button class="habitCheckBtn${st.doneToday?' done':''}" data-id="${def.id}" title="Отметить" style="touch-action:manipulation;">✓</button>
        <div class="habitInfo">
          <div class="habitName">${_hEsc(def.name)}</div>
          <div class="habitStreak${streak>=3?' hot':''}">${streak>0 ? '🔥 '+streak+' дн. подряд' : 'Ещё нет серии'}</div>
        </div>
        <button class="habitBell${bellActive}" data-id="${def.id}" title="Напоминание" style="background:none;border:none;font-size:18px;cursor:pointer;padding:4px;line-height:1;touch-action:manipulation;">🔔</button>
        <button class="habitDel" data-id="${def.id}" title="Удалить" style="touch-action:manipulation;">✕</button>`;
      list.appendChild(div);
    }
  }

  // Event delegation on habitsList
  document.getElementById('habitsList').addEventListener('click', async (e) => {
    const checkBtn = e.target.closest('.habitCheckBtn');
    const bellBtn  = e.target.closest('.habitBell');
    const delBtn   = e.target.closest('.habitDel');

    if(checkBtn){
      const hid = checkBtn.dataset.id;
      const today = _hToday();
      const st = _habitsStatus[hid] || {doneToday:false, value:'', dates:[]};
      if(!_habitsStatus[hid]) _habitsStatus[hid] = st;
      const wasDone = st.doneToday;
      const newVal = wasDone ? '0' : '1';
      st.doneToday = !wasDone;
      if(!wasDone && !st.dates.includes(today)) st.dates.push(today);
      if(wasDone) st.dates = st.dates.filter(d=>d!==today);
      checkBtn.classList.toggle('done', !wasDone);
      const newStreak = _hCalcStreak(st.dates);
      const streakEl = checkBtn.closest('.habitItem').querySelector('.habitStreak');
      if(streakEl){
        streakEl.textContent = newStreak>0 ? '🔥 '+newStreak+' дн. подряд' : 'Ещё нет серии';
        streakEl.classList.toggle('hot', newStreak>=3);
      }
      await _hSendLog(hid, today, newVal);
      return;
    }
    if(delBtn){
      const hid = delBtn.dataset.id;
      const def = _hLoadDefs().find(d=>d.id===hid);
      if(!confirm('Удалить «'+(def?def.name:'привычку')+'»?')) return;
      _hSaveDefs(_hLoadDefs().filter(d=>d.id!==hid));
      if(external_user_id){ try{ await postForm(CONFIG.n8n.habit_def_delete, {external_user_id, habit_id:hid}); }catch(e){} }
      await _hInit();
      return;
    }
    if(bellBtn){
      const hid = bellBtn.dataset.id;
      const def = _hLoadDefs().find(d=>d.id===hid);
      if(!def) return;
      _hOpenRemModal(def.name, def.reminder, async (rem, hint) => {
        const defs = _hLoadDefs();
        const idx = defs.findIndex(d=>d.id===hid);
        if(idx===-1) return;
        defs[idx].reminder = rem;
        _hSaveDefs(defs);
        const bellEl = document.querySelector('.habitBell[data-id="'+hid+'"]');
        if(bellEl) bellEl.classList.toggle('bellActive', rem.enabled);
        if(external_user_id && rem.enabled){
          try{
            await postForm(CONFIG.n8n.habit_reminder_set, {
              external_user_id, chat_id: String(state.profile?.chat_id||external_user_id),
              habit_id:hid, habit_name:def.name, time:rem.time, days:rem.days.join(','),
              before_min:String(rem.before), enabled:'1'
            });
            if(hint) hint.textContent = 'Напоминание сохранено!';
          }catch(e){ if(hint) hint.textContent = 'Сохранено локально'; }
        } else if(external_user_id){
          try{ await postForm(CONFIG.n8n.habit_reminder_set,{external_user_id, habit_id:hid, enabled:'0'}); }catch(e){}
          if(hint) hint.textContent = 'Напоминание выключено';
        } else {
          if(hint) hint.textContent = rem.enabled ? 'Сохранено' : 'Выключено';
        }
        setTimeout(_hCloseRemModal, 1200);
      });
      return;
    }
  });

  function _hOpenRemModal(habitName, initRem, onSave){
    const rem = initRem || {enabled:false, time:'08:00', days:[1,2,3,4,5,6,7], before:10};
    const modal = document.getElementById('remModal');
    const sub   = document.getElementById('remModalSubtitle');
    const body  = document.getElementById('remModalBody');
    if(sub) sub.textContent = habitName || '';
    body.innerHTML = `
      <div class="remSwitchRow" id="remSwitchRow">
        <div><div class="remSwitchLabel">Включить напоминание</div><div class="remSwitchDesc">Бот пришлёт сообщение в нужное время</div></div>
        <div class="iosToggle${rem.enabled?' on':''}" id="remToggleBtn"><div class="iosToggleThumb"></div></div>
      </div>
      <div id="remSettings" style="display:${rem.enabled?'flex':'none'};flex-direction:column;gap:20px;">
        <div class="remSection"><div class="remSectionLbl">Время напоминания</div>
          <input type="time" class="remTimeInp" id="remTimeInp" value="${rem.time||'08:00'}"></div>
        <div class="remSection"><div class="remSectionLbl">Напомнить за</div><div class="remBefore">
          ${[5,10,15,30].map(m=>`<button class="remBeforeBtn${(rem.before||10)===m?' sel':''}" data-before="${m}">${m} мин</button>`).join('')}
        </div></div>
        <div class="remSection"><div class="remSectionLbl">Дни недели</div><div class="reminderDays">
          ${_HABITS_DAYS.map((l,i)=>`<button class="rdBtn${(rem.days||[]).includes(i+1)?' sel':''}" data-day="${i+1}">${l}</button>`).join('')}
        </div></div>
        <button class="btn" id="remSaveBtn" style="width:100%;padding:15px;font-size:16px;font-weight:900;">Сохранить</button>
        <div class="hint" id="remHint" style="text-align:center;"></div>
      </div>`;
    const toggleBtn = body.querySelector('#remToggleBtn');
    const settings  = body.querySelector('#remSettings');
    body.querySelector('#remSwitchRow').addEventListener('click', () => {
      const on = !toggleBtn.classList.contains('on');
      toggleBtn.classList.toggle('on', on);
      settings.style.display = on ? 'flex' : 'none';
    });
    body.querySelectorAll('.rdBtn').forEach(b => {
      b.addEventListener('click', (e) => { e.stopPropagation(); b.classList.toggle('sel'); });
    });
    body.querySelectorAll('.remBeforeBtn').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        body.querySelectorAll('.remBeforeBtn').forEach(x=>x.classList.remove('sel'));
        b.classList.add('sel');
      });
    });
    body.querySelector('#remSaveBtn').addEventListener('click', async () => {
      if(typeof vib==='function') vib();
      const btn = body.querySelector('#remSaveBtn');
      btn.disabled = true; btn.textContent = 'Сохраняем...';
      const enabled = toggleBtn.classList.contains('on');
      const time    = body.querySelector('#remTimeInp')?.value || '08:00';
      const days    = [...body.querySelectorAll('.rdBtn.sel')].map(b=>Number(b.dataset.day));
      const before  = Number(body.querySelector('.remBeforeBtn.sel')?.dataset.before || 10);
      const hint    = body.querySelector('#remHint');
      await onSave({enabled, time, days, before}, hint);
      btn.disabled = false; btn.textContent = 'Сохранить';
    });
    modal.classList.add('open');
    modal.scrollTop = 0;
  }

  function _hCloseRemModal(){ document.getElementById('remModal').classList.remove('open'); }
  window.openRemModal   = _hOpenRemModal;
  window._closeRemModal = _hCloseRemModal;

  document.getElementById('remModalClose').addEventListener('click', _hCloseRemModal);
  document.getElementById('remModal').addEventListener('click', e => {
    if(e.target === document.getElementById('remModal')) _hCloseRemModal();
  });

  document.getElementById('addRemRow').addEventListener('click', () => {
    if(typeof vib==='function') vib();
    const name = document.getElementById('habitNameInp').value.trim() || 'Новая привычка';
    _hOpenRemModal(name, _habitsAddRem, async (rem) => {
      _habitsAddRem = rem;
      const t = document.getElementById('addRemToggle');
      if(t) t.classList.toggle('on', rem.enabled);
      const desc = document.getElementById('addRemDesc');
      if(desc) desc.textContent = rem.enabled ? rem.time+' · '+rem.days.length+' дн · за '+rem.before+' мин' : 'Выключено';
      _hCloseRemModal();
    });
  });

  // Кнопка: + Добавить привычку
  el("btnShowAddHabit").addEventListener("click", () => {
    vib();
    document.getElementById('habitsAddForm').style.display = 'block';
    document.getElementById('btnShowAddHabit').style.display = 'none';
  });

  // Кнопка: Отмена
  el("btnCancelHabit").addEventListener("click", () => {
    vib();
    document.getElementById('habitsAddForm').style.display = 'none';
    document.getElementById('btnShowAddHabit').style.display = 'block';
    document.getElementById('habitNameInp').value = '';
    _habitsAddRem = {enabled:false, time:'08:00', days:[1,2,3,4,5,6,7], before:10};
    const t = document.getElementById('addRemToggle'); if(t) t.classList.remove('on');
    const d = document.getElementById('addRemDesc');   if(d) d.textContent = 'Выключено';
  });

  // Кнопка: Сохранить привычку
  el("btnSaveHabit").addEventListener("click", async () => {
    vib();
    const nameInp = document.getElementById('habitNameInp');
    const name = nameInp.value.trim();
    const hint = document.getElementById('habitsHint');
    if(!name){ hint.textContent = 'Введи название привычки.'; return; }
    hint.textContent = '';
    const btn = document.getElementById('btnSaveHabit');
    btn.disabled = true; btn.textContent = 'Сохраняем...';
    const def = { id:'h_'+Date.now(), name, type:'check', reminder: _habitsAddRem.enabled ? {..._habitsAddRem} : null };
    const defs = _hLoadDefs(); defs.push(def); _hSaveDefs(defs);
    if(external_user_id){
      try{ await postForm(CONFIG.n8n.habit_defs_save, { external_user_id, habit_id:def.id, name:def.name, type:'check', target:'0', unit:'none' }); }catch(e){}
    }
    if(_habitsAddRem.enabled && external_user_id){
      try{ await postForm(CONFIG.n8n.habit_reminder_set, { external_user_id, chat_id:String(state.profile?.chat_id||external_user_id), habit_id:def.id, habit_name:def.name, time:_habitsAddRem.time, days:_habitsAddRem.days.join(','), before_min:String(_habitsAddRem.before), enabled:'1' }); }catch(e){}
    }
    _habitsAddRem = {enabled:false, time:'08:00', days:[1,2,3,4,5,6,7], before:10};
    btn.disabled = false; btn.textContent = 'Сохранить';
    document.getElementById('habitsAddForm').style.display = 'none';
    document.getElementById('btnShowAddHabit').style.display = 'block';
    nameInp.value = '';
    const t = document.getElementById('addRemToggle'); if(t) t.classList.remove('on');
    const d = document.getElementById('addRemDesc');   if(d) d.textContent = 'Выключено';
    await _hInit();
  });

  async function _hInit(){
    let defs = [];
    if(external_user_id){
      try{
        const r = await postForm(CONFIG.n8n.habit_defs_get, {external_user_id});
        let rawDefs = null;
        if(Array.isArray(r)) rawDefs = r;
        else if(r && Array.isArray(r.defs)) rawDefs = r.defs;
        else if(r && Array.isArray(r.data)) rawDefs = r.data;
        else if(r && Array.isArray(r.rows)) rawDefs = r.rows;
        else if(r && Array.isArray(r.habits)) rawDefs = r.habits;
        if(rawDefs && rawDefs.length){
          defs = rawDefs.map(d=>({ id:String(d.id||d.habit_id||''), name:d.name||d.habit_name||d.title||'Привычка', type:'check', reminder:d.reminder||null }));
          const localDefs = _hLoadDefs();
          const serverIds = new Set(defs.map(d=>d.id));
          const localOnly = localDefs.filter(d=>!serverIds.has(d.id));
          if(localOnly.length){
            defs = [...defs, ...localOnly];
            for(const ldef of localOnly){ try{ await postForm(CONFIG.n8n.habit_defs_save, { external_user_id, habit_id:ldef.id, name:ldef.name, type:'check', target:'0', unit:'none' }); }catch(e){} }
          }
          _hSaveDefs(defs);
        } else {
          const localDefs = _hLoadDefs();
          if(localDefs.length){
            defs = localDefs;
            for(const ldef of localDefs){ try{ await postForm(CONFIG.n8n.habit_defs_save, { external_user_id, habit_id:ldef.id, name:ldef.name, type:'check', target:'0', unit:'none' }); }catch(e){} }
          }
        }
      }catch(e){ defs = _hLoadDefs(); }
    } else {
      defs = _hLoadDefs();
    }
    const today = _hToday();
    const logs = await _hLoadLogs();
    const status = _hBuildStatus(logs, today);
    _hRender(defs, status, today);
  }

  window._initHabits = _hInit;
  document.addEventListener('tabChanged', e => { if(e.detail==='habits') _hInit(); });
  setTimeout(() => { if(external_user_id) _hInit(); }, 600);
  // ======== END HABITS ========

  // ======== WEIGHT ========
  // Top-level — no IIFE, same pattern as Profile/Meals/Habits
  async function loadWeightHistory(){
    if(!external_user_id) return null;
    try{ const r=await postForm(CONFIG.n8n.weight_get,{external_user_id}); return r?.ok?r:null; }catch{return null;}
  }

  function drawWeightChart(entries, profileWeight, targetWeight){
    const svg=document.getElementById("weightChart"); if(!svg) return;
    svg.innerHTML="";
    const ns="http://www.w3.org/2000/svg";
    const W=300,H=80,PX=10,PY=14;
    const goalW = targetWeight ? Number(targetWeight) : null;
    let pts = entries && entries.length ? [...entries] : [];
    if(!pts.length && !profileWeight && !goalW){
      svg.innerHTML='<text x="150" y="44" text-anchor="middle" fill="rgba(255,255,255,.2)" font-size="11" font-family="inherit">нет записей</text>';
      return;
    }
    if(!pts.length && profileWeight) pts=[{weight_kg:profileWeight,date:""}];
    const allVals = pts.map(e=>Number(e.weight_kg));
    if(goalW) allVals.push(goalW);
    const rawMn=Math.min(...allVals), rawMx=Math.max(...allVals);
    const spread=Math.max(rawMx-rawMn,1);
    const mn=rawMn-spread*0.35, mx=rawMx+spread*0.35;
    const yS = v => PY+(H-PY*2)*(1-(v-mn)/(mx-mn));
    const xOfI = i => pts.length>1 ? PX+i*(W-PX*2)/(pts.length-1) : W/2;
    const defs=document.createElementNS(ns,"defs");
    defs.innerHTML='<linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(120,160,255,.4)"/><stop offset="100%" stop-color="rgba(120,160,255,.04)"/></linearGradient>';
    svg.appendChild(defs);
    if(goalW){
      const gy=yS(goalW);
      const dl=document.createElementNS(ns,"line");
      dl.setAttribute("x1",PX); dl.setAttribute("x2",W-PX);
      dl.setAttribute("y1",gy); dl.setAttribute("y2",gy);
      dl.setAttribute("stroke","rgba(80,220,180,.45)"); dl.setAttribute("stroke-width","1.5");
      dl.setAttribute("stroke-dasharray","4 3");
      svg.appendChild(dl);
      const tg=document.createElementNS(ns,"text");
      tg.setAttribute("x",W-PX-1); tg.setAttribute("y",gy-3);
      tg.setAttribute("text-anchor","end"); tg.setAttribute("fill","rgba(80,220,180,.7)");
      tg.setAttribute("font-size","8"); tg.setAttribute("font-family","inherit"); tg.setAttribute("font-weight","800");
      tg.textContent="цель "+Number(goalW).toFixed(1);
      svg.appendChild(tg);
    }
    const firstX=xOfI(0), lastX=xOfI(pts.length-1);
    const linePts=pts.map((e,i)=>xOfI(i)+","+yS(Number(e.weight_kg)));
    const aD="M"+linePts[0]+" "+linePts.slice(1).map(p=>"L"+p).join(" ")+" L"+lastX+","+H+" L"+firstX+","+H+" Z";
    const area=document.createElementNS(ns,"path"); area.setAttribute("d",aD); area.setAttribute("fill","url(#wGrad)"); svg.appendChild(area);
    const line=document.createElementNS(ns,"polyline"); line.setAttribute("points",linePts.join(" "));
    line.setAttribute("fill","none"); line.setAttribute("stroke","rgba(120,160,255,.9)");
    line.setAttribute("stroke-width","2"); line.setAttribute("stroke-linecap","round"); line.setAttribute("stroke-linejoin","round");
    svg.appendChild(line);
    pts.forEach((e,i)=>{
      const cx=xOfI(i), cy=yS(Number(e.weight_kg)), isLast=i===pts.length-1, isFirst=i===0;
      const dot=document.createElementNS(ns,"circle");
      dot.setAttribute("cx",cx); dot.setAttribute("cy",cy);
      dot.setAttribute("r",isLast?"4.5":"2.5");
      dot.setAttribute("fill",isLast?"rgba(80,220,180,1)":"rgba(120,160,255,.55)");
      if(isLast){dot.setAttribute("stroke","rgba(255,255,255,.4)"); dot.setAttribute("stroke-width","1.5");}
      svg.appendChild(dot);
      if(isLast||isFirst){
        const t=document.createElementNS(ns,"text");
        t.setAttribute("x",cx+(isFirst&&pts.length>1?2:0)); t.setAttribute("y",cy-7);
        t.setAttribute("text-anchor",isLast&&pts.length>1?"end":"middle");
        t.setAttribute("fill",isLast?"rgba(255,255,255,.8)":"rgba(255,255,255,.4)");
        t.setAttribute("font-size","9"); t.setAttribute("font-family","inherit"); t.setAttribute("font-weight","800");
        t.textContent=Number(e.weight_kg).toFixed(1);
        svg.appendChild(t);
      }
    });
    const mkLbl=(x,txt,anchor)=>{const t=document.createElementNS(ns,"text");t.setAttribute("x",x);t.setAttribute("y",H-1);t.setAttribute("text-anchor",anchor);t.setAttribute("fill","rgba(255,255,255,.2)");t.setAttribute("font-size","7.5");t.setAttribute("font-family","inherit");t.textContent=txt;svg.appendChild(t);};
    mkLbl(PX,"Старт","start"); mkLbl(W-PX,"Финиш","end");
  }

  function setWeightUI(data,profile){
    const entries=data?.entries||[];
    const tw=profile?.target_weight?Number(profile.target_weight):null;
    const profileW = profile?.weight_kg ? Number(profile.weight_kg) : null;
    const l=entries.length?Number(entries[entries.length-1].weight_kg):null;
    const wCur=document.getElementById("wCurrent"), wD=document.getElementById("wDelta"),
          wG=document.getElementById("wGoal"),     wSt=document.getElementById("wStart"),
          wIn=document.getElementById("wInput");
    if(!wCur)return;
    wCur.textContent=(l??profileW)!=null?(l??profileW).toFixed(1):"—";
    if(wG) wG.textContent=tw!=null?tw.toFixed(1):"—";
    if(wSt) wSt.textContent=profileW!=null?profileW.toFixed(1):"—";
    if(wD){
      if(l!=null&&profileW!=null){
        const d=l-profileW; wD.textContent=(d>0?"+":"")+d.toFixed(1)+" кг";
        wD.style.background=d<0?"rgba(79,224,122,.15)":d>0?"rgba(255,90,106,.15)":"rgba(255,255,255,.08)";
        wD.style.color=d<0?"rgba(79,224,122,.95)":d>0?"rgba(255,90,106,.95)":"rgba(255,255,255,.5)";
      } else { wD.textContent="нет данных"; }
    }
    if(wIn) wIn.placeholder=l!=null?l.toFixed(1)+" кг":"кг";
    drawWeightChart(entries, profileW, tw);
  }

  async function refreshWeight(){
    if(!state.profile)return;
    const data=await loadWeightHistory();
    setWeightUI(data,state.profile);
  }

  // Кнопка: Записать вес
  el("btnLogWeight").addEventListener("click", async () => {
    vib();
    const inp=document.getElementById("wInput"), hint=document.getElementById("weightHint");
    const val=parseFloat(String(inp.value||"").replace(",","."));
    if(!val||val<30||val>300){ if(hint)hint.textContent="Введи вес от 30 до 300 кг."; return; }
    if(hint)hint.textContent="";
    showLoading(true,"Записываю вес…");
    try{
      const res=await postForm(CONFIG.n8n.weight_log,{external_user_id,weight_kg:val.toFixed(1)});
      if(res?.ok){ vibOk(); inp.value=""; if(hint)hint.textContent="✅ Вес записан!"; await refreshWeight(); }
      else{ vibBad(); if(hint)hint.textContent="Ошибка: "+(res?.error||"попробуй снова"); }
    }catch(e){ vibBad(); if(hint)hint.textContent="Ошибка соединения."; }
    finally{ showLoading(false); }
  });
  // ======== END WEIGHT ========

  // ======== WATER ========
  // Top-level — no IIFE, same pattern as Profile/Meals/Habits/Weight

  function _wTodayStr(){
    return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date());
  }

  function _wCalcGoal(){
    const w = state.profile?.weight_kg ? Number(state.profile.weight_kg) : 0;
    if(w >= 30) return Math.max(1500, Math.round(w * 30 / 250) * 250);
    return 2000;
  }

  const _WATER_LS_KEY = 'water_cache_v1';

  function _wGetCache(){
    try{
      const d = JSON.parse(localStorage.getItem(_WATER_LS_KEY)||'{}');
      return d.date === _wTodayStr() ? Number(d.total_ml||0) : 0;
    }catch{ return 0; }
  }
  function _wSetCache(total_ml){
    try{ localStorage.setItem(_WATER_LS_KEY, JSON.stringify({date:_wTodayStr(),total_ml})); }catch{}
  }

  async function _wLoadWater(){
    const cached = _wGetCache();
    if(!external_user_id) return cached;
    try{
      const r = await postForm(CONFIG.n8n.water_get, {external_user_id, date: _wTodayStr()});
      let server = null;
      if(r?.ok && r.total_ml !== undefined) server = Number(r.total_ml || 0);
      else if(r?.total_ml !== undefined) server = Number(r.total_ml || 0);
      else if(Array.isArray(r) && r.length) server = Number(r[0].total_ml || 0);
      else if(r?.data?.total_ml !== undefined) server = Number(r.data.total_ml || 0);
      else if(r?.ok && typeof r.ok === 'boolean') server = 0;
      if(server !== null){
        const final = Math.max(cached, server);
        _wSetCache(final);
        return final;
      }
      return cached;
    }catch{ return cached; }
  }

  async function _wSaveWater(total_ml){
    _wSetCache(total_ml);
    if(!external_user_id) return;
    try{
      await postForm(CONFIG.n8n.water_log, {
        external_user_id, date: _wTodayStr(), total_ml: String(total_ml)
      });
    }catch(e){ console.warn('water_log error', e); }
  }

  const _GLASS_ML = 250;

  function _wRender(total, goal){
    const cur   = document.getElementById('waterCurrent');
    const bar   = document.getElementById('waterBar');
    const pct   = document.getElementById('waterPct');
    const gLbl  = document.getElementById('waterGoalLbl');
    const gNum  = document.getElementById('waterGoal');
    const glDiv = document.getElementById('waterGlasses');
    const dLbl  = document.getElementById('waterDateLbl');
    if(!cur) return;
    if(dLbl) dLbl.textContent = _wTodayStr();
    cur.textContent = total;
    if(gNum) gNum.textContent = goal;
    if(gLbl) gLbl.textContent = goal + ' мл';
    const p = Math.min(100, Math.round(total / goal * 100));
    if(bar) bar.style.width = p + '%';
    if(pct) pct.textContent = p + '%';
    if(glDiv){
      const count = Math.round(goal / 250);
      const filled = Math.floor(total / 250);
      glDiv.innerHTML = '';
      for(let i = 0; i < count; i++){
        const isFilled = i < filled;
        const uid = 'g'+i+'x';
        const w = document.createElement('div');
        w.style.cssText = 'position:relative;width:30px;height:38px;flex-shrink:0;';
        w.title = (i+1)*_GLASS_ML+' мл';
        if(!isFilled){
          w.innerHTML = `<svg viewBox="0 0 30 38" style="width:100%;height:100%;">
            <path d="M3,2 L27,2 L25,36 L5,36 Z" fill="transparent"
              stroke="rgba(255,255,255,.18)" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>`;
        } else {
          const spd = 1.4 + (i%3)*0.3;
          w.innerHTML = `<svg viewBox="0 0 30 38" style="width:100%;height:100%;overflow:hidden;">
            <defs>
              <clipPath id="${uid}"><path d="M3,2 L27,2 L25,36 L5,36 Z"/></clipPath>
              <linearGradient id="${uid}g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(90,180,255,.75)"/>
                <stop offset="100%" stop-color="rgba(30,110,255,.9)"/>
              </linearGradient>
            </defs>
            <rect x="0" y="12" width="30" height="26" fill="url(#${uid}g)" clip-path="url(#${uid})"/>
            <g clip-path="url(#${uid})">
              <g style="animation:wvSlide ${spd}s linear infinite">
                <path d="M0,12 Q7.5,8 15,12 Q22.5,16 30,12 Q37.5,8 45,12 Q52.5,16 60,12 L60,38 L0,38 Z"
                  fill="rgba(140,215,255,.5)"/>
              </g>
            </g>
            <rect x="7" y="16" width="3" height="12" rx="1.5" fill="rgba(255,255,255,.2)" clip-path="url(#${uid})"/>
            <path d="M3,2 L27,2 L25,36 L5,36 Z" fill="none"
              stroke="rgba(70,160,255,.8)" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>`;
        }
        glDiv.appendChild(w);
      }
    }
  }

  function _wGetPortion(){
    const inp = document.getElementById('waterPortionInp');
    const v = inp ? parseInt(inp.value) : 0;
    return (v >= 50 && v <= 2000) ? v : 250;
  }

  async function _wAddWater(ml){
    vib();
    const goal = _wCalcGoal();
    const cur = Number(document.getElementById('waterCurrent').textContent) || 0;
    const newTotal = cur + ml;
    _wRender(newTotal, goal);
    await _wSaveWater(newTotal);
    const hint = document.getElementById('waterHint');
    if(newTotal >= goal){ if(hint) hint.textContent = '🎉 Дневная норма выполнена!'; vibOk(); }
    else { if(hint) hint.textContent = '+' + ml + ' мл добавлено'; setTimeout(()=>{ if(hint) hint.textContent=''; }, 1500); }
  }

  // Кнопка: Добавить воду
  el('btnWaterAdd').addEventListener('click', () => _wAddWater(_wGetPortion()));

  // Быстрые ссылки
  [['wq1',100],['wq2',200],['wq3',250],['wq4',500]].forEach(([id,ml])=>{
    const el2 = document.getElementById(id);
    if(el2) el2.addEventListener('click', ()=>{
      const inp = document.getElementById('waterPortionInp');
      if(inp){ inp.value = ml; inp.focus(); }
    });
  });

  // Кнопка: Сброс воды
  el('btnWaterReset').addEventListener('click', async () => {
    vib();
    if(!confirm('Сбросить воду за сегодня?')) return;
    const goal = _wCalcGoal();
    _wRender(0, goal);
    await _wSaveWater(0);
    const hint = document.getElementById('waterHint');
    if(hint) hint.textContent = '';
  });

  async function refreshWater(){
    if(!state.profile) return;
    const goal = _wCalcGoal();
    const total = await _wLoadWater();
    _wRender(total, goal);
  }
  // ======== END WATER ========

  // ============================================================
  // WORKOUTS
  // ============================================================
  // Top-level — no IIFE
  let workoutsLoaded = false;
  let currentWeekId = null;

  const NOTION_TOKEN = "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";

    async function loadWorkouts(){
      const prof = state.profile;
      if(!prof) return;

      el("workoutsLoading").classList.remove("hide");
      el("workoutsWeeksList").innerHTML = "";
      el("workoutsNoProgram").classList.add("hide");

      try{
        const data = await postForm(CONFIG.n8n.workouts_get, {
          sex: prof.sex || "",
          goal: prof.goal || "",
          activity_level: String(prof.activity_level || "1.2")
        });
        el("workoutsLoading").classList.add("hide");

        if(!data.ok || !data.weeks?.length){
          el("workoutsNoProgram").classList.remove("hide");
          return;
        }

        el("workoutsProgTitle").textContent = data.program_title || "";

        const list = el("workoutsWeeksList");
        data.weeks.forEach(week => {
          const card = document.createElement("div");
          card.className = "weekCard";
          if(week.cover){
            card.innerHTML = `
              <img class="weekCardCover" src="${week.cover}" alt="${week.title}" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
              <div class="weekCardTitle">${week.title}</div>`;
          } else {
            card.innerHTML = `<div class="weekCardNoImg">📅 ${week.title}</div>`;
          }
          card.addEventListener("click", () => openWeek(week.id, week.title));
          list.appendChild(card);
        });

        workoutsLoaded = true;
      } catch(e){
        el("workoutsLoading").classList.add("hide");
        el("workoutsNoProgram").classList.remove("hide");
      }
    }

    async function openWeek(pageId, title){
      el("workoutsWeekTitle").textContent = title;
      el("workoutsMain").classList.add("hide");
      el("workoutsWeekDetail").classList.remove("hide");
      el("workoutsWeekContent").innerHTML = `<div class="card" style="text-align:center;color:var(--muted);">Загрузка…</div>`;

      try{
        const data = await postForm(CONFIG.n8n.week_get, { page_id: pageId });
        renderWeekContent(data.groups || []);
      } catch(e){
        el("workoutsWeekContent").innerHTML = `<div class="card" style="text-align:center;">Ошибка загрузки</div>`;
      }
    }

    function renderWeekContent(groups){
      const container = el("workoutsWeekContent");
      container.innerHTML = "";

      if(!groups.length){
        container.innerHTML = `<div class="card" style="text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">📋</div>
          <div>Нет данных для отображения</div>
        </div>`;
        return;
      }

      groups.forEach(g => {
        if(!g.rows.length) return;
        const block = document.createElement("div");
        block.className = "workoutBlock";
        block.innerHTML = `<div class="workoutBlockTitle">🏋️ ${g.title}</div>`;

        const header = document.createElement("div");
        header.className = "exHeader";
        header.innerHTML = `<span>Упражнение</span><span>Подх.</span><span>Повт.</span><span>Отдых</span><span>Техника</span>`;
        block.appendChild(header);

        g.rows.forEach(row => {
          const exRow = document.createElement("div");
          exRow.className = "exerciseRow";
          exRow.innerHTML = `
            <div class="exName">${row.name}</div>
            <div class="exNum">${row.sets}</div>
            <div class="exNum">${row.reps}</div>
            <div class="exNum">${row.rest}</div>
            <div class="exLink">${row.tech_url ? `<button class="techBtn" data-url="${row.tech_url}" data-name="${row.name || ''}">▶</button>` : row.tech_text || ''}</div>
          `;
          block.appendChild(exRow);
        });

        container.appendChild(block);
      });

      if(!container.children.length){
        container.innerHTML = `<div class="card" style="text-align:center;">Нет данных</div>`;
      }
    }

    el("workoutsBack").addEventListener("click", () => {
      el("workoutsWeekDetail").classList.add("hide");
      el("workoutsMain").classList.remove("hide");
    });

    document.addEventListener("tabChanged", e => {
      if(e.detail === "workouts" && !workoutsLoaded && state.subscription_level >= 1){
        loadWorkouts();
      }
    });

  // Перезагружаем если подписка активировалась
  document.addEventListener("subscriptionActivated", () => {
    workoutsLoaded = false;
  });

  // ============================================================
  // END WORKOUTS
  // ============================================================

  // ============================================================
  // VIDEO MODAL — top-level, no IIFE
  // ============================================================
  function getYoutubeEmbedUrl(url) {
      try {
        const u = new URL(url);
        let vid = '';
        if (u.hostname.includes('youtu.be')) {
          vid = u.pathname.slice(1);
        } else if (u.hostname.includes('youtube.com')) {
          vid = u.searchParams.get('v') || '';
          const m = u.pathname.match(/\/shorts\/([^/?]+)/);
          if (m) vid = m[1];
        }
        if (!vid) return url;
        const t = u.searchParams.get('t') || '';
        return 'https://www.youtube.com/embed/' + vid + '?autoplay=1' + (t ? '&start='+t : '') + '&rel=0';
      } catch(err) { return url; }
    }

    function closeVideoModal() {
      document.getElementById('videoModal').classList.remove('open');
      document.getElementById('videoModalIframe').src = '';
    }

    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.techBtn');
      if (!btn) return;
      const rawUrl = btn.getAttribute('data-url');
      const name = btn.getAttribute('data-name') || '';
      const embedUrl = getYoutubeEmbedUrl(rawUrl);
      document.getElementById('videoModalIframe').src = embedUrl;
      document.getElementById('videoModalTitle').textContent = name;
      document.getElementById('videoModal').classList.add('open');
    });

  document.getElementById('videoModalClose').addEventListener('click', closeVideoModal);
  document.getElementById('videoModal').addEventListener('click', function(e) {
    if (e.target.id === 'videoModal') closeVideoModal();
  });


  // ============================================================
  // TRAINER MODE — top-level, no IIFE
  // ============================================================
  let currentClient = null;
  let currentClientDate = '';
  let currentClientTab = 'diary';

    // Показать/скрыть онбординг
    function showOnboarding(on){
      document.getElementById('onboardingRole').classList.toggle('show', on);
    }

    // Инициализация тренерского режима после загрузки профиля
    window.updateRow2Cols = function updateRow2Cols(){
      // В новом дизайне — скролл, ничего пересчитывать не нужно
      if(window._navScrollUpdate) window._navScrollUpdate();
    }

    window.initTrainerMode = function(){
      const role = state.role;
      const level = state.subscription_level;

      // Кнопка тренера — только для тренеров
      if(role === 'trainer'){
        el('tabBtnTrainer').classList.remove('hide');
        el('tabBtnFindTrainer').classList.add('hide');
        // Paywall если нет подписки уровня 2+
        document.getElementById('paywallTrainer').classList.toggle('hide', level >= 2);
      } else {
        el('tabBtnTrainer').classList.add('hide');
        el('tabBtnFindTrainer').classList.remove('hide');
        // Paywall для биржи тренеров — нужен уровень 2+
        }
      updateRow2Cols();
    };

    // Онбординг — выбор роли
    document.getElementById('onboardRoleUser').addEventListener('click', async () => {
      vib();
      localStorage.setItem('onboarding_done','1');
      showOnboarding(false);
      state.role = 'user';
      window.initTrainerMode();
    });

    document.getElementById('onboardRoleTrainer').addEventListener('click', async () => {
      vib();
      localStorage.setItem('onboarding_done','1');
      showOnboarding(false);
      // Регистрируем тренера
      const name = state.profile?.chat_id || external_user_id;
      try {
        await postForm(CONFIG.n8n.trainer_register, {
          external_user_id,
          name: state.profile ? (state.profile.external_user_id) : external_user_id,
          chat_id: state.profile?.chat_id || external_user_id
        });
        state.role = 'trainer';
        state.profile = await (async () => {
          const res = await postForm(CONFIG.n8n.profile_get, { external_user_id });
          if(res?.ok && res.found){
            state.subscription_level = parseInt(res.profile?.subscription_level || '0', 10);
            state.role = String(res.profile?.role || 'user');
            return res.profile;
          }
          return state.profile;
        })();
      } catch(e){}
      window.initTrainerMode();
    });

    // Загрузка клиентов тренера
    async function loadTrainerClients(){
      const list = document.getElementById('trainerClientsList');
      const noClients = document.getElementById('trainerNoClients');
      const loading = document.getElementById('trainerLoading');
      loading.classList.remove('hide');
      list.innerHTML = '';
      try {
        const res = await postForm(CONFIG.n8n.trainer_clients_get, { external_user_id });
        loading.classList.add('hide');
        if(!res?.ok || !res.clients?.length){
          noClients.classList.remove('hide');
          return;
        }
        noClients.classList.add('hide');
        res.clients.forEach(cl => {
          const card = document.createElement('div');
          card.className = 'trainerClientCard';
          const lastActivity = cl.last_meal_at
            ? new Date(cl.last_meal_at).toLocaleDateString('ru-RU', {day:'2-digit',month:'short'})
            : 'нет активности';
          card.innerHTML = `
            <div class="trainerCardAvatar">👤</div>
            <div class="trainerCardInfo">
              <div class="trainerCardName">ID: \${cl.external_user_id}</div>
              <div class="trainerCardMeta">Последняя активность: \${lastActivity}</div>
            </div>
            <div style="color:var(--accent);font-size:20px;">›</div>
          `;
          card.addEventListener('click', () => openClientCard(cl));
          list.appendChild(card);
        });
      } catch(e){
        loading.classList.add('hide');
        loading.classList.remove('hide');
        loading.textContent = 'Ошибка загрузки';
      }
    }

    // Открыть карточку клиента
    function openClientCard(cl){
      currentClient = cl;
      const tz = 'Europe/Moscow';
      currentClientDate = new Intl.DateTimeFormat('en-CA',{timeZone:tz}).format(new Date());
      document.getElementById('trainerClientName').textContent = 'ID: ' + cl.external_user_id;
      document.getElementById('trainerClientsList').classList.add('hide');
      document.getElementById('trainerNoClients').classList.add('hide');
      document.getElementById('trainerLoading').classList.add('hide');
      document.querySelector('.pageTitle')?.classList?.add('hide');
      document.getElementById('trainerClientCard').classList.remove('hide');
      switchClientTab('diary');
    }

    // Закрыть карточку
    document.getElementById('trainerBackBtn').addEventListener('click', () => {
      document.getElementById('trainerClientCard').classList.add('hide');
      document.getElementById('trainerClientsList').classList.remove('hide');
      document.querySelector('#trainerContent .pageTitle')?.classList?.remove('hide');
      loadTrainerClients();
    });

    // Переключение вкладок клиента
    function switchClientTab(tab){
      currentClientTab = tab;
      ['diary','weight','habits','comment'].forEach(t => {
        document.getElementById('clientTab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle('hide', t !== tab);
      });
      document.querySelectorAll('.clientTabBtn').forEach(b => {
        b.classList.toggle('active', b.dataset.ctab === tab);
      });
      document.getElementById('clientDiaryNav').classList.toggle('hide', tab !== 'diary');
      if(tab === 'diary') loadClientDiary();
      if(tab === 'weight') loadClientWeight();
      if(tab === 'habits') loadClientHabits();
    }

    document.querySelectorAll('.clientTabBtn').forEach(b => {
      b.addEventListener('click', () => switchClientTab(b.dataset.ctab));
    });

    // Навигация по датам
    function updateDiaryDateLabel(){
      const d = new Date(currentClientDate + 'T00:00:00');
      const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date());
      document.getElementById('clientDiaryDateLabel').textContent =
        currentClientDate === today ? 'Сегодня' :
        d.toLocaleDateString('ru-RU',{day:'2-digit',month:'short',weekday:'short'});
    }

    document.getElementById('clientDiaryPrev').addEventListener('click', () => {
      const d = new Date(currentClientDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      currentClientDate = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(d);
      updateDiaryDateLabel();
      loadClientDiary();
    });

    document.getElementById('clientDiaryNext').addEventListener('click', () => {
      const d = new Date(currentClientDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      currentClientDate = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(d);
      updateDiaryDateLabel();
      loadClientDiary();
    });

    // Загрузка дневника клиента
    async function loadClientDiary(){
      if(!currentClient) return;
      updateDiaryDateLabel();
      const cont = document.getElementById('clientTabDiary');
      cont.innerHTML = '<div class="hint" style="text-align:center;">Загрузка…</div>';
      try {
        const res = await postForm(CONFIG.n8n.trainer_client_diary, {
          trainer_id: external_user_id,
          client_id: currentClient.external_user_id,
          date: currentClientDate
        });
        if(!res?.ok){ cont.innerHTML = '<div class="hint bad">Ошибка загрузки</div>'; return; }
        const meals = res.meals || [];
        const d = res.daily || {};
        const mealNames = {breakfast:'Завтрак',lunch:'Обед',dinner:'Ужин',snack:'Перекус'};
        const groups = {};
        meals.forEach(m => {
          const k = m.meal_type || 'snack';
          if(!groups[k]) groups[k] = [];
          groups[k].push(m);
        });
        let html = `<div class="card" style="margin-top:0;">
          <div class="sectionLabel">Итого за день</div>
          <div class="miniStats" style="grid-template-columns:repeat(4,1fr);">
            <div class="mini"><div class="v" style="color:var(--c-kcal);">\${Math.round(d.consumed_calories||0)}</div><div class="k">ккал</div></div>
            <div class="mini"><div class="v" style="color:var(--c-prot);">\${Math.round(d.consumed_protein_g||0)}</div><div class="k">белки</div></div>
            <div class="mini"><div class="v" style="color:var(--c-fat);">\${Math.round(d.consumed_fat_g||0)}</div><div class="k">жиры</div></div>
            <div class="mini"><div class="v" style="color:var(--c-carb);">\${Math.round(d.consumed_carbs_g||0)}</div><div class="k">углев</div></div>
          </div></div>`;
        if(!meals.length){
          html += '<div class="hint" style="text-align:center;margin-top:10px;">Приёмов пищи нет</div>';
        } else {
          Object.entries(groups).forEach(([type, items]) => {
            html += `<div class="card" style="margin-top:10px;"><div class="sectionLabel">\${mealNames[type]||type}</div>`;
            items.forEach(m => {
              html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);">
                <div style="font-size:13px;font-weight:700;">\${m.food_name||'—'} <span style="font-weight:500;color:var(--muted);">\${m.weight_g||''}г</span></div>
                <div style="font-size:12px;color:var(--muted);">\${Math.round(m.calories||0)} ккал</div>
              </div>`;
            });
            html += '</div>';
          });
        }
        cont.innerHTML = html;
      } catch(e){ cont.innerHTML = '<div class="hint bad">Ошибка загрузки</div>'; }
    }

    // Загрузка веса клиента
    async function loadClientWeight(){
      if(!currentClient) return;
      const cont = document.getElementById('clientTabWeight');
      cont.innerHTML = '<div class="hint" style="text-align:center;">Загрузка…</div>';
      try {
        const res = await postForm(CONFIG.n8n.trainer_client_weight, {
          trainer_id: external_user_id,
          client_id: currentClient.external_user_id
        });
        if(!res?.ok){ cont.innerHTML = '<div class="hint bad">Ошибка загрузки</div>'; return; }
        const entries = res.entries || [];
        const last = entries.length ? entries[entries.length-1].weight_kg : null;
        let html = `<div class="card" style="margin-top:0;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:42px;font-weight:980;letter-spacing:-.03em;">\${last ? parseFloat(last).toFixed(1) : '—'}</div>
              <div style="font-size:13px;color:var(--muted);">Текущий вес, кг</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:13px;color:var(--muted);">Цель: <b style="color:var(--text);">\${res.target_weight ? parseFloat(res.target_weight).toFixed(1) : '—'} кг</b></div>
              <div style="font-size:13px;color:var(--muted);">Старт: <b style="color:var(--text);">\${res.start_weight ? parseFloat(res.start_weight).toFixed(1) : '—'} кг</b></div>
            </div>
          </div>
        </div>`;
        if(!entries.length){
          html += '<div class="hint" style="text-align:center;margin-top:10px;">Записей веса нет</div>';
        } else {
          html += '<div class="card" style="margin-top:10px;"><div class="sectionLabel">История</div>';
          entries.slice(-10).reverse().forEach(e => {
            html += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);">
              <div style="font-size:13px;color:var(--muted);">\${e.date}</div>
              <div style="font-size:13px;font-weight:800;">\${parseFloat(e.weight_kg).toFixed(1)} кг</div>
            </div>`;
          });
          html += '</div>';
        }
        cont.innerHTML = html;
      } catch(e){ cont.innerHTML = '<div class="hint bad">Ошибка загрузки</div>'; }
    }

    // Загрузка привычек клиента
    async function loadClientHabits(){
      if(!currentClient) return;
      const cont = document.getElementById('clientTabHabits');
      cont.innerHTML = '<div class="hint" style="text-align:center;">Загрузка…</div>';
      try {
        const res = await postForm(CONFIG.n8n.trainer_client_habits, {
          trainer_id: external_user_id,
          client_id: currentClient.external_user_id
        });
        if(!res?.ok){ cont.innerHTML = '<div class="hint bad">Ошибка загрузки</div>'; return; }
        const habits = res.habits || [];
        if(!habits.length){ cont.innerHTML = '<div class="hint" style="text-align:center;">Привычек нет</div>'; return; }
        let html = '';
        habits.forEach(h => {
          const done = h.logs ? h.logs.length : 0;
          const pct = Math.min(100, Math.round(done / 7 * 100));
          html += `<div class="card" style="margin-top:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-weight:800;font-size:14px;">\${h.name}</div>
              <div style="font-size:12px;color:var(--muted);">\${done}/7 дней</div>
            </div>
            <div class="bar" style="margin-top:8px;"><i style="width:\${pct}%;background:linear-gradient(90deg,rgba(79,224,122,.85),rgba(120,255,160,.60));"></i></div>
          </div>`;
        });
        cont.innerHTML = html;
      } catch(e){ cont.innerHTML = '<div class="hint bad">Ошибка загрузки</div>'; }
    }

    // Отправка комментария
    document.getElementById('trainerCommentSend').addEventListener('click', async () => {
      if(!currentClient) return;
      const text = document.getElementById('trainerCommentText').value.trim();
      const hint = document.getElementById('trainerCommentHint');
      if(!text){ hint.textContent = 'Введи текст комментария'; return; }
      vib();
      try {
        const res = await postForm(CONFIG.n8n.trainer_comment_add, {
          trainer_id: external_user_id,
          client_id: currentClient.external_user_id,
          text
        });
        if(res?.ok){ vibOk(); document.getElementById('trainerCommentText').value = ''; hint.textContent = '✅ Комментарий отправлен'; }
        else { vibBad(); hint.textContent = 'Ошибка отправки'; }
      } catch(e){ vibBad(); hint.textContent = 'Ошибка соединения'; }
    });

    // Загрузка биржи тренеров
    async function loadTrainersList(){
      const list = document.getElementById('trainersList');
      const loading = document.getElementById('trainersLoading');
      const empty = document.getElementById('trainersEmpty');
      loading.classList.remove('hide');
      list.innerHTML = '';
      try {
        const res = await postForm(CONFIG.n8n.trainers_list, { external_user_id });
        loading.classList.add('hide');
        if(!res?.ok){ loading.textContent = 'Ошибка загрузки'; return; }
        if(!res.trainers?.length){ loading.classList.add('hide'); empty.classList.remove('hide'); return; }
        res.trainers.forEach(t => {
          // Если name = числовой TG ID или пустое — показываем username или "Тренер"
          const isNumeric = /^\d+$/.test(String(t.name || ''));
          const displayName = (!t.name || isNumeric)
            ? (t.tg_username ? '@' + t.tg_username : t.first_name || t.last_name || 'Тренер')
            : t.name;

          const card = document.createElement('div');
          card.className = 'trainerListCard';
          card.innerHTML = `
            <div>
              <div style="font-weight:900;font-size:14px;">🏋️ ${displayName}</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px;">${t.clients_count || 0} клиентов</div>
            </div>
            <button class="btn" style="margin:0;padding:8px 16px;width:auto;" data-tid="${t.external_user_id}">Выбрать</button>
          `;
          card.querySelector('button').addEventListener('click', async (e) => {
            vib();
            const btn = e.target;
            btn.textContent = '…';
            try {
              const r = await postForm(CONFIG.n8n.trainer_client_add, {
                trainer_id: t.external_user_id,
                client_id: external_user_id
              });
              if(r?.ok){ vibOk(); btn.textContent = '✅'; btn.disabled = true; }
              else { vibBad(); btn.textContent = 'Ошибка'; }
            } catch(er){ vibBad(); btn.textContent = 'Ошибка'; }
          });
          list.appendChild(card);
        });
      } catch(e){ loading.textContent = 'Ошибка загрузки'; }
    }

    // Обработка переключения на таб тренера/биржи
    document.addEventListener('tabChanged', e => {
      if(e.detail === 'trainer') loadTrainerClients();
      if(e.detail === 'findTrainer') loadTrainersList();
    });

  // Paywall кнопки
  document.getElementById('btnPaywallTrainer').addEventListener('click', () => setActiveTab('profile'));
  document.getElementById('btnPaywallFindTrainer').addEventListener('click', () => setActiveTab('profile'));

  // ============================================================
  // END TRAINER MODE
  // ============================================================

  (async function init(){
    state.tz = "Europe/Moscow";
    const today = formatInTZ(new Date(), state.tz);
    state.dateA = today;
    state.dateD = today;

    showLoading(true, "Загрузка…");
    try{
      state.profile = await loadProfile();
      setProfileUI(state.profile);
      fillProfileForm(state.profile);
      enableTabs();

      if (state.profile){
        // Показываем онбординг если пользователь ещё не выбрал роль
        if(!localStorage.getItem('onboarding_done')){
          document.getElementById('onboardingRole').classList.add('show');
        } else {
          window.initTrainerMode && window.initTrainerMode();
        }
        setActiveTab("analytics");
        await refreshAll();
      } else {
        setActiveTab("profile");
      }
    }catch(e){
      el("idWarn").classList.remove("hide");
      el("idWarn").textContent = "Ошибка загрузки: " + String(e.message || e);
    }finally{
      showLoading(false);
    }
  })();

  // ---- BG CHANGER ---- top-level, no IIFE
  const DEFAULT_BG = "linear-gradient(180deg,rgba(0,0,0,.62) 0%,rgba(0,0,0,.72) 100%),url('https://files.salebot.pro/uploads/file_item/file/270434/%D0%B7%D0%B0%D0%B3%D1%80%D1%83%D0%B6%D0%B5%D0%BD%D0%BE__1_.jpg') center center/cover no-repeat fixed";
  let bgMode = "file";

    function applyBg(url, dark){
      const a = (dark * 0.95 / 100).toFixed(2);
      const b = (dark / 100).toFixed(2);
      document.body.style.background = url
        ? "linear-gradient(180deg,rgba(0,0,0,"+a+") 0%,rgba(0,0,0,"+b+") 100%),url('"+url+"') center center/cover no-repeat fixed"
        : DEFAULT_BG;
    }

    function showPreview(url){
      if(!url){ el("bgPreviewImg").classList.remove("show"); el("bgPreviewEmpty").classList.remove("hide"); return; }
      const img = el("bgPreviewImg");
      img.src = url;
      img.onload = ()=>{ img.classList.add("show"); el("bgPreviewEmpty").classList.add("hide"); };
      img.onerror = ()=>{ img.classList.remove("show"); el("bgPreviewEmpty").classList.remove("hide"); el("bgPreviewEmpty").textContent="⚠️ Не удалось загрузить"; };
    }

    // Только галерея

    el("btnPickFile").addEventListener("click",()=>el("bgFileInput").click());

    el("bgFileInput").addEventListener("change",()=>{
      const file = el("bgFileInput").files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = e=>{ el("bgFileInput")._data = e.target.result; showPreview(e.target.result); el("bgHint").textContent="Фото выбрано. Нажми «Применить»."; };
      reader.readAsDataURL(file);
    });

    let urlTimer;
    el("bgUrlInput").addEventListener("input",()=>{
      clearTimeout(urlTimer);
      urlTimer = setTimeout(()=>showPreview(el("bgUrlInput").value.trim()), 600);
    });

    el("bgDarkSlider").addEventListener("input",()=>{
      el("bgDarkVal").textContent = el("bgDarkSlider").value+"%";
      const url = el("bgFileInput")._data||"";
      if(url) applyBg(url, Number(el("bgDarkSlider").value));
    });

    el("btnApplyBg").addEventListener("click",()=>{
      vib();
      const dark = Number(el("bgDarkSlider").value);
      const url = el("bgFileInput")._data||"";
      if(!url){ el("bgHint").textContent = "Сначала выбери фото из галереи."; return; }
      applyBg(url, dark);
      try{ localStorage.setItem("lf_bg", JSON.stringify({url, dark})); el("bgHint").textContent="✅ Фон применён и сохранён."; }
      catch(e){ el("bgHint").textContent="✅ Фон применён (файл большой, не сохранён)."; }
    });

    el("btnResetBg").addEventListener("click",()=>{
      vib();
      el("bgDarkSlider").value=65; el("bgDarkVal").textContent="65%";
      el("bgPreviewImg").classList.remove("show"); el("bgPreviewEmpty").classList.remove("hide");
      el("bgPreviewEmpty").textContent="🖼 Превью появится здесь";
      if(el("bgFileInput")._data) el("bgFileInput")._data=null;
      document.body.style.background = DEFAULT_BG;
      try{ localStorage.removeItem("lf_bg"); }catch(e){}
      el("bgHint").textContent="↺ Возвращён фон по умолчанию.";
    });



    // ════ ФИТНЕС-БРАСЛЕТЫ ════
  // ════ ФИТНЕС-БРАСЛЕТЫ ════ top-level
  {
    const notConnected   = document.getElementById('fitnessNotConnected');
    const connectedBlock = document.getElementById('fitnessConnectedBlock');
    const manualForm     = document.getElementById('fitnessManualForm');
    const connectedLabel = document.getElementById('fitnessConnectedLabel');
      const lastSyncEl     = document.getElementById('fitnessLastSync');
      const instrBlock     = document.getElementById('fitnessInstructions');
      const instrText      = document.getElementById('fitnessInstructionsText');
      if(!notConnected) return;

      const INSTRUCTIONS = {
        garmin: `<b>Как подключить Garmin:</b><br>
1. Открой бота в Telegram<br>
2. Отправь команду:<br>
<code style="background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px;font-size:12px;">/connect_garmin ТВОЙmail@mail.ru ТВОЙпароль</code><br>
3. Бот подтвердит подключение и будет ежедневно обновлять данные здесь.<br><br>
<span style="color:rgba(255,200,0,.8);font-size:11px;">⚠️ Используй email и пароль от Garmin Connect</span>`,

        fitbit: `<b>Как подключить Fitbit:</b><br>
1. Открой бота в Telegram<br>
2. Отправь команду:<br>
<code style="background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px;font-size:12px;">/connect_fitbit</code><br>
3. Бот пришлёт ссылку для авторизации — нажми и разреши доступ.<br>
4. После авторизации данные будут обновляться каждый день автоматически.`,

        miband: `<b>Как подключить Mi Band:</b><br>
1. Открой бота в Telegram<br>
2. Отправь команду:<br>
<code style="background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px;font-size:12px;">/connect_miband ТВОЙmail@mail.ru ТВОЙпароль</code><br>
3. Используй email и пароль от аккаунта Mi Fitness (Xiaomi)<br>
4. Бот подтвердит подключение.`,
      };

      // Загружаем статус подключения с сервера
      async function loadFitnessStatus(){
        if(!external_user_id) { notConnected.style.display='block'; return; }
        try{
          const r = await postForm('https://n8n.other-digital.ru/webhook/fitness_status', {external_user_id});
          if(r?.connected){
            showConnected(r);
          } else {
            notConnected.style.display='block';
          }
        } catch(e){
          // Fallback на localStorage
          const saved = JSON.parse(localStorage.getItem('lf_fitness')||'null');
          if(saved?.connected) showConnected(saved);
          else notConnected.style.display='block';
        }
      }

      function showConnected(data){
        notConnected.style.display='none';
        connectedBlock.style.display='block';
        const platformNames = {garmin:'Garmin Connect', fitbit:'Fitbit', miband:'Mi Band', manual:'Ручной ввод'};
        if(connectedLabel) connectedLabel.innerHTML = `✅ ${platformNames[data.platform]||data.platform||'Браслет'} подключён`;
        if(document.getElementById('fSteps'))  document.getElementById('fSteps').textContent  = data.steps  || '—';
        if(document.getElementById('fPulse'))  document.getElementById('fPulse').textContent  = data.pulse  || '—';
        if(document.getElementById('fCal'))    document.getElementById('fCal').textContent    = data.cal_burned || '—';
        if(document.getElementById('fSleep'))  document.getElementById('fSleep').textContent  = data.sleep  || '—';
        if(lastSyncEl && data.synced_at) lastSyncEl.textContent = '🔄 Обновлено: ' + data.synced_at;
        localStorage.setItem('lf_fitness', JSON.stringify({...data, connected:true}));
      }

      // Кнопки платформ
      document.getElementById('btnConnectGarmin').addEventListener('click', function(){
        vib&&vib();
        instrText.innerHTML = INSTRUCTIONS.garmin;
        instrBlock.style.display='block';
        this.style.borderColor='rgba(16,185,129,.6)';
      });
      document.getElementById('btnConnectFitbit').addEventListener('click', function(){
        vib&&vib();
        instrText.innerHTML = INSTRUCTIONS.fitbit;
        instrBlock.style.display='block';
        this.style.borderColor='rgba(16,185,129,.6)';
      });
      document.getElementById('btnConnectMiBand').addEventListener('click', function(){
        vib&&vib();
        instrText.innerHTML = INSTRUCTIONS.miband;
        instrBlock.style.display='block';
        this.style.borderColor='rgba(16,185,129,.6)';
      });
      document.getElementById('btnConnectManual').addEventListener('click', function(){
        vib&&vib();
        instrBlock.style.display='none';
        manualForm.style.display = manualForm.style.display==='none' ? 'block' : 'none';
      });

      // Отключить
      const btnDisconnect = document.getElementById('btnDisconnectFitness');
      if(btnDisconnect) btnDisconnect.addEventListener('click', async function(){
        vib&&vib();
        if(!confirm('Отключить браслет?')) return;
        localStorage.removeItem('lf_fitness');
        try{ await postForm('https://n8n.other-digital.ru/webhook/fitness_disconnect', {external_user_id}); }catch(e){}
        connectedBlock.style.display='none';
        notConnected.style.display='block';
        instrBlock.style.display='none';
      });

      // Ручной ввод
      const btnSave = document.getElementById('btnSaveFitness');
      if(btnSave) btnSave.addEventListener('click', async function(){
        vib&&vib();
        const steps     = parseInt(document.getElementById('fitnessSteps').value)||0;
        const pulse     = parseInt(document.getElementById('fitnessPulse').value)||0;
        const cal_burned= parseInt(document.getElementById('fitnessCalBurned').value)||0;
        const sleep     = parseFloat(document.getElementById('fitnessSleep').value)||0;
        const date      = new Date().toISOString().slice(0,10);
        const data      = {steps, pulse, cal_burned, sleep, platform:'manual', connected:true, synced_at: date};
        showConnected(data);
        manualForm.style.display='none';
        const hint = document.getElementById('fitnessHint');
        if(hint){ hint.textContent='✅ Сохранено!'; setTimeout(()=>hint.textContent='',2500); }
        if(external_user_id){
          try{ await postForm('https://n8n.other-digital.ru/webhook/fitness_log', {external_user_id, ...data}); }catch(e){}
        }
      });

    loadFitnessStatus();
  }

  // Load saved bg on start
    try{
      const saved = localStorage.getItem("lf_bg");
      if(saved){
        const {url, dark} = JSON.parse(saved);
        if(url){
          applyBg(url, dark??65);
          el("bgDarkSlider").value = dark??65;
          el("bgDarkVal").textContent = (dark??65)+"%";
          if(url.startsWith("data:")){
            el("bgFileInput")._data = url;
          }
          showPreview(url);
        }
      }
  }catch(e){}
  // ---- END BG CHANGER ----
  // (weight, water, habits moved earlier in script — before IIFEs)

  // ======== NUTRITIONIST CHAT ======== top-level, no IIFE
  {
  var CHAT_KEY = 'nutri_chat_v1';
    var pollingTimer = null;
    var lastTs = 0;

    function loadCache(){
      try{ return JSON.parse(localStorage.getItem(CHAT_KEY)||'[]'); }catch{ return []; }
    }
    function saveCache(msgs){
      try{ localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-200))); }catch{}
    }

    function fmtTime(ts){
      var d = new Date(ts);
      return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    }
    function fmtDate(ts){
      return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'Europe/Moscow'}).format(new Date(ts));
    }
    function esc(s){
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    }

    function renderChat(msgs){
      var box = document.getElementById('chatMessages');
      var empty = document.getElementById('chatEmpty');
      if(!box) return;
      if(!msgs.length){
        if(empty) empty.style.display='block';
        Array.from(box.children).forEach(function(c){ if(c!==empty) c.remove(); });
        return;
      }
      if(empty) empty.style.display='none';
      box.innerHTML='';
      var lastDate='';
      msgs.forEach(function(msg){
        var ts = msg.ts || Date.now();
        var ds = fmtDate(ts);
        if(ds !== lastDate){
          lastDate = ds;
          var pill = document.createElement('div');
          pill.className='chatContextPill';
          pill.textContent=ds;
          box.appendChild(pill);
        }
        var wrap = document.createElement('div');
        wrap.className='chatMsg '+(msg.role==='user'?'me':'them');
        wrap.innerHTML='<div class="chatBubble">'+esc(msg.text)+'</div><div class="chatTime">'+fmtTime(ts)+'</div>';
        box.appendChild(wrap);
      });
      box.scrollTop = box.scrollHeight;
    }

    function buildContext(){
      var p = state.profile;
      if(!p) return '';
      var lines = [
        'Профиль: пол='+p.sex+', возраст='+p.age+', рост='+p.height_cm+'см, вес='+p.weight_kg+'кг',
        'Цель: '+p.goal+', целевой вес='+p.target_weight+'кг',
        'Норма: '+p.target_calories+'ккал, Б'+p.target_protein_g+'г Ж'+p.target_fat_g+'г У'+p.target_carbs_g+'г'
      ];
      var d = state.lastDailyData;
      if(d) lines.push('Съедено: '+d.consumed_calories+'ккал Б'+d.consumed_protein_g+'г Ж'+d.consumed_fat_g+'г У'+d.consumed_carbs_g+'г');
      return lines.join('\n');
    }

    // Отправка — fire-and-forget, не ждём ответа n8n
    function doSend(text){
      var ts = Date.now();

      // 1. Сразу показываем сообщение в чате
      var msgs = loadCache();
      msgs.push({ role:'user', text:text, ts:ts });
      saveCache(msgs);
      lastTs = Math.max(lastTs, ts);
      renderChat(msgs);
      try{ vib(); }catch{}

      // 2. Шлём вебхук fire-and-forget (не awaiting, не блокируем UI)
      var body = new URLSearchParams({
        token: CONFIG.n8n.token,
        external_user_id: external_user_id,
        text: text,
        context: buildContext(),
        ts: String(ts)
      });
      fetch(CONFIG.n8n.chat_send, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'x-webhook-token': CONFIG.n8n.token
        },
        body: body
      }).catch(function(e){ console.warn('chat send failed:', e); });

      // 3. Через 5с подтягиваем историю (вдруг уже ответили)
      setTimeout(doPoll, 5000);
    }

    function doPoll(){
      if(!external_user_id) return;
      var body = new URLSearchParams({
        token: CONFIG.n8n.token,
        external_user_id: external_user_id,
        since: String(lastTs)
      });
      fetch(CONFIG.n8n.chat_history, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'x-webhook-token': CONFIG.n8n.token
        },
        body: body
      }).then(function(r){ return r.json(); }).then(function(r){
        if(!r || !r.ok || !Array.isArray(r.messages) || !r.messages.length) return;
        var cached = loadCache();
        var hasNew = false;
        r.messages.forEach(function(m){
          var ts = Number(m.ts||0);
          if(ts > lastTs){
            lastTs = ts;
            if(!cached.find(function(c){ return c.ts===ts && c.role===m.role; })){
              cached.push({ role: m.role||'nutritionist', text: m.text||'', ts:ts });
              hasNew = true;
            }
          }
        });
        if(hasNew){
          cached.sort(function(a,b){ return a.ts-b.ts; });
          saveCache(cached);
          renderChat(cached);
          var isActive = btnEls.nutri && btnEls.nutri.classList.contains('active');
          if(!isActive){
            var badge = document.getElementById('chatNewBadge');
            if(badge) badge.style.display='block';
          }
        }
      }).catch(function(){});
    }

    function startPolling(){
      stopPolling();
      doPoll();
      pollingTimer = setInterval(doPoll, 20000);
    }
    function stopPolling(){
      if(pollingTimer){ clearInterval(pollingTimer); pollingTimer=null; }
    }

    function initChat(){
      var badge = document.getElementById('chatNewBadge');
      if(badge) badge.style.display='none';
      var msgs = loadCache();
      if(msgs.length) lastTs = Math.max.apply(null, msgs.map(function(m){ return Number(m.ts)||0; }));
      renderChat(msgs);
      startPolling();
    }

    // ── Кнопка и textarea ─────────────────────────────────────
    var inp = document.getElementById('chatInput');
    var btn = document.getElementById('chatSendBtn');

    function handleSend(){
      if(!inp) return;
      var text = inp.value.trim();
      if(!text) return;
      inp.value = '';
      inp.style.height = '';
      doSend(text);
    }

    if(inp){
      inp.addEventListener('input', function(){
        this.style.height='auto';
        this.style.height = Math.min(this.scrollHeight,120)+'px';
      });
      inp.addEventListener('keydown', function(e){
        if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleSend(); }
      });
    }
    if(btn){
      btn.addEventListener('click', function(e){ e.preventDefault(); handleSend(); });
      btn.addEventListener('touchend', function(e){ e.preventDefault(); e.stopPropagation(); handleSend(); });
    }
    window._chatSend = handleSend;

    // ── Переключение вкладки ──────────────────────────────────
    document.addEventListener('tabChanged', function(e){
      if(e.detail==='nutri') setTimeout(initChat, 80);
      else stopPolling();
    });
    var nutrBtn = document.getElementById('tabBtnNutri');
    if(nutrBtn) nutrBtn.addEventListener('click', function(){ setTimeout(initChat, 120); });
    document.querySelectorAll('.tabbtn').forEach(function(b){
      if(b.id!=='tabBtnNutri') b.addEventListener('click', stopPolling);
    });

  }
  // ======== END NUTRITIONIST CHAT ========

  // ======== SWIPE NAV ======== top-level, no IIFE
  {
  const inner = document.getElementById('tabsInner');
    const track = document.getElementById('tabsTrack');
    if(!inner || !track) return;

    // Прокрутить к активной кнопке
    function scrollToActive(){
      var btn = track.querySelector('.tabbtn.active');
      if(!btn) return;
      var left = btn.offsetLeft - inner.offsetWidth / 2 + btn.offsetWidth / 2;
      inner.scrollLeft = Math.max(0, left);
    }
    window._navScrollUpdate = scrollToActive;

    // При смене таба — прокрутить
    var _orig = window.setActiveTab;
    window.setActiveTab = function(tab){
      _orig && _orig(tab);
      setTimeout(scrollToActive, 60);
    };

    setTimeout(scrollToActive, 200);

    // Свайп по контенту — смена таба
    var TAB_ORDER = ['analytics','diary','profile','habits','workouts','recipes','nutri','trainer','findTrainer','settings'];

    function getVisibleTabs(){
      return TAB_ORDER.filter(function(id){
        var key = id==='findTrainer'?'tabBtnFindTrainer':id==='workouts'?'tabBtnWorkouts'
                :'tabBtn'+id.charAt(0).toUpperCase()+id.slice(1);
        var b = document.getElementById(key);
        return b && !b.classList.contains('hide');
      });
    }
    function getCurrentTabId(){
      var a = track.querySelector('.tabbtn.active');
      if(!a) return null;
      if(a.dataset.tab) return a.dataset.tab;
      var id = a.id||'';
      if(id==='tabBtnFindTrainer') return 'findTrainer';
      if(id==='tabBtnWorkouts') return 'workouts';
      return id.replace('tabBtn','').charAt(0).toLowerCase()+id.replace('tabBtn','').slice(1);
    }

    var swX=0, swY=0, swOk=false;
    document.addEventListener('touchstart', function(e){
      if(e.target.closest('#tabsInner')) return;
      swX=e.touches[0].clientX; swY=e.touches[0].clientY; swOk=true;
    }, {passive:true});
    document.addEventListener('touchend', function(e){
      if(!swOk) return; swOk=false;
      var dx=e.changedTouches[0].clientX-swX;
      var dy=e.changedTouches[0].clientY-swY;
      if(Math.abs(dx)<55||Math.abs(dy)>Math.abs(dx)*0.65) return;
      var vis=getVisibleTabs(), cur=getCurrentTabId(), idx=vis.indexOf(cur);
      if(idx<0) return;
      if(dx<0&&idx<vis.length-1) setActiveTab(vis[idx+1]);
      else if(dx>0&&idx>0) setActiveTab(vis[idx-1]);
    });
  }
  // ======== END SWIPE NAV ========

  // FORCE INIT HABITS удалён — все кнопки используют onclick атрибуты

