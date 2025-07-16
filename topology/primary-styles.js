export const primaryStyles = [
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
    selector: 'edge',
    style: {
      label: 'data(label)',
      color: '#000',
      'font-size': '9px',
      'font-weight': 'bold',
      'text-wrap': 'wrap',
      'text-max-width': 100,
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
      'font-weight': 'normal',
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
];
