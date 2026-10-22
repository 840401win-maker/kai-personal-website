const fs = require('node:fs');
const zlib = require('node:zlib');
const trace = JSON.parse(zlib.gunzipSync(fs.readFileSync('C:/Users/88697/Downloads/Trace-20261017T082326.json.gz')));
const events = trace.traceEvents;
const nav = events.find(e => e.name === 'navigationStart' && e.args?.data?.documentLoaderURL === 'https://kai-personal-website.netlify.app/');
if (!nav) throw new Error('Main navigation missing');
const frame = nav.args.frame, navId = nav.args.data.navigationId;
const ms = ts => Math.round((ts - nav.ts) / 10) / 100;
const safeUrl = value => { try { const u = new URL(value); return u.origin + u.pathname; } catch { return String(value || '').slice(0,120); } };
const network = new Map();
for (const e of events) {
  const d = e.args?.data;
  if (!d?.requestId) continue;
  if (!/Resource(SendRequest|ReceiveResponse|ReceivedData|Finish)/.test(e.name)) continue;
  const row = network.get(d.requestId) || { id:d.requestId };
  if (e.name === 'ResourceSendRequest') Object.assign(row,{ url:safeUrl(d.url), start:ms(e.ts), frame:d.frame, priority:d.priority, type:d.resourceType });
  if (e.name === 'ResourceReceiveResponse') Object.assign(row,{ response:ms(e.ts), status:d.statusCode, mime:d.mimeType, cache:d.fromCache, serviceWorker:d.fromServiceWorker, encodedResponse:d.encodedDataLength });
  if (e.name === 'ResourceReceivedData') row.receivedBytes = (row.receivedBytes || 0) + (d.encodedDataLength || 0);
  if (e.name === 'ResourceFinish') Object.assign(row,{ end:ms(e.ts), encoded:d.encodedDataLength, decoded:d.decodedBodyLength, failed:d.didFail });
  network.set(d.requestId,row);
}
const requests=[...network.values()].filter(r=>r.url).map(r=>({...r,duration:r.end===undefined?null:Math.round((r.end-r.start)*100)/100}));
const fcp=events.filter(e=>e.name==='firstContentfulPaint'&&e.args?.frame===frame&&e.args?.data?.navigationId===navId).map(e=>ms(e.ts));
const lcp=events.filter(e=>e.name==='largestContentfulPaint::Candidate'&&e.args?.frame===frame&&e.args?.data?.navigationId===navId).map(e=>({time:ms(e.ts),...e.args.data}));
const tasks=events.filter(e=>e.pid===nav.pid&&e.tid===nav.tid&&e.name==='RunTask'&&e.ph==='X'&&e.dur>=50000).map(e=>({start:ms(e.ts),duration:e.dur/1000}));
const types={}; for(const e of events) if(e.pid===nav.pid&&e.tid===nav.tid&&e.ph==='X'&&e.dur&&e.ts>=nav.ts&&e.ts<=nav.ts+5e6) { const r=types[e.name]||(types[e.name]={count:0,ms:0,max:0});r.count++;r.ms+=e.dur/1000;r.max=Math.max(r.max,e.dur/1000); }
const paints=events.filter(e=>e.name==='PaintImage'&&e.args?.data).map(e=>({time:ms(e.ts),node:e.args.data.nodeId,url:safeUrl(e.args.data.url)}));
const viewportEvents=events.filter(e=>/Viewport|FrameView|UpdateLayoutTree|Layout/.test(e.name)&&e.args?.data).slice(0,5).map(e=>({name:e.name,time:ms(e.ts),data:e.args.data}));
const summary={metadata:Object.fromEntries(Object.entries(trace.metadata||{}).filter(([k])=>['source','startTime','emulatedDeviceTitle','cpuThrottling','networkThrottling','networkThrottlingConditions','hostDPR','dataOrigin'].includes(k))),events:events.length,durationMs:ms(events.reduce((max,e)=>Math.max(max,e.ts),0)),navigation:{frame,navId,pid:nav.pid,tid:nav.tid},fcp,lcp,requests,longTasks:tasks,first5sMainEvents:Object.entries(types).map(([name,v])=>({name,...v})).sort((a,b)=>b.ms-a.ms).slice(0,25),imagePaints:paints,viewportEvents,markers:events.filter(e=>e.pid===nav.pid&&/MarkDOMContent|MarkLoad|ParseHTML|EvaluateScript/.test(e.name)).map(e=>({name:e.name,time:ms(e.ts),duration:(e.dur||0)/1000,url:safeUrl(e.args?.data?.url||e.args?.beginData?.url)})).slice(0,60)};
fs.writeFileSync(__dirname+'/slow-mobile-summary.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify({...summary,requests:requests.filter(r=>r.start<5500||r.status>=400||r.mime?.includes('font')),imagePaints:paints.slice(0,10)},null,2));
