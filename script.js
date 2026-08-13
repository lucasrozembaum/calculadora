/**
 * Calculadora Rural & Gestión Paritaria Multi-Categoría
 * Delegación Córdoba Capital — CAR 5
 * Escalas Oficiales Homologadas - VIGENCIA JULIO 2026
 */

// ============================================================================
// === 1. CONFIGURACIÓN GENERAL Y FIREBASE ===
// ============================================================================
const USER_PIN = "delegacioncordoba";
const ADMIN_PIN = "admincordoba";
const DESTINATARIO_MAIL = "lucasrozembaum@gmail.com";

const firebaseConfig = {
  apiKey: "AIzaSyAYmr5gh35AP2aBAmG7nUG19Sv4p34Zlzk",
  authDomain: "firestore-database-5f05d.firebaseapp.com",
  projectId: "firestore-database-5f05d",
  storageBucket: "firestore-database-5f05d.firebasestorage.app",
  messagingSenderId: "367295191590",
  appId: "1:367295191590:web:1e0eb7e3b827e85c13b3ec",
};

let db = null;
try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
  }
} catch (e) {
  console.warn("Firebase funcionando en modo offline local.", e);
}

let currentUserRole = null;
let logoClicks = 0;
let logoClickTimer = null;
let ultimaGrillaCalculada = [];
let ultimosTramos = [];
let categoriasActividadActual = [];

