const pdfInput = document.getElementById("pdfInput");
const processPdfBtn = document.getElementById("processPdfBtn");
const textInput = document.getElementById("textInput");
const processTextBtn = document.getElementById("processTextBtn");
const output = document.getElementById("output");
const dropZone = document.getElementById("dropZone");

// Drag and drop functionality
dropZone.addEventListener("click", () => {
  console.log("Clic en drop zone");
  pdfInput.click();
});
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const files = e.dataTransfer.files;
  console.log("Archivos dropped:", files);
  if (files.length && files[0].type === "application/pdf") {
    pdfInput.files = files;
    dropZone.querySelector("p").textContent = `PDF seleccionado: ${files[0].name}`;
    console.log("PDF asignado:", files[0].name);
  } else {
    alert("Por favor, suelta solo archivos PDF.");
  }
});

// También para el input change
pdfInput.addEventListener("change", () => {
  if (pdfInput.files.length) {
    dropZone.querySelector("p").textContent = `PDF seleccionado: ${pdfInput.files[0].name}`;
  }
});

async function extractTextFromPdf(file) {
  const pdfLib = window["pdfjsLib"];
  console.log("pdfjsLib disponible:", !!pdfLib);
  if (!pdfLib) {
    throw new Error("pdf.js no está disponible. Recarga la página o verifica la conexión a internet.");
  }
  pdfLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }

  return fullText.trim();
}

async function requestGeminiTopics(text) {
  console.log("Enviando request a API proxy");
  const API_URL = 'https://tu-api.vercel.app/api/gemini';
  
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  console.log("Respuesta de la función:", { status: res.status, ok: res.ok });

  if (!res.ok) {
    const errData = await res.json();
    console.error("Error en respuesta:", errData);
    throw new Error(`Function error: ${errData.error || res.statusText}`);
  }

  const data = await res.json();
  return data.result;
}

async function analyzeText(sourceText) {
  if (!sourceText) {
    output.textContent = "No hay texto para analizar.";
    return;
  }

  console.log("Analizando texto:", sourceText.substring(0, 100) + "...");

  output.textContent = "Analizando con Gemini... espera un momento...";

  try {
    const result = await requestGeminiTopics(sourceText);
    if (!result) {
      output.textContent = "No se obtuvo ningún tema de la API.";
      return;
    }

    function parseTopics(text) {
      const parts = text
        .split(/\r?\n|\s*\d+\.\s*/)
        .map(t => t.trim())
        .filter(Boolean);
      return parts.slice(0, 10);
    }

    const topics = parseTopics(result);

    if (!topics.length) {
      output.textContent = "No se encontraron temas claros en la salida.";
      return;
    }

    // Presentar más moderna, con una lista numerada.
    output.innerHTML = "<ol>" +
      topics.map((topic) => `<li>${topic}</li>`).join("") +
      "</ol>";
  } catch (error) {
    console.error("Error en analyzeText:", error);
    output.textContent = `Error: ${error.message}`;
  }
}

processPdfBtn.addEventListener("click", async () => {
  const file = pdfInput.files?.[0];
  if (!file) { 
    output.textContent = "Selecciona un archivo PDF primero."; 
    alert("Selecciona un PDF primero.");
    return; 
  }

  console.log("Procesando PDF:", file.name);

  output.textContent = "Extrayendo texto del PDF...";

  try {
    const pdfText = await extractTextFromPdf(file);
    if (!pdfText) { output.textContent = "El PDF no contiene texto legible."; return; }
    console.log("Texto extraído del PDF:", pdfText.substring(0, 100) + "...");
    await analyzeText(pdfText);
  } catch (error) {
    console.error("Error procesando PDF:", error);
    output.textContent = `Error leyendo PDF: ${error.message}`;
  }
});

processTextBtn.addEventListener("click", async () => {
  const text = textInput.value.trim();
  if (!text) {
    output.textContent = "Ingresa texto para analizar.";
    alert("Ingresa texto primero.");
    return;
  }
  console.log("Procesando texto:", text.substring(0, 100) + "...");
  await analyzeText(text);
});
