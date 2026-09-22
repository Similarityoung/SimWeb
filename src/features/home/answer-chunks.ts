// Local presentation chunks, not DeepSeek tokenization or measured API timing.
export function createAnswerChunks(text: string) {
  const segments = new Intl.Segmenter(undefined, { granularity: "word" });
  const sizes = [8, 18, 11, 22, 14];
  const delays = [45, 90, 55, 110, 65, 80];
  const chunks: { content: string; delayMs: number }[] = [];
  let content = "";

  for (const { segment } of segments.segment(text)) {
    content += segment;
    if (content.length >= sizes[chunks.length % sizes.length]) {
      chunks.push({
        content,
        delayMs: delays[chunks.length % delays.length],
      });
      content = "";
    }
  }
  if (content) {
    chunks.push({ content, delayMs: delays[chunks.length % delays.length] });
  }
  return chunks;
}
