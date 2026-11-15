import { useEffect, useState } from 'react';
import { gradientFor, initials } from '../lib/format.js';

// Live remote image. If it is missing or fails to load we draw generated art instead of a broken icon.
export default function Img({ src, alt, name = '', className = '', ...rest }) {
  const [bad, setBad] = useState(!src);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setBad(!src); setLoaded(false); }, [src]);

  if (bad) {
    return (
      <div className={`img-fallback ${className}`} style={{ background: gradientFor(name || alt || 'atelier') }} role="img" aria-label={alt || name}>
        <span>{initials(name || alt)}</span>
      </div>
    );
  }
  return (
    <img
      className={`ph ${className} ${loaded ? 'is-loaded' : ''}`}
      src={src}
      alt={alt || name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => setBad(true)}
      {...rest}
    />
  );
}

export function BrandLogo({ brand, size = 44 }) {
  const [bad, setBad] = useState(!brand.domain);
  return (
    <span className="brand-logo" style={{ width: size, height: size }}>
      {bad ? <b>{initials(brand.name)}</b> : (
        <img
          src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`}
          alt={`${brand.name} logo`} loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)}
        />
      )}
    </span>
  );
}
