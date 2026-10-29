const $ = (selector) => document.querySelector(selector);
const storageKey = 'candidatura.profile.v1';
const emptyProfile = () => ({ name: '', role: '', email: '', resume: '', remember: false });
const emptyJob = () => ({ title: '', company: '', url: '', description: '' });
const state = { step: 0, reached: 0, demo: false, profile: emptyProfile(), job: emptyJob(), answers: ['', ''], output: null, tab: 'resume' };
let previousDraft = null;
let toastTimer;
const labels = ['Seu perfil', 'A vaga', 'Seu contexto', 'Seus materiais'];
const sections = ['01 / SEU PONTO DE PARTIDA', '02 / A OPORTUNIDADE', '03 / ALÉM DO CURRÍCULO', '04 / SUA CANDIDATURA'];
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const exampleProfile = {
  name: 'Marina Costa', role: 'Assistente administrativa', email: 'marina@example.com', remember: false,
  resume: 'Marina Costa\nAssistente administrativa\n\nEXPERIÊNCIA PROFISSIONAL\nAssistente administrativa · Empresa Horizonte · 2022–2025\nOrganização e digitalização de documentos administrativos.\nAtendimento a clientes por telefone e e-mail.\nControle de despesas e atualização de planilhas em Excel.\nApoio à organização da agenda e às rotinas do escritório.\n\nFORMAÇÃO\nTécnico em Administração · 2021\n\nCOMPETÊNCIAS\nExcel, organização de documentos e atendimento ao cliente.'
};
const exampleJob = {
  title: 'Assistente administrativo', company: 'Empresa Exemplo', url: '',
  description: 'Buscamos uma pessoa para apoiar as rotinas administrativas da Empresa Exemplo.\n\nRequisitos:\n• Organização e controle de documentos.\n• Atendimento a clientes por telefone e e-mail.\n• Excel intermediário e elaboração de relatórios mensais.\n• Formação técnica em Administração.\n\nDesejável: experiência com sistema ERP.'
};
const referenceJob = {
  title: 'Desenvolvedor Fullstack – Especialista em C# (.Net) e Angular',
  company: 'LUZA Group', url: 'https://www.linkedin.com/jobs/view/4481491128/',
  description: 'Desenvolvimento de software e APIs em C# 9.0, com backend em microsserviços e frontend em Angular.\n\nRequisitos informados no anúncio:\n• C# 8.0 ou superior, nível pleno ou sênior.\n• Angular 20.0 ou superior, nível pleno ou sênior.\n• Pelo menos 4 anos de experiência com C# e Angular.\n• Design Patterns, MVC, Clean Architecture, Clean Code e injeção de dependência.\n• Utilização e gestão de APIs, nível pleno.\n• Responsabilidade com horários e facilidade para trabalhar em equipe.\n\nCondições:\n• Trabalho 100% presencial na Chácara Santo Antônio, Zona Sul de São Paulo, próximo ao Shopping Morumbi.\n• Contratação PJ e horário flexível.\n• Preferência por residência próxima da Zona Sul de São Paulo.\n• Benefícios anunciados: Wellhub, OnHappy e Sesc.\n\nResumo da página consultada em 29/10/2026. Confirme os detalhes no anúncio original.'
};
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && saved.remember === true) {
    for (const key of ['name', 'role', 'email', 'resume']) {
      if (typeof saved[key] === 'string') state.profile[key] = saved[key].slice(0, key === 'resume' ? 20000 : 160);
    }
    state.profile.remember = true;
  }
} catch { /* O fluxo continua quando o armazenamento do navegador não está disponível. */ }

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
}

function persistProfile() {
  if (state.demo) return;
  try {
    if (state.profile.remember) localStorage.setItem(storageKey, JSON.stringify(state.profile));
    else localStorage.removeItem(storageKey);
  } catch { toast('Não foi possível salvar neste navegador. Seu perfil continua disponível nesta sessão.'); }
  updateStorageStatus();
}

