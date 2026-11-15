/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "diario" */
async function loadDiarioCoord(){
  const c = state.coordenador;
  c.diario.loading = true;
  render();
  if(state.professor.tarefas.length===0 && state.professor.tarefasLoading){ await loadTarefas(); }
  let itens = [];
  try{
    const r = await window.storage.list('tarefa-entrega:', true);
    const results = await Promise.all((r.keys||[]).map(async k => {
      try{ const rr = await window.storage.get(k, true); return JSON.parse(rr.value); }catch(e){ return null; }
    }));
    itens = results.filter(e => e && ((e.fotosUrls && e.fotosUrls.length>0) || e.fileDataUrl));
  }catch(e){ itens = []; }
  itens.sort((a,b) => b.submittedAt - a.submittedAt);
  c.diario.itens = itens;
  c.diario.loaded = true;
  c.diario.loading = false;
  render();
}
function renderCoordDiario(){
  const c = state.coordenador;
  if(!c.diario.loaded && !c.diario.loading){ loadDiarioCoord(); }
  if(c.diario.loading){
    return `<div class="card"><h2>📷 Diário de Bordo</h2><div class="spinner"></div></div>`;
  }
  if(!c.diario.turmasCarregadas){
    c.diario.turmasCarregadas = true;
    loadTurmas().then(()=>render());
  }
  const itens = c.diario.filtroTurmaId ? c.diario.itens.filter(e=>e.turmaId===c.diario.filtroTurmaId) : c.diario.itens;
  return `
    <div class="card">
      <h2>📷 Diário de Bordo</h2>
      <p class="muted">Evidências fotográficas de prática enviadas pelos alunos nas Tarefas (EPI, montagem, protótipo etc.) — portfólio de competência prática por turma, útil pra documentar uso pedagógico do celular e pra apoiar estágio/certificação.</p>
      <label>Filtrar por turma</label>
      <select id="diario-filtro-turma-select">
        <option value="">Todas as turmas</option>
        ${state.professor.turmas.map(t=>`<option value="${t.id}" ${t.id===c.diario.filtroTurmaId?'selected':''}>${esc(t.name)}</option>`).join('')}
      </select>
      <div style="margin-top:12px;">
        ${itens.length===0 ? '<p class="muted">Nenhuma entrega com foto ainda.</p>' : itens.map(e => {
          const tarefa = state.professor.tarefas.find(t=>t.id===e.tarefaId);
          const fotos = (e.fotosUrls && e.fotosUrls.length>0) ? e.fotosUrls : (e.fileDataUrl ? [e.fileDataUrl] : []);
          return `
            <div class="list-item" style="align-items:flex-start; flex-wrap:wrap;">
              <div style="flex:1; min-width:0;">
                <strong>${esc(e.studentName)}</strong> <span class="muted" style="font-size:.78rem;">(${esc(state.professor.turmas.find(t=>t.id===e.turmaId)?.name || '—')})</span><br>
                <span class="muted" style="font-size:.8rem;">${esc(tarefa ? tarefa.title : 'Tarefa removida')} · ${new Date(e.submittedAt).toLocaleDateString('pt-BR')}</span>
                <div class="diario-foto-grid">
                  ${fotos.map(url => `<img src="${cloudinaryThumb(url,160)}" alt="Foto da entrega" data-action="abrir-foto-ampliada" data-url="${esc(url)}">`).join('')}
                </div>
                ${e.comentario ? `<p style="margin:4px 0 0; font-size:.85rem;"><em>"${esc(e.comentario)}"</em></p>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
function renderCoordCampanha(){
  const c = state.coordenador;
  if(!c.campanha.loaded && !c.campanha.loading){ loadCampanhaCoord(); }
  if(c.campanha.loading){
    return `<div class="card"><h2>📢 Jovens Protagonistas</h2><div class="spinner"></div></div>`;
  }
  if(!c.campanha.turmasCarregadas){
    c.campanha.turmasCarregadas = true;
    loadTurmas().then(()=>render());
  }
  const pendentes = c.campanha.itens.filter(i=>i.status==='pendente');
  const aprovados = c.campanha.itens.filter(i=>i.status==='aprovado');
  const recusados = c.campanha.itens.filter(i=>i.status==='recusado');
  const lista = c.campanha.subview==='aprovados' ? aprovados : c.campanha.subview==='recusados' ? recusados : pendentes;

  const itemCardHtml = item => `
    <div class="list-item" style="align-items:flex-start; gap:10px;">
      ${item.tipo==='video'
        ? `<img class="campanha-item-thumb" src="https://img.youtube.com/vi/${esc(item.youtubeId)}/default.jpg" alt="${esc(item.titulo)}">`
        : `<img class="campanha-item-thumb" src="${campanhaImgSrc(item, 128)}" alt="${esc(item.titulo)}">`}
      <div style="flex:1; min-width:0;">
        <strong>${item.tipo==='video'?'🎬 ':'🖼️ '}${esc(item.titulo)}</strong><br>
        ${item.descricao ? `<span class="muted" style="font-size:.82rem;">${esc(item.descricao)}</span><br>` : ''}
        <span class="muted" style="font-size:.78rem;">Por ${esc(item.autorNome)} (${esc(item.turmaName)}) · ${new Date(item.criadoEm).toLocaleDateString('pt-BR')}${item.expiraEm ? (Date.now()>item.expiraEm ? ' · ⏰ expirado em ' : ' · ⏰ sai do ar em ')+new Date(item.expiraEm).toLocaleDateString('pt-BR') : ''}</span>
        ${item.tipo==='video' ? `<br><a href="${esc(item.youtubeUrl)}" target="_blank" rel="noopener" style="font-size:.8rem;">Ver no YouTube ↗</a>` : ''}
        ${item.status==='recusado' && item.motivoRecusa ? `<p class="err" style="font-size:.8rem; margin:4px 0 0;">Motivo da recusa: ${esc(item.motivoRecusa)}</p>` : ''}
        ${c.campanha.recusarItemId===item.id ? `
          <div style="margin-top:8px;">
            <textarea data-action="campanha-recusar-motivo-input" placeholder="Motivo da recusa (opcional, o aluno não vê isso)" style="min-height:50px;">${esc(c.campanha.recusarMotivo)}</textarea>
            <div class="row" style="margin-top:6px; gap:6px;">
              <button class="btn btn-ghost btn-sm" data-action="campanha-fechar-recusa">Cancelar</button>
              <button class="btn btn-danger btn-sm" data-action="campanha-confirmar-recusa">Confirmar recusa</button>
            </div>
          </div>
        ` : `
          <div class="row" style="margin-top:8px; gap:6px; flex-wrap:wrap;">
            ${item.status!=='aprovado' ? `<button class="btn btn-primary btn-sm" data-action="campanha-aprovar-item" data-id="${item.id}">✅ Aprovar</button>` : ''}
            ${item.status!=='recusado' ? `<button class="btn btn-ghost btn-sm" data-action="campanha-abrir-recusa" data-id="${item.id}">Recusar</button>` : ''}
            <button class="btn btn-danger btn-sm" data-action="campanha-excluir-item" data-id="${item.id}">Excluir</button>
          </div>
        `}
      </div>
    </div>
  `;

  return `
    <div class="card">
      <h2>📢 Jovens Protagonistas</h2>
      <p class="muted">Banner/carrossel de divulgação da escola, no painel do aluno e do professor — alimentado pelos alunos indicados abaixo, com aprovação da coordenação antes de ir ao ar.</p>

      <div class="card" style="margin-top:14px;">
        <h3 style="margin-top:0;">Alunos indicados</h3>
        <p class="muted" style="font-size:.85rem;">Só quem está nessa lista pode enviar publicações pro carrossel.</p>
        ${c.campanha.indicados.length===0 ? '<p class="muted">Nenhum aluno indicado ainda.</p>' : `
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            ${c.campanha.indicados.map(i => `
              <span style="display:inline-flex; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--paper-line); border-radius:16px; padding:4px 6px 4px 12px; font-size:.85rem;">
                ${esc(i.studentName)} <span class="muted" style="font-size:.75rem;">(${esc(i.turmaName)})</span>
                <button class="btn btn-ghost btn-sm" style="padding:0 6px;" data-action="campanha-remover-indicado" data-sid="${i.studentId}" title="Remover indicação">✕</button>
              </span>
            `).join('')}
          </div>
        `}
        <label>Turma</label>
        <select id="campanha-indicar-turma-select">
          <option value="">Selecione...</option>
          ${state.professor.turmas.map(t=>`<option value="${t.id}" ${t.id===c.campanha.indicarTurmaId?'selected':''}>${esc(t.name)}</option>`).join('')}
        </select>
        ${(() => {
          const turma = state.professor.turmas.find(t=>t.id===c.campanha.indicarTurmaId);
          if(!turma) return '';
          const jaIndicados = new Set(c.campanha.indicados.map(i=>i.studentId));
          const disponiveis = turma.students.filter(s=>!jaIndicados.has(s.id));
          if(disponiveis.length===0) return '<p class="muted" style="margin-top:8px;">Todos os alunos dessa turma já estão indicados.</p>';
          return disponiveis.map(s => `
            <label class="row" style="align-items:center; gap:8px; font-weight:400; margin-top:8px;">
              <input type="checkbox" data-action="campanha-toggle-indicar-aluno" data-sid="${s.id}" ${c.campanha.indicarSelecionados.includes(s.id)?'checked':''}>
              ${esc(s.name)}
            </label>
          `).join('');
        })()}
        ${c.campanha.indicarError ? `<p class="err">${esc(c.campanha.indicarError)}</p>` : ''}
        ${c.campanha.indicarTurmaId ? `<button class="btn btn-primary btn-sm" style="margin-top:10px;" data-action="campanha-indicar-alunos">Indicar selecionados</button>` : ''}
      </div>

      ${(() => {
        const b = campBannerState();
        if(!b.aberto) return `<div style="margin-top:14px;"><button class="btn btn-primary" data-action="coord-banner-abrir">➕ Criar banner da coordenação</button><p class="muted" style="font-size:.8rem; margin:6px 0 0;">Avisos e campanhas da escola: vão direto para o carrossel de alunos e professores, sem precisar de aprovação.</p></div>`;
        return `
        <div class="card" style="margin-top:14px; border:2px solid var(--green);">
          <div class="row" style="align-items:center; justify-content:space-between;"><h3 style="margin:0;">➕ Novo banner da coordenação</h3><button class="btn btn-ghost btn-sm" data-action="coord-banner-fechar">✕ Fechar</button></div>
          <label>Título</label>
          <input type="text" id="coord-banner-titulo" value="${esc(b.titulo)}" placeholder="Ex.: Matrículas abertas — procure a secretaria" maxlength="80">
          <label>Descrição (opcional)</label>
          <textarea id="coord-banner-descricao" placeholder="Uma frase curta pra legenda" maxlength="200" style="min-height:50px;">${esc(b.descricao)}</textarea>
          <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:400; margin-top:8px;">
            <input type="checkbox" data-action="coord-banner-legenda" ${b.mostrarLegenda?'checked':''} style="width:auto;"> Mostrar título e descrição por cima da imagem <span class="muted" style="font-size:.8rem;">(deixe desligado se o texto já está dentro da imagem)</span>
          </label>
          <label>Tipo</label>
          <div class="row" style="gap:8px;">
            <button class="btn ${b.tipo==='imagem'?'btn-primary':'btn-ghost'} btn-sm" data-action="coord-banner-tipo" data-tipo="imagem">🖼️ Imagem</button>
            <button class="btn ${b.tipo==='video'?'btn-primary':'btn-ghost'} btn-sm" data-action="coord-banner-tipo" data-tipo="video">🎬 Vídeo do YouTube</button>
          </div>
          ${b.tipo==='imagem' ? `
            <label style="margin-top:10px;">Imagem</label>
            <input type="file" id="coord-banner-imagem" accept="image/*">
            <p class="muted" style="font-size:.8rem; margin:4px 0 0;">Tamanho ideal: <strong>2000 × 667 px (proporção 3:1)</strong>. O carrossel mostra a imagem inteira nessa proporção; em telas muito estreitas, um pouco das laterais pode ser cortado.</p>
            ${b.uploading ? `<div class="row" style="align-items:center; gap:10px; margin-top:8px;">${b.preview ? `<img src="${b.preview}" alt="Prévia" style="max-width:140px; border-radius:10px;">` : ''}<span class="muted" style="font-size:.85rem;">Enviando imagem...</span></div>` : ''}
            ${(!b.uploading && b.imagemUrl) ? `<img src="${cloudinaryThumb(b.imagemUrl, 400)}" alt="Prévia" style="max-width:100%; border-radius:10px; margin-top:8px;">` : ''}
          ` : `
            <label style="margin-top:10px;">Link do vídeo no YouTube</label>
            <input type="text" id="coord-banner-youtube" value="${esc(b.youtubeUrl)}" placeholder="https://www.youtube.com/watch?v=...">
          `}
          <label style="margin-top:10px;">Sai do ar em (opcional)</label>
          <input type="date" id="coord-banner-expira" value="${esc(b.expira)}" style="max-width:200px;">
          <p class="muted" style="font-size:.8rem; margin:4px 0 0;">Em branco, o banner fica no ar até você excluí-lo.</p>
          ${b.erro ? `<p class="err">${esc(b.erro)}</p>` : ''}
          <button class="btn btn-primary btn-block" style="margin-top:12px;" data-action="coord-banner-publicar" ${b.salvando?'disabled':''}>${b.salvando?'Publicando...':'Publicar banner'}</button>
        </div>`;
      })()}

      <div class="row quick-actions-bar" style="gap:8px; margin-top:16px; flex-wrap:wrap;">
        <button class="btn ${c.campanha.subview!=='aprovados' && c.campanha.subview!=='recusados' ? 'btn-primary':'btn-ghost'} btn-sm" data-action="campanha-subview" data-sub="pendentes">⏳ Pendentes${pendentes.length>0?` (${pendentes.length})`:''}</button>
        <button class="btn ${c.campanha.subview==='aprovados'?'btn-primary':'btn-ghost'} btn-sm" data-action="campanha-subview" data-sub="aprovados">✅ Aprovados (${aprovados.length})</button>
        <button class="btn ${c.campanha.subview==='recusados'?'btn-primary':'btn-ghost'} btn-sm" data-action="campanha-subview" data-sub="recusados">🚫 Recusados (${recusados.length})</button>
      </div>
      <div style="margin-top:12px;">
        ${lista.length===0 ? '<p class="muted">Nada por aqui.</p>' : lista.map(itemCardHtml).join('')}
      </div>
    </div>
  `;
}
function renderCoordMonitoria(){
  const c = state.coordenador;
  if(!c.monitoria.loaded && !c.monitoria.loading){ loadCoordMonitoria(); }
  if(c.monitoria.loading){
    return `<div class="card"><h2>🧑‍🏫 Monitoria de Desempenho</h2><div class="spinner"></div></div>`;
  }
  if(!c.monitoria.turmasCarregadas){
    c.monitoria.turmasCarregadas = true;
    loadTurmas().then(()=>render());
  }
  // junta todos os vínculos com o status mais recente de cada um, pra destacar
  // rapidamente quem precisa de intervenção da Direção.
  const vistosAntes = new Set(monitoriaVistosGet());
  const vinculosComStatus = c.monitoria.vinculos.map(v => {
    const ultimo = v.registros && v.registros[0];
    return { ...v, ultimoStatus: ultimo ? ultimo.status : null, ultimoData: ultimo ? ultimo.data : null, ultimoRegistroId: ultimo ? ultimo.id : null };
  });
  const intervencao = vinculosComStatus.filter(v=>v.ultimoStatus==='intervencao_direcao');
  // Ao abrir esta tela, os casos de intervenção atuais deixam de contar como "novos"
  // no contador do menu lateral (mas continuam marcados aqui na própria tela, pra
  // quem estava acompanhando saber quais acabaram de aparecer).
  monitoriaMarcarIntervencaoVista();

  return `
    <div class="card">
      <h2>🧑‍🏫 Monitoria de Desempenho</h2>
      <p class="muted">Grupos de alunos-monitores acompanhando colegas em risco de reprovação, com notas, frequência de reuniões e observações.</p>

      <div class="card" style="margin-top:14px;">
        <h3 style="margin-top:0;">Alunos indicados como monitor</h3>
        <p class="muted" style="font-size:.85rem;">Só quem está nessa lista pode criar ou entrar em um grupo de monitoria.</p>
        ${c.monitoria.indicados.length===0 ? '<p class="muted">Nenhum aluno indicado ainda.</p>' : `
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            ${c.monitoria.indicados.map(i => `
              <span style="display:inline-flex; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--paper-line); border-radius:16px; padding:4px 6px 4px 12px; font-size:.85rem;">
                ${esc(i.studentName)} <span class="muted" style="font-size:.75rem;">(${esc(i.turmaName)})</span>
                <button class="btn btn-ghost btn-sm" style="padding:0 6px;" data-action="monitoria-remover-indicado" data-sid="${i.studentId}" title="Remover indicação">✕</button>
              </span>
            `).join('')}
          </div>
        `}
        <label>Turma</label>
        <select id="monitoria-indicar-turma-select">
          <option value="">Selecione...</option>
          ${state.professor.turmas.map(t=>`<option value="${t.id}" ${t.id===c.monitoria.indicarTurmaId?'selected':''}>${esc(t.name)}</option>`).join('')}
        </select>
        ${(() => {
          const turma = state.professor.turmas.find(t=>t.id===c.monitoria.indicarTurmaId);
          if(!turma) return '';
          const jaIndicados = new Set(c.monitoria.indicados.map(i=>i.studentId));
          const termo = (c.monitoria.indicarBusca||'').trim().toLowerCase();
          const buscaHtml = `<input type="text" id="monitoria-indicar-busca-input" placeholder="Digite o nome do aluno para filtrar..." value="${esc(c.monitoria.indicarBusca||'')}" style="margin-top:8px;">`;
          const disponiveis = turma.students.filter(s=>!jaIndicados.has(s.id) && (!termo || s.name.toLowerCase().includes(termo)));
          if(turma.students.filter(s=>!jaIndicados.has(s.id)).length===0) return '<p class="muted" style="margin-top:8px;">Todos os alunos dessa turma já estão indicados.</p>';
          if(disponiveis.length===0) return buscaHtml + '<p class="muted" style="margin-top:8px;">Nenhum aluno encontrado.</p>';
          return buscaHtml + disponiveis.map(s => `
            <label class="row" style="align-items:center; gap:8px; font-weight:400; margin-top:8px;">
              <input type="checkbox" data-action="monitoria-toggle-indicar-aluno" data-sid="${s.id}" ${c.monitoria.indicarSelecionados.includes(s.id)?'checked':''}>
              ${esc(s.name)}
            </label>
          `).join('');
        })()}
        ${c.monitoria.indicarError ? `<p class="err">${esc(c.monitoria.indicarError)}</p>` : ''}
        ${c.monitoria.indicarTurmaId ? `<button class="btn btn-primary btn-sm" style="margin-top:10px;" data-action="monitoria-indicar-alunos">Indicar selecionados</button>` : ''}
      </div>

      ${intervencao.length>0 ? `
        <div class="card" style="border:2px solid var(--red); margin-top:14px;">
          <h3 style="margin-top:0; color:var(--red);">🚨 Precisam de intervenção da Direção</h3>
          ${intervencao.map(v => {
            const ehNovo = v.ultimoRegistroId && !vistosAntes.has(v.ultimoRegistroId);
            return `
            <div class="list-item" style="align-items:flex-start;">
              <div>
                <strong>${esc(v.monitorandoName)}</strong> <span class="muted">(${esc(v.monitorandoTurmaName)})</span>
                ${ehNovo ? '<span style="background:var(--red); color:#fff; font-size:.68rem; font-weight:700; padding:1px 7px; border-radius:10px; margin-left:6px; vertical-align:middle;">NOVO</span>' : ''}<br>
                <span class="muted" style="font-size:.8rem;">Monitor: ${esc(v.monitorName)} · registrado em ${new Date(v.ultimoData+'T00:00:00').toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          `;
          }).join('')}
        </div>
      ` : ''}

      <h3 style="margin-top:20px;">Grupos</h3>
      ${c.monitoria.grupos.length===0 ? '<p class="muted">Nenhum grupo de monitoria criado ainda.</p>' : c.monitoria.grupos.map(g => {
        const vinculosDoGrupo = vinculosComStatus.filter(v=>v.grupoId===g.id);
        return `
          <div class="card" style="margin-top:10px;">
            <strong>Monitores:</strong> ${g.monitores.map(m=>esc(m.studentName)+' ('+esc(m.turmaName)+')').join(', ') || '<span class="muted">nenhum</span>'}<br>
            <strong>Monitorandos (${g.monitorandos.length}/${MONITORIA_MAX_MONITORANDOS}):</strong> ${g.monitorandos.map(m=>esc(m.studentName)).join(', ') || '<span class="muted">nenhum</span>'}
            ${vinculosDoGrupo.length>0 ? `
              <table style="margin-top:10px;">
                <tr><th>Monitorando</th><th>Monitor</th><th>Horário</th><th>Último status</th></tr>
                ${vinculosDoGrupo.map(v => {
                  const info = v.ultimoStatus ? monitoriaStatusInfo(v.ultimoStatus) : null;
                  return `<tr>
                    <td>${esc(v.monitorandoName)}</td>
                    <td>${esc(v.monitorName)}</td>
                    <td>${esc(v.horarioReuniao)}</td>
                    <td>${info ? info.emoji+' '+esc(info.label) : '<span class="muted">sem registro</span>'}</td>
                  </tr>`;
                }).join('')}
              </table>
            ` : '<p class="muted" style="margin-top:8px;">Nenhum monitor acompanhando um aluno específico ainda.</p>'}
          </div>
        `;
      }).join('')}
    </div>
  `;
}
__parteOk('diario');
