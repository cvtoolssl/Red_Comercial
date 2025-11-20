// logic/presupuesto.js

let budget = [];
const budgetModal = document.getElementById('budget-modal');
const budgetCountSpan = document.getElementById('budget-count');
const budgetItemsContainer = document.getElementById('budget-items-container');

// --- CONFIGURACIÓN ---
const PEDIDO_MINIMO_PORTES = 400; // Umbral para portes gratis
const COSTE_PORTES = 12.00;       // CORREGIDO: Portes a 12€

// --- FUNCIÓN PRINCIPAL: AÑADIR ---
// ref, desc, price, qty, netInfo (texto), minQty (número)
function addToBudget(ref, desc, price, qty, netInfo, minQty) {
    // Aseguramos que qty sea al menos 1
    qty = parseInt(qty);
    if (isNaN(qty) || qty < 1) qty = 1;
    
    // Aseguramos que minQty sea un número (si no hay, es 0)
    minQty = parseInt(minQty) || 0;

    // Comprobamos si el producto YA existe en el presupuesto
    const existingItem = budget.find(item => item.ref === String(ref));

    if (existingItem) {
        existingItem.qty += qty;
        // Actualizamos la info de neto por si acaso
        existingItem.netInfo = netInfo; 
        existingItem.minQty = minQty;
    } else {
        budget.push({ 
            ref: String(ref), 
            desc: String(desc), 
            price: parseFloat(price),
            qty: qty,
            netInfo: netInfo, 
            minQty: minQty
        });
    }
    
    updateBudgetUI();
    
    // Feedback visual (animación botón flotante)
    const fab = document.getElementById('budget-fab');
    if(fab) {
        fab.style.transform = 'scale(1.3)';
        setTimeout(() => fab.style.transform = 'scale(1)', 200);
    }
}

// --- ELIMINAR UN ÍTEM ---
function removeFromBudget(index) {
    budget.splice(index, 1);
    updateBudgetUI();
}

// --- VACIAR TODO ---
function clearBudget() {
    if(confirm('¿Estás seguro de vaciar el presupuesto actual?')) {
        budget = [];
        updateBudgetUI();
        toggleBudgetModal();
    }
}

// --- ACTUALIZAR LA INTERFAZ (UI) Y CÁLCULOS ---
function updateBudgetUI() {
    // 1. Actualizar contador
    if (budgetCountSpan) budgetCountSpan.textContent = budget.length;

    // 2. Cálculos económicos
    let subtotal = 0;
    budget.forEach(item => {
        subtotal += (item.price * item.qty);
    });

    let costeEnvio = 0;
    if (subtotal < PEDIDO_MINIMO_PORTES && subtotal > 0) {
        costeEnvio = COSTE_PORTES;
    }

    let totalFinal = subtotal + costeEnvio;

    // 3. Renderizar lista visual
    if (!budgetItemsContainer) return;

    if (budget.length === 0) {
        budgetItemsContainer.innerHTML = '<p class="empty-msg">No hay productos en el presupuesto.</p>';
        const totalDisplay = document.querySelector('.total-display');
        if(totalDisplay) totalDisplay.innerHTML = 'Total: 0.00 €';
        return;
    }

    let html = '';
    budget.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        
        // LÓGICA DE NETO / CANTIDAD MÍNIMA
        let netInfoHtml = '';
        
        // Solo mostramos avisos si hay una condición de neto (minQty > 0)
        if (item.minQty > 0) {
            if (item.qty < item.minQty) {
                // NO CUMPLE: Mensaje ROJO
                netInfoHtml = `
                    <div style="color:#dc3545; font-size:0.85em; margin-top:4px; padding:2px 5px; background:#fff5f5; border-radius:4px; border:1px solid #ffcdd2;">
                        ⚠️ <strong>Cantidad insuficiente para Neto</strong><br>
                        (Necesitas ${item.minQty} uds. Tienes ${item.qty})
                    </div>`;
            } else {
                // SÍ CUMPLE: Mensaje VERDE
                netInfoHtml = `
                    <div style="color:#155724; font-size:0.85em; margin-top:4px; padding:2px 5px; background:#d4edda; border-radius:4px; border:1px solid #c3e6cb;">
                        ✅ <strong>Precio Neto Aplicado</strong><br>
                        (Condición cumplida: >${item.minQty} uds)
                    </div>`;
            }
        } else if (item.netInfo && item.netInfo !== 'No aplica' && item.netInfo !== 'undefined') {
            // Si hay texto pero no pudimos sacar el número, mostramos el texto en gris (informativo)
            netInfoHtml = `<div style="color:#666; font-size:0.8em; margin-top:2px;">ℹ️ ${item.netInfo}</div>`;
        }

        html += `
            <div class="budget-item">
                <div class="budget-item-info">
                    <strong>${item.desc}</strong><br>
                    <span style="color:#666; font-size:0.8em">Ref: ${item.ref}</span>
                    ${netInfoHtml}
                </div>
                <div style="text-align:right; min-width: 90px;">
                    <div style="font-size:0.9em; color:#555;">${item.qty} x ${item.price.toFixed(2)}€</div>
                    <div class="budget-item-price">${itemTotal.toFixed(2)} €</div>
                </div>
                <button class="remove-btn" onclick="removeFromBudget(${index})">&times;</button>
            </div>
        `;
    });
    
    budgetItemsContainer.innerHTML = html;

    // 4. Footer
    const totalDisplay = document.querySelector('.total-display');
    if (totalDisplay) {
        let htmlTotales = `
            <div style="font-size:0.9rem; text-align:right; margin-bottom:5px;">Subtotal: ${subtotal.toFixed(2)} €</div>
        `;
        
        if (costeEnvio > 0) {
            htmlTotales += `<div style="font-size:0.9rem; text-align:right; color:#d9534f; margin-bottom:5px;">+ Portes: ${costeEnvio.toFixed(2)} €</div>`;
            htmlTotales += `<div style="font-size:0.8rem; text-align:right; color:#999;">(Portes gratis a partir de ${PEDIDO_MINIMO_PORTES}€)</div>`;
        } else {
             htmlTotales += `<div style="font-size:0.9rem; text-align:right; color:#28a745; margin-bottom:5px;">Portes: GRATIS</div>`;
        }

        htmlTotales += `<div class="budget-total-line"><span>TOTAL:</span> <span>${totalFinal.toFixed(2)} €</span></div>`;
        totalDisplay.innerHTML = htmlTotales;
        totalDisplay.style.display = 'block'; 
    }
}

