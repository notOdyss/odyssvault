/**
 * PDF Export Utility
 * Exports markdown notes to styled PDF documents
 */
import jsPDF from 'jspdf';

// Parse markdown to get heading structure
function parseMarkdownStructure(content) {
  const lines = content.split('\n');
  const elements = [];
  let codeBlock = false;
  let codeContent = [];
  let codeLanguage = '';

  for (const line of lines) {
    // Code block handling
    if (line.startsWith('```')) {
      if (!codeBlock) {
        codeBlock = true;
        codeLanguage = line.slice(3).trim();
        codeContent = [];
      } else {
        elements.push({ type: 'code', content: codeContent.join('\n'), language: codeLanguage });
        codeBlock = false;
      }
      continue;
    }

    if (codeBlock) {
      codeContent.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', content: line.slice(2) });
    } else if (line.startsWith('## ')) {
      elements.push({ type: 'h2', content: line.slice(3) });
    } else if (line.startsWith('### ')) {
      elements.push({ type: 'h3', content: line.slice(4) });
    } else if (line.startsWith('#### ')) {
      elements.push({ type: 'h4', content: line.slice(5) });
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      elements.push({ type: 'quote', content: line.slice(2) });
    }
    // Horizontal rule
    else if (line.match(/^[-*_]{3,}$/)) {
      elements.push({ type: 'hr' });
    }
    // Unordered list
    else if (line.match(/^[\-\*]\s/)) {
      elements.push({ type: 'ul', content: line.slice(2) });
    }
    // Ordered list
    else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^\d+\.\s(.+)/);
      elements.push({ type: 'ol', content: match ? match[1] : line });
    }
    // Task list
    else if (line.match(/^- \[([ x])\]/)) {
      const checked = line.includes('[x]');
      const content = line.replace(/^- \[[ x]\]\s?/, '');
      elements.push({ type: 'task', content, checked });
    }
    // Inline code (single backticks)
    else if (line.includes('`') && !line.includes('```')) {
      elements.push({ type: 'text', content: line });
    }
    // Note links [[]]
    else if (line.includes('[[')) {
      elements.push({ type: 'text', content: line });
    }
    // Regular paragraph
    else if (line.trim()) {
      elements.push({ type: 'text', content: line });
    }
    // Empty line
    else {
      elements.push({ type: 'space' });
    }
  }

  return elements;
}

// Apply text formatting (bold, italic, etc)
function formatText(text) {
  // Remove markdown formatting for PDF
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold
    .replace(/\*(.+?)\*/g, '$1')       // Italic
    .replace(/__(.+?)__/g, '$1')       // Bold alt
    .replace(/_(.+?)_/g, '$1')         // Italic alt
    .replace(/~~(.+?)~~/g, '$1')       // Strikethrough
    .replace(/`(.+?)`/g, '$1')         // Inline code
    .replace(/\[\[(.+?)\]\]/g, '[$1]') // Note links
    .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Regular links
}

/**
 * Export a note to PDF
 * @param {Object} note - Note object with title and content
 * @param {Object} options - Export options
 */
export async function exportToPdf(note, options = {}) {
  const {
    fontSize = 11,
    margin = 20,
    includeDate = true,
    includeTitle = true
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Helper to add new page if needed
  const checkPageBreak = (height = 10) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper to add text with word wrap
  const addText = (text, x, fontSize, maxWidth, options = {}) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.4;

    for (const line of lines) {
      checkPageBreak(lineHeight);
      if (options.bold) {
        doc.setFont('helvetica', 'bold');
      } else if (options.italic) {
        doc.setFont('helvetica', 'italic');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(line, x, y);
      y += lineHeight;
    }
  };

  // Set document properties
  doc.setProperties({
    title: note.title,
    subject: 'OdyssVault Note Export',
    creator: 'OdyssVault'
  });

  // Title
  if (includeTitle) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    const titleLines = doc.splitTextToSize(note.title || 'Untitled', contentWidth);
    for (const line of titleLines) {
      doc.text(line, margin, y);
      y += 10;
    }
    y += 2;
  }

  // Date
  if (includeDate) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const date = new Date(note.updated_at || Date.now());
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(dateStr, margin, y);
    y += 8;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Parse and render content
  doc.setTextColor(40, 40, 40);
  const elements = parseMarkdownStructure(note.content || '');

  for (const el of elements) {
    switch (el.type) {
      case 'h1':
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        addText(formatText(el.content), margin, 20, contentWidth, { bold: true });
        y += 3;
        break;

      case 'h2':
        checkPageBreak(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        addText(formatText(el.content), margin, 16, contentWidth, { bold: true });
        y += 2;
        break;

      case 'h3':
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        addText(formatText(el.content), margin, 14, contentWidth, { bold: true });
        y += 1;
        break;

      case 'h4':
        checkPageBreak(7);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        addText(formatText(el.content), margin, 12, contentWidth, { bold: true });
        break;

      case 'text':
        addText(formatText(el.content), margin, fontSize, contentWidth);
        break;

      case 'quote':
        checkPageBreak(8);
        doc.setFillColor(240, 240, 240);
        const quoteText = formatText(el.content);
        const quoteLines = doc.splitTextToSize(quoteText, contentWidth - 10);
        const quoteHeight = quoteLines.length * (fontSize * 0.4) + 4;
        doc.rect(margin, y - 2, contentWidth, quoteHeight, 'F');
        doc.setDrawColor(100, 100, 100);
        doc.line(margin, y - 2, margin, y + quoteHeight - 2);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'italic');
        for (const line of quoteLines) {
          doc.text(line, margin + 5, y + 2);
          y += fontSize * 0.4;
        }
        doc.setTextColor(40, 40, 40);
        y += 4;
        break;

      case 'code':
        checkPageBreak(10);
        doc.setFillColor(245, 245, 245);
        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
        const codeLines = el.content.split('\n');
        const codeHeight = Math.min(codeLines.length * 4 + 6, pageHeight - margin - y);
        doc.rect(margin, y - 2, contentWidth, codeHeight, 'F');
        doc.setTextColor(60, 60, 60);
        for (let i = 0; i < codeLines.length; i++) {
          if (y + 4 > pageHeight - margin) {
            doc.addPage();
            y = margin;
            doc.setFillColor(245, 245, 245);
          }
          doc.text(codeLines[i].slice(0, 80), margin + 3, y + 2);
          y += 4;
        }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        y += 4;
        break;

      case 'ul':
        checkPageBreak(6);
        doc.setFontSize(fontSize);
        doc.text('•', margin, y);
        addText(formatText(el.content), margin + 5, fontSize, contentWidth - 5);
        break;

      case 'ol':
        checkPageBreak(6);
        doc.setFontSize(fontSize);
        addText(formatText(el.content), margin + 5, fontSize, contentWidth - 5);
        break;

      case 'task':
        checkPageBreak(6);
        doc.setFontSize(fontSize);
        doc.text(el.checked ? '☑' : '☐', margin, y);
        addText(formatText(el.content), margin + 5, fontSize, contentWidth - 5);
        break;

      case 'hr':
        checkPageBreak(6);
        doc.setDrawColor(180, 180, 180);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
        break;

      case 'space':
        y += 4;
        break;
    }
  }

  // Footer with page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'OdyssVault',
      margin,
      pageHeight - 10
    );
  }

  // Save the PDF
  const filename = `${note.title || 'untitled'}.pdf`.replace(/[/\\?%*:|"<>]/g, '-');
  doc.save(filename);

  return filename;
}

export default exportToPdf;
