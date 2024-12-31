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
let numOfEmpty = numberOfShifts - availableSoldiers.length;
let flag = startOption;

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