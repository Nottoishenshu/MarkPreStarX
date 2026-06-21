
import { parseMarkdown } from './parser.js';

// DOM Elements
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const copyHtmlBtn = document.getElementById('copyHtmlBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');

if (!editor || !preview) {
  throw new Error(
    'Required DOM elements (#editor or #preview) not found.'
  );
}

// Storage
const STORAGE_KEY = 'md-previewer-content';

// Debounce

function debounce(fn, delay = 200) {
  let timer = null;

  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

// Rendering Pipeline
function parseAndRender() {
  try {
    const markdown = editor.value;
    const html = parseMarkdown(markdown);

    preview.innerHTML = html;

    highlightCodeBlocks();

    saveToStorage(markdown);
  } catch (error) {
    console.error('Render failed:', error);

    preview.innerHTML =
      '<p class="error">Markdown rendering failed.</p>';
  }
}

const debouncedParseAndRender =
  debounce(parseAndRender, 200);

// Input Events
editor.addEventListener(
  'input',
  debouncedParseAndRender
);

// Scroll Sync

function syncScroll() {
  const editorMax =
    editor.scrollHeight - editor.clientHeight;

  const previewMax =
    preview.scrollHeight - preview.clientHeight;

  if (editorMax <= 0) {
    return;
  }

  const ratio =
    editor.scrollTop / editorMax;

  preview.scrollTop =
    ratio * previewMax;
}

editor.addEventListener(
  'scroll',
  syncScroll
);

// Local Storage

function saveToStorage(markdown) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      markdown
    );
  } catch (error) {
    console.warn(
      'Storage save failed:',
      error
    );
  }
}

function loadFromStorage() {
  try {
    return (
      localStorage.getItem(
        STORAGE_KEY
      ) || ''
    );
  } catch (error) {
    console.warn(
      'Storage load failed:',
      error
    );

    return '';
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(
      STORAGE_KEY
    );
  } catch (error) {
    console.warn(
      'Storage clear failed:',
      error
    );
  }
}

// Toolbar

function insertAtCursor(
  before,
  after = ''
) {
  const start =
    editor.selectionStart;

  const end =
    editor.selectionEnd;

  const selected =
    editor.value.substring(
      start,
      end
    );

  const replacement =
    before +
    (selected || 'text') +
    after;

  editor.setRangeText(
    replacement,
    start,
    end,
    'select'
  );

  editor.focus();

  parseAndRender();
}

const toolbarActions = {
  bold: () =>
    insertAtCursor('**', '**'),

  italic: () =>
    insertAtCursor('*', '*'),

  heading: () =>
    insertAtCursor('## ', ''),

  link: () =>
    insertAtCursor(
      '[',
      '](https://example.com)'
    ),

  image: () =>
    insertAtCursor(
      '![alt text](',
      ')'
    ),

  code: () =>
    insertAtCursor(
      '```\n',
      '\n```'
    )
};

document
  .querySelectorAll(
    '.toolbar button[data-action]'
  )
  .forEach(button => {
    button.addEventListener(
      'click',
      () => {
        const action =
          button.dataset.action;

        if (
          toolbarActions[action]
        ) {
          toolbarActions[action]();
        }
      }
    );
  });

// Copy HTML

async function copyHTML() {
  try {
    await navigator.clipboard.writeText(
      preview.innerHTML
    );

    if (copyHtmlBtn) {
      const original =
        copyHtmlBtn.textContent;

      copyHtmlBtn.textContent =
        'Copied!';

      setTimeout(() => {
        copyHtmlBtn.textContent =
          original;
      }, 2000);
    }
  } catch (error) {
    console.warn(
      'Clipboard failed:',
      error
    );
  }
}

copyHtmlBtn?.addEventListener(
  'click',
  copyHTML
);

// Download Markdown

function downloadMarkdown() {
  const blob = new Blob(
    [editor.value],
    {
      type:
        'text/markdown;charset=utf-8'
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;
  link.download =
    'document.md';

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  URL.revokeObjectURL(url);
}

downloadBtn?.addEventListener(
  'click',
  downloadMarkdown
);

// Clear

function clearEditor() {
  editor.value = '';
  preview.innerHTML = '';

  clearStorage();

  editor.focus();
}

clearBtn?.addEventListener(
  'click',
  clearEditor
);

// Simple Syntax Highlighting
function highlightCodeBlocks() {
  const keywords = [
    'const',
    'let',
    'var',
    'function',
    'return',
    'if',
    'else',
    'for',
    'while',
    'class',
    'import',
    'export',
    'from',
    'default',
    'new',
    'this',
    'async',
    'await',
    'try',
    'catch',
    'throw'
  ];

  const keywordRegex =
    new RegExp(
      `\\b(${keywords.join('|')})\\b`,
      'g'
    );

  preview
    .querySelectorAll(
      'pre code'
    )
    .forEach(block => {
      let html =
        block.innerHTML;

      html = html.replace(
        keywordRegex,
        '<span class="token-keyword">$1</span>'
      );

      html = html.replace(
        /\b(\d+\.?\d*)\b/g,
        '<span class="token-number">$1</span>'
      );

      html = html.replace(
        /(".*?"|'.*?')/g,
        '<span class="token-string">$1</span>'
      );

      html = html.replace(
        /(\/\/.*?$)/gm,
        '<span class="token-comment">$1</span>'
      );

      block.innerHTML = html;
    });
}

// Startup

function initialize() {
  editor.value =
    loadFromStorage();

  parseAndRender();
}

initialize();
