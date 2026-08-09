// ==========================================
// 1. CONFIGURACIÓN DE FIREBASE (NUBE)
// ==========================================
// Nota: Cuando tengas las claves reales de Firebase, ponelas acá.
// Mientras tanto, la app funcionará 100% de manera local sin trabarse.
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

let db = null;
// Solo inicializa Firebase si no tiene los datos por defecto
if (typeof firebase !== "undefined" && firebaseConfig.apiKey !== "TU_API_KEY") {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
  } catch (e) {
    console.warn(
      "Firebase no está configurado aún. La app funcionará en modo local.",
    );
  }
}

// Identificador único de este celular
let deviceId = localStorage.getItem("app_device_id");
if (!deviceId) {
  deviceId = "CEL-" + Math.floor(1000 + Math.random() * 9000);
  localStorage.setItem("app_device_id", deviceId);
}

// ==========================================
// 2. CONTROL DE ACTIVACIÓN INICIAL (PIN)
// ==========================================
const PIN_ACTIVACION = "1234"; // PIN de activación inicial

window.addEventListener("DOMContentLoaded", () => {
  const isActivated = localStorage.getItem("app_is_activated");
  if (isActivated === "true") {
    const activationScreen = document.getElementById("activationScreen");
    if (activationScreen) activationScreen.classList.add("hidden");
  }
});

document.getElementById("activateBtn")?.addEventListener("click", function () {
  const pinInput = document.getElementById("accessPin").value;
  const errorMsg = document.getElementById("activationError");

  if (pinInput === PIN_ACTIVACION) {
    localStorage.setItem("app_is_activated", "true");
    document.getElementById("activationScreen").classList.add("hidden");

    // Guardar en la nube solo si está disponible
    if (db && navigator.onLine) {
      db.collection("dispositivos_activados")
        .doc(deviceId)
        .set({
          fechaActivacion: new Date(),
          modeloDispositivo: navigator.userAgent,
        })
        .catch((err) => console.error("Error Firebase:", err));
    }
  } else {
    if (errorMsg) errorMsg.classList.remove("hidden");
  }
});

// ==========================================
// 3. REGISTRO Y REPORTE DE USO MENSUAL
// ==========================================
function registrarUso(montoTotal) {
  const hoy = new Date();
  const mesClave = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const registro = {
    dispositivo: deviceId,
    fecha: hoy.toISOString(),
    mesAnio: mesClave,
    montoTotalCalculado: montoTotal,
  };

  // 1. Guardar siempre en la memoria del celular
  let historial = JSON.parse(localStorage.getItem("calc_usage_history")) || {};
  historial[mesClave] = (historial[mesClave] || 0) + 1;
  localStorage.setItem("calc_usage_history", JSON.stringify(historial));

  // 2. Intentar guardar en la Nube solo si está lista
  if (db && navigator.onLine) {
    db.collection("usos_calculadora")
      .add(registro)
      .then(() => console.log("Sincronizado con la nube"))
      .catch((err) => console.error("Error al sincronizar:", err));
  }
}

// Ver informe de uso mensual
document.getElementById("reportBtn")?.addEventListener("click", function () {
  const historial =
    JSON.parse(localStorage.getItem("calc_usage_history")) || {};
  const usageList = document.getElementById("usageList");
  if (!usageList) return;

  usageList.innerHTML = "";
  const meses = Object.keys(historial).sort().reverse();

  if (meses.length === 0) {
    usageList.innerHTML = "<li>No hay registros de uso en este celular.</li>";
  } else {
    meses.forEach((mes) => {
      const [anio, m] = mes.split("-");
      const fechaTexto = new Date(anio, m - 1).toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      });
      const li = document.createElement("li");
      li.innerHTML = `<span>${fechaTexto.toUpperCase()}:</span> <strong>${historial[mes]} cálculo(s)</strong>`;
      usageList.appendChild(li);
    });
  }

  document.getElementById("reportModal").classList.remove("hidden");
});

