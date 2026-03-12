export type MockCleanStatus = 'idle' | 'processing' | 'done';

interface MockCleanRecord {
  status: MockCleanStatus;
  readyAt?: number;
  updatedAt: number;
}

const STORAGE_KEY = 'jotrow_mock_clean_notes';
const PROCESSING_DURATION_MS = 4500;

const readStore = (): Record<string, MockCleanRecord> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStore = (store: Record<string, MockCleanRecord>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const normalizeRecord = (noteId: number, store: Record<string, MockCleanRecord>) => {
  const key = String(noteId);
  const record = store[key];
  if (!record) return null;

  if (record.status === 'processing' && record.readyAt && Date.now() >= record.readyAt) {
    const next = {
      status: 'done' as const,
      updatedAt: Date.now(),
    };
    store[key] = next;
    writeStore(store);
    return next;
  }

  return record;
};

export const getMockCleanState = (noteId: number): MockCleanRecord | null => {
  const store = readStore();
  return normalizeRecord(noteId, store);
};

export const getMockNoteUpdatedAt = (noteId: number): number | null => {
  return getMockCleanState(noteId)?.updatedAt || null;
};

export const startMockClean = (noteId: number): MockCleanRecord => {
  const store = readStore();
  const next = {
    status: 'processing' as const,
    readyAt: Date.now() + PROCESSING_DURATION_MS,
    updatedAt: Date.now(),
  };
  store[String(noteId)] = next;
  writeStore(store);
  return next;
};

export const markMockNoteUpdated = (noteId: number) => {
  const store = readStore();
  const current = normalizeRecord(noteId, store);
  store[String(noteId)] = {
    status: current?.status || 'idle',
    updatedAt: Date.now(),
  };
  writeStore(store);
};

const escapePdfText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildPdf = (lines: string[]) => {
  const content = [
    'BT',
    '/F1 22 Tf',
    '72 730 Td',
    ...lines.map((line, index) => `${index === 0 ? '' : '0 -28 Td'}(${escapePdfText(line)}) Tj`.trim()),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj',
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
};

export const downloadMockCleanPdf = (noteTitle: string) => {
  const pdf = buildPdf([
    'JOTROW Prototype PDF',
    'OCR flow preview only',
    `Source note: ${noteTitle || 'Untitled note'}`,
    'Real OCR and PDF generation will be connected next.',
  ]);

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (noteTitle || 'note')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'note';

  link.href = url;
  link.download = `${safeName}-prototype.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const fileToDataUrl = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const downloadMockRawNote = async (
  noteTitle: string,
  noteContent: string,
  imageUrls: string[],
  updatedAtLabel: string,
) => {
  const embeddedImages = await Promise.all(
    imageUrls.map(async (url) => {
      try {
        return await fileToDataUrl(url);
      } catch {
        return url;
      }
    }),
  );

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${noteTitle}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
      h1 { margin: 0 0 8px; }
      p.meta { color: #666; margin: 0 0 24px; }
      pre { white-space: pre-wrap; line-height: 1.5; background: #f5f5f5; padding: 16px; border: 1px solid #ddd; }
      .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 24px; }
      .gallery img { width: 100%; border: 1px solid #ddd; }
    </style>
  </head>
  <body>
    <h1>${noteTitle}</h1>
    <p class="meta">Last updated: ${updatedAtLabel}</p>
    <pre>${noteContent || ''}</pre>
    <div class="gallery">
      ${embeddedImages.map((src, index) => `<img src="${src}" alt="Note image ${index + 1}" />`).join('\n')}
    </div>
  </body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (noteTitle || 'note')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'note';

  link.href = url;
  link.download = `${safeName}-raw-note.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
