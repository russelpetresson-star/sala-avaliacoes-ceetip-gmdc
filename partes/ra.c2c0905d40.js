/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "ra" */
const RA_EXEMPLOS_PADRAO = [
  {
    id: 'exemplo-gearbox',
    title: 'Exemplo: Caixa de engrenagens (Eletromecânica)',
    descricao: 'Modelo de demonstração gratuito — gire, dê zoom e, no celular, toque em "Ver em RA" para projetar no ambiente real.',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb',
    posterUrl: '',
    turmaIds: [],
    isExemplo: true
  },
  {
    id: 'exemplo-capacete',
    title: 'Exemplo: Capacete de proteção (Segurança do Trabalho)',
    descricao: 'Modelo de demonstração gratuito — bom para mostrar como um EPI pode ser explorado em 3D antes de ver o real.',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    posterUrl: '',
    turmaIds: [],
    isExemplo: true
  },
  {
    id: 'exemplo-astronauta',
    title: 'Exemplo genérico: Astronauta',
    descricao: 'O exemplo clássico usado nos tutoriais do Google — ótimo para testar rápido se a RA funciona no seu celular.',
    modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    posterUrl: '',
    turmaIds: [],
    isExemplo: true
  }
];
const RA_SITES_MODELOS = [
  { nome: 'Sketchfab', url: 'https://sketchfab.com/search?features=downloadable&sort_by=-likeCount&type=models' },
  { nome: 'Smithsonian 3D', url: 'https://3d.si.edu/' },
  { nome: 'NASA 3D Resources', url: 'https://www.nasa.gov/3d-resources/' },
  { nome: 'glTF Sample Assets (Khronos)', url: 'https://github.khronos.org/glTF-Assets/' },
  { nome: 'CGTrader (modelos gratuitos)', url: 'https://www.cgtrader.com/free-3d-models' },
  { nome: 'Free3D', url: 'https://free3d.com/3d-models' }
];
async function loadRaItems(){
  const p = state.professor;
  p.raItemsLoading = true;
  try{
    const r = await window.storage.get('ra-items', true);
    p.raItems = JSON.parse(r.value);
  }catch(e){
    // Primeira vez que a escola usa este recurso: começa com os exemplos prontos,
    // para o professor já ver a RA funcionando e entender o conceito.
    p.raItems = RA_EXEMPLOS_PADRAO.map(x => ({...x}));
    try{ await window.storage.set('ra-items', JSON.stringify(p.raItems), true); }catch(e2){}
  }
  p.raItemsLoading = false;
  render();
}
async function saveRaItemsToStorage(){
  await window.storage.set('ra-items', JSON.stringify(state.professor.raItems), true);
}
function abrirNovoRa(){
  const p = state.professor;
  p.newRaOpen = true;
  p.editingRaId = null;
  p.newRaTitle = '';
  p.newRaModelUrl = '';
  p.newRaPosterUrl = '';
  p.newRaDescricao = '';
  p.newRaTurmaIds = [];
  p.raError = '';
  p.raUploading = false;
  p.raUploadProgress = 0;
  render();
}
const RA_MAX_UPLOAD_MB = 30;
async function handleRaModelFileUpload(file){
  const p = state.professor;
  if(!file) return;
  if(!/\.(glb|gltf)$/i.test(file.name)){
    p.raError = 'Envie um arquivo .glb ou .gltf.';
    render(); return;
  }
  if(file.size > RA_MAX_UPLOAD_MB * 1024 * 1024){
    p.raError = `Esse modelo tem mais de ${RA_MAX_UPLOAD_MB}MB. Tente uma versão mais leve do modelo (a maioria dos editores 3D tem uma opção de "compactar"/"otimizar" ao exportar).`;
    render(); return;
  }
  p.raUploading = true;
  p.raUploadProgress = 0;
  p.raError = '';
  render();
  try{
    const url = await uploadFileToStorage(file, 'ra-modelos', (pct) => { p.raUploadProgress = pct; render(); });
    p.newRaModelUrl = url;
  }catch(e){
    p.raError = e && e.message==='storage-indisponivel'
      ? 'O envio de arquivo do computador não está disponível no momento. Cole um link direto do arquivo .glb por enquanto.'
      : 'Não foi possível enviar o modelo agora. Verifique sua conexão e tente de novo, ou cole um link direto do arquivo.';
  }
  p.raUploading = false;
  render();
}
function editarRa(id){
  const p = state.professor;
  const item = p.raItems.find(x=>x.id===id);
  if(!item) return;
  p.newRaOpen = true;
  p.editingRaId = id;
  p.newRaTitle = item.title;
  p.newRaModelUrl = item.modelUrl;
  p.newRaPosterUrl = item.posterUrl||'';
  p.newRaDescricao = item.descricao||'';
  p.newRaTurmaIds = [...(item.turmaIds||[])];
  p.raError = '';
  render();
}
function cancelarNovoRa(){
  state.professor.newRaOpen = false;
  render();
}
function toggleRaTurma(tid){
  const p = state.professor;
  if(p.newRaTurmaIds.includes(tid)) p.newRaTurmaIds = p.newRaTurmaIds.filter(x=>x!==tid);
  else p.newRaTurmaIds.push(tid);
  render();
}
async function salvarRa(authorName){
  const p = state.professor;
  const title = p.newRaTitle.trim();
  const modelUrl = p.newRaModelUrl.trim();
  if(!title){ p.raError = 'Dê um título para o modelo.'; render(); return; }
  if(!modelUrl){ p.raError = 'Cole o link do modelo 3D (.glb ou .gltf).'; render(); return; }
  if(!/\.(glb|gltf)(\?.*)?$/i.test(modelUrl)){ p.raError = 'O link precisa apontar para um arquivo .glb ou .gltf.'; render(); return; }
  if(p.editingRaId){
    const item = p.raItems.find(x=>x.id===p.editingRaId);
    if(item){
      item.title = title;
      item.modelUrl = modelUrl;
      item.posterUrl = p.newRaPosterUrl.trim();
      item.descricao = p.newRaDescricao.trim();
      item.turmaIds = [...p.newRaTurmaIds];
    }
  } else {
    p.raItems.unshift({
      id: cryptoId(),
      title,
      modelUrl,
      posterUrl: p.newRaPosterUrl.trim(),
      descricao: p.newRaDescricao.trim(),
      turmaIds: [...p.newRaTurmaIds],
      authorId: p.session ? p.session.id : null,
      authorName,
      createdAt: Date.now(),
      isExemplo: false
    });
  }
  p.newRaOpen = false;
  p.editingRaId = null;
  p.raError = '';
  await saveRaItemsToStorage();
  render();
}
async function excluirRa(id){
  const p = state.professor;
  if(!confirm('Excluir este modelo de Realidade Aumentada? Os alunos das turmas vinculadas deixarão de vê-lo.')) return;
  p.raItems = p.raItems.filter(x=>x.id!==id);
  await saveRaItemsToStorage();
  render();
}
function raModelViewerHtml(item){
  return `<model-viewer src="${esc(item.modelUrl)}" ${item.posterUrl?`poster="${esc(item.posterUrl)}"`:''} camera-controls auto-rotate ar ar-modes="webxr scene-viewer quick-look" shadow-intensity="1" alt="${esc(item.title)}"></model-viewer>`;
}
function renderRealidadeAumentada(canManage){
  const p = state.professor;
  if(p.raItemsLoading) return `<div class="card"><h2>🕶️ Realidade Aumentada</h2><div class="spinner"></div></div>`;
  const minhasTurmas = canManage ? professorTurmas() : (p.turmas||[]);
  const turmaCheckboxes = minhasTurmas.map(t => `
    <label class="picker-item">
      <input type="checkbox" data-action="toggle-ra-turma" data-tid="${t.id}" ${p.newRaTurmaIds.includes(t.id)?'checked':''}>
      <span>${esc(t.name)}</span>
    </label>
  `).join('');
  const explicacao = `
    <div class="card" style="margin-bottom:14px;">
      <h2 style="margin-top:0;">🕶️ Realidade Aumentada</h2>
      <p style="margin:0 0 8px;">Nenhum aplicativo é necessário: os alunos abrem no celular pelo próprio navegador, giram o modelo 3D na tela e, tocando em "Ver em RA", projetam o objeto no ambiente real usando a câmera.</p>
      <p class="muted" style="margin:0;">Envie o arquivo <strong>.glb</strong> ou <strong>.gltf</strong> direto do seu computador, ou cole o link direto de um. Não tem um modelo ainda? Veja os sites abaixo — a maioria tem modelos gratuitos para baixar.</p>
      <div class="ra-sites-list">
        ${RA_SITES_MODELOS.map(s => `<a class="ra-site-link" href="${esc(s.url)}" target="_blank" rel="noopener">🔗 ${esc(s.nome)}</a>`).join('')}
      </div>
    </div>
  `;
  const formBlock = canManage && p.newRaOpen ? `
    <div style="border:1px dashed var(--paper-line); border-radius:10px; padding:14px; margin-bottom:16px;">
      <h3 style="margin-top:0;">${p.editingRaId ? 'Editar modelo' : 'Novo modelo em RA'}</h3>
      <label>Título</label>
      <input type="text" id="ra-title-input" value="${esc(p.newRaTitle)}" placeholder="Ex: Motor elétrico trifásico">
      <label>Enviar arquivo do computador (.glb ou .gltf — até ${RA_MAX_UPLOAD_MB}MB)</label>
      <input type="file" id="ra-model-file-input" accept=".glb,.gltf" ${p.raUploading?'disabled':''}>
      ${p.raUploading ? `<div class="chart-track" style="margin-top:6px;"><div class="chart-fill" style="width:${p.raUploadProgress}%;"></div></div><p class="muted" style="font-size:.78rem;">Enviando... ${p.raUploadProgress}%</p>` : ''}
      <p class="muted" style="font-size:.8rem; margin:6px 0;">— ou —</p>
      <label>Link do modelo 3D (.glb ou .gltf)</label>
      <input type="text" id="ra-model-url-input" value="${esc(p.newRaModelUrl)}" placeholder="Cole aqui o link direto do arquivo .glb">
      <label>Imagem de capa (opcional)</label>
      <input type="text" id="ra-poster-url-input" value="${esc(p.newRaPosterUrl)}" placeholder="Link de uma imagem exibida antes do modelo carregar">
      <label>Observação (opcional)</label>
      <textarea id="ra-descricao-input" placeholder="Ex: Observe as fases do motor.">${esc(p.newRaDescricao)}</textarea>
      <label style="margin-top:10px;">Para quais turmas?</label>
      ${minhasTurmas.length===0 ? '<p class="muted" style="font-size:.82rem;">Nenhuma turma vinculada a uma disciplina sua ainda.</p>' : `<div class="picker">${turmaCheckboxes}</div>`}
      <p class="muted" style="font-size:.8rem;">Deixe sem marcar nenhuma turma para exibir aos alunos de todas as turmas.</p>
      ${p.newRaModelUrl.trim() ? `<div class="ra-card" style="margin-top:10px; max-width:320px;">${raModelViewerHtml({title:p.newRaTitle||'Pré-visualização', modelUrl:p.newRaModelUrl.trim(), posterUrl:p.newRaPosterUrl.trim()})}</div>` : ''}
      ${p.raError ? `<p class="err">${esc(p.raError)}</p>` : ''}
      <div class="row" style="margin-top:12px;">
        <button class="btn btn-ghost" data-action="cancelar-novo-ra">Cancelar</button>
        <button class="btn btn-primary" data-action="salvar-ra">${p.editingRaId ? 'Salvar alterações' : 'Disponibilizar'}</button>
      </div>
    </div>
  ` : '';
  const lista = p.raItems.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const gridBlock = lista.length===0 ? '<p class="muted">Nenhum modelo em RA disponibilizado ainda.</p>' : `<div class="ra-grid">${lista.map(item => {
    const turmaNames = (item.turmaIds||[]).length ? (item.turmaIds||[]).map(tid => { const t = p.turmas.find(x=>x.id===tid); return t?t.name:'?'; }).join(', ') : 'todas as turmas';
    return `
    <div class="ra-card">
      ${raModelViewerHtml(item)}
      <div class="ra-card-body">
        <p class="ra-card-title">${esc(item.title)}${item.isExemplo?' <span class="pill" style="font-size:.65rem;">exemplo</span>':''}</p>
        ${item.descricao ? `<p class="ra-card-desc">${esc(item.descricao)}</p>` : ''}
        <span class="muted" style="font-size:.75rem;">turma(s): ${esc(turmaNames)}</span>
        ${canManage ? `
          <div class="row" style="margin-top:8px;">
            <button class="btn btn-ghost btn-sm" data-action="editar-ra" data-id="${item.id}">Editar</button>
            <button class="btn btn-danger btn-sm" data-action="excluir-ra" data-id="${item.id}">Excluir</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  }).join('')}</div>`;
  return `
    ${explicacao}
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2 style="margin:0;">📦 Meus modelos em RA</h2>
        ${canManage && !p.newRaOpen ? '<button class="btn btn-primary btn-sm" data-action="abrir-novo-ra">+ Novo modelo</button>' : ''}
      </div>
      ${formBlock}
      ${gridBlock}
    </div>
  `;
}
function renderAlunoMonitoriaBlock(){
  const al = state.aluno;
  const mo = al.monitoria;
  // "Seus monitores": visível pra qualquer aluno que esteja sendo acompanhado por um
  // monitor, independente de ele próprio ser ou não monitor de outra pessoa.
  const souMonitorandoDe = mo.loaded ? mo.vinculos.filter(v=>v.monitorandoId===al.matriculaStudentId) : [];
  const cardMeusMonitores = souMonitorandoDe.length===0 ? '' : `
    <div class="card">
      <h3 style="margin-top:0;">🧑‍🏫 Seus monitores</h3>
      <p class="muted" style="margin:0 0 8px;">Colegas monitores acompanhando você nesse período.</p>
      ${souMonitorandoDe.map(v => `
        <div class="list-item">
          <div><strong>${esc(v.monitorName)}</strong><br><span class="muted" style="font-size:.8rem;">📅 Reunião semanal: ${esc(v.horarioReuniao)}</span></div>
        </div>
      `).join('')}
    </div>
  `;
  return cardMeusMonitores + renderAlunoMonitoriaBlockGrupo();
}
function renderAlunoMonitoriaBlockGrupo(){
  const al = state.aluno;
  const mo = al.monitoria;
  if(!mo.loaded && !mo.loading){ loadMonitoria(); }
  if(mo.loading){
    return `<div class="card"><h3 style="margin-top:0;">🧑‍🏫 Monitoria de Desempenho</h3><div class="spinner"></div></div>`;
  }
  const grupo = monitoriaMeuGrupo();
  const souIndicado = monitoriaSouIndicado();

  if(!grupo){
    if(!souIndicado){
      return `
        <div class="card">
          <h3 style="margin-top:0;">🧑‍🏫 Monitoria de Desempenho</h3>
          <p class="muted">Você ainda não foi indicado(a) pela coordenação como monitor(a) de desempenho. Quem já é monitor pode acompanhar colegas em risco de reprovação, com notas, reuniões semanais e observações simples.</p>
        </div>
      `;
    }
    if(mo.view==='entrar'){
      const disponiveis = mo.grupos.filter(g => (g.monitores||[]).length < MONITORIA_MAX_MONITORES);
      return `
        <div class="card">
          <h3 style="margin-top:0;">🧑‍🏫 Entrar em um grupo de monitoria</h3>
          ${disponiveis.length===0 ? '<p class="muted">Nenhum grupo com vaga no momento. Que tal criar o seu?</p>' : disponiveis.map(g => `
            <div class="list-item" style="align-items:flex-start;">
              <div>
                <strong>${g.monitores.map(m=>esc(m.studentName)).join(', ')}</strong><br>
                <span class="muted" style="font-size:.8rem;">${g.monitores.length}/${MONITORIA_MAX_MONITORES} monitores · ${g.monitorandos.length}/${MONITORIA_MAX_MONITORANDOS} monitorandos${g.monitorandos.length ? ' ('+g.monitorandos.slice(0,3).map(m=>esc(m.studentName)).join(', ')+(g.monitorandos.length>3?'…':'')+')' : ''}</span>
              </div>
              <button class="btn btn-primary btn-sm" data-action="monitoria-confirmar-entrar" data-gid="${g.id}">Entrar</button>
            </div>
          `).join('')}
          ${mo.error ? `<p class="err">${esc(mo.error)}</p>` : ''}
          <button class="btn btn-ghost btn-sm" style="margin-top:10px;" data-action="monitoria-nav-voltar-inicio">← Voltar</button>
        </div>
      `;
    }
    return `
      <div class="card">
        <h3 style="margin-top:0;">🧑‍🏫 Monitoria de Desempenho</h3>
        <p class="muted">Quer ajudar colegas que estão em risco de reprovação? Como monitor, você acompanha as notas e a frequência deles ao longo das unidades, com reuniões semanais e observações simples.</p>
        <div class="row" style="margin-top:10px;">
          <button class="btn btn-primary" data-action="monitoria-nav-criar">Criar um grupo</button>
          <button class="btn btn-ghost" data-action="monitoria-nav-entrar">Entrar em um grupo existente</button>
        </div>
      </div>
    `;
  }

  if(mo.view==='criar-alunos'){
    if(!mo.turmasCarregadas){
      mo.turmasCarregadas = true;
      loadTurmas().then(()=>render());
      return `<div class="card"><h3 style="margin-top:0;">Adicionar monitorandos</h3><div class="spinner"></div></div>`;
    }
    const turma = state.professor.turmas.find(t=>t.id===mo.criarTurmaId);
    const vagas = MONITORIA_MAX_MONITORANDOS - grupo.monitorandos.length;
    return `
      <div class="card">
        <h3 style="margin-top:0;">Adicionar monitorandos</h3>
        <p class="muted">Escolha a turma e marque até ${vagas} aluno(s) (o grupo já tem ${grupo.monitorandos.length}/${MONITORIA_MAX_MONITORANDOS}).</p>
        <label>Turma</label>
        <select id="monitoria-turma-select">
          <option value="">Selecione...</option>
          ${state.professor.turmas.map(t=>`<option value="${t.id}" ${t.id===mo.criarTurmaId?'selected':''}>${esc(t.name)}</option>`).join('')}
        </select>
        ${turma ? `
          <input type="text" id="monitoria-criar-alunos-busca-input" placeholder="Digite o nome do aluno para filtrar..." value="${esc(mo.criarAlunosBusca||'')}" style="margin-top:8px;">
          ${(() => {
            const termo = (mo.criarAlunosBusca||'').trim().toLowerCase();
            const disponiveis = turma.students.filter(s=>!grupo.monitorandos.some(m=>m.studentId===s.id) && (!termo || s.name.toLowerCase().includes(termo)));
            if(disponiveis.length===0) return '<p class="muted" style="margin-top:8px;">Nenhum aluno encontrado.</p>';
            return disponiveis.map(s => `
              <label class="row" style="align-items:center; gap:8px; font-weight:400; margin-top:8px;">
                <input type="checkbox" data-action="monitoria-toggle-aluno" data-sid="${s.id}" ${mo.criarSelecionados.includes(s.id)?'checked':''}>
                ${esc(s.name)}
              </label>
            `).join('');
          })()}
        ` : ''}
        ${mo.error ? `<p class="err">${esc(mo.error)}</p>` : ''}
        <div class="row" style="margin-top:14px;">
          <button class="btn btn-ghost" data-action="monitoria-voltar-painel">← Voltar</button>
          <button class="btn btn-primary" data-action="monitoria-confirmar-alunos">Adicionar</button>
        </div>
      </div>
    `;
  }

  if(mo.view==='detalhe'){
    const vinculo = mo.vinculos.find(v=>v.id===mo.detalheVinculoId);
    if(!vinculo) { mo.view='painel'; return renderAlunoMonitoriaBlock(); }
    const editando = mo.editHorarioVinculoId===vinculo.id;
    const notas = mo.notasCache[vinculo.monitorandoTurmaId];
    return `
      <div class="card">
        <button class="btn btn-ghost btn-sm" data-action="monitoria-voltar-painel">← Voltar</button>
        <h3 style="margin-top:10px;">${esc(vinculo.monitorandoName)}</h3>
        <p class="muted" style="margin-top:-4px;">${esc(vinculo.monitorandoTurmaName)}</p>

        <div class="list-item" style="align-items:center;">
          ${editando ? `
            <input type="text" id="monitoria-edit-horario-input" value="${esc(vinculo.horarioReuniao)}" placeholder="Ex.: Segunda-feira, 14h" style="max-width:260px;">
            <div class="row" style="flex:0 0 auto;">
              <button class="btn btn-ghost btn-sm" data-action="monitoria-editar-horario-cancelar">Cancelar</button>
              <button class="btn btn-primary btn-sm" data-action="monitoria-editar-horario-salvar" data-vid="${vinculo.id}">Salvar</button>
            </div>
          ` : `
            <span>📅 Reunião semanal: <strong>${esc(vinculo.horarioReuniao)}</strong></span>
            <button class="btn btn-ghost btn-sm" data-action="monitoria-editar-horario-abrir" data-vid="${vinculo.id}">Editar</button>
          `}
        </div>

        <h3 style="margin-top:18px;">Notas nos instrumentais</h3>
        ${!notas ? `
          <button class="btn btn-ghost btn-sm" data-action="monitoria-ver-notas" data-tid="${vinculo.monitorandoTurmaId}" data-name="${esc(vinculo.monitorandoName)}">${mo.notasLoading?'Carregando...':'Ver notas por unidade'}</button>
        ` : notas.map(u => {
          const linhas = u.colunas.map(c => ({ disciplina:c.disciplinaName, g:c.grades[vinculo.monitorandoName], total:c.total })).filter(l=>l.g);
          return `
            <div style="margin-top:8px;">
              <strong style="font-size:.85rem;">${esc(u.unidade)}</strong>
              ${linhas.length===0 ? '<p class="muted" style="font-size:.82rem; margin:2px 0;">Sem lançamentos ainda.</p>' : linhas.map(l => `
                <div class="list-item" style="padding:6px 10px;">
                  <span style="font-size:.85rem;">${esc(l.disciplina)}</span>
                  <span style="font-size:.85rem; font-weight:700; color:${l.g.precisaRecuperacao?'var(--red)':'var(--ink)'};">${l.g.final.toFixed(1)} / ${l.total}</span>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}

        <h3 style="margin-top:18px;">Novo registro</h3>
        <label>Status</label>
        <select id="monitoria-status-select">
          ${MONITORIA_STATUS.map(s=>`<option value="${s.key}" ${s.key===mo.registroStatus?'selected':''}>${s.emoji} ${s.label}</option>`).join('')}
        </select>
        <label style="margin-top:8px;">Observação (opcional)</label>
        <textarea id="monitoria-obs-input" rows="2" placeholder="Ex.: participou bem da reunião de hoje...">${esc(mo.registroObs)}</textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:10px;" data-action="monitoria-salvar-registro">Salvar registro</button>

        <h3 style="margin-top:18px;">Histórico</h3>
        ${vinculo.registros.length===0 ? '<p class="muted">Nenhum registro ainda.</p>' : vinculo.registros.map(r => {
          const info = monitoriaStatusInfo(r.status);
          return `
            <div class="list-item" style="align-items:flex-start;">
              <div>
                <span>${info.emoji} <strong>${esc(info.label)}</strong></span><br>
                <span class="muted" style="font-size:.78rem;">${new Date(r.data+'T00:00:00').toLocaleDateString('pt-BR')}</span>
                ${r.observacao ? `<p style="margin:4px 0 0;">${esc(r.observacao)}</p>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // view === 'painel' (padrão quando já faz parte de um grupo)
  const meusVinculos = monitoriaMeusVinculos();
  return `
    <div class="card">
      <h3 style="margin-top:0;">🧑‍🏫 Monitoria de Desempenho</h3>
      <p class="muted" style="margin:0 0 8px;">Colegas do grupo: ${grupo.monitores.map(m=>esc(m.studentName)).join(', ')} (${grupo.monitores.length}/${MONITORIA_MAX_MONITORES})</p>

      <h4 style="margin:14px 0 6px;">Meus monitorandos</h4>
      ${meusVinculos.length===0 ? '<p class="muted">Você ainda não está acompanhando ninguém — escolha abaixo.</p>' : meusVinculos.map(v => {
        const ultimo = v.registros[0];
        const info = ultimo ? monitoriaStatusInfo(ultimo.status) : null;
        return `
          <div class="list-item">
            <div>
              <strong>${esc(v.monitorandoName)}</strong><br>
              <span class="muted" style="font-size:.8rem;">📅 ${esc(v.horarioReuniao)}${info?' · último registro: '+info.emoji+' '+esc(info.label):''}</span>
            </div>
            <button class="btn btn-ghost btn-sm" data-action="monitoria-abrir-detalhe" data-vid="${v.id}">Ver</button>
          </div>
        `;
      }).join('')}

      <h4 style="margin:14px 0 6px;">Monitorandos do grupo</h4>
      ${grupo.monitorandos.length===0 ? '<p class="muted">Nenhum monitorando ainda.</p>' : grupo.monitorandos.filter(s => !meusVinculos.some(v=>v.monitorandoId===s.studentId)).map(s => `
        <div class="list-item">
          <div><strong>${esc(s.studentName)}</strong><br><span class="muted" style="font-size:.8rem;">${esc(s.turmaName)}</span></div>
          <button class="btn btn-primary btn-sm" data-action="monitoria-abrir-vinculo-form" data-sid="${s.studentId}">Acompanhar</button>
        </div>
      `).join('')}

      ${mo.novoVinculoMonitorandoId ? `
        <div class="card" style="background:var(--surface); margin-top:10px;">
          <label>Horário da reunião semanal com ${esc((grupo.monitorandos.find(s=>s.studentId===mo.novoVinculoMonitorandoId)||{}).studentName||'')}</label>
          <input type="text" id="monitoria-horario-input" placeholder="Ex.: Segunda-feira, 14h" value="${esc(mo.novoVinculoHorario)}">
          ${mo.error ? `<p class="err">${esc(mo.error)}</p>` : ''}
          <div class="row" style="margin-top:10px;">
            <button class="btn btn-ghost btn-sm" data-action="monitoria-cancelar-vinculo-form">Cancelar</button>
            <button class="btn btn-primary btn-sm" data-action="monitoria-salvar-vinculo">Confirmar</button>
          </div>
        </div>
      ` : ''}

      <div class="row" style="margin-top:14px;">
        ${grupo.monitorandos.length < MONITORIA_MAX_MONITORANDOS ? `<button class="btn btn-ghost btn-sm" data-action="monitoria-nav-add-alunos">+ Adicionar monitorandos</button>` : ''}
        <button class="btn btn-ghost btn-sm" data-action="monitoria-sair-grupo">Sair do grupo</button>
      </div>
    </div>
  `;
}
function renderAlunoCampanhaBlock(){
  const al = state.aluno;
  const ca = al.campanha;
  if(!ca.loaded && !ca.loading){ loadCampanhaAluno(); }
  if(ca.loading){
    return `<div class="card"><h3 style="margin-top:0;">📢 Jovens Protagonistas</h3><div class="spinner"></div></div>`;
  }
  if(!alunoSouJovemProtagonista()){
    return `
      <div class="card">
        <h3 style="margin-top:0;">📢 Jovens Protagonistas</h3>
        <p class="muted">Você ainda não foi indicado(a) pela coordenação para o grupo Jovens Protagonistas. Quem é indicado pode publicar imagens e vídeos de campanhas da escola, que aparecem no carrossel do painel de todo mundo depois de aprovados pela coordenação.</p>
      </div>
    `;
  }
  const minhas = ca.itens.filter(i=>i.autorStudentId===al.matriculaStudentId);
  const statusLabel = s => s==='aprovado' ? '✅ Aprovado' : s==='recusado' ? '🚫 Recusado' : '⏳ Aguardando aprovação';
  return `
    <div class="card">
      <h3 style="margin-top:0;">📢 Nova publicação</h3>
      <p class="muted" style="font-size:.85rem;">Vai pro carrossel do painel do aluno e do professor, depois de aprovada pela coordenação.</p>
      <label>Título</label>
      <input type="text" id="campanha-titulo-input" value="${esc(ca.novoTitulo)}" placeholder="Ex.: Semana da Consciência Negra" maxlength="80">
      <label>Descrição (opcional)</label>
      <textarea id="campanha-descricao-input" placeholder="Uma frase curta pra legenda" maxlength="200" style="min-height:50px;">${esc(ca.novoDescricao)}</textarea>
      <label>Tipo</label>
      <div class="row" style="gap:8px;">
        <button class="btn ${ca.novoTipo==='imagem'?'btn-primary':'btn-ghost'} btn-sm" data-action="campanha-set-tipo" data-tipo="imagem">🖼️ Imagem</button>
        <button class="btn ${ca.novoTipo==='video'?'btn-primary':'btn-ghost'} btn-sm" data-action="campanha-set-tipo" data-tipo="video">🎬 Vídeo do YouTube</button>
      </div>
      ${ca.novoTipo==='imagem' ? `
        <label style="margin-top:10px;">Imagem</label>
        <input type="file" id="campanha-imagem-input" accept="image/*">
        ${ca.novoImagemUploading ? `
          <div class="row" style="align-items:center; gap:10px; margin-top:8px;">
            ${ca.novoImagemPreviewUrl ? `<img src="${ca.novoImagemPreviewUrl}" alt="Prévia" style="max-width:140px; border-radius:10px;">` : ''}
            <span class="muted" style="font-size:.85rem;"><span class="spinner" style="width:16px; height:16px; display:inline-block; vertical-align:middle; margin-right:6px;"></span>Enviando foto...</span>
          </div>
        ` : ''}
        ${(!ca.novoImagemUploading && ca.novoImagemUrl) ? `<img src="${cloudinaryThumb(ca.novoImagemUrl, 400)}" alt="Prévia" style="max-width:100%; border-radius:10px; margin-top:8px;">` : ''}
      ` : `
        <label style="margin-top:10px;">Link do vídeo no YouTube</label>
        <input type="text" id="campanha-youtube-input" value="${esc(ca.novoYoutubeUrl)}" placeholder="https://www.youtube.com/watch?v=...">
      `}
      ${ca.erro ? `<p class="err">${esc(ca.erro)}</p>` : ''}
      <button class="btn btn-primary btn-block" style="margin-top:12px;" data-action="campanha-enviar-item" ${ca.enviando?'disabled':''}>${ca.enviando?'Enviando...':'Publicar'}</button>
    </div>
    <div class="card">
      <h3 style="margin-top:0;">Suas publicações</h3>
      ${minhas.length===0 ? '<p class="muted">Você ainda não publicou nada.</p>' : minhas.map(item => `
        <div class="list-item" style="align-items:flex-start; gap:10px;">
          ${item.tipo==='video'
            ? `<img class="campanha-item-thumb" src="https://img.youtube.com/vi/${esc(item.youtubeId)}/default.jpg" alt="${esc(item.titulo)}">`
            : `<img class="campanha-item-thumb" src="${campanhaImgSrc(item, 128)}" alt="${esc(item.titulo)}">`}
          <div style="flex:1; min-width:0;">
            <strong>${item.tipo==='video'?'🎬 ':'🖼️ '}${esc(item.titulo)}</strong><br>
            <span class="muted" style="font-size:.8rem;">${statusLabel(item.status)}</span>
            ${item.status==='recusado' && item.motivoRecusa ? `<p class="err" style="font-size:.8rem; margin:4px 0 0;">Motivo: ${esc(item.motivoRecusa)}</p>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
function renderAlunoRABlock(){
  const al = state.aluno;
  const itens = (state.professor.raItems||[]).filter(item => !item.turmaIds || item.turmaIds.length===0 || item.turmaIds.includes(al.turma.id));
  if(itens.length===0) return '';
  return `
    <div class="card">
      <h3 style="margin-top:0;">🕶️ Realidade Aumentada</h3>
      <p class="muted" style="margin:0 0 8px;">Gire o modelo com o dedo e, se estiver no celular, toque no ícone de RA para ver em tamanho real na sua frente.</p>
      <div class="ra-grid">
        ${itens.map(item => `
          <div class="ra-card">
            ${raModelViewerHtml(item)}
            <div class="ra-card-body">
              <p class="ra-card-title">${esc(item.title)}</p>
              ${item.descricao ? `<p class="ra-card-desc">${esc(item.descricao)}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
__parteOk('ra');
