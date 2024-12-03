import { Backdrop, Box, Fade, Modal, Typography } from '@mui/material';
import helper from 'csvtojson';
import { ReactElement, useEffect, useRef } from 'react';
import { addBackgroundEffect } from './videoBGEffect';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60vw',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export function VideoBGEffectModal({ open, setOpen }): ReactElement {
    const canvasEl = useRef<HTMLCanvasElement | null>(null);
    const videoEl = useRef<HTMLVideoElement | null>(null);

    const bgRef = useRef<any | null>(null);

    const handleClose = () => {
        setOpen(false);
        if (bgRef.current) {
            bgRef.current.resetVideoElements();
        }
    };

    useEffect(() => {
        if (open) {
            if (!videoEl.current || !canvasEl.current) return;
            const bgInstance = addBackgroundEffect(
                videoEl.current,
                canvasEl.current
            );
            bgRef.current = bgInstance;
            bgInstance.showCropVideo();
        }
    }, [open]);

    return (
        <Modal
            keepMounted
            open={open}
            onClose={handleClose}
            aria-labelledby='keep-mounted-modal-title'
            aria-describedby='keep-mounted-modal-description'
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
                        id='keep-mounted-modal-title'
                        variant='h6'
                        component='h2'
                    >
                        Video Background Effect
                    </Typography>
                    <div className='row'>
                        <div className='col-12'>
                            <video
                                src='/assets/videos/test.mp4'
                                width={'100%'}
                                controls={true}
                                ref={videoEl}
                                className='d-none'
                            ></video>
                            <canvas ref={canvasEl}></canvas>
                        </div>
                    </div>
                </Box>
            </Fade>
        </Modal>
    );
}
