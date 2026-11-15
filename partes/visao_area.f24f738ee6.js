/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "visao_area" */
function areaState(){ const s = planoState(); if(!s.area) s.area = { serie:'1', bim:1, dados:null, carregando:false, areaId:'' }; return s.area; }
function areaConhecDe(disc){ const n = normDisc(disc); const a = AREAS_CONHEC.find(x => x.discs.includes(n)); return a ? a.id : ''; }
function areaAtualId(discs){
  const A = areaState(); const tem = id => discs.some(d => areaConhecDe(d.k)===id);
  if(A.areaId && tem(A.areaId)) return A.areaId;
  const minha = areaConhecDe(planoDiscAtual()); if(minha && tem(minha)) return minha;
  return tem('hum') ? 'hum' : (discs[0] ? areaConhecDe(discs[0].k) : 'hum');
}
function areaPlanoDaSerie(disc, serie){
  const s = planoState();
  const regra = (s.regras||{})[`${disc}|${serie}`];
  const cand = (s.index||[]).filter(pl => planoDiscKey(pl.disciplina)===disc && planoSerieNum(pl.serie)===serie);
  if(regra && cand.some(pl => pl.id===regra)) return regra;
  const b = cand.find(pl => String(pl.versao||'').toUpperCase()==='B');
  return (b || cand[0] || {}).id || null;
}
async function areaCarregar(){
  const s = planoState(); const A = areaState();
  if(A.carregando) return;
  A.carregando = true; render();
  if(!s.carregado) await carregarPlanoLivro();
  const discs = planoDiscsDisponiveis(); const dados = {};
  for(const ser of ['1','2','3']){
    dados[ser] = [];
    for(const d of discs){
      const pid = areaPlanoDaSerie(d.k, ser); if(!pid) continue;
      const pl = await planoObter(pid); if(pl) dados[ser].push({ disc: d.k, label: d.label, plano: pl });
    }
  }
  A.dados = dados; A.carregando = false; render();
}
function areaCapsDoPlano(pl){
  // capítulos do plano: usa a classificação gravada (plano.area.capitulos) ou agrupa pelas aulas
  const caps = []; const info = ((pl.area||{}).capitulos)||[];
  (pl.aulas||[]).forEach(a => {
    if(a.tipo==='Revisão' || a.tipo==='Avaliação') return;
    const c = (a.slides && a.slides.capitulo) || a.capitulo || '';
    if(!c) return;
    let k = caps.find(x => x.cap===c);
    if(!k){ const i = info.find(x => x.cap===c) || {}; k = { cap:c, chave: i.chave || c.split(' — ')[0], tipo: i.tipo || '', requer: i.requer || [], motivo: i.motivo || '', aulas: [] }; caps.push(k); }
    k.aulas.push(a);
  });
  caps.forEach(k => { k.bims = [...new Set(k.aulas.map(a => a.bimestre))].sort(); k.de = Math.min(...k.aulas.map(a => a.n)); k.ate = Math.max(...k.aulas.map(a => a.n)); });
  return caps;
}
function areaTipoChip(tipo){
  if(tipo==='base') return '<span title="Capítulo base: outros capítulos dependem dele — não mude de lugar" style="font-size:.7rem; background:#eee; color:#555; border-radius:5px; padding:0 5px;">🔒 base</span>';
  if(tipo==='independente') return '<span title="Capítulo independente: pode ser antecipado ou adiado, desde que o que ele requer já tenha sido visto" style="font-size:.7rem; background:#e6f4ea; color:#1d6b31; border-radius:5px; padding:0 5px;">🔀 independente</span>';
  return '';
}
function areaPares(lista){
  // pares de conexão entre as disciplinas da mesma série (sem repetir A↔B e B↔A)
  const por = {}; lista.forEach(x => por[x.plano.id] = x);
  const vistos = new Set(), out = [];
  lista.forEach(x => (x.plano.aulas||[]).forEach(a => (a.conexoes || (a.slides && a.slides.conexoes) || []).forEach(c => {
    const y = por[c.planoId]; if(!y) return;
    const b = (y.plano.aulas||[]).find(z => z.n===c.n); if(!b) return;
    const k = [x.plano.id + ':' + a.n, y.plano.id + ':' + b.n].sort().join('|');
    if(vistos.has(k)) return; vistos.add(k);
    out.push({ x, a, y, b, tema: c.tema || '' });
  })));
  return out;
}
function areaSugestoes(lista){
  const todos = areaPares(lista);
  const capsPor = {}; lista.forEach(x => capsPor[x.plano.id] = areaCapsDoPlano(x.plano));
  const capDe = (x, a) => (capsPor[x.plano.id]||[]).find(k => k.aulas.some(z => z.n===a.n));
  const grupos = {};
  todos.forEach(p => {
    [[p.x, p.a, p.y, p.b], [p.y, p.b, p.x, p.a]].forEach(([x, a, y, b]) => {
      const k1 = capDe(x, a); if(!k1 || k1.tipo!=='independente') return;
      const g = (grupos[x.plano.id + '|' + k1.cap] = grupos[x.plano.id + '|' + k1.cap] || { x, k1, temas: new Set(), alvos: [], parceiros: new Set(), juntos: 0 });
      if(a.bimestre===b.bimestre){ g.juntos++; return; }   // já coincide hoje
      g.temas.add(p.tema); g.alvos.push(b.bimestre); g.y = y; const k2 = capDe(y, b); if(k2) g.parceiros.add(k2.cap);
    });
  });
  const out = [];
  Object.values(grupos).forEach(g => {
    if(g.temas.size < 2) return;
    const atual = g.k1.bims[0];
    // bimestre-alvo: o mais frequente entre os temas da outra disciplina
    const cont = {}; g.alvos.forEach(b => cont[b] = (cont[b]||0) + 1);
    const alvo = Number(Object.entries(cont).sort((a, b) => b[1] - a[1] || Math.abs(a[0]-atual) - Math.abs(b[0]-atual))[0][0]);
    if(alvo === atual) return;
    const req = (capsPor[g.x.plano.id]||[]).filter(k => (g.k1.requer||[]).includes(k.chave));
    const minimo = req.length ? Math.max(...req.map(k => k.bims[k.bims.length-1])) : 1;
    const possivel = alvo < atual ? Math.max(alvo, minimo) : alvo;
    if(possivel === atual) return;
    const ganha = g.alvos.filter(b => b===possivel).length;
    if(!ganha || g.juntos >= ganha) return;   // não troca temas que já coincidem por outros
    out.push({ ...g, alvo, atual, possivel, minimo, req, n: g.temas.size, ganha });
  });
  return out.sort((a, b) => b.ganha - a.ganha || b.n - a.n).slice(0, 6);
}
function renderAreaBimestre(){
  const s = planoState(); const A = areaState();
  if(!s.carregado || !A.dados){ if(!A.carregando) setTimeout(() => areaCarregar(), 0); return '<h2>🧭 Visão da área por bimestre</h2><div class="card"><p class="muted">Carregando os planos das disciplinas…</p></div>'; }
  const todasD = planoDiscsDisponiveis(); const areaId = areaAtualId(todasD);
  const areaInfo = AREAS_CONHEC.find(x => x.id===areaId) || { nome:'da área' };
  const areasCom = AREAS_CONHEC.filter(a => todasD.some(d => areaConhecDe(d.k)===a.id));
  const areaBtns = areasCom.length > 1 ? `<div class="pl-turmas" data-area-areas style="margin-bottom:6px;">${areasCom.map(a => `<button class="pl-turma ${a.id===areaId?'ativa':''}" data-action="area-area" data-a="${a.id}">${esc(a.nome)}</button>`).join('')}</div>` : '';
  const discs = todasD.filter(d => areaConhecDe(d.k)===areaId);
  if(discs.length < 2) return `<h2>🧭 Visão da área por bimestre</h2>${areaBtns}<div class="card"><p>Esta visão compara as disciplinas da área. Até agora só há plano de <strong>${esc((discs[0]||{}).label||'nenhuma disciplina')}</strong>.</p><p class="muted">Importe o plano de outra disciplina de ${esc(areaInfo.nome)} (em 🗓️ Plano de aulas do livro) para ver os temas em comum.</p></div>`;
  const lista = (A.dados[A.serie] || []).filter(x => areaConhecDe(x.disc)===areaId);
  const serieBtns = ['1','2','3'].map(x => `<button class="pl-turma ${x===A.serie?'ativa':''}" data-action="area-serie" data-s="${x}">${x}ª série</button>`).join('');
  const pares = areaPares(lista);
  const junto = b => pares.filter(p => p.a.bimestre===b && p.b.bimestre===b);
  const caps = {}; lista.forEach(x => caps[x.disc] = areaCapsDoPlano(x.plano));
  const cor = i => ['#6B1F2E', '#1F4E79', '#7a5b00', '#1d6b31'][i % 4];
  // mapa do ano
  const mapa = `<div style="overflow-x:auto;"><table class="area-mapa" data-area-mapa style="width:100%; border-collapse:collapse; font-size:.85rem;">
    <thead><tr><th style="text-align:left; padding:6px; width:110px;">Bimestre</th>${lista.map((x, i) => `<th style="text-align:left; padding:6px; color:${cor(i)};">${conexIcone(x.label)} ${esc(x.label)} <span class="muted" style="font-weight:400; font-size:.75rem;">${esc(x.plano.titulo||'')}</span></th>`).join('')}</tr></thead>
    <tbody>${[1,2,3,4].map(b => { const j = junto(b).length; return `<tr data-area-bim="${b}" data-action="area-bim" data-b="${b}" style="cursor:pointer; border-top:1px solid #e6dcc8; ${b===A.bim ? 'background:#fbf3df;' : ''}">
      <td style="padding:6px; vertical-align:top;"><strong>${b}º</strong>${j ? `<br><span style="font-size:.72rem; color:#1d6b31; font-weight:700;">🔗 ${j} tema${j>1?'s':''} em comum</span>` : ''}</td>
      ${lista.map(x => { const cs = (caps[x.disc]||[]).filter(k => k.aulas.some(a => a.bimestre===b));
        const extra = (x.plano.aulas||[]).filter(a => a.bimestre===b && !(a.slides && a.slides.capitulo) && !a.capitulo && a.tipo!=='Revisão' && a.tipo!=='Avaliação').length;
        const enem = !cs.length && (x.plano.aulas||[]).some(a => a.bimestre===b && a.tipo==='ENEM');
        return `<td style="padding:6px; vertical-align:top;">${cs.map(k => `<div style="margin:2px 0;">${esc(k.cap.replace(/^Capítulo (\d+) — /, 'Cap. $1 — '))} ${areaTipoChip(k.tipo)}</div>`).join('') || (enem ? '<span class="muted">Revisão para o ENEM</span>' : extra ? '<span class="muted">aulas de revisão e projeto</span>' : '<span class="muted">—</span>')}</td>`; }).join('')}
    </tr>`; }).join('')}</tbody></table></div>`;
  // detalhe do bimestre
  const b = A.bim; const jb = junto(b);
  const marcadas = new Set(jb.flatMap(p => [p.x.plano.id + ':' + p.a.n, p.y.plano.id + ':' + p.b.n]));
  const detalhe = `<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:12px;">${lista.map((x, i) => {
      const cs = (caps[x.disc]||[]).filter(k => k.aulas.some(a => a.bimestre===b));
      const aulasB = (x.plano.aulas||[]).filter(a => a.bimestre===b);
      return `<div data-area-disc="${esc(x.disc)}" style="border:1px solid #e6dcc8; border-radius:10px; padding:10px;">
        <strong style="color:${cor(i)};">${conexIcone(x.label)} ${esc(x.label)}</strong> <span class="muted" style="font-size:.78rem;">· aulas ${aulasB.length ? aulasB[0].n + ' a ' + aulasB[aulasB.length-1].n : '—'}</span>
        ${cs.map(k => `<div style="margin-top:8px;"><div style="font-weight:600; font-size:.88rem;">${esc(k.cap)} ${areaTipoChip(k.tipo)}</div>
          ${k.motivo ? `<div class="muted" style="font-size:.76rem;">${esc(k.motivo)}</div>` : ''}
          <ul style="margin:4px 0 0; padding-left:18px; font-size:.82rem;">${k.aulas.filter(a => a.bimestre===b).map(a => `<li style="${marcadas.has(x.plano.id + ':' + a.n) ? 'font-weight:700; color:#1d6b31;' : ''}">${a.n}. ${esc(a.tituloCurto||a.tema)}${marcadas.has(x.plano.id + ':' + a.n) ? ' 🔗' : ''}</li>`).join('')}</ul></div>`).join('') || `<p class="muted" style="font-size:.85rem;">${aulasB.some(a => a.tipo==='ENEM') ? 'Revisão para o ENEM, simulados e projeto final.' : 'Sem capítulos do livro neste bimestre.'}</p>`}
      </div>`; }).join('')}</div>`;
  const comuns = jb.length ? `<ul data-area-comuns style="margin:6px 0 0; padding-left:18px; font-size:.88rem;">${jb.map(p => `<li style="margin:4px 0;"><strong>${esc(p.tema)}</strong><br><span class="muted">${conexIcone(p.x.label)} ${esc(p.x.label)}, aula ${p.a.n}: ${esc(p.a.tituloCurto||p.a.tema)} &nbsp;↔&nbsp; ${conexIcone(p.y.label)} ${esc(p.y.label)}, aula ${p.b.n}: ${esc(p.b.tituloCurto||p.b.tema)}</span></li>`).join('')}</ul>`
    : '<p class="muted" style="font-size:.88rem;">Nenhum tema em comum cai neste bimestre nas duas disciplinas ao mesmo tempo. Veja abaixo as conexões com outros bimestres.</p>';
  const outros = pares.filter(p => (p.a.bimestre===b) !== (p.b.bimestre===b) && (p.a.bimestre===b || p.b.bimestre===b));
  const outrosHtml = outros.length ? `<details style="margin-top:8px;"><summary style="cursor:pointer; font-size:.88rem;">🔁 ${outros.length} tema${outros.length>1?'s':''} deste bimestre que a outra disciplina trabalha em outro bimestre</summary><ul style="margin:6px 0 0; padding-left:18px; font-size:.84rem;">${outros.map(p => { const [u, ua, v, va] = p.a.bimestre===b ? [p.x, p.a, p.y, p.b] : [p.y, p.b, p.x, p.a]; return `<li style="margin:3px 0;"><strong>${esc(p.tema)}</strong> — ${esc(u.label)} aula ${ua.n} (${b}º bim) · ${esc(v.label)} aula ${va.n} (${va.bimestre}º bim)</li>`; }).join('')}</ul></details>` : '';
  // sugestões
  const sug = areaSugestoes(lista);
  const sugHtml = sug.length ? `<ol data-area-sugestoes style="margin:6px 0 0; padding-left:20px; font-size:.88rem; line-height:1.45;">${sug.map(g => `<li style="margin:6px 0;"><strong>${esc(g.x.label)} — ${esc(g.k1.cap)}</strong> ${areaTipoChip('independente')} está no ${g.atual}º bimestre e tem <strong>${g.n} tema${g.n>1?'s':''} em comum</strong> com ${esc(g.y.label)} (${[...g.parceiros].map(c => esc(c.split(' — ')[0])).join(', ')}) trabalhados em outro bimestre.
      ${g.possivel===g.alvo ? `Passar o capítulo para o <strong>${g.possivel}º bimestre</strong> faria ${g.ganha} desses temas coincidirem.` : `O mais perto possível é o <strong>${g.possivel}º bimestre</strong> (ele requer antes ${g.req.map(k => esc(k.chave)).join(', ')}, que vai até o ${g.minimo}º bimestre): ${g.ganha} tema${g.ganha>1?'s':''} passaria${g.ganha>1?'m':''} a coincidir.`}${g.juntos ? ` Hoje ele já coincide em ${g.juntos} tema${g.juntos>1?'s':''} no ${g.atual}º bimestre, que deixaria${g.juntos>1?'m':''} de coincidir.` : ''}
      <br><span class="muted" style="font-size:.8rem;">Temas: ${[...g.temas].slice(0, 4).map(esc).join('; ')}${g.temas.size>4?'…':''}. Mover um capítulo desloca outros — confira com os professores como fica a distribuição das aulas.</span></li>`).join('')}</ol>`
    : '<p class="muted" style="font-size:.88rem;">Nenhuma sugestão: nesta série os temas em comum já caem em bimestres próximos ou dependem de capítulos-base.</p>';
  return `<h2>🧭 Visão da área por bimestre</h2>
    ${areaBtns}<p class="muted" style="margin-top:-6px;">${esc(areaInfo.nome)}: o que cada disciplina trabalha em cada bimestre e os temas que se cruzam. A ordem dos livros continua valendo — esta tela ajuda a combinar atividades entre professores e a decidir, com os dados na mão, se vale a pena mover algum capítulo independente.</p>
    <div class="card"><div class="pl-turmas" data-area-series>${serieBtns}</div>
      <p class="muted" style="font-size:.8rem; margin:6px 0 4px;">Planos usados: ${lista.map(x => `${esc(x.plano.titulo)}`).join(' · ')} (a versão padrão de cada série). <span>🔒 base = outros capítulos dependem dele · 🔀 independente = pode mudar de bimestre.</span> Toque num bimestre para ver os detalhes.</p>
      ${mapa}</div>
    <div class="card" data-area-detalhe><h3 style="margin-top:0;">${A.serie}ª série · ${b}º bimestre</h3>
      <h4 style="margin:6px 0 2px;">🔗 Temas em comum neste bimestre (${jb.length})</h4>${comuns}${outrosHtml}
      <h4 style="margin:14px 0 6px;">O que cada disciplina trabalha</h4>${detalhe}</div>
    <div class="card" data-area-sug><h3 style="margin-top:0;">💡 Sugestões de ajuste (opcionais) — ${A.serie}ª série</h3>
      <p class="muted" style="font-size:.84rem; margin-top:0;">Só capítulos independentes aparecem aqui, respeitando o que cada um precisa ter visto antes. Nada muda sozinho: a decisão é da coordenação com os professores.</p>${sugHtml}</div>`;
}
function renderLivrosDidaticos(canUpload){
  const p = state.professor;
  if(p.livrosLoading){
    return `<div class="card"><h2>Livros Didáticos</h2><div class="spinner"></div></div>`;
  }
  const areas = [...new Set(p.livros.map(l=>l.area))];
  const body = areas.map(area => `
    <h3 style="margin-top:22px;">${esc(area)}</h3>
    ${p.livros.filter(l=>l.area===area).map(l => {
      const embedUrl = driveEmbedUrl(l.downloadUrl);
      return `
      <div class="list-item" style="align-items:flex-start; flex-wrap:wrap;">
        <div>
          <strong>${esc(l.componente)}</strong><br>
          <span class="muted">${esc(l.colecao)}</span>
          ${canUpload && l.editingLink ? `
            <div style="margin-top:8px; max-width:420px;">
              <input type="text" id="livro-link-input-${l.id}" placeholder="Cole aqui o link de compartilhamento do Google Drive" value="${l.downloadUrl?esc(l.downloadUrl):''}">
              <div class="row" style="margin-top:6px;">
                <button class="btn btn-primary btn-sm" data-action="save-livro-link" data-id="${l.id}">Salvar link</button>
                <button class="btn btn-ghost btn-sm" data-action="cancel-livro-link" data-id="${l.id}">Cancelar</button>
              </div>
            </div>
          ` : ''}
          ${l.downloadUrl && !embedUrl && !l.editingLink ? '<p class="err" style="font-size:.78rem; margin-top:6px;">Esse link não parece ser do Google Drive — pode baixar em vez de abrir na tela.</p>' : ''}
        </div>
        <div class="row" style="flex:0 0 auto; gap:8px; align-items:center;">
          ${(l.downloadUrl && !l.editingLink) ? `<button class="btn btn-primary btn-sm" data-action="toggle-livro-view" data-id="${l.id}">${l.viewing?'Fechar livro':'Abrir livro'}</button><a href="${l.downloadUrl}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Abrir no Drive (copiar texto)</a>` : (!canUpload && !l.downloadUrl ? '<span class="muted">Ainda não disponível</span>' : '')}
          ${canUpload && !l.editingLink ? `
            ${l.downloadUrl ? `<button class="btn btn-danger btn-sm" data-action="remove-livro-file" data-id="${l.id}">Remover</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-action="edit-livro-link" data-id="${l.id}">${l.downloadUrl?'Trocar link':'Colar link'}</button>
          ` : ''}
        </div>
        ${l.viewing && embedUrl ? `
          <div style="width:100%; margin-top:10px;">
            <iframe src="${embedUrl}" style="width:100%; height:70vh; border:1px solid var(--paper-line); border-radius:8px;" allow="autoplay"></iframe>
          </div>
        ` : ''}
      </div>
    `}).join('')}
  `).join('');
  return `
    <div class="card">
      <h2>Livros Didáticos</h2>
      <p class="muted">${canUpload ? 'Suba o PDF de cada livro no Google Drive (compartilhamento "qualquer pessoa com o link"), copie o link e cole aqui. Professores e alunos abrem o livro direto na tela, sem precisar enviar nada.' : 'Livros didáticos disponibilizados pela coordenação.'}</p>
      ${body}
    </div>
  `;
}
function dismissDiarioHoje(){
  try{ localStorage.setItem('sala-diario-dismiss', new Date().toISOString().slice(0,10)); }catch(e){}
  render();
}
function renderNewAssessment(){
  const p = state.professor;
  const a = p.newAssessment;
  const qHtml = a.questions.map((q,idx) => renderQuestionEditor(q, idx, !pnpTravada(a, idx))).join('');
  const minhasTurmasNovaAval = professorTurmas();
  const turmaOptions = minhasTurmasNovaAval.map(t => `
    <label class="picker-item">
      <input type="checkbox" data-action="toggle-assessment-turma" data-tid="${t.id}" ${(a.turmaIds||[]).includes(t.id)?'checked':''}>
      <span>${esc(t.name)} (${t.students.length} alunos)</span>
    </label>
  `).join('');
  const disciplinaOptions = p.disciplinas.map(d => `<option value="${d.id}" ${a.disciplinaId===d.id?'selected':''}>${esc(d.name)}</option>`).join('');
  const picker = p.pickerOpen ? `
    <div class="picker">
      ${p.bank.length===0 ? '<p class="muted" style="margin:0;">Seu banco de questões está vazio ainda.</p>' : bankAgruparPorDisciplina(p.bank, a.disciplinaId).map(g => `
        <p style="margin:10px 0 2px; font-weight:700;">📚 ${esc(g.nome)}</p>
        ${g.questoes.map(q => `
        <label class="picker-item">
          <input type="checkbox" data-action="toggle-picker" data-qid="${q.id}" ${p.pickerSelected.includes(q.id)?'checked':''}>
          <span><strong>${questionTagLabel(q.type)}</strong> · ${esc(q.text).slice(0,70)}${q.text.length>70?'…':''}</span>
        </label>`).join('')}
      `).join('')}
      <div class="row" style="margin-top:10px;">
        <button class="btn btn-ghost btn-sm" data-action="close-picker">Cancelar</button>
        <button class="btn btn-primary btn-sm" data-action="add-from-picker">Adicionar selecionadas</button>
      </div>
    </div>
  ` : '';
  return `
    <div class="card">
      <h2>${p.editingCode ? 'Editar avaliação' : 'Nova avaliação'}</h2>
      ${p.editingCode && p.editingResponseCount>0 ? `<p class="err">⚠ ${p.editingResponseCount} aluno(s) já responderam esta avaliação. Mudar questões ou gabarito não recalcula notas já enviadas — confira os resultados depois de salvar.</p>` : ''}
      <label>Instrumento avaliativo</label>
      <select id="instrumento-select" data-action="set-instrumento">
        ${INSTRUMENTOS.map(i => `<option value="${i.key}" ${a.instrumento===i.key?'selected':''}>${esc(i.label)}</option>`).join('')}
      </select>
      <label>Unidade / Bimestre</label>
      <select id="unidade-select" data-action="set-unidade">
        <option value="">Selecione...</option>
        ${UNIDADES.map(u => `<option value="${esc(u)}" ${a.unidade===u?'selected':''}>${esc(u)}</option>`).join('')}
      </select>
      <p class="muted" style="font-size:.85rem;">Título gerado: <strong>${esc(computeAssessmentTitle(a))}</strong></p>
      <label>Disciplina</label>
      <select id="disciplina-select" data-action="set-disciplina">
        <option value="">Nenhuma disciplina vinculada</option>
        ${disciplinaOptions}
      </select>
      ${p.disciplinas.length===0 ? '<p class="muted" style="font-size:.82rem; margin-top:4px;">Nenhuma disciplina cadastrada ainda — cadastre na aba "Disciplinas".</p>' : ''}
      <label>Turmas (opcional — marque quantas quiser)</label>
      ${minhasTurmasNovaAval.length===0 ? '<p class="muted" style="font-size:.82rem;">Nenhuma turma vinculada a uma disciplina sua ainda — vá em "Disciplinas" e marque em quais turmas você leciona.</p>' : `<div class="picker" style="margin-top:0;">${turmaOptions}</div>`}
      ${a.instrumento==='recuperacao' ? `
        <p class="muted" style="font-size:.85rem;">Esta avaliação substitui a Avaliação Mensal/Bimestral (NP1) na nota final apenas para os alunos que a responderem. Quem não fizer continua com o NP1 normal.</p>
      ` : ''}
      ${a.instrumento==='avaliacao' ? `
        <label style="margin-top:14px;">Tempo mínimo por questão (minutos)</label>
        <input type="number" id="min-minutes-input" min="0" max="60" step="0.5" value="${esc(String(a.minMinutesPerQuestion!=null ? a.minMinutesPerQuestion : MIN_MINUTES_DEFAULT))}" style="max-width:140px;">
        <p class="muted" style="font-size:.8rem;">Tempo que o aluno precisa permanecer em cada questão antes de poder avançar. Padrão: 3 minutos. Use 0 para não exigir tempo mínimo.</p>
      ` : ''}
      ${(a.instrumento!=='avaliacao' && a.instrumento!=='recuperacao') ? `
        <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:400; margin-top:14px;">
          <input type="checkbox" data-action="toggle-security-enabled" ${a.securityEnabled?'checked':''} style="width:auto;">
          Aplicar segurança de prova (tela cheia obrigatória e bloqueio ao trocar de tela)
        </label>
        <p class="muted" style="font-size:.8rem;">Desmarque para exercícios de fixação, diagnósticas ou autoavaliações que o aluno pode responder tranquilamente, sem trava de tela.</p>
      ` : ''}
      ${apAvisoForm()}
      <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:400; margin-top:14px;">
        <input type="checkbox" data-action="toggle-exige-liberacao" ${a.exigeLiberacao?'checked':''} style="width:auto;">
        Só iniciar quando o professor liberar (apenas alunos presentes na sala)
      </label>
      ${a.exigeLiberacao ? '<p style="font-size:.82rem; margin:4px 0 0; color:#b3261e;">⚠ Com esta opção marcada, <strong>nenhum aluno consegue responder</strong> até você abrir "🚪 Liberar turma" na lista de avaliações e liberar os alunos.</p>' : ''}
      <p class="muted" style="font-size:.8rem;">Antes da prova, você abre "Liberar turma" na lista de avaliações, confere a chamada de hoje e libera só quem está na sala. Funciona quando a avaliação está vinculada a uma turma.</p>
      <label>Janela de aplicação (opcional)</label>
      <div class="row">
        <div>
          <input type="datetime-local" id="start-input" value="${esc(a.startAt)}">
          <p class="muted" style="font-size:.78rem; margin-top:4px;">Início</p>
        </div>
        <div>
          <input type="datetime-local" id="end-input" value="${esc(a.endAt)}">
          <p class="muted" style="font-size:.78rem; margin-top:4px;">Término</p>
        </div>
      </div>
      <p class="muted" style="font-size:.82rem;">Deixe em branco para permitir respostas a qualquer momento. Se preenchido, o aluno só consegue responder dentro desse horário — ideal para aplicar em tablet ou celular com prazo controlado.</p>
      ${(a.turmaIds||[]).length>0 ? `
        <label style="margin-top:10px;">Horário por turma (opcional)</label>
        <p class="muted" style="font-size:.82rem; margin-top:0;">Use a mesma prova em momentos diferentes. Campo em branco usa o horário geral acima.</p>
        ${a.turmaIds.map(tid => { const t = p.turmas.find(x=>x.id===tid); const ag = (a.agendaTurmas||{})[tid]||{}; return `
          <div class="card" style="padding:10px 12px; margin:6px 0;">
            <strong>${esc(t?t.name:tid)}</strong>
            <div class="row" style="margin-top:6px;">
              <div><input type="datetime-local" class="agenda-turma-input" data-tid="${tid}" data-campo="startAt" value="${esc(ag.startAt||'')}"><p class="muted" style="font-size:.78rem; margin-top:4px;">Início</p></div>
              <div><input type="datetime-local" class="agenda-turma-input" data-tid="${tid}" data-campo="endAt" value="${esc(ag.endAt||'')}"><p class="muted" style="font-size:.78rem; margin-top:4px;">Término</p></div>
            </div>
          </div>`; }).join('')}
      ` : ''}
      <label>Liberação do resultado corrigido para o aluno</label>
      <div>
        <label style="display:flex;align-items:center;gap:6px;font-weight:400;text-transform:none;margin:6px 0;">
          <input type="radio" name="release-mode" data-action="set-release-mode" data-mode="imediato" ${a.resultRelease.mode==='imediato'?'checked':''}> Assim que o aluno enviar a prova
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-weight:400;text-transform:none;margin:6px 0;">
          <input type="radio" name="release-mode" data-action="set-release-mode" data-mode="agendado" ${a.resultRelease.mode==='agendado'?'checked':''}> Em um horário programado
        </label>
        ${a.resultRelease.mode==='agendado' ? `<input type="datetime-local" id="release-at-input" value="${esc(a.resultRelease.releaseAt)}" style="margin:4px 0 8px 26px; max-width:260px;">` : ''}
        <label style="display:flex;align-items:center;gap:6px;font-weight:400;text-transform:none;margin:6px 0;">
          <input type="radio" name="release-mode" data-action="set-release-mode" data-mode="nunca" ${a.resultRelease.mode==='nunca'?'checked':''}> Não liberar (só o professor vê o resultado)
        </label>
      </div>
      <p class="muted" style="font-size:.82rem;">Em qualquer opção, a prova já é corrigida automaticamente no envio — isso só controla quando o aluno enxerga a nota e o gabarito.</p>
      ${pnpNp1Box(a)}
      <div style="margin-top:18px;">${qHtml || '<p class="muted">Ainda não há questões. Adicione abaixo.</p>'}</div>
      <div class="row" style="margin-top:6px;">
        <button class="btn btn-ghost" data-action="add-question" data-qtype="mc">+ Múltipla escolha</button>
        <button class="btn btn-ghost" data-action="add-question" data-qtype="vf">+ Verdadeiro/Falso</button>
        <button class="btn btn-ghost" data-action="add-question" data-qtype="dissertativa">+ Dissertativa</button>
        <button class="btn btn-ghost" data-action="open-picker">+ Do banco de questões</button>
      </div>
      ${picker}
      <div id="new-err"></div>
      <div class="row" style="margin-top:20px;">
        <button class="btn btn-ghost" data-action="cancel-new">Cancelar</button>
        <button class="btn btn-primary" data-action="save-assessment">${p.editingCode ? 'Salvar alterações' : 'Salvar e gerar código'}</button>
      </div>
    </div>
  `;
}
function renderQuestionEditor(q, idx, showRemove){
  const tagLabel = questionTagLabel(q.type);
  let extra = '';
  if(q.type==='mc'){
    extra = q.options.map((o,i) => `
      <div class="opt-row">
        <input type="radio" name="correct-${q.id}" data-action="set-correct-mc" data-qid="${q.id}" data-oid="${o.id}" ${q.correctOptionId===o.id?'checked':''}>
        <input type="text" data-action="opt-text" data-qid="${q.id}" data-oid="${o.id}" value="${esc(o.text)}" placeholder="Alternativa ${i+1}">
        ${q.options.length>2 ? `<button class="btn btn-danger btn-sm" data-action="remove-opt" data-qid="${q.id}" data-oid="${o.id}">✕</button>` : ''}
      </div>
    `).join('') + `<button class="btn btn-ghost btn-sm" data-action="add-opt" data-qid="${q.id}" style="margin-top:4px;">+ alternativa</button>
    <p class="muted" style="font-size:.8rem;">Marque a bolinha da alternativa correta.</p>`;
  } else if(q.type==='vf'){
    extra = `
      <div class="row" style="max-width:260px;">
        <label style="display:flex;align-items:center;gap:6px;font-weight:400;text-transform:none;">
          <input type="radio" name="vf-${q.id}" data-action="set-vf" data-qid="${q.id}" data-val="true" ${q.correctBool===true?'checked':''}> Verdadeiro
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-weight:400;text-transform:none;">
          <input type="radio" name="vf-${q.id}" data-action="set-vf" data-qid="${q.id}" data-val="false" ${q.correctBool===false?'checked':''}> Falso
        </label>
      </div>
    `;
  } else {
    extra = `
      <label>Resposta modelo (usada como referência na correção automática)</label>
      <textarea data-action="model-answer" data-qid="${q.id}" placeholder="O que se espera na resposta...">${esc(q.modelAnswer)}</textarea>
    `;
  }
  const imageBlock = q.image ? `
    <div class="img-preview">
      <img src="${q.image}" alt="Imagem da questão">
      <button class="btn btn-ghost btn-sm" data-action="remove-question-image" data-qid="${q.id}" style="margin-top:6px;">Remover imagem</button>
    </div>
  ` : `
    <label>Imagem (opcional)</label>
    <input type="file" accept="image/*" data-action="upload-question-image" data-qid="${q.id}">
    <div class="row" style="margin-top:6px;">
      <input type="text" id="img-url-${q.id}" placeholder="ou cole o link de uma imagem (https://...)">
      <button class="btn btn-ghost btn-sm" data-action="use-image-url" data-qid="${q.id}" style="flex:0 0 auto;">Usar link</button>
    </div>
  `;
  return `
    <div class="q-card">
      <div class="q-head">
        <span class="q-tag">${idx+1}. ${tagLabel}</span>
        <div class="row" style="flex:0 0 auto; gap:6px; align-items:center;">
          <input type="number" min="0.5" step="0.5" data-action="q-points" data-qid="${q.id}" value="${q.points}" style="width:64px; padding:5px;" title="Pontos">
          ${showRemove ? `<button class="btn btn-ghost btn-sm" data-action="save-to-bank" data-qid="${q.id}" title="Salvar no banco de questões">💾</button>` : ''}
          ${showRemove ? `<button class="btn btn-danger btn-sm" data-action="remove-question" data-qid="${q.id}">✕</button>` : ''}
        </div>
      </div>
      <textarea data-action="q-text" data-qid="${q.id}" placeholder="Enunciado da questão">${esc(q.text)}</textarea>
      ${q.comando!=null ? `<label style="font-size:.8rem; margin-top:4px;">Comando (aparece depois da imagem)</label><textarea data-action="q-comando" data-qid="${q.id}" placeholder="Comando da questão">${esc(q.comando)}</textarea>` : ''}
      <div class="row">
        <input type="text" data-action="q-descritor" data-qid="${q.id}" value="${esc(q.descritorSaeb||'')}" placeholder="Descritor SAEB (ex: D19)">
        <input type="text" data-action="q-conteudo" data-qid="${q.id}" value="${esc(q.conteudo||'')}" placeholder="Conteúdo (ex: Frações)">
      </div>
      ${imageBlock}
      ${extra}
    </div>
  `;
}
function iaCorrState(){
  const p = state.professor; const code = p.resultsFor ? p.resultsFor.code : '';
  if(!p.iaCorr || p.iaCorr.code !== code) p.iaCorr = { code, carregando:false, progresso:'', erro:'', sug:{} };
  return p.iaCorr;
}
function iaCorrChave(r, qid){ return `${r.studentName}::${r.submittedAt}::${qid}`; }
function iaPromptDissertativa(q, resposta){
  return `Você é um professor do Ensino Médio corrigindo uma questão dissertativa de um aluno brasileiro.
