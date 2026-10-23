(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.LQExport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function pad(n){return String(n).padStart(2,'0')}
  function parseDate(s){var p=String(s||'').split('-').map(Number);return new Date(Date.UTC(p[0],p[1]-1,p[2]))}
  function dateISO(d){return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate())}
  function addDays(s,n){var d=parseDate(s);d.setUTCDate(d.getUTCDate()+Number(n||0));return dateISO(d)}
  function expandWeekdays(start,end){
    if(!start||!end)return[];var out=[],d=parseDate(start),last=parseDate(end),guard=0;
    while(d<=last&&guard++<800){var day=d.getUTCDay();if(day!==0&&day!==6)out.push(dateISO(d));d.setUTCDate(d.getUTCDate()+1)}
    return out;
  }
  function escapeICS(s){return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
  function compactDate(s){return String(s||'').replace(/-/g,'')}
  function compactTime(t){var m=/^(\d{1,2}):(\d{2})$/.exec(String(t||''));if(!m)return null;var hh=Math.max(0,Math.min(23,Number(m[1]))),mm=Math.max(0,Math.min(59,Number(m[2])));return pad(hh)+pad(mm)+'00'}
  function statusPrefix(event){
    if(event.category==='Prüfung')return'[PRÜFUNG] ';
    if(event.category==='Prüfungsvorbereitung'||event.category==='Verwaltungsfall')return'[VORBEREITUNG] ';
    if(event.category==='ULB-Abordnung')return'[ULB] ';
    if(event.obligation==='Optional')return'[OPTIONAL] ';
    if(event.obligation==='Offen')return'[OFFEN] ';
    if(event.obligation==='Pflicht')return'[PFLICHT] ';
    return'';
  }
  function eventDescription(e,h){
    var bits=[];var kw=e.sourceKW||(h.computedKW?h.computedKW(e):'');if(kw)bits.push('KW '+kw);if(h.statusLabel)bits.push(h.statusLabel(e));else if(e.obligation)bits.push(e.obligation);if(h.roleLabel)bits.push(h.roleLabel(e));else if(e.relevance)bits.push(e.relevance);if(e.category)bits.push(e.category);if(e.notes)bits.push(e.notes);return bits.join(' | ')
  }
  // ---------------------------------------------------------- Teilnehmer
  // Eingabe je Termin: Adressen getrennt durch Semikolon oder Zeilenumbruch,
  // wahlweise mit Namen („Max Muster <max@…>“); bloße Adressen auch durch
  // Komma getrennt. Im Kalender werden daraus ATTENDEE-Zeilen (erforderlich
  // oder optional); Outlook versendet die Einladungen erst beim Senden.
  var EMAIL=/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
  function parseTeilnehmer(text){
    var out=[];
    String(text||'').split(/[;\n]+/).forEach(function(tok){
      tok=tok.trim();if(!tok)return;
      var m=/^(.*?)<\s*([^<>\s]+)\s*>$/.exec(tok);
      if(m){var mail=m[2].replace(/^mailto:/i,'');if(EMAIL.test(mail))out.push({cn:m[1].replace(/"/g,'').trim(),email:mail});return}
      tok.split(/[,\s]+/).forEach(function(t){t=t.replace(/^mailto:/i,'');if(EMAIL.test(t))out.push({cn:'',email:t})});
    });
    return out;
  }
  // Alle Teilnehmer eines Termins samt Zusatzadressen aus dem Export, ohne
  // Dubletten; „erforderlich“ gewinnt gegen „optional“.
  function teilnehmerVon(e,opt){
    var liste=[],seen={};
    function add(arr,rolle){arr.forEach(function(t){var k=t.email.toLowerCase(),x=seen[k];
      if(x){if(rolle==='REQ-PARTICIPANT')x.rolle=rolle;if(t.cn&&!x.cn)x.cn=t.cn;return}
      x={cn:t.cn,email:t.email,rolle:rolle};seen[k]=x;liste.push(x)})}
    add(parseTeilnehmer(e&&e.einladenPflicht),'REQ-PARTICIPANT');
    add(parseTeilnehmer(opt&&opt.extraRequired),'REQ-PARTICIPANT');
    add(parseTeilnehmer(e&&e.einladenOptional),'OPT-PARTICIPANT');
    add(parseTeilnehmer(opt&&opt.extraOptional),'OPT-PARTICIPANT');
    return liste;
  }
  function paramCN(cn){cn=String(cn||'').replace(/"/g,'').trim();if(!cn)return'';return';CN='+(/[,;:]/.test(cn)?'"'+cn+'"':cn)}
  function pushTeilnehmer(out,e,opt){
    var liste=teilnehmerVon(e,opt);if(!liste.length)return;
    var org=opt.organizer||{};
    if(org.email&&EMAIL.test(String(org.email).trim()))out.push('ORGANIZER'+paramCN(org.cn)+':mailto:'+String(org.email).trim());
    liste.forEach(function(t){out.push('ATTENDEE;ROLE='+t.rolle+';PARTSTAT=NEEDS-ACTION;RSVP=TRUE'+paramCN(t.cn)+':mailto:'+t.email)});
  }
  function pushAlarm(out,minutes){var n=Number(minutes);if(!Number.isFinite(n)||n<=0)return;out.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Erinnerung','TRIGGER:-PT'+Math.round(n)+'M','END:VALARM')}
  function vevent(out,e,opt,h,day,startTime,endTime,suffix){
    var title=(opt.prefix||'')+(opt.statusPrefix?statusPrefix(e):'')+e.title;
    out.push('BEGIN:VEVENT','UID:'+escapeICS(e.id+(suffix||''))+'@lq-dashboard','DTSTAMP:20000101T000000Z');
    if(day&&startTime&&endTime){out.push('DTSTART:'+compactDate(day)+'T'+startTime,'DTEND:'+compactDate(day)+'T'+endTime)}
    else{out.push('DTSTART;VALUE=DATE:'+compactDate(e.start),'DTEND;VALUE=DATE:'+compactDate((h.addDays||addDays)(e.end,1)))}
    out.push('SUMMARY:'+escapeICS(title));
    out.push('CLASS:'+(opt.privacy==='PUBLIC'?'PUBLIC':'PRIVATE'));
    var busy=opt.busyStatus||'BUSY';out.push('TRANSP:'+(busy==='FREE'?'TRANSPARENT':'OPAQUE'),'X-MICROSOFT-CDO-BUSYSTATUS:'+busy);
    if(opt.includeLocation!==false&&e.location)out.push('LOCATION:'+escapeICS(e.location));
    if(opt.includeDescription!==false){var desc=eventDescription(e,h);if(opt.includeTravelDescription&&h.travelSummary){var tr=h.travelSummary(e);if(tr)desc+=(desc?'\n\n':'')+tr}out.push('DESCRIPTION:'+escapeICS(desc));}
    if(opt.includeAttendees!==false)pushTeilnehmer(out,e,opt);
    pushAlarm(out,opt.reminderMinutes);
    out.push('END:VEVENT');
  }
  function buildICS(events,opt,helpers){
    opt=Object.assign({prefix:'',statusPrefix:false,privacy:'PRIVATE',busyStatus:'BUSY',timeMode:'allday',fixedStart:'08:30',fixedEnd:'16:30',includeLocation:true,includeDescription:true,includeAttendees:true},opt||{});helpers=helpers||{};
    var out=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//LQ Dashboard V2.14//DE','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    (events||[]).filter(function(e){return e&&e.start&&e.end}).forEach(function(e){
      if(opt.timeMode==='fixedDaily'){
        var st=compactTime(opt.fixedStart),et=compactTime(opt.fixedEnd);if(!st||!et){st='083000';et='163000'};
        expandWeekdays(e.start,e.end).forEach(function(day,i){vevent(out,e,opt,helpers,day,st,et,'-'+compactDate(day)+'-'+i)})
      }else if(opt.timeMode==='event'&&e.startTime&&e.endTime){
        var es=compactTime(e.startTime),ee=compactTime(e.endTime);
        if(es&&ee)expandWeekdays(e.start,e.end).forEach(function(day,i){vevent(out,e,opt,helpers,day,es,ee,'-'+compactDate(day)+'-'+i)});else vevent(out,e,opt,helpers)
      }else vevent(out,e,opt,helpers)
    });
    out.push('END:VCALENDAR');return out.join('\r\n');
  }
  return{addDays:addDays,expandWeekdays:expandWeekdays,escapeICS:escapeICS,buildICS:buildICS,statusPrefix:statusPrefix,parseTeilnehmer:parseTeilnehmer,teilnehmerVon:teilnehmerVon};
});