function updateStorageStatus() {
  $('#storage-status').textContent = state.demo
    ? 'Você está explorando dados fictícios. Seu rascunho pessoal é preservado ao sair do exemplo.'
    : state.profile.remember
      ? 'Você autorizou salvar seu perfil neste navegador. Use “Limpar meus dados” para apagá-lo.'
      : 'Seus dados ficam nesta sessão. Você escolhe se quer salvá-los neste navegador.';
}

function field(id, label, value, placeholder, { optional = false, type = 'text', maxlength = 160 } = {}) {
  return `<label class="field" for="${id}"><span class="field-label">${label}${optional ? '<span class="optional">Opcional</span>' : ''}</span><input id="${id}" name="${id}" type="${type}" value="${escapeHTML(value)}" placeholder="${placeholder}" maxlength="${maxlength}" ${type === 'url' ? 'inputmode="url" autocapitalize="off" spellcheck="false"' : ''} ${optional ? '' : 'required'}></label>`;
}

function render() {
  $('#steps').innerHTML = labels.map((label, i) => `<button class="step ${i === state.step ? 'current' : i < state.step ? 'complete' : ''}" data-step="${i}" ${i === state.step ? 'aria-current="step"' : ''} ${i > state.reached ? 'aria-disabled="true"' : ''}><span class="step-number" aria-hidden="true">${i < state.step ? '✓' : String(i + 1).padStart(2, '0')}</span><span>${label}</span>${i < 3 ? '<span class="step-arrow" aria-hidden="true">›</span>' : ''}</button>`).join('');
  $('#section-label').textContent = sections[state.step];
  $('#step-count').textContent = `${state.step + 1} de 4`;
  $('#demo-banner').hidden = !state.demo;
  $('#example').textContent = state.demo ? '↗ Reiniciar exemplo' : '▷ Explorar exemplo';
  $('#stage').innerHTML = [profileView, jobView, questionsView, outputView][state.step]();
  if (state.step === 1 && !state.demo) {
    const reference = document.createElement('div');
    reference.className = 'reference-job';
    reference.innerHTML = `<div><span class="section-label">VAGA REAL DE REFERÊNCIA</span><strong>${escapeHTML(referenceJob.title)}</strong><p>LUZA Group · São Paulo · PJ · Presencial</p><small>Resumo conferido em 29/10/2026. Preenche os campos com esta referência; não faz uma nova consulta ao LinkedIn.</small><a href="${referenceJob.url}" target="_blank" rel="noopener noreferrer">Conferir anúncio no LinkedIn ↗</a></div><button class="button secondary" type="button" id="use-reference-job">Usar esta vaga</button>`;
    $('#job-form').prepend(reference);
  }
  bindStage();
  updateStorageStatus();
}

