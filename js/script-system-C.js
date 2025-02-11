document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    let points = [];
    let draggedPoint = null;
    let isAdjustMode = false;
    let bezierDegree = 0; // To track the degree of the Bézier curve
    let numPoints = 0; // To track how many points are needed for Bézier Bernstein

    // Attach functions to window for global access
    window.toggleAdjustMode = toggleAdjustMode;
    window.deleteAllPoints = deleteAllPoints;
    window.showExplanation = showExplanation;
    window.updateInstructions = updateInstructions;


    // Event listeners for mouse interactions
    canvas.addEventListener("mousedown", (e) => {
        if (!isAdjustMode) return;
        const { x, y } = getMousePos(canvas, e);
        draggedPoint = findNearbyPoint(x, y);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!isAdjustMode || !draggedPoint) return;
        const { x, y } = getMousePos(canvas, e);
        draggedPoint.x = x;
        draggedPoint.y = y;
        drawCanvas();
    });

    canvas.addEventListener("mouseup", () => {
        draggedPoint = null;
    });

    canvas.addEventListener("click", (e) => {
        if (isAdjustMode) return;
        const { x, y } = getMousePos(canvas, e);
        addPoint(x, y);
        drawCanvas();
    });

    // Function to toggle Adjust Mode
    function toggleAdjustMode() {
        isAdjustMode = !isAdjustMode;
        const adjustButton = document.getElementById("adjustButton");
        adjustButton.textContent = isAdjustMode ? "Disable Adjust Mode" : "Enable Adjust Mode";
    }

    // Add a point to the canvas
    function addPoint(x, y) {
        // Get the selected curve type
        const curveType = document.getElementById("curveSelect").value;

        // Define the number of points allowed based on the selected curve
        if (curveType === "quadraticBezier" && points.length >= 3) return; // Allow only 3 points for Quadratic Bézier
        if (curveType === "cubicBezier" && points.length >= 4) return; // Allow only 4 points for Cubic Bézier
        if (curveType === "bezierBernstein" && points.length >= numPoints) return; // Allow only the degree + 1 points for Bézier Bernstein

        points.push({ x, y });
        updateInstructions();  // Update instructions with remaining points
    }

    // Flag to track if a curve is drawn
    let curveDrawn = false;

    // Main drawing function
    function drawCanvas() {
        // Update curveDrawn flag when a curve is drawn
        const curveType = document.getElementById("curveSelect").value;
        if (curveType === "quadraticBezier" && points.length === 3) {
            curveDrawn = true;
        } else if (curveType === "cubicBezier" && points.length === 4) {
            curveDrawn = true;
        } else if (curveType === "bezierBernstein" && points.length >= 2) {
            curveDrawn = true;
        } else {
            curveDrawn = false;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        //drawAxes();

        // Draw lines connecting the points (to show order)
        if (points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = "red"; // Line color (change if needed)
            ctx.lineWidth = 1; // Line thickness
            ctx.stroke();
        }

        points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
            ctx.stroke();

            //ctx.fillStyle = "black";
            //ctx.fillText(`(${point.x.toFixed(3)}, ${point.y.toFixed(3)})`, point.x + 10, point.y - 10);
        });

        drawSelectedCurve();
    }

    // Draw grid lines
    function drawGrid() {
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= canvas.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= canvas.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    // Draw X and Y axes
    function drawAxes() {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
    }

    // Draw the selected curve based on dropdown selection
    function drawSelectedCurve() {
        const curveType = document.getElementById("curveSelect").value;

        if (curveType === "quadraticBezier") {
            drawQuadraticBezier();
        } else if (curveType === "cubicBezier") {
            drawCubicBezier();
        } else if (curveType === "bezierBernstein") {
            drawBezierBernstein();
        }
    }

    // Function to draw Quadratic Bézier Curve (3 points)
    function drawQuadraticBezier() {
        if (points.length === 3) {
            const [p0, p1, p2] = points;

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // Function to draw Cubic Bézier Curve (4 points)
    function drawCubicBezier() {
        if (points.length === 4) {
            const [p0, p1, p2, p3] = points;

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // Function to draw Bézier Bernstein curve (any degree)
    function drawBezierBernstein() {
        if (points.length < numPoints) {
            return; // Wait until enough points are added
        }

        // Bernstein calculation
        const n = points.length - 1; // Degree of the Bézier curve
        ctx.beginPath();

        for (let t = 0; t <= 1; t += 0.01) {
            let x = 0, y = 0;
            for (let i = 0; i <= n; i++) {
                const b = bernstein(i, n, t);
                x += b * points[i].x;
                y += b * points[i].y;
            }
            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Bernstein basis function
    function bernstein(i, n, t) {
        return factorial(n) / (factorial(i) * factorial(n - i)) * Math.pow(t, i) * Math.pow(1 - t, n - i);
    }

    // Factorial function
    function factorial(n) {
        if (n === 0) return 1;
        let result = 1;
        for (let i = 1; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    // Get mouse position relative to canvas
    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
        };
    }

    // Find a nearby point to drag
    function findNearbyPoint(x, y) {
        return points.find((point) => Math.hypot(point.x - x, point.y - y) < 10);
    }

    // Delete all points
    function deleteAllPoints() {
        points = [];
        curveDrawn = false; // Reset curveDrawn flag when points are deleted
        document.getElementById("explanationArea").value = ""; // Clear the explanation text area
        numPoints = 0;  // Reset the numPoints to 0, so the system knows the points are cleared
        updateInstructions();  // Update instructions with the new state (no points, fresh start)
        drawCanvas();  // Redraw the canvas (clear it)
    }

    // Update instructions based on the selected curve type
    function updateInstructions() {
        const curveType = document.getElementById("curveSelect").value;

        if (curveType === "quadraticBezier") {
            document.getElementById("instructions").textContent = "Instructions: Select 3 points for the Quadratic Bézier Curve. Drag points to adjust the curve dynamically.";
        } else if (curveType === "cubicBezier") {
            document.getElementById("instructions").textContent = "Instructions: Select 4 points for the Cubic Bézier Curve. Drag points to adjust the curve dynamically.";
        } else if (curveType === "bezierBernstein") {
            if (numPoints === 0) { // Ask for degree only once
                const degree = prompt("Enter the degree of the Bézier curve (number of points - 1):");
                numPoints = parseInt(degree) + 1;
            }
            document.getElementById("instructions").textContent = `Instructions: Select ${numPoints} points for Bézier Bernstein Curve. Drag points to adjust the curve dynamically.`;
        }

        // Update label with how many points are needed
        if (points.length < numPoints) {
            document.getElementById("instructions").textContent += ` ${numPoints - points.length} more points needed.`;
        }

        // Reset points when switching curves
        if (points.length >= numPoints) {
            drawCanvas();
        }
    }

    // Function to show explanation when the button is clicked
    function showExplanation() {
        const explanationArea = document.getElementById("explanationArea");

        if (!curveDrawn) {
            // No curve has been drawn yet
            explanationArea.value = "No curve is drawn on the canvas.";
            return;
        }

        // If a curve is drawn, update the explanation
        updateExplanation();  // This will update the explanation area based on the current curve type and points
    }

    // Update the explanation based on the selected curve and the points
    function updateExplanation() {
        const curveType = document.getElementById("curveSelect").value;
        const explanationArea = document.getElementById("explanationArea");

        let explanation = "";

        if (curveType === "quadraticBezier") {
            explanation = "Quadratic Bézier Curve Equation:\n\n";
            explanation += "B(t) = (1 - t)² × P₀ + 2 × (1 - t) × t × P₁ + t² × P₂\n";
            explanation += "\nWhere P₀, P₁, and P₂ are the selected control points, and t is a parameter from 0 to 1.";
            explanation += "\nThe curve is calculated by evaluating the polynomial for multiple t values between 0 and 1, generating the smooth curve.";
            explanation += "\nThe generated curve points are calculated for t values ranging from 0 to 1, with a step size (del t) of 0.01.\n";
            explanation += "\nControl Points (X,Y):\n";
            points.forEach((point, index) => {
                explanation += `${point.x.toFixed(5)}, ${point.y.toFixed(5)}\n`;
            });            
            
            explanation += "\nDense Points for Curve (X,Y):\n";
            for (let t = 0; t <= 1; t += 0.01) {
                const [p0, p1, p2] = points;
                const x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
                const y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;
                explanation += `${x.toFixed(5)}, ${y.toFixed(5)}\n`;
            }

        } else if (curveType === "cubicBezier") {
            explanation = "Cubic Bézier Curve Equation:\n\n";
            explanation += "B(t) = (1 - t)³ × P₀ + 3 × (1 - t)² × t × P₁ + 3 × (1 - t) × t² × P₂ + t³ * P₃\n";
            explanation += "\nWhere P₀, P₁, P₂, and P₃ are the selected control points, and t is a parameter from 0 to 1.";
            explanation += "\nThe curve is calculated by evaluating the polynomial for multiple t values between 0 and 1, generating the smooth curve.";
            explanation += "\nThe generated curve points are calculated for t values ranging from 0 to 1, with a step size (del t) of 0.01.\n";
            explanation += "\nControl Points (X,Y):\n";
            points.forEach((point, index) => {
                explanation += `${point.x.toFixed(5)}, ${point.y.toFixed(5)}\n`;
            });
            
            explanation += "\nDense Points for Curve (X,Y):\n";
            for (let t = 0; t <= 1; t += 0.01) {
                const [p0, p1, p2, p3] = points;
                const x = Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x;
                const y = Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y;
                explanation += `${x.toFixed(5)}, ${y.toFixed(5)}\n`;
            }

        } else if (curveType === "bezierBernstein") {
            //explanation = "Bézier Bernstein Curve Equation (Degree " + (numPoints - 1) + "):\n\n";
            explanation = "Bézier Bernstein Curve Equation:\n\n";
            explanation += "B(t) = Σ C(n, i) × (1 - t)ⁿ⁻ⁱ × tⁱ × Pᵢ\n";
            explanation += "\nWhere C(n, i) is the binomial coefficient, P_i are the control points, and t is a parameter from 0 to 1.";
    	    explanation += "\nThe binomial coefficient C(n, i) is calculated as:\n";
    	    explanation += "\nC(n, i) = n! / (i! × (n - i)!)\n";
    	    explanation += "\nWhere n is the degree of the curve (the number of control points - 1), and i is the index of the control point.\n";
    	    explanation += "\nFor each value of t (from 0 to 1), the corresponding point on the curve is calculated using the Bernstein basis function.\n";
    	    explanation += "The generated curve points are calculated for t values ranging from 0 to 1, with a step size (del t) of 0.01.\n";
            explanation += "\nControl Points (X,Y):\n";
            points.forEach((point, index) => {
                explanation += `${point.x.toFixed(5)}, ${point.y.toFixed(5)}\n`;
            });

            explanation += "\nDense Points for Curve (X,Y):\n";
            for (let t = 0; t <= 1; t += 0.01) {
                let x = 0, y = 0;
                for (let i = 0; i < points.length; i++) {
                    const b = bernstein(i, points.length - 1, t);
                    x += b * points[i].x;
                    y += b * points[i].y;
                }
                explanation += `${x.toFixed(5)}, ${y.toFixed(5)}\n`;
            }
        }

        explanationArea.value = explanation; // Update the explanation in the textarea
    }

    drawCanvas();
});