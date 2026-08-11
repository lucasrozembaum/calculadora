/**
 * Calculadora de Indemnizaciones Rurales - Ley 26.727 & LCT
 * Delegación Regional UATRE
 */

// 🔑 CLAVE DE ACTIVACIÓN DE LA APP
const ACTIVATION_PIN = "delegacioncordoba";

document.addEventListener("DOMContentLoaded", () => {
  checkActivation();

  const activateBtn = document.getElementById("activateBtn");
  if (activateBtn) {
    activateBtn.addEventListener("click", validarPin);
  }

  const accessPinInput = document.getElementById("accessPin");
  if (accessPinInput) {
    accessPinInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") validarPin();
    });
  }

  const form = document.getElementById("calcForm");
  if (form) {
    form.addEventListener("submit", calcularIndemnizacion);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        reg.update();
      })
      .catch((err) => console.log("SW error:", err));
  }
});

function checkActivation() {
  const isActivated = localStorage.getItem("app_activated_v2");
  const lockOverlay = document.getElementById("activationScreen");

  if (isActivated === "true" && lockOverlay) {
    lockOverlay.classList.add("hidden");
  } else if (lockOverlay) {
    lockOverlay.classList.remove("hidden");
  }
}

function validarPin() {
  const inputPin = document
    .getElementById("accessPin")
    .value.trim()
    .toLowerCase();
  const lockOverlay = document.getElementById("activationScreen");
  const errorMsg = document.getElementById("activationError");

  if (inputPin === ACTIVATION_PIN) {
    localStorage.setItem("app_activated_v2", "true");
    if (errorMsg) errorMsg.classList.add("hidden");
    if (lockOverlay) lockOverlay.classList.add("hidden");
  } else {
    if (errorMsg) {
      errorMsg.classList.remove("hidden");
      errorMsg.textContent = "Contraseña incorrecta. Intente nuevamente.";
    }
  }
}

function calcularIndemnizacion(e) {
  e.preventDefault();

  const sueldoBase = parseFloat(document.getElementById("salary").value) || 0;
  const fechaIngresoStr = document.getElementById("startDate").value;
  const fechaEgresoStr = document.getElementById("endDate").value;
  const recibioPreaviso = document.getElementById("notice").value === "si";
  const vacationSelect = document.getElementById("vacation2025");
  const gozoVacacionesAnioAnterior = vacationSelect
    ? vacationSelect.value === "si"
    : true;

  if (!fechaIngresoStr || !fechaEgresoStr || sueldoBase <= 0) {
    alert("Por favor, ingrese fechas válidas y un sueldo base mayor a cero.");
    return;
  }

  const [fIAnio, fIMes, fIDia] = fechaIngresoStr.split("-").map(Number);
  const [fEAnio, fEMes, fEDia] = fechaEgresoStr.split("-").map(Number);

  const fechaIngreso = new Date(fIAnio, fIMes - 1, fIDia);
  const fechaEgreso = new Date(fEAnio, fEMes - 1, fEDia);

  if (fechaEgreso <= fechaIngreso) {
    alert("La fecha de egreso debe ser posterior a la fecha de ingreso.");
    return;
  }

  const ultimoDiaMesCalendario = new Date(fEAnio, fEMes, 0).getDate();
  const esUltimoDiaDelMes = fEDia === ultimoDiaMesCalendario;
  const diasTrabajadosMes = esUltimoDiaDelMes ? 30 : Math.min(fEDia, 30);

  const tiempoTrabajado = calcularAntiguedad(fechaIngreso, fechaEgreso);
  const periodos245 = calcularPeriodos245(fechaIngreso, fechaEgreso);

  // 1. Indemnización por Antigüedad
  const montoAntiguedad = sueldoBase * periodos245;

  // 2. Preaviso
  let diasPreaviso = 0;
  if (!recibioPreaviso) {
    diasPreaviso = tiempoTrabajado.anios < 5 ? 30 : 60;
  }
  const montoPreaviso = (sueldoBase / 30) * diasPreaviso;
  const sacSobrePreaviso = montoPreaviso / 12;

  // 3. Integración Mes de Despido
  let montoIntegracion = 0;
  let sacSobreIntegracion = 0;
  let diasIntegracion = 0;

  if (!recibioPreaviso && !esUltimoDiaDelMes) {
    diasIntegracion = 30 - diasTrabajadosMes;
    if (diasIntegracion > 0) {
      montoIntegracion = (sueldoBase / 30) * diasIntegracion;
      sacSobreIntegracion = montoIntegracion / 12;
    }
  }

  // 4. Días trabajados del mes
  const montoDiasMes = (sueldoBase / 30) * diasTrabajadosMes;

  // 5. SAC Proporcional
  const sacProporcional = calcularSACProporcional(fechaEgreso, sueldoBase);

  // 6. Vacaciones No Gozadas Año En Curso (Proporcional)
  const vacacionesEnCurso = calcularVacacionesNoGozadas(
    fechaIngreso,
    fechaEgreso,
    sueldoBase,
  );

  // 7. Vacaciones No Gozadas Año Anterior (Completo)
  const vacacionesAnioAnterior = calcularVacacionesAnioAnterior(
    fechaIngreso,
    fechaEgreso,
    sueldoBase,
    gozoVacacionesAnioAnterior,
  );

  // Total Liquidación
  const totalLiquidacion =
    montoAntiguedad +
    montoPreaviso +
    sacSobrePreaviso +
    montoIntegracion +
    sacSobreIntegracion +
    montoDiasMes +
    sacProporcional +
    vacacionesEnCurso.totalVacacionesYSac +
    vacacionesAnioAnterior.totalVacacionesYSac;

  renderizarResultados({
    diasTrabajadosMes,
    montoAntiguedad,
    montoPreaviso,
    sacSobrePreaviso,
    montoIntegracion,
    sacSobreIntegracion,
    diasIntegracion,
    montoDiasMes,
    sacProporcional,
    vacacionesEnCurso,
    vacacionesAnioAnterior,
    totalLiquidacion,
  });
}

