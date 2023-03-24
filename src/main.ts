import { startOCRForVideo } from "./ocr";
import "./style.css";

const appElem = document.querySelector<HTMLDivElement>("#app")!;

const videoElem = document.createElement("video");
videoElem.controls = true;
videoElem.autoplay = true;
videoElem.style.width = "100%";
appElem.appendChild(videoElem);

const gUMButton = document.createElement("button");
gUMButton.textContent = "gUM";
gUMButton.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  videoElem.srcObject = stream;
};
appElem.appendChild(gUMButton);

const gDMButton = document.createElement("button");
gDMButton.textContent = "gDM";
gDMButton.onclick = async () => {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
  videoElem.srcObject = stream;
};
appElem.appendChild(gDMButton);

const stopButton = document.createElement("button");
stopButton.textContent = "STOP";
stopButton.onclick = async () => {
  if (videoElem.srcObject) {
    for (const track of (videoElem.srcObject as MediaStream).getTracks()) {
      track.stop();
    }
    videoElem.srcObject = null;
  }
};
appElem.appendChild(stopButton);

startOCRForVideo(videoElem);
