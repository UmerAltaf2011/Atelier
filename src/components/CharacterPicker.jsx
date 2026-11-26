import { motion } from 'framer-motion';
import { CHARACTERS } from '../lib/characters.js';

export default function CharacterPicker({ value, onChange }) {
  return (
    <div className="char-row" role="group" aria-label="3D character">
      {CHARACTERS.map(c => (
        <motion.button key={c.id} className={`char${value === c.id ? ' on' : ''}`} onClick={() => onChange(c.id)}
          whileHover={{ y: -3 }} whileTap={{ scale: 0.92 }} title={c.show || 'Dress as your style archetype'}>
          <span>{c.emoji}</span>{c.name}
        </motion.button>
      ))}
    </div>
  );
}
