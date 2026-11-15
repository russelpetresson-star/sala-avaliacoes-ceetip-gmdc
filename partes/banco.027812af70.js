/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "banco" */
function bankDisciplinaKey(q){ return q.disciplinaId || (q.disciplinaName ? 'n:'+q.disciplinaName : ''); }
function bankDisciplinaNome(q){
  if(q.disciplinaId){ const d = state.professor.disciplinas.find(x=>x.id===q.disciplinaId); if(d) return d.name; }
  return q.disciplinaName || 'Sem disciplina';
}
function stampBankDisciplina(q, disciplinaId){
  if(!q || q.disciplinaId || !disciplinaId) return q;
  const d = state.professor.disciplinas.find(x=>x.id===disciplinaId);
  if(d){ q.disciplinaId = d.id; q.disciplinaName = d.name; }
  return q;
}
function bankAgruparPorDisciplina(lista, primeiraId){
  const grupos = {};
  lista.forEach(q => { const k = bankDisciplinaKey(q); (grupos[k] = grupos[k] || {key:k, nome:bankDisciplinaNome(q), questoes:[]}).questoes.push(q); });
  return Object.values(grupos).sort((x,y) => {
    if(primeiraId){ if(x.key===primeiraId) return -1; if(y.key===primeiraId) return 1; }
    if(!x.key) return 1; if(!y.key) return -1;
    return x.nome.localeCompare(y.nome,'pt-BR');
  });
}
function renderBancoQuestaoItem(q){
  return `
      <div class="list-item">
        <div>
          <span class="q-tag">${questionTagLabel(q.type)} · ${q.points} pt(s)${q.descritorSaeb?' · '+esc(q.descritorSaeb):''}${q.conteudo?' · '+esc(q.conteudo):''}</span><br>
          ${q.assunto ? `<span class="muted" style="font-size:.8rem;">🏷️ ${esc(q.assunto)}</span><br>` : ''}${esc(q.text).slice(0,90)}${q.text.length>90?'…':''}
        </div>
        <div class="row" style="flex:0 0 auto; gap:6px;">
          <button class="btn btn-ghost btn-sm" data-action="edit-bank-question" data-qid="${q.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-action="delete-bank-question" data-qid="${q.id}">Excluir</button>
        </div>
      </div>`;
}
function renderBanco(){
  const p = state.professor;
  if(p.aiGen.open){
    return renderAiGen();
  }
  if(p.enemOf && p.enemOf.open){
    return renderEnemOficial();
  }
  if(p.pasteImport.open){
    return renderPasteImport();
  }
  if(p.book.open){
    return renderBookImport();
  }
  if(p.newBankQuestion){
    const livrosDisponiveis = (p.livros||[]).filter(l=>l.downloadUrl);
    const selectedLivro = livrosDisponiveis.find(l=>l.id===p.bancoLivroSelectedId);
    const embedUrl = selectedLivro ? driveEmbedUrl(selectedLivro.downloadUrl) : null;
    return `
      <div class="card">
        <h2>${p.editingBankId ? 'Editar questão' : 'Nova questão do banco'}</h2>
        <label>Disciplina desta questão</label>
        <select data-action="bank-set-disciplina">
          <option value="">Sem disciplina</option>
          ${p.disciplinas.map(d => `<option value="${d.id}" ${p.newBankQuestion.disciplinaId===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}
        </select>
        ${renderQuestionEditor(p.newBankQuestion, 0, false)}
        <div id="bank-err"></div>
        <div class="row" style="margin-top:14px;">
          <button class="btn btn-ghost" data-action="cancel-bank-question">Cancelar</button>
          <button class="btn btn-primary" data-action="save-bank-question">Salvar no banco</button>
        </div>
        <hr style="margin:20px 0; border:none; border-top:1px solid var(--paper-line);">
        <h3>📖 Consultar livro didático</h3>
        <p class="muted" style="font-size:.85rem;">Abra o livro aqui do lado para procurar uma questão ou trecho e digitar acima.</p>
        ${livrosDisponiveis.length===0 ? '<p class="muted">Nenhum livro disponível ainda — peça à coordenação para anexar na aba "Livro Didático".</p>' : `
          <select id="banco-livro-select">
            <option value="">Selecione um livro...</option>
            ${livrosDisponiveis.map(l => `<option value="${l.id}" ${p.bancoLivroSelectedId===l.id?'selected':''}>${esc(l.componente)} — ${esc(l.colecao)}</option>`).join('')}
          </select>
          ${embedUrl ? `<iframe src="${embedUrl}" style="width:100%; height:60vh; border:1px solid var(--paper-line); border-radius:8px; margin-top:10px;" allow="autoplay"></iframe>` : ''}
        `}
      </div>
    `;
  }
  let body;
  const avisoBanco = p.bankPendente ? `<div class="err" style="background:#fdecea;border:1px solid #d33;padding:10px 12px;border-radius:10px;margin:8px 0;"><strong>⚠️ Há questões que ainda NÃO foram salvas no banco.</strong> ${esc(p.bankMsgErro||'')}<br><button class="btn btn-primary btn-sm" style="margin-top:6px;" data-action="banco-salvar-de-novo">Tentar salvar de novo</button></div>` : '';
  if(p.bankErro){
    body = `<div class="err" style="background:#fdecea;border:1px solid #d33;padding:12px 14px;border-radius:10px;"><strong>Não consegui carregar o seu banco de questões.</strong><br>Suas questões NÃO foram apagadas: o app só não conseguiu ler agora (internet fraca ou servidor ocupado). Por segurança ele não grava nada até conseguir ler.<br><button class="btn btn-primary btn-sm" style="margin-top:8px;" data-action="banco-recarregar">Tentar de novo</button></div>`;
  } else if(p.bankLoading){
    body = `<div class="spinner"></div>`;
  } else if(p.bank.length===0){
    body = avisoBanco + `<div class="empty">Nenhuma questão salva ainda.<br>Crie questões aqui para reutilizar em várias provas.</div>`;
  } else {
    const filtro = p.bancoDisciplinaId || '';
    const daDisc = filtro==='__sem' ? p.bank.filter(q=>!bankDisciplinaKey(q)) : filtro ? p.bank.filter(q=>bankDisciplinaKey(q)===filtro) : p.bank;
    const contAll = {}; daDisc.forEach(q => { const c = (q.conteudo||'').trim(); if(c) contAll[c] = (contAll[c]||0) + 1; });
    if(p.bancoConteudo && p.bancoConteudo!=='__sem' && !contAll[p.bancoConteudo]) p.bancoConteudo = '';
    const bTermos = enemOfNorm(p.bancoBusca||'').split(/\s+/).filter(Boolean);
    const visiveis = daDisc.filter(q => (!p.bancoConteudo || (p.bancoConteudo==='__sem' ? !(q.conteudo||'').trim() : (q.conteudo||'').trim()===p.bancoConteudo))
      && (!bTermos.length || (h => bTermos.every(t => h.includes(t)))(enemOfNorm([q.conteudo, q.assunto, q.descritorSaeb, q.text, (q.options||[]).map(o => o.text).join(' ')].join(' ')))));
    const grupos = bankAgruparPorDisciplina(visiveis);
    const chavesBanco = bankAgruparPorDisciplina(p.bank);
    body = avisoBanco + `
      <label>Disciplina</label>
      <select data-action="banco-filtro-disciplina" style="max-width:340px;">
        <option value="">Todas as disciplinas (${p.bank.length})</option>
        ${chavesBanco.map(g => `<option value="${g.key||'__sem'}" ${filtro===(g.key||'__sem')?'selected':''}>${esc(g.nome)} (${g.questoes.length})</option>`).join('')}
      </select>
      <p class="muted" style="font-size:.8rem;">Questões novas criadas ou importadas aqui entram na disciplina selecionada. Questões sem disciplina podem ser classificadas em "Editar".</p>
      <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <div><label>Conteúdo / tema</label><select data-action="banco-filtro-conteudo" style="max-width:340px;"><option value="">Todos (${daDisc.length})</option>${Object.keys(contAll).sort((a,b) => a.localeCompare(b,'pt')).map(c => `<option value="${esc(c)}" ${p.bancoConteudo===c?'selected':''}>${esc(c)} (${contAll[c]})</option>`).join('')}${daDisc.some(q => !(q.conteudo||'').trim()) ? `<option value="__sem" ${p.bancoConteudo==='__sem'?'selected':''}>Sem conteúdo definido</option>` : ''}</select></div>
        <div style="flex:1 1 220px;"><label>Buscar no banco</label><input type="text" data-action-input="banco-busca" value="${esc(p.bancoBusca||'')}" placeholder="Palavra do enunciado, conteúdo, descritor…"></div>
      </div>
      ${(p.bancoConteudo || bTermos.length) ? `<p class="muted" style="font-size:.8rem;">${visiveis.length} questão(ões) com esse filtro.</p>` : ''}
      ${grupos.length===0 ? '<div class="empty">Nenhuma questão com esse filtro.</div>' : grupos.map(g => `
        <details open style="margin-top:12px;">
          <summary style="cursor:pointer; font-weight:700;">📚 ${esc(g.nome)} <span class="muted" style="font-weight:400;">(${g.questoes.length})</span></summary>
          ${g.questoes.map(renderBancoQuestaoItem).join('')}
        </details>`).join('')}
    `;
  }
  return `
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2>Banco de questões</h2>
      </div>
      <div class="type-pick">
        <button class="btn btn-ghost btn-sm" data-action="new-bank-question" data-qtype="mc">+ Múltipla escolha</button>
        <button class="btn btn-ghost btn-sm" data-action="new-bank-question" data-qtype="vf">+ Verdadeiro/Falso</button>
        <button class="btn btn-ghost btn-sm" data-action="new-bank-question" data-qtype="dissertativa">+ Dissertativa</button>
      </div>
      <hr style="margin:16px 0; border:none; border-top:1px solid var(--paper-line);">
      <h3 style="margin:0 0 8px;">🤖 Criar questões com IA${infoI('<p>A IA gera as questões pra você revisar antes de adicionar ao banco: sempre confira o gabarito.</p><p>Ela usa uma chave compartilhada por toda a escola, com limite baixo. Se der erro de "limite excedido" com frequência, cadastre sua própria chave gratuita em <b>Meu perfil</b> (leva 1 minuto).</p>', 'Sobre a IA')}</h3>
      <p class="muted" style="font-size:.85rem;">Deu "limite excedido"? <a href="#" data-action="open-professor-profile">Use sua chave gratuita</a>.</p>
      <div class="type-pick">
        <button class="btn btn-ghost btn-sm" data-action="open-ai-gen">🤖 Gerar por tema</button>
        <button class="btn btn-ghost btn-sm" data-action="open-book-import">📖 Importar de um PDF (livro/lista)</button>
        <button class="btn btn-ghost btn-sm" data-action="open-paste-import">📋 Importar texto colado</button>
      </div>
      <hr style="margin:16px 0; border:none; border-top:1px solid var(--paper-line);">
      <h3 style="margin:0 0 8px;">📝 Questões oficiais do ENEM (INEP)</h3>
      <p class="muted" style="font-size:.85rem;">Questões reais das provas do ENEM, com gabarito oficial, explicação e ligação com as aulas do plano. Escolha as que quiser e adicione ao seu banco.</p>
      <div class="type-pick"><button class="btn btn-ghost btn-sm" data-action="enem-of-open">📝 Abrir questões do ENEM</button></div>
      ${livqBloco()}
      <div style="margin-top:14px;">${body}</div>
    </div>
  `;
}
const ENEM_OF_COD = { GEO:'Geografia', HIS:'História', SOC:'Sociologia', FIL:'Filosofia', BIO:'Biologia', QUI:'Química', FIS:'Física' };
const ENEM_OF_PREF = { geografia:'GEO', historia:'HIS', sociologia:'SOC', filosofia:'FIL', biologia:'BIO', quimica:'QUI', fisica:'FIS' };
const ENEM_AREA_NOME = { CH:'Ciências Humanas', CN:'Ciências da Natureza' };
function enemAreaDaDisc(nome){ const k = Object.keys(ENEM_OF_DISC).find(x => enemOfNorm(ENEM_OF_DISC[x])===enemOfNorm(nome)); return k ? ENEM_OF_AREA[k] : null; }
async function enemOfCarregar(){ if(!ENEM_OF_CACHE) ENEM_OF_CACHE = ((await enemOfLerBanco()) || []).slice().sort((a,b) => (b.ano - a.ano) || (a.numero - b.numero)); return ENEM_OF_CACHE; }
function enemOfAulaTxt(c){ const m = /^([A-Z]{3})(\d)-(\d+)$/.exec(c||''); return m ? `${ENEM_OF_COD[m[1]]||m[1]} · ${m[2]}ª série · aula ${m[3]}` : c; }
function enemOfNorm(t){ return (t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim(); }
function enemOfNoBanco(q){ return (state.professor.bank||[]).some(x => x.enemId===q.id); }
async function enemOfAbrir(){ const p = state.professor; p.enemOf = { open:true, loading:true, lista:[], disc:'', ano:'', tema:'', busca:'', ver:{} }; render();
  p.enemOf.lista = await enemOfCarregar(); p.enemOf.loading = false;
  // questões do ENEM já adicionadas antes da classificação por tema: atualiza o conteúdo
  let mudou = false; (p.bank||[]).forEach(b => { if(!b.enemId || b.assunto) return; const q = p.enemOf.lista.find(x => x.id===b.enemId); if(q && q.tema){ b.conteudo = q.tema; b.assunto = `${q.assunto} (ENEM ${q.ano}, questão ${q.numero})`; mudou = true; } });
  if(mudou){ try{ await saveBankToStorage(); }catch(_){} }
  const minhas = (p.disciplinas||[]).map(d => enemOfNorm(d.name)); const k = Object.keys(ENEM_OF_DISC).find(x => minhas.includes(enemOfNorm(ENEM_OF_DISC[x])));
  if(k && p.enemOf.lista.some(q => q.disciplina===k)) p.enemOf.disc = k; render(); }
async function enemOfQuestaoAvaliacao(q, cache){
  const options = q.opcoes.map(t => ({ id: cryptoId(), text: t }));
  const nova = { id: cryptoId(), type:'mc', text: (q.texto ? q.texto + '\n\n' : '') + q.comando, points: 1, image: null, annulled:false, descritorSaeb: q.habilidade ? 'ENEM ' + q.habilidade : '', conteudo: q.tema || `ENEM ${q.ano} · questão ${q.numero}`, assunto: q.assunto ? `${q.assunto} (ENEM ${q.ano}, questão ${q.numero})` : `ENEM ${q.ano} · questão ${q.numero}`, options, correctOptionId: options[q.correta].id, explicacao: saeseExplicacao(q) + (q.fonte ? ` Fonte: ${q.fonte}.` : ''), saese: q.saese || [], enemId: q.id };
  if(q.imagem){ cache = cache || {}; if(!(q.imagem in cache)) cache[q.imagem] = await planoLerJson(`plano-livro-img:${q.imagem}`, null); if(cache[q.imagem]) nova.image = cache[q.imagem]; }
  return nova;
}
function enemOfFiltrar(e){
  const base = e.lista.filter(q => (!e.disc || q.disciplina===e.disc || (q.aulas||[]).some(c => c.startsWith(ENEM_OF_PREF[e.disc]))) && (!e.ano || String(q.ano)===String(e.ano)));
  if(e.tema && !base.some(q => q.tema===e.tema)) e.tema = '';
  const termos = enemOfNorm(e.busca||'').split(/\s+/).filter(Boolean);
  const vis = base.filter(q => (!e.tema || q.tema===e.tema) && (!termos.length || (h => termos.every(t => h.includes(t)))(enemOfNorm([q.tema, q.assunto, q.texto, q.comando, (q.opcoes||[]).join(' '), q.explicacao].join(' ')))));
  return { base, vis };
}
function enemOfJaAplicadas(){ const ids = new Set(); (state.professor.assessments||[]).forEach(a => (a.questions||[]).forEach(q => { if(q.enemId) ids.add(q.enemId); })); return ids; }
function enemOfEscolherSimulado(pool, n, ineditas){
  const usadas = ineditas ? enemOfJaAplicadas() : new Set();
  const emb = pool.map(q => ({ q, r: Math.random() + (usadas.has(q.id) ? 1 : 0) })).sort((a,b) => a.r - b.r).map(x => x.q);
  const porDisc = {}; emb.forEach(q => (porDisc[q.disciplina] = porDisc[q.disciplina] || []).push(q));
  const filas = Object.keys(porDisc).map(d => { const lista = porDisc[d], usoTema = {}, out = [];
    while(lista.length){ let mi = 0, mv = Infinity; for(let i = 0; i < lista.length; i++){ const u = usoTema[lista[i].tema||''] || 0; if(u < mv){ mv = u; mi = i; } if(u===0) break; }
      const q = lista.splice(mi, 1)[0]; usoTema[q.tema||''] = (usoTema[q.tema||''] || 0) + 1; out.push(q); }
    return out; });
  const escolha = []; let k = 0; while(escolha.length < n && filas.some(f => f.length)){ const f = filas[k % filas.length]; if(f.length) escolha.push(f.shift()); k++; }
  const ordem = ['historia','geografia','filosofia','sociologia','biologia','quimica','fisica'];
  return escolha.sort((a,b) => (ordem.indexOf(a.disciplina) - ordem.indexOf(b.disciplina)) || (a.ano - b.ano) || (a.numero - b.numero));
}
async function enemOfMontarSimulado(){
  const p = state.professor; const e = p.enemOf; if(!e) return;
  let { vis } = enemOfFiltrar(e);
  // o simulado não mistura áreas do ENEM: fica com a área da disciplina filtrada, ou a do professor, ou a mais frequente
  const areasVis = [...new Set(vis.map(q => ENEM_OF_AREA[q.disciplina] || q.disciplina))];
  if(areasVis.length > 1){
    const minhasA = (p.disciplinas||[]).map(d => enemAreaDaDisc(d.name)).filter(Boolean);
    const cont = {}; vis.forEach(q => { const a = ENEM_OF_AREA[q.disciplina]; cont[a] = (cont[a]||0) + 1; });
    const area = (e.disc && ENEM_OF_AREA[e.disc]) || areasVis.find(a => minhasA.includes(a)) || Object.keys(cont).sort((a,b) => cont[b]-cont[a])[0];
    vis = vis.filter(q => ENEM_OF_AREA[q.disciplina]===area);
  }
  const n = Math.min(parseInt(e.simN||'10', 10) || 10, vis.length);
  if(n < 3){ alert('Há poucas questões com esses filtros. Escolha outro tema, ano ou disciplina, ou limpe a busca.'); return; }
  const escolha = enemOfEscolherSimulado(vis, n, e.simIneditas !== false);
  const cache = {}; const qs = []; for(const q of escolha) qs.push(await enemOfQuestaoAvaliacao(q, cache));
  planoPontosIguais(qs, 10);
  const discs = [...new Set(escolha.map(q => q.disciplina))];
  const nomeArea = discs.length === 1 ? (ENEM_OF_DISC[discs[0]]||discs[0]) : (ENEM_AREA_NOME[ENEM_OF_AREA[discs[0]]] || 'ENEM');
  const freq = {}; escolha.forEach(q => freq[q.disciplina] = (freq[q.disciplina]||0) + 1);
  const minhas = (p.disciplinas||[]); const achar = k => minhas.find(d => enemOfNorm(d.name)===enemOfNorm(ENEM_OF_DISC[k]||''));
  const kDisc = e.disc || Object.keys(freq).sort((a,b) => freq[b]-freq[a]).find(k => achar(k)) || '';
  const disc = achar(kDisc) || (minhas.length === 1 ? minhas[0] : null);
  const na = freshAssessment();
  na.instrumento = 'avaliacao'; na.title = `Simulado ENEM — ${nomeArea}${e.tema ? ' — ' + e.tema : ''} (${qs.length} questões)`;
  na.disciplinaId = disc ? disc.id : ''; na.turmaIds = []; na.questions = qs; na.enemSimulado = true;
  if(e.simModo === 'papel'){ na.title = na.title.replace('Simulado ENEM', 'Simulado ENEM (papel)'); na.securityEnabled = false; na.exigeLiberacao = false; na.minMinutesPerQuestion = null; na.saesePapel = true; }
  const temas = [...new Set(escolha.map(q => q.tema).filter(Boolean))];
  p.enemOf = null; p.newAssessment = na; p.editingCode = null; p.editingResponseCount = 0; p.pickerOpen = false; p.pickerSelected = [];
  p.subview = 'avaliacoes'; p.mode = 'new'; render(); window.scrollTo(0,0);
  alert(`Simulado ENEM montado: ${qs.length} questões (${Object.keys(freq).map(k => `${ENEM_OF_DISC[k]||k}: ${freq[k]}`).join(', ')}), de ${temas.length} tema(s) diferentes, valendo 10 pontos no total.\n\nTempo sugerido: cerca de ${Math.round(qs.length * 3)} minutos (3 minutos por questão, o ritmo do ENEM).\n\nAgora escolha a(s) turma(s), a unidade e as datas e clique em salvar.${e.simModo === 'papel' ? '\n\nEm papel: depois de salvar, use “Imprimir / PDF” e “Gabaritos por aluno” em Minhas avaliações, e leia os cartões com o celular.' : ''}`);
}
async function enemOfAdicionar(id){
  const p = state.professor; const q = (p.enemOf.lista||[]).find(x => x.id===id); if(!q || enemOfNoBanco(q)) return;
  const options = q.opcoes.map(t => ({ id: cryptoId(), text: t }));
  const nova = { id: cryptoId(), type:'mc', text: (q.texto ? q.texto + '\n\n' : '') + q.comando, points: 1, image: null, annulled:false, descritorSaeb: q.habilidade ? 'ENEM ' + q.habilidade : '', conteudo: q.tema || `ENEM ${q.ano} · questão ${q.numero}`, assunto: q.assunto ? `${q.assunto} (ENEM ${q.ano}, questão ${q.numero})` : `ENEM ${q.ano} · questão ${q.numero}`, options, correctOptionId: options[q.correta].id, explicacao: saeseExplicacao(q) + (q.fonte ? ` Fonte: ${q.fonte}.` : ''), saese: q.saese || [], enemId: q.id };
  if(q.imagem){ const img = await planoLerJson(`plano-livro-img:${q.imagem}`, null); if(img) nova.image = img; }
  const d = (p.disciplinas||[]).find(x => enemOfNorm(x.name)===enemOfNorm(ENEM_OF_DISC[q.disciplina]||''));
  stampBankDisciplina(nova, d ? d.id : (p.bancoDisciplinaId && p.bancoDisciplinaId!=='__sem' ? p.bancoDisciplinaId : ''));
  p.bank.push(nova);
  try{ await saveBankToStorage(); }catch(e){ const i = p.bank.indexOf(nova); if(i>=0) p.bank.splice(i, 1); }
  render();
}
function renderEnemOficial(){
  const e = state.professor.enemOf; const L = ['A','B','C','D','E'];
  if(e.loading) return `<div class="card"><h2>📝 Questões oficiais do ENEM</h2><div class="spinner"></div></div>`;
  const anos = [...new Set(e.lista.map(q => q.ano))];
  const { base, vis } = enemOfFiltrar(e);
  const temas = {}; base.forEach(q => { if(q.tema){ const d = ENEM_OF_DISC[q.disciplina]||q.disciplina; (temas[d] = temas[d] || {})[q.tema] = ((temas[d]||{})[q.tema]||0) + 1; } });
  const nIned = (() => { const u = enemOfJaAplicadas(); return vis.filter(q => !u.has(q.id)).length; })();
  const simCard = `<div class="q-card" data-enem-sim style="margin-top:12px;background:#fbf6ee;border-left:5px solid var(--wine,#7a1f2b);">
      <h3 style="margin:0 0 4px;">🧪 Montar simulado ENEM</h3>
      <p class="muted" style="font-size:.84rem;margin:0 0 8px;">Usa as questões dos filtros acima (${vis.length} disponíveis, ${nIned} ainda não usadas nas suas avaliações). Sem disciplina escolhida, o simulado mistura as quatro disciplinas de Humanas. O app equilibra disciplinas e temas e já põe gabarito, explicação, tema e habilidade em cada questão.</p>
      <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <div><label>Questões</label><select data-action="enem-sim-n">${[5,10,15,20,30,45].map(v => `<option value="${v}" ${String(e.simN||'10')===String(v)?'selected':''}>${v}${v===45?' (prova completa de Humanas)':''}</option>`).join('')}</select></div>
        <div><label>Aplicação</label><select data-action="enem-sim-modo"><option value="app" ${e.simModo!=='papel'?'selected':''}>No app (tablets)</option><option value="papel" ${e.simModo==='papel'?'selected':''}>Em papel (cartão-resposta)</option></select></div>
        <label style="display:flex;gap:6px;align-items:center;font-size:.85rem;text-transform:none;letter-spacing:0;"><input type="checkbox" data-action="enem-sim-ineditas" ${e.simIneditas!==false?'checked':''} style="width:auto;"> Priorizar questões que eu ainda não usei</label>
        <button class="btn btn-primary btn-sm" data-action="enem-sim-montar" style="flex:0 0 auto;">Montar simulado</button>
      </div>
      <p class="muted" style="font-size:.78rem;margin:6px 0 0;">Depois de aplicado, o resultado aparece em Meu Painel → 📝 ENEM: acerto por tema e por habilidade e a alternativa errada mais marcada em cada questão.</p>
    </div>`;
  const temaOpts = Object.keys(temas).sort().map(d => `<optgroup label="${esc(d)}">${Object.keys(temas[d]).sort((a,b) => a.localeCompare(b,'pt')).map(t => `<option value="${esc(t)}" ${e.tema===t?'selected':''}>${esc(t)} (${temas[d][t]})</option>`).join('')}</optgroup>`).join('');
  const item = q => { const aberto = !!e.ver[q.id]; const ja = enemOfNoBanco(q);
    return `<div class="q-card" data-enem-of="${esc(q.id)}" style="margin-top:10px;">
      <div class="row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <span class="q-tag">ENEM ${q.ano} · questão ${q.numero} · ${esc(ENEM_OF_DISC[q.disciplina]||q.disciplina)}${q.habilidade ? ' · ' + esc(q.habilidade) : ''}</span>
        <span>${q.imagem ? '<span class="muted" style="font-size:.8rem;">🖼️ com imagem</span> ' : ''}<button class="btn btn-ghost btn-sm" data-action="enem-of-ver" data-id="${esc(q.id)}">${aberto ? 'Fechar' : 'Ver questão'}</button>
        ${ja ? '<span class="pill" style="background:#E9F6EC;color:#1d6b31;">✓ no seu banco</span>' : `<button class="btn btn-primary btn-sm" data-action="enem-of-add" data-id="${esc(q.id)}">+ Meu banco</button>`}</span>
      </div>
      ${q.tema ? `<div style="margin-top:4px;font-size:.88rem;color:var(--wine,#7a1f2b);">🏷️ <b>${esc(q.tema)}</b>${q.assunto ? ' — ' + esc(q.assunto) : ''}</div>` : ''}
      <div style="margin-top:6px;${aberto ? 'white-space:pre-line;' : ''}">${aberto ? esc(q.texto) : esc((q.texto || q.comando).slice(0, 220)) + ((q.texto||'').length > 220 ? '…' : '')}</div>
      ${aberto ? `<p style="font-weight:700;margin:8px 0 4px;">${esc(q.comando)}</p>${q.opcoes.map((o,i) => `<div style="${i===q.correta ? 'color:#1d6b31;font-weight:700;' : ''}">${L[i]}) ${esc(o)}${i===q.correta ? ' ✓' : ''}</div>`).join('')}
        <p class="muted" style="font-size:.85rem;margin-top:8px;"><b>Por que ${L[q.correta]}:</b> ${esc(q.explicacao||'')}</p>` : ''}
      <p class="muted" style="font-size:.78rem;margin:6px 0 0;">📘 Aulas: ${(q.aulas||[]).map(enemOfAulaTxt).map(esc).join(' · ')}${(q.saese||[]).length ? ' · 🎯 SAESE ' + esc(q.saese.join(', ')) : ''}</p>
    </div>`; };
  return `<div class="card">
    <div class="row" style="align-items:center;justify-content:space-between;"><h2>📝 Questões oficiais do ENEM</h2><button class="btn btn-ghost btn-sm" data-action="enem-of-close">← Voltar ao banco</button></div>
    ${e.lista.length === 0 ? '<div class="empty">Nenhuma questão oficial do ENEM foi importada ainda. Elas chegam junto com os planos de aula (peça à coordenação para importar o plano atualizado).</div>' : `
    <p class="muted" style="font-size:.85rem;">Questões das provas oficiais do INEP, com gabarito oficial. A habilidade e as aulas ligadas são uma classificação pedagógica da escola. Ao adicionar, a questão vai para o seu banco e pode entrar em qualquer avaliação.</p>
    <div class="row" style="gap:10px;flex-wrap:wrap;">
      <div><label>Disciplina</label><select data-action="enem-of-disc"><option value="">Todas (${e.lista.length})</option>${Object.entries(ENEM_OF_DISC).map(([k,n]) => `<option value="${k}" ${e.disc===k?'selected':''}>${n}</option>`).join('')}</select></div>
      <div><label>Ano</label><select data-action="enem-of-ano"><option value="">Todos</option>${anos.map(a => `<option value="${a}" ${String(e.ano)===String(a)?'selected':''}>${a}</option>`).join('')}</select></div>
      ${temaOpts ? `<div><label>Tema</label><select data-action="enem-of-tema" style="max-width:340px;"><option value="">Todos os temas</option>${temaOpts}</select></div>` : ''}
      <div style="flex:1 1 220px;"><label>Buscar</label><input type="text" data-action-input="enem-of-busca" value="${esc(e.busca||'')}" placeholder="Ex.: Vargas, clima, Kant, racismo…"></div>
    </div>
    ${simCard}
    <p class="muted" style="font-size:.8rem;margin-top:8px;">${vis.length} questão(ões). Fonte: INEP — Exame Nacional do Ensino Médio.</p>
    ${vis.map(item).join('') || '<div class="empty">Nenhuma questão com esse filtro.</div>'}`}
  </div>`;
}
function chatBridgeState(){ const p = state.professor; if(!p.chatBridge) p.chatBridge = { kind:'', open:false, prompt:'', resposta:'', erro:'', copiado:false }; return p.chatBridge; }
function chatBridgeAbrir(kind){
  const p = state.professor, cb = chatBridgeState();
  cb.erro = ''; cb.copiado = false; cb.resposta = '';
  if(kind==='gen'){
    const g = p.aiGen;
    const tema = (document.getElementById('ai-tema-input')||{value:g.tema}).value.trim();
    const qtd = parseInt((document.getElementById('ai-qtd-input')||{value:g.quantidade}).value) || 5;
    const dif = (document.getElementById('ai-dificuldade-input')||{value:g.dificuldade}).value;
    g.tema = tema; g.quantidade = qtd; g.dificuldade = dif;
    if(!tema){ g.error = 'Informe o tema da questão antes de usar o chat de IA.'; render(); return; }
    if(g.tipos.length===0){ g.error = 'Marque ao menos um tipo de questão.'; render(); return; }
    g.error = '';
    cb.prompt = buildChatBridgePromptGen(g, tema, dif, qtd);
  } else {
    const g = p.pasteImport;
    const texto = (document.getElementById('paste-text-input')||{value:g.text}).value.trim();
    g.text = texto;
    if(!texto){ g.error = 'Cole o texto das questões antes de usar o chat de IA.'; render(); return; }
    g.error = '';
    cb.prompt = buildChatBridgePromptImport(texto);
  }
  cb.kind = kind; cb.open = true;
  render();
}
async function chatBridgeCopiar(){
  const cb = chatBridgeState();
  let ok = false;
  try{ await navigator.clipboard.writeText(cb.prompt); ok = true; }catch(e){}
  if(!ok){
    const ta = document.getElementById('chat-bridge-prompt');
    if(ta){ ta.focus(); ta.select(); try{ ok = document.execCommand('copy'); }catch(e){} }
  }
  cb.copiado = ok;
  cb.erro = ok ? '' : 'Não consegui copiar automaticamente — selecione o texto da caixa e copie (Ctrl+C).';
  const respEl = document.getElementById('chat-bridge-resposta'); if(respEl) cb.resposta = respEl.value;
  render();
}
function extrairItensDeRespostaChat(texto){
  let t = String(texto||'').trim();
  const cerca = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
  if(cerca) t = cerca[1].trim();
  const ini = t.indexOf('['), fim = t.lastIndexOf(']');
  if(ini>=0 && fim>ini){ try{ const r = JSON.parse(t.slice(ini, fim+1)); if(Array.isArray(r)) return r; }catch(e){} }
  const ob = t.indexOf('{'), obFim = t.lastIndexOf('}');
  if(ob>=0 && obFim>ob){ try{ const r = JSON.parse(t.slice(ob, obFim+1)); const arr = r.questoes || r.questions; if(Array.isArray(arr)) return arr; }catch(e){} }
  return salvarJsonParcial(t) || [];
}
function chatBridgeConverter(){
  const p = state.professor, cb = chatBridgeState();
  const el = document.getElementById('chat-bridge-resposta');
  cb.resposta = el ? el.value : cb.resposta;
  if(!cb.resposta.trim()){ cb.erro = 'Cole aqui a resposta que o chat de IA deu.'; render(); return; }
  const mapped = mapearItensParaQuestoes(extrairItensDeRespostaChat(cb.resposta));
  if(mapped.length===0){ cb.erro = 'Não encontrei questões nessa resposta. Confira se você colou a resposta inteira (o bloco que começa com [ e termina com ]). Se o chat respondeu em outro formato, peça: "responda só com o bloco JSON no formato pedido".'; render(); return; }
  const g = cb.kind==='gen' ? p.aiGen : p.pasteImport;
  g.results = mapped; g.selected = mapped.map((_,i)=>i); g.error = '';
  if(cb.kind==='import') g.aviso = '';
  cb.open = false; cb.resposta = ''; cb.erro = '';
  render();
}
function renderChatBridge(kind){
  const cb = chatBridgeState();
  if(!(cb.open && cb.kind===kind)){
    return `<div style="margin-top:14px; padding-top:12px; border-top:1px dashed var(--paper-line);">
      <button class="btn btn-ghost btn-sm" data-action="chat-bridge-abrir" data-kind="${kind}">💬 Usar meu chat de IA (grátis)</button>
      <p class="muted" style="font-size:.8rem; margin:6px 0 0;">Sem limite do app: você cola o pedido no ChatGPT, Gemini, Claude ou Copilot que já usa e traz a resposta de volta.</p>
    </div>`;
  }
  return `<div class="card" style="margin-top:14px; border:2px solid var(--green);">
    <div class="row" style="align-items:center; justify-content:space-between;">
      <h3 style="margin:0;">💬 Usar meu chat de IA</h3>
      <button class="btn btn-ghost btn-sm" data-action="chat-bridge-fechar">✕ Fechar</button>
    </div>
    <p style="margin:10px 0 4px;"><strong>1.</strong> Copie o pedido:</p>
    <textarea id="chat-bridge-prompt" readonly style="min-height:110px; font-size:.82rem;">${esc(cb.prompt)}</textarea>
    <button class="btn btn-primary btn-sm" data-action="chat-bridge-copiar" style="margin-top:6px;">${cb.copiado ? '✓ Copiado!' : '📋 Copiar pedido'}</button>
    <p style="margin:12px 0 4px;"><strong>2.</strong> Abra o chat, cole o pedido e envie:</p>
    <div class="row" style="gap:6px; flex-wrap:wrap;">
      <a class="btn btn-ghost btn-sm" href="https://chatgpt.com" target="_blank" rel="noopener">ChatGPT</a>
      <a class="btn btn-ghost btn-sm" href="https://gemini.google.com" target="_blank" rel="noopener">Gemini</a>
      <a class="btn btn-ghost btn-sm" href="https://claude.ai" target="_blank" rel="noopener">Claude</a>
      <a class="btn btn-ghost btn-sm" href="https://copilot.microsoft.com" target="_blank" rel="noopener">Copilot</a>
    </div>
    ${kind==='gen' ? '<p class="muted" style="font-size:.8rem; margin:8px 0 0;">🖼️ O pedido também manda o chat criar uma imagem para cada questão (ChatGPT e Gemini criam; o Claude só descreve). Baixe as imagens: você anexa cada uma à sua questão depois de converter.</p>' : ''}
    <p style="margin:12px 0 4px;"><strong>3.</strong> Copie a resposta do chat (o bloco de código) e cole aqui:</p>
    <textarea id="chat-bridge-resposta" style="min-height:140px;" placeholder="Cole aqui a resposta do chat de IA...">${esc(cb.resposta)}</textarea>
    ${cb.erro ? `<p class="err">${esc(cb.erro)}</p>` : ''}
    <button class="btn btn-primary" data-action="chat-bridge-converter" style="margin-top:8px;">Converter em questões</button>
    <p class="muted" style="font-size:.78rem; margin-top:8px;">Sempre confira o gabarito antes de usar. Não cole dados de alunos no chat.</p>
  </div>`;
}
function renderAiGen(){
  const g = state.professor.aiGen;
  if(g.loading){
    return `<div class="card"><h2>Gerando questões...</h2><div class="spinner"></div><p class="muted center">A IA está elaborando as questões sobre "${esc(g.tema)}".</p></div>`;
  }
  if(g.results){
    return `
      <div class="card">
        <h2>Questões geradas</h2>
        <p class="muted">Revise, desmarque o que não quiser e adicione ao banco.</p>
        ${g.results.map((q,idx) => `
          <div class="q-card">
            <label style="display:flex; gap:8px; align-items:flex-start; font-weight:400; text-transform:none;">
              <input type="checkbox" data-action="toggle-ai-result" data-idx="${idx}" ${g.selected.includes(idx)?'checked':''} style="margin-top:4px;">
              <span>
                <span class="q-tag">${questionTagLabel(q.type)} · ${q.points} pt(s)</span><br>
                <strong>${esc(q.text)}${q.comando?' '+esc(q.comando):''}</strong>
                ${q.type==='mc' ? '<br>' + q.options.map(o => (o.id===q.correctOptionId?'✓ ':'• ') + esc(o.text)).join('<br>') : ''}
                ${q.type==='vf' ? '<br>Resposta correta: ' + (q.correctBool?'Verdadeiro':'Falso') : ''}
                ${q.type==='dissertativa' ? '<br><span class="muted">Resposta modelo: ' + esc(q.modelAnswer) + '</span>' : ''}
              </span>
            </label>
            ${chatIaExtras(q)}
          </div>
        `).join('')}
        <div class="row" style="margin-top:14px;">
          <button class="btn btn-ghost" data-action="close-ai-gen">Cancelar</button>
          <button class="btn btn-primary" data-action="add-ai-selected">Adicionar selecionadas ao banco</button>
        </div>
      </div>
    `;
  }
  const tipoChecks = [
    {id:'mc', label:'Múltipla escolha'},
    {id:'vf', label:'Verdadeiro/Falso'},
    {id:'dissertativa', label:'Dissertativa'},
  ];
  return `
    <div class="card">
      <h2>Gerar questões com IA</h2>
      <label>Tema / assunto</label>
      <input type="text" id="ai-tema-input" value="${esc(g.tema)}" placeholder="Ex: Segurança do trabalho — NR-12, máquinas e equipamentos">
      <div class="row">
        <div>
          <label>Quantidade</label>
          <input type="number" id="ai-qtd-input" min="1" max="10" value="${g.quantidade}">
        </div>
        <div>
          <label>Dificuldade</label>
          <select id="ai-dificuldade-input">
            <option value="fácil" ${g.dificuldade==='fácil'?'selected':''}>Fácil</option>
            <option value="médio" ${g.dificuldade==='médio'?'selected':''}>Médio</option>
            <option value="difícil" ${g.dificuldade==='difícil'?'selected':''}>Difícil</option>
          </select>
        </div>
      </div>
      <label>Tipos de questão</label>
      <div class="row">
        ${tipoChecks.map(t => `
          <label style="display:flex;align-items:center;gap:6px;font-weight:400;text-transform:none;flex:0 0 auto;">
            <input type="checkbox" data-action="toggle-ai-tipo" data-tipo="${t.id}" ${g.tipos.includes(t.id)?'checked':''}> ${t.label}
          </label>
        `).join('')}
      </div>
      <p class="muted" style="margin-top:8px;">As questões serão elaboradas em estilo ENEM, contextualizadas (com texto-base/situação-problema) e alinhadas às avaliações externas (SAEB/ENEM).</p>
      <label style="display:flex;align-items:center;gap:6px;font-weight:400;text-transform:none;">
        <input type="checkbox" data-action="toggle-ai-provas-antigas" ${g.provasAntigas?'checked':''}> Buscar também questões de provas antigas relacionadas ao tema
      </label>
      ${g.error ? `<p class="err">${esc(g.error)}</p>` : ''}
      <div class="row" style="margin-top:16px;">
        <button class="btn btn-ghost" data-action="close-ai-gen">Cancelar</button>
        <button class="btn btn-primary" data-action="generate-ai-questions">Gerar</button>
      </div>
      ${renderChatBridge('gen')}
    </div>
  `;
}
function renderPasteImport(){
  const g = state.professor.pasteImport;
  if(g.loading){
    return `<div class="card"><h2>Importando...</h2><div class="spinner"></div><p class="muted center">${esc(g.progress || 'Organizando as questões do texto colado.')}</p><p class="muted center" style="font-size:.8rem;">Textos longos são lidos em partes — pode levar um minuto.</p></div>`;
  }
  if(g.results){
    return `
      <div class="card">
        <h2>Questões encontradas no texto</h2>
        <p class="muted">Revise, desmarque o que não quiser e adicione ao banco. Confira sempre o gabarito antes de usar.</p>
        ${g.aviso ? `<p class="err">${esc(g.aviso)}</p>` : ''}
        ${g.results.map((q,idx) => `
          <div class="q-card">
            <label style="display:flex; gap:8px; align-items:flex-start; font-weight:400; text-transform:none;">
              <input type="checkbox" data-action="toggle-paste-result" data-idx="${idx}" ${g.selected.includes(idx)?'checked':''} style="margin-top:4px;">
              <span>
                <span class="q-tag">${questionTagLabel(q.type)} · ${q.points} pt(s)</span><br>
                <strong>${esc(q.text)}${q.comando?' '+esc(q.comando):''}</strong>
                ${q.type==='mc' ? '<br>' + q.options.map(o => (o.id===q.correctOptionId?'✓ ':'• ') + esc(o.text)).join('<br>') : ''}
                ${q.type==='vf' ? '<br>Resposta correta: ' + (q.correctBool?'Verdadeiro':'Falso') : ''}
                ${q.type==='dissertativa' ? '<br><span class="muted">Resposta modelo: ' + esc(q.modelAnswer) + '</span>' : ''}
              </span>
            </label>
            ${chatIaExtras(q)}
          </div>
        `).join('')}
        <div class="row" style="margin-top:14px;">
          <button class="btn btn-ghost" data-action="close-paste-import">Cancelar</button>
          <button class="btn btn-primary" data-action="add-paste-selected">Adicionar selecionadas ao banco</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="card">
      <h2>Importar questões (colar texto)</h2>
      <p class="muted">Cole abaixo o texto de uma ou mais questões — de um site, PDF, ou de uma busca que você fez — com enunciado, alternativas e gabarito (se houver). A IA organiza automaticamente no formato do banco.</p>
      <label>Texto colado</label>
      <textarea id="paste-text-input" style="min-height:180px;" placeholder="Cole aqui o texto das questões...">${esc(g.text)}</textarea>
      ${g.error ? `<p class="err">${esc(g.error)}</p>` : ''}
      <div class="row" style="margin-top:16px;">
        <button class="btn btn-ghost" data-action="close-paste-import">Cancelar</button>
        <button class="btn btn-primary" data-action="import-pasted-questions">Importar</button>
      </div>
      ${renderChatBridge('import')}
    </div>
  `;
}
__parteOk('banco');
