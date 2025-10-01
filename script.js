const upload = document.getElementById("imageUpload");
const frameTimeInput = document.getElementById("frameTime");
const generateBtn = document.getElementById("generateBtn");
const previewCanvas = document.getElementById("previewCanvas");
const ctx = previewCanvas.getContext("2d");
const downloadLink = document.getElementById("downloadLink");
const enableGlitch = document.getElementById("enableGlitch");

const glitchShift = document.getElementById("glitchShift");
const glitchRGB = document.getElementById("glitchRGB");
const glitchNoise = document.getElementById("glitchNoise");
const glitchBlocks = document.getElementById("glitchBlocks");
const glitchWave = document.getElementById("glitchWave");
const glitchScan = document.getElementById("glitchScan");
const glitchBrightness = document.getElementById("glitchBrightness");
const glitchSaturation = document.getElementById("glitchSaturation");

const valShift = document.getElementById("valShift");
const valRGB = document.getElementById("valRGB");
const valNoise = document.getElementById("valNoise");
const valBlocks = document.getElementById("valBlocks");
const valWave = document.getElementById("valWave");
const valScan = document.getElementById("valScan");
const valBrightness = document.getElementById("valBrightness");
const valSaturation = document.getElementById("valSaturation");

let images = [];
let currentFrame = 0;
let previewInterval;

function updateSliderLabels() {
  valShift.textContent = glitchShift.value;
  valRGB.textContent = glitchRGB.value;
  valNoise.textContent = glitchNoise.value;
  valBlocks.textContent = glitchBlocks.value;
  valWave.textContent = glitchWave.value;
  valScan.textContent = glitchScan.value;
  valBrightness.textContent = glitchBrightness.value;
  valSaturation.textContent = glitchSaturation.value;
}

// Sliders forçam update imediato
[glitchShift, glitchRGB, glitchNoise, glitchBlocks, glitchWave, glitchScan, glitchBrightness, glitchSaturation]
  .forEach(slider => {
    slider.addEventListener("input", () => {
      updateSliderLabels();
      if (images.length > 0) {
        applyGlitch(images[currentFrame], ctx, previewCanvas);
      }
    });
  });

// Atualizar tempo dinamicamente
frameTimeInput.addEventListener("input", () => {
  if (images.length > 0) {
    startPreview();
  }
});

upload.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  images = [];
  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        images.push(img);
        loaded++;
        if (loaded === files.length) {
          startPreview();
        }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
});

function startPreview() {
  if (previewInterval) clearInterval(previewInterval);
  currentFrame = 0;
  previewInterval = setInterval(() => {
    applyGlitch(images[currentFrame], ctx, previewCanvas);
    currentFrame = (currentFrame + 1) % images.length;
  }, parseInt(frameTimeInput.value));
}

