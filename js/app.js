/* ---------------- NAVIGATION ---------------- */
function goTo(page){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.page===page));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
}
document.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click',()=>goTo(n.dataset.page)));

/* ---------------- BACKEND HELPER ---------------- */
async function callApi(endpoint, payload){
  try{
    const res = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    return data.reply;
  }catch(e){
    return "Something went wrong reaching the server: " + e.message;
  }
}
function escapeHtml(s){
  const d = document.createElement('div'); d.innerText = s; return d.innerHTML;
}

/* ---------------- TUTOR CHAT ---------------- */
async function sendTutor(){
  const input = document.getElementById('tutor-input');
  const text = input.value.trim();
  if(!text) return;
  const log = document.getElementById('tutor-log');
  log.innerHTML += `<div class="msg user">${escapeHtml(text)}</div>`;
  input.value='';
  log.scrollTop = log.scrollHeight;
  const thinkingId = 'think-'+Date.now();
  log.innerHTML += `<div class="msg ai loading-dots" id="${thinkingId}">Vaani is typing</div>`;
  log.scrollTop = log.scrollHeight;
  const reply = await callApi('tutor', {message: text});
  document.getElementById(thinkingId).outerHTML = `<div class="msg ai">${escapeHtml(reply).replace(/\n/g,'<br>')}</div>`;
  log.scrollTop = log.scrollHeight;
}

/* ---------------- SPEAKING ROOM ---------------- */
let localStream=null, camOn=true, micOn=false, recognizer=null;

