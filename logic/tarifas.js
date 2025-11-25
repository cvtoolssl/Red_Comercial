// logic/tarifas.js

// 1. Inicialización de jsPDF (Tal cual tu ejemplo)
window.jsPDF = window.jspdf.jsPDF;

// 2. Función de carga (Adaptada a tu estructura de carpetas)
async function loadTariffForPdf(tariffFile) {
    try {
        // Usamos 'src/' porque el HTML que llama al script está en la raíz
        const response = await fetch(`src/${tariffFile}?v=${new Date().getTime()}`);
        
        if (!response.ok) throw new Error(`No se pudo cargar src/${tariffFile}`);
        
        const dataObject = await response.json();
        
        // Tu JSON es un objeto { "Nombre_Tarifa": [...] }, así que extraemos el array interior
        const sheetName = Object.keys(dataObject)[0];
        return dataObject[sheetName];
        
    } catch (error) {
        alert(`Error: No se encuentra el archivo ${tariffFile} en la carpeta 'src'.`);
        console.error(error);
        return null;
    }
}

// 3. Función generadora de PDF (Tu lógica exacta)
function generatePdf(title, head, bodyData, button) {
    if (!bodyData || bodyData.length === 0) {
        alert("La tarifa está vacía o no se ha cargado.");
        return;
    }
    
    const originalText = button.textContent;
    button.textContent = 'Generando...';
    button.disabled = true;

    try {
        const doc = new jsPDF({ orientation: 'landscape' });
        
        // Título y Fecha
        doc.setFontSize(14);
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 20);

        // Tabla con autotable
        doc.autoTable({
            head: [head], 
            body: bodyData, 
            startY: 25, 
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' }, 
            headStyles: { fillColor: [0, 122, 255], fontSize: 7, halign: 'center' },
            columnStyles: {
                0: { cellWidth: 25 }, // Ref
                2: { halign: 'right' }, // PVP Base
                3: { halign: 'center' }, // Dto
                4: { halign: 'right', fontStyle: 'bold' } // Precio Final
            }
        });

        doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
        console.error(error);
        alert("Ocurrió un error al crear el PDF. Revisa la consola.");
    }

    button.textContent = originalText;
    button.disabled = false;
}

// Cabecera común
const head = ['Ref.', 'Descripción', 'PVP Base', 'Dto.', 'Precio Final', 'Precio por Cantidad'];

// --- EVENT LISTENERS PARA LOS 9 BOTONES ---

// 1. TARIFA GENERAL
document.getElementById('pdf-general').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_General.json');
    if (!products) return;
    
    const body = products.map(p => {
        const precioFinal = p.PRECIO_ESTANDAR || 0;
        // Cálculo inverso: Si Precio Final es X y el dto es 50%, el Base es X / 0.50
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        
        if (p.NETOS) {
            return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        }
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa General', head, body, e.target);
});

// 2. BIGMAT
document.getElementById('pdf-bigmat').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Bigmat.json');
    if (!products) return;
    
    const body = products.map(p => {
        const precioFinal = p.PRECIO_ESTANDAR || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        
        if (p.NETOS) {
            return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        }
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa BigMat', head, body, e.target);
});

// 3. NEOPRO
document.getElementById('pdf-neopro').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Neopro.json');
    if (!products) return;
    
    const body = products.map(p => {
        const precioFinal = p.PRECIO_GRUPO1 || 0;
        // Margen 0.48 -> Descuento aprox 52%
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Neopro', head, body, e.target);
});

// 4. EHLIS
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

// 5. CECOFERSA
document.getElementById('pdf-cecofersa').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Cecofersa.json');
    if (!products) return;
    
    const body = products.map(p => {
        const precioFinal = p.PRECIO_CECOFERSA || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        
        if (p.NETOS) {
            return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        }
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Cecofersa', head, body, e.target);
});

// 6. SYNERGAS
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

// 7. GRANDES CUENTAS
document.getElementById('pdf-grandes-cuentas').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Grandes_Cuentas.json');
    if (!products) return;
    
    const body = products.map(p => {
        const precioFinal = p.PRECIO_ESTANDAR || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        
        if (p.NETOS_GRANDE_CUENTAS) {
            return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto G.C.', '-', p.CONDICION_NETO_GC];
        }
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Grandes Cuentas', head, body, e.target);
});

// 8. COFERDROZA
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

// 9. INDUSTRIAL PRO (Nuevo botón)
document.getElementById('pdf-industrial-pro').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_IndustrialPro.json');
    if (!products) return;
    
    const body = products.map(p => {
        // Intentamos leer el precio de varias formas por seguridad
        const precioFinal = p.PRECIO_ESTANDAR || p.PRECIO_CECOFERSA || p.PRECIO || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        
        if (p.NETOS) {
            return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        }
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('Tarifa Industrial Pro', head, body, e.target);
});