// ==========================================================================
// MÓDULO: TABLAS SALARIALES UATRE — GESTIÓN POR FRAGMENTOS (SIN CORS)
// ==========================================================================

function mostrarVistaTablas() {
  document.getElementById("calcView")?.classList.add("hidden");
  document.getElementById("paritariasView")?.classList.add("hidden");
  document.getElementById("tablasView")?.classList.remove("hidden");

  const navAdmin = document.getElementById("adminNav");
  const panelAdmin = document.getElementById("panelAdminSubida");

  if (panelAdmin) {
    if (navAdmin && !navAdmin.classList.contains("hidden")) {
      panelAdmin.classList.remove("hidden");
    } else {
      panelAdmin.classList.add("hidden");
    }
  }
}

function mostrarVistaCalculadora() {
  document.getElementById("tablasView")?.classList.add("hidden");
  document.getElementById("paritariasView")?.classList.add("hidden");
  document.getElementById("calcView")?.classList.remove("hidden");
}

// SUBIDA POR FRAGMENTOS (CHUNKS) A FIRESTORE
async function subirTablaPdf() {
  const select = document.getElementById("selectActividadSubir");
  const inputFile = document.getElementById("inputPdfTabla");
  const msg = document.getElementById("msgSubida");
  const btn = document.getElementById("btnSubirPdf");

  if (!select || !inputFile || !msg || !btn) return;

  const actividadId = select.value;
  const archivo = inputFile.files[0];

  if (!archivo) {
    alert("Por favor seleccioná un archivo PDF primero.");
    return;
  }

  if (archivo.type !== "application/pdf") {
    alert("El archivo debe ser exclusivamente en formato PDF.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Procesando archivo...";
  msg.style.display = "block";
  msg.style.color = "#0284c7";
  msg.innerText = "Leyendo archivo PDF...";

  const reader = new FileReader();
  reader.readAsDataURL(archivo);

  reader.onload = async function () {
    try {
      const base64Data = reader.result;
      const CHUNK_SIZE = 700000; // ~700 KB por fragmento (dentro del límite de 1 MB)
      const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
      const db = firebase.firestore();

      msg.innerText = `Subiendo 0 de ${totalChunks} partes...`;

      // 1. Guardar documento principal con metadatos
      const docRef = db.collection("tablas_salariales_pdf").doc(actividadId);
      await docRef.set({
        nombreArchivo: archivo.name,
        totalChunks: totalChunks,
        fechaActualizacion: new Date().toISOString(),
      });

      // 2. Subir cada fragmento a la subcolección
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, base64Data.length);
        const chunk = base64Data.substring(start, end);

        btn.innerText = `⏳ Subiendo (${Math.round(((i + 1) / totalChunks) * 100)}%)...`;
        msg.innerText = `Subiendo parte ${i + 1} de ${totalChunks}...`;

        await docRef.collection("partes").doc(`parte_${i}`).set({
          orden: i,
          data: chunk,
        });
      }

      btn.disabled = false;
      btn.innerText = "☁️ Subir y Actualizar";
      msg.style.color = "#059669";
      msg.innerText = `✅ ¡Tabla de ${select.options[select.selectedIndex].text} guardada con éxito!`;
      inputFile.value = "";
    } catch (err) {
      console.error("Error al fragmentar y guardar:", err);
      btn.disabled = false;
      btn.innerText = "☁️ Subir y Actualizar";
      msg.style.color = "#dc2626";
      msg.innerText = "❌ Error al guardar en la base de datos.";
    }
  };

  reader.onerror = function () {
    btn.disabled = false;
    btn.innerText = "☁️ Subir y Actualizar";
    msg.style.color = "#dc2626";
    msg.innerText = "❌ No se pudo leer el archivo local.";
  };
}

// DESCARGA Y ENSAMBLAJE DE FRAGMENTOS
async function descargarTabla(tipoActividad) {
  try {
    const db = firebase.firestore();
    const docRef = db.collection("tablas_salariales_pdf").doc(tipoActividad);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      alert(
        "Esta tabla salarial todavía no tiene un PDF cargado. El administrador debe subirla primero.",
      );
      return;
    }

    const info = docSnap.data();
    let base64Completo = "";

    // Si tiene fragmentos, los descarga y une en orden
    if (info.totalChunks) {
      const snapshotPartes = await docRef
        .collection("partes")
        .orderBy("orden", "asc")
        .get();
      snapshotPartes.forEach((doc) => {
        base64Completo += doc.data().data;
      });
    } else {
      base64Completo = info.base64 || info.contenidoPdf;
    }

    if (!base64Completo) {
      alert("No se encontró el contenido del archivo.");
      return;
    }

    // Conversión a Blob y apertura directa
    const byteCharacters = atob(base64Completo.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const fileURL = URL.createObjectURL(blob);

    window.open(fileURL, "_blank");
  } catch (error) {
    console.error("Error al reconstruir PDF:", error);
    alert("Hubo un problema al abrir el archivo.");
  }
}

// VINCULACIÓN DE BOTONES
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btnAbrirTablas")
    ?.addEventListener("click", mostrarVistaTablas);
  document
    .getElementById("btnVolverCalculadora")
    ?.addEventListener("click", mostrarVistaCalculadora);
});