document
  .getElementById("closeReportBtn")
  ?.addEventListener("click", function () {
    document.getElementById("reportModal").classList.add("hidden");
  });

// ==========================================
// 4. LÓGICA DE CÁLCULO DE INDEMNIZACIÓN
// ==========================================
document.getElementById("calcForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const salary = parseFloat(document.getElementById("salary").value);
  const startDate = new Date(document.getElementById("startDate").value);
  const endDate = new Date(document.getElementById("endDate").value);
  const hasNotice = document.getElementById("notice").value === "si";

  if (endDate <= startDate) {
    alert("La fecha de egreso debe ser posterior a la de ingreso.");
    return;
  }

  // Antigüedad (Ley 26.727 / LCT)
  const diffTime = Math.abs(endDate - startDate);
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const fullYears = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const remainingMonths = Math.floor(remainingDays / 30);

  let yearsForIndemnity = fullYears;
  if (
    remainingMonths > 3 ||
    (remainingMonths === 3 && remainingDays % 30 > 0)
  ) {
    yearsForIndemnity += 1;
  }
  if (yearsForIndemnity === 0) yearsForIndemnity = 1;

  const art245 = salary * yearsForIndemnity;

  // Preaviso
  let preaviso = 0;
  if (!hasNotice) {
    const preavisoMonths = fullYears >= 5 ? 2 : 1;
    preaviso = salary * preavisoMonths;
  }

  // Integración Mes de Despido
  const lastDayOfMonth = new Date(
    endDate.getFullYear(),
    endDate.getMonth() + 1,
    0,
  ).getDate();
  const dayOfExit = endDate.getDate();
  let integracion = 0;
  if (dayOfExit !== lastDayOfMonth && !hasNotice) {
    const remainingDaysInMonth = lastDayOfMonth - dayOfExit;
    integracion = (salary / 30) * remainingDaysInMonth;
  }

  // SAC Proporcional
  const currentMonth = endDate.getMonth();
  const semesterStartMonth = currentMonth < 6 ? 0 : 6;
  const semesterStartDate = new Date(
    endDate.getFullYear(),
    semesterStartMonth,
    1,
  );
  const daysInSemester =
    Math.ceil((endDate - semesterStartDate) / (1000 * 60 * 60 * 24)) + 1;
  const sacProporcional = (salary / 2) * (daysInSemester / 182.5);

  // Vacaciones No Gozadas + SAC s/Vac
  let vacationDaysBase = 14;
  if (fullYears >= 5 && fullYears < 10) vacationDaysBase = 21;
  else if (fullYears >= 10 && fullYears < 20) vacationDaysBase = 28;
  else if (fullYears >= 20) vacationDaysBase = 35;

  const startOfYear = new Date(endDate.getFullYear(), 0, 1);
  const daysInYear =
    Math.ceil((endDate - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
  const propVacationDays = (vacationDaysBase / 365) * daysInYear;

  const vacNoGozadas = propVacationDays * (salary / 25);
  const sacSobreVacaciones = vacNoGozadas / 12;

  // Carga de la tabla de resultados
  const items = [
    {
      text: `Antigüedad Art. 245 (${yearsForIndemnity} período/s)`,
      amount: art245,
    },
    { text: "Indemnización Sustitutiva de Preaviso", amount: preaviso },
    { text: "Integración Mes de Despido", amount: integracion },
    { text: "SAC Proporcional", amount: sacProporcional },
    {
      text: "Vacaciones No Gozadas + SAC s/Vac",
      amount: vacNoGozadas + sacSobreVacaciones,
    },
  ];

  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = "";
  let totalSum = 0;

  items.forEach((item) => {
    totalSum += item.amount;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.text}</td>
      <td>$ ${item.amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("totalAmount").innerText = totalSum.toLocaleString(
    "es-AR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );

  document.getElementById("results").classList.remove("hidden");

  // Guardar contador de uso
  registrarUso(totalSum);
});
