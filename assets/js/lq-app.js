(function(){
'use strict';
var R=window.React, RD=window.ReactDOM, C=window.LQCore, D=window.LQData, X=window.LQExport, T=window.LQTravel;
if(!R||!RD||!C||!D||!X||!T){ document.getElementById('root').innerHTML='<div class="fatal"><b>Dashboard konnte nicht gestartet werden.</b><p>Interne Komponenten fehlen.</p></div>'; return; }
var h=R.createElement, STORAGE='lq-dashboard-v27-events', LEGACY_STORAGE=['lq-dashboard-v26-events','lq-dashboard-v25-events'], VIEW='lq-dashboard-v27-view', VIEW_OLD='lq-dashboard-v26-view', SETTINGS='LQ_SETTINGS_V26';
var MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
function cx(){return Array.prototype.slice.call(arguments).filter(Boolean).join(' ')}
var PLAN_ID_REMAP={lel07:'lel08',lel44:'lel45',verw45:'verw46',lel11:'bw2kw11'};
function migratePlanEvents(stored){
  // Der offizielle Plan (Stand 15.09.2026) ersetzt die Termindaten des Entwurfs.
  // Persönliches bleibt erhalten: eigene Einträge (ULB-Blöcke, Verwaltungsfall,
  // selbst angelegte Termine) sowie die Dienstreiseplanung je Termin.
  var fresh=D.makeDefaultEvents(),freshIds={},travelById={};
  fresh.forEach(function(e){freshIds[e.id]=true});
  stored.forEach(function(e){
    if(!e||!e.id)return;
    var target=PLAN_ID_REMAP[e.id]||e.id;
    if(e.travel&&freshIds[target]&&!travelById[target])travelById[target]=e.travel;
  });
  var merged=fresh.map(function(e){return travelById[e.id]?Object.assign({},e,{travel:travelById[e.id]}):e});
  stored.forEach(function(e){
    if(e&&e.id&&e.statusOrigin==='manual'&&!freshIds[e.id]&&!PLAN_ID_REMAP[e.id])merged.push(e);
  });
  return merged;
}
function safeLoad(){try{
  var raw=localStorage.getItem(STORAGE);
  if(raw){var x=JSON.parse(raw);if(Array.isArray(x))return x}
  for(var i=0;i<LEGACY_STORAGE.length;i++){
    var old=localStorage.getItem(LEGACY_STORAGE[i]);
    if(old){var y=JSON.parse(old);if(Array.isArray(y))return migratePlanEvents(y)}
  }
}catch(e){}return D.makeDefaultEvents()}
function safeSave(v){try{localStorage.setItem(STORAGE,JSON.stringify(v));return true}catch(e){return false}}
function optionalQualifierIds(events){return (events||[]).filter(function(e){return e.obligation==='Optional'&&(e.relevance||'Beide')!=='Anwärter'}).map(function(e){return e.id})}
function defaultSettings(events){return{showTrainee:false,selectedOptionalIds:optionalQualifierIds(events),travelEnabled:true,travelShowDashboard:true,travelTrackExpenses:true,travelIcsDefault:true,travelPdfDefault:true}}
function safeLoadSettings(events){try{var raw=localStorage.getItem(SETTINGS);if(raw){var x=JSON.parse(raw),d=defaultSettings(events);return Object.assign(d,x,{selectedOptionalIds:Array.isArray(x.selectedOptionalIds)?x.selectedOptionalIds:d.selectedOptionalIds})}}catch(e){}return defaultSettings(events)}
function safeSaveSettings(v){try{localStorage.setItem(SETTINGS,JSON.stringify(v));return true}catch(e){return false}}
// Globale Suche nach CLAUDE.md 3.3: multitoken, tippfehler- und
// diakritikatolerant, über alle relevanten Felder, Ranking nach Relevanz.
// Reihenfolge: Zeitachsen (Gantt, Kalender, Tabelle) bleiben chronologisch,
// die Übersicht nutzt bei aktiver Suche das Relevanz-Ranking.
var SUCHFELDER=['title','location','category','obligation','sourceKW','notes','relevance'];
function sucheAktiv(q){return !!(q&&String(q).trim())}
function fuzzySuche(list,query){
  if(!sucheAktiv(query))return list;
  if(!window.bwSearch)return list;
  return window.bwSearch.search(list,query,{fields:SUCHFELDER});
}
function chronologisch(list){return list.slice().sort(function(a,b){return String(a.start||'9999').localeCompare(String(b.start||'9999'))||String(a.title||'').localeCompare(String(b.title||''),'de')})}
function markiert(text,query){
  var s=String(text==null?'':text);
  if(!sucheAktiv(query)||!window.bwSearch)return s;
  return h('span',{dangerouslySetInnerHTML:{__html:window.bwSearch.highlight(s,query)}});
}
function visibleForProfile(events,settings,search,year){var cfg=settings||defaultSettings(events),selected=new Set(cfg.selectedOptionalIds||[]),base=C.filterEvents(events,{participant:cfg.showTrainee?'all':'qualifier',status:'all',search:'',year:year||'all'});
  var eigene=base.filter(function(e){var rel=e.relevance||'Beide';if(rel==='Anwärter')return !!cfg.showTrainee;if(e.obligation==='Optional')return selected.has(e.id);return true});
  return fuzzySuche(eigene,search);}

function pad(n){return String(n).padStart(2,'0')}
function fmtDate(s){if(!s)return'noch offen';var d=C.parseDateOnly(s);return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()}
function fmtRange(e){if(!e.start||!e.end)return'noch nicht terminiert';return e.start===e.end?fmtDate(e.start):fmtDate(e.start)+' – '+fmtDate(e.end)}
function uid(){return'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function isUlbEvent(e){return e.requirementId==='ulb8'||e.category==='ULB-Abordnung'}
// Fünf fachliche Kategorien -> fünf Werte der kategorialen Reihe im Theme.
function statusClass(e){if(e.category==='Prüfung')return'exam';if(e.category==='Prüfungsvorbereitung'||e.category==='Verwaltungsfall')return'prep';if(isUlbEvent(e))return'ulb';return e.obligation==='Optional'?'optional':'mandatory'}
function statusLabel(e){if(e.category==='Prüfung')return'Prüfung';if(e.category==='Prüfungsvorbereitung')return'Vorbereitung';if(e.category==='Verwaltungsfall')return'Fallbearbeitung';if(isUlbEvent(e))return'ULB';return e.obligation==='Optional'?'Optional':e.obligation==='Offen'?'Offen':'Pflicht'}
function isProtected(e){return e.obligation==='Optional'&&e.statusOrigin==='reference'}
function roleLabel(e){return e.relevance==='Anwärter'?'Anwärter':e.relevance==='Qualifizierer'?'Qualifizierer':'Beide'}
function travelShort(e){var t=T.normalizeTravel(e.travel),st=T.travelStatus(e);if(t.required==='no')return'nicht erforderlich';if(t.required==='open')return'zu klären';if(st.planningComplete)return'vollständig geplant · '+T.transportLabel(t.transport);return'offen: '+st.missing.join(', ')}
function TravelMark(p){var t=T.normalizeTravel(p.event.travel),st=T.travelStatus(p.event);if(t.required==='no'&&!p.showNone)return null;return h('span',{className:cx('travel-mark',st.code),title:st.missing&&st.missing.length?'Offen: '+st.missing.join(', '):st.label},h('i',{className:'travel-dot'}),t.required==='open'?'Reise?':t.required==='no'?'keine Reise':st.planningComplete?'Reise geplant':'Reise offen')}
function qualifierTravelEvents(events){return C.filterEvents(events,{participant:'qualifier',status:'all'}).filter(function(e){return e.start&&e.end})}
function offeneReiseTermine(events){return qualifierTravelEvents(events).filter(function(e){var t=T.normalizeTravel(e.travel),st=T.travelStatus(e);return t.required==='open'||(t.required==='yes'&&!st.planningComplete)}).sort(function(a,b){return a.start.localeCompare(b.start)})}

function exportFilter(events,mode,current,selectedIds){
  if(mode==='qualifierAll')return C.filterEvents(events,{participant:'qualifier',status:'all'});
  if(mode==='qualifierMandatory')return C.filterEvents(events,{participant:'qualifier',status:'mandatory'});
  if(mode==='qualifierOptional')return C.filterEvents(events,{participant:'qualifier',status:'optional'});
  if(mode==='selected'){var set=new Set(selectedIds||[]);return events.filter(function(e){return set.has(e.id)&&e.start&&e.end}).sort(function(a,b){return a.start.localeCompare(b.start)})}
  var cur=current||{};
  if(Array.isArray(cur.visibleIds)){var set=new Set(cur.visibleIds);return events.filter(function(e){return set.has(e.id)}).sort(function(a,b){return String(a.start||'9999').localeCompare(String(b.start||'9999'))})}
  return C.filterEvents(events,{participant:'qualifier',status:'all',search:cur.search||'',year:cur.year||'all'});
}
function filterDateRange(events,from,to){return events.filter(function(e){if(from&&e.end<from)return false;if(to&&e.start>to)return false;return true})}
function todayDE(){var d=new Date();return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()}

function Icon(p){var paths={calendar:'M3 5h18v16H3z M7 3v4 M17 3v4 M3 9h18',timeline:'M4 7h16 M7 4v6 M4 13h16 M14 10v6 M4 19h16',table:'M4 5h16v14H4z M4 10h16 M10 5v14',compare:'M7 4v16 M4 7l3-3 3 3 M17 20V4 m-3 13 3 3 3-3',plus:'M12 5v14 M5 12h14',download:'M12 3v12 m-5-5 5 5 5-5 M5 21h14',print:'M6 9V3h12v6 M6 17h12v4H6z M4 9h16v8H4z',edit:'M4 20l4-1 10-10-3-3L5 16z M14 7l3 3',lock:'M7 11V8a5 5 0 0110 0v3 M5 11h14v10H5z',search:'M11 19a8 8 0 100-16 8 8 0 000 16zm6-2 4 4',reset:'M4 12a8 8 0 101.8-5 M4 4v6h6',chevleft:'M15 5l-7 7 7 7',chevright:'M9 5l7 7-7 7',close:'M6 6l12 12M18 6L6 18',check:'M5 12l4 4L19 6',alert:'M12 4l9 16H3z M12 9v4 M12 17h.01',building:'M4 21V8l8-5 8 5v13 M9 21v-6h6v6',briefcase:'M4 8h16v12H4z M9 8V5h6v3',menu:'M3 6h18 M3 12h18 M3 18h18',gear:'M12 8a4 4 0 100 8 4 4 0 000-8z M4 12h2 M18 12h2 M12 4v2 M12 18v2 M6.3 6.3l1.4 1.4 M16.3 16.3l1.4 1.4 M17.7 6.3l-1.4 1.4 M7.7 16.3l-1.4 1.4'};return h('svg',{viewBox:'0 0 24 24',width:p.size||18,height:p.size||18,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':'true'},h('path',{d:paths[p.name]||'M12 12h.01'}))}
function Button(p){return h('button',{type:'button',className:cx('btn',p.kind&&'btn-'+p.kind,p.className),onClick:p.onClick,disabled:p.disabled,title:p.title},p.icon&&h(Icon,{name:p.icon,size:17}),h('span',null,p.children))}
function Badge(p){return h('span',{className:cx('badge',p.kind&&'badge-'+p.kind)},p.lock&&h(Icon,{name:'lock',size:12}),p.children)}
function Kennzahl(p){return h('div',{className:cx('lq-kennzahl',p.offen&&'lq-kennzahl--offen')},h('b',null,p.value),h('span',null,p.label))}

var ANSICHTEN=[
  {id:'overview',label:'Übersicht'},
  {id:'open',label:'Offene Aufgaben'},
  {id:'gantt',label:'Gantt'},
  {id:'calendar',label:'Kalender'},
  {id:'table',label:'Termine'},
  {id:'compare',label:'Planvergleich'}
];

// In der Einzeldatei aus tools/build_singlefile.py gibt es keine relativen
// Pfade mehr; dort liefert window.BW_ASSETS die data:-URL.
function assetUrl(pfad){var m=window.BW_ASSETS||{};return m[pfad]||pfad}
// Das RPF-Logo ist lizenzrechtlich geschützt und liegt deshalb nicht in
// diesem öffentlichen Repo (assets/logo/LIZENZ.md). Fehlt die Datei, tritt
// eine reine Wortmarke an ihre Stelle — das Logo wird nie nachgebaut.
class Marke extends R.Component{
  constructor(p){super(p);this.state={bild:true};this.fehler=this.fehler.bind(this)}
  fehler(){this.setState({bild:false})}
  render(){
    var neg=this.props.negativ;
    if(this.state.bild)return h('img',{className:cx('bw-logo',neg&&'bw-logo--neg'),
      src:assetUrl(neg?'assets/logo/rpf-logo-negativ.png':'assets/logo/rpf-logo.png'),
      alt:'Regierungspräsidium Freiburg, Baden-Württemberg',onError:this.fehler});
    return h('span',{className:'lq-wortmarke'},h('b',null,'Regierungspräsidium Freiburg'),h('span',null,'Land Baden-Württemberg'));
  }
}

function Kopfnavigation(p){
  return h('header',{className:'lq-kopf'},
    h('div',{className:'bw-app bw-app--weit'},
      h('nav',{className:'bw-nav','aria-label':'Hauptnavigation'},
        h('span',{className:'bw-nav__brand'},h(Marke,null)),
        h('div',{className:'bw-nav__panel',id:'lq-hauptmenue'},
          h('ul',{className:'bw-nav__links'},ANSICHTEN.map(function(x){
            var aktiv=p.view===x.id;
            return h('li',{key:x.id},h('a',{href:'#inhalt','aria-current':aktiv?'page':null,
              onClick:function(ev){ev.preventDefault();p.onChange(x.id)}},x.label));
          }))),
        h('div',{className:'bw-nav__actions'},
          h('button',{type:'button',className:'bw-iconbtn','aria-label':'Suche fokussieren',
            onClick:function(){var el=document.getElementById('lq-suche');if(el)el.focus()}},h(Icon,{name:'search',size:22})),
          h('button',{type:'button',className:'bw-iconbtn bw-nav__toggle','data-nav-toggle':'',
            'aria-controls':'lq-hauptmenue','aria-expanded':'false','aria-label':'Menü'},h(Icon,{name:'menu',size:22}))))));
}

// Arbeitstage je Quartal. Infografik-Regeln (CLAUDE.md 3.2): Grau als Basis,
// BaWü Gelb genau einmal — für das Quartal mit der höchsten Belastung.
function quartalsDaten(events){
  var summen={},reihenfolge=[];
  (events||[]).forEach(function(e){
    if(!e.start||!e.end)return;
    var d=C.parseDateOnly(e.start),q=d.getFullYear()+'-Q'+(Math.floor(d.getMonth()/3)+1);
    if(!(q in summen)){summen[q]=0;reihenfolge.push(q)}
    var tage=(e.creditDays!==''&&e.creditDays!=null)?Number(e.creditDays):C.workingDays(e.start,e.end);
    summen[q]+=Number.isFinite(tage)?tage:0;
  });
  reihenfolge.sort();
  var max=0;reihenfolge.forEach(function(q){if(summen[q]>max)max=summen[q]});
  var markiertesQuartal=true;
  return reihenfolge.map(function(q){
    var hoch=markiertesQuartal&&summen[q]===max&&max>0;
    if(hoch)markiertesQuartal=false;   // genau EIN hervorgehobener Wert
    return{label:'Q'+q.slice(-1)+'/'+q.slice(2,4),value:summen[q],highlight:hoch};
  });
}
class Diagramm extends R.Component{
  componentDidMount(){this.zeichnen()}
  componentDidUpdate(){this.zeichnen()}
  zeichnen(){if(!window.bwChart||!this.el)return;window.bwChart.bars(this.el,this.props.daten,{titel:this.props.titel})}
  render(){var self=this;return h('div',{ref:function(n){self.el=n}})}
}
function Werkzeugleiste(p){
  return h('div',{className:'lq-werkzeugleiste'},
    h('div',{className:'bw-search'},
      h('label',{className:'bw-skip-link',htmlFor:'lq-suche'},'Termine durchsuchen'),
      h('input',{id:'lq-suche',type:'search',value:p.search,
        placeholder:'Suchen … tippfehlertolerant, alle Felder',
        onChange:function(e){p.setSearch(e.target.value)}}),
      h('button',{type:'button',onClick:function(){p.setSearch('')},disabled:!sucheAktiv(p.search),
        title:'Sucheingabe leeren'},'Leeren')),
    h('label',{className:'bw-skip-link',htmlFor:'lq-jahr'},'Jahr eingrenzen'),
    h('select',{id:'lq-jahr',className:'lq-jahr',value:p.year,onChange:function(e){p.setYear(e.target.value)}},
      h('option',{value:'all'},'Alle Jahre'),h('option',{value:'2026'},'2026'),h('option',{value:'2027'},'2027'),h('option',{value:'2028'},'2028')),
    h('span',{className:'lq-werkzeugleiste-trenner'}),
    h(Button,{icon:'plus',kind:'primary',onClick:p.onNeu},'Termin'),
    h(Button,{icon:'gear',onClick:p.openOptions},'Optionen'),
    h(Button,{icon:'download',onClick:p.onIcs},'Outlook / iCal'),
    h(Button,{icon:'print',onClick:p.onPdf},'PDF / Drucken'),
    h(Button,{icon:'download',onClick:p.onBackup},'Backup')
  );
}
class OptionsModal extends R.Component{
  constructor(p){super(p);this.state={draft:Object.assign({},p.settings,{selectedOptionalIds:(p.settings.selectedOptionalIds||[]).slice()})};this.save=this.save.bind(this)}
  set(k,v){var d=Object.assign({},this.state.draft);d[k]=v;this.setState({draft:d})}
  setOptional(id,on){var d=Object.assign({},this.state.draft),a=(d.selectedOptionalIds||[]).slice(),i=a.indexOf(id);if(on&&i<0)a.push(id);if(!on&&i>=0)a.splice(i,1);d.selectedOptionalIds=a;this.setState({draft:d})}
  allOptional(on){var d=Object.assign({},this.state.draft);d.selectedOptionalIds=on?this.props.optionalEvents.map(function(e){return e.id}):[];this.setState({draft:d})}
  save(){this.props.onSave(this.state.draft)}
  render(){var self=this,d=this.state.draft,opts=this.props.optionalEvents,sel=new Set(d.selectedOptionalIds||[]);return h('div',{className:'modal-backdrop',onMouseDown:function(e){if(e.target===e.currentTarget)self.props.onClose()}},h('div',{className:'modal settings-modal'},
    h('div',{className:'modal-head'},h('div',null,h('div',{className:'eyebrow'},'MEINE OPTIONEN'),h('h2',null,'Persönliche Dashboard-Auswahl')),h('button',{type:'button',className:'iconbtn',onClick:this.props.onClose},h(Icon,{name:'close'}))),
    h('div',{className:'settings-sections'},
      h('section',{className:'settings-card'},h('h3',null,'Mein Profil'),h('p',null,'Pflichttermine, ULB-Abordnung und Verwaltungsfall gehören immer zu deiner persönlichen Planung.'),
        h('label',{className:'setting-line'},h('input',{type:'checkbox',checked:d.showTrainee,onChange:function(e){self.set('showTrainee',e.target.checked)}}),h('span',null,h('b',null,'Anwärtertermine zusätzlich anzeigen'),h('small',null,'Nur zum Vergleich. Standardmäßig bleiben Anwärter-Laufbahnprüfungen ausgeblendet.')))),
      h('section',{className:'settings-card'},h('h3',null,'Meine optionalen Veranstaltungen'),h('p',null,'Optional bleibt fachlich optional. Hier entscheidest du nur, welche freiwilligen Bausteine in deiner persönlichen Planung erscheinen.'),
        h('div',{className:'optional-picker-head'},h('div',{className:'settings-summary'},h('span',{className:'settings-chip'},sel.size+' von '+opts.length+' ausgewählt')),h('div',{className:'optional-picker-actions'},h(Button,{onClick:function(){self.allOptional(true)}},'Alle'),h(Button,{onClick:function(){self.allOptional(false)}},'Keine'))),
        h('div',{className:'optional-list'},opts.map(function(e){return h('label',{className:'optional-choice',key:e.id},h('input',{type:'checkbox',checked:sel.has(e.id),onChange:function(x){self.setOptional(e.id,x.target.checked)}}),h('span',{className:'date'},'KW '+(e.sourceKW||C.computedKW(e))),h('span',{className:'title'},e.title),h(Badge,{kind:'optional',lock:isProtected(e)},'Optional'))}))),
      h('section',{className:'settings-card'},h('h3',null,'Dienstreisemanagement'),h('p',null,'Diese Optionen steuern Reisehinweise in allen Ansichten und die Standardwerte der Exporte. Bereits gespeicherte Reisedaten bleiben erhalten.'),
        h('label',{className:'setting-line'},h('input',{type:'checkbox',checked:d.travelEnabled,onChange:function(e){self.set('travelEnabled',e.target.checked)}}),h('span',null,h('b',null,'Dienstreisemanagement aktiv'),h('small',null,'Reisestatus, Buchungen und Reisefelder im Termin-Editor anzeigen.'))),
        h('label',{className:'setting-line'},h('input',{type:'checkbox',checked:d.travelShowDashboard,disabled:!d.travelEnabled,onChange:function(e){self.set('travelShowDashboard',e.target.checked)}}),h('span',null,h('b',null,'Offene Reiseplanung auf der Startseite'),h('small',null,'Zeigt Dienstreise-Kennzahlen und offene Buchungen im Dashboard.'))),
        h('label',{className:'setting-line'},h('input',{type:'checkbox',checked:d.travelTrackExpenses,disabled:!d.travelEnabled,onChange:function(e){self.set('travelTrackExpenses',e.target.checked)}}),h('span',null,h('b',null,'Reisekostenabrechnung nach Termin verfolgen'),h('small',null,'Blendet den Nachbereitungs-Schritt im Termin-Editor ein.'))),
        h('label',{className:'setting-line'},h('input',{type:'checkbox',checked:d.travelIcsDefault,disabled:!d.travelEnabled,onChange:function(e){self.set('travelIcsDefault',e.target.checked)}}),h('span',null,h('b',null,'Reiseinfos standardmäßig in iCal aufnehmen'))),
        h('label',{className:'setting-line'},h('input',{type:'checkbox',checked:d.travelPdfDefault,disabled:!d.travelEnabled,onChange:function(e){self.set('travelPdfDefault',e.target.checked)}}),h('span',null,h('b',null,'Dienstreise-Spalte im PDF standardmäßig anzeigen')))),
      h('section',{className:'settings-card'},h('div',{className:'personal-note'},h(Icon,{name:'lock',size:15}),'Diese Optionen verändern keine fachlichen Pflicht-/Optional-Kennzeichnungen; sie steuern nur deine persönliche Ansicht.'))
    ),
    h('div',{className:'modal-actions'},h('div',{className:'spacer'}),h(Button,{onClick:this.props.onClose},'Abbrechen'),h(Button,{kind:'primary',icon:'check',onClick:this.save},'Optionen speichern'))
  ))}
}
function ProgressBar(p){return h('div',{className:'progress-track','aria-label':p.label||'Fortschritt'},h('div',{className:cx('progress-fill',p.done&&'done'),style:{width:Math.max(0,Math.min(100,p.percent||0))+'%'}}))}
function QualificationPanel(p){
  var ulb=C.requirementProgress(p.events,'ulb8',40);
  var blocks=ulb.blocks.slice().sort(function(a,b){return a.start.localeCompare(b.start)});
  var caseEvent=p.events.find(function(e){return e.requirementId==='caseprep2w'});
  var plannedWeeks=(ulb.plannedDays/5).toFixed(ulb.plannedDays%5?1:0);
  var blockList=blocks.length?h('div',{className:'req-list'},blocks.map(function(e){
    var days=(e.creditDays!==''&&e.creditDays!=null)?Number(e.creditDays):C.workingDays(e.start,e.end);
    return h('button',{type:'button',className:'req-item',key:e.id,onClick:function(){p.onEdit(e)}},
      h('span',null,fmtRange(e)),h('b',null,days+' AT'),h('small',null,e.location||'ULB'));
  })):h('div',{className:'empty-mini'},'Noch kein ULB-Zeitraum eingetragen. Die 8 Wochen dürfen auf mehrere Blöcke verteilt werden.');
  var ulbCard=h('article',{className:cx('req-card',ulb.done&&'req-done')},
    h('div',{className:'req-top'},
      h('div',{className:'req-icon'},h(Icon,{name:'building',size:20})),
      h('div',{className:'req-main'},
        h('h3',null,'ULB-Abordnung · 8 Wochen'),
        h('div',{className:'req-value'},ulb.plannedDays+' / 40 Arbeitstage geplant'),
        h('div',{className:'req-meta'},plannedWeeks+' / 8 Wochen · '+(ulb.done?'Anforderung vollständig geplant':ulb.remainingDays+' Arbeitstage noch zu verteilen'))
      ),
      h(Badge,{kind:ulb.done?'ok':'draft'},ulb.done?'geplant':'zu planen')
    ),
    h(ProgressBar,{percent:ulb.percent,done:ulb.done,label:'ULB-Abordnung '+ulb.percent+' Prozent geplant'}),
    h('div',{className:'req-actions'},h(Button,{icon:'plus',kind:'primary',onClick:p.onAddUlb},'ULB-Block hinzufügen')),
    blockList
  );
  var caseAction=caseEvent?h(Button,{icon:'edit',onClick:function(){p.onEdit(caseEvent)}},'Fallbearbeitung bearbeiten'):h(Button,{icon:'plus',kind:'primary',onClick:p.onAddCase},'Fallbearbeitung terminieren');
  var caseCard=h('article',{className:cx('req-card',caseEvent&&'req-done')},
    h('div',{className:'req-top'},
      h('div',{className:'req-icon'},h(Icon,{name:'briefcase',size:20})),
      h('div',{className:'req-main'},
        h('h3',null,'Verwaltungsfall an ULB · 2 Wochen'),
        h('div',{className:'req-value'},caseEvent?fmtRange(caseEvent):'Noch nicht persönlich terminiert'),
        h('div',{className:'req-meta'},caseEvent?(caseEvent.location||'ULB'):'Der Plan enthält KW 48–49 als Vorbereitungsfenster; dein konkreter Fall wird separat eingetragen.')
      ),
      h(Badge,{kind:caseEvent?'ok':'draft'},caseEvent?'terminiert':'zu planen')
    ),
    h('div',{className:'req-actions'},caseAction)
  );
  var examCard=h('article',{className:'req-card req-exam'},
    h('div',{className:'req-top'},
      h('div',{className:'req-icon'},h(Icon,{name:'check',size:20})),
      h('div',{className:'req-main'},
        h('h3',null,'Praktische Verwaltungsprüfung'),
        h('div',{className:'req-value'},'KW 50/2027 · RP Karlsruhe'),
        h('div',{className:'req-meta'},'Prüfungstermine 14./15.12.2027 · für dich 1 Prüfungstag, genauer Tag folgt')
      ),
      h(Badge,{kind:'exam'},'Prüfung')
    )
  );
  return h('section',{className:'qual-panel'},
    h('div',{className:'qual-head'},h('div',null,h('div',{className:'eyebrow'},'MEINE LAUFBAHNQUALIFIZIERUNG'),h('h2',null,'Noch zu planende Pflichtphasen'),h('p',null,'Diese persönlichen Phasen werden separat von den festen Lehrgangsterminen verwaltet.'))),
    h('div',{className:'req-grid'},ulbCard,caseCard,examCard)
  );
}
function PlanningNotice(p){var ulb=C.requirementProgress(p.events,'ulb8',40),caseEvent=p.events.find(function(e){return e.requirementId==='caseprep2w'});return h('section',{className:'panel planning-panel'},h('div',{className:'section-head'},h('div',null,h('h2',null,'Offene Terminplanung'),h('p',null,'Hier werden Anforderungen gezeigt, die noch nicht vollständig persönlich terminiert sind.'))),h('div',{className:'planning-list'},!ulb.done&&h('div',{className:'planning-row'},h(Icon,{name:'alert',size:18}),h('div',null,h('b',null,'ULB-Abordnung'),h('span',null,ulb.remainingDays+' von 40 Arbeitstagen sind noch zu verteilen.')),h(Button,{icon:'plus',onClick:p.onAddUlb},'Block hinzufügen')),!caseEvent&&h('div',{className:'planning-row'},h(Icon,{name:'alert',size:18}),h('div',null,h('b',null,'Fallbearbeitung Verwaltungsprüfung'),h('span',null,'Der persönliche zweiwöchige ULB-Fall ist noch nicht terminiert.')),h(Button,{icon:'plus',onClick:p.onAddCase},'Terminieren')),ulb.done&&caseEvent&&h('div',{className:'planning-complete'},h(Icon,{name:'check',size:18}),' Alle persönlichen Pflichtphasen sind terminiert.')))}
function TravelPanel(p){
  var all=qualifierTravelEvents(p.events),agg=T.travelAggregate(all,'qualifier'),clarify=all.filter(function(e){return T.normalizeTravel(e.travel).required==='open'}),open=offeneReiseTermine(p.events),today=C.dateToISO(new Date()),settlement=all.filter(function(e){var t=T.normalizeTravel(e.travel);return t.required==='yes'&&e.end<today&&!t.expensesDone});
  return h('section',{className:'travel-panel'},h('div',{className:'travel-head'},h('div',null,h('div',{className:'eyebrow'},'DIENSTREISEN'),h('h2',null,'Dienstreisemanagement'),h('p',null,'Reisebedarf und Buchungen pro Termin abhaken. Die Reisekostenabrechnung ist bewusst ein separater Schritt nach dem Termin.')),h(Badge,{kind:open.length?'draft':'ok'},open.length?open.length+' offen':'alles geplant')),
    h('div',{className:'travel-kpis'},h('div',{className:'travel-kpi'},h('b',null,agg.required),h('span',null,'Dienstreisen erforderlich')),h('div',{className:'travel-kpi'},h('b',null,agg.ready),h('span',null,'vollständig geplant')),h('div',{className:'travel-kpi'},h('b',null,agg.open+clarify.length),h('span',null,'Planung / Bedarf offen')),h('div',{className:'travel-kpi'},h('b',null,settlement.length),h('span',null,'Abrechnungen nach Termin offen'))),
    open.length?h('div',{className:'travel-open-list'},open.slice(0,8).map(function(e){var t=T.normalizeTravel(e.travel),st=T.travelStatus(e);return h('button',{type:'button',className:'travel-row',key:e.id,onClick:function(){p.onEdit(e)}},h('div',{className:'when'},'KW '+(e.sourceKW||C.computedKW(e))+' · '+fmtRange(e)),h('div',null,h('div',{className:'travel-title'},e.title),h('div',{className:'travel-missing'},t.required==='open'?'Dienstreise erforderlich? noch festlegen':'Offen: '+st.missing.join(' · '))),h(TravelMark,{event:e}))})):h('div',{className:'travel-ok'},h(Icon,{name:'check',size:17}),' Für alle als Dienstreise markierten Termine ist die Reiseplanung vollständig.'))
}
function KategorieLegende(){
  var eintraege=[['mandatory','Pflicht'],['optional','Optional (schraffiert)'],['prep','Vorbereitung / Fallbearbeitung'],['ulb','ULB-Abordnung'],['exam','Prüfung']];
  return h('ul',{className:'bw-legend lq-legende'},eintraege.map(function(x){
    return h('li',{key:x[0]},h('span',{className:cx('swatch','lq-swatch',x[0]),'aria-hidden':'true'}),x[1]);
  }));
}
function Overview(p){
  var suchend=sucheAktiv(p.suche),grenze=suchend?25:12,liste=p.events.slice(0,grenze),daten=quartalsDaten(p.events);
  return h('div',null,
    h('section',{className:'panel'},
      h('div',{className:'section-head'},h('div',null,
        h('h2',null,suchend?'Suchergebnisse':'Nächste relevante Termine'),
        h('p',null,suchend
          ?p.events.length+(p.events.length===1?' Treffer':' Treffer')+' · nach Relevanz sortiert'
          :'Deine persönliche Auswahl aus Pflichtterminen und ausgewählten freiwilligen Veranstaltungen.'))),
      h('div',{className:'timeline-list'},liste.length?liste.map(function(e){
        return h('button',{type:'button',className:'timeline-card',key:e.id,onClick:function(){p.onEdit(e)}},
          h('div',{className:'datebox'},h('b',null,'KW '+(e.sourceKW||C.computedKW(e))),h('span',null,fmtRange(e))),
          h('div',{className:'eventmain'},
            h('div',{className:'eventtitle'},markiert(e.title,p.suche)),
            h('div',{className:'meta'},markiert(e.location||'–',p.suche),' · ',e.category,' · ',roleLabel(e))),
          h('div',{className:'eventbadges'},
            h(Badge,{kind:statusClass(e),lock:isProtected(e)},statusLabel(e)),
            p.showTravel!==false&&h(TravelMark,{event:e})));
      }):h('div',{className:'empty-state'},'Keine Termine für diese Filterkombination.')),
      p.events.length>grenze&&h('div',{className:'footnote'},'… und '+(p.events.length-grenze)+' weitere Termine. Die vollständige Liste steht unter „Termine\u201c.')),
    (!suchend&&daten.length>1)?h('section',{className:'panel'},
      h('div',{className:'section-head'},h('div',null,
        h('h2',null,'Belastung je Quartal'),
        h('p',null,'Arbeitstage (Mo–Fr) der sichtbaren Termine, dem Quartal des Beginns zugeordnet.'))),
      h('div',{className:'lq-diagramm'},
        h(Diagramm,{daten:daten,titel:'Arbeitstage je Quartal'}),
        h('ul',{className:'bw-legend'},
          h('li',{key:'basis'},h('span',{className:'swatch',style:{background:'var(--bw-cat-1)'},'aria-hidden':'true'}),'Arbeitstage je Quartal'),
          h('li',{key:'hoch'},h('span',{className:'swatch',style:{background:'var(--bw-gelb)',outline:'1.5px solid var(--bw-schwarz)'},'aria-hidden':'true'}),'stärkstes Quartal')))
    ):null);
}
function GanttView(p){var ranges={all:['2026-11-01','2027-12-31','Gesamt'],start:['2026-11-01','2027-03-31','Startphase'],half1:['2027-01-01','2027-06-30','1. Halbjahr'],half2:['2027-07-01','2027-12-31','2. Halbjahr'],admin:['2027-10-25','2027-12-31','Verwaltungsphase']},rr=ranges[p.range];var start=C.parseDateOnly(rr[0]),end=C.parseDateOnly(rr[1]),days=Math.round((end-start)/86400000)+1,weeks=Math.ceil(days/7),width=weeks*p.weekW,list=p.events.filter(function(e){return e.start&&e.end&&e.end>=rr[0]&&e.start<=rr[1]}),headers=[];for(var i=0;i<weeks;i++){var d=new Date(start);d.setDate(d.getDate()+i*7);headers.push({date:C.dateToISO(d),kw:C.isoWeekInfo(C.dateToISO(d)).week,month:d.getMonth()})}
return h('section',{className:'panel gantt-panel'},h('div',{className:'section-head gantt-tools'},h('div',null,h('h2',null,'Gantt · Kalenderwochen'),h('p',null,p.showTravel!==false?'Reisestatus wird am Termin markiert; es entstehen bewusst keine zusätzlichen Reise-Balken.':'Persönliche Terminplanung auf KW-Basis.')),h('div',{className:'toolset'},h('select',{value:p.range,onChange:function(e){p.setRange(e.target.value)}},Object.keys(ranges).map(function(k){return h('option',{value:k,key:k},ranges[k][2])})),h('div',{className:'seg small'},[[48,'Kompakt'],[72,'Normal'],[104,'Groß']].map(function(x){return h('button',{type:'button',key:x[0],className:p.weekW===x[0]?'active':'',onClick:function(){p.setWeekW(x[0])}},x[1])})))),list.length?h('div',{className:'gantt-wrap'},h('div',{className:'gantt-labels'},h('div',{className:'gantt-corner'},'Termin'),list.map(function(e){var tr=T.normalizeTravel(e.travel);return h('button',{type:'button',className:cx('gantt-label',p.showTravel!==false&&tr.required!=='no'&&'has-travel'),key:e.id,onClick:function(){p.onEdit(e)}},h('b',null,'KW '+(e.sourceKW||C.computedKW(e))),h('span',null,e.title),h('span',{className:'gantt-label__marken'},h(Badge,{kind:statusClass(e),lock:isProtected(e)},statusLabel(e)),p.showTravel!==false&&h(TravelMark,{event:e})))})),h('div',{className:'gantt-scroll'},h('div',{className:'gantt-canvas',style:{width:width+'px'}},h('div',{className:'week-head'},headers.map(function(x){return h('div',{className:'week-cell',key:x.date,style:{width:p.weekW+'px'}},h('b',null,'KW '+x.kw),h('span',null,MONTHS[x.month].slice(0,3)))})),h('div',{className:'gantt-body'},list.map(function(e){var span=C.timelineSpan(e.start,e.end,rr[0],rr[1]),tr=T.normalizeTravel(e.travel);return h('div',{className:cx('gantt-row',p.showTravel!==false&&tr.required!=='no'&&'has-travel'),key:e.id},h('div',{className:'gridweeks'},headers.map(function(x){return h('i',{key:x.date,style:{width:p.weekW+'px'}})})),h('button',{type:'button',className:cx('gantt-bar',statusClass(e),e.requirementId==='ulb8'&&'ulb'),style:{left:span.leftPct+'%',width:span.widthPct+'%'},onClick:function(){p.onEdit(e)},title:e.title+' · '+fmtRange(e)+(p.showTravel!==false?' · '+travelShort(e):'')},h('span',null,e.title)))}))))):h('div',{className:'empty-state'},'Keine terminierten Ereignisse im gewählten Zeitraum.'),h(KategorieLegende,null))}
function CalendarView(p){var cur=p.month,y=cur.getFullYear(),m=cur.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),offset=(first.getDay()+6)%7,cells=[],i;for(i=0;i<offset;i++)cells.push(null);for(i=1;i<=last.getDate();i++)cells.push(new Date(y,m,i));while(cells.length%7)cells.push(null);function move(n){p.setMonth(new Date(y,m+n,1))}return h('section',{className:'panel calendar-panel'},h('div',{className:'calnav'},h(Button,{icon:'chevleft',onClick:function(){move(-1)}},'Zurück'),h('h2',null,MONTHS[m]+' '+y),h(Button,{icon:'chevright',onClick:function(){move(1)}},'Weiter')),h('div',{className:'calgrid'},['Mo','Di','Mi','Do','Fr','Sa','So'].map(function(w){return h('div',{className:'dow',key:w},w)}),cells.map(function(date,idx){if(!date)return h('div',{className:'day empty',key:'e'+idx});var iso=C.dateToISO(date),evs=p.events.filter(function(e){return e.start&&e.end&&e.start<=iso&&e.end>=iso});return h('div',{className:'day',key:iso},h('div',{className:'daynum'},date.getDate(),h('small',null,'KW '+C.isoWeekInfo(iso).week)),h('div',{className:'dayevents'},evs.map(function(e){return h('button',{type:'button',key:e.id,className:cx('cal-event',statusClass(e)),onClick:function(){p.onEdit(e)},title:e.title},e.obligation==='Optional'?'○ ':'● ',e.title,p.showTravel!==false&&T.normalizeTravel(e.travel).required!=='no'&&h('span',{className:'travel-mini',title:travelShort(e)},' · ✦'))})))})))}
function TableView(p){var showTravel=p.showTravel!==false;return h('section',{className:'panel table-panel'},h('div',{className:'section-head'},h('div',null,h('h2',null,'Terminliste'),h('p',null,p.events.length+' sichtbare Einträge'))),h('div',{className:'table-scroll'},h('table',{className:'lq-tabelle'},h('thead',null,h('tr',null,h('th',null,'KW'),h('th',null,'Datum'),h('th',null,'Termin'),h('th',null,'Teilnehmer'),h('th',null,'Status'),showTravel&&h('th',null,'Dienstreise'),h('th',null,'Ort'),h('th',null,'KW-Check'),h('th',null,''))),h('tbody',null,p.events.map(function(e){return h('tr',{key:e.id},h('td',null,'KW '+(e.sourceKW||C.computedKW(e))),h('td',{className:'nowrap'},fmtRange(e)),h('td',null,h('b',null,markiert(e.title,p.suche)),e.notes&&h('div',{className:'row-note'},e.notes)),h('td',null,roleLabel(e)),h('td',null,h(Badge,{kind:statusClass(e),lock:isProtected(e)},statusLabel(e))),showTravel&&h('td',{className:'travel-cell'},h(TravelMark,{event:e,showNone:true}),T.normalizeTravel(e.travel).required==='yes'&&h('div',null,travelShort(e))),h('td',null,markiert(e.location||'–',p.suche)),h('td',null,h('span',{className:C.kwMatches(e)?'ok':'warn'},C.kwMatches(e)?'✓':'⚠ '+C.computedKW(e))),h('td',null,h('button',{type:'button',className:'iconbtn',onClick:function(){p.onEdit(e)},title:'Bearbeiten'},h(Icon,{name:'edit'}))))}))))) }
function CompareView(){return h('section',{className:'panel compare'},h('div',{className:'section-head'},h('div',null,h('h2',null,'Entwurf 04.09.2026 → Offizieller Plan 15.09.2026'),h('p',null,'Abgleich mit dem offiziellen Ausbildungsplan der RP Karlsruhe und Freiburg (Az. 34c-8414.53).'))),h('div',{className:'compare-grid'},D.DIFFS.map(function(d,i){return h('div',{className:'compare-row',key:i},h('div',{className:'compare-name'},d.block),h('div',{className:'kwpill old'},d.old),h('div',{className:'arrow'},'→'),h('div',{className:cx('kwpill','next',d.old!==d.next&&'geaendert')},d.next),h(Badge,{kind:d.obligation==='Optional'?'optional':d.obligation==='Pflicht'?'mandatory':'neutral',lock:d.obligation==='Optional'},d.obligation),h('div',{className:'compare-note'},d.note))})))}
function field(label,control,cls){return h('label',{className:cx('field',cls)},h('span',null,label),control)}
function ics(s){return String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function download(name,type,text){try{var blob=new Blob([text],{type:type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000)}catch(e){alert('Export konnte in diesem Browser nicht gestartet werden.')}}

class IcsExportModal extends R.Component{
  constructor(p){super(p);this.state={scope:'current',prefix:'[LQ] ',statusPrefix:false,privacy:'PRIVATE',busyStatus:'BUSY',timeMode:'allday',fixedStart:'08:30',fixedEnd:'16:30',reminder:'0',includeLocation:true,includeDescription:true,includeTravelDescription:p.settings?p.settings.travelIcsDefault!==false:true,selectedIds:[]};this.doExport=this.doExport.bind(this)}
  set(k,v){var x={};x[k]=v;this.setState(x)}
  getList(){return exportFilter(this.props.events,this.state.scope,this.props.currentFilters,this.state.selectedIds).filter(function(e){return e.start&&e.end})}
  toggleId(id){var a=this.state.selectedIds.slice(),i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);this.setState({selectedIds:a})}
  doExport(){var o=this.state,list=this.getList();if(!list.length){alert('Für diese Auswahl gibt es keine terminierten Einträge.');return}if(o.timeMode==='fixedDaily'&&o.fixedEnd<=o.fixedStart){alert('Die Endzeit muss nach der Startzeit liegen.');return}var text=X.buildICS(list,{prefix:o.prefix,statusPrefix:o.statusPrefix,privacy:o.privacy,busyStatus:o.busyStatus,timeMode:o.timeMode,fixedStart:o.fixedStart,fixedEnd:o.fixedEnd,includeLocation:o.includeLocation,includeDescription:o.includeDescription,includeTravelDescription:o.includeTravelDescription,reminderMinutes:Number(o.reminder)||0},{addDays:C.addDays,computedKW:C.computedKW,statusLabel:statusLabel,roleLabel:roleLabel,travelSummary:T.travelSummary});download('laufbahnqualifizierung_2026_27.ics','text/calendar;charset=utf-8',text);this.props.onClose()}
  render(){var self=this,s=this.state,list=this.getList(),all=C.filterEvents(this.props.events,{participant:'all',status:'all'}).filter(function(e){return e.start&&e.end});return h('div',{className:'modal-backdrop',onMouseDown:function(e){if(e.target===e.currentTarget)self.props.onClose()}},h('div',{className:'modal export-modal'},
    h('div',{className:'modal-head'},h('div',null,h('div',{className:'eyebrow'},'OUTLOOK / ICAL EXPORT'),h('h2',null,'Kalenderexport konfigurieren')),h('button',{type:'button',className:'iconbtn',onClick:this.props.onClose},h(Icon,{name:'close'}))),
    h('div',{className:'export-grid'},
      h('section',{className:'export-card'},h('h3',null,'Welche Termine?'),field('Auswahl',h('select',{value:s.scope,onChange:function(e){self.set('scope',e.target.value)}},h('option',{value:'current'},'Meine aktuelle Dashboard-Auswahl'),h('option',{value:'qualifierAll'},'Qualifizierer · alle'),h('option',{value:'qualifierMandatory'},'Qualifizierer · nur Pflicht'),h('option',{value:'qualifierOptional'},'Qualifizierer · nur Optional'),h('option',{value:'selected'},'Einzelne Termine auswählen'))),field('Betreff-Präfix',h('input',{value:s.prefix,onChange:function(e){self.set('prefix',e.target.value)},placeholder:'z. B. [LQ] '})),h('label',{className:'checkline'},h('input',{type:'checkbox',checked:s.statusPrefix,onChange:function(e){self.set('statusPrefix',e.target.checked)}}),h('span',null,'Status zusätzlich voranstellen, z. B. [PFLICHT], [OPTIONAL], [ULB]'))),
      h('section',{className:'export-card'},h('h3',null,'Darstellung in Outlook'),field('Sichtbarkeit',h('select',{value:s.privacy,onChange:function(e){self.set('privacy',e.target.value)}},h('option',{value:'PRIVATE'},'Privat'),h('option',{value:'PUBLIC'},'Öffentlich'))),field('Anzeigen als',h('select',{value:s.busyStatus,onChange:function(e){self.set('busyStatus',e.target.value)}},h('option',{value:'BUSY'},'Beschäftigt'),h('option',{value:'FREE'},'Frei'),h('option',{value:'TENTATIVE'},'Mit Vorbehalt'))),field('Erinnerung',h('select',{value:s.reminder,onChange:function(e){self.set('reminder',e.target.value)}},h('option',{value:'0'},'Keine'),h('option',{value:'15'},'15 Minuten vorher'),h('option',{value:'60'},'1 Stunde vorher'),h('option',{value:'1440'},'1 Tag vorher'))),h('label',{className:'checkline'},h('input',{type:'checkbox',checked:s.includeLocation,onChange:function(e){self.set('includeLocation',e.target.checked)}}),h('span',null,'Ort übernehmen')),h('label',{className:'checkline'},h('input',{type:'checkbox',checked:s.includeDescription,onChange:function(e){self.set('includeDescription',e.target.checked)}}),h('span',null,'KW, Status, Teilnehmer, Kategorie und Notizen in Beschreibung')),h('label',{className:'checkline'},h('input',{type:'checkbox',checked:s.includeTravelDescription,onChange:function(e){self.set('includeTravelDescription',e.target.checked)},disabled:!s.includeDescription}),h('span',null,'Reiseinformationen in Beschreibung aufnehmen'))),
      h('section',{className:'export-card'},h('h3',null,'Zeitmodus'),field('Kalenderdarstellung',h('select',{value:s.timeMode,onChange:function(e){self.set('timeMode',e.target.value)}},h('option',{value:'allday'},'Ganztägig (empfohlen)'),h('option',{value:'event'},'Individuelle Uhrzeiten je Termin'),h('option',{value:'fixedDaily'},'Jeden Arbeitstag mit gleicher Uhrzeit'))),s.timeMode==='fixedDaily'&&h('div',{className:'time-row'},field('Von',h('input',{type:'time',value:s.fixedStart,onChange:function(e){self.set('fixedStart',e.target.value)}})),field('Bis',h('input',{type:'time',value:s.fixedEnd,onChange:function(e){self.set('fixedEnd',e.target.value)}}))),s.timeMode==='event'&&h('p',{className:'hint'},'Im Termin-Editor kannst du optional Beginn und Ende speichern. Bei mehrtägigen Terminen wird für jeden Werktag ein eigener Zeiteintrag erzeugt. Termine ohne Uhrzeit bleiben ganztägig.'),s.timeMode==='fixedDaily'&&h('p',{className:'hint'},'Mehrtägige Blöcke werden als einzelne Arbeitstage Montag–Freitag exportiert. So blockiert Outlook nicht auch die Nächte zwischen den Lehrgangstagen.')),
      h('section',{className:'export-card'},h('h3',null,'Vorschau'),h('div',{className:'export-summary'},h('div',{className:'export-mini'},h('b',null,list.length),h('span',null,'Blöcke ausgewählt')),h('div',{className:'export-mini'},h('b',null,list.filter(function(e){return e.obligation==='Pflicht'}).length),h('span',null,'Pflicht')),h('div',{className:'export-mini'},h('b',null,list.filter(function(e){return T.normalizeTravel(e.travel).required==='yes'}).length),h('span',null,'Dienstreisen')),h('div',{className:'export-mini'},h('b',null,s.privacy==='PRIVATE'?'Privat':'Öffentlich'),h('span',null,'Sichtbarkeit'))),h('p',{className:'hint',style:{marginTop:'10px'}},'Beispiel: '+s.prefix+(s.statusPrefix?'[PFLICHT] ':'')+(list[0]?list[0].title:'Termin')))
    ),
    s.scope==='selected'&&h('div',{className:'export-preview'},h('div',{className:'export-preview-head'},h('b',null,'Einzelne Termine'),h('span',null,s.selectedIds.length+' ausgewählt')),h('div',{className:'export-preview-list'},all.map(function(e){return h('label',{className:'export-preview-row',key:e.id},h('input',{type:'checkbox',checked:s.selectedIds.indexOf(e.id)>=0,onChange:function(){self.toggleId(e.id)}}),h('span',{className:'date'},fmtDate(e.start)),h('span',{className:'title'},e.title),h(Badge,{kind:statusClass(e)},statusLabel(e)))}))),
    h('div',{className:'modal-actions'},h('div',{className:'spacer'}),h(Button,{onClick:this.props.onClose},'Abbrechen'),h(Button,{kind:'primary',icon:'download',onClick:this.doExport},list.length+' Termin'+(list.length===1?'':'e')+' exportieren'))
  ))}
}
class PdfExportModal extends R.Component{
  constructor(p){super(p);var f=p.currentFilters||{},travelDefault=p.settings?p.settings.travelPdfDefault!==false:true;this.state={scope:'current',participant:'qualifier',status:'all',travel:'all',year:f.year||'all',from:'',to:'',title:'Laufbahnqualifizierung gD Landwirtschaft – Persönlicher Terminplan',orientation:'landscape',density:'normal',optionalShade:true,includeSummary:true,columns:{kw:true,date:true,title:true,location:true,status:true,travel:travelDefault,category:true,participant:false,notes:false}};this.doPrint=this.doPrint.bind(this)}
  set(k,v){var x={};x[k]=v;this.setState(x)}
  setCol(k,v){var c=Object.assign({},this.state.columns);c[k]=v;this.setState({columns:c})}
  getList(){var s=this.state,list;if(s.scope==='current')list=(this.props.currentEvents||[]).slice();else list=C.filterEvents(this.props.events,{participant:s.participant,status:s.status,year:s.year,search:''}).filter(function(e){return T.matchesTravelFilter(e,s.travel)});return filterDateRange(list,s.from,s.to).filter(function(e){return e.start&&e.end})}
  doPrint(){var s=this.state,list=this.getList();if(!list.length){alert('Für diese Filter gibt es keine terminierten Einträge.');return}if(!Object.keys(s.columns).some(function(k){return s.columns[k]})){alert('Bitte mindestens eine Tabellenspalte auswählen.');return}this.props.onPrint(Object.assign({},s,{columns:Object.assign({},s.columns)}),list);this.props.onClose()}
  render(){var self=this,s=this.state,list=this.getList(),cols=[['kw','KW'],['date','Datum'],['title','Termin'],['location','Ort'],['status','Status'],['travel','Dienstreise'],['category','Kategorie'],['participant','Teilnehmer'],['notes','Notizen']];return h('div',{className:'modal-backdrop',onMouseDown:function(e){if(e.target===e.currentTarget)self.props.onClose()}},h('div',{className:'modal export-modal'},
    h('div',{className:'modal-head'},h('div',null,h('div',{className:'eyebrow'},'PDF / DRUCKANSICHT'),h('h2',null,'Druckfähige Terminübersicht')),h('button',{type:'button',className:'iconbtn',onClick:this.props.onClose},h(Icon,{name:'close'}))),
    h('div',{className:'export-grid'},
      h('section',{className:'export-card'},h('h3',null,'Inhalt filtern'),field('Grundlage',h('select',{value:s.scope,onChange:function(e){self.set('scope',e.target.value)}},h('option',{value:'current'},'Meine aktuelle Dashboard-Auswahl'),h('option',{value:'custom'},'Eigene Exportauswahl'))),s.scope==='custom'&&field('Teilnehmer',h('select',{value:s.participant,onChange:function(e){self.set('participant',e.target.value)}},h('option',{value:'qualifier'},'Qualifizierer'),h('option',{value:'trainee'},'Anwärter'),h('option',{value:'all'},'Alle'))),s.scope==='custom'&&field('Verbindlichkeit',h('select',{value:s.status,onChange:function(e){self.set('status',e.target.value)}},h('option',{value:'all'},'Alle'),h('option',{value:'mandatory'},'Pflicht'),h('option',{value:'optional'},'Optional'))),s.scope==='custom'&&field('Dienstreise',h('select',{value:s.travel,onChange:function(e){self.set('travel',e.target.value)}},h('option',{value:'all'},'Alle Reisestatus'),h('option',{value:'required'},'Dienstreise erforderlich'),h('option',{value:'open'},'Reiseplanung offen'),h('option',{value:'ready'},'Vollständig geplant'))),s.scope==='custom'&&field('Jahr',h('select',{value:s.year,onChange:function(e){self.set('year',e.target.value)}},h('option',{value:'all'},'Alle'),h('option',{value:'2026'},'2026'),h('option',{value:'2027'},'2027'),h('option',{value:'2028'},'2028'))),h('div',{className:'time-row'},field('Von (optional)',h('input',{type:'date',value:s.from,onChange:function(e){self.set('from',e.target.value)}})),field('Bis (optional)',h('input',{type:'date',value:s.to,onChange:function(e){self.set('to',e.target.value)}})))),
      h('section',{className:'export-card'},h('h3',null,'Tabelle'),field('Titel',h('input',{value:s.title,onChange:function(e){self.set('title',e.target.value)}})),h('div',{className:'cols-grid'},cols.map(function(c){return h('label',{className:'checkline',key:c[0]},h('input',{type:'checkbox',checked:!!s.columns[c[0]],onChange:function(e){self.setCol(c[0],e.target.checked)}}),h('span',null,c[1]))}))),
      h('section',{className:'export-card'},h('h3',null,'Drucklayout'),field('A4-Format',h('select',{value:s.orientation,onChange:function(e){self.set('orientation',e.target.value)}},h('option',{value:'landscape'},'Querformat'),h('option',{value:'portrait'},'Hochformat'))),field('Dichte',h('select',{value:s.density,onChange:function(e){self.set('density',e.target.value)}},h('option',{value:'normal'},'Normal'),h('option',{value:'compact'},'Kompakt'))),h('label',{className:'checkline'},h('input',{type:'checkbox',checked:s.includeSummary,onChange:function(e){self.set('includeSummary',e.target.checked)}}),h('span',null,'Zusammenfassung oben anzeigen')),h('label',{className:'checkline'},h('input',{type:'checkbox',checked:s.optionalShade,onChange:function(e){self.set('optionalShade',e.target.checked)}}),h('span',null,'Optionale Termine grau hinterlegen'))),
      h('section',{className:'export-card'},h('h3',null,'Druckvorschau'),h('div',{className:'export-summary'},h('div',{className:'export-mini'},h('b',null,list.length),h('span',null,'Zeilen')),h('div',{className:'export-mini'},h('b',null,list.filter(function(e){return e.obligation==='Pflicht'}).length),h('span',null,'Pflicht')),h('div',{className:'export-mini'},h('b',null,list.filter(function(e){return T.normalizeTravel(e.travel).required==='yes'}).length),h('span',null,'Dienstreisen')),h('div',{className:'export-mini'},h('b',null,s.orientation==='landscape'?'Quer':'Hoch'),h('span',null,'A4'))),h('p',{className:'hint',style:{marginTop:'10px'}},'Der Button öffnet den System-Druckdialog. Dort „Als PDF speichern“ bzw. einen Drucker auswählen. Die Tabelle bekommt wiederholte Kopfzeilen und saubere Seitenumbrüche.'))
    ),
    h('div',{className:'modal-actions'},h('div',{className:'spacer'}),h(Button,{onClick:this.props.onClose},'Abbrechen'),h(Button,{kind:'primary',icon:'print',onClick:this.doPrint},'Druckansicht öffnen'))
  ))}
}
function PrintReport(p){var c=p.config,events=p.events,cols=c.columns,ulb=C.requirementProgress(p.allEvents,'ulb8',40),caseEvent=p.allEvents.find(function(e){return e.requirementId==='caseprep2w'}),travel=T.travelAggregate(p.allEvents,'qualifier'),reiseOffen=offeneReiseTermine(p.allEvents).length,headers={kw:'KW',date:'Datum',title:'Termin',location:'Ort',status:'Status',travel:'Dienstreise',category:'Kategorie',participant:'Teilnehmer',notes:'Notizen'},keys=Object.keys(headers).filter(function(k){return cols[k]});function cell(k,e){if(k==='kw')return 'KW '+(e.sourceKW||C.computedKW(e));if(k==='date')return fmtRange(e);if(k==='title')return e.title;if(k==='location')return e.location||'–';if(k==='status')return statusLabel(e);if(k==='travel')return travelShort(e);if(k==='category')return e.category||'–';if(k==='participant')return roleLabel(e);if(k==='notes')return e.notes||'';return''}return h('section',{className:cx('print-report',c.density==='compact'&&'compact',!c.optionalShade&&'no-optional-shade')},h('div',{className:'pr-head'},h('div',{className:'pr-kicker'},'Laufbahnqualifizierung · Terminübersicht'),h('h1',null,c.title||'Persönlicher Terminplan'),h('div',{className:'pr-meta'},'Planstand 15.09.2026 · Ausdruck '+todayDE()+' · '+events.length+' Einträge')),c.includeSummary&&h('div',{className:'pr-summary'},h('div',{className:'pr-stat'},h('b',null,events.filter(function(e){return e.obligation==='Pflicht'}).length),h('span',null,'Pflichtblöcke in Auswahl')),h('div',{className:'pr-stat'},h('b',null,reiseOffen?reiseOffen:travel.ready+'/'+travel.required),h('span',null,reiseOffen?'Termine mit offener Reiseplanung':'Dienstreisen vollständig geplant')),h('div',{className:'pr-stat'},h('b',null,ulb.plannedDays+'/40'),h('span',null,'ULB-Arbeitstage geplant')),h('div',{className:'pr-stat'},h('b',null,caseEvent?'terminiert':'offen'),h('span',null,'2 Wochen Verwaltungsfall'))),h('table',null,h('thead',null,h('tr',null,keys.map(function(k){return h('th',{key:k},headers[k])}))),h('tbody',null,events.map(function(e){return h('tr',{key:e.id,className:e.obligation==='Optional'?'row-optional':''},keys.map(function(k){return h('td',{key:k,className:cx((k==='kw'||k==='date'||k==='status')&&'nowrap',k==='travel'&&'travel-print')},k==='status'?h('span',{className:'pr-status'},cell(k,e)):cell(k,e))}))}))),h('div',{className:'pr-note'},'Hinweis: Optional-Kennzeichnungen stammen aus dem Referenzplan 25–27 und bleiben bei Planvergleichen geschützt. Dienstreiseangaben sind persönliche Planungsdaten pro Termin.'),h('div',{className:'pr-footer'},h('span',null,'Laufbahnqualifizierung gD Landwirtschaft'),h('span',null,'Erstellt mit dem Terminplan der Laufbahnqualifizierung V2.7')))}

class Editor extends R.Component{
  constructor(p){super(p);var f=Object.assign({},p.event);f.travel=T.normalizeTravel(f.travel);this.state={f:f};this.setField=this.setField.bind(this);this.setTravel=this.setTravel.bind(this);this.submit=this.submit.bind(this)}
  setField(k,v){var f=Object.assign({},this.state.f);f[k]=v;if(k==='start'&&f.end&&f.end<v)f.end=v;if(k==='category'){if(v==='ULB-Abordnung')f.requirementId='ulb8';else if(v==='Verwaltungsfall')f.requirementId='caseprep2w';else if(f.requirementId==='ulb8'||f.requirementId==='caseprep2w')delete f.requirementId;}this.setState({f:f})}
  setTravel(k,v){var f=Object.assign({},this.state.f),t=T.normalizeTravel(f.travel);t[k]=v;if(k==='required'&&v==='no'){t.approved=false;t.transport='';t.ticketBooked=false;t.overnightRequired='no';t.hotelBooked=false;t.documentsComplete=false}if(k==='transport'&&v!=='train')t.ticketBooked=false;if(k==='overnightRequired'&&v!=='yes')t.hotelBooked=false;f.travel=t;this.setState({f:f})}
  submit(e){e.preventDefault();var out=Object.assign({},this.state.f);out.travel=T.normalizeTravel(out.travel);if(!String(out.title||'').trim()){alert('Bitte einen Titel eingeben.');return}if(!out.start||!out.end){alert('Bitte Start- und Enddatum eintragen.');return}if(out.end<out.start)out.end=out.start;if(!out.sourceKW||out.requirementId==='ulb8'||out.requirementId==='caseprep2w')out.sourceKW=C.computedKW(out);if(out.requirementId==='ulb8'&&out.creditDays!==''&&out.creditDays!=null){var n=Number(out.creditDays);if(!Number.isFinite(n)||n<0){alert('Anrechenbare Arbeitstage müssen eine Zahl ab 0 sein.');return}out.creditDays=n;}this.props.onSave(out)}
  render(){var p=this.props,f=this.state.f,t=T.normalizeTravel(f.travel),prot=isProtected(p.event),self=this,isUlb=f.requirementId==='ulb8'||f.category==='ULB-Abordnung',st=T.travelStatus(f);return h('div',{className:'modal-backdrop',onMouseDown:function(e){if(e.target===e.currentTarget)p.onClose()}},h('form',{className:'modal',onSubmit:this.submit},h('div',{className:'modal-head'},h('div',null,h('div',{className:'eyebrow'},p.isNew?'NEUER TERMIN':'TERMIN BEARBEITEN'),h('h2',null,p.isNew?'Termin anlegen':p.event.title)),h('button',{type:'button',className:'iconbtn',onClick:p.onClose},h(Icon,{name:'close'}))),prot&&h('div',{className:'locknote'},h(Icon,{name:'lock',size:16}),h('div',null,h('b',null,'Optional ist geschützt.'),h('span',null,' Diese Kennzeichnung stammt aus dem Referenzplan und bleibt unverändert.'))),h('div',{className:'formgrid'},field('Titel',h('input',{value:f.title||'',onChange:function(e){self.setField('title',e.target.value)}}),'wide'),field('Start',h('input',{type:'date',value:f.start||'',onChange:function(e){self.setField('start',e.target.value)}})),field('Ende',h('input',{type:'date',value:f.end||'',onChange:function(e){self.setField('end',e.target.value)}})),field('Beginn (optional)',h('input',{type:'time',value:f.startTime||'',onChange:function(e){self.setField('startTime',e.target.value)}})),field('Ende Uhrzeit (optional)',h('input',{type:'time',value:f.endTime||'',onChange:function(e){self.setField('endTime',e.target.value)}})),field('KW',h('input',{value:f.sourceKW||'',onChange:function(e){self.setField('sourceKW',e.target.value)},placeholder:'wird automatisch berechnet'})),field('Status',h('select',{value:f.obligation||'Pflicht',onChange:function(e){self.setField('obligation',e.target.value)},disabled:prot},h('option',{value:'Pflicht'},'Pflicht'),h('option',{value:'Optional'},'Optional'),h('option',{value:'Offen'},'Offen'))),field('Teilnehmer',h('select',{value:f.relevance||'Qualifizierer',onChange:function(e){self.setField('relevance',e.target.value)}},h('option',{value:'Qualifizierer'},'Qualifizierer'),h('option',{value:'Beide'},'Beide'),h('option',{value:'Anwärter'},'Anwärter'))),field('Kategorie',h('select',{value:f.category||'Sonstiges',onChange:function(e){self.setField('category',e.target.value)}},['LEL','RPK / Verwaltung','Prüfungsvorbereitung','Prüfung','Organisation','Wahlstation','Beratung','ULB-Abordnung','Verwaltungsfall','Sonstiges'].map(function(x){return h('option',{value:x,key:x},x)}))),isUlb&&field('Anrechenbare Arbeitstage',h('input',{type:'number',min:'0',step:'1',value:f.creditDays==null?'':f.creditDays,onChange:function(e){self.setField('creditDays',e.target.value)},placeholder:'leer = Mo–Fr automatisch'})),field('Ort',h('input',{value:f.location||'',onChange:function(e){self.setField('location',e.target.value)}}),'wide'),field('Notizen',h('textarea',{rows:4,value:f.notes||'',onChange:function(e){self.setField('notes',e.target.value)}}),'wide'),
    p.travelEnabled!==false&&h('section',{className:'travel-section'},h('div',{className:'travel-section-head'},h('div',null,h('h3',null,'Dienstreisemanagement'),h('span',null,'Planung und Nachbereitung für diesen Termin')),h(TravelMark,{event:f,showNone:true})),h('div',{className:'travel-grid'},field('Dienstreise erforderlich',h('select',{value:t.required,onChange:function(e){self.setTravel('required',e.target.value)}},h('option',{value:'open'},'Noch offen / klären'),h('option',{value:'yes'},'Ja'),h('option',{value:'no'},'Nein'))),t.required==='yes'&&field('Verkehrsmittel',h('select',{value:t.transport,onChange:function(e){self.setTravel('transport',e.target.value)}},h('option',{value:''},'Noch offen'),h('option',{value:'train'},'Bahn'),h('option',{value:'car'},'Privat-PKW'),h('option',{value:'companyCar'},'Dienstwagen'),h('option',{value:'other'},'Sonstiges'))),t.required==='yes'&&field('Übernachtung erforderlich',h('select',{value:t.overnightRequired,onChange:function(e){self.setTravel('overnightRequired',e.target.value)}},h('option',{value:'open'},'Noch offen / klären'),h('option',{value:'yes'},'Ja'),h('option',{value:'no'},'Nein'))),t.required==='yes'&&h('div',{className:'travel-checks'},h('label',{className:'travel-check'},h('input',{type:'checkbox',checked:t.approved,onChange:function(e){self.setTravel('approved',e.target.checked)}}),h('span',null,'Dienstreise geplant / genehmigt')),t.transport==='train'&&h('label',{className:'travel-check'},h('input',{type:'checkbox',checked:t.ticketBooked,onChange:function(e){self.setTravel('ticketBooked',e.target.checked)}}),h('span',null,'Zugticket reserviert')),t.overnightRequired==='yes'&&h('label',{className:'travel-check'},h('input',{type:'checkbox',checked:t.hotelBooked,onChange:function(e){self.setTravel('hotelBooked',e.target.checked)}}),h('span',null,'Übernachtung gebucht')),h('label',{className:'travel-check'},h('input',{type:'checkbox',checked:t.documentsComplete,onChange:function(e){self.setTravel('documentsComplete',e.target.checked)}}),h('span',null,'Reiseunterlagen vollständig')),p.trackExpenses!==false&&h('label',{className:'travel-check'},h('input',{type:'checkbox',checked:t.expensesDone,onChange:function(e){self.setTravel('expensesDone',e.target.checked)}}),h('span',null,'Reisekostenabrechnung erledigt'))),field('Reisehinweise / Buchungsdaten',h('textarea',{rows:3,value:t.notes,onChange:function(e){self.setTravel('notes',e.target.value)},placeholder:'z. B. Hotel, Buchungsnummer, Zugverbindung …'}),'travel-note'),t.required==='yes'&&h('div',{className:'travel-help'},st.planningComplete?'✓ Reiseplanung vor dem Termin vollständig. Die Reisekostenabrechnung kann später separat abgehakt werden.':'Noch offen: '+st.missing.join(' · ')))),
    isUlb&&h('div',{className:'formhint'},'Ohne manuelle Angabe zählt das Dashboard automatisch die Werktage Montag bis Freitag. Feiertage oder Sonderfälle kannst du über „Anrechenbare Arbeitstage“ korrigieren.')),h('div',{className:'modal-actions'},!p.isNew&&h(Button,{kind:'danger',onClick:function(){if(confirm('Termin wirklich löschen?'))p.onDelete(p.event.id)}},'Löschen'),h('div',{className:'spacer'}),h(Button,{onClick:p.onClose},'Abbrechen'),h('button',{className:'btn btn-primary',type:'submit'},h(Icon,{name:'edit',size:17}),h('span',null,'Speichern'))))) }
}
class App extends R.Component{
  constructor(p){super(p);var v='overview',events=safeLoad();try{v=localStorage.getItem(VIEW)||localStorage.getItem(VIEW_OLD)||v}catch(e){}this.state={events:events,settings:safeLoadSettings(events),view:v,search:'',year:'all',optionsOpen:false,editing:null,creating:null,ganttRange:'all',weekW:72,calendarMonth:new Date(2026,10,1),icsOpen:false,pdfOpen:false,printReport:null};this.setView=this.setView.bind(this);this.saveEvent=this.saveEvent.bind(this);this.removeEvent=this.removeEvent.bind(this);this.exportICS=this.exportICS.bind(this);this.printPdf=this.printPdf.bind(this);this.runPrint=this.runPrint.bind(this);this.reset=this.reset.bind(this);this.addUlb=this.addUlb.bind(this);this.addCase=this.addCase.bind(this);this.saveSettings=this.saveSettings.bind(this)}
  componentDidMount(){if(window.bwNav)window.bwNav.init()}
  componentDidUpdate(prevP,prevS){if(prevS.events!==this.state.events)safeSave(this.state.events);if(prevS.settings!==this.state.settings)safeSaveSettings(this.state.settings);if(window.bwNav)window.bwNav.init()}
  setView(v){this.setState({view:v});try{localStorage.setItem(VIEW,v)}catch(e){}}
  saveSettings(settings){this.setState({settings:settings,optionsOpen:false})}
  saveEvent(incoming){var prev=this.state.events,i=prev.findIndex(function(x){return x.id===incoming.id}),next=prev.slice(),settings=this.state.settings;if(i<0)next.push(incoming);else next[i]=C.mergePlanEvent(prev[i],incoming,{mode:'manual'});if(i<0&&incoming.obligation==='Optional'&&(incoming.relevance||'Beide')!=='Anwärter'&&settings.selectedOptionalIds.indexOf(incoming.id)<0)settings=Object.assign({},settings,{selectedOptionalIds:settings.selectedOptionalIds.concat([incoming.id])});this.setState({events:next,settings:settings,editing:null,creating:null})}
  removeEvent(id){this.setState({events:this.state.events.filter(function(x){return x.id!==id}),settings:Object.assign({},this.state.settings,{selectedOptionalIds:this.state.settings.selectedOptionalIds.filter(function(x){return x!==id})}),editing:null})}
  reset(){if(confirm('Alle eigenen Änderungen und persönlichen Optionen verwerfen und Ausgangsdaten der V2.7 wiederherstellen?')){var events=D.makeDefaultEvents();this.setState({events:events,settings:defaultSettings(events)})}}
  addUlb(){this.setState({creating:{id:uid(),title:'ULB-Abordnung – Block',start:'',end:'',sourceKW:'',category:'ULB-Abordnung',obligation:'Pflicht',statusOrigin:'manual',relevance:'Qualifizierer',requirementId:'ulb8',creditDays:'',location:'',travel:{required:'open'},notes:'Teil der insgesamt 8 Wochen ULB-Abordnung. Die Abordnung darf auf mehrere Blöcke verteilt werden.'}})}
  addCase(){this.setState({creating:{id:uid(),title:'Fallbearbeitung Verwaltungsprüfung an ULB',start:'',end:'',sourceKW:'',category:'Verwaltungsfall',obligation:'Pflicht',statusOrigin:'manual',relevance:'Qualifizierer',requirementId:'caseprep2w',location:'ULB',travel:{required:'open'},notes:'Persönliche zweiwöchige Fallbearbeitung zur Vorbereitung auf die praktische Verwaltungsprüfung.'}})}
  exportICS(){this.setState({icsOpen:true})}
  printPdf(){this.setState({pdfOpen:true})}
  runPrint(config,events){var self=this,style=document.getElementById('lq-print-page-style');if(!style){style=document.createElement('style');style.id='lq-print-page-style';document.head.appendChild(style)}style.textContent='@page{size:A4 '+(config.orientation==='portrait'?'portrait':'landscape')+';margin:12mm}';document.body.classList.add('lq-printing');this.setState({printReport:{config:config,events:events}},function(){var cleanup=function(){document.body.classList.remove('lq-printing');self.setState({printReport:null});window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup);setTimeout(function(){window.print()},80);setTimeout(function(){if(document.body.classList.contains('lq-printing'))cleanup()},3000)})}
  render(){var self=this,s=this.state,settings=s.settings,
      visible=visibleForProfile(s.events,settings,s.search,s.year),
      zeitlich=chronologisch(visible),
      qualifierEvents=C.filterEvents(s.events,{participant:'qualifier',status:'all'}),
      travelAgg=T.travelAggregate(qualifierEvents,'qualifier'),
      mandatory=qualifierEvents.filter(function(e){return e.obligation==='Pflicht'}).length,
      allOptional=qualifierEvents.filter(function(e){return e.obligation==='Optional'}),
      selectedSet=new Set(settings.selectedOptionalIds||[]),
      selectedOptional=allOptional.filter(function(e){return selectedSet.has(e.id)}).length,
      ulb=C.requirementProgress(s.events,'ulb8',40),
      caseEvent=s.events.find(function(e){return e.requirementId==='caseprep2w'}),
      optionalEvents=allOptional,
      showTravel=settings.travelEnabled!==false,
      currentIds=visible.map(function(e){return e.id});
    var bearbeiten=function(e){self.setState({editing:e})};
    // Gelb markiert genau eine Bedeutung: hier ist noch etwas zu tun.
    var kennzahlen=[
      {value:mandatory,label:'Pflichtblöcke für Qualifizierer'},
      {value:selectedOptional+'/'+allOptional.length,label:'Optionale Veranstaltungen ausgewählt'},
      {value:ulb.plannedDays+'/40',label:'ULB-Arbeitstage geplant',offen:!ulb.done},
      {value:caseEvent?'terminiert':'offen',label:'2 Wochen Verwaltungsfall',offen:!caseEvent}
    ];
    if(showTravel){var reiseOffen=offeneReiseTermine(s.events).length;
      kennzahlen.push(reiseOffen
        ?{value:reiseOffen,label:'Termine mit offener Reiseplanung',offen:true}
        :{value:travelAgg.ready+'/'+travelAgg.required,label:'Dienstreisen vollständig geplant'});}
    var ansicht=s.view==='open'
      ?h('div',{className:'open-tasks-panel'},
          h(PlanningNotice,{events:s.events,onAddUlb:this.addUlb,onAddCase:this.addCase}),
          showTravel?h(TravelPanel,{events:s.events,onEdit:bearbeiten})
                    :h('div',{className:'travel-disabled-note'},'Dienstreisemanagement ist in den Optionen deaktiviert.'))
      :s.view==='gantt'
      ?h(GanttView,{events:zeitlich,showTravel:showTravel,onEdit:bearbeiten,range:s.ganttRange,setRange:function(v){self.setState({ganttRange:v})},weekW:s.weekW,setWeekW:function(v){self.setState({weekW:v})}})
      :s.view==='calendar'
      ?h(CalendarView,{events:zeitlich,showTravel:showTravel,onEdit:bearbeiten,month:s.calendarMonth,setMonth:function(v){self.setState({calendarMonth:v})}})
      :s.view==='table'
      ?h(TableView,{events:zeitlich,suche:s.search,showTravel:showTravel,onEdit:bearbeiten})
      :s.view==='compare'
      ?h(CompareView,null)
      :h(Overview,{events:visible,suche:s.search,showTravel:showTravel,onEdit:bearbeiten});

    return h('div',{className:'lq-shell'},
      h(Kopfnavigation,{view:s.view,onChange:this.setView}),
      h('main',{className:'bw-app bw-app--weit lq-inhalt',id:'inhalt'},
        h('div',{className:'lq-titelzeile'},
          h('div',null,
            h('div',{className:'eyebrow'},'Laufbahnqualifizierung · Qualifizierer'),
            h('h1',null,'Terminplan 2026/27'),
            h('p',{className:'sub'},'Pflichttermine sind immer sichtbar. Freiwillige Veranstaltungen und das Dienstreisemanagement stellst du unter „Optionen“ ein.')),
          h(Badge,{kind:'neutral'},'V2.7 · Offizieller Plan 15.09.2026')),
        h(Werkzeugleiste,{
          search:s.search,setSearch:function(v){self.setState({search:v})},
          year:s.year,setYear:function(v){self.setState({year:v})},
          openOptions:function(){self.setState({optionsOpen:true})},
          onNeu:function(){self.setState({creating:{id:uid(),title:'',start:'2027-01-01',end:'2027-01-01',sourceKW:'',category:'Sonstiges',obligation:'Pflicht',statusOrigin:'manual',relevance:'Qualifizierer',location:'',travel:{required:'open'},notes:''}})},
          onIcs:this.exportICS,onPdf:this.printPdf,
          onBackup:function(){download('laufbahnqualifizierung_backup_v27.json','application/json',JSON.stringify({version:'2.7',events:s.events,settings:s.settings},null,2))}
        }),
        h('section',{className:cx('lq-kennzahlen',kennzahlen.length===5&&'lq-kennzahlen--fuenf'),'aria-label':'Kennzahlen der Qualifizierung'},
          kennzahlen.map(function(k,i){return h(Kennzahl,{key:i,value:k.value,label:k.label,offen:k.offen})})),
        // Bei aktiver Suche treten die Dauerpanels zurück — gesucht wird nach Treffern.
        s.view==='overview'&&!sucheAktiv(s.search)&&h(QualificationPanel,{events:s.events,onAddUlb:this.addUlb,onAddCase:this.addCase,onEdit:bearbeiten}),
        s.view==='overview'&&!sucheAktiv(s.search)&&showTravel&&settings.travelShowDashboard&&h(TravelPanel,{events:s.events,onEdit:bearbeiten}),
        ansicht,
        h('div',{className:'footnote'},h(Icon,{name:'lock',size:14}),' Optional bleibt fachlich geschützt. Deine Optionen steuern nur, welche freiwilligen Veranstaltungen in Übersicht, Gantt, Kalender, Tabelle und Standardexporten auftauchen.'),
        h('div',{className:'bottom-actions'},h(Button,{icon:'reset',onClick:this.reset},'Ausgangsstand wiederherstellen'))),
      h('footer',{className:'bw-footer'},
        h('div',{className:'bw-app bw-app--weit lq-footer-innen'},
          h(Marke,{negativ:true}),
          h('span',{className:'bw-klein'},'Persönliche Planungsdaten bleiben im Browser dieses Rechners · Änderungen des Ausbildungsplans vorbehalten'))),
      s.printReport&&h(PrintReport,{config:s.printReport.config,events:s.printReport.events,allEvents:s.events}),
      s.icsOpen&&h(IcsExportModal,{events:s.events,currentFilters:{visibleIds:currentIds,search:s.search,year:s.year},currentEvents:zeitlich,settings:settings,onClose:function(){self.setState({icsOpen:false})}}),
      s.pdfOpen&&h(PdfExportModal,{events:s.events,currentFilters:{visibleIds:currentIds,search:s.search,year:s.year},currentEvents:zeitlich,settings:settings,onClose:function(){self.setState({pdfOpen:false})},onPrint:this.runPrint}),
      s.optionsOpen&&h(OptionsModal,{settings:settings,optionalEvents:optionalEvents,onClose:function(){self.setState({optionsOpen:false})},onSave:this.saveSettings}),
      s.editing&&h(Editor,{event:s.editing,travelEnabled:showTravel,trackExpenses:settings.travelTrackExpenses,onClose:function(){self.setState({editing:null})},onSave:this.saveEvent,onDelete:this.removeEvent}),
      s.creating&&h(Editor,{event:s.creating,isNew:true,travelEnabled:showTravel,trackExpenses:settings.travelTrackExpenses,onClose:function(){self.setState({creating:null})},onSave:this.saveEvent})
    )}
}
RD.render(h(App),document.getElementById('root'));
})();
