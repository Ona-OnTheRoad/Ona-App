// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { shouldIgnoreSheetGesture } from "./gesture-guard";

function build() {
  const sheet = document.createElement("div");
  sheet.innerHTML = `
    <h2 id="title">Enter vehicle</h2>
    <input id="field" />
    <ul role="listbox"><li><button role="option" id="opt">Toyota</button></li></ul>
    <div id="body"><p id="text">hello</p></div>`;
  document.body.appendChild(sheet);
  return sheet;
}

describe("shouldIgnoreSheetGesture", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("lets the sheet close from non-interactive areas", () => {
    const sheet = build();
    expect(shouldIgnoreSheetGesture(sheet.querySelector("#title"), sheet)).toBe(
      false,
    );
  });

  it("ignores form controls and dropdown options", () => {
    const sheet = build();
    expect(shouldIgnoreSheetGesture(sheet.querySelector("#field"), sheet)).toBe(
      true,
    );
    expect(shouldIgnoreSheetGesture(sheet.querySelector("#opt"), sheet)).toBe(
      true,
    );
  });

  it("ignores a body that has been scrolled down", () => {
    const sheet = build();
    const body = sheet.querySelector("#body") as HTMLElement;
    Object.defineProperty(body, "scrollTop", { value: 40 });
    Object.defineProperty(body, "scrollHeight", { value: 400 });
    Object.defineProperty(body, "clientHeight", { value: 200 });
    expect(shouldIgnoreSheetGesture(sheet.querySelector("#text"), sheet)).toBe(
      true,
    );
  });
});
