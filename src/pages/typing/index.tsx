import { useState, useEffect, useRef } from 'react';

const MONO_STACK =
	'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const PRESSED_FLASH_MS = 140;

const INITIAL_KEYSET = ['e', 't', 'a', 'o', 'i', 'n'];
const INTRODUCTION_ORDER = [
	's',
	'h',
	'r',
	'd',
	'l',
	'c',
	'u',
	'm',
	'w',
	'f',
	'g',
	'y',
	'p',
	'b',
	'v',
	'k',
	'j',
	'x',
	'q',
	'z',
];
const HEATMAP_WINDOW = 20;
const ACCURACY_THRESHOLD = 0.95;
const SPEED_RATIO_THRESHOLD = 1.25;
const LESSON_WORD_COUNT = 12;
const LESSON_COMPLETE_HOLD_MS = 1600;
const UNLOCK_TOAST_MS = 3500;

const PROFILE_STORAGE_KEY = 'typing-trainer-profile';
const PROFILE_SCHEMA_VERSION = 1;

const DAILY_GOAL_DEFAULT_MS = 600 * 1000; // 10 minutes
const MAX_KEPT_DAYS = 30;

function localDateKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function pruneActiveTimeByDay(
	map: Record<string, number>,
): Record<string, number> {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - MAX_KEPT_DAYS);
	const cutoffKey = localDateKey(cutoff);
	return Object.fromEntries(
		Object.entries(map).filter(([day]) => day >= cutoffKey),
	);
}

type Category = 'literary' | 'tech' | 'code' | 'pangram';
type CategoryFilter = Category | 'all';

const CATEGORIES: Category[] = ['literary', 'tech', 'code', 'pangram'];

type LibraryEntry = {
	text: string;
	category: Category;
	source?: string;
};

const PASSAGE_LIBRARY: LibraryEntry[] = [
	// Literary
	{ text: 'the greatest enemy of knowledge is not ignorance, it is the illusion of knowledge.', category: 'literary', source: 'stephen hawking' },
	{ text: 'the only way to do great work is to love what you do.', category: 'literary', source: 'steve jobs' },
	{ text: 'in the depth of winter, i finally learned that within me there lay an invincible summer.', category: 'literary', source: 'albert camus' },
	{ text: 'all happy families are alike; each unhappy family is unhappy in its own way.', category: 'literary', source: 'tolstoy' },
	{ text: 'it was the best of times, it was the worst of times.', category: 'literary', source: 'dickens' },
	{ text: 'the future belongs to those who believe in the beauty of their dreams.', category: 'literary', source: 'eleanor roosevelt' },
	{ text: 'what we know is a drop, what we do not know is an ocean.', category: 'literary', source: 'isaac newton' },
	{ text: 'to be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.', category: 'literary', source: 'emerson' },

	// Tech
	{ text: 'simplicity is the ultimate sophistication.', category: 'tech', source: 'leonardo da vinci' },
	{ text: 'premature optimization is the root of all evil.', category: 'tech', source: 'donald knuth' },
	{ text: 'talk is cheap. show me the code.', category: 'tech', source: 'linus torvalds' },
	{ text: 'any sufficiently advanced technology is indistinguishable from magic.', category: 'tech', source: 'arthur c. clarke' },
	{ text: 'the best way to predict the future is to invent it.', category: 'tech', source: 'alan kay' },
	{ text: 'there are only two hard things in computer science: cache invalidation and naming things.', category: 'tech', source: 'phil karlton' },
	{ text: 'first, solve the problem. then, write the code.', category: 'tech', source: 'john johnson' },
	{ text: 'code is read much more often than it is written.', category: 'tech', source: 'guido van rossum' },

	// Code
	{ text: 'const sum = arr.reduce((acc, x) => acc + x, 0);', category: 'code' },
	{ text: 'function isEven(n) { return n % 2 === 0; }', category: 'code' },
	{ text: 'const filtered = users.filter(u => u.active);', category: 'code' },
	{ text: 'if (err) { console.error(err); return; }', category: 'code' },
	{ text: 'for (let i = 0; i < n; i++) { result.push(i * i); }', category: 'code' },
	{ text: 'async function fetchData() { return await fetch(url); }', category: 'code' },
	{ text: 'const [count, setCount] = useState(0);', category: 'code' },

	// Pangram
	{ text: 'the quick brown fox jumps over the lazy dog.', category: 'pangram' },
	{ text: 'pack my box with five dozen liquor jugs.', category: 'pangram' },
	{ text: 'how vexingly quick daft zebras jump!', category: 'pangram' },
	{ text: 'sphinx of black quartz, judge my vow.', category: 'pangram' },
	{ text: 'five quacking zephyrs jolt my wax bed.', category: 'pangram' },
	{ text: 'the five boxing wizards jump quickly.', category: 'pangram' },
	{ text: 'bright vixens jump; dozy fowl quack.', category: 'pangram' },
];

const CUSTOM_PASSAGE_MIN_CHARS = 20;
const CUSTOM_PASSAGE_MAX_CHARS = 500;

type FocusState = 'idle' | 'active';
type Mode = 'lesson' | 'passage';

type LetterStats = {
	accuracy: boolean[];
	speed: number[];
};
type Heatmap = Record<string, LetterStats>;

type PersistedProfile = {
	version: number;
	keyset: string[];
	heatmap: Heatmap;
	totalMs: number;
	totalCorrect: number;
	mode: Mode;
	activeTimeByDay: Record<string, number>;
	dailyGoalMs: number;
	tracking: boolean;
	passageCategory: CategoryFilter;
};

const DAILY_GOAL_PRESETS_MS: { label: string; ms: number }[] = [
	{ label: '5 min', ms: 5 * 60 * 1000 },
	{ label: '10 min', ms: 10 * 60 * 1000 },
	{ label: '15 min', ms: 15 * 60 * 1000 },
	{ label: '30 min', ms: 30 * 60 * 1000 },
];

