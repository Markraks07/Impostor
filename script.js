let ably, channel, username, room;
let isHost = false;
let players = [];
let eliminated = [];
let roles = {};
let turnIndex = 0;
let decisiones = { ronda: 0, votar: 0, total: 0 };
let votosExp = {};
let votosMapas = { espacio: 0, cyberpunk: 0, infierno: 0 };

// CONFIGURACIÓN SUPABASE
const supabaseUrl = 'https://nrxrtpoaldkwyoeurmuv.supabase.co';
const supabaseKey = 'sb_publishable_7SBqbTCTRKt28o2ruUqG5A_sV4pfPI6';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- LISTA DE PALABRAS ---
const bibliotecaPalabras = ["Pizza", "TikTok", "Escuela", "Netflix", "Minecraft", "Fútbol", "YouTube", "Hamburguesa", "Examen", "Gimnasio", "Playa", "WhatsApp", "Profesor", "Mochila", "Dormir", "Cine", "Helado", "Perro", "Gato", "Televisión", "Videojuegos", "Bicicleta", "Navidad", "Verano", "Astronauta", "Pirata", "Zombie", "Dragón", "Castillo", "Espada", "Escudo", "Robot", "Teléfono", "Internet", "Instagram", "Música", "Guitarra", "Piano", "Cantante", "Estadio", "Avión", "Barco", "Tren", "Coche", "Moto", "Semáforo", "Policía", "Bombero", "Doctor", "Hospital", "Medicina", "Libro", "Biblioteca", "Lápiz", "Cuaderno", "Tarea", "Pizarra", "Parque", "Tobogán", "Piscina", "Montaña", "Nieve", "Esquí", "Camping", "Bosque", "Chocolate", "Caramelo", "Galleta", "Fruta", "Manzana", "Plátano", "Sushi", "Taco", "Batman", "Spiderman", "Ironman", "Superman", "Avengers", "Anime", "Naruto", "Pokémon", "Fortnite", "Roblox", "Among Us", "Discord", "Twitch", "Selfie", "Influencer", "Meme", "Dinero", "Diamante", "Oro", "Tesoro", "Mapa", "Brújula", "Reloj", "Tiempo", "Espacio", "León", "Tigre", "Elefante", "Jirafa", "Tiburón", "Delfín", "Ballena", "Águila", "Loro", "Serpiente", "Araña", "Abeja", "Mariposa", "Caballo", "Vaca", "Cerdo", "Oveja", "Gallina", "Conejo", "Ardilla", "Oso", "Lobo", "Pingüino", "Canguro", "Volcán", "Terremoto", "Tormenta", "Río", "Lago", "Océano", "Isla", "Desierto", "Jungla", "Cueva", "Estrella", "Luna", "Sol", "Planeta", "Cometa", "Nube", "Lluvia", "Rayo", "Arcoíris", "Flor", "Árbol", "Palmera", "Cactus", "Cama", "Sofá", "Silla", "Mesa", "Lámpara", "Espejo", "Cuadro", "Ventana", "Puerta", "Llave", "Nevera", "Horno", "Microondas", "Lavadora", "Ducha", "Toalla", "Jabón", "Cepillo", "Peine", "Ropa", "Zapatos", "Gorra", "Gafas", "Anillo", "Bolso", "Cartera", "Moneda", "Billete", "Cuchillo", "Tenedor", "Cuchara", "Plato", "Vaso", "Sartén", "Olla", "Martillo", "Destornillador", "Tijeras", "Pegamento", "Cinta", "Caja", "Maleta", "Paraguas", "Escoba", "Supermercado", "Restaurante", "Hotel", "Museo", "Zoo", "Acuario", "Aeropuerto", "Puerto", "Estación", "Puente", "Rascacielos", "Iglesia", "Ayuntamiento", "Cárcel", "Banco", "Cajero", "Farmacia", "Panadería", "Kiosco", "Peluquería", "Taller", "Garaje", "Gasolinera", "Parking", "Calle", "Avenida", "Plaza", "Fuente", "Estatua", "Monumento", "Faro", "Pirámide", "Teatro", "Discoteca", "Casino", "Circo", "Feria", "Pasta", "Arroz", "Sopa", "Ensalada", "Carne", "Pescado", "Huevo", "Queso", "Leche", "Yogur", "Mantequilla", "Pan", "Cereales", "Patatas", "Tomate", "Cebolla", "Zanahoria", "Lechuga", "Naranja", "Fresa", "Uva", "Sandía", "Limón", "Pastel", "Donut", "Muffin", "Zumo", "Refresco", "Café", "Té", "Agua", "Cerveza", "Vino", "Cocktail", "Kebab", "Paella", "Tortilla", "Croqueta", "Perrito", "Palomitas", "Baloncesto", "Tenis", "Golf", "Voleibol", "Rugby", "Béisbol", "Boxeo", "Kárate", "Surf", "Skate", "Patinaje", "Ajedrez", "Cartas", "Dados", "Baile", "Fiesta", "Boda", "Cumpleaños", "Concierto", "Festival", "Ópera", "Ballet", "Magia", "Malabares", "Pintura", "Escultura", "Fotografía", "Cámara", "Micrófono", "Auriculares", "Altavoz", "Radio", "Podcast", "Batería", "Violín", "Flauta", "Trompeta", "Abogado", "Arquitecto", "Ingeniero", "Científico", "Astrónomo", "Escritor", "Poeta", "Periodista", "Reportero", "Actor", "Director", "Modelo", "Cocinero", "Camarero", "Panadero", "Granjero", "Pescador", "Soldado", "General", "Rey", "Reina", "Príncipe", "Princesa", "Caballero", "Vikingo", "Samurái", "Ninja", "Espía", "Detective", "Ladrón", "Juez", "Presidente", "Alcalde", "Jefe", "Empleado", "Estudiante", "Átomo", "Célula", "ADN", "Cerebro", "Corazón", "Esqueleto", "Músculo", "Sangre", "Virus", "Bacteria", "Energía", "Electricidad", "Magnetismo", "Gravedad", "Láser", "Satélite", "Cohete", "Telescopio", "Microscopio", "Ordenador", "Portátil", "Teclado", "Ratón", "Pantalla", "Chip", "Batería", "Cable", "Enchufe", "Antena", "Dron", "Holograma", "Amistad", "Amor", "Odio", "Miedo", "Alegría", "Tristeza", "Enfado", "Sueño", "Pesadilla", "Suerte", "Destino", "Ilusión", "Secreto", "Mentira", "Verdad", "Silencio", "Ruido", "Sonido", "Luz", "Sombra", "Color", "Rojo", "Azul", "Verde", "Amarillo", "Negro", "Blanco", "Gris", "Rosa", "Morado", "Marrón", "Fuego", "Hielo", "Viento", "Tierra", "Metal", "Plástico", "Cristal", "Papel"];

