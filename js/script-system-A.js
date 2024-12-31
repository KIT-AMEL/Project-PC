document.addEventListener('DOMContentLoaded', () => {

    const imageContainer = document.getElementById('image-container');
    const image = document.getElementById('image');
    const noImageMessage = document.getElementById('no-image-message');
    const shapeSelector = document.getElementById('shape-selector');
    const pointsList = document.getElementById('points-list');
    let points = [];
    let maxPoints = 0;

    // Attach functions to window for global access
    window.deleteAllPoints = deleteAllPoints;
    window.exportPoints = exportPoints;
    window.exportForOpenSCAD = exportForOpenSCAD;
    window.toggleGrid = toggleGrid;

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

    document.getElementById('file-input').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            resetAll();
            image.src = URL.createObjectURL(file);
            image.style.display = 'block';
            noImageMessage.style.display = 'none';
        }
    });

    imageContainer.addEventListener('click', (e) => {
        if (maxPoints === null || points.length < maxPoints) {
            const rect = imageContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            addPoint(x, y);
            displayPointOnImage(x, y);
            updatePointsList();

            if (shapeSelector.value === 'circle' && points.length === 3) {
                generateCirclePoints();
            }

	    if (shapeSelector.value === 'arc' && points.length === 3) {
                // Use generateArcPoints for arc creation after three clicks
                const arcPoints = generateArcPoints(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y);
                points = arcPoints; // Replace points array with calculated arc points
                refreshPointsOnImage(); // Clear previous points from the image
                arcPoints.forEach(pt => displayPointOnImage(pt.x, pt.y)); // Display arc points
                updatePointsList();
            }
	    if (shapeSelector.value === 'major-arc' && points.length === 3) {
                // Major Arc
                const arcPoints = generateMajorArcPoints(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y);
                points = arcPoints;
                refreshPointsOnImage();
                arcPoints.forEach(pt => displayPointOnImage(pt.x, pt.y));
                updatePointsList();
            }

	    if (shapeSelector.value === 'ellipse' && points.length === 3) {
                // Ellipse generation
                const ellipsePoints = generateEllipsePoints(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y);
                points = ellipsePoints;
                refreshPointsOnImage();
                ellipsePoints.forEach(pt => displayPointOnImage(pt.x, pt.y));
                updatePointsList();
            }

        } else if (maxPoints > 0) {
            alert(`Maximum points for a ${shapeSelector.value} are already selected.`);
        }
    });

    function addPoint(x, y) {
        points.push({ x, y });
    }

    function displayPointOnImage(x, y) {
        const pointElem = document.createElement('div');
        pointElem.classList.add('point');
        pointElem.style.left = `${x}px`;
        pointElem.style.top = `${y}px`;
        imageContainer.appendChild(pointElem);
    }

    function updatePointsList() {
        pointsList.innerHTML = '';
        points.forEach((point, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('point-item');
            listItem.textContent = `Point ${index + 1}: (${point.x.toFixed(0)}, ${point.y.toFixed(0)})`;

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
            refreshPointsOnImage();
        }
    }

    function deletePoint(index) {
        points.splice(index, 1);
        updatePointsList();
        refreshPointsOnImage();
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
        refreshPointsOnImage();

        // Generate and display final circle points
    	for (let i = 0; i < numPoints; i++) {
     	    const angle = (2 * Math.PI * i) / numPoints;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            addPoint(x, y);
            displayPointOnImage(x, y);
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
        refreshPointsOnImage();
    }

    function refreshPointsOnImage() {
        const pointElems = imageContainer.querySelectorAll('.point');
        pointElems.forEach(point => point.remove());
        points.forEach(point => displayPointOnImage(point.x, point.y));
    }

    function resetPoints() {
        points = [];
        updatePointsList();
        refreshPointsOnImage();
    }

    function resetAll() {
        resetPoints();
        shapeSelector.value = '';
        maxPoints = 0;
        noImageMessage.style.display = 'block';
        image.style.display = 'none';
    }

    function exportPoints() {
        // Prepare CSV header
        let csvContent = "point,x,y\n";
    
        // Add each point to the CSV content
        points.forEach((point, index) => {
            csvContent += `${index + 1},${point.x.toFixed(0)},${point.y.toFixed(0)}\n`;
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
            openSCADContent += `[${point.x.toFixed(0)}, ${point.y.toFixed(0)}]`;
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

    function createGrid() {
    	const gridContainer = document.createElement('div');
    	gridContainer.id = 'grid';

    	const rows = 10; // Adjust the number of rows as needed
    	const cols = 10; // Adjust the number of columns as needed

    	// Horizontal lines
    	for (let i = 1; i < rows; i++) {
            const horizontalLine = document.createElement('div');
            horizontalLine.classList.add('grid-line', 'horizontal-line');
            horizontalLine.style.top = `${(i * 100) / rows}%`;
            gridContainer.appendChild(horizontalLine);
    	}

    	// Vertical lines
    	for (let j = 1; j < cols; j++) {
            const verticalLine = document.createElement('div');
            verticalLine.classList.add('grid-line', 'vertical-line');
            verticalLine.style.left = `${(j * 100) / cols}%`;
            gridContainer.appendChild(verticalLine);
        }

    	imageContainer.appendChild(gridContainer);
    }

    function toggleGrid() {
    	const grid = document.getElementById('grid');
    	const isChecked = document.getElementById('show-grid').checked;
    	grid.style.display = isChecked ? 'block' : 'none';
    }

   // Call createGrid once when the script loads
   createGrid();

});