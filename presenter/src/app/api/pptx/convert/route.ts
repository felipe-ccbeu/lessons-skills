import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, writeFile, mkdir, rm, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

const SOFFICE_CANDIDATES = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  'soffice',
];

const PYTHON_CANDIDATES = ['python', 'python3', 'py'];

function resolveBinary(candidates: string[]): string {
  for (const candidate of candidates) {
    if (!candidate.includes('\\') || existsSync(candidate)) return candidate;
  }
  return candidates[candidates.length - 1];
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || 'deck'
  );
}

// Rasterizes every page of a PDF to PNG via PyMuPDF (already installed and
// verified locally). Kept as a standalone script string rather than a repo
// file so this API route has no extra file dependency to ship/deploy.
const RASTERIZE_SCRIPT = `
import sys, fitz
pdf_path, out_dir, dpi = sys.argv[1], sys.argv[2], int(sys.argv[3])
doc = fitz.open(pdf_path)
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=dpi)
    pix.save(f"{out_dir}/slide-{i+1:02d}.png")
print(doc.page_count)
`;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith('.pptx')) {
    return NextResponse.json({ error: 'File must be a .pptx' }, { status: 400 });
  }

  const workDir = await mkdtemp(path.join(os.tmpdir(), 'pptx-convert-'));
  const inputPath = path.join(workDir, file.name);
  const pdfPath = inputPath.replace(/\.pptx$/i, '.pdf');

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    const soffice = resolveBinary(SOFFICE_CANDIDATES);
    await execFileAsync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', workDir, inputPath], {
      timeout: 120_000,
    });

    if (!existsSync(pdfPath)) {
      throw new Error('LibreOffice did not produce a PDF output');
    }

    const slug = slugify(file.name);
    const stamp = Date.now();
    const publicDirRel = path.join('uploads', `${slug}-${stamp}`);
    const publicDirAbs = path.join(process.cwd(), 'public', publicDirRel);
    await mkdir(publicDirAbs, { recursive: true });

    const python = resolveBinary(PYTHON_CANDIDATES);
    await execFileAsync(python, ['-c', RASTERIZE_SCRIPT, pdfPath, publicDirAbs, '150'], {
      timeout: 120_000,
    });

    const files = (await readdir(publicDirAbs)).filter((f) => f.endsWith('.png')).sort();
    if (files.length === 0) {
      throw new Error('No slides were rasterized from the PDF');
    }
    const urls = files.map((f) => `/${publicDirRel.replace(/\\/g, '/')}/${f}`);

    return NextResponse.json({ sourceFile: file.name, slideCount: urls.length, urls });
  } catch (err) {
    console.error('pptx convert failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Conversion failed' },
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
