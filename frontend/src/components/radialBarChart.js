import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const WIDTH = 1700;
const HEIGHT = 1400;
const MARGIN = 160;
const INNER_RADIUS = 100;
const LABEL_RING_THICKNESS = 80;
const GROUP_RING_THICKNESS = 80;
const MAX_VALUE = 5;
const NUM_TICKS = 5;
const MAX_CHARS_PER_LINE = 20;
const CATEGORY_FONT_SIZE = 16;
const CATEGORY_LINE_HEIGHT = 20;

const COMPANY_LOGOS = {
  LMZ: '/LMZ-Logo-rund.png',
  Shuffle: '/shuffle-logo.svg',
};

const normalizeCompany = (company) => {
  if (typeof company !== 'string') return 'LMZ';

  const normalized = company.trim().toLowerCase();

  if (normalized === 'shuffle') return 'Shuffle';
  if (normalized === 'lmz') return 'LMZ';

  return 'LMZ';
};

const wrapText = (text = '', maxChars = MAX_CHARS_PER_LINE) => {
  const words = text.split(' ').filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxChars) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [''];
};

const getLuminance = (color) => {
  const parsedColor = d3.color(color);
  if (!parsedColor) return 0;

  const rgb = parsedColor.rgb();
  const [r, g, b] = [rgb.r, rgb.g, rgb.b]
    .map((channel) => channel / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getTextColor = (backgroundColor) =>
  getLuminance(backgroundColor) > 0.5 ? 'black' : 'white';

const RadialBarChart = ({ data = [], activeCompany }) => {
  const svgRef = useRef(null);
  const lastInputTypeRef = useRef('mouse');
  const [chartData, setChartData] = useState([]);

  const radius = Math.min(WIDTH, HEIGHT) / 2 - MARGIN;
  const resolvedCompany = useMemo(() => normalizeCompany(activeCompany), [activeCompany]);
  const centerLogo = COMPANY_LOGOS[resolvedCompany] || COMPANY_LOGOS.LMZ;

  const colorScale = useMemo(() => {
    if (typeof window === 'undefined') {
      return d3
        .scaleOrdinal()
        .domain(['Beratung und Support', 'Lehren und Lernen', 'Struktur', 'Strategie'])
        .range(['#D9D9D9', '#C4C4C4', '#AFAFAF', '#9A9A9A']);
    }

    const styles = getComputedStyle(document.documentElement);

    return d3
      .scaleOrdinal()
      .domain(['Beratung und Support', 'Lehren und Lernen', 'Struktur', 'Strategie'])
      .range([
        styles.getPropertyValue('--range_1-color').trim(),
        styles.getPropertyValue('--range_2-color').trim(),
        styles.getPropertyValue('--range_3-color').trim(),
        styles.getPropertyValue('--range_4-color').trim(),
      ]);
  }, []);

  useEffect(() => {
    const onMouseDown = () => {
      lastInputTypeRef.current = 'mouse';
    };

    const onKeyDown = () => {
      lastInputTypeRef.current = 'keyboard';
    };

    const onTouchStart = () => {
      lastInputTypeRef.current = 'touch';
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', onTouchStart);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  useEffect(() => {
    setChartData(Array.isArray(data) ? data : []);
  }, [data]);

  useEffect(() => {
    if (!chartData.length || !svgRef.current) return;

    const root = d3.select(svgRef.current);
    root.selectAll('*').remove();

    const svg = root
      .attr('width', WIDTH)
      .attr('height', HEIGHT)
      .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
      .attr('role', 'region')
      .attr('aria-label', 'Diagramm zur Visualisierung der RGM-Ergebnisse.')
      .append('g')
      .attr('transform', `translate(${WIDTH / 2}, ${HEIGHT / 2})`);

    const radialScale = d3.scaleLinear().domain([0, NUM_TICKS]).range([INNER_RADIUS, radius]);
    const angleStep = (2 * Math.PI) / chartData.length;
    const uniqueGroups = [...new Set(chartData.map((entry) => entry.group))];

    const createArc = (innerR, outerR, startAngle, endAngle) =>
      d3.arc().innerRadius(innerR).outerRadius(outerR).startAngle(startAngle).endAngle(endAngle);

    const createTooltip = (svgSelection, x, y, lines) => {
      const screenWidth = window.innerWidth;
      let fontSize = 18;

      if (screenWidth < 600) fontSize = 30;
      else if (screenWidth < 1000) fontSize = 20;

      const tooltipGroup = svgSelection
        .append('g')
        .attr('id', 'tooltip-group')
        .attr('transform', `translate(${x}, ${y})`)
        .attr('pointer-events', 'none');

      lines.forEach((line, index) => {
        tooltipGroup
          .append('text')
          .text(line)
          .attr('x', 0)
          .attr('y', -35 + index * (fontSize * 1.2))
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', fontSize);
      });

      const bbox = tooltipGroup.node().getBBox();
      const padding = 10;

      tooltipGroup
        .insert('rect', ':first-child')
        .attr('x', bbox.x - padding)
        .attr('y', bbox.y - padding)
        .attr('width', bbox.width + 2 * padding)
        .attr('height', bbox.height + 2 * padding)
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('rx', 8)
        .attr('ry', 8);

      return tooltipGroup;
    };

    const createFocus = (startAngle, endAngle) => {
      const focusArc = createArc(
        INNER_RADIUS,
        radius + LABEL_RING_THICKNESS,
        startAngle,
        endAngle
      );

      svg
        .append('path')
        .attr('id', 'focus-ring')
        .attr('d', focusArc)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 8);

      svg
        .append('path')
        .attr('id', 'focus-ring-inner')
        .attr('d', focusArc)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    };

    const placeCategoryText = (category, startAngle, endAngle) => {
      const lines = wrapText(category);
      const middleAngle = (startAngle + endAngle) / 2;
      const labelRadius = radius + LABEL_RING_THICKNESS / 2;
      const x = Math.sin(middleAngle) * labelRadius;
      const y = -Math.cos(middleAngle) * labelRadius;
      const rotation = (middleAngle * 180) / Math.PI;
      const totalHeight = (lines.length - 1) * CATEGORY_LINE_HEIGHT;

      const labelGroup = svg
        .append('g')
        .attr('transform', `translate(${x}, ${y}) rotate(${rotation})`)
        .attr('aria-hidden', 'true');

      lines.forEach((line, lineIndex) => {
        labelGroup
          .append('text')
          .text(line)
          .attr('x', 0)
          .attr('y', lineIndex * CATEGORY_LINE_HEIGHT - totalHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', 'black')
          .attr('font-size', `${CATEGORY_FONT_SIZE}px`);
      });
    };

    let mouseX = null;
    let mouseY = null;

    root.on('mousedown', function handleRootMouseDown(event) {
      const [x, y] = d3.pointer(event, svg.node());
      mouseX = x;
      mouseY = y;
    });

    chartData.forEach((entry, index) => {
      const startAngle = index * angleStep;
      const endAngle = startAngle + angleStep;
      const outerRadius = radialScale(entry.value);
      const adjustedValue = entry.value - 1;
      const valueText = adjustedValue === -1 ? 'Keine Einstufung vorhanden' : adjustedValue;
      const ariaLabel = `Dimension: ${entry.group}, Themenfeld: ${entry.category}, Stufe: ${valueText}, Drücken Sie Enter für Details`;

      svg
        .append('path')
        .attr('class', 'unreached-bar')
        .attr('d', createArc(INNER_RADIUS, radialScale(MAX_VALUE), startAngle, endAngle))
        .attr('fill', '#F1F1F1')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('aria-hidden', 'true');

      svg
        .append('path')
        .attr('class', 'bar')
        .attr('d', createArc(INNER_RADIUS, outerRadius, startAngle, endAngle))
        .attr('fill', colorScale(entry.group))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('aria-hidden', 'true');

      svg
        .append('path')
        .attr('class', 'top-arc')
        .attr('d', createArc(outerRadius, outerRadius + 8, startAngle, endAngle))
        .attr('fill', 'black')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('aria-hidden', 'true');

      svg
        .append('path')
        .attr('class', 'outer-ring')
        .attr('d', createArc(radius + 8, radius + LABEL_RING_THICKNESS, startAngle, endAngle))
        .attr('fill', '#D9D9D9')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr('aria-hidden', 'true');

      const overlay = svg
        .append('path')
        .attr('class', 'overlay')
        .attr(
          'd',
          createArc(INNER_RADIUS + 4, radius + LABEL_RING_THICKNESS + 4, startAngle, endAngle)
        )
        .attr('fill', 'transparent')
        .attr('tabindex', '0')
        .attr('data-index', index)
        .attr('aria-label', ariaLabel);

      overlay.on('focus', function handleFocus() {
        d3.select('#focus-ring').remove();
        d3.select('#focus-ring-inner').remove();
        d3.select('#tooltip-group').remove();

        createFocus(startAngle, endAngle);

        const tooltipLines = [
          `Dimension: ${entry.group}`,
          `Themenfeld: ${entry.category}`,
          `Stufe: ${valueText}`,
        ];

        const centerAngle = (startAngle + endAngle) / 2;
        const offsetX = 90;

        if (lastInputTypeRef.current === 'mouse' && mouseX !== null && mouseY !== null) {
          const x = mouseX < 0 ? mouseX + offsetX : mouseX - offsetX;
          const y = mouseY - 20;
          createTooltip(svg, x, y, tooltipLines);
        } else {
          const y = (-(radius + LABEL_RING_THICKNESS) * Math.cos(centerAngle)) * 0.75;
          const x = ((radius + LABEL_RING_THICKNESS) * Math.sin(centerAngle)) * 0.75;
          createTooltip(svg, x, y, tooltipLines);
        }
      });

      overlay.on('mousedown', function handleMouseDown(event) {
        d3.select('#tooltip-group').remove();

        const tooltipLines = [
          `Dimension: ${entry.group}`,
          `Themenfeld: ${entry.category}`,
          `Stufe: ${valueText}`,
        ];

        const [x0, y0] = d3.pointer(event, svg.node());
        const x = x0 < 0 ? x0 + 90 : x0 - 90;
        const y = y0 - 20;
        createTooltip(svg, x, y, tooltipLines);
      });

      overlay.on('blur', function handleBlur() {
        d3.select('#focus-ring').remove();
        d3.select('#focus-ring-inner').remove();
        d3.select('#tooltip-group').remove();
      });

      placeCategoryText(entry.category, startAngle, endAngle);
    });

    uniqueGroups.forEach((group, index) => {
      const firstGroupIndex = chartData.findIndex((entry) => entry.group === group);
      const groupItems = chartData.filter((entry) => entry.group === group);
      const groupStartAngle = firstGroupIndex * angleStep;
      const groupEndAngle = groupStartAngle + groupItems.length * angleStep;
      const groupColor = colorScale(group);
      const groupPathId = `group-path-${index}-${Math.random().toString(36).slice(2)}`;

      svg
        .append('path')
        .attr('class', 'group-ring')
        .attr(
          'd',
          createArc(
            radius + LABEL_RING_THICKNESS,
            radius + LABEL_RING_THICKNESS + GROUP_RING_THICKNESS,
            groupStartAngle,
            groupEndAngle
          )
        )
        .attr('fill', groupColor)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('aria-hidden', 'true');

      svg
        .append('path')
        .attr('id', groupPathId)
        .attr(
          'd',
          createArc(
            radius + LABEL_RING_THICKNESS + GROUP_RING_THICKNESS / 2,
            radius + LABEL_RING_THICKNESS + GROUP_RING_THICKNESS / 2,
            groupStartAngle,
            groupEndAngle
          )
        )
        .attr('fill', 'none')
        .attr('aria-hidden', 'true');

      svg
        .append('text')
        .append('textPath')
        .attr('xlink:href', `#${groupPathId}`)
        .attr('startOffset', '25%')
        .attr('fill', getTextColor(groupColor))
        .attr('font-size', '35px')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(group)
        .attr('aria-hidden', 'true');
    });

    d3.range(1, NUM_TICKS + 1).forEach((tick) => {
      const tickRadius = radialScale(tick);

      svg
        .append('path')
        .attr('class', 'tick')
        .attr(
          'd',
          d3
            .arc()
            .innerRadius(tickRadius)
            .outerRadius(tickRadius)
            .startAngle(0)
            .endAngle(2 * Math.PI)
        )
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('aria-hidden', 'true');
    });

    const logoSize = Math.min(INNER_RADIUS * 1.5, 200);

    svg.append('title').text(`${resolvedCompany} Logo`);

    svg
      .append('image')
      .attr('xlink:href', centerLogo)
      .attr('x', -logoSize / 2)
      .attr('y', -logoSize / 2)
      .attr('width', logoSize)
      .attr('height', logoSize)
      .attr('aria-hidden', 'true');
  }, [chartData, colorScale, radius, resolvedCompany, centerLogo]);

  return (
    <>
      <style>{`.overlay:focus { outline: none; }`}</style>
      <svg ref={svgRef} />
    </>
  );
};

export default RadialBarChart;
