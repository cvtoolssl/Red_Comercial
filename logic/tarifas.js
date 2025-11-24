// Espera a que la librería jsPDF esté lista
window.jsPDF = window.jspdf.jsPDF;

// Función para cargar un archivo JSON de tarifa específico desde la carpeta 'src'
async function loadTariffForPdf(tariffFile) {
    try {
        // CORRECCIÓN: Ruta relativa corregida. 
        const response = await fetch(`src/${tariffFile}?v=${new Date().getTime()}`);
        
        if (!response.ok) throw new Error(`Error al cargar src/${tariffFile}`);
        const dataObject = await response.json();
        const sheetName = Object.keys(dataObject)[0];
        return dataObject[sheetName];
    } catch (error) {
        alert(`No se pudo cargar la tarifa ${tariffFile}. Revisa que el archivo JSON esté en la carpeta 'src'.`);
        console.error(error);
        return null;
    }
}

// Función genérica para crear un PDF
function generatePdf(title, head, bodyData, button) {
    if (!bodyData) return;
    
    const originalText = button.textContent;
    button.textContent = 'Generando...';
    button.disabled = true;

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(title, 14, 20);
    doc.autoTable({
        head: [head], body: bodyData, startY: 25, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5 }, 
        headStyles: { fillColor: [0, 122, 255], fontSize: 7 }
    });
    doc.save(`${title}.pdf`);

    button.textContent = originalText;
    button.disabled = false;
}

// Lógica para los botones de PDF con CÁLCULO DE PVP
const head = ['Ref.', 'Descripción', 'PVP Base', 'Dto.', 'Precio Final', 'Precio por Cantidad'];

document.getElementById('pdf-general').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_General.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_ESTANDAR || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        if (p.NETOS) return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('PDF Tarifa General', head, body, e.target);
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
    generatePdf('PDF Tarifa BigMat', head, body, e.target);
});

document.getElementById('pdf-neopro').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Neopro.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_GRUPO1 || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('PDF Tarifa Neopro', head, body, e.target);
});

document.getElementById('pdf-ehlis').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Ehlis.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_GRUPO1 || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('PDF Tarifa Ehlis', head, body, e.target);
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
    generatePdf('PDF Tarifa Cecofersa', head, body, e.target);
});

document.getElementById('pdf-synergas').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Synergas.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_GRUPO1 || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('PDF Tarifa Synergas', head, body, e.target);
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
    generatePdf('PDF Tarifa Grandes Cuentas', head, body, e.target);
});

document.getElementById('pdf-coferdroza').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_Coferdroza.json');
    if (!products) return;
    const body = products.map(p => {
        const precioFinal = p.PRECIO_GRUPO3 || 0;
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.50).toFixed(2) : '0.00';
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '50%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('PDF Tarifa Coferdroza', head, body, e.target);
});

// NUEVA TARIFA INDUSTRIAL PRO
document.getElementById('pdf-industrial-pro').addEventListener('click', async (e) => {
    const products = await loadTariffForPdf('Tarifa_IndustrialPro.json');
    if (!products) return;
    const body = products.map(p => {
        // Condiciones Cecofersa (Divisor 0.48, Dto 52%)
        const precioFinal = p.PRECIO_ESTANDAR || 0; 
        const pvpBase = (precioFinal > 0) ? (precioFinal / 0.48).toFixed(2) : '0.00';
        if (p.NETOS) return [p.Referencia, p.Descripcion, `${pvpBase} €`, 'Neto', '-', p.CONDICIONES_NETO];
        return [p.Referencia, p.Descripcion, `${pvpBase} €`, '52%', `${precioFinal.toFixed(2)} €`, '-'];
    });
    generatePdf('PDF Tarifa Industrial Pro', head, body, e.target);
});