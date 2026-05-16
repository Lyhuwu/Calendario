// --- LÓGICA DEL INICIO DE SESIÓN ---
const pantallaLogin = document.getElementById("pantalla-login");
const appPrincipal = document.getElementById("app-principal");
const btnLogin = document.getElementById("btn-login");
const loginError = document.getElementById("login-error");

// Checar si ya iniciaron sesión antes para no pedírselos siempre
if (localStorage.getItem("sesionIniciada") === "true") {
    pantallaLogin.classList.add("oculto");
    appPrincipal.classList.remove("oculto");
}

btnLogin.addEventListener("click", () => {
    const user = document.getElementById("login-user").value.trim();
    const pass = document.getElementById("login-pass").value.trim();
    
    // Si escriben cualquier cosa, los dejamos pasar. Es un login simulado.
    if (user !== "" && pass !== "") { 
        localStorage.setItem("sesionIniciada", "true");
        localStorage.setItem("usuario", user);
        pantallaLogin.classList.add("oculto");
        appPrincipal.classList.remove("oculto");
    } else {
        loginError.classList.remove("oculto");
    }
});

// --- CONFIGURACIÓN DE FIREBASE (Con tus llaves reales integradas) ---
const firebaseConfig = {
    apiKey: "AIzaSyD_WiArRCE8_x7il5xaKCVkrHJo9mW6DT0",
    authDomain: "calendario-sofii.firebaseapp.com",
    projectId: "calendario-sofii",
    storageBucket: "calendario-sofii.firebasestorage.app",
    messagingSenderId: "510593512305",
    appId: "1:510593512305:web:4bd38144068d757beafcd0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// URL de tu bot en MacroDroid
const URL_MI_BOT_PROPIO = "https://trigger.macrodroid.com/545af313-a7e7-4ca9-8a78-1072e5a07f97/alerta_sofi";

const gridCalendario = document.getElementById("calendario-grid");
const textoMesAnio = document.getElementById("mes-anio");
const modalEvento = document.getElementById("modal-evento");
const btnCerrarModal = document.getElementById("cerrar-modal");
const inputTextoEvento = document.getElementById("texto-evento");
const btnGuardarEvento = document.getElementById("btn-guardar-evento");
const btnEliminarEvento = document.getElementById("btn-eliminar-evento");
const textoFechaSeleccionada = document.getElementById("fecha-seleccionada-texto");
const listaEventos = document.getElementById('lista-eventos');

let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();
let fechaEnFoco = "";
let idEventoEnFoco = null;
let eventosDB = {};

function enviarAlertaMagica(mensaje) {
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlFinal = `${URL_MI_BOT_PROPIO}?alerta_msg=${mensajeCodificado}`;
    fetch(urlFinal).catch(error => console.error("Error de conexión:", error));
}

// Botón de WhatsApp con tu número real
document.getElementById('btn-whatsapp').addEventListener('click', () => {
    window.location.href = "https://api.whatsapp.com/send?phone=527341178986"; 
});

// Cargar eventos y construir la lista visual
db.collection("eventosSofi").orderBy("fecha", "asc").onSnapshot((snapshot) => {
    eventosDB = {};
    listaEventos.innerHTML = "";
    const hoyStr = new Date().toISOString().split('T')[0];

    snapshot.forEach((doc) => {
        const data = doc.data();
        eventosDB[data.fecha] = { id: doc.id, ...data };
        
        // --- CREACIÓN DE LA TARJETA DEL EVENTO REDISEÑADA ---
        const divCard = document.createElement("div");
        divCard.className = "evento-item";
        divCard.innerHTML = `
            <div class="evento-info">
                <h4>📅 ${data.fecha}</h4>
                <p>✨ ${data.texto}</p>
            </div>
            <button class="btn-eliminar-card" title="Borrar">🗑️</button>
        `;

        // Navegar al mes del calendario al hacer clic en la tarjeta
        divCard.addEventListener('click', (e) => {
            // Evitar que funcione si le picaron a la papelera
            if (e.target.closest('.btn-eliminar-card')) return;
            
            const partes = data.fecha.split('-'); 
            anioActual = parseInt(partes[0]);
            mesActual = parseInt(partes[1]) - 1;
            dibujarCalendario();
            document.querySelector('.seccion-calendario').scrollIntoView({ behavior: 'smooth' });
        });

        // Funcionalidad del botón de papelera
        divCard.querySelector('.btn-eliminar-card').addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm("¿Segura que quieres borrar este recuerdo?")) {
                db.collection("eventosSofi").doc(doc.id).delete();
            }
        });

        listaEventos.appendChild(divCard);

        if (data.fecha === hoyStr && !data.avisado) {
            enviarAlertaMagica(`¡Hoy es un día especial en nuestro rincón! 💙💜 ${data.texto}`);
            db.collection("eventosSofi").doc(doc.id).update({ avisado: true });
        }
    });
    
    dibujarCalendario(); 
});

