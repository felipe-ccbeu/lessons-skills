import { Transition, Variants } from 'motion/react';

export type SlideAnimationId =
  | 'slide'
  | 'fade'
  | 'zoom'
  | 'flip'
  | 'slideUp'
  | 'none';

export type SlideAnimationDef = {
  id: SlideAnimationId;
  label: string;
  description: string;
  variants: Variants;
  transition: Transition;
};

const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 };

export const SLIDE_ANIMATIONS: SlideAnimationDef[] = [
  {
    id: 'slide',
    label: 'Deslizar (padrão)',
    description: 'Desliza da direita/esquerda conforme a direção da navegação.',
    variants: {
      enter: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? 48 : -48 }),
      center: { opacity: 1, x: 0 },
      exit: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? -48 : 48 }),
    },
    transition: SPRING,
  },
  {
    id: 'fade',
    label: 'Fade',
    description: 'Aparece e some suavemente, sem movimento.',
    variants: {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      exit: { opacity: 0 },
    },
    transition: { duration: 0.32, ease: 'easeInOut' },
  },
  {
    id: 'zoom',
    label: 'Zoom',
    description: 'Cresce a partir do centro ao entrar, encolhe ao sair.',
    variants: {
      enter: { opacity: 0, scale: 0.92 },
      center: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.06 },
    },
    transition: SPRING,
  },
  {
    id: 'flip',
    label: 'Virar',
    description: 'Gira em torno do eixo vertical, como uma carta virando.',
    variants: {
      enter: (direction: 1 | -1) => ({ opacity: 0, rotateY: direction === 1 ? 35 : -35 }),
      center: { opacity: 1, rotateY: 0 },
      exit: (direction: 1 | -1) => ({ opacity: 0, rotateY: direction === 1 ? -35 : 35 }),
    },
    transition: { type: 'spring', stiffness: 300, damping: 32 },
  },
  {
    id: 'slideUp',
    label: 'Subir',
    description: 'Entra vindo de baixo, sai subindo.',
    variants: {
      enter: { opacity: 0, y: 40 },
      center: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -40 },
    },
    transition: SPRING,
  },
  {
    id: 'none',
    label: 'Sem animação',
    description: 'Troca instantânea, sem transição.',
    variants: {
      enter: { opacity: 1 },
      center: { opacity: 1 },
      exit: { opacity: 1 },
    },
    transition: { duration: 0 },
  },
];

export const DEFAULT_SLIDE_ANIMATION: SlideAnimationId = 'slide';

const BY_ID = new Map(SLIDE_ANIMATIONS.map((a) => [a.id, a]));

export function getSlideAnimation(id: SlideAnimationId | undefined): SlideAnimationDef {
  return BY_ID.get(id ?? DEFAULT_SLIDE_ANIMATION) ?? SLIDE_ANIMATIONS[0];
}
