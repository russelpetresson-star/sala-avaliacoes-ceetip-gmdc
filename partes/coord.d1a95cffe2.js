/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "coord" */
function renderCoordenador(){
  const c = state.coordenador;
  if(!c.session) return renderCoordLogin();
  // Carrega os dados de Monitoria de Desempenho cedo (mesmo fora da tela de Monitoria)
  // só pra manter o contador de "casos novos de intervenção" no menu lateral em dia.
  if(state.professor.unlockRequestsLoading){ loadUnlockRequests(); }
  if(!c.monitoria.loaded && !c.monitoria.loading){ loadCoordMonitoria(); }
  // Mesma lógica: carrega cedo pra manter o contador de pendentes do "Jovens Protagonistas" em dia.
  if(!c.campanha.loaded && !c.campanha.loading){ loadCampanhaCoord(); }
  // Idem pra Busca Ativa (o contador de acionamentos só fica certo depois que cada turma
  // apadrinhada for visitada pelo menos uma vez, mas carregar os vínculos cedo já ajuda).
  if(!c.buscaAtiva.loaded && !c.buscaAtiva.loading){ loadCoordBuscaAtiva(); }
  if(c.subview==='quiz' && state.professor.quiz.presentationMode && state.professor.quiz.current){
    return renderQuizPresentation() + (state.professor.aulaViva && state.professor.aulaViva.presenting ? `<button class="btn btn-primary" data-action="av-voltar-do-quiz" style="position:fixed; right:16px; bottom:16px; z-index:9500;">↩ Voltar à aula</button>` : '');
  }
  if(c.subview==='roleta' && state.professor.roleta.presentationMode){
    return renderRoletaPresentation();
  }
  if(c.subview==='duelo' && state.professor.duelo.presentationMode && state.professor.duelo.current){
    return renderDueloPresentation();
  }
  if(c.subview==='slides' && state.professor.slides.presentationMode && state.professor.slides.current){
    return renderSlidesPresentation();
  }
  if(state.professor.aulaViva && state.professor.aulaViva.presenting && state.professor.aulaViva.sess){
    return renderAulaVivaProf();
  }
  const topBar = `
    <div class="row" style="align-items:center; justify-content:space-between; margin-bottom:10px;">
      <span class="muted" style="font-size:.85rem;">Painel do coordenador</span>
      <div class="row" style="flex:0 0 auto; gap:6px;">
        ${renderThemeToggleBtn()}
        <button class="btn btn-ghost btn-sm" data-action="start-tour" data-role="coordenador">🧭 Tour</button>
        <button class="btn btn-ghost btn-sm" data-action="coord-logout">Sair</button>
      </div>
    </div>
  `;
  // Menu da coordenação enxuto: 7 seções no menu lateral, abas no topo com as telas de cada seção
  // (mesmo modelo do professor e do aluno). As telas continuam as mesmas (c.subview).
  const navCoord = navSidebarItens('coordenador', COORD_SECOES, c.subview, {
    aval: liberacoesVisiveis().filter(r=>!r.released).length || 0,
    alunos: (monitoriaIntervencaoNaoVistosCount() || 0) + (buscaAtivaAcionamentosNaoVistosCount() || 0) + (campanhaPendentesCount() || 0),
  });
  const sidebarItems = navCoord.itens;
  let content;
  if(c.subview==='dashboard') content = renderCoordDashboard();
  else if(c.subview==='professores') content = renderCoordProfessores();
  else if(c.subview==='frequencia') content = renderCoordFrequenciaProfessores();
  else if(c.subview==='turmas') content = renderTurmas();
  else if(c.subview==='chamada') content = renderChamada(null, true);
  else if(c.subview==='freqpainel') content = renderFreqPainel(state.professor.freqPainel, state.professor.turmas);
  else if(c.subview==='freqconfig') content = renderCoordFreqConfig();
  else if(c.subview==='liberacoes') content = renderLiberacoes();
  else if(c.subview==='aplic') content = renderAplic();
  else if(c.subview==='sessao') content = renderCoordSessao();
  else if(c.subview==='notas') content = renderCoordNotas();
  else if(c.subview==='saeseescola') content = renderSaeseEscola();
  else if(c.subview==='socio') content = renderCoordSocio();
  else if(c.subview==='monitoria') content = renderCoordMonitoria();
  else if(c.subview==='buscaativa') content = renderCoordBuscaAtiva();
  else if(c.subview==='campanha') content = renderCoordCampanha();
  else if(c.subview==='diario') content = renderCoordDiario();
  else if(c.subview==='portfolio') content = renderCoordPortfolio();
  else if(c.subview==='conquistas') content = renderCoordConquistas();
  else if(c.subview==='importarnotas') content = renderImportarNotasCsv();
  else if(c.subview==='importarfreq') content = renderImportarFreq();
  else if(c.subview==='riscodash') content = pnTab('risco');
  else if(c.subview==='pnarea') content = pnTab('area');
  else if(c.subview==='desempenho') content = pnTab('desemp');
  else if(c.subview==='avisospais') content = renderAvisosPais();
  else if(c.subview==='formacao') content = renderFormacao();
  else if(c.subview==='pesosprof') content = renderCoordPesosProf();
  else if(c.subview==='periodos') content = renderCoordPeriodos();
  else if(c.subview==='bloco') content = renderBlocoProvas(c.assessments);
  else if(c.subview==='avulso') content = renderGabaritoAvulso();
  else if(c.subview==='livros') content = renderLivrosDidaticos(true);
  else if(c.subview==='planolivro') content = renderPlanoLivro();
  else if(c.subview==='usoapp') content = renderCoordUso();
  else if(c.subview==='pmaescola') content = pnTab('pma');
  else if(c.subview==='calhor') content = renderCoordCalHor();
  else if(c.subview==='areabim') content = renderAreaBimestre();
  else if(c.subview==='kitsaese') content = renderKitSaese();
  else if(c.subview==='prioridade') content = renderPrior();
  else if(c.subview==='labs') content = renderLabs();
  else if(c.subview==='mural') content = renderMuralAvisos(true);
  else if(c.subview==='enquete') content = renderEnqueteRelampago();
  else if(c.subview==='quiz') content = renderQuizEquipes();
  else if(c.subview==='roleta') content = renderRoleta();
  else if(c.subview==='duelo') content = renderDuelo();
  else if(c.subview==='slides') content = renderSlides();
  else if(c.subview==='lixeira') content = renderLixeira();
  else if(c.subview==='ia') content = renderCoordIA();
  else if(c.subview==='temporada') content = renderCoordTemporada();
  else content = c.mode==='results' ? renderCoordResults() : renderCoordAssessments();
  content = navAbasHtml('coordenador', COORD_SECOES, c.subview) + content;
  return `<div class="app-topbar">${topBar}</div><div class="app-shell">${renderSidebar(sidebarItems, navCoord.atualSub, null)}<div class="app-main">${content}</div></div>`;
}
function renderCoordSessao(){
  const cfg = SESSAO_CFG;
  const opcMin = [[20,'20 minutos'],[30,'30 minutos'],[60,'1 hora'],[120,'2 horas'],[240,'4 horas'],[480,'8 horas'],[720,'12 horas'],[1440,'24 horas']];
  const opcTol = [[0,'Nenhuma — bloqueia na hora (como era antes)'],[10,'10 segundos'],[15,'15 segundos'],[30,'30 segundos'],[60,'1 minuto']];
  const sel = (id, opcoes, atual) => `<select id="${id}" data-action="sessao-cfg" data-campo="${id.replace('sessao-','')}" style="max-width:340px;">${opcoes.map(([v,t]) => `<option value="${v}" ${Number(atual)===v?'selected':''}>${t}</option>`).join('')}</select>`;
  return `
    <div class="card" data-sessao-config="1">
      <h2>🔐 Sessão e prova</h2>
      <h3 style="margin-top:14px;">Manter conectado</h3>
      <p class="muted">Se o aluno ou o professor sair do aplicativo (trocar de app, fechar o navegador, o celular recarregar a página), ele volta já conectado enquanto não passar este tempo <strong>sem usar</strong> o app. Ao tocar em "Sair", a sessão acaba na hora.</p>
      <label>Professores</label>
      ${sel('sessao-profMin', opcMin, cfg.profMin)}
      <p class="muted" style="font-size:.82rem;">Também é o tempo de inatividade para o professor ser desconectado com o app aberto. Em computadores compartilhados, prefira um tempo curto.</p>
      <label>Alunos</label>
      ${sel('sessao-alunoMin', opcMin.concat([[4320,'3 dias'],[10080,'7 dias (tablet fixo do aluno)'],[43200,'30 dias (tablet fixo do aluno)']]), cfg.alunoMin)}
      <p class="muted" style="font-size:.82rem;">Se cada aluno usa sempre o mesmo tablet, escolha 7 ou 30 dias: ele não precisa digitar a senha a cada aula e entra mais rápido nos jogos e exercícios.</p>
      <h3 style="margin-top:22px;">Tolerância durante a prova</h3>
      <p class="muted">Durante a prova o app pede ao celular para <strong>não apagar a tela</strong>. Se mesmo assim a tela apagar ou o aluno sair da prova por um instante (uma notificação, por exemplo) e voltar dentro deste tempo, a prova <strong>não é bloqueada</strong>: ele só toca em "Voltar para a prova". Cada saída fica registrada para o professor. Depois de ${MAX_SAIDAS_TOLERADAS} saídas, ou se demorar mais que a tolerância para voltar, a prova é bloqueada como antes.</p>
      <label>Tolerância</label>
      ${sel('sessao-toleranciaSeg', opcTol, cfg.toleranciaSeg)}
      <p class="muted" style="font-size:.82rem; margin-top:12px;">As mudanças valem a partir da próxima vez que cada pessoa abrir o app ou iniciar uma prova.</p>
    </div>`;
}
async function salvarSessaoCampo(campo, valor){
  const cfg = { ...(await carregarSessaoConfig()) };
  cfg[campo] = Number(valor);
  try{ await window.storage.set('sessao-config', JSON.stringify(cfg), true); SESSAO_CFG = { ...SESSAO_PADRAO, ...cfg }; }
  catch(e){ alert('Não foi possível salvar agora. Tente de novo.'); }
  render();
}
function renderCoordLogin(){
  const c = state.coordenador;
  return `
    <button class="btn btn-ghost btn-sm voltar-landing" data-action="goto-landing">← Voltar</button>
    <div class="card">
      <h2>Acesso da coordenação</h2>
      <label>Senha do coordenador</label>
      <input type="password" id="coord-senha-input" placeholder="Senha">
      ${c.error ? `<p class="err">${esc(c.error)}</p>` : ''}
      <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="coord-login-submit">Entrar</button>
    </div>
  `;
}
function renderCoordPeriodos(){
  const c = state.coordenador;
  if(state.professor.periodosLoading){
    return `<div class="card"><h2>Períodos</h2><div class="spinner"></div></div>`;
  }
  const d = c.periodosDraft || state.professor.periodos || {};
  return `
    <div class="card">
      <h2>Períodos de avaliação e recuperação paralela</h2>
      <p class="muted">Defina, para cada unidade/bimestre, o período de aplicação das avaliações e o período de recuperação paralela. Isso aparece automaticamente no painel de todos os professores.</p>
      ${UNIDADES.map(u => {
        const pu = d[u] || {};
        return `
          <h3 style="margin-top:22px;">${esc(u)}</h3>
          <div class="row">
            <div>
              <label>Avaliações — início</label>
              <input type="date" id="periodo-${u}-avalInicio" value="${esc(pu.avalInicio||'')}">
            </div>
            <div>
              <label>Avaliações — fim</label>
              <input type="date" id="periodo-${u}-avalFim" value="${esc(pu.avalFim||'')}">
            </div>
          </div>
          <div class="row">
            <div>
              <label>Recuperação paralela — início</label>
              <input type="date" id="periodo-${u}-recInicio" value="${esc(pu.recInicio||'')}">
            </div>
            <div>
              <label>Recuperação paralela — fim</label>
              <input type="date" id="periodo-${u}-recFim" value="${esc(pu.recFim||'')}">
            </div>
          </div>
        `;
      }).join('')}
      <button class="btn btn-primary" data-action="coord-save-periodos" style="margin-top:16px;">Salvar períodos</button>
    </div>
  `;
}
function renderCoordDashboard(){
  const c = state.coordenador;
  if(c.dashboard.loading || !c.dashboard.stats){
    return `<div class="card"><h2>Painel executivo</h2><div class="spinner"></div></div>`;
  }
  const s = c.dashboard.stats;
  const cards = [
    { label:'Professores ativos', value: s.professoresAtivos + (s.professoresPendentes?' ('+s.professoresPendentes+' pend.)':'') },
    { label:'Turmas', value: s.totalTurmas },
    { label:'Alunos cadastrados', value: s.totalAlunos },
    { label:'Avaliações criadas', value: s.totalAvaliacoes },
    { label:'Respostas recebidas', value: s.totalRespostas },
    { label:'Bloqueios pendentes agora', value: s.bloqueiosPendentes },
    { label:'Respostas com alerta', value: s.respostasComAlerta },
  ];
  const instrumentoRows = INSTRUMENTOS.map(inst => {
    const count = s.porInstrumento[inst.key] || 0;
    const pct = s.totalAvaliacoes>0 ? Math.round((count/s.totalAvaliacoes)*100) : 0;
    return `
      <div class="chart-row">
        <div class="chart-label">${esc(inst.label.split(' (')[0])}</div>
        <div class="chart-track"><div class="chart-fill" style="width:${pct}%; background:var(--green);"></div></div>
        <div class="chart-pct">${count}</div>
      </div>
    `;
  }).join('');
  const unidadeRows = UNIDADES.map(u => {
    const count = s.porUnidade[u] || 0;
    const maxCount = Math.max(...UNIDADES.map(x=>s.porUnidade[x]||0), 1);
    const pct = Math.round((count/maxCount)*100);
    return `
      <div class="chart-row">
        <div class="chart-label">${esc(u)}</div>
        <div class="chart-track"><div class="chart-fill" style="width:${pct}%; background:var(--yellow-dark);"></div></div>
        <div class="chart-pct">${count}</div>
      </div>
    `;
  }).join('');
  const topDisciplinas = Object.entries(s.porDisciplina).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxDisc = Math.max(...topDisciplinas.map(x=>x[1]), 1);
  const disciplinaRows = topDisciplinas.map(([name,count]) => `
    <div class="chart-row">
      <div class="chart-label">${esc(name)}</div>
      <div class="chart-track"><div class="chart-fill" style="width:${Math.round((count/maxDisc)*100)}%; background:var(--purple);"></div></div>
      <div class="chart-pct">${count}</div>
    </div>
  `).join('');

  return `
    ${renderGreetingHeader('Coordenação', '')}
    <div class="stat-row">
      ${renderStatTile('🏫', s.totalTurmas, 'Turmas', 'vinho')}
      ${renderStatTile('🧑‍🎓', s.totalAlunos, 'Alunos cadastrados', 'teal')}
      ${renderStatTile('🧑‍🏫', s.professoresAtivos, 'Professores ativos', 'coral')}
    </div>
    ${pnMiniaturas()}
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2>Painel executivo</h2>
        <div class="row" style="flex:0 0 auto; gap:8px;">
          <button class="btn btn-primary btn-sm" data-action="download-backup" data-modo="essencial" title="Todos os dados da escola, sem as imagens dos slides">💾 Fazer backup</button>
          <button class="btn btn-ghost btn-sm" data-action="download-backup" data-modo="completo" title="Inclui também as imagens dos slides e os planos importados (arquivo maior)">Backup completo</button>
          <button class="btn btn-ghost btn-sm" data-action="coord-refresh-dashboard">Atualizar</button>
        </div>
      </div>
      <p class="muted">Visão geral da escola — atualizada sob demanda.</p>
      ${backupResumoHtml()}
      <details style="margin-top:8px;" ${backupState().restaurar ? 'open' : ''}><summary style="cursor:pointer; font-size:.85rem;">♻️ Restaurar um backup</summary>${backupRestaurarHtml()}</details>

      <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);">
        ${cards.map(cd => `
          <div class="stat-card">
            <div class="stat-value">${cd.value}</div>
            <div class="stat-label">${cd.label}</div>
          </div>
        `).join('')}
      </div>

      <h3 style="margin-top:24px;">Avaliações por instrumento</h3>
      ${instrumentoRows}

      <h3 style="margin-top:22px;">Avaliações por unidade/bimestre</h3>
      ${unidadeRows}

      ${topDisciplinas.length>0 ? `<h3 style="margin-top:22px;">Disciplinas com mais avaliações</h3>${disciplinaRows}` : ''}

      ${s.turmaRanking.length>0 ? `
      <h3 style="margin-top:22px;">Desempenho médio por turma</h3>
      ${s.turmaRanking.map(t => `
        <div class="chart-row">
          <div class="chart-label">${esc(t.name)}</div>
          <div class="chart-track"><div class="chart-fill" style="width:${Math.round(t.avg)}%; background:${t.avg>=70?'var(--green)':t.avg>=50?'var(--yellow-dark)':'var(--red)'};"></div></div>
          <div class="chart-pct">${t.avg.toFixed(0)}%</div>
        </div>
      `).join('')}` : ''}

      ${s.disciplinaRanking.length>0 ? `
      <h3 style="margin-top:22px;">Ranking de disciplinas por desempenho</h3>
      <p class="muted" style="margin-top:-4px; font-size:.85rem;">Da melhor para a pior média de aproveitamento dos alunos.</p>
      ${s.disciplinaRanking.map(d => `
        <div class="chart-row">
          <div class="chart-label">${esc(d.name)}</div>
          <div class="chart-track"><div class="chart-fill" style="width:${Math.round(d.avg)}%; background:${d.avg>=70?'var(--green)':d.avg>=50?'var(--yellow-dark)':'var(--red)'};"></div></div>
          <div class="chart-pct">${d.avg.toFixed(0)}%</div>
        </div>
      `).join('')}` : ''}

      ${s.alunosAbaixoDe5.length>0 ? `
      <h3 style="margin-top:22px;">Alunos com média abaixo de 5</h3>
      <p class="muted" style="margin-top:-4px; font-size:.85rem;">Média geral (0 a 10) considerando todas as avaliações objetivas que o aluno respondeu, em qualquer disciplina.</p>
      <div class="table-scroll">
      <table>
        <tr><th>Aluno</th><th>Média</th></tr>
        ${s.alunosAbaixoDe5.slice(0,20).map(x => `<tr><td>${esc(x.name)}</td><td>${x.media.toFixed(1)}</td></tr>`).join('')}
      </table>
      </div>
      ${s.alunosAbaixoDe5.length>20 ? `<p class="muted" style="font-size:.82rem;">e mais ${s.alunosAbaixoDe5.length-20} aluno(s)...</p>` : ''}
      ` : ''}
    </div>

    ${(s.topAlunosFichas && s.topAlunosFichas.length>0) ? `
    <div class="card">
      <h2>🎮 Gamificação da escola</h2>
      <p class="muted">Fichas ganhas nas atividades (Quiz, Roleta, Enquete) e no engajamento das aulas — só para ranking/motivação, sem peso na nota.</p>
      <h3 style="margin-top:18px;">🏆 Top 10 alunos com mais fichas</h3>
      ${s.topAlunosFichas.map((al,i) => `
        <div class="list-item">
          <span>${i+1}º · ${studentAvatarHtml(al,26)} ${esc(al.name)} <span class="muted" style="font-size:.8rem;">(${esc(al.turmaName)})</span></span>
          <span class="muted">${al.fichas} 🎫</span>
        </div>
      `).join('')}
      ${s.turmaEngajamento.length>0 ? `
      <h3 style="margin-top:22px;">Média de fichas por turma</h3>
      ${(() => {
        const maxMedia = Math.max(...s.turmaEngajamento.map(t=>t.mediaFichas), 1);
        return s.turmaEngajamento.map(t => `
          <div class="chart-row">
            <div class="chart-label">${esc(t.name)}</div>
            <div class="chart-track"><div class="chart-fill" style="width:${Math.round((t.mediaFichas/maxMedia)*100)}%; background:var(--plum);"></div></div>
            <div class="chart-pct">${t.mediaFichas.toFixed(1)}</div>
          </div>
        `).join('');
      })()}
      ` : ''}
    </div>
    ` : ''}

    <div class="card">
      <h2>🧹 Manutenção de dados</h2>
      <p class="muted">Rotinas simples de limpeza — nada aqui apaga notas, avaliações ou cadastros de alunos/professores.</p>
      <div class="row" style="flex-wrap:wrap; gap:8px; margin-top:10px;">
        <button class="btn btn-ghost btn-sm" data-action="coord-limpar-liberacoes">Limpar liberações antigas resolvidas</button>
        <button class="btn btn-ghost btn-sm" data-action="coord-encerrar-atividades-travadas">Encerrar atividades ao vivo travadas</button>
        <button class="btn btn-ghost btn-sm" data-action="coord-limpar-slides-orfaos">Limpar imagens de slides órfãs</button>
      </div>
    </div>
    ${renderSegurancaCard()}
    ${renderRecursosCard()}
  `;
}
function renderCoordDisciplinasProfessor(pr){
  const c = state.coordenador;
  if(c.profDisciplinasLoading){
    return `<div style="width:100%; margin-top:10px;"><div class="spinner"></div></div>`;
  }
  const lista = c.profDisciplinasList || [];
  return `
    <div style="width:100%; margin-top:10px; padding-top:10px; border-top:1px dashed #d8d2c8;">
      ${!pr.activatedAt ? `<p class="muted" style="font-size:.8rem;">Esse(a) professor(a) ainda não fez o primeiro acesso — pode cadastrar as disciplinas dele(a) normalmente aqui, já fica pronto pra quando ele(a) entrar.</p>` : ''}
      ${lista.length===0 ? '<p class="muted" style="font-size:.85rem;">Nenhuma disciplina cadastrada pra esse(a) professor(a) ainda.</p>' : lista.map(d => {
        const turmaNames = (state.professor.turmas||[]).filter(t=>(d.turmaIds||[]).includes(t.id)).map(t=>t.name);
        if(c.profDisciplinaEditTurmasId===d.id){
          return `
          <div style="padding:6px 0; border-bottom:1px dashed #d8d2c8;">
            <span style="font-weight:600;">${esc(d.name)}</span>
            <label style="font-size:.75rem; margin-top:4px; display:block;">Turmas aplicadas</label>
            ${renderTurmaChecklist(state.professor.turmas||[], c.profDisciplinaEditTurmaIds, 'toggle-coord-prof-disciplina-edit-turma')}
            <div class="row" style="margin-top:4px;">
              <button class="btn btn-ghost btn-sm" data-action="coord-cancelar-editar-turmas-disciplina-prof">Cancelar</button>
              <button class="btn btn-primary btn-sm" data-action="coord-salvar-turmas-disciplina-prof">Salvar turmas</button>
            </div>
          </div>
        `;
        }
        return `
        <div class="row" style="justify-content:space-between; align-items:center; padding:4px 0;">
          <span>${esc(d.name)} <span class="muted" style="font-size:.78rem;">${turmaNames.length>0?'· '+turmaNames.map(esc).join(', '):'· nenhuma turma vinculada ainda'}</span></span>
          <div class="row" style="flex-wrap:nowrap; gap:4px;">
            <button class="btn btn-ghost btn-sm" data-action="coord-abrir-editar-turmas-disciplina-prof" data-discid="${d.id}">✏️ Turmas</button>
            <button class="btn btn-ghost btn-sm" data-action="coord-remover-disciplina-prof" data-discid="${d.id}">✕</button>
          </div>
        </div>
      `; }).join('')}
      <div style="margin-top:10px;">
        <label style="font-size:.75rem;">Nova disciplina</label>
        <input type="text" id="coord-prof-disciplina-nome-input" class="input" value="${esc(c.newProfDisciplinaNome)}" placeholder="Ex: Segurança do Trabalho">
        <label style="font-size:.75rem; margin-top:6px; display:block;">Turmas (opcional, dá pra ajustar depois)</label>
        ${renderTurmaChecklist(state.professor.turmas||[], c.newProfDisciplinaTurmaIds, 'toggle-coord-prof-disciplina-turma')}
        <div id="coord-prof-disciplina-err"></div>
        <button class="btn btn-primary btn-sm" data-action="coord-adicionar-disciplina-prof" style="margin-top:6px;">+ Adicionar disciplina</button>
      </div>
    </div>
  `;
}
function renderCoordProfessores(){
  const c = state.coordenador;
  let body;
  if(c.professoresLoading){
    body = `<div class="spinner"></div>`;
  } else if(c.professores.length===0){
    body = `<div class="empty">Nenhum professor cadastrado ainda.</div>`;
  } else {
    body = c.professores.map(pr => {
      const editandoDisciplinas = c.profDisciplinasEditId===pr.id;
      return `
      <div class="list-item" style="align-items:flex-start; flex-direction:column;">
        <div class="row" style="width:100%; justify-content:space-between; align-items:center;">
          <div>
            <strong>${pr.displayName ? esc(pr.displayName) : esc(pr.email)}</strong><br>
            <span class="muted">${esc(pr.email)}${pr.disciplina?' · '+esc(pr.disciplina):''} · ${pr.activatedAt ? 'ativo' : 'pendente (aguardando primeiro acesso)'}${pr.coordNote?' · ⚠ recado pendente':''}</span>
          </div>
          <div class="row" style="flex:0 0 auto; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" data-action="coord-entrar-painel-prof" data-id="${pr.id}" title="Abre o painel deste professor, como se fosse ele, sem precisar da senha">👁 Entrar no painel</button>
            <button class="btn btn-ghost btn-sm" data-action="${editandoDisciplinas?'coord-fechar-disciplinas-prof':'coord-abrir-disciplinas-prof'}" data-id="${pr.id}">${editandoDisciplinas?'Fechar':'📚 Disciplinas'}</button>
            ${pr.passwordHash ? `<button class="btn btn-ghost btn-sm" data-action="coord-reset-professor-password" data-id="${pr.id}">Redefinir senha</button>` : ''}
            <button class="btn btn-danger btn-sm" data-action="coord-remove-professor" data-id="${pr.id}">Remover</button>
          </div>
        </div>
        ${editandoDisciplinas ? renderCoordDisciplinasProfessor(pr) : ''}
      </div>
    `; }).join('');
  }
  return `
    <div class="card">
      <h2>Professores cadastrados</h2>
      <p class="muted">Cadastre aqui o e-mail de cada professor. Na primeira vez que ele entrar com esse e-mail, escolhe o nome e cria a própria senha.</p>
      <p class="muted" style="font-size:.85rem;"><strong>👁 Entrar no painel</strong> abre o painel do professor exatamente como ele vê, sem pedir a senha dele. Tudo o que você fizer lá fica gravado como se fosse do professor. Essa entrada não conta na Frequência dos Professores.</p>
      <label>E-mail do professor</label>
      <input type="text" id="new-prof-email-input" placeholder="professor@exemplo.com">
      <label>Disciplina (opcional)</label>
      <input type="text" id="new-prof-disciplina-input" placeholder="Ex: Segurança do Trabalho">
      <button class="btn btn-primary btn-sm" data-action="coord-add-professor" style="margin-top:10px;">Cadastrar professor</button>
      <div style="margin-top:18px;">${body}</div>

      <h3 style="margin-top:26px;">Senha do coordenador</h3>
      <label>Nova senha</label>
      <input type="password" id="coord-new-password-input" placeholder="Nova senha">
      <label>Confirmar nova senha</label>
      <input type="password" id="coord-new-password2-input" placeholder="Repita a nova senha">
      ${c.error && c.changingPassword ? `<p class="err">${esc(c.error)}</p>` : ''}
      <button class="btn btn-ghost btn-sm" data-action="coord-save-password" style="margin-top:10px;">Trocar senha</button>

      <h3 style="margin-top:26px;">Senha do Controle de Frequência (monitores)</h3>
      <p class="muted" style="font-size:.85rem;">Senha compartilhada usada pelos monitores para entrar na área "Controle de Frequência" e fazer a leitura das carteirinhas.</p>
      <label>Nova senha</label>
      <input type="password" id="freq-new-password-input" placeholder="Nova senha">
      <label>Confirmar nova senha</label>
      <input type="password" id="freq-new-password2-input" placeholder="Repita a nova senha">
      ${c.errorFreq && c.changingFreqPassword ? `<p class="err">${esc(c.errorFreq)}</p>` : ''}
      <button class="btn btn-ghost btn-sm" data-action="coord-save-freq-password" style="margin-top:10px;">Trocar senha da Frequência</button>

      <h3 style="margin-top:26px;">Senha da Biblioteca</h3>
      <p class="muted" style="font-size:.85rem;">Senha compartilhada usada para entrar na área "Biblioteca" (catalogação e empréstimos). Padrão de fábrica: <code>biblioteca123</code>.</p>
      <label>Nova senha</label>
      <input type="password" id="biblioteca-new-password-input" placeholder="Nova senha">
      <label>Confirmar nova senha</label>
      <input type="password" id="biblioteca-new-password2-input" placeholder="Repita a nova senha">
      ${c.errorBiblioteca && c.changingBibliotecaPassword ? `<p class="err">${esc(c.errorBiblioteca)}</p>` : ''}
      <button class="btn btn-ghost btn-sm" data-action="coord-save-biblioteca-password" style="margin-top:10px;">Trocar senha da Biblioteca</button>
    </div>
  `;
}
function renderCoordAssessments(){
  const c = state.coordenador;
  if(c.assessmentsLoading){
    return `<div class="card"><h2>Todas as avaliações</h2><div class="spinner"></div></div>`;
  }
  const profOptions = c.professores.map(pr => `<option value="${pr.id}" ${c.filterProfessorId===pr.id?'selected':''}>${esc(pr.displayName||pr.email)}</option>`).join('');
  const disciplinaNames = [...new Set(c.assessments.map(a=>a.disciplinaName).filter(Boolean))];
  const disciplinaOptions = disciplinaNames.map(name => `<option value="${esc(name)}" ${c.filterDisciplina===name?'selected':''}>${esc(name)}</option>`).join('');
  let filtered = c.assessments;
  if(c.filterProfessorId) filtered = filtered.filter(a=>a.professorId===c.filterProfessorId);
  if(c.filterDisciplina) filtered = filtered.filter(a=>a.disciplinaName===c.filterDisciplina);

  const body = filtered.length===0 ? '<div class="empty">Nenhuma avaliação encontrada.</div>' : filtered.map(a => {
    const prof = c.professores.find(pr=>pr.id===a.professorId);
    return `
      <div class="list-item">
        <div>
          <strong>${esc(a.title)}</strong><br>
          <span class="muted">${prof?esc(prof.displayName||prof.email):(a.professorName?esc(a.professorName):'professor não identificado')}${a.disciplinaName?' · '+esc(a.disciplinaName):''} · ${a.questions.length} questão(ões)</span>
        </div>
        <div class="row" style="flex:0 0 auto; gap:8px;">
          <span class="pill">${a.code}</span>
          ${assessmentTurmaIds(a).length>0 ? `<button class="btn btn-ghost btn-sm" data-action="print-personal-gabaritos" data-code="${a.code}">Gabaritos por aluno</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-action="coord-open-results" data-code="${a.code}">Resultados</button>
          <button class="btn btn-danger btn-sm" data-action="excluir-avaliacao" data-code="${a.code}">Excluir</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="card">
      <h2>Todas as avaliações da escola</h2>
      <div class="row">
        <select id="coord-filter-professor">
          <option value="">Todos os professores</option>
          ${profOptions}
        </select>
        <select id="coord-filter-disciplina">
          <option value="">Todas as disciplinas</option>
          ${disciplinaOptions}
        </select>
      </div>
      <div style="margin-top:14px;">${body}</div>
    </div>
  `;
}
function renderCoordPesosProf(){
  const c = state.coordenador;
  if(c.professorPesosLoading){
    return `<div class="card"><h2>Pesos dos professores</h2><div class="spinner"></div></div>`;
  }
  const ativos = c.professores.filter(pr => pr.activatedAt);
  const body = ativos.length===0 ? '<div class="empty">Nenhum professor ativo ainda.</div>' : ativos.map(pr => {
    const pesos = c.professorPesos[pr.id] || DEFAULT_PESOS;
    const total = (pesos.avaliacao||0)+(pesos.diagnostica||0)+(pesos.exercicios||0)+(pesos.autoavaliacao||0);
    return `
      <div class="q-card">
        <div class="q-head">
          <span class="q-tag">${esc(pr.displayName||pr.email)}${pr.disciplina?' · '+esc(pr.disciplina):''}</span>
        </div>
        <div class="table-scroll">
        <table>
          <tr><th>NP1 · Avaliação</th><th>Diagnóstica</th><th>Exercícios</th><th>Autoavaliação</th><th>Total</th></tr>
          <tr>
            <td>${pesos.avaliacao}</td>
            <td>${pesos.diagnostica}</td>
            <td>${pesos.exercicios}</td>
            <td>${pesos.autoavaliacao}</td>
            <td><strong>${total}${total!==10?' ⚠':''}</strong></td>
          </tr>
        </table>
        </div>
        ${total!==10 ? '<p class="err" style="font-size:.82rem;">O total não fecha em 10 pontos — pode valer a pena orientar o professor a revisar.</p>' : ''}
        ${pr.coordNote ? `
          <div style="background:var(--accent-yellow-bg,#fdf3e8); border:1px solid var(--yellow-dark); border-radius:6px; padding:10px 12px; margin-top:10px;">
            <strong style="font-size:.85rem;">Recado enviado:</strong>
            <p style="margin:4px 0 8px; font-size:.9rem;">${esc(pr.coordNote)}</p>
            <button class="btn btn-ghost btn-sm" data-action="coord-clear-note" data-id="${pr.id}">Remover recado</button>
          </div>
        ` : `
          <label style="margin-top:12px;">Orientação para o professor</label>
          <textarea id="note-input-${pr.id}" placeholder="Ex: revise os pesos, o total deve fechar em 10 pontos."></textarea>
          <button class="btn btn-primary btn-sm" data-action="coord-send-note" data-id="${pr.id}" style="margin-top:6px;">Enviar recado</button>
        `}
      </div>
    `;
  }).join('');
  return `
    <div class="card">
      <h2>Pesos dos professores</h2>
      <p class="muted">Como cada professor ativo distribuiu os pesos entre os instrumentos. Se algo estiver fora do combinado pela escola, envie um recado — ele aparece para o professor assim que ele fizer login.</p>
      ${body}
    </div>
  `;
}
function normDisc(n){
  return String(n||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
    .replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()
    .replace(/ (i|ii|iii|iv|v|\d+)( ano| serie)?$/,'').trim();
}
function areaPadraoDaDisciplina(nome){ const n = normDisc(nome); const a = AREAS_CONHEC.find(x => x.discs.includes(n)); return a ? a.id : 'ind'; }
function areaDaDisciplina(nome, mapa){ return (mapa||{})[normDisc(nome)] || areaPadraoDaDisciplina(nome); }
function riscoPill(r){ const i = RISCO_INFO[r]; return `<span class="pill" style="background:${i.cor}; color:#fff; white-space:nowrap;">${i.label}</span>`; }
function notaCel(v){ return v==null ? '<span class="muted">—</span>' : (v<5 ? `<strong style="color:#b3261e;">${fmt1(v)}</strong>` : fmt1(v)); }
function notasDoAluno(nome, blocos){
  const porDisc = {};
  blocos.forEach(colunas => {
    const daUnidade = {};
    (colunas||[]).forEach(col => {
      const g = col.grades[nome];
      if(g===undefined || g.final==null || isNaN(g.final)) return;
      const v = col.total ? g.final / col.total * 10 : g.final;
      (daUnidade[col.disciplinaName] = daUnidade[col.disciplinaName] || []).push(v);
    });
    Object.entries(daUnidade).forEach(([d, vs]) => (porDisc[d] = porDisc[d] || []).push(vs.reduce((a,b)=>a+b,0)/vs.length));
  });
  const out = {};
  Object.entries(porDisc).forEach(([d, vs]) => { out[d] = r1(vs.reduce((a,b)=>a+b,0)/vs.length); });
  return out;
}
function ordenarPorRisco(a, b){
  return RISCO_INFO[a.risco].ordem - RISCO_INFO[b.risco].ordem || b.total - a.total || (a.mediaGlobal??99) - (b.mediaGlobal??99) || a.nome.localeCompare(b.nome,'pt-BR');
}
async function getAreasMapa(){ try{ const r = await window.storage.get('areas-disciplinas', true); const d = JSON.parse(r.value); return d && typeof d==='object' ? d : {}; }catch(e){ return {}; } }
function riscoState(){
  const c = state.coordenador;
  if(!c.risco) c.risco = { linhas:[], disciplinas:[], filtro:'emrisco', busca:'', turmaFiltro:'', visao:'risco', mapa:{}, editarAreas:false, calculado:false, rotulo:'', progresso:'' };
  return c.risco;
}
function reanalisarRisco(){
  const R = riscoState();
  R.linhas = (R.base||[]).map(b => analisarAluno(b.st, b.turma, b.notas, R.mapa)).sort(ordenarPorRisco);
  const ds = new Set(); (R.base||[]).forEach(b => Object.keys(b.notas).forEach(d => ds.add(d)));
  R.disciplinas = [...ds].sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
function riscoLinhasFiltradas(){
  const R = riscoState();
  const q = normDisc(R.busca);
  return R.linhas.filter(l => {
    if(R.turmaFiltro && l.turmaId!==R.turmaFiltro) return false;
    if(q && !normDisc(l.nome).includes(q)) return false;
    if(R.filtro==='todos') return true;
    if(R.filtro==='emrisco') return l.risco==='alto' || l.risco==='medio' || l.risco==='baixo';
    if(R.filtro==='evasao') return l.evasao;
    return l.risco===R.filtro;
  });
}
function riscoContagem(linhas){
  const n = { alto:0, medio:0, baixo:0, fora:0, semnotas:0 }; linhas.forEach(l => n[l.risco]++); return n;
}
function renderRiscoRelatorio(){
  const c = state.coordenador, R = riscoState();
  if(!R.calculado) return '';
  const multi = new Set(R.linhas.map(l=>l.turmaId)).size > 1;
  const linhas = riscoLinhasFiltradas();
  const todos = R.turmaFiltro ? R.linhas.filter(l=>l.turmaId===R.turmaFiltro) : R.linhas;
  const n = riscoContagem(todos);
  const comNotas = todos.length - n.semnotas;
  const pct = v => comNotas ? Math.round(v/comNotas*100) : 0;
  const nEvasao = todos.filter(l=>l.evasao).length;
  const card = (f, titulo, valor, cor, sub) => `
    <button class="card" data-action="risco-filtro" data-f="${f}" style="flex:1 1 130px; margin:0; padding:12px; text-align:left; cursor:pointer; border:2px solid ${R.filtro===f?cor:'transparent'};">
      <div style="font-size:1.6rem; font-weight:800; color:${cor}; line-height:1;">${valor}</div>
      <div style="font-size:.85rem; font-weight:600; margin-top:4px;">${titulo}</div>
      ${sub ? `<div class="muted" style="font-size:.75rem;">${sub}</div>` : ''}
    </button>`;
  // Resumo por turma (só quando há várias): meta de até 5% de reprovação por turma.
  const porTurma = multi && !R.turmaFiltro ? (() => {
    const grupos = {};
    R.linhas.forEach(l => { (grupos[l.turmaId] = grupos[l.turmaId] || { nome:l.turmaNome, ls:[] }).ls.push(l); });
    const rows = Object.entries(grupos).map(([id, g]) => {
      const k = riscoContagem(g.ls), cn = g.ls.length - k.semnotas, em = k.alto + k.medio + k.baixo, p = cn ? em/cn*100 : 0;
      return { id, nome:g.nome, total:g.ls.length, cn, em, k, p };
    }).sort((a,b)=>b.p-a.p);
    return `
      <h3 style="margin-top:18px;">Resumo por turma</h3>
      <p class="muted" style="font-size:.82rem;">Meta institucional: até ${META_REPROVACAO_PCT}% de alunos com reprovação por turma. Toque no nome da turma para ver só ela.</p>
      <div class="table-scroll"><table>
        <tr><th>Turma</th><th>Alunos com notas</th><th>Em risco</th><th>Alto</th><th>Médio</th><th>Baixo</th><th>Meta ≤ ${META_REPROVACAO_PCT}%</th></tr>
        ${rows.map(r => `<tr>
          <td><a href="#" data-action="risco-turma" data-id="${r.id}">${esc(r.nome)}</a></td><td>${r.cn}</td>
          <td><strong>${r.em}</strong> (${Math.round(r.p)}%)</td><td>${r.k.alto}</td><td>${r.k.medio}</td><td>${r.k.baixo}</td>
          <td>${r.cn ? (r.p<=META_REPROVACAO_PCT ? '✅ dentro' : '❌ acima') : '—'}</td></tr>`).join('')}
      </table></div>`;
  })() : '';

  // ---- Parte A ----
  const parteA = `
    <h3 style="margin-top:22px;">Parte A — Visão geral e análise de risco</h3>
    <div class="row" style="gap:8px; flex-wrap:wrap; align-items:flex-end;">
      <div style="flex:1 1 220px;"><label>Buscar aluno</label><input id="risco-busca" placeholder="Digite parte do nome" value="${esc(R.busca)}" autocomplete="off"></div>
      ${multi ? `<div style="flex:0 1 220px;"><label>Turma</label><select data-action="risco-turma-select">
        <option value="">Todas</option>${[...new Map(R.linhas.map(l=>[l.turmaId,l.turmaNome])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).map(([id,nm]) => `<option value="${id}" ${R.turmaFiltro===id?'selected':''}>${esc(nm)}</option>`).join('')}
      </select></div>` : ''}
      <div class="row" style="gap:4px; flex-wrap:wrap; flex:0 0 auto;">
        ${[['emrisco','Em risco'],['alto','Alto'],['medio','Médio'],['baixo','Baixo'],['fora','Fora de risco'],['evasao','Provável evasão'],['todos','Todos']].map(([f,t]) => `<button class="btn ${R.filtro===f?'btn-primary':'btn-ghost'} btn-sm" data-action="risco-filtro" data-f="${f}">${t}</button>`).join('')}
      </div>
    </div>
    <p class="muted" style="font-size:.82rem; margin:8px 0;">Mostrando ${linhas.length} de ${todos.length} alunos. Notas abaixo de 5,0 em vermelho. Ordem: maior risco primeiro.</p>
    <div class="table-scroll"><table data-risco-tabela="1">
      <tr><th>Aluno</th>${multi?'<th>Turma</th>':''}${AREAS_CONHEC.map(a=>`<th>${a.curto}</th>`).join('')}<th>Disciplinas individuais abaixo de 5,0</th><th>Média global</th><th>Componentes em reprovação</th><th>Classificação</th></tr>
      ${linhas.length ? linhas.map(l => `<tr>
        <td>${esc(l.nome)}${l.evasao?' <span title="Média global abaixo de 3,0: provável evasão">⚠️</span>':''}</td>${multi?`<td>${esc(l.turmaNome)}</td>`:''}
        ${AREAS_CONHEC.map(a => `<td>${notaCel(l.areas[a.id].media)}</td>`).join('')}
        <td style="font-size:.85rem;">${l.individuais.filter(x=>x.nota<5).map(x => `${esc(x.nome)} ${notaCel(x.nota)}`).join('<br>') || (l.individuais.length ? '<span class="muted">nenhuma</span>' : '<span class="muted">—</span>')}</td>
        <td>${notaCel(l.mediaGlobal)}</td><td style="text-align:center;"><strong>${l.risco==='semnotas'?'—':l.total}</strong></td><td>${riscoPill(l.risco)}</td>
      </tr>`).join('') : `<tr><td colspan="${8+(multi?1:0)}"><div class="empty">Nenhum aluno neste filtro.</div></td></tr>`}
    </table></div>`;

  // ---- Parte B ----
  const ranq = todos.filter(l=>l.mediaGlobal!=null).sort((a,b)=>b.mediaGlobal-a.mediaGlobal || a.nome.localeCompare(b.nome,'pt-BR'));
  let topo = ranq.slice(0,5);
  if(ranq.length>5){ const corte = ranq[4].mediaGlobal; topo = ranq.filter((l,i)=>i<5 || l.mediaGlobal===corte); }   // empates no 5º lugar entram
  const medalha = i => ['🥇','🥈','🥉'][i] || `${i+1}º`;
  const parteB = `
    <h3 style="margin-top:22px;">Parte B — Ranking de desempenho global (melhores médias)</h3>
    <div class="table-scroll"><table>
      <tr><th>Posição</th><th>Aluno</th>${multi?'<th>Turma</th>':''}<th>Média global</th><th>Situação</th></tr>
      ${topo.map((l,i) => `<tr><td>${medalha(ranq.findIndex(x=>x.mediaGlobal===l.mediaGlobal))}</td><td>${esc(l.nome)}</td>${multi?`<td>${esc(l.turmaNome)}</td>`:''}<td><strong>${fmt1(l.mediaGlobal)}</strong></td><td>${riscoPill(l.risco)}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">Sem notas.</div></td></tr>'}
    </table></div>`;

  // ---- Parte C ----
  const piores = ranq.slice().reverse().filter(l => l.total>0 || l.mediaGlobal<6).slice(0,5);   // as piores médias, mas só de quem precisa de apoio
  const prioridade = [...new Set([...todos.filter(l=>l.risco==='alto'||l.risco==='medio'||l.evasao), ...piores])].sort(ordenarPorRisco);
  const parteC = `
    <h3 style="margin-top:22px;">Parte C — Plano de Busca Ativa e Apoio Pedagógico</h3>
    <p class="muted" style="font-size:.82rem;">Alunos em risco alto e médio, com provável evasão (média global abaixo de 3,0) e as piores médias globais (até 5, entre quem tem reprovação ou média abaixo de 6,0). A ordem é de prioridade de intervenção.</p>
    ${prioridade.length ? `<div class="table-scroll"><table>
      <tr><th>#</th><th>Aluno</th>${multi?'<th>Turma</th>':''}<th>Média global</th><th>Reprovações</th><th>Classificação</th><th>Onde precisa de apoio</th><th>Ação sugerida</th></tr>
      ${prioridade.map((l,i) => `<tr>
        <td>${i+1}</td><td>${esc(l.nome)}${l.evasao?'<br><span class="pill" style="background:#5b1a2c; color:#fff; font-size:.7rem;">⚠️ provável evasão</span>':''}</td>${multi?`<td>${esc(l.turmaNome)}</td>`:''}
        <td>${notaCel(l.mediaGlobal)}</td><td style="text-align:center;">${l.total}</td><td>${riscoPill(l.risco)}</td>
        <td style="font-size:.85rem;">${textoApoio(l) || '<span class="muted">nenhum componente abaixo de 5,0</span>'}</td>
        <td style="font-size:.82rem;">${l.evasao ? 'Busca ativa imediata: contato com a família e verificação de frequência.' : l.risco==='alto' ? 'Reunião com a família e plano individual de recuperação nos componentes listados.' : l.risco==='medio' ? 'Recuperação paralela e monitoria nos componentes listados; acompanhar a cada quinzena.' : 'Acompanhar de perto: está entre as menores médias.'}</td>
      </tr>`).join('')}
    </table></div>` : '<div class="empty">Nenhum aluno precisa de intervenção urgente. 🎉</div>'}`;

  // ---- Parte D ----
  const blocoArea = a => {
    const ls = todos.filter(l => l.areas[a.id].media!=null && l.areas[a.id].media<5).sort((x,y)=>x.areas[a.id].media-y.areas[a.id].media);
    const discsArea = [...new Set(todos.flatMap(l => l.areas[a.id].discs.map(d=>d.nome)))].sort((x,y)=>x.localeCompare(y,'pt-BR'));
    return `<h4 style="margin:16px 0 6px;">${a.nome} <span class="muted" style="font-weight:400;">· ${ls.length} aluno(s) abaixo de 5,0</span></h4>
      ${ls.length ? `<div class="table-scroll"><table>
        <tr><th>Aluno</th>${multi?'<th>Turma</th>':''}${discsArea.map(d=>`<th>${esc(d)}</th>`).join('')}<th>Média da área</th></tr>
        ${ls.map(l => `<tr><td>${esc(l.nome)}</td>${multi?`<td>${esc(l.turmaNome)}</td>`:''}${discsArea.map(d => { const x = l.areas[a.id].discs.find(y=>y.nome===d); return `<td>${x?notaCel(x.nota):'<span class="muted">—</span>'}</td>`; }).join('')}<td><strong>${notaCel(l.areas[a.id].media)}</strong></td></tr>`).join('')}
      </table></div>` : '<p class="muted" style="font-size:.85rem;">Nenhum aluno abaixo de 5,0 nesta área.</p>'}`;
  };
  const tecnicas = [...new Set(todos.flatMap(l => l.individuais.map(x=>x.nome)))].sort((x,y)=>x.localeCompare(y,'pt-BR'));
  const blocoTec = tecnicas.map(d => {
    const ls = todos.map(l => ({ l, x: l.individuais.find(y=>y.nome===d) })).filter(o => o.x && o.x.nota<5).sort((p,q)=>p.x.nota-q.x.nota);
    return ls.length ? `<tr><td><strong>${esc(d)}</strong></td><td>${ls.length}</td><td style="font-size:.85rem;">${ls.map(o => `${esc(o.l.nome)}${multi?' ('+esc(o.l.turmaNome)+')':''} ${notaCel(o.x.nota)}`).join(' · ')}</td></tr>` : '';
  }).join('');
  const parteD = `
    <h3 style="margin-top:22px;">Parte D — Risco de reprovação por área do conhecimento e disciplina</h3>
    ${AREAS_CONHEC.map(blocoArea).join('')}
    <h4 style="margin:16px 0 6px;">Disciplinas individuais (técnicas e outras)</h4>
    ${blocoTec ? `<div class="table-scroll"><table><tr><th>Disciplina</th><th>Alunos abaixo de 5,0</th><th>Alunos e notas</th></tr>${blocoTec}</table></div>` : '<p class="muted" style="font-size:.85rem;">Nenhum aluno abaixo de 5,0 nas disciplinas individuais.</p>'}`;

  // ---- Classificação das disciplinas (editável) ----
  const classif = `
    <details style="margin-top:22px;" ${R.editarAreas?'open':''}>
      <summary style="cursor:pointer; font-weight:600;">⚙️ Como cada disciplina foi classificada (${R.disciplinas.length})</summary>
      <p class="muted" style="font-size:.82rem;">O app reconhece as disciplinas da base comum pelo nome. Se alguma estiver no lugar errado (por exemplo, "Português e Literatura" contando como disciplina individual), corrija aqui. A mudança vale para todos os relatórios.</p>
      <div class="table-scroll"><table>
        <tr><th>Disciplina</th><th>Classificação</th></tr>
        ${R.disciplinas.map(d => { const atual = areaDaDisciplina(d, R.mapa); return `<tr><td>${esc(d)}</td><td>
          <select data-action="risco-area" data-disc="${esc(d)}" style="max-width:300px;">
            ${[...AREAS_CONHEC.map(a=>[a.id,a.nome]), ['ind','Disciplina individual (técnica/outras)']].map(([id,nm]) => `<option value="${id}" ${atual===id?'selected':''}>${nm}</option>`).join('')}
          </select></td></tr>`; }).join('')}
      </table></div>
    </details>`;

  return `
    <div data-risco-relatorio="1">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:6px;">
        <p style="margin:0;"><strong>Relatório de Risco de Reprovação</strong> · <span class="muted">${esc(R.rotulo)}${R.turmaFiltro?' · '+esc((todos[0]||{}).turmaNome||''):''}</span></p>
        <div class="row" style="gap:6px; flex:0 0 auto;">
          <button class="btn btn-ghost btn-sm" data-action="risco-exportar">Exportar .xlsx</button>
          <button class="btn btn-ghost btn-sm" data-action="risco-imprimir">🖨️ Imprimir relatório</button>
        </div>
      </div>
      <div class="row" style="gap:8px; flex-wrap:wrap; margin-top:10px;">
        ${card('alto','Risco alto', n.alto, RISCO_INFO.alto.cor, `${pct(n.alto)}% · 5 ou mais componentes`)}
        ${card('medio','Risco médio', n.medio, RISCO_INFO.medio.cor, `${pct(n.medio)}% · 3 a 4 componentes`)}
        ${card('baixo','Risco baixo', n.baixo, RISCO_INFO.baixo.cor, `${pct(n.baixo)}% · 1 a 2 componentes`)}
        ${card('fora','Fora de risco', n.fora, RISCO_INFO.fora.cor, `${pct(n.fora)}%`)}
        ${card('evasao','Provável evasão', nEvasao, '#5b1a2c', 'média global abaixo de 3,0')}
      </div>
      ${n.semnotas ? `<p class="muted" style="font-size:.82rem; margin-top:8px;">${n.semnotas} aluno(s) ainda sem nenhuma nota lançada neste período (não entram na contagem).</p>` : ''}
      ${porTurma}${parteA}${parteB}${parteC}${parteD}${classif}
      <p class="muted" style="font-size:.78rem; margin-top:18px;">Como é calculado: cada nota é convertida para 0–10 e arredondada a 1 casa. A média da área é a média aritmética das disciplinas da área que têm nota. Áreas e disciplinas individuais abaixo de 5,0 contam como componentes em reprovação: 1–2 = risco baixo, 3–4 = médio, 5 ou mais = alto. A média global é a média de todas as disciplinas com nota.${R.rotulo.includes('Acumulado') ? ' No acumulado do ano, a nota de cada disciplina é a média das unidades que já têm nota.' : ''}</p>
    </div>`;
}
async function salvarAreaDisciplina(disc, area){
  const R = riscoState();
  const mapa = await getAreasMapa();
  const k = normDisc(disc);
  if(area===areaPadraoDaDisciplina(disc)) delete mapa[k]; else mapa[k] = area;
  try{ await window.storage.set('areas-disciplinas', JSON.stringify(mapa), true); }catch(e){ alert('Não foi possível salvar agora.'); return; }
  R.mapa = mapa; R.editarAreas = true;
  reanalisarRisco(); render();
}
function exportarRiscoXlsx(){
  const R = riscoState();
  if(!R.calculado){ alert('Calcule antes de exportar.'); return; }
  const multi = new Set(R.linhas.map(l=>l.turmaId)).size > 1;
  const ls = R.turmaFiltro ? R.linhas.filter(l=>l.turmaId===R.turmaFiltro) : R.linhas;
  const num = v => v==null ? '' : r1(v);
  const A = [['Aluno', ...(multi?['Turma']:[]), ...AREAS_CONHEC.map(a=>a.nome), 'Disciplinas individuais abaixo de 5,0', 'Média global', 'Componentes em reprovação', 'Classificação', 'Provável evasão']];
  ls.forEach(l => A.push([l.nome, ...(multi?[l.turmaNome]:[]), ...AREAS_CONHEC.map(a=>num(l.areas[a.id].media)), l.individuais.filter(x=>x.nota<5).map(x=>`${x.nome} (${fmt1(x.nota)})`).join('; '), num(l.mediaGlobal), l.risco==='semnotas'?'':l.total, RISCO_INFO[l.risco].label, l.evasao?'Sim':'']));
  const B = [['Posição','Aluno', ...(multi?['Turma']:[]), 'Média global']];
  ls.filter(l=>l.mediaGlobal!=null).sort((a,b)=>b.mediaGlobal-a.mediaGlobal).forEach((l,i) => B.push([i+1, l.nome, ...(multi?[l.turmaNome]:[]), num(l.mediaGlobal)]));
  const C = [['Aluno', ...(multi?['Turma']:[]), 'Média global', 'Reprovações', 'Classificação', 'Provável evasão', 'Onde precisa de apoio']];
  ls.filter(l=>l.risco==='alto'||l.risco==='medio'||l.evasao).sort(ordenarPorRisco).forEach(l => C.push([l.nome, ...(multi?[l.turmaNome]:[]), num(l.mediaGlobal), l.total, RISCO_INFO[l.risco].label, l.evasao?'Sim':'',
    l.reprov.map(r => r.tipo==='area' ? `${r.nome} (média ${fmt1(r.media)}: ${r.discs.map(d=>d.nome+' '+fmt1(d.nota)).join(', ')})` : `${r.nome} ${fmt1(r.media)}`).join('; ')]));
  const D = [['Área / disciplina', 'Tipo', 'Aluno', ...(multi?['Turma']:[]), 'Média', 'Notas das disciplinas da área']];
  AREAS_CONHEC.forEach(a => ls.filter(l=>l.areas[a.id].media!=null && l.areas[a.id].media<5).forEach(l => D.push([a.nome, 'Área', l.nome, ...(multi?[l.turmaNome]:[]), num(l.areas[a.id].media), l.areas[a.id].discs.map(d=>d.nome+' '+fmt1(d.nota)).join('; ')])));
  ls.forEach(l => l.individuais.filter(x=>x.nota<5).forEach(x => D.push([x.nome, 'Disciplina individual', l.nome, ...(multi?[l.turmaNome]:[]), num(x.nota), ''])));
  const wb = XLSX.utils.book_new();
  [['A - Visão geral',A],['B - Ranking',B],['C - Busca ativa',C],['D - Por área e disciplina',D]].forEach(([nm,aoa]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), nm));
  XLSX.writeFile(wb, `relatorio-risco-${R.rotulo.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.xlsx`);
}
function imprimirRisco(){
  const R = riscoState();
  if(!R.calculado){ alert('Calcule antes de imprimir.'); return; }
  const filtroAntes = R.filtro, buscaAntes = R.busca;
  R.filtro = 'todos'; R.busca = '';
  const tmp = document.createElement('div');
  tmp.innerHTML = renderRiscoRelatorio();
  R.filtro = filtroAntes; R.busca = buscaAntes;
  tmp.querySelectorAll('button.card').forEach(b => { const d = document.createElement('div'); d.innerHTML = b.innerHTML; d.style.cssText = b.style.cssText; d.style.border = '1px solid #ccc'; b.replaceWith(d); });
  tmp.querySelectorAll('button, details, input, select, label').forEach(el => el.remove());
  tmp.querySelectorAll('.row').forEach(el => { if(!el.textContent.trim()) el.remove(); });
  tmp.querySelectorAll('table').forEach(t => t.classList.add('pv-sign-table'));
  printPages(`<div class="pv-page">${buildPrintHeader({ title:'Relatório de Risco de Reprovação', subtitle: R.rotulo })}${tmp.innerHTML}</div>`);
}
function renderCoordNotas(){
  const c = state.coordenador;
  const turmaOptions = state.professor.turmas.map(t => `<option value="${t.id}" ${c.notasTurmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
  let resultBlock = '';
  const R = riscoState();
  const temTabela = c.notasColunas.length>0;
  const abas = false ? `
      <div class="row" style="gap:6px; margin-bottom:12px; flex-wrap:wrap;">
        <button class="btn ${R.visao!=='notas'?'btn-primary':'btn-ghost'} btn-sm" data-action="risco-visao" data-v="risco">⚠️ Relatório de risco</button>
        <button class="btn ${R.visao==='notas'?'btn-primary':'btn-ghost'} btn-sm" data-action="risco-visao" data-v="notas">🧮 Notas por disciplina</button>
      </div>` : '';
  if(c.notasLoading){
    resultBlock = `<div class="spinner"></div>${R.progresso ? `<p class="muted center">${esc(R.progresso)}</p>` : ''}`;
  } else if(R.calculado && !temTabela){
    resultBlock = '<div class="empty">Escolha uma turma e uma unidade. Para a escola inteira e o acumulado do ano, use <strong>📊 Painéis → ⚠️ Risco acadêmico</strong> ou <strong>📊 Desempenho</strong>.</div>';
  } else if(temTabela){
    resultBlock = abas;
    resultBlock += `
      <div class="row" style="justify-content:flex-end; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
        <button class="btn btn-ghost btn-sm" data-action="export-coord-notas-xlsx">Exportar .xlsx</button>
        <button class="btn btn-ghost btn-sm" data-action="imprimir-notas-finais" data-modo="matricula">🖨️ Imprimir (matrícula e notas)</button>
        <button class="btn btn-ghost btn-sm" data-action="imprimir-notas-finais" data-modo="completo">🖨️ Imprimir (matrícula, nome e notas)</button>
      </div>
      <div class="table-scroll">
      <table>
        <tr>
          <th>Aluno</th>
          ${c.notasColunas.map(col => `<th>${esc(col.disciplinaName)}<br><span class="muted" style="font-weight:400; text-transform:none;">${esc(col.professorName||'')} · /${col.total}</span></th>`).join('')}
          <th></th>
        </tr>
        ${c.notasRows.map(r => `
          <tr>
            <td>${esc(r.name)}${r.matricula?' <span class="muted" style="font-size:.78rem;">· mat. '+esc(r.matricula)+'</span>':''}</td>
            ${c.notasColunas.map(col => {
              const g = col.grades[r.name];
              if(g===undefined) return '<td><span class="muted">—</span></td>';
              const badge = g.precisaRecuperacao ? (g.temRecuperacao ? ((col.total ? g.final/col.total*10 : g.final)>=5 ? ' <span class="pill" style="background:var(--green); color:#fff; font-size:.62rem;" title="Fez a recuperação paralela e ficou com 5 ou mais">✅</span>' : ' <span class="pill" style="background:#e07b24; color:#fff; font-size:.62rem;" title="Fez a recuperação paralela, mas continua abaixo de 5">♻️</span>') : ' <span class="pill" style="background:var(--red); color:#fff; font-size:.62rem;" title="Abaixo de 5 — recuperação paralela">🔺</span>') : '';
              return `<td><strong>${g.final.toFixed(1)}</strong>${badge}</td>`;
            }).join('')}
            <td style="white-space:nowrap;">
              <button class="btn btn-ghost btn-sm" data-action="imprimir-boletim-aluno" data-name="${esc(r.name)}">📄 Boletim</button>
              <button class="btn btn-ghost btn-sm" data-action="imprimir-boletim-completo" data-name="${esc(r.name)}" ${c.boletimCompletoLoading===r.name?'disabled':''}>${c.boletimCompletoLoading===r.name?'Gerando...':'📄 Boletim completo'}</button>
            </td>
          </tr>
        `).join('')}
      </table>
      </div>
    `;
  } else if(c.notasTurmaId){
    resultBlock = '<div class="empty">Nenhuma avaliação encontrada para essa turma/unidade.</div>';
  }
  return `
    <div class="card">
      <h2>🧮 Notas finais (boletim)</h2>
      <p class="muted">Escolha a turma e a unidade para ver as notas finais por disciplina, exportar a planilha e imprimir os boletins. O risco de reprovação da escola, a análise por área e o desempenho estão em <strong>📊 Painéis</strong>.</p>
      <div class="row" style="align-items:flex-end;">
        <div>
          <label>Turma</label>
          <select id="coord-notas-turma-select">
            <option value="">Selecione...</option>
            ${turmaOptions}
          </select>
        </div>
        <div>
          <label>Unidade</label>
          <select id="coord-notas-unidade-select">
            ${UNIDADES.map(u => `<option value="${esc(u)}" ${c.notasUnidade===u?'selected':''}>${esc(u)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" data-action="coord-calc-notas" style="flex:0 0 auto;">Calcular</button>
      </div>
      <div style="margin-top:16px;">${resultBlock}</div>
    </div>
  `;
}
function renderCoordResults(){
  const c = state.coordenador;
  const a = c.resultsFor;
  const responses = c.responses;
  let body;
  if(c.resultsLoading){
    body = `<div class="spinner"></div>`;
  } else if(responses.length===0){
    body = `<div class="empty">Ninguém respondeu ainda.</div>`;
  } else {
    const max = a.questions.reduce((s,q)=>s+q.points,0);
    const scores = responses.map(r=>r.total);
    const avg = (scores.reduce((s,v)=>s+v,0)/scores.length);
    const outrasAvaliacoes = (c.assessments||[]).filter(x=>x.code!==a.code);
    body = `
      ${renderStatCards(responses.length, avg, Math.max(...scores), Math.min(...scores), max)}
      ${renderQuestionChart(a, responses, max)}
      ${renderDistributionChart(responses, max)}
      <h3 style="margin-top:18px;">Alunos que responderam</h3>
      <p class="muted" style="font-size:.85rem;">Se um aluno foi lançado por engano nessa avaliação (ex.: com o gabarito de outra série/turma), use "🔀 Transferir" pra mover a resposta pra avaliação certa e recalcular a nota — sem precisar lançar tudo de novo.</p>
      <div class="table-scroll">
      <table>
        <tr><th>Aluno</th><th>Nota</th><th></th></tr>
        ${responses.map((r, idx) => `
          <tr>
            <td>${esc(r.studentName)}${r.transferidoDe?'<br><span class="muted" style="font-size:.75rem;">↪ transferido de outra avaliação</span>':''}</td>
            <td>${r.total}/${max}</td>
            <td><button class="btn btn-ghost btn-sm" data-action="coord-abrir-transferir-resposta" data-idx="${idx}">🔀 Transferir</button></td>
          </tr>
          ${c.transferRespIdx===idx ? `
          <tr><td colspan="3" style="padding:0;">
            <div class="card" style="background:var(--surface); margin:6px 0; padding:10px;">
              <label style="font-size:.8rem;">Transferir a resposta de <strong>${esc(r.studentName)}</strong> pra qual avaliação (o gabarito correto)?</label>
              <select id="coord-transfer-target-select" class="input">
                <option value="">Selecione a avaliação correta...</option>
                ${outrasAvaliacoes.map(x => `<option value="${x.code}" ${c.transferTargetCode===x.code?'selected':''}>${esc(x.title)}${x.disciplinaName?' · '+esc(x.disciplinaName):''} (${x.code})</option>`).join('')}
              </select>
              ${c.transferError ? `<p class="err" style="font-size:.82rem;">${esc(c.transferError)}</p>` : ''}
              <div class="row" style="margin-top:8px;">
                <button class="btn btn-ghost btn-sm" data-action="coord-cancelar-transferir-resposta">Cancelar</button>
                <button class="btn btn-primary btn-sm" data-action="coord-confirmar-transferir-resposta">Confirmar transferência</button>
              </div>
            </div>
          </td></tr>
          ` : ''}
        `).join('')}
      </table>
      </div>
    `;
  }
  return `
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2>${esc(a.title)}</h2>
        <span class="pill">${a.code}</span>
      </div>
      ${body}
      <div style="margin-top:18px;">
        <button class="btn btn-ghost" data-action="coord-back-to-list">← Voltar</button>
      </div>
    </div>
  `;
}
async function loadCoordProfessores(){
  const c = state.coordenador;
  c.professoresLoading = true;
  c.professores = await fetchProfessoresList();
  c.professoresLoading = false;
  render();
}
function ensureProfessorUsage(rec){
  if(!Array.isArray(rec.loginLog)) rec.loginLog = [];
  if(rec.lastLoginAt===undefined) rec.lastLoginAt = null;
  return rec;
}
async function registerProfessorLogin(recordId){
  const today = new Date().toISOString().slice(0,10);
  let list;
  try{ const r = await window.storage.get('professores', true); list = JSON.parse(r.value); }catch(e){ list = null; }
  if(!list) return;
  const rec = list.find(x=>x.id===recordId);
  if(!rec) return;
  ensureProfessorUsage(rec);
  if(!rec.loginLog.includes(today)) rec.loginLog.push(today);
  rec.lastLoginAt = Date.now();
  await saveProfessoresListRaw(list);
  const c = state.coordenador;
  if(Array.isArray(c.professores)){
    const local = c.professores.find(x=>x.id===recordId);
    if(local){ local.loginLog = rec.loginLog; local.lastLoginAt = rec.lastLoginAt; }
  }
}
function professorUsageStats(rec){
  ensureProfessorUsage(rec);
  const now = Date.now();
  const DAY = 86400000;
  const last7 = rec.loginLog.filter(d => (now - new Date(d+'T00:00:00').getTime()) <= 7*DAY).length;
  const last30 = rec.loginLog.filter(d => (now - new Date(d+'T00:00:00').getTime()) <= 30*DAY).length;
  return { total: rec.loginLog.length, last7, last30 };
}
function renderCoordFrequenciaProfessores(){
  const c = state.coordenador;
  if(c.professoresLoading){
    return `<div class="card"><h2>Frequência de uso dos professores</h2><div class="spinner"></div></div>`;
  }
  const ativos = c.professores.filter(pr => pr.activatedAt);
  const pendentes = c.professores.filter(pr => !pr.activatedAt);
  const rows = ativos.map(pr => ({ pr, stats: professorUsageStats(pr) }))
    .sort((a,b) => b.stats.last30 - a.stats.last30 || b.stats.total - a.stats.total);
  const body = rows.length===0 ? '<div class="empty">Nenhum professor ativo ainda.</div>' : `
    <div class="table-scroll">
    <table>
      <tr><th>Professor</th><th>Último acesso</th><th>Dias de acesso (total)</th><th>Últimos 7 dias</th><th>Últimos 30 dias</th><th>Frequência</th></tr>
      ${rows.map(({pr, stats}) => `
        <tr>
          <td>${esc(pr.displayName||pr.email)}${pr.disciplina?'<br><span class="muted" style="font-size:.78rem;">'+esc(pr.disciplina)+'</span>':''}</td>
          <td>${pr.lastLoginAt ? new Date(pr.lastLoginAt).toLocaleDateString('pt-BR')+' às '+new Date(pr.lastLoginAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '—'}</td>
          <td style="text-align:center;">${stats.total}</td>
          <td style="text-align:center;">${stats.last7}</td>
          <td style="text-align:center;">${stats.last30}</td>
          <td style="min-width:120px;">
            <div style="background:var(--paper-line); border-radius:6px; overflow:hidden; height:10px;">
              <div style="width:${Math.min(100, Math.round((stats.last30/30)*100))}%; height:100%; background:var(--teal);"></div>
            </div>
          </td>
        </tr>
      `).join('')}
    </table>
    </div>
  `;
  const pendentesBlock = pendentes.length>0 ? `
    <h3 style="margin-top:22px;">Ainda sem primeiro acesso</h3>
    <p class="muted" style="font-size:.85rem;">${pendentes.map(pr=>esc(pr.displayName||pr.email)).join(', ')}</p>
  ` : '';
  return `
    <div class="card">
      <h2>Frequência de uso dos professores</h2>
      <p class="muted">Quantos dias distintos cada professor entrou no sistema, quando foi o último acesso e a frequência de uso nos últimos 7 e 30 dias.</p>
      ${body}
      ${pendentesBlock}
    </div>
  `;
}
function ensureCoordDataLoaded(){
  const c = state.coordenador;
  if(c.professoresLoading) loadCoordProfessores();
  if(c.assessmentsLoading) loadCoordAssessments();
  if(state.professor.turmasLoading) loadTurmas();
  if(state.professor.periodosLoading) loadPeriodos();
  if(state.professor.livrosLoading) loadLivros();
  if(state.professor.avisosLoading) loadAvisos();
  if(state.professor.temporadaLoading) loadTemporada();
}
async function loadCoordMonitoria(){
  const c = state.coordenador;
  c.monitoria.loading = true;
  render();
  try{
    const r = await window.storage.get('monitoria-desempenho', true);
    const data = JSON.parse(r.value);
    c.monitoria.grupos = data.grupos || [];
    c.monitoria.vinculos = data.vinculos || [];
  }catch(e){
    c.monitoria.grupos = [];
    c.monitoria.vinculos = [];
  }
  try{
    const r2 = await window.storage.get('monitoria-indicados', true);
    c.monitoria.indicados = JSON.parse(r2.value) || [];
  }catch(e){
    c.monitoria.indicados = [];
  }
  c.monitoria.loaded = true;
  c.monitoria.loading = false;
  render();
}
async function loadCoordBuscaAtiva(){
  const c = state.coordenador;
  c.buscaAtiva.loading = true;
  render();
  try{
    const r = await window.storage.get('busca-ativa-vinculos', true);
    const data = JSON.parse(r.value);
    c.buscaAtiva.vinculos = data.vinculos || [];
  }catch(e){
    c.buscaAtiva.vinculos = [];
  }
  c.buscaAtiva.loaded = true;
  c.buscaAtiva.loading = false;
  render();
}
async function saveBuscaAtivaVinculos(){
  const c = state.coordenador;
  await window.storage.set('busca-ativa-vinculos', JSON.stringify({ vinculos: c.buscaAtiva.vinculos }), true);
}
async function atribuirMonitorBuscaAtiva(){
  const c = state.coordenador;
  const turma = state.professor.turmas.find(t=>t.id===c.buscaAtiva.atribuirTurmaId);
  if(!turma || !c.buscaAtiva.atribuirMonitorId){
    c.buscaAtiva.atribuirError = 'Escolha a turma apadrinhada e o aluno monitor.';
    render(); return;
  }
  let monitor = null, monitorTurma = null;
  for(const t of state.professor.turmas){
    const s = (t.students||[]).find(x=>x.id===c.buscaAtiva.atribuirMonitorId);
    if(s){ monitor = s; monitorTurma = t; break; }
  }
  if(!monitor){ c.buscaAtiva.atribuirError = 'Aluno monitor não encontrado.'; render(); return; }
  if(c.buscaAtiva.vinculos.some(v=>v.monitorId===monitor.id && v.turmaId===turma.id)){
    c.buscaAtiva.atribuirError = 'Esse aluno já é monitor dessa turma apadrinhada.';
    render(); return;
  }
  c.buscaAtiva.vinculos.push({
    id: cryptoId(), monitorId: monitor.id, monitorName: monitor.name,
    monitorTurmaId: monitorTurma.id, monitorTurmaName: monitorTurma.name,
    turmaId: turma.id, turmaName: turma.name, createdAt: Date.now()
  });
  c.buscaAtiva.atribuirTurmaId = '';
  c.buscaAtiva.atribuirMonitorId = '';
  c.buscaAtiva.atribuirMonitorBusca = '';
  c.buscaAtiva.atribuirError = '';
  await saveBuscaAtivaVinculos();
  render();
}
async function removerMonitorBuscaAtiva(vinculoId){
  const c = state.coordenador;
  if(!confirm('Remover esse aluno como monitor dessa turma apadrinhada?')) return;
  c.buscaAtiva.vinculos = c.buscaAtiva.vinculos.filter(v=>v.id!==vinculoId);
  await saveBuscaAtivaVinculos();
  render();
}
async function buscaAtivaSalvarAlunoDoc(studentId, patch){
  let atual = { nomeResponsavel:'', telefone:'', registros:[] };
  try{
    const r = await window.storage.get(buscaAtivaAlunoKey(studentId), true);
    const saved = JSON.parse(r.value);
    atual = { ...saved, nomeResponsavel: saved.nomeResponsavel||'', telefone: saved.telefone||'', registros: saved.registros||[] };
  }catch(e){ /* aluno ainda sem documento salvo */ }
  const novo = { ...atual, ...patch };
  await window.storage.set(buscaAtivaAlunoKey(studentId), JSON.stringify(novo), true);
  return novo;
}
function buscaAtivaAtualizarCache(role, turmaId, studentId, novo){
  const store = role==='aluno' ? state.aluno.buscaAtiva : state.coordenador.buscaAtiva;
  const det = store.turmaDetalhe[turmaId];
  if(det && det.data){
    const idx = det.data.alunos.findIndex(a=>a.studentId===studentId);
    if(idx>=0) det.data.alunos[idx] = { ...det.data.alunos[idx], ...novo };
  }
}
async function loadBuscaAtivaAlunosDaTurma(turmaId, role, forceRefresh){
  const store = role==='aluno' ? state.aluno.buscaAtiva : state.coordenador.buscaAtiva;
  const turma = state.professor.turmas.find(t=>t.id===turmaId);
  if(!turma) return;
  const cacheAtual = store.turmaDetalhe[turmaId];
  if(cacheAtual && cacheAtual.loaded && !forceRefresh) return;
  store.turmaDetalhe[turmaId] = { loading:true, loaded:false, data: cacheAtual ? cacheAtual.data : null };
  render();
  await ensureFreqStats(turma.id, turma, forceRefresh);
  const freqCache = state.freqStatsCache[turma.id];
  const faltasPorAlunoId = (freqCache && freqCache.stats && freqCache.stats.faltasPorAlunoId) || {};
  const faltasGeralPorAlunoId = (freqCache && freqCache.stats && freqCache.stats.faltasGeralPorAlunoId) || {};
  const alunos = await Promise.all((turma.students||[]).map(async s => {
    let doc = { nomeResponsavel:'', telefone:'', registros:[] };
    try{
      const r = await window.storage.get(buscaAtivaAlunoKey(s.id), true);
      const saved = JSON.parse(r.value);
      doc = { nomeResponsavel: saved.nomeResponsavel||'', telefone: saved.telefone||'', registros: saved.registros||[], autorizaWhatsapp: !!saved.autorizaWhatsapp };
    }catch(e){ /* ainda sem documento salvo pra esse aluno */ }
    return { studentId: s.id, studentName: s.name, ...doc, faltas: faltasPorAlunoId[s.id] || null, faltasGeral: faltasGeralPorAlunoId[s.id] || null };
  }));
  store.turmaDetalhe[turmaId] = { loading:false, loaded:true, data: { turmaId: turma.id, turmaName: turma.name, alunos } };
  render();
}
async function coordBuscaAtivaEditarContato(studentId, turmaId){
  const nomeInput = document.getElementById(`busca-contato-nome-${studentId}`);
  const telInput = document.getElementById(`busca-contato-tel-${studentId}`);
  const nomeResponsavel = nomeInput ? nomeInput.value.trim() : '';
  const telefone = telInput ? telInput.value.trim() : '';
  const novo = await buscaAtivaSalvarAlunoDoc(studentId, { nomeResponsavel, telefone, updatedAt: Date.now(), updatedBy: 'coordenacao' });
  buscaAtivaAtualizarCache('coord', turmaId, studentId, novo);
  render();
}
async function coordBuscaAtivaRegistrarAcao(studentId, turmaId){
  const c = state.coordenador;
  const sel = document.getElementById(`busca-acao-select-${studentId}`);
  const obsInput = document.getElementById(`busca-acao-obs-${studentId}`);
  const acaoKey = sel ? sel.value : BUSCA_ATIVA_ACOES[0].key;
  const observacao = obsInput ? obsInput.value.trim() : '';
  const det = c.buscaAtiva.turmaDetalhe[turmaId];
  const alunoAtual = det && det.data ? det.data.alunos.find(a=>a.studentId===studentId) : null;
  const registros = [
    { id: cryptoId(), data: new Date().toISOString().slice(0,10), acao: acaoKey, observacao, registradoPor: 'coordenacao', createdAt: Date.now() },
    ...((alunoAtual && alunoAtual.registros) || [])
  ];
  const novo = await buscaAtivaSalvarAlunoDoc(studentId, { registros });
  buscaAtivaAtualizarCache('coord', turmaId, studentId, novo);
  if(obsInput) obsInput.value = '';
  render();
}
async function saveMonitoriaIndicados(){
  const c = state.coordenador;
  await window.storage.set('monitoria-indicados', JSON.stringify(c.monitoria.indicados), true);
}
async function monitoriaIndicarAlunos(){
  const c = state.coordenador;
  const turma = state.professor.turmas.find(t=>t.id===c.monitoria.indicarTurmaId);
  if(!turma || c.monitoria.indicarSelecionados.length===0){ c.monitoria.indicarError = 'Escolha ao menos um aluno.'; render(); return; }
  c.monitoria.indicarSelecionados.forEach(studentId => {
    if(c.monitoria.indicados.some(i=>i.studentId===studentId)) return;
    const s = turma.students.find(x=>x.id===studentId);
    if(!s) return;
    c.monitoria.indicados.push({ studentId: s.id, studentName: s.name, turmaId: turma.id, turmaName: turma.name, indicadoEm: Date.now() });
  });
  c.monitoria.indicarError = '';
  c.monitoria.indicarTurmaId = '';
  c.monitoria.indicarSelecionados = [];
  await saveMonitoriaIndicados();
  render();
}
async function monitoriaRemoverIndicado(studentId){
  const c = state.coordenador;
  c.monitoria.indicados = c.monitoria.indicados.filter(i=>i.studentId!==studentId);
  await saveMonitoriaIndicados();
  render();
}
async function fetchCampanhaItensList(){
  try{
    const list = await window.storage.list('campanha-item:', true);
    const vals = list.values || {};
    const itens = await Promise.all((list.keys||[]).map(async k => {
      try{
        if(vals[k]!==undefined) return JSON.parse(vals[k]);
        const r = await window.storage.get(k, true); return JSON.parse(r.value);
      }catch(e){ return null; }
    }));
    return itens.filter(Boolean).sort((a,b)=>(b.criadoEm||0)-(a.criadoEm||0));
  }catch(e){ return []; }
}
async function loadJovensProtagonistasIndicados(){
  try{ const r = await window.storage.get('jovens-protagonistas-indicados', true); return JSON.parse(r.value) || []; }
  catch(e){ return []; }
}
async function saveJovensProtagonistasIndicados(list){
  await window.storage.set('jovens-protagonistas-indicados', JSON.stringify(list), true);
}
function alunoSouJovemProtagonista(){
  const al = state.aluno;
  return (al.campanha.indicados||[]).some(i=>i.studentId===al.matriculaStudentId);
}
const CAMPANHA_CACHE_KEY = 'campanha-cache-v1';
function campanhaCacheLer(){
  try{ const c = JSON.parse(localStorage.getItem(CAMPANHA_CACHE_KEY)||'null'); return (c && Array.isArray(c.itens)) ? c.itens.filter(campanhaNoAr) : null; }catch(e){ return null; }
}
function campanhaCacheGravar(itens){
  try{ localStorage.setItem(CAMPANHA_CACHE_KEY, JSON.stringify({ ts:Date.now(), itens:(itens||[]).filter(i=>i.status==='aprovado' && !i.imagemDataUrl) })); }catch(e){}
}
async function loadCampanhaAluno(){
  const al = state.aluno;
  al.campanha.loading = true;
  const cache = campanhaCacheLer();
  if(cache && cache.length){ al.campanha.itens = cache; al.campanha.loaded = true; }   // mostra já os banners da última visita
  render();
  const [indicados, itens] = await Promise.all([loadJovensProtagonistasIndicados(), fetchCampanhaItensList()]);
  al.campanha.indicados = indicados;
  al.campanha.itens = itens;
  campanhaCacheGravar(itens);
  al.campanha.loaded = true;
  al.campanha.loading = false;
  render();
}
async function loadCampanhaCoord(){
  const c = state.coordenador;
  c.campanha.loading = true;
  render();
  c.campanha.indicados = await loadJovensProtagonistasIndicados();
  c.campanha.itens = await fetchCampanhaItensList();
  c.campanha.loaded = true;
  c.campanha.loading = false;
  render();
}
async function loadCampanhaProfessor(){
  const p = state.professor;
  p.campanhaItensLoading = true;
  const cache = campanhaCacheLer();
  if(cache && cache.length){ p.campanhaItens = cache; }
  render();
  const todos = await fetchCampanhaItensList();
  p.campanhaItens = todos.filter(campanhaNoAr);
  campanhaCacheGravar(todos);
  p.campanhaItensLoading = false;
  render();
}
function campanhaPendentesCount(){
  return state.coordenador.campanha.itens.filter(i=>i.status==='pendente').length;
}
function extractYoutubeId(url){
  if(!url) return null;
  const m = String(url).trim().match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function campanhaImgSrc(item, thumbSize){
  const url = item.imagemUrl || item.imagemDataUrl || '';
  return thumbSize ? cloudinaryThumb(url, thumbSize) : url;
}
async function handleCampanhaImagemUpload(file){
  const al = state.aluno;
  if(!file) return;
  if(!file.type.startsWith('image/')){ al.campanha.erro = 'Selecione um arquivo de imagem.'; render(); return; }
  al.campanha.novoImagemUploading = true;
  al.campanha.erro = '';
  al.campanha.novoImagemUrl = '';
  render();
  try{
    const img = await loadImageFile(file);
    // Mostra a foto na hora (prévia local, pequena e rápida de gerar) enquanto o envio de
    // verdade acontece por trás — assim o aluno já vê a imagem dele, não só um "carregando".
    al.campanha.novoImagemPreviewUrl = resizeImageToDataUrl(img, 500, 0.6);
    render();
    // A foto que efetivamente fica salva vai pro Cloudinary (ver uploadImageToCloudinary);
    // o banco de dados guarda só o link que volta daqui, nunca a imagem em si.
    const blob = await resizeImageToBlob(img, 1600, 0.82);
    const url = await uploadImageToCloudinary(blob, 'campanha');
    al.campanha.novoImagemUrl = url;
  }catch(e){
    al.campanha.novoImagemPreviewUrl = '';
    al.campanha.erro = (e && e.message==='storage-indisponivel')
      ? 'O envio de fotos ainda não foi configurado. Fale com a coordenação.'
      : 'Não foi possível enviar essa imagem agora. Verifique sua internet e tente de novo.';
  }
  al.campanha.novoImagemUploading = false;
  render();
}
async function campanhaEnviarItem(){
  const al = state.aluno;
  const ca = al.campanha;
  if(!alunoSouJovemProtagonista()){ ca.erro = 'Você ainda não foi indicado(a) pela coordenação como Jovem Protagonista.'; render(); return; }
  const titulo = (ca.novoTitulo||'').trim();
  if(!titulo){ ca.erro = 'Dê um título pra publicação.'; render(); return; }
  if(ca.novoTipo==='imagem' && ca.novoImagemUploading){ ca.erro = 'Espere a imagem terminar de enviar.'; render(); return; }
  if(ca.novoTipo==='imagem' && !ca.novoImagemUrl){ ca.erro = 'Envie uma imagem.'; render(); return; }
  let youtubeId = null;
  if(ca.novoTipo==='video'){
    youtubeId = extractYoutubeId(ca.novoYoutubeUrl);
    if(!youtubeId){ ca.erro = 'Cole um link válido de um vídeo do YouTube.'; render(); return; }
  }
  ca.enviando = true;
  ca.erro = '';
  render();
  const item = {
    id: cryptoId(), tipo: ca.novoTipo,
    imagemUrl: ca.novoTipo==='imagem' ? ca.novoImagemUrl : '',
    youtubeUrl: ca.novoTipo==='video' ? ca.novoYoutubeUrl.trim() : '',
    youtubeId: youtubeId || '',
    titulo, descricao: (ca.novoDescricao||'').trim(),
    autorStudentId: al.matriculaStudentId, autorNome: al.name,
    turmaId: al.turma ? al.turma.id : '', turmaName: al.turma ? al.turma.name : '',
    status: 'pendente', motivoRecusa: '',
    criadoEm: Date.now(), revisadoEm: null
  };
  try{
    // Documento pequeno só com texto e o link da foto (nunca a foto em si) — por isso cabe
    // tranquilo no limite de tamanho do Firestore mesmo com muitas publicações acumuladas.
    await window.storage.set(`campanha-item:${item.id}`, JSON.stringify(item), true);
    ca.itens.unshift(item);
    ca.novoTitulo = ''; ca.novoDescricao = ''; ca.novoImagemUrl = ''; ca.novoImagemPreviewUrl = ''; ca.novoYoutubeUrl = '';
  }catch(e){
    ca.erro = 'Não foi possível enviar agora. Verifique sua internet e tente de novo.';
  }
  ca.enviando = false;
  render();
}
function campanhaNoAr(i){ return !!i && i.status==='aprovado' && (!i.expiraEm || Date.now() <= i.expiraEm); }
function campBannerState(){
  const c = state.coordenador;
  if(!c.campanha.banner) c.campanha.banner = { titulo:'', descricao:'', tipo:'imagem', imagemUrl:'', preview:'', uploading:false, youtubeUrl:'', expira:'', erro:'', salvando:false, aberto:false, mostrarLegenda:false };
  return c.campanha.banner;
}
async function handleCoordBannerImagem(file){
  const b = campBannerState();
  if(!file) return;
  if(!file.type.startsWith('image/')){ b.erro = 'Selecione um arquivo de imagem.'; render(); return; }
  b.uploading = true; b.erro = ''; b.imagemUrl = ''; render();
  try{
    const img = await loadImageFile(file);
    b.preview = resizeImageToDataUrl(img, 500, 0.6);
    render();
    const blob = await resizeImageToBlob(img, 1600, 0.82);
    b.imagemUrl = await uploadImageToCloudinary(blob, 'campanha');
  }catch(e){
    b.preview = '';
    b.erro = (e && e.message==='storage-indisponivel') ? 'O envio de fotos ainda não foi configurado.' : 'Não foi possível enviar essa imagem agora. Verifique a internet e tente de novo.';
  }
  b.uploading = false; render();
}
async function publicarBannerCoord(){
  const c = state.coordenador, b = campBannerState();
  const titulo = (b.titulo||'').trim();
  if(!titulo){ b.erro = 'Dê um título ao banner.'; render(); return; }
  let youtubeId = '';
  if(b.tipo==='imagem'){
    if(b.uploading){ b.erro = 'Espere a imagem terminar de enviar.'; render(); return; }
    if(!b.imagemUrl){ b.erro = 'Envie uma imagem.'; render(); return; }
  } else {
    youtubeId = extractYoutubeId(b.youtubeUrl) || '';
    if(!youtubeId){ b.erro = 'Cole um link válido de um vídeo do YouTube.'; render(); return; }
  }
  let expiraEm = null;
  if(b.expira){
    expiraEm = new Date(b.expira+'T23:59:59').getTime();
    if(isNaN(expiraEm)){ b.erro = 'Data de término inválida.'; render(); return; }
    if(expiraEm < Date.now()){ b.erro = 'A data de término já passou.'; render(); return; }
  }
  b.salvando = true; b.erro = ''; render();
  const item = {
    id: cryptoId(), tipo: b.tipo,
    imagemUrl: b.tipo==='imagem' ? b.imagemUrl : '',
    youtubeUrl: b.tipo==='video' ? b.youtubeUrl.trim() : '', youtubeId,
    titulo, descricao: (b.descricao||'').trim(),
    autorStudentId:'', autorNome:'Coordenação', turmaId:'', turmaName:'Escola', origem:'coordenacao',
    status:'aprovado', motivoRecusa:'', criadoEm: Date.now(), revisadoEm: Date.now(), expiraEm, mostrarLegenda: !!b.mostrarLegenda
  };
  try{
    await window.storage.set(`campanha-item:${item.id}`, JSON.stringify(item), true);
    c.campanha.itens.unshift(item);
    Object.assign(b, { titulo:'', descricao:'', imagemUrl:'', preview:'', youtubeUrl:'', expira:'', aberto:false });
    c.campanha.subview = 'aprovados';
  }catch(e){ b.erro = 'Não foi possível publicar agora. Tente de novo.'; }
  b.salvando = false; render();
}
async function campanhaAprovarItem(id){
  const c = state.coordenador;
  const item = c.campanha.itens.find(i=>i.id===id);
  if(!item) return;
  item.status = 'aprovado';
  item.motivoRecusa = '';
  item.revisadoEm = Date.now();
  await window.storage.set(`campanha-item:${id}`, JSON.stringify(item), true);
  render();
}
function campanhaAbrirRecusa(id){
  const c = state.coordenador;
  c.campanha.recusarItemId = id;
  c.campanha.recusarMotivo = '';
  render();
}
function campanhaFecharRecusa(){
  const c = state.coordenador;
  c.campanha.recusarItemId = null;
  c.campanha.recusarMotivo = '';
  render();
}
async function campanhaConfirmarRecusa(){
  const c = state.coordenador;
  const item = c.campanha.itens.find(i=>i.id===c.campanha.recusarItemId);
  if(!item) return;
  item.status = 'recusado';
  item.motivoRecusa = (c.campanha.recusarMotivo||'').trim();
  item.revisadoEm = Date.now();
  await window.storage.set(`campanha-item:${item.id}`, JSON.stringify(item), true);
  c.campanha.recusarItemId = null;
  c.campanha.recusarMotivo = '';
  render();
}
async function campanhaExcluirItem(id){
  if(!confirm('Excluir esta publicação definitivamente?')) return;
  const c = state.coordenador;
  c.campanha.itens = c.campanha.itens.filter(i=>i.id!==id);
  await window.storage.delete(`campanha-item:${id}`, true);
  render();
}
async function campanhaIndicarAlunos(){
  const c = state.coordenador;
  const turma = state.professor.turmas.find(t=>t.id===c.campanha.indicarTurmaId);
  if(!turma || c.campanha.indicarSelecionados.length===0){ c.campanha.indicarError = 'Escolha ao menos um aluno.'; render(); return; }
  c.campanha.indicarSelecionados.forEach(studentId => {
    if(c.campanha.indicados.some(i=>i.studentId===studentId)) return;
    const s = turma.students.find(x=>x.id===studentId);
    if(!s) return;
    c.campanha.indicados.push({ studentId: s.id, studentName: s.name, turmaId: turma.id, turmaName: turma.name, indicadoEm: Date.now() });
  });
  c.campanha.indicarError = '';
  c.campanha.indicarTurmaId = '';
  c.campanha.indicarSelecionados = [];
  await saveJovensProtagonistasIndicados(c.campanha.indicados);
  render();
}
async function campanhaRemoverIndicado(studentId){
  const c = state.coordenador;
  c.campanha.indicados = c.campanha.indicados.filter(i=>i.studentId!==studentId);
  await saveJovensProtagonistasIndicados(c.campanha.indicados);
  render();
}
function renderCoordBuscaAtiva(){
  const c = state.coordenador;
  if(!c.buscaAtiva.turmasCarregadas){
    c.buscaAtiva.turmasCarregadas = true;
    loadTurmas().then(()=>render());
  }
  if(c.buscaAtiva.loading){
    return `<div class="card"><h2>🚌 Busca Ativa e Transporte Escolar</h2><div class="spinner"></div></div>`;
  }
  if(c.buscaAtiva.detalheTurmaId){
    return renderCoordBuscaAtivaDetalheTurma(c.buscaAtiva.detalheTurmaId);
  }
  const vistosAntes = new Set(buscaAtivaVistosGet());
  const acionamentos = buscaAtivaAcionamentosNaoVistos();
  // Abrir esta tela marca como vistos os acionamentos já carregados (mesmo padrão da
  // Monitoria de Desempenho), fazendo o "NOVO" sumir do contador do menu lateral.
  if(acionamentos.length>0) buscaAtivaMarcarAcionamentosVistos();

  const porTurma = {};
  c.buscaAtiva.vinculos.forEach(v => {
    if(!porTurma[v.turmaId]) porTurma[v.turmaId] = { turmaId:v.turmaId, turmaName:v.turmaName, monitores:[] };
    porTurma[v.turmaId].monitores.push(v);
  });

  return `
    <div class="card">
      <h2>🚌 Busca Ativa e Transporte Escolar</h2>
      <p class="muted">Alunos-monitores acompanham a frequência de toda a turma apadrinhada, registram o contato dos responsáveis e o que foi feito em cada caso — com alerta pra coordenação quando a Direção precisa ser acionada.</p>

      <div class="card" style="margin-top:14px;">
        <h3 style="margin-top:0;">Atribuir monitor a uma turma apadrinhada</h3>
        <p class="muted" style="font-size:.85rem;">Mais de um aluno pode ser monitor da mesma turma.</p>
        <label>Turma apadrinhada</label>
        <select id="busca-atribuir-turma-select">
          <option value="">Selecione...</option>
          ${state.professor.turmas.map(t=>`<option value="${t.id}" ${t.id===c.buscaAtiva.atribuirTurmaId?'selected':''}>${esc(t.name)}</option>`).join('')}
        </select>
        <label style="margin-top:8px;">Aluno monitor</label>
        <input type="text" id="busca-atribuir-monitor-busca-input" placeholder="Digite o nome do aluno para filtrar..." value="${esc(c.buscaAtiva.atribuirMonitorBusca||'')}" style="margin-bottom:6px;">
        <select id="busca-atribuir-monitor-select" size="6">
          <option value="">Selecione...</option>
          ${(() => {
            const termo = (c.buscaAtiva.atribuirMonitorBusca||'').trim().toLowerCase();
            const opcoes = [];
            state.professor.turmas.forEach(t => (t.students||[]).forEach(s => {
              if(!termo || s.name.toLowerCase().includes(termo)) opcoes.push({s, t});
            }));
            if(termo && opcoes.length===0) return '';
            return opcoes.map(({s,t})=>`<option value="${s.id}" ${s.id===c.buscaAtiva.atribuirMonitorId?'selected':''}>${esc(s.name)} (${esc(t.name)})</option>`).join('');
          })()}
        </select>
        ${(() => {
          const termo = (c.buscaAtiva.atribuirMonitorBusca||'').trim().toLowerCase();
          const temResultado = state.professor.turmas.some(t => (t.students||[]).some(s=>!termo || s.name.toLowerCase().includes(termo)));
          return (termo && !temResultado) ? '<p class="muted" style="font-size:.8rem;">Nenhum aluno encontrado com esse nome.</p>' : '';
        })()}
        ${c.buscaAtiva.atribuirError ? `<p class="err">${esc(c.buscaAtiva.atribuirError)}</p>` : ''}
        <button class="btn btn-primary btn-sm" style="margin-top:10px;" data-action="busca-atribuir-monitor">Atribuir</button>
      </div>

      ${acionamentos.length>0 ? `
        <div class="card" style="border:2px solid var(--red); margin-top:14px;">
          <h3 style="margin-top:0; color:var(--red);">🚨 Acionamentos à Direção</h3>
          ${acionamentos.map(r => {
            const ehNovo = !vistosAntes.has(r.id);
            return `
            <div class="list-item" style="align-items:flex-start;">
              <div>
                <strong>${esc(r.studentName)}</strong> <span class="muted">(${esc(r.turmaName)})</span>
                ${ehNovo ? '<span style="background:var(--red); color:#fff; font-size:.68rem; font-weight:700; padding:1px 7px; border-radius:10px; margin-left:6px; vertical-align:middle;">NOVO</span>' : ''}<br>
                <span class="muted" style="font-size:.8rem;">registrado em ${new Date(r.data+'T00:00:00').toLocaleDateString('pt-BR')}${r.observacao ? ' · '+esc(r.observacao) : ''}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      ` : ''}

      <h3 style="margin-top:20px;">Turmas apadrinhadas</h3>
      ${Object.keys(porTurma).length===0 ? '<p class="muted">Nenhuma turma apadrinhada atribuída ainda.</p>' : Object.values(porTurma).map(g => `
        <div class="card" style="margin-top:10px;">
          <div class="row" style="align-items:center; justify-content:space-between;">
            <strong>${esc(g.turmaName)}</strong>
            <button class="btn btn-ghost btn-sm" data-action="busca-ver-turma" data-tid="${g.turmaId}">Ver turma</button>
          </div>
          <p class="muted" style="margin:6px 0 0;">Monitor(es): ${g.monitores.map(v=>`${esc(v.monitorName)} <button class="btn btn-ghost btn-sm" style="padding:0 4px;" data-action="busca-remover-monitor" data-vid="${v.id}" title="Remover">✕</button>`).join(', ')}</p>
        </div>
      `).join('')}
    </div>
  `;
}
function renderCoordBuscaAtivaDetalheTurma(turmaId){
  const c = state.coordenador;
  const det = c.buscaAtiva.turmaDetalhe[turmaId];
  if(!det || (!det.loaded && !det.loading)){ loadBuscaAtivaAlunosDaTurma(turmaId, 'coord'); }
  if(!det || det.loading){
    return `<div class="card"><button class="btn btn-ghost btn-sm" data-action="busca-fechar-turma">← Voltar</button><div class="spinner"></div></div>`;
  }
  const data = det.data;
  return `
    <div class="card">
      <button class="btn btn-ghost btn-sm" data-action="busca-fechar-turma">← Voltar</button>
      <h3 style="margin-top:10px;">🚌 ${esc(data.turmaName)}</h3>
      <p class="muted">Frequência, contato dos responsáveis e ações de busca ativa de todos os alunos da turma.</p>
      ${data.alunos.map(a => renderBuscaAtivaAlunoCard(a, turmaId, 'coord')).join('')}
    </div>
  `;
}
function renderBuscaAtivaAlunoCard(a, turmaId, role){
  const freq = a.faltas;
  const freqGeral = a.faltasGeral;
  const freqTxt = (freq && freq.diasComputados>0) ? `${freq.faltas} falta(s) de ${freq.diasComputados} dia(s) no mês` : 'sem dados de frequência no mês';
  const freqGeralTxt = (freqGeral && freqGeral.diasComputados>0) ? `${freqGeral.faltas} falta(s) de ${freqGeral.diasComputados} dia(s) (últimos 31 dias)` : 'sem dados de frequência geral';
  const corFreq = (freq && freq.diasComputados>0 && freq.faltas===0) ? 'var(--green)' : ((freq && freq.diasComputados>0 && (freq.faltas/freq.diasComputados)>0.25) ? 'var(--red)' : 'var(--ink)');
  const corFreqGeral = (freqGeral && freqGeral.diasComputados>0 && freqGeral.faltas===0) ? 'var(--green)' : ((freqGeral && freqGeral.diasComputados>0 && (freqGeral.faltas/freqGeral.diasComputados)>0.25) ? 'var(--red)' : 'var(--ink)');
  const ultimo = (a.registros||[])[0];
  const infoUltimo = ultimo ? buscaAtivaAcaoInfo(ultimo.acao) : null;
  const prefixo = role==='aluno' ? 'busca-aluno' : 'busca-coord';
  return `
    <div class="card" style="margin-top:10px; background:var(--surface);">
      <div class="row" style="align-items:center; justify-content:space-between; flex-wrap:wrap; gap:4px;">
        <strong>${esc(a.studentName)}</strong>
        <span style="text-align:right;">
          <span class="muted" style="font-size:.78rem; color:${corFreq}; display:block;">📅 ${freqTxt}</span>
          <span class="muted" style="font-size:.74rem; color:${corFreqGeral}; display:block;">📊 Geral: ${freqGeralTxt}</span>
        </span>
      </div>
      <div class="row" style="margin-top:8px; gap:8px; flex-wrap:wrap;">
        <input type="text" id="busca-contato-nome-${a.studentId}" placeholder="Nome do responsável" value="${esc(a.nomeResponsavel||'')}" style="flex:1 1 180px;">
        <input type="text" id="busca-contato-tel-${a.studentId}" placeholder="Telefone" value="${esc(a.telefone||'')}" style="flex:1 1 140px;">
        <button class="btn btn-ghost btn-sm" data-action="${prefixo}-salvar-contato" data-sid="${a.studentId}" data-tid="${turmaId}">Salvar contato</button>
        <label style="display:inline-flex; align-items:center; gap:6px; font-size:.82rem; flex:0 0 auto;"><input type="checkbox" data-avp-ba="${a.studentId}" data-tid="${turmaId}" ${a.autorizaWhatsapp?'checked':''} style="width:auto;"> 📲 Autoriza avisos por WhatsApp</label>
      </div>
      <div class="row" style="margin-top:10px; gap:8px; flex-wrap:wrap; align-items:flex-end;">
        <div style="flex:1 1 200px;">
          <label style="font-size:.78rem;">Ação imediata</label>
          <select id="busca-acao-select-${a.studentId}">
            ${BUSCA_ATIVA_ACOES.map(o=>`<option value="${o.key}">${o.emoji} ${o.label}</option>`).join('')}
          </select>
        </div>
        <div style="flex:2 1 220px;">
          <label style="font-size:.78rem;">Observação (opcional)</label>
          <input type="text" id="busca-acao-obs-${a.studentId}" placeholder="Detalhe o que foi feito...">
        </div>
        <button class="btn btn-primary btn-sm" data-action="${prefixo}-registrar-acao" data-sid="${a.studentId}" data-tid="${turmaId}">Registrar</button>
      </div>
      ${ultimo ? `<p class="muted" style="font-size:.78rem; margin:8px 0 0;">Última ação: ${infoUltimo.emoji} ${esc(infoUltimo.label)} em ${new Date(ultimo.data+'T00:00:00').toLocaleDateString('pt-BR')}</p>` : ''}
      ${(a.registros && a.registros.length>0) ? `
        <details style="margin-top:6px;">
          <summary style="cursor:pointer; font-size:.8rem;">Ver histórico (${a.registros.length})</summary>
          ${a.registros.map(r => {
            const info = buscaAtivaAcaoInfo(r.acao);
            return `<div class="list-item" style="align-items:flex-start;">
              <div>
                <span>${info.emoji} <strong>${esc(info.label)}</strong></span><br>
                <span class="muted" style="font-size:.76rem;">${new Date(r.data+'T00:00:00').toLocaleDateString('pt-BR')}</span>
                ${r.observacao ? `<p style="margin:2px 0 0;">${esc(r.observacao)}</p>` : ''}
              </div>
            </div>`;
          }).join('')}
        </details>
      ` : ''}
    </div>
  `;
}
function renderAlunoBuscaAtivaBlock(){
  const al = state.aluno;
  if(!al.buscaAtiva.loaded && !al.buscaAtiva.loading){ loadAlunoBuscaAtiva(); }
  if(al.buscaAtiva.loading){
    return `<div class="card"><h3 style="margin-top:0;">🚌 Busca Ativa e Transporte Escolar</h3><div class="spinner"></div></div>`;
  }
  if(al.buscaAtiva.vinculos.length===0){
    return `<div class="card"><h3 style="margin-top:0;">🚌 Busca Ativa e Transporte Escolar</h3><p class="muted">Você não é monitor(a) de Busca Ativa no momento. Quem é monitor acompanha a frequência, o contato dos responsáveis e registra ações pra toda a turma apadrinhada.</p></div>`;
  }
  return al.buscaAtiva.vinculos.map(v => {
    const det = al.buscaAtiva.turmaDetalhe[v.turmaId];
    if(!det || (!det.loaded && !det.loading)){ loadBuscaAtivaAlunosDaTurma(v.turmaId, 'aluno'); }
    if(!det || det.loading){
      return `<div class="card"><h3 style="margin-top:0;">🚌 ${esc(v.turmaName)}</h3><div class="spinner"></div></div>`;
    }
    const data = det.data;
    return `
      <div class="card">
        <h3 style="margin-top:0;">🚌 Busca Ativa — ${esc(data.turmaName)}</h3>
        <p class="muted">Acompanhe a frequência, o contato dos responsáveis e registre o que foi feito com cada colega da turma apadrinhada.</p>
        ${data.alunos.map(a => renderBuscaAtivaAlunoCard(a, v.turmaId, 'aluno')).join('')}
      </div>
    `;
  }).join('');
}
async function saveCoordPeriodos(){
  const periodos = {};
  UNIDADES.forEach(u => {
    periodos[u] = {
      avalInicio: document.getElementById(`periodo-${u}-avalInicio`).value,
      avalFim: document.getElementById(`periodo-${u}-avalFim`).value,
      recInicio: document.getElementById(`periodo-${u}-recInicio`).value,
      recFim: document.getElementById(`periodo-${u}-recFim`).value,
    };
  });
  await savePeriodos(periodos);
  state.professor.periodos = periodos;
  state.coordenador.periodosDraft = null;
  render();
  alert('Períodos salvos.');
}
const BACKUP_FORA_ESSENCIAL = ['slide-img:', 'plano-livro-img:', 'plano-livro:', 'plano-livro-parte:', 'turmas-antigo-backup',
  'aula-viva', 'quiz-resp:', 'slides-eng:', 'enquete-ativa:', 'quiz-ativo:', 'roleta-ativa:', 'duelo-ativo:', 'slides-sessao-ativa:', 'jogo-ativo:', 'jogo-in:', 'jogo-resp:'];
function backupState(){ const c = state.coordenador; if(!c.backup) c.backup = { ultimo:null, carregado:false, restaurar:null, msg:'', erro:'', progresso:null }; return c.backup; }
async function backupCarregarUltimo(){
  const b = backupState(); if(b.carregando) return; b.carregando = true;
  try{ const r = await window.storage.get('backup-ultimo', true); b.ultimo = JSON.parse(r.value); }catch(e){ b.ultimo = null; }
  b.carregado = true; b.carregando = false; render();
}
function backupResumoHtml(){
  const b = backupState();
  if(!b.carregado){ setTimeout(backupCarregarUltimo, 0); }
  const dias = b.ultimo ? Math.floor((Date.now() - b.ultimo.at) / 86400000) : null;
  const alerta = dias==null || dias > 7;
  return `<div data-backup-resumo style="margin-top:10px; font-size:.85rem; border-radius:8px; padding:8px 10px; background:${alerta?'#fdecec':'#eef7f0'};">
    💾 ${b.ultimo ? `Último backup: <strong>${new Date(b.ultimo.at).toLocaleDateString('pt-BR')}</strong> (${dias===0?'hoje':dias===1?'ontem':'há '+dias+' dias'}, ${b.ultimo.total} documentos${b.ultimo.por?', por '+esc(b.ultimo.por):''})` : '<strong>Nenhum backup feito ainda.</strong>'}
    ${alerta ? ' — <strong style="color:#b3261e;">faça um backup agora</strong> e guarde o arquivo num lugar seguro (pendrive ou Google Drive da escola). O ideal é uma vez por semana.' : ''}
    ${b.msg ? `<div style="margin-top:4px; color:#1d6b31;">${esc(b.msg)}</div>` : ''}${b.erro ? `<div style="margin-top:4px; color:#b3261e;">${esc(b.erro)}</div>` : ''}
  </div>`;
}
async function backupTodosOsDocs(){
  const base = window.__storageBase || window.storage;
  const r = await base.list('', true);
  const out = {};
  for(const k of (r.keys||[])){
    let v = r.values ? r.values[k] : undefined;
    if(v===undefined){ try{ v = (await base.get(k, true)).value; }catch(e){ v = undefined; } }
    if(v!==undefined && v!==null) out[k] = v;
  }
  return out;
}
async function downloadFullBackup(btn, modo){
  modo = modo || 'essencial';
  const b = backupState(); b.msg = ''; b.erro = '';
  const txt = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = '⏳ Gerando backup…'; }
  try{
    await window.storage.garantirTurmas();
    const todos = await backupTodosOsDocs();
    const docs = {};
    Object.entries(todos).forEach(([k, v]) => {
      if(modo==='essencial' && BACKUP_FORA_ESSENCIAL.some(p => k.startsWith(p))) return;
      docs[k] = v;
    });
    const total = Object.keys(docs).length;
    const quem = state.coordenador.session ? 'Coordenação' : (state.professor.session ? state.professor.session.displayName : '');
    const pacote = { _meta: { versao: 2, app: 'Sala de Avaliações', escola: 'CEETIP Governador Marcelo Déda Chagas - DRE04', exportadoEm: new Date().toISOString(), modo, total }, docs };
    const blob = new Blob([JSON.stringify(pacote)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backup-sala-avaliacoes-${new Date().toISOString().slice(0,10)}${modo==='completo'?'-completo':''}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    const reg = { at: Date.now(), total, modo, por: quem, tamanhoKB: Math.round(blob.size/1024) };
    try{ await window.storage.set('backup-ultimo', JSON.stringify(reg), true); }catch(e){}
    b.ultimo = reg; b.carregado = true;
    b.msg = `✅ Backup ${modo} baixado (${total} documentos, ${reg.tamanhoKB > 1024 ? (reg.tamanhoKB/1024).toFixed(1)+' MB' : reg.tamanhoKB+' KB'}). Guarde o arquivo em local seguro: ele tem dados pessoais dos alunos.`;
  }catch(e){ b.erro = 'Não consegui gerar o backup: ' + ((e && e.message) || e) + '. Confira a internet e tente de novo.'; }
  if(btn){ btn.disabled = false; btn.textContent = txt; }
  render();
}
function backupV1ParaDocs(o){
  const docs = {};
  ['professores','pin-liberacao','unlock-requests','periodos-avaliacao','livros-didaticos'].forEach(k => { if(o[k]!=null) docs[k] = JSON.stringify(o[k]); });
  if(o['coordenador-senha']!=null) docs['coordenador-senha'] = typeof o['coordenador-senha']==='string' ? o['coordenador-senha'] : JSON.stringify(o['coordenador-senha']);
  Object.entries(o.assessments||{}).forEach(([k, v]) => docs[k] = JSON.stringify(v));
  Object.entries(o.responses||{}).forEach(([k, v]) => docs[k] = JSON.stringify(v));
  Object.entries(o.disciplinas||{}).forEach(([id, v]) => docs[`disciplinas:${id}`] = JSON.stringify(v));
  Object.entries(o.questionBanks||{}).forEach(([id, v]) => docs[`question-bank:${id}`] = JSON.stringify(v));
  Object.entries(o.pesosInstrumentos||{}).forEach(([id, v]) => docs[`pesos-instrumentos:${id}`] = JSON.stringify(v));
  return { docs, turmas: Array.isArray(o.turmas) ? o.turmas : null };
}
async function backupLerArquivo(file){
  const b = backupState(); b.erro = ''; b.msg = ''; b.restaurar = null;
  let o; try{ o = JSON.parse(await file.text()); }catch(e){ b.erro = 'Esse arquivo não é um backup válido (.json).'; render(); return; }
  let pac;
  if(o && o._meta && o._meta.versao===2 && o.docs) pac = { docs: o.docs, turmas: null, meta: o._meta };
  else if(o && o._meta && (o.turmas || o.assessments)) { const v1 = backupV1ParaDocs(o); pac = { docs: v1.docs, turmas: v1.turmas, meta: { versao:1, exportadoEm: o._meta.exportedAt, total: Object.keys(v1.docs).length + (v1.turmas ? 1 : 0) } }; }
  else { b.erro = 'Não reconheci esse arquivo como backup da Sala de Avaliações.'; render(); return; }
  b.restaurar = { nome: file.name, ...pac, modo: 'faltando', confirmacao: '' };
  render();
}
function backupRestaurarHtml(){
  const b = backupState(); const r = b.restaurar;
  return `<div class="card" data-backup-restaurar>
    <h3 style="margin-top:0;">♻️ Restaurar um backup</h3>
    <p class="muted" style="font-size:.86rem; margin-top:0;">Use se algo foi apagado ou estragado. Escolha o arquivo .json do backup.</p>
    <label class="btn btn-ghost btn-sm" style="cursor:pointer;">📂 Escolher arquivo de backup<input type="file" id="backup-restaurar-input" accept="application/json,.json" style="display:none;"></label>
    ${r ? `<div style="margin-top:10px; font-size:.9rem;">
        <div>Arquivo: <strong>${esc(r.nome)}</strong> · gerado em ${r.meta.exportadoEm ? new Date(r.meta.exportadoEm).toLocaleString('pt-BR') : '?'} · ${Object.keys(r.docs).length + (r.turmas?1:0)} documento(s)${r.meta.versao===1?' (formato antigo)':''}</div>
        <label style="display:block; margin-top:8px; text-transform:none; font-weight:400; cursor:pointer;"><input type="radio" name="backup-modo" data-action="backup-modo" value="faltando" ${r.modo==='faltando'?'checked':''} style="width:auto;"> <strong>Só recuperar o que está faltando</strong> (recomendado: não mexe no que existe hoje)</label>
        <label style="display:block; margin-top:4px; text-transform:none; font-weight:400; cursor:pointer;"><input type="radio" name="backup-modo" data-action="backup-modo" value="tudo" ${r.modo==='tudo'?'checked':''} style="width:auto;"> <strong>Voltar tudo para como estava no backup</strong> (substitui o que existe hoje — o que foi feito depois do backup se perde)</label>
        <label style="display:block; margin-top:8px; font-size:.85rem;">Para confirmar, digite <strong>RESTAURAR</strong>: <input id="backup-confirmacao" value="${esc(r.confirmacao||'')}" style="width:160px; display:inline-block;"></label>
        <button class="btn btn-primary btn-sm" data-action="backup-restaurar" style="margin-top:8px;" ${b.progresso?'disabled':''}>${b.progresso ? `⏳ Restaurando… ${b.progresso.feitos}/${b.progresso.total}` : '♻️ Restaurar agora'}</button>
        <button class="btn btn-ghost btn-sm" data-action="backup-cancelar" style="margin-top:8px;">Cancelar</button>
      </div>` : ''}
  </div>`;
}
async function backupRestaurar(){
  const b = backupState(); const r = b.restaurar; if(!r) return;
  const conf = (document.getElementById('backup-confirmacao')||{}).value || '';
  if(conf.trim().toUpperCase()!=='RESTAURAR'){ b.erro = 'Digite RESTAURAR para confirmar.'; render(); return; }
  b.erro = ''; b.msg = '';
  const base = window.__storageBase || window.storage;
  let existentes = new Set();
  if(r.modo==='faltando'){ try{ existentes = new Set(((await base.list('', true)).keys)||[]); }catch(e){ b.erro = 'Não consegui ler o banco atual. Confira a internet.'; render(); return; } }
  const lista = Object.entries(r.docs).filter(([k]) => r.modo==='tudo' || !existentes.has(k));
  b.progresso = { feitos:0, total: lista.length + (r.turmas?1:0) }; render();
  let falhas = 0;
  for(const [k, v] of lista){
    try{ await base.set(k, v, true); }catch(e){ falhas++; }
    b.progresso.feitos++; if(b.progresso.feitos % 10===0) render();
  }
  if(r.turmas){
    try{
      if(r.modo==='tudo') await window.storage.set('turmas', JSON.stringify(r.turmas), true);
      else {
        let atuais = []; try{ atuais = JSON.parse((await window.storage.get('turmas', true)).value); }catch(e){}
        const faltam = r.turmas.filter(t => !atuais.some(a => a.id===t.id));
        if(faltam.length) await window.storage.set('turmas', JSON.stringify([...atuais, ...faltam]), true);
      }
    }catch(e){ falhas++; }
    b.progresso.feitos++;
  }
  b.progresso = null;
  b.msg = `✅ Restauração concluída: ${lista.length + (r.turmas?1:0) - falhas} documento(s) gravado(s)${falhas ? `, ${falhas} com erro (tente de novo)` : ''}. Recarregue a página para ver os dados.`;
  b.restaurar = null;
  render();
}
async function calcExecDashboard(){
  const c = state.coordenador;
  c.dashboard = { loading:true, stats:null };
  render();

  // Sempre recarrega do banco (não reaproveita o que já estava em memória), pois professores
  // podem ter excluído alunos ou avaliações em outra sessão desde a última vez que o painel
  // foi aberto. As três buscas são independentes entre si, então rodam em paralelo em vez de
  // uma depois da outra — o tempo total passa a ser o da mais lenta, não a soma das três.
  await Promise.all([ loadCoordProfessores(), loadCoordAssessments(), loadTurmas() ]);

  const professoresAtivos = c.professores.filter(p=>p.activatedAt).length;
  const professoresPendentes = c.professores.filter(p=>!p.activatedAt).length;
  const totalTurmas = state.professor.turmas.length;
  const totalAlunos = state.professor.turmas.reduce((s,t)=>s+t.students.length, 0);
  const totalAvaliacoes = c.assessments.length;

  const porInstrumento = {};
  const porUnidade = {};
  const porDisciplina = {};
  c.assessments.forEach(a => {
    const inst = a.instrumento || 'avaliacao';
    porInstrumento[inst] = (porInstrumento[inst]||0) + 1;
    if(a.unidade) porUnidade[a.unidade] = (porUnidade[a.unidade]||0) + 1;
    if(a.disciplinaName) porDisciplina[a.disciplinaName] = (porDisciplina[a.disciplinaName]||0) + 1;
  });

  let totalRespostas = 0;
  let scoreSum = 0, scoreCount = 0;
  let tabSwitchTotal = 0, fsTotal = 0, respostasComAlerta = 0;
  const turmaStats = {};
  const disciplinaStats = {};
  const studentStats = {};
  // Busca as respostas de todas as avaliações da escola em paralelo — feito um a um, esse é
  // o ponto mais lento do painel executivo, porque soma a ida e volta ao banco de cada
  // avaliação já cadastrada (e só cresce com o tempo).
  const respostasPorAssessmentExec = await Promise.all(c.assessments.map(async a => {
    try{ const r = await window.storage.get(`responses:${a.code}`, true); return JSON.parse(r.value); }
    catch(e){ return []; }
  }));
  c.assessments.forEach((a, idxAssessmentExec) => {
    const max = a.questions.reduce((s,q)=>s+q.points,0);
    const responses = respostasPorAssessmentExec[idxAssessmentExec];
    totalRespostas += responses.length;
    responses.forEach(resp => {
      const nota10 = max>0 ? (resp.total/max)*10 : null;
      if(max>0){
        scoreSum += (resp.total/max)*100; scoreCount++;
        const respTurmaIds = assessmentTurmaIds(a);
        let respTurmaId = respTurmaIds.length===1 ? respTurmaIds[0] : null;
        if(respTurmaIds.length>1){
          const found = state.professor.turmas.find(t => respTurmaIds.includes(t.id) && t.students.some(s=>mesmoNomeAluno(s.name,resp.studentName)));
          if(found) respTurmaId = found.id;
        }
        if(respTurmaId){
          if(!turmaStats[respTurmaId]) turmaStats[respTurmaId] = {sum:0, count:0};
          turmaStats[respTurmaId].sum += (resp.total/max)*100;
          turmaStats[respTurmaId].count++;
        }
        if(a.disciplinaName){
          if(!disciplinaStats[a.disciplinaName]) disciplinaStats[a.disciplinaName] = {sum:0, count:0};
          disciplinaStats[a.disciplinaName].sum += (resp.total/max)*100;
          disciplinaStats[a.disciplinaName].count++;
        }
        if(!studentStats[resp.studentName]) studentStats[resp.studentName] = {sum:0, count:0};
        studentStats[resp.studentName].sum += nota10;
        studentStats[resp.studentName].count++;
      }
      const ts = resp.tabSwitches||0, fs = resp.fullscreenExits||0;
      tabSwitchTotal += ts; fsTotal += fs;
      if(ts>0 || fs>0) respostasComAlerta++;
    });
  });
  const desempenhoMedio = scoreCount>0 ? scoreSum/scoreCount : null;

  const turmaRanking = state.professor.turmas.map(t => ({
    name: t.name,
    avg: turmaStats[t.id] ? turmaStats[t.id].sum/turmaStats[t.id].count : null
  })).filter(x=>x.avg!==null).sort((a,b)=>b.avg-a.avg);

  const disciplinaRanking = Object.entries(disciplinaStats).map(([name,d]) => ({
    name, avg: d.sum/d.count
  })).sort((a,b)=>b.avg-a.avg);

  const alunosMedias = Object.entries(studentStats).map(([name,d]) => ({ name, media: d.sum/d.count }));
  const alunosAbaixoDe5 = alunosMedias.filter(x=>x.media<5).sort((a,b)=>a.media-b.media);

  let bloqueiosPendentes = 0;
  try{ const r = await window.storage.get('unlock-requests', true); const list = JSON.parse(r.value); bloqueiosPendentes = list.filter(x=>!x.released).length; }catch(e){}

  // Gamificação da escola (fichas já vêm carregadas em cada aluno das turmas)
  const topAlunosFichas = [];
  const turmaEngajamento = [];
  state.professor.turmas.forEach(t => {
    let somaFichas = 0;
    t.students.forEach(al => {
      ensureStudentGamification(al);
      somaFichas += al.fichas;
      topAlunosFichas.push({ name: al.name, turmaName: t.name, fichas: al.fichas, avatarEmoji: al.avatarEmoji, avatarColor: al.avatarColor });
    });
    turmaEngajamento.push({ name: t.name, mediaFichas: t.students.length>0 ? somaFichas/t.students.length : 0, totalAlunos: t.students.length });
  });
  topAlunosFichas.sort((a,b)=>b.fichas-a.fichas);
  turmaEngajamento.sort((a,b)=>b.mediaFichas-a.mediaFichas);

  c.dashboard = {
    loading:false,
    stats: { professoresAtivos, professoresPendentes, totalTurmas, totalAlunos, totalAvaliacoes, totalRespostas, desempenhoMedio, bloqueiosPendentes, respostasComAlerta, porInstrumento, porUnidade, porDisciplina, tabSwitchTotal, fsTotal, turmaRanking, disciplinaRanking, alunosAbaixoDe5, totalAlunosAvaliados: alunosMedias.length, topAlunosFichas: topAlunosFichas.slice(0,10), turmaEngajamento }
  };
  render();
}
async function limparLiberacoesAntigas(){
  if(!confirm('Remover liberações já resolvidas há mais de 30 dias? Bloqueios pendentes não são afetados.')) return;
  let list;
  try{ const r = await window.storage.get('unlock-requests', true); list = JSON.parse(r.value); }catch(e){ list = []; }
  const corte = Date.now() - 30*24*60*60*1000;
  const antes = list.length;
  list = list.filter(x => !(x.released && (x.releasedAt||x.lockedAt||0) < corte));
  await window.storage.set('unlock-requests', JSON.stringify(list), true);
  alert(`${antes - list.length} registro(s) antigo(s) removido(s).`);
  render();
}
async function encerrarAtividadesTravadas(){
  if(!confirm('Procurar e encerrar enquetes, quiz, roleta, duelos ou apresentações de slides que ficaram ativas por mais de 6 horas (provavelmente esquecidas ligadas)?')) return;
  const LIMITE = 6*60*60*1000;
  const agora = Date.now();
  let encerradas = 0;
  let turmas = state.professor.turmas || [];
  try{ const r = await window.storage.get('turmas', true); turmas = JSON.parse(r.value) || turmas; }catch(e){}
  const testes = {
    'enquete-ativa': o => !o.closed && o.createdAt,
    'quiz-ativo': o => o.status!=='ended' && o.createdAt,
    'roleta-ativa': o => o.createdAt,
    'duelo-ativo': o => o.createdAt,
    'jogo-ativo': o => o.fase!=='fim' && o.createdAt,
    'slides-sessao-ativa': o => o.startedAt,
  };
  for(const t of turmas){
    for(const [base, ativo] of Object.entries(testes)){
      try{
        const r = await window.storage.get(chaveAoVivo(base, t.id), true);
        const o = r.value ? JSON.parse(r.value) : null;
        const inicio = o && (o.createdAt || o.startedAt);
        if(o && ativo(o) && inicio && (agora - inicio) > LIMITE){ await window.storage.set(chaveAoVivo(base, t.id), JSON.stringify(null), true); encerradas++; }
      }catch(err){}
    }
  }
  alert(encerradas>0 ? `${encerradas} atividade(s) travada(s) encerrada(s).` : 'Nenhuma atividade travada encontrada — tudo certo por aqui.');
  render();
}
async function limparImagensOrfasDeSlides(){
  if(!confirm('Procurar e remover imagens de slides que não pertencem a nenhum conjunto salvo? Pode demorar alguns segundos.')) return;
  let decks;
  try{ const r = await window.storage.get('slides-decks', true); decks = r.value ? JSON.parse(r.value) : []; }catch(e){ decks = []; }
  const validIds = new Set(decks.map(d=>d.id));
  let list;
  try{ list = await window.storage.list('slide-img:', true); }catch(e){ list = { keys: [] }; }
  let removidas = 0;
  for(const key of (list.keys||[])){
    const parts = key.split(':'); // slide-img:<deckId>:<index>
    const deckId = parts[1];
    if(!validIds.has(deckId)){
      try{ await window.storage.delete(key, true); removidas++; }catch(e){}
    }
  }
  alert(removidas>0 ? `${removidas} imagem(ns) órfã(s) removida(s).` : 'Nenhuma imagem órfã encontrada — tudo certo por aqui.');
  render();
}
async function moveToTrash(kind, label, payload){
  let list;
  try{ const r = await window.storage.get('lixeira', true); list = r.value ? JSON.parse(r.value) : []; }catch(e){ list = []; }
  const deletedBy = state.view==='coordenador' ? 'Coordenação' : (state.professor.session ? state.professor.session.displayName : 'Sistema');
  list.unshift({ id: cryptoId(), kind, label, deletedAt: Date.now(), deletedBy, payload });
  const THIRTY_DAYS = 30*24*60*60*1000;
  const now = Date.now();
  list = list.filter(it => (now - it.deletedAt) < THIRTY_DAYS).slice(0, 60);
  try{ await window.storage.set('lixeira', JSON.stringify(list), true); }catch(e){}
}
async function loadLixeira(){
  try{ const r = await window.storage.get('lixeira', true); return r.value ? JSON.parse(r.value) : []; }catch(e){ return []; }
}
async function removeFromTrash(id){
  const list = await loadLixeira();
  const filtered = list.filter(x=>x.id!==id);
  try{ await window.storage.set('lixeira', JSON.stringify(filtered), true); }catch(e){}
  return filtered;
}
function kindLabel(kind){
  const map = { 'gabarito-avulso':'Gabarito avulso', 'avulso-resposta':'Nota de gabarito avulso', 'resposta-avaliacao':'Resposta/nota de avaliação', 'questao-banco':'Questão do banco', 'turma':'Turma', 'disciplina':'Disciplina', 'professor':'Professor', 'avaliacao':'Avaliação' };
  return map[kind] || kind;
}
async function excluirAvaliacao(code){
  const a = findAssessmentByCode(code);
  if(!a){ alert('Avaliação não encontrada (pode já ter sido excluída).'); return; }
  if(a.aplicacaoId && state.view!=='coordenador'){ alert('Esta avaliação faz parte da aplicação "' + (a.aplicacaoNome||'') + '". Peça à coordenação para tirá-la da aplicação antes de excluir.'); return; }
  let responses = [];
  try{ const r = await window.storage.get(`responses:${code}`, true); responses = JSON.parse(r.value); }catch(e){}
  const avisoRespostas = responses.length>0 ? ` Já existem ${responses.length} nota(s)/resposta(s) lançada(s) para essa avaliação — elas também serão removidas junto (mas tudo pode ser restaurado pela Lixeira em até 30 dias).` : '';
  if(!confirm(`Excluir a avaliação "${a.title}"?${avisoRespostas}`)) return;
  await moveToTrash('avaliacao', a.title || 'Avaliação', { assessment: a, responses });
  try{ await window.storage.delete(`assessment:${code}`, true); }catch(e){}
  try{ await window.storage.delete(`responses:${code}`, true); }catch(e){}
  const p = state.professor, c = state.coordenador;
  p.assessments = (p.assessments||[]).filter(x=>x.code!==code);
  c.assessments = (c.assessments||[]).filter(x=>x.code!==code);
  if(p.resultsFor && p.resultsFor.code===code){ p.mode='list'; p.resultsFor=null; }
  if(c.resultsFor && c.resultsFor.code===code){ c.mode='list'; c.resultsFor=null; }
  if(c.dashboard) c.dashboard.stats = null;
  alert('Avaliação excluída. Ela ficou guardada na Lixeira por 30 dias, caso precise restaurar.');
  render();
}
async function restoreFromTrash(id){
  const list = await loadLixeira();
  const item = list.find(x=>x.id===id);
  if(!item){ alert('Item não encontrado na lixeira (pode já ter expirado).'); return; }
  try{
    if(item.kind==='gabarito-avulso'){
      let arr; try{ const r = await window.storage.get('gabaritos-avulsos', true); arr = r.value ? JSON.parse(r.value) : []; }catch(e){ arr = []; }
      if(!arr.some(x=>x.id===item.payload.gabarito.id)) arr.unshift(item.payload.gabarito);
      await window.storage.set('gabaritos-avulsos', JSON.stringify(arr), true);
      if(state.professor.avulso) state.professor.avulso.list = arr;
      if(item.payload.respostas && item.payload.respostas.length>0){
        await window.storage.set(`avulso-respostas:${item.payload.gabarito.code}`, JSON.stringify(item.payload.respostas), true);
      }
      await syncAvulsoInstrumento(item.payload.gabarito);
    } else if(item.kind==='avulso-resposta'){
      const { code, resposta } = item.payload;
      let arr; try{ const r = await window.storage.get(`avulso-respostas:${code}`, true); arr = r.value ? JSON.parse(r.value) : []; }catch(e){ arr = []; }
      arr = arr.filter(x=>x.studentName!==resposta.studentName);
      arr.push(resposta);
      await window.storage.set(`avulso-respostas:${code}`, JSON.stringify(arr), true);
      if(state.professor.avulso && state.professor.avulso.current && state.professor.avulso.current.code===code) state.professor.avulso.respostas = arr;
      const gabRestaurado = await findAvulsoByCode(code);
      if(gabRestaurado) await syncAvulsoInstrumento(gabRestaurado);
    } else if(item.kind==='resposta-avaliacao'){
      const { code, resposta } = item.payload;
      let arr; try{ const r = await window.storage.get(`responses:${code}`, true); arr = r.value ? JSON.parse(r.value) : []; }catch(e){ arr = []; }
      arr.push(resposta);
      await window.storage.set(`responses:${code}`, JSON.stringify(arr), true);
      const p = state.professor;
      if(p.resultsFor && p.resultsFor.code===code) p.responses = arr;
    } else if(item.kind==='questao-banco'){
      const p = state.professor;
      if(!p.bank.some(x=>x.id===item.payload.id)) p.bank.push(item.payload);
      await saveBankToStorage();
    } else if(item.kind==='turma'){
      let arr; try{ const r = await window.storage.get('turmas', true); arr = r.value ? JSON.parse(r.value) : []; }catch(e){ arr = []; }
      if(!arr.some(x=>x.id===item.payload.id)) arr.unshift(item.payload);
      await window.storage.set('turmas', JSON.stringify(arr), true);
      state.professor.turmas = arr;
    } else if(item.kind==='disciplina'){
      const p = state.professor;
      if(!p.disciplinas.some(x=>x.id===item.payload.id)) p.disciplinas.push(item.payload);
      await saveDisciplinasToStorage();
    } else if(item.kind==='professor'){
      const list2 = await fetchProfessoresList();
      if(!list2.some(x=>x.id===item.payload.id)) list2.push(item.payload);
      await saveProfessoresListRaw(list2);
      state.coordenador.professores = list2;
    } else if(item.kind==='avaliacao'){
      const { assessment, responses } = item.payload;
      await window.storage.set(`assessment:${assessment.code}`, JSON.stringify(assessment), true);
      if(responses && responses.length>0){
        await window.storage.set(`responses:${assessment.code}`, JSON.stringify(responses), true);
      }
      if(!state.professor.assessments.some(x=>x.code===assessment.code)) state.professor.assessments.unshift(assessment);
      if(!state.coordenador.assessments.some(x=>x.code===assessment.code)) state.coordenador.assessments.unshift(assessment);
      if(state.coordenador.dashboard) state.coordenador.dashboard.stats = null;
    }
    await removeFromTrash(id);
    state.ui.lixeira.items = await loadLixeira();
    alert('Item restaurado com sucesso.');
    render();
  }catch(e){
    alert('Não foi possível restaurar este item.');
  }
}
function renderLixeira(){
  const l = state.ui.lixeira;
  if(l.loading){ return `<div class="card"><h2>🗑️ Lixeira</h2><div class="spinner"></div></div>`; }
  const items = l.items || [];
  return `<div class="card"><h2>🗑️ Lixeira</h2><p class="muted">Itens excluídos recentemente ficam guardados aqui por 30 dias, e podem ser restaurados.</p>${items.length===0 ? '<p class="muted center">A lixeira está vazia.</p>' : items.map(it => `<div class="list-item"><div><strong>${esc(kindLabel(it.kind))}</strong> — ${esc(it.label)}<br><span class="muted" style="font-size:.8rem;">Excluído por ${esc(it.deletedBy)} em ${new Date(it.deletedAt).toLocaleDateString('pt-BR')} às ${new Date(it.deletedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></div><div class="row" style="flex:0 0 auto; gap:8px;"><button class="btn btn-primary btn-sm" data-action="lixeira-restaurar" data-id="${it.id}">Restaurar</button><button class="btn btn-ghost btn-sm" data-action="lixeira-excluir-definitivo" data-id="${it.id}">Excluir definitivamente</button></div></div>`).join('')}</div>`;
}
async function loadLixeiraUi(){
  state.ui.lixeira.loading = true;
  state.ui.lixeira.items = await loadLixeira();
  state.ui.lixeira.loading = false;
  render();
}
async function getGeminiApiKey(){
  // Se houver um professor logado com sua própria chave cadastrada, ela tem prioridade
  // (evita que o uso de um professor consuma o limite gratuito compartilhado da escola).
  const p = state.professor;
  if(p && p.session && p.session.id){
    try{
      const r = await window.storage.get(`gemini-api-key-professor:${p.session.id}`, true);
      const v = (r.value||'').trim();
      if(v) return v;
    }catch(e){}
  }
  try{ const r = await window.storage.get('gemini-api-key', true); return (r.value||'').trim(); }catch(e){ return ''; }
}
async function getGeminiApiKeyOwnedBy(professorId){
  try{ const r = await window.storage.get(`gemini-api-key-professor:${professorId}`, true); return (r.value||'').trim(); }catch(e){ return ''; }
}
async function resolveGeminiKeyForTurma(turmaId){
  try{
    const professores = await fetchProfessoresList();
    // Consulta todos os professores ao mesmo tempo e escolhe o primeiro (na ordem da lista)
    // que leciona na turma e tem chave própria — mesmo resultado de antes, sem a fila de esperas.
    const chaves = await Promise.all(professores.map(async prof => {
      let disciplinas = [];
      try{ const r = await window.storage.get(`disciplinas:${prof.id}`, true); disciplinas = JSON.parse(r.value)||[]; }catch(e){ disciplinas = []; }
      if(!disciplinas.some(d => (d.turmaIds||[]).includes(turmaId))) return '';
      return await getGeminiApiKeyOwnedBy(prof.id);
    }));
    const achada = chaves.find(k => k);
    if(achada) return achada;
  }catch(e){}
  try{ const r = await window.storage.get('gemini-api-key', true); return (r.value||'').trim(); }catch(e){ return ''; }
}
function salvarJsonParcial(text){
  const start = text.indexOf('[');
  if(start<0) return null;
  let depth=0, inStr=false, escape=false, objStart=-1;
  const objs=[];
  for(let i=start+1;i<text.length;i++){
    const c=text[i];
    if(inStr){ if(escape) escape=false; else if(c==='\\') escape=true; else if(c==='"') inStr=false; continue; }
    if(c==='"'){ inStr=true; continue; }
    if(c==='{'){ if(depth===0) objStart=i; depth++; }
    else if(c==='}'){ depth--; if(depth===0 && objStart>=0){ try{ objs.push(JSON.parse(text.slice(objStart,i+1))); }catch(e){} objStart=-1; } }
  }
  return objs.length ? objs : null;
}
async function callGeminiJSONOnce(prompt, keyOverride, imagePart, opts){
  const key = keyOverride || await getGeminiApiKey();
  if(!key) throw new Error('IA_NAO_CONFIGURADA');
  let resp, data;
  try{
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), (opts && opts.timeoutMs) || 45000);
    try{
      const parts = [{ text: prompt }];
      if(imagePart) parts.push({ inlineData: { mimeType: imagePart.mimeType, data: imagePart.base64 } });
      resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(key)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 16384 }
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
    data = await resp.json();
  }catch(e){
    throw new Error('IA_REDE');
  }
  if(!resp.ok || data.error){
    const msg = ((data.error && data.error.message) || '').toLowerCase();
    if(resp.status===400 && (msg.includes('api key') || msg.includes('api_key'))) throw new Error('IA_CHAVE_INVALIDA');
    if(resp.status===403) throw new Error('IA_CHAVE_INVALIDA');
    if(resp.status===429) throw new Error('IA_LIMITE_EXCEDIDO');
    if(resp.status===500 || resp.status===502 || resp.status===503 || resp.status===504) throw new Error('IA_INDISPONIVEL');
    throw new Error('IA_ERRO');
  }
  const candidate = data.candidates && data.candidates[0];
  if(!candidate) throw new Error('IA_SEM_RESPOSTA');
  const finishReason = candidate.finishReason;
  const parts = (candidate.content && candidate.content.parts) || [];
  const text = parts.map(pt=>pt.text||'').join('').trim();
  if(!text){
    if(finishReason==='SAFETY') throw new Error('IA_BLOQUEADO');
    throw new Error('IA_SEM_RESPOSTA');
  }
  const cleaned = text.replace(/^```json/i,'').replace(/^```/,'').replace(/```$/,'').trim();
  if(finishReason==='MAX_TOKENS'){
    // resposta cortada: repetir o mesmo pedido daria o mesmo resultado, então avisa quem chamou (que divide o trabalho)
    const err = new Error('IA_TRUNCADO'); err.parcial = salvarJsonParcial(cleaned); throw err;
  }
  try{
    return JSON.parse(cleaned);
  }catch(e){
    const parcial = salvarJsonParcial(cleaned);
    if(parcial && opts && opts.aceitarParcial) return parcial;
    throw new Error('IA_JSON_INVALIDO');
  }
}
async function callGeminiJSON(prompt, keyOverride, imagePart, opts){
  const retryDelaysMs = [1500, 3500, 6000];
  const retryableErrors = ['IA_REDE','IA_INDISPONIVEL','IA_JSON_INVALIDO','IA_SEM_RESPOSTA','IA_LIMITE_EXCEDIDO'];
  let lastErr;
  for(let attempt=0; attempt<=retryDelaysMs.length; attempt++){
    try{
      return await callGeminiJSONOnce(prompt, keyOverride, imagePart, opts);
    }catch(e){
      lastErr = e;
      const isLast = attempt===retryDelaysMs.length;
      if(!retryableErrors.includes(e.message) || isLast) throw e;
      await new Promise(r => setTimeout(r, retryDelaysMs[attempt]));
    }
  }
  throw lastErr;
}
function iaErrorMessage(e){
  const m = (e && e.message) || '';
  if(m==='IA_NAO_CONFIGURADA') return 'A IA ainda não foi configurada. Peça à coordenação para cadastrar a chave gratuita em "Configurações de IA".';
  if(m==='IA_CHAVE_INVALIDA') return 'A chave de IA configurada parece inválida ou expirada. Avise a coordenação para verificar em "Configurações de IA".';
  if(m==='IA_LIMITE_EXCEDIDO') return 'O limite gratuito de uso da IA foi atingido por agora (já tentamos de novo automaticamente algumas vezes). Espere alguns minutos e tente de novo — ou cadastre sua própria chave gratuita em "Meu perfil" pra não depender do limite compartilhado da escola.';
  if(m==='IA_REDE') return 'Não foi possível conectar à IA agora (já tentamos de novo automaticamente). Verifique sua internet e tente novamente.';
  if(m==='IA_INDISPONIVEL') return 'O serviço de IA está sobrecarregado no momento (já tentamos de novo automaticamente algumas vezes). Tente novamente em instantes.';
  if(m==='IA_BLOQUEADO') return 'A IA não conseguiu responder a esse conteúdo. Tente reformular ou usar um trecho diferente.';
  if(m==='IA_JSON_INVALIDO') return 'A IA respondeu em um formato inesperado mesmo após tentar de novo. Tente reformular o pedido.';
  if(m==='IA_TRUNCADO') return 'O trecho enviado gerou questões demais para uma única resposta da IA. Selecione um trecho menor e tente de novo.';
  if(m==='IA_SEM_RESPOSTA') return 'A IA não retornou uma resposta, mesmo após tentar de novo. Tente novamente em instantes.';
  return 'Não foi possível usar a IA agora. Tente novamente.';
}
async function loadCoordIA(){
  const ia = state.coordenador.ia;
  ia.loading = true;
  render();
  ia.key = await getGeminiApiKey();
  ia.keyInput = ia.key;
  ia.loading = false;
  render();
}
async function saveGeminiKey(){
  const ia = state.coordenador.ia;
  const val = document.getElementById('gemini-key-input').value.trim();
  await window.storage.set('gemini-api-key', val, true);
  ia.key = val;
  ia.saved = true;
  render();
  setTimeout(() => { ia.saved = false; render(); }, 3000);
}
async function removeGeminiKey(){
  if(!confirm('Remover a chave de IA? Os professores deixarão de conseguir usar os recursos de IA até uma nova chave ser cadastrada.')) return;
  const ia = state.coordenador.ia;
  await window.storage.delete('gemini-api-key', true);
  ia.key = '';
  ia.keyInput = '';
  render();
}
async function loadMyIaKey(){
  const p = state.professor;
  if(!p.session) return;
  p.myIaKeyLoading = true;
  render();
  p.myIaKey = await getGeminiApiKeyOwnedBy(p.session.id);
  p.myIaKeyInput = p.myIaKey;
  p.myIaKeyLoading = false;
  render();
}
async function saveMyIaKey(){
  const p = state.professor;
  const val = (p.myIaKeyInput||'').trim();
  await window.storage.set(`gemini-api-key-professor:${p.session.id}`, val, true);
  p.myIaKey = val;
  p.myIaSaved = true;
  render();
  setTimeout(() => { p.myIaSaved = false; render(); }, 3000);
}
async function removeMyIaKey(){
  const p = state.professor;
  await window.storage.delete(`gemini-api-key-professor:${p.session.id}`, true);
  p.myIaKey = '';
  p.myIaKeyInput = '';
  render();
}
function renderCoordIA(){
  const ia = state.coordenador.ia;
  if(ia.loading) return `<div class="card"><h2>🤖 Configurações de IA</h2><div class="spinner"></div></div>`;
  return `
    <div class="card">
      <h2>🤖 Configurações de IA</h2>
      <p class="muted">Ative recursos de IA gratuitos para ajudar os professores a criar questões de prova: gerar questões a partir de um tema, importar questões coladas de um texto, ou extrair questões de um PDF de livro didático (ou lista de exercícios). Também é essa IA que responde às dicas pedidas pelos alunos no Mural de Dúvidas.</p>
      <p class="muted">A IA usada é o <strong>Google Gemini</strong>, que tem uma camada gratuita. Essa chave abaixo é a <strong>chave de reserva da escola</strong> — usada sempre que um professor não tiver cadastrado a própria chave pessoal (veja o aviso mais abaixo). Para cadastrar:</p>
      <ol class="muted" style="padding-left:20px;">
        <li>Acesse <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> com uma conta Google.</li>
        <li>Clique em "Create API key" e copie a chave gerada.</li>
        <li>Cole a chave no campo abaixo e clique em "Salvar".</li>
      </ol>
      <label>Chave de API do Gemini (reserva da escola)</label>
      <input type="text" id="gemini-key-input" value="${esc(ia.keyInput)}" placeholder="Cole aqui a chave (começa com AIza...)">
      <p class="muted" style="font-size:.8rem;">${ia.key ? '✅ IA configurada e disponível para os professores.' : '⚠ IA ainda não configurada — os professores não verão os recursos de IA funcionando (a menos que cada um tenha cadastrado sua própria chave).'}</p>
      ${ia.saved ? '<p class="muted" style="color:var(--green);">Chave salva!</p>' : ''}
      <div class="row" style="margin-top:14px;">
        ${ia.key ? `<button class="btn btn-danger btn-sm" data-action="remove-gemini-key">Remover chave</button>` : ''}
        <button class="btn btn-primary" data-action="save-gemini-key">Salvar</button>
      </div>
      <p class="muted" style="font-size:.78rem; margin-top:14px;">⚠ Por não haver servidor próprio neste app, essa chave fica acessível a quem tiver acesso técnico ao código da página. Como a camada gratuita do Gemini não cobra cartão e tem limites diários, o risco é apenas de a cota gratuita acabar mais rápido — nunca uma cobrança inesperada.</p>
      <hr style="margin:20px 0; border:none; border-top:1px solid var(--paper-line);">
      <p class="muted" style="font-size:.85rem;"><strong>⚠ Importante:</strong> essa chave de reserva é <strong>compartilhada por toda a escola</strong> e o Gemini gratuito permite só cerca de 15 chamadas por minuto. Se vários professores (ou alunos pedindo dica de IA) usarem ao mesmo tempo, é comum aparecer erro de "limite excedido". Recomende a cada professor que cadastre a própria chave gratuita em <strong>Meu perfil → Minha Chave de IA</strong> — leva 1 minuto e elimina esse gargalo.</p>
    </div>
  `;
}
async function submitCoordLogin(){
  const c = state.coordenador;
  const val = document.getElementById('coord-senha-input').value;
  const lockCheck = await checkLoginLock('coordenador', 'global');
  if(lockCheck.locked){ c.error = loginLockMessage(lockCheck.minutos); render(); return; }
  let storedHash = null, storedSalt = null;
  try{ const r = await window.storage.get('coordenador-senha', true); storedHash = r.value; }catch(e){}
  try{ const r2 = await window.storage.get('coordenador-senha-salt', true); storedSalt = r2.value; }catch(e){}
  let ok = false;
  if(storedHash){
    if(storedSalt){
      ok = (await hashTextSalted(val, storedSalt)) === storedHash;
    } else {
      // senha antiga, sem salt — valida do jeito antigo e migra automaticamente
      ok = (await hashText(val)) === storedHash;
      if(ok){
        const newSalt = randomSaltHex();
        await window.storage.set('coordenador-senha-salt', newSalt, true);
        await window.storage.set('coordenador-senha', await hashTextSalted(val, newSalt), true);
      }
    }
  } else { ok = (val === 'coord123'); }
  if(ok){
    await segEntrarCoordenacao(val);
    await clearLoginFailures('coordenador', 'global');
    c.session = true; c.error='';
    render();
    resetIdleLogoutTimer();
    calcExecDashboard();
    ensureCoordDataLoaded();
    let tourSeen = null;
    try{ const r3 = await window.storage.get('coordenador-tour-visto', true); tourSeen = r3.value; }catch(e){}
    if(!tourSeen) startTour('coordenador');
  }
  else { c.error = 'Senha incorreta.'; await registerLoginFailure('coordenador', 'global'); render(); }
}
async function coordAbrirDisciplinasProfessor(id){
  const c = state.coordenador;
  c.profDisciplinasEditId = id;
  c.profDisciplinasLoading = true;
  c.newProfDisciplinaNome = '';
  c.newProfDisciplinaTurmaIds = [];
  c.profDisciplinaEditTurmasId = null;
  c.profDisciplinaEditTurmaIds = [];
  render();
  let disciplinas = [];
  try{ const r = await window.storage.get(`disciplinas:${id}`, true); disciplinas = JSON.parse(r.value) || []; }catch(e){ disciplinas = []; }
  c.profDisciplinasList = disciplinas;
  c.profDisciplinasLoading = false;
  render();
}
function coordFecharDisciplinasProfessor(){
  const c = state.coordenador;
  c.profDisciplinasEditId = null;
  c.profDisciplinasList = [];
  c.profDisciplinaEditTurmasId = null;
  c.profDisciplinaEditTurmaIds = [];
  render();
}
async function coordSalvarDisciplinasProfessor(){
  const c = state.coordenador;
  if(!c.profDisciplinasEditId) return;
  await window.storage.set(`disciplinas:${c.profDisciplinasEditId}`, JSON.stringify(c.profDisciplinasList), true);
}
async function coordAdicionarDisciplinaProfessor(){
  const c = state.coordenador;
  const nome = (c.newProfDisciplinaNome||'').trim();
  const errEl = document.getElementById('coord-prof-disciplina-err');
  if(!nome){ if(errEl) errEl.innerHTML = '<p class="err">Informe o nome da disciplina.</p>'; return; }
  if(c.profDisciplinasList.some(d => normalizeDisciplinaName(d.name)===normalizeDisciplinaName(nome))){
    if(errEl) errEl.innerHTML = '<p class="err">Esse professor já tem essa disciplina cadastrada.</p>';
    return;
  }
  c.profDisciplinasList.push({ id: cryptoId(), name: nome, turmaIds: c.newProfDisciplinaTurmaIds.slice(), createdAt: Date.now() });
  await coordSalvarDisciplinasProfessor();
  c.newProfDisciplinaNome = '';
  c.newProfDisciplinaTurmaIds = [];
  if(errEl) errEl.innerHTML = '';
  await ensureAvulsoProfessoresCache(true);
  render();
}
async function coordRemoverDisciplinaProfessor(discId){
  const c = state.coordenador;
  if(!confirm('Remover essa disciplina do(a) professor(a)? Isso não apaga notas já lançadas, só o vínculo pra novos gabaritos/avaliações.')) return;
  c.profDisciplinasList = c.profDisciplinasList.filter(d=>d.id!==discId);
  await coordSalvarDisciplinasProfessor();
  await ensureAvulsoProfessoresCache(true);
  render();
}
function coordAbrirEditarTurmasDisciplinaProf(discId){
  const c = state.coordenador;
  const d = (c.profDisciplinasList||[]).find(x=>x.id===discId);
  if(!d) return;
  c.profDisciplinaEditTurmasId = discId;
  c.profDisciplinaEditTurmaIds = (d.turmaIds||[]).slice();
  render();
}
function coordCancelarEditarTurmasDisciplinaProf(){
  const c = state.coordenador;
  c.profDisciplinaEditTurmasId = null;
  c.profDisciplinaEditTurmaIds = [];
  render();
}
async function coordSalvarTurmasDisciplinaProf(){
  const c = state.coordenador;
  const discId = c.profDisciplinaEditTurmasId;
  if(!discId) return;
  const idx = (c.profDisciplinasList||[]).findIndex(x=>x.id===discId);
  if(idx===-1){ c.profDisciplinaEditTurmasId = null; c.profDisciplinaEditTurmaIds = []; render(); return; }
  c.profDisciplinasList[idx] = { ...c.profDisciplinasList[idx], turmaIds: c.profDisciplinaEditTurmaIds.slice() };
  await coordSalvarDisciplinasProfessor();
  c.profDisciplinaEditTurmasId = null;
  c.profDisciplinaEditTurmaIds = [];
  await ensureAvulsoProfessoresCache(true);
  render();
}
async function addProfessor(){
  const c = state.coordenador;
  const email = document.getElementById('new-prof-email-input').value.trim().toLowerCase();
  const disciplina = document.getElementById('new-prof-disciplina-input').value.trim();
  if(!email || !email.includes('@')){ alert('Informe um e-mail válido.'); return; }
  const list = await fetchProfessoresList();
  if(list.some(p=>p.email.toLowerCase()===email)){ alert('Esse e-mail já está cadastrado.'); return; }
  list.push({ id: cryptoId(), email, disciplina, displayName:null, passwordHash:null, createdAt: Date.now(), activatedAt:null });
  await saveProfessoresListRaw(list);
  c.professores = list;
  segSincronizarEquipe().catch(()=>{});
  render();
}
async function removeProfessor(id){
  if(!confirm('Remover este professor? Ele perde o acesso, mas as avaliações já criadas continuam no sistema. Você pode restaurar pela Lixeira em até 30 dias.')) return;
  const c = state.coordenador;
  const list = await fetchProfessoresList();
  const rec = list.find(p=>p.id===id);
  const filtered = list.filter(p=>p.id!==id);
  await saveProfessoresListRaw(filtered);
  c.professores = filtered;
  segSincronizarEquipe().catch(()=>{});
  if(rec) await moveToTrash('professor', rec.displayName || rec.email || 'Professor', rec);
  render();
}
async function resetProfessorPassword(id){
  const c = state.coordenador;
  const list = await fetchProfessoresList();
  const pr = list.find(p=>p.id===id);
  if(!pr) return;
  if(!confirm(`Redefinir a senha de ${pr.displayName || pr.email}? Ele(a) vai precisar escolher o nome e criar uma senha nova no próximo acesso com esse e-mail.`)) return;
  pr.passwordHash = null;
  pr.passwordSalt = null;
  pr.activatedAt = null;
  await saveProfessoresListRaw(list);
  c.professores = list;
  render();
}
__parteOk('coord');
