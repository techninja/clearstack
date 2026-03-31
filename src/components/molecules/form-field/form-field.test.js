import { fixture, expect, oneEvent } from '@open-wc/testing';
import '../form-field/form-field.js';

const frame = () => new Promise((r) => requestAnimationFrame(r));

describe('form-field', () => {
  it('renders a text input by default', async () => {
    const el = await fixture(`<form-field name="title" value="Hello"></form-field>`);
    await frame();
    const input = el.querySelector('input');
    expect(input).to.exist;
    expect(input.type).to.equal('text');
    expect(input.value).to.equal('Hello');
  });

  it('renders email input for format="email"', async () => {
    const el = await fixture(`<form-field name="email" type="string" format="email"></form-field>`);
    await frame();
    expect(el.querySelector('input').type).to.equal('email');
  });

  it('renders number input for type="number"', async () => {
    const el = await fixture(`<form-field name="count" type="number"></form-field>`);
    await frame();
    expect(el.querySelector('input').type).to.equal('number');
  });

  it('renders a select for enum options', async () => {
    const el = await fixture(
      `<form-field name="status" options="todo,doing,done" value="doing"></form-field>`,
    );
    await frame();
    const select = el.querySelector('select');
    expect(select).to.exist;
    expect(select.querySelectorAll('option').length).to.be.greaterThan(3); // includes placeholder
    expect(select.value).to.equal('doing');
  });

  it('renders a checkbox for type="boolean"', async () => {
    const el = await fixture(`<form-field name="active" type="boolean" value="true"></form-field>`);
    await frame();
    const input = el.querySelector('input[type="checkbox"]');
    expect(input).to.exist;
    expect(input.checked).to.be.true;
  });

  it('sets required attribute from property', async () => {
    const el = await fixture(`<form-field name="name" required></form-field>`);
    await frame();
    expect(el.querySelector('input').required).to.be.true;
    expect(el.querySelector('.form-field').classList.contains('required')).to.be.true;
  });

  it('sets readonly attribute', async () => {
    const el = await fixture(`<form-field name="id" read-only></form-field>`);
    await frame();
    expect(el.querySelector('input').readOnly).to.be.true;
  });

  it('sets minlength and maxlength', async () => {
    const el = await fixture(
      `<form-field name="name" min-length="1" max-length="200"></form-field>`,
    );
    await frame();
    const input = el.querySelector('input');
    expect(input.minLength).to.equal(1);
    expect(input.maxLength).to.equal(200);
  });

  it('displays server error message', async () => {
    const el = await fixture(`<form-field name="name" error="Name already exists"></form-field>`);
    await frame();
    const msg = el.querySelector('.error-message');
    expect(msg).to.exist;
    expect(msg.textContent).to.contain('Name already exists');
    expect(el.querySelector('.form-field').classList.contains('error')).to.be.true;
  });

  it('dispatches field-change on input', async () => {
    const el = await fixture(`<form-field name="title" value=""></form-field>`);
    await frame();
    const input = el.querySelector('input');
    input.value = 'New value';
    setTimeout(() => input.dispatchEvent(new Event('input', { bubbles: true })));
    const event = await oneEvent(el, 'field-change');
    expect(event.detail.name).to.equal('title');
    expect(event.detail.value).to.equal('New value');
  });

  it('uses label property when provided', async () => {
    const el = await fixture(`<form-field name="firstName" label="First Name"></form-field>`);
    await frame();
    expect(el.querySelector('.form-field-label').textContent).to.contain('First Name');
  });

  it('falls back to name as label', async () => {
    const el = await fixture(`<form-field name="email"></form-field>`);
    await frame();
    expect(el.querySelector('.form-field-label').textContent).to.contain('email');
  });
});
