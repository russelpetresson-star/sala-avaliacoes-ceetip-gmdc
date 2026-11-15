/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "caderno" */
const VISTO_FICHAS = { c:3, i:1, s:0 };
function planoCfg(turmaId){ const s = planoState(); return (s.cfg||{})[turmaId] || planoCfgPadrao(); }
async function planoCfgCarregar(turmaId){
  const s = planoState(); s.cfg = s.cfg || {};
  s.cfg[turmaId] = Object.assign(planoCfgPadrao(), await planoLerJson(`plano-config:${planoTK(turmaId)}`, {}));
  return s.cfg[turmaId];
}
async function planoCfgMudar(turmaId, mexer){
  const s = planoState(); s.cfg = s.cfg || {};
  const c = Object.assign(planoCfgPadrao(), s.cfg[turmaId]||{}); c.leitura = Object.assign({}, c.leitura||{}); c.grupo = Object.assign({}, c.grupo||{});
  mexer(c); s.cfg[turmaId] = c; render();
  try{ await window.storage.set(`plano-config:${planoTK(turmaId)}`, JSON.stringify(c), true); }catch(e){}
}
function planoCfgHtml(turmaId){
  const c = planoCfg(turmaId);
  return `<div data-plano-cfg style="margin-top:10px; background:#f7f3ea; border-radius:8px; padding:8px 10px; font-size:.85rem; display:flex; gap:14px; flex-wrap:wrap; align-items:center;">
    <strong>⚙️ Nesta turma:</strong>
    <label style="cursor:pointer; text-transform:none; font-weight:400;"><input type="checkbox" data-action="plano-cfg-datashow" data-tid="${esc(turmaId)}" ${c.datashow?'checked':''} style="width:auto;"> a sala tem data show <span class="muted">(os tablets só acendem nas atividades)</span></label>
    <label style="text-transform:none; font-weight:400;">🧠 Mapa completo: <select data-action="plano-cfg-modelo" data-tid="${esc(turmaId)}" style="width:auto; padding:2px 4px;">
      ${[['aula','mostrar no fim da aula'],['estudar','só depois, em “Estudar”'],['nunca','não mostrar']].map(([v,t]) => `<option value="${v}" ${c.mapaModelo===v?'selected':''}>${t}</option>`).join('')}</select></label>
    <label style="cursor:pointer; text-transform:none; font-weight:400;"><input type="checkbox" data-action="plano-cfg-mapaex" data-tid="${esc(turmaId)}" ${c.mapaNoExercicio!==false?'checked':''} style="width:auto;"> mapa do caderno vale ${MAPA_PONTOS} dos 10 pontos do exercício</label>
  </div>`;
}
function planoLeituraHtml(turmaId, aula){
  if(!aula.slides) return '';
  const c = planoCfg(turmaId); const m = (c.leitura||{})[aula.n] || 0;
  return `<label style="font-size:.85rem; text-transform:none; font-weight:400;">📖 Leitura no livro durante a aula: <select data-action="plano-cfg-leitura" data-tid="${esc(turmaId)}" data-n="${aula.n}" style="width:auto; padding:2px 4px;">
    ${[0,5,8,10,15].map(v => `<option value="${v}" ${m===v?'selected':''}>${v ? v + ' min' : 'não fazer'}</option>`).join('')}</select></label>`;
}
function avMapaHtml(m, opts){
  if(!m) return '';
  opts = opts || {};
  if(opts.lista){
    const cores = ['#F6EEF0', '#DCE6F1', '#F3E7C0', '#E3F1E6'];
    return `<div class="av-mapa">
      <div style="text-align:center;margin:4px 0 8px;"><span style="display:inline-block;background:#6B1F2E;color:#fff;border-radius:999px;padding:6px 16px;font-family:Cambria,Georgia,serif;font-weight:700;">${esc(m.centro)}</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">${m.ramos.map((r, i) => `<div style="background:${cores[i%4]};border-radius:8px;padding:8px 10px;font-size:.88rem;">
        <div style="font-weight:700;color:#6B1F2E;">${i+1}. ${esc(r.t)}</div>
        <div style="margin-top:4px;">${r.itens.map(x => `<span style="display:inline-block;background:#fff;border-radius:6px;padding:1px 6px;margin:2px 3px 0 0;">${esc(x)}</span>`).join('')}</div>
        <div style="margin-top:4px;font-style:italic;color:#666;font-size:.85em;">✏️ ${esc(r.dica)}</div></div>`).join('')}</div></div>`;
  }
  const C = { v:'#6B1F2E', o:'#C9A227', a:'#1F4E79' };
  const pos = [[0,0],[2,0],[0,2],[2,2]];
  const cores = ['#F6EEF0', '#DCE6F1', '#F3E7C0', '#E3F1E6'];
  const linhas = [[50,50,18,20],[50,50,82,20],[50,50,18,80],[50,50,82,80]];
  const ate = opts.ate!=null ? opts.ate : m.ramos.length - 1;
  return `<div class="av-mapa" style="position:relative;display:grid;grid-template-columns:1fr .9fr 1fr;grid-template-rows:1fr auto 1fr;gap:.5em;height:100%;font-size:${opts.fonte||'.82em'};">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;z-index:0;">${linhas.map((l,i) => i<=ate && m.ramos[i] ? `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="${i===opts.destaque?C.o:'#b9a9ad'}" stroke-width="${i===opts.destaque?1.4:.8}" vector-effect="non-scaling-stroke" style="stroke-width:${i===opts.destaque?4:2}px"/>` : '').join('')}</svg>
    ${m.ramos.map((r, i) => { const [c, l] = pos[i]; const visivel = i<=ate; const dest = i===opts.destaque;
      return `<div style="grid-column:${c+1};grid-row:${l+1};z-index:1;background:${visivel?cores[i]:'#f2f2f2'};border-radius:.6em;padding:.45em .6em;${dest?`outline:.2em solid ${C.o};`:''}${visivel?'':'color:#bbb;'}">
        <div style="font-weight:700;color:${visivel?C.v:'#bbb'};">${i+1}. ${visivel || opts.titulos ? esc(r.t) : '…'}</div>
        ${visivel && !opts.soTitulos ? `<div style="margin-top:.2em;">${r.itens.map(x => `<span style="display:inline-block;background:#fff;border-radius:.4em;padding:.05em .4em;margin:.12em .15em 0 0;">${esc(x)}</span>`).join('')}</div><div style="margin-top:.25em;font-style:italic;color:#666;font-size:.9em;">✏️ ${esc(r.dica)}</div>` : ''}</div>`; }).join('')}
    <div style="grid-column:2;grid-row:2;z-index:1;align-self:center;background:${C.v};color:#fff;border-radius:50%;aspect-ratio:1.6;display:flex;align-items:center;justify-content:center;text-align:center;padding:.4em;font-family:Cambria,Georgia,serif;font-weight:700;font-size:1.15em;">${esc(m.centro)}</div>
  </div>`;
}
const AV_TIPOS_CADERNO = ['mapa-inicio', 'caderno', 'leitura'];
const AV_TIPOS_INTERATIVOS = ['nuvem', 'relampago', 'resposta', 'vf', 'pratica', 'termometro', 'grupo'];
function avCadernoHtml(d, sl, ctx){
  const C = { v:'#6B1F2E', o:'#C9A227', a:'#1F4E79' };
  const m = d.mapa; const sess = ctx.sess || {};
  const tablet = ctx.modo==='aluno' && !ctx.estudo;
  const cab = (ic, txt) => `<div class="av-row" style="justify-content:space-between;"><div class="av-t" style="margin-bottom:.4em;">${txt}</div>${avCirc(ic, C.o, C.v, 2.2)}</div>`;
  if(sl.t==='mapa-inicio'){
    return `<div class="av-in av-escuro">${cab('FaPenToSquare', '✍️ No caderno: comece o mapa mental')}
      <div style="display:grid;grid-template-columns:1fr 1.1fr;gap:1em;align-items:center;height:72%;">
        <div style="font-size:1.15em;line-height:1.45;">
          <div>1. Vire o caderno <b>na horizontal</b>.</div>
          <div>2. No meio da página, escreva dentro de um círculo:</div>
          <div class="av-card ou" style="color:${C.v};font-weight:700;margin:.4em 0;text-align:center;">AULA ${ctx.n} · ${esc(m.centro)} · data</div>
          <div>3. Deixe espaço em volta: durante a aula você vai criar <b>${m.ramos.length} ramos</b>.</div></div>
        <div style="background:#fff;border-radius:.6em;height:100%;padding:.6em;color:#222;">${avMapaHtml({ centro: m.centro, ramos: m.ramos }, { ate:-1, titulos:false, fonte:'.7em' })}</div>
      </div>${tablet ? '<div style="color:#F3E7C0;margin-top:.3em;">📵 Tablet para baixo, caderno aberto.</div>' : ''}</div>`;
  }
  if(sl.t==='caderno'){
    const r = m.ramos[sl.k]; const dica = !!(sess.cadernoDica||{})[sl.k] || ctx.estudo;
    return `<div class="av-in">${cab('FaPenToSquare', `✍️ Ramo ${sl.k+1} do mapa: ${esc(r.t)}`)}
      <div style="display:grid;grid-template-columns:1fr 1.1fr;gap:1em;height:74%;">
        <div style="display:flex;flex-direction:column;gap:.5em;font-size:1.1em;">
          <div class="av-card ou" style="color:${C.v};"><b>No caderno:</b> puxe o ramo ${sl.k+1} a partir do centro e escreva <b>“${esc(r.t)}”</b>.</div>
          <div class="av-card">Agora escreva <b>2 ou 3 palavras-chave</b> com o que você entendeu — com as suas palavras.</div>
          <div class="av-card az">✏️ Desenho: ${esc(r.dica)}.</div>
          ${dica ? `<div class="av-card av-pop" style="background:#E9F6EC;"><b style="color:#1d6b31;">💡 Palavras que podem ajudar:</b> ${r.itens.map(esc).join(' · ')}</div>`
            : (ctx.modo==='prof' ? `<button class="btn btn-ghost btn-sm" data-action="av-caderno-dica" data-k="${sl.k}" style="align-self:flex-start;background:#fff;">💡 Mostrar palavras de ajuda</button>` : '')}
        </div>
        <div style="background:#fafafa;border-radius:.6em;padding:.5em;">${avMapaHtml(m, { ate: sl.k, destaque: sl.k, soTitulos: true, fonte:'.72em' })}</div>
      </div>${tablet ? '<div style="color:#777;margin-top:.2em;">📵 Tablet para baixo, caderno aberto.</div>' : ''}</div>`;
  }
  if(sl.t==='leitura'){
    const min = sl.min || 8; const ini = sess.leituraIni && sess.leituraIdx===sl.pos ? sess.leituraIni : null;
    const resta = ini ? Math.max(0, min*60 - (Date.now()-ini)/1000) : min*60;
    const mmss = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
    return `<div class="av-in av-azul">${cab('FaBookOpen', '📖 Hora da leitura')}
      <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:1em;align-items:center;height:70%;">
        <div style="font-size:1.25em;line-height:1.5;">
          <div>Abra o <b>livro</b> em <b>${esc(d.paginas||'')}</b>.</div>
          <div>Leia em silêncio, com calma.</div>
          <div>Sublinhe ou anote <b>2 ideias</b> que vão entrar no seu mapa mental.</div>
          ${tablet ? '<div style="color:#F3E7C0;margin-top:.4em;">📵 Tablet para baixo durante a leitura.</div>' : ''}</div>
        <div style="text-align:center;"><div data-av-leitura-relogio data-ini="${ini||''}" data-min="${min}" style="font-size:3.6em;font-weight:800;font-family:Cambria,Georgia,serif;">${ini && resta<=0 ? '⏰' : mmss(resta)}</div>
          ${ini ? (resta<=0 ? '<div style="color:#F3E7C0;">Tempo esgotado</div>' : `<div class="av-barra"><div style="animation:avBarra ${min*60}s linear both;animation-delay:-${((Date.now()-ini)/1000).toFixed(1)}s;"></div></div>`)
            : (ctx.modo==='prof' ? `<button class="btn" data-action="av-leitura-iniciar" data-i="${sl.pos}" style="background:${C.o};color:${C.v};font-weight:700;margin-top:.4em;">▶ Iniciar ${min} min</button>` : `<div style="color:#F3E7C0;">${min} minutos</div>`)}</div>
      </div></div>`;
  }
  if(sl.t==='mapa-final'){
    const modelo = ctx.estudo ? (ctx.mapaModelo && ctx.mapaModelo!=='nunca') : (sess.cfg && sess.cfg.mapaModelo==='aula');
    if(modelo) return `<div class="av-in">${cab('FaBrain', '🧠 Confira o seu mapa mental')}
      <div style="margin:-.5em 0 .5em;color:#666;font-size:.85em;">Compare com o seu: falta algo? Complete com outra cor. Não precisa ficar igual — com as suas palavras é melhor.</div>
      <div style="height:66%;">${avMapaHtml(m, { fonte:'.72em' })}</div></div>`;
    return `<div class="av-in av-escuro">${cab('FaBrain', '🧠 Confira o seu mapa mental')}
      <div style="font-size:1.25em;line-height:1.6;margin-top:.4em;">
        <div>☐ Centro com <b>aula, tema e data</b></div>
        <div>☐ <b>${m.ramos.length} ramos</b> saindo do centro: ${m.ramos.map(r => esc(r.t)).join(' · ')}</div>
        <div>☐ <b>2 ou 3 palavras-chave</b> em cada ramo</div>
        <div>☐ Pelo menos <b>1 desenho</b></div></div>
      <div class="av-card ou" style="color:${C.v};margin-top:.8em;font-weight:700;">📒 O professor vai passar dando o visto — o mapa vale ponto no exercício da aula.</div>
      ${ctx.modo==='prof' ? `<button class="btn" data-action="av-visto-abrir" style="margin-top:.7em;background:#fff;color:${C.v};font-weight:700;">📒 Dar o visto agora</button>` : ''}</div>`;
  }
  return '';
}
function avOlheQuadroHtml(d, sl){
  return `<div class="av-in" style="background:#111;color:#ddd;text-align:center;display:flex;flex-direction:column;justify-content:center;gap:.6em;">
    <div style="font-size:4em;">👀</div><div style="font-size:1.8em;font-weight:700;color:#fff;">Olhe para o quadro</div>
    <div style="font-size:1.1em;">Tablet para baixo. Ele acende sozinho quando for a hora de responder.</div></div>`;
}
function avTabletEscuro(sess, sl){
  if(!sess || !sess.cfg || !sess.cfg.datashow) return false;
  if(AV_TIPOS_INTERATIVOS.includes(sl.t) || AV_TIPOS_CADERNO.includes(sl.t)) return false;
  if(sl.t==='figura' && sess.toque && sess.toque.fig===sl.i) return false;
  return true;
}
async function avLeituraIniciar(pos){
  const av = aulaVivaState(); if(!av.sess) return;
  av.sess.leituraIni = Date.now(); av.sess.leituraIdx = pos;
  render(); await aulaVivaSalvarSessao();
}
async function avCadernoDica(k){
  const av = aulaVivaState(); if(!av.sess) return;
  av.sess.cadernoDica = Object.assign({}, av.sess.cadernoDica||{}, { [k]: true });
  render(); await aulaVivaSalvarSessao();
}
async function planoVistoCarregar(turmaId){
  const s = planoState(); s.visto = s.visto || {};
  s.visto[turmaId] = await planoLerJson(`plano-visto:${planoTK(turmaId)}`, {});
  return s.visto[turmaId];
}
function planoVistoDe(turmaId, n){ const s = planoState(); return (((s.visto||{})[turmaId]||{})[n]) || {}; }
async function planoDarVisto(turmaId, n, marcas){
  const s = planoState();
  const turma = (state.professor.turmas||[]).find(t => t.id===turmaId);
  const fichas = [];
  let novoDoc = null;
  await window.storage.update(`plano-visto:${planoTK(turmaId)}`, raw => {
    let doc; try{ doc = raw ? JSON.parse(raw) : {}; }catch(e){ doc = {}; }
    doc = doc || {}; doc[n] = doc[n] || {};
    fichas.length = 0;
    Object.entries(marcas).forEach(([sid, v]) => {
      const ant = doc[n][sid] || {};
      if(!v){ delete doc[n][sid]; return; }
      const alvo = VISTO_FICHAS[v]||0, dadas = ant.f||0;
      if(alvo > dadas) fichas.push({ studentId: sid, amount: alvo - dadas, motivo: `Mapa mental da aula ${n} no caderno (${VISTO_TXT[v]})`, categoria: 'caderno' });
      doc[n][sid] = { v, at: Date.now(), f: Math.max(alvo, dadas) };
    });
    novoDoc = doc;
    return JSON.stringify(doc);
  });
  s.visto = s.visto || {}; s.visto[turmaId] = novoDoc || {};
  render();
  if(fichas.length){ try{ await awardFichasLote(turmaId, fichas); }catch(e){} }
  // nota: o mapa compõe o exercício de fixação da aula
  for(const code of planoCodigosDaAula(s.prog[turmaId]||{}, n)){
    let a = planoAvaliacaoPorCodigo(code) || await planoLerJson(`assessment:${code}`, null);
    const qm = a && (a.questions||[]).find(q => q.mapaCaderno);
    if(qm){
      const nomes = {}; ((turma && turma.students)||[]).forEach(st => nomes[nomeChave(st.name)] = st.id);
      try{
        await window.storage.update(`responses:${code}`, raw => {
          let lista; try{ lista = raw ? JSON.parse(raw) : null; }catch(e){ lista = null; }
          if(!Array.isArray(lista)) return undefined;
          let mudou = false;
          lista.forEach(r => {
            const sid = nomes[nomeChave(r.studentName)];
            if(!sid || !(sid in marcas)) return;
            const v = marcas[sid];
            r.details = r.details || [];
            let d = r.details.find(x => x.questionId===qm.id);
            if(!d){ d = { questionId: qm.id }; r.details.push(d); }
            if(v){ d.score = Math.round(qm.points * VISTO_FATOR[v] * 100)/100; d.pending = false; d.feedback = `📒 Visto no caderno: ${VISTO_TXT[v]}.`; }
            else { d.score = null; d.pending = true; d.feedback = 'Aguardando o visto do professor no caderno.'; }
            r.total = Math.round(r.details.reduce((t, x) => t + (x.score||0), 0) * 100)/100;
            mudou = true;
          });
          return mudou ? JSON.stringify(lista) : undefined;
        });
      }catch(e){}
    }
  }
}
function renderVistoPainel(turmaId, n, emAula){
  const turma = (state.professor.turmas||[]).find(t => t.id===turmaId);
  const alunos = ((turma && turma.students)||[]).slice().sort((a,b) => a.name.localeCompare(b.name, 'pt-BR'));
  const vs = planoVistoDe(turmaId, n);
  const cont = { c:0, i:0, s:0 }; Object.values(vs).forEach(x => { if(cont[x.v]!=null) cont[x.v]++; });
  const falta = alunos.filter(a => !vs[a.id]).length;
  return `<div data-visto-painel="${n}" style="${emAula?'text-align:left;':''}">
    <div class="row" style="justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
      <strong>📒 Visto no caderno — mapa mental da aula ${n}</strong>
      <span style="font-size:.82rem;">✅ ${cont.c} · ½ ${cont.i} · ✖ ${cont.s} · <span class="muted">falta ${falta}</span></span>
    </div>
    <p class="muted" style="font-size:.8rem; margin:4px 0 8px;">Completo: centro + ramos com palavras-chave e desenho (+3 fichas, nota cheia do mapa). Incompleto: metade (+1 ficha). O visto entra no exercício de fixação desta aula.</p>
    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">
      <button class="btn btn-ghost btn-sm" data-action="visto-todos" data-tid="${esc(turmaId)}" data-n="${n}" data-v="c" ${falta?'':'disabled'}>✅ Marcar os que faltam como completos</button>
    </div>
    <div style="max-height:${emAula?'52vh':'420px'}; overflow:auto;">${alunos.map(a => { const v = vs[a.id] && vs[a.id].v;
      return `<div data-visto-aluno="${esc(a.id)}" style="display:flex; align-items:center; gap:6px; padding:4px 2px; border-bottom:1px solid #eee;">
        <span style="flex:1; min-width:0; font-size:.9rem;">${esc(a.name)}</span>
        ${['c','i','s'].map(x => `<button class="btn btn-sm ${v===x?'btn-primary':'btn-ghost'}" data-action="visto-marcar" data-tid="${esc(turmaId)}" data-n="${n}" data-sid="${esc(a.id)}" data-v="${x}" style="min-width:2.6em;" title="${VISTO_TXT[x]}">${x==='c'?'✅':x==='i'?'½':'✖'}</button>`).join('')}
      </div>`; }).join('') || '<p class="muted">Turma sem alunos cadastrados.</p>'}</div></div>`;
}
async function vistoMarcar(turmaId, n, sid, v){
  const atual = (planoVistoDe(turmaId, n)[sid]||{}).v;
  await planoDarVisto(turmaId, n, { [sid]: atual===v ? null : v });
}
async function vistoTodos(turmaId, n, v){
  const turma = (state.professor.turmas||[]).find(t => t.id===turmaId);
  const vs = planoVistoDe(turmaId, n); const marcas = {};
  ((turma && turma.students)||[]).forEach(a => { if(!vs[a.id]) marcas[a.id] = v; });
  if(Object.keys(marcas).length) await planoDarVisto(turmaId, n, marcas);
}
async function vistoDoAluno(a, al){
  if(!a || !a.origemPlano || !al.turma) return null;
  await planoDonosCarregar();
  const doc = await planoLerJson(`plano-visto:${planoTKP(a.origemPlano.turmaId || al.turma.id, a.origemPlano.planoId)}`, {});
  const reg = ((doc||{})[a.origemPlano.aula]||{})[al.matriculaStudentId];
  return reg ? reg.v : null;
}
function vistoPontosParaNota(a, vistos, turma, nome){
  const qm = (a.questions||[]).find(q => q.mapaCaderno);
  if(!qm || !a.origemPlano || !turma) return 0;
  const st = (turma.students||[]).find(s => s.name===nome);
  const reg = st && (((vistos[planoTKP(a.origemPlano.turmaId, a.origemPlano.planoId)]||{})[a.origemPlano.aula])||{})[st.id];
  return reg ? qm.points * (VISTO_FATOR[reg.v]||0) : 0;
}
function estudarMapaHtml(e, a){
  const m = a.slides && a.slides.mapa; if(!m) return '';
  const modo = (e.cfg && e.cfg.mapaModelo) || 'estudar';
  const al = state.aluno;
  const reg = (((e.visto||{})[a.n])||{})[al.matriculaStudentId];
  return `<div data-estudar-mapa="${a.n}" style="margin:10px 0; border:1px solid #eadfd0; border-radius:10px; padding:10px;">
    <div class="row" style="justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;"><strong>🧠 Mapa mental desta aula (no caderno)</strong>
      <span style="font-size:.82rem;">${reg ? `📒 Visto: <strong>${VISTO_TXT[reg.v]}</strong>` : '📒 Ainda sem visto'}</span></div>
    ${modo==='nunca'
      ? `<p style="font-size:.88rem; margin:6px 0 0;">Centro: <strong>${esc(m.centro)}</strong>. Ramos: ${m.ramos.map((r,i) => `${i+1}. ${esc(r.t)}`).join(' · ')}. Complete o seu com as suas palavras.</p>`
      : `<div style="margin-top:8px;">${avMapaHtml(m, { lista:true })}</div><p class="muted" style="font-size:.8rem; margin:6px 0 0;">Use para conferir e completar o seu mapa — não precisa copiar igual.</p>`}
  </div>`;
}
__parteOk('caderno');
