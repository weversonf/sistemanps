/* ── GLOBAIS ── */
var currentUser = null;

/* ── UI HELPERS ── */
window.setLoading = function(btn, loading) {
  if(loading){btn._orig=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="spinner"></span> '+btn.textContent.trim();btn.classList.add('btn-loading')}
  else{btn.disabled=false;btn.innerHTML=btn._orig||btn.innerHTML;btn.classList.remove('btn-loading')}
};
window.showToast = function(msg, type) {
  var t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg;
  t.style.borderLeft=type==='error'?'3px solid var(--red)':'3px solid #00A650';
  t.className='toast show';
  clearTimeout(t._hide);
  t._hide=setTimeout(function(){t.className='toast'},3000);
};
window.openModal = function(html) {
  document.getElementById('modalContent').innerHTML=html;
  document.getElementById('modalOverlay').classList.add('open');
};
window.closeModal = function() {
  document.getElementById('modalOverlay').classList.remove('open');
};
document.addEventListener('keydown',function(e){if(e.key==='Escape') closeModal()});

/* ── LOGIN (desativado p/ bypass, reativar qdo for pro ar) ── */

window.handleLogin = async function() {
  var email=document.getElementById('loginEmail').value.trim();
  var pass=document.getElementById('loginPass').value;
  var errEl=document.getElementById('loginError');
  if(!email||!pass){errEl.textContent='Preencha email e senha';errEl.style.display='block';return;}
  try {
    var cred=await auth.signInWithEmailAndPassword(email,pass);
    var snap=await db.collection('usuarios').doc(cred.user.uid).get();
    var u=snap.exists?snap.data():{nome:cred.user.email,tipo:'user'};
    currentUser={uid:cred.user.uid,email:cred.user.email,nome:u.nome,tipo:u.tipo};
  } catch(e) {
    errEl.textContent=e.code==='auth/invalid-credential'?'Email ou senha inválidos':'Erro: '+e.message;
    errEl.style.display='block';
  }
};

window.handleLogout = async function() {
  try{await auth.signOut()}catch(e){}
  currentUser=null;
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('app').style.display='none';
  document.getElementById('loginPass').value='';
  document.getElementById('loginError').style.display='none';
};

window.openRegister = function() {
  openModal(`
    <h2>Criar Conta</h2>
    <label>Nome</label>
    <input id="regNome" placeholder="Nome completo">
    <label>Email</label>
    <input id="regEmail" type="email" placeholder="seu@email.com">
    <label>Senha</label>
    <input id="regPass" type="password" placeholder="mínimo 6 caracteres">
    <div class="modal-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-red btn-sm" onclick="handleRegister()">Criar Conta</button>
    </div>
  `);
};

window.handleRegister = async function() {
  var nome=document.getElementById('regNome').value.trim();
  var email=document.getElementById('regEmail').value.trim();
  var pass=document.getElementById('regPass').value;
  if(!nome||!email||!pass){showToast('Preencha todos os campos','error');return;}
  try {
    var cred=await auth.createUserWithEmailAndPassword(email,pass);
    var snap=await db.collection('usuarios').get();
    var isFirst=snap.empty;
    await db.collection('usuarios').doc(cred.user.uid).set({nome,email,tipo:isFirst?'admin':'user',criadoEm:new Date().toISOString()});
    closeModal();
    currentUser={uid:cred.user.uid,email,nome,tipo:isFirst?'admin':'user'};
  } catch(e){showToast('Erro: '+e.message,'error');}
};

window.handleForgotPassword = async function() {
  var email=document.getElementById('loginEmail').value.trim();
  var errEl=document.getElementById('loginError');
  if(!email){errEl.textContent='Digite seu email primeiro';errEl.style.display='block';return;}
  try {
    await auth.sendPasswordResetEmail(email);
    showToast('Email de redefinição enviado para '+email);
    errEl.style.display='none';
  } catch(e) {
    errEl.textContent=e.code==='auth/user-not-found'?'Email não cadastrado':'Erro: '+e.message;
    errEl.style.display='block';
  }
};

/* ── NAVIGATION ── */
function setActiveNav() {
  var page = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(function(n) {
    var href = n.getAttribute('data-href');
    n.classList.toggle('active', href === page);
    if (href === page) n.setAttribute('aria-current','page');
    else n.removeAttribute('aria-current');
  });
}
