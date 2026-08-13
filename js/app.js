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
const LANG_VOICE_CODE = { Arabic:'ar-SA', Urdu:'ur-PK', English:'en-IN', Hindi:'hi-IN' };

/* ---------------- SHARED: LANGUAGE TOPIC LISTS ---------------- */
const LANG_TOPICS = {
  English: ["Tenses (Present/Past/Future)","Articles (a, an, the)","Prepositions","Modal Verbs","Active & Passive Voice","Direct & Indirect Speech","Subject-Verb Agreement","Sentence Correction","Vocabulary Building","Reading Comprehension","Essay & Letter Writing","Idioms & Phrasal Verbs"],
  Arabic: ["Arabic Alphabet & Sounds","Gender of Nouns (مذكر/مؤنث)","Pronouns (الضمائر)","Present Tense Verbs (المضارع)","Past Tense Verbs (الماضي)","Sentence Structure (جملة اسمية وفعلية)","Numbers (الأرقام)","Everyday Vocabulary","Basic Reading & Short Texts"],
  Urdu: ["Urdu Alphabet & Nastaliq Script","Gender of Nouns","Pronouns (ضمائر)","Present Tense (حال)","Past Tense (ماضی)","Sentence Structure","Everyday Vocabulary","Idioms & Proverbs (محاورے)","Reading Comprehension"],
  Hindi: ["Hindi Alphabet (वर्णमाला)","Sangya - Nouns","Sarvanam - Pronouns","Kriya - Present Tense","Kriya - Past Tense","Vakya Rachna - Sentence Structure","Muhavare - Idioms","Everyday Vocabulary","Reading Comprehension"]
};
function populateTopicSelect(selectEl, lang){
  if(!selectEl) return;
  selectEl.innerHTML = '';
  (LANG_TOPICS[lang] || []).forEach(t=>{
    const opt = document.createElement('option');
    opt.textContent = t;
    selectEl.appendChild(opt);
  });
}
function updateAssignTopics(){
  populateTopicSelect(document.getElementById('assign-topic'), document.getElementById('assign-lang').value);
}
function updateExamTopics(){
  populateTopicSelect(document.getElementById('exam-topic'), document.getElementById('exam-select').value);
}

/* ---------------- TUTOR CHAT ---------------- */
let tutorImageData = null;

function handleImageSelect(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    const dataUrl = ev.target.result;
    const base64 = dataUrl.split(',')[1];
    tutorImageData = {base64, mimeType: file.type, dataUrl};
    const preview = document.getElementById('tutor-image-preview');
    preview.style.display = 'flex';
    preview.innerHTML = `<img src="${dataUrl}" alt="attached"><span>Image attached</span><button onclick="clearTutorImage()">✕</button>`;
  };
  reader.readAsDataURL(file);
}
function clearTutorImage(){
  tutorImageData = null;
  const preview = document.getElementById('tutor-image-preview');
  preview.style.display = 'none';
  preview.innerHTML = '';
  document.getElementById('tutor-image-input').value = '';
}

let tutorRecognizer = null, tutorMicOn = false;
function toggleTutorMic(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = document.getElementById('tutor-mic-btn');
  if(!SR){ alert("Voice input isn't supported in this browser — try Chrome or Edge."); return; }
  if(tutorMicOn){
    if(tutorRecognizer) tutorRecognizer.stop();
    return;
  }
  const instructionLang = document.getElementById('tutor-instruction-lang').value;
  tutorRecognizer = new SR();
  tutorRecognizer.lang = LANG_VOICE_CODE[instructionLang] || 'en-IN';
  tutorRecognizer.interimResults = false; tutorRecognizer.continuous = false;
  tutorMicOn = true;
  btn.classList.add('active');
  tutorRecognizer.onresult = (e)=>{
    const said = e.results[0][0].transcript;
    const input = document.getElementById('tutor-input');
    input.value = (input.value ? input.value + ' ' : '') + said;
  };
  tutorRecognizer.onend = ()=>{ tutorMicOn = false; btn.classList.remove('active'); };
  tutorRecognizer.onerror = ()=>{ tutorMicOn = false; btn.classList.remove('active'); };
  tutorRecognizer.start();
}

