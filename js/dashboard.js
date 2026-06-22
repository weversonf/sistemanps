function renderDashboard() {
  var s = calcNPS(RAW_DATA);
  document.getElementById('dashNpsScore').textContent = RAW_DATA.length?s.nps:'—';
  document.getElementById('dashNpsTotal').textContent = RAW_DATA.length?s.total+' respostas':'— respostas';
  document.getElementById('dashDistP').style.width = RAW_DATA.length?((s.p/s.total)*100).toFixed(1)+'%':'0%';
  document.getElementById('dashDistN').style.width = RAW_DATA.length?((s.n/s.total)*100).toFixed(1)+'%':'0%';
  document.getElementById('dashDistD').style.width = RAW_DATA.length?((s.det/s.total)*100).toFixed(1)+'%':'0%';
  document.getElementById('dashPctP').textContent = RAW_DATA.length?((s.p/s.total)*100).toFixed(1)+'%':'0%';
  document.getElementById('dashPctN').textContent = RAW_DATA.length?((s.n/s.total)*100).toFixed(1)+'%':'0%';
  document.getElementById('dashPctD').textContent = RAW_DATA.length?((s.det/s.total)*100).toFixed(1)+'%':'0%';
  var tbody = document.getElementById('dashNpsTable');
  if (RAW_DATA.length) {
    tbody.innerHTML = '<table class="nps-table"><thead><tr><th>Unidade</th><th>Nota</th><th>Classificação</th><th>Feedback</th></tr></thead><tbody>'+RAW_DATA.slice(0, 20).map(function(d){
      var cl = d.nota>=9?'Promotor':d.nota>=7?'Neutro':'Detrator';
      var bc = cl==='Promotor'?'prom':cl==='Neutro'?'neut':'detr';
      return '<tr><td>'+(d.unidade||'')+'</td><td><span class="nps-badge '+bc+'">'+d.nota+'</span></td><td>'+cl+'</td><td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(d.feedback||'—')+'</td></tr>';
    }).join('')+'</tbody></table>';
  } else {
    tbody.innerHTML = '<div class="loading">Carregando NPS...</div>';
  }

  loadDashboardKanban();
}

function loadDashboardKanban() {
  db.collection('colunas').get().then(function(colSnap) {
    db.collection('cartoes').get().then(function(cardSnap) {
      var cols = colSnap.docs.map(function(d){ return { id: d.id, ...d.data() } });
      var cards = cardSnap.docs.map(function(d){ return { id: d.id, ...d.data() } });
      var abertos = cards.filter(function(c){ return c.coluna !== cols.find(function(x){ return x.id === c.coluna })?.id ? false : true });
      document.getElementById('dashAtvCount').textContent = cards.length;
      document.getElementById('dashAtvLabel').textContent = cards.length === 1 ? 'tarefa' : 'tarefas';
      var byCol = document.getElementById('dashAtvByCol');
      byCol.innerHTML = cols.map(function(col){
        var count = cards.filter(function(c){ return c.coluna === col.id }).length;
        return '<span style="background:var(--card);padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600">'+col.nome+': '+count+'</span>';
      }).join('');
    });
  });
}
