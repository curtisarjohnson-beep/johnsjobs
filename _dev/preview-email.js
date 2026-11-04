// Fictional fixture, excluded from Pages and the website's static server.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderEnquiry } from '../_email/render-enquiry.js';
export const sampleEnquiry = Object.freeze({
  fullName:'James Mitchell', email:'james.mitchell@example.com', phone:'07700 900123',
  category:'full-house', location:'LU1, Luton',
  description:"We're selling my father's property and need a full house clearance. It's a three-bedroom house with furniture, appliances and items in the loft.\n\nIdeally looking to have everything cleared within the next two weeks.",
  attachments:[{originalFilename:'living-room.jpg'},{originalFilename:'loft-boxes.png'},{originalFilename:'garage.webp'}]
});
const directory = path.resolve(process.argv[2] || '/tmp/johnsjobs-email-preview');
await mkdir(directory, {recursive:true});
for (const [name, data] of [['enquiry',sampleEnquiry],['enquiry-no-photos',{...sampleEnquiry,attachments:[]}]]) {
  const message = renderEnquiry(data);
  await writeFile(path.join(directory, `${name}.html`), message.html);
  await writeFile(path.join(directory, `${name}.txt`), message.text);
}
console.log(`Fictional previews generated in ${directory}. No email was sent.`);