function calcularAntiguedad(fInicio, fFin) {
  let anios = fFin.getFullYear() - fInicio.getFullYear();
  let meses = fFin.getMonth() - fInicio.getMonth();
  let dias = fFin.getDate() - fInicio.getDate();

  if (dias < 0) {
    meses--;
    const ultimoDiaMesAnterior = new Date(
      fFin.getFullYear(),
      fFin.getMonth(),
      0,
    ).getDate();
    dias += ultimoDiaMesAnterior;
  }
  if (meses < 0) {
    anios--;
    meses += 12;
  }
  return { anios, meses, dias };
}

function calcularPeriodos245(fInicio, fFin) {
  const anti = calcularAntiguedad(fInicio, fFin);
  let periodos = anti.anios;
  if (anti.meses > 3 || (anti.meses === 3 && anti.dias > 0)) {
    periodos += 1;
  }
  return Math.max(periodos, 1);
}

function calcularSACProporcional(fEgreso, sueldoBase) {
  const anio = fEgreso.getFullYear();
  const mes = fEgreso.getMonth();

  const inicioSemestre = mes < 6 ? new Date(anio, 0, 1) : new Date(anio, 6, 1);

  const diffTiempo = fEgreso.getTime() - inicioSemestre.getTime();
  const diasSemestre = Math.floor(diffTiempo / (1000 * 60 * 60 * 24)) + 1;

  return ((sueldoBase / 2) * diasSemestre) / 182.5;
}

function calcularVacacionesNoGozadas(fIngreso, fEgreso, sueldoBase) {
  const anti = calcularAntiguedad(fIngreso, fEgreso);
  let diasVacacionesAnuales = 14;

  if (anti.anios >= 20) diasVacacionesAnuales = 35;
  else if (anti.anios >= 10) diasVacacionesAnuales = 28;
  else if (anti.anios >= 5) diasVacacionesAnuales = 21;

  const inicioAnio = new Date(fEgreso.getFullYear(), 0, 1);
  const diffTiempo = fEgreso.getTime() - inicioAnio.getTime();
  const diasTrabajadosEnAnio =
    Math.floor(diffTiempo / (1000 * 60 * 60 * 24)) + 1;

  const diasProporcionales =
    (diasVacacionesAnuales * diasTrabajadosEnAnio) / 365;
  const valorDiaVacaciones = sueldoBase / 25;
  const montoVacaciones = valorDiaVacaciones * diasProporcionales;
  const sacSobreVacaciones = montoVacaciones / 12;

  return {
    diasProporcionales: diasProporcionales.toFixed(2),
    montoVacaciones,
    sacSobreVacaciones,
    totalVacacionesYSac: montoVacaciones + sacSobreVacaciones,
  };
}

