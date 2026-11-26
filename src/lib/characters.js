// Anime cosplay options for the 3D studio. `style` = the app's own archetype mannequin.
// Procedural, stylised figures. To use a photoreal rig, drop /public/models/<id>.glb and it loads automatically.
export const CHARACTERS = [
  { id: 'style', name: 'My style', emoji: '🧍' },
  { id: 'gojo', name: 'Gojo Satoru', emoji: '🕶️', show: 'Jujutsu Kaisen', skin: '#f3d6c3', hair: '#f4f7ff', top: '#141824', bottom: '#141824', accent: '#2a3a8c', shoe: '#101010', ring: '#7ec8ff' },
  { id: 'naruto', name: 'Naruto Uzumaki', emoji: '🍥', show: 'Naruto', skin: '#f0c9a4', hair: '#ffd83d', top: '#ff7a1a', bottom: '#ff7a1a', accent: '#1f3a8a', shoe: '#1f3a8a', ring: '#ff9a3d' },
  { id: 'luffy', name: 'Monkey D. Luffy', emoji: '👒', show: 'One Piece', skin: '#efc29c', hair: '#1a1210', top: '#d62828', bottom: '#2f5d9e', accent: '#f2c14e', shoe: '#8a5a2b', ring: '#f2c14e' },
  { id: 'tanjiro', name: 'Tanjiro Kamado', emoji: '🔥', show: 'Demon Slayer', skin: '#f0cdb0', hair: '#4a1f1f', top: '#1d3b2a', bottom: '#1b1b1f', accent: '#111111', shoe: '#e9e2d0', ring: '#2ec4a0' },
  { id: 'goku', name: 'Son Goku', emoji: '🐉', show: 'Dragon Ball', skin: '#f0c9a4', hair: '#111114', top: '#ff7a00', bottom: '#ff7a00', accent: '#1f4fd8', shoe: '#1f4fd8', ring: '#ffb24a' },
  { id: 'levi', name: 'Levi Ackerman', emoji: '🗡️', show: 'Attack on Titan', skin: '#f3d8c6', hair: '#121216', top: '#e9e6dc', bottom: '#d8d2c0', accent: '#3a5a3a', shoe: '#3b2a22', ring: '#9ec7a3' },
];
export const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
