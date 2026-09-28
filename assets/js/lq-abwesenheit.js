(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.LQAbwesenheit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // Abwesenheiten von der Stammdienststelle wegen der Laufbahnqualifizierung:
  // nur Pflichtteile, einschließlich ULB-Abordnung, in Arbeitstagen
  // (Montag bis Freitag ohne gesetzliche Feiertage in Baden-Württemberg).

  var ULB_SOLL=40;
  var GRUPPEN=[
    {id:'lel',titel:'Lehrgänge an der LEL'},
    {id:'rpk',titel:'Lehrgang Verwaltung, RP Karlsruhe'},
    {id:'vorbereitung',titel:'Prüfungsvorbereitung'},
    {id:'pruefung',titel:'Praktische Prüfung'},
    {id:'ulb',titel:'ULB-Abordnung'},
    {id:'sonstige',titel:'Weitere Pflichttermine'},
  ];

  function T(){return globalThis.LQTravel}
  function plusTag(iso){var p=iso.split('-').map(Number),d=new Date(p[0],p[1]-1,p[2]+1,12);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function arbeitstage(start,ende){var liste=[],d=start;while(d<=ende){if(T().istArbeitstag(d))liste.push(d);d=plusTag(d)}return liste}
  function gueltigeZahl(v){return v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=0}

  function gruppeVon(e){
    if(!e.start||!e.end||e.kind==='milestone')return null;
    if((e.relevance||'Beide')==='Anwärter'||e.obligation==='Optional')return null;
    if(e.requirementId==='ulb8'||e.category==='ULB-Abordnung')return 'ulb';
    if(e.requirementId==='caseprep2w'||e.planWindow)return 'vorbereitung';
    if(e.category==='LEL')return 'lel';
    if(e.category==='RPK / Verwaltung')return 'rpk';
    if(e.category==='Prüfung')return 'pruefung';
    return e.obligation==='Pflicht'?'sonstige':null;
  }

  function berechnen(events){
    var liste=(events||[]).slice().sort(function(a,b){return String(a.start||'').localeCompare(String(b.start||''))});
    // Der eigene Verwaltungsfall ersetzt den Vorbereitungszeitraum aus dem Plan:
    // beides sind dieselben zwei Wochen und dürfen nur einmal zählen.
    var eigenerFall=liste.some(function(e){return e.requirementId==='caseprep2w'&&e.start&&e.end});
    var zeilen=[];
    liste.forEach(function(e){
      var g=gruppeVon(e);
      if(!g||(g==='vorbereitung'&&e.planWindow&&eigenerFall))return;
      var tageListe=arbeitstage(e.start,e.end),tage=tageListe.length;
      if(g==='ulb'&&gueltigeZahl(e.creditDays))tage=Number(e.creditDays);
      else if(gueltigeZahl(e.tageLQ))tage=Math.min(Number(e.tageLQ),tage);
      zeilen.push({id:e.id,gruppe:g,kw:e.sourceKW||'',start:e.start,end:e.end,titel:e.title,ort:e.location||'',
        tage:tage,hinweis:e.abwHinweis||'',offen:false,
        // Nur ungekürzte Zeiträume lassen sich tageweise Jahren und Überschneidungen zuordnen.
        tageListe:tage===tageListe.length?tageListe:null});
    });
    var ulbGeplant=zeilen.filter(function(z){return z.gruppe==='ulb'}).reduce(function(n,z){return n+z.tage},0);
    if(ulbGeplant<ULB_SOLL)zeilen.push({id:'ulb-rest',gruppe:'ulb',kw:'',start:'',end:'',titel:'ULB-Abordnung',ort:'',
      tage:ULB_SOLL-ulbGeplant,hinweis:ulbGeplant?'Rest bis 8 Wochen, noch nicht terminiert':'8 Wochen, noch nicht terminiert',offen:true,tageListe:null});

    var gruppen=GRUPPEN.map(function(g){
      var z=zeilen.filter(function(x){return x.gruppe===g.id});
      return {id:g.id,titel:g.titel,zeilen:z,tage:z.reduce(function(n,x){return n+x.tage},0)};
    }).filter(function(g){return g.zeilen.length});

    var jahre={},offen=0;
    zeilen.forEach(function(z){
      if(z.offen){offen+=z.tage;return}
      if(z.tageListe)z.tageListe.forEach(function(d){var j=d.slice(0,4);jahre[j]=(jahre[j]||0)+1});
      else{var j=z.start.slice(0,4);jahre[j]=(jahre[j]||0)+z.tage}
    });

    // Überschneidungen: derselbe Arbeitstag in zwei Zeilen würde doppelt zählen.
    var belegt={},ueberschneidungen=[];
    zeilen.forEach(function(z){(z.tageListe||[]).forEach(function(d){
      if(belegt[d]&&belegt[d]!==z&&ueberschneidungen.every(function(u){return !(u[0]===belegt[d]&&u[1]===z)}))ueberschneidungen.push([belegt[d],z]);
      else if(!belegt[d])belegt[d]=z;
    })});

    var gesamt=zeilen.reduce(function(n,z){return n+z.tage},0);
    var vorbereitung=gruppen.filter(function(g){return g.id==='vorbereitung'}).reduce(function(n,g){return n+g.tage},0);
    return {gruppen:gruppen,gesamt:gesamt,offen:offen,terminiert:gesamt-offen,jahre:jahre,
      ohneVorbereitung:gesamt-vorbereitung,ulbGeplant:ulbGeplant,ulbSoll:ULB_SOLL,
      ueberschneidungen:ueberschneidungen.map(function(u){return {a:u[0].titel,b:u[1].titel}})};
  }

  return {berechnen:berechnen,ULB_SOLL:ULB_SOLL};
});
