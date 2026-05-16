// Importar las librerías de Firebase dentro del Service Worker móvil
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js');

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

// Al instalarse el Service Worker en el celular de Sofi
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
    // Programar la primera revisión automática en cuanto se activa
    revisarFechasYNotificar();
});

// Escuchar una señal del script principal para forzar revisión inmediata
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'REVISAR_FECHAS') {
        revisarFechasYNotificar();
    }
});

// El motor del despertador interno
function revisarFechasYNotificar() {
    const hoy = new Date();
    
    // Calcular la fecha de hoy en formato YYYY-MM-DD
    const stringHoy = formatearFechaString(hoy);
    
    // Calcular la fecha de mañana en formato YYYY-MM-DD
    const mañana = new Date();
    mañana.setDate(hoy.getDate() + 1);
    const stringMañana = formatearFechaString(mañana);

    db.collection("fechas").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            if (data.fecha === stringHoy) {
                lanzarNotificacionCelular("¡Es hoy! 💖", `Hoy celebramos: ${data.descripcion}. ¡Ve a ver vuestro rincón!`);
            } else if (data.fecha === stringMañana) {
                lanzarNotificacionCelular("Mañana es un día especial... 🌹", `Prepárate, mañana se cumple: ${data.descripcion}`);
            }
        });
    }).catch(err => console.error("Error en sw al leer Firebase:", err));
}

function lanzarNotificacionCelular(titulo, mensaje) {
    const opciones = {
        body: mensaje,
        icon: 'pinguino.png', // Usa tu mismo pingüino como icono de notificación
        badge: 'pinguino.png',
        vibrate: [200, 100, 200],
        data: { url: self.location.origin } // Abre la página al darle click
    };

    self.registration.showNotification(titulo, opciones);
}

function formatearFechaString(fechaObj) {
    const año = fechaObj.getFullYear();
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaObj.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

// Revisa la base de datos automáticamente cada 12 horas en segundo plano
setInterval(() => {
    revisarFechasYNotificar();
}, 12 * 60 * 60 * 1000);

// Manejar el click en la notificación para abrir tu rincón privado
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});
