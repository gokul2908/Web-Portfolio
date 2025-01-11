import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";

// const pages = ['Products', 'Pricing', 'Blog'];
const settings = ["Profile", "Account", "Dashboard", "Logout"];

function ResponsiveAppBar({ logo, navigation, contactNo, resumeLink }: Props) {
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
        null
    );
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
        null
    );

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const MyLink = ({ text, index }) => {
        // Determine the href
        const href = text === "Resume" ? resumeLink : undefined;

        // Determine the icon
        const Icon = index % 2 === 0 ? InboxIcon : MailIcon;

        return (
            <a
                href={href}
                target={href ? "_blank" : undefined} // Open in new tab only if valid link
                rel={href ? "noopener noreferrer" : undefined} // Security for external links
                style={{ all: "inherit" }}
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
        <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={() => handleCloseNavMenu()}
        >
            <List>
                {navigation.map((text, index) => (
                    <ListItem key={text} disablePadding>
                        <ListItemButton>
                            <MyLink text={text} index={index}/>
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
                        <Box
                            component="section"
                            sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}
                        >
                            <img
                                src={logo}
                                alt="Logo"
                                width={60}
                                className="logo-icon"
                            />
                        </Box>
                    </a>

                    <Box
                        sx={{
                            flexGrow: 1,
                            display: { xs: "flex", md: "none" },
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

                        <Drawer
                            open={Boolean(anchorElNav)}
                            onClose={() => handleCloseNavMenu()}
                        >
                            {DrawerList}
                        </Drawer>
                    </Box>
                    <Box
                        component="section"
                        sx={{
                            display: { xs: "flex", md: "none" },
                            mr: 1,
                            flexGrow: 1,
                        }}
                    >
                        <a href=".">
                            <img
                                src={logo}
                                alt="Logo"
                                width={60}
                                className="logo-icon"
                            />
                        </a>
                    </Box>
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: { xs: "none", md: "flex" },
                        }}
                    >
                        {navigation.map((page) => (
                            <a
                                href={
                                    page === "Resume"
                                        ? resumeLink
                                        : "javascript:;"
                                }
                                target="_blank"
                            >
                                <Button
                                    key={page}
                                    onClick={handleCloseNavMenu}
                                    sx={{
                                        my: 2,
                                        color: "white",
                                        display: "block",
                                    }}
                                >
                                    {page}
                                </Button>
                            </a>
                        ))}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
export default ResponsiveAppBar;

// import Button as customBtn from '../customButton';
import "./style.css";
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from "@mui/material";

interface Props {
    logo: string;
    contactNo?: number;
    navigation: string[];
    resumeLink?: string;
}

function Nav({ logo, navigation, contactNo }: Props): any {
    const options = [
        "Home",
        "Services",
        "Testimonial",
        "FAQ",
        "Portfolio",
        "Contacts",
    ];
    console.log(navigation);
    return (
        <nav className="navbar navbar-expand-lg navbar-dark menu shadow fixed-top px-3">
            <a className="navbar-brand" href="#">
                <img src={logo} alt="logo_image" />
            </a>
            <button
                className="navbar-toggler bg-primary bg-opacity-75"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>
            <div
                className="collapse navbar-collapse justify-content-end"
                id="navbarSupportedContent"
            >
                <ul className="navbar-nav mb-2 mb-lg-0">
                    <NavSideOptions options={navigation} />
                </ul>
                {/* {!!contactNo && (
                    <Button
                        text={'+91' + contactNo}
                        icon={<i className='fas fa-phone' />}
                    />
                )} */}
            </div>
        </nav>
    );
}

function NavSideOptions({
    active,
    options,
}: {
    active?: boolean;
    options: Array<string>;
}) {
    return (
        <>
            {options.map((option, i) => {
                return (
                    <li className="nav-item" key={i}>
                        <a className="nav-link" href={"#" + option}>
                            {option}
                        </a>
                    </li>
                );
            })}
        </>
    );
}