async function sendTutor(){
  const input = document.getElementById('tutor-input');
  const text = input.value.trim();
  if(!text && !tutorImageData) return;
  const log = document.getElementById('tutor-log');

  let userBubble = '<div class="msg user">';
  if(tutorImageData) userBubble += `<img src="${tutorImageData.dataUrl}" alt="attached">`;
  if(text) userBubble += escapeHtml(text);
  userBubble += '</div>';
  log.innerHTML += userBubble;

  input.value = '';
  log.scrollTop = log.scrollHeight;
  const thinkingId = 'think-'+Date.now();
  log.innerHTML += `<div class="msg ai loading-dots" id="${thinkingId}">Vaani is typing</div>`;
  log.scrollTop = log.scrollHeight;

  const payload = {
    message: text || "Please look at this image and help explain or discuss it.",
    targetLanguage: document.getElementById('tutor-target-lang').value,
    instructionLanguage: document.getElementById('tutor-instruction-lang').value
  };
  if(tutorImageData){
    payload.image = tutorImageData.base64;
    payload.imageType = tutorImageData.mimeType;
  }
  const reply = await callApi('tutor', payload);
  document.getElementById(thinkingId).outerHTML = `<div class="msg ai">${escapeHtml(reply).replace(/\n/g,'<br>')}</div>`;
  log.scrollTop = log.scrollHeight;
  clearTutorImage();
}

