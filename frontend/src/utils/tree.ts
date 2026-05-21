export interface TreeNodeData {
  name: string;
  path: string;
  children?: TreeNodeData[];
}

export function sortTree(node: TreeNodeData): TreeNodeData {
  if (!node.children) return node;
  node.children = node.children
    .map(sortTree)
    .sort((a, b) => {
      if (a.children && !b.children) return -1;
      if (!a.children && b.children) return 1;
      return a.name.localeCompare(b.name);
    });
  return node;
}