// ============================================================================
// === 2. BASE DE DATOS DE ACTIVIDADES Y TAREAS (JULIO 2026) ===
// ============================================================================
const ACTIVIDADES_PRECARGADAS = [
  {
    nombre: "Floricultura y Viveros",
    categorias: [
      {
        nombre: "Trabajador no calificado",
        basico: 1206136.54,
        jornal: 59623.41,
      },
      {
        nombre: "Trabajador semi calificado",
        basico: 1236235.1,
        jornal: 63132.47,
      },
      { nombre: "Trabajador calificado", basico: 1281523.35, jornal: 63433.45 },
      { nombre: "Conductor tractorista", basico: 1326649.99, jornal: 65671.8 },
      { nombre: "Chofer", basico: 1341750.78, jornal: 66344.52 },
      { nombre: "Mecánico", basico: 1387037.02, jornal: 68586.91 },
      {
        nombre: "Puestero o sereno con vivienda",
        basico: 1329884.29,
        jornal: 0,
      },
      { nombre: "Capataz", basico: 1466942.97, jornal: 0 },
      { nombre: "Encargado", basico: 1547440.83, jornal: 0 },
    ],
  },
  {
    nombre: "Desmalezado Manual (Desyuyada)",
    categorias: [
      { nombre: "Jornal Mínimo Garantizado", basico: 114842.95, jornal: 0 },
      { nombre: "Adicional Comida", basico: 19177.28, jornal: 0 },
    ],
  },
  {
    nombre: "Cosecha de Papa (Todas las tareas)",
    categorias: [
      { nombre: "Sueldo Mensual Garantizado", basico: 1015374.15, jornal: 0 },
      { nombre: "Jornal del Personal de Cosecha", basico: 44674.3, jornal: 0 },
      {
        nombre: "Jornal por Hectárea (Temporario)",
        basico: 50537.4,
        jornal: 0,
      },
      {
        nombre: "Abridor de surco (Maquinista c/disco o reja por día)",
        basico: 49836.37,
        jornal: 0,
      },
      { nombre: "Fichero por día", basico: 44674.3, jornal: 0 },
      { nombre: "Juntando en bolsa (por bolsa)", basico: 535.9, jornal: 0 },
      { nombre: "Juntando con canasto (por bolsa)", basico: 573.57, jornal: 0 },
      {
        nombre: "Juntando en maleta-bolsa (juntar, coser y cargar)",
        basico: 1094.98,
        jornal: 0,
      },
      {
        nombre: "Sacar bolsas rastrojo boca abierta a montón en galpón",
        basico: 535.9,
        jornal: 0,
      },
      {
        nombre: "Clasificación en montón, embolsado s/costura s/recalcar",
        basico: 347.62,
        jornal: 0,
      },
      {
        nombre: "Costurero-Embocador (Boca cerrada)",
        basico: 150.64,
        jornal: 0,
      },
      {
        nombre: "Costurero-Embocador (Boca zig-zag / media rejilla)",
        basico: 173.81,
        jornal: 0,
      },
      {
        nombre: "Costurero-Embocador (Boca rejilla doble)",
        basico: 185.39,
        jornal: 0,
      },
      {
        nombre: "Recalcador (por bolsa y por obrero)",
        basico: 269.4,
        jornal: 0,
      },
      { nombre: "Carga en chacra con cinta", basico: 269.4, jornal: 0 },
      { nombre: "Carga en chacra sin cinta", basico: 347.62, jornal: 0 },
      {
        nombre: "Adicional Comida cuadrilla cargadora",
        basico: 8980.05,
        jornal: 0,
      },
      {
        nombre: "Descarga/carga a pila o vehículo s/cinta",
        basico: 347.62,
        jornal: 0,
      },
      {
        nombre: "Descarga/carga c/cinta hasta 12 bolsas altura",
        basico: 269.4,
        jornal: 0,
      },
      {
        nombre: "Zarandear, embolsar y coser dejando bolsa parada",
        basico: 425.83,
        jornal: 0,
      },
      {
        nombre: "Adicional estibar/acomodar sobre salario cuadrilla",
        basico: 95.59,
        jornal: 0,
      },
      {
        nombre: "Carga usando burro/plancha baranda fija c/travesaño",
        basico: 347.62,
        jornal: 0,
      },
      {
        nombre: "Recargo carga camión baranda fija excede altura",
        basico: 95.59,
        jornal: 0,
      },
      {
        nombre: "Preparación Semillas - Corte a mano (por bolsa)",
        basico: 1381.77,
        jornal: 0,
      },
      {
        nombre: "Preparación Semillas - Corte a máquina (por bolsa)",
        basico: 924.08,
        jornal: 0,
      },
    ],
  },
  {
    nombre: "Arreo de Ganados y Remates en Feria",
    categorias: [
      { nombre: "Peón general mensualizado", basico: 977805.71, jornal: 0 },
      { nombre: "Jornal Mínimo Garantizado", basico: 84974.04, jornal: 0 },
      {
        nombre: "Capataz con caballo (>50km c/comida por día)",
        basico: 116541.44,
        jornal: 0,
      },
      {
        nombre: "Peón con caballo (>50km c/comida por día)",
        basico: 91570.24,
        jornal: 0,
      },
      {
        nombre: "Carrero sin elementos de trabajo (>50km)",
        basico: 105252.44,
        jornal: 0,
      },
      {
        nombre: "Carrero c/carro y caballos propios (>50km)",
        basico: 45442.97,
        jornal: 0,
      },
      {
        nombre: "Viaje ida/vuelta recibir tropa (por legua / 5km s/comida)",
        basico: 814.9,
        jornal: 0,
      },
      {
        nombre: "Adicional cuereado por animal muerto",
        basico: 17502.83,
        jornal: 0,
      },
      {
        nombre: "Arreo corta distancia (<50km) Capataz c/elem cada 5km",
        basico: 17502.83,
        jornal: 0,
      },
      {
        nombre: "Arreo corta distancia (<50km) Resero c/elem cada 5km",
        basico: 9134.95,
        jornal: 0,
      },
      { nombre: "Adicional Comida Arreos", basico: 17922.22, jornal: 0 },
      {
        nombre: "Remate Feria: Capataz (Por Día)",
        basico: 153706.67,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Capataz (Medio Día)",
        basico: 92155.2,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Clasificador (Por Día)",
        basico: 115952.79,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Clasificador (Medio Día)",
        basico: 69071.33,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Adicional Pistero (Por Día)",
        basico: 14493.47,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Peón caballo propio (Por Día)",
        basico: 111650.2,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Peón caballo patrón (Por Día)",
        basico: 103175.63,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Peón a pie (Por Día)",
        basico: 67943.58,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Peón a pie (Medio Día)",
        basico: 40563.63,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Rondador nocturno c/caballo",
        basico: 100721.75,
        jornal: 0,
      },
      {
        nombre: "Remate Feria: Comida asado mañana",
        basico: 14513.63,
        jornal: 0,
      },
      { nombre: "Remate Feria: Comida almuerzo", basico: 17502.82, jornal: 0 },
      { nombre: "Recargo trabajo bajo lluvia", basico: 13029.17, jornal: 0 },
      {
        nombre: "Recargo trabajo terreno en mal estado",
        basico: 11645.86,
        jornal: 0,
      },
      { nombre: "Cargar hacienda camión Vacunos", basico: 229.94, jornal: 0 },
      { nombre: "Cargar hacienda vagón Vacunos", basico: 255.69, jornal: 0 },
      {
        nombre: "Locales Exposición: Peón a pie (Por día)",
        basico: 69991.08,
        jornal: 0,
      },
      {
        nombre: "Locales Exposición: Sereno (Por día)",
        basico: 103059.75,
        jornal: 0,
      },
    ],
  },
  {
    nombre: "Lavaderos de Verduras (Sueldos y Rendimiento)",
    categorias: [
      { nombre: "Peón general mensual", basico: 1223441.01, jornal: 0 },
      { nombre: "Jornal diario", basico: 55603.65, jornal: 0 },
      {
        nombre: "Conductor tractorista o motoelevador",
        basico: 1280783.3,
        jornal: 0,
      },
      { nombre: "Encargado", basico: 1511569.6, jornal: 0 },
      { nombre: "Bolsa de zanahoria común x 18 kg", basico: 564.56, jornal: 0 },
      { nombre: "Bolsa de zanahoria común x 10 kg", basico: 312.29, jornal: 0 },
      { nombre: "Bolsa de zanahoria extra x 20 kg", basico: 498.3, jornal: 0 },
      {
        nombre: "Bolsa de zanahoria fraccionada x 20 kg",
        basico: 625.58,
        jornal: 0,
      },
      { nombre: "Bolsa de batata x 19 kg", basico: 500.27, jornal: 0 },
      { nombre: "Bolsa de papa lavada x 28 kg", basico: 727.28, jornal: 0 },
      { nombre: "Trasbordo bolsa grande con cinta", basico: 500.27, jornal: 0 },
      { nombre: "Trasbordo bolsa grande sin cinta", basico: 565.22, jornal: 0 },
      {
        nombre: "Carga de camión de cámara o galpón con cinta",
        basico: 249.97,
        jornal: 0,
      },
      {
        nombre: "Carga de camión de cámara o galpón sin cinta",
        basico: 312.29,
        jornal: 0,
      },
    ],
  },
  {
    nombre: "Cultivo de Hongos Comestibles",
    categorias: [
      {
        nombre: "Trabajador no calificado",
        basico: 969153.46,
        jornal: 51054.82,
      },
      {
        nombre: "Trabajador semi calificado",
        basico: 1028343.9,
        jornal: 50856.89,
      },
      { nombre: "Trabajador calificado", basico: 1075027.72, jornal: 54366.65 },
      { nombre: "Especializado", basico: 1114121.47, jornal: 53894.63 },
      { nombre: "Capataz", basico: 1138978.94, jornal: 54219.59 },
      { nombre: "Encargado", basico: 1175255.59, jornal: 55518.41 },
      { nombre: "Supervisor", basico: 1157652.97, jornal: 0 },
      {
        nombre: "Cosechador no permanente (por kilo)",
        basico: 522.4,
        jornal: 0,
      },
      {
        nombre: "Empacador no permanente (por kilo)",
        basico: 498.92,
        jornal: 0,
      },
    ],
  },
  {
    nombre: "Manipulación y Almacenamiento de Granos",
    categorias: [
      { nombre: "Jornal Mínimo Garantizado", basico: 44545.38, jornal: 0 },
      {
        nombre: "Descargar a granel / gravitación (por quintal)",
        basico: 29.54,
        jornal: 0,
      },
      {
        nombre: "Descargar a granel paleando (por quintal)",
        basico: 182.81,
        jornal: 0,
      },
      {
        nombre: "Palear en silos / celdas (por quintal)",
        basico: 587.14,
        jornal: 0,
      },
      {
        nombre: "Derecho carga/descarga c/cinta (por bolsa)",
        basico: 296.36,
        jornal: 0,
      },
      {
        nombre: "Derecho carga/descarga s/cinta (por bolsa)",
        basico: 369.55,
        jornal: 0,
      },
      { nombre: "Lauchero (por día)", basico: 73992.03, jornal: 0 },
    ],
  },
];

