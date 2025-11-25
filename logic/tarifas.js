// logic/tarifas.js

// --- 1. FUNCIONES DE SEGURIDAD Y FORMATO ---

// Convierte referencias o descripciones a texto seguro (evita errores con null/undefined)
function safeStr(val) {
    if (val === null || val === undefined) return "";
    return String(val).trim();
}

// Convierte precios a número, gestionando comas decimales o textos sucios
function parsePrice(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    
    // Si es texto, quitamos símbolos de moneda y cambiamos coma por punto
    let cleanVal = String(val).replace(/[€$£\s]/g, '').replace(',', '.');
    let num = parseFloat(cleanVal);
    return isNaN(num) ? 0 : num;
}

// --- 2. CARGA DE DATOS ---

async function loadTariffForPdf(tariffFile) {
    try {
        console.log(`Cargando: ${tariffFile}...`);
        // Timestamp para evitar caché antigua
        const response = await fetch(`src/${tariffFile}?v=${new Date().getTime()}`);
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const dataObject = await response.json();
        
        // Lógica para detectar dónde están los datos según tu JSON
        if (Array.isArray(dataObject)) {
            return dataObject;
        } else {
            // Tu JSON tiene formato { "Tarifa_General": [...] }
            // Obtenemos la primera clave del objeto
            const keys = Object.keys(dataObject);
            if (keys.length > 0) {
                const sheetName = keys[0];
                const dataArray = dataObject[sheetName];
                if (Array.isArray(dataArray)) {
                    console.log(`Datos cargados correctamente de la hoja: ${sheetName} (${dataArray.length} items)`);
                    return dataArray;
                }
            }
            throw new Error("El archivo JSON no contiene un array de productos válido.");
        }
    } catch (error) {
        console.error("Error cargando tarifa:", error);
        alert(`Error al cargar ${tariffFile}. \nRevisa la consola (F12) para más detalles.`);
        return null;
    }
}

// --- 3. GENERACIÓN DE PDF ---

function generatePdf(title, head, bodyData, button) {
    if (!bodyData || bodyData.length === 0) {
        alert("No hay datos para generar el PDF.");
        return;
    }

    // Verificar que jsPDF está cargado
    if (!window.jspdf) {
        alert("Error crítico: La librería jsPDF no se ha cargado. Revisa tu archivo tarifas.html y tu conexión.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const originalText = button.textContent;
    button.textContent = 'Generando...';
    button.disabled = true;

    try {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Verificar que el plugin autoTable está disponible
        if (typeof doc.autoTable !== 'function') {
            throw new Error("El plugin 'autotable' no se ha cargado correctamente.");
        }

        // --- CABECERA ---
        doc.setFontSize(16);
        doc.setTextColor(0, 122, 255); // Azul
        doc.text(title.toUpperCase(), 14, 15);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fecha: ${new Date().toLocaleDateString()} | Items: ${bodyData.length}`, 14, 22);

        // --- TABLA ---
        doc.autoTable({
            head: [head],
            body: bodyData,
            startY: 26,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
            headStyles: { fillColor: [0, 122, 255], textColor: 255, fontStyle: 'bold', halign: 'center' },
            columnStyles: {
                0: { cellWidth: 25 }, // Ref
                1: { cellWidth: 'auto' }, // Desc
                2: { halign: 'right', cellWidth: 20 }, // PVP Base
                3: { halign: 'center', cellWidth: 15 }, // Dto
                4: { halign: 'right', fontStyle: 'bold', cellWidth: 20 }, // Final
                5: { cellWidth: 45 } // Condiciones/Neto
            },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`${title.replace(/\s+/g, '_')}.pdf`);

    } catch (err) {
        console.error("Error en generatePdf:", err);
        alert(`Fallo al crear el PDF: ${err.message}`);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Configuración de columnas
const head = ['Ref.', 'Descripción', 'PVP Base', 'Dto.', 'Precio Final', 'Condiciones / Neto'];

// --- 4. EVENT LISTENERS (Mapeo Específico según tus JSON) ---

// TARIFA GENERAL
document.getElementById('pdf-general').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_General.json');
    if (!products) return;

    // Basado en tu JSON: PRECIO_ESTANDAR, NETOS (num o null), CONDICIONES_NETO (string)
    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_ESTANDAR);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        
        // Si hay valor en NETOS (y no es null), es precio Neto
        if (p.NETOS !== null && parsePrice(p.NETOS) > 0) {
            return [
                safeStr(p.Referencia), 
                safeStr(p.Descripcion), 
                `${pvpBase} €`, 
                'Neto', 
                '-', 
                safeStr(p.CONDICIONES_NETO)
            ];
        }
        // Precio estándar con descuento
        return [
            safeStr(p.Referencia), 
            safeStr(p.Descripcion), 
            `${pvpBase} €`, 
            '50%', 
            `${precioFinal.toFixed(2)} €`, 
            '-'
        ];
    });
    generatePdf('Tarifa General', head, body, e.target);
});

// BIGMAT (Usa misma estructura que General)
document.getElementById('pdf-bigmat').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Bigmat.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_ESTANDAR);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';

        if (p.NETOS !== null && parsePrice(p.NETOS) > 0) {
            return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, 'Neto', '-', safeStr(p.CONDICIONES_NETO)];
        }
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa BigMat', head, body, e.target);
});

// NEOPRO (Campo: PRECIO_GRUPO1, sin Netos en el ejemplo)
document.getElementById('pdf-neopro').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Neopro.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_GRUPO1);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00'; // Margen Neopro suele ser diferente

        return [
            safeStr(p.Referencia), 
            safeStr(p.Descripcion), 
            `${pvpBase} €`, 
            '52%', 
            `${precioFinal.toFixed(2)} €`, 
            '-'
        ];
    });
    generatePdf('Tarifa Neopro', head, body, e.target);
});

// EHLIS (Campo: PRECIO_GRUPO1)
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

// CECOFERSA (Campo: PRECIO_CECOFERSA)
document.getElementById('pdf-cecofersa').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Cecofersa.json');
    if (!products) return;

    const body = products.map(p => {
        const precioFinal = parsePrice(p.PRECIO_CECOFERSA);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';

        if (p.NETOS !== null && parsePrice(p.NETOS) > 0) {
            return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, 'Neto', '-', safeStr(p.CONDICIONES_NETO)];
        }
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Cecofersa', head, body, e.target);
});

// SYNERGAS (Campo: PRECIO_GRUPO1)
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

// GRANDES CUENTAS (Campo: PRECIO_ESTANDAR y NETOS_GRANDE_CUENTAS)
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

// COFERDROZA (Campo: PRECIO_GRUPO3)
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

// INDUSTRIAL PRO (Lógica mixta por seguridad)
document.getElementById('pdf-industrial-pro').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_IndustrialPro.json');
    if (!products) return;

    const body = products.map(p => {
        // Intento de encontrar el precio en varios campos comunes
        let rawPrice = p.PRECIO_ESTANDAR || p.PRECIO_CECOFERSA || p.PRECIO || 0;
        const precioFinal = parsePrice(rawPrice);
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';

        if (p.NETOS !== null && parsePrice(p.NETOS) > 0) {
            return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, 'Neto', '-', safeStr(p.CONDICIONES_NETO)];
        }
        return [safeStr(p.Referencia), safeStr(p.Descripcion), `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Industrial Pro', head, body, e.target);
});