// --- MODAL ---
function toggleBudgetModal() {
    if (budgetModal) {
        budgetModal.classList.toggle('hidden');
    }
}

// --- WHATSAPP ---
function copyBudgetToClipboard() {
    if (budget.length === 0) return;

    let subtotal = 0;
    budget.forEach(item => subtotal += (item.price * item.qty));
    
    let costeEnvio = 0;
    if (subtotal < PEDIDO_MINIMO_PORTES) costeEnvio = COSTE_PORTES;
    let totalFinal = subtotal + costeEnvio;

    let text = `📦 *Presupuesto CV TOOLS*\n`;
    text += `------------------------------\n`;
    
    budget.forEach(item => {
        let lineaTotal = item.price * item.qty;
        text += `▪️ *${item.qty} ud.* x ${item.desc}\n`;
        text += `   Ref: ${item.ref}`;
        
        // INFO NETOS EN WHATSAPP
        if (item.minQty > 0) {
            if (item.qty < item.minQty) {
                text += `\n   ⚠️ CANTIDAD BAJA PARA NETO (Min: ${item.minQty})`;
            } else {
                text += `\n   ✅ APLICA PRECIO NETO`;
            }
        }
        
        text += ` -> ${lineaTotal.toFixed(2)} €\n`;
    });
    
    text += `------------------------------\n`;
    text += `Subtotal: ${subtotal.toFixed(2)} €\n`;
    
    if (costeEnvio > 0) {
        text += `Portes:   ${costeEnvio.toFixed(2)} €\n`;
    } else {
        text += `Portes:   GRATIS\n`;
    }
    
    text += `💰 *TOTAL: ${totalFinal.toFixed(2)} €*\n`;
    text += `------------------------------\n`;
    text += `(Precios válidos salvo error tipográfico)\n`;

    navigator.clipboard.writeText(text).then(() => {
        alert('¡Pedido copiado! Pégalo en WhatsApp o Email.');
    }).catch(err => {
        console.error('Error al copiar: ', err);
        alert('No se pudo copiar. Selecciónalo manualmente.');
    });
}

window.onclick = function(event) {
    if (event.target == budgetModal) {
        budgetModal.classList.add('hidden');
    }
}