/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "gab_avulso" */
function renderGabaritoAvulso(){
  const p = state.professor;
  const av = p.avulso;
  if(av.listLoading) return `<div class="card"><h2>Gabarito Avulso</h2><div class="spinner"></div></div>`;
  if(av.mode==='novo' && av.form) return renderNovoAvulso();
  if(av.mode==='detalhe' && av.current) return renderDetalheAvulso();
  if(av.mode==='importar') return renderImportarRespostasAvulso();
  return renderListaAvulsos();
}
function renderListaAvulsos(){
  const p = state.professor;
  const list = p.avulso.list || [];
  return `
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <h2 style="margin:0;">Gabarito Avulso</h2>
        <div class="row" style="flex:0 0 auto; gap:6px;">
          <button class="btn btn-ghost btn-sm" data-action="avulso-abrir-importar-planilha">📥 Importar respostas de planilha</button>
          <button class="btn btn-primary btn-sm" data-action="avulso-novo">+ Novo gabarito avulso</button>
        </div>
      </div>
      <p class="muted">Crie um gabarito de múltipla escolha avulso, sem vínculo com uma avaliação do sistema — ideal para provas integradas em papel, com várias disciplinas no mesmo cartão-resposta.</p>
      ${list.length===0 ? '<p class="muted center">Nenhum gabarito avulso criado ainda.</p>' : list.map(g => `
        <div class="list-item">
          <div>
            <strong>${esc(g.titulo)}</strong> <span class="muted" style="font-size:.82rem;">· código ${esc(g.code)}</span>
            ${g.instrumento ? `<span class="pill" style="font-size:.7rem; padding:1px 8px; background:#dff0d8; margin-left:6px;">🔗 substitui ${esc(instrumentoBaseTitle(g.instrumento))}</span>` : ''}<br>
            <span class="muted" style="font-size:.82rem;">${g.unidade?esc(g.unidade)+' · ':''}${g.dataProva?new Date(g.dataProva+'T00:00:00').toLocaleDateString('pt-BR')+' · ':''}${g.numQuestoes} questões · ${(g.disciplinas||[]).map(d=>esc(d.nome)).join(', ')}</span>
          </div>
          <div class="row" style="flex:0 0 auto;">
            <button class="btn btn-ghost btn-sm" data-action="avulso-abrir" data-id="${g.id}">Abrir</button>
            <button class="btn btn-ghost btn-sm" data-action="avulso-excluir" data-id="${g.id}">Excluir</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
function renderImportarRespostasAvulso(){
  const p = state.professor;
  const ip = p.avulso.importPlanilha || { processando:false, erro:'', resultado:null, nomeArquivo:'', importando:false };
  let body;
  if(ip.processando){
    body = `<div class="spinner"></div>`;
  } else if(!ip.resultado){
    body = `
      <p class="muted">Envie uma planilha (.csv ou .xlsx) com uma linha por aluno, contendo:</p>
      <ul class="muted" style="font-size:.85rem; margin:0 0 10px 18px;">
        <li>uma coluna <strong>Aluno</strong> (ou "Nome");</li>
        <li>uma coluna indicando de qual prova é a linha — ex.: <strong>Prova</strong>, "Gabarito" ou "Dia" (obrigatório pra separar as provas diferentes);</li>
        <li>uma coluna <strong>Turma</strong> (opcional, ajuda a identificar o aluno certo);</li>
        <li>uma coluna por questão, com a letra marcada — ex.: <strong>Q1</strong>, <strong>Q2</strong>, <strong>Q3</strong>...</li>
      </ul>
      <input type="file" id="avulso-import-planilha-file" accept=".csv,.xlsx,.xls">
      ${ip.erro ? `<p class="err" style="margin-top:8px;">${esc(ip.erro)}</p>` : ''}
    `;
  } else {
    const r = ip.resultado;
    body = `
      <p class="muted">Encontrei <strong>${r.grupos.length}</strong> prova(s) diferente(s) na planilha. Confira (e ajuste se quiser) o título de cada gabarito antes de importar — um gabarito avulso novo é criado pra cada uma, <strong>ainda sem o gabarito correto</strong>: as notas ficam zeradas até você abrir o gabarito e informar as respostas certas.</p>
      ${r.grupos.map((g, gi) => `
        <div class="card" style="background:var(--surface); margin-top:10px; padding:10px;">
          <label style="font-size:.75rem;">Título do gabarito avulso</label>
          <input type="text" class="input" data-action="avulso-import-titulo-grupo" data-gi="${gi}" value="${esc(g.tituloEdit)}">
          ${g.jaExisteGabaritoComMesmoTitulo ? `<p class="err" style="font-size:.78rem; margin-top:4px;">⚠️ Já existe um gabarito avulso com esse título — talvez seja melhor renomear pra não confundir os dois (a importação cria um gabarito novo, não junta com o existente).</p>` : ''}
          <p class="muted" style="font-size:.82rem; margin-top:6px;">${g.numQuestoes} questões · ${g.numAlternativas} alternativas (A–${OPT_LETTERS[g.numAlternativas-1]}) · ${g.itens.length} aluno(s)${g.turmasEnvolvidas.length>0?' · turma(s): '+g.turmasEnvolvidas.map(esc).join(', '):''}</p>
          ${g.semTurma>0 ? `<p class="muted" style="font-size:.8rem;">⚠️ ${g.semTurma} aluno(s) sem turma identificada na planilha — a resposta é lançada do mesmo jeito, só fica sem turma vinculada.</p>` : ''}
        </div>
      `).join('')}
      <div class="row" style="margin-top:14px;">
        <button class="btn btn-ghost" data-action="avulso-cancelar-importar-planilha" ${ip.importando?'disabled':''}>Cancelar</button>
        <button class="btn btn-primary" data-action="avulso-confirmar-importar-planilha" ${ip.importando?'disabled':''}>${ip.importando?'Importando...':'Confirmar importação'}</button>
      </div>
    `;
  }
  return `
    <div class="card">
      <button class="btn btn-ghost btn-sm" data-action="avulso-cancelar-importar-planilha">← Voltar</button>
      <h2>Importar respostas de planilha</h2>
      ${body}
    </div>
  `;
}
function renderNovoAvulso(){
  const p = state.professor;
  const f = p.avulso.form;
  const profCache = p.avulso.professoresCache || [];
  const instrumentosCompativeis = INSTRUMENTOS.filter(i => ['avaliacao','diagnostica','exercicios'].includes(i.key));
  const editando = !!f.editingGabaritoId;
  return `
    <div class="card">
      <h2>${editando ? 'Editar configuração do gabarito' : 'Novo gabarito avulso'}</h2>
      ${editando ? '<p class="muted" style="font-size:.85rem;">Você pode ajustar título, unidade, quantidade de questões/alternativas, o instrumento substituído, o vínculo de professor(a)/disciplina de cada bloco, e adicionar, remover ou mudar o intervalo de questões das disciplinas. Se algum aluno já tiver resposta lançada: mudar só o intervalo de uma disciplina recalcula a nota por disciplina automaticamente; já mudar a <strong>quantidade de questões ou de alternativas</strong> zera o gabarito correto e as notas já lançadas (os cartões já impressos ficam com a contagem antiga, então confira se é isso mesmo que você quer antes de mudar).</p>' : ''}
      <label>Título / nome da prova</label>
      <input type="text" id="avulso-titulo-input" class="input" value="${esc(f.titulo)}" placeholder="Ex: Prova Integrada I Unidade">
      <div class="row" style="gap:10px; margin-top:8px;">
        <div style="flex:1;">
          <label>Unidade</label>
          <select id="avulso-unidade-input" class="input">
            <option value="">— selecionar —</option>
            ${UNIDADES.map(u => `<option value="${esc(u)}" ${f.unidade===u?'selected':''}>${esc(u)}</option>`).join('')}
          </select>
        </div>
        <div style="flex:1;">
          <label>Data da prova</label>
          <input type="date" id="avulso-data-input" class="input" value="${esc(f.dataProva)}">
        </div>
      </div>
      <div class="row" style="gap:10px; margin-top:8px;">
        <div style="flex:1;">
          <label>Quantidade de questões</label>
          <input type="number" id="avulso-numquestoes-input" class="input" min="1" max="150" value="${f.numQuestoes}">
        </div>
        <div style="flex:1;">
          <label>Alternativas por questão</label>
          <select id="avulso-numalt-input" class="input">
            ${[2,3,4,5,6].map(n => `<option value="${n}" ${f.numAlternativas===n?'selected':''}>${n} (A–${OPT_LETTERS[n-1]})</option>`).join('')}
          </select>
        </div>
      </div>

      <h3 style="margin-top:18px;">Esse resultado substitui um instrumento avaliativo?</h3>
      <p class="muted" style="font-size:.85rem;">Se você escolher um instrumento, a nota de cada aluno (por disciplina, no intervalo de questões definido abaixo) passa a valer automaticamente como esse instrumento — já aparece no painel do(a) professor(a) vinculado(a), somando na nota final do bimestre. Só funciona para disciplinas com professor(a) selecionado(a) abaixo.</p>
      <select id="avulso-instrumento-input" class="input">
        <option value="">Não substituir nenhum instrumento (apenas registrar as notas aqui)</option>
        ${instrumentosCompativeis.map(i => `<option value="${i.key}" ${f.instrumento===i.key?'selected':''}>${esc(i.baseTitle)}</option>`).join('')}
      </select>
      <p class="muted" style="font-size:.78rem; margin-top:4px;">A Autoavaliação não pode ser substituída por aqui — ela é sempre calculada a partir de fichas, frequência de login e entrega de exercícios.</p>
      ${f.instrumento && !f.unidade ? '<p class="err" style="font-size:.82rem; margin-top:4px;">Selecione a unidade acima para poder substituir um instrumento.</p>' : ''}

      <h3 style="margin-top:18px;">Disciplinas por intervalo de questões</h3>
      <p class="muted" style="font-size:.85rem;">Ex.: questão 1 a 10 – Química, questão 11 a 20 – Biologia... Para que a nota entre automaticamente no painel de um(a) professor(a), vincule professor(a) + disciplina. Se disciplinas diferentes séries/turmas são dadas por professores diferentes (ex.: Português da 1ª, da 2ª e da 3ª série), adicione um vínculo pra cada um, marcando as turmas de cada professor(a).</p>
      ${profCache.length===0 && !p.avulso.professoresCacheLoading ? '<p class="muted" style="font-size:.82rem;">Nenhum professor ativo encontrado — os blocos abaixo poderão ser criados só com o nome, sem vínculo automático.</p>' : ''}
      ${f.disciplinas.map(d => {
        const vinculos = d.vinculos || [];
        const precisaTurma = vinculos.length > 1;
        return `
        <div class="card" style="background:var(--surface); margin-bottom:8px; padding:10px;">
          <div class="row" style="gap:8px; align-items:center; flex-wrap:wrap;">
            <input type="text" class="input" style="flex:2; min-width:140px;" data-action="avulso-disc-nome" data-id="${d.id}" value="${esc(d.nome)}" placeholder="Nome da disciplina (aparece no cartão impresso)">
            <span class="muted">questão</span>
            <input type="number" class="input" style="flex:0 0 65px;" min="1" max="${f.numQuestoes}" data-action="avulso-disc-inicio" data-id="${d.id}" value="${d.inicio}">
            <span class="muted">a</span>
            <input type="number" class="input" style="flex:0 0 65px;" min="1" max="${f.numQuestoes}" data-action="avulso-disc-fim" data-id="${d.id}" value="${d.fim}">
            <button class="btn btn-ghost btn-sm" data-action="avulso-disc-remover" data-id="${d.id}">✕</button>
          </div>
          ${vinculos.map((v, vidx) => {
            const prof = profCache.find(pr=>pr.id===v.professorId);
            const discOptions = prof ? prof.disciplinas : [];
            return `
            <div class="row" style="gap:8px; margin-top:8px; padding-top:8px; border-top:1px dashed #d8d2c8; flex-wrap:wrap; align-items:flex-end;">
              <div style="flex:1; min-width:160px;">
                <label style="font-size:.75rem;">${vinculos.length>1?`Professor(a) (vínculo ${vidx+1})`:'Professor(a) (opcional)'}</label>
                <select class="input" data-action="avulso-vinc-prof" data-id="${d.id}" data-vid="${v.id}" ${p.avulso.professoresCacheLoading?'disabled':''}>
                  <option value="">— sem vínculo automático —</option>
                  ${profCache.map(pr => `<option value="${pr.id}" ${v.professorId===pr.id?'selected':''}>${esc(pr.name)}${pr.ativo?'':' (aguardando 1º acesso)'}</option>`).join('')}
                </select>
              </div>
              <div style="flex:1; min-width:160px;">
                <label style="font-size:.75rem;">Disciplina do(a) professor(a)</label>
                <select class="input" data-action="avulso-vinc-disciplina" data-id="${d.id}" data-vid="${v.id}" ${!v.professorId?'disabled':''}>
                  <option value="">${v.professorId?'— selecionar —':'selecione o(a) professor(a) primeiro'}</option>
                  ${discOptions.map(disc => `<option value="${disc.id}" ${v.disciplinaId===disc.id?'selected':''}>${esc(disc.name)}</option>`).join('')}
                </select>
                ${(v.professorId && prof && discOptions.length===0) ? `<p class="muted" style="font-size:.78rem; margin-top:2px;">Esse(a) professor(a) ainda não tem disciplina cadastrada. Vá em <strong>Professores</strong> → <strong>📚 Disciplinas</strong> pra cadastrar antes de vincular aqui.</p>` : ''}
              </div>
              ${vinculos.length>1 ? `<button class="btn btn-ghost btn-sm" data-action="avulso-vinc-remover" data-id="${d.id}" data-vid="${v.id}" style="flex:0 0 auto;">✕ vínculo</button>` : ''}
              <div style="flex-basis:100%;">
                <label style="font-size:.75rem;">${precisaTurma?'Turmas deste professor(a) (obrigatório com mais de um vínculo)':'Turmas (deixe em branco = todas as turmas deste gabarito)'}</label>
                <div class="row" style="gap:4px 10px; flex-wrap:wrap;">
                  ${(state.professor.turmas||[]).map(t => `
                    <label style="display:flex; align-items:center; gap:4px; font-weight:400; text-transform:none; font-size:.8rem; flex:0 0 auto;">
                      <input type="checkbox" data-action="avulso-vinc-toggle-turma" data-id="${d.id}" data-vid="${v.id}" data-tid="${t.id}" ${(v.turmaIds||[]).includes(t.id)?'checked':''}> ${esc(t.name)}
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>
          `;}).join('')}
          ${vinculos.length===0 ? '<p class="err" style="font-size:.8rem; margin-top:6px;">⚠️ Esta disciplina ainda não tem professor(a) vinculado(a) — as notas não vão aparecer no painel de ninguém até você adicionar um vínculo abaixo.</p>' : ''}
          <div class="row" style="margin-top:8px;">
            <button class="btn btn-ghost btn-sm" data-action="avulso-vinc-adicionar" data-id="${d.id}">${vinculos.length===0 ? '+ Vincular professor(a) e disciplina' : '+ Adicionar outro vínculo (outro professor/série)'}</button>
          </div>
        </div>
      `;}).join('')}
      <button class="btn btn-ghost btn-sm" data-action="avulso-disc-adicionar">+ Adicionar disciplina</button>

      ${editando ? '' : '<p class="muted" style="font-size:.85rem; margin-top:18px;">O gabarito correto é informado depois, já na tela do gabarito avulso — organizado por disciplina, em colunas, pra evitar erro de contagem. Você já pode imprimir os cartões-resposta assim que salvar aqui.</p>'}

      <div id="avulso-err"></div>
      <div class="row" style="margin-top:14px;">
        <button class="btn btn-ghost" data-action="${editando?'avulso-cancelar-edicao':'avulso-cancelar-novo'}">Cancelar</button>
        <button class="btn btn-primary" data-action="${editando?'avulso-salvar-edicao':'avulso-salvar'}">${editando?'Salvar alterações':'Salvar gabarito avulso'}</button>
      </div>
    </div>
  `;
}
function renderAvulsoScanReview(){
  const p = state.professor;
  const av = p.avulso;
  const gab = av.scanAvulso;
  const review = av.scanReview;
  const letters = OPT_LETTERS.slice(0, gab.numAlternativas);
  const rows = review.map((r, idx) => `
    <div class="q-card" style="padding:8px 10px;">
      <div class="q-tag" style="font-size:.8rem;">Q${idx+1}${r.detectedIndex===null?' <span style="color:var(--red);">?</span>':''}</div>
      <div class="row" style="margin-top:4px; flex-wrap:wrap; gap:4px;">
        ${letters.map((letter,j) => `
          <label style="display:flex;align-items:center;gap:3px;font-weight:400;text-transform:none;flex:0 0 auto;font-size:.82rem;">
            <input type="radio" name="avulso-scan-q-${idx}" value="${j}" ${r.detectedIndex===j?'checked':''}> ${letter}
          </label>
        `).join('')}
        <label style="display:flex;align-items:center;gap:3px;font-weight:400;text-transform:none;flex:0 0 auto;font-size:.82rem;">
          <input type="radio" name="avulso-scan-q-${idx}" value="" ${r.detectedIndex===null?'checked':''}> branco
        </label>
      </div>
    </div>
  `).join('');
  const turmaSelectHtml = av.scanTurmaId ? '' : `
    <p class="err" style="font-size:.85rem;">Não foi possível identificar a turma automaticamente por este cartão${av.scanTurmaName?' ("'+esc(av.scanTurmaName)+'" não bate com nenhuma turma cadastrada)':''}. Selecione a turma do aluno para poder confirmar:</p>
    <select id="avulso-scan-turma-select" class="input">
      <option value="">— selecione a turma —</option>
      ${state.professor.turmas.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}
    </select>
  `;
  return `
    <div>
      ${av.scanQueue ? `<p class="muted" style="font-size:.8rem;">📄 Página ${av.scanQueue.index+1} de ${av.scanQueue.files.length} do PDF</p>` : ''}
      <p class="muted">Aluno: <strong>${esc(av.scanStudentName)}</strong>${av.scanTurmaId?' · Turma: '+esc(state.professor.turmas.find(t=>t.id===av.scanTurmaId)?.name||av.scanTurmaName):''} · ${esc(gab.titulo||'Gabarito Avulso')}</p>
      ${turmaSelectHtml}
      <p class="muted" style="font-size:.85rem;">Revise questão por questão — o que veio marcado é só uma sugestão da leitura da foto. Corrija o que estiver errado antes de confirmar.</p>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(190px,1fr)); gap:6px; margin:10px 0;">${rows}</div>
      <div class="row">
        <button class="btn btn-ghost" data-action="avulso-scan-cancel">Cancelar${av.scanQueue?' tudo':''}</button>
        ${av.scanQueue ? `<button class="btn btn-ghost" data-action="avulso-scan-pular">Pular esta página →</button>` : ''}
        <button class="btn btn-primary" data-action="avulso-scan-confirm">Confirmar${av.scanQueue?' e ir para a próxima':' e lançar nota'}</button>
      </div>
    </div>
  `;
}
function gabaritoColunasPorDisciplina(disciplinas, numQuestoes){
  const covered = new Array(numQuestoes).fill(false);
  const columns = [];
  (disciplinas||[]).forEach(d => {
    const ini = Math.max(1, parseInt(d.inicio)||1);
    const fim = Math.min(numQuestoes, parseInt(d.fim)||numQuestoes);
    const qs = [];
    for(let i=ini; i<=fim; i++){ covered[i-1] = true; qs.push(i); }
    columns.push({ label: d.nome || 'Disciplina', qs });
  });
  const leftover = [];
  for(let i=1;i<=numQuestoes;i++){ if(!covered[i-1]) leftover.push(i); }
  if(leftover.length>0) columns.push({ label: (disciplinas && disciplinas.length>0) ? 'Demais questões' : 'Questões', qs: leftover });
  return columns;
}
function renderGabaritoGridEditavel(gab, answers, actionName){
  const columns = gabaritoColunasPorDisciplina(gab.disciplinas, gab.numQuestoes);
  const validLetters = OPT_LETTERS.slice(0, gab.numAlternativas);
  return `
    <div style="display:flex; gap:22px; flex-wrap:wrap; margin:10px 0;">
      ${columns.map(col => `
        <div style="min-width:150px;">
          <h4 style="margin:0 0 8px; font-size:.85rem; color:var(--board-light);">${esc(col.label)}${col.qs.length>0?` (Q${col.qs[0]}–${col.qs[col.qs.length-1]})`:''}</h4>
          ${col.qs.map(qn => `
            <div class="row" style="align-items:center; gap:8px; margin-bottom:5px; flex-wrap:nowrap;">
              <span style="width:32px; font-weight:600; font-size:.85rem; flex:0 0 auto;">Q${qn}</span>
              <select class="input" style="flex:0 0 70px; padding:5px 6px;" data-action="${actionName}" data-idx="${qn-1}">
                <option value="">—</option>
                ${validLetters.map(l => `<option value="${l}" ${answers[qn-1]===l?'selected':''}>${l}</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}
function renderGabaritoGridBolinhas(gab, answers, actionName){
  const columns = gabaritoColunasPorDisciplina(gab.disciplinas, gab.numQuestoes);
  const validLetters = OPT_LETTERS.slice(0, gab.numAlternativas);
  return `
    <div style="display:flex; gap:22px; flex-wrap:wrap; margin:10px 0;">
      ${columns.map(col => `
        <div style="min-width:150px;">
          <h4 style="margin:0 0 8px; font-size:.85rem; color:var(--board-light);">${esc(col.label)}${col.qs.length>0?` (Q${col.qs[0]}–${col.qs[col.qs.length-1]})`:''}</h4>
          ${col.qs.map(qn => `
            <div class="row" style="align-items:center; gap:8px; margin-bottom:7px; flex-wrap:nowrap;">
              <span style="width:28px; font-weight:600; font-size:.85rem; flex:0 0 auto;">Q${qn}</span>
              <div class="row" style="gap:5px; flex-wrap:nowrap; flex:0 0 auto;">
                ${validLetters.map(l => `
                  <button type="button" class="gabarito-bolinha ${answers[qn-1]===l?'selected':''}" data-action="${actionName}" data-idx="${qn-1}" data-letra="${l}" title="${l}">${l}</button>
                `).join('')}
                ${answers[qn-1] ? `<button type="button" class="gabarito-bolinha-limpar" data-action="${actionName}" data-idx="${qn-1}" data-letra="" title="Limpar resposta">✕</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}
function renderGabaritoGridRespostaAluno(gab, respostas){
  const columns = gabaritoColunasPorDisciplina(gab.disciplinas, gab.numQuestoes);
  const temGabarito = !!(gab.gabarito && gab.gabarito.length>0);
  return `
    <div style="display:flex; gap:22px; flex-wrap:wrap; margin:10px 0;">
      ${columns.map(col => `
        <div style="min-width:130px;">
          <div style="font-weight:700; font-size:.85rem; margin-bottom:6px;">${esc(col.label)}</div>
          ${col.qs.map(qn => {
            const marcada = (respostas||[])[qn-1] || null;
            const certa = temGabarito ? gab.gabarito[qn-1] : null;
            const acertou = temGabarito && marcada && certa && marcada===certa;
            const errou = temGabarito && marcada && certa && marcada!==certa;
            const cor = acertou ? '#1b7a3d' : (errou ? '#b3261e' : '#666');
            return `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:.88rem; padding:2px 0; border-bottom:1px dotted #ccc;">
              <span>Q${qn}</span>
              <span style="display:flex; align-items:center; gap:6px;">
                <strong style="color:${cor};">${marcada ? esc(marcada) : '<em style="color:#999; font-weight:400;">em branco</em>'}</strong>
                ${errou ? `<span class="muted" style="font-size:.78rem;">(certa: ${esc(certa)})</span>` : ''}
                ${acertou ? '<span style="font-size:.78rem;">✅</span>' : (errou ? '<span style="font-size:.78rem;">❌</span>' : '')}
              </span>
            </div>
          `; }).join('')}
        </div>
      `).join('')}
    </div>
    ${!temGabarito ? '<p class="muted" style="font-size:.8rem;">Este gabarito ainda não tem a resposta correta cadastrada, então não dá pra marcar acerto/erro — só mostra o que foi lançado.</p>' : ''}
  `;
}
function renderGabaritoGridSomenteLeitura(gab){
  const columns = gabaritoColunasPorDisciplina(gab.disciplinas, gab.numQuestoes);
  return `
    <div style="display:flex; gap:22px; flex-wrap:wrap; margin:10px 0;">
      ${columns.map(col => `
        <div style="min-width:110px;">
          <div style="font-weight:700; font-size:.85rem; margin-bottom:6px;">${esc(col.label)}</div>
          ${col.qs.map(qn => `
            <div style="display:flex; justify-content:space-between; gap:10px; font-size:.88rem; padding:2px 0; border-bottom:1px dotted #ccc;">
              <span>Q${qn}</span><strong>${esc(gab.gabarito && gab.gabarito[qn-1] ? gab.gabarito[qn-1] : '-')}</strong>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}
function renderDetalheAvulso(){
  const p = state.professor;
  const av = p.avulso;
  const gab = av.current;
  const turmas = state.professor.turmas;
  let scanSection = '';
  if(av.scanLoading){
    scanSection = `<div class="spinner"></div><p class="muted center">Processando ${av.scanQueue?'a página '+(av.scanQueue.index+1)+' de '+av.scanQueue.files.length:'a imagem'}...</p>`;
  } else if(av.scanReview){
    scanSection = renderAvulsoScanReview();
  } else {
    scanSection = `
      <p class="muted">Envie a foto do cartão-resposta preenchido pelo aluno (gerado em "Imprimir cartões-resposta" abaixo), com o QR code visível, a folha reta e bem iluminada. Você também pode escanear <strong>vários cartões de uma vez num único PDF</strong> (um cartão por página) — o sistema separa as páginas e mostra a revisão de cada aluno, uma de cada vez.</p>
      <input type="file" id="avulso-scan-file-input" accept="image/*,application/pdf" capture="environment">
      ${av.scanError ? `<p class="err">${esc(av.scanError)}</p>` : ''}
      ${av.scanQueue ? `<div class="row" style="margin-top:8px; align-items:center; gap:10px;"><span class="muted" style="font-size:.85rem;">Página ${av.scanQueue.index+1} de ${av.scanQueue.files.length} do PDF.</span><button class="btn btn-ghost btn-sm" data-action="avulso-scan-pular">Pular esta página →</button></div>` : ''}
    `;
  }
  const rows = (av.respostas||[]).slice().sort((a,b)=>(a.turmaName||'').localeCompare(b.turmaName||'')||a.studentName.localeCompare(b.studentName));
  const temGabarito = !!(gab.gabarito && gab.gabarito.length>0);
  const turmasAplicadas = gab.turmasAplicadas || [];
  const gabaritoSection = av.editandoGabarito ? `
      <p class="muted" style="font-size:.85rem;">Selecione a resposta certa de cada questão, organizada por disciplina.</p>
      ${renderGabaritoGridEditavel(gab, av.gabaritoEditAnswers, 'avulso-gabarito-edit-select')}
      ${av.gabaritoEditError ? `<p class="err">${esc(av.gabaritoEditError)}</p>` : ''}
      <div class="row" style="margin-top:10px;">
        <button class="btn btn-ghost" data-action="avulso-cancelar-gabarito">Cancelar</button>
        <button class="btn btn-primary" data-action="avulso-salvar-gabarito">Salvar gabarito correto</button>
      </div>
    ` : (temGabarito ? `
      ${renderGabaritoGridSomenteLeitura(gab)}
      <div class="row" style="margin-top:8px;">
        <button class="btn btn-ghost btn-sm" data-action="avulso-editar-gabarito">Editar gabarito correto</button>
        <button class="btn btn-ghost btn-sm" data-action="avulso-imprimir-gabarito">🖨️ Imprimir gabarito</button>
      </div>
    ` : `
      <p class="muted">Gabarito correto ainda não informado. Você já pode imprimir os cartões-resposta e aplicar a prova — só é preciso informar o gabarito antes de lançar as notas dos alunos.</p>
      <button class="btn btn-primary btn-sm" data-action="avulso-editar-gabarito">Informar gabarito correto</button>
    `);
  return `
    <div class="card">
      <button class="btn btn-ghost btn-sm" data-action="avulso-voltar-lista">← Voltar</button>
      <h2>${esc(gab.titulo)}</h2>
      <p class="muted">${gab.unidade?esc(gab.unidade)+' · ':''}${gab.dataProva?new Date(gab.dataProva+'T00:00:00').toLocaleDateString('pt-BR')+' · ':''}código <strong>${esc(gab.code)}</strong> · ${gab.numQuestoes} questões, ${gab.numAlternativas} alternativas</p>
      <p class="muted" style="font-size:.85rem;">${(gab.disciplinas||[]).map(d=>{
        const vinc = avulsoBlocoVinculos(d);
        const tag = vinc.length===0 ? '' : ' · <span style="color:#2b6f76;">🔗 '+vinc.map(v=>esc(v.professorName||'')+(v.turmaIds&&v.turmaIds.length?' ('+v.turmaIds.length+' turma(s))':'')).join(', ')+'</span>';
        return `${esc(d.nome)} (Q${d.inicio}–${d.fim})${tag}`;
      }).join(' · ')}</p>
      ${gab.instrumento ? `<p class="muted" style="font-size:.85rem; background:#eef6ff; padding:6px 10px; border-radius:6px;">✅ As notas de cada bloco vinculado a professor(a)+disciplina já entram automaticamente como <strong>${esc(instrumentoBaseTitle(gab.instrumento))}</strong> na ${esc(gab.unidade)}, no painel do(a) professor(a) correspondente. Só valem para alunos lançados com turma.</p>` : `<p class="muted" style="font-size:.85rem;">Este gabarito não está configurado para substituir nenhum instrumento avaliativo — as notas ficam só aqui.</p>`}
      <button class="btn btn-ghost btn-sm" data-action="avulso-editar-config" data-id="${gab.id}" style="margin-top:6px;">✏️ Editar configuração (instrumento/vínculo)</button>
      <p class="muted" style="font-size:.85rem;">${turmasAplicadas.length>0 ? 'Aplicado nas turmas: <strong>'+turmasAplicadas.map(t=>esc(t.turmaName)).join(', ')+'</strong>' : 'Ainda não há turma registrada para este gabarito — ela é registrada automaticamente ao imprimir os cartões por turma.'}</p>
    </div>

    <div class="card">
      <h3>Gabarito correto</h3>
      ${gabaritoSection}
    </div>

    <div class="card">
      <h3>Imprimir cartões-resposta</h3>
      <label>Selecione uma turma</label>
      <select id="avulso-imprimir-turma-select" class="input">
        <option value="">— selecionar turma —</option>
        ${turmas.map(t=>`<option value="${t.id}" ${av.imprimirTurmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}
      </select>
      <p class="muted center" style="margin:8px 0;">ou</p>
      <label>Digite os nomes dos alunos (um por linha)</label>
      <textarea id="avulso-imprimir-nomes-input" class="input" rows="4" placeholder="Nome do aluno 1&#10;Nome do aluno 2">${esc(av.imprimirNomesText)}</textarea>
      <div class="row" style="margin-top:10px;">
        <button class="btn btn-primary" data-action="avulso-imprimir-cartoes">🖨️ Imprimir cartões</button>
      </div>
    </div>

    <div class="card">
      <h3>Lançar respostas de um aluno</h3>
      <div class="row" style="margin-bottom:10px;">
        <button class="btn ${av.lancarModo==='manual'?'btn-primary':'btn-ghost'} btn-sm" data-action="avulso-lancar-modo" data-modo="manual">Digitar gabarito do aluno</button>
        <button class="btn ${av.lancarModo==='scan'?'btn-primary':'btn-ghost'} btn-sm" data-action="avulso-lancar-modo" data-modo="scan">Ler pelo celular</button>
      </div>
      ${av.lancarModo==='manual' ? (() => {
        const turmaSel = turmas.find(t=>t.id===av.lancarTurmaId);
        const alunosDaTurma = turmaSel ? turmaSel.students : [];
        return `
        <label>Turma</label>
        <select id="avulso-lancar-turma-select" class="input">
          <option value="">— selecione a turma —</option>
          ${turmas.map(t=>`<option value="${t.id}" ${av.lancarTurmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}
        </select>
        <label style="margin-top:8px;">Aluno</label>
        <select id="avulso-lancar-aluno-select" class="input" ${!av.lancarTurmaId?'disabled':''}>
          <option value="">— selecione o aluno —</option>
          ${alunosDaTurma.map(s=>`<option value="${s.id}" ${av.lancarStudentId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}
        </select>
        ${av.lancarTurmaId && alunosDaTurma.length===0 ? `<p class="muted" style="font-size:.82rem;">Essa turma não tem alunos cadastrados.</p>` : ''}
        ${av.lancarTurmaId && av.lancarStudentId ? `
          <label style="margin-top:8px;">Gabarito marcado pelo aluno</label>
          <p class="muted" style="font-size:.82rem; margin-top:-4px;">Toque na letra que o aluno marcou em cada questão.</p>
          ${renderGabaritoGridBolinhas(gab, av.lancarRespostas, 'avulso-lancar-resposta-bolinha')}
          <div class="row" style="margin-top:10px;">
            <button class="btn btn-primary" data-action="avulso-lancar-manual">Lançar nota</button>
          </div>
        ` : ''}
      `; })() : scanSection}
    </div>

    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">Notas lançadas (${rows.length})</h3>
        <button class="btn btn-ghost btn-sm" data-action="avulso-imprimir-lista">🖨️ Imprimir lista de notas</button>
      </div>
      ${rows.length===0 ? '<p class="muted center">Nenhuma nota lançada ainda.</p>' : `
        ${(av.selecionados||[]).length>0 ? `
        <div class="row" style="justify-content:space-between; align-items:center; background:var(--surface); padding:8px 10px; border-radius:6px; margin-top:8px;">
          <span style="font-size:.85rem;"><strong>${av.selecionados.length}</strong> aluno(s) selecionado(s)</span>
          <div class="row" style="gap:6px;">
            <button class="btn btn-ghost btn-sm" data-action="avulso-limpar-selecao">Limpar seleção</button>
            <button class="btn btn-primary btn-sm" data-action="avulso-abrir-transferir-selecionados">🔀 Transferir selecionados</button>
          </div>
        </div>
        ` : ''}
        ${av.transferBulk ? `
        <div class="card" style="background:var(--surface); margin:8px 0; padding:10px;">
          <label style="font-size:.8rem;">Transferir a resposta de <strong>${av.selecionados.length} aluno(s)</strong> (${av.selecionados.map(esc).join(', ')}) pra qual gabarito avulso (a prova certa)?</label>
          <select id="avulso-transfer-target-select" class="input">
            <option value="">Selecione o gabarito correto...</option>
            ${(p.avulso.list||[]).filter(x=>x.code!==gab.code).map(x => `<option value="${x.code}" ${av.transferTargetCode===x.code?'selected':''}>${esc(x.titulo||'Gabarito Avulso')} · ${x.numQuestoes} questões (${x.code})</option>`).join('')}
          </select>
          ${av.transferError ? `<p class="err" style="font-size:.82rem;">${esc(av.transferError)}</p>` : ''}
          <div class="row" style="margin-top:8px;">
            <button class="btn btn-ghost btn-sm" data-action="avulso-cancelar-transferir-resposta">Cancelar</button>
            <button class="btn btn-primary btn-sm" data-action="avulso-confirmar-transferir-resposta">Confirmar transferência</button>
          </div>
        </div>
        ` : ''}
        <div class="table-scroll">
        <table class="pv-sign-table" style="margin-top:8px;">
          <thead><tr><th style="width:26px;"><input type="checkbox" data-action="avulso-toggle-selecionar-todos" ${rows.length>0 && rows.every(r=>(av.selecionados||[]).includes(r.studentName))?'checked':''}></th><th>Aluno</th><th>Turma</th>${(gab.disciplinas||[]).map(d=>`<th style="text-align:center;">${esc(d.nome)}</th>`).join('')}<th style="text-align:center;">Média</th><th></th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td><input type="checkbox" data-action="avulso-toggle-selecionado" data-name="${esc(r.studentName)}" ${(av.selecionados||[]).includes(r.studentName)?'checked':''}></td>
                <td>${esc(r.studentName)}${r.scanned?' <span class="muted" style="font-size:.75rem;">(leitura)</span>':''}${r.transferidoDe?'<br><span class="muted" style="font-size:.72rem;">↪ transferido de outro gabarito</span>':''}</td>
                <td>${esc(r.turmaName||'-')}</td>
                ${(gab.disciplinas||[]).map(d => { const dd=(r.porDisciplina||[]).find(x=>x.disciplinaId===d.id); return `<td style="text-align:center;">${dd?dd.nota.toFixed(1)+' ('+dd.acertos+'/'+dd.total+')':'-'}</td>`; }).join('')}
                <td style="text-align:center; font-weight:700;">${(r.mediaDisciplinas!==undefined?r.mediaDisciplinas:r.notaGeral).toFixed(1)}</td>
                <td class="row" style="flex-wrap:nowrap; gap:4px;">
                  <button class="btn btn-ghost btn-sm" data-action="avulso-ver-resposta-aluno" data-name="${esc(r.studentName)}" title="Ver o que o aluno marcou">👁️</button>
                  <button class="btn btn-ghost btn-sm" data-action="avulso-abrir-transferir-resposta" data-name="${esc(r.studentName)}">🔀</button>
                  <button class="btn btn-ghost btn-sm" data-action="avulso-excluir-resposta" data-name="${esc(r.studentName)}">✕</button>
                </td>
              </tr>
              ${av.verRespostaAlunoName===r.studentName ? `
              <tr><td colspan="${4+(gab.disciplinas||[]).length}" style="padding:0;">
                <div class="card" style="background:var(--surface); margin:6px 0; padding:10px;">
                  <div class="row" style="justify-content:space-between; align-items:center;">
                    <label style="font-size:.8rem; margin:0;">Gabarito marcado por <strong>${esc(r.studentName)}</strong>${r.scanned?' (lido por foto)':' (digitado)'}${r.transferidoDe?' · transferido de outro gabarito':''}</label>
                    <button class="btn btn-ghost btn-sm" data-action="avulso-ver-resposta-aluno" data-name="${esc(r.studentName)}">Fechar</button>
                  </div>
                  ${av.editandoRespostaAlunoName===r.studentName ? `
                    <p class="muted" style="font-size:.82rem; margin-top:6px;">Toque na letra certa pra corrigir o que foi lançado. A nota é recalculada ao salvar.</p>
                    ${renderGabaritoGridBolinhas(gab, av.editRespostaAlunoAnswers, 'avulso-resposta-aluno-bolinha')}
                    <div class="row" style="margin-top:8px;">
                      <button class="btn btn-ghost btn-sm" data-action="avulso-cancelar-editar-resposta-aluno">Cancelar</button>
                      <button class="btn btn-primary btn-sm" data-action="avulso-salvar-resposta-aluno">Salvar correção</button>
                    </div>
                  ` : `
                    ${renderGabaritoGridRespostaAluno(gab, r.respostas)}
                    <button class="btn btn-ghost btn-sm" data-action="avulso-editar-resposta-aluno" data-name="${esc(r.studentName)}">✏️ Editar respostas lançadas</button>
                  `}
                </div>
              </td></tr>
              ` : ''}
              ${av.transferRespName===r.studentName ? `
              <tr><td colspan="${4+(gab.disciplinas||[]).length}" style="padding:0;">
                <div class="card" style="background:var(--surface); margin:6px 0; padding:10px;">
                  <label style="font-size:.8rem;">Transferir a resposta de <strong>${esc(r.studentName)}</strong> pra qual gabarito avulso (a prova certa)?</label>
                  <select id="avulso-transfer-target-select" class="input">
                    <option value="">Selecione o gabarito correto...</option>
                    ${(p.avulso.list||[]).filter(x=>x.code!==gab.code).map(x => `<option value="${x.code}" ${av.transferTargetCode===x.code?'selected':''}>${esc(x.titulo||'Gabarito Avulso')} · ${x.numQuestoes} questões (${x.code})</option>`).join('')}
                  </select>
                  ${av.transferError ? `<p class="err" style="font-size:.82rem;">${esc(av.transferError)}</p>` : ''}
                  <div class="row" style="margin-top:8px;">
                    <button class="btn btn-ghost btn-sm" data-action="avulso-cancelar-transferir-resposta">Cancelar</button>
                    <button class="btn btn-primary btn-sm" data-action="avulso-confirmar-transferir-resposta">Confirmar transferência</button>
                  </div>
                </div>
              </td></tr>
              ` : ''}
            `).join('')}
          </tbody>
        </table>
        </div>
      `}
    </div>
  `;
}
function renderPesos(){
  const p = state.professor;
  if(p.pesosLoading){
    return `<div class="card"><h2>Pesos das notas</h2><div class="spinner"></div></div>`;
  }
  const d = p.pesosDraft || p.pesos;
  const total = (Number(d.avaliacao)||0) + (Number(d.diagnostica)||0) + (Number(d.exercicios)||0) + (Number(d.autoavaliacao)||0);
  return `
    <div class="card">
      <h2>Pesos dos instrumentos avaliativos</h2>
      <p class="muted">Defina quanto vale cada instrumento na composição da nota do bimestre. A Nota Parcial 1 é a Avaliação Mensal/Bimestral; a Nota Parcial 2 soma Avaliação Diagnóstica, Exercícios de Fixação e Autoavaliação.</p>
      <label>Nota Parcial 1 — Avaliação Mensal/Bimestral (Simulado/Avaliação)</label>
      <input type="number" min="0" step="0.5" id="peso-avaliacao-input" value="${d.avaliacao}">
      <h3 style="margin-top:18px;">Nota Parcial 2</h3>
      <label>Avaliação Diagnóstica</label>
      <input type="number" min="0" step="0.5" id="peso-diagnostica-input" value="${d.diagnostica}">
      <label>Exercícios de Fixação <span class="muted" style="text-transform:none; font-weight:400;">(soma de todos os exercícios do bimestre, limitada a este valor)</span></label>
      <input type="number" min="0" step="0.5" id="peso-exercicios-input" value="${d.exercicios}">
      <label>Autoavaliação <span class="muted" style="text-transform:none; font-weight:400;">(calculada automaticamente: 40% fichas + 30% frequência de login + 30% entrega de exercícios, cada uma comparada à média/ao melhor da turma)</span></label>
      <input type="number" min="0" step="0.5" id="peso-autoavaliacao-input" value="${d.autoavaliacao}">
      <p style="margin-top:16px;"><strong>Total: ${total} ponto(s)</strong></p>
      <button class="btn btn-primary" data-action="save-pesos" style="margin-top:8px;">Salvar pesos</button>

      <h3 style="margin-top:26px;">Segurança da prova (tela cheia)</h3>
      <p class="muted">A prova do aluno sempre abre em tela cheia. Se ele sair da tela cheia durante a prova, ela trava. A liberação pode ser feita de duas formas: pelo professor no painel "Liberações", de qualquer dispositivo, ou digitando este PIN direto na tela do aluno.</p>
      <label>PIN de liberação</label>
      ${p.pin ? '' : '<p class="err" data-pin-faltando>⚠️ O PIN ainda não foi definido: enquanto isso, a liberação só funciona pelo painel "Liberações".</p>'}
      <input type="password" id="pin-liberacao-input" inputmode="numeric" maxlength="6" value="${esc(p.pin)}" placeholder="4 a 6 números" autocomplete="off" style="max-width:160px;">
      <button class="btn btn-primary btn-sm" data-action="save-pin" style="margin-top:10px;">Salvar PIN</button>
    </div>
  `;
}
function buildAvulsoCartaoPage(gab, studentName, turmaName, turmaId){
  const L = AVULSO_LAYOUT;
  const n = gab.numQuestoes;
  const half = Math.ceil(n/2);
  const letters = OPT_LETTERS.slice(0, gab.numAlternativas);
  const deepLink = `${location.origin}${location.pathname}?avulso_code=${encodeURIComponent(gab.code)}&avulso_student=${encodeURIComponent(studentName)}&avulso_turma=${encodeURIComponent(turmaName||'')}&avulso_turmaid=${encodeURIComponent(turmaId||'')}&avulso_data=${encodeURIComponent(gab.dataProva||'')}&avulso_unidade=${encodeURIComponent(gab.unidade||'')}`;
  const qrDataUrl = generateQrDataUrl(deepLink, 200);
  let rowsHtml = '';
  for(let i=0;i<n;i++){
    const col = i < half ? 0 : 1;
    const row = col===0 ? i : i-half;
    const rowY = L.gridStartY + row*L.rowHeight;
    const colX = col===1 ? L.colWidth : 0;
    rowsHtml += `<div class="omr-qnum" style="top:${rowY}mm; left:${colX}mm;">${String(i+1).padStart(2,'0')}</div>`;
    rowsHtml += letters.map((letter,j) => {
      const bx = colX + L.numLabelWidth + j*L.bubbleSpacing;
      return `<div class="omr-bubble" style="left:${bx}mm; top:${rowY}mm; width:${L.bubbleSize}mm; height:${L.bubbleSize}mm;">${letter}</div>`;
    }).join('');
  }
  const blockHeight = L.gridStartY + Math.max(half,1)*L.rowHeight + 6;
  const disciplinasLine = (gab.disciplinas||[]).map(d=>`${esc(d.nome)} (Q${d.inicio}-${d.fim})`).join(' · ');
  return `
    <div class="pv-page">
      ${buildPrintHeader({ title: gab.titulo || 'Gabarito Avulso', subtitle: turmaName })}
      <div class="omr-block">
        <div class="omr-wrap" style="min-height:${blockHeight}mm;">
          ${qrDataUrl ? `<img class="omr-qr" src="${qrDataUrl}" alt="QR code" style="width:${L.qrSize}mm; height:${L.qrSize}mm;">` : ''}
          <div class="omr-header-text">
            <strong>${esc(gab.titulo || 'Gabarito Avulso')}</strong><br>
            ${gab.unidade?esc(gab.unidade)+' · ':''}${gab.dataProva?new Date(gab.dataProva+'T00:00:00').toLocaleDateString('pt-BR'):''}<br>
            código ${esc(gab.code)}<br>
            <strong>Aluno:</strong> ${esc(studentName)}<br>
            <strong>Turma:</strong> ${esc(turmaName||'')}
          </div>
          <div class="omr-note">Preencha completamente o círculo correspondente à resposta escolhida.${disciplinasLine ? ' Disciplinas: '+esc(disciplinasLine) : ''}</div>
          ${rowsHtml}
        </div>
      </div>
    </div>
  `;
}
async function loadAvulsos(){
  const p = state.professor;
  p.avulso.listLoading = true;
  try{ const r = await window.storage.get('gabaritos-avulsos', true); p.avulso.list = JSON.parse(r.value); }
  catch(e){ p.avulso.list = []; }
  p.avulso.listLoading = false;
  render();
}
async function saveAvulsosToStorage(){
  await window.storage.set('gabaritos-avulsos', JSON.stringify(state.professor.avulso.list), true);
}
async function findAvulsoByCode(code){
  const p = state.professor;
  let g = (p.avulso.list||[]).find(x=>x.code===code);
  if(g) return g;
  try{
    const r = await window.storage.get('gabaritos-avulsos', true);
    const list = JSON.parse(r.value);
    p.avulso.list = list;
    return list.find(x=>x.code===code) || null;
  }catch(e){ return null; }
}
function novoAvulsoDraft(){
  return { titulo:'', unidade:'', instrumento:'', dataProva:'', numQuestoes:50, numAlternativas:5, disciplinas:[{id:cryptoId(), nome:'', inicio:1, fim:50, vinculos:[{id:cryptoId(), professorId:'', disciplinaId:'', turmaIds:[]}]}] };
}
function abrirNovoAvulso(){
  const p = state.professor;
  p.avulso.mode = 'novo';
  p.avulso.form = novoAvulsoDraft();
  ensureAvulsoProfessoresCache();
  render();
}
function avulsoAbrirImportarPlanilha(){
  const p = state.professor;
  p.avulso.mode = 'importar';
  p.avulso.importPlanilha = { processando:false, erro:'', resultado:null, nomeArquivo:'', importando:false };
  render();
}
function avulsoCancelarImportarPlanilha(){
  const p = state.professor;
  p.avulso.mode = 'list';
  p.avulso.importPlanilha = { processando:false, erro:'', resultado:null, nomeArquivo:'', importando:false };
  render();
}
function lerPlanilhaComoLinhas(file){
  return new Promise((resolve, reject) => {
    const isCsv = /\.csv$/i.test(file.name) || file.type==='text/csv';
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    if(isCsv){
      reader.onload = () => {
        const texto = String(reader.result||'').replace(/^﻿/, '').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
        const linhasTexto = texto.split('\n').filter(l=>l.trim()!=='');
        if(linhasTexto.length===0){ resolve([]); return; }
        const delim = detectDelimiterCsv(linhasTexto[0]);
        resolve(linhasTexto.map(l => l.split(delim).map(c=>c.trim().replace(/^"|"$/g,''))));
      };
      reader.readAsText(file, 'utf-8');
    } else {
      reader.onload = () => {
        try{
          const wb = XLSX.read(reader.result, { type:'binary' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header:1, raw:false, defval:'' });
          resolve(rows.map(row => row.map(c => (c===null||c===undefined)?'':String(c).trim())));
        }catch(e){ reject(e); }
      };
      reader.readAsBinaryString(file);
    }
  });
}
function avulsoMatchAlunoTurma(nomeAluno, turmaTexto){
  const turmas = state.professor.turmas || [];
  const nomeNorm = normalizeTexto(nomeAluno);
  if(turmaTexto){
    const turmaNorm = normalizeTexto(turmaTexto);
    const turmaMatch = turmas.find(t => normalizeTexto(t.name)===turmaNorm);
    if(turmaMatch) return { turmaId: turmaMatch.id, turmaName: turmaMatch.name };
  }
  const encontrados = turmas.filter(t => (t.students||[]).some(s=>normalizeTexto(s.name)===nomeNorm));
  if(encontrados.length===1) return { turmaId: encontrados[0].id, turmaName: encontrados[0].name };
  return { turmaId:'', turmaName: turmaTexto||'' };
}
function detectarNumAlternativasPlanilha(itens){
  let maxIdx = 3; // mínimo 4 alternativas (A–D)
  itens.forEach(it => (it.respostas||[]).forEach(r => {
    const idx = OPT_LETTERS.indexOf(r);
    if(idx > maxIdx) maxIdx = idx;
  }));
  return Math.min(maxIdx+1, OPT_LETTERS.length);
}
function parseRespostasPlanilha(rows){
  if(!rows || rows.length<2) return { erro: 'O arquivo parece vazio ou não tem linhas de dados.' };
  const header = rows[0].map(h=>String(h||'').trim());
  const headerNorm = header.map(h=>normalizeTexto(h));
  const idxAluno = headerNorm.findIndex(h=>h==='ALUNO' || h==='NOME' || h==='ESTUDANTE');
  const idxTurma = headerNorm.findIndex(h=>h==='TURMA');
  const idxProva = headerNorm.findIndex(h=>/PROVA|GABARITO|DIA/.test(h));
  if(idxAluno===-1) return { erro: 'Não encontrei uma coluna "Aluno" (ou "Nome") no cabeçalho do arquivo.' };
  if(idxProva===-1) return { erro: 'Não encontrei uma coluna indicando a prova de cada linha (ex: "Prova", "Gabarito" ou "Dia") — preciso dela pra separar as provas diferentes.' };
  const colunasQuestao = [];
  header.forEach((h, idx) => {
    if(idx===idxAluno || idx===idxTurma || idx===idxProva) return;
    const m = h.match(/^Q\s*0*([0-9]+)$/i) || h.match(/^QUEST(?:AO|ÃO)?\s*0*([0-9]+)$/i) || h.match(/^0*([0-9]+)$/);
    if(!m) return;
    colunasQuestao.push({ idx, qn: parseInt(m[1],10) });
  });
  if(colunasQuestao.length===0) return { erro: 'Não encontrei colunas de questão no cabeçalho (esperava algo como "Q1", "Q2", "Questão 1"...).' };
  colunasQuestao.sort((a,b)=>a.qn-b.qn);
  const numQuestoesTotal = colunasQuestao[colunasQuestao.length-1].qn;

  const dataLines = rows.slice(1).filter(row => row.some(c => String(c||'').trim()!==''));
  const porProva = {};
  dataLines.forEach(cols => {
    const nomeAluno = String(cols[idxAluno]||'').trim();
    if(!nomeAluno) return;
    const turmaTexto = idxTurma!==-1 ? String(cols[idxTurma]||'').trim() : '';
    const provaTexto = String(cols[idxProva]||'').trim() || 'Prova sem nome';
    const respostas = new Array(numQuestoesTotal).fill('');
    colunasQuestao.forEach(cq => {
      const v = String(cols[cq.idx]||'').trim().toUpperCase();
      if(v) respostas[cq.qn-1] = v;
    });
    const chave = normalizeTexto(provaTexto);
    if(!porProva[chave]) porProva[chave] = { provaTitulo: provaTexto, itens: [] };
    porProva[chave].itens.push({ nomeAluno, turmaTexto, respostas });
  });
  return { grupos: Object.values(porProva), numQuestoesTotal };
}
async function processarArquivoRespostasAvulso(file){
  const p = state.professor;
  p.avulso.importPlanilha = { processando:true, erro:'', resultado:null, nomeArquivo:file.name, importando:false };
  render();
  let rows;
  try{ rows = await lerPlanilhaComoLinhas(file); }
  catch(e){ p.avulso.importPlanilha = { processando:false, erro:'Não foi possível ler esse arquivo. Confira se é um .csv ou .xlsx válido.', resultado:null, nomeArquivo:file.name, importando:false }; render(); return; }
  const parsed = parseRespostasPlanilha(rows);
  if(parsed.erro){
    p.avulso.importPlanilha = { processando:false, erro:parsed.erro, resultado:null, nomeArquivo:file.name, importando:false };
    render();
    return;
  }
  const grupos = parsed.grupos.map(g => {
    let maxQnComResposta = 0;
    g.itens.forEach(it => it.respostas.forEach((r, i) => { if(r) maxQnComResposta = Math.max(maxQnComResposta, i+1); }));
    const numQuestoes = maxQnComResposta>0 ? maxQnComResposta : parsed.numQuestoesTotal;
    const itensResolvidos = g.itens.map(it => {
      const m = avulsoMatchAlunoTurma(it.nomeAluno, it.turmaTexto);
      return { studentName: it.nomeAluno, turmaId: m.turmaId, turmaName: m.turmaName, respostas: it.respostas.slice(0, numQuestoes) };
    });
    const turmasEnvolvidas = [];
    const turmaIdsVistos = new Set();
    itensResolvidos.forEach(it => { if(it.turmaId && !turmaIdsVistos.has(it.turmaId)){ turmaIdsVistos.add(it.turmaId); turmasEnvolvidas.push({ turmaId: it.turmaId, turmaName: it.turmaName }); } });
    return {
      tituloEdit: g.provaTitulo,
      numQuestoes,
      numAlternativas: detectarNumAlternativasPlanilha(itensResolvidos),
      itens: itensResolvidos,
      turmasEnvolvidas: turmasEnvolvidas.map(t=>t.turmaName),
      turmasEnvolvidasObj: turmasEnvolvidas,
      semTurma: itensResolvidos.filter(i=>!i.turmaId).length,
      jaExisteGabaritoComMesmoTitulo: (p.avulso.list||[]).some(x => normalizeDisciplinaName(x.titulo)===normalizeDisciplinaName(g.provaTitulo))
    };
  });
  p.avulso.importPlanilha = { processando:false, erro:'', resultado:{ grupos }, nomeArquivo:file.name, importando:false };
  render();
}
async function confirmarImportarRespostasAvulso(){
  const p = state.professor;
  const resultado = p.avulso.importPlanilha.resultado;
  if(!resultado) return;
  p.avulso.importPlanilha.importando = true;
  render();
  let totalGabaritosCriados = 0, totalRespostasGravadas = 0;
  for(const g of resultado.grupos){
    if(g.itens.length===0) continue;
    const discGeral = { id: cryptoId(), nome:'Geral', inicio:1, fim:g.numQuestoes, vinculos:[] };
    const gab = {
      id: cryptoId(), code: genCode(), titulo: (g.tituloEdit||'').trim() || 'Prova Importada',
      unidade:'', instrumento:'', dataProva:'',
      numQuestoes: g.numQuestoes, numAlternativas: g.numAlternativas,
      gabarito: null,
      disciplinas: [discGeral],
      turmasAplicadas: (g.turmasEnvolvidasObj||[]).map(t => ({ turmaId: t.turmaId, turmaName: t.turmaName, appliedAt: Date.now() }))
    };
    p.avulso.list.push(gab);
    totalGabaritosCriados++;
    const registros = g.itens.map(it => ({
      studentName: it.studentName, turmaId: it.turmaId||'', turmaName: it.turmaName||'',
      submittedAt: Date.now(), respostas: it.respostas,
      porDisciplina: [{ disciplinaId: discGeral.id, nome: discGeral.nome, acertos:0, total: g.numQuestoes, nota:0 }],
      acertosTotal:0, notaGeral:0, mediaDisciplinas:0,
      scanned:false, importadoPlanilha:true
    }));
    await window.storage.set(`avulso-respostas:${gab.code}`, JSON.stringify(registros), true);
    totalRespostasGravadas += registros.length;
  }
  await saveAvulsosToStorage();
  p.avulso.importPlanilha = { processando:false, erro:'', resultado:null, nomeArquivo:'', importando:false };
  p.avulso.mode = 'list';
  render();
  alert(`Importação concluída! ${totalGabaritosCriados} gabarito(s) avulso(s) criado(s), com ${totalRespostasGravadas} resposta(s) lançada(s) no total.\n\nAs notas ainda aparecem zeradas — abra cada gabarito importado e informe o "Gabarito correto" pra calcular as notas automaticamente.`);
}
function abrirEditarMetaAvulso(id){
  const p = state.professor;
  const gab = p.avulso.list.find(x=>x.id===id);
  if(!gab) return;
  p.avulso.mode = 'novo';
  p.avulso.form = {
    titulo: gab.titulo || '', unidade: gab.unidade || '', instrumento: gab.instrumento || '', dataProva: gab.dataProva || '',
    numQuestoes: gab.numQuestoes, numAlternativas: gab.numAlternativas,
    disciplinas: (gab.disciplinas||[]).map(d => ({ id:d.id, nome:d.nome, inicio:d.inicio, fim:d.fim,
      vinculos: avulsoBlocoVinculos(d).map(v => ({ id:v.id, professorId:v.professorId||'', disciplinaId:v.disciplinaId||'', turmaIds: (v.turmaIds||[]).slice() })) })),
    editingGabaritoId: gab.id
  };
  ensureAvulsoProfessoresCache();
  render();
}
function cancelarEdicaoAvulso(){
  const p = state.professor;
  p.avulso.mode = 'detalhe';
  p.avulso.form = null;
  render();
}
async function salvarEdicaoAvulso(){
  const p = state.professor;
  const f = p.avulso.form;
  const gabOriginal = p.avulso.list.find(x=>x.id===f.editingGabaritoId);
  const errEl = document.getElementById('avulso-err');
  const setErr = (msg) => { if(errEl) errEl.innerHTML = `<p class="err">${esc(msg)}</p>`; };
  if(!gabOriginal){ setErr('Este gabarito não foi encontrado.'); return; }
  const n = parseInt(f.numQuestoes);
  if(!n || n<1 || n>150){ setErr('Informe uma quantidade válida de questões (1 a 150).'); return; }
  const numAlt = parseInt(f.numAlternativas);
  if(!numAlt || numAlt<2 || numAlt>6){ setErr('Informe de 2 a 6 alternativas por questão.'); return; }
  if(!f.disciplinas || f.disciplinas.length===0){ setErr('Adicione ao menos uma disciplina.'); return; }
  for(const d of f.disciplinas){
    if(!d.nome || !d.nome.trim()){ setErr('Preencha o nome de todas as disciplinas.'); return; }
    const ini = parseInt(d.inicio), fim = parseInt(d.fim);
    if(!ini || !fim || ini<1 || fim>n || ini>fim){ setErr(`Intervalo de questões inválido para "${d.nome}" (deve estar entre 1 e ${n}).`); return; }
  }
  if(f.instrumento && !f.unidade){ setErr('Para substituir um instrumento avaliativo, selecione a unidade.'); return; }
  const disciplinasAtualizadas = construirDisciplinasComVinculos(f, setErr);
  if(!disciplinasAtualizadas) return;
  const faixasMudaram = disciplinasAtualizadas.some(dNovo => {
    const dOriginal = gabOriginal.disciplinas.find(x=>x.id===dNovo.id);
    return !dOriginal || dOriginal.inicio!==dNovo.inicio || dOriginal.fim!==dNovo.fim;
  }) || disciplinasAtualizadas.length!==gabOriginal.disciplinas.length;
  // Mudar a quantidade de questões ou de alternativas invalida o gabarito correto que já estivesse
  // informado (o tamanho não bate mais) — em vez de deixar notas erradas na tela, zera o gabarito
  // correto e as notas já lançadas, pra forçar reinformar antes de confiar em qualquer nota de novo.
  const contagemMudou = n!==gabOriginal.numQuestoes || numAlt!==gabOriginal.numAlternativas;
  const gabAtualizado = {
    ...gabOriginal,
    titulo: (f.titulo||'').trim() || 'Gabarito Avulso',
    unidade: (f.unidade||'').trim(), instrumento: f.instrumento || '', dataProva: f.dataProva || '',
    numQuestoes: n, numAlternativas: numAlt,
    disciplinas: disciplinasAtualizadas,
    gabarito: contagemMudou ? null : gabOriginal.gabarito
  };
  // Limpa a avaliação sintética de qualquer vínculo que existia antes e deixou de existir
  // (removido, professor trocado, ou instrumento retirado por completo), pra não deixar nota
  // fantasma no painel de ninguém.
  for(const dOriginal of gabOriginal.disciplinas){
    const vinculosAntigos = gabOriginal.instrumento ? avulsoBlocoVinculos(dOriginal) : [];
    const novo = disciplinasAtualizadas.find(x=>x.id===dOriginal.id);
    const vinculosNovosIds = new Set(gabAtualizado.instrumento && novo ? novo.vinculos.map(v=>v.id) : []);
    for(const vAntigo of vinculosAntigos){
      if(!vinculosNovosIds.has(vAntigo.id)) await cleanupAvulsoVinculo(gabAtualizado.code, vAntigo.id, dOriginal.id);
    }
  }
  const idx = p.avulso.list.findIndex(x=>x.id===gabAtualizado.id);
  if(idx>=0) p.avulso.list[idx] = gabAtualizado;
  await saveAvulsosToStorage();
  // Se o intervalo de questões de alguma disciplina mudou e já existem respostas lançadas,
  // recalcula a nota por disciplina de cada aluno com o novo intervalo antes de sincronizar
  // com o painel do(a) professor(a) — senão a nota que aparece lá ficaria desatualizada.
  // Quando a quantidade de questões/alternativas mudou, o gabarito correto foi zerado acima —
  // aqui as respostas já lançadas também voltam a ficar zeradas (sem gabarito não tem como
  // saber o que está certo), até alguém informar o gabarito correto de novo.
  if(faixasMudaram || contagemMudou){
    let respostasExistentes = [];
    try{ const r = await window.storage.get(`avulso-respostas:${gabAtualizado.code}`, true); respostasExistentes = JSON.parse(r.value) || []; }catch(e){ respostasExistentes = []; }
    if(respostasExistentes.length>0){
      const recalculadas = respostasExistentes.map(r => {
        let respostasArr = r.respostas || [];
        if(contagemMudou){
          respostasArr = respostasArr.slice(0, n);
          while(respostasArr.length<n) respostasArr.push('');
        }
        if(gabAtualizado.gabarito){
          return { ...r, respostas: respostasArr, ...gradeAvulsoRespostas(gabAtualizado, respostasArr) };
        }
        // Ainda não tem gabarito correto informado — mantém a nota zerada, só com a estrutura de
        // disciplinas (e o tamanho das respostas) já batendo com a configuração nova.
        return { ...r, respostas: respostasArr,
          porDisciplina: gabAtualizado.disciplinas.map(d=>({ disciplinaId:d.id, nome:d.nome, acertos:0, total: Math.max(0,d.fim-d.inicio+1), nota:0 })),
          acertosTotal:0, notaGeral:0, mediaDisciplinas:0 };
      });
      await window.storage.set(`avulso-respostas:${gabAtualizado.code}`, JSON.stringify(recalculadas), true);
      if(p.avulso.current && p.avulso.current.code===gabAtualizado.code) p.avulso.respostas = recalculadas;
    }
  }
  await syncAvulsoInstrumento(gabAtualizado);
  p.avulso.mode = 'detalhe';
  p.avulso.current = gabAtualizado;
  p.avulso.form = null;
  render();
  const msg = contagemMudou
    ? 'Configuração do gabarito atualizada. Como a quantidade de questões ou alternativas mudou, o gabarito correto foi zerado (e as notas já lançadas também) — informe o gabarito correto de novo em "Gabarito correto" antes de confiar nas notas.'
    : (faixasMudaram ? 'Configuração do gabarito atualizada. As notas por disciplina já lançadas foram recalculadas com o novo intervalo de questões.' : 'Configuração do gabarito atualizada.');
  alert(msg);
}
async function cleanupAvulsoVinculo(code, vinculoId, blockId){
  const all = [...state.professor.assessments, ...state.coordenador.assessments];
  let a = all.find(x => x.importadoAvulso && x.avulsoCode===code && x.avulsoVinculoId===vinculoId);
  if(!a && vinculoId && vinculoId.endsWith('-legacy')){
    a = all.find(x => x.importadoAvulso && x.avulsoCode===code && x.avulsoDisciplinaBlockId===blockId && !x.avulsoVinculoId);
  }
  if(!a) return;
  try{ await window.storage.delete(`assessment:${a.code}`, true); }catch(e){}
  try{ await window.storage.delete(`responses:${a.code}`, true); }catch(e){}
  state.professor.assessments = state.professor.assessments.filter(x=>x.code!==a.code);
  state.coordenador.assessments = state.coordenador.assessments.filter(x=>x.code!==a.code);
}
function avulsoAddDisciplina(){
  const p = state.professor;
  p.avulso.form.disciplinas.push({ id:cryptoId(), nome:'', inicio:1, fim:p.avulso.form.numQuestoes||1, vinculos:[{id:cryptoId(), professorId:'', disciplinaId:'', turmaIds:[]}] });
  render();
}
function avulsoBlocoVinculos(d){
  if(Array.isArray(d.vinculos)) return d.vinculos;
  if(d.professorId && d.disciplinaId){
    return [{ id: d.id+'-legacy', professorId:d.professorId, disciplinaId:d.disciplinaId, professorName:d.professorName||'', disciplinaName:d.disciplinaName||'', turmaIds:[] }];
  }
  return [];
}
function construirDisciplinasComVinculos(f, setErr){
  const profCache = state.professor.avulso.professoresCache || [];
  const resultado = [];
  for(const d of f.disciplinas){
    const vinculosComProfessor = (d.vinculos||[]).filter(v=>v.professorId);
    if(vinculosComProfessor.length>1){
      const usadas = new Set();
      for(const v of vinculosComProfessor){
        if(!v.turmaIds || v.turmaIds.length===0){ setErr(`Em "${d.nome||'disciplina'}", selecione as turmas de cada vínculo — como há mais de um professor(a), é preciso dizer quais turmas são de cada um(a).`); return null; }
        for(const tid of v.turmaIds){
          if(usadas.has(tid)){ setErr(`Em "${d.nome||'disciplina'}", uma mesma turma não pode estar marcada em mais de um vínculo.`); return null; }
          usadas.add(tid);
        }
      }
    }
    const vinculosResolvidos = [];
    for(const v of (d.vinculos||[])){
      // vínculo em branco (nenhum professor escolhido ainda) — ignora silenciosamente, não é erro.
      if(!v.professorId && !v.disciplinaId) continue;
      const prof = profCache.find(pr=>pr.id===v.professorId);
      if(!v.professorId || !prof){ setErr(`Em "${d.nome||'disciplina'}", há um vínculo sem professor(a) selecionado(a) (ou o professor não está mais ativo). Selecione o(a) professor(a) ou remova esse vínculo antes de salvar.`); return null; }
      const disc = (prof.disciplinas||[]).find(x=>x.id===v.disciplinaId);
      if(!disc){ setErr(`Em "${d.nome||'disciplina'}", falta escolher a disciplina de ${prof.name} no segundo campo do vínculo — sem isso, essa disciplina não aparece no painel do professor(a). Selecione a disciplina antes de salvar.`); return null; }
      vinculosResolvidos.push({ id:v.id, professorId:v.professorId, professorName:prof.name, disciplinaId:v.disciplinaId, disciplinaName:disc.name, turmaIds:(v.turmaIds||[]).slice() });
    }
    resultado.push({ id:d.id, nome:d.nome.trim(), inicio:parseInt(d.inicio), fim:parseInt(d.fim), vinculos: vinculosResolvidos });
  }
  // Se este gabarito está configurado pra substituir um instrumento avaliativo, mas NENHUMA
  // disciplina tem vínculo com professor(a), salvar assim não tem efeito nenhum: a nota fica só
  // aqui no gabarito avulso e nunca aparece no painel de ninguém. Avisa antes de deixar salvar
  // dessa forma, em vez de deixar passar silenciosamente (foi exatamente isso que gerou confusão).
  if(f.instrumento && resultado.every(d => d.vinculos.length===0)){
    setErr('Este gabarito está configurado pra substituir um instrumento avaliativo, mas nenhuma disciplina tem professor(a) vinculado(a) — assim a nota não vai aparecer no painel de ninguém. Adicione o vínculo (professor + disciplina) em pelo menos uma disciplina, ou remova a substituição de instrumento acima.');
    return null;
  }
  return resultado;
}
function avulsoVinculoAdicionar(blockId){
  const p = state.professor;
  const d = (p.avulso.form.disciplinas||[]).find(x=>x.id===blockId);
  if(!d) return;
  if(!Array.isArray(d.vinculos)) d.vinculos = avulsoBlocoVinculos(d);
  d.vinculos.push({ id:cryptoId(), professorId:'', disciplinaId:'', turmaIds:[] });
  render();
}
function avulsoVinculoRemover(blockId, vinculoId){
  const p = state.professor;
  const d = (p.avulso.form.disciplinas||[]).find(x=>x.id===blockId);
  if(!d) return;
  d.vinculos = (d.vinculos||[]).filter(v=>v.id!==vinculoId);
  render();
}
function avulsoVinculoSetProfessor(blockId, vinculoId, professorId){
  const p = state.professor;
  const d = (p.avulso.form.disciplinas||[]).find(x=>x.id===blockId);
  const v = d ? (d.vinculos||[]).find(x=>x.id===vinculoId) : null;
  if(!v) return;
  v.professorId = professorId;
  v.disciplinaId = '';
  render();
}
function avulsoVinculoSetDisciplina(blockId, vinculoId, disciplinaId){
  const p = state.professor;
  const d = (p.avulso.form.disciplinas||[]).find(x=>x.id===blockId);
  const v = d ? (d.vinculos||[]).find(x=>x.id===vinculoId) : null;
  if(!v) return;
  v.disciplinaId = disciplinaId;
  render();
}
function avulsoVinculoToggleTurma(blockId, vinculoId, turmaId){
  const p = state.professor;
  const d = (p.avulso.form.disciplinas||[]).find(x=>x.id===blockId);
  const v = d ? (d.vinculos||[]).find(x=>x.id===vinculoId) : null;
  if(!v) return;
  if(!Array.isArray(v.turmaIds)) v.turmaIds = [];
  if(v.turmaIds.includes(turmaId)) v.turmaIds = v.turmaIds.filter(x=>x!==turmaId);
  else v.turmaIds.push(turmaId);
  render();
}
async function ensureAvulsoProfessoresCache(forceRefresh){
  const p = state.professor;
  if(p.avulso.professoresCache && !forceRefresh) return;
  p.avulso.professoresCacheLoading = true;
  render();
  let cache = [];
  try{
    const lista = await fetchProfessoresList();
    // Inclui TODOS os professores cadastrados, mesmo quem ainda não fez o primeiro acesso —
    // o coordenador já pode cadastrar as disciplinas dele(a) (ver renderCoordDisciplinasProfessor)
    // e vincular normalmente aqui, sem precisar esperar o professor entrar no sistema.
    cache = await Promise.all(lista.map(async pr => {
      let disciplinas = [];
      try{ const r = await window.storage.get(`disciplinas:${pr.id}`, true); disciplinas = JSON.parse(r.value) || []; }catch(e){ disciplinas = []; }
      return { id: pr.id, name: pr.displayName || pr.email || 'Professor(a)', disciplinas, ativo: !!pr.activatedAt };
    }));
    cache.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  }catch(e){ cache = []; }
  p.avulso.professoresCache = cache;
  p.avulso.professoresCacheLoading = false;
  render();
}
function normalizeDisciplinaName(s){
  return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[.,]/g,'').replace(/\s+/g,' ').trim();
}
function levenshteinDistance(a,b){
  const m=a.length, n=b.length;
  if(m===0) return n; if(n===0) return m;
  const dp = Array.from({length:m+1}, () => new Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0]=i;
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}
function disciplinaWordsSimilar(w1, w2){
  if(w1===w2) return true;
  if(w1.length>=2 && w2.length>=2 && (w1.startsWith(w2) || w2.startsWith(w1))) return true;
  if(Math.max(w1.length,w2.length)>=4 && levenshteinDistance(w1,w2)<=1) return true;
  return false;
}
function findSimilarDisciplinaName(name, existingNames){
  const norm = normalizeDisciplinaName(name);
  if(!norm) return null;
  const normWords = norm.split(' ').filter(Boolean);
  for(const existing of existingNames){
    const en = normalizeDisciplinaName(existing);
    if(!en || en===norm.trim()) { if(en===norm) return existing; continue; }
    const ew = en.split(' ').filter(Boolean);
    if(ew.length===normWords.length && ew.every((w,i)=>disciplinaWordsSimilar(w, normWords[i]))) return existing;
  }
  return null;
}
async function ensureDisciplinaNamesCache(forceRefresh){
  const p = state.professor;
  if(p.disciplinaNamesCache && !forceRefresh) return;
  p.disciplinaNamesCacheLoading = true;
  let names = [];
  try{
    const lista = await fetchProfessoresList();
    const listas = await Promise.all(lista.map(async pr => {
      try{ const r = await window.storage.get(`disciplinas:${pr.id}`, true); return (JSON.parse(r.value)||[]).map(d=>d.name); }catch(e){ return []; }
    }));
    const seen = new Set();
    listas.flat().forEach(n => { const key = normalizeDisciplinaName(n); if(n && !seen.has(key)){ seen.add(key); names.push(n); } });
    names.sort((a,b)=>a.localeCompare(b,'pt-BR'));
  }catch(e){ names = []; }
  p.disciplinaNamesCache = names;
  p.disciplinaNamesCacheLoading = false;
  render();
}
function avulsoRemoveDisciplina(id){
  const p = state.professor;
  p.avulso.form.disciplinas = p.avulso.form.disciplinas.filter(d=>d.id!==id);
  render();
}
async function salvarAvulso(){
  const p = state.professor;
  const f = p.avulso.form;
  const errEl = document.getElementById('avulso-err');
  const setErr = (msg) => { if(errEl) errEl.innerHTML = `<p class="err">${esc(msg)}</p>`; };
  const n = parseInt(f.numQuestoes);
  if(!n || n<1 || n>150){ setErr('Informe uma quantidade válida de questões (1 a 150).'); return; }
  const numAlt = parseInt(f.numAlternativas);
  if(!numAlt || numAlt<2 || numAlt>6){ setErr('Informe de 2 a 6 alternativas por questão.'); return; }
  if(!f.disciplinas || f.disciplinas.length===0){ setErr('Adicione ao menos uma disciplina.'); return; }
  for(const d of f.disciplinas){
    if(!d.nome || !d.nome.trim()){ setErr('Preencha o nome de todas as disciplinas.'); return; }
    const ini = parseInt(d.inicio), fim = parseInt(d.fim);
    if(!ini || !fim || ini<1 || fim>n || ini>fim){ setErr(`Intervalo de questões inválido para "${d.nome}".`); return; }
  }
  if(f.instrumento && !f.unidade){ setErr('Para substituir um instrumento avaliativo, selecione a unidade.'); return; }
  const disciplinasResolvidas = construirDisciplinasComVinculos(f, setErr);
  if(!disciplinasResolvidas) return;
  const gab = {
    id: cryptoId(), code: genCode(),
    titulo: (f.titulo||'').trim() || 'Gabarito Avulso',
    unidade: (f.unidade||'').trim(), instrumento: f.instrumento || '', dataProva: f.dataProva || '',
    numQuestoes: n, numAlternativas: numAlt,
    disciplinas: disciplinasResolvidas,
    gabarito: null,
    turmasAplicadas: [],
    createdBy: state.view==='coordenador' ? 'Coordenação' : (p.session?p.session.displayName:'Professor'),
    createdAt: Date.now()
  };
  p.avulso.list.unshift(gab);
  await saveAvulsosToStorage();
  p.avulso.mode = 'list';
  p.avulso.form = null;
  render();
}
async function salvarGabaritoCorretoAvulso(){
  const p = state.professor;
  const av = p.avulso;
  const gab = av.current;
  const setErr = (msg) => { av.gabaritoEditError = msg; render(); };
  const answers = av.gabaritoEditAnswers || [];
  const faltando = [];
  for(let i=0;i<gab.numQuestoes;i++){ if(!answers[i]) faltando.push(i+1); }
  if(faltando.length>0){ setErr(`Falta escolher a resposta da(s) questão(ões): ${faltando.join(', ')}.`); return; }
  const gabaritoArr = answers.slice(0, gab.numQuestoes);
  gab.gabarito = gabaritoArr;
  const idx = p.avulso.list.findIndex(x=>x.id===gab.id);
  if(idx>=0) p.avulso.list[idx] = gab;
  await saveAvulsosToStorage();
  // Se já havia respostas lançadas antes de o gabarito correto existir (não deveria acontecer,
  // já que o lançamento é bloqueado sem gabarito, mas por segurança recalcula se houver).
  if((av.respostas||[]).length>0){
    const recalculadas = av.respostas.map(r => ({ ...r, ...gradeAvulsoRespostas(gab, r.respostas) }));
    av.respostas = recalculadas;
    await window.storage.set(`avulso-respostas:${gab.code}`, JSON.stringify(recalculadas), true);
    await syncAvulsoInstrumento(gab);
  }
  av.editandoGabarito = false; av.gabaritoEditAnswers = []; av.gabaritoEditError = '';
  alert('Gabarito correto salvo.');
  render();
}
async function abrirAvulso(id){
  const p = state.professor;
  const gab = p.avulso.list.find(x=>x.id===id);
  if(!gab) return;
  p.avulso.current = gab;
  p.avulso.mode = 'detalhe';
  p.avulso.imprimirTurmaId = ''; p.avulso.imprimirNomesText = '';
  p.avulso.lancarModo = 'manual'; p.avulso.lancarNome = ''; p.avulso.lancarTurmaId = ''; p.avulso.lancarStudentId = ''; p.avulso.lancarSequencia = ''; p.avulso.lancarRespostas = new Array(gab.numQuestoes).fill('');
  p.avulso.scanLoading = false; p.avulso.scanError = ''; p.avulso.scanReview = null; p.avulso.scanAvulso = null;
  p.avulso.editandoGabarito = false; p.avulso.gabaritoEditAnswers = []; p.avulso.gabaritoEditError = '';
  p.avulso.selecionados = []; p.avulso.transferRespName = null; p.avulso.transferBulk = false; p.avulso.transferTargetCode = ''; p.avulso.transferError = ''; p.avulso.verRespostaAlunoName = null;
  p.avulso.editandoRespostaAlunoName = null; p.avulso.editRespostaAlunoAnswers = [];
  loadAvulsoRespostas(gab.code);
  render();
}
async function loadAvulsoRespostas(code){
  const p = state.professor;
  p.avulso.respostasLoading = true;
  try{ const r = await window.storage.get(`avulso-respostas:${code}`, true); p.avulso.respostas = JSON.parse(r.value); }
  catch(e){ p.avulso.respostas = []; }
  p.avulso.respostasLoading = false;
  render();
}
async function excluirAvulso(id){
  if(!confirm('Excluir este gabarito avulso e todas as notas lançadas para ele? Você pode restaurar pela Lixeira em até 30 dias.')) return;
  const p = state.professor;
  const gab = p.avulso.list.find(x=>x.id===id);
  let respostasAntigas = [];
  if(gab){ try{ const r = await window.storage.get(`avulso-respostas:${gab.code}`, true); respostasAntigas = r.value ? JSON.parse(r.value) : []; }catch(e){ respostasAntigas = []; } }
  p.avulso.list = p.avulso.list.filter(x=>x.id!==id);
  await saveAvulsosToStorage();
  if(gab){ try{ await window.storage.delete(`avulso-respostas:${gab.code}`, true); }catch(e){} }
  if(gab) await cleanupAvulsoAssessments(gab.code);
  if(p.avulso.current && p.avulso.current.id===id){ p.avulso.mode = 'list'; p.avulso.current = null; }
  if(gab) await moveToTrash('gabarito-avulso', gab.titulo || 'Gabarito avulso', { gabarito: gab, respostas: respostasAntigas });
  render();
}
async function excluirRespostaAvulso(studentName){
  const p = state.professor;
  const gab = p.avulso.current;
  if(!gab) return;
  if(!confirm(`Remover a nota lançada de ${studentName}? Você pode restaurar pela Lixeira em até 30 dias.`)) return;
  const removida = (p.avulso.respostas||[]).find(x=>x.studentName===studentName);
  const existing = (p.avulso.respostas||[]).filter(x=>x.studentName!==studentName);
  p.avulso.respostas = existing;
  await window.storage.set(`avulso-respostas:${gab.code}`, JSON.stringify(existing), true);
  await syncAvulsoInstrumento(gab);
  if(removida) await moveToTrash('avulso-resposta', `${studentName} — ${gab.titulo||''}`, { code: gab.code, resposta: removida });
  render();
}
function avulsoToggleVerRespostaAluno(studentName){
  const p = state.professor;
  const av = p.avulso;
  av.verRespostaAlunoName = (av.verRespostaAlunoName===studentName) ? null : studentName;
  av.editandoRespostaAlunoName = null;
  av.editRespostaAlunoAnswers = [];
  render();
}
function avulsoAbrirEditarRespostaAluno(studentName){
  const p = state.professor;
  const av = p.avulso;
  const r = (av.respostas||[]).find(x=>x.studentName===studentName);
  if(!r) return;
  av.verRespostaAlunoName = studentName;
  av.editandoRespostaAlunoName = studentName;
  av.editRespostaAlunoAnswers = (r.respostas||[]).slice();
  render();
}
function avulsoCancelarEditarRespostaAluno(){
  const p = state.professor;
  p.avulso.editandoRespostaAlunoName = null;
  p.avulso.editRespostaAlunoAnswers = [];
  render();
}
async function avulsoSalvarRespostaAlunoEditada(){
  const p = state.professor;
  const av = p.avulso;
  const gab = av.current;
  const studentName = av.editandoRespostaAlunoName;
  if(!studentName || !gab) return;
  const novasRespostas = av.editRespostaAlunoAnswers;
  let lista = [];
  try{ const r = await window.storage.get(`avulso-respostas:${gab.code}`, true); lista = JSON.parse(r.value); }catch(e){ lista = []; }
  const idx = lista.findIndex(x=>x.studentName===studentName);
  if(idx===-1){ av.editandoRespostaAlunoName = null; av.editRespostaAlunoAnswers = []; render(); return; }
  lista[idx] = { ...lista[idx], respostas: novasRespostas.slice(), ...gradeAvulsoRespostas(gab, novasRespostas) };
  await window.storage.set(`avulso-respostas:${gab.code}`, JSON.stringify(lista), true);
  av.respostas = lista;
  av.editandoRespostaAlunoName = null;
  av.editRespostaAlunoAnswers = [];
  await syncAvulsoInstrumento(gab);
  render();
}
function coordAbrirTransferirRespostaAvulso(studentName){
  const p = state.professor;
  p.avulso.transferRespName = studentName;
  p.avulso.transferBulk = false;
  p.avulso.transferTargetCode = '';
  p.avulso.transferError = '';
  render();
}
function coordCancelarTransferirRespostaAvulso(){
  const p = state.professor;
  p.avulso.transferRespName = null;
  p.avulso.transferBulk = false;
  p.avulso.transferTargetCode = '';
  p.avulso.transferError = '';
  render();
}
function avulsoToggleSelecionado(studentName){
  const p = state.professor;
  const av = p.avulso;
  const set = new Set(av.selecionados||[]);
  if(set.has(studentName)) set.delete(studentName); else set.add(studentName);
  av.selecionados = Array.from(set);
  render();
}
function avulsoToggleSelecionarTodos(){
  const p = state.professor;
  const av = p.avulso;
  const nomes = (av.respostas||[]).map(r=>r.studentName);
  const todosJaSelecionados = nomes.length>0 && nomes.every(n=>(av.selecionados||[]).includes(n));
  av.selecionados = todosJaSelecionados ? [] : nomes;
  render();
}
function coordAbrirTransferirSelecionadosAvulso(){
  const p = state.professor;
  const av = p.avulso;
  if(!av.selecionados || av.selecionados.length===0) return;
  av.transferRespName = null;
  av.transferBulk = true;
  av.transferTargetCode = '';
  av.transferError = '';
  render();
}
async function coordConfirmarTransferirRespostaAvulso(){
  const p = state.professor;
  const av = p.avulso;
  const fromGab = av.current;
  if(!fromGab) return;
  const nomes = av.transferBulk ? (av.selecionados||[]).slice() : (av.transferRespName ? [av.transferRespName] : []);
  if(nomes.length===0){ av.transferError = 'Nenhum aluno selecionado.'; render(); return; }
  const toCode = av.transferTargetCode;
  if(!toCode){ av.transferError = 'Escolha o gabarito avulso correto de destino.'; render(); return; }
  if(toCode===fromGab.code){ av.transferError = 'Escolha um gabarito diferente do atual.'; render(); return; }
  const toGab = await findAvulsoByCode(toCode);
  if(!toGab){ av.transferError = 'Gabarito de destino não encontrado.'; render(); return; }
  if(!toGab.gabarito){ av.transferError = `O gabarito "${toGab.titulo}" ainda não tem o gabarito correto cadastrado — cadastre-o antes de transferir notas pra ele.`; render(); return; }
  if(toGab.numQuestoes !== fromGab.numQuestoes){ av.transferError = `As duas provas têm quantidade de questões diferente (${fromGab.numQuestoes} na atual, ${toGab.numQuestoes} na de destino) — não dá pra transferir com segurança.`; render(); return; }
  if(toGab.numAlternativas !== fromGab.numAlternativas){ av.transferError = `As duas provas têm quantidade de alternativas por questão diferente (${fromGab.numAlternativas} na atual, ${toGab.numAlternativas} na de destino) — confira se é mesmo a prova certa antes de transferir.`; render(); return; }

  const confirmMsg = nomes.length>1
    ? `Transferir as respostas de ${nomes.length} aluno(s) (${nomes.join(', ')}) de "${fromGab.titulo}" para "${toGab.titulo}"? A nota de cada um é recalculada com o gabarito de correção do destino.`
    : `Transferir a resposta de "${nomes[0]}" de "${fromGab.titulo}" para "${toGab.titulo}"? A nota é recalculada com o gabarito de correção do destino.`;
  if(!confirm(confirmMsg)) return;

  let origemList = [];
  try{ const r = await window.storage.get(`avulso-respostas:${fromGab.code}`, true); origemList = JSON.parse(r.value); }catch(e){ origemList = []; }
  let destinoList = [];
  try{ const r = await window.storage.get(`avulso-respostas:${toGab.code}`, true); destinoList = JSON.parse(r.value); }catch(e){ destinoList = []; }

  const transferidos = [];
  const naoEncontrados = [];
  for(const studentName of nomes){
    const resposta = origemList.find(x=>x.studentName===studentName);
    if(!resposta){ naoEncontrados.push(studentName); continue; }
    const novoRegistro = { ...resposta, ...gradeAvulsoRespostas(toGab, resposta.respostas), transferidoDe: fromGab.code, transferidoEm: Date.now() };
    origemList = origemList.filter(x=>x.studentName!==studentName);
    destinoList = destinoList.filter(x=>x.studentName!==studentName);
    destinoList.push(novoRegistro);
    transferidos.push(studentName);
  }

  await window.storage.set(`avulso-respostas:${fromGab.code}`, JSON.stringify(origemList), true);
  await window.storage.set(`avulso-respostas:${toGab.code}`, JSON.stringify(destinoList), true);
  av.respostas = origemList;
  av.transferRespName = null;
  av.transferBulk = false;
  av.transferTargetCode = '';
  av.transferError = '';
  av.selecionados = [];
  await syncAvulsoInstrumento(fromGab);
  await syncAvulsoInstrumento(toGab);
  render();
  const resumo = transferidos.length>0
    ? `${transferidos.length} resposta(s) transferida(s) para "${toGab.titulo}" e recalculada(s) com sucesso.`
    : 'Nenhuma resposta foi transferida.';
  const aviso = naoEncontrados.length>0 ? ` (${naoEncontrados.length} não encontrada(s): ${naoEncontrados.join(', ')})` : '';
  alert(resumo+aviso);
}
function gradeAvulsoRespostas(gab, respostas){
  const porDisciplina = (gab.disciplinas||[]).map(d => {
    let acertos = 0;
    const total = Math.max(0, d.fim - d.inicio + 1);
    for(let i=d.inicio-1; i<=d.fim-1 && i<gab.numQuestoes; i++){
      if(respostas[i] && gab.gabarito[i] && respostas[i]===gab.gabarito[i]) acertos++;
    }
    const nota = total>0 ? Math.round((acertos/total)*1000)/100 : 0;
    return { disciplinaId: d.id, nome: d.nome, acertos, total, nota };
  });
  let acertosTotal = 0;
  for(let i=0;i<gab.numQuestoes;i++){ if(respostas[i] && gab.gabarito[i] && respostas[i]===gab.gabarito[i]) acertosTotal++; }
  const notaGeral = gab.numQuestoes>0 ? Math.round((acertosTotal/gab.numQuestoes)*1000)/100 : 0;
  const mediaDisciplinas = porDisciplina.length>0 ? Math.round((porDisciplina.reduce((s,d)=>s+d.nota,0)/porDisciplina.length)*100)/100 : notaGeral;
  return { porDisciplina, acertosTotal, notaGeral, mediaDisciplinas };
}
async function syncAvulsoInstrumento(gab){
  if(!gab.instrumento || !gab.unidade) return;
  let respostas = [];
  try{ const r = await window.storage.get(`avulso-respostas:${gab.code}`, true); respostas = JSON.parse(r.value) || []; }catch(e){ respostas = []; }
  for(const bloco of (gab.disciplinas||[])){
    const vinculos = avulsoBlocoVinculos(bloco).filter(v=>v.professorId && v.disciplinaId);
    if(vinculos.length===0) continue;
    for(const vinculo of vinculos){
      await syncAvulsoVinculoAssessment(gab, bloco, vinculo, vinculos.length, respostas);
    }
  }
  if(state.coordenador.dashboard) state.coordenador.dashboard.stats = null;
}
async function syncAvulsoVinculoAssessment(gab, bloco, vinculo, totalVinculosDoBloco, respostas){
  const turmasDoVinculo = vinculo.turmaIds && vinculo.turmaIds.length>0 ? new Set(vinculo.turmaIds) : null;
  // com um único vínculo no bloco e nenhuma turma marcada, ele vale pra qualquer turma lançada;
  // com mais de um vínculo, turmaIds é obrigatório (já validado ao salvar), então nunca cai aqui.
  const aplicaATodas = !turmasDoVinculo && totalVinculosDoBloco===1;
  const porAluno = [];
  const turmaIdsSet = new Set();
  respostas.forEach(r => {
    if(!r.turmaId) return; // sem turma vinculada, não dá pra saber em qual painel a nota deve entrar
    if(!aplicaATodas && (!turmasDoVinculo || !turmasDoVinculo.has(r.turmaId))) return;
    const dd = (r.porDisciplina||[]).find(x=>x.disciplinaId===bloco.id);
    if(!dd) return;
    porAluno.push({ studentName: r.studentName, nota: dd.nota });
    turmaIdsSet.add(r.turmaId);
  });
  const assessmentsExistentes = [...state.professor.assessments, ...state.coordenador.assessments];
  let assessment = assessmentsExistentes.find(a => a.importadoAvulso && a.avulsoCode===gab.code && a.avulsoVinculoId===vinculo.id);
  if(!assessment && vinculo.id.endsWith('-legacy')){
    assessment = assessmentsExistentes.find(a => a.importadoAvulso && a.avulsoCode===gab.code && a.avulsoDisciplinaBlockId===bloco.id && !a.avulsoVinculoId);
  }
  if(porAluno.length===0){
    // Nenhum aluno bate com esse vínculo nessa passada (turma removida do vínculo, disciplina
    // recriada com outro id, etc.). Se já existia uma avaliação sintética, ela é REMOVIDA em vez
    // de sobrescrita com notas zeradas — sobrescrever faria o painel do(a) professor(a) mostrar
    // "0" pra turma inteira e disparar recuperação paralela geral, mesmo as notas reais existindo
    // (visíveis em Desempenho), só porque essa sincronização específica não achou ninguém.
    if(assessment){
      try{ await window.storage.delete(`assessment:${assessment.code}`, true); }catch(e){}
      try{ await window.storage.delete(`responses:${assessment.code}`, true); }catch(e){}
      state.professor.assessments = state.professor.assessments.filter(a=>a.code!==assessment.code);
      state.coordenador.assessments = state.coordenador.assessments.filter(a=>a.code!==assessment.code);
    }
    return;
  }
  const code = assessment ? assessment.code : genCode();
  const turmaIds = turmaIdsSet.size>0 ? [...turmaIdsSet] : (assessment ? (assessment.turmaIds||[]) : (vinculo.turmaIds||[]));
  assessment = {
    code,
    title: `${gab.titulo || 'Gabarito Avulso'} — ${bloco.nome} (Gabarito Avulso)`,
    instrumento: gab.instrumento,
    unidade: gab.unidade,
    disciplinaId: vinculo.disciplinaId || null,
    disciplinaName: vinculo.disciplinaName || bloco.nome,
    turmaIds,
    questions: [{ id:cryptoId(), type:'mc', text:'Nota (gabarito avulso)', points:10, image:null, annulled:false, descritorSaeb:'', conteudo:'',
      options:[{id:cryptoId(),text:'—'},{id:cryptoId(),text:'—'}], correctOptionId:null }],
    startAt: null,
    endAt: new Date(2000,0,1).toISOString(), // trava a avaliação pra alunos não tentarem responder por engano
    resultRelease: { mode:'imediato', releaseAt:'' },
    securityEnabled: false,
    professorId: vinculo.professorId,
    professorName: vinculo.professorName || 'Professor(a)',
    createdAt: assessment ? assessment.createdAt : Date.now(),
    updatedAt: Date.now(),
    importadoAvulso: true, avulsoCode: gab.code, avulsoDisciplinaBlockId: bloco.id, avulsoVinculoId: vinculo.id
  };
  await window.storage.set(`assessment:${code}`, JSON.stringify(assessment), true);
  const responsesOut = porAluno.map(item => ({ studentName:item.studentName, submittedAt:Date.now(), total:item.nota, details:[], answers:{}, tabSwitches:0, fullscreenExits:0, manual:false, importadoAvulso:true }));
  await window.storage.set(`responses:${code}`, JSON.stringify(responsesOut), true);
  const idxP = state.professor.assessments.findIndex(a=>a.code===code);
  if(idxP>=0) state.professor.assessments[idxP] = assessment; else state.professor.assessments.unshift(assessment);
  const idxC = state.coordenador.assessments.findIndex(a=>a.code===code);
  if(idxC>=0) state.coordenador.assessments[idxC] = assessment;
}
async function cleanupAvulsoAssessments(code){
  const all = [...state.professor.assessments, ...state.coordenador.assessments];
  const codes = new Set(all.filter(a => a.importadoAvulso && a.avulsoCode===code).map(a=>a.code));
  for(const c of codes){
    try{ await window.storage.delete(`assessment:${c}`, true); }catch(e){}
    try{ await window.storage.delete(`responses:${c}`, true); }catch(e){}
  }
  state.professor.assessments = state.professor.assessments.filter(a=>!(a.importadoAvulso && a.avulsoCode===code));
  state.coordenador.assessments = state.coordenador.assessments.filter(a=>!(a.importadoAvulso && a.avulsoCode===code));
}
async function lancarRespostaAvulso(code, studentName, turmaId, turmaName, respostasArr, scanned){
  const p = state.professor;
  const gab = await findAvulsoByCode(code);
  if(!gab){ alert('Gabarito avulso não encontrado.'); return null; }
  if(!gab.gabarito || gab.gabarito.length===0){ alert('Este gabarito avulso ainda não tem o gabarito correto informado. Informe-o em "Gabarito correto" antes de lançar notas.'); return null; }
  const resultado = gradeAvulsoRespostas(gab, respostasArr);
  let existing = [];
  try{ const r = await window.storage.get(`avulso-respostas:${code}`, true); existing = JSON.parse(r.value); }catch(e){ existing = []; }
  existing = existing.filter(x=>x.studentName!==studentName);
  existing.push({ studentName, turmaId: turmaId||'', turmaName: turmaName||'', submittedAt: Date.now(), respostas: respostasArr, ...resultado, scanned: !!scanned });
  await window.storage.set(`avulso-respostas:${code}`, JSON.stringify(existing), true);
  if(p.avulso.current && p.avulso.current.code===code) p.avulso.respostas = existing;
  await syncAvulsoInstrumento(gab);
  return existing;
}
async function lancarAvulsoManual(){
  const p = state.professor;
  const av = p.avulso;
  const gab = av.current;
  if(!av.lancarTurmaId){ alert('Selecione a turma do aluno.'); return; }
  const t = state.professor.turmas.find(x=>x.id===av.lancarTurmaId);
  const aluno = t ? t.students.find(s=>s.id===av.lancarStudentId) : null;
  if(!aluno){ alert('Selecione o aluno.'); return; }
  const respostas = (av.lancarRespostas||[]).slice(0, gab.numQuestoes);
  while(respostas.length < gab.numQuestoes) respostas.push('');
  const respostasNormalizadas = respostas.map(r => r ? r : null);
  const turmaName = t.name;
  const ok = await lancarRespostaAvulso(gab.code, aluno.name, av.lancarTurmaId, turmaName, respostasNormalizadas, false);
  if(!ok) return;
  av.lancarStudentId = ''; av.lancarRespostas = new Array(gab.numQuestoes).fill('');
  alert('Nota lançada.');
  render();
}
async function iniciarLeituraAvulso(file){
  const p = state.professor;
  const av = p.avulso;
  if(!isPdfFile(file)){ av.scanQueue = null; await scanAvulsoSheet(file); return; }
  av.scanError = ''; av.scanLoading = true; render();
  let paginas;
  try{ paginas = await pdfFileToImageFiles(file); }
  catch(e){ av.scanLoading=false; av.scanError='Não foi possível abrir esse PDF. Confira se o arquivo não está corrompido.'; render(); return; }
  if(paginas.length===0){ av.scanLoading=false; av.scanError='Esse PDF não tem páginas.'; render(); return; }
  av.scanQueue = { files: paginas, index: 0 };
  await scanAvulsoSheet(paginas[0]);
}
async function avulsoScanAvancarFila(){
  const p = state.professor;
  const av = p.avulso;
  const q = av.scanQueue;
  if(!q || q.index+1 >= q.files.length){ av.scanQueue = null; render(); return; }
  q.index++;
  await scanAvulsoSheet(q.files[q.index]);
}
async function scanAvulsoSheet(file){
  const p = state.professor;
  const av = p.avulso;
  av.scanError = ''; av.scanLoading = true; av.scanReview = null;
  render();
  try{
    const img = await loadImageFile(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = decodeQrRobust(canvas, imageData);
    if(!qr){
      av.scanError = 'QR code não encontrado na imagem. Tente aproximar mais a câmera do QR code, evitar sombra e reflexo sobre o papel, e tirar a foto com o cartão bem iluminado e o mais reto possível.';
      av.scanLoading = false; render(); return;
    }
    let code, studentName, turmaName, turmaId;
    try{
      const url = new URL(qr.data);
      code = url.searchParams.get('avulso_code');
      studentName = url.searchParams.get('avulso_student');
      turmaName = url.searchParams.get('avulso_turma') || '';
      turmaId = url.searchParams.get('avulso_turmaid') || '';
    }catch(e){}
    if(!code || !studentName){
      av.scanError = 'O QR code encontrado não é de um gabarito avulso desta plataforma.';
      av.scanLoading = false; render(); return;
    }
    const gab = await findAvulsoByCode(code);
    if(!gab){
      av.scanError = 'Gabarito avulso do QR code não foi encontrado no sistema.';
      av.scanLoading = false; render(); return;
    }
    const loc = qr.location;
    const basis = {
      origin: loc.topLeftCorner,
      right: { x: loc.topRightCorner.x - loc.topLeftCorner.x, y: loc.topRightCorner.y - loc.topLeftCorner.y },
      down: { x: loc.bottomLeftCorner.x - loc.topLeftCorner.x, y: loc.bottomLeftCorner.y - loc.topLeftCorner.y }
    };
    const scale = (Math.hypot(basis.right.x, basis.right.y) + Math.hypot(basis.down.x, basis.down.y)) / (2*OMR_LAYOUT.qrSize);
    const sampleRadius = scale * (AVULSO_LAYOUT.bubbleSize*0.38);
    const L = AVULSO_LAYOUT;
    const n = gab.numQuestoes;
    const half = Math.ceil(n/2);
    const letters = OPT_LETTERS.slice(0, gab.numAlternativas);
    const detected = [];
    for(let i=0;i<n;i++){
      const col = i<half ? 0 : 1;
      const row = col===0 ? i : i-half;
      const rowY = L.gridStartY + row*L.rowHeight;
      const colX = col===1 ? L.colWidth : 0;
      const darknesses = letters.map((letter,j) => {
        const bx = colX + L.numLabelWidth + j*L.bubbleSpacing + L.bubbleSize/2;
        const by = rowY + L.bubbleSize/2;
        const px = mmToPixel(bx, by, basis);
        return sampleDarkness(imageData, px.x, px.y, sampleRadius);
      });
      detected.push({ detectedIndex: pickConfidentBubble(darknesses) });
    }
    let resolvedTurmaId = '';
    if(turmaId && state.professor.turmas.some(t=>t.id===turmaId)) resolvedTurmaId = turmaId;
    else if(turmaName){ const t = state.professor.turmas.find(t=>t.name===turmaName); if(t) resolvedTurmaId = t.id; }
    av.scanAvulso = gab;
    av.scanStudentName = studentName;
    av.scanTurmaName = turmaName;
    av.scanTurmaId = resolvedTurmaId;
    av.scanReview = detected;
    av.scanLoading = false;
    render();
  }catch(e){
    av.scanError = 'Não foi possível processar essa imagem. Tente outra foto.';
    av.scanLoading = false;
    render();
  }
}
async function confirmAvulsoScan(){
  const p = state.professor;
  const av = p.avulso;
  const gab = av.scanAvulso;
  if(!av.scanTurmaId){ alert('Não foi possível identificar a turma automaticamente pelo cartão. Selecione a turma do aluno acima antes de confirmar.'); return; }
  const t = state.professor.turmas.find(x=>x.id===av.scanTurmaId);
  const respostas = av.scanReview.map((r, idx) => {
    const el = document.querySelector(`input[name="avulso-scan-q-${idx}"]:checked`);
    if(!el || el.value==='') return null;
    return OPT_LETTERS[Number(el.value)];
  });
  const ok = await lancarRespostaAvulso(gab.code, av.scanStudentName, av.scanTurmaId, t?t.name:av.scanTurmaName, respostas, true);
  if(!ok) return;
  av.scanReview = null; av.scanAvulso = null; av.scanStudentName = ''; av.scanTurmaName = ''; av.scanTurmaId = ''; av.scanError = '';
  if(av.scanQueue){ await avulsoScanAvancarFila(); }
  else { alert('Nota lançada a partir da leitura do gabarito.'); render(); }
}
async function imprimirCartoesAvulso(){
  const p = state.professor;
  const av = p.avulso;
  const gab = av.current;
  let pages = '';
  if(av.imprimirTurmaId){
    const t = state.professor.turmas.find(x=>x.id===av.imprimirTurmaId);
    if(!t || t.students.length===0){ alert('Essa turma não tem alunos cadastrados.'); return; }
    t.students.forEach(s => { pages += buildAvulsoCartaoPage(gab, s.name, t.name, t.id); });
    // Registra a turma no gabarito, pra identificar depois onde ele foi aplicado.
    if(!Array.isArray(gab.turmasAplicadas)) gab.turmasAplicadas = [];
    const jaTem = gab.turmasAplicadas.find(x=>x.turmaId===t.id);
    if(jaTem){ jaTem.appliedAt = Date.now(); } else { gab.turmasAplicadas.push({ turmaId: t.id, turmaName: t.name, appliedAt: Date.now() }); }
    const idx = p.avulso.list.findIndex(x=>x.id===gab.id);
    if(idx>=0) p.avulso.list[idx] = gab;
    await saveAvulsosToStorage();
    render();
  } else {
    const names = (av.imprimirNomesText||'').split('\n').map(s=>s.trim()).filter(Boolean);
    if(names.length===0){ alert('Selecione uma turma ou digite ao menos um nome de aluno.'); return; }
    names.forEach(name => { pages += buildAvulsoCartaoPage(gab, name, ''); });
  }
  printPages(pages);
}
function imprimirGabaritoAvulso(){
  const p = state.professor;
  const gab = p.avulso.current;
  if(!gab.gabarito || gab.gabarito.length===0){ alert('Informe o gabarito correto antes de imprimir.'); return; }
  const turmasAplicadas = gab.turmasAplicadas || [];
  const turmasTexto = turmasAplicadas.length>0 ? turmasAplicadas.map(t=>t.turmaName).join(', ') : 'nenhuma turma registrada ainda';
  const page = `
    <div class="pv-page">
      ${buildPrintHeader({ title: gab.titulo || 'Gabarito Avulso', subtitle: [gab.unidade, gab.dataProva ? new Date(gab.dataProva+'T00:00:00').toLocaleDateString('pt-BR') : ''].filter(Boolean).join(' · ') })}
      <div class="pv-title" style="text-align:center; font-size:1.1rem; margin-top:6px;">Gabarito oficial (uso da coordenação/professor)</div>
      <p style="text-align:center; font-size:.85rem; color:#555; margin-top:2px;">Código ${esc(gab.code)} · Turmas aplicadas: ${esc(turmasTexto)}</p>
      ${renderGabaritoGridSomenteLeitura(gab)}
    </div>
  `;
  printPages(page);
}
function buildAvulsoNotasListPage(gab, respostas){
  const disciplinas = gab.disciplinas || [];
  const ordered = [...respostas].sort((a,b) => (a.turmaName||'').localeCompare(b.turmaName||'') || a.studentName.localeCompare(b.studentName));
  const rows = ordered.map(r => `
    <tr>
      <td>${esc(r.studentName)}</td>
      <td>${esc(r.turmaName||'-')}</td>
      ${disciplinas.map(d => { const dd = (r.porDisciplina||[]).find(x=>x.disciplinaId===d.id); return `<td style="text-align:center;">${dd?dd.nota.toFixed(1):'-'}</td>`; }).join('')}
      <td style="text-align:center; font-weight:700;">${(r.mediaDisciplinas!==undefined?r.mediaDisciplinas:r.notaGeral).toFixed(1)}</td>
    </tr>
  `).join('');
  return `
    <div class="pv-page">
      ${buildPrintHeader({ title: gab.titulo || 'Gabarito Avulso', subtitle: [gab.unidade, gab.dataProva ? new Date(gab.dataProva+'T00:00:00').toLocaleDateString('pt-BR') : ''].filter(Boolean).join(' · ') })}
      <div class="pv-title" style="text-align:center; font-size:1.1rem; margin-top:10px;">Lista de notas</div>
      <table class="pv-sign-table" style="margin-top:10px;">
        <thead><tr><th>Aluno</th><th>Turma</th>${disciplinas.map(d=>`<th style="text-align:center;">${esc(d.nome)}</th>`).join('')}<th style="text-align:center;">Média</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
function imprimirListaNotasAvulso(){
  const p = state.professor;
  const gab = p.avulso.current;
  const respostas = p.avulso.respostas || [];
  if(respostas.length===0){ alert('Ainda não há notas lançadas para este gabarito.'); return; }
  printPages(buildAvulsoNotasListPage(gab, respostas));
}
function buildPersonalAnswerCardPage(a, studentName, turmaName){
  return `<div class="pv-page">${buildPrintHeader({ subtitle: turmaName })}${buildOmrBlock(a, studentName, turmaName)}</div>`;
}
function buildCombinedGabaritoPage(assessments, studentName, turmaName){
  return `<div class="pv-page">${buildPrintHeader({ subtitle: turmaName })}${assessments.map(a => buildOmrBlock(a, studentName, turmaName)).join('<div class="omr-block-sep"></div>')}</div>`;
}
function buildGabaritoPage(a){
  const rows = a.questions.map((q, idx) => {
    if(q.type==='mc'){
      const correctIdx = q.options.findIndex(o=>o.id===q.correctOptionId);
      const letters = OPT_LETTERS.slice(0, q.options.length);
      return `
        <div class="pv-gab-row">
          <span class="pv-bubble-num">${String(idx+1).padStart(2,'0')}</span>
          ${letters.map((l,i) => `<span class="pv-bubble${i===correctIdx?' pv-bubble-filled':''}">${l}</span>`).join('')}
          <span class="muted">${correctIdx>=0 ? esc(q.options[correctIdx].text) : ''}</span>
        </div>
      `;
    }
    if(q.type==='vf'){
      const letters = ['V','F'];
      const correctIdx = q.correctBool ? 0 : 1;
      return `
        <div class="pv-gab-row">
          <span class="pv-bubble-num">${String(idx+1).padStart(2,'0')}</span>
          ${letters.map((l,i) => `<span class="pv-bubble${i===correctIdx?' pv-bubble-filled':''}">${l}</span>`).join('')}
        </div>
      `;
    }
    return `
      <div class="pv-gab-row">
        <span class="pv-bubble-num">${String(idx+1).padStart(2,'0')}</span>
        <span>Resposta modelo: ${esc(q.modelAnswer || '(não informada)')}</span>
      </div>
    `;
  }).join('');
  return `
    <div class="pv-page">
      ${printHeaderForAssessment(a)}
      <div class="pv-gab-title" style="text-align:center; margin-top:10px;">Gabarito — código ${esc(a.code)} — uso do professor</div>
      ${rows}
    </div>
  `;
}
function buildSignatureListPage(turma, contextTitle){
  return `
    <div class="pv-page">
      ${buildPrintHeader({ title: contextTitle || null, subtitle: turma.name })}
      <div class="pv-title" style="text-align:center; font-size:1.1rem; margin-top:10px;">Lista de assinatura</div>
      <table class="pv-sign-table">
        <tr><th class="pv-num-col">Nº</th><th>Nome do aluno</th><th class="pv-sign-col">Assinatura</th></tr>
        ${turma.students.map((s,i) => `<tr><td class="pv-num-col">${i+1}</td><td>${esc(s.name)}</td><td></td></tr>`).join('')}
      </table>
    </div>
  `;
}
function printPages(pagesHtml){
  const printArea = document.getElementById('print-area');
  printArea.innerHTML = pagesHtml;
  document.body.classList.add('printing');
  setTimeout(() => { window.print(); }, 50);
}
function findAssessmentByCode(code){
  return state.professor.assessments.find(a=>a.code===code) || state.coordenador.assessments.find(a=>a.code===code);
}
function printPersonalAnswerCards(code){
  const a = findAssessmentByCode(code);
  if(!a){ alert('Avaliação não encontrada.'); return; }
  const turmas = assessmentTurmas(a);
  if(turmas.length===0){ alert('Esta avaliação não está vinculada a nenhuma turma — não é possível gerar gabaritos individuais.'); return; }
  let pages = '';
  turmas.forEach(turma => {
    turma.students.forEach(s => { pages += buildPersonalAnswerCardPage(a, s.name, turma.name); });
  });
  if(!pages){ alert('As turmas vinculadas não têm alunos cadastrados.'); return; }
  printPages(pages);
}
function exportAssessmentPdf(code){
  const a = (state.professor.assessments.find(x=>x.code===code)) || state.professor.resultsFor;
  if(!a) return;
  let pages = buildStudentPage(a) + buildAnswerCardPage(a) + buildGabaritoPage(a);
  assessmentTurmas(a).forEach(turma => {
    if(turma.students.length>0){ pages += buildSignatureListPage(turma, 'Aplicação da avaliação: ' + a.title); }
  });
  printPages(pages);
}
function printTurmaSignatureList(tid){
  const turma = state.professor.turmas.find(t=>t.id===tid);
  if(!turma) return;
  printPages(buildSignatureListPage(turma));
}
async function addManualGrade(){
  const p = state.professor;
  const a = p.resultsFor;
  const max = a.questions.reduce((s,q)=>s+q.points,0);
  let name;
  const select = document.getElementById('manual-grade-student-select');
  if(select){ name = select.value; if(!name){ alert('Selecione o aluno.'); return; } }
  else { name = document.getElementById('manual-grade-student-input').value.trim(); if(!name){ alert('Informe o nome do aluno.'); return; } }
  const notaInput = document.getElementById('manual-grade-value-input');
  const nota = Number(notaInput.value);
  if(isNaN(nota) || nota<0 || nota>max){ alert(`A nota deve estar entre 0 e ${max}.`); return; }
  let existing = [];
  try{ const r = await window.storage.get(`responses:${a.code}`, true); existing = JSON.parse(r.value); }catch(e){ existing = []; }
  existing.push({ studentName:name, submittedAt:Date.now(), total:nota, details:[], answers:{}, tabSwitches:0, fullscreenExits:0, manual:true });
  await window.storage.set(`responses:${a.code}`, JSON.stringify(existing), true);
  p.responses = existing;
  p.manualGradePrefill = null;
  render();
}
async function saveCorrectResponse(idx){
  const p = state.professor;
  const a = p.resultsFor;
  const r = p.responses[idx];
  if(!r) return;
  let ok = true;
  r.details.forEach((d, di) => {
    if(!d.pending) return;
    const input = document.getElementById(`correct-score-${idx}-${di}`);
    if(!input) return;
    const q = a.questions.find(x=>x.id===d.questionId);
    const val = Number(input.value);
    if(input.value==='' || isNaN(val) || val<0 || (q && val>q.points)){ ok = false; return; }
    const sg = iaCorrState().sug[iaCorrChave(r, d.questionId)];
    d.score = val;
    d.pending = false;
    d.feedback = (sg && sg.nota===val && sg.comentario) ? sg.comentario + ' (Correção sugerida pela IA e revisada pelo professor.)' : 'Corrigido manualmente pelo professor.';
  });
  if(!ok){ alert('Preencha uma nota válida para cada questão pendente.'); return; }
  r.total = r.details.reduce((s,d)=>s+(d.score||0),0);
  await window.storage.set(`responses:${a.code}`, JSON.stringify(p.responses), true);
  p.correctingResponseIdx = null;
  p.correcoesPendentesCount = Math.max(0, (p.correcoesPendentesCount||0) - 1);
  render();
}
async function deleteResponse(idx){
  if(!confirm('Remover esta resposta/nota? Você pode restaurar pela Lixeira em até 30 dias.')) return;
  const p = state.professor;
  const a = p.resultsFor;
  const existing = [...p.responses];
  const removida = existing[idx];
  existing.splice(idx, 1);
  await window.storage.set(`responses:${a.code}`, JSON.stringify(existing), true);
  p.responses = existing;
  if(removida) await moveToTrash('resposta-avaliacao', `${removida.studentName||'Aluno'} — ${a.title||''}`, { code: a.code, resposta: removida });
  render();
}
function recalcResponseTotal(assessment, response){
  const originalMax = assessment.questions.reduce((s,q)=>s+q.points,0);
  const activeQuestions = assessment.questions.filter(q=>!q.annulled);
  const activeMax = activeQuestions.reduce((s,q)=>s+q.points,0);
  const rawEarned = response.details
    .filter(d => activeQuestions.some(q=>q.id===d.questionId))
    .reduce((s,d)=>s+(d.score||0), 0);
  const scale = activeMax>0 ? originalMax/activeMax : 1;
  return Math.round(rawEarned*scale*10)/10;
}
async function toggleAnnulQuestion(qid){
  const p = state.professor;
  const a = p.resultsFor;
  const q = a.questions.find(x=>x.id===qid);
  if(!q) return;
  const willAnnul = !q.annulled;
  if(willAnnul && !confirm('Anular esta questão? Os pontos dela serão redistribuídos proporcionalmente entre as demais, e todas as respostas já enviadas serão recalculadas automaticamente.')) return;
  q.annulled = willAnnul;
  await window.storage.set(`assessment:${a.code}`, JSON.stringify(a), true);
  const idx = p.assessments.findIndex(x=>x.code===a.code);
  if(idx>=0) p.assessments[idx] = a;

  const recalculated = p.responses.map(r => ({
    ...r,
    total: recalcResponseTotal(a, r),
    details: r.details.map(d => d.questionId===qid ? {...d, annulled: willAnnul} : d)
  }));
  await window.storage.set(`responses:${a.code}`, JSON.stringify(recalculated), true);
  p.responses = recalculated;
  render();
}
const round1 = n => Math.round(n*10)/10;
async function openResults(code){
  const p = state.professor;
  const a = p.assessments.find(x=>x.code===code);
  p.resultsFor = a;
  p.resultsLoading = true;
  p.mode = 'results';
  p.correctingResponseIdx = null;
  p.commentingResponseIdx = null;
  render();
  try{
    const r = await window.storage.get(`responses:${code}`, true);
    p.responses = JSON.parse(r.value);
  }catch(e){ p.responses = []; }
  p.resultsLoading = false;
  render();
}
__parteOk('gab_avulso');
