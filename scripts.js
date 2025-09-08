const groups = {
    groupA: ['וילנר', 'עומרי', 'אנדי' , "גירו", "סינגל"],
    groupB: ['אביאל', 'רזיאל', 'דרור' , "קראוס" , "רהב"],
    groupC: ['גד', 'שושו', 'סבתא' ,"פורר" , "אדיר" , "עמור" , "שיאון"],
};

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function calculateTotalMinutes(start, end) {
    let startMins = parseTime(start);
    let endMins = parseTime(end);
    
    if (endMins <= startMins) {
        endMins += 24 * 60; // Add 24 hours if end time is on next day
    }
    
    return endMins - startMins;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


let currentSchedule = []; // Add this at the top with your other variables

// Your existing functions remain the same until generateSchedule

function generateSchedule() {
const startTime = document.getElementById('startTime').value;
const endTime = document.getElementById('endTime').value;
const amount = parseInt(document.getElementById('amount').value);
const startOption = document.getElementById('start').checked;
const onlyUs = document.getElementById('alone').checked;
// Get selected groups
const selectedGroups = ['A', 'B', 'C']
.filter(group => document.getElementById(`group${group}`).checked)
.map(group => `group${group}`);

// Get available soldiers from selected groups
const availableSoldiers = selectedGroups.flatMap(groupName => 
groups[groupName].map(soldier => ({ name: soldier, group: groupName }))
);

const totalMinutes = calculateTotalMinutes(startTime, endTime);
console.log(totalMinutes);
const shiftMinutesPer = totalMinutes / amount;
const shiftCal = Math.ceil(shiftMinutesPer/5)
console.log(shiftCal * 5 , Math.ceil(10.1))
const shiftMinutes = shiftCal * 5;
const numberOfShifts = Math.ceil(totalMinutes / shiftMinutes);

// Shuffle soldiers for random assignment
const shuffledSoldiers = shuffleArray([...availableSoldiers]);

currentSchedule = []; // Reset current schedule
nameDict = {};
let currentMinutes = parseTime(startTime);
let numOfEmpty = amount - availableSoldiers.length;
let flag = startOption;

console.log(numberOfShifts , numOfEmpty)
for (let i = 0; i < numberOfShifts; i++) {
    const shiftEndMinutes = Math.min(currentMinutes + shiftMinutes, parseTime(startTime) + totalMinutes);
    const soldier = shuffledSoldiers[i % shuffledSoldiers.length];
    if (!flag && !onlyUs){
        currentSchedule.push({
        shift: `${formatTime(shiftEndMinutes)} - ${formatTime(currentMinutes)}`,
        soldier: '-',});
        numOfEmpty--;
    }
    else if(flag){
        if(!onlyUs && soldier.name in nameDict){
        soldier.name = '-';
        }
        nameDict[soldier.name] = i;
        currentSchedule.push({
        shift: `${formatTime(shiftEndMinutes)} - ${formatTime(currentMinutes)}`,
        soldier: soldier.name,});
    }

    if (numOfEmpty == 0) {
        flag = true;
    }

    currentMinutes = shiftEndMinutes;
    }

    const shiftDiv = document.getElementById('perShift');
    shiftDiv.innerHTML = `<li>${shiftMinutes} minutes per shift</li>`;

    // Display schedule
    const scheduleDiv = document.getElementById('schedule');
    scheduleDiv.innerHTML = '<h2>Generated Schedule</h2>';

    currentSchedule.forEach(shift => {
    scheduleDiv.innerHTML += `
        <div class="shift">
            <div class="shift-header">
                <span>${shift.shift}</span>
            </div>
            <div>${shift.soldier}</div>
        </div>
    `;
    });

    // Show copy button
    document.getElementById('copyButton').style.display = 'inline-block';
}
nameDict = {}
function copySchedule() {
if (currentSchedule.length === 0) return;

// Format schedule as text
const scheduleText = currentSchedule.map(shift => 
`${shift.soldier} - ${shift.shift}`
).join('\n');

// Copy to clipboard
navigator.clipboard.writeText(scheduleText).then(() => {
// Show toast notification
const toast = document.getElementById('toast');
toast.style.display = 'block';

// Hide toast after 2 seconds
setTimeout(() => {
    toast.style.display = 'none';
}, 2000);
}).catch(err => {
console.error('Failed to copy:', err);
alert('Failed to copy schedule to clipboard');
});

}

// ===== Availability from Calendar CSV =====

// עוזר: פרסינג של CSV מינימלי (תומך בפסיקים, ללא גרשיים מקוננים)
function simpleCsvParse(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .map(line => line.split(','));
}

// עוזר: פרש תאריך תצוגה dd/mm/yyyy -> Date ללא זמן
function parseDDMMYYYY(str) {
  const m = String(str).match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/);
  if (!m) return null;
  const dd = +m[1], mm = +m[2], yyyy = +m[3];
  return new Date(yyyy, mm - 1, dd);
}

function normalizeDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

/**
 * מוציא זמינות מתוך CSV:
 * שורה 1 – תאריכים (B..)
 * עמודה A – שמות (A2..)
 * אם התא באותו התאריך ריק -> זמין; אחרת -> לא זמין (הטקסט = הערה/סיבה)
 */
function computeAvailabilityFromCsv(csvRows, targetDate) {
  if (!csvRows.length) return { available: [], unavailable: [] };

  const header = csvRows[0]; // שורה 1
  // מצא אינדקס של התאריך בעמודות הכותרת (מתחילים מ-B => index 1)
  let colIdx = -1;
  const target = normalizeDateOnly(targetDate);

  for (let c = 1; c < header.length; c++) {
    const asDate = parseDDMMYYYY(header[c]);
    if (asDate && sameDate(normalizeDateOnly(asDate), target)) {
      colIdx = c;
      break;
    }
  }
  if (colIdx === -1) {
    throw new Error('לא נמצאה עמודת תאריך בכותרת עבור ' + targetDate.toLocaleDateString('he-IL'));
  }

  const available = [];
  const unavailable = [];

  // החל משורה 2 – שמות וערכי תא
  for (let r = 1; r < csvRows.length; r++) {
    const row = csvRows[r];
    const name = (row[0] || '').trim();
    if (!name) continue;

    const cell = (row[colIdx] || '').trim();
    if (cell === '') {
      available.push(name);
    } else {
      unavailable.push({ name, note: cell });
    }
  }

  return { available, unavailable };
}

/**
 * טען CSV מה־URL וחשב זמינות לתאריך מהשדה #availDate
 * פורמט תאריך נדרש: dd/mm/yyyy (כמו בשורת הכותרת בגיליון)
 */
async function loadAvailability() {
  const csvUrl = document.getElementById('csvUrl').value.trim();
  const dateStr = document.getElementById('availDate').value.trim();
  if (!csvUrl) {
    alert('נא להזין קישור CSV של הגיליון (דרך "פרסום לאינטרנט")');
    return;
  }
  if (!dateStr) {
    alert('נא להזין תאריך בפורמט dd/mm/yyyy (לדוגמה 08/09/2025)');
    return;
  }
  const d = parseDDMMYYYY(dateStr);
  if (!d) {
    alert('פורמט תאריך לא תקין. דוגמה: 08/09/2025');
    return;
  }

  try {
    const res = await fetch(csvUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const rows = simpleCsvParse(text);

    const { available, unavailable } = computeAvailabilityFromCsv(rows, d);
    renderAvailability(available, unavailable);
  } catch (err) {
    console.error(err);
    alert('כשל בטעינת ה־CSV או בעיבוד הנתונים: ' + err.message);
  }
}

function renderAvailability(available, unavailable) {
  const aUl = document.getElementById('availableList');
  const uUl = document.getElementById('unavailableList');
  aUl.innerHTML = '';
  uUl.innerHTML = '';

  if (!available.length) {
    aUl.innerHTML = '<li>—</li>';
  } else {
    for (const n of available) {
      const li = document.createElement('li');
      li.textContent = n;
      aUl.appendChild(li);
    }
  }

  if (!unavailable.length) {
    uUl.innerHTML = '<li>—</li>';
  } else {
    for (const u of unavailable) {
      const li = document.createElement('li');
      li.textContent = u.name + (u.note ? ' — ' + u.note : '');
      uUl.appendChild(li);
    }
  }
}
