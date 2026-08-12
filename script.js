/**
 * Calculadora Rural & Gestión Paritaria Multi-Categoría
 * Delegación Córdoba Capital — CAR 5
 */

// --- CONFIGURACIÓN DE ACCESO Y MAIL ---
const USER_PIN = "delegacioncordoba";
const ADMIN_PIN = "admincordoba";
const DESTINATARIO_MAIL = "lucasrozembaum@gmail.com";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAYmr5gh35AP2aBAmG7nUG19Sv4p34Zlzk",
  authDomain: "firestore-database-5f05d.firebaseapp.com",
  projectId: "firestore-database-5f05d",
  storageBucket: "firestore-database-5f05d.firebasestorage.app",
  messagingSenderId: "367295191590",
  appId: "1:367295191590:web:1e0eb7e3b827e85c13b3ec",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUserRole = null;
let logoClicks = 0;
let logoClickTimer = null;
let ultimaGrillaCalculada = [];
let ultimosTramos = [];

// ACTIVIDADES CON NOMBRES LIMPIOS
const ACTIVIDADES_PRECARGADAS = [
  {
    nombre: "Desmalezado Manual (Desyuyada)",
    categorias: [{ nombre: "Jornal Mínimo Garantizado", basico: 98116.62 }],
  },
  {
    nombre: "Floricultura y Viveros",
    categorias: [
      { nombre: "Trabajador no calificado", basico: 1056230.17 },
      { nombre: "Trabajador semi calificado", basico: 1082587.9 },
      { nombre: "Trabajador calificado", basico: 1122247.43 },
      { nombre: "Conductor tractorista", basico: 1161765.44 },
      { nombre: "Chofer", basico: 1174989.42 },
      { nombre: "Mecánico", basico: 1214647.19 },
      { nombre: "Puestero o sereno", basico: 1164597.76 },
      { nombre: "Capataz", basico: 1284621.91 },
      { nombre: "Encargado", basico: 1355114.98 },
    ],
  },
  {
    nombre: "Manipulación y Almacenamiento de Granos",
    categorias: [
      { nombre: "Jornal Mínimo Garantizado", basico: 44545.38 },
      {
        nombre: "Descargar a granel / gravitación (por quintal)",
        basico: 29.54,
      },
      { nombre: "Descargar a granel paleando (por quintal)", basico: 182.81 },
      { nombre: "Palear en silos / celdas (por quintal)", basico: 587.14 },
      { nombre: "Derecho carga/descarga c/cinta (por bolsa)", basico: 296.36 },
      { nombre: "Derecho carga/descarga s/cinta (por bolsa)", basico: 369.55 },
      { nombre: "Lauchero (por día)", basico: 73992.03 },
    ],
  },
  {
    nombre: "Cosecha de Papa",
    categorias: [
      { nombre: "Sueldo Mensual Garantizado", basico: 884881.21 },
      { nombre: "Jornal del Personal de Cosecha", basico: 38932.89 },
      { nombre: "Abridor de surco (por día)", basico: 43431.55 },
      { nombre: "Juntando en bolsa (por bolsa)", basico: 467.03 },
      { nombre: "Juntando en maleta-bolsa", basico: 954.26 },
      { nombre: "Carga en chacra s/cinta (por bolsa)", basico: 302.94 },
    ],
  },
  {
    nombre: "Cultivo de Hongos Comestibles",
    categorias: [
      { nombre: "Trabajador no calificado", basico: 853153.46 },
      { nombre: "Trabajador semi calificado", basico: 890122.69 },
      { nombre: "Trabajador calificado", basico: 954755.48 },
      { nombre: "Especializado", basico: 1014723.81 },
      { nombre: "Capataz", basico: 1039006.3 },
      { nombre: "Encargado", basico: 1050855.46 },
      { nombre: "Supervisor", basico: 1033977.76 },
    ],
  },
  {
    nombre: "Lavaderos de Verduras",
    categorias: [
      { nombre: "Peón general", basico: 1071383.93 },
      { nombre: "Jornal diario", basico: 48692.87 },
      { nombre: "Conductor tractorista / motoelevador", basico: 1121599.35 },
      { nombre: "Encargado", basico: 1323702.06 },
    ],
  },
  {
    nombre: "Arreos y Remates en Ferias",
    categorias: [
      { nombre: "Peón general mensualizado", basico: 848043.94 },
      { nombre: "Capataz con caballo (por día)", basico: 101075.56 },
      { nombre: "Peón con caballo (por día)", basico: 79418.22 },
    ],
  },
];

document.addEventListener("DOMContentLoaded", () => {
  checkActivation();
  initListeners();
  setupLogoSecret();
  pobladorSelectorActividades();
});

