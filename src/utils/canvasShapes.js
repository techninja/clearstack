/**
 * Diagram shape library — uses Lucide icons as canvas shapes.
 * SVG content loaded from icons.json at runtime.
 * All shapes use Lucide's 24x24 viewBox.
 * @module utils/canvasShapes
 */

/** @type {{ id: string, name: string, iconName: string }[]} */
export const SHAPES = [
  { id: 'cloud', name: 'Cloud', iconName: 'cloud' },
  { id: 'database', name: 'Database', iconName: 'database' },
  { id: 'diamond', name: 'Decision', iconName: 'diamond' },
  { id: 'hexagon', name: 'Process', iconName: 'hexagon' },
  { id: 'cylinder', name: 'Storage', iconName: 'cylinder' },
  { id: 'document', name: 'Document', iconName: 'document' },
  { id: 'server', name: 'Server', iconName: 'server' },
  { id: 'monitor', name: 'Monitor', iconName: 'monitor' },
  { id: 'globe', name: 'Network', iconName: 'globe' },
  { id: 'lock', name: 'Security', iconName: 'lock' },
  { id: 'shield', name: 'Firewall', iconName: 'shield' },
  { id: 'user', name: 'User', iconName: 'user' },
  { id: 'cpu', name: 'Processor', iconName: 'cpu' },
  { id: 'wifi', name: 'Wireless', iconName: 'wifi' },
  { id: 'zap', name: 'Event', iconName: 'zap' },
  { id: 'box', name: 'Package', iconName: 'box' },
];
