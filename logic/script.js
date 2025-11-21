// logic/script.js

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const tariffSelector = document.getElementById('tariffSelector');

let allProducts = [];
let stockMap = new Map();
let currentTariffFile = 'Tarifa_General.json'; 

// --- 1. EXTRAER CANTIDAD MÍNIMA ---
function extractMinQty(text) {
    if (!text || typeof text !== 'string') return 0;
    const t = text.toLowerCase();

    // Patrón A: "120 uds", "100 cj", "50 palets"
    // Buscamos números seguidos de unidades comunes
    const qtyRegex = /(\d+)\s*(uds?|unid|pzs?|pza|cjs?|cajas?|estuches?|palets?)/;
    let match = t.match(qtyRegex);
    if (match) return parseInt(match[1]);

    // Patrón B: "partir de 50", "minimo 50"
    const minRegex = /(?:partir de|min|mínimo)\s*:?\s*(\d+)/;
    match = t.match(minRegex);
    if (match) return parseInt(match[1]);

    // Patrón C: Si solo hay un número entero grande (>=10) y NO parece precio (sin €)
    // Evitamos confundir con "5.20"
    const simpleNumRegex = /\b(\d{2,})\b/; 
    match = t.match(simpleNumRegex);
    if (match) return parseInt(match[0]);

    return 0;
}

// --- 2. EXTRAER PRECIO NETO ---
function extractNetPrice(text) {
    if (!text || typeof text !== 'string') return 0;
    // Buscamos: numero + (coma o punto + digitos opcional) + simbolo euro opcional
    // Ej: 5,50 | 5.5 | 12€ | 12,00
    // Excluimos números que parecen cantidades (enteros seguidos de uds)
    
    // Primero intentamos buscar algo explícito con €
    let match = text.match(/(\d+[.,]?\d*)\s*€/);
    if (match) return parseFloat(match[1].replace(',', '.'));

    // Si no, buscamos decimales flotantes (precios suelen tener decimales)
    match = text.match(/(\d+[.,]\d+)/);
    if (match) return parseFloat(match[0].replace(',', '.'));

    // Si no, buscamos un número al principio si dice "Neto 5"
    // pero con cuidado de no coger la cantidad
    match = text.match(/neto\s*:?\s*(\d+[.,]?\d*)/i);
    if (match) return parseFloat(match[1].replace(',', '.'));

    return 0;
}

async function loadStockData() {
    try {
        const response = await fetch(`src/Stock.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error("No se pudo cargar el Stock");
        const data = await response.json();
        const stockArray = data.Stock || [];
        stockArray.forEach(item => {
            stockMap.set(String(item.Artículo), item);
        });
        console.log("Stock cargado:", stockMap.size, "artículos.");
    } catch (error) {
        console.error('Error cargando el stock:', error);
    }
}

async function loadTariffData(tariffFile) {
    searchInput.placeholder = 'Cargando datos...';
    resultsContainer.innerHTML = '<p style="text-align:center; padding: 2rem;">Cargando productos y stock...</p>';
    const fullPath = `src/${tariffFile}`;
    try {
        const response = await fetch(`${fullPath}?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const dataObject = await response.json();
        const sheetName = Object.keys(dataObject)[0]; 
        allProducts = dataObject[sheetName];
        searchInput.placeholder = 'Buscar por referencia o descripción...';
    } catch (error) {
        searchInput.placeholder = `Error al cargar ${fullPath}.`;
        console.error('Error fetching data:', error);
        allProducts = [];
    }
    searchInput.value = '';
    resultsContainer.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadStockData();
    loadTariffData(currentTariffFile);
});

tariffSelector.addEventListener('change', (event) => {
    currentTariffFile = event.target.value;
    loadTariffData(currentTariffFile);
});

searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    const filteredProducts = allProducts.filter(product => {
        const descripcion = product.Descripcion ? product.Descripcion.toLowerCase() : '';
        const referencia = product.Referencia ? String(product.Referencia).toLowerCase() : '';
        const stockInfo = stockMap.get(String(product.Referencia));
        if (stockInfo && stockInfo.Estado === 'no') return false;
        return descripcion.includes(query) || referencia.includes(query);
    });
    displayResults(filteredProducts);
});