function dibujarCalendario() {
    gridCalendario.innerHTML = "";
    const primerDia = new Date(anioActual, mesActual, 1).getDay();
    const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    textoMesAnio.innerText = `${nombresMeses[mesActual]} ${anioActual}`;
    
    const hoy = new Date();
    const strHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    
    for (let i = 0; i < primerDia; i++) {
        gridCalendario.appendChild(document.createElement("div"));
    }
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
        let divDia = document.createElement("div");
        divDia.className = "dia";
        divDia.innerText = dia;
        
        let fechaStr = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        if (fechaStr === strHoy) divDia.classList.add("dia-actual");
        if (eventosDB[fechaStr]) divDia.classList.add("dia-con-evento");
        
        divDia.addEventListener("click", () => abrirModal(fechaStr));
        gridCalendario.appendChild(divDia);
    }
}

function abrirModal(fechaStr) {
    fechaEnFoco = fechaStr;
    textoFechaSeleccionada.innerText = `Evento para el: ${fechaStr}`;
    
    if (eventosDB[fechaStr]) {
        inputTextoEvento.value = eventosDB[fechaStr].texto;
        idEventoEnFoco = eventosDB[fechaStr].id;
        btnEliminarEvento.classList.remove("oculto");
    } else {
        inputTextoEvento.value = "";
        idEventoEnFoco = null;
        btnEliminarEvento.classList.add("oculto");
    }
    modalEvento.classList.remove("oculto");
}

btnCerrarModal.addEventListener("click", () => modalEvento.classList.add("oculto"));

document.getElementById("btn-mes-anterior").addEventListener("click", () => {
    mesActual--; if (mesActual < 0) { mesActual = 11; anioActual--; }
    dibujarCalendario();
});

document.getElementById("btn-mes-siguiente").addEventListener("click", () => {
    mesActual++; if (mesActual > 11) { mesActual = 0; anioActual++; }
    dibujarCalendario();
});

btnGuardarEvento.addEventListener("click", () => {
    const texto = inputTextoEvento.value;
    if (!texto) return alert("Por favor escribe algo para el evento.");
    
    const datosEvento = { fecha: fechaEnFoco, texto: texto, avisado: false };
    
    if (idEventoEnFoco) {
        db.collection("eventosSofi").doc(idEventoEnFoco).update(datosEvento).then(() => modalEvento.classList.add("oculto"));
    } else {
        db.collection("eventosSofi").add(datosEvento).then(() => {
            const hoyStr = new Date().toISOString().split('T')[0];
            if (fechaEnFoco === hoyStr) {
                enviarAlertaMagica(`¡Se guardó un evento para hoy! 💙💜 ${texto}`);
            }
            modalEvento.classList.add("oculto");
        });
    }
});

btnEliminarEvento.addEventListener("click", () => {
    if (confirm("¿Segura que quieres borrar este recuerdo?")) {
        db.collection("eventosSofi").doc(idEventoEnFoco).delete().then(() => modalEvento.classList.add("oculto"));
    }
});
