export interface TreeNodeData {
    name:      string;
    path:      string;
    children?: TreeNodeData[];
}

/**
 * Recursively sorts a directory tree:
 *  - directories before files
 *  - alphabetically within each group
 *
 * Safe against null/undefined nodes (directoryTree() returns null
 * when the path doesn't exist on disk).
 */
export function sortTree(node: TreeNodeData | null | undefined): TreeNodeData {
    // Guard: return a safe empty node if tree is null/undefined
    if (!node) {
        return { name: "", path: "", children: [] };
    }

    if (!node.children) return node;

    node.children = node.children
        .filter(Boolean)             // remove any null entries
        .map(sortTree)
        .sort((a, b) => {
            // Folders first
            if (a.children && !b.children) return -1;
            if (!a.children && b.children) return 1;
            return a.name.localeCompare(b.name);
        });

    return node;
}