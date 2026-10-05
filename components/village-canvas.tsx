"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Compass,
  Flame,
  Link2,
  Moon,
  Search,
  Star,
  X,
} from "lucide-react";
import { ActionChip } from "@/components/action-chip";
import { DistrictBadge } from "@/components/district-badge";
import { HallChat } from "@/components/hall-chat";
import { PowerBar } from "@/components/power-bar";
import { VillagerPortrait } from "@/components/villager-portrait";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DISTRICT_ORDER,
  districtColor,
  districtMeta,
} from "@/lib/residents";
import type { AnalyzeResponse, VillageNode, VillageResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Custom node types - the village is a candy-crush style world map
// ---------------------------------------------------------------------------

type ResidentNodeData = {
  name: string;
  district: string;
  power: number;
  mentions: number;
  active: boolean;
  dimmed?: boolean;
  relationIndex?: number | null;
};

type DistrictLabelData = {
  district: string;
  color: string;
  emoji: string;
  count: number;
};

type IslandData = {
  color: string;
  emoji: string;
  size: number;
};

type DecorData = {
  emoji: string;
  size: number;
};

type ResidentFlowNode = Node<ResidentNodeData, "resident">;
type DistrictFlowNode = Node<DistrictLabelData, "districtLabel">;
type IslandFlowNode = Node<IslandData, "island">;
type DecorFlowNode = Node<DecorData, "decor">;
type VillageFlowNode =
  | ResidentFlowNode
  | DistrictFlowNode
  | IslandFlowNode
  | DecorFlowNode;

function ResidentNode({ data, selected }: NodeProps<ResidentFlowNode>) {
  const meta = districtMeta(data.district);
  const size = 50 + data.power * 18;
  const barColor =
    data.power > 0.66 ? "#8be36f" : data.power > 0.4 ? "#f4c542" : "#94a3b8";

  return (
    <div
      className={cn(
        "group flex w-[104px] cursor-pointer flex-col items-center gap-1 transition-opacity duration-300",
        data.dimmed && "opacity-25"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-0.5 !w-0.5 !border-0 !bg-transparent"
      />
      <div className="relative transition-transform duration-200 group-hover:scale-110">
        {data.active ? (
          <span
            className="absolute -inset-1.5 animate-pulse-soft rounded-full"
            style={{
              boxShadow: `0 0 0 3px ${meta.color}55, 0 0 28px ${meta.color}aa`,
            }}
          />
        ) : null}
        <VillagerPortrait
          name={data.name}
          district={data.district}
          size={size}
          frame={false}
          className={cn(
            "relative border-[3px]",
            data.active ? "border-white/70" : "border-[#0f172a]",
            data.power <= 0.01 && "opacity-75 grayscale-[45%]",
            selected &&
              "ring-2 ring-gold-300 ring-offset-2 ring-offset-[#2f6330]"
          )}
        />
        {data.active ? (
          <span className="absolute -right-2 -top-2 animate-pulse-soft text-base drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
            ✨
          </span>
        ) : null}
        {data.relationIndex ? (
          <span className="absolute -left-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gold-700 bg-gradient-to-b from-gold-300 to-gold-500 font-display text-[10px] text-[#3d2500] shadow-[0_2px_0_#7a5310]">
            {data.relationIndex}
          </span>
        ) : null}
      </div>
      <div className="villager-power h-1.5 w-[72%] overflow-hidden rounded-full border border-black/50 bg-black/40">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.round(data.power * 100)}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <span className="villager-name max-w-full truncate rounded-md border border-black/40 bg-black/50 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-100">
        {data.name}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-0.5 !w-0.5 !border-0 !bg-transparent"
      />
    </div>
  );
}

function DistrictLabelNode({ data }: NodeProps<DistrictFlowNode>) {
  return (
    <div className="pointer-events-none w-[250px] select-none text-center">
      <div
        className="inline-flex items-center gap-2 rounded-xl border-2 border-black/50 px-3.5 py-1.5 shadow-[0_3px_0_rgba(0,0,0,0.35)]"
        style={{
          backgroundImage: `linear-gradient(180deg, ${data.color}66, ${data.color}22)`,
        }}
      >
        <span className="text-lg">{data.emoji}</span>
        <span
          className="font-display text-sm uppercase tracking-[0.18em] text-white"
          style={{ textShadow: "0 2px 0 rgba(0,0,0,0.5)" }}
        >
          {data.district}
        </span>
        <span className="rounded-full border border-black/40 bg-black/40 px-1.5 text-[10px] font-bold text-slate-100">
          {data.count}
        </span>
      </div>
    </div>
  );
}

/** A circular "island" - no more square boxes. */
function IslandNode({ data }: NodeProps<IslandFlowNode>) {
  return (
    <div
      className="pointer-events-none relative select-none rounded-full"
      style={{
        width: data.size,
        height: data.size,
        background: `radial-gradient(circle, ${data.color}33 0%, ${data.color}1c 42%, ${data.color}0a 66%, transparent 76%)`,
        border: `3px dashed ${data.color}55`,
        boxShadow: `inset 0 0 90px ${data.color}1f`,
      }}
    >
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] opacity-[0.13]">
        {data.emoji}
      </span>
    </div>
  );
}

function DecorNode({ data }: NodeProps<DecorFlowNode>) {
  return (
    <span
      className="pointer-events-none select-none drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]"
      style={{ fontSize: data.size }}
    >
      {data.emoji}
    </span>
  );
}

const nodeTypes = {
  resident: ResidentNode,
  districtLabel: DistrictLabelNode,
  island: IslandNode,
  decor: DecorNode,
};

// ---------------------------------------------------------------------------
// Layout: a honeycomb world map of circular islands. Inside each island the
// residents sit on a winding candy path (snake layout).
// ---------------------------------------------------------------------------

const DECOR_EMOJI = ["🌲", "🌳", "🪨", "🏕️", "🌾", "⛰️", "🌲", "🪨"];

type DistrictBounds = { x: number; y: number; width: number; height: number };
type PathLink = { source: string; target: string };

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function buildLayout(nodes: VillageNode[]) {
  const byDistrict = new Map<string, VillageNode[]>();
  for (const node of nodes) {
    const list = byDistrict.get(node.district) ?? [];
    list.push(node);
    byDistrict.set(node.district, list);
  }

  const districts = DISTRICT_ORDER.filter((district) => byDistrict.has(district));
  const worldCols = 4;
  const worldSpacingX = 500;
  const worldSpacingY = 480;
  const worldRows = Math.ceil(districts.length / worldCols);

  const flowNodes: VillageFlowNode[] = [];
  const boundsByDistrict = new Map<string, DistrictBounds>();
  const positionById = new Map<string, { x: number; y: number }>();
  const pathLinks: PathLink[] = [];

  districts.forEach((district, districtIndex) => {
    const col = districtIndex % worldCols;
    const row = Math.floor(districtIndex / worldCols);
    const cx =
      (col - (worldCols - 1) / 2) * worldSpacingX +
      (row % 2 === 1 ? worldSpacingX / 2 : 0);
    const cy = (row - (worldRows - 1) / 2) * worldSpacingY;

    const list = byDistrict.get(district) ?? [];
    const meta = districtMeta(district);
    const cols = Math.min(3, Math.ceil(Math.sqrt(list.length)));
    const spacingX = 86;
    const spacingY = 92;
    const rows = Math.ceil(list.length / cols);
    const islandRadius = Math.max(cols * spacingX, rows * spacingY) / 2 + 62;

    boundsByDistrict.set(district, {
      x: cx - islandRadius - 30,
      y: cy - islandRadius - 100,
      width: islandRadius * 2 + 60,
      height: islandRadius * 2 + 140,
    });

    // Circular island under the district
    flowNodes.push({
      id: `island-${district}`,
      type: "island",
      position: { x: cx - islandRadius, y: cy - islandRadius },
      data: {
        color: meta.color,
        emoji: meta.emoji,
        size: islandRadius * 2,
      },
      selectable: false,
      draggable: false,
      zIndex: 0,
    });

    // Winding snake path of residents (candy-crush style)
    const ordered: VillageNode[] = [];
    list.forEach((node, index) => {
      const pathRow = Math.floor(index / cols);
      const rawCol = index % cols;
      const pathCol = pathRow % 2 === 0 ? rawCol : cols - 1 - rawCol;
      const wobble = Math.sin(pathRow * 1.7) * 10;
      const position = {
        x: cx + (pathCol - (cols - 1) / 2) * spacingX + wobble,
        y: cy + (pathRow - (rows - 1) / 2) * spacingY,
      };
      positionById.set(node.id, position);
      ordered.push(node);
      flowNodes.push({
        id: node.id,
        type: "resident",
        position,
        data: {
          name: node.name,
          district: node.district,
          power: node.power,
          mentions: node.mentions,
          active: node.active,
        },
        zIndex: 10,
      });
    });

    // Consecutive residents on the snake become trail links
    for (let i = 0; i < ordered.length - 1; i++) {
      pathLinks.push({ source: ordered[i].id, target: ordered[i + 1].id });
    }

    flowNodes.push({
      id: `district-${district}`,
      type: "districtLabel",
      position: { x: cx - 125, y: cy - islandRadius - 74 },
      data: {
        district,
        color: meta.color,
        emoji: meta.emoji,
        count: list.length,
      },
      selectable: false,
      draggable: false,
      zIndex: 6,
    });
  });

  // Scatter decorations around the world
  for (let i = 0; i < 44; i++) {
    const angle = (i / 44) * Math.PI * 2 + seeded(i, 1) * 0.35;
    const decorRadius = 1180 + seeded(i, 2) * 380;
    flowNodes.push({
      id: `decor-${i}`,
      type: "decor",
      position: {
        x: Math.cos(angle) * decorRadius,
        y: Math.sin(angle) * decorRadius * 0.72,
      },
      data: {
        emoji: DECOR_EMOJI[i % DECOR_EMOJI.length],
        size: 24 + Math.round(seeded(i, 3) * 16),
      },
      selectable: false,
      draggable: false,
      zIndex: 1,
    });
  }

  return { flowNodes, boundsByDistrict, positionById, pathLinks };
}

// ---------------------------------------------------------------------------
// Edges: two lenses
//   "paths" - candy trails + faint cross-district ley lines
//   "bonds" - the full dependency web
// ---------------------------------------------------------------------------

type Lens = "paths" | "bonds";

function buildEdges(
  neighborhoodEdges: VillageResponse["edges"],
  nodesById: Map<string, VillageNode>,
  pathLinks: PathLink[],
  lens: Lens,
  selectedId: string | null,
  activeDistrict: string | null,
  hoveredId: string | null
): Edge[] {
  const result: Edge[] = [];
  const hasSelection = Boolean(selectedId);

  // Candy trails inside each island - hidden while a villager is selected so
  // only the real relations stay on screen.
  if (lens === "paths" && !hasSelection) {
    for (const link of pathLinks) {
      const district = nodesById.get(link.source)?.district ?? "";
      const color = districtColor(district);
      const near = activeDistrict === district;
      result.push({
        id: `trail-${link.source}-${link.target}`,
        source: link.source,
        target: link.target,
        type: "default",
        style: {
          stroke: color,
          strokeWidth: near ? 4 : 3,
          strokeDasharray: "0.1 11",
          strokeLinecap: "round",
          opacity: near ? 0.9 : 0.5,
        },
        zIndex: 1,
      });
    }
  }

  // Dependency bonds
  for (const edge of neighborhoodEdges) {
    const a = nodesById.get(edge.residentAId);
    const b = nodesById.get(edge.residentBId);
    if (!a || !b) continue;

    const isCross = a.district !== b.district;
    const highlighted =
      Boolean(selectedId) &&
      (edge.residentAId === selectedId || edge.residentBId === selectedId);
    const hovered =
      Boolean(hoveredId) &&
      (edge.residentAId === hoveredId || edge.residentBId === hoveredId);

    // Focus mode: a selected villager hides every unrelated line.
    if (hasSelection && !highlighted && !hovered) continue;

    const districtBoost = Boolean(
      activeDistrict &&
        !hasSelection &&
        (a.district === activeDistrict || b.district === activeDistrict)
    );

    if (lens === "paths" && !isCross && !highlighted && !hovered) continue;

    const color = districtColor(a.district);
    let opacity: number;
    let strokeWidth: number;
    let dashed = false;

    if (hovered) {
      opacity = 1;
      strokeWidth = 2.6 + edge.strength * 1.6;
    } else if (highlighted) {
      opacity = 0.95;
      strokeWidth = 1.8 + edge.strength * 1.6;
    } else if (districtBoost) {
      opacity = isCross ? 0.4 : 0.5;
      strokeWidth = 1.6;
    } else if (lens === "bonds") {
      opacity = isCross ? 0.14 : 0.3;
      strokeWidth = Math.max(0.8, edge.strength * 1.6);
    } else {
      // faint "ley lines" showing cross-district interdependency
      opacity = 0.07;
      strokeWidth = 1;
      dashed = true;
    }

    result.push({
      id: edge.id,
      source: edge.residentAId,
      target: edge.residentBId,
      type: "default",
      animated: highlighted || hovered,
      style: {
        stroke: hovered ? "#ffffff" : highlighted ? "#ffe9a3" : color,
        strokeWidth,
        opacity,
        strokeDasharray: dashed ? "4 7" : undefined,
      },
      zIndex: hovered ? 30 : highlighted ? 20 : 2,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// The board (inside ReactFlowProvider so we can fly the camera around)
// ---------------------------------------------------------------------------

function VillageBoard({
  data,
  onRefresh,
}: {
  data: VillageResponse;
  onRefresh: () => void;
}) {
  const reactFlow = useReactFlow();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lens, setLens] = useState<Lens>("paths");
  const [view, setView] = useState<"map" | "hall">("map");
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [far, setFar] = useState(false);
  const [lastResult, setLastResult] = useState<AnalyzeResponse | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<string | null>(null);
  const farRef = useRef(false);

  const { flowNodes, boundsByDistrict, positionById, pathLinks } = useMemo(
    () => buildLayout(data.nodes),
    [data.nodes]
  );

  const nodesById = useMemo(
    () => new Map(data.nodes.map((node) => [node.id, node])),
    [data.nodes]
  );

  const selected = selectedId ? nodesById.get(selectedId) ?? null : null;

  // Every bond of the selected villager, cross-district and strongest first.
  const relations = useMemo(() => {
    if (!selectedId || !selected) return [];
    return data.edges
      .filter(
        (edge) =>
          edge.residentAId === selectedId || edge.residentBId === selectedId
      )
      .map((edge) => {
        const otherId =
          edge.residentAId === selectedId ? edge.residentBId : edge.residentAId;
        const resident = nodesById.get(otherId);
        if (!resident) return null;
        return {
          resident,
          strength: edge.strength,
          cross: resident.district !== selected.district,
        };
      })
      .filter(
        (
          entry
        ): entry is {
          resident: VillageNode;
          strength: number;
          cross: boolean;
        } => entry !== null
      )
      .sort(
        (a, b) =>
          Number(b.cross) - Number(a.cross) ||
          b.strength - a.strength ||
          a.resident.name.localeCompare(b.resident.name)
      );
  }, [data.edges, selectedId, selected, nodesById]);

  // Number badges on the map match the cards in the relations list below.
  const relationIndexById = useMemo(
    () =>
      new Map(
        relations.map((relation, index) => [relation.resident.id, index + 1])
      ),
    [relations]
  );

  const relationDistrictCount = useMemo(
    () => new Set(relations.map((relation) => relation.resident.district)).size,
    [relations]
  );

  // Everyone linked to the selected resident stays bright; the rest dims.
  const neighborIds = useMemo(
    () => new Set(relations.map((relation) => relation.resident.id)),
    [relations]
  );

  const styledNodes = useMemo(
    () =>
      flowNodes.map((node) => {
        if (node.type !== "resident") return node;
        const dimmed = selectedId
          ? node.id !== selectedId && !neighborIds.has(node.id)
          : false;
        return {
          ...node,
          data: {
            ...node.data,
            dimmed,
            relationIndex: relationIndexById.get(node.id) ?? null,
          },
        };
      }),
    [flowNodes, selectedId, neighborIds, relationIndexById]
  );

  const styledEdges = useMemo(
    () =>
      buildEdges(
        data.edges,
        nodesById,
        pathLinks,
        lens,
        selectedId,
        activeDistrict,
        hoveredRelation
      ),
    [
      data.edges,
      nodesById,
      pathLinks,
      lens,
      selectedId,
      activeDistrict,
      hoveredRelation,
    ]
  );

  const districtStats = useMemo(() => {
    const stats = new Map<string, { total: number; active: number }>();
    for (const node of data.nodes) {
      const entry = stats.get(node.district) ?? { total: 0, active: 0 };
      entry.total += 1;
      if (node.active) entry.active += 1;
      stats.set(node.district, entry);
    }
    return stats;
  }, [data.nodes]);

  const selectedThought = useMemo(() => {
    if (!selectedId) return null;
    if (lastResult && lastResult.primary.id === selectedId) {
      return lastResult.thought;
    }
    return (
      data.thoughts.find(
        (thought) => thought.primaryResident?.id === selectedId
      ) ?? null
    );
  }, [selectedId, lastResult, data.thoughts]);

  function flyToDistrict(district: string) {
    const bounds = boundsByDistrict.get(district);
    if (!bounds) return;
    setActiveDistrict(district);
    reactFlow.fitBounds(bounds, { duration: 700, padding: 0.2 });
  }

  function flyToResident(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match =
      data.nodes.find((node) => node.name.toLowerCase() === q) ??
      data.nodes.find((node) => node.name.toLowerCase().startsWith(q)) ??
      data.nodes.find((node) => node.name.toLowerCase().includes(q));
    if (!match) return;
    const position = positionById.get(match.id);
    setSelectedId(match.id);
    setActiveDistrict(match.district);
    if (position) {
      reactFlow.setCenter(position.x, position.y, { zoom: 1.05, duration: 800 });
    }
  }

  function handleAnalyzed(result: AnalyzeResponse) {
    setSelectedId(result.primary.id);
    setActiveDistrict(result.primary.district);
    setLastResult(result);
    const position = positionById.get(result.primary.id);
    if (position) {
      reactFlow.setCenter(position.x, position.y, {
        zoom: 1.15,
        duration: 900,
      });
    }
  }

  function travelTo(residentId: string) {
    const node = nodesById.get(residentId);
    if (node) setActiveDistrict(node.district);
    setSelectedId(residentId);
    const position = positionById.get(residentId);
    if (position) {
      reactFlow.setCenter(position.x, position.y, {
        zoom: 1.15,
        duration: 800,
      });
    }
  }

  const switcherClass = (active: boolean) =>
    cn(
      "rounded-xl border-2 border-b-4 px-2 py-1.5 font-display text-xs uppercase tracking-wide transition-all duration-100 active:translate-y-[2px] active:border-b-2",
      active
        ? "border-gold-700 bg-gradient-to-b from-gold-300 to-gold-500 text-[#3d2500] shadow-[0_3px_0_#7a5310]"
        : "border-black/50 bg-gradient-to-b from-[#243356] to-[#18233d] text-slate-300 shadow-[0_3px_0_rgba(0,0,0,0.4)] hover:brightness-110"
    );

  return (
    <div className="-mx-3 -mb-24 -mt-6 flex h-[calc(100dvh-7rem)] flex-col gap-2 overflow-hidden p-3 sm:-mx-4 sm:-mt-8 lg:grid lg:h-[calc(100dvh-4rem)] lg:grid-cols-[290px_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto_minmax(0,1fr)] lg:gap-3">
      {/* Header HUD */}
      <div className="flex flex-wrap items-end justify-between gap-3 px-3 sm:px-0 lg:col-start-1 lg:row-start-1 lg:flex-col lg:items-start lg:gap-2 lg:px-0">
        <div className="flex items-center gap-3">
          <span className="text-4xl drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
            {view === "map" ? "🗺️" : "🔮"}
          </span>
          <div>
            <h1 className="font-display text-3xl tracking-wide text-gold-300 [text-shadow:0_2px_0_rgba(0,0,0,0.5)] lg:text-2xl">
              {view === "map" ? "THE VILLAGE MAP" : "THE COUNCIL HALL"}
            </h1>
            <p className="text-sm font-semibold text-slate-400 lg:text-xs">
              {view === "map"
                ? "Follow the trails between islands - ✨ means they spoke this week."
                : "Chat with the village - the map stays awake beside you."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hud-chip">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_#6ee7b7]" />
            {data.stats.activeResidents} active this week
          </span>
          <span className="hud-chip">
            <Star className="h-3.5 w-3.5 text-gold-300" />
            {data.stats.title} - Lv {data.stats.level}
          </span>
          <span className="hud-chip">
            <Flame className="h-3.5 w-3.5 text-orange-300" /> {data.stats.streak}d
            streak
          </span>
        </div>

        {/* Both views always visible - no dropdown */}
        <div className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border-2 border-black/40 bg-[#0d1526]/80 p-1.5">
          <button
            onClick={() => {
              setView("map");
              onRefresh();
            }}
            className={switcherClass(view === "map")}
          >
            🗺️ Map
          </button>
          <button
            onClick={() => setView("hall")}
            className={switcherClass(view === "hall")}
          >
            🔮 Hall
          </button>
        </div>
      </div>

      {view === "map" && data.stats.activeResidents === 0 ? (
        <div className="mx-3 mt-3 flex items-center gap-3 rounded-2xl border-2 border-black/40 bg-gradient-to-b from-[#243356] to-[#16203a] px-4 py-3 text-sm font-bold text-slate-300 shadow-chip sm:mx-0 lg:col-start-1 lg:row-start-2 lg:mx-0 lg:mt-0 lg:px-3 lg:py-2 lg:text-xs">
          <Moon className="h-4 w-4 text-slate-400" />
          The village is resting. Ask in the Council Hall and the residents who
          speak will light up here.
        </div>
      ) : null}

      {view === "map" ? (
        <>
          {/* Map toolbar */}
          <div className="game-panel mt-4 flex flex-wrap items-center gap-2 p-3 lg:col-start-1 lg:row-start-3 lg:mt-0 lg:flex-col lg:items-stretch">
            <Button
              variant="secondary"
              size="sm"
              className="lg:w-full"
              onClick={() => {
                setActiveDistrict(null);
                reactFlow.fitView({ padding: 0.06, duration: 700 });
              }}
            >
              <Compass className="h-3.5 w-3.5" /> Fit all
            </Button>

            {/* Lens switcher */}
            <div className="flex items-center gap-1 rounded-xl border-2 border-black/40 bg-[#0d1526]/80 p-1 lg:w-full lg:justify-center">
              <button
                onClick={() => setLens("paths")}
                title="Candy trails inside each island"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  lens === "paths"
                    ? "bg-gradient-to-b from-gold-300 to-gold-500 text-[#3d2500] shadow-[0_2px_0_#7a5310]"
                    : "text-slate-300 hover:bg-white/5"
                )}
              >
                🗺️ Paths
              </button>
              <button
                onClick={() => setLens("bonds")}
                title="The full dependency web between residents"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  lens === "bonds"
                    ? "bg-gradient-to-b from-gold-300 to-gold-500 text-[#3d2500] shadow-[0_2px_0_#7a5310]"
                    : "text-slate-300 hover:bg-white/5"
                )}
              >
                🕸️ Bonds
              </button>
            </div>

            <div className="relative lg:w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                list="villager-list"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") flyToResident(search);
                }}
                placeholder="Find a villager..."
                className="h-8 w-48 rounded-lg border-2 border-black/40 bg-[#0d1526] pl-8 pr-3 text-xs font-bold text-slate-200 placeholder:text-slate-500 focus:border-gold-500/60 focus:outline-none lg:w-full"
              />
              <datalist id="villager-list">
                {data.nodes.map((node) => (
                  <option key={node.id} value={node.name} />
                ))}
              </datalist>
            </div>

            <span className="ml-auto hidden items-center gap-1.5 text-[11px] font-bold text-slate-400 md:flex lg:ml-0 lg:justify-center">
              <Link2 className="h-3.5 w-3.5 text-gold-300" />
              {data.edges.length} bonds in the village
            </span>
          </div>

          {/* District fast-travel */}
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:col-start-1 lg:row-start-4 lg:mt-0 lg:min-h-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pr-1">
            {DISTRICT_ORDER.map((district) => {
              const meta = districtMeta(district);
              const stats = districtStats.get(district);
              if (!stats) return null;
              const active = activeDistrict === district;
              return (
                <button
                  key={district}
                  onClick={() => flyToDistrict(district)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-b-4 px-3 py-1.5 text-xs font-bold transition-all duration-100 active:translate-y-[2px] active:border-b-2 lg:w-full lg:justify-between",
                    active
                      ? "border-gold-700 bg-gradient-to-b from-gold-300 to-gold-500 text-[#3d2500] shadow-[0_3px_0_#7a5310]"
                      : "border-black/40 bg-gradient-to-b from-[#243356] to-[#16203a] text-slate-200 shadow-[0_3px_0_rgba(0,0,0,0.4)] hover:brightness-110"
                  )}
                >
                  <span className="text-sm">{meta.emoji}</span>
                  {district}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px]",
                      active ? "bg-black/20" : "bg-black/40"
                    )}
                  >
                    {stats.total}
                    {stats.active > 0 ? ` · ${stats.active}✨` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {/* Council Hall chat - lives in the sidebar, map stays visible */}
      <HallChat
        onAnalyzed={handleAnalyzed}
        onRefresh={onRefresh}
        className={cn(
          "mt-4 max-h-[55vh] lg:col-start-1 lg:row-span-2 lg:row-start-3 lg:mt-0 lg:max-h-none",
          view === "hall" ? "flex" : "hidden"
        )}
      />

      {/* Main stage: the map always stays, with the outcome frame below */}
      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mt-0">
        <div
          className={cn(
            "grass-field relative min-h-[240px] flex-1 overflow-hidden rounded-3xl border-4 border-black/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
            far && "map-far"
          )}
        >
          <ReactFlow
            nodes={styledNodes}
            edges={styledEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.06 }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={false}
            nodesConnectable={false}
            onMove={(_, viewport) => {
              const nextFar = viewport.zoom < 0.4;
              if (nextFar !== farRef.current) {
                farRef.current = nextFar;
                setFar(nextFar);
              }
            }}
            onNodeClick={(_, node) => {
              if (node.type === "resident") {
                setSelectedId(node.id);
                setActiveDistrict(node.data.district as string);
              }
            }}
            onPaneClick={() => setSelectedId(null)}
            proOptions={{ hideAttribution: true }}
            colorMode="dark"
            style={{ background: "transparent" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={30}
              size={1.5}
              color="#ffffff1c"
            />
            <Controls position="top-right" showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) =>
                districtMeta(
                  (node.data as { district?: string })?.district ?? ""
                ).color
              }
              maskColor="rgba(18, 36, 16, 0.78)"
            />
          </ReactFlow>
        </div>

        {/* Outcome frame - selected villager + every relation, below the map */}
        <div className="game-panel-gold flex h-[196px] shrink-0 flex-col gap-2 overflow-hidden p-3 sm:h-[212px] sm:flex-row sm:gap-3">
          {selected ? (
            <>
              {/* Identity */}
              <div className="flex shrink-0 items-center gap-3 sm:w-[200px] sm:flex-col sm:items-start">
                <div className="flex items-center gap-3">
                  <VillagerPortrait
                    name={selected.name}
                    district={selected.district}
                    size={58}
                    className="hidden sm:inline-flex"
                  />
                  <VillagerPortrait
                    name={selected.name}
                    district={selected.district}
                    size={44}
                    className="sm:hidden"
                  />
                  <div className="min-w-0 sm:hidden">
                    <h2 className="truncate font-display text-base tracking-wide text-gold-200">
                      {selected.name}
                    </h2>
                    <div className="mt-1">
                      <DistrictBadge district={selected.district} />
                    </div>
                  </div>
                </div>
                <div className="hidden min-w-0 sm:block">
                  <h2 className="truncate font-display text-xl tracking-wide text-gold-200 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
                    {selected.name}
                  </h2>
                  <div className="mt-1">
                    <DistrictBadge district={selected.district} />
                  </div>
                </div>
                <div className="hidden w-full sm:block">
                  <PowerBar
                    district={selected.district}
                    power={selected.power}
                    className="mt-2"
                  />
                  <p className="mt-2 truncate text-[10px] font-bold text-slate-400">
                    ⚒️ {selected.function}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500">
                    🌑 {selected.shadow || "No shadow listed"}
                  </p>
                </div>
              </div>

              {/* Every relation, numbered like the lines on the map */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    🔗 Relations - {relations.length} bonds ·{" "}
                    {relationDistrictCount} districts
                  </p>
                  <span className="hidden text-[9px] font-bold text-slate-500 md:block">
                    hover to trace - click to travel
                  </span>
                </div>
                <div className="mt-1.5 flex min-h-0 flex-1 gap-2 overflow-x-auto pb-1">
                  {relations.map((relation, index) => (
                    <button
                      key={relation.resident.id}
                      onClick={() => travelTo(relation.resident.id)}
                      onMouseEnter={() =>
                        setHoveredRelation(relation.resident.id)
                      }
                      onMouseLeave={() => setHoveredRelation(null)}
                      className="flex w-[172px] shrink-0 items-center gap-2 rounded-xl border-2 border-black/40 bg-[#0d1526]/70 p-2 text-left transition hover:border-gold-500/70 hover:bg-white/[0.04]"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-gold-700 bg-gradient-to-b from-gold-300 to-gold-500 font-display text-[10px] text-[#3d2500] shadow-[0_2px_0_#7a5310]">
                        {index + 1}
                      </span>
                      <VillagerPortrait
                        name={relation.resident.name}
                        district={relation.resident.district}
                        size={34}
                        frame={false}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-slate-200">
                          {relation.resident.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: districtColor(
                                relation.resident.district
                              ),
                            }}
                          />
                          <span className="truncate text-[9px] font-bold text-slate-500">
                            {relation.cross
                              ? relation.resident.district
                              : "same island"}
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/40">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round(relation.strength * 100)}%`,
                              backgroundColor: districtColor(
                                relation.resident.district
                              ),
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Latest reading */}
              <div className="hidden w-[270px] shrink-0 flex-col rounded-xl border-2 border-black/40 bg-[#0d1526]/70 p-2.5 lg:flex">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  🗣️ Latest reading
                </p>
                {selectedThought ? (
                  <>
                    <div className="mt-1">
                      <ActionChip action={selectedThought.suggestedAction} />
                    </div>
                    <p className="mt-1.5 line-clamp-3 font-serif text-[11px] italic leading-relaxed text-slate-300">
                      {selectedThought.reasoning}
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 text-[11px] font-bold text-slate-500">
                    No reading yet - ask the Council Hall.
                  </p>
                )}
              </div>

              <Button
                variant="destructive"
                size="icon"
                className="shrink-0 self-start"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-3 px-3 text-center">
              <span className="text-3xl">👆</span>
              <p className="max-w-lg text-xs font-bold leading-relaxed text-slate-400 sm:text-sm">
                Select a villager on the map, or open the{" "}
                <span className="text-gold-200">Council Hall</span> to ask who is
                speaking. The outcome appears here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data loading wrapper
// ---------------------------------------------------------------------------

export function VillageCanvas() {
  const [data, setData] = useState<VillageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/village");
      if (!response.ok) throw new Error("Could not load the village.");
      const payload = (await response.json()) as VillageResponse;
      setData(payload);
      setError(null);
    } catch {
      setError("The village map could not be drawn. Refresh to try again.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="game-panel p-8 text-center text-sm font-bold text-slate-400">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-[60vh] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <VillageBoard data={data} onRefresh={load} />
    </ReactFlowProvider>
  );
}
