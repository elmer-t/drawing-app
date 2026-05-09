import type { Tool, ToolName } from './types';
import { createPencilTool } from './pencil';

export function createTool(name: ToolName): Tool {
  switch (name) {
    case 'pencil':
      return createPencilTool();
  }
}
