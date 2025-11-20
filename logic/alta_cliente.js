// Espera a que la librería jsPDF esté lista
window.jsPDF = window.jspdf.jsPDF;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('client-form');
    const feedback = document.getElementById('form-feedback');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        let isValid = true;
        feedback.style.display = 'none';
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.classList.remove('error');
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');
            }
        });

        if (!isValid) {
            feedback.textContent = 'Por favor, rellena todos los campos obligatorios marcados en rojo.';
            feedback.className = 'error';
            feedback.style.display = 'block';
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // --- LÍNEA DE DEPURACIÓN ---
        // Esto nos mostrará en la consola del navegador (F12) exactamente qué datos se están recogiendo.
        console.log('Datos del formulario recogidos:', data);

        // 1. Siempre se genera la Ficha de Alta
        generateClientPdf(data);
        
        // 2. CORRECCIÓN: Comprobamos si el campo 'iban' existe en los datos recogidos
        const ibanProvided = data.hasOwnProperty('iban') && data.iban.trim() !== '';
        if (ibanProvided) {
            console.log('IBAN detectado, generando SEPA...'); // Mensaje de confirmación
            generateSepaPdf(data);
        }
        
        // 3. El mensaje de feedback se adapta
        let feedbackMessage = `¡Ficha de Alta generada con éxito! <br>Por favor, revisa tus descargas y envía el archivo a <strong>comercial@cvtools.es</strong>.`;
        if (ibanProvided) {
            feedbackMessage = `¡Documentos generados con éxito! <br>Revisa tus descargas para encontrar la <strong>Ficha de Alta</strong> y el <strong>Mandato SEPA</strong>. Por favor, firma el SEPA y envía ambos archivos a <strong>comercial@cvtools.es</strong>.`;
        }
        feedback.innerHTML = feedbackMessage;
        feedback.className = 'success';
        feedback.style.display = 'block';
    });
});

// --- FUNCIÓN PARA GENERAR LA FICHA DE ALTA DE CLIENTE (CON LOGO Y DIRECCIÓN DE ENTREGA) ---
function generateClientPdf(data) {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES');
    const logoImg = document.getElementById('logo-for-pdf');

    if (logoImg) {
        doc.addImage(logoImg, 'PNG', 75, 15, 60, 15);
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA DE ALTA DE NUEVO CLIENTE', 105, 40, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${today}`, 200, 45, { align: 'right' });

    const drawSection = (title, fields, startY) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(220, 220, 220);
        doc.rect(14, startY, 182, 8, 'F');
        doc.text(title, 105, startY + 5.5, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.autoTable({
            startY: startY + 10, body: fields, theme: 'grid',
            styles: { cellPadding: 2, fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 'auto' } }
        });
        return doc.autoTable.previous.finalY + 5;
    };

    const fiscalFields = [
        ['Nombre Empresa', data.nombre_empresa || ''], ['CIF', data.cif || ''],
        ['Dirección Fiscal', data.direccion || ''], ['Población', `${data.codigo_postal || ''} ${data.poblacion || ''}`],
        ['Provincia', data.provincia || ''], ['Teléfono', data.telefono_fiscal || ''],
        ['E-Mail Fiscal', data.email_fiscal || '']
    ];
    
    const entregaFields = [
        ['Dirección Entrega', data.direccion_entrega || ''],
        ['Población', `${data.cp_entrega || ''} ${data.poblacion_entrega || ''}`],
        ['Provincia', data.provincia_entrega || '']
    ];

    const contabilidadFields = [
        ['Nombre Completo', `${data.nombre_contabilidad || ''} ${data.apellidos_contabilidad || ''}`],
        ['E-Mail Contacto', data.email_contabilidad || ''], ['Teléfono Contacto', data.telefono_contabilidad || '']
    ];
    const comprasFields = [
        ['Nombre Completo', `${data.nombre_compras || ''} ${data.apellidos_compras || ''}`],
        ['E-Mail', data.email_compras || ''], ['Teléfono', data.telefono_compras || '']
    ];
    const bancoFields = [ ['IBAN', data.iban || ''] ];

    let currentY = 50;
    currentY = drawSection('Sección 1: Datos Fiscales', fiscalFields, currentY);
    
    if (data.direccion_entrega && data.direccion_entrega.trim() !== '') {
        currentY = drawSection('Sección 2: Dirección de Entrega', entregaFields, currentY);
    }
    
    currentY = drawSection('Sección 3: Dpto. Contabilidad', contabilidadFields, currentY);
    currentY = drawSection('Sección 4: Dpto. Compras', comprasFields, currentY);
    currentY = drawSection('Sección 5: Información Bancaria', bancoFields, currentY);

    const fileName = `Alta_Cliente_${data.nombre_empresa.replace(/ /g, '_') || 'Nuevo_Cliente'}.pdf`;
    doc.save(fileName);
}