function initListeners() {
  document.getElementById("activateBtn").addEventListener("click", validarPin);
  document
    .getElementById("calcForm")
    .addEventListener("submit", calcularIndemnizacion);
  document
    .getElementById("addCategoriaBtn")
    .addEventListener("click", () => agregarFilaCategoria());
  document
    .getElementById("addTramoBtn")
    .addEventListener("click", () => agregarFilaTramo());
  document
    .getElementById("paritariasForm")
    .addEventListener("submit", guardarYCalcularGrilla);
  document
    .getElementById("downloadDocxBtn")
    .addEventListener("click", generarDocumentoWord);
  document
    .getElementById("sendEmailBtn")
    .addEventListener("click", enviarEmailDirecto);
  document
    .getElementById("selectHistorial")
    .addEventListener("change", cargarDatosActividadSeleccionada);

  const navCalc = document.getElementById("navCalcBtn");
  const navPari = document.getElementById("navParitariasBtn");
  if (navCalc)
    navCalc.addEventListener("click", () => switchView("calcView", navCalc));
  if (navPari)
    navPari.addEventListener("click", () =>
      switchView("paritariasView", navPari),
    );
}

// --- TRUCO TRIPLE CLIC EN LOGO UATRE ---
function setupLogoSecret() {
  const logo = document.querySelector(".delegacion-logo");
  if (!logo) return;

  logo.addEventListener("click", () => {
    logoClicks++;
    if (logoClicks === 3) {
      clearTimeout(logoClickTimer);
      logoClicks = 0;
      let pass = prompt("Acceso Administrador (Delegación Córdoba):");
      if (pass && pass.trim().toLowerCase() === ADMIN_PIN) {
        currentUserRole = "admin";
        localStorage.setItem("user_role", "admin");
        unlockApp();
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
}

function validarPin() {
  const pin = document.getElementById("accessPin").value.trim().toLowerCase();
  if (pin === ADMIN_PIN) {
    currentUserRole = "admin";
    localStorage.setItem("user_role", "admin");
    unlockApp();
  } else if (pin === USER_PIN) {
    currentUserRole = "user";
    localStorage.setItem("user_role", "user");
    unlockApp();
  } else {
    document.getElementById("activationError").classList.remove("hidden");
  }
}

function unlockApp() {
  document.getElementById("activationScreen").classList.add("hidden");
  if (currentUserRole === "admin") {
    const adminNav = document.getElementById("adminNav");
    if (adminNav) adminNav.classList.remove("hidden");
    cargarHistorialNube();
  }
}

function checkActivation() {
  const role = localStorage.getItem("user_role");
  if (role) {
    currentUserRole = role;
    unlockApp();
  }
}

function switchView(viewId, btnActive) {
  document
    .querySelectorAll(".app-view")
    .forEach((v) => v.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btnActive) btnActive.classList.add("active");
}

// --- POBLAR SELECTOR DINETE Y LIMPIO ---
function pobladorSelectorActividades() {
  const select = document.getElementById("selectHistorial");
  select.innerHTML = '<option value="nueva">Crear Nueva Actividad...</option>';

  ACTIVIDADES_PRECARGADAS.forEach((act, idx) => {
    const opt = document.createElement("option");
    opt.value = `pre_${idx}`;
    opt.text = act.nombre;
    select.add(opt);
  });
}

function cargarDatosActividadSeleccionada() {
  const val = document.getElementById("selectHistorial").value;
  const containerCat = document.getElementById("categoriasContainer");
  const containerTram = document.getElementById("tramosContainer");
  containerCat.innerHTML = "";
  containerTram.innerHTML = "";

  if (val.startsWith("pre_")) {
    const idx = parseInt(val.replace("pre_", ""));
    const act = ACTIVIDADES_PRECARGADAS[idx];
    document.getElementById("actividadNombre").value = act.nombre;

    act.categorias.forEach((cat) => {
      agregarFilaCategoria(cat.nombre, cat.basico);
    });
    agregarFilaTramo();
  } else if (val === "nueva") {
    document.getElementById("actividadNombre").value = "";
    agregarFilaCategoria();
    agregarFilaTramo();
  }
}

function agregarFilaCategoria(nombre = "", basico = "") {
  const container = document.getElementById("categoriasContainer");
  const div = document.createElement("div");
  div.className = "categoria-row";
  div.style.cssText =
    "display:flex; gap:10px; margin-bottom:8px; align-items:center;";
  div.innerHTML = `
    <input type="text" placeholder="Categoría" class="cat-nombre" value="${nombre}" style="width:55%" required> 
    <input type="number" step="0.01" placeholder="Básico ($)" class="cat-basico" value="${basico}" style="width:35%" required>
    <button type="button" onclick="this.parentElement.remove()" style="width:10%; background:#ef4444; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;">🗑️</button>
  `;
  container.appendChild(div);
}

function agregarFilaTramo(pct = "", det = "") {
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

// --- HISTORIAL DESDE LA NUBE (FILTRADO AUTOMÁTICO DE NOMBRES LARGOS) ---
async function cargarHistorialNube() {
  try {
    const select = document.getElementById("selectHistorial");
    const snapshot = await db
      .collection("paritarias")
      .orderBy("fechaGuardado", "desc")
      .get();

    const nombresExistentes = new Set();
    Array.from(select.options).forEach((opt) =>
      nombresExistentes.add(opt.text.trim().toLowerCase()),
    );

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.actividad) return;

      // FILTRO: Limpia [Nube], resoluciones, fechas y agregados molestos
      let nombreLimpio = data.actividad
        .replace(/\[Nube\]/gi, "")
        .replace(/\(Res\..*?\)/gi, "")
        .replace(/\(\d{4}-.*?\)/gi, "")
        .replace(/- Desyuyada/gi, "")
        .trim();

      if (nombreLimpio.endsWith("-"))
        nombreLimpio = nombreLimpio.slice(0, -1).trim();

      if (!nombresExistentes.has(nombreLimpio.toLowerCase())) {
        nombresExistentes.add(nombreLimpio.toLowerCase());

        const option = document.createElement("option");
        option.value = doc.id;
        option.text = nombreLimpio; // Muestra solo el nombre 100% limpio
        select.add(option);
      }
    });
  } catch (e) {
    console.error("Error al obtener historial de la nube: ", e);
  }
}

// --- CÁLCULO, FIREBASE Y MAIL ---
async function guardarYCalcularGrilla(e) {
  e.preventDefault();
  const actividadNombre = document.getElementById("actividadNombre").value;
  const mesInicio = document.getElementById("mesInicio").value;

  const catNombres = document.querySelectorAll(".cat-nombre");
  const catBasicos = document.querySelectorAll(".cat-basico");
  let categoriasBase = [];
  catNombres.forEach((input, i) => {
    if (input.value.trim() !== "") {
      categoriasBase.push({
        nombre: input.value.trim(),
        basico: parseFloat(catBasicos[i].value) || 0,
      });
    }
  });

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
      valores: evolucion,
    });
  });

  ultimaGrillaCalculada = grillaCalculada;
  ultimosTramos = tramos;

  try {
    await db.collection("paritarias").add({
      actividad: actividadNombre,
      mesInicio: mesInicio,
      categoriasBase: categoriasBase,
      tramos: tramos,
      grillaCalculada: grillaCalculada,
      fechaGuardado: new Date().toISOString(),
    });

    renderTablaGrilla(grillaCalculada, tramos);
    alert("¡Escala guardada en la Nube con éxito!");

    enviarEmailDirecto();
  } catch (err) {
    alert("Error al guardar en la nube: " + err.message);
  }
}

