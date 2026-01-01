import axios from 'axios';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { Repos } from '../../pages/homepage/userModel';
import './style.css';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Container } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { motion, useInView, Variants } from 'framer-motion';
import { VideoBGEffectModal } from '../videobgeffectmodal';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface Props {
	name?: string;
	github?: string;
	projects?: any[];
	filteredProjects?: string[];
	projectInfo: [{}];
	openSourceProjectsInfo: { [type: string]: any };
}

export default function Projects({
	name: profileName,
	github,
	projects,
	filteredProjects,
	projectInfo,
	openSourceProjectsInfo,
}: Props): ReactElement {
	const [gitRepos, setGitRepos] = useState<Repos[]>();
	console.log('projectInfo:', projectInfo);

	useEffect(() => {
		const getGithubRepo = async () => {
			try {
				if (!profileName) return;

				const { data } = await axios.get(`https://api.github.com/users/${github || profileName}/repos`);
				setGitRepos(() => (data as Repos[]).filter(({ name }) => !filteredProjects?.includes(name)));
			} catch (error: any) {
				alert(error?.message);
			}
		};

		getGithubRepo();
	}, [profileName, filteredProjects, projects]);

	return (
		<Grid
			container
			spacing={4}
			columns={12}
			justifyContent="center"
			id="Project"
			sx={{ 
				padding: { xs: '40px 20px', md: '60px 40px' },
				maxWidth: '1400px',
				margin: '0 auto'
			}}
		>
			{projects?.map(({ id, name, popupComponent, img_url }, idx) => (
				<RenderpopupComponent
					key={idx}
					{...{
						name,
						html_url: null,
						description: openSourceProjectsInfo[name],
						idx,
						popupComponent,
						img_url,
					}}
				/>
			))}

			{projectInfo.map((info: any, idx) => (
				<Project {...info} key={idx + (projects?.length || 0)} />
			))}

			{(gitRepos as Repos[])?.map(({ id, name, owner: { html_url } }, idx) => (
				<Project
					key={id}
					{...{
						id,
						name,
						html_url,
						description: openSourceProjectsInfo[name],
						idx,
					}}
				/>
			))}
		</Grid>
	);
}
const cardVariants: Variants = {
	offscreen: (custom: number) => ({
		x: custom % 2 === 0 ? -200 : 200, // Alternate directions
		y: custom * 10, // Slight vertical offset for uniqueness
		opacity: 0,
		scale: 0.8,
		transition: {
			type: 'spring',
			bounce: 0.6,
			duration: 2,
		},
	}),
	onscreen: (custom: number) => ({
		x: 0,
		y: 0,
		opacity: 1,
		scale: 1,
		transition: {
			type: 'spring',
			bounce: 0.4,
			duration: 0.8,
			delay: (custom % 3) * 0.1, // Staggered delay within a row/view
		},
	}),
};

type ProjectProps = {
	name: string;
	description: string | null;
	html_url: string | null;
	idx: number;
	key: any;
};

function Project({ name, description, html_url, idx: custom }: ProjectProps): ReactElement | null {
	const [hasRendered, setHasRendered] = useState(false);
	const cardRef = useRef(null);
	const inView = useInView(cardRef, {
		amount: 0.1,
		once: true,
	});

	useEffect(() => {
		if (inView) {
			setHasRendered(true);
		}
	}, [inView]);

	if (!name && !description) return null;

	return (
		<motion.div
			className="card-container"
			ref={cardRef}
			custom={custom}
			variants={cardVariants}
			initial="offscreen"
			animate={hasRendered ? 'onscreen' : 'offscreen'}
			key={custom}
			style={{ 
				display: 'flex', 
				width: '100%',
				justifyContent: 'center'
			}}
		>
			{hasRendered && (
				<motion.div className="card" variants={cardVariants} style={{ border: 'none', width: '100%', maxWidth: '400px' }}>
					<Grid key={custom} size={{ xs: 12, sm: 10, md: 4 }}>
						<Card sx={{ width: '100%' }} className="box-shadow-14 my-3">
							<CardMedia
								sx={{ height: 140 }}
								image={'https://picsum.photos/690/280?random=' + custom}
								title="project preview"
							/>
							<CardContent>
								<Typography gutterBottom variant="h5" component="div">
									{name}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{description || ''}
								</Typography>
							</CardContent>
							<CardActions>
								{!!html_url && (
									<Button 
										size="small" 
										onClick={() => window.open(html_url + '/' + name, '_blank')}
										endIcon={<OpenInNewIcon sx={{ fontSize: '1rem' }} />}
									>
										Github
									</Button>
								)}
							</CardActions>
						</Card>
					</Grid>
				</motion.div>
			)}
		</motion.div>
	);
}

type ProjectWithPopup = {
	popupComponent: string;
	img_url: string;
} & ProjectProps;

function RenderpopupComponent({
	name,
	description,
	html_url,
	idx: custom,
	popupComponent,
	img_url,
}: ProjectWithPopup): ReactElement | null {
	const [hasRendered, setHasRendered] = useState(false);
	const [showPopup, setShowPopup] = useState(false);
	const cardRef = useRef(null);

	const inView = useInView(cardRef, {
		amount: 0.1,
		once: true,
	});

	useEffect(() => {
		if (inView) {
			setHasRendered(true);
		}
	}, [inView]);

	if (!name && !description) return null;
	return (
		<>
			<motion.div
				className="card-container"
				ref={cardRef}
				custom={custom}
				variants={cardVariants}
				initial="offscreen"
				animate={hasRendered ? 'onscreen' : 'offscreen'}
				style={{ 
					display: 'flex', 
					width: '100%',
					justifyContent: 'center'
				}}
			>
				{hasRendered && (
					<motion.div className="card" variants={cardVariants} style={{ border: 'none', width: '100%', maxWidth: '400px' }}>
						<Grid key={custom} size={{ xs: 12, sm: 10, md: 4 }}>
							<Card sx={{ width: '100%' }} className="box-shadow-14 my-3">
								<CardMedia
									sx={{ height: 140 }}
									image={img_url || 'https://picsum.photos/690/280?random=1'}
									title="Project Picture"
								/>
								<CardContent>
									<Typography gutterBottom variant="h5" component="div">
										{name}
									</Typography>
									<Typography variant="body2" color="text.secondary">
										{description || ''}
									</Typography>
								</CardContent>
								<CardActions>
									<Button 
										size="small" 
										onClick={() => setShowPopup(true)}
										endIcon={<OpenInNewIcon sx={{ fontSize: '1rem' }} />}
									>
										Open
									</Button>
								</CardActions>
							</Card>
						</Grid>
					</motion.div>
				)}
			</motion.div>
			{showPopup && popupComponent === 'VideoBGEffectModal' && (
				<VideoBGEffectModal {...{ open: showPopup, setOpen: setShowPopup }} />
			)}
		</>
	);
}
