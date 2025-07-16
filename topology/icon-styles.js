import fs from 'fs';
import path from 'path';

// Get Icon Base64
const assetPath = path.resolve('./topology/assets');
const base64Router = fs.readFileSync(path.join(assetPath, 'router.png')).toString('base64');
const base64RouterUnmonit = fs.readFileSync(path.join(assetPath, 'router-red.png')).toString('base64');
const base64Switch = fs.readFileSync(path.join(assetPath, 'workgroup-switch.png')).toString('base64');
const base64SwitchUnmonit = fs.readFileSync(path.join(assetPath, 'workgroup-switch-red.png')).toString('base64');

export const iconStyles = [
  {
    selector: 'node[type="router"]',
    style: {
      'background-image': `url("data:image/png;base64,${base64Router}")`,
    },
  },
  {
    selector: 'node[type="switch"]',
    style: {
      'background-image': `url("data:image/png;base64,${base64Switch}")`,
    },
  },
  {
    selector: 'node[type="router-unmonit"]',
    style: {
      'background-image': `url("data:image/png;base64,${base64RouterUnmonit}")`,
    },
  },
  {
    selector: 'node[type="switch-unmonit"]',
    style: {
      'background-image': `url("data:image/png;base64,${base64SwitchUnmonit}")`,
    },
  },
];
