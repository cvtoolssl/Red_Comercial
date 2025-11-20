// logic/presupuesto.js

let budget = [];
const budgetModal = document.getElementById('budget-modal');
const budgetCountSpan = document.getElementById('budget-count');
const budgetItemsContainer = document.getElementById('budget-items-container');

// --- CONFIGURACIÓN ---
const PEDIDO_MINIMO_PORTES = 400; // Umbral para portes gratis
const COSTE_PORTES = 12.00;       // CORREGIDO: Precio de los portes (antes 15)

// --- FUNCIÓN PRINCIPAL: AÑADIR ---
// Ahora acepta un 5º parámetro: netInfo (la condición de precio neto)
function addToBudget(ref, desc, price, qty, netInfo) {
    // Aseguramos que qty sea al menos 1
    qty = parseInt(qty);
    if (isNaN(qty) || qty < 1) qty = 1;

    // Comprobamos si el producto YA existe en el presupuesto
    const existingItem = budget.find(item => item.ref === String(ref));

    if (existingItem) {
        existingItem.qty += qty;
        // Actualizamos la info de neto por si ha cambiado (raro, pero posible)
        existingItem.netInfo = netInfo; 
    } else {
        budget.push({ 
            ref: String(ref), 
            desc: String(desc), 
            price: parseFloat(price),
            qty: qty,
            netInfo: netInfo // Guardamos la info del neto (ej: "Neto para 100 uds")
        });
    }
    
    updateBudgetUI();
    
    // Feedback visual
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

    // 3. Renderizar lista visual en el modal
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
        
        // Lógica visual para Netos
        let netInfoHtml = '';
        if (item.netInfo && item.netInfo !== 'No aplica' && item.netInfo !== 'undefined') {
            netInfoHtml = `<div style="color:#d9534f; font-size:0.8em; margin-top:2px;">⚠️ ${item.netInfo}</div>`;
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

    // 4. Renderizar TOTALES y PORTES en el Footer
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

// --- ABRIR/CERRAR MODAL ---
function toggleBudgetModal() {
    if (budgetModal) {
        budgetModal.classList.toggle('hidden');
    }
}

// --- COPIAR A PORTAPAPELES (WHATSAPP) ---
function copyBudgetToClipboard() {
    if (budget.length === 0) return;

    let subtotal = 0;
    budget.forEach(item => subtotal += (item.price * item.qty));
    
    let costeEnvio = 0;
    if (subtotal < PEDIDO_MINIMO_PORTES) costeEnvio = COSTE_PORTES;
    let totalFinal = subtotal + costeEnvio;

    let text = `📦 *PEDIDO CV TOOLS*\n`;
    text += `------------------------------\n`;
    
    budget.forEach(item => {
        let lineaTotal = item.price * item.qty;
        text += `▪️ *${item.qty} ud.* x ${item.desc}\n`;
        text += `   Ref: ${item.ref}`;
        
        // Si hay condición de neto, la añadimos al mensaje
        if (item.netInfo && item.netInfo !== 'No aplica' && item.netInfo !== 'undefined') {
            text += `\n   ⚠️ ${item.netInfo}`;
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
    
    text += `💰 *TOTAL A PAGAR: ${totalFinal.toFixed(2)} €*\n`;
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