export const nodes = [
  { data: { id: 'SFI', label: 'SFI', type: 'router', hostname: 'ME-D7-SFI' }, position: { x: 0, y: 0 } },
  { data: { id: 'WDA', label: 'WDA', type: 'router', hostname: 'ME-D7-WDA' }, position: { x: 200, y: 100 } },
  { data: { id: 'IWP', label: 'IWP', type: 'router', hostname: 'ME-D7-IWP' }, position: { x: 500, y: 100 } },
  { data: { id: 'MBA', label: 'MBA', type: 'router', hostname: 'ME-D7-MBA' }, position: { x: 500, y: -100 } },
  {
    data: { id: 'SSU020', label: 'SSU020', type: 'switch', hostname: 'SW-D7-NEWSSU020', size: 'small' },
    position: { x: 350, y: 50 },
  },
  {
    data: { id: 'SSU043', label: 'SSU043', type: 'switch', hostname: 'SW-D7-SFI-SSU043' },
    position: { x: 800, y: 100 },
  },
  {
    data: { id: 'OLD-SSU007', label: 'OLD-SSU007', type: 'switch', hostname: 'SW-D7-SFI-SSU007-OLD' },
    position: { x: 950, y: 100 },
  },
  {
    data: { id: 'NEW-SSU007', label: 'NEW-SSU007', type: 'switch', hostname: 'SW-D7-SFI-SSU007-NEW' },
    position: { x: 950, y: -100 },
  },
  {
    data: { id: 'SSU015', label: 'SSU015', type: 'switch', hostname: 'SW-D7-SFI-SSU-015' },
    position: { x: 800, y: -100 },
  },
  {
    data: { id: 'MBA012', label: 'MBA012', type: 'switch', hostname: 'SW-D7-SFI-MBA-0012' },
    position: { x: 650, y: -100 },
  },
  {
    data: { id: 'SBM', label: 'SBM', type: 'switch', hostname: 'SW-D7-SBM', size: 'small' },
    position: { x: 200, y: -100 },
  },
  {
    data: { id: 'BUL', label: 'BUL', type: 'switch', hostname: 'SW-D7-BUL', size: 'small' },
    position: { x: 350, y: -150 },
  },
];

export const edgesDWDM = [
  {
    data: {
      source: 'SFI',
      target: 'WDA',
      label: '#/# ⬛ DWDM',
      type: '',
      distances: [60, 18],
      weights: [0.45, 1],
    },
  },
  {
    data: {
      source: 'WDA',
      target: 'IWP',
      label: '#/# ⬛ DWDM',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'IWP',
      target: 'MBA',
      label: '#/# ⬛ DWDM',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'MBA',
      target: 'SFI',
      label: '#/# ⬛ DWDM',
      type: '',
      distances: [-40, 5, 38],
      weights: [0.00001, 0.5, 0.9],
    },
  },
];

export const edgesRIP = [
  {
    data: {
      source: 'WDA',
      target: 'IWP',
      label: '#/# ⬛ RADIO',
      type: '',
      distances: [40, 40, 40],
      weights: [0.001, 0.5, 0.999],
    },
  },
];

export const edgesL2SW = [
  {
    data: {
      source: 'WDA',
      target: 'SSU020',
      label: '#/# ⬛',
      type: '',
      distances: [-40, -10],
      weights: [0.1, 0.99999],
    },
  },
  {
    data: {
      source: 'SSU020',
      target: 'IWP',
      label: '#/# ⬛',
      type: '',
      distances: [-10, -40],
      weights: [0.00001, 0.9],
    },
  },
  {
    data: { source: 'IWP', target: 'SSU043', label: '#/# ⬛', type: '', distances: [0], weights: [0.5] },
  },
  {
    data: {
      source: 'SSU043',
      target: 'OLD-SSU007',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'OLD-SSU007',
      target: 'NEW-SSU007',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'NEW-SSU007',
      target: 'SSU015',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'SSU015',
      target: 'MBA012',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: { source: 'MBA012', target: 'MBA', label: '#/# ⬛', type: '', distances: [0], weights: [0.5] },
  },
  {
    data: {
      source: 'MBA',
      target: 'BUL',
      label: '#/# ⬛',
      type: '',
      distances: [40, 10],
      weights: [0.1, 0.99999],
    },
  },
  {
    data: {
      source: 'BUL',
      target: 'SFI',
      label: '#/# ⬛',
      type: '',
      distances: [155, 60],
      weights: [1.05, 1.18],
      // distances: [10, 10, 155, 60],
      // weights: [0.00001, 0.00001, 1.05, 1.18],
    },
  },
  {
    data: {
      source: 'SFI',
      target: 'SBM',
      label: '#/# ⬛',
      type: '',
      distances: [-85, -10],
      weights: [0.06, 0.99999],
    },
  },
  { data: { source: 'SBM', target: 'MBA', label: '#/# ⬛', type: '', distances: [0], weights: [0.5] } },
];
