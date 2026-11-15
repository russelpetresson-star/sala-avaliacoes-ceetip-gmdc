/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "chat_ia" */
function chatIaDiscNome(){
  try{ const p = state.professor; const id = p.bancoDisciplinaId; if(!id || id==='__sem') return '';
    const d = (p.disciplinas||[]).find(x => x.id===id); return d ? (d.name || '') : ''; }catch(e){ return ''; }
}
function chatIaRegras(modo){
  const disc = chatIaDiscNome();
  const img = (modo==='gen' || modo==='gerar')
    ? `- "imagem": descrição detalhada, em português, de UMA imagem sobre o assunto da questão (ilustração, esquema, gráfico, mapa ou cena), para acompanhar o enunciado. A imagem é um apoio visual: o enunciado precisa continuar compreensível mesmo sem ela.`
    : `- "imagem": se a questão original depende de uma figura, gráfico, mapa ou tabela que não veio no texto, descreva o que ela mostra; se não depende, use "".`;
  return `${disc ? `Disciplina: ${disc}\n` : ''}Em TODA questão inclua também:
- "conteudo": o conteúdo/assunto específico cobrado, em poucas palavras (ex.: "Equações do 1º grau", "Revolução Industrial", "NR-12 — proteção de máquinas").
- "descritor": se a questão for de Língua Portuguesa, o descritor da Matriz de Referência do SAEB no formato "LP D06"; se for de Matemática, no formato "MT D17". Em qualquer outra disciplina (Ciências da Natureza, Ciências Humanas, outras Linguagens ou disciplina técnica), a habilidade da Matriz de Referência do ENEM mais próxima, no formato "ENEM H17". Use um único código, o mais adequado.
${img}`;
}
function chatIaPromptGerar(g, tema, dificuldade, qtd){
  const semFormato = buildAiGenPrompt(g, tema, dificuldade, qtd).split('Responda SOMENTE com um array JSON')[0].trim();
  return `${semFormato}

${chatIaRegras('gerar')}

Responda SOMENTE com um array JSON válido, sem markdown e sem texto fora do JSON, ${CHATIA_FORMATO}`;
}
function chatIaDescritor(v){
  const t = String(v==null ? '' : v).trim(); if(!t) return '';
  let m = /\b(LP|MT)\s*[-–]?\s*D\s*0?(\d{1,2})\b/i.exec(t);
  if(m) return m[1].toUpperCase() + ' D' + String(m[2]).padStart(2, '0');
  m = /\bD\s*0?(\d{1,2})\b.*\b(LP|MT)\b/i.exec(t);
  if(m) return m[2].toUpperCase() + ' D' + String(m[1]).padStart(2, '0');
  m = /\bH\s*0?(\d{1,2})\b/i.exec(t); if(m) return 'ENEM H' + Number(m[1]);
  m = /^D\s*0?(\d{1,2})$/i.exec(t); if(m) return 'D' + String(m[1]).padStart(2, '0');
  return t.slice(0, 40);
}
function chatIaListas(){ const p = state.professor; return [p.aiGen && p.aiGen.results, p.pasteImport && p.pasteImport.results, p.book && p.book.extractResults].filter(Array.isArray); }
function chatIaQ(qid){ for(const l of chatIaListas()){ const q = l.find(x => x && x.id===qid); if(q) return q; } return null; }
function chatIaRotuloDescritor(d){
  try{ const c = (typeof SAESE_CAT!=='undefined') && SAESE_CAT[d]; if(c && c.o) return c.o; }catch(e){}
  return '';
}
function chatIaExtras(q){
  if(!q || !q.id) return '';
  const lista = chatIaListas().find(l => l.includes(q));
  const primeiraComImg = lista && lista.find(x => x && x.imagemSugerida);
  const dica = primeiraComImg===q ? `<p class="muted" style="font-size:.8rem; margin:0;">🖼️ Se o chat criou as imagens, baixe cada uma e toque em <strong>📎 Anexar imagem</strong> na questão certa. Se ele não criou, toque em <strong>📋 Copiar pedido desta imagem</strong>, cole no chat (ChatGPT ou Gemini criam imagens) e baixe a imagem que ele fizer.</p>` : '';
  const rot = chatIaRotuloDescritor(q.descritorSaeb);
  return `<div class="chatia-extra" style="margin:8px 0 0 26px; display:grid; gap:6px;">
    ${dica}
    <div class="row" style="gap:6px; flex-wrap:wrap;">
      <input type="text" data-chatia-f="conteudo" data-qid="${esc(q.id)}" value="${esc(q.conteudo||'')}" placeholder="Conteúdo" style="flex:2 1 200px;">
      <input type="text" data-chatia-f="descritor" data-qid="${esc(q.id)}" value="${esc(q.descritorSaeb||'')}" placeholder="Descritor SAEB (LP D06 / MT D17) ou habilidade (ENEM H17)" style="flex:1 1 220px;">
    </div>
    ${rot ? `<span class="muted" style="font-size:.78rem;">${esc(q.descritorSaeb)}: ${esc(rot)}</span>` : ''}
    ${q.imagemSugerida ? `<div style="font-size:.84rem;">🖼️ <strong>Imagem sugerida:</strong> ${esc(q.imagemSugerida)}</div>` : ''}
    ${q.image ? `<div><img src="${esc(q.image)}" alt="Imagem da questão" style="max-width:240px; max-height:170px; border-radius:6px; border:1px solid var(--paper-line);"></div>` : ''}
    <div class="row" style="gap:6px; flex-wrap:wrap; align-items:center;">
      <label class="btn btn-ghost btn-sm" style="cursor:pointer; text-transform:none; font-weight:600; margin:0;">📎 ${q.image ? 'Trocar a imagem' : 'Anexar imagem'}<input type="file" accept="image/*" data-chatia-f="img" data-qid="${esc(q.id)}" style="display:none;"></label>
      ${q.image ? `<button class="btn btn-ghost btn-sm" data-chatia="rm-img" data-qid="${esc(q.id)}">✕ Tirar a imagem</button>` : ''}
      ${q.imagemSugerida ? `<button class="btn btn-ghost btn-sm" data-chatia="copiar-img" data-qid="${esc(q.id)}">📋 Copiar pedido desta imagem</button>` : ''}
    </div>
  </div>`;
}
function chatIaReduzir(file){
  return new Promise((res, rej) => {
    const fr = new FileReader(); fr.onerror = () => rej(new Error('leitura'));
    fr.onload = () => { const im = new Image(); im.onerror = () => rej(new Error('imagem'));
      im.onload = () => {
        const k = Math.min(1, 1000 / Math.max(im.width || 1, im.height || 1));
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        let u = c.toDataURL('image/jpeg', 0.78); if(u.length > 350000) u = c.toDataURL('image/jpeg', 0.55); if(u.length > 600000) u = c.toDataURL('image/jpeg', 0.35);
        res(u);
      };
      im.src = fr.result; };
    fr.readAsDataURL(file);
  });
}
async function chatIaCopiar(txt){
  try{ await navigator.clipboard.writeText(txt); alert('Pedido da imagem copiado! Cole no ChatGPT ou no Gemini e baixe a imagem que ele criar.'); }
  catch(e){ prompt('Copie o pedido da imagem:', txt); }
}
__parteOk('chat_ia');
