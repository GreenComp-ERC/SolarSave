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

// --- Solar Panel Model Beautification ---
const SolarPanelModel = ({ intensity }) => {
  const panelRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (panelRef.current) {
      panelRef.current.position.y = Math.sin(t * 1.5) * 0.03;
      // Smooth tracking simulation
      panelRef.current.rotation.x = Math.PI / 6 + (intensity - 0.5) * 0.15;
    }
  });

  return (
    <group ref={panelRef} position={[0, 0, 0]}>
      {/* Ground Pedestal / Base Plate */}
      <Cylinder args={[0.3, 0.4, 0.05, 32]} position={[0, -1.15, 0]}>
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.7} />
      </Cylinder>
      
      {/* Main Support Pole */}
      <Cylinder args={[0.06, 0.1, 1.2, 32]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </Cylinder>

      {/* Hydraulic / Rotation Joint */}
      <RoundedBox args={[0.3, 0.2, 0.2]} radius={0.05} position={[0, -0.05, -0.05]}>
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
      </RoundedBox>
      <Cylinder args={[0.04, 0.04, 0.4]} rotation={[0, 0, Math.PI / 2]} position={[0, -0.05, -0.05]}>
        <meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.1} />
      </Cylinder>
      
      {/* Solar Panel Array */}
      <group rotation={[Math.PI / 6, 0, 0]}>
        {/* Aluminum Outer Frame */}
        <RoundedBox args={[2.2, 0.08, 3.2]} radius={0.02}>
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </RoundedBox>

        {/* Backplate */}
        <RoundedBox args={[2.1, 0.09, 3.1]} radius={0.01} position={[0, -0.01, 0]}>
          <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.8} />
        </RoundedBox>

        {/* Photovoltaic Glass Panel */}
        <RoundedBox args={[2.05, 0.05, 3.05]} position={[0, 0.03, 0]} radius={0.005}>
          <meshPhysicalMaterial 
            color="#082f49" 
            emissive="#0284c7"
            emissiveIntensity={intensity * 0.15}
            metalness={0.9} 
            roughness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={2.5}
          />
        </RoundedBox>

        {/* Photovoltaic Grid Network (Using dense segments for cell illusion) */}
        <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.0, 3.0, 12, 18]} />
          <meshBasicMaterial 
            color="#38bdf8" 
            wireframe 
            transparent 
            opacity={0.1 + intensity * 0.3} 
          />
        </mesh>
      </group>
    </group>
  );
};

