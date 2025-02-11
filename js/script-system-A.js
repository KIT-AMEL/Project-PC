document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imageLoader = document.getElementById('imageLoader');
    
    const shapeSelector = document.getElementById('shape-selector');
    const pointsList = document.getElementById('points-list');
    let points = [];
    let maxPoints = 0;

    let img = new Image();
    let imgScale = 1;
    let imgOffsetX = 0;
    let imgOffsetY = 0; 

    shapeSelector.addEventListener('change', (e) => {
      resetPoints();
      switch (e.target.value) {
          case 'triangle': maxPoints = 3; break;
          case 'quadrilateral': maxPoints = 4; break;
          case 'pentagon': maxPoints = 5; break;
          case 'hexagon': maxPoints = 6; break;
          case 'heptagon': maxPoints = 7; break;
          case 'octagon': maxPoints = 8; break;
          case 'nonagon': maxPoints = 9; break;
          case 'decagon': maxPoints = 10; break;
          case 'freeform': maxPoints = null; break;
          case 'circle': maxPoints = 3; break;
          case 'arc': maxPoints = 3; break;
          case 'major-arc': maxPoints = 3; break;
          case 'ellipse': maxPoints = 3; break;
          default: maxPoints = 0; break;
      }
    });

    // Load and display the image
    imageLoader.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);

      img.onload = () => {
        
        resetAll();

        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        imgScale = Math.min(scaleX, scaleY);

        imgOffsetX = (canvas.width - img.width * imgScale) / 2;
        imgOffsetY = (canvas.height - img.height * imgScale) / 2;

        redraw();
      };
    });

    // Redraw the canvas
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, imgOffsetX, imgOffsetY, img.width * imgScale, img.height * imgScale);
      createGrid();      
      drawPoints();
    }

    // Draw all points
    function drawPoints() {
      points.forEach((point, index) => {
        ctx.beginPath();
        ctx.fillStyle = 'red'; // Regular points
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);     
        ctx.fill();
      });
    }

    function addPoint(x, y) {
      points.push({ x, y });
    }    

    function updatePointsList() {
      pointsList.innerHTML = '';
      points.forEach((point, index) => {
          const listItem = document.createElement('li');
          listItem.classList.add('point-item');
          listItem.textContent = `Point ${index + 1}: (${point.x.toFixed(5)}, ${point.y.toFixed(5)})`;

          // Up button
          const upButton = document.createElement('button');
          //upButton.innerHTML = '⬆️';
          upButton.innerHTML = '&uarr;'; // Up arrow entity
          upButton.classList.add('icon-button');
          upButton.onclick = () => movePoint(index, -1);

          // Down button
          const downButton = document.createElement('button');
          //downButton.innerHTML = '⬇️';
          downButton.innerHTML = '&darr;'; // Down arrow entity
          downButton.classList.add('icon-button');
          downButton.onclick = () => movePoint(index, 1);

          // Delete button
          const deleteButton = document.createElement('button');
          //deleteButton.innerHTML = '➖';
          deleteButton.innerHTML = '&times;'; // Cross symbol
          deleteButton.classList.add('icon-button');
          deleteButton.onclick = () => deletePoint(index);

          listItem.append(upButton, downButton, deleteButton);
          pointsList.appendChild(listItem);
      });
    }

    function movePoint(index, direction) {
      if ((direction === -1 && index > 0) || (direction === 1 && index < points.length - 1)) {
          const temp = points[index];
          points[index] = points[index + direction];
          points[index + direction] = temp;
          updatePointsList();
          redraw();
      }
    }

    function deletePoint(index) {
      points.splice(index, 1);
      updatePointsList();
      redraw();
    }

    function generateCirclePoints() {
      const [p1, p2, p3] = points;

      // Midpoints of segments
      const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

      // Slopes of segments
      const slope1 = (p2.y - p1.y) / (p2.x - p1.x);
      const slope2 = (p3.y - p2.y) / (p3.x - p2.x);

      // Perpendicular slopes
      const perpSlope1 = -1 / slope1;
      const perpSlope2 = -1 / slope2;

      // Center of the circle (intersection of perpendicular bisectors)
      const centerX = (mid2.y - mid1.y + perpSlope1 * mid1.x - perpSlope2 * mid2.x) / (perpSlope1 - perpSlope2);
      const centerY = mid1.y + perpSlope1 * (centerX - mid1.x);

      // Calculate radius as distance from the center to one of the points
      const radius = Math.sqrt(Math.pow(p1.x - centerX, 2) + Math.pow(p1.y - centerY, 2));

      // Calculate the circumference and determine number of points based on 5-pixel spacing
      const circumference = 2 * Math.PI * radius;
      const spacing = 10; // Target spacing between points
      const numPoints = Math.max(20, Math.round(circumference / spacing));

      // Clear existing points from the image and reset points array
      points = [];
      redraw();

      // Generate and display final circle points
      for (let i = 0; i < numPoints; i++) {
         const angle = (2 * Math.PI * i) / numPoints;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          addPoint(x, y);
          redraw();
      }

      updatePointsList();
    }

    function generateArcPoints(centerX, centerY, point1X, point1Y, point2X, point2Y, spacing = 10) {
      const radius = Math.sqrt(Math.pow(point1X - centerX, 2) + Math.pow(point1Y - centerY, 2));

      // Calculate angles of both boundary points relative to the center
      const angle1 = Math.atan2(point1Y - centerY, point1X - centerX);
      const angle2 = Math.atan2(point2Y - centerY, point2X - centerX);

      // Determine start and end angles for the minor arc
      const startAngle = Math.min(angle1, angle2);
      const endAngle = Math.max(angle1, angle2);

      // Calculate arc length and dynamically set number of points
      const arcLength = radius * (endAngle - startAngle);
      const numPoints = Math.max(10, Math.round(arcLength / spacing)); // Ensure a minimum of 10 points

      let points = [];
      for (let i = 0; i <= numPoints; i++) {
          const angle = startAngle + (i / numPoints) * (endAngle - startAngle);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          points.push({ x, y });
      }

      return points;
    }

    function generateMajorArcPoints(centerX, centerY, point1X, point1Y, point2X, point2Y, spacing = 10) {
      const radius = Math.sqrt(Math.pow(point1X - centerX, 2) + Math.pow(point1Y - centerY, 2));

      // Calculate angles of both boundary points relative to the center
      let angle1 = Math.atan2(point1Y - centerY, point1X - centerX);
      let angle2 = Math.atan2(point2Y - centerY, point2X - centerX);

      // Ensure angle2 is greater than angle1; if not, swap them
      if (angle1 > angle2) {
          [angle1, angle2] = [angle2, angle1];
      }

      // Calculate the arc path for the major arc
      let startAngle, endAngle;
      const angleDiff = angle2 - angle1;
      if (angleDiff <= Math.PI) {
          // Minor arc is between angle1 and angle2; for major arc, extend around
          startAngle = angle2;
          endAngle = angle1 + 2 * Math.PI;
      } else {
          // Major arc is the shorter path directly from angle1 to angle2
          startAngle = angle1;
          endAngle = angle2;
      }

      // Calculate arc length and dynamically set number of points
      const arcLength = radius * (endAngle - startAngle);
      const numPoints = Math.max(30, Math.round(arcLength / spacing)); // Ensure a minimum of 30 points

      let points = [];
      for (let i = 0; i <= numPoints; i++) {
          const angle = startAngle + (i / numPoints) * (endAngle - startAngle);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          points.push({ x, y });
      }

      return points;
    }

    function generateEllipsePoints(centerX, centerY, xRadiusX, xRadiusY, yRadiusX, yRadiusY, spacing = 10) {
      // Calculate the x and y radii based on the distances from the center to the two radius-defining points
      const xRadius = Math.sqrt(Math.pow(xRadiusX - centerX, 2) + Math.pow(xRadiusY - centerY, 2));
      const yRadius = Math.sqrt(Math.pow(yRadiusX - centerX, 2) + Math.pow(yRadiusY - centerY, 2));

      // Approximate the perimeter of the ellipse for dynamic point calculation
      const perimeter = Math.PI * (3 * (xRadius + yRadius) - Math.sqrt((3 * xRadius + yRadius) * (xRadius + 3 * yRadius)));
      const numPoints = Math.max(20, Math.round(perimeter / spacing)); // Ensure a minimum of 20 points for smoothness

      let points = [];
      for (let i = 0; i <= numPoints; i++) {
          const angle = (2 * Math.PI * i) / numPoints;
          const x = centerX + xRadius * Math.cos(angle);
          const y = centerY + yRadius * Math.sin(angle);
          points.push({ x, y });
      }

      return points;
    }

    function deleteAllPoints() {
      points = [];
      updatePointsList();
      redraw();
    }

    function resetPoints() {
      points = [];
      updatePointsList();
      redraw();
    }

    function resetAll() {
      resetPoints();
      shapeSelector.value = '';
      maxPoints = 0;
    }

    function exportPoints() {
      // Prepare CSV header
      let csvContent = "point,x,y\n";
  
      // Add each point to the CSV content
      points.forEach((point, index) => {
          csvContent += `${index + 1},${point.x.toFixed(5)},${point.y.toFixed(5)}\n`;
      });
  
      // Create a downloadable link for the CSV file
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "points.csv");
      document.body.appendChild(link);
  
      // Trigger the download
      link.click();
  
      // Remove the link after download
      document.body.removeChild(link);
    }

    function exportForOpenSCAD() {
      // Prepare OpenSCAD points format
      let openSCADContent = "[";
      points.forEach((point, index) => {
          openSCADContent += `[${point.x.toFixed(5)}, ${point.y.toFixed(5)}]`;
          if (index < points.length - 1) {
              openSCADContent += ", ";
          }
      });
      openSCADContent += "];";

      // Create a downloadable link for the TXT file
      const encodedUri = encodeURI("data:text/plain;charset=utf-8," + openSCADContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "points_for_openscad.txt");
      document.body.appendChild(link);

      // Trigger the download
      link.click();

      // Remove the link after download
      document.body.removeChild(link);
    }

    let showGrid = false; // Track grid visibility state

    function toggleGrid() {
        showGrid = !showGrid; // Toggle the grid state
        redraw(); // Redraw the canvas to reflect the current grid state
    }

    function createGrid() {

      if (!showGrid) return; // Don't draw the grid if it's hidden

      const rows = 10;
      const cols = 10;
      const rowSpacing = canvas.height / rows;
      const colSpacing = canvas.width / cols;
  
      // Draw horizontal lines
      for (let i = 1; i < rows; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * rowSpacing);
          ctx.lineTo(canvas.width, i * rowSpacing);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.stroke();
      }
  
      // Draw vertical lines
      for (let j = 1; j < cols; j++) {
          ctx.beginPath();
          ctx.moveTo(j * colSpacing, 0);
          ctx.lineTo(j * colSpacing, canvas.height);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.stroke();
      }
    } 


   canvas.addEventListener('mousedown', (event) => {
    if (maxPoints === null || points.length < maxPoints) {

        const { x, y } = getMousePos(event);

        addPoint(x,y);
        updatePointsList();
        redraw();

        if (shapeSelector.value === 'circle' && points.length === 3) {
            generateCirclePoints();
        }

        if (shapeSelector.value === 'arc' && points.length === 3) {
            // Use generateArcPoints for arc creation after three clicks
            const arcPoints = generateArcPoints(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y);
            points = arcPoints; // Replace points array with calculated arc points
            redraw(); // Clear previous points from the image
            updatePointsList();
        }
        if (shapeSelector.value === 'major-arc' && points.length === 3) {
            // Major Arc
            const arcPoints = generateMajorArcPoints(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y);
            points = arcPoints;
            redraw();
            updatePointsList();
        }

        if (shapeSelector.value === 'ellipse' && points.length === 3) {
            // Ellipse generation
            const ellipsePoints = generateEllipsePoints(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y);
            points = ellipsePoints;
            redraw();
            updatePointsList();
        }

    } else if (maxPoints > 0) {
        alert(`Maximum points for a ${shapeSelector.value} are already selected.`);
    }
  });


  function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y };
  }


  // Attach functions to window for global access
  window.toggleGrid = toggleGrid;
  window.deleteAllPoints = deleteAllPoints;
  window.exportPoints = exportPoints;
  window.exportForOpenSCAD = exportForOpenSCAD;

});