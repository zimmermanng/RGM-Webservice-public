import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';


const RadialBarChart = ({ data }) => {
    const svgRef = useRef(null);
    const [chartData, setChartData] = useState(null); // Use state to manage the chart data

    // Constants
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

    let lastInputType = "";

    document.addEventListener("mousedown", () => {
        lastInputType = "mouse";
    });

    document.addEventListener("keydown", () => {
        lastInputType = "keyboard";
      });
      
    document.addEventListener("touchstart", () => {
        lastInputType = "touch";
      });


    // Color scale for groups
    const colorScale = d3.scaleOrdinal()
        .domain(['Beratung und Support', 'Lehren und Lernen', 'Struktur', 'Strategie'])
        .range(['#F6B700', '#FA4730', '#F08811', '#5E5F4F']); 

    // Choosing text color for correct contrast ratio
    const getLuminance = (color) => {
        const rgb = d3.color(color).rgb();
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => c / 255).map(c =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );
        return 0.2126 * r + 0.7152 * g + 0.0722 * b; // Relative luminance formula
    };

    const getTextColor = (bgColor) => {
        return getLuminance(bgColor) > 0.5 ? 'black' : 'white';
    };

    // Set the chart data once when `data` prop is passed
    useEffect(() => {
        if (data && data.length > 0) {
            setChartData(data); // Set chartData to the passed data
        }
    }, [data]); // Only runs when `data` prop changes

    // Draw the radial bar chart
    const drawChart = () => {
        // console.log('DIAGRAMM WIRD GEZEICHNET');
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('role', 'region') // Role for the chart container
            .attr('aria-label', 'Diagramm zur Visualisierung der RGM-Ergebnisse.')
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        svg.selectAll('*').remove();

        const radialScale = d3.scaleLinear()
            .domain([0, numTicks])
            .range([innerRadius, radius]);

        const angleStep = (2 * Math.PI) / chartData.length;
        const uniqueGroups = [...new Set(chartData.map(d => d.group))];
        // console.log('GRUPPEN: ' + uniqueGroups + ' DATEN: ' + chartData.length);

        // Utility function to create an arc generator
        const createArcGenerator = (innerRadius, outerRadius, startAngle, endAngle) => {
            return d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
                .startAngle(startAngle)
                .endAngle(endAngle);
        };

        // Place text for category labels
        const wrapText = (text, maxCharsPerLine) => {
            const words = text.split(' ');
            let lines = [];
            let currentLine = '';

            words.forEach(word => {
                if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
                    currentLine += (currentLine ? ' ' : '') + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            });

            if (currentLine) {
                lines.push(currentLine);
            }

            return lines;
        };

        const placeTextAlongArcs = (text, angle, nextAngle, radius, lines) => {
            const lineHeight = Math.max(20, 40 / lines.length);

            lines.forEach((line, index) => {
                // console.log('Labelbezeichnung: ' + line + ' Abschnitt: ' + index);
                const arcGenerator = createArcGenerator(radius - index * lineHeight, radius + labelRingThickness / 2 - (index + 1) * lineHeight, angle, nextAngle);
                const pathId = `category-path-${text}-${index}`;
                svg.append('path')
                    .attr('id', pathId)
                    .attr('d', arcGenerator)
                    .attr('fill', 'none')
                    .attr('aria-hidden', 'true');

                svg.append('text')
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
        const createTooltip = (svg, x, y, lines) => {
            // Define font size based on the screen size
            const screenWidth = window.innerWidth;
            let fontSize = 18; // default font size
            if (screenWidth < 600) {
                fontSize = 30; // Larger font size for smaller screens
            } else if (screenWidth < 1000) {
                fontSize = 20; // Medium font size for medium screens
            }
        
            const tooltipGroup = svg.append('g')
                .attr('id', 'tooltip-group')
                .attr('transform', `translate(${x}, ${y})`)
                .attr('pointer-events', 'none');
        
            // Adjust text size and create text elements
            const textElements = lines.map((line, i) => {
                const textElement = tooltipGroup.append('text')
                    .text(line)
                    .attr('x', 0)
                    .attr('y', -35 + i * (fontSize * 1.2)) // Adjust vertical spacing based on font size
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', fontSize);
        
                return textElement;
            });
        
            // Get the bounding box of the text and adjust the tooltip box size
            const bbox = tooltipGroup.node().getBBox();
            const padding = 10;
        
            tooltipGroup.insert('rect', ':first-child')
                .attr('x', bbox.x - padding)
                .attr('y', bbox.y - padding)
                .attr('width', bbox.width + 2 * padding)
                .attr('height', bbox.height + 2 * padding)
                .attr('fill', 'white')
                .attr('stroke', 'black')
                .attr('rx', 8)
                .attr('ry', 8);
        
            return tooltipGroup;
        
        }
        const createFocus = (innerRadius, radius, labelRingThickness, angle, nextAngle) => {
            const focusArc = createArcGenerator(innerRadius, radius + labelRingThickness, angle, nextAngle);
            svg.append('path')
                .attr('id', 'focus-ring')
                .attr('d', focusArc)
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('stroke-width', 8)

            const focusArcInner = createArcGenerator(innerRadius, radius + labelRingThickness, angle, nextAngle);
            svg.append('path')
                .attr('id', 'focus-ring')
                .attr('d', focusArcInner)
                .attr('fill', 'none')
                .attr('stroke', 'white')
                .attr('stroke-width', 2);
        };

        // Draw the bars (arcs) for each data point
        chartData.forEach((d, i) => {
            // console.log('Neuer Eintrag: ' + d.category + ' Stufe: ' + d.value + ' Index: ' + i);
            const angle = i * angleStep;
            const nextAngle = angle + angleStep;
            const outerRadius = radialScale(d.value);

            // Grey background for unreached bar area
            const greyArcGenerator = createArcGenerator(innerRadius, radialScale(maxValue), angle, nextAngle);
            svg.append('path')
                .attr('class', 'unreached-bar')
                .attr('d', greyArcGenerator)
                .attr('fill', '#F1F1F1')
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('aria-hidden', 'true');

            // Create bars    
            const arcGenerator = createArcGenerator(innerRadius, outerRadius, angle, nextAngle);
            svg.append('path')
                .attr('class', 'bar')
                .attr('d', arcGenerator)
                .attr('fill', colorScale(d.group))
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('aria-hidden', 'true');

            // Create a small black arc to mark the top of the bar
            const topArcGenerator = createArcGenerator(outerRadius, outerRadius + 8, angle, nextAngle);
            svg.append('path')
                .attr('class', 'top-arc')
                .attr('d', topArcGenerator)
                .attr('fill', 'black')
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('aria-hidden', 'true');

            // Create label background    
            const outerArcGenerator = createArcGenerator(radius + 8, radius + labelRingThickness, angle, nextAngle);
            svg.append('path')
                .attr('class', 'outer-ring')
                .attr('d', outerArcGenerator)
                .attr('fill', '#D9D9D9')
                .attr('stroke', 'white')
                .attr('stroke-width', 3)
                .attr('aria-hidden', 'true');

            // Calculate adjusted value for screen reader
            const adjustedValue = d.value - 1;
            const valueText = adjustedValue === -1 ? 'Keine Einstufung vorhanden' : adjustedValue;
            const LabelText = `Dimension: ${d.group}, Themenfeld: ${d.category}, Stufe:  ${valueText}, Drücken Sie Enter für Details`;

            // Add Focus Overlay
            const overlayArcGenerator = createArcGenerator(innerRadius + 4, radius + labelRingThickness + 4, angle, nextAngle);
            const overlayPath = svg.append('path')
                .attr('class', 'overlay')
                .attr('d', overlayArcGenerator)
                .attr('fill', 'transparent')
                .attr('tabindex', '0')
                .attr('data-index', i)
                .attr('aria-label', LabelText); // Screen reader description;

            let mouseX = null;
            let mouseY = null;
            document.addEventListener("mousedown", function (event) {
                [mouseX, mouseY] = d3.pointer(event, svg.node()); // relative to the SVG container
            });

            overlayPath.on('focus', function (event) {
                d3.select('#focus-ring').remove();
                d3.select('#tooltip-group').remove();
                createFocus(innerRadius, radius, labelRingThickness, angle, nextAngle);
                const texts = [`Dimension: ${d.group}`, `Themenfeld: ${d.category}`, `Stufe: ${valueText}`];
                const arcCenterAngle = (angle + nextAngle) / 2; // Calculate center of the arc
                const offsetX = 90; // Horizontal offset to prevent overlap
                // Add Tooltipp
                if (lastInputType == "mouse") {
                    const x = mouseX < 0 ? mouseX + offsetX : mouseX - offsetX;
                    const y = mouseY - 20
                    createTooltip(svg, x, y, texts);
                }
                else {
                    const y = (-(radius + labelRingThickness) * Math.cos(arcCenterAngle)) * 0.75;
                    const x = ((radius + labelRingThickness) * Math.sin(arcCenterAngle)) * 0.75;
                    createTooltip(svg, x, y, texts);
                }

                overlayPath.on('mousedown', function (event) {
                    d3.select('#tooltip-group').remove();
                    [mouseX, mouseY] = d3.pointer(event, svg.node());
                    const x = mouseX < 0 ? mouseX + offsetX : mouseX - offsetX;
                    const y = mouseY - 20
                    createTooltip(svg, x, y, texts);
                }
                )
            }
            )



                .on('blur', function () {
                    d3.select('#focus-ring').remove();
                    d3.select('#tooltip-group').remove(); // Remove tooltip
                });

            // Add labels
            const categoryLines = wrapText(d.category, maxCharsPerLine);
            placeTextAlongArcs(d.category, angle, nextAngle, radius + labelRingThickness / 2, categoryLines);
        });

        // Draw group rings and labels
        uniqueGroups.forEach((group, i) => {
            // console.log('Neue Gruppe: ' + group + ' Index: ' + i);
            const groupData = chartData.filter(d => d.group === group);
            const groupStartAngle = chartData.findIndex(d => d.group === group) * angleStep;
            const groupEndAngle = groupStartAngle + groupData.length * angleStep;

            const groupArcGenerator = createArcGenerator(radius + labelRingThickness, radius + labelRingThickness + groupRingThickness, groupStartAngle, groupEndAngle);
            svg.append('path')
                .attr('class', 'group-ring')
                .attr('d', groupArcGenerator)
                .attr('fill', colorScale(group))
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('aria-hidden', 'true');

            const pathId = `group-path-${i}`;
            const groupColor = colorScale(group);
            const textColor = getTextColor(groupColor);
            const groupPath = createArcGenerator(radius + labelRingThickness + groupRingThickness / 2, radius + labelRingThickness + groupRingThickness / 2, groupStartAngle, groupEndAngle);

            svg.append('path')
                .attr('id', pathId)
                .attr('d', groupPath)
                .attr('aria-hidden', 'true');

            svg.append('text')
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

        // Add the ticks (grid lines)
        const ticks = d3.range(1, numTicks + 1);
        ticks.forEach(tick => {
            const tickRadius = radialScale(tick);
            const tickPathGenerator = d3.arc()
                .innerRadius(tickRadius)
                .outerRadius(tickRadius)
                .startAngle(0)
                .endAngle(2 * Math.PI);

            svg.append('path')
                .attr('class', 'tick')
                .attr('d', tickPathGenerator)
                .attr('fill', 'none')
                .attr('stroke', 'white')
                .attr('stroke-width', 1)
                .attr('aria-hidden', 'true');
        });

        // Dynamically add logo image with scalable size
        const logoImage = 'LMZ-Logo-rund.png';
        const logoSize = Math.min(innerRadius * 1.5, 200);
        svg.append('image')
            .attr('xlink:href', logoImage)
            .attr('x', -logoSize / 2)
            .attr('y', -logoSize / 2)
            .attr('width', logoSize)
            .attr('height', logoSize)
            .attr('aria-hidden', 'true');

    };

    // Trigger the chart drawing if chartData is available
    useEffect(() => {
        if (chartData) {
            drawChart();
        }
    }, [chartData]); // Only run this when chartData is set

    return (
        <>
            <style>
                {`
                .overlay:focus {
                    outline: none; /* Removes default browser focus */
                }
                `}
            </style>
            <svg ref={svgRef} />
        </>
    );
};

export default RadialBarChart;

