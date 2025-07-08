import { Backdrop, Box, Fade, Modal, Typography } from "@mui/material";
import { ReactElement, useEffect, useRef, useState } from "react";
import { VideoProcessor } from "./videoBGEffect";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "60%",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
};

export function VideoBGEffectModal({ open, setOpen }): ReactElement {
    const [blurAmount, setBlurAmount] = useState(10); // 0 to 20 for blur radius
    const [selectedBackground, setSelectedBackground] = useState("none"); // 'none', 'image1', 'image2', 'image3'
    const [currentCropRatio, setCurrentCropRatio] = useState("16:9"); // '16:9', '4:3', '1:1'
    const backgroundImages = {
        image1: "https://placehold.co/640x480/007bff/ffffff?text=Nature",
        image2: "https://placehold.co/640x480/28a745/ffffff?text=City",
        image3: "https://placehold.co/640x480/dc3545/ffffff?text=Abstract",
    };

    const canvasEl = useRef<HTMLCanvasElement | null>(null);
    const videoEl = useRef<HTMLVideoElement | null>(null);

    const bgRef = useRef<any | null>(null);

    useEffect(() => {
        if (open) {
            if (!videoEl.current || !canvasEl.current) return;
            const bgInstance = new VideoProcessor(
                videoEl.current,
                canvasEl.current,
                {}
            );
            bgRef.current = bgInstance;
            bgInstance.start();
        }
    }, [open]);

    const handleClose = () => {
        setOpen(false);
        if (bgRef.current) {
            bgRef.current.stop();
        }
    };

    // Tailwind CSS classes for consistent styling
    const buttonClass =
        "px-4 py-2 rounded-md shadow-md transition-all duration-200 ease-in-out font-medium";
    const primaryButtonClass = `${buttonClass} bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75`;
    const dangerButtonClass = `${buttonClass} bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75`;
    const inputRangeClass =
        "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const optionButtonClass = (isSelected) =>
        `px-3 py-1 text-sm rounded-md border transition-all duration-200 ease-in-out ${
            isSelected
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
        }`;
    const imageOptionClass = (isSelected) =>
        `w-20 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${
            isSelected
                ? "border-blue-500 ring-2 ring-blue-500"
                : "border-gray-300 hover:border-blue-300"
        } transition-all duration-200 ease-in-out`;


    const getPaddingTopForRatio = () => {
        switch (currentCropRatio) {
            case "4:3":
                return "75%"; // 3/4 * 100%
            case "1:1":
                return "100%"; // 1/1 * 100%
            case "16:9":
            default:
                return "56.25%"; // 9/16 * 100%
        }
    };

    return (
        <Modal
            keepMounted
            open={open}
            onClose={handleClose}
            aria-labelledby="keep-mounted-modal-title"
            aria-describedby="keep-mounted-modal-description"
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{
                backdrop: {
                    timeout: 5000,
                },
            }}
        >
            <Fade in={open}>
                <Box sx={style}>
                    <Typography
                        id="keep-mounted-modal-title"
                        variant="h6"
                        component="h2"
                    >
                        Video Background Effect
                    </Typography>
                    <div className="row">
                        <div className="col-12">
                            {/* Pop-up Modal */}
                            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-6">
                                    {/* Video and Canvas Display Placeholder */}
                                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 rounded-lg p-2 min-h-[300px] md:min-h-[400px] relative overflow-hidden">
                                        {/* Aspect ratio container */}
                                        <div
                                            style={{
                                                paddingTop:
                                                    getPaddingTopForRatio(),
                                            }}
                                            className="relative w-full bg-gray-700 flex items-center justify-center rounded-md"
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center flex-col text-white text-lg font-semibold p-4 text-center">
                                                <canvas ref={canvasEl}></canvas>
                                                <video
                                                    src="/assets/videos/test.mp4"
                                                    width={"100%"}
                                                    controls={true}
                                                    ref={videoEl}
                                                    style={{ display: "none" }}
                                                ></video>
                                                <p className="text-sm text-gray-400 mt-2">
                                                    Current Crop:{" "}
                                                    {currentCropRatio} | Blur:{" "}
                                                    {blurAmount}px | Background:{" "}
                                                    {selectedBackground ===
                                                    "none"
                                                        ? "None"
                                                        : selectedBackground}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls Section */}
                                    <div className="w-full md:w-80 flex flex-col gap-5">
                                        <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-2">
                                            Camera Options
                                        </h2>

                                        {/* Crop Ratios */}
                                        <div>
                                            <label className={labelClass}>
                                                Crop Ratio
                                            </label>
                                            <div className="flex gap-2">
                                                {["16:9", "4:3", "1:1"].map(
                                                    (ratio) => (
                                                        <button
                                                            key={ratio}
                                                            onClick={() =>
                                                                setCurrentCropRatio(
                                                                    ratio
                                                                )
                                                            }
                                                            className={optionButtonClass(
                                                                currentCropRatio ===
                                                                    ratio
                                                            )}
                                                        >
                                                            {ratio}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Background Blur */}
                                        <div>
                                            <label
                                                htmlFor="blurRange"
                                                className={labelClass}
                                            >
                                                Background Blur
                                            </label>
                                            <input
                                                type="range"
                                                id="blurRange"
                                                min="0"
                                                max="20"
                                                value={blurAmount}
                                                onChange={(e) =>{
                                                    bgRef.current.updateOptions({blurValue: Number(e.target.value)});
                                                    setBlurAmount(
                                                        Number(e.target.value)
                                                    )}
                                                }
                                                className={inputRangeClass}
                                            />
                                            <span className="text-sm text-gray-500 mt-1 block">
                                                {blurAmount}px
                                            </span>
                                        </div>

                                        {/* Background Images */}
                                        <div>
                                            <label className={labelClass}>
                                                Background Image
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div
                                                    onClick={() =>
                                                        setSelectedBackground(
                                                            "none"
                                                        )
                                                    }
                                                    className={
                                                        imageOptionClass(
                                                            selectedBackground ===
                                                                "none"
                                                        ) +
                                                        " flex items-center justify-center text-sm font-medium text-gray-600 bg-gray-100"
                                                    }
                                                >
                                                    None
                                                </div>
                                                {Object.keys(
                                                    backgroundImages
                                                ).map((key) => (
                                                    <div
                                                        key={key}
                                                        onClick={() =>
                                                            setSelectedBackground(
                                                                key
                                                            )
                                                        }
                                                        className={imageOptionClass(
                                                            selectedBackground ===
                                                                key
                                                        )}
                                                    >
                                                        <img
                                                            src={
                                                                backgroundImages[
                                                                    key
                                                                ]
                                                            }
                                                            alt={key}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Close Button */}
                                        <div className="mt-auto pt-4 border-t">
                                            <button
                                                onClick={handleClose}
                                                className={
                                                    dangerButtonClass +
                                                    " w-full"
                                                }
                                            >
                                                Close UI
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Box>
            </Fade>
        </Modal>
    );
}