function go(step) {
  if (state.step === 0 && step > 0) {
    if (!$('#profile-form').reportValidity()) return;
    persistProfile();
  }
  state.step = step;
  state.reached = Math.max(step, state.reached);
  render();
  $('#stage-title').focus({ preventScroll: true });
  if (innerWidth < 641) $('#steps').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function profileView() {
  return `<h2 id="stage-title" tabindex="-1">Comece pela sua história.</h2><p class="description">Traga seu currículo atual. Ele será a base de cada candidatura, com as experiências que você realmente tem.</p><form id="profile-form"><div class="two-fields">${field('name', 'Seu nome', state.profile.name, 'Como você se chama?')}${field('role', 'Área ou cargo atual', state.profile.role, 'Ex.: Analista administrativo', { optional: true })}</div>${field('email', 'E-mail de contato', state.profile.email, 'voce@exemplo.com', { optional: true, type: 'email' })}<div class="field"><div class="input-top"><label class="field-label" for="resume">Seu currículo atual</label><label class="file-button">Importar .txt<input type="file" id="resume-file" accept=".txt,text/plain" aria-label="Importar currículo em texto"></label></div><textarea id="resume" name="resume" placeholder="Cole seu currículo aqui. Inclua experiências, formação, habilidades e projetos relevantes…" required minlength="80" maxlength="20000">${escapeHTML(state.profile.resume)}</textarea><div class="field-note"><span>Tem um PDF? Copie o texto e cole aqui nesta primeira versão.</span><span id="resume-count">${state.profile.resume.length.toLocaleString('pt-BR')} / 20.000</span></div></div><label class="checkbox-label" for="remember"><input id="remember" type="checkbox" ${state.profile.remember ? 'checked' : ''} ${state.demo ? 'disabled' : ''}><span>Salvar meu perfil neste navegador para as próximas candidaturas. Evite marcar em computadores compartilhados.</span></label><div class="actions"><span class="hint">Seu currículo é o ponto de partida.</span><button class="button primary" type="submit">Continuar para a vaga <span aria-hidden="true">→</span></button></div></form>`;
}

function jobView() {
  return `<h2 id="stage-title" tabindex="-1">Qual é a oportunidade?</h2><p class="description">Informe a vaga para entender o que merece destaque na sua experiência.</p><form id="job-form"><div class="two-fields">${field('title', 'Cargo da vaga', state.job.title, 'Ex.: Assistente administrativo')}${field('company', 'Empresa', state.job.company, 'Nome da empresa', { optional: true })}</div>${field('url', 'Link da vaga', state.job.url, 'https://www.linkedin.com/jobs/view/…', { optional: true, type: 'url', maxlength: 2000 })}<label class="field" for="description"><span class="field-label">Descrição da vaga</span><textarea id="description" name="description" placeholder="Cole a descrição completa, incluindo responsabilidades e requisitos…" required minlength="60" maxlength="15000">${escapeHTML(state.job.description)}</textarea><span class="hint">Nesta versão, o link fica como referência. Cole também a descrição para continuar.</span></label><div class="analysis-box"><h3>O que procuramos aqui</h3>Requisitos da vaga, evidências no seu perfil e informações que vale a pena complementar. Sem transformar uma palavra-chave em uma experiência que você não tem.</div><div id="generation-message" role="status"></div><div class="actions"><button class="back" type="button" data-back>← Seu perfil</button><button class="button primary" type="submit">${state.demo ? 'Ver análise do exemplo' : 'Continuar'} <span aria-hidden="true">→</span></button></div></form>`;
}

function questionsView() {
  return `<h2 id="stage-title" tabindex="-1">Tem algo mais na sua história?</h2><p class="description">Neste exemplo, dois requisitos precisam de contexto. Você pode confirmar uma experiência ou indicar que ainda não a tem.</p><div class="analysis-box"><h3>Leitura ilustrativa da vaga</h3><div class="requirement">Organização de documentos <span class="good">✓ Presente no perfil</span></div><div class="requirement">Atendimento ao cliente <span class="good">✓ Presente no perfil</span></div><div class="requirement">Formação técnica em Administração <span class="good">✓ Presente no perfil</span></div><div class="requirement">Excel intermediário e relatórios <span class="unknown">○ Confirmar contexto</span></div><div class="requirement">Sistema ERP · desejável <span class="unknown">○ Não informado</span></div></div><form id="questions-form"><div class="question"><label class="field" for="answer-0"><span class="question-title">01. Você já elaborou relatórios usando Excel?</span><span class="hint">Descreva o que fez e quais recursos utilizou. Não é necessário inventar números ou resultados.</span><textarea id="answer-0" maxlength="1500" placeholder="Ex.: Organizava os registros e preparava o relatório mensal…">${escapeHTML(state.answers[0])}</textarea></label><button class="text-button" type="button" data-skip="0">Ainda não tive essa experiência</button></div><div class="question"><label class="field" for="answer-1"><span class="question-title">02. Já trabalhou com algum sistema ERP?</span><span class="hint">Se sim, diga qual e o que você fazia nele. A vaga trata isso como desejável.</span><textarea id="answer-1" maxlength="1500" placeholder="Nome do sistema e atividades que você executava…">${escapeHTML(state.answers[1])}</textarea></label><button class="text-button" type="button" data-skip="1">Ainda não tive essa experiência</button></div><p class="hint">Você pode deixar respostas em branco. Uma informação ausente continuará como não confirmada.</p><div class="actions"><button class="back" type="button" data-back>← A vaga</button><button class="button primary" type="submit">Revisar os materiais <span aria-hidden="true">→</span></button></div></form>`;
}

function makeExampleOutput() {
  const extras = state.answers.map((answer, i) => answer.trim() && !answer.startsWith('Ainda não') ? `${i === 0 ? 'Relatórios e Excel' : 'Sistema ERP'}: ${answer.trim()}` : '').filter(Boolean);
  const resume = `${state.profile.name}\n${state.profile.role}\n${state.profile.email}\n\nEXPERIÊNCIA PROFISSIONAL\nAssistente administrativa · Empresa Horizonte · 2022–2025\n• Organização e digitalização de documentos administrativos.\n• Atendimento a clientes por telefone e e-mail.\n• Controle de despesas e atualização de planilhas em Excel.\n• Apoio à organização da agenda e às rotinas do escritório.\n${extras.length ? `\nCONTEXTO COMPLEMENTAR INFORMADO\n${extras.join('\n')}\n` : ''}\nFORMAÇÃO\nTécnico em Administração · 2021\n\nCOMPETÊNCIAS\nExcel, organização de documentos e atendimento ao cliente.`;
  return {
    resume,
    message: `Olá! Tenho interesse na vaga de ${state.job.title} da ${state.job.company}. Minha experiência inclui organização de documentos, atendimento a clientes e controle de planilhas em Excel. Gostaria de compartilhar meu currículo e conhecer melhor a oportunidade. Obrigada!\n\n${state.profile.name}`,
    letter: `À equipe de recrutamento da ${state.job.company},\n\nGostaria de apresentar minha candidatura à vaga de ${state.job.title}. Sou técnica em Administração e atuei como assistente administrativa na Empresa Horizonte entre 2022 e 2025.\n\nNessa experiência, trabalhei com organização e digitalização de documentos, atendimento por telefone e e-mail, controle de despesas e atualização de planilhas em Excel. Essas atividades se relacionam às rotinas administrativas descritas na oportunidade.\n\nTenho interesse em conversar sobre como minha experiência pode contribuir com a equipe. Agradeço pela atenção e fico à disposição.\n\nAtenciosamente,\n${state.profile.name}\n${state.profile.email}`
  };
}

function outputView() {
  return `<h2 id="stage-title" tabindex="-1">Revise. Deixe com a sua voz.</h2><p class="description">Materiais do exemplo fictício. Edite os textos antes de copiar ou exportar.</p><div class="tabs" role="tablist" aria-label="Materiais da candidatura">${[['resume', 'Currículo'], ['message', 'Mensagem ao recrutador'], ['letter', 'Carta opcional']].map(([id, label]) => `<button class="tab" id="tab-${id}" role="tab" aria-selected="${state.tab === id}" aria-controls="output-panel" tabindex="${state.tab === id ? 0 : -1}" data-tab="${id}">${label}</button>`).join('')}</div><div role="tabpanel" id="output-panel" aria-labelledby="tab-${state.tab}"><label class="output-label" for="output">${state.tab === 'resume' ? 'Seu currículo · exemplo editável' : state.tab === 'message' ? 'Mensagem personalizada · exemplo editável' : 'Carta de apresentação · exemplo editável'}</label><textarea class="output-editor" id="output" maxlength="30000">${escapeHTML(state.output[state.tab])}</textarea><span class="char-count" id="output-count">${state.output[state.tab].length.toLocaleString('pt-BR')} caracteres</span><div class="print-document" hidden></div></div><div class="output-toolbar"><button class="button primary" id="copy-output">Copiar texto <span aria-hidden="true">↗</span></button><button class="button secondary" id="download-output">Baixar .txt</button><button class="button secondary" id="print-output">Imprimir / salvar PDF</button></div><p class="hint">“Salvar PDF” abre a impressão do navegador. Selecione “Salvar como PDF” como destino.</p><div class="info-box">Esta demonstração utiliza conteúdo de exemplo. Revise as informações antes de utilizar os materiais.</div><div class="actions"><button class="back" type="button" data-back>← Complementar contexto</button><button class="button secondary" id="back-to-job">Revisar vaga</button></div>`;
}

function bindFields(ids, target) {
  ids.forEach((id) => $('#' + id).addEventListener('input', (event) => {
    target[id] = event.target.value;
    state.reached = Math.min(state.reached, 1);
    state.output = null;
    if (id === 'resume') $('#resume-count').textContent = `${target[id].length.toLocaleString('pt-BR')} / 20.000`;
  }));
}

function bindStage() {
  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => go(state.step - 1)));
  if (state.step === 0) {
    bindFields(['name', 'role', 'email', 'resume'], state.profile);
    $('#remember').addEventListener('change', (event) => { state.profile.remember = event.target.checked; persistProfile(); });
    $('#profile-form').addEventListener('submit', (event) => {
      event.preventDefault();
      if (!state.profile.name.trim() || state.profile.resume.trim().length < 80) { toast('Informe seu nome e um currículo com pelo menos 80 caracteres.'); return; }
      persistProfile(); go(1);
    });
    $('#resume-file').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      if (!/\.txt$/i.test(file.name) || file.size > 100000) { toast('Selecione um arquivo .txt de até 100 KB.'); event.target.value = ''; return; }
      try {
        const text = await file.text();
        if (text.length > 20000) { toast('O currículo deve ter até 20.000 caracteres.'); return; }
        if (state.demo) { toast('Saia do exemplo para importar seu currículo pessoal.'); return; }
        state.profile.resume = text; $('#resume').value = text;
        $('#resume').dispatchEvent(new Event('input'));
        toast('Texto importado. Confira se todos os caracteres estão corretos.');
      } catch { toast('Não foi possível ler este arquivo. Tente colar o texto.'); }
    });
  }
  if (state.step === 1) {
    bindFields(['title', 'company', 'url', 'description'], state.job);
    $('#use-reference-job')?.addEventListener('click', () => {
      Object.assign(state.job, referenceJob);
      state.output = null; state.reached = 1;
      render(); $('#title').focus({ preventScroll: true });
      toast('Vaga de referência preenchida. Confira o anúncio e revise os dados.');
    });
    $('#job-form').addEventListener('submit', (event) => {
      event.preventDefault();
      if (!state.job.title.trim() || state.job.description.trim().length < 60) { toast('Informe o cargo e uma descrição com pelo menos 60 caracteres.'); return; }
      if (state.demo) {
        if (JSON.stringify(state.profile) !== JSON.stringify(exampleProfile) || JSON.stringify(state.job) !== JSON.stringify(exampleJob)) {
          $('#generation-message').innerHTML = '<div class="info-box">Este exemplo possui uma análise fixa. Reinicie o exemplo para revisar seus materiais. A análise automática de outros dados ainda não está disponível.</div>';
          return;
        }
        go(2); return;
      }
      $('#generation-message').innerHTML = '<div class="info-box"><strong>Seu rascunho está preparado.</strong><br>A análise automática ainda não está disponível nesta versão. Seu conteúdo não foi enviado a nenhum serviço. Você pode baixar o rascunho ou explorar o exemplo fictício.</div><button class="button secondary" type="button" id="save-draft">Baixar meu rascunho</button>';
      $('#save-draft').addEventListener('click', () => download('rascunho-candidatura.txt', `${state.profile.name}\n${state.profile.role}\n${state.profile.email}\n\nCURRÍCULO ORIGINAL\n${state.profile.resume}\n\nVAGA\n${state.job.title}\n${state.job.company}\n${state.job.url}\n\n${state.job.description}`));
    });
  }
  if (state.step === 2) {
    state.answers.forEach((_, i) => $('#answer-' + i).addEventListener('input', (event) => { state.answers[i] = event.target.value; state.output = null; state.reached = 2; }));
    document.querySelectorAll('[data-skip]').forEach((button) => button.addEventListener('click', () => {
      const index = Number(button.dataset.skip); state.answers[index] = 'Ainda não tive essa experiência.'; state.output = null; state.reached = 2;
      $('#answer-' + index).value = state.answers[index];
    }));
    $('#questions-form').addEventListener('submit', (event) => { event.preventDefault(); state.output = makeExampleOutput(); go(3); });
  }
  if (state.step === 3) {
    document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { state.tab = button.dataset.tab; render(); $('#tab-' + state.tab).focus(); }));
    $('.tabs').addEventListener('keydown', (event) => {
      const tabs = ['resume', 'message', 'letter']; const index = tabs.indexOf(state.tab);
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      state.tab = tabs[event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
      render(); $('#tab-' + state.tab).focus();
    });
    $('#output').addEventListener('input', (event) => { state.output[state.tab] = event.target.value; $('#output-count').textContent = `${event.target.value.length.toLocaleString('pt-BR')} caracteres`; });
    $('#copy-output').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(state.output[state.tab]); toast('Texto copiado.'); }
      catch { $('#output').focus(); $('#output').select(); toast('Texto selecionado. Use Ctrl+C ou a opção Copiar do seu dispositivo.'); }
    });
    $('#download-output').addEventListener('click', () => download(`${state.tab === 'resume' ? 'curriculo' : state.tab === 'message' ? 'mensagem-recrutador' : 'carta-apresentacao'}-exemplo.txt`, state.output[state.tab]));
    $('#print-output').addEventListener('click', () => {
      const documentView = $('.print-document'); documentView.textContent = state.output[state.tab]; documentView.hidden = false;
      window.print(); documentView.hidden = true;
    });
    $('#back-to-job').addEventListener('click', () => go(1));
  }
}

