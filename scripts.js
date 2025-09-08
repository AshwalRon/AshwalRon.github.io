/********************************************************************
 * זמינות צוות – טעינה מהגיליון שלך + סינון לפי groups
 * ללא שדות קלט. התאריך = היום. הקישור קבוע לפי ה-sheet id.
 *
 * דרישות שיתוף בגיליון:
 * 1) שם הלשונית: Calander (עדכן SHEET_TAB אם שונה).
 * 2) שורת כותרת (שורה 1) מכילה תאריכים בפורמט dd/mm/yy או dd/mm/yyyy
 *    לדוגמה: 8/9/25 או 08/09/2025.
 * 3) עמודה A מכילה שמות (A2..).
 * 4) ריק = זמין; כל טקסט = לא זמין (הטקסט יוצג כהערה).
 * 5) שיתוף "Anyone with the link – Viewer" כדי ש-fetch יעבוד.
 *******************************************************************/

/** מזהי הגיליון */
const SHEET_ID  = '1NnKw1bWpokAA8Qq-0D9r_Sp1o9jcF-EwQhi8sJvIHJw';
const SHEET_TAB = 'Calander'; // אם שונה אצלך, עדכן כאן

/** בניית כתובת CSV דרך gviz */
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;

/** הגדרת הקבוצות -> רשימת חיילים (ערוך לפי הצורך) */
const GROUPS = {
  "Core":   ["יואב", "אריאל", "אדיר", "שיר", "אור"],
  "Ops":    ["נועם", "עידו", "שקד"],
  "QA":     ["רון", "ליאור"],
  // הוסף/הסר קבוצות וחיילים כפי שמתאים לך
};

/** מצב גלובלי */
const state = {
  today: normalizeDateOnly(new Date()),
  availabilityLoaded: false,
  availableSet: new Set(),            // שמות זמינים מהגיליון
  unavailableMap: new Map(),          // שם -> הערה
  selectedGroups: new Set(Object.keys(GROUPS)), // כברירת מחדל: כל הקבוצות מסומנות
};

/** DOM refs */
const el = {};
document.addEventListener('DOMContentLoaded', () => {
  el.todayLabel      = document.getElementById('todayLabel');
  el.groupsContainer = document.getElementById('groupsContainer');
  el.refreshBtn      = document.getElementById('refreshBtn');
  el.rosterList      = document.getElementById('rosterList');
  el.availableList   = document.getElementById('availableList');
  el.unavailableList = document.getElementById('unavailableList');
  el.statusBox       = document.getElementById('statusBox');

  // הצג היום
  el.todayLabel.textContent = formatDateIL(state.today);

  // רנדר קבוצות (צ'קבוקסים)
  renderGroups();

  // האזנה לרענון כפוי
  el.refreshBtn.addEventListener('click', () => {
    loadAvailabilityForToday(true);
  });

  // טען זמינות (כולל רענון ראשוני של המסכים)
  loadAvailabilityForToday(false);
});

/* ---------- רנדר קבוצות ---------- */
function renderGroups(){
  el.groupsContainer.innerHTML = '';
  Object.keys(GROUPS).forEach(groupName => {
    const id = 'g_' + groupName;
    const wrap = document.createElement('label');
    wrap.className = 'chip';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.checked = state.selectedGroups.has(groupName);
    cb.addEventListener('change', () => {
      if (cb.checked) state.selectedGroups.add(groupName);
      else state.selectedGroups.delete(groupName);
      renderAll();
    });
    const span = document.createElement('span');
    span.textContent = groupName;

    wrap.appendChild(cb);
    wrap.appendChild(span);
    el.groupsContainer.appendChild(wrap);
  });
}

/* ---------- רנדר כללי לפי מצב נוכחי ---------- */
function renderAll(){
  const roster = getRosterFromSelectedGroups();
  renderRoster(roster);

  if (!state.availabilityLoaded){
    setStatus('ממתין לזמינות מהגיליון...');
    return;
  }

  const {availableNames, unavailableList} = intersectRosterWithAvailability(roster);
  renderAvailabilityLists(availableNames, unavailableList);
  setStatus('הכל מעודכן.');
}

/* איחוד חיילים מכל הקבוצות הנבחרות (ללא כפילויות) */
function getRosterFromSelectedGroups(){
  const names = [];
  for (const g of state.selectedGroups){
    const arr = GROUPS[g] || [];
    names.push(...arr);
  }
  // ייחוד + ניקוי ריקים
  return Array.from(new Set(names.map(s => (s||'').trim()).filter(Boolean)));
}

/* הצגת הרשימה הגולמית מהקבוצות */
function renderRoster(roster){
  el.rosterList.innerHTML = '';
  if (!roster.length){
    el.rosterList.innerHTML = `<li class="note">לא נבחרו קבוצות.</li>`;
    return;
  }
  for (const name of roster){
    const li = document.createElement('li');
    li.textContent = name;
    el.rosterList.appendChild(li);
  }
}

/* חיתוך רשימת הקבוצות מול זמינות היום */
function intersectRosterWithAvailability(roster){
  const availableNames = [];
  const unavailableList = [];
  for (const name of roster){
    if (state.availableSet.has(name)) {
      availableNames.push(name);
    } else if (state.unavailableMap.has(name)) {
      unavailableList.push({ name, note: state.unavailableMap.get(name) });
    } else {
      // אם לא מופיע לא בזמינים ולא בלא-זמינים — משמע שלא נמצא בגיליון: נציג כאזהרה "לא נמצא בגיליון"
      unavailableList.push({ name, note: 'לא נמצא בגיליון' });
    }
  }
  return { availableNames, unavailableList };
}

