/* Sala de Avaliações · CEETIP Gov. Marcelo Déda Chagas · parte "socio" */
const SOCIO_PONTOS = { A:2.5, B:5, C:7.5, D:10 };
const SOCIO_NIVEIS = { A:'Em desenvolvimento', B:'Básico', C:'Consolidado', D:'Avançado' };
const SOCIO_PESOS = { comp1:4, comp2:4, auto:2 };
const SOCIO_AUTO_ESCALA = ['Quase nunca','Poucas vezes','Muitas vezes','Quase sempre'];
const SOCIO_AUTO_ITENS = [
  { t:'Meu comportamento em sala atrapalha a aula', rev:true },
  { t:'Eu chego à escola dentro do horário', rev:false },
  { t:'Eu entro na sala assim que o horário de entrada começa', rev:false },
  { t:'Eu furo ou desrespeito a fila do almoço', rev:true },
  { t:'Eu trato colegas e professores com respeito, mesmo quando discordo', rev:false },
  { t:'Eu faço as tarefas combinadas dentro do prazo', rev:false },
  { t:'Eu participo ativamente das aulas', rev:false },
];
function socioAutoNota(itens){
  itens = itens || {};
  let soma = 0;
  for(let i=0;i<SOCIO_AUTO_ITENS.length;i++){
    const v = itens[i];
    if(v===undefined || v===null) return null;
    soma += (SOCIO_AUTO_ITENS[i].rev ? 3-v : v) / 3 * 10;
  }
  return Math.round(soma / SOCIO_AUTO_ITENS.length * 10) / 10;
}
const SOCIO_SERIES = {
  1: [
    { id:'1-1', comp:1, tema:'Lidar com conflitos e aceitar ajuda',
      texto:'Durante um jogo de futsal de uma determinada escola ocorreu um momento tenso, pois dois alunos começaram uma discussão que culminou em agressões físicas e verbais. O conflito foi rapidamente contido por colegas e professores e os alunos envolvidos encaminhados para a direção escolar no intuito de resolver o problema. A equipe diretiva convidou professores e um psicólogo do município para acompanhar a conversa e tentar resolver o problema da melhor forma possível. Se você fosse o aluno envolvido no conflito como agiria.',
      opcoes:{ A:'Eu acharia que a culpa da briga foi do outro e que não preciso conversar com professores ou psicólogo; só quero que isso acabe logo.', B:'Eu entenderia que a conversa pode ajudar, mas ficaria na defensiva e não deixaria ninguém opinar sobre o meu jeito de agir.', C:'Eu reconheceria o meu erro e aceitaria a ajuda de professores e psicólogo para não repetir uma situação como essa.', D:'Eu assumiria o que fiz, combinaria com professores e psicólogo mudanças concretas na minha postura e voltaria a conversar para ver se estão funcionando.' },
      cresce:'Conflitos acontecem com todo mundo. O passo seguinte é transformar o reconhecimento em ação: combinar com alguém de confiança uma mudança concreta de postura e voltar a conversar sobre como está indo.',
      parabens:'Você reconhece o erro, aceita ajuda e se compromete a mudar. Essa postura de responsabilidade é a base para conviver bem e resolver conflitos.' },
    { id:'1-2', comp:2, tema:'Metas e persistência nos estudos',
      texto:'Um determinado aluno do 1º ano do Ensino Médio de uma escola pública tem o sonho de fazer um curso universitário e melhorar as condições de vida de sua família. No entanto, no dia a dia escolar tem dificuldades em algumas disciplinas e encara essa situação com desleixo, ou seja, não busca melhorar seu desempenho escolar e vê seu sonho cada vez mais distante de se concretizar. Se você fosse esse aluno como agiria em tal situação.',
      opcoes:{ A:'Eu sentiria que o problema está nas disciplinas difíceis e não em mim, e deixaria tudo como está, mesmo vendo as notas caírem a cada bimestre.', B:'Eu perceberia em quais disciplinas tenho mais dificuldade e o que me atrapalha, mas continuaria sem mudar a minha rotina de estudos.', C:'Eu identificaria as minhas dificuldades, definiria prazos para melhorar e passaria a acreditar que o meu sonho é possível de alcançar.', D:'Eu definiria metas e prazos, conferiria de tempos em tempos se estou cumprindo e ajustaria o plano, pedindo ajuda quando precisasse.' },
      cresce:'Identificar o que atrapalha já é um bom começo. Para avançar, transforme isso em metas pequenas, com prazos, e confira de tempos em tempos se está cumprindo. Pedir ajuda aos professores e à monitoria faz parte do caminho.',
      parabens:'Você sabe que sonho precisa de plano: metas, prazos e acompanhamento. Continue revisando suas metas — é isso que aproxima o sonho da realidade.' },
    { id:'1-3', comp:2, tema:'Mudar de estratégia e pedir ajuda', extra:true,
      texto:'Você estuda há duas semanas para uma prova importante, sempre do mesmo jeito, mas percebe que não está aprendendo e que as notas dos simulados não melhoram. Faltam poucos dias para a prova. O que você faria?',
      opcoes:{ A:'Eu continuaria igual, porque mudar o método de estudo agora seria perda de tempo.', B:'Eu estudaria mais horas por dia com o mesmo método, acreditando que o esforço vai render no fim.', C:'Eu perceberia que o método não está funcionando e testaria outra forma de estudar por conta própria.', D:'Eu reconheceria que o método não funciona, testaria outra forma de estudar e pediria a um professor ou colega que me ajudasse a ver onde estou errando.' },
      cresce:'Persistir só no esforço, sem rever o método, nem sempre dá resultado. Vale trocar de estratégia cedo e pedir ajuda: isso não é desistir, é estudar de forma mais inteligente.',
      parabens:'Você sabe que persistência não é repetir o que não funciona: muda de estratégia e usa a ajuda de outras pessoas. Essa flexibilidade é decisiva para alcançar metas.' },
  ],
  2: [
    { id:'2-1', comp:1, tema:'Liderança e trabalho em grupo',
      texto:'Você é líder de sua turma e se depara com o seguinte problema: os alunos foram divididos em grupos para a apresentação de um seminário, sendo que cada estudante ficou responsável por uma tarefa, envolvendo pesquisa, desenho e exposição oral. Porém, determinado grupo está apresentando dificuldades de relacionamento, e seus integrantes estão acusando uns aos outros de não executarem a sua tarefa adequadamente. Diante disso, você é criticado por alguns alunos porque não agiu antes e é pressionado para resolver a situação. O que você faria?',
      opcoes:{ A:'Eu tentaria resolver tudo sozinho, sem pedir ajuda a ninguém, mesmo nunca tendo passado por uma situação parecida antes.', B:'Eu resolveria do meu jeito e evitaria responder às críticas e acusações que recebi, para não criar mais confusão.', C:'Eu incentivaria o grupo a continuar junto, lembrando que cada um se esforçou de alguma forma para cumprir a sua tarefa.', D:'Eu ouviria os dois lados e buscaria o apoio de colegas ou professores com habilidade nas tarefas para ajudar o grupo a se reorganizar.' },
      cresce:'Liderar também é saber pedir apoio e escutar os dois lados. Em situações assim, vale conversar com o grupo, reconhecer o esforço de cada um e, se preciso, envolver professores ou colegas que possam ajudar.',
      parabens:'Você enxerga a liderança como articulação: buscar recursos e pessoas que ajudem o grupo a dar certo, sem deixar ninguém de fora.' },
    { id:'2-2', comp:2, tema:'Respeito e empatia em momentos de tensão',
      texto:'Durante uma partida de vôlei, realizada na quadra poliesportiva da escola, dois alunos do mesmo time se desentenderam por causa de um ponto perdido. Ambos se exaltaram e trocaram ofensas verbais, usando palavras como burro, imbecil, idiota, etc. Se você fizesse parte da equipe, como reagiria?',
      opcoes:{ A:'Eu não me incomodaria com os xingamentos, porque eles fazem parte do esporte e logo passam.', B:'Eu agiria com naturalidade e deixaria os dois resolverem, já que esse tipo de briga é comum entre os alunos.', C:'Eu tentaria acalmar os colegas para que o desentendimento não prejudicasse o time durante a partida.', D:'Eu chamaria a atenção dos colegas com calma e mostraria como aquelas ofensas afetam a eles e ao grupo todo.' },
      cresce:'Ofensas, mesmo no calor do jogo, machucam e não devem ser normalizadas. Você pode agir sem confronto: acalmar os colegas, lembrar que o time precisa de todos e, se for o caso, chamar o professor.',
      parabens:'Você não normaliza a agressão verbal e age para que o grupo se respeite. Lembre de fazer isso com cuidado, buscando ajudar os colegas a refletirem e não a se sentirem humilhados.' },
    { id:'2-3', comp:1, tema:'Discordar com respeito', extra:true,
      texto:'Seu grupo escolheu um caminho para o trabalho final e todos estão animados, mas você percebe um erro que pode prejudicar a nota de todos. O prazo é curto e ninguém quer ouvir mais problemas. O que você faria?',
      opcoes:{ A:'Eu ficaria quieto para não estragar o clima do grupo, esperando que no fim dê certo.', B:'Eu entregaria como está e só comentaria sobre o erro depois, se a nota saísse ruim.', C:'Eu comentaria o erro em particular com um colega e deixaria que ele decidisse se leva o assunto ao grupo.', D:'Eu falaria com o grupo na hora, de forma respeitosa, mostraria o erro e proporia um jeito rápido de corrigir, mesmo que isso incomodasse alguns.' },
      cresce:'Manter a harmonia é importante, mas calar diante de um erro pode custar caro para todos. Dá para discordar com respeito, mostrando o problema e já trazendo uma sugestão de solução.',
      parabens:'Você sabe que bom clima não é ausência de discordância: fala o que precisa ser dito, com respeito, e já traz solução. Isso fortalece o grupo.' },
  ],
  3: [
    { id:'3-1', comp:1, tema:'Protagonismo e participação na comunidade',
      texto:'A escola onde você estuda está planejando uma feira comunitária para arrecadar fundos e melhorar o ambiente escolar. Os alunos foram convidados a sugerir ideias e participar ativamente no planejamento e execução do evento. Como você se envolveria na organização da feira comunitária para ajudar a melhorar a escola e beneficiar a comunidade?',
      opcoes:{ A:'Eu participaria porque fui convidado, mas sem acreditar que isso possa realmente melhorar a escola ou a comunidade.', B:'Eu sugeriria um projeto social conhecido, como a arrecadação de alimentos ou de roupas para a comunidade.', C:'Eu pensaria nas necessidades da comunidade e sugeriria ações em que as habilidades de cada colega fossem bem aproveitadas.', D:'Eu me juntaria a outros alunos para planejar, executar e avaliar um projeto que beneficie a escola e a comunidade.' },
      cresce:'Participar já é importante. Para ir além, procure entender o que a comunidade realmente precisa e como as habilidades de cada colega podem ser usadas — e acompanhe os resultados depois do evento.',
      parabens:'Você pensa em todo o ciclo de um projeto — planejar, executar e avaliar — e em quem será beneficiado. Isso é protagonismo.' },
    { id:'3-2', comp:2, tema:'Criatividade e solução de problemas',
      texto:'Durante as aulas dos componentes de Ciências da Natureza e Matemática de uma escola em tempo integral, foi identificado um aumento exponencial do desperdício de água e de comida na escola. Os professores propuseram que os alunos desenvolvam soluções para reduzir o consumo de água e de comida, tanto na escola quanto em casa. Como você agiria para resolver o problema de desperdício de água e de comida na escola?',
      opcoes:{ A:'Eu entenderia que isso não é responsabilidade minha e não mudaria nada no meu dia a dia.', B:'Eu, às vezes, faria pequenas ações, como fechar a torneira enquanto escovo os dentes.', C:'Eu ficaria aberto a novas ideias e persistiria na busca de formas criativas de economizar água e comida.', D:'Eu criaria com os colegas soluções novas, como redutores de vazão ou porções ajustadas a cada aluno, e avaliaria se o desperdício realmente diminui.' },
      cresce:'Pequenas atitudes contam, e ficam ainda mais fortes quando viram hábito e ideia compartilhada. Que tal propor uma solução com os colegas e acompanhar se ela funciona?',
      parabens:'Você cria, testa e avalia soluções para problemas reais da escola. Essa mentalidade de inovação e responsabilidade com o coletivo vale para a vida toda.' },
    { id:'3-3', comp:2, tema:'Reconhecer a boa ideia dos outros', extra:true,
      texto:'Você coordena um projeto da escola e um colega que quase não fala propõe uma ideia melhor que a sua, mas que muda o plano que você já tinha apresentado ao grupo. O que você faria?',
      opcoes:{ A:'Eu manteria a minha ideia, já que fui eu quem apresentou o plano ao grupo.', B:'Eu aceitaria a ideia dele, mas deixaria claro que fiquei chateado por ter que mudar o plano.', C:'Eu adotaria a ideia dele, mas apresentaria a mudança como decisão minha, para não perder a liderança.', D:'Eu adotaria a ideia dele, reconheceria o crédito dele diante do grupo e ajustaria o plano com todos.' },
      cresce:'Liderar não é ter sempre a melhor ideia, e sim escolher a melhor para o grupo. Reconhecer o crédito de quem contribuiu aumenta a confiança e a participação de todos.',
      parabens:'Você coloca o resultado do grupo acima do próprio ego e valoriza quem contribui. Essa é uma marca de liderança madura.' },
  ],
};
function socioPtsQuestao(id, respostas, menos){
  const m = SOCIO_PONTOS[(respostas||{})[id]] || 0;
  const n = SOCIO_PONTOS[(menos||{})[id]];
  return n===undefined ? m : (m + (12.5 - n)) / 2;
}
function socioCalc(serie, respostas, auto, menos){
  const qs = (SOCIO_SERIES[serie] || []).filter(q => respostas[q.id] || !q.extra);
  const media = comp => { const l = qs.filter(q=>q.comp===comp); return l.length ? l.reduce((s,q)=>s+socioPtsQuestao(q.id,respostas,menos),0)/l.length : 0; };
  const c1 = media(1) * SOCIO_PESOS.comp1/10;
  const c2 = media(2) * SOCIO_PESOS.comp2/10;
  const a = (Number(auto)||0) * SOCIO_PESOS.auto / 10;
  return { comp1:c1, comp2:c2, auto:a, total:c1+c2+a };
}
function socioFaixa(total){
  if(total>=8) return { label:'Muito bem desenvolvido', cor:'var(--green)' };
  if(total>=6) return { label:'Bom caminho', cor:'var(--teal, #2a9d8f)' };
  if(total>=4) return { label:'Em desenvolvimento', cor:'var(--coral, #e9a23b)' };
  return { label:'Ponto de partida', cor:'var(--vinho, #8a3b57)' };
}
function socioBarra(rotulo, valor, max, cor){
  const pct = Math.max(0, Math.min(100, Math.round(valor/max*100)));
  return `<div style="margin:10px 0;">
    <div class="row" style="justify-content:space-between;"><strong style="font-size:.9rem;">${rotulo}</strong><span class="muted">${fmtNota(valor)} / ${max}</span></div>
    <div style="background:var(--paper-line); border-radius:999px; height:12px; overflow:hidden;"><div style="width:${pct}%; height:100%; background:${cor||'var(--board)'};"></div></div>
  </div>`;
}
function renderSocioRelatorio(doc, paraCoord){
  const qs = SOCIO_SERIES[doc.serie] || [];
  const faixa = socioFaixa(doc.total);
  return `
    <div class="card" style="border-top:6px solid ${faixa.cor};">
      <p class="muted" style="margin:0;">${esc(doc.unidade)} · ${doc.serie}ª série${paraCoord ? ' · '+esc(doc.studentName)+' · '+esc(doc.turmaName||'') : ''}</p>
      <h2 style="margin:4px 0 2px;">Relatório Socioemocional</h2>
      <div class="row" style="align-items:center; gap:16px; flex-wrap:wrap; margin-top:8px;">
        <div style="font-size:2.6rem; font-weight:800; line-height:1;">${fmtNota(doc.total)}<span style="font-size:1.1rem; font-weight:600;" class="muted"> / 10</span></div>
        <span class="pill" style="background:${faixa.cor}; color:#fff;">${faixa.label}</span>
      </div>
      ${socioBarra('Competência 1 — '+(qs.find(q=>q.comp===1)||{}).tema, doc.comp1, SOCIO_PESOS.comp1, 'var(--board)')}
      ${socioBarra('Competência 2 — '+(qs.find(q=>q.comp===2)||{}).tema, doc.comp2, SOCIO_PESOS.comp2, 'var(--board)')}
      ${socioBarra('Autoavaliação (média das suas respostas: '+fmtNota(doc.auto)+')', doc.notaAuto!=null?doc.notaAuto:(doc.auto*SOCIO_PESOS.auto/10), SOCIO_PESOS.auto, 'var(--board)')}
    </div>
    ${qs.filter(q=>doc.respostas[q.id]).map(q => { const L = doc.respostas[q.id]; const M = (doc.menos||{})[q.id]; return `
      <div class="card">
        <p class="muted" style="margin:0;">Competência ${q.comp} · ${esc(q.tema)}</p>
        <details style="margin:6px 0;"><summary style="cursor:pointer;">Ver a situação</summary><p style="margin-top:6px;">${esc(q.texto)}</p></details>
        <p style="margin:8px 0 4px;"><strong>O que mais se parece com você:</strong> ${esc(q.opcoes[L]||'')}</p>
        ${M ? `<p style="margin:4px 0;"><strong>O que menos se parece com você:</strong> ${esc(q.opcoes[M]||'')}</p>` : ''}
        <span class="pill">${SOCIO_NIVEIS[L]||''}</span>
        <p style="margin:10px 0 0;">${L==='D' ? esc(q.parabens) : esc(q.cresce)}</p>
      </div>`; }).join('')}
    <div class="card">
      <h3 style="margin-top:0;">Sobre este relatório</h3>
      <p class="muted" style="margin:0;">Ele mostra como você costuma reagir a situações do dia a dia da escola, neste momento. Não é um julgamento sobre quem você é: as competências socioemocionais se desenvolvem com o tempo e com a prática. Se alguma situação aqui tocou em algo que você está vivendo, converse com a coordenação ou com um professor de confiança — a escola quer te apoiar.</p>
    </div>`;
}
function socioOrdemOpcoes(qid){
  const al = state.aluno, so = socioState();
  const seed = String(al.matriculaStudentId||al.name||'x')+'|'+qid+'|'+(so.unidade||'');
  let h = 2166136261;
  for(let i=0;i<seed.length;i++){ h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd = () => { h += 0x6D2B79F5; let t = Math.imul(h ^ (h>>>15), 1|h); t ^= t + Math.imul(t ^ (t>>>7), 61|t); return ((t ^ (t>>>14))>>>0)/4294967296; };
  const arr = ['A','B','C','D'];
  for(let i=arr.length-1;i>0;i--){ const j = Math.floor(rnd()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; }
  return arr;
}
function renderAlunoSocioBlock(){
  const al = state.aluno, so = socioState();
  if(!so.loaded && !so.loading){ setTimeout(loadSocioAluno, 0); }
  if(so.loading || !so.loaded) return `<div class="card"><h2>💛 Avaliação Socioemocional</h2><div class="spinner"></div></div>`;
  const doc = so.docs.find(d=>d.unidade===so.unidade);
  const unidadeSel = `
    <label>Período</label>
    <select data-action="socio-unidade" style="max-width:260px;">
      ${UNIDADES.map(u => `<option value="${esc(u)}" ${u===so.unidade?'selected':''}>${esc(u)}${so.docs.some(d=>d.unidade===u)?' ✓':''}</option>`).join('')}
    </select>`;
  if(doc){
    const evolucao = so.docs.length>1 ? `
      <div class="card"><h3 style="margin-top:0;">Sua evolução</h3>
        ${UNIDADES.filter(u=>so.docs.some(d=>d.unidade===u)).map(u => { const d = so.docs.find(x=>x.unidade===u); return socioBarra(u, d.total, 10, 'var(--board)'); }).join('')}
      </div>` : '';
    return `<div class="card"><h2>💛 Avaliação Socioemocional</h2>${unidadeSel}</div>${renderSocioRelatorio(doc, false)}${evolucao}`;
  }
  const foraPrazo = socioForaDoPrazo(so.config, so.unidade);
  if(foraPrazo){
    return `<div class="card"><h2>💛 Avaliação Socioemocional</h2>${unidadeSel}<p style="margin-top:12px;">⏰ ${esc(foraPrazo)}</p></div>`;
  }
  if(!socioTurmaIndicada(so.config, so.unidade, al.turma && al.turma.id)){
    return `<div class="card"><h2>💛 Avaliação Socioemocional</h2>${unidadeSel}<p style="margin-top:12px;" data-socio-nao-indicada="1">📌 Neste período, a sua turma não foi indicada pela coordenação para responder a Avaliação Socioemocional. Você não precisa fazer nada. Se achar que é um engano, procure a coordenação.</p></div>`;
  }
  const serie = so.serie;
  const serieSel = serie ? '' : `
    <label>Qual é a sua série?</label>
    <div class="row" style="gap:8px; flex:0 0 auto;">${[1,2,3].map(n => `<button class="btn btn-ghost btn-sm" data-action="socio-serie" data-serie="${n}">${n}ª série</button>`).join('')}</div>`;
  if(!serie){
    return `<div class="card"><h2>💛 Avaliação Socioemocional</h2>${unidadeSel}${serieSel}</div>`;
  }
  const qs = SOCIO_SERIES[serie];
  return `
    <div class="card">
      <h2>💛 Avaliação Socioemocional${infoI('<p>Leia cada situação e escolha a alternativa que mais se parece com o que <b>você realmente faria</b>.</p><p>Não há resposta "certa" para agradar: seja sincero(a), pois o relatório é para o seu autoconhecimento.</p><p>Só você e a coordenação da escola veem o resultado.</p>', 'Como responder')}</h2>
      <p class="muted">Responda com sinceridade: só você e a coordenação veem.</p>
      ${unidadeSel}
    </div>
    ${qs.map((q,i) => `
      <div class="card">
        <p class="muted" style="margin:0;">Situação ${i+1} de ${qs.length}</p>
        <p style="margin:6px 0 10px;">${esc(q.texto)}</p>
        <p style="margin:6px 0 2px;"><strong>👍 Qual destas atitudes MAIS se parece com você?</strong></p>
        ${socioOrdemOpcoes(q.id).map(L => `
          <label style="display:flex; gap:8px; align-items:flex-start; font-weight:400; text-transform:none; margin:8px 0;">
            <input type="radio" name="socio-${q.id}" data-action="socio-resp" data-q="${q.id}" data-letra="${L}" ${so.respostas[q.id]===L?'checked':''} style="width:auto; margin-top:4px;">
            <span>${esc(q.opcoes[L])}</span>
          </label>`).join('')}
        <p style="margin:14px 0 2px;"><strong>👎 E qual destas MENOS se parece com você?</strong></p>
        ${socioOrdemOpcoes(q.id).map(L => `
          <label style="display:flex; gap:8px; align-items:flex-start; font-weight:400; text-transform:none; margin:8px 0;">
            <input type="radio" name="socio-menos-${q.id}" data-action="socio-menos" data-q="${q.id}" data-letra="${L}" ${(so.menos||{})[q.id]===L?'checked':''} style="width:auto; margin-top:4px;">
            <span>${esc(q.opcoes[L])}</span>
          </label>`).join('')}
      </div>`).join('')}
    <div class="card">
      <h3 style="margin-top:0;">Autoavaliação</h3>
      <p>Pense no seu dia a dia na escola neste período e marque <strong>com que frequência</strong> cada frase é verdade para você.</p>
      ${SOCIO_AUTO_ITENS.map((it,i) => `
        <div style="margin:12px 0;">
          <p style="margin:0 0 4px;">${esc(it.t)}</p>
          <div class="row" style="gap:10px; flex-wrap:wrap;">
            ${SOCIO_AUTO_ESCALA.map((rot,v) => `
              <label style="display:flex; align-items:center; gap:4px; font-weight:400; text-transform:none; flex:1 1 44%;">
                <input type="radio" name="socio-auto-${i}" data-action="socio-auto" data-item="${i}" data-v="${v}" ${(so.autoItens||{})[i]===v?'checked':''} style="width:auto;"> ${rot}
              </label>`).join('')}
          </div>
        </div>`).join('')}
      ${so.erro ? `<p class="err">${esc(so.erro)}</p>` : ''}
      <button class="btn btn-primary" data-action="socio-enviar" style="margin-top:14px;" ${so.saving?'disabled':''}>${so.saving?'Enviando...':'Enviar e ver meu relatório'}</button>
      <p class="muted" style="font-size:.8rem;">Depois de enviar, não dá para alterar — se precisar refazer, peça à coordenação.</p>
    </div>`;
}
function socioAlertaPadrao(respostas, auto, iniciouEm, menos){
  const letras = Object.values(respostas||{});
  const motivos = [];
  const ml = Object.values(menos||{});
  if(letras.length>=2 && letras.every(l=>l==='D') && auto>=9) motivos.push('tudo na alternativa de nota máxima');
  if(ml.length>=2 && ml.every(l=>l===ml[0])) motivos.push('marcou sempre a mesma letra como "menos parecida"');
  if(iniciouEm && (Date.now()-iniciouEm) < 15000) motivos.push('respondeu em menos de 15 s');
  return motivos.join('; ');
}
async function enviarSocioAluno(){
  const al = state.aluno, so = socioState();
  const qs = SOCIO_SERIES[so.serie] || [];
  const foraPrazo = socioForaDoPrazo(so.config, so.unidade);
  if(foraPrazo){ so.erro = foraPrazo; render(); return; }
  if(!socioTurmaIndicada(so.config, so.unidade, al.turma && al.turma.id)){ so.erro = 'A sua turma não foi indicada para responder neste período.'; render(); return; }
  if(qs.some(q=>!so.respostas[q.id] || !(so.menos||{})[q.id]) || so.auto===null){ so.erro = 'Responda todas as situações (a atitude que mais e a que menos se parece com você) e todas as frases da autoavaliação.'; render(); return; }
  if(!confirm('Enviar suas respostas? Depois de enviar, não é possível alterar.')) return;
  so.erro = ''; so.saving = true; render();
  const calc = socioCalc(so.serie, so.respostas, so.auto, so.menos);
  const doc = { studentId: al.matriculaStudentId, studentName: al.name, turmaId: al.turma.id, turmaName: al.turma.name, serie: so.serie, unidade: so.unidade,
    respostas: {...so.respostas}, menos: {...so.menos}, autoItens: {...so.autoItens}, auto: so.auto, alerta: socioAlertaPadrao(so.respostas, so.auto, so.iniciouEm, so.menos), comp1: calc.comp1, comp2: calc.comp2, notaAuto: calc.auto, total: calc.total, createdAt: Date.now() };
  try{
    await window.storage.set(`socio:${doc.studentId}:${slugifyName(doc.unidade)}`, JSON.stringify(doc), true);
    so.docs = so.docs.filter(d=>d.unidade!==doc.unidade).concat(doc);
    so.respostas = {}; so.menos = {}; so.autoItens = {}; so.auto = null;
  }catch(e){ so.erro = 'Não foi possível enviar agora. Tente de novo.'; }
  so.saving = false; render();
}
async function salvarSocioSubstitui(unidade, on, campo){
  const s = socioCoordState();
  const cfg = await getSocioConfig();
  campo = campo || 'substituiAuto';
  cfg[campo] = cfg[campo] || {};
  cfg[campo][unidade] = !!on;
  try{ await window.storage.set('socio-config', JSON.stringify(cfg), true); s.config = cfg; }
  catch(e){ alert('Não foi possível salvar a configuração agora.'); }
  render();
}
async function salvarSocioPrazo(unidade, inicio, fim, abrirAgora){
  const s = socioCoordState();
  if(inicio && fim && fim <= inicio){ alert('O fim do prazo precisa ser depois do início.'); return; }
  if(fim && fim < Date.now()){ alert('O fim do prazo já passou. Escolha uma data futura.'); return; }
  const cfg = await getSocioConfig();
  cfg.prazos = cfg.prazos || {};
  if(inicio || fim) cfg.prazos[unidade] = { inicio: inicio||null, fim: fim||null }; else delete cfg.prazos[unidade];
  if(abrirAgora){ cfg.abertas = cfg.abertas || {}; cfg.abertas[unidade] = true; }
  try{ await window.storage.set('socio-config', JSON.stringify(cfg), true); s.config = cfg; if(s.prazoDraft) delete s.prazoDraft[unidade]; }
  catch(e){ alert('Não foi possível salvar o prazo agora.'); }
  render();
}
async function salvarSocioTurmas(unidade, ids){
  const s = socioCoordState();
  const cfg = await getSocioConfig();
  cfg.turmas = cfg.turmas || {};
  if(ids===null) delete cfg.turmas[unidade]; else cfg.turmas[unidade] = ids;
  try{ await window.storage.set('socio-config', JSON.stringify(cfg), true); s.config = cfg; if(s.turmasDraft) delete s.turmasDraft[unidade]; }
  catch(e){ alert('Não foi possível salvar as turmas agora.'); }
  render();
}
function socioTurmasSelecionadas(s){
  const d = (s.turmasDraft||{})[s.unidade];
  if(d===null) return null;
  if(Array.isArray(d)) return d;
  const l = ((s.config||{}).turmas||{})[s.unidade];
  return Array.isArray(l) ? l : null;   // null = todas
}
function paraInputLocal(ts){
  if(!ts) return '';
  const d = new Date(ts), p = n => String(n).padStart(2,'0');
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());
}
function socioCoordState(){
  const c = state.coordenador;
  if(!c.socio) c.socio = { loaded:false, loading:false, docs:[], unidade:UNIDADES[0], turmaId:'', verKey:'', turmasCarregadas:false, config:{} };
  return c.socio;
}
async function loadSocioCoord(){
  const s = socioCoordState();
  s.loading = true; render();
  try{
    const list = await window.storage.list('socio:', true);
    const docs = await Promise.all((list.keys||[]).map(async k => { try{ const r = await window.storage.get(k, true); const d = JSON.parse(r.value); d._key = k; return d; }catch(e){ return null; } }));
    s.docs = docs.filter(Boolean);
  }catch(e){ s.docs = []; }
  s.config = await getSocioConfig();
  s.loaded = true; s.loading = false; render();
}
function renderCoordSocio(){
  const s = socioCoordState();
  if(!s.turmasCarregadas){ s.turmasCarregadas = true; loadTurmas().then(()=>render()); }
  if(!s.loaded && !s.loading){ loadSocioCoord(); }
  if(s.loading || !s.loaded) return `<div class="card"><h2>💛 Avaliação Socioemocional</h2><div class="spinner"></div></div>`;
  const turmas = state.professor.turmas;
  const turma = turmas.find(t=>t.id===s.turmaId);
  let corpo = '';
  if(s.verKey){
    const d = s.docs.find(x=>x._key===s.verKey);
    if(d) return `<div class="card"><button class="btn btn-ghost btn-sm" data-action="socio-coord-voltar">← Voltar à turma</button></div>${renderSocioRelatorio(d, true)}`;
  }
  if(turma){
    const porAluno = turma.students.map(st => ({ st, d: s.docs.find(x=>x.studentId===st.id && x.unidade===s.unidade) }));
    const feitos = porAluno.filter(x=>x.d);
    const media = k => feitos.length ? feitos.reduce((a,x)=>a+x.d[k],0)/feitos.length : 0;
    corpo = `
      <div class="row" style="gap:10px; flex-wrap:wrap; margin-top:12px;">
        <span class="pill">Responderam: ${feitos.length} de ${turma.students.length}</span>
        ${feitos.length ? `<span class="pill">Média da turma: ${fmtNota(media('total'))}</span><span class="pill">Comp. 1: ${fmtNota(media('comp1'))}/4</span><span class="pill">Comp. 2: ${fmtNota(media('comp2'))}/4</span><span class="pill">Auto: ${fmtNota(media('notaAuto'))}/2</span>` : ''}
        <button class="btn btn-ghost btn-sm" data-action="socio-coord-export" style="flex:0 0 auto;">📥 Exportar Excel</button>
      </div>
      <div style="overflow-x:auto; margin-top:10px;"><table>
        <tr><th>Aluno</th><th>Comp. 1</th><th>Comp. 2</th><th>Auto</th><th>Nota</th><th></th></tr>
        ${porAluno.map(({st,d}) => d ? `
          <tr><td>${esc(st.name)}${d.alerta?` <span title="${esc(d.alerta)}" style="cursor:help;">⚠️</span>`:''}</td><td>${fmtNota(d.comp1)}</td><td>${fmtNota(d.comp2)}</td><td>${fmtNota(d.notaAuto)}</td><td><strong>${fmtNota(d.total)}</strong></td>
          <td><button class="btn btn-ghost btn-sm" data-action="socio-coord-ver" data-key="${esc(d._key)}">Relatório</button>
          <button class="btn btn-ghost btn-sm" data-action="socio-coord-liberar" data-key="${esc(d._key)}" title="Apaga a resposta para o aluno refazer">Refazer</button></td></tr>
        ` : `<tr><td>${esc(st.name)}</td><td colspan="4" class="muted">ainda não respondeu</td><td></td></tr>`).join('')}
      </table></div>`;
  }
  return `
    <div class="card">
      <h2>💛 Avaliação Socioemocional</h2>
      <p class="muted">Os alunos respondem na aba "Avaliação Socioemocional" do painel deles e recebem o relatório na hora. Aqui você acompanha por turma e período. Os dados são sensíveis: use apenas para acolhimento e acompanhamento pedagógico.</p>
      <div class="card" style="background:var(--paper-soft, transparent); margin:10px 0;">
        <label style="display:flex; align-items:flex-start; gap:8px; text-transform:none; font-weight:400; margin:0 0 12px;">
          <input type="checkbox" data-action="socio-coord-abre" ${(s.config.abertas||{})[s.unidade]?'checked':''} style="width:auto; margin-top:4px;">
          <span><strong>Abrir para os alunos (${esc(s.unidade)})</strong><br><span class="muted" style="font-size:.85rem;">Ligado, aparece um aviso <strong>URGENTE</strong> no Início do painel de cada aluno que ainda não respondeu, com o botão "Responder agora". O aviso some sozinho quando o aluno envia.</span></span>
        </label>
        ${(() => {
          const sel = socioTurmasSelecionadas(s);
          const todas = sel===null;
          const salvas = ((s.config||{}).turmas||{})[s.unidade];
          const grupos = [...turmas].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR',{numeric:true}));
          const resumo = Array.isArray(salvas) ? (salvas.length ? salvas.length+' turma(s) indicada(s)' : 'nenhuma turma indicada') : 'todas as turmas';
          return `<div style="border-bottom:1px dashed var(--paper-line); margin:0 0 12px; padding-bottom:12px;">
            <strong>🏫 Quais turmas devem fazer (${esc(s.unidade)})</strong>
            <p class="muted" style="font-size:.85rem; margin:4px 0 8px;">Hoje: <strong>${resumo}</strong>. O aviso URGENTE só aparece para os alunos das turmas indicadas. A aba "Avaliação Socioemocional" continua disponível no menu de todos.</p>
            <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:400; margin:0 0 6px;">
              <input type="radio" name="socio-turmas-modo" data-action="socio-turmas-modo" data-modo="todas" ${todas?'checked':''} style="width:auto;"> Todas as turmas
            </label>
            <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:400; margin:0 0 6px;">
              <input type="radio" name="socio-turmas-modo" data-action="socio-turmas-modo" data-modo="algumas" ${!todas?'checked':''} style="width:auto;"> Só as turmas marcadas
            </label>
            ${!todas ? `
              <div class="row" style="gap:6px 14px; flex-wrap:wrap; margin:8px 0;">
                ${grupos.map(t => `<label style="display:flex; align-items:center; gap:6px; text-transform:none; font-weight:400; flex:0 0 auto;"><input type="checkbox" data-action="socio-turma-chk" data-id="${esc(t.id)}" ${sel.includes(t.id)?'checked':''} style="width:auto;"> ${esc(t.name)}</label>`).join('') || '<span class="muted">Nenhuma turma cadastrada.</span>'}
              </div>
              <div class="row" style="gap:6px; flex-wrap:wrap;">
                <button class="btn btn-ghost btn-sm" data-action="socio-turmas-todas-marcar">Marcar todas</button>
                <button class="btn btn-ghost btn-sm" data-action="socio-turmas-limpar">Limpar</button>
              </div>` : ''}
            <button class="btn btn-primary btn-sm" data-action="socio-turmas-salvar" style="margin-top:8px;">Salvar turmas</button>
          </div>`; })()}
        ${(() => {
          const cfg = s.config||{}, j = socioJanela(cfg, s.unidade);
          const dr = (s.prazoDraft||{})[s.unidade] || {};
          const ini = dr.inicio!==undefined ? dr.inicio : paraInputLocal(j.inicio);
          const fim = dr.fim!==undefined ? dr.fim : paraInputLocal(j.fim);
          const aberta = (cfg.abertas||{})[s.unidade];
          const motivo = socioForaDoPrazo(cfg, s.unidade);
          const status = !aberta ? '🔒 Fechada para os alunos.' : motivo ? '⏸️ '+motivo : (j.fim ? '✅ Aberta — recebe respostas até '+fmtSocioData(j.fim)+'.' : '✅ Aberta, sem data para fechar.');
          return `<div style="border-top:1px dashed var(--paper-line); margin:0 0 12px; padding-top:12px;">
            <strong>⏰ Tempo disponível para resposta (${esc(s.unidade)})</strong>
            <p class="muted" style="font-size:.85rem; margin:4px 0 8px;">${status} Deixe em branco para não limitar. O prazo só vale com "Abrir para os alunos" ligado; depois que termina, o aluno não consegue mais responder e o aviso URGENTE some.</p>
            <div class="row" style="gap:10px; flex-wrap:wrap;">
              <div><label>Abre em (opcional)</label><input type="datetime-local" id="socio-prazo-inicio" value="${esc(ini)}"></div>
              <div><label>Fecha em</label><input type="datetime-local" id="socio-prazo-fim" value="${esc(fim)}"></div>
            </div>
            <div class="row" style="gap:6px; flex-wrap:wrap; margin-top:8px;">
              <button class="btn btn-primary btn-sm" data-action="socio-prazo-salvar">Salvar prazo</button>
              <button class="btn btn-ghost btn-sm" data-action="socio-prazo-rapido" data-horas="24">Abrir agora por 1 dia</button>
              <button class="btn btn-ghost btn-sm" data-action="socio-prazo-rapido" data-horas="72">por 3 dias</button>
              <button class="btn btn-ghost btn-sm" data-action="socio-prazo-rapido" data-horas="168">por 7 dias</button>
              <button class="btn btn-ghost btn-sm" data-action="socio-prazo-limpar">Remover prazo</button>
            </div>
          </div>`; })()}
        <label style="display:flex; align-items:flex-start; gap:8px; text-transform:none; font-weight:400; margin:0;">
          <input type="checkbox" data-action="socio-coord-substitui" ${(s.config.substituiAuto||{})[s.unidade]?'checked':''} style="width:auto; margin-top:4px;">
          <span><strong>Usar a nota socioemocional no lugar da autoavaliação (${esc(s.unidade)})</strong><br><span class="muted" style="font-size:.85rem;">Desligado, a autoavaliação nas notas finais continua sendo calculada por engajamento (fichas, logins e exercícios), como sempre foi. Ligado, ela passa a vir da nota desta avaliação (nota ÷ 10 × peso da autoavaliação), e <strong>quem ainda não respondeu fica com a autoavaliação zerada</strong> até responder (a nota é recalculada assim que ele enviar). Antes de ligar, confira o prazo e se todas as turmas já tiveram tempo de responder. A opção vale só para o período selecionado.</span></span>
        </label>
      </div>
      <div class="row" style="gap:10px; flex-wrap:wrap;">
        <div><label>Período</label><select data-action="socio-coord-unidade">${UNIDADES.map(u=>`<option value="${esc(u)}" ${u===s.unidade?'selected':''}>${esc(u)}</option>`).join('')}</select></div>
        <div><label>Turma</label><select data-action="socio-coord-turma"><option value="">Selecione...</option>${turmas.map(t=>`<option value="${t.id}" ${t.id===s.turmaId?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>
      </div>
      ${corpo}
    </div>`;
}
async function liberarSocioRefazer(key){
  const s = socioCoordState();
  const d = s.docs.find(x=>x._key===key); if(!d) return;
  if(!confirm(`Apagar a resposta de ${d.studentName} (${d.unidade}) para que ele(a) possa refazer?`)) return;
  try{ await window.storage.delete(key, true); s.docs = s.docs.filter(x=>x._key!==key); }catch(e){ alert('Não foi possível apagar agora.'); }
  render();
}
function exportarSocioExcel(){
  const s = socioCoordState();
  const turma = state.professor.turmas.find(t=>t.id===s.turmaId); if(!turma) return;
  const header = ['Aluno','Turma','Período','Competência 1 (máx 4)','Competência 2 (máx 4)','Autoavaliação (máx 2)','Nota (0-10)'];
  const rows = turma.students.map(st => { const d = s.docs.find(x=>x.studentId===st.id && x.unidade===s.unidade); return d ? [st.name, turma.name, s.unidade, d.comp1, d.comp2, d.notaAuto, d.total] : [st.name, turma.name, s.unidade, '', '', '', '']; });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Socioemocional');
  XLSX.writeFile(wb, `socioemocional-${turma.name.replace(/[^a-z0-9]+/gi,'-')}-${s.unidade.replace(/\s+/g,'-')}.xlsx`);
}
__parteOk('socio');
