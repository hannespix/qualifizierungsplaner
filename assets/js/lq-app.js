(function(){
'use strict';
var R=window.React, RD=window.ReactDOM, C=window.LQCore, D=window.LQData, X=window.LQExport, T=window.LQTravel, M=window.LQMail;
if(!R||!RD||!C||!D||!X||!T||!M){ document.getElementById('root').innerHTML='<div class="fatal"><b>Dashboard konnte nicht gestartet werden.</b><p>Interne Komponenten fehlen.</p></div>'; return; }
var h=R.createElement, STORAGE='lq-dashboard-v28-events', LEGACY_STORAGE=['lq-dashboard-v27-events','lq-dashboard-v26-events','lq-dashboard-v25-events'], VIEW='lq-dashboard-v29-view', VIEW_OLD='lq-dashboard-v28-view', FILTER='lq-dashboard-v29-filter', SETTINGS='LQ_SETTINGS_V26';
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
// Gespeicherte Referenztermine bekommen neue Plan-Metadaten (z. B. Aufgabe,
// Vorlage) nachgereicht. Persönliche Angaben bleiben unberührt.
function ergaenzeReferenz(liste){var ref={};D.makeDefaultEvents().forEach(function(e){ref[e.id]=e});return liste.map(function(e){var r=e&&ref[e.id];if(!r)return e;var x=e;['aufgabe','vorlage'].forEach(function(k){if(r[k]!==undefined&&x[k]===undefined){if(x===e)x=Object.assign({},e);x[k]=r[k]}});return x})}
function safeLoad(){try{
  var raw=localStorage.getItem(STORAGE);
  if(raw){var x=JSON.parse(raw);if(Array.isArray(x))return ergaenzeReferenz(x)}
  for(var i=0;i<LEGACY_STORAGE.length;i++){
    var old=localStorage.getItem(LEGACY_STORAGE[i]);
    if(old){var y=JSON.parse(old);if(Array.isArray(y))return migratePlanEvents(y)}
  }
}catch(e){}return D.makeDefaultEvents()}
function safeSave(v){try{localStorage.setItem(STORAGE,JSON.stringify(v));return true}catch(e){return false}}
function optionalQualifierIds(events){return (events||[]).filter(function(e){return e.obligation==='Optional'&&(e.relevance||'Beide')!=='Anwärter'}).map(function(e){return e.id})}
function defaultSettings(events){return{selectedOptionalIds:optionalQualifierIds(events),travelEnabled:true,travelIcsDefault:true,travelPdfDefault:true,buchungswegGeklaert:false,absName:'',absDienststelle:'',absTelefon:'',vgName:'',vgEmail:'',vwEmail:'',alEmail:''}}
function safeLoadSettings(events){try{var raw=localStorage.getItem(SETTINGS);if(raw){var x=JSON.parse(raw),d=defaultSettings(events);return Object.assign(d,x,{selectedOptionalIds:Array.isArray(x.selectedOptionalIds)?x.selectedOptionalIds:d.selectedOptionalIds})}}catch(e){}return defaultSettings(events)}
function safeSaveSettings(v){try{localStorage.setItem(SETTINGS,JSON.stringify(v));return true}catch(e){return false}}
// Globale Suche nach CLAUDE.md 3.3: multitoken, tippfehler- und
// diakritikatolerant, über alle relevanten Felder, Ranking nach Relevanz.
// Reihenfolge: Zeitachsen (Kalender, Terminliste) bleiben chronologisch,
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
function pad(n){return String(n).padStart(2,'0')}
function fmtDate(s){if(!s)return'noch offen';var d=C.parseDateOnly(s);return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()}
function fmtRange(e){if(!e.start||!e.end)return'noch nicht terminiert';return e.start===e.end?fmtDate(e.start):fmtDate(e.start)+' – '+fmtDate(e.end)}
// Kompakt für die Oberfläche: 09.11.–13.11.2026; über den Jahreswechsel beide Jahre.
function fmtKurz(e){if(!e.start||!e.end)return 'noch nicht terminiert';if(e.start===e.end)return fmtDate(e.start);var a=fmtDate(e.start),b=fmtDate(e.end);return (a.slice(6)===b.slice(6)?a.slice(0,6):a)+'–'+b}
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

function Icon(p){var paths={calendar:'M3 5h18v16H3z M7 3v4 M17 3v4 M3 9h18',timeline:'M4 7h16 M7 4v6 M4 13h16 M14 10v6 M4 19h16',table:'M4 5h16v14H4z M4 10h16 M10 5v14',compare:'M7 4v16 M4 7l3-3 3 3 M17 20V4 m-3 13 3 3 3-3',plus:'M12 5v14 M5 12h14',download:'M12 3v12 m-5-5 5 5 5-5 M5 21h14',print:'M6 9V3h12v6 M6 17h12v4H6z M4 9h16v8H4z',edit:'M4 20l4-1 10-10-3-3L5 16z M14 7l3 3',lock:'M7 11V8a5 5 0 0110 0v3 M5 11h14v10H5z',search:'M11 19a8 8 0 100-16 8 8 0 000 16zm6-2 4 4',reset:'M4 12a8 8 0 101.8-5 M4 4v6h6',chevleft:'M15 5l-7 7 7 7',chevright:'M9 5l7 7-7 7',close:'M6 6l12 12M18 6L6 18',check:'M5 12l4 4L19 6',mail:'M3 6h18v12H3z M3 7l9 6 9-6',copy:'M9 9h11v11H9z M5 15H4V4h11v1',alert:'M12 4l9 16H3z M12 9v4 M12 17h.01',building:'M4 21V8l8-5 8 5v13 M9 21v-6h6v6',briefcase:'M4 8h16v12H4z M9 8V5h6v3',menu:'M3 6h18 M3 12h18 M3 18h18',gear:'M12 8a4 4 0 100 8 4 4 0 000-8z M4 12h2 M18 12h2 M12 4v2 M12 18v2 M6.3 6.3l1.4 1.4 M16.3 16.3l1.4 1.4 M17.7 6.3l-1.4 1.4 M7.7 16.3l-1.4 1.4'};return h('svg',{viewBox:'0 0 24 24',width:p.size||18,height:p.size||18,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':'true'},h('path',{d:paths[p.name]||'M12 12h.01'}))}
function Button(p){return h('button',{type:'button',className:cx('btn',p.kind&&'btn-'+p.kind,p.className),onClick:p.onClick,disabled:p.disabled,title:p.title},p.icon&&h(Icon,{name:p.icon,size:17}),h('span',null,p.children))}
function Badge(p){return h('span',{className:cx('badge',p.kind&&'badge-'+p.kind)},p.lock&&h(Icon,{name:'lock',size:12}),p.children)}
// In der Einzeldatei aus tools/build_singlefile.py gibt es keine relativen
// Pfade mehr; dort liefert window.BW_ASSETS die data:-URL.
// =====================================================================
// Filter: Teilnehmer und Status – gilt für Übersicht, Termine, Kalender
// =====================================================================
var TEILNEHMER=[{id:'qualifizierer',label:'Qualifizierer'},{id:'anwaerter',label:'Anwärter'},{id:'alle',label:'Alle'}];
var STATUS=[{id:'alle',label:'Alle'},{id:'pflicht',label:'Pflicht'},{id:'optional',label:'Optional'},{id:'offen',label:'Offen'}];
function ladeFilter(){try{var x=JSON.parse(localStorage.getItem(FILTER)||'null');if(x&&typeof x==='object')return {teilnehmer:x.teilnehmer||'qualifizierer',status:x.status||'alle'}}catch(e){}return {teilnehmer:'qualifizierer',status:'alle'}}
function speichereFilter(f){try{localStorage.setItem(FILTER,JSON.stringify(f))}catch(e){}}
function passtTeilnehmer(e,tn){var rel=e.relevance||'Beide';if(tn==='qualifizierer')return rel!=='Anwärter';if(tn==='anwaerter')return rel!=='Qualifizierer';return true}
function passtStatus(e,st,sel,tn){
  if(st==='pflicht')return e.obligation==='Pflicht';
  if(st==='optional')return e.obligation==='Optional';
  if(st==='offen')return e.obligation==='Offen';
  // „Alle“ zeigt Qualifizierern nur die freiwilligen Bausteine ihrer Auswahl.
  if(tn==='qualifizierer'&&e.obligation==='Optional')return sel.has(e.id);
  return true;
}
function auswahl(settings){return new Set((settings&&settings.selectedOptionalIds)||[])}
function sichtbar(events,settings,filter,suche){
  var tn=filter.teilnehmer,st=filter.status,sel=auswahl(settings);
  return fuzzySuche((events||[]).filter(function(e){return passtTeilnehmer(e,tn)&&passtStatus(e,st,sel,tn)}),suche);
}
function zaehle(events,settings,tn,st){var sel=auswahl(settings);return (events||[]).filter(function(e){return passtTeilnehmer(e,tn)&&passtStatus(e,st,sel,tn)}).length}
function meineTermine(events,settings){var sel=auswahl(settings);return (events||[]).filter(function(e){return (e.relevance||'Beide')!=='Anwärter'&&(e.obligation!=='Optional'||sel.has(e.id))})}
function reiseTermine(events,settings){return chronologisch(meineTermine(events,settings).filter(function(e){return e.start&&e.end&&e.kind!=='milestone'&&!e.planWindow}))}

// Native Radiobuttons: Pfeiltasten, Fokus und Screenreader funktionieren ohne Zusatzcode.
function Segmente(p){
  return h('fieldset',{className:'lq-seg'},
    h('legend',null,p.legende),
    h('div',{className:'lq-seg__optionen'},p.optionen.map(function(o){
      var id=p.name+'-'+o.id;
      return h('label',{key:o.id,className:cx('lq-seg__option',p.wert===o.id&&'is-aktiv'),htmlFor:id},
        h('input',{type:'radio',id:id,name:p.name,value:o.id,checked:p.wert===o.id,onChange:function(){p.onChange(o.id)}}),
        h('span',null,o.label),
        o.anzahl!=null?h('span',{className:'lq-seg__zahl'},o.anzahl):null);
    })));
}
function FilterLeiste(p){
  var tn=p.filter.teilnehmer,st=p.filter.status;
  return h('div',{className:'lq-filter',role:'group','aria-label':'Termine filtern'},
    h(Segmente,{name:'lq-tn',legende:'Teilnehmer',wert:tn,optionen:TEILNEHMER,onChange:function(v){p.onChange({teilnehmer:v,status:st})}}),
    h(Segmente,{name:'lq-st',legende:'Status',wert:st,
      optionen:STATUS.map(function(o){return {id:o.id,label:o.label,anzahl:zaehle(p.events,p.settings,tn,o.id)}}),
      onChange:function(v){p.onChange({teilnehmer:tn,status:v})}}));
}

// =====================================================================
// Übersicht: Als Nächstes · Zu erledigen · Kommende Termine
// =====================================================================
function tageText(n){return n===0?'heute':n===1?'morgen':n<0?(n===-1?'gestern':'vor '+(-n)+' Tagen'):'in '+n+' Tagen'}
function wochentag(iso){return ['So','Mo','Di','Mi','Do','Fr','Sa'][C.parseDateOnly(iso).getDay()]}

function aufgaben(events,settings){
  var heute=T.heute(),liste=[],meine=meineTermine(events,settings);
  meine.filter(function(e){return e.aufgabe&&!e.done&&e.start}).forEach(function(e){
    liste.push({id:'a-'+e.id,text:e.title.replace(/^Frist:\s*/,''),frist:e.start,event:e,vorlage:e.vorlage,erledigen:e.id});
  });
  if(!settings.buchungswegGeklaert)liste.push({id:'buchungsweg',text:'Genehmigung und Buchungsweg klären',
    detail:'einmal für alle Reisen: allgemeine Genehmigung, Bahn, Dienstwagen, Gästehaus',vorlage:'dr-klaeren',erledigenOption:'buchungswegGeklaert'});
  var bw=meine.filter(function(e){return e.category==='LEL'&&e.obligation==='Offen'});
  if(bw.length)liste.push({id:'bw1',text:'Deine 2 Lehrgangstage bei BW I erfragen',detail:bw.map(function(e){return 'KW '+e.sourceKW}).join(' und ')+' – im Plan noch offen',vorlage:'bw1-tage'});
  var ulb=C.requirementProgress(events,'ulb8',40);
  if(!ulb.done)liste.push({id:'ulb',text:'ULB-Abordnung planen',detail:ulb.plannedDays+' von 40 Arbeitstagen eingeplant',aktion:'ulb',vorlage:ulb.plannedDays?'ulb-meldung':'ulb-anfrage'});
  if(!events.some(function(e){return e.requirementId==='caseprep2w'}))liste.push({id:'fall',text:'Verwaltungsfall terminieren',detail:'2 Wochen an einer ULB, Vorbereitungszeitraum KW 48–49/2027',aktion:'fall'});
  if(settings.travelEnabled!==false){
    var reisen=reiseTermine(events,settings);
    var klaeren=reisen.filter(function(e){return T.normalizeTravel(e.travel).required==='open'&&e.end>=heute}).length;
    var unfertig=reisen.filter(function(e){return T.normalizeTravel(e.travel).required==='yes'&&!T.travelStatus(e).planningComplete&&e.end>=heute}).length;
    var abrechnen=reisen.filter(function(e){var t=T.normalizeTravel(e.travel);return t.required==='yes'&&!t.expensesDone&&e.end<heute});
    if(klaeren||unfertig)liste.push({id:'reisen',text:'Dienstreisen planen',aktion:'reisen',
      detail:[klaeren?klaeren+(klaeren===1?' Termin':' Termine')+': Reise ja oder nein?':'',unfertig?unfertig+(unfertig===1?' Reise':' Reisen')+' noch nicht fertig gebucht':''].filter(Boolean).join(' · ')});
    if(abrechnen.length)liste.push({id:'abrechnen',text:abrechnen.length+(abrechnen.length===1?' Reise':' Reisen')+' in DRIVE-BW abrechnen',frist:abrechnen.map(T.abrechnungsFrist).sort()[0],aktion:'reisen'});
  }
  return liste.sort(function(a,b){return (a.frist||'9999').localeCompare(b.frist||'9999')});
}

function AlsNaechstes(p){
  var e=p.event;
  return h('section',{className:'lq-flaeche lq-naechstes','aria-labelledby':'lq-naechstes-titel'},
    h('h2',{id:'lq-naechstes-titel'},'Als Nächstes'),
    e?h('div',null,
      h('p',{className:'lq-naechstes__wann'},tageText(T.tageBis(e.start))),
      h('button',{type:'button',className:'lq-naechstes__termin',onClick:function(){p.onEdit(e)}},
        h('b',null,e.title),
        h('span',null,'KW '+(e.sourceKW||C.computedKW(e))+' · '+wochentag(e.start)+' '+fmtKurz(e)),
        e.location?h('span',null,e.location):null),
      h(Badge,{kind:statusClass(e),lock:isProtected(e)},statusLabel(e)))
    :h('p',{className:'lq-leer'},'Keine kommenden Termine in dieser Auswahl.'));
}

function ZuErledigen(p){
  var liste=p.aufgaben;
  return h('section',{className:'lq-flaeche lq-aufgaben','aria-labelledby':'lq-aufgaben-titel'},
    h('h2',{id:'lq-aufgaben-titel'},'Zu erledigen',liste.length?h('span',{className:'lq-zahl'},liste.length):null),
    liste.length?h('ul',{className:'lq-aufgabenliste'},liste.map(function(a){
      var tage=a.frist?T.tageBis(a.frist):null,
          info=[a.frist?'bis '+wochentag(a.frist)+' '+fmtDate(a.frist)+' · '+tageText(tage):'',a.detail||''].filter(Boolean).join(' · ');
      return h('li',{key:a.id,className:cx('lq-aufgabe',tage!=null&&tage<=14&&'is-dringend')},
        h('div',{className:'lq-aufgabe__text'},h('b',null,a.text),info?h('span',null,info):null),
        h('div',{className:'lq-aufgabe__aktionen'},
          a.aktion==='ulb'?h(Button,{icon:'plus',onClick:p.onAddUlb},'Block'):null,
          a.aktion==='fall'?h(Button,{icon:'plus',onClick:p.onAddCase},'Terminieren'):null,
          a.aktion==='reisen'?h(Button,{icon:'chevright',onClick:function(){p.onView('travel')}},'Reisen'):null,
          a.vorlage?h(Button,{icon:'mail',onClick:function(){p.onVorlage(a.vorlage,a.event&&a.event.id)}},'Vorlage'):null,
          (a.erledigen||a.erledigenOption)?h(Button,{icon:'check',onClick:function(){p.onErledigt(a)},title:'Als erledigt abhaken'},'Erledigt'):null));
    })):h('p',{className:'lq-leer'},'Alles erledigt – gerade ist nichts offen.'));
}

function TerminZeile(p){
  var e=p.event;
  return h('li',{className:cx('lq-termin',e.done&&'is-erledigt')},
    h('button',{type:'button',className:'lq-termin__knopf',onClick:function(){p.onEdit(e)}},
      h('span',{className:'lq-termin__wann'},h('b',null,'KW '+(e.sourceKW||C.computedKW(e))),h('span',null,fmtKurz(e))),
      h('span',{className:'lq-termin__was'},h('b',null,markiert(e.title,p.suche)),
        h('span',null,markiert(e.location||'–',p.suche),p.zeigeRolle?' · '+roleLabel(e):'')),
      h('span',{className:'lq-termin__marken'},
        e.done?h(Badge,{kind:'ok'},'erledigt'):null,
        h(Badge,{kind:statusClass(e),lock:isProtected(e)},statusLabel(e)),
        (p.showTravel&&e.kind!=='milestone'&&T.normalizeTravel(e.travel).required==='yes')?h(TravelMark,{event:e}):null)));
}

function Overview(p){
  var suchend=sucheAktiv(p.suche),heute=T.heute();
  var kommend=p.events.filter(function(e){return !e.end||e.end>=heute});
  var liste=suchend?p.events:kommend.slice(0,8);
  var naechster=kommend.filter(function(e){return e.start})[0];
  var kopf=suchend?'Suchergebnisse':'Kommende Termine',
      unter=suchend?p.events.length+' Treffer, nach Relevanz sortiert':(kommend.length>liste.length?liste.length+' von '+kommend.length+' kommenden Terminen':kommend.length+' kommende Termine');
  return h('div',{className:'lq-uebersicht'},
    suchend?null:h('div',{className:'lq-flaechen-oben'},
      h(AlsNaechstes,{event:naechster,onEdit:p.onEdit}),
      h(ZuErledigen,{aufgaben:p.aufgaben,onAddUlb:p.onAddUlb,onAddCase:p.onAddCase,onView:p.onView,onVorlage:p.onVorlage,onErledigt:p.onErledigt})),
    h('section',{className:'panel'},
      h('div',{className:'section-head'},
        h('div',null,h('h2',null,kopf),h('p',null,unter)),
        (!suchend&&kommend.length>liste.length)?h(Button,{icon:'chevright',onClick:function(){p.onView('table')}},'Alle Termine'):null),
      liste.length?h('ul',{className:'lq-terminliste'},liste.map(function(e){
        return h(TerminZeile,{key:e.id,event:e,suche:p.suche,showTravel:p.showTravel,zeigeRolle:p.zeigeRolle,onEdit:p.onEdit});
      })):h('div',{className:'empty-state'},'Keine Termine für diese Auswahl.')));
}

// =====================================================================
// Dienstreisen: vier Schritte pro Termin zum Abhaken
// =====================================================================
function Haken(p){
  return h('label',{className:'lq-haken'},
    h('input',{type:'checkbox',checked:!!p.checked,onChange:function(e){p.onChange(e.target.checked)}}),
    h('span',null,p.label));
}
var SCHRITT_TEXT={done:'erledigt',open:'offen',na:'entfällt',later:'nach dem Termin'};
function Schritt(p){
  return h('div',{className:cx('lq-schritt','is-'+p.status)},
    h('div',{className:'lq-schritt__kopf'},
      h('span',{className:'lq-schritt__nr','aria-hidden':'true'},p.status==='done'?'✓':p.nr),
      h('b',null,p.titel),
      h('span',{className:'lq-schritt__status'},SCHRITT_TEXT[p.status])),
    h('div',{className:'lq-schritt__inhalt'},p.children));
}
function uebernachtungWert(t){return t.overnightRequired==='no'?'none':t.overnightRequired==='yes'?(t.lodging||'other'):''}
function uebernachtungPatch(v){return v==='none'?{overnightRequired:'no'}:v?{overnightRequired:'yes',lodging:v}:{overnightRequired:'open'}}
// Hält die Reisedaten in sich stimmig, wenn sich eine Angabe ändert.
function reisePatch(alt,patch){
  var t=Object.assign(T.normalizeTravel(alt),patch);
  if(patch.approved)t.requested=true;
  if(patch.requested===false)t.approved=false;
  if(t.transport!=='train')t.ticketBooked=false;
  if(t.transport!=='companyCar')t.carBooked=false;
  if(t.overnightRequired!=='yes'){t.lodging='';t.hotelBooked=false;t.arrivalEve=false}
  if(t.lodging!=='gaestehaus')t.arrivalEve=false;
  return t;
}
function ReiseSchritte(p){
  var e=p.event,t=T.normalizeTravel(e.travel),st=T.schritte(e),set=p.onPatch;
  var storno=T.stornoFrist(e),abr=T.abrechnungsFrist(e),ref=(p.idPrefix||'')+e.id;
  return h('div',{className:'lq-schritte'},
    h(Schritt,{nr:1,titel:'Genehmigung',status:st.genehmigung},
      h(Haken,{label:'Antrag in DRIVE-BW gestellt',checked:t.requested,onChange:function(v){set({requested:v})}}),
      h(Haken,{label:'Genehmigt',checked:t.approved,onChange:function(v){set({approved:v})}})),
    h(Schritt,{nr:2,titel:'Fahrt',status:st.fahrt},
      h('label',{className:'lq-sr',htmlFor:'lq-fahrt-'+ref},'Verkehrsmittel'),
      h('select',{id:'lq-fahrt-'+ref,value:t.transport,onChange:function(x){set({transport:x.target.value})}},
        h('option',{value:''},'Verkehrsmittel wählen'),h('option',{value:'train'},'Bahn'),h('option',{value:'companyCar'},'Dienstwagen'),
        h('option',{value:'car'},'Privat-PKW'),h('option',{value:'other'},'Sonstiges')),
      t.transport==='train'?h(Haken,{label:'Ticket gebucht',checked:t.ticketBooked,onChange:function(v){set({ticketBooked:v})}}):null,
      t.transport==='companyCar'?h(Haken,{label:'Dienstwagen reserviert',checked:t.carBooked,onChange:function(v){set({carBooked:v})}}):null),
    h(Schritt,{nr:3,titel:'Unterkunft',status:st.unterkunft},
      h('label',{className:'lq-sr',htmlFor:'lq-unterkunft-'+ref},'Übernachtung'),
      h('select',{id:'lq-unterkunft-'+ref,value:uebernachtungWert(t),onChange:function(x){set(uebernachtungPatch(x.target.value))}},
        h('option',{value:''},'Übernachtung klären'),h('option',{value:'none'},'Keine Übernachtung'),
        h('option',{value:'gaestehaus'},'Gästehaus der LEL'),h('option',{value:'hotel'},'Hotel'),h('option',{value:'other'},'Sonstige Unterkunft')),
      t.overnightRequired==='yes'?h(Haken,{label:'Reserviert',checked:t.hotelBooked,onChange:function(v){set({hotelBooked:v})}}):null,
      t.lodging==='gaestehaus'?h(Haken,{label:'Anreise am Vorabend',checked:t.arrivalEve,onChange:function(v){set({arrivalEve:v})}}):null,
      storno?h('p',{className:'lq-frist'},'Abmelden bis '+wochentag(storno)+' '+fmtDate(storno)):null),
    h(Schritt,{nr:4,titel:'Abrechnung',status:st.abrechnung},
      h(Haken,{label:'In DRIVE-BW abgerechnet',checked:t.expensesDone,onChange:function(v){set({expensesDone:v})}}),
      (abr&&!t.expensesDone)?h('p',{className:'lq-frist'},'Frist '+fmtDate(abr)):null));
}
function ReiseZeile(p){
  var e=p.event,t=T.normalizeTravel(e.travel),st=T.travelStatus(e),lel=e.category==='LEL',vorlagen=[];
  if(t.required==='yes'){
    vorlagen.push(['dr-antrag','Antrag ankündigen']);
    if(t.transport==='companyCar')vorlagen.push(['dr-dienstwagen','Dienstwagen anfragen']);
    if(lel)vorlagen.push(['kantine','Mittagessen anmelden']);
    if(lel&&t.lodging==='gaestehaus'&&t.hotelBooked)vorlagen.push(['gh-abmeldung','Zimmer abmelden']);
  }
  return h('article',{className:cx('lq-reise','is-'+st.code)},
    h('div',{className:'lq-reise__kopf'},
      h('div',{className:'lq-reise__wann'},h('b',null,'KW '+(e.sourceKW||C.computedKW(e))),h('span',null,wochentag(e.start)+' '+fmtKurz(e))),
      h('div',{className:'lq-reise__was'},
        h('h3',null,h('button',{type:'button',className:'lq-link',onClick:function(){p.onEdit(e)}},e.title)),
        h('span',null,e.location||'–')),
      h('div',{className:'lq-reise__bedarf'},
        h('label',{htmlFor:'lq-bedarf-'+e.id},'Dienstreise'),
        h('select',{id:'lq-bedarf-'+e.id,value:t.required,onChange:function(x){p.onPatch(e.id,{required:x.target.value})}},
          h('option',{value:'open'},'klären'),h('option',{value:'yes'},'ja'),h('option',{value:'no'},'nein')))),
    t.required==='yes'?h(ReiseSchritte,{event:e,onPatch:function(patch){p.onPatch(e.id,patch)}}):null,
    vorlagen.length?h('div',{className:'lq-reise__vorlagen'},h('span',null,'Vorlagen:'),vorlagen.map(function(v){
      return h('button',{type:'button',key:v[0],className:'lq-link',onClick:function(){p.onVorlage(v[0],e.id)}},v[1]);
    })):null);
}
function Quelle(p){
  var q=D.QUELLEN[p.id];if(!q)return null;
  return q.url?h('a',{href:q.url,target:'_blank',rel:'noopener noreferrer'},q.titel):h('span',null,q.titel);
}
function AblaufInfo(p){
  return h('details',{className:'lq-ablauf',open:p.offen},
    h('summary',null,h('b',null,'So läuft eine Dienstreise ab'),h('span',null,'Genehmigung · Fahrt · Unterkunft · Abrechnung · vor Ort')),
    h('ol',{className:'lq-ablauf__schritte'},D.ABLAUF.map(function(a,i){
      return h('li',{key:i},h('b',null,a.schritt),h('p',null,a.text),h('p',{className:'lq-quelle'},'Quelle: ',h(Quelle,{id:a.quelle})));
    })),
    h('div',{className:'lq-ablauf__aktion'},h(Button,{icon:'mail',onClick:function(){p.onVorlage('dr-klaeren')}},'Buchungsweg klären – Vorlage öffnen')),
    h('h3',null,'Vor Ort in Schwäbisch Gmünd'),
    h('dl',{className:'lq-vorort'},D.VOR_ORT.map(function(v){
      return h('div',{key:v.titel},h('dt',null,v.titel),h('dd',null,v.text,h('span',{className:'lq-quelle'},' Quelle: ',h(Quelle,{id:v.quelle}))));
    })));
}
class ReiseAnsicht extends R.Component{
  constructor(p){super(p);this.state={filter:'alle'}}
  render(){
    var self=this,p=this.props,f=this.state.filter,alle=p.events,ja=0,fertig=0,klaeren=0;
    alle.forEach(function(e){var t=T.normalizeTravel(e.travel);if(t.required==='yes'){ja++;if(T.travelStatus(e).planningComplete)fertig++}else if(t.required==='open')klaeren++});
    var liste=alle.filter(function(e){return T.matchesTravelFilter(e,f==='alle'?'all':f)});
    var sammel=alle.filter(function(e){return e.obligation!=='Optional'&&['LEL','RPK / Verwaltung','Prüfung'].indexOf(e.category)>=0&&T.normalizeTravel(e.travel).required==='open'}).map(function(e){return e.id});
    return h('div',{className:'lq-reisen'},
      h(AblaufInfo,{offen:ja===0,onVorlage:p.onVorlage}),
      h('section',{className:'panel'},
        h('div',{className:'section-head'},
          h('div',null,h('h2',null,'Reisen pro Termin'),
            h('p',null,ja+(ja===1?' Dienstreise':' Dienstreisen')+' · '+fertig+' fertig geplant · '+klaeren+' noch zu klären')),
          sammel.length>1?h(Button,{icon:'check',onClick:function(){p.onSammel(sammel)},title:'Setzt bei allen noch offenen Lehrgängen und Prüfungen „Dienstreise: ja“'},'Alle Pflicht-Lehrgänge: Reise ja'):null,
          h(Segmente,{name:'lq-reisefilter',legende:'Anzeigen',wert:f,
            optionen:[{id:'alle',label:'Alle'},{id:'open',label:'Zu tun'},{id:'done',label:'Erledigt'}],
            onChange:function(v){self.setState({filter:v})}})),
        liste.length?h('div',{className:'lq-reiseliste'},liste.map(function(e){
          return h(ReiseZeile,{key:e.id,event:e,onPatch:p.onPatch,onEdit:p.onEdit,onVorlage:p.onVorlage});
        })):h('div',{className:'empty-state'},f==='done'?'Noch keine Reise abgeschlossen.':'Nichts zu tun – alle Reisen sind erledigt.')));
  }
}

// =====================================================================
// E-Mail-Vorlagen
// =====================================================================
function kopiereFallback(text){
  var ta=document.createElement('textarea'),ok=false;
  ta.value=text;ta.setAttribute('readonly','');ta.className='lq-sr';
  document.body.appendChild(ta);ta.select();
  try{ok=document.execCommand('copy')}catch(e){}
  document.body.removeChild(ta);return ok;
}
function kopiere(text){
  if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(text).then(function(){return true},function(){return kopiereFallback(text)});
  return Promise.resolve(kopiereFallback(text));
}
class VorlagenAnsicht extends R.Component{
  constructor(p){
    super(p);
    var id=(p.start&&M.find(p.start.id))?p.start.id:M.VORLAGEN[0].id;
    this.state={draft:this.bauen(id,(p.start&&p.start.eventId)||''),meldung:''};
    this.kopieren=this.kopieren.bind(this);
  }
  componentDidUpdate(prev){
    // Neue Absenderdaten oder Termine: Vorlage neu aufbauen.
    if(prev.settings!==this.props.settings||prev.events!==this.props.events){var d=this.state.draft;this.setState({draft:this.bauen(d.id,d.eventId)})}
  }
  termine(id){return M.termineFuer(M.find(id),{events:this.props.events,settings:this.props.settings})}
  bauen(id,eventId){
    var v=M.find(id),t=this.termine(id);
    if(v.termin&&!t.some(function(e){return e.id===eventId}))eventId=t[0]?t[0].id:'';
    var ev=this.props.events.find(function(e){return e.id===eventId});
    var m=v.build({events:this.props.events,settings:this.props.settings,event:ev});
    return {id:id,eventId:eventId,an:m.an||'',betreff:m.betreff,text:m.text,hinweis:m.hinweis||''};
  }
  waehle(id,eventId){this.setState({draft:this.bauen(id,eventId),meldung:''})}
  set(k,v){var d=Object.assign({},this.state.draft);d[k]=v;this.setState({draft:d})}
  kopieren(){var self=this;kopiere(this.state.draft.text).then(function(ok){self.setState({meldung:ok?'Text kopiert.':'Kopieren war nicht möglich. Markiere den Text und kopiere ihn mit Strg+C.'})})}
  oeffnen(link){
    if(!link.gekuerzt)return;
    var self=this;
    kopiere(this.state.draft.text).then(function(ok){self.setState({meldung:ok
      ?'Die Mail ist zu lang für einen direkten Link. Empfänger und Betreff sind übernommen, den Text hast du in der Zwischenablage – im Mailprogramm einfügen.'
      :'Die Mail ist zu lang für einen direkten Link. Kopiere den Text bitte von Hand.'})});
  }
  render(){
    var self=this,p=this.props,d=this.state.draft,v=M.find(d.id),termine=this.termine(d.id),
        link=M.mailto({an:d.an,betreff:d.betreff,text:d.text}),ohneAbsender=!String(p.settings.absName||'').trim();
    return h('section',{className:'panel lq-vorlagen'},
      h('div',{className:'section-head'},h('div',null,
        h('h2',null,'E-Mail-Vorlagen'),
        h('p',null,'Vorlage wählen, bei Bedarf anpassen und im Mailprogramm öffnen oder kopieren.'))),
      ohneAbsender?h('div',{className:'bw-hinweis lq-vorlagen__hinweis'},
        h('span',null,'Trag unter Optionen deinen Namen, deine Dienststelle und deine Ansprechpersonen ein – dann füllen sich Absender und Empfänger von selbst. Die Angaben bleiben in diesem Browser.'),
        h(Button,{icon:'gear',onClick:p.onOptionen},'Optionen')):null,
      h('div',{className:'lq-vorlagen__raster'},
        h('nav',{className:'lq-vorlagen__liste','aria-label':'Vorlagen'},M.GRUPPEN.map(function(g){
          return h('div',{key:g,className:'lq-vorlagen__gruppe'},h('h3',null,g),h('ul',null,M.VORLAGEN.filter(function(x){return x.gruppe===g}).map(function(x){
            var aktiv=x.id===d.id;
            return h('li',{key:x.id},h('button',{type:'button',className:cx('lq-vorlage',aktiv&&'is-aktiv'),'aria-current':aktiv?'true':null,
              onClick:function(){self.waehle(x.id,d.eventId)}},h('b',null,x.titel),h('span',null,x.zweck)));
          })));
        })),
        h('div',{className:'lq-vorlagen__editor'},
          h('h3',null,v.titel),
          v.frist?h('p',{className:'lq-frist'},'Frist: '+wochentag(v.frist)+' '+fmtDate(v.frist)+' · '+tageText(T.tageBis(v.frist))):null,
          v.termin?field('Termin',h('select',{value:d.eventId,onChange:function(e){self.waehle(d.id,e.target.value)}},termine.map(function(e){
            return h('option',{key:e.id,value:e.id},'KW '+(e.sourceKW||C.computedKW(e))+' · '+M.spanne(e)+' · '+e.title);
          }))):null,
          field('An',h('input',{type:'text',inputMode:'email',value:d.an,placeholder:'Empfänger eintragen',onChange:function(e){self.set('an',e.target.value)}})),
          field('Betreff',h('input',{type:'text',value:d.betreff,onChange:function(e){self.set('betreff',e.target.value)}})),
          field('Text',h('textarea',{rows:14,value:d.text,onChange:function(e){self.set('text',e.target.value)}})),
          d.hinweis?h('p',{className:'lq-vorlagen__tipp'},d.hinweis):null,
          h('div',{className:'lq-vorlagen__aktionen'},
            h('a',{className:'btn btn-primary',href:link.href,onClick:function(){self.oeffnen(link)}},h(Icon,{name:'mail',size:17}),h('span',null,'Im Mailprogramm öffnen')),
            h(Button,{icon:'copy',onClick:this.kopieren},'Text kopieren'),
            h(Button,{icon:'reset',onClick:function(){self.waehle(d.id,d.eventId)}},'Zurücksetzen')),
          this.state.meldung?h('p',{className:'lq-meldung',role:'status'},this.state.meldung):null)));
  }
}

// =====================================================================
// Werkzeugleiste mit Export-Menü
// =====================================================================
class ExportMenue extends R.Component{
  constructor(p){super(p);this.taste=this.taste.bind(this)}
  componentDidMount(){var self=this;this.aussen=function(e){if(self.el&&self.el.open&&!self.el.contains(e.target))self.el.open=false};document.addEventListener('click',this.aussen)}
  componentWillUnmount(){document.removeEventListener('click',this.aussen)}
  taste(e){if(e.key==='Escape'&&this.el&&this.el.open){this.el.open=false;var s=this.el.querySelector('summary');if(s)s.focus()}}
  render(){
    var self=this,p=this.props;
    var eintrag=function(icon,label,fn){return h('li',{key:label},h('button',{type:'button',className:'lq-menue__eintrag',
      onClick:function(){if(self.el)self.el.open=false;fn()}},h(Icon,{name:icon,size:17}),h('span',null,label)))};
    return h('details',{className:'lq-menue',ref:function(n){self.el=n},onKeyDown:this.taste},
      h('summary',{className:'btn','aria-label':'Exportieren'},h(Icon,{name:'download',size:17}),h('span',null,'Export')),
      h('ul',{className:'lq-menue__liste'},
        eintrag('calendar','Outlook / iCal',p.onIcs),
        eintrag('print','PDF / Drucken',p.onPdf),
        eintrag('download','Sicherung (JSON)',p.onBackup)));
  }
}
function Werkzeugleiste(p){
  return h('div',{className:'lq-werkzeugleiste'},
    h('div',{className:'bw-search'},
      h('label',{className:'lq-sr',htmlFor:'lq-suche'},'Termine durchsuchen'),
      h('input',{id:'lq-suche',type:'search',value:p.search,placeholder:'Suchen … tippfehlertolerant',onChange:function(e){p.setSearch(e.target.value)}}),
      h('button',{type:'button',onClick:function(){p.setSearch('')},disabled:!sucheAktiv(p.search),title:'Sucheingabe leeren'},'Leeren')),
    h('span',{className:'lq-werkzeugleiste-trenner'}),
    h(Button,{icon:'plus',kind:'primary',onClick:p.onNeu},'Termin'),
    h(ExportMenue,{onIcs:p.onIcs,onPdf:p.onPdf,onBackup:p.onBackup}),
    h(Button,{icon:'gear',onClick:p.openOptions},'Optionen'));
}

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
          h('ul',{className:'bw-nav__links'},p.ansichten.map(function(x){
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
function PrintReport(p){var c=p.config,events=p.events,cols=c.columns,ulb=C.requirementProgress(p.allEvents,'ulb8',40),caseEvent=p.allEvents.find(function(e){return e.requirementId==='caseprep2w'}),travel=T.travelAggregate(p.allEvents,'qualifier'),reiseOffen=offeneReiseTermine(p.allEvents).length,headers={kw:'KW',date:'Datum',title:'Termin',location:'Ort',status:'Status',travel:'Dienstreise',category:'Kategorie',participant:'Teilnehmer',notes:'Notizen'},keys=Object.keys(headers).filter(function(k){return cols[k]});function cell(k,e){if(k==='kw')return 'KW '+(e.sourceKW||C.computedKW(e));if(k==='date')return fmtRange(e);if(k==='title')return e.title;if(k==='location')return e.location||'–';if(k==='status')return statusLabel(e);if(k==='travel')return travelShort(e);if(k==='category')return e.category||'–';if(k==='participant')return roleLabel(e);if(k==='notes')return e.notes||'';return''}return h('section',{className:cx('print-report',c.density==='compact'&&'compact',!c.optionalShade&&'no-optional-shade')},h('div',{className:'pr-head'},h('div',{className:'pr-kicker'},'Laufbahnqualifizierung · Terminübersicht'),h('h1',null,c.title||'Persönlicher Terminplan'),h('div',{className:'pr-meta'},'Planstand 15.09.2026 · Ausdruck '+todayDE()+' · '+events.length+' Einträge')),c.includeSummary&&h('div',{className:'pr-summary'},h('div',{className:'pr-stat'},h('b',null,events.filter(function(e){return e.obligation==='Pflicht'}).length),h('span',null,'Pflichtblöcke in Auswahl')),h('div',{className:'pr-stat'},h('b',null,reiseOffen?reiseOffen:travel.ready+'/'+travel.required),h('span',null,reiseOffen?'Termine mit offener Reiseplanung':'Dienstreisen vollständig geplant')),h('div',{className:'pr-stat'},h('b',null,ulb.plannedDays+'/40'),h('span',null,'ULB-Arbeitstage geplant')),h('div',{className:'pr-stat'},h('b',null,caseEvent?'terminiert':'offen'),h('span',null,'2 Wochen Verwaltungsfall'))),h('table',null,h('thead',null,h('tr',null,keys.map(function(k){return h('th',{key:k},headers[k])}))),h('tbody',null,events.map(function(e){return h('tr',{key:e.id,className:e.obligation==='Optional'?'row-optional':''},keys.map(function(k){return h('td',{key:k,className:cx((k==='kw'||k==='date'||k==='status')&&'nowrap',k==='travel'&&'travel-print')},k==='status'?h('span',{className:'pr-status'},cell(k,e)):cell(k,e))}))}))),h('div',{className:'pr-note'},'Hinweis: Grundlage ist der Ausbildungsplan Stand 15.09.2026 (Anlage 2 zur Einladung des MLR vom 16.09.2026). Welche LEL-Lehrgänge zu besuchen sind, ergibt sich aus der gelben Markierung im Plan. Dienstreiseangaben sind persönliche Planungsdaten pro Termin.'),h('div',{className:'pr-footer'},h('span',null,'Laufbahnqualifizierung gD Landwirtschaft'),h('span',null,'Erstellt mit dem Terminplan der Laufbahnqualifizierung V2.9')))}

class OptionsModal extends R.Component{
  constructor(p){super(p);this.state={draft:Object.assign({},p.settings,{selectedOptionalIds:(p.settings.selectedOptionalIds||[]).slice()})};this.save=this.save.bind(this)}
  set(k,v){var d=Object.assign({},this.state.draft);d[k]=v;this.setState({draft:d})}
  setOptional(id,on){var d=Object.assign({},this.state.draft),a=(d.selectedOptionalIds||[]).slice(),i=a.indexOf(id);if(on&&i<0)a.push(id);if(!on&&i>=0)a.splice(i,1);d.selectedOptionalIds=a;this.setState({draft:d})}
  allOptional(on){var d=Object.assign({},this.state.draft);d.selectedOptionalIds=on?this.props.optionalEvents.map(function(e){return e.id}):[];this.setState({draft:d})}
  save(){this.props.onSave(this.state.draft)}
  render(){
    var self=this,d=this.state.draft,opts=this.props.optionalEvents,sel=new Set(d.selectedOptionalIds||[]);
    var text=function(k,label,hinweis,typ){return field(label,h('input',{type:typ||'text',value:d[k]||'',placeholder:hinweis||'',onChange:function(e){self.set(k,e.target.value)}}))};
    var schalter=function(k,titel,erklaerung,aus){return h('label',{className:'setting-line'},
      h('input',{type:'checkbox',checked:!!d[k],disabled:aus,onChange:function(e){self.set(k,e.target.checked)}}),
      h('span',null,h('b',null,titel),erklaerung?h('small',null,erklaerung):null))};
    return h('div',{className:'modal-backdrop',onMouseDown:function(e){if(e.target===e.currentTarget)self.props.onClose()}},
      h('div',{className:'modal settings-modal',role:'dialog','aria-modal':'true','aria-labelledby':'lq-optionen-titel'},
        h('div',{className:'modal-head'},
          h('div',null,h('div',{className:'eyebrow'},'Optionen'),h('h2',{id:'lq-optionen-titel'},'Persönliche Einstellungen')),
          h('button',{type:'button',className:'iconbtn',onClick:this.props.onClose,'aria-label':'Schließen'},h(Icon,{name:'close'}))),
        h('div',{className:'settings-sections'},
          h('section',{className:'settings-card'},
            h('h3',null,'Absender und Ansprechpersonen'),
            h('p',null,'Füllt die E-Mail-Vorlagen. Die Angaben bleiben nur in diesem Browser gespeichert.'),
            h('div',{className:'formgrid'},
              text('absName','Dein Name','Vorname Nachname'),
              text('absDienststelle','Deine Dienststelle','z. B. Regierungspräsidium Freiburg, Abt. 3'),
              text('absTelefon','Deine Telefonnummer (optional)'),
              text('vgName','Vorgesetzte/r – für die Anrede','z. B. Frau Muster'),
              text('vgEmail','E-Mail Vorgesetzte/r','','email'),
              text('vwEmail','E-Mail Dienstwagen / Reisestelle','','email'),
              text('alEmail','E-Mail Ausbildungsleitung','','email'))),
          h('section',{className:'settings-card'},
            h('h3',null,'Freiwillige Bausteine'),
            h('p',null,'Welche freiwilligen Veranstaltungen zu deiner Planung gehören. Fachlich bleiben sie optional.'),
            h('div',{className:'optional-picker-head'},
              h('span',{className:'settings-chip'},sel.size+' von '+opts.length+' ausgewählt'),
              h('div',{className:'optional-picker-actions'},h(Button,{onClick:function(){self.allOptional(true)}},'Alle'),h(Button,{onClick:function(){self.allOptional(false)}},'Keine'))),
            h('div',{className:'optional-list'},opts.map(function(e){
              return h('label',{className:'optional-choice',key:e.id},
                h('input',{type:'checkbox',checked:sel.has(e.id),onChange:function(x){self.setOptional(e.id,x.target.checked)}}),
                h('span',{className:'date'},'KW '+(e.sourceKW||C.computedKW(e))),h('span',{className:'title'},e.title));
            }))),
          h('section',{className:'settings-card'},
            h('h3',null,'Dienstreisen'),
            schalter('travelEnabled','Dienstreisemanagement verwenden','Blendet die Ansicht „Dienstreisen“ und die Reisemarken ein.'),
            schalter('buchungswegGeklaert','Genehmigung und Buchungsweg sind geklärt','Entfernt die Aufgabe aus „Zu erledigen“.'),
            schalter('travelIcsDefault','Reiseinfos in den Kalenderexport aufnehmen','',!d.travelEnabled),
            schalter('travelPdfDefault','Spalte „Dienstreise“ im PDF zeigen','',!d.travelEnabled)),
          h('section',{className:'settings-card'},
            h('h3',null,'Zurücksetzen'),
            h('p',null,'Setzt Termine und Auswahl auf den Ausbildungsplan zurück. Eigene Einträge und Reiseplanung gehen dabei verloren.'),
            h(Button,{kind:'danger',icon:'reset',onClick:this.props.onReset},'Ausgangsstand wiederherstellen'))),
        h('div',{className:'modal-actions'},h('div',{className:'spacer'}),
          h(Button,{onClick:this.props.onClose},'Abbrechen'),
          h(Button,{kind:'primary',icon:'check',onClick:this.save},'Speichern'))));
  }
}

var KATEGORIEN=['LEL','RPK / Verwaltung','Prüfungsvorbereitung','Prüfung','Organisation','Wahlstation','Beratung','ULB-Abordnung','Verwaltungsfall','Sonstiges'];

function CalendarView(p){
  var cur=p.month,y=cur.getFullYear(),m=cur.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),offset=(first.getDay()+6)%7,cells=[],i,heute=T.heute();
  for(i=0;i<offset;i++)cells.push(null);
  for(i=1;i<=last.getDate();i++)cells.push(new Date(y,m,i));
  while(cells.length%7)cells.push(null);
  function move(n){p.setMonth(new Date(y,m+n,1))}
  return h('section',{className:'panel calendar-panel'},
    h('div',{className:'calnav'},
      h(Button,{icon:'chevleft',onClick:function(){move(-1)}},'Zurück'),
      h('h2',null,MONTHS[m]+' '+y),
      h(Button,{icon:'chevright',onClick:function(){move(1)}},'Weiter')),
    h('div',{className:'calgrid'},
      ['Mo','Di','Mi','Do','Fr','Sa','So'].map(function(w){return h('div',{className:'dow',key:w},w)}),
      cells.map(function(date,idx){
        if(!date)return h('div',{className:'day empty',key:'e'+idx});
        var iso=C.dateToISO(date),ft=T.feiertag(iso),evs=p.events.filter(function(e){return e.start&&e.end&&e.start<=iso&&e.end>=iso});
        return h('div',{className:cx('day',ft&&'is-feiertag',iso===heute&&'is-heute'),key:iso},
          h('div',{className:'daynum'},date.getDate(),h('small',null,'KW '+C.isoWeekInfo(iso).week)),
          ft?h('div',{className:'lq-feiertag'},ft):null,
          h('div',{className:'dayevents'},evs.map(function(e){
            return h('button',{type:'button',key:e.id,className:cx('cal-event',statusClass(e)),onClick:function(){p.onEdit(e)},title:e.title},
              e.obligation==='Optional'?'○ ':'● ',e.title,
              (p.showTravel&&T.normalizeTravel(e.travel).required==='yes')?h('span',{className:'travel-mini',title:travelShort(e)},' · Reise'):null);
          })));
      })));
}

function TableView(p){
  return h('section',{className:'panel table-panel'},
    h('div',{className:'section-head'},h('div',null,h('h2',null,'Termine'),h('p',null,p.events.length+(p.events.length===1?' Eintrag':' Einträge')))),
    h('div',{className:'table-scroll'},h('table',{className:'lq-tabelle'},
      h('thead',null,h('tr',null,
        h('th',{scope:'col'},'KW'),h('th',{scope:'col'},'Datum'),h('th',{scope:'col'},'Termin'),h('th',{scope:'col'},'Status'),
        p.showTravel?h('th',{scope:'col'},'Dienstreise'):null,
        h('th',{scope:'col'},h('span',{className:'lq-sr'},'Bearbeiten')))),
      h('tbody',null,p.events.map(function(e){
        return h('tr',{key:e.id,className:e.done?'is-erledigt':null},
          h('td',{className:'nowrap'},'KW '+(e.sourceKW||C.computedKW(e))),
          h('td',{className:'nowrap'},fmtKurz(e)),
          h('td',null,
            h('b',null,markiert(e.title,p.suche)),
            h('div',{className:'lq-zeile-leise'},markiert(e.location||'–',p.suche),p.zeigeRolle?' · '+roleLabel(e):''),
            e.notes?h('div',{className:'row-note',title:e.notes},e.notes):null),
          h('td',null,e.done?h(Badge,{kind:'ok'},'erledigt'):h(Badge,{kind:statusClass(e),lock:isProtected(e)},statusLabel(e))),
          p.showTravel?h('td',null,e.kind==='milestone'?'–':h(TravelMark,{event:e,showNone:true})):null,
          h('td',null,h('button',{type:'button',className:'iconbtn',onClick:function(){p.onEdit(e)},'aria-label':'Bearbeiten: '+e.title},h(Icon,{name:'edit'}))));
      })))));
}

class Editor extends R.Component{
  constructor(p){super(p);var f=Object.assign({},p.event);f.travel=T.normalizeTravel(f.travel);this.state={f:f};this.setField=this.setField.bind(this);this.setTravel=this.setTravel.bind(this);this.submit=this.submit.bind(this)}
  setField(k,v){var f=Object.assign({},this.state.f);f[k]=v;if(k==='start'&&f.end&&f.end<v)f.end=v;if(k==='category'){if(v==='ULB-Abordnung')f.requirementId='ulb8';else if(v==='Verwaltungsfall')f.requirementId='caseprep2w';else if(f.requirementId==='ulb8'||f.requirementId==='caseprep2w')delete f.requirementId;}this.setState({f:f})}
  setTravel(patch){var f=Object.assign({},this.state.f);f.travel=reisePatch(f.travel,patch);this.setState({f:f})}
  submit(e){e.preventDefault();var out=Object.assign({},this.state.f);out.travel=T.normalizeTravel(out.travel);if(!String(out.title||'').trim()){alert('Bitte einen Titel eingeben.');return}if(!out.start||!out.end){alert('Bitte Start- und Enddatum eintragen.');return}if(out.end<out.start)out.end=out.start;if(!out.sourceKW||out.requirementId==='ulb8'||out.requirementId==='caseprep2w')out.sourceKW=C.computedKW(out);if(out.requirementId==='ulb8'&&out.creditDays!==''&&out.creditDays!=null){var n=Number(out.creditDays);if(!Number.isFinite(n)||n<0){alert('Anrechenbare Arbeitstage müssen eine Zahl ab 0 sein.');return}out.creditDays=n;}this.props.onSave(out)}
  render(){
    var p=this.props,f=this.state.f,t=T.normalizeTravel(f.travel),prot=isProtected(p.event),self=this,isUlb=f.requirementId==='ulb8'||f.category==='ULB-Abordnung';
    var inp=function(k,typ,extra){return h('input',Object.assign({type:typ||'text',value:f[k]||'',onChange:function(e){self.setField(k,e.target.value)}},extra||{}))};
    var reise=p.travelEnabled!==false&&f.kind!=='milestone';
    return h('div',{className:'modal-backdrop',onMouseDown:function(e){if(e.target===e.currentTarget)p.onClose()}},
      h('form',{className:'modal',role:'dialog','aria-modal':'true','aria-labelledby':'lq-editor-titel',onSubmit:this.submit},
        h('div',{className:'modal-head'},
          h('div',null,h('div',{className:'eyebrow'},p.isNew?'Neuer Termin':'Termin bearbeiten'),h('h2',{id:'lq-editor-titel'},p.isNew?'Termin anlegen':p.event.title)),
          h('button',{type:'button',className:'iconbtn',onClick:p.onClose,'aria-label':'Schließen'},h(Icon,{name:'close'}))),
        prot?h('div',{className:'locknote'},h(Icon,{name:'lock',size:16}),h('div',null,h('b',null,'Optional ist geschützt.'),h('span',null,' Die Kennzeichnung stammt aus dem Ausbildungsplan und bleibt unverändert.'))):null,
        f.aufgabe?h('div',{className:'lq-editor-erledigt'},h(Haken,{label:'Erledigt',checked:!!f.done,onChange:function(v){self.setField('done',v)}})):null,
        h('div',{className:'formgrid'},
          field('Titel',inp('title'),'wide'),
          field('Start',inp('start','date')),
          field('Ende',inp('end','date')),
          field('Beginn (optional)',inp('startTime','time')),
          field('Ende Uhrzeit (optional)',inp('endTime','time')),
          field('KW',inp('sourceKW','text',{placeholder:'wird automatisch berechnet'})),
          field('Status',h('select',{value:f.obligation||'Pflicht',disabled:prot,onChange:function(e){self.setField('obligation',e.target.value)}},
            h('option',{value:'Pflicht'},'Pflicht'),h('option',{value:'Optional'},'Optional'),h('option',{value:'Offen'},'Offen'))),
          field('Teilnehmer',h('select',{value:f.relevance||'Qualifizierer',onChange:function(e){self.setField('relevance',e.target.value)}},
            h('option',{value:'Qualifizierer'},'Qualifizierer'),h('option',{value:'Beide'},'Beide'),h('option',{value:'Anwärter'},'Anwärter'))),
          field('Kategorie',h('select',{value:f.category||'Sonstiges',onChange:function(e){self.setField('category',e.target.value)}},
            KATEGORIEN.map(function(x){return h('option',{value:x,key:x},x)}))),
          isUlb?field('Anrechenbare Arbeitstage',h('input',{type:'number',min:'0',step:'1',value:f.creditDays==null?'':f.creditDays,placeholder:'leer = Mo–Fr automatisch',onChange:function(e){self.setField('creditDays',e.target.value)}})):null,
          field('Ort',inp('location'),'wide'),
          field('Notizen',h('textarea',{rows:4,value:f.notes||'',onChange:function(e){self.setField('notes',e.target.value)}}),'wide'),
          reise?h('section',{className:'travel-section'},
            h('div',{className:'travel-section-head'},
              h('h3',null,'Dienstreise'),
              h('label',{className:'lq-inline',htmlFor:'lq-ed-bedarf'},h('span',null,'Erforderlich'),
                h('select',{id:'lq-ed-bedarf',value:t.required,onChange:function(e){self.setTravel({required:e.target.value})}},
                  h('option',{value:'open'},'klären'),h('option',{value:'yes'},'ja'),h('option',{value:'no'},'nein')))),
            t.required==='yes'?h(ReiseSchritte,{event:f,idPrefix:'ed-',onPatch:self.setTravel}):null,
            field('Reisehinweise / Buchungsdaten',h('textarea',{rows:3,value:t.notes,placeholder:'z. B. Zugverbindung, Buchungsnummer, Zimmer',onChange:function(e){self.setTravel({notes:e.target.value})}}),'travel-note')):null,
          isUlb?h('div',{className:'formhint'},'Ohne eigene Angabe zählt das Dashboard die Werktage Montag bis Freitag. Feiertage oder Sonderfälle korrigierst du über „Anrechenbare Arbeitstage“.'):null),
        h('div',{className:'modal-actions'},
          p.isNew?null:h(Button,{kind:'danger',onClick:function(){if(confirm('Termin wirklich löschen?'))p.onDelete(p.event.id)}},'Löschen'),
          h('div',{className:'spacer'}),
          h(Button,{onClick:p.onClose},'Abbrechen'),
          h('button',{className:'btn btn-primary',type:'submit'},h(Icon,{name:'check',size:17}),h('span',null,'Speichern')))));
  }
}

function ansichten(settings){
  return [{id:'overview',label:'Übersicht'},{id:'table',label:'Termine'},{id:'calendar',label:'Kalender'}]
    .concat(settings.travelEnabled!==false?[{id:'travel',label:'Dienstreisen'}]:[])
    .concat([{id:'mail',label:'Vorlagen'}]);
}

class App extends R.Component{
  constructor(p){
    super(p);
    var events=safeLoad(),settings=safeLoadSettings(events),v='overview';
    try{v=localStorage.getItem(VIEW)||localStorage.getItem(VIEW_OLD)||v}catch(e){}
    if(ansichten(settings).every(function(a){return a.id!==v}))v='overview';
    var naechster=chronologisch(meineTermine(events,settings)).find(function(e){return e.start&&e.end>=T.heute()});
    var monat=naechster?C.parseDateOnly(naechster.start):new Date(2026,10,1);
    this.state={events:events,settings:settings,view:v,search:'',filter:ladeFilter(),optionsOpen:false,editing:null,creating:null,
      calendarMonth:new Date(monat.getFullYear(),monat.getMonth(),1),icsOpen:false,pdfOpen:false,printReport:null,vorlage:null};
    ['setView','setFilter','saveEvent','removeEvent','exportICS','printPdf','runPrint','reset','addUlb','addCase','saveSettings','patchTravel','sammelReise','openVorlage','erledigt']
      .forEach(function(n){this[n]=this[n].bind(this)},this);
  }
  componentDidMount(){if(window.bwNav)window.bwNav.init()}
  componentDidUpdate(prevP,prevS){if(prevS.events!==this.state.events)safeSave(this.state.events);if(prevS.settings!==this.state.settings)safeSaveSettings(this.state.settings);if(window.bwNav)window.bwNav.init()}
  merkeAnsicht(v){try{localStorage.setItem(VIEW,v)}catch(e){}}
  setView(v){this.setState({view:v,vorlage:null});this.merkeAnsicht(v);window.scrollTo(0,0)}
  setFilter(f){speichereFilter(f);this.setState({filter:f})}
  openVorlage(id,eventId){this.setState({view:'mail',vorlage:{id:id,eventId:eventId||'',n:Date.now()}});this.merkeAnsicht('mail');window.scrollTo(0,0)}
  saveSettings(settings){this.setState({settings:settings,optionsOpen:false,view:(settings.travelEnabled===false&&this.state.view==='travel')?'overview':this.state.view})}
  sammelReise(ids){var set=new Set(ids);this.setState({events:this.state.events.map(function(e){return set.has(e.id)?Object.assign({},e,{travel:reisePatch(e.travel,{required:'yes'})}):e})})}
  patchTravel(id,patch){this.setState({events:this.state.events.map(function(e){return e.id===id?Object.assign({},e,{travel:reisePatch(e.travel,patch)}):e})})}
  erledigt(a){
    if(a.erledigenOption){var s=Object.assign({},this.state.settings);s[a.erledigenOption]=true;this.setState({settings:s});return}
    if(a.erledigen)this.setState({events:this.state.events.map(function(e){return e.id===a.erledigen?Object.assign({},e,{done:true}):e})});
  }
  saveEvent(incoming){var prev=this.state.events,i=prev.findIndex(function(x){return x.id===incoming.id}),next=prev.slice(),settings=this.state.settings;if(i<0)next.push(incoming);else next[i]=C.mergePlanEvent(prev[i],incoming,{mode:'manual'});if(i<0&&incoming.obligation==='Optional'&&(incoming.relevance||'Beide')!=='Anwärter'&&settings.selectedOptionalIds.indexOf(incoming.id)<0)settings=Object.assign({},settings,{selectedOptionalIds:settings.selectedOptionalIds.concat([incoming.id])});this.setState({events:next,settings:settings,editing:null,creating:null})}
  removeEvent(id){this.setState({events:this.state.events.filter(function(x){return x.id!==id}),settings:Object.assign({},this.state.settings,{selectedOptionalIds:this.state.settings.selectedOptionalIds.filter(function(x){return x!==id})}),editing:null})}
  reset(){if(confirm('Alle eigenen Änderungen verwerfen und den Ausbildungsplan wiederherstellen? Absender und Ansprechpersonen bleiben erhalten.')){var events=D.makeDefaultEvents(),alt=this.state.settings,neu=defaultSettings(events);['absName','absDienststelle','absTelefon','vgName','vgEmail','vwEmail','alEmail'].forEach(function(k){neu[k]=alt[k]||''});this.setState({events:events,settings:neu,optionsOpen:false})}}
  addUlb(){this.setState({creating:{id:uid(),title:'ULB-Abordnung – Block',start:'',end:'',sourceKW:'',category:'ULB-Abordnung',obligation:'Pflicht',statusOrigin:'manual',relevance:'Qualifizierer',requirementId:'ulb8',creditDays:'',location:'',travel:{required:'open'},notes:'Teil der insgesamt 8 Wochen ULB-Abordnung. Die Abordnung darf auf mehrere Blöcke verteilt werden.'}})}
  addCase(){this.setState({creating:{id:uid(),title:'Fallbearbeitung Verwaltungsprüfung an ULB',start:'',end:'',sourceKW:'',category:'Verwaltungsfall',obligation:'Pflicht',statusOrigin:'manual',relevance:'Qualifizierer',requirementId:'caseprep2w',location:'ULB',travel:{required:'open'},notes:'Persönliche zweiwöchige Fallbearbeitung zur Vorbereitung auf die praktische Verwaltungsprüfung.'}})}
  exportICS(){this.setState({icsOpen:true})}
  printPdf(){this.setState({pdfOpen:true})}
  runPrint(config,events){var self=this,style=document.getElementById('lq-print-page-style');if(!style){style=document.createElement('style');style.id='lq-print-page-style';document.head.appendChild(style)}style.textContent='@page{size:A4 '+(config.orientation==='portrait'?'portrait':'landscape')+';margin:12mm}';document.body.classList.add('lq-printing');this.setState({printReport:{config:config,events:events}},function(){var cleanup=function(){document.body.classList.remove('lq-printing');self.setState({printReport:null});window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup);setTimeout(function(){window.print()},80);setTimeout(function(){if(document.body.classList.contains('lq-printing'))cleanup()},3000)})}
  render(){
    var self=this,s=this.state,settings=s.settings,reisenAn=settings.travelEnabled!==false,
        visible=sichtbar(s.events,settings,s.filter,s.search),
        zeitlich=chronologisch(visible),
        currentIds=visible.map(function(e){return e.id}),
        zeigeRolle=s.filter.teilnehmer!=='qualifizierer',
        mitFilter=s.view==='overview'||s.view==='table'||s.view==='calendar',
        optionalEvents=C.filterEvents(s.events,{participant:'qualifier',status:'optional'}),
        bearbeiten=function(e){self.setState({editing:e})};
    var ansicht=s.view==='calendar'
      ?h(CalendarView,{events:zeitlich,showTravel:reisenAn,onEdit:bearbeiten,month:s.calendarMonth,setMonth:function(v){self.setState({calendarMonth:v})}})
      :s.view==='table'
      ?h(TableView,{events:zeitlich,suche:s.search,showTravel:reisenAn,zeigeRolle:zeigeRolle,onEdit:bearbeiten})
      :s.view==='travel'
      ?h(ReiseAnsicht,{events:reiseTermine(s.events,settings),onPatch:this.patchTravel,onSammel:this.sammelReise,onEdit:bearbeiten,onVorlage:this.openVorlage})
      :s.view==='mail'
      ?h(VorlagenAnsicht,{key:s.vorlage?[s.vorlage.id,s.vorlage.eventId,s.vorlage.n].join('|'):'standard',start:s.vorlage,events:s.events,settings:settings,onOptionen:function(){self.setState({optionsOpen:true})}})
      :h(Overview,{events:sucheAktiv(s.search)?visible:zeitlich,suche:s.search,showTravel:reisenAn,zeigeRolle:zeigeRolle,aufgaben:aufgaben(s.events,settings),
          onEdit:bearbeiten,onAddUlb:this.addUlb,onAddCase:this.addCase,onView:this.setView,onVorlage:this.openVorlage,onErledigt:this.erledigt});

    return h('div',{className:'lq-shell'},
      h(Kopfnavigation,{view:s.view,ansichten:ansichten(settings),onChange:this.setView}),
      h('main',{className:'bw-app bw-app--weit lq-inhalt',id:'inhalt'},
        h('div',{className:'lq-titelzeile'},
          h('div',null,h('div',{className:'eyebrow'},'Laufbahnqualifizierung · Qualifizierer'),h('h1',null,'Terminplan 2026/27')),
          h(Badge,{kind:'neutral'},'V2.9 · Plan 15.09.2026')),
        h(Werkzeugleiste,{
          search:s.search,
          setSearch:function(v){self.setState({search:v,view:(v&&!mitFilter)?'overview':s.view})},
          openOptions:function(){self.setState({optionsOpen:true})},
          onNeu:function(){self.setState({creating:{id:uid(),title:'',start:'2027-01-01',end:'2027-01-01',sourceKW:'',category:'Sonstiges',obligation:'Pflicht',statusOrigin:'manual',relevance:'Qualifizierer',location:'',travel:{required:'open'},notes:''}})},
          onIcs:this.exportICS,onPdf:this.printPdf,
          onBackup:function(){download('laufbahnqualifizierung_sicherung.json','application/json',JSON.stringify({version:'2.9',events:s.events,settings:s.settings},null,2))}}),
        mitFilter?h(FilterLeiste,{filter:s.filter,events:s.events,settings:settings,onChange:this.setFilter}):null,
        ansicht),
      h('footer',{className:'bw-footer'},
        h('div',{className:'bw-app bw-app--weit lq-footer-innen'},
          h(Marke,{negativ:true}),
          h('span',{className:'bw-klein'},'Persönliche Daten bleiben im Browser dieses Rechners · Änderungen des Ausbildungsplans vorbehalten'))),
      s.printReport?h(PrintReport,{config:s.printReport.config,events:s.printReport.events,allEvents:s.events}):null,
      s.icsOpen?h(IcsExportModal,{events:s.events,currentFilters:{visibleIds:currentIds,search:s.search,year:'all'},currentEvents:zeitlich,settings:settings,onClose:function(){self.setState({icsOpen:false})}}):null,
      s.pdfOpen?h(PdfExportModal,{events:s.events,currentFilters:{visibleIds:currentIds,search:s.search,year:'all'},currentEvents:zeitlich,settings:settings,onClose:function(){self.setState({pdfOpen:false})},onPrint:this.runPrint}):null,
      s.optionsOpen?h(OptionsModal,{settings:settings,optionalEvents:optionalEvents,onClose:function(){self.setState({optionsOpen:false})},onSave:this.saveSettings,onReset:this.reset}):null,
      s.editing?h(Editor,{event:s.editing,travelEnabled:reisenAn,onClose:function(){self.setState({editing:null})},onSave:this.saveEvent,onDelete:this.removeEvent}):null,
      s.creating?h(Editor,{event:s.creating,isNew:true,travelEnabled:reisenAn,onClose:function(){self.setState({creating:null})},onSave:this.saveEvent}):null);
  }
}

RD.render(h(App),document.getElementById('root'));
})();
