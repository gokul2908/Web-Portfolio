import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import ResumeModal from '../resumeModal';

function ResponsiveAppBar({ logo, navigation, contactNo, resumeLink, email, linkedin }: Props) {
	const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
	const [isResumeOpen, setIsResumeOpen] = React.useState(false);

	const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorElNav(event.currentTarget);
	};

	const handleCloseNavMenu = () => {
		setAnchorElNav(null);
	};

	// No longer using GLightbox for resume

	const MyLink = ({ text, index }: { text: string; index: number }) => {
		// Determine the href
		let href: string | undefined = undefined;
		let onClick: ((e: React.MouseEvent) => void) | undefined = undefined;

		if (text === 'Resume') {
			onClick = (e: React.MouseEvent) => {
				e.preventDefault();
				setIsResumeOpen(true);
			};
		} else if (text === 'Project' || text === 'Home') {
			href = `#${text}`;
		} else if (text === 'Contact') {
			onClick = () =>
				(window.location.href = `mailto:${email}?subject=problem-to-solve&body=Define%20your%20awesome%20problem%20here`);
		}

		// Determine the icon
		const Icon = index % 2 === 0 ? InboxIcon : MailIcon;

		return (
			<a
				href={href || 'javascript:;'}
				onClick={onClick}
				style={{ all: 'inherit', cursor: 'pointer' }}
				aria-label={text} // Accessibility
				title={text} // Tooltip on hover
			>
				<ListItemIcon>
					<Icon />
				</ListItemIcon>
				<ListItemText primary={text} />
			</a>
		);
	};

	const DrawerList = (
		<Box sx={{ width: 250 }} role="presentation" onClick={() => handleCloseNavMenu()}>
			<List>
				{navigation.map((text, index) => (
					<ListItem key={text} disablePadding>
						<ListItemButton>
							<MyLink text={text} index={index} />
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</Box>
	);

	return (
		<AppBar position="fixed" sx={{}} className="nav-gradient">
			<Container maxWidth="xl">
				<Toolbar disableGutters>
					<a href=".">
						<Box component="section" sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}>
							<img src={logo} alt="Logo" width={60} className="logo-icon" />
						</Box>
					</a>

					<Box
						sx={{
							flexGrow: 1,
							display: { xs: 'flex', md: 'none' },
						}}
					>
						<IconButton
							size="large"
							aria-label="account of current user"
							aria-controls="menu-appbar"
							aria-haspopup="true"
							onClick={handleOpenNavMenu}
							color="inherit"
						>
							<MenuIcon />
						</IconButton>

						<Drawer open={Boolean(anchorElNav)} onClose={() => handleCloseNavMenu()}>
							{DrawerList}
						</Drawer>
					</Box>
					<Box
						component="section"
						sx={{
							display: { xs: 'flex', md: 'none' },
							mr: 1,
							flexGrow: 1,
						}}
					>
						<a href="." style={{ transform: 'translateX(-50%)' }}>
							<img src={logo} alt="Logo" width={60} className="logo-icon" />
						</a>
					</Box>
					<Box
						sx={{
							flexGrow: 1,
							display: { xs: 'none', md: 'flex' },
						}}
					>
						{navigation.map((page) => {
							let href = 'javascript:;';
							let onClick: ((e: React.MouseEvent) => void) | any = handleCloseNavMenu;

							if (page === 'Resume') {
								onClick = (e: React.MouseEvent) => {
									e.preventDefault();
									handleCloseNavMenu();
									setIsResumeOpen(true);
								};
							} else if (page === 'Project' || page === 'Home') {
								href = `#${page}`;
							} else if (page === 'Contact') {
								onClick = () => {
									handleCloseNavMenu();
									window.location.href = `mailto:${email}?subject=problem-to-solve&body=Define%20your%20awesome%20problem%20here`;
								};
							} else if (page === 'LinkedIn') {
								href = linkedin || '#';
								onClick = () => {
									handleCloseNavMenu();
									if (linkedin) window.open(linkedin, '_blank');
								};
							}

							return (
								<a
									key={page}
									href={href}
									style={{ textDecoration: 'none' }}
								>
									<Button
										onClick={onClick}
										sx={{
											my: 2,
											color: 'white',
											display: 'block',
										}}
									>
										{page}
									</Button>
								</a>
							);
						})}
					</Box>
				</Toolbar>
			</Container>
			<ResumeModal
				open={isResumeOpen}
				onClose={() => setIsResumeOpen(false)}
				resumeUrl={resumeLink || ''}
			/>
		</AppBar>
	);
}
export default ResponsiveAppBar;

import './style.css';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

interface Props {
	logo: string;
	contactNo?: number;
	navigation: string[];
	resumeLink?: string;
	email?: string;
	linkedin?: string;
}
