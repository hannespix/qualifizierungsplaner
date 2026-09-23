(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.LQTravel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // ---------------------------------------------------------------- Datum
  // Reine Kalenderdaten (YYYY-MM-DD). Mittags anlegen, damit Sommerzeit-
  // wechsel nie einen Tag verschieben.
  function parse(iso){var p=String(iso||'').split('-').map(Number);return new Date(p[0],(p[1]||1)-1,p[2]||1,12)}
  function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function plusTage(v,n){var d=parse(v);d.setDate(d.getDate()+n);return iso(d)}
  function heute(){return iso(new Date())}
  function tageBis(v){return Math.round((parse(v)-parse(heute()))/86400000)}
  function plusMonate(v,n){
    var d=parse(v),tag=d.getDate();
    d.setDate(1);d.setMonth(d.getMonth()+n);
    var letzter=new Date(d.getFullYear(),d.getMonth()+1,0,12).getDate();
    d.setDate(Math.min(tag,letzter));
    return iso(d);
  }

  // Gesetzliche Feiertage Baden-Württemberg (Ostern nach Gauß).
  function ostersonntag(y){
    var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),
        g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,
        l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;
    return iso(new Date(y,Math.floor(n/31)-1,(n%31)+1,12));
  }
  var feiertagCache={};
  function feiertageBW(y){
    if(feiertagCache[y])return feiertagCache[y];
    var o=ostersonntag(y),liste={};
    liste[y+'-01-01']='Neujahr';
    liste[y+'-01-06']='Heilige Drei Könige';
    liste[plusTage(o,-2)]='Karfreitag';
    liste[plusTage(o,1)]='Ostermontag';
    liste[y+'-05-01']='Tag der Arbeit';
    liste[plusTage(o,39)]='Christi Himmelfahrt';
    liste[plusTage(o,50)]='Pfingstmontag';
    liste[plusTage(o,60)]='Fronleichnam';
    liste[y+'-10-03']='Tag der Deutschen Einheit';
    liste[y+'-11-01']='Allerheiligen';
    liste[y+'-12-25']='1. Weihnachtstag';
    liste[y+'-12-26']='2. Weihnachtstag';
    return (feiertagCache[y]=liste);
  }
  function feiertag(v){var y=parse(v).getFullYear();return feiertageBW(y)[v]||''}
  function istArbeitstag(v){var t=parse(v).getDay();return t!==0&&t!==6&&!feiertag(v)}
  // n Arbeitstage (Mo–Fr ohne Feiertage) vor v. Samstage zählen bewusst nicht
  // mit – so liegt die Frist im Zweifel früher, nie zu spät.
  function minusArbeitstage(v,n){var d=v,z=0;while(z<n){d=plusTage(d,-1);if(istArbeitstag(d))z++}return d}

  // ---------------------------------------------------------------- Modell
  var WAHL={yes:1,no:1,open:1};
  function normalizeTravel(input){
    var t=(input&&typeof input==='object')?input:{};
    return {
      required: WAHL[t.required]?t.required:'open',
      requested: !!t.requested||!!t.approved,
      approved: !!t.approved,
      transport: t.transport||'',
      ticketBooked: !!t.ticketBooked,
      carBooked: !!t.carBooked,
      overnightRequired: WAHL[t.overnightRequired]?t.overnightRequired:'open',
      lodging: t.lodging||'',
      hotelBooked: !!t.hotelBooked,
      arrivalEve: !!t.arrivalEve,
      canteen: !!t.canteen,
      documentsComplete: !!t.documentsComplete,
      expensesDone: !!t.expensesDone,
      notes: t.notes||''
    };
  }
  function transportLabel(v){return v==='train'?'Bahn':v==='companyCar'?'Dienstwagen':v==='car'?'Privat-PKW':v==='other'?'Sonstiges':'noch offen'}
  function lodgingLabel(v){return v==='gaestehaus'?'Gästehaus der LEL':v==='hotel'?'Hotel':v==='other'?'Sonstige Unterkunft':'noch offen'}

  function travelStatus(event){
    var t=normalizeTravel(event&&event.travel);
    if(t.required==='no') return {code:'none',label:'Keine Dienstreise',planningComplete:true,settlementComplete:true,missing:[]};
    if(t.required==='open') return {code:'open',label:'Reisebedarf offen',planningComplete:false,settlementComplete:false,missing:['Dienstreise klären']};
    var missing=[];
    if(!t.approved) missing.push(t.requested?'Genehmigung ausstehend':'Dienstreiseantrag');
    if(!t.transport) missing.push('Verkehrsmittel');
    if(t.transport==='train'&&!t.ticketBooked) missing.push('Zugticket');
    if(t.transport==='companyCar'&&!t.carBooked) missing.push('Dienstwagen');
    if(t.overnightRequired==='open') missing.push('Übernachtung klären');
    if(t.overnightRequired==='yes'&&!t.hotelBooked) missing.push('Unterkunft');
    var ready=missing.length===0;
    return {code:ready?'ready':'incomplete',label:ready?'Reise vollständig geplant':'Reiseplanung offen',planningComplete:ready,settlementComplete:!!t.expensesDone,missing:missing};
  }

  // Vier Schritte je Reise für die Dienstreisen-Ansicht.
  // status: 'done' | 'open' | 'na' (entfällt) | 'later' (erst nach dem Termin)
  function schritte(event){
    var t=normalizeTravel(event&&event.travel),vorbei=event&&event.end&&event.end<heute();
    var fahrt=!t.transport?'open'
      :t.transport==='train'?(t.ticketBooked?'done':'open')
      :t.transport==='companyCar'?(t.carBooked?'done':'open')
      :'done';
    var unterkunft=t.overnightRequired==='no'?'na':(t.overnightRequired==='yes'&&t.hotelBooked)?'done':'open';
    return {
      genehmigung:t.approved?'done':'open',
      fahrt:fahrt,
      unterkunft:unterkunft,
      abrechnung:t.expensesDone?'done':(vorbei?'open':'later')
    };
  }

  // Gästehaus: Abmeldung spätestens 5 Werktage vor dem Lehrgang (Informationsblatt).
  function stornoFrist(event){
    var t=normalizeTravel(event&&event.travel);
    if(!event||!event.start||t.lodging!=='gaestehaus'||!t.hotelBooked) return '';
    return minusArbeitstage(event.start,5);
  }
  // Reisekostenvergütung: 6 Monate nach Ende der Dienstreise (LBV).
  function abrechnungsFrist(event){return event&&event.end?plusMonate(event.end,6):''}

  function matchesTravelFilter(event,filter){
    if(!filter||filter==='all') return true;
    var t=normalizeTravel(event&&event.travel),s=travelStatus(event);
    if(filter==='required') return t.required==='yes';
    if(filter==='open') return t.required==='open'||(t.required==='yes'&&(!s.planningComplete||(!t.expensesDone&&event.end<heute())));
    if(filter==='ready') return t.required==='yes'&&s.planningComplete;
    if(filter==='done') return t.required==='no'||(t.required==='yes'&&s.planningComplete&&t.expensesDone);
    return true;
  }
  function yn(v,yes,no,open){return v==='yes'?yes:v==='no'?no:open}
  function travelSummary(event){
    var t=normalizeTravel(event&&event.travel);
    if(t.required==='no') return 'Dienstreise: nicht erforderlich';
    if(t.required==='open') return 'Dienstreise: noch zu klären';
    var lines=['Dienstreise: erforderlich',
      'Genehmigung: '+(t.approved?'erteilt':t.requested?'beantragt':'offen'),
      'Verkehrsmittel: '+transportLabel(t.transport)];
    if(t.transport==='train') lines.push('Zugticket: '+(t.ticketBooked?'gebucht':'offen'));
    if(t.transport==='companyCar') lines.push('Dienstwagen: '+(t.carBooked?'reserviert':'offen'));
    lines.push('Übernachtung: '+yn(t.overnightRequired,(t.lodging?lodgingLabel(t.lodging)+', ':'')+(t.hotelBooked?'reserviert':'noch offen'),'nicht erforderlich','noch zu klären'));
    if(t.arrivalEve) lines.push('Anreise am Vorabend');
    lines.push('Reisekostenabrechnung: '+(t.expensesDone?'erledigt':'offen'));
    if(t.notes) lines.push('Reisehinweise: '+t.notes);
    return lines.join('\n');
  }
  function roleMatch(e,participant){
    if(participant==='all') return true;
    if(participant==='qualifier') return e.relevance==='Qualifizierer'||e.relevance==='Beide';
    if(participant==='trainee') return e.relevance==='Anwärter'||e.relevance==='Beide';
    return true;
  }
  function travelAggregate(events,participant){
    var list=(events||[]).filter(function(e){return roleMatch(e,participant||'qualifier')});
    var req=list.filter(function(e){return normalizeTravel(e.travel).required==='yes'});
    return {
      required:req.length,
      ready:req.filter(function(e){return travelStatus(e).planningComplete}).length,
      open:req.filter(function(e){return !travelStatus(e).planningComplete}).length,
      settlementOpen:req.filter(function(e){return !travelStatus(e).settlementComplete}).length
    };
  }
  return {
    normalizeTravel:normalizeTravel,travelStatus:travelStatus,schritte:schritte,
    matchesTravelFilter:matchesTravelFilter,travelSummary:travelSummary,travelAggregate:travelAggregate,
    transportLabel:transportLabel,lodgingLabel:lodgingLabel,
    stornoFrist:stornoFrist,abrechnungsFrist:abrechnungsFrist,
    feiertag:feiertag,feiertageBW:feiertageBW,istArbeitstag:istArbeitstag,minusArbeitstage:minusArbeitstage,
    plusMonate:plusMonate,tageBis:tageBis,heute:heute
  };
});
