document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const plotButton = document.getElementById('plotButton');
    const resetButton = document.getElementById('resetButton');
    const exportButton = document.getElementById('exportButton');
    const plotTypeSelect = document.getElementById('plotType');
    const mirrorButton = document.getElementById('mirrorButton');
    const mirrorAxisSelect = document.getElementById('mirrorAxis');
    const rotateButton = document.getElementById('rotateButton');
    const rotationAngleInput = document.getElementById('rotationAngle');
    const translateButton = document.getElementById('translateButton');
    const translationXInput = document.getElementById('translationX');
    const translationYInput = document.getElementById('translationY');
    const scaleButton = document.getElementById('scaleButton');
    const scalingFactorInput = document.getElementById('scalingFactor');
    const explanationButton = document.getElementById('explanationButton');

    let originalPointCloud = [];
    let transformedPointCloud = [];
    let currentPlotType = 'scatter';
    let allPlots = [{ id: 1, points: [], color: 'black' }];

    // Parse CSV file
    function parseCSV(content) {
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const points = [];
      lines.slice(1).forEach(line => {
        const [x, y] = line.split(',').map(Number);
        if (!isNaN(x) && !isNaN(y)) {
          points.push({ x, y });
        }
      });
      return points;
    }

    // Enable controls after loading
    function enableControls() {
      plotTypeSelect.disabled = false;
      plotButton.disabled = false;
      resetButton.disabled = false;
      exportButton.disabled = false;
      mirrorButton.disabled = false;
      mirrorAxisSelect.disabled = false;
      rotateButton.disabled = false;
      rotationAngleInput.disabled = false;
      translateButton.disabled = false;
      translationXInput.disabled = false;
      translationYInput.disabled = false;
      scaleButton.disabled = false;
      scalingFactorInput.disabled = false;
      explanationButton.disabled = false;
    }

    // Load CSV file
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        originalPointCloud = parseCSV(e.target.result);
        transformedPointCloud = [...originalPointCloud];
        if (originalPointCloud.length > 0) {
          enableControls();
          alert(`Loaded ${originalPointCloud.length} points!`);
        } else {
          alert('Failed to load points. Ensure the file has X,Y headers.');
        }
      };
      reader.readAsText(file);
    });

    // Plot Points
    plotButton.addEventListener('click', () => {
      currentPlotType = plotTypeSelect.value;
      if (allPlots.length === 1) {
          allPlots[0] = { id: 1, points: [...originalPointCloud], color: 'black' };
      }
      plotAllPlots();
    });
    
    // Export Transformed Points
    exportButton.addEventListener('click', () => {
      
      // Collect all plot data into CSV format
      const headers = [];
      const rows = [];
      const maxPoints = Math.max(...allPlots.map(plot => plot.points.length));

      allPlots.forEach((plot, index) => {
          headers.push(`plot${index + 1}X`, `plot${index + 1}Y`);
      });

      for (let i = 0; i < maxPoints; i++) {
          const row = [];
          allPlots.forEach(plot => {
          if (i < plot.points.length) {
              row.push(plot.points[i].x, plot.points[i].y);
          } else {
              row.push('', ''); // Empty cells for shorter plots
          }
          });
          rows.push(row.join(','));
      };

      const csvContent = `${headers.join(',')}\n${rows.join('\n')}`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'all_plots.csv';
      a.click();

    });      

    // Mirroring Transformation
    mirrorButton.addEventListener('click', () => {
      const axis = mirrorAxisSelect.value;

      if (axis === 'x') {
        // Mirror relative to the X-axis
        transformedPointCloud = transformedPointCloud.map(point => ({
          x: point.x,
          y: -point.y,
        }));
      } else if (axis === 'y') {
        // Mirror relative to the Y-axis
        transformedPointCloud = transformedPointCloud.map(point => ({
          x: -point.x,
          y: point.y,
        }));
      } else if (axis === 'customX') {
        // Custom vertical mirror (x = constant)
        const constant = parseFloat(prompt("Enter the x-value for the custom vertical mirror line:", "0"));
        if (!isNaN(constant)) {
          transformedPointCloud = transformedPointCloud.map(point => ({
            x: 2 * constant - point.x,
            y: point.y,
          }));
        } else {
          alert("Invalid input. Please enter a valid number for x.");
        }
      } else if (axis === 'customY') {
        // Custom horizontal mirror (y = constant)
        const constant = parseFloat(prompt("Enter the y-value for the custom horizontal mirror line:", "0"));
        if (!isNaN(constant)) {
          transformedPointCloud = transformedPointCloud.map(point => ({
            x: point.x,
            y: 2 * constant - point.y,
          }));
        } else {
          alert("Invalid input. Please enter a valid number for y.");
        }
      }

      // Add the new transformed points to the plot list and replot
      allPlots.push({
        id: allPlots.length + 1,
        points: [...transformedPointCloud],
        color: generateColor(allPlots.length + 1), // Assign a unique color
      });

      plotAllPlots();
    });


    // Rotation Transformation
    rotateButton.addEventListener('click', () => {
      const angle = parseFloat(rotationAngleInput.value) * (Math.PI / 180);
      transformedPointCloud = transformedPointCloud.map(point => ({
        x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
        y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
      }));
      allPlots.push({
          id: allPlots.length + 1,
          points: [...transformedPointCloud],
          color: generateColor(allPlots.length + 1), // Dynamically assign a color
      });
      plotAllPlots();
    });

    // Translation Transformation
    translateButton.addEventListener('click', () => {
      const dx = parseFloat(translationXInput.value);
      const dy = parseFloat(translationYInput.value);
      transformedPointCloud = transformedPointCloud.map(point => ({
        x: point.x + dx,
        y: point.y + dy,
      }));
      allPlots.push({
          id: allPlots.length + 1,
          points: [...transformedPointCloud],
          color: generateColor(allPlots.length + 1), // Dynamically assign a color
      });
      plotAllPlots();
    });

    // Scaling Transformation
    scaleButton.addEventListener('click', () => {
      const factor = parseFloat(scalingFactorInput.value);
      transformedPointCloud = transformedPointCloud.map(point => ({
        x: point.x * factor,
        y: point.y * factor,
      }));
      allPlots.push({
          id: allPlots.length + 1,
          points: [...transformedPointCloud],
          color: generateColor(allPlots.length + 1), // Dynamically assign a color
      });
      plotAllPlots();
    });

    function plotAllPlots() {
      const traces = allPlots.map(plot => ({
          x: plot.points.map(p => p.x),
          y: plot.points.map(p => p.y),
          mode: currentPlotType === 'scatter' ? 'markers' : currentPlotType === 'line' ? 'lines' : 'lines+markers',
          type: 'scatter',
          name: `Plot ${plot.id}`,
          marker: { size: 6, color: plot.color },
          line: { color: plot.color },
      }));

      const layout = {
          xaxis: { title: 'X Axis', showgrid: true, zeroline: true },
          yaxis: { title: 'Y Axis', showgrid: true, zeroline: true },
          width: 800,
          height: 600,
          showlegend: true,
      };

      Plotly.newPlot('plot', traces, layout);
    }

    function generateColor(index) {
      const hue = (index * 137.5) % 360; // Use the golden angle for distinct colors
      return `hsl(${hue}, 70%, 50%)`; // Keep saturation and lightness constant
    }

    // Explanation Button
    explanationButton.addEventListener('click', () => {
      alert(`Transformations Explanation:
      1. Mirroring: Points are mirrored across the selected axis by inverting the necessary coordinates.
      2. Rotation: Points are rotated by applying the standard 2D rotation formula:
         x' = x * cos(angle) - y * sin(angle)
         y' = x * sin(angle) + y * cos(angle)
      3. Translation: Adds specified values to each coordinate (x + dx, y + dy).
      4. Scaling: Multiplies each coordinate by the scaling factor.`);
    });

    // Reset Button
    resetButton.addEventListener('click', () => {
      // Clear all transformations and reset allPlots
      allPlots = [{ id: 1, points: [...originalPointCloud], color: 'black' }];
      transformedPointCloud = [...originalPointCloud];
      plotTypeSelect.value = 'scatter'; // Reset to default plot type

      // Reset transformation inputs to default values
      mirrorAxisSelect.value = 'x';
      rotationAngleInput.value = 0;
      translationXInput.value = 0;
      translationYInput.value = 0;
      scalingFactorInput.value = 1;

      // Re-plot only the original points
      plotAllPlots();

      alert('Reset to original state.');
      });
  });