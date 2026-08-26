-- Public stock media for local/UAT presentation only. These are not verified KayJob identities.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
UPDATE users SET avatar_url = CASE pseudo
  WHEN 'awadesign' THEN 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80'
  WHEN 'mfallcode' THEN 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80'
  WHEN 'fatoulearn' THEN 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=320&q=80'
  WHEN 'client-test' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=80'
END
WHERE pseudo IN ('awadesign','mfallcode','fatoulearn','client-test');
UPDATE portfolio_items SET media_url = CASE
  WHEN title = 'Identité visuelle restaurant' THEN 'https://images.unsplash.com/photo-1676285436418-e6bc92a45fdb?auto=format&fit=crop&w=1200&q=80'
  WHEN title = 'Site vitrine association' THEN 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80'
  WHEN title = 'Support de révision' THEN 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80'
END
WHERE title IN ('Identité visuelle restaurant','Site vitrine association','Support de révision');
