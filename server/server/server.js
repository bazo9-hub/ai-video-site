// Friends Arena: خادم الغرف. بدون أي مكتبات خارجية.
// يشغّل: node server.js   (المنفذ من PORT أو 8080)
// الدور: يمرّر الرسائل بين مضيف الغرفة وضيوفها. المضيف هو من يشغّل المحاكاة.
'use strict';
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const MAX_ROOMS = 300;
const MAX_PLAYERS = 8;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const rooms = new Map();
const conns = new Set();

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Friends Arena server OK\nrooms: ' + rooms.size + '\n');
});

/* ---------- WebSocket (RFC 6455) ---------- */
function frame(op, payload) {
  const len = payload.length;
  let h;
  if (len < 126) h = Buffer.from([0x80 | op, len]);
  else if (len < 65536) { h = Buffer.alloc(4); h[0] = 0x80 | op; h[1] = 126; h.writeUInt16BE(len, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([h, payload]);
}
function sendText(c, s, droppable) {
  if (!c || c.socket.destroyed) return;
  if (droppable && c.socket.writableLength > 1e6) return; // مستقبل بطيء: تجاهل اللقطة
  c.socket.write(frame(0x1, Buffer.from(s, 'utf8')));
}
const sendJSON = (c, o) => sendText(c, JSON.stringify(o), false);

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || String(req.headers.upgrade || '').toLowerCase() !== 'websocket') { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  const c = { socket, buf: Buffer.alloc(0), room: null, slot: -1, frag: null };
  conns.add(c);
  socket.on('data', (d) => onData(c, d));
  socket.on('close', () => { leave(c); conns.delete(c); });
  socket.on('error', () => {});
});

function onData(c, chunk) {
  c.buf = Buffer.concat([c.buf, chunk]);
  for (;;) {
    const b = c.buf;
    if (b.length < 2) return;
    const fin = !!(b[0] & 0x80), op = b[0] & 0x0f, masked = !!(b[1] & 0x80);
    let len = b[1] & 0x7f, off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
    if (len > 1 << 20) { c.socket.destroy(); return; }
    const need = off + (masked ? 4 : 0) + len;
    if (b.length < need) return;
    let payload = b.subarray(off + (masked ? 4 : 0), need);
    if (masked) {
      const m = b.subarray(off, off + 4), out = Buffer.allocUnsafe(len);
      for (let i = 0; i < len; i++) out[i] = payload[i] ^ m[i & 3];
      payload = out;
    } else payload = Buffer.from(payload);
    c.buf = b.subarray(need);
    onFrame(c, fin, op, payload);
  }
}
function onFrame(c, fin, op, p) {
  if (op === 0x8) { try { c.socket.end(frame(0x8, Buffer.alloc(0))); } catch (e) {} return; }
  if (op === 0x9) { c.socket.write(frame(0xA, p)); return; }
  if (op === 0xA) return;
  if (op === 0x1) c.frag = [p];
  else if (op === 0x0 && c.frag) c.frag.push(p);
  else return;
  if (fin) {
    const s = Buffer.concat(c.frag).toString('utf8');
    c.frag = null;
    onMessage(c, s);
  }
}
setInterval(() => { for (const c of conns) { try { c.socket.write(frame(0x9, Buffer.alloc(0))); } catch (e) {} } }, 20000);

/* ---------- الغرف ---------- */
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

function newCode() {
  for (let t = 0; t < 50; t++) {
    let s = '';
    for (let i = 0; i < 4; i++) s += CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0];
    if (!rooms.has(s)) return s;
  }
  return null;
}
function broadcastRoom(room) {
  const slots = room.members.map((m) => m.slot).sort((a, b) => a - b);
  for (const m of room.members) sendJSON(m, { t: 'room', code: room.code, you: m.slot, host: m === room.host, slots });
}
function createRoom(c) {
  if (rooms.size >= MAX_ROOMS) return sendJSON(c, { t: 'err', m: 'الخادم ممتلئ الآن. حاول بعد قليل.' });
  const code = newCode();
  if (!code) return sendJSON(c, { t: 'err', m: 'تعذر إنشاء الغرفة. حاول مرة أخرى.' });
  const room = { code, host: c, members: [c], started: false };
  rooms.set(code, room);
  c.room = room; c.slot = 0;
  broadcastRoom(room);
}
function joinRoom(c, code) {
  const room = rooms.get(code);
  if (!room) return sendJSON(c, { t: 'err', m: 'الغرفة غير موجودة. تأكد من الرمز.' });
  if (room.started) return sendJSON(c, { t: 'err', m: 'المباراة بدأت بالفعل. انتظر انتهاءها.' });
  const used = new Set(room.members.map((m) => m.slot));
  let slot = -1;
  for (let i = 0; i < MAX_PLAYERS; i++) if (!used.has(i)) { slot = i; break; }
  if (slot < 0) return sendJSON(c, { t: 'err', m: 'الغرفة ممتلئة (8 لاعبين).' });
  room.members.push(c);
  c.room = room; c.slot = slot;
  broadcastRoom(room);
}
function leave(c) {
  const room = c.room;
  if (!room) return;
  c.room = null;
  room.members = room.members.filter((m) => m !== c);
  if (c === room.host) {
    for (const m of room.members) { m.room = null; m.slot = -1; sendJSON(m, { t: 'closed' }); }
    rooms.delete(room.code);
  } else {
    sendJSON(room.host, { t: 'left', s: c.slot });
    broadcastRoom(room);
  }
  c.slot = -1;
}
function onMessage(c, s) {
  const room = c.room;
  // لقطات الحالة: تمرّر كما هي من المضيف إلى الضيوف دون تحليل
  if (s.startsWith('{"t":"state"')) {
    if (room && c === room.host) for (const m of room.members) if (m !== c) sendText(m, s, true);
    return;
  }
  if (s.length > 65536) return;
  let m;
  try { m = JSON.parse(s); } catch (e) { return; }
  switch (m && m.t) {
    case 'create': leave(c); createRoom(c); break;
    case 'join': leave(c); joinRoom(c, String(m.code || '').toUpperCase().slice(0, 4)); break;
    case 'leave': leave(c); break;
    case 'in':
      if (room && c !== room.host) {
        sendJSON(room.host, { t: 'in', s: c.slot, mx: num(m.mx), my: num(m.my), f: m.f ? 1 : 0, aim: m.aim == null ? null : num(m.aim), snap: m.snap ? 1 : 0 });
      }
      break;
    case 'start': case 'over': case 'cfg':
      if (room && c === room.host) {
        if (m.t === 'start') room.started = true;
        if (m.t === 'over') room.started = false;
        for (const x of room.members) if (x !== c) sendText(x, s, false);
      }
      break;
  }
}

server.listen(PORT, () => console.log('Friends Arena server on :' + PORT));
