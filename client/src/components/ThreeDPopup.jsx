import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Sky, 
  Stars, 
  ContactShadows, 
  RoundedBox,
  Cylinder,
  Sphere,
  Cone
} from '@react-three/drei';

// --- 太阳能板模型优化 ---
const SolarPanelModel = ({ intensity }) => {
  const panelRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (panelRef.current) {
      panelRef.current.position.y = Math.sin(t * 1.5) * 0.03;
      panelRef.current.rotation.x = Math.PI / 6 + (intensity - 0.5) * 0.15;
    }
  });

  return (
    <group ref={panelRef} position={[0, 0, 0]}>
      {/* 支架底座 */}
      <Cylinder args={[0.08, 0.12, 1.2, 32]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#8892b0" metalness={0.9} roughness={0.2} />
      </Cylinder>
      {/* 连接件 */}
      <RoundedBox args={[0.25, 0.25, 0.25]} radius={0.05} position={[0, 0, -0.1]}>
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.4} />
      </RoundedBox>
      
      {/* 太阳能板主体 */}
      <group rotation={[Math.PI / 6, 0, 0]}>
        {/* 背板 */}
        <RoundedBox args={[2.1, 0.1, 3.1]} radius={0.02}>
          <meshStandardMaterial color="#ccd6f6" metalness={0.5} roughness={0.8} />
        </RoundedBox>
        {/* 光伏玻璃面板 */}
        <RoundedBox args={[2, 0.05, 3]} position={[0, 0.04, 0]} radius={0.01}>
          <meshStandardMaterial 
            color="#0a192f" 
            emissive="#1d4ed8"
            emissiveIntensity={intensity * 0.3}
            metalness={1} 
            roughness={0.05} // 极低粗糙度带来玻璃质感
            envMapIntensity={2} // 增强环境反射
          />
        </RoundedBox>
        {/* 栅线网络 (简化为半透明发光条) */}
        <mesh position={[0, 0.07, 0]}>
          <planeGeometry args={[1.9, 2.9]} />
          <meshBasicMaterial 
            color="#64ffda" 
            wireframe 
            transparent 
            opacity={0.15 + intensity * 0.2} 
          />
        </mesh>
      </group>
    </group>
  );
};

// --- 工厂模型优化 ---
const FactoryModel = ({ intensity }) => {
  const factoryRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (factoryRef.current) {
      factoryRef.current.position.y = Math.sin(t * 1) * 0.02;
    }
  });

  return (
    <group ref={factoryRef} position={[0, -0.5, 0]}>
      {/* 厂房主体 */}
      <RoundedBox args={[3.2, 1.2, 2.2]} position={[0, 0.6, 0]} radius={0.1}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.1} roughness={0.9} />
      </RoundedBox>
      {/* 屋顶 */}
      <group position={[0, 1.45, 0]}>
        <Cone args={[1.1, 0.6, 4]} rotation={[0, Math.PI / 4, 0]} position={[-0.9, 0, 0]}>
          <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.6} />
        </Cone>
        <Cone args={[1.1, 0.6, 4]} rotation={[0, Math.PI / 4, 0]} position={[0.9, 0, 0]}>
          <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.6} />
        </Cone>
      </group>
      {/* 烟囱 */}
      <Cylinder args={[0.2, 0.25, 1.8, 32]} position={[-1.2, 1.4, -0.6]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
      </Cylinder>
      {/* 动态能量球 (替代烟雾) */}
      <Sphere args={[0.35, 32, 32]} position={[-1.2, 2.6, -0.6]}>
        <meshStandardMaterial 
          color="#64ffda" 
          emissive="#64ffda"
          emissiveIntensity={intensity * 2}
          transparent 
          opacity={0.6} 
          wireframe={intensity > 0.5}
        />
      </Sphere>
    </group>
  );
};

// --- 场景与环境光影优化 ---
const Scene = ({ isFactory, currentHour, onIntensityChange }) => {
  // 声明式地计算太阳位置，避免在 useFrame 中手动操作 ref 属性
  const isDay = currentHour >= 6 && currentHour <= 18;
  const hourCycle = (currentHour - 6) / 12;
  const angle = Math.PI * hourCycle;
  
  const sunPosition = useMemo(() => {
    if (isDay) {
      return [ -Math.cos(angle) * 15, Math.sin(angle) * 15, 8 ];
    }
    return [ 0, -10, 0 ]; // 夜晚太阳在地平线以下
  }, [currentHour, isDay, angle]);

  const intensity = isDay ? Math.sin(angle) : 0;

  useEffect(() => {
    onIntensityChange(intensity);
  }, [intensity, onIntensityChange]);

  return (
    <>
      {/* 物理级天空盒：自动根据 sunPosition 渲染日出、正午、日落 */}
      <Sky sunPosition={sunPosition} turbidity={0.3} rayleigh={0.5} />
      
      {/* 夜晚星空 */}
      {!isDay && <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />}
      
      {/* 环境光反射 (为金属和玻璃提供真实的反射源) */}
      <Environment preset="city" />
      <ambientLight intensity={isDay ? 0.4 : 0.1} />
      
      <directionalLight 
        position={sunPosition} 
        intensity={isDay ? intensity * 2 : 0.2} 
        color={isDay ? "#ffffff" : "#4a5568"}
        castShadow 
      />

      <OrbitControls 
        enableZoom={false} 
        autoRotate 
        autoRotateSpeed={0.5} 
        maxPolarAngle={Math.PI / 2 + 0.1} // 允许稍微看到一点地平线以下
        minPolarAngle={Math.PI / 4} 
        enablePan={false}
      />
      
      {isFactory ? <FactoryModel intensity={intensity} /> : <SolarPanelModel intensity={intensity} />}
      
      {/* 高级接触阴影：比生硬的 Plane + castShadow 效果好得多 */}
      <ContactShadows 
        position={[0, -0.5, 0]} 
        opacity={0.7} 
        scale={10} 
        blur={2} 
        far={4} 
      />
    </>
  );
};