function pickPassage(filter: CategoryFilter): string {
	const pool =
		filter === 'all'
			? PASSAGE_LIBRARY
			: PASSAGE_LIBRARY.filter((p) => p.category === filter);
	const choices = pool.length > 0 ? pool : PASSAGE_LIBRARY;
	return choices[Math.floor(Math.random() * choices.length)].text;
}

function generateLessonText(
	mode: Mode,
	keyset: string[],
	filter: CategoryFilter,
	customOverride: string | null,
): string {
	if (mode === 'lesson') return generateLesson(keyset);
	if (customOverride) return customOverride;
	return pickPassage(filter);
}

function loadProfile(): Partial<PersistedProfile> {
	if (typeof window === 'undefined') return {};
	try {
		const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		if (parsed?.version !== PROFILE_SCHEMA_VERSION) return {};
		return parsed;
	} catch {
		return {};
	}
}

function saveProfile(profile: PersistedProfile): void {
	if (typeof window === 'undefined') return;
	try {
		const pruned: PersistedProfile = {
			...profile,
			activeTimeByDay: pruneActiveTimeByDay(profile.activeTimeByDay),
		};
		window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(pruned));
	} catch {
		// quota exceeded / private mode / disabled — swallow silently
	}
}

function generateLesson(keyset: string[], wordCount = LESSON_WORD_COUNT): string {
	const words: string[] = [];
	for (let i = 0; i < wordCount; i++) {
		const len = 2 + Math.floor(Math.random() * 4);
		let w = '';
		for (let j = 0; j < len; j++) {
			w += keyset[Math.floor(Math.random() * keyset.length)];
		}
		words.push(w);
	}
	return words.join(' ');
}

function pushCapped<T>(arr: T[], v: T, cap: number): T[] {
	const next = arr.concat([v]);
	return next.length > cap ? next.slice(next.length - cap) : next;
}

function recordAttempt(
	heatmap: Heatmap,
	letter: string,
	firstTryCorrect: boolean,
	ms: number | null,
): Heatmap {
	const prev = heatmap[letter] ?? { accuracy: [], speed: [] };
	const accuracy = pushCapped(prev.accuracy, firstTryCorrect, HEATMAP_WINDOW);
	const speed =
		firstTryCorrect && ms !== null
			? pushCapped(prev.speed, ms, HEATMAP_WINDOW)
			: prev.speed;
	return { ...heatmap, [letter]: { accuracy, speed } };
}

function shouldGrowKeyset(
	heatmap: Heatmap,
	keyset: string[],
	profileAvgMs: number,
): boolean {
	if (!Number.isFinite(profileAvgMs) || profileAvgMs <= 0) return false;
	for (const letter of keyset) {
		const stats = heatmap[letter];
		if (!stats || stats.accuracy.length < HEATMAP_WINDOW) return false;
		const correctCount = stats.accuracy.filter(Boolean).length;
		const acc = correctCount / stats.accuracy.length;
		if (acc < ACCURACY_THRESHOLD) return false;
		if (stats.speed.length < HEATMAP_WINDOW) return false;
		const avgMs = stats.speed.reduce((s, x) => s + x, 0) / stats.speed.length;
		if (avgMs > SPEED_RATIO_THRESHOLD * profileAvgMs) return false;
	}
	return true;
}

function nextLetter(keyset: string[]): string | null {
	for (const l of INTRODUCTION_ORDER) if (!keyset.includes(l)) return l;
	return null;
}