function renderTablaGrilla(grilla, tramos) {
  const theadTr = document.getElementById("escalaTableHead");
  const tbody = document.querySelector("#escalaTable tbody");

  let headHtml = "<th>Categoría Profesional</th><th>Base Inicial ($)</th>";
  tramos.forEach((t) => {
    headHtml += `<th>${t.detalle} (+${t.porcentaje}%)</th>`;
  });
  theadTr.innerHTML = headHtml;

  let bodyHtml = "";
  grilla.forEach((row) => {
    bodyHtml += `<tr><td><strong>${row.categoria}</strong></td>`;
    row.valores.forEach((val) => {
      bodyHtml += `<td>$${val.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
    });
    bodyHtml += "</tr>";
  });

  tbody.innerHTML = bodyHtml;
  document.getElementById("paritariasResults").classList.remove("hidden");
}

function enviarEmailDirecto() {
  const actividad =
    document.getElementById("actividadNombre").value || "Actividad Rural";
  const mesInicio = document.getElementById("mesInicio").value || "S/D";

  let cuerpo = `DELEGACIÓN CÓRDOBA CAPITAL - UATRE\n`;
  cuerpo += `REPORTE DE ESCALA SALARIAL: ${actividad}\n`;
  cuerpo += `Mes de Inicio: ${mesInicio}\n\n`;
  cuerpo += `GRILLA SALARIAL CALCULADA:\n`;
  cuerpo += `--------------------------------------------------\n`;

  ultimaGrillaCalculada.forEach((row) => {
    cuerpo += `• ${row.categoria}:\n`;
    cuerpo += `  - Base inicial: $${row.valores[0].toFixed(2)}\n`;
    ultimosTramos.forEach((t, idx) => {
      cuerpo += `  - ${t.detalle} (+${t.porcentaje}%): $${row.valores[idx + 1].toFixed(2)}\n`;
    });
    cuerpo += `--------------------------------------------------\n`;
  });

  const mailtoUrl = `mailto:${DESTINATARIO_MAIL}?subject=${encodeURIComponent("Escala Salarial: " + actividad)}&body=${encodeURIComponent(cuerpo)}`;
  window.location.href = mailtoUrl;
}

function generarDocumentoWord() {
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

  let tableHeaderCells = [
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: "Categoría Profesional", bold: true }),
          ],
        }),
      ],
    }),
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: "Base Inicial ($)", bold: true })],
        }),
      ],
    }),
  ];

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
    ];
    row.valores.forEach((val) => {
      rowCells.push(
        new TableCell({ children: [new Paragraph(`$${val.toFixed(2)}`)] }),
      );
    });
    tableRows.push(new TableRow({ children: rowCells }));
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "DELEGACIÓN CÓRDOBA CAPITAL - UATRE",
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

function calcularIndemnizacion(e) {
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
