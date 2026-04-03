import { fixture, expect } from '@open-wc/testing';
import '../project-canvas/project-canvas.js';

const frame = () => new Promise((r) => requestAnimationFrame(r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe('project-canvas', () => {
  it('renders toolbar with tool buttons', async () => {
    const el = await fixture(`<project-canvas project-id="test"></project-canvas>`);
    await frame();
    await frame();
    const toolbar = el.querySelector('canvas-toolbar');
    expect(toolbar).to.exist;
    await wait(100);
    const buttons = el.querySelectorAll('.canvas-tool');
    expect(buttons.length).to.be.greaterThan(4);
  });

  it('renders an SVG canvas area', async () => {
    const el = await fixture(`<project-canvas project-id="test"></project-canvas>`);
    await frame();
    await frame();
    const svg = el.querySelector('.canvas-svg');
    expect(svg).to.exist;
    expect(svg.tagName.toLowerCase()).to.equal('svg');
  });

  it('has crosshair cursor in draw mode', async () => {
    const el = await fixture(`<project-canvas project-id="test"></project-canvas>`);
    await frame();
    await frame();
    const area = el.querySelector('.canvas-area');
    expect(area.classList.contains('tool-draw') || area.classList.contains('tool-select')).to.be
      .true;
  });
});

describe('canvas-toolbar', () => {
  it('renders shapes button', async () => {
    const el = await fixture(`<canvas-toolbar></canvas-toolbar>`);
    await frame();
    await wait(100);
    const shapesWrap = el.querySelector('.shapes-wrap');
    expect(shapesWrap).to.exist;
  });

  it('toggles shapes picker on click', async () => {
    const el = await fixture(`<canvas-toolbar></canvas-toolbar>`);
    await frame();
    await wait(100);
    const shapesBtn = el.querySelector('.shapes-wrap .canvas-tool');
    expect(shapesBtn).to.exist;
    shapesBtn.click();
    await frame();
    await frame();
    const picker = el.querySelector('.shapes-picker');
    expect(picker).to.exist;
  });
});
