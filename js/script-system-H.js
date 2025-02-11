const svg = d3.select("#canvas");
let points = [];
let draggedPoint = null;

const imageLoader = document.getElementById("imageLoader");
let img = null;
let imgElement = null;

// Load image
imageLoader.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        if (imgElement) imgElement.remove();
        img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            imgElement = svg.append("image")
                .attr("href", img.src)
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 800)
                .attr("height", 600);
        };
    };
    reader.readAsDataURL(file);
});

svg.on("click", function (event) {
    const coords = d3.pointer(event);
    addPoint(coords[0], coords[1]);
});

function addPoint(x, y) {
    points.push({ x, y });
    drawCanvas();
}

function drawCanvas() {
    svg.selectAll("circle, path, .control-polygon").remove();

    if (points.length > 1) {
        svg.append("path")
            .datum(points)
            .attr("class", "control-polygon")
            .attr("d", d3.line().x(d => d.x).y(d => d.y));
    }

    svg.selectAll(".control-point")
        .data(points)
        .enter()
        .append("circle")
        .attr("class", "control-point")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .call(d3.drag()
            .on("start", dragStart)
            .on("drag", dragging)
            .on("end", dragEnd)
        );

    drawSplineCurve();
}

function drawSplineCurve() {
    if (points.length < 4) return; // Ensure enough points to form a curve

    const lineGenerator = d3.line()
        .curve(d3.curveBasis)
        .x(d => d.x)
        .y(d => d.y);

    const pathData = lineGenerator(points);

    // Ensure pathData is valid before proceeding
    if (!pathData) {
        console.error("Invalid path data. Skipping drawing.");
        return;
    }

    // Create a hidden path element to extract dense points
    const tempPath = svg.append("path")
        .attr("d", pathData)
        .attr("fill", "none")
        .attr("stroke", "none")
        .node(); // Get the raw DOM node

    if (!tempPath) {
        console.error("Path element creation failed.");
        return;
    }

    const pathLength = tempPath.getTotalLength();
    const totalSamples = 100; // Number of points to sample
    densePoints = []; // Reset dense points array

    try {
        for (let i = 0; i <= totalSamples; i++) {
            const point = tempPath.getPointAtLength((i / totalSamples) * pathLength);
            densePoints.push({ x: point.x, y: point.y });
        }
    } catch (error) {
        console.error("Error extracting dense points:", error);
        return;
    }

    // Remove the temporary path
    d3.select(tempPath).remove();

    // Draw dense points
    svg.selectAll(".dense-point").remove(); // Clear old points
    svg.selectAll(".dense-point")
        .data(densePoints)
        .enter()
        .append("circle")
        .attr("class", "dense-point")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 3)
        .attr("fill", "blue");
}

function dragStart(event, d) {
    draggedPoint = d;
}

function dragging(event, d) {
    d.x = event.x;
    d.y = event.y;
    drawCanvas();
}

function dragEnd() {
    draggedPoint = null;
}

function deleteAllPoints() {
    points = [];
    densePoints = [];
    drawCanvas();
}

function exportData() {    

    if (points.length < 4) {
        explanation = "No curve is drawn yet. Please select at least 4 points.";
        document.getElementById("explanationArea").value = explanation;
        return;
    }

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
}
