import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { Activity, CheckCircle, Target, BookOpen, FileText, Bot } from 'lucide-react';
import { AIPanel } from '../components/AIPanel';
import { Habit, Metric, Goal, Resource, Note } from '../types';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 120;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

// Custom Node Components
const GroupNode = ({ data }: any) => {
  return (
    <div className="shadow-sm rounded-md bg-[#e6d5b8] border-2 border-dashed border-[#c69c6d] p-6 min-w-[300px] min-h-[200px]">
      <div className="flex justify-between items-center mb-4 border-b border-[#c69c6d] pb-2">
        <div className="font-bold text-zinc-800 text-lg uppercase tracking-wider">{data.label}</div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            data.toggleCollapse();
          }} 
          className="bg-[#c69c6d] hover:bg-[#b58b5c] text-white w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm"
        >
          {data.collapsed ? '+' : '-'}
        </button>
      </div>
      {data.collapsed && (
        <div className="text-zinc-600 italic text-sm text-center py-4">
          Collapsed - {data.childCount} items hidden
        </div>
      )}
    </div>
  );
};

const MetricNode = ({ data }: any) => (
  <div className={`px-4 py-3 shadow-md rounded-sm bg-[#fdf6e3] border border-zinc-300 min-w-[150px] rotate-[-1deg] hover:rotate-0 transition-transform ${data.hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ borderLeft: `8px solid ${data.color || '#10b981'}` }}>
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center">
        <Activity className="w-4 h-4 text-emerald-700 mr-2" />
        <div className="font-bold text-zinc-900 text-sm">{data.label}</div>
      </div>
      <input type="color" defaultValue={data.color || '#10b981'} onChange={(e) => data.updateAction({ color: e.target.value })} className="w-4 h-4 cursor-pointer" />
    </div>
    <div className="text-xs text-zinc-600 flex justify-between">
      <span>Level</span>
      <span className="text-emerald-800 font-mono font-bold">{data.value.toFixed(1)}</span>
    </div>
  </div>
);

const HabitNode = ({ data }: any) => (
  <div className={`px-4 py-3 shadow-md rounded-sm bg-[#fdf6e3] border border-zinc-300 min-w-[150px] rotate-[1deg] hover:rotate-0 transition-transform ${data.hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ borderLeft: `8px solid ${data.color || '#3b82f6'}` }}>
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center">
        <CheckCircle className="w-4 h-4 text-blue-700 mr-2" />
        <div className="font-bold text-zinc-900 text-sm">{data.label}</div>
      </div>
      <input type="color" defaultValue={data.color || '#3b82f6'} onChange={(e) => data.updateAction({ color: e.target.value })} className="w-4 h-4 cursor-pointer" />
    </div>
    <div className="text-xs text-zinc-600">{data.frequency}</div>
  </div>
);

const GoalNode = ({ data }: any) => (
  <div className={`px-4 py-3 shadow-md rounded-sm bg-[#fdf6e3] border border-zinc-300 min-w-[150px] rotate-[-0.5deg] hover:rotate-0 transition-transform ${data.hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ borderLeft: `8px solid ${data.color || '#f59e0b'}` }}>
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center">
        <Target className="w-4 h-4 text-amber-700 mr-2" />
        <div className="font-bold text-zinc-900 text-sm">{data.label}</div>
      </div>
      <input type="color" defaultValue={data.color || '#f59e0b'} onChange={(e) => data.updateAction({ color: e.target.value })} className="w-4 h-4 cursor-pointer" />
    </div>
    <div className="text-xs text-zinc-600 flex justify-between">
      <span>Target</span>
      <span className="text-amber-800 font-mono font-bold">{data.target}</span>
    </div>
  </div>
);

const ResourceNode = ({ data }: any) => (
  <div className={`px-4 py-3 shadow-md rounded-sm bg-[#fdf6e3] border border-zinc-300 min-w-[150px] rotate-[0.5deg] hover:rotate-0 transition-transform ${data.hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ borderLeft: `8px solid ${data.color || '#6366f1'}` }}>
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center">
        <BookOpen className="w-4 h-4 text-indigo-700 mr-2" />
        <div className="font-bold text-zinc-900 text-sm">{data.label}</div>
      </div>
      <input type="color" defaultValue={data.color || '#6366f1'} onChange={(e) => data.updateAction({ color: e.target.value })} className="w-4 h-4 cursor-pointer" />
    </div>
    <div className="text-xs text-zinc-600">{data.type}</div>
  </div>
);

const NoteNode = ({ data }: any) => (
  <div className={`px-4 py-3 shadow-md rounded-sm bg-[#fdf6e3] border border-zinc-300 min-w-[150px] rotate-[-1.5deg] hover:rotate-0 transition-transform ${data.hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ borderLeft: `8px solid ${data.color || '#f43f5e'}` }}>
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center">
        <FileText className="w-4 h-4 text-rose-700 mr-2" />
        <div className="font-bold text-zinc-900 text-sm">{data.label}</div>
      </div>
      <input type="color" defaultValue={data.color || '#f43f5e'} onChange={(e) => data.updateAction({ color: e.target.value })} className="w-4 h-4 cursor-pointer" />
    </div>
    <div className="text-xs text-zinc-600">Note</div>
  </div>
);

const nodeTypes = {
  group: GroupNode,
  metric: MetricNode,
  habit: HabitNode,
  goal: GoalNode,
  resource: ResourceNode,
  note: NoteNode,
};

export function Graph() {
  const { metrics, habits, goals, goalMetrics, resources, notes, relationships, categories, addRelationship, updateMetric, updateHabit, updateGoal, updateResource, updateNote } = useLifeGraphStore();
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Generate nodes from store data
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    
    // Add group nodes for categories
    categories.forEach((c, i) => {
      const children = [
        ...metrics.filter(m => m.category_id === c.id),
        ...habits.filter(h => h.category_id === c.id),
        ...goals.filter(g => g.category_id === c.id),
        ...resources.filter(r => r.category_id === c.id),
        ...notes.filter(n => n.category_id === c.id),
      ];

      nodes.push({
        id: c.id,
        type: 'group',
        position: { x: 50 + i * 400, y: 50 },
        data: { 
          label: c.name, 
          collapsed: false,
          childCount: children.length,
          toggleCollapse: () => {
            setNodes((nds) => {
              const groupNode = nds.find(n => n.id === c.id);
              if (!groupNode) return nds;
              
              const isCollapsed = !groupNode.data.collapsed;
              
              return nds.map((n) => {
                if (n.id === c.id) {
                  return { ...n, data: { ...n.data, collapsed: isCollapsed } };
                }
                if (n.parentId === c.id) {
                  return { ...n, hidden: isCollapsed };
                }
                return n;
              });
            });
          }
        },
      });
    });

    // Position helpers
    let habitY = 100;
    let metricY = 100;
    let goalY = 100;
    let resourceY = 100;
    let noteY = 100;

    habits.forEach((h, i) => {
      const parentId = h.category_id;
      nodes.push({
        id: h.id,
        type: 'habit',
        parentId: parentId || undefined,
        position: { x: parentId ? 20 : 300, y: parentId ? 80 + i * 80 : habitY + i * 100 },
        data: { label: h.name, frequency: h.frequency, color: h.color, updateAction: (data: Partial<Habit>) => updateHabit(h.id, data) },
      });
    });

    metrics.forEach((m, i) => {
      const parentId = m.category_id;
      nodes.push({
        id: m.id,
        type: 'metric',
        parentId: parentId || undefined,
        position: { x: parentId ? 200 : 600, y: parentId ? 80 + i * 80 : metricY + i * 100 },
        data: { label: m.name, value: m.current_value, color: m.color, updateAction: (data: Partial<Metric>) => updateMetric(m.id, data) },
      });
    });

    goals.forEach((g, i) => {
      const parentId = g.category_id;
      const metric = goalMetrics.find(gm => gm.goal_id === g.id);
      nodes.push({
        id: g.id,
        type: 'goal',
        parentId: parentId || undefined,
        position: { x: parentId ? 20 : 900, y: parentId ? 300 + i * 80 : goalY + i * 100 },
        data: { label: g.name, target: metric ? metric.target_value : 'N/A', color: g.color, updateAction: (data: Partial<Goal>) => updateGoal(g.id, data) },
      });
    });

    resources.forEach((r, i) => {
      const parentId = r.category_id;
      nodes.push({
        id: r.id,
        type: 'resource',
        parentId: parentId || undefined,
        position: { x: parentId ? 200 : 0, y: parentId ? 300 + i * 80 : resourceY + i * 100 },
        data: { label: r.title, type: r.type, color: '#6366f1', updateAction: (data: Partial<Resource>) => updateResource(r.id, data) },
      });
    });

    notes.forEach((n, i) => {
      const parentId = n.category_id;
      nodes.push({
        id: n.id,
        type: 'note',
        parentId: parentId || undefined,
        position: { x: parentId ? 100 : 0, y: parentId ? 500 + i * 80 : noteY + (resources.length + i) * 100 },
        data: { label: n.content.substring(0, 20) + '...' || 'Note', type: 'note', color: '#f43f5e', updateAction: (data: Partial<Note>) => updateNote(n.id, data) },
      });
    });

    return nodes;
  }, [metrics, habits, goals, resources, notes, categories]);

  // Generate edges from relationships
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    relationships.forEach(r => {
      let strokeColor = '#52525b'; // default zinc
      if (r.source_type === 'habit') strokeColor = '#3b82f6'; // blue
      else if (r.source_type === 'metric') strokeColor = '#10b981'; // emerald
      else if (r.source_type === 'resource') strokeColor = '#6366f1'; // indigo
      else if (r.source_type === 'note') strokeColor = '#f43f5e'; // rose

      edges.push({
        id: r.id,
        source: r.source_id,
        target: r.target_id,
        animated: r.source_type === 'habit',
        label: `+${r.weight}`,
        style: { stroke: strokeColor, strokeWidth: 2 },
        labelStyle: { fill: '#a1a1aa', fontWeight: 700 },
        labelBgStyle: { fill: '#18181b' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
        },
      });
    });

    // Add goal edges
    goalMetrics.forEach(gm => {
      edges.push({
        id: `goal-${gm.id}`,
        source: gm.metric_id,
        target: gm.goal_id,
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#f59e0b',
        },
      });
    });

    return edges;
  }, [relationships, goals]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (sourceNode && targetNode) {
        addRelationship({
          user_id: 'user-1',
          source_id: params.source!,
          target_id: params.target!,
          source_type: sourceNode.type as any,
          target_type: targetNode.type as any,
          weight: 1,
          delay_days: 0
        });
      }
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, addRelationship, nodes],
  );

  const onLayout = useCallback(
    (direction: string) => {
      const filteredNodes = nodes.filter(n => n.type !== 'group');
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        filteredNodes.map(n => ({ ...n, parentId: undefined, hidden: false })), 
        edges,
        direction
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    },
    [nodes, edges, setNodes, setEdges]
  );

  const onLayoutByCategory = useCallback(() => {
    const newNodes = nodes.map(node => {
      if (node.type === 'group') {
        const index = categories.findIndex(c => c.id === node.id);
        return { ...node, position: { x: index * 450, y: 50 }, hidden: false };
      }
      if (node.parentId) {
        const siblings = nodes.filter(n => n.parentId === node.parentId);
        const index = siblings.indexOf(node);
        return {
          ...node,
          hidden: false,
          position: {
            x: (index % 2) * 200 + 20,
            y: Math.floor(index / 2) * 120 + 80
          }
        };
      }
      return { ...node, hidden: false };
    });
    setNodes(newNodes);
  }, [nodes, categories, setNodes]);

  const onLayoutByType = useCallback(() => {
    const types = ['habit', 'metric', 'goal', 'resource', 'note'];
    const newNodes = nodes
      .filter(n => n.type !== 'group')
      .map(node => {
        const typeIndex = types.indexOf(node.type as string);
        if (typeIndex === -1) return node;

        const siblings = nodes.filter(n => n.type === node.type);
        const index = siblings.indexOf(node);

        return {
          ...node,
          parentId: undefined,
          hidden: false,
          position: {
            x: typeIndex * 300,
            y: index * 150 + 100
          }
        };
      });
    setNodes(newNodes);
  }, [nodes, setNodes]);

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">LifeGraph Network</h1>
          <p className="text-zinc-400 mt-1">Visualize how your habits influence your metrics and goals.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-zinc-800 p-1 rounded-lg flex items-center space-x-1 border border-zinc-700">
            <button 
              onClick={() => onLayout('LR')}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
              title="Hierarchical Layout"
            >
              Hierarchical
            </button>
            <button 
              onClick={onLayoutByCategory}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
              title="Group by Category"
            >
              Categories
            </button>
            <button 
              onClick={onLayoutByType}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
              title="Group by Type"
            >
              Types
            </button>
            <div className="w-px h-4 bg-zinc-700 mx-1" />
            <button 
              onClick={() => {
                setNodes(initialNodes);
                setEdges(initialEdges);
              }}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
              title="Reset to Default Layout"
            >
              Reset
            </button>
          </div>
          <button 
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors border border-zinc-700"
          >
            <Bot className="w-5 h-5 mr-2" />
            AI Assistant
          </button>
        </div>
      </header>

      <div className="flex-1 flex bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-zinc-950"
            colorMode="dark"
          >
            <Controls className="bg-zinc-800 border-zinc-700 fill-zinc-400" />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'habit': return '#3b82f6';
                  case 'metric': return '#10b981';
                  case 'goal': return '#f59e0b';
                  case 'resource': return '#6366f1';
                  case 'note': return '#f43f5e';
                  default: return '#52525b';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.7)"
              className="bg-zinc-900 border border-zinc-800"
            />
            <Background color="#c69c6d" gap={40} />
          </ReactFlow>
        </div>
        {showAIPanel && <AIPanel onClose={() => setShowAIPanel(false)} />}
      </div>
    </div>
  );
}
