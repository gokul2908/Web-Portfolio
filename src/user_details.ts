const user: any = [
	{
		name: 'gokul',
		github: 'gokul2908',
		metaTitle: 'Gokul Portfolio',
		logo: './images/gokul_logo.png',
		contactNo: 8825874403,
		introText: [
			'I am Gokulkumar',
			'Portfolio using React, Typescript, material UI with animations & responsive layout',
		],
		video: 'https://www.youtube.com/watch?v=f02mOEt11OQ',
		navigation: ['Home', 'Project', 'Resume', 'Contact', 'LinkedIn'],
		resumeLink: '/assets/pdf/Resume_Gokulkumar.pdf',
		projects: [
			{
				name: 'Video Background Effect',
				description: '',
				popupComponent: 'VideoBGEffectModal',
				img_url: 'https://picsum.photos/id/58/690/280',
			},
		],
		email: 'gokulkumar2908@gmail.com',
		linkedin: 'https://www.linkedin.com/in/gokulkumar-m/',
		filteredProjects: ['ansys-fluent'],
		projectInfo: [{}],
		openSourceProjectsInfo: {
			'': null,
		},
	},
	{
		name: 'kesavamuthu',
		metaTitle: 'K7 Portfolio',
		logo: './images/kesav_logo.jpg',
		introText: [
			' ',
			`My name is kesav. I've ${
				new Date().getFullYear() - 2017
			}+ years of experience in software development & team management...`,
		],
		video: 'https://www.youtube.com/embed/_luhn7TLfWU',
		navigation: ['Home', 'Project', 'Contact'],
		projects: [],
		email: 'kesavamuthu77@gmail.com',
		projectInfo: [
			{
				name: 'Medium like blogging CMS app.',
				description:
					"The CMS application, designed for both the Admin and User, was constructed within a single package. I, as a sole contributor, developed this application from start to finish, utilizing the outbox model to publish articles. The determination of various role-based permissions was achieved through the use of a Tree data structure and middleware. Additionally, dynamic loading was implemented to enhance the application's performance for end-users.",
				techStack: ['Next js', 'Prisma', 'React Js', 'Js', 'MUI'],
			},
		],
		openSourceProjectsInfo: {
			'': null,
		},
	},
];

export default user;