// ============================================================================
// === 3. INICIALIZACIÓN Y EVENT LISTENERS ===
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  fn_verificarActivacionApp();
  fn_inicializarEventos();
  fn_configurarTrucoLogo();
  fn_poblarSelectorActividades();
});

function fn_inicializarEventos() {
  document
    .getElementById("activateBtn")
    .addEventListener("click", fn_validarPinAcceso);
  document
    .getElementById("calcForm")
    .addEventListener("submit", fn_calcularIndemnizacion);
  document
    .getElementById("addCategoriaBtn")
    .addEventListener("click", () => fn_agregarFilaCategoria());
  document
    .getElementById("addTramoBtn")
    .addEventListener("click", () => fn_agregarFilaTramo());
  document
    .getElementById("paritariasForm")
    .addEventListener("submit", fn_guardarYCalcularGrilla);
  document
    .getElementById("downloadDocxBtn")
    .addEventListener("click", fn_generarDocumentoWord);
  document
    .getElementById("sendEmailBtn")
    .addEventListener("click", fn_enviarEmailDirecto);
  document
    .getElementById("selectHistorial")
    .addEventListener("change", fn_cargarDatosActividadSeleccionada);

  const selectHistAct = document.getElementById("selectHistorialPorActividad");
  if (selectHistAct) {
    selectHistAct.addEventListener(
      "change",
      fn_cargarDocumentoEspecificoHistorial,
    );
  }

  const reportBtn = document.getElementById("reportBtn");
  if (reportBtn) reportBtn.addEventListener("click", fn_mostrarModalUsoMensual);

  const closeReportBtn = document.getElementById("closeReportBtn");
  if (closeReportBtn)
    closeReportBtn.addEventListener("click", () => {
      document.getElementById("reportModal").classList.add("hidden");
    });

  const navCalc = document.getElementById("navCalcBtn");
  const navPari = document.getElementById("navParitariasBtn");
  if (navCalc)
    navCalc.addEventListener("click", () =>
      fn_cambiarVista("calcView", navCalc),
    );
  if (navPari)
    navPari.addEventListener("click", () =>
      fn_cambiarVista("paritariasView", navPari),
    );
}