function download(filename, content) {
  const url = URL.createObjectURL(new Blob(['\ufeff', content], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Download preparado.');
}

function startExample() {
  if (!state.demo) previousDraft = structuredClone(state);
  state.demo = true; state.step = 0; state.reached = 0; state.profile = structuredClone(exampleProfile); state.job = structuredClone(exampleJob); state.answers = ['', '']; state.output = null; state.tab = 'resume';
  render(); $('#stage-title').focus({ preventScroll: true });
  toast('Exemplo fictício carregado. Seu rascunho pessoal foi preservado.');
}

$('#example').addEventListener('click', startExample);
$('#exit-example').addEventListener('click', () => {
  if (previousDraft) Object.assign(state, previousDraft);
  else Object.assign(state, { step: 0, reached: 0, demo: false, profile: emptyProfile(), job: emptyJob(), answers: ['', ''], output: null, tab: 'resume' });
  previousDraft = null; render(); toast('Você voltou ao seu rascunho pessoal.');
});
$('#steps').addEventListener('click', (event) => {
  const button = event.target.closest('[data-step]'); if (!button) return;
  const step = Number(button.dataset.step);
  if (step > state.reached) { toast('Conclua a etapa atual para continuar.'); return; }
  go(step);
});
$('#new-application').addEventListener('click', () => { if (state.step > 0) go(1); else $('#name').focus(); });
$('#profile-nav').addEventListener('click', () => go(0));
$('#clear-data').addEventListener('click', () => $('#confirm-clear').showModal());
$('#cancel-clear').addEventListener('click', () => $('#confirm-clear').close());
$('#confirm-clear-button').addEventListener('click', () => {
  try { localStorage.removeItem(storageKey); } catch { /* Limpa também a sessão quando o armazenamento está bloqueado. */ }
  previousDraft = null;
  Object.assign(state, { step: 0, reached: 0, demo: false, profile: emptyProfile(), job: emptyJob(), answers: ['', ''], output: null, tab: 'resume' });
  $('#confirm-clear').close(); render(); $('#name').focus(); toast('Seu perfil e seus rascunhos foram apagados deste navegador.');
});
render();
