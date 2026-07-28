import { Slide, SlideTemplate } from './types';
import { TEMPLATE_META } from './slideMeta';

export type TemplateInfo = { template: SlideTemplate; label: string; description: string };

const TEMPLATE_KEYS = Object.keys(TEMPLATE_META) as SlideTemplate[];

/** Templates offered when adding a new slide — the `addable` ones from TEMPLATE_META,
 *  in menu order. Excludes pptxImage/customHtml, which only come from importing. */
export const ADDABLE_TEMPLATES: TemplateInfo[] = TEMPLATE_KEYS.filter((t) => TEMPLATE_META[t].addable).map((t) => ({
  template: t,
  label: TEMPLATE_META[t].label,
  description: TEMPLATE_META[t].description,
}));

/** Default `data` shown as a template's preview and used when a new slide of that template is created. */
export function createSlideData(template: SlideTemplate): Slide['data'] {
  return TEMPLATE_META[template].createData();
}

export function createSlide(template: SlideTemplate): Slide {
  const id = `${template}-${Date.now()}`;
  return { id, template, data: createSlideData(template) } as Slide;
}
