import { BlankData } from '@/lib/types';

type Props = {
  data: BlankData;
};

export function BlankSlide({}: Props) {
  return <div style={{ width: 1280, height: 720, background: '#fff' }} />;
}
