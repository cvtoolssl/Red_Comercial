// --- APUNTAMOS AL ARCHIVO LOCAL DENTRO DE LA CARPETA 'src' ---

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const tariffSelector = document.getElementById('tariffSelector');

let allProducts = [];
// Tarifa por defecto (solo el nombre del archivo, la ruta se añade después)
let currentTariffFile = 'Tarifa_General.json'; 

// Función para cargar los datos de una tarifa específica desde la carpeta 'src'
async function loadTariffData(tariffFile) {
    searchInput.placeholder = 'Cargando datos...';
    
    // CORRECCIÓN: Usamos ../ para subir desde 'logic' a la raíz y luego entrar en 'src'
    const fullPath = `../src/${tariffFile}`;

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

// Carga la tarifa por defecto al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadTariffData(currentTariffFile);
});

// Cuando el usuario cambia la tarifa, el 'value' del option es solo el nombre del archivo
tariffSelector.addEventListener('change', (event) => {
    currentTariffFile = event.target.value;
    loadTariffData(currentTariffFile);
});

// La lógica de búsqueda no necesita cambios
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (query.length < 2 || allProducts.length === 0) {
        resultsContainer.innerHTML = '';
        return;
    }
    const filteredProducts = allProducts.filter(product => {
        const descripcion = product.Descripcion ? product.Descripcion.toLowerCase() : '';
        const referencia = product.Referencia ? product.Referencia.toString().toLowerCase() : '';
        return descripcion.includes(query) || referencia.includes(query);
    });
    displayResults(filteredProducts);
});

// La lógica de mostrar resultados no necesita cambios
function displayResults(products) {
    if (products.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: var(--subtle-text);">No se encontraron resultados.</p>';
        return;
    }

    let html = '';
    products.forEach((product) => {
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
        } 
        else if (currentTariffFile.includes('Neopro') || currentTariffFile.includes('Ehlis') || currentTariffFile.includes('Synergas')) {
            descuento = '52%';
            precioFinalNumerico = product.PRECIO_GRUPO1 || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.48;
            precioNeto = 'No aplica';
        } 
        else if (currentTariffFile.includes('Cecofersa')) {
            descuento = '52%';
            precioFinalNumerico = product.PRECIO_CECOFERSA || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.48;
            if (product.NETOS) precioNeto = product.CONDICIONES_NETO;
        }
        else if (currentTariffFile.includes('Grandes_Cuentas')) {
            descuento = '50%';
            precioFinalNumerico = product.PRECIO_ESTANDAR || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.50;
            if (product.NETOS_GRANDE_CUENTAS) precioNeto = product.CONDICION_NETO_GC;
        }
        else if (currentTariffFile.includes('Coferdroza')) {
            descuento = '50%';
            precioFinalNumerico = product.PRECIO_GRUPO3 || 0;
            if (precioFinalNumerico > 0) pvpBase = precioFinalNumerico / 0.50;
            precioNeto = 'No aplica';
        }
        
        precioFinal = precioFinalNumerico.toFixed(2);
        
        html += `
            <div class="product-card-single">
                <h2>${product.Descripcion || 'Sin descripción'}</h2>
                <p>Ref: ${product.Referencia || 'N/A'}</p>
                <div class="price-details-grid">
                    <p class="price-line"><strong>PVP Base:</strong> <span>${pvpBase.toFixed(2)} €</span></p>
                    <p class="price-line"><strong>Descuento:</strong> <span>${descuento}</span></p>
                    <p class="price-line"><strong>Precio Final:</strong> <span class="final-price">${precioFinal} €</span></p>
                    <p class="price-line"><strong>Precio Neto:</strong> <span class="neto-price">${precioNeto}</span></p>
                </div>
            </div>`;
    });
    resultsContainer.innerHTML = html;
}