function calcularVacacionesAnioAnterior(
  fIngreso,
  fEgreso,
  sueldoBase,
  gozoVacacionesAnioAnterior,
) {
  if (gozoVacacionesAnioAnterior) {
    return {
      dias: 0,
      montoVacaciones: 0,
      sacSobreVacaciones: 0,
      totalVacacionesYSac: 0,
    };
  }

  const anioAnterior = fEgreso.getFullYear() - 1;
  const finAnioAnterior = new Date(anioAnterior, 11, 31);

  if (fIngreso > finAnioAnterior) {
    return {
      dias: 0,
      montoVacaciones: 0,
      sacSobreVacaciones: 0,
      totalVacacionesYSac: 0,
    };
  }

  const antiAnioAnterior = calcularAntiguedad(fIngreso, finAnioAnterior);
  let diasVacacionesAnuales = 14;

  if (antiAnioAnterior.anios >= 20) diasVacacionesAnuales = 35;
  else if (antiAnioAnterior.anios >= 10) diasVacacionesAnuales = 28;
  else if (antiAnioAnterior.anios >= 5) diasVacacionesAnuales = 21;

  const valorDiaVacaciones = sueldoBase / 25;
  const montoVacaciones = valorDiaVacaciones * diasVacacionesAnuales;
  const sacSobreVacaciones = montoVacaciones / 12;

  return {
    dias: diasVacacionesAnuales,
    montoVacaciones,
    sacSobreVacaciones,
    totalVacacionesYSac: montoVacaciones + sacSobreVacaciones,
  };
}

function formatMoneda(monto) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(monto);
}

function renderizarResultados(datos) {
  const resultsCard = document.getElementById("results");
  const tbody = document.querySelector("#resultsTable tbody");
  const totalSpan = document.getElementById("totalAmount");

  if (!tbody || !resultsCard || !totalSpan) return;

  const filas = [
    {
      concepto: "Indemnización por Antigüedad (Art. 245)",
      monto: datos.montoAntiguedad,
    },
    {
      concepto: "Indemnización Sustitutiva de Preaviso",
      monto: datos.montoPreaviso,
    },
    { concepto: "SAC sobre Preaviso", monto: datos.sacSobrePreaviso },
    {
      concepto: `Integración Mes de Despido (${datos.diasIntegracion} días)`,
      monto: datos.montoIntegracion,
    },
    { concepto: "SAC sobre Integración", monto: datos.sacSobreIntegracion },
    {
      concepto: `Días Trabajados del Mes (${datos.diasTrabajadosMes} días)`,
      monto: datos.montoDiasMes,
    },
    { concepto: "SAC Proporcional", monto: datos.sacProporcional },
    {
      concepto: `Vacaciones No Gozadas Año en Curso (${datos.vacacionesEnCurso.diasProporcionales} días)`,
      monto: datos.vacacionesEnCurso.montoVacaciones,
    },
    {
      concepto: "SAC sobre Vacaciones Año en Curso",
      monto: datos.vacacionesEnCurso.sacSobreVacaciones,
    },
    {
      concepto: `Vacaciones No Gozadas Año Anterior Adeudadas (${datos.vacacionesAnioAnterior.dias} días)`,
      monto: datos.vacacionesAnioAnterior.montoVacaciones,
    },
    {
      concepto: "SAC sobre Vacaciones Año Anterior Adeudadas",
      monto: datos.vacacionesAnioAnterior.sacSobreVacaciones,
    },
  ];

  tbody.innerHTML = "";
  filas.forEach((f) => {
    if (f.monto > 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${f.concepto}</td><td>${formatMoneda(f.monto)}</td>`;
      tbody.appendChild(tr);
    }
  });

  totalSpan.textContent = formatMoneda(datos.totalLiquidacion)
    .replace("$", "")
    .trim();
  resultsCard.classList.remove("hidden");
  resultsCard.scrollIntoView({ behavior: "smooth" });
}
