'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function HeroImage() {
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <Image
      src="/images/hero/hero.jpg"
      alt="hero background"
      fill
      style={{ objectFit: 'cover', opacity: 0.6 }}
      priority
      onError={() => setError(true)}
    />
  );
}