function displayResults(products) {
    if (products.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: var(--subtle-text);">No se encontraron resultados.</p>';
        return;
    }

    let html = '';
    products.forEach((product, index) => {
        // --- 1. PRECIOS ESTÁNDAR ---
        let pvpBase = 0;
        let descuento = 'N/A';
        let precioFinal = 'N/A';
        let precioNetoTexto = 'No aplica'; // Texto original del JSON
        let precioFinalNumerico = 0;

        // Selección de lógica según tarifa
        if (currentTariffFile.includes('General') || currentTariffFile.includes('Bigmat')) {
            descuento = '50%';
            precioFinalNumerico = product.PRECIO_ESTANDAR || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.50;
            if (product.NETOS) precioNetoTexto = product.CONDICIONES_NETO;
        } else if (currentTariffFile.includes('Neopro') || currentTariffFile.includes('Ehlis') || currentTariffFile.includes('Synergas')) {
            descuento = '52%';
            precioFinalNumerico = product.PRECIO_GRUPO1 || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.48;
            precioNetoTexto = 'No aplica';
        } else if (currentTariffFile.includes('Cecofersa')) {
            descuento = '52%';
            precioFinalNumerico = product.PRECIO_CECOFERSA || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.48;
            if (product.NETOS) precioNetoTexto = product.CONDICIONES_NETO;
        } else if (currentTariffFile.includes('Grandes_Cuentas')) {
            descuento = '50%';
            precioFinalNumerico = product.PRECIO_ESTANDAR || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.50;
            if (product.NETOS_GRANDE_CUENTAS) precioNetoTexto = product.CONDICION_NETO_GC;
        } else if (currentTariffFile.includes('Coferdroza')) {
            descuento = '50%';
            precioFinalNumerico = product.PRECIO_GRUPO3 || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.50;
            precioNetoTexto = 'No aplica';
        }
        
        precioFinal = precioFinalNumerico.toFixed(2);

        // --- 2. STOCK ---
        const stockInfo = stockMap.get(String(product.Referencia));
        let stockHtml = '';
        if (stockInfo) {
            const estado = stockInfo.Estado ? stockInfo.Estado.toLowerCase() : '';
            const cantidad = stockInfo.Stock || 0;
            if (estado === 'no') return; 
            if (estado === 'si') {
                if (cantidad > 0) stockHtml = `<div class="stock-badge stock-ok"><span class="icon">✅</span> En stock</div>`;
                else stockHtml = `<div class="stock-badge stock-ko"><span class="icon">❌</span> Sin stock</div>`;
            } else if (estado === 'fab') {
                stockHtml = `<div class="stock-badge stock-fab"><span class="icon">🏭</span> Entrega aprox. 3-5 días.</div>`;
            } else if (estado === 'fab2') {
                stockHtml = `<div class="stock-badge stock-fab"><span class="icon">🏭</span> Entrega aprox. 10-15 días.</div>`;
            }
        } 
        
        // --- 3. EXTRACCIÓN DE DATOS PARA LÓGICA DE PRESUPUESTO ---
        const safeRef = String(product.Referencia || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeDesc = String(product.Descripcion || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeNetoTxt = String(precioNetoTexto || 'No aplica').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        // ¡AQUÍ ESTÁ LA MAGIA! Extraemos los valores numéricos del texto
        const minQty = extractMinQty(precioNetoTexto);
        const netPriceVal = extractNetPrice(precioNetoTexto);
        
        const qtyInputId = `qty_${index}`;

        html += `
            <div class="product-card-single">
                <div class="card-header">
                    <div>
                        <h2>${product.Descripcion || 'Sin descripción'}</h2>
                        <p class="ref-text">Ref: ${product.Referencia || 'N/A'}</p>
                    </div>
                    ${stockHtml}
                </div>
                
                <div class="price-details-grid">
                    <p class="price-line"><strong>PVP Base:</strong> <span>${pvpBase.toFixed(2)} €</span></p>
                    <p class="price-line"><strong>Descuento:</strong> <span>${descuento}</span></p>
                    <p class="price-line"><strong>Precio Final:</strong> <span class="final-price">${precioFinal} €</span></p>
                    <p class="price-line"><strong>Precio Neto:</strong> <span class="neto-price">${precioNetoTexto}</span></p>
                </div>

                <div class="add-controls">
                    <input type="number" id="${qtyInputId}" class="qty-input" value="1" min="1">
                    
                    <!-- Pasamos: Ref, Desc, PrecioStd, Cantidad, TextoNeto, CantMinima, PrecioNeto -->
                    <button class="add-budget-btn" onclick="addToBudget('${safeRef}', '${safeDesc}', ${precioFinal}, document.getElementById('${qtyInputId}').value, '${safeNetoTxt}', ${minQty}, ${netPriceVal})">
                        + Añadir al presupuesto
                    </button>
                </div>
            </div>`;
    });
    resultsContainer.innerHTML = html;
}