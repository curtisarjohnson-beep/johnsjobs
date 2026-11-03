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
const enquiryFields = [...quoteForm.querySelectorAll('input:not([type="file"]), select, textarea')];
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
  return results.every(Boolean) && !photosProcessing;
}
function collectEnquiryData() {
  return { ...Object.fromEntries(enquiryFields.map(field => [field.name, field.value.trim()])), photos: selectedPhotos.map(photo => photo.file) };
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


// Local-only photo preparation. Re-enforce every limit in the future backend.
const PHOTO_LIMITS = Object.freeze({count:5, sourceBytes:10_000_000, outputBytes:1_000_000, totalBytes:5_000_000, longestEdge:1600});
const photoInput = document.querySelector('#photos');
const photoError = document.querySelector('#photos-error');
const photoStatus = document.querySelector('#photos-status');
const photoPreviews = document.querySelector('#photo-previews');
let selectedPhotos = [];
let photosProcessing = false;
function showPhotoError(message) {
  photoError.textContent = message;
  photoError.hidden = !message;
  photoInput.setAttribute('aria-invalid', String(Boolean(message)));
}
function renderPhotos() {
  photoPreviews.replaceChildren();
  for (const photo of selectedPhotos) {
    const item = document.createElement('li');
    const image = document.createElement('img');
    image.src = photo.url;
    image.alt = `Preview of ${photo.file.name}`;
    const name = document.createElement('span');
    name.textContent = `${photo.file.name} · ${Math.ceil(photo.file.size / 1000)} KB`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${photo.file.name}`);
    remove.disabled = photosProcessing;
    remove.addEventListener('click', () => {
      URL.revokeObjectURL(photo.url);
      selectedPhotos = selectedPhotos.filter(entry => entry !== photo);
      showPhotoError('');
      renderPhotos();
      photoInput.focus();
    });
    item.append(image, name, remove);
    photoPreviews.append(item);
  }
  const bytes = selectedPhotos.reduce((sum, photo) => sum + photo.file.size, 0);
  photoStatus.textContent = photosProcessing ? 'Preparing photos on your device…' : selectedPhotos.length ? `${selectedPhotos.length} of 5 photos selected · ${(bytes / 1_000_000).toFixed(2)} MB total. Not uploaded yet.` : 'No photos selected.';
}
async function compressPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Please choose JPG, PNG or WebP photos. Convert HEIC photos to JPG first.');
  if (file.size > PHOTO_LIMITS.sourceBytes) throw new Error(`${file.name} is over 10 MB. Please choose a smaller photo.`);
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    const scale = Math.min(1, PHOTO_LIMITS.longestEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare this photo.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let blob;
    for (const quality of [.82, .7, .55, .4]) {
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= PHOTO_LIMITS.outputBytes) break;
    }
    if (!blob || blob.size > PHOTO_LIMITS.outputBytes) throw new Error(`${file.name} could not be reduced below 1 MB. Please choose a smaller photo.`);
    const basename = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 70) || 'clearance-photo';
    return new File([blob], `${basename}.jpg`, {type:'image/jpeg'});
  } catch (error) {
    if (error.name === 'EncodingError') throw new Error(`${file.name} could not be read as a photo. Please choose a different JPG, PNG or WebP file.`);
    throw error;
  } finally {
    URL.revokeObjectURL(url);
  }
}
photoInput.addEventListener('change', async () => {
  if (photosProcessing) return;
  const files = [...photoInput.files];
  photoInput.value = '';
  if (!files.length) return;
  showPhotoError('');
  if (selectedPhotos.length + files.length > PHOTO_LIMITS.count) {
    showPhotoError('You can add a maximum of 5 photos. Remove a photo before adding more.');
    return;
  }
  photosProcessing = true;
  photoInput.disabled = true;
  photoInput.setAttribute('aria-busy', 'true');
  renderPhotos();
  const prepared = [];
  try {
    for (const file of files) {
      const compressed = await compressPhoto(file);
      prepared.push({file:compressed, url:URL.createObjectURL(compressed)});
    }
    if ([...selectedPhotos, ...prepared].reduce((sum, photo) => sum + photo.file.size, 0) > PHOTO_LIMITS.totalBytes) throw new Error('Photos must total no more than 5 MB. Please remove one and try again.');
    selectedPhotos.push(...prepared);
  } catch (error) {
    prepared.forEach(photo => URL.revokeObjectURL(photo.url));
    showPhotoError(error.message || 'We could not prepare these photos. Please try different files.');
  } finally {
    photosProcessing = false;
    photoInput.disabled = false;
    photoInput.setAttribute('aria-busy', 'false');
    renderPhotos();
  }
});
