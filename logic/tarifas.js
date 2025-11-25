// logic/tarifas.js

// --- 1. FUNCIONES AUXILIARES DE SEGURIDAD ---

// Convierte cualquier formato de precio (texto con coma, número, etc.) a un número flotante válido
function parsePrice(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    
    // Convertir a string, quitar símbolos de moneda y espacios
    let stringVal = String(value).replace(/[€$£\s]/g, '');
    
    // Reemplazar coma por punto si existe
    stringVal = stringVal.replace(',', '.');
    
    const floatVal = parseFloat(stringVal);
    return isNaN(floatVal) ? 0 : floatVal;
}

// Asegura que el texto no sea null o undefined
function safeStr(text) {
    return text ? String(text) : '';
}

// --- 2. CARGA DE DATOS ---

// Función para cargar un archivo JSON de tarifa específico desde la carpeta 'src'
async function loadTariffForPdf(tariffFile) {
    try {
        // Añadimos un timestamp para evitar problemas de caché
        const response = await fetch(`src/${tariffFile}?v=${new Date().getTime()}`);
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const dataObject = await response.json();
        
        // Verificación de estructura: ¿Es un array directo o un objeto con nombre de hoja?
        if (Array.isArray(dataObject)) {
            return dataObject;
        } else {
            // Si es un objeto tipo Excel exportado (con nombre de hoja), tomamos la primera hoja
            const sheetName = Object.keys(dataObject)[0];
            return dataObject[sheetName];
        }
    } catch (error) {
        console.error("Detalle del error:", error);
        // Detectar si es error de CORS (abrir archivo localmente sin servidor)
        if (window.location.protocol === 'file:') {
            alert(`Error de Seguridad (CORS): No se pueden cargar archivos JSON ('${tariffFile}') abriendo el HTML directamente.\n\nSolución: Debes usar un servidor local (Live Server en VSCode) o subirlo a GitHub Pages.`);
        } else {
            alert(`Error al cargar la tarifa: ${tariffFile}.\nRevisa que el archivo exista en 'src/' y el formato JSON sea correcto.`);
        }
        return null;
    }
}

// --- 3. GENERACIÓN DE PDF ---

// Función genérica para crear un PDF
function generatePdf(title, head, bodyData, button) {
    if (!bodyData || bodyData.length === 0) {
        alert("El archivo de tarifa parece estar vacío o no se ha podido leer.");
        return;
    }
    
    // Aseguramos que jsPDF esté cargado correctamente
    if (!window.jspdf) {
        alert("Error: La librería jsPDF no se ha cargado. Revisa tu conexión a internet.");
        return;
    }

    const { jsPDF } = window.jspdf;
    
    // Feedback visual en el botón
    const originalText = button.textContent;
    button.textContent = 'Generando...';
    button.disabled = true;

    try {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Verificamos que el plugin autoTable se haya cargado
        if (typeof doc.autoTable !== 'function') {
            throw new Error("El plugin 'jspdf-autotable' no se ha cargado correctamente.");
        }
        
        // --- CABECERA DEL DOCUMENTO ---
        doc.setFontSize(14);
        doc.text(title.toUpperCase(), 14, 15);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
        
        // --- TABLA DE PRECIOS ---
        doc.autoTable({
            head: [head], 
            body: bodyData, 
            startY: 28, 
            theme: 'grid',
            styles: { 
                fontSize: 8, 
                cellPadding: 1.5,
                valign: 'middle'
            }, 
            headStyles: { 
                fillColor: [0, 122, 255], // Azul corporativo
                textColor: 255,
                fontSize: 8, 
                fontStyle: 'bold',
                halign: 'center' 
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Ref
                1: { cellWidth: 'auto' }, // Descripción
                2: { halign: 'right', cellWidth: 20 }, // PVP Base
                3: { halign: 'center', cellWidth: 15 }, // Dto
                4: { halign: 'right', fontStyle: 'bold', cellWidth: 20 }, // Precio Final
                5: { cellWidth: 40 } // Condiciones
            },
            // Formateo alternativo de filas para mejor lectura
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });

        // Guardar el archivo
        const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g,'-')}.pdf`;
        doc.save(fileName);

    } catch (err) {
        console.error(err);
        alert(`Ocurrió un error al generar el PDF:\n${err.message}`);
    } finally {
        // Restaurar botón
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Configuración de cabecera de la tabla
const head = ['Ref.', 'Descripción', 'PVP Base', 'Dto.', 'Precio Final', 'Notas / Neto'];

// --- 4. EVENT LISTENERS ---

// TARIFA GENERAL
document.getElementById('pdf-general').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_General.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_ESTANDAR);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        
        if (p.NETOS) {
            return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, 'Neto', '-', safeStr(p.CONDICIONES_NETO)];
        }
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa General', head, body, e.target);
});

// BIGMAT
document.getElementById('pdf-bigmat').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Bigmat.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_ESTANDAR);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        
        if (p.NETOS) {
            return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, 'Neto', '-', safeStr(p.CONDICIONES_NETO)];
        }
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa BigMat', head, body, e.target);
});

// NEOPRO
document.getElementById('pdf-neopro').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Neopro.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_GRUPO1);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Neopro', head, body, e.target);
});

// EHLIS
document.getElementById('pdf-ehlis').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Ehlis.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_GRUPO1);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Ehlis', head, body, e.target);
});

// CECOFERSA
document.getElementById('pdf-cecofersa').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Cecofersa.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_CECOFERSA);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        
        if (p.NETOS) {
            return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, 'Neto', '-', safeStr(p.CONDICIONES_NETO)];
        }
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Cecofersa', head, body, e.target);
});

// SYNERGAS
document.getElementById('pdf-synergas').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Synergas.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_GRUPO1);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Synergas', head, body, e.target);
});

// GRANDES CUENTAS
document.getElementById('pdf-grandes-cuentas').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Grandes_Cuentas.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_ESTANDAR);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        
        if (p.NETOS_GRANDE_CUENTAS) {
            return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, 'Neto G.C.', '-', safeStr(p.CONDICION_NETO_GC)];
        }
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Grandes Cuentas', head, body, e.target);
});

// COFERDROZA
document.getElementById('pdf-coferdroza').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Coferdroza.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_GRUPO3);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Coferdroza', head, body, e.target);
});

// INDUSTRIAL PRO
document.getElementById('pdf-industrial-pro').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_IndustrialPro.json');
    if (!products) return;
    
    const body = products.map(p => {
        // Intentamos encontrar el precio en varios campos posibles
        let rawPrice = p.PRECIO_ESTANDAR || p.PRECIO_CECOFERSA || p.PRECIO;
        const precioFinal = parsePrice(rawPrice);
        
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        
        if (p.NETOS) {
            return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, 'Neto', '-', safeStr(p.CONDICIONES_NETO)];
        }
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Industrial Pro', head, body, e.target);
});