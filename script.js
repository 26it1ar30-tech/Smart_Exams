// Smart Exams - simple browser storage project (no database)

const ADMIN_PASSWORD = "admin123";
const STORAGE_KEY = "smartExamsData";

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  students: [], subjects: [], results: [], timetable: []
};

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function findStudent(roll) {
  return data.students.find(student => student.rollNo.toLowerCase() === roll.toLowerCase());
}
function findSubject(code) {
  return data.subjects.find(subject => subject.code.toLowerCase() === code.toLowerCase());
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function showMessage(elementId, message, good = false) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.style.color = good ? "#27804d" : "#b43b3b";
}

document.getElementById("loginBtn").addEventListener("click", () => {
  const password = document.getElementById("adminPassword").value;
  if (password === ADMIN_PASSWORD) {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("adminArea").classList.remove("hidden");
    showMessage("loginMessage", "");
  } else {
    showMessage("loginMessage", "Wrong password. Please try again.");
  }
});
document.getElementById("adminPassword").addEventListener("keydown", event => {
  if (event.key === "Enter") document.getElementById("loginBtn").click();
});
document.getElementById("logoutBtn").addEventListener("click", () => {
  document.getElementById("adminArea").classList.add("hidden");
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("adminPassword").value = "";
});

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.add("hidden"));
    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.remove("hidden");
  });
});

document.getElementById("studentForm").addEventListener("submit", event => {
  event.preventDefault();
  const rollNo = document.getElementById("studentRoll").value.trim();
  const name = document.getElementById("studentName").value.trim();
  const branch = document.getElementById("studentBranch").value.trim();
  if (findStudent(rollNo)) return alert("This roll number already exists!");
  data.students.push({ rollNo, name, branch });
  saveData(); event.target.reset(); renderAll();
  alert("Student added successfully!");
});

document.getElementById("subjectForm").addEventListener("submit", event => {
  event.preventDefault();
  const code = document.getElementById("subjectCode").value.trim();
  const name = document.getElementById("subjectName").value.trim();
  if (findSubject(code)) return alert("This subject code already exists!");
  data.subjects.push({ code, name });
  saveData(); event.target.reset(); renderAll();
  alert("Subject added successfully!");
});

document.getElementById("marksForm").addEventListener("submit", event => {
  event.preventDefault();
  const rollNo = document.getElementById("marksRoll").value.trim();
  const code = document.getElementById("marksCode").value.trim();
  const marks = Number(document.getElementById("marksValue").value);
  if (!findStudent(rollNo)) return alert("Student not found. Add the student first.");
  if (!findSubject(code)) return alert("Subject not found. Add the subject first.");
  if (!Number.isFinite(marks) || marks < 0 || marks > 100) return alert("Enter marks between 0 and 100.");
  if (data.results.some(result => result.rollNo.toLowerCase() === rollNo.toLowerCase() && result.code.toLowerCase() === code.toLowerCase())) {
    return alert("Marks have already been entered for this student and subject.");
  }
  data.results.push({ rollNo, code, marks });
  saveData(); event.target.reset(); renderAll();
  alert("Marks saved successfully!");
});

document.getElementById("timetableForm").addEventListener("submit", event => {
  event.preventDefault();
  const code = document.getElementById("timeCode").value.trim();
  const subject = findSubject(code);
  if (!subject) return alert("Subject not found. Add the subject first.");
  if (data.timetable.some(item => item.code.toLowerCase() === code.toLowerCase())) return alert("Timetable already exists for this subject.");
  data.timetable.push({
    code, subject: subject.name,
    date: document.getElementById("examDate").value,
    time: document.getElementById("examTime").value,
    duration: document.getElementById("examDuration").value.trim(),
    room: document.getElementById("examRoom").value.trim()
  });
  saveData(); event.target.reset(); renderAll();
  alert("Timetable added successfully!");
});

document.getElementById("searchBtn").addEventListener("click", searchStudent);
document.getElementById("searchRoll").addEventListener("keydown", event => {
  if (event.key === "Enter") searchStudent();
});

function searchStudent() {
  const roll = document.getElementById("searchRoll").value.trim();
  const student = findStudent(roll);
  const output = document.getElementById("studentDetails");
  if (!roll) { output.innerHTML = '<p class="muted">Please enter a roll number.</p>'; return; }
  if (!student) { output.innerHTML = '<p class="message">Student not found.</p>'; return; }

  const results = data.results.filter(result => result.rollNo.toLowerCase() === roll.toLowerCase());
  let resultHTML = results.length ? results.map(result => {
    const subject = findSubject(result.code);
    return `<div class="item">${escapeHTML(subject ? subject.name : result.code)} (${escapeHTML(result.code)}) — <strong>${result.marks}/100</strong> — <span class="${result.marks >= 33 ? "status-pass" : "status-fail"}">${result.marks >= 33 ? "PASS" : "FAIL"}</span></div>`;
  }).join("") : '<p class="muted">No results available for this student yet.</p>';

  output.innerHTML = `<div class="result-box"><h3>${escapeHTML(student.name)}</h3><p><strong>Roll Number:</strong> ${escapeHTML(student.rollNo)}</p><p><strong>Branch:</strong> ${escapeHTML(student.branch)}</p><h3>Exam Results</h3>${resultHTML}</div>`;
}

function renderAll() {
  document.getElementById("studentList").innerHTML = data.students.length
    ? data.students.map(s => `<div class="item"><strong>${escapeHTML(s.name)}</strong><br>Roll: ${escapeHTML(s.rollNo)} | Branch: ${escapeHTML(s.branch)}</div>`).join("")
    : '<p class="muted">No students added yet.</p>';

  document.getElementById("subjectList").innerHTML = data.subjects.length
    ? data.subjects.map(s => `<div class="item"><strong>${escapeHTML(s.name)}</strong><br>Code: ${escapeHTML(s.code)}</div>`).join("")
    : '<p class="muted">No subjects added yet.</p>';

  document.getElementById("allResults").innerHTML = data.results.length
    ? data.results.map(r => {
      const student = findStudent(r.rollNo), subject = findSubject(r.code);
      return `<div class="item"><strong>${escapeHTML(student ? student.name : r.rollNo)}</strong><br>${escapeHTML(subject ? subject.name : r.code)} — ${r.marks}/100 — <span class="${r.marks >= 33 ? "status-pass" : "status-fail"}">${r.marks >= 33 ? "PASS" : "FAIL"}</span></div>`;
    }).join("")
    : '<p class="muted">No results entered yet.</p>';

  const timetableHTML = data.timetable.length
    ? data.timetable.map(t => `<div class="item"><strong>${escapeHTML(t.subject)}</strong><br>Code: ${escapeHTML(t.code)}<br>Date: ${formatDate(t.date)} | Time: ${escapeHTML(t.time)}<br>Duration: ${escapeHTML(t.duration)} | Room: ${escapeHTML(t.room)}</div>`).join("")
    : '<p class="muted">No timetable available.</p>';
  document.getElementById("adminTimetable").innerHTML = timetableHTML;
  document.getElementById("studentTimetable").innerHTML = timetableHTML;
}
function formatDate(date) {
  if (!date) return "";
  const parts = date.split("-");
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
renderAll();
