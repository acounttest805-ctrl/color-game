// constants.js
export const PLAYER_SPEED = 10;
export const OBJECT_SPEED = 5;

export const stages = [
    null,
    {
        length: 2000,
        spawnInterval: 40,
        obstacleRatio: 0.2,
        colors: { item: '#3498db', obstacle: '#e74c3c' }
    },
    {
        length: 2500,
        spawnInterval: 35,
        obstacleRatio: 0.35,
        colors: { item: '#2ecc71', obstacle: '#f1c40f' }
    },
    {
        length: 3500,
        spawnInterval: 30,
        obstacleRatio: 0.5,
        colors: { item: '#a8d5ba', obstacle: '#d5bba8' }
    },
    {
        length: 4000,
        spawnInterval: 28,
        obstacleRatio: 0.5,
        colors: { item: '#808A70', obstacle: '#9A7C70' }
    }
];