// Global selections and variables
const svg = d3.select("#canvas");
let cycles = [];             // Array of finalized cycles (each with control and dense points)
let currentCyclePoints = []; // Control points for the current (unfinished) cycle
let currentCycleDensePoints = []; // Dense points computed for the current cycle
let totalCycles = parseInt(document.getElementById("totalCycles").value, 10) || 1;
let currentCycleIndex = 0;   // 0-based index for the current cycle

let img = null, imgElement = null;

// Update totalCycles when the input changes.
document.getElementById("totalCycles").addEventListener("change", function () {
  totalCycles = parseInt(this.value, 10) || 1;
  updateCycleInfo();
});

// When the dense points count is changed, redraw the current cycle (if any)
document.getElementById("densePointsCount").addEventListener("input", function () {
  // Only update the current cycle if there are control points present
  if (currentCyclePoints.length > 0) {
    drawCanvas();
  }
});

// Update the cycle info display.
function updateCycleInfo() {
    const cycleInfo = document.getElementById("cycleInfo");
    if (currentCycleIndex >= totalCycles) {
      cycleInfo.innerHTML = `All sets completed (${totalCycles} sets)`;
    } else {
      cycleInfo.innerHTML = `Set ${currentCycleIndex + 1} of ${totalCycles}`;
    }
}

// --- Image Loader ---
const imageLoader = document.getElementById("imageLoader");
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

// --- Canvas Click Handler ---
// Simply adds a new control point for the current cycle.
svg.on("click", function (event) {
  if (currentCycleIndex >= totalCycles) return;
  const coords = d3.pointer(event);
  addPoint(coords[0], coords[1]);
});

// Add a control point and redraw.
function addPoint(x, y) {
  currentCyclePoints.push({ x, y });
  drawCanvas();
}

// --- Drawing Functions ---
function drawCanvas() {
  // Clear current drawings from the current cycle (but do not remove finalized cycles).
  svg.selectAll("circle, path, .control-polygon, .dense-point, .all-dense-point").remove();

  // Draw the control polygon if there are at least two points.
  if (currentCyclePoints.length > 1) {
    svg.append("path")
      .datum(currentCyclePoints)
      .attr("class", "control-polygon")
      .attr("d", d3.line().x(d => d.x).y(d => d.y));
  }

  // Draw the control points.
  svg.selectAll(".control-point")
    .data(currentCyclePoints)
    .enter()
    .append("circle")
    .attr("class", "control-point")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 5)
    .attr("fill", "red")
    .call(d3.drag()
            .on("start", dragStart)
            .on("drag", dragging)
            .on("end", dragEnd)
    );

  // Draw the spline (dense points) if there are enough control points.
  drawSplineCurve(currentCyclePoints);
}

// Draw a B‑spline (using a basis curve) and sample dense points.
function drawSplineCurve(pointsArray) {
  if (pointsArray.length < 4) {
    currentCycleDensePoints = [];
    return;
  }

  const lineGenerator = d3.line()
      .curve(d3.curveBasis)
      .x(d => d.x)
      .y(d => d.y);

  const pathData = lineGenerator(pointsArray);
  if (!pathData) {
    console.error("Invalid path data.");
    return;
  }

  // Create a temporary (hidden) path for sampling.
  const tempPath = svg.append("path")
      .attr("d", pathData)
      .attr("fill", "none")
      .attr("stroke", "none")
      .node();

  if (!tempPath) {
    console.error("Failed to create temporary path.");
    return;
  }

  const pathLength = tempPath.getTotalLength();
  // Use the current value from the UI.
  const densePointsInput = document.getElementById("densePointsCount");
  const totalSamples = densePointsInput ? parseInt(densePointsInput.value, 10) : 100;
  let densePoints = [];

  try {
    for (let i = 0; i <= totalSamples; i++) {
      const point = tempPath.getPointAtLength((i / totalSamples) * pathLength);
      densePoints.push({ x: point.x, y: point.y });
    }
  } catch (error) {
    console.error("Error extracting dense points:", error);
    return;
  }

  d3.select(tempPath).remove(); // Clean up the temporary path.

  // Draw the dense points.
  svg.selectAll(".dense-point")
    .data(densePoints)
    .enter()
    .append("circle")
    .attr("class", "dense-point")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 3)
    .attr("fill", "blue");

  // Update the current cycle's dense points.
  currentCycleDensePoints = densePoints;
}

