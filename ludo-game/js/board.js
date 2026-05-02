/**
 * BOARD MODULE
 * Handles board layout, path definition, and cell rendering
 */

const Board = (function() {
    // Board dimensions
    const BOARD_SIZE = 15;
    
    // Movement Path - 52 cells (0-51) forming complete clockwise loop
    // Starting from Red start cell (row 7, col 1) moving clockwise
    const PATH_COORDINATES = [
        // RED PATH (indices 0-12)
        [7,1], [7,2], [7,3], [7,4], [7,5],  // Red start lane
        [6,5], [5,5], [4,5], [3,5], [2,5], [1,5],  // Up column
        [1,6], [1,7],  // Top row to Green area
        
        // GREEN PATH (indices 13-25)  
        [1,8], [1,9], [1,10], [1,11], [1,12], [1,13],  // Top row
        [2,13], [3,13], [4,13], [5,13], [6,13],  // Down column
        [7,13], [7,12],  // Right side to Yellow area
        
        // YELLOW PATH (indices 26-38)
        [7,11], [7,10], [7,9], [7,8],  // Yellow start lane
        [8,8], [9,8], [10,8], [11,8], [12,8], [13,8],  // Down column
        [13,7], [13,6],  // Bottom row
        
        // BLUE PATH (indices 39-51)
        [13,5], [13,4], [13,3], [13,2], [13,1],  // Bottom row
        [12,1], [11,1], [10,1], [9,1], [8,1],  // Up column
        [7,1]  // Back to start (completes loop)
    ];
    
    // Entry indices for each color (where tokens enter from yard)
    const START_INDEX = {
        red: 0,      // [7,1]
        green: 13,   // [1,8]
        yellow: 26,  // [7,11]
        blue: 39     // [13,4]
    };
    
    // Safe zone indices (star cells where tokens cannot be captured)
    const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];
    
    // Home stretch paths (6 steps to reach center)
    const HOME_STRETCH = {
        red: [[6,1], [5,1], [4,1], [3,1], [2,1], [1,1]],
        green: [[1,7], [1,6], [1,5], [1,4], [1,3], [1,2]],
        yellow: [[8,13], [9,13], [10,13], [11,13], [12,13], [13,13]],
        blue: [[13,7], [13,8], [13,9], [13,10], [13,11], [13,12]]
    };
    
    // Center home triangles (final destination)
    const HOME_TRIANGLE = {
        red: [2,2],
        green: [2,12],
        yellow: [12,12],
        blue: [12,2]
    };
    
    // Yard positions for tokens (2x2 grid inside each colored corner)
    const YARD_POSITIONS = {
        red: [[1,1], [1,2], [2,1], [2,2]],
        green: [[1,12], [1,13], [2,12], [2,13]],
        yellow: [[12,12], [12,13], [13,12], [13,13]],
        blue: [[12,1], [12,2], [13,1], [13,2]]
    };
    
    // Get cell coordinates for a given path index
    function getPathCoordinate(index) {
        if (index < 0 || index >= PATH_COORDINATES.length) return null;
        return PATH_COORDINATES[index];
    }
    
    // Check if a path index is a safe zone
    function isSafeZone(index) {
        return SAFE_INDICES.includes(index);
    }
    
    // Get home stretch coordinate
    function getHomeStretchCoordinate(color, step) {
        if (step < 0 || step >= HOME_STRETCH[color].length) return null;
        return HOME_STRETCH[color][step];
    }
    
    // Get yard position for a token
    function getYardPosition(color, tokenId) {
        return YARD_POSITIONS[color][tokenId];
    }
    
    // Get home triangle position
    function getHomeTrianglePosition(color) {
        return HOME_TRIANGLE[color];
    }
    
    // Render the board grid
    function renderBoard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Apply yard backgrounds (corners)
                if (row < 6 && col < 6) cell.classList.add('yard-red');
                else if (row < 6 && col > 8) cell.classList.add('yard-green');
                else if (row > 8 && col < 6) cell.classList.add('yard-blue');
                else if (row > 8 && col > 8) cell.classList.add('yard-yellow');
                
                // Apply path colors based on path ownership
                for (let i = 0; i < PATH_COORDINATES.length; i++) {
                    const [pr, pc] = PATH_COORDINATES[i];
                    if (pr === row && pc === col) {
                        if (i <= 12) cell.classList.add('path-red');
                        else if (i <= 25) cell.classList.add('path-green');
                        else if (i <= 38) cell.classList.add('path-yellow');
                        else cell.classList.add('path-blue');
                        
                        // Mark safe zones
                        if (SAFE_INDICES.includes(i)) {
                            cell.classList.add('safe-zone');
                        }
                        break;
                    }
                }
                
                // Mark home stretch paths
                for (const [color, positions] of Object.entries(HOME_STRETCH)) {
                    positions.forEach(([hr, hc]) => {
                        if (hr === row && hc === col) {
                            cell.classList.add(`home-path-${color}`);
                        }
                    });
                }
                
                container.appendChild(cell);
            }
        }
    }
    
    // Get DOM cell element
    function getCell(row, col) {
        return document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    }
    
    // Public API
    return {
        BOARD_SIZE,
        PATH_COORDINATES,
        START_INDEX,
        SAFE_INDICES,
        HOME_STRETCH,
        HOME_TRIANGLE,
        YARD_POSITIONS,
        getPathCoordinate,
        isSafeZone,
        getHomeStretchCoordinate,
        getYardPosition,
        getHomeTrianglePosition,
        renderBoard,
        getCell,
        MAIN_PATH_LENGTH: PATH_COORDINATES.length
    };
})();
