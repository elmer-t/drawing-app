import type { Tool, ToolName } from './types';
import { createStrokeTool } from './strokeTool';
import { createAirbrushTool } from './airbrush';

export function createTool(name: ToolName): Tool {
  switch (name) {
    case 'pencil':
      return createStrokeTool({ name: 'pencil' });
    case 'pen':
      return createStrokeTool({ name: 'pen' });
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
  }
}

export const TOOL_LIST: { name: ToolName; label: string }[] = [
  { name: 'pencil', label: 'Pencil' },
  { name: 'pen', label: 'Pen' },
  { name: 'brush', label: 'Brush' },
  { name: 'marker', label: 'Marker' },
  { name: 'airbrush', label: 'Airbrush' },
  { name: 'eraser', label: 'Eraser' },
];
