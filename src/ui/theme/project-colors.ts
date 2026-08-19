export const PROJECT_COLORS = [
  { background: '#163f68', border: '#69b1ff', text: '#e6f4ff' },
  { background: '#174d38', border: '#5cdb9d', text: '#e8fff4' },
  { background: '#553d11', border: '#f3ba63', text: '#fff7df' },
  { background: '#582938', border: '#ff85a2', text: '#fff0f3' },
  { background: '#3d3268', border: '#b7a2ff', text: '#f4f0ff' },
  { background: '#174c53', border: '#5cdbd3', text: '#e6fffb' },
  { background: '#5b2e16', border: '#ff9c6e', text: '#fff2e8' },
  { background: '#384718', border: '#a0d911', text: '#f6ffed' },
  { background: '#4f245f', border: '#d3adf7', text: '#fff0ff' },
  { background: '#1f4261', border: '#85c5e8', text: '#eaf8ff' },
  { background: '#613f13', border: '#ffd666', text: '#fffbe6' },
  { background: '#283c62', border: '#85a5ff', text: '#f0f5ff' },
] as const;

export const projectColor = (slot = 0) => PROJECT_COLORS[slot] ?? PROJECT_COLORS[0];
