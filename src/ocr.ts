import { OCRClient, ProgressListener } from "tesseract-wasm";

const fixMaybeStartWithScheme = (s: string): string => {
  // 先頭の文字列に余計な文字がついている場合があるのでその場合はそこを削る
  const index = s.indexOf("http");
  if (index > 0) {
    s = s.substring(index);
  }
  // ここらへんの文字列でURLが終わることはあまりなさそうなのでURL外として削る
  while (s.length > 0 && "])}>`'\"".includes(s.at(-1)!)) {
    s = s.substring(0, s.length - 1);
  }

  // 最初のスキーマの部分が1文字変わっているだけと思われる状態なら修正する
  {
    let diff = 0;
    for (let i = 0; i < 7; i++) {
      if (s[i] !== "http://"[i]) diff++;
    }

    if (diff <= 1) {
      return "http://" + s.substring(7);
    }
  }
  {
    let diff = 0;
    for (let i = 0; i < 8; i++) {
      if (s[i] !== "https://"[i]) diff++;
    }

    if (diff <= 1) {
      return "https://" + s.substring(8);
    }
  }

  return s;
};

export const startOCRForVideo = async (
  sourceVideoElem: HTMLVideoElement,
  trainedDataPath = "eng.traineddata",
  ocrMinIntervalSec = 1
) => {
  const ocr = new OCRClient();
  await ocr.loadModel(trainedDataPath);

  // OCRで作ったリンクが入る親
  const ocrLayerElem = document.createElement("div");
  ocrLayerElem.id = "ocr-layer";
  ocrLayerElem.style.position = "absolute";
  if (sourceVideoElem.parentElement === null) {
    throw new Error("videoElement mast not be root element.");
  }
  sourceVideoElem.parentElement.appendChild(ocrLayerElem);

  let inProgress = false;
  setInterval(async () => {
    if (
      !sourceVideoElem.srcObject ||
      sourceVideoElem.videoWidth === 0 ||
      sourceVideoElem.videoHeight === 0 ||
      inProgress
    )
      return;

    inProgress = true;

    await ocr.loadImage(await createImageBitmap(sourceVideoElem));

    const started = Date.now();
    const progressListener: ProgressListener = (progress: number) => {
      if (progress === 100) {
        inProgress = false;
        console.log(Date.now() - started);
      }
    };

    // console.log(await ocr.getTextBoxes("line", progressListener));
    const allTexts = await ocr.getTextBoxes("word", progressListener);
    const texts = allTexts
      .map(({ rect, text }) => ({
        rect,
        text: fixMaybeStartWithScheme(text.trim()),
      }))
      .filter(
        ({ text }) => text.startsWith("http://") || text.startsWith("https://")
      );

    ocrLayerElem.style.left = `${sourceVideoElem.offsetLeft}px`;
    ocrLayerElem.style.top = `${sourceVideoElem.offsetTop}px`;
    ocrLayerElem.style.width = `${sourceVideoElem.offsetWidth}px`;
    ocrLayerElem.style.height = `${sourceVideoElem.offsetHeight}px`;
    while (ocrLayerElem.firstChild) {
      ocrLayerElem.removeChild(ocrLayerElem.firstChild);
    }

    // 映像自身のサイズとvideoタグのサイズは異なるので合うようにサイズを変更する
    const scale = sourceVideoElem.videoWidth / sourceVideoElem.offsetWidth;
    for (const {
      rect: { left, top, right, bottom },
      text,
    } of texts) {
      const ocrBoxElem = document.createElement("a");
      ocrBoxElem.classList.add("ocr-box");
      ocrBoxElem.style.display = "block";
      ocrBoxElem.style.position = "absolute";
      ocrBoxElem.style.left = `${left / scale}px`;
      ocrBoxElem.style.top = `${top / scale}px`;
      ocrBoxElem.style.width = `${(right - left) / scale}px`;
      ocrBoxElem.style.height = `${(bottom - top) / scale}px`;
      ocrBoxElem.href = text;

      ocrLayerElem.appendChild(ocrBoxElem);
    }

    await ocr.clearImage();
  }, ocrMinIntervalSec * 1000);
};
