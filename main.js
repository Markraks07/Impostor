// === CONFIGURACIÓN SUPABASE ===
const SUPABASE_URL = 'https://nrxrtpoaldkwyoeurmuv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7SBqbTCTRKt28o2ruUqG5A_sV4pfPI6';

// Usa la variable global que ya existe (del CDN)
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === VARIABLES DE ESTADO ===
let currentRoomCode = null;
let currentPlayerId = null;
let currentNickname = null;
let isImpostor = false;
let myWord = '';

// === ELEMENTOS DOM ===
const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const nicknameInput = document.getElementById('nickname');
const roomCodeInput = document.getElementById('roomCode');
const joinBtn = document.getElementById('joinBtn');
const createBtn = document.getElementById('createBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chat-messages');
const roleMessage = document.getElementById('role-message');
const roomTitle = document.getElementById('roomTitle');
const playersCount = document.getElementById('players-count');
const voteBtn = document.getElementById('voteBtn');
const leaveBtn = document.getElementById('leaveBtn');

// === UTILIDAD ===
function showGameScreen() {
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
}

function addMessage(text, isSelf = false, sender = '') {
  const div = document.createElement('div');
  div.classList.add('message', isSelf ? 'self' : 'other');
  div.innerHTML = isSelf ? text : `<strong>${sender}:</strong> ${text}`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// === UNIRSE / CREAR SALA ===
async function joinOrCreateRoom(create = false) {
  const nick = nicknameInput.value.trim();
  let code = roomCodeInput.value.trim().toUpperCase();

  if (!nick) return alert('Pon un apodo');
  if (!code && !create) return alert('Introduce código');

  if (create) {
    code = Array(6).fill().map(() => Math.random().toString(36)[2].toUpperCase()).join('');
    roomCodeInput.value = code; // muestra el código generado
  }

  currentNickname = nick;
  currentRoomCode = code;

  let { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();

  if (error && error.code !== 'PGRST116') return alert('Error al conectar');

  const isNewRoom = !room;

  if (isNewRoom) {
    const { data, error: insertErr } = await supabase
      .from('rooms')
      .insert({
        code,
        word: 'pizza',
        hint: 'comida redonda y rica',
        impostor: null,
        status: 'waiting'
      })
      .select()
      .single();

    if (insertErr) return alert('No se pudo crear sala');
    room = data;
  }

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      nickname: nick,
      is_impostor: false
    })
    .select()
    .single();

  if (playerErr) return alert('No pudiste entrar');

  currentPlayerId = player.id;

  if (isNewRoom) {
    await supabase.from('rooms').update({ impostor: player.id }).eq('id', room.id);
  }

  roomTitle.textContent = `Sala: ${code}`;
  showGameScreen();
  subscribeToRoom();
}

// === SUSCRIPCIONES REALTIME ===
function subscribeToRoom() {
  supabase
    .channel(`room:${currentRoomCode}:chat`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat', filter: `room_code=eq.${currentRoomCode}` },
      payload => {
        const msg = payload.new;
        addMessage(msg.content, msg.player_id === currentPlayerId, msg.nickname);
      }
    )
    .subscribe();

  supabase
    .channel(`room:${currentRoomCode}:players`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${currentRoomCode}` },
      async () => {
        const { count } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('room_id', currentRoomCode);
        playersCount.textContent = `Jugadores: ${count || 0}`;
        checkMyRole();
      }
    )
    .subscribe();

  supabase
    .channel(`room:${currentRoomCode}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${currentRoomCode}` },
      () => checkMyRole()
    )
    .subscribe();

  checkMyRole();
}

async function checkMyRole() {
  if (!currentPlayerId) return;

  const { data: player } = await supabase.from('players').select('is_impostor').eq('id', currentPlayerId).single();
  const { data: room } = await supabase.from('rooms').select('word, hint, impostor').eq('code', currentRoomCode).single();

  isImpostor = player?.is_impostor || room?.impostor === currentPlayerId;

  roleMessage.textContent = isImpostor ? `Pista: ${room?.hint || '???'}` : `Palabra: ${room?.word || '???'}`;
  roleMessage.style.background = isImpostor ? '#991b1b' : '#1e40af';
}

// === ENVIAR MENSAJE ===
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentRoomCode) return;

  await supabase.from('chat').insert({
    room_code: currentRoomCode,
    player_id: currentPlayerId,
    nickname: currentNickname,
    content: text
  });

  messageInput.value = '';
}

// === VOTAR (placeholder) ===
function startVote() {
  alert(`Votación en ${currentRoomCode} (próximamente real)`);
}

// === SALIR ===
async function leaveRoom() {
  if (currentPlayerId) await supabase.from('players').delete().eq('id', currentPlayerId);
  location.reload();
}

// === EVENTOS ===
joinBtn.onclick = () => joinOrCreateRoom(false);
createBtn.onclick = () => joinOrCreateRoom(true);
sendBtn.onclick = sendMessage;
messageInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
voteBtn.onclick = startVote;
leaveBtn.onclick = leaveRoom;

