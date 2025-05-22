import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function generateTopologyImage({ elements, output = 'topology/topology.png', returnBuffer = false }) {
  const assetPath = path.resolve('./topology/assets');

  const base64Router = fs.readFileSync(path.join(assetPath, 'router.png')).toString('base64');
  const base64RouterUnmonit = fs.readFileSync(path.join(assetPath, 'router-red.png')).toString('base64');
  const base64Switch = fs.readFileSync(path.join(assetPath, 'workgroup-switch.png')).toString('base64');
  const base64SwitchUnmonit = fs.readFileSync(path.join(assetPath, 'workgroup-switch-red.png')).toString('base64');

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
        layout: { name: 'preset' },
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'transparent',
              'background-opacity': 0,
              'border-color': '#0074D9',
              'border-width': 0,
              shape: 'rectangle',
              label: 'data(label)',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'font-size': '10px',
              width: '60px',
              height: '60px',
              'background-fit': 'contain',
              'text-margin-y': '-5px',
            },
          },
          {
            selector: 'node[type="router"]',
            style: {
              'background-image': 'url("data:image/png;base64,${base64Router}")',
            },
          },
          {
            selector: 'node[type="switch"]',
            style: {
              'background-image': 'url("data:image/png;base64,${base64Switch}")',
            },
          },
          {
            selector: 'node[type="router-unmonit"]',
            style: {
              'background-image': 'url("data:image/png;base64,${base64RouterUnmonit}")',
            },
          },
          {
            selector: 'node[type="switch-unmonit"]',
            style: {
              'background-image': 'url("data:image/png;base64,${base64SwitchUnmonit}")',
            },
          },
          {
            selector: 'edge',
            style: {
              label: 'data(label)',
              color: '#000',
              'font-size': '9px',
              'text-background-color': '#fff',
              'text-background-opacity': 1,
              'text-background-padding': '2px',
              width: 2,
              'curve-style': 'segments',
              'segment-distances': 'data(distances)',
              'segment-weights': 'data(weights)',
            },
          },
          {
            selector: 'edge[type="working"]',
            style: {
              'line-color': '#2ecc40',
            },
          },
          {
            selector: 'edge[type="los"]',
            style: {
              'line-color': '#ff4136',
            },
          },
          {
            selector: 'edge[type="warning"]',
            style: {
              'line-color': '#ff851b',
            },
          },
        ]
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
  } else {
    // Ensure folder exists
    const dir = path.dirname(output);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(output, buffer);
    await browser.close();
    console.log(`Image Saved: ${output}`);
    return output;
  }
}
