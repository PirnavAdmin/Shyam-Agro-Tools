const https = require('https');
const fs = require('fs');
const path = require('path');

const brands = [
  { name: 'mahindra.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Mahindra_and_Mahindra_Logo.svg' },
  { name: 'john-deere.svg', url: 'https://upload.wikimedia.org/wikipedia/en/d/d4/John_Deere_logo.svg' },
  { name: 'stihl.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/STIHL_logo.svg' },
  { name: 'honda.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg' },
  { name: 'kubota.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Kubota_logo.svg' },
  { name: 'tafe.svg', url: 'https://upload.wikimedia.org/wikipedia/en/e/ef/TAFE_Logo.svg' },
  { name: 'new-holland.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/New_Holland_Agriculture_logo.svg' },
  { name: 'sonalika.svg', url: 'https://upload.wikimedia.org/wikipedia/en/9/95/Sonalika_Group_logo.svg' },
  { name: 'eicher.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Eicher_Motors_Logo.svg' },
  { name: 'husqvarna.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Husqvarna_Wordmark.svg' }
];

const dir = path.join(__dirname, 'public', 'brands');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

brands.forEach(brand => {
  const dest = path.join(dir, brand.name);
  https.get(brand.url, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
    if (res.statusCode === 200) {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log('Downloaded ' + brand.name); });
    } else {
      console.log('Failed ' + brand.name + ': ' + res.statusCode);
    }
  }).on('error', (err) => console.error(err));
});
