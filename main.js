// === CONFIGURACIÓN SUPABASE ===
const SUPABASE_URL = 'https://nrxrtpoaldkwyoeurmuv.supabase.co';          // ← CAMBIAR
const SUPABASE_ANON_KEY = 'sb_publishable_7SBqbTCTRKt28o2ruUqG5A_sV4pfPI6';                   // ← CAMBIAR

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === VARIABLES DE ESTADO ===
let currentRoomCode = null;
let currentPlayerId = null;
let currentNickname = null;
let isImpostor = false;
let myWord = '';

// === ELEMENTOS DOM ===
const loginScreen  = document.getElementById('login-screen');
const gameScreen   = document.getElementById('game-screen');
const nicknameInput = document.getElementById('nickname');
const roomCodeInput = document.getElementById('roomCode');
const joinBtn      = document.getElementById('joinBtn');
const createBtn    = document.getElementById('createBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn      = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chat-messages');
const roleMessage  = document.getElementById('role-message');
const roomTitle    = document.getElementById('roomTitle');
const playersCount = document.getElementById('players-count');
const voteBtn      = document.getElementById('voteBtn');
const leaveBtn     = document.getElementById('leaveBtn');

// === UTILIDAD ===
function showGameScreen() {
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
}

function addMessage(text, isSelf = false, sender = '') {
  const div = document.createElement('div');
  div.classList.add('message');
  if (isSelf) {
    div.classList.add('self');
    div.textContent = text;
  } else {
    div.classList.add('other');
    div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  }
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// === UNIRSE / CREAR SALA ===
async function joinOrCreateRoom(create = false) {
  let nick = nicknameInput.value.trim();
  let code = roomCodeInput.value.trim().toUpperCase();

  if (!nick) return alert('Pon un apodo, gamberro');
  if (!code && !create) return alert('Introduce código de sala');

  if (create) {
    // Generar código aleatorio de 6 caracteres
    code = Math.random().toString(36).substring(2,8).toUpperCase();
  }

  currentNickname = nick;
  currentRoomCode = code;

  // 1. Verificar/crear sala
  let { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();

  if (error && error.code !== 'PGRST116') { // no es "no rows"
    return alert('Error al conectar con la sala 😭');
  }

  let isNewRoom = !room;

  if (isNewRoom) {
    const { data, error: insertErr } = await supabase
      .from('rooms')
      .insert({
        code,
        word: 'pizza',          // ← aquí iría tu banco de palabras
        hint: 'comida redonda y rica',
        impostor: null,         // se asignará al primer jugador
        status: 'waiting'
      })
      .select()
      .single();

    if (insertErr) return alert('No se pudo crear la sala');
    room = data;
  }

  // 2. Unir jugador
  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      nickname: nick,
      is_impostor: false // por defecto no
    })
    .select()
    .single();

  if (playerErr) return alert('No pudiste entrar a la sala');

  currentPlayerId = player.id;

  // Si es la primera persona → es impostor
  if (isNewRoom) {
    await supabase
      .from('rooms')
      .update({ impostor: player.id })
      .eq('id', room.id);
  }

  // Actualizar UI
  roomTitle.textContent = `Sala: ${code}`;
  showGameScreen();

  // Suscribirse a cambios
  subscribeToRoom();
}

// === SUSCRIPCIONES REALTIME ===
function subscribeToRoom() {
  // Chat
  supabase
    .channel(`room:${currentRoomCode}:chat`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat', filter: `room_code=eq.${currentRoomCode}` },
      payload => {
        const msg = payload.new;
        const isSelf = msg.player_id === currentPlayerId;
        addMessage(msg.content, isSelf, msg.nickname);
      }
    )
    .subscribe();

  // Jugadores (conteo y posible actualización de impostor)
  supabase
    .channel(`room:${currentRoomCode}:players`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${currentRoomCode}` },
      async () => {
        const { count } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', currentRoomCode);  // ← ojo: room_id es UUID

        playersCount.textContent = `Jugadores: ${count || 0}`;

        // Obtener mi rol actualizado
        checkMyRole();
      }
    )
    .subscribe();

  // Actualización de sala (por si cambia impostor, palabra, etc.)
  supabase
    .channel(`room:${currentRoomCode}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${currentRoomCode}` },
      () => checkMyRole()
    )
    .subscribe();

  // Cargar mi rol al entrar
  checkMyRole();
}

async function checkMyRole() {
  if (!currentPlayerId) return;

  const { data: player } = await supabase
    .from('players')
    .select('is_impostor')
    .eq('id', currentPlayerId)
    .single();

  const { data: room } = await supabase
    .from('rooms')
    .select('word, hint, impostor')
    .eq('code', currentRoomCode)
    .single();

  isImpostor = player?.is_impostor || room?.impostor === currentPlayerId;

  if (isImpostor) {
    roleMessage.textContent = `Pista: ${room?.hint || '???'} `;
    roleMessage.style.background = '#991b1b';
  } else {
    myWord = room?.word || '???';
    roleMessage.textContent = `Tu palabra: ${myWord}`;
    roleMessage.style.background = '#1e40af';
  }
}

// === ENVIAR MENSAJE ===
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentRoomCode) return;

  await supabase
    .from('chat')
    .insert({
      room_code: currentRoomCode,
      player_id: currentPlayerId,
      nickname: currentNickname,
      content: text
    });

  messageInput.value = '';
}

// === VOTAR (placeholder) ===
function startVote() {
  alert(`Votación iniciada en sala ${currentRoomCode}!\n(Próximamente: interfaz de votación real)`);
  // Aquí iría: mostrar lista de jugadores, permitir click, insert en votes, contar...
}

// === SALIR ===
async function leaveRoom() {
  if (currentPlayerId) {
    await supabase.from('players').delete().eq('id', currentPlayerId);
  }
  location.reload();
}

// === EVENTOS ===
joinBtn.onclick = () => joinOrCreateRoom(false);
createBtn.onclick = () => joinOrCreateRoom(true);

sendBtn.onclick = sendMessage;
messageInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});

voteBtn.onclick = startVote;
leaveBtn.onclick = leaveRoom;

