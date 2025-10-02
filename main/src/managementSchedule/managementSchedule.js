let currentYear, currentMonth, currentUser;

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  loadUsers();
  renderCalendar?.();
  setupStoragePanel();
});

// ======================
// ストレージパネル
// ======================
function setupStoragePanel() {
  const panel = document.getElementById("storage-panel");
  const toggle = document.getElementById("storage-toggle");
  if(!toggle) return;

  toggle.addEventListener("click", ()=>{
    panel.classList.toggle("expanded");
    panel.classList.toggle("minimized");
    refreshStorage();
  });
}

function refreshStorage() {
  const textarea = document.getElementById("storage-data");
  if(textarea){
    textarea.value = JSON.stringify(localStorage, null, 2);
  }
}

function clearStorage() {
  localStorage.clear();
  refreshStorage();
  loadUsers();
  renderCalendar?.();
}

// ======================
// ユーザー管理
// ======================
function addUser(event) {
  event.preventDefault();
  const username = document.getElementById("username")?.value;
  const department = document.getElementById("department")?.value;
  const users = JSON.parse(localStorage.getItem("users")||"[]");

  if(users.length>=10){ alert("最大10人までです。"); return; }

  users.push({id:Date.now(), name:username, department});
  localStorage.setItem("users", JSON.stringify(users));

  if(document.getElementById("username")) document.getElementById("username").value="";
  if(document.getElementById("department")) document.getElementById("department").value="";

  loadUsers();
  refreshStorage();
}

