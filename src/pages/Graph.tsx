import { useCallback, useMemo } from 'react';
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
import { Activity, CheckCircle, Target, BookOpen, FileText } from 'lucide-react';

// Custom Node Components
const MetricNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-lg rounded-xl bg-zinc-900 border-2 border-emerald-500/50 min-w-[150px]">
    <div className="flex items-center mb-2">
      <Activity className="w-4 h-4 text-emerald-500 mr-2" />
      <div className="font-bold text-white text-sm">{data.label}</div>
    </div>
    <div className="text-xs text-zinc-400 flex justify-between">
      <span>Level</span>
      <span className="text-emerald-400 font-mono">{data.value.toFixed(1)}</span>
    </div>
  </div>
);

const HabitNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-lg rounded-xl bg-zinc-900 border-2 border-blue-500/50 min-w-[150px]">
    <div className="flex items-center mb-2">
      <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
      <div className="font-bold text-white text-sm">{data.label}</div>
    </div>
    <div className="text-xs text-zinc-400">{data.frequency}</div>
  </div>
);

const GoalNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-lg rounded-xl bg-zinc-900 border-2 border-amber-500/50 min-w-[150px]">
    <div className="flex items-center mb-2">
      <Target className="w-4 h-4 text-amber-500 mr-2" />
      <div className="font-bold text-white text-sm">{data.label}</div>
    </div>
    <div className="text-xs text-zinc-400 flex justify-between">
      <span>Target</span>
      <span className="text-amber-400 font-mono">{data.target}</span>
    </div>
  </div>
);

const ResourceNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-lg rounded-xl bg-zinc-900 border-2 border-indigo-500/50 min-w-[150px]">
    <div className="flex items-center mb-2">
      <BookOpen className="w-4 h-4 text-indigo-500 mr-2" />
      <div className="font-bold text-white text-sm">{data.label}</div>
    </div>
    <div className="text-xs text-zinc-400">{data.type}</div>
  </div>
);

const NoteNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-lg rounded-xl bg-zinc-900 border-2 border-rose-500/50 min-w-[150px]">
    <div className="flex items-center mb-2">
      <FileText className="w-4 h-4 text-rose-500 mr-2" />
      <div className="font-bold text-white text-sm">{data.label}</div>
    </div>
    <div className="text-xs text-zinc-400">Note</div>
  </div>
);

const nodeTypes = {
  metric: MetricNode,
  habit: HabitNode,
  goal: GoalNode,
  resource: ResourceNode,
  note: NoteNode,
};

export function Graph() {
  const { metrics, habits, goals, resources, notes, relationships } = useLifeGraphStore();

  // Generate nodes from store data
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    
    // Position helpers
    let habitY = 100;
    let metricY = 100;
    let goalY = 100;
    let resourceY = 100;
    let noteY = 100;

    habits.forEach((h, i) => {
      nodes.push({
        id: h.id,
        type: 'habit',
        position: { x: 300, y: habitY + i * 100 },
        data: { label: h.name, frequency: h.frequency },
      });
    });

    metrics.forEach((m, i) => {
      nodes.push({
        id: m.id,
        type: 'metric',
        position: { x: 600, y: metricY + i * 100 },
        data: { label: m.name, value: m.current_value },
      });
    });

    goals.forEach((g, i) => {
      nodes.push({
        id: g.id,
        type: 'goal',
        position: { x: 900, y: goalY + i * 100 },
        data: { label: g.name, target: g.target_value },
      });
    });

    resources.forEach((r, i) => {
      nodes.push({
        id: r.id,
        type: 'resource',
        position: { x: 0, y: resourceY + i * 100 },
        data: { label: r.title, type: r.type },
      });
    });

    notes.forEach((n, i) => {
      nodes.push({
        id: n.id,
        type: 'note',
        position: { x: 0, y: noteY + (resources.length + i) * 100 },
        data: { label: n.content.substring(0, 20) + '...' || 'Note', type: 'note' },
      });
    });

    return nodes;
  }, [metrics, habits, goals, resources, notes]);

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
    goals.forEach(g => {
      edges.push({
        id: `goal-${g.id}`,
        source: g.target_metric_id,
        target: g.id,
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
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">LifeGraph Network</h1>
        <p className="text-zinc-400 mt-1">Visualize how your habits influence your metrics and goals.</p>
      </header>

      <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
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
          <Background color="#27272a" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