// --- NAVEGACIÓN CORREGIDA ---
function showSetup() {
    const user = document.getElementById('username').value.trim();
    if(!user) return alert("Ponte un nombre");
    
    document.getElementById('screen-start').classList.add('hidden');
    document.getElementById('screen-setup').classList.remove('hidden');
}

function showJoin() {
    const user = document.getElementById('username').value.trim();
    if(!user) return alert("Ponte un nombre");
    
    document.getElementById('screen-start').classList.add('hidden');
    document.getElementById('screen-join').classList.remove('hidden');
}

// --- CONEXIÓN CORREGIDA ---
async function conectar(hostStatus) {
    username = document.getElementById('username').value.trim();
    isHost = hostStatus;
    
    if (isHost) {
        room = Math.random().toString(36).substring(2, 7).toUpperCase();
    } else {
        room = document.getElementById('roomCode').value.trim().toUpperCase();
        if (!room) return alert("Introduce un código de sala");
    }

    try {
        // REGISTRO AUTOMÁTICO EN SUPABASE
        await registrarEnSupabase(username);

        // INICIALIZAR ABLY
        ably = new Ably.Realtime({ 
            key: 'p8bI4A.Qzfliw:Q-6tMsULgdbiI-duhVO96UCU9e1dTtIN7YfKQh7F30U', 
            clientId: username 
        });
        channel = ably.channels.get('room-' + room);

        // CAMBIO DE PANTALLA
        document.querySelectorAll('.card').forEach(c => c.classList.add('hidden'));
        document.getElementById('screen-lobby').classList.remove('hidden');
        document.getElementById('display-room').innerText = room;

        // SUSCRIPCIONES
        channel.presence.subscribe('enter', updateLobby);
        channel.presence.subscribe('leave', updateLobby);
        channel.presence.enter();

        channel.subscribe('start-game', (msg) => startGame(msg.data));
        channel.subscribe('mensaje', (msg) => appendMsg(msg.data));
        channel.subscribe('pasar-turno', () => nextTurn());
        channel.subscribe('voto-decision', (msg) => handleDecision(msg.data));
        channel.subscribe('vote-cast', (msg) => handleExpulsion(msg.data));
        channel.subscribe('voto-mapa', (msg) => registrarVotoMapa(msg.data.mapa));
        channel.subscribe('volver-lobby-global', () => irAlLobby());

        if(isHost) document.getElementById('startBtn').classList.remove('hidden');
        
        updateLobby();

    } catch (error) {
        console.error(error);
        alert("Error al conectar: " + error.message);
    }
}
async function registrarEnSupabase(name) {
    const { data } = await supabase.from('profiles').select('*').eq('username', name).single();
    if (!data) {
        await supabase.from('profiles').insert([{ username: name, points: 0 }]);
    }
}

