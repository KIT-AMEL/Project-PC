document.addEventListener('DOMContentLoaded', () => {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      const imageLoader = document.getElementById('imageLoader');
      const startButton = document.getElementById('startButton');
      const selectModeButton = document.getElementById('selectMode');
      const adjustModeButton = document.getElementById('adjustMode');
      const numDensePointsInput = document.getElementById('numDensePoints');
      const generatePointsButton = document.getElementById('generatePoints');
      const doneSetButton = document.getElementById('doneSet');
      const clearPointsButton = document.getElementById('clearPoints');
      const showAllSetsButton = document.getElementById('showAllSets');
      const exportAllButton = document.getElementById('exportAll');

      let img = new Image();
      let imgScale = 1;
      let imgOffsetX = 0;
      let imgOffsetY = 0;
      let numPointClouds = 1;
      let currentSet = 0;
      let allPointClouds = [];
      let points = [];
      let densePoints = [];
      let draggingPointIndex = null;
      let mode = '';
      let startPoint = null; // Store starting point for continuity
      let isCleared = false; // Flag to track if points were cleared during this set

      // Load the image
      imageLoader.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);

        img.onload = () => {
          const scaleX = canvas.width / img.width;
          const scaleY = canvas.height / img.height;
          imgScale = Math.min(scaleX, scaleY);

          imgOffsetX = (canvas.width - img.width * imgScale) / 2;
          imgOffsetY = (canvas.height - img.height * imgScale) / 2;

          redraw();
          startButton.disabled = false;
        };
      });

      // Start the process
      startButton.addEventListener('click', () => {
        numPointClouds = parseInt(document.getElementById('numPointClouds').value, 10) || 1;
        currentSet = 1;
        allPointClouds = [];
        points = [];
        densePoints = [];
        startPoint = null;
        isCleared = false;
        updateUI();
        alert(`Ready to create Point Cloud Set 1 of ${numPointClouds}.`);
      });

      // Select Points
      selectModeButton.addEventListener('click', () => {
        mode = 'select';
        alert('Click on the canvas to select points.');
      });

      // Adjust Points
      adjustModeButton.addEventListener('click', () => {
        mode = 'adjust';
        alert('Drag points to adjust their positions.');
      });

      // Generate Dense Points
      generatePointsButton.addEventListener('click', () => {
        const numPoints = parseInt(numDensePointsInput.value, 10) || 100;
        const step = 1 / (numPoints - 1);
        densePoints = [];
        for (let t = 0; t <= 1; t += step) {
          densePoints.push(getBezierPoint(points, t));
        }
        redraw();
        doneSetButton.disabled = false;
      });

      // Finalize the Current Point Cloud Set
      doneSetButton.addEventListener('click', () => {
        if (isCleared) {
          alert('Cannot finalize. Please create a valid point cloud set first.');
          return;
        }

        allPointClouds.push({ points: [...points], densePoints: [...densePoints] });

        if (currentSet === numPointClouds) {
          alert('All point clouds are now completed.');
          updateUI();
          return;
        }

        const continueWithLastPoint = confirm(
          'Do you want to start the next point cloud from the last point of the previous set?'
        );
        if (continueWithLastPoint) {
          startPoint = densePoints[densePoints.length - 1];
          points = [startPoint];
        } else {
          startPoint = null;
          points = [];
        }

        densePoints = [];
        currentSet++;
        isCleared = false; // Reset the cleared flag for the new set
        updateUI();
        alert(`Ready to create Point Cloud Set ${currentSet} of ${numPointClouds}.`);
      });

      // Clear Points
      clearPointsButton.addEventListener('click', () => {
        points = startPoint ? [startPoint] : [];
        densePoints = [];
        mode = '';
        isCleared = true; // Mark the set as cleared
        updateUI();
        redraw();
        alert('Points cleared. You can start over.');
      });

      // Show All Point Clouds
      // Show All Point Clouds
      showAllSetsButton.addEventListener('click', () => {
        // Clear the canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the image background
        ctx.drawImage(img, imgOffsetX, imgOffsetY, img.width * imgScale, img.height * imgScale);

        // Loop through all finalized sets and render their dense points
        allPointClouds.forEach((set) => {
          set.densePoints.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'blue';
            ctx.fill();
          });
        });

        alert('All finalized point clouds are now displayed.');
      });


      // Export All Point Clouds
      // Export All Point Clouds to CSV
      exportAllButton.addEventListener('click', () => {
        if (allPointClouds.length === 0) {
          alert('No point clouds to export.');
          return;
        }

        // Create CSV headers
        let headers = [];
        for (let i = 0; i < allPointClouds.length; i++) {
          headers.push(`Set${i + 1}X`, `Set${i + 1}Y`);
        }

        // Get the maximum number of points across all sets
        const maxPoints = Math.max(...allPointClouds.map(set => set.densePoints.length));

        // Create CSV rows
        let rows = [];
        for (let i = 0; i < maxPoints; i++) {
          let row = [];
          for (let set of allPointClouds) {
            const point = set.densePoints[i];
            if (point) {
              row.push(point.x, point.y); // Add X and Y values
            } else {
              row.push("", ""); // Add empty values for missing points
            }
          }
          rows.push(row);
        }

        // Combine headers and rows into a CSV string
        const csvContent = [
          headers.join(","), // Header row
          ...rows.map(row => row.join(",")) // Data rows
        ].join("\n");

        // Create a Blob and download the CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pointClouds.csv';
        link.click();
      });


      // Canvas Interaction
      canvas.addEventListener('mousedown', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (mode === 'select') {
          points.push({ x, y });
          isCleared = false; // Reset the cleared flag since new points are added
          updateUI();
          redraw();
        } else if (mode === 'adjust') {
          draggingPointIndex = getDraggingPointIndex(x, y);
        }
      });

      canvas.addEventListener('mousemove', (event) => {
        if (mode === 'adjust' && draggingPointIndex !== null) {
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          points[draggingPointIndex] = { x, y };
          redraw();
        }
      });

      canvas.addEventListener('mouseup', () => {
        draggingPointIndex = null;
      });

      // Redraw the Canvas
      function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, imgOffsetX, imgOffsetY, img.width * imgScale, img.height * imgScale);
        drawPoints();
        drawDensePoints();
      }

      // Draw Points
      function drawPoints() {
        if (points.length > 1) {
          // Draw lines connecting the points
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y); // Start at the first point
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y); // Connect to the next point
          }
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Draw individual points
        points.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'red';
          ctx.fill();
        });
      }

      // Draw Dense Points
      function drawDensePoints() {
        densePoints.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'blue';
          ctx.fill();
        });
      }

      // Get a Point on the Bezier Curve
      function getBezierPoint(points, t) {
        const n = points.length - 1;
        let x = 0;
        let y = 0;
        points.forEach((point, i) => {
          const binomial = factorial(n) / (factorial(i) * factorial(n - i));
          const basis = binomial * Math.pow(1 - t, n - i) * Math.pow(t, i);
          x += basis * point.x;
          y += basis * point.y;
        });
        return { x, y };
      }

      // Factorial Function
      function factorial(num) {
        return num <= 1 ? 1 : num * factorial(num - 1);
      }

      // Get Index of Dragging Point
      function getDraggingPointIndex(x, y) {
        return points.findIndex((point) => Math.hypot(point.x - x, point.y - y) < 10);
      }

      // Update UI
      function updateUI() {
        selectModeButton.disabled = false;
        adjustModeButton.disabled = points.length === 0;
        numDensePointsInput.disabled = points.length === 0;
        generatePointsButton.disabled = points.length === 0;
        doneSetButton.disabled = densePoints.length === 0 || isCleared; // Disable Finalize if cleared
        clearPointsButton.disabled = points.length === 0;
        showAllSetsButton.disabled = allPointClouds.length === 0;
        exportAllButton.disabled = allPointClouds.length === 0;
      }
    });