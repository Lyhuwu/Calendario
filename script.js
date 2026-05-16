// 1. CONFIGURACIÓN DE FIREBASE
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

// ✅ URL REAL DE TU MACRODROID
const URL_MI_BOT_PROPIO = "https://trigger.macrodroid.com/545af313-a7e7-4ca9-8a78-1072e5a07f97/alerta_sofi";

let fechaActualAlmanaque = new Date();
let listaFechasGuardadas = []; 

// 2. ELEMENTOS DE LA PÁGINA
const modalCalendario = document.getElementById("modal-calendario");
const btnCalendario = document.getElementById("btn-calendario");
const cerrarCalendario = document.getElementById("cerrar-calendario");
const btnGuardarFecha = document.getElementById("btn-guardar-fecha");
const fechaInput = document.getElementById("fecha-input");
const descInput = document.getElementById("desc-input");
const listaFechas = document.getElementById("lista-fechas");
const contenedorAlmanaque = document.getElementById("almanaque-visual");

const modalCuriosidades = document.getElementById("modal-curiosidades");
document.getElementById("btn-curiosidades").onclick = () => modalCuriosidades.style.display = "flex";
document.getElementById("cerrar-curiosidades").onclick = () => modalCuriosidades.style.display = "none";

btnCalendario.onclick = () => { modalCalendario.style.display = "flex"; cargarFechas(); };
cerrarCalendario.onclick = () => modalCalendario.style.display = "none";

window.onclick = (event) => {
    if (event.target == modalCuriosidades) modalCuriosidades.style.display = "none";
    if (event.target == modalCalendario) modalCalendario.style.display = "none";
};

// Acordeón de secretos
document.querySelectorAll('.secreto-item').forEach(secreto => {
    const pregunta = secreto.querySelector('.secreto-pregunta');
    if(pregunta) {
        pregunta.addEventListener('click', () => {
            const respuesta = secreto.querySelector('.secreto-respuesta');
            respuesta.style.display = (respuesta.style.display === "block") ? "none" : "block";
        });
    }
});