export default function TypingTrainer() {
	const [focusState, setFocusState] = useState<FocusState>('idle');
	const [mode, setMode] = useState<Mode>(
		() => (loadProfile().mode === 'passage' ? 'passage' : 'lesson'),
	);
	const [keyset, setKeyset] = useState<string[]>(
		() => loadProfile().keyset ?? INITIAL_KEYSET,
	);
	const [lessonText, setLessonText] = useState<string>(() => {
		const p = loadProfile();
		const startingMode: Mode = p.mode === 'passage' ? 'passage' : 'lesson';
		return generateLessonText(
			startingMode,
			p.keyset ?? INITIAL_KEYSET,
			p.passageCategory ?? 'all',
			null,
		);
	});
	const [heatmap, setHeatmap] = useState<Heatmap>(
		() => loadProfile().heatmap ?? {},
	);
	const [typedChars, setTypedChars] = useState<string[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [errorChar, setErrorChar] = useState<string | null>(null);
	const [hasTyped, setHasTyped] = useState(false);
	const [correctCount, setCorrectCount] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [completed, setCompleted] = useState(false);
	const [pressedKey, setPressedKey] = useState<string | null>(null);
	const [recentUnlock, setRecentUnlock] = useState<string | null>(null);
	const [profileTotalMs, setProfileTotalMs] = useState(
		() => loadProfile().totalMs ?? 0,
	);
	const [profileTotalCorrect, setProfileTotalCorrect] = useState(
		() => loadProfile().totalCorrect ?? 0,
	);
	const [activeTimeByDay, setActiveTimeByDay] = useState<
		Record<string, number>
	>(() => loadProfile().activeTimeByDay ?? {});
	const [dailyGoalMs, setDailyGoalMs] = useState(
		() => loadProfile().dailyGoalMs ?? DAILY_GOAL_DEFAULT_MS,
	);
	const [tracking, setTracking] = useState<boolean>(
		() => loadProfile().tracking !== false,
	);
	const [passageCategory, setPassageCategory] = useState<CategoryFilter>(
		() => loadProfile().passageCategory ?? 'all',
	);
	const [customPassage, setCustomPassage] = useState<string | null>(null);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [pasteModalOpen, setPasteModalOpen] = useState(false);
	const [pasteInput, setPasteInput] = useState('');
	const [, setTick] = useState(0);

	const surfaceRef = useRef<HTMLDivElement>(null);
	const pressedClearRef = useRef<number | null>(null);
	const unlockClearRef = useRef<number | null>(null);
	const lastCorrectAtRef = useRef<number | null>(null);
	const errorOnCurrentRef = useRef<boolean>(false);
	const accumulatedMsRef = useRef(0);
	const stintStartRef = useRef<number | null>(null);
	const focusedSinceRef = useRef<number | null>(null);

	const elapsedMs =
		accumulatedMsRef.current +
		(stintStartRef.current !== null
			? Date.now() - stintStartRef.current
			: 0);

	useEffect(
		() => () => {
			if (pressedClearRef.current !== null)
				window.clearTimeout(pressedClearRef.current);
			if (unlockClearRef.current !== null)
				window.clearTimeout(unlockClearRef.current);
		},
		[],
	);

	useEffect(() => {
		saveProfile({
			version: PROFILE_SCHEMA_VERSION,
			keyset,
			heatmap,
			totalMs: profileTotalMs,
			totalCorrect: profileTotalCorrect,
			mode,
			activeTimeByDay,
			dailyGoalMs,
			tracking,
			passageCategory,
		});
	}, [
		keyset,
		heatmap,
		profileTotalMs,
		profileTotalCorrect,
		mode,
		activeTimeByDay,
		dailyGoalMs,
		tracking,
		passageCategory,
	]);

	const timerRunning = focusState === 'active' && hasTyped && !completed;

	useEffect(() => {
		if (!timerRunning) {
			if (stintStartRef.current !== null) {
				accumulatedMsRef.current += Date.now() - stintStartRef.current;
				stintStartRef.current = null;
			}
			return;
		}
		stintStartRef.current = Date.now();
		const id = window.setInterval(() => {
			setTick((t) => t + 1);
		}, 200);
		return () => {
			window.clearInterval(id);
			if (stintStartRef.current !== null) {
				accumulatedMsRef.current += Date.now() - stintStartRef.current;
				stintStartRef.current = null;
			}
		};
	}, [timerRunning]);

	useEffect(() => {
		if (focusState !== 'active') {
			lastCorrectAtRef.current = null;
			if (focusedSinceRef.current !== null) {
				const delta = Date.now() - focusedSinceRef.current;
				focusedSinceRef.current = null;
				const dayKey = localDateKey(new Date());
				setActiveTimeByDay((prev) => ({
					...prev,
					[dayKey]: (prev[dayKey] ?? 0) + delta,
				}));
			}
			return;
		}
		focusedSinceRef.current = Date.now();
		const onMouseDown = (e: MouseEvent) => {
			if (
				surfaceRef.current &&
				!surfaceRef.current.contains(e.target as Node)
			) {
				setFocusState('idle');
			}
		};
		document.addEventListener('mousedown', onMouseDown);
		const tickId = window.setInterval(
			() => setTick((t) => t + 1),
			500,
		);
		return () => {
			document.removeEventListener('mousedown', onMouseDown);
			window.clearInterval(tickId);
			if (focusedSinceRef.current !== null) {
				const delta = Date.now() - focusedSinceRef.current;
				focusedSinceRef.current = null;
				const dayKey = localDateKey(new Date());
				setActiveTimeByDay((prev) => ({
					...prev,
					[dayKey]: (prev[dayKey] ?? 0) + delta,
				}));
			}
		};
	}, [focusState]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (settingsOpen || pasteModalOpen) {
				if (e.key === 'Escape') {
					e.preventDefault();
					if (pasteModalOpen) {
						setPasteModalOpen(false);
						setPasteInput('');
					} else {
						setSettingsOpen(false);
					}
				}
				return;
			}

			if (focusState === 'idle') {
				if (e.key === 'Enter') {
					e.preventDefault();
					setFocusState('active');
				}
				return;
			}

			if (completed) return;

			if (mode === 'lesson') {
				if (e.key === 'Backspace' || e.key === ' ' || e.key === 'Tab') {
					e.preventDefault();
				}
				if (e.key === 'Backspace') return;
				if (e.key.length !== 1) return;

				if (!hasTyped) setHasTyped(true);

				setPressedKey(e.key.toLowerCase());
				if (pressedClearRef.current !== null)
					window.clearTimeout(pressedClearRef.current);
				pressedClearRef.current = window.setTimeout(
					() => setPressedKey(null),
					PRESSED_FLASH_MS,
				);

				const target = lessonText[currentIndex];
				if (e.key === target) {
					const now = Date.now();
					const isTrackable = /^[a-z]$/.test(target);
					if (isTrackable && tracking) {
						const firstTry = !errorOnCurrentRef.current;
						const ms =
							firstTry && lastCorrectAtRef.current !== null
								? now - lastCorrectAtRef.current
								: null;
						setHeatmap((prev) =>
							recordAttempt(prev, target, firstTry, ms),
						);
					}
					lastCorrectAtRef.current = now;
					errorOnCurrentRef.current = false;

					setCurrentIndex((i) => i + 1);
					setCorrectCount((c) => c + 1);
					setTotalCount((t) => t + 1);
					setErrorChar(null);
					if (currentIndex + 1 >= lessonText.length) {
						setCompleted(true);
					}
				} else {
					errorOnCurrentRef.current = true;
					setErrorChar(e.key);
					setTotalCount((t) => t + 1);
				}
				return;
			}

			// === Passage mode: allow-through with Backspace ===
			if (e.key === 'Backspace') {
				e.preventDefault();
				if (currentIndex > 0) {
					setTypedChars((prev) => prev.slice(0, -1));
					setCurrentIndex((i) => i - 1);
				}
				return;
			}
			if (e.key === ' ' || e.key === 'Tab') {
				e.preventDefault();
			}
			if (e.key.length !== 1) return;

			if (!hasTyped) setHasTyped(true);

			setPressedKey(e.key.toLowerCase());
			if (pressedClearRef.current !== null)
				window.clearTimeout(pressedClearRef.current);
			pressedClearRef.current = window.setTimeout(
				() => setPressedKey(null),
				PRESSED_FLASH_MS,
			);

			const target = lessonText[currentIndex];
			const correct = e.key === target;
			const now = Date.now();
			const isTrackable = /^[a-z]$/.test(target);
			if (isTrackable && tracking) {
				const ms =
					correct && lastCorrectAtRef.current !== null
						? now - lastCorrectAtRef.current
						: null;
				setHeatmap((prev) => recordAttempt(prev, target, correct, ms));
			}
			if (correct) lastCorrectAtRef.current = now;

			setTypedChars((prev) => [...prev, e.key]);
			setCurrentIndex((i) => i + 1);
			if (correct) setCorrectCount((c) => c + 1);
			setTotalCount((t) => t + 1);

			if (currentIndex + 1 >= lessonText.length) {
				setCompleted(true);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [
		focusState,
		currentIndex,
		hasTyped,
		completed,
		lessonText,
		mode,
		tracking,
		settingsOpen,
		pasteModalOpen,
	]);

	useEffect(() => {
		if (!completed) return;
		const lessonMs = accumulatedMsRef.current;
		const sessionMs = profileTotalMs + lessonMs;
		const sessionCorrect = profileTotalCorrect + correctCount;
		const profileAvgMs =
			sessionCorrect > 0 ? sessionMs / sessionCorrect : Infinity;
		const grew =
			tracking && shouldGrowKeyset(heatmap, keyset, profileAvgMs);
		const newLetter = grew ? nextLetter(keyset) : null;
		const nextKeyset = newLetter ? [...keyset, newLetter] : keyset;

		const t = window.setTimeout(() => {
			accumulatedMsRef.current = 0;
			stintStartRef.current = null;
			setProfileTotalMs(sessionMs);
			setProfileTotalCorrect(sessionCorrect);
			setKeyset(nextKeyset);
			setLessonText(
				generateLessonText(mode, nextKeyset, passageCategory, null),
			);
			setCustomPassage(null);
			setCurrentIndex(0);
			setTypedChars([]);
			setCorrectCount(0);
			setTotalCount(0);
			setHasTyped(false);
			setErrorChar(null);
			setCompleted(false);
			lastCorrectAtRef.current = null;
			errorOnCurrentRef.current = false;

			if (newLetter) {
				setRecentUnlock(newLetter);
				if (unlockClearRef.current !== null)
					window.clearTimeout(unlockClearRef.current);
				unlockClearRef.current = window.setTimeout(
					() => setRecentUnlock(null),
					UNLOCK_TOAST_MS,
				);
			}
		}, LESSON_COMPLETE_HOLD_MS);
		return () => window.clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [completed]);

	const minutes = elapsedMs / 60000;
	const wpm = minutes > 0 ? Math.round(correctCount / 5 / minutes) : 0;
	const accuracy =
		totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;

	const todayKey = localDateKey(new Date());
	const todaysActiveTime =
		(activeTimeByDay[todayKey] ?? 0) +
		(focusedSinceRef.current !== null
			? Date.now() - focusedSinceRef.current
			: 0);

	function resetRun(nextMode: Mode, nextText: string) {
		accumulatedMsRef.current = 0;
		stintStartRef.current = null;
		lastCorrectAtRef.current = null;
		errorOnCurrentRef.current = false;
		setMode(nextMode);
		setLessonText(nextText);
		setCurrentIndex(0);
		setTypedChars([]);
		setCorrectCount(0);
		setTotalCount(0);
		setHasTyped(false);
		setErrorChar(null);
		setCompleted(false);
		setFocusState('idle');
	}

	function handleModeChange(next: Mode) {
		if (next === mode) return;
		resetRun(next, generateLessonText(next, keyset, passageCategory, null));
	}

	function handleTrackingChange(next: boolean) {
		setTracking(next);
		if (!next && mode === 'lesson') handleModeChange('passage');
	}

	function handleCategoryChange(next: CategoryFilter) {
		if (next === passageCategory) return;
		setPassageCategory(next);
		if (mode === 'passage') {
			setCustomPassage(null);
			resetRun('passage', pickPassage(next));
		}
	}

	function handleUseCustomPassage(text: string) {
		const trimmed = text.trim();
		if (
			trimmed.length < CUSTOM_PASSAGE_MIN_CHARS ||
			trimmed.length > CUSTOM_PASSAGE_MAX_CHARS
		) {
			return;
		}
		const normalized = trimmed.toLowerCase();
		setCustomPassage(normalized);
		setPasteModalOpen(false);
		setPasteInput('');
		resetRun('passage', normalized);
	}

	return (
		<div
			className="min-h-screen flex flex-col"
			style={{
				backgroundColor: 'oklch(0.20 0.02 245)',
				color: 'oklch(0.93 0 0)',
				fontFamily: MONO_STACK,
			}}
		>
			<div className="flex justify-center items-end gap-12 py-8">
				<Metric label="WPM" value={String(wpm)} />
				<Metric label="Accuracy" value={`${accuracy}%`} />
				<KeysetDisplay keyset={keyset} recentUnlock={recentUnlock} />
				<DailyGoalDisplay
					activeMs={todaysActiveTime}
					goalMs={dailyGoalMs}
				/>
			</div>

			<div className="flex justify-center pb-2">
				<ModeToggle
					mode={mode}
					tracking={tracking}
					onChange={handleModeChange}
				/>
			</div>

			{mode === 'passage' && (
				<div className="flex justify-center pb-2">
					<PassageControls
						category={passageCategory}
						onCategoryChange={handleCategoryChange}
						customActive={customPassage !== null}
						onPasteClick={() => {
							setPasteInput('');
							setPasteModalOpen(true);
						}}
					/>
				</div>
			)}

			<SettingsButton onClick={() => setSettingsOpen(true)} />

			{pasteModalOpen && (
				<PasteModal
					value={pasteInput}
					onChange={setPasteInput}
					onCancel={() => {
						setPasteModalOpen(false);
						setPasteInput('');
					}}
					onUse={handleUseCustomPassage}
				/>
			)}

			{settingsOpen && (
				<SettingsModal
					tracking={tracking}
					onTrackingChange={handleTrackingChange}
					dailyGoalMs={dailyGoalMs}
					onDailyGoalChange={setDailyGoalMs}
					onClose={() => setSettingsOpen(false)}
				/>
			)}

			<div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
				<div
					ref={surfaceRef}
					className="flex flex-col items-center gap-12 w-full max-w-3xl"
				>
					<div className="relative w-full">
						<div
							className="text-2xl leading-relaxed tracking-wide select-none whitespace-pre-wrap break-words"
							style={{ minHeight: '8rem' }}
						>
							{lessonText.split('').map((char, i) => {
								let state:
									| 'typed'
									| 'typed-wrong'
									| 'current'
									| 'error'
									| 'pending';
								if (i < currentIndex) {
									if (mode === 'passage' && typedChars[i] !== char) {
										state = 'typed-wrong';
									} else {
										state = 'typed';
									}
								} else if (i === currentIndex) {
									state = errorChar ? 'error' : 'current';
								} else {
									state = 'pending';
								}
								return (
									<Char
										key={i}
										char={char}
										state={state}
										errorChar={errorChar}
									/>
								);
							})}
						</div>

						{focusState === 'idle' && (
							<button
								type="button"
								onClick={() => setFocusState('active')}
								className="absolute flex items-center justify-center cursor-pointer border-0"
								style={{
									top: '-2rem',
									right: '-2rem',
									bottom: '-2rem',
									left: '-2rem',
									backdropFilter: 'blur(6px)',
									WebkitBackdropFilter: 'blur(6px)',
									backgroundColor: 'oklch(0.20 0.02 245 / 0.55)',
									borderRadius: '0.75rem',
								}}
							>
								<span
									className="text-base"
									style={{ color: 'oklch(0.78 0 0)' }}
								>
									Click or press Enter to activate…
								</span>
							</button>
						)}

						{completed && (
							<div
								className="mt-12 text-center text-sm"
								style={{ color: 'oklch(0.78 0 0)' }}
							>
								Lesson complete — {wpm} WPM at {accuracy}% accuracy. Next
								lesson loading…
							</div>
						)}
					</div>

					<VirtualKeyboard
						targetChar={lessonText[currentIndex]}
						pressedKey={pressedKey}
					/>
				</div>
			</div>

			{import.meta.env.DEV && (
				<DebugPanel
					keyset={keyset}
					heatmap={heatmap}
					profileTotalMs={profileTotalMs + elapsedMs}
					profileTotalCorrect={profileTotalCorrect + correctCount}
				/>
			)}
		</div>
	);
}

function DebugPanel({
	keyset,
	heatmap,
	profileTotalMs,
	profileTotalCorrect,
}: {
	keyset: string[];
	heatmap: Heatmap;
	profileTotalMs: number;
	profileTotalCorrect: number;
}) {
	const profileAvgMs =
		profileTotalCorrect > 0 ? profileTotalMs / profileTotalCorrect : 0;
	const threshold = profileAvgMs * SPEED_RATIO_THRESHOLD;
	return (
		<div
			style={{
				position: 'fixed',
				bottom: '0.75rem',
				left: '0.75rem',
				padding: '0.6rem 0.8rem',
				borderRadius: '0.5rem',
				backgroundColor: 'oklch(0.16 0.02 245 / 0.92)',
				border: '1px solid oklch(0.35 0.02 245)',
				fontFamily: MONO_STACK,
				fontSize: '0.72rem',
				color: 'oklch(0.78 0 0)',
				maxWidth: '22rem',
				lineHeight: 1.5,
			}}
		>
			<div style={{ marginBottom: '0.35rem', color: 'oklch(0.55 0 0)' }}>
				DEBUG · profileAvg={profileAvgMs.toFixed(0)}ms · gate≤
				{threshold.toFixed(0)}ms · window={HEATMAP_WINDOW}
			</div>
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '0.8rem' }}>
				{keyset.map((letter) => {
					const stats = heatmap[letter];
					const accLen = stats?.accuracy.length ?? 0;
					const spdLen = stats?.speed.length ?? 0;
					const correct = stats?.accuracy.filter(Boolean).length ?? 0;
					const accPct = accLen > 0 ? (correct / accLen) * 100 : 0;
					const avgMs =
						spdLen > 0
							? stats!.speed.reduce((s, x) => s + x, 0) / spdLen
							: 0;
					const accOk = accLen >= HEATMAP_WINDOW && accPct >= ACCURACY_THRESHOLD * 100;
					const spdOk = spdLen >= HEATMAP_WINDOW && profileAvgMs > 0 && avgMs <= threshold;
					const allOk = accOk && spdOk;
					return (
						<div key={letter}>
							<span style={{ color: allOk ? 'oklch(0.75 0.18 145)' : 'oklch(0.78 0 0)' }}>
								{letter.toUpperCase()}
							</span>
							{' '}
							<span style={{ color: accOk ? 'oklch(0.75 0.18 145)' : 'oklch(0.65 0.18 25)' }}>
								{accPct.toFixed(0)}%[{accLen}]
							</span>
							{' '}
							<span style={{ color: spdOk ? 'oklch(0.75 0.18 145)' : 'oklch(0.65 0.18 25)' }}>
								{avgMs.toFixed(0)}ms[{spdLen}]
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function SettingsButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label="Settings"
			style={{
				position: 'fixed',
				top: '1rem',
				right: '1rem',
				width: '2.5rem',
				height: '2.5rem',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				borderRadius: '0.5rem',
				backgroundColor: 'oklch(0.25 0.02 245)',
				border: '1px solid oklch(0.32 0.02 245)',
				color: 'oklch(0.75 0 0)',
				cursor: 'pointer',
				zIndex: 40,
			}}
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<circle cx="12" cy="12" r="3" />
				<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
			</svg>
		</button>
	);
}

function SettingsModal({
	tracking,
	onTrackingChange,
	dailyGoalMs,
	onDailyGoalChange,
	onClose,
}: {
	tracking: boolean;
	onTrackingChange: (next: boolean) => void;
	dailyGoalMs: number;
	onDailyGoalChange: (next: number) => void;
	onClose: () => void;
}) {
	return (
		<div
			onClick={onClose}
			style={{
				position: 'fixed',
				inset: 0,
				backgroundColor: 'oklch(0.10 0.02 245 / 0.65)',
				backdropFilter: 'blur(4px)',
				WebkitBackdropFilter: 'blur(4px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 50,
				fontFamily: MONO_STACK,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					width: '26rem',
					padding: '1.5rem 1.75rem',
					backgroundColor: 'oklch(0.22 0.02 245)',
					border: '1px solid oklch(0.35 0.02 245)',
					borderRadius: '0.75rem',
					color: 'oklch(0.93 0 0)',
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '1.5rem',
					}}
				>
					<div
						style={{
							fontSize: '1.05rem',
							fontWeight: 500,
							letterSpacing: '0.05em',
						}}
					>
						Settings
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close settings"
						style={{
							width: '2rem',
							height: '2rem',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '0.4rem',
							backgroundColor: 'transparent',
							border: 'none',
							color: 'oklch(0.65 0 0)',
							cursor: 'pointer',
							fontSize: '1.2rem',
						}}
					>
						×
					</button>
				</div>

				<div style={{ marginBottom: '1.75rem' }}>
					<div
						style={{
							fontSize: '0.78rem',
							textTransform: 'uppercase',
							letterSpacing: '0.18em',
							color: 'oklch(0.55 0 0)',
							marginBottom: '0.6rem',
						}}
					>
						Tracking
					</div>
					<div
						style={{
							display: 'inline-flex',
							borderRadius: '0.5rem',
							padding: '0.25rem',
							backgroundColor: 'oklch(0.25 0.02 245)',
							border: '1px solid oklch(0.32 0.02 245)',
						}}
					>
						{[
							{ label: 'On', value: true },
							{ label: 'Off', value: false },
						].map((opt) => (
							<button
								key={opt.label}
								type="button"
								onClick={() => onTrackingChange(opt.value)}
								style={{
									padding: '0.35rem 1rem',
									borderRadius: '0.4rem',
									backgroundColor:
										tracking === opt.value
											? 'oklch(0.38 0.12 250)'
											: 'transparent',
									color:
										tracking === opt.value
											? 'oklch(0.95 0 0)'
											: 'oklch(0.65 0 0)',
									fontSize: '0.85rem',
									fontWeight: 500,
									border: 'none',
									cursor: 'pointer',
								}}
							>
								{opt.label}
							</button>
						))}
					</div>
					<div
						style={{
							marginTop: '0.6rem',
							fontSize: '0.75rem',
							lineHeight: 1.5,
							color: 'oklch(0.60 0 0)',
						}}
					>
						{tracking
							? 'Heatmap records your typing; Keyset grows with practice. Both Lesson and Passage modes available.'
							: 'No Heatmap is recorded and Keyset will not grow. Only Passage mode is available.'}
					</div>
				</div>

				<div>
					<div
						style={{
							fontSize: '0.78rem',
							textTransform: 'uppercase',
							letterSpacing: '0.18em',
							color: 'oklch(0.55 0 0)',
							marginBottom: '0.6rem',
						}}
					>
						Daily Goal
					</div>
					<div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
						{DAILY_GOAL_PRESETS_MS.map((preset) => {
							const active = preset.ms === dailyGoalMs;
							return (
								<button
									key={preset.label}
									type="button"
									onClick={() => onDailyGoalChange(preset.ms)}
									style={{
										padding: '0.4rem 0.85rem',
										borderRadius: '0.4rem',
										backgroundColor: active
											? 'oklch(0.38 0.12 250)'
											: 'oklch(0.25 0.02 245)',
										color: active
											? 'oklch(0.95 0 0)'
											: 'oklch(0.78 0 0)',
										border: '1px solid oklch(0.32 0.02 245)',
										fontSize: '0.85rem',
										fontWeight: 500,
										cursor: 'pointer',
										fontFamily: MONO_STACK,
									}}
								>
									{preset.label}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="text-center">
			<div
				className="uppercase tracking-[0.2em] text-xs"
				style={{ color: 'oklch(0.55 0 0)' }}
			>
				{label}
			</div>
			<div
				className="text-4xl font-medium mt-2"
				style={{ fontVariantNumeric: 'tabular-nums' }}
			>
				{value}
			</div>
		</div>
	);
}

function DailyGoalDisplay({
	activeMs,
	goalMs,
}: {
	activeMs: number;
	goalMs: number;
}) {
	const pct = Math.min(100, (activeMs / goalMs) * 100);
	const reached = activeMs >= goalMs;
	const fmt = (ms: number) => {
		const totalSec = Math.floor(ms / 1000);
		const m = Math.floor(totalSec / 60);
		const s = totalSec % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	};
	return (
		<div className="text-center">
			<div
				className="uppercase tracking-[0.2em] text-xs"
				style={{ color: 'oklch(0.55 0 0)' }}
			>
				Daily Goal
			</div>
			<div
				className="mt-2 flex flex-col items-center"
				style={{ height: '2.5rem' }}
			>
				<div
					style={{
						width: '8rem',
						height: '0.55rem',
						backgroundColor: 'oklch(0.28 0.02 245)',
						borderRadius: '0.3rem',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							width: `${pct}%`,
							height: '100%',
							backgroundColor: reached
								? 'oklch(0.65 0.18 145)'
								: 'oklch(0.55 0.16 250)',
							transition:
								'width 200ms ease, background-color 200ms ease',
						}}
					/>
				</div>
				<div
					className="text-xs mt-1.5"
					style={{
						color: 'oklch(0.65 0 0)',
						fontVariantNumeric: 'tabular-nums',
					}}
				>
					{fmt(activeMs)} / {fmt(goalMs)}
				</div>
			</div>
		</div>
	);
}

function KeysetDisplay({
	keyset,
	recentUnlock,
}: {
	keyset: string[];
	recentUnlock: string | null;
}) {
	return (
		<div className="text-center">
			<div
				className="uppercase tracking-[0.2em] text-xs"
				style={{ color: 'oklch(0.55 0 0)' }}
			>
				Keyset
			</div>
			<div className="mt-2 flex gap-1.5 items-center" style={{ height: '2.5rem' }}>
				{keyset.map((letter) => {
					const isNew = letter === recentUnlock;
					return (
						<span
							key={letter}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: '1.6rem',
								height: '1.6rem',
								borderRadius: '0.3rem',
								backgroundColor: isNew
									? 'oklch(0.55 0.18 145)'
									: 'oklch(0.28 0.02 245)',
								color: isNew
									? 'oklch(0.15 0.02 245)'
									: 'oklch(0.85 0 0)',
								fontSize: '0.85rem',
								fontWeight: 600,
								boxShadow: isNew
									? '0 0 0 2px oklch(0.70 0.18 145), 0 0 10px oklch(0.70 0.18 145 / 0.5)'
									: 'none',
								transition: 'background-color 200ms ease',
							}}
						>
							{letter.toUpperCase()}
						</span>
					);
				})}
			</div>
		</div>
	);
}

function Char({
	char,
	state,
	errorChar,
}: {
	char: string;
	state: 'typed' | 'typed-wrong' | 'current' | 'error' | 'pending';
	errorChar: string | null;
}) {
	if (state === 'error') {
		const display = errorChar === ' ' ? '␣' : (errorChar ?? char);
		return (
			<span
				style={{
					color: 'oklch(0.70 0.20 25)',
					backgroundColor: 'oklch(0.40 0.18 25 / 0.35)',
					borderRadius: '0.2rem',
					padding: '0 0.1rem',
				}}
			>
				{display}
			</span>
		);
	}
	if (state === 'current') {
		return (
			<span
				style={{
					color: 'oklch(0.20 0.02 245)',
					backgroundColor: 'oklch(0.93 0 0)',
					borderRadius: '0.2rem',
					padding: '0 0.1rem',
				}}
			>
				{char}
			</span>
		);
	}
	if (state === 'typed-wrong') {
		return (
			<span
				style={{
					color: 'oklch(0.70 0.20 25)',
					textDecoration: 'underline wavy',
					textDecorationColor: 'oklch(0.60 0.20 25)',
					textUnderlineOffset: '0.2em',
				}}
			>
				{char}
			</span>
		);
	}
	if (state === 'typed') {
		return <span style={{ color: 'oklch(0.93 0 0)' }}>{char}</span>;
	}
	return <span style={{ color: 'oklch(0.45 0 0)' }}>{char}</span>;
}

function PassageControls({
	category,
	onCategoryChange,
	customActive,
	onPasteClick,
}: {
	category: CategoryFilter;
	onCategoryChange: (next: CategoryFilter) => void;
	customActive: boolean;
	onPasteClick: () => void;
}) {
	const filters: CategoryFilter[] = ['all', ...CATEGORIES];
	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: '0.4rem',
				flexWrap: 'wrap',
				justifyContent: 'center',
			}}
		>
			{filters.map((f) => {
				const active = f === category && !customActive;
				return (
					<button
						key={f}
						type="button"
						onClick={() => onCategoryChange(f)}
						style={{
							padding: '0.3rem 0.7rem',
							borderRadius: '0.35rem',
							backgroundColor: active
								? 'oklch(0.38 0.12 250)'
								: 'oklch(0.25 0.02 245)',
							color: active ? 'oklch(0.95 0 0)' : 'oklch(0.70 0 0)',
							fontSize: '0.75rem',
							border: '1px solid oklch(0.32 0.02 245)',
							cursor: 'pointer',
							textTransform: 'capitalize',
							fontFamily: MONO_STACK,
						}}
					>
						{f}
					</button>
				);
			})}
			<div
				style={{
					width: '1px',
					height: '1.2rem',
					backgroundColor: 'oklch(0.32 0.02 245)',
					margin: '0 0.2rem',
				}}
			/>
			<button
				type="button"
				onClick={onPasteClick}
				style={{
					padding: '0.3rem 0.8rem',
					borderRadius: '0.35rem',
					backgroundColor: customActive
						? 'oklch(0.38 0.12 250)'
						: 'oklch(0.25 0.02 245)',
					color: customActive ? 'oklch(0.95 0 0)' : 'oklch(0.70 0 0)',
					fontSize: '0.75rem',
					border: '1px solid oklch(0.32 0.02 245)',
					cursor: 'pointer',
					fontFamily: MONO_STACK,
				}}
			>
				{customActive ? 'Custom ✓' : '+ Paste own'}
			</button>
		</div>
	);
}

function PasteModal({
	value,
	onChange,
	onCancel,
	onUse,
}: {
	value: string;
	onChange: (next: string) => void;
	onCancel: () => void;
	onUse: (text: string) => void;
}) {
	const trimmedLen = value.trim().length;
	const tooShort = trimmedLen < CUSTOM_PASSAGE_MIN_CHARS;
	const tooLong = trimmedLen > CUSTOM_PASSAGE_MAX_CHARS;
	const invalid = tooShort || tooLong;
	const counterColor = invalid
		? 'oklch(0.65 0.20 25)'
		: 'oklch(0.65 0 0)';

	return (
		<div
			onClick={onCancel}
			style={{
				position: 'fixed',
				inset: 0,
				backgroundColor: 'oklch(0.10 0.02 245 / 0.65)',
				backdropFilter: 'blur(4px)',
				WebkitBackdropFilter: 'blur(4px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 60,
				fontFamily: MONO_STACK,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					width: '32rem',
					padding: '1.5rem 1.75rem',
					backgroundColor: 'oklch(0.22 0.02 245)',
					border: '1px solid oklch(0.35 0.02 245)',
					borderRadius: '0.75rem',
					color: 'oklch(0.93 0 0)',
				}}
			>
				<div
					style={{
						fontSize: '1.05rem',
						fontWeight: 500,
						marginBottom: '1rem',
						letterSpacing: '0.05em',
					}}
				>
					Paste your own passage
				</div>
				<textarea
					autoFocus
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="Paste any text between 20 and 500 characters…"
					style={{
						width: '100%',
						minHeight: '8rem',
						padding: '0.75rem',
						borderRadius: '0.5rem',
						backgroundColor: 'oklch(0.18 0.02 245)',
						border: '1px solid oklch(0.32 0.02 245)',
						color: 'oklch(0.93 0 0)',
						fontFamily: MONO_STACK,
						fontSize: '0.9rem',
						lineHeight: 1.5,
						resize: 'vertical',
						outline: 'none',
					}}
				/>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginTop: '0.75rem',
						fontSize: '0.78rem',
						color: counterColor,
						fontVariantNumeric: 'tabular-nums',
					}}
				>
					<span>
						{trimmedLen} / {CUSTOM_PASSAGE_MAX_CHARS}
						{tooShort && ` · need at least ${CUSTOM_PASSAGE_MIN_CHARS}`}
						{tooLong && ' · too long'}
					</span>
					<span style={{ color: 'oklch(0.55 0 0)' }}>
						single-use, not saved
					</span>
				</div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '0.6rem',
						marginTop: '1.25rem',
					}}
				>
					<button
						type="button"
						onClick={onCancel}
						style={{
							padding: '0.5rem 1.1rem',
							borderRadius: '0.4rem',
							backgroundColor: 'transparent',
							color: 'oklch(0.70 0 0)',
							border: '1px solid oklch(0.32 0.02 245)',
							fontSize: '0.85rem',
							cursor: 'pointer',
							fontFamily: MONO_STACK,
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={invalid}
						onClick={() => onUse(value)}
						style={{
							padding: '0.5rem 1.3rem',
							borderRadius: '0.4rem',
							backgroundColor: invalid
								? 'oklch(0.28 0.02 245)'
								: 'oklch(0.38 0.12 250)',
							color: invalid ? 'oklch(0.50 0 0)' : 'oklch(0.95 0 0)',
							border: 'none',
							fontSize: '0.85rem',
							fontWeight: 500,
							cursor: invalid ? 'not-allowed' : 'pointer',
							fontFamily: MONO_STACK,
						}}
					>
						Use this passage
					</button>
				</div>
			</div>
		</div>
	);
}

function ModeToggle({
	mode,
	tracking,
	onChange,
}: {
	mode: Mode;
	tracking: boolean;
	onChange: (next: Mode) => void;
}) {
	const modes: Mode[] = tracking ? ['lesson', 'passage'] : ['passage'];
	return (
		<div
			style={{
				display: 'inline-flex',
				borderRadius: '0.55rem',
				padding: '0.25rem',
				backgroundColor: 'oklch(0.25 0.02 245)',
				border: '1px solid oklch(0.32 0.02 245)',
			}}
		>
			{modes.map((m) => (
				<button
					key={m}
					type="button"
					onClick={() => onChange(m)}
					style={{
						padding: '0.4rem 1.1rem',
						borderRadius: '0.4rem',
						backgroundColor:
							mode === m ? 'oklch(0.38 0.12 250)' : 'transparent',
						color: mode === m ? 'oklch(0.95 0 0)' : 'oklch(0.65 0 0)',
						fontSize: '0.85rem',
						fontWeight: 500,
						border: 'none',
						cursor: 'pointer',
						transition: 'background-color 120ms ease, color 120ms ease',
						textTransform: 'capitalize',
					}}
				>
					{m}
				</button>
			))}
		</div>
	);
}

function VirtualKeyboard({
	targetChar,
	pressedKey,
}: {
	targetChar: string | undefined;
	pressedKey: string | null;
}) {
	return (
		<div className="flex flex-col items-center gap-2 select-none">
			{KEYBOARD_ROWS.map((row, rowIdx) => (
				<div
					key={rowIdx}
					className="flex gap-2"
					style={{ paddingLeft: `${rowIdx * 1.5}rem` }}
				>
					{row.split('').map((k) => (
						<Key
							key={k}
							label={k.toUpperCase()}
							isTarget={targetChar === k}
							isPressed={pressedKey === k}
						/>
					))}
				</div>
			))}
			<Key
				label=""
				wide
				isTarget={targetChar === ' '}
				isPressed={pressedKey === ' '}
			/>
		</div>
	);
}

function Key({
	label,
	wide,
	isTarget,
	isPressed,
}: {
	label: string;
	wide?: boolean;
	isTarget: boolean;
	isPressed: boolean;
}) {
	const base = 'oklch(0.28 0.02 245)';
	const targetBg = 'oklch(0.38 0.12 250)';
	const pressedBg = 'oklch(0.93 0 0)';
	const targetGlow =
		'0 0 0 2px oklch(0.65 0.16 250), 0 0 12px oklch(0.65 0.16 250 / 0.45)';
	const restShadow = '0 1px 0 oklch(0 0 0 / 0.35)';
	return (
		<div
			style={{
				width: wide ? '16rem' : '2.75rem',
				height: wide ? '2.5rem' : '2.75rem',
				marginTop: wide ? '0.25rem' : 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				borderRadius: '0.4rem',
				backgroundColor: isPressed ? pressedBg : isTarget ? targetBg : base,
				color: isPressed ? 'oklch(0.20 0.02 245)' : 'oklch(0.85 0 0)',
				boxShadow: isTarget && !isPressed ? targetGlow : restShadow,
				transform: isPressed ? 'scale(0.94)' : 'scale(1)',
				transition: 'background-color 80ms ease, transform 80ms ease',
				fontWeight: 500,
				fontSize: '0.9rem',
			}}
		>
			{label}
		</div>
	);
}
