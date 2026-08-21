/**
 * Label PDF helpers for storefront orders
 */
'use strict';

export function pdfBlobFromBase64(base64) {
  const binary = atob(String(base64 || ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], {type: 'application/pdf'});
}

export function downloadPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'sfc-label.pdf';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * 在浏览器里打开 PDF（不自动下载）。
 * 异步请求后 window.open 常被拦截，需在点击时先打开空白页再赋值。
 */
export function showPdfInBrowser(blob, previewWin) {
  const url = URL.createObjectURL(blob);
  if (previewWin && !previewWin.closed) {
    try {
      previewWin.location.href = url;
      previewWin.focus();
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return true;
    } catch {
      try {
        previewWin.close();
      } catch {
        // ignore
      }
    }
  }
  // 回退：同页嵌入预览（不被弹窗拦截）
  const root = document.querySelector('[data-sfc-tools-root]') || document.body;
  let host = root.querySelector('[data-sfc-label-preview]');
  if (!host) {
    host = document.createElement('div');
    host.setAttribute('data-sfc-label-preview', '1');
    host.className = 'sfc-label-preview';
    host.innerHTML = `
      <div class="sfc-label-preview__panel" role="dialog" aria-modal="true" aria-label="Shipping label">
        <div class="sfc-label-preview__bar">
          <strong>Shipping label</strong>
          <button type="button" class="button button--ghost" data-sfc-label-preview-close>Close</button>
        </div>
        <iframe class="sfc-label-preview__frame" title="Shipping label PDF"></iframe>
      </div>`;
    root.append(host);
    host
      .querySelector('[data-sfc-label-preview-close]')
      ?.addEventListener('click', () => {
        const frame = host.querySelector('iframe');
        if (frame?.src) URL.revokeObjectURL(frame.src);
        host.remove();
      });
  }
  const frame = host.querySelector('iframe');
  if (frame) {
    if (frame.src?.startsWith('blob:')) URL.revokeObjectURL(frame.src);
    frame.src = url;
  }
  return true;
}
