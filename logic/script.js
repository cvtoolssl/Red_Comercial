// logic/script.js

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const tariffSelector = document.getElementById('tariffSelector');

let allProducts = [];
let stockMap = new Map();
let currentTariffFile = 'Tarifa_General.json'; 

// --- EXTRAER CANTIDAD MÍNIMA (Ej: "Neto 120 uds" -> 120) ---
function extractMinQty(text) {
    if (!text || typeof text !== 'string') return 0;
    const lowerText = text.toLowerCase();
    let match = lowerText.match(/(\d+)\s*(ud|unid|pz|pza|cj|caja|estuche)/);
    if (match) return parseInt(match[1]);
    match = lowerText.match(/(?:partir de|minimo|mínimo|min)\s*(\d+)/);
    if (match) return parseInt(match[1]);
    match = lowerText.match(/\b(\d+)\b/);
    if (match && parseInt(match[0]) > 1) return parseInt(match[0]);
    return 0;
}

// --- EXTRAER PRECIO NETO (Ej: "5,50€ neto" -> 5.50) ---
function extractNetPrice(text) {
    if (!text || typeof text !== 'string') return 0;
    // Busca número con decimales (coma o punto)
    // Ej: 5,50 o 5.50 o 12
    // Regex simplificado que busca "digitos + separador opcional + digitos"
    const match = text.match(/(\d+[.,]?\d*)/);
    if (match) {
        // Reemplaza coma por punto para que JS lo entienda
        const normalized = match[0].replace(',', '.');
        return parseFloat(normalized);
    }
    return 0;
}

// 1. Carga de Stock
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

// 2. Carga de Tarifa
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
        let pvpBase = 0;
        let descuento = 'N/A';
        let precioFinal = 'N/A';
        let precioNeto = 'No aplica';
        let precioFinalNumerico = 0;

        if (currentTariffFile.includes('General') || currentTariffFile.includes('Bigmat')) {
            descuento = '50%';
            precioFinalNumerico = product.PRECIO_ESTANDAR || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.50;
            if (product.NETOS) precioNeto = product.CONDICIONES_NETO;
        } else if (currentTariffFile.includes('Neopro') || currentTariffFile.includes('Ehlis') || currentTariffFile.includes('Synergas')) {
            descuento = '52%';
            precioFinalNumerico = product.PRECIO_GRUPO1 || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.48;
            precioNeto = 'No aplica';
        } else if (currentTariffFile.includes('Cecofersa')) {
            descuento = '52%';
            precioFinalNumerico = product.PRECIO_CECOFERSA || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.48;
            if (product.NETOS) precioNeto = product.CONDICIONES_NETO;
        } else if (currentTariffFile.includes('Grandes_Cuentas')) {
            descuento = '50%';
            precioFinalNumerico = product.PRECIO_ESTANDAR || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.50;
            if (product.NETOS_GRANDE_CUENTAS) precioNeto = product.CONDICION_NETO_GC;
        } else if (currentTariffFile.includes('Coferdroza')) {
            descuento = '50%';
            precioFinalNumerico = product.PRECIO_GRUPO3 || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.50;
            precioNeto = 'No aplica';
        }
        
        precioFinal = precioFinalNumerico.toFixed(2);

        // Stock
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
        
        const safeRef = String(product.Referencia || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeDesc = String(product.Descripcion || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeNeto = String(precioNeto || 'No aplica').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        // Extracción de datos para la lógica
        const minQty = extractMinQty(precioNeto);
        const netPriceVal = extractNetPrice(precioNeto);
        
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
                    <p class="price-line"><strong>Precio Neto:</strong> <span class="neto-price">${precioNeto}</span></p>
                </div>

                <div class="add-controls">
                    <input type="number" id="${qtyInputId}" class="qty-input" value="1" min="1">
                    
                    <!-- PASAMOS 7 PARÁMETROS AHORA -->
                    <button class="add-budget-btn" onclick="addToBudget('${safeRef}', '${safeDesc}', ${precioFinal}, document.getElementById('${qtyInputId}').value, '${safeNeto}', ${minQty}, ${netPriceVal})">
                        + Añadir al presupuesto
                    </button>
                </div>
            </div>`;
    });
    resultsContainer.innerHTML = html;
}