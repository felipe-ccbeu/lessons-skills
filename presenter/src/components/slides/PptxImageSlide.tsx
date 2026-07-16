import { PptxImageData } from '@/lib/types';

type Props = {
  data: PptxImageData;
  onEdit: (patch: Partial<PptxImageData>) => void;
  editMode: boolean;
};

// Not editable yet — this template only displays a rasterized slide from an
// imported .pptx. Editing arbitrary pptx content is a separate, much larger
// problem (see conversation); this just proves pptx files can live in the
// same deck/player as the native HTML templates.
export function PptxImageSlide({ data }: Props) {
  return (
    <div style={{ position: 'relative', width: 1280, height: 720, background: '#fff', overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.imageUrl}
        alt={`${data.sourceFile} — slide ${data.slideNumber}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  );
}
