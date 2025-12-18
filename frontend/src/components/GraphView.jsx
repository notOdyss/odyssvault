/**
 * GraphView - Interactive visualization of linked notes
 * Force-directed graph using canvas
 * Supports both modal and full-view modes
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/GraphView.module.css';

export function GraphView({ isOpen = true, onClose, graphData, onNodeClick, isFullView = false }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  // keep minimal React state; heavy mutable graph lives in refs
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const nodesRef = useRef([]); // mutable positions, velocities used by simulation
  const edgesRef = useRef([]);
  const nodesMapRef = useRef(new Map()); // id -> node ref (for faster lookups)
  const [dragging, setDragging] = useState(null);
  const draggingRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const hoveredRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      } else if (isOpen && !isFullView) {
        setDimensions({
          width: Math.floor(window.innerWidth * 0.8),
          height: Math.floor(window.innerHeight * 0.7)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isOpen, isFullView]);

  // Initialize graph data (populate refs + one state sync)
  useEffect(() => {
    if (!graphData || (!isOpen && !isFullView)) return;

    const { width, height } = dimensions;
    const many = graphData.nodes.length > 300;

    // If graphData contains no nodes -> clear everything
    if (!graphData.nodes || graphData.nodes.length === 0) {
      nodesRef.current = [];
      edgesRef.current = [];
      nodesMapRef.current = new Map();
      setNodes([]);
      setEdges([]);
      setHoveredNode(null);
      hoveredRef.current = null;
      setDragging(null);
      draggingRef.current = null;
      return;
    }

    // normalize node ids to numbers to avoid lookup mismatch
    const initialNodes = graphData.nodes.map((node, i) => {
      const id = Number(node.id);                      // <<< convert id
      const radius = many ? 10 : 28;
      return {
        ...node,
        id,
        x: width / 2 + (Math.random() - 0.5) * Math.min(width * 0.6, 400),
        y: height / 2 + (Math.random() - 0.5) * Math.min(height * 0.6, 300),
        vx: 0,
        vy: 0,
        radius,
        color: node.color || null
      };
    });

    nodesRef.current = initialNodes;

    // normalize edges endpoints to numbers too
    edgesRef.current = (graphData.edges || []).map(e => ({
      source: Number(e.source),
      target: Number(e.target),
      ...e
    }));

    // id -> node mapping for quicker lookup
    const m = new Map();
    for (const n of initialNodes) m.set(n.id, n);
    nodesMapRef.current = m;

    // one React state sync so UI components relying on nodes still work
    setNodes(initialNodes);
    setEdges(edgesRef.current);
    // reset hovered/dragging
    setHoveredNode(null);
    hoveredRef.current = null;
    setDragging(null);
    draggingRef.current = null;
  // add a stable key so effect runs when the node list actually changes (ids added/removed)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    graphData,
    isOpen,
    isFullView,
    dimensions,
    // derived key: list of node ids (string) - triggers update on add/remove even if parent reuses object
    graphData ? (graphData.nodes || []).map(n => String(n.id)).join('|') : ''
  ]);

  // Force simulation operating on nodesRef - keep it fast and avoid setState each frame
  const simulateStep = useCallback((width, height) => {
    const positions = nodesRef.current;
    const edgesLocal = edgesRef.current;
    const n = positions.length;
    if (n === 0) return;

    // cheap repulsion: single nested loop but light ops
    for (let i = 0; i < n; i++) {
      const a = positions[i];
      if (draggingRef.current && draggingRef.current.id === a.id) continue;

      // center gravity (mild)
      a.vx += (width / 2 - a.x) * 0.0006;
      a.vy += (height / 2 - a.y) * 0.0006;

      // repulsion (pairwise)
      for (let j = i + 1; j < n; j++) {
        const b = positions[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist2 = dx * dx + dy * dy + 0.01;
        const inv = 1 / Math.sqrt(dist2);
        // force scaled to be moderate; clamp to avoid explosion
        let f = 300 / dist2;
        if (f > 2.5) f = 2.5;
        const fx = (dx * inv) * f;
        const fy = (dy * inv) * f;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;

        // simple separation when too close
        const minD = (a.radius + b.radius) * 0.9;
        if (dist2 < minD * minD) {
          const push = (minD - Math.sqrt(dist2)) * 0.03;
          a.vx += (dx * inv) * push;
          a.vy += (dy * inv) * push;
          b.vx -= (dx * inv) * push;
          b.vy -= (dy * inv) * push;
        }
      }
    }

    // spring edges (single pass)
    for (let k = 0; k < edgesLocal.length; k++) {
      const e = edgesLocal[k];
      const s = nodesMapRef.current.get(e.source);
      const t = nodesMapRef.current.get(e.target);
      if (!s || !t) continue;
      let dx = t.x - s.x;
      let dy = t.y - s.y;
      let dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const desired = 110;
      const ks = 0.0012;
      const diff = (dist - desired) * ks;
      const fx = (dx / dist) * diff;
      const fy = (dy / dist) * diff;
      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    // integrate + damping + bounds
    for (let i = 0; i < n; i++) {
      const p = positions[i];
      p.vx *= 0.88;
      p.vy *= 0.88;
      p.x += p.vx;
      p.y += p.vy;
      // clamp to canvas
      p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));
    }
  }, []);

  // Render loop uses nodesRef directly; setNodes is called rarely (SYNC_EVERY frames)
  useEffect(() => {
    if ((!isOpen && !isFullView) || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = dimensions.width;
    const height = dimensions.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frame = 0;
    const SYNC_EVERY = 6; // update React state this often (keeps UI responsive but cheap)
    const many = (nodesRef.current.length > 300);

    const render = () => {
      frame++;
      // run a single simulation step per frame (keeps it smooth)
      simulateStep(width, height);

      // draw
      ctx.clearRect(0, 0, width, height);
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0b0b0b';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const edgeColor = getComputedStyle(document.documentElement).getPropertyValue('--graph-edge').trim() || 'rgba(150,150,150,0.7)';
      const defaultNodeColor = getComputedStyle(document.documentElement).getPropertyValue('--graph-node').trim() || '#6aa6ff';
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#fff';

      // build map for quick lookup (updated each frame from nodesRef)
      const posList = nodesRef.current;
      const map = new Map();
      for (let i = 0; i < posList.length; i++) {
        map.set(posList[i].id, posList[i]);
      }
      nodesMapRef.current = map;

      // edges
      ctx.lineWidth = 1;
      ctx.strokeStyle = edgeColor;
      for (let i = 0; i < edgesRef.current.length; i++) {
        const e = edgesRef.current[i];
        const s = map.get(e.source);
        const t = map.get(e.target);
        if (!s || !t) continue;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }

      // nodes
      for (let i = 0; i < posList.length; i++) {
        const node = posList[i];
        const isHovered = hoveredRef.current && hoveredRef.current.id === node.id;
        const nodeColor = node.color || defaultNodeColor;

        // circle
        ctx.beginPath();
        ctx.fillStyle = isHovered ? '#ffb347' : nodeColor;
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.strokeStyle = isHovered ? textColor : nodeColor;
        ctx.stroke();

        // labels - skip for very large graphs
        if (!many) {
          ctx.fillStyle = isHovered ? '#ffffff' : textColor;
          ctx.font = isHovered ? '12px -apple-system, BlinkMacSystemFont, sans-serif' : '11px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const label = node.title.length > 12 ? node.title.slice(0, 10) + '...' : node.title;
          ctx.fillText(label, node.x, node.y);
          if (isHovered) {
            ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText('.od', node.x, node.y + node.radius + 10);
          }
        }
      }

      // occasionally sync to React state so other parts that read nodes get updates
      if ((frame % SYNC_EVERY) === 0) {
        // shallow copy to trigger diffs only when necessary
        setNodes(nodesRef.current.map(n => ({ ...n })));
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [isOpen, isFullView, dimensions, simulateStep]);

  // Helper: use nodesRef for hit testing (no expensive finds)
  const getNodeAtPosition = (x, y) => {
    const list = nodesRef.current;
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy < n.radius * n.radius) return n;
    }
    return null;
  };

  // Mouse handlers - update refs and minimal state
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y);
    if (node) {
      setDragging(node);
      draggingRef.current = node;
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingRef.current) {
      // mutate the node in ref directly for immediate visual response
      const node = nodesMapRef.current.get(draggingRef.current.id);
      if (node) {
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
      }
      // keep React state representing dragging node updated less frequently
      setNodes(prev => prev.map(n => n.id === draggingRef.current.id ? { ...node } : n));
      return;
    }

    const node = getNodeAtPosition(x, y);
    if ((hoveredRef.current && node && hoveredRef.current.id === node.id) ||
        (!hoveredRef.current && !node)) {
      // no change
      return;
    }
    hoveredRef.current = node;
    setHoveredNode(node);
    if (canvasRef.current) canvasRef.current.style.cursor = node ? 'pointer' : 'default';
  };

  const handleMouseUp = () => {
    setDragging(null);
    draggingRef.current = null;
  };

  const handleDoubleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y);
    if (node) {
      onNodeClick(node.id);
      if (!isFullView && onClose) onClose();
    }
  };

  // Full view rendering (keeps original return shape)
  if (isFullView) {
    return (
      <div ref={containerRef} className={styles.fullView}>
        <div className={styles.fullViewHeader}>
          <span className={styles.fullViewTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <circle cx="18" cy="6" r="3" />
              <line x1="8.5" y1="7.5" x2="15.5" y2="16.5" />
            </svg>
            {t('graphView.title')}
          </span>
          <span className={styles.hint}>{t('graphView.hint')}</span>
        </div>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
        {nodes.length === 0 && (
          <div className={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <circle cx="18" cy="6" r="3" />
              <line x1="8.5" y1="7.5" x2="15.5" y2="16.5" />
            </svg>
            <p>{t('graphView.noNotes')}</p>
            <span>{t('graphView.createHint')}</span>
          </div>
        )}
      </div>
    );
  }

  // Modal mode (original)
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>{t('graphView.title')}</span>
          <span className={styles.hint}>{t('graphView.hint')}</span>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
        {nodes.length === 0 && (
          <div className={styles.empty}>
            {t('graphView.noNotes')}. {t('graphView.createHint')}
          </div>
        )}
      </div>
    </div>
  );
}
