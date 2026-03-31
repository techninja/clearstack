import { fixture, expect } from '@open-wc/testing';
import '../app-icon/app-icon.js';

describe('app-icon', () => {
  it('renders an SVG for a known icon name', async () => {
    const el = await fixture(`<app-icon name="plus"></app-icon>`);
    await new Promise((r) => requestAnimationFrame(r));
    const svg = el.querySelector('svg');
    expect(svg).to.exist;
    expect(svg.querySelector('path')).to.exist;
  });

  it('renders empty span for unknown icon', async () => {
    const el = await fixture(`<app-icon name="nonexistent"></app-icon>`);
    await new Promise((r) => requestAnimationFrame(r));
    const svg = el.querySelector('svg');
    expect(svg).to.not.exist;
    const span = el.querySelector('.icon');
    expect(span).to.exist;
  });

  it('applies size class', async () => {
    const el = await fixture(`<app-icon name="check" size="lg"></app-icon>`);
    await new Promise((r) => requestAnimationFrame(r));
    const span = el.querySelector('.icon');
    expect(span.classList.contains('icon-lg')).to.be.true;
  });
});
