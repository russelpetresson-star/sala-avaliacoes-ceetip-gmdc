/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "formacao" */
const FM_T_FORM = 'formacao', FM_T_DEMO = 'demo-formacao', FM_DISC = 'Formação', FM_PLANO_ID = 'formacao-app-B';
function fmState(){ const c = state.coordenador; if(!c.fm) c.fm = { cfg:null, carregando:false, msg:'', erro:'', prog:'', profs:null, nPart:30 }; return c.fm; }
function fmTurmasPainel(){ const ts = state.professor.turmas || []; return state.coordenador && state.coordenador.modoDemo ? ts.filter(t => t.demo) : ts.filter(t => !t.demo && !t.formacao); }
function fmTemDemo(){ return (state.professor.turmas || []).some(t => t.demo); }
function fmChipDemo(){
  if(!fmTemDemo()) return '';
  const f = fmState(); if(!f.cfg && !f.cfgLido){ f.cfgLido = true; fmLerCfg().then(c => { if(c) f.cfg = c; }).catch(() => {}); }
  const on = !!state.coordenador.modoDemo;
  return `<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0;padding:8px 10px;border-radius:10px;background:${on ? '#FFF4D6' : 'transparent'};border:1px dashed #C9A227;">
    <button class="btn ${on ? 'btn-primary' : 'btn-ghost'} btn-sm" data-fm="modo-demo" style="width:auto;">🎓 ${on ? 'Voltar aos dados reais' : 'Mostrar a turma Demo (formação)'}</button>
    <span class="muted" style="font-size:.8rem;">${on ? '<b>Mostrando dados fictícios da turma Demo.</b> Nada aqui é de aluno real.' : 'A turma Demo (dados fictícios) fica fora deste painel.'}</span></div>`;
}
function fmRng(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const FM_NOMES = ['Ana Beatriz Lima','Bruno Henrique Souza','Camila Rodrigues','Daniel Ferreira','Eduarda Santos','Felipe Almeida','Gabriela Nunes','Heitor Barbosa',
  'Isabela Carvalho','João Pedro Rocha','Kauã Oliveira','Larissa Gomes','Lucas Martins','Maria Clara Dias','Matheus Ribeiro','Nicole Araújo','Otávio Pereira',
  'Pietra Cardoso','Rafael Teixeira','Sofia Mendes','Thiago Correia','Valentina Costa','Vinícius Moura','Yasmin Freitas','Arthur Pinto','Bianca Castro',
  'Caio Monteiro','Débora Vieira','Enzo Batista','Fernanda Lopes'];
const FM_DISCS = ['Língua Portuguesa','Matemática','História','Geografia','Biologia','Física','Química','Língua Inglesa','Desenho Técnico','Segurança do Trabalho'];
async function fmLerCfg(){ try{ return JSON.parse((await window.storage.get('formacao-config', true)).value); }catch(e){ return null; } }
async function fmCarregar(){
  const f = fmState(); f.carregando = true; render();
  try{ if(!state.professor.turmas || !state.professor.turmas.length) await loadTurmas(); }catch(e){}
  f.cfg = await fmLerCfg();
  try{ f.profs = JSON.parse((await window.storage.get('professores', true)).value) || []; }catch(e){ f.profs = []; }
  f.carregando = false; render();
}
function fmDataLocal(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
async function fmGerarDemo(criadas){
  const rnd = fmRng(1412);
  const turmas = state.professor.turmas || [];
  const T = turmas.find(t => t.id===FM_T_DEMO); if(!T) throw new Error('turma Demo não encontrada');
  const al = T.students;
  // perfis: 0–17 bons, 18–21 risco baixo, 22–24 médio, 25–26 alto (26 com média global < 3), 27–28 frequência < 75%, 29 atenção (78%)
  const perfil = i => i<18 ? 'bom' : i<22 ? 'baixo' : i<25 ? 'medio' : i<27 ? 'alto' : i<29 ? 'falta' : 'atencao';
  const nota = (i, d, u) => {
    const p = perfil(i); let v = 6.2 + rnd()*3.3;
    if(p==='baixo' && (d==='Matemática' || (i%2 && d==='Física'))) v = 3 + rnd()*1.6;
    if(p==='medio' && ['Matemática','Desenho Técnico','Segurança do Trabalho'].includes(d)) v = 2.8 + rnd()*1.8;   // 3 componentes → risco médio
    if(p==='alto') v = i===26 ? 1 + rnd()*2.2 : 2.5 + rnd()*2.4;
    if(p==='alto' && i===25 && ['Língua Portuguesa','História','Geografia'].includes(d)) v = 5.5 + rnd()*1.5;
    if(u===2 && p==='bom' && d==='Matemática') v -= 2.2;   // queda na III Unidade (vira destaque no painel)
    return Math.max(0, Math.min(10, Math.round(v*10)/10));
  };
  for(const d of FM_DISCS) for(let ui = 0; ui < 3; ui++){
    const u = UNIDADES[ui]; const code = `DEMO${FM_DISCS.indexOf(d)}${ui}`;
    const a = { code, title: `[Demonstração] ${d} - ${u}`, instrumento:'avaliacao', unidade:u, disciplinaId:null, disciplinaName:d, turmaIds:[FM_T_DEMO],
      questions:[{ id:'q', type:'mc', text:'Nota (demonstração)', points:10, image:null, annulled:false, descritorSaeb:'', conteudo:'', options:[{id:'a',text:'—'},{id:'b',text:'—'}], correctOptionId:null }],
      startAt:null, endAt:new Date(2000,0,1).toISOString(), resultRelease:{ mode:'imediato', releaseAt:'' }, securityEnabled:false, professorId:null, professorName:'Demonstração',
      createdAt: Date.now(), updatedAt:null, importadoCsv:true, demo:true };
    await window.storage.set('assessment:' + code, JSON.stringify(a), true); criadas.add('assessment:' + code);
    await window.storage.set('responses:' + code, JSON.stringify(al.map((s, i) => ({ studentName:s.name, submittedAt:Date.now(), total: nota(i, d, ui), details:[], answers:{}, tabSwitches:0, fullscreenExits:0, manual:true, importadoCsv:true }))), true);
    criadas.add('responses:' + code);
    f_prog(`Notas: ${d} · ${u}`);
  }
  // chamadas: últimos 20 dias de segunda a sexta até hoje
  const hoje = new Date(); const dias = []; const x = new Date(hoje);
  while(dias.length < 20){ const dw = x.getDay(); if(dw>=1 && dw<=5) dias.unshift(fmDataLocal(x)); x.setDate(x.getDate()-1); }
  const ultimo = dias.length - 1;
  for(let k = 0; k < dias.length; k++){
    const d = dias[k]; const pres = [];
    al.forEach((s, i) => { const p = perfil(i);
      let falta = rnd() < 0.05;
      if(p==='falta') falta = (k % 3 === 0) || k===ultimo;            // ~65% de frequência
      if(p==='atencao') falta = k % 5 === 1 || k===ultimo-6;            // ~78%
      if(i===26) falta = k % 2 === 0;                                    // aluno com provável evasão
      if(i===5) falta = k >= ultimo-1;                                   // 2 faltas seguidas (ontem e hoje)
      if(i===9) falta = k >= ultimo-2 && k!==ultimo-3;                   // 3 faltas recentes
      if(k===ultimo && i===12) falta = false;
      if(falta) return;
      let mi = 35 + Math.floor(rnd()*30); if(k===ultimo && [3, 14, 20, 23, 28].includes(i)) mi = 72 + Math.floor(rnd()*15);
      const h = new Date(d + 'T06:00:00'); h.setMinutes(h.getMinutes() + mi);
      pres.push({ studentId:s.id, matricula:s.matricula, name:s.name, horario:h.getTime(), manual:false, status: mi > 70 ? 'atrasado' : 'presente' }); });
    await window.storage.set(`chamada:${FM_T_DEMO}:${d}`, JSON.stringify({ presentes: pres }), true); criadas.add(`chamada:${FM_T_DEMO}:${d}`);
  }
  f_prog('Chamadas da Demo');
  // contatos fictícios (números 79 9 0000-00xx, não pertencem a ninguém da escola); 4 sem telefone
  for(let i = 0; i < al.length; i++){
    const s = al[i]; const k = buscaAtivaAlunoKey(s.id);
    const doc = i>=26 && i<=27 || i===16 || i===8 ? { nomeResponsavel:'', telefone:'', registros:[], autorizaWhatsapp:false, demo:true }
      : { nomeResponsavel: ['Mãe','Pai','Avó','Tia'][i%4] + ' de ' + s.name.split(' ')[0], telefone: `(79) 90000-${String(i+1).padStart(4,'0')}`, registros:[], autorizaWhatsapp: i!==11, demo:true };
    await window.storage.set(k, JSON.stringify(doc), true); criadas.add(k);
  }
  return dias;
}
const FM_MISSOES = [
  { id:'aula', t:'Dar uma aula ao vivo no laboratório', ok: ev => (ev.aula_viva||0) > 0 },
  { id:'jogo', t:'Jogar um jogo da turma com questões do ENEM', ok: ev => Object.keys(ev).some(k => k.startsWith('jogo:') && ev[k] > 0) },
  { id:'aula2027', t:'Deixar a primeira aula de 2027 pronta', ok: ev => (ev.mais_opcoes||0) + (ev.exercicio||0) + (ev.simulado||0) > 0 } ];
function fmLabId(pid){ return 'lab-' + String(pid).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40); }
function fmPrimeiroNome(p){ return String((p && (p.displayName || p.email)) || '').split(/[\s@]/)[0] || 'Professor'; }
async function fmAbrirLab(){
  const f = fmState(); if(!f.cfg){ f.erro = 'Prepare a formação primeiro.'; render(); return; }
  f.trabalhando = true; f.erro = ''; f.msg = ''; f_prog('Abrindo os laboratórios de férias…');
  try{
    await loadTurmas(); const profs = (f.profs || []).filter(p => p && p.id);
    let turmas = (state.professor.turmas || []).filter(t => !t.lab);
    const labs = profs.map((p, i) => { const id = fmLabId(p.id); const nn = String(i+1).padStart(2, '0'); const ant = (state.professor.turmas || []).find(t => t.id===id);
      const st = ['A','B'].map(x => ({ id: id + '-' + x, name: 'ALUNO TESTE ' + x, matricula: 'LAB' + nn + x, passwordHash: null, activatedAt: null }));
      return { id, name: 'Lab · ' + fmPrimeiroNome(p), turno: 'manha', formacao: true, lab: true, professorId: p.id,
        students: st.map(s => Object.assign({}, s, ant ? ((ant.students || []).find(x => x.id===s.id) || {}) : {})) }; });
    turmas = turmas.concat(labs); await window.storage.set('turmas', JSON.stringify(turmas), true); state.professor.turmas = turmas;
    const tp = await planoLerJson('plano-livro-turmas', {}); const dk = planoDiscKey(FM_DISC);
    for(const t of labs){ tp[`${t.id}|${dk}`] = FM_PLANO_ID;
      let ds = []; try{ ds = JSON.parse((await window.storage.get(`disciplinas:${t.professorId}`, true)).value) || []; }catch(e){}
      const atual = ds.find(d => d.id==='disc-formacao'); const ids = [...new Set(((atual && atual.turmaIds) || []).concat([t.id]))];
      ds = ds.filter(d => d.id!=='disc-formacao').concat([{ id:'disc-formacao', name: FM_DISC, turmaIds: ids, createdAt: Date.now() }]);
      await window.storage.set(`disciplinas:${t.professorId}`, JSON.stringify(ds), true); f_prog('Laboratório de ' + t.name.slice(6)); }
    await window.storage.set('plano-livro-turmas', JSON.stringify(tp), true);
    try{ await planoAtualizarEfetivo(); }catch(e){}
    f.cfg = Object.assign({}, f.cfg, { lab: { em: Date.now(), profs: labs.map(t => t.professorId), turmas: labs.map(t => t.id) }, criadas: [...new Set((f.cfg.criadas || []).concat(labs.map(t => 'turmadoc:' + t.id)))] });
    await window.storage.set('formacao-config', JSON.stringify(f.cfg), true);
    f.msg = `🏖️ Laboratórios abertos para ${labs.length} professor(es). Imprima os cartões do laboratório e entregue no fechamento.`;
  }catch(e){ f.erro = 'Não foi possível abrir os laboratórios: ' + (e.message||e); }
  f.trabalhando = false; f.prog = ''; render();
}
async function fmCarregarMissoes(){
  const f = fmState(); f.missoes = { carregando:true }; render();
  const meses = []; const d = new Date(2026, 11, 1); const fim = new Date(); fim.setDate(1);
  while(d <= fim || meses.length===0){ meses.push(usoMes(d)); d.setMonth(d.getMonth()+1); if(meses.length > 6) break; }
  const porProf = {};
  try{ const r = await window.storage.list('uso:professor:', true);
    for(const k of (r.keys || [])){ const partes = k.split(':'); const mes = partes[3]; if(!meses.includes(mes)) continue; const o = await planoLerJson(k, null); if(!o) continue;
      const ev = porProf[partes[2]] = porProf[partes[2]] || {}; Object.entries(o).forEach(([key, n]) => { if(key.startsWith('acao:')) ev[key.slice(5)] = (ev[key.slice(5)]||0) + n; }); } }catch(e){}
  f.missoes = { porProf, meses, em: Date.now() }; render();
}
function fmMissoesHtml(){
  const f = fmState(); if(!f.cfg || !f.cfg.lab) return '';
  if(!f.missoes) setTimeout(fmCarregarMissoes, 0);
  if(!f.missoes || f.missoes.carregando) return '<h3 style="margin-top:16px;">🏖️ Missões de férias</h3><div class="spinner"></div>';
  const profs = (f.profs || []).filter(p => f.cfg.lab.profs.includes(p.id));
  const linhas = profs.map(p => { const ev = f.missoes.porProf[p.id] || {}; const ok = FM_MISSOES.map(m => m.ok(ev)); return { p, ok, n: ok.filter(Boolean).length }; }).sort((a, b) => b.n - a.n || String(a.p.displayName||'').localeCompare(String(b.p.displayName||''), 'pt-BR'));
  const todas = linhas.filter(l => l.n===FM_MISSOES.length).length;
  return `<h3 style="margin-top:16px;">🏖️ Missões de férias</h3>
    <p class="muted" style="font-size:.85rem;">Contadas pelo registro de uso do app desde dezembro/2026. ${todas} de ${linhas.length} professor(es) cumpriram as três missões. <a href="#" data-fm="missoes">🔄 atualizar</a></p>
    <div class="table-scroll"><table data-fm-missoes><tr><th>Professor</th><th>Laboratório</th>${FM_MISSOES.map((m, i) => `<th>${i+1}. ${esc(m.t)}</th>`).join('')}</tr>
    ${linhas.map(l => `<tr><td><b>${esc(l.p.displayName || l.p.email || l.p.id)}</b>${l.n===FM_MISSOES.length ? ' 🏅' : ''}</td><td class="muted">LAB${String(f.cfg.lab.profs.indexOf(l.p.id)+1).padStart(2,'0')}A / B</td>${l.ok.map(o => `<td style="text-align:center;">${o ? '✅' : '—'}</td>`).join('')}</tr>`).join('')}</table></div>`;
}
function fmCartoesLab(){
  const f = fmState(); if(!f.cfg || !f.cfg.lab) return; const url = location.origin + location.pathname;
  const profs = (f.profs || []).filter(p => f.cfg.lab.profs.includes(p.id));
  const card = (p) => { const nn = String(f.cfg.lab.profs.indexOf(p.id)+1).padStart(2, '0');
    return `<div class="c"><div class="t">🏖️ Laboratório de férias · Sala de Avaliações</div><div class="n">${esc(p.displayName || p.email || '')}</div>
    <div class="m">Sua turma de treino: <b>Lab · ${esc(fmPrimeiroNome(p))}</b> · alunos de teste: <b>LAB${nn}A</b> e <b>LAB${nn}B</b></div>
    <ol><li>No computador, entre com a sua conta (<b>${esc(url)}</b>) → <b>Minhas turmas → Aulas do plano</b> → disciplina <b>Formação</b> → turma <b>Lab</b> → Aula 2 → <b>Apresentar</b>.</li>
    <li>No celular, abra o app → <b>Aluno → Entrar com matrícula</b> → LAB${nn}A (crie uma senha) e responda como aluno.</li></ol>
    <div class="ms"><b>Missões de férias</b>${FM_MISSOES.map((m, i) => `<div>☐ ${i+1}. ${esc(m.t)}${i===1 ? ' (Ferramentas → Jogos da turma → turma Lab)' : i===2 ? ' (Aulas do plano → sua disciplina → aula 1 → Mais opções)' : ''}</div>`).join('')}
    <div class="pr">Quem cumprir as três ganha destaque e certificado na jornada pedagógica de 2027. 🏅</div></div></div>`; };
  const w = window.open('', '_blank'); if(!w) return;
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cartões do laboratório de férias</title><style>
    body{font-family:Arial,sans-serif;margin:8mm;color:#222;} .c{border:1.5px dashed #6B1F2E;border-radius:8px;padding:5mm 6mm;margin-bottom:6mm;page-break-inside:avoid;font-size:10.5pt;}
    .t{color:#6B1F2E;font-weight:700;font-size:9pt;letter-spacing:.04em;text-transform:uppercase;} .n{font-size:15pt;font-weight:700;margin:2mm 0;} .m{color:#6B1F2E;} ol{margin:2mm 0 2mm 5mm;padding:0;}
    .ms{background:#FFF4D6;border-radius:6px;padding:3mm 4mm;} .ms div{margin:1mm 0;} .pr{margin-top:2mm;font-weight:700;color:#6B1F2E;} .c:nth-child(3n){page-break-after:always;}
    </style></head><body>${profs.map(card).join('')}<script>setTimeout(function(){window.print();},400);<\/script></body></html>`);
  w.document.close();
}
function f_prog(t){ const f = fmState(); f.prog = t; render(); }
async function fmPreparar(){
  const f = fmState(); f.erro = ''; f.msg = '';
  const profId = (document.querySelector('[data-fm-prof]')||{}).value || '';
  const n = Math.max(5, Math.min(60, parseInt((document.querySelector('[data-fm-n]')||{}).value, 10) || 30));
  if(!profId){ f.erro = 'Escolha o professor que vai apresentar (a conta onde a disciplina “Formação” vai aparecer).'; render(); return; }
  f.trabalhando = true; f_prog('Criando as turmas…');
  try{
    const criadas = new Set((f.cfg && f.cfg.criadas) || []);
    await loadTurmas();
    let turmas = (state.professor.turmas || []).filter(t => t.id!==FM_T_FORM && t.id!==FM_T_DEMO);
    const tForm = { id: FM_T_FORM, name: 'Formação', turno: 'manha', formacao: true, students: Array.from({ length: n }, (_, i) => ({ id: 'fm-p' + (i+1), name: 'Participante ' + String(i+1).padStart(2,'0'), matricula: 'FORM' + String(i+1).padStart(2,'0'), passwordHash: null, activatedAt: null })) };
    const tDemo = { id: FM_T_DEMO, name: 'Demo', turno: 'manha', formacao: true, demo: true, students: FM_NOMES.map((nm, i) => ({ id: 'fm-d' + (i+1), name: nm.toUpperCase(), matricula: 'DEMO' + String(i+1).padStart(2,'0'), passwordHash: null, activatedAt: null })) };
    const antigaForm = (state.professor.turmas || []).find(t => t.id===FM_T_FORM);
    if(antigaForm){ tForm.students = tForm.students.map(s => Object.assign({}, s, (antigaForm.students || []).find(x => x.id===s.id) || {})); }   // mantém as senhas já criadas
    turmas = turmas.concat([tForm, tDemo]);
    await window.storage.set('turmas', JSON.stringify(turmas), true); state.professor.turmas = turmas;
    criadas.add('turmadoc:' + FM_T_FORM); criadas.add('turmadoc:' + FM_T_DEMO);
    f_prog('Disciplina do apresentador…');
    let discs = []; try{ discs = JSON.parse((await window.storage.get(`disciplinas:${profId}`, true)).value) || []; }catch(e){}
    const antDisc = discs.find(d => d.id==='disc-formacao'); const outrasT = ((antDisc && antDisc.turmaIds) || []).filter(x => String(x).startsWith('lab-'));
    discs = discs.filter(d => d.id!=='disc-formacao').concat([{ id:'disc-formacao', name: FM_DISC, turmaIds:[FM_T_FORM, FM_T_DEMO].concat(outrasT), createdAt: Date.now() }]);
    await window.storage.set(`disciplinas:${profId}`, JSON.stringify(discs), true);
    f_prog('Plano da formação…');
    const pac = FM_PLANO_PAC; const pl = pac.planos[0];
    await planoSalvarDoc(pl);
    const index = (await planoLerJson('plano-livro-index', [])) || [];
    const resumo = { id:pl.id, titulo:pl.titulo, disciplina:pl.disciplina, serie:pl.serie, versao:pl.versao, descricao:pl.descricao, totalAulas:pl.aulas.length, comExercicios: pl.aulas.filter(a => a.exercicio).length };
    const ii = index.findIndex(x => x.id===pl.id); if(ii>=0) index[ii] = resumo; else index.push(resumo);
    await window.storage.set('plano-livro-index', JSON.stringify(index), true);
    try{ const atuais = await planoLerJson('plano-livro-icones', {}); await window.storage.set('plano-livro-icones', JSON.stringify(Object.assign({}, atuais || {}, pac.icones)), true); AV_ICONES = null; }catch(e){}
    const tp = await planoLerJson('plano-livro-turmas', {}); const dk = planoDiscKey(FM_DISC);
    tp[`${FM_T_FORM}|${dk}`] = pl.id; tp[`${FM_T_DEMO}|${dk}`] = pl.id;
    await window.storage.set('plano-livro-turmas', JSON.stringify(tp), true);
    try{ PLANO_IDX_CACHE = index; await planoAtualizarEfetivo(); }catch(e){}
    f_prog('Dados fictícios da turma Demo…');
    const dias = await fmGerarDemo(criadas);
    const cfg = Object.assign({}, f.cfg && f.cfg.lab ? { lab: f.cfg.lab } : {}, { preparadoEm: Date.now(), professorId: profId, nParticipantes: n, demoAte: dias[dias.length-1], criadas: [...criadas] });
    await window.storage.set('formacao-config', JSON.stringify(cfg), true); f.cfg = cfg;
    if(state.coordenador.rk) state.coordenador.rk.calculado = false; if(state.coordenador.dsp) state.coordenador.dsp.cubo = null; if(state.coordenador.avp) state.coordenador.avp.dados = null;
    try{ await loadCoordAssessments(); }catch(e){}
    f.msg = `✅ Formação preparada: turma Formação (${n} participantes), turma Demo (30 alunos fictícios) e o plano “Formação — Sala de Avaliações” na conta do apresentador.`;
  }catch(e){ f.erro = 'Não foi possível preparar: ' + (e && e.message || e); }
  f.trabalhando = false; f.prog = ''; render();
}
async function fmAtualizarDemo(){
  const f = fmState(); f.trabalhando = true; f.erro = ''; f.msg = '';
  try{ await loadTurmas(); const criadas = new Set((f.cfg && f.cfg.criadas) || []); const dias = await fmGerarDemo(criadas);
    f.cfg = Object.assign({}, f.cfg || {}, { criadas:[...criadas], demoAte: dias[dias.length-1] }); await window.storage.set('formacao-config', JSON.stringify(f.cfg), true);
    if(state.coordenador.rk) state.coordenador.rk.calculado = false; if(state.coordenador.dsp) state.coordenador.dsp.cubo = null; if(state.coordenador.avp) state.coordenador.avp.dados = null;
    f.msg = '✅ Chamadas e avisos da turma Demo atualizados até hoje.'; }catch(e){ f.erro = 'Não foi possível atualizar: ' + (e.message||e); }
  f.trabalhando = false; f.prog = ''; render();
}
async function fmRemover(){
  const f = fmState(); if(!confirm('Remover a formação? Apaga as turmas Formação, Demo e os laboratórios de férias, os dados fictícios, o plano da formação e a disciplina “Formação” dos professores. Faça isso só depois da volta às aulas.')) return;
  f.trabalhando = true; f.erro = ''; f.msg = ''; render();
  try{
    const cfg = f.cfg || await fmLerCfg() || { criadas: [] };
    await loadTurmas(); const turmas = (state.professor.turmas || []).filter(t => t.id!==FM_T_FORM && t.id!==FM_T_DEMO && !t.lab);
    await window.storage.set('turmas', JSON.stringify(turmas), true); state.professor.turmas = turmas;
    for(const pid of ((cfg.lab && cfg.lab.profs) || [])){ if(pid===cfg.professorId) continue; try{ const ds = JSON.parse((await window.storage.get(`disciplinas:${pid}`, true)).value) || []; await window.storage.set(`disciplinas:${pid}`, JSON.stringify(ds.filter(d => d.id!=='disc-formacao')), true); }catch(e){} }
    for(const k of (cfg.criadas || [])){ f_prog('Apagando ' + k); try{ await window.storage.delete(k, true); }catch(e){} }
    // avisos e respostas da turma Formação (exercícios dos participantes)
    try{ const av = await window.storage.list('aviso-pais:', true); for(const k of Object.keys(av.values || {})){ if(/:fm-[pd]\d+:/.test(k)) await window.storage.delete(k, true); } }catch(e){}
    if(cfg.professorId){ try{ const discs = JSON.parse((await window.storage.get(`disciplinas:${cfg.professorId}`, true)).value) || []; await window.storage.set(`disciplinas:${cfg.professorId}`, JSON.stringify(discs.filter(d => d.id!=='disc-formacao')), true); }catch(e){} }
    try{ const idx = ((await planoLerJson('plano-livro-index', [])) || []).filter(x => x.id!==FM_PLANO_ID); await window.storage.set('plano-livro-index', JSON.stringify(idx), true); await planoApagarDoc(FM_PLANO_ID); PLANO_IDX_CACHE = idx;
      const tp = await planoLerJson('plano-livro-turmas', {}); Object.keys(tp).forEach(k => { if(k.startsWith(FM_T_FORM + '|') || k.startsWith(FM_T_DEMO + '|') || k.startsWith('lab-') || tp[k]===FM_PLANO_ID) delete tp[k]; }); await window.storage.set('plano-livro-turmas', JSON.stringify(tp), true);
      await planoAtualizarEfetivo(); }catch(e){}
    try{ await window.storage.delete('formacao-config', true); }catch(e){}
    f.cfg = null; state.coordenador.modoDemo = false; try{ await loadCoordAssessments(); }catch(e){}
    if(state.coordenador.rk) state.coordenador.rk.calculado = false; if(state.coordenador.dsp) state.coordenador.dsp.cubo = null; if(state.coordenador.avp) state.coordenador.avp.dados = null;
    f.msg = '🧹 Formação removida. Os painéis voltam a mostrar só as turmas da escola.';
  }catch(e){ f.erro = 'Não foi possível remover tudo: ' + (e.message||e); }
  f.trabalhando = false; f.prog = ''; render();
}
function fmFolhaLogins(){
  const t = (state.professor.turmas || []).find(x => x.id===FM_T_FORM); if(!t) return;
  const url = location.origin + location.pathname;
  const card = s => `<div class="c"><div class="t">Sala de Avaliações · Formação 14/12</div><div class="n">${esc(s.name)}</div>
    <div class="m">Matrícula: <b>${esc(s.matricula)}</b></div><ol><li>No tablet, abra <b>${esc(url)}</b></li><li>Toque em <b>Aluno</b> → <b>Entrar com matrícula</b></li><li>Digite a matrícula acima e crie uma senha (ex.: 1234)</li></ol></div>`;
  const w = window.open('', '_blank'); if(!w) return;
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Logins da formação</title><style>
    body{font-family:Arial,sans-serif;margin:8mm;color:#222;} .g{display:grid;grid-template-columns:1fr 1fr;gap:5mm;} .c{border:1.5px dashed #6B1F2E;border-radius:6px;padding:4mm 5mm;page-break-inside:avoid;font-size:10.5pt;}
    .t{color:#6B1F2E;font-weight:700;font-size:9pt;letter-spacing:.04em;text-transform:uppercase;} .n{font-size:14pt;font-weight:700;margin:2mm 0;} .m{font-size:13pt;color:#6B1F2E;} ol{margin:2mm 0 0 5mm;padding:0;font-size:9.5pt;}
    </style></head><body><div class="g">${(t.students || []).map(card).join('')}</div><script>setTimeout(function(){window.print();},400);<\/script></body></html>`);
  w.document.close();
}
function renderFormacao(){
  const f = fmState(); if(!f.profs && !f.carregando) setTimeout(fmCarregar, 0);
  if(f.carregando || !f.profs) return '<div class="card"><h2>🎓 Formação de professores</h2><div class="spinner"></div></div>';
  const cfg = f.cfg; const prof = cfg && f.profs.find(p => p.id===cfg.professorId);
  const passos = [
    ['Antes do dia', 'Preparar a formação (este botão) e abrir os laboratórios de férias. Imprimir a folha de logins (recortar) e os cartões do laboratório (um por professor). Testar o projetor com a apresentação.'],
    ['Na manhã do dia 14', '“Atualizar a Demo para hoje”, para as chamadas e os avisos da turma Demo ficarem com a data do dia.'],
    ['Durante', 'Entrar na conta do apresentador → Minhas turmas → Aulas do plano → turma Formação → aula ao vivo. Nos painéis da coordenação, “🎓 Mostrar a turma Demo”.'],
    ['Nas férias', 'Os laboratórios ficam abertos: cada professor treina em casa. Acompanhe as missões de férias nesta tela.'],
    ['Na volta às aulas', 'Destaque e certificado para quem cumpriu as três missões. Depois, “Remover a formação” apaga as turmas Formação, Demo e os laboratórios, os dados fictícios, o plano e a disciplina da formação.']];
  return `<div class="card" data-fm><h2>🎓 Formação de professores · 14/12/2026</h2>
    <p class="muted">Prepara no app tudo o que a formação usa: a turma <b>Formação</b> (os professores entram como alunos pela matrícula), a turma <b>Demo</b> com 30 alunos fictícios (notas, chamadas, telefones) para mostrar risco, desempenho e avisos sem expor alunos reais, e o plano <b>Formação — Sala de Avaliações</b> (3 aulas) na conta de quem vai apresentar.</p>
    ${cfg ? `<div class="q-card" style="margin:8px 0;"><b>✅ Formação preparada</b> em ${new Date(cfg.preparadoEm).toLocaleString('pt-BR')} · apresentador: <b>${esc(prof ? (prof.displayName || prof.email || prof.id) : cfg.professorId)}</b> · ${cfg.nParticipantes} participantes · dados da Demo até ${esc(String(cfg.demoAte||'').split('-').reverse().join('/'))}</div>` : ''}
    <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;margin-top:8px;">
      <div><label>Quem vai apresentar</label><select data-fm-prof><option value="">Escolha…</option>${f.profs.map(p => `<option value="${esc(p.id)}" ${cfg && cfg.professorId===p.id ? 'selected' : ''}>${esc(p.displayName || p.email || p.id)}</option>`).join('')}</select></div>
      <div><label>Participantes</label><input type="number" data-fm-n min="5" max="60" value="${cfg ? cfg.nParticipantes : f.nPart}" style="width:90px;"></div>
      <button class="btn btn-primary btn-sm" data-fm="preparar" style="width:auto;" ${f.trabalhando ? 'disabled' : ''}>${cfg ? '🔄 Preparar de novo' : '🎓 Preparar a formação'}</button>
      ${cfg ? `<button class="btn btn-ghost btn-sm" data-fm="logins" style="width:auto;">🖨️ Folha de logins</button>
      <button class="btn btn-ghost btn-sm" data-fm="atualizar-demo" style="width:auto;" ${f.trabalhando ? 'disabled' : ''}>📅 Atualizar a Demo para hoje</button>
      <button class="btn btn-ghost btn-sm" data-fm="lab" style="width:auto;" ${f.trabalhando ? 'disabled' : ''}>🏖️ ${cfg.lab ? 'Atualizar' : 'Abrir'} os laboratórios de férias</button>
      ${cfg.lab ? '<button class="btn btn-ghost btn-sm" data-fm="cartoes" style="width:auto;">🖨️ Cartões do laboratório</button>' : ''}
      <button class="btn btn-ghost btn-sm" data-fm="remover" style="width:auto;color:#b3261e;" ${f.trabalhando ? 'disabled' : ''}>🧹 Remover a formação</button>` : ''}
    </div>
    ${f.trabalhando ? `<div class="spinner" style="margin-top:10px;"></div><p class="muted" style="text-align:center;">${esc(f.prog||'')}</p>` : ''}
    ${f.msg ? `<p style="color:#2e7d32;font-weight:600;margin-top:10px;">${esc(f.msg)}</p>` : ''}${f.erro ? `<p class="err">${esc(f.erro)}</p>` : ''}
    <h3 style="margin-top:16px;">Passo a passo</h3>
    ${fmMissoesHtml()}
    ${passos.map(([t, x], i) => `<div class="list-item" style="align-items:flex-start;"><span><b>${i+1}. ${t}:</b> ${x}</span></div>`).join('')}
    <p class="muted" style="font-size:.8rem;margin-top:10px;">Os telefones da turma Demo são fictícios (79 90000-00xx) e o robô do WhatsApp ignora as turmas de formação. Na fila de avisos, “Enviar” na turma Demo só simula o envio.</p></div>`;
}
__parteOk('formacao');
