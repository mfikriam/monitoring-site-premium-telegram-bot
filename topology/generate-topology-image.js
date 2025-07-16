import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function generateTopologyImage({
  elements,
  styles,
  output = 'topology/topology.png',
  returnBuffer = false,
}) {
  const htmlContent = `
    <html><head>
      <meta charset="UTF-8">
      <script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>
      <style>
        body, html { margin:0; } 
        body { font-family: 'Noto Color Emoji', 'Segoe UI Emoji', sans-serif; } 
        #cy { width:800px; height:600px; }
      </style>
    </head><body><div id="cy"></div>
    <script>
      const cy = cytoscape({
        container: document.getElementById('cy'),
        elements: ${JSON.stringify(elements)},
        style: ${JSON.stringify(styles)},
        layout: { name: 'preset' },
      });
      window.cy = cy;
    </script>
    </body></html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.cy && window.cy.png);

  const png = await page.evaluate(() => window.cy.png({ full: true, bg: 'white', scale: 2 }));
  const base64 = png.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  if (returnBuffer) {
    await browser.close();
    return buffer;
  }

  const dir = path.dirname(output);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); // Ensure folder exists
  fs.writeFileSync(output, buffer);
  await browser.close();
  console.log(`Image Saved: ${output}`);
  return output;
}