// ============================================================================
// === 4. SISTEMA DE AUTENTICACIÓN Y ROLES ===
// ============================================================================
function fn_configurarTrucoLogo() {
  // Escucha los clics en cualquier logo de la app
  const logos = document.querySelectorAll(".delegacion-logo, .secret-logo");
  if (!logos.length) return;

  logos.forEach((logo) => {
    logo.addEventListener("click", () => {
      logoClicks++;
      if (logoClicks === 3) {
        clearTimeout(logoClickTimer);
        logoClicks = 0;
        let pass = prompt("Acceso Administrador Exclusivo (CAR 5):");
        if (pass && pass.trim().toLowerCase() === ADMIN_PIN) {
          currentUserRole = "admin";
          localStorage.setItem("user_role", "admin");
          fn_desbloquearApp();
          alert("¡Modo Administrador Activado!");
        } else if (pass !== null) {
          alert("Contraseña incorrecta.");
        }
      }
      clearTimeout(logoClickTimer);
      logoClickTimer = setTimeout(() => {
        logoClicks = 0;
      }, 1500);
    });
  });
}

function fn_validarPinAcceso() {
  const pin = document.getElementById("accessPin").value.trim().toLowerCase();
  if (pin === ADMIN_PIN) {
    currentUserRole = "admin";
    localStorage.setItem("user_role", "admin");
    fn_desbloquearApp();
  } else if (pin === USER_PIN) {
    currentUserRole = "user";
    localStorage.setItem("user_role", "user");
    fn_desbloquearApp();
  } else {
    document.getElementById("activationError").classList.remove("hidden");
  }
}

function fn_desbloquearApp() {
  document.getElementById("activationScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");

  if (currentUserRole === "admin") {
    const adminNav = document.getElementById("adminNav");
    const subtituloAdmin = document.getElementById("subtituloAdmin");
    const reportBtn = document.getElementById("reportBtn");

    if (adminNav) {
      adminNav.classList.remove("hidden");
      adminNav.style.display = "flex";
    }
    if (subtituloAdmin) subtituloAdmin.classList.remove("hidden");
    if (reportBtn) reportBtn.classList.remove("hidden");

    fn_cargarHistorialNube();
  }
}

function fn_verificarActivacionApp() {
  const role = localStorage.getItem("user_role");
  if (role) {
    currentUserRole = role;
    fn_desbloquearApp();
  }
}

function fn_cambiarVista(viewId, btnActive) {
  document
    .querySelectorAll(".app-view")
    .forEach((v) => v.classList.add("hidden"));
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.remove("hidden");

  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btnActive) btnActive.classList.add("active");
}

// ============================================================================
// === 5. ESTADÍSTICAS DE USO MENSUAL ===
// ============================================================================
function fn_obtenerMesCalendarioVigente() {
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const hoy = new Date();
  return `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;
}

async function fn_registrarUsoCalculadora(tipo = "Liquidación") {
  const hoy = new Date();
  const mesAnioKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  let usosLocales = JSON.parse(
    localStorage.getItem("usos_calculadora") || "{}",
  );
  usosLocales[mesAnioKey] = (usosLocales[mesAnioKey] || 0) + 1;
  localStorage.setItem("usos_calculadora", JSON.stringify(usosLocales));

  if (db) {
    try {
      await db.collection("estadisticas_uso").add({
        tipo: tipo,
        fecha: hoy.toISOString(),
        mesAnio: mesAnioKey,
      });
    } catch (e) {
      console.warn("Registro guardado en local:", e);
    }
  }
}

async function fn_mostrarModalUsoMensual() {
  const modal = document.getElementById("reportModal");
  const usageList = document.getElementById("usageList");

  if (!modal || !usageList) return;

  usageList.innerHTML = "<li>Cargando estadísticas...</li>";
  modal.classList.remove("hidden");

  let conteoMeses = {};

  let usosLocales = JSON.parse(
    localStorage.getItem("usos_calculadora") || "{}",
  );
  Object.keys(usosLocales).forEach((m) => {
    conteoMeses[m] = usosLocales[m];
  });

  if (db) {
    try {
      const snapshot = await db.collection("estadisticas_uso").get();
      if (!snapshot.empty) {
        let conteoNube = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.mesAnio) {
            conteoNube[data.mesAnio] = (conteoNube[data.mesAnio] || 0) + 1;
          }
        });
        Object.keys(conteoNube).forEach((m) => {
          conteoMeses[m] = Math.max(conteoMeses[m] || 0, conteoNube[m]);
        });
      }
    } catch (e) {
      console.warn("Usando estadísticas locales:", e);
    }
  }

  let html = "";
  const mesesOrdenados = Object.keys(conteoMeses).sort().reverse();
  const mesesNombres = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  if (mesesOrdenados.length === 0) {
    html = "<li>No hay cálculos registrados aún este mes.</li>";
  } else {
    mesesOrdenados.forEach((m) => {
      const [anio, mes] = m.split("-");
      const nombreMes = mesesNombres[parseInt(mes) - 1];
      html += `<li><strong>${nombreMes} ${anio}:</strong> ${conteoMeses[m]} cálculo(s) realizados</li>`;
    });
  }

  usageList.innerHTML = html;
}
// ============================================================================
// === 6. SELECTORES Y HISTORIAL POR ACTIVIDAD ===
// ============================================================================
function fn_poblarSelectorActividades() {
  const select = document.getElementById("selectHistorial");
  if (!select) return;
  select.innerHTML =
    '<option value="">-- Seleccionar Actividad / Convenio --</option>';

  ACTIVIDADES_PRECARGADAS.forEach((act, idx) => {
    const opt = document.createElement("option");
    opt.value = `pre_${idx}`;
    opt.text = act.nombre;
    select.add(opt);
  });
}

function fn_poblarDesplegableCategorias(categorias) {
  const selectCat = document.getElementById("selectCategoriaPrincipal");
  const container = document.getElementById("categoriasContainer");

  if (!selectCat || !container) return;
  selectCat.innerHTML = "";
  container.innerHTML = "";
  categoriasActividadActual = categorias || [];

  if (!categorias || categorias.length === 0) {
    selectCat.innerHTML =
      '<option value="">Sin categorías disponibles</option>';
    return;
  }

  categorias.forEach((cat, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    const txtJornal =
      cat.jornal && cat.jornal > 0
        ? ` | Por día: $${cat.jornal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
        : "";
    opt.text = `${cat.nombre} — Por mes: $${cat.basico.toLocaleString("es-AR", { minimumFractionDigits: 2 })}${txtJornal}`;
    selectCat.add(opt);
  });

  fn_agregarFilaCategoria(
    categorias[0].nombre,
    categorias[0].basico,
    categorias[0].jornal || 0,
  );

  selectCat.onchange = (e) => {
    const selectedIdx = e.target.value;
    container.innerHTML = "";
    if (selectedIdx !== "") {
      const cat = categorias[selectedIdx];
      fn_agregarFilaCategoria(cat.nombre, cat.basico, cat.jornal || 0);
    }
  };
}

