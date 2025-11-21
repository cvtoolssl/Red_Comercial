// logic/presupuesto.js

// Inicializamos variables
let budget = [];
const budgetModal = document.getElementById('budget-modal');
const budgetCountSpan = document.getElementById('budget-count');
const budgetItemsContainer = document.getElementById('budget-items-container');

// --- CONFIGURACIÓN ---
const PEDIDO_MINIMO_PORTES = 400; 
const COSTE_PORTES = 12.00;       

// --- FUNCIÓN PRINCIPAL: AÑADIR ---
function addToBudget(ref, desc, stdPrice, qty, netInfo, minQty, netPriceVal) {
    qty = parseInt(qty);
    if (isNaN(qty) || qty < 1) qty = 1;
    
    minQty = parseInt(minQty) || 0;
    netPriceVal = parseFloat(netPriceVal) || 0;
    stdPrice = parseFloat(stdPrice) || 0;

    const existingItem = budget.find(item => item.ref === String(ref));

    if (existingItem) {
        existingItem.qty += qty;
        existingItem.netInfo = netInfo; 
        existingItem.minQty = minQty;
        existingItem.netPriceVal = netPriceVal; 
    } else {
        budget.push({ 
            ref: String(ref), 
            desc: String(desc), 
            stdPrice: stdPrice, 
            qty: qty,
            netInfo: netInfo, 
            minQty: minQty,
            netPriceVal: netPriceVal 
        });
    }
    
    updateBudgetUI();
    
    const fab = document.getElementById('budget-fab');
    if(fab) {
        fab.style.transform = 'scale(1.3)';
        setTimeout(() => fab.style.transform = 'scale(1)', 200);
    }
}

function removeFromBudget(index) {
    budget.splice(index, 1);
    updateBudgetUI();
}

function clearBudget() {
    if(confirm('¿Estás seguro de vaciar el presupuesto actual?')) {
        budget = [];
        updateBudgetUI();
        toggleBudgetModal();
    }
}

// --- LÓGICA DE CÁLCULO ---
function calculateItemTotal(item) {
    let activePrice = item.stdPrice;
    let isNetApplied = false;
    
    if (item.minQty > 0 && item.netPriceVal > 0 && item.qty >= item.minQty) {
        activePrice = item.netPriceVal;
        isNetApplied = true;
    }
    
    return {
        unitPrice: activePrice,
        total: activePrice * item.qty,
        isNetApplied: isNetApplied
    };
}

