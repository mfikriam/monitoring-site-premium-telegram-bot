export const nodes = [
  { data: { id: 'SFI', label: 'SFI', type: 'router', hostname: 'ME-D7-SFI' }, position: { x: 0, y: 0 } },
  { data: { id: 'WDA', label: 'WDA', type: 'router', hostname: 'ME-D7-WDA' }, position: { x: 0, y: -150 } },
  { data: { id: 'IWP', label: 'IWP', type: 'router', hostname: 'ME-D7-IWP' }, position: { x: 450, y: -150 } },
  { data: { id: 'MBA', label: 'MBA', type: 'router', hostname: 'ME-D7-MBA' }, position: { x: 450, y: 0 } },
  {
    data: { id: 'SSU020', label: 'SSU020', type: 'switch', hostname: 'SW-D7-NEWSSU020' },
    position: { x: 225, y: -225 },
  },
  {
    data: { id: 'SSU005', label: 'SSU005', type: 'switch', hostname: 'SW-D7-SFI-SSU005-NEW' },
    position: { x: 600, y: -150 },
  },
  {
    data: { id: 'SSU043', label: 'SSU043', type: 'switch', hostname: 'SW-D7-SFI-SSU043' },
    position: { x: 750, y: -150 },
  },
  {
    data: { id: 'OLD-SSU007', label: 'OLD-SSU007', type: 'switch', hostname: 'SW-D7-SFI-SSU007-OLD' },
    position: { x: 900, y: -150 },
  },
  {
    data: { id: 'NEW-SSU007', label: 'NEW-SSU007', type: 'switch', hostname: 'SW-D7-SFI-SSU007-NEW' },
    position: { x: 900, y: 0 },
  },
  {
    data: { id: 'SSU015', label: 'SSU015', type: 'switch', hostname: 'SW-D7-SFI-SSU-015' },
    position: { x: 750, y: 0 },
  },
  {
    data: { id: 'MBA012', label: 'MBA012', type: 'switch', hostname: 'SW-D7-SFI-MBA-0012' },
    position: { x: 600, y: 0 },
  },
  { data: { id: 'SBM', label: 'SBM', type: 'switch', hostname: 'SW-D7-SBM' }, position: { x: 125, y: 0 } },
  { data: { id: 'BUL', label: 'BUL', type: 'switch', hostname: 'SW-D7-BUL' }, position: { x: 325, y: 50 } },
];

export const edgesDWDM = [
  {
    data: {
      source: 'SFI',
      target: 'WDA',
      label: '#/# 🟨 DWDM',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'WDA',
      target: 'IWP',
      label: '#/# 🟨 DWDM',
      type: '',
      distances: [-10],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'IWP',
      target: 'MBA',
      label: '#/# 🟨 DWDM',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'MBA',
      target: 'SFI',
      label: '#/# 🟨 DWDM',
      type: '',
      distances: [50],
      weights: [0.5],
    },
  },
];

export const edgesRIP = [
  {
    data: {
      source: 'WDA',
      target: 'IWP',
      label: '#/# 🟨 RADIO',
      type: '',
      distances: [10],
      weights: [0.5],
    },
  },
];

export const edgesL2SW = [
  {
    data: { source: 'WDA', target: 'SSU020', label: '#/# 🟨', type: '', distances: [0], weights: [0.5] },
  },
  {
    data: { source: 'SSU020', target: 'IWP', label: '#/# 🟨', type: '', distances: [0], weights: [0.5] },
  },
  {
    data: { source: 'IWP', target: 'SSU005', label: '#/# 🟨', type: '', distances: [0], weights: [0.5] },
  },
  {
    data: {
      source: 'SSU005',
      target: 'SSU043',
      label: '#/# 🟨',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'SSU043',
      target: 'OLD-SSU007',
      label: '#/# 🟨',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'OLD-SSU007',
      target: 'NEW-SSU007',
      label: '#/# 🟨',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'NEW-SSU007',
      target: 'SSU015',
      label: '#/# 🟨',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'SSU015',
      target: 'MBA012',
      label: '#/# 🟨',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: { source: 'MBA012', target: 'MBA', label: '#/# 🟨', type: '', distances: [0], weights: [0.5] },
  },
  { data: { source: 'MBA', target: 'BUL', label: '#/# 🟨', type: '', distances: [0], weights: [0.5] } },
  {
    data: { source: 'BUL', target: 'SFI', label: '#/# 🟨', type: '', distances: [-30], weights: [0.6] },
  },
  { data: { source: 'SFI', target: 'SBM', label: '#/# 🟨', type: '', distances: [0], weights: [0.5] } },
  { data: { source: 'SBM', target: 'MBA', label: '#/# 🟨', type: '', distances: [0], weights: [0.5] } },
];
