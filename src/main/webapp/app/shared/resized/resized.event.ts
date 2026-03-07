export interface ResizedEvent {
  readonly newRect: DOMRectReadOnly;
  readonly oldRect?: DOMRectReadOnly;
  readonly isFirst: boolean;
}

export function createResizedEvent(newRect: DOMRectReadOnly, oldRect?: DOMRectReadOnly): ResizedEvent {
  return {
    newRect,
    oldRect,
    isFirst: oldRect == null,
  };
}
