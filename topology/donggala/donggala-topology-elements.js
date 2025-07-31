export const customStyles = [
  {
    selector: 'node[type="switch"]',
    style: {
      'font-size': '9px',
      width: '50px',
      height: '50px',
    },
  },
  {
    selector: 'node[id="PAL1"]',
    style: {
      'font-size': '9px',
      width: '50px',
      height: '50px',
    },
  },
];

export const nodes = [
  { data: { id: 'TWI', label: 'TWI', type: 'router', hostname: 'ME-D7-TWI' }, position: { x: 0, y: -125 } },
  {
    data: { id: 'DGL105', label: 'DGL105', type: 'switch', hostname: 'L2SW-D7-DGL105' },
    position: { x: 125, y: -125 },
  },
  {
    data: { id: 'DGL006', label: 'DGL006', type: 'switch', hostname: 'L2SW-D7-DGL006' },
    position: { x: 250, y: -125 },
  },
  {
    data: { id: 'DGL007', label: 'DGL007', type: 'switch', hostname: 'L2SW-D7-DGL007' },
    position: { x: 250, y: 0 },
  },
  {
    data: { id: 'DGL129', label: 'DGL129', type: 'switch', hostname: 'L2SW-D7-DGL129' },
    position: { x: 375, y: -125 },
  },
  // ---------------------------- //
  { data: { id: 'PAL1', label: 'PAL1', type: 'router', hostname: 'ME9-D7-PAL1' }, position: { x: 0, y: 0 } },
  // ---------------------------- //
  { data: { id: 'TBU', label: 'TBU', type: 'router', hostname: 'SME-D7-TBU' }, position: { x: 375, y: 0 } },
  {
    data: { id: 'PGI063', label: 'PGI063', type: 'switch', hostname: 'L2SW-D7-PGI063' },
    position: { x: 375, y: 125 },
  },
  {
    data: { id: 'PGI004', label: 'PGI004', type: 'switch', hostname: 'SW-D7-PGI004' },
    position: { x: 250, y: 125 },
  },
  {
    data: { id: 'PGI003', label: 'PGI003', type: 'switch', hostname: 'SW-D7-TSEL-PGI003-10G-4' },
    position: { x: 125, y: 125 },
  },
  { data: { id: 'PRG', label: 'PRG', type: 'router', hostname: 'ME-D7-PRG' }, position: { x: 0, y: 125 } },
  // ---------------------------- //
  {
    data: { id: 'DGL030', label: 'DGL030', type: 'switch', hostname: 'L2SW-D7-DGL030' },
    position: { x: 500, y: 0 },
  },
  {
    data: { id: 'DGL175', label: 'DGL175', type: 'switch', hostname: 'L2SW-D7-DGL175' },
    position: { x: 625, y: 0 },
  },
  {
    data: { id: 'DGL079', label: 'DGL079', type: 'switch', hostname: 'L2SW-D7-DGL079' },
    position: { x: 625, y: -125 },
  },
  {
    data: { id: 'DGL034', label: 'DGL034', type: 'switch', hostname: 'L2SW-D7-DGL034' },
    position: { x: 750, y: -125 },
  },
  {
    data: { id: 'TLI005', label: 'TLI005', type: 'switch', hostname: 'L2SW-D7-TLI005' },
    position: { x: 875, y: -125 },
  },
  {
    data: { id: 'TLI041', label: 'TLI041', type: 'switch', hostname: 'SW-D7-TSEL-TLI041' },
    position: { x: 875, y: 0 },
  },
  {
    data: { id: 'TLI008', label: 'TLI008', type: 'switch', hostname: 'SW-D7-TSEL-TLI008' },
    position: { x: 1000, y: 0 },
  },
  { data: { id: 'STG', label: 'STG', type: 'router', hostname: 'ME-D7-STG' }, position: { x: 1125, y: 0 } },
];

export const edges = [
  // ----------- 1. TWI-TBU ----------- //
  {
    data: {
      source: 'TWI',
      target: 'DGL105',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'DGL105',
      target: 'DGL006',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'DGL006',
      target: 'DGL007',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'DGL007',
      target: 'DGL129',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'DGL129',
      target: 'TBU',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  // -------------- Break -------------- //
  {
    data: {
      source: 'TWI',
      target: 'PAL1',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'PAL1',
      target: 'PRG',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  // ----------- 2. TBU-PRG ----------- //
  {
    data: {
      source: 'TBU',
      target: 'PGI063',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'PGI063',
      target: 'PGI004',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'PGI004',
      target: 'PGI003',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'PGI003',
      target: 'PRG',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  // ----------- 3. TBU-STG ----------- //
  {
    data: {
      source: 'TBU',
      target: 'DGL030',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'DGL030',
      target: 'DGL175',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'DGL175',
      target: 'DGL079',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'DGL079',
      target: 'DGL034',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'DGL034',
      target: 'TLI005',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'TLI005',
      target: 'TLI041',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'TLI041',
      target: 'TLI008',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
  {
    data: {
      source: 'TLI008',
      target: 'STG',
      label: '#/# ⬛',
      type: '',
      distances: [0],
      weights: [0.5],
    },
  },
];