function applyGlitch(img, context, canvas) {
  context.clearRect(0,0,canvas.width,canvas.height);
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  if (!enableGlitch.checked) return;

  let imageData = context.getImageData(0,0,canvas.width,canvas.height);
  let data = imageData.data;

  // Shift
  let shift = parseInt(glitchShift.value);
  if (shift > 0) {
    const temp = new Uint8ClampedArray(data);
    for (let y=0; y<canvas.height; y++) {
      for (let x=0; x<canvas.width; x++) {
        let src = (y*canvas.width + x)*4;
        let dst = (y*canvas.width + ((x+shift)%canvas.width))*4;
        data[dst]=temp[src];
        data[dst+1]=temp[src+1];
        data[dst+2]=temp[src+2];
        data[dst+3]=temp[src+3];
      }
    }
  }

  // RGB Split
  let rgbSplit = parseInt(glitchRGB.value);
  if (rgbSplit > 0) {
    const temp = new Uint8ClampedArray(data);
    for (let i=0; i<data.length; i+=4) {
      let ni = (i + rgbSplit*4) % data.length;
      data[i]=temp[ni]; 
      data[i+1]=temp[(i+1) % data.length]; 
      data[i+2]=temp[(i+2) % data.length]; 
    }
  }

  // Noise
  let noiseLevel = parseInt(glitchNoise.value);
  if (noiseLevel>0) {
    for (let i=0; i<data.length; i+=4) {
      if (Math.random()<0.05) {
        let rand=(Math.random()-0.5)*noiseLevel;
        data[i]+=rand; data[i+1]+=rand; data[i+2]+=rand;
      }
    }
  }

  // Blocks
  let blocks = parseInt(glitchBlocks.value);
  if (blocks>0) {
    for (let b=0; b<blocks; b++) {
      let bx=Math.floor(Math.random()*canvas.width);
      let by=Math.floor(Math.random()*canvas.height);
      let bw=20, bh=20;
      for (let y=by; y<by+bh && y<canvas.height; y++) {
        for (let x=bx; x<bx+bw && x<canvas.width; x++) {
          let idx=(y*canvas.width+x)*4;
          data[idx]=Math.random()*255;
          data[idx+1]=Math.random()*255;
          data[idx+2]=Math.random()*255;
        }
      }
    }
  }

  // Wave distortion
  let wave = parseInt(glitchWave.value);
  if (wave>0) {
    const temp = new Uint8ClampedArray(data);
    for (let y=0; y<canvas.height; y++) {
      let offset=Math.floor(Math.sin(y/10)*wave);
      for (let x=0; x<canvas.width; x++) {
        let src=(y*canvas.width+x)*4;
        let dst=(y*canvas.width+((x+offset+canvas.width)%canvas.width))*4;
        data[dst]=temp[src];
        data[dst+1]=temp[src+1];
        data[dst+2]=temp[src+2];
        data[dst+3]=temp[src+3];
      }
    }
  }

  // Scanlines
  let scan = parseInt(glitchScan.value);
  if (scan>0) {
    for (let y=0; y<canvas.height; y+=2) {
      for (let x=0; x<canvas.width; x++) {
        let idx=(y*canvas.width+x)*4;
        data[idx]=data[idx]/2;
        data[idx+1]=data[idx+1]/2;
        data[idx+2]=data[idx+2]/2;
      }
    }
  }

  // Brightness
  let brightness = parseInt(glitchBrightness.value);
  if (brightness !== 0) {
    for (let i=0; i<data.length; i+=4) {
      data[i]+=brightness;
      data[i+1]+=brightness;
      data[i+2]+=brightness;
    }
  }

  // Saturation
  let saturation = parseInt(glitchSaturation.value)/100;
  if (saturation !== 1) {
    for (let i=0; i<data.length; i+=4) {
      let gray = 0.3*data[i] + 0.59*data[i+1] + 0.11*data[i+2];
      data[i] = gray + (data[i]-gray)*saturation;
      data[i+1] = gray + (data[i+1]-gray)*saturation;
      data[i+2] = gray + (data[i+2]-gray)*saturation;
    }
  }

  context.putImageData(imageData,0,0);
}

generateBtn.addEventListener("click", () => {
  if (images.length===0) return;
  const frameTime=parseInt(frameTimeInput.value);
  const stream=previewCanvas.captureStream();
  const recorder=new MediaRecorder(stream,{mimeType:"video/webm"});
  const chunks=[];
  recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
  recorder.onstop=()=>{
    const blob=new Blob(chunks,{type:"video/webm"});
    const url=URL.createObjectURL(blob);
    downloadLink.href=url;
    downloadLink.download="animation.webm";
    downloadLink.style.display="block";
    downloadLink.textContent="Download Vídeo";
  };

  let i=0;
  recorder.start();
  const renderFrame=()=>{
    applyGlitch(images[i],ctx,previewCanvas);
    i++;
    if(i<images.length){
      setTimeout(renderFrame,frameTime);
    } else {
      setTimeout(()=>recorder.stop(),frameTime);
    }
  };
  renderFrame();
});
