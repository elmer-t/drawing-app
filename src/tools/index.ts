import type { Tool, ToolName } from './types';
import { createStrokeTool } from './strokeTool';
import { createAirbrushTool } from './airbrush';
import { createBucketTool } from './bucket';
import { createEyedropperTool } from './eyedropper';

export function createTool(name: ToolName): Tool {
  switch (name) {
    case 'pencil':
      return createStrokeTool({ name: 'pencil' });
    case 'brush':
      return createStrokeTool({ name: 'brush', opacity: 0.35 });
    case 'marker':
      return createStrokeTool({ name: 'marker', opacity: 0.5 });
    case 'eraser':
      return createStrokeTool({
        name: 'eraser',
        resolveColor: (ctx) => ctx.background,
      });
    case 'airbrush':
      return createAirbrushTool();
    case 'bucket':
      return createBucketTool();
    case 'eyedropper':
      return createEyedropperTool();
  }
}

export type ToolDescriptor = {
  name: ToolName;
  label: string;
  /** Keyboard shortcut hint shown in the rail and used by the global key handler. */
  key: string;
};

/**
 * Order matches the design's left rail (P, B, M, S, E, I, F).
 */
export const TOOL_LIST: ToolDescriptor[] = [
  { name: 'pencil', label: 'Pencil', key: 'P' },
  { name: 'brush', label: 'Brush', key: 'B' },
  { name: 'marker', label: 'Marker', key: 'M' },
  { name: 'airbrush', label: 'Spray', key: 'S' },
  { name: 'eraser', label: 'Eraser', key: 'E' },
  { name: 'eyedropper', label: 'Eyedropper', key: 'I' },
  { name: 'bucket', label: 'Fill', key: 'F' },
];
