/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "risco_desemp" */
async function rkCarregarFreq(turmas){
  try{ await ensureDiasLetivosLoaded(); }catch(e){}
  const ano = String(new Date().getFullYear()); const out = {};
  await Promise.all((turmas||[]).map(async t => {
    let imp = null; try{ imp = JSON.parse((await window.storage.get('freq-import:' + t.id, true)).value); }catch(e){}
    let regs = [];
    try{ const r = await window.storage.list(`chamada:${t.id}:${ano}`, true);
      regs = Object.entries(r.values||{}).map(([k, v]) => { const data = k.split(':').pop(); try{ return isDiaLetivo(data) ? { data, ids: new Set((JSON.parse(v).presentes||[]).map(x => x.studentId)) } : null; }catch(e){ return null; } }).filter(Boolean);
    }catch(e){}
    (t.students||[]).forEach(s => {
      const im = imp && imp.alunos && imp.alunos[s.id];
      if(im && (im.pct!=null || im.discs)){ out[s.id] = { pct: im.pct!=null ? im.pct : null, aulas: im.aulas, faltas: im.faltas, fonte: 'relatório' + (imp.periodo ? ' (' + imp.periodo + ')' : ''), discs: im.discs || {} }; return; }
      if(regs.length){ const pres = regs.filter(r => r.ids.has(s.id)).length; out[s.id] = { pct: Math.round(pres / regs.length * 1000) / 10, aulas: regs.length, faltas: regs.length - pres, fonte: 'chamada do app', discs: {} }; }
    });
  }));
  RK_FREQ = out; return out;
}
function rkUnidadeDe(txt){ const t = normalizeTexto(String(txt||'')).replace(/\s+/g,' ').trim();
  const m = t.match(/^(?:M|U|UNIDADE|BIMESTRE|B)?\s*([1-4]|I{1,3}|IV)\s*(?:A|O|ª|º)?\s*(?:UNIDADE|BIMESTRE)?$/) || t.match(/^(I{1,3}|IV|[1-4])/);
  if(!m) return null; const r = { '1':0,'I':0,'2':1,'II':1,'3':2,'III':2,'4':3,'IV':3 }[m[1]]; return r==null ? null : UNIDADES[r]; }
