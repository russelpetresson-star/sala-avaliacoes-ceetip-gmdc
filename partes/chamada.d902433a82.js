/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "chamada" */
function getChamadaCtx(){
  if(state.view==='freqmonitor') return { ch: state.freqMonitor.chamada, turmas: state.freqMonitor.turmas };
  return { ch: state.professor.chamada, turmas: professorTurmas() };
}
async function ensureDiasLetivosLoaded(){
  if(!state.diasLetivos.loading) return;
  try{ const r = await window.storage.get('dias-letivos', true); state.diasLetivos.map = JSON.parse(r.value) || {}; }
  catch(e){ state.diasLetivos.map = {}; }
  state.diasLetivos.loading = false;
}
async function saveDiasLetivosToStorage(){
  await window.storage.set('dias-letivos', JSON.stringify(state.diasLetivos.map), true);
}
function isDiaLetivo(dateStr){
  const map = state.diasLetivos.map || {};
  if(Object.prototype.hasOwnProperty.call(map, dateStr)) return !!map[dateStr];
  const d = new Date(dateStr+'T00:00:00');
  return d.getDay() !== 0; // domingo é não letivo por padrão; os demais dias são letivos por padrão
}
async function ensureTurnoHorariosLoaded(){
  if(!state.turnoHorarios.loading) return;
  try{ const r = await window.storage.get('turno-horarios', true); state.turnoHorarios.map = JSON.parse(r.value) || {}; }
  catch(e){ state.turnoHorarios.map = {}; }
  state.turnoHorarios.loading = false;
}
async function saveTurnoHorariosToStorage(){
  await window.storage.set('turno-horarios', JSON.stringify(state.turnoHorarios.map), true);
}
function calcStatusBip(turma, dataStr, agoraMs){
  const cfg = (state.turnoHorarios.map||{})[turma.turno];
  if(!cfg || !cfg.entrada) return 'presente';
  const [hh,mm] = cfg.entrada.split(':').map(Number);
  const limite = new Date(dataStr+'T00:00:00');
  limite.setHours(hh, mm + (parseInt(cfg.tolerancia)||0), 0, 0);
  return agoraMs > limite.getTime() ? 'atrasado' : 'presente';
}
function renderChamada(filtroTurnos, readOnly){
  return readOnly ? renderChamadaConsulta(filtroTurnos) : renderChamadaBipar(filtroTurnos);
}
async function ensureTotalEntradasDia(turmas, dataStr){
  if(!state.freqMonitor.totalEntradasCache) state.freqMonitor.totalEntradasCache = {};
  const cache = state.freqMonitor.totalEntradasCache;
  if(cache[dataStr]) return; // já carregado ou carregando
  cache[dataStr] = { loading:true, total:null };
  render();
  let total = 0;
  await Promise.all(turmas.map(async tm => {
    try{
      const r = await window.storage.get(`chamada:${tm.id}:${dataStr}`, true);
      const parsed = JSON.parse(r.value);
      total += (parsed.presentes||[]).length;
    }catch(e){ /* sem registro para essa turma nesse dia */ }
  }));
  cache[dataStr] = { loading:false, total };
  render();
}
function renderChamadaBipar(filtroTurnos){
  const { ch, turmas: todasTurmas } = getChamadaCtx();
  const turmas = filtroTurnos ? todasTurmas.filter(t=>filtroTurnos.includes(t.turno)) : todasTurmas;
  const turma = turmas.find(t=>t.id===ch.turmaId);
  let totalEscolaHtml = '';
  if(state.view==='freqmonitor' && turmas.length>0 && ch.data){
    ensureTotalEntradasDia(turmas, ch.data);
    const cacheT = (state.freqMonitor.totalEntradasCache||{})[ch.data];
    const totalVal = (cacheT && !cacheT.loading) ? cacheT.total : null;
    totalEscolaHtml = `
      <div class="card" style="margin-bottom:12px; background:#eef6ff; text-align:center;">
        <div class="muted" style="font-size:.78rem;">🏫 Total de alunos que entraram na escola em ${new Date(ch.data+'T00:00:00').toLocaleDateString('pt-BR')}</div>
        <div style="font-size:1.6rem; font-weight:700;">${totalVal===null ? '...' : totalVal}</div>
        <div class="muted" style="font-size:.72rem;">Soma de todas as turmas do turno monitorado (${turmas.length} turma${turmas.length===1?'':'s'})</div>
      </div>
    `;
  }
  let body = '';
  if(filtroTurnos && turmas.length===0){
    body = `<p class="muted center">Nenhuma turma foi marcada com esse turno ainda. Peça ao coordenador para definir o turno de cada turma em "Turmas".</p>`;
  } else if(!ch.turmaId){
    body = '<p class="muted center">Selecione uma turma e a data para começar.</p>';
  } else if(ch.loading){
    body = '<div class="spinner"></div>';
  } else if(!turma){
    body = '<p class="muted center">Turma não encontrada.</p>';
  } else {
    const presentesIds = new Set(ch.presentes.map(x=>x.studentId));
    const ausentes = turma.students.filter(s=>!presentesIds.has(s.id)).slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    const presentesOrdenados = ch.presentes.slice().sort((a,b)=>b.horario-a.horario); // mais recente primeiro
    const ultimo = presentesOrdenados[0];
    body = `
      <label>Aproxime o leitor de código de barras da carteirinha (ou digite a matrícula e aperte Enter)</label>
      <input type="text" id="chamada-scan-input" class="input" style="font-size:1.1rem; letter-spacing:1px;" placeholder="Escaneie ou digite a matrícula..." autocomplete="off">
      ${ch.mensagem ? `<p class="${ch.mensagemTipo==='erro'?'err':'muted'}" style="margin-top:6px; font-weight:600;">${esc(ch.mensagem)}</p>` : ''}
      ${ultimo ? `
        <div class="card" style="margin-top:14px; text-align:center; background:${ultimo.status==='atrasado'?'#fff3e0':'#e8f7e8'};">
          <div class="muted" style="font-size:.78rem;">Último registro</div>
          <div style="font-size:1.4rem; font-weight:700;">${esc(ultimo.name)}</div>
          <div style="font-size:1.05rem; margin-top:2px;">${ultimo.status==='atrasado'?'⏰ Atrasado':'✅ Presente'} · ${new Date(ultimo.horario).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
      ` : ''}
      <p class="muted" style="margin-top:16px; font-size:.82rem;">👀 Os alunos podem conferir aqui, na tela, quem já entrou e o status de cada um (presente ou atrasado).</p>
      <div class="row" style="margin-top:8px; gap:24px; align-items:flex-start; flex-wrap:wrap;">
        <div style="flex:1; min-width:220px;">
          <h3>Quem já entrou (${presentesOrdenados.length})</h3>
          ${presentesOrdenados.length===0 ? '<p class="muted" style="font-size:.85rem;">Nenhum registro ainda.</p>' : presentesOrdenados.map(r => `
            <div class="list-item" style="padding:6px 2px;">
              <span>${esc(r.name)}${r.matricula?' <span class="muted">· mat. '+esc(r.matricula)+'</span>':''}${r.manual?' <span class="muted">(manual)</span>':''} <span class="pill" style="font-size:.7rem; padding:1px 8px; ${r.status==='atrasado'?'background:#ffe0b2;':'background:#c8f0c8;'}">${r.status==='atrasado'?'Atrasado':'Presente'}</span></span>
              <div class="row" style="flex:0 0 auto; gap:6px;">
                <span class="muted" style="font-size:.78rem;">${new Date(r.horario).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                <button class="btn btn-ghost btn-sm" data-action="chamada-remover" data-sid="${r.studentId}">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="flex:1; min-width:220px;">
          <h3>Sem registro ainda (${ausentes.length})</h3>
          ${ausentes.length===0 ? '<p class="muted" style="font-size:.85rem;">Todos os alunos já foram registrados.</p>' : ausentes.map(s => `
            <div class="list-item" style="padding:6px 2px;">
              <span>${esc(s.name)}${s.matricula?' <span class="muted">· mat. '+esc(s.matricula)+'</span>':' <span class="muted">· sem matrícula</span>'}</span>
              <button class="btn btn-ghost btn-sm" data-action="chamada-marcar-manual" data-sid="${s.id}">Marcar presença</button>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="row" style="margin-top:16px;">
        <button class="btn btn-ghost btn-sm" data-action="chamada-exportar-xlsx">Exportar para Excel</button>
      </div>
    `;
  }
  return `
    ${totalEscolaHtml}
    <div class="card">
      <h2>🪪 Chamada por código de barras</h2>
      <p class="muted">Use o mesmo leitor de código de barras da carteirinha dos alunos que já é usado hoje — cada leitura marca a presença automaticamente pela matrícula cadastrada no sistema. Alunos sem matrícula cadastrada podem ser marcados manualmente na lista à direita.</p>
      <div class="row" style="gap:10px;">
        <div style="flex:1;">
          <label>Turma</label>
          <select id="chamada-turma-select" class="input">
            <option value="">Selecione...</option>
            ${turmas.map(t=>`<option value="${t.id}" ${ch.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}
          </select>
        </div>
        <div style="flex:1;">
          <label>Data</label>
          <input type="date" id="chamada-data-input" class="input" value="${esc(ch.data)}">
        </div>
      </div>
      ${body}
    </div>
  `;
}
function renderChamadaConsulta(filtroTurnos){
  const { ch, turmas: todasTurmas } = getChamadaCtx();
  const turmas = filtroTurnos ? todasTurmas.filter(t=>filtroTurnos.includes(t.turno)) : todasTurmas;
  const turma = turmas.find(t=>t.id===ch.turmaId);
  if(!ch.dataInicio) ch.dataInicio = ch.data || new Date().toISOString().slice(0,10);
  if(!ch.dataFim) ch.dataFim = ch.dataInicio;
  let body = '';
  if(!ch.turmaId){
    body = '<p class="muted center">Selecione uma turma e o período para consultar.</p>';
  } else if(ch.loading){
    body = '<div class="spinner"></div>';
  } else if(!turma){
    body = '<p class="muted center">Turma não encontrada.</p>';
  } else if(!ch.historico){
    body = '<p class="muted center">Escolha o período e clique em "Buscar".</p>';
  } else if(ch.historico.length===0){
    body = '<p class="muted center">Nenhum dia no período selecionado.</p>';
  } else {
    body = ch.historico.map(d => {
      const presentesIds = new Set((d.presentes||[]).map(x=>x.studentId));
      const ausentes = turma.students.filter(s=>!presentesIds.has(s.id));
      return `
        <div class="list-item" style="align-items:flex-start; flex-direction:column; padding:10px 4px;">
          <div class="row" style="width:100%; justify-content:space-between;">
            <strong>${new Date(d.dateStr+'T00:00:00').toLocaleDateString('pt-BR')}</strong>
            <span class="muted">${d.presentes ? d.presentes.length+' de '+turma.students.length+' presentes' : 'sem registro'}</span>
          </div>
          ${d.presentes && ausentes.length>0 ? `<span class="muted" style="font-size:.82rem; margin-top:4px;">Ausentes: ${ausentes.map(s=>esc(s.name)).join(', ')}</span>` : ''}
        </div>
      `;
    }).join('');
  }
  return `
    <div class="card">
      <h2>🪪 Frequência (consulta)</h2>
      <p class="muted">Consulte quantos alunos foram registrados em qualquer turma, num único dia ou num período de dias. A leitura da carteirinha é feita pelos monitores, na área "Controle de Frequência".</p>
      <div class="row" style="gap:10px; flex-wrap:wrap; align-items:flex-end;">
        <div style="flex:1; min-width:180px;">
          <label>Turma</label>
          <select id="chamada-turma-select" class="input">
            <option value="">Selecione...</option>
            ${turmas.map(t=>`<option value="${t.id}" ${ch.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}
          </select>
        </div>
        <div style="flex:1; min-width:140px;">
          <label>De</label>
          <input type="date" id="chamada-data-inicio-input" class="input" value="${esc(ch.dataInicio)}">
        </div>
        <div style="flex:1; min-width:140px;">
          <label>Até</label>
          <input type="date" id="chamada-data-fim-input" class="input" value="${esc(ch.dataFim)}">
        </div>
        <button class="btn btn-primary btn-sm" data-action="chamada-buscar-periodo" style="flex:0 0 auto;">Buscar</button>
      </div>
      <div style="margin-top:14px;">${body}</div>
      ${turma && ch.historico ? `<div class="row" style="margin-top:16px;"><button class="btn btn-ghost btn-sm" data-action="chamada-exportar-xlsx-periodo">Exportar para Excel</button></div>` : ''}
    </div>
  `;
}
async function loadChamada(){
  const { ch } = getChamadaCtx();
  if(!ch.turmaId || !ch.data){ return; }
  ch.loading = true; ch.mensagem=''; render();
  await ensureTurnoHorariosLoaded();
  try{
    const r = await window.storage.get(`chamada:${ch.turmaId}:${ch.data}`, true);
    const parsed = JSON.parse(r.value);
    ch.presentes = parsed.presentes || [];
  }catch(e){ ch.presentes = []; }
  ch.loading = false;
  render();
  focusChamadaInput();
}
function focusChamadaInput(){
  const el = document.getElementById('chamada-scan-input');
  if(el) el.focus();
}
async function salvarChamadaToStorage(){
  const { ch } = getChamadaCtx();
  await window.storage.set(`chamada:${ch.turmaId}:${ch.data}`, JSON.stringify({ presentes: ch.presentes, turmaId: ch.turmaId, data: ch.data, atualizadoEm: Date.now() }), true);
  if(state.view==='freqmonitor' && state.freqMonitor.totalEntradasCache){
    delete state.freqMonitor.totalEntradasCache[ch.data]; // força recálculo do total da escola nesse dia
  }
}
async function registrarPresencaPorMatricula(valorDigitado){
  const { ch, turmas } = getChamadaCtx();
  const valor = (valorDigitado||'').trim();
  if(!valor) return;
  const turma = turmas.find(t=>t.id===ch.turmaId);
  if(!turma) return;
  const aluno = turma.students.find(s => s.matricula && s.matricula.trim()===valor);
  if(!aluno){
    ch.mensagem = `Matrícula "${valor}" não encontrada nesta turma.`;
    ch.mensagemTipo = 'erro';
    render(); focusChamadaInput();
    return;
  }
  if(ch.presentes.some(x=>x.studentId===aluno.id)){
    ch.mensagem = `${aluno.name} já estava registrado.`;
    ch.mensagemTipo = 'aviso';
    render(); focusChamadaInput();
    return;
  }
  const agora = Date.now();
  ch.presentes.push({ studentId: aluno.id, matricula: aluno.matricula, name: aluno.name, horario: agora, manual:false, status: calcStatusBip(turma, ch.data, agora) });
  ch.mensagem = `✅ ${aluno.name} registrado.`;
  ch.mensagemTipo = 'ok';
  await salvarChamadaToStorage();
  render();
  focusChamadaInput();
}
async function chamadaMarcarManual(studentId){
  const { ch, turmas } = getChamadaCtx();
  const turma = turmas.find(t=>t.id===ch.turmaId);
  const aluno = turma ? turma.students.find(s=>s.id===studentId) : null;
  if(!aluno || ch.presentes.some(x=>x.studentId===studentId)) return;
  const agora = Date.now();
  ch.presentes.push({ studentId: aluno.id, matricula: aluno.matricula||'', name: aluno.name, horario: agora, manual:true, status: calcStatusBip(turma, ch.data, agora) });
  await salvarChamadaToStorage();
  render();
  focusChamadaInput();
}
async function chamadaRemover(studentId){
  const { ch } = getChamadaCtx();
  ch.presentes = ch.presentes.filter(x=>x.studentId!==studentId);
  await salvarChamadaToStorage();
  render();
  focusChamadaInput();
}
function chamadaExportarXlsx(){
  const { ch, turmas } = getChamadaCtx();
  const turma = turmas.find(t=>t.id===ch.turmaId);
  if(!turma) return;
  const presentesMap = {};
  ch.presentes.forEach(r => { presentesMap[r.studentId] = r; });
  const header = ['Matrícula','Nome','Situação','Horário'];
  const rows = turma.students.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(s => {
    const r = presentesMap[s.id];
    const situacao = r ? (r.status==='atrasado' ? 'Atrasado' : 'Presente') : 'Ausente';
    return [s.matricula||'', s.name, situacao, r?new Date(r.horario).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Chamada');
  XLSX.writeFile(wb, `chamada-${turma.name.replace(/[^a-z0-9]+/gi,'-')}-${ch.data}.xlsx`);
}
async function loadChamadaHistorico(){
  const { ch, turmas } = getChamadaCtx();
  const turma = turmas.find(t=>t.id===ch.turmaId);
  if(!turma || !ch.dataInicio || !ch.dataFim) return;
  let inicioStr = ch.dataInicio, fimStr = ch.dataFim;
  if(inicioStr > fimStr){ const tmp = inicioStr; inicioStr = fimStr; fimStr = tmp; }
  ch.loading = true; render();
  const dias = [];
  const cursor = new Date(inicioStr+'T00:00:00');
  const fimData = new Date(fimStr+'T00:00:00');
  while(cursor <= fimData && dias.length < 186){ // limite de ~6 meses para evitar buscas gigantes
    dias.push(cursor.toISOString().slice(0,10));
    cursor.setDate(cursor.getDate()+1);
  }
  const registros = await Promise.all(dias.map(async dateStr => {
    try{
      const r = await window.storage.get(`chamada:${turma.id}:${dateStr}`, true);
      const parsed = JSON.parse(r.value);
      return { dateStr, presentes: parsed.presentes || [] };
    }catch(e){ return { dateStr, presentes: null }; }
  }));
  ch.historico = registros.slice().reverse(); // mais recente primeiro
  ch.loading = false;
  render();
}
function chamadaExportarXlsxPeriodo(){
  const { ch, turmas } = getChamadaCtx();
  const turma = turmas.find(t=>t.id===ch.turmaId);
  if(!turma || !ch.historico) return;
  const header = ['Data','Matrícula','Nome','Situação','Horário'];
  const rows = [];
  ch.historico.slice().reverse().forEach(d => {
    const presentesMap = {};
    (d.presentes||[]).forEach(r => { presentesMap[r.studentId] = r; });
    turma.students.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).forEach(s => {
      const r = presentesMap[s.id];
      const situacao = d.presentes===null ? 'Sem registro' : (r ? (r.status==='atrasado'?'Atrasado':'Presente') : 'Ausente');
      rows.push([new Date(d.dateStr+'T00:00:00').toLocaleDateString('pt-BR'), s.matricula||'', s.name, situacao, r?new Date(r.horario).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'']);
    });
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Frequência');
  XLSX.writeFile(wb, `frequencia-${turma.name.replace(/[^a-z0-9]+/gi,'-')}-${ch.dataInicio}-a-${ch.dataFim}.xlsx`);
}
__parteOk('chamada');
