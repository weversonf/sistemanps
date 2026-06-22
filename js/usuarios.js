/* ── USUÁRIOS ── */
function loadUsers() {
  db.collection('usuarios').orderBy('nome').get().then(function(snap) {
    var tbody = document.getElementById('userTbody');
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state">Nenhum usuário cadastrado.</div></td></tr>';
      return;
    }
    tbody.innerHTML = snap.docs.map(function(d) {
      var u = d.data();
      return '<tr><td><strong>'+(u.nome||'—')+'</strong></td><td>'+u.email+'</td><td><span class="badge '+(u.tipo==='admin'?'badge-admin':'badge-user')+'">'+(u.tipo==='admin'?'Admin':'Usuário')+'</span></td><td><button class="btn btn-ghost btn-xs" onclick="openEditUser(\''+d.id+'\')">Editar</button></td></tr>';
    }).join('');
  });
}

window.openAddUser = function() {
  openModal('<h2>Novo Usuário</h2><label>Nome</label><input id="userNome" placeholder="Nome completo"><label>Email</label><input id="userEmail" type="email" placeholder="email@exemplo.com"><label>Senha</label><input id="userSenha" type="password" placeholder="mínimo 6 caracteres"><label>Tipo</label><select id="userTipo"><option value="user">Usuário</option><option value="admin">Admin</option></select><div class="modal-actions"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-red btn-sm" onclick="saveUser()">Criar</button></div>');
};

window.saveUser = async function() {
  var nome = document.getElementById('userNome').value.trim();
  var email = document.getElementById('userEmail').value.trim();
  var senha = document.getElementById('userSenha').value;
  var tipo = document.getElementById('userTipo').value;
  if (!nome || !email || !senha) { showToast('Preencha todos os campos', 'error'); return; }
  try {
    var cred = await auth.createUserWithEmailAndPassword(email, senha);
    await db.collection('usuarios').doc(cred.user.uid).set({ nome, email, tipo, criadoEm: new Date().toISOString() });
    closeModal();
    loadUsers();
    showToast('Usuário criado com sucesso');
  } catch(e) { showToast('Erro: ' + e.message, 'error'); }
};

window.openEditUser = async function(id) {
  var snap = await db.collection('usuarios').doc(id).get();
  var u = snap.data();
  if (!u) return;
  openModal('<h2>Editar Usuário</h2><label>Nome</label><input id="userNome" value="'+(u.nome||'')+'"><label>Email</label><input id="userEmail" type="email" value="'+u.email+'" disabled style="opacity:0.5"><label>Tipo</label><select id="userTipo"><option value="user"'+(u.tipo==='user'?' selected':'')+'>Usuário</option><option value="admin"'+(u.tipo==='admin'?' selected':'')+'>Admin</option></select><div class="modal-actions"><button class="btn btn-ghost btn-sm" onclick="if(confirm(\'Excluir este usuário?\')){deleteUser(\''+id+'\')}" style="color:var(--red);margin-right:auto">Excluir</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-red btn-sm" onclick="updateUser(\''+id+'\')">Salvar</button></div>');
};

window.updateUser = async function(id) {
  try {
    await db.collection('usuarios').doc(id).update({ nome: document.getElementById('userNome').value.trim(), tipo: document.getElementById('userTipo').value });
    closeModal();
    loadUsers();
    showToast('Usuário atualizado');
  } catch(e) { showToast('Erro: ' + e.message, 'error'); }
};

window.deleteUser = async function(id) {
  try {
    await db.collection('usuarios').doc(id).delete();
    closeModal();
    loadUsers();
  } catch(e) { showToast('Erro ao excluir', 'error'); }
};