async function colunaImportadaCsv(g, turma){
  const roster = (turma && turma.students) || []; const porChave = {}; roster.forEach(st => { porChave[nomeChave(st.name)] = st.name; });
  const grades = {};
  for(const a of g.assessments){ let resps = []; try{ resps = JSON.parse((await window.storage.get(`responses:${a.code}`, true)).value) || []; }catch(e){}
    resps.forEach(r => { const nome = roster.length ? porChave[nomeChave(r.studentName)] : r.studentName; if(!nome || typeof r.total!=='number') return;
      grades[nome] = { final: Math.max(0, Math.min(10, r.total)), precisaRecuperacao: r.total < 5, temRecuperacao: false, np1: null, diag: null, exerc: null, auto: null, recuperacao: null, np2: null, finalSemRecuperacao: r.total, recuperacaoValeu: false, importada: true }; }); }
  return { disciplinaName: g.disciplinaName, professorName: g.professorName || 'Coordenação (importado)', total: 10, pesos: DEFAULT_PESOS, grades, importada: true };
}
function rkFreqState(){ const c = state.coordenador; if(!c.rkFreq) c.rkFreq = { processando:false, erro:'', resultado:null, nomeArquivo:'', gravando:false, ok:'' }; return c.rkFreq; }
function rkParseFreq(texto){
  const limpo = String(texto||'').replace(/^﻿/, '').replace(/\r\n?/g, '\n'); const linhas = limpo.split('\n').filter(l => l.trim()!=='');
  if(linhas.length<2) return { erro:'O arquivo parece vazio.' };
  const delim = detectDelimiterCsv(linhas[0]); const H = linhas[0].split(delim).map(h => normalizeTexto(h.trim()).replace(/[%()]/g,'').trim());
  const ix = nomes => H.findIndex(h => nomes.includes(h));
  const iM = ix(['MATRICULA']), iA = ix(['ALUNO','NOME']), iD = ix(['DISCIPLINA','COMPONENTE']), iP = ix(['PERIODO','UNIDADE','BIMESTRE']);
  const iAu = ix(['AULAS','AULAS DADAS','TOTAL DE AULAS','CARGA HORARIA','DIAS LETIVOS']), iF = ix(['FALTAS','TOTAL DE FALTAS']), iPc = ix(['FREQUENCIA','FREQ','PERCENTUAL','PRESENCA']);
  if(iA<0 && iM<0) return { erro:'Não encontrei as colunas "Matricula" e "Aluno" (ou "Nome").' };
  if(iPc<0 && (iAu<0 || iF<0)) return { erro:'Preciso da coluna "Frequencia" (em %) ou das colunas "Aulas" e "Faltas".' };
  const itens = [];
  linhas.slice(1).forEach(l => { const c = l.split(delim).map(x => x.trim()); const matricula = iM>=0 ? c[iM]||'' : '', nomeCsv = iA>=0 ? c[iA]||'' : ''; if(!matricula && !nomeCsv) return;
    let pct = iPc>=0 ? parseNotaDecimal(String(c[iPc]||'').replace('%','')) : null; const aulas = iAu>=0 ? parseNotaDecimal(c[iAu]) : null, faltas = iF>=0 ? parseNotaDecimal(c[iF]) : null;
    if(pct==null && aulas && faltas!=null) pct = Math.round((aulas - faltas) / aulas * 1000) / 10;
    if(pct==null) return; if(pct<=1 && iPc>=0 && !/%/.test(c[iPc]) && pct>0 && String(c[iPc]).includes('.')) pct = pct*100;
    itens.push({ matricula, nomeCsv, disciplina: iD>=0 ? (c[iD]||'').trim() : '', periodo: iP>=0 ? c[iP]||'' : '', pct: Math.round(pct*10)/10, aulas, faltas }); });
  return { itens };
}
async function rkProcessarFreq(file){
  const f = rkFreqState(); f.processando = true; f.erro = ''; f.resultado = null; f.ok = ''; f.nomeArquivo = file.name; render();
  try{
    if(!state.professor.turmas.length) await loadTurmas();
    const p = rkParseFreq(await file.text()); if(p.erro){ f.erro = p.erro; f.processando = false; render(); return; }
    const roster = montarRosterCombinado(); const porMat = {}, porNome = {}; roster.forEach(r => { if(r.matricula) porMat[r.matricula] = r; porNome[normalizeTexto(r.name)] = r; });
    const porTurma = {}, sem = []; let periodo = '';
    p.itens.forEach(it => { const al = (it.matricula && porMat[it.matricula]) || porNome[normalizeTexto(it.nomeCsv)]; if(!al){ sem.push(it); return; }
      if(it.periodo) periodo = it.periodo;
      const T = porTurma[al.turmaId] = porTurma[al.turmaId] || { turmaId: al.turmaId, turmaName: al.turmaName, alunos: {} };
      const A = T.alunos[al.studentId] = T.alunos[al.studentId] || { nome: al.name, discs: {} };
      if(it.disciplina){ A.discs[normDisc(it.disciplina)] = { nome: it.disciplina, pct: it.pct, aulas: it.aulas, faltas: it.faltas }; }
      else { A.pct = it.pct; A.aulas = it.aulas; A.faltas = it.faltas; } });
    // só por disciplina: a frequência geral é a soma das aulas/faltas (ou a média dos percentuais)
    Object.values(porTurma).forEach(T => Object.values(T.alunos).forEach(A => { if(A.pct!=null) return; const ds = Object.values(A.discs); if(!ds.length) return;
      const au = ds.reduce((s, d) => s + (d.aulas||0), 0), fa = ds.reduce((s, d) => s + (d.faltas||0), 0);
      A.pct = au ? Math.round((au - fa) / au * 1000) / 10 : Math.round(ds.reduce((s, d) => s + d.pct, 0) / ds.length * 10) / 10; }));
    f.resultado = { porTurma, sem, periodo, total: p.itens.length, abaixo: Object.values(porTurma).reduce((s, T) => s + Object.values(T.alunos).filter(A => A.pct!=null && A.pct<RK_FREQ_MIN).length, 0) };
  }catch(e){ f.erro = 'Não consegui ler o arquivo: ' + (e.message||e); }
  f.processando = false; render();
}
async function rkGravarFreq(){
  const f = rkFreqState(); if(!f.resultado) return; f.gravando = true; render();
  const per = (document.querySelector('[data-rk-freq-periodo]')||{}).value || f.resultado.periodo || '';
  for(const T of Object.values(f.resultado.porTurma)) await window.storage.set('freq-import:' + T.turmaId, JSON.stringify({ periodo: per, atualizadoEm: Date.now(), arquivo: f.nomeArquivo, alunos: T.alunos }), true);
  const n = Object.keys(f.resultado.porTurma).length; f.resultado = null; f.gravando = false; f.ok = `Frequência gravada para ${n} turma(s). O risco acadêmico passa a usar este relatório.`;
  const rk = rkState(); rk.calculado = false; render();
}
function renderImportarFreq(){
  const f = rkFreqState(); let corpo;
  if(f.processando) corpo = '<div class="spinner"></div>';
  else if(!f.resultado) corpo = `<label>Arquivo CSV com a frequência</label><input type="file" accept=".csv" data-rk-freq-arq>
    ${f.erro ? `<p class="err">${esc(f.erro)}</p>` : ''}${f.ok ? `<p style="color:#2e7d32;font-weight:600;">✅ ${esc(f.ok)}</p>` : ''}`;
  else { const r = f.resultado; corpo = `<div class="stat-row">${renderStatTile('📄', r.total, 'Linhas no arquivo', 'teal')}${renderStatTile('👥', Object.values(r.porTurma).reduce((s, T) => s + Object.keys(T.alunos).length, 0), 'Alunos encontrados', 'vinho')}${renderStatTile('⚠️', r.abaixo, 'Abaixo de 75%', 'coral')}${renderStatTile('❓', r.sem.length, 'Sem correspondência', 'plum')}</div>
    <label style="margin-top:12px;">Período do relatório (aparece no risco)</label><input data-rk-freq-periodo value="${esc(r.periodo||'')}" placeholder="Ex.: até a III Unidade">
    <div class="table-scroll" style="margin-top:10px;"><table><tr><th>Turma</th><th>Alunos</th><th>Abaixo de 75%</th></tr>${Object.values(r.porTurma).map(T => `<tr><td>${esc(T.turmaName)}</td><td>${Object.keys(T.alunos).length}</td><td>${Object.values(T.alunos).filter(A => A.pct!=null && A.pct<RK_FREQ_MIN).length}</td></tr>`).join('')}</table></div>
    ${r.sem.length ? `<p class="muted" style="font-size:.82rem;">Sem correspondência (confira matrícula e nome em Turmas): ${r.sem.slice(0, 15).map(x => esc(x.nomeCsv || x.matricula)).join(', ')}${r.sem.length>15 ? '…' : ''}</p>` : ''}
    <div class="row" style="gap:8px;margin-top:12px;"><button class="btn btn-ghost btn-sm" data-rk="freq-cancelar">Cancelar</button><button class="btn btn-primary btn-sm" data-rk="freq-gravar" ${f.gravando?'disabled':''}>${f.gravando ? 'Gravando…' : 'Confirmar e gravar'}</button></div>`; }
  return `<div class="card"><h2>📥 Importar frequência (CSV)</h2>
    <p class="muted">Envie o relatório de frequência do sistema da escola. Ele passa a valer no risco acadêmico no lugar da chamada do app (frequência abaixo de 75% = reprovação por falta). Reenviar o relatório de uma turma substitui o anterior.</p>
    <p class="muted" style="font-size:.85rem;">Colunas aceitas: <b>Matricula; Aluno; Aulas; Faltas</b> ou <b>Matricula; Aluno; Frequencia</b> (em %). Por disciplina, acrescente <b>Disciplina</b> (uma linha por aluno e disciplina). <b>Periodo</b> é opcional. Separador ; ou , e vírgula decimal. Modelos: <code>work/modelos/modelo-frequencia.csv</code> e <code>modelo-frequencia-disciplina.csv</code>.</p>${corpo}</div>`;
}
function dshSvgBarrasH(itens, o){ // itens: [{ rot, val, cor, clk, txt }]
  o = o || {}; const max = o.max || Math.max(1, ...itens.map(i => i.val)); const lw = o.rotulo || 150, W = 640, h = 26, H = itens.length*h + 6;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;display:block;" role="img">${itens.map((it, i) => { const y = i*h + 3, w = Math.max(2, (W - lw - 70) * (it.val / max));
    return `<g data-dsh-clk="${esc(it.clk||'')}" style="cursor:pointer;"><title>${esc(it.rot)}: ${esc(String(it.txt!=null ? it.txt : it.val))}</title><rect x="0" y="${y}" width="${W}" height="${h-4}" fill="transparent"/>
      <text x="${lw-6}" y="${y+15}" text-anchor="end" font-size="12" fill="currentColor">${esc(it.rot.length>24 ? it.rot.slice(0,23)+'…' : it.rot)}</text>
      <rect x="${lw}" y="${y+2}" width="${w}" height="${h-8}" rx="4" fill="${it.cor||'#6B1F2E'}"/><text x="${lw+w+6}" y="${y+15}" font-size="12" font-weight="700" fill="currentColor">${esc(String(it.txt!=null ? it.txt : it.val))}</text></g>`; }).join('')}
    ${o.linha!=null ? `<line x1="${lw + (W-lw-70)*(o.linha/max)}" x2="${lw + (W-lw-70)*(o.linha/max)}" y1="0" y2="${H}" stroke="#b3261e" stroke-dasharray="4 3"/><text x="${lw + (W-lw-70)*(o.linha/max) + 3}" y="${H-2}" font-size="10" fill="#b3261e">${esc(o.linhaRot||'')}</text>` : ''}</svg>`;
}
function dshSvgEmpilhadas(linhas){ // linhas: [{ rot, clkRot, partes:[{ val, cor, clk, rot }], txt, txtCor }]
  const lw = 110, W = 640, h = 30, H = linhas.length*h + 4, bw = W - lw - 150;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;display:block;" role="img">${linhas.map((l, i) => { const y = i*h + 2; const tot = l.partes.reduce((s, p) => s + p.val, 0) || 1; let x = lw;
    return `<g><text x="${lw-6}" y="${y+18}" text-anchor="end" font-size="12" font-weight="700" fill="currentColor" data-dsh-clk="${esc(l.clkRot||'')}" style="cursor:pointer;">${esc(l.rot)}</text>
      ${l.partes.map(p => { const w = bw * p.val / tot; const r = p.val ? `<g data-dsh-clk="${esc(p.clk||'')}" style="cursor:pointer;"><title>${esc(l.rot)} · ${esc(p.rot)}: ${p.val}</title><rect x="${x}" y="${y+4}" width="${Math.max(0, w-1)}" height="${h-10}" fill="${p.cor}"/>${w>22 ? `<text x="${x + w/2}" y="${y+18}" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">${p.val}</text>` : ''}</g>` : ''; x += w; return r; }).join('')}
      <text x="${lw+bw+8}" y="${y+18}" font-size="12" font-weight="700" fill="${l.txtCor||'currentColor'}">${esc(l.txt||'')}</text></g>`; }).join('')}</svg>`;
}
function rkState(){ const c = state.coordenador; if(!c.rk) c.rk = { unidade:'__ano', turmaId:'', filtro:'emrisco', disc:'', busca:'', aberto:null, carregando:false, calculado:false, prog:'' }; return c.rk; }
async function rkCalcular(){
  const k = rkState(); if(k.carregando) return; k.carregando = true; k.prog = 'Carregando turmas e avaliações…'; render();
  try{
    if(!state.professor.turmas.length) await loadTurmas();
    if(!state.coordenador.assessments || !state.coordenador.assessments.length) await loadCoordAssessments();
    const turmas = fmTurmasPainel(); k.prog = 'Calculando notas e frequência…'; render();
    await calcularRiscoEscolar(turmas, k.unidade);
    k.linhas = riscoState().linhas.slice(); k.calculado = true; k.em = Date.now();
  }catch(e){ k.erro = 'Não foi possível calcular: ' + (e.message||e); }
  k.carregando = false; k.prog = ''; render();
}
const RK_FILTROS = { emrisco:'Em risco', fora:'Fora de risco', baixo:'Risco baixo', medio:'Risco médio', alto:'Risco alto', falta:'Reprovação por falta', evasao:'Provável evasão', atencao:'Atenção à frequência', todos:'Todos' };
function rkFiltrar(ls, k, semTurma){
  const q = normDisc(k.busca||'');
  return ls.filter(l => {
    if(!semTurma && k.turmaId && l.turmaId!==k.turmaId) return false;
    if(q && !normDisc(l.nome).includes(q)) return false;
    if(k.disc && !l.comps.some(c => normDisc(c.nome)===k.disc)) return false;
    const f = k.filtro;
    return f==='todos' ? true : f==='emrisco' ? ['baixo','medio','alto'].includes(l.risco) : f==='falta' ? l.reprovFalta : f==='evasao' ? l.evasao : f==='atencao' ? l.atencaoFreq : l.risco===f; });
}
function rkDetalheHtml(l){
  const cel = v => notaCel(v);
  const areas = AREAS_CONHEC.filter(a => l.areas[a.id].discs.length).map(a => { const A = l.areas[a.id]; const ok = A.media>=5;
    return `<div style="flex:1 1 220px;border:1px solid #eee;border-radius:10px;padding:8px;"><b>${esc(a.nome)}</b> · média ${cel(A.media)} ${ok ? '<span style="color:#2e7d32;font-size:.8rem;">✅ aprovado na área</span>' : '<span style="color:#b3261e;font-size:.8rem;">área abaixo de 5</span>'}
      <div style="font-size:.85rem;margin-top:4px;">${A.discs.map(d => `${esc(d.nome)} ${cel(d.nota)}${!ok && d.nota<5 ? ' <b style="color:#b3261e;">conta</b>' : ''}`).join('<br>')}</div></div>`; }).join('');
  const tec = l.individuais.length ? `<div style="flex:1 1 220px;border:1px solid #eee;border-radius:10px;padding:8px;"><b>Técnicas e outras</b> <span class="muted" style="font-size:.78rem;">(cada uma abaixo de 5 conta)</span><div style="font-size:.85rem;margin-top:4px;">${l.individuais.map(d => `${esc(d.nome)} ${cel(d.nota)}${d.nota<5 ? ' <b style="color:#b3261e;">conta</b>' : ''}`).join('<br>')}</div></div>` : '';
  const F = l.freq; const fdiscs = F && F.discs ? Object.values(F.discs).filter(d => d.pct<RK_FREQ_MIN) : [];
  const freq = `<div style="flex:1 1 220px;border:1px solid #eee;border-radius:10px;padding:8px;"><b>Frequência</b><div style="font-size:.85rem;margin-top:4px;">${F && F.pct!=null ? `<span style="font-size:1.2rem;font-weight:800;color:${F.pct<RK_FREQ_MIN ? '#b3261e' : F.pct<RK_FREQ_ATENCAO ? '#e07b24' : '#2e7d32'};">${String(F.pct).replace('.',',')}%</span>${F.faltas!=null ? ` · ${F.faltas} falta(s) em ${F.aulas}` : ''}<br><span class="muted">Fonte: ${esc(F.fonte)}</span>` : '<span class="muted">Sem dados de frequência (importe o relatório ou use a chamada).</span>'}
    ${l.reprovFalta ? '<br><b style="color:#b3261e;">Abaixo de 75%: reprovação por falta (risco alto).</b>' : l.atencaoFreq ? '<br><b style="color:#e07b24;">Entre 75% e 80%: atenção.</b>' : ''}${fdiscs.length ? '<br>Disciplinas abaixo de 75%: ' + fdiscs.map(d => `${esc(d.nome)} ${d.pct}%`).join(', ') : ''}</div></div>`;
  return `<div style="padding:8px 4px;"><div style="font-size:.9rem;margin-bottom:6px;"><b>Por que está ${RISCO_INFO[l.risco].label.toLowerCase()}:</b> ${l.total} componente(s) em reprovação${l.comps.length ? ' — ' + l.comps.map(c => `${esc(c.nome)}${c.motivo==='freq' ? ' (frequência)' : ''}`).join(', ') : ''}${l.reprovFalta ? ' · frequência geral abaixo de 75%' : ''}${l.evasao ? ' · média global abaixo de 3,0 (provável evasão)' : ''}.</div>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:stretch;">${areas}${tec}${freq}</div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px;">
      <button class="btn btn-ghost btn-sm" data-action="coord-sub-view" data-sub="buscaativa" style="width:auto;">🚌 Abrir Busca Ativa</button>
      <button class="btn btn-ghost btn-sm" data-action="coord-sub-view" data-sub="monitoria" style="width:auto;">🎯 Registrar na Monitoria</button>
      <button class="btn btn-ghost btn-sm" data-action="coord-sub-view" data-sub="avisospais" style="width:auto;">📲 Avisos aos pais</button></div></div>`;
}
function renderRiscoDash(){
  const k = rkState(), c = state.coordenador;
  if(!k.calculado && !k.carregando && !k.erro) setTimeout(rkCalcular, 0);
  const turmas = fmTurmasPainel();
  const topo = `<div class="card" data-rk-dash><h2>⚠️ Risco acadêmico</h2>${fmChipDemo()}
    <p class="muted">Área com média ≥ 5,0 aprova todas as disciplinas dela; área abaixo de 5,0 → cada disciplina da área abaixo de 5,0 conta. Técnicas: cada uma abaixo de 5,0 conta. Frequência abaixo de 75% = reprovação por falta (risco alto). <b>0</b> fora · <b>1–2</b> baixo · <b>3</b> médio · <b>4+</b> alto. Toque nos números e nas barras para filtrar.</p>
    <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div><label>Notas</label><select data-rk-sel="unidade"><option value="__ano" ${k.unidade==='__ano'?'selected':''}>Acumulado do ano</option>${UNIDADES.map(u => `<option value="${esc(u)}" ${k.unidade===u?'selected':''}>${esc(u)}</option>`).join('')}</select></div>
      <div><label>Turma</label><select data-rk-sel="turma"><option value="">Todas</option>${turmas.map(t => `<option value="${esc(t.id)}" ${k.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>
      <div style="flex:1 1 180px;"><label>Buscar aluno</label><input data-rk-busca value="${esc(k.busca)}" placeholder="Parte do nome" autocomplete="off"></div>
      <button class="btn btn-ghost btn-sm" data-rk="recalcular" style="width:auto;">🔄 Recalcular</button>
      <button class="btn btn-ghost btn-sm" data-rk="exportar" style="width:auto;" ${k.calculado?'':'disabled'}>⬇️ Planilha</button>
      <button class="btn btn-ghost btn-sm" data-rk="imprimir" style="width:auto;" ${k.calculado?'':'disabled'}>🖨️ PDF para reunião</button>
      <button class="btn btn-ghost btn-sm" data-action="coord-sub-view" data-sub="importarfreq" style="width:auto;">📥 Importar frequência</button>
    </div>${k.erro ? `<p class="err">${esc(k.erro)}</p>` : ''}</div>`;
  if(k.carregando || !k.calculado) return topo + `<div class="card"><div class="spinner"></div><p class="muted" style="text-align:center;">${esc(k.prog||'')}</p></div>`;
  const todosEsc = k.linhas, base = k.turmaId ? todosEsc.filter(l => l.turmaId===k.turmaId) : todosEsc;
  const cont = f => rkFiltrar(base, Object.assign({}, k, { filtro:f, disc:'', busca:'' })).length;
  const comNotas = base.filter(l => l.risco!=='semnotas').length; const emR = cont('emrisco'); const pctR = comNotas ? Math.round(emR / comNotas * 100) : 0;
  const tile = (f, icone, cor, sub) => `<button class="card" data-rk-filtro="${f}" style="flex:1 1 120px;margin:0;padding:10px;text-align:left;cursor:pointer;border:2px solid ${k.filtro===f ? cor : 'transparent'};">
    <div style="font-size:1.45rem;font-weight:800;color:${cor};line-height:1;">${icone} ${cont(f)}</div><div style="font-size:.8rem;font-weight:600;margin-top:4px;">${RK_FILTROS[f]}</div>${sub ? `<div class="muted" style="font-size:.72rem;">${sub}</div>` : ''}</button>`;
  const fontes = {}; base.forEach(l => { const f = l.freq ? (l.freq.fonte.startsWith('relatório') ? 'relatório importado' : 'chamada do app') : 'sem frequência'; fontes[f] = (fontes[f]||0) + 1; });
  const tiles = `<div class="row" style="gap:8px;flex-wrap:wrap;margin:10px 0;">
    ${tile('emrisco', '⚠️', '#6B1F2E', `${pctR}% dos alunos com notas · meta ≤ ${META_REPROVACAO_PCT}%`)}${tile('alto', '🔴', RISCO_INFO.alto.cor)}${tile('medio', '🟠', RISCO_INFO.medio.cor)}${tile('baixo', '🟡', RISCO_INFO.baixo.cor)}${tile('fora', '🟢', RISCO_INFO.fora.cor)}
    ${tile('falta', '📅', '#b3261e', 'frequência < 75%')}${tile('atencao', '👀', '#e07b24', 'entre 75% e 80%')}${tile('evasao', '🚪', '#5b1a2c', 'média global < 3,0')}</div>
    <p class="muted" style="font-size:.78rem;margin:0 0 8px;">Frequência: ${Object.entries(fontes).map(([f, n]) => `${n} aluno(s) com ${f}`).join(' · ')}. ${esc(k.unidade==='__ano' ? 'Notas: acumulado do ano.' : 'Notas: ' + k.unidade + '.')}</p>`;
  // gráfico por turma
  const grupos = {}; todosEsc.forEach(l => { (grupos[l.turmaId] = grupos[l.turmaId] || { nome:l.turmaNome, ls:[] }).ls.push(l); });
  const linhasT = Object.entries(grupos).sort((a, b) => a[1].nome.localeCompare(b[1].nome, 'pt', { numeric:true })).map(([id, g]) => { const n = riscoContagem(g.ls); const cn = g.ls.length - n.semnotas; const em = n.alto + n.medio + n.baixo; const p = cn ? Math.round(em / cn * 100) : 0;
    return { rot: g.nome, clkRot: 'turma|' + id, txt: `${p}% em risco ${cn ? (p<=META_REPROVACAO_PCT ? '✅' : '❌') : ''}`, txtCor: p<=META_REPROVACAO_PCT ? '#2e7d32' : '#b3261e',
      partes: ['alto','medio','baixo','fora'].map(r => ({ val: n[r], cor: RISCO_INFO[r].cor, rot: RISCO_INFO[r].label, clk: `turma|${id}|${r}` })) }; });
  const g1 = `<div class="card"><h3 style="margin-top:0;">Turmas · alunos por nível de risco</h3><p class="muted" style="font-size:.8rem;">Toque numa cor para ver esses alunos da turma; toque no nome para filtrar a turma. Meta institucional: até ${META_REPROVACAO_PCT}% de alunos em reprovação por turma.</p>
    ${dshSvgEmpilhadas(linhasT)}<div class="row" style="gap:10px;flex-wrap:wrap;font-size:.78rem;margin-top:4px;">${['alto','medio','baixo','fora'].map(r => `<span><span style="display:inline-block;width:10px;height:10px;background:${RISCO_INFO[r].cor};border-radius:2px;"></span> ${RISCO_INFO[r].label}</span>`).join('')}</div></div>`;
  // componentes que mais reprovam (na turma filtrada ou na escola)
  const porComp = {}; base.forEach(l => l.comps.forEach(cp => { const kk = normDisc(cp.nome); (porComp[kk] = porComp[kk] || { nome: cp.nome, n:0 }).n++; }));
  const comps = Object.entries(porComp).sort((a, b) => b[1].n - a[1].n).slice(0, 12);
  const g2 = `<div class="card"><h3 style="margin-top:0;">Componentes que mais reprovam${k.turmaId ? ' · ' + esc((grupos[k.turmaId]||{}).nome||'') : ' · escola'}</h3><p class="muted" style="font-size:.8rem;">Alunos com o componente contando como reprovação. Toque para ver quem são.</p>
    ${comps.length ? dshSvgBarrasH(comps.map(([kk, v]) => ({ rot: v.nome, val: v.n, cor: k.disc===kk ? '#b3261e' : '#6B1F2E', clk: 'disc|' + kk }))) : '<p class="muted">Nenhum componente em reprovação. 🎉</p>'}</div>`;
  // lista
  const lista = rkFiltrar(todosEsc, k).sort(ordenarPorRisco);
  const chips = [k.turmaId ? `Turma: ${esc((grupos[k.turmaId]||{}).nome||'')} <a href="#" data-rk="limpar-turma">✕</a>` : '', k.disc ? `Componente: ${esc((porComp[k.disc]||{ nome:k.disc }).nome)} <a href="#" data-rk="limpar-disc">✕</a>` : '', k.filtro!=='todos' ? `${RK_FILTROS[k.filtro]} <a href="#" data-rk-filtro="todos">✕</a>` : ''].filter(Boolean);
  const multi = !k.turmaId;
  const tab = `<div class="card"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px;align-items:center;"><h3 style="margin:0;">Alunos · ${lista.length}</h3><div style="font-size:.82rem;">${chips.map(x => `<span class="pill" style="background:#f3e6e9;color:#3b1018;margin-left:4px;font-family:inherit;letter-spacing:0;font-size:.8rem;">${x}</span>`).join('')}</div></div>
    <p class="muted" style="font-size:.8rem;">Toque no aluno para ver o porquê e as ações.</p>
    <div class="table-scroll"><table data-rk-tabela><tr><th>Aluno</th>${multi ? '<th>Turma</th>' : ''}<th>Componentes</th><th>Frequência</th><th>Média global</th><th>Classificação</th></tr>
    ${lista.slice(0, 300).map(l => { const ab = k.aberto===l.studentId + '|' + l.turmaId; const F = l.freq;
      return `<tr data-rk-aluno="${esc(l.studentId + '|' + l.turmaId)}" style="cursor:pointer;${ab ? 'background:#fbf3f4;' : ''}"><td><b>${esc(l.nome)}</b>${l.evasao ? ' 🚪' : ''}</td>${multi ? `<td>${esc(l.turmaNome)}</td>` : ''}
        <td style="font-size:.82rem;"><b>${l.total}</b>${l.comps.length ? ' · ' + l.comps.slice(0, 4).map(c => esc(c.nome)).join(', ') + (l.comps.length>4 ? '…' : '') : ''}</td>
        <td>${F && F.pct!=null ? `<span style="font-weight:700;color:${F.pct<RK_FREQ_MIN ? '#b3261e' : F.pct<RK_FREQ_ATENCAO ? '#e07b24' : 'inherit'};">${String(F.pct).replace('.',',')}%</span>` : '<span class="muted">—</span>'}</td>
        <td>${notaCel(l.mediaGlobal)}</td><td>${riscoPill(l.risco)}${l.reprovFalta ? ' <span class="pill" style="background:#b3261e;color:#fff;font-size:.7rem;">falta</span>' : ''}</td></tr>
        ${ab ? `<tr data-rk-detalhe><td colspan="${multi ? 6 : 5}">${rkDetalheHtml(l)}</td></tr>` : ''}`; }).join('') || `<tr><td colspan="6"><div class="empty">Nenhum aluno neste filtro.</div></td></tr>`}
    </table></div>${lista.length>300 ? '<p class="muted">Mostrando os 300 primeiros. Use os filtros.</p>' : ''}</div>`;
  return topo + tiles + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:12px;">${g1}${g2}</div>` + tab;
}
function rkExportar(){
  const k = rkState(); const ls = rkFiltrar(k.linhas, Object.assign({}, k, { filtro:'todos', disc:'', busca:'' })).sort(ordenarPorRisco);
  const linhas = [['Matrícula','Aluno','Turma','Classificação','Componentes em reprovação','Quais','Frequência (%)','Fonte da frequência','Reprovação por falta','Média global','Provável evasão', ...AREAS_CONHEC.map(a => 'Média ' + a.curto)]]
    .concat(ls.map(l => [l.matricula, l.nome, l.turmaNome, RISCO_INFO[l.risco].label, l.total, l.comps.map(c => c.nome + (c.motivo==='freq' ? ' (freq.)' : '')).join(', '), l.freq && l.freq.pct!=null ? l.freq.pct : '', l.freq ? l.freq.fonte : '', l.reprovFalta ? 'sim' : '', l.mediaGlobal, l.evasao ? 'sim' : '', ...AREAS_CONHEC.map(a => l.areas[a.id].media)]));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhas), 'Risco');
  XLSX.writeFile(wb, `risco-academico-${avpLocalData()}.xlsx`);
}
function rkImprimir(){
  const k = rkState(); const grupos = {}; k.linhas.forEach(l => { (grupos[l.turmaId] = grupos[l.turmaId] || { nome:l.turmaNome, ls:[] }).ls.push(l); });
  const resumo = Object.values(grupos).sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { numeric:true })).map(g => { const n = riscoContagem(g.ls); const cn = g.ls.length - n.semnotas; const em = n.alto + n.medio + n.baixo;
    return `<tr><td>${esc(g.nome)}</td><td>${cn}</td><td>${n.alto}</td><td>${n.medio}</td><td>${n.baixo}</td><td>${n.fora}</td><td>${g.ls.filter(l => l.reprovFalta).length}</td><td><b>${cn ? Math.round(em/cn*100) : 0}%</b> ${cn ? (em/cn*100<=META_REPROVACAO_PCT ? '✅' : '❌') : ''}</td></tr>`; }).join('');
  const porTurma = Object.values(grupos).sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { numeric:true })).map(g => { const ls = g.ls.filter(l => ['alto','medio','baixo'].includes(l.risco)).sort(ordenarPorRisco);
    return `<div class="pg"><h2>${esc(g.nome)} — alunos em risco (${ls.length})</h2><table><tr><th>Aluno</th><th>Nível</th><th>Componentes</th><th>Freq.</th><th>Média</th></tr>${ls.map(l => `<tr><td>${esc(l.nome)}</td><td>${RISCO_INFO[l.risco].label}${l.reprovFalta ? ' (falta)' : ''}</td><td>${l.total}: ${l.comps.map(c => esc(c.nome)).join(', ')}</td><td>${l.freq && l.freq.pct!=null ? l.freq.pct + '%' : '—'}</td><td>${fmt1(l.mediaGlobal)}</td></tr>`).join('') || '<tr><td colspan="5">Nenhum aluno em risco.</td></tr>'}</table></div>`; }).join('');
  const w = window.open('', '_blank'); if(!w) return;
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Risco acadêmico — CEETIP Gov. Marcelo Déda Chagas</title><style>body{font-family:Arial,sans-serif;font-size:10.5pt;color:#222;margin:12mm;} h1{color:#6B1F2E;font-size:16pt;} h2{color:#6B1F2E;font-size:13pt;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;} th{background:#f3e6e9;} .pg{page-break-before:always;}</style></head><body>
    <h1>CEETIP Gov. Marcelo Déda Chagas — Risco acadêmico</h1><p>${esc(k.unidade==='__ano' ? 'Notas: acumulado do ano' : 'Notas: ' + k.unidade)} · gerado em ${new Date().toLocaleString('pt-BR')}</p>
    <p>Regra: área com média ≥ 5 aprova todas as disciplinas dela; área abaixo de 5 → cada disciplina abaixo de 5 conta; técnica abaixo de 5 conta; frequência abaixo de 75% = reprovação por falta. 0 fora · 1–2 baixo · 3 médio · 4+ alto. Meta: até ${META_REPROVACAO_PCT}% por turma.</p>
    <table><tr><th>Turma</th><th>Com notas</th><th>Alto</th><th>Médio</th><th>Baixo</th><th>Fora</th><th>Por falta</th><th>Em risco</th></tr>${resumo}</table>${porTurma}<script>setTimeout(function(){window.print();},400);<\/script></body></html>`);
  w.document.close();
}
function dspState(){ const c = state.coordenador; if(!c.dsp) c.dsp = { unidade:'__ano', curso:'', foco:null, bin:null, carregando:false, cubo:null, prog:'' }; return c.dsp; }
const DSP_CURSOS = { PG:'Petróleo e Gás', ST:'Segurança do Trabalho' };
function dspCursoDe(nome){ const m = String(nome||'').toUpperCase().match(/^\s*\d+\s*[ªº°]?\s*([A-Z]+)/); return m ? m[1].replace(/\d+$/,'') : 'Outras'; }
function dspCursoNome(cod){ return DSP_CURSOS[cod] || cod; }
async function dspMontarCubo(turmas, prog){
  const mapa = await getAreasMapa();
  const cubo = {}; // turmaId → disc → { u: { [unidade]: { [aluno]: nota0a10 } }, np1:{[u]:[%]}, np2:{[u]:[%]} }
  for(let i=0; i<turmas.length; i++){ const t = turmas[i]; if(prog) prog(`Calculando ${t.name} (${i+1} de ${turmas.length})…`);
    const blocos = await Promise.all(UNIDADES.map(u => calcColunasParaUnidade(t.id, u, t)));
    const T = cubo[t.id] = {};
    blocos.forEach((cols, ui) => { const u = UNIDADES[ui]; const acc = {};
      (cols||[]).forEach(col => { const pe = col.pesos || DEFAULT_PESOS; const mx1 = pe.avaliacao || 5, mx2 = (pe.diagnostica||0) + (pe.exercicios||0) + (pe.autoavaliacao||0) || 5;
        Object.entries(col.grades||{}).forEach(([nome, g]) => { if(!g || g.final==null || isNaN(g.final)) return; const v = col.total ? g.final / col.total * 10 : g.final;
          const D = acc[col.disciplinaName] = acc[col.disciplinaName] || {}; const A = D[nome] = D[nome] || { v:[], n1:[], n2:[] }; A.v.push(v);
          if(g.np1!=null && !isNaN(g.np1)) A.n1.push(g.np1 / mx1 * 100); if(g.np2!=null && !isNaN(g.np2)) A.n2.push(g.np2 / mx2 * 100); }); });
      Object.entries(acc).forEach(([disc, alunos]) => { const X = T[disc] = T[disc] || { u:{}, np1:{}, np2:{} }; const med = a => a.reduce((s, x) => s + x, 0) / a.length;
        X.u[u] = {}; X.np1[u] = []; X.np2[u] = [];
        Object.entries(alunos).forEach(([nome, A]) => { X.u[u][nome] = r1(med(A.v)); if(A.n1.length) X.np1[u].push(med(A.n1)); if(A.n2.length) X.np2[u].push(med(A.n2)); }); }); });
  }
  const discs = [...new Set(Object.values(cubo).flatMap(T => Object.keys(T)))];
  const ordemArea = d => { const a = areaDaDisciplina(d, mapa); const i = AREAS_CONHEC.findIndex(x => x.id===a); return i<0 ? 99 : i; };
  discs.sort((a, b) => ordemArea(a) - ordemArea(b) || a.localeCompare(b, 'pt-BR'));
  return { cubo, discs, mapa };
}
async function dspCarregar(){
  const st = dspState(); if(st.carregando) return; st.carregando = true; st.prog = 'Carregando turmas e avaliações…'; render();
  try{
    if(!state.professor.turmas.length) await loadTurmas();
    if(!state.coordenador.assessments || !state.coordenador.assessments.length) await loadCoordAssessments();
    const turmas = fmTurmasPainel();
    const R = await dspMontarCubo(turmas, t => { st.prog = t; render(); });
    st.prog = 'Frequência…'; render();
    await rkCarregarFreq(turmas);
    st.cubo = R.cubo; st.discs = R.discs; st.mapa = R.mapa; st.em = Date.now();
  }catch(e){ st.erro = 'Não foi possível calcular: ' + (e.message||e); }
  st.carregando = false; st.prog = ''; render();
}
function dspNotas(tid, disc, u){
  const st = dspState(); const X = st.cubo && st.cubo[tid] && st.cubo[tid][disc]; if(!X) return {};
  if(u && u!=='__ano') return X.u[u] || {};
  const acc = {}; Object.values(X.u).forEach(m => Object.entries(m).forEach(([n, v]) => { (acc[n] = acc[n] || []).push(v); }));
  const out = {}; Object.entries(acc).forEach(([n, vs]) => { out[n] = r1(vs.reduce((s, x) => s + x, 0) / vs.length); }); return out;
}
function dspResumo(vals){ if(!vals.length) return null; const s = vals.slice().sort((a, b) => a - b); const med = r1(s.reduce((a, b) => a + b, 0) / s.length);
  const mediana = s.length % 2 ? s[(s.length-1)/2] : r1((s[s.length/2-1] + s[s.length/2]) / 2); const abaixo = s.filter(v => v<5).length;
  return { n: s.length, med, mediana, abaixo, pctAbaixo: Math.round(abaixo / s.length * 100), min: s[0], max: s[s.length-1] }; }
function dspCor(v){ if(v==null) return '#f2f2f2'; if(v<4) return '#e8a19b'; if(v<5) return '#f4c7b8'; if(v<6) return '#fbe7b5'; if(v<7) return '#e6efc4'; if(v<8) return '#c7e6c3'; return '#9fd3a0'; }
function dspTurmasVisiveis(){ const st = dspState(); return fmTurmasPainel().filter(t => !st.curso || dspCursoDe(t.name)===st.curso).sort((a, b) => a.name.localeCompare(b.name, 'pt', { numeric:true })); }
function dspDestaques(){
  const st = dspState(); const out = []; const turmas = dspTurmasVisiveis();
  turmas.forEach(t => st.discs.forEach(d => { const X = st.cubo[t.id] && st.cubo[t.id][d]; if(!X) return;
    const meds = UNIDADES.map(u => { const r = dspResumo(Object.values(X.u[u]||{})); return r ? r.med : null; });
    for(let i=1; i<4; i++) if(meds[i]!=null && meds[i-1]!=null && meds[i-1] - meds[i] >= 1) out.push({ peso: meds[i-1] - meds[i], txt: `📉 ${d} na ${t.name} caiu ${fmt1(meds[i-1] - meds[i])} ponto(s) da ${UNIDADES[i-1]} para a ${UNIDADES[i]} (${fmt1(meds[i-1])} → ${fmt1(meds[i])}).`, clk: `cel|${t.id}|${d}` });
    for(let i=1; i<4; i++) if(meds[i]!=null && meds[i-1]!=null && meds[i] - meds[i-1] >= 1.5) out.push({ peso: (meds[i] - meds[i-1]) * 0.6, txt: `📈 ${d} na ${t.name} subiu ${fmt1(meds[i] - meds[i-1])} ponto(s) da ${UNIDADES[i-1]} para a ${UNIDADES[i]}.`, clk: `cel|${t.id}|${d}` });
    const r = dspResumo(Object.values(dspNotas(t.id, d, st.unidade))); if(r && r.n>=5 && r.pctAbaixo>=40) out.push({ peso: r.pctAbaixo / 15, txt: `🔴 ${r.pctAbaixo}% dos alunos da ${t.name} estão abaixo de 5,0 em ${d} (média ${fmt1(r.med)}).`, clk: `cel|${t.id}|${d}` }); }));
  // mesma disciplina, diferença grande entre turmas da mesma série
  st.discs.forEach(d => { const porSerie = {}; turmas.forEach(t => { const r = dspResumo(Object.values(dspNotas(t.id, d, st.unidade))); const s = (t.name.match(/^\s*(\d)/)||[])[1]; if(r && s) (porSerie[s] = porSerie[s] || []).push({ t, r }); });
    Object.entries(porSerie).forEach(([s, ls]) => { if(ls.length<2) return; ls.sort((a, b) => a.r.med - b.r.med); const dif = ls[ls.length-1].r.med - ls[0].r.med;
      if(dif >= 1.5) out.push({ peso: dif * 0.8, txt: `↔️ ${d} na ${s}ª série: ${ls[ls.length-1].t.name} tem média ${fmt1(ls[ls.length-1].r.med)} e ${ls[0].t.name}, ${fmt1(ls[0].r.med)}.`, clk: `disc|${d}` }); }); });
  return out.sort((a, b) => b.peso - a.peso).slice(0, 5);
}
function dspSvgLinha(pontos, clkBase){ // pontos: [{ rot, val }]
  const W = 420, H = 170, l = 30, b = 24, t = 12, iw = W - l - 14, ih = H - t - b; const x = i => l + (pontos.length>1 ? iw * i / (pontos.length-1) : iw/2), y = v => t + ih * (1 - v/10);
  const vis = pontos.map((p, i) => p.val==null ? null : `${x(i)},${y(p.val)}`).filter(Boolean).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;display:block;">
    ${[0,5,10].map(v => `<line x1="${l}" x2="${W-14}" y1="${y(v)}" y2="${y(v)}" stroke="${v===5 ? '#b3261e' : '#ddd'}" ${v===5 ? 'stroke-dasharray="4 3"' : ''}/><text x="${l-4}" y="${y(v)+4}" font-size="10" text-anchor="end" fill="currentColor">${v}</text>`).join('')}
    <polyline points="${vis}" fill="none" stroke="#6B1F2E" stroke-width="2.5"/>
    ${pontos.map((p, i) => `<g data-dsh-clk="${esc(clkBase + '|' + p.rot)}" style="cursor:pointer;"><title>${esc(p.rot)}: ${p.val==null ? 'sem notas' : fmt1(p.val)}</title><rect x="${x(i)-22}" y="${t}" width="44" height="${ih + b}" fill="transparent"/>
      ${p.val!=null ? `<circle cx="${x(i)}" cy="${y(p.val)}" r="6" fill="${p.val<5 ? '#b3261e' : '#6B1F2E'}"/><text x="${x(i)}" y="${y(p.val)-10}" font-size="11" text-anchor="middle" font-weight="700" fill="currentColor">${fmt1(p.val)}</text>` : ''}
      <text x="${x(i)}" y="${H-6}" font-size="10" text-anchor="middle" fill="currentColor">${esc(p.rot.replace(' Unidade',''))}</text></g>`).join('')}</svg>`;
}
const DSP_BINS = [[0,2],[2,4],[4,5],[5,6],[6,7],[7,8],[8,10.01]];
function dspSvgHist(vals, clkBase, binSel){
  const cont = DSP_BINS.map(([a, b]) => vals.filter(v => v>=a && v<b).length); const mx = Math.max(1, ...cont); const W = 420, H = 160, l = 10, b = 24, iw = W - 20, bw = iw / DSP_BINS.length, ih = H - b - 16;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;display:block;">${DSP_BINS.map(([a, bb], i) => { const h = ih * cont[i] / mx; const x = l + i*bw;
    return `<g data-dsh-clk="${esc(clkBase + '|' + i)}" style="cursor:pointer;"><title>${a} a ${Math.min(10, bb).toFixed(0)}: ${cont[i]} aluno(s)</title><rect x="${x}" y="0" width="${bw}" height="${H}" fill="transparent"/>
      <rect x="${x+3}" y="${16 + ih - h}" width="${bw-6}" height="${h}" rx="3" fill="${a<5 ? '#b3261e' : '#2e7d32'}" opacity="${binSel===i ? 1 : binSel==null ? .85 : .4}"/>
      <text x="${x + bw/2}" y="${16 + ih - h - 3}" font-size="11" text-anchor="middle" font-weight="700" fill="currentColor">${cont[i] || ''}</text>
      <text x="${x + bw/2}" y="${H-6}" font-size="10" text-anchor="middle" fill="currentColor">${a}–${Math.min(10, bb).toFixed(0)}</text></g>`; }).join('')}</svg>`;
}
function dspTiles(r, extra){ const cx = (rot, val, cor) => `<div class="q-card" style="margin:0;flex:1 1 110px;"><div class="muted" style="font-size:.78rem;">${rot}</div><div style="font-size:1.35rem;font-weight:800;color:${cor||'inherit'};">${val}</div></div>`;
  return `<div class="row" style="gap:8px;flex-wrap:wrap;">${r ? cx('Média', fmt1(r.med), r.med<5 ? '#b3261e' : '#2e7d32') + cx('Mediana', fmt1(r.mediana)) + cx('Abaixo de 5,0', `${r.abaixo} (${r.pctAbaixo}%)`, r.pctAbaixo>20 ? '#b3261e' : 'inherit') + cx('Alunos com nota', r.n) : cx('Notas', 'sem notas')}${extra||''}</div>`; }
function dspFreqTurma(t){ const ps = (t.students||[]).map(s => RK_FREQ[s.id]).filter(f => f && f.pct!=null).map(f => f.pct); return ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) : null; }
function dspFocoHtml(){
  const st = dspState(); const f = st.foco; if(!f) return '';
  const turmas = dspTurmasVisiveis(); const tNome = id => ((state.professor.turmas||[]).find(t => t.id===id)||{}).name || id;
  const fechar = '<button class="btn btn-ghost btn-sm" data-dsp="fechar" style="width:auto;">✕ Fechar</button>';
  if(f.tipo==='cel'){
    const t = (state.professor.turmas||[]).find(x => x.id===f.tid); const X = st.cubo[f.tid] && st.cubo[f.tid][f.disc]; if(!t || !X) return '';
    const notas = dspNotas(f.tid, f.disc, st.unidade); const vals = Object.values(notas); const r = dspResumo(vals);
    const evo = UNIDADES.map(u => { const rr = dspResumo(Object.values(X.u[u]||{})); return { rot: u, val: rr ? rr.med : null }; });
    const med = a => a && a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null;
    const us = st.unidade==='__ano' ? UNIDADES : [st.unidade]; const n1 = med(us.flatMap(u => X.np1[u]||[])), n2 = med(us.flatMap(u => X.np2[u]||[]));
    const fr = dspFreqTurma(t);
    let alunos = Object.entries(notas).map(([nome, v]) => ({ nome, v })); const binSel = st.bin;
    if(binSel!=null){ const [a, b] = DSP_BINS[binSel]; alunos = alunos.filter(x => x.v>=a && x.v<b); } else alunos = alunos.filter(x => x.v<5);
    alunos.sort((a, b) => a.v - b.v);
    const sAluno = nome => (t.students||[]).find(s => mesmoNomeAluno(s.name, nome));
    return `<div class="card" data-dsp-foco style="border:2px solid #6B1F2E;"><div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;"><h3 style="margin:0;">${esc(f.disc)} · ${esc(t.name)} <span class="muted" style="font-weight:400;font-size:.85rem;">${esc(st.unidade==='__ano' ? 'acumulado do ano' : st.unidade)}</span></h3>
      <div class="row" style="gap:6px;"><button class="btn btn-ghost btn-sm" data-dsh-clk="disc|${esc(f.disc)}" style="width:auto;">Ver ${esc(f.disc)} nas outras turmas</button><button class="btn btn-ghost btn-sm" data-dsh-clk="turma|${esc(f.tid)}" style="width:auto;">Todas as disciplinas da ${esc(t.name)}</button>${fechar}</div></div>
      ${dspTiles(r, `<div class="q-card" style="margin:0;flex:1 1 110px;"><div class="muted" style="font-size:.78rem;">NP1 · NP2 (% do máximo)</div><div style="font-size:1.35rem;font-weight:800;">${n1==null ? '—' : n1 + '%'} · ${n2==null ? '—' : n2 + '%'}</div></div><div class="q-card" style="margin:0;flex:1 1 110px;"><div class="muted" style="font-size:.78rem;">Frequência média da turma</div><div style="font-size:1.35rem;font-weight:800;color:${fr!=null && fr<75 ? '#b3261e' : 'inherit'};">${fr==null ? '—' : fr + '%'}</div></div>`)}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px;margin-top:10px;">
        <div><b style="font-size:.9rem;">Evolução por unidade</b> <span class="muted" style="font-size:.75rem;">(toque numa unidade para trocar o período)</span>${dspSvgLinha(evo, 'unid')}</div>
        <div><b style="font-size:.9rem;">Distribuição das notas</b> <span class="muted" style="font-size:.75rem;">(toque numa faixa para ver os alunos)</span>${dspSvgHist(vals, 'bin', binSel)}</div></div>
      <h4 style="margin:10px 0 4px;">${binSel!=null ? `Alunos com nota de ${DSP_BINS[binSel][0]} a ${Math.min(10, DSP_BINS[binSel][1]).toFixed(0)} <a href="#" data-dsp="bin-limpar" style="font-weight:400;font-size:.8rem;">(voltar aos abaixo de 5)</a>` : 'Alunos abaixo de 5,0'} · ${alunos.length}</h4>
      <div class="table-scroll"><table><tr><th>Aluno</th>${UNIDADES.map(u => `<th>${esc(u.replace(' Unidade',''))}</th>`).join('')}<th>${st.unidade==='__ano' ? 'Acumulado' : 'Nota'}</th><th>Frequência</th></tr>
        ${alunos.map(a => { const s = sAluno(a.nome); const F = s && RK_FREQ[s.id]; return `<tr><td>${esc(a.nome)}</td>${UNIDADES.map(u => `<td>${(X.u[u]||{})[a.nome]!=null ? notaCel(X.u[u][a.nome]) : '<span class="muted">—</span>'}</td>`).join('')}<td><b>${notaCel(a.v)}</b></td><td>${F && F.pct!=null ? `<span style="color:${F.pct<75 ? '#b3261e' : 'inherit'};">${String(F.pct).replace('.',',')}%</span>` : '—'}</td></tr>`; }).join('') || '<tr><td colspan="7"><div class="empty">Ninguém nesta faixa. 🎉</div></td></tr>'}</table></div></div>`;
  }
  if(f.tipo==='disc'){
    const itens = turmas.map(t => { const r = dspResumo(Object.values(dspNotas(t.id, f.disc, st.unidade))); return r ? { rot: t.name, val: r.med, txt: `${fmt1(r.med)} · ${r.pctAbaixo}% < 5`, cor: r.med<5 ? '#b3261e' : r.med<6 ? '#e07b24' : '#2e7d32', clk: `cel|${t.id}|${f.disc}` } : null; }).filter(Boolean);
    return `<div class="card" data-dsp-foco style="border:2px solid #6B1F2E;"><div class="row" style="justify-content:space-between;align-items:center;"><h3 style="margin:0;">${esc(f.disc)} em todas as turmas</h3>${fechar}</div>
      <p class="muted" style="font-size:.8rem;">Média da disciplina por turma (linha vermelha = 5,0). Toque numa turma para o detalhe.</p>${itens.length ? dshSvgBarrasH(itens, { max: 10, linha: 5, linhaRot: '5,0', rotulo: 110 }) : '<p class="muted">Sem notas.</p>'}</div>`;
  }
  if(f.tipo==='turma'){
    const t = (state.professor.turmas||[]).find(x => x.id===f.tid); if(!t) return '';
    const itens = st.discs.map(d => { const r = dspResumo(Object.values(dspNotas(t.id, d, st.unidade))); return r ? { rot: d, val: r.med, txt: `${fmt1(r.med)} · ${r.pctAbaixo}% < 5`, cor: r.med<5 ? '#b3261e' : r.med<6 ? '#e07b24' : '#2e7d32', clk: `cel|${t.id}|${d}` } : null; }).filter(Boolean);
    const areasT = AREAS_CONHEC.map(a => { const vs = st.discs.filter(d => areaDaDisciplina(d, st.mapa)===a.id).flatMap(d => Object.values(dspNotas(t.id, d, st.unidade))); const r = dspResumo(vs); return r ? `<span class="pill" style="background:${dspCor(r.med)};color:#2b1a1d;margin:2px;font-family:inherit;letter-spacing:0;">${esc(a.curto)} ${fmt1(r.med)}</span>` : ''; }).join('');
    const fr = dspFreqTurma(t);
    return `<div class="card" data-dsp-foco style="border:2px solid #6B1F2E;"><div class="row" style="justify-content:space-between;align-items:center;"><h3 style="margin:0;">${esc(t.name)} · todas as disciplinas</h3>${fechar}</div>
      <p class="muted" style="font-size:.8rem;">Médias por área: ${areasT || '—'} · frequência média ${fr==null ? '—' : fr + '%'}. Toque numa disciplina para o detalhe.</p>${itens.length ? dshSvgBarrasH(itens, { max: 10, linha: 5, linhaRot: '5,0', rotulo: 170 }) : '<p class="muted">Sem notas.</p>'}</div>`;
  }
  return '';
}
function renderDesempenho(){
  const st = dspState();
  if(!st.cubo && !st.carregando && !st.erro) setTimeout(dspCarregar, 0);
  const cursos = [...new Set(fmTurmasPainel().map(t => dspCursoDe(t.name)))].sort();
  const topo = `<div class="card" data-dsp-dash><h2>📊 Desempenho por turma e disciplina</h2>${fmChipDemo()}
    <p class="muted">Médias das notas do boletim (0 a 10), das avaliações do app e das notas importadas. Toque numa célula, no nome de uma turma ou no nome de uma disciplina.</p>
    <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div><label>Período</label><select data-dsp-sel="unidade"><option value="__ano" ${st.unidade==='__ano'?'selected':''}>Acumulado do ano</option>${UNIDADES.map(u => `<option value="${esc(u)}" ${st.unidade===u?'selected':''}>${esc(u)}</option>`).join('')}</select></div>
      <div><label>Curso</label><select data-dsp-sel="curso"><option value="">Todos</option>${cursos.map(c => `<option value="${esc(c)}" ${st.curso===c?'selected':''}>${esc(dspCursoNome(c))}</option>`).join('')}</select></div>
      <button class="btn btn-ghost btn-sm" data-dsp="recalcular" style="width:auto;">🔄 Recalcular</button>
      <button class="btn btn-ghost btn-sm" data-dsp="exportar" style="width:auto;" ${st.cubo?'':'disabled'}>⬇️ Planilha</button>
      <button class="btn btn-ghost btn-sm" data-action="coord-sub-view" data-sub="pmaescola" style="width:auto;">🧭 Planejado × Dado × Aprendido</button>
    </div>${st.erro ? `<p class="err">${esc(st.erro)}</p>` : ''}</div>`;
  if(st.carregando || !st.cubo) return topo + `<div class="card"><div class="spinner"></div><p class="muted" style="text-align:center;">${esc(st.prog||'')}</p></div>`;
  const turmas = dspTurmasVisiveis(); const discs = st.discs;
  if(!discs.length) return topo + '<div class="card"><div class="empty">Ainda não há notas lançadas ou importadas.</div></div>';
  const cel = (t, d) => { const r = dspResumo(Object.values(dspNotas(t.id, d, st.unidade))); const sel = st.foco && st.foco.tipo==='cel' && st.foco.tid===t.id && st.foco.disc===d;
    return `<td data-dsh-clk="cel|${esc(t.id)}|${esc(d)}" title="${esc(t.name)} · ${esc(d)}${r ? `: média ${fmt1(r.med)}, ${r.pctAbaixo}% abaixo de 5` : ': sem notas'}" style="cursor:pointer;text-align:center;color:#2b1a1d;background:${dspCor(r && r.med)};${sel ? 'outline:3px solid #6B1F2E;outline-offset:-3px;' : ''}font-weight:700;">${r ? fmt1(r.med) : '<span style="font-weight:400;opacity:.5;">—</span>'}${r && r.pctAbaixo>=30 ? `<div style="font-size:.66rem;font-weight:600;color:#7a1d16;">${r.pctAbaixo}% &lt;5</div>` : ''}</td>`; };
  const linhaMedia = t => { const vs = discs.flatMap(d => Object.values(dspNotas(t.id, d, st.unidade))); const r = dspResumo(vs); return `<td style="text-align:center;color:#2b1a1d;background:${dspCor(r && r.med)};font-weight:800;">${r ? fmt1(r.med) : '—'}</td>`; };
  const areaDe = d => { const a = AREAS_CONHEC.find(x => x.id===areaDaDisciplina(d, st.mapa)); return a ? a.curto : 'Técnicas e outras'; };
  const grupos = []; discs.forEach(d => { const g = areaDe(d); if(!grupos.length || grupos[grupos.length-1].g!==g) grupos.push({ g, n:0 }); grupos[grupos.length-1].n++; });
  const mapaCalor = `<div class="card"><h3 style="margin-top:0;">Mapa de calor · média por turma e disciplina</h3>
    <div class="row" style="gap:8px;flex-wrap:wrap;font-size:.75rem;margin-bottom:6px;">${[['< 4', 3], ['4–5', 4.5], ['5–6', 5.5], ['6–7', 6.5], ['7–8', 7.5], ['≥ 8', 9]].map(([r, v]) => `<span><span style="display:inline-block;width:14px;height:10px;background:${dspCor(v)};border:1px solid #ccc;"></span> ${r}</span>`).join('')}</div>
    <div class="table-scroll"><table data-dsp-mapa style="font-size:.85rem;"><tr><th></th>${grupos.map(g => `<th colspan="${g.n}" style="text-align:center;background:#f3e6e9;color:#3b1018;">${esc(g.g)}</th>`).join('')}<th></th></tr>
      <tr><th>Turma</th>${discs.map(d => `<th data-dsh-clk="disc|${esc(d)}" style="cursor:pointer;writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;max-height:150px;font-size:.78rem;" title="Ver ${esc(d)} em todas as turmas">${esc(d)}</th>`).join('')}<th>Média geral</th></tr>
      ${turmas.map(t => `<tr><th data-dsh-clk="turma|${esc(t.id)}" style="cursor:pointer;white-space:nowrap;" title="Ver todas as disciplinas da ${esc(t.name)}">${esc(t.name)}</th>${discs.map(d => cel(t, d)).join('')}${linhaMedia(t)}</tr>`).join('')}
    </table></div></div>`;
  // comparativo por curso
  const porCurso = {}; turmas.forEach(t => { const c = dspCursoDe(t.name); (porCurso[c] = porCurso[c] || []).push(t); });
  const cursoItens = Object.entries(porCurso).map(([c, ts]) => { const r = dspResumo(ts.flatMap(t => discs.flatMap(d => Object.values(dspNotas(t.id, d, st.unidade))))); return r ? { rot: dspCursoNome(c), val: r.med, txt: `${fmt1(r.med)} · ${r.pctAbaixo}% < 5`, cor: '#6B1F2E', clk: 'curso|' + c } : null; }).filter(Boolean);
  const comp = `<div class="card"><h3 style="margin-top:0;">Cursos</h3><p class="muted" style="font-size:.8rem;">Toque num curso para filtrar o mapa. As áreas do conhecimento estão no painel <b>🧭 Análise por área</b>.</p>${cursoItens.length ? dshSvgBarrasH(cursoItens, { max: 10, linha: 5, linhaRot: '5,0', rotulo: 160 }) : ''}</div>`;
  const dest = dspDestaques();
  const destaques = dest.length ? `<div class="card"><h3 style="margin-top:0;">💡 Destaques</h3>${dest.map(x => `<div class="list-item" data-dsh-clk="${esc(x.clk)}" style="cursor:pointer;">${esc(x.txt)} <span class="muted" style="font-size:.78rem;">ver ›</span></div>`).join('')}</div>` : '';
  return topo + destaques + dspFocoHtml() + mapaCalor + comp;
}
function dspExportar(){
  const st = dspState(); const turmas = dspTurmasVisiveis();
  const matriz = [['Turma', ...st.discs, 'Média geral']].concat(turmas.map(t => [t.name, ...st.discs.map(d => { const r = dspResumo(Object.values(dspNotas(t.id, d, st.unidade))); return r ? r.med : ''; }),
    (() => { const r = dspResumo(st.discs.flatMap(d => Object.values(dspNotas(t.id, d, st.unidade)))); return r ? r.med : ''; })()]));
  const alunos = [['Turma','Disciplina','Aluno', ...UNIDADES, 'Acumulado']]; turmas.forEach(t => st.discs.forEach(d => { const X = st.cubo[t.id] && st.cubo[t.id][d]; if(!X) return; const ac = dspNotas(t.id, d, '__ano');
    Object.keys(ac).sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(n => alunos.push([t.name, d, n, ...UNIDADES.map(u => (X.u[u]||{})[n] ?? ''), ac[n]])); }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matriz), 'Médias'); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(alunos), 'Alunos');
  XLSX.writeFile(wb, `desempenho-${st.unidade==='__ano' ? 'ano' : st.unidade.replace(/\s+/g,'-')}-${avpLocalData()}.xlsx`);
}
__parteOk('risco_desemp');
