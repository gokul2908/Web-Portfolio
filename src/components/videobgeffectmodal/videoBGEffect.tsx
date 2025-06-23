/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Detection,
    FaceDetector,
    FilesetResolver,
    ImageSegmenter,
    ImageSegmenterResult,
} from "@mediapipe/tasks-vision";

const modelAssetPath =
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
    wasmCdn =
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    increaseCropSize = 5;

let focusToFace = () => {};

export function addBackgroundEffect(
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement
): any {
    const aspectRatioMap = {
            square: 1,
            landscape: 16 / 9,
            portrait: 9 / 16,
            "3:4": 3 / 4,
            "8:9": 8 / 9,
        },
        backgroundImgUrls: string[] = [
            "https://images.pexels.com/photos/421927/pexels-photo-421927.jpeg",
            "https://images.pexels.com/photos/366283/tianjin-twilight-city-scenery-366283.jpeg",
            "https://images.pexels.com/photos/1209978/pexels-photo-1209978.jpeg",
            "https://images.pexels.com/photos/112811/pexels-photo-112811.jpeg",
            "https://images.pexels.com/photos/683929/pexels-photo-683929.jpeg",
            "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg",
            "https://images.pexels.com/photos/1534924/pexels-photo-1534924.jpeg",
            "https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg",
            "https://images.pexels.com/photos/169677/pexels-photo-169677.jpeg",
            "Background Blur",
        ];
    let imageSegmenter: ImageSegmenter,
        interfaceDelegate: "CPU" | "GPU" | undefined = "GPU",
        stream: MediaStream | null,
        aspectRatio = 1,
        canvasCtx: CanvasRenderingContext2D | null = null,
        selfieAspectRatio: number,
        selfieHeight,
        selfieWidth,
        sHeight,
        sWidth,
        sx = 0,
        sy = 0,
        backgroundUrl = "Background Blur",
        backgroundImageData,
        blurValue = 1;

    async function imageSegmenterInit(tryCount = 0) {
        const vision = await FilesetResolver.forVisionTasks(wasmCdn);

        if (getBrowserName() === "Mozilla Firefox") {
            interfaceDelegate = "CPU";
        }

        try {
            imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath,
                    delegate: interfaceDelegate,
                },
                runningMode: "VIDEO",
                outputCategoryMask: false,
                outputConfidenceMasks: true,
            });
            const labels = imageSegmenter.getLabels();
            console.log(labels);
        } catch (error) {
            if (tryCount === 0) {
                interfaceDelegate = interfaceDelegate === "GPU" ? "CPU" : "GPU";
                imageSegmenterInit(1);
            } else {
                alert("Image segmenter Initialization failed");
            }
        }
    }

    imageSegmenterInit();

    async function showCropVideo() {
        console.log({ aspectRatio });
        try {
            resetVideoElements();

            // Get user media
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    frameRate: { ideal: 60, max: 120 },
                },
            });

            // Original video element for displaying the stream
            videoEl.muted = true;
            videoEl.srcObject = stream;
            videoEl.play();

            canvasCtx = canvasEl.getContext("2d");

            videoEl.onloadedmetadata = whenVideoMetaDataLoaded;
        } catch (error) {
            console.error(error);
        }
    }

    const whenVideoMetaDataLoaded = () => {
        try {
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
            selfieAspectRatio = videoEl.videoWidth / videoEl.videoHeight;

            changeBackgroundEffect();

            sHeight = videoEl.videoHeight;
            sWidth = videoEl.videoHeight * aspectRatio;
            if (selfieAspectRatio < aspectRatio) {
                sHeight = videoEl.videoHeight / aspectRatio;
                sWidth = videoEl.videoHeight;
            }
            selfieHeight = videoEl.videoHeight;
            selfieWidth = videoEl.videoWidth;
            showFaceDetection();

            if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
                console.info("Using requestVideoFrameCallback");
                videoEl.requestVideoFrameCallback(drawFrame);
            } else {
                console.info("Using requestAnimationFrame");
                requestAnimationFrame(drawFrame);
            }

            if (canvasEl) canvasEl.style.aspectRatio = String(aspectRatio);
        } catch (error) {
            console.error("videoEl onload metadata error", error);
        }
    };

    async function showFaceDetection() {
        if (!videoEl)
            return console.error("unCroppedVideoEl Element is not found");
        // const canvas: any = faceapi.createCanvas(videoEl);
        // canvas.id = "audio_video_recording_popup_canvas_1";
        // document.body.append(canvas);

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const faceDetector: FaceDetector = await FaceDetector.createFromOptions(
            vision,
            {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite`,
                    delegate: "GPU",
                },
                runningMode: "IMAGE",
            }
        );
        await faceDetector.setOptions({ runningMode: "IMAGE" });

        const maxRunCount = 20;
        let runCount = 0,
            faceDetected = false;
        focusToFace = async () => {
            if (runCount >= maxRunCount) return;
            //console.log('face detection call');
            const detections: Detection[] =
                faceDetector.detect(videoEl).detections;
            runCount++;
            console.log({ detections });
            if (detections.length === 0) {
                if (faceDetected) return;
                setTimeout(() => focusToFace(), 100); // won't block thread
                return;
            }
            const { boundingBox }: any = detections[0];
            //console.log(_box);

            const [c_x, c_y] = findCenterPoint(boundingBox);
            console.log(c_x, c_y);
            let width =
                Math.min(
                    boundingBox.width * increaseCropSize,
                    videoEl.videoHeight
                ) * aspectRatio;
            // let height = width / videoAspectRatio;
            let height = width / aspectRatio;

            if (selfieAspectRatio && selfieAspectRatio < aspectRatio) {
                width = videoEl.videoWidth;
                height = width / aspectRatio;
            }

            sx = Math.max(c_x - width / 2, 0);
            sy = Math.max(c_y - height / 2, 0);

            // Ensure the crop area is within the bounds of the video
            if (sx + width > videoEl.videoWidth) {
                sx = videoEl.videoWidth - width;
            }
            if (sy + height > videoEl.videoHeight) {
                sy = videoEl.videoHeight - height;
            }
            sy = sy > 0 ? sy * 0.85 : sy * 1.15;
            sx = minDiffCheck(sx, sx);
            sy = minDiffCheck(sy, sy);
            sHeight = minDiffCheck(sHeight, Math.min(height, height));
            sWidth = minDiffCheck(sWidth, Math.min(width, width));
            console.log({sx, sy, sWidth, sHeight});
            faceDetected = true;
        };
        focusToFace();
    }

    function minDiffCheck(prev: any, curr: any) {
        if (Math.abs(prev - curr) > 20) return curr;
        return prev;
    }

    function findCenterPoint({ originX, originY, width, height }: any) {
        return [originX + width / 2, originY + height / 2];
    }
    function resetVideoElements() {
        if (videoEl) {
            videoEl.srcObject = null;
            videoEl.removeAttribute("src");
            videoEl.onloadedmetadata = null;
        }

        stream?.getTracks()?.forEach((track: any) => track?.stop());
        stream = null;
    }

    let resultMask: ImageSegmenterResult;

    function getMaskData(now) {
        if (!imageSegmenter)
            return console.error("Image segmenter ref not found");

        resultMask = imageSegmenter.segmentForVideo(canvasEl, now);
    }

    function drawFrame(now: any) {
        // Specify the cropping parameters
        if (!canvasCtx) return;
        const dx = 0; // destination x
        const dy = 0; // destination y
        const dWidth = canvasEl.width; // destination width
        const dHeight = canvasEl.height; // destination height
        canvasCtx.drawImage(
            videoEl,
            sx,
            sy,
            sWidth,
            sHeight,
            dx,
            dy,
            dWidth,
            dHeight
        );

        // if (callCount % 2 === 0) getMaskData();
        getMaskData(now);

        applyBackgroundEffectInFrame(now);

        if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
            videoEl.requestVideoFrameCallback(drawFrame);
        } else {
            requestAnimationFrame(drawFrame);
        }
    }

    function applyBackgroundEffectInFrame(now) {
        const a = performance.now();
        if (backgroundUrl === "Background Blur") getBlurData();

        if (!canvasCtx) return;
        // Get current frame image data
        const currentFrame = canvasCtx.getImageData(
            0,
            0,
            canvasEl.width,
            canvasEl.height
        );
        let imageData = currentFrame.data;

        const backgroundConfidentConstant = 0.5;

        if (resultMask) {
            if (!imageData) console.error("Image data not available");
            const mask = resultMask.confidenceMasks?.[0]?.getAsFloat32Array();
            // console.log({mask});
            if (mask && backgroundImageData) {
                let j = 0;
                for (let i = 0; i < mask.length; ++i) {
                    if (mask[i] < backgroundConfidentConstant) {
                        imageData[j] = backgroundImageData[j];
                        imageData[j + 1] = backgroundImageData[j + 1];
                        imageData[j + 2] = backgroundImageData[j + 2];
                        imageData[j + 3] = backgroundImageData[j + 3];
                    }
                    j += 4;
                }
            }
        }
        canvasCtx.putImageData(currentFrame, 0, 0);
    }

    function changeBackgroundEffect(imageUrl = backgroundUrl) {
        if (imageUrl === "Background Blur") return;
        return new Promise((resolve, reject) => {
            try {
                const image = new Image();
                image.crossOrigin = "Anonymous"; // Enable cross-origin if the image is from a different origin
                image.src = imageUrl;

                image.onload = () => {
                    // Create a canvas element
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    // Get video dimensions
                    const videoWidth = videoEl.videoWidth;
                    const videoHeight = videoEl.videoHeight;

                    // Calculate the aspect ratios
                    const imageAspectRatio = image.width / image.height;
                    const videoAspectRatio = videoWidth / videoHeight;

                    const targetWidth = videoWidth;
                    const targetHeight = videoWidth / imageAspectRatio;
                    // Set canvas dimensions to the target size
                    canvas.width = targetWidth;
                    canvas.height = targetWidth;
                    if (!ctx) return;

                    // Draw the image, resizing it to fit within the canvas
                    ctx.drawImage(image, 0, 0, targetWidth, targetWidth);

                    // Get image data from the canvas
                    backgroundImageData = ctx.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    ).data;
                    // Resolve the promise with the image data
                    resolve(true);
                };
                image.onerror = () => {
                    reject(
                        new Error(
                            "Failed to load the image from the provided URL."
                        )
                    );
                };
            } catch (error) {}
        });
    }

    const getBlurData = (() => {
        const offscreenCanvas = document.createElement("canvas");
        const offscreenCtx = offscreenCanvas.getContext("2d");
        return () => {
            try {
                if (!offscreenCtx) return console.error("Get blur data error");

                // Offscreen canvas setup for blurring
                offscreenCanvas.width = canvasEl.width;
                offscreenCanvas.height = canvasEl.height;

                offscreenCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
                offscreenCtx.filter = `blur(${blurValue}px)`;

                // Draw the current frame onto the offscreen canvas
                offscreenCtx.drawImage(canvasEl, 0, 0);

                // Extract the blurred image data
                backgroundImageData = offscreenCtx.getImageData(
                    0,
                    0,
                    canvasEl.width,
                    canvasEl.height
                ).data;
            } catch (error) {
                console.error("Error getting blur background", error);
            }
        };
    })();

    return { showCropVideo, resetVideoElements };
}

function getBrowserName() {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.indexOf("edge") > -1) {
        return "Microsoft Edge";
    } else if (userAgent.indexOf("chrome") > -1) {
        return "Google Chrome";
    } else if (userAgent.indexOf("safari") > -1) {
        return "Apple Safari";
    } else if (userAgent.indexOf("firefox") > -1) {
        return "Mozilla Firefox";
    } else if (userAgent.indexOf("opera") > -1) {
        return "Opera";
    } else {
        return "Unknown Browser";
    }
}
