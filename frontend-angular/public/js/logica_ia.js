/* js/logica_final.js */

let brain;
let video = document.getElementById('video');
let canvas = document.getElementById('pixelCanvas');
let ctx = canvas.getContext('2d');
let status = document.getElementById('debug');
let isTraining = false;
let timer = null;
let counts = { A: 0, B: 0, Fondo: 0 };

// CONFIGURACIÓN CLAVE PARA OFFLINE
// 32 ancho * 32 alto * 4 colores (R,G,B,Alpha) = 4096 neuronas de entrada
const INPUT_SIZE = 32;
const TOTAL_PIXELS = INPUT_SIZE * INPUT_SIZE * 4; 

window.onload = function() {
    if (typeof ml5 === 'undefined') {
        alert("ERROR: No encuentro js/ml5.min.js");
        return;
    }

    // 1. INICIAR CÁMARA
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        status.innerText = "Cámara lista. Creando cerebro...";
        
        // 2. CREAR CEREBRO INMEDIATAMENTE
        iniciarCerebro();
    })
    .catch(err => {
        alert("Error de cámara: " + err.name + "\n\n¿Habilitaste 'Insecure origins' en chrome://flags?");
        status.innerText = "ERROR DE CÁMARA";
    });
};

function iniciarCerebro() {
    // Definimos la estructura exacta para que NO descargue nada
    const options = {
        inputs: TOTAL_PIXELS, // Entrada numérica cruda
        outputs: 3,           // Salidas (A, B, Fondo)
        task: 'classification',
        debug: false          // Desactivar debug visual para evitar cargas extra
    };

    brain = ml5.neuralNetwork(options);
    status.innerText = "SISTEMA LISTO. 100% OFFLINE.";
    status.style.color = "#0f0";
}

// --- GRABACIÓN ---
function grabar(etiqueta) {
    if(isTraining) return;
    agregarDato(etiqueta);
    timer = setInterval(() => agregarDato(etiqueta), 100); // Ráfaga rápida
}

function parar() {
    clearInterval(timer);
}

function agregarDato(etiqueta) {
    // Dibujamos el video en el canvas pequeño
    ctx.drawImage(video, 0, 0, INPUT_SIZE, INPUT_SIZE);
    
    // Obtenemos los datos crudos de los píxeles (Array de números)
    // Esto evita que ML5 intente procesar imágenes internamente
    brain.addData({ image: canvas }, { label: etiqueta });

    // Actualizar contadores
    counts[etiqueta]++;
    if(etiqueta === 'A') document.getElementById('cA').innerText = counts.A;
    if(etiqueta === 'B') document.getElementById('cB').innerText = counts.B;
    if(etiqueta === 'Fondo') document.getElementById('cC').innerText = counts.Fondo;
}

// --- ENTRENAMIENTO ---
function entrenar() {
    if (counts.A < 10 || counts.B < 10 || counts.Fondo < 10) {
        alert("¡FALTAN DATOS! Toma al menos 10 fotos de cada uno.");
        return;
    }

    isTraining = true;
    status.innerText = "Entrenando en TU procesador...";
    document.getElementById('btnTrain').disabled = true;

    // Normalizar (Pone los números entre 0 y 1)
    brain.normalizeData();

    // Entrenar
    const trainingOptions = {
        epochs: 50,
        batchSize: 12
    };

    brain.train(trainingOptions, whileTraining, finishedTraining);
}

function whileTraining(epoch, loss) {
    console.log(`Epoch: ${epoch}`);
}

function finishedTraining() {
    status.innerText = "¡CEREBRO ENTRENADO!";
    document.getElementById('btnTrain').innerText = "IA ACTIVA";
    document.getElementById('btnTrain').style.background = "lime";
    
    clasificar();
}

// --- PREDICCIÓN ---
function clasificar() {
    // Actualizar la vista de la IA
    ctx.drawImage(video, 0, 0, INPUT_SIZE, INPUT_SIZE);
    
    // Predecir
    brain.classify({ image: canvas }, (error, results) => {
        if (error) return;
        
        let etiqueta = results[0].label;
        let confianza = Math.floor(results[0].confidence * 100);
        
        let texto = document.getElementById('resultado');
        texto.innerText = `${etiqueta} (${confianza}%)`;
        
        // Cambiar color según resultado
        if(etiqueta === 'A') texto.style.color = "#e74c3c";
        if(etiqueta === 'B') texto.style.color = "#2ecc71";
        if(etiqueta === 'Fondo') texto.style.color = "#3498db";

        // Bucle infinito
        requestAnimationFrame(clasificar);
    });
}