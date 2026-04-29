import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Palette, Check, Settings2, Play, CircleDashed, ArrowUpDown, Box, RefreshCcw, Layers, Loader2 } from 'lucide-react';

const PRESETS = [
  { name: 'Hyper Orange', value: '#ff4e00' },
  { name: 'Abyss Blue', value: '#2663f2' },
  { name: 'Volt Green', value: '#84cc16' },
  { name: 'Minimal White', value: '#f8fafc' },
];

const SOLE_PRESETS = [
  { name: 'Pure White', value: '#ffffff' },
  { name: 'Onyx Black', value: '#111111' },
  { name: 'Classic Gum', value: '#d2a679' },
  { name: 'Volt Green', value: '#84cc16' },
];

const ANIMATIONS = [
  { id: 'float', name: 'Floating', icon: ArrowUpDown },
  { id: 'spin', name: 'Slow Spin', icon: RefreshCcw },
  { id: 'bounce', name: 'Gentle Bounce', icon: CircleDashed },
  { id: 'none', name: 'Static', icon: Box },
];

const MODELS = [
  { id: 'khronos', name: 'Street Skater' },
  { id: 'hightop', name: 'Court High-Top' },
  { id: 'runner', name: 'Aero Runner' }
];

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const soleMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const sneakerGroupRef = useRef<THREE.Group>(new THREE.Group());
  
  // Refs for external GLTF materials so we can color them
  const gltfMaterialsRef = useRef<{ upper: THREE.Material[], sole: THREE.Material[] }>({ upper: [], sole: [] });
  
  const [activeColor, setActiveColor] = useState(PRESETS[0].value);
  const [activeSoleColor, setActiveSoleColor] = useState(SOLE_PRESETS[0].value);
  const [activeAnimation, setActiveAnimation] = useState<string>('float');
  const [activeModel, setActiveModel] = useState<string>('khronos');
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  
  const animationRef = useRef<string>('float');
  const modelRef = useRef<string>('khronos');
  const isLoadingRef = useRef<boolean>(true);

  // Sync state to refs for the Three.js loop
  useEffect(() => {
    animationRef.current = activeAnimation;
  }, [activeAnimation]);

  useEffect(() => {
    modelRef.current = activeModel;
  }, [activeModel]);
  
  useEffect(() => {
    isLoadingRef.current = isLoadingModel;
  }, [isLoadingModel]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#0a0a0a', 15, 40);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(6, 6, 9); 

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); 
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
    controls.maxPolarAngle = Math.PI / 2 + 0.1; 

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

    const fillLight = new THREE.DirectionalLight(0x90b0d0, 0.5); 
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
      color: activeSoleColor,
      roughness: 0.8,
    });
    soleMaterialRef.current = soleMaterial;

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.4
    });

    const sneakerGroup = sneakerGroupRef.current;
    sneakerGroup.position.y = 0.5;
    scene.add(sneakerGroup);

    let activeMeshes: (THREE.Mesh | THREE.Group)[] = [];
    const gltfLoader = new GLTFLoader();

    const buildModel = (type: string) => {
      setIsLoadingModel(true);
      
      // Clear existing
      activeMeshes.forEach(mesh => {
        sneakerGroup.remove(mesh);
        if ((mesh as THREE.Mesh).geometry) {
           (mesh as THREE.Mesh).geometry.dispose();
        }
      });
      activeMeshes = [];
      gltfMaterialsRef.current = { upper: [], sole: [] };

      let shoeUrl = '';
      if (type === 'khronos') {
        shoeUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb';
      } else if (type === 'hightop') {
        shoeUrl = 'https://raw.githubusercontent.com/vipcodestudio/3d-shoes-configurator/main/public/model/nike_air_jordan.glb';
      } else if (type === 'runner') {
        shoeUrl = 'https://raw.githubusercontent.com/qHomeee/DjangoProject/main/static/sneakers/models/adidas_silver_runner/79PIO0PIR42TTW6LL0LPQM1WT.glb';
      }

      gltfLoader.load(shoeUrl, (gltf) => {
        if (modelRef.current !== type) return; // Stale load

        const model = gltf.scene;
        
        // Auto-scale and center the model
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 6.0; // Desired visual length size
        const scaleToFit = targetSize / maxDim;
        model.scale.set(scaleToFit, scaleToFit, scaleToFit);
        
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // Adjust for different models' default orientations
        if (type === 'khronos') {
          model.position.set(-center.x * scaleToFit, - (box.min.y * scaleToFit) - 0.5, -center.z * scaleToFit);
          model.rotation.y = Math.PI / 4;
        } else if (type === 'hightop') {
          model.position.set(-center.x * scaleToFit, - (box.min.y * scaleToFit) - 0.5, -center.z * scaleToFit);
          model.rotation.y = -Math.PI / 2;
        } else if (type === 'runner') {
          // The runner model might be rotated structurally, let's normalize
          model.position.set(-center.x * scaleToFit, - (box.min.y * scaleToFit) - 0.5, -center.z * scaleToFit);
          model.rotation.y = Math.PI / 4;
        }
        
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Clone material so different meshes don't share the same reference if they shouldn't
            if (mesh.material) {
              mesh.material = (mesh.material as THREE.Material).clone();
            }

            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat) {
              // Reset texture maps to allow our solid color to show purely
              mat.map = null;
              mat.emissiveMap = null;
              mat.needsUpdate = true;

              const matName = mat.name ? mat.name.toLowerCase() : '';
              const meshName = mesh.name ? mesh.name.toLowerCase() : '';
              const nodeName = mesh.userData.name ? mesh.userData.name.toLowerCase() : '';
              const combinedName = matName + meshName + nodeName;
              
              const isSole = combinedName.includes('sole') || combinedName.includes('bottom') || combinedName.includes('001') || combinedName.includes('midsole') || combinedName.includes('outsole') || combinedName.includes('nike'); 
              const isLaceOrInner = combinedName.includes('lace') || combinedName.includes('inner') || combinedName.includes('tongue');
              
              if (type === 'runner') {
                if (mesh.id % 2 === 0) { // Fallback heuristics for runner if combinedNames are unhelpful
                   gltfMaterialsRef.current.sole.push(mat);
                } else {
                   gltfMaterialsRef.current.upper.push(mat);
                }
              } else if (type === 'hightop') {
                if (combinedName.includes('010') || combinedName.includes('002') || combinedName.includes('sole')) {
                   gltfMaterialsRef.current.sole.push(mat);
                } else if (!combinedName.includes('006') && !combinedName.includes('007')) {
                   gltfMaterialsRef.current.upper.push(mat);
                }
              } else {
                if (isSole) {
                   gltfMaterialsRef.current.sole.push(mat);
                } else if (!isLaceOrInner) {
                   gltfMaterialsRef.current.upper.push(mat);
                }
              }
            }
          }
        });
        
        gltfMaterialsRef.current.upper.forEach(m => {
          if ('color' in m) {
            // Apply current color from global state (not closure state) via refs
            (m as THREE.MeshStandardMaterial).color.set(typeof window !== 'undefined' ? (document.getElementById('active-color-ref') as HTMLInputElement)?.value || '#2663F2' : '#2663F2');
            // reset metalness/roughness for procedural look on downloaded assets
            (m as THREE.MeshStandardMaterial).roughness = 0.6;
            (m as THREE.MeshStandardMaterial).metalness = 0.1;
          }
        });
        gltfMaterialsRef.current.sole.forEach(m => {
          if ('color' in m) {
            (m as THREE.MeshStandardMaterial).color.set(typeof window !== 'undefined' ? (document.getElementById('active-sole-color-ref') as HTMLInputElement)?.value || '#FFFFFF' : '#FFFFFF');
            (m as THREE.MeshStandardMaterial).roughness = 0.9;
            (m as THREE.MeshStandardMaterial).metalness = 0.0;
          }
        });

        sneakerGroup.add(model);
        activeMeshes.push(model);
        setIsLoadingModel(false);
        
      }, undefined, (error) => {
        console.error("Error loading GLTF shoe:", error);
        setIsLoadingModel(false); 
      });
    };

    buildModel('khronos'); // Initial build
    
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
      } else if (animType === 'spin') {
        sneakerGroup.position.y = 0.5;
        sneakerGroup.rotation.y = time * 0.5;
      } else if (animType === 'bounce') {
        sneakerGroup.position.y = 0.5 + Math.abs(Math.sin(time * 3)) * 0.2;
      } else {
        sneakerGroup.position.y = 0.5;
      }

      // Restore Y-rotation if not 'spin' so you can use controls properly
      if (animType !== 'spin' && sneakerGroup.rotation.y !== 0) {
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
      activeMeshes.forEach(mesh => {
         if ((mesh as THREE.Mesh).geometry) {
            (mesh as THREE.Mesh).geometry.dispose();
         }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Watch for color changes from the HTML UI and update the 3D material instantly
  useEffect(() => {
    // Procedural references
    if (materialRef.current) {
      materialRef.current.color.set(activeColor);
    }
    // GLTF references
    if (gltfMaterialsRef.current.upper.length > 0) {
      gltfMaterialsRef.current.upper.forEach(m => {
        if ('color' in m) (m as THREE.MeshStandardMaterial).color.set(activeColor);
      });
    }
  }, [activeColor]);

  useEffect(() => {
    // Procedural references
    if (soleMaterialRef.current) {
      soleMaterialRef.current.color.set(activeSoleColor);
    }
    // GLTF references
    if (gltfMaterialsRef.current.sole.length > 0) {
      gltfMaterialsRef.current.sole.forEach(m => {
        if ('color' in m) (m as THREE.MeshStandardMaterial).color.set(activeSoleColor);
      });
    }
  }, [activeSoleColor]);

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] text-white flex flex-col font-sans select-none sm:overflow-hidden">
      <input type="hidden" id="active-color-ref" value={activeColor} />
      <input type="hidden" id="active-sole-color-ref" value={activeSoleColor} />
      
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
          <span className="text-[9px] uppercase tracking-[0.2em] opacity-40">Model: GLTF Mesh</span>
        </div>
      </div>

      {/* 3D Canvas Mount Point */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 cursor-move z-10" 
      />

      {/* Loading Overlay */}
      {isLoadingModel && (
         <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="flex flex-col items-center gap-4 text-orange-500">
               <Loader2 className="w-12 h-12 animate-spin" />
               <span className="text-xs uppercase tracking-widest font-medium text-white/80">Fetching 3D Asset...</span>
            </div>
         </div>
      )}

      {/* HTML Overlay (Glassmorphism Configurator) */}
      <div 
        className="absolute right-0 top-0 h-full w-full sm:w-[400px] bg-white/[0.03] backdrop-blur-[40px] border-l border-white/10 p-6 sm:p-8 flex flex-col z-30 pointer-events-none transition-all"
      >
        <div 
          className="pointer-events-auto h-full flex flex-col pt-24 sm:pt-4"
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODELS.map((model) => {
                  const isActive = activeModel === model.id;
                  let colSpan = 'col-span-1';
                  // Let Khronos span full width if you want, or just let it stack nicely
                  if (MODELS.length % 2 !== 0 && model.id === 'khronos') colSpan = 'sm:col-span-2';

                  return (
                    <button
                      key={model.id}
                      onClick={() => setActiveModel(model.id)}
                      className={`relative flex items-center justify-center p-4 rounded-xl border transition-all duration-300 text-center ${colSpan}
                        ${isActive 
                          ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                          : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/10'
                        }
                      `}
                    >
                      <span className={`text-[10px] uppercase tracking-widest ${isActive ? 'font-bold' : 'font-medium'}`}>{model.name}</span>
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
              
              <div className="grid grid-cols-2 gap-3 mb-4">
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
                        <span className="text-[10px] uppercase tracking-widest font-medium">{preset.name}</span>
                      </div>
                      
                      {isActive && (
                        <Check className="w-3 h-3 text-orange-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Picker */}
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
                  <span className="text-xs uppercase tracking-widest text-white/80">Custom Base</span>
                </div>
                <span className="text-[11px] font-mono opacity-50">{activeColor.toUpperCase()}</span>
              </label>
            </div>

            {/* Sole Color Presets */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="text-[10px] uppercase tracking-widest text-white/60 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Sole Material Color
                </label>
                <span className="text-[10px] font-mono opacity-40">{activeSoleColor}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {SOLE_PRESETS.map((preset) => {
                  const isActive = activeSoleColor === preset.value;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => setActiveSoleColor(preset.value)}
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
                        <span className="text-[10px] uppercase tracking-widest font-medium">{preset.name}</span>
                      </div>
                      
                      {isActive && (
                        <Check className="w-3 h-3 text-orange-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sole Custom Color Picker */}
              <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-inner border border-white/20">
                    <input
                      type="color"
                      value={activeSoleColor}
                      onChange={(e) => setActiveSoleColor(e.target.value)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] cursor-pointer bg-transparent border-0 p-0 outline-none"
                    />
                  </div>
                  <span className="text-xs uppercase tracking-widest text-white/80">Custom Sole</span>
                </div>
                <span className="text-[11px] font-mono opacity-50">{activeSoleColor.toUpperCase()}</span>
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
                      <span className="text-[10px] uppercase tracking-widest font-medium">{anim.name}</span>
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
