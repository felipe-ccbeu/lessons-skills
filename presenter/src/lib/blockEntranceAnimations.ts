import { Transition, Variants } from 'motion/react';

/** Entrance-only animation for an individual slide block (title, image, grammar box, ...) — no exit/direction concept, since blocks don't navigate. */
export type BlockAnimationId = 'fadeUp' | 'fade' | 'zoom' | 'slideLeft' | 'slideRight' | 'flip' | 'none';

export type BlockAnimationDef = {
  id: BlockAnimationId;
  label: string;
  description: string;
  variants: Variants;
  transition: Transition;
};

const SPRING: Transition = { type: 'spring', stiffness: 320, damping: 30 };

export const BLOCK_ANIMATIONS: BlockAnimationDef[] = [
  {
    id: 'fadeUp',
    label: 'Fade + subir (padrão)',
    description: 'Aparece suavemente vindo de baixo.',
    variants: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } },
    transition: SPRING,
  },
  {
    id: 'fade',
    label: 'Fade',
    description: 'Aparece suavemente, sem movimento.',
    variants: { hidden: { opacity: 0 }, show: { opacity: 1 } },
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  {
    id: 'zoom',
    label: 'Zoom',
    description: 'Cresce a partir de um ponto central.',
    variants: { hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } },
    transition: SPRING,
  },
  {
    id: 'slideLeft',
    label: 'Deslizar da direita',
    description: 'Entra deslizando da direita para a esquerda.',
    variants: { hidden: { opacity: 0, x: 60 }, show: { opacity: 1, x: 0 } },
    transition: SPRING,
  },
  {
    id: 'slideRight',
    label: 'Deslizar da esquerda',
    description: 'Entra deslizando da esquerda para a direita.',
    variants: { hidden: { opacity: 0, x: -60 }, show: { opacity: 1, x: 0 } },
    transition: SPRING,
  },
  {
    id: 'flip',
    label: 'Virar',
    description: 'Gira em torno do eixo vertical ao aparecer.',
    variants: { hidden: { opacity: 0, rotateY: 40 }, show: { opacity: 1, rotateY: 0 } },
    transition: { type: 'spring', stiffness: 280, damping: 28 },
  },
  {
    id: 'none',
    label: 'Sem animação',
    description: 'Aparece instantaneamente.',
    variants: { hidden: { opacity: 1 }, show: { opacity: 1 } },
    transition: { duration: 0 },
  },
];

export const DEFAULT_BLOCK_ANIMATION: BlockAnimationId = 'fadeUp';

const BY_ID = new Map(BLOCK_ANIMATIONS.map((a) => [a.id, a]));

export function getBlockAnimation(id: BlockAnimationId | undefined): BlockAnimationDef {
  return BY_ID.get(id ?? DEFAULT_BLOCK_ANIMATION) ?? BLOCK_ANIMATIONS[0];
}
