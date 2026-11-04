// Generates separate launch artifacts; never changes the current demo checkout.
import {mkdir, readFile, writeFile, copyFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url))); 
const args=process.argv.slice(2);
if(args.length!==2 && !(args.length===3 && args[2]==='--enable-enquiries'))throw new Error('Usage: npm run seo:production -- https://johnsjobs.uk /tmp/johnsjobs-production [--enable-enquiries]');
const origin=new URL(args[0]);
if(origin.protocol!=='https:' || !['johnsjobs.uk','www.johnsjobs.uk'].includes(origin.hostname) || origin.port || origin.pathname!=='/' || origin.search || origin.hash || origin.username || origin.password)throw new Error('Use the confirmed HTTPS production origin only.');
const output=path.resolve(args[1]);
if(output===root || output.startsWith(root+path.sep))throw new Error('Output must be outside the checkout to protect the demo.');
await mkdir(output,{recursive:true});
if((await readdir(output)).length)throw new Error('Output must be empty to avoid publishing stale or development files.');
await mkdir(path.join(output,'assets'),{recursive:true});
const base=origin.origin;
for(const filename of ['index.html','privacy.html']){
 let html=await readFile(path.join(root,filename),'utf8');
 const canonical=base+(filename==='index.html'?'/':'/privacy.html');
 if(filename==='index.html'){
  if(args[2]==='--enable-enquiries'){
   html=html.replace('id="quote-form"','id="quote-form" data-endpoint="./api/enquiry.php"');
   html=html.replace('When online enquiries open, we’ll use','We’ll use').replace(' Nothing entered here is sent while submission is disabled.','');
  }
  html=html.replace('<meta name="robots" content="noindex,follow">','<meta name="robots" content="index,follow">');
  html=html.replace(/<script type="application\/ld\+json">(.*?)<\/script>/s,(_,json)=>{
   const data=JSON.parse(json);data.url=base+'/';data['@id']=base+'/#organization';data.logo=base+'/assets/logo-232.webp';
   return '<script type="application/ld+json">'+JSON.stringify(data)+'</script>';
  });
  html=html.replace('</head>',`<meta property="og:url" content="${canonical}"><meta property="og:image" content="${base}/assets/logo-232.webp"><meta name="twitter:image" content="${base}/assets/logo-232.webp"></head>`);
 }
 html=html.replace('</head>',`<link rel="canonical" href="${canonical}"></head>`);
 await writeFile(path.join(output,filename),html);
}
for(const filename of ['styles.css','app.js','assets/logo-116.webp','assets/logo-232.webp','assets/team-768.webp','assets/team-1024.webp','assets/team-1536.webp'])await copyFile(path.join(root,filename),path.join(output,filename));
await writeFile(path.join(output,'robots.txt'),`User-agent: *\nDisallow:\nSitemap: ${base}/sitemap.xml\n`);
// Draft privacy page deliberately remains noindex and is omitted from sitemap.
await writeFile(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url></urlset>\n`);
console.log(`Production artifacts prepared in ${output}. NOT deployed. Confirm migration checks before uploading.`);
