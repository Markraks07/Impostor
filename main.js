// Configuración Supabase
const supabaseUrl = 'https://nrxrtpoaldkwyoeurmuv.supabase.co';
const supabaseKey = 'sb_publishable_7SBqbTCTRKt28o2ruUqG5A_sV4pfPI6';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const WORDS = [
  { w: "Fiesta", h: "Alcohol y música" },
  { w: "Profesor", h: "Odia este juego" },
  { w: "Suspender", h: "Miedo estudiantil" },
  { w: "Botellón", h: "Juventud española" },
  { w: "Examen", h: "Pesadilla" }
];

let me = {}, roomCode = '';

// Botones
document.getElementById('joinBtn').addEventListener('click', joinRoom);
document.getElementById('goGameBtn').addEventListener('click', goGame);
document.getElementById('sendBtn').addEventListener('click', sendMsg);
document.getElementById('voteBtn').addEventListener('click', startVote);

// Función para unirse a la sala
async function joinRoom() {
  const n = document.getElementById('name').value.trim();
  const code = document.getElementById('room').value.trim();
  if (!n || !code) return alert('Nombre y sala obligatorios');

  me.name = n;
  me.id = Date.now() + Math.random();
  roomCode = code;

  const btn = document.getElementById('joinBtn');
  btn.disabled = true;
  btn.innerText = 'Entrando...';

  try {
    // Revisar sala
    let { data: room, error } = await supabase.from('rooms').select('*').eq('code', roomCode).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!room) {
      const sel = WORDS[Math.floor(Math.random() * WORDS.length)];
      await supabase.from('rooms').insert([{ code: roomCode, word: sel.w, hint: sel.h, impostor: me.id, turn: me.id }]);
    }

    // Insertar jugador
    await supabase.from('players').insert([{ name: me.name, room: roomCode, id: me.id, role: 'pending' }]);

    // Asignar rol (el primero es impostor)
    const { data: players } = await supabase.from('players').select('*').eq('room', roomCode);
    const isImp = players.length === 1;
    await supabase.from('players').update({ role: isImp ? 'impostor' : 'legal' }).eq('id', me.id);

    showRole(isImp);
    setupRealtime();
  } catch (e) {
    alert('Error al entrar: ' + e.message);
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Entrar';
  }
}

// Mostrar rol
async function showRole(isImp) {
  document.getElementById('join').classList.add('hidden');
  document.getElementById('role').classList.remove('hidden');

  document.getElementById('roleText').innerText = isImp ? '😈 ERES EL IMPOSTOR' : '😇 ERES LEGAL';
  const { data: room } = await supabase.from('rooms').select('*').eq('code', roomCode).single();
  document.getElementById('secret').innerText = isImp ? 'PISTA: ' + room.hint : room.word;
}

// Entrar al juego
function goGame() {
  document.getElementById('role').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
}

// Configurar Supabase Realtime
function setupRealtime() {
  supabase.channel('room_' + roomCode)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat', filter: `room=eq.${roomCode}` }, payload => {
      const d = document.createElement('div');
      d.className = 'msg';
      d.innerHTML = '<b>' + payload.new.name + ':</b> ' + payload.new.text;
      const chat = document.getElementById('chat');
      chat.appendChild(d);
      chat.scrollTop = 9999;
    })
    .subscribe();
}

// Enviar mensaje
async function sendMsg() {
  const t = document.getElementById('msg').value.trim();
  if (!t) return;
  await supabase.from('chat').insert([{ room: roomCode, name: me.name, text: t }]);
  document.getElementById('msg').value = '';
}

// Iniciar votación
async function startVote() {
  alert('Votación iniciada (implementar lógica completa en Supabase)');
}