/* הצגת זמינים/לא-זמינים */
function renderAvailabilityLists(availableNames, unavailableList){
  el.availableList.innerHTML = '';
  el.unavailableList.innerHTML = '';

  if (!availableNames.length){
    el.availableList.innerHTML = `<li class="note">—</li>`;
  } else {
    for (const n of availableNames){
      const li = document.createElement('li');
      li.textContent = n;
      el.availableList.appendChild(li);
    }
  }

  if (!unavailableList.length){
    el.unavailableList.innerHTML = `<li class="note">—</li>`;
  } else {
    for (const u of unavailableList){
      const li = document.createElement('li');
      li.textContent = u.name + (u.note ? ' — ' + u.note : '');
      el.unavailableList.appendChild(li);
    }
  }
}

/* ---------- טעינת זמינות מה-CSV של הגיליון ---------- */
async function loadAvailabilityForToday(forceLog){
  setStatus('טוען זמינות מהגיליון...');
  try{
    const res = await fetch(CSV_URL, { cache:'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const rows = parseCSV(text);

    const { availableSet, unavailableMap } = computeAvailabilityFromCsv(rows, state.today);
    state.availableSet = availableSet;
    state.unavailableMap = unavailableMap;
    state.availabilityLoaded = true;

    if (forceLog) {
      setStatus(`נטענו נתוני זמינות (${availableSet.size} זמינים, ${unavailableMap.size} לא-זמינים/לא נמצאו).`);
    } else {
      setStatus('זמינות נטענה בהצלחה.');
    }
  } catch (err){
    console.error(err);
    setStatus('שגיאת טעינה: ' + err.message + '\nודא שהגיליון משותף לצפייה וששם הלשונית נכון (Calander).');
    state.availabilityLoaded = false; // כדי שנדע שלא ניתן להצליב כרגע
  }
  renderAll();
}

/* ---------- CSV parser מינימלי עם תמיכה במירכאות ---------- */
function parseCSV(text){
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i=0; i<text.length; i++){
    const ch = text[i];

    if (inQuotes){
      if (ch === '"'){
        // בדוק אם זה "" (escaped quote)
        if (i+1 < text.length && text[i+1] === '"'){
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"'){
        inQuotes = true;
      } else if (ch === ','){
        row.push(field);
        field = '';
      } else if (ch === '\r'){
        // דלג
      } else if (ch === '\n'){
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  // סיום קובץ – הוסף את השדה/שורה האחרונה
  if (field.length > 0 || inQuotes || row.length > 0){
    row.push(field);
    rows.push(row);
  }

  // ניקוי שורות ריקות בקצה
  return rows.filter(r => r.some(c => String(c).trim().length > 0));
}

/* ---------- לוגיקת פרשנות זמינות מתוך ה-CSV ---------- */
function computeAvailabilityFromCsv(csvRows, targetDate){
  if (!csvRows.length) return { availableSet:new Set(), unavailableMap:new Map() };

  const header = csvRows[0]; // שורת הכותרת – תאריכים בעמודות B.. (עמודה A = שמות)
  const target = normalizeDateOnly(targetDate);

  // מצא אינדקס עמודת התאריך
  const colIdx = findDateColumnIndex(header, target);
  if (colIdx === -1){
    throw new Error(`לא נמצאה עמודת תאריך מתאימה לכותרת (${formatDateIL(target)}).`);
  }

  const availableSet = new Set();
  const unavailableMap = new Map();

  for (let r = 1; r < csvRows.length; r++){
    const row = csvRows[r];
    const name = (row[0] || '').trim();
    if (!name) continue;

    // הערך באותה עמודה (אותו תאריך)
    const cell = (row[colIdx] || '').trim();
    if (cell === ''){
      availableSet.add(name);
    } else {
      unavailableMap.set(name, cell);
    }
  }
  return { availableSet, unavailableMap };
}

/* נסיון התאמה גמיש לכותרת תאריך: תומך dd/mm/yy, dd/mm/yyyy, גם נקודות/מקף */
function findDateColumnIndex(headerRow, targetDate){
  for (let c = 1; c < headerRow.length; c++){
    const str = String(headerRow[c]).trim();
    const d = parseDateFlexible(str);
    if (d && sameDate(normalizeDateOnly(d), targetDate)) {
      return c;
    }
  }
  return -1;
}

function parseDateFlexible(s){
  // תומך: 8/9/25 | 08/09/2025 | 8.9.25 | 8-9-2025
  const m = String(s).match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2}|\d{4})$/);
  if (!m) return null;
  let dd = +m[1], mm = +m[2], yy = +m[3];
  if (yy < 100) yy += 2000; // "25" => 2025
  return new Date(yy, mm - 1, dd);
}

/* ---------- עזרים ---------- */
function normalizeDateOnly(d){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDate(a,b){
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}
function formatDateIL(d){
  // דיוק ל-IL: dd.mm.yyyy
  const pad = n => n.toString().padStart(2,'0');
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;
}
function setStatus(msg){
  if (!el.statusBox) return;
  el.statusBox.textContent = msg;
}