// Carga la actividad seleccionada y busca TODOS los acuerdos históricos en Firebase
async function fn_cargarDatosActividadSeleccionada() {
  const val = document.getElementById("selectHistorial").value;
  const containerTram = document.getElementById("tramosContainer");
  const selectHistAct = document.getElementById("selectHistorialPorActividad");

  containerTram.innerHTML = "";
  if (!val) return;

  if (val.startsWith("pre_")) {
    const idx = parseInt(val.replace("pre_", ""));
    const act = ACTIVIDADES_PRECARGADAS[idx];

    document.getElementById("actividadNombre").value = act.nombre;
    const hoy = new Date();
    const mesIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
    document.getElementById("mesInicio").value = mesIso;

    fn_poblarDesplegableCategorias(act.categorias);
    fn_agregarFilaTramo(0, `Vigente ${fn_obtenerMesCalendarioVigente()}`);
    document.getElementById("paritariasResults").classList.add("hidden");

    if (selectHistAct) {
      selectHistAct.innerHTML = `<option value="vigente">✨ Escala Base Vigente (${fn_obtenerMesCalendarioVigente()})</option>`;
    }

    // BUSCA TODOS LOS REGISTROS EN FIREBASE SIN IMPORTAR LA FECHA EXACTA
    if (db) {
      try {
        const snapshot = await db.collection("paritarias").get();

        if (selectHistAct && !snapshot.empty) {
          let docsEncontrados = [];

          // Toma la primera palabra clave para machear (ej: "floricultura", "desmalezado", "papa", "arreo", "lavaderos")
          const palabraClave = act.nombre.toLowerCase().split(" ")[0];

          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.actividad) {
              const actDb = data.actividad.toLowerCase();
              if (
                actDb.includes(palabraClave) ||
                act.nombre.toLowerCase().includes(actDb.split(" ")[0])
              ) {
                docsEncontrados.push({ id: doc.id, ...data });
              }
            }
          });

          // Ordena del más reciente al más antiguo
          docsEncontrados.sort(
            (a, b) =>
              new Date(b.fechaGuardado || b.mesInicio) -
              new Date(a.fechaGuardado || a.mesInicio),
          );

          // Carga cada opción histórica en el segundo desplegable
          docsEncontrados.forEach((data) => {
            const opt = document.createElement("option");
            opt.value = data.id;
            const mesTexto = data.mesInicio ? ` — Mes: ${data.mesInicio}` : "";
            opt.text = `📅 Acuerdo Guardado: ${data.actividad}${mesTexto}`;
            selectHistAct.add(opt);
          });
        }
      } catch (e) {
        console.warn("Error buscando historial en la Nube:", e);
      }
    }
  }
}

async function fn_cargarDocumentoEspecificoHistorial() {
  const docId = document.getElementById("selectHistorialPorActividad").value;
  const containerTram = document.getElementById("tramosContainer");

  if (docId === "vigente") {
    fn_cargarDatosActividadSeleccionada();
    return;
  }

  if (db) {
    try {
      const doc = await db.collection("paritarias").doc(docId).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById("actividadNombre").value = data.actividad || "";
        document.getElementById("mesInicio").value = data.mesInicio || "";

        if (data.categoriasBase) {
          fn_poblarDesplegableCategorias(data.categoriasBase);
        }

        containerTram.innerHTML = "";
        if (data.tramos && data.tramos.length > 0) {
          data.tramos.forEach((t) =>
            fn_agregarFilaTramo(t.porcentaje, t.detalle),
          );
        }

        if (data.grillaCalculada && data.tramos) {
          ultimaGrillaCalculada = data.grillaCalculada;
          ultimosTramos = data.tramos;
          fn_renderTablaGrilla(data.grillaCalculada, data.tramos);
        }
      }
    } catch (e) {
      console.error("Error recuperando acuerdo histórico:", e);
    }
  }
}
// === FIN: SELECTORES Y HISTORIAL POR ACTIVIDAD ===

