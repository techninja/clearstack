import { fixture, expect, oneEvent } from '@open-wc/testing';
import '../project-card/project-card.js';

describe('project-card', () => {
  it('renders project name', async () => {
    const el = await fixture(`<project-card name="My Project" status="active"></project-card>`);
    await new Promise((r) => requestAnimationFrame(r));
    const name = el.querySelector('.project-card-name');
    expect(name).to.exist;
    expect(name.textContent).to.contain('My Project');
  });

  it('renders description', async () => {
    const el = await fixture(`<project-card name="P" description="Some desc"></project-card>`);
    await new Promise((r) => requestAnimationFrame(r));
    const desc = el.querySelector('.project-card-desc');
    expect(desc.textContent).to.contain('Some desc');
  });

  it('renders status badge', async () => {
    const el = await fixture(`<project-card name="P" status="archived"></project-card>`);
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    const badge = el.querySelector('app-badge');
    expect(badge).to.exist;
    expect(badge.label).to.equal('Archived');
  });

  it('renders folder icon', async () => {
    const el = await fixture(`<project-card name="P"></project-card>`);
    await new Promise((r) => requestAnimationFrame(r));
    const icon = el.querySelector('app-icon');
    expect(icon.getAttribute('name')).to.equal('folder');
  });

  it('dispatches select event with project id on click', async () => {
    const el = await fixture(`<project-card project-id="p1" name="P"></project-card>`);
    await new Promise((r) => requestAnimationFrame(r));
    const card = el.querySelector('.project-card');
    setTimeout(() => card.click());
    const event = await oneEvent(el, 'select');
    expect(event.detail.id).to.equal('p1');
  });
});
