import { OrbitControls } from '@react-three/drei';
import { Canvas, useLoader } from '@react-three/fiber';
import React, { useState } from 'react'
import { AmbientLight, PointLight } from 'three';
import { useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
const Threed = () => {


     const [scale,setScale] = useState([1]);
    useEffect(() => {
        const handleResize = () => {
          if (window.innerWidth < 768) {
            setScale([1,1,1]); // Decrease scale for small screens
          } else {
            setScale([1.25,1.25,1.25]); // Default scale
          }
        };
  
        window.addEventListener('resize', handleResize);
        handleResize(); // Call it once to set initial scale
  
        return () => window.removeEventListener('resize', handleResize);
      }, []);

    
   const Model = () =>{
    const gld = useLoader(GLTFLoader,'/78175.glb');
    return <primitive object={gld.scene}  position={[0, -1, 0]} scale={scale} />
   }


  return (

      <Canvas style={{width:'100%',height:'450px',background:'transparent',alignContent:'center'}}>
      <ambientLight intensity={1} />
      <pointLight position={[0,4,0]} intensity={1} />
      <OrbitControls 
        enableRotate={true}
        enableZoom={false}
        autoRotate={true}
        enablePan={false}
        minPolarAngle={Math.PI / 2}  
        maxPolarAngle={Math.PI / 2}  
      />
      <Model />     


      </Canvas>

    )
}

export default Threed