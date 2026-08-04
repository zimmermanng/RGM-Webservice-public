import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

const WIDTH = 1700;
const HEIGHT = 1400;
const MARGIN = 160;
const INNER_RADIUS = 100;
const LABEL_RING_THICKNESS = 80;
const GROUP_RING_THICKNESS = 80;
const DEFAULT_MAX_VALUE = 5;
const DEFAULT_NUM_TICKS = 5;
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

const getTextColor = (backgroundColor) => {
  const backgroundLuminance = getLuminance(backgroundColor);
  const contrastWithBlack = (backgroundLuminance + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (backgroundLuminance + 0.05);

  return contrastWithBlack >= contrastWithWhite ? '#000000' : '#ffffff';
};

const RadialBarChart = ({
  data = [],
  activeCompany,
  ariaLabel = 'Diagramm zur Visualisierung der RGM-Ergebnisse.',
  showGroupRing = true,
  showCategoryLabels = true,
  maxValue = DEFAULT_MAX_VALUE,
  numTicks = DEFAULT_NUM_TICKS,
  valueOffset = -1,
  labelMaxChars = MAX_CHARS_PER_LINE,
  categoryFontSize = CATEGORY_FONT_SIZE,
  categoryLineHeight = CATEGORY_LINE_HEIGHT,
  labelRingThickness = LABEL_RING_THICKNESS,
  showTickLabels = true,
  tickLabelOffset = valueOffset,
  onSegmentClick,
  segmentActionText,
}) => {
  const svgRef = useRef(null);
  const chartIdRef = useRef(`radial-chart-${Math.random().toString(36).slice(2)}`);
  const lastInputTypeRef = useRef('mouse');
  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const radius = Math.min(WIDTH, HEIGHT) / 2 - MARGIN;
  const resolvedCompany = useMemo(() => normalizeCompany(activeCompany), [activeCompany]);
  const centerLogo = COMPANY_LOGOS[resolvedCompany] || COMPANY_LOGOS.LMZ;
  const labelOuterRadius = showCategoryLabels ? radius + labelRingThickness : radius;
  const focusOuterRadius = labelOuterRadius;

  const colorScale = useMemo(() => {
    if (typeof window === 'undefined') {
      return d3
        .scaleOrdinal()
        .domain(['Beratung und Support', 'Lehren und Lernen', 'Struktur', 'Strategie'])
        .range(['#D9D9D9', '#C4C4C4', '#AFAFAF', '#9A9A9A']);
    }

    const styles = getComputedStyle(document.body);

    return d3
      .scaleOrdinal()
      .domain(['Beratung und Support', 'Lehren und Lernen', 'Struktur', 'Strategie', 'Paeckchen'])
      .range([
        styles.getPropertyValue('--range_1-color').trim(),
        styles.getPropertyValue('--range_2-color').trim(),
        styles.getPropertyValue('--range_3-color').trim(),
        styles.getPropertyValue('--range_4-color').trim(),
        styles.getPropertyValue('--brand-accent').trim(),
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

  useLayoutEffect(() => {
    if (!svgRef.current) return;

    const root = d3.select(svgRef.current);
    root.selectAll('*').remove();

    if (!chartData.length) return;

    const svg = root
      .attr('width', WIDTH)
      .attr('height', HEIGHT)
      .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
      .attr('role', 'region')
      .attr('aria-label', ariaLabel)
      .append('g')
      .attr('transform', `translate(${WIDTH / 2}, ${HEIGHT / 2})`);

    const groupOrder = new Map();
    chartData.forEach((entry) => {
      const group = entry.group || '';
      if (!groupOrder.has(group)) groupOrder.set(group, groupOrder.size);
    });
    const renderData = showGroupRing
      ? [...chartData].sort(
          (a, b) => (groupOrder.get(a.group || '') ?? 0) - (groupOrder.get(b.group || '') ?? 0)
        )
      : chartData;
    const radialScale = d3.scaleLinear().domain([0, numTicks]).range([INNER_RADIUS, radius]);
    const angleStep = (2 * Math.PI) / renderData.length;
    const groupSegments = [];

    renderData.forEach((entry, index) => {
      const group = entry.group || '';
      const currentSegment = groupSegments[groupSegments.length - 1];

      if (currentSegment && currentSegment.group === group) {
        currentSegment.endIndex = index + 1;
        currentSegment.items.push(entry);
      } else {
        groupSegments.push({
          group,
          startIndex: index,
          endIndex: index + 1,
          items: [entry],
        });
      }
    });

    const createArc = (innerR, outerR, startAngle, endAngle) =>
      d3.arc().innerRadius(innerR).outerRadius(outerR).startAngle(startAngle).endAngle(endAngle);

    const formatValueText = (entry) => {
      if (entry.displayValue != null) return entry.displayValue;
      const adjustedValue = entry.value + valueOffset;
      return adjustedValue === -1 ? 'Keine Einstufung vorhanden' : adjustedValue;
    };

    const createTooltip = (svgSelection, x, y, lines, entry) => {
      const screenWidth = window.innerWidth;
      let fontSize = 18;

      if (screenWidth < 600) fontSize = 30;
      else if (screenWidth < 1000) fontSize = 20;

      const tooltipGroup = svgSelection
        .append('g')
        .attr('id', 'tooltip-group')
        .attr('transform', `translate(${x}, ${y})`)
        .attr('pointer-events', segmentActionText ? 'all' : 'none');

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

      if (segmentActionText && onSegmentClick) {
        const actionY = -35 + lines.length * (fontSize * 1.2);
        const action = tooltipGroup
          .append('a')
          .attr('href', '#')
          .attr('role', 'link')
          .attr('aria-label', `${segmentActionText}: ${entry.category}`)
          .on('mousedown', (event) => event.preventDefault())
          .on('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            onSegmentClick(entry);
          });

        action
          .append('text')
          .text(segmentActionText)
          .attr('x', 0)
          .attr('y', actionY)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', fontSize)
          .attr('font-weight', '700')
          .attr('text-decoration', 'underline')
          .attr('fill', '#000000')
          .style('cursor', 'pointer');
      }

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
      const focusArc = createArc(INNER_RADIUS, focusOuterRadius, startAngle, endAngle);

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

      // Keep the numbered level badges readable above the segment focus ring.
      svg.selectAll('.tick-label-badge').raise();
    };

    const createCircularPath = (pathRadius, startAngle, endAngle, reverse = false) => {
      const fromAngle = reverse ? endAngle : startAngle;
      let toAngle = reverse ? startAngle : endAngle;
      const angleSpan = Math.abs(endAngle - startAngle);

      if (angleSpan >= Math.PI * 2 - 0.001) {
        toAngle += reverse ? 0.001 : -0.001;
      }

      const start = {
        x: Math.sin(fromAngle) * pathRadius,
        y: -Math.cos(fromAngle) * pathRadius,
      };
      const end = {
        x: Math.sin(toAngle) * pathRadius,
        y: -Math.cos(toAngle) * pathRadius,
      };
      const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
      const sweepFlag = reverse ? 0 : 1;

      return `M ${start.x} ${start.y} A ${pathRadius} ${pathRadius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
    };

    const placeCategoryText = (category, startAngle, endAngle, index) => {
      const lines = wrapText(category, labelMaxChars);
      const middleAngle = (startAngle + endAngle) / 2;
      const totalHeight = (lines.length - 1) * categoryLineHeight;
      const reverseText = middleAngle > Math.PI / 2 && middleAngle < (3 * Math.PI) / 2;

      const labelGroup = svg
        .append('g')
        .attr('class', 'category-label')
        .attr('aria-hidden', 'true');

      lines.forEach((line, lineIndex) => {
        const lineOffset = lineIndex * categoryLineHeight - totalHeight / 2;
        const lineRadius = radius + labelRingThickness / 2 + lineOffset;
        const pathId = `${chartIdRef.current}-category-${index}-${lineIndex}`;

        labelGroup
          .append('path')
          .attr('id', pathId)
          .attr('d', createCircularPath(lineRadius, startAngle, endAngle, reverseText))
          .attr('fill', 'none');

        labelGroup
          .append('text')
          .attr('fill', 'black')
          .attr('font-size', `${categoryFontSize}px`)
          .attr('font-weight', '700')
          .attr('dominant-baseline', 'middle')
          .append('textPath')
          .attr('href', `#${pathId}`)
          .attr('xlink:href', `#${pathId}`)
          .attr('startOffset', '50%')
          .attr('text-anchor', 'middle')
          .text(line);
      });
    };

    let mouseX = null;
    let mouseY = null;

    root.on('mousedown', function handleRootMouseDown(event) {
      const [x, y] = d3.pointer(event, svg.node());
      mouseX = x;
      mouseY = y;
    });

    renderData.forEach((entry, index) => {
      const startAngle = index * angleStep;
      const endAngle = startAngle + angleStep;
      const clampedValue = Math.max(0, Math.min(maxValue, Number(entry.value) || 0));
      const outerRadius = radialScale(clampedValue);
      const valueText = formatValueText(entry);
      const groupLabel = entry.groupLabel || 'Dimension';
      const categoryLabel = entry.categoryLabel || 'Themenfeld';
      const activationHint = onSegmentClick
        ? segmentActionText
          ? `, Enter drücken für: ${segmentActionText}`
          : ', Aktivieren, um eine zugehörige Aktion auszuwählen'
        : '';
      const aria = entry.ariaLabel || `${groupLabel}: ${entry.group}, ${categoryLabel}: ${entry.category}, Stufe: ${valueText}${activationHint}`;

      svg
        .append('path')
        .attr('class', 'unreached-bar')
        .attr('d', createArc(INNER_RADIUS, radialScale(maxValue), startAngle, endAngle))
        .attr('fill', '#F1F1F1')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('aria-hidden', 'true');

      svg
        .append('path')
        .attr('class', 'bar')
        .attr('d', createArc(INNER_RADIUS, outerRadius, startAngle, endAngle))
        .attr('fill', entry.color || colorScale(entry.group))
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

      if (showCategoryLabels) {
        svg
          .append('path')
          .attr('class', 'outer-ring')
          .attr('d', createArc(radius + 8, radius + labelRingThickness, startAngle, endAngle))
          .attr('fill', '#D9D9D9')
          .attr('stroke', 'white')
          .attr('stroke-width', 3)
          .attr('aria-hidden', 'true');
      }

      const overlay = svg
        .append('path')
        .attr('class', 'overlay')
        .attr('d', createArc(INNER_RADIUS + 4, focusOuterRadius + 4, startAngle, endAngle))
        .attr('fill', 'transparent')
        .attr('tabindex', '0')
        .attr('role', onSegmentClick ? 'button' : 'img')
        .attr('data-index', index)
        .attr('aria-label', aria);

      const tooltipLines = [
        `${groupLabel}: ${entry.group}`,
        `${categoryLabel}: ${entry.category}`,
        `Stufe: ${valueText}`,
      ];

      overlay.on('focus', function handleFocus() {
        d3.select('#focus-ring').remove();
        d3.select('#focus-ring-inner').remove();
        d3.select('#tooltip-group').remove();

        createFocus(startAngle, endAngle);

        const centerAngle = (startAngle + endAngle) / 2;
        const offsetX = 90;

        if (lastInputTypeRef.current === 'mouse' && mouseX !== null && mouseY !== null) {
          const x = mouseX < 0 ? mouseX + offsetX : mouseX - offsetX;
          const y = mouseY - 20;
          createTooltip(svg, x, y, tooltipLines, entry);
        } else {
          const y = (-(focusOuterRadius) * Math.cos(centerAngle)) * 0.75;
          const x = (focusOuterRadius * Math.sin(centerAngle)) * 0.75;
          createTooltip(svg, x, y, tooltipLines, entry);
        }
      });

      overlay.on('mousedown', function handleMouseDown(event) {
        d3.select('#tooltip-group').remove();

        const [x0, y0] = d3.pointer(event, svg.node());
        const x = x0 < 0 ? x0 + 90 : x0 - 90;
        const y = y0 - 20;
        createTooltip(svg, x, y, tooltipLines, entry);
      });

      overlay.on('click', function handleClick() {
        if (onSegmentClick && !segmentActionText) onSegmentClick(entry);
      });

      overlay.on('keydown', function handleKeyDown(event) {
        if ((event.key === 'Enter' || event.key === ' ') && onSegmentClick) {
          event.preventDefault();
          onSegmentClick(entry);
        }
      });

      overlay.on('blur', function handleBlur() {
        d3.select('#focus-ring').remove();
        d3.select('#focus-ring-inner').remove();
        d3.select('#tooltip-group').remove();
      });

      if (showCategoryLabels) {
        placeCategoryText(entry.category, startAngle, endAngle, index);
      }
    });

    if (showGroupRing) {
      groupSegments.forEach((segment, index) => {
        const group = segment.group;
        const groupItems = segment.items;
        const groupStartAngle = segment.startIndex * angleStep;
        const groupEndAngle = segment.endIndex * angleStep;
        const groupMiddleAngle = (groupStartAngle + groupEndAngle) / 2;
        const reverseGroupText =
          groupMiddleAngle > Math.PI / 2 && groupMiddleAngle < (3 * Math.PI) / 2;
        const groupColor = groupItems[0]?.color || colorScale(group);
        const groupPathId = `${chartIdRef.current}-group-${index}`;

        svg
          .append('path')
          .attr('class', 'group-ring')
          .attr(
            'd',
            createArc(
              radius + labelRingThickness,
              radius + labelRingThickness + GROUP_RING_THICKNESS,
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
          .attr('d',
            createCircularPath(
              radius + labelRingThickness + GROUP_RING_THICKNESS / 2,
              groupStartAngle,
              groupEndAngle,
              reverseGroupText
            )
          )
          .attr('fill', 'none')
          .attr('aria-hidden', 'true');

        svg
          .append('text')
          .attr('fill', getTextColor(groupColor))
          .attr('font-size', '26px')
          .attr('font-weight', '700')
          .attr('dominant-baseline', 'middle')
          .append('textPath')
          .attr('href', `#${groupPathId}`)
          .attr('xlink:href', `#${groupPathId}`)
          .attr('startOffset', '50%')
          .attr('text-anchor', 'middle')
          .text(group)
          .attr('aria-hidden', 'true');
      });
    }

    d3.range(1, numTicks + 1).forEach((tick) => {
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

      if (showTickLabels) {
        const tickText = String(tick + tickLabelOffset);
        const badge = svg
          .append('g')
          .attr('class', 'tick-label-badge')
          .attr('transform', `translate(0, ${-tickRadius})`)
          .attr('aria-hidden', 'true');

        badge
          .append('circle')
          .attr('r', 20)
          .attr('fill', '#111111')
          .attr('stroke', 'white')
          .attr('stroke-width', 3);

        badge
          .append('text')
          .text(tickText)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', 'white')
          .attr('font-size', '22px')
          .attr('font-weight', '700');
      }
    });

    const logoSize = Math.min(INNER_RADIUS * 1.5, 200);

    svg
      .append('image')
      .attr('xlink:href', centerLogo)
      .attr('x', -logoSize / 2)
      .attr('y', -logoSize / 2)
      .attr('width', logoSize)
      .attr('height', logoSize)
      .attr('aria-hidden', 'true');
  }, [
    chartData,
    colorScale,
    radius,
    resolvedCompany,
    centerLogo,
    ariaLabel,
    showGroupRing,
    showCategoryLabels,
    maxValue,
    numTicks,
    valueOffset,
    labelMaxChars,
    categoryFontSize,
    categoryLineHeight,
    labelRingThickness,
    showTickLabels,
    tickLabelOffset,
    onSegmentClick,
    segmentActionText,
    focusOuterRadius,
  ]);

  return (
    <>
      <style>{`.overlay:focus { outline: none; }`}</style>
      <svg ref={svgRef} />
    </>
  );
};

export default RadialBarChart;