// 3. DIBUJAR ALMANAQUE NATIVO (MARCA EL DÍA ACTUAL Y LOS EVENTOS)
function dibujarAlmanaque() {
    const año = fechaActualAlmanaque.getFullYear();
    const mes = fechaActualAlmanaque.getMonth();
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const primerDiaIndex = new Date(año, mes, 1).getDay(); 
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();

    // Obtener el día de hoy exacto del celular
    const hoyObjeto = new Date();
    const hoyAño = hoyObjeto.getFullYear();
    const hoyMes = hoyObjeto.getMonth();
    const hoyDia = hoyObjeto.getDate();

    let html = `<div class="almanaque-header"><button id="ant-mes"><i class="fas fa-chevron-left"></i></button><span>${nombresMeses[mes]} ${año}</span><button id="sig-mes"><i class="fas fa-chevron-right"></i></button></div><div class="almanaque-semana"><div>Do</div><div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sá</div></div><div class="almanaque-dias">`;

    for (let i = 0; i < primerDiaIndex; i++) html += `<div class="dia-celda dia-vacio"></div>`;
    
    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const f = `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        
        // Verifica si esta celda específica es el día de hoy
        const esHoy = (año === hoyAño && mes === hoyMes && dia === hoyDia);
        
        const claseEvento = listaFechasGuardadas.includes(f) ? "dia-con-evento" : "";
        const claseHoy = esHoy ? "dia-actual" : "";
        
        html += `<div class="dia-celda ${claseEvento} ${claseHoy}" data-fecha="${f}">${dia}</div>`;
    }
    html += `</div>`;
    contenedorAlmanaque.innerHTML = html;

    document.getElementById("ant-mes").onclick = () => { fechaActualAlmanaque.setMonth(fechaActualAlmanaque.getMonth() - 1); dibujarAlmanaque(); };
    document.getElementById("sig-mes").onclick = () => { fechaActualAlmanaque.setMonth(fechaActualAlmanaque.getMonth() + 1); dibujarAlmanaque(); };

    contenedorAlmanaque.querySelectorAll('.dia-celda:not(.dia-vacio)').forEach(celda => {
        celda.onclick = () => {
            const fecha = celda.getAttribute('data-fecha');
            fechaInput.value = fecha;
            if (celda.classList.contains('dia-con-evento')) {
                const tarjeta = document.getElementById(`tarjeta-${fecha}`);
                if(tarjeta) {
                    tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    tarjeta.classList.add('tarjeta-enfocada');
                    setTimeout(() => tarjeta.classList.remove('tarjeta-enfocada'), 1500);
                }
            }
        };
    });
}

// --- LEER EVENTOS DESDE FIREBASE ---
function cargarFechas() {
    db.collection("fechas").get().then((querySnapshot) => {
        listaFechas.innerHTML = ""; let notas = []; listaFechasGuardadas = []; 
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notas.push({ id: doc.id, fecha: data.fecha, descripcion: data.descripcion });
            listaFechasGuardadas.push(data.fecha); 
        });
        notas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        notas.forEach((nota) => {
            const div = document.createElement("div");
            div.className = "secreto-item glass-mini fecha-item";
            div.id = `tarjeta-${nota.fecha}`; 
            div.innerHTML = `<div class="fecha-header"><strong>${nota.fecha}</strong><button class="btn-eliminar" onclick="eliminarFecha('${nota.id}')"><i class="fas fa-trash-alt"></i></button></div><p>${nota.descripcion}</p>`;
            listaFechas.appendChild(div);
        });
        dibujarAlmanaque();
        motorVerificacionPropio(notas); // Ejecuta el revisor de alertas
    });
}

// --- 🔔 MOTOR INTELIGENTE: REVISA UN DÍA ANTES Y EL MERO DÍA ---
function motorVerificacionPropio(listaFechas) {
    const hoy = new Date();
    const mañana = new Date();
    mañana.setDate(hoy.getDate() + 1);

    // Formatear las fechas locales en formato YYYY-MM-DD
    const stringHoy = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
    const stringMañana = `${mañana.getFullYear()}-${String(mañana.getMonth()+1).padStart(2,'0')}-${String(mañana.getDate()).padStart(2,'0')}`;

    listaFechas.forEach((item) => {
        let mensajeAlerta = "";
        
        if (item.fecha === stringHoy) {
            mensajeAlerta = `¡Es hoy! 🎉 Hoy celebramos vuestra fecha especial: ${item.descripcion}. ¡Feliz día! 💕`;
        } else if (item.fecha === stringMañana) {
            mensajeAlerta = `¡Recuerdo tierno! 🌹 Mañana se cumple un momento muy especial: ${item.descripcion}. ¡Que no se te pase! 🥰`;
        }

        // Si coincide con hoy o con mañana, manda el silbido al celular
        if (mensajeAlerta !== "") {
            fetch(`${URL_MI_BOT_PROPIO}?alerta_msg=${encodeURIComponent(mensajeAlerta)}`, { mode: 'no-cors' })
                .then(() => console.log("Alerta enviada para el evento de la fecha: " + item.fecha))
                .catch(err => console.error("Error al enviar señal:", err));
        }
    });
}

// --- AGREGAR Y ELIMINAR FECHAS ---
btnGuardarFecha.onclick = () => {
    if (fechaInput.value === "" || descInput.value === "") { alert("Por favor llena ambos campos 😊"); return; }
    db.collection("fechas").add({ fecha: fechaInput.value, descripcion: descInput.value }).then(() => {
        fechaInput.value = ""; descInput.value = ""; cargarFechas();
    });
};

function eliminarFecha(id) {
    if (confirm("¿Borrar este recuerdo? 🥺")) { db.collection("fechas").doc(id).delete().then(() => cargarFechas()); }
}