// --- LA FUNCIÓN generateSepaPdf NO CAMBIA ---
function generateSepaPdf(data) {
    const doc = new jsPDF();
    const logoImg = document.getElementById('logo-for-pdf');

    if (logoImg) {
        doc.addImage(logoImg, 'PNG', 14, 15, 40, 10);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Orden de domiciliación de adeudo directo SEPA', 105, 35, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('SEPA Direct Debit Mandate', 105, 40, { align: 'center' });

    const creditorData = [
        ['Referencia de la orden:', 'CVTOOLS. S.L.'],
        ['Identificador del acreedor:', 'B96573613'],
        ['Nombre del acreedor:', 'CV TOOLS, S.L.'],
        ['Dirección:', 'Avda Camino de Albaida S/N'],
        ['Código postal - Población:', '46830 Benigànim (Valencia)'],
        ['País:', 'España'],
    ];
    doc.autoTable({
        startY: 45, head: [['A CUMPLIMENTAR POR EL ACREEDOR']],
        body: creditorData, theme: 'plain', headStyles: { halign: 'center' },
        styles: { fontSize: 8, cellPadding: 1 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        didDrawPage: (hookData) => {
            doc.rect(14, hookData.table.startY - 7, 182, hookData.table.height + 12);
        }
    });

    const legalText = doc.splitTextToSize("Mediante la firma de esta orden de domiciliación, el deudor autoriza (A) al acreedor a enviar instrucciones a la entidad del deudor para adeudar su cuenta y (B) a la entidad para efectuar los adeudos en su cuenta siguiendo las instrucciones del acreedor. Como parte de sus derechos, el deudor está legitimado al reembolso por su entidad en los términos y condiciones del contrato suscrito con la misma. La solicitud de reembolso deberá efectuarse dentro de las ocho semanas que siguen a la fecha de adeudo en cuenta.", 180);
    doc.setFontSize(8);
    doc.text(legalText, 14, doc.autoTable.previous.finalY + 10);
    
    const debtorData = [
        ['Nombre del deudor/es:', data.nombre_empresa || ''],
        ['Dirección del deudor:', data.direccion || ''],
        ['Código postal - Población:', `${data.codigo_postal || ''} ${data.poblacion || ''}`],
        ['País del deudor:', data.pais || ''],
        ['Swift BIC:', data.swift || ''],
        ['Número de cuenta - IBAN:', data.iban || ''],
    ];
    doc.autoTable({
        startY: doc.autoTable.previous.finalY + 30, head: [['A CUMPLIMENTAR POR EL DEUDOR']],
        body: debtorData, theme: 'plain', headStyles: { halign: 'center' },
        styles: { fontSize: 8, cellPadding: 1 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        didDrawPage: (hookData) => {
            doc.rect(14, hookData.table.startY - 7, 182, hookData.table.height + 35);
        }
    });
    
    let finalY = doc.autoTable.previous.finalY;
    doc.setFontSize(9);
    doc.text('Tipo de pago:', 20, finalY + 8);
    
    const isRecurrent = data.tipo_pago_sepa === 'recurrente';
    doc.rect(80, finalY + 5, 4, 4);
    if (isRecurrent) doc.text('X', 81, finalY + 8);
    doc.text('Pago recurrente', 86, finalY + 8);
    
    doc.text('o', 125, finalY + 8);

    doc.rect(130, finalY + 5, 4, 4);
    if (!isRecurrent) doc.text('X', 131, finalY + 8);
    doc.text('Pago único', 136, finalY + 8);
    
    doc.text('Fecha - Localidad:', 20, finalY + 18);
    doc.line(55, finalY + 18, 190, finalY + 18);
    doc.text('Firma del deudor:', 20, finalY + 28);
    doc.line(55, finalY + 28, 190, finalY + 28);

    const fileName = `Mandato_SEPA_${data.nombre_empresa.replace(/ /g, '_') || 'Nuevo_Cliente'}.pdf`;
    doc.save(fileName);
}