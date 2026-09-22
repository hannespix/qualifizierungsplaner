(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.LQTravel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function normalizeTravel(input){
    var t=(input&&typeof input==='object')?input:{};
    return {
      required: t.required==='yes'||t.required==='no'||t.required==='open'?t.required:'open',
      approved: !!t.approved,
      transport: t.transport||'',
      ticketBooked: !!t.ticketBooked,
      overnightRequired: t.overnightRequired==='yes'||t.overnightRequired==='no'||t.overnightRequired==='open'?t.overnightRequired:'open',
      hotelBooked: !!t.hotelBooked,
      documentsComplete: !!t.documentsComplete,
      expensesDone: !!t.expensesDone,
      notes: t.notes||''
    };
  }
  function travelStatus(event){
    var t=normalizeTravel(event&&event.travel);
    if(t.required==='no') return {code:'none',label:'Keine Dienstreise',planningComplete:true,settlementComplete:true,missing:[]};
    if(t.required==='open') return {code:'open',label:'Reisebedarf offen',planningComplete:false,settlementComplete:false,missing:['Dienstreise klären']};
    var missing=[];
    if(!t.approved) missing.push('Dienstreise geplant/genehmigt');
    if(!t.transport) missing.push('Verkehrsmittel');
    if(t.transport==='train'&&!t.ticketBooked) missing.push('Zugticket');
    if(t.overnightRequired==='open') missing.push('Übernachtung klären');
    if(t.overnightRequired==='yes'&&!t.hotelBooked) missing.push('Übernachtung');
    if(!t.documentsComplete) missing.push('Reiseunterlagen');
    var ready=missing.length===0;
    return {code:ready?'ready':'incomplete',label:ready?'Reise vollständig geplant':'Reiseplanung offen',planningComplete:ready,settlementComplete:!!t.expensesDone,missing:missing};
  }
  function matchesTravelFilter(event,filter){
    if(!filter||filter==='all') return true;
    var t=normalizeTravel(event&&event.travel),s=travelStatus(event);
    if(filter==='required') return t.required==='yes';
    if(filter==='open') return t.required==='open'||(t.required==='yes'&&!s.planningComplete);
    if(filter==='ready') return t.required==='yes'&&s.planningComplete;
    return true;
  }
  function transportLabel(v){return v==='train'?'Bahn':v==='car'?'Privat-PKW':v==='companyCar'?'Dienstwagen':v==='other'?'Sonstiges':'noch offen'}
  function yn(v,yes,no,open){return v==='yes'?yes:v==='no'?no:open}
  function travelSummary(event){
    var t=normalizeTravel(event&&event.travel);
    if(t.required==='no') return 'Dienstreise: nicht erforderlich';
    if(t.required==='open') return 'Dienstreise: noch zu klären';
    var lines=['Dienstreise: erforderlich','Dienstreise geplant/genehmigt: '+(t.approved?'ja':'offen'),'Verkehrsmittel: '+transportLabel(t.transport)];
    if(t.transport==='train') lines.push('Zugticket: '+(t.ticketBooked?'reserviert':'offen'));
    lines.push('Übernachtung: '+yn(t.overnightRequired,t.hotelBooked?'gebucht':'erforderlich, noch offen','nicht erforderlich','noch zu klären'));
    lines.push('Reiseunterlagen: '+(t.documentsComplete?'vollständig':'offen'));
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
  return {normalizeTravel:normalizeTravel,travelStatus:travelStatus,matchesTravelFilter:matchesTravelFilter,travelSummary:travelSummary,travelAggregate:travelAggregate,transportLabel:transportLabel};
});
