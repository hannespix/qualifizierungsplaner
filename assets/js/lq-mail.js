(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.LQMail=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // E-Mail-Vorlagen für alle Vorgänge der Laufbahnqualifizierung.
  // Empfänger im Code sind nur funktionale Adressen aus den Unterlagen.
  // Persönliches (Absender, Vorgesetzte/r) kommt aus den lokalen Optionen.

  var WT=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  var FORTBILDUNG='fortbildung@lel.bwl.de';
  var AZ='MLR21-8414-90/7/1';

  function parse(iso){var p=String(iso||'').split('-').map(Number);return new Date(p[0],(p[1]||1)-1,p[2]||1,12)}
  function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function plusTage(v,n){var d=parse(v);d.setDate(d.getDate()+n);return iso(d)}
  function fmt(v){var d=parse(v);return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear()}
  function tag(v){return WT[parse(v).getDay()]+', '+fmt(v)}
  function spanne(e){
    if(!e||!e.start)return '[Datum]';
    if(e.start===e.end)return fmt(e.start);
    var a=fmt(e.start),b=fmt(e.end);
    return (a.slice(6)===b.slice(6)?a.slice(0,6):a)+'–'+b;
  }
  function kw(e){return 'KW '+(e.sourceKW||'?')}
  function travel(e){return (globalThis.LQTravel?globalThis.LQTravel.normalizeTravel(e&&e.travel):(e&&e.travel)||{})}

  function platzhalter(v,label){v=String(v||'').trim();return v||'['+label+']'}
  function anredeVg(s){var n=String(s.vgName||'').trim();return n?'Guten Tag '+n+',':'Guten Tag,'}
  function gruss(s,formell){
    var z=[formell?'Mit freundlichen Grüßen':'Viele Grüße',platzhalter(s.absName,'Name'),platzhalter(s.absDienststelle,'Dienststelle')];
    if(String(s.absTelefon||'').trim())z.push('Tel. '+s.absTelefon.trim());
    return z.join('\n');
  }
  function zeile(e,mitOrt){return '– '+kw(e)+': '+spanne(e)+(mitOrt&&e.location?', '+e.location:'')+' – '+e.title}

  // ---------------------------------------------------------- Terminlisten
  function meine(ctx){
    var sel=new Set((ctx.settings&&ctx.settings.selectedOptionalIds)||[]);
    return (ctx.events||[]).filter(function(e){
      if(!e.start||(e.relevance||'Beide')==='Anwärter')return false;
      return e.obligation!=='Optional'||sel.has(e.id);
    }).sort(function(a,b){return a.start.localeCompare(b.start)});
  }
  function lelWochen(ctx){return meine(ctx).filter(function(e){return e.category==='LEL'})}
  function reiseTermine(ctx){
    return meine(ctx).filter(function(e){
      if(e.kind==='milestone'||e.planWindow)return false;
      return ['LEL','RPK / Verwaltung','Prüfung','Wahlstation'].indexOf(e.category)>=0||e.requirementId==='ulb8';
    });
  }
  function ersterBlock(ctx){return (ctx.events||[]).find(function(e){return e.id==='lel46'})||lelWochen(ctx)[0]}
  function zusatz(e){
    var t=travel(e),z=[];
    if(e.obligation==='Offen'&&e.category==='LEL')z.push('nur 2 Lehrgangstage, Tage noch offen');
    if(t.arrivalEve)z.push('Anreise am Vorabend');
    return z.length?' ('+z.join(', ')+')':'';
  }
  function ziel(e){
    if(!e)return '[Ziel]';
    if(e.category==='LEL')return 'LEL Schwäbisch Gmünd, Europaplatz 1';
    return e.location||'[Ziel]';
  }

  // ---------------------------------------------------------- Vorlagen
  // termin: false | 'lel' | 'reise' – bestimmt die Terminauswahl.
  var VORLAGEN=[
    { id:'gh-erster', gruppe:'Unterkunft LEL', titel:'Zimmer für den ersten Lehrgang anfragen', termin:false, frist:'2026-10-16',
      zweck:'Reservierung im Gästehaus für den Lehrgang ab 09.11.2026 – Anfrage bis 16.10.2026.',
      build:function(ctx){
        var e=ersterBlock(ctx)||{title:'[Lehrgang]'},t=travel(e),s=ctx.settings||{};
        var an=t.arrivalEve&&e.start?'am Vorabend, '+tag(plusTage(e.start,-1)):(e.start?tag(e.start):'[Datum]');
        return { an:FORTBILDUNG,
          betreff:'Zimmerreservierung Gästehaus – Laufbahnqualifizierung gD, '+spanne(e),
          text:['Sehr geehrte Damen und Herren,','',
            'für den ersten Lehrgang meiner Laufbahnqualifizierung für den gehobenen landwirtschaftstechnischen Dienst („'+e.title+'“, '+spanne(e)+') möchte ich verbindlich ein Zimmer im Gästehaus der LEL reservieren.','',
            'Anreise: '+an,'Abreise: '+(e.end?tag(e.end):'[Datum]'),'',
            'Die Kosten rechne ich über meine Reisekostenabrechnung ab.','',gruss(s,true)].join('\n'),
          hinweis:'Reservierungen sind verbindlich. Anreise am Vorabend stellst du in der Dienstreisen-Ansicht ein – sie wird hier automatisch übernommen.' };
      } },

    { id:'gh-weitere', gruppe:'Unterkunft LEL', titel:'Zimmer für die weiteren Lehrgangswochen', termin:false,
      zweck:'Nach dem ersten Block alle weiteren Wochen verbindlich anmelden.',
      build:function(ctx){
        var erst=ersterBlock(ctx),s=ctx.settings||{};
        var wochen=lelWochen(ctx).filter(function(e){
          var t=travel(e);
          if(erst&&e.id===erst.id)return false;
          if(t.required==='no'||t.overnightRequired==='no')return false;
          return !t.lodging||t.lodging==='gaestehaus';
        });
        return { an:FORTBILDUNG,
          betreff:'Zimmerreservierung Gästehaus – weitere Lehrgangswochen Laufbahnqualifizierung gD',
          text:['Sehr geehrte Damen und Herren,','',
            'für die weiteren Lehrgangswochen meiner Laufbahnqualifizierung für den gehobenen landwirtschaftstechnischen Dienst melde ich mich verbindlich für ein Zimmer im Gästehaus der LEL an:','',
            (wochen.length?wochen.map(function(e){return zeile(e)+zusatz(e)}).join('\n'):'– [keine weiteren Wochen ausgewählt]'),'',
            gruss(s,true)].join('\n'),
          hinweis:'Laut Informationsblatt meldest du dich nach dem ersten Lehrgangsblock bei Abteilung 1 an; das Fortbildungsteam gehört zu Abteilung 1. Aufgeführt sind alle LEL-Wochen, für die du keine andere Unterkunft eingetragen hast.' };
      } },

    { id:'gh-abmeldung', gruppe:'Unterkunft LEL', titel:'Zimmer abmelden', termin:'lel',
      zweck:'Reservierung zurückgeben – spätestens 5 Werktage vor dem Lehrgang.',
      build:function(ctx){
        var e=ctx.event||{title:'[Lehrgang]'},s=ctx.settings||{},T=globalThis.LQTravel;
        var frist=T&&e.start?fmt(T.minusArbeitstage(e.start,5)):'';
        return { an:FORTBILDUNG,
          betreff:'Abmeldung Zimmer Gästehaus – '+spanne(e),
          text:['Sehr geehrte Damen und Herren,','',
            'das für den Lehrgang „'+e.title+'“ ('+spanne(e)+') reservierte Zimmer im Gästehaus kann ich leider nicht in Anspruch nehmen. Hiermit melde ich die Reservierung ab.','',
            gruss(s,true)].join('\n'),
          hinweis:'Abmelden spätestens 5 Werktage vor dem Lehrgang, sonst wird das Zimmer berechnet'+(frist?' – für diesen Termin bis '+frist+'.':'.') };
      } },

    { id:'kantine', gruppe:'Unterkunft LEL', titel:'Mittagessen vorab anmelden', termin:'lel',
      zweck:'Vergünstigtes Mittagessen in der Kantine gibt es nur nach Voranmeldung.',
      build:function(ctx){
        var e=ctx.event||{title:'[Lehrgang]'},s=ctx.settings||{};
        return { an:FORTBILDUNG,
          betreff:'Voranmeldung Mittagessen – '+e.title+', '+spanne(e),
          text:['Sehr geehrte Damen und Herren,','',
            'für den Lehrgang „'+e.title+'“ ('+spanne(e)+') melde ich mich zum Mittagessen in der Kantine der LEL an – an allen Tagen, an denen die Kantine geöffnet hat.','',
            gruss(s,true)].join('\n'),
          hinweis:'Das Informationsblatt nennt keine eigene Adresse für die Voranmeldung. Öffnungstage und Speiseplan kommen vor den Lehrgangswochen – steht dort eine Adresse, nimm diese.' };
      } },

    { id:'dr-klaeren', gruppe:'Dienstreisen', titel:'Genehmigung und Buchungsweg klären', termin:false,
      zweck:'Einmal für alle Reisen: allgemeine Genehmigung, wer bucht Bahn und Dienstwagen, Gästehaus.',
      build:function(ctx){
        var s=ctx.settings||{},liste=reiseTermine(ctx).filter(function(e){return e.requirementId!=='ulb8'});
        return { an:s.vgEmail||'',
          betreff:'Dienstreisen Laufbahnqualifizierung gD – Genehmigung und Buchung',
          text:[anredeVg(s),'',
            'für meine Laufbahnqualifizierung (Einladung des MLR vom 16.09.2026, Az. '+AZ+') stehen folgende Dienstreisen an:','',
            liste.map(function(e){return zeile(e,true)+(e.obligation==='Optional'?' (fakultativ)':'')}).join('\n'),'',
            'Die Reisekosten trägt laut Einladung unsere Dienststelle. Dazu drei Fragen:','',
            '1. Genehmigung: Ist eine allgemeine Dienstreisegenehmigung für diese Termine möglich, oder soll ich jede Reise einzeln in DRIVE-BW beantragen?',
            '2. Fahrt: Buche ich Bahntickets selbst, oder läuft das über eine zentrale Stelle? Gibt es eine BahnCard oder einen Dienstwagen, den ich nutzen soll?',
            '3. Übernachtung: Ich würde im Gästehaus der LEL übernachten (derzeit 40 € pro Nacht, Abrechnung über die Reisekosten). Passt das so?','',
            'Vielen Dank!','',gruss(s,false)].join('\n'),
          hinweis:'Wer bei deiner Dienststelle Tickets und Dienstwagen bucht, steht in keinem der Dokumente – diese Mail klärt es einmalig für alle Termine.' };
      } },

    { id:'dr-antrag', gruppe:'Dienstreisen', titel:'Dienstreise zur Genehmigung ankündigen', termin:'reise',
      zweck:'Begleitmail zum Antrag in DRIVE-BW für einen einzelnen Termin.',
      build:function(ctx){
        var e=ctx.event||{title:'[Termin]'},t=travel(e),s=ctx.settings||{},T=globalThis.LQTravel;
        var uebernachtung=t.overnightRequired==='yes'?(t.lodging?T.lodgingLabel(t.lodging):'ja'):t.overnightRequired==='no'?'nicht erforderlich':'noch offen';
        var z=[anredeVg(s),'',
          'für die Dienstreise zum Termin „'+e.title+'“ ('+spanne(e)+', '+ziel(e)+') habe ich in DRIVE-BW einen Antrag gestellt und bitte um Genehmigung.','',
          'Verkehrsmittel: '+(T?T.transportLabel(t.transport):'[Verkehrsmittel]'),
          'Übernachtung: '+uebernachtung];
        if(t.arrivalEve&&e.start)z.push('Anreise am Vorabend: '+tag(plusTage(e.start,-1)));
        z.push('',gruss(s,false));
        return { an:s.vgEmail||'', betreff:'Dienstreise '+spanne(e)+' – '+e.title+': bitte um Genehmigung', text:z.join('\n'),
          hinweis:'Der Antrag selbst läuft über DRIVE-BW („Dienstreise beantragen“) und ist grundsätzlich vor Reisebeginn zu genehmigen.' };
      } },

    { id:'dr-dienstwagen', gruppe:'Dienstreisen', titel:'Dienstwagen reservieren', termin:'reise',
      zweck:'Reservierung bei der Stelle, die bei dir Dienstwagen vergibt.',
      build:function(ctx){
        var e=ctx.event||{title:'[Termin]'},t=travel(e),s=ctx.settings||{};
        var ab=e.start?(t.arrivalEve?tag(plusTage(e.start,-1))+' (Anreise am Vorabend)':tag(e.start)):'[Datum]';
        return { an:s.vwEmail||'',
          betreff:'Reservierung Dienstwagen – '+spanne(e)+', '+ziel(e),
          text:['Sehr geehrte Damen und Herren,','',
            'für eine Dienstreise möchte ich einen Dienstwagen reservieren:','',
            'Anlass: '+e.title,'Ziel: '+ziel(e),'Abfahrt: '+ab,'Rückkehr: '+(e.end?tag(e.end):'[Datum]'),'',
            'Vielen Dank!','',gruss(s,true)].join('\n'),
          hinweis:'Die Empfängeradresse (Fahrbereitschaft, Verwaltung o. ä.) trägst du einmal unter Optionen ein.' };
      } },

    { id:'bw1-tage', gruppe:'Lehrgänge', titel:'Die 2 Tage bei BW I erfragen', termin:false,
      zweck:'Im Plan steht bei KW 51 und KW 2 nur „2 Tage für LQ, genaue Termine noch offen“.',
      build:function(ctx){
        var s=ctx.settings||{},w=lelWochen(ctx).filter(function(e){return e.obligation==='Offen'});
        return { an:FORTBILDUNG,
          betreff:'Laufbahnqualifizierung gD – Lehrgangstage bei Betriebswirtschaft I',
          text:['Sehr geehrte Damen und Herren,','',
            'laut Ausbildungsplan (Stand 15.09.2026) nehme ich als Teilnehmer der Laufbahnqualifizierung an folgenden Lehrgängen jeweils an 2 Tagen teil; die genauen Tage sind noch offen:','',
            (w.length?w.map(function(e){return zeile(e)}).join('\n'):'– [keine offenen Lehrgänge]'),'',
            'Können Sie mir sagen, an welchen Tagen ich jeweils dabei bin? Das hilft mir bei der Planung von Anreise und Unterkunft.','',
            gruss(s,true)].join('\n'),
          hinweis:'Sobald die Tage feststehen, trägst du sie im Termin ein – dann passt auch die Gästehaus-Reservierung.' };
      } },

    { id:'fakultativ', gruppe:'Lehrgänge', titel:'Fakultative Bausteine abstimmen', termin:false,
      zweck:'Ausbildungswoche RP Karlsruhe und Wahlstationen – laut Einladung mit der Ausbildungsleitung abstimmen.',
      build:function(ctx){
        var s=ctx.settings||{},sel=new Set(s.selectedOptionalIds||[]);
        var alle=(ctx.events||[]).filter(function(e){return e.obligation==='Optional'&&(e.relevance||'Beide')!=='Anwärter'&&e.start}).sort(function(a,b){return a.start.localeCompare(b.start)});
        var gewaehlt=alle.filter(function(e){return sel.has(e.id)});
        var liste=gewaehlt.length?gewaehlt:alle;
        return { an:s.alEmail||'',
          betreff:'Laufbahnqualifizierung gD – Teilnahme an fakultativen Bausteinen',
          text:['Guten Tag,','',
            'laut Einladung des MLR vom 16.09.2026 kann ich fakultativ an der Ausbildungswoche am RP Karlsruhe und an den Wahlstationen der Landesanstalten teilnehmen; dazu soll ich mich mit der Ausbildungsleitung abstimmen.','',
            'Interesse habe ich an:',liste.map(function(e){return zeile(e,true)}).join('\n'),'',
            'Ist eine Teilnahme möglich? Über eine kurze Rückmeldung freue ich mich.','',gruss(s,true)].join('\n'),
          hinweis:gewaehlt.length?'Aufgeführt sind die freiwilligen Bausteine, die du unter Optionen ausgewählt hast.':'Du hast unter Optionen noch keine Auswahl getroffen – deshalb stehen alle freiwilligen Bausteine in der Liste.' };
      } },

    { id:'ulb-anfrage', gruppe:'ULB-Abordnung', titel:'Abordnung bei einer ULB anfragen', termin:false,
      zweck:'8 Wochen Dienst an einer unteren Landwirtschaftsbehörde nach § 4 Abs. 1 APrOLW gD.',
      build:function(ctx){
        var s=ctx.settings||{},belegt=lelWochen(ctx).concat(meine(ctx).filter(function(e){return e.category==='RPK / Verwaltung'||e.category==='Prüfung'})).sort(function(a,b){return a.start.localeCompare(b.start)});
        return { an:'',
          betreff:'Anfrage: achtwöchiger Dienst an der unteren Landwirtschaftsbehörde – Laufbahnqualifizierung gD',
          text:['Sehr geehrte Damen und Herren,','',
            'im Rahmen meiner Laufbahnqualifizierung für den gehobenen landwirtschaftstechnischen Dienst ist nach § 4 Abs. 1 APrOLW gD ein achtwöchiger Dienst an einer unteren Landwirtschaftsbehörde vorgesehen.','',
            'Wäre ein solcher Einsatz bei Ihnen möglich? Durch Lehrgänge und Prüfung belegt sind:','',
            belegt.map(function(e){return '– '+kw(e)+': '+spanne(e)}).join('\n'),'',
            'In der übrigen Zeit bin ich flexibel.','',gruss(s,true)].join('\n'),
          hinweis:'Laut Einladung organisiert die entsendende Dienststelle die Abordnung selbst. Kläre vorher mit deiner Vorgesetzten oder deinem Vorgesetzten, wer bei der ULB anfragt.' };
      } },

    { id:'ulb-meldung', gruppe:'ULB-Abordnung', titel:'Abordnung an die Prüfungsbehörde melden lassen', termin:false,
      zweck:'Die Dienststelle teilt die Abordnung der Prüfungsbehörde (MLR) mit.',
      build:function(ctx){
        var s=ctx.settings||{},C=globalThis.LQCore;
        var bl=(ctx.events||[]).filter(function(e){return e.requirementId==='ulb8'&&e.start}).sort(function(a,b){return a.start.localeCompare(b.start)});
        var tage=function(e){return (e.creditDays!==''&&e.creditDays!=null)?Number(e.creditDays):(C?C.workingDays(e.start,e.end):0)};
        var summe=bl.reduce(function(n,e){return n+tage(e)},0);
        return { an:s.vgEmail||'',
          betreff:'ULB-Abordnung – Mitteilung an die Prüfungsbehörde (Az. '+AZ+')',
          text:[anredeVg(s),'',
            'für meine ULB-Abordnung stehen folgende Zeiträume fest:','',
            (bl.length?bl.map(function(e){return '– '+spanne(e)+(e.location?', '+e.location:'')+': '+tage(e)+' Arbeitstage'}).join('\n'):'– [noch keine Zeiträume eingetragen]'),
            'Summe: '+summe+' von 40 Arbeitstagen','',
            'Laut Einladung des MLR vom 16.09.2026 teilt die entsendende Dienststelle die Abordnung der Prüfungsbehörde mit. Könnten Sie das übernehmen?','',
            gruss(s,false)].join('\n'),
          hinweis:'Prüfungsbehörde ist nach § 16 APrOLW gD das Ministerium für Ländlichen Raum.' };
      } },
  ];

  var GRUPPEN=['Unterkunft LEL','Dienstreisen','Lehrgänge','ULB-Abordnung'];

  function find(id){return VORLAGEN.find(function(v){return v.id===id})}
  function termineFuer(vorlage,ctx){
    if(!vorlage||!vorlage.termin)return [];
    return vorlage.termin==='lel'?lelWochen(ctx):reiseTermine(ctx);
  }
  function istPlatzhalter(adr){return !adr||/^\[/.test(String(adr).trim())}
  // Windows reicht mailto-Links über ca. 2000 Zeichen nicht zuverlässig an das
  // Mailprogramm weiter. Längere Mails öffnen daher nur mit Empfänger und
  // Betreff; der Text geht über die Zwischenablage.
  var MAILTO_MAX=1800;
  function mailtoLink(m,ohneText){
    var q=[],enc=function(v){return encodeURIComponent(String(v||'').replace(/\r?\n/g,'\r\n'))};
    if(m.cc&&!istPlatzhalter(m.cc))q.push('cc='+enc(m.cc));
    q.push('subject='+enc(m.betreff));
    if(!ohneText)q.push('body='+enc(m.text));
    return 'mailto:'+(istPlatzhalter(m.an)?'':encodeURIComponent(m.an).replace(/%40/g,'@'))+'?'+q.join('&');
  }
  function mailto(m){
    var voll=mailtoLink(m);
    return voll.length<=MAILTO_MAX?{href:voll,gekuerzt:false}:{href:mailtoLink(m,true),gekuerzt:true};
  }

  return {VORLAGEN:VORLAGEN,GRUPPEN:GRUPPEN,find:find,termineFuer:termineFuer,mailtoLink:mailtoLink,mailto:mailto,spanne:spanne};
});