// --- Factory Model Beautification ---
const FactoryModel = ({ intensity }) => {
  const factoryRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (factoryRef.current) {
      factoryRef.current.position.y = Math.sin(t * 1) * 0.015;
    }
  });

  return (
    <group ref={factoryRef} position={[0, -0.5, 0]}>
      {/* Foundation Base */}
      <RoundedBox args={[3.8, 0.1, 2.8]} position={[0, 0.05, 0]} radius={0.02}>
        <meshStandardMaterial color="#334155" metalness={0.2} roughness={0.8} />
      </RoundedBox>

      {/* Main Building Structure */}
      <RoundedBox args={[3.4, 1.2, 2.4]} position={[0, 0.7, 0]} radius={0.05}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.1} roughness={0.9} />
      </RoundedBox>

      {/* Decorative Accent Stripe */}
      <mesh position={[0, 0.7, 1.21]}>
        <planeGeometry args={[3.4, 0.1]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Industrial Windows (Glowing based on activity) */}
      {[-1, 0, 1].map((x, i) => (
        <mesh key={i} position={[x, 0.6, 1.21]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshPhysicalMaterial 
            color="#e0f2fe" 
            emissive="#bae6fd"
            emissiveIntensity={intensity > 0.1 ? 0.8 : 0.2}
            metalness={0.9}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>
      ))}

      {/* Industrial Sawtooth Roof (Classic Factory Look) */}
      <group position={[0, 1.3, 0]}>
        {[-1, 0, 1].map((x, i) => (
          <mesh key={`roof-${i}`} position={[x, 0.25, 0]} rotation={[0, 0, 0]}>
            {/* Triangular prism using cylinder geometry */}
            <cylinderGeometry args={[0.6, 0.6, 2.4, 3]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.6} />
          </mesh>
        ))}
        {/* Glass panes on sawtooth roof */}
        {[-1.15, -0.15, 0.85].map((x, i) => (
          <mesh key={`glass-${i}`} position={[x, 0.38, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <planeGeometry args={[0.65, 2.3]} />
            <meshPhysicalMaterial 
              color="#0f172a" 
              metalness={0.9} 
              roughness={0.1} 
              envMapIntensity={2} 
            />
          </mesh>
        ))}
      </group>

      {/* Chimney Stack */}
      <group position={[-1.2, 1.3, -0.7]}>
        <Cylinder args={[0.15, 0.2, 1.4, 32]} position={[0, 0.7, 0]}>
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.5} />
        </Cylinder>
        <Cylinder args={[0.2, 0.2, 0.1, 32]} position={[0, 1.35, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </Cylinder>
        
        {/* Dynamic Energy Orbs (Replaces generic sphere with layered tech look) */}
        <Sphere args={[0.25, 32, 32]} position={[0, 1.8, 0]}>
          <meshStandardMaterial 
            color="#34d399" 
            emissive="#10b981"
            emissiveIntensity={1.5 + intensity}
            transparent 
            opacity={0.8} 
          />
        </Sphere>
        <Sphere args={[0.4, 16, 16]} position={[0, 1.8, 0]}>
          <meshBasicMaterial 
            color="#6ee7b7" 
            wireframe 
            transparent 
            opacity={0.3} 
          />
        </Sphere>
      </group>
    </group>
  );
};

// --- Scene & Lighting Optimization ---
const Scene = ({ isFactory, currentHour, onIntensityChange }) => {
  const isDay = currentHour >= 6 && currentHour <= 18;
  const hourCycle = (currentHour - 6) / 12;
  const angle = Math.PI * hourCycle;
  
  const sunPosition = useMemo(() => {
    if (isDay) {
      // Adjusted path to avoid dead-center glaring white-outs
      return [ -Math.cos(angle) * 20, Math.sin(angle) * 15, 10 ];
    }
    return [ 0, -10, 0 ];
  }, [currentHour, isDay, angle]);

  const intensity = isDay ? Math.sin(angle) : 0;

  useEffect(() => {
    onIntensityChange(intensity);
  }, [intensity, onIntensityChange]);

  return (
    <>
      {/* Refined Skybox: Adjusted turbidity and rayleigh to ensure a rich blue sky, preventing pure white backgrounds */}
      <Sky 
        sunPosition={sunPosition} 
        turbidity={0.65} 
        rayleigh={1.2} 
        mieCoefficient={0.01} 
        mieDirectionalG={0.8} 
      />
      
      {!isDay && <Stars radius={50} depth={50} count={1500} factor={4} saturation={1} fade speed={1.5} />}
      
      {/* Environment lighting tuned for better material reflections */}
      <Environment preset="city" background={false} />
      <ambientLight intensity={isDay ? 0.3 : 0.05} />
      
      <directionalLight 
        position={sunPosition} 
        intensity={isDay ? intensity * 2.5 : 0.1} 
        color={isDay ? "#fffbeb" : "#1e293b"} // Warm sunlight vs Cool moonlight
        castShadow 
      />

      {/* Global Stage/Ground to anchor the floating objects */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4, 64]} />
        <meshStandardMaterial 
          color={isDay ? "#e2e8f0" : "#0f172a"} 
          roughness={0.8} 
          metalness={0.1} 
        />
      </mesh>

      <OrbitControls 
        enableZoom={false} 
        autoRotate 
        autoRotateSpeed={0.4} 
        maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera from going completely under the floor
        minPolarAngle={Math.PI / 4} 
        enablePan={false}
      />
      
      {isFactory ? <FactoryModel intensity={intensity} /> : <SolarPanelModel intensity={intensity} />}
      
      {/* Refined Contact Shadows */}
      <ContactShadows 
        position={[0, -1.19, 0]} 
        opacity={0.8} 
        scale={12} 
        blur={2.5} 
        far={4} 
        color="#000000"
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
    const noise = (Math.random() - 0.5) * 80; 
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
          <Canvas camera={{ position: [0, 2, 8.5], fov: 42 }}>
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