"use client";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import type { Node, Edge, NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Stakeholder, StakeholderGoals } from "@/lib/types";
import { priorityScore } from "@/lib/score";

interface Props {
  data: { stakeholder: Stakeholder; goals: StakeholderGoals | null }[];
}

const REL_COLOR: Record<string, string> = {
  sponsor: "#22c55e",
  aligned: "#3b82f6",
  neutral: "#94a3b8",
  cold: "#ef4444",
};

function buildLayout(count: number) {
  const radius = Math.max(180, count * 45);
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { x: 400 + radius * Math.cos(angle), y: 300 + radius * Math.sin(angle) };
  });
}

export default function InfluenceMapClient({ data }: Props) {
  const router = useRouter();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const positions = buildLayout(data.length);
    const nodes: Node[] = data.map(({ stakeholder: s, goals: g }, i) => {
      const score = priorityScore(s, g ?? undefined);
      const size = 40 + s.influenceScore * 10;
      return {
        id: s.id,
        position: positions[i],
        data: {
          label: (
            <div className="text-center leading-tight" style={{ width: size, fontSize: 10 }}>
              <div className="font-semibold truncate" style={{ maxWidth: size }}>{s.name.split(" ")[0]}</div>
              <div style={{ color: "#94a3b8", fontSize: 9 }}>{score}</div>
            </div>
          ),
        },
        style: {
          width: size,
          height: size,
          borderRadius: "50%",
          background: REL_COLOR[s.relationshipStrength] + "33",
          border: `2px solid ${REL_COLOR[s.relationshipStrength]}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        },
      };
    });

    const edges: Edge[] = [];
    data.forEach(({ stakeholder: s }) => {
      s.influences.forEach((targetId) => {
        if (data.find((d) => d.stakeholder.id === targetId)) {
          edges.push({
            id: `${s.id}->${targetId}`,
            source: s.id,
            target: targetId,
            animated: true,
            style: { stroke: REL_COLOR[s.relationshipStrength], strokeWidth: 1.5 },
            markerEnd: { type: "arrowclosed" as const },
          });
        }
      });
    });

    return { nodes, edges };
  }, [data]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      router.push(`/stakeholders/${node.id}`);
    },
    [router]
  );

  return (
    <div className="card" style={{ height: 560 }}>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 pt-3 pb-2 border-b border-[var(--border-light)] text-xs">
        {Object.entries(REL_COLOR).map(([rel, color]) => (
          <div key={rel} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
            <span className="capitalize text-[var(--text-secondary)]">{rel}</span>
          </div>
        ))}
        <span className="text-[var(--text-tertiary)] ml-auto">Node size = influence score · number = priority score</span>
      </div>
      <div style={{ height: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          attributionPosition="bottom-left"
        >
          <Background gap={24} color="#e2e8f0" />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const s = data.find((d) => d.stakeholder.id === n.id)?.stakeholder;
              return s ? REL_COLOR[s.relationshipStrength] : "#94a3b8";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
