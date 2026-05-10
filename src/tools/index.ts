import type { Tool, ToolName } from './types';
import { createStrokeTool } from './strokeTool';
import { createAirbrushTool } from './airbrush';
import { createBucketTool } from './bucket';

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
  }
}

export const TOOL_LIST: { name: ToolName; label: string }[] = [
  { name: 'pencil', label: 'Pencil' },
  { name: 'brush', label: 'Brush' },
  { name: 'marker', label: 'Marker' },
  { name: 'airbrush', label: 'Airbrush' },
  { name: 'bucket', label: 'Fill' },
  { name: 'eraser', label: 'Eraser' },
];
