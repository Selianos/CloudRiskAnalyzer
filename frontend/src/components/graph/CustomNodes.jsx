import { Handle, Position } from '@xyflow/react';

// 1. Define the Custom Square Node with a Logo
export function CloudServiceNode({ data }) {
  const borderColor = data.isFailed ? '#ef4444' : data.isSafe ? '#10b981' : '#e5e7eb';
  const borderStyle = data.isFailed ? 'dashed' : 'solid';
  const shadow = data.isFailed ? '0 0 15px rgba(239,68,68,0.5)' : data.isSafe ? '0 0 15px rgba(16,185,129,0.3)' : '0 4px 6px rgba(0,0,0,0.05)';
  const textColor = data.isFailed ? '#ef4444' : data.isSafe ? '#10b981' : '#374151';

  return (
    <div style={{ 
      width: '140px', height: '140px', background: 'white', // Increased size to prevent text overflow
      border: `2px ${borderStyle} ${borderColor}`, borderRadius: '8px', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '10px', boxShadow: shadow, position: 'relative', cursor: 'pointer',
      zIndex: 10 // Ensure nodes stay above edges
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: '#555' }} />
      
      {/* Use robust objectFit and size */}
      <img src={data.logoUrl} alt={data.label} style={{ width: '50px', height: '50px', marginBottom: '8px', objectFit: 'contain' }} />
      
      {/* Prevent text overflow */}
      <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', color: textColor, lineHeight: '1.2', wordWrap: 'break-word', width: '100%' }}>
        {data.label}
      </div>
      
      {data.isSafe && <div style={{ position: 'absolute', top: -10, right: -10, background: '#10b981', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✓</div>}
      {data.isFailed && <div style={{ position: 'absolute', top: -10, right: -10, background: '#ef4444', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>!</div>}
      
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#555' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
}

// 2. Define a Custom Group Node for Networks / VPCs / Subnets
export function NetworkGroupNode({ data }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      border: `2px dashed ${data.color || '#9ca3af'}`,
      backgroundColor: data.bgColor || 'rgba(243, 244, 246, 0.4)',
      borderRadius: '8px', position: 'relative',
      pointerEvents: 'none',
      zIndex: -1 // Push network bounding boxes to the very back
    }}>
      <div style={{ 
        position: 'absolute', top: -12, left: 15, background: 'white', 
        padding: '2px 8px', fontWeight: 'bold', fontSize: '13px', color: data.color || '#374151',
        border: `1px solid ${data.color || '#9ca3af'}`, borderRadius: '4px'
      }}>
        {data.label}
      </div>
    </div>
  )
}

export const nodeTypes = { cloudNode: CloudServiceNode, networkGroup: NetworkGroupNode };
