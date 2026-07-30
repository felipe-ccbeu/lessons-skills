// Shared DiceBear (fun-emoji) avatar URL builder — used by both the teacher's
// lobby overlay and the student's login/edit-name screen, so the character a
// student sees while picking matches exactly what shows up on the projector.

const MOUTH_VARIANTS = [
  'cute',
  'drip',
  'kissHeart',
  'lilSmile',
  'plain',
  'shout',
  'shy',
  'smileLol',
  'smileTeeth',
  'tongueOut',
  'wideSmile',
].join(',');

// Without an explicit eyes list, DiceBear leans heavily on a couple of
// default variants — give it the full spread so seeds actually look distinct.
const EYES_VARIANTS = ['cheery', 'cute', 'glasses', 'love', 'plain', 'stars', 'wink', 'wink2'].join(',');

// Brand-adjacent palette, same hues as the lobby bubble fallback color, so
// avatars and bubbles read as one system rather than two unrelated choices.
const BACKGROUND_COLORS = ['F5225F', '1B4BF5', 'FFB020', '21C08A', '8B5CF6', 'FF6B35', '00B8D9', 'E11D8F'].join(',');

/**
 * Deterministic avatar URL for a given seed. Passing lists (rather than
 * single values) for eyes/mouth/background lets DiceBear pick a
 * different-looking combination per seed instead of near-identical defaults.
 */
export function avatarUrlFor(seed: string): string {
  const params = new URLSearchParams({
    seed,
    mouthVariant: MOUTH_VARIANTS,
    eyesVariant: EYES_VARIANTS,
    backgroundColor: BACKGROUND_COLORS,
    backgroundType: 'solid',
  });
  return `https://api.dicebear.com/10.x/fun-emoji/svg?${params.toString()}`;
}

/** Fresh random seed for the "shuffle my character" button. */
export function randomAvatarSeed(): string {
  return crypto.randomUUID();
}