/* ---------------- TUTOR CHAT: PDF NOTES + SUMMARY ---------------- */
function buildTranscriptText(){
  const msgs = document.querySelectorAll('#tutor-log .msg');
  const lines = [];
  msgs.forEach(m=>{
    const who = m.classList.contains('user') ? 'You' : 'Vaani';
    const text = m.innerText.trim();
    if(text) lines.push(who + ': ' + text);
  });
  return lines.join('\n\n');
}
function downloadChatPDF(){
  if(!window.jspdf){ alert('PDF library is still loading — try again in a moment.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const marginX = 14; let y = 18;
  doc.setFont('helvetica','bold'); doc.setFontSize(16);
  doc.text('Vaani - Tutor Chat Notes', marginX, y); y += 8;
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text(new Date().toLocaleString(), marginX, y); y += 10;
  doc.setFontSize(11);
  const msgs = document.querySelectorAll('#tutor-log .msg');
  msgs.forEach(m=>{
    const who = m.classList.contains('user') ? 'You' : 'Vaani';
    const text = m.innerText.trim();
    if(!text) return;
    const lines = doc.splitTextToSize(who + ': ' + text, 180);
    lines.forEach(line=>{
      if(y > 280){ doc.addPage(); y = 18; }
      doc.text(line, marginX, y);
      y += 7;
    });
    y += 3;
  });
  doc.save('vaani-chat-notes.pdf');
}
async function summarizeSession(){
  const transcript = buildTranscriptText();
  if(!transcript){ alert('No chat yet to summarize.'); return; }
  const log = document.getElementById('tutor-log');
  const thinkingId = 'think-'+Date.now();
  log.innerHTML += `<div class="msg ai loading-dots" id="${thinkingId}">Preparing your summary</div>`;
  log.scrollTop = log.scrollHeight;
  const reply = await callApi('summary', {transcript});
  document.getElementById(thinkingId).outerHTML = `<div class="msg ai"><b>📝 Session Summary</b><br>${escapeHtml(reply).replace(/\n/g,'<br>')}</div>`;
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
    const targetLang = document.getElementById('speak-target-lang').value;
    recognizer = new SR();
    recognizer.lang = LANG_VOICE_CODE[targetLang] || 'en-IN';
    recognizer.interimResults=false; recognizer.continuous=false;
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
  const robot = document.getElementById('ai-robot');
  const payload = {
    message: text,
    targetLanguage: document.getElementById('speak-target-lang').value,
    instructionLanguage: document.getElementById('speak-instruction-lang').value
  };
  const reply = await callApi('speak', payload);
  logSpeak('vaani', reply);
  speak(reply, robot);
}
function speak(text, robot){
  if(!('speechSynthesis' in window)){ return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.98; utter.pitch = 1.0;
  const targetLang = document.getElementById('speak-target-lang') ? document.getElementById('speak-target-lang').value : 'English';
  utter.lang = LANG_VOICE_CODE[targetLang] || 'en-IN';
  robot.classList.add('speaking');
  utter.onend = ()=> robot.classList.remove('speaking');
  window.speechSynthesis.speak(utter);
}

/* ---------------- ASSIGNMENTS ---------------- */
function showAssignTopics(){
  const lang = document.getElementById('assign-lang').value;
  const box = document.getElementById('assign-topics-list');
  box.style.display = 'block';
  const topics = LANG_TOPICS[lang] || [];
  box.innerHTML = `<b>Full topic list — ${escapeHtml(lang)}</b><br><br>` + topics.map(t=>'• '+escapeHtml(t)).join('<br>');
}
async function showDemoAssignment(){
  const language = document.getElementById('assign-lang').value;
  const topic = document.getElementById('assign-topic').value;
  const level = document.getElementById('assign-level').value;
  const box = document.getElementById('assign-demo');
  box.style.display = 'block';
  box.innerHTML = '<span class="loading-dots">Preparing a demo</span>';
  const reply = await callApi('assignment', {language, topic, level, demo:true});
  box.innerHTML = `<b>👁️ Demo assignment</b><br><br>${escapeHtml(reply).replace(/\n/g,'<br>')}`;
}
async function getAssignment(){
  const language = document.getElementById('assign-lang').value;
  const topic = document.getElementById('assign-topic').value;
  const level = document.getElementById('assign-level').value;
  const box = document.getElementById('assign-prompt');
  box.style.display='block';
  box.innerHTML = '<span class="loading-dots">Preparing your assignment</span>';
  const reply = await callApi('assignment', {language, topic, level, demo:false});
  box.innerHTML = `<b>Your assignment:</b><br>${escapeHtml(reply).replace(/\n/g,'<br>')}`;
  window.__currentAssignment = reply;
}

let assignImageData = null;
function handleAssignImageSelect(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    const dataUrl = ev.target.result;
    const base64 = dataUrl.split(',')[1];
    assignImageData = {base64, mimeType:file.type, dataUrl, name:file.name};
    const preview = document.getElementById('assign-image-preview');
    preview.style.display = 'flex';
    const thumb = file.type.startsWith('image/') ? `<img src="${dataUrl}" alt="attached">` : '<span>📄</span>';
    preview.innerHTML = `${thumb}<span>${escapeHtml(file.name)} attached</span><button onclick="clearAssignImage()">✕</button>`;
  };
  reader.readAsDataURL(file);
}
function clearAssignImage(){
  assignImageData = null;
  const preview = document.getElementById('assign-image-preview');
  preview.style.display='none';
  preview.innerHTML='';
  document.getElementById('assign-image-input').value='';
}
async function submitAssignment(){
  const answer = document.getElementById('assign-answer').value.trim();
  if(!answer && !assignImageData){ alert('Write a response or attach a photo/PDF first.'); return; }
  const box = document.getElementById('assign-feedback');
  box.style.display='block';
  box.innerHTML = '<span class="loading-dots">Reviewing your work</span>';
  const assignment = window.__currentAssignment || "a general language learning task";
  const payload = { assignment, answer: answer || "(see attached file)" };
  if(assignImageData){
    payload.image = assignImageData.base64;
    payload.imageType = assignImageData.mimeType;
  }
  const reply = await callApi('feedback', payload);
  box.innerHTML = `<b>Feedback:</b><br>${escapeHtml(reply).replace(/\n/g,'<br>')}`;
  clearAssignImage();
}

/* ---------------- EXAM PRACTICE (OMR STYLE) ---------------- */
async function getExamSet(){
  const language = document.getElementById('exam-select').value;
  const topic = document.getElementById('exam-topic').value;
  const container = document.getElementById('exam-set');
  container.innerHTML = '<div class="card loading-dots">Generating your practice set</div>';
  const reply = await callApi('exam', {language, topic});
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
      <div class="q-num">QUESTION ${qi+1} · ${escapeHtml(language)} · ${escapeHtml(topic)}</div>
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
  const motherTongue = document.getElementById('lang-mother-tongue').value;
  const body = document.getElementById('lang-body');
  body.innerHTML = '<span class="loading-dots">Preparing your ' + currentLang + ' content</span>';
  const reply = await callApi('language', {language: currentLang, section, motherTongue});

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
updateAssignTopics();
updateExamTopics();
loadNews('Top Stories');
