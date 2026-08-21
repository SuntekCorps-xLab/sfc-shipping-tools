/**
 * Accessible custom select enhancement
 */
'use strict';

export function enhanceSelect(select) {
  if (!select || select.dataset.enhanced === 'true') return;
  select.dataset.enhanced = 'true';
  select.classList.add('sfc-select__native');
  select.setAttribute('tabindex', '-1');
  select.setAttribute('aria-hidden', 'true');

  const wrap = document.createElement('div');
  wrap.className = 'sfc-select';
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'sfc-select__trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const label = document.createElement('span');
  label.className = 'sfc-select__label';
  const chevron = document.createElement('span');
  chevron.className = 'sfc-select__chevron';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.append(label, chevron);

  const list = document.createElement('ul');
  list.className = 'sfc-select__list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;

  wrap.append(trigger, list);

  let activeIndex = -1;

  function optionNodes() {
    return Array.from(select.options);
  }

  function selectedOption() {
    return select.options[select.selectedIndex] || select.options[0];
  }

  function syncLabel() {
    const opt = selectedOption();
    const text = opt?.textContent?.trim() || 'Select';
    label.textContent = text;
    label.classList.toggle('is-placeholder', !opt?.value);
  }

  function renderOptions() {
    list.replaceChildren();
    optionNodes().forEach((opt, index) => {
      // Placeholder / empty value is trigger label only — not a list item
      if (!opt.value) return;
      const item = document.createElement('li');
      item.setAttribute('role', 'presentation');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sfc-select__option';
      btn.setAttribute('role', 'option');
      btn.dataset.index = String(index);
      btn.dataset.value = opt.value;
      btn.textContent = opt.textContent.trim();
      btn.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
      if (opt.selected) btn.classList.add('is-selected');
      if (opt.disabled) {
        btn.disabled = true;
        btn.style.opacity = '0.45';
      }
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        choose(index);
      });
      item.appendChild(btn);
      list.appendChild(item);
    });
  }

  function setActive(index) {
    const buttons = list.querySelectorAll('.sfc-select__option');
    buttons.forEach((btn) => btn.classList.remove('is-active'));
    activeIndex = index;
    const current = buttons[index];
    if (current) {
      current.classList.add('is-active');
      current.scrollIntoView({block: 'nearest'});
    }
  }

  function open() {
    renderOptions();
    list.hidden = false;
    wrap.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    const selected = list.querySelector('.sfc-select__option.is-selected');
    const buttons = Array.from(list.querySelectorAll('.sfc-select__option'));
    setActive(selected ? buttons.indexOf(selected) : 0);
  }

  function close() {
    list.hidden = true;
    wrap.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  }

  function choose(index) {
    const opt = select.options[index];
    if (!opt || opt.disabled) return;
    select.selectedIndex = index;
    select.dispatchEvent(new Event('change', {bubbles: true}));
    syncLabel();
    close();
    trigger.focus();
  }

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (wrap.classList.contains('is-open')) close();
    else open();
  });

  trigger.addEventListener('keydown', (event) => {
    const openNow = wrap.classList.contains('is-open');
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!openNow) {
        open();
        return;
      }
      const buttons = list.querySelectorAll('.sfc-select__option');
      if (!buttons.length) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const next = Math.max(0, Math.min(buttons.length - 1, activeIndex + delta));
      setActive(next);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!openNow) {
        open();
        return;
      }
      if (activeIndex >= 0) {
        const btn = list.querySelectorAll('.sfc-select__option')[activeIndex];
        if (btn) choose(Number(btn.dataset.index));
      }
    } else if (event.key === 'Escape' && openNow) {
      event.preventDefault();
      close();
    }
  });

  document.addEventListener('click', (event) => {
    if (!wrap.contains(event.target)) close();
  });

  select.addEventListener('change', syncLabel);
  syncLabel();
}
