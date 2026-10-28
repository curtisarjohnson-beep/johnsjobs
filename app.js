const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); toggle.focus(); } });
window.matchMedia('(min-width: 1101px)').addEventListener('change', closeMenu);
document.querySelector('#year').textContent = new Date().getFullYear();


const vanScene = document.querySelector('.hero-art');
const vanReplay = document.querySelector('.van-replay');
const vanPause = document.querySelector('.van-pause');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function replayVan() {
  if (reducedMotion.matches) return;
  vanScene.classList.remove('is-driving', 'is-paused');
  void vanScene.offsetWidth;
  vanScene.classList.add('is-driving');
  vanPause.setAttribute('aria-pressed', 'false');
  vanPause.textContent = 'Pause motion';
}
vanReplay.addEventListener('click', replayVan);
document.querySelector('.van').addEventListener('click', replayVan);
vanPause.addEventListener('click', () => {
  const paused = vanScene.classList.toggle('is-paused');
  vanPause.setAttribute('aria-pressed', String(paused));
  vanPause.textContent = paused ? 'Resume motion' : 'Pause motion';
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) vanScene.classList.remove('is-driving', 'is-paused');
  else replayVan();
});
replayVan();

// Enquiry frontend only. No endpoint, persistence or email provider is configured.
const quoteForm = document.querySelector('#quote-form');
const enquiryFields = [...quoteForm.querySelectorAll('input, select, textarea')];
const enquiryStatus = document.querySelector('#enquiry-status');
function validateEnquiryField(field) {
  const value = field.value.trim();
  let error = '';
  if (!value) {
    error = {fullName:'Please enter your full name.', phone:'Please enter your phone number.', email:'Please enter your email address.', location:'Please enter the job location or postcode.', category:'Please select a job type.', description:'Please tell us about the job.'}[field.name];
  } else if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    error = 'Please enter a valid email address, such as name@example.com.';
  } else if (field.name === 'phone') {
    const digits = value.replace(/\D/g, '');
    if (!/^\+?[\d\s().-]+$/.test(value) || digits.length < 7 || digits.length > 15) {
      error = 'Please enter a valid phone number with 7–15 digits.';
    }
  } else if (field.name === 'category' && ![...field.options].some(option => option.value === value)) {
    error = 'Please select a job type from the list.';
  }
  const message = document.querySelector(`#${field.id}-error`);
  message.textContent = error;
  message.hidden = !error;
  field.setAttribute('aria-invalid', String(Boolean(error)));
  return !error;
}
function validateEnquiry() {
  const results = enquiryFields.map(validateEnquiryField);
  const firstInvalid = enquiryFields.find(field => field.getAttribute('aria-invalid') === 'true');
  if (firstInvalid) firstInvalid.focus();
  return results.every(Boolean);
}
function collectEnquiryData() {
  return Object.fromEntries(enquiryFields.map(field => [field.name, field.value.trim()]));
}
// Future integration boundary: pass collectEnquiryData() to a tested backend here.
// Keep disabled until server validation, spam protection and real responses exist.
function handleEnquirySubmission(event) {
  event.preventDefault();
  if (!validateEnquiry()) return;
  // Deliberately do not transmit, persist, clear fields or display a success state.
  enquiryStatus.setAttribute('aria-live', 'polite');
}
quoteForm.addEventListener('submit', handleEnquirySubmission);
quoteForm.addEventListener('keydown', event => {
  // Prevent implicit Enter submission, while allowing newlines in the description.
  if (event.key === 'Enter' && event.target.matches('input')) handleEnquirySubmission(event);
});
enquiryFields.forEach(field => {
  field.addEventListener('blur', () => validateEnquiryField(field));
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') validateEnquiryField(field);
  });
  field.addEventListener('change', () => validateEnquiryField(field));
});
const descriptionField = document.querySelector('#description');
descriptionField.addEventListener('input', () => {
  descriptionField.style.height = 'auto';
  descriptionField.style.height = `${descriptionField.scrollHeight + 2}px`;
});
document.querySelectorAll('a[href="#enquiry-form"]').forEach(link => {
  link.addEventListener('click', () => {
    const category = link.dataset.jobCategory;
    if (category) {
      const select = document.querySelector('#category');
      select.value = category;
      validateEnquiryField(select);
    }
    document.querySelector('#enquiry-form').focus({preventScroll:true});
  });
});
