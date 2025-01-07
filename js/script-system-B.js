document.addEventListener('DOMContentLoaded', () => {
    const imageContainer = document.getElementById('image-container');
    const image = document.getElementById('image');
    const noImageMessage = document.getElementById('no-image-message');
    const imageLoader = document.getElementById('imageLoader');
    const selectModeButton = document.getElementById('selectMode');
    const adjustModeButton = document.getElementById('adjustMode');
    const generatePointsButton = document.getElementById('generatePoints');
    const clearPointsButton = document.getElementById('clearPoints');
    const exportButton = document.getElementById('export');

    let points = [];
    let densePoints = [];
    let draggingPointIndex = null;
    let mode = ''; // Modes: 'select', 'adjust', 'generate'

    // Dynamically create canvas and position it over the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    imageContainer.appendChild(canvas);

    // Load and display the image
    imageLoader.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target.result;
            image.style.display = 'block';
            noImageMessage.style.display = 'none';
        };
        reader.readAsDataURL(file);

        image.onload = () => {
            // Adjust canvas size to match the image
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            canvas.style.width = `${image.width}px`;
            canvas.style.height = `${image.height}px`;
            redraw();
            selectModeButton.disabled = false;
        };
    });

    // Point Selection Mode
    selectModeButton.addEventListener('click', () => {
        mode = 'select';
        adjustModeButton.disabled = false;
        generatePointsButton.disabled = true;
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
            redraw();
        }
    });

    canvas.addEventListener('mouseup', () => {
        draggingPointIndex = null;
    });

    // Export points
    exportButton.addEventListener('click', () => {
        const csvData = densePoints.map((p) => `${p.x},${p.y}`).join('\n');
        const blob = new Blob([csvData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'points.csv';
        link.click();
    });

    // Redraw the canvas
    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        drawPoints();
        drawBezierCurve();
    }

    // Draw all points
    function drawPoints() {
        points.forEach((point, index) => {
            ctx.beginPath();

            // Highlight dominant points
            if (index === 0 || index === points.length - 1 || isDominantPoint(index)) {
                ctx.fillStyle = 'yellow'; // Dominant points
                ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
            } else {
                ctx.fillStyle = 'red'; // Regular points
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            }

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
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Get mouse position relative to canvas
    function getMousePos(event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        return { x, y };
    }

    // Find the index of the point being dragged
    function getDraggingPointIndex(x, y) {
        return points.findIndex((point) => Math.hypot(point.x - x, point.y - y) < 10);
    }

    // Generate smooth points along the Bezier curve
    function generateSmoothPoints() {
        densePoints = [];
        const step = 0.01; // Smaller step = denser points

        for (let t = 0; t <= 1; t += step) {
            const point = getBezierPoint(points, t);
            densePoints.push(point);
        }

        // Display dense points on the canvas
        densePoints.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'green';
            ctx.fill();
        });

        console.log('Dense Points:', densePoints);
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
});
