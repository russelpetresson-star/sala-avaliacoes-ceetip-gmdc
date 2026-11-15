/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "jogos" */
const JG_DISC = { geografia:'Geografia', historia:'História', sociologia:'Sociologia', filosofia:'Filosofia', biologia:'Biologia', quimica:'Química', fisica:'Física' };
function jgDiscCasa(q, disc){ if(!disc) return true; if(disc.startsWith('area:')) return ENEM_OF_AREA[q.disciplina || q.disc]===disc.slice(5); return (q.disciplina || q.disc)===disc; }
const JG_ESC_VAL = [100,200,300,500,1000,2000,5000,10000,20000,50000], JG_ESC_SEG = [4,7];
const JG_ESC_DEG = [[53.7,23.6],[47.9,22.1],[42.5,20.9],[37.2,19.7],[32.1,18.2],[27,16.9],[22,16.1],[17.2,15.2],[12.4,14.6],[7.4,12]];
const JG_ESC_AJ = { eliminar:[74,8.1,21.4,11.6], turma:[74,22.3,21.4,11.6], dica:[74,37,21.4,11.6] };
const JG_EQUIPES = [{nome:'Tubarões',ico:'🦈',cor:'#1e7fd6'},{nome:'Polvos',ico:'🐙',cor:'#8e44ad'},{nome:'Caranguejos',ico:'🦀',cor:'#d9452b'},{nome:'Tartarugas',ico:'🐢',cor:'#1f9d6b'},{nome:'Baleias',ico:'🐋',cor:'#0a8fa8'},{nome:'Corsários',ico:'⚓',cor:'#7a1f2b'}];
const JG_FROTA = [{nome:'Galeão',t:4},{nome:'Fragata',t:3},{nome:'Caravela',t:3},{nome:'Escuna',t:2},{nome:'Bote',t:2}];
function jgEmb(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function jgEhAluno(){ return state.view==='aluno'; }
function jgState(){
  if(state.view==='aluno'){ const al = state.aluno; if(!al.jgView) al.jgView = { presenca:{}, resp:{}, modal:null, aluno:true }; al.jgView.current = al.jogoAtivo; return al.jgView; }
  const p = state.professor; if(!p.jogos) p.jogos = { tela:'menu', tipo:null, cfg:null, current:null, apresentar:false, presenca:{}, resp:{}, modal:null, sig:'', msg:'', pool:null }; return p.jogos; }
function stopJogoPoll(){ if(jogoPollInterval){ clearInterval(jogoPollInterval); jogoPollInterval = null; } }
function jgRk(j){ return j.rk || ''; }
function jgPrefResp(j, rk){ return `jogo-resp:${j.turmaId}:${j.id}:${rk}:`; }
function jgPrefIn(j){ return `jogo-in:${j.turmaId}:${j.id}:`; }
function jgSalvar(j){ return aoVivoSalvar('jogo-ativo', j, j && j.turmaId); }
function jgAv(a, extra){ return `<span class="jg-av ${extra||''}" style="background:${esc(a.cor||'#3a2f7a')}" title="${esc(a.nome||'')}">${esc(a.emoji||(a.nome||'?').slice(0,2))}</span>`; }
async function jgPool(cfg){
  const p = state.professor; let lista = [];
  const deEnem = q => ({ k:q.id, enemId:q.id, ano:q.ano, numero:q.numero, disc:q.disciplina, tema:q.tema||'', assunto:q.assunto||'', hab:q.habilidade||'', texto:q.texto||'', comando:q.comando||'', ops:q.opcoes.slice(), c:q.correta, exp:q.explicacao||'', imagem:q.imagem||null });
  if(cfg.fonte==='aula'){
    // perguntas do exercício da aula + questões do ENEM dos mesmos temas (completa o jogo)
    lista = (cfg.lista||[]).slice(); let reg = []; try{ reg = await enemOfCarregar(); }catch(e){}
    const ts = new Set(cfg.temasAula||[]); const ja = new Set(lista.map(q => q.enemId).filter(Boolean));
    reg.filter(q => ts.has(q.tema) && jgDiscCasa(q, cfg.disc) && !ja.has(q.id)).forEach(q => lista.push(deEnem(q)));
    return lista;
  }
  if(cfg.fonte==='banco'){
    lista = (p.bank||[]).filter(q => q.type==='mc' && !q.annulled && (q.options||[]).filter(o => (o.text||'').trim()).length>=2 && q.correctOptionId).map(q => {
      const ops = q.options.filter(o => (o.text||'').trim()); const c = ops.findIndex(o => o.id===q.correctOptionId);
      return { k:q.id, bankId:q.id, enemId:q.enemId||null, disc:'', tema:q.conteudo||'', assunto:q.assunto||'', hab:q.descritorSaeb||'', texto:'', comando:q.text||'', ops:ops.map(o => o.text), c, exp:q.explicacao||'', temImg:!!q.image };
    }).filter(q => q.c>=0);
  } else {
    let reg = []; try{ reg = await enemOfCarregar(); }catch(e){}
    lista = reg.filter(q => jgDiscCasa(q, cfg.disc) && (cfg.comImagem!==false || !q.imagem)).map(deEnem);
  }
  return lista;
}
function jgRodizio(lista, chave, n){ const por = {}; jgEmb(lista).forEach(q => (por[chave(q)] = por[chave(q)] || []).push(q));
  const filas = jgEmb(Object.values(por)), out = []; let k = 0;
  while(out.length < n && filas.some(f => f.length)){ const f = filas[k++ % filas.length]; if(f.length) out.push(f.shift()); } return out; }
function jgSortear(pool, cfg, n){
  const minOps = JG_INFO[cfg.tipo].min; const base = pool.filter(q => q.ops.length>=minOps);
  const temas = cfg.temas||[]; const doTema = temas.length ? base.filter(q => temas.includes(q.tema)) : base;
  const chave = q => temas.length ? q.tema : (cfg.fonte==='enem' && (!cfg.disc || cfg.disc.startsWith('area:')) ? q.disc : (q.tema||'-'));
  let out = jgRodizio(doTema, chave, n);
  if(out.length < n){ const usados = new Set(out.map(q => q.k)); out = out.concat(jgRodizio(base.filter(q => !usados.has(q.k)), q => q.tema||'-', n - out.length)); }
  // a arte da Escada tem A–D: tira uma alternativa errada por sorteio (a questão continua com uma única resposta certa)
  return out.map(q => { const map = q.ops.map((_, i) => i); let ops = q.ops.slice(), c = q.c, m = map.slice();
    if(cfg.tipo==='escada' && ops.length>4){ while(ops.length>4){ const errs = ops.map((_, i) => i).filter(i => i!==c); const w = errs[Math.floor(Math.random()*errs.length)]; ops.splice(w, 1); m.splice(w, 1); if(w < c) c--; } }
    return Object.assign({}, q, { ops, c, map:m }); });
}
function jgCfgPadrao(tipo){
  const g = jgState(); const ant = g.cfg || {};
  const turmas = professorTurmas();
  return { tipo, turmaId: ant.turmaId || (turmas[0] && turmas[0].id) || '', fonte: ant.fonte && ant.fonte!=='aula' ? ant.fonte : 'enem', disc: ant.disc!==undefined ? ant.disc : jgDiscPadrao(), temas: [], comImagem: true,
    T: tipo==='naval' ? 60 : tipo==='escada' ? 60 : 45, nPerg: 12, salva: true, repesca: true, equipes: 4, deNovo: false, modo: 'turma', mmodo: 'equipes' };
}
function jgDiscPadrao(){ const ds = state.professor.disciplinas||[]; const minhas = ds.map(d => enemOfNorm(d.name)); const k = Object.keys(JG_DISC).find(x => minhas.includes(enemOfNorm(JG_DISC[x])));
  if(ds.length===1 && k) return k;
  const areas = [...new Set(ds.map(d => enemAreaDaDisc(d.name)).filter(Boolean))]; return areas.length===1 ? 'area:' + areas[0] : ''; }
async function jgEscolher(tipo){ const g = jgState(); g.sugestao = ''; g.tipo = tipo; g.cfg = jgCfgPadrao(tipo); g.tela = 'config'; g.pool = null; g.msg = ''; render(); g.pool = await jgPool(g.cfg); render(); }
async function jgAtualizarPool(){ const g = jgState(); g.pool = null; render(); g.pool = await jgPool(g.cfg); g.cfg.temas = (g.cfg.temas||[]).filter(t => g.pool.some(q => q.tema===t)); render(); }
async function jgAbrirSala(){
  const g = jgState(), cfg = g.cfg, p = state.professor;
  const turma = (p.turmas||[]).find(t => t.id===cfg.turmaId);
  if(!turma){ alert('Escolha a turma.'); return; }
  const pool = g.pool || await jgPool(cfg);
  const n = cfg.tipo==='escada' ? 10 : cfg.tipo==='qes' ? JG_QES_MAX + 1 : cfg.tipo==='missao' ? 20 : Math.max(4, parseInt(cfg.nPerg)||12);
  const perguntas = jgSortear(pool, cfg, n);
  const minimo = cfg.tipo==='escada' ? 10 : 4;
  if(perguntas.length < minimo){ alert(`Há poucas questões com esses filtros (${perguntas.length}). ${cfg.tipo==='escada' ? 'A Escada precisa de 10 questões com pelo menos 4 alternativas.' : 'Escolha outra disciplina, outros temas ou o banco do ENEM.'}`); return; }
  const j = { id: cryptoId(), tipo: cfg.tipo, turmaId: turma.id, turmaName: turma.name, professorId: p.session && p.session.id, authorName: (p.session && p.session.displayName) || 'Professor',
    createdAt: Date.now(), fase: 'sala', cfg: { T: parseInt(cfg.T)||45, salva: !!cfg.salva, repesca: !!cfg.repesca, equipes: parseInt(cfg.equipes)||4, deNovo: !!cfg.deNovo, modo: cfg.modo||'turma', mmodo: cfg.mmodo||'equipes',
      fonte: cfg.fonte, disc: cfg.disc||'', temas: (cfg.temas||[]).slice() }, perguntas, r: 0, rk: '', inicio: null, T: parseInt(cfg.T)||45, hist: [] };
  await jgSalvar(j); g.current = j; g.tela = 'ao-vivo'; g.presenca = {}; g.resp = {}; g.sig = ''; g.modal = null; render();
}
async function jgCarregarAtivo(){
  const g = jgState(); if(g.current) return;
  let j = null; try{ j = await profAtivoBuscar('jogo-ativo', []); }catch(e){}
  const p = state.professor;
  if(j && j.fase!=='encerrado' && (!j.professorId || !p.session || j.professorId===p.session.id)){ g.current = j; g.tipo = j.tipo; g.tela = 'ao-vivo'; render(); }
}
function startJogoPoll(){ stopJogoPoll(); jgCarregarAtivo().then(() => jgRefresh()); jogoPollInterval = setInterval(jgRefresh, 1000); }
async function jgRefresh(){
  const g = jgState(); const j = g.current; if(!j) return;
  let pres = {}, resp = {};
  try{ const r = await liveListar(jgPrefIn(j)); Object.entries(r).forEach(([sid, v]) => { try{ pres[sid] = JSON.parse(v); }catch(e){} }); }catch(e){}
  const rk = jgRk(j);
  if(rk){ try{ const r = await liveListar(jgPrefResp(j, rk)); Object.entries(r).forEach(([sid, v]) => { try{ resp[sid] = JSON.parse(v); }catch(e){} }); }catch(e){} }
  if(g.current!==j) return;
  g.presenca = pres; g.resp = resp;
  const sig = JSON.stringify([Object.keys(pres).sort(), resp, j.fase, j.r]);
  let mudou = sig!==g.sig; g.sig = sig;
  if(await jgAuto(j)) mudou = true;
  if(mudou) avRenderSeguro(); else jgTick();
}
function jgTick(){
  const j = jgState().current; if(!j) return;
  if(!(j.fase==='pergunta' || j.votacao) || !j.inicio) return;
  if(j.tipo==='missao') return jgMisTick(j);
  document.querySelectorAll('[data-jg-timer]').forEach(el => { const r = jgRestante(j); el.innerHTML = jgRelogioSvg(r, j.T, el.dataset.jgTimer); });
  document.querySelectorAll('[data-jg-timer-txt]').forEach(el => { el.textContent = Math.ceil(jgRestante(j)) + 's'; });
}
async function jgAuto(j){
  const g = jgState(); let mudou = false;
  if(j.fase==='sala') return false;
  if(j.tipo==='missao'){ if(await jgMisAuto(j)) return true; }
  if(j.tipo==='qes'){
    Object.entries(g.presenca).forEach(([sid, a]) => { if(!j.jogadores.some(x => x.id===sid)){ j.jogadores.push({ id:sid, nome:a.nome, emoji:a.emoji, cor:a.cor, dentro:false, acertos:0, saiuNa:0, tarde:true }); mudou = true; } });
  }
  if(j.tipo==='naval'){
    Object.entries(g.presenca).forEach(([sid, a]) => { if(!j.equipes.some(e => e.membros.some(m => m.id===sid))){ const e = j.equipes.slice().sort((x, y) => x.membros.length - y.membros.length)[0]; e.membros.push({ id:sid, nome:a.nome, emoji:a.emoji, cor:a.cor }); mudou = true; } });
  }
  if(mudou) await jgSalvar(j);
  const votando = j.fase==='pergunta' || (j.tipo==='escada' && j.votacao);
  if(votando && j.inicio){
    const semSinal = new Set(jgSemSinal()); const quem = jgQuemResponde(j).filter(id => !semSinal.has(id)); const todos = quem.length && quem.every(id => g.resp[id]);
    if(jgRestante(j)<=0 || todos){ if(j.tipo==='escada' && j.votacao) await jgEscFecharVotacao(); else await jgRevelar(); return true; }
    const r = Math.ceil(jgRestante(j)); if(r<=5 && r>0 && r!==g.ultTick && g.apresentar && !(typeof JGM!=='undefined' && jgSomLigado() && JGM.pronto())){ g.ultTick = r; try{ quizPlayTick(); }catch(e){} }
  }
  if(j.tipo==='naval' && j.fase==='tiros'){
    if(j.aguarda && j.capitao){ const t = g.resp[j.capitao]; if(t && t.r!=null && t.c!=null && !j.tiros[t.r][t.c]){ await jgNavAtirar(t.r, t.c); return true; } }
    if(!j.aguarda && j.efeitoAt && Date.now() - j.efeitoAt > 2300){ await jgNavProximoTiro(); return true; }
  }
  return false;
}
const JG_SEM_SINAL_MS = 40000;
function jgSemSinal(){ const g = jgState(); const agora = Date.now(); return Object.entries(g.presenca||{}).filter(([id, a]) => a && a.at && agora - a.at > JG_SEM_SINAL_MS).map(([id]) => id); }
function jgQuemResponde(j){
  const g = jgState(); const pres = Object.keys(g.presenca);
  if(j.fase==='sala') return pres;
  if(j.tipo==='qes') return j.jogadores.filter(x => pres.includes(x.id)).map(x => x.id);
  if(j.tipo==='naval') return j.equipes.flatMap(e => e.membros.map(m => m.id)).filter(id => pres.includes(id));
  if(j.tipo==='missao') return pres;
  return pres;
}
async function jgComecar(){
  const g = jgState(), j = g.current; if(!j || j.fase!=='sala') return;
  if(j.tipo==='missao') return jgMisComecar(j);
  const pres = Object.entries(g.presenca).map(([id, a]) => ({ id, nome:a.nome, emoji:a.emoji, cor:a.cor }));
  if(j.tipo==='qes'){
    if(pres.length < 2){ alert('Espere pelo menos 2 alunos entrarem pelo tablet.'); return; }
    j.jogadores = pres.map(a => Object.assign(a, { dentro:true, acertos:0, saiuNa:0 }));
  }
  if(j.tipo==='naval'){
    if(pres.length < 2){ alert('Espere pelo menos 2 alunos entrarem pelo tablet.'); return; }
    const n = Math.max(2, Math.min(6, j.cfg.equipes, pres.length));
    j.equipes = JG_EQUIPES.slice(0, n).map((e, i) => Object.assign({ id:'e'+i, membros:[], pts:0, acertos:0 }, e));
    jgEmb(pres).forEach((a, i) => j.equipes[i % n].membros.push(a));
    j.frota = jgNavFrota(); j.tiros = Array.from({length:JG_N}, () => Array(JG_N).fill(null)); j.fila = []; j.vez = null; j.aguarda = false;
  }
  if(j.tipo==='escada'){ j.nivel = 0; j.garantido = 0; j.ajudas = { eliminar:true, turma:true, dica:true }; j.fora = []; j.sel = null; j.placar = {}; }
  await jgNovaPergunta(j);
}
async function jgNovaPergunta(j){
  const g = jgState();
  j.fase = 'pergunta'; j.inicio = j.tipo==='escada' && j.cfg.modo==='palco' ? null : Date.now(); j.T = j.cfg.T;
  j.rk = String(j.tipo==='escada' ? j.nivel : j.r); j.ult = null; j.votacao = false;
  if(j.tipo==='qes') j.repescaAgora = j.cfg.repesca && j.r + 1 === 5 && j.jogadores.some(x => !x.dentro && x.saiuNa);
  if(j.tipo==='escada'){ j.fora = []; j.sel = null; j.dica = false; }
  g.resp = {}; g.modal = null; g.ultTick = null;
  await jgSalvar(j); render();
}
function jgPergunta(j){ return j.perguntas[j.tipo==='escada' ? j.nivel : j.r]; }
function jgHistorico(j, q, votos){
  const esc = {}; let n = 0, ok = 0;
  Object.values(votos).forEach(i => { if(i==null || i<0) return; const orig = q.map ? q.map[i] : i; esc[orig] = (esc[orig]||0) + 1; n++; if(i===q.c) ok++; });
  if(!n) return;
  j.hist = j.hist || []; j.hist.push({ k:q.k, enemId:q.enemId||null, n, ok, esc, tema:q.tema||'', ref: jgFonteQ(q) });
}
async function jgRevelar(){
  const g = jgState(), j = g.current; if(!j || j.fase!=='pergunta') return;
  const q = jgPergunta(j); const votos = {}; Object.entries(g.resp).forEach(([sid, r]) => { if(r && r.i!=null) votos[sid] = r.i; });
  if(j.tipo==='qes') jgQesRevelar(j, q, votos);
  else if(j.tipo==='naval') jgNavRevelar(j, q, votos);
  else if(j.tipo==='missao') jgMisRevelar(j, q, votos);
  else jgEscRevelarTurma(j, q, votos);
  jgHistorico(j, q, votos);
  j.fase = 'revelado'; await jgSalvar(j); render();
  try{ triggerQuizConfetti && (j.ult && j.ult.festa) && triggerQuizConfetti(); }catch(e){}
}
async function jgProxima(){
  const j = jgState().current; if(!j) return;
  if(j.tipo==='qes') return jgQesProxima(j);
  if(j.tipo==='missao') return jgMisProxima(j);
  if(j.tipo==='naval'){ if(j.fase==='revelado' && j.fila.length) return jgNavIrTiros(j); return jgNavProximaQuestao(j); }
  return jgEscProxima(j);
}
async function jgFim(j, motivo){
  j.fase = 'fim'; j.motivo = motivo; j.fimAt = Date.now(); j.rk = '';
  await jgSalvar(j); render();
  try{ triggerQuizConfetti(); }catch(e){}
  const p = state.professor;
  if(p.session && (j.hist||[]).length){ try{ await window.storage.set(`jogo-res:${p.session.id}:${j.id}`, JSON.stringify({ id:j.id, tipo:j.tipo, turmaId:j.turmaId, turmaName:j.turmaName, professorId:p.session.id, at:Date.now(), itens:j.hist }), true); }catch(e){} }
  try{ await jgFichas(j); }catch(e){}
}
async function jgFichas(j){
  const itens = []; const nome = JG_INFO[j.tipo].nome;
  if(j.tipo==='qes'){ j.jogadores.forEach(x => itens.push({ studentId:x.id, amount: j.venc && x.id===j.venc.id ? 8 : 1, motivo: j.venc && x.id===j.venc.id ? `Venceu o ${nome}` : `Jogou ${nome}`, categoria:'jogo' })); }
  if(j.tipo==='naval'){ const v = j.rank && j.rank[0]; j.equipes.forEach(e => e.membros.forEach(m => itens.push({ studentId:m.id, amount: v && e.id===v.id ? 4 : 1, motivo: v && e.id===v.id ? `Equipe vencedora na ${nome}` : `Jogou ${nome}`, categoria:'jogo' }))); }
  if(j.tipo==='missao') jgMisFichas(j).forEach(x => itens.push(x));
  if(j.tipo==='escada'){ Object.keys(jgState().presenca).forEach(sid => itens.push({ studentId:sid, amount: 1 + Math.min(3, (j.placar||{})[sid]||0), motivo:`Jogou ${nome}`, categoria:'jogo' })); }
  if(itens.length) await awardFichasLote(j.turmaId, itens);
}
async function jgEncerrar(){
  const g = jgState(), j = g.current; if(!j) return;
  if(j.fase!=='fim' && !confirm('Encerrar o jogo agora? O placar some do telão e dos tablets.')) return;
  await aoVivoSalvar('jogo-ativo', null, j.turmaId);
  g.current = null; g.tela = 'menu'; g.apresentar = false; g.modal = null; render();
}
function jgQesRevelar(j, q, votos){
  const g = jgState(); const disputa = j.jogadores.filter(x => x.dentro);
  const errou = disputa.filter(x => votos[x.id]!==q.c);
  const salva = j.cfg.salva && disputa.length>0 && errou.length===disputa.length;
  const sairam = [], voltaram = [];
  if(!salva) errou.forEach(x => { x.dentro = false; x.saiuNa = j.r + 1; sairam.push(x.id); });
  if(j.repescaAgora) j.jogadores.forEach(x => { if(!x.dentro && x.saiuNa && x.saiuNa < j.r + 1 && votos[x.id]===q.c){ x.dentro = true; x.saiuNa = 0; voltaram.push(x.id); } });
  j.jogadores.forEach(x => { if(votos[x.id]===q.c) x.acertos++; });
  const cont = q.ops.map(() => 0); Object.values(votos).forEach(i => { if(cont[i]!==undefined) cont[i]++; });
  const tempos = {}; Object.entries(g.resp).forEach(([sid, r]) => { if(r && r.at) tempos[sid] = r.at; });
  j.ult = { cont, sairam, voltaram, salva, votos, tempos, festa: false };
}
async function jgQesProxima(j){
  const vivos = j.jogadores.filter(x => x.dentro);
  if(vivos.length <= 1) return jgQesFim(j, vivos[0] || null, 'Último de pé');
  if(j.r + 1 >= Math.min(JG_QES_MAX, j.perguntas.length)){
    const q = jgPergunta(j); const ok = vivos.filter(x => j.ult && j.ult.votos[x.id]===q.c).sort((a, b) => (j.ult.tempos[a.id]||9e15) - (j.ult.tempos[b.id]||9e15));
    return jgQesFim(j, ok[0] || vivos.slice().sort((a, b) => b.acertos - a.acertos)[0], 'Desempate: acertou mais rápido');
  }
  j.r++; await jgNovaPergunta(j);
}
async function jgQesFim(j, venc, motivo){
  j.venc = venc ? { id:venc.id, nome:venc.nome, emoji:venc.emoji, cor:venc.cor } : null;
  j.podio = j.jogadores.filter(x => !venc || x.id!==venc.id).sort((a, b) => (b.saiuNa||99) - (a.saiuNa||99) || b.acertos - a.acertos).slice(0, 2).map(x => ({ id:x.id, nome:x.nome }));
  await jgFim(j, motivo);
}
function jgNavFrota(){
  for(let t = 0; t < 500; t++){
    const viz = new Set(), navios = []; let ok = true;
    for(const f of JG_FROTA){ let pos = null;
      for(let k = 0; k < 200 && !pos; k++){ const h = Math.random() < .5, r = Math.floor(Math.random() * (h ? JG_N : JG_N - f.t + 1)), c = Math.floor(Math.random() * (h ? JG_N - f.t + 1 : JG_N));
        const cel = Array.from({length:f.t}, (_, i) => h ? [r, c+i] : [r+i, c]); if(cel.every(([a, b]) => !viz.has(a*JG_N+b))) pos = cel; }
      if(!pos){ ok = false; break; }
      pos.forEach(([a, b]) => { for(let da=-1; da<=1; da++) for(let db=-1; db<=1; db++) viz.add((a+da)*JG_N+(b+db)); });
      navios.push({ nome:f.nome, t:f.t, cel:pos, hits:0, afundou:false }); }
    if(ok) return navios; }
  return [];
}
function jgNavRevelar(j, q, votos){
  const g = jgState(); const res = {};
  j.equipes.forEach(e => {
    const vs = e.membros.filter(m => votos[m.id]!=null).sort((a, b) => (g.resp[a.id].at||0) - (g.resp[b.id].at||0));
    const cont = q.ops.map(() => 0); vs.forEach(m => cont[votos[m.id]]++); const mx = Math.max(0, ...cont);
    const resp = mx ? votos[vs.find(m => cont[votos[m.id]]===mx).id] : null;
    const ts = vs.map(m => g.resp[m.id].at||0); const t = ts.length ? ts[Math.floor(ts.length/2)] : 9e15;
    const ok = resp===q.c; if(ok) e.acertos++;
    res[e.id] = { resp, cont, n: vs.length, ok, t };
  });
  j.fila = j.equipes.filter(e => res[e.id].ok).sort((a, b) => res[a.id].t - res[b.id].t).map(e => e.id);
  j.extra = []; j.ult = { equipes: res, votos };
}
async function jgNavIrTiros(j){ j.fase = 'tiros'; j.tiroSeq = 0; await jgNavProximoTiro(); }
async function jgNavProximoTiro(){
  const g = jgState(), j = g.current; if(!j) return;
  if(j.frota.every(n => n.afundou)) return jgNavFim(j, 'A frota pirata afundou!');
  j.efeito = null; j.efeitoAt = null;
  if(j.fila.length){
    j.vez = j.fila.shift(); const e = j.equipes.find(x => x.id===j.vez);
    const pres = e.membros.filter(m => g.presenca[m.id]); const lista = pres.length ? pres : e.membros;
    const cap = lista[(j.r + (j.tiroSeq||0)) % lista.length]; j.capitao = cap ? cap.id : null;
    j.aguarda = true; j.tiroSeq = (j.tiroSeq||0) + 1; j.rk = `t${j.r}_${j.tiroSeq}`;
  } else { j.vez = null; j.capitao = null; j.aguarda = false; j.rk = ''; }
  g.resp = {}; await jgSalvar(j); render();
}
async function jgNavAtirar(r, c){
  const g = jgState(), j = g.current; if(!j || j.fase!=='tiros' || !j.aguarda || j.tiros[r][c]) return;
  const e = j.equipes.find(x => x.id===j.vez); const n = j.frota.find(x => x.cel.some(([a, b]) => a===r && b===c));
  j.aguarda = false;
  if(n){ j.tiros[r][c] = 'fogo'; n.hits++; e.pts++;
    if(n.hits===n.t){ n.afundou = true; e.pts += 2; n.cel.forEach(([a, b]) => j.tiros[a][b] = 'afundado'); j.efeito = `☠️ Afundou ${/a$/.test(n.nome) ? 'a' : 'o'} ${n.nome}! +3`; }
    else j.efeito = '💥 FOGO! +1';
    if(j.cfg.deNovo && !(j.extra||[]).includes(e.id)){ j.extra = (j.extra||[]).concat(e.id); j.fila.unshift(e.id); } }
  else { j.tiros[r][c] = 'agua'; j.efeito = '💦 ÁGUA!'; }
  j.ultimo = [r, c, e.id]; j.efeitoAt = Date.now();
  await jgSalvar(j); render();
}
async function jgNavProximaQuestao(j){
  if(j.frota.every(n => n.afundou)) return jgNavFim(j, 'A frota pirata afundou!');
  if(j.r + 1 >= j.perguntas.length) return jgNavFim(j, 'As questões acabaram');
  j.r++; j.vez = null; j.efeito = null; await jgNovaPergunta(j);
}
async function jgNavFim(j, motivo){
  j.rank = j.equipes.slice().sort((a, b) => b.pts - a.pts || b.acertos - a.acertos).map(e => ({ id:e.id, nome:e.nome, ico:e.ico, cor:e.cor, pts:e.pts, acertos:e.acertos }));
  await jgFim(j, motivo);
}
function jgEscRevelarTurma(j, q, votos){
  const ids = Object.keys(votos); const ok = ids.filter(id => votos[id]===q.c);
  ok.forEach(id => { j.placar[id] = (j.placar[id]||0) + 1; });
  const cont = q.ops.map(() => 0); ids.forEach(id => cont[votos[id]]++);
  const pct = ids.length ? ok.length / ids.length : 0;
  j.acertou = ids.length>0 && pct > 0.5; j.sel = cont.indexOf(Math.max(...cont)); j.ult = { cont, n: ids.length, ok: ok.length, pct, festa: j.acertou };
}
async function jgEscEscolher(i){ const j = jgState().current; if(!j || j.tipo!=='escada' || j.cfg.modo!=='palco' || j.fase!=='pergunta' || (j.fora||[]).includes(i)) return;
  if(j.sel===i) return jgEscConfirmar(); j.sel = i; await jgSalvar(j); render(); }
async function jgEscConfirmar(){
  const j = jgState().current; if(!j || j.fase!=='pergunta' || j.sel==null) return;
  const q = jgPergunta(j); j.acertou = j.sel===q.c; j.ult = { festa: j.acertou };
  j.fase = 'revelado'; await jgSalvar(j); render();
  if(j.acertou){ try{ triggerQuizConfetti(); }catch(e){} }
}
async function jgEscProxima(j){
  if(j.acertou){
    if(JG_ESC_SEG.includes(j.nivel)) j.garantido = JG_ESC_VAL[j.nivel];
    j.nivel++;
    if(j.nivel===10){ j.final = 50000; return jgFim(j, 'Topo da Escada do Saber!'); }
    return jgNovaPergunta(j);
  }
  j.final = j.garantido; return jgFim(j, 'Fim de jogo');
}
async function jgEscParar(){ const j = jgState().current; if(!j || j.fase!=='pergunta' || !j.nivel) return;
  if(!confirm(`Parar e levar ${jgFmt(JG_ESC_VAL[j.nivel-1])} pontos?`)) return; j.final = JG_ESC_VAL[j.nivel-1]; await jgFim(j, 'Parou com segurança'); }
async function jgEscAjuda(k){
  const g = jgState(), j = g.current; if(!j || j.fase!=='pergunta' || !j.ajudas[k]) return;
  const q = jgPergunta(j); j.ajudas[k] = false;
  if(k==='eliminar'){ j.fora = jgEmb(q.ops.map((_, i) => i).filter(i => i!==q.c)).slice(0, 2); if(j.fora.includes(j.sel)) j.sel = null; }
  if(k==='dica'){ j.dica = true; g.modal = 'dica'; }
  if(k==='turma'){
    if(j.cfg.modo==='palco'){ j.votacao = true; j.inicio = Date.now(); j.T = 30; j.rk = `v${j.nivel}`; g.resp = {}; g.modal = 'votos'; }
    else g.modal = 'votos';   // modo turma inteira: mostra a parcial dos votos
  }
  await jgSalvar(j); render();
}
async function jgEscFecharVotacao(){
  const g = jgState(), j = g.current; if(!j) return;
  const q = jgPergunta(j); const votos = {}; Object.entries(g.resp).forEach(([sid, r]) => { if(r && r.i!=null) votos[sid] = r.i; });
  const cont = q.ops.map(() => 0); Object.values(votos).forEach(i => { if(cont[i]!==undefined) cont[i]++; });
  j.votos = cont; j.votacao = false; j.inicio = null; jgHistorico(j, q, votos); g.modal = 'votos';
  await jgSalvar(j); render();
}
function jgRelogioSvg(resta, T, cor){
  const f = T ? resta / T : 0, C = 2*Math.PI*44; const c2 = resta <= 5 ? '#e5484d' : resta <= 10 ? '#ffc93c' : (cor || '#2ee6ff');
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="rgba(10,8,40,.88)" stroke="rgba(255,255,255,.2)" stroke-width="8"/><circle cx="50" cy="50" r="44" fill="none" stroke="${c2}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-f)}" transform="rotate(-90 50 50)"/></svg><b>${Math.ceil(resta)}</b>`;
}
function jgAlunosNaSala(j){ const g = jgState(); return Object.entries(g.presenca).map(([id, a]) => ({ id, nome:a.nome, emoji:a.emoji, cor:a.cor })); }
function jgSalaHtml(j, cls){
  const al = jgAlunosNaSala(j); const turma = (state.professor.turmas||[]).find(t => t.id===j.turmaId); const total = turma ? (turma.students||[]).length : 0;
  return `<div class="jg-abs jg-sala ${cls||''}"><div class="jg-sala-t">${JG_INFO[j.tipo].icon} ${esc(JG_INFO[j.tipo].nome)} · ${esc(j.turmaName)}</div>
    <div class="jg-sala-s">No tablet: entre na Sala de Avaliações e toque em <b>Entrar no jogo</b></div>
    <div class="jg-sala-n">${al.length}${total ? ` de ${total}` : ''} aluno(s) na sala</div>
    <div class="jg-avs">${al.map(a => jgAv(a)).join('')}</div></div>`;
}
function jgFaltamHtml(j){
  if(j.fase!=='sala') return ''; const g = jgState(); const turma = (state.professor.turmas||[]).find(t => t.id===j.turmaId); if(!turma) return '';
  const alunos = turma.students || []; const falta = alunos.filter(st => !g.presenca[st.id]); const n = alunos.length - falta.length;
  if(!alunos.length) return '';
  return `<div class="jg-faltam" data-jg-faltam><b>${n} de ${alunos.length} entraram.</b>${falta.length ? ` Faltam (${falta.length}): ${falta.slice(0, 40).map(st => esc((st.name||'').split(' ')[0] + ' ' + ((st.name||'').split(' ').slice(-1)[0] || '').slice(0, 1) + '.')).join(', ')}${falta.length > 40 ? '…' : ''}` : ' Todos na sala!'}</div>`;
}
function jgMinha(j){ const al = state.aluno, m = al.jogoMinha; return m && j && m.jogoId===j.id && m.rk===j.rk ? m : null; }
function jgAlunoPodeResponder(j){
  if(!jgEhAluno() || !j || !j.rk) return false;
  const votando = j.fase==='pergunta' || (j.tipo==='escada' && j.votacao);
  if(!votando || (j.tipo==='escada' && j.cfg.modo==='palco' && !j.votacao)) return false;
  return !jgMinha(j);
}
function jgOpAttr(j, i){
  if(!jgEhAluno()) return '';
  const m = jgMinha(j); const sel = m && m.i===i ? ' data-sel="1"' : '';
  return jgAlunoPodeResponder(j) ? ` data-jg="al-resp" data-i="${i}" role="button" tabindex="0"${sel}` : sel;
}
function jgOpsHtml(j, q, rev, cont){
  const total = cont ? cont.reduce((a, b) => a + b, 0) : 0;
  return q.ops.map((o, i) => { const pc = total ? Math.round(cont[i] / total * 100) : 0;
    return `<div class="jg-op ${rev && i===q.c ? 'certa' : ''} ${rev && i!==q.c ? 'apagada' : ''} ${(j.fora||[]).includes(i) ? 'fora' : ''}"${jgOpAttr(j, i)}>${cont ? `<i class="jg-bar" style="width:${rev ? pc : 0}%"></i>` : ''}<span class="jg-l">${JG_L[i]}</span><span class="jg-t" data-jg-fit="1.15">${esc(o)}</span>${rev && cont ? `<span class="jg-pc">${pc}% (${cont[i]})</span>` : ''}</div>`; }).join('');
}
function jgModalHtml(j){
  const g = jgState(); if(!g.modal) return ''; const q = jgPergunta(j); if(!q) return '';
  let corpo = '';
  if(g.modal==='texto') corpo = `<h2>${esc(jgFonteQ(q))}</h2>${(q.texto||'').split('\n\n').filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('')}${jgImgHtml(q, 'jg-img')}<p><b>${esc(q.comando)}</b></p>`;
  else if(g.modal==='dica') corpo = `<h2>Dica do mestre</h2><p><b>Tema:</b> ${esc(q.tema||'—')}</p>${q.assunto ? `<p><b>Conteúdo:</b> ${esc(q.assunto)}</p>` : ''}${q.hab ? `<p><b>Habilidade:</b> ${esc(q.hab)}</p>` : ''}<p class="jg-mut">Pense no que a turma estudou sobre esse conteúdo e releia o comando com calma.</p>`;
  else if(g.modal==='votos'){
    let cont, n, aberto = false;
    if(j.votacao){ aberto = true; cont = q.ops.map(() => 0); Object.values(g.resp).forEach(r => { if(r && cont[r.i]!==undefined) cont[r.i]++; }); }
    else if(j.cfg.modo!=='palco'){ cont = q.ops.map(() => 0); Object.values(g.resp).forEach(r => { if(r && cont[r.i]!==undefined) cont[r.i]++; }); aberto = true; }
    else cont = j.votos || q.ops.map(() => 0);
    n = cont.reduce((a, b) => a + b, 0); const mx = Math.max(1, ...cont);
    corpo = `<h2>Perguntar à turma</h2><div class="jg-barras">${cont.map((v, i) => `<div class="jg-barra ${(j.fora||[]).includes(i) ? 'fora' : ''}"><span>${n ? Math.round(v/n*100) : 0}%</span><i style="height:${v/mx*80}%"></i><span>${JG_L[i]}</span></div>`).join('')}</div>
      <p class="jg-mut">${aberto ? `Votação aberta nos tablets · ${n} voto(s)${j.votacao ? ` · <span data-jg-timer="#ffd86b" class="jg-mini-timer">${jgRelogioSvg(jgRestante(j), j.T, '#ffd86b')}</span>` : ''}` : `${n} voto(s) da turma.`}</p>`;
  }
  return `<div class="jg-modal" data-jg="fechar-modal"><div class="jg-caixa">${corpo}<div class="jg-acoes"><button class="jg-bt" data-jg="fechar-modal">Voltar ao jogo</button></div></div></div>`;
}
function jgTelaoHtml(j){
  const g = jgState(); const q = jgPergunta(j);
  if(j.tipo==='missao') return `<div class="jg-telao jg-missao" style="background-image:${jgMisFundo(j)}">${jgTelaoMissao(j)}${['pergunta','revelado'].includes(j.fase) ? jgModalHtml(j) : ''}</div>`;
  const abre = j.fase==='sala' || (j.fase==='fim' && j.tipo==='escada');
  let h = '';
  if(j.fase==='sala') h = g.aluno ? `<div class="jg-abs jg-sala ${j.tipo==='qes' ? 'jg-sala-qes' : j.tipo==='naval' ? 'jg-sala-naval' : 'jg-sala-escada'}"><div class="jg-sala-t">Você entrou! 🎉</div><div class="jg-sala-s">O jogo já vai começar. Fique de olho nesta tela.</div></div>` : jgSalaHtml(j, j.tipo==='qes' ? 'jg-sala-qes' : j.tipo==='naval' ? 'jg-sala-naval' : 'jg-sala-escada');
  else if(j.tipo==='qes') h = jgTelaoQes(j, q);
  else if(j.tipo==='naval') h = jgTelaoNaval(j, q);
  else h = jgTelaoEscada(j, q);
  return `<div class="jg-telao jg-${j.tipo}" style="background-image:${jgArtVar(j.tipo, abre ? 'abre' : 'jogo')}">${h}${j.fase!=='sala' && j.fase!=='fim' ? jgModalHtml(j) : ''}</div>`;
}
function jgTelaoQes(j, q){
  const g = jgState(); const rev = j.fase==='revelado';
  const avs = j.jogadores.map(x => { let c = ''; if(rev && j.ult.sairam.includes(x.id)) c = 'saiu'; else if(!x.dentro) c = 'fora'; else if(j.fase==='pergunta' && g.resp[x.id]) c = 'resp'; return jgAv(x, c); }).join('');
  const vivos = j.jogadores.filter(x => x.dentro).length; const quem = jgQuemResponde(j); const resp = quem.filter(id => g.resp[id]).length;
  const chao = `<div class="jg-abs jg-chao"><div class="jg-cont"><span>Na disputa: <b>${vivos}</b></span><span>Saíram: <b>${j.jogadores.length - vivos}</b></span>${j.fase==='pergunta' && !g.aluno ? `<span>Responderam: <b>${resp}/${quem.length}</b></span>` : ''}</div><div class="jg-avs">${avs}</div></div>`;
  if(j.fase==='fim') return `<div class="jg-abs jg-centro"><div class="jg-coroa">👑</div><div class="jg-sub">${esc(j.motivo||'')} · ${j.r + 1} rodada(s)</div><div class="jg-venc">${j.venc ? esc(j.venc.nome) : '—'}</div><div class="jg-podio">${(j.podio||[]).map((x, i) => `<span>${i+2}º ${esc(x.nome)}</span>`).join('')}</div></div>${chao}`;
  let faixa = '';
  if(rev){ const s = j.ult.sairam.map(id => (j.jogadores.find(x => x.id===id)||{}).nome).filter(Boolean), v = j.ult.voltaram.length;
    faixa = j.ult.salva ? `<div class="jg-abs jg-faixa salva">Todos erraram: ninguém sai!<small>A certa era ${JG_L[q.c]}.</small></div>`
      : `<div class="jg-abs jg-faixa">${s.length ? `Saíram ${s.length}` : 'Ninguém saiu!'}${v ? ` · Voltaram ${v}` : ''}<small>${s.length ? esc(s.slice(0, 8).join(', ')) + (s.length > 8 ? ` e mais ${s.length - 8}` : '') : 'Todos que estavam na disputa acertaram.'}</small></div>`; }
  return `<div class="jg-abs jg-topo"><span class="jg-pill">Rodada ${j.r + 1} · ${esc(JG_DISC[q.disc] || q.tema || '')}${q.disc && q.tema ? ' · ' + esc(q.tema) : ''}${j.repescaAgora ? ' · 🔁 REPESCAGEM' : ''}</span></div>
    <div class="jg-abs jg-relogio" data-jg-timer="#2ee6ff">${jgRelogioSvg(rev ? 0 : jgRestante(j), j.T, '#2ee6ff')}</div>
    <div class="jg-abs jg-cartao"><div class="jg-cmd" data-jg-fit="1.55">${esc(q.comando)}</div>${q.texto || q.imagem || q.temImg ? `<button class="jg-btxt" data-jg="texto">📄 Ver texto · ${esc(jgFonteQ(q))}</button>` : ''}
      <div class="jg-ops">${jgOpsHtml(j, q, rev, rev ? j.ult.cont : null)}</div></div>${chao}${faixa}`;
}
function jgTelaoNaval(j, q){
  const g = jgState();
  const placar = `<div class="jg-abs jg-placar">${j.equipes.map(e => { let st = '';
    if(j.fase==='pergunta' && !g.aluno){ const v = e.membros.filter(m => g.resp[m.id]).length; st = `<span class="jg-st">🗳️ ${v}/${e.membros.length}</span>`; }
    else if(j.fase==='revelado') st = `<span class="jg-st">${j.ult.equipes[e.id].ok ? '✅ tiro' : '❌'}</span>`;
    return `<span class="jg-chip ${j.fase==='tiros' && j.vez===e.id ? 'ativo' : ''}" style="--c:${e.cor}"><span class="jg-ic">${e.ico}</span>${esc(e.nome)} <span class="jg-pt">${e.pts}</span>${st}</span>`; }).join('')}</div>`;
  if(j.fase==='fim') return `<div class="jg-abs jg-centro jg-perg"><div class="jg-coroa">🏆</div><div class="jg-sub">${esc(j.motivo||'')}</div><div class="jg-venc">${j.rank[0].ico} ${esc(j.rank[0].nome)}</div><div class="jg-rank">${j.rank.map((e, k) => `<div style="--c:${e.cor}">${k+1}º ${e.ico} ${esc(e.nome)} <small>· ${e.acertos} ${e.acertos===1 ? 'questão certa' : 'questões certas'}</small><b>${e.pts} pts</b></div>`).join('')}</div></div>`;
  if(j.fase==='tiros'){
    const e = j.equipes.find(x => x.id===j.vez); const cap = e && e.membros.find(m => m.id===j.capitao);
    const vez = e ? `<div class="jg-abs jg-vez" style="background:${e.cor}">${e.ico} Vez dos ${esc(e.nome)}<small>${j.aguarda ? `Capitão: ${esc(cap ? cap.nome : '—')} escolhe no tablet (ou o professor clica no tabuleiro)` : 'Tiro disparado!'}</small></div>`
      : `<div class="jg-abs jg-vez" style="background:#7a4a22">${j.frota.every(n => n.afundou) ? 'A frota pirata afundou!' : 'Fim dos tiros desta rodada'}<small>${j.frota.every(n => n.afundou) ? '' : 'Professor: próxima questão'}</small></div>`;
    const frota = `<div class="jg-abs jg-frota">${j.frota.map(n => `<span class="${n.afundou ? 'af' : ''}">${n.nome} ${Array.from({length:n.t}, (_, i) => `<i class="${i < n.hits ? 'x' : ''}"></i>`).join('')}</span>`).join('')}</div>`;
    return `<div class="jg-abs jg-topo"><span class="jg-pill">Rodada ${j.r + 1} de ${j.perguntas.length} · Tiros</span></div>${vez}${frota}<div class="jg-abs jg-tabwrap">${jgNavTabHtml(j, g.aluno ? (j.aguarda && j.capitao===state.aluno.matriculaStudentId && !jgMinha(j)) : j.aguarda)}</div>${j.efeito ? `<div class="jg-abs jg-efeito">${esc(j.efeito)}</div>` : ''}${placar}`;
  }
  const rev = j.fase==='revelado';
  return `<div class="jg-abs jg-topo"><span class="jg-pill">Rodada ${j.r + 1} de ${j.perguntas.length} · ${esc(JG_DISC[q.disc] || q.tema || '')}${q.disc && q.tema ? ' · ' + esc(q.tema) : ''}</span></div>
    <div class="jg-abs jg-relogio" data-jg-timer="#1f7fd6">${jgRelogioSvg(rev ? 0 : jgRestante(j), j.T, '#1f7fd6')}</div>
    <div class="jg-abs jg-cartao jg-perg"><div class="jg-cmd" data-jg-fit="1.55">${esc(q.comando)}</div>${q.texto || q.imagem || q.temImg ? `<button class="jg-btxt" data-jg="texto">📜 Ver texto · ${esc(jgFonteQ(q))}</button>` : ''}
      <div class="jg-ops">${q.ops.map((o, i) => `<div class="jg-op ${rev && i===q.c ? 'certa' : ''} ${rev && i!==q.c ? 'apagada' : ''}"${jgOpAttr(j, i)}><span class="jg-l">${JG_L[i]}</span><span class="jg-t" data-jg-fit="1.15">${esc(o)}</span>${rev ? `<span class="jg-bdg">${j.equipes.filter(e => j.ult.equipes[e.id].resp===i).map(e => `<span class="jg-eqb" style="--c:${e.cor}" title="${esc(e.nome)}">${e.ico}</span>`).join('')}</span>` : ''}</div>`).join('')}</div></div>
    ${rev ? `<div class="jg-abs jg-faixa jg-faixa-naval">${j.fila.length ? '🎯 Atiram: ' + j.fila.map(id => { const e = j.equipes.find(x => x.id===id); return e.ico + ' ' + esc(e.nome); }).join(' → ') : 'Nenhuma equipe acertou. Ninguém atira.'}</div>` : ''}${placar}`;
}
function jgNavTabHtml(j, mira){
  let h = '<div class="jg-h"></div>' + [...JG_COL].map(c => `<div class="jg-h">${c}</div>`).join('');
  for(let r = 0; r < JG_N; r++){ h += `<div class="jg-h">${r+1}</div>`;
    for(let c = 0; c < JG_N; c++){ const s = j.tiros[r][c]; const ult = j.ultimo && j.ultimo[0]===r && j.ultimo[1]===c && j.efeito;
      h += `<button class="jg-cel ${s || 'livre'} ${ult ? 'ultimo' : ''}" ${mira && !s ? `data-jg="${jgEhAluno() ? 'al-tiro' : 'nav-cel'}" data-r="${r}" data-c="${c}"` : 'tabindex="-1"'} aria-label="${JG_COL[c]}${r+1}">${s==='fogo' ? '🔥' : s==='afundado' ? '✖' : ''}</button>`; } }
  return `<div class="jg-tab ${mira ? 'mira' : ''}">${h}</div>`;
}
function jgTelaoEscada(j, q){
  const g = jgState();
  if(j.fase==='fim'){
    const top = Object.entries(j.placar||{}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => { const a = g.presenca[id] || {}; return `<span>${esc(a.nome || 'Aluno')} · ${n}</span>`; }).join('');
    return `<div class="jg-modal"><div class="jg-caixa" style="text-align:center"><h2>${esc(j.motivo||'')}</h2><div class="jg-fim-pts">${jgFmt(j.final)} pontos</div><p class="jg-mut">${j.nivel} de 10 degraus subidos.</p>${top ? `<p class="jg-mut">Quem mais acertou nos tablets</p><div class="jg-podio">${top}</div>` : ''}</div></div>`;
  }
  let h = JG_ESC_DEG.map(([y, w], i) => `<div class="jg-abs jg-degrau ${i===j.nivel ? 'atual' : ''} ${i<j.nivel ? 'feito' : ''} ${JG_ESC_SEG.includes(i) ? 'seg' : ''}" style="left:${53.95 - w/2}%;top:${y-2.3}%;width:${w}%;height:4.6%"></div>`).join('');
  const turmaModo = j.cfg.modo!=='palco'; const rev = j.fase==='revelado';
  const quem = jgQuemResponde(j); const nresp = quem.filter(id => g.resp[id]).length;
  h += `<div class="jg-abs jg-esc-placar">Pergunta ${j.nivel+1} de 10 · vale ${jgFmt(JG_ESC_VAL[j.nivel])}<small>Garantido: ${jgFmt(j.garantido)} · Se parar: ${jgFmt(j.nivel ? JG_ESC_VAL[j.nivel-1] : 0)}${turmaModo && j.fase==='pergunta' && !g.aluno ? ` · Responderam ${nresp}/${quem.length}` : ''}</small></div>`;
  if(j.inicio && (j.fase==='pergunta')) h += `<div class="jg-abs jg-relogio jg-esc-rel" data-jg-timer="#ffd86b">${jgRelogioSvg(jgRestante(j), j.T, '#ffd86b')}</div>`;
  h += `<div class="jg-abs jg-esc-perg" data-jg-fit="1.55">${esc(q.comando)}</div>${q.texto || q.imagem || q.temImg ? `<button class="jg-abs jg-esc-btxt" data-jg="texto">📄 Ver texto · ${esc(jgFonteQ(q))}</button>` : ''}`;
  q.ops.forEach((o, i) => { let c = ''; if((j.fora||[]).includes(i)) c += ' fora'; if(j.fase==='pergunta' && j.sel===i) c += ' sel'; if(rev){ if(i===q.c) c += ' certa'; else if(i===j.sel) c += ' errada'; }
    if(g.aluno){ const mm = jgMinha(j); c = c.replace(' sel', ''); if(mm && mm.i===i && !rev) c += ' sel'; }
    const attr = g.aluno ? (jgAlunoPodeResponder(j) && !(j.fora||[]).includes(i) ? `data-jg="al-resp" data-i="${i}"` : 'tabindex="-1"') : (j.cfg.modo==='palco' && j.fase==='pergunta' && !j.votacao ? `data-jg="esc-op" data-i="${i}"` : 'tabindex="-1"');
    h += `<button class="jg-abs jg-esc-op jg-esc-op${JG_L[i]}${c}" ${attr} aria-label="Alternativa ${JG_L[i]}"><span class="jg-t" data-jg-fit="1.2">${esc(o)}</span>${rev && j.ult && j.ult.cont ? `<span class="jg-esc-pc">${Math.round((j.ult.cont[i]||0) / Math.max(1, j.ult.n) * 100)}%</span>` : ''}</button>`; });
  Object.entries(JG_ESC_AJ).forEach(([k, r]) => { h += `<button class="jg-abs jg-esc-aj ${j.ajudas[k] ? '' : 'usada'}" ${j.ajudas[k] && j.fase==='pergunta' && !g.aluno ? `data-jg="esc-ajuda" data-k="${k}"` : 'tabindex="-1"'} style="left:${r[0]}%;top:${r[1]}%;width:${r[2]}%;height:${r[3]}%" aria-label="${{eliminar:'Eliminar duas',turma:'Perguntar à turma',dica:'Dica do mestre'}[k]}"></button>`; });
  if(rev && !g.aluno){ const ok = j.acertou, ultimo = j.nivel===9;
    const linha = turmaModo ? `${j.ult.ok} de ${j.ult.n} acertaram (${Math.round(j.ult.pct*100)}%). ${ok ? 'Mais da metade: a turma sobe!' : 'Menos da metade acertou.'} ` : '';
    const res = ok ? (ultimo ? 'A turma chegou aos 50.000 pontos.' : `Sobe para ${jgFmt(JG_ESC_VAL[j.nivel])} pontos.${JG_ESC_SEG.includes(j.nivel) ? ' Patamar seguro alcançado 🔒' : ''}`) : `A certa era ${JG_L[q.c]}. Fica com ${jgFmt(j.garantido)} pontos garantidos.`;
    h += `<div class="jg-modal jg-modal-topo"><div class="jg-caixa" style="max-width:58%"><h2 style="color:${ok ? '#2fbf71' : '#e5484d'}">${ok ? (ultimo ? 'Topo da escada!' : 'Resposta certa!') : 'Não foi dessa vez'}</h2><p><b>${linha}${res}</b></p><p class="jg-mut"><b>Por que ${JG_L[q.c]}:</b> ${esc(q.exp||'')}</p></div></div>`; }
  return h;
}
function renderJogos(){
  const g = jgState();
  if(g.tela==='ao-vivo' && g.current) return renderJogoAoVivo();
  if(g.tela==='config' && g.cfg) return renderJogoConfig();
  return `<div class="card" data-jogos-menu>
    <h2 style="margin-top:0;">🕹️ Jogos da turma</h2>
    <p class="muted" style="margin-top:0;">Jogos ao vivo com as questões oficiais do ENEM (ou do seu banco). O telão mostra o jogo e cada aluno responde no próprio tablet. As respostas entram em <strong>Meu Painel → 📝 ENEM</strong>.</p>
    <div class="jg-menu">${Object.entries(JG_INFO).map(([k, i]) => `<button class="jg-card" data-jg="escolher" data-tipo="${k}"><span class="jg-card-art" style="background-image:${jgArtVar(k, 'abre')}"></span><span class="jg-card-txt"><strong>${i.icon} ${esc(i.nome)}</strong><span>${esc(i.desc)}</span></span></button>`).join('')}</div>
    ${jgArteFaltando() ? '<p class="muted" style="font-size:.85rem;margin-top:10px;color:#b3261e;">🎨 As artes dos jogos ainda não foram importadas. Os jogos funcionam, mas sem as imagens: peça à coordenação para importar o arquivo <b>jogos-arte.json</b> em Plano de aulas do livro → Importar plano.</p>' : ''}
    <p class="muted" style="font-size:.85rem;margin-top:14px;">Sem data show? Escolha o jogo do mesmo jeito: a questão aparece completa em cada tablet e você conduz pelo notebook ou celular.</p>
  </div>`;
}
function renderJogoConfig(){
  const g = jgState(), c = g.cfg, info = JG_INFO[c.tipo];
  const turmas = professorTurmas();
  const pool = g.pool;
  const base = pool ? pool.filter(q => q.ops.length >= info.min) : [];
  const temas = {}; base.forEach(q => { if(!q.tema) return; const d = JG_DISC[q.disc] || 'Banco'; (temas[d] = temas[d] || {})[q.tema] = ((temas[d]||{})[q.tema]||0) + 1; });
  const nSel = c.temas.length ? base.filter(q => c.temas.includes(q.tema)).length : base.length;
  const sel = (id, opts, val) => `<select data-jg-cfg="${id}">${opts.map(([v, t]) => `<option value="${v}" ${String(val)===String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  const chk = (id, val, txt) => `<label class="jg-chk"><input type="checkbox" data-jg-cfg="${id}" ${val ? 'checked' : ''}> ${txt}</label>`;
  let extra = '';
  if(c.tipo==='qes') extra = `<div><label>Tempo por pergunta</label>${sel('T', [[20,'20 segundos'],[30,'30 segundos'],[45,'45 segundos'],[60,'60 segundos'],[90,'90 segundos']], c.T)}</div>${chk('salva', c.salva, 'Se todos errarem, ninguém sai')}${chk('repesca', c.repesca, 'Repescagem na 5ª rodada')}`;
  if(c.tipo==='naval') extra = `<div><label>Equipes</label>${sel('equipes', [[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6']], c.equipes)}</div><div><label>Tempo por questão</label>${sel('T', [[30,'30 segundos'],[45,'45 segundos'],[60,'60 segundos'],[90,'90 segundos'],[120,'2 minutos']], c.T)}</div><div><label>Questões no jogo</label>${sel('nPerg', [[8,'8'],[10,'10'],[12,'12'],[15,'15'],[20,'20']], c.nPerg)}</div>${chk('deNovo', c.deNovo, 'Acertou um navio? Atira de novo (1 vez)')}`;
  if(c.tipo==='missao') extra = `<div><label>Modo</label>${sel('mmodo', [['equipes','Esquadrões (equipes)'],['individual','Individual (cada agente)']], c.mmodo)}</div>${c.mmodo!=='individual' ? `<div><label>Esquadrões</label>${sel('equipes', [[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6']], c.equipes)}</div>` : ''}<div><label>Pavio (tempo)</label>${sel('T', [[30,'30 segundos'],[45,'45 segundos'],[60,'60 segundos'],[90,'90 segundos']], c.T)}</div>`;
  if(c.tipo==='escada') extra = `<div><label>Como jogar</label>${sel('modo', [['turma','Turma inteira (todos respondem no tablet)'],['palco','No palco (um aluno ou equipe no telão)']], c.modo)}</div>${c.modo!=='palco' ? `<div><label>Tempo por pergunta</label>${sel('T', [[30,'30 segundos'],[45,'45 segundos'],[60,'60 segundos'],[90,'90 segundos']], c.T)}</div>` : ''}`;
  return `<div class="card" data-jogo-config>
    <div class="row" style="align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;"><h2 style="margin:0;">${info.icon} ${esc(info.nome)}</h2><button class="btn btn-ghost btn-sm" data-jg="voltar-menu">← Todos os jogos</button></div>
    <p class="muted">${esc(info.desc)}</p>
    ${g.sugestao ? `<p class="jg-sug-txt">📘 ${esc(g.sugestao)} Os temas já vêm marcados; ajuste se quiser.</p>` : ''}
    <div class="jg-cfg">
      <div><label>Turma</label>${sel('turmaId', turmas.map(t => [t.id, t.name]), c.turmaId)}</div>
      <div><label>Questões de</label>${sel('fonte', (c.lista ? [['aula', c.rotuloAula || 'Perguntas desta aula']] : []).concat([['enem','ENEM oficial (INEP)'],['banco','Meu banco de questões']]), c.fonte)}</div>
      ${c.fonte==='enem' ? `<div><label>Disciplina</label>${sel('disc', [['area:CH','Ciências Humanas (área)'],['area:CN','Ciências da Natureza (área)'],['','Todas as áreas']].concat(Object.entries(JG_DISC)), c.disc)}</div>${chk('comImagem', c.comImagem, 'Incluir questões com imagem (abrem em “Ver texto”)')}` : ''}
      ${extra}
    </div>
    <details class="jg-temas" ${c.temas.length ? 'open' : ''}><summary>🏷️ Temas: ${c.temas.length ? esc(c.temas.slice(0, 2).join(', ')) + (c.temas.length > 2 ? ` +${c.temas.length - 2}` : '') : 'todos'} · ${pool ? nSel : '…'} questões</summary>
      ${!pool ? '<div class="spinner"></div>' : `<div class="jg-temas-lista">${Object.keys(temas).sort().map(d => `<div class="jg-temas-g">${esc(d)}</div>` + Object.keys(temas[d]).sort((a, b) => a.localeCompare(b, 'pt')).map(t => `<label class="jg-chk"><input type="checkbox" data-jg-tema="${esc(t)}" ${c.temas.includes(t) ? 'checked' : ''}> ${esc(t)} (${temas[d][t]})</label>`).join('')).join('') || '<p class="muted">Nenhuma questão com esses filtros.</p>'}</div>`}
    </details>
    ${pool && c.tipo==='escada' && nSel < 10 ? `<p class="muted" style="font-size:.85rem;">Os temas escolhidos têm ${nSel} questão(ões); o jogo completa até 10 com outras ${c.fonte==='enem' ? (c.disc ? 'da disciplina' : 'da área') : 'do banco'}.</p>` : ''}
    <div class="row" style="gap:10px;margin-top:14px;flex-wrap:wrap;"><button class="btn btn-primary" data-jg="abrir-sala" ${pool ? '' : 'disabled'}>Abrir a sala para a turma</button></div>
    <p class="muted" style="font-size:.82rem;margin-top:8px;">Ao abrir a sala, o jogo aparece no início do app de cada aluno da turma, com o botão <b>Entrar no jogo</b>.</p>
  </div>`;
}
function jgControlesHtml(j, cls){
  const g = jgState(); const b = (acao, txt, prim, dis, extra) => `<button class="btn ${prim ? 'btn-primary' : 'btn-ghost'}" data-jg="${acao}" ${dis ? 'disabled' : ''} ${extra||''}>${txt}</button>`;
  const q = jgPergunta(j); let bt = '';
  if(j.tipo==='missao' && j.fase!=='fim'){
    if(j.fase==='sala') bt = b('comecar', `📩 Mensagem confidencial (${Object.keys(g.presenca).length} na sala)`, true);
    else if(j.fase==='msg') bt = b('mis-aceitar', 'Aceitar a missão', true);
    else if(j.fase==='mapa') bt = b('nada', 'Aguardando a escolha do envelope', false, true);
    else if(j.fase==='abrindo') bt = b('nada', 'Abrindo o envelope…', false, true);
    else if(j.fase==='armadilha') bt = b('proxima', 'Próximo envelope', true);
    else if(j.fase==='pergunta') bt = b('revelar', 'Revelar agora', true);
    else if(j.fase==='revelado') bt = b('proxima', j.final ? 'Ver o resultado' : 'Voltar ao mapa', true);
  }
  else if(j.fase==='sala') bt = b('comecar', `▶ Começar (${Object.keys(g.presenca).length} na sala)`, true);
  else if(j.fase==='fim') bt = g.daAula ? '' : b('encerrar', 'Encerrar e voltar aos jogos', true);
  else if(j.tipo==='escada'){
    if(j.fase==='pergunta'){
      if(j.cfg.modo==='palco') bt = j.votacao ? b('fechar-votacao', 'Encerrar votação', true) : b('esc-confirmar', 'Confirmar resposta', true, j.sel==null);
      else bt = b('revelar', 'Revelar agora', true);
      bt += b('esc-parar', 'Parar e levar os pontos', false, !j.nivel);
    } else bt = b('proxima', j.acertou && j.nivel < 9 ? 'Próxima pergunta' : 'Ver resultado', true);
  } else if(j.fase==='pergunta') bt = b('revelar', 'Revelar agora', true);
  else if(j.fase==='revelado') bt = j.tipo==='naval' ? b('proxima', j.fila.length ? 'Ir para os tiros' : (j.r + 1 >= j.perguntas.length ? 'Ver o resultado' : 'Próxima questão'), true) : b('proxima', j.jogadores.filter(x => x.dentro).length <= 1 || j.r + 1 >= Math.min(JG_QES_MAX, j.perguntas.length) ? 'Ver o vencedor' : 'Próxima rodada', true);
  else if(j.fase==='tiros') bt = b('proxima', j.r + 1 >= j.perguntas.length || j.frota.every(n => n.afundou) ? 'Ver o resultado' : 'Próxima questão', true, j.vez!=null);
  const pres = g.daAula ? b('voltar-aula', '↩ Voltar à aula', j.fase==='fim') : jgSemProjAtivo() ? '' : b('apresentar', g.apresentar ? '🗗 Sair da tela cheia' : '📺 Tela cheia no telão');
  const fim = j.fase!=='fim' && !g.daAula ? b('encerrar', 'Encerrar jogo') : '';
  return `<div class="jg-ctrl ${cls||''}">${bt}${pres}${jgSomControlesHtml()}${fim}${q && j.fase!=='sala' && j.fase!=='fim' && !(j.tipo==='missao' && !['pergunta','revelado'].includes(j.fase)) ? `<span class="jg-ctrl-info">${esc(jgFonteQ(q))}${q.tema ? ' · ' + esc(q.tema) : ''}</span>` : ''}</div>`;
}
function jgSemProjAtivo(){ const g = jgState(); if(g.semProj==null){ let v = null; try{ v = localStorage.getItem('jg-semproj'); }catch(e){} g.semProj = v!=null ? v==='1' : (typeof window!=='undefined' && window.innerWidth < 760); } return !!g.semProj; }
function jgSetSemProj(v){ const g = jgState(); g.semProj = !!v; try{ localStorage.setItem('jg-semproj', v ? '1' : '0'); }catch(e){} if(v && g.apresentar){ g.apresentar = false; try{ if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); }catch(e){} } render(); }
function jgPlacarCelular(j){
  const g = jgState();
  if(j.tipo==='qes' && j.jogadores){ const d = j.jogadores.filter(x => x.dentro); return `<b>Na disputa: ${d.length}</b> · fora: ${j.jogadores.length - d.length}<div class="jgc-nomes">${d.slice(0, 16).map(x => esc(x.nome)).join(' · ')}${d.length > 16 ? ` e mais ${d.length - 16}` : ''}</div>`; }
  if(j.tipo==='naval' && j.equipes) return j.equipes.map(e => `<span class="jgc-chip" style="--c:${e.cor}">${e.ico} ${esc(e.nome)} <b>${e.pts}</b></span>`).join('');
  if(j.tipo==='escada') return `Pontos garantidos: <b>${jgFmt(j.garantido||0)}</b> · degrau ${Math.min(10, (j.nivel||0) + 1)} de 10`;
  if(j.tipo==='missao'){ const l = (typeof jgMisLista==='function' ? jgMisLista(j) : []).slice().sort((a, b) => b.pts - a.pts); return l.slice(0, 8).map(e => `<span class="jgc-chip" style="--c:${e.cor||'#7a1f2b'}">${e.ico || '🕵️'} ${esc(e.nome)} <b>${e.pts}</b></span>`).join(''); }
  return '';
}
function renderJogoCelular(){
  const g = jgState(), j = g.current; const info = JG_INFO[j.tipo]; const q = jgPergunta(j);
  const pres = jgAlunosNaSala(j); const sem = new Set(jgSemSinal()); const nome = id => (g.presenca[id]||{}).nome || 'Aluno';
  const votando = j.fase==='pergunta' || (j.tipo==='escada' && j.votacao);
  const quem = jgQuemResponde(j); const faltam = quem.filter(id => !g.resp[id]);
  const FASE = { sala:'Sala aberta: alunos entrando', msg:'Mensagem confidencial', mapa:'Escolha do envelope', abrindo:'Abrindo o envelope', armadilha:'Armadilha', pergunta:'Pergunta no ar', revelado:'Resposta revelada', tiros:'Hora dos tiros', fim:'Fim de jogo' };
  const rodada = j.tipo==='escada' ? `Degrau ${Math.min(10, (j.nivel||0) + 1)} de 10` : j.tipo==='missao' ? (j.atual ? (j.final ? 'Missão final' : `Envelope ${j.atual}`) : '') : (j.perguntas && j.fase!=='sala' ? `Rodada ${j.r + 1}` : '');
  let pergunta = '';
  if(q && ['pergunta','revelado'].includes(j.fase)){
    const cont = {}; let tot = 0; Object.values(g.resp||{}).forEach(v => { if(v && v.i!=null){ cont[v.i] = (cont[v.i]||0) + 1; tot++; } });
    const rev = j.fase==='revelado';
    pergunta = `<div class="jgc-q"><div class="jgc-fonte">${esc(jgFonteQ(q))}${q.tema ? ' · ' + esc(q.tema) : ''}</div><div class="jgc-cmd">${esc(q.comando)}</div>
      ${q.ops.map((o, i) => { const c = cont[i]||0; const pc = tot ? Math.round(c / tot * 100) : 0;
        return `<div class="jgc-op ${i===q.c ? 'certa' : ''} ${(j.fora||[]).includes(i) ? 'fora' : ''}"><span class="jgc-l">${JG_L[i]}</span><span class="jgc-t">${esc(o)}</span><span class="jgc-n">${c}</span><div class="jgc-bar" style="width:${pc}%"></div></div>`; }).join('')}
      <div class="jgc-dica">${rev ? `Resposta: <b>${JG_L[q.c]}</b>. ${esc(q.exp||'')}` : 'Só você vê a resposta (✓) e as contagens. Leia a pergunta em voz alta se quiser.'}</div></div>`;
  }
  const respLinha = votando ? `<div class="jgc-resp"><b>${quem.length - faltam.length}</b> de ${quem.length} responderam${faltam.length && faltam.length <= 12 ? `<div class="jgc-nomes">Faltam: ${faltam.map(nome).map(esc).join(', ')}</div>` : ''}</div>` : '';
  const semLinha = sem.size ? `<div class="jgc-sem">📶 ${sem.size} tablet(s) sem sinal: ${[...sem].map(nome).map(esc).join(', ')}. O jogo segue sem esperar por eles.</div>` : '';
  const verTela = ['mapa','tiros','msg'].includes(j.fase) || (j.tipo==='escada' && j.cfg.modo==='palco');
  return `<div class="card jgc" data-jogo-ao-vivo data-jogo-celular>
    <div class="jgc-top"><span>${info.icon} <b>${esc(info.curto || info.nome)}</b> · ${esc(j.turmaName)}</span><button class="btn btn-ghost btn-sm" data-jg="semproj-off" style="width:auto;">🖥️ Tenho projetor</button></div>
    <div class="jgc-fase"><span>${esc(FASE[j.fase] || j.fase)}${rodada ? ' · ' + rodada : ''}</span>${votando && j.inicio ? `<span class="jgc-timer" data-jg-timer-txt>${Math.ceil(jgRestante(j))}s</span>` : ''}</div>
    ${respLinha}${semLinha}
    ${j.fase==='sala' ? `<div class="jgc-resp"><b>${pres.length}</b> aluno(s) na sala<div class="jgc-nomes">${pres.map(a => esc(a.nome)).join(' · ') || 'Peça para os alunos tocarem em “Entrar no jogo” no tablet.'}</div></div>` : ''}
    ${jgFaltamHtml(j)}
    ${pergunta}
    ${j.fase!=='sala' ? `<div class="jgc-placar">${jgPlacarCelular(j)}</div>` : ''}
    ${jgControlesHtml(j, 'jgc-ctrl')}
    <details class="jgc-tela" ${verTela ? 'open' : ''}><summary>🖥️ Ver a tela dos alunos${verTela ? ' (toque para escolher por eles, se precisar)' : ''}</summary><div class="jg-telao-wrap">${jgTelaoHtml(j)}</div></details>
  </div>`;
}
function renderJogoAoVivo(){
  const g = jgState(), j = g.current;
  if(jgSemProjAtivo() && !g.apresentar) return renderJogoCelular();
  const pres = jgAlunosNaSala(j); const quem = jgQuemResponde(j);
  const lista = (j.fase==='pergunta' && !(j.tipo==='escada' && j.cfg.modo==='palco')) || (j.tipo==='escada' && j.votacao) ? `<p class="muted" style="margin:6px 0 4px;">Responderam ${quem.filter(id => g.resp[id]).length} de ${quem.length}</p>` : '';
  return `<div class="card" data-jogo-ao-vivo>
    <div class="row" style="align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;"><h2 style="margin:0;">${JG_INFO[j.tipo].icon} ${esc(JG_INFO[j.tipo].nome)} · ${esc(j.turmaName)}</h2></div>
    <div class="jg-telao-wrap">${jgTelaoHtml(j)}</div>
    ${jgControlesHtml(j)}
    ${jgFaltamHtml(j)}
    ${lista}
    ${jgSemSinal().length ? `<p class="jgc-sem">📶 ${jgSemSinal().length} tablet(s) sem sinal. O jogo segue sem esperar por eles.</p>` : ''}
    <p style="margin:6px 0;"><button class="btn btn-ghost btn-sm" data-jg="semproj-on" style="width:auto;">📱 Sala sem projetor: conduzir pelo celular</button></p>
    <details class="jg-presentes"><summary>👥 ${pres.length} aluno(s) no jogo</summary><div class="jg-presentes-l">${pres.map(a => `<span>${jgAv(a)} ${esc(a.nome)}${(j.fase==='pergunta' || j.votacao) && g.resp[a.id] ? ' ✓' : ''}</span>`).join('') || '<span class="muted">Ninguém entrou ainda.</span>'}</div></details>
    ${j.tipo==='escada' && j.cfg.modo==='palco' ? '<p class="muted" style="font-size:.84rem;">No palco: clique numa alternativa do telão para marcar e clique de novo (ou em “Confirmar”) para responder. “Perguntar à turma” abre a votação nos tablets.</p>' : ''}
    ${j.tipo==='naval' && j.fase==='tiros' && j.aguarda ? '<p class="muted" style="font-size:.84rem;">Se o capitão demorar, clique numa casa do tabuleiro para atirar pela equipe.</p>' : ''}
  </div>`;
}
function renderJogoApresentacao(){
  const g = jgState(), j = g.current;
  return `<div class="jg-apresentacao"><div class="jg-telao-wrap jg-full">${jgTelaoHtml(j)}</div>${jgControlesHtml(j, 'jg-ctrl-full')}</div>`;
}
async function pollJogoForAluno(){
  const al = state.aluno;
  if(al.stage!=='dashboard' || !al.turma || al.turma.id==='multi') return false;
  try{ const ja = al.jogoAtivo; if(ja && al.jogoEntrou && al.jogoEntrou[ja.id] && ja.fase!=='fim' && Date.now() - (al.jgHb||0) > 15000){ al.jgHb = Date.now();
    const st = (al.turma.students||[]).find(s => s.id===al.matriculaStudentId) || {};
    window.storage.set(jgPrefIn(ja) + al.matriculaStudentId, JSON.stringify({ nome: al.name || st.name || 'Aluno', emoji: st.avatarEmoji || '', cor: st.avatarColor || '', at: Date.now() }), true).catch(() => {}); } }catch(e){}
  const prev = al.jogoAtivo;
  let j = null; try{ j = await liveLerJson(chaveAoVivo('jogo-ativo', al.turma.id), null); }catch(e){}
  al.jogoAtivo = j && j.turmaId===al.turma.id ? j : null;
  if(prev && !al.jogoAtivo && document.fullscreenElement && document.querySelector('[data-jogo-tela]')){ try{ document.exitFullscreen().catch(()=>{}); }catch(e){} }
  const mudou = JSON.stringify(al.jogoAtivo) !== JSON.stringify(prev);
  if(mudou && al.jogoAtivo && prev && prev.id===al.jogoAtivo.id){
    const a = al.jogoAtivo, m = al.jogoMinha;
    if(a.fase==='revelado' && prev.fase!=='revelado' && m && m.jogoId===a.id && m.rk===String(a.tipo==='escada' ? a.nivel : a.r)){
      const q = a.perguntas[a.tipo==='escada' ? a.nivel : a.r]; try{ m.i===q.c ? quizPlayCorrect() : quizPlayWrong(); }catch(e){}
    }
  }
  return mudou;
}
async function jgAlunoEntrar(){
  const al = state.aluno, j = al.jogoAtivo; if(!j) return;
  const st = (al.turma.students||[]).find(s => s.id===al.matriculaStudentId) || {};
  al.jogoEntrou = al.jogoEntrou || {}; al.jogoEntrou[j.id] = true; al.jgHb = Date.now(); render();
  try{ await window.storage.set(jgPrefIn(j) + al.matriculaStudentId, JSON.stringify({ nome: al.name || st.name || 'Aluno', emoji: st.avatarEmoji || '', cor: st.avatarColor || '', at: Date.now() }), true); }catch(e){}
}
async function jgEnviar(key, val, m){
  m.env = 'pend'; m.t0 = Date.now(); render(); const avisa = setTimeout(() => { if(m.env==='pend') render(); }, 2600);
  for(let k = 0; k < 60; k++){
    try{ await window.storage.set(key, JSON.stringify(val), true); m.env = 'ok'; clearTimeout(avisa); render(); return true; }
    catch(e){ m.env = 'pend'; render(); await new Promise(r => setTimeout(r, 2000));
      const a = state.aluno.jogoAtivo; if(!a || a.id!==m.jogoId || a.rk!==m.rk){ m.env = 'perdida'; render(); return false; } }
  }
  return false;
}
function jgEnvTxt(m){ return m && m.env==='pend' ? 'Enviando… 📶' : 'Resposta enviada ✓'; }
function jgEnvLinha(m, padrao){ return m && m.env==='pend' && Date.now() - (m.t0||0) > 2500 ? '📶 Sem internet agora: sua resposta será enviada assim que a conexão voltar.' : padrao; }
async function jgAlunoResponder(i){
  const al = state.aluno, j = al.jogoAtivo; if(!j || !j.rk) return;
  const m = al.jogoMinha; if(m && m.jogoId===j.id && m.rk===j.rk) return;
  al.jogoMinha = { jogoId:j.id, rk:j.rk, i };
  await jgEnviar(jgPrefResp(j, j.rk) + al.matriculaStudentId, { i, at: Date.now() }, al.jogoMinha);
}
async function jgAlunoTiro(r, c){
  const al = state.aluno, j = al.jogoAtivo; if(!j || j.fase!=='tiros' || !j.aguarda || j.capitao!==al.matriculaStudentId) return;
  const m = al.jogoMinha; if(m && m.jogoId===j.id && m.rk===j.rk) return;
  al.jogoMinha = { jogoId:j.id, rk:j.rk, r, c };
  await jgEnviar(jgPrefResp(j, j.rk) + al.matriculaStudentId, { r, c, at: Date.now() }, al.jogoMinha);
}
function jgAlunoPainelHtml(j){
  if(j.tipo==='missao') return jgMisPainelAluno(j);
  const al = state.aluno, sid = al.matriculaStudentId; const q = j.perguntas && j.perguntas[j.tipo==='escada' ? j.nivel : j.r];
  const eq = j.tipo==='naval' && j.equipes ? j.equipes.find(e => e.membros.some(x => x.id===sid)) : null;
  const eu = j.tipo==='qes' && j.jogadores ? j.jogadores.find(x => x.id===sid) : null;
  const m = al.jogoMinha && al.jogoMinha.jogoId===j.id ? al.jogoMinha : null;
  let st = eq ? `${eq.ico} ${esc(eq.nome)}` : eu ? (eu.dentro ? '🟢 Na disputa' : '🔴 Torcida') : esc(al.name||'');
  let t = '', l = '', x = '';
  if(j.fase==='sala'){ t = 'Você entrou! 🎉'; l = 'Aguarde o professor começar.'; }
  else if(j.fase==='fim'){
    if(j.tipo==='qes') t = j.venc && j.venc.id===sid ? 'Você venceu! 👑' : `Vencedor: ${esc(j.venc ? j.venc.nome : '—')}`;
    else if(j.tipo==='naval'){ const k = j.rank.findIndex(e => eq && e.id===eq.id); t = k===0 ? 'Sua equipe venceu! 🏆' : k > 0 ? `Sua equipe: ${k+1}º lugar` : `Vencedora: ${esc(j.rank[0].nome)}`; }
    else t = `${jgFmt(j.final)} pontos`;
    l = 'Obrigado por jogar!';
  }
  else if(j.fase==='tiros'){ const souCap = j.aguarda && j.capitao===sid; const ja = m && m.rk===j.rk;
    t = souCap ? (ja ? 'Tiro enviado! 🎯' : 'Capitão, fogo! 🎯') : (j.efeito ? esc(j.efeito) : 'Tiros'); l = souCap && !ja ? 'Toque numa casa do tabuleiro para atirar.' : 'Acompanhe o tabuleiro.'; }
  else if(j.fase==='revelado'){
    const minha = m && m.rk===String(j.tipo==='escada' ? j.nivel : j.r) ? m.i : null; const ok = minha===q.c;
    t = `<span class="${minha==null ? '' : ok ? 'jg-ok' : 'jg-err'}">${minha==null ? 'Sem resposta' : ok ? 'Certa! ✅' : 'Errada ❌'}</span>`;
    if(m && minha!=null && m.env!=='ok'){ t = 'Sua resposta não chegou a tempo 📶'; }
    if(j.tipo==='qes' && eu){ l = j.ult.voltaram.includes(sid) ? 'Você acertou na repescagem e voltou! 🔁' : j.ult.sairam.includes(sid) ? 'Você saiu, mas continua respondendo na torcida.' : eu.dentro ? (ok ? 'Você continua na disputa! 🎉' : 'Todos erraram: ninguém saiu.') : 'Torcida: continue treinando.'; }
    if(j.tipo==='naval' && eq){ const r = j.ult.equipes[eq.id]; l = r.resp==null ? 'Ninguém da equipe votou.' : r.ok ? 'Sua equipe acertou: ganhou um tiro! 🎯' : `Sua equipe marcou ${JG_L[r.resp]}. Sem tiro nesta rodada.`; }
    if(j.tipo==='escada') l = j.acertou ? 'A turma subiu um degrau!' : 'A turma não passou deste degrau.';
    x = `<b>Por que ${JG_L[q.c]}:</b> ${esc(q.exp||'')}`;
  }
  else if(j.tipo==='escada' && j.cfg.modo==='palco' && !j.votacao){ t = 'No palco'; l = 'Quem está no palco responde. Ajude a pensar!'; }
  else { const ja = m && m.rk===j.rk;
    t = ja ? jgEnvTxt(m) : j.votacao ? 'Vote! 🗳️' : 'Sua vez!';
    l = ja ? jgEnvLinha(m, 'Aguarde a revelação no telão.') : (eq ? 'Converse com a equipe e toque na alternativa.' : eu && !eu.dentro ? (j.repescaAgora ? 'Repescagem: acerte e volte!' : 'Torcida: responda para treinar.') : 'Toque na alternativa que você acha certa.'); }
  return `<div class="jg-al-painel jg-al-painel-${j.tipo}"><div class="jg-al-st">${st}</div><div class="jg-al-tt">${t}</div>${l ? `<div class="jg-al-ll">${l}</div>` : ''}${x ? `<div class="jg-al-xx">${x}</div>` : ''}</div>`;
}
function renderAlunoJogoTela(){
  const j = state.aluno.jogoAtivo;
  const fora = !document.fullscreenElement;
  return `<div class="jg-al-full" data-jogo-tela><div class="jg-telao-wrap jg-full">${jgTelaoHtml(j)}</div>${jgAlunoPainelHtml(j)}
    <div class="jg-al-topo">${fora ? '<button class="jg-al-bt" data-jg="al-tela-cheia">⛶ Tela cheia</button>' : ''}${j.fase==='fim' ? '<button class="jg-al-bt" data-jg="al-sair">Sair do jogo</button>' : ''}</div></div>`;
}
function jgAlunoTelaCheia(){ try{ const d = document.documentElement; if(!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(()=>{}); }catch(e){} }
async function jgJuntarNoPainel(enemStats, enemReg, profId, turmasPermitidas){
  let lista = {}; try{ const r = await window.storage.list(`jogo-res:${profId}:`, true); (r.keys||[]).forEach(k => { const v = r.values ? r.values[k] : null; if(v) lista[k] = v; }); }catch(e){ return 0; }
  let n = 0;
  Object.values(lista).forEach(v => { let o = null; try{ o = JSON.parse(v); }catch(e){} if(!o || !Array.isArray(o.itens)) return;
    if(turmasPermitidas && !turmasPermitidas.has(o.turmaId)) return;
    o.itens.forEach(it => { if(!it.enemId) return; const q = enemReg.find(x => x.id===it.enemId); if(!q) return;
      const rec = enemStats[it.enemId] = enemStats[it.enemId] || { snap: { opcoes: q.opcoes.slice(), correta: q.correta }, porTurma: {} };
      const tn = o.turmaName || '—'; const r = rec.porTurma[tn] = rec.porTurma[tn] || { n:0, ok:0, branco:0, esc:{} };
      r.n += it.n; r.ok += it.ok; Object.entries(it.esc||{}).forEach(([i, c]) => { r.esc[i] = (r.esc[i]||0) + c; }); n++; }); });
  return n;
}
async function jgAbrirDaAula(tipo, cfg){
  const av = aulaVivaState(); const p = state.professor; if(!av.sess || state.view!=='professor') return;
  const g = jgState(); if(g.current){ alert('Já há um jogo aberto. Encerre-o antes de abrir outro.'); return; }
  g.tipo = tipo; g.cfg = cfg; g.pool = await jgPool(g.cfg);
  g.cfg.temas = (g.cfg.temas||[]).filter(t => g.pool.some(q => q.tema===t));
  await jgAbrirSala(); if(!g.current) return;
  av.voltarSub = p.subview; g.daAula = true; g.apresentar = true; p.subview = 'jogos'; startJogoPoll();
  av.sess.modo = 'quiz'; try{ await aulaVivaSalvarSessao(); }catch(e){}
  render();
}
async function jgDaAulaViva(){
  const av = aulaVivaState(); if(!av.sess) return;
  const sl = av.slides[av.sess.idx]; const q = sl ? (av.d.enemOficial||[])[sl.k] : null;
  return jgAbrirDaAula('qes', Object.assign(jgCfgPadrao('qes'), { turmaId: av.sess.turmaId, fonte:'enem', disc: q ? q.disciplina : '', temas: q && q.tema ? [q.tema] : [] }));
}
function jgSugestaoTxt(jg){ return `${JG_INFO[jg.tipo].icon} ${JG_INFO[jg.tipo].nome}${jg.modo==='individual' ? ' (individual)' : ''}`; }
function jgCfgDaSugestao(jg, turmaId){ const c = jgCfgPadrao(jg.tipo); return Object.assign(c, { turmaId: turmaId || c.turmaId, fonte:'enem', disc: jg.disc||'', temas:(jg.temas||[]).slice(), mmodo: jg.modo==='individual' ? 'individual' : 'equipes' }); }
function jgPlanoBotaoGrande(plano, aula, turmaId){
  const jg = aula && aula.jogo; if(!jg || !JG_INFO[jg.tipo] || state.view!=='professor') return '';
  return `<button class="pl-acao pl-acao-jogo jg-sug" data-jg="plano-jogo" data-pid="${esc(plano.id)}" data-n="${aula.n}" data-tid="${esc(turmaId||'')}" title="${esc('Sugestão do plano: ' + jg.motivo)}"><span class="pl-acao-ic">${JG_INFO[jg.tipo].icon}</span><span>Jogo sugerido<small>${esc(JG_INFO[jg.tipo].nome)}${jg.modo==='individual' ? ' (individual)' : ''}</small></span></button>`;
}
function jgPlanoBotao(plano, aula, turmaId){
  const jg = aula && aula.jogo; if(!jg || !JG_INFO[jg.tipo] || state.view!=='professor') return '';
  return `<button class="btn btn-sm jg-sug" data-jg="plano-jogo" data-pid="${esc(plano.id)}" data-n="${aula.n}" data-tid="${esc(turmaId||'')}" title="${esc('Sugestão do plano: ' + jg.motivo + ((jg.temas||[]).length ? ' · temas: ' + jg.temas.join(', ') : ''))}">🎮 Jogo sugerido: ${esc(jgSugestaoTxt(jg))}</button>`;
}
async function jgAbrirSugestaoPlano(pid, n, tid){
  const s = planoState(); const plano = s.planos[pid]; const aula = plano && plano.aulas.find(a => a.n===n); if(!aula || !aula.jogo) return;
  const p = state.professor; const g = jgState();
  p.subview = 'jogos';
  if(g.current){ alert('Já há um jogo aberto. Encerre-o antes de abrir outro.'); startJogoPoll(); render(); return; }
  g.tipo = aula.jogo.tipo; g.cfg = jgCfgDaSugestao(aula.jogo, tid); g.tela = 'config'; g.pool = null; g.sugestao = `Sugestão do plano para a aula ${n}: ${aula.jogo.motivo}.`;
  startJogoPoll(); render();
  g.pool = await jgPool(g.cfg); g.cfg.temas = g.cfg.temas.filter(t => g.pool.some(q => q.tema===t)); render();
}
function jgAvAula(av){ const s = planoState(); if(!av || !av.sess) return null; const plano = (s.planos||{})[av.sess.planoId] || (s.planos||{})[(s.turmaPlano||{})[av.sess.turmaId]]; return plano ? plano.aulas.find(a => a.n===av.sess.n) : null; }
function jgAvSugestaoBtn(av){ if(state.view!=='professor') return ''; const a = jgAvAula(av); if(!a || !a.jogo || !JG_INFO[a.jogo.tipo]) return '';
  return `<button class="btn btn-sm" style="background:#C9A227;color:#3b1018;" data-jg="av-jogo-sugerido" title="${esc('Sugestão do plano: ' + a.jogo.motivo)}">🎮 ${esc(jgSugestaoTxt(a.jogo))}</button>`; }
function jgCfgDaAula(plano, aula, turmaId){
  const disc = normalizarTextoPlano(plano.disciplina || '').split(' ')[0];
  const lista = ((aula.exercicio && aula.exercicio.questoes) || []).filter(q => q.tipo==='mc' && (q.opcoes||[]).length>=2).map((q, i) => ({ k:`aula${aula.n}_${i}`, disc, tema:'', assunto:'', hab:'', texto:'', comando:q.texto||'', ops:q.opcoes.slice(), c:q.correta, exp:q.explicacao||'', imagem:q.imagem||null }));
  const enemAula = (aula.slides && aula.slides.enemOficial) || [];
  enemAula.forEach(q => { if(q && q.opcoes) lista.push({ k:q.id, enemId:q.id, ano:q.ano, numero:q.numero, disc:q.disciplina, tema:q.tema||'', assunto:q.assunto||'', hab:q.habilidade||'', texto:q.texto||'', comando:q.comando||'', ops:q.opcoes.slice(), c:q.correta, exp:q.explicacao||'', imagem:q.imagem||null }); });
  let temasAula = [...new Set(enemAula.map(q => q && q.tema).filter(Boolean))];
  if(temasAula.length < 2){ // completa com os temas do ENEM do mesmo capítulo
    const doCap = plano.aulas.filter(x => x.capitulo && x.capitulo===aula.capitulo).flatMap(x => (x.slides && x.slides.enemOficial) || []);
    temasAula = [...new Set(temasAula.concat(doCap.map(q => q && q.tema).filter(Boolean)))].slice(0, 4); }
  return Object.assign(jgCfgPadrao('qes'), { turmaId: turmaId || '', fonte:'aula', disc, temas: [], lista, temasAula, rotuloAula: `Perguntas da aula ${aula.n} (exercício e ENEM)`, nPerg: 12 });
}
async function jgAbrirQesDaAulaPlano(pid, n, tid){
  const s = planoState(); const plano = s.planos[pid]; const aula = plano && plano.aulas.find(a => a.n===n); if(!aula) return;
  const p = state.professor; const g = jgState(); p.subview = 'jogos';
  if(g.current){ alert('Já há um jogo aberto. Encerre-o antes de abrir outro.'); startJogoPoll(); render(); return; }
  g.tipo = 'qes'; g.cfg = jgCfgDaAula(plano, aula, tid); g.tela = 'config'; g.pool = null; g.sugestao = `Quem Erra Sai com as perguntas da aula ${n}.`;
  startJogoPoll(); render(); g.pool = await jgPool(g.cfg); render();
}
async function jgDaAulaVivaPerguntas(){ const av = aulaVivaState(); const a = jgAvAula(av); if(!a) return; const s = planoState();
  const plano = (s.planos||{})[av.sess.planoId] || (s.planos||{})[(s.turmaPlano||{})[av.sess.turmaId]];
  return jgAbrirDaAula('qes', jgCfgDaAula(plano, a, av.sess.turmaId)); }
async function jgDaAulaVivaSugerido(){ const av = aulaVivaState(); const a = jgAvAula(av); if(!a || !a.jogo) return; return jgAbrirDaAula(a.jogo.tipo, jgCfgDaSugestao(a.jogo, av.sess.turmaId)); }
async function jgVoltarAula(){
  const av = aulaVivaState(); const p = state.professor; const g = jgState(); const j = g.current;
  if(j){ try{ await aoVivoSalvar('jogo-ativo', null, j.turmaId); }catch(e){} }
  g.current = null; g.tela = 'menu'; g.apresentar = false; g.daAula = false; g.modal = null; stopJogoPoll();
  p.subview = av.voltarSub || 'planolivro';
  if(av.sess){ av.sess.modo = null; try{ await aulaVivaSalvarSessao(); }catch(e){} }
  render();
}
const JG_MIS_ESQ = [{nome:'Falcão',ico:'🦅',cor:'#e63946'},{nome:'Raposa',ico:'🦊',cor:'#f08c00'},{nome:'Lobo',ico:'🐺',cor:'#3b8cff'},{nome:'Lince',ico:'🐆',cor:'#d4a514'},{nome:'Coruja',ico:'🦉',cor:'#9775fa'},{nome:'Cobra',ico:'🐍',cor:'#2fbf71'}];
const JG_MIS_ESP = { cofre:{ico:'🔐',nome:'Cofre',txt:'Esta missão vale o triplo!'}, informante:{ico:'🕵️',nome:'Informante',txt:'Duas alternativas erradas somem para quem é da vez.'}, tempo:{ico:'⏱️',nome:'Contra o tempo',txt:'O pavio queima na metade do tempo!'}, armadilha:{ico:'💣',nome:'Armadilha',txt:'Sem pergunta: quem é da vez perde 100 pontos.'}, duplo:{ico:'🤝',nome:'Agente duplo',txt:'Quem acertar mais rápido rouba 100 pontos do líder.'} };
const JG_MIS_PAVIO = [[95.1,89.3],[92.1,89.8],[88.5,90.3],[84.9,88.2],[81.9,84.4],[79.5,82.4],[76.6,85],[74.2,89],[71.2,90.3],[68.2,88.2],[64.6,84.4],[60.7,82.4]];
const JG_MIS_ROWS = [17.1, 27.5, 37.8, 48.2, 58.8];
function jgMisLista(j){ return j.cfg.mmodo==='individual' ? (j.agentes||[]) : (j.equipes||[]); }
function jgMisVezId(j){ return j.ordem && j.ordem.length ? j.ordem[((j.vez % j.ordem.length) + j.ordem.length) % j.ordem.length] : null; }
function jgMisVez(j){ const id = jgMisVezId(j); return jgMisLista(j).find(x => x.id===id) || null; }
function jgMisEquipeDe(j, sid){ return (j.equipes||[]).find(e => e.membros.some(m => m.id===sid)) || null; }
function jgMisDaVez(j, sid){ const id = jgMisVezId(j); if(!id || j.final) return false; return j.cfg.mmodo==='individual' ? id===sid : !!(jgMisEquipeDe(j, sid) && jgMisEquipeDe(j, sid).id===id); }
function jgMisBrasao(e){ return `<span class="jg-mis-brasao" style="--c:${e.cor}" title="${esc(e.nome)}">${e.ico}</span>`; }
async function jgMisComecar(j){
  const g = jgState();
  if(Object.keys(g.presenca).length < 2){ alert('Espere pelo menos 2 alunos entrarem pelo tablet.'); return; }
  j.fase = 'msg'; j.msgAt = Date.now(); j.rk = ''; await jgSalvar(j); render();
}
async function jgMisAceitar(){
  const g = jgState(), j = g.current; if(!j || j.fase!=='msg') return;
  const pres = Object.entries(g.presenca).map(([id, a]) => ({ id, nome:a.nome, emoji:a.emoji, cor:a.cor }));
  if(j.cfg.mmodo==='individual'){ j.agentes = pres.map(a => Object.assign(a, { pts:0, cumpridas:0 })); j.ordem = jgEmb(j.agentes.map(a => a.id)); }
  else { const n = Math.max(2, Math.min(6, j.cfg.equipes, pres.length));
    j.equipes = JG_MIS_ESQ.slice(0, n).map((e, i) => Object.assign({ id:'e'+i, membros:[], pts:0, cumpridas:0 }, e));
    jgEmb(pres).forEach((a, i) => j.equipes[i % n].membros.push(a)); j.ordem = j.equipes.map(e => e.id); }
  const esp = jgEmb(['cofre','cofre','informante','informante','tempo','tempo','armadilha','duplo'].concat(Array(12).fill(null)));
  let k = 0; j.envs = esp.map((e, i) => ({ n:i+1, esp:e, aberto:false, por:[], pct:null, qi: e==='armadilha' ? null : k++ }));
  j.qFinal = Math.min(k, j.perguntas.length - 1); j.vez = 0; j.rodada = 0;
  await jgMisIrMapa(j);
}
async function jgMisIrMapa(j){
  const g = jgState();
  j.fase = 'mapa'; j.atual = null; j.ult = null; j.esp = null; j.fora = []; j.final = false; j.inicio = null; j.rodada = (j.rodada||0) + 1;
  if(!j.envs.some(e => !e.aberto)){ return jgMisFinal(j); }
  const vez = jgMisVez(j);
  if(j.cfg.mmodo==='individual') j.capitao = vez ? vez.id : null;
  else { const pres = vez.membros.filter(m => g.presenca[m.id]); const lista = pres.length ? pres : vez.membros; const cap = lista[(j.rodada) % lista.length]; j.capitao = cap ? cap.id : null; }
  j.rk = `m${j.rodada}`; g.resp = {}; await jgSalvar(j); render();
}
async function jgMisEscolher(n){
  const g = jgState(), j = g.current; if(!j || j.fase!=='mapa') return;
  const e = j.envs.find(x => x.n===n); if(!e || e.aberto) return;
  e.aberto = true; j.atual = n; j.fase = 'abrindo'; j.abrindoAt = Date.now(); j.rk = ''; await jgSalvar(j); render();
}
async function jgMisAbrir(j){
  const e = j.envs.find(x => x.n===j.atual); const g = jgState();
  if(e.esp==='armadilha'){ const v = jgMisVez(j); if(v) v.pts = Math.max(0, v.pts - 100); j.fase = 'armadilha'; await jgSalvar(j); render(); return; }
  const q = j.perguntas[e.qi];
  j.r = e.qi; j.esp = e.esp; j.fase = 'pergunta'; j.T = Math.max(10, Math.round(j.cfg.T * (e.esp==='tempo' ? .5 : 1))); j.inicio = Date.now();
  j.fora = e.esp==='informante' ? jgEmb(q.ops.map((_, i) => i).filter(i => i!==q.c)).slice(0, 2) : [];
  j.rk = `q${e.n}`; j.ult = null; g.resp = {}; g.modal = null; await jgSalvar(j); render();
}
async function jgMisFinal(j){
  const g = jgState();
  j.final = true; j.atual = null; j.r = j.qFinal; j.esp = 'cofre'; j.fase = 'pergunta'; j.T = j.cfg.T; j.inicio = Date.now(); j.fora = []; j.rk = 'final'; j.ult = null; g.resp = {};
  await jgSalvar(j); render();
}
async function jgMisAuto(j){
  const g = jgState(); let mudou = false;
  if(j.fase!=='sala' && j.fase!=='msg'){
    Object.entries(g.presenca).forEach(([sid, a]) => {
      if(j.cfg.mmodo==='individual'){ if(j.agentes && !j.agentes.some(x => x.id===sid)){ j.agentes.push({ id:sid, nome:a.nome, emoji:a.emoji, cor:a.cor, pts:0, cumpridas:0 }); j.ordem.push(sid); mudou = true; } }
      else if(j.equipes && !jgMisEquipeDe(j, sid)){ const e = j.equipes.slice().sort((x, y) => x.membros.length - y.membros.length)[0]; e.membros.push({ id:sid, nome:a.nome, emoji:a.emoji, cor:a.cor }); mudou = true; }
    });
    if(mudou) await jgSalvar(j);
  }
  if(j.fase==='mapa' && j.capitao){ const r = g.resp[j.capitao]; if(r && r.n){ await jgMisEscolher(+r.n); return true; } }
  if(j.fase==='abrindo' && Date.now() - (j.abrindoAt||0) > (j.envs.find(x => x.n===j.atual).esp ? 2400 : 1000)){ await jgMisAbrir(j); return true; }
  return mudou;
}
function jgMisRevelar(j, q, votos){
  const g = jgState(); const mult = j.final ? 3 : (j.esp==='cofre' ? 3 : 1); const vez = j.final ? null : jgMisVezId(j);
  const tempo = sid => ((g.resp[sid] && g.resp[sid].at) || 9e15) - j.inicio;
  const ganhou = []; let rapido = null, tRap = 9e15;
  if(j.cfg.mmodo==='individual'){
    j.agentes.forEach(a => { a.ganho = 0; if(votos[a.id]===q.c){ const t = tempo(a.id); const p = Math.round(100 * mult * (a.id===vez ? 2 : 1) + 50 * Math.max(0, 1 - t / (j.T*1000))); a.pts += p; a.cumpridas++; a.ganho = p; ganhou.push(a.id); if(t < tRap){ tRap = t; rapido = a; } } });
  } else {
    j.equipes.forEach(e => { const vs = e.membros.filter(m => votos[m.id]!=null).sort((a, b) => tempo(a.id) - tempo(b.id));
      const cont = q.ops.map(() => 0); vs.forEach(m => cont[votos[m.id]]++); const mx = Math.max(0, ...cont);
      e.resp = mx ? votos[vs.find(m => cont[votos[m.id]]===mx).id] : null; e.nv = vs.length; e.cont = cont; e.ganho = 0;
      const ts = vs.map(m => tempo(m.id)); const t = ts.length ? ts[Math.floor(ts.length/2)] : 9e15;
      if(e.resp===q.c){ const p = 100 * mult * (e.id===vez ? 2 : 1); e.pts += p; e.cumpridas++; e.ganho = p; ganhou.push(e.id); if(t < tRap){ tRap = t; rapido = e; } } });
  }
  let roubo = null;
  if(j.esp==='duplo' && rapido){ const lider = jgMisLista(j).slice().sort((a, b) => b.pts - a.pts)[0];
    if(lider && lider.id!==rapido.id && lider.pts > 0){ const v = Math.min(100, lider.pts); lider.pts -= v; rapido.pts += v; roubo = { de:lider.nome, para:rapido.nome, v }; } }
  const n = Object.keys(votos).length; const pct = n ? Math.round(Object.values(votos).filter(i => i===q.c).length / n * 100) : 0;
  j.restRev = jgRestante(j);
  j.ult = { ganhou, roubo, pct, votos, festa: ganhou.length > 0 };
  if(!j.final && j.atual){ const e = j.envs.find(x => x.n===j.atual); e.por = ganhou; e.pct = pct; }
}
async function jgMisProxima(j){
  if(j.fase==='armadilha'){ j.vez++; return jgMisIrMapa(j); }
  if(j.final){ j.rank = jgMisLista(j).slice().sort((a, b) => b.pts - a.pts || b.cumpridas - a.cumpridas).map(x => ({ id:x.id, nome:x.nome, ico:x.ico||'', cor:x.cor||'', pts:x.pts, cumpridas:x.cumpridas })); return jgFim(j, 'Missão cumprida!'); }
  j.vez++; return jgMisIrMapa(j);
}
function jgMisFichas(j){
  const itens = [], v = j.rank && j.rank[0];
  if(j.cfg.mmodo==='individual') (j.agentes||[]).forEach(a => itens.push({ studentId:a.id, amount: v && a.id===v.id ? 6 : 1, motivo: v && a.id===v.id ? 'Melhor agente no ENEM Missão Possível' : 'Jogou ENEM Missão Possível', categoria:'jogo' }));
  else (j.equipes||[]).forEach(e => e.membros.forEach(m => itens.push({ studentId:m.id, amount: v && e.id===v.id ? 4 : 1, motivo: v && e.id===v.id ? 'Esquadrão vencedor no ENEM Missão Possível' : 'Jogou ENEM Missão Possível', categoria:'jogo' })));
  return itens;
}
function jgMisPavioSvg(f){
  const pts = JG_MIS_PAVIO.map(([x, y]) => [x * 16, y * 9]); let tot = 0; const seg = [];
  for(let i = 1; i < pts.length; i++){ const d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); seg.push(d); tot += d; }
  const alvo = tot * (1 - Math.max(0, Math.min(1, f))); let acc = 0, sx = pts[0][0], sy = pts[0][1]; const q = [pts[0]];
  for(let i = 0; i < seg.length; i++){ if(acc + seg[i] >= alvo){ const r = (alvo - acc) / seg[i]; sx = pts[i][0] + (pts[i+1][0]-pts[i][0])*r; sy = pts[i][1] + (pts[i+1][1]-pts[i][1])*r; break; } acc += seg[i]; q.push(pts[i+1]); sx = pts[i+1][0]; sy = pts[i+1][1]; }
  q.push([sx, sy]);
  return `<svg class="jg-abs jg-mis-pavio" viewBox="0 0 1600 900" aria-hidden="true"><polyline points="${q.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#1a1410" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>${f > 0 ? `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="16" fill="#ffd166" opacity=".9"><animate attributeName="r" values="12;22;12" dur=".35s" repeatCount="indefinite"/></circle><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="30" fill="#ff7b00" opacity=".35"><animate attributeName="r" values="24;38;24" dur=".5s" repeatCount="indefinite"/></circle>` : ''}</svg>`;
}
function jgMisBombaTxt(r){ return '00:' + String(Math.ceil(r)).padStart(2, '0'); }
function jgMisMsgTxt(j){ const n = Math.min(JG_MIS_MSG.length, Math.floor((Date.now() - (j.msgAt||0)) / 30) * 3); return n; }
function jgMisMonitor(j){
  const lista = jgMisLista(j); const vezId = ['mapa','abrindo','armadilha'].includes(j.fase) ? jgMisVezId(j) : null;
  const abertos = j.envs.filter(e => e.aberto).length; const trilha = x => `<span class="jg-mis-trilha">${Array.from({length:20}, (_, i) => `<i class="${i < x.cumpridas ? 'ok' : ''}"></i>`).join('')}</span>`;
  if(j.cfg.mmodo!=='individual') return `<div class="jg-abs jg-mis-monitor"><h3>PAINEL DE ANDAMENTO <small>${abertos}/20 ENVELOPES</small></h3>${lista.slice().sort((a, b) => b.pts - a.pts).map(e => `<div class="jg-mis-linha ${e.id===vezId ? 'vez' : ''}" style="--c:${e.cor}">${jgMisBrasao(e)}<span>${esc(e.nome)}</span>${trilha(e)}<span class="jg-mis-pts">${e.pts}</span></div>`).join('')}</div>`;
  const top = lista.slice().sort((a, b) => b.pts - a.pts);
  return `<div class="jg-abs jg-mis-monitor"><h3>AGENTES EM DESTAQUE <small>${abertos}/20 ENVELOPES</small></h3>${top.slice(0, 5).map((a, k) => `<div class="jg-mis-linha ${a.id===vezId ? 'vez' : ''}" style="--c:#e63946"><span class="jg-mis-pts" style="text-align:center">${k+1}º</span><span>${esc(a.nome)}</span>${trilha(a)}<span class="jg-mis-pts">${a.pts}</span></div>`).join('')}</div>`;
}
function jgMisGrade(j){
  const aluno = jgEhAluno(); const sid = aluno ? state.aluno.matriculaStudentId : null;
  const mira = j.fase==='mapa' && (aluno ? j.capitao===sid && !jgMinha(j) : true);
  return `<div class="jg-abs jg-mis-grade ${mira ? 'mira' : ''}">${j.envs.map(e => { const at = j.atual===e.n && j.fase!=='mapa';
    let selos = '';
    if(e.aberto && e.esp!=='armadilha'){ if(j.cfg.mmodo!=='individual') selos = `<span class="jg-mis-selos">${e.por.map(id => { const x = j.equipes.find(y => y.id===id); return x ? jgMisBrasao(x) : ''; }).join('')}</span>`; else if(e.pct!=null) selos = `<span class="jg-mis-pct">${e.pct}%</span>`; }
    const attr = mira && !e.aberto ? `data-jg="${aluno ? 'al-env' : 'mis-env'}" data-n="${e.n}"` : 'tabindex="-1"';
    return `<button class="jg-mis-env ${e.aberto ? 'aberto' : 'fechado'} ${at ? 'atual' : ''}" ${attr} aria-label="Envelope ${e.n}">${e.aberto ? '' : `<span class="jg-mis-num">${e.n}</span>`}${selos}${e.aberto && e.esp ? `<span class="jg-mis-esp">${JG_MIS_ESP[e.esp].ico}</span>` : ''}</button>`; }).join('')}</div>`;
}
function jgMisFundo(j){ return jgArtVar('missao', j.fase==='sala' ? 'abre' : j.fase==='msg' ? 'msg' : j.fase==='fim' ? 'fim' : ['mapa','abrindo','armadilha'].includes(j.fase) ? 'jogo' : 'missao'); }
function jgTelaoMissao(j){
  const g = jgState(); const aluno = jgEhAluno();
  if(j.fase==='sala') return aluno ? `<div class="jg-abs jg-sala jg-sala-missao"><div class="jg-sala-t">Você entrou! 🕶️</div><div class="jg-sala-s">A mensagem confidencial já vai chegar.</div></div>` : jgSalaHtml(j, 'jg-sala-missao');
  if(j.fase==='msg'){ const n = jgMisMsgTxt(j);
    return `<div class="jg-abs jg-mis-msg" data-jg-msg>${esc(JG_MIS_MSG.slice(0, n))}<span class="jg-mis-cursor"></span></div>${aluno ? '' : `<button class="jg-abs jg-mis-aceitar" data-jg="mis-aceitar" aria-label="Aceitar a missão"></button>`}`; }
  if(j.fase==='fim'){ const v = j.rank[0] || {};
    return `<div class="jg-abs jg-mis-fim-nome">${v.ico ? jgMisBrasao(v) + ' ' : ''}${esc(v.nome||'—')}</div><div class="jg-abs jg-mis-fim-pts">${String(v.pts||0).padStart(3, '0')}</div><div class="jg-abs jg-mis-ranking">${j.rank.slice(0, 6).map((e, k) => `<span>${k+1}º ${e.ico ? jgMisBrasao(e) : ''} ${esc(e.nome)} · ${e.pts}</span>`).join('')}</div>`; }
  if(['mapa','abrindo','armadilha'].includes(j.fase)){
    const v = jgMisVez(j); const cap = j.cfg.mmodo==='individual' ? v : (v && v.membros.find(m => m.id===j.capitao));
    let h = jgMisMonitor(j) + jgMisGrade(j);
    if(j.fase==='mapa'){ const souCap = aluno && j.capitao===state.aluno.matriculaStudentId;
      h += `<div class="jg-abs jg-mis-vez">${j.cfg.mmodo==='individual' ? `🕵️ Vez do agente ${esc(v ? v.nome : '')}` : `${v.ico} Vez do Esquadrão ${esc(v.nome)}`}<small>${souCap ? 'Você escolhe: toque num envelope' : aluno ? 'Escolhendo o envelope…' : `${j.cfg.mmodo==='individual' ? '' : 'Capitão: ' + esc(cap ? cap.nome : '—') + ' · '}escolhe no tablet (ou o professor clica no mapa)`}</small></div>`; }
    if(j.fase==='abrindo'){ const e = j.envs.find(x => x.n===j.atual); h += e.esp ? `<div class="jg-abs jg-mis-efeito">${JG_MIS_ESP[e.esp].ico} ${JG_MIS_ESP[e.esp].nome}!<small>${JG_MIS_ESP[e.esp].txt}</small></div>` : `<div class="jg-abs jg-mis-efeito">✉️ Envelope ${e.n}<small>Abrindo a missão…</small></div>`; }
    if(j.fase==='armadilha') h += `<div class="jg-abs jg-mis-efeito">💣 Armadilha!<small>${j.cfg.mmodo==='individual' ? '' : 'Esquadrão '}${esc(v ? v.nome : '')} perde 100 pontos.</small></div>`;
    return h;
  }
  // missão (pergunta / revelado)
  const q = jgPergunta(j), rev = j.fase==='revelado'; const v = jgMisVez(j);
  const sid = aluno ? state.aluno.matriculaStudentId : null; const daVez = aluno && jgMisDaVez(j, sid);
  const etiqueta = j.final ? 'MISSÃO FINAL · VALE O TRIPLO' : `MISSÃO ${j.atual}${j.esp ? ' · ' + JG_MIS_ESP[j.esp].ico + ' ' + JG_MIS_ESP[j.esp].nome.toUpperCase() : ''} · ${v ? (v.ico ? v.ico + ' ' : '') + esc(v.nome) : ''} NA VEZ`;
  let h = `<div class="jg-abs jg-mis-painel"><span class="jg-mis-tag">${etiqueta}</span>${q.texto ? `<div class="jg-mis-txt" data-jg-fit="1.15">${esc(q.texto.split('\n\n')[0])}</div>` : ''}<div class="jg-mis-cmd" data-jg-fit="1.6">${esc(q.comando)}</div>${q.texto || q.imagem || q.temImg ? `<button class="jg-mis-btxt" data-jg="texto">📄 Ver texto completo · ${esc(jgFonteQ(q))}</button>` : ''}</div>`;
  const mm = aluno ? jgMinha(j) : null;
  h += q.ops.map((o, i) => { if(i > 4) return '';
    const eqs = rev && j.cfg.mmodo!=='individual' ? j.equipes.filter(e => e.resp===i) : [];
    const foraAqui = daVez && (j.fora||[]).includes(i) && !rev;
    const attr = aluno && !foraAqui && jgAlunoPodeResponder(j) ? ` data-jg="al-resp" data-i="${i}" role="button" tabindex="0"` : '';
    return `<div class="jg-abs jg-mis-op ${rev && i===q.c ? 'certa' : ''} ${rev && i!==q.c ? 'apagada' : ''} ${foraAqui ? 'fora' : ''}" style="top:${JG_MIS_ROWS[i]}%"${attr}${mm && mm.i===i ? ' data-sel="1"' : ''}><span class="jg-mis-l">${JG_L[i]}</span><span class="jg-mis-t" data-jg-fit="1.2" style="${eqs.length ? `padding-right:${4 + eqs.length*1.9}cqw` : ''}">${esc(o)}</span>${eqs.length ? `<span class="jg-mis-bdg">${eqs.map(jgMisBrasao).join('')}</span>` : ''}</div>`; }).join('');
  const r = rev ? (j.ult && j.ult.ganhou.length ? (j.restRev||0) : 0) : jgRestante(j);
  h += jgMisPavioSvg(j.T ? r / j.T : 0) + `<div class="jg-abs jg-mis-bomba ${!rev && r <= 5 ? 'urg' : ''}" data-jg-bomba>${jgMisBombaTxt(r)}</div>`;
  if(rev){ const gn = j.ult.ganhou;
    const nomes = j.cfg.mmodo!=='individual' ? gn.map(id => { const e = j.equipes.find(x => x.id===id); return e ? e.ico + ' ' + e.nome : ''; }) : [];
    h += gn.length ? `<div class="jg-abs jg-mis-faixa">✅ Missão cumprida${j.cfg.mmodo!=='individual' ? ' por ' + esc(nomes.join(', ')) : ` por ${gn.length} agente(s) · ${j.ult.pct}%`}${j.ult.roubo ? `<small>🤝 ${esc(j.ult.roubo.para)} roubou ${j.ult.roubo.v} de ${esc(j.ult.roubo.de)}</small>` : ''}</div>`
      : `<div class="jg-abs jg-mis-faixa falhou">💥 Missão fracassada · a certa era ${JG_L[q.c]}</div><div class="jg-abs jg-mis-explosao">💥</div>`; }
  return h;
}
function jgMisTick(j){
  const b = document.querySelector('[data-jg-bomba]'); if(b && j.fase==='pergunta' && j.inicio){ const r = jgRestante(j); b.textContent = jgMisBombaTxt(r); b.classList.toggle('urg', r <= 5);
    const p = document.querySelector('.jg-mis-pavio'); if(p) p.outerHTML = jgMisPavioSvg(r / j.T); }
}
function jgMisPainelAluno(j){
  const al = state.aluno, sid = al.matriculaStudentId; const eq = jgMisEquipeDe(j, sid); const ag = (j.agentes||[]).find(a => a.id===sid);
  const m = al.jogoMinha && al.jogoMinha.jogoId===j.id ? al.jogoMinha : null; const q = j.perguntas[j.r];
  const st = eq ? `${eq.ico} Esquadrão ${esc(eq.nome)} · ${eq.pts} pts` : ag ? `🕵️ Agente ${esc(al.name||'')} · ${ag.pts} pts` : `🕵️ Agente ${esc(al.name||'')}`;
  let t = '', l = '', x = '';
  if(j.fase==='sala'){ t = 'Você entrou! 🕶️'; l = 'Aguarde a mensagem confidencial.'; }
  else if(j.fase==='msg'){ t = '📩 Mensagem confidencial'; l = 'Leia a mensagem na tela.'; }
  else if(j.fase==='mapa'){ const souCap = j.capitao===sid; const ja = m && m.rk===j.rk; const v = jgMisVez(j);
    t = souCap ? (ja ? 'Envelope escolhido!' : 'Você escolhe! ✉️') : (j.cfg.mmodo==='individual' ? `Vez de ${esc(v ? v.nome : '')}` : `Vez do ${v.ico} ${esc(v.nome)}`); l = souCap && !ja ? 'Toque num envelope do mapa.' : 'Acompanhe o mapa.'; }
  else if(j.fase==='abrindo'){ const e = j.envs.find(y => y.n===j.atual); t = `✉️ Envelope ${e.n}`; l = e.esp ? JG_MIS_ESP[e.esp].ico + ' ' + JG_MIS_ESP[e.esp].txt : 'Abrindo a missão…'; }
  else if(j.fase==='armadilha'){ t = '💣 Armadilha!'; l = 'Sem pergunta nesta rodada.'; }
  else if(j.fase==='pergunta'){ const ja = m && m.rk===j.rk; const dv = jgMisDaVez(j, sid);
    t = ja ? jgEnvTxt(m) : j.final ? 'Missão final! 🔐' : 'Sua missão!'; l = ja ? jgEnvLinha(m, 'Aguarde a revelação.') : (eq ? 'Converse com o esquadrão e toque na alternativa.' : 'Toque na alternativa certa.') + (dv && j.esp==='informante' ? ' 🕵️ O informante tirou duas erradas para você.' : ''); }
  else if(j.fase==='revelado'){ const minha = m && m.rk===j.rk ? m.i : null; const ok = minha===q.c;
    t = `<span class="${minha==null ? '' : ok ? 'jg-ok' : 'jg-err'}">${minha==null ? 'Sem resposta' : ok ? 'Certa! ✅' : 'Errada ❌'}</span>`;
    if(m && minha!=null && m.env && m.env!=='ok'){ t = 'Sua resposta não chegou a tempo 📶'; }
    l = eq ? (eq.resp===q.c ? `Seu esquadrão cumpriu a missão: +${eq.ganho}! O envelope ganhou o brasão ${eq.ico}.` : eq.resp==null ? 'Ninguém do esquadrão votou.' : `Seu esquadrão marcou ${JG_L[eq.resp]}.`) : ag ? (ag.ganho ? `+${ag.ganho} pontos!` : 'Sem pontos nesta missão.') : '';
    x = `<b>Por que ${JG_L[q.c]}:</b> ${esc(q.exp||'')}`; }
  else if(j.fase==='fim'){ const k = j.rank.findIndex(y => eq ? y.id===eq.id : y.id===sid); t = k===0 ? 'Missão cumprida! 🏆' : k > 0 ? `${k+1}º lugar` : 'Fim de jogo'; l = 'Obrigado, agente!'; }
  return `<div class="jg-al-painel jg-al-painel-missao"><div class="jg-al-st">${st}</div><div class="jg-al-tt">${t}</div>${l ? `<div class="jg-al-ll">${l}</div>` : ''}${x ? `<div class="jg-al-xx">${x}</div>` : ''}</div>`;
}
async function jgAlunoEnvelope(n){
  const al = state.aluno, j = al.jogoAtivo; if(!j || j.fase!=='mapa' || j.capitao!==al.matriculaStudentId) return;
  const m = al.jogoMinha; if(m && m.jogoId===j.id && m.rk===j.rk) return;
  al.jogoMinha = { jogoId:j.id, rk:j.rk, n };
  await jgEnviar(jgPrefResp(j, j.rk) + al.matriculaStudentId, { n, at: Date.now() }, al.jogoMinha);
}
function jgSomLigado(){ let v = null; try{ v = localStorage.getItem('jg-som'); }catch(e){} return v !== '0'; }
function jgSomVol(){ let v = null; try{ v = localStorage.getItem('jg-som-vol'); }catch(e){} const n = parseFloat(v); return isNaN(n) ? 0.75 : Math.max(0, Math.min(1, n)); }
function jgSomAplicar(){ JGM.volume(jgSomVol()); JGM.mudo(!jgSomLigado()); }
function jgSomSetLigado(v){ try{ localStorage.setItem('jg-som', v ? '1' : '0'); }catch(e){} jgSomAplicar(); if(v) JGM.desbloquear(); render(); }
function jgSomSetVol(v){ try{ localStorage.setItem('jg-som-vol', String(v)); }catch(e){} JGM.volume(v); }
function jgSomControlesHtml(){
  const on = jgSomLigado();
  return `<span class="jg-som"><button class="btn btn-ghost" data-jg="som" title="Música e efeitos no aparelho do professor">${on ? '🔊 Música' : '🔇 Música'}</button>${on ? `<input type="range" min="0" max="100" value="${Math.round(jgSomVol() * 100)}" data-jg-vol aria-label="Volume da música">` : ''}</span>`;
}
__parteOk('jogos');
