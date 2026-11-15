/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "biblioteca" */
function bibliotecaFmtData(iso){
  if(!iso) return '-';
  const d = new Date(iso+'T00:00:00');
  if(isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}
function bibliotecaPrazoPadrao(){
  const d = new Date();
  d.setDate(d.getDate()+14);
  return d.toISOString().slice(0,10);
}
const BIBLIOTECA_MAX_RENOVACOES = 2;
const BIBLIOTECA_DIAS_AVISO_PRAZO = 3;
const BIBLIOTECA_FICHAS_DEVOLUCAO_PRAZO = 2;
function bibliotecaEmprestimoStatus(emp){
  if(emp.dataDevolucao) return 'devolvido';
  const hoje = new Date().toISOString().slice(0,10);
  if(emp.dataPrevista && emp.dataPrevista < hoje) return 'atrasado';
  return 'emprestado';
}
function bibliotecaDiasAteVencer(emp){
  if(!emp.dataPrevista) return null;
  const hoje = new Date(new Date().toISOString().slice(0,10)+'T00:00:00');
  const prazo = new Date(emp.dataPrevista+'T00:00:00');
  return Math.round((prazo-hoje)/86400000);
}
function bibliotecaVenceEmBreve(emp){
  if(bibliotecaEmprestimoStatus(emp)!=='emprestado') return false;
  const dias = bibliotecaDiasAteVencer(emp);
  return dias!==null && dias>=0 && dias<=BIBLIOTECA_DIAS_AVISO_PRAZO;
}
function bibliotecaStatusPill(status, dataDevolucao, venceEmBreve, dias){
  if(status==='devolvido') return `<span class="pill" style="background:var(--green); color:#fff;">Devolvido${dataDevolucao?' em '+bibliotecaFmtData(dataDevolucao):''}</span>`;
  if(status==='atrasado') return `<span class="pill" style="background:var(--red); color:#fff;">Atrasado</span>`;
  if(venceEmBreve) return `<span class="pill" style="background:#c98a2b; color:#fff;">Vence em ${dias===0?'hoje':dias+' dia(s)'}</span>`;
  return `<span class="pill">Emprestado</span>`;
}
function bibliotecaExemplaresDisponiveis(livro, emprestimos){
  const emprestados = (emprestimos||[]).filter(e => e.livroId===livro.id && !e.dataDevolucao).length;
  return Math.max(0, (parseInt(livro.exemplares)||0) - emprestados);
}
async function loadBibliotecaTurmas(){
  const b = state.biblioteca;
  b.turmasLoading = true; render();
  try{ const r = await window.storage.get('turmas', true); b.turmas = JSON.parse(r.value); }
  catch(e){ b.turmas = []; }
  b.turmasLoading = false;
  render();
}
async function loadBibliotecaLimite(){
  const b = state.biblioteca;
  b.limiteEmprestimosLoading = true; render();
  try{ const r = await window.storage.get('biblioteca-limite-emprestimos', true); b.limiteEmprestimos = parseInt(r.value)||3; }
  catch(e){ b.limiteEmprestimos = 3; }
  b.limiteEmprestimosLoading = false;
  render();
}
async function bibliotecaSalvarLimite(){
  const b = state.biblioteca;
  const val = parseInt(document.getElementById('biblioteca-limite-input').value) || 1;
  b.limiteEmprestimos = val;
  await window.storage.set('biblioteca-limite-emprestimos', String(val), true);
  render();
}
async function loadBibliotecaLivros(){
  const b = state.biblioteca;
  b.livrosLoading = true; render();
  try{ const r = await window.storage.get('biblioteca-livros', true); b.livros = JSON.parse(r.value); }
  catch(e){ b.livros = []; }
  b.livrosLoading = false;
  render();
}
async function saveBibliotecaLivros(){
  await window.storage.set('biblioteca-livros', JSON.stringify(state.biblioteca.livros), true);
}
async function loadBibliotecaEmprestimos(){
  const b = state.biblioteca;
  b.emprestimosLoading = true; render();
  try{ const r = await window.storage.get('biblioteca-emprestimos', true); b.emprestimos = JSON.parse(r.value); }
  catch(e){ b.emprestimos = []; }
  b.emprestimosLoading = false;
  render();
}
async function saveBibliotecaEmprestimos(){
  await window.storage.set('biblioteca-emprestimos', JSON.stringify(state.biblioteca.emprestimos), true);
}
async function loadBibliotecaReservas(){
  const b = state.biblioteca;
  b.reservasLoading = true; render();
  try{ const r = await window.storage.get('biblioteca-reservas', true); b.reservas = JSON.parse(r.value); }
  catch(e){ b.reservas = []; }
  b.reservasLoading = false;
  render();
}
async function saveBibliotecaReservas(){
  await window.storage.set('biblioteca-reservas', JSON.stringify(state.biblioteca.reservas), true);
}
async function submitBibliotecaLogin(){
  const b = state.biblioteca;
  const val = document.getElementById('biblioteca-senha-input').value;
  const lockCheck = await checkLoginLock('biblioteca', 'global');
  if(lockCheck.locked){ b.error = loginLockMessage(lockCheck.minutos); render(); return; }
  let storedHash = null, storedSalt = null;
  try{ const r = await window.storage.get('biblioteca-senha', true); storedHash = r.value; }catch(e){}
  try{ const r2 = await window.storage.get('biblioteca-senha-salt', true); storedSalt = r2.value; }catch(e){}
  let ok = false;
  if(storedHash){
    if(storedSalt){
      ok = (await hashTextSalted(val, storedSalt)) === storedHash;
    } else {
      ok = (await hashText(val)) === storedHash;
      if(ok){
        const newSalt = randomSaltHex();
        await window.storage.set('biblioteca-senha-salt', newSalt, true);
        await window.storage.set('biblioteca-senha', await hashTextSalted(val, newSalt), true);
      }
    }
  } else { ok = (val === 'biblioteca123'); }
  if(ok){
    await clearLoginFailures('biblioteca', 'global');
    b.session = true; b.error='';
    render();
    resetIdleLogoutTimer();
    loadBibliotecaTurmas();
    loadBibliotecaLivros();
    loadBibliotecaEmprestimos();
    loadBibliotecaLimite();
    loadBibliotecaReservas();
    b.extras = null; bibExtras();
  } else { b.error = 'Senha incorreta.'; await registerLoginFailure('biblioteca', 'global'); render(); }
}
function renderBibliotecaLogin(){
  const b = state.biblioteca;
  return `
    <button class="btn btn-ghost btn-sm voltar-landing" data-action="goto-landing">← Voltar</button>
    <div class="card">
      <h2>Biblioteca</h2>
      <p class="muted">Área da biblioteca para catalogar livros e controlar os empréstimos aos alunos.</p>
      <label>Senha</label>
      <input type="password" id="biblioteca-senha-input" placeholder="Senha">
      ${b.error ? `<p class="err">${esc(b.error)}</p>` : ''}
      <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="biblioteca-login-submit">Entrar</button>
    </div>
  `;
}
function renderBiblioteca(){
  const b = state.biblioteca;
  if(!b.session) return renderBibliotecaLogin();
  const topBar = `
    <div class="row" style="align-items:center; justify-content:space-between; margin-bottom:10px; flex-wrap:wrap; gap:6px;">
      <span class="muted" style="font-size:.85rem;">Biblioteca</span>
      <div class="row bib-abas" style="flex:1 1 auto; min-width:0; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
        <button class="btn ${b.subview==='catalogo'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblioteca-subview" data-sub="catalogo">📖 Catálogo</button>
        <button class="btn ${b.subview==='acervo'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblioteca-subview" data-sub="acervo">📚 Acervo</button>
        <button class="btn ${b.subview==='emprestimos'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblioteca-subview" data-sub="emprestimos">🔄 Empréstimos</button>
        <button class="btn ${b.subview==='reservas'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblioteca-subview" data-sub="reservas">⏳ Fila de espera${(b.reservas||[]).filter(r=>r.status==='ativa').length>0?` (${(b.reservas||[]).filter(r=>r.status==='ativa').length})`:''}</button>
        <button class="btn ${b.subview==='relatorio'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblioteca-subview" data-sub="relatorio">📊 Relatório</button>
        <button class="btn ${b.subview==='leitura'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblioteca-subview" data-sub="leitura">🏫 Leitura por turma</button>
        <button class="btn ${b.subview==='inventario'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblioteca-subview" data-sub="inventario">📋 Inventário</button>
        <button class="btn ${b.subview==='compras'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblioteca-subview" data-sub="compras">🛒 Pedidos de compra${(((b.extras||{}).desejos)||[]).filter(d=>d.status==='aberto').length?` (${b.extras.desejos.filter(d=>d.status==='aberto').length})`:''}</button>
        <button class="btn btn-ghost btn-sm" data-action="biblioteca-logout">Sair</button>
      </div>
    </div>
  `;
  let content;
  if(b.livrosLoading || b.turmasLoading || b.emprestimosLoading || b.limiteEmprestimosLoading || b.reservasLoading){
    content = `<div class="card"><div class="spinner"></div></div>`;
  } else if(b.subview==='emprestimos'){
    content = renderBibliotecaEmprestimos();
  } else if(b.subview==='reservas'){
    content = renderBibliotecaReservas();
  } else if(b.subview==='acervo'){
    content = renderBibliotecaAcervo();
  } else if(b.subview==='leitura'){
    content = renderBibliotecaLeitura();
  } else if(b.subview==='inventario'){
    content = renderBibliotecaInventario();
  } else if(b.subview==='compras'){
    content = renderBibliotecaCompras();
  } else if(b.subview==='relatorio'){
    content = renderBibliotecaRelatorio();
  } else if(b.catalogoMode==='importar'){
    content = renderBibliotecaImportarPlanilha();
  } else {
    content = renderBibliotecaCatalogo();
  }
  return topBar + content;
}
function renderBibliotecaCatalogo(){
  const b = state.biblioteca;
  const busca = (b.buscaLivro||'').trim().toLowerCase();
  const semCapa = b.livros.filter(l => !l.capaUrl).length, semIsbn = b.livros.filter(l => !l.isbn).length, semCat = b.livros.filter(l => !l.categoria).length;
  const livros = b.livros.filter(l => !busca || l.titulo.toLowerCase().includes(busca) || (l.autor||'').toLowerCase().includes(busca))
    .filter(l => b.filtroPendencia==='capa' ? !l.capaUrl : b.filtroPendencia==='isbn' ? !l.isbn : b.filtroPendencia==='categoria' ? !l.categoria : true)
    .sort((x,y)=>x.titulo.localeCompare(y.titulo,'pt-BR'));
  return `
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h2 style="margin:0;">Catálogo de livros (${b.livros.length})</h2>
        <div class="row" style="flex:0 0 auto; gap:6px;">
          <button class="btn btn-ghost btn-sm" data-action="biblioteca-abrir-importar-planilha">📥 Importar planilha</button>
          <button class="btn btn-primary btn-sm" data-action="biblioteca-livro-form-abrir">+ Novo livro</button>
        </div>
      </div>
      <input type="text" id="biblioteca-busca-livro-input" placeholder="Buscar por título ou autor..." value="${esc(b.buscaLivro||'')}" style="margin-top:10px;">
      ${(semCapa||semIsbn||semCat) ? `<div class="row" style="gap:6px; margin-top:8px; flex-wrap:wrap; align-items:center;">
        <span class="muted" style="font-size:.82rem;">Para completar depois:</span>
        ${semCapa ? `<button class="btn ${b.filtroPendencia==='capa'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblio-filtro-pendencia" data-f="capa">📷 Sem capa (${semCapa})</button>` : ''}
        ${semIsbn ? `<button class="btn ${b.filtroPendencia==='isbn'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblio-filtro-pendencia" data-f="isbn">🔢 Sem ISBN (${semIsbn})</button>` : ''}
        ${semCat ? `<button class="btn ${b.filtroPendencia==='categoria'?'btn-primary':'btn-ghost'} btn-sm" data-action="biblio-filtro-pendencia" data-f="categoria">🏷️ Sem categoria (${semCat})</button>` : ''}
      </div>` : ''}
    </div>

    ${b.formLivro ? renderBibliotecaFormLivro() : ''}

    <div class="card">
      ${livros.length===0 ? `<p class="muted center">Nenhum livro cadastrado${busca?' com essa busca':''}.</p>` : `
        <div class="table-scroll">
        <table class="pv-sign-table">
          <thead><tr><th style="width:52px;">Capa</th><th>Título</th><th>Autor</th><th>Categoria</th><th style="text-align:center;">Exemplares</th><th style="text-align:center;">Disponíveis</th><th></th></tr></thead>
          <tbody>
            ${livros.map(l => {
              const disp = bibliotecaExemplaresDisponiveis(l, b.emprestimos);
              const filaCount = (b.reservas||[]).filter(r=>r.livroId===l.id && r.status==='ativa').length;
              return `
              <tr>
                <td>${l.capaUrl ? `<img src="${cloudinaryLargura(l.capaUrl, 100)}" alt="" loading="lazy" style="width:44px; height:64px; object-fit:cover; border-radius:3px; display:block;">` : `<button class="btn btn-ghost btn-sm" data-action="biblioteca-livro-form-abrir" data-id="${l.id}" title="Adicionar a foto da capa" style="width:44px; height:64px; padding:0; font-size:1.1rem;">📷</button>`}</td>
                <td><strong>${esc(l.titulo)}</strong>${l.isbn?`<br><span class="muted" style="font-size:.75rem;">ISBN ${esc(l.isbn)}</span>`:`<br><a href="#" data-action="biblioteca-livro-form-abrir" data-id="${l.id}" data-foco="isbn" style="font-size:.75rem;">+ adicionar ISBN</a>`}${filaCount>0?`<br><span class="pill" style="font-size:.7rem; padding:1px 8px;">⏳ ${filaCount} na fila</span>`:''}</td>
                <td>${esc(l.autor||'-')}</td>
                <td>${esc(l.categoria||'-')}</td>
                <td style="text-align:center;">${l.exemplares}</td>
                <td style="text-align:center;">${disp===0?'<span class="err" style="margin:0;">0</span>':disp}</td>
                <td class="row" style="flex-wrap:nowrap; gap:4px;">
                  <button class="btn btn-ghost btn-sm" data-action="biblioteca-livro-form-abrir" data-id="${l.id}">✏️</button>
                  <button class="btn btn-ghost btn-sm" data-action="biblioteca-livro-excluir" data-id="${l.id}">✕</button>
                </td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>
        </div>
      `}
    </div>
  `;
}
const BIBLIO_CATEGORIAS = [
  'Literatura brasileira', 'Literatura estrangeira', 'Literatura infantojuvenil', 'Poesia', 'Teatro', 'Quadrinhos e mangás', 'Biografias e memórias',
  'Didático — Linguagens', 'Didático — Matemática', 'Didático — Ciências da Natureza', 'Didático — Ciências Humanas',
  'Técnico — Eletromecânica', 'Técnico — Petróleo e Gás', 'Técnico — Segurança do Trabalho', 'Técnico — outras áreas',
  'ENEM e vestibular', 'Dicionários e obras de referência', 'Divulgação científica e conhecimentos gerais',
  'Autoajuda e desenvolvimento pessoal', 'Religião e espiritualidade', 'Outros',
];
function biblioCategoriasDisponiveis(){
  const usadas = (state.biblioteca.livros||[]).map(l => (l.categoria||'').trim()).filter(Boolean);
  const extras = [...new Set(usadas)].filter(c => !BIBLIO_CATEGORIAS.includes(c)).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  return { padrao: BIBLIO_CATEGORIAS, extras };
}
const BIBLIO_PALAVRAS = [
  [/\b(nr[\s-]?\d+|seguran[cç]a do trabalho|epi\b|ergonomia|higiene (ocupacional|e seguran)|primeiros socorros|preven[cç][aã]o de (acidentes|inc[eê]ndio)|cipa)\b/i, 'Técnico — Segurança do Trabalho'],
  [/\b(petr[oó]leo|g[aá]s natural|perfura[cç][aã]o|refino|offshore|reservat[oó]rio|upstream)\b/i, 'Técnico — Petróleo e Gás'],
  [/\b(eletr[oô]nica|eletrot[eé]cnica|eletricidade|instala[cç][oõ]es el[eé]tricas|m[aá]quinas el[eé]tricas|motores?|mec[aâ]nica|automa[cç][aã]o|clp|soldagem|hidr[aá]ulica|pneum[aá]tica|manuten[cç][aã]o industrial|usinagem|desenho t[eé]cnico|eletromec)/i, 'Técnico — Eletromecânica'],
  [/\b(dicion[aá]rio|minidicion[aá]rio|atlas|enciclop[eé]dia|gram[aá]tica de refer)/i, 'Dicionários e obras de referência'],
  [/\b(enem|vestibular|simulados?)\b/i, 'ENEM e vestibular'],
  [/\b(matem[aá]tica|[aá]lgebra|geometria|c[aá]lculo|trigonometria|estat[ií]stica)\b/i, 'Didático — Matemática'],
  [/\b(f[ií]sica|qu[ií]mica|biologia|ci[eê]ncias da natureza)\b/i, 'Didático — Ciências da Natureza'],
  [/\b(hist[oó]ria (geral|do brasil)|geografia|sociologia|filosofia|ci[eê]ncias humanas)\b/i, 'Didático — Ciências Humanas'],
  [/\b(portugu[eê]s|l[ií]ngua portuguesa|gram[aá]tica|reda[cç][aã]o|ingl[eê]s|english|espanhol|arte|educa[cç][aã]o f[ií]sica|linguagens)\b/i, 'Didático — Linguagens'],
  [/\b(poemas?|poesias?|sonetos?|versos)\b/i, 'Poesia'],
  [/\b(mang[aá]|hq|quadrinhos|graphic novel|turma da m[oô]nica)\b/i, 'Quadrinhos e mangás'],
  [/\b(biografia|mem[oó]rias|autobiografia|di[aá]rio de)\b/i, 'Biografias e memórias'],
  [/\b(b[ií]blia|evangelho|ora[cç][oõ]es|espiritualidade)\b/i, 'Religião e espiritualidade'],
];
function biblioSugerirPorTitulo(titulo){
  const t = String(titulo||'');
  const hit = BIBLIO_PALAVRAS.find(([re]) => re.test(t));
  return hit ? hit[1] : '';
}
const BIBLIO_ASSISTENTE = {
  inicio: { p:'O livro é usado nas aulas (livro didático, apostila, livro do curso técnico)?', op:[['Sim','aula'],['Não','tipo']] },
  aula:   { p:'De qual área?', op:[['Português, Inglês, Arte ou Ed. Física','=Didático — Linguagens'],['Matemática','=Didático — Matemática'],['Física, Química ou Biologia','=Didático — Ciências da Natureza'],['História, Geografia, Sociologia ou Filosofia','=Didático — Ciências Humanas'],['Curso técnico','tecnico'],['Preparação para ENEM/vestibular','=ENEM e vestibular']] },
  tecnico:{ p:'De qual curso técnico?', op:[['Eletromecânica','=Técnico — Eletromecânica'],['Petróleo e Gás','=Técnico — Petróleo e Gás'],['Segurança do Trabalho','=Técnico — Segurança do Trabalho'],['Outro','=Técnico — outras áreas']] },
  tipo:   { p:'O que tem dentro do livro?', op:[['Uma história inventada (romance, conto, aventura)','historia'],['Poemas','=Poesia'],['Uma peça de teatro','=Teatro'],['Quadrinhos ou mangá','=Quadrinhos e mangás'],['A vida de uma pessoa real','=Biografias e memórias'],['Dicionário, atlas ou enciclopédia','=Dicionários e obras de referência'],['Explica um assunto (ciência, saúde, história, dinheiro…)','=Divulgação científica e conhecimentos gerais'],['Dicas para a vida, motivação','=Autoajuda e desenvolvimento pessoal'],['Religião','=Religião e espiritualidade'],['Não sei','=Outros']] },
  historia:{ p:'É um livro para crianças ou adolescentes (letras grandes, ilustrações, linguagem simples)?', op:[['Sim','=Literatura infantojuvenil'],['Não','autor']] },
  autor:  { p:'O autor é brasileiro?', op:[['Sim','=Literatura brasileira'],['Não','=Literatura estrangeira'],['Não sei','=Literatura brasileira']] },
};
function biblioCarregarImagem(src){
  return new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = () => reject(new Error('leitura-arquivo')); im.src = src; });
}
function biblioLerArquivo(file){
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error('leitura-arquivo')); r.readAsDataURL(file); });
}
function biblioCanvasReduzido(img, max){
  const k = Math.min(1, max / Math.max(img.naturalWidth||img.width, img.naturalHeight||img.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round((img.naturalWidth||img.width)*k)); c.height = Math.max(1, Math.round((img.naturalHeight||img.height)*k));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}
function biblioDetectarCantos(canvas){
  const W0 = canvas.width, H0 = canvas.height;
  const k = Math.min(1, 220 / Math.max(W0, H0));
  const w = Math.max(8, Math.round(W0*k)), h = Math.max(8, Math.round(H0*k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.drawImage(canvas, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const inteira = [{x:0,y:0},{x:W0,y:0},{x:W0,y:H0},{x:0,y:H0}];
  const borda = Math.max(2, Math.round(Math.min(w,h)*0.04));
  const amostras = [];
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    if(x<borda || y<borda || x>=w-borda || y>=h-borda){ const i=(y*w+x)*4; amostras.push([d[i],d[i+1],d[i+2]]); }
  }
  const med = [0,1,2].map(ch => { const v = amostras.map(a=>a[ch]).sort((a,b)=>a-b); return v[Math.floor(v.length/2)]; });
  const dist = (i) => Math.hypot(d[i]-med[0], d[i+1]-med[1], d[i+2]-med[2]);
  const distBorda = amostras.map(a => Math.hypot(a[0]-med[0], a[1]-med[1], a[2]-med[2])).sort((a,b)=>a-b);
  const limiar = Math.max(38, distBorda[Math.floor(distBorda.length*0.9)] * 1.6);
  const mask = new Uint8Array(w*h);
  for(let p=0;p<w*h;p++) mask[p] = dist(p*4) > limiar ? 1 : 0;
  // maior mancha (vizinhança de 4)
  const rot = new Int32Array(w*h); let melhor = 0, melhorTam = 0, atual = 0;
  const pilha = [];
  for(let p=0;p<w*h;p++){
    if(!mask[p] || rot[p]) continue;
    atual++; let tam = 0; pilha.push(p); rot[p] = atual;
    while(pilha.length){
      const q = pilha.pop(); tam++;
      const x = q % w, y = (q / w) | 0;
      const viz = [x>0?q-1:-1, x<w-1?q+1:-1, y>0?q-w:-1, y<h-1?q+w:-1];
      for(const v of viz){ if(v>=0 && mask[v] && !rot[v]){ rot[v] = atual; pilha.push(v); } }
    }
    if(tam > melhorTam){ melhorTam = tam; melhor = atual; }
  }
  if(melhorTam < w*h*0.12) return inteira;          // nada que pareça um livro: usa a foto inteira
  let tl=null, tr=null, br=null, bl=null;
  for(let p=0;p<w*h;p++){
    if(rot[p]!==melhor) continue;
    const x = p % w, y = (p / w) | 0;
    if(!tl || x+y < tl.x+tl.y) tl = {x,y};
    if(!br || x+y > br.x+br.y) br = {x,y};
    if(!tr || x-y > tr.x-tr.y) tr = {x,y};
    if(!bl || x-y < bl.x-bl.y) bl = {x,y};
  }
  const s = 1/k;
  const cantos = [tl,tr,br,bl].map(pt => ({ x: Math.min(W0, Math.max(0, (pt.x+0.5)*s)), y: Math.min(H0, Math.max(0, (pt.y+0.5)*s)) }));
  return biblioAreaQuad(cantos) > W0*H0*0.12 ? cantos : inteira;
}
function biblioAreaQuad(q){ let a = 0; for(let i=0;i<4;i++){ const p=q[i], n=q[(i+1)%4]; a += p.x*n.y - n.x*p.y; } return Math.abs(a)/2; }
function biblioHomografia(W, H, q){
  const src = [[0,0],[W,0],[W,H],[0,H]], dst = q.map(p=>[p.x,p.y]);
  const A = [], b = [];
  for(let i=0;i<4;i++){
    const [x,y] = src[i], [u,v] = dst[i];
    A.push([x,y,1,0,0,0,-u*x,-u*y]); b.push(u);
    A.push([0,0,0,x,y,1,-v*x,-v*y]); b.push(v);
  }
  for(let c=0;c<8;c++){                                   // eliminação de Gauss
    let piv = c; for(let r=c+1;r<8;r++) if(Math.abs(A[r][c])>Math.abs(A[piv][c])) piv = r;
    [A[c],A[piv]] = [A[piv],A[c]]; [b[c],b[piv]] = [b[piv],b[c]];
    for(let r=0;r<8;r++){ if(r===c) continue; const f = A[r][c]/A[c][c]; for(let k=c;k<8;k++) A[r][k] -= f*A[c][k]; b[r] -= f*b[c]; }
  }
  return b.map((v,i)=>v/A[i][i]);
}
function biblioEndireitar(fonte, q, alturaMax){
  const L = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
  let W = (L(q[0],q[1]) + L(q[3],q[2]))/2, H = (L(q[0],q[3]) + L(q[1],q[2]))/2;
  const esc = Math.min(1, (alturaMax||900)/H);
  W = Math.max(20, Math.round(W*esc)); H = Math.max(20, Math.round(H*esc));
  const h = biblioHomografia(W, H, q);
  const sw = fonte.width, sh = fonte.height;
  const sd = fonte.getContext('2d').getImageData(0, 0, sw, sh).data;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const octx = out.getContext('2d'); const od = octx.createImageData(W, H);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const den = h[6]*x + h[7]*y + 1;
      let u = (h[0]*x + h[1]*y + h[2]) / den, v = (h[3]*x + h[4]*y + h[5]) / den;
      u = Math.min(sw-1.001, Math.max(0, u)); v = Math.min(sh-1.001, Math.max(0, v));
      const x0 = u|0, y0 = v|0, fx = u-x0, fy = v-y0;
      const i00 = (y0*sw+x0)*4, i10 = i00+4, i01 = i00+sw*4, i11 = i01+4, o = (y*W+x)*4;
      for(let ch=0;ch<3;ch++){
        od.data[o+ch] = (sd[i00+ch]*(1-fx) + sd[i10+ch]*fx)*(1-fy) + (sd[i01+ch]*(1-fx) + sd[i11+ch]*fx)*fy;
      }
      od.data[o+3] = 255;
    }
  }
  octx.putImageData(od, 0, 0);
  return out;
}
function biblioCanvasParaBlob(cv){ return new Promise(res => cv.toBlob(b => res(b), 'image/jpeg', 0.86)); }
async function biblioCapaSelecionada(file){
  const b = state.biblioteca, f = b.formLivro;
  if(!file || !f) return;
  if(!file.type.startsWith('image/')){ b.livroIaError = 'Selecione uma foto da capa.'; render(); return; }
  b.livroError = ''; b.livroIaError = '';
  b.capaProcessando = true; render();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  try{
    const dataUrl = await biblioLerArquivo(file);
    const img = await biblioCarregarImagem(dataUrl);
    const fonte = biblioCanvasReduzido(img, 1800);
    const cantos = biblioDetectarCantos(fonte);
    b.capaEditor = { fonte, src: fonte.toDataURL('image/jpeg', 0.9), w: fonte.width, h: fonte.height, cantos, tocado:false };
    b.capaProcessando = false;
    await biblioAplicarCorte();
    biblioLerCapaComIA(dataUrl);   // em paralelo: título, autor, categoria e (se der) cantos mais precisos
  }catch(e){
    b.capaProcessando = false;
    b.livroIaError = 'Não foi possível abrir essa foto. Tente tirar outra.';
    render();
  }
}
async function biblioAplicarCorte(){
  const b = state.biblioteca, ed = b.capaEditor, f = b.formLivro;
  if(!ed || !f) return;
  const cv = biblioEndireitar(ed.fonte, ed.cantos, 900);
  f.capaBlob = await biblioCanvasParaBlob(cv);
  f.capaPreview = cv.toDataURL('image/jpeg', 0.86);
  render();
}
function renderBiblioCapaEditor(){
  const b = state.biblioteca, ed = b.capaEditor;
  if(!ed || !b.capaAjustando) return '';
  const r = Math.max(ed.w, ed.h) * 0.03;
  const pts = ed.cantos.map(p => `${p.x},${p.y}`).join(' ');
  return `
    <div data-capa-editor="1" style="margin-top:10px;">
      <p class="muted" style="font-size:.82rem; margin:0 0 6px;">Arraste as 4 bolinhas até os cantos do livro. A capa é endireitada sozinha.</p>
      <div style="position:relative; max-width:420px; touch-action:none; user-select:none;">
        <img src="${ed.src}" style="display:block; width:100%; border-radius:6px;" alt="Foto original da capa" draggable="false">
        <svg id="capa-editor-svg" viewBox="0 0 ${ed.w} ${ed.h}" preserveAspectRatio="none" style="position:absolute; inset:0; width:100%; height:100%;">
          <polygon id="capa-editor-poly" points="${pts}" fill="rgba(91,26,44,.18)" stroke="#f5c542" stroke-width="${r/3}"/>
          ${ed.cantos.map((p,i) => `<circle data-capa-handle="${i}" cx="${p.x}" cy="${p.y}" r="${r}" fill="#f5c542" stroke="#5b1a2c" stroke-width="${r/4}" style="cursor:grab;"/>`).join('')}
        </svg>
      </div>
      <div class="row" style="gap:6px; margin-top:8px; flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" data-action="biblio-capa-pronto">✓ Pronto</button>
        <button class="btn btn-ghost btn-sm" data-action="biblio-capa-redetectar">↺ Achar os cantos de novo</button>
        <button class="btn btn-ghost btn-sm" data-action="biblio-capa-inteira">Usar a foto inteira</button>
      </div>
    </div>`;
}
async function biblioLerCapaComIA(dataUrl){
  const b = state.biblioteca, f = b.formLivro;
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || '');
  if(!m || !f) return;
  b.livroIaLoading = true; render();
  const prompt = `Você está vendo a foto da capa de um livro de uma biblioteca escolar. Responda em JSON com exatamente estas chaves:
{"titulo": string, "autor": string, "isbn": string, "categoria": string, "motivoCategoria": string, "cantos": [[x,y],[x,y],[x,y],[x,y]]}
Regras:
- "titulo": título principal do livro. "autor": nome(s) do(s) autor(es), separados por vírgula; "" se não estiver visível.
- "isbn": só se estiver visível na foto (números e hífens); senão "".
- "categoria": escolha UMA destas, escrita exatamente igual: ${BIBLIO_CATEGORIAS.join(' | ')}. Use o título, o autor, a editora e as imagens da capa. Se não der para saber, use "Outros".
- "motivoCategoria": uma frase curta e simples explicando a escolha (ex.: "Romance de Machado de Assis, autor brasileiro").
- "cantos": os 4 cantos da CAPA do livro na foto, na ordem superior-esquerdo, superior-direito, inferior-direito, inferior-esquerdo, em coordenadas de 0 a 1000 relativas à largura (x) e à altura (y) da imagem. Use [] se a capa não estiver toda visível.
Não invente informação que não esteja visível ou claramente indicada.`;
  try{
    const dados = await callGeminiJSON(prompt, null, { mimeType: m[1], base64: m[2] });
    const fa = state.biblioteca.formLivro;
    if(!fa || fa!==f){ b.livroIaLoading = false; return; }
    if(dados.titulo && !fa.tituloTocado) fa.titulo = dados.titulo;
    if(dados.autor && !fa.autorTocado) fa.autor = dados.autor;
    if(dados.isbn && !fa.isbn) fa.isbn = String(dados.isbn).replace(/[^0-9Xx-]/g,'');
    if(dados.categoria && BIBLIO_CATEGORIAS.includes(dados.categoria)){
      b.sugestaoCategoria = { categoria: dados.categoria, motivo: String(dados.motivoCategoria||''), fonte:'ia' };
      if(!fa.categoria) fa.categoria = dados.categoria;
    }
    const ed = b.capaEditor;
    if(ed && !ed.tocado && Array.isArray(dados.cantos) && dados.cantos.length===4 && dados.cantos.every(p => Array.isArray(p) && p.length===2 && p.every(n => typeof n==='number' && n>=0 && n<=1000))){
      const q = dados.cantos.map(([x,y]) => ({ x: x/1000*ed.w, y: y/1000*ed.h }));
      if(biblioAreaQuad(q) > ed.w*ed.h*0.12){ ed.cantos = q; await biblioAplicarCorte(); }
    }
  }catch(e){
    b.livroIaError = (e && e.message==='IA_NAO_CONFIGURADA') ? '' : 'A IA não conseguiu ler a capa agora. Preencha os dados à mão — a capa já foi recortada.';
  }
  b.livroIaLoading = false;
  render();
}
function biblioNormalizarIsbn(s){ return String(s||'').replace(/[^0-9Xx]/g,'').toUpperCase(); }
function biblioIsbnValido(s){
  const n = biblioNormalizarIsbn(s);
  if(n.length===13 && /^\d{13}$/.test(n)){ let t=0; for(let i=0;i<12;i++) t += (+n[i])*(i%2?3:1); return (10 - t%10)%10 === +n[12]; }
  if(n.length===10 && /^\d{9}[\dX]$/.test(n)){ let t=0; for(let i=0;i<10;i++) t += (n[i]==='X'?10:+n[i])*(10-i); return t%11===0; }
  return false;
}
async function biblioLerCodigoBarras(file){
  const b = state.biblioteca, f = b.formLivro;
  if(!file || !f) return;
  b.isbnMsg = 'Lendo o código de barras…'; render();
  try{
    if(!('BarcodeDetector' in window)) throw new Error('sem-suporte');
    const img = await biblioCarregarImagem(await biblioLerArquivo(file));
    const det = new window.BarcodeDetector({ formats: ['ean_13'] });
    const cods = await det.detect(biblioCanvasReduzido(img, 1600));
    const isbn = (cods.map(c => biblioNormalizarIsbn(c.rawValue)).find(v => /^97[89]\d{10}$/.test(v)) || '');
    if(!isbn) throw new Error('nao-achou');
    f.isbn = isbn; b.isbnMsg = '✓ ISBN lido: ' + isbn;
  }catch(e){
    b.isbnMsg = e.message==='sem-suporte' ? 'Este navegador não lê código de barras. Digite os números que ficam embaixo das barras (começam com 978 ou 979).'
      : 'Não achei o código de barras nessa foto. Tente de novo, bem de perto e com luz, ou digite os números.';
  }
  render();
}
function renderBibliotecaFormLivro(){
  const b = state.biblioteca;
  const f = b.formLivro;
  const { padrao, extras } = biblioCategoriasDisponiveis();
  const outra = f.categoria && !padrao.includes(f.categoria) && !extras.includes(f.categoria);
  const sug = b.sugestaoCategoria;
  const palpite = !sug ? biblioSugerirPorTitulo(f.titulo) : '';
  const temCapa = !!(f.capaPreview || f.capaUrl);
  const isbnRuim = f.isbn && !biblioIsbnValido(f.isbn);
  const assist = b.assistenteCategoria;
  const passo = assist ? BIBLIO_ASSISTENTE[assist] : null;
  return `
    <div class="card" data-form-livro="1">
      <h3 style="margin-top:0;">${f.id?'Editar livro':'Novo livro'}</h3>

      <label style="margin-top:0;">1. Foto da capa ${f.id ? '' : '<span style="color:#b3261e;">(obrigatória)</span>'}</label>
      <div class="row" style="gap:12px; align-items:flex-start; flex-wrap:wrap;">
        <div style="width:120px; flex:0 0 120px; aspect-ratio:2/3; border:2px dashed var(--paper-line); border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; background:var(--surface);">
          ${temCapa ? `<img src="${f.capaPreview || cloudinaryLargura(f.capaUrl, 240)}" style="width:100%; height:100%; object-fit:contain;" alt="Capa" data-capa-preview="1">` : '<span class="muted" style="font-size:2rem;">📕</span>'}
        </div>
        <div style="flex:1 1 220px;">
          <p class="muted" style="font-size:.82rem; margin:0 0 8px;">Tire a foto com o livro em cima de uma mesa de cor lisa e diferente da capa. O app recorta e endireita sozinho, deixando só a capa.${b.livroIaLoading ? '' : ' Se a IA estiver configurada, ela também lê o título, o autor e sugere a categoria.'}</p>
          <label class="btn btn-primary btn-sm" style="display:inline-block; margin:0; cursor:pointer; text-transform:none;">📷 ${temCapa ? 'Tirar outra foto' : 'Tirar foto da capa'}
            <input type="file" id="biblioteca-capa-input" accept="image/*" capture="environment" style="display:none;" ${b.capaProcessando?'disabled':''}>
          </label>
          ${b.capaEditor ? `<button class="btn btn-ghost btn-sm" data-action="biblio-capa-ajustar" style="margin-left:6px;">✂️ Ajustar recorte</button>` : ''}
          ${b.capaProcessando ? '<p class="muted" style="font-size:.82rem; margin-top:6px;">Recortando a capa…</p>' : ''}
          ${b.livroIaLoading ? '<p class="muted" style="font-size:.82rem; margin-top:6px;">🤖 Lendo os dados da capa…</p>' : ''}
          ${b.livroIaError ? `<p class="err" style="font-size:.82rem;">${esc(b.livroIaError)}</p>` : ''}
        </div>
      </div>
      ${renderBiblioCapaEditor()}

      <label>2. Título</label>
      <input type="text" id="biblioteca-livro-titulo-input" value="${esc(f.titulo||'')}">
      <label>Autor</label>
      <input type="text" id="biblioteca-livro-autor-input" value="${esc(f.autor||'')}">

      <label>3. Categoria</label>
      <select id="biblioteca-livro-categoria-select" data-action="biblio-categoria">
        <option value="">Escolha…</option>
        ${padrao.map(c => `<option value="${esc(c)}" ${f.categoria===c?'selected':''}>${esc(c)}</option>`).join('')}
        ${extras.length ? `<optgroup label="Já usadas neste catálogo">${extras.map(c => `<option value="${esc(c)}" ${f.categoria===c?'selected':''}>${esc(c)}</option>`).join('')}</optgroup>` : ''}
        <option value="__outra" ${outra||f.categoriaOutra?'selected':''}>➕ Outra categoria…</option>
      </select>
      ${(outra || f.categoriaOutra) ? `<input type="text" id="biblioteca-livro-categoria-input" value="${esc(outra ? f.categoria : (f.categoriaNova||''))}" placeholder="Digite a nova categoria" style="margin-top:6px;">` : ''}
      ${sug && sug.categoria!==f.categoria ? `<p style="font-size:.85rem; margin:6px 0 0;">🤖 Sugestão da IA: <strong>${esc(sug.categoria)}</strong>${sug.motivo?` <span class="muted">— ${esc(sug.motivo)}</span>`:''} <button class="btn btn-ghost btn-sm" data-action="biblio-usar-sugestao" data-cat="${esc(sug.categoria)}">Usar</button></p>` : ''}
      ${sug && sug.categoria===f.categoria ? `<p class="muted" style="font-size:.82rem; margin:6px 0 0;">🤖 Categoria sugerida pela IA${sug.motivo?': '+esc(sug.motivo):''}. Confira se faz sentido.</p>` : ''}
      ${palpite && palpite!==f.categoria ? `<p style="font-size:.85rem; margin:6px 0 0;">💡 Pelo título, parece ser <strong>${esc(palpite)}</strong>. <button class="btn btn-ghost btn-sm" data-action="biblio-usar-sugestao" data-cat="${esc(palpite)}">Usar</button></p>` : ''}
      ${!assist ? `<button class="btn btn-ghost btn-sm" data-action="biblio-assistente" data-passo="inicio" style="margin-top:6px;">🤔 Não sei a categoria — me ajude</button>` : `
        <div style="border:1px solid var(--paper-line); border-radius:8px; padding:10px 12px; margin-top:8px; background:var(--surface);" data-assistente="1">
          <p style="margin:0 0 8px;"><strong>${esc(passo.p)}</strong></p>
          <div class="row" style="gap:6px; flex-wrap:wrap;">
            ${passo.op.map(([t, alvo]) => `<button class="btn btn-ghost btn-sm" data-action="biblio-assistente" data-passo="${esc(alvo)}">${esc(t)}</button>`).join('')}
          </div>
          <button class="btn btn-ghost btn-sm" data-action="biblio-assistente" data-passo="" style="margin-top:6px; font-size:.78rem;">Fechar</button>
        </div>`}

      <label>4. ISBN <span class="muted" style="text-transform:none; font-weight:400;">(opcional — pode adicionar depois)</span></label>
      <input type="text" id="biblioteca-livro-isbn-input" value="${esc(f.isbn||'')}" placeholder="Ex.: 978-85-359-0277-8" inputmode="numeric">
      <p class="muted" style="font-size:.78rem; margin:4px 0 0;">Fica na contracapa, embaixo do código de barras (começa com 978 ou 979).</p>
      ${'BarcodeDetector' in window ? `<label class="btn btn-ghost btn-sm" style="display:inline-block; margin-top:6px; cursor:pointer; text-transform:none;">📷 Ler o código de barras da contracapa
        <input type="file" id="biblioteca-isbn-foto-input" accept="image/*" capture="environment" style="display:none;"></label>` : ''}
      ${b.isbnMsg ? `<p style="font-size:.82rem; margin:4px 0 0;">${esc(b.isbnMsg)}</p>` : ''}
      ${isbnRuim ? '<p style="font-size:.82rem; margin:4px 0 0; color:#b3261e;">⚠ Esse ISBN parece ter algum número errado. Confira (dá para salvar assim mesmo e corrigir depois).</p>' : ''}

      <label>Palavras-chave / temas <span class="muted" style="text-transform:none; font-weight:400;">(opcional — liga o livro às aulas do plano)</span></label>
      <input type="text" id="biblioteca-livro-tags-input" value="${esc(f.palavrasChave||'')}" placeholder="Ex.: ética, Platão, meio ambiente, petróleo">
      <p class="muted" style="font-size:.78rem; margin:4px 0 0;">Separe por vírgula. O livro aparece para os professores nas aulas que tratam desses temas.</p>

      <label>5. Quantidade de exemplares</label>
      <input type="number" min="1" step="1" id="biblioteca-livro-exemplares-input" value="${f.exemplares||1}">
      ${b.livroError ? `<p class="err">${esc(b.livroError)}</p>` : ''}
      ${b.capaEnviando ? '<p class="muted">Enviando a capa…</p>' : ''}
      <div class="row" style="margin-top:10px;">
        <button class="btn btn-ghost" data-action="biblioteca-livro-form-cancelar">Cancelar</button>
        <button class="btn btn-primary" data-action="biblioteca-livro-salvar" ${b.capaEnviando||b.capaProcessando?'disabled':''}>Salvar</button>
      </div>
    </div>
  `;
}
function biblioGuardarCampos(){
  const f = state.biblioteca.formLivro; if(!f) return;
  const v = id => { const el = document.getElementById(id); return el ? el.value : null; };
  const t = v('biblioteca-livro-titulo-input'); if(t!==null) f.titulo = t;
  const a = v('biblioteca-livro-autor-input'); if(a!==null) f.autor = a;
  const i = v('biblioteca-livro-isbn-input'); if(i!==null) f.isbn = i;
  const n = v('biblioteca-livro-exemplares-input'); if(n!==null) f.exemplares = n;
  const tg = v('biblioteca-livro-tags-input'); if(tg!==null) f.palavrasChave = tg;
  const c = v('biblioteca-livro-categoria-input'); if(c!==null){ f.categoriaNova = c; if(f.categoriaOutra || !BIBLIO_CATEGORIAS.includes(f.categoria)) f.categoria = c; }
}
function bibliotecaAbrirFormLivro(id, foco){
  const b = state.biblioteca;
  if(id){
    const l = b.livros.find(x=>x.id===id);
    if(!l) return;
    b.formLivro = { id:l.id, titulo:l.titulo, autor:l.autor, categoria:l.categoria||'', isbn:l.isbn||'', exemplares:l.exemplares, capaUrl:l.capaUrl||'', palavrasChave:l.palavrasChave||'' };
  } else {
    b.formLivro = { id:null, titulo:'', autor:'', categoria:'', isbn:'', exemplares:1, capaUrl:'' };
  }
  b.livroError = ''; b.livroIaError = ''; b.livroIaLoading = false; b.isbnMsg = '';
  b.capaEditor = null; b.capaAjustando = false; b.capaProcessando = false; b.capaEnviando = false;
  b.sugestaoCategoria = null; b.assistenteCategoria = '';
  render();
  setTimeout(() => {
    const card = document.querySelector('[data-form-livro]'); if(card) card.scrollIntoView({ behavior:'smooth', block:'start' });
    if(foco==='isbn'){ const el = document.getElementById('biblioteca-livro-isbn-input'); if(el) el.focus(); }
  }, 50);
}
function bibliotecaCancelarFormLivro(){
  const b = state.biblioteca;
  b.formLivro = null; b.livroError = ''; b.capaEditor = null; b.capaAjustando = false;
  render();
}
async function bibliotecaSalvarLivro(){
  const b = state.biblioteca;
  const f = b.formLivro;
  biblioGuardarCampos();
  const titulo = (f.titulo||'').trim();
  const autor = (f.autor||'').trim();
  const categoria = (f.categoria||'').trim();
  const isbn = (f.isbn||'').trim();
  const exemplares = parseInt(f.exemplares) || 0;
  const palavrasChave = (f.palavrasChave||'').trim();
  if(!f.id && !f.capaBlob){ b.livroError = 'Tire a foto da capa do livro antes de salvar.'; render(); return; }
  if(!titulo){ b.livroError = 'Informe o título do livro.'; render(); return; }
  if(!categoria){ b.livroError = 'Escolha a categoria. Se não souber, toque em "🤔 Não sei a categoria — me ajude".'; render(); return; }
  if(exemplares < 1){ b.livroError = 'Informe pelo menos 1 exemplar.'; render(); return; }
  let capaUrl = f.capaUrl || '';
  if(f.capaBlob){
    b.capaEnviando = true; b.livroError = ''; render();
    try{
      const arq = new File([f.capaBlob], 'capa.jpg', { type:'image/jpeg' });
      capaUrl = await uploadImageToCloudinary(arq, 'biblioteca-capas');
    }catch(e){
      b.capaEnviando = false;
      b.livroError = 'Não foi possível enviar a foto da capa (verifique a internet) e tente salvar de novo.';
      render(); return;
    }
    b.capaEnviando = false;
  }
  if(f.id){
    const l = b.livros.find(x=>x.id===f.id);
    Object.assign(l, { titulo, autor, categoria, isbn, exemplares, palavrasChave, capaUrl: capaUrl || l.capaUrl || '' });
  } else {
    b.livros.push({ id: cryptoId(), titulo, autor, categoria, isbn, exemplares, palavrasChave, capaUrl, createdAt: Date.now() });
  }
  await saveBibliotecaLivros();
  b.formLivro = null; b.livroError = ''; b.capaEditor = null; b.capaAjustando = false;
  render();
}
async function bibliotecaExcluirLivro(id){
  const b = state.biblioteca;
  const ativos = b.emprestimos.filter(e => e.livroId===id && !e.dataDevolucao);
  if(ativos.length>0){ alert('Esse livro tem empréstimo(s) em aberto — registre a devolução antes de excluir.'); return; }
  if(!confirm('Excluir este livro do catálogo?')) return;
  b.livros = b.livros.filter(l=>l.id!==id);
  await saveBibliotecaLivros();
  render();
}
function renderBibliotecaEmprestimos(){
  const b = state.biblioteca;
  const f = b.formEmprestimo;
  if(!f.dataEmprestimo) f.dataEmprestimo = new Date().toISOString().slice(0,10);
  if(!f.dataPrevista) f.dataPrevista = bibliotecaPrazoPadrao();
  const turmaSel = b.turmas.find(t=>t.id===f.turmaId);
  const alunosDaTurma = turmaSel ? turmaSel.students : [];
  const livrosDisponiveis = b.livros.filter(l => bibliotecaExemplaresDisponiveis(l, b.emprestimos) > 0);

  const busca = (b.buscaEmprestimo||'').trim().toLowerCase();
  const todos = b.emprestimos.map(e => ({ ...e, status: bibliotecaEmprestimoStatus(e), venceEmBreve: bibliotecaVenceEmBreve(e), dias: bibliotecaDiasAteVencer(e) }));
  const lista = (b.mostrarHistorico ? todos : todos.filter(e=>e.status!=='devolvido'))
    .filter(e => !busca || e.studentName.toLowerCase().includes(busca) || e.livroTitulo.toLowerCase().includes(busca) || (e.turmaName||'').toLowerCase().includes(busca))
    .sort((x,y) => {
      const rank = e => e.status==='atrasado'?0 : (e.status==='emprestado' && e.venceEmBreve)?1 : e.status==='emprestado'?2 : 3;
      if(rank(x)!==rank(y)) return rank(x)-rank(y);
      return (y.createdAt||0)-(x.createdAt||0);
    });
  const atrasadosCount = todos.filter(e=>e.status==='atrasado').length;
  const venceEmBreveCount = todos.filter(e=>e.status==='emprestado' && e.venceEmBreve).length;
  const emprestimosAtivosDoAluno = f.studentId ? b.emprestimos.filter(e=>e.studentId===f.studentId && !e.dataDevolucao).length : 0;

  return `
    <div class="card">
      <h2 style="margin-top:0;">Registrar empréstimo</h2>
      <label>Turma</label>
      <select id="biblioteca-emp-turma-select">
        <option value="">— selecione a turma —</option>
        ${b.turmas.map(t=>`<option value="${t.id}" ${f.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}
      </select>
      <label style="margin-top:8px;">Aluno</label>
      <select id="biblioteca-emp-aluno-select" ${!f.turmaId?'disabled':''}>
        <option value="">— selecione o aluno —</option>
        ${alunosDaTurma.map(s=>`<option value="${s.id}" ${f.studentId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}
      </select>
      ${f.studentId ? `<p class="muted" style="font-size:.78rem; margin-top:2px;">${emprestimosAtivosDoAluno} de ${b.limiteEmprestimos} livro(s) já emprestado(s) por esse aluno.</p>` : ''}
      <label style="margin-top:8px;">Livro</label>
      <select id="biblioteca-emp-livro-select">
        <option value="">— selecione o livro —</option>
        ${livrosDisponiveis.map(l=>`<option value="${l.id}" ${f.livroId===l.id?'selected':''}>${esc(l.titulo)} · ${bibliotecaExemplaresDisponiveis(l,b.emprestimos)} disponível(is)</option>`).join('')}
      </select>
      ${livrosDisponiveis.length===0 ? '<p class="muted" style="font-size:.82rem;">Nenhum livro com exemplar disponível no momento.</p>' : ''}
      <div class="row" style="margin-top:8px;">
        <div style="flex:1;">
          <label>Data do empréstimo</label>
          <input type="date" id="biblioteca-emp-data-input" value="${f.dataEmprestimo}">
        </div>
        <div style="flex:1;">
          <label>Devolução prevista</label>
          <input type="date" id="biblioteca-emp-prazo-input" value="${f.dataPrevista}">
        </div>
      </div>
      ${b.emprestimoError ? `<p class="err">${esc(b.emprestimoError)}</p>` : ''}
      <button class="btn btn-primary" style="margin-top:10px;" data-action="biblioteca-emprestimo-registrar">Registrar empréstimo</button>
      <p class="muted" style="font-size:.78rem; margin-top:10px;">
        Limite de livros por aluno ao mesmo tempo:
        <input type="number" min="1" step="1" id="biblioteca-limite-input" value="${b.limiteEmprestimos}" style="width:56px; display:inline-block; padding:2px 6px; margin:0 4px;">
        <button class="btn btn-ghost btn-sm" data-action="biblioteca-salvar-limite" style="padding:2px 10px;">Salvar</button>
      </p>
    </div>

    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h2 style="margin:0;">Empréstimos ${b.mostrarHistorico?'':'em aberto'} (${lista.length})</h2>
        <div class="row" style="flex:0 0 auto; gap:6px;">
          ${atrasadosCount>0 ? `<span class="pill" style="background:var(--red); color:#fff;">⚠️ ${atrasadosCount} atrasado(s)</span>` : ''}
          ${venceEmBreveCount>0 ? `<span class="pill" style="background:#c98a2b; color:#fff;">⏳ ${venceEmBreveCount} vencendo em breve</span>` : ''}
          <button class="btn btn-ghost btn-sm" data-action="biblioteca-toggle-historico">${b.mostrarHistorico?'Ver só em aberto':'Ver histórico completo'}</button>
        </div>
      </div>
      <input type="text" id="biblioteca-busca-emprestimo-input" placeholder="Buscar por aluno, livro ou turma..." value="${esc(b.buscaEmprestimo||'')}" style="margin-top:10px;">
      ${lista.length===0 ? '<p class="muted center" style="margin-top:12px;">Nenhum empréstimo encontrado.</p>' : `
        <div class="table-scroll">
        <table class="pv-sign-table" style="margin-top:10px;">
          <thead><tr><th>Aluno</th><th>Turma</th><th>Livro</th><th>Empréstimo</th><th>Devolução prevista</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            ${lista.map(e => `
              <tr>
                <td>${esc(e.studentName)}</td>
                <td>${esc(e.turmaName||'-')}</td>
                <td>${esc(e.livroTitulo)}</td>
                <td>${bibliotecaFmtData(e.dataEmprestimo)}</td>
                <td>${bibliotecaFmtData(e.dataPrevista)}${e.renovacoes?`<br><span class="muted" style="font-size:.72rem;">renovado ${e.renovacoes}x</span>`:''}</td>
                <td>${bibliotecaStatusPill(e.status, e.dataDevolucao, e.venceEmBreve, e.dias)}</td>
                <td class="row" style="flex-wrap:nowrap; gap:4px;">
                  ${e.status!=='devolvido' ? `
                    ${(e.renovacoes||0) < BIBLIOTECA_MAX_RENOVACOES ? `<button class="btn btn-ghost btn-sm" data-action="biblioteca-emprestimo-renovar" data-id="${e.id}" title="Renova por mais 14 dias">🔄 Renovar</button>` : ''}
                    <button class="btn btn-primary btn-sm" data-action="biblioteca-emprestimo-devolver" data-id="${e.id}">Registrar devolução</button>
                  ` : `<button class="btn btn-ghost btn-sm" data-action="biblioteca-emprestimo-excluir" data-id="${e.id}">✕</button>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      `}
    </div>
  `;
}
async function bibliotecaRegistrarEmprestimo(){
  const b = state.biblioteca;
  const f = b.formEmprestimo;
  const turma = b.turmas.find(t=>t.id===f.turmaId);
  const aluno = turma ? turma.students.find(s=>s.id===f.studentId) : null;
  const livro = b.livros.find(l=>l.id===f.livroId);
  if(!turma || !aluno){ b.emprestimoError = 'Selecione a turma e o aluno.'; render(); return; }
  if(!livro){ b.emprestimoError = 'Selecione o livro.'; render(); return; }
  if(bibliotecaExemplaresDisponiveis(livro, b.emprestimos) <= 0){ b.emprestimoError = 'Não há exemplares disponíveis desse livro no momento.'; render(); return; }
  if(!f.dataEmprestimo || !f.dataPrevista){ b.emprestimoError = 'Informe as duas datas.'; render(); return; }
  if(f.dataPrevista < f.dataEmprestimo){ b.emprestimoError = 'A devolução prevista não pode ser antes da data do empréstimo.'; render(); return; }
  const jaTem = b.emprestimos.some(e => e.livroId===livro.id && e.studentId===aluno.id && !e.dataDevolucao);
  if(jaTem){ b.emprestimoError = `${aluno.name} já está com um exemplar desse livro emprestado.`; render(); return; }
  const ativosDoAluno = b.emprestimos.filter(e => e.studentId===aluno.id && !e.dataDevolucao).length;
  if(ativosDoAluno >= b.limiteEmprestimos){ b.emprestimoError = `${aluno.name} já atingiu o limite de ${b.limiteEmprestimos} livro(s) emprestado(s) ao mesmo tempo.`; render(); return; }

  b.emprestimos.push({
    id: cryptoId(), livroId: livro.id, livroTitulo: livro.titulo,
    studentId: aluno.id, studentName: aluno.name, turmaId: turma.id, turmaName: turma.name,
    dataEmprestimo: f.dataEmprestimo, dataPrevista: f.dataPrevista, dataDevolucao: null,
    renovacoes: 0, createdAt: Date.now()
  });
  await saveBibliotecaEmprestimos();
  b.formEmprestimo = { turmaId: turma.id, studentId:'', livroId:'', dataEmprestimo: new Date().toISOString().slice(0,10), dataPrevista: bibliotecaPrazoPadrao() };
  b.emprestimoError = '';
  render();
}
async function bibliotecaRenovarEmprestimo(id){
  const b = state.biblioteca;
  const e = b.emprestimos.find(x=>x.id===id);
  if(!e || e.dataDevolucao) return;
  if((e.renovacoes||0) >= BIBLIOTECA_MAX_RENOVACOES){ alert(`Esse empréstimo já atingiu o limite de ${BIBLIOTECA_MAX_RENOVACOES} renovações — registre a devolução.`); return; }
  e.dataPrevista = bibliotecaPrazoPadrao();
  e.renovacoes = (e.renovacoes||0) + 1;
  await saveBibliotecaEmprestimos();
  render();
}
async function bibliotecaRegistrarDevolucao(id){
  const b = state.biblioteca;
  const e = b.emprestimos.find(x=>x.id===id);
  if(!e) return;
  if(!confirm(`Registrar a devolução de "${e.livroTitulo}" por ${e.studentName}?`)) return;
  const hoje = new Date().toISOString().slice(0,10);
  const foiNoPrazo = !e.dataPrevista || hoje <= e.dataPrevista;
  e.dataDevolucao = hoje;
  await saveBibliotecaEmprestimos();
  // Recompensa a devolução em dia com fichas, ligando a biblioteca à gamificação já usada no resto do app.
  if(foiNoPrazo && e.turmaId && e.studentId){
    try{ await awardFichas(e.turmaId, e.studentId, BIBLIOTECA_FICHAS_DEVOLUCAO_PRAZO, `Devolveu "${e.livroTitulo}" no prazo`, 'biblioteca'); }catch(err){}
  }
  // Se alguém está na fila de espera desse livro, avisa a bibliotecária pra chamar o próximo.
  const proximaReserva = (b.reservas||[]).filter(r=>r.livroId===e.livroId && r.status==='ativa').sort((x,y)=>x.createdAt-y.createdAt)[0];
  if(proximaReserva){
    proximaReserva.notificada = true;
    await saveBibliotecaReservas();
    alert(`📚 Esse livro tem fila de espera!\n\nAvise ${proximaReserva.studentName} (${proximaReserva.turmaName}) que já tem um exemplar disponível.`);
  }
  render();
}
async function bibliotecaExcluirEmprestimo(id){
  const b = state.biblioteca;
  if(!confirm('Excluir este registro do histórico de empréstimos?')) return;
  b.emprestimos = b.emprestimos.filter(e=>e.id!==id);
  await saveBibliotecaEmprestimos();
  render();
}
function renderBibliotecaReservas(){
  const b = state.biblioteca;
  const f = b.formReserva;
  const turmaSel = b.turmas.find(t=>t.id===f.turmaId);
  const alunosDaTurma = turmaSel ? [...turmaSel.students].sort((x,y)=>x.name.localeCompare(y.name,'pt-BR')) : [];
  const livrosOrdenados = [...b.livros].sort((x,y)=>x.titulo.localeCompare(y.titulo,'pt-BR'));
  const ativas = b.reservas.filter(r=>r.status==='ativa').sort((x,y)=>(x.createdAt||0)-(y.createdAt||0));
  return `
    <div class="card">
      <h2 style="margin-top:0;">Colocar aluno na fila de espera</h2>
      <p class="muted" style="font-size:.85rem;">Use quando todos os exemplares de um livro já estiverem emprestados. Ao registrar a devolução, avisamos automaticamente quem é o próximo da fila.</p>
      <label>Turma</label>
      <select id="biblioteca-res-turma-select">
        <option value="">— selecione a turma —</option>
        ${b.turmas.map(t=>`<option value="${t.id}" ${f.turmaId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}
      </select>
      <label style="margin-top:8px;">Aluno</label>
      <select id="biblioteca-res-aluno-select" ${!f.turmaId?'disabled':''}>
        <option value="">— selecione o aluno —</option>
        ${alunosDaTurma.map(s=>`<option value="${s.id}" ${f.studentId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}
      </select>
      <label style="margin-top:8px;">Livro</label>
      <select id="biblioteca-res-livro-select">
        <option value="">— selecione o livro —</option>
        ${livrosOrdenados.map(l=>`<option value="${l.id}" ${f.livroId===l.id?'selected':''}>${esc(l.titulo)}${bibliotecaExemplaresDisponiveis(l,b.emprestimos)>0?' (já tem exemplar disponível)':''}</option>`).join('')}
      </select>
      ${b.reservaError ? `<p class="err">${esc(b.reservaError)}</p>` : ''}
      <button class="btn btn-primary" style="margin-top:10px;" data-action="biblioteca-reserva-registrar">+ Adicionar à fila</button>
    </div>

    <div class="card">
      <h2 style="margin-top:0;">Fila de espera (${ativas.length})</h2>
      ${ativas.length===0 ? '<p class="muted center">Nenhum aluno na fila de espera no momento.</p>' : `
        <div class="table-scroll">
        <table class="pv-sign-table">
          <thead><tr><th>Livro</th><th>Aluno</th><th>Turma</th><th>Na fila desde</th><th></th></tr></thead>
          <tbody>
            ${ativas.map(r => `
              <tr>
                <td><strong>${esc(r.livroTitulo)}</strong></td>
                <td>${esc(r.studentName)}${r.notificada?' <span class="pill" style="background:#c98a2b; color:#fff;">Disponível — avisar</span>':''}</td>
                <td>${esc(r.turmaName||'-')}</td>
                <td>${bibliotecaFmtData(new Date(r.createdAt||Date.now()).toISOString().slice(0,10))}</td>
                <td class="row" style="flex-wrap:nowrap; gap:4px;">
                  <button class="btn btn-ghost btn-sm" data-action="biblioteca-reserva-converter" data-id="${r.id}">Emprestar agora</button>
                  <button class="btn btn-ghost btn-sm" data-action="biblioteca-reserva-cancelar" data-id="${r.id}">✕</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      `}
    </div>
  `;
}
async function bibliotecaRegistrarReserva(){
  const b = state.biblioteca;
  const f = b.formReserva;
  const turma = b.turmas.find(t=>t.id===f.turmaId);
  const aluno = turma ? turma.students.find(s=>s.id===f.studentId) : null;
  const livro = b.livros.find(l=>l.id===f.livroId);
  if(!turma || !aluno){ b.reservaError = 'Selecione a turma e o aluno.'; render(); return; }
  if(!livro){ b.reservaError = 'Selecione o livro.'; render(); return; }
  const jaTemReserva = b.reservas.some(r => r.livroId===livro.id && r.studentId===aluno.id && r.status==='ativa');
  if(jaTemReserva){ b.reservaError = `${aluno.name} já está na fila de espera desse livro.`; render(); return; }
  const jaEmprestado = b.emprestimos.some(e => e.livroId===livro.id && e.studentId===aluno.id && !e.dataDevolucao);
  if(jaEmprestado){ b.reservaError = `${aluno.name} já está com esse livro emprestado.`; render(); return; }
  b.reservas.push({
    id: cryptoId(), livroId: livro.id, livroTitulo: livro.titulo,
    studentId: aluno.id, studentName: aluno.name, turmaId: turma.id, turmaName: turma.name,
    status:'ativa', notificada:false, createdAt: Date.now()
  });
  await saveBibliotecaReservas();
  b.formReserva = { turmaId: turma.id, studentId:'', livroId:'' };
  b.reservaError = '';
  render();
}
async function bibliotecaCancelarReserva(id){
  const b = state.biblioteca;
  if(!confirm('Remover esse aluno da fila de espera?')) return;
  b.reservas = b.reservas.filter(r=>r.id!==id);
  await saveBibliotecaReservas();
  render();
}
async function bibliotecaConverterReservaEmprestimo(id){
  const b = state.biblioteca;
  const r = b.reservas.find(x=>x.id===id);
  if(!r) return;
  const livro = b.livros.find(l=>l.id===r.livroId);
  if(!livro || bibliotecaExemplaresDisponiveis(livro, b.emprestimos) <= 0){ alert('Não há exemplar disponível desse livro no momento.'); return; }
  r.status = 'atendida';
  await saveBibliotecaReservas();
  b.formEmprestimo = { turmaId: r.turmaId, studentId: r.studentId, livroId: r.livroId, dataEmprestimo: new Date().toISOString().slice(0,10), dataPrevista: bibliotecaPrazoPadrao() };
  b.subview = 'emprestimos';
  render();
}
function renderBibliotecaRelatorio(){
  const b = state.biblioteca;
  const porLivro = {}, porAluno = {}, porTurma = {};
  b.emprestimos.forEach(e => {
    if(!porLivro[e.livroId]) porLivro[e.livroId] = { titulo: e.livroTitulo, count:0 };
    porLivro[e.livroId].count++;
    if(!porAluno[e.studentId]) porAluno[e.studentId] = { nome: e.studentName, turma: e.turmaName, count:0 };
    porAluno[e.studentId].count++;
    const chaveTurma = e.turmaId || e.turmaName || '-';
    if(!porTurma[chaveTurma]) porTurma[chaveTurma] = { nome: e.turmaName || 'Sem turma', count:0 };
    porTurma[chaveTurma].count++;
  });
  const topLivros = Object.values(porLivro).sort((x,y)=>y.count-x.count).slice(0,8);
  const topAlunos = Object.values(porAluno).sort((x,y)=>y.count-x.count).slice(0,8);
  const topTurmas = Object.values(porTurma).sort((x,y)=>y.count-x.count).slice(0,8);
  const totalEmprestimos = b.emprestimos.length;
  const totalAtivos = b.emprestimos.filter(e=>!e.dataDevolucao).length;
  const totalAtrasados = b.emprestimos.filter(e=>bibliotecaEmprestimoStatus(e)==='atrasado').length;
  const anoAtual = new Date().getFullYear();
  const devolvidosEsteAno = b.emprestimos.filter(e=>e.dataDevolucao && new Date(e.dataDevolucao+'T00:00:00').getFullYear()===anoAtual).length;
  return `
    <div class="card">
      <h2 style="margin-top:0;">Relatório para a coordenação</h2>
      <p class="muted" style="font-size:.85rem;">Resumo do uso da biblioteca até o momento — útil pra compartilhar com a coordenação.</p>
      <div class="row" style="flex-wrap:wrap; gap:10px; margin-top:6px;">
        <span class="pill">${totalEmprestimos} empréstimo(s) no total</span>
        <span class="pill">${totalAtivos} em andamento</span>
        <span class="pill" style="${totalAtrasados>0?'background:var(--red); color:#fff;':''}">${totalAtrasados} atrasado(s)</span>
        <span class="pill">${devolvidosEsteAno} devolvido(s) em ${anoAtual}</span>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-top:0;">📚 Livros mais emprestados</h3>
      ${topLivros.length===0 ? '<p class="muted">Sem dados ainda.</p>' : `
        <div class="table-scroll"><table class="pv-sign-table">
          <thead><tr><th>Livro</th><th style="text-align:center;">Empréstimos</th></tr></thead>
          <tbody>${topLivros.map(l=>`<tr><td>${esc(l.titulo)}</td><td style="text-align:center;">${l.count}</td></tr>`).join('')}</tbody>
        </table></div>
      `}
    </div>
    <div class="card">
      <h3 style="margin-top:0;">🏅 Alunos mais ativos</h3>
      ${topAlunos.length===0 ? '<p class="muted">Sem dados ainda.</p>' : `
        <div class="table-scroll"><table class="pv-sign-table">
          <thead><tr><th>Aluno</th><th>Turma</th><th style="text-align:center;">Livros lidos</th></tr></thead>
          <tbody>${topAlunos.map(a=>`<tr><td>${esc(a.nome)}</td><td>${esc(a.turma||'-')}</td><td style="text-align:center;">${a.count}</td></tr>`).join('')}</tbody>
        </table></div>
      `}
    </div>
    <div class="card">
      <h3 style="margin-top:0;">🏫 Turmas que mais leem</h3>
      ${topTurmas.length===0 ? '<p class="muted">Sem dados ainda.</p>' : `
        <div class="table-scroll"><table class="pv-sign-table">
          <thead><tr><th>Turma</th><th style="text-align:center;">Empréstimos</th></tr></thead>
          <tbody>${topTurmas.map(t=>`<tr><td>${esc(t.nome||'-')}</td><td style="text-align:center;">${t.count}</td></tr>`).join('')}</tbody>
        </table></div>
      `}
    </div>
  `;
}
function biblioAcervoState(){
  const b = state.biblioteca;
  if(!b.acervo) b.acervo = { q:'', categoria:'', autor:'', disp:'', ordem:'titulo', agrup:'autor', lim:50 };
  return b.acervo;
}
function biblioNorm(s){ return normalizeTexto(String(s||'')).replace(/\s+/g,' ').trim(); }
function biblioAcervoDados(){
  const b = state.biblioteca, emps = b.emprestimos||[], res = b.reservas||[];
  const hoje = Date.now();
  const linhas = (b.livros||[]).map(l => {
    const meus = emps.filter(e => e.livroId===l.id);
    const ativos = meus.filter(e => !e.dataDevolucao).length;
    const atrasados = meus.filter(e => bibliotecaEmprestimoStatus(e)==='atrasado').length;
    const ex = parseInt(l.exemplares)||0;
    const datas = meus.map(e => e.dataEmprestimo).filter(Boolean).sort();
    return {
      l, id:l.id, titulo:l.titulo||'', autor:(l.autor||'').trim(), categoria:(l.categoria||'').trim(),
      ex, ativos, disp: Math.max(0, ex-ativos), atrasados,
      historico: meus.length, fila: res.filter(r => r.livroId===l.id && r.status==='ativa').length,
      ultimo: datas.length ? datas[datas.length-1] : '',
      diasCadastro: l.createdAt ? Math.floor((hoje - l.createdAt)/86400000) : null
    };
  });
  return linhas;
}
function biblioAgrupar(linhas, campo){
  const g = {};
  linhas.forEach(r => {
    const bruto = r[campo] || (campo==='autor' ? 'Sem autor' : 'Sem categoria');
    const k = r[campo] ? biblioNorm(r[campo]) : '__vazio';
    if(!g[k]) g[k] = { nome: bruto, grafias: new Set(), titulos:0, ex:0, disp:0, ativos:0, historico:0, fila:0 };
    const x = g[k]; x.grafias.add(bruto); x.titulos++; x.ex += r.ex; x.disp += r.disp; x.ativos += r.ativos; x.historico += r.historico; x.fila += r.fila;
  });
  return Object.entries(g).map(([k,v]) => ({ chave:k, ...v, grafias:[...v.grafias] }));
}
function biblioAcervoFiltradas(linhas){
  const f = biblioAcervoState(), q = biblioNorm(f.q);
  let out = linhas.filter(r =>
    (!q || biblioNorm(r.titulo).includes(q) || biblioNorm(r.autor).includes(q) || biblioNorm(r.l.isbn).includes(q)) &&
    (!f.categoria || (f.categoria==='__vazio' ? !r.categoria : biblioNorm(r.categoria)===f.categoria)) &&
    (!f.autor || (f.autor==='__vazio' ? !r.autor : biblioNorm(r.autor)===f.autor)) &&
    (f.disp==='' ? true : f.disp==='disponivel' ? r.disp>0 : f.disp==='esgotado' ? r.disp===0 : f.disp==='fila' ? r.fila>0 : f.disp==='atrasado' ? r.atrasados>0 : f.disp==='nunca' ? r.historico===0 : true));
  const ord = {
    titulo: (a,b) => a.titulo.localeCompare(b.titulo,'pt-BR'),
    autor: (a,b) => (a.autor||'~').localeCompare(b.autor||'~','pt-BR') || a.titulo.localeCompare(b.titulo,'pt-BR'),
    procura: (a,b) => b.historico-a.historico || a.titulo.localeCompare(b.titulo,'pt-BR'),
    exemplares: (a,b) => b.ex-a.ex || a.titulo.localeCompare(b.titulo,'pt-BR'),
    disponiveis: (a,b) => a.disp-b.disp || b.fila-a.fila
  }[f.ordem] || ((a,b)=>0);
  return out.sort(ord);
}
function biblioBarras(itens, valor, rotulo, max, acao){
  const m = Math.max(1, ...itens.map(valor));
  return itens.slice(0, max).map(it => {
    const v = valor(it), pct = Math.round(v/m*100);
    return `<div class="bib-bar-row" ${acao?`data-action="${acao}" data-k="${esc(it.chave)}" role="button" tabindex="0" title="Filtrar por ${esc(it.nome)}"`:''}>
      <span class="bib-bar-nome">${esc(it.nome)}</span>
      <span class="bib-bar-trilho"><span class="bib-bar-fill" style="width:${pct}%"></span></span>
      <span class="bib-bar-val">${rotulo(it)}</span></div>`;
  }).join('');
}
function renderBibliotecaAcervo(){
  const b = state.biblioteca, f = biblioAcervoState();
  const linhas = biblioAcervoDados();
  if(linhas.length===0) return `<div class="card"><h2 style="margin-top:0;">Painel do acervo</h2><p class="muted">Nenhum livro cadastrado ainda. Cadastre livros no Catálogo ou importe uma planilha para ver o painel.</p></div>`;
  const tot = { titulos: linhas.length, ex:0, disp:0, ativos:0, atrasados:0, fila:0, esgotados:0, nunca:0 };
  linhas.forEach(r => { tot.ex+=r.ex; tot.disp+=r.disp; tot.ativos+=r.ativos; tot.atrasados+=r.atrasados; tot.fila+=r.fila; if(r.disp===0) tot.esgotados++; if(r.historico===0) tot.nunca++; });
  const autores = biblioAgrupar(linhas, 'autor'), categorias = biblioAgrupar(linhas, 'categoria');
  const nAutores = autores.filter(a => a.chave!=='__vazio').length, nCats = categorias.filter(c => c.chave!=='__vazio').length;
  const uso = tot.ex ? Math.round(tot.ativos/tot.ex*100) : 0;
  const filtradas = biblioAcervoFiltradas(linhas);
  const fx = { titulos: filtradas.length, ex: filtradas.reduce((s,r)=>s+r.ex,0), disp: filtradas.reduce((s,r)=>s+r.disp,0) };
  const temFiltro = f.q || f.categoria || f.autor || f.disp;
  const grupo = f.agrup==='categoria' ? categorias : autores;
  const ordG = [...grupo].sort((a,b) => (a.chave==='__vazio')-(b.chave==='__vazio') || b.titulos-a.titulos || b.ex-a.ex || a.nome.localeCompare(b.nome,'pt-BR'));
  const optAut = [...autores].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')).map(a => `<option value="${esc(a.chave)}" ${f.autor===a.chave?'selected':''}>${esc(a.nome)} (${a.titulos})</option>`).join('');
  const optCat = [...categorias].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')).map(c => `<option value="${esc(c.chave)}" ${f.categoria===c.chave?'selected':''}>${esc(c.nome)} (${c.titulos})</option>`).join('');

  // Sugestões calculadas a partir do acervo
  const sug = [];
  const comprar = linhas.filter(r => r.disp===0 && r.fila>0).sort((a,b)=>b.fila-a.fila);
  if(comprar.length) sug.push({ ic:'🛒', t:`Comprar mais exemplares (${comprar.length})`, d:'Livros esgotados com alunos na fila de espera.', itens: comprar.slice(0,6).map(r => `${r.titulo} — ${r.fila} na fila, ${r.ex} exemplar(es)`), filtro:'fila', compra:true });
  const procura = linhas.filter(r => r.ex>0 && r.historico/r.ex >= 3 && !(r.disp===0 && r.fila>0)).sort((a,b)=>b.historico/b.ex-a.historico/a.ex);
  if(procura.length) sug.push({ ic:'🔥', t:`Alta procura (${procura.length})`, d:'Muitos empréstimos para poucos exemplares: candidatos a reposição.', itens: procura.slice(0,6).map(r => `${r.titulo} — ${r.historico} empréstimo(s) / ${r.ex} exemplar(es)`), ordem:'procura', compra:true });
  const parados = linhas.filter(r => r.historico===0 && (r.diasCadastro==null || r.diasCadastro>=30));
  if(parados.length) sug.push({ ic:'💤', t:`Nunca emprestados (${parados.length})`, d:'Bons candidatos para uma vitrine, indicação de professores ou roda de leitura.', itens: parados.slice(0,6).map(r => r.titulo), filtro:'nunca' });
  if(tot.atrasados) sug.push({ ic:'⏰', t:`Devoluções atrasadas (${tot.atrasados})`, d:'Exemplares que deveriam estar disponíveis. Veja a aba Empréstimos para cobrar.', itens: linhas.filter(r=>r.atrasados).slice(0,6).map(r => `${r.titulo} — ${r.atrasados} atrasado(s)`), filtro:'atrasado' });
  const grafias = autores.filter(a => a.grafias.length>1);
  if(grafias.length) sug.push({ ic:'✍️', t:`Autores com grafias diferentes (${grafias.length})`, d:'O mesmo autor foi digitado de formas diferentes. Padronize no Catálogo para contar certo.', itens: grafias.slice(0,6).map(a => a.grafias.join(' · ')) });
  const tituloMap = {}; linhas.forEach(r => { const k = biblioNorm(r.titulo); (tituloMap[k] = tituloMap[k] || []).push(r); });
  const dup = Object.values(tituloMap).filter(v => v.length>1);
  if(dup.length) sug.push({ ic:'📑', t:`Títulos repetidos (${dup.length})`, d:'Mesmo título cadastrado mais de uma vez. Se for o mesmo livro, una os exemplares num só cadastro.', itens: dup.slice(0,6).map(v => `${v[0].titulo} — ${v.length} cadastros`) });
  const semCat = linhas.filter(r=>!r.categoria).length, semAut = linhas.filter(r=>!r.autor).length, semIsbn = linhas.filter(r=>!r.l.isbn).length;
  if(semCat || semAut || semIsbn) sug.push({ ic:'🧹', t:'Completar o cadastro', d:'Dados faltando deixam o painel menos preciso.', itens: [semCat?`${semCat} sem categoria`:'', semAut?`${semAut} sem autor`:'', semIsbn?`${semIsbn} sem ISBN`:''].filter(Boolean) });
  const catTop = [...categorias].sort((a,b)=>b.ex-a.ex)[0];
  if(catTop && tot.ex && catTop.ex/tot.ex >= 0.5 && categorias.length>1) sug.push({ ic:'⚖️', t:'Acervo concentrado', d:`${Math.round(catTop.ex/tot.ex*100)}% dos exemplares são de “${catTop.nome}”. Vale diversificar nas próximas aquisições.`, itens: [] });

  const card = (v, l, extra='') => `<div class="bib-kpi" ${extra}><div class="bib-kpi-v">${v}</div><div class="bib-kpi-l">${l}</div></div>`;
  const lim = f.lim || 50;
  return `
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h2 style="margin:0;">Painel do acervo</h2>
        <button class="btn btn-ghost btn-sm" style="width:auto; flex:0 0 auto;" data-action="biblio-acervo-csv">⬇ Baixar planilha ${temFiltro?'(filtrada)':''}</button>
      </div>
      <div class="bib-kpis">
        ${card(tot.titulos, 'títulos')}
        ${card(tot.ex, 'exemplares')}
        ${card(tot.disp, 'disponíveis')}
        ${card(tot.ativos, 'emprestados agora')}
        ${card(uso+'%', 'do acervo em uso')}
        ${card(nAutores, 'autores')}
        ${card(nCats, 'categorias')}
        ${card(tot.esgotados, 'títulos esgotados', tot.esgotados?'data-alerta="1"':'')}
        ${card(tot.fila, 'na fila de espera')}
        ${card(tot.atrasados, 'atrasados', tot.atrasados?'data-alerta="1"':'')}
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">🔎 Pesquisar no acervo</h3>
      <div class="bib-filtros">
        <input type="text" data-action-input="biblio-acervo-busca" placeholder="Título, autor ou ISBN..." value="${esc(f.q)}">
        <select data-action-change="biblio-acervo-filtro" data-k="autor"><option value="">Todos os autores</option>${optAut}</select>
        <select data-action-change="biblio-acervo-filtro" data-k="categoria"><option value="">Todas as categorias</option>${optCat}</select>
        <select data-action-change="biblio-acervo-filtro" data-k="disp">
          ${[['','Qualquer situação'],['disponivel','Com exemplar disponível'],['esgotado','Esgotados'],['fila','Com fila de espera'],['atrasado','Com devolução atrasada'],['nunca','Nunca emprestados']].map(([v,t])=>`<option value="${v}" ${f.disp===v?'selected':''}>${t}</option>`).join('')}
        </select>
        <select data-action-change="biblio-acervo-filtro" data-k="ordem">
          ${[['titulo','Ordenar por título'],['autor','Ordenar por autor'],['procura','Mais emprestados'],['exemplares','Mais exemplares'],['disponiveis','Menos disponíveis']].map(([v,t])=>`<option value="${v}" ${f.ordem===v?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="bib-contagem">
        <span class="pill">${fx.titulos} título(s)</span><span class="pill">${fx.ex} exemplar(es)</span><span class="pill">${fx.disp} disponível(is)</span>
        ${temFiltro?`<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="biblio-acervo-limpar">Limpar filtros</button>`:''}
      </div>
      ${filtradas.length===0 ? '<p class="muted" style="margin-top:10px;">Nenhum livro com esses filtros.</p>' : `
      <div class="table-scroll" style="margin-top:10px;"><table class="pv-sign-table">
        <thead><tr><th>Título</th><th>Autor</th><th>Categoria</th><th style="text-align:center;">Exemplares</th><th style="text-align:center;">Emprestados</th><th style="text-align:center;">Disponíveis</th><th style="text-align:center;">Fila</th><th style="text-align:center;">Empréstimos (total)</th><th>Último empréstimo</th></tr></thead>
        <tbody>${filtradas.slice(0, lim).map(r => `<tr>
          <td><strong>${esc(r.titulo)}</strong></td>
          <td>${r.autor ? `<a href="#" class="bib-link" data-action="biblio-acervo-ver" data-k="autor" data-v="${esc(biblioNorm(r.autor))}">${esc(r.autor)}</a>` : '-'}</td>
          <td>${r.categoria ? `<a href="#" class="bib-link" data-action="biblio-acervo-ver" data-k="categoria" data-v="${esc(biblioNorm(r.categoria))}">${esc(r.categoria)}</a>` : '-'}</td>
          <td style="text-align:center;">${r.ex}</td><td style="text-align:center;">${r.ativos}${r.atrasados?` <span class="err" style="margin:0;">(${r.atrasados} atras.)</span>`:''}</td>
          <td style="text-align:center;">${r.disp===0?'<span class="err" style="margin:0;">0</span>':r.disp}</td>
          <td style="text-align:center;">${r.fila||'-'}</td><td style="text-align:center;">${r.historico}</td>
          <td>${r.ultimo ? bibliotecaFmtData(r.ultimo) : '<span class="muted">nunca</span>'}</td></tr>`).join('')}</tbody>
      </table></div>
      ${filtradas.length>lim ? `<button class="btn btn-ghost btn-sm" style="width:auto; margin-top:8px;" data-action="biblio-acervo-mais">Mostrar mais (${filtradas.length-lim} restantes)</button>` : ''}`}
    </div>

    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h3 style="margin:0;">📊 Acervo por ${f.agrup==='categoria'?'categoria':'autor'}</h3>
        <div class="row" style="flex:0 0 auto; gap:6px;">
          <button class="btn ${f.agrup==='autor'?'btn-primary':'btn-ghost'} btn-sm" style="width:auto;" data-action="biblio-acervo-agrup" data-v="autor">Autor</button>
          <button class="btn ${f.agrup==='categoria'?'btn-primary':'btn-ghost'} btn-sm" style="width:auto;" data-action="biblio-acervo-agrup" data-v="categoria">Categoria</button>
        </div>
      </div>
      <p class="muted" style="font-size:.82rem; margin:6px 0 10px;">Barras pelo número de títulos. Toque numa linha para filtrar a pesquisa.</p>
      <div class="bib-barras">${biblioBarras(ordG, x=>x.titulos, x=>`${x.titulos} tít. · ${x.ex} ex. · ${x.disp} disp.`, 12, 'biblio-acervo-barra')}</div>
      <div class="table-scroll" style="margin-top:12px;"><table class="pv-sign-table">
        <thead><tr><th>${f.agrup==='categoria'?'Categoria':'Autor'}</th><th style="text-align:center;">Títulos</th><th style="text-align:center;">Exemplares</th><th style="text-align:center;">Disponíveis</th><th style="text-align:center;">Emprestados</th><th style="text-align:center;">Empréstimos (total)</th></tr></thead>
        <tbody>${ordG.map(x => `<tr><td>${esc(x.nome)}</td><td style="text-align:center;">${x.titulos}</td><td style="text-align:center;">${x.ex}</td><td style="text-align:center;">${x.disp}</td><td style="text-align:center;">${x.ativos}</td><td style="text-align:center;">${x.historico}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>

    ${sug.length ? `<div class="card">
      <h3 style="margin-top:0;">💡 Sugestões para o acervo</h3>
      <div class="bib-sugs">${sug.map(s => `<div class="bib-sug">
        <div class="bib-sug-t">${s.ic} ${esc(s.t)}</div>
        <div class="muted" style="font-size:.85rem;">${esc(s.d)}</div>
        ${s.itens.length?`<ul>${s.itens.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`:''}
        ${s.filtro?`<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="biblio-acervo-sug" data-f="${s.filtro}">Ver na pesquisa</button>`:''}
        ${s.ordem?`<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="biblio-acervo-sug" data-o="${s.ordem}">Ver na pesquisa</button>`:''}
        ${s.compra?`<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="biblioteca-subview" data-sub="compras">🛒 Pedidos de compra</button>`:''}
      </div>`).join('')}</div>
    </div>` : ''}
  `;
}
function biblioAcervoCsv(){
  const linhas = biblioAcervoFiltradas(biblioAcervoDados());
  const cab = ['Título','Autor','Categoria','ISBN','Exemplares','Emprestados','Disponíveis','Atrasados','Fila de espera','Empréstimos (total)','Último empréstimo'];
  const rows = linhas.map(r => [r.titulo, r.autor, r.categoria, r.l.isbn||'', r.ex, r.ativos, r.disp, r.atrasados, r.fila, r.historico, r.ultimo ? bibliotecaFmtData(r.ultimo) : '']);
  const csv = [cab, ...rows].map(l => l.map(v => `"${String(v==null?'':v).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `acervo-biblioteca-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
const BIB_BIMESTRES = { 1:{ rot:'1º bimestre (fev–abr)', m:[2,3,4] }, 2:{ rot:'2º bimestre (mai–jul)', m:[5,6,7] }, 3:{ rot:'3º bimestre (ago–set)', m:[8,9] }, 4:{ rot:'4º bimestre (out–dez)', m:[10,11,12] } };
function bibBimestreDaData(iso){ const m = parseInt(String(iso||'').slice(5,7)); for(const b of [1,2,3,4]) if(BIB_BIMESTRES[b].m.includes(m)) return b; return m===1 ? 1 : 0; }
function bibBimestreHoje(){ return bibBimestreDaData(new Date().toISOString().slice(0,10)) || 1; }
const BIB_CURSOS = { PG:'Petróleo e Gás', ST:'Segurança do Trabalho', EM:'Eletromecânica', L:'Eletromecânica' };
function bibCursoDaTurma(nome){ const m = String(nome||'').toUpperCase().match(/^\s*\d+\s*([A-Z]+)/); if(!m) return 'Outras'; return BIB_CURSOS[m[1]] || m[1]; }
function bibSerieDaTurma(nome){ const m = String(nome||'').match(/^\s*(\d)/); return m ? m[1]+'ª série' : ''; }
async function bibLerChave(k, padrao){ try{ const r = await window.storage.get(k, true); return JSON.parse(r.value); }catch(e){ return padrao; } }
async function bibGravarChave(k, v){ await window.storage.set(k, JSON.stringify(v), true); }
function bibCsvBaixar(nome, linhas){
  const csv = linhas.map(l => l.map(v => `"${String(v==null?'':v).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function bibExtras(){
  const b = state.biblioteca;
  if(!b.extras) b.extras = { carregado:false, carregando:false, metas:{ porAluno:1, turmas:{} }, inventarios:[], desejos:[], leitura:{ periodo:String(bibBimestreHoje()), aberta:'' }, inv:{ busca:'', soDif:false }, compras:{ status:'aberto', form:null, msg:'' } };
  const x = b.extras;
  if(!x.carregado && !x.carregando){
    x.carregando = true;
    Promise.all([bibLerChave('biblioteca-metas', null), bibLerChave('biblioteca-inventarios', []), bibLerChave('biblioteca-desejos', [])]).then(([m, inv, d]) => {
      if(m) x.metas = { porAluno: m.porAluno||1, turmas: m.turmas||{} };
      x.inventarios = Array.isArray(inv) ? inv : []; x.desejos = Array.isArray(d) ? d : [];
      x.carregado = true; x.carregando = false; render();
    });
  }
  return x;
}
function renderBibliotecaLeitura(){
  const b = state.biblioteca, x = bibExtras();
  if(!x.carregado) return '<div class="card"><div class="spinner"></div></div>';
  const L = x.leitura, ano = new Date().getFullYear();
  const per = L.periodo, ehAno = per==='ano';
  const doPeriodo = (b.emprestimos||[]).filter(e => e.dataEmprestimo && e.dataEmprestimo.slice(0,4)===String(ano) && (ehAno || bibBimestreDaData(e.dataEmprestimo)===parseInt(per)));
  const turmas = (b.turmas||[]).slice().sort((p,q) => String(p.name).localeCompare(String(q.name),'pt-BR',{numeric:true}));
  const linhas = turmas.map(t => {
    const alunos = (t.students||[]);
    const emps = doPeriodo.filter(e => e.turmaId===t.id || (!e.turmaId && e.turmaName===t.name));
    const leitores = new Set(emps.map(e => e.studentId));
    const metaBim = parseFloat(x.metas.turmas[t.id] ?? x.metas.porAluno) || 0;
    const meta = Math.round((ehAno ? metaBim*4 : metaBim) * alunos.length);
    return { t, alunos, emps: emps.length, leitores: leitores.size, pctLeitores: alunos.length ? Math.round(leitores.size/alunos.length*100) : 0,
      porAluno: alunos.length ? (emps.length/alunos.length) : 0, meta, metaBim, pctMeta: meta ? Math.min(100, Math.round(emps.length/meta*100)) : 0,
      semLeitura: alunos.filter(s => !leitores.has(s.id)), curso: bibCursoDaTurma(t.name) };
  });
  const cursos = {}; linhas.forEach(l => { const c = cursos[l.curso] = cursos[l.curso] || { nome:l.curso, alunos:0, emps:0, leitores:0, meta:0 }; c.alunos += l.alunos.length; c.emps += l.emps; c.leitores += l.leitores; c.meta += l.meta; });
  const tot = linhas.reduce((s,l) => ({ alunos:s.alunos+l.alunos.length, emps:s.emps+l.emps, leitores:s.leitores+l.leitores, meta:s.meta+l.meta }), { alunos:0, emps:0, leitores:0, meta:0 });
  const barra = (pct, cor) => `<span class="bib-bar-trilho" style="display:block; min-width:80px;"><span class="bib-bar-fill" style="width:${pct}%; ${cor?`background:${cor};`:''}"></span></span>`;
  const corMeta = p => p>=100 ? '#1d6b31' : p>=60 ? '#c99f3c' : '#b3261e';
  return `
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h2 style="margin:0;">Leitura por turma</h2>
        <div class="row" style="flex:0 0 auto; gap:6px; flex-wrap:wrap;">
          <select data-action-change="bib2-leitura-periodo" style="width:auto; margin:0;">
            ${[1,2,3,4].map(n => `<option value="${n}" ${per===String(n)?'selected':''}>${BIB_BIMESTRES[n].rot}</option>`).join('')}
            <option value="ano" ${ehAno?'selected':''}>Ano de ${ano}</option>
          </select>
          <button class="btn btn-ghost btn-sm" style="width:auto; flex:0 0 auto;" data-action="bib2-leitura-csv">⬇ Planilha</button>
        </div>
      </div>
      <p class="muted" style="font-size:.85rem; margin:6px 0 0;">Conta os empréstimos feitos no período. A meta é de livros por aluno a cada bimestre (no ano, vale 4 vezes a meta).</p>
      <div class="bib-kpis">
        <div class="bib-kpi"><div class="bib-kpi-v">${tot.emps}</div><div class="bib-kpi-l">empréstimos no período</div></div>
        <div class="bib-kpi"><div class="bib-kpi-v">${tot.alunos ? Math.round(tot.leitores/tot.alunos*100) : 0}%</div><div class="bib-kpi-l">dos alunos pegaram livro</div></div>
        <div class="bib-kpi"><div class="bib-kpi-v">${tot.alunos ? (tot.emps/tot.alunos).toFixed(1).replace('.',',') : '0'}</div><div class="bib-kpi-l">livros por aluno</div></div>
        <div class="bib-kpi"><div class="bib-kpi-v">${tot.meta ? Math.round(tot.emps/tot.meta*100) : 0}%</div><div class="bib-kpi-l">da meta da escola</div></div>
      </div>
      <div class="row" style="gap:8px; align-items:center; flex-wrap:wrap; margin-top:12px;">
        <label style="margin:0; text-transform:none; font-weight:600; flex:0 1 auto;">Meta da escola: livros por aluno a cada bimestre</label>
        <input type="number" min="0" step="0.5" value="${x.metas.porAluno}" data-action-change="bib2-meta-geral" style="width:90px; flex:0 0 90px; margin:0;">
      </div>
    </div>
    <div class="card">
      <h3 style="margin-top:0;">🎓 Por curso</h3>
      ${Object.values(cursos).length===0 ? '<p class="muted">Nenhuma turma cadastrada.</p>' : `<div class="table-scroll"><table class="pv-sign-table">
        <thead><tr><th>Curso</th><th style="text-align:center;">Alunos</th><th style="text-align:center;">Empréstimos</th><th style="text-align:center;">Alunos leitores</th><th>Meta</th></tr></thead>
        <tbody>${Object.values(cursos).sort((p,q)=>q.emps-p.emps).map(c => { const p = c.meta ? Math.min(100, Math.round(c.emps/c.meta*100)) : 0; return `<tr><td><strong>${esc(c.nome)}</strong></td><td style="text-align:center;">${c.alunos}</td><td style="text-align:center;">${c.emps}</td><td style="text-align:center;">${c.alunos?Math.round(c.leitores/c.alunos*100):0}%</td><td>${barra(p, corMeta(p))}<span class="muted" style="font-size:.78rem;">${c.emps} de ${c.meta} (${p}%)</span></td></tr>`; }).join('')}</tbody>
      </table></div>`}
    </div>
    <div class="card">
      <h3 style="margin-top:0;">🏫 Por turma</h3>
      ${linhas.length===0 ? '<p class="muted">Nenhuma turma cadastrada.</p>' : `<div class="table-scroll"><table class="pv-sign-table">
        <thead><tr><th>Turma</th><th style="text-align:center;">Alunos</th><th style="text-align:center;">Empréstimos</th><th style="text-align:center;">Leitores</th><th style="text-align:center;">Livros/aluno</th><th>Meta</th><th style="text-align:center;">Meta própria</th><th></th></tr></thead>
        <tbody>${linhas.map(l => `<tr>
          <td><strong>${esc(l.t.name)}</strong><br><span class="muted" style="font-size:.75rem;">${esc(l.curso)}</span></td>
          <td style="text-align:center;">${l.alunos.length}</td><td style="text-align:center;">${l.emps}</td>
          <td style="text-align:center;">${l.leitores} <span class="muted" style="font-size:.78rem;">(${l.pctLeitores}%)</span></td>
          <td style="text-align:center;">${l.porAluno.toFixed(1).replace('.',',')}</td>
          <td style="min-width:140px;">${barra(l.pctMeta, corMeta(l.pctMeta))}<span class="muted" style="font-size:.78rem;">${l.emps} de ${l.meta} (${l.pctMeta}%)</span></td>
          <td style="text-align:center;"><input type="number" min="0" step="0.5" placeholder="${x.metas.porAluno}" value="${x.metas.turmas[l.t.id] ?? ''}" data-action-change="bib2-meta-turma" data-tid="${esc(l.t.id)}" style="width:70px; margin:0;" title="Livros por aluno no bimestre (vazio = meta da escola)"></td>
          <td>${l.semLeitura.length ? `<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-leitura-abrir" data-tid="${esc(l.t.id)}">${L.aberta===l.t.id?'▴':'▾'} ${l.semLeitura.length} sem livro</button>` : '<span class="pill" style="background:#1d6b31; color:#fff;">todos leram</span>'}</td></tr>
          ${L.aberta===l.t.id ? `<tr><td colspan="8" style="background:var(--tint-vinho);"><strong>Ainda não pegaram livro no período:</strong> ${l.semLeitura.map(s => esc(s.name)).sort((p,q)=>p.localeCompare(q,'pt-BR')).join(', ')}</td></tr>` : ''}`).join('')}</tbody>
      </table></div>`}
    </div>`;
}
function bibInvAberto(){ return (bibExtras().inventarios||[]).find(i => !i.concluidoEm); }
let bibInvSalvarTimer = null;
function bibInvSalvar(){ clearTimeout(bibInvSalvarTimer); bibInvSalvarTimer = setTimeout(() => bibGravarChave('biblioteca-inventarios', bibExtras().inventarios), 600); }
function bibInvLinha(inv, l){
  const b = state.biblioteca;
  const ativos = (b.emprestimos||[]).filter(e => e.livroId===l.id && !e.dataDevolucao).length;
  const ex = parseInt(l.exemplares)||0, esperado = Math.max(0, ex-ativos);
  const c = inv.contagens[l.id];
  const contado = (c && c.n!=null && c.n!=='') ? parseInt(c.n) : null;
  return { l, ex, ativos, esperado, contado, dif: contado==null ? null : contado-esperado, oc: (c && c.oc) || '', obs: (c && c.obs) || '' };
}
function renderBibliotecaInventario(){
  const b = state.biblioteca, x = bibExtras();
  if(!x.carregado) return '<div class="card"><div class="spinner"></div></div>';
  const inv = bibInvAberto();
  const hist = (x.inventarios||[]).filter(i => i.concluidoEm).sort((p,q)=>q.concluidoEm-p.concluidoEm);
  const histHtml = hist.length ? `<div class="card"><h3 style="margin-top:0;">📁 Inventários concluídos</h3>
    <div class="table-scroll"><table class="pv-sign-table"><thead><tr><th>Inventário</th><th>Concluído em</th><th style="text-align:center;">Títulos conferidos</th><th style="text-align:center;">Faltando</th><th style="text-align:center;">Perdas</th><th style="text-align:center;">Danos</th><th style="text-align:center;">Catálogo atualizado</th><th></th></tr></thead>
    <tbody>${hist.map(i => `<tr><td>${esc(i.nome)}</td><td>${new Date(i.concluidoEm).toLocaleDateString('pt-BR')}</td><td style="text-align:center;">${i.resumo.conferidos}</td><td style="text-align:center;">${i.resumo.faltando}</td><td style="text-align:center;">${i.resumo.perdas}</td><td style="text-align:center;">${i.resumo.danos}</td><td style="text-align:center;">${i.aplicado?'sim':'não'}</td><td><button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-inv-csv" data-id="${esc(i.id)}">⬇ Planilha</button></td></tr>`).join('')}</tbody></table></div></div>` : '';
  if(!inv) return `
    <div class="card">
      <h2 style="margin-top:0;">Inventário do acervo</h2>
      <p class="muted">Conte os livros que estão na estante e compare com o que o sistema espera (exemplares cadastrados menos os que estão emprestados). No fim, registre perdas e danos e, se quiser, atualize o catálogo.</p>
      ${(b.livros||[]).length ? `<button class="btn btn-primary" style="width:auto;" data-action="bib2-inv-iniciar">📋 Iniciar inventário de ${new Date().getFullYear()}</button>` : '<p class="muted">Cadastre livros no Catálogo antes de fazer o inventário.</p>'}
    </div>${histHtml}`;
  const F = x.inv, q = biblioNorm(F.busca);
  const todas = (b.livros||[]).map(l => bibInvLinha(inv, l)).sort((p,q2)=>p.l.titulo.localeCompare(q2.l.titulo,'pt-BR'));
  const conferidos = todas.filter(r => r.contado!=null).length;
  const faltando = todas.filter(r => r.dif!=null && r.dif<0);
  const sobrando = todas.filter(r => r.dif!=null && r.dif>0);
  const vis = todas.filter(r => (!q || biblioNorm(r.l.titulo).includes(q) || biblioNorm(r.l.autor).includes(q)) && (!F.soDif || r.contado==null || r.dif!==0));
  const pct = todas.length ? Math.round(conferidos/todas.length*100) : 0;
  return `
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h2 style="margin:0;">${esc(inv.nome)}</h2>
        <div class="row" style="flex:0 0 auto; gap:6px; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-inv-csv" data-id="${esc(inv.id)}">⬇ Planilha</button>
          <button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-inv-cancelar">Descartar</button>
        </div>
      </div>
      <p class="muted" style="font-size:.85rem; margin:6px 0 0;">Iniciado em ${new Date(inv.iniciadoEm).toLocaleDateString('pt-BR')}. A contagem é salva sozinha; pode parar e continuar depois.</p>
      <div style="margin-top:10px;"><span class="bib-bar-trilho" style="display:block;"><span class="bib-bar-fill" data-inv-barra style="width:${pct}%;"></span></span>
        <p style="margin:6px 0 0; font-size:.88rem;" data-inv-progresso><strong>${conferidos}</strong> de ${todas.length} títulos conferidos · <span style="color:#b3261e;">${faltando.length} com falta</span> · ${sobrando.length} com sobra</p></div>
      <div class="row" style="gap:8px; flex-wrap:wrap; align-items:center; margin-top:10px;">
        <input type="text" data-action-input="bib2-inv-busca" placeholder="Buscar título ou autor..." value="${esc(F.busca)}" style="flex:1 1 220px; margin:0;">
        <label style="margin:0; text-transform:none; font-weight:400; flex:0 0 auto;"><input type="checkbox" data-action-change="bib2-inv-sodif" ${F.soDif?'checked':''} style="width:auto;"> mostrar só pendentes e diferenças</label>
      </div>
      <div class="table-scroll" style="margin-top:10px;"><table class="pv-sign-table">
        <thead><tr><th>Título</th><th style="text-align:center;">Cadastrados</th><th style="text-align:center;">Emprestados</th><th style="text-align:center;">Esperado na estante</th><th style="text-align:center;">Contados</th><th style="text-align:center;">Diferença</th><th>Ocorrência</th></tr></thead>
        <tbody>${vis.map(r => `<tr data-inv-linha="${esc(r.l.id)}">
          <td><strong>${esc(r.l.titulo)}</strong>${r.l.autor?`<br><span class="muted" style="font-size:.75rem;">${esc(r.l.autor)}</span>`:''}</td>
          <td style="text-align:center;">${r.ex}</td><td style="text-align:center;">${r.ativos}</td><td style="text-align:center;"><strong>${r.esperado}</strong></td>
          <td style="text-align:center; white-space:nowrap;"><input type="number" min="0" step="1" inputmode="numeric" value="${r.contado==null?'':r.contado}" data-action-change="bib2-inv-n" data-id="${esc(r.l.id)}" style="width:70px; margin:0;" aria-label="Contados de ${esc(r.l.titulo)}">
            <button class="btn btn-ghost btn-sm" style="width:auto; padding:4px 8px;" data-action="bib2-inv-ok" data-id="${esc(r.l.id)}" title="Contagem igual ao esperado">✓</button></td>
          <td style="text-align:center;" data-inv-dif="${esc(r.l.id)}">${bibInvDifHtml(r.dif)}</td>
          <td>${r.dif!=null && r.dif<0 ? `<select data-action-change="bib2-inv-oc" data-id="${esc(r.l.id)}" style="margin:0; width:auto;"><option value="">Verificar depois</option><option value="perda" ${r.oc==='perda'?'selected':''}>Perda / extravio</option><option value="dano" ${r.oc==='dano'?'selected':''}>Danificado (descartar)</option></select>` : '<span class="muted">-</span>'}</td></tr>`).join('')}</tbody>
      </table></div>
      ${vis.length===0 ? '<p class="muted">Nada para mostrar com esse filtro.</p>' : ''}
    </div>
    <div class="card">
      <h3 style="margin-top:0;">Concluir inventário</h3>
      <p class="muted" style="font-size:.85rem;">${conferidos<todas.length ? `Ainda faltam ${todas.length-conferidos} título(s) para conferir. Os não conferidos ficam como estão.` : 'Todos os títulos foram conferidos.'}
        ${faltando.length ? ` Há ${faltando.reduce((s,r)=>s-r.dif,0)} exemplar(es) faltando; os marcados como perda ou dano podem ser descontados do catálogo.` : ''}</p>
      <label style="text-transform:none; font-weight:400;"><input type="checkbox" id="bib2-inv-aplicar" checked style="width:auto;"> Atualizar a quantidade de exemplares no catálogo (descontar perdas e danos)</label>
      <button class="btn btn-primary" style="width:auto; margin-top:8px;" data-action="bib2-inv-concluir">Concluir inventário</button>
    </div>${histHtml}`;
}
function bibInvDifHtml(dif){ return dif==null ? '<span class="muted">—</span>' : dif===0 ? '<span style="color:#1d6b31;">ok</span>' : dif<0 ? `<strong style="color:#b3261e;">${dif}</strong>` : `<strong style="color:#1F4E79;">+${dif}</strong>`; }
function bibInvAtualizarResumo(){
  const inv = bibInvAberto(); if(!inv) return;
  const todas = (state.biblioteca.livros||[]).map(l => bibInvLinha(inv, l));
  const conf = todas.filter(r => r.contado!=null).length, falt = todas.filter(r => r.dif!=null && r.dif<0).length, sob = todas.filter(r => r.dif!=null && r.dif>0).length;
  const p = document.querySelector('[data-inv-progresso]'); if(p) p.innerHTML = `<strong>${conf}</strong> de ${todas.length} títulos conferidos · <span style="color:#b3261e;">${falt} com falta</span> · ${sob} com sobra`;
  const br = document.querySelector('[data-inv-barra]'); if(br) br.style.width = (todas.length ? Math.round(conf/todas.length*100) : 0) + '%';
}
function bibInvCsv(id){
  const inv = (bibExtras().inventarios||[]).find(i => i.id===id); if(!inv) return;
  const linhas = inv.concluidoEm && inv.linhas ? inv.linhas : (state.biblioteca.livros||[]).map(l => { const r = bibInvLinha(inv, l); return { titulo:l.titulo, autor:l.autor||'', ex:r.ex, ativos:r.ativos, esperado:r.esperado, contado:r.contado, dif:r.dif, oc:r.oc }; });
  bibCsvBaixar(`inventario-biblioteca-${new Date(inv.iniciadoEm).toISOString().slice(0,10)}.csv`, [['Título','Autor','Cadastrados','Emprestados','Esperado na estante','Contados','Diferença','Ocorrência'], ...linhas.map(r => [r.titulo, r.autor, r.ex, r.ativos, r.esperado, r.contado==null?'não conferido':r.contado, r.dif==null?'':r.dif, r.oc==='perda'?'Perda/extravio':r.oc==='dano'?'Danificado':(r.dif<0?'Verificar':'')])]);
}
async function bibInvConcluir(){
  const b = state.biblioteca, x = bibExtras(), inv = bibInvAberto(); if(!inv) return;
  const aplicar = !!(document.getElementById('bib2-inv-aplicar')||{}).checked;
  const linhas = (b.livros||[]).map(l => { const r = bibInvLinha(inv, l); return { livroId:l.id, titulo:l.titulo, autor:l.autor||'', ex:r.ex, ativos:r.ativos, esperado:r.esperado, contado:r.contado, dif:r.dif, oc:r.oc }; });
  const perdas = linhas.filter(r => r.dif<0 && r.oc==='perda').reduce((s,r)=>s-r.dif,0), danos = linhas.filter(r => r.dif<0 && r.oc==='dano').reduce((s,r)=>s-r.dif,0);
  if(!confirm(`Concluir o inventário?\n\n${linhas.filter(r=>r.contado!=null).length} título(s) conferido(s), ${perdas} perda(s) e ${danos} dano(s).${aplicar ? '\nO catálogo será atualizado descontando perdas e danos.' : ''}`)) return;
  if(aplicar){
    linhas.filter(r => r.dif<0 && (r.oc==='perda' || r.oc==='dano')).forEach(r => { const l = b.livros.find(z => z.id===r.livroId); if(l){ l.exemplares = Math.max(r.ativos, (parseInt(l.exemplares)||0) + r.dif); l.ultimoInventario = { em: Date.now(), baixa: -r.dif, motivo: r.oc }; } });
    await saveBibliotecaLivros();
  }
  inv.concluidoEm = Date.now(); inv.aplicado = aplicar; inv.linhas = linhas;
  inv.resumo = { conferidos: linhas.filter(r=>r.contado!=null).length, faltando: linhas.filter(r=>r.dif<0).reduce((s,r)=>s-r.dif,0), perdas, danos };
  await bibGravarChave('biblioteca-inventarios', x.inventarios);
  render();
}
async function bibDesejosRecarregar(){ const x = bibExtras(); x.desejos = await bibLerChave('biblioteca-desejos', []); return x.desejos; }
async function bibPedirLivro(p){
  const lista = await bibLerChave('biblioteca-desejos', []);
  const k = biblioNorm(p.titulo);
  const igual = lista.find(d => d.status==='aberto' && biblioNorm(d.titulo)===k);
  if(igual){
    if(!(igual.votos||[]).some(v => v.quem===p.quemId)){ igual.votos = [...(igual.votos||[]), { quem:p.quemId, nome:p.quemNome, origem:p.origem, em:Date.now() }]; }
    if(p.motivo && !(igual.motivos||[]).includes(p.motivo)) igual.motivos = [...(igual.motivos||[]), p.motivo];
  } else {
    lista.push({ id: cryptoId(), titulo: p.titulo.trim(), autor: (p.autor||'').trim(), qtd: parseInt(p.qtd)||1, livroId: p.livroId||'', motivos: p.motivo ? [p.motivo] : [], origem: p.origem, status:'aberto', createdAt: Date.now(), votos:[{ quem:p.quemId, nome:p.quemNome, origem:p.origem, em:Date.now() }] });
  }
  await bibGravarChave('biblioteca-desejos', lista);
  if(state.biblioteca.extras) state.biblioteca.extras.desejos = lista;
  return igual ? 'voto' : 'novo';
}
function bibDesejoPrioridade(d){
  const r = (state.biblioteca.reservas||[]).filter(z => z.livroId && z.livroId===d.livroId && z.status==='ativa').length;
  return (d.votos||[]).length*2 + r*3 + (d.votos||[]).filter(v => v.origem==='professor').length*2;
}
function renderBibliotecaCompras(){
  const b = state.biblioteca, x = bibExtras();
  if(!x.carregado) return '<div class="card"><div class="spinner"></div></div>';
  const C = x.compras;
  const abertos = new Set((x.desejos||[]).filter(d => d.status==='aberto').map(d => d.livroId).filter(Boolean));
  const linhas = biblioAcervoDados();
  const auto = [
    ...linhas.filter(r => r.disp===0 && r.fila>0).map(r => ({ r, motivo:`Esgotado, ${r.fila} aluno(s) na fila`, qtd: Math.max(1, r.fila) })),
    ...linhas.filter(r => r.ex>0 && r.historico/r.ex>=3 && !(r.disp===0 && r.fila>0)).map(r => ({ r, motivo:`Alta procura: ${r.historico} empréstimos para ${r.ex} exemplar(es)`, qtd: Math.max(1, Math.ceil(r.historico/3)-r.ex) }))
  ].filter(a => !abertos.has(a.r.id));
  const lista = (x.desejos||[]).filter(d => C.status==='todos' || d.status===C.status).sort((p,q) => C.status==='aberto' ? bibDesejoPrioridade(q)-bibDesejoPrioridade(p) : (q.atualizadoEm||q.createdAt)-(p.atualizadoEm||p.createdAt));
  const cont = st => (x.desejos||[]).filter(d => d.status===st).length;
  const origemTxt = d => { const v = d.votos||[]; const pr = v.filter(z=>z.origem==='professor').length, al = v.filter(z=>z.origem==='aluno').length, bi = v.filter(z=>z.origem==='biblioteca').length;
    return [pr?`${pr} professor(es)`:'', al?`${al} aluno(s)`:'', bi?'biblioteca':''].filter(Boolean).join(' · '); };
  const f = C.form;
  return `
    ${auto.length ? `<div class="card">
      <h3 style="margin-top:0;">🤖 Sugeridos pelo próprio acervo</h3>
      <p class="muted" style="font-size:.85rem; margin-top:0;">Calculado a partir da fila de espera e do número de empréstimos.</p>
      ${auto.map(a => `<div class="list-item" style="flex-wrap:wrap; gap:8px;"><div style="flex:1 1 240px;"><strong>${esc(a.r.titulo)}</strong>${a.r.autor?` <span class="muted">— ${esc(a.r.autor)}</span>`:''}<br><span class="muted" style="font-size:.8rem;">${esc(a.motivo)} · sugerido: +${a.qtd} exemplar(es)</span></div>
        <button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-compra-auto" data-id="${esc(a.r.id)}" data-qtd="${a.qtd}" data-motivo="${esc(a.motivo)}">+ Adicionar à lista</button></div>`).join('')}
    </div>` : ''}
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h2 style="margin:0;">Pedidos de compra</h2>
        <div class="row" style="flex:0 0 auto; gap:6px; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-compra-csv">⬇ Planilha para a direção</button>
          <button class="btn btn-primary btn-sm" style="width:auto;" data-action="bib2-compra-novo">+ Novo pedido</button>
        </div>
      </div>
      <p class="muted" style="font-size:.85rem; margin:6px 0 0;">Professores pedem pela aba “📚 Biblioteca” de cada aula do plano, e alunos pela própria área da Biblioteca. Pedidos iguais somam votos. A ordem considera votos, pedidos de professores e fila de espera.</p>
      ${C.msg ? `<p style="color:#1d6b31; font-size:.88rem;">${esc(C.msg)}</p>` : ''}
      ${f ? `<div style="border:1px solid var(--paper-line); border-radius:8px; padding:10px 12px; margin-top:10px;">
        <label style="margin-top:0;">Título</label><input type="text" id="bib2-compra-titulo" value="${esc(f.titulo||'')}">
        <label>Autor</label><input type="text" id="bib2-compra-autor" value="${esc(f.autor||'')}">
        <div class="row" style="gap:8px; flex-wrap:wrap;"><div style="flex:0 0 120px;"><label>Quantidade</label><input type="number" min="1" id="bib2-compra-qtd" value="${f.qtd||1}"></div>
        <div style="flex:1 1 220px;"><label>Motivo</label><input type="text" id="bib2-compra-motivo" value="${esc(f.motivo||'')}" placeholder="Ex.: pedido da turma 2PG"></div></div>
        ${f.erro ? `<p class="err">${esc(f.erro)}</p>` : ''}
        <div class="row" style="margin-top:8px; gap:6px;"><button class="btn btn-ghost" data-action="bib2-compra-cancelar">Cancelar</button><button class="btn btn-primary" data-action="bib2-compra-salvar">Salvar pedido</button></div>
      </div>` : ''}
      <div class="row" style="gap:6px; flex-wrap:wrap; margin-top:10px;">
        ${[['aberto','Em aberto'],['comprado','Comprados'],['recusado','Recusados'],['todos','Todos']].map(([v,t]) => `<button class="btn ${C.status===v?'btn-primary':'btn-ghost'} btn-sm" style="width:auto;" data-action="bib2-compra-filtro" data-v="${v}">${t}${v!=='todos'?` (${cont(v)})`:''}</button>`).join('')}
      </div>
      ${lista.length===0 ? '<p class="muted" style="margin-top:10px;">Nenhum pedido aqui.</p>' : `<div class="table-scroll" style="margin-top:10px;"><table class="pv-sign-table">
        <thead><tr><th>Livro</th><th style="text-align:center;">Qtd.</th><th>Quem pediu</th><th>Motivo</th><th style="text-align:center;">Prioridade</th><th></th></tr></thead>
        <tbody>${lista.map(d => `<tr>
          <td><strong>${esc(d.titulo)}</strong>${d.autor?`<br><span class="muted" style="font-size:.75rem;">${esc(d.autor)}</span>`:''}${d.livroId?'<br><span class="muted" style="font-size:.72rem;">📗 já existe no acervo</span>':''}</td>
          <td style="text-align:center;">${d.qtd||1}</td>
          <td style="font-size:.85rem;">${esc(origemTxt(d))}<br><span class="muted" style="font-size:.75rem;">${esc((d.votos||[]).slice(0,3).map(v=>v.nome).filter(Boolean).join(', '))}${(d.votos||[]).length>3?'…':''}</span></td>
          <td style="font-size:.82rem;">${esc((d.motivos||[]).slice(0,3).join(' · '))}</td>
          <td style="text-align:center;">${d.status==='aberto' ? bibDesejoPrioridade(d) : `<span class="pill">${d.status==='comprado'?'comprado':'recusado'}</span>`}</td>
          <td><div style="display:flex; flex-wrap:nowrap; gap:4px;">${d.status==='aberto'
            ? `<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-compra-status" data-id="${esc(d.id)}" data-v="comprado" title="Marcar como comprado">✓ Comprado</button><button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-compra-status" data-id="${esc(d.id)}" data-v="recusado" title="Recusar">✕</button>`
            : `<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-compra-status" data-id="${esc(d.id)}" data-v="aberto">Reabrir</button>`}</div></td></tr>`).join('')}</tbody>
      </table></div>`}
    </div>`;
}
async function bibCompraStatus(id, st){
  const b = state.biblioteca, x = bibExtras();
  const lista = await bibDesejosRecarregar(); const d = lista.find(z => z.id===id); if(!d) return;
  d.status = st; d.atualizadoEm = Date.now();
  x.compras.msg = '';
  if(st==='comprado'){
    const livro = d.livroId ? b.livros.find(l => l.id===d.livroId) : b.livros.find(l => biblioNorm(l.titulo)===biblioNorm(d.titulo));
    if(livro && confirm(`Somar ${d.qtd||1} exemplar(es) a “${livro.titulo}” no catálogo?`)){ livro.exemplares = (parseInt(livro.exemplares)||0) + (d.qtd||1); await saveBibliotecaLivros(); x.compras.msg = `Catálogo atualizado: “${livro.titulo}” agora tem ${livro.exemplares} exemplar(es).`; }
    else if(!livro) x.compras.msg = `Marcado como comprado. Quando o livro chegar, cadastre “${d.titulo}” no Catálogo.`;
  }
  await bibGravarChave('biblioteca-desejos', lista); render();
}
const BIB_STOP = new Set('aula aulas sobre entre para pelos pelas como mais menos muito suas seus dela dele desde onde quando qual quais porque capitulo capítulo galeria atividades atividade revisao revisão avaliacao avaliação bimestre questoes questões enem vestibulares debate plural trabalhando abertura unidade parte introducao introdução conceito conceitos contemporaneo contemporâneos contemporaneos desafios formas outras outros novas novos nossa nosso pensamento pensar mundo vida sociedade texto textos livro leitura projeto final grupo'.split(' ').map(w => normalizeTexto(w).toLowerCase()));
function bibTokens(s){ return normalizeTexto(String(s||'')).toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w => w.length>=4 && !BIB_STOP.has(w)); }
function bibPublico(){
  const u = state.ui; if(!u.bibPub) u.bibPub = { carregado:false, carregando:false, livros:[], emps:[] };
  const p = u.bibPub;
  if(!p.carregado && !p.carregando){ p.carregando = true;
    Promise.all([bibLerChave('biblioteca-livros', []), bibLerChave('biblioteca-emprestimos', [])]).then(([l, e]) => { p.livros = l||[]; p.emps = e||[]; p.carregado = true; p.carregando = false; p.em = Date.now(); render(); }); }
  return p;
}
function bibLivrosParaAula(plano, aula, livros){
  const textoAula = [aula.tema, aula.tituloCurto, aula.capitulo, aula.objetivo, aula.pergunta, aula.slides && aula.slides.conceito && aula.slides.conceito[0], ...((aula.slides && aula.slides.pontos) || [])].filter(Boolean).join(' ');
  const tAula = new Set(bibTokens(textoAula));
  const normAula = ' ' + normalizeTexto(textoAula).toLowerCase() + ' ';
  const disc = normalizeTexto(plano.disciplina||'').toLowerCase();
  return livros.map(l => {
    let sc = 0; const motivos = [];
    (l.palavrasChave||'').split(/[,;]/).map(t => t.trim()).filter(Boolean).forEach(t => { const n = normalizeTexto(t).toLowerCase(); if(n.length>=3 && normAula.includes(n)){ sc += 4; motivos.push(t); } });
    const sobre = (l.autor||'').split(/\s+/).pop(); if(sobre && sobre.length>=4 && normAula.includes(' ' + normalizeTexto(sobre).toLowerCase())){ sc += 4; motivos.push('autor citado na aula'); }
    const comuns = bibTokens(l.titulo).filter(w => tAula.has(w)); if(comuns.length){ sc += comuns.length*2; motivos.push('título'); }
    if(disc && normalizeTexto(l.categoria||'').toLowerCase()===disc) sc += 1;
    return { l, sc, motivos };
  }).filter(r => r.sc>=3).sort((p,q) => q.sc-p.sc || p.l.titulo.localeCompare(q.l.titulo,'pt-BR')).slice(0,6);
}
function planoBibliotecaHtml(plano, aula){
  const p = bibPublico();
  if(!p.carregado) return '<p class="muted">Consultando o acervo da biblioteca…</p>';
  const achados = bibLivrosParaAula(plano, aula, p.livros);
  const disc = normalizeTexto(plano.disciplina||'').toLowerCase();
  const daDisc = p.livros.filter(l => disc && normalizeTexto(l.categoria||'').toLowerCase()===disc && !achados.some(a => a.l.id===l.id)).slice(0,4);
  const disp = l => Math.max(0, (parseInt(l.exemplares)||0) - p.emps.filter(e => e.livroId===l.id && !e.dataDevolucao).length);
  const item = (l, extra) => { const d = disp(l); return `<li><strong>${esc(l.titulo)}</strong>${l.autor?` — ${esc(l.autor)}`:''} <span class="pill" style="font-size:.72rem; padding:1px 8px; ${d?'':'background:var(--red); color:#fff;'}">${d ? d+' disponível(is)' : 'todos emprestados'}</span>${extra?` <span class="muted" style="font-size:.78rem;">(${esc(extra)})</span>`:''}</li>`; };
  const k = `${plano.id}|${aula.n}`, ped = (state.ui.bibPedidoAula||{})[k];
  return `<div style="font-size:.9rem;">
    ${achados.length ? `<p style="margin:0 0 4px;"><strong>Livros do acervo ligados a esta aula:</strong></p><ul style="margin:0 0 8px 18px;">${achados.map(a => item(a.l, a.motivos.slice(0,2).join(', '))).join('')}</ul>`
      : `<p class="muted" style="margin:0 0 6px;">Nenhum livro do acervo ligado diretamente a este tema.</p>`}
    ${daDisc.length ? `<p style="margin:0 0 4px;"><strong>Outros livros de ${esc(plano.disciplina)}:</strong></p><ul style="margin:0 0 8px 18px;">${daDisc.map(l => item(l)).join('')}</ul>` : ''}
    <p class="muted" style="font-size:.8rem; margin:0 0 6px;">Indique aos alunos para emprestar na biblioteca. A biblioteca pode ligar livros às aulas pelo campo “palavras-chave” do cadastro.</p>
    ${ped && ped.ok ? `<p style="color:#1d6b31; margin:4px 0;">${esc(ped.ok)}</p>` : ped ? `<div style="border:1px solid var(--paper-line); border-radius:8px; padding:8px 10px;">
        <label style="margin-top:0;">Livro que você gostaria que a biblioteca comprasse</label>
        <input type="text" id="bib2-ped-aula-titulo" placeholder="Título" value="${esc(ped.titulo||'')}"><input type="text" id="bib2-ped-aula-autor" placeholder="Autor (opcional)" style="margin-top:6px;">
        ${ped.erro?`<p class="err">${esc(ped.erro)}</p>`:''}
        <div class="row" style="gap:6px; margin-top:6px;"><button class="btn btn-ghost btn-sm" data-action="bib2-ped-aula-cancelar" data-k="${esc(k)}">Cancelar</button><button class="btn btn-primary btn-sm" data-action="bib2-ped-aula-enviar" data-k="${esc(k)}" data-tema="${esc('Aula ' + aula.n + ' de ' + (plano.disciplina||'') + ': ' + (aula.tituloCurto||aula.tema||''))}">Enviar pedido</button></div></div>`
      : `<button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-ped-aula-abrir" data-k="${esc(k)}">🛒 Pedir livro para este tema</button>`}
  </div>`;
}
function renderAlunoBibliotecaDestaques(){
  const al = state.aluno, livros = al.bibliotecaLivros || [], todos = al.bibliotecaTodos || [];
  if(!livros.length) return '';
  const hoje = Date.now(), d30 = new Date(hoje - 30*86400000).toISOString().slice(0,10);
  const cont = {}; todos.filter(e => (e.dataEmprestimo||'') >= d30).forEach(e => { cont[e.livroId] = (cont[e.livroId]||0) + 1; });
  const disp = l => Math.max(0, (parseInt(l.exemplares)||0) - todos.filter(e => e.livroId===l.id && !e.dataDevolucao).length);
  const top = Object.entries(cont).map(([id,n]) => ({ l: livros.find(x => x.id===id), n })).filter(x => x.l).sort((p,q)=>q.n-p.n).slice(0,5);
  const novos = livros.filter(l => l.createdAt && hoje - l.createdAt <= 45*86400000).sort((p,q)=>q.createdAt-p.createdAt).slice(0,6);
  const card = (l, sub) => { const d = disp(l); return `<div class="bib-dest">
      ${l.capaUrl ? `<img src="${cloudinaryLargura(l.capaUrl, 160)}" alt="" loading="lazy">` : '<div class="bib-dest-sem">📕</div>'}
      <div class="bib-dest-t">${esc(l.titulo)}</div>${l.autor?`<div class="muted" style="font-size:.75rem;">${esc(l.autor)}</div>`:''}
      <div style="font-size:.75rem; margin-top:2px;">${sub ? esc(sub)+' · ' : ''}${d ? `<span style="color:#1d6b31;">disponível</span>` : '<span style="color:#b3261e;">emprestado</span>'}</div></div>`; };
  const ped = al.bibPedido || null;
  return `
    <div class="card">
      <h3 style="margin-top:0;">⭐ Destaques da biblioteca</h3>
      ${top.length ? `<p style="margin:0 0 6px; font-weight:600;">🔥 Mais lidos do mês</p><div class="bib-dest-grade">${top.map(x => card(x.l, x.n + (x.n===1?' empréstimo':' empréstimos'))).join('')}</div>` : ''}
      ${novos.length ? `<p style="margin:12px 0 6px; font-weight:600;">🆕 Chegaram na biblioteca</p><div class="bib-dest-grade">${novos.map(l => card(l, '')).join('')}</div>` : ''}
      ${!top.length && !novos.length ? '<p class="muted">Ainda não há destaques este mês. Passe na biblioteca e conheça o acervo!</p>' : ''}
      <p class="muted" style="font-size:.8rem; margin:10px 0 0;">Para pegar um livro, procure a biblioteca da escola.</p>
    </div>
    <div class="card">
      <h3 style="margin-top:0;">💬 Sugira um livro</h3>
      ${ped && ped.ok ? `<p style="color:#1d6b31;">${esc(ped.ok)}</p><button class="btn btn-ghost btn-sm" style="width:auto;" data-action="bib2-aluno-ped-novo">Sugerir outro</button>` : `
        <p class="muted" style="font-size:.85rem; margin-top:0;">Qual livro você gostaria de encontrar na biblioteca? Se outros colegas pedirem o mesmo, o pedido ganha prioridade.</p>
        <input type="text" id="bib2-aluno-titulo" placeholder="Título do livro" value="${esc((ped && ped.titulo)||'')}">
        <input type="text" id="bib2-aluno-autor" placeholder="Autor (se souber)" style="margin-top:6px;" value="${esc((ped && ped.autor)||'')}">
        ${ped && ped.erro ? `<p class="err">${esc(ped.erro)}</p>` : ''}
        <button class="btn btn-primary btn-sm" style="width:auto; margin-top:8px;" data-action="bib2-aluno-ped-enviar">Enviar sugestão</button>`}
    </div>`;
}
function bibliotecaAbrirImportarPlanilha(){
  const b = state.biblioteca;
  b.catalogoMode = 'importar';
  b.importPlanilha = { processando:false, erro:'', resultado:null, nomeArquivo:'', importando:false };
  render();
}
function bibliotecaCancelarImportarPlanilha(){
  const b = state.biblioteca;
  b.catalogoMode = 'list';
  b.importPlanilha = { processando:false, erro:'', resultado:null, nomeArquivo:'', importando:false };
  render();
}
function parseLivrosPlanilha(rows){
  if(!rows || rows.length<2) return { erro: 'O arquivo parece vazio ou não tem linhas de dados.' };
  const header = rows[0].map(h=>String(h||'').trim());
  const headerNorm = header.map(h=>normalizeTexto(h));
  const idxTitulo = headerNorm.findIndex(h=>/^(TITULO|LIVRO|OBRA)$/.test(h));
  const idxAutor = headerNorm.findIndex(h=>h==='AUTOR');
  const idxCategoria = headerNorm.findIndex(h=>/^(CATEGORIA|GENERO|ASSUNTO)$/.test(h));
  const idxIsbn = headerNorm.findIndex(h=>h==='ISBN');
  const idxExemplares = headerNorm.findIndex(h=>/^(EXEMPLARES|QUANTIDADE|QTD|QTDE)$/.test(h));
  if(idxTitulo===-1) return { erro: 'Não encontrei uma coluna "Título" (ou "Livro") no cabeçalho do arquivo.' };
  const dataLines = rows.slice(1).filter(row => row.some(c => String(c||'').trim()!==''));
  const livros = dataLines.map(cols => {
    const titulo = String(cols[idxTitulo]||'').trim();
    const autor = idxAutor!==-1 ? String(cols[idxAutor]||'').trim() : '';
    const categoria = idxCategoria!==-1 ? String(cols[idxCategoria]||'').trim() : '';
    const isbn = idxIsbn!==-1 ? String(cols[idxIsbn]||'').trim() : '';
    const exemplaresRaw = idxExemplares!==-1 ? parseInt(String(cols[idxExemplares]||'').trim()) : NaN;
    const exemplares = (!isNaN(exemplaresRaw) && exemplaresRaw>=1) ? exemplaresRaw : 1;
    return { titulo, autor, categoria, isbn, exemplares };
  }).filter(l => l.titulo);
  if(livros.length===0) return { erro: 'Não encontrei nenhuma linha com título preenchido.' };
  return { livros };
}
async function processarArquivoLivrosPlanilha(file){
  const b = state.biblioteca;
  b.importPlanilha = { processando:true, erro:'', resultado:null, nomeArquivo:file.name, importando:false };
  render();
  let rows;
  try{ rows = await lerPlanilhaComoLinhas(file); }
  catch(e){ b.importPlanilha = { processando:false, erro:'Não foi possível ler esse arquivo. Confira se é um .csv ou .xlsx válido.', resultado:null, nomeArquivo:file.name, importando:false }; render(); return; }
  const parsed = parseLivrosPlanilha(rows);
  if(parsed.erro){
    b.importPlanilha = { processando:false, erro:parsed.erro, resultado:null, nomeArquivo:file.name, importando:false };
    render();
    return;
  }
  const livros = parsed.livros.map(l => ({
    ...l,
    jaExiste: b.livros.some(existente => normalizeTexto(existente.titulo)===normalizeTexto(l.titulo))
  }));
  b.importPlanilha = { processando:false, erro:'', resultado:{ livros }, nomeArquivo:file.name, importando:false };
  render();
}
async function confirmarImportarLivrosPlanilha(){
  const b = state.biblioteca;
  const resultado = b.importPlanilha.resultado;
  if(!resultado) return;
  b.importPlanilha.importando = true;
  render();
  resultado.livros.forEach(l => {
    b.livros.push({ id: cryptoId(), titulo: l.titulo, autor: l.autor, categoria: l.categoria, isbn: l.isbn, exemplares: l.exemplares, createdAt: Date.now() });
  });
  await saveBibliotecaLivros();
  const total = resultado.livros.length;
  b.importPlanilha = { processando:false, erro:'', resultado:null, nomeArquivo:'', importando:false };
  b.catalogoMode = 'list';
  render();
  alert(`Importação concluída! ${total} livro(s) adicionado(s) ao catálogo.`);
}
function renderBibliotecaImportarPlanilha(){
  const b = state.biblioteca;
  const ip = b.importPlanilha;
  let body;
  if(ip.processando){
    body = `<div class="spinner"></div>`;
  } else if(!ip.resultado){
    body = `
      <p class="muted">Envie uma planilha (.csv ou .xlsx) com uma linha por livro, contendo:</p>
      <ul class="muted" style="font-size:.85rem; margin:0 0 10px 18px;">
        <li>uma coluna <strong>Título</strong> (ou "Livro") — obrigatória;</li>
        <li>uma coluna <strong>Autor</strong> (opcional);</li>
        <li>uma coluna <strong>Categoria</strong> (opcional);</li>
        <li>uma coluna <strong>ISBN</strong> (opcional);</li>
        <li>uma coluna <strong>Exemplares</strong> (opcional — assume 1 se não vier preenchida).</li>
      </ul>
      <input type="file" id="biblioteca-import-planilha-file" accept=".csv,.xlsx,.xls">
      ${ip.erro ? `<p class="err" style="margin-top:8px;">${esc(ip.erro)}</p>` : ''}
    `;
  } else {
    const r = ip.resultado;
    const jaExistemCount = r.livros.filter(l=>l.jaExiste).length;
    body = `
      <p class="muted">Encontrei <strong>${r.livros.length}</strong> livro(s) na planilha.${jaExistemCount>0?` <span class="err" style="margin:0;">⚠️ ${jaExistemCount} já parece(m) existir no catálogo (título igual) — serão adicionados como registro(s) novo(s) mesmo assim.</span>`:''}</p>
      <div class="table-scroll" style="margin-top:8px;">
        <table class="pv-sign-table">
          <thead><tr><th>Título</th><th>Autor</th><th>Categoria</th><th style="text-align:center;">Exemplares</th></tr></thead>
          <tbody>
            ${r.livros.map(l => `
              <tr>
                <td>${esc(l.titulo)}${l.jaExiste?' <span class="muted" style="font-size:.72rem;">(já existe)</span>':''}</td>
                <td>${esc(l.autor||'-')}</td>
                <td>${esc(l.categoria||'-')}</td>
                <td style="text-align:center;">${l.exemplares}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="row" style="margin-top:14px;">
        <button class="btn btn-ghost" data-action="biblioteca-cancelar-importar-planilha" ${ip.importando?'disabled':''}>Cancelar</button>
        <button class="btn btn-primary" data-action="biblioteca-confirmar-importar-planilha" ${ip.importando?'disabled':''}>${ip.importando?'Importando...':'Confirmar importação'}</button>
      </div>
    `;
  }
  return `
    <div class="card">
      <button class="btn btn-ghost btn-sm" data-action="biblioteca-cancelar-importar-planilha">← Voltar</button>
      <h2>Importar acervo de planilha</h2>
      ${body}
    </div>
  `;
}
__parteOk('biblioteca');
