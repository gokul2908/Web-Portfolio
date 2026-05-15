import './App.css';
import Homepage from './pages/homepage';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React from 'react';
import Users from './pages/users';
import TicTacToe3D from './pages/tictaktoe3d';
import TypingTrainer from './pages/typing';

const router = createBrowserRouter([
	{
		path: '/',
		element: <Users />,
	},
	{
		path: '/tictactoe',
		element: <TicTacToe3D />,
	},
	{
		path: '/typing',
		element: <TypingTrainer />,
	},
	{
		path: '/:name',
		element: <Homepage />,
	},
]);

function App() {
	return (
		<React.StrictMode>
			<RouterProvider router={router} />
		</React.StrictMode>
	);
}

export default App;
