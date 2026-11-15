/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "slides" */
const slideImgCache = {};
async function getSlideImg(deckId, index){
  const key = `${deckId}:${index}`;
  if(Object.prototype.hasOwnProperty.call(slideImgCache, key)) return slideImgCache[key];
  try{
    const r = await window.storage.get(`slide-img:${deckId}:${index}`, true);
    const url = r && r.value ? JSON.parse(r.value) : null;
    slideImgCache[key] = url;
    return url;
  }catch(e){ return null; }
}
async function loadSlidesDecks(){
  const s = state.professor.slides;
  s.decksLoading = true; render();
  try{ const r = await window.storage.get('slides-decks', true); s.decks = r && r.value ? JSON.parse(r.value) : []; }
  catch(e){ s.decks = []; }
  s.decksLoading = false; render();
}
async function loadSlidesSessaoAtiva(turmaId){
  const s = state.professor.slides;
  return aoVivoCarregar('slides-sessao-ativa', turmaId, [s.current && s.current.turmaId, s.turmaId]);
}
async function saveSlidesSessaoAtiva(obj, turmaId){
  const s = state.professor.slides;
  await aoVivoSalvar('slides-sessao-ativa', obj, turmaId || (s.current && s.current.turmaId) || s.turmaId);
}
const SLIDES_STALE_MS = 75000;
async function loadSlidesEngajamento(sessao){
  if(!sessao || !sessao.id) return {};
  const lista = await liveListar(`slides-eng:${sessao.id}:`);
  const out = {};
  Object.entries(lista).forEach(([sid, v]) => { try{ out[sid] = JSON.parse(v); }catch(e){} });
  return out;
}
const slidesHeartbeatUltimo = {};
async function sendSlidesHeartbeat(sessaoId, studentId, name, inFullscreen){
  if(!studentId || !sessaoId) return;
  const u = slidesHeartbeatUltimo[sessaoId+':'+studentId];
  if(u && u.fs===inFullscreen && Date.now() - u.at < 50000) return;
  slidesHeartbeatUltimo[sessaoId+':'+studentId] = { fs: inFullscreen, at: Date.now() };
  try{ await window.storage.set(`slides-eng:${sessaoId}:${studentId}`, JSON.stringify({ name, inFullscreen, at: Date.now() }), true); }catch(e){}
}
async function refreshProfessorSlides(){
  const s = state.professor.slides;
  const prevId = s.current ? s.current.id : null;
  const prevIndex = s.current ? s.current.currentIndex : null;
  const prevEngajamento = JSON.stringify(s.engajamento);
  const prevImg = s.currentSlideImg;
  s.current = await loadSlidesSessaoAtiva();
  if(s.current){
    s.engajamento = await loadSlidesEngajamento(s.current);
    if(s.current.id !== prevId || s.current.currentIndex !== prevIndex || !s.currentSlideImg){
      s.currentSlideImg = await getSlideImg(s.current.deckId, s.current.currentIndex);
    }
  } else {
    s.engajamento = null;
    s.currentSlideImg = null;
  }
  const newId = s.current ? s.current.id : null;
  const newIndex = s.current ? s.current.currentIndex : null;
  const changed = newId !== prevId || newIndex !== prevIndex || JSON.stringify(s.engajamento) !== prevEngajamento || s.currentSlideImg !== prevImg;
  if(changed) render();
}
function slideFailurePlaceholder(pageNum){
  const canvas = document.createElement('canvas');
  canvas.width = 1280; canvas.height = 720;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f4e9ec'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#5c1a2b'; ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`Slide ${pageNum} indisponível`, canvas.width/2, canvas.height/2 - 10);
  ctx.font = '24px sans-serif';
  ctx.fillText('Não foi possível processar esta página', canvas.width/2, canvas.height/2 + 34);
  return canvas.toDataURL('image/jpeg', 0.7);
}
async function handleSlidesPdfUpload(file, authorName){
  const s = state.professor.slides;
  if(!file) return;
  if(file.type !== 'application/pdf'){ alert('Selecione um arquivo PDF.'); return; }
  if(file.size > SLIDES_MAX_FILE_MB * 1024 * 1024){
    s.uploadError = `Esse PDF tem mais de ${SLIDES_MAX_FILE_MB}MB. Tente exportar com qualidade menor ou dividir em duas apresentações.`;
    render();
    return;
  }
  const title = (s.uploadTitle||'').trim() || file.name.replace(/\.pdf$/i,'');
  s.uploading = true; s.uploadError = ''; s.uploadProgress = null; render();
  try{
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const deckId = cryptoId();
    const total = pdf.numPages;
    if(total > SLIDES_MAX_PAGES){
      s.uploadError = `Esse PDF tem ${total} páginas — o limite atual é ${SLIDES_MAX_PAGES}. Tente dividir em duas apresentações menores.`;
      s.uploading = false;
      render();
      return;
    }
    let failCount = 0;
    for(let i=1; i<=total; i++){
      s.uploadProgress = { current: i, total };
      render();
      let dataUrl;
      try{
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const targetWidth = 1280;
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(scaledViewport.width);
        canvas.height = Math.round(scaledViewport.height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        if(dataUrl.length > 950000){
          // muito grande para caber com folga num documento do Firestore (limite de 1MB) — tenta comprimir mais
          dataUrl = canvas.toDataURL('image/jpeg', 0.35);
        }
      }catch(pageErr){
        dataUrl = slideFailurePlaceholder(i);
        failCount++;
      }
      try{
        await window.storage.set(`slide-img:${deckId}:${i-1}`, JSON.stringify(dataUrl), true);
      }catch(saveErr){
        // não coube no Firestore mesmo comprimido — grava um aviso no lugar dessa página
        await window.storage.set(`slide-img:${deckId}:${i-1}`, JSON.stringify(slideFailurePlaceholder(i)), true);
        failCount++;
      }
    }
    const deckMeta = { id: deckId, title, totalSlides: total, createdAt: Date.now(), professorName: authorName || (state.professor.session?state.professor.session.displayName:'Professor') };
    let freshDecks;
    try{ const r = await window.storage.get('slides-decks', true); freshDecks = r && r.value ? JSON.parse(r.value) : []; }catch(e){ freshDecks = s.decks; }
    freshDecks.push(deckMeta);
    await window.storage.set('slides-decks', JSON.stringify(freshDecks), true);
    s.decks = freshDecks;
    s.uploadTitle = '';
    const fileInput = document.getElementById('slides-pdf-input');
    if(fileInput) fileInput.value = '';
    if(failCount > 0){
      s.uploadError = `Conjunto salvo, mas ${failCount} de ${total} slide(s) não puderam ser processados corretamente (ficaram com um aviso no lugar). Tente reexportar o PDF com qualidade menor se isso incomodar.`;
    }
  }catch(e){
    s.uploadError = 'Não foi possível processar esse PDF. Verifique se o arquivo não está corrompido ou protegido, e tente novamente.';
  }
  s.uploading = false;
  s.uploadProgress = null;
  render();
}
async function deleteSlidesDeck(deckId){
  if(!confirm('Excluir esse conjunto de slides? Essa ação não pode ser desfeita.')) return;
  const s = state.professor.slides;
  let fresh;
  try{ const r = await window.storage.get('slides-decks', true); fresh = r && r.value ? JSON.parse(r.value) : []; }catch(e){ fresh = s.decks; }
  const deck = fresh.find(d=>d.id===deckId);
  fresh = fresh.filter(d=>d.id!==deckId);
  await window.storage.set('slides-decks', JSON.stringify(fresh), true);
  s.decks = fresh;
  if(s.selectedDeckId===deckId) s.selectedDeckId = null;
  if(deck){
    for(let i=0; i<deck.totalSlides; i++){
      try{ await window.storage.delete(`slide-img:${deckId}:${i}`, true); }catch(e){}
    }
  }
  render();
}
async function iniciarApresentacaoSlides(authorName){
  const s = state.professor.slides;
  if(!s.turmaId){ alert('Selecione uma turma.'); return; }
  if(!s.selectedDeckId){ alert('Selecione um conjunto de slides.'); return; }
  const deck = s.decks.find(d=>d.id===s.selectedDeckId);
  if(!deck) return;
  const turma = state.professor.turmas.find(t=>t.id===s.turmaId);
  const obj = {
    id: cryptoId(), deckId: deck.id, deckTitle: deck.title, totalSlides: deck.totalSlides,
    turmaId: s.turmaId, turmaName: turma ? turma.name : '', currentIndex: 0,
    active: true, startedAt: Date.now(), professorName: authorName || (state.professor.session?state.professor.session.displayName:'Professor')
  };
  await saveSlidesSessaoAtiva(obj);
  s.current = obj;
  s.engajamento = {};
  s.currentSlideImg = await getSlideImg(deck.id, 0);
  render();
}
async function irParaSlide(delta){
  const s = state.professor.slides;
  if(!s.current) return;
  const novo = Math.min(s.current.totalSlides-1, Math.max(0, s.current.currentIndex+delta));
  if(novo === s.current.currentIndex) return;
  s.current.currentIndex = novo;
  s.currentSlideImg = await getSlideImg(s.current.deckId, novo);
  render();
  saveSlidesSessaoAtiva(s.current);
}
async function loadSlidesHistorico(){
  const s = state.professor.slides;
  s.historicoLoading = true; render();
  try{ const r = await window.storage.get('slides-historico', true); s.historico = r && r.value ? JSON.parse(r.value) : []; }
  catch(e){ s.historico = []; }
  s.historicoLoading = false; render();
}
async function registrarHistoricoSlides(sessao, engajamentoFinal){
  const turma = state.professor.turmas.find(t=>t.id===sessao.turmaId);
  const alunos = turma ? turma.students : [];
  const now = Date.now();
  const STALE_MS = SLIDES_STALE_MS;
  let emTela = 0, saiu = 0;
  alunos.forEach(al => {
    const e = engajamentoFinal[al.id];
    if(!e || (now - e.at) > STALE_MS) return;
    if(e.inFullscreen) emTela++; else saiu++;
  });
  const consideraveis = emTela + saiu;
  const pctFinal = consideraveis>0 ? Math.round((emTela/consideraveis)*100) : null;
  const registro = {
    id: cryptoId(), deckId: sessao.deckId, deckTitle: sessao.deckTitle, turmaId: sessao.turmaId, turmaName: sessao.turmaName,
    totalSlides: sessao.totalSlides, professorName: sessao.professorName,
    startedAt: sessao.startedAt, endedAt: now, engajamentoFinalPct: pctFinal
  };
  let fresh;
  try{ const r = await window.storage.get('slides-historico', true); fresh = r && r.value ? JSON.parse(r.value) : []; }catch(e){ fresh = []; }
  fresh.unshift(registro);
  fresh = fresh.slice(0, 50); // mantém só os 50 registros mais recentes
  try{ await window.storage.set('slides-historico', JSON.stringify(fresh), true); }catch(e){}
  state.professor.slides.historico = fresh;
}
async function encerrarApresentacaoSlides(){
  const s = state.professor.slides;
  if(s.current){
    const engFinal = await loadSlidesEngajamento(s.current);
    await registrarHistoricoSlides(s.current, engFinal);
    await saveSlidesSessaoAtiva(null, s.current.turmaId);
  }
  s.current = null;
  s.presentationMode = false;
  s.engajamento = null;
  s.currentSlideImg = null;
  render();
}
function renderSlides(){
  const p = state.professor;
  const s = p.slides;
  const turmaOptions = professorTurmas().map(t=>`<option value="${t.id}" ${s.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('');

  if(s.current){
    const turma = p.turmas.find(t=>t.id===s.current.turmaId);
    const alunos = turma ? turma.students : [];
    const eng = s.engajamento || {};
    const now = Date.now();
    const STALE_MS = SLIDES_STALE_MS;
    let emTela = 0, saiu = 0;
    const linhas = alunos.map(al => {
      const e = eng[al.id];
      let status, cls;
      if(!e || (now - e.at) > STALE_MS){ status = '⚫ Offline'; cls = 'muted'; }
      else if(e.inFullscreen){ status = '✅ Em tela cheia'; cls = ''; emTela++; }
      else { status = '⚠️ Saiu da tela cheia'; cls = 'err'; saiu++; }
      return `<div class="list-item"><span>${studentAvatarHtml(al,22)} ${esc(al.name)}</span><span class="${cls}" style="font-size:.82rem;">${status}</span></div>`;
    });
    const consideraveis = emTela + saiu;
    const pct = consideraveis>0 ? Math.round((emTela/consideraveis)*100) : null;
    const baixo = pct!==null && pct < 60;
    return `
      <div class="card">
        <h2>🖥️ Apresentação em andamento</h2>
        <p class="muted">${esc(s.current.deckTitle)} · Turma ${esc(s.current.turmaName)}</p>
        <div class="row" style="align-items:center; gap:14px; margin:14px 0; flex-wrap:wrap;">
          ${s.currentSlideImg ? `<img src="${s.currentSlideImg}" style="width:220px; border-radius:10px; border:1px solid var(--paper-line);">` : '<div class="spinner"></div>'}
          <div>
            <h3 style="margin:0;">Slide ${s.current.currentIndex+1} de ${s.current.totalSlides}</h3>
            <div class="row" style="gap:8px; margin-top:8px;">
              <button class="btn btn-ghost btn-sm" data-action="slide-anterior" ${s.current.currentIndex===0?'disabled':''}>⬅ Anterior</button>
              <button class="btn btn-primary btn-sm" data-action="slide-proximo" ${s.current.currentIndex>=s.current.totalSlides-1?'disabled':''}>Próximo ➡</button>
            </div>
          </div>
        </div>
        <div class="row" style="gap:8px; margin-bottom:14px; flex-wrap:wrap;">
          <button class="btn btn-ghost" data-action="slides-toggle-presentation">📽️ Abrir modo projeção (nesta aba)</button>
          <button class="btn btn-ghost" data-action="encerrar-apresentacao-slides">Encerrar apresentação</button>
        </div>
        <p class="muted" style="font-size:.8rem;">Dica: para o modo projeção aparecer limpo (sem esse painel) na TV/projetor, abra a Sala de Avaliações numa segunda aba ou dispositivo conectado à TV, entre como este mesmo professor e clique em "Abrir modo projeção" só nela. Este painel com o engajamento fica só neste dispositivo, com você.</p>

        ${baixo ? `
        <div style="background:var(--accent-yellow-bg,#fdf3e8); border:1px solid var(--yellow-dark); border-radius:10px; padding:14px; margin:14px 0;">
          <strong>💡 Engajamento baixo (${pct}%)</strong>
          <p style="margin:6px 0 10px; font-size:.9rem;">Parte da turma saiu da apresentação. Que tal uma pausa com uma enquete, um quiz relâmpago ou chamar alguém na roleta para reengajar a turma?</p>
          <div class="row" style="gap:8px; flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" data-action="sub-view" data-sub="enquete">📣 Enquete</button>
            <button class="btn btn-ghost btn-sm" data-action="sub-view" data-sub="jogos">🎮 Jogo</button>
            <button class="btn btn-ghost btn-sm" data-action="sub-view" data-sub="roleta">🎡 Roleta</button>
          </div>
        </div>
        ` : ''}

        <h3>Engajamento da turma${pct!==null ? ` — ${pct}% em tela cheia` : ''}</h3>
        ${alunos.length===0 ? '<p class="muted">Essa turma não tem alunos cadastrados.</p>' : linhas.join('')}
      </div>
    `;
  }

  return `
    <div class="card">
      <h2>🖥️ Apresentação de Slides</h2>
      <p class="muted">Suba um PDF com os slides prontos (exportado do PowerPoint, Google Slides, Canva etc.) e apresente para a turma — os tablets dos alunos acompanham em tela cheia, sincronizados com você. Funciona melhor em tablets Android com Chrome.</p>
      <label>Título do conjunto de slides</label>
      <input type="text" id="slides-title-input" value="${esc(s.uploadTitle)}" placeholder="Ex: Aula 5 — Circuitos elétricos">
      <input type="file" id="slides-pdf-input" accept="application/pdf" style="margin-top:8px;">
      ${s.uploadError ? `<p class="err">${esc(s.uploadError)}</p>` : ''}
      ${s.uploading ? `
        <div class="spinner"></div>
        <p class="muted">${s.uploadProgress ? `Processando slide ${s.uploadProgress.current} de ${s.uploadProgress.total}...` : 'Lendo o PDF...'}</p>
        ${s.uploadProgress ? `
          <div style="background:var(--paper-line); border-radius:6px; overflow:hidden; height:10px; margin-top:4px;">
            <div style="width:${Math.min(100, Math.round((s.uploadProgress.current/s.uploadProgress.total)*100))}%; height:100%; background:var(--teal); transition:width .2s;"></div>
          </div>
        ` : ''}
      ` : ''}
      <div style="background:var(--tint-teal); border-radius:10px; padding:12px 14px; margin-top:14px; font-size:.82rem; color:var(--ink-soft);">
        <strong>💡 Bom saber:</strong>
        <ul style="margin:6px 0 0; padding-left:18px; line-height:1.5;">
          <li>O acompanhamento de "tela cheia" funciona melhor em <strong>tablets Android com Chrome</strong>. Em iPad/Safari ou notebooks, o percentual de engajamento pode ficar menos preciso.</li>
          <li>Limite de ${SLIDES_MAX_PAGES} slides e ${SLIDES_MAX_FILE_MB}MB por PDF. Slides com imagens muito pesadas que não couberem aparecem com um aviso no lugar — tente exportar com qualidade "Padrão" em vez de "Alta" se isso acontecer.</li>
        </ul>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">Meus conjuntos de slides</h3>
      ${s.decksLoading ? '<div class="spinner"></div>' : (s.decks.length===0 ? '<p class="muted">Nenhum slide enviado ainda.</p>' : s.decks.map(d => `
        <div class="list-item">
          <div>
            <strong>${esc(d.title)}</strong><br>
            <span class="muted" style="font-size:.8rem;">${d.totalSlides} slide(s) · enviado em ${new Date(d.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          <div class="row" style="gap:6px;">
            <button class="btn ${s.selectedDeckId===d.id?'btn-primary':'btn-ghost'} btn-sm" data-action="slides-selecionar-deck" data-id="${d.id}">${s.selectedDeckId===d.id?'Selecionado':'Usar'}</button>
            <button class="btn btn-ghost btn-sm" data-action="slides-excluir-deck" data-id="${d.id}">🗑️</button>
          </div>
        </div>
      `).join(''))}
    </div>

    ${s.selectedDeckId ? `
    <div class="card">
      <h3 style="margin-top:0;">Iniciar apresentação</h3>
      <label>Turma</label>
      <select id="slides-turma-select">${turmaOptions}</select>
      <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="slides-iniciar-apresentacao">▶️ Iniciar apresentação</button>
    </div>
    ` : ''}

    <div class="card">
      <h3 style="margin-top:0;">Histórico de apresentações</h3>
      ${s.historicoLoading ? '<div class="spinner"></div>' : (s.historico.length===0 ? '<p class="muted">Nenhuma apresentação encerrada ainda.</p>' : s.historico.slice(0,15).map(h => {
        const duracaoMin = Math.max(1, Math.round((h.endedAt - h.startedAt)/60000));
        return `
        <div class="list-item">
          <div>
            <strong>${esc(h.deckTitle)}</strong> <span class="muted">· ${esc(h.turmaName)}</span><br>
            <span class="muted" style="font-size:.8rem;">${new Date(h.startedAt).toLocaleDateString('pt-BR')} · ${duracaoMin} min · ${h.totalSlides} slide(s)</span>
          </div>
          <span class="pill" style="font-size:.78rem;">${h.engajamentoFinalPct!==null ? h.engajamentoFinalPct+'% em tela cheia' : 'sem dados'}</span>
        </div>
      `;
      }).join(''))}
    </div>
  `;
}
function renderSlidesPresentation(){
  const s = state.professor.slides;
  const cur = s.current;
  return `
    <div class="slides-proj-wrap">
      <div class="slides-proj-topbar">
        <span>${esc(cur.turmaName)} · ${esc(cur.deckTitle)}</span>
        <button class="btn btn-ghost btn-sm" data-action="slides-toggle-presentation">Sair do modo projeção</button>
      </div>
      <div class="slides-proj-stage">
        ${s.currentSlideImg ? `<img src="${s.currentSlideImg}" alt="Slide ${cur.currentIndex+1}">` : '<div class="spinner"></div>'}
      </div>
      <div class="slides-proj-footer">
        <button class="btn btn-ghost" data-action="slide-anterior" ${cur.currentIndex===0?'disabled':''}>⬅ Anterior</button>
        <span>${cur.currentIndex+1} / ${cur.totalSlides}</span>
        <button class="btn btn-primary" data-action="slide-proximo" ${cur.currentIndex>=cur.totalSlides-1?'disabled':''}>Próximo ➡</button>
      </div>
    </div>
  `;
}
function renderSlidesApresentacaoAluno(){
  const al = state.aluno;
  const s = al.slidesAtivo;
  if(!s){
    return `<div class="card"><h2>Apresentação encerrada</h2><p class="muted">O professor encerrou a apresentação de slides.</p><button class="btn btn-primary" data-action="sair-apresentacao-slides">Voltar</button></div>`;
  }
  const emFullscreen = isFullscreenActive();
  return `
    <div class="slides-aluno-fullscreen">
      ${al.slidesCurrentImg ? `<img src="${al.slidesCurrentImg}" alt="Slide ${s.currentIndex+1}">` : '<div class="spinner"></div>'}
      <div class="slides-aluno-footer">
        <span>${s.currentIndex+1} / ${s.totalSlides}</span>
        ${!emFullscreen ? `<button class="btn btn-primary btn-sm" data-action="reentrar-fullscreen-slides">⛶ Voltar para tela cheia</button>` : ''}
        <button class="btn btn-ghost btn-sm" data-action="sair-apresentacao-slides">Sair</button>
      </div>
    </div>
  `;
}
async function pollSlidesForAluno(){
  const al = state.aluno;
  if((al.stage!=='dashboard' && al.stage!=='apresentacao') || !al.turma) return false;
  const stageAntes = al.stage;
  const s = await loadSlidesSessaoAtiva(al.turma.id);
  let changed = false;
  if(s && s.turmaId === al.turma.id){
    const idxChanged = !al.slidesAtivo || al.slidesAtivo.id!==s.id || al.slidesAtivo.currentIndex!==s.currentIndex;
    al.slidesAtivo = s;
    if(idxChanged){ al.slidesCurrentImg = await getSlideImg(s.deckId, s.currentIndex); changed = true; }
    if(al.stage==='apresentacao'){
      sendSlidesHeartbeat(s.id, al.matriculaStudentId, al.name, isFullscreenActive());
    }
  } else {
    if(al.slidesAtivo !== null) changed = true;
    al.slidesAtivo = null;
    al.slidesCurrentImg = null;
    if(al.stage==='apresentacao'){
      exitFullscreenSafe();
      al.stage = 'dashboard';
    }
  }
  if(al.stage !== stageAntes) changed = true;
  return changed;
}
function entrarApresentacaoSlides(){
  const al = state.aluno;
  if(!al.slidesAtivo) return;
  requestFullscreenSafe();
  al.stage = 'apresentacao';
  render();
  sendSlidesHeartbeat(al.slidesAtivo.turmaId, al.matriculaStudentId, al.name, true);
}
function sairApresentacaoSlides(){
  const al = state.aluno;
  exitFullscreenSafe();
  if(al.slidesAtivo) sendSlidesHeartbeat(al.slidesAtivo.turmaId, al.matriculaStudentId, al.name, false);
  al.stage = 'dashboard';
  render();
}
__parteOk('slides');