async function initCam(){
  try{
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
    document.getElementById('local-video').srcObject = localStream;
  }catch(e){
    document.getElementById('local-video').style.background = '#000';
  }
}
function toggleCam(){
  if(!localStream) return;
  camOn = !camOn;
  localStream.getVideoTracks().forEach(t=>t.enabled=camOn);
  document.getElementById('cam-btn').style.opacity = camOn?1:0.5;
}
function toggleMic(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    document.getElementById('speak-fallback').style.display='flex';
    logSpeak('system','Voice recognition isn\'t supported in this browser — use the text box below instead.');
    return;
  }
  micOn = !micOn;
  const btn = document.getElementById('mic-btn');
  if(micOn){
    btn.classList.remove('off');
    recognizer = new SR();
    recognizer.lang='en-IN'; recognizer.interimResults=false; recognizer.continuous=false;
    recognizer.onresult = (e)=>{
      const said = e.results[0][0].transcript;
      sendSpeak(said);
    };
    recognizer.onerror = ()=>{ micOn=false; btn.classList.add('off'); };
    recognizer.onend = ()=>{ if(micOn){ try{recognizer.start();}catch(e){} } };
    recognizer.start();
    logSpeak('system','Listening... speak naturally.');
  } else {
    btn.classList.add('off');
    if(recognizer) recognizer.stop();
  }
}
function endCall(){
  if(localStream) localStream.getTracks().forEach(t=>t.stop());
  if(recognizer) recognizer.stop();
  micOn=false;
  document.getElementById('mic-btn').classList.add('off');
  logSpeak('system','Call ended.');
}
function logSpeak(who, text){
  const box = document.getElementById('speak-transcript');
  const label = who==='you' ? '<b>You:</b> ' : who==='vaani' ? '<b>Vaani:</b> ' : '';
  box.innerHTML += `<p>${label}${escapeHtml(text)}</p>`;
  box.scrollTop = box.scrollHeight;
}
async function sendSpeak(text){
  text = (text||'').trim();
  if(!text) return;
  const speakInputEl = document.getElementById('speak-input');
  if(speakInputEl) speakInputEl.value='';
  logSpeak('you', text);
  const orb = document.getElementById('ai-orb');
  const reply = await callApi('speak', {message: text});
  logSpeak('vaani', reply);
  speak(reply, orb);
}
function speak(text, orb){
  if(!('speechSynthesis' in window)){ return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.98; utter.pitch = 1.0; utter.lang='en-IN';
  orb.classList.add('speaking');
  utter.onend = ()=> orb.classList.remove('speaking');
  window.speechSynthesis.speak(utter);
}

/* ---------------- ASSIGNMENTS ---------------- */
async function getAssignment(){
  const level = document.getElementById('assign-level').value;
  const focus = document.getElementById('assign-focus').value;
  const box = document.getElementById('assign-prompt');
  box.style.display='block';
  box.innerHTML = '<span class="loading-dots">Preparing your assignment</span>';
  const reply = await callApi('assignment', {level, focus});
  box.innerHTML = `<b>Today's assignment:</b><br>${escapeHtml(reply).replace(/\n/g,'<br>')}`;
  window.__currentAssignment = reply;
}
async function submitAssignment(){
  const answer = document.getElementById('assign-answer').value.trim();
  if(!answer){ alert('Write a response first.'); return; }
  const box = document.getElementById('assign-feedback');
  box.style.display='block';
  box.innerHTML = '<span class="loading-dots">Reviewing your writing</span>';
  const assignment = window.__currentAssignment || "a general English writing task";
  const reply = await callApi('feedback', {assignment, answer});
  box.innerHTML = `<b>Feedback:</b><br>${escapeHtml(reply).replace(/\n/g,'<br>')}`;
}

/* ---------------- EXAM PRACTICE (OMR STYLE) ---------------- */
async function getExamSet(){
  const exam = document.getElementById('exam-select').value;
  const topic = document.getElementById('exam-topic').value;
  const container = document.getElementById('exam-set');
  container.innerHTML = '<div class="card loading-dots">Generating your practice set</div>';
  const reply = await callApi('exam', {exam, topic});
  let data;
  try{
    const clean = reply.replace(/```json|```/g,'').trim();
    data = JSON.parse(clean);
  }catch(e){
    container.innerHTML = `<div class="card">Couldn't parse the question set. Raw response:<br><br>${escapeHtml(reply)}</div>`;
    return;
  }
  container.innerHTML = '';
  data.questions.forEach((q,qi)=>{
    const block = document.createElement('div');
    block.className='q-block';
    block.innerHTML = `
      <div class="q-num">QUESTION ${qi+1} · ${escapeHtml(exam)} · ${escapeHtml(topic)}</div>
      <div class="q-text">${escapeHtml(q.question)}</div>
      <div class="opts"></div>
      <div class="q-explain">${escapeHtml(q.explanation||'')}</div>
    `;
    const opts = block.querySelector('.opts');
    q.options.forEach((opt,oi)=>{
      const row = document.createElement('div');
      row.className='omr-option';
      row.innerHTML = `<div class="omr-bubble">${String.fromCharCode(65+oi)}</div><div>${escapeHtml(opt)}</div>`;
      row.onclick = ()=>{
        if(block.dataset.answered) return;
        block.dataset.answered = '1';
        [...opts.children].forEach((r,ri)=>{
          if(ri===q.correctIndex) r.classList.add('correct');
          else if(ri===oi) r.classList.add('wrong');
        });
        block.querySelector('.q-explain').style.display='block';
      };
      opts.appendChild(row);
    });
    container.appendChild(block);
  });
}

/* ---------------- LANGUAGES ---------------- */
let currentLang = 'Arabic';
let currentLangSection = null;

document.querySelectorAll('#lang-tabs .tab-chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('#lang-tabs .tab-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    currentLang = chip.dataset.lang;
    if(currentLangSection) loadLangSection(currentLangSection);
  });
});

async function loadLangSection(section){
  currentLangSection = section;
  const body = document.getElementById('lang-body');
  body.innerHTML = '<span class="loading-dots">Preparing your ' + currentLang + ' content</span>';
  const reply = await callApi('language', {language: currentLang, section});

  let cssClass = 'lang-content';
  if(currentLang === 'Arabic') cssClass += ' rtl-arabic';
  else if(currentLang === 'Urdu') cssClass += ' rtl-urdu';

  body.innerHTML = `<div class="${cssClass}">${escapeHtml(reply)}</div>`;
}

/* ---------------- NEWS ---------------- */
document.querySelectorAll('#page-news .tab-chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('#page-news .tab-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    loadNews(chip.dataset.cat);
  });
});
async function loadNews(cat){
  const body = document.getElementById('news-body');
  body.innerHTML = '<span class="loading-dots">Fetching today\'s briefing</span>';
  const reply = await callApi('news', {category: cat});
  body.innerHTML = `<div style="white-space:pre-wrap; font-size:14px; line-height:1.7; color:var(--ink);">${escapeHtml(reply)}</div>`;
}

/* ---------------- INIT ---------------- */
initCam();
loadNews('Top Stories');
