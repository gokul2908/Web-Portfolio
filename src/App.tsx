import './App.css';
import Homepage from './pages/homepage';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React from 'react';
import Users from './pages/users';
import TicTacToe3D from './pages/tictaktoe3d';

const router = createBrowserRouter([
	{
		path: '/:name',
		element: <Homepage />,
	},
	{
		path: '/',
		element: <Users />,
	},
	{
		path: '/tictactoe',
		element: <TicTacToe3D />,
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
