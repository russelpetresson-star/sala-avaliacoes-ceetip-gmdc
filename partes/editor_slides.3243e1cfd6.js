/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "editor_slides" */
const SED_CAMPOS = ['titulo','pergunta','ideia','pontos','destaque','conceito','atividade','nuvem','debate','relampago','vf','figuras','esquema','mapa','anterior','abertura','extras'];
function sedDono(){ const p = state.professor; return state.view==='coordenador' ? 'coord' : ((p.session && p.session.id) || 'coord'); }
function sedChave(planoId, n){ return `plano-slides-ed:${planoId}:${n}:${sedDono()}`; }
function avAplicarEdicao(d, ed){
  if(!d || !ed || !ed.campos) return d;
  const out = Object.assign({}, d);
  SED_CAMPOS.forEach(k => { if(ed.campos[k]!==undefined) out[k] = ed.campos[k]; });
  return out;
}
function avSlideChave(sl){ return sl.t + (sl.t==='figura' ? ':' + sl.i : sl.t==='caderno' ? ':' + sl.k : sl.t==='extra' ? ':' + sl.id : ''); }
function avOrdenar(L, ed, d){
  const extras = ((d && d.extras) || []).filter(x => x && x.id);
  const ordem = (ed && Array.isArray(ed.ordem)) ? ed.ordem : null;
  if(!ordem && !extras.length) return L;
  const grupos = new Map(); const chavesOrig = [];
  L.forEach(sl => { const k = avSlideChave(sl); if(!grupos.has(k)){ grupos.set(k, []); chavesOrig.push(k); } grupos.get(k).push(sl); });
  extras.forEach(x => { const k = 'extra:' + x.id; if(!grupos.has(k)) grupos.set(k, [{ t:'extra', id: x.id }]); });
  let seq = (ordem || []).filter(k => grupos.has(k) && k!=='capa');
  seq = seq.filter((k, i) => seq.indexOf(k)===i);
  chavesOrig.forEach((k, i) => {
    if(k==='capa' || seq.includes(k)) return;
    let pos = 0;
    for(let j=i-1; j>=0; j--){ const q = seq.indexOf(chavesOrig[j]); if(q>=0){ pos = q+1; break; } }
    seq.splice(pos, 0, k);
  });
  extras.forEach(x => { const k = 'extra:' + x.id; if(!seq.includes(k)) seq.push(k); });
  const out = (grupos.get('capa') || []).slice();
  seq.forEach(k => out.push(...grupos.get(k)));
  return out;
}
function avSlidesFinal(d, opts, ed){ return avOrdenar(avFiltrarOcultos(avMontarSlides(d, opts), ed), ed, d); }
function avFiltrarOcultos(L, ed){
  const oc = new Set((ed && ed.ocultos) || []);
  if(!oc.size) return L;
  return L.filter(sl => sl.t==='capa' || /^prior-/.test(sl.t) || !oc.has(avSlideChave(sl)));
}
async function sedCarregar(planoId, n){
  const s = planoState(); s.sedCache = s.sedCache || {};
  const k = sedChave(planoId, n);
  if(!(k in s.sedCache)){ try{ s.sedCache[k] = JSON.parse((await window.storage.get(k, true)).value); }catch(e){ s.sedCache[k] = null; } }
  return s.sedCache[k];
}
const SED_NOMES = { capa:'Capa', 'prior-abre':'⭐ Descritor de hoje (obrigatório)', 'prior-q':'⭐ Desafio do descritor (obrigatório)', 'prior-q-res':'⭐ Resolvendo o desafio (obrigatório)', 'mapa-inicio':'Mapa da aula (início)', retomada:'Na aula passada', nuvem:'Nuvem de palavras', aprender:'O que vamos aprender', leitura:'Leitura', caderno:'Caderno (mapa)', destaque:'Destaque', figura:'Figura', esquema:'Esquema', relampago:'Pergunta-relâmpago', resposta:'Resposta da relâmpago', conceito:'Conceito (anote no caderno)', vf:'V ou F relâmpago', pratica:'Hora de praticar', grupo:'Atividade em grupo', 'mapa-final':'Mapa da aula (final)', volte:'Volte à pergunta inicial', termometro:'Termômetro', conexoes:'Conexões na área', mat:'Matemática de base', 'mat-res':'Matemática de base (resposta)', video:'Vídeo do YouTube', proxima:'Próxima aula' };
function sedNomeSlide(sl, d){
  if(sl.t==='figura') return 'Figura ' + (sl.i+1) + (d.figuras && d.figuras[sl.i] ? ': ' + (d.figuras[sl.i].titulo || d.figuras[sl.i].leg || '') : '');
  if(sl.t==='esquema') return 'Esquema' + (sl.passos>1 ? ` (passo ${sl.k+1}/${sl.passos})` : '');
  if(sl.t==='caderno') return 'Caderno: ramo ' + (sl.k+1);
  if(sl.t==='extra'){ const x = (d.extras||[]).find(e => e.id===sl.id); const ic = { video:'🎬 ', pergunta:'❓ ', comparar:'⚖️ ', livro:'📖 ' }[x && x.tipo] || '⭐ '; return ic + ((x && x.titulo) || 'Slide novo'); }
  return SED_NOMES[sl.t] || sl.t;
}
async function sedAbrir(turmaId, n){
  const s = planoState();
  const plano = s.planos[s.turmaPlano[turmaId]];
  const aula = plano && plano.aulas.find(a => a.n===n);
  if(!aula || !aula.slides) return;
  avInjetarCss();
  s.sedAberto = { carregando:true, n, turmaId, planoId: plano.id }; render();
  await avCarregarRecursos(aula.slides);
  const ed = await sedCarregar(plano.id, n);
  const cfg = await planoCfgCarregar(turmaId);
  const base = JSON.parse(JSON.stringify(aula.slides));
  const wd = JSON.parse(JSON.stringify(avAplicarEdicao(aula.slides, ed)));
  await avCarregarRecursos(wd);
  s.sedAberto = { n, turmaId, planoId: plano.id, base, wd, ocultos: ((ed && ed.ocultos) || []).slice(), ordem: (ed && Array.isArray(ed.ordem)) ? ed.ordem.slice() : null,
    imgsNovas: {}, imgsOrig: ((wd.extras||[]).map(x => x.img).filter(Boolean)), sel: 0, tinhaEdicao: !!ed, sujo: false, msg: '',
    opts: { leitura: (cfg.leitura||{})[n] || 0, grupo: (cfg.grupo||{})[n] || 0 } };
  render();
}
function sedLista(se){ return avOrdenar(avMontarSlides(se.wd, se.opts), { ordem: se.ordem }, se.wd); }
function sedChavesAtuais(se){ const ks = []; sedLista(se).forEach(sl => { const k = avSlideChave(sl); if(k!=='capa' && !ks.includes(k)) ks.push(k); }); return ks; }
function sedMover(k, dir){
  const se = planoState().sedAberto; if(!se) return;
  const ks = sedChavesAtuais(se); const i = ks.indexOf(k); const j = i + dir;
  if(i<0 || j<0 || j>=ks.length) return;
  [ks[i], ks[j]] = [ks[j], ks[i]];
  se.ordem = ks; se.sujo = true; se.msg = '';
  const L = sedLista(se); const ni = L.findIndex(sl => avSlideChave(sl)===k); if(ni>=0) se.sel = ni;
  render();
}
function sedNovoSlide(tipo){
  const se = planoState().sedAberto; if(!se) return;
  const L = sedLista(se); const atual = L[se.sel] ? avSlideChave(L[se.sel]) : 'capa';
  const ks = sedChavesAtuais(se);
  const id = cryptoId();
  const modelos = {
    video: { id, tipo:'video', titulo: 'Vídeo', url: '', ini: '', fim: '', pergunta: '' },
    pergunta: { id, tipo:'pergunta', titulo: 'Pergunta', texto: '', opcoes: ['', '', '', ''], correta: 0, explicacao: '' },
    comparar: { id, tipo:'comparar', titulo: 'Comparação', a: ['Lado A', ['', '']], b: ['Lado B', ['', '']] },
    livro: { id, tipo:'livro', titulo: 'Pausa para o livro', paginas: se.wd.paginas || '', atividade: '', min: 10 },
  };
  se.wd.extras = (se.wd.extras || []).concat([modelos[tipo] || { id, titulo: 'Novo slide', texto: '', img: null }]);
  const pos = atual==='capa' ? 0 : ks.indexOf(atual) + 1;
  ks.splice(pos, 0, 'extra:' + id);
  se.ordem = ks; se.sujo = true; se.msg = '';
  const L2 = sedLista(se); se.sel = Math.max(0, L2.findIndex(sl => sl.t==='extra' && sl.id===id));
  render();
}
function sedExcluirExtra(id){
  const se = planoState().sedAberto; if(!se) return;
  if(!confirm('Excluir este slide que você criou?')) return;
  se.wd.extras = (se.wd.extras || []).filter(x => x.id!==id);
  if(se.ordem) se.ordem = se.ordem.filter(k => k!=='extra:' + id);
  se.ocultos = se.ocultos.filter(k => k!=='extra:' + id);
  se.sujo = true; se.sel = Math.max(0, se.sel - 1); render();
}
function sedComprimirImagem(file){
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error('leitura'));
    r.onload = () => { const im = new Image(); im.onerror = () => rej(new Error('imagem'));
      im.onload = () => {
        let q = 0.78, max = 1280, url = '';
        for(let t=0; t<5; t++){
          const esc0 = Math.min(1, max / Math.max(im.width, im.height));
          const c = document.createElement('canvas'); c.width = Math.round(im.width*esc0); c.height = Math.round(im.height*esc0);
          const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
          url = c.toDataURL('image/jpeg', q);
          if(url.length < 450000) break;
          q -= 0.12; max = Math.round(max * 0.8);
        }
        res(url);
      };
      im.src = r.result; };
    r.readAsDataURL(file);
  });
}
const SED_PULAR = new Set(['tipo','icones','icone','fig','f','p','ar','n','cor','paginas','k','iconesCards']);
const SED_ROTULOS = { titulo:'Título', itens:'Item', a:'Lado A', b:'Lado B', centro:'Centro do mapa', ramos:'Ramo', t:'Texto', dica:'Dica', ideia:'Ideia', pontos:'Ponto', conceito:'Conceito', formula:'Fórmula', cards:'Cartão' };
function sedRotulo(path){
  return path.split('.').slice(1).map(x => /^\d+$/.test(x) ? String(Number(x)+1) : (SED_ROTULOS[x] || x)).join(' › ') || 'Texto';
}
function sedFolhas(obj, path, out){
  if(typeof obj==='string'){ out.push([path, obj]); return out; }
  if(Array.isArray(obj)){ obj.forEach((v, i) => sedFolhas(v, path + '.' + i, out)); return out; }
  if(obj && typeof obj==='object') Object.keys(obj).forEach(k => { if(!SED_PULAR.has(k)) sedFolhas(obj[k], path + '.' + k, out); });
  return out;
}
function sedCamposGenericos(obj, path, aviso){
  if(!obj) return '';
  const fs = sedFolhas(obj, path, []);
  return (aviso ? `<p class="muted" style="font-size:.8rem;margin:4px 0;">${aviso}</p>` : '') + fs.map(([pt, v]) => sedCampo(sedRotulo(pt), pt, v)).join('');
}
function sedPreviewHtml(se){
  const L = sedLista(se); const sl = L[Math.min(se.sel, L.length-1)] || L[0];
  return `<div class="av-slide" style="width:100%;">${avSlideHtml(se.wd, sl, { modo:'prof', n: se.n, revelado:true, minha:null, sess:{}, resp:{}, estudo:false, preview:true, mapaModelo:'estudar' })}</div>`;
}
function sedCampo(rotulo, path, valor, opts){
  opts = opts || {};
  const v = valor==null ? '' : String(valor);
  if(opts.area || v.length > 90) return `<label style="display:block;margin:6px 0 2px;font-size:.82rem;font-weight:600;">${rotulo}</label><textarea data-sed="${path}" rows="${opts.rows||2}" style="width:100%;">${esc(v)}</textarea>`;
  return `<label style="display:block;margin:6px 0 2px;font-size:.82rem;font-weight:600;">${rotulo}</label><input type="text" data-sed="${path}" value="${esc(v)}" style="width:100%;">`;
}
function sedCamposHtml(se, sl){
  const d = se.wd; const L = ['A','B','C','D','E'];
  switch(sl.t){
    case 'capa': return sedCampo('Título da aula', 'titulo', d.titulo) + sedCampo('Para começar (pergunta inicial — também aparece no slide “Volte à pergunta”)', 'pergunta', d.pergunta, { area:true });
    case 'volte': return sedCampo('Pergunta inicial (também aparece na capa)', 'pergunta', d.pergunta, { area:true });
    case 'aprender': return sedCampo('Ideia principal (título do slide)', 'ideia', d.ideia) + sedListaTextos('Ponto', 'pontos', d.pontos, 'Adicionar ponto (até 6)');
    case 'destaque': return d.destaque ? sedCampo('Destaque (texto grande)', 'destaque.0', d.destaque[0]) + sedCampo('Complemento', 'destaque.1', d.destaque[1], { area:true }) : '';
    case 'figura': { const f = (d.figuras||[])[sl.i]; if(!f) return '';
      return sedCampo('Título do slide', `figuras.${sl.i}.titulo`, f.titulo || f.leg) + sedCampo('Legenda', `figuras.${sl.i}.leg`, f.leg, { area:true })
        + sedCampo('Perguntas sobre a figura (uma por linha)', `figuras.${sl.i}.perguntas`, (f.perguntas||[]).join('\n'), { area:true, rows:4 }); }
    case 'relampago': case 'resposta': { const r = d.relampago || {};
      return sedCampo('Pergunta-relâmpago', 'relampago.texto', r.texto, { area:true })
        + (r.opcoes||[]).map((o,i) => sedCampo('Alternativa ' + L[i], 'relampago.opcoes.'+i, o)).join('')
        + `<label style="display:block;margin:6px 0 2px;font-size:.82rem;font-weight:600;">Alternativa certa</label><select data-sed="relampago.correta">${(r.opcoes||[]).map((o,i)=>`<option value="${i}" ${Number(r.correta)===i?'selected':''}>${L[i]}</option>`).join('')}</select>`
        + sedCampo('Por quê? (explicação mostrada depois)', 'relampago.explicacao', r.explicacao, { area:true }); }
    case 'conceito': return d.conceito ? sedCampo('Conceito', 'conceito.0', d.conceito[0]) + sedCampo('Definição para o caderno', 'conceito.1', d.conceito[1], { area:true }) : '';
    case 'nuvem': return sedCampo('Pergunta da nuvem de palavras', 'nuvem', d.nuvem, { area:true });
    case 'vf': return (d.vf||[]).map((it,i) => `<div style="border:1px solid #eee;border-radius:8px;padding:4px 8px;margin:6px 0;"><div style="text-align:right;margin-bottom:-24px;">${sedListaDelBtn('vf', i, d.vf.length)}</div>${sedCampo('Afirmação ' + (i+1), `vf.${i}.t`, it.t, { area:true })}
        <label style="display:block;margin:6px 0 2px;font-size:.82rem;font-weight:600;">Resposta</label><select data-sed="vf.${i}.v"><option value="1" ${it.v?'selected':''}>Verdadeiro</option><option value="0" ${!it.v?'selected':''}>Falso</option></select>
        ${sedCampo('Explicação', `vf.${i}.e`, it.e)}</div>`).join('') + sedListaAddBtn('vf', (d.vf||[]).length, 'Adicionar afirmação (até 8)');
    case 'pratica': case 'atividade': return sedCampo('Atividade do livro', 'atividade', d.atividade, { area:true });
    case 'grupo': return sedCampo('Proposta para o grupo', 'debate', d.debate, { area:true });
    case 'esquema': { const e = d.esquema; if(!e) return '';
      const aviso = '<p class="muted" style="font-size:.8rem;margin:4px 0;">Os textos do esquema (todos os passos). O desenho e os ícones continuam os mesmos.</p>';
      if(e.tipo==='linha' || e.tipo==='passos'){
        const nomes = e.tipo==='passos' ? ['Etapa', 'Resultado'] : ['Título', 'Texto', 'Destaque'];
        return aviso + sedCampo('Título do esquema', 'esquema.titulo', e.titulo) + (e.tipo==='passos' && e.formula!=null ? sedCampo('Fórmula', 'esquema.formula', e.formula) : '')
          + (e.itens||[]).map((it, i) => `<div style="border:1px solid #eee;border-radius:8px;padding:4px 8px;margin:6px 0;"><div class="row" style="justify-content:space-between;align-items:center;"><b style="font-size:.82rem;">Etapa ${i+1}</b>${sedListaDelBtn('esquema.itens', i, e.itens.length)}</div>${(Array.isArray(it) ? it : [it]).map((v, j) => sedCampo(nomes[j] || ('Texto ' + (j+1)), Array.isArray(it) ? `esquema.itens.${i}.${j}` : `esquema.itens.${i}`, v)).join('')}</div>`).join('')
          + sedListaAddBtn('esquema.itens', (e.itens||[]).length, 'Adicionar etapa (até 6)');
      }
      if(e.tipo==='comparar'){
        const lado = (k, nome) => `<div style="border:1px solid #eee;border-radius:8px;padding:4px 8px;margin:6px 0;">${sedCampo(nome + ' — título', `esquema.${k}.0`, (e[k]||[])[0])}${sedListaTextos('Item', `esquema.${k}.1`, (e[k]||[])[1], 'Adicionar item')}</div>`;
        return aviso + sedCampo('Título do esquema', 'esquema.titulo', e.titulo) + lado('a', 'Lado A') + lado('b', 'Lado B');
      }
      return sedCamposGenericos(e, 'esquema', 'Os textos do esquema (todos os passos). O desenho e os ícones continuam os mesmos.'); }
    case 'caderno': { if(!d.mapa) return ''; const rm = (d.mapa.ramos||[])[sl.k] || {}; const pre = 'mapa.ramos.' + sl.k;
      return sedCampo('Centro do mapa', 'mapa.centro', d.mapa.centro) + '<p class="muted" style="font-size:.8rem;margin:4px 0;">Este ramo do mapa da aula (o aluno copia no caderno).</p>'
        + sedCampo('Nome do ramo', pre + '.t', rm.t) + sedListaTextos('Palavra de ajuda', pre + '.itens', rm.itens, 'Adicionar palavra') + (rm.dica!=null ? sedCampo('Sugestão de desenho', pre + '.dica', rm.dica) : ''); }
    case 'mapa-inicio': case 'mapa-final': return sedCamposGenericos(d.mapa, 'mapa', 'Mapa da aula: os mesmos textos aparecem no início, nos slides de caderno e no final.');
    case 'retomada': return d.anterior ? sedCamposGenericos(d.anterior, 'anterior', 'Resumo da aula passada.') : (d.abertura ? sedCamposGenericos(d.abertura, 'abertura') : '<p class="muted" style="font-size:.85rem;">Este slide é montado automaticamente pelo app. Você pode escondê-lo.</p>');
    case 'extra': { const x = (d.extras||[]).find(e => e.id===sl.id); if(!x) return ''; const i = d.extras.indexOf(x);
      const excluir = `<p style="margin:10px 0 0;"><button class="btn btn-ghost btn-sm" data-action="sed-extra-excluir" data-id="${esc(x.id)}" style="width:auto;color:#a33131;border-color:#e3a1a1;">🗑️ Excluir este slide</button></p>`;
      const LT = ['A','B','C','D','E'];
      if(x.tipo==='pergunta') return sedCampo('Título do slide', `extras.${i}.titulo`, x.titulo) + sedCampo('Pergunta', `extras.${i}.texto`, x.texto, { area:true })
        + sedListaTextos('Alternativa', `extras.${i}.opcoes`, x.opcoes, 'Adicionar alternativa (até 5)')
        + `<label style="display:block;margin:6px 0 2px;font-size:.82rem;font-weight:600;">Alternativa certa</label><select data-sed="extras.${i}.correta">${(x.opcoes||[]).map((o,j)=>`<option value="${j}" ${Number(x.correta)===j?'selected':''}>${LT[j]}${o?' — '+esc(String(o).slice(0,40)):''}</option>`).join('')}</select>`
        + sedCampo('Por quê? (explicação mostrada depois)', `extras.${i}.explicacao`, x.explicacao, { area:true })
        + '<p class="muted" style="font-size:.8rem;margin:6px 0;">Na aula, os alunos respondem no tablet. Você clica em “Revelar resposta” no slide: aparece o gráfico das respostas, e quem respondeu ganha 1 ficha (2 se acertou).</p>' + excluir;
      if(x.tipo==='comparar'){
        const lado = (k, nome) => `<div style="border:1px solid #eee;border-radius:8px;padding:4px 8px;margin:6px 0;">${sedCampo(nome + ' — título', `extras.${i}.${k}.0`, (x[k]||[])[0])}${sedListaTextos('Item', `extras.${i}.${k}.1`, (x[k]||[])[1], 'Adicionar item')}</div>`;
        return sedCampo('Título do slide', `extras.${i}.titulo`, x.titulo) + lado('a', 'Coluna da esquerda') + lado('b', 'Coluna da direita') + excluir;
      }
      if(x.tipo==='livro') return sedCampo('Título do slide', `extras.${i}.titulo`, x.titulo) + sedCampo('Páginas do livro', `extras.${i}.paginas`, x.paginas)
        + sedCampo('O que fazer (atividade, leitura, exercício)', `extras.${i}.atividade`, x.atividade, { area:true, rows:3 })
        + `<label style="display:block;margin:6px 0 2px;font-size:.82rem;font-weight:600;">Tempo</label><select data-sed="extras.${i}.min">${[3,5,8,10,12,15,20,25,30].map(m=>`<option value="${m}" ${Number(x.min)===m?'selected':''}>${m} minutos</option>`).join('')}</select>`
        + '<p class="muted" style="font-size:.8rem;margin:6px 0;">Na aula, você clica em “Iniciar” e o cronômetro aparece no telão e nos tablets.</p>' + excluir;
      if(x.tipo==='video'){
        const salvos = (((planoState().videos||{})[se.planoId]||{})[se.n]) || [];
        const ok = ytIdDe(x.url);
        return sedCampo('Título do slide', `extras.${i}.titulo`, x.titulo)
          + sedCampo('Link do vídeo no YouTube', `extras.${i}.url`, x.url)
          + `<p style="font-size:.8rem;margin:2px 0;" data-sed-video-status>${x.url ? (ok ? '✅ Vídeo reconhecido.' : '⚠️ Não reconheci esse link. Use um link do YouTube (youtube.com/watch?v=… ou youtu.be/…).') : ''}</p>`
          + (salvos.length ? `<div style="margin:4px 0;font-size:.82rem;"><b>Ou escolha um vídeo salvo nesta aula:</b> ${salvos.map(v => `<button class="btn btn-ghost btn-sm" data-action="sed-video-escolher" data-id="${esc(x.id)}" data-url="${esc(v.url)}" data-t="${esc(v.t||'')}" style="width:auto;margin:2px;">🎬 ${esc(v.t||v.url)}</button>`).join('')}</div>` : '')
          + `<div class="row" style="gap:10px;"><div style="flex:1;">${sedCampo('Começar em (min:seg, opcional)', `extras.${i}.ini`, x.ini)}</div><div style="flex:1;">${sedCampo('Parar em (min:seg, opcional)', `extras.${i}.fim`, x.fim)}</div></div>`
          + sedCampo('Pergunta para pensar enquanto assiste (opcional)', `extras.${i}.pergunta`, x.pergunta, { area:true })
          + `<p class="muted" style="font-size:.8rem;margin:6px 0;">Na aula, o vídeo toca no telão (precisa de internet). Nos tablets aparece “Assista no telão”, para não sobrecarregar o Wi-Fi. No “Estudar”, o aluno pode assistir depois.</p>`
          + `<p style="margin:10px 0 0;"><button class="btn btn-ghost btn-sm" data-action="sed-extra-excluir" data-id="${esc(x.id)}" style="width:auto;color:#a33131;border-color:#e3a1a1;">🗑️ Excluir este slide</button></p>`;
      }
      return sedCampo('Título do slide', `extras.${i}.titulo`, x.titulo)
        + sedCampo('Texto (cada linha vira um tópico)', `extras.${i}.texto`, x.texto, { area:true, rows:5 })
        + `<label style="display:block;margin:8px 0 2px;font-size:.82rem;font-weight:600;">Imagem ou foto (opcional)</label>
           <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;"><label class="btn btn-ghost btn-sm" style="cursor:pointer;width:auto;">📷 ${x.img?'Trocar imagem':'Escolher imagem ou tirar foto'}<input type="file" accept="image/*" data-sed-img="${esc(x.id)}" style="display:none;"></label>
           ${x.img ? `<button class="btn btn-ghost btn-sm" data-action="sed-img-tirar" data-id="${esc(x.id)}" style="width:auto;">Tirar imagem</button>` : ''}</div>
           <p style="margin:12px 0 0;"><button class="btn btn-ghost btn-sm" data-action="sed-extra-excluir" data-id="${esc(x.id)}" style="width:auto;color:#a33131;border-color:#e3a1a1;">🗑️ Excluir este slide</button></p>`; }
  }
  return `<p class="muted" style="font-size:.85rem;">Este slide é montado automaticamente pelo app${sl.t==='leitura'||sl.t==='grupo' ? ' (o tempo é escolhido no quadro da aula)' : ''}. Você pode escondê-lo, se não quiser usar.</p>`;
}
function sedHtml(){
  const s = planoState(); const se = s.sedAberto;
  if(!se) return '';
  if(se.carregando) return `<div class="av-over" style="z-index:9500;"><div class="av-over-card"><div class="spinner"></div><p class="muted">Abrindo o editor de slides…</p></div></div>`;
  const L = sedLista(se); if(se.sel >= L.length) se.sel = L.length - 1;
  const sl = L[se.sel]; const oc = new Set(se.ocultos);
  const visiveis = L.filter(x => x.t==='capa' || !oc.has(avSlideChave(x))).length;
  const lista = L.map((x, i) => { const k = avSlideChave(x); const esc0 = oc.has(k) && x.t!=='capa';
    return `<div class="row" data-sed-item="${i}" style="align-items:center;gap:4px;padding:3px 4px;border-radius:6px;${i===se.sel?'background:#F3E7C0;':''}${esc0?'opacity:.45;':''}">
      <button class="btn btn-ghost btn-sm" data-action="sed-sel" data-i="${i}" style="flex:1;min-width:0;width:auto;text-align:left;border:none;background:transparent;padding:4px;font-size:.8rem;${esc0?'text-decoration:line-through;':''}">${i+1}. ${esc(sedNomeSlide(x, se.wd))}</button>
      ${x.t==='capa' || (i>0 && avSlideChave(L[i-1])===k) ? '' : `<button class="btn btn-ghost btn-sm" data-action="sed-mover" data-k="${esc(k)}" data-dir="-1" title="Subir" style="padding:2px 5px;width:auto;flex:0 0 auto;min-width:0;">↑</button><button class="btn btn-ghost btn-sm" data-action="sed-mover" data-k="${esc(k)}" data-dir="1" title="Descer" style="padding:2px 5px;width:auto;flex:0 0 auto;min-width:0;">↓</button>`}
      ${x.t==='capa' ? '' : `<button class="btn btn-ghost btn-sm" data-action="sed-ocultar" data-k="${esc(k)}" title="${esc0?'Mostrar este slide':'Esconder este slide'}" style="padding:2px 6px;width:auto;flex:0 0 auto;min-width:0;">${esc0?'🚫':'👁️'}</button>`}</div>`; }).join('');
  const escondido = oc.has(avSlideChave(sl)) && sl.t!=='capa';
  return `<div class="av-over" data-sed-editor style="z-index:9500;align-items:flex-start;overflow:auto;">
    <div class="av-over-card" style="width:min(1180px,100%);text-align:left;max-height:none;">
      <div class="row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <div><h3 style="margin:0;">✏️ Editar slides — Aula ${se.n}</h3><div class="muted" style="font-size:.8rem;">${visiveis} de ${L.length} slides aparecem. ${(() => { const ts = sedTurmasDoPlano(se.planoId); return ts.length ? `As mudanças valem para todas as suas turmas com este plano: <b>${esc(ts.join(', '))}</b>.` : 'As mudanças valem para as suas turmas com este plano.'; })()} O plano original não muda.</div></div>
        <div class="row" style="gap:6px;flex-wrap:wrap;">
          ${se.tinhaEdicao || se.sujo ? `<button class="btn btn-ghost btn-sm" data-action="sed-original">↩️ Voltar ao original</button>` : ''}
          ${se.tinhaEdicao ? `<button class="btn btn-ghost btn-sm" data-action="sed-copiar" title="Copiar esta edição para outra aula, para a outra versão do plano ou para outro professor">📋 Copiar…</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-action="sed-fechar">Fechar</button>
          <button class="btn btn-primary btn-sm" data-action="sed-salvar" ${se.salvando?'disabled':''}>${se.salvando?'Salvando…':'💾 Salvar'}</button>
        </div>
      </div>
      ${se.msg ? `<div style="margin:8px 0;padding:6px 10px;border-radius:8px;background:#e9f6ec;font-size:.85rem;" data-sed-msg>${esc(se.msg)}</div>` : ''}
      ${sedCopiarHtml(se)}
      <div style="display:grid;grid-template-columns:minmax(180px,250px) 1fr;gap:14px;margin-top:10px;" class="sed-grade">
        <div style="max-height:70vh;overflow:auto;border:1px solid #eee;border-radius:8px;padding:4px;">${lista}</div>
        <div>
          <div data-sed-preview style="${escondido?'opacity:.4;':''}">${sedPreviewHtml(se)}</div>
          ${escondido ? '<p class="muted" style="font-size:.85rem;margin:6px 0;">🚫 Este slide está escondido e não aparece na aula.</p>' : ''}
          <div class="row" style="gap:6px;margin:8px 0;"><button class="btn btn-ghost btn-sm" data-action="sed-sel" data-i="${Math.max(0, se.sel-1)}" ${se.sel===0?'disabled':''}>← Anterior</button><span class="muted" style="align-self:center;">${se.sel+1} / ${L.length}</span><button class="btn btn-ghost btn-sm" data-action="sed-sel" data-i="${Math.min(L.length-1, se.sel+1)}" ${se.sel>=L.length-1?'disabled':''}>Próximo →</button></div>
          <div class="row" data-sed-novos style="gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0 10px;padding:8px;border:1px dashed #d9cbb3;border-radius:10px;"><span style="font-size:.82rem;font-weight:600;">➕ Novo slide depois deste:</span>
            <button class="btn btn-ghost btn-sm" data-action="sed-novo" style="width:auto;" title="Título, tópicos e foto">📝 Texto e foto</button>
            <button class="btn btn-ghost btn-sm" data-action="sed-novo" data-tipo="video" style="width:auto;" title="Vídeo do YouTube no telão">🎬 Vídeo</button>
            <button class="btn btn-ghost btn-sm" data-action="sed-novo" data-tipo="pergunta" style="width:auto;" title="Múltipla escolha respondida nos tablets, com fichas">❓ Pergunta nos tablets</button>
            <button class="btn btn-ghost btn-sm" data-action="sed-novo" data-tipo="comparar" style="width:auto;" title="Duas colunas lado a lado">⚖️ Comparação</button>
            <button class="btn btn-ghost btn-sm" data-action="sed-novo" data-tipo="livro" style="width:auto;" title="Página e atividade do livro, com cronômetro">📖 Pausa para o livro</button></div>
          <div data-sed-campos>${sedCamposHtml(se, sl)}</div>
          <p class="muted" style="font-size:.78rem;margin:10px 0 0;">💡 Dica: escreva <code>*assim*</code> (entre asteriscos) para destacar uma palavra no slide.</p>
        </div>
      </div>
    </div></div>`;
}
function sedSetPath(obj, path, valor){
  const ps = path.split('.'); let o = obj;
  for(let i=0;i<ps.length-1;i++){ const k = /^\d+$/.test(ps[i]) ? Number(ps[i]) : ps[i]; if(o[k]==null) o[k] = /^\d+$/.test(ps[i+1]) ? [] : {}; o = o[k]; }
  const ult = /^\d+$/.test(ps[ps.length-1]) ? Number(ps[ps.length-1]) : ps[ps.length-1];
  o[ult] = valor;
}
function sedValor(el){
  const path = el.dataset.sed;
  if(path==='relampago.correta' || /^extras\.\d+\.(correta|min)$/.test(path)) return Number(el.value);
  if(/^vf\.\d+\.v$/.test(path)) return el.value==='1';
  if(/\.perguntas$/.test(path)) return el.value.split('\n').map(x => x.trim()).filter(Boolean);
  return el.value;
}
function sedDiferencas(se){
  const campos = {};
  SED_CAMPOS.forEach(k => { if(se.wd[k]!==undefined && JSON.stringify(se.wd[k])!==JSON.stringify(se.base[k])) campos[k] = se.wd[k]; });
  if(campos.extras && !campos.extras.length && !se.base.extras) delete campos.extras;
  return campos;
}
function sedOrdemParaSalvar(se){
  if(!se.ordem) return null;
  const atual = sedChavesAtuais(se);
  const padrao = []; avOrdenar(avMontarSlides(se.wd, se.opts), null, se.wd).forEach(sl => { const k = avSlideChave(sl); if(k!=='capa' && !padrao.includes(k)) padrao.push(k); });
  return JSON.stringify(atual)===JSON.stringify(padrao) ? null : atual;
}
async function sedSalvar(){
  const s = planoState(); const se = s.sedAberto; if(!se || se.salvando) return;
  const campos = sedDiferencas(se);
  const ordem = sedOrdemParaSalvar(se);
  const k = sedChave(se.planoId, se.n);
  se.salvando = true; render();
  try{
    const usadas = new Set((se.wd.extras||[]).map(x => x.img).filter(Boolean));
    for(const [id, url] of Object.entries(se.imgsNovas||{})){ if(usadas.has(id)) await window.storage.set(`plano-slides-ed-img:${id}`, JSON.stringify(url), true); }
    se.imgsNovas = {};
    for(const id of (se.imgsOrig||[])){ if(!usadas.has(id)){ try{ await window.storage.delete(`plano-slides-ed-img:${id}`, true); }catch(e){} } }
    se.imgsOrig = [...usadas];
    if(!Object.keys(campos).length && !se.ocultos.length && !ordem){ try{ await window.storage.delete(k, true); }catch(e){} s.sedCache[k] = null; se.tinhaEdicao = false; se.msg = '✅ Nada mudou em relação ao original: a aula usa os slides originais.'; }
    else{
      const ed = { campos, ocultos: se.ocultos.slice(), ordem, em: Date.now(), por: (state.professor.session && state.professor.session.displayName) || 'Coordenação' };
      await window.storage.set(k, JSON.stringify(ed), true);
      s.sedCache[k] = ed; se.tinhaEdicao = true;
      se.msg = '✅ Salvo! Na próxima vez que você clicar em “📡 Apresentar no app”, a aula usa a sua versão (os tablets também).';
    }
    se.sujo = false;
  }catch(e){ se.msg = '⚠️ Não foi possível salvar agora. Verifique a internet e tente de novo.'; }
  se.salvando = false; render();
}
async function sedOriginal(){
  const s = planoState(); const se = s.sedAberto; if(!se) return;
  if(!confirm('Voltar aos slides originais desta aula? As suas mudanças serão apagadas.')) return;
  const k = sedChave(se.planoId, se.n);
  try{ await window.storage.delete(k, true); }catch(e){}
  s.sedCache[k] = null;
  for(const id of (se.imgsOrig||[])){ try{ await window.storage.delete(`plano-slides-ed-img:${id}`, true); }catch(e){} }
  se.imgsOrig = []; se.imgsNovas = {}; se.ordem = null;
  se.wd = JSON.parse(JSON.stringify(se.base)); se.ocultos = []; se.tinhaEdicao = false; se.sujo = false; se.msg = '↩️ Slides originais restaurados.';
  render();
}
function sedFechar(){
  const s = planoState(); const se = s.sedAberto;
  if(se && se.sujo && !confirm('Você tem mudanças não salvas. Fechar mesmo assim?')) return;
  s.sedAberto = null; render();
}
function ytIdDe(url){
  if(!url) return null;
  const m = String(url).trim().match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : (/^[a-zA-Z0-9_-]{11}$/.test(String(url).trim()) ? String(url).trim() : null);
}
function tempoSeg(t){
  if(t==null || t==='') return 0;
  const p = String(t).trim().split(':').map(x => parseInt(x, 10));
  if(p.some(isNaN)) return 0;
  return p.reduce((a, x) => a*60 + x, 0);
}
function avVideoSrc(x){
  const id = ytIdDe(x.url); if(!id) return '';
  const ini = tempoSeg(x.ini), fim = tempoSeg(x.fim);
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1${ini?'&start='+ini:''}${fim>ini?'&end='+fim:''}`;
}
function avVideoSlideHtml(x, ctx){
  const id = ytIdDe(x.url);
  const trecho = (x.ini || x.fim) ? `<span class="av-fonte">Trecho: ${esc(x.ini||'0:00')}${x.fim?' a '+esc(x.fim):''}</span>` : '';
  const pergunta = x.pergunta ? `<div class="av-card ou" style="margin-top:.6em;"><b>Enquanto assiste:</b> ${esc(x.pergunta)}</div>` : '';
  let corpo;
  if(!id) corpo = `<div class="av-card" style="height:60%;display:flex;align-items:center;justify-content:center;text-align:center;">🎬 Cole o link de um vídeo do YouTube no campo ao lado.</div>`;
  else if(ctx.modo==='aluno' && !ctx.estudo) corpo = `<div class="av-card az" style="height:62%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;"><div style="font-size:4em;">🎬</div><div style="font-size:1.6em;font-weight:700;color:#1F4E79;">Assista no telão</div><div>O vídeo passa na frente da sala.</div></div>`;
  else if(ctx.preview) corpo = `<div style="height:64%;display:flex;align-items:center;justify-content:center;"><div style="position:relative;height:100%;aspect-ratio:16/9;max-width:100%;background:#000 url(https://i.ytimg.com/vi/${id}/hqdefault.jpg) center/cover;border-radius:.4em;display:flex;align-items:center;justify-content:center;"><span style="background:rgba(200,0,0,.9);color:#fff;border-radius:.4em;padding:.2em .7em;font-size:2em;">▶</span></div></div>`;
  else corpo = `<div style="height:64%;display:flex;align-items:center;justify-content:center;"><div data-av-video-slot="${esc(avVideoSrc(x))}" style="height:100%;aspect-ratio:16/9;max-width:100%;background:#000;border-radius:.4em;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.9em;">carregando o vídeo… (precisa de internet)</div></div>`;
  return `<div class="av-in"><div class="av-row" style="justify-content:space-between;"><div class="av-t" style="margin-bottom:.4em;">🎬 ${esc(x.titulo||'Vídeo')}</div>${trecho}</div>${corpo}${pergunta}</div>`;
}
let avVideoRaf = null;
function avVideoAgendar(){ if(avVideoRaf) return; avVideoRaf = requestAnimationFrame(() => { avVideoRaf = null; avVideoSync(); }); }
function sedChaveDe(planoId, n, dono){ return `plano-slides-ed:${planoId}:${n}:${dono}`; }
function sedTurmasDoPlano(planoId){
  const s = planoState();
  return (planoTurmasVisiveis()||[]).filter(t => s.turmaPlano[t.id]===planoId).map(t => t.name);
}
function sedNormTxt(t){ return String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function sedAulaCorrespondente(aulaOrig, plano){
  if(!plano || !aulaOrig) return null;
  const tit = sedNormTxt(aulaOrig.tituloCurto || aulaOrig.tema);
  const pags = String(aulaOrig.paginas||'').match(/\d+/g) || [];
  let melhor = null, nota = 0;
  plano.aulas.filter(a => a.slides).forEach(a => {
    let p = 0;
    if(tit && sedNormTxt(a.tituloCurto || a.tema)===tit) p += 10;
    const pa = String(a.paginas||'').match(/\d+/g) || [];
    p += pags.filter(x => pa.includes(x)).length;
    if(p > nota){ nota = p; melhor = a; }
  });
  return melhor;
}
async function sedCopiarAbrir(){
  const s = planoState(); const se = s.sedAberto; if(!se) return;
  if(se.sujo){ await sedSalvar(); if(se.sujo) return; }
  const k = sedChave(se.planoId, se.n);
  if(!s.sedCache[k]){ alert('Esta aula ainda não tem edição salva para copiar. Faça as mudanças e clique em Salvar primeiro.'); return; }
  let profs = []; try{ profs = (await fetchProfessoresList()) || []; }catch(e){}
  const planoAtual = s.planos[se.planoId];
  const disc = sedNormTxt(planoAtual && planoAtual.disciplina);
  se.copiar = { dono: sedDono(), planoId: se.planoId, n: null, profs: profs.filter(p => p && p.id).map(p => ({ id: p.id, nome: p.displayName || p.name || p.email || p.id })),
    planos: (s.index||[]).filter(pl => !disc || sedNormTxt(pl.disciplina)===disc), msg:'' };
  await sedCopiarPlano(se.planoId);
}
async function sedCopiarPlano(planoId){
  const s = planoState(); const se = s.sedAberto; if(!se || !se.copiar) return;
  se.copiar.planoId = planoId; se.copiar.msg = '';
  const pl = await planoObter(planoId);
  const orig = (s.planos[se.planoId]||{aulas:[]}).aulas.find(a => a.n===se.n);
  if(planoId===se.planoId){ const prox = pl.aulas.find(a => a.slides && a.n!==se.n); se.copiar.n = se.copiar.dono!==sedDono() ? se.n : (prox ? prox.n : se.n); }
  else { const c = sedAulaCorrespondente(orig, pl); se.copiar.n = c ? c.n : ((pl.aulas.find(a => a.slides)||{}).n || 1); }
  render();
}
function sedCopiarHtml(se){
  const c = se.copiar; if(!c) return '';
  const s = planoState(); const pl = s.planos[c.planoId];
  const orig = (s.planos[se.planoId]||{aulas:[]}).aulas.find(a => a.n===se.n) || {};
  const dest = pl && pl.aulas.find(a => a.n===c.n);
  const parece = dest && (sedNormTxt(dest.tituloCurto||dest.tema)===sedNormTxt(orig.tituloCurto||orig.tema));
  const mesmo = c.planoId===se.planoId && c.n===se.n && c.dono===sedDono();
  const turmasDest = c.dono===sedDono() ? sedTurmasDoPlano(c.planoId) : [];
  return `<div data-sed-copiar style="margin:10px 0;padding:10px 12px;border:1px solid #e6dcc8;border-radius:10px;background:#fffaf0;">
    <strong>📋 Copiar esta edição</strong> <span class="muted" style="font-size:.8rem;">(textos, slides escondidos, ordem, slides novos e vídeos)</span>
    <div class="row" style="gap:10px;flex-wrap:wrap;margin-top:8px;align-items:flex-end;">
      <div><label style="font-size:.8rem;font-weight:600;display:block;">Para quem</label><select data-sed-copiar-campo="dono">
        <option value="${esc(sedDono())}" ${c.dono===sedDono()?'selected':''}>Para mim (outra aula ou versão)</option>
        ${c.profs.filter(p => p.id!==sedDono()).map(p => `<option value="${esc(p.id)}" ${c.dono===p.id?'selected':''}>Prof. ${esc(p.nome)}</option>`).join('')}</select></div>
      <div><label style="font-size:.8rem;font-weight:600;display:block;">Plano / versão</label><select data-sed-copiar-campo="plano">${c.planos.map(p => `<option value="${esc(p.id)}" ${c.planoId===p.id?'selected':''}>${esc(p.titulo)}</option>`).join('')}</select></div>
      <div><label style="font-size:.8rem;font-weight:600;display:block;">Aula</label><select data-sed-copiar-campo="aula">${pl ? pl.aulas.filter(a => a.slides).map(a => `<option value="${a.n}" ${c.n===a.n?'selected':''}>Aula ${a.n} — ${esc(a.tituloCurto||a.tema||'')}</option>`).join('') : ''}</select></div>
      <button class="btn btn-primary btn-sm" data-action="sed-copiar-ok" style="width:auto;" ${mesmo?'disabled':''}>Copiar</button>
      <button class="btn btn-ghost btn-sm" data-action="sed-copiar-fechar" style="width:auto;">Cancelar</button>
    </div>
    ${mesmo ? '<p class="muted" style="font-size:.82rem;margin:6px 0 0;">Esta é a própria aula que você está editando.</p>' : dest && !parece ? `<p style="font-size:.82rem;margin:6px 0 0;color:#a4521b;">⚠️ A aula de destino tem outro título (“${esc(dest.tituloCurto||dest.tema||'')}”). A cópia troca os textos dela pelos desta aula — confira se é o mesmo conteúdo.</p>` : ''}
    ${turmasDest.length ? `<p class="muted" style="font-size:.8rem;margin:6px 0 0;">Vai valer para: ${esc(turmasDest.join(', '))}.</p>` : ''}
    ${c.msg ? `<p style="font-size:.85rem;margin:6px 0 0;" data-sed-copiar-msg>${esc(c.msg)}</p>` : ''}
  </div>`;
}
async function sedCopiarExecutar(){
  const s = planoState(); const se = s.sedAberto; const c = se && se.copiar; if(!c) return;
  const origem = s.sedCache[sedChave(se.planoId, se.n)]; if(!origem) return;
  const destK = sedChaveDe(c.planoId, c.n, c.dono);
  let existe = false; try{ await window.storage.get(destK, true); existe = true; }catch(e){}
  const quem = c.dono===sedDono() ? '' : ' de ' + ((c.profs.find(p => p.id===c.dono)||{}).nome || 'outro professor');
  if(existe && !confirm(`A aula ${c.n}${quem} já tem uma edição. Substituir pela desta aula?`)) return;
  try{
    const ed = JSON.parse(JSON.stringify(origem));
    // as fotos dos slides novos são duplicadas: apagar a edição de uma aula não apaga a foto da outra
    for(const x of ((ed.campos && ed.campos.extras) || [])){
      if(!x.img) continue;
      let url = AV_IMG['ed-' + x.img]; if(!url) url = await planoLerJson(`plano-slides-ed-img:${x.img}`, null);
      if(!url){ x.img = null; continue; }
      const novo = cryptoId(); await window.storage.set(`plano-slides-ed-img:${novo}`, JSON.stringify(url), true); AV_IMG['ed-' + novo] = url; x.img = novo;
    }
    ed.em = Date.now(); ed.copiadoDe = { planoId: se.planoId, n: se.n, por: (state.professor.session && state.professor.session.displayName) || 'Coordenação' };
    await window.storage.set(destK, JSON.stringify(ed), true);
    if(c.dono===sedDono()) s.sedCache[destK] = ed;
    const pl = s.planos[c.planoId];
    c.msg = `✅ Copiado para a aula ${c.n}${pl ? ' de “' + pl.titulo + '”' : ''}${quem}.`;
  }catch(err){ c.msg = '⚠️ Não foi possível copiar agora. Verifique a internet e tente de novo.'; }
  render();
}
function escR(t){ return esc(t).replace(/\*([^*\n]{1,80})\*/g, '<b class="av-dest">$1</b>'); }
function sedGetPath(obj, path){ return path.split('.').reduce((o, k) => o==null ? undefined : o[/^\d+$/.test(k) ? Number(k) : k], obj); }
const SED_LISTAS = [
  [/^pontos$/, 2, 6, () => ''],
  [/^vf$/, 3, 8, () => ({ t:'', v:true, e:'' })],
  [/^esquema\.itens$/, 2, 6, arr => (Array.isArray(arr[0]) ? arr[0].map(() => '') : '')],
  [/^esquema\.[ab]\.1$/, 1, 6, () => ''],
  [/^mapa\.ramos\.\d+\.itens$/, 1, 5, () => ''],
  [/^extras\.\d+\.opcoes$/, 2, 5, () => ''],
  [/^extras\.\d+\.[ab]\.1$/, 1, 6, () => ''],
  [/^figuras\.\d+\.perguntas$/, 0, 6, () => ''],
];
function sedListaRegra(path){ return SED_LISTAS.find(r => r[0].test(path)); }
function sedListaDelBtn(path, i, len){
  const r = sedListaRegra(path); if(!r || len <= r[1]) return '';
  return `<button class="btn btn-ghost btn-sm" data-action="sed-lista-del" data-path="${esc(path)}" data-i="${i}" title="Remover" style="width:auto;padding:2px 8px;margin-left:6px;color:#a33131;">🗑️</button>`;
}
function sedListaAddBtn(path, len, rotulo){
  const r = sedListaRegra(path); if(!r || len >= r[2]) return '';
  return `<button class="btn btn-ghost btn-sm" data-action="sed-lista-add" data-path="${esc(path)}" style="width:auto;margin:6px 0;">➕ ${esc(rotulo)}</button>`;
}
function sedListaTextos(rotulo, path, arr, addRotulo){
  arr = arr || [];
  return arr.map((v, i) => `<div style="display:flex;align-items:flex-end;gap:4px;"><div style="flex:1;">${sedCampo(rotulo + ' ' + (i+1), path + '.' + i, v, { area: String(v||'').length > 60 })}</div>${sedListaDelBtn(path, i, arr.length)}</div>`).join('') + sedListaAddBtn(path, arr.length, addRotulo);
}
function sedListaMudar(path, op, i){
  const se = planoState().sedAberto; if(!se) return;
  const arr = sedGetPath(se.wd, path); const r = sedListaRegra(path);
  if(!Array.isArray(arr) || !r) return;
  if(op==='add' && arr.length < r[2]) arr.push(r[3](arr));
  if(op==='del' && arr.length > r[1]){
    arr.splice(i, 1);
    // pergunta própria: mantém a alternativa certa apontando para a mesma opção
    const mq = path.match(/^extras\.(\d+)\.opcoes$/);
    if(mq){ const x = se.wd.extras[Number(mq[1])]; if(x.correta===i) x.correta = 0; else if(x.correta > i) x.correta--; }
  }
  se.sujo = true; se.msg = ''; render();
}
function avOpcoesGen(r, ctx, attrsAluno){
  const L = ['A','B','C','D','E'];
  const total = Object.keys(ctx.resp||{}).length;
  const cont = r.opcoes.map((_, i) => Object.values(ctx.resp||{}).filter(x => x.op===i).length);
  return r.opcoes.map((o, i) => {
    let cls = '';
    if(ctx.revelado) cls = i===Number(r.correta) ? 'ok' : (ctx.minha===i ? 'no' : '');
    else if(ctx.minha===i) cls = 'sel';
    const barra = (ctx.modo==='prof' && ctx.revelado) ? `<div class="av-bar"><div style="width:${total ? Math.round(cont[i]/total*100) : 0}%"></div></div>` : '';
    const contTxt = (ctx.modo==='prof' && ctx.revelado) ? ` <span style="float:right;">${cont[i]}</span>` : '';
    const attrs = ctx.modo==='aluno' && !ctx.revelado && !ctx.estudo ? attrsAluno(i) : 'disabled';
    return `<button class="av-op ${cls}" ${attrs}><b>${L[i]})</b> ${escR(o)}${contTxt}${barra}</button>`;
  }).join('');
}
function avPergEstado(ctx, qid){ return ((ctx.sess && ctx.sess.perg) || {})[qid] || {}; }
function avPerguntaSlideHtml(x, ctx){
  const L = ['A','B','C','D','E'];
  const st = avPergEstado(ctx, x.id);
  const revelado = ctx.preview || ctx.estudo || !!st.revelado;
  const resp = ctx.modo==='prof' && !ctx.preview ? ((aulaVivaState().pergResp||{})[x.id] || {}) : {};
  const minha = ctx.modo==='aluno' && !ctx.estudo ? (((state.aluno.avPergMinha||{})[x.id]) ?? null) : null;
  const c2 = Object.assign({}, ctx, { revelado, resp, minha });
  const total = Object.keys(resp).length;
  const certa = Number(x.correta)||0;
  let rodape;
  if(ctx.modo==='prof') rodape = ctx.preview ? `Resposta: <b>${L[certa]}</b> · na aula os alunos respondem no tablet`
    : revelado ? `Resposta: <b>${L[certa]}</b> · ${total} resposta(s)` : `📱 Respondam no tablet · <b>${total}</b> resposta(s) até agora <button class="btn" data-action="av-perg-revelar" data-q="${esc(x.id)}" style="margin-left:.8em;background:#C9A227;color:#3b1018;font-weight:700;">Revelar resposta</button>`;
  else if(ctx.estudo) rodape = `Resposta: <b>${L[certa]}</b>`;
  else rodape = revelado ? (minha===certa ? '✅ Você acertou!' : (minha==null ? 'Resposta: ' + L[certa] : '❌ A certa é a ' + L[certa])) : (minha!=null ? '✔ Resposta enviada! Aguarde o professor revelar.' : 'Toque na sua resposta.');
  return `<div class="av-in av-azul"><div class="av-row" style="justify-content:space-between;"><div class="av-t">${escR(x.titulo||'Pergunta')}</div><span style="font-size:2.4em;">❓</span></div>
    <div style="font-weight:700;font-size:1.2em;margin-bottom:.4em;">${escR(x.texto||'')}</div>
    ${avOpcoesGen({ opcoes: x.opcoes||[], correta: certa }, c2, i => `data-action="av-perg-responder" data-q="${esc(x.id)}" data-i="${i}"`)}
    <div style="margin-top:.5em;color:#F3E7C0;font-size:.9em;">${rodape}</div>
    ${revelado && x.explicacao ? `<div class="av-card" style="margin-top:.5em;color:#222;font-size:.95em;"><b style="color:#1d6b31;">Por quê?</b> ${escR(x.explicacao)}</div>` : ''}</div>`;
}
function avLivroSlideHtml(d, x, idx, ctx){
  const C = { v:'#6B1F2E', o:'#C9A227' };
  const sess = ctx.sess || {}; const pos = 5000 + idx; const min = Number(x.min) || 10;
  const ini = !ctx.preview && sess.leituraIni && sess.leituraIdx===pos ? sess.leituraIni : null;
  const resta = ini ? Math.max(0, min*60 - (Date.now()-ini)/1000) : min*60;
  const mmss = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  const tablet = ctx.modo==='aluno' && !ctx.estudo;
  return `<div class="av-in av-azul"><div class="av-t">📖 ${escR(x.titulo||'Pausa para o livro')}</div>
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:1em;align-items:center;height:68%;">
      <div style="font-size:1.2em;line-height:1.5;">
        ${x.paginas ? `<div>Abra o <b>livro</b> em <b>${escR(x.paginas)}</b>.</div>` : ''}
        <div style="margin-top:.4em;">${escR(x.atividade||'')}</div>
        ${tablet ? '<div style="color:#F3E7C0;margin-top:.5em;">📵 Tablet para baixo durante a atividade.</div>' : ''}</div>
      <div style="text-align:center;">${ctx.estudo ? `<div style="font-size:1.4em;">⏱ ${min} min</div>` : `<div data-av-leitura-relogio data-ini="${ini||''}" data-min="${min}" style="font-size:3.6em;font-weight:800;font-family:Cambria,Georgia,serif;">${ini && resta<=0 ? '⏰' : mmss(resta)}</div>
        ${ini ? (resta<=0 ? '<div style="color:#F3E7C0;">Tempo esgotado</div>' : `<div class="av-barra"><div style="animation:avBarra ${min*60}s linear both;animation-delay:-${((Date.now()-ini)/1000).toFixed(1)}s;"></div></div>`)
          : (ctx.modo==='prof' && !ctx.preview ? `<button class="btn" data-action="av-leitura-iniciar" data-i="${pos}" style="background:${C.o};color:${C.v};font-weight:700;margin-top:.4em;">▶ Iniciar ${min} min</button>` : `<div style="color:#F3E7C0;">${min} minutos</div>`)}`}</div>
    </div></div>`;
}
async function avPergCarregar(qid){
  const av = aulaVivaState(); if(!av.sess) return false;
  const lista = await liveListar(`aula-viva-resp:${av.sess.id}~${qid}:`);
  const out = {}; Object.entries(lista).forEach(([sid, v]) => { try{ out[sid] = JSON.parse(v); }catch(e){} });
  av.pergResp = av.pergResp || {};
  const mudou = JSON.stringify(av.pergResp[qid]||{}) !== JSON.stringify(out);
  av.pergResp[qid] = out; return mudou;
}
function avExtraAtual(av){
  const sl = av.slides[av.sess.idx];
  return sl && sl.t==='extra' ? (av.d.extras||[]).find(e => e.id===sl.id) : null;
}
async function avPergRevelar(qid){
  const av = aulaVivaState(); if(!av.sess) return;
  const x = (av.d.extras||[]).find(e => e.id===qid); if(!x) return;
  await avPergCarregar(qid);
  av.sess.perg = Object.assign({}, av.sess.perg||{});
  const st = av.sess.perg[qid] = Object.assign({}, av.sess.perg[qid]||{}, { revelado: true });
  render(); await aulaVivaSalvarSessao();
  if(!st.fichas){
    st.fichas = true; await aulaVivaSalvarSessao();
    const certa = Number(x.correta)||0;
    try{ await awardFichasLote(av.sess.turmaId, Object.entries(av.pergResp[qid]||{}).map(([sid, r]) => ({ studentId: sid, amount: r.op===certa ? 2 : 1, motivo: r.op===certa ? 'Acertou a pergunta da aula' : 'Respondeu a pergunta da aula' }))); }catch(e){}
  }
}
async function avPergResponder(qid, i){
  const al = state.aluno; const s = al.aulaViva;
  if(!s || !al.matriculaStudentId) return;
  if(((s.perg||{})[qid]||{}).revelado) return;
  al.avPergMinha = Object.assign({}, al.avPergMinha||{}, { [qid]: i }); render();
  try{ await window.storage.set(`aula-viva-resp:${s.id}~${qid}:${al.matriculaStudentId}`, JSON.stringify({ op:i, nome: al.name, at: Date.now() }), true); }catch(e){}
}
function aulaVivaState(){ const p = state.professor; if(!p.aulaViva) p.aulaViva = { presenting:false, sess:null, d:null, slides:[], resp:{}, n:null }; return p.aulaViva; }
async function aulaVivaSalvarSessao(){
  const av = aulaVivaState(); if(!av.sess) return;
  av.sess.at = Date.now();
  await window.storage.set(`aula-viva:${av.sess.turmaId}`, JSON.stringify(av.sess), true);
}
async function iniciarAulaViva(turmaId, n){
  const s = planoState(); const p = state.professor; const av = aulaVivaState();
  const plano = s.planos[s.turmaPlano[turmaId]];
  const aula = plano && plano.aulas.find(a => a.n===n);
  if(!aula || !aula.slides){ alert('Esta aula ainda não tem slides prontos no plano.'); return; }
  avInjetarCss();
  await avCarregarRecursos(aula.slides);
  const cfg = await planoCfgCarregar(turmaId);
  if(!s.prog[turmaId]) await planoCarregarTurma(turmaId);
  const sessCfg = { datashow: !!cfg.datashow, mapaModelo: cfg.mapaModelo, leitura: (cfg.leitura||{})[n] || 0, grupo: (cfg.grupo||{})[n] || 0 };
  // versão editada pelo professor (textos e slides escondidos): vai junto na sessão para os tablets
  const ed = await sedCarregar(plano.id, n);
  if(ed) sessCfg.ed = { campos: ed.campos || {}, ocultos: ed.ocultos || [], ordem: ed.ordem || null };
  try{ await window.storage.set(`plano-slides-ed-t:${planoTKP(turmaId, plano.id)}:${n}`, JSON.stringify(sessCfg.ed || null), true); }catch(e){}
  const pnpPr = await pnpPrepararAula(turmaId, plano, aula); if(pnpPr) sessCfg.prior = pnpPr;
  const dEd = pnpAplicarSessao(avAplicarEdicao(aula.slides, sessCfg.ed), sessCfg.prior);
  await avCarregarRecursos(dEd);
  av.d = dEd; av.n = n; av.slides = avSlidesFinal(dEd, { leitura: sessCfg.leitura, grupo: sessCfg.grupo }, sessCfg.ed); av.resp = {}; av.int = {}; av.duvidas = {}; av.painel = null; av.marcando = false; av.ultimaChave = null;
  av.sess = { id: cryptoId(), turmaId, planoId: plano.id, n, idx: 0, total: av.slides.length, revelado: false, fichasDadas: false,
    professorName: p.session ? p.session.displayName : 'Coordenação', startedAt: Date.now(), cfg: sessCfg };
  av.presenting = true;
  await aulaVivaSalvarSessao();
  requestFullscreenSafe();
  clearInterval(aulaVivaPollInterval);
  aulaVivaPollInterval = setInterval(aulaVivaPollProf, 2000);
  render();
}
async function aulaVivaIr(delta){
  const av = aulaVivaState(); if(!av.sess) return;
  const novo = Math.max(0, Math.min(av.slides.length-1, av.sess.idx + delta));
  if(novo===av.sess.idx) return;
  await avAoSair(av.slides[av.sess.idx].t);
  av.sess.idx = novo;
  const t = av.slides[novo].t;
  await avAoEntrar(t);
  if(t==='resposta' && !av.sess.revelado){ await aulaVivaRevelar(true); return; }
  if(t==='relampago') await aulaVivaCarregarRespostas();
  render();
  await aulaVivaSalvarSessao();
}
async function aulaVivaCarregarRespostas(){
  const av = aulaVivaState(); if(!av.sess) return;
  const lista = await liveListar(`aula-viva-resp:${av.sess.id}:`);
  const out = {};
  Object.entries(lista).forEach(([sid, v]) => { try{ out[sid] = JSON.parse(v); }catch(e){} });
  av.resp = out;
}
async function aulaVivaPollProf(){
  const av = aulaVivaState();
  if(!av.presenting || !av.sess){ clearInterval(aulaVivaPollInterval); return; }
  const t = av.slides[av.sess.idx] && av.slides[av.sess.idx].t;
  if(t==='pratica' && av.sess.atividadeCode){ await aulaVivaContarEntregas(); }
  await avPollInterativo();
  const xp = avExtraAtual(av);
  if(xp && xp.tipo==='pergunta'){ if(await avPergCarregar(xp.id)) avRenderSeguro(); }
  if(t==='relampago' || t==='resposta'){
    const antes = JSON.stringify(av.resp);
    await aulaVivaCarregarRespostas();
    if(JSON.stringify(av.resp)!==antes) avRenderSeguro();
  }
}
async function aulaVivaRevelar(irParaResposta){
  const av = aulaVivaState(); if(!av.sess) return;
  await aulaVivaCarregarRespostas();
  av.sess.revelado = true;
  render();
  await aulaVivaSalvarSessao();
  // fichas: 1 por participar + 1 por acertar (uma vez por aula ao vivo)
  if(!av.sess.fichasDadas){
    av.sess.fichasDadas = true; await aulaVivaSalvarSessao();
    const certa = av.d.relampago.correta;
    try{ await awardFichasLote(av.sess.turmaId, Object.entries(av.resp).map(([sid, r]) => ({ studentId: sid, amount: r.op===certa ? 2 : 1, motivo: r.op===certa ? 'Acertou a pergunta-relâmpago da aula' : 'Respondeu a pergunta-relâmpago da aula', categoria: 'relampago' }))); }catch(e){}
  }
}
async function aulaVivaPraticaQuiz(){
  const av = aulaVivaState(); const p = state.professor; const s = planoState();
  if(!av.sess) return;
  const plano = s.planos[av.sess.planoId] || s.planos[s.turmaPlano[av.sess.turmaId]];
  const aula = plano && plano.aulas.find(a => a.n===av.sess.n);
  if(!aula || !aula.exercicio){ alert('Esta aula não tem perguntas de exercício.'); return; }
  const turma = (p.turmas||[]).find(t => t.id===av.sess.turmaId);
  if(!turma || (turma.students||[]).length < 2){ alert('A turma precisa ter pelo menos 2 alunos cadastrados para formar equipes.'); return; }
  const qs = planoQuizQuestoes(aula);
  p.quiz.setup = { turmaId: av.sess.turmaId, numTeams: Math.min(4, Math.max(2, Math.round((turma.students||[]).length / 6))), teams: [], questions: qs };
  quizAutoMontarEquipes();
  await startQuizSession(av.sess.professorName || 'Professor');
  if(!p.quiz.current) return;
  av.voltarSub = state.view==='coordenador' ? state.coordenador.subview : p.subview;
  if(state.view==='coordenador') state.coordenador.subview = 'quiz'; else p.subview = 'quiz';
  p.quiz.presentationMode = true;
  stopQuizPoll(); refreshProfessorQuiz(); quizPollInterval = setInterval(refreshProfessorQuiz, 1000);
  av.sess.modo = 'quiz'; await aulaVivaSalvarSessao();
  render();
}
async function aulaVivaVoltarDoQuiz(){
  const av = aulaVivaState(); const p = state.professor;
  if(p.quiz.current){ try{ await saveQuizAtivo(null); }catch(e){} p.quiz.current = null; try{ quizResetEffectsState(); }catch(e){} }
  p.quiz.presentationMode = false;
  stopQuizPoll();
  if(state.view==='coordenador') state.coordenador.subview = av.voltarSub || 'planolivro'; else p.subview = av.voltarSub || 'planolivro';
  if(av.sess){ av.sess.modo = null; if(av.sess.idx < av.slides.length-1) av.sess.idx++; await aulaVivaSalvarSessao(); }
  render();
}
async function aulaVivaPraticaAtividade(){
  const av = aulaVivaState(); const s = planoState();
  if(!av.sess) return;
  const tid = av.sess.turmaId, n = av.sess.n;
  if(!s.prog[tid]) await planoCarregarTurma(tid);
  let code = (s.prog[tid] && s.prog[tid].exercicios || {})[n];
  if(!code){ await aplicarExercicioPlano(tid, n); code = (s.prog[tid] && s.prog[tid].exercicios || {})[n]; }
  if(!code) return;
  av.sess.atividadeCode = code; av.entregas = 0;
  const ap = s.prog[tid] && s.prog[tid].apoio && s.prog[tid].apoio[n];
  av.sess.atividadeApoio = ap ? { code: ap.code, alunos: ap.alunos } : null;
  await aulaVivaSalvarSessao();
  render();
}
async function aulaVivaContarEntregas(){
  const av = aulaVivaState(); if(!av.sess || !av.sess.atividadeCode) return;
  const turma = (state.professor.turmas||[]).find(t => t.id===av.sess.turmaId);
  const nomes = new Set(((turma && turma.students)||[]).map(st => nomeChave(st.name)));
  const resp = [].concat(await liveLerJson(`responses:${av.sess.atividadeCode}`, []), av.sess.atividadeApoio ? await liveLerJson(`responses:${av.sess.atividadeApoio.code}`, []) : []);
  const n = new Set(resp.map(r => nomeChave(r.studentName)).filter(x => !nomes.size || nomes.has(x))).size;
  if(n !== av.entregas){ av.entregas = n; render(); }
}
async function encerrarAulaViva(){
  const av = aulaVivaState();
  clearInterval(aulaVivaPollInterval);
  if(av.sess){ try{ await avAoSair(av.slides[av.sess.idx].t); }catch(e){} }
  av.painel = null;
  try{ await planoLembAoEncerrar(av); }catch(e){}
  if(av.sess){ try{ await window.storage.delete(`aula-viva:${av.sess.turmaId}`, true); }catch(e){} }
  av.presenting = false; av.sess = null;
  exitFullscreenSafe();
  render();
}
function renderAulaVivaProf(){
  const av = aulaVivaState();
  const sl = av.slides[av.sess.idx];
  const sp = planoState();
  const chave = avChave(av.sess); const quieto = av.ultimaChave===chave; av.ultimaChave = chave;
  const ctx = { modo:'prof', n: av.n, resp: av.resp, revelado: av.sess.revelado, sess: av.sess, entregas: av.entregas, nQuiz: (av.d.relampago ? 5 : 5), int: av.int||{}, marcando: av.marcando,
    valeNota: sp.valeNota[av.n] !== false, prazoTxt: ({ '2':'2 dias', '7':'7 dias', '14':'14 dias', '':'sem prazo' })[sp.prazo[av.n]!=null ? sp.prazo[av.n] : '7'] };
  return `<div class="av-wrap ${avSemProj() ? 'av-semproj' : ''}">
    ${avSemProj() ? '<div class="av-semproj-aviso">📱 Sala sem projetor: cada aluno vê o slide no próprio tablet. Esta é a sua prévia.</div>' : ''}
    <div class="av-slide ${quieto?'av-quieto':''}" data-av-slide="${sl.t}" data-av-idx="${av.sess.idx}">${avSlideHtml(av.d, sl, ctx)}${avFaixaDuvidaHtml(av.sess, true)}</div>
    <div class="av-ctrl">
      <button class="btn btn-ghost btn-sm" data-action="av-ir" data-d="-1" ${av.sess.idx===0?'disabled':''} style="background:#fff;">◀</button>
      <span>${av.sess.idx+1} / ${av.slides.length}</span>
      <button class="btn btn-primary btn-sm" data-action="av-ir" data-d="1" ${av.sess.idx>=av.slides.length-1?'disabled':''}>▶</button>
      ${sl.t==='relampago' && !av.sess.revelado ? `<button class="btn btn-sm" style="background:#C9A227;color:#3b1018;" data-action="av-revelar">⚡ Revelar resposta (${Object.keys(av.resp).length})</button>` : ''}
      ${avCtrlExtrasHtml(av)}
      ${(sl.t==='enem-of' || sl.t==='enem-of-res') && state.view==='professor' ? '<button class="btn btn-sm" style="background:#C9A227;color:#3b1018;" data-jg="av-jogar">🎮 Jogar Quem Erra Sai com este tema</button>' : ''}
      ${jgAvSugestaoBtn(av)}
      <span style="opacity:.7;">📡 tablets · ← →</span>
      <button class="btn btn-ghost btn-sm" data-av-semproj="${avSemProj() ? '0' : '1'}" style="background:#fff;">${avSemProj() ? '🖥️ Tenho projetor' : '📱 Sem projetor'}</button>
      <button class="btn btn-ghost btn-sm" data-action="av-encerrar" style="background:#fff;">Encerrar</button>
    </div>${avPainelHtml(av)}</div>`;
}
async function pollAulaVivaForAluno(){
  const al = state.aluno;
  if((al.stage!=='dashboard' && al.stage!=='aulaviva') || !al.turma) return false;
  const sess = await liveLerJson(`aula-viva:${al.turma.id}`, null);
  const ativa = sess && (Date.now() - (sess.at||0) < 3*3600*1000) ? sess : null;
  const antes = JSON.stringify(al.aulaViva||null);
  if(ativa){
    if(!al.avPlano || al.avPlano.id!==ativa.planoId) al.avPlano = await planoLerDoc(ativa.planoId);
    const aula = al.avPlano && al.avPlano.aulas.find(a => a.n===ativa.n);
    if(aula && aula.slides){
      avInjetarCss();
      await avCarregarRecursos(aula.slides);
      if(!al.aulaViva || al.aulaViva.id!==ativa.id){ al.avMinha = null; }
      const edV = ativa.cfg && ativa.cfg.ed; al.aulaViva = ativa; al.avD = pnpAplicarSessao(avAplicarEdicao(aula.slides, edV), ativa.cfg && ativa.cfg.prior); if(edV || (al.avD.priorQ && al.avD.priorQ.img)) await avCarregarRecursos(al.avD); al.avSlides = avSlidesFinal(al.avD, { leitura: (ativa.cfg && ativa.cfg.leitura) || 0, grupo: (ativa.cfg && ativa.cfg.grupo) || 0 }, edV);
      if(ativa.modo==='quiz' && al.stage==='aulaviva'){ al.stage = 'dashboard'; al.avAutoVoltar = true; al.subview = 'inicio'; }
      else if(!ativa.modo && al.avAutoVoltar && al.stage==='dashboard'){ al.avAutoVoltar = false; al.stage = 'aulaviva'; }
    }
  } else {
    al.aulaViva = null;
    if(al.stage==='aulaviva'){ exitFullscreenSafe(); al.stage = 'dashboard'; }
  }
  return JSON.stringify(al.aulaViva||null)!==antes;
}
function renderAulaVivaAluno(){
  const al = state.aluno; const s = al.aulaViva;
  if(!s || !al.avD) return `<div class="card"><h2>Aula encerrada</h2><p class="muted">O professor encerrou a aula ao vivo.</p><button class="btn btn-primary" data-action="av-sair">Voltar</button></div>`;
  const sl = al.avSlides[Math.min(s.idx, al.avSlides.length-1)];
  const meu = avMeu();
  if(sl.t==='vf' && s.vf && s.vf.fase==='pergunta'){ const k = s.vf.id+':'+s.vf.i; if(!meu.vfVisto[k]) meu.vfVisto[k] = Date.now(); }
  const chave = avChave(s); const quieto = al.avUltimaChave===chave; al.avUltimaChave = chave;
  const ctx = { modo:'aluno', n: s.n, revelado: s.revelado, minha: al.avMinha, sess: s, meu };
  const ex = avAlunoExtrasHtml();
  const escuro = avTabletEscuro(s, sl);
  return `<div class="av-wrap"><div class="av-slide ${quieto?'av-quieto':''}" data-av-slide="${sl.t}" ${escuro?'data-av-escuro="1"':''}>${escuro ? avOlheQuadroHtml(al.avD, sl) : avSlideHtml(al.avD, sl, ctx)}${ex.faixaSorteio}${avFaixaDuvidaHtml(s, false)}</div>
 <div class="av-ctrl"><span>${s.idx+1} / ${s.total}</span>${alunoApoio().ouvir ? '<button class="btn btn-ghost btn-sm" data-action="av-ouvir" style="background:#fff;">🔊 Ouvir</button>' : ''}<button class="btn btn-sm" data-action="av-duvida-abrir" style="background:#C9A227;color:#3b1018;">❓ Dúvida</button>${ex.msg}<button class="btn btn-ghost btn-sm" data-action="av-sair" style="background:#fff;">Sair</button></div>${ex.modal}</div>`;
}
async function aulaVivaResponder(i){
  const al = state.aluno; const s = al.aulaViva;
  if(!s || s.revelado || !al.matriculaStudentId) return;
  al.avMinha = i; render();
  try{ await window.storage.set(`aula-viva-resp:${s.id}:${al.matriculaStudentId}`, JSON.stringify({ op:i, nome: al.name, at: Date.now() }), true); }catch(e){}
}
__parteOk('editor_slides');
