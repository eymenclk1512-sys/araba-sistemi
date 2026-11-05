const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const calibrateBtn = document.getElementById("calibrateBtn");
const placeholder = document.getElementById("cameraPlaceholder");
const statusEl = document.getElementById("status");
const angleEl = document.getElementById("angle");
const handsEl = document.getElementById("hands");
const trackingText = document.getElementById("trackingText");
const sensitivity = document.getElementById("sensitivity");
const sensitivityValue = document.getElementById("sensitivityValue");
const meterFill = document.getElementById("meterFill");

let stream = null, landmarker = null, running = false, rafId = null;
let baseline = null, lastAngle = 0, smoothAngle = 0, lastVideoTime = -1;

function setStatus(text, on=false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("on", on);
}
function wrapAngle(a) {
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
}
function updateAngle(value) {
  const limit = 90;
  const clamped = Math.max(-limit, Math.min(limit, value));
  angleEl.textContent = `${Math.round(clamped)}°`;
  meterFill.style.width = `${50 + clamped / 180 * 100}%`;
}
function resizeCanvas() {
  const w = video.videoWidth || 640, h = video.videoHeight || 400;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}
async function setupLandmarker() {
  if (landmarker) return;
  if (!window.FilesetResolver || !window.HandLandmarker) throw new Error("El takibi kütüphanesi yüklenemedi. İnternet bağlantısını kontrol et.");
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
  landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
    runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.55,
    minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5
  });
}
async function startCamera() {
  try {
    startBtn.disabled = true;
    setStatus("Kamera hazırlanıyor…");
    await setupLandmarker();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }
    });
    video.srcObject = stream;
    await video.play();
    running = true; placeholder.hidden = true;
    startBtn.disabled = true; stopBtn.disabled = false; calibrateBtn.disabled = false;
    setStatus("Kamera açık", true);
    trackingText.textContent = "İki elini göster";
    loop();
  } catch (err) {
    console.error(err);
    setStatus("Başlatılamadı");
    startBtn.disabled = false;
    alert(err.message || "Kamera açılamadı. Sayfayı HTTPS üzerinden açıp kamera izni ver.");
  }
}
function stopCamera() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null; video.srcObject = null;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  placeholder.hidden = false;
  startBtn.disabled = false; stopBtn.disabled = true; calibrateBtn.disabled = true;
  handsEl.textContent = "0 / 2"; trackingText.textContent = "Takip bekleniyor";
  setStatus("Kamera kapalı");
}
function getWristVector(hands) {
  // MediaPipe bilek noktası: landmark 0. İki el arasındaki vektörün yönü,
  // eller direksiyonu kavrayıp birlikte döndüğünde yaklaşık direksiyon açısını verir.
  const a = hands[0][0], b = hands[1][0];
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.hypot(dx,dy) < 0.08) return null;
  return Math.atan2(dy,dx) * 180 / Math.PI;
}
function drawHands(hands) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const connections = HandLandmarker.HAND_CONNECTIONS;
  for (const hand of hands) {
    ctx.lineWidth = Math.max(2, canvas.width/400);
    ctx.strokeStyle = "#54dda7"; ctx.fillStyle = "#f3fff9";
    for (const [i,j] of connections) {
      const p=hand[i], q=hand[j];
      ctx.beginPath(); ctx.moveTo(p.x*canvas.width,p.y*canvas.height); ctx.lineTo(q.x*canvas.width,q.y*canvas.height); ctx.stroke();
    }
    for (const p of hand) {
      ctx.beginPath(); ctx.arc(p.x*canvas.width,p.y*canvas.height,Math.max(2,canvas.width/250),0,Math.PI*2); ctx.fill();
    }
  }
}
function loop() {
  if (!running) return;
  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    resizeCanvas();
    const result = landmarker.detectForVideo(video, performance.now());
    const hands = result.landmarks || [];
    drawHands(hands);
    handsEl.textContent = `${hands.length} / 2`;
    if (hands.length === 2) {
      const vectorAngle = getWristVector(hands);
      if (vectorAngle !== null) {
        if (lastAngle === 0) lastAngle = vectorAngle;
        const relative = wrapAngle(vectorAngle - (baseline ?? vectorAngle));
        const gain = Number(sensitivity.value) / 100;
        smoothAngle += (relative * gain - smoothAngle) * 0.22;
        updateAngle(smoothAngle);
        trackingText.textContent = "İki el takip ediliyor";
      }
    } else {
      trackingText.textContent = hands.length === 1 ? "Diğer elini de göster" : "İki elini göster";
    }
    lastVideoTime = video.currentTime;
  }
  rafId = requestAnimationFrame(loop);
}
calibrateBtn.addEventListener("click", () => {
  if (!running) return;
  const result = landmarker.detectForVideo(video, performance.now());
  if (!result.landmarks || result.landmarks.length !== 2) {
    alert("Kalibrasyon için iki elin de kamerada görünmeli."); return;
  }
  baseline = getWristVector(result.landmarks);
  smoothAngle = 0; updateAngle(0);
  trackingText.textContent = "Kalibrasyon tamamlandı";
});
sensitivity.addEventListener("input", () => {
  const v = Number(sensitivity.value);
  sensitivityValue.textContent = v < 80 ? "Düşük" : v > 135 ? "Yüksek" : "Orta";
});
startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
window.addEventListener("resize", resizeCanvas);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.warn));
}
