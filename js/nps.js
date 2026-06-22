/* ── NPS DATA ── */
const SHEET_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTLod-I2nPflC9uP028rNrDuohmR1gy74E_XCb-A12MDWpE6NNOcwHjf4OQuQpmenY0yP9wAd3-GMQD/pub?output=csv";

var RAW_DATA = [];
var activePeriod = 'ano26';
var filters = {mes:'Todos', estrategico:'Todos', unidade:'Todas', cliente:'Todos'};

async function loadNpsData() {
  try {
    const proxy = "https://api.allorigins.win/raw?url=";
    let csv;
    try {
      const resp = await fetch(SHEET_CSV);
      csv = await resp.text();
    } catch(e) {
      const resp = await fetch(proxy + encodeURIComponent(SHEET_CSV));
      csv = await resp.text();
    }
    const rows = csv.split(/\r?\n/).filter(r => r.trim());
    RAW_DATA = rows.slice(1).map(function(row) {
      var cols = [], curr = "", inQ = false;
      for (var i = 0; i < row.length; i++) {
        var ch = row[i];
        if (ch === '"') { inQ = !inQ; }
        else if (ch === "," && !inQ) { cols.push(curr.replace(/^"|"$/g,"").trim()); curr = ""; }
        else { curr += ch; }
      }
      cols.push(curr.replace(/^"|"$/g,"").trim());
      return {
        mes: cols[6] || "",
        nota: parseInt(cols[7]) || parseInt(cols[8]) || 0,
        unidade: cols[2] || "",
        cliente: cols[4] || "",
        contrato: cols[4] || "",
        numContrato: cols[1] || "",
        classificacao: cols[11] || "",
        feedback: cols[10] || cols[12] || "",
        empresa: "Makro"
      };
    }).filter(d => d.nota > 0);
  } catch(e) {
    console.error("Erro ao carregar planilha:", e);
  }
  initNpsDashboard();
}

/* ── NPS DASHBOARD FUNCTIONS ── */
const MONTH_ORDER = {Jan:1,Fev:2,Mar:3,Abr:4,Mai:5,Jun:6,Jul:7,Ago:8,Set:9,Out:10,Nov:11,Dez:12};

