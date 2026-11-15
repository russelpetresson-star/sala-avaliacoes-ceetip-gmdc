/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "inclusao_grupo" */
const APOIO_ITENS = [['ouvir','🔊 Leitura em voz alta das questões'], ['fonteGrande','🔠 Letra maior'], ['tempoExtra','⏱️ Tempo extra (+50% na prova com horário; +2 dias nos exercícios)'], ['versaoApoio','🧩 Recebe a versão de apoio dos exercícios']];
function apoioResumo(s){ const a = s.apoio || {}; const ic = { ouvir:'🔊', fonteGrande:'🔠', tempoExtra:'⏱️', versaoApoio:'🧩' }; return Object.keys(ic).filter(k => a[k]).map(k => ic[k]).join(''); }
function apoioPainelHtml(t, s){
  const a = s.apoio || {};
  return `<div data-apoio-painel="${esc(s.id)}" style="margin:6px 0 10px 28px; background:#f4f8fc; border-radius:8px; padding:8px 10px; font-size:.86rem;">
    <strong>♿ Apoio para ${esc(s.name)}</strong> <span class="muted">(para alunos com laudo, acompanhamento do AEE ou dificuldade de leitura)</span>
    ${APOIO_ITENS.map(([k, txt]) => `<label style="display:block; text-transform:none; font-weight:400; cursor:pointer; margin-top:4px;"><input type="checkbox" data-action="apoio-marcar" data-tid="${esc(t.id)}" data-sid="${esc(s.id)}" data-k="${k}" ${a[k]?'checked':''} style="width:auto;"> ${txt}</label>`).join('')}
  </div>`;
}
async function apoioMarcar(turmaId, sid, k, v){
  const t = (state.professor.turmas||[]).find(x => x.id===turmaId); if(!t) return;
  const s = (t.students||[]).find(x => x.id===sid); if(!s) return;
  s.apoio = Object.assign({}, s.apoio||{}, { [k]: !!v });
  Object.keys(s.apoio).forEach(x => { if(!s.apoio[x]) delete s.apoio[x]; });
  if(!Object.keys(s.apoio).length) delete s.apoio;
  render();
  await saveTurmasToStorage();
}
function ouvirTexto(txt){
  try{
    if(!('speechSynthesis' in window)){ alert('Este aparelho não tem leitura em voz alta.'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(txt||'').replace(/\s+/g, ' '));
    u.lang = 'pt-BR'; u.rate = 0.95;
    const voz = window.speechSynthesis.getVoices().find(v => /pt[-_]BR/i.test(v.lang));
    if(voz) u.voice = voz;
    window.speechSynthesis.speak(u);
  }catch(e){}
}
function ouvirQuestaoTexto(q){
  const L = ['A','B','C','D','E'];
  const ops = (q.options||[]).map((o, i) => `Alternativa ${L[i]}: ${o.text}.`).join(' ');
  return `${q.text||''}. ${q.comando||''} ${ops}`;
}
function ouvirBotao(qid){ return `<button type="button" class="btn btn-ghost btn-sm" data-action="ouvir-questao" data-qid="${esc(qid)}" style="float:right; padding:2px 8px;" title="Ouvir a questão">🔊 Ouvir</button>`; }
function apoioFimEstendido(a){
  if(!a || !a.endAt || state.view!=='aluno' || !alunoApoio().tempoExtra) return null;
  const fim = new Date(a.endAt).getTime();
  if(a.startAt){ const ini = new Date(a.startAt).getTime(); return fim + Math.max(0, fim - ini) * 0.5; }
  return fim + 2 * 86400000;
}
function planoQuestoesApoio(questoes){
  return questoes.map(q => {
    if(q.type!=='mc' || (q.options||[]).length <= 3) return Object.assign({}, q, { id: cryptoId() });
    const certa = q.options.find(o => o.id===q.correctOptionId);
    const erradas = q.options.filter(o => o.id!==q.correctOptionId);
    let h = 0; for(const ch of q.text) h = (h*31 + ch.charCodeAt(0)) | 0;
    const duas = [erradas[Math.abs(h) % erradas.length], erradas[(Math.abs(h) + 1) % erradas.length]];
    const ops = [certa, ...duas].map(o => ({ id: cryptoId(), text: o.text }));
    const ordem = Math.abs(h) % 3; const arr = ops.slice(1); arr.splice(ordem, 0, ops[0]);
    return Object.assign({}, q, { id: cryptoId(), options: arr, correctOptionId: ops[0].id, apoio: true });
  });
}
function planoApoioSel(turmaId){
  const s = planoState(); s.apoioSel = s.apoioSel || {};
  if(!s.apoioSel[turmaId]){
    const t = (state.professor.turmas||[]).find(x => x.id===turmaId);
    s.apoioSel[turmaId] = ((t && t.students) || []).filter(st => st.apoio && st.apoio.versaoApoio).map(st => st.id);
  }
  return s.apoioSel[turmaId];
}
async function planoSugerirApoio(turmaId){
  const s = planoState(); const prog = s.prog[turmaId] || { exercicios:{} };
  const t = (state.professor.turmas||[]).find(x => x.id===turmaId); if(!t) return;
  const soma = {}, cont = {};
  await Promise.all(Object.values(prog.exercicios||{}).map(async code => {
    const a = planoAvaliacaoPorCodigo(code) || await planoLerJson(`assessment:${code}`, null); if(!a) return;
    const max = (a.questions||[]).reduce((x, q) => x + (q.points||0), 0) || 10;
    (await planoLerJson(`responses:${code}`, [])).forEach(r => { const k = nomeChave(r.studentName); soma[k] = (soma[k]||0) + (r.total||0)/max; cont[k] = (cont[k]||0) + 1; });
  }));
  const sel = new Set(planoApoioSel(turmaId));
  t.students.forEach(st => { const k = nomeChave(st.name); if(cont[k] >= 2 && soma[k]/cont[k] < 0.5) sel.add(st.id); });
  s.apoioSel[turmaId] = [...sel]; s.apoioAberto = true; render();
}
function planoApoioHtml(turmaId, aula){
  const s = planoState(); const sel = planoApoioSel(turmaId);
  const t = (state.professor.turmas||[]).find(x => x.id===turmaId);
  const alunos = ((t && t.students) || []).slice().sort((a,b) => a.name.localeCompare(b.name, 'pt-BR'));
  return `<div data-apoio-sel style="font-size:.85rem; margin-top:6px;">🧩 <strong>Versão de apoio</strong> (mesmas questões, com 3 alternativas): ${sel.length} aluno(s)
    <button class="btn btn-ghost btn-sm" data-action="apoio-sel-abrir">${s.apoioAberto ? 'fechar' : '✏️ escolher'}</button>
    ${s.apoioAberto ? `<div style="margin-top:6px; max-height:200px; overflow:auto; border:1px solid #eee; border-radius:8px; padding:6px 8px;">
      <button class="btn btn-ghost btn-sm" data-action="apoio-sugerir" data-tid="${esc(turmaId)}">💡 Sugerir pelos resultados (média abaixo de 50%)</button>
      ${alunos.map(st => `<label style="display:block; text-transform:none; font-weight:400; cursor:pointer;"><input type="checkbox" data-action="apoio-sel" data-tid="${esc(turmaId)}" data-sid="${esc(st.id)}" ${sel.includes(st.id)?'checked':''} style="width:auto;"> ${esc(st.name)} ${apoioResumo(st)}</label>`).join('')}
    </div>` : ''}
    ${aula.exercicio && aula.exercicio.desafio ? '<span class="muted"> · ⭐ desafio extra liberado para quem acertar 80% ou mais</span>' : ''}</div>`;
}
function planoCodigoDoAluno(prog, n, sid){
  const ap = prog && prog.apoio && prog.apoio[n];
  if(ap && sid && (ap.alunos||[]).includes(sid)) return ap.code;
  return prog && prog.exercicios && prog.exercicios[n];
}
function planoCodigosDaAula(prog, n){ return [prog && prog.exercicios && prog.exercicios[n], prog && prog.apoio && prog.apoio[n] && prog.apoio[n].code].filter(Boolean); }
async function planoRespostasDaAula(prog, n){
  const listas = await Promise.all(planoCodigosDaAula(prog, n).map(c => planoLerJson(`responses:${c}`, [])));
  return [].concat(...listas);
}
function desafioVisivel(a, realizadas){
  if(!a || !a.origemPlano || !a.origemPlano.desafio) return true;
  return (realizadas||[]).some(r => r.assessment.origemPlano && !r.assessment.origemPlano.desafio && r.assessment.origemPlano.aula===a.origemPlano.aula
    && r.assessment.origemPlano.planoId===a.origemPlano.planoId && (() => { const obj = (r.assessment.questions||[]).filter(q => q.type==='mc' && !q.annulled); const ans = r.response.answers || {}; const max = obj.reduce((x, q) => x + (q.points||0), 0); const obt = obj.filter(q => ans[q.id]===q.correctOptionId).reduce((x, q) => x + (q.points||0), 0); return max>0 && obt/max >= 0.8; })());
}
const DIA_MS = 86400000;
async function revisaoAdicionarErros(a, result){
  const al = state.aluno;
  if(!a || !a.origemPlano || a.origemPlano.desafio || a.origemPlano.diagnostica || a.origemPlano.recuperacao || !al.turma || !al.matriculaStudentId) return;
  const novos = [];
  (a.questions||[]).forEach(q => {
    if(q.type!=='mc' || q.annulled) return;
    if(result.answers && result.answers[q.id]===q.correctOptionId) return;
    const correta = (q.options||[]).findIndex(o => o.id===q.correctOptionId);
    if(correta<0) return;
    novos.push({ id: a.code + ':' + q.id, texto: q.text, comando: q.comando||'', opcoes: q.options.map(o => o.text), correta, explicacao: q.explicacao||'', origem: a.title, prox: Date.now() + 7*DIA_MS, etapa: 1 });
  });
  if(!novos.length) return;
  try{
    await window.storage.update(revisaoChave(al.turma.id, al.matriculaStudentId), raw => {
      let f; try{ f = raw ? JSON.parse(raw) : null; }catch(e){ f = null; }
      f = f || { itens: [], feitos: 0 };
      const ids = new Set(f.itens.map(x => x.id));
      novos.forEach(n => { if(!ids.has(n.id)) f.itens.push(n); });
      f.itens = f.itens.slice(-40);
      return JSON.stringify(f);
    });
    al.revisao2 = null;
  }catch(e){}
}
function revisaoComecar(){
  const r = revisaoState();
  r.sessao = { itens: revisaoVencidas().slice(0, 3), i: 0, resposta: null, resultados: [], fichas: false };
  render();
}
function revisaoResponder(i){ const S = revisaoState().sessao; if(!S || S.resposta!=null) return; S.resposta = i; S.resultados[S.i] = i===S.itens[S.i].correta; render(); }
async function revisaoProxima(){
  const r = revisaoState(); const S = r.sessao; if(!S) return;
  S.i++; S.resposta = null;
  if(S.i >= S.itens.length){
    const al = state.aluno;
    const res = {}; S.itens.forEach((q, k) => res[q.id] = S.resultados[k]);
    try{
      const novo = await window.storage.update(revisaoChave(al.turma.id, al.matriculaStudentId), raw => {
        let f; try{ f = raw ? JSON.parse(raw) : null; }catch(e){ f = null; }
        f = f || { itens: [], feitos: 0 };
        const fica = [];
        f.itens.forEach(x => {
          if(!(x.id in res)){ fica.push(x); return; }
          if(res[x.id]){ if(x.etapa>=2){ f.feitos = (f.feitos||0) + 1; return; } fica.push(Object.assign({}, x, { etapa: 2, prox: Date.now() + 30*DIA_MS })); }
          else fica.push(Object.assign({}, x, { etapa: 1, prox: Date.now() + 3*DIA_MS }));
        });
        f.itens = fica; f.ultima = Date.now();
        return JSON.stringify(f);
      });
      try{ r.fila = JSON.parse(novo); }catch(e){}
    }catch(e){}
    if(S.resultados.some(Boolean)){ S.fichas = true; try{ await awardFichas(al.turma.id, al.matriculaStudentId, 1, 'Fez a revisão rápida', 'revisao'); }catch(e){} }
  }
  render();
}
function planoDiagAulas(plano, b){ return plano.aulas.filter(a => a.bimestre===b && a.exercicio && (a.exercicio.questoesRecuperacao||[]).length); }
function planoDiagSel(turmaId, b, prog, plano){
  const s = planoState(); s.diagSel = s.diagSel || {};
  const k = turmaId + ':' + b;
  const dadas = planoDiagAulas(plano, b).filter(a => prog.dadas && prog.dadas[a.n]).map(a => a.n);
  s.diagSel[k] = s.diagSel[k] || {};
  dadas.forEach(n => { if(!(n in s.diagSel[k])) s.diagSel[k][n] = true; });   // aula dada nova entra marcada
  Object.keys(s.diagSel[k]).forEach(n => { if(!dadas.includes(Number(n))) delete s.diagSel[k][n]; });
  return s.diagSel[k];
}
function planoDiagQuestoes(plano, nums){
  const aulas = nums.map(n => plano.aulas.find(a => a.n===n)).filter(Boolean);
  const out = [];
  for(let r = 0; r < 4 && out.length < 10; r++){
    for(const a of aulas){
      if(out.length >= 10) break;
      const lista = a.exercicio.questoesRecuperacao || [];
      const i = lista.length - 1 - r;   // começa pela última (a primeira costuma ir para a recuperação comum)
      if(i >= 0) out.push({ k: `r:${a.n}:${i}`, n: a.n, q: lista[i] });
    }
  }
  return out;
}
async function planoAplicarDiagnostica(turmaId, b){
  const s = planoState(); const plano = s.planos[s.turmaPlano[turmaId]];
  if(!plano) return;
  const prog = s.prog[turmaId] || { dadas:{}, exercicios:{} };
  if(prog.diagnosticas && prog.diagnosticas[b]){ alert('A diagnóstica deste bimestre já foi aplicada (código ' + prog.diagnosticas[b] + ').'); return; }
  const prog_aulas = planoDiagAulas(plano, b);
  const minimo = Math.ceil(prog_aulas.length / 2);
  const dadas = prog_aulas.filter(a => prog.dadas && prog.dadas[a.n]).length;
  if(dadas < minimo){ alert(`A diagnóstica só pode ser aplicada depois de dada pelo menos a metade das aulas do bimestre (${minimo} de ${prog_aulas.length}). Até agora: ${dadas}.`); return; }
  const sel = planoDiagSel(turmaId, b, prog, plano);
  const nums = Object.keys(sel).filter(n => sel[n]).map(Number).sort((x, y) => x - y);
  if(!nums.length){ alert('Marque pelo menos uma aula para entrar na diagnóstica.'); return; }
  const itens = planoDiagQuestoes(plano, nums);
  if(!itens.length){ alert('As aulas marcadas não têm questões para a diagnóstica.'); return; }
  const disc = planoDisciplinaDoProfessor(plano.disciplina||''); const sess = state.professor.session;
  const code = genCode();
  const pts = Math.round(10 / itens.length * 100) / 100;
  const imgCache = {};
  const questions = [];
  for(const { q } of itens){ const options = q.opcoes.map(t => ({ id: cryptoId(), text: t }));
    let image = null; if(q.imagem){ if(!(q.imagem in imgCache)) imgCache[q.imagem] = await planoLerJson(`plano-livro-img:${q.imagem}`, null); image = imgCache[q.imagem] || null; }
    const nq = { id: cryptoId(), type:'mc', text: q.texto, points: pts, image, annulled:false, descritorSaeb: q.habilidade ? 'ENEM ' + q.habilidade : '', conteudo: 'Diagnóstica', options, correctOptionId: options[q.correta].id, explicacao: saeseExplicacao(q), saese: saeseDeQuestaoPlano(q) };
    if(q.comando) nq.comando = q.comando; questions.push(nq); }
  const faixa = nums.length > 1 ? `aulas ${nums[0]} a ${nums[nums.length-1]}` : `aula ${nums[0]}`;
  const a = { code, title: `Avaliação diagnóstica — ${b}º bimestre (${faixa})`, instrumento: 'diagnostica', unidade: UNIDADES[Math.max(0, Math.min(3, b-1))],
    disciplinaId: disc ? disc.id : null, disciplinaName: disc ? disc.name : (plano.disciplina||null), turmaIds: [turmaId], questions,
    startAt: null, endAt: planoPrazoParaEndAt('7'), agendaTurmas: {}, resultRelease: { mode:'imediato', releaseAt:'' }, securityEnabled: false, minMinutesPerQuestion: null, exigeLiberacao: false,
    origemPlano: { planoId: plano.id, turmaId, diagnostica: b, aulas: nums }, professorId: sess ? sess.id : null, professorName: sess ? sess.displayName : 'Coordenação', createdAt: Date.now(), updatedAt: null };
  await window.storage.set(`assessment:${code}`, JSON.stringify(a), true);
  (state.professor.assessments = state.professor.assessments||[]).unshift(a);
  const fresh = await planoLerJson(`plano-livro-prog:${planoTK(turmaId)}`, prog);
  fresh.diagnosticas = Object.assign({}, fresh.diagnosticas||{}, { [b]: code });
  fresh.diagUsadas = Object.assign({}, fresh.diagUsadas||{}, { [b]: itens.map(x => x.k) });
  s.prog[turmaId] = Object.assign({}, prog, fresh); await planoSalvarProg(turmaId);
  s.msg = `✅ Diagnóstica do ${b}º bimestre aplicada — código ${code}, ${itens.length} questões (${faixa}), prazo de 7 dias. A nota compõe a NP2 do bimestre. As questões usadas não se repetem na recuperação.`;
  render();
}
function planoDiagnosticaHtml(turmaId, plano, prog, b){
  const aulas = planoDiagAulas(plano, b);
  const head = `<div class="card" data-plano-diag><h3 style="margin-top:0;">🩺 Avaliação diagnóstica — ${b}º bimestre <span class="muted" style="font-size:.8rem; font-weight:400;">· compõe a NP2</span></h3>`;
  if(!aulas.length) return head + `<p class="muted" style="margin:0;">As aulas deste bimestre ainda não têm questões prontas no app. A diagnóstica fica disponível quando o conteúdo do bimestre chegar.</p></div>`;
  const code = prog.diagnosticas && prog.diagnosticas[b];
  if(code) return head + `<p style="margin:0;">✅ Aplicada — código <strong>${esc(code)}</strong>. A nota entra na NP2 do bimestre; no 📈 Resultados você vê como a turma está e quem ficou abaixo de 5.</p></div>`;
  const minimo = Math.ceil(aulas.length / 2);
  const dadas = aulas.filter(a => prog.dadas && prog.dadas[a.n]);
  const pct = Math.min(100, Math.round(dadas.length / minimo * 100));
  if(dadas.length < minimo) return `<div data-plano-diag class="muted" style="font-size:.86rem; margin:0 0 14px; padding:8px 12px; border:1px dashed var(--paper-line,#ddd); border-radius:10px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
    <span>🩺 <strong>Diagnóstica do ${b}º bimestre</strong> (compõe a NP2) libera depois da metade das aulas: ${dadas.length} de ${minimo} — faltam ${minimo - dadas.length}.</span>
    <span style="flex:1 1 120px; max-width:200px; background:#eee; border-radius:8px; height:8px; overflow:hidden;"><span style="display:block; width:${pct}%; height:100%; background:#C9A227;"></span></span></div>`;
  const sel = planoDiagSel(turmaId, b, prog, plano);
  const nums = Object.keys(sel).filter(n => sel[n]).map(Number);
  const nq = planoDiagQuestoes(plano, nums).length;
  return head + `<p class="muted" style="font-size:.86rem; margin-top:0;">✅ A turma já viu ${dadas.length} das ${aulas.length} aulas — pode aplicar agora (meio do bimestre) ou esperar o fim. Marque as aulas que entram (só aparecem as já dadas):</p>
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:2px 10px; font-size:.86rem;">
      ${dadas.map(a => `<label style="text-transform:none; font-weight:400; cursor:pointer;"><input type="checkbox" data-action="plano-diag-sel" data-b="${b}" data-n="${a.n}" ${sel[a.n]?'checked':''} style="width:auto;"> Aula ${a.n} — ${esc(a.tituloCurto||a.tema)}</label>`).join('')}
    </div>
    <div class="row" style="gap:8px; align-items:center; margin-top:8px; flex-wrap:wrap;"><button class="btn btn-primary btn-sm" data-action="plano-diag-aplicar" data-b="${b}" ${nq?'':'disabled'}>Aplicar à turma</button>
    <span class="muted" style="font-size:.84rem;">${nq} questões inéditas (estilo ENEM) das ${nums.length} aula(s) marcadas · prazo de 7 dias</span></div></div>`;
}
async function relatorioCalcular(turmaId, b){
  const s = planoState();
  const turma = (state.professor.turmas||[]).find(t => t.id===turmaId);
  const alunos = (turma && turma.students) || [];
  const nomes = {}; alunos.forEach(st => nomes[nomeChave(st.name)] = st);
  const unidade = UNIDADES[Math.max(0, Math.min(3, b-1))];
  const prog = s.prog[turmaId] || await planoLerJson(`plano-livro-prog:${planoTK(turmaId)}`, { dadas:{}, exercicios:{} });
  const plano = s.planos[s.turmaPlano[turmaId]] || null;
  const todas = await Promise.all(((await window.storage.list('assessment:', true)).keys||[]).map(k => planoLerJson(k, null)));
  const daTurma = todas.filter(a => a && assessmentTurmaIds(a).includes(turmaId));
  const diags = daTurma.filter(a => a.origemPlano && a.origemPlano.diagnostica==b);
  const provas = daTurma.filter(a => a.instrumento==='avaliacao' && a.unidade===unidade);
  const medir = async lista => {
    const porAluno = {}, porHab = {};
    for(const a of lista){
      const max = (a.questions||[]).reduce((x, q) => x + (q.annulled ? 0 : (q.points||0)), 0) || 10;
      (await planoLerJson(`responses:${a.code}`, [])).forEach(r => {
        const st = nomes[nomeChave(r.studentName)]; if(!st) return;
        const p = porAluno[st.id] = porAluno[st.id] || [0, 0]; p[0] += (r.total||0)/max; p[1]++;
        (a.questions||[]).forEach(q => { const m = /^ENEM (H\d+)/.exec(q.descritorSaeb||''); if(!m || q.type!=='mc' || q.annulled) return;
          const h = porHab[m[1]] = porHab[m[1]] || [0, 0]; h[0] += (r.answers && r.answers[q.id]===q.correctOptionId) ? 1 : 0; h[1]++; });
      });
    }
    const vals = Object.values(porAluno).map(x => x[0]/x[1]);
    const abaixo = alunos.filter(st => porAluno[st.id] && porAluno[st.id][0]/porAluno[st.id][1] < 0.5).map(st => st.name).sort((x, y) => x.localeCompare(y, 'pt-BR'));
    return { porAluno, porHab, abaixo, n: vals.length, media: vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length * 100) : null };
  };
  const [D, P] = [await medir(diags), await medir(provas)];
  let melhoraram = 0, ambos = 0;
  Object.keys(D.porAluno).forEach(id => { if(P.porAluno[id]){ ambos++; if(P.porAluno[id][0]/P.porAluno[id][1] > D.porAluno[id][0]/D.porAluno[id][1]) melhoraram++; } });
  // exercícios do bimestre (padrão + apoio)
  const aulasB = plano ? plano.aulas.filter(a => a.bimestre===b).map(a => a.n) : Object.keys(prog.exercicios||{}).map(Number);
  let somaEntrega = 0, nEx = 0, somaAcerto = 0, nAcerto = 0;
  for(const n of aulasB){
    if(!planoCodigosDaAula(prog, n).length) continue;
    const resp = (await planoRespostasDaAula(prog, n)).filter(r => nomes[nomeChave(r.studentName)]);
    const fizeram = new Set(resp.map(r => nomeChave(r.studentName)));
    if(alunos.length){ somaEntrega += fizeram.size / alunos.length; nEx++; }
    resp.forEach(r => { somaAcerto += Math.min(1, (r.total||0) / 10); nAcerto++; });
  }
  const termo = Object.entries(await planoLerJson(`plano-termometro:${planoTK(turmaId)}`, {})).filter(([n, x]) => aulasB.includes(Number(n)) && x && x.total).map(([, x]) => x);
  const visto = await planoLerJson(`plano-visto:${planoTK(turmaId)}`, {});
  const vv = Object.entries(visto||{}).filter(([n]) => aulasB.includes(Number(n))).flatMap(([, o]) => Object.values(o||{}));
  const filas = await Promise.all(alunos.map(st => planoLerJson(revisaoChave(turmaId, st.id), null)));
  const revisoes = filas.reduce((x, f) => x + ((f && f.feitos) || 0), 0);
  const comApoio = alunos.filter(st => st.apoio && Object.keys(st.apoio).length).length;
  return { turmaId, turma: turma ? turma.name : '?', b, diag: D, prova: P, ganho: (D.media!=null && P.media!=null) ? P.media - D.media : null, melhoraram, ambos,
    entrega: nEx ? Math.round(somaEntrega/nEx*100) : null, acertoEx: nAcerto ? Math.round(somaAcerto/nAcerto*100) : null, exercicios: nEx,
    termoOk: termo.length ? Math.round(termo.reduce((x, t) => x + t.ok/t.total, 0)/termo.length*100) : null,
    cadernos: vv.length ? Math.round(vv.reduce((x, v) => x + (VISTO_FATOR[v.v]||0), 0)/vv.length*100) : null,
    revisoes, comApoio, alunos: alunos.length, aulasDadas: aulasB.filter(n => prog.dadas && prog.dadas[n]).length, totalAulas: aulasB.length, em: Date.now() };
}
async function relatorioAbrir(turmaIds, b){
  const s = planoState();
  s.relatorio = { b, carregando: true, linhas: [] }; render();
  for(const t of turmaIds){ try{ if(!s.prog[t]) await planoCarregarTurma(t); s.relatorio.linhas.push(await relatorioCalcular(t, b)); }catch(e){} }
  s.relatorio.carregando = false; render();
}
function relatorioCsv(){
  const r = planoState().relatorio; if(!r) return;
  const cab = ['Turma','Bimestre','Aulas dadas','Diagnóstica NP2 (%)','Avaliação NP1 (%)','Abaixo de 5 na diagnóstica','Nomes','Entrega de exercícios (%)','Acerto nos exercícios (%)','Termômetro: entenderam (%)','Cadernos com visto (%)','Revisões concluídas','Alunos com apoio'];
  const linhas = r.linhas.map(l => [l.turma, l.b, `${l.aulasDadas}/${l.totalAulas}`, l.diag.media, l.prova.media, l.diag.abaixo.length, l.diag.abaixo.join(', '), l.entrega, l.acertoEx, l.termoOk, l.cadernos, l.revisoes, l.comApoio]);
  const habs = [...new Set(r.linhas.flatMap(l => [...Object.keys(l.diag.porHab), ...Object.keys(l.prova.porHab)]))].sort();
  const extra = [[], ['Por habilidade (ENEM)'], ['Turma', ...habs.flatMap(h => [h + ' diagnóstica %', h + ' avaliação %'])]].concat(r.linhas.map(l => [l.turma, ...habs.flatMap(h => [l.diag.porHab[h] ? Math.round(l.diag.porHab[h][0]/l.diag.porHab[h][1]*100) : '', l.prova.porHab[h] ? Math.round(l.prova.porHab[h][0]/l.prova.porHab[h][1]*100) : ''])]));
  const csv = [cab, ...linhas, ...extra].map(l => l.map(v => v==null ? '' : `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `resultados-${r.b}bimestre-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function renderRelatorio(){
  const r = planoState().relatorio; if(!r) return '';
  const cor = v => v==null ? '#999' : v >= 70 ? '#1d6b31' : v >= 50 ? '#a4521b' : '#b3261e';
  const pc = v => v==null ? '—' : `<strong style="color:${cor(v)};">${v}%</strong>`;
  return `<div class="card" data-relatorio>
    <div class="row" style="justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
      <h3 style="margin:0;">📈 Resultados — ${r.b}º bimestre</h3>
      <div class="row" style="gap:6px;"><button class="btn btn-ghost btn-sm" data-action="relatorio-csv" ${r.carregando?'disabled':''}>⬇️ Planilha (CSV)</button><button class="btn btn-ghost btn-sm" data-action="relatorio-imprimir" ${r.carregando?'disabled':''}>🖨️ Imprimir</button><button class="btn btn-ghost btn-sm" data-action="relatorio-fechar">Fechar</button></div>
    </div>
    <p class="muted" style="font-size:.84rem;">Mostra como cada turma está: a <strong>diagnóstica</strong> (NP2, aplicada no meio ou no fim do bimestre) e a <strong>avaliação</strong> (NP1), por habilidade do ENEM, junto com os sinais do dia a dia: entrega e acerto dos exercícios, termômetro, cadernos e revisões.</p>
    ${r.carregando && !r.linhas.length ? '<p>⏳ Calculando…</p>' : ''}
    ${r.linhas.map(l => {
      const habs = [...new Set([...Object.keys(l.diag.porHab), ...Object.keys(l.prova.porHab)])].sort((a,b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
      const pct = x => x ? Math.round(x[0]/x[1]*100) : null;
      return `<div data-relatorio-turma="${esc(l.turmaId)}" style="border:1px solid #eadfd0; border-radius:10px; padding:10px 12px; margin:10px 0;">
        <div class="row" style="justify-content:space-between; flex-wrap:wrap; gap:6px;"><strong style="font-size:1.05rem;">${esc(l.turma)}</strong><span class="muted" style="font-size:.82rem;">${l.aulasDadas}/${l.totalAulas} aulas dadas · ${l.alunos} alunos${l.comApoio ? ` · ${l.comApoio} com apoio` : ''}</span></div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:8px; margin-top:8px; font-size:.86rem;">
          <div>🩺 Diagnóstica (NP2)<br>${pc(l.diag.media)} <span class="muted">(${l.diag.n} alunos)</span></div>
          <div>📝 Avaliação (NP1)<br>${pc(l.prova.media)} <span class="muted">(${l.prova.n} alunos)</span></div>
          <div>⚠️ Abaixo de 5 na diagnóstica<br>${l.diag.n ? `<strong style="color:${l.diag.abaixo.length?'#b3261e':'#1d6b31'};">${l.diag.abaixo.length} aluno(s)</strong>` : '<span class="muted">ainda não aplicada</span>'}</div>
          <div>📤 Entrega dos exercícios<br>${pc(l.entrega)}</div>
          <div>✅ Acerto nos exercícios<br>${pc(l.acertoEx)}</div>
          <div>🌡️ Entenderam a aula<br>${pc(l.termoOk)}</div>
          <div>📒 Cadernos com visto<br>${pc(l.cadernos)}</div>
          <div>🔁 Revisões concluídas<br><strong>${l.revisoes}</strong></div>
        </div>
        ${l.diag.abaixo.length ? `<div data-relatorio-abaixo style="margin-top:8px; font-size:.84rem; background:#fdf1ef; border-radius:8px; padding:6px 10px;"><strong>Precisam de atenção (diagnóstica abaixo de 5):</strong> ${l.diag.abaixo.map(esc).join(', ')}. <span class="muted">Sugestão: retomar as aulas mais fracas e marcar a 🧩 versão de apoio nos próximos exercícios.</span></div>` : ''}
        ${habs.length ? `<details style="margin-top:8px;"><summary style="cursor:pointer; font-size:.86rem;">Por habilidade do ENEM (diagnóstica × avaliação)</summary>
          ${habs.map(h => { const d = pct(l.diag.porHab[h]), p = pct(l.prova.porHab[h]);
            return `<div style="display:grid; grid-template-columns:3em 1fr 1fr; gap:6px; align-items:center; font-size:.8rem; margin:3px 0;" title="${esc((typeof HAB_TEXTO!=='undefined' && HAB_TEXTO[h])||'')}"><strong>${h}</strong>
              <div style="background:#eee; border-radius:4px; height:12px; position:relative;"><div style="width:${d||0}%; height:100%; background:#b9a9ad; border-radius:4px;"></div><span style="position:absolute; right:4px; top:-2px; font-size:.72rem;">${d==null?'—':d+'%'}</span></div>
              <div style="background:#eee; border-radius:4px; height:12px; position:relative;"><div style="width:${p||0}%; height:100%; background:#6B1F2E; border-radius:4px;"></div><span style="position:absolute; right:4px; top:-2px; font-size:.72rem; color:${p>60?'#fff':'#222'};">${p==null?'—':p+'%'}</span></div></div>`; }).join('')}
          <div class="muted" style="font-size:.75rem;">Barra clara = diagnóstica (NP2) · barra vinho = avaliação (NP1)</div></details>` : ''}
      </div>`; }).join('')}
  </div>`;
}
const GRUPO_PAPEIS = [['🎤','Relator','escreve no tablet a conclusão do grupo'], ['🧭','Coordenador','garante que todos falem'], ['✍️','Escriba','anota as ideias no caderno'], ['⏱️','Guardião do tempo','avisa quando faltar 2 minutos']];
function avGrupoPresentes(av){
  const t = (state.professor.turmas||[]).find(x => x.id===av.sess.turmaId);
  const alunos = (t && t.students) || [];
  const ativos = new Set([...Object.keys(av.resp||{}), ...Object.values(av.int||{}).flatMap(o => Object.keys(o||{}))]);
  const pres = alunos.filter(s => ativos.has(s.id));
  return pres.length >= Math.max(4, alunos.length * 0.5) ? pres : alunos;
}
async function avGrupoFormar(){
  const av = aulaVivaState(); if(!av.sess) return;
  const lista = avGrupoPresentes(av).slice();
  for(let i = lista.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [lista[i], lista[j]] = [lista[j], lista[i]]; }
  const nG = Math.max(1, Math.round(lista.length / 4));
  const grupos = Array.from({ length: nG }, (_, g) => ({ g: g + 1, membros: [] }));
  lista.forEach((s, i) => grupos[i % nG].membros.push({ id: s.id, nome: s.name }));
  grupos.forEach(G => G.membros.forEach((m, k) => m.papel = k < GRUPO_PAPEIS.length ? k : 2)); // 5º membro em diante: escriba (só 1 relator por grupo)
  const min = (av.sess.cfg && av.sess.cfg.grupo) || 10;
  av.sess.grupos = { id: cryptoId(), lista: grupos, ini: Date.now(), min, fichas: [] };
  av.int = av.int || {};
  render(); await aulaVivaSalvarSessao();
}
async function avGrupoFichas(g){
  const av = aulaVivaState(); const G = av.sess && av.sess.grupos; if(!G) return;
  if((G.fichas||[]).includes(g)) return;
  G.fichas = [...(G.fichas||[]), g]; render(); await aulaVivaSalvarSessao();
  const grupo = G.lista.find(x => x.g===g);
  try{ await awardFichasLote(av.sess.turmaId, grupo.membros.map(m => ({ studentId: m.id, amount: 2, motivo: 'Trabalho em grupo da aula', categoria: 'aulaviva' }))); }catch(e){}
}
function avGrupoHtml(d, sl, ctx){
  const C = { v:'#6B1F2E', o:'#C9A227', a:'#1F4E79' };
  const G = ctx.sess && ctx.sess.grupos;
  const perg = d.debate || d.pergunta;
  const barra = G ? `<div class="av-barra" style="background:#eee;"><div style="animation:avBarra ${G.min*60}s linear both;animation-delay:-${((Date.now()-G.ini)/1000).toFixed(1)}s;"></div></div>` : '';
  if(ctx.estudo) return `<div class="av-in"><div class="av-t">👥 Para debater</div><div style="font-size:1.3em;">${esc(perg)}</div><div class="av-card" style="margin-top:1em;">Converse com um colega ou com alguém da sua casa e escreva a conclusão em 2 frases no caderno.</div></div>`;
  if(ctx.modo==='prof'){
    if(!G) return `<div class="av-in"><div class="av-row" style="justify-content:space-between;"><div class="av-t">👥 Trabalho em grupo</div>${avCirc('FaUsers', C.v, '#fff', 2.2)}</div>
      <div class="av-card ou" style="font-size:1.25em;color:${C.v};"><b>Para debater:</b> ${esc(perg)}</div>
      <div style="margin-top:.8em;">Grupos de 4, com papéis: ${GRUPO_PAPEIS.map(p => `${p[0]} ${p[1]}`).join(' · ')}. O relator envia a conclusão pelo tablet.</div>
      <button class="btn btn-primary" data-action="av-grupo-formar" style="margin-top:1em;font-size:1em;">👥 Formar os grupos agora</button></div>`;
    const resp = ctx.int['grupo-' + G.id] || {};
    const porGrupo = {}; Object.values(resp).forEach(r => { if(r && r.g) porGrupo[r.g] = r; });
    const nL = Math.ceil(G.lista.length / Math.min(4, G.lista.length));
    return `<div class="av-in" style="font-size:${G.lista.length > 8 ? 1.1 : G.lista.length > 4 ? 1.2 : 1.35}em;"><div class="av-row" style="justify-content:space-between;"><div class="av-t" style="font-size:1em;margin-bottom:.2em;">👥 ${esc(perg)}</div></div>${barra}
      <div style="display:grid;grid-template-columns:repeat(${Math.min(4, G.lista.length)},1fr);grid-template-rows:repeat(${nL},auto);gap:.5em;margin-top:.4em;max-height:78%;overflow:hidden;">
        ${G.lista.map(gr => { const c = porGrupo[gr.g]; return `<div class="av-card ${c?'':'cz'}" data-av-grupo="${gr.g}" style="${c?'background:#E9F6EC;color:#222;':'color:#555;'}font-size:.8em;padding:.5em .7em;">
          <b style="color:${C.v};">Grupo ${gr.g}</b> <span style="font-size:.85em;">${gr.membros.map(m => `${GRUPO_PAPEIS[m.papel][0]} ${esc(firstName(m.nome))}`).join(' · ')}</span>
          <div style="margin-top:.3em;">${c ? `“${esc(c.texto)}”` : '<i>aguardando o relator…</i>'}</div>
          ${c ? `<button class="btn btn-ghost btn-sm" data-action="av-grupo-fichas" data-g="${gr.g}" style="margin-top:.3em;background:#fff;" ${(G.fichas||[]).includes(gr.g)?'disabled':''}>${(G.fichas||[]).includes(gr.g)?'✓ +2 fichas dadas':'⭐ +2 fichas para o grupo'}</button>` : ''}</div>`; }).join('')}
      </div></div>`;
  }
  // tablet
  const al = state.aluno;
  if(!G) return `<div class="av-in av-azul"><div class="av-t">👥 Trabalho em grupo</div><div style="font-size:1.3em;">${esc(perg)}</div><div style="margin-top:1em;color:#F3E7C0;">Aguarde: o professor vai formar os grupos.</div></div>`;
  const meu = G.lista.find(gr => gr.membros.some(m => m.id===al.matriculaStudentId));
  if(!meu) return `<div class="av-in av-azul"><div class="av-t">👥 Trabalho em grupo</div><div style="font-size:1.3em;">${esc(perg)}</div><div style="margin-top:1em;color:#F3E7C0;">Procure o professor para entrar num grupo.</div></div>`;
  const eu = meu.membros.find(m => m.id===al.matriculaStudentId); const papel = GRUPO_PAPEIS[eu.papel];
  const enviado = ctx.meu && ctx.meu.grupo && ctx.meu.grupo.id===G.id;
  return `<div class="av-in av-azul"><div class="av-row" style="justify-content:space-between;"><div class="av-t" style="margin-bottom:.2em;">👥 Grupo ${meu.g}</div><span style="font-size:1.3em;">${papel[0]} <b>${papel[1]}</b></span></div>${barra}
    <div style="font-size:1.15em;margin:.4em 0;">${esc(perg)}</div>
    <div style="color:#F3E7C0;font-size:.9em;">Seu papel: ${papel[2]}. Grupo: ${meu.membros.map(m => esc(firstName(m.nome)) + ' (' + GRUPO_PAPEIS[m.papel][1] + ')').join(', ')}.</div>
    ${eu.papel===0 ? (enviado ? `<div class="av-card ou" style="color:${C.v};margin-top:.6em;">✔ Conclusão enviada: “${esc(ctx.meu.grupo.texto)}”. Pode enviar de novo para corrigir.</div>` : '') + `<div style="display:flex;gap:.4em;margin-top:.6em;"><textarea id="av-grupo-txt" maxlength="280" rows="2" style="flex:1;font-size:1em;border-radius:.4em;padding:.3em .5em;" placeholder="A conclusão do grupo, em 2 frases">${esc((ctx.meu && ctx.meu.grupoRascunho) || '')}</textarea><button class="btn" data-action="av-grupo-enviar" style="background:${C.o};color:${C.v};font-weight:700;">Enviar</button></div>` : '<div style="margin-top:.6em;">📵 Tablet para baixo: converse com o grupo.</div>'}
  </div>`;
}
async function avAlunoGrupoEnviar(){
  const al = state.aluno; const s = al.aulaViva; const G = s && s.grupos; if(!G) return;
  const el = document.getElementById('av-grupo-txt'); const t = (el ? el.value : '').trim().slice(0, 280); if(!t) return;
  const meu = G.lista.find(gr => gr.membros.some(m => m.id===al.matriculaStudentId)); if(!meu) return;
  const m = avMeu(); m.grupo = { id: G.id, texto: t }; m.grupoRascunho = ''; render();
  await avAlunoSalvarInt('grupo-' + G.id, { g: meu.g, texto: t });
}
function planoGrupoHtml(turmaId, aula){
  if(!aula.slides) return '';
  const c = planoCfg(turmaId); const m = (c.grupo||{})[aula.n] || 0;
  return `<label style="font-size:.85rem; text-transform:none; font-weight:400;">👥 Trabalho em grupo: <select data-action="plano-cfg-grupo" data-tid="${esc(turmaId)}" data-n="${aula.n}" style="width:auto; padding:2px 4px;">
    ${[0,8,10,15].map(v => `<option value="${v}" ${m===v?'selected':''}>${v ? v + ' min' : 'não fazer'}</option>`).join('')}</select></label>`;
}
async function planoFichasExercicio(a, result){
  const al = state.aluno;
  if(!a || !a.origemPlano || a.instrumento!=='exercicios' || a.origemPlano.recuperacao || !al.turma || !al.matriculaStudentId) return null;
  if(a.origemPlano.desafio){
    const q = (a.questions||[])[0]; if(!q || !(result.answers && result.answers[q.id]===q.correctOptionId)) return null;
    try{ await awardFichas(al.turma.id, al.matriculaStudentId, 3, 'Acertou o desafio extra da aula', 'desafio'); }catch(e){ return null; }
    return 3;
  }
  if(a.endAt && Date.now() > new Date(a.endAt).getTime()) return null;
  const objetivas = (a.questions||[]).filter(q => q.type==='mc' && !q.annulled);
  const acertos = objetivas.filter(q => result.answers && result.answers[q.id]===q.correctOptionId).length;
  const bom = objetivas.length && acertos/objetivas.length >= 0.8;
  const qtd = bom ? 5 : 3;
  try{ await awardFichas(al.turma.id, al.matriculaStudentId, qtd, bom ? 'Entregou o exercício da aula no prazo e acertou 80% ou mais' : 'Entregou o exercício da aula no prazo', 'plano'); }catch(e){ return null; }
  return qtd;
}
function planoLinksHtml(lista, icone){
  return (lista||[]).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" style="display:block; font-size:.85rem; margin:2px 0;">${icone} ${esc(l.t)}${l.busca?' <span class="muted">(busca)</span>':''}</a>`).join('');
}
function planoAulaDetalheHtml(turmaId, plano, aula, prog, destaque, ctxHero){
  const s = planoState();
  const slot = s.slides[plano.id] && s.slides[plano.id][aula.n];
  const codigo = prog.exercicios && prog.exercicios[aula.n];
  const aval = codigo ? planoAvaliacaoPorCodigo(codigo) : null;
  const dada = !!(prog.dadas && prog.dadas[aula.n]);
  const vale = s.valeNota[aula.n] !== false;
  const recursos = planoLinksHtml(aula.video,'🎬') + planoLinksHtml(aula.podcast,'🎧') + planoLinksHtml(aula.filmes,'🎞️') + planoLinksHtml(aula.sites,'🌐') + planoLinksHtml(aula.questoes,'❓');
  const editados = (planoState().sedCache||{})[sedChave(plano.id, aula.n)];
  // ---- ações principais (3 botões grandes) ----
  const apresentar = aula.slides
    ? `<button class="pl-acao pl-acao-1" data-action="plano-aula-viva" data-n="${aula.n}" title="Slides montados pelo app, com animações e perguntas nos tablets"><span class="pl-acao-ic">📡</span><span>Apresentar<small>slides no telão e nos tablets</small></span></button>`
    : slot ? `<button class="pl-acao pl-acao-1" data-action="plano-apresentar" data-n="${aula.n}"><span class="pl-acao-ic">▶️</span><span>Apresentar<small>PDF com ${slot.totalSlides} slides</small></span></button>`
    : `<label class="pl-acao pl-acao-1" style="cursor:pointer;"><span class="pl-acao-ic">⬆️</span><span>Enviar slides<small>PDF desta aula</small></span><input type="file" accept="application/pdf" data-action="plano-slide-unico" data-n="${aula.n}" style="display:none;"></label>`;
  const exercicio = !aula.exercicio ? ''
    : codigo ? `<div class="pl-acao pl-acao-ok" data-pl-ex-aplicado><span class="pl-acao-ic">📝</span><span>Exercício aplicado<small>código <b>${esc(codigo)}</b></small></span></div>`
    : `<button class="pl-acao pl-acao-2" data-action="plano-aplicar-exercicio" data-n="${aula.n}"><span class="pl-acao-ic">📝</span><span>Aplicar exercício<small>${aula.exercicio.questoes.length} questões${planoMapaDoExercicio(turmaId, aula) ? ' + mapa do caderno' : ''} · ${vale ? 'vale nota' : 'treino'}</small></span></button>`;
  const marcar = dada
    ? `<button class="pl-acao pl-acao-feita" data-action="plano-desmarcar-dada" data-n="${aula.n}" title="Desmarcar"><span class="pl-acao-ic">✅</span><span>Aula dada<small>toque para desmarcar</small></span></button>`
    : `<button class="pl-acao pl-acao-3" data-action="plano-marcar-dada" data-n="${aula.n}"><span class="pl-acao-ic">✅</span><span>Marcar como dada<small>registra no plano</small></span></button>`;
  // opções do exercício (antes e depois de aplicar)
  const exOpcoes = !aula.exercicio ? '<span class="muted" style="font-size:.8rem;">Exercício de fixação desta aula ainda não foi preparado.</span>'
    : codigo ? `<span class="pl-opc">${prog.apoio && prog.apoio[aula.n] ? `🧩 apoio <b>${esc(prog.apoio[aula.n].code)}</b> (${prog.apoio[aula.n].alunos.length}) · ` : ''}${prog.desafios && prog.desafios[aula.n] ? `⭐ desafio <b>${esc(prog.desafios[aula.n])}</b> · ` : ''}
         <label style="cursor:pointer;"><input type="checkbox" data-action="plano-vale-nota-aplicado" data-code="${esc(codigo)}" ${(!aval || aval.valeNota!==false)?'checked':''} style="width:auto;"> vale nota</label>
         <span data-prazo-aplicado style="margin-left:6px;">${aval && aval.endAt ? (new Date(aval.endAt).getTime() < Date.now() ? '⏰ prazo encerrado em ' : '⏰ até ') + planoDataCurta(aval.endAt) : '⏰ sem prazo'}</span>
         <select data-action="plano-estender-prazo" data-code="${esc(codigo)}" style="width:auto; margin-left:6px; padding:2px 4px;"><option value="">mudar prazo…</option><option value="2">+2 dias</option><option value="7">+7 dias</option><option value="0">tirar o prazo</option></select></span>`
    : `<span class="pl-opc"><b>Exercício:</b> <label style="cursor:pointer;"><input type="checkbox" data-action="plano-vale-nota" data-n="${aula.n}" ${vale?'checked':''} style="width:auto;"> vale nota</label>
         <label>prazo <select data-action="plano-prazo" data-n="${aula.n}" style="width:auto; padding:2px 4px;">${[['2','2 dias'],['7','7 dias'],['14','14 dias'],['','sem prazo']].map(([v,t]) => `<option value="${v}" ${(s.prazo[aula.n]!=null ? s.prazo[aula.n] : '7')===v?'selected':''}>${t}</option>`).join('')}</select></label>
         <button class="btn btn-ghost btn-sm" data-action="plano-editar-exercicio" data-n="${aula.n}" style="width:auto;">✏️ Editar antes de aplicar</button>
         ${planoApoioHtml(turmaId, aula)}</span>`;
  // ---- ações secundárias ----
  const secund = [
    (aula.exercicio || ((aula.slides && aula.slides.enemOficial) || []).length) && state.view==='professor' ? `<button class="btn btn-ghost btn-sm" data-jg="plano-qes-aula" data-pid="${esc(plano.id)}" data-n="${aula.n}" data-tid="${esc(turmaId||'')}" title="Quem Erra Sai com as perguntas do exercício e as questões do ENEM desta aula">🎮 Quem Erra Sai com as perguntas da aula</button>` : '',
    aula.slides ? `<button class="btn btn-ghost btn-sm" data-action="sed-abrir" data-n="${aula.n}" title="Corrigir textos, criar slides, vídeos e perguntas (o plano original não muda)">✏️ Editar slides${editados ? ' <span style="font-size:.75rem;background:#F3E7C0;border-radius:6px;padding:1px 5px;">editados</span>' : ''}</button>` : '',
    aula.slides && slot ? `<button class="btn btn-ghost btn-sm" data-action="plano-apresentar" data-n="${aula.n}">▶️ PDF (${slot.totalSlides})</button>` : '',
    aula.slides && !slot ? `<label class="btn btn-ghost btn-sm" style="cursor:pointer;">⬆️ PDF próprio<input type="file" accept="application/pdf" data-action="plano-slide-unico" data-n="${aula.n}" style="display:none;"></label>` : '',
    aula.slides ? planoLeituraHtml(turmaId, aula) + planoGrupoHtml(turmaId, aula) : '',
    aula.slides && aula.slides.mapa ? (() => { const vs = planoVistoDe(turmaId, aula.n); const nv = Object.keys(vs).length; const tot = (((state.professor.turmas||[]).find(t=>t.id===turmaId)||{}).students||[]).length;
      return `<button class="btn btn-ghost btn-sm" data-action="plano-visto-abrir" data-tid="${esc(turmaId)}" data-n="${aula.n}" style="${dada && !nv ? 'border-color:#a4521b; color:#a4521b;' : ''}">📒 Visto no caderno (${nv}/${tot})</button>`; })() : '',
  ].filter(Boolean).join('');
  // ---- abas de apoio ----
  const abas = [];
  if((aula.roteiro||[]).length) abas.push(['roteiro', '🧭 Roteiro', `<ol style="margin:0 0 0 18px; font-size:.9rem; line-height:1.5;">${aula.roteiro.map(r=>`<li>${esc(r)}</li>`).join('')}</ol>`]);
  const livro = `${aula.pergunta?`<p style="margin:0 0 6px;"><strong>Pergunta para começar:</strong> <em>${esc(aula.pergunta)}</em></p>`:''}${(aula.exercicios_livro||[]).length?`<p style="margin:0 0 6px;">📖 <strong>No livro:</strong> ${(aula.exercicios_livro||[]).map(e=>esc(typeof e==='string'?e:(e.t||''))).join(' · ')}</p>`:''}${aula.tarefa?`<p style="margin:0;">🏠 <strong>Tarefa:</strong> ${esc(aula.tarefa)}</p>`:''}`;
  if(livro) abas.push(['livro', '📖 Livro e tarefa', `<div style="font-size:.9rem;">${livro}</div>`]);
  abas.push(['videos', '⭐ Vídeos', planoVideosHtml(plano.id, aula.n, true)]);
  if(recursos) abas.push(['buscas', '🔎 Buscas prontas', `<div>${recursos}</div>`]);
  abas.push(['biblioteca', '📚 Biblioteca', planoBibliotecaHtml(plano, aula)]);
  const abaSel = ((s.abaAula||{})[aula.n]) || (abas[0] && abas[0][0]);
  const abaAtual = abas.find(a => a[0]===abaSel) || abas[0];
  const abasHtml = abas.length ? `<div class="pl-abas" data-pl-abas>${abas.map(([id, rot]) => `<button class="pl-aba ${abaAtual && abaAtual[0]===id ? 'ativa' : ''}" data-action="pl-aba" data-n="${aula.n}" data-aba="${id}">${rot}</button>`).join('')}</div><div class="pl-aba-corpo" data-pl-aba-corpo="${abaAtual ? abaAtual[0] : ''}">${abaAtual ? abaAtual[2] : ''}</div>` : '';
  // ---- navegação (só no cartão principal) ----
  const idx = plano.aulas.findIndex(a => a.n===aula.n);
  const ant = plano.aulas[idx-1], prox = plano.aulas[idx+1];
  const nav = ctxHero ? `<div class="pl-nav">
      ${ant ? `<button class="btn btn-ghost btn-sm" data-action="pl-ver-aula" data-n="${ant.n}" style="width:auto;">← Aula ${ant.n}</button>` : '<span></span>'}
      ${ctxHero.vendoOutra ? `<button class="btn btn-ghost btn-sm" data-action="pl-ver-aula" data-n="" style="width:auto;">📌 Voltar para a aula de hoje</button>` : '<span></span>'}
      ${prox ? `<button class="btn btn-ghost btn-sm" data-action="pl-ver-aula" data-n="${prox.n}" style="width:auto;">Aula ${prox.n} →</button>` : '<span></span>'}</div>` : '';
  const kicker = ctxHero ? (ctxHero.vendoOutra ? `<strong style="color:#1F4E79;">👀 VENDO OUTRA AULA</strong> · ` : `<strong style="color:var(--wine,#6B1F2E);">📌 AULA DE HOJE</strong> · `) : '';
  return `
  <div class="card pl-aula ${ctxHero ? 'pl-hero' : ''}" data-plano-aula="${aula.n}">
    <div class="row" style="justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
      <div style="flex:1 1 300px; min-width:0;">
        <div class="muted" style="font-size:.8rem;">${kicker}Aula ${aula.n} de ${plano.aulas.length}${aula.paginas?' · livro '+esc(aula.paginas):''}${infoI(`${aula.bimestre}º bimestre · semana ${aula.semana}${aula.tipo ? ' · ' + esc(aula.tipo) : ''}`)}</div>
        <h3 class="pl-titulo">${esc(aula.tituloCurto||aula.tema)}</h3>${aula.tituloCurto && aula.tema && aula.tema!==aula.tituloCurto?`<div class="muted" style="font-size:.8rem; margin:-4px 0 6px;">${esc(aula.tema)}</div>`:''}
        ${aula.objetivo?`<p style="margin:0 0 6px; font-size:.9rem;"><strong>Objetivo:</strong> ${esc(aula.objetivo)}</p>`:''}
        ${(typeof plEtiquetasHtml==='function' ? plEtiquetasHtml : (t, p, a, h) => h.join(''))(turmaId, plano, aula, [pnpAulaFocoHtml(turmaId, plano, aula), planoCursosHtml(turmaId, aula), conexoesProfHtml(turmaId, plano, aula), trilhasProfHtml(turmaId, plano, aula), pontesProfHtml(turmaId, plano, aula)])}
      </div>
    </div>
    ${aula.tipo==='Revisão' ? `<p class="pl-nota">📉 Dia de revisão: abra <strong>“📝 Avaliação do bimestre”</strong>, logo abaixo, para ver o que a turma mais errou e aplicar a lista de revisão.</p>` : ''}
    ${aula.tipo==='Avaliação' ? `<p style="margin:8px 0; display:flex; gap:8px; flex-wrap:wrap;"><button class="btn btn-primary btn-sm" data-action="plano-montar-prova" data-b="${aula.bimestre}" style="width:auto;">📝 Montar a prova do ${aula.bimestre}º bimestre com as questões das aulas</button><button class="btn btn-ghost btn-sm" data-action="plano-recup-abrir" data-b="${aula.bimestre}" style="width:auto;">♻️ Depois da prova: recuperação personalizada</button></p>` : ''}
    <div class="pl-acoes">${apresentar}${exercicio}${marcar}${jgPlanoBotaoGrande(plano, aula, turmaId)}</div>
    ${(() => { const ab = !!((s.maisOpc||{})[aula.n]); const pend = !!(aula.slides && aula.slides.mapa && dada && !Object.keys(planoVistoDe(turmaId, aula.n)).length);
      return `<div class="pl-mais" data-pl-mais-bar><button class="btn btn-ghost btn-sm" data-pl-mais="${aula.n}" style="width:auto;">⚙️ ${ab ? 'Menos opções ▴' : 'Mais opções ▾'}</button>${ab ? '' : infoI('Em “Mais opções” ficam: exercício (nota, prazo, editar), editar slides, PDF, leitura, grupos e visto no caderno.')}${!ab && pend ? '<span class="pl-mais-pend">📒 visto do caderno pendente</span>' : ''}</div>
      ${ab ? `<div class="pl-mais-corpo" data-pl-mais-corpo><div class="pl-linha">${exOpcoes}</div>${secund ? `<div class="pl-linha pl-secund">${secund}</div>` : ''}</div>` : ''}`; })()}
    ${planoState().vistoAberto===aula.n && aula.slides && aula.slides.mapa ? `<div style="margin-top:8px; border:1px solid #eadfd0; border-radius:10px; padding:10px;">${renderVistoPainel(turmaId, aula.n, false)}</div>` : ''}
    ${avTermoChipHtml(turmaId, aula.n)}
    ${typeof plMateriaisHtml==='function' ? plMateriaisHtml(aula, abasHtml) : abasHtml}
    ${dada ? planoFeedbackProfHtml(plano.id, turmaId, aula.n) : ''}
    ${nav}
  </div>`;
}
function renderPlanoLivro(){
  const s = planoState();
  if(!s.carregado){ setTimeout(()=>carregarPlanoLivro(), 0); return '<div class="card"><p class="muted">Carregando planos de aula…</p></div>'; }
  // vínculos podem ter mudado (coordenação ligou um professor a uma turma): recalcula de tempos em tempos
  if(Date.now() - (s.efetivoEm||0) > 20000 && !s.recalculando){ s.recalculando = true; setTimeout(async () => { try{ await planoAtualizarEfetivo(); }catch(e){} s.recalculando = false; render(); }, 0); }
  const turmas = planoTurmasVisiveis();
  const podeImportar = planoPodeImportar();
  const avisos = planoLembretesHtml() + `${s.msg?`<div class="card" data-plano-msg style="background:#e9f6ec; border:1px solid #9fd3ab;">${esc(s.msg)}</div>`:''}${s.erro?`<div class="card" style="background:#fdecec; border:1px solid #e3a1a1;">${esc(s.erro)}</div>`:''}${s.enviando?`<div class="card" data-plano-enviando>⏳ ${esc(s.enviando.texto)} (${s.enviando.atual}/${s.enviando.total})… não feche esta tela.</div>`:''}`;
  const opcoesPlano = sel => `<option value="">— sem plano —</option>` + s.index.map(pl => `<option value="${esc(pl.id)}" ${sel===pl.id?'selected':''}>${esc(pl.titulo)}</option>`).join('');
  // O quadro de importação e vínculo das turmas aparece só no painel da coordenação (não no painel do professor,
  // nem quando a coordenação entra “como professor”).
  const blocoCoord = state.view==='coordenador' ? `
    <div class="card">
      <h3 style="margin-top:0;">⚙️ Coordenação: planos e turmas</h3>
      <p class="muted" style="font-size:.88rem; margin-top:0;">1) Importe o arquivo <strong>.json</strong> do plano (faz uma vez só). 2) Escolha qual versão cada turma segue. O professor passa a ver a “Aula de hoje”.</p>
      <label class="btn btn-primary btn-sm" style="cursor:pointer;">📥 Importar plano (.json)<input type="file" id="plano-import-input" accept="application/json,.json" style="display:none;"></label>
      ${s.index.length ? `<div style="margin-top:10px;">${s.index.map(pl => `<div class="row" style="justify-content:space-between; align-items:center; border-bottom:1px solid var(--border,#eee); padding:6px 0; gap:6px; flex-wrap:wrap;"><span style="font-size:.88rem;"><strong>${esc(pl.titulo)}</strong> · ${pl.totalAulas} aulas${pl.comExercicios?` · ${pl.comExercicios} com exercício pronto`:''}<br><span class="muted">${esc(pl.descricao||'')}</span></span><button class="btn btn-ghost btn-sm" data-action="plano-excluir" data-id="${esc(pl.id)}">Remover</button></div>`).join('')}</div>` : '<p class="muted" style="font-size:.85rem;">Nenhum plano importado ainda.</p>'}
      ${s.index.length && turmas.length ? `
      ${renderPlanoRegras()}
      <h4 style="margin:14px 0 6px;">Turmas${planoDiscsDisponiveis().length > 1 ? ` — ${esc((planoDiscsDisponiveis().find(d => d.k===planoDiscAtual())||{}).label||'')}` : ''}</h4>
      ${planoDiscsDisponiveis().length > 1 ? `<p class="muted" style="font-size:.82rem; margin:0 0 6px;">Cada turma segue um plano por disciplina. Troque a disciplina nos botões 📘 do topo para ver e ajustar os vínculos das outras.</p>` : ''}
      <p class="muted" style="font-size:.82rem; margin:0 0 6px;">“Automático” segue a regra acima. Escolha uma versão só se esta turma precisar ser diferente.</p>
      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:8px;">
        ${turmas.map(t => { const _mm = s.turmaPlanoManual||{}; const _dk = planoDiscAtual(); const _m0 = _mm[t.id]; const man = _mm[`${t.id}|${_dk}`] || ((_m0 && (_m0==='__nenhum' ? ((PLANO_DONOS||{})[t.id]||_dk)===_dk : planoDiscDoPlanoId(_m0)===_dk)) ? _m0 : '') || ''; const o = (s.origem||{})[t.id]; const ef = s.turmaPlano[t.id]; const pl = ef && s.index.find(x=>x.id===ef);
          return `<label style="font-size:.85rem;" data-turma-vinculo="${esc(t.id)}">${esc(t.name)}
          <select data-action="plano-turma-versao" data-tid="${esc(t.id)}" style="width:100%;">
            <option value="" ${!man?'selected':''}>Automático</option>
            <option value="__nenhum" ${man==='__nenhum'?'selected':''}>Nenhum plano</option>
            ${s.index.filter(x => planoDiscKey(x.disciplina)===planoDiscAtual()).map(x => `<option value="${esc(x.id)}" ${man===x.id?'selected':''}>${esc(x.titulo)}</option>`).join('')}
          </select>
          <span style="display:block; font-size:.76rem; text-transform:none; font-weight:400; color:${pl?'#1d6b31':'#888'};">${pl ? (o && o.tipo==='auto' ? `✔ ${esc(pl.titulo)} — automático (${esc(o.professor)}, ${esc(o.disciplina)})` : `✔ ${esc(pl.titulo)} — escolhido pela coordenação`) : (o && o.tipo==='desligado' ? 'sem plano (desligado)' : 'sem plano — nenhum professor da disciplina do plano nesta turma')}</span></label>`; }).join('')}
      </div>` : ''}
    </div>` : '';
  const turmasComPlano = turmas.filter(t => {
    const pid = s.turmaPlano[t.id]; if(!pid) return false;
    const p = state.professor;
    if(state.view==='coordenador' || !p.session) return true;
    const pl = s.index.find(x=>x.id===pid);
    return (p.disciplinas||[]).some(d => (d.turmaIds||[]).includes(t.id) && (!pl || !pl.disciplina || planoDiscCasa(d.name, pl.disciplina)));
  });
  if(!turmasComPlano.length){
    return `<h2>🗓️ Plano de Aulas do Livro</h2>${planoDiscSeletorHtml()}${avisos}${blocoCoord}
      <div class="card"><p>Nenhuma das suas turmas tem plano de aulas${planoDiscsDoUsuario().length > 1 ? ' nesta disciplina' : ''} ainda.</p><p class="muted">${state.view==='coordenador' ? 'Importe o plano e escolha a versão de cada turma no quadro acima.' : podeImportar ? 'Importe o plano e escolha a versão de cada turma no painel da coordenação (🗓️ Plano de Aulas do Livro).' : 'Peça à coordenação para importar o plano e escolher a versão da sua turma.'}</p></div>`;
  }
  const turmaId = turmasComPlano.some(t=>t.id===s.turmaSel) ? s.turmaSel : turmasComPlano[0].id;
  if(turmaId !== s.turmaSel){ s.turmaSel = turmaId; setTimeout(async()=>{ await planoCarregarTurma(turmaId); render(); },0); }
  const plano = s.planos[s.turmaPlano[turmaId]];
  const prog = s.prog[turmaId] || { dadas:{}, exercicios:{} };
  const seletor = `<label style="font-size:.9rem;">Turma: <select data-action="plano-turma-sel" style="min-width:200px;">${turmasComPlano.map(t=>`<option value="${esc(t.id)}" ${t.id===turmaId?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label>`;
  if(!plano) return `<h2>🗓️ Plano de Aulas do Livro</h2>${planoDiscSeletorHtml()}${avisos}${blocoCoord}<div class="card">${seletor}<p class="muted">Carregando o plano da turma…</p></div>`;
  const dadas = plano.aulas.filter(a => prog.dadas && prog.dadas[a.n]).length;
  const pct = Math.round(dadas / plano.aulas.length * 100);
  const hoje = planoAulaDeHoje(plano, prog);
  const vista = s.aulaVista && plano.aulas.find(a => a.n===s.aulaVista);
  const heroAula = vista || hoje;
  const nSlides = Object.keys(s.slides[plano.id]||{}).length;
  const bimAtual = hoje ? hoje.bimestre : (plano.aulas[plano.aulas.length-1]||{}).bimestre || 1;
  const bimF = s.bimFerramentas || bimAtual;
  const porBim = [1,2,3,4].map(b => ({ b, aulas: plano.aulas.filter(a=>a.bimestre===b) })).filter(x=>x.aulas.length);
  const lista = porBim.map(({b, aulas}) => `
    <details ${hoje && hoje.bimestre===b ? 'open' : ''} class="pl-bim">
      <summary>${b}º bimestre <span class="muted" style="font-weight:400;">· ${aulas.filter(a=>prog.dadas&&prog.dadas[a.n]).length} de ${aulas.length} aulas dadas</span>${pnpBimResumo(plano, turmaId, b)}</summary>
      <div>${aulas.map(a => {
        const dada = prog.dadas && prog.dadas[a.n];
        const temSlide = (s.slides[plano.id] && s.slides[plano.id][a.n]) || a.slides;
        const ex = prog.exercicios && prog.exercicios[a.n];
        const selo = dada ? '<span class="pl-selo pl-selo-ok">✓ dada</span>' : (hoje && hoje.n===a.n ? '<span class="pl-selo pl-selo-hoje">● hoje</span>' : (hoje && a.n===hoje.n+1 ? '<span class="pl-selo pl-selo-prox">próxima</span>' : ''));
        const aberta = s.aulaAberta===a.n;
        return `<div class="pl-item ${hoje&&hoje.n===a.n?'pl-item-hoje':''} ${aberta?'aberta':''}" data-action="plano-abrir-aula" data-n="${a.n}" role="button" tabindex="0">
          <span class="pl-item-n">${a.n}</span>
          <span class="pl-item-t">${esc(a.tituloCurto||a.tema)} <span class="muted">${a.paginas?'· '+esc(a.paginas):''}</span></span>
          ${pnpSeloAula(plano, turmaId, a)}${selo}
          <span title="slides" style="opacity:${temSlide?1:.2};">🖥️</span>
          <span title="${ex?'exercício aplicado':'exercício'}" style="opacity:${a.exercicio?(ex?1:.55):.15};">${ex?'📝✔':'📝'}</span>
          <span class="pl-item-seta">${aberta?'▴':'▾'}</span>
        </div>${aberta ? `<div style="padding:8px 0;">${planoAulaDetalheHtml(turmaId, plano, a, prog, false)}</div>` : ''}`;
      }).join('')}</div>
    </details>`).join('');
  const turmaBtns = turmasComPlano.length > 1
    ? `<div class="pl-turmas" data-pl-turmas>${turmasComPlano.map(t => `<button class="pl-turma ${t.id===turmaId?'ativa':''}" data-action="plano-turma-chip" data-tid="${esc(t.id)}">${esc(t.name)}</button>`).join('')}</div>`
    : `<div class="pl-turmas"><span class="pl-turma ativa" style="cursor:default;">${esc((turmasComPlano[0]||{}).name||'')}</span></div>`;
  const avisosProf = state.view==='coordenador' ? avisos : avisos.replace(/<div class="card" data-plano-msg[^]*?plano\(s\) importado\(s\)[^]*?<\/div>/, '');
  const revisaoHoje = !!(hoje && hoje.tipo==='Revisão'), provaHoje = !!(hoje && hoje.tipo==='Avaliação');
  return `
    ${sedHtml()}
    ${planoDiscSeletorHtml()}
    ${avisosProf}
    ${plano.aulas.some(a => a.exercicio) ? '' : `<div class="card" data-plano-sem-conteudo style="border-left:4px solid #C9A227;"><strong>⏳ As aulas da ${esc(plano.serie||'série')} ainda estão sendo preparadas.</strong><br><span style="font-size:.88rem;">Por enquanto o plano tem o roteiro de cada aula (tema, páginas do livro, objetivo e sugestões). Slides, exercícios, diagnóstica, níveis e trabalho em grupo aparecem aqui assim que o conteúdo desta série for importado.</span></div>`}
    ${podeImportar ? renderPlanoPainel() + renderPlanoFeedbackResumo(s.turmaPlano[turmaId]) : ''}
    <div class="card pl-cab" data-plano-cab>
      <div class="row" style="justify-content:space-between; align-items:center; gap:10px; flex-wrap:nowrap;">
        ${turmaBtns}
        <button class="btn btn-ghost btn-sm pl-engrenagem ${s.ajustesAbertos?'ativa':''}" data-action="pl-ajustes" title="Ajustes desta turma (data show, mapa do caderno)" style="width:auto;">⚙️</button>
      </div>
      <div class="pl-progresso"><div data-plano-progresso="${pct}" style="width:${pct}%;"></div></div>
      <div class="muted" style="font-size:.8rem; margin-top:4px;"><strong style="color:var(--ink,#333);">${esc(plano.titulo)}</strong> · ${dadas} de ${plano.aulas.length} aulas dadas (${pct}%)</div>
      ${s.ajustesAbertos ? planoCfgHtml(turmaId) : ''}
    </div>
    ${s.registroAberto ? renderPlanoRegistro(turmaId) : ''}
    ${renderRelatorio()}
    ${s.montarProva && s.montarProva.turmaId===turmaId ? renderMontarProva() : ''}
    ${s.recup && s.recup.turmaId===turmaId ? renderRecuperacao() : ''}
    ${(d => typeof plMestreDetalhe==='function' ? plMestreDetalhe(turmaId, plano, prog, hoje, heroAula, d) : d)(heroAula ? planoAulaDetalheHtml(turmaId, plano, heroAula, prog, true, { vendoOutra: !!vista && (!hoje || vista.n!==hoje.n) }) : '<div class="card"><h3>🎉 Todas as aulas do plano foram dadas!</h3></div>')}
    ${planoDiagnosticaHtml(turmaId, plano, prog, bimF)}
    ${plGrupoHtml('aulas', '📚 Todas as aulas', `${bimAtual}º bimestre · ${plano.aulas.filter(a=>a.bimestre===bimAtual && prog.dadas && prog.dadas[a.n]).length} de ${plano.aulas.filter(a=>a.bimestre===bimAtual).length} aulas dadas`, () => lista, false)}
    ${plGrupoHtml('aval', '📝 Avaliação do bimestre', `${bimF}º bimestre · prova, recuperação e resultados`, () => `
      <div class="row" style="gap:6px; flex-wrap:wrap; align-items:center; margin-bottom:8px;">
        <span style="font-size:.85rem;">Bimestre:</span>
        <select data-action="plano-bim-ferr" style="width:auto; padding:2px 6px;">${[1,2,3,4].filter(b => plano.aulas.some(a=>a.bimestre===b)).map(b => `<option value="${b}" ${bimF===b?'selected':''}>${b}º</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm" data-action="plano-montar-prova" data-b="${bimF}" style="width:auto;">📝 Montar prova</button>
        <button class="btn btn-ghost btn-sm" data-action="plano-recup-abrir" data-b="${bimF}" style="width:auto;">♻️ Recuperação personalizada</button>
        <button class="btn btn-ghost btn-sm" data-action="relatorio-abrir" data-escopo="turma" data-b="${bimF}" style="width:auto;">📈 Resultados</button>
        ${s.registroAberto ? '' : renderPlanoRegistro(turmaId)}
      </div>
      ${renderPlanoErros(turmaId, revisaoHoje)}`, revisaoHoje || provaHoje)}
    ${trilhaCatalogo(plano).length ? plGrupoHtml('trilhas', '🧭 Grandes perguntas', `${trilhaCatalogo(plano).length} perguntas · ${trilhaArea(trilhaCatalogo(plano)).lista}`, () => renderPlanoTrilhas(turmaId, plano), false) : ''}
    ${plGrupoHtml('habil', '📈 Habilidades e entregas', 'ENEM e entregas da turma', () => renderPlanoHabilidades(turmaId), false)}
    ${plGrupoHtml('pdf', '🖥️ Slides próprios (PDF)', nSlides ? `${nSlides} aula(s) com PDF` : 'opcional', () => `
      <p class="muted" style="font-size:.86rem; margin-top:0;">Selecione <strong>vários PDFs de uma vez</strong>. O app liga cada arquivo à aula pelo número no nome: <code>aula-01.pdf</code> → Aula 1, <code>aula-02.pdf</code> → Aula 2…</p>
      <label class="btn btn-primary btn-sm" style="cursor:pointer; width:auto;">⬆️ Enviar PDFs dos slides<input type="file" id="plano-slides-input" accept="application/pdf" multiple style="display:none;"></label>`, false)}
    ${blocoCoord}`;
}
function plGruposAbertos(){
  const s = planoState();
  if(!s.gruposAbertos){ try{ s.gruposAbertos = JSON.parse(localStorage.getItem('plano-grupos-abertos') || '{}') || {}; }catch(e){ s.gruposAbertos = {}; } }
  return s.gruposAbertos;
}
function plGrupoHtml(id, titulo, resumo, corpoFn, padraoAberto){
  const g = plGruposAbertos();
  const aberto = g[id]!=null ? !!g[id] : !!padraoAberto;
  return `<div class="card pl-grupo ${aberto?'aberto':''}" data-pl-grupo="${id}">
    <button class="pl-grupo-cab" data-action="pl-grupo" data-g="${id}" aria-expanded="${aberto}">
      <span class="pl-grupo-tit">${titulo}</span><span class="pl-grupo-res">${resumo}</span><span class="pl-grupo-seta">${aberto?'▴':'▾'}</span>
    </button>
    ${aberto ? `<div class="pl-grupo-corpo">${corpoFn()}</div>` : ''}
  </div>`;
}
async function calcFinalGrades(){
  const p = state.professor;
  const disciplina = p.disciplinas.find(d=>d.id===p.painelDisciplinaFiltro);
  if(!disciplina){ alert('Selecione a disciplina no topo do Meu Painel.'); return; }
  const tid = document.getElementById('painel-turma-select').value;
  if(!tid){ alert('Selecione a turma.'); return; }
  const t = p.turmas.find(x=>x.id===tid);
  const unidade = document.getElementById('final-unidade-select').value;
  p.finalGradesUnidade = unidade;
  p.finalGrades = { turmaId: tid, unidade, disciplinaId: disciplina.id, loading:true, rows:[], total:0, editMode:false };
  render();

  // Restrito à disciplina selecionada: um professor pode lecionar mais de uma disciplina na
  // mesma turma, e cada uma tem seus próprios instrumentos avaliativos — não podem se misturar.
  const relevant = p.assessments.filter(a => {
    if(!assessmentTurmaIds(a).includes(tid)) return false;
    if((a.unidade||'')!==unidade) return false;
    if(a.professorId){ if(a.professorId!==p.session.id) return false; } // pertence a outro professor
    const disciplinaBate = a.disciplinaId ? a.disciplinaId===disciplina.id : a.disciplinaName===disciplina.name;
    return disciplinaBate;
  });
  const overrides = await getNotasManuais(p.session.id, tid, unidade, disciplina.id);
  const { rows, total, semAluno } = await computeGradesForAssessments(relevant, p.pesos, t, unidade, overrides);

  p.finalGrades = { turmaId: tid, unidade, disciplinaId: disciplina.id, loading:false, rows, total, semAluno: semAluno||[], editMode:false };
  render();
}
async function vincularRespostaAoAluno(idx){
  const p = state.professor, fg = p.finalGrades;
  if(!fg || !fg.semAluno || !fg.semAluno[idx]) return;
  const item = fg.semAluno[idx];
  const sel = document.getElementById('vinc-sel-'+idx);
  const destino = sel ? sel.value : '';
  if(!destino){ alert('Escolha o aluno da turma que fez essa prova.'); return; }
  if(!confirm(`Vincular a prova de "${item.name}" ao aluno "${destino}"?`)) return;
  let responses = [];
  try{ const r = await window.storage.get(`responses:${item.code}`, true); responses = JSON.parse(r.value); }catch(e){ alert('Não foi possível ler as respostas dessa avaliação.'); return; }
  if(responses.some(r => mesmoNomeAluno(r.studentName, destino))){
    alert(`"${destino}" já tem uma prova registrada nessa avaliação. Abra "Resultados" da avaliação para decidir qual manter.`); return;
  }
  const alvo = responses.find(r => r.studentName===item.name);
  if(!alvo){ alert('Resposta não encontrada (talvez já tenha sido alterada). Recalcule as notas.'); return; }
  alvo.studentNameOriginal = alvo.studentName;
  alvo.studentName = destino;
  try{ await window.storage.set(`responses:${item.code}`, JSON.stringify(responses), true); }
  catch(e){ alert('Não foi possível salvar a alteração.'); return; }
  await calcFinalGrades();
  alert('Prova vinculada! A nota já aparece na tabela.');
}
function toggleEditFinalGrades(on){
  const fg = state.professor.finalGrades;
  if(!fg) return;
  fg.editMode = on;
  render();
}
async function saveManualGrades(tid){
  const p = state.professor;
  const fg = p.finalGrades;
  if(!fg || fg.turmaId!==tid) return;
  const overrides = {};
  const roundTo1 = v => Math.round(v*10)/10;
  fg.rows.forEach((r, idx) => {
    const entry = {};
    const readField = (elId, autoVal, key) => {
      const el = document.getElementById(elId);
      if(!el) return;
      const raw = el.value.trim();
      if(raw==='') return;
      const val = parseFloat(raw.replace(',', '.'));
      if(isNaN(val)) return;
      const roundedAuto = (autoVal===null || autoVal===undefined) ? null : roundTo1(autoVal);
      if(roundedAuto!==null && roundTo1(val)===roundedAuto) return;
      entry[key] = val;
    };
    readField(`manual-np1-${idx}`, r.autoNp1, 'np1');
    readField(`manual-diag-${idx}`, r.autoDiag, 'diag');
    readField(`manual-exerc-${idx}`, r.autoExerc, 'exerc');
    readField(`manual-auto-${idx}`, r.autoAuto, 'auto');
    readField(`manual-rec-${idx}`, r.autoRecuperacao, 'recuperacao');
    if(Object.keys(entry).length>0) overrides[r.name] = entry;
  });
  await window.storage.set(`notas-manuais:${p.session.id}:${tid}:${fg.unidade}:${fg.disciplinaId||'geral'}`, JSON.stringify(overrides), true);
  alert('Notas ajustadas manualmente foram salvas.');
  await calcFinalGrades(tid);
}
function exportFinalGradesXlsx(tid){
  const p = state.professor;
  const t = p.turmas.find(x=>x.id===tid);
  const fg = p.finalGrades;
  if(!t || !fg || fg.rows.length===0){ alert('Calcule as notas finais dessa turma antes de exportar.'); return; }
  const header = ['Aluno','NP1 (Simulado)','Diagnóstica','Exercícios','Autoavaliação','NP2','Recuperação','Nota Final', `de ${fg.total}`,'Situação'];
  const rows = fg.rows.map(r => [r.name, r.np1, r.diag, r.exerc, r.auto, r.np2, r.temRecuperacao ? r.recuperacao : '', r.final, '', r.precisaRecuperacao ? (r.temRecuperacao ? (r.final>=5 ? 'Recuperado' : 'Fez recuperação, ainda abaixo de 5') : 'Recuperação paralela') : '']);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Notas Finais');
  XLSX.writeFile(wb, `notas-finais-${t.name.replace(/[^a-z0-9]+/gi,'-')}-${fg.unidade.replace(/\s+/g,'-')}.xlsx`);
}
async function deleteTurma(tid){
  if(!confirm('Excluir esta turma? As avaliações já vinculadas a ela continuam existindo. Você pode restaurar pela Lixeira em até 30 dias.')) return;
  const p = state.professor;
  const t = p.turmas.find(x=>x.id===tid);
  p.turmas = p.turmas.filter(t=>t.id!==tid);
  p.viewingTurmaId = null;
  await saveTurmasToStorage();
  if(t) await moveToTrash('turma', t.name || 'Turma', t);
  render();
}
__parteOk('inclusao_grupo');
