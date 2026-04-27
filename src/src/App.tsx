/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Palette, Check, Settings2, Play, CircleDashed, ArrowUpDown, Box, RefreshCcw, Layers } from 'lucide-react';

const PRESETS = [
  { name: 'Hyper Orange', value: '#ff4e00' },
  { name: 'Abyss Blue', value: '#2663f2' },
  { name: 'Volt Green', value: '#84cc16' },
  { name: 'Minimal White', value: '#f8fafc' },
];

const ANIMATIONS = [
  { id: 'float', name: 'Floating', icon: ArrowUpDown },
  { id: 'spin', name: 'Slow Spin', icon: RefreshCcw },
  { id: 'bounce', name: 'Gentle Bounce', icon: CircleDashed },
  { id: 'none', name: 'Static', icon: Box },
];

const MODELS = [
  { id: 'hightop', name: 'Court High-Top' },
  { id: 'runner', name: 'Aero Runner' }
];

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const sneakerGroupRef = useRef<THREE.Group>(new THREE.Group());
  
  const [activeColor, setActiveColor] = useState(PRESETS[0].value);
  const [activeAnimation, setActiveAnimation] = useState<string>('float');
  const [activeModel, setActiveModel] = useState<string>('hightop');
  
  const animationRef = useRef<string>('float');
  const modelRef = useRef<string>('hightop');

  // Sync state to refs for the Three.js loop
  useEffect(() => {
    animationRef.current = activeAnimation;
  }, [activeAnimation]);

  useEffect(() => {
    modelRef.current = activeModel;
  }, [activeModel]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    // Transparent background to enable atmospheric CSS styling
    scene.fog = new THREE.Fog('#0a0a0a', 15, 40);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(6, 6, 9); // Positioning the camera to look down at the shoe

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // fully transparent
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Add canvas to the DOM
    mountRef.current.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't allow rotating entirely underneath

    // 5. Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x90b0d0, 0.5); // Cool fill light
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 2, 20);
    rimLight.position.set(0, 5, -5);
    rimLight.castShadow = false;
    scene.add(rimLight);

    // 6. Materials
    const upperMaterial = new THREE.MeshPhysicalMaterial({
      color: activeColor,
      roughness: 0.5,
      metalness: 0.1,
      clearcoat: 0.2,
      clearcoatRoughness: 0.4
    });
    materialRef.current = upperMaterial;

    const soleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.5,
    });

    const sneakerGroup = sneakerGroupRef.current;
    sneakerGroup.position.y = 0.5;
    scene.add(sneakerGroup);

    let activeMeshes: THREE.Mesh[] = [];

    const buildModel = (type: string) => {
      // Clear existing
      activeMeshes.forEach(mesh => {
        sneakerGroup.remove(mesh);
        mesh.geometry.dispose();
      });
      activeMeshes = [];

      if (type === 'hightop') {
        // High-Top (Jordan-style)
        const soleGeom = new THREE.BoxGeometry(4.2, 0.5, 1.6);
        const sole = new THREE.Mesh(soleGeom, soleMaterial);
        sole.position.y = -0.65;
        sole.castShadow = true;
        sole.receiveShadow = true;
        activeMeshes.push(sole);

        const bodyGeom = new THREE.BoxGeometry(3.6, 1.2, 1.4);
        const body = new THREE.Mesh(bodyGeom, upperMaterial);
        body.position.set(-0.2, 0.2, 0);
        body.castShadow = true;
        activeMeshes.push(body);

        const toeGeom = new THREE.SphereGeometry(0.75, 32, 16);
        toeGeom.scale(1.2, 0.7, 0.95);
        const toe = new THREE.Mesh(toeGeom, upperMaterial);
        toe.position.set(1.6, 0.05, 0);
        toe.castShadow = true;
        activeMeshes.push(toe);

        const ankleGeom = new THREE.CylinderGeometry(0.7, 0.8, 1.8, 32);
        const ankle = new THREE.Mesh(ankleGeom, upperMaterial);
        ankle.position.set(-1.4, 0.9, 0);
        ankle.rotation.z = -0.05; 
        ankle.castShadow = true;
        activeMeshes.push(ankle);
        
        const collarGeom = new THREE.TorusGeometry(0.7, 0.15, 16, 32);
        const collar = new THREE.Mesh(collarGeom, accentMaterial);
        collar.position.set(-1.4, 1.8, 0);
        collar.rotation.x = Math.PI / 2;
        collar.rotation.y = -0.05;
        collar.castShadow = true;
        activeMeshes.push(collar);

        const lacesGeom = new THREE.BoxGeometry(1.9, 0.2, 0.7);
        const laces = new THREE.Mesh(lacesGeom, accentMaterial);
        laces.position.set(0.3, 0.85, 0);
        laces.rotation.z = 0.3; 
        laces.castShadow = true;
        activeMeshes.push(laces);
        
        // Side swoosh/accent
        const swooshGeom = new THREE.BoxGeometry(2, 0.3, 1.5);
        const swoosh = new THREE.Mesh(swooshGeom, accentMaterial);
        swoosh.position.set(-0.5, 0.3, 0);
        swoosh.rotation.z = 0.2;
        activeMeshes.push(swoosh);

      } else if (type === 'runner') {
        // Low-Top Runner (Ultraboost-style)
        const soleGeom = new THREE.CylinderGeometry(0.8, 0.8, 4.4, 32);
        soleGeom.scale(0.8, 1, 1);
        const sole = new THREE.Mesh(soleGeom, soleMaterial);
        sole.rotation.z = Math.PI / 2;
        sole.position.y = -0.6;
        sole.castShadow = true;
        sole.receiveShadow = true;
        activeMeshes.push(sole);
        
        const heelSoleGeom = new THREE.SphereGeometry(0.9, 32, 16);
        heelSoleGeom.scale(1, 0.7, 0.95);
        const heelSole = new THREE.Mesh(heelSoleGeom, soleMaterial);
        heelSole.position.set(-1.4, -0.5, 0);
        heelSole.castShadow = true;
        activeMeshes.push(heelSole);

        const bodyGeom = new THREE.BoxGeometry(3.2, 0.9, 1.25);
        const body = new THREE.Mesh(bodyGeom, upperMaterial);
        body.position.set(-0.2, 0.1, 0);
        body.castShadow = true;
        activeMeshes.push(body);

        const toeGeom = new THREE.SphereGeometry(0.65, 32, 16);
        toeGeom.scale(1.4, 0.5, 0.95);
        const toe = new THREE.Mesh(toeGeom, upperMaterial);
        toe.position.set(1.5, -0.1, 0);
        toe.castShadow = true;
        activeMeshes.push(toe);

        const ankleGeom = new THREE.CylinderGeometry(0.6, 0.65, 1.0, 32);
        const ankle = new THREE.Mesh(ankleGeom, upperMaterial);
        ankle.position.set(-1.2, 0.5, 0);
        ankle.rotation.z = -0.2; 
        ankle.castShadow = true;
        activeMeshes.push(ankle);

        const cageGeom = new THREE.BoxGeometry(1.2, 1.0, 1.35);
        const cage = new THREE.Mesh(cageGeom, accentMaterial);
        cage.position.set(-0.2, 0.2, 0);
        activeMeshes.push(cage);
      }

      activeMeshes.forEach(mesh => sneakerGroup.add(mesh));
    };

    buildModel('hightop'); // Initial build
    
    // Store buildModel so we can call it on state change
    (mountRef.current as any).buildModel = buildModel;

    // 7. Ground / Shadow Catcher
    const groundGeom = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.ShadowMaterial({ 
      opacity: 0.5 
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.9; // Just below the sole
    ground.receiveShadow = true;
    scene.add(ground);

    // 8. Animation Loop
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Update controls
      controls.update();

      time += 0.01;
      
      const animType = animationRef.current;
      if (animType === 'float') {
        sneakerGroup.position.y = 0.5 + Math.sin(time) * 0.1;
        sneakerGroup.rotation.y = 0;
      } else if (animType === 'spin') {
        sneakerGroup.position.y = 0.5;
        sneakerGroup.rotation.y = time * 0.5;
      } else if (animType === 'bounce') {
        sneakerGroup.position.y = 0.5 + Math.abs(Math.sin(time * 3)) * 0.2;
        sneakerGroup.rotation.y = 0;
      } else {
        sneakerGroup.position.y = 0.5;
        sneakerGroup.rotation.y = 0;
      }

      // Check for model update
      if (modelRef.current !== (sneakerGroup.userData.modelType || '')) {
        buildModel(modelRef.current);
        sneakerGroup.userData.modelType = modelRef.current;
      }

      // Render scene
      renderer.render(scene, camera);
    };
    animate();

    // 9. Handle Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
        delete (mountRef.current as any).buildModel;
      }
      
      // Dispose Three.js objects
      renderer.dispose();
      upperMaterial.dispose();
      soleMaterial.dispose();
      accentMaterial.dispose();
      groundGeom.dispose();
      activeMeshes.forEach(mesh => mesh.geometry.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Watch for color changes from the HTML UI and update the 3D material instantly
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.set(activeColor);
    }
  }, [activeColor]);

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] text-white flex flex-col font-sans select-none sm:overflow-hidden">
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,0),rgba(10,10,10,1))]"></div>
      </div>

      {/* Top Bar / Brand */}
      <div className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-start z-20 pointer-events-none">
        <div>
          <h1 className="text-[10px] tracking-[0.3em] font-bold uppercase opacity-60 mb-1">Research & Design</h1>
          <div className="text-2xl font-light tracking-tighter">SNKR <span className="text-orange-500 font-medium italic">//</span> LAB V.1</div>
        </div>
      </div>

      {/* UI Micro-labels */}
      <div className="hidden sm:flex absolute bottom-6 left-6 md:bottom-8 md:left-8 flex-col gap-3 z-20 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
          <span className="text-[9px] uppercase tracking-[0.2em] opacity-40">Renderer: Three.js WebGL</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-[9px] uppercase tracking-[0.2em] opacity-40">Model: Conceptual Prototype</span>
        </div>
      </div>

      {/* 3D Canvas Mount Point */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 cursor-move z-10" 
      />

      {/* HTML Overlay (Glassmorphism Configurator) */}
      <div 
        className="absolute right-0 top-0 h-full w-full sm:w-[380px] bg-white/[0.03] backdrop-blur-[40px] border-l border-white/10 p-6 sm:p-8 flex flex-col z-30 pointer-events-none transition-all"
      >
        <div 
          className="pointer-events-auto h-full flex flex-col pt-24 sm:pt-4"
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/20 text-orange-500 rounded-lg">
                <Settings2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Configuration Mode</span>
            </div>
            <h2 className="text-3xl font-light mb-2">HyperGlide <span className="font-medium">X</span></h2>
            <p className="text-sm text-white/50 leading-relaxed">Adjust material properties, model silhouette, and color mapping.</p>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto pr-2 pb-4 scrollbar-hide">
            
            {/* Silhouette Selector */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/60 flex items-center gap-2 mb-4">
                <Layers className="w-3 h-3" /> Silhouette Base
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {MODELS.map((model) => {
                  const isActive = activeModel === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => setActiveModel(model.id)}
                      className={`relative flex items-center justify-center p-4 rounded-xl border transition-all duration-300 text-center
                        ${isActive 
                          ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                          : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/10'
                        }
                      `}
                    >
                      <span className="text-[11px] uppercase tracking-widest font-medium">{model.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="text-[10px] uppercase tracking-widest text-white/60 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Base Material Color
                </label>
                <span className="text-[10px] font-mono opacity-40">{activeColor}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map((preset) => {
                  const isActive = activeColor === preset.value;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => setActiveColor(preset.value)}
                      className={`relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 text-left
                        ${isActive 
                          ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                          : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-inner border border-black/20"
                          style={{ backgroundColor: preset.value }}
                        />
                        <span className="text-[11px] uppercase tracking-widest font-medium">{preset.name}</span>
                      </div>
                      
                      {isActive && (
                        <Check className="w-3 h-3 text-orange-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/60 block mb-3">
                Custom Shade
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-inner border border-white/20">
                    <input
                      type="color"
                      value={activeColor}
                      onChange={(e) => setActiveColor(e.target.value)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] cursor-pointer bg-transparent border-0 p-0 outline-none"
                    />
                  </div>
                  <span className="text-xs uppercase tracking-widest text-white/80">Hex Value</span>
                </div>
                <span className="text-[11px] font-mono opacity-50">{activeColor.toUpperCase()}</span>
              </label>
            </div>

            {/* Animation Picker */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/60 flex items-center gap-2 mb-3">
                <Play className="w-3 h-3" /> Presentation Mode
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {ANIMATIONS.map((anim) => {
                  const isActive = activeAnimation === anim.id;
                  const Icon = anim.icon;
                  return (
                    <button
                      key={anim.id}
                      onClick={() => setActiveAnimation(anim.id)}
                      className={`relative flex items-center gap-2 p-3 rounded-xl border transition-all duration-300 text-left
                        ${isActive 
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                          : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/10'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-500' : 'opacity-70'}`} />
                      <span className="text-[11px] uppercase tracking-widest font-medium">{anim.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-white/10 shrink-0">
             <div className="flex justify-between items-center mb-6">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Est. Process</div>
                <div className="text-sm font-light tracking-widest text-orange-500">REALTIME</div>
             </div>
             <p className="text-[10px] uppercase tracking-widest text-white/30 text-center leading-relaxed">
               Click and drag background to rotate.<br/>Scroll to zoom.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
}

