// logic/presupuesto.js

let budget = [];
const budgetModal = document.getElementById('budget-modal');
const budgetCountSpan = document.getElementById('budget-count');
const budgetItemsContainer = document.getElementById('budget-items-container');

// --- CONFIGURACIÓN ---
const PEDIDO_MINIMO_PORTES = 400; 
const COSTE_PORTES = 12.00;       

// --- FUNCIÓN PRINCIPAL: AÑADIR ---
// Nuevo parámetro al final: netPriceVal (el valor numérico del precio neto)
function addToBudget(ref, desc, stdPrice, qty, netInfo, minQty, netPriceVal) {
    qty = parseInt(qty);
    if (isNaN(qty) || qty < 1) qty = 1;
    
    minQty = parseInt(minQty) || 0;
    netPriceVal = parseFloat(netPriceVal) || 0; // Aseguramos que sea número

    const existingItem = budget.find(item => item.ref === String(ref));

    if (existingItem) {
        existingItem.qty += qty;
        existingItem.netInfo = netInfo; 
        existingItem.minQty = minQty;
        existingItem.netPriceVal = netPriceVal; // Actualizamos el precio neto
    } else {
        budget.push({ 
            ref: String(ref), 
            desc: String(desc), 
            stdPrice: parseFloat(stdPrice), // Precio Estándar
            qty: qty,
            netInfo: netInfo, 
            minQty: minQty,
            netPriceVal: netPriceVal // Precio Neto Opcional
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
    // Por defecto usamos el precio estándar
    let activePrice = item.stdPrice;
    
    // Si hay condición de neto (minQty > 0) Y hay un precio neto válido (> 0)
    // Y la cantidad supera o iguala el mínimo...
    if (item.minQty > 0 && item.netPriceVal > 0 && item.qty >= item.minQty) {
        activePrice = item.netPriceVal;
    }
    
    return {
        unitPrice: activePrice,
        total: activePrice * item.qty,
        isNetApplied: (activePrice === item.netPriceVal && item.minQty > 0)
    };
}

// --- ACTUALIZAR UI ---
function updateBudgetUI() {
    if (budgetCountSpan) budgetCountSpan.textContent = budget.length;

    let subtotal = 0;
    let html = '';

    // Generar lista y calcular subtotal
    budget.forEach((item, index) => {
        const calc = calculateItemTotal(item);
        subtotal += calc.total;
        
        // Lógica Visual (Mensajes)
        let netInfoHtml = '';
        let priceDisplayHtml = '';

        // CASO 1: Tiene condición de neto definida
        if (item.minQty > 0) {
            if (calc.isNetApplied) {
                // Neto Aplicado (VERDE)
                netInfoHtml = `
                    <div style="color:#155724; font-size:0.85em; margin-top:4px; padding:2px 5px; background:#d4edda; border-radius:4px; border:1px solid #c3e6cb;">
                        ✅ <strong>Neto Aplicado: ${item.netPriceVal.toFixed(2)}€</strong><br>
                        (Condición >${item.minQty} uds cumplida)
                    </div>`;
                 // Tachamos el precio anterior
                 priceDisplayHtml = `<span style="text-decoration:line-through; color:#999; font-size:0.8em;">${item.stdPrice.toFixed(2)}€</span> <br> <strong>${item.netPriceVal.toFixed(2)}€</strong>`;
            } else {
                // No llega al mínimo (ROJO)
                netInfoHtml = `
                    <div style="color:#856404; font-size:0.85em; margin-top:4px; padding:2px 5px; background:#fff3cd; border-radius:4px; border:1px solid #ffeeba;">
                        ⚠️ <strong>Precio Neto no aplicado</strong><br>
                        (Pide ${item.minQty} uds para precio ${item.netPriceVal.toFixed(2)}€)
                    </div>`;
                priceDisplayHtml = `${item.stdPrice.toFixed(2)}€`;
            }
        } 
        // CASO 2: Texto informativo sin lógica numérica clara
        else if (item.netInfo && item.netInfo !== 'No aplica' && item.netInfo !== 'undefined') {
            netInfoHtml = `<div style="color:#666; font-size:0.8em; margin-top:2px;">ℹ️ ${item.netInfo}</div>`;
            priceDisplayHtml = `${item.stdPrice.toFixed(2)}€`;
        } 
        // CASO 3: Normal
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

    // Cálculos finales (Portes)
    let costeEnvio = 0;
    if (subtotal < PEDIDO_MINIMO_PORTES && subtotal > 0) {
        costeEnvio = COSTE_PORTES;
    }
    let totalFinal = subtotal + costeEnvio;

    // Renderizar
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
    let text = `📦 *PRESUPUESTO CV TOOLS*\n------------------------------\n`;
    
    budget.forEach(item => {
        const calc = calculateItemTotal(item);
        subtotal += calc.total;

        text += `▪️ *${item.qty} ud.* x ${item.desc}\n`;
        text += `   Ref: ${item.ref}`;
        
        if (item.minQty > 0) {
            if (calc.isNetApplied) {
                text += `\n   ✅ NETO APLICADO (${calc.unitPrice.toFixed(2)}€)`;
            } else {
                 text += `\n   ⚠️ NO APLICA NETO (Pide ${item.minQty})`;
            }
        }
        text += ` -> ${calc.total.toFixed(2)} €\n`;
    });

    let costeEnvio = 0;
    if (subtotal < PEDIDO_MINIMO_PORTES) costeEnvio = COSTE_PORTES;
    let totalFinal = subtotal + costeEnvio;
    
    text += `------------------------------\n`;
    text += `Subtotal: ${subtotal.toFixed(2)} €\n`;
    text += costeEnvio > 0 ? `Portes:   ${costeEnvio.toFixed(2)} €\n` : `Portes:   GRATIS\n`;
    text += `💰 *TOTAL: ${totalFinal.toFixed(2)} €*\n`;
    text += `------------------------------\n(Precios válidos salvo error tipográfico)\n`;

    navigator.clipboard.writeText(text).then(() => {
        alert('¡Pedido copiado! Pégalo en WhatsApp o Email.');
    }).catch(err => {
        alert('No se pudo copiar. Selecciónalo manualmente.');
    });
}

window.onclick = function(event) {
    if (event.target == budgetModal) budgetModal.classList.add('hidden');
}