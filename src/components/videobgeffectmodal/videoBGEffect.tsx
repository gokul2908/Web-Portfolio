/* eslint-disable @typescript-eslint/no-unused-vars */ import {
	FaceDetector,
	FilesetResolver,
	ImageSegmenter,
	ImageSegmenterResult,
} from '@mediapipe/tasks-vision';
import { throttle } from '../../assets/utils';

// (Assuming other imports and constants are available)

export class VideoProcessor {
	private videoEl: HTMLVideoElement;
	private canvasEl: HTMLCanvasElement;
	private canvasCtx: CanvasRenderingContext2D;

	// Configuration
	private backgroundSource: string;
	private blurValue: number;
	private depth: number;
	private aspectRatio: number;
	private delegate: 'CPU' | 'GPU';

	// State
	private isRunning = false;
	private stream: MediaStream | null = null;
	private sx = 0;
	private sy = 0;
	private sWidth = 1280;
	private sHeight = 720;
	private backgroundImageData: ImageData | undefined;

	// MediaPipe Instances
	private imageSegmenter?: ImageSegmenter;
	private faceDetector?: FaceDetector;

	constructor(videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement, options: any) {
		this.videoEl = videoEl;
		this.canvasEl = canvasEl;
		this.canvasCtx = canvasEl.getContext('2d')!;

		// Set default and user-provided options
		this.backgroundSource = options.backgroundSource || 'blur';
		this.blurValue = options.blurValue || 10;
		this.depth = options.depth || 0.1;
		this.aspectRatio = options.aspectRatio || 16 / 9;
		this.delegate = options.delegate || 'GPU';
	}
	log1: any;
	async start() {
		if (this.isRunning) {
			console.warn('Processor is already running.');
			return;
		}
		this.log1 = throttle((...val: any) => {
			console.log(
				{
					'sx': this.sx,
					'sy': this.sy,
					'sWidth': this.sWidth,
					'sHeight': this.sHeight,
					5: 0,
					6: 0,
					'this.canvasEl.width': this.canvasEl.width,
					'this.canvasEl.height': this.canvasEl.height,
				},
				this.blurValue,
				...val,
			);
		});

		try {
			// Initialize MediaPipe models
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
			);
			this.imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath:
						'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite',
					delegate: this.delegate,
				},
				runningMode: 'VIDEO',
				outputConfidenceMasks: true,
			});

			// Get webcam stream
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: true,
			});
			this.videoEl.srcObject = this.stream;

			await new Promise((resolve) => {
				this.videoEl.onloadedmetadata = () => {
					this.videoEl.play();
					resolve(true);
				};
			});

			this.sWidth = this.videoEl.videoWidth;
			this.sHeight = this.videoEl.videoHeight;
			// this.canvasEl.width = this.sHeight * this.aspectRatio;
			// this.canvasEl.height = this.sHeight;
			this.canvasEl.style.aspectRatio = `${this.aspectRatio} / 1`;
			this.canvasEl.style.width = '100%';

			await this.prepareBackgroundImage();

			this.isRunning = true;
			this.autocropToFace();
			requestAnimationFrame(this.drawFrame.bind(this));
			console.log('Video processor started.');
		} catch (error) {
			console.error('Failed to start video processor:', error);
			this.stop(); // Cleanup on failure
			throw error;
		}
	}

	private drawFrame(now: number) {
		if (!this.isRunning) return;

		// STEP 1: Perform segmentation on the FULL, ORIGINAL video element.
		// This gives the most accurate mask.
		this.imageSegmenter?.segmentForVideo(this.videoEl, now, (result) => {
			// if (!result.confidenceMasks || !this.backgroundImageData) return;
			// The result.confidenceMasks[0] is now a mask for the ENTIRE 16:9 video frame.

			// STEP 2: Draw the background first (blur or image) onto the visible canvas.
			// This is more efficient than drawing pixel by pixel.
			if (this.backgroundSource === 'blur') {
				// This helper function creates a blurred version of the cropped video area
				this.prepareBlurBackground();
				this.canvasCtx.putImageData(this.backgroundImageData!, 0, 0);
			} else if (this.backgroundImageData) {
				// Or draw the pre-loaded background image
				this.canvasCtx.putImageData(this.backgroundImageData, 0, 0);
			} else {
				// Or just fill with a color
				this.canvasCtx.fillStyle = 'black';
				this.canvasCtx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);
			}

			// STEP 3: Draw the CROPPED FOREGROUND (the person) on top of the background.
			this.canvasCtx.globalCompositeOperation = 'destination-in';
			this.canvasCtx.drawImage(result.confidenceMasks![0], 0, 0, this.canvasEl.width, this.canvasEl.height);

			this.canvasCtx.globalCompositeOperation = 'source-in';
			// This is the key function call.
			// It takes a slice (sx, sy, sWidth, sHeight) from the source video...
			// ...and draws it to fill the destination canvas (0, 0, canvasEl.width, canvasEl.height).
			this.canvasCtx.drawImage(
				this.videoEl,
				this.sx,
				this.sy,
				this.sWidth,
				this.sHeight,
				0,
				0,
				this.canvasEl.width,
				this.canvasEl.height,
			);

			// Reset composite operation for the next frame
			this.canvasCtx.globalCompositeOperation = 'source-over';
		});

		requestAnimationFrame(this.drawFrame.bind(this));
	}

	private applyEffect(frame: ImageData, segmentationResult: ImageSegmenterResult) {
		if (!segmentationResult || !this.backgroundImageData) return;

		const mask = segmentationResult.confidenceMasks?.[0]?.getAsFloat32Array();
		if (!mask) return;

		const imageData = frame.data;
		for (let i = 0; i < mask.length; i++) {
			if (this.depth > 0 && mask[i] < this.depth) {
				this.log1('from applyEffect', i, mask[i], this.depth);
				const j = i * 4;
				imageData[j] = this.backgroundImageData[j];
				imageData[j + 1] = this.backgroundImageData[j + 1];
				imageData[j + 2] = this.backgroundImageData[j + 2];
				// imageData[j + 3] = this.backgroundImageData[j + 3]; // Alpha
			}
		}
	}

	/**
	 * Loads an image from a URL and converts it into pixel data for the background.
	 * This method is called internally when the background source is a URL.
	 */
	private async prepareBackgroundImage(): Promise<void> {
		if (this.backgroundSource === 'blur' || !this.backgroundSource) {
			this.backgroundImageData = undefined;
			return;
		}

		return new Promise((resolve, reject) => {
			const image = new Image();
			image.crossOrigin = 'Anonymous';
			image.src = this.backgroundSource;

			image.onload = () => {
				const tempCanvas = document.createElement('canvas');
				const tempCtx = tempCanvas.getContext('2d')!;
				// Set the canvas to the final output dimensions for a perfect match
				tempCanvas.width = this.canvasEl.width;
				tempCanvas.height = this.canvasEl.height;

				// Draw the image to fill the canvas, preserving aspect ratio by clipping
				const imgAspectRatio = image.width / image.height;
				const canvasAspectRatio = tempCanvas.width / tempCanvas.height;
				let renderWidth, renderHeight, xStart, yStart;

				if (imgAspectRatio > canvasAspectRatio) {
					renderHeight = tempCanvas.height;
					renderWidth = renderHeight * imgAspectRatio;
					xStart = -(renderWidth - tempCanvas.width) / 2;
					yStart = 0;
				} else {
					renderWidth = tempCanvas.width;
					renderHeight = renderWidth / imgAspectRatio;
					xStart = 0;
					yStart = -(renderHeight - tempCanvas.height) / 2;
				}

				tempCtx.drawImage(image, xStart, yStart, renderWidth, renderHeight);

				this.backgroundImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
				resolve();
			};

			image.onerror = (err) => {
				console.error('Failed to load background image.', err);
				reject(err);
			};
		});
	}

	/**
	 * Creates a blurred version of the current video frame to be used as a background.
	 * This method is called on each frame when the background source is 'blur'.
	 */
	private prepareBlurBackground(): void {
		if (!(this.blurValue > 0)) {
			this.backgroundImageData = undefined;
			return;
		}
		const tempCanvas = document.createElement('canvas');
		const tempCtx = tempCanvas.getContext('2d')!;
		tempCanvas.width = this.canvasEl.width;
		tempCanvas.height = this.canvasEl.height;

		// Apply a CSS blur filter
		tempCtx.filter = `blur(${this.blurValue}px)`;

		// Draw the cropped portion of the source video onto the temporary canvas
		tempCtx.drawImage(
			this.videoEl,
			this.sx,
			this.sy,
			this.sWidth,
			this.sHeight,
			0,
			0,
			tempCanvas.width,
			tempCanvas.height,
		);

		// Restore the context to avoid affecting other drawing operations if it were reused
		tempCtx.filter = 'none';

		this.backgroundImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
	}

	/**
	 * Detects a face in the video stream and calculates the crop parameters
	 * to center the face while maintaining the desired aspect ratio.
	 */
	public async autocropToFace(): Promise<void> {
		if (!this.isRunning) {
			console.warn('Cannot autocrop, processor is not running.');
			return;
		}

		// Initialize face detector on first use
		if (!this.faceDetector) {
			try {
				const vision = await FilesetResolver.forVisionTasks(
					'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
				);
				this.faceDetector = await FaceDetector.createFromOptions(vision, {
					baseOptions: {
						modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite`,
						delegate: this.delegate,
					},
					runningMode: 'IMAGE',
				});
			} catch (error) {
				console.error('Failed to initialize FaceDetector. Autocrop will not work.', error);
				return;
			}
		}

		const detections = this.faceDetector.detect(this.videoEl).detections;

		if (detections.length === 0) {
			console.log('No face detected for autocrop.');
			return;
		}

		// Use the first and likely most prominent detection
		const boundingBox = detections[0].boundingBox!;
		const videoWidth = this.videoEl.videoWidth;
		const videoHeight = this.videoEl.videoHeight;

		// Calculate the center of the detected face
		const faceCenterX = boundingBox.originX + boundingBox.width / 2;
		const faceCenterY = boundingBox.originY + boundingBox.height / 2;

		// Determine the new crop dimensions based on the aspect ratio.
		// We prioritize fitting the width to the video width, then calculate height.
		let newSWidth = videoWidth;
		let newSHeight = newSWidth / this.aspectRatio;

		// If the calculated height is greater than the video's actual height,
		// we must scale down based on the height instead.
		if (newSHeight > videoHeight) {
			newSHeight = videoHeight;
			newSWidth = newSHeight * this.aspectRatio;
		}

		// Calculate the new origin (top-left corner) for the crop
		let newSx = faceCenterX - newSWidth / 2;
		let newSy = faceCenterY - newSHeight / 2;

		// Ensure the crop area does not go outside the video boundaries
		newSx = Math.max(0, Math.min(newSx, videoWidth - newSWidth));
		newSy = Math.max(0, Math.min(newSy, videoHeight - newSHeight));

		// Update the class properties. The draw loop will use these values.
		this.sx = newSx;
		this.sy = newSy;
		this.sWidth = newSWidth;
		this.sHeight = newSHeight;

		console.log('Autocrop complete. New crop area:', {
			sx: this.sx,
			sy: this.sy,
			sWidth: this.sWidth,
			sHeight: this.sHeight,
		});
	}

	public stop() {
		this.isRunning = false;
		this.stream?.getTracks().forEach((track) => track.stop());
		this.imageSegmenter?.close();
		this.faceDetector?.close();
		this.videoEl.srcObject = null;
		console.log('Video processor stopped and resources released.');
	}

	public updateOptions(options: any) {
		// Set default and user-provided options
		this.backgroundSource = options.backgroundSource || 'blur';
		this.blurValue = Number.isInteger(options.blurValue) ? options.blurValue : 10;
		this.depth = Number.isInteger(options.depth) ? options.depth : 0.5;
		this.delegate = options.delegate || 'GPU';
		if (options.aspectRatio && this.aspectRatio !== options.aspectRatio) {
			this.aspectRatio = options.aspectRatio;
			this.stop();
			this.start();
		}
	}
}
