document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imageLoader = document.getElementById('imageLoader');
    const selectModeButton = document.getElementById('selectMode');
    const adjustModeButton = document.getElementById('adjustMode');
    const generatePointsButton = document.getElementById('generatePoints');
    const clearPointsButton = document.getElementById('clearPoints');
    const exportButton = document.getElementById('export');

    let img = new Image();
    let imgScale = 1;
    let imgOffsetX = 0;
    let imgOffsetY = 0;
    let points = [];
    let densePoints = [];
    let draggingPointIndex = null;
    let mode = ''; // Modes: 'select', 'adjust', 'generate'

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
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        imgScale = Math.min(scaleX, scaleY);

        imgOffsetX = (canvas.width - img.width * imgScale) / 2;
        imgOffsetY = (canvas.height - img.height * imgScale) / 2;

        redraw();
        selectModeButton.disabled = false;
      };
    });

    // Point Selection Mode
    selectModeButton.addEventListener('click', () => {
      mode = 'select';
      adjustModeButton.disabled = false;
      generatePointsButton.disabled = false;
      exportButton.disabled = true;
    });

    // Adjust Mode
    adjustModeButton.addEventListener('click', () => {
      mode = 'adjust';
      generatePointsButton.disabled = false;
    });

    // Generate Points Mode
    generatePointsButton.addEventListener('click', () => {
      mode = 'generate';
      generateSmoothPoints();
      exportButton.disabled = false;
    });

    // Clear Points
    clearPointsButton.addEventListener('click', () => {
      points = [];
      densePoints = [];
      clearPointsButton.disabled = true;
      adjustModeButton.disabled = true;
      generatePointsButton.disabled = true;
      exportButton.disabled = true;
      redraw();
    });

    // Add or drag points based on the mode
    canvas.addEventListener('mousedown', (event) => {
      const { x, y } = getMousePos(event);

      if (mode === 'select') {
        points.push({ x, y });
        clearPointsButton.disabled = false;
        redraw();
      } else if (mode === 'adjust') {
        draggingPointIndex = getDraggingPointIndex(x, y);
      }
    });

    canvas.addEventListener('mousemove', (event) => {
      if (mode === 'adjust' && draggingPointIndex !== null) {
        const { x, y } = getMousePos(event);
        points[draggingPointIndex] = { x, y };
        generateSmoothPoints();
        redraw();
      }
    });

    canvas.addEventListener('mouseup', () => {
      draggingPointIndex = null;
    });

    // Export both control points and dense points
    exportButton.addEventListener('click', () => {
      let csvData = "Type,X,Y\n";

      // Add control points to the CSV
      points.forEach((p) => {
          csvData += `Control,${p.x.toFixed(5)},${p.y.toFixed(5)}\n`;
      });

      // Add dense points to the CSV
      densePoints.forEach((p) => {
          csvData += `Dense,${p.x.toFixed(5)},${p.y.toFixed(5)}\n`;
      });

      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'points.csv';
      link.click();
    });

    // Redraw the canvas
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, imgOffsetX, imgOffsetY, img.width * imgScale, img.height * imgScale);

      drawPoints();
      //drawBezierCurve();

      // Draw dense points dynamically
      densePoints.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
      });
    }

    // Draw all points
    function drawPoints() {
      if (points.length > 1) {
        // Draw a line connecting all points
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y); // Start at the first point
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y); // Connect to the next point
        }
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    
      // Draw each point as a red circle
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
      });
    }

    // Check if a point is dominant
    function isDominantPoint(index) {
      const tValues = [0.25, 0.5, 0.75]; // Key curve intervals
      return tValues.some((t) => {
        const bezierPoint = getBezierPoint(points, t);
        const distance = Math.hypot(bezierPoint.x - points[index].x, bezierPoint.y - points[index].y);
        return distance < 10; // Threshold to consider dominance
      });
    }

    // Draw smooth Bezier curve
    function drawBezierCurve() {
      if (points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        const cpX = (points[i].x + points[i + 1].x) / 2;
        const cpY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, cpX, cpY);
      }

      const lastPoint = points[points.length - 1];
      const secondLastPoint = points[points.length - 2];
      ctx.quadraticCurveTo(secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y);

      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Generate smooth points along the Bezier curve
    function generateSmoothPoints() {
      densePoints = [];
      const step = 0.01; // Smaller step = denser points

      for (let t = 0; t <= 1; t += step) {
        const point = getBezierPoint(points, t);
        densePoints.push(point);
      }
      
      redraw();

      // Display dense points on the canvas
      //densePoints.forEach((p) => {
        //ctx.beginPath();
        //ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        //ctx.fillStyle = 'blue';
        //ctx.fill();
      //});

      //console.log('Dense Points:', densePoints);
    }

    // Calculate Bezier curve point at a given t
    function getBezierPoint(points, t) {
      let x = 0;
      let y = 0;
      const n = points.length - 1;

      points.forEach((point, i) => {
        const binomialCoeff = factorial(n) / (factorial(i) * factorial(n - i));
        const basis = binomialCoeff * Math.pow(1 - t, n - i) * Math.pow(t, i);
        x += basis * point.x;
        y += basis * point.y;
      });

      return { x, y };
    }

    function factorial(num) {
      return num <= 1 ? 1 : num * factorial(num - 1);
    }

    // Get mouse position relative to canvas
    function getMousePos(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y };
    }

    // Find the index of the point being dragged
    function getDraggingPointIndex(x, y) {
      return points.findIndex((point) => Math.hypot(point.x - x, point.y - y) < 10);
    }
});