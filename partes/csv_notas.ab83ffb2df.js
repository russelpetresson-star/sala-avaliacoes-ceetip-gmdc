/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "csv_notas" */
function normalizeTexto(s){
  return (s||'').toString().normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
function parseNotaDecimal(raw){
  if(raw===undefined || raw===null) return null;
  const s = String(raw).trim();
  if(s==='') return null;
  const normalizado = /^\d+,\d+$/.test(s) ? s.replace(',', '.') : s;
  const n = parseFloat(normalizado);
  return isNaN(n) ? null : n;
}
function detectDelimiterCsv(linha){
  const qtdPontoEVirgula = (linha.match(/;/g)||[]).length;
  const qtdVirgula = (linha.match(/,/g)||[]).length;
  return qtdPontoEVirgula > qtdVirgula ? ';' : ',';
}
function montarRosterCombinado(){
  const roster = [];
  state.professor.turmas.forEach(t => {
    t.students.forEach(s => roster.push({ studentId:s.id, name:s.name, matricula:(s.matricula||'').trim(), turmaId:t.id, turmaName:t.name }));
  });
  return roster;
}
async function processarArquivoCsvNotas(file){
  const c = state.coordenador;
  c.importCsv = { processando:true, erro:'', resultado:null, nomeArquivo:file.name, importando:false };
  render();
  let texto;
  try{ texto = await file.text(); }
  catch(e){ c.importCsv = { processando:false, erro:'Não foi possível ler esse arquivo.', resultado:null, nomeArquivo:file.name, importando:false }; render(); return; }
  const parsed = parseCsvNotasTexto(texto);
  if(parsed.erro){
    c.importCsv = { processando:false, erro:parsed.erro, resultado:null, nomeArquivo:file.name, importando:false };
    render();
    return;
  }
  const roster = montarRosterCombinado();
  const porMatricula = {};
  const porNome = {};
  roster.forEach(r => {
    if(r.matricula) porMatricula[r.matricula] = r;
    porNome[normalizeTexto(r.name)] = r;
  });
  let matchedPorMatricula = 0, matchedPorNome = 0;
  const semCorrespondencia = [];
  const gruposMap = {};
  parsed.lancamentos.forEach(l => {
    let aluno = l.matricula ? porMatricula[l.matricula.trim()] : null;
    let via = 'matricula';
    if(aluno) matchedPorMatricula++;
    if(!aluno){
      aluno = porNome[normalizeTexto(l.nomeCsv)];
      via = 'nome';
      if(aluno) matchedPorNome++;
    }
    if(!aluno){
      semCorrespondencia.push(l);
      return;
    }
    const chaveGrupo = normalizeTexto(l.disciplinaNome) + '|' + l.unidade;
    if(!gruposMap[chaveGrupo]) gruposMap[chaveGrupo] = { disciplinaNome: l.disciplinaNome, unidade: l.unidade, itens: [] };
    gruposMap[chaveGrupo].itens.push({ studentId: aluno.studentId, studentName: aluno.name, turmaId: aluno.turmaId, turmaName: aluno.turmaName, nota: l.nota, via });
  });
  const grupos = Object.values(gruposMap).sort((a,b)=> a.disciplinaNome.localeCompare(b.disciplinaNome,'pt-BR') || a.unidade.localeCompare(b.unidade,'pt-BR'));
  c.importCsv = {
    processando:false, erro:'', nomeArquivo:file.name, importando:false,
    resultado: {
      formato: parsed.formato,
      totalLancamentos: parsed.lancamentos.length,
      matchedPorMatricula, matchedPorNome,
      semCorrespondencia,
      grupos
    }
  };
  render();
}
async function confirmarImportacaoNotasCsv(){
  const c = state.coordenador;
  const resultado = c.importCsv.resultado;
  if(!resultado) return;
  c.importCsv.importando = true;
  render();
  const assessmentsExistentes = [...state.professor.assessments, ...state.coordenador.assessments];
  let totalRespostasGravadas = 0;
  for(const grupo of resultado.grupos){
    if(grupo.itens.length===0) continue;
    const turmaIdsEnvolvidas = [...new Set(grupo.itens.map(i=>i.turmaId))];
    let assessment = assessmentsExistentes.find(a => a.importadoCsv && a.disciplinaName===grupo.disciplinaNome && a.unidade===grupo.unidade);
    let code;
    if(assessment){
      code = assessment.code;
      const turmaIdsUnidos = [...new Set([...(assessment.turmaIds||[]), ...turmaIdsEnvolvidas])];
      assessment = { ...assessment, turmaIds: turmaIdsUnidos };
    } else {
      code = genCode();
      assessment = {
        code,
        title: `Notas Finais (Importado) - ${grupo.disciplinaNome} - ${grupo.unidade}`,
        instrumento: 'avaliacao',
        unidade: grupo.unidade,
        disciplinaId: null,
        disciplinaName: grupo.disciplinaNome,
        turmaIds: turmaIdsEnvolvidas,
        questions: [{ id:cryptoId(), type:'mc', text:'Nota final (importada via CSV)', points:10, image:null, annulled:false, descritorSaeb:'', conteudo:'',
          options:[{id:cryptoId(),text:'—'},{id:cryptoId(),text:'—'}], correctOptionId:null }],
        startAt: null,
        endAt: new Date(2000,0,1).toISOString(),
        resultRelease: { mode:'imediato', releaseAt:'' },
        securityEnabled: false,
        professorId: null,
        professorName: 'Coordenação (importado)',
        createdAt: Date.now(),
        updatedAt: null,
        importadoCsv: true
      };
    }
    await window.storage.set(`assessment:${code}`, JSON.stringify(assessment), true);
    let responses = [];
    try{ const r = await window.storage.get(`responses:${code}`, true); responses = JSON.parse(r.value); }catch(e){ responses = []; }
    grupo.itens.forEach(item => {
      responses = responses.filter(r => r.studentName !== item.studentName);
      responses.push({ studentName:item.studentName, submittedAt:Date.now(), total:item.nota, details:[], answers:{}, tabSwitches:0, fullscreenExits:0, manual:true, importadoCsv:true });
      totalRespostasGravadas++;
    });
    await window.storage.set(`responses:${code}`, JSON.stringify(responses), true);
    const idxP = state.professor.assessments.findIndex(a=>a.code===code);
    if(idxP>=0) state.professor.assessments[idxP] = assessment;
    const idxC = state.coordenador.assessments.findIndex(a=>a.code===code);
    if(idxC>=0) state.coordenador.assessments[idxC] = assessment; else state.coordenador.assessments.unshift(assessment);
  }
  c.importCsv = { processando:false, erro:'', resultado:null, nomeArquivo:'', importando:false };
  if(c.dashboard) c.dashboard.stats = null;
  render();
  alert(`Importação concluída! ${totalRespostasGravadas} nota(s) gravada(s) no sistema.`);
}
function cancelarImportacaoNotasCsv(){
  state.coordenador.importCsv = { processando:false, erro:'', resultado:null, nomeArquivo:'', importando:false };
  render();
}
function renderImportarNotasCsv(){
  const c = state.coordenador;
  const ic = c.importCsv;
  let body;
  if(ic.processando){
    body = `<div class="spinner"></div>`;
  } else if(!ic.resultado){
    body = `
      <label>Selecione o arquivo CSV com as notas</label>
      <input type="file" id="import-notas-csv-file" accept=".csv">
      ${ic.erro ? `<p class="err" style="margin-top:8px;">${esc(ic.erro)}</p>` : ''}
    `;
  } else {
    const r = ic.resultado;
    body = `
      <div class="stat-row">
        ${renderStatTile('📄', r.totalLancamentos, 'Notas encontradas no arquivo', 'teal')}
        ${renderStatTile('✅', r.matchedPorMatricula + r.matchedPorNome, 'Correspondentes a alunos cadastrados', 'vinho')}
        ${renderStatTile('⚠️', r.semCorrespondencia.length, 'Sem correspondência', 'coral')}
      </div>
      <p class="muted" style="margin-top:10px; font-size:.85rem;">${r.matchedPorMatricula} encontrado(s) pela matrícula, ${r.matchedPorNome} encontrado(s) pelo nome (matrícula não bateu ou estava em branco).</p>
      <h3 style="margin-top:18px;">O que será gravado (${r.grupos.length} avaliação(ões)/disciplina(s))</h3>
      ${r.grupos.map(g => `
        <div class="list-item" style="align-items:flex-start; flex-direction:column;">
          <strong>${esc(g.disciplinaNome)} — ${esc(g.unidade)}</strong>
          <span class="muted" style="font-size:.85rem;">${g.itens.length} aluno(s) · turma(s): ${[...new Set(g.itens.map(i=>i.turmaName))].map(esc).join(', ')}</span>
        </div>
      `).join('')}
      ${r.semCorrespondencia.length>0 ? `
        <h3 style="margin-top:18px;">⚠️ Sem correspondência (${r.semCorrespondencia.length}) — não serão importados</h3>
        <p class="muted" style="font-size:.85rem;">Confira se a matrícula está cadastrada na turma (em "Turmas") ou se o nome está igual, e reenvie o arquivo depois de corrigir.</p>
        <div class="table-scroll">
        <table>
          <thead><tr><th>Matrícula</th><th>Nome no arquivo</th><th>Disciplina</th><th>Unidade</th></tr></thead>
          <tbody>
            ${r.semCorrespondencia.slice(0,50).map(l => `<tr><td>${esc(l.matricula)}</td><td>${esc(l.nomeCsv)}</td><td>${esc(l.disciplinaNome)}</td><td>${esc(l.unidade)}</td></tr>`).join('')}
          </tbody>
        </table>
        </div>
        ${r.semCorrespondencia.length>50 ? `<p class="muted" style="font-size:.8rem;">e mais ${r.semCorrespondencia.length-50}...</p>` : ''}
      ` : ''}
      <div class="row" style="margin-top:16px;">
        <button class="btn btn-ghost btn-sm" data-action="cancelar-importacao-notas-csv" ${ic.importando?'disabled':''}>Cancelar</button>
        <button class="btn btn-primary btn-sm" data-action="confirmar-importacao-notas-csv" ${ic.importando?'disabled':''}>${ic.importando?'Gravando...':'Confirmar e gravar no sistema'}</button>
      </div>
    `;
  }
  return `
    <div class="card">
      <h2>📥 Importar Notas Finais (CSV)</h2>
      <p class="muted">Envie um CSV com as notas por aluno: colunas M1 a M4 (uma por unidade), ou Disciplina + Unidade + Nota, ou Disciplina_M1 … Disciplina_M4. O sistema tenta casar cada aluno pela matrícula (e pelo nome quando a matrícula não bater) com os alunos já cadastrados em qualquer turma, e cria uma avaliação "importada" por disciplina/unidade — como se a nota já tivesse sido lançada — para preencher os painéis e gráficos. Nada é gravado até você conferir e confirmar.</p>
      ${body}
    </div>
  `;
}
async function loadPesos(){
  const p = state.professor;
  p.pesosLoading = true;
  try{ const r = await window.storage.get(`pesos-instrumentos:${p.session.id}`, true); p.pesos = {...DEFAULT_PESOS, ...JSON.parse(r.value)}; }
  catch(e){ p.pesos = {...DEFAULT_PESOS}; }
  p.pesosLoading = false;
  render();
}
async function savePesos(){
  const p = state.professor;
  const d = {
    avaliacao: Number(document.getElementById('peso-avaliacao-input').value) || 0,
    diagnostica: Number(document.getElementById('peso-diagnostica-input').value) || 0,
    exercicios: Number(document.getElementById('peso-exercicios-input').value) || 0,
    autoavaliacao: Number(document.getElementById('peso-autoavaliacao-input').value) || 0,
  };
  p.pesos = d;
  p.pesosDraft = null;
  await window.storage.set(`pesos-instrumentos:${p.session.id}`, JSON.stringify(d), true);
  render();
  alert('Pesos salvos.');
}
async function loadPin(){
  const p = state.professor;
  p.pinLoading = true;
  try{ const r = await window.storage.get('pin-liberacao', true); p.pin = r.value || ''; }
  catch(e){ p.pin = ''; }
  p.pinLoading = false;
  render();
}
async function savePin(){
  const p = state.professor;
  const val = document.getElementById('pin-liberacao-input').value.trim();
  if(!/^\d{4,6}$/.test(val)){ alert('O PIN precisa ter de 4 a 6 números.'); return; }
  if(['1234','4321','0000','1111','2222','123456','654321','000000','111111','1212','2580'].includes(val)){ alert('Esse PIN é fácil de adivinhar. Escolha outro (os alunos tentam 1234, 0000…).'); return; }
  p.pin = val;
  await window.storage.set('pin-liberacao', val, true);
  render();
  alert('PIN de liberação salvo.');
}
async function ensureProfessorDataLoaded(){
  const p = state.professor;
  if(p.bank.length===0 && p.bankLoading) loadBank();
  if(p.pesosLoading) loadPesos();
  if(p.pinLoading) loadPin();
  if(p.unlockRequestsLoading) loadUnlockRequests();
  if(p.periodosLoading) loadPeriodos();
  if(p.livrosLoading) loadLivros();
  if(p.avisosLoading) loadAvisos();
  if(p.materiaisLoading) loadMateriais();
  if(p.tarefasLoading) loadTarefas();
  if(p.mapasLoading) loadMapas();
  if(p.cronogramaLoading) loadCronograma();
  if(p.duvidasLoading) loadDuvidas();
  if(p.raItemsLoading) loadRaItems();
  if(p.temporadaLoading) loadTemporada();
  if(p.freqHoje.loading) loadFreqHoje();
  if(p.campanhaItensLoading) loadCampanhaProfessor();

  // Meu Painel virou a tela principal e depende de avaliações, turmas e disciplinas
  // já carregadas — por isso essas três são aguardadas antes de calcular o painel.
  const loads = [];
  if(p.assessments.length===0 && p.loadingList) loads.push(loadAssessmentsList());
  if(p.turmas.length===0 && p.turmasLoading) loads.push(loadTurmas());
  if(p.disciplinas.length===0 && p.disciplinasLoading) loads.push(loadDisciplinas());
  if(loads.length>0) await Promise.all(loads);
  if(p.subview==='painel' && !p.painel) calcProfessorPainel();
  if(!p.correcoesPendentesLoaded && !p.loadingList) ensureCorrecoesPendentesCount();
}
async function ensureCorrecoesPendentesCount(){
  const p = state.professor;
  p.correcoesPendentesLoaded = true;
  const comDissertativa = p.assessments.filter(a => (a.professorId? a.professorId===p.session.id : true) && (a.questions||[]).some(q=>q.type==='dissertativa'));
  let total = 0;
  for(const a of comDissertativa){
    try{
      const r = await window.storage.get(`responses:${a.code}`, true);
      const responses = JSON.parse(r.value) || [];
      total += responses.filter(resp => (resp.details||[]).some(d=>d.pending)).length;
    }catch(e){}
  }
  p.correcoesPendentesCount = total;
  render();
}
async function loadFreqHoje(){
  const p = state.professor;
  p.freqHoje.loading = true;
  if(p.turmas.length===0){
    try{ const r = await window.storage.get('turmas', true); p.turmas = JSON.parse(r.value); }catch(e){ p.turmas = []; }
  }
  const hoje = new Date().toISOString().slice(0,10);
  const turmasManha = professorTurmas().filter(t=>t.turno==='Manhã');
  const linhas = [];
  for(const t of turmasManha){
    let presentes = [];
    try{ const r = await window.storage.get(`chamada:${t.id}:${hoje}`, true); const parsed = JSON.parse(r.value); presentes = parsed.presentes || []; }catch(e){}
    const presentesIds = new Set(presentes.map(x=>x.studentId));
    const ausentes = t.students.filter(s=>!presentesIds.has(s.id)).map(s=>s.name).sort((a,b)=>a.localeCompare(b,'pt-BR'));
    linhas.push({ turmaId: t.id, turmaName: t.name, total: t.students.length, presentesCount: presentes.length, ausentes });
  }
  p.freqHoje = { loading:false, data: linhas };
  render();
}
async function loadLivros(){
  const p = state.professor;
  p.livrosLoading = true;
  try{
    const r = await window.storage.get('livros-didaticos', true);
    const saved = JSON.parse(r.value);
    p.livros = PNLD_CATALOG.map(c => {
      const found = saved.find(s=>s.id===c.id);
      return found ? {...c, downloadUrl: found.downloadUrl||null, fileName: found.fileName||null, uploadedAt: found.uploadedAt||null, editingLink:false} : {...c, downloadUrl:null, fileName:null, uploadedAt:null, editingLink:false};
    });
  }catch(e){
    p.livros = PNLD_CATALOG.map(c => ({...c, downloadUrl:null, fileName:null, uploadedAt:null, editingLink:false}));
  }
  p.livrosLoading = false;
  render();
}
async function saveLivrosToStorage(){
  await window.storage.set('livros-didaticos', JSON.stringify(state.professor.livros), true);
}
async function saveLivroLink(id){
  const p = state.professor;
  const item = p.livros.find(l=>l.id===id);
  if(!item) return;
  const input = document.getElementById('livro-link-input-'+id);
  const url = input ? input.value.trim() : '';
  if(!url){ alert('Cole o link de compartilhamento do Google Drive antes de salvar.'); return; }
  if(!/^https?:\/\//i.test(url)){ alert('O link precisa começar com http:// ou https://'); return; }
  item.downloadUrl = url;
  item.fileName = url.split('/').pop() || null;
  item.uploadedAt = Date.now();
  item.editingLink = false;
  await saveLivrosToStorage();
  render();
}
function editLivroLink(id){
  const item = state.professor.livros.find(l=>l.id===id);
  if(item){ item.editingLink = true; render(); }
}
function cancelLivroLinkEdit(id){
  const item = state.professor.livros.find(l=>l.id===id);
  if(item){ item.editingLink = false; render(); }
}
async function removeLivroFile(id){
  const p = state.professor;
  const item = p.livros.find(l=>l.id===id);
  if(!item) return;
  if(!confirm('Remover o link deste livro? (O arquivo continua no GitHub, só o link some daqui — você pode colar de novo depois.)')) return;
  item.downloadUrl = null; item.fileName = null; item.uploadedAt = null; item.editingLink = false;
  await saveLivrosToStorage();
  render();
}
async function loadPeriodos(){
  const p = state.professor;
  p.periodosLoading = true;
  try{ const r = await window.storage.get('periodos-avaliacao', true); p.periodos = JSON.parse(r.value); }
  catch(e){ p.periodos = {}; }
  p.periodosLoading = false;
  render();
}
async function savePeriodos(periodos){
  await window.storage.set('periodos-avaliacao', JSON.stringify(periodos), true);
}
function stopLiberacoesPoll(){
  if(liberacoesPollInterval){ clearInterval(liberacoesPollInterval); liberacoesPollInterval = null; }
}
async function finalizarProvaBloqueada(id){
  const p = state.professor;
  const r = (p.unlockRequests||[]).find(x=>x.id===id);
  if(!r) return;
  if(!confirm(`Finalizar a prova de ${r.studentName} agora? O que ele já respondeu será enviado e as questões em branco valerão 0. Isso não pode ser desfeito.`)) return;
  let list = [];
  try{ const x = await window.storage.get('unlock-requests', true); list = JSON.parse(x.value); }catch(e){ list = p.unlockRequests; }
  const e = list.find(x=>x.id===id);
  if(!e || e.released) { await loadUnlockRequests(); return; }
  e.finalizar = true; e.finalizarAt = Date.now();
  await window.storage.set('unlock-requests', JSON.stringify(list), true);
  p.unlockRequests = list;
  render();
}
async function destravarAluno(id){
  const p = state.professor;
  const r = (p.unlockRequests||[]).find(x=>x.id===id);
  if(!r) return;
  if(!confirm(`Destravar a prova de ${r.studentName}? O aparelho que está com a prova aberta perde a vaga e o aluno poderá iniciar de novo no aparelho que ele estiver usando agora.`)) return;
  try{ if(r.lockKey) await window.storage.delete(r.lockKey, true); }catch(e){}
  let list = [];
  try{ const x = await window.storage.get('unlock-requests', true); list = JSON.parse(x.value); }catch(e){ list = p.unlockRequests; }
  const e = list.find(x=>x.id===id);
  if(e){ e.released = true; e.releasedAt = Date.now(); e.destravada = true; }
  await window.storage.set('unlock-requests', JSON.stringify(list), true);
  p.unlockRequests = list;
  render();
}
async function releaseStudent(id){
  const p = state.professor;
  const idx = p.unlockRequests.findIndex(r=>r.id===id);
  if(idx<0) return;
  p.unlockRequests[idx].released = true;
  p.unlockRequests[idx].releasedAt = Date.now();
  await window.storage.set('unlock-requests', JSON.stringify(p.unlockRequests), true);
  render();
}
__parteOk('csv_notas');
