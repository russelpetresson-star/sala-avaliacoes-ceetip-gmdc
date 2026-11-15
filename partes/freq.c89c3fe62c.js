/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "freq" */
async function calcFrequenciaStats(turma){
  await ensureDiasLetivosLoaded();
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0,10);
  const dias = [];
  for(let i=0;i<31;i++){
    const d = new Date(hoje); d.setDate(d.getDate()-i);
    dias.push(d.toISOString().slice(0,10));
  }
  const registros = await Promise.all(dias.map(async dateStr => {
    if(!isDiaLetivo(dateStr)) return { dateStr, letivo:false, presentes:null };
    try{
      const r = await window.storage.get(`chamada:${turma.id}:${dateStr}`, true);
      const parsed = JSON.parse(r.value);
      return { dateStr, letivo:true, presentes: parsed.presentes || [] };
    }catch(e){ return { dateStr, letivo:true, presentes:null }; }
  }));
  const comData = registros.filter(r => r.letivo && r.presentes!==null);
  const mesAtual = hojeStr.slice(0,7);
  const comDataMes = comData.filter(r => r.dateStr.slice(0,7)===mesAtual);
  const seteDiasAtras = new Date(hoje); seteDiasAtras.setDate(seteDiasAtras.getDate()-6);
  const semanaInicioStr = seteDiasAtras.toISOString().slice(0,10);
  const comDataSemana = comData.filter(r => r.dateStr >= semanaInicioStr);
  function pctPresenca(regs){
    if(regs.length===0 || turma.students.length===0) return null;
    let totalPresencas=0, totalPossivel=0;
    regs.forEach(r => { totalPresencas += r.presentes.length; totalPossivel += turma.students.length; });
    return Math.round((totalPresencas/totalPossivel)*100);
  }
  const hojeRegistro = registros.find(r => r.dateStr===hojeStr);
  const faltasPorAluno = {};
  const faltasGeralPorAluno = {};
  (turma.students||[]).forEach(s => {
    faltasPorAluno[s.id] = { student:s, faltas:0, diasComputados:0 };
    faltasGeralPorAluno[s.id] = { student:s, faltas:0, diasComputados:0 };
  });
  comDataMes.forEach(r => {
    const presentesIds = new Set(r.presentes.map(x=>x.studentId));
    turma.students.forEach(s => {
      faltasPorAluno[s.id].diasComputados++;
      if(!presentesIds.has(s.id)) faltasPorAluno[s.id].faltas++;
    });
  });
  // "Geral" por aluno = mesma janela dos últimos 31 dias usada no geralPct da turma (não é
  // o ano letivo inteiro, por custo de leitura — cada dia é uma chamada separada ao storage).
  comData.forEach(r => {
    const presentesIds = new Set(r.presentes.map(x=>x.studentId));
    turma.students.forEach(s => {
      faltasGeralPorAluno[s.id].diasComputados++;
      if(!presentesIds.has(s.id)) faltasGeralPorAluno[s.id].faltas++;
    });
  });
  const ranking = Object.values(faltasPorAluno).filter(x=>x.diasComputados>0).sort((a,b)=>b.faltas-a.faltas);
  return {
    diaLetivoHoje: isDiaLetivo(hojeStr),
    diaria: (hojeRegistro && hojeRegistro.letivo) ? { presentes: hojeRegistro.presentes?hojeRegistro.presentes.length:0, total: turma.students.length, temRegistro: hojeRegistro.presentes!==null } : null,
    geralPct: pctPresenca(comData),
    semanalPct: pctPresenca(comDataSemana),
    mensalPct: pctPresenca(comDataMes),
    diasComputadosMes: comDataMes.length,
    diasComputadosGeral: comData.length,
    ranking,
    faltasPorAlunoId: Object.fromEntries(Object.entries(faltasPorAluno).map(([id,v])=>[id,v])),
    faltasGeralPorAlunoId: Object.fromEntries(Object.entries(faltasGeralPorAluno).map(([id,v])=>[id,v]))
  };
}
async function ensureFreqStats(turmaId, turma, forceRefresh, silent){
  const cache = state.freqStatsCache[turmaId];
  if(cache && !forceRefresh) return;
  state.freqStatsCache[turmaId] = { loading:true, stats: cache ? cache.stats : null };
  if(!silent) render();
  const stats = await calcFrequenciaStats(turma);
  state.freqStatsCache[turmaId] = { loading:false, stats };
  if(!silent) render();
}
function renderFreqPainelBody(turma){
  const cache = state.freqStatsCache[turma.id];
  if(!cache || cache.loading){
    return `<div class="spinner"></div>`;
  }
  const s = cache.stats;
  if(!s) return '<p class="muted">Não foi possível calcular a frequência.</p>';
  const pct = v => v===null ? '—' : v+'%';
  const presentesHojeValor = !s.diaLetivoHoje ? '—' : (s.diaria && s.diaria.temRegistro ? `${s.diaria.presentes}/${s.diaria.total}` : 'sem registro');
  return `
    <div class="stat-row">
      ${renderStatTile('👥', presentesHojeValor, 'Alunos presentes hoje', 'teal')}
      ${renderStatTile('📊', pct(s.geralPct), 'Média geral de frequência', 'vinho')}
      ${renderStatTile('📈', pct(s.semanalPct), 'Frequência na semana', 'coral')}
      ${renderStatTile('📅', pct(s.mensalPct), 'Frequência no mês', 'plum')}
    </div>
    <h3 style="margin-top:18px;">🏅 Ranking de faltas no mês (${s.diasComputadosMes} dia(s) computado(s))</h3>
    ${s.ranking.length===0 ? '<p class="muted">Ainda não há dados suficientes este mês.</p>' : s.ranking.slice(0,15).map((r,i) => `
      <div class="list-item">
        <span>${i+1}º · ${esc(r.student.name)}${r.student.matricula?' <span class="muted">· mat. '+esc(r.student.matricula)+'</span>':''}</span>
        <span class="muted">${r.faltas} falta(s) de ${r.diasComputados}</span>
      </div>
    `).join('')}
    <div class="row" style="margin-top:12px;">
      <button class="btn btn-ghost btn-sm" data-action="freq-painel-atualizar" data-tid="${turma.id}">🔄 Atualizar</button>
    </div>
  `;
}
function renderFreqPainel(painelState, turmas){
  const turma = turmas.find(t=>t.id===painelState.turmaId);
  if(turma) ensureFreqStats(turma.id, turma);
  return `
    <div class="card">
      <h2>📊 Painel de Frequência</h2>
      <p class="muted">Frequência diária, semanal e mensal, e o ranking dos alunos com mais faltas — por turma.</p>
      <label>Turma</label>
      <select id="freq-painel-turma-select" class="input">
        <option value="">Selecione...</option>
        ${turmas.map(t=>`<option value="${t.id}" ${painelState.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}
      </select>
      ${!turma ? '<p class="muted center" style="margin-top:14px;">Selecione uma turma para ver a frequência.</p>' : `<div style="margin-top:14px;">${renderFreqPainelBody(turma)}</div>`}
    </div>
  `;
}
function renderTurmaDetail(t){
  const p = state.professor;
  const fg = p.finalGrades;
  ensureFreqStats(t.id, t);
  const freqCache = state.freqStatsCache[t.id];
  const faltasPorAlunoId = (freqCache && freqCache.stats) ? freqCache.stats.faltasPorAlunoId : {};
  return `
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2>${esc(t.name)}</h2>
        <div class="row" style="flex:0 0 auto; gap:8px;">
          <button class="btn btn-ghost btn-sm" data-action="print-signature-list" data-tid="${t.id}">Lista de assinatura (impressão)</button>
          <button class="btn btn-danger btn-sm" data-action="delete-turma" data-tid="${t.id}">Excluir turma</button>
        </div>
      </div>
      <div class="row" style="align-items:center; gap:8px; margin-top:6px;">
        <label style="margin:0;">Turno da turma:</label>
        <select id="turma-turno-select" data-tid="${t.id}" style="max-width:160px;">
          <option value="">Não definido</option>
          ${TURNOS.map(tu => `<option value="${esc(tu)}" ${t.turno===tu?'selected':''}>${esc(tu)}</option>`).join('')}
        </select>
        <span class="muted" style="font-size:.78rem;">Usado para filtrar as turmas no Controle de Frequência (turmas da manhã e integral) e para calcular o horário de entrada/tolerância.</span>
      </div>
      ${t.students.length===0 ? '<p class="muted">Nenhum aluno ainda.</p>' : t.students.map(s => { ensureStudentGamification(s); const fa = faltasPorAlunoId[s.id]; return `
        <div class="student-chip">
          <span>${studentAvatarHtml(s,26)} ${esc(s.name)}${s.matricula?' <span class="muted">· mat. '+esc(s.matricula)+'</span>':' <span class="muted">· sem matrícula</span>'}${s.passwordHash?' <span class="muted">· acesso ativo</span>':''} <span class="pill" style="font-size:.7rem; padding:1px 8px;">🎫 ${s.fichas}</span>${fa && fa.diasComputados>0 ? ` <span class="pill" style="font-size:.7rem; padding:1px 8px;" title="Faltas no mês">🪪 ${fa.faltas} falta(s)/mês</span>` : ''}</span>
          <div class="row" style="flex:0 0 auto; gap:6px;">
            <button class="btn btn-ghost btn-sm" data-action="award-ficha-manual" data-tid="${t.id}" data-sid="${s.id}" title="Dar 1 ficha por participação">+🎫</button>
            <button class="btn btn-ghost btn-sm" data-action="set-student-matricula" data-tid="${t.id}" data-sid="${s.id}">${s.matricula?'Editar matrícula':'Definir matrícula'}</button>
            ${s.passwordHash ? `<button class="btn btn-ghost btn-sm" data-action="reset-student-password" data-tid="${t.id}" data-sid="${s.id}">Redefinir senha</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-action="apoio-abrir" data-sid="${s.id}" title="Apoio: leitura em voz alta, letra maior, tempo extra, versão de apoio">♿${apoioResumo(s) ? ' ' + apoioResumo(s) : ''}</button>
            <button class="btn btn-danger btn-sm" data-action="remove-student" data-tid="${t.id}" data-sid="${s.id}">✕</button>
          </div>
        </div>
        ${state.professor.apoioAberto===s.id ? apoioPainelHtml(t, s) : ''}
      `; }).join('')}
      ${t.students.length>0 ? `
        <h3 style="margin-top:22px;">🏆 Ranking de Fichas</h3>
        ${[...t.students].map(s=>ensureStudentGamification(s)).sort((a,b)=>b.fichas-a.fichas).slice(0,10).map((s,i) => `
          <div class="list-item">
            <span>${i+1}º · ${studentAvatarHtml(s,26)} ${esc(s.name)}</span>
            <span class="muted">${s.fichas} ficha(s)</span>
          </div>
        `).join('')}
      ` : ''}
      <div class="row" style="margin-top:12px;">
        <input type="text" id="new-student-input" placeholder="Nome do aluno" value="${esc(p.newStudentName)}">
        <input type="text" id="new-student-matricula-input" placeholder="Matrícula" style="max-width:140px;">
        <button class="btn btn-ghost" data-action="add-student" data-tid="${t.id}" style="flex:0 0 auto;">Adicionar</button>
      </div>
      <label style="margin-top:12px;">Ou importe vários de uma vez (.csv, .xlsx)</label>
      <input type="file" id="turma-roster-file-${t.id}" data-action="import-turma-roster-file" data-tid="${t.id}" accept=".csv,.xlsx,.xls">
      <p class="muted" style="font-size:.8rem;">Primeira coluna: nome. Segunda coluna (opcional): matrícula. É adicionado à lista já existente.</p>

      <h3 style="margin-top:24px;">📊 Frequência da turma</h3>
      ${renderFreqPainelBody(t)}

      <h3 style="margin-top:24px;">Nota final do bimestre</h3>
      <p class="muted">As notas por instrumento avaliativo dessa turma agora ficam em <strong>📊 Meu Painel</strong> (turma vinculada a alguma disciplina sua aparece lá automaticamente).</p>
      <button class="btn btn-ghost btn-sm" data-action="sub-view" data-sub="painel">Ir para Meu Painel</button>

      <div style="margin-top:16px;">
        <button class="btn btn-ghost" data-action="back-to-turmas">← Voltar às turmas</button>
      </div>
    </div>
  `;
}
function renderFinalGradesTable(){
  const fg = state.professor.finalGrades;
  if(!fg) return '';
  if(fg.loading) return '<div class="spinner"></div>';
  const pesos = state.professor.pesos;
  const emRecuperacao = fg.rows.filter(r=>r.precisaRecuperacao);
  const editMode = !!fg.editMode;
  return `
    <div class="row" style="justify-content:space-between; align-items:center;">
      <p class="muted" style="margin-top:10px; font-size:.86rem;" data-nota-calculo>Nota final = NP1 + NP2 ${infoI(`<p><b>NP1</b> é o Simulado/Avaliação (${pesos.avaliacao} pts).</p><p><b>NP2</b> não é uma nota separada: é a soma de Diagnóstica (${pesos.diagnostica}) + Exercícios (${pesos.exercicios}) + Autoavaliação (${pesos.autoavaliacao}).</p><p><b>Recuperação Paralela:</b> vale a maior nota entre a recuperação e a NP1 (a recuperação nunca diminui a nota).</p><p><b>Autoavaliação:</b> calculada sozinha pelo engajamento — 40% fichas, 30% frequência de login, 30% entrega de exercícios de fixação. Se a coordenação ativar a opção em "Avaliação Socioemocional", ela passa a vir da nota socioemocional do período (💛).</p>`, 'Como a nota é calculada')}</p>
      <div class="row" style="flex:0 0 auto; gap:8px;">
        ${editMode ? `
          <button class="btn btn-ghost btn-sm" data-action="cancel-edit-final-grades">Cancelar</button>
          <button class="btn btn-primary btn-sm" data-action="save-manual-grades" data-tid="${fg.turmaId}">💾 Salvar edições</button>
        ` : `
          <button class="btn btn-ghost btn-sm" data-action="toggle-edit-final-grades" data-tid="${fg.turmaId}">✏️ Editar notas manualmente</button>
          <button class="btn btn-ghost btn-sm" data-action="export-final-grades-xlsx" data-tid="${fg.turmaId}">Exportar .xlsx</button>
        `}
      </div>
    </div>
    ${emRecuperacao.length>0 ? `
      <div class="card" style="background:var(--accent-red-bg,#fbeaea); border:1px solid var(--red); margin:10px 0;">
        <strong>🔺 ${emRecuperacao.length} aluno(s) em recuperação paralela nesta unidade (nota abaixo de 5)</strong>
      </div>
    ` : ''}
    ${editMode ? '<p class="muted" style="font-size:.8rem;">Edite qualquer campo abaixo para corrigir uma nota lançada por engano. Deixe em branco para manter o cálculo automático.</p>' : ''}
    <div class="table-scroll">
    <table>
      <tr>
        <th rowspan="2">Aluno</th>
        <th rowspan="2">NP1<br><span class="muted" style="font-weight:400; text-transform:none;">(Simulado)</span></th>
        <th colspan="4">NP2 = Diagnóstica + Exercícios + Autoavaliação</th>
        <th rowspan="2">Recuperação</th>
        <th rowspan="2">Nota Final<br><span class="muted" style="font-weight:400; text-transform:none;">(NP1 + NP2)</span></th>
        <th rowspan="2">Situação</th>
      </tr>
      <tr>
        <th>Diag.</th><th>Exerc.</th><th>Auto.</th><th>= NP2</th>
      </tr>
      ${fg.rows.map((r,idx) => `
        <tr>
          <td>${esc(r.name)}</td>
          <td>${editMode ? `<input type="number" step="0.1" id="manual-np1-${idx}" value="${r.np1.toFixed(1)}" style="width:70px;">` : `${r.np1.toFixed(1)}${r.manual.np1?' <span title="Nota ajustada manualmente">✏️</span>':''}`}</td>
          <td>${editMode ? `<input type="number" step="0.1" id="manual-diag-${idx}" value="${r.diag.toFixed(1)}" style="width:70px;">` : `${r.diag.toFixed(1)}${r.manual.diag?' ✏️':''}`}</td>
          <td>${editMode ? `<input type="number" step="0.1" id="manual-exerc-${idx}" value="${r.exerc.toFixed(1)}" style="width:70px;">` : `${r.exerc.toFixed(1)}${r.manual.exerc?' ✏️':''}`}</td>
          <td>${editMode ? `<input type="number" step="0.1" id="manual-auto-${idx}" value="${r.auto.toFixed(1)}" style="width:70px;">` : `${r.auto.toFixed(1)} ${r.autoOrigem==='socio' ? `<span class="muted" style="font-size:.72rem;" title="Nota da Avaliação Socioemocional">(💛 ${fmtNota(r.socioTotal)}/10)</span>` : r.autoOrigem==='socio-pendente' ? `<span class="muted" style="font-size:.72rem; color:#b3402f;" title="A Avaliação Socioemocional substitui a autoavaliação e este aluno ainda não respondeu: nota zerada até responder">(💛 não respondeu)</span>` : `<span class="muted" style="font-size:.72rem;" title="Engajamento (a Avaliação Socioemocional ainda não foi respondida)">(${Math.round((r.engajamento||0)*100)}%)</span>`}${r.manual.auto?' ✏️':''}`}</td>
          <td><strong>${r.np2.toFixed(1)}</strong></td>
          <td>${editMode ? `<input type="number" step="0.1" id="manual-rec-${idx}" value="${r.temRecuperacao ? r.recuperacao.toFixed(1) : ''}" placeholder="—" style="width:70px;">` : (r.temRecuperacao ? `${r.recuperacao.toFixed(1)}${r.manual.recuperacao?' ✏️':''}${r.recuperacaoValeu===false?'<br><span class="muted" style="font-size:.72rem;" title="A recuperação ficou menor ou igual à NP1, então vale a NP1">menor que a NP1 — vale a NP1</span>':''}` : '<span class="muted">—</span>')}</td>
          <td><strong>${r.final.toFixed(1)} / ${fg.total}</strong></td>
          <td>${r.precisaRecuperacao ? (r.temRecuperacao ? (r.final>=5 ? '<span class="pill" style="background:var(--green); color:#fff;">✅ Recuperado</span>' : '<span class="pill" style="background:#e07b24; color:#fff;">♻️ Fez recup. — ainda abaixo de 5</span>') : '<span class="pill" style="background:var(--red); color:#fff;">🔺 Recup. paralela</span>') : ''}</td>
        </tr>
      `).join('')}
    </table>
    </div>
    ${(fg.semAluno||[]).length>0 ? `
      <div class="card" style="border:2px solid var(--red); margin-top:16px;">
        <h3 style="margin-top:0;">⚠ Provas feitas com nome diferente do da turma</h3>
        <p class="muted" style="font-size:.85rem;">Estas provas não entraram nas notas porque o nome digitado pelo aluno não bate com nenhum nome da lista da turma. Escolha o aluno certo e vincule — a nota passa a contar.</p>
        ${fg.semAluno.map((it,i) => `
          <div class="list-item">
            <div><strong>${esc(it.name)}</strong><br><span class="muted">${esc(it.title||it.code)} · ${it.max>0 ? (it.total/it.max*10).toFixed(1) : '—'} / 10</span></div>
            <div class="row" style="flex:0 0 auto; gap:6px;">
              <select id="vinc-sel-${i}" style="max-width:240px;">
                <option value="">Escolha o aluno...</option>
                ${(state.professor.turmas.find(t=>t.id===fg.turmaId)||{students:[]}).students.map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('')}
              </select>
              <button class="btn btn-primary btn-sm" data-action="vincular-resposta-aluno" data-idx="${i}">Vincular</button>
            </div>
          </div>`).join('')}
      </div>` : ''}
    <h3 style="margin-top:22px;">Gráfico por aluno</h3>
    ${renderFinalGradesChart(fg)}
  `;
}
function renderFinalGradesChart(fg){
  if(fg.rows.length===0) return '<p class="muted">Nenhum aluno com dados ainda.</p>';
  const total = fg.total || 1;
  const rows = fg.rows.map(r => {
    const segs = [
      {label:'NP1', value:r.np1, color:'var(--green)'},
      {label:'Diagnóstica', value:r.diag, color:'var(--yellow-dark)'},
      {label:'Exercícios', value:r.exerc, color:'var(--purple)'},
      {label:'Autoavaliação', value:r.auto, color:'var(--red)'},
    ];
    return `
      <div class="chart-row">
        <div class="chart-label">${esc(r.name)}</div>
        <div class="stack-track">
          ${segs.map(s => s.value>0 ? `<div class="stack-seg" style="width:${(s.value/total)*100}%; background:${s.color};" title="${s.label}: ${s.value.toFixed(1)}"></div>` : '').join('')}
        </div>
        <div class="chart-pct">${r.final.toFixed(1)} / ${total}</div>
      </div>
    `;
  }).join('');
  return `
    <div class="legend-row">
      <span class="legend-item"><span class="legend-dot" style="background:var(--green)"></span>NP1 — Avaliação</span>
      <span class="legend-item"><span class="legend-dot" style="background:var(--yellow-dark)"></span>Diagnóstica</span>
      <span class="legend-item"><span class="legend-dot" style="background:var(--purple)"></span>Exercícios</span>
      <span class="legend-item"><span class="legend-dot" style="background:var(--red)"></span>Autoavaliação</span>
    </div>
    ${rows}
  `;
}
__parteOk('freq');
