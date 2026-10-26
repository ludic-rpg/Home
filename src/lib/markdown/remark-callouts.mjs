const CALLOUT_MARKER = /^\[!(note|tip|info)\](?:[ \t]+|(?=\n|$))/i;

function splitFirstLine(children) {
  const title = [];
  for (const [index, child] of children.entries()) {
    const newline = child.type === 'text' ? child.value.indexOf('\n') : -1;
    if (child.type === 'break' || newline !== -1) {
      const body = children.slice(index + 1);
      if (newline !== -1) {
        if (newline) title.push({ ...child, value: child.value.slice(0, newline) });
        if (newline + 1 < child.value.length) body.unshift({ ...child, value: child.value.slice(newline + 1) });
      }
      return { title, body };
    }
    title.push(child);
  }
  return { title, body: [] };
}

/** Render common Obsidian callouts without adding their titles to the article TOC. */
export default function remarkCallouts() {
  return (tree) => {
    function visit(node) {
      const paragraph = node.type === 'blockquote' && node.children[0];
      const first = paragraph?.type === 'paragraph' && paragraph.children[0];
      const marker = first?.type === 'text' && first.value.match(CALLOUT_MARKER);
      if (marker) {
        const kind = marker[1].toLowerCase();
        const { title, body } = splitFirstLine([
          { ...first, value: first.value.slice(marker[0].length) },
          ...paragraph.children.slice(1),
        ]);
        const hasTitle = title.some((child) => child.type !== 'text' || child.value.trim());
        node.data = {
          ...node.data,
          hName: 'aside',
          hProperties: { ...node.data?.hProperties, className: ['article-callout'], 'data-callout': kind },
        };
        node.children = [
          {
            type: 'paragraph',
            data: { hProperties: { className: ['article-callout__title'] } },
            children: hasTitle ? title : [{ type: 'text', value: kind[0].toUpperCase() + kind.slice(1) }],
          },
          ...(body.length ? [{ type: 'paragraph', children: body }] : []),
          ...node.children.slice(1),
        ];
      }
      for (const child of node.children || []) visit(child);
    }
    visit(tree);
  };
}