// ============================================================================
// === 7. FILAS Y ELEMENTOS DEL FORMULARIO ===
// ============================================================================
function fn_agregarFilaCategoria(nombre = "", basico = "", jornal = 0) {
  const container = document.getElementById("categoriasContainer");
  const div = document.createElement("div");
  div.className = "categoria-row";
  div.style.cssText =
    "display:flex; flex-wrap:wrap; gap:10px; margin-bottom:8px; align-items:center;";

  let htmlJornal =
    jornal > 0
      ? `<input type="number" step="0.01" placeholder="Por día ($)" class="cat-jornal" value="${jornal}" style="width:30%">`
      : `<input type="hidden" class="cat-jornal" value="0">`;

  div.innerHTML = `
    <input type="text" placeholder="Categoría / Tarea" class="cat-nombre" value="${nombre}" style="width:50%" required> 
    <input type="number" step="0.01" placeholder="Por mes ($)" class="cat-basico" value="${basico}" style="width:35%" required>
    ${htmlJornal}
    <button type="button" onclick="this.parentElement.remove()" style="width:8%; background:#ef4444; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;">🗑️</button>
  `;
  container.appendChild(div);
}

function fn_agregarFilaTramo(pct = "", det = "") {
  const container = document.getElementById("tramosContainer");
  const div = document.createElement("div");
  div.className = "tramo-row";
  div.style.cssText =
    "display:flex; gap:10px; margin-bottom:8px; align-items:center;";
  div.innerHTML = `
    <input type="number" step="0.1" placeholder="Aumento % (0 = Congelado)" class="tramo-porcentaje" value="${pct !== "" ? pct : ""}" style="width:40%"> 
    <input type="text" placeholder="Mes / Detalle" class="tramo-detalle" value="${det}" style="width:50%">
    <button type="button" onclick="this.parentElement.remove()" style="width:10%; background:#ef4444; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;" title="Eliminar este mes">🗑️</button>
  `;
  container.appendChild(div);
}

async function fn_cargarHistorialNube() {
  fn_poblarSelectorActividades();
}

