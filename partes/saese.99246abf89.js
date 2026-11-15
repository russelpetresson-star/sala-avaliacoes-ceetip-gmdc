/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "saese" */
function kitState(){ if(!state.kitSaese) state.kitSaese = { carregado:false, carregando:false, rows:[], semana:null, f:{ a:'', desc:'', s:'', d:'', b:'', t:'', q:'', aula:'' }, lim:30, sel:{} }; return state.kitSaese; }
async function kitCarregar(){
  const k = kitState(); if(k.carregando) return; k.carregando = true; render();
  try{
    const s = planoState();
    if(!s.index || !s.index.length) s.index = await planoLerJson('plano-livro-index', []);
    PLANO_IDX_CACHE = s.index;
    const ids = s.index.filter(x => /-B$/.test(x.id) && KIT_DISCS.includes(x.disciplina)).map(x => x.id);
    await saeseCorrCarregar(true);
    const rows = []; let id = 0;
    for(const pid of ids){
      const pl = await planoObter(pid); if(!pl) continue;
      const serie = (pl.serie||'').replace(' série','');
      pl.aulas.forEach(a => { const sl = a.slides; const S = sl && sl.saese; if(!S) return;
        const base = { pid, s: serie, d: pl.disciplina, n: a.n, b: a.bimestre, t: sl.titulo, pg: sl.paginas||'' };
        (sl.figuras||[]).forEach((fg, i) => { const cs = (S.fig||[])[i] || []; if(cs.length) rows.push(Object.assign({ id: ++id, ch: 'fig:' + fg.f, c0: cs, k:'Imagem ou gráfico', r: fg.titulo || fg.leg, x: fg.leg || '', q: (fg.perguntas||[]).join(' · '), c: cs, img: fg.f, p: fg.p, resp: fg.resposta || '' }, base)); });
        const ex = a.exercicio || {}; const prova = ex.questoesProva || []; const exq = ex.questoes || [];
        const le = sl.leituraEnem;
        if(le && (S.leitura||[]).length){ const qq = prova.find(q => q.enem) || null; rows.push(Object.assign({ id: ++id, ch: saeseChave(le.base), c0: S.leitura, k:'Questão ENEM', r: le.cmd, x: le.base, ops: le.ops, gab: le.c, c: S.leitura, img: le.img, quest: qq }, base)); }
        const sq = sl.saeseQ;
        if(sq){ const qq = exq.find(q => q.saeseQ) || prova.find(q => q.saeseQ) || null; rows.push(Object.assign({ id: ++id, ch: saeseChave(sq.base + '\n' + sq.cmd), c0: [sq.d], k:'Desafio SAESE', r: sq.cmd, x: sq.base, ops: sq.ops, gab: sq.c, c: [sq.d], img: sq.img, dica: sq.passo, quest: qq }, base)); }
        if(sl.destaque && (S.destaque||[]).some(c => c.startsWith('MT'))) rows.push(Object.assign({ id: ++id, k:'Número em destaque', r: sl.destaque[0], x: sl.destaque[1], c: S.destaque }, base));
        if(sl.debate && (S.debate||[]).length) rows.push(Object.assign({ id: ++id, k:'Debate', r: sl.debate, x: '', c: S.debate }, base));
      });
    }
    rows.forEach(r => { if(r.ch){ r.c = saeseAplicar(r.ch, r.c0); r.corr = !!(SAESE_CORR && SAESE_CORR[r.ch]); } });
    k.rows = rows; k.carregado = true;
    kitCarregarSemana();   // não bloqueia: a seção da semana aparece quando terminar
  }catch(e){ k.erro = 'Não consegui carregar os planos. Peça à coordenação para importar os planos de Geografia, Sociologia e História.'; }
  k.carregando = false; render();
}
async function kitCarregarSemana(){
  const k = kitState(); const s = planoState(); k.semana = { carregando:true, itens:[] }; render();
  try{
    const turmas = (professorTurmas()||[]).slice(0, 12);
    if(!s.conexProfs) s.conexProfs = await planoLerVinculosProfessores();
    const limite = Date.now() - 7*86400000; const itens = [];
    for(const t of turmas){ for(const nome of KIT_DISCS){ const disc = planoDiscKey(nome);
      const r = await planoCalcularEfetivo([t], { index: s.index, disc, profs: s.conexProfs }); const pid = r.efetivo[t.id]; if(!pid) continue;
      const prog = await planoLerJson(`plano-livro-prog:${planoTK(t.id, disc)}`, { dadas:{} });
      Object.entries(prog.dadas||{}).filter(([, ts]) => ts >= limite).forEach(([n, ts]) => {
        const rs = k.rows.filter(x => x.pid===pid && x.n===Number(n)); if(!rs.length) return;
        const cs = []; rs.forEach(x => x.c.forEach(c => { if(!cs.includes(c)) cs.push(c); }));
        itens.push({ turma: t.name, turmaId: t.id, disc: nome, n: Number(n), titulo: rs[0].t, pid, quando: ts, cs, nRec: rs.length });
      }); } }
    k.semana = { itens: itens.sort((a,b) => b.quando - a.quando) };
  }catch(e){ k.semana = { itens:[], erro:true }; }
  render();
}
function kitFiltrar(semDesc){
  const k = kitState(), f = k.f; const q = (f.q||'').trim().toLowerCase();
  return k.rows.filter(r => (!f.s || r.s===f.s) && (!f.d || r.d===f.d) && (!f.b || String(r.b)===f.b) && (!f.t || r.k===f.t)
    && (!f.aula || `${r.pid}|${r.n}`===f.aula)
    && (!f.a || r.c.some(c => c.startsWith(f.a))) && (semDesc || !f.desc || r.c.includes(f.desc))
    && (!q || `${r.t} ${r.r} ${r.x} ${r.q||''}`.toLowerCase().includes(q)));
}
function kitCodHtml(c, ativo){ return `<span class="kit-cod ${c.startsWith('MT')?'mt':'lp'}${ativo?' on':''}" title="${esc((SAESE_CAT[c]||{}).o||'')}">${c}${priorEstrelaKit(c)}</span>`; }
function renderKitSaese(){
  const k = kitState();
  if(!k.carregado && !k.carregando && !k.erro) setTimeout(kitCarregar, 0);
  const cab = `<div class="card" data-kit-saese><h2 style="margin:0 0 4px;">🎯 Kit SAESE</h2>
    <p style="margin:0 0 6px;">Textos, imagens, gráficos e questões das aulas de Geografia, Sociologia e História, organizados pelos descritores de <b>Língua Portuguesa</b> e <b>Matemática</b> do SAESE (3ª série do Ensino Médio).</p>
    ${state.view==='coordenador' && SAESE_CORR && Object.keys(SAESE_CORR).length ? `<button class="btn btn-ghost btn-sm" style="width:auto;float:right;" data-action="kit-exportar-corr">⬇ Exportar ${Object.keys(SAESE_CORR).length} correção(ões)</button>` : ''}<p class="muted" style="margin:0;font-size:.86rem;">Use o material que a turma já viu em Humanas para treinar o descritor na sua aula. Marque questões para montar uma atividade na sua disciplina.</p></div>`;
  if(k.erro) return cab + `<div class="card"><p>${esc(k.erro)}</p></div>`;
  if(!k.carregado) return cab + '<div class="card"><p>⏳ Reunindo os recursos dos planos de Humanas…</p></div>';
  const f = k.f;
  // semana
  const sem = k.semana;
  const semana = !sem ? '' : sem.carregando ? '<div class="card"><p class="muted">⏳ Vendo o que suas turmas estudaram nesta semana em Humanas…</p></div>'
    : `<div class="card" data-kit-semana><h3 style="margin:0 0 6px;">📅 Nesta semana nas suas turmas</h3>${sem.itens.length ? `<div class="kit-sem">${sem.itens.slice(0, 12).map(it => `
        <button class="kit-semitem${f.aula===`${it.pid}|${it.n}`?' on':''}" data-action="kit-aula" data-k="${esc(it.pid)}|${it.n}"><b>${esc(it.turma)}</b> · ${esc(it.disc)} · aula ${it.n}<br><span>${esc(it.titulo)}</span><div style="margin-top:4px;">${it.cs.slice(0,5).map(c => kitCodHtml(c)).join(' ')}</div></button>`).join('')}</div>
        <p class="muted" style="font-size:.8rem;margin:6px 0 0;">Toque numa aula para ver só os recursos dela. Aulas marcadas como dadas nos últimos 7 dias.</p>`
      : '<p class="muted" style="margin:0;">Nenhuma aula de Humanas foi marcada como dada nos últimos 7 dias nas suas turmas. Use os filtros abaixo para escolher pela série e pelo bimestre.</p>'}</div>`;
  // filtros
  const sel = (id, lab, opts, v) => `<label class="kit-f"><span>${lab}</span><select data-action-change="kit-filtro" data-k="${id}">${opts.map(([val, rot]) => `<option value="${esc(val)}"${String(v)===String(val)?' selected':''}>${esc(rot)}</option>`).join('')}</select></label>`;
  const filtros = `<div class="card kit-filtros" data-kit-filtros>
    <div class="kit-seg">${[['','Todas'],['LP','Língua Portuguesa'],['MT','Matemática']].map(([v, r]) => `<button class="${f.a===v?'on':''}" data-action="kit-area" data-v="${v}">${r}</button>`).join('')}</div>
    ${sel('s','Série',[['','Todas'],['1ª','1ª'],['2ª','2ª'],['3ª','3ª']], f.s)}${sel('d','Disciplina',[['','Todas']].concat(KIT_DISCS.map(x=>[x,x])), f.d)}
    ${sel('b','Bimestre',[['','Todos'],['1','1º'],['2','2º'],['3','3º'],['4','4º']], f.b)}${sel('t','Recurso',[['','Todos'],['Imagem ou gráfico','Imagem ou gráfico'],['Questão ENEM','Questão ENEM'],['Desafio SAESE','Desafio SAESE'],['Número em destaque','Número em destaque'],['Debate','Debate']], f.t)}
    <label class="kit-f" style="flex:1 1 160px;"><span>Buscar</span><input type="search" data-action-input="kit-busca" value="${esc(f.q||'')}" placeholder="ex.: charge, Censo, migração"></label>
    ${f.aula ? `<button class="btn btn-ghost btn-sm" style="width:auto;align-self:flex-end;" data-action="kit-aula" data-k="">✕ Ver todas as aulas</button>` : ''}</div>`;
  // índice de descritores
  const cnt = {}; kitFiltrar(true).forEach(r => r.c.forEach(c => cnt[c] = (cnt[c]||0) + 1));
  const cods = Object.keys(SAESE_CAT).filter(c => (!f.a || c.startsWith(f.a)) && (!f.aula || cnt[c]));
  const indice = `<div class="kit-ind" data-kit-indice>${cods.map(c => `<button class="kit-indb${f.desc===c?' on':''}${cnt[c]?'':' zero'}" data-action="kit-desc" data-c="${c}" title="${esc(SAESE_CAT[c].o)}">${kitCodHtml(c)} <span>${esc(SAESE_CAT[c].a)}</span> <em>${cnt[c]||0}</em></button>`).join('')}</div>`;
  const info = f.desc ? `<div class="card" style="border-left:4px solid ${f.desc.startsWith('MT')?'#1F4E79':'#00695C'};">${kitCodHtml(f.desc)} <b>${esc(SAESE_CAT[f.desc].a)}</b><div class="muted" style="font-size:.84rem;margin-top:4px;">Matriz: ${esc(SAESE_CAT[f.desc].o)}</div><div style="margin-top:6px;font-size:.9rem;">💡 <b>Atividade sugerida:</b> ${esc(KIT_SUG[f.desc]||'')}</div></div>` : '';
  // lista
  const rs = kitFiltrar(false);
  let lista = '', ult = '';
  rs.slice(0, k.lim).forEach(r => {
    const ka = `${r.pid}|${r.n}`;
    if(ka !== ult){ lista += `<div class="kit-aula"><b>${esc(r.d)} · ${esc(r.s)} série · Aula ${r.n}</b> — ${esc(r.t)} <span class="muted">· ${r.b}º bim · livro ${esc(r.pg)}</span></div>`; ult = ka; }
    const cs = f.desc ? [f.desc].concat(r.c.filter(c => c!==f.desc)) : r.c;
    const foco = f.desc || cs.find(c => !f.a || c.startsWith(f.a)) || cs[0];
    const im = r.img && AV_IMG[r.img] ? `<img src="${AV_IMG[r.img]}" alt="" class="kit-img">` : '';
    const marcado = !!k.sel[r.id];
    lista += `<div class="kit-item" data-kit-item="${r.id}"><div class="kit-top"><span class="kit-tipo">${esc(r.k)}</span>${cs.map(c => kitCodHtml(c, c===f.desc)).join(' ')}${r.p ? `<span class="muted" style="font-size:.78rem;">p. ${r.p}</span>` : ''}
        ${r.ch ? `<button class="kit-corr" data-action="kit-corrigir" data-id="${r.id}" title="Marcar outro descritor para este recurso">✎ ${r.corr ? 'corrigido' : 'corrigir descritor'}</button>` : ''}
        ${r.quest ? `<label class="kit-sel"><input type="checkbox" data-action-change="kit-sel" data-id="${r.id}"${marcado?' checked':''}> usar na minha atividade</label>` : ''}</div>
      <div class="kit-corpo${im?' com-img':''}">${im}<div style="min-width:0;"><div style="font-weight:600;">${esc(r.r)}</div>${r.x ? `<div style="font-size:.9rem;white-space:pre-line;margin-top:2px;">${esc(r.x)}</div>` : ''}
        ${r.ops ? `<div class="muted" style="font-size:.85rem;margin-top:4px;">${r.ops.map((o,i) => `${'ABCDE'[i]}) ${esc(o)}`).join(' &nbsp; ')} · <b>Gabarito: ${'ABCDE'[r.gab]}</b></div>` : (r.q ? `<div class="muted" style="font-size:.85rem;margin-top:4px;">${esc(r.q)}</div>` : '')}
        ${r.dica ? `<div style="font-size:.85rem;margin-top:3px;"><b>Como resolver:</b> ${esc(r.dica)}</div>` : ''}</div></div>
      ${k.editando===r.id ? `<div class="kit-editor" data-kit-editor><div style="font-size:.84rem;margin-bottom:4px;"><b>Quais descritores este recurso trabalha?</b> <span class="muted">Marque até 3. A correção vale para toda a escola: kit, painéis e novas atividades.</span></div>
        <div class="kit-ind" style="margin:0;">${Object.keys(SAESE_CAT).map(c => `<button class="kit-indb${(k.editSel||[]).includes(c)?' on':''}" data-action="kit-edit-toggle" data-c="${c}" title="${esc(SAESE_CAT[c].o)}">${kitCodHtml(c)} <span>${esc(SAESE_CAT[c].a)}</span></button>`).join('')}</div>
        <div class="row" style="gap:8px;margin-top:6px;flex-wrap:wrap;"><button class="btn btn-primary btn-sm" style="width:auto;" data-action="kit-edit-salvar">Salvar correção</button>${r.corr ? `<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="kit-edit-original">Voltar ao original (${r.c0.join(', ')})</button>` : ''}<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="kit-edit-cancelar">Cancelar</button></div></div>` : ''}
      <div class="kit-sug ${foco.startsWith('MT')?'mt':''}"><b>Na aula de ${foco.startsWith('MT')?'Matemática':'Língua Portuguesa'} (${foco}):</b> ${esc(KIT_SUG[foco]||'')}</div></div>`;
  });
  if(!rs.length) lista = '<p class="muted">Nenhum recurso com esses filtros.</p>';
  if(rs.length > k.lim) lista += `<button class="btn btn-ghost" data-action="kit-mais" style="margin-top:8px;">Mostrar mais (${rs.length - k.lim} restantes)</button>`;
  const nSel = Object.keys(k.sel).filter(x => k.sel[x]).length;
  const barra = nSel ? `<div class="kit-barra" data-kit-barra><span><b>${nSel}</b> questão(ões) selecionada(s)</span><button class="btn btn-primary btn-sm" style="width:auto;" data-action="kit-montar">📝 Montar atividade</button><button class="btn btn-ghost btn-sm" style="width:auto;" data-action="kit-limpar">Limpar</button></div>` : '';
  // carrega as imagens que aparecem na página
  const faltam = rs.slice(0, k.lim).map(r => r.img).filter(x => x && !(x in AV_IMG));
  if(faltam.length && !k.carregandoImg){ k.carregandoImg = true; (async () => { for(const key of [...new Set(faltam)]){ AV_IMG[key] = await planoLerJson(`plano-livro-img:${key}`, null); } k.carregandoImg = false; render(); })(); }
  return `<style>
    .kit-cod{display:inline-block;font-weight:700;font-size:.72rem;color:#fff;padding:2px 6px;border-radius:5px;white-space:nowrap;vertical-align:middle}.kit-cod.lp{background:#00695C}.kit-cod.mt{background:#1F4E79}.kit-cod.on{outline:2px solid #C9A227}
    .kit-sem{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}.kit-semitem{text-align:left;border:1px solid var(--paper-line);background:var(--paper);border-radius:8px;padding:8px 10px;cursor:pointer;font:inherit;font-size:.86rem;color:inherit}.kit-semitem > span{color:var(--ink-soft)}.kit-semitem.on{border-color:var(--board-light);box-shadow:0 0 0 1px var(--board-light)}
    .kit-filtros{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;position:sticky;top:0;z-index:3}.kit-f{display:flex;flex-direction:column;gap:2px;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);font-weight:700}.kit-f select,.kit-f input{font-size:.9rem;text-transform:none;letter-spacing:0;font-weight:400}
    .kit-seg{display:flex;border:1px solid var(--paper-line);border-radius:7px;overflow:hidden;align-self:flex-end}.kit-seg button{border:0;background:var(--surface);color:var(--ink);padding:6px 10px;cursor:pointer;font:inherit;font-size:.86rem}.kit-seg button.on{background:var(--board);color:#fff}
    .kit-ind{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}.kit-indb{display:flex;gap:5px;align-items:center;border:1px solid var(--paper-line);background:var(--surface);border-radius:16px;padding:3px 9px 3px 4px;cursor:pointer;font:inherit;font-size:.8rem;color:inherit}.kit-indb em{font-style:normal;color:var(--ink-soft);font-size:.74rem}.kit-indb.on{border-color:var(--board-light);background:var(--tint-vinho)}.kit-indb.zero{opacity:.5}
    .kit-aula{margin:14px 0 4px;font-size:.92rem}.kit-item{border:1px solid var(--paper-line);background:var(--surface);border-radius:8px;padding:8px 10px;margin:6px 0}.kit-top{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px}
    .kit-tipo{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;font-weight:700;color:var(--yellow-dark)}.kit-corr{margin-left:auto;border:0;background:none;color:var(--ink-soft);cursor:pointer;font:inherit;font-size:.8rem;text-decoration:underline}.kit-editor{border:1px dashed var(--board-light);border-radius:8px;padding:8px;margin:6px 0;background:var(--paper)}
    .kit-sel{font-size:.82rem;display:flex;gap:4px;align-items:center;cursor:pointer}
    .kit-corpo.com-img{display:grid;grid-template-columns:minmax(120px,220px) 1fr;gap:10px}.kit-img{max-width:100%;max-height:160px;object-fit:contain;border-radius:6px;background:#fff}
    @media (max-width:560px){.kit-corpo.com-img{grid-template-columns:1fr}}
    .kit-sug{margin-top:6px;font-size:.86rem;border-left:3px solid #00695C;background:var(--tint-teal);padding:4px 8px;border-radius:0 6px 6px 0}.kit-sug.mt{border-color:#4f7fb5;background:var(--paper)}
    .kit-barra{position:sticky;bottom:0;z-index:4;display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:var(--surface);border:1px solid var(--board-light);border-radius:10px;padding:8px 12px;margin-top:10px;box-shadow:0 2px 10px rgba(0,0,0,.15)}
  </style>` + cab + semana + filtros + indice + info + `<div class="card"><p class="muted" style="margin:0 0 4px;font-size:.84rem;">${rs.length} recurso(s)</p>${lista}</div>` + barra;
}
async function kitMontarAtividade(){
  const k = kitState(); const p = state.professor;
  if(state.view==='coordenador'){ alert('Para montar a atividade, entre no painel do professor.'); return; }
  const rs = k.rows.filter(r => k.sel[r.id] && r.quest);
  if(!rs.length) return;
  const imgCache = {}; const qs = [];
  for(const r of rs) qs.push(await saeseMontarQuestao({ q: r.quest, aula: { n: r.n, tituloCurto: `${r.d} ${r.s} — ${r.t}`, bimestre: r.b } }, imgCache));
  planoPontosIguais(qs, 10);
  const disc = (p.disciplinas||[]).find(d => /portugu|matem/i.test(d.name||'')) || (p.disciplinas||[])[0];
  const na = freshAssessment();
  na.instrumento = 'exercicios'; na.title = 'Atividade SAESE — ' + [...new Set(rs.flatMap(r => r.c))].slice(0, 4).join(', ');
  na.disciplinaId = disc ? disc.id : ''; na.turmaIds = []; na.questions = qs; na.securityEnabled = false; na.exigeLiberacao = false; na.minMinutesPerQuestion = null;
  p.newAssessment = na; p.editingCode = null; p.editingResponseCount = 0; p.pickerOpen = false; p.pickerSelected = [];
  k.sel = {}; p.subview = 'avaliacoes'; p.mode = 'new'; render(); window.scrollTo(0,0);
  alert(`Atividade montada com ${qs.length} questão(ões) das aulas de Humanas, cada uma com seu descritor SAESE. Escolha a turma, confira as datas e salve.`);
}
async function saeseMetasLer(turmaId){ return (await planoLerJson(`saese-metas:${turmaId}`, {})) || {}; }
function saeseEscolaState(){ if(!state.saeseEscola) state.saeseEscola = { carregado:false, carregando:false }; return state.saeseEscola; }
async function saeseEscolaCalcular(){
  const E = saeseEscolaState(); E.carregando = true; E.erro = ''; render();
  try{
    await saeseCorrCarregar(true);
    const s = planoState(); if(!s.index || !s.index.length) s.index = await planoLerJson('plano-livro-index', []);
    const mapa = {};   // texto da questão do plano → descritores
    for(const x of s.index.filter(x => /-B$/.test(x.id))){ const pl = await planoObter(x.id); if(!pl) continue;
      pl.aulas.forEach(a => { const ex = a.exercicio || {}; ['questoes','questoesProva','questoesRecuperacao'].forEach(k => (ex[k]||[]).forEach(q => { const cs = saeseDeQuestaoPlano(q); if(cs.length) mapa[saeseChave(q.texto)] = cs; })); }); }
    const turmas = (state.professor.turmas||[]).slice().sort((a,b) => (a.name||'').localeCompare(b.name||'', 'pt-BR', { numeric:true }));
    const porNome = {}; turmas.forEach(t => (t.students||[]).forEach(st => porNome[nomeChave(st.name)] = t.id));
    const M = {}; const somaT = (tid, c, ok) => { const x = (M[tid] = M[tid] || {}); const y = x[c] = x[c] || [0,0]; y[0]+=ok; y[1]++; };
    const keys = ((await window.storage.list('assessment:', true)).keys||[]);
    for(const key of keys){ const av = await planoLerJson(key, null); if(!av || !(av.questions||[]).length) continue;
      const qs = av.questions.filter(q => q.type==='mc' && !q.annulled).map(q => ({ q, cs: saeseAplicar(saeseChave(q.text), (q.saese||[]).length ? q.saese : (mapa[saeseChave(q.text)] || [])) })).filter(x => x.cs.length);
      if(!qs.length) continue;
      const resp = await planoLerJson(`responses:${av.code}`, []);
      const tids = assessmentTurmaIds(av);
      resp.forEach(r => { const tid = tids.length === 1 ? tids[0] : porNome[nomeChave(r.studentName)]; if(!tid) return;
        qs.forEach(({ q, cs }) => { const ok = r.answers && r.answers[q.id]===q.correctOptionId ? 1 : 0; cs.forEach(c => { somaT(tid, c, ok); somaT('__escola', c, ok); }); }); }); }
    const metas = {}; for(const t of turmas) metas[t.id] = await saeseMetasLer(t.id);
    E.M = M; E.turmas = turmas.map(t => ({ id: t.id, nome: t.name })); E.metas = metas;
    E.oficial = await planoLerJson('saese-oficial', null);
    E.carregado = true; E.em = Date.now();
  }catch(e){ E.erro = 'Não consegui calcular agora. Tente de novo em instantes.'; }
  E.carregando = false; render();
}
function saeseOficialDe(E, turmaNome, c){ const o = E.oficial; if(!o || !o.linhas) return null; const l = o.linhas.find(x => nomeChave(x.turma)===nomeChave(turmaNome) && x.d===c); return l ? l.pct : null; }
function renderSaeseEscola(){
  const E = saeseEscolaState();
  const cab = `<div class="card"><h2 style="margin:0 0 4px;">📘 SAESE da escola</h2><p style="margin:0;" class="muted">Acerto por turma em cada descritor do SAESE (Língua Portuguesa e Matemática), somando exercícios, provas e simulados com questões marcadas. Células com borda dourada são metas da turma no bimestre.</p></div>`;
  if(E.carregando) return cab + '<div class="card"><p>⏳ Calculando as turmas…</p></div>';
  if(!E.carregado) return cab + `<div class="card">${E.erro ? `<p style="color:#b3261e;">${esc(E.erro)}</p>` : ''}<button class="btn btn-primary" style="width:auto;" data-action="saese-escola-calc">📊 Calcular o mapa da escola</button></div>`;
  const cor = p => p==null ? 'var(--paper)' : p < 50 ? '#f4c7c3' : p < 70 ? '#fde3c2' : '#cfead6';
  const pct = x => x && x[1] ? Math.round(x[0]/x[1]*100) : null;
  const esc0 = E.M.__escola || {};
  const cods = Object.keys(SAESE_CAT).filter(c => esc0[c] || (E.oficial && E.oficial.linhas.some(l => l.d===c)));
  const bim = saeseBimAtual();
  const linha = (nome, x, tid) => { const mt = tid ? ((E.metas[tid]||{})['b'+bim] || {}) : {};
    return `<tr><td style="white-space:nowrap;font-weight:700;">${esc(nome)}</td>${cods.map(c => { const p = pct((x||{})[c]); const of = tid ? saeseOficialDe(E, nome, c) : null; const meta = (mt.codes||[]).includes(c);
      return `<td style="text-align:center;background:${cor(p)};${meta ? 'outline:3px solid #C9A227;outline-offset:-3px;' : ''}" title="${esc(c + ' — ' + SAESE_CAT[c].a)}${x && x[c] ? ` (${x[c][1]} respostas)` : ''}${meta ? ` · meta ${mt.meta||70}%` : ''}">${p==null ? '—' : p + '%'}${of!=null ? `<div style="font-size:.68rem;color:#333;">of. ${of}%</div>` : ''}</td>`; }).join('')}</tr>`; };
  // maiores diferenças app × oficial
  let difs = [];
  if(E.oficial) E.turmas.forEach(t => cods.forEach(c => { const p = pct((E.M[t.id]||{})[c]); const of = saeseOficialDe(E, t.nome, c); if(p!=null && of!=null && (E.M[t.id][c][1] >= 10)) difs.push({ t: t.nome, c, p, of, d: p - of }); }));
  difs = difs.sort((a,b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 6);
  const piores = cods.map(c => ({ c, p: pct(esc0[c]), n: (esc0[c]||[0,0])[1] })).filter(x => x.p!=null && x.n >= 10).sort((a,b) => a.p - b.p).slice(0, 4);
  return cab + `<div class="card">
    ${piores.length ? `<div style="margin-bottom:8px;font-size:.9rem;"><b>Descritores mais fracos na escola:</b> ${piores.map(x => `<span class="kit-cod ${x.c.startsWith('MT')?'mt':'lp'}">${x.c}</span> ${x.p}% (${esc(SAESE_CAT[x.c].a)})`).join(' · ')}</div>` : ''}
    <div class="table-scroll"><table style="font-size:.8rem;" data-saese-escola><tr><th>Turma</th>${cods.map(c => `<th title="${esc(SAESE_CAT[c].o)}" style="white-space:nowrap;">${c}</th>`).join('')}</tr>
      ${E.turmas.filter(t => E.M[t.id]).map(t => linha(t.nome, E.M[t.id], t.id)).join('')}
      <tr style="border-top:2px solid var(--ink);">${linha('Escola', esc0, null).slice(4)}</table></div>
    ${!cods.length ? '<p class="muted">Ainda não há respostas a questões com descritor SAESE.</p>' : ''}
    <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center;"><button class="btn btn-ghost btn-sm" style="width:auto;" data-action="saese-escola-calc">↻ Atualizar</button><span class="muted" style="font-size:.8rem;">Calculado em ${new Date(E.em).toLocaleString('pt-BR')}</span></div></div>
    <div class="card"><h3 style="margin:0 0 4px;">🏛️ Resultado oficial do SAESE</h3>
      <p class="muted" style="margin:0 0 6px;font-size:.86rem;">Quando a SEDUC divulgar o resultado por turma e descritor, importe a planilha (CSV com as colunas turma, componente, descritor e percentual de acerto). O mapa passa a mostrar o oficial em cada célula, e abaixo aparecem as maiores diferenças entre o que o app mediu e o resultado oficial.</p>
      ${E.oficial ? `<p style="font-size:.88rem;">✅ Resultado importado: <b>${E.oficial.linhas.length}</b> linha(s)${E.oficial.ano ? ` · ${esc(E.oficial.ano)}` : ''} · em ${new Date(E.oficial.em).toLocaleDateString('pt-BR')}</p>` : ''}
      <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;"><label class="btn btn-ghost btn-sm" style="width:auto;cursor:pointer;">📥 Importar CSV oficial<input type="file" id="saese-oficial-input" accept=".csv,text/csv" style="display:none;"></label><button class="btn btn-ghost btn-sm" style="width:auto;" data-action="saese-oficial-modelo">⬇ Baixar modelo de planilha</button>${E.oficial ? `<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="saese-oficial-limpar">Remover resultado importado</button>` : ''}</div>
      ${difs.length ? `<h4 style="margin:10px 0 4px;">Maiores diferenças (app × oficial)</h4><ul style="margin:0 0 0 18px;font-size:.86rem;">${difs.map(x => `<li><b>${esc(x.t)}</b> · ${x.c}: app ${x.p}% × oficial ${x.of}% <span style="color:${x.d>0?'#b3261e':'#1d6b31'};">(${x.d>0?'+':''}${x.d} pontos)</span>${x.d > 15 ? ' — o treino no app pode estar mais fácil que a prova' : x.d < -15 ? ' — a turma foi melhor na prova do que no app' : ''}</li>`).join('')}</ul>` : ''}</div>`;
}
async function saeseOficialImportar(file){
  const E = saeseEscolaState();
  try{
    const txt = (await file.text()).replace(/^﻿/, ''); const linhas = txt.split(/\r?\n/).filter(l => l.trim());
    const sep = (linhas[0].match(/;/g)||[]).length >= (linhas[0].match(/,/g)||[]).length ? ';' : ',';
    const cab = linhas[0].split(sep).map(x => nomeChave(x.replace(/"/g,'')));
    const iT = cab.findIndex(x => /turma/.test(x)), iC = cab.findIndex(x => /compon|disciplina|area/.test(x)), iD = cab.findIndex(x => /descritor/.test(x)), iP = cab.findIndex(x => /acerto|percent|%/.test(x));
    if(iT<0 || iD<0 || iP<0){ alert('Não encontrei as colunas turma, descritor e percentual de acerto. Use o modelo de planilha.'); return; }
    const out = [];
    linhas.slice(1).forEach(l => { const c = l.split(sep).map(x => x.replace(/"/g,'').trim()); if(!c[iT]) return;
      let d = c[iD].toUpperCase().replace(/\s+/g,' '); const comp = iC>=0 ? nomeChave(c[iC]) : '';
      const m = /(LP|MT)?\s*D\s*0?(\d{1,2})/.exec(d); if(!m) return;
      const area = m[1] || (/mat/.test(comp) ? 'MT' : 'LP'); const cod = `${area} D${String(m[2]).padStart(2,'0')}`; if(!SAESE_CAT[cod]) return;
      const p = parseFloat(String(c[iP]).replace('%','').replace(',','.')); if(isNaN(p)) return;
      out.push({ turma: c[iT], d: cod, pct: Math.round(p <= 1 ? p*100 : p) }); });
    if(!out.length){ alert('Nenhuma linha válida encontrada na planilha.'); return; }
    const o = { linhas: out, em: Date.now(), ano: String(new Date().getFullYear()) };
    await window.storage.set('saese-oficial', JSON.stringify(o), true); E.oficial = o; render();
    alert(`Resultado oficial importado: ${out.length} linha(s).`);
  }catch(e){ alert('Não consegui ler a planilha. Confira se é um arquivo CSV.'); }
}
function saeseOficialModelo(){
  const turmas = (state.professor.turmas||[]).filter(t => /^3/.test(t.name||'')).map(t => t.name);
  const linhas = [['turma','componente','descritor','percentual_acerto']];
  (turmas.length ? turmas : ['3PG']).forEach(t => { linhas.push([t,'Língua Portuguesa','D05','']); linhas.push([t,'Matemática','D34','']); });
  const csv = linhas.map(l => l.join(';')).join('\n'); const blob = new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'modelo-saese-oficial.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}
async function saeseMetasSalvar(turmaId, bim, codes, meta){
  const m = await saeseMetasLer(turmaId); m['b'+bim] = { codes, meta }; await window.storage.set(`saese-metas:${turmaId}`, JSON.stringify(m), true);
  const s = planoState(); s.saeseMetas = s.saeseMetas || {}; s.saeseMetas[turmaId] = m;
}
function renderSaeseMetas(turmaId, d){
  const s = planoState(); s.saeseMetas = s.saeseMetas || {};
  if(!(turmaId in s.saeseMetas)){ s.saeseMetas[turmaId] = null; saeseMetasLer(turmaId).then(m => { s.saeseMetas[turmaId] = m; render(); }); return ''; }
  const m = s.saeseMetas[turmaId]; if(m===null) return '';
  const bim = s.saeseMetaBim || saeseBimAtual(); const mt = m['b'+bim] || { codes:[], meta:70 };
  const ed = s.saeseMetaEdit; const pct = c => d && d.turmaS && d.turmaS[c] && d.turmaS[c][1] ? Math.round(d.turmaS[c][0]/d.turmaS[c][1]*100) : null;
  const barras = (mt.codes||[]).map(c => { const p = pct(c); const ok = p!=null && p >= mt.meta;
    return `<div style="margin:4px 0;font-size:.86rem;" data-saese-meta="${c}"><span class="kit-cod ${c.startsWith('MT')?'mt':'lp'}">${c}</span> ${esc(SAESE_CAT[c].a)} — <b>${p==null?'sem dados':p+'%'}</b> de ${mt.meta}% ${ok?'✅':''}
      <div style="height:8px;background:var(--paper-line);border-radius:4px;margin-top:3px;position:relative;"><div style="height:8px;width:${Math.min(100,p||0)}%;background:${ok?'#2e7d32':'#00695C'};border-radius:4px;"></div><div style="position:absolute;top:-3px;left:${mt.meta}%;width:2px;height:14px;background:#C9A227;"></div></div></div>`; }).join('');
  const editor = ed ? `<div style="border:1px dashed var(--board-light);border-radius:8px;padding:8px;margin-top:6px;"><div style="font-size:.84rem;margin-bottom:4px;"><b>Escolha até 4 descritores para o ${bim}º bimestre</b> <span class="muted">(★ focos do bimestre primeiro; depois, os mais fracos)</span> <button class="btn btn-ghost btn-sm" style="width:auto;padding:1px 8px;" data-prior="metas-sel">⭐ Usar os focos do bimestre</button></div>
      <div class="kit-ind" style="margin:0;">${Object.keys(SAESE_CAT).sort((a,b) => priorPesoMeta(a, turmaId, bim) - priorPesoMeta(b, turmaId, bim) || (pct(a)??200) - (pct(b)??200)).map(c => `<button class="kit-indb${(s.saeseMetaSel||[]).includes(c)?' on':''}" data-action="saese-meta-toggle" data-c="${c}">${kitCodHtml(c)} <span>${esc(SAESE_CAT[c].a)}</span>${pct(c)!=null?` <em>${pct(c)}%</em>`:''}</button>`).join('')}</div>
      <div class="row" style="gap:8px;margin-top:6px;align-items:center;flex-wrap:wrap;">Meta de acerto: <select id="saese-meta-pct">${[50,60,70,80].map(v => `<option${v===(mt.meta||70)?' selected':''}>${v}</option>`).join('')}</select>%<button class="btn btn-primary btn-sm" style="width:auto;" data-action="saese-meta-salvar">Salvar metas</button><button class="btn btn-ghost btn-sm" style="width:auto;" data-action="saese-meta-cancelar">Cancelar</button></div></div>` : '';
  return `<div data-saese-metas style="margin-top:12px;"><h4 style="margin:0 0 4px;">🎯 Metas da turma — ${[1,2,3,4].map(b => `<button class="btn btn-sm ${b===bim?'btn-primary':'btn-ghost'}" style="width:auto;padding:1px 8px;" data-action="saese-meta-bim" data-b="${b}">${b}º bim</button>`).join(' ')}</h4>
    ${barras || priorMetasVazio(turmaId, bim)}
    ${ed ? editor : `<button class="btn btn-ghost btn-sm" style="width:auto;margin-top:4px;" data-action="saese-meta-editar">✎ ${barras ? 'Mudar metas' : 'Definir metas'}</button>`}</div>`;
}
function saeseDevolutivaImprimir(turmaId){
  const s = planoState(); const d = s.hab[turmaId] || {}; const turma = (state.professor.turmas||[]).find(t => t.id===turmaId);
  const metas = ((s.saeseMetas||{})[turmaId] || {})['b' + saeseBimAtual()] || priorMetasPadrao(turma) || { codes:[] };
  const alunos = ((turma && turma.students)||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  const folha = st => { const x = (d.alunoS||{})[st.id] || {}; const pc = c => x[c] && x[c][1] ? Math.round(x[c][0]/x[c][1]*100) : null;
    const tem = Object.keys(x).filter(c => x[c][1] >= 2);
    const bem = tem.filter(c => pc(c) >= 70).sort((a,b) => pc(b) - pc(a)).slice(0, 4);
    const treinar = tem.filter(c => pc(c) < 60).sort((a,b) => pc(a) - pc(b)).slice(0, 3);
    return `<section class="folha"><h1>Devolutiva do ${saeseBimAtual()}º bimestre</h1><div class="sub">${esc(st.name)} · Turma ${esc(turma ? turma.name : '')} · CEETIP Gov. Marcelo Déda Chagas — leitura e matemática treinadas nas aulas</div>
      ${!tem.length ? '<p>Ainda não há questões suficientes respondidas para esta devolutiva.</p>' : `
      <h2>💪 Em que você avançou</h2>${bem.length ? `<ul>${bem.map(c => `<li><b>${c}</b> — ${esc(SAESE_CAT[c].a)} (${pc(c)}% de acerto)</li>`).join('')}</ul>` : '<p>Continue treinando: ainda não há descritores com 70% ou mais.</p>'}
      <h2>📌 O que ainda precisa treinar</h2>${treinar.length ? `<ul>${treinar.map(c => `<li><b>${c}</b> — ${esc(SAESE_CAT[c].a)} (${pc(c)}%)<div class="casa">🏠 Para fazer em casa: ${esc(SAESE_CASA[c]||'')}</div></li>`).join('')}</ul>` : '<p>Nenhum descritor abaixo de 60%. Ótimo trabalho!</p>'}`}
      ${(metas.codes||[]).length ? `<h2>🎯 Metas da turma neste bimestre</h2><p>${metas.codes.map(c => `<b>${c}</b> ${esc(SAESE_CAT[c].a)}${pc(c)!=null ? ` (você: ${pc(c)}%)` : ''}`).join(' · ')} — meta: ${metas.meta||70}% de acerto.</p>` : ''}
      <div class="ass"><span>Assinatura do(a) responsável: ____________________________</span><span>Professor(a): ____________________</span></div>
      <p class="rod">SAESE = Avaliação Somativa de Sergipe. LP = Língua Portuguesa; MT = Matemática. Os percentuais vêm das questões respondidas no app.</p></section>`; };
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Devolutivas — ${esc(turma?turma.name:'')}</title><style>
    body{font-family:Calibri,Arial,sans-serif;color:#222;margin:0}.folha{padding:14mm 14mm 10mm;page-break-after:always}h1{color:#6B1F2E;margin:0;font-size:20pt}h2{color:#00695C;font-size:13pt;margin:12px 0 4px}
    .sub{color:#555;margin:2px 0 8px}li{margin:4px 0}.casa{font-size:10pt;color:#1F4E79;margin-top:2px}.ass{display:flex;justify-content:space-between;margin-top:26px;font-size:10pt;gap:20px}.rod{font-size:8.5pt;color:#777;margin-top:10px}@page{size:A4;margin:0}
  </style></head><body>${alunos.map(folha).join('')}<script>setTimeout(()=>print(),400)<\/script></body></html>`;
  const w = window.open('', '_blank'); if(!w){ alert('Permita a abertura de janelas para imprimir.'); return; } w.document.write(html); w.document.close();
}
function estudarState(){
  const al = state.aluno;
  if(!al.estudar) al.estudar = { carregado:false, carregando:false, plano:null, prog:null, slides:{}, aberta:null, deck:null, treino:{} };
  return al.estudar;
}
async function carregarEstudarAluno(forcar){
  const al = state.aluno; const e = estudarState();
  if(!al.turma || e.carregando || (e.carregado && !forcar)) return;
  e.carregando = true; render();
  await planoDonosCarregar(true);
  // uma aba por disciplina com plano (Geografia, Sociologia...)
  const discs = [...new Map((PLANO_IDX_CACHE||[]).map(pl => [planoDiscKey(pl.disciplina), pl.disciplina])).entries()].filter(([k]) => k);
  e.discs = [];
  for(const [k, label] of discs){ const r = await planoCalcularEfetivo([al.turma], { index: PLANO_IDX_CACHE, disc: k }); if(r.efetivo[al.turma.id]) e.discs.push({ k, label, planoId: r.efetivo[al.turma.id] }); }
  e.discs.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  if(!e.disc || !e.discs.some(d => d.k===e.disc)){ let lemb = ''; try{ lemb = localStorage.getItem('estudar-disc') || ''; }catch(_){} e.disc = (e.discs.find(d => d.k===lemb) || e.discs[0] || {}).k || ''; }
  const dSel = e.discs.find(d => d.k===e.disc);
  const planoId = dSel ? dSel.planoId : null;
  const tk = planoTK(al.turma.id, e.disc);
  e.plano = planoId ? await planoLerDoc(planoId) : null;
  e.prog = await planoLerJson(`plano-livro-prog:${tk}`, { dadas:{}, exercicios:{} });
  e.slides = planoId ? await planoLerJson(`plano-livro-slides:${planoId}`, {}) : {};
  e.cfg = Object.assign(planoCfgPadrao(), await planoLerJson(`plano-config:${tk}`, {}));
  e.visto = await planoLerJson(`plano-visto:${tk}`, {});
  e.edT = {};
  e.planoId = planoId || null;
  if(planoId){ const ps = planoState(); ps.videos[planoId] = await planoLerJson(`plano-livro-videos:${planoId}`, {}); e.feedback = (await planoLerJson(`plano-feedback:${planoId}`, [])).filter(f => f.quem==='aluno' && f.autorId===al.matriculaStudentId); }
  e.aviso = '';
  if(e.abrirApos){ if((e.prog.dadas||{})[e.abrirApos]) e.aberta = e.abrirApos; else e.aviso = `A aula ${e.abrirApos} de ${((e.discs||[]).find(d => d.k===e.disc)||{}).label||'outra disciplina'} ainda não foi dada na sua turma. Ela aparece aqui assim que o(a) professor(a) marcar.`; e.abrirApos = null; }
  e.carregando = false; e.carregado = true;
  render();
}
function estudarMinhaResposta(code){
  const al = state.aluno;
  const r = (al.dashboardRealizadas||[]).find(x => x.assessment.code===code);
  return r || null;
}
async function estudarAbrirSlides(n, idx){
  const e = estudarState();
  const slot = e.slides[n]; if(!slot) return;
  const i = Math.max(0, Math.min(slot.totalSlides-1, idx||0));
  e.deck = { n, idx:i, total: slot.totalSlides, img: null };
  render();
  e.deck.img = await getSlideImg(slot.deckId, i);
  render();
}
function renderAlunoEstudarBlock(){
  const al = state.aluno; const e = estudarState();
  if(!e.carregado){ setTimeout(()=>carregarEstudarAluno(), 0); return '<div class="card"><p class="muted">Carregando…</p></div>'; }
  const abas = (e.discs||[]).length > 1 ? `<div class="pl-turmas" data-estudar-discs style="margin:0 0 10px;">${e.discs.map(d => `<button class="pl-turma ${d.k===e.disc?'ativa':''}" data-action="estudar-disc" data-k="${esc(d.k)}">📘 ${esc(d.label)}</button>`).join('')}</div>` : '';
  if(!e.plano) return `<div class="card"><h2>📖 Estudar</h2>${abas}<p class="muted">Sua turma ainda não segue um plano de aulas do livro.</p></div>`;
  if(e.trilha && trilhaCatalogo(e.plano).some(t => t.id===e.trilha)) return `<h2>📖 Estudar</h2>${trilhaAlunoHtml(e)}`;
  const dadas = e.plano.aulas.filter(a => e.prog.dadas && e.prog.dadas[a.n]).sort((a,b) => e.prog.dadas[b.n] - e.prog.dadas[a.n]);
  if(!dadas.length) return `<div class="card"><h2>📖 Estudar</h2>${abas}${e.aviso ? `<p data-estudar-aviso style="color:#a4521b;">${esc(e.aviso)}</p>` : ''}<p class="muted">Assim que o professor marcar as aulas${abas ? ' desta disciplina' : ''} como dadas, elas aparecem aqui com os slides e as questões para revisar.</p></div>${trilhasAlunoFaixaHtml(e)}`;
  const item = a => {
    const code = planoCodigoDoAluno(e.prog, a.n, al.matriculaStudentId);
    const feito = code ? estudarMinhaResposta(code) : null;
    const desafioCode = e.prog.desafios && e.prog.desafios[a.n];
    const desafioPend = desafioCode && (al.dashboardPendentes||[]).some(p => p.assessment.code===desafioCode);
    const aberta = e.aberta===a.n;
    let exHtml = '';
    if(code && !feito) exHtml = `<p style="margin:6px 0; font-size:.88rem;">📝 Você ainda não fez o exercício desta aula. <button class="btn btn-primary btn-sm" data-action="aluno-sub-view" data-sub="provas">Ir para Minhas provas</button></p>`;
    else if(feito){
      const qs = feito.assessment.questions.filter(q => q.type==='mc' && !q.annulled);
      const erradas = qs.filter(q => feito.response.answers[q.id]!==q.correctOptionId);
      exHtml = `<p style="margin:6px 0; font-size:.88rem;">📝 No exercício você acertou <strong>${qs.length - erradas.length} de ${qs.length}</strong> questões objetivas.</p>
        ${erradas.length ? `<div style="margin-top:6px;"><strong style="font-size:.9rem;">🔁 Treine as que você errou</strong> <span class="muted" style="font-size:.8rem;">(não vale nota)</span>
          ${erradas.map(q => { const t = e.treino[q.id]; const certa = q.options.find(o=>o.id===q.correctOptionId);
            return `<div class="q-card" data-treino="${esc(q.id)}" style="margin:8px 0;">
              <p style="margin:0 0 6px; white-space:pre-line;">${esc(q.text)}</p>
              ${q.options.map(o => `<button class="btn btn-ghost btn-sm" data-action="estudar-treino" data-qid="${esc(q.id)}" data-oid="${esc(o.id)}" data-code="${esc(code)}" style="display:block; width:100%; text-align:left; margin:4px 0; ${t && t.oid===o.id ? (o.id===q.correctOptionId?'background:#cfead6;':'background:#f4c7c3;') : ''}">${esc(o.text)}</button>`).join('')}
              ${t ? `<div style="margin-top:6px; padding:8px; border-radius:8px; background:${t.ok?'#e9f6ec':'#fdf0e6'};"><strong>${t.ok?'✅ Agora sim!':'❌ Ainda não. A certa é: ' + esc(certa?certa.text:'')}</strong>${q.explicacao?`<div style="font-size:.88rem; margin-top:4px;">💡 ${esc(q.explicacao)}</div>`:''}</div>` : ''}
            </div>`; }).join('')}</div>` : '<p style="color:#1d6b31; font-size:.88rem;">🎉 Você acertou todas! Que tal rever os slides mesmo assim?</p>'}`;
    }
    const slot = e.slides[a.n];
    const deck = e.deck && e.deck.n===a.n ? e.deck : null;
    return `<div class="card" data-estudar-aula="${a.n}" style="margin-bottom:10px;">
      <div class="row" style="justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
        <div><div class="muted" style="font-size:.8rem;">Aula ${a.n} · ${new Date(e.prog.dadas[a.n]).toLocaleDateString('pt-BR')}${a.paginas?' · livro '+esc(a.paginas):''}</div>
        <strong>${esc(a.tituloCurto || a.tema)}</strong></div>
        <button class="btn btn-ghost btn-sm" data-action="estudar-abrir" data-n="${a.n}">${aberta?'Fechar':'Estudar esta aula'}</button>
      </div>
      ${aberta ? `
        ${a.objetivo ? `<p style="font-size:.88rem; margin:8px 0 4px;"><strong>O que você precisa saber:</strong> ${esc(a.objetivo)}</p>` : ''}
        ${(!slot && a.slides) ? (() => { const sv = e.av && e.av.n===a.n ? e.av : null;
            e.edT = e.edT || {};
            if(!(a.n in e.edT)){ e.edT[a.n] = null; const tid = state.aluno.turma && state.aluno.turma.id; if(tid) planoLerJson(`plano-slides-ed-t:${planoTK(tid, e.disc)}:${a.n}`, null).then(v => { if(v){ e.edT[a.n] = v; render(); } }); }
            const edT = e.edT[a.n]; const dE = avAplicarEdicao(a.slides, edT);
            const lista = avSlidesFinal(dE, { estudo:true }, edT);
            if(!sv) return `<button class="btn btn-primary btn-sm" data-action="estudar-av" data-n="${a.n}" data-i="0">🖥️ Ver os slides da aula (${lista.length})</button>`;
            avInjetarCss(); if(!AV_ICONES || (a.slides.figuras||[]).some(f => !(f.f in AV_IMG)) || (dE.extras||[]).some(x => x.img && !(('ed-' + x.img) in AV_IMG))){ avCarregarRecursos(dE).then(render); }
            return `<div style="margin:8px 0;"><div class="av-slide" style="width:100%;">${avSlideHtml(dE, lista[Math.min(sv.idx, lista.length-1)], { modo:'aluno', n:a.n, revelado:true, minha:null, estudo:true, mapaModelo: (e.cfg && e.cfg.mapaModelo) || 'estudar' })}</div>
              <div class="row" style="justify-content:space-between; align-items:center; margin-top:6px;"><button class="btn btn-ghost btn-sm" data-action="estudar-av" data-n="${a.n}" data-i="${sv.idx-1}" ${sv.idx===0?'disabled':''}>← Anterior</button><span class="muted">${sv.idx+1} / ${lista.length}</span><button class="btn btn-ghost btn-sm" data-action="estudar-av" data-n="${a.n}" data-i="${Math.min(lista.length-1, sv.idx+1)}" ${sv.idx>=lista.length-1?'disabled':''}>Próximo →</button></div></div>`; })() : ''}
        ${slot ? (deck ? `<div style="margin:8px 0;">${deck.img ? `<img src="${deck.img}" alt="Slide" style="width:100%; border-radius:8px; border:1px solid #ddd;">` : '<div class="spinner"></div>'}
            <div class="row" style="justify-content:space-between; align-items:center; margin-top:6px;"><button class="btn btn-ghost btn-sm" data-action="estudar-slide" data-n="${a.n}" data-i="${deck.idx-1}" ${deck.idx===0?'disabled':''}>← Anterior</button><span class="muted">${deck.idx+1} / ${deck.total}</span><button class="btn btn-ghost btn-sm" data-action="estudar-slide" data-n="${a.n}" data-i="${deck.idx+1}" ${deck.idx>=deck.total-1?'disabled':''}>Próximo →</button></div></div>`
          : `<button class="btn btn-primary btn-sm" data-action="estudar-slide" data-n="${a.n}" data-i="0">🖥️ Ver os slides da aula (${slot.totalSlides})</button>`) : ''}
        ${(((planoState().videos[e.planoId]||{})[a.n])||[]).length ? planoVideosHtml(e.planoId, a.n, false) : ''}
        ${estudarMapaHtml(e, a)}
        ${conexoesEstudarHtml(e, a)}
        ${trilhasEstudarHtml(e, a)}
        ${exHtml}
        ${desafioPend ? `<p style="margin:6px 0;"><button class="btn btn-primary btn-sm" data-action="dashboard-start-exam" data-code="${esc(desafioCode)}">⭐ Desafio extra liberado — fazer agora</button> <span class="muted" style="font-size:.8rem;">(não vale nota, vale +3 fichas)</span></p>` : ''}
        ${(() => { const f = (e.feedback||[]).find(x => x.n===a.n); return `<div style="margin-top:10px; font-size:.88rem;">Esta aula ajudou você a entender o conteúdo?
          <button class="btn btn-ghost btn-sm" data-action="estudar-feedback" data-n="${a.n}" data-v="1" style="${f&&f.util?'background:#cfead6;':''}">👍 Sim</button>
          <button class="btn btn-ghost btn-sm" data-action="estudar-feedback" data-n="${a.n}" data-v="0" style="${f&&!f.util?'background:#f4c7c3;':''}">👎 Não muito</button>
          ${f ? '<span class="muted" style="font-size:.78rem;">Obrigado!</span>' : ''}</div>`; })()}` : ''}
    </div>`;
  };
  return `<h2>📖 Estudar</h2>
    ${abas}
    ${e.aviso ? `<div class="card" data-estudar-aviso style="background:#fff4e5; border:1px solid #f0b46b; font-size:.9rem;">${esc(e.aviso)}</div>` : ''}
    ${trilhasAlunoFaixaHtml(e)}
    <p class="muted" style="margin-top:-6px;">As aulas que já aconteceram: reveja os slides (bom para quem faltou) e treine as questões que você errou.</p>
    ${dadas.map(item).join('')}`;
}
async function planoRegistrarExercicio(turmaId, n, code){
  const s = planoState();
  const fresh = await planoLerJson(`plano-livro-prog:${planoTK(turmaId)}`, { dadas:{}, exercicios:{} });
  fresh.dadas = fresh.dadas || {}; fresh.exercicios = fresh.exercicios || {};
  fresh.exercicios[n] = code;
  s.prog[turmaId] = fresh; s.painel = null;
  await window.storage.set(`plano-livro-prog:${planoTK(turmaId)}`, JSON.stringify(fresh), true);
}
async function planoEditarExercicio(turmaId, n){
  const s = planoState(); const p = state.professor;
  if(state.view==='coordenador'){ alert('Para editar e aplicar, entre no painel do professor (Professores → 👁 Entrar no painel).'); return; }
  const plano = s.planos[s.turmaPlano[turmaId]];
  const aula = plano && plano.aulas.find(a=>a.n===n);
  if(!aula || !aula.exercicio) return;
  const disc = planoDisciplinaDoProfessor(plano.disciplina||'');
  const na = freshAssessment();
  na.instrumento = 'exercicios';
  na.unidade = UNIDADES[Math.max(0, Math.min(3, (aula.bimestre||1)-1))];
  na.disciplinaId = disc ? disc.id : '';
  na.turmaIds = [turmaId];
  na.questions = planoQuestoesParaAvaliacao(aula.exercicio, planoMapaDoExercicio(turmaId, aula)); na.questions = await pnpGarantirExercicio(na.questions, plano, aula, turmaId); await planoResolverImagens(na.questions);
  na.securityEnabled = false; na.exigeLiberacao = false; na.minMinutesPerQuestion = null;
  na.endAt = planoPrazoParaEndAt(s.prazo[n]!=null ? s.prazo[n] : '7') || '';
  na.valeNota = s.valeNota[n] !== false;
  na.tituloFixo = aula.exercicio.titulo || `Exercício de fixação — Aula ${n}`;
  na.origemPlano = { planoId: plano.id, aula: n, turmaId, editado: true };
  p.newAssessment = na; p.editingCode = null; p.editingResponseCount = 0; p.pickerOpen = false; p.pickerSelected = [];
  p.subview = 'avaliacoes'; p.mode = 'new';
  render(); window.scrollTo(0,0);
}
async function planoCarregarExtras(planoId){
  const s = planoState();
  if(!s.videos[planoId]) s.videos[planoId] = await planoLerJson(`plano-livro-videos:${planoId}`, {});
  if(!s.feedback[planoId]) s.feedback[planoId] = await planoLerJson(`plano-feedback:${planoId}`, []);
}
async function planoSalvarVideo(planoId, n, url, titulo){
  const s = planoState();
  url = String(url||'').trim(); titulo = String(titulo||'').trim();
  if(!/^https?:\/\//i.test(url)){ alert('Cole o link completo do vídeo (começando com https://).'); return; }
  const mapa = await planoLerJson(`plano-livro-videos:${planoId}`, {});
  const lista = mapa[n] = mapa[n] || [];
  if(lista.some(v => v.url===url)){ alert('Esse vídeo já está salvo nesta aula.'); return; }
  const quem = state.professor.session ? state.professor.session.displayName : 'Coordenação';
  lista.push({ id: cryptoId(), url, t: titulo || 'Vídeo recomendado', por: quem, porId: state.professor.session ? state.professor.session.id : null, em: Date.now() });
  await window.storage.set(`plano-livro-videos:${planoId}`, JSON.stringify(mapa), true);
  s.videos[planoId] = mapa; s.videoRascunho = {};
  s.msg = '⭐ Vídeo salvo. Ele aparece para os outros professores que usam este plano e para os alunos em “Estudar”.';
  render();
}
async function planoRemoverVideo(planoId, n, id){
  if(!confirm('Remover este vídeo da aula?')) return;
  const s = planoState();
  const mapa = await planoLerJson(`plano-livro-videos:${planoId}`, {});
  mapa[n] = (mapa[n]||[]).filter(v => v.id!==id);
  await window.storage.set(`plano-livro-videos:${planoId}`, JSON.stringify(mapa), true);
  s.videos[planoId] = mapa; render();
}
function planoVideosHtml(planoId, n, editavel){
  const s = planoState();
  const lista = ((s.videos[planoId]||{})[n]) || [];
  const meuId = state.professor.session ? state.professor.session.id : null;
  const r = (s.videoRascunho||{})[n] || {};
  return `<div style="margin:6px 0; padding:8px 10px; background:#fffaf0; border-radius:8px;">
    <strong style="font-size:.88rem;">⭐ Vídeos escolhidos pelos professores</strong>
    ${lista.length ? lista.map(v => `<div style="font-size:.86rem; margin:3px 0;">🎬 <a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.t)}</a> <span class="muted">· ${esc(v.por)}</span>${editavel && (v.porId===meuId || state.view==='coordenador') ? ` <button class="btn btn-ghost btn-sm" style="padding:0 6px;" data-action="plano-video-remover" data-n="${n}" data-id="${esc(v.id)}">✕</button>` : ''}</div>`).join('') : '<div class="muted" style="font-size:.82rem;">Nenhum ainda. Achou um bom vídeo na busca? Cole o link aqui para os colegas.</div>'}
    ${editavel ? `<div class="row" style="gap:6px; margin-top:6px; flex-wrap:wrap;">
      <input type="text" data-action="plano-video-campo" data-n="${n}" data-campo="url" value="${esc(r.url||'')}" placeholder="Link do vídeo (YouTube...)" style="flex:2 1 200px;">
      <input type="text" data-action="plano-video-campo" data-n="${n}" data-campo="t" value="${esc(r.t||'')}" placeholder="Título (opcional)" style="flex:1 1 140px;">
      <button class="btn btn-ghost btn-sm" data-action="plano-video-salvar" data-n="${n}">Salvar vídeo</button></div>` : ''}
  </div>`;
}
async function planoRegistrarFeedback(planoId, item){
  const lista = await planoLerJson(`plano-feedback:${planoId}`, []);
  const i = lista.findIndex(f => f.n===item.n && f.turmaId===item.turmaId && f.quem===item.quem && f.autorId===item.autorId);
  if(i>=0) lista[i] = { ...lista[i], ...item, em: Date.now() }; else lista.push({ ...item, em: Date.now() });
  await window.storage.set(`plano-feedback:${planoId}`, JSON.stringify(lista), true);
  return lista;
}
function planoFeedbackProfHtml(planoId, turmaId, n){
  const s = planoState();
  const meuId = state.professor.session ? state.professor.session.id : 'coord';
  const f = (s.feedback[planoId]||[]).find(x => x.n===n && x.turmaId===turmaId && x.quem==='prof' && x.autorId===meuId);
  const ops = [[4,'😀','Muito boa'],[3,'🙂','Boa'],[2,'😐','Mais ou menos'],[1,'🙁','Não funcionou']];
  return `<div data-feedback-prof="${n}" style="margin-top:8px; padding:8px 10px; background:#f3f7fb; border-radius:8px;">
    <strong style="font-size:.86rem;">💬 Piloto: como foi esta aula?</strong>
    <div class="row" style="gap:6px; margin-top:4px; flex-wrap:wrap; align-items:center;">
      ${ops.map(([v,e,t]) => `<button class="btn btn-ghost btn-sm" data-action="plano-feedback-prof" data-n="${n}" data-v="${v}" title="${t}" style="${f && f.nota===v ? 'background:#d8e7f6; border-color:#1F4E79;' : ''}">${e} ${t}</button>`).join('')}
    </div>
    <div class="row" style="gap:6px; margin-top:6px;">
      <input type="text" data-action="plano-feedback-texto" data-n="${n}" value="${esc((s.feedbackRascunho||{})[n]!=null ? s.feedbackRascunho[n] : (f && f.texto) || '')}" placeholder="O que ajustar? (slides, exercício, tempo...)" style="flex:1;">
      <button class="btn btn-ghost btn-sm" data-action="plano-feedback-prof" data-n="${n}" data-v="${f?f.nota:0}">Enviar</button>
    </div>
    ${f ? '<div class="muted" style="font-size:.78rem; margin-top:4px;">✔ Obrigado! Sua avaliação foi registrada (dá para mudar).</div>' : ''}
  </div>`;
}
async function planoEnviarFeedbackProf(n, v){
  const s = planoState(); const turmaId = s.turmaSel; const planoId = s.turmaPlano[turmaId];
  const texto = ((s.feedbackRascunho||{})[n] || '').trim();
  const meuId = state.professor.session ? state.professor.session.id : 'coord';
  const anterior = (s.feedback[planoId]||[]).find(x => x.n===n && x.turmaId===turmaId && x.quem==='prof' && x.autorId===meuId);
  const nota = v || (anterior ? anterior.nota : 0);
  if(!nota){ alert('Escolha primeiro uma carinha 😀🙂😐🙁.'); return; }
  s.feedback[planoId] = await planoRegistrarFeedback(planoId, { n, turmaId, quem:'prof', autorId: meuId, autor: state.professor.session ? state.professor.session.displayName : 'Coordenação', nota, texto: texto || (anterior ? anterior.texto : '') });
  if(s.feedbackRascunho) delete s.feedbackRascunho[n];
  render();
}
function renderPlanoFeedbackResumo(planoId){
  const s = planoState();
  const lista = s.feedback[planoId] || [];
  if(!lista.length) return '';
  const plano = s.planos[planoId];
  const porAula = {};
  lista.forEach(f => { const a = porAula[f.n] = porAula[f.n] || { prof:[], sim:0, nao:0, coment:[] }; if(f.quem==='prof'){ a.prof.push(f.nota); if(f.texto) a.coment.push(`${f.autor}: ${f.texto}`); } else { if(f.util) a.sim++; else a.nao++; } });
  const emo = m => m>=3.5?'😀':m>=2.5?'🙂':m>=1.5?'😐':'🙁';
  return `<details class="card" data-plano-feedback style="padding:12px 16px;"><summary style="cursor:pointer; font-weight:700;">💬 Avaliação do piloto (${lista.length} resposta(s))</summary>
    <div class="table-scroll" style="margin-top:8px;"><table style="font-size:.84rem;">
      <tr><th>Aula</th><th>Professores</th><th>Alunos: a aula ajudou?</th><th>Comentários</th></tr>
      ${Object.keys(porAula).map(Number).sort((a,b)=>a-b).map(n => { const a = porAula[n]; const m = a.prof.length ? a.prof.reduce((x,y)=>x+y,0)/a.prof.length : null; const aula = plano && plano.aulas.find(x=>x.n===n);
        return `<tr><td>Aula ${n}${aula?` — ${esc(aula.tituloCurto||aula.tema)}`:''}</td><td>${m==null?'—':emo(m)+' ('+a.prof.length+')'}</td><td>${a.sim+a.nao ? `👍 ${a.sim} · 👎 ${a.nao}` : '—'}</td><td style="font-size:.8rem;">${a.coment.map(esc).join('<br>')||'—'}</td></tr>`; }).join('')}
    </table></div></details>`;
}
function planoChaveRegra(disciplina, serie){ return `${normalizarTextoPlano(disciplina)}|${planoSerieNum(serie)||serie}`; }
async function planoCriarRegrasPadrao(planos){
  const regras = await planoLerJson('plano-livro-regras', {});
  let mudou = false;
  planos.slice().sort((a,b) => String(a.versao).localeCompare(String(b.versao))).forEach(pl => {
    const k = planoChaveRegra(pl.disciplina, pl.serie);
    if(!(k in regras)){ regras[k] = pl.id; mudou = true; }
  });
  if(mudou) await window.storage.set('plano-livro-regras', JSON.stringify(regras), true);
  return regras;
}
async function planoDefinirRegra(chave, planoId){
  const regras = await planoLerJson('plano-livro-regras', {});
  regras[chave] = planoId || null;
  await window.storage.set('plano-livro-regras', JSON.stringify(regras), true);
  const s = planoState();
  await planoAtualizarEfetivo(); s.painel = null;
  if(s.turmaSel) await planoCarregarTurma(s.turmaSel);
  render();
}
function renderPlanoRegras(){
  const s = planoState();
  const grupos = {};
  s.index.forEach(pl => { const k = planoChaveRegra(pl.disciplina, pl.serie); (grupos[k] = grupos[k] || { disciplina: pl.disciplina, serie: pl.serie, planos: [] }).planos.push(pl); });
  const ks = Object.keys(grupos).sort();
  if(!ks.length) return '';
  return `<h4 style="margin:14px 0 6px;">Vínculo automático (disciplina + série)</h4>
    <p class="muted" style="font-size:.84rem; margin:0 0 6px;">Toda turma da série em que um professor tem a disciplina vinculada segue o plano escolhido aqui — 1ª série PG, 1ª série ST etc. Professor novo na turma? O plano já aparece para ele.</p>
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:8px;">
      ${ks.map(k => { const g = grupos[k]; const atual = (s.regras||{})[k] || '';
        return `<label style="font-size:.85rem;">${esc(g.disciplina)} · ${esc(g.serie)}<select data-action="plano-regra" data-k="${esc(k)}" style="width:100%;">
          <option value="" ${!atual?'selected':''}>— não vincular automaticamente —</option>
          ${g.planos.map(pl => `<option value="${esc(pl.id)}" ${atual===pl.id?'selected':''}>Versão ${esc(pl.versao)} — ${esc(pl.descricao||'')}</option>`).join('')}
        </select></label>`; }).join('')}
    </div>`;
}
function planoAbrirQuiz(turmaId, n){
  const s = planoState(); const p = state.professor;
  if(state.view==='coordenador'){ alert('Para usar o quiz, entre no painel do professor (Professores → 👁 Entrar no painel).'); return; }
  const plano = s.planos[s.turmaPlano[turmaId]];
  const aula = plano && plano.aulas.find(a=>a.n===n);
  if(!aula || !aula.exercicio) return;
  const qs = planoQuizQuestoes(aula);
  if(!qs.length) return;
  p.quiz.setup = { turmaId, numTeams: 2, teams: [], questions: qs };
  const turma = (p.turmas||[]).find(t=>t.id===turmaId);
  if(turma && (turma.students||[]).length >= 2){ try{ quizAutoMontarEquipes(); }catch(e){} }
  p.subview = 'quiz';
  stopQuizPoll();
  refreshProfessorQuiz();
  quizPollInterval = setInterval(refreshProfessorQuiz, 1000);
  render(); window.scrollTo(0,0);
}
__parteOk('saese');
