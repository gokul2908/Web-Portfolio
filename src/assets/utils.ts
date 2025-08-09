export function throttle(func: Function, delay: number = 1000) {
	let lastCall = 0;
	return function (this: unknown, ...args: unknown[]) {
		const now = new Date().getTime();
		if (now - lastCall >= delay) {
			lastCall = now;
			func.apply(this, args);
		}
	};
}