Questão: ${q.text}
Resposta esperada (modelo do professor): ${q.modelAnswer || '(não informada — use seu conhecimento do conteúdo)'}
Valor da questão: ${q.points} pontos.
Resposta do aluno: ${resposta}

Dê uma nota de 0 a ${q.points}, em passos de 0,5. Avalie se as ideias principais da resposta esperada aparecem, mesmo com outras palavras. Não desconte por ortografia. Resposta pessoal coerente com o tema vale ponto. Resposta em branco, sem sentido ou fora do tema vale 0.
Responda SOMENTE com JSON: {"nota": número, "comentario": "uma ou duas frases curtas para o aluno, em português, dizendo o que acertou e o que faltou, de forma encorajadora"}`;
}
function iaArredondaNota(n, max){ n = Math.round(Number(n)*2)/2; if(isNaN(n)) return null; return Math.max(0, Math.min(max, n)); }
async function iaSugerirDissertativas(somenteIdx){
  const p = state.professor; const a = p.resultsFor; const st = iaCorrState();
  if(st.carregando) return;
  guardarRascunhoCorrecao();
  const tarefas = [];
  p.responses.forEach((r, idx) => {
    if(somenteIdx!=null && idx!==somenteIdx) return;
    (r.details||[]).forEach(d => {
      if(!d.pending) return;
      const q = a.questions.find(x=>x.id===d.questionId);
      if(!q || q.type!=='dissertativa' || q.mapaCaderno) return;
      const chave = iaCorrChave(r, q.id);
      if(st.sug[chave] && st.sug[chave].nota!=null) return;
      tarefas.push({ r, q, chave });
    });
  });
  if(!tarefas.length){ st.erro = 'Não há dissertativas pendentes sem sugestão.'; render(); return; }
  st.carregando = true; st.erro = '';
  for(let i=0; i<tarefas.length; i++){
    const { r, q, chave } = tarefas[i];
    st.progresso = `Analisando ${i+1} de ${tarefas.length}…`; render();
    const resposta = String(r.answers[q.id]||'').trim();
    if(!resposta){ st.sug[chave] = { nota:0, comentario:'Resposta em branco.' }; continue; }
    try{
      const out = await callGeminiJSON(iaPromptDissertativa(q, resposta), p.myIaKey || null);
      const nota = iaArredondaNota(out && out.nota, q.points);
      st.sug[chave] = nota==null ? { erro:'resposta inesperada da IA' } : { nota, comentario: String((out && out.comentario)||'').slice(0,400) };
    }catch(e){
      st.sug[chave] = { erro: iaErrorMessage(e) };
      if(['IA_NAO_CONFIGURADA','IA_CHAVE_INVALIDA'].includes(e.message)){ st.erro = iaErrorMessage(e); break; }
    }
  }
  st.carregando = false; st.progresso = '';
  render();
}
function guardarRascunhoCorrecao(){
  const p = state.professor; if(p.correctingResponseIdx==null) return;
  const r = p.responses[p.correctingResponseIdx]; if(!r) return;
  p.correcaoRascunho = p.correcaoRascunho || {};
  r.details.forEach((d, di) => {
    const el = document.getElementById(`correct-score-${p.correctingResponseIdx}-${di}`);
    if(el && el.value!=='') p.correcaoRascunho[iaCorrChave(r, d.questionId)] = el.value;
  });
}
async function iaAceitarTodasSugestoes(){
  const p = state.professor; const a = p.resultsFor; const st = iaCorrState();
  let n = 0, alunos = 0;
  p.responses.forEach(r => {
    let mexeu = false;
    (r.details||[]).forEach(d => {
      if(!d.pending) return;
      const sg = st.sug[iaCorrChave(r, d.questionId)];
      if(!sg || sg.nota==null) return;
      d.score = sg.nota; d.pending = false;
      d.feedback = (sg.comentario ? sg.comentario + ' ' : '') + '(Correção sugerida pela IA e revisada pelo professor.)';
      n++; mexeu = true;
    });
    if(mexeu){ r.total = r.details.reduce((s,d)=>s+(d.score||0),0); if(!r.details.some(d=>d.pending)) alunos++; }
  });
  if(!n){ alert('Não há sugestões para aplicar.'); return; }
  if(!confirm(`Lançar ${n} nota(s) sugerida(s) pela IA? Confira a tabela antes — depois ainda dá para corrigir uma a uma lançando a nota manualmente.`)) return;
  await window.storage.set(`responses:${a.code}`, JSON.stringify(p.responses), true);
  p.correcoesPendentesCount = Math.max(0, (p.correcoesPendentesCount||0) - alunos);
  p.correctingResponseIdx = null;
  render();
}
function renderIaCorrecaoCard(a, responses){
  const pend = [];
  responses.forEach((r, idx) => (r.details||[]).forEach(d => {
    if(!d.pending) return; const q = a.questions.find(x=>x.id===d.questionId);
    if(q && q.type==='dissertativa' && !q.mapaCaderno) pend.push({ r, idx, q });
  }));
  if(!pend.length) return '';
  const st = iaCorrState();
  const comSug = pend.filter(x => { const sg = st.sug[iaCorrChave(x.r, x.q.id)]; return sg && sg.nota!=null; });
  return `
    <div class="card" data-ia-correcao style="background:#f4f0fb; border:1px solid #cdbfe8; margin-top:16px;">
      <h3 style="margin-top:0;">🤖 Correção das dissertativas com apoio da IA</h3>
      <p class="muted" style="font-size:.86rem; margin-top:0;">${pend.length} resposta(s) dissertativa(s) esperando correção. A IA compara cada resposta com a resposta-modelo e sugere nota e comentário. <strong>Nada é lançado sem você conferir e confirmar.</strong></p>
      ${st.erro ? `<p class="err">${esc(st.erro)}</p>` : ''}
      ${st.carregando ? `<p>⏳ ${esc(st.progresso)}</p>` : `<button class="btn btn-primary btn-sm" data-action="ia-sugerir-todas">🤖 Sugerir notas para todas as pendentes</button>`}
      ${comSug.length ? `
        <div class="table-scroll" style="margin-top:10px;"><table>
          <tr><th>Aluno</th><th>Resposta</th><th>Nota sugerida</th><th>Comentário para o aluno</th></tr>
          ${comSug.map(x => { const sg = st.sug[iaCorrChave(x.r, x.q.id)]; return `<tr>
            <td>${esc(x.r.studentName)}</td>
            <td style="font-size:.85rem; max-width:320px;">${esc(String(x.r.answers[x.q.id]||'(em branco)'))}</td>
            <td><strong>${String(sg.nota).replace('.',',')}</strong> / ${x.q.points}</td>
            <td style="font-size:.85rem;">${esc(sg.comentario||'')}</td></tr>`; }).join('')}
        </table></div>
        <div class="row" style="margin-top:10px; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" data-action="ia-aceitar-todas">✅ Conferi — lançar as ${comSug.length} nota(s)</button>
          <span class="muted" style="font-size:.82rem;">Discorda de alguma? Clique em "Corrigir" no aluno e mude a nota antes.</span>
        </div>` : ''}
    </div>`;
}
function renderCorrectResponsePanel(a, r, idx){
  const pendingDetails = r.details.map((d,di) => ({...d, di})).filter(d=>d.pending);
  return `
    <tr><td colspan="5">
      <div class="q-card" style="background:var(--accent-yellow-bg,#fdf3e8);">
        <strong>Corrigir dissertativas de ${esc(r.studentName)}</strong>
        ${pendingDetails.map(d => {
          const q = a.questions.find(x=>x.id===d.questionId);
          if(!q) return '';
          return `
            <div style="margin-top:10px;">
              <p style="margin:0 0 4px;"><strong>${esc(q.text)}${q.comando?' '+esc(q.comando):''}</strong></p>
              <p class="muted" style="margin:0 0 6px;">Resposta do aluno: ${esc(r.answers[q.id]||'(em branco)')}</p>
              ${q.modelAnswer ? `<p style="margin:0 0 6px; font-size:.85rem;">📖 <strong>Resposta esperada:</strong> ${esc(q.modelAnswer)}</p>` : ''}
              ${(() => { const st = iaCorrState(); const ch = iaCorrChave(r, q.id); const sg = st.sug[ch]; const rasc = (state.professor.correcaoRascunho||{})[ch];
                 const val = rasc!=null ? rasc : (sg && sg.nota!=null ? sg.nota : '');
                 return `<div class="row" style="gap:8px; align-items:center; flex-wrap:wrap;">
                   <input type="number" min="0" max="${q.points}" step="0.5" id="correct-score-${idx}-${d.di}" value="${val}" placeholder="Nota (0 a ${q.points})" style="max-width:160px;">
                   ${st.carregando ? '<span class="muted">⏳ IA analisando…</span>' : `<button class="btn btn-ghost btn-sm" data-action="ia-sugerir-resposta" data-idx="${idx}">🤖 Sugerir nota com IA</button>`}
                 </div>
                 ${sg && sg.nota!=null ? `<p style="margin:4px 0 0; font-size:.85rem; background:#f4f0fb; border-radius:6px; padding:6px 8px;">🤖 Sugestão: <strong>${String(sg.nota).replace('.',',')}</strong> — ${esc(sg.comentario||'')}</p>` : ''}
                 ${sg && sg.erro ? `<p class="err" style="margin:4px 0 0;">${esc(sg.erro)}</p>` : ''}`; })()}
            </div>
          `;
        }).join('')}
        <div class="row" style="margin-top:12px;">
          <button class="btn btn-ghost btn-sm" data-action="close-correct-response">Cancelar</button>
          <button class="btn btn-primary btn-sm" data-action="save-correct-response" data-idx="${idx}">Salvar correção</button>
        </div>
      </div>
    </td></tr>
  `;
}
function renderCommentResponsePanel(r, idx){
  const draft = r.commentDraft!=null ? r.commentDraft : (r.comentarioProfessor||'');
  return `
    <tr><td colspan="5">
      <div class="q-card" style="background:var(--tint-teal);">
        <strong>Comentário para ${esc(r.studentName)}</strong>
        <p class="muted" style="margin:4px 0 8px; font-size:.82rem;">Esse comentário aparece pro aluno junto com o resultado da prova (não altera a nota).</p>
        <textarea data-action="comment-response-input" data-idx="${idx}" placeholder="Ex: Bom trabalho! Reveja o conteúdo de equações de 2º grau.">${esc(draft)}</textarea>
        <div class="row" style="margin-top:10px;">
          <button class="btn btn-ghost btn-sm" data-action="close-comment-response">Cancelar</button>
          <button class="btn btn-primary btn-sm" data-action="save-comment-response" data-idx="${idx}">Salvar comentário</button>
        </div>
      </div>
    </td></tr>
  `;
}
async function saveCommentResponse(idx){
  const p = state.professor;
  const a = p.resultsFor;
  const r = p.responses[idx];
  if(!r) return;
  r.comentarioProfessor = (r.commentDraft!=null ? r.commentDraft : (r.comentarioProfessor||'')).trim();
  delete r.commentDraft;
  p.commentingResponseIdx = null;
  render();
  await window.storage.set(`responses:${a.code}`, JSON.stringify(p.responses), true);
}
function renderResults(){
  const a = state.professor.resultsFor;
  const responses = state.professor.responses;
  let body;
  if(state.professor.resultsLoading){
    body = `<div class="spinner"></div>`;
  } else if(responses.length===0){
    body = `<div class="empty">Ninguém respondeu ainda.<br>Compartilhe o código <span class="pill">${a.code}</span> com a turma.</div>`;
  } else {
    const max = a.questions.reduce((s,q)=>s+q.points,0);
    const scores = responses.map(r=>r.total);
    const avg = (scores.reduce((s,v)=>s+v,0)/scores.length);
    const best = Math.max(...scores);
    const worst = Math.min(...scores);

    body = `
      ${calReforcoResultadoHtml(a, responses)}
      ${renderStatCards(responses.length, avg, best, worst, max)}
      ${renderQuestionChart(a, responses, max, true)}
      ${renderDistributionChart(responses, max)}
      ${renderIaCorrecaoCard(a, responses)}
      <h3 style="margin-top:22px;">Respostas individuais</h3>
      <div class="table-scroll">
      <table>
        <tr><th>Aluno</th><th>Nota</th><th>Enviado em</th><th>Alertas</th><th></th></tr>
        ${responses.map((r,idx) => `
          <tr>
            <td>${esc(r.studentName)}${r.manual?' <span class="muted">(manual)</span>':''}</td>
            <td>${r.total} / ${max}${r.details.some(d=>d.pending)?' <span class="muted">(revisar)</span>':''}</td>
            <td>${new Date(r.submittedAt).toLocaleString('pt-BR')}</td>
            <td>
              ${r.tabSwitches ? `<div style="color:var(--red);">⚠ ${r.tabSwitches}x saiu da aba</div>` : ''}
              ${r.saidasToleradas ? `<div class="muted" style="font-size:.82rem;">↩ ${r.saidasToleradas}x saiu e voltou dentro da tolerância</div>` : ''}
              ${r.fullscreenExits ? `<div style="color:var(--red);">⚠ ${r.fullscreenExits}x saiu da tela cheia</div>` : ''}
              ${r.screenshotAttempts ? `<div style="color:var(--red);">⚠ ${r.screenshotAttempts}x tentou capturar a tela</div>` : ''}
              ${(!r.tabSwitches && !r.fullscreenExits && !r.screenshotAttempts) ? '<span class="muted">—</span>' : ''}
            </td>
            <td>
              ${r.details.some(d=>d.pending) ? `<button class="btn btn-primary btn-sm" data-action="open-correct-response" data-idx="${idx}">Corrigir</button>` : ''}
              <button class="btn btn-ghost btn-sm" data-action="open-comment-response" data-idx="${idx}">${r.comentarioProfessor?'💬 Comentário':'💬 Comentar'}</button>
              <button class="btn btn-danger btn-sm" data-action="delete-response" data-idx="${idx}">✕</button>
            </td>
          </tr>
          ${state.professor.correctingResponseIdx===idx ? renderCorrectResponsePanel(a, r, idx) : ''}
          ${state.professor.commentingResponseIdx===idx ? renderCommentResponsePanel(r, idx) : ''}
        `).join('')}
      </table>
      </div>
    `;
  }
  const maxPoints = a.questions.reduce((s,q)=>s+q.points,0);
  const manualTurmas = assessmentTurmas(a);
  const prefill = state.professor.manualGradePrefill || '';
  const manualStudentField = manualTurmas.length>0 ? `
    <select id="manual-grade-student-select">
      <option value="">Selecione o aluno...</option>
      ${manualTurmas.map(t => t.students.map(s=>`<option value="${esc(s.name)}" ${s.name===prefill?'selected':''}>${esc(s.name)}${manualTurmas.length>1?' ('+esc(t.name)+')':''}</option>`).join('')).join('')}
    </select>
  ` : `<input type="text" id="manual-grade-student-input" placeholder="Nome do aluno" value="${esc(prefill)}">`;
  const manualForm = `
    <h3 style="margin-top:24px;">Lançar nota manualmente</h3>
    <p class="muted" style="margin-top:-4px; font-size:.85rem;">Use para registrar a nota de um aluno que respondeu em papel, ou para adicionar/ajustar um lançamento. Vale de 0 a ${maxPoints}.</p>
    ${prefill ? `<p class="muted" style="font-size:.82rem;">Aluno identificado pelo QR code do gabarito — confirme o nome e digite a nota.</p>` : ''}
    <div class="row" style="align-items:flex-end;">
      <div>${manualStudentField}</div>
      <div style="flex:0 0 100px;">
        <input type="number" id="manual-grade-value-input" min="0" max="${maxPoints}" step="0.5" placeholder="Nota">
      </div>
      <button class="btn btn-primary" data-action="add-manual-grade" style="flex:0 0 auto;">Lançar</button>
    </div>
  `;
  return `
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2>${esc(a.title)}</h2>
        <div class="row" style="flex:0 0 auto; gap:8px;">
          <span class="pill">${a.code}</span>
          <button class="btn btn-ghost btn-sm" data-action="export-pdf" data-code="${a.code}">Imprimir / PDF</button>
        </div>
      </div>
      ${body}
      ${manualForm}
      <div style="margin-top:18px;">
        <button class="btn btn-ghost" data-action="back-to-list">← Voltar</button>
      </div>
    </div>
  `;
}
function renderStatCards(count, avg, best, worst, max){
  const items = [
    {label:'Respostas', value: count},
    {label:'Média', value: avg.toFixed(1) + ' / ' + max},
    {label:'Maior nota', value: best + ' / ' + max},
    {label:'Menor nota', value: worst + ' / ' + max},
  ];
  return `
    <div class="stat-grid">
      ${items.map(it => `
        <div class="stat-card">
          <div class="stat-value">${it.value}</div>
          <div class="stat-label">${it.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}
function renderQuestionChart(a, responses, max, allowAnnul){
  const rows = a.questions.map((q, idx) => {
    if(q.annulled){
      return `
        <div class="chart-row">
          <div class="chart-label">Q${idx+1} <span class="muted" style="font-weight:400;">· anulada</span></div>
          <div class="chart-track"><div class="chart-fill" style="width:0%;"></div></div>
          <div class="chart-pct">—</div>
          ${allowAnnul ? `<button class="btn btn-ghost btn-sm" data-action="toggle-annul" data-qid="${q.id}">Reativar</button>` : ''}
        </div>
      `;
    }
    let earned = 0, possible = 0, pendingCount = 0;
    responses.forEach(r => {
      const d = r.details.find(x=>x.questionId===q.id);
      if(d && !d.pending){ earned += d.score; possible += q.points; }
      else if(d && d.pending){ pendingCount++; }
    });
    const pct = possible>0 ? Math.round((earned/possible)*100) : 0;
    const barColor = pct>=70 ? 'var(--green)' : pct>=50 ? 'var(--yellow-dark)' : 'var(--red)';
    return `
      <div class="chart-row">
        <div class="chart-label">Q${idx+1} <span class="muted" style="font-weight:400;">· ${questionTagLabel(q.type)}</span></div>
        <div class="chart-track">
          <div class="chart-fill" style="width:${pct}%; background:${barColor};"></div>
        </div>
        <div class="chart-pct">${pct}%${pendingCount ? ' <span class="muted">('+pendingCount+' pend.)</span>' : ''}</div>
        ${allowAnnul ? `<button class="btn btn-danger btn-sm" data-action="toggle-annul" data-qid="${q.id}">Anular</button>` : ''}
      </div>
    `;
  }).join('');
  return `
    ${allowAnnul ? '<p class="muted" style="font-size:.82rem;">Anular uma questão redistribui os pontos dela proporcionalmente entre as demais, recalculando automaticamente todas as respostas já enviadas.</p>' : ''}
    <h3 style="margin-top:22px;">Aproveitamento por questão</h3>
    <p class="muted" style="margin-top:-4px; font-size:.85rem;">Percentual da pontuação obtida em relação ao total possível daquela questão.</p>
    ${rows}
  `;
}
function renderDistributionChart(responses, max){
  const bands = [
    {label:'0–49%', min:0, max:49.999, count:0},
    {label:'50–69%', min:50, max:69.999, count:0},
    {label:'70–89%', min:70, max:89.999, count:0},
    {label:'90–100%', min:90, max:100, count:0},
  ];
  responses.forEach(r => {
    const pct = max>0 ? (r.total/max)*100 : 0;
    const band = bands.find(b => pct>=b.min && pct<=b.max) || bands[bands.length-1];
    band.count++;
  });
  const maxCount = Math.max(...bands.map(b=>b.count), 1);
  return `
    <h3 style="margin-top:22px;">Distribuição de notas</h3>
    <div class="dist-chart">
      ${bands.map(b => `
        <div class="dist-col">
          <div class="dist-bar-wrap">
            <div class="dist-bar" style="height:${(b.count/maxCount)*100}%;">${b.count>0?b.count:''}</div>
          </div>
          <div class="dist-label">${b.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}
__parteOk('visao_area');