function loadUsers(){
  const users = JSON.parse(localStorage.getItem("users")||"[]");

  // プルダウン
  const dropdown = document.getElementById("user-dropdown");
  if(dropdown){
    dropdown.innerHTML="";
    users.forEach(u=>{
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = `${u.name} (${u.department})`;
      dropdown.appendChild(opt);
    });
    if(!currentUser && users.length>0) currentUser = users[0].id;
    dropdown.value = currentUser;
  }

  // 一覧
  const list = document.getElementById("user-list");
  if(list){
    list.innerHTML="";
    users.forEach(u=>{
      const li = document.createElement("li");
      li.textContent = `${u.name} (${u.department})`;

      const delBtn = document.createElement("button");
      delBtn.textContent="削除";
      delBtn.onclick=()=>{
        if(!confirm(`本当に${u.name}を削除しますか？`)) return;
        const filtered = users.filter(x=>x.id!==u.id);
        localStorage.setItem("users", JSON.stringify(filtered));
        if(currentUser===u.id) currentUser=filtered.length>0?filtered[0].id:null;
        loadUsers();
        renderCalendar?.();
        refreshStorage();
      };
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  }
}

function changeUser(userId){
  currentUser = userId;
  renderCalendar?.();
}

function toggleUserList(){
  const panel = document.getElementById("user-list-panel");
  panel.style.display = panel.style.display==="none"?"block":"none";
}

// ======================
// カレンダー操作
// ======================
function prevMonth(){ 
  currentMonth--; 
  if(currentMonth<0){ currentMonth=11; currentYear--; }
  renderCalendar();
}

function nextMonth(){ 
  currentMonth++; 
  if(currentMonth>11){ currentMonth=0; currentYear++; }
  renderCalendar();
}

function renderCalendar(){
  if(!currentUser) return;

  const table = document.getElementById("calendar");
  const title = document.getElementById("calendar-title");
  title.textContent=`${currentYear}/${String(currentMonth+1).padStart(2,"0")}`;

  table.innerHTML="";

  const days = ["日","月","火","水","木","金","土"];
  let headerRow="<tr>"+days.map(d=>`<th>${d}</th>`).join("")+"</tr>";
  table.innerHTML=headerRow;

  const firstDay = new Date(currentYear,currentMonth,1).getDay();
  const lastDate = new Date(currentYear,currentMonth+1,0).getDate();

  const scheduleKey=`schedule-${currentUser}-${currentYear}-${currentMonth+1}`;
  const schedule = JSON.parse(localStorage.getItem(scheduleKey)||"{}");

  let row="<tr>"+ "<td></td>".repeat(firstDay);

  for(let d=1;d<=lastDate;d++){
    if((firstDay+d-1)%7===0 && d>1) row+="</tr><tr>";

    const val = schedule[d] || "";
    row += `<td>
      <div>${d}</div>
      <select onchange="updateSchedule(${d}, this)">
        <option value="" ${val===""?"selected":""}></option>
        <option value="〇" ${val==="〇"?"selected":""}>〇</option>
        <option value="✕" ${val==="✕"?"selected":""}>✕</option>
        <option value="text" ${val!=="" && val!=="〇" && val!=="✕"?"selected":""}>テキスト</option>
      </select>
      <textarea ${val!=="" && val!=="〇" && val!=="✕"?"style='display:block'":"style='display:none'"}
        oninput="updateSchedule(${d}, this)">${val!=="" && val!=="〇" && val!=="✕"?val:""}</textarea>
    </td>`;
  }

  table.innerHTML+=row;
  adjustAllTextareas();
}

function updateSchedule(day, element){
  const key=`schedule-${currentUser}-${currentYear}-${currentMonth+1}`;
  const schedule=JSON.parse(localStorage.getItem(key)||"{}");
  let value="";

  if(element.tagName==="SELECT"){
    const textarea=element.parentElement.querySelector("textarea");
    if(element.value==="text"){
      textarea.style.display="block";
      value=textarea.value||"";
      adjustTextareaHeight(textarea);
    } else {
      textarea.style.display="none";
      value=element.value;
    }
  } else if(element.tagName==="TEXTAREA"){
    value=element.value;
    adjustTextareaHeight(element);
  }

  schedule[day]=value;
  localStorage.setItem(key, JSON.stringify(schedule));
  refreshStorage();
}

function adjustTextareaHeight(textarea){
  const parentCell=textarea.parentElement;
  const cellHeight=parentCell.clientHeight;
  textarea.style.height="auto";
  const scrollHeight = textarea.scrollHeight;
  textarea.style.height=Math.min(scrollHeight, cellHeight-10)+"px";
}

function adjustAllTextareas(){
  document.querySelectorAll("td textarea").forEach(t=>adjustTextareaHeight(t));
}

// ======================
// CSV出力
// ======================
function exportCSV(){
  if(!currentUser) return alert("ユーザーが選択されていません。");
  const scheduleKey = `schedule-${currentUser}-${currentYear}-${currentMonth+1}`;
  const schedule = JSON.parse(localStorage.getItem(scheduleKey) || "{}");

  let csv = "日付,スケジュール\n";
  for(let day=1; day<=new Date(currentYear,currentMonth+1,0).getDate(); day++){
    const val = schedule[day] || "";
    csv += `${currentYear}/${currentMonth+1}/${day},${val}\n`;
  }

  const blob = new Blob([csv], {type: "text/csv"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `schedule_${currentYear}_${currentMonth+1}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ======================
// 印刷用ビュー（白黒モノクロ・セル高さ自動調整）
// ======================
function printView(){
  if(!currentUser) return alert("ユーザーが選択されていません。");
  const scheduleKey = `schedule-${currentUser}-${currentYear}-${currentMonth+1}`;
  const schedule = JSON.parse(localStorage.getItem(scheduleKey) || "{}");

  const lastDate = new Date(currentYear,currentMonth+1,0).getDate();
  const firstDay = new Date(currentYear,currentMonth,1).getDay();
  const rows = Math.ceil((firstDay+lastDate)/7);

  // 高さを自動計算して全体を1ページに収める
  const cellHeight = Math.floor(800 / (rows+1)); // +1はヘッダー行

  let html = `<html><head><title>印刷用スケジュール</title>`;
  html += `<style>
    body { font-family:sans-serif; color:#000; background:#fff; margin:0; padding:10px; }
    h2 { text-align:center; margin-bottom:10px; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th, td { border: 1px solid #000; text-align: center; vertical-align: top; word-wrap: break-word; height:${cellHeight}px; }
    th { background: #000; color: #fff; }
    td { background: #fff; color: #000; }
    div.day-num { font-weight:bold; margin-bottom: 3px; }
  </style>`;
  html += `</head><body>`;
  html += `<h2>${currentYear}年 ${currentMonth+1}月 - ${getCurrentUserName()}</h2>`;
  html += `<table><tr>`;
  const days = ["日","月","火","水","木","金","土"];
  days.forEach(d=>{ html += `<th>${d}</th>`; });
  html += `</tr><tr>`;

  for(let i=0; i<firstDay; i++) html += "<td></td>";

  for(let d=1; d<=lastDate; d++){
    if((firstDay+d-1)%7===0 && d>1) html += "</tr><tr>";
    const val = schedule[d] || "";
    html += `<td><div class="day-num">${d}</div><div>${val}</div></td>`;
  }

  html += "</tr></table></body></html>";

  const printWin = window.open("", "_blank", "width=900,height=700");
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  printWin.print();
}

function getCurrentUserName(){
  const users = JSON.parse(localStorage.getItem("users")||"[]");
  const u = users.find(u=>u.id==currentUser);
  return u ? u.name : "";
}
