/**
 * Accessible custom select enhancement
 *
 * Implements the ARIA listbox-button pattern: focus stays on the trigger and
 * the active option is exposed via aria-activedescendant (options are not in
 * the tab order). The trigger is named by the field label plus the current
 * value, supports first-letter type-ahead, and collapses on Tab / blur.
 */
'use strict';

let idCounter = 0;
function nextId(prefix) {
  idCounter += 1;
  return `sfc-select-${prefix}-${idCounter}`;
}

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

  const listId = nextId('list');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'sfc-select__trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', listId);

  const label = document.createElement('span');
  label.className = 'sfc-select__label';
  label.id = nextId('value');
  const chevron = document.createElement('span');
  chevron.className = 'sfc-select__chevron';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.append(label, chevron);

  // Name the trigger from the field label plus the current value, e.g.
  // <label class="field"><span>Destination</span><select …></label>. The native
  // select is aria-hidden, so without this the field label would be detached.
  const fieldSpan = select.closest('label')?.querySelector(':scope > span');
  if (fieldSpan) {
    if (!fieldSpan.id) fieldSpan.id = nextId('field');
    trigger.setAttribute('aria-labelledby', `${fieldSpan.id} ${label.id}`);
  } else {
    trigger.setAttribute('aria-labelledby', label.id);
  }

  const list = document.createElement('ul');
  list.className = 'sfc-select__list';
  list.id = listId;
  list.setAttribute('role', 'listbox');
  list.hidden = true;

  wrap.append(trigger, list);

  let activeIndex = -1;
  let searchBuffer = '';
  let searchTimer = null;

  function optionNodes() {
    return Array.from(select.options);
  }

  function selectedOption() {
    return select.options[select.selectedIndex] || select.options[0];
  }

  function optionButtons() {
    return Array.from(list.querySelectorAll('.sfc-select__option'));
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
      btn.id = `${listId}-opt-${index}`;
      btn.setAttribute('tabindex', '-1');
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
    const buttons = optionButtons();
    buttons.forEach((btn) => btn.classList.remove('is-active'));
    activeIndex = index;
    const current = buttons[index];
    if (current) {
      current.classList.add('is-active');
      current.scrollIntoView({block: 'nearest'});
      trigger.setAttribute('aria-activedescendant', current.id);
    } else {
      trigger.removeAttribute('aria-activedescendant');
    }
  }

  function open() {
    renderOptions();
    list.hidden = false;
    wrap.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    const selected = list.querySelector('.sfc-select__option.is-selected');
    const buttons = optionButtons();
    setActive(selected ? buttons.indexOf(selected) : 0);
  }

  function close() {
    list.hidden = true;
    wrap.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    activeIndex = -1;
    searchBuffer = '';
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

  // First-letter type-ahead: accumulate printable characters and jump to the
  // first matching option, mirroring native <select> behavior.
  function typeAhead(char) {
    searchBuffer = (searchBuffer + char).toLowerCase();
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchBuffer = '';
      searchTimer = null;
    }, 600);
    if (!wrap.classList.contains('is-open')) open();
    const match = optionButtons().findIndex((btn) =>
      btn.textContent.trim().toLowerCase().startsWith(searchBuffer),
    );
    if (match >= 0) setActive(match);
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
      const buttons = optionButtons();
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
        const btn = optionButtons()[activeIndex];
        if (btn) choose(Number(btn.dataset.index));
      }
    } else if (event.key === 'Escape' && openNow) {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      // Let focus move on, but collapse the list so it does not stay open.
      if (openNow) close();
    } else if (
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      typeAhead(event.key);
    }
  });

  // Collapse when focus leaves the widget entirely (for example Tab from the
  // trigger). Internal focus moves keep the list open.
  wrap.addEventListener('focusout', (event) => {
    if (!wrap.contains(event.relatedTarget)) close();
  });

  document.addEventListener('click', (event) => {
    if (!wrap.contains(event.target)) close();
  });

  select.addEventListener('change', syncLabel);
  syncLabel();
}
