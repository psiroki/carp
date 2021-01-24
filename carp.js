let video = document.querySelector("#videoElement");
let info = document.getElementById("info");
let flip = false;
let canvasDiv = null;
let blob = null;
let blobUrl = null;
let blobAnchor = null;
let horizontal = false;

function updateFlip() {
  let transform = flip ? "scaleX(-1)" : "";
  document.body.classList.toggle("flipped", flip);
  if (canvasDiv) canvasDiv.style.transform = transform;
  if (blobAnchor) blobAnchor.style.transform = transform;
}

function setFlip(val) {
  flip = val;
  updateFlip();
}

setFlip(true);

if (navigator.mediaDevices.getUserMedia) {
  let fm = {
    "#front": "user",
    "#back": "environment"
  };
  let wm = {
    "#hd": 1280,
    "#fullhd": 1920
  };
  let hm = {
    "#hd": 720,
    "#fullhd": 1080
  };
  let constraints = {
    video: {
      width: { min: wm[location.hash] || 320, ideal: 1920 },
      height: { min: hm[location.hash] || 180, ideal: 1080 },
      frameRate: { min: 30, ideal: 60 },
      facingMode: fm[location.hash] || "user"
    }
  };
  if (!constraints.facingMode) delete constraints.facingMode;
  if (constraints.video.facingMode === "environment") setFlip(false);
  navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
      video.srcObject = stream;
      const vtracks = stream.getVideoTrakcs();
      let facingMode = vtracks[0].getCapabilities().facingMode;
      setFlip(!!facingMode.find("user"));
    })
    .catch(function (error) {
      console.log("Something went wrong!", error);
    });
}

function animate(fun) {
  let stop = false;
  const controller = {
    lastTimestamp: null,
    stop() {
      stop = true;
    }
  };
  let exec = (...args) => {
    if (!stop) {
      controller.lastTimestamp = args[0];
      let result = fun(controller, ...args);
      if (typeof result !== "boolean" || result) {
        requestAnimationFrame(exec);
      }
    }
  };
  requestAnimationFrame(exec);
  return controller;
}

function copyRect(ctx, src, r) {
  const x = r[0];
  const y = r[1];
  const w = r[2] - r[0];
  const h = r[3] - r[1];
  ctx.drawImage(src, x, y, w, h, x, y, w, h);
}

function fillRect(ctx, r) {
  const x = r[0];
  const y = r[1];
  const w = r[2] - r[0];
  const h = r[3] - r[1];
  ctx.fillRect(x, y, w, h);
}

video.addEventListener("click", function() {
//  setFlip(!flip);
  if (canvasDiv) canvasDiv.remove();
  canvasDiv = document.createElement("div");
  canvasDiv.classList.add("canvas");
  let canvas = document.createElement("canvas");
  canvasDiv.appendChild(canvas);
  updateFlip();
  blob = null;
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrl = null;
  }
  if (blobAnchor) blobAnchor.remove();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  document.body.appendChild(canvasDiv);
  let ctx = canvas.getContext("2d");
  let pos = 0;
  let a = null;
  let lastTime = null;
  let progressSize = horizontal ? video.videoWidth : video.videoHeight;
  let otherSize = horizontal ? video.videoHeight : video.videoWidth;
  let progressDim = horizontal ? 0 : 1;
  let otherDim = horizontal ? 1 : 0;
  let anim = animate((anim, t) => {
    if (lastTime === null) {
      lastTime = t;
      return;
    }
    const timeDelta = t - lastTime;
    let start = pos|0;
    pos += timeDelta * 3e-3;
    let end = pos|0;
    let rect = Array(4).fill(0);
    rect[otherDim] = 0;
    rect[otherDim + 2] = otherSize;
    rect[progressDim] = start;
    rect[progressDim + 2] = end;
    copyRect(ctx, video, rect);
    if (end >= progressSize) {
      anim.stop();
      canvas.toBlob(b => {
        if (blobAnchor) blobAnchor.remove();
        a = document.createElement("a");
        blob = b;
        blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.textContent = "Save";
        a.download = "carp_"+(Math.random()*256*1048576|0).toString(16).padStart(7, "0")+".jpg";
        canvasDiv.appendChild(a);
        blobAnchor = a;
        updateFlip();
      }, "image/jpeg", 0.7);
    } else {
      rect[progressDim] = end + 1;
      rect[progressDim + 2] = 2 * end - start + 1;
      ctx.fillStyle = "#0008";
      fillRect(ctx, rect);
      ctx.fillStyle = "#4f48";
      ++rect[progressDim];
      --rect[progressDim + 2];
      fillRect(ctx, rect);
    }
  });
  canvasDiv.addEventListener("click", e => {
    anim.stop();
    e.currentTarget.remove();
    if (a) a.remove();
  });
});

document.querySelector("button").addEventListener("click", _ => {
  horizontal = !horizontal;
  document.body.classList.toggle("horizontal", horizontal);
});

video.addEventListener("loadeddata", function (e) {
  info.textContent = [video.videoWidth, video.videoHeight].join("x");
});
