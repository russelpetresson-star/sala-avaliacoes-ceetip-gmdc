/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "biblio_aluno" */
async function loadAlunoBiblioteca(){
  const al = state.aluno;
  try{
    const r = await window.storage.get('biblioteca-emprestimos', true);
    const todos = JSON.parse(r.value);
    al.bibliotecaTodos = todos;
    al.bibliotecaEmprestimos = todos.filter(e => e.studentId===al.matriculaStudentId);
  }catch(e){ al.bibliotecaEmprestimos = []; al.bibliotecaTodos = []; }
  try{ const r2 = await window.storage.get('biblioteca-livros', true); al.bibliotecaLivros = JSON.parse(r2.value) || []; }catch(e){ al.bibliotecaLivros = []; }
  if(al.stage==='dashboard') render();
}
function renderAlunoBibliotecaBlock(){
  const al = state.aluno;
  const emprestimos = (al.bibliotecaEmprestimos || []).map(e => ({ ...e, status: bibliotecaEmprestimoStatus(e), venceEmBreve: bibliotecaVenceEmBreve(e), dias: bibliotecaDiasAteVencer(e) }));
  if(emprestimos.length===0) return '';
  const ativos = emprestimos.filter(e => e.status!=='devolvido').sort((a,b) => (a.status==='atrasado'?0:1) - (b.status==='atrasado'?0:1));
  const anoAtual = new Date().getFullYear();
  const lidosNoAno = emprestimos.filter(e => e.status==='devolvido' && e.dataDevolucao && new Date(e.dataDevolucao+'T00:00:00').getFullYear()===anoAtual).length;
  return `
    <div class="card">
      <h3 style="margin-top:0;">📚 Biblioteca</h3>
      <p class="muted" style="margin-top:-4px;">Você já leu <strong>${lidosNoAno}</strong> livro(s) este ano.</p>
      ${ativos.length===0 ? '<p class="muted">Nenhum livro emprestado no momento.</p>' : ativos.map(e => `
        <div class="list-item" style="align-items:flex-start; flex-wrap:wrap;">
          <div>
            <strong>${esc(e.livroTitulo)}</strong><br>
            <span class="muted" style="font-size:.8rem;">Emprestado em ${bibliotecaFmtData(e.dataEmprestimo)} · devolução prevista em ${bibliotecaFmtData(e.dataPrevista)}</span>
          </div>
          ${e.status==='atrasado' ? '<span class="pill" style="background:var(--red); color:#fff;">Atrasado — devolva o quanto antes</span>'
            : e.venceEmBreve ? `<span class="pill" style="background:#c98a2b; color:#fff;">Vence em ${e.dias===0?'hoje':e.dias+' dia(s)'}</span>`
            : '<span class="pill">Emprestado</span>'}
        </div>
      `).join('')}
    </div>
  `;
}
async function loadCoordProfessorPesos(){
  const c = state.coordenador;
  c.professorPesosLoading = true;
  const map = {};
  // Um professor por vez era lento (soma a espera de cada um); agora todos em paralelo.
  await Promise.all(c.professores.filter(pr => pr.activatedAt).map(async pr => {
    try{ const r = await window.storage.get(`pesos-instrumentos:${pr.id}`, true); map[pr.id] = {...DEFAULT_PESOS, ...JSON.parse(r.value)}; }
    catch(e){ map[pr.id] = {...DEFAULT_PESOS}; }
  }));
  c.professorPesos = map;
  c.professorPesosLoading = false;
  render();
}
async function sendCoordNote(profId){
  const c = state.coordenador;
  const val = document.getElementById(`note-input-${profId}`).value.trim();
  if(!val) return;
  const list = await fetchProfessoresList();
  const rec = list.find(p=>p.id===profId);
  if(!rec) return;
  rec.coordNote = val;
  rec.coordNoteAt = Date.now();
  await saveProfessoresListRaw(list);
  c.professores = list;
  render();
}
async function clearCoordNote(profId){
  const c = state.coordenador;
  const list = await fetchProfessoresList();
  const rec = list.find(p=>p.id===profId);
  if(!rec) return;
  rec.coordNote = null;
  rec.coordNoteAt = null;
  await saveProfessoresListRaw(list);
  c.professores = list;
  render();
}
function exportCoordNotasXlsx(){
  const c = state.coordenador;
  const t = state.professor.turmas.find(x=>x.id===c.notasTurmaId);
  if(!c.notasColunas.length || !c.notasRows.length){ alert('Calcule as notas antes de exportar.'); return; }
  const header = ['Aluno', ...c.notasColunas.map(col => `${col.disciplinaName} (${col.professorName||''}) /${col.total}`)];
  const rows = c.notasRows.map(r => [r.name, ...c.notasColunas.map(col => { const g = col.grades[r.name]; return g!==undefined ? g.final : ''; })]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Notas Finais');
  const turmaName = t ? t.name.replace(/[^a-z0-9]+/gi,'-') : 'turma';
  XLSX.writeFile(wb, `notas-finais-${turmaName}-${c.notasUnidade.replace(/\s+/g,'-')}.xlsx`);
}
function imprimirNotasFinais(modo){
  const c = state.coordenador;
  const t = state.professor.turmas.find(x=>x.id===c.notasTurmaId);
  if(!c.notasColunas.length || !c.notasRows.length){ alert('Calcule as notas antes de imprimir.'); return; }
  const incluirNome = modo==='completo';
  const rows = c.notasRows.map(r => `
    <tr>
      <td>${esc(r.matricula||'-')}</td>
      ${incluirNome ? `<td>${esc(r.name)}</td>` : ''}
      ${c.notasColunas.map(col => { const g = col.grades[r.name]; return `<td style="text-align:center;">${g!==undefined?g.final.toFixed(1):'-'}</td>`; }).join('')}
    </tr>
  `).join('');
  const page = `
    <div class="pv-page">
      ${buildPrintHeader({ title: 'Notas Finais', subtitle: [t?t.name:'', c.notasUnidade].filter(Boolean).join(' · ') })}
      <table class="pv-sign-table" style="margin-top:10px;">
        <thead><tr>
          <th>Matrícula</th>
          ${incluirNome ? '<th>Nome</th>' : ''}
          ${c.notasColunas.map(col => `<th style="text-align:center;">${esc(col.disciplinaName)}</th>`).join('')}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
  printPages(page);
}
function imprimirBoletimAluno(studentName){
  const c = state.coordenador;
  const t = state.professor.turmas.find(x=>x.id===c.notasTurmaId);
  if(!c.notasColunas.length){ alert('Calcule as notas antes de imprimir o boletim.'); return; }
  const r = c.notasRows.find(x=>x.name===studentName);
  const rows = c.notasColunas.map(col => {
    const g = col.grades[studentName];
    return `<tr><td>${esc(col.disciplinaName)}</td><td>${esc(col.professorName||'-')}</td><td style="text-align:center;">${g!==undefined?g.final.toFixed(1):'-'}</td></tr>`;
  }).join('');
  const page = `
    <div class="pv-page">
      ${buildPrintHeader({ title: 'Boletim Individual', subtitle: [t?t.name:'', c.notasUnidade].filter(Boolean).join(' · ') })}
      <p style="margin:6px 0 14px; font-size:.95rem;"><strong>Aluno:</strong> ${esc(studentName)}${r&&r.matricula?' · <strong>Matrícula:</strong> '+esc(r.matricula):''}</p>
      <table class="pv-sign-table">
        <thead><tr><th>Disciplina</th><th>Professor</th><th style="text-align:center;">Nota final</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
  printPages(page);
}
async function calcCoordNotas(){
  const c = state.coordenador;
  const turmaId = document.getElementById('coord-notas-turma-select').value;
  const unidade = document.getElementById('coord-notas-unidade-select').value;
  c.notasTurmaId = turmaId;
  c.notasUnidade = unidade;
  const R = riscoState();
  R.calculado = false; R.turmaFiltro = ''; R.busca = '';
  if(!turmaId){ c.notasColunas=[]; c.notasRows=[]; render(); return; }
  c.notasLoading = true;
  c.notasColunas = []; c.notasRows = [];
  render();
  try{
    if(!c.assessments.length) await loadCoordAssessments();
    const turmas = turmaId==='__todas' ? state.professor.turmas.slice() : [state.professor.turmas.find(t=>t.id===turmaId)].filter(Boolean);
    await calcularRiscoEscolar(turmas, unidade);   // em turma única + unidade, também preenche c.notasColunas
    if(turmaId!=='__todas' && unidade!=='__ano' && turmas[0]){
      const turma = turmas[0];
      c.notasRows = turma.students.map(s => ({ name: s.name, matricula: s.matricula||'' }));
    }
  }catch(e){ alert('Não foi possível calcular agora. Verifique a internet e tente de novo.'); }
  c.notasLoading = false;
  render();
}
async function imprimirBoletimCompletoAluno(studentName){
  const c = state.coordenador;
  const turmaId = c.notasTurmaId;
  if(!turmaId){ alert('Calcule as notas antes de imprimir o boletim.'); return; }
  const t = state.professor.turmas.find(x=>x.id===turmaId);
  const r = c.notasRows.find(x=>x.name===studentName);
  c.boletimCompletoLoading = studentName;
  render();
  try{
    const porUnidade = {};
    // Unidades são independentes — calcula em paralelo (ver mesmo comentário em computeAlunoBoletim).
    const resultadosPorUnidade = await Promise.all(UNIDADES.map(u => calcColunasParaUnidade(turmaId, u, t)));
    UNIDADES.forEach((u, i) => { porUnidade[u] = resultadosPorUnidade[i]; });
    // union of disciplinas across all unidades, preserving alphabetical order
    const disciplinasMap = {};
    UNIDADES.forEach(u => {
      porUnidade[u].forEach(col => {
        if(!disciplinasMap[col.disciplinaName]) disciplinasMap[col.disciplinaName] = { disciplinaName: col.disciplinaName, professorName: col.professorName };
      });
    });
    const disciplinas = Object.values(disciplinasMap).sort((a,b)=>a.disciplinaName.localeCompare(b.disciplinaName, 'pt-BR'));

    const rows = disciplinas.map(d => {
      const notasPorUnidade = UNIDADES.map(u => {
        const col = porUnidade[u].find(c2 => c2.disciplinaName===d.disciplinaName);
        const g = col ? col.grades[studentName] : undefined;
        return g!==undefined ? g.final : null;
      });
      const validas = notasPorUnidade.filter(n => n!==null);
      const media = validas.length ? (validas.reduce((a,b)=>a+b,0) / validas.length) : null;
      return `
        <tr>
          <td>${esc(d.disciplinaName)}</td>
          <td>${esc(d.professorName||'-')}</td>
          ${notasPorUnidade.map(n => `<td style="text-align:center;">${n!==null?n.toFixed(1):'-'}</td>`).join('')}
          <td style="text-align:center;"><strong>${media!==null?media.toFixed(1):'-'}</strong></td>
        </tr>
      `;
    }).join('');

    const page = `
      <div class="pv-page">
        ${buildPrintHeader({ title: 'Boletim Individual — Ano Letivo', subtitle: t?t.name:'' })}
        <p style="margin:6px 0 14px; font-size:.95rem;"><strong>Aluno:</strong> ${esc(studentName)}${r&&r.matricula?' · <strong>Matrícula:</strong> '+esc(r.matricula):''}</p>
        <table class="pv-sign-table">
          <thead><tr>
            <th>Disciplina</th><th>Professor</th>
            ${UNIDADES.map(u => `<th style="text-align:center;">${esc(u)}</th>`).join('')}
            <th style="text-align:center;">Média</th>
          </tr></thead>
          <tbody>${rows.length?rows:'<tr><td colspan="'+(UNIDADES.length+3)+'" class="muted" style="text-align:center;">Nenhuma nota lançada ainda.</td></tr>'}</tbody>
        </table>
      </div>
    `;
    printPages(page);
  } finally {
    c.boletimCompletoLoading = null;
    render();
  }
}
async function openCoordResults(code){
  const c = state.coordenador;
  const a = c.assessments.find(x=>x.code===code);
  c.resultsFor = a;
  c.resultsLoading = true;
  c.mode = 'results';
  render();
  try{ const r = await window.storage.get(`responses:${code}`, true); c.responses = JSON.parse(r.value); }catch(e){ c.responses = []; }
  c.resultsLoading = false;
  render();
}
__parteOk('biblio_aluno');
