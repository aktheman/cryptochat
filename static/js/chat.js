(() => {
  'use strict';

  const _featureCSS = document.createElement('style');
  _featureCSS.textContent = `
    :root, body {
      --c-bg: #0b0c12; --c-surface: #0f1424; --c-surface-2: #141a2b;
      --c-surface-hover: #1a2240; --c-chat-bg: #0f1826;
      --c-border: #151d30; --c-border-item: #1d2440; --c-border-focus: #3d35ff;
      --c-text: #e7e8f3; --c-text-chat: #f3f1ff; --c-text-meta: #9ca3c7;
      --c-text-muted: #7c7e9a; --c-text-name: #e9eaff; --c-text-preview: #8b8dab;
      --c-sender: #ff8fab; --c-brand: #cf6fef; --c-accent: #7a3bff;
      --c-accent2: #cf6fef; --c-accent5: #5b5cf5; --c-success: #22c55e;
      --c-sent-bg: #1c1030; --c-sent-border: #7a3bff; --c-sent-text: #f3f1ff;
      --c-received-bg: #16203a; --c-received-border: #2d3a6a; --c-received-text: #e9eaff;
      --c-input-bg: #0a0c18; --c-input-border: #232540; --c-input-text: #f0f0ff;
      --c-badge-bg: #1a1c30; --c-badge-border: #2a2d48; --c-badge-text: #cfcfef;
      --c-btn-ghost-border: #2a2d48;
      --c-toast-bg: #1a1c30; --c-toast-text: #d8d8fd;
      --c-toast-err-bg: #3d1212; --c-toast-err-text: #ffb3b3;
      --c-toast-ok-bg: #14301a; --c-toast-ok-text: #a3ffb3;
      --c-overlay: rgba(0,0,0,0.6);
    }
    body.theme-light {
      --c-bg: #f4f6f9; --c-surface: #ffffff; --c-surface-2: #ffffff;
      --c-surface-hover: #f3f4f6; --c-chat-bg: #f4f6f9;
      --c-border: #e5e7eb; --c-border-item: #e5e7eb; --c-border-focus: #3d35ff;
      --c-text: #0f172a; --c-text-chat: #0f172a; --c-text-meta: #475569;
      --c-text-muted: #6b7280; --c-text-name: #0f172a; --c-text-preview: #64748b;
      --c-sender: #e11d48; --c-brand: #7c3aed; --c-accent: #7c3aed;
      --c-sent-bg: #ede9fe; --c-sent-border: #c4b5fd; --c-sent-text: #0f172a;
      --c-received-bg: #ffffff; --c-received-border: #e5e7eb; --c-received-text: #0f172a;
      --c-input-bg: #ffffff; --c-input-border: #e5e7eb; --c-input-text: #0f172a;
      --c-badge-bg: #f1f5f9; --c-badge-border: #e2e8f0; --c-badge-text: #334155;
      --c-btn-ghost-border: #d1d5db;
      --c-toast-bg: #ffffff; --c-toast-text: #111827;
      --c-toast-err-bg: #fef2f2; --c-toast-err-text: #991b1b;
      --c-toast-ok-bg: #f0fdf4; --c-toast-ok-text: #166534;
    }
    body { background: var(--c-bg) !important; color: var(--c-text) !important; transition: background .3s, color .3s; }
    body.theme-light .header, body.theme-light .sidebar, body.theme-light .composer { background: var(--c-surface) !important; border-color: var(--c-border) !important; color: var(--c-text) !important; }
    body.theme-light .chat-main { background: var(--c-chat-bg) !important; }
    body.theme-light .messages { background: var(--c-chat-bg) !important; }
    body.theme-light .item { background: var(--c-surface-2) !important; border-color: var(--c-border-item) !important; color: var(--c-text) !important; }
    body.theme-light .item:hover, body.theme-light .item.active { background: var(--c-surface-hover) !important; border-color: var(--c-border-focus) !important; }
    body.theme-light .input-text { background: var(--c-input-bg) !important; border-color: var(--c-input-border) !important; color: var(--c-input-text) !important; }
    body.theme-light .msg.sent { background: var(--c-sent-bg) !important; border-color: var(--c-sent-border) !important; color: var(--c-sent-text) !important; }
    body.theme-light .msg.received { background: var(--c-received-bg) !important; border-color: var(--c-received-border) !important; color: var(--c-received-text) !important; }
    body.theme-light .meta { color: var(--c-text-meta) !important; }
    body.theme-light .empty-state { color: var(--c-text-meta) !important; background: var(--c-surface) !important; }
    body.theme-light .section-title { color: var(--c-text-muted) !important; }
    body.theme-light .brand h1 { color: var(--c-brand) !important; }
    body.theme-light .header-actions .btn { background: var(--c-surface-2) !important; border-color: var(--c-btn-ghost-border) !important; color: var(--c-text) !important; }
    body.theme-light .toast { background: var(--c-toast-bg) !important; color: var(--c-toast-text) !important; }
    body.theme-light .name { color: var(--c-text-name) !important; }
    body.theme-light .preview { color: var(--c-text-preview) !important; }
    .header { background: var(--c-surface) !important; border-color: var(--c-border) !important; }
    .brand h1 { color: var(--c-brand) !important; }
    .sidebar { background: var(--c-surface) !important; border-color: var(--c-border) !important; }
    .section-title { color: var(--c-text-muted) !important; }
    .item { background: var(--c-surface-2) !important; border-color: var(--c-border-item) !important; }
    .item:hover, .item.active { background: var(--c-surface-hover) !important; border-color: var(--c-border-focus) !important; }
    .name { color: var(--c-text-name) !important; }
    .preview { color: var(--c-text-preview) !important; }
    .chat-main { background: var(--c-chat-bg) !important; position: relative; }
    .chat-header { background: var(--c-surface) !important; border-color: var(--c-border) !important; }
    .chat-title { color: var(--c-text-chat) !important; }
    .chat-meta { color: var(--c-text-muted) !important; }
    .messages { background: var(--c-chat-bg) !important; }
    .msg.sent { background: var(--c-sent-bg) !important; border-color: var(--c-sent-border) !important; color: var(--c-sent-text) !important; }
    .msg.received { background: var(--c-received-bg) !important; border-color: var(--c-received-border) !important; color: var(--c-received-text) !important; }
    .meta { color: var(--c-text-meta) !important; }
    .sender { color: var(--c-sender) !important; }
    .badge { background: var(--c-badge-bg) !important; border-color: var(--c-badge-border) !important; color: var(--c-badge-text) !important; }
    .composer { background: var(--c-surface) !important; border-color: var(--c-border) !important; }
    .input-text { background: var(--c-input-bg) !important; color: var(--c-input-text) !important; border-color: var(--c-input-border) !important; }
    .btn-primary { background: var(--c-sent-bg) !important; color: var(--c-sent-text) !important; border-color: var(--c-accent) !important; }
    .btn-ghost { border-color: var(--c-btn-ghost-border) !important; }
    .toast { background: var(--c-toast-bg) !important; color: var(--c-toast-text) !important; }
    .toast.error { background: var(--c-toast-err-bg) !important; color: var(--c-toast-err-text) !important; }
    .toast.success { background: var(--c-toast-ok-bg) !important; color: var(--c-toast-ok-text) !important; }
    .typing-indicator { color: var(--c-text-muted); font-size:.78rem; min-height:1.1em; display:inline; }
    .msg { position:relative; }
    .reaction-trigger {
      position:absolute; bottom:6px; right:6px; width:22px; height:22px; border-radius:50%;
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
      color:var(--c-text-meta); font-size:13px; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity .2s; line-height:1;
    }
    .msg:hover .reaction-trigger { opacity:1; }
    .reaction-trigger:hover { background:rgba(255,255,255,.16); color:var(--c-text); }
    .reaction-badges { display:flex; flex-wrap:wrap; gap:4px; margin-top:5px; }
    .reaction-badge {
      display:inline-flex; align-items:center; gap:2px;
      background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
      padding:2px 7px; border-radius:10px; font-size:.73rem; cursor:pointer;
      transition:background .15s;
    }
    .reaction-badge:hover { background:rgba(255,255,255,.14); }
    .reaction-badge.reacted { background:rgba(122,59,255,.2); border-color:var(--c-accent); }
    .emoji-picker-popup {
      position:absolute; bottom:calc(100% + 4px); right:0;
      background:var(--c-surface-2); border:1px solid var(--c-border-item);
      border-radius:10px; padding:6px;
      display:flex; gap:2px; flex-wrap:wrap;
      width:196px; z-index:100;
      box-shadow:0 6px 24px rgba(0,0,0,.45);
    }
    .emoji-pick {
      width:32px; height:32px; border:none; background:transparent;
      font-size:18px; cursor:pointer; border-radius:6px;
      display:flex; align-items:center; justify-content:center;
      transition:background .12s;
    }
    .emoji-pick:hover { background:rgba(255,255,255,.1); }
    .msg-actions { display:flex; gap:4px; margin-top:4px; }
    .msg-action-btn {
      background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
      border-radius:6px; padding:2px 7px; cursor:pointer; font-size:11px;
      color:var(--c-text-meta); transition:background .15s, color .15s;
    }
    .msg-action-btn:hover { background:rgba(255,255,255,.14); color:var(--c-text); }
    .edited-tag, .deleted-tag { font-size:.7rem; font-style:italic; color:var(--c-text-muted); margin-top:2px; }
    .drop-overlay {
      position:absolute; inset:0;
      background:rgba(122,59,255,.12); border:2px dashed var(--c-accent);
      border-radius:8px; display:none; align-items:center; justify-content:center;
      z-index:50; pointer-events:none;
    }
    .drop-overlay-content { text-align:center; color:var(--c-accent); font-weight:700; }
    .drop-icon { font-size:48px; margin-bottom:8px; }
    .image-preview { display:flex; gap:8px; padding:4px 0; align-items:flex-end; }
    .img-preview { position:relative; display:inline-block; }
    .img-preview img { max-height:80px; max-width:120px; border-radius:8px; border:1px solid var(--c-border-item); object-fit:cover; }
    .remove-preview {
      position:absolute; top:-6px; right:-6px; width:20px; height:20px;
      border-radius:50%; background:#ef4444; color:#fff; border:none;
      font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center;
      line-height:1;
    }
    .inline-image img { max-width:250px; max-height:200px; border-radius:8px; margin-top:6px; display:block; }
    .modal-overlay {
      position:fixed; inset:0; background:var(--c-overlay);
      display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .modal {
      background:var(--c-surface-2); border:1px solid var(--c-border-item);
      border-radius:16px; padding:24px; width:420px; max-width:92vw;
      display:flex; flex-direction:column; gap:14px; max-height:90vh; overflow:auto;
    }
    .modal h2 { margin:0; color:var(--c-text-chat); }
    .modal label { font-size:.82rem; color:var(--c-text-meta); font-weight:600; display:block; margin-bottom:4px; }
    .modal textarea.input-text { min-height:72px; resize:vertical; }
    .modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:4px; }
    .avatar-upload { display:flex; align-items:center; gap:12px; }
    .avatar-upload img { width:64px; height:64px; border-radius:50%; object-fit:cover; border:2px solid var(--c-accent); }
    .avatar-placeholder {
      width:64px; height:64px; border-radius:50%;
      background:linear-gradient(135deg,var(--c-accent),var(--c-accent2));
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:1.4rem; color:#fff; flex-shrink:0;
    }
    .theme-wrapper { position:relative; }
    .theme-picker {
      position:absolute; top:calc(100% + 6px); right:0;
      background:var(--c-surface-2); border:1px solid var(--c-border-item);
      border-radius:10px; padding:8px;
      display:none; flex-direction:column; gap:4px;
      z-index:200; min-width:170px;
      box-shadow:0 6px 24px rgba(0,0,0,.45);
    }
    .theme-picker.open { display:flex; }
    .theme-preset {
      display:flex; align-items:center; gap:10px;
      padding:7px 10px; border-radius:8px; border:none;
      background:transparent; color:var(--c-text); cursor:pointer;
      font-size:.84rem; text-align:left; transition:background .12s;
    }
    .theme-preset:hover { background:rgba(255,255,255,.08); }
    .theme-preset.active { background:rgba(122,59,255,.2); }
    .theme-color-dot {
      width:16px; height:16px; border-radius:50%; flex-shrink:0;
      border:2px solid rgba(255,255,255,.2);
    }
    .composer { position:relative; }
    .chat-actions { position:relative; }
    .recording { background:#dc2626 !important; animation:recPulse 1s infinite; }
    @keyframes recPulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
    .voice-msg { display:flex; align-items:center; gap:8px; }
    .voice-msg audio { max-width:220px; height:36px; }
    .reply-bar { display:flex; align-items:center; justify-content:space-between; background:#1a2240; border-left:3px solid #7a3bff; padding:8px 12px; border-radius:8px 8px 0 0; font-size:.82rem; color:#9ca3c7; }
    .reply-bar-cancel { background:transparent; border:none; color:#9ca3c7; cursor:pointer; font-size:1rem; padding:2px 6px; }
    .reply-bar-cancel:hover { color:#ffb3b3; }
    .reply-ref { font-size:.72rem; color:#7c7e9a; border-left:2px solid #7a3bff; padding:2px 8px; margin-bottom:4px; max-height:40px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
    .reply-msg-btn { background:transparent; border:none; color:var(--c-text-meta); cursor:pointer; font-size:12px; padding:2px 4px; opacity:0.5; transition:opacity .15s; }
    .reply-msg-btn:hover { opacity:1; }
    .verify-btn { cursor:pointer; }
    .verify-btn.verified { color:var(--c-success) !important; }
    .verify-indicator { display:inline-flex; align-items:center; gap:4px; font-size:.78rem; color:var(--c-success); margin-left:6px; }
    .verify-indicator.unverified { color:var(--c-text-muted); }
    .safety-number-display {
      font-family:monospace; font-size:1.1rem; letter-spacing:1px;
      background:var(--c-surface); border:1px solid var(--c-border-item);
      border-radius:10px; padding:14px 18px; text-align:center;
      color:var(--c-text-chat); line-height:1.8; word-break:break-all;
      user-select:all;
    }
    .safety-number-display .digit-group {
      display:inline-block; margin:0 2px;
      padding:2px 4px; border-radius:4px;
      background:rgba(122,59,255,.08);
    }
    .safety-number-label {
      font-size:.75rem; color:var(--c-text-muted); text-align:center;
      margin-top:4px; font-style:italic;
    }
    .verify-qr-wrap {
      display:flex; justify-content:center; margin:12px 0;
    }
    .verify-qr-wrap canvas { border-radius:10px; border:2px solid var(--c-border-item); }
    .verify-status-badge {
      display:inline-flex; align-items:center; gap:5px;
      padding:3px 10px; border-radius:12px; font-size:.75rem; font-weight:600;
    }
    .verify-status-badge.verified { background:rgba(34,197,94,.15); color:var(--c-success); }
    .verify-status-badge.unverified { background:rgba(255,255,255,.06); color:var(--c-text-muted); }
    .verify-actions { display:flex; gap:8px; justify-content:center; margin-top:12px; }
    .verify-step { text-align:center; }
    .verify-step-num { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:var(--c-accent); color:#fff; font-size:.75rem; font-weight:700; margin-bottom:6px; }
    .verify-step-text { font-size:.82rem; color:var(--c-text-meta); margin-bottom:10px; }
    .sidebar .item .verify-icon { font-size:.7rem; margin-left:4px; }
    .read-receipt { font-size:.72rem; font-weight:600; }
    .read-receipt.read { color:var(--c-success); }
    .read-receipt.unread { color:var(--c-text-muted); opacity:.6; }
    .search-results-header { padding:8px 12px; background:var(--c-surface-2); border-bottom:1px solid var(--c-border-item); display:flex; justify-content:space-between; align-items:center; }
    .search-results-header .count { color:var(--c-accent); font-weight:600; font-size:.85rem; }
    .search-results-header .close-search { background:transparent; border:none; color:var(--c-text-meta); cursor:pointer; font-size:1.1rem; }
    .search-results-header .close-search:hover { color:var(--c-text); }
    .file-search-result { display:flex; align-items:center; gap:10px; padding:8px 12px; background:var(--c-surface-2); border:1px solid var(--c-border-item); border-radius:8px; margin:4px 0; cursor:pointer; transition:background .15s; }
    .file-search-result:hover { background:var(--c-surface-hover); }
    .file-search-result .file-icon { font-size:1.4rem; }
    .file-search-result .file-info { flex:1; min-width:0; }
    .file-search-result .file-name { font-size:.85rem; color:var(--c-text-chat); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .file-search-result .file-meta { font-size:.72rem; color:var(--c-text-muted); }
    .multi-device-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:10px; font-size:.7rem; background:rgba(122,59,255,.12); color:var(--c-accent); margin-left:6px; }
    .session-item { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid var(--c-border-item); }
    .session-item:last-child { border-bottom:none; }
    .session-info { flex:1; }
    .session-device { font-size:.85rem; color:var(--c-text-chat); font-weight:600; }
    .session-time { font-size:.72rem; color:var(--c-text-muted); }
    .session-current { font-size:.7rem; color:var(--c-success); }
    .session-revoke { background:transparent; border:1px solid #ef4444; color:#ef4444; border-radius:6px; padding:2px 8px; cursor:pointer; font-size:.72rem; }
    .session-revoke:hover { background:rgba(239,68,68,.1); }
    .pinned-bar { display:flex; align-items:center; gap:8px; padding:6px 14px; background:var(--c-surface-2); border-bottom:1px solid var(--c-border-item); cursor:pointer; font-size:.82rem; color:var(--c-text-meta); transition:background .15s; }
    .pinned-bar:hover { background:var(--c-surface-hover); }
    .pinned-bar .pin-icon { font-size:1rem; }
    .pinned-bar .pin-text { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pinned-bar .pin-close { background:transparent; border:none; color:var(--c-text-muted); cursor:pointer; font-size:.9rem; padding:2px 4px; }
    .disappear-toggle { display:flex; align-items:center; gap:6px; font-size:.78rem; color:var(--c-text-muted); margin-left:8px; }
    .disappear-toggle select { background:var(--c-input-bg); color:var(--c-input-text); border:1px solid var(--c-input-border); border-radius:6px; padding:2px 6px; font-size:.75rem; }
    .schedule-bar { display:flex; align-items:center; gap:6px; padding:6px 12px; background:var(--c-surface-2); border-top:1px solid var(--c-border-item); }
    .schedule-bar input { background:var(--c-input-bg); color:var(--c-input-text); border:1px solid var(--c-input-border); border-radius:6px; padding:3px 8px; font-size:.78rem; flex:1; }
    .schedule-bar .btn { font-size:.75rem; }
    .link-preview-card { margin:6px 0; padding:10px 12px; background:var(--c-surface-2); border:1px solid var(--c-border-item); border-left:3px solid var(--c-accent); border-radius:8px; max-width:360px; }
    .link-preview-card .lp-title { font-size:.85rem; font-weight:600; color:var(--c-text-chat); margin-bottom:3px; }
    .link-preview-card .lp-desc { font-size:.75rem; color:var(--c-text-meta); line-height:1.3; max-height:3em; overflow:hidden; }
    .link-preview-card .lp-url { font-size:.7rem; color:var(--c-text-muted); margin-top:3px; }
    .link-preview-card .lp-image { max-width:100%; max-height:160px; border-radius:6px; margin-top:6px; object-fit:cover; }
    .full-emoji-picker {
      position:absolute; bottom:calc(100% + 4px); left:0;
      background:var(--c-surface-2); border:1px solid var(--c-border-item);
      border-radius:12px; padding:8px; width:320px; max-height:360px;
      display:none; flex-direction:column; z-index:200;
      box-shadow:0 8px 32px rgba(0,0,0,.5);
    }
    .full-emoji-picker.open { display:flex; }
    .emoji-search { width:100%; padding:6px 10px; background:var(--c-input-bg); border:1px solid var(--c-input-border); border-radius:8px; color:var(--c-input-text); font-size:.82rem; margin-bottom:6px; outline:none; }
    .emoji-search:focus { border-color:var(--c-border-focus); }
    .emoji-categories { display:flex; gap:2px; margin-bottom:6px; }
    .emoji-cat-btn { background:transparent; border:none; font-size:1rem; cursor:pointer; padding:3px 6px; border-radius:6px; transition:background .12s; }
    .emoji-cat-btn:hover, .emoji-cat-btn.active { background:rgba(255,255,255,.1); }
    .emoji-grid { display:grid; grid-template-columns:repeat(8,1fr); gap:2px; max-height:250px; overflow-y:auto; }
    .emoji-grid-item { width:100%; aspect-ratio:1; border:none; background:transparent; font-size:1.3rem; cursor:pointer; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:background .1s; }
    .emoji-grid-item:hover { background:rgba(255,255,255,.12); }
    .call-record-btn { background:transparent; border:1px solid #ef4444; color:#ef4444; border-radius:50%; width:36px; height:36px; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; transition:background .15s; }
    .call-record-btn:hover { background:rgba(239,68,68,.15); }
    .call-record-btn.recording { background:#ef4444; color:#fff; animation:recPulse 1s infinite; }
    .scheduled-list { max-height:200px; overflow:auto; }
    .scheduled-item { display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-bottom:1px solid var(--c-border-item); font-size:.82rem; }
    .scheduled-item:last-child { border-bottom:none; }
    .scheduled-text { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--c-text-chat); }
    .scheduled-time { color:var(--c-text-muted); font-size:.72rem; margin:0 8px; }
    [aria-hidden="true"] { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }
    .skip-link { position:absolute; top:-40px; left:0; background:var(--c-accent); color:#fff; padding:8px 16px; z-index:10000; transition:top .2s; }
    .skip-link:focus { top:0; }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }
    .kbd { display:inline-block; padding:1px 5px; background:var(--c-surface-2); border:1px solid var(--c-border-item); border-radius:4px; font-size:.7rem; font-family:monospace; color:var(--c-text-meta); }
  `;
  document.head.appendChild(_featureCSS);

  async function safeJson(res) {
    try { return await res.json(); } catch { return {}; }
  }

  async function loadJSON(path, opts) {
    const res = await fetch(path, opts);
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || data.error || 'HTTP ' + res.status);
    return data;
  }

  function toast(message, type = 'error') {
    let container = document.getElementById('toasts');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toasts';
      container.className = 'toasts';
      document.body.appendChild(container);
    }
    const item = document.createElement('div');
    item.className = 'toast ' + type;
    item.textContent = message;
    container.appendChild(item);
    setTimeout(() => item.remove(), 2500);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

      function formatTime(iso) {
        try { return new Date(iso).toLocaleString('no-NO'); } catch { return iso; }
      }

      function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }

      function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
      }

  async function ensureIdentity() {
    try {
      await window.__CRYPTO__.getOrCreateIdentity();
    } catch (e) {
      console.warn('E2EE identity init failed', e);
    }
  }

  async function getPeerPublicKeyPem(user) {
    try {
      const data = await loadJSON('/keys/' + encodeURIComponent(user));
      return data.publicKey || null;
    } catch (e) {
      return null;
    }
  }

  async function encryptForPeer(plaintext, peerPublicKeyPem) {
    try {
      const key = await window.__CRYPTO__.getSharedKey(peerPublicKeyPem);
      const encrypted = await window.__CRYPTO__.encryptMessage(plaintext, key);
      return encrypted.ciphertext;
    } catch (e) {
      console.warn('encryption failed', e);
      return plaintext;
    }
  }

  async function decryptFromPeer(ciphertext, peerPublicKeyPem) {
    try {
      if (!ciphertext || !peerPublicKeyPem) return ciphertext;
      const parts = String(ciphertext).split('.');
      if (parts.length !== 2) return ciphertext;
      const key = await window.__CRYPTO__.getSharedKey(peerPublicKeyPem);
      const decrypted = await window.__CRYPTO__.decryptMessage({ iv: parts[0], ciphertext: parts[1] }, key);
      return decrypted;
    } catch (e) {
      return '[Kunne ikke dekryptere]';
    }
  }

  const THEME_PRESETS = {
    dark: {
      name: 'Dark', dot: '#7a3bff',
      vars: {}
    },
    midnight: {
      name: 'Midnight Blue', dot: '#4a9eff',
      vars: {
        '--c-bg': '#0a1628', '--c-surface': '#0d1f3c', '--c-surface-2': '#112847',
        '--c-surface-hover': '#163052', '--c-chat-bg': '#0b1929',
        '--c-border': '#122a45', '--c-border-item': '#1a3555', '--c-border-focus': '#4a9eff',
        '--c-text': '#e0eaff', '--c-text-chat': '#f0f6ff', '--c-text-meta': '#8aafda',
        '--c-text-muted': '#5a8ab5', '--c-text-name': '#d0e4ff', '--c-text-preview': '#7a9fc5',
        '--c-sender': '#ff8fab', '--c-brand': '#64b5f6', '--c-accent': '#4a9eff',
        '--c-accent2': '#7ec8f8', '--c-success': '#4ade80',
        '--c-sent-bg': '#0d2a4a', '--c-sent-border': '#4a9eff', '--c-sent-text': '#f0f6ff',
        '--c-received-bg': '#0f2035', '--c-received-border': '#1e4060',
        '--c-input-bg': '#081420', '--c-input-border': '#1a3555', '--c-input-text': '#e0eaff',
        '--c-badge-bg': '#112847', '--c-badge-border': '#1e4060', '--c-badge-text': '#c0daf0',
        '--c-btn-ghost-border': '#1e4060',
      }
    },
    forest: {
      name: 'Forest', dot: '#4caf50',
      vars: {
        '--c-bg': '#0a120a', '--c-surface': '#132413', '--c-surface-2': '#1a331a',
        '--c-surface-hover': '#204020', '--c-chat-bg': '#0e180e',
        '--c-border': '#1a2e1a', '--c-border-item': '#224022', '--c-border-focus': '#4caf50',
        '--c-text': '#e0f0e0', '--c-text-chat': '#f0fff0', '--c-text-meta': '#8ab88a',
        '--c-text-muted': '#5a8a5a', '--c-text-name': '#c0e8c0', '--c-text-preview': '#7aaa7a',
        '--c-sender': '#ff8fab', '--c-brand': '#66bb6a', '--c-accent': '#4caf50',
        '--c-accent2': '#81c784', '--c-success': '#66bb6a',
        '--c-sent-bg': '#1a3a1a', '--c-sent-border': '#4caf50', '--c-sent-text': '#f0fff0',
        '--c-received-bg': '#152a15', '--c-received-border': '#2a4a2a',
        '--c-input-bg': '#0a140a', '--c-input-border': '#224022', '--c-input-text': '#e0f0e0',
        '--c-badge-bg': '#1a331a', '--c-badge-border': '#2a4a2a', '--c-badge-text': '#b0d8b0',
        '--c-btn-ghost-border': '#2a4a2a',
      }
    },
    sunset: {
      name: 'Sunset', dot: '#ff6b35',
      vars: {
        '--c-bg': '#1a0a0a', '--c-surface': '#2d1414', '--c-surface-2': '#3d1c1c',
        '--c-surface-hover': '#4d2424', '--c-chat-bg': '#201010',
        '--c-border': '#3a1e1e', '--c-border-item': '#4a2828', '--c-border-focus': '#ff6b35',
        '--c-text': '#ffe8e0', '--c-text-chat': '#fff4ee', '--c-text-meta': '#cc9080',
        '--c-text-muted': '#aa6a5a', '--c-text-name': '#ffd8c8', '--c-text-preview': '#bb8070',
        '--c-sender': '#ff8fab', '--c-brand': '#ff8a65', '--c-accent': '#ff6b35',
        '--c-accent2': '#ffab91', '--c-success': '#4ade80',
        '--c-sent-bg': '#3d1c1c', '--c-sent-border': '#ff6b35', '--c-sent-text': '#fff4ee',
        '--c-received-bg': '#2a1515', '--c-received-border': '#4a2828',
        '--c-input-bg': '#1a0808', '--c-input-border': '#4a2828', '--c-input-text': '#ffe8e0',
        '--c-badge-bg': '#3d1c1c', '--c-badge-border': '#4a2828', '--c-badge-text': '#ddc0b0',
        '--c-btn-ghost-border': '#4a2828',
      }
    },
    ocean: {
      name: 'Ocean', dot: '#00bcd4',
      vars: {
        '--c-bg': '#041520', '--c-surface': '#0a2333', '--c-surface-2': '#0e2d40',
        '--c-surface-hover': '#12374d', '--c-chat-bg': '#061a28',
        '--c-border': '#0e2a3a', '--c-border-item': '#143548', '--c-border-focus': '#00bcd4',
        '--c-text': '#e0f4f8', '--c-text-chat': '#f0fafe', '--c-text-meta': '#80b8cc',
        '--c-text-muted': '#5090a8', '--c-text-name': '#c0eaf4', '--c-text-preview': '#70a8c0',
        '--c-sender': '#ff8fab', '--c-brand': '#4dd0e1', '--c-accent': '#00bcd4',
        '--c-accent2': '#80deea', '--c-success': '#4ade80',
        '--c-sent-bg': '#0e2d40', '--c-sent-border': '#00bcd4', '--c-sent-text': '#f0fafe',
        '--c-received-bg': '#0a2230', '--c-received-border': '#143548',
        '--c-input-bg': '#041218', '--c-input-border': '#143548', '--c-input-text': '#e0f4f8',
        '--c-badge-bg': '#0e2d40', '--c-badge-border': '#143548', '--c-badge-text': '#b0dce8',
        '--c-btn-ghost-border': '#143548',
      }
    },
    nord: {
      name: 'Nord', dot: '#88c0d0',
      vars: {
        '--c-bg': '#2e3440', '--c-surface': '#3b4252', '--c-surface-2': '#434c5e',
        '--c-surface-hover': '#4c566a', '--c-chat-bg': '#333a47',
        '--c-border': '#3b4252', '--c-border-item': '#434c5e', '--c-border-focus': '#88c0d0',
        '--c-text': '#eceff4', '--c-text-chat': '#eceff4', '--c-text-meta': '#a0aabe',
        '--c-text-muted': '#7b88a0', '--c-text-name': '#d8dee9', '--c-text-preview': '#90a0b8',
        '--c-sender': '#bf616a', '--c-brand': '#81a1c1', '--c-accent': '#88c0d0',
        '--c-accent2': '#8fbcbb', '--c-success': '#a3be8c',
        '--c-sent-bg': '#434c5e', '--c-sent-border': '#88c0d0', '--c-sent-text': '#eceff4',
        '--c-received-bg': '#3b4252', '--c-received-border': '#4c566a',
        '--c-input-bg': '#2e3440', '--c-input-border': '#4c566a', '--c-input-text': '#eceff4',
        '--c-badge-bg': '#434c5e', '--c-badge-border': '#4c566a', '--c-badge-text': '#c0cce0',
        '--c-btn-ghost-border': '#4c566a',
      }
    }
  };

  async function init() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    try {
      await ensureIdentity();
      const [usersRes, groupsRes] = await Promise.all([
        fetch('/users/all'),
        fetch('/groups')
      ]);
      const usersData = await safeJson(usersRes);
      const groupsData = await safeJson(groupsRes);
      const users = usersData.users || [];
      const groups = groupsData.groups || [];

      const app = document.getElementById('app');
      if (!app) throw new Error('Missing #app');

      app.innerHTML = `
        <header class="header">
          <div class="header-left">
            <h1 class="brand">CryptoChat</h1>
            <button id="logoutBtn" class="btn btn-small btn-ghost">Logg ut</button>
          </div>
          <div class="header-actions">
            <button id="adminBtn" class="btn btn-small btn-ghost" style="display:none">⚙️ Admin</button>
            <button id="profileBtn" class="btn btn-small btn-ghost">Min profil</button>
            <button id="audioCallBtn" class="btn btn-small btn-primary" title="Lydsamtale">📞</button>
            <button id="videoCallBtn" class="btn btn-small btn-primary" title="Videosamtale">📹</button>
            <div class="theme-wrapper">
              <button id="themeBtn" class="btn btn-small btn-ghost">Tema</button>
              <div id="themePicker" class="theme-picker"></div>
            </div>
            <button id="fa2Btn" class="btn btn-small btn-ghost" aria-label="Tofaktorautentisering">2FA</button>
            <button id="sessionsBtn" class="btn btn-small btn-ghost" aria-label="Administrer enheter">Enheter</button>
            <button id="rotateKeyBtn" class="btn btn-small btn-ghost" title="Roter.noekkel" aria-label="Roter krypteringsnoekkel">🔄</button>
          </div>
        </header>
        <div class="app-row">
          <aside class="sidebar" role="navigation" aria-label="Kontakter">
            <div class="section">
              <div class="section-title">MELDINGER</div>
              <div id="savedMsgItem" class="item saved-messages-item" role="option" tabindex="0" aria-label="Lagrede meldinger" style="cursor:pointer;margin-bottom:6px;">
                <div class="avatar-wrap"><div class="avatar" style="background:linear-gradient(135deg,#cf6fef,#7a3bff);">📌</div></div>
                <div><div class="name">Lagrede meldinger</div><div class="preview">Dine notater og bokmerker</div></div>
              </div>
              <div id="usersList" class="list" role="listbox" aria-label="Kontakter"></div>
            </div>
            <div class="section">
              <div class="section-title">GRUPPER</div>
              <div id="groupsList" class="list" role="listbox" aria-label="Grupper"></div>
              <button id="createGroupBtn" class="btn btn-small btn-ghost" aria-label="Opprett ny gruppe">+ Ny gruppe</button>
            </div>
          </aside>
          <main class="chat-main" role="main">
            <header class="chat-header" role="banner">
              <div>
                <div id="chatTitle" class="chat-title" aria-live="polite">Velg en samtale</div>
                <div id="chatMeta" class="chat-meta" aria-live="polite"></div>
              </div>
              <div class="chat-actions">
                <input id="searchPartner" class="input-text" placeholder="Kontakt for soek" autocomplete="off" aria-label="Soek paa kontakt" />
                <input id="searchInput" class="input-text" placeholder="Soek i meldinger..." autocomplete="off" aria-label="Soek i meldinger" />
                <button id="searchBtn" class="btn btn-small btn-ghost" aria-label="Soek">Soek</button>
                <button id="fileSearchBtn" class="btn btn-small btn-ghost" title="Soek i filer" aria-label="Soek i filer">📎</button>
                <button id="myKeyBtn" class="btn btn-small btn-ghost" aria-label="Vis min offentlige noekkel">Min noekkel</button>
                <button id="verifyBtn" class="btn btn-small btn-ghost verify-btn" style="display:none" title="Sikkerhetsnummer" aria-label="Verifiser samtale">🛡️</button>
                <button id="exportBtn" class="btn btn-small btn-ghost" title="Eksporter samtale" aria-label="Eksporter chat" style="display:none">💾</button>
                <button id="wallpaperBtn" class="btn btn-small btn-ghost" title="Bakgrunn" aria-label="Velg bakgrunn" style="display:none">🖼️</button>
                <button id="groupAdminBtn" class="btn btn-small btn-ghost" title="Gruppeinnstillinger" aria-label="Gruppeinnstillinger" style="display:none">⚙️</button>
              </div>
            </header>
            <div id="pinnedBar" class="pinned-bar" style="display:none" role="button" tabindex="0" aria-label="Fast melding">
              <span class="pin-icon">📌</span>
              <span class="pin-text" id="pinnedText"></span>
              <button class="pin-close" id="pinnedClose" aria-label="Fjern fast melding">&#10005;</button>
            </div>
            <div id="messages" class="messages" role="log" aria-live="polite" aria-label="Meldinger">
              <div class="empty-state">
                <div class="empty-icon">💬</div>
                <h3>Ingen samtale valgt</h3>
                <p>Velg en kontakt eller gruppe.</p>
              </div>
            </div>
            <div id="dropOverlay" class="drop-overlay" aria-hidden="true">
              <div class="drop-overlay-content">
                <div class="drop-icon">📁</div>
                <div>Slipp fil her</div>
              </div>
            </div>
            <div id="composer" class="composer" style="display:none" role="form" aria-label="Meldingskomposisjon">
              <div id="imagePreview" class="image-preview" style="display:none"></div>
              <input id="fileInput" type="file" class="input-text" aria-label="Velg fil" />
              <div id="replyBar" class="reply-bar" style="display:none" aria-live="polite">
                <span class="reply-bar-text">Svarer paa: <strong id="replyBarName"></strong> <span id="replyBarPreview"></span></span>
                <button id="cancelReply" class="reply-bar-cancel" aria-label="Avbryt svar">&#10005;</button>
              </div>
              <div class="composer-row" style="position:relative">
                <button id="emojiToggleBtn" class="btn btn-small btn-ghost" title="Emoji" aria-label="Velg emoji">😀</button>
                <button id="stickerBtn" class="btn btn-small btn-ghost" title="Stickers/GIFs" aria-label="Stickers og GIFs">🎨</button>
                <div id="stickerPicker" class="sticker-picker" role="dialog" aria-label="Sticker-velger">
                  <div id="stickerTabs" class="sticker-tabs"></div>
                  <div id="stickerContent" class="sticker-grid"></div>
                </div>
                <div id="fullEmojiPicker" class="full-emoji-picker" role="dialog" aria-label="Emoji-velger">
                  <input id="emojiSearch" class="emoji-search" placeholder="Soek emoji..." aria-label="Soek emoji" />
                  <div id="emojiCategories" class="emoji-categories"></div>
                  <div id="emojiGrid" class="emoji-grid" role="grid" aria-label="Emoji"></div>
                </div>
                <input id="messageInput" class="input-text" placeholder="Skriv en melding..." autocomplete="off" aria-label="Skriv en melding" />
                <button id="voiceRecordBtn" class="btn btn-small btn-ghost" title="Talebeskjed" aria-label="Talebeskjed">🎙️</button>
                <button id="videoRecordBtn" class="btn btn-small btn-ghost" title="Videomelding" aria-label="Videomelding">📹</button>
                <button id="locationBtn" class="btn btn-small btn-ghost" title="Del posisjon" aria-label="Del posisjon">📍</button>
                <button id="pollBtn" class="btn btn-small btn-ghost" title="Opprett avstemning" aria-label="Opprett avstemning" style="display:none">📊</button>
                <span id="silentToggle" class="silent-toggle" title="Lydløs melding" aria-label="Lydløs melding">🔇</span>
                <button id="sendBtn" class="btn btn-primary" disabled aria-label="Send melding">Send</button>
              </div>
              <div id="scheduleBar" class="schedule-bar" style="display:none">
                <span style="font-size:.78rem;color:var(--c-text-muted)">📅</span>
                <input id="scheduleTime" type="datetime-local" aria-label="Send senere" />
                <button id="scheduleSendBtn" class="btn btn-small btn-primary">Planlegg</button>
                <button id="scheduleCancelBtn" class="btn btn-small btn-ghost">✕</button>
              </div>
            </div>
          </main>
        </div>
      `;

      const usersList = document.getElementById('usersList');
      const groupsList = document.getElementById('groupsList');
      const chatTitle = document.getElementById('chatTitle');
      const chatMeta = document.getElementById('chatMeta');
      const messagesBox = document.getElementById('messages');
      const composer = document.getElementById('composer');
      const dropOverlay = document.getElementById('dropOverlay');
      const imagePreview = document.getElementById('imagePreview');

      let activeChat = null;
      let replyingTo = null;
      let interval = null;
      let userScrolledUp = false;
      let lastMessages = {};
      let groupLastMessages = {};
      // ── WebRTC Call state ──
      let currentCall = null;
      let peerConnection = null;
      let localStream = null;
      let callPollInterval = null;
      const ICE_SERVERS = (() => {
        const servers = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ];
        const turnUrl = window.__APP__?.turnUrl;
        const turnUser = window.__APP__?.turnUser;
        const turnPass = window.__APP__?.turnPass;
        if (turnUrl && turnUser && turnPass) {
          servers.push({ urls: turnUrl, username: turnUser, credential: turnPass });
        }
        return { iceServers: servers };
      })();
      let presence = {};
      let typingTimeout = null;
      let isTyping = false;
      let knownMessageIds = new Set();
      let firstLoadPerChat = new Set();
      let userProfiles = {};
      let currentTheme = localStorage.getItem('chat-theme') || window.__APP__?.theme || 'dark';
      let droppedFile = null;
      let verificationStatuses = {};
      let unreadCounts = {};
      let _notificationAudio = null;
      window.__lastSeenTimes = {};

      async function fetchVerificationStatus(username) {
        try {
          const data = await loadJSON('/verify/status/' + encodeURIComponent(username));
          verificationStatuses[username] = data.verified || false;
          return data.verified || false;
        } catch { return false; }
      }

      async function fetchBatchVerification(usernames) {
        try {
          const data = await loadJSON('/verify/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: usernames })
          });
          if (data.statuses) Object.assign(verificationStatuses, data.statuses);
        } catch {}
      }

      function formatSafetyNumber(digits) {
        if (!digits) return '';
        const groups = [];
        for (let i = 0; i < digits.length; i += 5) {
          groups.push('<span class="digit-group">' + escapeHtml(digits.slice(i, i + 5)) + '</span>');
        }
        return groups.join(' ');
      }

      function generateQRCode(text, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const modules = generateQRMatrix(text);
        const moduleCount = modules.length;
        const cellSize = size / (moduleCount + 8);
        const offset = cellSize * 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';
        for (let r = 0; r < moduleCount; r++) {
          for (let c = 0; c < moduleCount; c++) {
            if (modules[r][c]) {
              ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize + 0.5, cellSize + 0.5);
            }
          }
        }
        return canvas;
      }

      function generateQRMatrix(text) {
        const data = [];
        for (let i = 0; i < text.length; i++) {
          const charCode = text.charCodeAt(i);
          if (charCode < 128) data.push(charCode);
          else if (charCode < 2048) { data.push(192 | (charCode >> 6)); data.push(128 | (charCode & 63)); }
          else { data.push(224 | (charCode >> 12)); data.push(128 | ((charCode >> 6) & 63)); data.push(128 | (charCode & 63)); }
        }
        const mode = 4;
        const ecLevel = 1;
        const version = Math.max(1, Math.min(10, Math.ceil((data.length + 10) / 30)));
        const size = 17 + version * 4;
        const matrix = Array.from({ length: size }, () => Array(size).fill(false));
        const reserved = Array.from({ length: size }, () => Array(size).fill(false));
        for (let i = 0; i < 8; i++) {
          setModule(matrix, reserved, 0, i, i < 6);
          setModule(matrix, reserved, i, 0, i < 6);
          setModule(matrix, reserved, size - 1 - i, 0, i < 6);
          setModule(matrix, reserved, 0, size - 1 - i, i < 6);
          setModule(matrix, reserved, size - 7 + i, 0, false);
          setModule(matrix, reserved, 0, size - 7 + i, false);
        }
        for (let i = 8; i < size - 8; i++) {
          setModule(matrix, reserved, 6, i, i % 2 === 0);
          setModule(matrix, reserved, i, 6, i % 2 === 0);
        }
        let bitIndex = 0;
        const allBits = [];
        allBits.push(1, 0, 0, 0);
        const dataLength = data.length;
        for (let i = 7; i >= 0; i--) allBits.push((dataLength >> i) & 1);
        for (const byte of data) {
          for (let i = 7; i >= 0; i--) allBits.push((byte >> i) & 1);
        }
        while (allBits.length < (size * size * 2)) allBits.push(0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1);
        let bitPos = 0;
        for (let right = size - 1; right >= 1; right -= 2) {
          if (right === 6) right = 5;
          for (let vert = 0; vert < size; vert++) {
            for (let j = 0; j < 2; j++) {
              const col = right - j;
              const row = ((Math.floor((size - 1 - right) / 2)) % 2 === 0) ? size - 1 - vert : vert;
              if (!reserved[row][col] && bitPos < allBits.length) {
                matrix[row][col] = !!allBits[bitPos];
                bitPos++;
              }
            }
          }
        }
        return matrix;
      }

      function setModule(matrix, reserved, row, col, value) {
        if (row >= 0 && row < matrix.length && col >= 0 && col < matrix.length) {
          matrix[row][col] = value;
          reserved[row][col] = true;
        }
      }

      function showSafetyNumberModal(username) {
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = '<div class="modal" style="max-width:460px">'
          + '<h2>Sikkerhetsnummer</h2>'
          + '<div class="verify-step"><div class="verify-step-num">1</div>'
          + '<div class="verify-step-text">Sammenlign sikkerhetsnummeret med ' + escapeHtml(getDisplayName(username)) + '</div></div>'
          + '<div id="safetyNumberContent" style="text-align:center;color:var(--c-text-muted);">Laster...</div>'
          + '<div id="verifyStatusBadge"></div>'
          + '<div class="verify-actions">'
          + '<button id="verifyToggleBtn" class="btn btn-primary"></button>'
          + '<button id="verifyCloseBtn" class="btn btn-ghost">Lukk</button>'
          + '</div></div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('#verifyCloseBtn').addEventListener('click', () => overlay.remove());

        loadJSON('/verify/safety-number/' + encodeURIComponent(username)).then(data => {
          const content = overlay.querySelector('#safetyNumberContent');
          const badge = overlay.querySelector('#verifyStatusBadge');
          const toggleBtn = overlay.querySelector('#verifyToggleBtn');
          if (!data.success) {
            content.innerHTML = '<p style="color:var(--c-text-muted)">' + escapeHtml(data.message || 'Kunne ikke hente sikkerhetsnummer') + '</p>';
            return;
          }
          const qrCanvas = generateQRCode(data.safetyNumber, 180);
          content.innerHTML = '<div class="verify-qr-wrap"></div>'
            + '<div class="safety-number-display">' + formatSafetyNumber(data.safetyNumber) + '</div>'
            + '<div class="safety-number-label">Sikkerhetsnummer for ' + escapeHtml(getDisplayName(data.usernameA)) + ' &harr; ' + escapeHtml(getDisplayName(data.usernameB)) + '</div>';
          content.querySelector('.verify-qr-wrap').appendChild(qrCanvas);

          if (data.verified) {
            badge.innerHTML = '<span class="verify-status-badge verified">✓ Verifisert' + (data.verifiedAt ? ' — ' + formatTime(data.verifiedAt) : '') + '</span>';
            toggleBtn.textContent = 'Fjern verifisering';
            toggleBtn.className = 'btn btn-ghost';
          } else {
            badge.innerHTML = '<span class="verify-status-badge unverified">Ikke verifisert</span>';
            toggleBtn.textContent = 'Jeg har verifisert';
            toggleBtn.className = 'btn btn-primary';
          }

          toggleBtn.addEventListener('click', async () => {
            try {
              if (data.verified) {
                await loadJSON('/verify/' + encodeURIComponent(username), { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                toast('Verifisering fjernet', 'success');
              } else {
                await loadJSON('/verify/' + encodeURIComponent(username), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                toast('Samtale verifisert', 'success');
              }
              await fetchVerificationStatus(username);
              updateVerifyButton();
              overlay.remove();
            } catch (e) {
              toast('Kunne ikke oppdatere verifisering');
            }
          });
        }).catch(() => {
          overlay.querySelector('#safetyNumberContent').innerHTML = '<p style="color:var(--c-text-muted)">Kunne ikke hente sikkerhetsnummer</p>';
        });
      }

      function updateVerifyButton() {
        const btn = document.getElementById('verifyBtn');
        if (!btn) return;
        if (activeChat && activeChat.type === 'user') {
          btn.style.display = '';
          const verified = verificationStatuses[activeChat.target] || false;
          btn.classList.toggle('verified', verified);
          btn.title = verified ? 'Verifisert — klikk for å se sikkerhetsnummer' : 'Verifiser samtale';
        } else {
          btn.style.display = 'none';
        }
        if (activeChat && activeChat.type === 'user') {
          const meta = document.getElementById('chatMeta');
          const existingIndicator = meta.querySelector('.verify-indicator');
          if (existingIndicator) existingIndicator.remove();
          const verified = verificationStatuses[activeChat.target] || false;
          const indicator = document.createElement('span');
          indicator.className = 'verify-indicator' + (verified ? '' : ' unverified');
          indicator.textContent = verified ? '🛡️ Verifisert' : '';
          if (verified) meta.insertBefore(indicator, meta.firstChild);
        }
      }

      document.getElementById('verifyBtn').addEventListener('click', () => {
        if (activeChat && activeChat.type === 'user') {
          showSafetyNumberModal(activeChat.target);
        }
      });

      function getDisplayName(username) {
        const p = userProfiles[username];
        if (p && p.display_name) return p.display_name;
        return username;
      }

      function setChatMeta(e2eeHtml) {
        chatMeta.innerHTML = (e2eeHtml || '') + ' <span id="typingIndicator" class="typing-indicator"></span>';
      }

      function renderUsers() {
        usersList.innerHTML = '';
        const list = Array.isArray(users) ? users : [];
        list.forEach(u => {
          const name = typeof u === 'string' ? u : (u && u.username) || JSON.stringify(u);
          const displayName = (typeof u === 'object' && u && u.display_name) ? u.display_name : getDisplayName(name);
          if (typeof u === 'object' && u && u.username) userProfiles[u.username] = u;
          const item = document.createElement('div');
          item.className = 'item';
          item.dataset.user = name;
          const preview = lastMessages[name] || '';
          const verified = verificationStatuses[name] || false;
          const verifyIcon = verified ? '<span class="verify-icon" title="Verifisert">🛡️</span>' : '';
          const badge = (unreadCounts[name] || 0) > 0 ? '<span class="badge-count">' + Math.min(unreadCounts[name], 99) + '</span>' : '';
          const lastSeenText = presence[name] ? '' : (window.__lastSeenTimes && window.__lastSeenTimes[name] ? '<div class="last-seen">Sist sett: ' + escapeHtml(formatTime(window.__lastSeenTimes[name])) + '</div>' : '');
          item.innerHTML = '<div class="avatar-wrap"><div class="avatar">' + escapeHtml((displayName || name)[0]) + '</div>' + (presence[name] ? '<div class="presence"></div>' : '') + '</div><div style="flex:1;min-width:0;"><div class="name">' + escapeHtml(displayName) + verifyIcon + '</div><div class="preview">' + escapeHtml(preview) + lastSeenText + '</div></div>' + badge;
          item.addEventListener('click', () => { activateItem(usersList, item); openChat(name); });
          usersList.appendChild(item);
        });
      }

      function renderGroups() {
        groupsList.innerHTML = '';
        groups.forEach(g => {
          const item = document.createElement('div');
          item.className = 'item';
          item.dataset.groupId = g.id;
          const preview = groupLastMessages[g.id] || '';
          item.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><div style="min-width:0;flex:1;"><div class="name">' + escapeHtml(g.name) + '</div><div class="preview">' + escapeHtml(preview || ((g.members || []).length + ' medlemmer')) + '</div></div><button class="btn btn-small btn-ghost delete-group" data-id="' + escapeHtml(g.id) + '">Slett</button></div>';
          item.addEventListener('click', (e) => { if (e.target.closest('.delete-group')) return; activateItem(groupsList, item); openGroup(g.id); });
          const del = item.querySelector('.delete-group');
          if (del) del.addEventListener('click', async () => { await deleteGroup(g.id); });
          groupsList.appendChild(item);
        });
      }

      async function deleteGroup(groupId) {
        const nameInput = prompt('Skriv inn gruppenavn for aa bekrefte sletting:');
        if (!nameInput) return;
        const allGroups = await loadJSON('/groups');
        const group = (allGroups.groups || []).find(g => g.id === groupId);
        if (!group || group.name !== nameInput) return toast('Navnet matcher ikke');
        if (!confirm('Slett gruppen? Dette kan ikke angres.')) return;
        try {
          await fetch('/groups/' + encodeURIComponent(groupId), { method: 'DELETE' });
          toast('Gruppen er slettet', 'success');
          const data = await loadJSON('/groups');
          groups.length = 0;
          groups.push(...(data.groups || []));
          renderGroups();
        } catch (e) {
          toast('Kunne ikke slette gruppe');
        }
      }

      function activateItem(listContainer, item) {
        const siblings = listContainer.querySelectorAll('.item');
        siblings.forEach(el => el.classList.remove('active'));
        item.classList.add('active');
      }

      renderUsers();
      renderGroups();

      // ── Saved Messages click ──
      document.getElementById('savedMsgItem').addEventListener('click', () => {
        document.querySelectorAll('.item').forEach(el => el.classList.remove('active'));
        document.getElementById('savedMsgItem').classList.add('active');
        openSavedMessages();
      });

      async function openSavedMessages() {
        activeChat = { type: 'saved', target: '__self__' };
        chatTitle.textContent = '📌 Lagrede meldinger';
        setChatMeta('');
        messagesBox.innerHTML = '';
        composer.style.display = 'flex';
        clearImagePreview();
        document.getElementById('exportBtn').style.display = 'none';
        document.getElementById('pollBtn').style.display = 'none';
        try {
          const data = await loadJSON('/saved');
          const list = data.messages || [];
          messagesBox.innerHTML = '';
          if (!list.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">📌</div><h3>Ingen lagrede meldinger</h3><p>Bruk "Lagre" fra en meldingskontekst for å lagre her.</p></div>';
            return;
          }
          list.forEach(m => appendMessage(m));
          scrollToBottom();
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Kunne ikke laste lagrede meldinger</p></div>';
        }
      }

      async function saveMsgToSelf(messageId) {
        try {
          const msgs = await loadJSON('/messages/' + encodeURIComponent(activeChat.target));
          const msg = (msgs.messages || []).find(m => m.id === messageId);
          if (!msg) { toast('Melding ikke funnet'); return; }
          await loadJSON('/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ciphertext: msg.text || msg.ciphertext || '', type: msg.type || 'text' }) });
          toast('Melding lagret', 'success');
        } catch (e) {
          toast('Kunne ikke lagre melding');
        }
      }

      // ── Forward message ──
      async function forwardMsg(messageId) {
        const target = prompt('Videresend til (brukernavn):');
        if (!target) return;
        try {
          await loadJSON('/messages/' + encodeURIComponent(messageId) + '/forward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: target.trim().toLowerCase(), target_type: 'user' }) });
          toast('Melding videresendt', 'success');
        } catch (e) {
          toast('Kunne ikke videresende');
        }
      }

      // ── Export chat ──
      document.getElementById('exportBtn').addEventListener('click', () => {
        if (!activeChat || activeChat.type === 'saved') return;
        window.open('/export/' + activeChat.type + '/' + encodeURIComponent(activeChat.target), '_blank');
      });

      async function openChat(user) {
        activeChat = { type: 'user', target: user };
        replyingTo = null;
        const replyBar = document.getElementById('replyBar');
        if (replyBar) replyBar.style.display = 'none';
        clearTimeout(typingTimeout);
        isTyping = false;
        chatTitle.textContent = getDisplayName(user);
        const key = await getPeerPublicKeyPem(user);
        activeChat.peerPublicKey = key;
        setChatMeta(key ? '<span class="e2ee">🔒 Ende-til-ende-kryptert</span>' : '');
        messagesBox.innerHTML = '';
        composer.style.display = 'flex';
        clearImagePreview();
        document.getElementById('exportBtn').style.display = '';
        document.getElementById('pollBtn').style.display = 'none';
        await fetchVerificationStatus(user);
        updateVerifyButton();
        await loadChat(user);
        loadPinnedMessages('user', user);
        addDisappearToggle();
        await checkTypingIndicator();
        const input = document.getElementById('messageInput');
        if (input) input.focus();
      }

      async function loadChat(user) {
        if (!user || activeChat?.type !== 'user' || activeChat?.target !== user) return;
        try {
          messagesBox.innerHTML = '<div class="skeleton-loader"><div class="skeleton-msg skeleton-sent"></div><div class="skeleton-msg skeleton-received"></div><div class="skeleton-msg skeleton-sent short"></div></div>';
          const data = await loadJSON('/messages/' + encodeURIComponent(user));
          messagesBox.innerHTML = '';
          const list = data.messages || [];
          if (!list.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Ingen meldinger</p></div>';
          } else {
            const isFirst = !firstLoadPerChat.has(user);
            firstLoadPerChat.add(user);
            list.forEach(m => {
              if (m.id && !knownMessageIds.has(m.id)) {
                if (!isFirst && m.sender !== (window.__APP__?.username || '')) showMessageNotification(m);
                knownMessageIds.add(m.id);
              }
              appendMessage(m, user);
            });
          }
          await loadJSON('/read_receipts/' + encodeURIComponent(user), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
          if (list.length) lastMessages[user] = list[list.length - 1].text || '';
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Kunne ikke hente meldinger</p></div>';
          toast('Kunne ikke hente meldinger');
        }
      }

      async function openGroup(groupId) {
        const group = groups.find(g => g.id === groupId);
        activeChat = { type: 'group', target: groupId, groupE2EEKey: null };
        replyingTo = null;
        const replyBar = document.getElementById('replyBar');
        if (replyBar) replyBar.style.display = 'none';
        clearTimeout(typingTimeout);
        isTyping = false;
        chatTitle.textContent = group ? group.name : 'Gruppe';
        messagesBox.innerHTML = '';
        composer.style.display = 'flex';
        clearImagePreview();
        let e2eeHtml = '';
        try {
          const keyData = await loadJSON('/groups/' + encodeURIComponent(groupId) + '/keys');
          if (keyData.encryptedKey) {
            const myKeyPair = await window.__CRYPTO__.getOrCreateIdentity();
            const myPrivKey = await window.__CRYPTO__.importPrivateKey(myKeyPair.privateKeyPem);
            const parts = keyData.encryptedKey.split('.');
            if (parts.length === 2) {
              const iv = base64ToArrayBuffer(parts[0]);
              const enc = base64ToArrayBuffer(parts[1]);
              const rawKey = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, myPrivKey, enc);
              activeChat.groupE2EEKey = await window.crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
              e2eeHtml = '<span class="e2ee">🔒 E2EE i gruppe</span>';
            }
          } else if (group && (group.members || []).length) {
            let anyKey = false;
            for (const member of group.members) { if (await getPeerPublicKeyPem(member)) { anyKey = true; break; } }
            if (anyKey) e2eeHtml = '<span class="e2ee">🔒 Delvis E2EE i gruppe</span>';
          }
        } catch (e) {
          if (group && (group.members || []).length) {
            let anyKey = false;
            for (const member of group.members) { if (await getPeerPublicKeyPem(member)) { anyKey = true; break; } }
            if (anyKey) e2eeHtml = '<span class="e2ee">🔒 Delvis E2EE i gruppe</span>';
          }
        }
        setChatMeta(e2eeHtml);
        updateVerifyButton();
        document.getElementById('exportBtn').style.display = '';
        document.getElementById('pollBtn').style.display = '';
        await loadGroup(groupId);
        loadPinnedMessages('group', groupId);
        await checkTypingIndicator();
        const input = document.getElementById('messageInput');
        if (input) input.focus();
      }

      async function loadGroup(groupId) {
        if (!groupId || activeChat?.type !== 'group' || activeChat?.target !== groupId) return;
        try {
          messagesBox.innerHTML = '<div class="skeleton-loader"><div class="skeleton-msg skeleton-sent"></div><div class="skeleton-msg skeleton-received"></div><div class="skeleton-msg skeleton-sent short"></div></div>';
          const data = await loadJSON('/groups/' + encodeURIComponent(groupId) + '/messages');
          messagesBox.innerHTML = '';
          const list = data.messages || [];
          if (!list.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>Ingen gruppemeldinger</p></div>';
          } else {
            const isFirst = !firstLoadPerChat.has(groupId);
            firstLoadPerChat.add(groupId);
            list.forEach(m => {
              if (m.id && !knownMessageIds.has(m.id)) {
                if (!isFirst && m.sender !== (window.__APP__?.username || '')) showMessageNotification(m);
                knownMessageIds.add(m.id);
              }
              appendMessage(m, groupId);
            });
            const last = list[list.length - 1];
            if (last) {
              let text = '';
              if (last.type === 'file') text = '📎 ' + (last.filename || 'fil');
              else text = (last.sender ? last.sender + ': ' : '') + (last.text || '');
              groupLastMessages[groupId] = text;
            }
          }
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Kunne ikke hente gruppemeldinger</p></div>';
          toast('Kunne ikke hente gruppemeldinger');
        }
      }

      function renderCallOverlay(info) {
        let overlay = document.getElementById('callOverlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'callOverlay';
          overlay.className = 'call-overlay';
          document.body.appendChild(overlay);
        }
        const isVideo = info.type === 'video';
        const remoteLabel = info.remote || '';
        const status = info.status || 'Ringer...';
        overlay.innerHTML = `
          <div class="call-container">
            <div class="call-header">
              <span class="call-status">${escapeHtml(status)}</span>
              <span class="call-name">${escapeHtml(remoteLabel)}</span>
            </div>
            <div class="call-videos">
              <video id="remoteVideo" class="call-video remote" autoplay playsinline></video>
              <video id="localVideo" class="call-video local" autoplay playsinline muted></video>
            </div>
            <div class="call-actions">
              <button id="callMicToggle" class="call-btn" title="Mikrofon">🎤</button>
              <button id="callCamToggle" class="call-btn" title="Kamera">📷</button>
              <button id="callScreenShare" class="call-btn" title="Del skjerm">🖥️</button>
              <button id="callHangup" class="call-btn call-hangup" title="Legg på">📞</button>
            </div>
          </div>
        `;
        document.getElementById('callHangup').addEventListener('click', hangUp);
        document.getElementById('callMicToggle').addEventListener('click', () => {
          if (localStream) {
            const audio = localStream.getAudioTracks()[0];
            if (audio) { audio.enabled = !audio.enabled; document.getElementById('callMicToggle').textContent = audio.enabled ? '🎤' : '🔇'; }
          }
        });
        document.getElementById('callCamToggle').addEventListener('click', () => {
          if (localStream) {
            const video = localStream.getVideoTracks()[0];
            if (video) { video.enabled = !video.enabled; document.getElementById('callCamToggle').textContent = video.enabled ? '📷' : '📷❌'; }
          }
        });
        document.getElementById('callScreenShare').addEventListener('click', async () => {
          try {
            if (peerConnection.getSenders().some(s => s.track && s.track.kind === 'video' && s.track.label.startsWith('Screen'))) {
              stopScreenShare();
              return;
            }
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            const screenTrack = screenStream.getVideoTracks()[0];
            screenTrack.onended = () => stopScreenShare();
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(screenTrack);
            }
            const lv = document.getElementById('localVideo');
            if (lv) lv.srcObject = screenStream;
            document.getElementById('callScreenShare').textContent = '🖥️✅';
            currentCall.screenSharing = true;
            currentCall.screenStream = screenStream;
          } catch (e) {
            if (e.name !== 'AbortError') toast('Kunne ikke dele skjerm');
          }
        });
        if (localStream) {
          const lv = document.getElementById('localVideo');
          if (lv) lv.srcObject = localStream;
        }
      }

      function stopScreenShare() {
        if (currentCall && currentCall.screenStream) {
          currentCall.screenStream.getTracks().forEach(t => t.stop());
          currentCall.screenStream = null;
        }
        if (localStream && peerConnection) {
          const camTrack = localStream.getVideoTracks()[0];
          if (camTrack) {
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(camTrack);
          }
        }
        const lv = document.getElementById('localVideo');
        if (lv && localStream) lv.srcObject = localStream;
        const btn = document.getElementById('callScreenShare');
        if (btn) btn.textContent = '🖥️';
        if (currentCall) currentCall.screenSharing = false;
      }

      function updateCallStatus(status) {
        const el = document.querySelector('.call-status');
        if (el) el.textContent = status;
      }

      function removeCallOverlay() {
        if (currentCall && currentCall.screenStream) {
          currentCall.screenStream.getTracks().forEach(t => t.stop());
        }
        const overlay = document.getElementById('callOverlay');
        if (overlay) overlay.remove();
        if (peerConnection) { peerConnection.close(); peerConnection = null; }
        if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
        if (callPollInterval) { clearInterval(callPollInterval); callPollInterval = null; }
        currentCall = null;
      }

      async function startCall(target, type) {
        try {
          const constraints = { audio: true, video: type === 'video' };
          localStream = await navigator.mediaDevices.getUserMedia(constraints);
          const initData = await loadJSON('/calls/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, type }) });
          if (!initData.success) { toast(initData.message || 'Kunne ikke starte samtale'); localStream.getTracks().forEach(t => t.stop()); localStream = null; return; }
          currentCall = { id: initData.call_id, target, type, role: 'caller' };
          renderCallOverlay({ remote: target, type, status: 'Ringer...' });
          peerConnection = new RTCPeerConnection(ICE_SERVERS);
          localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
          peerConnection.ontrack = (e) => { const rv = document.getElementById('remoteVideo'); if (rv) rv.srcObject = e.streams[0]; };
          peerConnection.onicecandidate = (e) => { if (e.candidate) loadJSON('/calls/ice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: currentCall.id, candidate: e.candidate.toJSON() }) }).catch(() => {}); };
          peerConnection.onconnectionstatechange = () => { const s = peerConnection.connectionState; if (s === 'connected') updateCallStatus('Tilkoblet'); if (s === 'disconnected' || s === 'failed') hangUp(); };
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          await loadJSON('/calls/offer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: currentCall.id, sdp: peerConnection.localDescription.toJSON() }) });
          startCallPolling();
        } catch (e) {
          toast('Kunne ikke starte samtale: ' + e.message);
          removeCallOverlay();
        }
      }

      async function answerCall(callId, caller, type) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
          currentCall = { id: callId, target: caller, type, role: 'callee' };
          renderCallOverlay({ remote: caller, type, status: 'Tilkoblet' });
          peerConnection = new RTCPeerConnection(ICE_SERVERS);
          localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
          peerConnection.ontrack = (e) => { const rv = document.getElementById('remoteVideo'); if (rv) rv.srcObject = e.streams[0]; };
          peerConnection.onicecandidate = (e) => { if (e.candidate) loadJSON('/calls/ice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: currentCall.id, candidate: e.candidate.toJSON() }) }).catch(() => {}); };
          peerConnection.onconnectionstatechange = () => { const s = peerConnection.connectionState; if (s === 'disconnected' || s === 'failed') hangUp(); };
          const offerData = await loadJSON('/calls/offer/' + callId);
          if (offerData.sdp) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            await loadJSON('/calls/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: callId, sdp: peerConnection.localDescription.toJSON() }) });
          }
          startCallPolling();
        } catch (e) {
          toast('Kunne ikke svare: ' + e.message);
          removeCallOverlay();
        }
      }

      async function hangUp() {
        if (currentCall) {
          loadJSON('/calls/hangup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: currentCall.id }) }).catch(() => {});
        }
        removeCallOverlay();
      }

      function startCallPolling() {
        if (callPollInterval) clearInterval(callPollInterval);
        callPollInterval = setInterval(async () => {
          if (!currentCall) { clearInterval(callPollInterval); return; }
          try {
            if (currentCall.role === 'caller') {
              const ansData = await loadJSON('/calls/answer/' + currentCall.id);
              if (ansData.sdp && peerConnection && !peerConnection.currentRemoteDescription) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(ansData.sdp));
                updateCallStatus('Tilkoblet');
              }
              if (ansData.status === 'ended') { removeCallOverlay(); toast('Samtale avsluttet'); return; }
            }
            const iceData = await loadJSON('/calls/ice/' + currentCall.id);
            if (iceData.candidates && peerConnection) {
              for (const c of iceData.candidates) {
                try { await peerConnection.addIceCandidate(new RTCIceCandidate(c)); } catch {}
              }
            }
            const statusData = await loadJSON('/calls/status/' + currentCall.id);
            if (statusData.status === 'ended') { removeCallOverlay(); toast('Samtale avsluttet'); }
          } catch {}
        }, 800);
      }

      async function checkIncomingCalls() {
        try {
          if (currentCall) return;
          const data = await loadJSON('/calls/incoming');
          if (data.call) {
            const call = data.call;
            const accept = confirm(`${call.caller} ringer (${call.type === 'video' ? 'video' : 'lyd'}). Svare?`);
            if (accept) {
              await answerCall(call.id, call.caller, call.type);
            } else {
              loadJSON('/calls/hangup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: call.id }) }).catch(() => {});
            }
          }
        } catch {}
      }

      function invertReactions(reactions) {
        const inverted = {};
        if (!reactions || typeof reactions !== 'object') return inverted;
        Object.entries(reactions).forEach(([user, emojis]) => {
          if (!Array.isArray(emojis)) return;
          emojis.forEach(emoji => {
            if (!inverted[emoji]) inverted[emoji] = [];
            inverted[emoji].push(user);
          });
        });
        return inverted;
      }

      function renderReactionBadges(reactions) {
        const inverted = invertReactions(reactions);
        const entries = Object.entries(inverted);
        if (!entries.length) return '';
        const me = window.__APP__?.username || '';
        return '<div class="reaction-badges">' + entries.map(([emoji, users]) => {
          const iReacted = users.includes(me);
          return '<span class="reaction-badge' + (iReacted ? ' reacted' : '') + '" data-emoji="' + escapeHtml(emoji) + '">' + emoji + ' ' + users.length + '</span>';
        }).join('') + '</div>';
      }

      function appendMessage(message, chatId) {
        const me = window.__APP__?.username || '';
        const isMe = message.sender === me;
        const renderedText = (() => {
          if (!isMe && message.type === 'text' && activeChat?.type === 'user' && activeChat?.peerPublicKey) {
            const text = decryptFromPeer(message.text, activeChat.peerPublicKey);
            return text;
          }
          if (!isMe && message.type === 'text' && activeChat?.type === 'group' && activeChat?.groupE2EEKey && message.e2ee) {
            try {
              const parts = String(message.text).split('.');
              if (parts.length === 2) {
                const iv = base64ToArrayBuffer(parts[0]);
                const enc = base64ToArrayBuffer(parts[1]);
                const dec = window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, activeChat.groupE2EEKey, enc);
                return dec.then(buf => new TextDecoder().decode(buf));
              }
            } catch (e) {}
            return '[Kunne ikke dekryptere]';
          }
          return message.text || '';
        })();

        if (typeof renderedText === 'string') {
          finishAppend(message, chatId, isMe, renderedText);
        } else {
          renderedText.then(text => finishAppend(message, chatId, isMe, text)).catch(() => finishAppend(message, chatId, isMe, '[Dekrypteringsfeil]'));
        }
      }

      function finishAppend(message, chatId, isMe, renderedText) {

        if (message.deleted) renderedText = '🗑️ [Melding slettet]';

        const item = document.createElement('div');
        item.className = 'msg ' + (isMe ? 'sent' : 'received') + (message.deleted ? ' deleted-msg' : '') + (message.edited ? ' edited' : '');
        if (message.id) item.dataset.messageId = message.id;
        item.dataset.msgId = message.id || '';

        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (message.deleted) return;
          replyingTo = { id: message.id, sender: message.sender, text: message.text || '' };
          document.getElementById('replyBar').style.display = 'flex';
          document.getElementById('replyBarName').textContent = message.sender;
          document.getElementById('replyBarPreview').textContent = (message.text || '').substring(0, 60);
          document.getElementById('messageInput').focus();
        });

        let fileHtml = '';
        if (message.type === 'file' && !message.deleted) {
          const isImage = /\.(png|jpe?g|gif|webp)$/i.test(message.filename || '');
          if (isImage) {
            fileHtml = '<div class="inline-image"><img src="/uploads/' + escapeHtml(message.filename) + '" alt=" bilde" onerror="this.parentElement.innerHTML=\'<div class=badge>📎 '+escapeHtml(message.filename||'fil')+'</div>\'" /></div>';
          } else {
            const audioExts = ['.webm', '.mp3', '.ogg', '.wav', '.opus', '.m4a'];
            const isVoice = message.filename && audioExts.some(ext => message.filename.toLowerCase().endsWith(ext));
            if (isVoice) {
              fileHtml = '<div class="voice-msg"><audio controls preload="none" src="/uploads/' + encodeURIComponent(message.filename) + '"></audio></div>';
            } else {
              fileHtml = '<div class="badge">📎 ' + escapeHtml(message.filename || 'fil') + '</div>';
            }
          }
        }

        const e2eeIndicator = (!isMe && message.type === 'text' && activeChat?.type === 'user' && activeChat?.peerPublicKey)
          ? '<span class="e2ee">🔒 E2EE</span> '
          : '';

        let tagHtml = '';
        if (message.edited) tagHtml += '<div class="edited-tag">[Redigert]</div>';
        if (message.deleted) tagHtml += '<div class="deleted-tag">[Slettet]</div>';
        if (message.silent) tagHtml += '<div class="edited-tag">🔇 Lydløs</div>';

        const reactionsHtml = renderReactionBadges(message.reactions);

        let actionsHtml = '';
        if (isMe && !message.deleted && message.id) {
          actionsHtml = '<div class="msg-actions">'
            + '<button class="msg-action-btn edit-btn" title="Rediger">✏️</button>'
            + '<button class="msg-action-btn delete-btn" title="Slett">🗑️</button>'
            + '<button class="msg-action-btn fwd-btn" title="Videresend">↪</button>'
            + '</div>';
        } else if (!isMe && !message.deleted && message.id) {
          actionsHtml = '<div class="msg-actions">'
            + '<button class="msg-action-btn save-msg-btn" title="Lagre">📌</button>'
            + '<button class="msg-action-btn fwd-btn" title="Videresend">↪</button>'
            + '</div>';
        }

        const senderDisplay = getDisplayName(message.sender || '');

        const replyHtml = message.reply_preview ? '<div class="reply-ref">&#8617; ' + escapeHtml(message.reply_preview) + '</div>' : '';
        const replyBtnHtml = (!isMe && !message.deleted && message.id) ? '<button class="reply-msg-btn" title="Svar">&#8617;</button>' : '';
        const fwdTag = message.forwarded_from ? '<div class="forwarded-tag">↪ Videresendt fra ' + escapeHtml(message.forwarded_from) + '</div>' : '';

        const pollHtml = (message.type === 'poll' && message.poll_id) ? '<div class="poll-placeholder" data-poll-id="' + escapeHtml(message.poll_id) + '">Laster avstemning...</div>' : '';
        const msgTextHtml = (message.type === 'poll' && message.poll_id) ? '' : '<div class="msg-text">' + (message.deleted ? '' : escapeHtml(renderedText)) + '</div>';

        item.innerHTML = (
          '<div class="meta"><span class="sender">' + escapeHtml(senderDisplay) + '</span>' + replyBtnHtml + '<span class="time">' + escapeHtml(formatTime(message.timestamp)) + '</span></div>'
          + fwdTag
          + replyHtml
          + fileHtml
          + pollHtml
          + msgTextHtml
          + tagHtml
          + '<div class="meta">' + e2eeIndicator + (isMe ? '<span class="read">' + (message.read ? '<span class="read-receipt read">✓✓</span>' : '<span class="read-receipt unread">✓</span>') + '</span>' : '') + '</div>'
          + reactionsHtml
          + actionsHtml
          + (message.id && !message.deleted ? '<button class="reaction-trigger" title="Reager">+</button>' : '')
        );

        const reactionTrigger = item.querySelector('.reaction-trigger');
        if (reactionTrigger) {
          reactionTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            showEmojiPicker(item, message.id);
          });
        }

        const editBtn = item.querySelector('.edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editMessage(message.id);
          });
        }

        const deleteBtn = item.querySelector('.delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteMessage(message.id);
          });
        }

        const fwdBtn = item.querySelector('.fwd-btn');
        if (fwdBtn) {
          fwdBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            forwardMsg(message.id);
          });
        }

        const saveMsgBtn = item.querySelector('.save-msg-btn');
        if (saveMsgBtn) {
          saveMsgBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            saveMsgToSelf(message.id);
          });
        }

        item.querySelectorAll('.reaction-badge').forEach(badge => {
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            const emoji = badge.dataset.emoji;
            if (emoji && message.id) toggleReaction(message.id, emoji);
          });
        });

        if (message.type === 'poll' && message.poll_id) {
          loadPoll(message.poll_id).then(poll => {
            const ph = item.querySelector('.poll-placeholder');
            if (ph && poll) {
              ph.outerHTML = renderPollCard(poll);
              item.querySelectorAll('.poll-option').forEach(opt => {
                opt.addEventListener('click', (e) => {
                  e.stopPropagation();
                  votePoll(message.poll_id, [parseInt(opt.dataset.idx)]);
                });
              });
            }
          });
        }

        messagesBox.appendChild(item);
        if (!userScrolledUp) messagesBox.scrollTop = messagesBox.scrollHeight;
      }

      async function sendMessage() {
        const input = document.getElementById('messageInput');
        const fileInput = document.getElementById('fileInput');
        const sendBtn = document.getElementById('sendBtn');
        if (!input || !activeChat) return;
        input.disabled = true;
        sendBtn.disabled = true;
        const text = (input.value || '').trim();
        const file = droppedFile || (fileInput && fileInput.files && fileInput.files[0]);
        droppedFile = null;
        if (!text && !file) { input.disabled = false; return; }
        try {
          if (file) {
            const form = new FormData();
            form.append('file', file);
            if (activeChat.type === 'user') form.append('recipient', activeChat.target); else form.append('groupId', activeChat.target);
            await fetch('/upload', { method: 'POST', body: form });
          } else {
            const url = activeChat.type === 'group' ? '/groups/' + encodeURIComponent(activeChat.target) + '/send' : '/send';
            const body = { ciphertext: text };
            if (activeChat.type === 'user') {
              const ciphertext = await encryptForPeer(text, activeChat.peerPublicKey);
              body.ciphertext = ciphertext;
              body.recipient = activeChat.target;
            } else if (activeChat.type === 'group' && activeChat.groupE2EEKey) {
              const iv = window.crypto.getRandomValues(new Uint8Array(12));
              const enc = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, activeChat.groupE2EEKey, new TextEncoder().encode(text));
              body.ciphertext = arrayBufferToBase64(iv) + '.' + arrayBufferToBase64(enc);
              body.e2ee = true;
            }
            if (replyingTo) body.reply_to = replyingTo.id;
            if (window._disappearMinutes && activeChat.type === 'user') body.self_destruct_minutes = window._disappearMinutes;
            await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          }
          input.value = '';
          clearImagePreview();
          replyingTo = null;
          const replyBar = document.getElementById('replyBar');
          if (replyBar) replyBar.style.display = 'none';
          if (fileInput) fileInput.value = '';
          if (activeChat.type === 'user') await loadChat(activeChat.target); else await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke sende: ' + e.message);
        } finally {
          input.disabled = false;
          sendBtn.disabled = !((input.value || '').trim() || droppedFile || (fileInput && fileInput.files && fileInput.files[0]));
        }
      }

      function updateSendButton() {
        const input = document.getElementById('messageInput');
        const fileInput = document.getElementById('fileInput');
        const sendBtn = document.getElementById('sendBtn');
        if (!input || !sendBtn) return;
        const text = (input.value || '').trim();
        const file = droppedFile || (fileInput && fileInput.files && fileInput.files[0]);
        sendBtn.disabled = !(text || file);
      }

      function clearImagePreview() {
        if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.innerHTML = ''; }
      }

      function showImagePreview(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.innerHTML = '<div class="img-preview"><img src="' + e.target.result + '" /><button class="remove-preview">&times;</button></div>';
          imagePreview.style.display = 'flex';
          imagePreview.querySelector('.remove-preview').addEventListener('click', () => {
            clearImagePreview();
            droppedFile = null;
            const fi = document.getElementById('fileInput');
            if (fi) fi.value = '';
            updateSendButton();
          });
        };
        reader.readAsDataURL(file);
      }

      if (messagesBox) {
        messagesBox.addEventListener('scroll', () => {
          const container = messagesBox;
          const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
          userScrolledUp = distanceFromBottom > 100;
        });
      }

      function handleTypingInput() {
        if (!activeChat) return;
        if (!isTyping) {
          isTyping = true;
          fetch('/typing', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: activeChat.target, typing: true })
          }).catch(() => {});
        }
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          isTyping = false;
          fetch('/typing', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: activeChat.target, typing: false })
          }).catch(() => {});
        }, 3000);
      }

      async function checkTypingIndicator() {
        if (!activeChat) return;
        const el = document.getElementById('typingIndicator');
        if (!el) return;
        try {
          const data = await loadJSON('/typing/' + encodeURIComponent(activeChat.target));
          if (data.typers && data.typers.length > 0) {
            const names = data.typers.map(u => getDisplayName(u)).join(', ');
            el.textContent = names + ' skriver...';
            el.style.display = '';
          } else {
            el.textContent = '';
            el.style.display = 'none';
          }
        } catch (e) {
          el.style.display = 'none';
        }
      }

      document.getElementById('sendBtn').addEventListener('click', sendMessage);
      document.getElementById('messageInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
      document.getElementById('messageInput').addEventListener('input', () => {
        updateSendButton();
        handleTypingInput();
      });
      document.getElementById('fileInput').addEventListener('change', (e) => {
        updateSendButton();
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) showImagePreview(file);
      });

      document.getElementById('cancelReply').addEventListener('click', () => {
        replyingTo = null;
        document.getElementById('replyBar').style.display = 'none';
      });

      messagesBox.addEventListener('click', (e) => {
        const btn = e.target.closest('.reply-msg-btn');
        if (!btn) return;
        const msgEl = btn.closest('.msg');
        if (!msgEl) return;
        const mid = msgEl.dataset.msgId;
        const sender = msgEl.querySelector('.sender')?.textContent || '';
        const textEl = msgEl.querySelector('.msg-text');
        const text = textEl ? textEl.textContent : '';
        replyingTo = { id: mid, sender, text };
        document.getElementById('replyBar').style.display = 'flex';
        document.getElementById('replyBarName').textContent = sender;
        document.getElementById('replyBarPreview').textContent = text.substring(0, 60);
        document.getElementById('messageInput').focus();
      });

      // ── Voice messages ──
      let mediaRecorder = null;
      let audioChunks = [];
      let isRecording = false;

      const voiceBtn = document.getElementById('voiceRecordBtn');
      if (voiceBtn) {
        voiceBtn.addEventListener('click', async () => {
          if (isRecording) {
            stopRecording();
            return;
          }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
            mediaRecorder.onstop = async () => {
              stream.getTracks().forEach(t => t.stop());
              const blob = new Blob(audioChunks, { type: 'audio/webm' });
              await sendVoiceMessage(blob);
            };
            mediaRecorder.start();
            isRecording = true;
            voiceBtn.textContent = '⏹️';
            voiceBtn.classList.add('recording');
          } catch (e) {
            toast('Kunne ikke starte opptak: ' + e.message);
          }
        });
      }

      function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        isRecording = false;
        const btn = document.getElementById('voiceRecordBtn');
        if (btn) { btn.textContent = '🎙️'; btn.classList.remove('recording'); }
      }

      async function sendVoiceMessage(blob) {
        if (!activeChat || blob.size < 100) return;
        const form = new FormData();
        const filename = 'voice-' + Date.now() + '.webm';
        form.append('file', blob, filename);
        if (activeChat.type === 'user') form.append('recipient', activeChat.target); else form.append('groupId', activeChat.target);
        try {
          const url = activeChat.type === 'group' ? '/groups/' + encodeURIComponent(activeChat.target) + '/send' : '/upload';
          if (activeChat.type === 'group') {
            await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ciphertext: filename, type: 'voice', filename }) });
          } else {
            await fetch('/upload', { method: 'POST', body: form });
          }
          toast('Talebeskjed sendt', 'success');
          if (activeChat.type === 'user') await loadChat(activeChat.target); else await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke sende talebeskjed');
        }
      }

      function setupDragDrop() {
        const chatMain = document.querySelector('.chat-main');
        if (!chatMain) return;
        chatMain.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            dropOverlay.style.display = 'flex';
          }
        });
        chatMain.addEventListener('dragleave', (e) => {
          e.stopPropagation();
          if (!chatMain.contains(e.relatedTarget)) {
            dropOverlay.style.display = 'none';
          }
        });
        chatMain.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropOverlay.style.display = 'none';
          const files = e.dataTransfer.files;
          if (files && files.length > 0 && composer.style.display !== 'none') {
            const file = files[0];
            droppedFile = file;
            updateSendButton();
            if (file.type.startsWith('image/')) showImagePreview(file);
          }
        });
      }
      setupDragDrop();

      document.getElementById('searchBtn').addEventListener('click', async () => {
        const query = document.getElementById('searchInput').value.trim();
        const partner = document.getElementById('searchPartner').value.trim();
        if (!query) { toast('Skriv inn søketekst'); return; }
        messagesBox.innerHTML = '<div class="skeleton-loader"><div class="skeleton-msg skeleton-sent"></div><div class="skeleton-msg skeleton-received"></div></div>';
        try {
          let allResults = [];
          if (partner) {
            const data = await loadJSON('/search?q=' + encodeURIComponent(query) + '&partner=' + encodeURIComponent(partner));
            allResults = (data.messages || []).map(m => ({ ...m, _partner: partner }));
          } else {
            const usersData = await loadJSON('/users');
            const userList = usersData.users || [];
            const searches = userList.map(u => {
              const name = typeof u === 'string' ? u : u.username;
              return loadJSON('/search?q=' + encodeURIComponent(query) + '&partner=' + encodeURIComponent(name)).then(d => (d.messages || []).map(m => ({ ...m, _partner: name }))).catch(() => []);
            });
            const results = await Promise.all(searches);
            allResults = results.flat();
          }
          allResults.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
          messagesBox.innerHTML = '';
          if (!allResults.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Ingen treff for "' + escapeHtml(query) + '"</p></div>';
            return;
          }
          const header = document.createElement('div');
          header.className = 'search-results-header';
          header.innerHTML = '<span class="count">' + allResults.length + ' treff</span><button class="close-search" id="closeSearchResults">✕</button>';
          messagesBox.appendChild(header);
          document.getElementById('closeSearchResults').addEventListener('click', () => {
            if (activeChat?.type === 'user') openChat(activeChat.target);
            else if (activeChat?.type === 'group') openGroup(activeChat.target);
            else messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><h3>Ingen samtale valgt</h3><p>Velg en kontakt eller gruppe.</p></div>';
          });
          allResults.forEach(m => {
            const item = document.createElement('div');
            item.className = 'msg ' + (m.sender === (window.__APP__?.username || '') ? 'sent' : 'received');
            const senderDisplay = getDisplayName(m.sender || '');
            item.innerHTML = '<div class="meta"><span class="sender">' + escapeHtml(senderDisplay) + '</span><span class="time">' + escapeHtml(formatTime(m.timestamp)) + '</span></div>'
              + '<div class="msg-text">' + escapeHtml(m.text || m.filename || '') + '</div>';
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
              openChat(m._partner);
            });
            messagesBox.appendChild(item);
          });
          toast(allResults.length + ' treff', 'success');
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Søk feilet</p></div>';
          toast('Søk feilet');
        }
      });

      ['searchInput','searchPartner'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('searchBtn').click(); });
      });

      document.getElementById('fileSearchBtn').addEventListener('click', async () => {
        const query = prompt('Soek i filnavn:');
        if (!query) return;
        messagesBox.innerHTML = '<div class="skeleton-loader"><div class="skeleton-msg skeleton-sent"></div></div>';
        try {
          const data = await loadJSON('/search/files?q=' + encodeURIComponent(query));
          messagesBox.innerHTML = '';
          const files = data.files || [];
          if (!files.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">📎</div><p>Ingen filer for "' + escapeHtml(query) + '"</p></div>';
            return;
          }
          const header = document.createElement('div');
          header.className = 'search-results-header';
          header.innerHTML = '<span class="count">' + files.length + ' filer funnet</span><button class="close-search" id="closeFileResults">✕</button>';
          messagesBox.appendChild(header);
          document.getElementById('closeFileResults').addEventListener('click', () => {
            if (activeChat?.type === 'user') openChat(activeChat.target);
            else if (activeChat?.type === 'group') openGroup(activeChat.target);
            else messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><h3>Ingen samtale valgt</h3></div>';
          });
          files.forEach(f => {
            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(f.filename);
            const isAudio = /\.(webm|mp3|ogg|wav|opus|m4a)$/i.test(f.filename);
            const icon = isImage ? '🖼️' : isAudio ? '🎵' : '📄';
            const item = document.createElement('div');
            item.className = 'file-search-result';
            item.innerHTML = '<div class="file-icon">' + icon + '</div>'
              + '<div class="file-info"><div class="file-name">' + escapeHtml(f.filename) + '</div>'
              + '<div class="file-meta">' + escapeHtml(f.sender) + ' → ' + escapeHtml(f.recipient) + ' · ' + escapeHtml(formatTime(f.timestamp)) + '</div></div>';
            item.addEventListener('click', () => openChat(f.recipient === (window.__APP__?.username || '') ? f.sender : f.recipient));
            messagesBox.appendChild(item);
          });
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Filsøk feilet</p></div>';
        }
      });

      function showEmojiPicker(msgEl, messageId) {
        document.querySelectorAll('.emoji-picker-popup').forEach(el => el.remove());
        const picker = document.createElement('div');
        picker.className = 'emoji-picker-popup';
        ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'].forEach(emoji => {
          const btn = document.createElement('button');
          btn.className = 'emoji-pick';
          btn.textContent = emoji;
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            toggleReaction(messageId, emoji);
            picker.remove();
          });
          picker.appendChild(btn);
        });
        msgEl.appendChild(picker);
        setTimeout(() => {
          const close = (ev) => {
            if (!picker.contains(ev.target)) { picker.remove(); document.removeEventListener('click', close); }
          };
          document.addEventListener('click', close);
        }, 10);
      }

      // ── Full Emoji Picker ──
      const EMOJI_DATA = {
        'Smiley': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐'],
        'Gest': ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏'],
        'Nature': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊'],
        'Food': ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'],
        'Activities': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','🪂','🎯','🪩','🎮','🕹️','🎰','🎲'],
        'Objects': ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔩','⚙️','🗜️','⛏️','🛠️','⚒️','🔨','🪚','🔗','⛓️','🪝','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🪆','🖼️','🪞','🪟','🛍️','🛒','🎁','🎈','🎏','🪅','🎊','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'],
        'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢']
      };
      const EMOJI_CATEGORIES = Object.keys(EMOJI_DATA);
      let currentEmojiCategory = 'Smiley';
      let currentReactionTarget = null;

      function initFullEmojiPicker() {
        const toggleBtn = document.getElementById('emojiToggleBtn');
        const picker = document.getElementById('fullEmojiPicker');
        const searchInput = document.getElementById('emojiSearch');
        const categoriesEl = document.getElementById('emojiCategories');
        const gridEl = document.getElementById('emojiGrid');
        if (!toggleBtn || !picker) return;

        EMOJI_CATEGORIES.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = 'emoji-cat-btn' + (cat === currentEmojiCategory ? ' active' : '');
          btn.textContent = EMOJI_DATA[cat][0];
          btn.title = cat;
          btn.addEventListener('click', () => { currentEmojiCategory = cat; renderEmojiGrid(); });
          categoriesEl.appendChild(btn);
        });

        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          picker.classList.toggle('open');
          if (picker.classList.contains('open')) { renderEmojiGrid(); searchInput.focus(); }
        });

        searchInput.addEventListener('input', () => renderEmojiGrid(searchInput.value.trim()));
        document.addEventListener('click', (e) => { if (!picker.contains(e.target) && e.target !== toggleBtn) picker.classList.remove('open'); });
      }

      function renderEmojiGrid(filter) {
        const gridEl = document.getElementById('emojiGrid');
        if (!gridEl) return;
        gridEl.innerHTML = '';
        let emojis = [];
        if (filter) {
          for (const cat of EMOJI_CATEGORIES) {
            emojis.push(...EMOJI_DATA[cat]);
          }
        } else {
          emojis = EMOJI_DATA[currentEmojiCategory] || [];
        }
        emojis.forEach(emoji => {
          if (filter && !emoji.includes(filter)) return;
          const btn = document.createElement('button');
          btn.className = 'emoji-grid-item';
          btn.textContent = emoji;
          btn.setAttribute('aria-label', emoji);
          btn.addEventListener('click', () => {
            if (currentReactionTarget) {
              toggleReaction(currentReactionTarget, emoji);
              currentReactionTarget = null;
            } else {
              const input = document.getElementById('messageInput');
              if (input) { input.value += emoji; input.focus(); updateSendButton(); }
            }
            document.getElementById('fullEmojiPicker')?.classList.remove('open');
          });
          gridEl.appendChild(btn);
        });
      }

      initFullEmojiPicker();

      // ── Link Previews ──
      const linkPreviewCache = {};
      async function fetchLinkPreview(text) {
        const urlMatch = text.match(/https?:\/\/[^\s<>"')]+/);
        if (!urlMatch) return null;
        const url = urlMatch[0];
        if (linkPreviewCache[url]) return linkPreviewCache[url];
        try {
          const data = await loadJSON('/link-preview?url=' + encodeURIComponent(url));
          if (data.preview) { linkPreviewCache[url] = data.preview; return data.preview; }
        } catch (e) {}
        return null;
      }

      function renderLinkPreview(preview) {
        if (!preview) return '';
        let html = '<div class="link-preview-card">';
        if (preview.image) html += '<img class="lp-image" src="' + escapeHtml(preview.image) + '" alt="" onerror="this.remove()" />';
        if (preview.title) html += '<div class="lp-title">' + escapeHtml(preview.title) + '</div>';
        if (preview.description) html += '<div class="lp-desc">' + escapeHtml(preview.description) + '</div>';
        try { html += '<div class="lp-url">' + escapeHtml(new URL(preview.url).hostname) + '</div>'; } catch {}
        html += '</div>';
        return html;
      }

      const origFinishAppend = finishAppend;
      function finishAppendWithLinkPreview(message, chatId, isMe, renderedText) {
        origFinishAppend(message, chatId, isMe, renderedText);
        if (!isMe && message.type === 'text' && renderedText && renderedText.match(/https?:\/\//)) {
          const lastMsg = messagesBox.lastElementChild;
          if (lastMsg && lastMsg.dataset.msgId === message.id) {
            fetchLinkPreview(renderedText).then(preview => {
              if (preview && lastMsg.isConnected) {
                const card = document.createElement('div');
                card.innerHTML = renderLinkPreview(preview);
                const msgText = lastMsg.querySelector('.msg-text');
                if (msgText && card.firstElementChild) msgText.after(card.firstElementChild);
              }
            }).catch(() => {});
          }
        }
      }
      finishAppend = finishAppendWithLinkPreview;

      // ── Pinned Messages ──
      async function loadPinnedMessages(chatType, chatId) {
        const bar = document.getElementById('pinnedBar');
        const text = document.getElementById('pinnedText');
        if (!bar || !text) return;
        try {
          const data = await loadJSON('/pins/' + encodeURIComponent(chatType) + '/' + encodeURIComponent(chatId));
          if (data.pins && data.pins.length > 0) {
            const pin = data.pins[0];
            text.textContent = '📌 ' + (pin.text || '').substring(0, 100);
            bar.style.display = 'flex';
            bar.onclick = () => {
              const el = document.querySelector('[data-message-id="' + pin.id + '"]');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
          } else {
            bar.style.display = 'none';
          }
        } catch (e) { bar.style.display = 'none'; }
      }

      document.getElementById('pinnedClose')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!activeChat) return;
        const chatType = activeChat.type === 'group' ? 'group' : 'user';
        const chatId = activeChat.target;
        try {
          const data = await loadJSON('/pins/' + encodeURIComponent(chatType) + '/' + encodeURIComponent(chatId));
          if (data.pins && data.pins.length > 0) {
            await loadJSON('/pins/' + encodeURIComponent(chatType) + '/' + encodeURIComponent(chatId) + '/' + data.pins[0].id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
            document.getElementById('pinnedBar').style.display = 'none';
          }
        } catch (e) {}
      });

      // ── Scheduled Messages ──
      function showScheduleBar() {
        const bar = document.getElementById('scheduleBar');
        if (bar) bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
      }

      document.getElementById('scheduleSendBtn')?.addEventListener('click', async () => {
        if (!activeChat) return;
        const timeInput = document.getElementById('scheduleTime');
        const sendAt = timeInput?.value;
        if (!sendAt) { toast('Velg tidspunkt'); return; }
        const input = document.getElementById('messageInput');
        const text = (input?.value || '').trim();
        if (!text) { toast('Skriv en melding'); return; }
        try {
          const body = { ciphertext: text, send_at: new Date(sendAt).toISOString() };
          if (activeChat.type === 'user') body.recipient = activeChat.target;
          else body.group_id = activeChat.target;
          await fetch('/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          toast('Melding planlagt', 'success');
          input.value = '';
          updateSendButton();
          document.getElementById('scheduleBar').style.display = 'none';
        } catch (e) { toast('Kunne ikke planlegge melding'); }
      });

      document.getElementById('scheduleCancelBtn')?.addEventListener('click', () => {
        document.getElementById('scheduleBar').style.display = 'none';
      });

      // ── Polls ──
      document.getElementById('pollBtn')?.addEventListener('click', () => {
        if (!activeChat || (activeChat.type !== 'group' && activeChat.type !== 'user')) { toast('Velg en samtale foerst'); return; }
        const question = prompt('Spørsmål:');
        if (!question) return;
        const optionsStr = prompt('Alternativer (kommadelt):');
        if (!optionsStr) return;
        const options = optionsStr.split(',').map(s => s.trim()).filter(Boolean);
        if (options.length < 2) return toast('Minst 2 alternativer');
        createPoll(question, options);
      });

      async function createPoll(question, options) {
        try {
          const data = await loadJSON('/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question, options,
              target: activeChat.target,
              target_type: activeChat.type === 'group' ? 'group' : 'user',
            })
          });
          toast('Avstemning opprettet', 'success');
          if (activeChat.type === 'user') await loadChat(activeChat.target); else await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke opprette avstemning');
        }
      }

      async function loadPoll(pollId) {
        try {
          const data = await loadJSON('/polls/' + encodeURIComponent(pollId));
          return data.poll || null;
        } catch (e) { return null; }
      }

      async function votePoll(pollId, indices) {
        try {
          await loadJSON('/polls/' + encodeURIComponent(pollId) + '/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ options: indices })
          });
          if (activeChat?.type === 'user') await loadChat(activeChat.target); else if (activeChat?.type === 'group') await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke stemme');
        }
      }

      function renderPollCard(poll) {
        if (!poll) return '';
        const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
        const myVote = window.__APP__?.username;
        let html = '<div class="poll-card" data-poll-id="' + escapeHtml(poll.id) + '">'
          + '<div class="poll-question">📊 ' + escapeHtml(poll.question) + '</div>';
        poll.options.forEach((opt, idx) => {
          const pct = totalVotes > 0 ? Math.round(opt.votes.length / totalVotes * 100) : 0;
          const voted = opt.votes.includes(myVote);
          html += '<div class="poll-option' + (voted ? ' voted' : '') + '" data-idx="' + idx + '">'
            + '<div class="poll-bar" style="width:' + pct + '%"></div>'
            + '<span class="poll-label">' + escapeHtml(opt.text) + '</span>'
            + '<span class="poll-pct">' + pct + '% (' + opt.votes.length + ')</span>'
            + '</div>';
        });
        html += '<div class="poll-total" style="font-size:.72rem;color:var(--c-text-muted);margin-top:4px;">' + totalVotes + ' stemmer' + (poll.closed ? ' · Lukket' : '') + '</div>'
          + '</div>';
        return html;
      }

      // Add schedule toggle to send button area
      document.getElementById('sendBtn')?.addEventListener('contextmenu', (e) => { e.preventDefault(); showScheduleBar(); });

      // ── Disappearing Messages Toggle ──
      function addDisappearToggle() {
        const meta = document.getElementById('chatMeta');
        if (!meta || !activeChat || activeChat.type !== 'user') return;
        const existing = meta.querySelector('.disappear-toggle');
        if (existing) existing.remove();
        const wrap = document.createElement('span');
        wrap.className = 'disappear-toggle';
        wrap.innerHTML = '💣 <select id="disappearSelect" aria-label="Forsvinnende meldinger">'
          + '<option value="">Av</option>'
          + '<option value="5">5 min</option>'
          + '<option value="30">30 min</option>'
          + '<option value="60">1 time</option>'
          + '<option value="1440">24 timer</option>'
          + '<option value="10080">7 dager</option>'
          + '</select>';
        meta.appendChild(wrap);
        document.getElementById('disappearSelect')?.addEventListener('change', (e) => {
          window._disappearMinutes = parseInt(e.target.value) || 0;
          toast(window._disappearMinutes ? 'Forsvinnende meldinger: ' + e.target.value + ' min' : 'Forsvinnende meldinger av', 'success');
        });
      }

      // ── Keyboard Shortcuts ──
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
          e.preventDefault();
          const searchInput = document.getElementById('searchInput');
          if (searchInput) searchInput.focus();
        }
        if (e.key === 'Escape') {
          document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
          document.querySelectorAll('.full-emoji-picker.open').forEach(el => el.classList.remove('open'));
          const replyBar = document.getElementById('replyBar');
          if (replyBar) replyBar.style.display = 'none';
          replyingTo = null;
        }
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        }
        if (e.ctrlKey && e.key === 'n') {
          e.preventDefault();
          const msgInput = document.getElementById('messageInput');
          if (msgInput) msgInput.focus();
        }
        if (e.key === 'ArrowUp' && !e.target.closest('input, textarea')) {
          e.preventDefault();
          const msgs = messagesBox.querySelectorAll('.msg.sent');
          if (msgs.length) msgs[msgs.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (e.key === 'ArrowDown' && !e.target.closest('input, textarea')) {
          e.preventDefault();
          const msgs = messagesBox.querySelectorAll('.msg.received');
          if (msgs.length) msgs[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      // ── PWA Push Notifications ──
      async function initPushNotifications() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: (await loadJSON('/push/vapid-key')).key || '' });
          await fetch('/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub }) });
        } catch (e) {}
      }
      if (Notification.permission === 'granted') initPushNotifications();

      // ── Call Recording ──
      let callRecorder = null;
      let callRecordingChunks = [];

      function addRecordingButton() {
        const actions = document.querySelector('.call-actions');
        if (!actions || document.getElementById('callRecordBtn')) return;
        const btn = document.createElement('button');
        btn.id = 'callRecordBtn';
        btn.className = 'call-record-btn';
        btn.title = 'Ta opp samtale';
        btn.setAttribute('aria-label', 'Ta opp samtale');
        btn.textContent = '⏺️';
        btn.addEventListener('click', () => {
          if (callRecorder && callRecorder.state === 'recording') {
            callRecorder.stop();
            btn.classList.remove('recording');
            btn.textContent = '⏺️';
          } else {
            startCallRecording();
            btn.classList.add('recording');
            btn.textContent = '⏹️';
          }
        });
        actions.insertBefore(btn, actions.firstChild);
      }

      function startCallRecording() {
        if (!localStream && !peerConnection) return;
        const remoteVideo = document.getElementById('remoteVideo');
        const streams = [];
        if (localStream) streams.push(localStream);
        if (remoteVideo?.srcObject) streams.push(remoteVideo.srcObject);
        if (!streams.length) return;
        try {
          const combined = new MediaStream([
            ...streams.flatMap(s => s.getAudioTracks()),
          ]);
          callRecorder = new MediaRecorder(combined, { mimeType: 'audio/webm;codecs=opus' });
          callRecordingChunks = [];
          callRecorder.ondataavailable = (e) => { if (e.data.size > 0) callRecordingChunks.push(e.data); };
          callRecorder.onstop = async () => {
            const blob = new Blob(callRecordingChunks, { type: 'audio/webm' });
            const form = new FormData();
            form.append('file', blob, 'call-recording-' + Date.now() + '.webm');
            if (activeChat?.type === 'user') form.append('recipient', activeChat.target);
            else if (activeChat?.type === 'group') form.append('groupId', activeChat.target);
            await fetch('/upload', { method: 'POST', body: form });
            toast('Opptak lagret', 'success');
          };
          callRecorder.start();
        } catch (e) { toast('Kunne ikke starte opptak'); }
      }

      const origRenderCallOverlay = renderCallOverlay;
      function renderCallOverlayWithRecord(info) {
        origRenderCallOverlay(info);
        addRecordingButton();
      }
      renderCallOverlay = renderCallOverlayWithRecord;

      // ── Key Rotation ──
      document.getElementById('rotateKeyBtn')?.addEventListener('click', async () => {
        if (!confirm('Roter.noekkel? Du maa dele den nye offentlige noekkelen med alle kontakter.')) return;
        try {
          const data = await loadJSON('/key/rotate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          toast(data.message || 'Noekkel rotert', 'success');
          await window.__CRYPTO__.getOrCreateIdentity();
        } catch (e) { toast('Kunne ikke rotere noekkel'); }
      });

      // ── Pin action in message context menu ──
      const origContextHandler = (message, item) => {
        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (message.deleted) return;
          replyingTo = { id: message.id, sender: message.sender, text: message.text || '' };
          document.getElementById('replyBar').style.display = 'flex';
          document.getElementById('replyBarName').textContent = message.sender;
          document.getElementById('replyBarPreview').textContent = (message.text || '').substring(0, 60);
          document.getElementById('messageInput').focus();
          const pinBtn = document.createElement('button');
          pinBtn.className = 'msg-action-btn';
          pinBtn.textContent = '📌';
          pinBtn.title = 'Fest melding';
          pinBtn.setAttribute('aria-label', 'Fest melding');
          let actions = item.querySelector('.msg-actions');
          if (!actions) {
            actions = document.createElement('div');
            actions.className = 'msg-actions';
            item.appendChild(actions);
          }
          if (!actions.querySelector('.pin-msg-btn')) {
            pinBtn.classList.add('pin-msg-btn');
            pinBtn.addEventListener('click', async (ev) => {
              ev.stopPropagation();
              const chatType = activeChat?.type === 'group' ? 'group' : 'user';
              const chatId = activeChat?.target;
              try {
                await loadJSON('/pins/' + encodeURIComponent(chatType) + '/' + encodeURIComponent(chatId) + '/' + message.id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                toast('Melding festet', 'success');
                loadPinnedMessages(chatType, chatId);
              } catch (e) { toast('Kunne ikke feste melding'); }
            });
            actions.appendChild(pinBtn);
          }
        });
      };
      // Patch finishAppend to add pin action
      const _origFinishAppend = finishAppend;
      finishAppend = function(message, chatId, isMe, renderedText) {
        _origFinishAppend(message, chatId, isMe, renderedText);
        const item = messagesBox.querySelector('[data-message-id="' + message.id + '"]');
        if (item && !message.deleted) origContextHandler(message, item);
      };

      async function toggleReaction(messageId, emoji) {
        try {
          await fetch('/reactions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message_id: messageId, emoji })
          });
          if (activeChat?.type === 'user') await loadChat(activeChat.target);
          else if (activeChat?.type === 'group') await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke legge til reaksjon');
        }
      }

      async function editMessage(messageId) {
        const newText = prompt('Rediger melding:');
        if (newText === null || !newText.trim()) return;
        try {
          await fetch('/messages/' + encodeURIComponent(messageId) + '/edit', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ciphertext: newText.trim() })
          });
          toast('Melding redigert', 'success');
          if (activeChat?.type === 'user') await loadChat(activeChat.target);
          else if (activeChat?.type === 'group') await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke redigere');
        }
      }

      async function deleteMessage(messageId) {
        if (!confirm('Slett denne meldingen?')) return;
        try {
          await fetch('/messages/' + encodeURIComponent(messageId), { method: 'DELETE' });
          toast('Melding slettet', 'success');
          if (activeChat?.type === 'user') await loadChat(activeChat.target);
          else if (activeChat?.type === 'group') await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke slette');
        }
      }

      function showMessageNotification(message) {
        try {
          if (message.silent) return;
          playNotificationSound();
          if (Notification.permission !== 'granted') return;
          if (message.sender === (window.__APP__?.username || '')) return;
          const senderName = getDisplayName(message.sender || '');
          let body = '';
          if (message.deleted) body = '[Slettet]';
          else if (message.type === 'file') body = '📎 ' + (message.filename || 'Vedlegg');
          else body = message.text || '';
          new Notification(senderName, { body: body.substring(0, 120) });
        } catch (e) {}
      }

      async function loadUserProfiles() {
        try {
          const data = await loadJSON('/users/all');
          (data.users || []).forEach(u => {
            if (u && u.username) userProfiles[u.username] = u;
          });
        } catch (e) {
          try {
            const data = await loadJSON('/users');
            (data.users || []).forEach(u => {
              const name = typeof u === 'string' ? u : (u && u.username);
              if (name && !userProfiles[name]) userProfiles[name] = { username: name, display_name: name };
            });
          } catch (e2) {}
        }
        renderUsers();
      }

      function showProfileModal() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        const me = window.__APP__?.username || '';
        const profile = userProfiles[me] || {};
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const avatarHtml = profile.avatar
          ? '<img id="profileAvatarImg" src="' + escapeHtml(profile.avatar) + '" alt="Avatar" />'
          : '<div class="avatar-placeholder" id="profileAvatarImg">' + escapeHtml((profile.display_name || me)[0]) + '</div>';
        overlay.innerHTML = '<div class="modal">'
          + '<h2>Min profil</h2>'
          + '<div class="avatar-upload">' + avatarHtml
          + '<div><label for="profileAvatarInput" class="btn btn-small btn-ghost">Velg bilde</label>'
          + '<input id="profileAvatarInput" type="file" accept="image/*" style="display:none" /></div></div>'
          + '<div><label for="profileDisplayName">Visningsnavn</label>'
          + '<input id="profileDisplayName" class="input-text" value="' + escapeHtml(profile.display_name || '') + '" placeholder="Ditt visningsnavn" maxlength="30" /></div>'
          + '<div><label for="profileBio">Bio</label>'
          + '<textarea id="profileBio" class="input-text" placeholder="Fortell litt om deg selv..." maxlength="150">' + escapeHtml(profile.bio || '') + '</textarea></div>'
          + '<div class="modal-actions">'
          + '<button id="profileCancelBtn" class="btn btn-ghost">Avbryt</button>'
          + '<button id="profileSaveBtn" class="btn btn-primary">Lagre</button>'
          + '</div></div>';
        document.body.appendChild(overlay);

        let avatarBase64 = profile.avatar || '';
        const avatarInput = overlay.querySelector('#profileAvatarInput');
        const avatarImg = overlay.querySelector('#profileAvatarImg');
        avatarInput.addEventListener('change', () => {
          const file = avatarInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            avatarBase64 = e.target.result;
            if (avatarImg.tagName === 'IMG') { avatarImg.src = avatarBase64; }
            else {
              const newImg = document.createElement('img');
              newImg.id = 'profileAvatarImg';
              newImg.src = avatarBase64;
              newImg.alt = 'Avatar';
              avatarImg.replaceWith(newImg);
            }
          };
          reader.readAsDataURL(file);
        });

        overlay.querySelector('#profileSaveBtn').addEventListener('click', async () => {
          const displayName = overlay.querySelector('#profileDisplayName').value.trim();
          const bio = overlay.querySelector('#profileBio').value.trim();
          try {
            await fetch('/profile', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ display_name: displayName, bio: bio, avatar: avatarBase64 })
            });
            toast('Profil lagret', 'success');
            overlay.remove();
            await loadUserProfiles();
            if (activeChat) {
              if (activeChat.type === 'user') chatTitle.textContent = getDisplayName(activeChat.target);
              else {
                const g = groups.find(g => g.id === activeChat.target);
                if (g) chatTitle.textContent = g.name;
              }
            }
          } catch (e) {
            toast('Kunne ikke lagre profil');
          }
        });

        overlay.querySelector('#profileCancelBtn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
      }

      document.getElementById('profileBtn').addEventListener('click', showProfileModal);

      function applyTheme(themeName) {
        const preset = THEME_PRESETS[themeName];
        if (!preset) return;
        document.body.classList.remove('theme-light');
        Object.entries(preset.vars).forEach(([prop, value]) => {
          document.body.style.setProperty(prop, value);
        });
        if (themeName === 'dark' || !Object.keys(preset.vars).length) {
          Object.keys(THEME_PRESETS.dark.vars).forEach(prop => {
            document.body.style.removeProperty(prop);
          });
        }
        currentTheme = themeName;
        localStorage.setItem('chat-theme', themeName);
        fetch('/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: themeName }) }).catch(() => {});
        document.querySelectorAll('.theme-preset').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
      }

      function populateThemePicker() {
        const picker = document.getElementById('themePicker');
        if (!picker) return;
        picker.innerHTML = '';
        Object.entries(THEME_PRESETS).forEach(([key, preset]) => {
          const btn = document.createElement('button');
          btn.className = 'theme-preset' + (key === currentTheme ? ' active' : '');
          btn.dataset.theme = key;
          btn.innerHTML = '<span class="theme-color-dot" style="background:' + preset.dot + '"></span>' + preset.name;
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyTheme(key);
            picker.classList.remove('open');
          });
          picker.appendChild(btn);
        });
      }

      document.getElementById('themeBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const picker = document.getElementById('themePicker');
        picker.classList.toggle('open');
      });

      document.addEventListener('click', () => {
        const picker = document.getElementById('themePicker');
        if (picker) picker.classList.remove('open');
      });

      populateThemePicker();
      applyTheme(currentTheme);

      document.getElementById('createGroupBtn').addEventListener('click', async () => {
        const name = prompt('Gruppenavn:');
        if (!name) return;
        const members = (prompt('Medlemmer (komma-separert):', '') || '').split(',').map(x => x.trim()).filter(Boolean);
        try {
          const res = await fetch('/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, members }) });
          const resData = await res.json();
          if (resData.success && resData.group) {
            try {
              const groupKeyBytes = window.crypto.getRandomValues(new Uint8Array(32));
              const allMembers = [window.__APP__?.username, ...members];
              const encryptedKeys = {};
              for (const member of allMembers) {
                const pubKey = await getPeerPublicKeyPem(member);
                if (pubKey) {
                  const key = await window.__CRYPTO__.getSharedKey(pubKey);
                  const rawKey = await window.crypto.subtle.exportKey('raw', key);
                  const iv = window.crypto.getRandomValues(new Uint8Array(12));
                  const enc = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, groupKeyBytes);
                  encryptedKeys[member] = arrayBufferToBase64(iv) + '.' + arrayBufferToBase64(enc);
                }
              }
              if (Object.keys(encryptedKeys).length > 0) {
                await fetch('/groups/' + encodeURIComponent(resData.group.id) + '/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys: encryptedKeys }) });
              }
            } catch (e2) { console.warn('Group E2EE key distribution failed', e2); }
          }
          toast('Gruppe opprettet', 'success');
          const data = await loadJSON('/groups');
          groups.length = 0;
          groups.push(...(data.groups || []));
          renderGroups();
        } catch (e) {
          toast('Kunne ikke opprette gruppe');
        }
      });

      document.getElementById('fa2Btn').addEventListener('click', async () => {
        try {
          const data = await loadJSON('/auth/2fa/enable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          const wrap = document.createElement('div');
          wrap.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(data.uri) + '" alt="2FA QR" /><div>' + escapeHtml(data.secret || '') + '</div>';
        } catch (e) {
          toast('2FA feilet');
        }
      });

      document.getElementById('sessionsBtn').addEventListener('click', async () => {
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = '<div class="modal" style="max-width:480px"><h2>Enheter</h2><div id="sessionsList" style="max-height:400px;overflow:auto;">Laster...</div><div class="modal-actions"><button id="sessionsCloseBtn" class="btn btn-ghost">Lukk</button></div></div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('#sessionsCloseBtn').addEventListener('click', () => overlay.remove());

        async function loadSessions() {
          try {
            const data = await loadJSON('/sessions');
            const list = overlay.querySelector('#sessionsList');
            if (!data.sessions || !data.sessions.length) {
              list.innerHTML = '<p style="color:var(--c-text-muted)">Ingen aktive økter</p>';
              return;
            }
            list.innerHTML = data.sessions.map(s => '<div class="session-item">'
              + '<div class="session-info"><div class="session-device">' + escapeHtml(s.device || 'Unknown')
              + (s.current ? ' <span class="session-current">(denne)</span>' : '')
              + '</div><div class="session-time">' + escapeHtml(formatTime(s.created)) + (s.ip ? ' · ' + escapeHtml(s.ip) : '') + '</div></div>'
              + (s.current ? '' : '<button class="session-revoke" data-id="' + escapeHtml(s.id) + '">Avbryt</button>')
              + '</div>').join('');
            list.querySelectorAll('.session-revoke').forEach(btn => {
              btn.addEventListener('click', async () => {
                try {
                  await loadJSON('/sessions/' + encodeURIComponent(btn.dataset.id) + '/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                  toast('Økt avbrutt', 'success');
                  loadSessions();
                } catch (e) {
                  toast('Kunne ikke avbryte økt');
                }
              });
            });
          } catch (e) {
            overlay.querySelector('#sessionsList').innerHTML = '<p style="color:var(--c-text-muted)">Kunne ikke laste økter</p>';
          }
        }
        loadSessions();
      });

      document.getElementById('myKeyBtn').addEventListener('click', async () => {
        try {
          const data = await loadJSON('/me/key');
          const pub = data.publicKey || '';
          const imported = data.importedKey || '';
          const text = pub
            ? 'Offentlig noekkel:\n' + pub + (imported ? '\n\nImportert noekkel:\n' + imported : '')
            : 'Ingen noekkel funnet. Opprettes automatisk ved foerste sending.';
          alert(text);
        } catch (e) {
          toast('Kunne ikke hente noekkel');
        }
      });

      document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (!confirm('Logge ut?')) return;
        await fetch('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
        window.location.href = '/login';
      });

      document.getElementById('audioCallBtn').addEventListener('click', async () => {
        if (!activeChat || activeChat.type !== 'user') { toast('Velg en kontakt først'); return; }
        await startCall(activeChat.target, 'audio');
      });
      document.getElementById('videoCallBtn').addEventListener('click', async () => {
        if (!activeChat || activeChat.type !== 'user') { toast('Velg en kontakt først'); return; }
        await startCall(activeChat.target, 'video');
      });

      try {
        const statsData = await loadJSON('/admin/stats');
        if (statsData.success) document.getElementById('adminBtn').style.display = '';
      } catch {}
      document.getElementById('adminBtn').addEventListener('click', () => { window.open('/admin/pages', '_blank'); });

      interval = setInterval(() => {
        if (activeChat?.type === 'user') loadChat(activeChat.target);
        if (activeChat?.type === 'group') loadGroup(activeChat.target);
        checkTypingIndicator().catch(() => {});
        loadJSON('/users/all').then(data => {
          (data.users || []).forEach(u => { if (u && u.username) userProfiles[u.username] = u; });
          users.length = 0;
          users.push(...(data.users || []));
          renderUsers();
          const usernames = users.map(u => typeof u === 'string' ? u : (u && u.username) || '').filter(Boolean);
          if (usernames.length) fetchBatchVerification(usernames).then(() => renderUsers()).catch(() => {});
        }).catch(() => {});
        if (activeChat?.type === 'user') {
          fetchVerificationStatus(activeChat.target).then(() => updateVerifyButton()).catch(() => {});
        }
        loadJSON('/groups').then(data => { groups.length = 0; groups.push(...(data.groups || [])); renderGroups(); }).catch(() => {});
        updatePresence().catch(() => {});
        checkIncomingCalls().catch(() => {});
        loadUnreadCounts().catch(() => {});
      }, 2500);

      window.addEventListener('beforeunload', () => { if (currentCall) hangUp(); });

      function updatePresence() {
        return loadJSON('/presence/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: Array.isArray(users) ? users.map(u => typeof u === 'string' ? u : (u && u.username) || '') : [] })
        }).then(data => {
          if (!data.presence) return;
          data.presence.forEach(entry => {
            if (!entry.online && entry.lastSeen) window.__lastSeenTimes[entry.username] = entry.lastSeen;
            const items = usersList.querySelectorAll('.item');
            items.forEach(item => {
              if (item.dataset.user === entry.username) {
                if (entry.online) item.classList.remove('offline'); else item.classList.add('offline');
              }
            });
          });
        });
      }

      function loadUnreadCounts() {
        return loadJSON('/unread').then(data => {
          const prev = { ...unreadCounts };
          unreadCounts = data.counts || {};
          if (activeChat?.type === 'user' && unreadCounts[activeChat.target]) {
            delete unreadCounts[activeChat.target];
          }
          const changed = JSON.stringify(prev) !== JSON.stringify(unreadCounts);
          if (changed) renderUsers();
          for (const [user, count] of Object.entries(unreadCounts)) {
            if (count > (prev[user] || 0) && user !== (window.__APP__?.username || '')) {
              playNotificationSound();
              if (Notification.permission === 'granted') {
                new Notification('CryptoChat', { body: count + ' nye meldinger fra ' + user, icon: '/static/img/icon-192.png' });
              }
            }
          }
        }).catch(() => {});
      }

      function playNotificationSound() {
        if (!_notificationAudio) {
          _notificationAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVggoKOaTczXn+DkGw2NF5/go5sNjRe' + 'f4OQbTY0X3+CkG02NF9/gpBtNjRff4KQbTY0X3+CkG02NF9/gpBtNjRff4KQbTY0');
        }
        try { _notificationAudio.currentTime = 0; _notificationAudio.play().catch(() => {}); } catch(e) {}
      }

      document.body.classList.toggle('theme-light', (window.__APP__?.theme || 'dark') === 'light');
      await loadUserProfiles();

      // ── Sticker/GIF Picker ──
      let stickerMode = 'stickers';
      const stickerPicker = document.getElementById('stickerPicker');
      const stickerTabs = document.getElementById('stickerTabs');
      const stickerContent = document.getElementById('stickerContent');
      const stickerBtn = document.getElementById('stickerBtn');

      async function initStickerPicker() {
        try {
          const data = await loadJSON('/stickers');
          stickerTabs.innerHTML = '';
          const stickersTab = document.createElement('button');
          stickersTab.className = 'sticker-tab active';
          stickersTab.textContent = '📦';
          stickersTab.title = 'Stickers';
          stickersTab.addEventListener('click', () => { stickerMode = 'stickers'; renderStickerContent(); updateStickerTabs(); });
          stickerTabs.appendChild(stickersTab);
          const gifsTab = document.createElement('button');
          gifsTab.className = 'sticker-tab';
          gifsTab.textContent = 'GIF';
          gifsTab.title = 'GIFs';
          gifsTab.addEventListener('click', () => { stickerMode = 'gifs'; renderStickerContent(); updateStickerTabs(); });
          stickerTabs.appendChild(gifsTab);
          (data.packs || []).forEach(pack => {
            const btn = document.createElement('button');
            btn.className = 'sticker-tab';
            btn.textContent = pack.name;
            btn.dataset.packId = pack.id;
            btn.addEventListener('click', () => { stickerMode = 'pack:' + pack.id; renderStickerContent(); updateStickerTabs(); });
            stickerTabs.appendChild(btn);
          });
          renderStickerContent();
        } catch (e) {}
      }

      function updateStickerTabs() {
        stickerTabs.querySelectorAll('.sticker-tab').forEach(tab => {
          tab.classList.remove('active');
          if (stickerMode === 'stickers' && tab.textContent === '📦') tab.classList.add('active');
          else if (stickerMode === 'gifs' && tab.textContent === 'GIF') tab.classList.add('active');
          else if (stickerMode === 'pack:' + tab.dataset.packId) tab.classList.add('active');
        });
      }

      async function renderStickerContent(query) {
        stickerContent.innerHTML = '';
        stickerContent.className = stickerMode === 'gifs' ? 'gif-grid' : 'sticker-grid';
        if (stickerMode === 'gifs') {
          if (query) {
            try {
              const data = await loadJSON('/gifs/search?q=' + encodeURIComponent(query));
              (data.gifs || []).forEach(gif => {
                const item = document.createElement('div');
                item.className = 'gif-item';
                item.innerHTML = '<img src="' + escapeHtml(gif.preview) + '" alt="" loading="lazy" />';
                item.addEventListener('click', () => { sendStickerOrGif(gif.url, 'gif'); stickerPicker.classList.remove('open'); });
                stickerContent.appendChild(item);
              });
            } catch (e) {}
          } else {
            stickerContent.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#7c7e9a;padding:20px;">Søk etter GIFs...</div>';
          }
        } else if (stickerMode.startsWith('pack:')) {
          const packId = stickerMode.slice(5);
          try {
            const data = await loadJSON('/stickers/' + encodeURIComponent(packId));
            (data.pack?.stickers || []).forEach(sticker => {
              const item = document.createElement('div');
              item.className = 'sticker-item';
              item.innerHTML = '<img src="' + escapeHtml(sticker.url) + '" alt="' + escapeHtml(sticker.emoji) + '" />';
              item.addEventListener('click', () => { sendStickerOrGif(sticker.url, 'sticker'); stickerPicker.classList.remove('open'); });
              stickerContent.appendChild(item);
            });
          } catch (e) {}
        } else {
          try {
            const data = await loadJSON('/stickers');
            (data.packs || []).forEach(pack => {
              try {
                const packData = loadJSON('/stickers/' + encodeURIComponent(pack.id));
                const sticker = packData.stickers?.[0];
                if (sticker) {
                  const item = document.createElement('div');
                  item.className = 'sticker-item';
                  item.innerHTML = '<img src="' + escapeHtml(sticker.url) + '" alt="" />';
                  item.title = pack.name;
                  item.addEventListener('click', () => { stickerMode = 'pack:' + pack.id; renderStickerContent(); updateStickerTabs(); });
                  stickerContent.appendChild(item);
                }
              } catch (e2) {}
            });
          } catch (e) {}
        }
      }

      async function sendStickerOrGif(url, type) {
        if (!activeChat) return;
        try {
          if (activeChat.type === 'user') {
            const key = activeChat.peerPublicKey;
            const encUrl = key ? await encryptForPeer(url, key) : url;
            await fetch('/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: activeChat.target, ciphertext: encUrl, type: 'text' }) });
            await loadChat(activeChat.target);
          } else if (activeChat.type === 'group') {
            await fetch('/groups/' + encodeURIComponent(activeChat.target) + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ciphertext: url, type: 'text' }) });
            await loadGroup(activeChat.target);
          }
        } catch (e) { toast('Kunne ikke sende'); }
      }

      if (stickerBtn) {
        stickerBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          stickerPicker.classList.toggle('open');
          if (stickerPicker.classList.contains('open')) {
            await initStickerPicker();
          }
        });
      }

      let stickerSearchTimeout = null;
      const gifSearchInput = document.createElement('input');
      gifSearchInput.className = 'input-text';
      gifSearchInput.placeholder = 'Søk GIFs...';
      gifSearchInput.style.cssText = 'width:100%;margin-bottom:6px;font-size:.82rem;display:none;';
      gifSearchInput.addEventListener('input', () => {
        clearTimeout(stickerSearchTimeout);
        stickerSearchTimeout = setTimeout(() => renderStickerContent(gifSearchInput.value.trim()), 400);
      });

      document.addEventListener('click', (e) => {
        if (stickerPicker && !stickerPicker.contains(e.target) && e.target !== stickerBtn) stickerPicker.classList.remove('open');
      });

      // ── Video Message Recording ──
      let videoRecorder = null;
      let videoChunks = [];
      let isRecordingVideo = false;
      const videoBtn = document.getElementById('videoRecordBtn');
      if (videoBtn) {
        videoBtn.addEventListener('click', async () => {
          if (isRecordingVideo) { stopVideoRecording(); return; }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 360, height: 360, facingMode: 'user' }, audio: true });
            videoChunks = [];
            videoRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
            videoRecorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunks.push(e.data); };
            videoRecorder.onstop = async () => {
              stream.getTracks().forEach(t => t.stop());
              const blob = new Blob(videoChunks, { type: 'video/webm' });
              await sendVideoMessage(blob);
            };
            videoRecorder.start();
            isRecordingVideo = true;
            videoBtn.textContent = '⏹️';
            videoBtn.classList.add('recording');
          } catch (e) { toast('Kunne ikke starte videoopptak: ' + e.message); }
        });
      }

      function stopVideoRecording() {
        if (videoRecorder && videoRecorder.state !== 'inactive') videoRecorder.stop();
        isRecordingVideo = false;
        const btn = document.getElementById('videoRecordBtn');
        if (btn) { btn.textContent = '📹'; btn.classList.remove('recording'); }
      }

      async function sendVideoMessage(blob) {
        if (!activeChat || blob.size < 1000) return;
        const form = new FormData();
        const filename = 'video-' + Date.now() + '.webm';
        form.append('file', blob, filename);
        if (activeChat.type === 'user') form.append('recipient', activeChat.target);
        else form.append('groupId', activeChat.target);
        try {
          if (activeChat.type === 'group') {
            await fetch('/groups/' + encodeURIComponent(activeChat.target) + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ciphertext: filename, type: 'file', filename }) });
            await loadGroup(activeChat.target);
          } else {
            await fetch('/upload', { method: 'POST', body: form });
            await loadChat(activeChat.target);
          }
          toast('Videomelding sendt', 'success');
        } catch (e) { toast('Kunne ikke sende videomelding'); }
      }

      // ── Location Sharing ──
      document.getElementById('locationBtn')?.addEventListener('click', () => {
        if (!activeChat || activeChat.type === 'saved') { toast('Velg en samtale'); return; }
        if (!navigator.geolocation) { toast('Nettleseren støtter ikke posisjon'); return; }
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const label = prompt('Etikett (valgfritt):') || '';
          try {
            if (activeChat.type === 'user') {
              await fetch('/send/location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: activeChat.target, lat, lng, label }) });
              await loadChat(activeChat.target);
            } else {
              await fetch('/send/location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_id: activeChat.target, lat, lng, label }) });
              await loadGroup(activeChat.target);
            }
            toast('Posisjon delt', 'success');
          } catch (e) { toast('Kunne ikke dele posisjon'); }
        }, (err) => { toast('Kunne ikke hente posisjon: ' + err.message); }, { enableHighAccuracy: true, timeout: 10000 });
      });

      // ── Silent Messages Toggle ──
      let silentMode = false;
      const silentToggle = document.getElementById('silentToggle');
      if (silentToggle) {
        silentToggle.addEventListener('click', () => {
          silentMode = !silentMode;
          silentToggle.classList.toggle('active', silentMode);
          silentToggle.textContent = silentMode ? '🔔' : '🔇';
        });
      }

      // ── Draft Messages ──
      let draftSaveTimeout = null;
      const messageInput = document.getElementById('messageInput');
      if (messageInput) {
        messageInput.addEventListener('input', () => {
          clearTimeout(draftSaveTimeout);
          draftSaveTimeout = setTimeout(() => {
            if (!activeChat || activeChat.type === 'saved') return;
            const text = messageInput.value.trim();
            fetch('/drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: activeChat.target, text }) }).catch(() => {});
          }, 1000);
        });
      }

      async function loadDraft(target) {
        try {
          const data = await loadJSON('/drafts');
          return data.drafts?.[target]?.text || '';
        } catch (e) { return ''; }
      }

      // ── Wallpaper Picker ──
      document.getElementById('wallpaperBtn')?.addEventListener('click', async () => {
        if (!activeChat) return;
        try {
          const data = await loadJSON('/wallpapers');
          const presets = data.presets || [];
          let html = '<div class="modal-overlay" id="wallpaperModal"><div class="modal" style="max-width:500px"><h2>Velg bakgrunn</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
          presets.forEach(p => {
            html += '<div class="wallpaper-option" data-id="' + escapeHtml(p.id) + '" style="height:60px;border-radius:8px;border:2px solid #2a2d48;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#9ca3c7;transition:border-color .15s;' + (p.css || 'background:#0f1826;') + '">' + escapeHtml(p.name) + '</div>';
          });
          html += '</div><div class="modal-actions"><button class="btn btn-ghost" onclick="document.getElementById(\'wallpaperModal\').remove()">Lukk</button></div></div></div>';
          document.body.insertAdjacentHTML('beforeend', html);
          document.getElementById('wallpaperModal').addEventListener('click', async (e) => {
            const opt = e.target.closest('.wallpaper-option');
            if (opt) {
              const wpId = opt.dataset.id;
              const chatType = activeChat.type === 'saved' ? 'user' : activeChat.type;
              const chatId = activeChat.type === 'saved' ? '__self__' : activeChat.target;
              await loadJSON('/wallpaper/' + chatType + '/' + encodeURIComponent(chatId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallpaper_id: wpId }) });
              applyWallpaper(wpId);
              toast('Bakgrunn endret', 'success');
              document.getElementById('wallpaperModal')?.remove();
            }
          });
        } catch (e) { toast('Kunne ikke laste bakgrunner'); }
      });

      function applyWallpaper(wpId) {
        const chatMain = document.querySelector('.chat-main');
        if (!chatMain) return;
        chatMain.className = 'chat-main';
        if (wpId && wpId !== 'default') chatMain.classList.add('wallpaper-' + wpId);
      }

      async function loadAndApplyWallpaper() {
        if (!activeChat || activeChat.type === 'saved') { applyWallpaper('default'); return; }
        try {
          const data = await loadJSON('/wallpaper/' + activeChat.type + '/' + encodeURIComponent(activeChat.target));
          applyWallpaper(data.wallpaper?.id || 'default');
        } catch (e) { applyWallpaper('default'); }
      }

      // ── Group Admin Panel ──
      document.getElementById('groupAdminBtn')?.addEventListener('click', async () => {
        if (!activeChat || activeChat.type !== 'group') return;
        const group = groups.find(g => g.id === activeChat.target);
        if (!group) return;
        const isCreator = group.creator === (window.__APP__?.username || '');
        const isAdmin = (group.admins || []).includes(window.__APP__?.username || '');
        let html = '<div class="modal-overlay" id="groupAdminModal"><div class="modal" style="max-width:500px"><h2>Gruppeinnstillinger</h2>';
        if (isCreator) {
          html += '<div class="field"><label>Sakte modus</label><select id="slowmodeSelect" class="input-text">';
          [0, 10, 30, 60, 120, 300, 600].forEach(s => {
            html += '<option value="' + s + '">' + (s === 0 ? 'Av' : s + ' sek') + '</option>';
          });
          html += '</select></div>';
        }
        if (isCreator) {
          html += '<div class="field"><label>Admins & Moderatorer</label><div id="adminList">';
          (group.members || []).forEach(m => {
            const isAdm = (group.admins || []).includes(m);
            const isMod = (group.mods || []).includes(m);
            const role = m === group.creator ? 'Oppretter' : isAdm ? 'Admin' : isMod ? 'Mod' : '';
            html += '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">';
            html += '<span style="flex:1;">' + escapeHtml(m) + (role ? ' <span class="' + (isAdm ? 'admin-badge' : 'mod-badge') + '">' + role + '</span>' : '') + '</span>';
            if (m !== group.creator) {
              html += '<select class="input-text admin-role-select" data-user="' + escapeHtml(m) + '" style="width:120px;padding:4px;">';
              html += '<option value="member"' + (!isAdm && !isMod ? ' selected' : '') + '>Medlem</option>';
              html += '<option value="mod"' + (isMod ? ' selected' : '') + '>Moderator</option>';
              html += '<option value="admin"' + (isAdm ? ' selected' : '') + '>Admin</option>';
              html += '</select>';
            }
            html += '</div>';
          });
          html += '</div></div>';
        }
        html += '<div class="modal-actions"><button class="btn btn-ghost" id="groupAdminClose">Lukk</button></div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('groupAdminModal');
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        modal.querySelector('#groupAdminClose').addEventListener('click', () => modal.remove());
        if (isCreator) {
          const smSelect = modal.querySelector('#slowmodeSelect');
          if (smSelect) {
            try {
              const smData = await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/slowmode');
              smSelect.value = smData.seconds || 0;
            } catch (e) {}
            smSelect.addEventListener('change', async () => {
              await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/slowmode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seconds: parseInt(smSelect.value) }) });
              toast('Sakte modus oppdatert', 'success');
            });
          }
          modal.querySelectorAll('.admin-role-select').forEach(sel => {
            sel.addEventListener('change', async () => {
              const user = sel.dataset.user;
              const role = sel.value;
              await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, role }) });
              toast(user + ' er nå ' + role, 'success');
              const data = await loadJSON('/groups');
              groups.length = 0;
              groups.push(...(data.groups || []));
              renderGroups();
            });
          });
        }
      });

      // ── Hook into openChat/openGroup for new features ──
      const _origOpenChat = openChat;
      openChat = async function(user) {
        await _origOpenChat(user);
        document.getElementById('wallpaperBtn').style.display = '';
        document.getElementById('groupAdminBtn').style.display = 'none';
        document.getElementById('pollBtn').style.display = 'none';
        silentMode = false;
        if (silentToggle) { silentToggle.classList.remove('active'); silentToggle.textContent = '🔇'; }
        await loadAndApplyWallpaper();
        const draft = await loadDraft(user);
        if (draft) { const inp = document.getElementById('messageInput'); if (inp) inp.value = draft; }
      };

      const _origOpenGroup = openGroup;
      openGroup = async function(groupId) {
        await _origOpenGroup(groupId);
        document.getElementById('wallpaperBtn').style.display = '';
        document.getElementById('groupAdminBtn').style.display = '';
        await loadAndApplyWallpaper();
      };

      const _origOpenSaved = openSavedMessages;
      openSavedMessages = async function() {
        await _origOpenSaved();
        document.getElementById('wallpaperBtn').style.display = 'none';
        document.getElementById('groupAdminBtn').style.display = 'none';
      };

      // Patch sendMessage to include silent flag
      const _origSendMsg = sendMessage;
      sendMessage = async function() {
        const origSilent = silentMode;
        const _origFetch = window.fetch;
        if (origSilent) {
          window.fetch = function(...args) {
            if (args[0] === '/send' && args[1]?.body) {
              try {
                const body = JSON.parse(args[1].body);
                body.silent = true;
                args[1].body = JSON.stringify(body);
              } catch (e) {}
            }
            return _origFetch.apply(this, args);
          };
        }
        await _origSendMsg();
        if (origSilent) window.fetch = _origFetch;
      };

      // ── Show location messages on map ──
      function renderLocationHtml(locData) {
        try {
          const loc = typeof locData === 'string' ? JSON.parse(locData) : locData;
          const mapUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=' + (loc.lng - 0.01) + ',' + (loc.lat - 0.01) + ',' + (loc.lng + 0.01) + ',' + (loc.lat + 0.01) + '&layer=mapnik&marker=' + loc.lat + ',' + loc.lng;
          return '<div class="location-card"><iframe src="' + mapUrl + '" style="width:100%;height:140px;border:0;border-radius:8px;" loading="lazy"></iframe>'
            + (loc.label ? '<div class="loc-label">📍 ' + escapeHtml(loc.label) + '</div>' : '<div class="loc-label">📍 ' + loc.lat.toFixed(5) + ', ' + loc.lng.toFixed(5) + '</div>') + '</div>';
        } catch (e) { return ''; }
      }

      // Patch appendMessage to handle location and video types
      const _origFinishAppend = finishAppend;
      finishAppend = function(message, chatId, isMe, renderedText) {
        if (message.type === 'location' && !message.deleted) {
          try {
            const loc = JSON.parse(message.ciphertext || message.text || '{}');
            const item = document.createElement('div');
            item.className = 'msg ' + (isMe ? 'sent' : 'received');
            if (message.id) item.dataset.messageId = message.id;
            item.dataset.msgId = message.id || '';
            const senderDisplay = getDisplayName(message.sender || '');
            item.innerHTML = '<div class="meta"><span class="sender">' + escapeHtml(senderDisplay) + '</span><span class="time">' + escapeHtml(formatTime(message.timestamp)) + '</span></div>'
              + renderLocationHtml(loc)
              + '<div class="meta">' + e2eeIndicator + (isMe ? '<span class="read">' + (message.read ? '<span class="read-receipt read">✓✓</span>' : '<span class="read-receipt unread">✓</span>') + '</span>' : '') + '</div>';
            messagesBox.appendChild(item);
            if (!userScrolledUp) messagesBox.scrollTop = messagesBox.scrollHeight;
            return;
          } catch (e) {}
        }
        _origFinishAppend(message, chatId, isMe, renderedText);
      };

    } catch (e) {
      document.getElementById('app').innerHTML = '<pre style="color:#ff8888;background:#0f1424;padding:16px;">' + escapeHtml(e.stack || e.message) + '</pre>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