// --- ACTUALIZAR UI ---
function updateBudgetUI() {
    if (budgetCountSpan) budgetCountSpan.textContent = budget.length;

    let subtotal = 0;
    let html = '';

    budget.forEach((item, index) => {
        const calc = calculateItemTotal(item);
        subtotal += calc.total;
        
        let netInfoHtml = '';
        let priceDisplayHtml = '';

        if (item.minQty > 0 && item.netPriceVal > 0) {
            if (calc.isNetApplied) {
                netInfoHtml = `
                    <div style="color:#155724; font-size:0.8em; margin-top:2px; padding:2px 5px; background:#d4edda; border-radius:4px; border:1px solid #c3e6cb;">
                        ✅ <strong>Neto: ${item.netPriceVal.toFixed(2)}€</strong> (>${item.minQty} uds)
                    </div>`;
                 priceDisplayHtml = `<span style="text-decoration:line-through; color:#999; font-size:0.8em;">${item.stdPrice.toFixed(2)}€</span> <br> <strong>${item.netPriceVal.toFixed(2)}€</strong>`;
            } else {
                netInfoHtml = `
                    <div style="color:#856404; font-size:0.8em; margin-top:2px; padding:2px 5px; background:#fff3cd; border-radius:4px; border:1px solid #ffeeba;">
                        ⚠️ Pide ${item.minQty} para neto a ${item.netPriceVal.toFixed(2)}€
                    </div>`;
                priceDisplayHtml = `${item.stdPrice.toFixed(2)}€`;
            }
        } 
        else if (item.netInfo && item.netInfo !== 'No aplica') {
            netInfoHtml = `<div style="color:#666; font-size:0.8em; margin-top:2px;">ℹ️ ${item.netInfo}</div>`;
            priceDisplayHtml = `${item.stdPrice.toFixed(2)}€`;
        } 
        else {
            priceDisplayHtml = `${item.stdPrice.toFixed(2)}€`;
        }

        html += `
            <div class="budget-item">
                <div class="budget-item-info">
                    <strong>${item.desc}</strong><br>
                    <span style="color:#666; font-size:0.8em">Ref: ${item.ref}</span>
                    ${netInfoHtml}
                </div>
                <div style="text-align:right; min-width: 100px;">
                    <div style="font-size:0.9em; color:#555;">
                        ${item.qty} x ${priceDisplayHtml}
                    </div>
                    <div class="budget-item-price">${calc.total.toFixed(2)} €</div>
                </div>
                <button class="remove-btn" onclick="removeFromBudget(${index})">&times;</button>
            </div>
        `;
    });

    let costeEnvio = 0;
    if (subtotal < PEDIDO_MINIMO_PORTES && subtotal > 0) {
        costeEnvio = COSTE_PORTES;
    }
    let totalFinal = subtotal + costeEnvio;

    if (budgetItemsContainer) {
        if (budget.length === 0) {
            budgetItemsContainer.innerHTML = '<p class="empty-msg">No hay productos en el presupuesto.</p>';
            const totalDisplay = document.querySelector('.total-display');
            if(totalDisplay) totalDisplay.innerHTML = 'Total: 0.00 €';
        } else {
            budgetItemsContainer.innerHTML = html;
            const totalDisplay = document.querySelector('.total-display');
            if (totalDisplay) {
                let htmlTotales = `<div style="font-size:0.9rem; text-align:right; margin-bottom:5px;">Subtotal: ${subtotal.toFixed(2)} €</div>`;
                if (costeEnvio > 0) {
                    htmlTotales += `<div style="font-size:0.9rem; text-align:right; color:#d9534f; margin-bottom:5px;">+ Portes: ${costeEnvio.toFixed(2)} €</div>`;
                    htmlTotales += `<div style="font-size:0.8rem; text-align:right; color:#999;">(Portes gratis a partir de ${PEDIDO_MINIMO_PORTES}€)</div>`;
                } else {
                     htmlTotales += `<div style="font-size:0.9rem; text-align:right; color:#28a745; margin-bottom:5px;">Portes: GRATIS</div>`;
                }
                htmlTotales += `<div class="budget-total-line"><span>TOTAL:</span> <span>${totalFinal.toFixed(2)} €</span></div>`;
                htmlTotales += `<div style="font-size:0.8rem; text-align:right; color:#666; margin-top:5px;">(Precios sin IVA)</div>`;
                totalDisplay.innerHTML = htmlTotales;
                totalDisplay.style.display = 'block'; 
            }
        }
    }
}

function toggleBudgetModal() {
    if (budgetModal) budgetModal.classList.toggle('hidden');
}

// --- WHATSAPP ---
function copyBudgetToClipboard() {
    if (budget.length === 0) return;

    let subtotal = 0;
    const fichasUrl = "https://pablo2vbng.github.io/preciosCVTools/fichas.html"; 

    let text = `📑 *PRESUPUESTO - CV TOOLS*\n`;
    text += `📅 Fecha: ${new Date().toLocaleDateString()}\n`;
    text += `--------------------------------\n\n`;
    
    budget.forEach(item => {
        const calc = calculateItemTotal(item);
        subtotal += calc.total;

        text += `🔹 *${item.desc}*\n`;
        text += `   Ref: ${item.ref}\n`;
        text += `   Cant: ${item.qty} x ${calc.unitPrice.toFixed(2)} €`;
        if (calc.isNetApplied) text += ` (Precio Neto)`;
        text += `\n   *Subtotal: ${calc.total.toFixed(2)} €*\n\n`;
    });

    let costeEnvio = 0;
    if (subtotal < PEDIDO_MINIMO_PORTES) costeEnvio = COSTE_PORTES;
    let totalFinal = subtotal + costeEnvio;
    
    text += `--------------------------------\n`;
    text += `Subtotal:      ${subtotal.toFixed(2)} €\n`;
    text += costeEnvio > 0 ? `Portes:        ${costeEnvio.toFixed(2)} €\n` : `Portes:        GRATIS\n`;
    text += `\n💰 *TOTAL: ${totalFinal.toFixed(2)} €*\n`;
    text += `*(Precios sin IVA)*\n`;
    text += `--------------------------------`;

    navigator.clipboard.writeText(text).then(() => {
        alert('¡Presupuesto copiado al portapapeles!');
    }).catch(err => {
        alert('No se pudo copiar. Selecciónalo manualmente.');
    });
}

