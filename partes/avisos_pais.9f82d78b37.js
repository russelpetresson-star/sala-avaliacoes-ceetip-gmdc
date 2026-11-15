/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "avisos_pais" */
function avpDataBR(d){ var p = String(d||'').split('-'); return p.length===3 ? p[2] + '/' + p[1] : String(d||''); }
function avpSegunda(d){ var x = new Date(d + 'T12:00:00'); var dw = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dw);
  return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0'); }
function avpNome(n){
  var s = String(n||'').trim().replace(/\s+/g,' ');
  if(!s) return '';
  if(s !== s.toUpperCase()) return s;
  var minus = ['da','de','do','das','dos','e'];
  return s.toLowerCase().split(' ').map(function(w, i){ return (i>0 && minus.indexOf(w)>=0) ? w : w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
}
function avpTelefone(t, ddd){
  var d = String(t||'').replace(/\D+/g,'');
  if(!d) return '';
  d = d.replace(/^0+/, '');
  if(d.length===8 || d.length===9) d = (ddd||'79') + d;
  if(d.length===10 || d.length===11) d = '55' + d;
  if(!/^55\d{10,11}$/.test(d)) return '';
  return d;
}
function avpPreencher(modelo, v){
  return String(modelo||'').replace(/\{(\w+)\}/g, function(m, k){ return v[k]!==undefined && v[k]!==null ? String(v[k]) : m; });
}
function avpFaltasDoDia(dias, alunos, D, enviados){
  enviados = enviados || new Set();
  var regs = dias.filter(function(x){ return x && x.data <= D; }).sort(function(a, b){ return a.data < b.data ? -1 : a.data > b.data ? 1 : 0; });
  if(!regs.length || regs[regs.length-1].data !== D) return [];   // sem chamada no dia: nada a avisar
  var seg = avpSegunda(D);
  var sets = regs.map(function(r){ return { data:r.data, p: new Set(r.presentes||[]) }; });
  var out = [];
  (alunos||[]).forEach(function(a){
    var falta = function(i){ return !sets[i].p.has(a.id); };
    var ult = sets.length - 1;
    if(!falta(ult)) return;
    // sequência de faltas terminando hoje
    var ini = ult; while(ini-1 >= 0 && falta(ini-1)) ini--;
    var seq = sets.slice(ini).map(function(x){ return x.data; });
    // faltas desta semana (segunda até hoje)
    var semana = sets.filter(function(x, i){ return x.data >= seg && falta(i); }).map(function(x){ return x.data; });
    var jaFoi = function(tipo, datas){ return datas.some(function(d){ return enviados.has(d + '|' + a.id + '|' + tipo); }); };
    var semanaTodas = sets.filter(function(x){ return x.data >= seg; }).map(function(x){ return x.data; });
    if(semana.length >= 3 && !jaFoi('tres', semanaTodas)){ out.push({ studentId:a.id, tipo:'tres', datas: semana }); return; }
    if(semana.length >= 3) return;   // já avisou as 3 faltas desta semana
    if(seq.length >= 2 && !jaFoi('dois', seq) && !jaFoi('tres', seq)) out.push({ studentId:a.id, tipo:'dois', datas: seq.slice(-2) });
  });
  return out;
}
function avpTexto(tipo, textos, v){ return avpPreencher((textos && textos[tipo]) || AVP_TEXTOS_PADRAO[tipo], v); }
function avpLocalData(d){ d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function avpHora(ms){ const d = new Date(ms); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
function avpState(){ const c = state.coordenador; if(!c.avp) c.avp = { data: avpLocalData(), turmaId:'', aba:'entradas', soAtrasados:false, carregando:false, dados:null, msg:'', verTextos:false }; return c.avp; }
const AVP_CFG_PADRAO = { pausado:false, entradas:'todos', faltas:'manual', turmas:null };
async function avpLerJson(k, padrao){ try{ return JSON.parse((await window.storage.get(k, true)).value); }catch(e){ return padrao; } }
async function avpCarregar(){
  const st = avpState(); if(st.carregando) return; st.carregando = true; st.msg = ''; st.semChamada = []; render();
  try{
    if(!state.professor.turmas || !state.professor.turmas.length){ try{ await loadTurmas(); }catch(e){} }
    await ensureDiasLetivosLoaded(); await ensureTurnoHorariosLoaded();
    const D = st.data;
    const turmas = fmTurmasPainel().filter(t => !st.turmaId || t.id===st.turmaId);
    // dias para as regras de falta: últimos 14 dias corridos que são letivos
    const datas = []; const base = new Date(D + 'T12:00:00');
    for(let i=0; i<14; i++){ const x = new Date(base); x.setDate(x.getDate() - i); const ds = avpLocalData(x); if(isDiaLetivo(ds)) datas.push(ds); }
    const [contatosRaw, textos, cfg, status, envMes1, envMes2] = await Promise.all([
      window.storage.list('busca-ativa-aluno:', true).catch(() => ({ values:{} })),
      avpLerJson('avisos-pais-textos', {}), avpLerJson('robo-whatsapp-config', {}), avpLerJson('robo-whatsapp-status', null),
      window.storage.list('aviso-pais:' + D.slice(0,7), true).catch(() => ({ values:{} })),
      datas.length && datas[datas.length-1].slice(0,7)!==D.slice(0,7) ? window.storage.list('aviso-pais:' + datas[datas.length-1].slice(0,7), true).catch(() => ({ values:{} })) : Promise.resolve({ values:{} }),
    ]);
    const contatos = {}; Object.entries(contatosRaw.values||{}).forEach(([k, v]) => { try{ contatos[k.slice('busca-ativa-aluno:'.length)] = JSON.parse(v); }catch(e){} });
    const avisos = {}; [envMes1, envMes2].forEach(r => Object.entries(r.values||{}).forEach(([k, v]) => { try{ avisos[k.slice('aviso-pais:'.length)] = JSON.parse(v); }catch(e){} }));
    const enviados = new Set(Object.keys(avisos).map(k => { const [d, sid, tipo] = k.split(':'); return d + '|' + sid + '|' + tipo; }));
    const tx = Object.assign({}, AVP_TEXTOS_PADRAO, textos||{});
    const linhas = [];
    for(const t of turmas){
      const regs = (await Promise.all(datas.map(async ds => { try{ const v = JSON.parse((await window.storage.get(`chamada:${t.id}:${ds}`, true)).value); return { data: ds, lista: v.presentes||[] }; }catch(e){ return null; } }))).filter(Boolean);
      const hoje = regs.find(r => r.data===D);
      const alunos = t.students||[];
      const porId = {}; alunos.forEach(s => { porId[s.id] = s; });
      const cfgT = (state.turnoHorarios.map||{})[t.turno] || {};
      const linha = (s, tipo, extra) => { const ct = contatos[s.id] || {}; const tel = avpTelefone(ct.telefone);
        const v = Object.assign({ aluno: avpNome(s.name), entrada: cfgT.entrada || '' }, extra||{});
        const ja = avisos[`${D}:${s.id}:${tipo}`] || null;
        return { sid: s.id, nome: s.name, turmaId: t.id, turmaNome: t.name, tipo, texto: avpTexto(tipo, tx, v), tel, telBruto: ct.telefone||'', resp: ct.nomeResponsavel||'', autoriza: !!ct.autorizaWhatsapp, aviso: ja, hora: extra && extra.hora }; };
      if(hoje){
        hoje.lista.slice().sort((a, b) => (a.horario||0) - (b.horario||0)).forEach(r => { const s = porId[r.studentId]; if(!s) return;
          linhas.push(linha(s, r.status==='atrasado' ? 'atrasado' : 'entrada', { hora: avpHora(r.horario) })); });
        avpFaltasDoDia(regs.map(r => ({ data: r.data, presentes: r.lista.map(x => x.studentId) })), alunos, D, enviados).forEach(f => { const s = porId[f.studentId]; if(!s) return;
          linhas.push(linha(s, f.tipo, f.tipo==='dois' ? { data1: avpDataBR(f.datas[0]), data2: avpDataBR(f.datas[1]) } : {})); });
      }
      if(!hoje && isDiaLetivo(D)) st.semChamada.push(t.name);
    }
    st.dados = { D, linhas, contatos, textos: tx, cfg: Object.assign({}, AVP_CFG_PADRAO, cfg||{}), status, turmasCarregadas: turmas.map(t => t.id) };
  }catch(e){ st.msg = 'Não foi possível montar a fila: ' + (e && e.message || e); }
  st.carregando = false; render();
}
function avpRoboOnline(status){ return !!(status && status.em && Date.now() - status.em < 3*60*1000); }
function avpAbrirWhats(l){
  const url = `https://wa.me/${l.tel}?text=${encodeURIComponent(l.texto)}`;
  try{ window.open(url, '_blank', 'noopener'); }catch(e){}
  window.__avpUltimoLink = url;
}
async function avpMarcar(l, via){
  const st = avpState(); const D = st.dados.D;
  const doc = { tipo: l.tipo, studentId: l.sid, turmaId: l.turmaId, aluno: l.nome, telefone: l.tel, texto: l.texto, status:'enviado', via: via||'manual', por:'coordenação', em: Date.now() };
  await window.storage.set(`aviso-pais:${D}:${l.sid}:${l.tipo}`, JSON.stringify(doc), true);
  l.aviso = doc;
}
async function avpSalvarContato(sid, patch){
  const novo = await buscaAtivaSalvarAlunoDoc(sid, Object.assign({ updatedAt: Date.now(), updatedBy:'coordenacao' }, patch));
  const st = avpState(); if(st.dados){ st.dados.contatos[sid] = novo; st.dados.linhas.filter(l => l.sid===sid).forEach(l => { l.tel = avpTelefone(novo.telefone); l.telBruto = novo.telefone||''; l.autoriza = !!novo.autorizaWhatsapp; }); }
  return novo;
}
async function avpSalvarCfg(patch){
  const st = avpState(); const cfg = Object.assign({}, st.dados ? st.dados.cfg : AVP_CFG_PADRAO, patch, { atualizadoEm: Date.now() });
  await window.storage.set('robo-whatsapp-config', JSON.stringify(cfg), true); if(st.dados) st.dados.cfg = cfg;
}
function avpListaAtual(){
  const st = avpState(); if(!st.dados) return [];
  const L = st.dados.linhas;
  if(st.aba==='entradas') return L.filter(l => (l.tipo==='entrada' || l.tipo==='atrasado') && (!st.soAtrasados || l.tipo==='atrasado'));
  if(st.aba==='faltas') return L.filter(l => l.tipo==='dois' || l.tipo==='tres');
  return [];
}
function avpPodeEnviar(l){ return !!(l.tel && l.autoriza); }
function avpStatusHtml(l){
  if(!l.aviso) return avpPodeEnviar(l) ? '<span class="muted">pendente</span>' : `<span style="color:#b3261e;">${!l.tel ? 'sem telefone' : 'sem autorização'}</span>`;
  const a = l.aviso; const rot = { 'na fila':'⏳ na fila do robô', enviado:'✅ enviado', entregue:'✅✅ entregue', lido:'💙 lido', falhou:'⚠️ falhou', 'sem whatsapp':'⚠️ número sem WhatsApp' }[a.status] || a.status;
  return `<span title="${esc(a.erro||'')}">${rot}</span> <span class="muted" style="font-size:.75rem;">${a.via==='robo' ? '🤖 robô' : '👤 manual'}${a.em ? ' · ' + avpHora(a.em) : ''}</span>`;
}
function renderAvisosPais(){
  const st = avpState();
  if(!st.dados && !st.carregando) setTimeout(avpCarregar, 0);
  const turmas = fmTurmasPainel();
  const topo = `<div class="card" data-avp-card>
    <h2>📲 Avisos aos pais por WhatsApp</h2>${fmChipDemo()}
    <p class="muted">A fila do dia vem da chamada por carteirinha e dos telefones da Busca Ativa. O robô do WhatsApp (computador da escola) envia sozinho; quando ele está desligado, toque em <b>Enviar</b> para abrir o WhatsApp com a mensagem pronta. Só recebem os responsáveis que autorizaram.</p>
    <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div><label>Dia</label><input type="date" data-avp-sel="data" value="${esc(st.data)}"></div>
      <div><label>Turma</label><select data-avp-sel="turma"><option value="">Todas</option>${turmas.map(t => `<option value="${esc(t.id)}" ${st.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>
      <button class="btn btn-ghost btn-sm" data-avp="atualizar" style="width:auto;">🔄 Atualizar</button>
      <button class="btn btn-ghost btn-sm" data-avp="termo" style="width:auto;">🖨️ Termo de autorização</button>
      <button class="btn btn-ghost btn-sm" data-avp="textos" style="width:auto;">✏️ Textos das mensagens</button>
    </div>
    ${st.msg ? `<p class="err" style="margin-top:8px;">${esc(st.msg)}</p>` : ''}${st.simulado ? `<div class="q-card" style="margin-top:8px;background:#FFF4D6;">${esc(st.simulado)}</div>` : ''}
  </div>`;
  if(st.carregando || !st.dados) return topo + '<div class="card"><div class="spinner"></div><p class="muted" style="text-align:center;">Montando a fila do dia…</p></div>';
  const d = st.dados, L = d.linhas, cfg = d.cfg, on = avpRoboOnline(d.status);
  const ent = L.filter(l => l.tipo==='entrada' || l.tipo==='atrasado'), atr = L.filter(l => l.tipo==='atrasado'), fal = L.filter(l => l.tipo==='dois' || l.tipo==='tres');
  const feitos = ls => ls.filter(l => l.aviso).length;
  const alunosTodos = fmTurmasPainel().filter(t => !st.turmaId || t.id===st.turmaId).flatMap(t => (t.students||[]).map(s => ({ s, t })));
  const semContato = alunosTodos.filter(({ s }) => { const c = d.contatos[s.id]||{}; return !avpTelefone(c.telefone) || !c.autorizaWhatsapp; });
  const tile = (aba, icone, valor, rot, sub, cor, extra) => { const ativo = st.aba===aba && (aba!=='entradas' || !!extra===!!st.soAtrasados);
    return `<button class="card" data-avp-aba="${aba}" ${extra||''} style="flex:1 1 150px;margin:0;padding:12px;text-align:left;cursor:pointer;border:2px solid ${ativo ? cor : 'transparent'};">
      <div style="font-size:1.5rem;font-weight:800;color:${cor};line-height:1;">${icone} ${valor}</div><div style="font-size:.85rem;font-weight:600;margin-top:4px;">${rot}</div><div class="muted" style="font-size:.75rem;">${sub}</div></button>`; };
  const robo = `<div class="card" data-avp-robo style="border-left:5px solid ${cfg.pausado ? '#e07b24' : on ? '#2e7d32' : '#b3261e'};">
    <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center;">
      <div><b style="font-size:1.05rem;">${cfg.pausado ? '⏸️ Robô pausado' : on ? '🟢 Robô ligado' : '🔴 Robô desligado'}</b>
        <div class="muted" style="font-size:.82rem;">${d.status && d.status.em ? `Último sinal às ${avpHora(d.status.em)} · ${d.status.enviadosHoje||0} enviada(s) hoje · ${d.status.fila||0} na fila${d.status.modoTeste ? ' · <b>modo de teste</b>' : ''}${d.status.numero ? ' · número ' + esc(String(d.status.numero)) : ''}` : 'O robô ainda não deu sinal. Enquanto isso, use os botões Enviar.'}${cfg.motivoPausa ? ' · ' + esc(cfg.motivoPausa) : ''}${d.status && d.status.ultimoErro ? `<br>⚠️ ${esc(String(d.status.ultimoErro))}` : ''}</div></div>
      <button class="btn ${cfg.pausado ? 'btn-primary' : 'btn-ghost'} btn-sm" data-avp="pausa" style="width:auto;">${cfg.pausado ? '▶️ Retomar envios' : '⏸️ Pausar robô'}</button>
    </div>
    <details style="margin-top:8px;"><summary style="cursor:pointer;font-weight:600;font-size:.9rem;">⚙️ O que o robô envia</summary>
      <div class="row" style="gap:14px;flex-wrap:wrap;margin-top:8px;">
        <div><label>Avisos de entrada</label><select data-avp-cfg="entradas"><option value="todos" ${cfg.entradas==='todos'?'selected':''}>Para todos os pais</option><option value="atrasados" ${cfg.entradas==='atrasados'?'selected':''}>Só para os atrasados</option><option value="nenhum" ${cfg.entradas==='nenhum'?'selected':''}>Nenhum</option></select></div>
        <div><label>Avisos de falta</label><select data-avp-cfg="faltas"><option value="manual" ${cfg.faltas!=='robo'?'selected':''}>Fila manual (recomendado)</option><option value="robo" ${cfg.faltas==='robo'?'selected':''}>Robô envia às 10h e às 15h</option></select></div>
      </div>
      <div style="margin-top:8px;"><label>Turmas atendidas pelo robô (aquecimento: comece com 1 turma, depois 3, depois todas)</label>
        <div class="row" style="gap:6px;flex-wrap:wrap;">${(state.professor.turmas||[]).filter(t => !t.formacao).map(t => { const marc = !cfg.turmas || cfg.turmas.includes(t.id); return `<label style="display:inline-flex;gap:4px;align-items:center;border:1px solid #ddd;border-radius:8px;padding:3px 8px;font-size:.85rem;"><input type="checkbox" data-avp-turma-robo="${esc(t.id)}" ${marc?'checked':''} style="width:auto;"> ${esc(t.name)}</label>`; }).join('')}</div></div>
    </details>
  </div>`;
  const tiles = `<div class="row" style="gap:10px;flex-wrap:wrap;margin:10px 0;">
    ${tile('entradas', '🚪', ent.length, 'Entradas hoje', `${feitos(ent)} avisada(s)`, '#2e7d32')}
    ${tile('entradas', '⏰', atr.length, 'Atrasados', `${feitos(atr)} avisado(s)`, '#e07b24', 'data-avp-atr="1"')}
    ${tile('faltas', '📅', fal.length, 'Avisos de falta', `${fal.filter(l => l.tipo==='dois').length} de 2 seguidas · ${fal.filter(l => l.tipo==='tres').length} de 3 na semana`, '#b3261e')}
    ${tile('contatos', '📵', semContato.length, 'Sem telefone ou autorização', 'não recebem avisos', '#888')}
  </div>`;
  let corpo = '';
  if(st.aba==='contatos'){
    const comTel = semContato.filter(({ s }) => avpTelefone((d.contatos[s.id]||{}).telefone));
    corpo = `<div class="card"><h3 style="margin-top:0;">📵 Sem telefone ou sem autorização (${semContato.length})</h3>
      <p class="muted" style="font-size:.85rem;">Marque “Autoriza” só depois de receber o termo assinado pelo responsável. O telefone pode ter DDD ou não (sem DDD, o app usa 79).</p>
      ${comTel.length ? `<button class="btn btn-ghost btn-sm" data-avp="autorizar-todos" style="width:auto;margin-bottom:8px;">✅ Autorizar os ${comTel.length} que já têm telefone (termos recebidos)</button>` : ''}
      <div class="table-scroll"><table data-avp-contatos><tr><th>Aluno</th><th>Turma</th><th>Responsável</th><th>Telefone</th><th>Autoriza</th><th></th></tr>
      ${semContato.slice(0, 400).map(({ s, t }) => { const c = d.contatos[s.id]||{}; return `<tr><td>${esc(s.name)}</td><td>${esc(t.name)}</td>
        <td><input data-avp-resp="${esc(s.id)}" value="${esc(c.nomeResponsavel||'')}" placeholder="Nome" style="min-width:120px;"></td>
        <td><input data-avp-tel="${esc(s.id)}" value="${esc(c.telefone||'')}" placeholder="(79) 9…" style="min-width:120px;">${c.telefone && !avpTelefone(c.telefone) ? '<br><span style="color:#b3261e;font-size:.75rem;">número inválido</span>' : ''}</td>
        <td style="text-align:center;"><input type="checkbox" data-avp-aut="${esc(s.id)}" ${c.autorizaWhatsapp?'checked':''} style="width:auto;"></td>
        <td><button class="btn btn-ghost btn-sm" data-avp="salvar-contato" data-sid="${esc(s.id)}" style="width:auto;">Salvar</button></td></tr>`; }).join('') || '<tr><td colspan="6"><div class="empty">Todos os alunos têm telefone e autorização. 🎉</div></td></tr>'}
      </table></div></div>`;
  } else {
    const lista = avpListaAtual();
    const pend = lista.filter(l => !l.aviso && avpPodeEnviar(l));
    corpo = `<div class="card"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center;">
        <h3 style="margin:0;">${st.aba==='faltas' ? '📅 Avisos de falta' : st.soAtrasados ? '⏰ Entradas com atraso' : '🚪 Entradas do dia'} · ${lista.length}</h3>
        ${pend.length ? `<button class="btn btn-primary btn-sm" data-avp="proximo" style="width:auto;">▶️ Enviar o próximo (${pend.length} pendente${pend.length>1?'s':''})</button>` : ''}
      </div>
      ${st.semChamada && st.semChamada.length ? `<p class="muted" style="font-size:.82rem;">Sem chamada registrada neste dia: ${st.semChamada.map(esc).join(', ')}.</p>` : ''}
      ${!isDiaLetivo(d.D) ? '<p class="muted">Dia não letivo: não há avisos.</p>' : ''}
      <div class="table-scroll"><table data-avp-tabela><tr><th>Aluno</th><th>Turma</th><th>Aviso</th><th>Mensagem</th><th>Situação</th><th></th></tr>
      ${lista.map(l => { const i = d.linhas.indexOf(l); return `<tr data-avp-linha="${i}">
        <td>${esc(l.nome)}${l.resp ? `<br><span class="muted" style="font-size:.75rem;">${esc(l.resp)}</span>` : ''}</td><td>${esc(l.turmaNome)}</td>
        <td><span class="pill" style="background:${l.tipo==='entrada' ? '#c8f0c8' : l.tipo==='atrasado' ? '#ffe0b2' : '#f6c9c4'};color:#2b1a1d;font-size:.72rem;font-family:inherit;letter-spacing:0;white-space:nowrap;">${AVP_TIPOS[l.tipo]}</span></td>
        <td style="font-size:.82rem;max-width:380px;">${esc(l.texto)}</td><td style="font-size:.82rem;">${avpStatusHtml(l)}</td>
        <td style="white-space:nowrap;">${avpPodeEnviar(l) ? `<button class="btn ${l.aviso ? 'btn-ghost' : 'btn-primary'} btn-sm" data-avp="enviar" data-i="${i}" style="width:auto;">${l.aviso ? 'Reenviar' : 'Enviar'}</button>` : `<button class="btn btn-ghost btn-sm" data-avp-aba="contatos" style="width:auto;">Cadastrar</button>`}</td></tr>`; }).join('') || `<tr><td colspan="6"><div class="empty">${st.aba==='faltas' ? 'Nenhum aviso de falta para este dia.' : 'Nenhuma entrada registrada neste dia.'}</div></td></tr>`}
      </table></div></div>`;
  }
  const textos = st.verTextos ? `<div class="card" data-avp-textos><h3 style="margin-top:0;">✏️ Textos das mensagens</h3>
      <p class="muted" style="font-size:.85rem;">Campos: {aluno}, {hora}, {entrada} (horário de entrada do turno), {data1} e {data2} (as duas faltas). O robô usa os mesmos textos.</p>
      ${Object.keys(AVP_TIPOS).map(k => `<label>${AVP_TIPOS[k]}</label><textarea data-avp-texto="${k}" rows="2" style="width:100%;">${esc(d.textos[k])}</textarea>`).join('')}
      <div class="row" style="gap:8px;margin-top:8px;"><button class="btn btn-primary btn-sm" data-avp="salvar-textos" style="width:auto;">Salvar textos</button><button class="btn btn-ghost btn-sm" data-avp="textos-padrao" style="width:auto;">Voltar aos textos aprovados</button></div></div>` : '';
  return topo + robo + tiles + textos + corpo;
}
function avpTermoHtml(){
  const st = avpState(); const turmas = (state.professor.turmas||[]).filter(t => !st.turmaId || t.id===st.turmaId);
  const num = st.dados && st.dados.status && st.dados.status.numero ? String(st.dados.status.numero) : '______________________';
  const um = (nome, turma) => `<div class="termo"><h3>CEETIP Gov. Marcelo Déda Chagas — Autorização para avisos por WhatsApp</h3>
    <p>Eu, ____________________________________________, responsável pelo(a) estudante <b>${esc(nome||'____________________________')}</b>${turma ? `, da turma <b>${esc(turma)}</b>` : ''}, autorizo o CEETIP Gov. Marcelo Déda Chagas a enviar, pelo WhatsApp, avisos sobre a entrada do(a) estudante na escola (com o horário e se chegou atrasado) e sobre faltas.</p>
    <p>Telefone (WhatsApp) para os avisos: ( ____ ) _______________________</p>
    <p>Peço que salvem no celular o número da escola: <b>${esc(num)}</b> (CEETIP Gov. Marcelo Déda Chagas – avisos). Os dados serão usados só para esses avisos (Lei Geral de Proteção de Dados, Lei 13.709/2018). A autorização pode ser cancelada a qualquer momento na coordenação.</p>
    <p style="margin-top:22px;">Carmópolis/SE, ____/____/________ &nbsp;&nbsp; Assinatura: _________________________________</p></div>`;
  const corpo = turmas.length ? turmas.flatMap(t => (t.students||[]).slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(s => um(s.name, t.name))).join('') || um('', '') : um('', '');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Termo de autorização – avisos por WhatsApp</title>
    <style>body{font-family:Arial,sans-serif;color:#222;margin:0;padding:12mm;} .termo{border:1px solid #6B1F2E;border-radius:6px;padding:8mm 10mm;margin-bottom:8mm;page-break-inside:avoid;font-size:11pt;line-height:1.45;} h3{color:#6B1F2E;margin:0 0 6px;font-size:13pt;} .termo:nth-child(2n){page-break-after:always;}</style>
    </head><body>${corpo}<script>setTimeout(function(){ window.print(); }, 400);<\/script></body></html>`;
}
__parteOk('avisos_pais');
