// Written by: Bobby Chen - Software Engineering Intern
// Reviewed by: Sarah Williams (Frontend Lead), Tom (Frontend)
// Status: Ready for Testing
//
// Branch Visualization - Shows the conversation tree structure!
// This lets users see where they branched off and navigate between branches.

import { useState, useEffect } from 'react';
import './BranchVisualization.css';

interface BranchNode {
  id: string;
  title: string;
  created_at: string;
  branch_point_message_id: string | null;
  parent_conversation_id: string | null;
}

interface BranchTree {
  current: BranchNode;
  ancestors: BranchNode[];
  siblings: BranchNode[];
  children: BranchNode[];
  depth: number;
  isRoot: boolean;
  hasChildren: boolean;
}

interface BranchVisualizationProps {
  conversationId: string;
  onSelectBranch: (branchId: string) => void;
  onCreateBranch?: (messageId: string, title: string) => void;
}

export default function BranchVisualization({
  conversationId,
  onSelectBranch
}: BranchVisualizationProps) {
  const [branchTree, setBranchTree] = useState<BranchTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBranchTree();
  }, [conversationId]);

  const loadBranchTree = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await apiClient.getBranchTree(conversationId);
      // setBranchTree(response);

      // Mock data for development
      setBranchTree({
        current: {
          id: conversationId,
          title: 'Current Conversation',
          created_at: new Date().toISOString(),
          branch_point_message_id: null,
          parent_conversation_id: null
        },
        ancestors: [],
        siblings: [],
        children: [],
        depth: 0,
        isRoot: true,
        hasChildren: false
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to load branch tree:', err);
      setError('Failed to load branch information');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="branch-viz-loading">Loading branch tree...</div>;
  }

  if (error) {
    return <div className="branch-viz-error">{error}</div>;
  }

  if (!branchTree) {
    return null;
  }

  return (
    <div className="branch-visualization">
      <div className="branch-header">
        <h3>Conversation Branches</h3>
        <div className="branch-depth">
          Depth: {branchTree.depth}
          {branchTree.depth >= 5 && (
            <span className="depth-warning"> (Getting deep! 🌲)</span>
          )}
        </div>
      </div>

      <div className="branch-tree">
        {/* Ancestors (Parent chain) */}
        {branchTree.ancestors.length > 0 && (
          <div className="branch-section ancestors">
            <h4>Parent Path</h4>
            {branchTree.ancestors.map((ancestor, index) => (
              <div key={ancestor.id} className="branch-node ancestor">
                <div className="branch-connector">
                  {index < branchTree.ancestors.length - 1 && '│'}
                </div>
                <button
                  className="branch-button"
                  onClick={() => onSelectBranch(ancestor.id)}
                  title={`Go to: ${ancestor.title}`}
                >
                  <span className="branch-icon">↑</span>
                  <span className="branch-title">{ancestor.title}</span>
                  <span className="branch-date">
                    {new Date(ancestor.created_at).toLocaleDateString()}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Current conversation */}
        <div className="branch-section current">
          <div className="branch-node current-node">
            <div className="branch-connector">
              {(branchTree.ancestors.length > 0 || branchTree.children.length > 0) && '│'}
            </div>
            <div className="branch-button current">
              <span className="branch-icon">●</span>
              <span className="branch-title">{branchTree.current.title}</span>
              <span className="branch-badge">Current</span>
            </div>
          </div>
        </div>

        {/* Siblings */}
        {branchTree.siblings.length > 0 && (
          <div className="branch-section siblings">
            <h4>Alternate Branches</h4>
            {branchTree.siblings.map((sibling) => (
              <div key={sibling.id} className="branch-node sibling">
                <div className="branch-connector">├─</div>
                <button
                  className="branch-button"
                  onClick={() => onSelectBranch(sibling.id)}
                  title={`Go to: ${sibling.title}`}
                >
                  <span className="branch-icon">⤴</span>
                  <span className="branch-title">{sibling.title}</span>
                  <span className="branch-date">
                    {new Date(sibling.created_at).toLocaleDateString()}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Children branches */}
        {branchTree.children.length > 0 && (
          <div className="branch-section children">
            <h4>Sub-Branches</h4>
            {branchTree.children.map((child) => (
              <div key={child.id} className="branch-node child">
                <div className="branch-connector">└─</div>
                <button
                  className="branch-button"
                  onClick={() => onSelectBranch(child.id)}
                  title={`Go to: ${child.title}`}
                >
                  <span className="branch-icon">↓</span>
                  <span className="branch-title">{child.title}</span>
                  <span className="branch-date">
                    {new Date(child.created_at).toLocaleDateString()}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Visual tree representation (ASCII-style) */}
        {(branchTree.ancestors.length > 0 || branchTree.children.length > 0 || branchTree.siblings.length > 0) && (
          <div className="branch-ascii-tree">
            <h4>Tree View</h4>
            <pre className="ascii-art">
              {generateAsciiTree(branchTree)}
            </pre>
          </div>
        )}
      </div>

      {branchTree.isRoot && branchTree.children.length === 0 && (
        <div className="branch-hint">
          <p>💡 <strong>Tip:</strong> You can create branches from any message to explore different conversation paths.</p>
          <p>Right-click a message and select "Branch from here" to create a new branch.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Generate ASCII tree representation
 * Bobby's pride and joy - a text-based tree visualizer!
 */
function generateAsciiTree(tree: BranchTree): string {
  const lines: string[] = [];

  // Add ancestors
  tree.ancestors.forEach((ancestor, index) => {
    const indent = ' '.repeat(index * 2);
    const connector = index === 0 ? '┌─' : '├─';
    lines.push(`${indent}${connector} ${ancestor.title.substring(0, 30)}`);
  });

  // Add current (with proper indent based on ancestors)
  const currentIndent = ' '.repeat(tree.ancestors.length * 2);
  const currentConnector = tree.ancestors.length > 0 ? '├─' : '●';
  lines.push(`${currentIndent}${currentConnector} ${tree.current.title.substring(0, 30)} ← YOU ARE HERE`);

  // Add siblings
  tree.siblings.forEach((sibling) => {
    const siblingIndent = ' '.repeat(tree.ancestors.length * 2);
    lines.push(`${siblingIndent}├─ ${sibling.title.substring(0, 30)}`);
  });

  // Add children
  tree.children.forEach((child, index) => {
    const childIndent = ' '.repeat((tree.ancestors.length + 1) * 2);
    const connector = index === tree.children.length - 1 ? '└─' : '├─';
    lines.push(`${childIndent}${connector} ${child.title.substring(0, 30)}`);
  });

  return lines.join('\n');
}
