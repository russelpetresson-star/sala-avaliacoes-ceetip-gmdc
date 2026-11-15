/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "interativos" */
function stopEnquetePoll(){
  if(enquetePollInterval){ clearInterval(enquetePollInterval); enquetePollInterval = null; }
}
async function loadEnqueteAtiva(turmaId){
  const e = state.professor.enquete;
  return aoVivoCarregar('enquete-ativa', turmaId, [e.current && e.current.turmaId, e.turmaId]);
}
async function saveEnqueteAtiva(obj, turmaId){
  const e = state.professor.enquete;
  await aoVivoSalvar('enquete-ativa', obj, turmaId || (e.current && e.current.turmaId) || e.turmaId);
}
async function refreshProfessorEnquete(){
  const p = state.professor;
  const prev = JSON.stringify(p.enquete.current);
  const fresh = await loadEnqueteAtiva();
  p.enquete.current = fresh;
  if(JSON.stringify(fresh) !== prev) render();
}
async function startEnquete(authorName){
  const p = state.professor;
  const e = p.enquete;
  if(!e.turmaId){ alert('Selecione uma turma.'); return; }
  const question = e.formQuestion.trim();
  if(!question){ alert('Escreva a pergunta da enquete.'); return; }
  const options = e.formOptions.map(o=>o.trim()).filter(Boolean);
  if(options.length < 2){ alert('Informe pelo menos duas opções de resposta.'); return; }
  const turma = p.turmas.find(t=>t.id===e.turmaId);
  const obj = {
    id: cryptoId(),
    turmaId: e.turmaId,
    turmaName: turma ? turma.name : '',
    question,
    options,
    authorName,
    createdAt: Date.now(),
    closed: false,
    responses: {}
  };
  await saveEnqueteAtiva(obj);
  e.current = obj;
  e.formQuestion = '';
  e.formOptions = ['',''];
  render();
}
async function encerrarEnquete(){
  const p = state.professor;
  if(!p.enquete.current) return;
  p.enquete.current.closed = true;
  await saveEnqueteAtiva(p.enquete.current);
  render();
}
async function limparEnquete(){
  if(!confirm('Encerrar e apagar esta enquete para começar uma nova?')) return;
  await saveEnqueteAtiva(null);
  state.professor.enquete.current = null;
  render();
}
async function submitEnqueteResposta(optionIndex){
  const al = state.aluno;
  const poll = al.enqueteAtiva;
  if(!poll || poll.closed) return;
  const key = al.matriculaStudentId || al.name;
  let jaHaviaRespondido = false, valida = false;
  const fresh = await aoVivoAtualizar('enquete-ativa', poll.turmaId, o => {
    if(o.id !== poll.id || o.closed){ valida = false; return false; }
    valida = true;
    o.responses = o.responses || {};
    jaHaviaRespondido = Object.prototype.hasOwnProperty.call(o.responses, key);
    o.responses[key] = optionIndex;
  });
  if(!valida){ al.enqueteAtiva = fresh; render(); return; }
  al.enqueteAtiva = fresh;
  render();
  if(!jaHaviaRespondido && al.matriculaStudentId && al.turma){
    awardFichas(al.turma.id, al.matriculaStudentId, 2, 'Participou da enquete "'+fresh.question+'"', 'enquete').then(()=>{
      if(state.aluno.stage==='dashboard') render();
    });
  }
}
async function pollEnqueteForAluno(){
  const al = state.aluno;
  if(al.stage !== 'dashboard' || !al.turma) return false;
  const poll = await loadEnqueteAtiva(al.turma.id);
  const novo = (poll && poll.turmaId === al.turma.id) ? poll : null;
  const changed = JSON.stringify(novo) !== JSON.stringify(al.enqueteAtiva);
  al.enqueteAtiva = novo;
  return changed;
}
function renderEnqueteRelampago(){
  const p = state.professor;
  const e = p.enquete;
  const turmaOptions = professorTurmas().map(t=>`<option value="${t.id}" ${e.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
  const cur = e.current;
  let resultBlock = '';
  if(cur){
    const { counts, total } = enqueteTally(cur);
    resultBlock = `
      <hr style="margin:20px 0; border:none; border-top:1px solid var(--paper-line);">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h3 style="margin:0;">${cur.closed ? 'Enquete encerrada' : '🔴 Enquete em andamento'} — ${esc(cur.turmaName)}</h3>
        <div class="row" style="flex:0 0 auto; gap:6px;">
          ${!cur.closed ? `<button class="btn btn-ghost btn-sm" data-action="encerrar-enquete">Encerrar</button>` : ''}
          <button class="btn btn-danger btn-sm" data-action="limpar-enquete">Nova enquete</button>
        </div>
      </div>
      <p style="font-weight:600; margin-top:10px;">${esc(cur.question)}</p>
      ${cur.options.map((opt,i) => {
        const pct = total>0 ? Math.round((counts[i]/total)*100) : 0;
        return `
          <div style="margin:10px 0;">
            <div class="row" style="justify-content:space-between; font-size:.9rem;">
              <span>${esc(opt)}</span><span class="muted">${counts[i]} voto(s) · ${pct}%</span>
            </div>
            <div style="background:var(--paper-line); border-radius:6px; height:10px; overflow:hidden;">
              <div style="background:var(--board); height:100%; width:${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('')}
      <p class="muted" style="font-size:.82rem; margin-top:8px;">${total} resposta(s) recebida(s) · atualiza automaticamente</p>
    `;
  }
  const formBlock = (!cur || cur.closed) ? `
    <h3 style="margin-top:${cur?'22px':'0'};">Criar nova enquete</h3>
    <label>Turma</label>
    <select id="enquete-turma-select" data-action="enquete-select-turma">
      <option value="">Selecione...</option>
      ${turmaOptions}
    </select>
    <label style="margin-top:10px;">Pergunta</label>
    <input type="text" id="enquete-question-input" placeholder="Ex: Vocês entenderam o conteúdo de hoje?" value="${esc(e.formQuestion)}">
    <label style="margin-top:10px;">Opções de resposta</label>
    ${e.formOptions.map((opt,i) => `
      <div class="row" style="margin-bottom:6px;">
        <input type="text" data-action="enquete-option-input" data-idx="${i}" placeholder="Opção ${i+1}" value="${esc(opt)}" style="flex:1;">
        ${e.formOptions.length>2 ? `<button class="btn btn-ghost btn-sm" data-action="enquete-remove-option" data-idx="${i}">✕</button>` : ''}
      </div>
    `).join('')}
    <button class="btn btn-ghost btn-sm" data-action="enquete-add-option">+ Opção</button>
    <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="start-enquete">Iniciar enquete</button>
  ` : '';
  return `
    <div class="card">
      <h2>Enquete Relâmpago</h2>
      <p class="muted">Faça uma pergunta rápida para a turma e acompanhe as respostas chegarem em tempo real.</p>
      ${resultBlock}
      ${formBlock}
    </div>
  `;
}
let quizLastTickSecond = null;
let lastQuizLeaderId = null;
let quizBarAnimKey = null;
function stopQuizPoll(){
  if(quizPollInterval){ clearInterval(quizPollInterval); quizPollInterval = null; }
  quizLastTickSecond = null;
}
function quizResetEffectsState(){
  quizLastTickSecond = null;
  lastQuizLeaderId = null;
  quizBarAnimKey = null;
}
let quizAudioCtx = null;
function getQuizAudioCtx(){
  if(!quizAudioCtx){ try{ quizAudioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  return quizAudioCtx;
}
function quizBeep(freq, durationMs, type, volume){
  const ctx = getQuizAudioCtx();
  if(!ctx) return;
  try{
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type||'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume||0.12;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs/1000);
    osc.stop(ctx.currentTime + durationMs/1000 + 0.03);
  }catch(e){}
}
function quizPlayTick(){ quizBeep(880, 90, 'square', 0.07); }
function quizPlayCorrect(){ quizBeep(660,120,'sine',0.14); setTimeout(()=>quizBeep(990,180,'sine',0.14),110); }
function quizPlayWrong(){ quizBeep(180,260,'sawtooth',0.1); }
function triggerQuizConfetti(){
  try{
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed; inset:0; pointer-events:none; z-index:99999; overflow:hidden;';
    document.body.appendChild(container);
    const colors = ['#f94144','#f3722c','#f9c74f','#90be6d','#43aa8b','#577590','#f8961e'];
    for(let i=0;i<70;i++){
      const piece = document.createElement('div');
      const size = 6+Math.random()*7;
      piece.style.cssText = `position:absolute; top:-20px; left:${Math.random()*100}%; width:${size}px; height:${size*0.45}px; background:${colors[Math.floor(Math.random()*colors.length)]}; opacity:${0.85+Math.random()*0.15}; transform:rotate(${Math.random()*360}deg); border-radius:2px;`;
      const duration = 1800+Math.random()*1500;
      const drift = (Math.random()-0.5)*220;
      try{
        piece.animate([
          { transform:`translate(0,0) rotate(0deg)`, opacity:1 },
          { transform:`translate(${drift}px, 100vh) rotate(${360+Math.random()*360}deg)`, opacity:0.3 }
        ], { duration, easing:'ease-in', fill:'forwards' });
      }catch(e){}
      container.appendChild(piece);
    }
    setTimeout(()=>container.remove(), 3500);
  }catch(e){}
}
function checkQuizLeaderChange(q){
  if(!q || !q.teams || !q.teams.length) return;
  const sorted = [...q.teams].sort((a,b)=>(q.scores[b.id]||0)-(q.scores[a.id]||0));
  const leader = sorted[0];
  const leaderScore = (q.scores[leader.id]||0);
  if(leaderScore>0 && leader.id !== lastQuizLeaderId){
    const isFirstCheck = lastQuizLeaderId===null;
    lastQuizLeaderId = leader.id;
    if(!isFirstCheck) triggerQuizConfetti();
  }
}
function checkQuizTick(q){
  if(!q || q.status!=='question'){ quizLastTickSecond = null; return; }
  const question = q.questions[q.currentIndex];
  const remaining = Math.max(0, Math.ceil((question.durationSeconds*1000 - (Date.now()-q.currentStartedAt))/1000));
  if(remaining<=5 && remaining>0 && remaining!==quizLastTickSecond){
    quizLastTickSecond = remaining;
    quizPlayTick();
  }
  if(remaining<=0) quizLastTickSecond = null;
}
async function checkQuizAutoReveal(q){
  if(!q || q.status!=='question') return;
  const question = q.questions[q.currentIndex];
  const elapsed = (Date.now() - q.currentStartedAt)/1000;
  const totalStudents = q.teams.reduce((sum,t)=>sum+t.studentIds.length,0);
  const answeredCount = Object.keys(q.currentAnswers||{}).length;
  if(elapsed >= (question.durationSeconds||30) || (totalStudents>0 && answeredCount>=totalStudents)){
    await quizRevealAnswer();
  }
}
function quizScoreboardBars(q, animateKey){
  const revealInfo = q.revealInfo;
  const sortedTeams = [...q.teams].sort((a,b)=>(q.scores[b.id]||0)-(q.scores[a.id]||0));
  const maxScore = Math.max(1, ...sortedTeams.map(t=>q.scores[t.id]||0));
  const animate = animateKey ? (animateKey !== quizBarAnimKey && (quizBarAnimKey = animateKey)) : false;
  return sortedTeams.map((team,i) => {
    const after = q.scores[team.id]||0;
    const before = (animate && revealInfo && revealInfo.pointsAwarded) ? Math.max(0, after - (revealInfo.pointsAwarded[team.id]||0)) : after;
    const afterPct = Math.min(100, (after/maxScore)*100);
    const beforePct = Math.min(100, (before/maxScore)*100);
    return { team, rank:i+1, after, startPct: animate ? beforePct : afterPct, targetPct: afterPct };
  });
}
async function loadQuizAtivo(turmaId){
  const q = state.professor.quiz;
  return aoVivoCarregar('quiz-ativo', turmaId, [q.current && q.current.turmaId, q.setup && q.setup.turmaId]);
}
async function saveQuizAtivo(obj, turmaId){
  const q = state.professor.quiz;
  await aoVivoSalvar('quiz-ativo', obj, turmaId || (q.current && q.current.turmaId) || (q.setup && q.setup.turmaId));
}
function quizRespPrefixo(q){ return `quiz-resp:${q.turmaId}:${q.id}:${q.currentIndex}:`; }
async function quizJuntarRespostas(q){
  if(!q || q.status!=='question' || q.currentIndex < 0) return q;
  const lista = await liveListar(quizRespPrefixo(q));
  const extra = {};
  Object.entries(lista).forEach(([sid, v]) => { try{ const r = JSON.parse(v); if(r && r.optionIndex!=null) extra[sid] = r; }catch(e){} });
  if(Object.keys(extra).length) q.currentAnswers = Object.assign({}, extra, q.currentAnswers||{});
  return q;
}
function updateLiveCountdowns(){
  document.querySelectorAll('[data-countdown-start]').forEach(el => {
    const start = Number(el.dataset.countdownStart), dur = Number(el.dataset.countdownDur);
    if(!start || !dur) return;
    const remaining = Math.max(0, dur - Math.floor((Date.now()-start)/1000));
    if(el.textContent !== String(remaining)) el.textContent = String(remaining);
    const urgente = remaining<=5;
    el.classList.toggle('quiz-timer-urgente', urgente);
    el.style.color = urgente ? 'var(--red)' : '';
  });
}
async function refreshProfessorQuiz(){
  const q = state.professor.quiz;
  const prev = JSON.stringify(q.current);
  const fresh = await quizJuntarRespostas(await loadQuizAtivo());
  q.current = fresh;
  if(JSON.stringify(fresh) !== prev) render();
  updateLiveCountdowns();
  checkQuizLeaderChange(fresh);
  if(q.presentationMode) checkQuizTick(fresh);
  await checkQuizAutoReveal(fresh);
}
function freshQuizQuestion(){
  return { id: cryptoId(), text:'', options:['',''], correctIndex:0, durationSeconds:30 };
}
function openQuizSetup(){
  state.professor.quiz.setup = { turmaId:'', numTeams:2, teams:[], questions:[freshQuizQuestion()] };
}
function quizAutoMontarEquipes(){
  const p = state.professor;
  const s = p.quiz.setup;
  const turma = p.turmas.find(t=>t.id===s.turmaId);
  if(!turma || turma.students.length===0){ alert('Essa turma não tem alunos cadastrados.'); return; }
  const n = Math.max(2, Math.min(8, parseInt(s.numTeams)||2));
  const shuffled = [...turma.students].sort(()=>Math.random()-0.5);
  const teams = [];
  for(let i=0;i<n;i++){ teams.push({ id: cryptoId(), name: 'Equipe '+(i+1), color: AVATAR_COLORS[i % AVATAR_COLORS.length], studentIds: [] }); }
  shuffled.forEach((st,i) => { teams[i % n].studentIds.push(st.id); });
  s.teams = teams;
  render();
}
function quizAssignStudentTeam(studentId, teamIdx){
  const s = state.professor.quiz.setup;
  s.teams.forEach(tm => { tm.studentIds = tm.studentIds.filter(id=>id!==studentId); });
  if(s.teams[teamIdx]) s.teams[teamIdx].studentIds.push(studentId);
  render();
}
async function startQuizSession(authorName){
  const p = state.professor;
  const s = p.quiz.setup;
  if(!s.turmaId){ alert('Selecione uma turma.'); return; }
  const turma = p.turmas.find(t=>t.id===s.turmaId);
  if(s.teams.length<2){ alert('Sorteie pelo menos 2 equipes.'); return; }
  if(s.teams.some(t=>t.studentIds.length===0)){ alert('Toda equipe precisa ter pelo menos 1 aluno.'); return; }
  for(const q of s.questions){
    if(!q.text.trim()){ alert('Preencha o texto de todas as perguntas.'); return; }
    if(q.options.filter(o=>o.trim()).length<2){ alert('Cada pergunta precisa de pelo menos 2 opções preenchidas.'); return; }
  }
  const scores = {};
  s.teams.forEach(t=>{ scores[t.id] = 0; });
  const quiz = {
    id: cryptoId(), turmaId: s.turmaId, turmaName: turma.name, authorName, createdAt: Date.now(),
    status: 'lobby',
    teams: s.teams.map(t => ({ id:t.id, name:t.name, color:t.color, studentIds:[...t.studentIds] })),
    questions: s.questions.map(q => ({ id:q.id, text:q.text.trim(), options:q.options.filter(o=>o.trim()), correctIndex:q.correctIndex, durationSeconds: parseInt(q.durationSeconds)||30 })),
    currentIndex: -1, currentAnswers: {}, currentStartedAt: null, scores,
    streaks: {}, teamPowers: {}, activePowers: {}, colaEliminated: {}, revealInfo: null
  };
  await saveQuizAtivo(quiz);
  p.quiz.current = quiz;
  p.quiz.setup = null;
  quizResetEffectsState();
  render();
}
async function quizNextQuestion(){
  const p = state.professor;
  const q = p.quiz.current;
  if(!q) return;
  const nextIdx = q.currentIndex + 1;
  if(nextIdx >= q.questions.length){
    q.status = 'ended';
  } else {
    q.teamPowers = q.teamPowers || {};
    // mecânica de "virada de jogo": a equipe em último lugar ganha um poder pra usar na próxima pergunta
    if(nextIdx > 0 && q.teams.length>=2){
      const sorted = [...q.teams].sort((a,b)=>(q.scores[a.id]||0)-(q.scores[b.id]||0));
      const lastTeam = sorted[0];
      const jaTem = lastTeam && q.teamPowers[lastTeam.id] && !q.teamPowers[lastTeam.id].used;
      if(lastTeam && !jaTem){
        const tipos = Object.keys(QUIZ_POWERS);
        q.teamPowers[lastTeam.id] = { type: tipos[Math.floor(Math.random()*tipos.length)], used:false };
      }
    }
    q.currentIndex = nextIdx;
    q.status = 'question';
    q.currentAnswers = {};
    q.activePowers = {};
    q.colaEliminated = {};
    q.revealInfo = null;
    q.currentStartedAt = Date.now();
  }
  await saveQuizAtivo(q);
  render();
}
async function quizRevealAnswer(){
  const p = state.professor;
  const q = p.quiz.current;
  if(!q || q.status!=='question') return;
  const question = q.questions[q.currentIndex];
  q.streaks = q.streaks || {};
  q.activePowers = q.activePowers || {};

  const distribution = question.options.map(()=>0);
  Object.values(q.currentAnswers||{}).forEach(ans => { if(distribution[ans.optionIndex]!==undefined) distribution[ans.optionIndex]++; });

  const correctStudentIds = [];
  const pointsAwarded = {};
  const comboBonuses = {};
  const correctTeamIds = [];

  q.teams.forEach(team => {
    let teamCorrectCount = 0;
    let teamPoints = 0;
    team.studentIds.forEach(sid => {
      const ans = q.currentAnswers[sid];
      if(ans && ans.optionIndex === question.correctIndex){
        const dur = question.durationSeconds || 30;
        const elapsed = Math.max(0, ((ans.at||q.currentStartedAt) - q.currentStartedAt)/1000);
        let pts = Math.round(10 - 5 * Math.min(1, elapsed/dur)); // de 10 (instantâneo) a 5 (no limite do tempo)
        pts = Math.max(5, pts);
        if(q.activePowers[team.id]==='dobro') pts = pts * 2;
        teamPoints += pts;
        correctStudentIds.push(sid);
        teamCorrectCount++;
      }
    });
    if(teamCorrectCount>0){
      correctTeamIds.push(team.id);
      const novaSequencia = (q.streaks[team.id]||0) + 1;
      q.streaks[team.id] = novaSequencia;
      if(novaSequencia>=3){
        teamPoints += 5;
        comboBonuses[team.id] = { streak: novaSequencia, bonus: 5 };
      }
    } else {
      q.streaks[team.id] = 0;
    }
    if(teamPoints>0){
      q.scores[team.id] = (q.scores[team.id]||0) + teamPoints;
      pointsAwarded[team.id] = teamPoints;
    }
  });

  q.revealInfo = { distribution, correctIndex: question.correctIndex, pointsAwarded, comboBonuses, correctTeamIds };
  q.status = 'reveal';
  q.activePowers = {};
  await saveQuizAtivo(q);
  render();
  awardFichasLote(q.turmaId, correctStudentIds.map(sid => ({ studentId: sid, amount: 3, motivo: 'Acertou uma pergunta no Quiz por Equipes', categoria: 'quiz' })));
}
async function activateQuizPower(){
  const al = state.aluno;
  const q = al.quizAtivo;
  if(!q) return;
  const myTeam = findMyQuizTeam(q, al.matriculaStudentId);
  if(!myTeam) return;
  const fresh = await aoVivoAtualizar('quiz-ativo', q.turmaId, o => {
    if(o.id!==q.id || o.status!=='question') return false;
    o.teamPowers = o.teamPowers || {};
    o.activePowers = o.activePowers || {};
    o.colaEliminated = o.colaEliminated || {};
    const power = o.teamPowers[myTeam.id];
    if(!power || power.used || o.activePowers[myTeam.id]) return false;
    power.used = true;
    o.activePowers[myTeam.id] = power.type;
    if(power.type==='cola'){
      const question = o.questions[o.currentIndex];
      const wrongIndices = question.options.map((_,i)=>i).filter(i=>i!==question.correctIndex);
      o.colaEliminated[myTeam.id] = wrongIndices[Math.floor(Math.random()*wrongIndices.length)];
    }
  });
  al.quizAtivo = quizComMinhaResposta(fresh);
  render();
}
async function quizClear(){
  if(!confirm('Encerrar esta sessão de quiz e apagar o placar?')) return;
  await saveQuizAtivo(null);
  state.professor.quiz.current = null;
  state.professor.quiz.presentationMode = false;
  quizResetEffectsState();
  render();
}
async function pollQuizForAluno(){
  const al = state.aluno;
  if(al.stage !== 'dashboard' || !al.turma) return false;
  const prev = al.quizAtivo;
  const q = quizComMinhaResposta(await loadQuizAtivo(al.turma.id));
  al.quizAtivo = (q && q.turmaId === al.turma.id) ? q : null;
  const changed = JSON.stringify(al.quizAtivo) !== JSON.stringify(prev);
  if(al.quizAtivo && al.quizAtivo.status==='reveal' && (!prev || prev.status!=='reveal' || prev.currentIndex!==al.quizAtivo.currentIndex)){
    const myTeam = findMyQuizTeam(al.quizAtivo, al.matriculaStudentId);
    if(myTeam){
      const question = al.quizAtivo.questions[al.quizAtivo.currentIndex];
      const minhaResposta = al.quizAtivo.currentAnswers && al.quizAtivo.currentAnswers[al.matriculaStudentId];
      const meAcertei = minhaResposta && minhaResposta.optionIndex===question.correctIndex;
      if(minhaResposta){ meAcertei ? quizPlayCorrect() : quizPlayWrong(); }
    }
  }
  return changed;
}
async function submitQuizAnswer(optionIndex){
  const al = state.aluno;
  const q = al.quizAtivo;
  if(!q || q.status!=='question') return;
  const key = al.matriculaStudentId;
  if(!key) return;
  if(q.currentAnswers && q.currentAnswers[key]) return;
  const resp = { optionIndex, at: Date.now() };
  al.quizMinha = { quizId: q.id, idx: q.currentIndex, resp };
  al.quizAtivo = quizComMinhaResposta(Object.assign({}, q));
  render();
  try{ await window.storage.set(quizRespPrefixo(q) + key, JSON.stringify(resp), true); }catch(e){}
}
function quizComMinhaResposta(q){
  const al = state.aluno; const m = al.quizMinha;
  if(!q || !m || !al.matriculaStudentId || m.quizId!==q.id || m.idx!==q.currentIndex) return q;
  if(q.currentAnswers && q.currentAnswers[al.matriculaStudentId]) return q;
  return Object.assign({}, q, { currentAnswers: Object.assign({}, q.currentAnswers||{}, { [al.matriculaStudentId]: m.resp }) });
}
function renderQuizSetupForm(){
  const p = state.professor;
  if(!p.quiz.setup) openQuizSetup();
  const s = p.quiz.setup;
  const turmaOptions = professorTurmas().map(t=>`<option value="${t.id}" ${s.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
  const turma = p.turmas.find(t=>t.id===s.turmaId);
  let teamsBlock = '';
  if(turma){
    teamsBlock = `
      <h3 style="margin-top:22px;">Equipes</h3>
      <div class="row" style="align-items:flex-end; gap:10px;">
        <div>
          <label>Número de equipes</label>
          <input type="number" id="quiz-num-teams-input" min="2" max="8" value="${s.numTeams}" style="max-width:100px;">
        </div>
        <button class="btn btn-ghost btn-sm" data-action="quiz-auto-montar-equipes">🎲 Sortear equipes</button>
      </div>
      ${s.teams.length===0 ? '<p class="muted" style="margin-top:8px;">Clique em "Sortear equipes" para dividir a turma automaticamente. Depois você pode ajustar quem fica em cada equipe.</p>' : `
        ${s.teams.map((team,ti) => `
          <div class="row" style="align-items:center; gap:8px; margin-top:10px;">
            <span style="width:16px; height:16px; border-radius:50%; background:${team.color}; display:inline-block; flex:0 0 auto;"></span>
            <input type="text" data-action="quiz-team-name-input" data-idx="${ti}" value="${esc(team.name)}" style="max-width:180px; font-weight:600;">
            <span class="muted">${team.studentIds.length} aluno(s)</span>
          </div>
        `).join('')}
        <h4 style="margin-top:14px;">Ajustar aluno por equipe</h4>
        ${turma.students.map(st => {
          const currentTeamIdx = s.teams.findIndex(tm=>tm.studentIds.includes(st.id));
          return `
            <div class="list-item">
              <span>${studentAvatarHtml(st,24)} ${esc(st.name)}</span>
              <select data-action="quiz-assign-student-team" data-sid="${st.id}">
                ${s.teams.map((tm,ti)=>`<option value="${ti}" ${ti===currentTeamIdx?'selected':''}>${esc(tm.name)}</option>`).join('')}
              </select>
            </div>
          `;
        }).join('')}
      `}
    `;
  }
  const questionsBlock = turma ? `
    <h3 style="margin-top:22px;">Perguntas</h3>
    ${s.questions.map((q,qi) => `
      <div class="card" style="margin-top:10px;">
        <div class="row" style="align-items:center; justify-content:space-between;">
          <strong>Pergunta ${qi+1}</strong>
          ${s.questions.length>1 ? `<button class="btn btn-danger btn-sm" data-action="quiz-remove-question" data-qidx="${qi}">Remover</button>` : ''}
        </div>
        <input type="text" data-action="quiz-question-text" data-qidx="${qi}" placeholder="Digite a pergunta" value="${esc(q.text)}" style="margin-top:8px;">
        <label style="margin-top:8px;">Opções (marque a correta)</label>
        ${q.options.map((opt,oi) => `
          <div class="row" style="margin-bottom:6px; align-items:center;">
            <input type="radio" name="quiz-correct-${qi}" data-action="quiz-set-correct" data-qidx="${qi}" data-oidx="${oi}" ${q.correctIndex===oi?'checked':''} style="width:auto;">
            <input type="text" data-action="quiz-option-text" data-qidx="${qi}" data-oidx="${oi}" placeholder="Opção ${oi+1}" value="${esc(opt)}" style="flex:1;">
            ${q.options.length>2 ? `<button class="btn btn-ghost btn-sm" data-action="quiz-remove-option" data-qidx="${qi}" data-oidx="${oi}">✕</button>` : ''}
          </div>
        `).join('')}
        <button class="btn btn-ghost btn-sm" data-action="quiz-add-option" data-qidx="${qi}">+ Opção</button>
        <label style="margin-top:8px;">Tempo para responder (segundos)</label>
        <input type="number" data-action="quiz-question-duration" data-qidx="${qi}" min="5" max="180" value="${q.durationSeconds}" style="max-width:100px;">
      </div>
    `).join('')}
    <button class="btn btn-ghost" style="margin-top:10px;" data-action="quiz-add-question">+ Nova pergunta</button>
  ` : '';
  const podeIniciar = turma && s.teams.length>=2 && s.teams.every(t=>t.studentIds.length>0) && s.questions.every(q=>q.text.trim() && q.options.filter(o=>o.trim()).length>=2);
  return `
    <div class="card">
      <h2>Quiz por Equipes</h2>
      <p class="muted">Divida a turma em equipes e faça uma disputa de perguntas e respostas com cronômetro, projetada na tela da sala.</p>
      <label>Turma</label>
      <select id="quiz-turma-select">
        <option value="">Selecione...</option>
        ${turmaOptions}
      </select>
      ${teamsBlock}
      ${questionsBlock}
      ${podeIniciar ? `
        <button class="btn btn-primary btn-block" style="margin-top:20px;" data-action="quiz-start-session">🚀 Iniciar Quiz</button>
      ` : (turma ? '<p class="muted" style="margin-top:12px;">Sorteie pelo menos 2 equipes (todas com aluno) e preencha todas as perguntas com pelo menos 2 opções para iniciar.</p>' : '')}
    </div>
  `;
}
function quizDistributionChartHtml(question, distribution, correctIndex, dark){
  const maxCount = Math.max(...distribution, 1);
  const labelColor = dark ? 'rgba(255,255,255,.85)' : '';
  return `
    <div class="dist-chart" style="margin-top:10px;">
      ${distribution.map((count,i) => `
        <div class="dist-col">
          <div class="dist-bar-wrap">
            <div class="dist-bar" style="height:${(count/maxCount)*100}%; background:${i===correctIndex?'var(--green)':'var(--red)'}; color:#fff;">${count>0?count:''}</div>
          </div>
          <div class="dist-label" style="${labelColor?'color:'+labelColor+';':''}">${String.fromCharCode(65+i)}${i===correctIndex?' ✓':''}</div>
        </div>
      `).join('')}
    </div>
  `;
}
function renderQuizLive(){
  const p = state.professor;
  const q = p.quiz.current;
  const bars = quizScoreboardBars(q, q.status==='reveal' ? `${q.id}:${q.currentIndex}:reveal` : null);
  const sortedTeams = bars.map(b=>b.team);
  const scoreboard = `
    <h3 style="margin-top:0;">Placar</h3>
    ${bars.map(b => `
      <div class="list-item" style="border-left:6px solid ${b.team.color}; flex-direction:column; align-items:stretch; gap:4px;">
        <div class="row" style="justify-content:space-between; align-items:center;">
          <span>${b.rank}º · ${esc(b.team.name)} <span class="muted">(${b.team.studentIds.length} aluno(s))</span>${quizComboBadgeHtml(q.revealInfo, b.team.id)}</span>
          <strong>${b.after} pts</strong>
        </div>
        <div class="chart-track"><div class="chart-fill quiz-bar-fill" style="width:${b.startPct}%; background:${b.team.color};" data-target="${b.targetPct}%"></div></div>
      </div>
    `).join('')}
  `;
  let body = '';
  if(q.status==='lobby'){
    body = `
      <p class="muted" style="margin-top:14px;">Pronto para começar. ${q.questions.length} pergunta(s) cadastrada(s).</p>
      <button class="btn btn-primary btn-block" data-action="quiz-next-question">▶ Começar pergunta 1</button>
    `;
  } else if(q.status==='question'){
    const question = q.questions[q.currentIndex];
    const remaining = Math.max(0, question.durationSeconds - Math.floor((Date.now()-q.currentStartedAt)/1000));
    const answeredCount = Object.keys(q.currentAnswers||{}).length;
    const totalStudents = q.teams.reduce((sum,t)=>sum+t.studentIds.length,0);
    body = `
      <div class="row" style="align-items:center; justify-content:space-between; margin-top:14px;">
        <h3 style="margin:0;">Pergunta ${q.currentIndex+1} de ${q.questions.length}</h3>
        <span class="pill" style="font-size:1.1rem;">⏱ ${remaining}s</span>
      </div>
      <p style="font-weight:600; font-size:1.15rem; margin-top:10px;">${esc(question.text)}</p>
      ${question.options.map((opt,i)=>`<p style="margin:4px 0;">${String.fromCharCode(65+i)}) ${esc(opt)}</p>`).join('')}
      <p class="muted" style="margin-top:10px;">${answeredCount} de ${totalStudents} já responderam. A resposta é revelada automaticamente quando o tempo acabar ou todos responderem.</p>
      <button class="btn btn-primary btn-block" style="margin-top:10px;" data-action="quiz-reveal-answer">Revelar agora</button>
    `;
  } else if(q.status==='reveal'){
    const question = q.questions[q.currentIndex];
    const isLast = q.currentIndex >= q.questions.length-1;
    const dist = q.revealInfo ? q.revealInfo.distribution : question.options.map(()=>0);
    body = `
      <h3 style="margin-top:14px;">Resposta certa: ${esc(question.options[question.correctIndex])}</h3>
      ${quizDistributionChartHtml(question, dist, question.correctIndex, false)}
      <p class="muted" style="margin-top:10px;">Pontos já somados ao placar acima.</p>
      <button class="btn btn-primary btn-block" style="margin-top:10px;" data-action="quiz-next-question">${isLast ? '🏁 Ver resultado final' : '▶ Próxima pergunta'}</button>
    `;
  } else if(q.status==='ended'){
    const winner = sortedTeams[0];
    body = `<h3 style="margin-top:14px;">🏆 Fim de jogo! Equipe campeã: ${esc(winner ? winner.name : '-')}</h3>`;
  }
  return `
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2>Quiz por Equipes — ${esc(q.turmaName)}</h2>
        <div class="row" style="flex:0 0 auto; gap:6px;">
          <button class="btn btn-ghost btn-sm" data-action="quiz-toggle-presentation">🖥️ Modo Apresentação</button>
          <button class="btn btn-danger btn-sm" data-action="quiz-clear">Encerrar sessão</button>
        </div>
      </div>
      ${scoreboard}
      ${body}
    </div>
  `;
}
function renderQuizEquipes(){
  const p = state.professor;
  if(p.quiz.current) return renderQuizLive();
  return renderQuizSetupForm();
}
function renderQuizPresentation(){
  const p = state.professor;
  const q = p.quiz.current;
  const bars = quizScoreboardBars(q, q.status==='reveal' ? `${q.id}:${q.currentIndex}:reveal-pres` : null);
  const sortedTeams = bars.map(b=>b.team);
  let center = '';
  if(q.status==='lobby'){
    center = `<h1 style="font-size:2.2rem; text-align:center;">Prontos para começar!</h1>`;
  } else if(q.status==='question'){
    const question = q.questions[q.currentIndex];
    const remaining = Math.max(0, question.durationSeconds - Math.floor((Date.now()-q.currentStartedAt)/1000));
    const urgente = remaining<=5;
    center = `
      <p data-countdown-start="${q.currentStartedAt}" data-countdown-dur="${question.durationSeconds}" class="${urgente?'quiz-timer-urgente':''}" style="text-align:center; font-size:4.5rem; font-weight:800; margin:10px 0; ${urgente?'color:var(--red);':''}">${remaining}</p>
      <h1 style="text-align:center; font-size:2rem; margin-top:0;">${esc(question.text)}</h1>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; max-width:760px; margin:20px auto;">
        ${question.options.map((opt,i)=>`<div style="background:var(--board); color:#fff; padding:18px; border-radius:10px; font-size:1.3rem; text-align:center;">${String.fromCharCode(65+i)}) ${esc(opt)}</div>`).join('')}
      </div>
    `;
  } else if(q.status==='reveal'){
    const question = q.questions[q.currentIndex];
    const dist = q.revealInfo ? q.revealInfo.distribution : question.options.map(()=>0);
    center = `
      <h1 style="text-align:center; font-size:2rem;">✅ Resposta: ${esc(question.options[question.correctIndex])}</h1>
      ${quizDistributionChartHtml(question, dist, question.correctIndex, true)}
    `;
  } else if(q.status==='ended'){
    center = `<h1 style="text-align:center; font-size:2.4rem;">🏆 ${esc(sortedTeams[0]?sortedTeams[0].name:'-')}</h1>`;
  }
  return `
    <div style="min-height:100vh; padding:30px; background:var(--paper);">
      <div class="row" style="justify-content:space-between; align-items:center;">
        <h2 style="margin:0;">${esc(q.turmaName)}</h2>
        <button class="btn btn-ghost" data-action="quiz-toggle-presentation">Sair do modo apresentação</button>
      </div>
      ${center}
      <div style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center; margin-top:20px;">
        ${bars.map(b=>`
          <div style="background:${b.team.color}; color:#fff; padding:14px 22px; border-radius:12px; text-align:center; min-width:160px;">
            <div style="font-size:1.3rem; font-weight:700;">${b.rank}º</div>
            <div style="font-size:1.05rem;">${esc(b.team.name)}${quizComboBadgeHtml(q.revealInfo, b.team.id)}</div>
            <div style="font-size:1.6rem; font-weight:800;">${b.after}</div>
            <div style="height:8px; background:rgba(255,255,255,.35); border-radius:5px; overflow:hidden; margin-top:6px;">
              <div class="chart-fill quiz-bar-fill" style="height:100%; width:${b.startPct}%; background:#fff;" data-target="${b.targetPct}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
      ${q.status==='question' ? `<div style="text-align:center; margin-top:24px;"><button class="btn btn-primary" data-action="quiz-reveal-answer">Revelar resposta</button></div>` : ''}
      ${q.status==='reveal' ? `<div style="text-align:center; margin-top:24px;"><button class="btn btn-primary" data-action="quiz-next-question">${q.currentIndex>=q.questions.length-1?'Ver resultado final':'Próxima pergunta'}</button></div>` : ''}
      ${q.status==='lobby' ? `<div style="text-align:center; margin-top:24px;"><button class="btn btn-primary" data-action="quiz-next-question">Começar pergunta 1</button></div>` : ''}
    </div>
  `;
}
function stopRoletaPoll(){
  if(roletaPollInterval){ clearInterval(roletaPollInterval); roletaPollInterval = null; }
}
function stopSlidesPoll(){
  if(slidesPollInterval){ clearInterval(slidesPollInterval); slidesPollInterval = null; }
}
async function loadRoletaAtiva(turmaId){
  const r = state.professor.roleta;
  return aoVivoCarregar('roleta-ativa', turmaId, [r.current && r.current.turmaId, r.turmaId]);
}
async function saveRoletaAtiva(obj, turmaId){
  const r = state.professor.roleta;
  await aoVivoSalvar('roleta-ativa', obj, turmaId || (r.current && r.current.turmaId) || r.turmaId);
}
async function refreshProfessorRoleta(){
  const rs = state.professor.roleta;
  const prev = JSON.stringify(rs.current);
  const fresh = await loadRoletaAtiva();
  rs.current = fresh;
  if(JSON.stringify(fresh) !== prev) render();
}
function girarRoleta(authorName){
  const p = state.professor;
  const rs = p.roleta;
  if(!rs.turmaId){ alert('Selecione uma turma.'); return; }
  const turma = p.turmas.find(t=>t.id===rs.turmaId);
  if(!turma || turma.students.length===0){ alert('Essa turma não tem alunos cadastrados.'); return; }
  let candidates = turma.students.filter(s=>!rs.historico.includes(s.id));
  if(candidates.length===0){ rs.historico = []; candidates = turma.students; }
  rs.spinning = true;
  render();
  let ticks = 0;
  const maxTicks = 16;
  const spinTimer = setInterval(() => {
    const pick = candidates[Math.floor(Math.random()*candidates.length)];
    ensureStudentGamification(pick);
    rs.spinDisplay = { name: pick.name, avatarEmoji: pick.avatarEmoji, avatarColor: pick.avatarColor };
    render();
    ticks++;
    if(ticks >= maxTicks){
      clearInterval(spinTimer);
      finalizarSorteio(candidates, authorName);
    }
  }, 90);
}
async function finalizarSorteio(candidates, authorName){
  const p = state.professor;
  const rs = p.roleta;
  const turma = p.turmas.find(t=>t.id===rs.turmaId);
  const picked = candidates[Math.floor(Math.random()*candidates.length)];
  ensureStudentGamification(picked);
  rs.historico.push(picked.id);
  rs.spinning = false;
  rs.spinDisplay = null;
  const obj = {
    id: cryptoId(), turmaId: rs.turmaId, turmaName: turma ? turma.name : '',
    authorName, createdAt: Date.now(),
    selectedStudentId: picked.id, selectedStudentName: picked.name,
    selectedAvatarEmoji: picked.avatarEmoji, selectedAvatarColor: picked.avatarColor,
    pergunta: (rs.pergunta||'').trim() || null,
    resposta: null, respondidoAt: null, fichasDadas: false
  };
  await saveRoletaAtiva(obj);
  rs.current = obj;
  render();
}
async function roletaDarFichas(){
  const cur = state.professor.roleta.current;
  if(!cur || cur.fichasDadas) return;
  await awardFichas(cur.turmaId, cur.selectedStudentId, 5, 'Participação no sorteio da roleta', 'roleta');
  cur.fichasDadas = true;
  await saveRoletaAtiva(cur);
  render();
}
function roletaReiniciarRodada(){
  if(!confirm('Reiniciar a rodada? Todos os alunos voltam a ser elegíveis para o próximo sorteio.')) return;
  state.professor.roleta.historico = [];
  render();
}
async function pollRoletaForAluno(){
  const al = state.aluno;
  if(al.stage !== 'dashboard' || !al.turma) return false;
  const prev = al.roletaAtiva;
  const r = await loadRoletaAtiva(al.turma.id);
  al.roletaAtiva = (r && r.turmaId === al.turma.id) ? r : null;
  return JSON.stringify(al.roletaAtiva) !== JSON.stringify(prev);
}
async function submitRoletaResposta(){
  const al = state.aluno;
  const r = al.roletaAtiva;
  if(!r || r.selectedStudentId !== al.matriculaStudentId) return;
  const input = document.getElementById('roleta-resposta-input');
  const text = input ? input.value.trim() : '';
  if(!text) return;
  let ok = false;
  const fresh = await aoVivoAtualizar('roleta-ativa', r.turmaId, o => { if(o.id !== r.id) return false; ok = true; o.resposta = text; o.respondidoAt = Date.now(); });
  if(!ok){ al.roletaAtiva = fresh; render(); return; }
  al.roletaAtiva = fresh;
  render();
  awardFichas(fresh.turmaId, al.matriculaStudentId, 2, 'Respondeu ao sorteio da roleta', 'roleta').then(()=>{
    if(state.aluno.stage==='dashboard') render();
  });
}
async function confirmarParticipacaoOralRoleta(){
  const al = state.aluno;
  const r = al.roletaAtiva;
  if(!r || r.selectedStudentId !== al.matriculaStudentId) return;
  let ok = false;
  const fresh = await aoVivoAtualizar('roleta-ativa', r.turmaId, o => { if(o.id !== r.id) return false; ok = true; o.resposta = '(participação oral confirmada)'; o.respondidoAt = Date.now(); });
  if(!ok){ al.roletaAtiva = fresh; render(); return; }
  al.roletaAtiva = fresh;
  render();
}
function renderRoleta(){
  const p = state.professor;
  const rs = p.roleta;
  const turmaOptions = professorTurmas().map(t=>`<option value="${t.id}" ${rs.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
  const turma = p.turmas.find(t=>t.id===rs.turmaId);
  const cur = rs.current;
  let displayBlock = '';
  if(rs.spinning && rs.spinDisplay){
    displayBlock = `
      <div style="text-align:center; margin:20px 0;">
        ${studentAvatarHtml(rs.spinDisplay, 90)}
        <h2 style="margin-top:10px;">${esc(rs.spinDisplay.name)}</h2>
        <p class="muted">Girando...</p>
      </div>
    `;
  } else if(cur && cur.turmaId===rs.turmaId){
    displayBlock = `
      <div style="text-align:center; margin:20px 0; border:3px solid var(--board-light); border-radius:14px; padding:20px;">
        ${studentAvatarHtml({avatarEmoji:cur.selectedAvatarEmoji, avatarColor:cur.selectedAvatarColor}, 90)}
        <h2 style="margin-top:10px;">🎉 ${esc(cur.selectedStudentName)}</h2>
        ${cur.pergunta ? `<p style="font-weight:600;">${esc(cur.pergunta)}</p>` : ''}
        ${cur.resposta ? `<p class="muted">Resposta: "${esc(cur.resposta)}"</p>` : '<p class="muted">Aguardando resposta / participação oral...</p>'}
        <div class="row" style="justify-content:center; gap:8px; margin-top:10px;">
          <button class="btn btn-ghost btn-sm" data-action="roleta-dar-fichas" ${cur.fichasDadas?'disabled':''}>${cur.fichasDadas?'✓ Fichas dadas':'🏅 Dar 5 fichas'}</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2>🎡 Roleta de Sorteio</h2>
        <button class="btn btn-ghost btn-sm" data-action="roleta-toggle-presentation">🖥️ Modo Apresentação</button>
      </div>
      <p class="muted">Sorteie um aluno da turma para responder, participar ou apresentar.</p>
      <label>Turma</label>
      <select id="roleta-turma-select">
        <option value="">Selecione...</option>
        ${turmaOptions}
      </select>
      <label style="margin-top:10px;">Pergunta (opcional)</label>
      <input type="text" id="roleta-pergunta-input" placeholder="Ex: O que significa esse conceito?" value="${esc(rs.pergunta)}">
      ${displayBlock}
      ${turma ? `
        <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="roleta-girar" ${rs.spinning?'disabled':''}>🎡 Girar roleta</button>
        <p class="muted" style="font-size:.8rem; margin-top:6px;">${rs.historico.length} de ${turma.students.length} já sorteado(s) nesta rodada.</p>
        <button class="btn btn-ghost btn-sm" data-action="roleta-reiniciar-rodada">Reiniciar rodada (todos elegíveis de novo)</button>
      ` : ''}
    </div>
  `;
}
function renderRoletaPresentation(){
  const p = state.professor;
  const rs = p.roleta;
  const cur = rs.current;
  let center = '';
  if(rs.spinning && rs.spinDisplay){
    center = `
      <div style="text-align:center;">
        <div style="font-size:6rem;">${esc(rs.spinDisplay.avatarEmoji||'🙂')}</div>
        <h1 style="font-size:2.4rem;">${esc(rs.spinDisplay.name)}</h1>
      </div>
    `;
  } else if(cur){
    center = `
      <div style="text-align:center;">
        <div style="font-size:7rem;">${esc(cur.selectedAvatarEmoji||'🙂')}</div>
        <h1 style="font-size:2.6rem;">🎉 ${esc(cur.selectedStudentName)}</h1>
        ${cur.pergunta ? `<p style="font-size:1.4rem; margin-top:10px;">${esc(cur.pergunta)}</p>` : ''}
        ${cur.resposta ? `<p style="font-size:1.2rem; color:var(--board-light); margin-top:10px;">"${esc(cur.resposta)}"</p>` : ''}
      </div>
    `;
  } else {
    center = `<h1 style="text-align:center; font-size:2rem;">Pronto para sortear!</h1>`;
  }
  return `
    <div style="min-height:100vh; padding:30px; background:var(--paper); display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative;">
      <div style="position:absolute; top:20px; right:20px;">
        <button class="btn btn-ghost" data-action="roleta-toggle-presentation">Sair do modo apresentação</button>
      </div>
      ${center}
      <button class="btn btn-primary" style="margin-top:30px; font-size:1.2rem; padding:14px 30px;" data-action="roleta-girar" ${rs.spinning?'disabled':''}>🎡 Girar roleta</button>
    </div>
  `;
}
let dueloLastTickSecond = null;
function stopDueloPoll(){
  if(dueloPollInterval){ clearInterval(dueloPollInterval); dueloPollInterval = null; }
  dueloLastTickSecond = null;
}
async function loadDueloAtivo(turmaId){
  const d = state.professor.duelo;
  return aoVivoCarregar('duelo-ativo', turmaId, [d.current && d.current.turmaId, d.turmaId]);
}
async function saveDueloAtivo(obj, turmaId){
  const d = state.professor.duelo;
  await aoVivoSalvar('duelo-ativo', obj, turmaId || (d.current && d.current.turmaId) || d.turmaId);
}
function dueloSortearDupla(){
  const ds = state.professor.duelo;
  const turma = state.professor.turmas.find(t=>t.id===ds.turmaId);
  if(!turma || turma.students.length<2){ alert('Essa turma precisa de pelo menos 2 alunos cadastrados.'); return; }
  const shuffled = [...turma.students].sort(()=>Math.random()-0.5);
  ds.studentAId = shuffled[0].id;
  ds.studentBId = shuffled[1].id;
  render();
}
async function startDuelo(authorName){
  const p = state.professor;
  const ds = p.duelo;
  if(!ds.turmaId){ alert('Selecione uma turma.'); return; }
  const turma = p.turmas.find(t=>t.id===ds.turmaId);
  if(!ds.studentAId || !ds.studentBId || ds.studentAId===ds.studentBId){ alert('Escolha dois alunos diferentes.'); return; }
  if(!ds.questionText.trim()){ alert('Digite a pergunta.'); return; }
  if(ds.options.filter(o=>o.trim()).length<2){ alert('Preencha pelo menos 2 opções.'); return; }
  const studentA = turma.students.find(s=>s.id===ds.studentAId);
  const studentB = turma.students.find(s=>s.id===ds.studentBId);
  const duelo = {
    id: cryptoId(), turmaId: ds.turmaId, turmaName: turma.name, authorName, createdAt: Date.now(),
    status: 'question',
    studentA: { id:studentA.id, name:studentA.name, avatarEmoji:studentA.avatarEmoji, avatarColor:studentA.avatarColor },
    studentB: { id:studentB.id, name:studentB.name, avatarEmoji:studentB.avatarEmoji, avatarColor:studentB.avatarColor },
    question: { text: ds.questionText.trim(), options: ds.options.filter(o=>o.trim()), correctIndex: ds.correctIndex, durationSeconds: parseInt(ds.durationSeconds)||20 },
    startedAt: Date.now(), answers: {}, winnerId: null
  };
  await saveDueloAtivo(duelo);
  p.duelo.current = duelo;
  dueloLastTickSecond = null;
  render();
}
function checkDueloTick(d){
  if(!d || d.status!=='question'){ dueloLastTickSecond = null; return; }
  const remaining = Math.max(0, Math.ceil((d.question.durationSeconds*1000 - (Date.now()-d.startedAt))/1000));
  if(remaining<=5 && remaining>0 && remaining!==dueloLastTickSecond){
    dueloLastTickSecond = remaining;
    quizPlayTick();
  }
  if(remaining<=0) dueloLastTickSecond = null;
}
async function refreshProfessorDuelo(){
  const ds = state.professor.duelo;
  const prev = JSON.stringify(ds.current);
  const fresh = await loadDueloAtivo();
  ds.current = fresh;
  if(JSON.stringify(fresh) !== prev) render();
  updateLiveCountdowns();
  if(ds.presentationMode) checkDueloTick(fresh);
  await checkDueloAutoReveal(fresh);
}
async function checkDueloAutoReveal(d){
  if(!d || d.status!=='question') return;
  const elapsed = (Date.now() - d.startedAt)/1000;
  const totalRespostas = Object.keys(d.answers||{}).length;
  if(elapsed >= (d.question.durationSeconds||20) || totalRespostas>=2){
    await dueloRevealAnswer();
  }
}
async function dueloRevealAnswer(){
  const p = state.professor;
  const d = p.duelo.current;
  if(!d || d.status!=='question') return;
  const ansA = d.answers[d.studentA.id];
  const ansB = d.answers[d.studentB.id];
  const acertouA = ansA && ansA.optionIndex===d.question.correctIndex;
  const acertouB = ansB && ansB.optionIndex===d.question.correctIndex;
  let winnerId = null;
  if(acertouA && acertouB){ winnerId = ansA.at<=ansB.at ? d.studentA.id : d.studentB.id; }
  else if(acertouA){ winnerId = d.studentA.id; }
  else if(acertouB){ winnerId = d.studentB.id; }
  d.winnerId = winnerId;
  d.status = 'reveal';
  await saveDueloAtivo(d);
  render();
  if(winnerId) triggerQuizConfetti();
  if(winnerId){
    const loserId = winnerId===d.studentA.id ? d.studentB.id : d.studentA.id;
    await awardFichasLote(d.turmaId, [{ studentId: winnerId, amount: 8, motivo: 'Venceu um Duelo', categoria: 'duelo' }, { studentId: loserId, amount: 2, motivo: 'Participou de um Duelo' }]);
  } else {
    await awardFichasLote(d.turmaId, [{ studentId: d.studentA.id, amount: 1, motivo: 'Participou de um Duelo' }, { studentId: d.studentB.id, amount: 1, motivo: 'Participou de um Duelo' }]);
  }
}
async function dueloClear(){
  await saveDueloAtivo(null);
  state.professor.duelo.current = null;
  state.professor.duelo.presentationMode = false;
  dueloLastTickSecond = null;
  render();
}
async function pollDueloForAluno(){
  const al = state.aluno;
  if(al.stage !== 'dashboard' || !al.turma) return false;
  const prev = al.dueloAtivo;
  const d = await loadDueloAtivo(al.turma.id);
  al.dueloAtivo = (d && d.turmaId === al.turma.id) ? d : null;
  const changed = JSON.stringify(al.dueloAtivo) !== JSON.stringify(prev);
  if(al.dueloAtivo && al.dueloAtivo.status==='reveal' && (!prev || prev.status!=='reveal' || prev.id!==al.dueloAtivo.id)){
    const souParticipante = al.dueloAtivo.studentA.id===al.matriculaStudentId || al.dueloAtivo.studentB.id===al.matriculaStudentId;
    if(souParticipante){
      al.dueloAtivo.winnerId===al.matriculaStudentId ? quizPlayCorrect() : quizPlayWrong();
    }
  }
  return changed;
}
async function submitDueloAnswer(optionIndex){
  const al = state.aluno;
  const d = al.dueloAtivo;
  if(!d || d.status!=='question') return;
  const souParticipante = d.studentA.id===al.matriculaStudentId || d.studentB.id===al.matriculaStudentId;
  if(!souParticipante) return;
  const fresh = await aoVivoAtualizar('duelo-ativo', d.turmaId, o => {
    if(o.id!==d.id || o.status!=='question') return false;
    o.answers = o.answers || {};
    if(o.answers[al.matriculaStudentId]) return false;
    o.answers[al.matriculaStudentId] = { optionIndex, at: Date.now() };
  });
  al.dueloAtivo = fresh;
  render();
}
function renderDuelo(){
  const p = state.professor;
  const ds = p.duelo;
  if(ds.current) return renderDueloLive();
  const turmaOptions = professorTurmas().map(t=>`<option value="${t.id}" ${ds.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
  const turma = p.turmas.find(t=>t.id===ds.turmaId);
  const dupla = (turma && ds.studentAId && ds.studentBId) ? {
    a: turma.students.find(s=>s.id===ds.studentAId), b: turma.students.find(s=>s.id===ds.studentBId)
  } : null;
  const podeIniciar = turma && ds.studentAId && ds.studentBId && ds.studentAId!==ds.studentBId && ds.questionText.trim() && ds.options.filter(o=>o.trim()).length>=2;
  return `
    <div class="card">
      <h2>⚔️ Modo Duelo</h2>
      <p class="muted">Escolha 2 alunos da turma pra uma disputa individual: ganha quem responder certo mais rápido.</p>
      <label>Turma</label>
      <select id="duelo-turma-select">
        <option value="">Selecione...</option>
        ${turmaOptions}
      </select>
      ${turma ? `
        <div class="row" style="align-items:flex-end; gap:10px; margin-top:12px;">
          <div style="flex:1;">
            <label>Aluno A</label>
            <select id="duelo-student-a-select">
              <option value="">Selecione...</option>
              ${turma.students.map(s=>`<option value="${s.id}" ${ds.studentAId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}
            </select>
          </div>
          <div style="flex:1;">
            <label>Aluno B</label>
            <select id="duelo-student-b-select">
              <option value="">Selecione...</option>
              ${turma.students.map(s=>`<option value="${s.id}" ${ds.studentBId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-ghost btn-sm" data-action="duelo-sortear-dupla">🎲 Sortear dupla</button>
        </div>
        ${dupla && dupla.a && dupla.b ? `
          <div class="row" style="justify-content:center; align-items:center; gap:14px; margin-top:14px;">
            <div style="text-align:center;">${studentAvatarHtml(dupla.a,50)}<div>${esc(dupla.a.name)}</div></div>
            <strong style="font-size:1.4rem;">VS</strong>
            <div style="text-align:center;">${studentAvatarHtml(dupla.b,50)}<div>${esc(dupla.b.name)}</div></div>
          </div>
        ` : ''}
        <label style="margin-top:14px;">Pergunta</label>
        <input type="text" id="duelo-question-input" placeholder="Digite a pergunta" value="${esc(ds.questionText)}">
        <label style="margin-top:8px;">Opções (marque a correta)</label>
        ${ds.options.map((opt,i) => `
          <div class="row" style="margin-bottom:6px; align-items:center;">
            <input type="radio" name="duelo-correct" data-action="duelo-set-correct" data-idx="${i}" ${ds.correctIndex===i?'checked':''} style="width:auto;">
            <input type="text" data-action="duelo-option-text" data-idx="${i}" placeholder="Opção ${i+1}" value="${esc(opt)}" style="flex:1;">
            ${ds.options.length>2 ? `<button class="btn btn-ghost btn-sm" data-action="duelo-remove-option" data-idx="${i}">✕</button>` : ''}
          </div>
        `).join('')}
        <button class="btn btn-ghost btn-sm" data-action="duelo-add-option">+ Opção</button>
        <label style="margin-top:8px;">Tempo para responder (segundos)</label>
        <input type="number" id="duelo-duration-input" min="5" max="120" value="${ds.durationSeconds}" style="max-width:100px;">
        ${podeIniciar ? `<button class="btn btn-primary btn-block" style="margin-top:16px;" data-action="duelo-start">⚔️ Iniciar Duelo</button>` : '<p class="muted" style="margin-top:12px;">Escolha 2 alunos diferentes e preencha a pergunta com pelo menos 2 opções.</p>'}
      ` : ''}
    </div>
  `;
}
function renderDueloLive(){
  const p = state.professor;
  const d = p.duelo.current;
  let body = '';
  if(d.status==='question'){
    const remaining = Math.max(0, d.question.durationSeconds - Math.floor((Date.now()-d.startedAt)/1000));
    const respA = d.answers[d.studentA.id];
    const respB = d.answers[d.studentB.id];
    body = `
      <div class="row" style="justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">${esc(d.question.text)}</h3>
        <span class="pill" style="font-size:1.1rem;">⏱ ${remaining}s</span>
      </div>
      <div class="row" style="justify-content:center; gap:20px; margin-top:14px;">
        ${dueloStudentCardHtml(d.studentA, { resposta: respA?Math.round((respA.at-d.startedAt)/1000):null })}
        ${dueloStudentCardHtml(d.studentB, { resposta: respB?Math.round((respB.at-d.startedAt)/1000):null })}
      </div>
      <p class="muted" style="margin-top:10px; text-align:center;">A resposta é revelada automaticamente quando os dois responderem ou o tempo acabar.</p>
      <button class="btn btn-primary btn-block" style="margin-top:10px;" data-action="duelo-reveal">Revelar agora</button>
    `;
  } else if(d.status==='reveal'){
    body = `
      <h3 style="text-align:center;">Resposta certa: ${esc(d.question.options[d.question.correctIndex])}</h3>
      <div class="row" style="justify-content:center; gap:20px; margin-top:14px;">
        ${dueloStudentCardHtml(d.studentA, { vencedor: d.winnerId===d.studentA.id })}
        ${dueloStudentCardHtml(d.studentB, { vencedor: d.winnerId===d.studentB.id })}
      </div>
      ${!d.winnerId ? '<p class="muted" style="text-align:center; margin-top:10px;">Ninguém acertou dessa vez.</p>' : ''}
      <button class="btn btn-primary btn-block" style="margin-top:16px;" data-action="duelo-clear">🏁 Encerrar e começar outro</button>
    `;
  }
  return `
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2>⚔️ Duelo — ${esc(d.turmaName)}</h2>
        <div class="row" style="flex:0 0 auto; gap:6px;">
          <button class="btn btn-ghost btn-sm" data-action="duelo-toggle-presentation">🖥️ Modo Apresentação</button>
          <button class="btn btn-danger btn-sm" data-action="duelo-clear">Encerrar</button>
        </div>
      </div>
      ${body}
    </div>
  `;
}
function renderDueloPresentation(){
  const p = state.professor;
  const d = p.duelo.current;
  let center = '';
  if(d.status==='question'){
    const remaining = Math.max(0, d.question.durationSeconds - Math.floor((Date.now()-d.startedAt)/1000));
    const urgente = remaining<=5;
    center = `
      <p data-countdown-start="${d.startedAt}" data-countdown-dur="${d.question.durationSeconds}" class="${urgente?'quiz-timer-urgente':''}" style="text-align:center; font-size:4rem; font-weight:800; margin:6px 0; ${urgente?'color:var(--red);':''}">${remaining}</p>
      <h1 style="text-align:center; font-size:1.8rem;">${esc(d.question.text)}</h1>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; max-width:700px; margin:16px auto;">
        ${d.question.options.map((opt,i)=>`<div style="background:var(--board); color:#fff; padding:16px; border-radius:10px; font-size:1.2rem; text-align:center;">${String.fromCharCode(65+i)}) ${esc(opt)}</div>`).join('')}
      </div>
    `;
  } else if(d.status==='reveal'){
    center = `<h1 style="text-align:center; font-size:1.8rem;">✅ Resposta: ${esc(d.question.options[d.question.correctIndex])}</h1>`;
  }
  return `
    <div style="min-height:100vh; padding:30px; background:var(--paper);">
      <div class="row" style="justify-content:space-between; align-items:center;">
        <h2 style="margin:0;">Duelo — ${esc(d.turmaName)}</h2>
        <button class="btn btn-ghost" data-action="duelo-toggle-presentation">Sair do modo apresentação</button>
      </div>
      ${center}
      <div style="display:flex; justify-content:center; align-items:center; gap:30px; margin-top:26px;">
        ${dueloStudentCardHtml(d.studentA, { vencedor: d.status==='reveal' && d.winnerId===d.studentA.id })}
        <strong style="font-size:1.6rem;">VS</strong>
        ${dueloStudentCardHtml(d.studentB, { vencedor: d.status==='reveal' && d.winnerId===d.studentB.id })}
      </div>
      ${d.status==='question' ? `<div style="text-align:center; margin-top:24px;"><button class="btn btn-primary" data-action="duelo-reveal">Revelar resposta</button></div>` : ''}
      ${d.status==='reveal' ? `<div style="text-align:center; margin-top:24px;"><button class="btn btn-primary" data-action="duelo-clear">Encerrar e começar outro</button></div>` : ''}
    </div>
  `;
}
const JG_ART_CARREGANDO = {};
async function jgArteCarregar(tipo){
  if(!tipo || JG_ART[tipo] || JG_ART_CARREGANDO[tipo]) return; JG_ART_CARREGANDO[tipo] = true;
  let a = null; try{ a = await planoLerJson('jogo-arte:' + tipo, null); }catch(e){}
  JG_ART[tipo] = a || {}; JG_ART_CARREGANDO[tipo] = false;
  const regras = Object.entries(JG_ART[tipo]).map(([k, v]) => `--jg-art-${tipo}-${k}:url("${v}");`).join('');
  if(regras){ try{ const st = document.createElement('style'); st.dataset.jgArte = tipo; st.textContent = `:root{${regras}}`; document.head.appendChild(st); }catch(e){} }
  try{ avRenderSeguro(); }catch(e){ try{ render(); }catch(_){} }
}
function jgArtVar(tipo, k){ jgArteCarregar(tipo); return `var(--jg-art-${tipo}-${k}, none)`; }
function jgArteFaltando(){ return ['escada','qes','naval','missao'].every(t => JG_ART[t] && !Object.keys(JG_ART[t]).length); }
__parteOk('interativos');
