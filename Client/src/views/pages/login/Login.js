import React, { useState, useEffect, useRef } from 'react'
import { CButton, CCard, CCardBody, CCol, CContainer, CForm, CFormInput, CRow } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import api from '../../../api/axios'

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' })
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Three.js 3D Network Animation
    const container = canvasRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0f0c29, 1)
    container.appendChild(renderer.domElement)

    camera.position.z = 50

    const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const nodes = []
    const connections = []
    const nodeCount = 80

    for (let i = 0; i < nodeCount; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0x667eea : 0x00d4ff,
        transparent: true,
        opacity: 0.8,
      })
      const node = new THREE.Mesh(nodeGeometry, material)

      node.position.x = (Math.random() - 0.5) * 100
      node.position.y = (Math.random() - 0.5) * 100
      node.position.z = (Math.random() - 0.5) * 100

      node.velocity = {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02,
      }

      scene.add(node)
      nodes.push(node)
    }

    function updateConnections() {
      connections.forEach((line) => scene.remove(line))
      connections.length = 0

      const maxDistance = 15

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = nodes[i].position.distanceTo(nodes[j].position)

          if (distance < maxDistance) {
            const geometry = new THREE.BufferGeometry()
            const positions = new Float32Array([
              nodes[i].position.x,
              nodes[i].position.y,
              nodes[i].position.z,
              nodes[j].position.x,
              nodes[j].position.y,
              nodes[j].position.z,
            ])
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

            const opacity = 1 - distance / maxDistance
            const material = new THREE.LineBasicMaterial({
              color: 0x667eea,
              transparent: true,
              opacity: opacity * 0.3,
            })

            const line = new THREE.Line(geometry, material)
            scene.add(line)
            connections.push(line)
          }
        }
      }
    }

    const shapes = []
    const shapeTypes = [
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.TetrahedronGeometry(1.5),
      new THREE.OctahedronGeometry(1.5),
    ]

    for (let i = 0; i < 10; i++) {
      const geometry = shapeTypes[Math.floor(Math.random() * shapeTypes.length)]
      const material = new THREE.MeshBasicMaterial({
        color: 0x667eea,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      })
      const shape = new THREE.Mesh(geometry, material)

      shape.position.x = (Math.random() - 0.5) * 80
      shape.position.y = (Math.random() - 0.5) * 80
      shape.position.z = (Math.random() - 0.5) * 80

      shape.rotation.x = Math.random() * Math.PI
      shape.rotation.y = Math.random() * Math.PI

      shape.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
      }

      scene.add(shape)
      shapes.push(shape)
    }

    // Animation
    let frameCount = 0
    let animationId
    function animate() {
      animationId = requestAnimationFrame(animate)

      nodes.forEach((node) => {
        node.position.x += node.velocity.x
        node.position.y += node.velocity.y
        node.position.z += node.velocity.z

        if (Math.abs(node.position.x) > 50) node.velocity.x *= -1
        if (Math.abs(node.position.y) > 50) node.velocity.y *= -1
        if (Math.abs(node.position.z) > 50) node.velocity.z *= -1
      })

      shapes.forEach((shape) => {
        shape.rotation.x += shape.rotationSpeed.x
        shape.rotation.y += shape.rotationSpeed.y
      })

      if (frameCount % 3 === 0) {
        updateConnections()
      }
      frameCount++

      camera.position.x = Math.sin(Date.now() * 0.0001) * 5
      camera.position.y = Math.cos(Date.now() * 0.00015) * 5
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      container.removeChild(renderer.domElement)
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()

    const res = await api.post('/api/auth/login', form)

    navigate('/otp', {
      state: { userId: res.data.userId },
    })
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* 3D Canvas Background */}
      <div
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      />

      {/* Content Wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={10} lg={8} xl={6}>
              <CCard
                style={{
                  border: 'none',
                  borderRadius: '20px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CRow className="g-0">
                  {/* Left side - Branding */}
                  <CCol
                    md={5}
                    style={{
                      background: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)',
                      padding: '3rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                        opacity: 0.3,
                      }}
                    />

                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        textAlign: 'center',
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          background: 'white',
                          padding: '1.5rem',
                          borderRadius: '15px',
                          marginBottom: '2rem',
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                          display: 'inline-block',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            color: '#6c757d',
                          }}
                        >
                          Cloud<span style={{ color: '#ff6b35' }}>berry</span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#6c757d',
                            marginTop: '0.25rem',
                            letterSpacing: '0.5px',
                          }}
                        >
                          International limited
                        </div>
                      </div>

                      <h3
                        style={{
                          marginBottom: '1rem',
                          fontSize: '1.5rem',
                          fontWeight: '600',
                        }}
                      >
                        IT Solutions Provider
                      </h3>

                      <div
                        style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                          opacity: 0.9,
                        }}
                      >
                        <div style={{ marginBottom: '0.5rem' }}>• Network Infrastructure</div>
                        <div style={{ marginBottom: '0.5rem' }}>• CCTV Installation</div>
                        <div style={{ marginBottom: '0.5rem' }}>• Fire Alarm Systems</div>
                        <div>• System Configuration</div>
                      </div>
                    </div>
                  </CCol>

                  {/* Right side - Login form */}
                  <CCol md={7}>
                    <CCardBody style={{ padding: '3rem 2.5rem', background: 'white' }}>
                      <div style={{ marginBottom: '2rem' }}>
                        <h1
                          style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            color: '#2d3748',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Welcome Back
                        </h1>
                        <p
                          style={{
                            color: '#718096',
                            fontSize: '0.95rem',
                          }}
                        >
                          Sign in to access your dashboard
                        </p>
                      </div>

                      <CForm onSubmit={submit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label
                            style={{
                              display: 'block',
                              marginBottom: '0.5rem',
                              color: '#4a5568',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                            }}
                          >
                            Username
                          </label>
                          <CFormInput
                            placeholder="Enter your username"
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            style={{
                              padding: '0.75rem 1rem',
                              border: '2px solid #e2e8f0',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              transition: 'all 0.3s',
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label
                            style={{
                              display: 'block',
                              marginBottom: '0.5rem',
                              color: '#4a5568',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                            }}
                          >
                            Password
                          </label>
                          <CFormInput
                            type="password"
                            placeholder="Enter your password"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            style={{
                              padding: '0.75rem 1rem',
                              border: '2px solid #e2e8f0',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              transition: 'all 0.3s',
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '2rem',
                            fontSize: '0.9rem',
                          }}
                        >
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              color: '#4a5568',
                              cursor: 'pointer',
                            }}
                          >
                            <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                            Remember me
                          </label>
                          <a
                            href="#"
                            style={{
                              color: '#667eea',
                              textDecoration: 'none',
                              fontWeight: '500',
                            }}
                          >
                            Forgot password?
                          </a>
                        </div>

                        <CButton
                          type="submit"
                          style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                          }}
                        >
                          Sign In
                        </CButton>
                      </CForm>

                      <div
                        style={{
                          marginTop: '2rem',
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          color: '#718096',
                        }}
                      >
                        Need help?{' '}
                        <a
                          href="#"
                          style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}
                        >
                          Contact Support
                        </a>
                      </div>
                    </CCardBody>
                  </CCol>
                </CRow>
              </CCard>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '1.5rem',
                  color: 'white',
                  fontSize: '0.85rem',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                }}
              >
                © 2024 Cloudberry International Limited. All rights reserved.
              </div>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    </div>
  )
}

export default Login
