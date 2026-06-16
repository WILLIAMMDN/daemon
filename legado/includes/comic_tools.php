<div class="tools-sidebar shadow-lg">
    
    <div id="propiedadesGlobo" class="p-3 bg-secondary bg-opacity-25 border-bottom border-secondary" style="display:none;">
        <h6 class="text-warning fw-bold mb-2"><i class="bi bi-sliders me-2"></i>EDITAR TEXTO</h6>
        
        <label class="small text-white-50 mb-1">Tamaño de Letra:</label>
        <div class="d-flex align-items-center gap-2">
            <i class="bi bi-fonts small"></i>
            <input type="range" class="form-range flex-grow-1" min="10" max="40" step="1" id="fontSizeSlider" oninput="cambiarTamanoTexto(this.value)">
            <span id="fontSizeVal" class="badge bg-dark">16px</span>
        </div>
    </div>

    <div class="p-3 border-bottom border-secondary bg-dark">
        <h6 class="text-white fw-bold m-0"><i class="bi bi-chat-quote-fill me-2"></i>TIPOS DE GLOBO</h6>
    </div>
    <div class="p-3 d-grid gap-2" style="grid-template-columns: 1fr 1fr;">
        <div class="tool-item bg-white text-dark border border-dark rounded-3 p-2 text-center" draggable="true" ondragstart="dragBubble(event, 'normal')">
            <i class="bi bi-chat-square-text fs-4"></i><div class="small fw-bold">Normal</div>
        </div>
        <div class="tool-item bg-light text-primary border border-primary rounded-circle p-2 text-center" draggable="true" ondragstart="dragBubble(event, 'thought')" style="border-style: dashed !important;">
            <i class="bi bi-cloud fs-4"></i><div class="small fw-bold">Pensar</div>
        </div>
        <div class="tool-item bg-danger text-white border border-white p-2 text-center" draggable="true" ondragstart="dragBubble(event, 'shout')" style="clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);">
            <i class="bi bi-megaphone-fill fs-4"></i><div class="small fw-bold">¡Grito!</div>
        </div>
        <div class="tool-item bg-warning text-dark border border-dark p-2 text-center" draggable="true" ondragstart="dragBubble(event, 'box')">
            <i class="bi bi-sticky-fill fs-4"></i><div class="small fw-bold">Narrador</div>
        </div>
    </div>

    <div class="p-3 border-bottom border-secondary bg-dark mt-2">
        <h6 class="text-white fw-bold m-0"><i class="bi bi-images me-2"></i>IMÁGENES</h6>
    </div>
    <div class="p-3">
        <div class="border border-secondary border-dashed rounded p-2 text-center pointer hover-bg-dark mb-3" onclick="document.getElementById('uploadInput').click()" style="cursor: pointer;">
            <i class="bi bi-cloud-upload fs-3 text-warning"></i>
            <p class="small text-white-50 m-0">Subir Imagen</p>
        </div>
        <input type="file" id="uploadInput" hidden accept="image/*" onchange="subirImagen(this)">
        <div class="asset-grid" id="assetsGrid"></div>
    </div>
</div>

<script>
    // ARRASTRAR Y SOLTAR (Igual que antes)
    function dragBubble(ev, type) { ev.dataTransfer.setData("bubbleType", type); ev.dataTransfer.setData("type", "bubble"); }
    
    function subirImagen(input) {
        if (input.files && input.files[0]) {
            let formData = new FormData();
            formData.append('file', input.files[0]);
            fetch('upload_asset.php', { method: 'POST', body: formData })
            .then(res => res.text()).then(ruta => { if(ruta) agregarAlSidebar(ruta); });
        }
    }
    function agregarAlSidebar(ruta) {
        let img = document.createElement('img'); img.src = ruta; img.className = 'asset-item'; img.draggable = true;
        img.ondragstart = function(ev) { ev.dataTransfer.setData("src", ev.target.src); ev.dataTransfer.setData("type", "image"); };
        document.getElementById('assetsGrid').prepend(img);
    }
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll('.panel-bg').forEach(img => {
            if(img.getAttribute('src') && img.getAttribute('src') !== 'img/placeholder.png') agregarAlSidebar(img.getAttribute('src'));
        });
    });
</script>