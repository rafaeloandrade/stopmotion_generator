const uploadInput = document.getElementById("imageUpload");
const frameTimeInput = document.getElementById("frameTime");
const previewCanvas = document.getElementById("previewCanvas");
const ctx = previewCanvas.getContext("2d");
const generateBtn = document.getElementById("generateVideo");
const downloadLink = document.getElementById("downloadLink");

const fitMode = document.getElementById("fitMode");
const bgColorInput = document.getElementById("bgColor");

const enableGlitch = document.getElementById("enableGlitch");
const glitchOffsetX = document.getElementById("glitchOffsetX");
const glitchOffsetY = document.getElementById("glitchOffsetY");
const glitchRGB = document.getElementById("glitchRGB");
const glitchNoise = document.getElementById("glitchNoise");
const glitchScan = document.getElementById("glitchScan");
const glitchPixel = document.getElementById("glitchPixel");
const glitchBrightness = document.getElementById("glitchBrightness");
const glitchSaturation = document.getElementById("glitchSaturation");

let images = [];
let currentFrame = 0;
let previewInterval;

uploadInput.addEventListener("change", async (e) => {
  images = [];
  const files = Array.from(e.target.files);
  for (const file of files) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => (img.onload = resolve));
    images.push(img);
  }
  if (images.length > 0) {
    setupCanvas();
    startPreview();
  }
});

function setupCanvas() {
  if (images.length > 0) {
    previewCanvas.width = images[0].naturalWidth * 1.15;
    previewCanvas.height = images[0].naturalHeight * 1.15;
  }
}

function drawImageWithFit(img) {
  ctx.fillStyle = bgColorInput.value;
  ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

  let imgAspect = img.width / img.height;
  let canvasAspect = previewCanvas.width / previewCanvas.height;
  let renderWidth, renderHeight, x, y;

  if (fitMode.value === "contain") {
    if (imgAspect > canvasAspect) {
      renderWidth = previewCanvas.width;
      renderHeight = renderWidth / imgAspect;
    } else {
      renderHeight = previewCanvas.height;
      renderWidth = renderHeight * imgAspect;
    }
    x = (previewCanvas.width - renderWidth) / 2;
    y = (previewCanvas.height - renderHeight) / 2;
  } else {
    if (imgAspect > canvasAspect) {
      renderHeight = previewCanvas.height;
      renderWidth = renderHeight * imgAspect;
    } else {
      renderWidth = previewCanvas.width;
      renderHeight = renderWidth / imgAspect;
    }
    x = (previewCanvas.width - renderWidth) / 2;
    y = (previewCanvas.height - renderHeight) / 2;
  }

  ctx.drawImage(img, x, y, renderWidth, renderHeight);

  if (enableGlitch.checked) {
    applyGlitch();
  }
}

function applyGlitch() {
  let imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
  let data = imageData.data;

  let offsetX = parseInt(glitchOffsetX.value);
  let offsetY = parseInt(glitchOffsetY.value);
  let rgbSplit = parseInt(glitchRGB.value);
  let noiseLevel = parseInt(glitchNoise.value);
  let scanlines = parseInt(glitchScan.value);
  let pixelSize = parseInt(glitchPixel.value);
  let brightness = parseInt(glitchBrightness.value) / 100;
  let saturation = parseInt(glitchSaturation.value) / 100;

  for (let y = 0; y < previewCanvas.height; y++) {
    for (let x = 0; x < previewCanvas.width; x++) {
      let i = (y * previewCanvas.width + x) * 4;

      // Brilho e saturação
      data[i] = Math.min(255, data[i] * brightness);
      data[i + 1] = Math.min(255, data[i + 1] * brightness);
      data[i + 2] = Math.min(255, data[i + 2] * brightness);

      let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg + (data[i] - avg) * saturation;
      data[i + 1] = avg + (data[i + 1] - avg) * saturation;
      data[i + 2] = avg + (data[i + 2] - avg) * saturation;

      // Noise
      if (Math.random() < noiseLevel / 1000) {
        data[i] = data[i + 1] = data[i + 2] = Math.random() * 255;
      }

      // Scanlines
      if (scanlines > 0 && y % 2 === 0) {
        data[i] *= (100 - scanlines) / 100;
        data[i + 1] *= (100 - scanlines) / 100;
        data[i + 2] *= (100 - scanlines) / 100;
      }
    }
  }

  ctx.putImageData(imageData, offsetX, offsetY);
}

function startPreview() {
  clearInterval(previewInterval);
  previewInterval = setInterval(() => {
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    drawImageWithFit(images[currentFrame]);
    currentFrame = (currentFrame + 1) % images.length;
  }, parseInt(frameTimeInput.value));
}

frameTimeInput.addEventListener("input", startPreview);
fitMode.addEventListener("change", startPreview);
bgColorInput.addEventListener("input", startPreview);
enableGlitch.addEventListener("change", startPreview);

[glitchOffsetX, glitchOffsetY, glitchRGB, glitchNoise, glitchScan, glitchPixel, glitchBrightness, glitchSaturation].forEach(slider => {
  slider.addEventListener("input", startPreview);
});

generateBtn.addEventListener("click", () => {
  if (images.length === 0) return;
  let stream = previewCanvas.captureStream();
  let recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  let chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    let blob = new Blob(chunks, { type: "video/webm" });
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.style.display = "block";
  };

  recorder.start();
  let frameDuration = parseInt(frameTimeInput.value);
  let i = 0;
  function drawNext() {
    if (i >= images.length) {
      recorder.stop();
      return;
    }
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    drawImageWithFit(images[i]);
    i++;
    setTimeout(drawNext, frameDuration);
  }
  drawNext();
});
