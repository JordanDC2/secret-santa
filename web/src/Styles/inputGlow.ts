/**
 * Feeds the glowing fields in index.less: on every mouse move (and scroll), tells each
 * form field where the mouse is relative to it, as --glow-x / --glow-y. Mouse only:
 * touch screens just get the focused look. At most once per frame.
 */
export function trackPointerForInputGlow() {
	if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
		return;
	}

	let x = -9999;
	let y = -9999;
	let frame = 0;

	function update() {
		frame = 0;
		document.querySelectorAll<HTMLElement>(".mantine-Input-wrapper").forEach((field) => {
			const box = field.getBoundingClientRect();
			field.style.setProperty("--glow-x", `${x - box.left}px`);
			field.style.setProperty("--glow-y", `${y - box.top}px`);
		});
	}

	function schedule() {
		frame ||= requestAnimationFrame(update);
	}

	window.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType === "mouse") {
				x = event.clientX;
				y = event.clientY;
				schedule();
			}
		},
		{ passive: true },
	);
	// Scrolling (the page, or a modal) moves fields under a still mouse.
	window.addEventListener("scroll", schedule, { passive: true, capture: true });
}