const ThreeDPopup = ({ isOpen, onClose, data, type, mapView }) => {
  const [currentHour, setCurrentHour] = useState(12);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [simulatedTime, setSimulatedTime] = useState(12 * 60);

  useEffect(() => {
    if (!isOpen) return;
    
    // 减缓时间流逝速度，让视觉变化更平滑
    const interval = setInterval(() => {
      setSimulatedTime(prev => {
        const next = (prev + 2) % (24 * 60);
        setCurrentHour(next / 60);
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const isFactory = type === 'factory';
  let baseValue = isFactory ? data.powerConsumption : (data.dcPower || 15000);
  
  if (!isFactory) {
    const noise = (Math.random() - 0.5) * 100; // 减弱噪点幅度，避免数值闪烁感过强
    baseValue = Math.max(0, (baseValue * lightIntensity) + (lightIntensity > 0 ? noise : 0));
  } else {
    const noise = (Math.random() - 0.5) * (data.powerConsumption * 0.02);
    baseValue = baseValue + noise;
  }

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const ownerText = data.owner
    ? `${data.owner.substring(0, 6)}...${data.owner.substring(data.owner.length - 4)}`
    : 'Unknown';

  const nodePosition = useMemo(() => {
    if (!data) return null;

    if (type === 'factory') {
      return {
        lat: Number(data.latitude),
        lng: Number(data.longitude),
      };
    }

    let lat = Number(data.lat);
    let lng = Number(data.lng);
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      lat /= 10000;
      lng /= 10000;
    }

    return { lat, lng };
  }, [data, type]);

  const mapLink = useMemo(() => {
    if (!mapView || !mapView.center || !mapView.bounds || !nodePosition) {
      return {
        inView: false,
        distanceKm: null,
        zoom: null,
      };
    }

    const inView =
      nodePosition.lat <= mapView.bounds.north &&
      nodePosition.lat >= mapView.bounds.south &&
      nodePosition.lng <= mapView.bounds.east &&
      nodePosition.lng >= mapView.bounds.west;

    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(nodePosition.lat - mapView.center.lat);
    const dLng = toRad(nodePosition.lng - mapView.center.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(mapView.center.lat)) *
        Math.cos(toRad(nodePosition.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    return {
      inView,
      distanceKm,
      zoom: mapView.zoom,
    };
  }, [mapView, nodePosition]);

  return (
    <div className="threed-popup-overlay" onClick={onClose} role="presentation">
      <div
        className={`threed-popup-container ${isFactory ? 'factory' : 'panel'}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isFactory ? 'Industrial facility details' : 'Solar array details'}
      >
        <button className="threed-close-btn" onClick={onClose} aria-label="Close 3D details popup">
          &times;
        </button>

        <div className="threed-header">
          <h2>{isFactory ? 'Industrial Facility' : 'Smart Solar Array'}</h2>
          <div className="threed-id">Node ID: {data.id}</div>
          <div className={`threed-map-link ${mapLink.inView ? 'active' : 'inactive'}`}>
            <span className="threed-map-pill">{mapLink.inView ? 'In Viewport' : 'Out of View'}</span>
            <span className="threed-map-meta">
              {mapLink.distanceKm !== null ? `Center ${mapLink.distanceKm.toFixed(2)} km` : 'Map syncing...'}
            </span>
            <span className="threed-map-meta">
              {nodePosition ? `${nodePosition.lat.toFixed(4)}, ${nodePosition.lng.toFixed(4)}` : 'No coordinates'}
            </span>
            <span className="threed-map-meta">Zoom {mapLink.zoom ?? '--'}</span>
          </div>
        </div>

        <div className="threed-canvas-container">
          <Canvas camera={{ position: [0, 2, 7], fov: 40 }}>
            <Scene 
              isFactory={isFactory} 
              currentHour={currentHour} 
              onIntensityChange={setLightIntensity} 
            />
          </Canvas>
          <div className="time-indicator">
            {currentHour >= 6 && currentHour <= 18 ? '☀️' : '🌙'} {formatTime(simulatedTime)}
          </div>
        </div>

        <div className="threed-stats">
          <div className="threed-stat-item">
            <div className="threed-stat-label">OWNER</div>
            <div className="threed-stat-value owner">{ownerText}</div>
          </div>

          <div className={`threed-stat-item highlight ${!isFactory ? 'generation' : 'consumption'}`}>
            <div className="threed-stat-label">
              {isFactory ? 'POWER DRAW' : 'LIVE OUTPUT'}
            </div>
            <div className="threed-stat-value">
              ⚡ {(baseValue / 1000).toFixed(2)} kW
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDPopup;