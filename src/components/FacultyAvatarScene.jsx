import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'

// Original, procedural character. No models, textures, or external assets.
function Professor({ reducedMotion, config }) {
  const colors = { skin: config.skinColor, suit: config.suitColor, lapel: '#34577e', hair: config.hairColor, shirt: '#f1f5fa', accent: config.accentColor }
  const professor = useRef(null)

  useFrame(({ clock }) => {
    if (!professor.current) return
    const time = clock.elapsedTime
    professor.current.position.y = reducedMotion ? 0 : Math.sin(time * 1.2) * 0.018
    professor.current.rotation.z = reducedMotion ? 0 : Math.sin(time * 0.65) * 0.012
  })

  return <group ref={professor}>
    {/* Tailored jacket, shirt, and tie. */}
    <mesh position={[0, 0.08, 0]} scale={[1.1, 1, 0.65]} castShadow>
      <capsuleGeometry args={[0.4, 0.6, 8, 24]}/><meshStandardMaterial color={colors.suit} roughness={0.8}/>
    </mesh>
    <RoundedBox args={[0.28, 0.69, 0.07]} radius={0.025} position={[0, 0.35, 0.27]}><meshStandardMaterial color={colors.shirt}/></RoundedBox>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 0.19, 0.43, 0.29]} rotation={[0, 0, side * -0.27]}>
        <boxGeometry args={[0.12, 0.56, 0.07]}/><meshStandardMaterial color={colors.lapel}/>
      </mesh>
      <mesh position={[side * 0.55, 0.03, 0]} rotation={[0, 0, side * 0.16]} castShadow>
        <capsuleGeometry args={[0.14, 0.63, 8, 16]}/><meshStandardMaterial color={colors.suit} roughness={0.8}/>
      </mesh>
      <mesh position={[side * 0.62, -0.42, 0.04]} scale={[0.85, 1, 0.85]} castShadow>
        <sphereGeometry args={[0.13, 20, 16]}/><meshStandardMaterial color={colors.skin} roughness={0.85}/>
      </mesh>
    </group>)}
    <mesh position={[0, 0.38, 0.33]} rotation={[0, 0, Math.PI]}>
      <coneGeometry args={[0.055, 0.38, 4]}/><meshStandardMaterial color={colors.accent}/>
    </mesh>
    <mesh position={[0, 0.6, 0.33]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.065, 0.065, 0.04]}/><meshStandardMaterial color={colors.accent}/>
    </mesh>
    {/* A simple hardback book, held at the character's side. */}
    <group position={[0.63, -0.19, 0.19]} rotation={[0, 0, -0.12]}>
      <RoundedBox args={[0.27, 0.48, 0.16]} radius={0.018} castShadow><meshStandardMaterial color="#4b7884"/></RoundedBox>
      <mesh position={[0.02, 0, 0.083]}><boxGeometry args={[0.21, 0.4, 0.012]}/><meshStandardMaterial color="#e5e9e5"/></mesh>
    </group>
    {/* Neutral stylized face with restrained features and reading glasses. */}
    <mesh position={[0, 0.83, 0]}><cylinderGeometry args={[0.15, 0.17, 0.3, 24]}/><meshStandardMaterial color={colors.skin}/></mesh>
    <mesh position={[0, 1.32, 0]} scale={[0.82, 1, 0.82]} castShadow>
      <sphereGeometry args={[0.49, 32, 24]}/><meshStandardMaterial color={colors.skin} roughness={0.85}/>
    </mesh>
    <mesh position={[0, 1.32, -0.015]} scale={[0.85, 1.02, 0.86]} castShadow>
      <sphereGeometry args={[0.5, 32, 20, 0, Math.PI * 2, 0, 1.36]}/><meshStandardMaterial color={colors.hair} roughness={0.9}/>
    </mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 0.4, 1.29, 0]} scale={[0.65, 1, 0.7]}><sphereGeometry args={[0.1, 16, 12]}/><meshStandardMaterial color={colors.skin}/></mesh>
      <mesh position={[side * 0.15, 1.37, 0.373]}><sphereGeometry args={[0.025, 16, 12]}/><meshStandardMaterial color="#253245"/></mesh>
      <mesh position={[side * 0.15, 1.38, 0.395]}><torusGeometry args={[0.112, 0.013, 8, 28]}/><meshStandardMaterial color={colors.hair} roughness={0.55}/></mesh>
      <mesh position={[side * 0.265, 1.38, 0.27]}><boxGeometry args={[0.018, 0.018, 0.25]}/><meshStandardMaterial color={colors.hair}/></mesh>
      <mesh position={[side * 0.15, 1.52, 0.35]} rotation={[0, 0, side * -0.06]}><boxGeometry args={[0.13, 0.022, 0.025]}/><meshStandardMaterial color={colors.hair}/></mesh>
    </group>)}
    <mesh position={[0, 1.38, 0.404]}><boxGeometry args={[0.08, 0.016, 0.02]}/><meshStandardMaterial color={colors.hair}/></mesh>
    <mesh position={[0, 1.26, 0.4]} scale={[0.65, 0.95, 1]}><sphereGeometry args={[0.065, 16, 12]}/><meshStandardMaterial color={colors.skin}/></mesh>
    <mesh position={[0, 1.13, 0.37]} rotation={[0, 0, Math.PI]} scale={[1, 0.4, 1]}>
      <torusGeometry args={[0.09, 0.009, 8, 20, Math.PI]}/><meshStandardMaterial color="#885f54"/>
    </mesh>
  </group>
}

function ContextMonitor({ onUnavailable }) {
  const canvas = useThree(state => state.gl.domElement)
  useEffect(() => {
    const handleLost = event => {
      event.preventDefault()
      onUnavailable()
    }
    canvas.addEventListener('webglcontextlost', handleLost)
    return () => canvas.removeEventListener('webglcontextlost', handleLost)
  }, [canvas, onUnavailable])
  return null
}

export default function FacultyAvatarScene({ reducedMotion, onUnavailable, fallback, config }) {
  return <>
    <Canvas camera={{ position: [2.5, 1.6, 5], fov: 36 }} dpr={[1, 1.5]} shadows frameloop={reducedMotion ? 'demand' : 'always'} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} fallback={fallback} aria-label="Generic 3D professor avatar. Drag to rotate.">
      <ambientLight intensity={1.2}/>
      <hemisphereLight args={['#edf4ff', '#b6c4d6', 1.4]}/>
      <directionalLight position={[3, 5, 5]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-radius={4} shadow-normalBias={0.03}/>
      <directionalLight position={[-4, 2, 1]} intensity={0.8} color="#cbdfff"/>
      <Professor reducedMotion={reducedMotion} config={config}/>
      <mesh position={[0, -0.76, 0]} receiveShadow><cylinderGeometry args={[0.98, 1.06, 0.2, 64]}/><meshStandardMaterial color="#dce7f5" roughness={0.9}/></mesh>
      <OrbitControls makeDefault target={[0, 0.5, 0]} enablePan={false} enableZoom={false} enableDamping={!reducedMotion} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.9} rotateSpeed={0.65}/>
      <ContextMonitor onUnavailable={onUnavailable}/>
    </Canvas>
    <span className="faculty-3d-rotation-hint" aria-hidden="true">Drag to rotate · Mouse or touch</span>
  </>
}
