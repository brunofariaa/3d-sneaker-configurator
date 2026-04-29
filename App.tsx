import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Palette, Check, Settings2, Play, CircleDashed, ArrowUpDown, Box, RefreshCcw, Layers, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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
];

const MODELS = [
  { id: 'khronos', name: 'Street Skater' },
  { id: 'hightop', name: 'Court High-Top' },
  { id: 'runner', name: 'Aero Runner' }
];

const FEATURES = [
  { id: 'model', title: 'Shoe Model' },
  { id: 'baseColor', title: 'Base Material' },
  { id: 'soleColor', title: 'Sole Material' },
  { id: 'laceColor', title: 'Laces Color' },
  { id: 'innerColor', title: 'Inner/Tongue Color' },
  { id: 'accentColor', title: 'Accents & Details' },
  { id: 'animation', title: 'Presentation Mode' }
];

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const soleMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const sneakerGroupRef = useRef<THREE.Group>(new THREE.Group());
  
  // Refs for external GLTF materials so we can color them
  const gltfMaterialsRef = useRef<{ 
    upper: THREE.Material[], 
    sole: THREE.Material[],
    lace: THREE.Material[],
    inner: THREE.Material[],
    accent: THREE.Material[]
  }>({ upper: [], sole: [], lace: [], inner: [], accent: [] });
  
  const [activeColor, setActiveColor] = useState(PRESETS[0].value);
  const [activeSoleColor, setActiveSoleColor] = useState(SOLE_PRESETS[0].value);
  const [activeLaceColor, setActiveLaceColor] = useState('#111111');
  const [activeInnerColor, setActiveInnerColor] = useState('#222222');
  const [activeAccentColor, setActiveAccentColor] = useState('#ff0000');
  const [activeAnimation, setActiveAnimation] = useState<string>('float');
  const [activeModel, setActiveModel] = useState<string>('khronos');
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  
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
      gltfMaterialsRef.current = { upper: [], sole: [], lace: [], inner: [], accent: [] };

      let shoeUrl = '';
      if (type === 'khronos') {
        shoeUrl = 'https://raw.githubusercontent.com/hardikverma22/shoe-forge/master/public/shoe.gltf';
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
              if (Array.isArray(mesh.material)) {
                mesh.material = mesh.material.map(m => m.clone());
              } else {
                mesh.material = (mesh.material as THREE.Material).clone();
              }
            }

            const processMaterial = (mat: THREE.MeshStandardMaterial) => {
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
                const isLace = combinedName.includes('lace') || combinedName.includes('shoelace');
                const isInner = combinedName.includes('inner') || combinedName.includes('tongue') || combinedName.includes('lining') || combinedName.includes('inside');
                const isAccent = combinedName.includes('caps') || combinedName.includes('stripes') || combinedName.includes('band') || combinedName.includes('patch') || combinedName.includes('logo') || combinedName.includes('nike') || combinedName.includes('detail');

                const assignTo = (part: 'sole' | 'lace' | 'inner' | 'accent' | 'upper') => {
                  gltfMaterialsRef.current[part].push(mat);
                  mesh.userData.partId = part;
                };

                if (type === 'khronos') {
                   // using shoe.gltf names
                   if (matName === 'laces') assignTo('lace');
                   else if (matName === 'inner') assignTo('inner');
                   else if (matName === 'sole') assignTo('sole');
                   else if (matName === 'caps' || matName === 'stripes' || matName === 'band' || matName === 'patch') assignTo('accent');
                   else assignTo('upper');
                } else if (type === 'runner') {
                  if (mesh.id % 2 === 0 && (isSole || matName.includes('sole'))) { 
                     assignTo('sole');
                  } else if (isLace || mesh.id % 5 === 0) {
                     assignTo('lace');
                  } else if (isInner || mesh.id % 4 === 0) {
                     assignTo('inner');
                  } else if (isAccent || mesh.id % 3 === 0) {
                     assignTo('accent');
                  } else {
                     assignTo('upper');
                  }
                } else if (type === 'hightop') {
                  if (combinedName.includes('010') || combinedName.includes('002') || combinedName.includes('sole')) {
                     assignTo('sole');
                  } else if (isLace || combinedName.includes('006') || combinedName.includes('007')) {
                     assignTo('lace');
                  } else if (isAccent) {
                     assignTo('accent');
                  } else if (isInner) {
                     assignTo('inner');
                  } else {
                     assignTo('upper');
                  }
                } else {
                  if (isSole) assignTo('sole');
                  else if (isLace) assignTo('lace');
                  else if (isInner) assignTo('inner');
                  else if (isAccent) assignTo('accent');
                  else assignTo('upper');
                }
              }
            };

            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => processMaterial(m as THREE.MeshStandardMaterial));
            } else {
              processMaterial(mesh.material as THREE.MeshStandardMaterial);
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

    // Raycaster for clicking elements
    let pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onClick = (event: MouseEvent) => {
      const dist = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
      if (dist > 5) return; // it was a drag

      if ((event.target as HTMLElement).closest('.configurator-ui')) return;

      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(sneakerGroup, true);
      if (intersects.length > 0) {
        const object = intersects[0].object as THREE.Mesh;
        const partId = object.userData.partId;
        
        if (partId) {
          const mapping: Record<string, string> = {
            'upper': 'baseColor',
            'sole': 'soleColor',
            'lace': 'laceColor',
            'inner': 'innerColor',
            'accent': 'accentColor'
          };
          const featureId = mapping[partId];
          if (featureId) {
            const el = document.getElementById('feature-index-changer');
            if (el) {
               el.setAttribute('data-target-id', featureId);
               el.click();
            }
          }
        }
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('click', onClick);

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
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('click', onClick);
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

  useEffect(() => {
    if (gltfMaterialsRef.current.lace.length > 0) {
      gltfMaterialsRef.current.lace.forEach(m => {
        if ('color' in m) (m as THREE.MeshStandardMaterial).color.set(activeLaceColor);
      });
    }
  }, [activeLaceColor]);

  useEffect(() => {
    if (gltfMaterialsRef.current.inner.length > 0) {
      gltfMaterialsRef.current.inner.forEach(m => {
        if ('color' in m) (m as THREE.MeshStandardMaterial).color.set(activeInnerColor);
      });
    }
  }, [activeInnerColor]);

  useEffect(() => {
    if (gltfMaterialsRef.current.accent.length > 0) {
      gltfMaterialsRef.current.accent.forEach(m => {
        if ('color' in m) (m as THREE.MeshStandardMaterial).color.set(activeAccentColor);
      });
    }
  }, [activeAccentColor]);

  const renderColorPicker = (activeColorVal: string, setter: (val: string) => void, presets: typeof PRESETS) => (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-wrap justify-center gap-4">
        {presets.map((preset) => {
          const isActive = activeColorVal === preset.value;
          return (
            <div key={preset.name} className="flex flex-col items-center gap-2">
              <button
                onClick={() => setter(preset.value)}
                className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center relative shadow-sm
                  ${isActive ? 'border-orange-500 scale-110 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'border-white/10 hover:border-white/30 hover:scale-105'}
                `}
              >
                <div 
                  className="w-10 h-10 rounded-full border border-black/20 shadow-inner"
                  style={{ backgroundColor: preset.value }}
                />
              </button>
              <span className={`text-[10px] uppercase tracking-wider font-medium ${isActive ? 'text-orange-500' : 'text-white/50'}`}>
                {preset.name}
              </span>
            </div>
          );
        })}

        <div className="flex flex-col items-center gap-2">
          <label className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center relative cursor-pointer shadow-sm
            ${!presets.find(p => p.value === activeColorVal) ? 'border-orange-500 scale-110 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'border-dashed border-white/20 hover:scale-105 hover:border-white/40'}
          `}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500 border border-black/20 flex items-center justify-center overflow-hidden">
              <input
                type="color"
                value={activeColorVal}
                onChange={(e) => setter(e.target.value)}
                className="absolute blur-md w-[200%] h-[200%] opacity-0 cursor-pointer"
              />
            </div>
          </label>
          <span className={`text-[10px] uppercase tracking-wider font-medium ${!presets.find(p => p.value === activeColorVal) ? 'text-orange-500' : 'text-white/50'}`}>
            Custom
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] text-white flex flex-col font-sans select-none sm:overflow-hidden">
      <button 
        id="feature-index-changer" 
        className="hidden" 
        onClick={(e) => {
           const targetId = (e.target as HTMLElement).getAttribute('data-target-id');
           const idx = FEATURES.findIndex(f => f.id === targetId);
           if (idx !== -1) setActiveFeatureIndex(idx);
        }}
      ></button>
      <input type="hidden" id="active-color-ref" value={activeColor} />
      <input type="hidden" id="active-sole-color-ref" value={activeSoleColor} />
      <input type="hidden" id="active-lace-color-ref" value={activeLaceColor} />
      <input type="hidden" id="active-inner-color-ref" value={activeInnerColor} />
      <input type="hidden" id="active-accent-color-ref" value={activeAccentColor} />
      
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

      {/* HTML Overlay (Bottom Bar Configurator) */}
      <div 
        className="configurator-ui absolute bottom-0 left-0 w-full bg-white/5 backdrop-blur-[40px] text-white border-t border-white/10 z-30 pointer-events-auto py-8 px-4 md:px-8 transition-all flex flex-col items-center"
      >
        <div className="w-full max-w-4xl">
          {/* Header Navigation */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <button 
              onClick={() => setActiveFeatureIndex(i => (i - 1 + FEATURES.length) % FEATURES.length)}
              className="p-2 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-sm font-medium tracking-widest uppercase">
              {FEATURES[activeFeatureIndex].title} <span className="text-orange-500 font-bold ml-2 text-xs">{activeFeatureIndex + 1}/{FEATURES.length}</span>
            </div>
            
            <button 
              onClick={() => setActiveFeatureIndex(i => (i + 1) % FEATURES.length)}
              className="p-2 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Feature Content */}
          <div className="flex justify-center min-h-[100px]">
            {FEATURES[activeFeatureIndex].id === 'model' && (
              <div className="flex flex-wrap justify-center gap-3">
                {MODELS.map((model) => {
                  const isActive = activeModel === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => setActiveModel(model.id)}
                      className={`px-6 py-3 rounded-full border transition-all text-sm font-medium tracking-wide uppercase
                        ${isActive 
                          ? 'border-orange-500 bg-orange-500/10 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 text-white/70 hover:text-white'
                        }
                      `}
                    >
                      {model.name}
                    </button>
                  );
                })}
              </div>
            )}

            {FEATURES[activeFeatureIndex].id === 'baseColor' && renderColorPicker(activeColor, setActiveColor, PRESETS)}
            {FEATURES[activeFeatureIndex].id === 'soleColor' && renderColorPicker(activeSoleColor, setActiveSoleColor, SOLE_PRESETS)}
            {FEATURES[activeFeatureIndex].id === 'laceColor' && renderColorPicker(activeLaceColor, setActiveLaceColor, PRESETS)}
            {FEATURES[activeFeatureIndex].id === 'innerColor' && renderColorPicker(activeInnerColor, setActiveInnerColor, PRESETS)}
            {FEATURES[activeFeatureIndex].id === 'accentColor' && renderColorPicker(activeAccentColor, setActiveAccentColor, PRESETS)}

            {FEATURES[activeFeatureIndex].id === 'animation' && (
               <div className="flex flex-wrap justify-center gap-3">
                {ANIMATIONS.map((anim) => {
                  const isActive = activeAnimation === anim.id;
                  const Icon = anim.icon;
                  return (
                    <button
                      key={anim.id}
                      onClick={() => setActiveAnimation(anim.id)}
                      className={`px-6 py-3 rounded-xl border transition-all flex items-center gap-3 text-sm font-medium tracking-wide uppercase
                        ${isActive 
                          ? 'border-orange-500 bg-orange-500/10 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 text-white/70 hover:text-white'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-500' : 'text-white/50'}`} />
                      {anim.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
