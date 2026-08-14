/* découpe un bloc en lignes masquées — aucune dépendance */
export function splitLines(el) {
  const nodes = [];
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { nodes.push(document.createTextNode(' ')); return; }
        const s = document.createElement('span');
        s.className = 'sw';
        s.style.display = 'inline-block';
        if (el.classList.contains('it') || false) s.classList.add('it');
        s.textContent = w;
        nodes.push(s);
      });
    } else if (n.nodeName === 'BR') {
      nodes.push(document.createElement('br'));
    } else if (n.nodeType === 1) {
      const s = document.createElement('span');
      s.className = 'sw ' + (n.className || '');
      s.style.display = 'inline-block';
      s.textContent = n.textContent;
      nodes.push(s);
    }
  });
  el.textContent = '';
  nodes.forEach((n) => el.appendChild(n));

  /* groupage par ligne rendue */
  const words = [...el.querySelectorAll('.sw')];
  const lines = new Map();
  words.forEach((w) => {
    const top = Math.round(w.offsetTop);
    if (!lines.has(top)) lines.set(top, []);
    lines.get(top).push(w);
  });

  const inners = [];
  el.textContent = '';
  [...lines.values()].forEach((ws) => {
    const outer = document.createElement('span');
    outer.className = 'rv-l';
    const inner = document.createElement('span');
    inner.className = 'rv-li';
    ws.forEach((w, i) => {
      inner.appendChild(w);
      if (i < ws.length - 1) inner.appendChild(document.createTextNode(' '));
    });
    outer.appendChild(inner);
    el.appendChild(outer);
    inners.push(inner);
  });
  return inners;
}

/* découpe en caractères — pour le titre héroïque */
export function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  return text.split('').map((c) => {
    const s = document.createElement('span');
    s.className = 'ht-c';
    s.textContent = c;
    el.appendChild(s);
    return s;
  });
}
