import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, CircularProgress, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Document, Page, pdfjs } from 'react-pdf';
import '/src/components/resumeModal/style.css';

// Set the worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ResumeModalProps {
	open: boolean;
	onClose: () => void;
	resumeUrl: string;
}

const ResumeModal: React.FC<ResumeModalProps> = ({ open, onClose, resumeUrl }) => {
	const [numPages, setNumPages] = useState<number | null>(null);
	const [pageNumber, setPageNumber] = useState(1);

	function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
		setNumPages(numPages);
	}

	return (
		<Dialog 
			open={open} 
			onClose={onClose} 
			maxWidth="lg" 
			fullWidth 
			scroll="body"
			PaperProps={{
				sx: {
					bgcolor: 'transparent',
					boxShadow: 'none',
					overflow: 'visible',
				}
			}}
			sx={{
				'& .MuiDialog-container': {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
				}
			}}
		>
			<IconButton
				aria-label="close"
				onClick={onClose}
				sx={{
					position: 'fixed',
					top: 16,
					right: 16,
					color: 'white',
					bgcolor: 'rgba(0,0,0,0.5)',
					'&:hover': {
						bgcolor: 'rgba(0,0,0,0.8)',
					},
					zIndex: 2000,
				}}
			>
				<CloseIcon fontSize="large" />
			</IconButton>
			<DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', overflow: 'visible' }}>
				<Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					<Document
						file={resumeUrl}
						onLoadSuccess={onDocumentLoadSuccess}
						loading={<CircularProgress sx={{ my: 4, color: 'white' }} />}
						error={<Typography color="error">Failed to load resume. Please try again later.</Typography>}
					>
						{Array.from(new Array(numPages || 0), (el, index) => (
							<Box key={`page_${index + 1}`} sx={{ mb: 4, boxShadow: 10 }}>
								<Page 
									pageNumber={index + 1} 
									width={Math.min(window.innerWidth * 0.9, 900)}
									renderTextLayer={false}
									renderAnnotationLayer={false}
								/>
							</Box>
						))}
					</Document>
				</Box>
			</DialogContent>
		</Dialog>
	);
};

export default ResumeModal;
