import { useEffect, useRef } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - three types are provided via a local declaration
import * as THREE from 'three'

type Props = {
  onOwnNodeClick?: (doi: string) => void
  onBackgroundClick?: () => void
}

export default function PublicationSphere({ onOwnNodeClick, onBackgroundClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 400
    const height = container.clientHeight || 400

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.z = 12

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // Fondo transparente para integrarse con fondos claros del sitio
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const radius = 4.2

    const geometry = new THREE.BufferGeometry()

    const material = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const light = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(light)

    type NetworkNode = {
      id: string
      label?: string
      type?: string
      year?: number
    }

    type NetworkData = {
      nodes: NetworkNode[]
      links: { source: string; target: string; relation: string }[]
    }

    let lines: any = null
    let lineGeometry: any = null
    let lineMaterial: any = null
    let nodeByIndex: NetworkNode[] = []
    let pointsOwn: any = null
    let geometryOwn: any = null
    let materialOwn: any = null
    let ownNodeByIndex: NetworkNode[] = []
    let highlightPoints: any = null
    let highlightGeometry: any = null
    let highlightMaterial: any = null
    let highlightBorderPoints: any = null
    let highlightBorderGeometry: any = null
    let highlightBorderMaterial: any = null

    const colorOwn = new THREE.Color('#004aad') as any // azul cobalto - nuestras publicaciones
    const colorCitedBy = new THREE.Color('#22c55e') as any // green nodes - cited by
    const colorReference = new THREE.Color('#0ea5e9') as any // blue nodes - references
    const colorDefaultInner = new THREE.Color('#0f172a') as any
    const colorDefaultOuter = new THREE.Color('#004aad') as any

    const populateFromNetwork = (data: NetworkData | null) => {
      const nodes = data?.nodes ?? []
      const maxNodes = width > 640 ? 3200 : 1800
      const usedNodes = nodes.slice(0, maxNodes)

      const baseNodes: NetworkNode[] =
        usedNodes.length > 0
          ? usedNodes
          : Array.from({ length: width > 640 ? 2500 : 1400 }).map((_, idx) => ({
              id: `random-${idx}`,
              type: 'reference',
            }))

      const count = baseNodes.length
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)

      const ownPositionsArray: number[] = []
      const ownColorsArray: number[] = []

      const nodePositions: Record<string, [number, number, number]> = {}
      nodeByIndex = []
      ownNodeByIndex = []

      for (let i = 0; i < count; i++) {
        const node = baseNodes[i]

        const u = Math.random()
        const v = Math.random()
        const theta = 2 * Math.PI * u
        const phi = Math.acos(2 * v - 1)

        // Tres capas esféricas (radio fijo por tipo) para que se vea como esfera
        let r: number
        if (node.type === 'own') {
          r = radius * 1.0 // capa externa
        } else if (node.type === 'citedBy') {
          r = radius * 0.92 // capa media
        } else {
          r = radius * 0.82 // capa interna (referencias y otros)
        }

        const x = r * Math.sin(phi) * Math.cos(theta)
        const y = r * Math.sin(phi) * Math.sin(theta)
        const z = r * Math.cos(phi)

        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z

        nodePositions[node.id] = [x, y, z]
        nodeByIndex[i] = node

      let col: any
        if (node.type === 'own') {
          col = colorOwn
          ownPositionsArray.push(x, y, z)
          ownColorsArray.push(col.r, col.g, col.b)
          ownNodeByIndex.push(node)
        } else if (node.type === 'citedBy') {
          col = colorCitedBy
        } else if (node.type === 'reference') {
          col = colorReference
        } else {
          const dist = Math.sqrt(x * x + y * y + z * z) / radius
          col = dist < 0.8 ? colorDefaultInner : colorDefaultOuter
        }

        colors[i * 3] = col.r
        colors[i * 3 + 1] = col.g
        colors[i * 3 + 2] = col.b
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.computeBoundingSphere()

      // Highlight se recalculará cuando se seleccione un nodo

      // Remove previous own-node overlay, if present
      if (pointsOwn) {
        scene.remove(pointsOwn)
        if (geometryOwn) geometryOwn.dispose()
        if (materialOwn) materialOwn.dispose()
      }

      // Create overlay of larger points for own publications
      if (ownPositionsArray.length > 0) {
        geometryOwn = new THREE.BufferGeometry()
        geometryOwn.setAttribute(
          'position',
          new THREE.BufferAttribute(new Float32Array(ownPositionsArray), 3)
        )
        geometryOwn.setAttribute(
          'color',
          new THREE.BufferAttribute(new Float32Array(ownColorsArray), 3)
        )

        materialOwn = new THREE.PointsMaterial({
          size: 0.22, // tamaño base de nuestras publicaciones
          vertexColors: true,
          transparent: true,
          opacity: 0.98,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        }) as any

        pointsOwn = new THREE.Points(geometryOwn, materialOwn)
        scene.add(pointsOwn)
      }

      // Remove previous lines if any
      if (lines) {
        scene.remove(lines)
        if (lineGeometry) lineGeometry.dispose()
        if (lineMaterial) lineMaterial.dispose()
      }

      const rawLinks = data?.links ?? []
      const maxLinks = width > 640 ? 4500 : 2500
      const usedLinks = rawLinks.slice(0, maxLinks)

      const linePositions = new Float32Array(usedLinks.length * 2 * 3)
      const lineColors = new Float32Array(usedLinks.length * 2 * 3)

      let idx = 0
      for (const link of usedLinks) {
        const sourcePos = nodePositions[link.source]
        const targetPos = nodePositions[link.target]
        if (!sourcePos || !targetPos) continue

        const colorLine =
          link.relation === 'citedBy'
            ? new THREE.Color('#bbf7d0') // verde muy tenue
            : link.relation === 'reference'
              ? new THREE.Color('#bae6fd') // azul muy tenue
              : new THREE.Color('#e5e7eb') // gris claro

        linePositions[idx * 6] = sourcePos[0]
        linePositions[idx * 6 + 1] = sourcePos[1]
        linePositions[idx * 6 + 2] = sourcePos[2]
        linePositions[idx * 6 + 3] = targetPos[0]
        linePositions[idx * 6 + 4] = targetPos[1]
        linePositions[idx * 6 + 5] = targetPos[2]

        lineColors[idx * 6] = colorLine.r
        lineColors[idx * 6 + 1] = colorLine.g
        lineColors[idx * 6 + 2] = colorLine.b
        lineColors[idx * 6 + 3] = colorLine.r
        lineColors[idx * 6 + 4] = colorLine.g
        lineColors[idx * 6 + 5] = colorLine.b

        idx++
      }

      lineGeometry = new THREE.BufferGeometry()
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
      lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))

      lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.22,
      }) as any

      lines = new THREE.LineSegments(lineGeometry, lineMaterial)
      scene.add(lines)
    }

    const baseUrl = (import.meta as any).env.BASE_URL || '/'
    const networkUrl = `${baseUrl}data/network.json`

    fetch(networkUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: NetworkData | null) => {
        populateFromNetwork(data)
      })
      .catch(() => {
        populateFromNetwork(null)
      })

    // Interacción: rotación manual y selección de nodos
    let isDragging = false
    let dragMoved = false
    let lastX = 0
    let lastY = 0
    let baseRotationX = 0
    let baseRotationY = 0
    let targetRotationX = 0
    let targetRotationY = 0

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const domElement = renderer.domElement

    const onPointerDown = (event: PointerEvent) => {
      isDragging = true
      dragMoved = false
      lastX = event.clientX
      lastY = event.clientY
      baseRotationX = points.rotation.x
      baseRotationY = points.rotation.y
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return
      const dx = event.clientX - lastX
      const dy = event.clientY - lastY
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        dragMoved = true
      }
      targetRotationY = baseRotationY + dx * 0.002
      targetRotationX = baseRotationX + dy * 0.002
    }

    const updateHighlight = (position: [number, number, number] | null) => {
      if (!position) {
        if (highlightPoints) {
          scene.remove(highlightPoints)
          if (highlightGeometry) highlightGeometry.dispose()
          if (highlightMaterial) highlightMaterial.dispose()
        }
        if (highlightBorderPoints) {
          scene.remove(highlightBorderPoints)
          if (highlightBorderGeometry) highlightBorderGeometry.dispose()
          if (highlightBorderMaterial) highlightBorderMaterial.dispose()
        }
        highlightPoints = null
        highlightGeometry = null
        highlightMaterial = null
        highlightBorderPoints = null
        highlightBorderGeometry = null
        highlightBorderMaterial = null
        return
      }

      const [x, y, z] = position

      // Borde grueso (círculo mayor, color oscuro) para dar contorno claro
      if (!highlightBorderGeometry) {
        highlightBorderGeometry = new THREE.BufferGeometry()
        highlightBorderGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(new Float32Array([x, y, z]), 3)
        )
        highlightBorderMaterial = new THREE.PointsMaterial({
          size: 0.9, // ~300% del tamaño base
          color: '#020617', // casi negro (slate-950)
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        }) as any
        highlightBorderPoints = new THREE.Points(
          highlightBorderGeometry,
          highlightBorderMaterial
        )
        scene.add(highlightBorderPoints)
      } else {
        const arrBorder = (highlightBorderGeometry.getAttribute(
          'position'
        ) as any).array as Float32Array
        arrBorder[0] = x
        arrBorder[1] = y
        arrBorder[2] = z
        highlightBorderGeometry.attributes.position.needsUpdate = true
      }

      // Núcleo del nodo resaltado (mismo centro, azul cobalto más grande)
      if (!highlightGeometry) {
        highlightGeometry = new THREE.BufferGeometry()
        highlightGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(new Float32Array([x, y, z]), 3)
        )
        highlightMaterial = new THREE.PointsMaterial({
          size: 0.66, // 3x el tamaño base (0.22)
          color: '#004aad', // azul cobalto, mismo tono que el nodo
          transparent: true,
          opacity: 1,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        }) as any
        highlightPoints = new THREE.Points(highlightGeometry, highlightMaterial)
        // Añadir después del borde para que quede “encima”
        scene.add(highlightPoints)
      } else {
        const arr = (highlightGeometry.getAttribute('position') as any).array as Float32Array
        arr[0] = x
        arr[1] = y
        arr[2] = z
        highlightGeometry.attributes.position.needsUpdate = true
      }
    }

    const handleNodeClick = (event: PointerEvent): boolean => {
      const hasNodeClickHandler = Boolean(onOwnNodeClick)

      const rect = domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const intersectObjects: any[] = []
      if (pointsOwn) intersectObjects.push(pointsOwn)
      if (!intersectObjects.length) return false
      const intersects = raycaster.intersectObjects(intersectObjects, false)
      if (!intersects.length) return false

      const intersection = intersects[0]
      const index = intersection.index ?? 0
      const node = (ownNodeByIndex as any)[index] as NetworkNode | undefined
      if (!node || node.type !== 'own' || !node.id) return false

      // Girar suavemente la esfera para llevar el nodo hacia la derecha
      const pos = new THREE.Vector3(
        (geometryOwn?.getAttribute('position') as any).array[index * 3],
        (geometryOwn?.getAttribute('position') as any).array[index * 3 + 1],
        (geometryOwn?.getAttribute('position') as any).array[index * 3 + 2]
      )
      const angleY = Math.atan2(pos.z, pos.x)
      targetRotationY = points.rotation.y - angleY + Math.PI / 3
      targetRotationX = 0
      updateHighlight([pos.x, pos.y, pos.z])

      if (hasNodeClickHandler && onOwnNodeClick) {
        onOwnNodeClick(node.id)
      }
      return true
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!isDragging) return
      isDragging = false

      if (!dragMoved) {
        const clickedNode = handleNodeClick(event)
        if (!clickedNode) {
          updateHighlight(null)
          if (onBackgroundClick) onBackgroundClick()
        }
      }

      baseRotationX = points.rotation.x
      baseRotationY = points.rotation.y
    }

    domElement.addEventListener('pointerdown', onPointerDown)
    domElement.addEventListener('pointermove', onPointerMove)
    domElement.addEventListener('pointerup', onPointerUp)
    domElement.addEventListener('pointerleave', onPointerUp)

    let animationFrameId: number
    const clock = new THREE.Clock()

    const handleResize = () => {
      if (!container) return
      const newWidth = container.clientWidth || width
      const newHeight = container.clientHeight || height
      renderer.setSize(newWidth, newHeight)
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
    }

    window.addEventListener('resize', handleResize)

    const animate = () => {
      const delta = clock.getDelta()

      // Auto-rotación solo cuando no hay nodo seleccionado (sin highlight)
      if (!highlightPoints && !isDragging && !dragMoved) {
        targetRotationY += delta * 0.25
      }

      // Interpolación suave hacia la rotación objetivo
      points.rotation.y += (targetRotationY - points.rotation.y) * 0.05
      points.rotation.x += (targetRotationX - points.rotation.x) * 0.05
      if (lines) {
        lines.rotation.copy(points.rotation)
      }
      if (pointsOwn) {
        pointsOwn.rotation.copy(points.rotation)
      }
      if (highlightPoints) {
        highlightPoints.rotation.copy(points.rotation)
      }
      if (highlightBorderPoints) {
        highlightBorderPoints.rotation.copy(points.rotation)
      }

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      domElement.removeEventListener('pointerdown', onPointerDown)
      domElement.removeEventListener('pointermove', onPointerMove)
      domElement.removeEventListener('pointerup', onPointerUp)
      domElement.removeEventListener('pointerleave', onPointerUp)
      container.removeChild(renderer.domElement)
      geometry.dispose()
      if (geometryOwn) geometryOwn.dispose()
      if (materialOwn) materialOwn.dispose()
      if (lineGeometry) lineGeometry.dispose()
      if (lineMaterial) lineMaterial.dispose()
      if (highlightGeometry) highlightGeometry.dispose()
      if (highlightMaterial) highlightMaterial.dispose()
      if (highlightBorderGeometry) highlightBorderGeometry.dispose()
      if (highlightBorderMaterial) highlightBorderMaterial.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}

