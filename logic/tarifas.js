// tarifas.js

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
            const sheetName = Object.keys(dataObject)[0];
            return dataObject[sheetName];
        }
    } catch (error) {
        alert(`Error al cargar la tarifa: ${tariffFile}. \nAsegúrate de que el archivo existe en la carpeta 'src/'.`);
        console.error("Detalle del error:", error);
        return null;
    }
}

// Función genérica para crear un PDF
function generatePdf(title, head, bodyData, button) {
    if (!bodyData || bodyData.length === 0) {
        alert("El archivo de tarifa parece estar vacío o no se ha podido leer.");
        return;
    }
    
    // Aseguramos que jsPDF esté cargado correctamente
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert("Error: La librería jsPDF no se ha cargado. Revisa tu conexión a internet.");
        return;
    }

    const originalText = button.textContent;
    button.textContent = 'Generando...';
    button.disabled = true;

    try {
        const doc = new jsPDF({ orientation: 'landscape' });
        
        // Título
        doc.setFontSize(14);
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 20);

        // Tabla
        doc.autoTable({
            head: [head], 
            body: bodyData, 
            startY: 25, 
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1.5 }, 
            headStyles: { fillColor: [0, 122, 255], fontSize: 7, halign: 'center' },
            columnStyles: {
                0: { cellWidth: 25 }, // Ref
                2: { halign: 'right' }, // PVP Base
                3: { halign: 'center' }, // Dto
                4: { halign: 'right', fontStyle: 'bold' } // Precio Final
            }
        });

        doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
        console.error(err);
        alert("Ocurrió un error al generar el PDF. Revisa la consola (F12) para más detalles.");
    }

    button.textContent = originalText;
    button.disabled = false;
}

// Configuración de cabecera
const head = ['Ref.', 'Descripción', 'PVP Base', 'Dto.', 'Precio Final', 'Precio por Cantidad'];

// --- EVENT LISTENERS PARA CADA BOTÓN ---

document.getElementById('pdf-general').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_General.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_ESTANDAR || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        if (p.NETOS) return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa General', head, body, e.target);
});

document.getElementById('pdf-bigmat').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Bigmat.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_ESTANDAR || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        if (p.NETOS) return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa BigMat', head, body, e.target);
});

document.getElementById('pdf-neopro').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Neopro.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_GRUPO1 || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Neopro', head, body, e.target);
});

document.getElementById('pdf-ehlis').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Ehlis.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_GRUPO1 || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Ehlis', head, body, e.target);
});

document.getElementById('pdf-cecofersa').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Cecofersa.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_CECOFERSA || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        if (p.NETOS) return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Cecofersa', head, body, e.target);
});

document.getElementById('pdf-synergas').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Synergas.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_GRUPO1 || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Synergas', head, body, e.target);
});

document.getElementById('pdf-grandes-cuentas').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Grandes_Cuentas.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_ESTANDAR || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        if (p.NETOS_GRANDE_CUENTAS) return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto G.C.', '-', p.CONDICION_NETO_GC];
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Grandes Cuentas', head, body, e.target);
});

document.getElementById('pdf-coferdroza').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Coferdroza.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_GRUPO3 || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Coferdroza', head, body, e.target);
});


document.getElementById('pdf-industrial-pro').addEventListener('click', async (e) => {
    // Asegúrate de que el archivo Tarifa_IndustrialPro.json existe en src/
    const products = await loadTariffForPdf('Tarifa_IndustrialPro.json');
    if (!products) return;
    
    const body = products.map(p => {
        // Condiciones: Divisor 0.48 (Margen), Descuento 52%
        // Buscamos PRECIO_ESTANDAR o PRECIO_CECOFERSA o PRECIO por si acaso
        const precioFinal = p.PRECIO_ESTANDAR || p.PRECIO_CECOFERSA || p.PRECIO || 0; 
        
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        
        if (p.NETOS) {
            return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        }
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Industrial Pro', head, body, e.target);
});