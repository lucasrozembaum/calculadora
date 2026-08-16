// =======================================================
// NAVEGACIÓN ENTRE VISTAS CON CONTROL DE ROL
// =======================================================

function mostrarVistaTablas() {
  document.getElementById("calcView")?.classList.add("hidden");
  document.getElementById("paritariasView")?.classList.add("hidden");
  document.getElementById("tablasView")?.classList.remove("hidden");

  // Verifica si el usuario inició sesión como Administrador
  const navAdmin = document.getElementById("adminNav");
  const panelAdmin = document.getElementById("panelAdminSubida");

  if (panelAdmin) {
    // Si la barra de admin no está oculta, muestra el panel de subida
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

// =======================================================
// ADMINISTRADOR: SUBIR PDF A LA NUBE (FIRESTORE)
// =======================================================

async function subirTablaPdf() {
  const select = document.getElementById("selectActividadSubir");
  const inputFile = document.getElementById("inputPdfTabla");
  const msg = document.getElementById("msgSubida");
  const btn = document.getElementById("btnSubirPdf");

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

  // Límite ampliado a 25 MB para resoluciones completas
  const limiteEnBytes = 25 * 1024 * 1024; // 26.214.400 bytes (25 MB)
  if (archivo.size > limiteEnBytes) {
    alert("El archivo supera el tamaño máximo permitido de 25 MB.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Subiendo...";
  msg.style.display = "block";
  msg.style.color = "#0284c7";
  msg.innerText = "Subiendo archivo a la nube...";

  try {
    // 1. Convertir PDF a Base64
    const reader = new FileReader();
    reader.readAsDataURL(archivo);

    reader.onload = async function () {
      const base64Data = reader.result;

      // 2. Guardar en Firestore en la colección 'tablas_salariales_pdf'
      const db = firebase.firestore();
      await db.collection("tablas_salariales_pdf").doc(actividadId).set({
        nombreArchivo: archivo.name,
        contenidoPdf: base64Data,
        fechaActualizacion: new Date().toISOString(),
      });

      btn.disabled = false;
      btn.innerText = "☁️ Subir y Actualizar";
      msg.style.color = "#059669";
      msg.innerText = `✅ ¡Tabla de ${select.options[select.selectedIndex].text} actualizada con éxito!`;
      inputFile.value = "";
    };

    reader.onerror = function () {
      throw new Error("Error al leer el archivo local.");
    };
  } catch (error) {
    console.error("Error al subir:", error);
    btn.disabled = false;
    btn.innerText = "☁️ Subir y Actualizar";
    msg.style.color = "#dc2626";
    msg.innerText = "❌ Ocurrió un error al guardar en la nube.";
  }
}

// =======================================================
// USUARIO / ADMIN: DESCARGAR O VER EL PDF ACTUALIZADO
// =======================================================

async function descargarTabla(tipoActividad) {
  try {
    const db = firebase.firestore();
    const docRef = await db
      .collection("tablas_salariales_pdf")
      .doc(tipoActividad)
      .get();

    if (!docRef.exists || !docRef.data().contenidoPdf) {
      alert(
        "Esta tabla salarial todavía no tiene un PDF cargado. El administrador debe subirla primero.",
      );
      return;
    }

    const data = docRef.data();
    const base64String = data.contenidoPdf;

    // Convertir Base64 a Blob y abrir en el navegador
    const byteCharacters = atob(base64String.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const fileURL = URL.createObjectURL(blob);

    // Abre el PDF en una pestaña para ver o descargar
    window.open(fileURL, "_blank");
  } catch (error) {
    console.error("Error al descargar:", error);
    alert("Hubo un problema al consultar la base de datos.");
  }
}

// =======================================================
// EVENT LISTENERS
// =======================================================

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btnAbrirTablas")
    ?.addEventListener("click", mostrarVistaTablas);
  document
    .getElementById("btnVolverCalculadora")
    ?.addEventListener("click", mostrarVistaCalculadora);
});
