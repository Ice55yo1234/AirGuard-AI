import http from 'node:http';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const locations = JSON.parse(await readFile(new URL('./provinces.json', import.meta.url), 'utf8'));
const normalize = value => value.normalize('NFC').trim().replace(/^จังหวัด\s*|^จ\.\s*/, '').trim();
const HELP = '🌿 AirGuard AI\nเช็กฝุ่นตามจังหวัดได้ในแชต\n\nพิมพ์ เช่น “ฝุ่น หนองคาย” หรือ “ฝุ่น กรุงเทพ”\nหรือส่งตำแหน่งจากเมนูแนบใน LINE\n\nพิมพ์ “ช่วยเหลือ” เพื่อดูคำแนะนำอีกครั้ง\nข้อมูลฝุ่นเป็นค่าประมาณจากแบบจำลอง Open-Meteo ไม่ใช่ค่าตรวจวัดจากสถานี';

export function verifySignature(body, header, secret) {
  if (!secret || typeof header !== 'string') return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  let received; try { received = Buffer.from(header, 'base64'); } catch { return false; }
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}
export function findProvince(input) {
  const key = normalize(input);
  if (['กรุงเทพ','กทม','กทม.'].includes(key)) return locations.find(x => x.id === '59T');
  return locations.find(x => normalize(x.name) === key) || null;
}
export function interpret(event) {
  if (event.type === 'follow') return { kind: 'help' };
  if (event.type !== 'message') return { kind: 'ignore' };
  const msg = event.message || {};
  if (msg.type === 'location') {
    const lat = msg.latitude, lon = msg.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return { kind:'invalid' };
    return {kind:'air', lat, lon, name:'ตำแหน่งที่ส่งมา'};
  }
  if (msg.type !== 'text') return { kind:'help' };
  const text = msg.text.trim();
  if (['ช่วยเหลือ','เมนู','เริ่มต้น','help'].includes(text.toLowerCase())) return { kind:'help' };
  const match = text.match(/^(?:ฝุ่น|pm2\.?5)\s+(.+)$/i);
  if (!match) return { kind:'help' };
  const place = findProvince(match[1]);
  return place ? {kind:'air', ...place} : {kind:'unknown'};
}
export function advice(pm) {
  if (pm <= 15) return '😊 ฝุ่นค่อนข้างต่ำ ตรวจสอบสภาพอากาศและสังเกตอาการก่อนทำกิจกรรม';
  if (pm <= 25) return '🙂 ฝุ่นค่อนข้างต่ำ ผู้ที่ไวต่อฝุ่นควรสังเกตอาการ';
  if (pm <= 37.5) return '😷 กลุ่มเสี่ยงควรลดการสัมผัสฝุ่นและสังเกตอาการ';
  if (pm <= 75) return '🏠 ลดกิจกรรมกลางแจ้งและพิจารณาหน้ากากกรองฝุ่นเมื่อจำเป็น';
  return '⚠️ ฝุ่นสูงมาก ควรหลีกเลี่ยงกิจกรรมกลางแจ้ง';
}
export async function buildReply(event, fetchImpl = fetch) {
  const req = interpret(event);
  if (req.kind === 'ignore') return null;
  if (req.kind === 'help') return HELP;
  if (req.kind === 'unknown') return 'ไม่พบจังหวัดที่พิมพ์ ลองพิมพ์ชื่อเต็ม เช่น “ฝุ่น หนองคาย” หรือส่งตำแหน่งของคุณ';
  if (req.kind === 'invalid') return 'ตำแหน่งไม่ถูกต้อง กรุณาส่งตำแหน่งใหม่หรือพิมพ์ชื่อจังหวัด';
  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  for (const [k,v] of Object.entries({latitude:req.lat,longitude:req.lon,current:'pm2_5',timezone:'Asia/Bangkok'})) url.searchParams.set(k,String(v));
  try {
    const res = await fetchImpl(url, {signal: AbortSignal.timeout(8000)});
    if (!res.ok) throw new Error('air quality unavailable');
    const data = await res.json(), pm = data.current?.pm2_5, time = data.current?.time;
    if (!Number.isFinite(pm) || pm < 0 || typeof time !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(time)) throw new Error('invalid air data');
    return `🌿 AirGuard AI\n📍 ${req.name}\nPM2.5 ประมาณ ${pm.toFixed(1)} µg/m³\n🕒 ${time.replace('T',' ')} น. เวลาไทย\n\n${advice(pm)}\n\nข้อมูลจากแบบจำลอง Open-Meteo ไม่ใช่ค่าตรวจวัดจากสถานี และอาจต่างจากพื้นที่จริง`;
  } catch { return 'ขออภัย ตอนนี้โหลดข้อมูลฝุ่นไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'; }
}
export async function handlePayload(body, signature, {secret, token, fetchImpl = fetch}) {
  if (!verifySignature(body, signature, secret)) return {status:401};
  let payload; try { payload = JSON.parse(body.toString('utf8')); } catch { return {status:400}; }
  if (!Array.isArray(payload.events)) return {status:400};
  for (const event of payload.events) {
    // Only reply to direct users; avoid broadcasting to groups or rooms.
    if (event.source?.type !== 'user' || typeof event.replyToken !== 'string') continue;
    const message = await buildReply(event, fetchImpl);
    if (!message) continue;
    try {
      const response = await fetchImpl('https://api.line.me/v2/bot/message/reply', {
        method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({replyToken:event.replyToken,messages:[{type:'text',text:message}]}), signal:AbortSignal.timeout(8000)
      });
      if (!response.ok) console.error('LINE reply failed:', response.status);
    } catch { console.error('LINE reply failed: network error'); }
  }
  return {status:200};
}
export function createServer({secret,token,fetchImpl=fetch}) {
  if (!secret || !token) throw new Error('Set LINE_CHANNEL_SECRET and LINE_CHANNEL_ACCESS_TOKEN before starting');
  return http.createServer(async (req,res) => {
    if (req.method === 'GET' && req.url === '/health') { res.writeHead(200,{'content-type':'application/json'}); return res.end('{"ok":true}'); }
    if (req.method !== 'POST' || req.url?.split('?')[0] !== '/webhook') { res.writeHead(404); return res.end(); }
    let size = 0, chunks = [], tooLarge = false;
    for await (const chunk of req) { size += chunk.length; if (size > 1048576) { tooLarge = true; break; } chunks.push(chunk); }
    if (tooLarge) { res.writeHead(413); return res.end(); }
    try {
      const result = await handlePayload(Buffer.concat(chunks),req.headers['x-line-signature'],{secret,token,fetchImpl});
      res.writeHead(result.status); res.end();
    } catch { res.writeHead(500); res.end(); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const port=Number(process.env.PORT || 3000);
    createServer({secret:process.env.LINE_CHANNEL_SECRET,token:process.env.LINE_CHANNEL_ACCESS_TOKEN}).listen(port,'0.0.0.0',()=>console.log(`AirGuard LINE webhook listening on ${port}`));
  } catch (err) { console.error(err.message); process.exitCode=1; }
}
