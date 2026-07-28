'use client';

import { Icon } from '@/components/ui/Icon';

type Props = { name: string; onEditName: () => void };

// Thin top strip inside the class view: shows who you're joined as and lets you
// fix a typo'd name. Deliberately low-key so it never competes with the slide.
export function StudentBar({ name, onEditName }: Props) {
  return (
    <div style={styles.bar}>
      <span style={styles.name}>
        <Icon name="person" size={16} style={{ verticalAlign: 'middle', marginRight: 5 }} />
        {name}
      </span>
      <button type="button" style={styles.edit} onClick={onEditName}>
        <Icon name="edit" size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        Editar nome
      </button>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid #eceef2',
    fontFamily: 'system-ui, sans-serif',
    background: '#fff',
  },
  name: { fontSize: 14, fontWeight: 600, color: '#1c2027', display: 'inline-flex', alignItems: 'center' },
  edit: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 13,
    color: '#0448df',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
};