// --- Drag Handlers ---
function dragStart(event, d) { }
function dragging(event, d) {
  d.x = event.x;
  d.y = event.y;
  drawCanvas();
}
function dragEnd(event, d) {
  drawCanvas();
}

// --- Button Handlers ---

// Finalize the current cycle.
function cycleDone() {
  if (currentCycleIndex >= totalCycles) {
    alert("All sets are already completed.");
    return;
  }

  // Warn if too few points have been drawn.
  if (currentCyclePoints.length < 4) {
    if (!confirm("Not enough points to form a spline. Complete this set anyway?")) {
      return;
    }
  }

  // Save the current cycle’s data.
  cycles.push({
    controlPoints: [...currentCyclePoints],
    densePoints: [...currentCycleDensePoints]
  });

  currentCycleIndex++;
  updateCycleInfo();

  // Prepare the new current cycle.
  const reuseCheckbox = document.getElementById("reuseLast");
  if (currentCycleIndex < totalCycles && reuseCheckbox.checked && cycles[currentCycleIndex - 1].controlPoints.length > 0) {
    // Start the new cycle with the last control point of the previous cycle.
    const lastPoint = cycles[currentCycleIndex - 1].controlPoints.slice(-1)[0];
    currentCyclePoints = [{ x: lastPoint.x, y: lastPoint.y }];
  } else {
    currentCyclePoints = [];
  }
  currentCycleDensePoints = [];
  
  // Clear the drawing area (finalized cycles remain saved).
  svg.selectAll("circle, path, .control-polygon, .dense-point, .all-dense-point").remove();

  if (currentCycleIndex >= totalCycles) {
    alert("All sets are completed.");
  } else {
    alert("Set completed. Begin drawing for the next set.");
    drawCanvas();
  }
}

// "Show All Dense Points" overlays all dense points (from finished cycles and the current cycle) in green.
function showAllDensePoints() {
  svg.selectAll(".all-dense-point").remove();
  let allDensePoints = [];

  cycles.forEach(cycle => {
    allDensePoints = allDensePoints.concat(cycle.densePoints);
  });
  if (currentCycleDensePoints.length > 0) {
    allDensePoints = allDensePoints.concat(currentCycleDensePoints);
  }

  svg.selectAll(".all-dense-point")
    .data(allDensePoints)
    .enter()
    .append("circle")
    .attr("class", "all-dense-point")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 3)
    .attr("fill", "blue");
}

// "Delete All" clears only the current (unfinished) cycle.
// If continuity is enabled and a finalized cycle exists, it adds the last control point
// from the most recent finalized cycle back into the new current cycle.
function deleteAllPoints() {
  currentCyclePoints = [];
  currentCycleDensePoints = [];
  const reuseCheckbox = document.getElementById("reuseLast");
  if (reuseCheckbox.checked && cycles.length > 0) {
    const lastCycle = cycles[cycles.length - 1];
    if (lastCycle.controlPoints.length > 0) {
      const lastPoint = lastCycle.controlPoints.slice(-1)[0];
      currentCyclePoints.push({ x: lastPoint.x, y: lastPoint.y });
    }
  }
  drawCanvas();
}

// "Export CSV" generates a CSV file with data from all cycles.
function exportData() {
  let csvData = "Set,Type,X,Y\n";
  
  cycles.forEach((cycle, index) => {
    cycle.controlPoints.forEach(p => {
      csvData += `${index + 1},Control,${p.x.toFixed(5)},${p.y.toFixed(5)}\n`;
    });
    cycle.densePoints.forEach(p => {
      csvData += `${index + 1},Dense,${p.x.toFixed(5)},${p.y.toFixed(5)}\n`;
    });
  });
  
  // Also include data from the current (unfinished) cycle.
  if (currentCyclePoints.length > 0) {
    const index = currentCycleIndex + 1;
    currentCyclePoints.forEach(p => {
      csvData += `${index},Control,${p.x.toFixed(5)},${p.y.toFixed(5)}\n`;
    });
    currentCycleDensePoints.forEach(p => {
      csvData += `${index},Dense,${p.x.toFixed(5)},${p.y.toFixed(5)}\n`;
    });
  }
  
  const blob = new Blob([csvData], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "points.csv";
  link.click();
}