function updateLobby() {
    channel.presence.get((err, members) => {
        players = members.map(m => m.clientId);
        const list = document.getElementById('player-list');
        list.innerHTML = players.map(p => `<div class="player-tag">${p}</div>`).join('');
    });
}

// --- LÓGICA DE MAPAS ---
function votarMapa(mapa) { channel.publish('voto-mapa', { mapa }); }
function registrarVotoMapa(mapa) {
    votosMapas[mapa]++;
    const ganador = Object.keys(votosMapas).reduce((a, b) => votosMapas[a] > votosMapas[b] ? a : b);
    document.body.className = 'map-' + ganador;
}

// --- PARTIDA ---
function repartirRoles() {
    if(players.length < 3) return alert("Mínimo 3 jugadores");
    let orden = [...players].sort(() => 0.5 - Math.random());
    const palabra = bibliotecaPalabras[Math.floor(Math.random() * bibliotecaPalabras.length)];
    const numImp = parseInt(document.getElementById('cfg-impostors').value) || 1;
    const impostores = [...orden].sort(() => 0.5 - Math.random()).slice(0, numImp);
    channel.publish('start-game', { impostores, palabra, players: orden });
}

function startGame(data) {
    eliminated = [];
    roles = data;
    players = data.players;
    document.getElementById('screen-lobby').classList.add('hidden');
    document.getElementById('screen-game').classList.remove('hidden');
    document.getElementById('screen-end').classList.add('hidden');
    document.getElementById('chat-messages').innerHTML = '';
    
    const esImp = data.impostores.includes(username);
    document.getElementById('role-message').innerHTML = esImp ? `<b style="color:#ef4444">IMPOSTOR</b>` : `<b style="color:#10b981">INOCENTE: ${data.palabra}</b>`;
    turnIndex = 0;
    actualizarTurno();
}

function actualizarTurno() {
    const actual = players[turnIndex];
    if(eliminated.includes(actual)) { nextTurn(); return; }
    const ind = document.getElementById('turn-indicator');
    const input = document.getElementById('messageInput');
    const btn = document.getElementById('sendBtn');
    
    if(actual === username) {
        ind.innerText = "⭐ TU TURNO";
        input.disabled = btn.disabled = false;
    } else {
        ind.innerText = `Turno de: ${actual}`;
        input.disabled = btn.disabled = true;
    }
}

