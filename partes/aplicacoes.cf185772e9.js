/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "aplicacoes" */
function apE(v){ return esc(v==null ? '' : String(v)); }
function apEhCoord(){ return state.view==='coordenador' && !!state.coordenador.session; }
function apQuem(){ return apEhCoord() ? 'Coordenação' : ((state.professor.session && state.professor.session.displayName) || 'Professor'); }
const AP_DIAS = ['dom','seg','ter','qua','qui','sex','sáb'];
function apPad(n){ return String(n).padStart(2,'0'); }
function apHoje(){ const d = new Date(); return d.getFullYear() + '-' + apPad(d.getMonth()+1) + '-' + apPad(d.getDate()); }
function apIso(data, hm){ return data + 'T' + hm; }
function apDataBr(data){ if(!data) return '—'; const [y,m,d] = data.split('-').map(Number); const dt = new Date(y, m-1, d); return apPad(d) + '/' + apPad(m) + ' (' + AP_DIAS[dt.getDay()] + ')'; }
function apHm(ms){ const d = new Date(ms); return apPad(d.getHours()) + ':' + apPad(d.getMinutes()); }
function apStatusSessao(s){
  const ini = apMs(s.data, s.ini), fim = apMs(s.data, s.fim), agora = Date.now();
  if(isNaN(ini) || isNaN(fim)) return 'futura';
  if(agora < ini) return agora > ini - 30*60000 ? 'embreve' : 'futura';
  return agora <= fim ? 'aberta' : 'passou';
}
function apRotuloStatus(st){
  return st==='aberta' ? '<span class="ap-chip ap-ok">● acontecendo agora</span>'
    : st==='embreve' ? '<span class="ap-chip ap-warn">⏳ começa em breve</span>'
    : st==='passou' ? '<span class="ap-chip ap-mut">encerrou o horário</span>'
    : '<span class="ap-chip ap-mut">agendada</span>';
}
function apTodasSessoes(ap){ return (ap.sessoes||[]).map(s => ({ ap, s })); }
function apCodigosAplicador(){ return new Set(apMinhasSessoes().map(x => x.s.code)); }
function apCodigosAplicados(){ const set = new Set(); apPublicadas().forEach(ap => (ap.sessoes||[]).forEach(s => set.add(s.code))); return set; }
function apNomeTurma(id){
  const S = apS(); const t = S.turmas[id]; if(t && t.name) return t.name;
  const l = (S.turmasTodas||[]).find(x => x.id===id); if(l) return l.name;
  const p = (state.professor.turmas||[]).find(x => x.id===id); return p ? p.name : id;
}
function apPrimeiraData(ap){ return (ap.sessoes||[]).map(s => s.data).filter(Boolean).sort()[0] || ''; }
function apResumoAplic(ap){
  const ss = ap.sessoes||[]; const provas = new Set(ss.map(s => s.code)); const datas = [...new Set(ss.map(s => s.data).filter(Boolean))].sort();
  return `${provas.size} prova(s) · ${ss.length} sala(s)` + (datas.length ? ' · ' + apDataBr(datas[0]) + (datas.length>1 ? ' a ' + apDataBr(datas[datas.length-1]) : '') : '');
}
async function apCarregarTurmasTodas(){
  const S = apS(); if(S.turmasTodas) return; S.turmasTodas = [];
  try{ S.turmasTodas = JSON.parse((await window.storage.get('turmas', true)).value) || []; }catch(e){ S.turmasTodas = []; }
  render();
}
async function apCarregarTurma(id){
  const S = apS(); if(S.turmas[id] || S.turmasCarregando[id]) return; S.turmasCarregando[id] = true;
  let t = null;
  try{ t = JSON.parse((await window.storage.get('turmadoc:' + id, true)).value); }
  catch(e){ try{ const l = JSON.parse((await window.storage.get('turmas', true)).value); t = (l||[]).find(x => x.id===id) || null; }catch(e2){} }
  S.turmas[id] = t ? { id:t.id, name:t.name, students:(t.students||[]).map(a => ({ id:a.id, name:a.name })).sort((x,y) => String(x.name).localeCompare(String(y.name), 'pt-BR')) } : { id, name:'', students:[], falhou:true };
  S.turmasCarregando[id] = false; render();
}
async function apCarregarProfs(){
  const S = apS(); if(S.profs) return; S.profs = [];
  try{ S.profs = (await fetchProfessoresList()).filter(p => p && p.id).sort((a,b) => String(a.displayName||a.email).localeCompare(String(b.displayName||b.email), 'pt-BR')); }catch(e){ S.profs = []; }
  render();
}
function apLerLista(raw){ let l = []; try{ l = raw ? JSON.parse(raw) : []; }catch(e){ l = []; } return Array.isArray(l) ? l : []; }
async function apGravarAplic(ap){
  const novo = await window.storage.update('aplicacoes-provas', raw => { const l = apLerLista(raw); const i = l.findIndex(x => x.id===ap.id); if(i>=0) l[i] = ap; else l.push(ap); return JSON.stringify(l); });
  apS().lista = apLerLista(novo);
}
async function apRemoverAplic(id){
  const novo = await window.storage.update('aplicacoes-provas', raw => JSON.stringify(apLerLista(raw).filter(x => x.id!==id)));
  apS().lista = apLerLista(novo);
}
async function apMudarAplic(id, mut){
  const novo = await window.storage.update('aplicacoes-provas', raw => { const l = apLerLista(raw); const x = l.find(y => y.id===id); if(!x) return undefined; if(mut(x)===false) return undefined; return JSON.stringify(l); });
  apS().lista = apLerLista(novo);
  return apS().lista.find(x => x.id===id) || null;
}
function apCopia(o){ return JSON.parse(JSON.stringify(o)); }
function apAplicarNaProva(a, ap, ss){
  if(!a.aplicAntes || a.aplicAntes.aplicacaoId!==ap.id){
    a.aplicAntes = { aplicacaoId: ap.id, startAt: a.startAt||null, endAt: a.endAt||null, agendaTurmas: apCopia(a.agendaTurmas||{}), exigeLiberacao: a.exigeLiberacao===true,
      securityEnabled: a.securityEnabled!==false, resultRelease: apCopia(a.resultRelease||{ mode:'imediato', releaseAt:'' }), gabaritoLiberado: a.gabaritoLiberado===true };
  }
  const agenda = apCopia(a.aplicAntes.agendaTurmas||{});
  const inis = [], fins = [];
  ss.forEach(s => { agenda[s.turmaId] = { startAt: apIso(s.data, s.ini), endAt: apIso(s.data, s.fim) }; inis.push(apIso(s.data, s.ini)); fins.push(apIso(s.data, s.fim)); });
  inis.sort(); fins.sort();
  a.agendaTurmas = agenda; a.startAt = inis[0]; a.endAt = fins[fins.length-1];
  a.exigeLiberacao = true;
  if(ap.seguranca!==false) a.securityEnabled = true;
  const g = ap.gabarito || { modo:'ao-encerrar' };
  if((ap.gabLiberado||{})[a.code]){ a.resultRelease = { mode:'imediato', releaseAt:'' }; a.gabaritoLiberado = true; }
  else {
    a.gabaritoLiberado = false;
    a.resultRelease = g.modo==='imediato' ? { mode:'imediato', releaseAt:'' }
      : g.modo==='horario' ? { mode:'agendado', releaseAt: (g.releaseAt && g.releaseAt > a.endAt) ? g.releaseAt : a.endAt }   // prorrogação empurra o gabarito
      : g.modo==='manual' ? { mode:'nunca', releaseAt:'' }
      : { mode:'agendado', releaseAt: a.endAt };   // quando todas as turmas terminarem
  }
  a.aplicacaoId = ap.id; a.aplicacaoNome = ap.nome; a.updatedAt = Date.now();
}
function apRestaurarProva(a){
  const b = a.aplicAntes;
  if(b){ a.startAt = b.startAt; a.endAt = b.endAt; a.agendaTurmas = b.agendaTurmas || {}; a.exigeLiberacao = b.exigeLiberacao; a.securityEnabled = b.securityEnabled; a.resultRelease = b.resultRelease; a.gabaritoLiberado = b.gabaritoLiberado; }
  delete a.aplicAntes; delete a.aplicacaoId; delete a.aplicacaoNome; a.updatedAt = Date.now();
}
async function apSincronizar(ap, removidas){
  const porProva = {};
  (ap.sessoes||[]).forEach(s => { (porProva[s.code] = porProva[s.code] || []).push(s); });
  for(const [code, ss] of Object.entries(porProva)){
    await window.storage.update('assessment:' + code, raw => { if(!raw) return undefined; const a = JSON.parse(raw); apAplicarNaProva(a, ap, ss); return JSON.stringify(a); });
  }
  for(const code of (removidas||[])){
    await window.storage.update('assessment:' + code, raw => { if(!raw) return undefined; const a = JSON.parse(raw); if(a.aplicacaoId!==ap.id) return undefined; apRestaurarProva(a); return JSON.stringify(a); });
  }
  try{ if(state.coordenador.session) loadCoordAssessments(); }catch(e){}
  try{ if(state.professor.session) loadAssessmentsList(); }catch(e){}
}
function apConflitos(ed){
  const S = apS(); const mapa = {}; let bloqueios = 0;
  const outras = []; (S.lista||[]).filter(a => a.status==='publicada' && a.id!==ed.id).forEach(a => (a.sessoes||[]).forEach(s => outras.push({ s, de: a.nome })));
  const todas = (ed.sessoes||[]).map(s => ({ s, de: null })).concat(outras);
  const add = (id, msg) => { (mapa[id] = mapa[id] || []).push(msg); bloqueios++; };
  (ed.sessoes||[]).forEach(s => {
    const i1 = apMs(s.data, s.ini), f1 = apMs(s.data, s.fim); if(isNaN(i1) || isNaN(f1)) return;
    todas.forEach(o => {
      if(o.s.id===s.id) return;
      if(o.s.data!==s.data) return;
      const i2 = apMs(o.s.data, o.s.ini), f2 = apMs(o.s.data, o.s.fim); if(isNaN(i2) || isNaN(f2)) return;
      if(!(i1 < f2 && i2 < f1)) return;
      const onde = o.de ? ` (na aplicação "${o.de}")` : '';
      if(o.s.turmaId===s.turmaId) add(s.id, `A turma ${apNomeTurma(s.turmaId)} já tem outra prova neste horário${onde}.`);
      (s.aplicadores||[]).forEach(x => { if((o.s.aplicadores||[]).some(y => y.id===x.id) && o.s.turmaId!==s.turmaId) add(s.id, `${x.nome} está em duas salas ao mesmo tempo${onde}.`); });
    });
  });
  return { mapa, bloqueios };
}
const AP_GAB = [
  ['ao-encerrar', 'Quando todas as turmas terminarem a prova (recomendado)', 'O aluno que termina cedo vê só a nota; a correção de cada questão aparece depois que a última turma encerra. Evita passar o gabarito para quem faz a mesma prova mais tarde.'],
  ['horario', 'Em data e hora que eu escolher', 'Útil quando a prova tem horários em dias diferentes: o gabarito abre depois da última.'],
  ['manual', 'Só quando a coordenação liberar', 'Nada aparece ao aluno até você tocar em “📢 Liberar gabarito” no acompanhamento.'],
  ['imediato', 'Logo que cada aluno enviar', 'Só use se a prova é aplicada num único horário.'],
];
function apRotuloGab(g){ const x = AP_GAB.find(y => y[0]===(g && g.modo)); return x ? x[1].replace(' (recomendado)', '') + (g.modo==='horario' && g.releaseAt ? ' — ' + formatDateTime(g.releaseAt) : '') : '—'; }
function renderAplic(){
  const S = apS();
  apIniciarTick();
  if(S.lista===null){ if(!S.carregando) setTimeout(apCarregar, 0); return `<div class="card"><h2>🗓️ Aplicação de provas</h2><div class="spinner"></div></div>`; }
  if(apEhCoord()){
    apCarregarTurmasTodas();
    if(S.sala) return apRenderSala();
    if(S.ed) return apRenderEditor();
    if(S.monId) return apRenderMonitor();
    return apRenderCoordLista();
  }
  if(S.sala) return apRenderSala();
  return apRenderMinhas();
}
function apRenderCoordLista(){
  const S = apS();
  const lista = (S.lista||[]).slice().sort((a,b) => (apPrimeiraData(a)||'9').localeCompare(apPrimeiraData(b)||'9') || (b.criadoEm||0) - (a.criadoEm||0));
  const cards = lista.length===0 ? `<div class="empty">Nenhuma aplicação criada ainda.<br>Toque em “Nova aplicação” para montar o bloco de provas do dia.</div>` : lista.map(ap => {
    const pub = ap.status==='publicada';
    return `<div class="list-item">
      <div>
        <strong>${apE(ap.nome)}</strong> ${pub ? '<span class="ap-chip ap-ok">publicada</span>' : '<span class="ap-chip ap-warn">rascunho</span>'}<br>
        <span class="muted">${apE(apResumoAplic(ap))}</span><br>
        <span class="muted" style="font-size:.82rem;">Gabarito: ${apE(apRotuloGab(ap.gabarito))}</span>
      </div>
      <div class="row" style="flex:0 0 auto; gap:6px; flex-wrap:wrap;">
        ${pub ? `<button class="btn btn-primary btn-sm" data-ap="monitor" data-id="${apE(ap.id)}">📡 Acompanhar</button>` : ''}
        <button class="btn btn-ghost btn-sm" data-ap="editar" data-id="${apE(ap.id)}">${pub ? 'Editar' : 'Continuar'}</button>
        <button class="btn btn-danger btn-sm" data-ap="excluir" data-id="${apE(ap.id)}">${pub ? 'Cancelar aplicação' : 'Excluir'}</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="card">
    <div class="row" style="align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
      <h2 style="margin:0;">🗓️ Aplicação de provas</h2>
      <button class="btn btn-primary" data-ap="nova">➕ Nova aplicação</button>
    </div>
    <p class="muted">Monte o bloco de provas que serão aplicadas em sala, em dias e horários definidos por você, a partir das provas que os professores criaram. Você escolhe <strong>quem aplica em cada turma</strong>; no dia, o aplicador faz a <strong>chamada</strong>, <strong>libera os alunos presentes</strong> e, se alguém sair da prova, é ele quem libera a volta. Para prova impressa, use “🖨️ Prova em papel”.</p>
    ${S.msg ? `<p style="color:#1f6f66; font-weight:600;">${apE(S.msg)}</p>` : ''}
    ${S.erro ? `<p class="err">${apE(S.erro)}</p>` : ''}
    ${cards}
  </div>`;
}
function apNovaAplic(){
  const S = apS(); S.msg = ''; S.erro = '';
  S.ed = { id: cryptoId(), nome:'', status:'rascunho', sessoes:[], def:{ data: apHoje(), ini:'07:30', fim:'09:10' }, gabarito:{ modo:'ao-encerrar', releaseAt:'' }, seguranca:true, criadoEm: Date.now(), criadoPor: apQuem() };
  S.fa = { q:'', unidade:'', tipo:'' };
  apPrepararEditor(); render();
}
function apEditar(id){
  const S = apS(); const ap = (S.lista||[]).find(x => x.id===id); if(!ap) return;
  S.msg = ''; S.erro = ''; S.ed = apCopia(ap); S.ed.def = S.ed.def || { data: apHoje(), ini:'07:30', fim:'09:10' };
  S.fa = { q:'', unidade:'', tipo:'' }; apPrepararEditor(); render();
}
function apPrepararEditor(){ apCarregarProfs(); apCarregarTurmasTodas(); try{ loadCoordAssessments(); }catch(e){} }
function apProvasElegiveis(){
  return (state.coordenador.assessments||[]).filter(a => ['avaliacao','diagnostica','recuperacao'].includes(a.instrumento) && assessmentTurmaIds(a).length>0);
}
function apFiltrarProvas(){
  const S = apS(); const f = S.fa; const q = nomeChave(f.q);
  return apProvasElegiveis().filter(a => (!f.unidade || a.unidade===f.unidade) && (!f.tipo || a.instrumento===f.tipo)
    && (!q || nomeChave([a.title, a.disciplinaName, a.professorName, a.code].join(' ')).includes(q)));
}
function apPickerLista(){
  const S = apS(), ed = S.ed;
  const todas = apFiltrarProvas(); const lista = todas.slice(0, 60);
  if(!todas.length) return `<div class="empty">Nenhuma prova encontrada. Os professores criam as provas em “Minhas avaliações”.</div>`;
  return lista.map(a => {
    const marcada = ed.sessoes.some(s => s.code===a.code);
    const outra = a.aplicacaoId && a.aplicacaoId!==ed.id;
    const turmas = assessmentTurmaIds(a).map(apNomeTurma).join(', ');
    return `<label class="ap-pick" style="text-transform:none; font-weight:400; ${outra ? 'opacity:.55;' : ''}">
      <input type="checkbox" data-ap-f="pick" data-code="${apE(a.code)}" ${marcada ? 'checked' : ''} ${outra ? 'disabled' : ''}>
      <span><strong>${apE(a.title)}</strong> <span class="muted">· ${apE(a.disciplinaName || 'sem disciplina')}</span><br>
      <span class="muted" style="font-size:.82rem;">${apE(instrumentoLabel(a.instrumento).split(' (')[0])} · ${apE(a.professorName || '—')} · turma(s) ${apE(turmas)} · ${(a.questions||[]).length} questões · ${apE(a.code)}${outra ? ' · já está na aplicação “' + apE(a.aplicacaoNome||'outra') + '”' : ''}</span></span>
    </label>`;
  }).join('') + (todas.length > lista.length ? `<p class="muted" style="font-size:.82rem;">Mostrando 60 de ${todas.length}. Refine a busca.</p>` : '');
}
function apOptsProf(sel, nomeAtual){
  const S = apS(); const profs = S.profs || [];
  let o = '<option value="">— escolher —</option>';
  if(sel && !profs.some(p => p.id===sel)) o += `<option value="${apE(sel)}" selected>${apE(nomeAtual || sel)}</option>`;
  return o + profs.map(p => `<option value="${apE(p.id)}" ${p.id===sel ? 'selected' : ''}>${apE(p.displayName || p.email)}</option>`).join('');
}
function apRenderEditor(){
  const S = apS(), ed = S.ed;
  const pub = ed.status==='publicada';
  const conf = apConflitos(ed);
  const provasInfo = {}; apProvasElegiveis().forEach(a => { provasInfo[a.code] = a; });
  const unidades = [...new Set(apProvasElegiveis().map(a => a.unidade).filter(Boolean))].sort();
  const linhas = ed.sessoes.map(s => {
    const a = provasInfo[s.code];
    return `<tr>
      <td style="min-width:190px;"><strong>${apE((a && a.title) || s.titulo || s.code)}</strong><br><span class="muted" style="font-size:.8rem;">${apE((a && a.disciplinaName) || s.disc || '')}${(a && a.professorName) || s.autor ? ' · ' + apE((a && a.professorName) || s.autor) : ''}</span>
        ${(conf.mapa[s.id]||[]).map(m => `<div class="ap-conf">⚠ ${apE(m)}</div>`).join('')}</td>
      <td><strong>${apE(apNomeTurma(s.turmaId))}</strong></td>
      <td><input type="date" data-ap-f="s-data" data-sid="${apE(s.id)}" value="${apE(s.data)}"></td>
      <td><input type="time" data-ap-f="s-ini" data-sid="${apE(s.id)}" value="${apE(s.ini)}"></td>
      <td><input type="time" data-ap-f="s-fim" data-sid="${apE(s.id)}" value="${apE(s.fim)}"></td>
      <td><select data-ap-f="s-ap1" data-sid="${apE(s.id)}">${apOptsProf((s.aplicadores||[])[0] && s.aplicadores[0].id, (s.aplicadores||[])[0] && s.aplicadores[0].nome)}</select></td>
      <td><select data-ap-f="s-ap2" data-sid="${apE(s.id)}">${apOptsProf((s.aplicadores||[])[1] && s.aplicadores[1].id, (s.aplicadores||[])[1] && s.aplicadores[1].nome)}</select></td>
      <td><button class="btn btn-ghost btn-sm" data-ap="rm-sessao" data-sid="${apE(s.id)}" title="Tirar esta turma do bloco">✕</button></td>
    </tr>`;
  }).join('');
  return `<div class="card">
    <div class="row" style="align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
      <h2 style="margin:0;">${pub ? '✏️ Editar aplicação publicada' : '🗓️ Nova aplicação de provas'}</h2>
      <button class="btn btn-ghost btn-sm" data-ap="fechar-editor">← Voltar sem salvar</button>
    </div>
    ${pub ? '<p class="muted" style="font-size:.85rem;">Esta aplicação já está valendo. Ao salvar, os horários e aplicadores novos passam a valer na hora (quem já está fazendo a prova não é afetado).</p>' : ''}
    ${S.erro ? `<div class="card" style="border:2px solid #b3261e; background:#fff3f1;"><strong>Confira antes de publicar:</strong><br>${S.erro.split('\n').map(apE).join('<br>')}</div>` : ''}

    <label>1. Nome da aplicação</label>
    <input type="text" data-ap-f="nome" value="${apE(ed.nome)}" placeholder="Ex.: NP2 — 4º bimestre (semana de provas)">

    <label style="margin-top:14px;">2. Provas do bloco <span class="muted" style="text-transform:none; font-weight:400;">(escolha entre as provas criadas pelos professores; cada turma da prova vira uma sala)</span></label>
    <div class="row" style="gap:8px; flex-wrap:wrap;">
      <input type="text" data-ap-f="q" value="${apE(S.fa.q)}" placeholder="Buscar por título, disciplina, professor ou código" style="flex:2 1 220px;">
      <select data-ap-f="f-unid" style="flex:1 1 140px;"><option value="">Todas as unidades</option>${unidades.map(u => `<option ${S.fa.unidade===u ? 'selected' : ''}>${apE(u)}</option>`).join('')}</select>
      <select data-ap-f="f-tipo" style="flex:1 1 140px;"><option value="">Todos os tipos</option><option value="avaliacao" ${S.fa.tipo==='avaliacao' ? 'selected' : ''}>Avaliação</option><option value="diagnostica" ${S.fa.tipo==='diagnostica' ? 'selected' : ''}>Diagnóstica</option><option value="recuperacao" ${S.fa.tipo==='recuperacao' ? 'selected' : ''}>Recuperação</option></select>
    </div>
    <div id="ap-picker-lista" style="max-height:320px; overflow:auto; border:1px solid var(--paper-line); border-radius:8px; margin-top:6px; padding:0 8px;">${state.coordenador.assessmentsLoading ? '<div class="spinner"></div>' : apPickerLista()}</div>

    <label style="margin-top:14px;">3. Dia e horário padrão <span class="muted" style="text-transform:none; font-weight:400;">(ajuste cada sala na tabela abaixo)</span></label>
    <div class="row" style="gap:8px; flex-wrap:wrap; align-items:flex-end;">
      <div><input type="date" data-ap-f="def-data" value="${apE(ed.def.data)}"><p class="muted" style="font-size:.78rem; margin-top:4px;">Dia</p></div>
      <div><input type="time" data-ap-f="def-ini" value="${apE(ed.def.ini)}"><p class="muted" style="font-size:.78rem; margin-top:4px;">Início</p></div>
      <div><input type="time" data-ap-f="def-fim" value="${apE(ed.def.fim)}"><p class="muted" style="font-size:.78rem; margin-top:4px;">Término</p></div>
      <div style="padding-bottom:20px;"><button class="btn btn-ghost btn-sm" data-ap="def-todas">Aplicar a todas as salas</button></div>
    </div>

    <label style="margin-top:14px;">4. Salas, horários e aplicadores</label>
    ${ed.sessoes.length===0 ? '<div class="empty">Marque as provas acima para as salas aparecerem aqui.</div>' : `
      <div style="overflow-x:auto;"><table class="ap-tabela"><thead><tr><th>Prova</th><th>Turma</th><th>Dia</th><th>Início</th><th>Término</th><th>Aplicador</th><th>Auxiliar (opc.)</th><th></th></tr></thead><tbody>${linhas}</tbody></table></div>
      <div class="row" style="gap:8px; margin-top:8px;"><button class="btn btn-ghost btn-sm" data-ap="ordenar">↕ Ordenar por dia e horário</button></div>`}

    <label style="margin-top:14px;">5. Gabarito e correção para o aluno</label>
    ${AP_GAB.map(([k, t, d]) => `<label style="display:flex; gap:8px; align-items:flex-start; font-weight:400; text-transform:none; margin:6px 0;">
        <input type="radio" name="ap-gab" data-ap-f="gab-modo" value="${k}" ${ed.gabarito.modo===k ? 'checked' : ''} style="width:auto; margin-top:4px;"><span><strong>${apE(t)}</strong><br><span class="muted" style="font-size:.82rem;">${apE(d)}</span></span></label>`).join('')}
    ${ed.gabarito.modo==='horario' ? `<input type="datetime-local" data-ap-f="gab-at" value="${apE(ed.gabarito.releaseAt)}" style="max-width:260px; margin-left:26px;">` : ''}

    <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:400; margin-top:14px;">
      <input type="checkbox" data-ap-f="seguranca" ${ed.seguranca!==false ? 'checked' : ''} style="width:auto;"> Prova segura (tela cheia; trava se o aluno sair) — recomendado
    </label>

    <div class="row" style="gap:8px; margin-top:16px; flex-wrap:wrap;">
      ${pub ? '' : '<button class="btn btn-ghost" data-ap="salvar-rascunho">💾 Salvar rascunho</button>'}
      <button class="btn btn-primary" data-ap="publicar">${pub ? '💾 Salvar alterações' : '🚀 Publicar aplicação'}</button>
    </div>
    ${pub ? '' : '<p class="muted" style="font-size:.82rem;">Ao publicar, as provas passam a abrir só nos horários de cada turma e só para os alunos que o aplicador liberar. Os professores autores deixam de poder liberar a turma ou o gabarito dessas provas.</p>'}
  </div>`;
}
function apSessaoPorId(id){ const ed = apS().ed; return ed ? ed.sessoes.find(s => s.id===id) : null; }
function apDefinirAplicador(s, pos, profId){
  const S = apS(); const p = (S.profs||[]).find(x => x.id===profId);
  const arr = (s.aplicadores||[]).slice();
  while(arr.length < 2) arr.push(null);
  arr[pos] = p ? { id:p.id, nome: p.displayName || p.email } : null;
  s.aplicadores = arr.filter(Boolean);
}
function apAddProva(code){
  const S = apS(), ed = S.ed; const a = apProvasElegiveis().find(x => x.code===code); if(!a) return;
  assessmentTurmaIds(a).forEach(tid => {
    if(ed.sessoes.some(s => s.code===code && s.turmaId===tid)) return;
    ed.sessoes.push({ id: cryptoId(), code, turmaId: tid, data: ed.def.data, ini: ed.def.ini, fim: ed.def.fim, aplicadores: [], titulo: a.title, disc: a.disciplinaName || '', autor: a.professorName || '' });
  });
}
function apCampo(el, ev){
  const S = apS(), ed = S.ed; if(!ed) return false;
  const f = el.dataset.apF; const sid = el.dataset.sid;
  const s = sid ? apSessaoPorId(sid) : null;
  const tipo = ev.type;
  if(f==='nome'){ ed.nome = el.value; return false; }
  if(f==='q'){ S.fa.q = el.value; const box = document.getElementById('ap-picker-lista'); if(box) box.innerHTML = apPickerLista(); return false; }
  if(tipo==='input') return false;   // o resto reage ao “change”
  if(f==='f-unid'){ S.fa.unidade = el.value; return true; }
  if(f==='f-tipo'){ S.fa.tipo = el.value; return true; }
  if(f==='pick'){ if(el.checked) apAddProva(el.dataset.code); else ed.sessoes = ed.sessoes.filter(x => x.code!==el.dataset.code); return true; }
  if(f==='def-data'){ ed.def.data = el.value; return false; }
  if(f==='def-ini'){ ed.def.ini = el.value; return false; }
  if(f==='def-fim'){ ed.def.fim = el.value; return false; }
  if(f==='gab-modo'){ ed.gabarito.modo = el.value; return true; }
  if(f==='gab-at'){ ed.gabarito.releaseAt = el.value; return false; }
  if(f==='seguranca'){ ed.seguranca = el.checked; return false; }
  if(s){
    if(f==='s-data'){ s.data = el.value; return true; }
    if(f==='s-ini'){ s.ini = el.value; return true; }
    if(f==='s-fim'){ s.fim = el.value; return true; }
    if(f==='s-ap1'){ apDefinirAplicador(s, 0, el.value); return true; }
    if(f==='s-ap2'){ apDefinirAplicador(s, 1, el.value); return true; }
  }
  return false;
}
function apValidar(ed){
  const erros = [];
  if(!String(ed.nome||'').trim()) erros.push('Dê um nome à aplicação.');
  if(!ed.sessoes.length) erros.push('Escolha ao menos uma prova.');
  ed.sessoes.forEach(s => {
    const rot = `${s.titulo || s.code} — ${apNomeTurma(s.turmaId)}`;
    if(!s.data || !s.ini || !s.fim) erros.push(`${rot}: preencha dia, início e término.`);
    else if(apMs(s.data, s.fim) <= apMs(s.data, s.ini)) erros.push(`${rot}: o término precisa ser depois do início.`);
    if(!(s.aplicadores||[]).length) erros.push(`${rot}: escolha o aplicador.`);
    if((s.aplicadores||[]).length===2 && s.aplicadores[0].id===s.aplicadores[1].id) erros.push(`${rot}: o auxiliar é o mesmo professor do aplicador.`);
  });
  const outrasPub = (apS().lista||[]).filter(a => a.status==='publicada' && a.id!==ed.id);
  [...new Set(ed.sessoes.map(s => s.code))].forEach(code => { const o = outrasPub.find(a => (a.sessoes||[]).some(x => x.code===code));
    if(o){ const s = ed.sessoes.find(x => x.code===code); erros.push(`${s.titulo || code}: já está na aplicação publicada “${o.nome}”. Tire de lá primeiro.`); } });
  const c = apConflitos(ed); Object.keys(c.mapa).forEach(id => { const s = ed.sessoes.find(x => x.id===id); (c.mapa[id]||[]).forEach(m => erros.push(`${s ? (s.titulo || s.code) + ' — ' + apNomeTurma(s.turmaId) + ': ' : ''}${m}`)); });
  if(ed.gabarito.modo==='horario'){
    if(!ed.gabarito.releaseAt) erros.push('Escolha a data e a hora de liberação do gabarito.');
    else { const ultimo = ed.sessoes.map(s => apIso(s.data, s.fim)).sort().pop(); if(ultimo && ed.gabarito.releaseAt < ultimo) erros.push('O gabarito está marcado para antes de a última prova terminar.'); }
  }
  return [...new Set(erros)];
}
async function apSalvar(publicar){
  const S = apS(), ed = S.ed; if(!ed) return;
  S.erro = '';
  if(publicar || ed.status==='publicada'){
    const erros = apValidar(ed);
    if(erros.length){ S.erro = erros.join('\n'); render(); try{ window.scrollTo(0, 0); }catch(e){} return; }
  } else if(!String(ed.nome||'').trim()){ S.erro = 'Dê um nome à aplicação.'; render(); return; }
  const antigo = (S.lista||[]).find(x => x.id===ed.id);
  const ap = apCopia(ed); ap.atualizadoEm = Date.now();
  try{
    if(publicar || ed.status==='publicada'){
      const novos = [...new Set(ap.sessoes.map(s => s.code))];
      const removidas = ((antigo && antigo.provasSync) || []).filter(c => !novos.includes(c));
      ap.status = 'publicada'; ap.publicadoEm = ap.publicadoEm || Date.now(); ap.provasSync = novos;
      await apSincronizar(ap, removidas);   // primeiro as provas (se falhar, nada fica liberado por engano)
    }
    await apGravarAplic(ap);
  }catch(e){ S.erro = 'Não foi possível salvar agora (' + ((e && e.message) || 'erro') + '). Confira a internet e tente de novo — nada foi liberado aos alunos.'; render(); return; }
  S.msg = ap.status==='publicada' ? '✅ Aplicação publicada. Os aplicadores já veem as salas em “Aplicação de provas”.' : '💾 Rascunho salvo.';
  S.ed = null; render();
}
async function apExcluir(id){
  const S = apS(); const ap = (S.lista||[]).find(x => x.id===id); if(!ap) return;
  const pub = ap.status==='publicada';
  if(!confirm(pub ? `Cancelar a aplicação "${ap.nome}"? As provas voltam a ter a agenda e as regras que tinham antes. Quem já fez a prova continua com a nota.` : `Excluir o rascunho "${ap.nome}"?`)) return;
  try{
    if(pub) await apSincronizar(Object.assign({}, ap, { sessoes: [] }), ap.provasSync || [...new Set((ap.sessoes||[]).map(s => s.code))]);
    await apRemoverAplic(id);
    S.msg = pub ? 'Aplicação cancelada; as provas voltaram ao que eram.' : 'Rascunho excluído.';
  }catch(e){ S.erro = 'Não foi possível concluir agora. Tente de novo.'; }
  if(S.monId===id) S.monId = null; render();
}
async function apLerVivo(ap, sessoes){
  const V = { ur: await liveLerJson('unlock-requests', []), sess: {}, prova: {} };
  const sd = await liveListar('aplic-sessao:' + ap.id + ':');
  Object.entries(sd).forEach(([k, v]) => { try{ V.sess[k] = JSON.parse(v); }catch(e){} });
  const codes = [...new Set(sessoes.map(s => s.code))];
  for(const code of codes){
    V.prova[code] = { resp: await liveLerJson('responses:' + code, []), lib: await liveLerJson('prova-liberacao:' + code, null), locks: Object.keys(await liveListar('attempt-lock:' + code + ':')) };
  }
  return V;
}
function apSessoesDeInteresse(){
  const S = apS();
  if(S.sala){ const ap = (S.lista||[]).find(x => x.id===S.sala.apId); const s = ap && (ap.sessoes||[]).find(x => x.id===S.sala.sessId); return ap && s ? { ap, sessoes:[s] } : null; }
  if(S.monId && apEhCoord()){ const ap = (S.lista||[]).find(x => x.id===S.monId); if(!ap) return null; const dia = S.dia || apDiaPadrao(ap); return { ap, sessoes:(ap.sessoes||[]).filter(s => s.data===dia) }; }
  return null;
}
async function apAtualizarVivo(forcar){
  const S = apS(); if(S.ocupado && !forcar) return; S.ocupado = true;
  try{
    let mudou = false;
    try{ const v = await liveLerJson('aplicacoes-provas', null); if(Array.isArray(v)){ const j = JSON.stringify(v); if(j!==S.listaChave){ S.listaChave = j; if(!S.ed) S.lista = v; mudou = true; } } }catch(e){}
    const alvo = apSessoesDeInteresse();
    if(alvo && alvo.sessoes.length){
      const V = await apLerVivo(alvo.ap, alvo.sessoes);
      const j = JSON.stringify(V); if(j!==S.vivoChave){ S.vivoChave = j; S.vivo = V; mudou = true; }
    }
    if(mudou && apViewAtiva() && !S.ed) render();
  }catch(e){}
  S.ocupado = false;
}
let apTimer = null;
function apIniciarTick(){
  if(apTimer) return;
  apTimer = setInterval(() => { if(!apViewAtiva()){ clearInterval(apTimer); apTimer = null; return; } if(document.hidden) return; apAtualizarVivo(); }, 4000);
  setTimeout(apAtualizarVivo, 50);
}
function apSituacao(s, al, V){
  const d = (V && V.sess && V.sess[s.id]) || {};
  const pp = (V && V.prova && V.prova[s.code]) || { resp:[], lib:null, locks:[] };
  const slug = slugifyName(al.name);
  const enviou = (pp.resp||[]).some(r => mesmoNomeAluno(r.studentName, al.name));
  const reqs = ((V && V.ur) || []).filter(r => r.code===s.code && !r.released && mesmoNomeAluno(r.studentName, al.name));
  const req = reqs.sort((a,b) => (b.lockedAt||0) - (a.lockedAt||0))[0] || null;
  const liberado = !!(pp.lib && alunoEstaLiberado(pp.lib.liberados, al.id, al.name));
  const fazendo = (pp.locks||[]).includes(slug);
  const marcadoP = !!(d.presentes && d.presentes[al.id]), marcadoA = !!(d.ausentes && d.ausentes[al.id]);
  let cod = 'novo';
  if(enviou) cod = 'enviou';
  else if(req && !req.finalizar) cod = req.tipo==='trava' ? 'trava' : 'saiu';
  else if(req && req.finalizar) cod = 'finalizando';
  else if(fazendo) cod = 'fazendo';
  else if(liberado) cod = 'liberado';
  else if(marcadoP) cod = 'presente';
  else if(marcadoA) cod = 'ausente';
  return { cod, req, liberado, fazendo, enviou, presente: marcadoP || liberado || fazendo || enviou, ausente: marcadoA && !(liberado || fazendo || enviou) };
}
function apContar(s, turma, V){
  const c = { total: turma ? turma.students.length : 0, presentes:0, ausentes:0, liberados:0, fazendo:0, enviaram:0, saiu:0, semChamada:0 };
  if(!turma) return c;
  turma.students.forEach(al => {
    const x = apSituacao(s, al, V);
    if(x.presente) c.presentes++; else if(x.ausente) c.ausentes++; else c.semChamada++;
    if(x.liberado || x.fazendo || x.enviou) c.liberados++;
    if(x.cod==='fazendo') c.fazendo++; if(x.enviou) c.enviaram++; if(x.cod==='saiu' || x.cod==='trava' || x.cod==='finalizando') c.saiu++;
  });
  return c;
}
function apChipSituacao(cod){
  return ({ enviou:'<span class="ap-chip ap-ok">✅ Enviou a prova</span>', fazendo:'<span class="ap-chip ap-warn">✍️ Fazendo a prova</span>', liberado:'<span class="ap-chip ap-ok">🟢 Liberado — ainda não abriu</span>',
    presente:'<span class="ap-chip">🙋 Presente</span>', ausente:'<span class="ap-chip ap-bad">❌ Ausente</span>', novo:'<span class="ap-chip ap-mut">⚪ Sem chamada</span>',
    saiu:'<span class="ap-chip ap-bad">🔒 Saiu da prova</span>', trava:'<span class="ap-chip ap-bad">🔒 Abriu em outro aparelho</span>', finalizando:'<span class="ap-chip ap-warn">⏳ Finalizando</span>' })[cod] || '';
}
function apResumoChips(c){
  return `<div class="ap-resumo"><span class="ap-chip">👥 ${c.total} na turma</span><span class="ap-chip ap-ok">🙋 ${c.presentes} presentes</span><span class="ap-chip ap-bad">❌ ${c.ausentes} ausentes</span><span class="ap-chip ap-mut">⚪ ${c.semChamada} sem chamada</span>
    <span class="ap-chip">🟢 ${c.liberados} liberados</span><span class="ap-chip ap-warn">✍️ ${c.fazendo} fazendo</span><span class="ap-chip ap-ok">✅ ${c.enviaram} enviaram</span>${c.saiu ? `<span class="ap-chip ap-bad">🔒 ${c.saiu} saíram</span>` : ''}</div>`;
}
function apRenderMinhas(){
  const S = apS(); const minhas = apMinhasSessoes(); const hoje = apHoje();
  const hojeL = minhas.filter(x => x.s.data===hoje), futuras = minhas.filter(x => x.s.data>hoje), passadas = minhas.filter(x => x.s.data<hoje).reverse();
  const card = ({ ap, s }) => {
    const st = apStatusSessao(s);
    return `<div class="list-item">
      <div><strong>${apE(s.titulo || s.code)}</strong> ${apRotuloStatus(st)}<br>
      <span class="muted">Turma <strong>${apE(apNomeTurma(s.turmaId))}</strong> · ${apDataBr(s.data)} · ${apE(s.ini)}–${apE(s.fim)} · ${apE(ap.nome)}</span>
      ${(s.aplicadores||[]).length>1 ? `<br><span class="muted" style="font-size:.82rem;">Aplicam: ${(s.aplicadores||[]).map(x => apE(x.nome)).join(' e ')}</span>` : ''}</div>
      <button class="btn ${st==='aberta' || st==='embreve' ? 'btn-primary' : 'btn-ghost'}" data-ap="abrir-sala" data-ap-id="${apE(ap.id)}" data-sid="${apE(s.id)}">🚪 Abrir sala</button>
    </div>`;
  };
  const bloco = (tit, l) => l.length ? `<h3 style="margin:14px 0 4px;">${tit}</h3>${l.map(card).join('')}` : '';
  return `<div class="card">
    <h2>🚪 Aplicar prova</h2>
    <p class="muted">Aqui aparecem as salas em que a coordenação indicou você como aplicador. No horário da prova, abra a sala, faça a <strong>chamada</strong> e <strong>libere os alunos presentes</strong>. Se um aluno sair da prova, você libera a volta dele por aqui.</p>
    ${S.erro ? `<p class="err">${apE(S.erro)}</p>` : ''}
    ${minhas.length===0 ? '<div class="empty">Você não foi indicado como aplicador de nenhuma prova.</div>' : bloco('Hoje', hojeL) + bloco('Próximas', futuras) + bloco('Anteriores', passadas.slice(0, 8))}
  </div>`;
}
function apDiaPadrao(ap){
  const dias = [...new Set((ap.sessoes||[]).map(s => s.data).filter(Boolean))].sort(); const h = apHoje();
  return dias.includes(h) ? h : (dias.find(d => d>h) || dias[dias.length-1] || '');
}
function apRenderMonitor(){
  const S = apS(); const ap = (S.lista||[]).find(x => x.id===S.monId);
  if(!ap){ S.monId = null; return apRenderCoordLista(); }
  const dias = [...new Set((ap.sessoes||[]).map(s => s.data).filter(Boolean))].sort();
  const dia = S.dia && dias.includes(S.dia) ? S.dia : apDiaPadrao(ap);
  const sessoes = (ap.sessoes||[]).filter(s => s.data===dia).sort((a,b) => a.ini.localeCompare(b.ini) || apNomeTurma(a.turmaId).localeCompare(apNomeTurma(b.turmaId)));
  sessoes.forEach(s => apCarregarTurma(s.turmaId));
  const V = S.vivo;
  const codes = [...new Set((ap.sessoes||[]).map(s => s.code))];
  const linhas = sessoes.map(s => {
    const turma = S.turmas[s.turmaId]; const c = apContar(s, turma, V); const st = apStatusSessao(s);
    const enc = V && V.sess && V.sess[s.id] && V.sess[s.id].encerrada;
    return `<div class="list-item" style="align-items:flex-start;">
      <div style="flex:1 1 300px;"><strong>${apE(s.ini)}–${apE(s.fim)} · ${apE(apNomeTurma(s.turmaId))}</strong> ${apRotuloStatus(st)} ${enc ? '<span class="ap-chip ap-mut">sala encerrada</span>' : ''}<br>
        <span class="muted">${apE(s.titulo || s.code)}${s.disc ? ' · ' + apE(s.disc) : ''}</span><br>
        <span class="muted" style="font-size:.82rem;">Aplica: ${(s.aplicadores||[]).map(x => apE(x.nome)).join(' e ') || '—'}${s.prorrogadoMin ? ' · prorrogada +' + s.prorrogadoMin + ' min' : ''}</span>
        ${turma && V ? apResumoChips(c) : '<div class="spinner" style="margin:8px 0;"></div>'}</div>
      <div class="row" style="flex:0 0 auto; gap:6px;"><button class="btn btn-primary btn-sm" data-ap="abrir-sala" data-ap-id="${apE(ap.id)}" data-sid="${apE(s.id)}">🚪 Abrir sala</button></div>
    </div>`;
  }).join('');
  const provas = codes.map(code => { const s = ap.sessoes.find(x => x.code===code); const lib = (ap.gabLiberado||{})[code];
    return `<div class="list-item"><div><strong>${apE(s.titulo || code)}</strong> <span class="muted">· ${apE(s.disc||'')}</span><br><span class="muted" style="font-size:.82rem;">${lib ? '📢 Gabarito liberado em ' + apE(formatDateTime(new Date(lib).toISOString())) : 'Gabarito: ' + apE(apRotuloGab(ap.gabarito))}</span></div>
      ${lib ? '' : `<button class="btn btn-ghost btn-sm" data-ap="gabarito-agora" data-ap-id="${apE(ap.id)}" data-code="${apE(code)}">📢 Liberar gabarito agora</button>`}</div>`; }).join('');
  return `<div class="card">
    <div class="row" style="align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
      <h2 style="margin:0;">📡 ${apE(ap.nome)}</h2>
      <div class="row" style="gap:6px;"><button class="btn btn-ghost btn-sm" data-ap="atualizar">Atualizar</button><button class="btn btn-ghost btn-sm" data-ap="fechar-monitor">← Voltar</button></div>
    </div>
    <p class="muted">Acompanhe ao vivo cada sala: chamada, liberados, quem está fazendo, quem enviou e quem saiu da prova. Você também pode abrir a sala e agir como aplicador.</p>
    <div class="ap-dias">${dias.map(d => `<button class="pill-btn ${d===dia ? 'active' : ''}" data-ap="dia" data-dia="${apE(d)}">${apDataBr(d)}</button>`).join('')}</div>
    ${linhas || '<div class="empty">Nenhuma sala neste dia.</div>'}
    <h3 style="margin:18px 0 4px;">Gabarito das provas</h3>${provas}
  </div>`;
}
function apCtxSala(){
  const S = apS(); if(!S.sala) return null;
  const ap = (S.lista||[]).find(x => x.id===S.sala.apId); const s = ap && (ap.sessoes||[]).find(x => x.id===S.sala.sessId);
  if(!ap || !s) return null;
  return { ap, s, turma: S.turmas[s.turmaId] || null, V: S.vivo };
}
function apPodeAplicar(s){ return apEhCoord() || (s.aplicadores||[]).some(x => x.id===apProfId()); }
function apRenderSala(){
  const S = apS(); const ctx = apCtxSala();
  if(!ctx){ S.sala = null; return apEhCoord() ? apRenderCoordLista() : apRenderMinhas(); }
  const { ap, s, turma, V } = ctx;
  apCarregarTurma(s.turmaId);
  if(!apPodeAplicar(s)){ return `<div class="card"><h2>Sala</h2><p class="err">Você não está indicado como aplicador desta sala.</p><button class="btn btn-ghost" data-ap="sala-voltar">← Voltar</button></div>`; }
  if(!turma || !V) return `<div class="card"><h2>🚪 Sala ${apE(apNomeTurma(s.turmaId))}</h2><div class="spinner"></div></div>`;
  const d = V.sess[s.id] || {}; const enc = d.encerrada;
  const st = apStatusSessao(s); const c = apContar(s, turma, V);
  const sit = turma.students.map(al => ({ al, x: apSituacao(s, al, V) }));
  const saiu = sit.filter(o => o.x.cod==='saiu' || o.x.cod==='trava' || o.x.cod==='finalizando');
  const podeLiberarPresentes = sit.filter(o => o.x.presente && !o.x.liberado && !o.x.fazendo && !o.x.enviou && o.x.cod!=='saiu' && o.x.cod!=='trava');
  const semChamada = sit.filter(o => o.x.cod==='novo').length;
  const btnSaiu = o => {
    const r = o.x.req; const mot = r.motivo==='reabriu' ? 'Fechou ou recarregou a prova' : r.tipo==='trava' ? 'Tentou abrir em outro aparelho' : 'Saiu da tela da prova';
    return `<div class="ap-aluno ap-saiu"><div><strong>${apE(o.al.name)}</strong><br><span class="muted" style="font-size:.84rem;">${mot}${r.count>1 ? ' · ' + r.count + 'x' : ''} · há ${minutesAgo(r.lockedAt || Date.now())}</span>${r.pinErros ? `<br><span style="font-size:.8rem; color:#b3261e;">🔢 PIN errado ${r.pinErros}x no aparelho dele</span>` : ''}</div>
      ${o.x.cod==='finalizando' ? '<span class="muted">⏳ Finalizando — aguardando o aluno enviar</span>' : `<div class="row" style="gap:6px; flex-wrap:wrap;">
        ${r.tipo==='trava' ? `<button class="btn btn-primary ap-grande" data-ap="destravar" data-rid="${apE(r.id)}">🔓 Destravar</button>`
          : `<button class="btn btn-primary ap-grande" data-ap="liberar-volta" data-rid="${apE(r.id)}">🔓 Liberar a volta</button><button class="btn btn-ghost" data-ap="finalizar" data-rid="${apE(r.id)}">🏁 Finalizar a prova dele</button>`}</div>`}</div>`;
  };
  const linha = o => {
    const { al, x } = o; if(x.cod==='saiu' || x.cod==='trava' || x.cod==='finalizando') return '';
    let acoes = '';
    if(!enc){
      if(x.cod==='novo' || x.cod==='presente' || x.cod==='ausente'){
        acoes += `<button class="btn ${x.cod==='presente' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-ap="presenca" data-aid="${apE(al.id)}" data-v="p">Presente</button><button class="btn ${x.cod==='ausente' ? 'btn-danger' : 'btn-ghost'} btn-sm" data-ap="presenca" data-aid="${apE(al.id)}" data-v="a">Ausente</button>`;
        if(x.presente) acoes += `<button class="btn btn-primary btn-sm" data-ap="liberar" data-aid="${apE(al.id)}">🚪 Liberar</button>`;
      }
      if(x.cod==='liberado') acoes += `<button class="btn btn-ghost btn-sm" data-ap="retirar" data-aid="${apE(al.id)}">↩ Retirar liberação</button>`;
    }
    return `<div class="ap-aluno"><div><strong>${apE(al.name)}</strong></div><div class="row" style="gap:6px; flex-wrap:wrap; align-items:center;">${apChipSituacao(x.cod)}${acoes}</div></div>`;
  };
  const ocorr = (d.ocorrencias||[]).slice(-8).reverse();
  return `<div class="card">
    <div class="row" style="align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
      <h2 style="margin:0;">🚪 Sala ${apE(apNomeTurma(s.turmaId))} — ${apE(s.disc || s.titulo || '')}</h2>
      <div class="row" style="gap:6px;"><button class="btn btn-ghost btn-sm" data-ap="atualizar">Atualizar</button><button class="btn btn-ghost btn-sm" data-ap="sala-voltar">← Voltar</button></div>
    </div>
    <p class="muted"><strong>${apE(s.titulo || s.code)}</strong> · ${apDataBr(s.data)} · ${apE(s.ini)}–${apE(s.fim)}${s.prorrogadoMin ? ' (prorrogada +' + s.prorrogadoMin + ' min)' : ''} ${apRotuloStatus(st)}${enc ? ' <span class="ap-chip ap-mut">sala encerrada às ' + apE(apHm(enc.t)) + '</span>' : ''}</p>
    ${S.msg ? `<p style="color:#1f6f66; font-weight:600;">${apE(S.msg)}</p>` : ''}
    ${apResumoChips(c)}
    ${saiu.length ? `<h3 style="margin:14px 0 4px; color:#a23a1f;">🔒 Saíram da prova (${saiu.length})</h3>${saiu.map(btnSaiu).join('')}` : ''}
    ${enc ? `<div class="row" style="gap:8px; margin:12px 0;"><button class="btn btn-ghost" data-ap="reabrir">↺ Reabrir a sala</button><button class="btn btn-ghost" data-ap="copiar-ata">📋 Copiar a ata</button></div>` : `
    <div class="row" style="gap:8px; flex-wrap:wrap; margin:12px 0;">
      <button class="btn btn-ghost ap-grande" data-ap="todos-presentes" ${semChamada ? '' : 'disabled'}>✔ Marcar todos como presentes (${semChamada})</button>
      <button class="btn btn-primary ap-grande" data-ap="liberar-presentes" ${podeLiberarPresentes.length ? '' : 'disabled'}>🚪 Liberar os presentes (${podeLiberarPresentes.length})</button>
    </div>
    <p class="muted" style="font-size:.82rem; margin-top:0;">Faça a chamada, marque quem não está na sala como ausente e libere só quem está presente. Quem chegar atrasado pode ser marcado e liberado a qualquer momento, enquanto a prova estiver aberta.</p>`}
    <h3 style="margin:14px 0 4px;">Chamada e liberação</h3>
    ${sit.map(linha).join('') || '<div class="empty">A turma não tem alunos cadastrados.</div>'}
    ${enc ? '' : `<div class="row" style="gap:8px; flex-wrap:wrap; margin-top:14px;">
      <button class="btn btn-ghost btn-sm" data-ap="prorrogar" data-min="10">⏱ Prorrogar +10 min</button><button class="btn btn-ghost btn-sm" data-ap="prorrogar" data-min="20">⏱ +20 min</button>
      <button class="btn btn-danger btn-sm" data-ap="encerrar">🏁 Encerrar a sala</button></div>`}
    ${ocorr.length ? `<h3 style="margin:16px 0 4px;">Ocorrências</h3>${ocorr.map(o => `<div class="muted" style="font-size:.84rem;">${apE(apHm(o.t))} — ${apE(o.texto)}</div>`).join('')}` : ''}
  </div>`;
}
async function apMutSessao(ap, s, mut){
  await window.storage.update('aplic-sessao:' + ap.id + ':' + s.id, raw => {
    let d = {}; try{ d = raw ? JSON.parse(raw) : {}; }catch(e){ d = {}; }
    d.presentes = d.presentes || {}; d.ausentes = d.ausentes || {}; d.ocorrencias = d.ocorrencias || [];
    if(mut(d)===false) return undefined; return JSON.stringify(d);
  });
  // espelha na tela na hora (o aviso do banco chega logo depois)
  const S = apS(); if(S.vivo){ const d = S.vivo.sess[s.id] = S.vivo.sess[s.id] || {}; d.presentes = d.presentes || {}; d.ausentes = d.ausentes || {}; d.ocorrencias = d.ocorrencias || []; mut(d); }
}
async function apLiberarAlunos(ctx, alunos){
  const { ap, s } = ctx; const quem = apQuem(); const agora = Date.now();
  await window.storage.update('prova-liberacao:' + s.code, raw => {
    let d = { code: s.code, liberados: [] }; try{ d = raw ? JSON.parse(raw) : d; }catch(e){}
    if(!d || !Array.isArray(d.liberados)) d = { code: s.code, liberados: [] };
    alunos.forEach(al => { if(!alunoEstaLiberado(d.liberados, al.id, al.name)) d.liberados.push({ studentId: al.id, name: al.name, por: quem, em: agora, sala: s.id }); });
    d.atualizadoEm = agora; d.por = quem; return JSON.stringify(d);
  });
  const S = apS(); if(S.vivo){ const pp = S.vivo.prova[s.code] = S.vivo.prova[s.code] || { resp:[], lib:null, locks:[] }; pp.lib = pp.lib || { code: s.code, liberados: [] }; alunos.forEach(al => { if(!alunoEstaLiberado(pp.lib.liberados, al.id, al.name)) pp.lib.liberados.push({ studentId: al.id, name: al.name }); }); }
  await apMutSessao(ap, s, d => { alunos.forEach(al => { d.presentes[al.id] = d.presentes[al.id] || { t: agora, por: quem }; delete d.ausentes[al.id]; }); });
}
async function apAcao(ev, el){
  const S = apS(); const a = el.dataset.ap; const ctx = apCtxSala();
  const falha = e => { S.msg = ''; alert('Não consegui gravar agora (' + ((e && e.message) || 'sem conexão') + '). Confira a internet e tente de novo.'); };
  const alunoPorId = id => ctx && ctx.turma && ctx.turma.students.find(x => x.id===id);
  try{
    if(a==='nova'){ apNovaAplic(); return; }
    if(a==='editar'){ apEditar(el.dataset.id); return; }
    if(a==='excluir'){ await apExcluir(el.dataset.id); return; }
    if(a==='fechar-editor'){ if(confirm('Sair sem salvar as mudanças?')){ S.ed = null; S.erro = ''; render(); } return; }
    if(a==='salvar-rascunho'){ await apSalvar(false); return; }
    if(a==='publicar'){ await apSalvar(true); return; }
    if(a==='rm-sessao'){ S.ed.sessoes = S.ed.sessoes.filter(x => x.id!==el.dataset.sid); render(); return; }
    if(a==='def-todas'){ S.ed.sessoes.forEach(s => { s.data = S.ed.def.data; s.ini = S.ed.def.ini; s.fim = S.ed.def.fim; }); render(); return; }
    if(a==='ordenar'){ S.ed.sessoes.sort((x,y) => (x.data + x.ini).localeCompare(y.data + y.ini) || apNomeTurma(x.turmaId).localeCompare(apNomeTurma(y.turmaId))); render(); return; }
    if(a==='monitor'){ S.monId = el.dataset.id; S.dia = ''; S.vivo = null; S.vivoChave = ''; S.msg = ''; render(); apAtualizarVivo(true); return; }
    if(a==='fechar-monitor'){ S.monId = null; S.vivo = null; S.vivoChave = ''; render(); return; }
    if(a==='dia'){ S.dia = el.dataset.dia; S.vivo = null; S.vivoChave = ''; render(); apAtualizarVivo(true); return; }
    if(a==='atualizar'){ S.msg = ''; await apAtualizarVivo(true); render(); return; }
    if(a==='abrir-sala'){ S.sala = { apId: el.dataset.apId, sessId: el.dataset.sid }; S.vivo = null; S.vivoChave = ''; S.msg = ''; const ap = (S.lista||[]).find(x => x.id===S.sala.apId); const s = ap && ap.sessoes.find(x => x.id===S.sala.sessId); if(s) apCarregarTurma(s.turmaId); render(); apAtualizarVivo(true); return; }
    if(a==='sala-voltar'){ S.sala = null; S.vivo = null; S.vivoChave = ''; S.msg = ''; render(); if(S.monId) apAtualizarVivo(true); return; }
    if(a==='gabarito-agora'){ await apGabaritoAgora(el.dataset.apId, el.dataset.code); return; }
    if(!ctx) return;
    const { ap, s } = ctx;
    if(a==='presenca'){ const al = alunoPorId(el.dataset.aid); if(!al) return; const v = el.dataset.v; const atual = ctx.V && ctx.V.sess[s.id] || {};
      const jaIgual = v==='p' ? !!(atual.presentes && atual.presentes[al.id]) : !!(atual.ausentes && atual.ausentes[al.id]);
      await apMutSessao(ap, s, d => { delete d.presentes[al.id]; delete d.ausentes[al.id]; if(!jaIgual){ (v==='p' ? d.presentes : d.ausentes)[al.id] = { t: Date.now(), por: apQuem() }; } }); render(); return; }
    if(a==='todos-presentes'){ const sit = ctx.turma.students.filter(al => apSituacao(s, al, ctx.V).cod==='novo'); await apMutSessao(ap, s, d => { sit.forEach(al => { d.presentes[al.id] = d.presentes[al.id] || { t: Date.now(), por: apQuem() }; delete d.ausentes[al.id]; }); }); render(); return; }
    if(a==='liberar'){ const al = alunoPorId(el.dataset.aid); if(!al) return; await apLiberarAlunos(ctx, [al]); S.msg = `✅ ${al.name} liberado(a).`; render(); return; }
    if(a==='liberar-presentes'){
      const alvo = ctx.turma.students.filter(al => { const x = apSituacao(s, al, ctx.V); return x.presente && !x.liberado && !x.fazendo && !x.enviou && x.cod!=='saiu' && x.cod!=='trava'; });
      if(!alvo.length) return;
      await apLiberarAlunos(ctx, alvo); S.msg = `✅ ${alvo.length} aluno(s) liberado(s). Eles já podem iniciar a prova.`; render(); return; }
    if(a==='retirar'){ const al = alunoPorId(el.dataset.aid); if(!al) return; if(!confirm(`Retirar a liberação de ${al.name}?`)) return;
      await window.storage.update('prova-liberacao:' + s.code, raw => { let d = null; try{ d = raw ? JSON.parse(raw) : null; }catch(e){} if(!d || !Array.isArray(d.liberados)) return undefined; d.liberados = d.liberados.filter(l => !((l.studentId && l.studentId===al.id) || slugifyName(l.name)===slugifyName(al.name))); d.atualizadoEm = Date.now(); return JSON.stringify(d); });
      const pp = S.vivo && S.vivo.prova[s.code]; if(pp && pp.lib) pp.lib.liberados = pp.lib.liberados.filter(l => !((l.studentId && l.studentId===al.id) || slugifyName(l.name)===slugifyName(al.name)));
      render(); return; }
    if(a==='liberar-volta' || a==='finalizar' || a==='destravar'){
      const rid = el.dataset.rid; const r = ((ctx.V && ctx.V.ur) || []).find(x => x.id===rid); if(!r) return;
      if(a==='finalizar' && !confirm(`Finalizar a prova de ${r.studentName} agora? O que ele já respondeu será enviado e as questões em branco valerão 0. Não dá para desfazer.`)) return;
      if(a==='destravar' && !confirm(`Destravar a prova de ${r.studentName}? O aparelho que está com a prova aberta perde a vaga.`)) return;
      if(a==='destravar' && r.lockKey){ try{ await window.storage.delete(r.lockKey, true); }catch(e){} }
      await window.storage.update('unlock-requests', raw => { const l = apLerLista(raw); const e = l.find(x => x.id===rid); if(!e || e.released) return undefined;
        if(a==='finalizar'){ e.finalizar = true; e.finalizarAt = Date.now(); } else { e.released = true; e.releasedAt = Date.now(); e.liberadoPor = apQuem(); if(a==='destravar') e.destravada = true; }
        return JSON.stringify(l); });
      r.released = a!=='finalizar'; if(a==='finalizar') r.finalizar = true;
      await apMutSessao(ap, s, d => { d.ocorrencias.push({ t: Date.now(), por: apQuem(), texto: (a==='liberar-volta' ? `${r.studentName} saiu da prova (${r.motivo==='reabriu' ? 'fechou/recarregou' : 'saiu da tela'}); ${apQuem()} liberou a volta.` : a==='finalizar' ? `A prova de ${r.studentName} foi finalizada por ${apQuem()} após saída.` : `${r.studentName} abriu a prova em outro aparelho; ${apQuem()} destravou.`) }); });
      render(); return; }
    if(a==='prorrogar'){ const min = Number(el.dataset.min) || 10;
      if(!confirm(`Prorrogar o término desta sala em ${min} minutos?`)) return;
      const res = await apMudarAplic(ap.id, x => { const y = x.sessoes.find(q => q.id===s.id); if(!y) return false; const novo = apMs(y.data, y.fim) + min*60000; const d = new Date(novo); if(apPad(d.getDate())!==y.data.slice(8)) { y.fim = '23:59'; } else y.fim = apHm(novo); y.prorrogadoMin = (y.prorrogadoMin||0) + min; });
      if(res) await apSincronizar(res, []);
      await apMutSessao(ap, s, d => { d.ocorrencias.push({ t: Date.now(), por: apQuem(), texto: `Término prorrogado em ${min} min por ${apQuem()}.` }); });
      S.msg = `⏱ Prova prorrogada em ${min} min.`; render(); return; }
    if(a==='encerrar'){
      const c = apContar(s, ctx.turma, ctx.V);
      const aviso = (c.fazendo + c.saiu) ? `Ainda há ${c.fazendo + c.saiu} aluno(s) fazendo a prova ou bloqueado(s). ` : '';
      const naoAbriram = ctx.turma.students.filter(al => apSituacao(s, al, ctx.V).cod==='liberado');
      if(!confirm(`${aviso}Encerrar a sala ${apNomeTurma(s.turmaId)}? Quem está fazendo a prova continua até enviar${naoAbriram.length ? `; os ${naoAbriram.length} liberado(s) que ainda não abriram a prova perdem a liberação` : ''}. A chamada e as ocorrências ficam na ata.`)) return;
      if(naoAbriram.length){
        const fora = al => l => (l.studentId && l.studentId===al.id) || slugifyName(l.name)===slugifyName(al.name);
        await window.storage.update('prova-liberacao:' + s.code, raw => { let d = null; try{ d = raw ? JSON.parse(raw) : null; }catch(e){} if(!d || !Array.isArray(d.liberados)) return undefined;
          d.liberados = d.liberados.filter(l => !naoAbriram.some(al => fora(al)(l))); d.atualizadoEm = Date.now(); return JSON.stringify(d); });
        const pp = S.vivo && S.vivo.prova[s.code]; if(pp && pp.lib) pp.lib.liberados = pp.lib.liberados.filter(l => !naoAbriram.some(al => fora(al)(l)));
      }
      await apMutSessao(ap, s, d => { d.encerrada = { t: Date.now(), por: apQuem() }; if(naoAbriram.length) d.ocorrencias.push({ t: Date.now(), por: apQuem(), texto: `Sala encerrada; liberação retirada de quem não abriu a prova: ${naoAbriram.map(x => x.name).join(', ')}.` }); }); S.msg = ''; render(); return; }
    if(a==='reabrir'){ await apMutSessao(ap, s, d => { delete d.encerrada; }); render(); return; }
    if(a==='copiar-ata'){ const txt = apAtaTexto(ctx); try{ await navigator.clipboard.writeText(txt); S.msg = '📋 Ata copiada.'; }catch(e){ prompt('Copie a ata:', txt); } render(); return; }
  }catch(e){ falha(e); render(); }
}
async function apGabaritoAgora(apId, code){
  const S = apS(); const ap = (S.lista||[]).find(x => x.id===apId); if(!ap) return;
  if(!confirm('Liberar agora o resultado e o gabarito desta prova para os alunos?')) return;
  try{
    const res = await apMudarAplic(apId, x => { x.gabLiberado = x.gabLiberado || {}; x.gabLiberado[code] = Date.now(); });
    if(res) await apSincronizar(res, []);
    S.msg = '📢 Gabarito liberado aos alunos.';
  }catch(e){ alert('Não consegui liberar agora. Tente de novo.'); }
  render();
}
function apAtaTexto(ctx){
  const { ap, s, turma, V } = ctx; const d = (V && V.sess[s.id]) || {};
  const sit = turma.students.map(al => ({ al, x: apSituacao(s, al, V) }));
  const lista = f => sit.filter(f).map(o => o.al.name).join(', ') || '—';
  const c = apContar(s, turma, V);
  return [`ATA DE APLICAÇÃO — ${ap.nome}`, `Prova: ${s.titulo || s.code}${s.disc ? ' (' + s.disc + ')' : ''} · Turma ${apNomeTurma(s.turmaId)} · ${apDataBr(s.data)} ${s.ini}–${s.fim}`,
    `Aplicador(es): ${(s.aplicadores||[]).map(x => x.nome).join(' e ') || '—'}`, `Alunos: ${c.total} · presentes: ${c.presentes} · ausentes: ${c.ausentes} · enviaram: ${c.enviaram}`,
    `Ausentes: ${lista(o => o.x.ausente)}`, `Sem chamada: ${lista(o => o.x.cod==='novo')}`, `Presentes que não enviaram: ${lista(o => o.x.presente && !o.x.enviou)}`,
    `Ocorrências: ${(d.ocorrencias||[]).length ? '\n' + d.ocorrencias.map(o => `  ${apHm(o.t)} — ${o.texto}`).join('\n') : 'nenhuma'}`,
    d.encerrada ? `Sala encerrada às ${apHm(d.encerrada.t)} por ${d.encerrada.por}.` : ''].filter(Boolean).join('\n');
}
function apAvisoForm(){
  try{
    const p = state.professor; const a = p.editingCode && (p.assessments||[]).find(x => x.code===p.editingCode);
    if(a && a.aplicacaoId) return `<div class="card" style="border:2px solid var(--yellow,#e9c15c); background:var(--tint-gold,#fbf1de);"><strong>🗓️ Esta prova faz parte da aplicação “${apE(a.aplicacaoNome||'')}”.</strong><p style="margin:6px 0 0; font-size:.88rem;">Dia, horário, liberação da turma e gabarito são definidos pela coordenação e <strong>não mudam</strong> ao salvar aqui. Você pode corrigir as questões normalmente.</p></div>`;
  }catch(e){}
  return '';
}
async function apRenovarPrazoAluno(a, al){
  try{
    const r = await window.storage.get('assessment:' + a.code, true); const f = JSON.parse(r.value); if(!f) return;
    const w = assessmentParaTurma(f, alunoTurmaIdReal(al));
    a.agendaTurmas = f.agendaTurmas || {}; a.startAt = w.startAt || null; a.endAt = w.endAt || null;
  }catch(e){}
}
__parteOk('aplicacoes');
