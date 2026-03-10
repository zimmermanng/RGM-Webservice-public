// radialBarChart.js
import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

const RadialBarChart = ({ data, activeCompany = 'Shuffle' }) => {
  const svgRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const lastInputTypeRef = useRef('mouse');

  // ----- Constants -----
  const width = 1700;
  const height = 1400;
  const margin = 160;
  const radius = Math.min(width, height) / 2 - margin;
  const innerRadius = 100;
  const labelRingThickness = 80;
  const groupRingThickness = 80;
  const maxValue = 5;
  const numTicks = 5;
  const maxCharsPerLine = 20;

  // Track last input type (keyboard/mouse/touch) once with cleanup
  useEffect(() => {
    const onMouseDown = () => (lastInputTypeRef.current = 'mouse');
    const onKeyDown = () => (lastInputTypeRef.current = 'keyboard');
    const onTouchStart = () => (lastInputTypeRef.current = 'touch');

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', onTouchStart);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  // CSS variable colors
  const styles = getComputedStyle(document.documentElement);
  const colorScale = d3
    .scaleOrdinal()
    .domain(['Beratung und Support', 'Lehren und Lernen', 'Struktur', 'Strategie'])
    .range([
      styles.getPropertyValue('--range_1-color').trim(),
      styles.getPropertyValue('--range_2-color').trim(),
      styles.getPropertyValue('--range_3-color').trim(),
      styles.getPropertyValue('--range_4-color').trim(),
    ]);

  // Luminance helpers for text contrast
  const getLuminance = (color) => {
    const rgb = d3.color(color).rgb();
    const [r, g, b] = [rgb.r, rgb.g, rgb.b]
      .map((c) => c / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const getTextColor = (bgColor) => (getLuminance(bgColor) > 0.5 ? 'black' : 'white');

  // Accept external data
  useEffect(() => {
    if (data && data.length > 0) setChartData(data);
  }, [data]);

  // Choose the logo shown in the center by company
  const getCenterLogo = () => {
    if (activeCompany === 'LMZ') return '/LMZ-Logo-rund.png';
    if (activeCompany === 'Shuffle') return '/shuffle-logo.svg';
    return '/LMZ-Logo-rund.png'; // fallback
  };

  // Draw the chart
  const drawChart = () => {
    if (!chartData || chartData.length === 0) return;

    // Clear previous render
    const root = d3.select(svgRef.current);
    root.selectAll('*').remove();

    const svg = root
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'region')
      .attr('aria-label', 'Diagramm zur Visualisierung der RGM-Ergebnisse.')
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const radialScale = d3.scaleLinear().domain([0, numTicks]).range([innerRadius, radius]);

    const angleStep = (2 * Math.PI) / chartData.length;
    const uniqueGroups = [...new Set(chartData.map((d) => d.group))];

    // Arc generator helper
    const createArcGenerator = (innerR, outerR, startA, endA) =>
      d3.arc().innerRadius(innerR).outerRadius(outerR).startAngle(startA).endAngle(endA);

    // Label wrapping for categories
    const wrapText = (text, maxChars) => {
      const words = text.split(' ');
      const lines = [];
      let current = '';
      words.forEach((w) => {
        if (current.length + w.length + 1 <= maxChars) {
          current += (current ? ' ' : '') + w;
        } else {
          lines.push(current);
          current = w;
        }
      });
      if (current) lines.push(current);
      return lines;
    };

    const placeTextAlongArcs = (text, angle, nextAngle, r, lines) => {
      const lineHeight = Math.max(20, 40 / lines.length);
      lines.forEach((line, idx) => {
        const arc = createArcGenerator(
          r - idx * lineHeight,
          r + labelRingThickness / 2 - (idx + 1) * lineHeight,
          angle,
          nextAngle
        );
        const pathId = `category-path-${text}-${idx}-${Math.random().toString(36).slice(2)}`;
        svg
          .append('path')
          .attr('id', pathId)
          .attr('d', arc)
          .attr('fill', 'none')
          .attr('aria-hidden', 'true');

        svg
          .append('text')
          .append('textPath')
          .attr('xlink:href', `#${pathId}`)
          .attr('startOffset', '24%')
          .attr('fill', 'black')
          .attr('font-size', '16px')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .text(line)
          .attr('aria-hidden', 'true');
      });
    };

    const createTooltip = (svgSel, x, y, lines) => {
      const screenWidth = window.innerWidth;
      let fontSize = 18;
      if (screenWidth < 600) fontSize = 30;
      else if (screenWidth < 1000) fontSize = 20;

      const g = svgSel
        .append('g')
        .attr('id', 'tooltip-group')
        .attr('transform', `translate(${x}, ${y})`)
        .attr('pointer-events', 'none');

      lines.forEach((line, i) => {
        g.append('text')
          .text(line)
          .attr('x', 0)
          .attr('y', -35 + i * (fontSize * 1.2))
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', fontSize);
      });

      const bbox = g.node().getBBox();
      const padding = 10;
      g.insert('rect', ':first-child')
        .attr('x', bbox.x - padding)
        .attr('y', bbox.y - padding)
        .attr('width', bbox.width + 2 * padding)
        .attr('height', bbox.height + 2 * padding)
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('rx', 8)
        .attr('ry', 8);

      return g;
    };

    const createFocus = (innerR, r, labelThickness, angle, nextAngle) => {
      const focusArc = createArcGenerator(innerR, r + labelThickness, angle, nextAngle);
      svg
        .append('path')
        .attr('id', 'focus-ring')
        .attr('d', focusArc)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 8);

      const focusArcInner = createArcGenerator(innerR, r + labelThickness, angle, nextAngle);
      svg
        .append('path')
        .attr('id', 'focus-ring')
        .attr('d', focusArcInner)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    };

    // Draw each bar/segment
    let mouseX = null;
    let mouseY = null;

    // Use the SVG root for coordinate reference
    root.on('mousedown', function (event) {
      const [x, y] = d3.pointer(event, svg.node());
      mouseX = x;
      mouseY = y;
    });

    chartData.forEach((d, i) => {
      const angle = i * angleStep;
      const nextAngle = angle + angleStep;
      const outerRadius = radialScale(d.value);

      // Grey background (unreached)
      const grey = createArcGenerator(innerRadius, radialScale(maxValue), angle, nextAngle);
      svg
        .append('path')
        .attr('class', 'unreached-bar')
        .attr('d', grey)
        .attr('fill', '#F1F1F1')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('aria-hidden', 'true');

      // Actual bar
      const bar = createArcGenerator(innerRadius, outerRadius, angle, nextAngle);
      svg
        .append('path')
        .attr('class', 'bar')
        .attr('d', bar)
        .attr('fill', colorScale(d.group))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('aria-hidden', 'true');

      // Top black cap
      const cap = createArcGenerator(outerRadius, outerRadius + 8, angle, nextAngle);
      svg
        .append('path')
        .attr('class', 'top-arc')
        .attr('d', cap)
        .attr('fill', 'black')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('aria-hidden', 'true');

      // Label background ring
      const outerRing = createArcGenerator(radius + 8, radius + labelRingThickness, angle, nextAngle);
      svg
        .append('path')
        .attr('class', 'outer-ring')
        .attr('d', outerRing)
        .attr('fill', '#D9D9D9')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr('aria-hidden', 'true');

      // Screen reader label
      const adjustedValue = d.value - 1;
      const valueText = adjustedValue === -1 ? 'Keine Einstufung vorhanden' : adjustedValue;
      const LabelText = `Dimension: ${d.group}, Themenfeld: ${d.category}, Stufe: ${valueText}, Drücken Sie Enter für Details`;

      // Focus overlay (keyboard/mouse)
      const overlayArcGenerator = createArcGenerator(
        innerRadius + 4,
        radius + labelRingThickness + 4,
        angle,
        nextAngle
      );
      const overlayPath = svg
        .append('path')
        .attr('class', 'overlay')
        .attr('d', overlayArcGenerator)
        .attr('fill', 'transparent')
        .attr('tabindex', '0')
        .attr('data-index', i)
        .attr('aria-label', LabelText);

      overlayPath.on('focus', function () {
        d3.select('#focus-ring').remove();
        d3.select('#tooltip-group').remove();

        createFocus(innerRadius, radius, labelRingThickness, angle, nextAngle);
        const texts = [`Dimension: ${d.group}`, `Themenfeld: ${d.category}`, `Stufe: ${valueText}`];

        const arcCenterAngle = (angle + nextAngle) / 2;
        const offsetX = 90;

        if (lastInputTypeRef.current === 'mouse' && mouseX !== null) {
          const x = mouseX < 0 ? mouseX + offsetX : mouseX - offsetX;
          const y = mouseY - 20;
          createTooltip(svg, x, y, texts);
        } else {
          const y = (-(radius + labelRingThickness) * Math.cos(arcCenterAngle)) * 0.75;
          const x = ((radius + labelRingThickness) * Math.sin(arcCenterAngle)) * 0.75;
          createTooltip(svg, x, y, texts);
        }

        overlayPath.on('mousedown', function (event) {
          d3.select('#tooltip-group').remove();
          const [x0, y0] = d3.pointer(event, svg.node());
          const x = x0 < 0 ? x0 + offsetX : x0 - offsetX;
          const y = y0 - 20;
          createTooltip(svg, x, y, texts);
        });
      });

      overlayPath.on('blur', function () {
        d3.select('#focus-ring').remove();
        d3.select('#tooltip-group').remove();
      });

      // Category labels
      const categoryLines = wrapText(d.category, maxCharsPerLine);
      placeTextAlongArcs(d.category, angle, nextAngle, radius + labelRingThickness / 2, categoryLines);
    });

    // Group rings + labels
    uniqueGroups.forEach((group, idx) => {
      const groupData = chartData.filter((d) => d.group === group);
      const groupStartAngle = chartData.findIndex((d) => d.group === group) * angleStep;
      const groupEndAngle = groupStartAngle + groupData.length * angleStep;

      const groupArc = createArcGenerator(
        radius + labelRingThickness,
        radius + labelRingThickness + groupRingThickness,
        groupStartAngle,
        groupEndAngle
      );

      svg
        .append('path')
        .attr('class', 'group-ring')
        .attr('d', groupArc)
        .attr('fill', colorScale(group))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('aria-hidden', 'true');

      const pathId = `group-path-${idx}-${Math.random().toString(36).slice(2)}`;
      const groupColor = colorScale(group);
      const textColor = getTextColor(groupColor);
      const groupPath = createArcGenerator(
        radius + labelRingThickness + groupRingThickness / 2,
        radius + labelRingThickness + groupRingThickness / 2,
        groupStartAngle,
        groupEndAngle
      );

      svg.append('path').attr('id', pathId).attr('d', groupPath).attr('aria-hidden', 'true');

      svg
        .append('text')
        .append('textPath')
        .attr('xlink:href', `#${pathId}`)
        .attr('startOffset', '25%')
        .attr('fill', textColor)
        .attr('font-size', '35px')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(group)
        .attr('aria-hidden', 'true');
    });

    // Circular grid ticks
    const ticks = d3.range(1, numTicks + 1);
    ticks.forEach((tick) => {
      const tickRadius = radialScale(tick);
      const tickPath = d3
        .arc()
        .innerRadius(tickRadius)
        .outerRadius(tickRadius)
        .startAngle(0)
        .endAngle(2 * Math.PI);
      svg
        .append('path')
        .attr('class', 'tick')
        .attr('d', tickPath)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('aria-hidden', 'true');
    });

    // Center logo (dynamic)
    const logoImage = getCenterLogo();
    const logoSize = Math.min(innerRadius * 1.5, 200);

    svg.append('title').text(
      activeCompany === 'LMZ'
        ? 'LMZ Logo'
        : activeCompany === 'Shuffle'
        ? 'Shuffle Logo'
        : 'Logo'
    );

    svg
      .append('image')
      .attr('xlink:href', logoImage)
      .attr('x', -logoSize / 2)
      .attr('y', -logoSize / 2)
      .attr('width', logoSize)
      .attr('height', logoSize)
      .attr('aria-hidden', 'true');
  };

  // Redraw when data or company changes
  useEffect(() => {
    if (chartData) drawChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, activeCompany]);

  return (
    <>
      <style>{`.overlay:focus { outline: none; }`}</style>
      <svg ref={svgRef} />
    </>
  );
};

export default RadialBarChart;
