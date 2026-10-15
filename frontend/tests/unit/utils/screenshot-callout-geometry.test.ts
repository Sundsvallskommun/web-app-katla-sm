import {
  ARROW_GAP,
  BADGE_DISTANCE,
  BADGE_EDGE_MARGIN,
  getCalloutGeometry,
  HIGHLIGHT_PADDING,
} from '@utils/screenshot-callout-geometry';
import { describe, expect, it } from 'vitest';

const image = { width: 1000, height: 500 };
const target = { x: 100, y: 200, width: 200, height: 50 };

describe('getCalloutGeometry', () => {
  it('frames the target with padding, in percent of the image', () => {
    const { highlight } = getCalloutGeometry(target, image, 'right');

    expect(highlight.x).toBeCloseTo(((target.x - HIGHLIGHT_PADDING) / image.width) * 100);
    expect(highlight.y).toBeCloseTo(((target.y - HIGHLIGHT_PADDING) / image.height) * 100);
    expect(highlight.width).toBeCloseTo(((target.width + 2 * HIGHLIGHT_PADDING) / image.width) * 100);
    expect(highlight.height).toBeCloseTo(((target.height + 2 * HIGHLIGHT_PADDING) / image.height) * 100);
  });

  it('places the number beside the target and points the arrow at the frame', () => {
    const { badge, arrowTip } = getCalloutGeometry(target, image, 'right');
    const frameRight = target.x + target.width + HIGHLIGHT_PADDING;
    const centerY = target.y + target.height / 2;

    expect(badge.x).toBeCloseTo(((frameRight + BADGE_DISTANCE) / image.width) * 100);
    expect(badge.y).toBeCloseTo((centerY / image.height) * 100);
    expect(arrowTip.x).toBeCloseTo(((frameRight + ARROW_GAP) / image.width) * 100);
    expect(arrowTip.y).toBeCloseTo(badge.y);
  });

  it('accepts a shorter distance where the number would otherwise cover text', () => {
    const { badge } = getCalloutGeometry(target, image, 'top', 40);
    const frameTop = target.y - HIGHLIGHT_PADDING;

    expect(badge.y).toBeCloseTo(((frameTop - 40) / image.height) * 100);
  });

  // Ett element nära kanten får ändå en hel siffra i bild, även om pilen då blir kortare.
  it('keeps the number inside the image when the target is near an edge', () => {
    const { badge } = getCalloutGeometry({ x: 10, y: 10, width: 50, height: 20 }, image, 'left');

    expect(badge.x).toBeCloseTo((BADGE_EDGE_MARGIN / image.width) * 100);
    expect(badge.y).toBeCloseTo((BADGE_EDGE_MARGIN / image.height) * 100);
  });
});