// --- NUEVA FUNCIÓN: DESCARGAR PDF ---
function downloadBudgetPdf() {
    if (budget.length === 0) {
        alert("El presupuesto está vacío.");
        return;
    }
    
    // Necesitamos jsPDF cargado en el HTML
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // 1. CABECERA
    const logoImg = document.getElementById('logo-for-pdf');
    if (logoImg && logoImg.src) {
        try { doc.addImage(logoImg, 'PNG', 14, 10, 40, 10); } catch(e){}
    }
    
    doc.setFontSize(18);
    doc.text('PRESUPUESTO', 195, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 195, 26, { align: 'right' });
    
    // 2. PREPARAR DATOS PARA TABLA
    let subtotal = 0;
    const tableBody = budget.map(item => {
        const calc = calculateItemTotal(item);
        subtotal += calc.total;
        
        // Descripción con aviso si es neto
        let descText = item.desc;
        if (calc.isNetApplied) {
            descText += `\n(Precio Neto aplicado por volumen > ${item.minQty})`;
        }
        
        return [
            item.ref,
            descText,
            item.qty,
            `${calc.unitPrice.toFixed(2)} €`,
            `${calc.total.toFixed(2)} €`
        ];
    });
    
    // 3. GENERAR TABLA
    doc.autoTable({
        startY: 35,
        head: [['Ref.', 'Descripción', 'Cant.', 'Precio Ud.', 'Total']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [0, 122, 255] }, // Azul CV Tools
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' }
        }
    });
    
    // 4. CÁLCULO DE TOTALES (PORTES)
    let finalY = doc.lastAutoTable.finalY + 10;
    let costeEnvio = 0;
    if (subtotal < PEDIDO_MINIMO_PORTES) costeEnvio = COSTE_PORTES;
    let totalFinal = subtotal + costeEnvio;
    
    // 5. BLOQUE DE TOTALES
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 160, finalY, { align: 'right' });
    doc.text(`${subtotal.toFixed(2)} €`, 195, finalY, { align: 'right' });
    
    finalY += 6;
    doc.text(`Portes:`, 160, finalY, { align: 'right' });
    if (costeEnvio > 0) {
        doc.text(`${costeEnvio.toFixed(2)} €`, 195, finalY, { align: 'right' });
    } else {
        doc.setTextColor(0, 150, 0); // Verde
        doc.text(`GRATIS`, 195, finalY, { align: 'right' });
        doc.setTextColor(0, 0, 0); // Reset color
    }
    
    finalY += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL:`, 160, finalY, { align: 'right' });
    doc.text(`${totalFinal.toFixed(2)} €`, 195, finalY, { align: 'right' });
    
    finalY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`(Precios sin IVA)`, 195, finalY, { align: 'right' });
    
    // 6. PIE DE PÁGINA
    doc.setFontSize(8);
    doc.text('Presupuesto válido salvo error tipográfico. Condiciones según tarifa vigente.', 14, 280);
    
    // Descargar
    doc.save(`Presupuesto_CVTools_${new Date().toLocaleDateString().replace(/\//g,'-')}.pdf`);
}

window.onclick = function(event) {
    if (event.target == budgetModal) budgetModal.classList.add('hidden');
}