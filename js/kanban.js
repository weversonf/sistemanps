/* ── KANBAN ── */
var kanbanCols = [];
var kanbanCards = [];
var kanbanUnsubCols = null;
var kanbanUnsubCards = null;
var draggedCard = null;

function loadKanban() {
  if (kanbanUnsubCols) kanbanUnsubCols();
  if (kanbanUnsubCards) kanbanUnsubCards();
  kanbanUnsubCols = db.collection('colunas').onSnapshot(function(snap) {
    kanbanCols = snap.docs.map(function(d){ return { id: d.id, ...d.data() } }).sort(function(a,b){ return (a.ordem||0) - (b.ordem||0) });
    renderKanban();
  });
  kanbanUnsubCards = db.collection('cartoes').onSnapshot(function(snap) {
    kanbanCards = snap.docs.map(function(d){ return { id: d.id, ...d.data() } });
    renderKanbanCards();
  });
}

function renderKanban() {
  var board = document.getElementById('kanbanBoard');
  if (!kanbanCols.length) { board.innerHTML = '<div class="empty-state"><i data-lucide="columns-3" style="width:40px;height:40px;opacity:0.3"></i><br>Nenhuma coluna ainda.<br><button class="btn btn-red btn-sm" style="margin-top:12px" onclick="openAddColumn()">Criar primeira coluna</button></div>'; lucide.createIcons(); return; }
  board.innerHTML = kanbanCols.map(function(col){
    return '<div class="kanban-col" data-col="'+col.id+'" ondragover="onDragOver(event)" ondrop="onDrop(event, \''+col.id+'\')"><div class="kanban-col-header">'+col.nome+'<span class="kanban-col-count" id="count-'+col.id+'">0</span></div><div class="kanban-col-body" id="colBody-'+col.id+'"></div><button class="kanban-add-card" onclick="openAddCard(\''+col.id+'\')">+ Novo cartão</button></div>';
  }).join('');
  lucide.createIcons();
}

function renderKanbanCards() {
  kanbanCols.forEach(function(col) {
    var cards = kanbanCards.filter(function(c){ return c.coluna === col.id });
    var body = document.getElementById('colBody-' + col.id);
    var count = document.getElementById('count-' + col.id);
    if (!body) return;
    if (count) count.textContent = cards.length;
    if (!cards.length) { body.innerHTML = ''; return; }
    body.innerHTML = cards.map(function(c){
      return '<div class="kanban-card" draggable="true" ondragstart="onDragStart(event, \''+c.id+'\')" ondragend="onDragEnd(event)" onclick="openEditCard(\''+c.id+'\')"><div class="kanban-card-title">'+c.titulo+'</div>'+(c.descricao?'<div class="kanban-card-desc">'+c.descricao+'</div>':'')+'<div class="kanban-card-footer"><span>'+ (c.responsavel||'') +'</span> <span style="color:var(--muted)">'+ (c.prazo||'') +'</span></div></div>';
    }).join('');
  });
}

window.onDragStart = function(e, id) {
  draggedCard = id;
  e.target.classList.add('dragging');
};
window.onDragEnd = function(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-col').forEach(function(c){ c.classList.remove('drag-over') });
};
window.onDragOver = function(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
};
window.onDrop = async function(e, colId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!draggedCard) return;
  if (kanbanCards.find(function(c){ return c.id === draggedCard })?.coluna === colId) { draggedCard = null; return; }
  try {
    await db.collection('cartoes').doc(draggedCard).update({ coluna: colId });
  } catch(err) { showToast('Erro ao mover cartão', 'error'); }
  draggedCard = null;
};

window.openAddColumn = function() {
  openModal('<h2>Nova Coluna</h2><label>Nome</label><input id="colNome" placeholder="Ex: Em Andamento"><div class="modal-actions"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-red btn-sm" onclick="saveColumn()">Criar</button></div>');
};

window.saveColumn = async function() {
  var nome = document.getElementById('colNome').value.trim();
  if (!nome) return;
  var btn=document.querySelector('.modal-actions .btn-red');
  setLoading(btn,true);
  try {
    await db.collection('colunas').add({ nome, ordem: kanbanCols.length });
    closeModal();
  } catch(e) { showToast('Erro ao criar coluna', 'error'); setLoading(btn,false); }
};

window.openAddCard = function(colId) {
  var cols = kanbanCols.map(function(c){ return '<option value="'+c.id+'"'+(c.id===colId?' selected':'')+'>'+c.nome+'</option>' }).join('');
  openModal('<h2>Nova Tarefa</h2><label>Coluna</label><select id="cardColuna">'+cols+'</select><label>Título</label><input id="cardTitulo" placeholder="Título da tarefa"><label>Descrição</label><textarea id="cardDesc" placeholder="Descrição (opcional)"></textarea><label>Prazo</label><input id="cardPrazo" type="date"><label>Responsável</label><input id="cardResp" placeholder="Nome do responsável"><div class="modal-actions"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-red btn-sm" onclick="saveCard()">Criar</button></div>');
};

window.saveCard = async function() {
  var titulo = document.getElementById('cardTitulo').value.trim();
  if (!titulo) return;
  var btn=document.querySelector('.modal-actions .btn-red');
  setLoading(btn,true);
  try {
    await db.collection('cartoes').add({ coluna: document.getElementById('cardColuna').value, titulo, descricao: document.getElementById('cardDesc').value.trim(), prazo: document.getElementById('cardPrazo').value, responsavel: document.getElementById('cardResp').value.trim(), criadoEm: new Date().toISOString() });
    closeModal();
  } catch(e) { showToast('Erro ao criar tarefa', 'error'); setLoading(btn,false); }
};

window.openEditCard = async function(id) {
  var card = kanbanCards.find(function(c){ return c.id === id });
  if (!card) return;
  var cols = kanbanCols.map(function(c){ return '<option value="'+c.id+'"'+(c.id===card.coluna?' selected':'')+'>'+c.nome+'</option>' }).join('');
  openModal('<h2>Editar Tarefa</h2><label>Coluna</label><select id="cardColuna">'+cols+'</select><label>Título</label><input id="cardTitulo" value="'+(card.titulo||'')+'"><label>Descrição</label><textarea id="cardDesc">'+(card.descricao||'')+'</textarea><label>Prazo</label><input id="cardPrazo" type="date" value="'+(card.prazo||'')+'"><label>Responsável</label><input id="cardResp" value="'+(card.responsavel||'')+'"><div class="modal-actions"><button class="btn btn-ghost btn-sm" onclick="if(confirm(\'Excluir esta tarefa?\')){deleteCard(\''+id+'\')}" style="color:var(--red);margin-right:auto">Excluir</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-red btn-sm" onclick="updateCard(\''+id+'\')">Salvar</button></div>');
};

window.updateCard = async function(id) {
  var btn=document.querySelector('.modal-actions .btn-red');
  setLoading(btn,true);
  try {
    await db.collection('cartoes').doc(id).update({ coluna: document.getElementById('cardColuna').value, titulo: document.getElementById('cardTitulo').value.trim(), descricao: document.getElementById('cardDesc').value.trim(), prazo: document.getElementById('cardPrazo').value, responsavel: document.getElementById('cardResp').value.trim() });
    closeModal();
  } catch(e) { showToast('Erro ao atualizar', 'error'); setLoading(btn,false); }
};

window.deleteCard = async function(id) {
  try {
    await db.collection('cartoes').doc(id).delete();
    closeModal();
  } catch(e) { showToast('Erro ao excluir', 'error'); }
};
