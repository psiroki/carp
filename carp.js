let video = document.querySelector("#videoElement");
let info = document.getElementById("info");
let flip = false;
let canvas = null;
let blob = null;
let blobUrl = null;
let blobAnchor = null;

function setFlip(val) {
  flip = val;
  video.style.transform = flip ? "scaleX(-1)" : "";
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
      facingMode: fm[location.hash]
    }
  };
  if (!constraints.facingMode) delete constraints.facingMode;
  if (constraints.video.facingMode === "environment") setFlip(false);
  navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err0r) {
      console.log("Something went wrong!", err0r);
    });
}

video.addEventListener("click", function() {
//  setFlip(!flip);
  if (canvas) canvas.remove();
  canvas = document.createElement("canvas");
  blob = null;
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrl = null;
  }
  if (blobAnchor) blobAnchor.remove();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  document.body.appendChild(canvas);
  let ctx = canvas.getContext("2d");
  let y = 0;
  let a = null;
  let intervalId = setInterval(() => {
    let startY = y;
    y += 5;
    ctx.drawImage(video,
      0, startY, video.videoWidth, y - startY,
      0, startY, video.videoWidth, y - startY);
    if (y >= video.videoHeight) {
      clearInterval(intervalId);
      canvas.toBlob(b => {
        if (blobAnchor) blobAnchor.remove();
        a = document.createElement("a");
        blob = b;
        blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.textContent = "Save";
        a.download = "carp_"+(Math.random()*256*1048576|0).toString(16).padStart(7, "0")+".jpg";
        document.body.appendChild(a);
        blobAnchor = a;
      }, "image/jpeg", 0.7);
    }
  }, 33);
  canvas.addEventListener("click", e => {
    clearInterval(intervalId);
    e.currentTarget.remove();
    if (a) a.remove();
  });
});

video.addEventListener("loadeddata", function (e) {
  info.textContent = [video.videoWidth, video.videoHeight].join("x");
});
