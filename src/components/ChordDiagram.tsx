import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const generateMatrix = () => {
  const numChromosomes = 12
  const matrix = []
  for (let i = 0; i < numChromosomes; i++) {
    const row = []
    for (let j = 0; j < numChromosomes; j++) {
      let value = Math.random() > 0.7 ? Math.floor(Math.random() * 100) : 0
      if (i === j) value = value * 2
      row.push(value)
    }
    matrix.push(row)
  }
  return matrix
}


// Extremely granular data for horizon plot (~500 points per chromosome for very sharp spikes)
function generateHorizonData(groups: d3.ChordGroup[]) {
  return groups.flatMap(d => {
    const points = 500
    const step = (d.endAngle - d.startAngle) / (points - 1)
    return d3.range(points).map(i => ({
      angle: d.startAngle + i * step,
      value: Math.random() * 0.5 + 0.1, 
      chrIndex: d.index
    }))
  })
}

export default function ChordDiagram() {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [hoveredRibbon, setHoveredRibbon] = useState<{ source: number; target: number } | null>(null)
  
  const rotationRef = useRef(0)
  const isPausedRef = useRef(false)
  const expressionDataRef = useRef<any[]>([])

  useEffect(() => {
    if (!svgRef.current) return

    const width = 1000
    const height = 1000
    const outerRadius = Math.min(width, height) * 0.5 - 120
    const innerRadius = outerRadius - 15
    const expBaseRadius = outerRadius + 10
    const expMaxHeight = 50

    const matrix = generateMatrix()
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    // Definition for gradients
    const defs = svg.append("defs")
    const gradient = defs.append("linearGradient")
      .attr("id", "blue-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%")
    
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.8)
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#bbc4cc").attr("stop-opacity", 0.2)

    const g = svg.append("g")
      .attr("class", "main-g")
      .attr("transform", `translate(${width / 2},${height / 2}) rotate(0)`)
    
    // @ts-ignore
    gRef.current = g.node()

    const chord = d3.chord().padAngle(0.04).sortSubgroups(d3.descending)(matrix)
    const arc = d3.arc<d3.ChordGroup>().innerRadius(innerRadius).outerRadius(outerRadius)
    const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>().radius(innerRadius)

    // areaRadial for the horizon plot
    const area = d3.areaRadial<any>()
      .curve(d3.curveLinear) // Jagged lines for sharp peaks
      .angle(d => d.angle)
      .innerRadius(() => expBaseRadius)
      .outerRadius(d => expBaseRadius + d.value * expMaxHeight)

    const chromosomeColor = '#cbd5e1'

    // --- Chromosome Arcs ---
    const groups = g.append("g")
      .selectAll("g")
      .data(chord.groups)
      .join("g")
      .attr("class", "group")

    groups.append("path")
      .style("fill", chromosomeColor)
      .style("stroke", d3.rgb(chromosomeColor).darker(0.2).toString())
      .attr("d", arc as any)
      .attr("class", d => `arc arc-${d.index}`)
      .on("mouseenter", (_event, d) => { setHoveredIndex(d.index); isPausedRef.current = true; })
      .on("mouseleave", () => { setHoveredIndex(null); isPausedRef.current = false; })

    // Labels
    groups.append("text")
      .each((d: any) => { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr("dy", ".35em")
      .attr("transform", (d: any) => `
          rotate(${(d.angle * 180 / Math.PI - 90)})
          translate(${expBaseRadius + expMaxHeight + 20})
          ${d.angle > Math.PI ? "rotate(180)" : ""}
      `)
      .attr("text-anchor", (d: any) => d.angle > Math.PI ? "end" : "start")
      .style("font-size", "10px")
      .style("fill", "#64748b")
      .style("font-family", "monospace")
      .text(d => `${t('home.bluesky.chromosomeLabel')} ${d.index + 1}`)

    // --- Realistic Horizon Expression Layer ---
    expressionDataRef.current = generateHorizonData(chord.groups)
    
    const grayScale = d3.scaleOrdinal<number, string>()
      .domain(d3.range(12))
      .range(['#cbd5e1', '#94a3b8', '#64748b', '#cbd5e1', '#94a3b8', '#64748b', '#cbd5e1', '#94a3b8', '#64748b', '#cbd5e1', '#94a3b8', '#64748b'])

    const horizonGroups = g.append("g")
      .attr("class", "horizon-layer")
      .selectAll("path")
      .data(chord.groups)
      .join("path")
      .attr("class", d => `horizon-chr horizon-chr-${d.index}`)
      .attr("d", (d: any) => {
        const chrPoints = expressionDataRef.current.filter(p => p.chrIndex === d.index)
        return area(chrPoints)
      })
      .style("fill", (d) => grayScale(d.index))
      .style("stroke", "#64748b")
      .style("stroke-width", 0.3)
      .style("opacity", 0.4)

    // --- Ribbons ---
    // Paleta de dos colores: Cobalt Blue y Verdigris
    const ribbonColors = ['#004aad', '#61CE70']
    
    g.append("g")
      .attr("class", "ribbons")
      .selectAll("path")
      .data(chord)
      .join("path")
      .attr("class", "ribbon")
      .attr("d", ribbon as any)
      .style("fill", (_d: any, i: number) => ribbonColors[i % ribbonColors.length])
      .style("fill-opacity", 0.35)
      .style("stroke", (_d: any, i: number) => d3.rgb(ribbonColors[i % ribbonColors.length]).darker(0.6).toString())
      .style("stroke-width", 0.5)
      .style("stroke-opacity", 1)  // Agregar opacidad del stroke
      .on("mouseenter", (_event, d: any) => { setHoveredRibbon({ source: d.source.index, target: d.target.index }); isPausedRef.current = true; })
      .on("mouseleave", () => { setHoveredRibbon(null); isPausedRef.current = false; })

    // --- Timers ---
    const rotationTimer = d3.timer(() => {
      if (!isPausedRef.current) {
        rotationRef.current += 0.05
        const rotation = rotationRef.current
        
        // Update main group rotation
        d3.select(gRef.current).attr("transform", `translate(${width / 2},${height / 2}) rotate(${rotation})`)
        
        // Dynamic Label Flip: Boundary on Y-axis (top/bottom)
        g.selectAll(".group text")
          .attr("transform", (d: any) => {
            const currentAngleDeg = (d.angle * 180 / Math.PI) + rotation
            const normalizedAngle = ((currentAngleDeg % 360) + 360) % 360
            
            // Flip if the label is in the left hemisphere (180 to 360 degrees)
            const shouldFlip = normalizedAngle > 180 && normalizedAngle < 360
            
            return `
              rotate(${(d.angle * 180 / Math.PI - 90)})
              translate(${expBaseRadius + expMaxHeight + 20})
              ${shouldFlip ? "rotate(180)" : ""}
            `
          })
          .attr("text-anchor", (d: any) => {
             const currentAngleDeg = (d.angle * 180 / Math.PI) + rotation
             const normalizedAngle = ((currentAngleDeg % 360) + 360) % 360
             return (normalizedAngle > 180 && normalizedAngle < 360) ? "end" : "start"
          })
      }
    })

    const updateActivity = () => {
      if (isPausedRef.current) return
      
      const svgEl = d3.select(svgRef.current)

      // 1. Update Expression Horizon
      expressionDataRef.current.forEach(p => {
        p.value = Math.max(0.05, Math.min(1.0, p.value + (Math.random() - 0.5) * 0.12))
      })

      horizonGroups
        .transition().duration(1000).ease(d3.easeLinear)
        .attr("d", (d: any) => {
          const chrPoints = expressionDataRef.current.filter(p => p.chrIndex === d.index)
          return area(chrPoints)
        })

      // 2. Pulse Ribbons (Biological Activity)
      // Opacidades del pulso: 0.70 (pico) y 0.3 (tras decaimiento). El fill ya está en los ribbons.
      const allRibbons = svgEl.selectAll<SVGPathElement, any>(".ribbon")
      const rSize = allRibbons.size()
      if (rSize > 0) {
        const rIndices = Array.from({length: 6}, () => Math.floor(Math.random() * rSize))
        allRibbons.filter((_d, i) => rIndices.includes(i))
          .transition()
          .duration(800)
          .style("fill-opacity", 0.70)   // ← Opacidad en el pico del pulso
          .transition()
          .duration(1500)
          .style("fill-opacity", 0.3)    // ← Opacidad tras el pulso (antes de volver a 0.1)
      }
    }

    const activityTimer = d3.interval(updateActivity, 1000)

    return () => { 
      rotationTimer.stop()
      activityTimer.stop() 
    }
  }, [])

  // Interaction Styles (hover sobre ribbons y arcos)
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    
    const ribbonColors = ['#004aad', '#2f9c95']

    svg.selectAll<SVGPathElement, any>(".ribbon")
      .interrupt().transition().duration(200)
      .style("fill", (_d: any, i: number) => {
        if (hoveredRibbon?.source === _d.source.index && hoveredRibbon?.target === _d.target.index) {
          return d3.rgb(ribbonColors[i % ribbonColors.length]).brighter(0.8).toString()
        }
        if (hoveredIndex !== null && (_d.source.index === hoveredIndex || _d.target.index === hoveredIndex)) {
          return ribbonColors[i % ribbonColors.length]
        }
        return ribbonColors[i % ribbonColors.length]
      })
      .style("fill-opacity", (d: any) => {
        // Si hay hover en ribbon específico
        if (hoveredRibbon) {
          if (hoveredRibbon.source === d.source.index && hoveredRibbon.target === d.target.index) {
            return 0.85  // Ribbon seleccionado: opacidad fuerte
          }
          return 0.08   // Todos los demás: muy tenue
        }
        
        // Si hay hover en cromosoma
        if (hoveredIndex !== null) {
          if (d.source.index === hoveredIndex || d.target.index === hoveredIndex) {
            return 0.85   // Ribbons conectados al cromosoma: opacidad fuerte
          }
          return 0.08    // Todos los demás: muy tenue
        }
        
        // Sin hover: opacidad normal
        return 0.35
      })
      .style("stroke-opacity", (d: any) => {
        // Si hay hover en ribbon específico
        if (hoveredRibbon) {
          if (hoveredRibbon.source === d.source.index && hoveredRibbon.target === d.target.index) {
            return 1       // Ribbon seleccionado: stroke visible
          }
          return 0.08     // Todos los demás: stroke muy tenue
        }
        
        // Si hay hover en cromosoma
        if (hoveredIndex !== null) {
          if (d.source.index === hoveredIndex || d.target.index === hoveredIndex) {
            return 1        // Ribbons conectados al cromosoma: stroke visible
          }
          return 0.08      // Todos los demás: stroke muy tenue
        }
        
        // Sin hover: stroke normal
        return 1
      })

    svg.selectAll<SVGPathElement, any>(".arc")
      .transition().duration(200)
      .style("fill", (d: any) => (hoveredRibbon?.source === d.index || hoveredRibbon?.target === d.index) || hoveredIndex === d.index ? '#004aad' : '#cbd5e1')
      .style("opacity", (d: any) => (hoveredRibbon ? (d.index === hoveredRibbon.source || d.index === hoveredRibbon.target ? 1 : 0.2) : hoveredIndex !== null ? (d.index === hoveredIndex ? 1 : 0.3) : 1))

    const grayScale = d3.scaleOrdinal<number, string>()
      .domain(d3.range(12))
      .range(['#cbd5e1', '#94a3b8', '#64748b', '#cbd5e1', '#94a3b8', '#64748b', '#cbd5e1', '#94a3b8', '#64748b', '#cbd5e1', '#94a3b8', '#64748b'])

    svg.selectAll<SVGPathElement, any>(".horizon-chr")
      .transition().duration(200)
      .style("fill", (d: any) => (hoveredRibbon?.source === d.index || hoveredRibbon?.target === d.index) || hoveredIndex === d.index ? '#004aad' : grayScale(d.index))
      .style("stroke", (d: any) => (hoveredRibbon?.source === d.index || hoveredRibbon?.target === d.index) || hoveredIndex === d.index ? '#004aad' : '#64748b')
      .style("opacity", (d: any) => (hoveredRibbon ? (d.index === hoveredRibbon.source || d.index === hoveredRibbon.target ? 1.0 : 0.1) : hoveredIndex !== null ? (d.index === hoveredIndex ? 1.0 : 0.1) : 0.4))

  }, [hoveredIndex, hoveredRibbon])

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-auto overflow-visible">
      <svg ref={svgRef} viewBox="0 0 1000 1000" className="w-full h-full min-w-[140%] min-h-[140%] object-contain" preserveAspectRatio="xMidYMid meet" />
    </div>
  )
}
