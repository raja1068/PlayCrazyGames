const canvas = document.getElementById('carromCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const width = 600, height = 600;
const pocketRadius = 20;
const strikerRadius = 12;
const coinRadius = 10;

// Pocket positions (corners and centers of edges)
const pockets = [
    {x: 30, y: 30}, {x: width/2, y: 30}, {x: width-30, y: 30},
    {x: 30, y: height-30}, {x: width/2, y: height-30}, {x: width-30, y: height-30}
];

// Game objects
let striker = {
