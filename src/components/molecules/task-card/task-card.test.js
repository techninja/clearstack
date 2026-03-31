import { fixture, expect, oneEvent } from '@open-wc/testing';
import '../task-card/task-card.js';

const frame = () => new Promise((r) => requestAnimationFrame(r));

describe('task-card', () => {
  it('renders title text', async () => {
    const el = await fixture(
      `<task-card title="Fix bug" status="todo" priority="high"></task-card>`,
    );
    await frame();
    expect(el.querySelector('.task-card-title').textContent).to.contain('Fix bug');
  });

  it('renders status and priority badges', async () => {
    const el = await fixture(`<task-card title="Test" status="doing" priority="med"></task-card>`);
    await frame();
    expect(el.querySelectorAll('app-badge').length).to.equal(2);
  });

  it('renders a grip drag handle', async () => {
    const el = await fixture(`<task-card title="Test"></task-card>`);
    await frame();
    const grip = el.querySelector('.task-card-grip app-icon');
    expect(grip).to.exist;
    expect(grip.getAttribute('name')).to.equal('grip');
  });

  it('renders a delete button', async () => {
    const el = await fixture(`<task-card title="Test"></task-card>`);
    await frame();
    expect(el.querySelector('.task-card-delete')).to.exist;
  });

  it('shows inline confirmation on delete click', async () => {
    const el = await fixture(`<task-card title="Test"></task-card>`);
    await frame();
    el.querySelector('.task-card-delete').click();
    await frame();
    await frame();
    expect(el.querySelector('.task-card-confirm')).to.exist;
  });

  it('dispatches select event on card click', async () => {
    const el = await fixture(`<task-card task-id="t1" title="Test"></task-card>`);
    await frame();
    setTimeout(() => el.querySelector('.task-card').click());
    const event = await oneEvent(el, 'select');
    expect(event.detail.id).to.equal('t1');
  });

  it('dispatches delete event on confirm', async () => {
    const el = await fixture(`<task-card task-id="t1" title="Test"></task-card>`);
    await frame();
    el.querySelector('.task-card-delete').click();
    await frame();
    await frame();
    const confirmBtn = el.querySelector('.task-card-confirm .btn-danger');
    setTimeout(() => confirmBtn.click());
    const event = await oneEvent(el, 'delete');
    expect(event.detail.id).to.equal('t1');
  });
});
