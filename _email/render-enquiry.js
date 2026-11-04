// Server-side presentation only: no email client, credentials, persistence or network.
export const CATEGORY_LABELS = Object.freeze({
  'full-house':'Full house clearance', 'partial-house':'Partial house / room clearance',
  bereavement:'Bereavement or probate clearance', garage:'Garage, loft or shed clearance',
  furniture:'Furniture and bulky item removal', trade:'Trade waste removal',
  commercial:'Commercial / office clearance', 'bin-store':'Communal bin store clearance',
  tenancy:'End-of-tenancy / managed property clearance', garden:'Garden clearance', other:'Other / not sure'
});
export const DEFAULT_EMAIL_CONFIG = Object.freeze({
  fromName:'JohnsJobs Enquiries', fromAddress:'enquiries@johnsjobs.uk',
  to:'john@johnsjobs.uk', subjectPrefix:'New JohnsJobs Enquiry'
});
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function requiredText(value, field, max, singleLine = true) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) || (singleLine && /[\r\n]/.test(value))) throw new TypeError(`Invalid ${field}`);
  return value.trim().replace(/\r\n?/g, '\n');
}
function email(value, field) {
  const address = requiredText(value, field, 254);
  if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(address)) throw new TypeError(`Invalid ${field}`);
  return address;
}
const textStyle = 'font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#242624;';
const labelStyle = 'font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;color:#646964;';
function detail(label, value) {
  return `<tr><td style="padding:0 0 6px;${labelStyle}">${label}</td></tr><tr><td style="padding:0 0 18px;word-break:break-word;overflow-wrap:anywhere;${textStyle}">${value}</td></tr>`;
}
/** Render already server-validated data. attachments contains metadata, never file bytes. */
export function renderEnquiry(enquiry, configuration = {}) {
  if (!enquiry || typeof enquiry !== 'object') throw new TypeError('Enquiry is required');
  const config = {...DEFAULT_EMAIL_CONFIG, ...configuration};
  const fullName = requiredText(enquiry.fullName, 'fullName', 120);
  const customerEmail = email(enquiry.email, 'email');
  const phone = requiredText(enquiry.phone, 'phone', 120);
  if (!/^\+?[\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) throw new TypeError('Invalid phone');
  const location = requiredText(enquiry.location, 'location', 120);
  if (typeof enquiry.category !== 'string' || !Object.hasOwn(CATEGORY_LABELS, enquiry.category)) throw new TypeError('Invalid category');
  const category = CATEGORY_LABELS[enquiry.category];
  const description = requiredText(enquiry.description, 'description', 5000, false);
  const metadata = enquiry.attachments ?? [];
  if (!Array.isArray(metadata) || metadata.length > 5) throw new TypeError('Invalid attachments');
  const filenames = metadata.map((attachment, i) => {
    if (!attachment || typeof attachment !== 'object') throw new TypeError('Invalid attachment metadata');
    const value = attachment.originalFilename || attachment.filename || `Photo ${i + 1}`;
    return requiredText(value, 'attachment filename', 255);
  });
  const fromName = requiredText(config.fromName, 'fromName', 120);
  const fromAddress = email(config.fromAddress, 'fromAddress');
  const to = email(config.to, 'to');
  const prefix = requiredText(config.subjectPrefix, 'subjectPrefix', 100);
  const subject = `${prefix} — ${category} — ${location}`;
  const phoneUri = phone.replace(/[^+\d]/g, '');
  const emailUri = `mailto:${encodeURIComponent(customerEmail).replace(/%40/g, '@')}`;
  const photosHtml = filenames.length
    ? `<p style="margin:0 0 10px;${textStyle}">${filenames.length} photo${filenames.length === 1 ? '' : 's'} supplied as attachment${filenames.length === 1 ? '' : 's'}:</p><ul style="margin:0;padding-left:20px;${textStyle}">${filenames.map(name => `<li style="word-break:break-word;">${escapeHtml(name)}</li>`).join('')}</ul>`
    : `<p style="margin:0;${textStyle}">No photos attached.</p>`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New clearance enquiry</title></head>
<body style="margin:0;padding:0;background:#f2f2ed;${textStyle}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f2f2ed;"><tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-top:5px solid #e51c24;">
<tr><td style="padding:28px 24px 20px;font-family:Arial,Helvetica,sans-serif;font-size:27px;font-weight:bold;color:#191b1a;">Johns<span style="color:#e51c24;">Jobs</span><br><span style="font-size:10px;letter-spacing:1.5px;color:#646964;">HOUSE CLEARANCES &amp; MORE</span></td></tr>
<tr><td style="padding:0 24px 24px;"><h1 style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.3;color:#191b1a;">New clearance enquiry</h1><p style="margin:0;${textStyle}">A new enquiry has been submitted through the JohnsJobs website.</p></td></tr>
<tr><td style="padding:24px;border-top:1px solid #e2e3dc;"><h2 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#191b1a;">Job details</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;">${detail('TYPE OF CLEARANCE', escapeHtml(category))}${detail('JOB POSTCODE OR LOCATION', escapeHtml(location))}${detail('DESCRIPTION OF THE JOB', escapeHtml(description).replace(/\n/g, '<br>'))}</table></td></tr>
<tr><td style="padding:24px;border-top:1px solid #e2e3dc;"><h2 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#191b1a;">Customer details</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;">${detail('FULL NAME', escapeHtml(fullName))}${detail('EMAIL ADDRESS', `<a href="${escapeHtml(emailUri)}" style="color:#b9131b;text-decoration:underline;word-break:break-all;">${escapeHtml(customerEmail)}</a>`)}${detail('PHONE NUMBER', `<a href="${escapeHtml(`tel:${phoneUri}`)}" style="color:#b9131b;text-decoration:underline;">${escapeHtml(phone)}</a>`)}</table></td></tr>
<tr><td style="padding:24px;border-top:1px solid #e2e3dc;"><h2 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#191b1a;">Photos</h2>${photosHtml}</td></tr>
<tr><td style="padding:22px 24px;background:#eeefe8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#646964;">Sent via the JohnsJobs website enquiry form.</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  const text = `JohnsJobs — House Clearances & More

New clearance enquiry
A new enquiry has been submitted through the JohnsJobs website.

JOB DETAILS
Type of clearance: ${category}
Job postcode or location: ${location}
Description of the job:
${description}

CUSTOMER DETAILS
Full name: ${fullName}
Email address: ${customerEmail}
Phone number: ${phone}

PHOTOS
${filenames.length ? `${filenames.length} photo${filenames.length === 1 ? '' : 's'} supplied as attachments:\n${filenames.map(name => `- ${name}`).join('\n')}` : 'No photos attached.'}

Sent via the JohnsJobs website enquiry form.`;
  return {fromName, fromAddress, to, replyTo:customerEmail, subject, html, text};
}
