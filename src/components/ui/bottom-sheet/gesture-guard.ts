/**
 * Swipe-down-to-close must only fire for a deliberate sheet drag, never while
 * the user is working inside the content: typing, scrolling a list (such as a
 * make/model dropdown) or scrolling the sheet's own body.
 */
const INTERACTIVE =
  "input, select, textarea, [role='listbox'], [role='option'], [role='combobox'], [data-sheet-no-swipe]";

export function shouldIgnoreSheetGesture(
  target: EventTarget | null,
  sheet: Element | null,
): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== sheet) {
    if (el.matches(INTERACTIVE)) return true;
    // A scrolled container is being scrolled back up: that is not a close swipe.
    if (el.scrollTop > 0 && el.scrollHeight > el.clientHeight) return true;
    el = el.parentElement;
  }
  return false;
}