// ============================================================================
// === 8. CÁLCULO DE PARITARIAS Y RENDER DE TABLA ===
// ============================================================================
async function fn_guardarYCalcularGrilla(e) {
  e.preventDefault();
  const actividadNombre = document.getElementById("actividadNombre").value;
  const mesInicio = document.getElementById("mesInicio").value;

  let categoriasBase =
    categoriasActividadActual.length > 0 ? categoriasActividadActual : [];

  const catNombres = document.querySelectorAll(".cat-nombre");
  const catBasicos = document.querySelectorAll(".cat-basico");
  const catJornal = document.querySelectorAll(".cat-jornal");

  if (catNombres.length > 0) {
    catNombres.forEach((input, i) => {
      if (input.value.trim() !== "") {
        const idxMatch = categoriasBase.findIndex(
          (c) => c.nombre === input.value.trim(),
        );
        const jVal = catJornal[i] ? parseFloat(catJornal[i].value) || 0 : 0;

        if (idxMatch >= 0) {
          categoriasBase[idxMatch].basico =
            parseFloat(catBasicos[i].value) || 0;
          categoriasBase[idxMatch].jornal = jVal;
        } else {
          categoriasBase.push({
            nombre: input.value.trim(),
            basico: parseFloat(catBasicos[i].value) || 0,
            jornal: jVal,
          });
        }
      }
    });
  }

  const tramoPct = document.querySelectorAll(".tramo-porcentaje");
  const tramoDet = document.querySelectorAll(".tramo-detalle");
  let tramos = [];
  tramoPct.forEach((input, i) => {
    let pctVal = input.value === "" ? 0 : parseFloat(input.value);
    tramos.push({
      porcentaje: pctVal,
      detalle: tramoDet[i].value || `Mes ${i + 1}`,
    });
  });

  if (categoriasBase.length === 0) {
    alert("Cargá al menos una categoría profesional.");
    return;
  }

  let grillaCalculada = [];
  categoriasBase.forEach((cat) => {
    let evolucion = [cat.basico];
    let acumulado = cat.basico;
    tramos.forEach((t) => {
      acumulado = acumulado * (1 + t.porcentaje / 100);
      evolucion.push(acumulado);
    });
    grillaCalculada.push({
      categoria: cat.nombre,
      jornal: cat.jornal || 0,
      valores: evolucion,
    });
  });

  ultimaGrillaCalculada = grillaCalculada;
  ultimosTramos = tramos;

  if (db) {
    try {
      await db.collection("paritarias").add({
        actividad: actividadNombre,
        mesInicio: mesInicio,
        categoriasBase: categoriasBase,
        tramos: tramos,
        grillaCalculada: grillaCalculada,
        fechaGuardado: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("No se pudo guardar en la nube:", err);
    }
  }

  fn_registrarUsoCalculadora("Paritaria / Grilla Salarial");
  fn_renderTablaGrilla(grillaCalculada, tramos);
  alert("¡Escala calculada con éxito!");

  fn_generarDocumentoWord();

  setTimeout(() => {
    fn_enviarEmailDirecto();
  }, 1000);
}

function fn_renderTablaGrilla(grilla, tramos) {
  const theadTr = document.getElementById("escalaTableHead");
  const tbody = document.querySelector("#escalaTable tbody");

  let hayJornal = grilla.some((r) => r.jornal > 0);
  let headHtml =
    "<th>Categoría / Tarea Profesional</th><th>Por mes ($ ARS)</th>";
  if (hayJornal) headHtml += "<th>Por día ($)</th>";

  tramos.forEach((t) => {
    headHtml += `<th>${t.detalle} (+${t.porcentaje}%)</th>`;
  });
  theadTr.innerHTML = headHtml;

  let bodyHtml = "";
  grilla.forEach((row) => {
    bodyHtml += `<tr><td><strong>${row.categoria}</strong></td>`;
    bodyHtml += `<td>$${row.valores[0].toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;

    if (hayJornal) {
      let valJornal =
        row.jornal > 0
          ? `$${row.jornal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "-";
      bodyHtml += `<td>${valJornal}</td>`;
    }

    for (let i = 1; i < row.valores.length; i++) {
      bodyHtml += `<td>$${row.valores[i].toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
    }
    bodyHtml += "</tr>";
  });

  tbody.innerHTML = bodyHtml;
  document.getElementById("paritariasResults").classList.remove("hidden");
}

// ============================================================================
// === 9. REPORTE EN WORD Y CORREO ===
// ============================================================================
function fn_enviarEmailDirecto() {
  const actividad =
    document.getElementById("actividadNombre").value || "Actividad Rural";
  const mesInicio = document.getElementById("mesInicio").value || "S/D";

  let cuerpo = `Estimado,\n\nSe adjunta la escala salarial completa en documento Word (.docx) para la actividad: ${actividad}.\nMes de Inicio: ${mesInicio}\n\nSaludos cordiales,`;

  const mailtoUrl = `mailto:${DESTINATARIO_MAIL}?subject=${encodeURIComponent("Escala Salarial: " + actividad)}&body=${encodeURIComponent(cuerpo)}`;
  window.location.href = mailtoUrl;
}

function fn_generarDocumentoWord() {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
  } = docx;
  const actividad =
    document.getElementById("actividadNombre").value || "General";

  let hayJornal = ultimaGrillaCalculada.some((r) => r.jornal > 0);

  let tableHeaderCells = [
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: "Categoría / Tarea Profesional", bold: true }),
          ],
        }),
      ],
    }),
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: "Por mes ($ ARS)", bold: true })],
        }),
      ],
    }),
  ];

  if (hayJornal) {
    tableHeaderCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Por día ($)", bold: true })],
          }),
        ],
      }),
    );
  }

  ultimosTramos.forEach((t) => {
    tableHeaderCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `${t.detalle} (+${t.porcentaje}%)`,
                bold: true,
              }),
            ],
          }),
        ],
      }),
    );
  });

  let tableRows = [new TableRow({ children: tableHeaderCells })];

  ultimaGrillaCalculada.forEach((row) => {
    let rowCells = [
      new TableCell({ children: [new Paragraph(row.categoria)] }),
      new TableCell({
        children: [new Paragraph(`$${row.valores[0].toFixed(2)}`)],
      }),
    ];

    if (hayJornal) {
      rowCells.push(
        new TableCell({
          children: [
            new Paragraph(row.jornal > 0 ? `$${row.jornal.toFixed(2)}` : "-"),
          ],
        }),
      );
    }

    for (let i = 1; i < row.valores.length; i++) {
      rowCells.push(
        new TableCell({
          children: [new Paragraph(`$${row.valores[i].toFixed(2)}`)],
        }),
      );
    }
    tableRows.push(new TableRow({ children: rowCells }));
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "UATRE — DELEGACIÓN REGIONAL",
                bold: true,
                size: 28,
                color: "10B981",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Reporte de Escala Salarial Paritaria: " + actividad,
                bold: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Valores Oficiales Vigentes",
                italic: true,
                size: 18,
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => saveAs(blob, `Escala_${actividad}.docx`));
}

// ============================================================================
// === 10. CALCULADORA DE INDEMNIZACIONES ===
// ============================================================================
function fn_calcularIndemnizacion(e) {
  e.preventDefault();
  const salary = parseFloat(document.getElementById("salary").value) || 0;
  const startDateInput = document.getElementById("startDate").value;
  const endDateInput = document.getElementById("endDate").value;
  const notice = document.getElementById("notice").value;
  const vacation2025 = document.getElementById("vacation2025").value;

  if (!startDateInput || !endDateInput || salary <= 0) {
    alert("Por favor completá el sueldo y las fechas correctamente.");
    return;
  }

  const startDate = new Date(startDateInput + "T00:00:00");
  const endDate = new Date(endDateInput + "T00:00:00");

  let diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  let years = Math.floor(diffDays / 365);
  let remDays = diffDays % 365;

  let seniorityYears = years;
  if (remDays >= 90) seniorityYears += 1;
  if (seniorityYears === 0) seniorityYears = 1;

  const indAntiguedad = salary * seniorityYears;

  let indPreaviso = 0,
    SACPreaviso = 0,
    integracionMes = 0,
    SACIntegracion = 0;
  if (notice === "no") {
    let mesesPreaviso = seniorityYears > 5 ? 2 : 1;
    indPreaviso = salary * mesesPreaviso;
    SACPreaviso = indPreaviso / 12;

    let dayOfEgreso = endDate.getDate();
    if (dayOfEgreso < 30) {
      let diasFaltantes = 30 - dayOfEgreso;
      integracionMes = (salary / 30) * diasFaltantes;
      SACIntegracion = integracionMes / 12;
    }
  }

  let diasTrabajadosMes = endDate.getDate();
  if (diasTrabajadosMes > 30) diasTrabajadosMes = 30;
  const sueldoDobleProporcional = (salary / 30) * diasTrabajadosMes;

  let mesEgreso = endDate.getMonth();
  let inicioSemestre =
    mesEgreso >= 6
      ? new Date(endDate.getFullYear(), 6, 1)
      : new Date(endDate.getFullYear(), 0, 1);
  let diasSemestre =
    Math.floor((endDate - inicioSemestre) / (1000 * 60 * 60 * 24)) + 1;
  const sacProporcional = (salary / 2) * (diasSemestre / 180);

  let diasVacacionesDerecho = 14;
  if (seniorityYears > 20) diasVacacionesDerecho = 35;
  else if (seniorityYears > 10) diasVacacionesDerecho = 28;
  else if (seniorityYears > 5) diasVacacionesDerecho = 21;

  let diasAnoTrabajados =
    Math.floor(
      (endDate - new Date(endDate.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24),
    ) + 1;
  let diasVacacionesProp = (diasAnoTrabajados / 365) * diasVacacionesDerecho;
  const vacProporcionales = (salary / 25) * diasVacacionesProp;
  const sacSobreVacProporcionales = vacProporcionales / 12;

  let vacNoGozadas2025 = 0,
    sacSobreVacNoGozadas = 0;
  if (vacation2025 === "no") {
    vacNoGozadas2025 = (salary / 25) * diasVacacionesDerecho;
    sacSobreVacNoGozadas = vacNoGozadas2025 / 12;
  }

  const total =
    indAntiguedad +
    indPreaviso +
    SACPreaviso +
    integracionMes +
    SACIntegracion +
    sueldoDobleProporcional +
    sacProporcional +
    vacProporcionales +
    sacSobreVacProporcionales +
    vacNoGozadas2025 +
    sacSobreVacNoGozadas;

  fn_registrarUsoCalculadora("Liquidación / Indemnización");

  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = `
    <tr><td>Indemnización por Antigüedad (${seniorityYears} año/s)</td><td>$${indAntiguedad.toFixed(2)}</td></tr>
    ${indPreaviso > 0 ? `<tr><td>Indemnización Sustitutiva de Preaviso</td><td>$${indPreaviso.toFixed(2)}</td></tr>` : ""}
    ${SACPreaviso > 0 ? `<tr><td>SAC s/ Preaviso</td><td>$${SACPreaviso.toFixed(2)}</td></tr>` : ""}
    ${integracionMes > 0 ? `<tr><td>Integración Mes de Despido</td><td>$${integracionMes.toFixed(2)}</td></tr>` : ""}
    ${SACIntegracion > 0 ? `<tr><td>SAC s/ Integración Mes de Despido</td><td>$${SACIntegracion.toFixed(2)}</td></tr>` : ""}
    <tr><td>Días Trabajados Mes de Egreso (${diasTrabajadosMes} días)</td><td>$${sueldoDobleProporcional.toFixed(2)}</td></tr>
    <tr><td>SAC Proporcional</td><td>$${sacProporcional.toFixed(2)}</td></tr>
    <tr><td>Vacaciones Proporcionales</td><td>$${vacProporcionales.toFixed(2)}</td></tr>
    <tr><td>SAC s/ Vacaciones Proporcionales</td><td>$${sacSobreVacProporcionales.toFixed(2)}</td></tr>
    ${vacNoGozadas2025 > 0 ? `<tr><td>Vacaciones No Gozadas Año Anterior</td><td>$${vacNoGozadas2025.toFixed(2)}</td></tr>` : ""}
    ${sacSobreVacNoGozadas > 0 ? `<tr><td>SAC s/ Vacaciones No Gozadas</td><td>$${sacSobreVacNoGozadas.toFixed(2)}</td></tr>` : ""}
  `;

  document.getElementById("totalAmount").textContent = total.toLocaleString(
    "es-AR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  );
  document.getElementById("results").classList.remove("hidden");
}

// REGISTRO DEL SERVICE WORKER PARA PWA / APK
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .catch((err) => console.warn("SW error:", err));
}
