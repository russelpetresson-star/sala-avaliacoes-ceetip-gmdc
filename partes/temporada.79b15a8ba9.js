/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "temporada" */
async function loadTemporada(){
  const p = state.professor;
  p.temporadaLoading = true;
  try{ p.temporada = await getTemporadaAtual(); }
  catch(e){ p.temporada = null; }
  p.temporadaLoading = false;
  render();
}
function abrirFormTemporada(){
  const c = state.coordenador;
  const t = state.professor.temporada;
  if(t){
    c.temporadaForm = {
      title: t.title,
      startDate: new Date(t.startAt).toISOString().slice(0,10),
      endDate: new Date(t.endAt).toISOString().slice(0,10),
      tiers: t.tiers.map(x=>({...x}))
    };
  } else {
    c.temporadaForm = {
      title: '',
      startDate: new Date().toISOString().slice(0,10),
      endDate: new Date(Date.now()+30*86400000).toISOString().slice(0,10),
      tiers: [
        { xpNecessario:20, recompensa:'Emblema Bronze', emoji:'🥉' },
        { xpNecessario:50, recompensa:'Emblema Prata', emoji:'🥈' },
        { xpNecessario:100, recompensa:'Emblema Ouro', emoji:'🥇' }
      ]
    };
  }
  c.temporadaError = '';
  render();
}
function cancelarFormTemporada(){
  state.coordenador.temporadaForm = null;
  render();
}
function addTemporadaTier(){
  state.coordenador.temporadaForm.tiers.push({ xpNecessario:0, recompensa:'', emoji:'🏅' });
  render();
}
function removeTemporadaTier(idx){
  state.coordenador.temporadaForm.tiers.splice(idx,1);
  render();
}
async function salvarTemporada(){
  const c = state.coordenador;
  const f = c.temporadaForm;
  const title = f.title.trim();
  if(!title){ c.temporadaError = 'Dê um nome para a temporada.'; render(); return; }
  const startAt = new Date(f.startDate+'T00:00:00').getTime();
  const endAt = new Date(f.endDate+'T23:59:59').getTime();
  if(isNaN(startAt) || isNaN(endAt)){ c.temporadaError = 'Datas inválidas.'; render(); return; }
  if(endAt<=startAt){ c.temporadaError = 'A data de término deve ser depois da data de início.'; render(); return; }
  if(f.tiers.length===0){ c.temporadaError = 'Adicione pelo menos um nível de recompensa.'; render(); return; }
  for(const tier of f.tiers){
    if(!tier.recompensa || !String(tier.recompensa).trim()){ c.temporadaError = 'Preencha a recompensa de todos os níveis.'; render(); return; }
    if(tier.xpNecessario===''||tier.xpNecessario===null||isNaN(Number(tier.xpNecessario))||Number(tier.xpNecessario)<0){ c.temporadaError = 'O XP necessário deve ser um número válido.'; render(); return; }
  }
  const tiersOrdenados = [...f.tiers].sort((a,b)=>Number(a.xpNecessario)-Number(b.xpNecessario)).map((tr,i) => ({ ordem:i+1, xpNecessario:Number(tr.xpNecessario), recompensa:String(tr.recompensa).trim(), emoji:tr.emoji||'🏅' }));
  const existente = state.professor.temporada;
  const temporada = {
    id: existente ? existente.id : cryptoId(),
    title,
    startAt,
    endAt,
    tiers: tiersOrdenados,
    createdAt: existente ? existente.createdAt : Date.now()
  };
  await window.storage.set('temporada-atual', JSON.stringify(temporada), true);
  state.professor.temporada = temporada;
  c.temporadaForm = null;
  c.temporadaError = '';
  render();
}
async function excluirTemporada(){
  if(!confirm('Excluir a temporada atual? Os alunos deixarão de ver a trilha de desafios. O progresso de XP da temporada não pode ser recuperado depois.')) return;
  await window.storage.delete('temporada-atual', true);
  state.professor.temporada = null;
  render();
}
function computeTemporadaRanking(temporada){
  const ranking = [];
  (state.professor.turmas||[]).forEach(t => {
    (t.students||[]).forEach(s => {
      ensureStudentGamification(s);
      if(s.temporadaXp && s.temporadaXp.seasonId===temporada.id && s.temporadaXp.xp>0){
        ranking.push({ name:s.name, turmaName:t.name, xp:s.temporadaXp.xp });
      }
    });
  });
  return ranking.sort((a,b)=>b.xp-a.xp).slice(0,10);
}
function renderCoordTemporada(){
  const c = state.coordenador;
  const p = state.professor;
  if(p.temporadaLoading) return `<div class="card"><h2>🏆 Temporada de Desafios</h2><div class="spinner"></div></div>`;
  if(c.temporadaForm){
    const f = c.temporadaForm;
    return `
      <div class="card">
        <h2>${p.temporada ? 'Editar temporada' : 'Nova temporada'}</h2>
        <label>Nome da temporada</label>
        <input type="text" id="temporada-title-input" value="${esc(f.title)}" placeholder="Ex: Temporada 1 — Desafio de Outubro">
        <div class="row" style="gap:14px;">
          <div style="flex:1;">
            <label>Início</label>
            <input type="date" id="temporada-start-input" value="${esc(f.startDate)}">
          </div>
          <div style="flex:1;">
            <label>Término</label>
            <input type="date" id="temporada-end-input" value="${esc(f.endDate)}">
          </div>
        </div>
        <h3 style="margin-top:18px;">Níveis de recompensa</h3>
        <p class="muted" style="font-size:.82rem;">Cada nível é desbloqueado quando o aluno acumula a quantidade de fichas (XP) indicada, ganhas durante o período da temporada.</p>
        ${f.tiers.map((tier,i) => `
          <div class="row" style="gap:8px; align-items:center; margin-bottom:6px;">
            <input type="text" data-action="temporada-tier-emoji" data-idx="${i}" value="${esc(tier.emoji)}" style="width:50px; text-align:center;" maxlength="2">
            <input type="number" min="0" data-action="temporada-tier-xp" data-idx="${i}" value="${tier.xpNecessario}" placeholder="XP" style="width:90px;">
            <input type="text" data-action="temporada-tier-recompensa" data-idx="${i}" value="${esc(tier.recompensa)}" placeholder="Recompensa (ex: Emblema Ouro)" style="flex:1;">
            <button class="btn btn-danger btn-sm" data-action="remove-temporada-tier" data-idx="${i}">✕</button>
          </div>
        `).join('')}
        <button class="btn btn-ghost btn-sm" data-action="add-temporada-tier" style="margin-top:6px;">+ Adicionar nível</button>
        ${c.temporadaError ? `<p class="err">${esc(c.temporadaError)}</p>` : ''}
        <div class="row" style="margin-top:16px;">
          <button class="btn btn-ghost" data-action="cancelar-form-temporada">Cancelar</button>
          <button class="btn btn-primary" data-action="salvar-temporada">Salvar temporada</button>
        </div>
      </div>
    `;
  }
  if(!p.temporada){
    return `
      <div class="card">
        <h2>🏆 Temporada de Desafios</h2>
        <p class="muted">Crie um período especial (uma "temporada", como em jogos) com níveis de recompensa que os alunos desbloqueiam ganhando fichas. Dá um motivo extra pra participar das atividades por um tempo limitado.</p>
        <button class="btn btn-primary" data-action="abrir-form-temporada">+ Criar temporada</button>
      </div>
    `;
  }
  const t = p.temporada;
  const status = statusTemporada(t);
  const statusLabel = { agendada:'📅 Agendada', ativa:'🟢 Em andamento', encerrada:'🏁 Encerrada' }[status];
  const ranking = computeTemporadaRanking(t);
  return `
    <div class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h2 style="margin:0;">🏆 ${esc(t.title)}</h2>
        <span class="pill">${statusLabel}</span>
      </div>
      <p class="muted">${new Date(t.startAt).toLocaleDateString('pt-BR')} até ${new Date(t.endAt).toLocaleDateString('pt-BR')} · ${t.tiers.length} nível(is) de recompensa</p>
      <div class="row" style="margin-top:10px;">
        <button class="btn btn-ghost btn-sm" data-action="abrir-form-temporada">Editar</button>
        <button class="btn btn-danger btn-sm" data-action="excluir-temporada">Excluir temporada</button>
      </div>
      <h3 style="margin-top:20px;">Níveis</h3>
      ${t.tiers.map(tier => `<div class="list-item"><span>${esc(tier.emoji)} Nível ${tier.ordem} · ${tier.xpNecessario} XP</span><span class="muted">${esc(tier.recompensa)}</span></div>`).join('')}
      <h3 style="margin-top:20px;">🏅 Ranking da temporada</h3>
      ${ranking.length===0 ? '<p class="muted">Ainda ninguém pontuou nesta temporada.</p>' : ranking.map((r,i) => `
        <div class="list-item"><span>${i+1}º · ${esc(r.name)} <span class="muted">(${esc(r.turmaName)})</span></span><span class="muted">${r.xp} XP</span></div>
      `).join('')}
    </div>
  `;
}
async function saveCoordPassword(){
  const c = state.coordenador;
  c.changingPassword = true;
  const val = document.getElementById('coord-new-password-input').value;
  const val2 = document.getElementById('coord-new-password2-input').value;
  if(val.length<4){ c.error='A nova senha deve ter pelo menos 4 caracteres.'; render(); return; }
  if(val!==val2){ c.error='As senhas não coincidem.'; render(); return; }
  const newSalt = randomSaltHex();
  await window.storage.set('coordenador-senha-salt', newSalt, true);
  await window.storage.set('coordenador-senha', await hashTextSalted(val, newSalt), true);
  await segTrocarSenhaCoordenacao(val);
  c.error='';
  c.changingPassword=false;
  render();
  alert('Senha do coordenador atualizada.');
}
function renderCoordFreqConfig(){
  const c = state.coordenador;
  if(state.turnoHorarios.loading || state.diasLetivos.loading){
    return `<div class="card"><h2>Configuração de Frequência</h2><div class="spinner"></div></div>`;
  }
  const horariosMap = state.turnoHorarios.map;
  const horariosHtml = TURNOS.map(tu => {
    const cfg = horariosMap[tu] || {};
    return `
      <div class="row" style="align-items:flex-end; gap:10px; margin-top:8px; flex-wrap:wrap;">
        <div style="flex:0 0 110px;"><strong>${esc(tu)}</strong></div>
        <div>
          <label style="font-size:.78rem;">Horário de entrada</label>
          <input type="time" id="freq-horario-entrada-${esc(tu)}" value="${esc(cfg.entrada||'')}">
        </div>
        <div>
          <label style="font-size:.78rem;">Tolerância (minutos)</label>
          <input type="number" min="0" id="freq-horario-tolerancia-${esc(tu)}" value="${cfg.tolerancia!=null?cfg.tolerancia:15}" style="max-width:100px;">
        </div>
      </div>
    `;
  }).join('');
  return `
    <div class="card">
      <h2>⏰ Horário de entrada por turno</h2>
      <p class="muted">Depois do horário de entrada + tolerância, a leitura da carteirinha marca o aluno como "atrasado" em vez de "presente". Deixe o horário em branco para não controlar atraso nesse turno.</p>
      ${horariosHtml}
      ${c.freqConfig.errorHorarios ? `<p class="err">${esc(c.freqConfig.errorHorarios)}</p>` : ''}
      <button class="btn btn-primary btn-sm" data-action="salvar-turno-horarios" style="margin-top:14px;">Salvar horários</button>
    </div>
    <div class="card" style="margin-top:16px;">
      <h2>📅 Dias letivos</h2>
      <p class="muted">Por padrão, domingos são não letivos e os demais dias da semana são letivos. Clique em um dia para alternar entre letivo e não letivo (ex: feriados, recessos).</p>
      ${renderDiasLetivosCalendario(c.freqConfig.mesCalendario)}
    </div>
  `;
}
function renderDiasLetivosCalendario(mesStr){
  const [ano, mes] = mesStr.split('-').map(Number);
  const primeiroDia = new Date(ano, mes-1, 1);
  const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const offsetSemana = primeiroDia.getDay();
  const celulas = [];
  for(let i=0;i<offsetSemana;i++) celulas.push('<div></div>');
  for(let dia=1; dia<=diasNoMes; dia++){
    const dateStr = `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    const letivo = isDiaLetivo(dateStr);
    celulas.push(`<button data-action="toggle-dia-letivo" data-date="${dateStr}" class="btn btn-sm" style="padding:6px 0; ${letivo?'background:#dff3df; border-color:#8fcf8f;':'background:#f3dfdf; border-color:#cf8f8f;'}">${dia}</button>`);
  }
  return `
    <div class="row" style="align-items:center; justify-content:space-between; margin-bottom:8px;">
      <button class="btn btn-ghost btn-sm" data-action="freq-calendario-mes" data-dir="-1">← Mês anterior</button>
      <strong>${esc(nomesMes[mes-1])} de ${ano}</strong>
      <button class="btn btn-ghost btn-sm" data-action="freq-calendario-mes" data-dir="1">Próximo mês →</button>
    </div>
    <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px; text-align:center; font-size:.85rem;">
      <div class="muted">Dom</div><div class="muted">Seg</div><div class="muted">Ter</div><div class="muted">Qua</div><div class="muted">Qui</div><div class="muted">Sex</div><div class="muted">Sáb</div>
      ${celulas.join('')}
    </div>
    <p class="muted" style="font-size:.78rem; margin-top:8px;">🟩 Letivo · 🟥 Não letivo</p>
  `;
}
async function salvarTurnoHorarios(){
  const c = state.coordenador;
  const map = {};
  for(const tu of TURNOS){
    const entradaEl = document.getElementById(`freq-horario-entrada-${tu}`);
    const tolEl = document.getElementById(`freq-horario-tolerancia-${tu}`);
    const entrada = entradaEl ? entradaEl.value : '';
    const tolerancia = tolEl ? (parseInt(tolEl.value)||0) : 0;
    if(entrada) map[tu] = { entrada, tolerancia };
  }
  state.turnoHorarios.map = map;
  await saveTurnoHorariosToStorage();
  c.freqConfig.errorHorarios = '';
  render();
  alert('Horários de entrada atualizados.');
}
async function toggleDiaLetivo(dateStr){
  const atual = isDiaLetivo(dateStr);
  state.diasLetivos.map[dateStr] = !atual;
  await saveDiasLetivosToStorage();
  render();
}
async function saveFreqMonitorPassword(){
  const c = state.coordenador;
  c.changingFreqPassword = true;
  const val = document.getElementById('freq-new-password-input').value;
  const val2 = document.getElementById('freq-new-password2-input').value;
  if(val.length<4){ c.errorFreq='A nova senha deve ter pelo menos 4 caracteres.'; render(); return; }
  if(val!==val2){ c.errorFreq='As senhas não coincidem.'; render(); return; }
  const newSalt = randomSaltHex();
  await window.storage.set('frequencia-senha-salt', newSalt, true);
  await window.storage.set('frequencia-senha', await hashTextSalted(val, newSalt), true);
  c.errorFreq='';
  c.changingFreqPassword=false;
  render();
  alert('Senha do Controle de Frequência atualizada.');
}
async function saveBibliotecaPassword(){
  const c = state.coordenador;
  c.changingBibliotecaPassword = true;
  const val = document.getElementById('biblioteca-new-password-input').value;
  const val2 = document.getElementById('biblioteca-new-password2-input').value;
  if(val.length<4){ c.errorBiblioteca='A nova senha deve ter pelo menos 4 caracteres.'; render(); return; }
  if(val!==val2){ c.errorBiblioteca='As senhas não coincidem.'; render(); return; }
  const newSalt = randomSaltHex();
  await window.storage.set('biblioteca-senha-salt', newSalt, true);
  await window.storage.set('biblioteca-senha', await hashTextSalted(val, newSalt), true);
  c.errorBiblioteca='';
  c.changingBibliotecaPassword=false;
  render();
  alert('Senha da Biblioteca atualizada.');
}
async function submitFreqMonitorLogin(){
  const f = state.freqMonitor;
  const val = document.getElementById('freq-senha-input').value;
  const lockCheck = await checkLoginLock('frequencia', 'global');
  if(lockCheck.locked){ f.error = loginLockMessage(lockCheck.minutos); render(); return; }
  let storedHash = null, storedSalt = null;
  try{ const r = await window.storage.get('frequencia-senha', true); storedHash = r.value; }catch(e){}
  try{ const r2 = await window.storage.get('frequencia-senha-salt', true); storedSalt = r2.value; }catch(e){}
  let ok = false;
  if(storedHash){
    if(storedSalt){
      ok = (await hashTextSalted(val, storedSalt)) === storedHash;
    } else {
      ok = (await hashText(val)) === storedHash;
      if(ok){
        const newSalt = randomSaltHex();
        await window.storage.set('frequencia-senha-salt', newSalt, true);
        await window.storage.set('frequencia-senha', await hashTextSalted(val, newSalt), true);
      }
    }
  } else { ok = (val === 'freq123'); }
  if(ok){
    await clearLoginFailures('frequencia', 'global');
    f.session = true; f.error='';
    render();
    resetIdleLogoutTimer();
    loadFreqMonitorTurmas();
  } else { f.error = 'Senha incorreta.'; await registerLoginFailure('frequencia', 'global'); render(); }
}
async function loadFreqMonitorTurmas(){
  const f = state.freqMonitor;
  f.turmasLoading = true; render();
  try{ const r = await window.storage.get('turmas', true); f.turmas = JSON.parse(r.value); }
  catch(e){ f.turmas = []; }
  f.turmasLoading = false;
  render();
}
function renderFreqMonitorLogin(){
  const f = state.freqMonitor;
  return `
    <button class="btn btn-ghost btn-sm voltar-landing" data-action="goto-landing">← Voltar</button>
    <div class="card">
      <h2>Controle de Frequência</h2>
      <p class="muted">Área dos monitores para a leitura da carteirinha dos alunos nas turmas da manhã.</p>
      <label>Senha</label>
      <input type="password" id="freq-senha-input" placeholder="Senha">
      ${f.error ? `<p class="err">${esc(f.error)}</p>` : ''}
      <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="freq-login-submit">Entrar</button>
    </div>
  `;
}
function renderFreqMonitor(){
  const f = state.freqMonitor;
  if(!f.session) return renderFreqMonitorLogin();
  const topBar = `
    <div class="row" style="align-items:center; justify-content:space-between; margin-bottom:10px;">
      <span class="muted" style="font-size:.85rem;">Controle de Frequência</span>
      <div class="row" style="flex:0 0 auto; gap:6px;">
        <button class="btn ${f.subview==='bipar'?'btn-primary':'btn-ghost'} btn-sm" data-action="freq-monitor-subview" data-sub="bipar">🪪 Bipar</button>
        <button class="btn ${f.subview==='painel'?'btn-primary':'btn-ghost'} btn-sm" data-action="freq-monitor-subview" data-sub="painel">📊 Painel</button>
        <button class="btn btn-ghost btn-sm" data-action="freq-logout">Sair</button>
      </div>
    </div>
  `;
  let content;
  if(f.turmasLoading){
    content = `<div class="card"><div class="spinner"></div></div>`;
  } else if(f.subview==='painel'){
    content = renderFreqPainel(state.freqMonitor.painel, state.freqMonitor.turmas);
  } else {
    content = renderChamada(['Manhã','Integral'], false);
  }
  return topBar + content;
}
__parteOk('temporada');
