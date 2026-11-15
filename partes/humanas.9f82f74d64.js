/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "humanas" */
const TRILHA_RESP_PREFIXO = 'trilha-resp:';
function trilhaSerieNum(serie){ const m = String(serie||'').match(/(\d)/); return m ? parseInt(m[1]) : 0; }
function trilhaCatalogo(pl){ return (pl && Array.isArray(pl.trilhas)) ? pl.trilhas : []; }
function trilhaBarra(feitas, total, cor){ const p = total ? Math.round(feitas / total * 100) : 0; return `<span class="tr-barra" aria-label="${feitas} de ${total}"><span style="width:${p}%; background:${cor};"></span></span>`; }
function trilhaDataCurta(ts){ return ts ? new Date(ts).toLocaleDateString('pt-BR') : ''; }
async function trilhaCarregarAluno(forcar){
  const al = state.aluno; const e = estudarState();
  if(!al.turma || (e.trProg && !forcar) || e.trCarregando) return;
  e.trCarregando = true;
  const prog = {};
  for(const d of (e.discs||[])){ const pr = await planoLerJson(`plano-livro-prog:${planoTK(al.turma.id, d.k)}`, { dadas:{} }); prog[d.k] = { planoId: d.planoId, dadas: (pr && pr.dadas) || {} }; }
  let r = null; try{ const x = await window.storage.get(TRILHA_RESP_PREFIXO + al.matriculaStudentId, true); r = x && x.value ? JSON.parse(x.value) : null; }catch(_){ r = null; }
  e.trProg = prog; e.trResp = r && r.respostas ? r : { respostas:{} }; e.trCarregando = false;
  render();
}
function trilhaEtapaStatus(e, et){
  const st = (e.trProg||{})[planoDiscKey(et.disc)];
  if(!st || st.planoId!==et.planoId) return null;
  return { ts: st.dadas[et.n] || 0 };
}
function trilhasAlunoFaixaHtml(e){
  const cat = trilhaCatalogo(e.plano); if(!cat.length) return '';
  if(!e.trProg) setTimeout(() => trilhaCarregarAluno(), 0);
  const s = trilhaSerieNum(e.plano.serie);
  return `<div class="card tr-faixa" data-trilhas-aluno>
    <div class="tr-faixa-cab"><strong>🧭 Grandes perguntas</strong><span class="muted">perguntas que atravessam ${trilhaArea(cat).lista}, da 1ª à 3ª série</span></div>
    <div class="tr-grade">${cat.map(t => {
      const minhas = t.etapas.filter(x => x.s===s); const feitas = minhas.filter(x => (trilhaEtapaStatus(e, x)||{}).ts).length;
      const resp = (((e.trResp||{}).respostas||{})[t.id]||{})[s];
      return `<button class="tr-chip" data-action="estudar-trilha" data-id="${esc(t.id)}" style="--tc:${esc(t.cor)};">
        <span class="tr-chip-ic">${t.icone}</span><span class="tr-chip-q">${esc(t.pergunta)}</span>
        <span class="tr-chip-meta">${e.trProg ? `${feitas} de ${minhas.length} etapas da sua série` : `${minhas.length} etapas na sua série`}${resp ? ' · ✍️ respondida' : ''}</span>
        ${trilhaBarra(feitas, minhas.length, t.cor)}</button>`; }).join('')}</div></div>`;
}
function trilhaAlunoHtml(e){
  const t = trilhaCatalogo(e.plano).find(x => x.id===e.trilha); if(!t) return '';
  if(!e.trProg) setTimeout(() => trilhaCarregarAluno(), 0);
  const s = trilhaSerieNum(e.plano.serie);
  const resp = ((e.trResp||{}).respostas||{})[t.id] || {};
  const grupos = [1,2,3].map(sr => {
    const ets = t.etapas.filter(x => x.s===sr); if(!ets.length) return '';
    const rot = sr < s ? 'você já passou por aqui' : sr===s ? 'sua série agora' : 'vem aí';
    return `<div class="tr-serie ${sr===s?'atual':''}" data-tr-serie="${sr}"><h4>${sr}ª série <span class="muted">· ${rot}</span></h4>${ets.map(x => {
      const st = sr===s ? trilhaEtapaStatus(e, x) : null; const feita = !!(st && st.ts); const idx = t.etapas.indexOf(x) + 1;
      const d = (e.discs||[]).find(dd => dd.k===planoDiscKey(x.disc)); const pode = feita && d && d.planoId===x.planoId;
      return `<div class="tr-etapa ${feita?'feita':''}" data-tr-etapa="${esc(planoDiscKey(x.disc))}-${x.n}">
        <span class="tr-num" style="${feita ? `background:${t.cor}; color:#fff;` : `color:${t.cor};`} border-color:${t.cor};">${feita ? '✓' : idx}</span>
        <div class="tr-etapa-txt"><div>${conexIcone(x.disc)} <b>${esc(x.disc)}</b> · ${x.bim}º bim · aula ${x.n} — ${esc(x.titulo)}</div>
          <div class="tr-papel">${esc(x.papel)}</div>
          ${st ? `<div class="muted" style="font-size:.78rem;">${feita ? 'Vista em ' + trilhaDataCurta(st.ts) : 'Ainda não aconteceu na sua turma'}</div>` : ''}
          ${pode ? `<button class="btn btn-ghost btn-sm" data-action="estudar-conexao" data-k="${esc(d.k)}" data-n="${x.n}" style="width:auto; padding:2px 8px; margin-top:4px;">Abrir esta aula</button>` : ''}</div></div>`; }).join('')}</div>`;
  }).join('');
  const minhas = t.etapas.filter(x => x.s===s); const feitas = minhas.filter(x => (trilhaEtapaStatus(e, x)||{}).ts).length;
  const anteriores = [1,2].filter(sr => sr < s && resp[sr]).map(sr => `<div class="tr-resp-ant" data-tr-resp-ant="${sr}"><b>Sua resposta na ${sr}ª série</b> <span class="muted">(${trilhaDataCurta(resp[sr].em)})</span><p>${esc(resp[sr].texto)}</p></div>`).join('');
  const rasc = (e.trRasc||{})[t.id]!=null ? e.trRasc[t.id] : ((resp[s]||{}).texto || '');
  return `<button class="btn btn-ghost btn-sm" data-action="estudar-trilha-voltar" style="width:auto; margin-bottom:8px;">← Voltar às aulas</button>
    <div class="card tr-cab" data-trilha-aluno="${esc(t.id)}" style="border-top:6px solid ${t.cor};">
      <div class="tr-cab-ic">${t.icone}</div>
      <div><div class="muted" style="font-size:.78rem; letter-spacing:.06em;">GRANDE PERGUNTA</div><h2 style="margin:.1em 0 .3em; color:${t.cor};">${esc(t.pergunta)}</h2>
      <p style="margin:0 0 6px;">${esc(t.abertura)}</p>
      <p class="muted" style="margin:0; font-size:.84rem;">${t.etapas.length} etapas em ${esc(t.disciplinas.join(', '))} · na sua série: ${e.trProg ? `${feitas} de ${minhas.length} já aconteceram` : `${minhas.length} etapas`}</p>
      ${trilhaBarra(feitas, minhas.length, t.cor)}</div></div>
    <div class="card">${grupos}</div>
    ${ponteAlunoHtml(e, t)}
    <div class="card tr-resposta" data-tr-resposta>
      <h3 style="margin-top:0;">✍️ Minha resposta</h3>
      <p style="margin:0 0 8px;"><b>${esc((t.chegada||{})[s] || t.pergunta)}</b></p>
      ${anteriores}
      <textarea data-action="estudar-trilha-texto" data-id="${esc(t.id)}" rows="5" maxlength="2000" placeholder="Escreva com suas palavras, usando o que você viu nas aulas desta trilha (cite pelo menos duas disciplinas).">${esc(rasc)}</textarea>
      <div class="row" style="gap:8px; align-items:center; flex-wrap:wrap; margin-top:6px;">
        <button class="btn btn-primary btn-sm" data-action="estudar-trilha-salvar" data-id="${esc(t.id)}" style="width:auto; flex:0 0 auto;" ${e.trSalvando?'disabled':''}>${e.trSalvando ? 'Salvando…' : 'Salvar minha resposta'}</button>
        ${e.trMsg ? `<span data-tr-msg style="font-size:.84rem; color:${e.trMsg.ok ? '#1d6b31' : '#a4521b'};">${esc(e.trMsg.txt)}</span>` : (resp[s] ? `<span class="muted" style="font-size:.8rem;">Salva em ${trilhaDataCurta(resp[s].em)}</span>` : '')}
      </div>
      <p class="muted" style="font-size:.78rem; margin:6px 0 0;">Sua resposta fica guardada e volta a aparecer nas próximas séries, para você ver como seu pensamento mudou. Os professores ${trilhaArea(t).profs} da sua turma podem ler.</p>
    </div>`;
}
async function trilhaSalvarResposta(id){
  const al = state.aluno; const e = estudarState(); if(!al.turma || !e.plano) return;
  const s = String(trilhaSerieNum(e.plano.serie));
  const texto = String((e.trRasc||{})[id]!=null ? e.trRasc[id] : '').trim();
  if(texto.length < 20){ e.trMsg = { ok:false, txt:'Escreva pelo menos uma ou duas frases antes de salvar.' }; render(); return; }
  e.trSalvando = true; e.trMsg = null; render();
  try{
    let doc = null; try{ const x = await window.storage.get(TRILHA_RESP_PREFIXO + al.matriculaStudentId, true); doc = x && x.value ? JSON.parse(x.value) : null; }catch(_){ doc = null; }
    doc = doc && doc.respostas ? doc : { respostas:{} };
    doc.studentId = al.matriculaStudentId; doc.studentName = al.name || ''; doc.turmaId = al.turma.id; doc.turmaName = al.turma.name || '';
    doc.respostas[id] = doc.respostas[id] || {}; doc.respostas[id][s] = { texto: texto.slice(0, 2000), em: Date.now() };
    await window.storage.set(TRILHA_RESP_PREFIXO + al.matriculaStudentId, JSON.stringify(doc), true);
    e.trResp = doc; if(e.trRasc) delete e.trRasc[id];
    e.trMsg = { ok:true, txt:'✅ Resposta salva.' };
  }catch(err){ e.trMsg = { ok:false, txt:'Não consegui salvar agora. Confira a internet e tente de novo.' }; }
  e.trSalvando = false; render();
}
function trilhasEstudarHtml(e, a){
  const tr = a.trilhas || (a.slides && a.slides.trilhas) || []; if(!tr.length || !trilhaCatalogo(e.plano).length) return '';
  return `<div class="tr-aula" data-estudar-trilhas>${tr.map(x => `<div class="tr-aula-item" style="border-left-color:${esc(x.cor)};">${x.icone} Esta aula é a <b>etapa ${x.etapa} de ${x.total}</b> da grande pergunta <b style="color:${esc(x.cor)};">${esc(x.pergunta)}</b><br><span class="muted" style="font-size:.82rem;">${esc(x.papel)}</span>
    <button class="btn btn-ghost btn-sm" data-action="estudar-trilha" data-id="${esc(x.id)}" style="width:auto; padding:2px 8px; margin-left:4px;">Ver a trilha</button></div>`).join('')}</div>`;
}
function trilhaVizinhaTxt(v){ return v ? `${conexIcone(v.disc)} ${esc(v.disc)} · ${esc(v.serie)} · aula ${v.n} — ${esc(v.titulo)}` : ''; }
function trilhasProfHtml(turmaId, plano, aula){
  const tr = aula.trilhas || (aula.slides && aula.slides.trilhas) || []; if(!tr.length) return '';
  const cat = trilhaCatalogo(plano); const s = String(trilhaSerieNum(plano.serie));
  return `<div class="tr-aula prof" data-pl-trilhas><strong style="color:#1F4E79;">🧭 Grandes perguntas</strong> <span class="muted" style="font-size:.78rem;">— esta aula é uma etapa de uma pergunta que atravessa ${trilhaArea(cat).lista}</span>
    ${tr.map(x => { const t = cat.find(c => c.id===x.id) || {}; const cul = (t.culminancia||{})[s];
      return `<div class="tr-aula-item" style="border-left-color:${esc(x.cor)};">${x.icone} <b style="color:${esc(x.cor)};">${esc(x.pergunta)}</b> · etapa ${x.etapa} de ${x.total}<br><span style="font-size:.84rem;">${esc(x.papel)}</span>
        <div class="muted" style="font-size:.78rem; margin-top:2px;">${x.antes ? `← antes: ${trilhaVizinhaTxt(x.antes)}` : '← é a primeira etapa'}${x.depois ? `<br>→ depois: ${trilhaVizinhaTxt(x.depois)}` : '<br>→ é a última etapa'}</div>
        ${cul ? `<div style="font-size:.8rem; margin-top:3px;">💡 <b>Culminância sugerida (${s}ª série):</b> ${esc(cul)}</div>` : ''}</div>`; }).join('')}
    <button class="btn btn-ghost btn-sm" data-action="plano-trilhas-abrir" data-id="${esc(tr[0].id)}" style="width:auto; margin-top:4px;">Ver a trilha e as respostas da turma</button></div>`;
}
async function trilhaCarregarRespostasTurma(turmaId, forcar){
  const s = planoState(); s.trResp = s.trResp || {};
  if(s.trResp[turmaId] && !forcar) return; s.trResp[turmaId] = { carregando:true, lista:[] };
  let lista = [];
  try{
    const r = await window.storage.list(TRILHA_RESP_PREFIXO, true);
    const docs = await Promise.all((r.keys||[]).map(async k => { try{ const v = r.values && r.values[k]!==undefined ? r.values[k] : (await window.storage.get(k, true)).value; return JSON.parse(v); }catch(_){ return null; } }));
    lista = docs.filter(d => d && d.turmaId===turmaId);
  }catch(_){ lista = []; }
  s.trResp[turmaId] = { carregando:false, lista, em: Date.now() };
  render();
}
function renderPlanoTrilhas(turmaId, plano){
  const s = planoState(); const cat = trilhaCatalogo(plano); if(!cat.length) return '';
  const sr = trilhaSerieNum(plano.serie); const srK = String(sr);
  s.conex = s.conex || {};
  const discs = [...new Set(cat.flatMap(t => t.etapas.filter(x => x.s===sr).map(x => planoDiscKey(x.disc))))];
  discs.forEach(dk => { if(s.conex[turmaId + '|' + dk]===undefined) setTimeout(() => conexCarregarStatus(turmaId, dk), 0); });
  const rs = (s.trResp||{})[turmaId]; if(!rs) setTimeout(() => trilhaCarregarRespostasTurma(turmaId), 0);
  const t = cat.find(x => x.id===s.trSel) || cat[0];
  const statusEt = x => { const st = s.conex[turmaId + '|' + planoDiscKey(x.disc)]; if(!st) return { txt:'…', cls:'' }; if(!st.planoId || st.planoId!==x.planoId) return { txt:'esta turma segue outra versão do plano', cls:'outra' }; const ts = st.dadas[x.n]; return ts ? { txt:'✓ dada em ' + trilhaDataCurta(ts), cls:'ok', ts } : { txt:'ainda não dada', cls:'' }; };
  const ets = t.etapas.filter(x => x.s===sr); const feitas = ets.filter(x => statusEt(x).ts).length;
  const turma = (state.professor.turmas||[]).find(x => x.id===turmaId) || (state.coordenador && (state.coordenador.turmas||[]).find(x => x.id===turmaId)) || {};
  const nAlunos = (turma.students||[]).length;
  const resp = rs && !rs.carregando ? rs.lista.filter(d => d.respostas && d.respostas[t.id] && d.respostas[t.id][srK]).sort((a, b) => String(a.studentName).localeCompare(String(b.studentName), 'pt-BR')) : [];
  const nP = ponteCatalogo(plano).filter(p => p.serie===sr).length;
  const abasTP = nP ? `<div class="tr-abas" data-tr-abas><button class="btn btn-ghost btn-sm ${s.trAba!=='pontes'?'ativa':''}" data-action="plano-trilhas-aba" data-aba="trilhas">🧭 Trilhas</button><button class="btn btn-ghost btn-sm ${s.trAba==='pontes'?'ativa':''}" data-action="plano-trilhas-aba" data-aba="pontes">🌉 Atividades ponte (${nP})</button></div>` : '';
  if(nP && s.trAba==='pontes') return abasTP + renderPlanoPontes(turmaId, plano);
  return abasTP + `<div data-pl-trilhas-painel>
    <p class="muted" style="font-size:.84rem; margin-top:0;">${cat.length===8 ? 'Oito' : cat.length} perguntas que atravessam ${trilhaArea(cat).lista} nas três séries. Cada aula-etapa mostra o que acrescenta à resposta; no fim, o aluno escreve a sua resposta em <b>Estudar → Grandes perguntas</b>.</p>
    <div class="tr-sel">${cat.map(c => { const n = rs && !rs.carregando ? rs.lista.filter(d => d.respostas && d.respostas[c.id] && d.respostas[c.id][srK]).length : null;
      return `<button class="tr-sel-btn ${c.id===t.id?'ativa':''}" data-action="plano-trilha-sel" data-id="${esc(c.id)}" style="--tc:${esc(c.cor)};">${c.icone} ${esc(c.pergunta)}${n ? ` <span class="tr-badge">${n}</span>` : ''}</button>`; }).join('')}</div>
    <div class="tr-painel" style="border-top:5px solid ${t.cor};" data-tr-painel="${esc(t.id)}">
      <h3 style="margin:.2em 0; color:${t.cor};">${t.icone} ${esc(t.pergunta)}</h3>
      <p style="margin:0 0 6px; font-size:.9rem;">${esc(t.abertura)}</p>
      ${(t.competencias||[]).length ? `<p class="muted" style="font-size:.8rem; margin:0 0 8px;"><b>BNCC (competências específicas de CHSA mais mobilizadas):</b> ${t.competencias.map(c => `${c.c}. ${esc(c.txt)}`).join(' · ')}</p>` : ''}
      <div class="tr-cols">
        <div><h4 style="margin:.3em 0;">Etapas na ${sr}ª série <span class="muted" style="font-weight:400;">(${feitas} de ${ets.length} dadas nesta turma)</span></h4>
          ${trilhaBarra(feitas, ets.length, t.cor)}
          <ol class="tr-lista">${ets.map(x => { const st = statusEt(x); return `<li data-tr-prof-etapa="${esc(planoDiscKey(x.disc))}-${x.n}">${conexIcone(x.disc)} <b>${esc(x.disc)}</b> · ${x.bim}º bim · aula ${x.n} — ${esc(x.titulo)}<br><span style="font-size:.8rem;">${esc(x.papel)}</span> <span class="tr-st ${st.cls}">${esc(st.txt)}</span></li>`; }).join('')}</ol>
          <p class="muted" style="font-size:.78rem;">Nas outras séries: ${[1,2,3].filter(x => x!==sr).map(x => `${x}ª série ${t.porSerie[String(x)]} etapa(s)`).join(' · ')}.</p></div>
        <div>
          ${(t.culminancia||{})[srK] ? `<div class="tr-box"><b>💡 Culminância sugerida (${sr}ª série)</b><br>${esc(t.culminancia[srK])}<br><span class="muted" style="font-size:.78rem;">Combine com os professores das outras disciplinas da turma: dá para valer como atividade de mais de uma disciplina.</span></div>` : ''}
          <div class="tr-box"><b>✍️ Pergunta de chegada (o aluno responde no app)</b><br>${esc((t.chegada||{})[srK] || t.pergunta)}</div>
          <div class="tr-box" data-tr-respostas><div class="row" style="justify-content:space-between; align-items:center; gap:6px;"><b>Respostas da turma</b>
            <button class="btn btn-ghost btn-sm" data-action="plano-trilha-atualizar" style="width:auto; flex:0 0 auto; padding:2px 8px;">↻ Atualizar</button></div>
            ${!rs || rs.carregando ? '<p class="muted">Carregando…</p>' : resp.length ? `<p class="muted" style="font-size:.8rem; margin:4px 0;">${resp.length}${nAlunos ? ' de ' + nAlunos : ''} aluno(s) responderam.</p>${resp.map(d => `<details class="tr-resp" data-tr-resp="${esc(d.studentId)}"><summary><b>${esc(d.studentName||'Aluno')}</b> <span class="muted">· ${trilhaDataCurta(d.respostas[t.id][srK].em)}</span></summary><p>${esc(d.respostas[t.id][srK].texto)}</p></details>`).join('')}` : '<p class="muted" style="font-size:.84rem;">Ainda ninguém respondeu nesta turma. Sugestão: reserve 10 minutos depois da última etapa do bimestre para os alunos escreverem no app.</p>'}
          </div>
        </div>
      </div>
    </div></div>`;
}
const PONTE_PREFIXO = 'ponte-liberada:';
let PONTE_LIB = {};
function ponteCatalogo(pl){ return (pl && Array.isArray(pl.pontes)) ? pl.pontes : []; }
async function ponteCarregarLiberadas(turmaId, forcar){
  if(!turmaId || (PONTE_LIB[turmaId] && !forcar)) return;
  PONTE_LIB[turmaId] = { carregando:true, mapa:{} };
  const m = await planoLerJson(PONTE_PREFIXO + turmaId, {});
  PONTE_LIB[turmaId] = { carregando:false, mapa: m || {} };
  render();
}
function ponteLiberadas(turmaId){
  const c = PONTE_LIB[turmaId]; if(!c){ setTimeout(() => ponteCarregarLiberadas(turmaId), 0); return null; }
  return c.carregando ? null : c.mapa;
}
async function ponteLiberar(turmaId, id, liberar){
  const m = (await planoLerJson(PONTE_PREFIXO + turmaId, {})) || {};
  if(liberar) m[id] = { em: Date.now(), por: (state.professor.session && state.professor.session.displayName) || (state.view==='coordenador' ? 'Coordenação' : ''), disc: planoDiscAtual() || '' };
  else delete m[id];
  await window.storage.set(PONTE_PREFIXO + turmaId, JSON.stringify(m), true);
  PONTE_LIB[turmaId] = { carregando:false, mapa:m }; render();
}
function ponteStatusAula(turmaId, x){
  const s = planoState(); s.conex = s.conex || {}; const dk = planoDiscKey(x.disc); const st = s.conex[turmaId + '|' + dk];
  if(st===undefined){ setTimeout(() => conexCarregarStatus(turmaId, dk), 0); return { txt:'…', cls:'' }; }
  if(!st) return { txt:'…', cls:'' };
  if(!st.planoId || st.planoId!==x.planoId) return { txt:'turma em outra versão do plano', cls:'outra' };
  const ts = st.dadas[x.n]; return ts ? { txt:'✓ dada em ' + trilhaDataCurta(ts), cls:'ok', ts } : { txt:'ainda não dada', cls:'' };
}
function ponteProntidao(turmaId, p){ const sts = p.aulas.map(x => ponteStatusAula(turmaId, x)); return { feitas: sts.filter(x => x.ts).length, total: p.aulas.length, sts }; }
function ponteAulasTxt(lista){ return lista.map(y => `${conexIcone(y.disc)} ${esc(y.disc)} aula ${y.n}`).join(' + '); }
function ponteFichaHtml(p, modo){
  const docs = (p.documentos||[]).map((d, i) => `<div class="doc"><h3>Documento ${i+1} · ${esc(d.disc)}${d.titulo ? ' — ' + esc(d.titulo) : ''}</h3><blockquote>${esc(d.trecho)}</blockquote><p class="ref">${esc(d.ref)}</p>${(d.perguntas||[]).length ? `<ol>${d.perguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}</div>`).join('');
  const cab = `<header><div class="esc">CEETIP Governador Marcelo Déda Chagas - DRE04 · ${esc(p.area || 'Ciências Humanas')} · ${p.serie}ª série</div><h1>🌉 ${esc(p.titulo)}</h1><div class="trilha">${p.icone} Grande pergunta: ${esc(p.pergunta)} · ${esc(p.disciplinas.join(' + '))}</div></header>`;
  const css = `body{font-family:Arial,Helvetica,sans-serif;color:#222;max-width:780px;margin:0 auto;padding:18px;line-height:1.4;font-size:14px;} h1{font-size:22px;margin:4px 0;color:#6B1F2E;} h2{font-size:16px;margin:16px 0 6px;color:#1F4E79;border-bottom:1px solid #ddd;padding-bottom:2px;} h3{font-size:14px;margin:10px 0 4px;} .esc{font-size:11px;color:#666;} .trilha{font-size:12px;color:#555;} .problema{font-size:17px;font-weight:bold;background:#f5f1ea;border-left:5px solid ${p.cor};padding:8px 12px;margin:10px 0;} blockquote{margin:4px 0;padding:6px 10px;background:#fafafa;border-left:3px solid #bbb;} .ref{font-size:11px;color:#666;margin:2px 0 4px;} .doc{page-break-inside:avoid;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ccc;padding:5px 7px;vertical-align:top;text-align:left;font-size:13px;} .linhas div{border-bottom:1px solid #bbb;height:26px;} .nomes{margin:8px 0;} @media print{body{padding:0;}}`;
  if(modo==='prof') return `<!doctype html><html><head><meta charset="utf-8"><title>Roteiro — ${esc(p.titulo)}</title><style>${css}</style></head><body>${cab}
    <div class="problema">Pergunta-problema: ${esc(p.problema)}</div>
    <p><b>Objetivo:</b> ${esc(p.objetivo)}</p><p><b>Quando:</b> ${esc(p.quando)} <b>Duração:</b> ${esc(p.duracao)}.</p><p><b>Recursos:</b> ${esc(p.semRecursos)}</p>
    <h2>Aulas envolvidas e o que cada disciplina traz</h2><ul>${p.aulas.map(x => `<li><b>${esc(x.disc)}</b> · ${x.bim}º bim · aula ${x.n} — ${esc(x.titulo)}</li>`).join('')}</ul><ul>${p.papeis.map(x => `<li><b>${esc(x.disc)}:</b> ${esc(x.txt)}</li>`).join('')}</ul>
    <h2>Roteiro (100 min)</h2><table><tr><th>Tempo</th><th>Etapa</th><th>O que fazer</th></tr>${p.passos.map(x => `<tr><td>${x.min} min</td><td><b>${esc(x.titulo)}</b></td><td>${esc(x.txt)}</td></tr>`).join('')}</table>
    <h2>Produto do grupo</h2><p>${esc(p.produto)}</p>
    <h2>Critérios de avaliação</h2><ol>${p.criterios.map(c => `<li>${esc(c)}</li>`).join('')}</ol><p>${esc(p.avaliacao)}</p>
    <h2>Documentos da ficha do aluno</h2>${docs}</body></html>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Ficha — ${esc(p.titulo)}</title><style>${css}</style></head><body>${cab}
    <div class="nomes">Grupo: ______________________________________________________ Turma: ________ Data: ___/___</div>
    <div class="problema">${esc(p.problema)}</div>
    <h2>O que vocês já estudaram</h2><ul>${p.aulas.map(x => `<li><b>${esc(x.disc)}</b>, aula ${x.n}: ${esc(x.titulo)}</li>`).join('')}</ul>
    <h2>1. Leiam os documentos e respondam no caderno</h2>${docs}
    <h2>2. Tarefa do grupo</h2><p>${esc(p.passos[2].txt)}</p><p><b>Vocês vão entregar:</b> ${esc(p.produto)}</p>
    <h2>3. Como o trabalho será avaliado</h2><ol>${p.criterios.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
    <h2>4. Minha resposta (individual)</h2><p>${esc(p.problema)} Use pelo menos um conceito de cada disciplina.</p><div class="linhas">${'<div></div>'.repeat(8)}</div></body></html>`;
}
function ponteImprimir(p, modo){
  const w = window.open('', '_blank'); if(!w){ alert('O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente de novo.'); return; }
  w.document.write(ponteFichaHtml(p, modo)); w.document.close(); w.focus(); setTimeout(() => { try{ w.print(); }catch(_){} }, 300);
}
function ponteDetalheHtml(turmaId, p){
  const lib = ponteLiberadas(turmaId); const l = lib && lib[p.id]; const pr = ponteProntidao(turmaId, p);
  return `<div class="pt-det" data-ponte-det="${esc(p.id)}" style="border-top:5px solid ${p.cor};">
    <button class="btn btn-ghost btn-sm" data-action="ponte-fechar" style="width:auto;">← Todas as atividades ponte</button>
    <div class="muted" style="font-size:.78rem; margin-top:8px;">${p.icone} ${esc(p.pergunta)} · ${p.serie}ª série · ${esc(p.disciplinas.join(' + '))}</div>
    <h3 style="margin:.2em 0; color:${p.cor};">🌉 ${esc(p.titulo)}</h3>
    <div class="pt-problema">${esc(p.problema)}</div>
    <p style="font-size:.88rem; margin:6px 0;"><b>Objetivo:</b> ${esc(p.objetivo)}</p>
    <p style="font-size:.84rem; margin:4px 0;" class="muted">⏱️ ${esc(p.duracao)} · 🗓️ ${esc(p.quando)} · ${esc(p.semRecursos)}</p>
    <div class="pt-acoes">
      <button class="btn btn-primary btn-sm" data-action="ponte-imprimir" data-id="${esc(p.id)}" data-modo="aluno" style="width:auto; flex:0 0 auto;">🖨️ Ficha do aluno</button>
      <button class="btn btn-ghost btn-sm" data-action="ponte-imprimir" data-id="${esc(p.id)}" data-modo="prof" style="width:auto; flex:0 0 auto;">🖨️ Roteiro do professor</button>
      ${l ? `<button class="btn btn-ghost btn-sm" data-action="ponte-liberar" data-id="${esc(p.id)}" data-v="0" style="width:auto; flex:0 0 auto;">🔒 Recolher dos alunos</button><span class="pt-lib" data-ponte-liberada>🔓 Liberada aos alunos em ${trilhaDataCurta(l.em)}${l.por ? ' por ' + esc(l.por) : ''}</span>`
          : `<button class="btn btn-ghost btn-sm" data-action="ponte-liberar" data-id="${esc(p.id)}" data-v="1" style="width:auto; flex:0 0 auto;">🔓 Liberar a ficha no app dos alunos</button>`}
    </div>
    <div class="tr-cols">
      <div>
        <h4 style="margin:.6em 0 .3em;">Aulas envolvidas <span class="muted" style="font-weight:400;">(${pr.feitas} de ${pr.total} dadas nesta turma)</span></h4>
        <ul class="tr-lista" style="list-style:none; margin-left:0;">${p.aulas.map((x, i) => `<li data-ponte-aula="${esc(planoDiscKey(x.disc))}-${x.n}">${conexIcone(x.disc)} <b>${esc(x.disc)}</b> · ${x.bim}º bim · aula ${x.n} — ${esc(x.titulo)} <span class="tr-st ${pr.sts[i].cls}">${esc(pr.sts[i].txt)}</span></li>`).join('')}</ul>
        <h4 style="margin:.8em 0 .3em;">Roteiro (100 min)</h4>
        <div class="pt-passos">${p.passos.map(x => `<div class="pt-passo"><span class="pt-min">${x.min}′</span><div><b>${esc(x.titulo)}.</b> ${esc(x.txt)}</div></div>`).join('')}</div>
      </div>
      <div>
        <div class="tr-box"><b>O que cada disciplina traz</b><ul style="margin:4px 0 0 16px; padding:0;">${p.papeis.map(x => `<li><b>${esc(x.disc)}:</b> ${esc(x.txt)}</li>`).join('')}</ul></div>
        <div class="tr-box"><b>📦 Produto do grupo</b><br>${esc(p.produto)}</div>
        <div class="tr-box"><b>✅ Critérios</b><ol style="margin:4px 0 0 18px; padding:0;">${p.criterios.map(c => `<li>${esc(c)}</li>`).join('')}</ol><span class="muted" style="font-size:.78rem;">${esc(p.avaliacao)}</span></div>
      </div>
    </div>
    <h4 style="margin:.8em 0 .3em;">Documentos da ficha <span class="muted" style="font-weight:400;">(trechos do Aprofundamento das próprias aulas)</span></h4>
    ${(p.documentos||[]).map((d, i) => `<details class="tr-resp" data-ponte-doc="${i}"><summary><b>Documento ${i+1}</b> · ${esc(d.disc)} — ${esc(d.titulo||'')}</summary><blockquote class="pt-trecho">${esc(d.trecho)}</blockquote><div class="muted" style="font-size:.76rem;">${esc(d.ref)}</div>${(d.perguntas||[]).length ? `<ol style="font-size:.84rem;">${d.perguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}</details>`).join('')}
  </div>`;
}
function renderPlanoPontes(turmaId, plano){
  const s = planoState(); const sr = trilhaSerieNum(plano.serie);
  const lista = ponteCatalogo(plano).filter(p => p.serie===sr);
  const aberta = lista.find(p => p.id===s.ponteAberta);
  if(aberta) return ponteDetalheHtml(turmaId, aberta);
  const lib = ponteLiberadas(turmaId) || {};
  return `<div data-pl-pontes><p class="muted" style="font-size:.84rem; margin-top:0;">Uma atividade por grande pergunta, juntando 2 ou 3 aulas de disciplinas diferentes da ${sr}ª série. Cada uma tem roteiro de 100 minutos, ficha do aluno para imprimir (não precisa de data show), documentos e critérios. Combine com o(a) colega da outra disciplina e aplique depois que as aulas tiverem sido dadas.</p>
    <div class="pt-grade">${lista.map(p => { const pr = ponteProntidao(turmaId, p); const pronta = pr.feitas===pr.total; const l = lib[p.id];
      return `<div class="pt-card" data-ponte="${esc(p.id)}" style="border-left-color:${p.cor};">
        <div class="muted" style="font-size:.74rem;">${p.icone} ${esc(p.pergunta)}</div>
        <b style="color:${p.cor};">🌉 ${esc(p.titulo)}</b>
        <div style="font-size:.82rem; margin:3px 0;">${esc(p.problema)}</div>
        <div style="font-size:.78rem;">${ponteAulasTxt(p.aulas)}</div>
        <div class="row" style="gap:6px; align-items:center; flex-wrap:wrap; margin-top:4px;">
          <span class="pt-pront ${pronta ? 'ok' : ''}" data-ponte-pront="${pr.feitas}/${pr.total}">${pronta ? '✅ pronta para aplicar' : `${pr.feitas} de ${pr.total} aulas dadas`}</span>
          ${l ? `<span class="pt-lib">🔓 liberada</span>` : ''}
          <button class="btn btn-ghost btn-sm" data-action="ponte-abrir" data-id="${esc(p.id)}" style="width:auto; flex:0 0 auto; margin-left:auto;">Abrir roteiro</button>
        </div></div>`; }).join('')}</div></div>`;
}
function pontesProfHtml(turmaId, plano, aula){
  const ps = aula.pontes || []; if(!ps.length) return '';
  const cat = ponteCatalogo(plano);
  return `<div class="tr-aula pt-aula" data-pl-pontes-aula>${ps.map(x => { const p = cat.find(c => c.id===x.id); const pr = p ? ponteProntidao(turmaId, p) : null;
    return `<div>🌉 <b>Atividade ponte:</b> <span style="color:${esc(x.cor)}; font-weight:700;">${esc(x.titulo)}</span> — junto com ${ponteAulasTxt(x.outras)}${pr ? ` · <span class="muted">${pr.feitas} de ${pr.total} aulas dadas</span>` : ''}
      <button class="btn btn-ghost btn-sm" data-action="ponte-abrir" data-id="${esc(x.id)}" data-ir="1" style="width:auto; padding:2px 8px; margin-left:4px;">Ver roteiro</button></div>`; }).join('')}</div>`;
}
function ponteAlunoHtml(e, t){
  const al = state.aluno; if(!al.turma) return '';
  const s = trilhaSerieNum(e.plano.serie); const p = ponteCatalogo(e.plano).find(x => x.trilha===t.id && x.serie===s); if(!p) return '';
  const lib = ponteLiberadas(al.turma.id); if(!lib || !lib[p.id]) return '';
  return `<div class="card pt-aluno" data-ponte-aluno="${esc(p.id)}" style="border-left:6px solid ${p.cor};">
    <div class="muted" style="font-size:.76rem; letter-spacing:.05em;">🌉 ATIVIDADE PONTE · ${esc(p.disciplinas.join(' + '))}</div>
    <h3 style="margin:.2em 0; color:${p.cor};">${esc(p.titulo)}</h3>
    <div class="pt-problema">${esc(p.problema)}</div>
    <p style="font-size:.86rem; margin:6px 0;"><b>Vocês já estudaram:</b> ${p.aulas.map(x => `${esc(x.disc)}, aula ${x.n} (${esc(x.titulo)})`).join('; ')}.</p>
    ${(p.documentos||[]).map((d, i) => `<details class="tr-resp"><summary><b>Documento ${i+1}</b> · ${esc(d.disc)} — ${esc(d.titulo||'')}</summary><blockquote class="pt-trecho">${esc(d.trecho)}</blockquote><div class="muted" style="font-size:.76rem;">${esc(d.ref)}</div>${(d.perguntas||[]).length ? `<ol style="font-size:.84rem;">${d.perguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}</details>`).join('')}
    <p style="font-size:.88rem; margin:8px 0 4px;"><b>Tarefa do grupo:</b> ${esc(p.passos[2].txt)}</p>
    <p style="font-size:.88rem; margin:0 0 4px;"><b>Vocês vão entregar:</b> ${esc(p.produto)}</p>
    <details style="font-size:.84rem;"><summary>Como será avaliado</summary><ol>${p.criterios.map(c => `<li>${esc(c)}</li>`).join('')}</ol></details>
  </div>`;
}
async function planoResolverImagens(qs){ for(const q of qs||[]){ if(!q._imagemPlano) continue; const img = await planoLerJson(`plano-livro-img:${q._imagemPlano}`, null); if(img) q.image = img; delete q._imagemPlano; } }
function planoQuestoesParaAvaliacao(ex, mapa){
  const qs = ex.questoes || [];
  const nMc = qs.filter(q=>q.tipo==='mc').length;
  // Questões do livro (dissertativas): 1 questão vale 2 pontos; 2 ou mais dividem 3 pontos entre si.
  const nDiss = qs.filter(q=>q.tipo==='dissertativa').length;
  const ptsDissTotal = nDiss===0 ? 0 : nDiss===1 ? 2 : 3;
  const ptsDiss = nDiss ? Math.round(ptsDissTotal / nDiss * 100) / 100 : 0;
  const ptsMapa = mapa ? MAPA_PONTOS : 0;
  const ptsMc = nMc ? Math.round(((10 - ptsDissTotal - ptsMapa) / nMc) * 100) / 100 : 0;
  const extra = mapa ? [{ id: cryptoId(), type:'dissertativa', mapaCaderno:true, text: `📒 Mapa mental da aula, feito no caderno: centro “${mapa.centro}” e ${mapa.ramos.length} ramos (${mapa.ramos.map(r => r.t).join(' · ')}), com palavras-chave e pelo menos um desenho. Esta questão é o visto do professor no seu caderno.`, points: ptsMapa, image:null, annulled:false, descritorSaeb:'', conteudo:'', modelAnswer: `Centro: ${mapa.centro}. Ramos: ` + mapa.ramos.map(r => `${r.t} (${r.itens.join(', ')})`).join('; ') }] : [];
  return qs.map(q => {
    if(q.tipo==='mc'){
      const options = q.opcoes.map(t => ({ id: cryptoId(), text: t }));
      return { id: cryptoId(), type:'mc', text: q.texto, points: ptsMc, image:null, annulled:false, descritorSaeb: q.habilidade ? 'ENEM ' + q.habilidade : '', conteudo:'', options, correctOptionId: options[q.correta] ? options[q.correta].id : null, explicacao: saeseExplicacao(q), saese: saeseDeQuestaoPlano(q), ...(q.imagem ? { _imagemPlano: q.imagem } : {}) };
    }
    return { id: cryptoId(), type:'dissertativa', text: q.texto, points: ptsDiss, image:null, annulled:false, descritorSaeb:'', conteudo:'', modelAnswer: q.modelo||'', saese: saeseDeQuestaoPlano(q) };
  }).concat(extra);
}
function planoMapaDoExercicio(turmaId, aula){ return (planoCfg(turmaId).mapaNoExercicio!==false && aula.slides && aula.slides.mapa) ? aula.slides.mapa : null; }
const CURSOS_NOMES = { PG:'Petróleo e Gás', ST:'Segurança do Trabalho', EM:'Eletromecânica' };
function planoCursosHtml(turmaId, aula){
  const c = aula && aula.cursos; if(!c) return '';
  const t = (state.professor.turmas||[]).find(x => x.id===turmaId);
  const nome = ((t && t.name) || '').toUpperCase().replace(/\s+/g, '');
  const meu = Object.keys(c).find(k => nome.includes(k));
  const lista = meu ? [meu] : Object.keys(c);
  return `<div data-plano-cursos style="margin:0 0 8px; font-size:.86rem; background:#f3f7fb; border-left:3px solid #1F4E79; border-radius:6px; padding:6px 10px;">🔧 <strong>Conexão com o curso</strong>${lista.map(k => `<div style="margin-top:2px;"><b>${esc(CURSOS_NOMES[k]||k)}:</b> ${esc(c[k])}</div>`).join('')}</div>`;
}
async function aplicarExercicioPlano(turmaId, n){
  const s = planoState();
  const plano = s.planos[s.turmaPlano[turmaId]];
  const aula = plano && plano.aulas.find(a=>a.n===n);
  if(!aula || !aula.exercicio){ alert('Esta aula ainda não tem exercício de fixação pronto.'); return; }
  const prog = s.prog[turmaId] || { dadas:{}, exercicios:{} };
  if(prog.exercicios && prog.exercicios[n]){ alert('O exercício desta aula já foi aplicado a esta turma (código ' + prog.exercicios[n] + ').'); return; }
  const valeNota = s.valeNota[n] !== false;
  const prazoDias = s.prazo[n]!=null ? s.prazo[n] : '7';
  const turma = (state.professor.turmas||[]).find(t=>t.id===turmaId);
  const unidade = UNIDADES[Math.max(0, Math.min(3, (aula.bimestre||1)-1))];
  const disc = planoDisciplinaDoProfessor(plano.disciplina||'');
  const sess = state.professor.session;
  const code = genCode();
  const assessment = {
    code,
    title: aula.exercicio.titulo || `Exercício de fixação — Aula ${n}`,
    instrumento: 'exercicios',
    unidade,
    disciplinaId: disc ? disc.id : null,
    disciplinaName: disc ? disc.name : (plano.disciplina||null),
    turmaIds: [turmaId],
    questions: planoQuestoesParaAvaliacao(aula.exercicio, planoMapaDoExercicio(turmaId, aula)),
    startAt: null, endAt: planoPrazoParaEndAt(prazoDias), agendaTurmas: {},
    resultRelease: { mode:'imediato', releaseAt:'' },
    securityEnabled: false,
    minMinutesPerQuestion: null,
    exigeLiberacao: false,
    valeNota,
    origemPlano: { planoId: plano.id, aula: n, turmaId },
    professorId: sess ? sess.id : null,
    professorName: sess ? sess.displayName : 'Coordenação',
    createdAt: Date.now(), updatedAt: null,
  };
  assessment.questions = await pnpGarantirExercicio(assessment.questions, plano, aula, turmaId);
  await planoResolverImagens(assessment.questions);
  // Níveis: versão de apoio (3 alternativas) para os alunos escolhidos e desafio extra para quem fizer 80%+
  const apoioIds = planoApoioSel(turmaId).filter(id => ((turma && turma.students)||[]).some(st => st.id===id));
  const extras = [];
  if(apoioIds.length){
    const nomesApoio = ((turma && turma.students)||[]).filter(st => apoioIds.includes(st.id)).map(st => st.name);
    assessment.excetoAlunos = apoioIds.slice(); assessment.excetoAlunosNomes = nomesApoio;
    const codeA = genCode();
    extras.push({ tipo:'apoio', a: Object.assign({}, assessment, { code: codeA, title: assessment.title + ' (versão de apoio)', questions: planoQuestoesApoio(assessment.questions),
      excetoAlunos: undefined, excetoAlunosNomes: undefined, somenteAlunos: apoioIds.slice(), somenteAlunosNomes: nomesApoio, origemPlano: Object.assign({}, assessment.origemPlano, { apoio: true }) }) });
  }
  if(aula.exercicio.desafio){
    const q = aula.exercicio.desafio; const options = q.opcoes.map(t => ({ id: cryptoId(), text: t }));
    const qd = { id: cryptoId(), type:'mc', text: q.texto, points: 10, image:null, annulled:false, descritorSaeb: q.habilidade ? 'ENEM ' + q.habilidade : '', conteudo:'Desafio', options, correctOptionId: options[q.correta].id, explicacao: saeseExplicacao(q), saese: saeseDeQuestaoPlano(q) };
    if(q.comando) qd.comando = q.comando;
    const codeD = genCode();
    assessment.desafioCode = codeD;
    extras.push({ tipo:'desafio', a: Object.assign({}, assessment, { code: codeD, title: `⭐ Desafio extra — Aula ${n}`, questions: [qd], valeNota: false, endAt: null, desafioCode: undefined,
      excetoAlunos: undefined, excetoAlunosNomes: undefined, origemPlano: Object.assign({}, assessment.origemPlano, { desafio: true }) }) });
  }
  await window.storage.set(`assessment:${code}`, JSON.stringify(assessment), true);
  (state.professor.assessments = state.professor.assessments||[]).unshift(assessment);
  for(const x of extras){ const limpo = JSON.parse(JSON.stringify(x.a)); await window.storage.set(`assessment:${limpo.code}`, JSON.stringify(limpo), true); state.professor.assessments.unshift(limpo); }
  if(state.coordenador && Array.isArray(state.coordenador.assessments)) state.coordenador.assessments.unshift(assessment);
  const fresh = await planoLerJson(`plano-livro-prog:${planoTK(turmaId)}`, prog);
  fresh.dadas = fresh.dadas || {}; fresh.exercicios = fresh.exercicios || {};
  fresh.exercicios[n] = code;
  extras.forEach(x => { if(x.tipo==='apoio') fresh.apoio = Object.assign({}, fresh.apoio||{}, { [n]: { code: x.a.code, alunos: x.a.somenteAlunos } }); if(x.tipo==='desafio') fresh.desafios = Object.assign({}, fresh.desafios||{}, { [n]: x.a.code }); });
  s.prog[turmaId] = fresh; s.painel = null;
  await planoSalvarProg(turmaId);
  s.msg = `✅ Exercício da aula ${n} aplicado à turma ${turma?turma.name:''} — código ${code}. ${valeNota ? 'Vale nota (entra em Exercícios de fixação da ' + unidade + ').' : 'Não vale nota (só para treino).'} ${assessment.endAt ? 'Prazo: até ' + planoDataCurta(assessment.endAt) + ', 23h59.' : 'Sem prazo.'} Os alunos já veem em “Provas”.${apoioIds.length ? ` Versão de apoio para ${apoioIds.length} aluno(s).` : ''}${aula.exercicio.desafio ? ' ⭐ Desafio extra liberado para quem acertar 80% ou mais.' : ''}`;
  render();
}
async function planoTrocarValeNota(code, vale){
  let a = null;
  try{ const r = await window.storage.get(`assessment:${code}`, true); a = JSON.parse(r.value); }catch(e){}
  if(!a){ alert('Não encontrei esse exercício (pode ter sido excluído).'); return; }
  a.valeNota = !!vale; a.updatedAt = Date.now();
  await window.storage.set(`assessment:${code}`, JSON.stringify(a), true);
  [state.professor.assessments, state.coordenador && state.coordenador.assessments].forEach(lista => {
    if(!Array.isArray(lista)) return;
    const i = lista.findIndex(x=>x.code===code); if(i>=0) lista[i] = a;
  });
  planoState().msg = vale ? `O exercício ${code} agora VALE nota.` : `O exercício ${code} agora NÃO vale nota (fica só como treino).`;
  render();
}
function planoPrazoParaEndAt(dias){
  if(!dias) return null;
  const d = new Date(); d.setDate(d.getDate() + Number(dias));
  const z = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T23:59`;
}
function planoDataCurta(endAt){ if(!endAt) return ''; const d = new Date(endAt); return isNaN(d) ? '' : d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }); }
async function planoEstenderPrazo(code, dias){
  let a = null;
  try{ const r = await window.storage.get(`assessment:${code}`, true); a = JSON.parse(r.value); }catch(e){}
  if(!a) return;
  const base = a.endAt && new Date(a.endAt).getTime() > Date.now() ? new Date(a.endAt) : new Date();
  base.setDate(base.getDate() + Number(dias));
  const z = n => String(n).padStart(2,'0');
  a.endAt = dias==='0' ? null : `${base.getFullYear()}-${z(base.getMonth()+1)}-${z(base.getDate())}T23:59`;
  if(a.agendaTurmas) Object.keys(a.agendaTurmas).forEach(t => { if(a.agendaTurmas[t]) a.agendaTurmas[t].endAt = ''; });
  a.updatedAt = Date.now();
  await window.storage.set(`assessment:${code}`, JSON.stringify(a), true);
  [state.professor.assessments, state.coordenador && state.coordenador.assessments].forEach(lista => { if(!Array.isArray(lista)) return; const i = lista.findIndex(x=>x.code===code); if(i>=0) lista[i] = a; });
  planoState().msg = a.endAt ? `Prazo do exercício ${code} agora vai até ${planoDataCurta(a.endAt)}, 23h59.` : `O exercício ${code} ficou sem prazo.`;
  render();
}
function planoAvaliacaoPorCodigo(code){
  return (state.professor.assessments||[]).find(a=>a.code===code) || ((state.coordenador&&state.coordenador.assessments)||[]).find(a=>a.code===code) || null;
}
async function planoPdfParaDeck(file, title, onProgress){
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const total = Math.min(pdf.numPages, SLIDES_MAX_PAGES);
  const deckId = cryptoId();
  for(let i=1; i<=total; i++){
    if(onProgress) onProgress(i, total);
    let dataUrl;
    try{
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      const scale = 1280 / vp.width;
      const svp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(svp.width); canvas.height = Math.round(svp.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      await page.render({ canvasContext: ctx, viewport: svp }).promise;
      dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      if(dataUrl.length > 950000) dataUrl = canvas.toDataURL('image/jpeg', 0.35);
    }catch(e){ dataUrl = slideFailurePlaceholder(i); }
    try{ await window.storage.set(`slide-img:${deckId}:${i-1}`, JSON.stringify(dataUrl), true); }
    catch(e){ await window.storage.set(`slide-img:${deckId}:${i-1}`, JSON.stringify(slideFailurePlaceholder(i)), true); }
  }
  const meta = { id: deckId, title, totalSlides: total, createdAt: Date.now(), professorName: state.professor.session ? state.professor.session.displayName : 'Coordenação', origemPlano: true };
  const decks = await planoLerJson('slides-decks', []);
  decks.push(meta);
  await window.storage.set('slides-decks', JSON.stringify(decks), true);
  state.professor.slides.decks = decks;
  return meta;
}
function planoNumeroDoArquivo(nome){
  const m = String(nome||'').match(/aula[\s_-]*0*(\d{1,3})/i) || String(nome||'').match(/^0*(\d{1,3})\b/);
  return m ? parseInt(m[1],10) : null;
}
async function enviarSlidesPlano(files, planoId, nFixo){
  const s = planoState();
  const plano = s.planos[planoId];
  if(!plano){ alert('Escolha primeiro a turma (e o plano dela).'); return; }
  const lista = Array.from(files||[]).filter(f => /\.pdf$/i.test(f.name) || f.type==='application/pdf');
  if(!lista.length){ alert('Selecione arquivos PDF (por exemplo: aula-01.pdf, aula-02.pdf...).'); return; }
  const mapa = await planoLerJson(`plano-livro-slides:${planoId}`, {});
  const ignorados = [];
  s.erro = ''; s.msg = '';
  for(let k=0; k<lista.length; k++){
    const f = lista[k];
    const n = nFixo || planoNumeroDoArquivo(f.name);
    const aula = n && plano.aulas.find(a=>a.n===n);
    if(!aula){ ignorados.push(f.name); continue; }
    if(f.size > SLIDES_MAX_FILE_MB*1024*1024){ ignorados.push(f.name + ' (grande demais)'); continue; }
    try{
      const meta = await planoPdfParaDeck(f, `Aula ${String(n).padStart(2,'0')} — ${aula.tituloCurto || aula.tema}`, (i,total) => { s.enviando = { atual:k+1, total:lista.length, texto:`Aula ${n}: slide ${i} de ${total}` }; render(); });
      mapa[n] = { deckId: meta.id, title: meta.title, totalSlides: meta.totalSlides };
      await window.storage.set(`plano-livro-slides:${planoId}`, JSON.stringify(mapa), true);
    }catch(e){ ignorados.push(f.name + ' (não abriu)'); }
  }
  s.slides[planoId] = mapa;
  s.enviando = null;
  const ok = lista.length - ignorados.length;
  s.msg = `✅ ${ok} apresentação(ões) ligada(s) às aulas.` + (ignorados.length ? ` Não usei: ${ignorados.join(', ')} — o nome do arquivo precisa ter o número da aula (ex.: aula-07.pdf).` : '');
  render();
}
async function apresentarSlidesPlano(turmaId, n){
  const s = planoState();
  const planoId = s.turmaPlano[turmaId];
  const slot = s.slides[planoId] && s.slides[planoId][n];
  if(!slot){ alert('Esta aula ainda não tem slides enviados.'); return; }
  const p = state.professor;
  await loadSlidesDecks();
  if(!(p.slides.decks||[]).some(d=>d.id===slot.deckId)){ alert('A apresentação desta aula foi excluída. Envie o PDF de novo.'); return; }
  p.slides.selectedDeckId = slot.deckId;
  p.slides.turmaId = turmaId;
  if(state.view==='coordenador') state.coordenador.subview = 'slides'; else p.subview = 'slides';
  stopSlidesPoll();
  await iniciarApresentacaoSlides(state.view==='coordenador' ? 'Coordenação' : (p.session?p.session.displayName:'Professor'));
  p.slides.presentationMode = true;
  slidesPollInterval = setInterval(refreshProfessorSlides, 2000);
  render();
}
async function planoCarregarPainel(){
  const s = planoState();
  if(s.painelCarregando) return;
  s.painelCarregando = true; render();
  const turmas = planoTurmasVisiveis().filter(t => s.turmaPlano[t.id]);
  const linhas = await Promise.all(turmas.map(async t => {
    const plano = await planoObter(s.turmaPlano[t.id]);
    const prog = await planoLerJson(`plano-livro-prog:${planoTK(t.id)}`, { dadas:{}, exercicios:{} });
    const dadasTs = Object.values(prog.dadas||{});
    const ultima = dadasTs.length ? Math.max(...dadasTs) : null;
    const hoje = planoAulaDeHoje(plano, prog);
    const codes = Object.keys(prog.exercicios||{});
    const nomes = new Set((t.students||[]).map(st => nomeChave(st.name)));
    let somaPct = 0, contados = 0;
    const feitosPorAluno = {}; nomes.forEach(n => feitosPorAluno[n] = 0);
    await Promise.all(codes.map(async nAula => {
      const resp = await planoRespostasDaAula(prog, nAula);
      const fizeram = new Set(resp.map(r => nomeChave(r.studentName)).filter(n => nomes.has(n)));
      fizeram.forEach(n => feitosPorAluno[n]++);
      if(nomes.size){ somaPct += fizeram.size / nomes.size; contados++; }
    }));
    const semEntregar = codes.length ? Object.values(feitosPorAluno).filter(f => f/codes.length < 0.5).length : 0;
    const termo = Object.values(await planoLerJson(`plano-termometro:${planoTK(t.id)}`, {})).filter(x => x && x.total);
    const vistoDoc = await planoLerJson(`plano-visto:${planoTK(t.id)}`, {});
    const vistoVals = Object.values(vistoDoc||{}).flatMap(o => Object.values(o||{}));
    const cadernos = vistoVals.length ? Math.round(vistoVals.reduce((a,x) => a + (VISTO_FATOR[x.v]||0), 0) / vistoVals.length * 100) : null;
    const aulasComMapa = plano ? plano.aulas.filter(a => a.slides && a.slides.mapa && prog.dadas && prog.dadas[a.n]) : [];
    const semVisto = aulasComMapa.filter(a => !Object.keys((vistoDoc||{})[a.n]||{}).length).length;
    const termoOk = termo.length ? Math.round(termo.reduce((a,x)=>a + x.ok/x.total, 0)/termo.length*100) : null;
    const termoAlerta = termo.filter(x => x.nao/x.total >= 0.3).length;
    return { turmaId:t.id, turma:t.name, plano: plano ? plano.titulo : '?', total: plano ? plano.aulas.length : 0,
      dadas: dadasTs.length, aulaAtual: hoje ? hoje.n : null, temaAtual: hoje ? hoje.tema : 'plano concluído',
      ultima, exercicios: codes.length, entrega: contados ? Math.round(somaPct/contados*100) : null, semEntregar, termoOk, termoAlerta, termoN: termo.length, cadernos, semVisto };
  }));
  s.painel = { linhas, em: Date.now() };
  s.painelCarregando = false;
  render();
}
function renderPlanoPainel(){
  const s = planoState();
  if(!Object.keys(s.turmaPlano||{}).length) return '';
  let resumo = 'aulas dadas, entregas e alertas de cada turma';
  if(s.painel){
    const ls = s.painel.linhas, dia = 24*3600*1000;
    const sem = ls.filter(l => !l.ultima).length, parad = ls.filter(l => l.ultima && (Date.now()-l.ultima) > 10*dia).length;
    resumo = `${ls.length} turma(s)` + (sem ? ` · ${sem} ainda não começou` : '') + (parad ? ` · ${parad} parada(s)` : '') + (!sem && !parad ? ' · todas andando' : '');
  }
  return plGrupoHtml('andamento', '📊 Andamento das turmas', resumo, renderPlanoPainelCorpo, false);
}
function renderPlanoPainelCorpo(){
  const s = planoState();
  if(!s.painel && !s.painelCarregando){ setTimeout(()=>planoCarregarPainel(), 0); }
  if(!s.painel) return '<p class="muted">Carregando…</p>';
  const dia = 24*3600*1000;
  const linhas = s.painel.linhas.slice().sort((a,b)=>(a.turma||'').localeCompare(b.turma||'', 'pt-BR', {numeric:true}));
  const porPlano = {};
  linhas.forEach(l => { (porPlano[l.plano] = porPlano[l.plano] || []).push(l.dadas); });
  const mediana = arr => { const v = arr.slice().sort((a,b)=>a-b); return v.length ? v[Math.floor((v.length-1)/2)] : 0; };
  return `
    <div data-plano-painel>
      <div class="row" style="justify-content:flex-end; align-items:center; gap:8px; flex-wrap:wrap;">
        <span class="row" style="gap:6px; flex-wrap:wrap;"><button class="btn btn-ghost btn-sm" data-action="relatorio-abrir" data-escopo="todas" data-b="1">📈 Resultados de todas as turmas</button>
        <button class="btn btn-ghost btn-sm" data-action="plano-painel-atualizar">${s.painelCarregando?'⏳ Atualizando…':'↻ Atualizar'}</button></span>
      </div>
      <p class="muted" style="font-size:.84rem;">“Atrás das outras” compara com as turmas do mesmo plano. Quando o calendário de 2027 for ligado, a comparação passa a ser com a data prevista.</p>
      <div class="table-scroll"><table>
        <tr><th>Turma</th><th>Plano</th><th>Aulas dadas</th><th>Está na aula</th><th>Última aula marcada</th><th>Exercícios</th><th>Entrega média</th><th>Sem entregar</th><th>🌡️ Entenderam</th><th>📒 Cadernos</th><th></th></tr>
        ${linhas.map(l => {
          const pct = l.total ? Math.round(l.dadas/l.total*100) : 0;
          const atras = (porPlano[l.plano]||[]).length > 1 && l.dadas <= mediana(porPlano[l.plano]) - 3;
          const parado = l.ultima && (Date.now() - l.ultima) > 10*dia;
          const alertas = [atras ? '⚠️ atrás das outras' : '', parado ? '⏸ parada há ' + Math.floor((Date.now()-l.ultima)/dia) + ' dias' : '', !l.ultima ? '⏳ ainda não começou' : ''].filter(Boolean).join('<br>');
          return `<tr data-painel-turma="${esc(l.turmaId)}">
            <td><strong>${esc(l.turma)}</strong>${alertas?`<div style="font-size:.78rem; color:#a4521b;">${alertas}</div>`:''}</td>
            <td style="font-size:.82rem;">${esc(l.plano)}</td>
            <td>${l.dadas}/${l.total} <span class="muted">(${pct}%)</span><div style="background:#eee; border-radius:6px; height:6px; margin-top:3px;"><div style="width:${pct}%; height:100%; background:var(--wine,#6B1F2E); border-radius:6px;"></div></div></td>
            <td style="font-size:.84rem;">${l.aulaAtual ? 'Aula ' + l.aulaAtual + ' — ' + esc(l.temaAtual) : '🎉 ' + esc(l.temaAtual)}</td>
            <td>${l.ultima ? new Date(l.ultima).toLocaleDateString('pt-BR') : '—'}</td>
            <td>${l.exercicios}</td>
            <td>${l.entrega==null ? '—' : `<span style="color:${l.entrega<60?'#b3261e':l.entrega<80?'#a4521b':'#1d6b31'}; font-weight:600;">${l.entrega}%</span>`}</td>
            <td>${l.semEntregar ? `<span style="color:#b3261e; font-weight:700;">🚨 ${l.semEntregar}</span>` : (l.exercicios ? '0' : '—')}</td>
            <td data-painel-caderno>${l.cadernos==null ? '—' : `<span style="color:${l.cadernos<60?'#b3261e':'#1d6b31'}; font-weight:600;">${l.cadernos}%</span>`}${l.semVisto ? `<div style="font-size:.75rem; color:#a4521b;">${l.semVisto} aula(s) sem visto</div>` : ''}</td>
            <td data-painel-termo>${l.termoOk==null ? '—' : `<span style="color:${l.termoOk<60?'#b3261e':'#1d6b31'}; font-weight:600;">${l.termoOk}%</span>${l.termoAlerta ? `<div style="font-size:.75rem; color:#b3261e;">${l.termoAlerta} aula(s) para retomar</div>` : ''}`}</td>
            <td><button class="btn btn-ghost btn-sm" data-action="plano-ver-turma" data-tid="${esc(l.turmaId)}">Ver</button></td>
          </tr>`; }).join('')}
      </table></div>
      <p class="muted" style="font-size:.8rem;">Entrega média = em média, quantos alunos da turma responderam os exercícios aplicados pelo plano. Sem entregar = alunos que fizeram menos da metade (os nomes aparecem em “Habilidades e entregas”, ao clicar em Ver). 🌡️ Entenderam = média do termômetro de fim de aula (😀); “para retomar” = aulas em que 30% ou mais marcaram 😕. 📒 Cadernos = mapas mentais com visto (completo = 100%, incompleto = 50%).</p>
    </div>`;
}
async function planoAnalisarErros(turmaId){
  const s = planoState();
  s.errosCarregando = turmaId; render();
  const plano = s.planos[s.turmaPlano[turmaId]];
  const prog = s.prog[turmaId] || { exercicios:{} };
  const turma = (state.professor.turmas||[]).find(t=>t.id===turmaId);
  const nomes = new Set(((turma && turma.students)||[]).map(st => nomeChave(st.name)));
  const porAula = [], questoes = [];
  await Promise.all(Object.entries(prog.exercicios||{}).map(async ([nStr, code]) => {
    const n = parseInt(nStr);
    const aula = plano && plano.aulas.find(a=>a.n===n);
    const av = await planoLerJson(`assessment:${code}`, null) || planoAvaliacaoPorCodigo(code);
    if(!av) return;
    const resp = (await planoLerJson(`responses:${code}`, [])).filter(r => !nomes.size || nomes.has(nomeChave(r.studentName)));
    let acertosAula = 0, totalAula = 0;
    (av.questions||[]).forEach((q, qi) => {
      if(q.type!=='mc' || q.annulled) return;
      let tot = 0, cert = 0; const erradas = {};
      resp.forEach(r => {
        const ans = r.answers ? r.answers[q.id] : undefined;
        if(ans===undefined || ans===null) return;
        tot++;
        if(ans===q.correctOptionId) cert++; else erradas[ans] = (erradas[ans]||0) + 1;
      });
      if(!tot) return;
      acertosAula += cert; totalAula += tot;
      const top = Object.entries(erradas).sort((a,b)=>b[1]-a[1])[0];
      const optTxt = id => { const o = q.options.find(x=>x.id===id); return o ? o.text : ''; };
      questoes.push({ n, qi, code, tema: aula ? (aula.tituloCurto||aula.tema) : ('Aula '+n), texto: q.text, pct: Math.round(cert/tot*100), respostas: tot,
        certa: optTxt(q.correctOptionId), errada: top ? optTxt(top[0]) : '', erradaQtd: top ? top[1] : 0, q });
    });
    if(totalAula) porAula.push({ n, tema: aula ? (aula.tituloCurto||aula.tema) : ('Aula '+n), paginas: aula ? aula.paginas : '', pct: Math.round(acertosAula/totalAula*100), alunos: resp.length });
  }));
  porAula.sort((a,b)=>a.pct-b.pct || a.n-b.n);
  questoes.sort((a,b)=>a.pct-b.pct || a.n-b.n);
  s.erros[turmaId] = { porAula, questoes, em: Date.now() };
  s.errosCarregando = null;
  render();
}
function renderPlanoErros(turmaId, destaque){
  const s = planoState();
  const prog = s.prog[turmaId] || {};
  if(!Object.keys(prog.exercicios||{}).length) return '';
  const e = s.erros[turmaId];
  const cor = p => p < 50 ? '#b3261e' : p < 70 ? '#a4521b' : '#1d6b31';
  let corpo;
  if(s.errosCarregando===turmaId) corpo = '<p>⏳ Analisando as respostas…</p>';
  else if(!e) corpo = `<button class="btn btn-primary btn-sm" data-action="plano-analisar-erros">📉 Analisar as respostas da turma</button>`;
  else if(!e.questoes.length) corpo = '<p class="muted">Ainda não há respostas nos exercícios aplicados.</p>';
  else {
    const fracas = e.porAula.filter(a=>a.pct<70);
    const rev = e.questoes.filter(q=>q.pct<70).slice(0,10);
    corpo = `
      <p style="margin:0 0 6px;"><strong>Conteúdos para revisar</strong> (aulas com menos de 70% de acerto):</p>
      ${fracas.length ? `<ul style="margin:0 0 10px 18px;">${fracas.slice(0,6).map(a => `<li><span style="color:${cor(a.pct)}; font-weight:700;">${a.pct}%</span> — Aula ${a.n}: ${esc(a.tema)}${a.paginas?` <span class="muted">(livro ${esc(a.paginas)})</span>`:''} <span class="muted">· ${a.alunos} aluno(s)</span></li>`).join('')}</ul>` : '<p class="muted">🎉 A turma passou de 70% de acerto em todas as aulas.</p>'}
      <details ${destaque?'open':''}><summary style="cursor:pointer; font-weight:600;">Questões mais erradas (${Math.min(8, e.questoes.length)})</summary>
        <div class="table-scroll"><table style="font-size:.85rem;">
          <tr><th>Acerto</th><th>Aula</th><th>Questão</th><th>Resposta certa</th><th>Erro mais comum</th></tr>
          ${e.questoes.slice(0,8).map(q => `<tr><td style="color:${cor(q.pct)}; font-weight:700;">${q.pct}%</td><td>${q.n}</td><td style="max-width:320px;">${esc(q.texto)}</td><td>${esc(q.certa)}</td><td>${q.errada ? esc(q.errada) + ` <span class="muted">(${q.erradaQtd})</span>` : '—'}</td></tr>`).join('')}
        </table></div>
      </details>
      <div class="row" style="gap:8px; flex-wrap:wrap; align-items:center; margin-top:10px;">
        ${rev.length ? `<button class="btn btn-sm" style="background:var(--blue,#1F4E79); color:#fff;" data-action="plano-aplicar-revisao">📝 Aplicar lista de revisão (${rev.length} questões mais erradas)</button>
          <label style="font-size:.85rem; cursor:pointer;"><input type="checkbox" data-action="plano-revisao-vale" ${s.revisaoVale?'checked':''} style="width:auto;"> Vale nota</label>` : ''}
        <button class="btn btn-ghost btn-sm" data-action="plano-analisar-erros">↻ Atualizar</button>
        <span class="muted" style="font-size:.8rem;">Atualizado às ${new Date(e.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
      </div>`;
  }
  return `<div class="card" data-plano-erros style="${destaque?'border:2px solid #a4521b;':''}">
    <h3 style="margin-top:0;">📉 O que a turma mais errou</h3>
    <p class="muted" style="font-size:.85rem; margin-top:0;">Junta as respostas de todos os exercícios aplicados pelo plano nesta turma. Use na aula de revisão para focar no que a turma não entendeu.</p>
    ${corpo}</div>`;
}
function planoClonarQuestao(q, pontos){
  const c = cloneQuestionForUse(q);
  c.points = pontos;
  return c;
}
function planoPontosIguais(qs, total){
  if(!qs.length) return qs;
  const base = Math.floor((total / qs.length) * 100) / 100;
  qs.forEach(q => q.points = base);
  qs[qs.length-1].points = Math.round((total - base*(qs.length-1))*100)/100;
  return qs;
}
async function aplicarListaRevisao(turmaId){
  const s = planoState();
  const e = s.erros[turmaId];
  if(!e) return;
  const rev = e.questoes.filter(q=>q.pct<70).slice(0,10);
  if(!rev.length) return;
  const plano = s.planos[s.turmaPlano[turmaId]];
  const bim = Math.max(...rev.map(q => { const a = plano.aulas.find(x=>x.n===q.n); return a ? a.bimestre : 1; }));
  const disc = planoDisciplinaDoProfessor(plano.disciplina||'');
  const sess = state.professor.session;
  const code = genCode();
  const assessment = {
    code, title: `Revisão — o que a turma mais errou (${plano.disciplina||''} ${bim}º bim.)`,
    instrumento:'exercicios', unidade: UNIDADES[Math.max(0, Math.min(3, bim-1))],
    disciplinaId: disc ? disc.id : null, disciplinaName: disc ? disc.name : (plano.disciplina||null),
    turmaIds:[turmaId], questions: planoPontosIguais(rev.map(q => planoClonarQuestao(q.q, 1)), 10),
    startAt:null, endAt: planoPrazoParaEndAt('7'), agendaTurmas:{}, resultRelease:{ mode:'imediato', releaseAt:'' },
    securityEnabled:false, minMinutesPerQuestion:null, exigeLiberacao:false, valeNota: !!s.revisaoVale,
    origemPlano:{ planoId: plano.id, revisao:true, turmaId },
    professorId: sess ? sess.id : null, professorName: sess ? sess.displayName : 'Coordenação', createdAt: Date.now(), updatedAt:null,
  };
  await window.storage.set(`assessment:${code}`, JSON.stringify(assessment), true);
  (state.professor.assessments = state.professor.assessments||[]).unshift(assessment);
  if(state.coordenador && Array.isArray(state.coordenador.assessments)) state.coordenador.assessments.unshift(assessment);
  s.msg = `✅ Lista de revisão aplicada (código ${code}) com as ${rev.length} questões mais erradas. ${assessment.valeNota ? 'Vale nota.' : 'Não vale nota (treino).'} Prazo de 7 dias. Os alunos veem a explicação de cada questão ao terminar.`;
  render();
}
function planoSugerirSelecao(turmaId, bimestre, fonte){
  const s = planoState();
  const plano = s.planos[s.turmaPlano[turmaId]];
  const aulas = plano.aulas.filter(a => a.bimestre===bimestre && a.exercicio);
  const erros = s.erros[turmaId];
  const sel = {};
  const qtd = () => Object.keys(sel).length;
  // (a) questões dos exercícios: as mais erradas pela turma (até 5, no máximo 2 por aula)
  const maisErradas = (limite) => {
    if(!erros) return;
    const porAula = {};
    erros.questoes.filter(q => q.pct<70 && aulas.some(a=>a.n===q.n)).forEach(q => {
      if(qtd() >= limite || (porAula[q.n]||0) >= 2) return;
      sel[`${q.n}:${q.qi}`] = true; porAula[q.n] = (porAula[q.n]||0) + 1;
    });
  };
  // (b) completa com uma questão por aula (rodízio), do tipo pedido
  const completar = (limite, tipo, ordemAulas) => {
    let rodada = 0;
    while(qtd() < limite && rodada < 5){
      for(const a of ordemAulas){
        if(qtd() >= limite) break;
        const lista = tipo==='p'
          ? (a.exercicio.questoesProva||[]).map((q,qi)=>({ k:`${a.n}:p${qi}` }))
          : a.exercicio.questoes.map((q,qi)=>({ q, k:`${a.n}:${qi}` })).filter(x=>x.q.tipo==='mc');
        const livres = lista.filter(x => !sel[x.k]);
        const jaTem = Object.keys(sel).filter(k => k.startsWith(a.n+':')).length;
        if(livres.length && jaTem <= rodada) sel[livres[(a.n + rodada) % livres.length].k] = true;
      }
      rodada++;
    }
  };
  // aulas em que a turma foi pior vêm primeiro (para as inéditas cobrirem o que precisa)
  const pctAula = n => { const x = erros && erros.porAula.find(a=>a.n===n); return x ? x.pct : 100; };
  const piores = aulas.slice().sort((a,b) => pctAula(a.n) - pctAula(b.n) || a.n - b.n);
  if(fonte==='ineditas'){ completar(10, 'p', piores); }
  else if(fonte==='misturar'){ maisErradas(5); completar(5, 'x', aulas); completar(10, 'p', piores); }
  else { maisErradas(5); completar(10, 'x', aulas); }
  return sel;
}
function planoAbrirMontarProva(turmaId, bimestre){
  const s = planoState();
  const fonte = 'exercicios';
  s.montarProva = { turmaId, bimestre, fonte, sel: planoSugerirSelecao(turmaId, bimestre, fonte) };
  render();
  setTimeout(() => { const el = document.querySelector('[data-montar-prova]'); if(el) el.scrollIntoView({ behavior:'smooth', block:'start' }); }, 50);
}
function renderMontarProva(){
  const s = planoState(); const m = s.montarProva;
  if(!m) return '';
  const plano = s.planos[s.turmaPlano[m.turmaId]];
  if(!plano) return '';
  const prog = s.prog[m.turmaId] || { dadas:{} };
  const aulas = plano.aulas.filter(a => a.bimestre===m.bimestre && a.exercicio);
  const erros = s.erros[m.turmaId];
  const pctDe = (n, qi) => { const q = erros && erros.questoes.find(x=>x.n===n && x.qi===qi); return q ? q.pct : null; };
  const nSel = Object.values(m.sel).filter(Boolean).length;
  const pts = nSel ? (10/nSel).toFixed(2).replace('.',',') : '0';
  return `<div class="card" data-montar-prova style="border:2px solid var(--wine,#6B1F2E);">
    <div class="row" style="justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
      <h3 style="margin:0;">📝 Montar a prova do ${m.bimestre}º bimestre</h3>
      <button class="btn btn-ghost btn-sm" data-action="plano-fechar-prova">Fechar</button>
    </div>
    ${(() => {
      const temIneditas = aulas.some(a => (a.exercicio.questoesProva||[]).length);
      const op = (v, t, d) => `<label style="display:flex; gap:8px; align-items:flex-start; font-weight:400; text-transform:none; margin:4px 0; cursor:pointer; ${!temIneditas && v!=='exercicios' ? 'opacity:.5;' : ''}">
          <input type="radio" name="plano-fonte" data-action="plano-prova-fonte" value="${v}" ${m.fonte===v?'checked':''} ${!temIneditas && v!=='exercicios' ? 'disabled' : ''} style="width:auto; margin-top:3px;">
          <span><strong>${t}</strong><br><span class="muted" style="font-size:.82rem;">${d}</span></span></label>`;
      return `<div style="background:#f7f3ea; border-radius:8px; padding:8px 12px; margin:8px 0;">
        <div style="font-weight:700; margin-bottom:4px;">Quais questões usar?</div>
        ${op('exercicios','Dos exercícios de fixação','A turma já resolveu. Bom para conferir se aprendeu com a correção — mas favorece quem decorou.')}
        ${op('ineditas','Inéditas (a turma nunca viu)','2 questões novas por aula, feitas só para prova. Mede melhor o aprendizado.')}
        ${op('misturar','Misturar','Metade dos exercícios (as mais erradas) e metade inéditas.')}
        ${temIneditas ? '' : '<p class="muted" style="font-size:.8rem; margin:4px 0 0;">Este plano ainda não tem questões inéditas. Peça à coordenação para importar o arquivo do plano atualizado.</p>'}
      </div>`;
    })()}
    <p class="muted" style="font-size:.86rem;">Já deixei 10 sugeridas — ${m.fonte==='ineditas' ? 'começando pelas aulas em que a turma acertou menos.' : m.fonte==='misturar' ? 'as mais erradas pela turma e inéditas das aulas mais fracas.' : (erros ? 'primeiro as que a turma mais errou e depois uma por aula.' : 'uma por aula.')} Marque ou desmarque à vontade. Depois você confere tudo no formulário normal da prova (datas, liberação, papel).</p>
    <div style="position:sticky; top:0; background:var(--card-bg,#fff); padding:6px 0; z-index:1;"><strong>${nSel} questão(ões) selecionada(s)</strong> · ${pts} ponto(s) cada · total 10
      <button class="btn btn-primary btn-sm" data-action="plano-criar-prova" style="margin-left:8px;" ${nSel?'':'disabled'}>Continuar no formulário da prova →</button></div>
    ${aulas.map(a => `
      <details ${Object.keys(m.sel).some(k => m.sel[k] && k.startsWith(a.n+':'))?'open':''} style="margin:6px 0;">
        <summary style="cursor:pointer;"><strong>Aula ${a.n}</strong> — ${esc(a.tituloCurto||a.tema)} ${prog.dadas&&prog.dadas[a.n]?'':'<span class="muted">(ainda não dada)</span>'} · ${Object.keys(m.sel).filter(k => m.sel[k] && k.startsWith(a.n+':')).length} marcada(s)${(() => { const x = erros && erros.porAula.find(y=>y.n===a.n); return x ? ` · <span style="color:${x.pct<50?'#b3261e':x.pct<70?'#a4521b':'#1d6b31'};">turma acertou ${x.pct}%</span>` : ''; })()}</summary>
        ${m.fonte!=='exercicios' ? (a.exercicio.questoesProva||[]).map((q,qi) => `
          <label style="display:flex; gap:8px; align-items:flex-start; font-weight:400; text-transform:none; margin:6px 0 6px 10px; font-size:.88rem;">
            <input type="checkbox" data-action="plano-prova-q" data-k="${a.n}:p${qi}" ${m.sel[`${a.n}:p${qi}`]?'checked':''} style="width:auto; margin-top:3px;">
            <span><span style="background:#e6f0fa; color:#1F4E79; border-radius:6px; padding:0 6px; font-size:.75rem; font-weight:700;">${q.fonteLivro ? '📖 DO LIVRO · ' + esc(q.fonteLivro) : 'INÉDITA · ENEM' + (q.habilidade?' '+esc(q.habilidade):'')}</span>${q.imagem?' <span title="tem imagem do livro">🖼️</span>':''}
              <span style="display:block; font-size:.82rem; color:#555; white-space:pre-line; margin:2px 0;">${esc(q.texto)}</span>
              ${q.comando?`<strong>${esc(q.comando)}</strong>`:''}<br><span class="muted">✓ ${esc(q.opcoes[q.correta]||'')}</span></span>
          </label>`).join('') : ''}
        ${m.fonte==='ineditas' ? '' : a.exercicio.questoes.map((q,qi) => q.tipo!=='mc' ? '' : (() => { const p = pctDe(a.n, qi); return `
          <label style="display:flex; gap:8px; align-items:flex-start; font-weight:400; text-transform:none; margin:6px 0 6px 10px; font-size:.88rem;">
            <input type="checkbox" data-action="plano-prova-q" data-k="${a.n}:${qi}" ${m.sel[`${a.n}:${qi}`]?'checked':''} style="width:auto; margin-top:3px;">
            <span><span style="background:#f3ece0; color:#7a5a1f; border-radius:6px; padding:0 6px; font-size:.75rem; font-weight:700;">EXERCÍCIO</span> ${esc(q.texto)} ${p!=null ? `<span style="font-weight:700; color:${p<50?'#b3261e':p<70?'#a4521b':'#1d6b31'};">(${p}% de acerto)</span>` : ''}<br><span class="muted">✓ ${esc(q.opcoes[q.correta]||'')}</span></span>
          </label>`; })()).join('')}
      </details>`).join('')}
  </div>`;
}
async function planoCriarProva(){
  const s = planoState(); const m = s.montarProva; const p = state.professor;
  if(state.view==='coordenador'){ alert('Para montar a prova, entre no painel do professor (Professores → 👁 Entrar no painel) e abra o Plano de Aulas do Livro por lá.'); return; }
  const plano = s.planos[s.turmaPlano[m.turmaId]];
  const questoes = [];
  plano.aulas.filter(a => a.bimestre===m.bimestre && a.exercicio).forEach(a => {
    const add = (q, inedita) => {
      const options = q.opcoes.map(t => ({ id: cryptoId(), text: t }));
      const nova = { id: cryptoId(), type:'mc', text: q.texto, points: 1, image:null, annulled:false, descritorSaeb: q.habilidade ? 'ENEM ' + q.habilidade : '', conteudo: `Aula ${a.n} — ${a.tituloCurto||a.tema}`, options, correctOptionId: options[q.correta].id, explicacao: saeseExplicacao(q), saese: saeseDeQuestaoPlano(q), inedita: !!inedita };
      if(q.comando) nova.comando = q.comando;
      if(q.imagem) nova._imagemPlano = q.imagem;
      questoes.push(nova);
    };
    a.exercicio.questoes.forEach((q,qi) => { if(m.sel[`${a.n}:${qi}`] && q.tipo==='mc') add(q, false); });
    (a.exercicio.questoesProva||[]).forEach((q,qi) => { if(m.sel[`${a.n}:p${qi}`]) add(q, true); });
  });
  if(!questoes.length) return;
  // busca as imagens (mapas e fotos do livro) guardadas na importação do plano
  let semImagem = 0;
  for(const q of questoes){
    if(!q._imagemPlano) continue;
    const img = await planoLerJson(`plano-livro-img:${q._imagemPlano}`, null);
    if(img) q.image = img; else semImagem++;
    delete q._imagemPlano;
  }
  planoPontosIguais(questoes, 10);
  const disc = planoDisciplinaDoProfessor(plano.disciplina||'');
  const na = freshAssessment();
  na.instrumento = 'avaliacao';
  na.unidade = UNIDADES[Math.max(0, Math.min(3, m.bimestre-1))];
  na.disciplinaId = disc ? disc.id : '';
  na.turmaIds = [m.turmaId];
  na.questions = questoes;
  p.newAssessment = na; p.editingCode = null; p.editingResponseCount = 0; p.pickerOpen = false; p.pickerSelected = [];
  s.montarProva = null;
  p.subview = 'avaliacoes'; p.mode = 'new';
  render();
  window.scrollTo(0,0);
  const nIned = questoes.filter(q=>q.inedita).length;
  alert(`Prova montada com ${questoes.length} questões (10 pontos)${nIned ? ` — ${nIned} inédita(s) no padrão ENEM` : ''}.${semImagem ? ` Atenção: ${semImagem} imagem(ns) não foram encontradas — peça à coordenação para importar o plano de novo.` : ''} Confira no formulário — datas, liberação e segurança — e clique em salvar. Para imprimir, use depois o Bloco de Provas.`);
}
function planoRegistroLinhas(turmaId, filtro){
  const s = planoState();
  const plano = s.planos[s.turmaPlano[turmaId]];
  const prog = s.prog[turmaId] || { dadas:{} };
  if(!plano) return [];
  return plano.aulas.filter(a => prog.dadas && prog.dadas[a.n]).map(a => ({ a, quando: prog.dadas[a.n] }))
    .filter(({ a, quando }) => {
      if(!filtro || filtro==='todas') return true;
      if(filtro.startsWith('b')) return a.bimestre === parseInt(filtro.slice(1));
      if(filtro.startsWith('m')){ const d = new Date(quando); return `${d.getFullYear()}-${d.getMonth()+1}` === filtro.slice(1); }
      return true;
    })
    .sort((x,y) => x.quando - y.quando || x.a.n - y.a.n)
    .map(({ a, quando }) => ({
      data: new Date(quando).toLocaleDateString('pt-BR'),
      aula: a.n,
      conteudo: a.tituloCurto || a.tema.replace(/\s*\(parte \d+ de \d+\)\s*$/,''),
      capitulo: a.capitulo || '',
      paginas: a.paginas || '',
      objetivo: a.objetivo || '',
      bncc: a.bncc || '',
      atividade: (a.exercicios_livro||[]).map(e => typeof e==='string'?e:(e.t||'')).join('; ') + (prog.exercicios && prog.exercicios[a.n] ? ((a.exercicios_livro||[]).length?'; ':'') + 'Exercício de fixação no app' : ''),
    }));
}
function planoRegistroTexto(linhas){
  return linhas.map(l => `${l.data} — Aula ${l.aula}: ${l.conteudo}${(l.capitulo||l.paginas)?` (${[l.capitulo, l.paginas?'livro '+l.paginas:''].filter(Boolean).join('; ')})`:''}.${l.bncc?` Habilidades: ${l.bncc}.`:''}${l.atividade?` Atividades: ${l.atividade}.`:''}`).join('\n');
}
function renderPlanoRegistro(turmaId){
  const s = planoState();
  if(!s.registroAberto) return `<button class="btn btn-ghost btn-sm" data-action="plano-registro-abrir">📋 Registro para o diário</button>`;
  const prog = s.prog[turmaId] || { dadas:{} };
  const meses = [...new Set(Object.values(prog.dadas||{}).map(t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()+1}`; }))].sort();
  const nomeMes = k => { const [y,m] = k.split('-'); return new Date(+y, +m-1, 1).toLocaleDateString('pt-BR', { month:'long', year:'numeric' }); };
  const filtro = s.registroFiltro || 'todas';
  const linhas = planoRegistroLinhas(turmaId, filtro);
  return `<div class="card" data-plano-registro>
    <div class="row" style="justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
      <h3 style="margin:0;">📋 Registro de conteúdo para o diário</h3>
      <button class="btn btn-ghost btn-sm" data-action="plano-registro-fechar">Fechar</button>
    </div>
    <p class="muted" style="font-size:.85rem;">Só entram as aulas marcadas como dadas, com a data em que foram marcadas. Copie e cole no diário da SEDUC, ou baixe a planilha.</p>
    <div class="row" style="gap:8px; flex-wrap:wrap; align-items:center;">
      <label style="font-size:.85rem;">Período: <select data-action="plano-registro-filtro" style="width:auto;">
        <option value="todas" ${filtro==='todas'?'selected':''}>Todas as aulas dadas</option>
        ${[1,2,3,4].map(b => `<option value="b${b}" ${filtro==='b'+b?'selected':''}>${b}º bimestre</option>`).join('')}
        ${meses.map(k => `<option value="m${k}" ${filtro==='m'+k?'selected':''}>${nomeMes(k)}</option>`).join('')}
      </select></label>
      <button class="btn btn-primary btn-sm" data-action="plano-registro-copiar" ${linhas.length?'':'disabled'}>📄 Copiar texto</button>
      <button class="btn btn-ghost btn-sm" data-action="plano-registro-xlsx" ${linhas.length?'':'disabled'}>⬇️ Baixar planilha</button>
    </div>
    ${linhas.length ? `<div class="table-scroll" style="margin-top:10px;"><table style="font-size:.84rem;">
      <tr><th>Data</th><th>Aula</th><th>Conteúdo</th><th>Livro</th><th>Habilidades (BNCC)</th><th>Atividades</th></tr>
      ${linhas.map(l => `<tr><td>${l.data}</td><td>${l.aula}</td><td>${esc(l.conteudo)}</td><td>${esc(l.paginas)}</td><td>${esc(l.bncc)}</td><td>${esc(l.atividade)}</td></tr>`).join('')}
    </table></div>` : '<p class="muted">Nenhuma aula dada nesse período.</p>'}
  </div>`;
}
async function planoRegistroCopiar(turmaId){
  const s = planoState();
  const txt = planoRegistroTexto(planoRegistroLinhas(turmaId, s.registroFiltro||'todas'));
  try{ await navigator.clipboard.writeText(txt); s.msg = '📄 Texto copiado. Agora é só colar no diário.'; }
  catch(e){ window.prompt('Copie o texto abaixo (Ctrl+C):', txt); }
  render();
}
function planoRegistroXlsx(turmaId){
  const s = planoState();
  const turma = (state.professor.turmas||[]).find(t=>t.id===turmaId);
  const linhas = planoRegistroLinhas(turmaId, s.registroFiltro||'todas');
  const ws = XLSX.utils.json_to_sheet(linhas.map(l => ({ 'Data': l.data, 'Aula': l.aula, 'Conteúdo': l.conteudo, 'Capítulo': l.capitulo, 'Livro': l.paginas, 'Objetivo': l.objetivo, 'Habilidades (BNCC)': l.bncc, 'Atividades': l.atividade })));
  ws['!cols'] = [{wch:11},{wch:6},{wch:50},{wch:40},{wch:12},{wch:50},{wch:30},{wch:40}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registro');
  XLSX.writeFile(wb, `registro-conteudo-${(turma?turma.name:'turma').replace(/[^a-z0-9]+/gi,'-')}.xlsx`);
}
function planoQuestaoPorChave(plano, k){
  // k = 'r:n:i' (banco da recuperação) · 'p:n:i' (inédita de prova) · 'x:n:i' (exercício)
  const [tipo, nS, iS] = String(k).split(':');
  const aula = plano.aulas.find(a=>a.n===parseInt(nS));
  if(!aula || !aula.exercicio) return null;
  const lista = tipo==='r' ? aula.exercicio.questoesRecuperacao : tipo==='p' ? aula.exercicio.questoesProva : aula.exercicio.questoes;
  const q = (lista||[])[parseInt(iS)];
  return q ? { q, aula, tipo } : null;
}
function alunoPodeVerAvaliacao(a, al){
  if(a && Array.isArray(a.excetoAlunos) && (a.excetoAlunos.includes(al.matriculaStudentId) || (a.excetoAlunosNomes||[]).some(n => mesmoNomeAluno(n, al.name)))) return false;
  if(!a || !Array.isArray(a.somenteAlunos)) return true;
  return a.somenteAlunos.includes(al.matriculaStudentId) || (a.somenteAlunosNomes||[]).some(n => mesmoNomeAluno(n, al.name));
}
async function planoAbrirRecuperacao(turmaId, bimestre){
  const s = planoState();
  const plano = s.planos[s.turmaPlano[turmaId]];
  const turma = (state.professor.turmas||[]).find(t=>t.id===turmaId);
  if(!plano || !turma) return;
  s.recup = { turmaId, bimestre, carregando:true }; render();
  const unidade = UNIDADES[Math.max(0, Math.min(3, bimestre-1))];
  const todas = await Promise.all(((await window.storage.list('assessment:', true)).keys||[]).map(k => planoLerJson(k, null)));
  const daTurma = todas.filter(a => a && assessmentTurmaIds(a).includes(turmaId) && a.unidade===unidade);
  const provas = daTurma.filter(a => a.instrumento==='avaliacao').sort((a,b)=>b.createdAt-a.createdAt);
  const prova = provas.find(a => (a.questions||[]).some(q => /^Aula \d+/.test(q.conteudo||''))) || provas[0] || null;
  const prog = s.prog[turmaId] || { exercicios:{} };
  const aulasBim = plano.aulas.filter(a => a.bimestre===bimestre && a.exercicio);
  const nAulas = new Set(aulasBim.map(a=>a.n));
  // respostas: exercícios do plano + prova
  const fontes = [];
  Object.entries(prog.exercicios||{}).forEach(([n, code]) => { if(nAulas.has(parseInt(n))) fontes.push({ code, aulaFixa: parseInt(n) }); });
  if(prova) fontes.push({ code: prova.code, prova: true });
  const desempenho = {};   // nomeChave → { n: [acertos, total] }
  let notaProva = {};
  const maxProva = prova ? prova.questions.reduce((x,q)=>x+(q.points||0),0) : 0;
  await Promise.all(fontes.map(async f => {
    const av = f.prova ? prova : (await planoLerJson(`assessment:${f.code}`, null));
    if(!av) return;
    const resp = await planoLerJson(`responses:${f.code}`, []);
    resp.forEach(r => {
      const nk = nomeChave(r.studentName);
      if(f.prova) notaProva[nk] = maxProva ? Math.round(r.total/maxProva*100)/10 : null;
      (av.questions||[]).forEach(q => {
        if(q.type!=='mc' || q.annulled) return;
        const n = f.aulaFixa || (() => { const m = /^Aula (\d+)/.exec(q.conteudo||''); return m ? parseInt(m[1]) : null; })();
        if(!n || !nAulas.has(n)) return;
        const d = (desempenho[nk] = desempenho[nk] || {}); d[n] = d[n] || [0,0];
        d[n][1]++; if(r.answers && r.answers[q.id]===q.correctOptionId) d[n][0]++;
      });
    });
  }));
  // inéditas de prova que já caíram na prova (não podem se repetir)
  const textosProva = new Set(prova ? prova.questions.map(q=>q.text) : []);
  // desempenho da turma por aula → parte comum: 5 aulas mais fracas da turma, 1 questão do banco de recuperação de cada
  const turmaAula = {};
  Object.values(desempenho).forEach(d => Object.entries(d).forEach(([n,[a,t]]) => { const x = turmaAula[n] = turmaAula[n] || [0,0]; x[0]+=a; x[1]+=t; }));
  const pct = (x) => x && x[1] ? x[0]/x[1] : 1;
  const ordemTurma = aulasBim.slice().sort((a,b) => pct(turmaAula[a.n]) - pct(turmaAula[b.n]) || a.n - b.n);
  const diagUsadas = ((s.prog[turmaId] && s.prog[turmaId].diagUsadas) || {})[bimestre] || [];
  const comuns = ordemTurma.map(a => (a.exercicio.questoesRecuperacao||[]).map((q,i) => `r:${a.n}:${i}`).find(k => !diagUsadas.includes(k))).filter(Boolean).slice(0,5);
  const alunos = {};
  (turma.students||[]).forEach(st => {
    const nk = nomeChave(st.name);
    const nota = notaProva[nk];
    const d = desempenho[nk] || {};
    const fez = nota!=null;
    const fracas = aulasBim.slice().sort((a,b) => (d[a.n]?pct(d[a.n]):0.5) - (d[b.n]?pct(d[b.n]):0.5) || pct(turmaAula[a.n]) - pct(turmaAula[b.n]) || a.n - b.n).map(a=>a.n);
    alunos[st.id] = { nome: st.name, nota, fez, incluir: !fez || nota < 5, fracas: fracas.slice(0,5), pers: [] };
  });
  s.recup = { turmaId, bimestre, unidade, provaCode: prova ? prova.code : null, provaTitulo: prova ? prova.title : null, comuns, alunos, textosProva: [...textosProva], inicio:'', fim:'', pedirLiberacao:false, carregando:false };
  Object.keys(alunos).forEach(sid => planoRecupSortearPers(sid));
  render();
  setTimeout(() => { const el = document.querySelector('[data-recuperacao]'); if(el) el.scrollIntoView({ behavior:'smooth', block:'start' }); }, 50);
}
function planoRecupPool(n){
  // questões disponíveis de uma aula para a parte personalizada (nunca vistas pelo aluno)
  const s = planoState(); const r = s.recup;
  const plano = s.planos[s.turmaPlano[r.turmaId]];
  const aula = plano.aulas.find(a=>a.n===n);
  if(!aula || !aula.exercicio) return [];
  const ks = [];
  (aula.exercicio.questoesRecuperacao||[]).forEach((q,i) => ks.push(`r:${n}:${i}`));
  (aula.exercicio.questoesProva||[]).forEach((q,i) => { if(!r.textosProva.includes(q.texto)) ks.push(`p:${n}:${i}`); });
  const diag = ((s.prog[r.turmaId] && s.prog[r.turmaId].diagUsadas) || {})[r.bimestre] || [];
  return ks.filter(k => !r.comuns.includes(k) && !diag.includes(k));
}
function planoRecupSortearPers(sid){
  const s = planoState(); const r = s.recup; const al = r.alunos[sid];
  const usadas = new Set(r.comuns);
  const pers = [];
  // 5 questões: percorre as aulas mais fracas do aluno, no máximo 2 por aula
  for(let rodada=0; rodada<2 && pers.length<5; rodada++){
    for(const n of al.fracas){
      if(pers.length>=5) break;
      const livre = planoRecupPool(n).filter(k => !usadas.has(k));
      if(livre[rodada] || livre[0]){ const k = livre[0]; pers.push(k); usadas.add(k); }
    }
  }
  // completa com qualquer aula do bimestre, se faltar
  if(pers.length<5){
    const plano = s.planos[s.turmaPlano[r.turmaId]];
    for(const a of plano.aulas.filter(a=>a.bimestre===r.bimestre && a.exercicio)){
      for(const k of planoRecupPool(a.n)){ if(pers.length<5 && !usadas.has(k)){ pers.push(k); usadas.add(k); } }
    }
  }
  al.pers = pers;
}
function planoRecupTrocar(sid, idx){
  const s = planoState(); const r = s.recup; const al = r.alunos[sid];
  const atual = al.pers[idx];
  const n = parseInt(atual.split(':')[1]);
  const usadas = new Set([...r.comuns, ...al.pers]);
  const opcoes = planoRecupPool(n).filter(k => !usadas.has(k));
  if(opcoes.length){ al.pers[idx] = opcoes[0]; }
  else {
    // sem outra questão da mesma aula: pega da próxima aula fraca
    for(const m of al.fracas){ const o = planoRecupPool(m).filter(k => !usadas.has(k)); if(o.length){ al.pers[idx] = o[0]; break; } }
  }
  render();
}
function renderRecuperacao(){
  const s = planoState(); const r = s.recup;
  if(!r) return '';
  if(r.carregando) return '<div class="card" data-recuperacao><p>⏳ Analisando o desempenho de cada aluno…</p></div>';
  const plano = s.planos[s.turmaPlano[r.turmaId]];
  const resumoQ = (k, extra) => { const x = planoQuestaoPorChave(plano, k); if(!x) return ''; return `<li style="margin:3px 0; font-size:.85rem;"><span class="muted">Aula ${x.aula.n}</span> · ${x.q.imagem?'🖼️ ':''}${esc(x.q.comando || x.q.texto)} ${x.q.habilidade?`<span style="font-size:.72rem; background:#e6f0fa; color:#1F4E79; border-radius:5px; padding:0 4px;">${esc(x.q.habilidade)}</span>`:''}${extra||''}</li>`; };
  const ids = Object.keys(r.alunos).sort((a,b) => r.alunos[a].nome.localeCompare(r.alunos[b].nome,'pt-BR'));
  const nIncl = ids.filter(id => r.alunos[id].incluir).length;
  return `<div class="card" data-recuperacao style="border:2px solid #1d6b31;">
    <div class="row" style="justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
      <h3 style="margin:0;">♻️ Recuperação personalizada — ${r.bimestre}º bimestre (${esc(r.unidade)})</h3>
      <button class="btn btn-ghost btn-sm" data-action="plano-recup-fechar">Fechar</button>
    </div>
    <p class="muted" style="font-size:.86rem;">${r.provaCode ? `Base: prova <strong>${esc(r.provaTitulo||'')}</strong> (${esc(r.provaCode)}) e os exercícios do plano.` : 'Ainda não há prova bimestral desta unidade — a análise usa só os exercícios do plano.'} Cada aluno recebe <strong>10 questões no padrão ENEM, 1 ponto cada</strong>: 5 comuns a todos + 5 das aulas em que <em>ele</em> foi pior, sempre questões que ele ainda não viu. Vale a maior nota entre a recuperação e a NP1.</p>
    <div style="background:#eef6ef; border-radius:8px; padding:8px 12px; margin:8px 0;">
      <strong>Parte comum (igual para todos)</strong> — aulas em que a turma teve menor acerto:
      <ol style="margin:4px 0 0 18px;">${r.comuns.map(k => resumoQ(k)).join('')}</ol>
    </div>
    <div class="row" style="gap:10px; flex-wrap:wrap; align-items:flex-end; margin:8px 0;">
      <label style="font-size:.85rem;">Abre em<input type="datetime-local" data-action="plano-recup-campo" data-campo="inicio" value="${esc(r.inicio)}"></label>
      <label style="font-size:.85rem;">Fecha em<input type="datetime-local" data-action="plano-recup-campo" data-campo="fim" value="${esc(r.fim)}"></label>
      <label style="font-size:.85rem; cursor:pointer;"><input type="checkbox" data-action="plano-recup-campo" data-campo="pedirLiberacao" ${r.pedirLiberacao?'checked':''} style="width:auto;"> Só abrir quando eu liberar</label>
    </div>
    <h4 style="margin:12px 0 4px;">Alunos (${nIncl} selecionado(s))</h4>
    <p class="muted" style="font-size:.8rem; margin:0 0 6px;">Já vêm marcados quem tirou menos de 5 na prova ou não fez. Toque em 🔁 para trocar uma questão.</p>
    ${ids.map(id => { const a = r.alunos[id]; return `
      <details data-recup-aluno="${esc(id)}" style="border-bottom:1px solid var(--border,#eee); padding:6px 0;">
        <summary style="cursor:pointer; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <input type="checkbox" data-action="plano-recup-incluir" data-sid="${esc(id)}" ${a.incluir?'checked':''} style="width:auto;" onclick="event.stopPropagation();">
          <strong>${esc(a.nome)}</strong>
          <span class="muted" style="font-size:.82rem;">${a.fez ? 'prova: ' + String(a.nota).replace('.',',') : 'não fez a prova'} · mais fraco nas aulas ${a.fracas.slice(0,3).join(', ')}</span>
        </summary>
        <ol start="6" style="margin:6px 0 0 18px;">${a.pers.map((k,i) => resumoQ(k, ` <button class="btn btn-ghost btn-sm" style="padding:0 6px;" data-action="plano-recup-trocar" data-sid="${esc(id)}" data-i="${i}" title="trocar">🔁</button>`)).join('')}</ol>
      </details>`; }).join('')}
    <div class="row" style="gap:8px; margin-top:12px; flex-wrap:wrap; align-items:center;">
      <button class="btn btn-primary" data-action="plano-recup-criar" ${nIncl?'':'disabled'}>✅ Criar ${nIncl} recuperação(ões) personalizada(s)</button>
      <span class="muted" style="font-size:.8rem;">Cada aluno só enxerga a sua. Depois, elas aparecem em Avaliações e podem ser editadas.</span>
    </div>
  </div>`;
}
async function planoRecupCriar(){
  const s = planoState(); const r = s.recup;
  const plano = s.planos[s.turmaPlano[r.turmaId]];
  const turma = (state.professor.turmas||[]).find(t=>t.id===r.turmaId);
  if(r.inicio && r.fim && new Date(r.fim) <= new Date(r.inicio)){ alert('O horário de fechamento deve ser depois da abertura.'); return; }
  const disc = planoDisciplinaDoProfessor(plano.disciplina||'');
  const sess = state.professor.session;
  const imgCache = {};
  const montarQ = async (k) => {
    const x = planoQuestaoPorChave(plano, k); if(!x) return null;
    const q = x.q;
    const options = q.opcoes.map(t => ({ id: cryptoId(), text: t }));
    const nova = { id: cryptoId(), type:'mc', text: q.texto, points: 1, image:null, annulled:false, descritorSaeb: q.habilidade ? 'ENEM ' + q.habilidade : '', conteudo: `Aula ${x.aula.n} — ${x.aula.tituloCurto||x.aula.tema}`, options, correctOptionId: options[q.correta].id, explicacao: saeseExplicacao(q), saese: saeseDeQuestaoPlano(q), inedita: true };
    if(q.comando) nova.comando = q.comando;
    if(q.imagem){ if(!(q.imagem in imgCache)) imgCache[q.imagem] = await planoLerJson(`plano-livro-img:${q.imagem}`, null); if(imgCache[q.imagem]) nova.image = imgCache[q.imagem]; }
    return nova;
  };
  const ids = Object.keys(r.alunos).filter(id => r.alunos[id].incluir);
  let criadas = 0;
  s.enviando = { atual:0, total:ids.length, texto:'Criando as recuperações...' }; render();
  for(const sid of ids){
    const al = r.alunos[sid];
    const qs = (await Promise.all([...r.comuns, ...al.pers].map(montarQ))).filter(Boolean);
    const code = genCode();
    const assessment = {
      code, title: `Recuperação ${plano.disciplina||''} — ${r.unidade} — ${al.nome}`,
      instrumento:'recuperacao', unidade: r.unidade,
      disciplinaId: disc ? disc.id : null, disciplinaName: disc ? disc.name : (plano.disciplina||null),
      turmaIds:[r.turmaId], questions: planoPontosIguais(qs, 10),
      startAt: r.inicio || null, endAt: r.fim || null, agendaTurmas:{},
      resultRelease:{ mode:'imediato', releaseAt:'' }, securityEnabled:true, minMinutesPerQuestion: 2, exigeLiberacao: !!r.pedirLiberacao,
      somenteAlunos:[sid], somenteAlunosNomes:[al.nome],
      origemPlano:{ planoId: plano.id, recuperacao:true, turmaId: r.turmaId, bimestre: r.bimestre, comuns: r.comuns.slice(), pers: al.pers.slice() },
      professorId: sess ? sess.id : null, professorName: sess ? sess.displayName : 'Coordenação', createdAt: Date.now(), updatedAt:null,
    };
    await window.storage.set(`assessment:${code}`, JSON.stringify(assessment), true);
    (state.professor.assessments = state.professor.assessments||[]).unshift(assessment);
    if(state.coordenador && Array.isArray(state.coordenador.assessments)) state.coordenador.assessments.unshift(assessment);
    criadas++; s.enviando.atual = criadas; render();
  }
  s.enviando = null; s.recup = null;
  s.msg = `✅ ${criadas} recuperação(ões) personalizada(s) criada(s) para a turma ${turma?turma.name:''}. Cada aluno só vê a sua, em “Provas”.${r.pedirLiberacao ? ' Lembre de liberar em Liberações.' : ''} Para a nota, vale a maior entre a recuperação e a NP1.`;
  render();
}
const HAB_ENEM_CN = {
  H1:'Reconhecer fenômenos ondulatórios e oscilatórios e seus usos', H2:'Associar soluções de problemas ao desenvolvimento científico e tecnológico', H3:'Confrontar interpretações científicas e de senso comum', H4:'Avaliar propostas de intervenção no ambiente e conservação da biodiversidade', H5:'Dimensionar circuitos e dispositivos elétricos do cotidiano', H6:'Compreender manuais de aparelhos e sistemas tecnológicos', H7:'Selecionar testes e critérios para comparar materiais e produtos', H8:'Identificar etapas na obtenção e no uso de recursos naturais', H9:'Compreender ciclos biogeoquímicos e o fluxo de energia', H10:'Analisar perturbações ambientais e o destino dos poluentes', H11:'Reconhecer benefícios, limites e ética da biotecnologia', H12:'Avaliar impactos de atividades humanas em ambientes naturais', H13:'Reconhecer mecanismos de transmissão da vida (hereditariedade)', H14:'Identificar padrões em processos vitais dos organismos', H15:'Interpretar modelos e experimentos em Biologia', H16:'Compreender o papel da evolução', H17:'Relacionar informações em textos, gráficos, tabelas e símbolos', H18:'Relacionar propriedades de produtos e sistemas às suas finalidades', H19:'Avaliar métodos das ciências para resolver problemas sociais e ambientais', H20:'Caracterizar causas e efeitos de movimentos', H21:'Usar leis da termodinâmica e do eletromagnetismo', H22:'Compreender a interação entre radiação e matéria', H23:'Avaliar a geração e o uso de energia em cada ambiente', H24:'Usar códigos e nomenclatura da Química', H25:'Caracterizar materiais e substâncias e sua produção', H26:'Avaliar a produção e o consumo de recursos energéticos e minerais', H27:'Avaliar intervenções no ambiente com conhecimentos químicos', H28:'Associar adaptações dos organismos ao modo de vida e ao ambiente', H29:'Interpretar experimentos e técnicas que usam seres vivos', H30:'Avaliar propostas para a saúde individual, coletiva e do ambiente'
};
function habEnemTabela(plano){ return enemAreaDaDisc(plano && plano.disciplina)==='CN' ? HAB_ENEM_CN : HAB_ENEM_CH; }
const HAB_ENEM_CH = {
  H1:'Interpretar fontes documentais sobre aspectos da cultura', H2:'Analisar a produção da memória pelas sociedades', H3:'Associar manifestações culturais do presente a seus processos históricos',
  H4:'Comparar pontos de vista sobre aspectos da cultura', H5:'Identificar a diversidade do patrimônio cultural', H6:'Interpretar representações gráficas e cartográficas',
  H7:'Identificar relações de poder entre as nações', H8:'Analisar a ação dos Estados nos fluxos populacionais', H9:'Comparar organizações políticas e socioeconômicas em diferentes escalas',
  H10:'Reconhecer a dinâmica dos movimentos sociais', H11:'Identificar registros de práticas de grupos sociais no tempo e no espaço', H12:'Analisar o papel da justiça como instituição',
  H13:'Analisar movimentos sociais que mudaram disputas pelo poder', H14:'Comparar pontos de vista sobre instituições sociais, políticas e econômicas', H15:'Avaliar criticamente conflitos culturais, sociais, políticos, econômicos ou ambientais',
  H16:'Identificar o papel das técnicas e tecnologias no trabalho e na vida social', H17:'Analisar o impacto das novas tecnologias na territorialização da produção',
  H18:'Analisar processos de produção e circulação de riquezas', H19:'Reconhecer transformações técnicas no uso dos espaços rural e urbano', H20:'Selecionar argumentos sobre as novas tecnologias e o trabalho',
  H21:'Identificar o papel dos meios de comunicação', H22:'Analisar lutas sociais e conquistas nas leis e políticas públicas', H23:'Analisar a importância dos valores éticos na política',
  H24:'Relacionar cidadania e democracia', H25:'Identificar estratégias de inclusão social', H26:'Identificar a ocupação dos meios físicos e as relações com a paisagem', H27:'Analisar criticamente as interações sociedade–natureza',
  H28:'Relacionar tecnologias e impactos socioambientais', H29:'Reconhecer a função dos recursos naturais', H30:'Avaliar preservação e degradação da vida no planeta',
};
async function planoAnalisarHabilidades(turmaId){
  const s = planoState();
  s.habCarregando = turmaId; render();
  const turma = (state.professor.turmas||[]).find(t=>t.id===turmaId);
  const alunos = (turma && turma.students) || [];
  const porNome = {}; alunos.forEach(st => porNome[nomeChave(st.name)] = st);
  const todas = await Promise.all(((await window.storage.list('assessment:', true)).keys||[]).map(k => planoLerJson(k, null)));
  // Plano da turma: habilidade de cada questão (pelo texto, para exercícios antigos sem descritor), aulas por habilidade e simulados
  const prog = s.prog[turmaId] || { exercicios:{}, dadas:{} };
  const plano = s.planos[s.turmaPlano[turmaId]];
  const chaveTxt = t => String(t||'').replace(/\s+/g, ' ').trim().slice(0, 160).toLowerCase();
  const habPorTexto = {}, saesePorTexto = {}, qPorTexto = {}, aulasPorH = {}, simCodes = new Set();
  if(plano) plano.aulas.forEach(a => {
    const ex = a.exercicio || {}; const ehSimAula = /^Simulado/i.test(ex.titulo||'');
    ['questoes','questoesProva','questoesRecuperacao'].forEach(k => (ex[k]||[]).forEach(q => {
      if(q.saese && q.saese.length) saesePorTexto[chaveTxt(q.texto)] = q.saese;
      qPorTexto[chaveTxt(q.texto)] = q;
      if(!q.habilidade) return; habPorTexto[chaveTxt(q.texto)] = q.habilidade;
      if(!ehSimAula && (k==='questoes' || q.enem)) (aulasPorH[q.habilidade] = aulasPorH[q.habilidade] || new Set()).add(a.n);
    }));
    const le = a.slides && a.slides.leituraEnem; if(le && le.hab) (aulasPorH[le.hab] = aulasPorH[le.hab] || new Set()).add(a.n);
    if(/^Simulado/i.test(ex.titulo||'')) planoCodigosDaAula(prog, a.n).forEach(c => simCodes.add(c));
  });
  const habDaQuestao = q => { const m = /^ENEM (H\d+)/.exec(q.descritorSaeb||''); return m ? m[1] : (habPorTexto[chaveTxt(q.text)] || null); };
  await saeseCorrCarregar(true);
  const saeseDaQuestao = q => saeseAplicar(saeseChave(q.text), (q.saese && q.saese.length) ? q.saese : (saesePorTexto[chaveTxt(q.text)] || []));
  const avs = todas.filter(a => a && assessmentTurmaIds(a).includes(turmaId) && (a.questions||[]).some(q => habDaQuestao(q) || saeseDaQuestao(q).length));
  const turmaH = {}, alunoH = {}, turmaC = {}, alunoC = {}, turmaS = {}, alunoS = {}; const distr = {};
  const soma = (o, k, ok) => { const x = o[k] = o[k] || [0,0]; x[0]+=ok; x[1]++; };
  await Promise.all(avs.map(async av => {
    const resp = await planoLerJson(`responses:${av.code}`, []);
    const ehSim = simCodes.has(av.code);
    resp.forEach(r => {
      const st = porNome[nomeChave(r.studentName)]; if(!st) return;
      av.questions.forEach(q => {
        if(q.type!=='mc' || q.annulled) return;
        const ok = r.answers && r.answers[q.id]===q.correctOptionId ? 1 : 0;
        { const kq = chaveTxt(q.text); const e = distr[kq] = distr[kq] || { q, n:0, cont:(q.options||[]).map(() => 0), av: av.title || '' }; const iop = (q.options||[]).findIndex(o => o.id===(r.answers||{})[q.id]); e.n++; if(iop>=0) e.cont[iop]++; }
        saeseDaQuestao(q).forEach(c => { soma(turmaS, c, ok); soma(alunoS[st.id] = alunoS[st.id] || {}, c, ok); });
        const h = habDaQuestao(q); if(!h) return;
        soma(turmaH, h, ok); soma(alunoH[st.id] = alunoH[st.id] || {}, h, ok);
        if(ehSim){ const c = 'C' + (Math.floor((parseInt(h.slice(1)) - 1) / 5) + 1); soma(turmaC, c, ok); soma(alunoC[st.id] = alunoC[st.id] || {}, c, ok); }
      });
    });
  }));
  // aula sugerida para retomar cada habilidade: a mais recente já dada que trabalha a habilidade (senão, a próxima do plano)
  const sugestao = {};
  Object.keys(aulasPorH).forEach(h => {
    const ns = [...aulasPorH[h]].sort((a,b)=>a-b);
    const dadas = ns.filter(n => prog.dadas && prog.dadas[n]).sort((a,b) => prog.dadas[b] - prog.dadas[a]);
    const n = dadas[0] || ns[0]; const au = plano.aulas.find(a => a.n===n);
    sugestao[h] = { n, titulo: au ? (au.tituloCurto || au.tema || au.titulo || '') : '', dada: !!dadas.length };
  });
  // busca ativa: entregas dos exercícios do plano
  const codes = Object.values(prog.exercicios||{});
  const entregas = {}; alunos.forEach(st => entregas[st.id] = { feitos:0, vencidosSemFazer:0 });
  await Promise.all(Object.keys(prog.exercicios||{}).map(async nAula => {
    const code = prog.exercicios[nAula];
    const av = await planoLerJson(`assessment:${code}`, null);
    const resp = await planoRespostasDaAula(prog, nAula);
    const fizeram = new Set(resp.map(r => nomeChave(r.studentName)));
    const venceu = av && av.endAt && new Date(av.endAt).getTime() < Date.now();
    alunos.forEach(st => { if(fizeram.has(nomeChave(st.name))) entregas[st.id].feitos++; else if(venceu) entregas[st.id].vencidosSemFazer++; });
  }));
  // análise das alternativas: a alternativa errada mais marcada em cada questão, com o motivo do erro (do plano)
  const motivosDe = qp => { const m = {}; const t = (qp && qp.explicacao) || ''; const re = /(?:^|\s)([A-E])\) (.+?)(?=\s[A-E]\) |\s🎯|$)/g; let x; while((x = re.exec(t))) m['ABCDE'.indexOf(x[1])] = x[2].trim(); return m; };
  const errosComuns = Object.values(distr).map(e => { const ci = (e.q.options||[]).findIndex(o => o.id===e.q.correctOptionId); let wi = -1, wn = 0;
      e.cont.forEach((c, i) => { if(i!==ci && c > wn){ wn = c; wi = i; } });
      const qp = qPorTexto[chaveTxt(e.q.text)]; const mot = motivosDe(qp);
      return { texto: e.q.comando || e.q.text, n: e.n, acerto: ci>=0 ? Math.round(e.cont[ci]/e.n*100) : null, letra: 'ABCDE'[wi], alt: wi>=0 ? (e.q.options[wi]||{}).text : '', pct: e.n ? Math.round(wn/e.n*100) : 0, motivo: mot[wi] || '', expl: !mot[wi] && qp && qp.explicacao ? String(qp.explicacao).replace(/🎯.*$/,'').slice(0, 220) : '', saese: saeseDaQuestao(e.q), hab: habDaQuestao(e.q), av: e.av }; })
    .filter(x => x.n >= 5 && x.pct >= 30 && x.letra).sort((a,b) => b.pct - a.pct).slice(0, 8);
  s.hab[turmaId] = { errosComuns, turmaH, alunoH, turmaC, alunoC, turmaS, alunoS, sugestao, simulados: simCodes.size, avaliacoes: avs.length, entregas, totalEx: codes.length, em: Date.now() };
  s.habCarregando = null;
  render();
}
function renderPlanoHabilidades(turmaId){
  const s = planoState();
  const HABT = habEnemTabela(s.planos[s.turmaPlano[turmaId]]);
  const turma = (state.professor.turmas||[]).find(t=>t.id===turmaId);
  const d = s.hab[turmaId];
  const cor = p => p==null ? '#eee' : p < 50 ? '#f4c7c3' : p < 70 ? '#fde3c2' : '#cfead6';
  const pctTxt = x => x && x[1] ? Math.round(x[0]/x[1]*100) : null;
  let corpo;
  if(s.habCarregando===turmaId) corpo = '<p>⏳ Analisando…</p>';
  else if(!d) corpo = `<button class="btn btn-primary btn-sm" data-action="plano-analisar-hab">🎯 Analisar habilidades e entregas</button>`;
  else {
    const hs = Object.keys(d.turmaH).sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1)));
    const todasH = Array.from({length:30}, (_, i) => 'H' + (i+1));
    const alunos = ((turma && turma.students)||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    const sug = d.sugestao || {};
    // as 3 mais fracas (com pelo menos 5 respostas), para retomar
    const fracas = hs.filter(h => d.turmaH[h][1] >= 5 && pctTxt(d.turmaH[h]) < 70).sort((a,b) => pctTxt(d.turmaH[a]) - pctTxt(d.turmaH[b])).slice(0, 3);
    const sugTxt = h => { const g = sug[h]; return g ? `aula ${g.n}${g.titulo ? ' — ' + esc(g.titulo) : ''}${g.dada ? '' : ' <span class="muted">(ainda não dada)</span>'}` : '<span class="muted">—</span>'; };
    const blocoFracas = fracas.length ? `<div data-hab-fracas style="margin:4px 0 10px; padding:8px 10px; border-radius:8px; background:#fdecea; border:1px solid #f4c7c3;">
        <strong style="color:#b3261e;">⚠️ Habilidades mais fracas da turma — retomar</strong>
        <ol style="margin:4px 0 0 18px; font-size:.86rem;">${fracas.map(h => `<li data-hab-fraca="${h}"><b>${h}</b> (${pctTxt(d.turmaH[h])}%) — ${esc(HABT[h]||'')}<br><span style="font-size:.82rem;">👉 ${sug[h] ? `Sugestão: retomar a ${sugTxt(h)}, reaplicando a Leitura ENEM da aula.` : 'Nenhuma aula deste plano trabalha essa habilidade: use as questões de outra disciplina da área (veja as conexões) ou do banco de prova.'}</span></li>`).join('')}</ol></div>` : '';
    const comp = ['Diversidade cultural e memória','Poder, território e nações','Instituições, movimentos e conflitos','Técnica, tecnologia e trabalho','Cidadania, democracia e inclusão','Sociedade e natureza'];
    const tabelaHab = hs.length ? `${blocoFracas}
      <div class="table-scroll"><table style="font-size:.84rem;" data-hab-tabela>
        <tr><th>Habilidade</th><th>O que avalia</th><th>Acerto da turma</th><th>Alunos abaixo de 50%</th><th>Aula para retomar</th></tr>
        ${todasH.map((h, i) => { const sem = !d.turmaH[h]; const p = pctTxt(d.turmaH[h]);
          const baixos = sem ? [] : alunos.filter(st => { const v = pctTxt(d.alunoH[st.id] && d.alunoH[st.id][h]); return v!=null && v<50; });
          const cab = i % 5 === 0 ? `<tr><td colspan="5" style="background:#eef3f8; font-weight:700; color:#1F4E79;">C${i/5+1} — ${comp[i/5]}</td></tr>` : '';
          return cab + `<tr data-hab="${h}"><td${fracas.includes(h) ? ' style="border-left:5px solid #b3261e;" title="Entre as mais fracas da turma"' : ''}><strong>${h}</strong>${fracas.includes(h) ? ' ⚠️' : ''}</td><td>${esc(HABT[h]||'')}</td><td style="background:${cor(p)}; font-weight:700; text-align:center;">${sem ? '<span class="muted" style="font-weight:400;">sem dados</span>' : p + '% <span class="muted" style="font-weight:400; font-size:.75rem;">(' + d.turmaH[h][1] + ')</span>'}</td><td style="font-size:.8rem;">${baixos.length ? baixos.map(st=>esc(st.name.split(' ')[0])).join(', ') : '—'}</td><td style="font-size:.78rem;">${!sem && p < 70 ? sugTxt(h) : sem && sug[h] ? '<span class="muted">' + sugTxt(h) + '</span>' : ''}</td></tr>`; }).join('')}
      </table></div>
      <details style="margin-top:8px;"><summary style="cursor:pointer; font-weight:600;">Mapa por aluno</summary>
        <div class="table-scroll"><table style="font-size:.78rem;" data-hab-alunos>
          <tr><th>Aluno</th><th>Mais fracas</th>${hs.map(h=>`<th>${h}</th>`).join('')}</tr>
          ${alunos.map(st => { const ah = d.alunoH[st.id] || {};
            const fr = Object.keys(ah).filter(h => ah[h][1] >= 2 && pctTxt(ah[h]) < 50).sort((a,b) => pctTxt(ah[a]) - pctTxt(ah[b])).slice(0, 3);
            return `<tr><td>${esc(st.name)}</td><td style="font-size:.74rem; color:#b3261e;">${fr.join(', ') || '—'}</td>${hs.map(h => { const v = pctTxt(ah[h]); return `<td style="background:${cor(v)}; text-align:center;">${v==null?'—':v+'%'}</td>`; }).join('')}</tr>`; }).join('')}
        </table></div>
      </details>` : '<p class="muted">Ainda não há questões com habilidades do ENEM respondidas por esta turma. Elas aparecem com os exercícios do plano, os simulados e as provas montadas com questões inéditas.</p>';
    const sk = Object.keys(d.turmaS||{}).sort((a,b) => a.localeCompare(b));
    const saeseFracos = sk.filter(c => d.turmaS[c][1] >= 5 && pctTxt(d.turmaS[c]) < 60).sort((a,b) => pctTxt(d.turmaS[a]) - pctTxt(d.turmaS[b])).slice(0, 3);
    const tabelaSaese = sk.length ? `
      <h4 style="margin:14px 0 6px;">📘 Descritores do SAESE (Língua Portuguesa e Matemática)</h4>
      <p class="muted" style="font-size:.8rem; margin:0 0 6px;">Leitura e matemática treinadas nas aulas com plano do livro: cada questão do plano indica o descritor do SAESE (3ª série do Ensino Médio) que ela trabalha.</p>
      ${saeseFracos.length ? `<div data-saese-fracos style="margin:4px 0 8px; padding:6px 10px; border-radius:8px; background:var(--tint-teal); border:1px solid #80cbc4; font-size:.85rem;"><b style="color:var(--teal);">Para reforçar:</b> ${saeseFracos.map(c => `<b>${c}</b> (${pctTxt(d.turmaS[c])}%) — ${esc(SAESE_CAT[c].a)}`).join(' · ')}</div>` : ''}
      <div class="table-scroll"><table style="font-size:.82rem;" data-saese-tabela>
        <tr><th>Descritor</th><th>Descrição (matriz)</th><th>Acerto da turma</th><th>Alunos abaixo de 50%</th></tr>
        ${sk.map(c => { const p = pctTxt(d.turmaS[c]); const baixos = alunos.filter(st => { const v = pctTxt(d.alunoS[st.id] && d.alunoS[st.id][c]); return v!=null && v<50; });
          return `<tr data-saese="${c}"><td style="white-space:nowrap;"><strong>${c}</strong></td><td>${esc((SAESE_CAT[c]||{}).o||'')}</td><td style="background:${cor(p)}; font-weight:700; text-align:center;">${p}% <span class="muted" style="font-weight:400; font-size:.75rem;">(${d.turmaS[c][1]})</span></td><td style="font-size:.8rem;">${baixos.length ? baixos.map(st=>esc(st.name.split(' ')[0])).join(', ') : '—'}</td></tr>`; }).join('')}
      </table></div>
      ${(() => { const grupos = sk.map(c => ({ c, al: alunos.filter(st => { const v = pctTxt(d.alunoS[st.id] && d.alunoS[st.id][c]); return v!=null && v<50; }) })).filter(g => g.al.length).sort((a,b) => b.al.length - a.al.length).slice(0, 6);
        return grupos.length ? `<h4 style="margin:12px 0 4px;">👥 Grupos de reforço por descritor</h4><p class="muted" style="font-size:.8rem;margin:0 0 4px;">Alunos abaixo de 50% em cada descritor. A retomada tem até 5 questões, só esses alunos veem e não vale nota.</p>
          <div data-saese-grupos style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;">${grupos.map(g => `<div style="border:1px solid #80cbc4;border-radius:8px;padding:6px 8px;background:var(--tint-teal);font-size:.84rem;" data-saese-grupo="${g.c}"><b style="color:#00695C;">${g.c}</b> · ${esc(SAESE_CAT[g.c].a)}<div style="margin:3px 0;">${g.al.map(st => esc(st.name.split(' ')[0])).join(', ')}</div><button class="btn btn-ghost btn-sm" style="width:auto;padding:2px 8px;" data-action="saese-retomada" data-d="${g.c}">↻ Criar retomada (${g.al.length})</button></div>`).join('')}</div>` : ''; })()}` : '';
    const errosHtml = (d.errosComuns||[]).length ? `<h4 style="margin:14px 0 6px;">🔎 Erros mais comuns da turma</h4><p class="muted" style="font-size:.8rem;margin:0 0 6px;">Questões em que muitos alunos marcaram a mesma alternativa errada. O motivo vem da correção comentada do plano.</p>
      <div data-erros-comuns>${d.errosComuns.map(x => `<div style="border:1px solid var(--paper-line);border-left:4px solid #b3261e;border-radius:8px;padding:6px 10px;margin:6px 0;font-size:.86rem;background:var(--surface);">
        <div>${(x.saese||[]).map(c => `<span class="kit-cod ${c.startsWith('MT')?'mt':'lp'}">${c}</span>`).join(' ')} ${x.hab ? `<span style="font-size:.72rem;background:#e6f0fa;color:#1F4E79;border-radius:5px;padding:0 4px;">${x.hab}</span>` : ''} <span class="muted">${esc(x.av)}</span></div>
        <div style="margin:3px 0;"><b>${esc(String(x.texto).slice(0, 180))}</b></div>
        <div><span style="color:#b3261e;font-weight:700;">${x.pct}% marcaram ${x.letra})</span> ${esc(x.alt||'')} <span class="muted">· acerto ${x.acerto}% · ${x.n} respostas</span></div>
        ${x.motivo ? `<div style="margin-top:2px;">💡 <b>Por que está errada:</b> ${esc(x.motivo)}</div>` : (x.expl ? `<div style="margin-top:2px;">💡 <b>Explicação da questão:</b> ${esc(x.expl)}</div>` : '')}</div>`).join('')}</div>` : '';
    const acoesSaese = `<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px;" data-saese-acoes><button class="btn btn-primary btn-sm" style="width:auto;" data-action="saese-simulado">📝 Montar simulado SAESE (10 descritores)</button><button class="btn btn-ghost btn-sm" style="width:auto;" data-action="saese-caderneta">🖨️ Imprimir cadernetas da turma</button><button class="btn btn-ghost btn-sm" style="width:auto;" data-action="saese-devolutiva">🖨️ Devolutivas do bimestre (aluno e família)</button></div>` + renderSaeseMetas(turmaId, d);
    const cs = ['C1','C2','C3','C4','C5','C6'];
    const tabelaSim = d.turmaC && Object.keys(d.turmaC).length ? `
      <h4 style="margin:14px 0 6px;">📝 Simulados por competência da área</h4>
      <div class="table-scroll"><table style="font-size:.8rem;" data-hab-simulados>
        <tr><th>Aluno</th>${cs.map((c, i) => `<th title="${esc(comp[i])}">${c}</th>`).join('')}</tr>
        <tr style="font-weight:700;"><td>Turma</td>${cs.map(c => { const v = pctTxt(d.turmaC[c]); return `<td style="background:${cor(v)}; text-align:center;">${v==null?'—':v+'%'}</td>`; }).join('')}</tr>
        ${alunos.filter(st => d.alunoC[st.id]).map(st => `<tr><td>${esc(st.name)}</td>${cs.map(c => { const v = pctTxt(d.alunoC[st.id][c]); return `<td style="background:${cor(v)}; text-align:center;">${v==null?'—':v+'%'}</td>`; }).join('')}</tr>`).join('')}
      </table></div>
      <p class="muted" style="font-size:.78rem;">${cs.map((c, i) => `${c}: ${comp[i]}`).join(' · ')}</p>` : '';
    const sem = alunos.map(st => ({ st, e: d.entregas[st.id] || { feitos:0, vencidosSemFazer:0 } }))
      .filter(x => d.totalEx && (x.e.vencidosSemFazer >= 2 || x.e.feitos/d.totalEx < 0.5))
      .sort((a,b) => b.e.vencidosSemFazer - a.e.vencidosSemFazer || a.e.feitos - b.e.feitos);
    corpo = `
      <h4 style="margin:6px 0;">🎯 Habilidades do ENEM (H1–H30)</h4>${tabelaHab}${tabelaSim}${tabelaSaese}${errosHtml}${acoesSaese}
      <h4 style="margin:14px 0 6px;">🚨 Busca ativa: quem não está entregando os exercícios</h4>
      ${!d.totalEx ? '<p class="muted">Nenhum exercício aplicado ainda.</p>' : sem.length ? `<ul style="margin:0 0 0 18px; font-size:.86rem;">${sem.map(x => `<li data-sem-entregar="${esc(x.st.id)}"><strong>${esc(x.st.name)}</strong> — fez ${x.e.feitos} de ${d.totalEx}${x.e.vencidosSemFazer?` · <span style="color:#b3261e;">${x.e.vencidosSemFazer} com prazo vencido sem fazer</span>`:''}</li>`).join('')}</ul>
        <p class="muted" style="font-size:.8rem;">Sugestão: conversar com o aluno e avisar a coordenação — quem para de entregar costuma aparecer depois no relatório de risco de reprovação.</p>` : '<p style="color:#1d6b31;">✅ Todos estão entregando pelo menos metade dos exercícios.</p>'}
      <div class="row" style="gap:8px; align-items:center; margin-top:8px;"><button class="btn btn-ghost btn-sm" data-action="plano-analisar-hab">↻ Atualizar</button><span class="muted" style="font-size:.8rem;">${d.avaliacoes} avaliação(ões) com habilidades · ${d.totalEx} exercício(s)</span></div>`;
  }
  return `<div class="card" data-plano-hab><h3 style="margin-top:0;">📈 Habilidades e entregas da turma</h3>${corpo}</div>`;
}
function saeseBanco(turmaId){
  const s = planoState(); const plano = s.planos[s.turmaPlano[turmaId]]; const prog = s.prog[turmaId] || { dadas:{} };
  const out = []; if(!plano) return out;
  plano.aulas.forEach(a => { const ex = a.exercicio || {};
    ['questoes','questoesProva'].forEach(k => (ex[k]||[]).forEach(q => { const cs = saeseDeQuestaoPlano(q); if(q.tipo==='mc' && cs.length) out.push({ q: cs===q.saese ? q : Object.assign({}, q, { saese: cs }), aula: a, dada: !!(prog.dadas && prog.dadas[a.n]) }); }));
    ((a.slides && a.slides.enemOficial) || []).forEach(q => { if((q.saese||[]).length && !out.some(x => x.q.id && x.q.id===q.id)) out.push({ q, aula: a, dada: !!(prog.dadas && prog.dadas[a.n]) }); }); });
  return out;
}
async function saeseMontarQuestao(x, imgCache){
  const q = x.q; const options = q.opcoes.map(t => ({ id: cryptoId(), text: t }));
  const nova = { id: cryptoId(), type:'mc', text: q.texto, points: 1, image:null, annulled:false, descritorSaeb: q.habilidade ? 'ENEM ' + q.habilidade : '', conteudo: `Aula ${x.aula.n} — ${x.aula.tituloCurto||x.aula.tema}`, options, correctOptionId: options[q.correta].id, explicacao: saeseExplicacao(q), saese: saeseDeQuestaoPlano(q), inedita: !!q.inedita };
  if(q.comando) nova.comando = q.comando;
  if(q.imagem){ if(!(q.imagem in imgCache)) imgCache[q.imagem] = await planoLerJson(`plano-livro-img:${q.imagem}`, null); if(imgCache[q.imagem]) nova.image = imgCache[q.imagem]; }
  return nova;
}
function saeseEscolher(banco, descs, usadas){
  const peso = x => (x.q.saeseQ ? 3 : 0) + (x.q.enem || x.q.area ? 2 : 0) + (x.dada ? 4 : 0) + Math.min(2, (x.q.texto||'').length / 200);
  const out = [];
  descs.forEach(d => { const c = banco.filter(x => x.q.saese.includes(d) && !usadas.has(x.q)).sort((a,b) => peso(b) - peso(a) || (b.q.saese[0]===d) - (a.q.saese[0]===d));
    if(c.length){ out.push(c[0]); usadas.add(c[0].q); } });
  return out;
}
async function planoSimuladoSaese(turmaId){
  const s = planoState(); const p = state.professor;
  if(state.view==='coordenador'){ alert('Para montar o simulado, entre no painel do professor.'); return; }
  const plano = s.planos[s.turmaPlano[turmaId]]; if(!plano){ alert('Escolha um plano para a turma.'); return; }
  const bancoTodo = saeseBanco(turmaId); let banco = bancoTodo; const dadas = banco.filter(x => x.dada); if(dadas.length >= 25) banco = dadas;
  const d = s.hab[turmaId]; const pct = c => d && d.turmaS && d.turmaS[c] && d.turmaS[c][1] ? d.turmaS[c][0] / d.turmaS[c][1] : null;
  const freq = {}; banco.forEach(x => x.q.saese.forEach(c => freq[c] = (freq[c]||0) + 1));
  const descs = Object.keys(freq).sort((a,b) => { const pa = pct(a), pb = pct(b);
    if(pa!=null || pb!=null) return (pa==null ? 2 : pa) - (pb==null ? 2 : pb);   // mais fracos primeiro; sem dados depois
    return freq[a] - freq[b]; });                                               // depois, os menos treinados
  priorOrdenarDescs(descs, turmaId);
  const usadas = new Set(); let esc10 = saeseEscolher(banco, descs, usadas);
  if(esc10.length < 10 && banco !== bancoTodo){   // completa com aulas ainda não dadas, em descritores que faltaram
    const tem = new Set(esc10.flatMap(x => x.q.saese)); const freq2 = {}; bancoTodo.forEach(x => x.q.saese.forEach(c => freq2[c] = (freq2[c]||0) + 1));
    esc10 = esc10.concat(saeseEscolher(bancoTodo, Object.keys(freq2).filter(c => !tem.has(c)).sort((a,b) => freq2[a] - freq2[b]), usadas)); }
  esc10 = esc10.slice(0, 10);
  if(esc10.length < 5){ alert('Ainda há poucas questões com descritor SAESE nas aulas desta turma.'); return; }
  const imgCache = {}; const qs = []; for(const x of esc10) qs.push(await saeseMontarQuestao(x, imgCache));
  planoPontosIguais(qs, 10);
  const disc = planoDisciplinaDoProfessor(plano.disciplina||'');
  const turma = (p.turmas||[]).find(t => t.id===turmaId);
  const na = freshAssessment();
  na.instrumento = 'avaliacao'; na.title = `Simulado SAESE — ${plano.disciplina||'Humanas'} — ${turma ? turma.name : ''}`;
  na.unidade = UNIDADES[Math.max(0, Math.min(3, (esc10[0].aula.bimestre||1)-1))];
  na.disciplinaId = disc ? disc.id : ''; na.turmaIds = [turmaId]; na.questions = qs; na.saeseSimulado = true;
  const papel = confirm('Vai aplicar este simulado em PAPEL, como no SAESE?\n\nOK = papel (cartão-resposta com leitura pelo celular)\nCancelar = no app (tablets)');
  if(papel){ na.title = na.title.replace('Simulado SAESE', 'Simulado SAESE (papel)'); na.securityEnabled = false; na.exigeLiberacao = false; na.minMinutesPerQuestion = null; na.saesePapel = true; }
  p.newAssessment = na; p.editingCode = null; p.editingResponseCount = 0; p.pickerOpen = false; p.pickerSelected = [];
  p.subview = 'avaliacoes'; p.mode = 'new'; render(); window.scrollTo(0,0);
  if(papel) alert(`Simulado SAESE em papel montado com ${qs.length} questões. Depois de salvar:\n1) Em “Minhas avaliações”, toque em “Imprimir / PDF” para o caderno de questões;\n2) Toque em “Gabaritos por aluno” para imprimir os cartões-resposta com QR code;\n3) Depois da prova, use “Ler gabaritos” para corrigir pelo celular. O resultado entra no painel SAESE da turma.\nSugestão: 2 minutos por questão, como na avaliação oficial.`); else
  alert(`Simulado SAESE montado: ${qs.length} questões, cada uma com um descritor diferente (${esc10.map(x => x.q.saese.find(c => descs.includes(c))).filter((v,i,a)=>a.indexOf(v)===i).length} descritores)${d ? ', começando pelos mais fracos da turma' : ''}. Confira datas e liberação e clique em salvar.`);
}
async function planoRetomadaSaese(turmaId, desc){
  const s = planoState(); const d = s.hab[turmaId]; const p = state.professor; const sess = p.session;
  const plano = s.planos[s.turmaPlano[turmaId]]; const turma = (p.turmas||[]).find(t => t.id===turmaId);
  if(!d || !plano || !turma) return;
  const alunos = (turma.students||[]).filter(st => { const x = d.alunoS && d.alunoS[st.id] && d.alunoS[st.id][desc]; return x && x[1] && x[0]/x[1] < 0.5; });
  if(!alunos.length){ alert('Nenhum aluno abaixo de 50% neste descritor.'); return; }
  const banco = saeseBanco(turmaId).filter(x => x.q.saese.includes(desc));
  const vistas = new Set(); const sel = banco.filter(x => { const k = x.q.texto; if(vistas.has(k)) return false; vistas.add(k); return true; })
    .sort((a,b) => (b.q.saeseQ?2:0) + (b.q.saese[0]===desc?1:0) - (a.q.saeseQ?2:0) - (a.q.saese[0]===desc?1:0)).slice(0, 5);
  if(!sel.length){ alert('Não há questões deste descritor no plano.'); return; }
  if(!confirm(`Criar uma retomada de ${sel.length} questão(ões) de ${desc} (${SAESE_CAT[desc].a}) só para ${alunos.length} aluno(s): ${alunos.map(a => a.name.split(' ')[0]).join(', ')}?`)) return;
  const imgCache = {}; const qs = []; for(const x of sel) qs.push(await saeseMontarQuestao(x, imgCache));
  const disc = planoDisciplinaDoProfessor(plano.disciplina||'');
  const code = genCode();
  const assessment = { code, title: `Retomada SAESE ${desc} — ${SAESE_CAT[desc].a}`, instrumento:'exercicios', unidade: UNIDADES[Math.max(0, Math.min(3, (sel[0].aula.bimestre||1)-1))],
    disciplinaId: disc ? disc.id : null, disciplinaName: disc ? disc.name : (plano.disciplina||null), turmaIds:[turmaId], questions: planoPontosIguais(qs, 10),
    startAt: null, endAt: planoPrazoParaEndAt('7'), agendaTurmas:{}, resultRelease:{ mode:'imediato', releaseAt:'' }, securityEnabled:false, minMinutesPerQuestion:null, exigeLiberacao:false, valeNota:false,
    somenteAlunos: alunos.map(a => a.id), somenteAlunosNomes: alunos.map(a => a.name), origemPlano:{ planoId: plano.id, turmaId, saeseRetomada: desc },
    professorId: sess ? sess.id : null, professorName: sess ? sess.displayName : 'Coordenação', createdAt: Date.now(), updatedAt:null };
  await window.storage.set(`assessment:${code}`, JSON.stringify(assessment), true);
  (p.assessments = p.assessments||[]).unshift(assessment);
  s.msg = `✅ Retomada de ${desc} criada para ${alunos.length} aluno(s). Só eles veem, em “Provas” (prazo de 7 dias, não vale nota).`;
  render();
}
function saeseCadernetaImprimir(turmaId){
  const s = planoState(); const d = s.hab[turmaId] || {}; const turma = (state.professor.turmas||[]).find(t => t.id===turmaId);
  const alunos = ((turma && turma.students)||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  const cods = priorCodsImpressao(turma);
  const folha = st => { const x = (d.alunoS||{})[st.id] || {};
    return `<section class="folha"><h1>🎯 Minha caderneta SAESE</h1><div class="sub">${esc(st.name)} · Turma ${esc(turma ? turma.name : '')} · CEETIP Gov. Marcelo Déda Chagas</div>
    <p class="inst">Marque com ✔ como você está em cada descritor ao fim de cada bimestre. A coluna “No app” mostra seu acerto nas questões já respondidas.</p>
    <table><tr><th>Descritor</th><th>Eu consigo...</th><th>No app</th><th>1º bim</th><th>2º bim</th><th>3º bim</th><th>4º bim</th></tr>
    ${cods.map(c => { const v = x[c] && x[c][1] ? Math.round(x[c][0]/x[c][1]*100) + '%' : '—';
      return `<tr><td class="c ${c.startsWith('MT')?'mt':'lp'}">${c}</td><td>${esc(SAESE_CAT[c].a)}</td><td class="n">${v}</td>${[1,2,3,4].map(()=>'<td class="bx">○ ainda não<br>○ às vezes<br>○ já consigo</td>').join('')}</tr>`; }).join('')}
    </table><p class="rod">LP = Língua Portuguesa · MT = Matemática · Matriz da Avaliação Somativa de Sergipe (SAESE), 3ª série do Ensino Médio.</p></section>`; };
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Caderneta SAESE — ${esc(turma?turma.name:'')}</title><style>
    body{font-family:Calibri,Arial,sans-serif;color:#222;margin:0} .folha{padding:12mm 12mm 8mm;page-break-after:always} h1{color:#6B1F2E;margin:0;font-size:20pt} .sub{color:#00695C;font-weight:700;margin:2px 0 6px}
    .inst{font-size:9.5pt;margin:4px 0 6px} table{border-collapse:collapse;width:100%;font-size:8.6pt} th{background:#F3E7C0;color:#6B1F2E} td,th{border:1px solid #bbb;padding:2px 4px;vertical-align:middle}
    .c{font-weight:700;color:#fff;white-space:nowrap;text-align:center} .lp{background:#00695C} .mt{background:#1F4E79} .n{text-align:center;font-weight:700} .bx{font-size:7pt;line-height:1.15;white-space:nowrap} .rod{font-size:8pt;color:#666;margin-top:4px}
    @page{size:A4;margin:0}</style></head><body>${alunos.map(folha).join('')}<script>setTimeout(()=>print(),400)<\/script></body></html>`;
  const w = window.open('', '_blank'); if(!w){ alert('Permita a abertura de janelas para imprimir.'); return; } w.document.write(html); w.document.close();
}
async function alunoCadernetaCarregar(){
  const al = state.aluno; al.caderneta = { carregando:true }; render();
  const porD = {};
  (al.dashboardRealizadas||[]).forEach(r => { const a = r.assessment; if(typeof resultReleased==='function' && !resultReleased(a)) return;
    (a.questions||[]).forEach(q => { if(q.type!=='mc' || q.annulled || !(q.saese||[]).length) return; const ok = r.response && r.response.answers && r.response.answers[q.id]===q.correctOptionId ? 1 : 0;
      q.saese.forEach(c => { const x = porD[c] = porD[c] || [0,0]; x[0]+=ok; x[1]++; }); }); });
  const auto = await planoLerJson(`saese-auto:${al.matriculaTurmaId||''}:${al.matriculaStudentId||nomeChave(al.name)}`, {});
  const metas = await planoLerJson(`saese-metas:${al.matriculaTurmaId||''}`, {});
  al.caderneta = { porD, auto, metas: (metas||{})['b' + saeseBimAtual()] || priorMetasPadrao(priorTurmaAluno()) };
  render();
}
function renderAlunoCadernetaBlock(){
  const al = state.aluno; const c = al.caderneta;
  if(!c){ setTimeout(alunoCadernetaCarregar, 0); return '<div class="card"><p>⏳ Carregando sua caderneta…</p></div>'; }
  if(c.carregando) return '<div class="card"><p>⏳ Carregando sua caderneta…</p></div>';
  const cor = p => p==null ? '#eee' : p < 50 ? '#f4c7c3' : p < 70 ? '#fde3c2' : '#cfead6';
  const op = [['0','Ainda não'],['1','Às vezes'],['2','Já consigo']];
  const linha = k => { const x = c.porD[k]; const p = x && x[1] ? Math.round(x[0]/x[1]*100) : null; const v = String((c.auto||{})[k] ?? '');
    return `<tr data-cad="${k}"><td style="white-space:nowrap;"><span class="av-saesecod" style="background:${k.startsWith('MT')?'#1F4E79':'#00695C'};font-size:.75rem;">${k}</span></td><td>${esc(SAESE_CAT[k].a)}${priorEstrela(k)}</td>
      <td style="text-align:center;background:${cor(p)};font-weight:700;">${p==null?'—':p+'%'}${x?`<div class="muted" style="font-weight:400;font-size:.7rem;">${x[1]} questão(ões)</div>`:''}</td>
      <td style="white-space:nowrap;">${op.map(([val,rot]) => `<button class="btn btn-sm ${v===val?'btn-primary':'btn-ghost'}" style="width:auto;padding:2px 6px;margin:1px;" data-action="saese-auto" data-d="${k}" data-v="${val}">${rot}</button>`).join('')}</td></tr>`; };
  const fortes = Object.keys(c.porD).filter(k => c.porD[k][1] >= 3 && c.porD[k][0]/c.porD[k][1] >= 0.7);
  const fracos = Object.keys(c.porD).filter(k => c.porD[k][1] >= 3 && c.porD[k][0]/c.porD[k][1] < 0.5);
  return pmAlunoHtml() + `<div class="card" data-caderneta><h3 style="margin-top:0;">🎯 Minha caderneta SAESE</h3>
    <p class="muted" style="font-size:.88rem;">Os descritores da Avaliação Somativa de Sergipe (SAESE) que você treina nas aulas. A coluna “No app” mostra seu acerto nas questões já corrigidas; na última coluna, diga como você se sente em cada um.</p>
    ${c.metas && (c.metas.codes||[]).length ? `<div data-cad-metas style="border:1px solid #C9A227;border-radius:8px;padding:6px 10px;margin:6px 0;font-size:.88rem;"><b>🎯 Metas da sua turma neste bimestre</b> (meta: ${c.metas.meta||70}% de acerto)${c.metas.codes.map(k => { const x = c.porD[k]; const p = x && x[1] ? Math.round(x[0]/x[1]*100) : null; return `<div style="margin-top:3px;"><span class="av-saesecod" style="background:${k.startsWith('MT')?'#1F4E79':'#00695C'};font-size:.72rem;">${k}</span> ${esc(SAESE_CAT[k].a)} — você: <b>${p==null?'sem dados':p+'%'}</b> ${p!=null && p >= (c.metas.meta||70) ? '✅' : ''}</div>`; }).join('')}</div>` : ''}
    ${fortes.length ? `<p style="color:#1d6b31;font-size:.9rem;">💪 Você vai bem em: <b>${fortes.join(', ')}</b></p>` : ''}${fracos.length ? `<div style="color:#b3261e;font-size:.9rem;">📌 Vale treinar mais:${fracos.map(k => `<div style="margin:3px 0 0 8px;"><b>${k}</b> ${esc(SAESE_CAT[k].a)}<div style="color:var(--ink);font-size:.84rem;">🏠 Para treinar em casa: ${esc(SAESE_CASA[k]||'')}</div></div>`).join('')}</div>` : ''}
    <h4 style="margin:10px 0 4px;color:#00695C;">Língua Portuguesa — leitura</h4>
    <div class="table-scroll"><table style="font-size:.84rem;"><tr><th>Descritor</th><th>Eu consigo...</th><th>No app</th><th>Como me sinto</th></tr>${Object.keys(SAESE_CAT).filter(k=>k.startsWith('LP')).map(linha).join('')}</table></div>
    <h4 style="margin:10px 0 4px;color:#1F4E79;">Matemática</h4>
    <div class="table-scroll"><table style="font-size:.84rem;"><tr><th>Descritor</th><th>Eu consigo...</th><th>No app</th><th>Como me sinto</th></tr>${Object.keys(SAESE_CAT).filter(k=>k.startsWith('MT') && priorMtVisivel(k, c)).map(linha).join('')}</table></div></div>`;
}
async function alunoSaeseAuto(k, v){
  const al = state.aluno; const c = al.caderneta; if(!c) return;
  c.auto = Object.assign({}, c.auto, { [k]: Number(v) });
  await window.storage.set(`saese-auto:${al.matriculaTurmaId||''}:${al.matriculaStudentId||nomeChave(al.name)}`, JSON.stringify(c.auto), true);
  render();
}
__parteOk('humanas');
