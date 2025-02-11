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
    const rotateRefButton = document.getElementById("rotateRefButton");
    const rotationRefX = document.getElementById("rotationRefX");
    const rotationRefY = document.getElementById("rotationRefY");
    const rotationAngleRef  = document.getElementById("rotationAngleRef");
    const tiltTwoPointsButton1 = document.getElementById("tiltTwoPointsButton1");
    const tiltPoint1X = document.getElementById("tiltPoint1X");
    const tiltPoint1Y = document.getElementById("tiltPoint1Y");
    const tiltPoint2X = document.getElementById("tiltPoint2X");
    const tiltPoint2Y = document.getElementById("tiltPoint2Y");   
    const modal = document.getElementById("explanationModal");
    const modalText = document.getElementById("explanationText");
    const closeModal = document.getElementsByClassName("close")[0];
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const sampleButton = document.getElementById('sampleButton');
    const centeringButton = document.getElementById('centeringButton');

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

    // Load CSV file
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        // Clear all transformations and reset allPlots
        allPlots = [{ id: 1, points: [...originalPointCloud], color: 'black' }];
        transformedPointCloud = [...originalPointCloud];
        originalPointCloud = parseCSV(e.target.result);
        transformedPointCloud = [...originalPointCloud];
        if (originalPointCloud.length > 0) {
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
              row.push(plot.points[i].x.toFixed(5), plot.points[i].y.toFixed(5));
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
      a.download = 'points.csv';
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
      const sign = getRotationSign();
      const angle = sign * (parseFloat(rotationAngleInput.value) * (Math.PI / 180));

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
          marker: { size: 5, color: plot.color },
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

    function resettingwhileloading() {

      // Clear all transformations and reset allPlots
      allPlots = [{ id: 1, points: [...originalPointCloud], color: 'black' }];
      transformedPointCloud = [...originalPointCloud];

    }

    // Reset Button
    resetButton.addEventListener('click', () => {
      // Clear all transformations and reset allPlots
      allPlots = [{ id: 1, points: [...originalPointCloud], color: 'black' }];
      transformedPointCloud = [...originalPointCloud];

      // Re-plot only the original points
      plotAllPlots();

      alert('Reset to original state.');
    });

    rotateRefButton.addEventListener("click", () => {
      const x0 = parseFloat(rotationRefX.value);
      const y0 = parseFloat(rotationRefY.value);
      const sign = getRotationSign();
      const angle = sign * (parseFloat(rotationAngleRef.value) * (Math.PI / 180));
    
      transformedPointCloud = transformedPointCloud.map(point => {
        const xShifted = point.x - x0;
        const yShifted = point.y - y0;
    
        return {
          x: xShifted * Math.cos(angle) - yShifted * Math.sin(angle) + x0,
          y: xShifted * Math.sin(angle) + yShifted * Math.cos(angle) + y0,
        };
      });
    
      allPlots.push({
        id: allPlots.length + 1,
        points: [...transformedPointCloud],
        color: generateColor(allPlots.length + 1),
      });
    
      plotAllPlots();
    });    

    tiltTwoPointsButton1.addEventListener("click", () => {
      const x1 = parseFloat(tiltPoint1X.value);
      const y1 = parseFloat(tiltPoint1Y.value);
      const x2 = parseFloat(tiltPoint2X.value);
      const y2 = parseFloat(tiltPoint2Y.value);
      const sign = getRotationSign();
    
      const deltaY = y2 - y1;
      const deltaX = x2 - x1;
      const angle = sign * -Math.atan2(deltaY, deltaX);
    
      transformedPointCloud = transformedPointCloud.map(point => {
        const xShifted = point.x - x1;
        const yShifted = point.y - y1;
    
        return {
          x: xShifted * Math.cos(angle) - yShifted * Math.sin(angle) + x1,
          y: xShifted * Math.sin(angle) + yShifted * Math.cos(angle) + y1,
        };
      });
    
      allPlots.push({
        id: allPlots.length + 1,
        points: [...transformedPointCloud],
        color: generateColor(allPlots.length + 1),
      });
    
      plotAllPlots();
    });

    function getRotationSign() {
      const sign = document.querySelector('input[name="rotationSign"]:checked').value;
      return sign === "+" ? 1 : -1;
    } 

    sampleButton.addEventListener("click", () => {
      const n = parseInt(document.getElementById("reduceFactor").value);
  
      if (isNaN(n) || n < 1) {
          alert("Please enter a valid number (greater than 0).");
          return;
      }
  
      if (transformedPointCloud.length === 0) {
          alert("No points loaded!");
          return;
      }
  
      // Modify transformedPointCloud directly
      transformedPointCloud = transformedPointCloud.filter((_, index) => index % n === 0);
  
      // Ensure the last point is included
      if (!transformedPointCloud.includes(transformedPointCloud[transformedPointCloud.length - 1])) {
          transformedPointCloud.push(transformedPointCloud[transformedPointCloud.length - 1]);
      }
  
      // Store and plot transformed points
      allPlots.push({
          id: allPlots.length + 1,
          points: [...transformedPointCloud],
          color: generateColor(allPlots.length + 1)
      });
  
      plotAllPlots();
    });

    centeringButton.addEventListener("click", () => {
      if (transformedPointCloud.length === 0) {
          alert("No points loaded!");
          return;
      }
  
      // Compute centroid (average x, y)
      const centroidX = transformedPointCloud.reduce((sum, p) => sum + p.x, 0) / transformedPointCloud.length;
      const centroidY = transformedPointCloud.reduce((sum, p) => sum + p.y, 0) / transformedPointCloud.length;
  
      // Shift all points to make the centroid (0,0)
      transformedPointCloud = transformedPointCloud.map(point => ({
          x: point.x - centroidX,
          y: point.y - centroidY,
      }));
  
      // Store and plot centered points
      allPlots.push({
          id: allPlots.length + 1,
          points: [...transformedPointCloud],
          color: generateColor(allPlots.length + 1),
      });
  
      plotAllPlots();
    });
    
    // Explanation Button
    explanationButton.addEventListener('click', () => {
      const explanationText = `
      Transformations Explanation:

      1. Mirroring:

         - Mirroring across the X-axis: (x, y) → (x, -y)
         - Mirroring across the Y-axis: (x, y) → (-x, y)
         - Mirroring across a custom X = c: (x, y) → (2c - x, y)
         - Mirroring across a custom Y = c: (x, y) → (x, 2c - y)
    
      2. Rotating:

         - Standard Rotation around the origin:
           - x' = x cos(θ) - y sin(θ)
           - y' = x sin(θ) + y cos(θ)

         - Rotation around a reference point (x₀, y₀):
           - Translate: (x, y) → (x - x₀, y - y₀)
           - Rotate using:
             - x' = (x - x₀) cos(θ) - (y - y₀) sin(θ) + x₀
             - y' = (x - x₀) sin(θ) + (y - y₀) cos(θ) + y₀
    
         - Rotation based on two reference points:
           - Find slope: m = (y₂ - y₁) / (x₂ - x₁)
           - Find rotation angle: θ = -atan(m) (for horizontal)
           - Find rotation angle: θ = π/2 - atan(m) (for vertical)
           - Apply rotation after shifting the first point to the origin:
             - x' = (x - x₁) cos(θ) - (y - y₁) sin(θ) + x₁
             - y' = (x - x₁) sin(θ) + (y - y₁) cos(θ) + y₁ 
             
         - Regardless of rotation methods, one may rotate clockwise/counter-clockwise
          
      3. Translating:

         - (x, y) → (x + Δx, y + Δy)
    
      4. Scaling:

         - (x, y) → (s * x, s * y)      

      5. Sampling:

         - Sample the number of points by selecting every n-th point.
         - If n = 1, every point is retained (no reduction or sampled every point).
         - If n = 2, every second point is kept, skipping one in between.
         - If n = 3, every third point is kept, skipping two in between.
         - Ensures the last point is always included for continuity.

      6. Centering:

         - Compute the centroid (x̄, ȳ) of the point cloud:
            - x̄ = (Σx) / N, ȳ = (Σy) / N
         - Shift all points so that the centroid moves to (0,0):
            - x' = x - x̄
            - y' = y - ȳ   
      
      `;

      // Display explanation in the modal
      modalText.textContent = explanationText;
      modal.style.display = "block";
    });

    // Close the modal when the user clicks the X button
    closeModal.onclick = function () {
      modal.style.display = "none";
    };

    // Close if user clicks outside of modal
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove the active class from all tab buttons and panels
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
    
        // Add the active class to the clicked button
        button.classList.add('active');
        // And add the active class to the corresponding panel
        const activePanel = document.getElementById(button.getAttribute('data-tab'));
        activePanel.classList.add('active');
      });
    });       

  });