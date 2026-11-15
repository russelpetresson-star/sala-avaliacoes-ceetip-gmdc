/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "paineis" */
const PN_TAB_DE = { risco:'riscodash', desemp:'desempenho', area:'pnarea', pma:'pmaescola' };
function pnInline(papel, tela){ const n = pnState(); if(!n.aberto){ n.papel = papel; n.tela = tela; } return `<div class="pn" data-pn-inline="${tela}">${n.aberto ? '<div class="pn-vazio">📺 Painel aberto em tela cheia.</div>' : pnPagina(papel, tela)}</div>`; }
function pnAbrir(papel, tela){ const n = pnState(); n.papel = papel; n.tela = tela || PN_TELAS[papel][0][0]; n.aberto = true;
  try{ if(document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); }catch(e){}
  try{ usoReg('painel-neon:' + n.tela); }catch(e){} render(); }
function pnFechar(){ const n = pnState(); n.aberto = false; try{ if(document.fullscreenElement) document.exitFullscreen().catch(() => {}); }catch(e){}
  if(n.papel==='coord' && state.view==='coordenador' && PN_TAB_DE[n.tela] && state.coordenador.subview!=='dashboard') state.coordenador.subview = PN_TAB_DE[n.tela]; render(); }
function pnPassar(d){ const n = pnState(); const ts = PN_TELAS[n.papel]; const i = ts.findIndex(x => x[0]===n.tela); n.tela = ts[(i + d + ts.length) % ts.length][0]; n.foco = null; n.sit = ''; n.nivel = ''; if(n.tela!=='riscoprof') n.disc = ''; render(); }
function pnClassifHtml(){
  const L = pnSlot('coord'); const D = L.D; if(!D || !D.discs.length) return '<p class="muted" style="font-size:.85rem;">Calcule o painel para ver as disciplinas.</p>';
  return `<p class="muted" style="font-size:.82rem;">O app reconhece as disciplinas da base comum pelo nome. Se alguma estiver no lugar errado (por exemplo, “Português e Literatura” como técnica), corrija aqui. Vale para o risco, a análise por área e o boletim.</p>
    <div class="table-scroll"><table><tr><th>Disciplina</th><th>Classificação</th></tr>${D.discs.map(d => { const at = areaDaDisciplina(d, D.mapa); return `<tr><td>${pnEsc(d)}</td><td><select data-pn-area-disc="${pnEsc(d)}" style="max-width:300px;">${[...AREAS_CONHEC.map(a => [a.id, a.nome]), ['ind', 'Disciplina individual (técnica/outras)']].map(([id, nm]) => `<option value="${id}" ${at===id ? 'selected' : ''}>${nm}</option>`).join('')}</select></td></tr>`; }).join('')}</table></div>`;
}
function pnDetalhe(chave, rot, fn){ const n = pnState(); const ab = !!n.det[chave];
  return `<div class="card" style="margin-top:0;"><div class="row" style="justify-content:space-between;align-items:center;cursor:pointer;" data-pn-det="${chave}"><strong>${ab ? '▾' : '▸'} ${rot}</strong><span class="muted" style="font-size:.8rem;">${ab ? 'fechar' : 'abrir'}</span></div>${ab ? `<div style="margin-top:10px;">${fn()}</div>` : ''}</div>`; }
