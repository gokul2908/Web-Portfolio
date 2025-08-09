import React, { ReactElement, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface Player {
	name: string;
	color: string;
	mark: 'X' | 'O';
}

function TicTacToe3D(): ReactElement {
	const mountRef = useRef<HTMLDivElement>(null);

	const [player1, setPlayer1] = useState<Player>({
		name: '',
		color: '#ff4444',
		mark: 'X',
	});
	const [player2, setPlayer2] = useState<Player>({
		name: '',
		color: '#44aaff',
		mark: 'O',
	});
	const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
	const [gameStarted, setGameStarted] = useState(false);
	const [winner, setWinner] = useState<string | null>(null);

	useEffect(() => {
		if (!mountRef.current || !gameStarted) return;

		// Scene Setup
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#f5f5f5');

		const camera = new THREE.PerspectiveCamera(
			45,
			mountRef.current.clientWidth / mountRef.current.clientHeight,
			0.1,
			1000,
		);
		camera.position.set(4, 6, 4);

		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
		mountRef.current.appendChild(renderer.domElement);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;

		// Lighting
		const ambient = new THREE.AmbientLight(0xffffff, 0.8);
		scene.add(ambient);
		const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
		dirLight.position.set(5, 10, 5);
		scene.add(dirLight);

		// Board
		const gridSize = 3;
		const cellSize = 1.5;
		const cells: THREE.Mesh[] = [];
		const cellGeo = new THREE.PlaneGeometry(cellSize, cellSize);

		const half = ((gridSize - 1) * cellSize) / 2;

		for (let row = 0; row < gridSize; row++) {
			for (let col = 0; col < gridSize; col++) {
				const cellMat = new THREE.MeshStandardMaterial({
					color: '#ddd',
					side: THREE.DoubleSide,
				});
				const cell = new THREE.Mesh(cellGeo, cellMat);
				cell.rotation.x = -Math.PI / 2;
				cell.position.set(col * cellSize - half, 0, row * cellSize - half);
				cell.userData = { row, col, mark: null };
				scene.add(cell);
				cells.push(cell);

				// Border lines
				const border = new THREE.LineSegments(
					new THREE.EdgesGeometry(cellGeo),
					new THREE.LineBasicMaterial({ color: '#999' }),
				);
				border.rotation.x = -Math.PI / 2;
				border.position.copy(cell.position);
				scene.add(border);
			}
		}

		// Raycaster
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();
		const marks: THREE.Mesh[] = [];

		function checkWinCondition() {
			const boardState: (null | 'X' | 'O')[][] = Array.from({ length: 3 }, () => Array(3).fill(null));
			cells.forEach((cell) => {
				boardState[cell.userData.row][cell.userData.col] = cell.userData.mark;
			});

			const lines = [
				// rows
				[boardState[0][0], boardState[0][1], boardState[0][2]],
				[boardState[1][0], boardState[1][1], boardState[1][2]],
				[boardState[2][0], boardState[2][1], boardState[2][2]],
				// cols
				[boardState[0][0], boardState[1][0], boardState[2][0]],
				[boardState[0][1], boardState[1][1], boardState[2][1]],
				[boardState[0][2], boardState[1][2], boardState[2][2]],
				// diagonals
				[boardState[0][0], boardState[1][1], boardState[2][2]],
				[boardState[0][2], boardState[1][1], boardState[2][0]],
			];

			for (const line of lines) {
				if (line[0] && line[0] === line[1] && line[1] === line[2]) {
					return line[0];
				}
			}

			return null;
		}

		const onClick = (event: MouseEvent) => {
			if (winner) return;

			const rect = renderer.domElement.getBoundingClientRect();
			mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObjects(cells);

			if (intersects.length > 0) {
				const cell = intersects[0].object as THREE.Mesh & {
					userData: any;
				};
				if (cell.userData.mark) return; // Already filled

				const markMesh =
					currentPlayer?.mark === 'X'
						? new THREE.Mesh(
								new THREE.BoxGeometry(0.8, 0.2, 0.8),
								new THREE.MeshStandardMaterial({
									color: currentPlayer?.color,
								}),
							)
						: new THREE.Mesh(
								new THREE.TorusGeometry(0.4, 0.15, 16, 100),
								new THREE.MeshStandardMaterial({
									color: currentPlayer?.color,
								}),
							);

				if (currentPlayer?.mark === 'O') {
					markMesh.rotation.x = Math.PI / 2;
				}

				markMesh.position.copy(cell.position).setY(0.2);
				scene.add(markMesh);
				marks.push(markMesh);

				cell.userData.mark = currentPlayer?.mark;

				const win = checkWinCondition();
				if (win) {
					setWinner(win === player1.mark ? player1.name : player2.name);
					return;
				}

				setCurrentPlayer((prev) => (prev?.mark === player1.mark ? player2 : player1));
			}
		};

		renderer.domElement.addEventListener('click', onClick);

		// Animate
		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		// Cleanup
		return () => {
			renderer.domElement.removeEventListener('click', onClick);
			mountRef.current?.removeChild(renderer.domElement);
		};
	}, [gameStarted, player1, player2]);

	const startGame = () => {
		// Random first player
		const first = Math.random() < 0.5 ? player1 : player2;
		setCurrentPlayer(first);
		setWinner(null);
		setGameStarted(true);
	};

	return (
		<div className="w-full h-screen relative bg-gray-900 text-white">
			{!gameStarted && (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black bg-opacity-70 z-10 p-4">
					<h1 className="text-2xl font-bold mb-4">3D Tic Tac Toe</h1>
					<div className="flex gap-4">
						<div className="flex flex-col">
							<input
								type="text"
								placeholder="Player 1 Name"
								value={player1.name}
								onChange={(e) =>
									setPlayer1({
										...player1,
										name: e.target.value,
									})
								}
								className="p-2 text-black rounded"
							/>
							<input
								type="color"
								value={player1.color}
								onChange={(e) =>
									setPlayer1({
										...player1,
										color: e.target.value,
									})
								}
								className="mt-2"
							/>
						</div>
						<div className="flex flex-col">
							<input
								type="text"
								placeholder="Player 2 Name"
								value={player2.name}
								onChange={(e) =>
									setPlayer2({
										...player2,
										name: e.target.value,
									})
								}
								className="p-2 text-black rounded"
							/>
							<input
								type="color"
								value={player2.color}
								onChange={(e) =>
									setPlayer2({
										...player2,
										color: e.target.value,
									})
								}
								className="mt-2"
							/>
						</div>
					</div>
					<button onClick={startGame} className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded">
						Start Game
					</button>
				</div>
			)}

			{gameStarted && (
				<div className="absolute top-4 left-4 z-10 p-2 bg-black bg-opacity-50 rounded">
					{winner ? (
						<div className="text-lg font-bold">{winner} Wins!</div>
					) : (
						<div className="text-lg">
							Current Turn:{' '}
							<span style={{ color: currentPlayer?.color }}>
								{currentPlayer?.name} ({currentPlayer?.mark})
							</span>
						</div>
					)}
				</div>
			)}

			<div className="w-full h-full" ref={mountRef}></div>
		</div>
	);
}

export default TicTacToe3D;
