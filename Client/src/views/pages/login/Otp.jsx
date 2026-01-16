import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'

export default function Otp() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef([])
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

  const handleChange = (index, value) => {
    if (value.length > 1) return

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)

    if (!/^\d+$/.test(pastedData)) return

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''))
    setOtp(newOtp)

    const nextEmptyIndex = newOtp.findIndex((digit) => !digit)
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  const submit = async () => {
    const otpString = otp.join('')

    if (otpString.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await api.post('/api/auth/verify-otp', {
        userId: state.userId,
        otp: otpString,
      })

      login(res.data.token)
      setIsLoading(false)
      setIsVerified(true)

      setTimeout(() => {
        navigate('/dashboard')
      }, 3000)
    } catch (err) {
      setIsLoading(false)
      setError('Invalid OTP. Please try again.')
    }
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
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '3rem 2.5rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
          }}
        >
          {!isVerified ? (
            <>
              {/* Logo */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '1.5rem',
                  borderRadius: '15px',
                  marginBottom: '2rem',
                  display: 'inline-block',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                }}
              >
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  Cloud<span style={{ color: '#ffd700' }}>berry</span>
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginTop: '0.25rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  International limited
                </div>
              </div>

              {/* Header */}
              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: '#2d3748',
                  marginBottom: '0.5rem',
                }}
              >
                Verify Your Identity
              </h2>
              <p
                style={{
                  color: '#718096',
                  fontSize: '0.95rem',
                  marginBottom: '2.5rem',
                }}
              >
                Enter the 6-digit code sent to your device
              </p>

              {/* OTP Input Fields */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    style={{
                      width: '60px',
                      height: '60px',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      border: `2px solid ${error ? '#f56565' : digit ? '#667eea' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      background: 'white',
                      color: '#2d3748',
                    }}
                    onFocus={(e) => {
                      if (!error) e.target.style.borderColor = '#667eea'
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                    }}
                    onBlur={(e) => {
                      if (!digit && !error) e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    color: '#f56565',
                    fontSize: '0.9rem',
                    marginBottom: '1.5rem',
                    fontWeight: '500',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={submit}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: isLoading
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <svg
                      style={{
                        animation: 'spin 1s linear infinite',
                        width: '20px',
                        height: '20px',
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        style={{ opacity: 0.25 }}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        style={{ opacity: 0.75 }}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>

              {/* Resend Link */}
              <div
                style={{
                  fontSize: '0.9rem',
                  color: '#718096',
                }}
              >
                Didn't receive the code?{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    // Add resend logic here
                  }}
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: '600',
                  }}
                >
                  Resend
                </a>
              </div>

              {/* Security Note */}
              <div
                style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  color: '#4a5568',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Your security is our priority
              </div>
            </>
          ) : (
            // Success Animation
            <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
              {/* Animated Checkmark Circle */}
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 2rem',
                  position: 'relative',
                }}
              >
                <svg
                  style={{
                    width: '100%',
                    height: '100%',
                    animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                  viewBox="0 0 120 120"
                >
                  {/* Outer circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    style={{
                      strokeDasharray: '339.292',
                      strokeDashoffset: '339.292',
                      animation: 'drawCircle 0.8s ease-out forwards',
                    }}
                  />
                  {/* Checkmark */}
                  <path
                    d="M35 60 L52 77 L85 44"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: '70',
                      strokeDashoffset: '70',
                      animation: 'drawCheck 0.5s 0.5s ease-out forwards',
                    }}
                  />
                </svg>
              </div>

              {/* Success Message */}
              <h2
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '1rem',
                  animation: 'slideUp 0.6s 0.3s ease-out both',
                }}
              >
                Verified Successfully!
              </h2>

              {/* Welcome Message */}
              <div
                style={{
                  animation: 'slideUp 0.6s 0.5s ease-out both',
                }}
              >
                <p
                  style={{
                    fontSize: '1.1rem',
                    color: '#2d3748',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                  }}
                >
                  Welcome to
                </p>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                  }}
                >
                  Cloudberry
                </div>
                <p
                  style={{
                    fontSize: '1rem',
                    color: '#718096',
                    fontWeight: '500',
                  }}
                >
                  Project Management System
                </p>
              </div>

              {/* Loading dots */}
              <div
                style={{
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  animation: 'slideUp 0.6s 0.7s ease-out both',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'bounce 1.4s 0s infinite',
                  }}
                />
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'bounce 1.4s 0.2s infinite',
                  }}
                />
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'bounce 1.4s 0.4s infinite',
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#718096',
                  marginTop: '1rem',
                  animation: 'slideUp 0.6s 0.9s ease-out both',
                }}
              >
                Redirecting to dashboard...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes drawCircle {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