function pnTab(tela){
  const demo = typeof fmChipDemo==='function' ? fmChipDemo() : '';
  const base = demo + pnInline('coord', tela);
  if(tela==='risco') return base + pnDetalhe('risco', '🔎 Lista completa, filtros, exportação e impressão', () => renderRiscoDash()) + pnDetalhe('classif', '⚙️ Como cada disciplina foi classificada (área do conhecimento)', pnClassifHtml);
  if(tela==='desemp') return base + pnDetalhe('desemp', '🔎 Mapa detalhado, comparativo por curso e planilha', () => renderDesempenho());
  if(tela==='pma') return base + pnDetalhe('pma', '🔎 Tabela completa, datas dos bimestres e planilha', () => renderCoordPMA());
  return base;
}
function pnMiniaturas(){
  pnCss(); const r = pnLerResumo('coord'); const L = PN.coord && PN.coord.chave===pnChave('coord') ? PN.coord : null;
  const q = (tela, ic, tit, val, sub) => `<div class="pn-card" data-action="coord-sub-view" data-sub="${PN_TAB_DE[tela]}"><div class="pn-k-r">${ic} ${tit}</div><div class="pn-k-v" style="font-size:28px;">${val}</div><div class="pn-k-s">${sub}</div></div>`;
  const quando = r ? `números de ${new Date(r.em).toLocaleDateString('pt-BR')} ${new Date(r.em).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}` : 'abra um painel para calcular';
  return `<div class="pn" style="padding:14px 16px;"><div class="pn-h" style="margin-bottom:10px;"><div><div class="pn-tit" style="font-size:20px;">📊 <b>PAINÉIS</b></div><div class="pn-sub">${L && L.carregando ? pnEsc(L.prog || 'calculando…') : quando}${r && r.parcial ? ' · média parcial até a ' + pnEsc(r.parcial) : ''}</div></div>
    <div class="pn-ctl"><button class="pn-btn ouro" data-pn="abrir|coord|risco">📺 Apresentar</button></div></div>
    <div class="pn-mini">${q('risco', '⚠️', 'Risco acadêmico', r ? `${r.emRisco} <small style="font-size:.55em;">· ${pnPct(r.pctRisco, 1)}</small>` : '—', r ? `alunos em risco de ${r.alunos} · meta até ${META_REPROVACAO_PCT}%` : 'quem está em risco e por quê')}
      ${q('desemp', '📊', 'Desempenho', r && r.media!=null ? fmt1(r.media) : '—', r ? `média do ano · ${r.abaixo} aluno(s) com média < 5` : 'mapa de calor turma × disciplina')}
      ${q('area', '🧭', 'Análise por área', '→', 'aprovação por disciplina, turma e aluno')}
      ${q('pma', '📘', 'Planejado × Dado × Aprendido', '→', 'cumprimento do plano e acerto')}</div></div>`;
}
function livqState(){ const p = state.professor; return p.livq = p.livq || { aberto:false, idx:null, disc:'', tema:'', serie:'', tipo:'', lista:null, sel:{}, msg:'', carregando:false }; }
function livqDiscKey(nome){ return enemOfNorm(nome||'').replace(/\s+/g,'-'); }
async function livqIndex(){ try{ const r = await window.storage.get('banco-livro-index', true); return JSON.parse(r.value) || {}; }catch(e){ return {}; } }
async function importarBancoLivro(pac){
  const s = planoState(); const k = livqDiscKey(pac.disciplina);
  const temas = {}; pac.questoes.forEach(q => { (temas[q.tema] = temas[q.tema] || []).push(q); });
  const nT = Object.keys(temas).length; s.enviando = { atual:0, total:nT, texto:'Guardando as questões do livro...' }; render();
  const meta = [];
  for(const [t, qs] of Object.entries(temas)){
    // um documento do Firestore aceita ~1 MB: temas com muitas imagens são divididos em partes (tema, tema:2, tema:3...)
    const partes = []; let cur = [], tam = 0;
    qs.forEach(q => { const n = JSON.stringify(q).length; if(cur.length && tam + n > 450000){ partes.push(cur); cur = []; tam = 0; } cur.push(q); tam += n; });
    if(cur.length) partes.push(cur);
    for(let i = 0; i < partes.length; i++) await window.storage.set(`banco-livro:${k}:${t}` + (i ? ':'+(i+1) : ''), JSON.stringify(partes[i]), true);
    meta.push({ n:+t, nome:qs[0].temaNome||('Tema '+t), serie:qs[0].serie||null, mc:qs.filter(q=>q.tipo==='mc').length, ab:qs.filter(q=>q.tipo!=='mc').length, partes:partes.length });
    s.enviando.atual++; render();
  }
  const idx = await livqIndex();
  idx[k] = { disciplina:pac.disciplina, area:pac.area||'', livro:pac.livro||'', versao:pac.versao||'', temas:meta.sort((a,b)=>a.n-b.n) };
  await window.storage.set('banco-livro-index', JSON.stringify(idx), true);
  s.enviando = null;
  const tot = pac.questoes.length, mc = pac.questoes.filter(q=>q.tipo==='mc').length;
  s.msg = `📖 Questões do livro de ${pac.disciplina} guardadas: ${tot} (${mc} de múltipla escolha, ${tot-mc} discursivas), em ${nT} temas. Os professores encontram em Banco de questões → 📖 Questões do livro.`;
  render();
}
async function livqAbrir(){
  const L = livqState(); L.aberto = true; L.msg = ''; L.carregando = true; render();
  L.idx = await livqIndex();
  const ks = Object.keys(L.idx);
  if(!L.disc || !L.idx[L.disc]){
    const minhas = (state.professor.disciplinas||[]).map(d => livqDiscKey(d.name));
    L.disc = ks.find(k => minhas.includes(k)) || ks[0] || '';
  }
  L.carregando = false; await livqCarregar();
}
async function livqCarregar(){
  const L = livqState(); L.lista = null; L.sel = {};
  if(!L.disc || !L.idx || !L.idx[L.disc]){ render(); return; }
  L.carregando = true; render();
  const temas = L.idx[L.disc].temas.filter(t => (!L.serie || String(t.serie)===String(L.serie)) && (!L.tema || String(t.n)===String(L.tema)));
  const todas = [];
  for(const t of temas){ for(let i = 0; i < (t.partes||1); i++){ try{ const r = await window.storage.get(`banco-livro:${L.disc}:${t.n}` + (i ? ':'+(i+1) : ''), true); todas.push(...JSON.parse(r.value)); }catch(e){} } }
  L.lista = todas; L.carregando = false; render();
}
function livqParaBanco(q, discId){
  const base = { id: cryptoId(), points:1, annulled:false, descritorSaeb:'', conteudo:q.temaNome||'', assunto:`Livro p. ${q.pagina} · ${q.fonte||''}`.trim(), livroId:q.id, image:null };
  if(discId) base.disciplinaId = discId;
  if(q.tipo==='mc'){
    const ops = q.opcoes.map(t => ({ id: cryptoId(), text:t }));
    return { ...base, type:'mc', text:q.texto, image:q.img||null, options:ops, correctOptionId: ops[q.correta] ? ops[q.correta].id : null };
  }
  const itens = (q.itens||[]).map((t,i) => `${'abcde'[i]}) ${t}`).join('\n');
  return { ...base, type:'dissertativa', image:q.img||null, text: q.texto + (itens ? '\n' + itens : ''), modelAnswer: q.resposta || 'Consulte o Manual do Professor.' };
}
async function livqAdicionar(){
  const L = livqState(); const p = state.professor;
  const escolhidas = (L.lista||[]).filter(q => L.sel[q.id]);
  if(!escolhidas.length){ L.msg = 'Marque pelo menos uma questão.'; render(); return; }
  if(!p.bank || p.bankLoading) await loadBank();
  const disc = (p.disciplinas||[]).find(d => livqDiscKey(d.name)===L.disc);
  const ja = new Set((p.bank||[]).map(q => q.livroId).filter(Boolean));
  let n = 0, dup = 0;
  escolhidas.forEach(q => { if(ja.has(q.id)){ dup++; return; } p.bank.push(livqParaBanco(q, disc ? disc.id : '')); n++; });
  try{ await saveBankToStorage(); L.msg = `✅ ${n} questão(ões) adicionada(s) ao seu banco${dup ? ` (${dup} já estava(m) lá)` : ''}.`; L.sel = {}; }
  catch(e){ (p.bank||[]).splice(-n, n); L.msg = 'Não foi possível salvar: o banco ficou grande demais. Adicione menos questões com imagem por vez.'; }
  render();
}
function livqBloco(){
  const L = livqState();
  const cab = `<hr style="margin:16px 0; border:none; border-top:1px solid var(--paper-line);">
      <h3 style="margin:0 0 8px;">📖 Questões do livro didático</h3>
      <p class="muted" style="font-size:.85rem;">Questões das seções Atividades do livro adotado, separadas por tema, com o gabarito do livro (múltipla escolha) ou a resposta do Manual do Professor (discursivas). Escolha e adicione ao seu banco.</p>`;
  if(!L.aberto) return cab + `<div class="type-pick"><button class="btn btn-ghost btn-sm" data-livq="abrir">📖 Abrir questões do livro</button></div>`;
  const idx = L.idx || {}; const ks = Object.keys(idx);
  if(L.carregando && !L.lista) return cab + '<div class="spinner"></div>';
  if(!ks.length) return cab + `<div class="empty">Nenhum livro importado ainda. A coordenação importa o arquivo <b>banco-livro-…json</b> em Plano de aulas do livro → Importar plano.</div><div class="type-pick"><button class="btn btn-ghost btn-sm" data-livq="fechar">Fechar</button></div>`;
  const I = idx[L.disc] || { temas:[] };
  const temas = I.temas.filter(t => !L.serie || String(t.serie)===String(L.serie));
  const lista = (L.lista||[]).filter(q => !L.tipo || q.tipo===L.tipo);
  const nSel = Object.values(L.sel).filter(Boolean).length;
  const item = q => `
    <div class="livq-q" style="border:1px solid var(--paper-line); border-radius:10px; padding:10px 12px; margin:8px 0; background:var(--paper, #fff);">
      <label style="display:flex; gap:10px; align-items:flex-start; cursor:pointer; font-weight:400;">
        <input type="checkbox" data-livq-sel="${esc(q.id)}" ${L.sel[q.id]?'checked':''} style="margin-top:4px; width:auto;">
        <div style="flex:1; min-width:0;">
          <div class="muted" style="font-size:.78rem;">${q.tipo==='mc'?'🔘 Múltipla escolha':'✍️ Discursiva'} · Tema ${q.tema} · p. ${q.pagina} · ${esc(q.fonte||'')}${q.origem==='vestibular'?' · vestibular':q.origem==='enem'?' · ENEM':''}</div>
          ${q.img ? `<img src="${q.img}" alt="Questão do livro, p. ${q.pagina}" style="max-width:100%; max-height:420px; border-radius:6px; margin:6px 0; background:#fff;">`
                  : `<div style="font-size:.92rem; margin:4px 0;">${esc(q.texto).slice(0, 600)}${q.texto.length>600?'…':''}</div>`}
          ${q.tipo==='mc' ? `<ol type="a" style="margin:4px 0 0 18px; font-size:.88rem;">${q.opcoes.map((o,i) => `<li style="${i===q.correta?'font-weight:700;color:#1d6b31;':''}">${esc(o)}${i===q.correta?' ✓':''}</li>`).join('')}</ol>`
            : `${(q.itens||[]).length ? `<ol type="a" style="margin:4px 0 0 18px; font-size:.88rem;">${q.itens.map(o => `<li>${esc(o)}</li>`).join('')}</ol>` : ''}
               <details style="margin-top:4px;"><summary class="muted" style="font-size:.8rem; cursor:pointer;">Resposta (Manual do Professor)</summary><div style="font-size:.85rem;">${esc(q.resposta || 'Consulte o Manual do Professor.')}</div></details>`}
        </div>
      </label>
    </div>`;
  return cab + `
    <div class="row" style="gap:10px; flex-wrap:wrap; align-items:flex-end;">
      <div><label>Livro</label><select data-livq-f="disc">${ks.map(k => `<option value="${k}" ${k===L.disc?'selected':''}>${esc(idx[k].disciplina)}</option>`).join('')}</select></div>
      <div><label>Série</label><select data-livq-f="serie"><option value="">Todas</option>${[1,2,3].map(s => `<option value="${s}" ${String(L.serie)===String(s)?'selected':''}>${s}ª série</option>`).join('')}</select></div>
      <div style="flex:1 1 260px;"><label>Tema</label><select data-livq-f="tema"><option value="">Todos os temas</option>${temas.map(t => `<option value="${t.n}" ${String(L.tema)===String(t.n)?'selected':''}>Tema ${t.n} — ${esc(t.nome)} (${t.mc} ME · ${t.ab} disc.)</option>`).join('')}</select></div>
      <div><label>Tipo</label><select data-livq-f="tipo"><option value="">Todas</option><option value="mc" ${L.tipo==='mc'?'selected':''}>Múltipla escolha</option><option value="aberta" ${L.tipo==='aberta'?'selected':''}>Discursivas</option></select></div>
    </div>
    <p class="muted" style="font-size:.78rem; margin-top:6px;">${esc(I.livro||'')} · as respostas vêm do livro; confira antes de usar numa prova.</p>
    ${L.msg ? `<p style="font-size:.88rem; margin:8px 0;">${esc(L.msg)}</p>` : ''}
    <div class="row" style="gap:8px; flex-wrap:wrap; margin:8px 0;">
      <button class="btn btn-primary btn-sm" data-livq="adicionar" style="width:auto;">＋ Adicionar ao meu banco (${nSel})</button>
      <button class="btn btn-ghost btn-sm" data-livq="todas" style="width:auto;">Marcar todas as ${lista.length}</button>
      <button class="btn btn-ghost btn-sm" data-livq="fechar" style="width:auto;">Fechar</button>
    </div>
    ${L.carregando ? '<div class="spinner"></div>' : (lista.length ? `<div data-livq-lista>${lista.map(item).join('')}</div>` : '<div class="empty">Nenhuma questão com esse filtro.</div>')}`;
}
function planoQuizQuestoes(aula){
  const ex = (aula && aula.exercicio) || {};
  const curta = q => q.tipo==='mc' && !q.imagem && (q.texto||'').length <= 220 && (q.opcoes||[]).length >= 2 && q.opcoes.every(o => String(o).length <= 90);
  const L = (ex.quiz||[]).concat((ex.questoes||[]).filter(curta));
  return L.slice(0, 12).map(q => ({ id: cryptoId(), text: q.texto, options: q.opcoes.slice(), correctIndex: q.correta, durationSeconds: 30 }));
}
__parteOk('paineis');
