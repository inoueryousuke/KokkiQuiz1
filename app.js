/* ========= 旗データ ========= */
const Flags = {
  stripesH(cs){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="900" height="600">
    ${cs.map((c,i)=>`<rect x="0" y="${(2/cs.length)*i}" width="3" height="${2/cs.length}" fill="${c}"/>`).join("")}</svg>`},
  stripesV(cs){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="900" height="600">
    ${cs.map((c,i)=>`<rect x="${(3/cs.length)*i}" y="0" width="${3/cs.length}" height="2" fill="${c}"/>`).join("")}</svg>`},
  japan(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#fff"/><circle cx="1.5" cy="1" r="0.6" fill="#bc002d"/></svg>`},
  bangladesh(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#006a4e"/><circle cx="1.3" cy="1" r="0.6" fill="#f42a41"/></svg>`},
  switzerland(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><rect width="2" height="2" fill="#d52b1e"/><rect x="0.75" y="0.3" width="0.5" height="1.4" fill="#fff"/><rect x="0.3" y="0.75" width="1.4" height="0.5" fill="#fff"/></svg>`},
};

// region: AS(アジア) / EU(ヨーロッパ)
const COUNTRIES = [
  {hira:"にっぽん", mixed:"日本", svg:Flags.japan(), region:"AS"},
  {hira:"ふらんす", mixed:"フランス", svg:Flags.stripesV(["#0055a4","#fff","#ef4135"]), region:"EU"},
  {hira:"どいつ", mixed:"ドイツ", svg:Flags.stripesH(["#000","#dd0000","#ffce00"]), region:"EU"},
  {hira:"いたりあ", mixed:"イタリア", svg:Flags.stripesV(["#009246","#fff","#ce2b37"]), region:"EU"},
  {hira:"ろしあ", mixed:"ロシア", svg:Flags.stripesH(["#fff","#0039a6","#d52b1e"]), region:"EU"},
  {hira:"うくらいな", mixed:"ウクライナ", svg:Flags.stripesH(["#005bbb","#ffd500"]), region:"EU"},
  {hira:"ぽーらんど", mixed:"ポーランド", svg:Flags.stripesH(["#fff","#dc143c"]), region:"EU"},
  {hira:"いんどねしあ", mixed:"インドネシア", svg:Flags.stripesH(["#ce1126","#fff"]), region:"AS"},
  {hira:"べるぎー", mixed:"ベルギー", svg:Flags.stripesV(["#000","#ffd90c","#ef3340"]), region:"EU"},
  {hira:"あいるらんど", mixed:"アイルランド", svg:Flags.stripesV(["#169b62","#fff","#ff883e"]), region:"EU"},
  {hira:"おらんだ", mixed:"オランダ", svg:Flags.stripesH(["#ae1c28","#fff","#21468b"]), region:"EU"},
  {hira:"すいす", mixed:"スイス", svg:Flags.switzerland(), region:"EU"},
  {hira:"ばんぐらでしゅ", mixed:"バングラデシュ", svg:Flags.bangladesh(), region:"AS"},
];

/* ========= 要素 ========= */
const $ = s => document.querySelector(s);
const screenHome=$("#screen-home"), screenQuiz=$("#screen-quiz");
const startBtn=$("#startBtn"), homeBtn=$("#homeBtn");
const segChoiceBtns=document.querySelectorAll("[data-choices]");
const segTextBtns=document.querySelectorAll("[data-textmode]");
const segRegionBtns=document.querySelectorAll("[data-region]");
const voiceToggleHome=$("#voiceToggle-home"), endlessToggleHome=$("#endlessToggle-home");
const voiceToggle=$("#voiceToggle"), endlessToggle=$("#endlessToggle");
const flagEl=$("#flag"), fxEl=$("#fx"), choicesEl=$(".choices");
const scoreEl=$("#score"), qProgressEl=$("#qProgress"); const nextBtn=$("#nextBtn");
const sfxCorrect=$("#sfx-correct"), sfxWrong=$("#sfx-wrong");

/* ========= 状態 ========= */
let options={choices:3, textMode:"hira", region:"ALL", voice:true, endless:false, questionCount:10};
let pool=[], current=null, qIndex=0, correctCount=0;

/* ========= 初期化 ========= */
prepareSfx();
hookHome();
function hookHome(){
  segChoiceBtns.forEach(b=>b.addEventListener("click",()=>{segChoiceBtns.forEach(x=>x.classList.remove("active"));b.classList.add("active");options.choices=parseInt(b.dataset.choices,10)}));
  segTextBtns.forEach(b=>b.addEventListener("click",()=>{segTextBtns.forEach(x=>x.classList.remove("active"));b.classList.add("active");options.textMode=b.dataset.textmode}));
  segRegionBtns.forEach(b=>b.addEventListener("click",()=>{segRegionBtns.forEach(x=>x.classList.remove("active"));b.classList.add("active");options.region=b.dataset.region}));

  voiceToggleHome.addEventListener("change",()=>options.voice=voiceToggleHome.checked);
  endlessToggleHome.addEventListener("change",()=>options.endless=endlessToggleHome.checked);

  startBtn.addEventListener("click",()=>{
    voiceToggle.checked = options.voice;
    endlessToggle.checked = options.endless;
    showScreen("quiz"); startGame();
  });
  homeBtn.addEventListener("click",()=>{showScreen("home"); speechSynthesis.cancel();});

  nextBtn.addEventListener("click",()=>{nextBtn.disabled=true; nextQuestion();});
}
function showScreen(k){ if(k==="quiz"){screenHome.classList.add("hidden");screenQuiz.classList.remove("hidden");}else{screenQuiz.classList.add("hidden");screenHome.classList.remove("hidden");}}

/* ========= ユーティリティ ========= */
const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const nameByMode = c => options.textMode==="hira" ? c.hira : c.mixed;

/* ========= ゲーム ========= */
function startGame(){
  const base = options.region==="ALL" ? COUNTRIES : COUNTRIES.filter(c=>c.region===options.region);
  pool = shuffle([...base]);
  // 10問ぶんだけの山を作る（足りなければ循環）
  while (pool.length < options.questionCount) pool = pool.concat(shuffle([...base]));
  pool = pool.slice(0, options.questionCount);
  qIndex=0; correctCount=0;
  nextQuestion();
}

function nextQuestion(){
  const CHOICES = Math.max(2, Math.min(4, options.choices||4));
  if (!endlessToggle.checked && qIndex >= options.questionCount){ finishGame(); return; }

  // 補助プール（ダミー用に全域から取る）
  const allBase = options.region==="ALL" ? COUNTRIES : COUNTRIES.filter(c=>c.region===options.region);
  const answer = (endlessToggle.checked ? shuffle(allBase)[0] : pool[qIndex]);
  let distract = shuffle(allBase.filter(c=>c!==answer)).slice(0, CHOICES-1);
  const opts = shuffle([answer, ...distract]);

  current={answer, opts}; qIndex++;
  renderQuestion();
  if(voiceToggle.checked && options.voice) speak("この こっきは、どこの くに？","prompt");
}

function renderQuestion(){
  flagEl.classList.remove("jump");
  flagEl.innerHTML = current.answer.svg;
  fxEl.innerHTML = ""; // 演出クリア

  // 選択肢
  choicesEl.innerHTML="";
  current.opts.forEach(opt=>{
    const b=document.createElement("button");
    b.className="btn choice";
    b.textContent=nameByMode(opt);
    b.addEventListener("click",()=>selectChoice(b,opt));
    choicesEl.appendChild(b);
  });

  const total = endlessToggle.checked ? "∞" : options.questionCount;
  qProgressEl.textContent = `${Math.min(qIndex,total)} / ${total}`;
  scoreEl.textContent = `${correctCount} もん せいかい`;
}

function selectChoice(btn,opt){
  if ([...choicesEl.children].some(b=>b.disabled)) return;
  const ok = opt===current.answer;
  [...choicesEl.children].forEach(b=>b.disabled=true);

  if(ok){
    correctCount++;
    btn.classList.add("correct");
    flagEl.classList.add("jump");
    celebrate(); // 派手演出
    playCorrect();
    if(voiceToggle.checked && options.voice){
      const phrase = pick(["やったー！","せいかい！","すごい！","ぴんぽーん！"]);
      speak(`${phrase} ${nameByMode(current.answer)}`,"good");
    }
  }else{
    btn.classList.add("wrong");
    // 正解をハイライト
    [...choicesEl.children].find(b=>b.textContent===nameByMode(current.answer))?.classList.add("correct");
    oops(); // ×マーク
    playWrong();
    if(voiceToggle.checked && options.voice){
      const phrase = pick(["ざんねん！","おしい！","つぎは いける！"]);
      speak(`${phrase} せいかいは、${nameByMode(current.answer)}`,"bad");
    }
  }
  scoreEl.textContent = `${correctCount} もん せいかい`;
  nextBtn.disabled=false;
}

function finishGame(){
  const msg = `おしまい！ ${correctCount} / ${options.questionCount} もん せいかい！`;
  alert(msg);
  if (voiceToggle.checked && options.voice) speak(msg,"finish");
  showScreen("home");
}

/* ========= 演出（正解/不正解） ========= */
function celebrate(){
  fxEl.innerHTML="";
  const pattern = pick(["smileRainbow","starBurst"]);
  if(pattern==="smileRainbow"){
    const smile = document.createElement("div"); smile.className="smile"; smile.textContent="😊";
    const rainbow = document.createElement("div"); rainbow.className="rainbow";
    fxEl.appendChild(rainbow); fxEl.appendChild(smile);
    setTimeout(()=>{fxEl.innerHTML="";},1100);
  }else{
    // star burst 3つ
    for(let i=0;i<3;i++){
      const s=document.createElement("div"); s.className="burst"; s.textContent="✨";
      s.style.left = `${30 + i*20}%`; s.style.top = `${30 + (i%2)*20}%`;
      fxEl.appendChild(s);
      // 少し時間差
      setTimeout(()=>s.classList.add("show"), i*120);
    }
    setTimeout(()=>{fxEl.innerHTML="";},900);
  }
}

function oops(){
  fxEl.innerHTML="";
  const cross = document.createElement("div"); cross.className="cross";
  fxEl.appendChild(cross);
  setTimeout(()=>{fxEl.innerHTML="";},900);
}

/* ========= 音声（テンションをランダム） ========= */
function speak(text, mood="prompt"){
  try{
    const profiles = [
      {rate:0.9, pitch:0.9, vol:1.0},  // おだやか
      {rate:1.0, pitch:1.0, vol:1.0},  // ふつう
      {rate:1.2, pitch:1.2, vol:1.0},  // げんき
      {rate:1.35,pitch:1.4, vol:1.0},  // ハイテンション
    ];
    const p = pick(profiles);
    const u = new SpeechSynthesisUtterance(text);
    u.lang="ja-JP"; u.rate=p.rate; u.pitch=p.pitch; u.volume=p.vol;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }catch(e){}
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

/* ========= 効果音 ========= */
function prepareSfx(){ sfxCorrect.src = makeBeep(880,0.12); sfxWrong.src = makeBeep(160,0.18); }
function playCorrect(){ sfxCorrect.currentTime=0; sfxCorrect.play().catch(()=>{}); }
function playWrong(){ sfxWrong.currentTime=0; sfxWrong.play().catch(()=>{}); }
function makeBeep(freq=440,dur=0.12){
  const sr=44100,len=Math.floor(sr*dur),data=new Int16Array(len);
  for(let i=0;i<len;i++){const t=i/sr,env=Math.exp(-5*t); data[i]=Math.max(-1,Math.min(1,Math.sin(2*Math.PI*freq*t)*env))*32767;}
  const header=new ArrayBuffer(44),dv=new DataView(header);
  const w=(o,s)=>{for(let i=0;i<s.length;i++) dv.setUint8(o+i,s.charCodeAt(i));};
  w(0,"RIFF");dv.setUint32(4,36+data.length*2,true);w(8,"WAVE");
  w(12,"fmt ");dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
  dv.setUint32(24,sr,true);dv.setUint32(28,sr*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);
  w(36,"data");dv.setUint32(40,data.length*2,true);
  const wav=new Uint8Array(44+data.length*2);wav.set(new Uint8Array(header),0);wav.set(new Uint8Array(new Int16Array(data.buffer).buffer),44);
  const b64=btoa(String.fromCharCode(...wav));return `data:audio/wav;base64,${b64}`;
}
