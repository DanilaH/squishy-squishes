import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/sandbox-library.css';
let css = readFileSync(path, 'utf8');
const marker = '/* S2 modal readability hardening */';
if (!css.includes(marker)) {
  css += `

${marker}
.sandbox-library-modal {
  --library-ink: #3e3154;
  --library-muted: #756987;
  --library-line: rgba(88, 64, 112, 0.12);
  color: var(--library-ink);
}

.sandbox-library-modal__sheet h2,
.sandbox-library-replace-card strong {
  color: var(--library-ink);
}

.sandbox-library-modal__sheet > p,
.sandbox-library-modal__eyebrow {
  color: var(--library-muted);
}

@media (max-width: 700px) {
  .sandbox-library-modal--replace {
    padding: 10px;
  }

  .sandbox-library-modal--replace .sandbox-library-modal__sheet {
    max-height: calc(100dvh - 20px);
    padding: 14px 10px;
  }

  .sandbox-library-modal--replace .sandbox-library-modal__sheet h2 {
    font-size: 22px;
  }

  .sandbox-library-modal--replace .sandbox-library-modal__sheet > p {
    margin-bottom: 10px;
    font-size: 11px;
  }

  .sandbox-library-modal--replace .sandbox-library-replace-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .sandbox-library-modal--replace .sandbox-library-replace-card {
    padding: 4px 4px 7px;
    border-radius: 14px;
  }

  .sandbox-library-modal--replace .sandbox-library-replace-card strong {
    font-size: 8px;
  }

  .sandbox-library-modal--replace .sandbox-library-replace-card span {
    margin-top: 3px;
    font-size: 8px;
  }

  .sandbox-library-modal--replace .sandbox-library-modal__cancel {
    min-height: 40px;
    margin-top: 10px;
  }
}
`;
}
writeFileSync(path, css);
