export function preserveBodyAxis(frameSize: number, bodySize: number, bodyOffset: number, scale: number) {
  return {
    size: bodySize / scale,
    offset: frameSize / 2 + (bodyOffset - frameSize / 2) / scale,
  };
}
