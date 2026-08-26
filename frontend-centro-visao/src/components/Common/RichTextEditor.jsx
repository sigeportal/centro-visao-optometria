import { useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

export function sanitizeRichTextHtml(value) {
  const source = String(value || '');
  if (typeof document === 'undefined') return source;
  if (!source.includes('<')) {
    const plainContainer = document.createElement('div');
    plainContainer.textContent = source;
    return plainContainer.innerHTML;
  }

  const template = document.createElement('template');
  template.innerHTML = source;
  const allowedTags = new Set(['B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'BR', 'P', 'DIV']);
  const blockedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT']);

  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();
    if (blockedTags.has(node.tagName)) return document.createDocumentFragment();

    const container = allowedTags.has(node.tagName)
      ? document.createElement(node.tagName.toLowerCase())
      : document.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => container.appendChild(cleanNode(child)));
    return container;
  };

  const sanitized = document.createElement('div');
  Array.from(template.content.childNodes).forEach((node) => sanitized.appendChild(cleanNode(node)));
  return sanitized.innerHTML;
}

export default function RichTextEditor({ value, onChange, disabled = false, label = 'Observações Gerais' }) {
  const editorRef = useRef(null);
  const lastEmittedValueRef = useRef('');

  useEffect(() => {
    if (!editorRef.current) return;
    const safeValue = sanitizeRichTextHtml(value);
    if (safeValue !== lastEmittedValueRef.current && editorRef.current.innerHTML !== safeValue) editorRef.current.innerHTML = safeValue;
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const safeValue = sanitizeRichTextHtml(editorRef.current.innerHTML);
    if (editorRef.current.innerHTML !== safeValue) editorRef.current.innerHTML = safeValue;
    lastEmittedValueRef.current = safeValue;
    onChange(safeValue);
  };

  const executeCommand = (command) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, null);
    emitChange();
  };

  const toolbarButtonClass = 'p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-forest-50 hover:text-forest-800 disabled:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors';

  return <div className="space-y-1.5">
    <div className="flex items-center justify-between mb-1">
      <label className="clinical-label !mb-0">{label}</label>
      {!disabled && <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
        <button type="button" title="Negrito" aria-label="Aplicar negrito" onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand('bold')} className={toolbarButtonClass}><Bold className="w-3.5 h-3.5" /></button>
        <button type="button" title="Itálico" aria-label="Aplicar itálico" onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand('italic')} className={toolbarButtonClass}><Italic className="w-3.5 h-3.5" /></button>
        <button type="button" title="Lista" aria-label="Aplicar lista" onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand('insertUnorderedList')} className={toolbarButtonClass}><List className="w-3.5 h-3.5" /></button>
        <button type="button" title="Lista numerada" aria-label="Aplicar lista numerada" onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand('insertOrderedList')} className={toolbarButtonClass}><ListOrdered className="w-3.5 h-3.5" /></button>
      </div>}
    </div>
    <div ref={editorRef} contentEditable={!disabled} role="textbox" aria-multiline="true" aria-label={label} suppressContentEditableWarning onInput={emitChange} onBlur={emitChange} className={`min-h-24 w-full p-3.5 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 shadow-hairline whitespace-pre-wrap outline-none transition-all focus:border-forest-600 focus:ring-2 focus:ring-forest-600/15 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 ${disabled ? 'cursor-default bg-slate-50/70' : ''}`} />
  </div>;
}