function sortMonths(arr){
  return [...arr].sort((a,b)=>{
    const[mA,yA]=a.split(' '), [mB,yB]=b.split(' ');
    const fy=s=>parseInt(s)>50?1900+parseInt(s):2000+parseInt(s);
    return fy(yA)!==fy(yB)?fy(yA)-fy(yB):(MONTH_ORDER[mA]||0)-(MONTH_ORDER[mB]||0);
  });
}
function calcNPS(rows){
  const total=rows.length;
  if(!total) return {total:0,p:0,det:0,n:0,nps:0};
  const p=rows.filter(x=>x.nota>=9).length;
  const det=rows.filter(x=>x.nota<=6).length;
  return {total,p,det,n:total-p-det,nps:Math.round(((p-det)/total)*100)};
}
function npsColor(v){
  if(v>=75) return '#00A650';
  if(v>=50) return '#56C174';
  if(v>=0)  return '#FDB913';
  return '#EF4136';
}
function npsZone(v){
  if(v>=75) return {label:'Excelência',cls:'nps-zona-excelencia'};
  if(v>=50) return {label:'Qualidade', cls:'nps-zona-qualidade'};
  if(v>=0)  return {label:'Aperfeiçoamento',cls:'nps-zona-aperfeicoamento'};
  return {label:'Crítico',cls:'nps-zona-critica'};
}
function getCategory(d){
  var s=(d.classificacao||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
  if(s==='WIND') return 'Wind';
  if(['PETRORECONCAVO','PETRO','POTIGUAR'].includes(s)) return 'Petroreconcavo';
  if(s==='VALE') return 'Vale';
  if(s==='ARCELORMITTAL') return 'ArcelorMittal';
  return 'Outros';
}

function populateFilters(){
  if (!RAW_DATA.length) return;
  var allMonths = sortMonths([...new Set(RAW_DATA.map(d=>d.mes).filter(Boolean))]);
  var fMes = document.getElementById('f-mes');
  fMes.innerHTML = '<option value="Todos">Todos os Meses</option>';
  allMonths.forEach(function(m){ var o=document.createElement('option'); o.value=m; o.textContent=m; fMes.appendChild(o); });
  var allUnidades = [...new Set(RAW_DATA.map(d=>d.unidade).filter(Boolean))].sort();
  var fUn = document.getElementById('f-unidade');
  fUn.innerHTML = '<option value="Todas">Todas as Unidades</option>';
  allUnidades.forEach(function(u){ var o=document.createElement('option'); o.value=u; o.textContent=u; fUn.appendChild(o); });
  var allClientes = [...new Set(RAW_DATA.map(d=>d.cliente).filter(Boolean))].sort();
  var fCl = document.getElementById('f-cliente');
  fCl.innerHTML = '<option value="Todos">Todos os Clientes</option>';
  allClientes.forEach(function(c){ var o=document.createElement('option'); o.value=c; o.textContent=c; fCl.appendChild(o); });
}

function getFilteredData(){
  return RAW_DATA.filter(function(d){
    if(activePeriod==='3m'){
      var allM=sortMonths([...new Set(RAW_DATA.map(function(x){return x.mes}).filter(Boolean))]);
      var last3=allM.slice(-3);
      if(!last3.includes(d.mes)) return false;
    } else if(activePeriod==='ano26'){
      if(!d.mes.endsWith('26')) return false;
    }
    if(filters.mes!=='Todos' && d.mes!==filters.mes) return false;
    if(filters.estrategico!=='Todos' && getCategory(d)!==filters.estrategico) return false;
    if(filters.unidade!=='Todas' && d.unidade!==filters.unidade) return false;
    if(filters.cliente!=='Todos' && d.cliente!==filters.cliente) return false;
    return true;
  });
}

function renderHero(data){
  var s=calcNPS(data);
  var z=npsZone(s.nps);
  var col=npsColor(s.nps);
  document.getElementById('heroScore').textContent = data.length?s.nps:'—';
  document.getElementById('gaugeScore').textContent = data.length?s.nps:'—';
  var zoneEl=document.getElementById('heroZone');
  zoneEl.textContent=z.label;
  zoneEl.className='nps-score-hero-zone '+z.cls;
  zoneEl.style.color=col;
  zoneEl.style.borderColor=col+'55';
  var angle = data.length ? (s.nps/100)*90 : -90;
  document.getElementById('gaugeNeedle').style.transform='rotate('+angle+'deg)';
  document.getElementById('heroScore').style.color=col;
  document.getElementById('kpiP').textContent = data.length?s.p:'—';
  document.getElementById('kpiN').textContent = data.length?s.n:'—';
  document.getElementById('kpiD').textContent = data.length?s.det:'—';
  var pp=data.length?((s.p/s.total)*100).toFixed(1):0;
  var np=data.length?((s.n/s.total)*100).toFixed(1):0;
  var dp=data.length?((s.det/s.total)*100).toFixed(1):0;
  document.getElementById('kpiPBadge').textContent = data.length?pp+'% do total':'';
  document.getElementById('kpiNBadge').textContent = data.length?np+'% do total':'';
  document.getElementById('kpiDBadge').textContent = data.length?dp+'% do total':'';
  document.getElementById('dSegP').style.width=pp+'%';
  document.getElementById('dSegN').style.width=np+'%';
  document.getElementById('dSegD').style.width=dp+'%';
  document.getElementById('dValP').textContent=data.length?s.p:'—';
  document.getElementById('dValN').textContent=data.length?s.n:'—';
  document.getElementById('dValD').textContent=data.length?s.det:'—';
  document.getElementById('dPctP').textContent=data.length?pp+'%':'—';
  document.getElementById('dPctN').textContent=data.length?np+'%':'—';
  document.getElementById('dPctD').textContent=data.length?dp+'%':'—';
  document.getElementById('dTotal').textContent=data.length?s.total:'—';
  document.getElementById('heroDelta').innerHTML = data.length?'<strong>'+s.total+'</strong> avaliações no período':'Sem dados';
}

function renderDimension(data, dim, containerId){
  var keys=[...new Set(data.map(function(d){return d[dim]}).filter(Boolean))];
  var items=keys.map(function(k){return {name:k,...calcNPS(data.filter(function(d){return d[dim]===k}))}}).filter(function(x){return x.total>0}).sort(function(a,b){return b.nps-a.nps});
  var wrap=document.getElementById(containerId);
  if(!items.length){wrap.innerHTML='<p style="font-size:11px;opacity:.3;padding:10px 0;">Sem dados no período.</p>';return;}
  wrap.innerHTML=items.map(function(it){
    var col=npsColor(it.nps);
    var barW=Math.max(4,((it.nps+100)/200)*100);
    return '<div class="nps-dim-item"><div class="nps-dim-row"><span class="nps-dim-name">'+it.name+'</span><span class="nps-dim-score" style="color:'+col+'">'+it.nps+'</span></div><div class="nps-dim-bar-bg"><div class="nps-dim-bar-fill" style="width:'+barW+'%;background:'+col+'"></div></div><div class="nps-dim-meta">▲ '+it.p+' prom. &nbsp;◆ '+it.n+' neut. &nbsp;▼ '+it.det+' detr. &nbsp;Σ '+it.total+'</div></div>';
  }).join('');
}

function renderTrend(data){
  var allM=sortMonths([...new Set(data.map(function(d){return d.mes}).filter(Boolean))]);
  if(allM.length<2){document.getElementById('trendSvg').innerHTML='<text x="280" y="90" fill="rgba(255,255,255,.2)" font-size="12" text-anchor="middle" font-family="Inter">Dados insuficientes para tendência</text>';return;}
  var points=allM.map(function(m){return {mes:m,...calcNPS(data.filter(function(d){return d.mes===m}))}});
  var W=560, H=160, padL=40, padR=20, padT=20, padB=30;
  var chartW=W-padL-padR, chartH=H-padT-padB;
  var xs=points.map(function(_,i){return padL+(i/(points.length-1))*chartW});
  var ys=points.map(function(p){return padT+((100-p.nps)/200)*chartH});
  var pathD='';
  for(var i=0;i<points.length;i++){pathD+=(i===0?'M':'L')+xs[i]+','+ys[i]}
  var areaD=pathD+' L'+xs[xs.length-1]+','+(H-padB)+' L'+padL+','+(H-padB)+' Z';
  var gridLines='';
  [0,25,50,75,100].forEach(function(v){
    var y=padT+((100-v)/200)*chartH;
    gridLines+='<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/><text x="'+(padL-6)+'" y="'+(y+4)+'" fill="rgba(255,255,255,.2)" font-size="9" font-family="Inter" text-anchor="end">'+v+'</text>';
  });
  var dots='';
  points.forEach(function(p,i){
    var col=npsColor(p.nps);
    var isLast=i===points.length-1;
    dots+='<circle cx="'+xs[i]+'" cy="'+ys[i]+'" r="'+(isLast?5:3.5)+'" fill="'+(isLast?col:'#0f1525')+'" stroke="'+col+'" stroke-width="'+(isLast?0:2)+'"/>';
    if(isLast){dots+='<rect x="'+(xs[i]-20)+'" y="'+(ys[i]-26)+'" width="40" height="20" rx="6" fill="'+col+'"/><text x="'+xs[i]+'" y="'+(ys[i]-12)+'" fill="#fff" font-size="10" font-family="Inter" font-weight="700" text-anchor="middle">NPS '+p.nps+'</text><polygon points="'+(xs[i]-4)+','+(ys[i]-6)+' '+(xs[i]+4)+','+(ys[i]-6)+' '+xs[i]+','+(ys[i]-2)+'" fill="'+col+'"/>'}
  });
  var labels='';
  points.forEach(function(p,i){
    if(points.length>8 && i%2!==0 && i!==points.length-1) return;
    labels+='<text x="'+xs[i]+'" y="'+(H-padB+16)+'" fill="rgba(255,255,255,.25)" font-size="9" font-family="Inter" text-anchor="middle">'+p.mes+'</text>';
  });
  var trendColor=npsColor(points[points.length-1].nps);
  document.getElementById('trendSvg').innerHTML='<defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+trendColor+'" stop-opacity=".2"/><stop offset="100%" stop-color="'+trendColor+'" stop-opacity="0"/></linearGradient></defs>'+gridLines+'<path d="'+areaD+'" fill="url(#tg)"/><path d="'+pathD+'" fill="none" stroke="'+trendColor+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'+dots+labels;
}

function renderStrategic(data){
  var groups={ArcelorMittal:[],Vale:[],Petroreconcavo:[],Wind:[],Outros:[],Geral:data.slice()};
  data.forEach(function(d){ var c=getCategory(d); if(groups[c]) groups[c].push(d); else groups['Outros'].push(d); });
  var order=['ArcelorMittal','Vale','Petroreconcavo','Wind','Outros','Geral'];
  var items=order.map(function(k){return {name:k,...calcNPS(groups[k])}});
  document.getElementById('strategicBoard').innerHTML=items.map(function(it){
    var col=it.total?npsColor(it.nps):'rgba(255,255,255,.15)';
    var z=npsZone(it.nps);
    return '<div class="nps-strat-card"><div class="nps-strat-top-bar" style="background:'+col+'"></div><div class="nps-strat-name">'+it.name+'</div><div class="nps-strat-score" style="color:'+col+'">'+(it.total?it.nps:'—')+'</div>'+(it.total?'<span class="nps-strat-zone '+z.cls+'" style="font-size:7px">'+z.label+'</span>':'<span style="font-size:9px;opacity:.2">Sem dados</span>')+'<div class="nps-strat-bottom">'+(it.total?'<span>▲ '+it.p+'</span><span>◆ '+it.n+'</span><span>▼ '+it.det+'</span><span style="opacity:.3">Σ '+it.total+'</span>':'')+'</div></div>';
  }).join('');
}

function renderMonthly(data){
  var allM=sortMonths([...new Set(data.map(function(d){return d.mes}).filter(Boolean))]);
  var points=allM.map(function(m){return {mes:m,...calcNPS(data.filter(function(d){return d.mes===m}))}});
  document.getElementById('monthlyHist').innerHTML=points.reverse().map(function(p){
    var col=npsColor(p.nps);
    var barW=Math.max(5,((p.nps+100)/200)*100);
    return '<div class="nps-month-bar-item"><div class="nps-month-label">'+p.mes+'</div><div class="nps-month-bar-bg"><div class="nps-month-bar-fill" style="width:'+barW+'%;background:'+col+'50;"><span style="color:'+col+'">'+p.total+' resp.</span></div></div><div class="nps-month-nps" style="color:'+col+'">'+p.nps+'</div></div>';
  }).join('');
}

function renderFeedbacks(data){
  var withFeedback=data.filter(function(d){return d.feedback}).reverse().slice(0,6);
  document.getElementById('feedbacksList').innerHTML=withFeedback.map(function(d){
    var type=d.nota>=9?'p':d.nota>=7?'n':'d';
    var badgeBg=type==='p'?'rgba(0,166,80,.15)':type==='n'?'rgba(253,185,19,.15)':'rgba(239,65,54,.15)';
    var badgeColor=type==='p'?'#00A650':type==='n'?'#FDB913':'#EF4136';
    var tagCls=type==='p'?'nps-zona-excelencia':type==='n'?'nps-zona-aperfeicoamento':'nps-zona-critica';
    var tagLabel=type==='p'?'Promotor':type==='n'?'Neutro':'Detrator';
    var esc=function(s){var d=document.createElement('div');d.appendChild(document.createTextNode(s||''));return d.innerHTML};
    return '<div class="nps-feedback-item"><div class="nps-feedback-score" style="background:'+badgeBg+';color:'+badgeColor+'">'+d.nota+'</div><div class="nps-feedback-text">"'+esc(d.feedback)+'"</div><div class="nps-feedback-meta"><span>'+esc(d.cliente||'—')+'</span><span>'+esc(d.unidade||'—')+'</span><span>'+esc(d.mes)+'</span><span class="nps-feedback-tag '+tagCls+'">'+tagLabel+'</span></div></div>';
  }).join('');
}

function renderNps(){
  var data=getFilteredData();
  renderHero(data);
  renderDimension(data,'unidade','dimUnidade');
  renderDimension(data,'cliente','dimCliente');
  renderTrend(data);
  renderStrategic(data);
  renderMonthly(data);
  renderFeedbacks(data);
}

window.setPeriod = function(p, btn){
  activePeriod=p;
  document.querySelectorAll('.nps-period-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  document.getElementById('f-mes').value='Todos';
  filters.mes='Todos';
  renderNps();
};

window.applyFilters = function(){
  filters.mes = document.getElementById('f-mes').value;
  filters.estrategico = document.getElementById('f-estrategico').value;
  filters.unidade = document.getElementById('f-unidade').value;
  filters.cliente = document.getElementById('f-cliente').value;
  renderNps();
};

function initNpsDashboard() {
  populateFilters();
  renderNps();
  setTimeout(function(){renderNps();}, 300);
}