function enviarMensaje() {
    const val = document.getElementById('messageInput').value;
    if(val) {
        channel.publish('mensaje', { user: username, text: val });
        document.getElementById('messageInput').value = '';
        channel.publish('pasar-turno', {});
    }
}

function nextTurn() {
    turnIndex++;
    if(turnIndex >= players.length) {
        if(!eliminated.includes(username)) document.getElementById('decision-panel').classList.remove('hidden');
    } else {
        actualizarTurno();
    }
}

function votarDecision(tipo) {
    channel.publish('voto-decision', { tipo });
    document.getElementById('decision-panel').classList.add('hidden');
}

function handleDecision(data) {
    decisiones[data.tipo]++;
    decisiones.total++;
    const vivos = players.length - eliminated.length;
    if(decisiones.total >= vivos) {
        if(decisiones.votar >= decisiones.ronda) {
            if(!eliminated.includes(username)) abrirVotacion();
        } else {
            turnIndex = 0; decisiones = { ronda: 0, votar: 0, total: 0 };
            actualizarTurno();
        }
    }
}

function abrirVotacion() {
    document.getElementById('vote-modal').classList.remove('hidden');
    const vivos = players.filter(p => !eliminated.includes(p));
    document.getElementById('vote-options').innerHTML = vivos.map(p => `<button onclick="votarA('${p}')">${p}</button>`).join('');
}

function votarA(obj) {
    channel.publish('vote-cast', { obj });
    document.getElementById('vote-modal').classList.add('hidden');
}

function handleExpulsion(data) {
    votosExp[data.obj] = (votosExp[data.obj] || 0) + 1;
    const total = Object.values(votosExp).reduce((a,b)=>a+b, 0);
    if(total >= (players.length - eliminated.length)) {
        const exp = Object.keys(votosExp).reduce((a,b)=>votosExp[a]>votosExp[b]?a:b);
        eliminated.push(exp);
        votosExp = {};
        checkWin();
    }
}

// --- VICTORIA Y RANKING ---
async function checkWin() {
    const impVivos = roles.impostores.filter(i => !eliminated.includes(i));
    const inoVivos = players.filter(p => !roles.impostores.includes(p) && !eliminated.includes(p));

    if(impVivos.length === 0) {
        await sumarPuntos(players.filter(p => !roles.impostores.includes(p)), 100);
        showEnd("¡GANAN INOCENTES!");
    } else if(inoVivos.length <= impVivos.length) {
        await sumarPuntos(roles.impostores, 300);
        showEnd("¡GANA IMPOSTOR!");
    } else {
        turnIndex = 0; decisiones = { ronda: 0, votar: 0, total: 0 };
        actualizarTurno();
    }
}

async function sumarPuntos(lista, pts) {
    for (let pName of lista) {
        const { data } = await supabase.from('profiles').select('points').eq('username', pName).single();
        if (data) await supabase.from('profiles').update({ points: data.points + pts }).eq('username', pName);
    }
}

async function showEnd(titulo) {
    document.getElementById('screen-game').classList.add('hidden');
    document.getElementById('screen-end').classList.remove('hidden');
    document.getElementById('end-title').innerText = titulo;
    
    const { data: top } = await supabase.from('profiles').select('username, points').order('points', { ascending: false }).limit(5);
    document.getElementById('end-details').innerHTML = `<h3>🏆 TOP 5 GLOBAL</h3>` + top.map((p, i) => `<div>${i+1}. ${p.username} - ${p.points} pts</div>`).join('');
    
    if(isHost) document.getElementById('btn-replay').classList.remove('hidden');
}

function publicarRegreso() { channel.publish('volver-lobby-global', {}); }
function irAlLobby() {
    document.getElementById('screen-end').classList.add('hidden');
    document.getElementById('screen-lobby').classList.remove('hidden');
}

function appendMsg(data) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${data.user === username ? 'self' : 'other'}`;
    div.innerHTML = `<strong>${data.user}:</strong> ${data.text}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

