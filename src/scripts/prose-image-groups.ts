export type ProseImageGroup = 'solo' | 'pair' | 'gallery';

const hasVisibleText = (element: Element) => Array.from(element.childNodes).some((node) => (
  node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''
));

export const imageOnlyChildren = (paragraph: HTMLParagraphElement) => {
  const children = Array.from(paragraph.children);
  const images = children.filter((child): child is HTMLImageElement => child instanceof HTMLImageElement);
  const hasOtherElements = children.some((child) => !(child instanceof HTMLImageElement));

  if (images.length === 0 || hasOtherElements || hasVisibleText(paragraph)) return null;
  return images;
};

export const classifyImageParagraph = (paragraph: HTMLParagraphElement): ProseImageGroup | null => {
  const images = imageOnlyChildren(paragraph);
  if (!images) return null;
  if (images.length === 1) return 'solo';
  if (images.length === 2) return 'pair';
  return 'gallery';
};
