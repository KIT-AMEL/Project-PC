        const svg = d3.select("#canvas");
        let points = [];
        let draggedPoint = null;

        function drawGrid() {
            const grid = svg.append("g").attr("class", "grid");
            for (let x = 0; x <= 600; x += 20) {
                grid.append("line").attr("x1", x).attr("y1", 0).attr("x2", x).attr("y2", 400);
            }
            for (let y = 0; y <= 400; y += 20) {
                grid.append("line").attr("x1", 0).attr("y1", y).attr("x2", 600).attr("y2", y);
            }
        }
        drawGrid();

        function updateInstructions() {
            document.getElementById("instructions").textContent = "Instructions: Click to create at least 4 points. Drag points to adjust the curve dynamically.";
        }

        svg.on("click", function (event) {
            const coords = d3.pointer(event);
            addPoint(coords[0], coords[1]);
            updateInstructions();
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
                    .attr("stroke-width", 1)
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
            if (points.length < 4) return;

            const curveType = document.getElementById("splineSelect").value;
            let lineGenerator;

            if (curveType === "cubicSpline") {
                lineGenerator = d3.line().curve(d3.curveNatural);
            } else if (curveType === "catmullRom") {
                lineGenerator = d3.line().curve(d3.curveCatmullRom);
            } else if (curveType === "bSpline") {
                lineGenerator = d3.line().curve(d3.curveBasis);
            }

            svg.append("path")
                .datum(points)
                .attr("fill", "none")
                .attr("stroke", "blue")
                .attr("stroke-width", 1)
                .attr("d", lineGenerator.x(d => d.x).y(d => d.y));
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
            document.getElementById("explanationArea").value = "";
            drawCanvas();
        }

        function showExplanation() {
            const curveType = document.getElementById("splineSelect").value;
            let explanation = "";
        
            if (points.length < 4) {
                explanation = "No curve is drawn yet. Please select at least 4 points.";
                document.getElementById("explanationArea").value = explanation;
                return;
            }
        
            // Explanation for each spline type
            if (curveType === "cubicSpline") {
                explanation += "Cubic Spline:\n\n";
                explanation += "A cubic spline is a smooth curve where each segment between two consecutive control points is defined by a cubic polynomial of the form:\n";
                explanation += "S(x) = a + bx + cx² + dx³\n";
                
                // Degree explanation
                explanation += "\nDegree of a Cubic Spline:\n\n";
                explanation += "A cubic spline has a degree of 3, meaning each segment of the curve is governed by a cubic equation.\n";

                // Coefficients explanation
                explanation += "\nHow Are the Coefficients (a, b, c, d) Determined?\n\n";
                explanation += "For each segment between two control points P₁(x₁, y₁) and P₂(x₂, y₂), the coefficients are calculated such that:\n";
                explanation += "- The curve passes through both P₁ and P₂.\n";
                explanation += "- The first derivative (slope) is continuous at each internal control point.\n";
                explanation += "- The second derivative (curvature) is also continuous to ensure smoothness.\n";
            } else if (curveType === "catmullRom") {
                explanation += "Catmull-Rom Spline:\n\n";
                explanation += "A Catmull-Rom spline is an interpolating spline that smoothly connects control points using cubic Hermite interpolation.\n";
                explanation += "Each segment between two control points P₁ and P₂ is computed using the equation:\n";
                explanation += "P(t) = 0.5 × (2P₁ + (P₂ - P₀)t + (2P₀ - 5P₁ + 4P₂ - P₃)t² + (-P₀ + 3P₁ - 3P₂ + P₃)t³)\n";
                
                // Degree explanation
                explanation += "\nDegree of a Catmull-Rom Spline:\n\n";
                explanation += "A Catmull-Rom spline is a degree 3 curve, meaning each segment is governed by a cubic equation.\n";

                // Tangents explanation
                explanation += "\nHow Are Tangents Calculated?\n\n";
                explanation += "A key feature of Catmull-Rom splines is that the curve's shape is influenced by tangents at control points.\n";
                explanation += "The tangent at each point is estimated as:\n";
                explanation += "T₁ = 0.5 × (P₂ - P₀)\n";
                explanation += "This ensures smooth transitions between segments without requiring manual tangent specification.\n";
            } else if (curveType === "bSpline") {
                explanation += "B-Spline:\n\n";
                explanation += "A B-Spline (Basis Spline) is a generalization of Bézier curves that provides smooth, flexible curves by blending multiple control points.\n";
                explanation += "A B-Spline curve is computed as:\n";
                explanation += "P(t) = Σ (Nᵢ,ₖ(t) × Pᵢ)\n";
                
                // Degree explanation
                explanation += "\nDegree of a B-Spline:\n\n";
                explanation += "The degree of a B-Spline is defined by the user but is typically 3 (cubic).\n";

                // Basis function explanation
                explanation += "\nWhat Are Basis Functions?\n\n";
                explanation += "Basis functions determine the influence of each control point over a segment of the curve.\n";
                explanation += "The basis function for a B-Spline of degree k is recursively defined as:\n";
                explanation += "Nᵢ,ₖ(t) = [(t - tᵢ) / (tᵢ₊ₖ - tᵢ)] × Nᵢ,ₖ₋₁(t) + [(tᵢ₊ₖ₊₁ - t) / (tᵢ₊ₖ₊₁ - tᵢ₊₁)] × Nᵢ₊₁,ₖ₋₁(t)\n";
            }
        
            // Print control points
            explanation += "\nControl Points (X,Y):\n";
            points.forEach((p, i) => {
                explanation += `${p.x.toFixed(5)}, ${p.y.toFixed(5)}\n`;
            });
        
            // Generate real dense points from the actual spline curve
            explanation += "\nDense Points for Curve (X,Y):\n";
            
            const lineGenerator = d3.line()
                .x(d => d.x)
                .y(d => d.y);
        
            if (curveType === "cubicSpline") {
                lineGenerator.curve(d3.curveNatural);
            } else if (curveType === "catmullRom") {
                lineGenerator.curve(d3.curveCatmullRom);
            } else if (curveType === "bSpline") {
                lineGenerator.curve(d3.curveBasis);
            }
        
            // Generate path string for D3.js
            const pathData = lineGenerator(points);

            // Create a temporary SVG that’s hidden from view
            const tempSvg = d3.select("body")
                .append("svg")
                .attr("width", 0)
                .attr("height", 0)
                .style("position", "absolute")
                .style("left", "-9999px");  // Moves it far off-screen
        
            // Add a hidden path element to extract actual curve points
            const tempPath = tempSvg.append("path")
                .attr("d", pathData)
                .attr("fill", "none")
                .attr("stroke", "none");
        
            const pathLength = tempPath.node().getTotalLength();
            const totalSamples = 100; // Number of points to sample
            const densePoints = [];
        
            for (let i = 0; i <= totalSamples; i++) {
                const point = tempPath.node().getPointAtLength((i / totalSamples) * pathLength);
                densePoints.push({ x: point.x, y: point.y });
            }
        
            // Remove the temporary path from the DOM
            tempSvg.remove();
        
            // Append dense points to the explanation
            densePoints.forEach(p => {
                explanation += `${p.x.toFixed(5)}, ${p.y.toFixed(5)}\n`;
            });

             // 📌 How Dense Points Are Computed (Generic for All Spline Types)
            explanation += "\nHow Are Dense Points Computed?\n\n";
            explanation += "Regardless of the spline type, dense points are generated by sampling the curve at evenly spaced intervals.\n";
            explanation += "The entire curve is treated as an SVG path, and we extract 100 evenly spaced points along its length.\n";
            explanation += "The process works as follows:\n";
            explanation += "- Compute the total path length.\n";
            explanation += "- Sample 100 evenly spaced points along the curve.\n";
            explanation += "This ensures that the generated points follow the actual spline shape.\n\n";
        
            document.getElementById("explanationArea").value = explanation;
        }
        
        
        

        updateInstructions();