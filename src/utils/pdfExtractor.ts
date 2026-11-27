import * as pdfjsLib from 'pdfjs-dist';

// Bundle worker locally via Vite asset URL so PDF extraction works reliably offline/in sandbox
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface ExtractedStudyMaterial {
  text: string;
  pageCount?: number;
  wordCount: number;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (percent: number, message: string) => void
): Promise<ExtractedStudyMaterial> {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
  const isTxt = file.type === 'text/plain' || lowerName.endsWith('.txt');

  if (!isPdf && !isTxt) {
    throw new Error('Unsupported file format. Please upload a PDF (.pdf) or plain text (.txt) file.');
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error('File is too large (limit is 15 MB). Please upload a smaller notes file.');
  }

  if (isTxt) {
    onProgress?.(25, 'Reading text file...');
    const text = await readTextFile(file, (pct) => {
      onProgress?.(Math.min(95, 25 + Math.round(pct * 0.7)), 'Reading text file...');
    });
    const cleaned = text.replace(/\r\n/g, '\n').trim();
    if (cleaned.length < 20) {
      throw new Error('This text file appears empty or too short to create viva questions.');
    }
    onProgress?.(100, 'Text extracted');
    return {
      text: cleaned,
      wordCount: countWords(cleaned),
    };
  }

  // Browser-side PDF extraction via pdfjs-dist
  onProgress?.(10, 'Loading PDF document...');
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(22, 'Parsing PDF structure...');

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  if (totalPages === 0) {
    throw new Error('This PDF has no readable pages.');
  }

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pct = 25 + Math.round((pageNum / totalPages) * 70);
    onProgress?.(pct, `Extracting page ${pageNum} of ${totalPages}...`);

    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    let lastY: number | null = null;
    let pageLine = '';

    for (const item of content.items) {
      if ('str' in item) {
        const str = item.str;
        const transform = Array.isArray(item.transform) ? item.transform : null;
        const currentY = transform ? Math.round(transform[5]) : null;

        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 6) {
          pageLine += '\n';
        } else if (pageLine && !pageLine.endsWith(' ') && !pageLine.endsWith('\n') && str && !str.startsWith(' ')) {
          pageLine += ' ';
        }

        pageLine += str;
        if (currentY !== null) {
          lastY = currentY;
        }
      }
    }

    const trimmedPage = pageLine.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (trimmedPage) {
      pageTexts.push(trimmedPage);
    }
  }

  const combined = pageTexts.join('\n\n').trim();

  if (combined.length < 20) {
    throw new Error(
      'No selectable text was found in this PDF (it may be a scanned image). Please paste your notes into the text area below.'
    );
  }

  onProgress?.(100, `Extracted ${totalPages} page${totalPages === 1 ? '' : 's'}`);
  return {
    text: combined,
    pageCount: totalPages,
    wordCount: countWords(combined),
  };
}

function readTextFile(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress?.(ev.loaded / ev.total);
      }
    };
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read the selected text file.'));
    reader.readAsText(file);
  });
}
